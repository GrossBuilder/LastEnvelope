import { NextRequest, NextResponse } from "next/server";
import {
  verifyWebhookSignature,
  type LSWebhookEvent,
  LS_PLANS,
} from "@/lib/lemonsqueezy";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

type Plan = "FREE" | "PRO" | "PRO_PLUS";

function resolveVariantToPlan(variantId: number): Plan {
  const vid = String(variantId);
  const proVariants = [
    process.env.LEMONSQUEEZY_PRO_VARIANT_ID,
    process.env.LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID,
  ];
  const proPlusVariants = [
    process.env.LEMONSQUEEZY_PRO_PLUS_VARIANT_ID,
    process.env.LEMONSQUEEZY_PRO_PLUS_YEARLY_VARIANT_ID,
  ];

  if (proVariants.includes(vid)) return "PRO";
  if (proPlusVariants.includes(vid)) return "PRO_PLUS";
  return "FREE";
}

function resolveVariantBilling(variantId: number): string {
  const vid = String(variantId);
  const yearlyVariants = [
    process.env.LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID,
    process.env.LEMONSQUEEZY_PRO_PLUS_YEARLY_VARIANT_ID,
  ];
  return yearlyVariants.includes(vid) ? "annual" : "monthly";
}

function resolvePlanPrice(plan: Plan, billing: string): number {
  if (plan === "PRO") return billing === "annual" ? 49 : 4.99;
  if (plan === "PRO_PLUS") return billing === "annual" ? 99 : 9.99;
  return 0;
}

// POST /api/lemonsqueezy/webhook — LemonSqueezy webhook handler
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: LSWebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName = event.meta.event_name;
  const userId = event.meta.custom_data?.user_id;
  const attrs = event.data.attributes;

  logger.info({ eventName, userId }, "LemonSqueezy webhook received");

  try {
    switch (eventName) {
      case "subscription_created":
      case "subscription_updated": {
        if (!userId) {
          logger.warn("Webhook missing user_id in custom_data");
          break;
        }

        const plan = resolveVariantToPlan(attrs.variant_id);
        const billing = resolveVariantBilling(attrs.variant_id);
        const renewsAt = attrs.renews_at
          ? new Date(attrs.renews_at)
          : null;

        await prisma.user.update({
          where: { id: userId },
          data: {
            plan,
            // Reuse Stripe fields for LemonSqueezy IDs
            stripeCustomerId: String(attrs.customer_id),
            stripeSubscriptionId: String(event.data.id),
            stripePriceId: String(attrs.variant_id),
            stripeCurrentPeriodEnd: renewsAt,
          },
        });

        if (eventName === "subscription_created") {
          const amount = resolvePlanPrice(plan, billing);

          await prisma.cardPayment.create({
            data: {
              userId,
              provider: "lemonsqueezy",
              plan,
              billing,
              amount,
              currency: "USD",
              status: "active",
              subscriptionId: String(event.data.id),
              orderId: attrs.order_id ? String(attrs.order_id) : null,
            },
          });

          await prisma.activityLog.create({
            data: {
              userId,
              action: "PLAN_UPGRADED",
              details: `Upgraded to ${plan} plan via LemonSqueezy`,
            },
          });
        }
        break;
      }

      case "subscription_cancelled":
      case "subscription_expired": {
        // Find user by subscription ID
        const subId = String(event.data.id);
        const user = await prisma.user.findFirst({
          where: { stripeSubscriptionId: subId },
        });

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              plan: "FREE",
              stripeSubscriptionId: null,
              stripePriceId: null,
              stripeCurrentPeriodEnd: null,
            },
          });

          // Update card payment record
          const latestCardPayment = await prisma.cardPayment.findFirst({
            where: { subscriptionId: subId },
            orderBy: { createdAt: "desc" },
          });
          if (latestCardPayment) {
            await prisma.cardPayment.update({
              where: { id: latestCardPayment.id },
              data: { status: eventName === "subscription_cancelled" ? "cancelled" : "expired" },
            });
          }

          await prisma.activityLog.create({
            data: {
              userId: user.id,
              action: "PLAN_DOWNGRADED",
              details: "Subscription cancelled — downgraded to FREE",
            },
          });
        }
        break;
      }

      case "subscription_payment_success": {
        // Renewal — update period end
        const subId = String(event.data.id);
        const renewsAt = attrs.renews_at
          ? new Date(attrs.renews_at)
          : null;

        const user = await prisma.user.findFirst({
          where: { stripeSubscriptionId: subId },
        });

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { stripeCurrentPeriodEnd: renewsAt },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error({ error, eventName }, "LemonSqueezy webhook processing failed");
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
