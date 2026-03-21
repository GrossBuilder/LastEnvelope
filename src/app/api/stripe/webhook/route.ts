import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

type Plan = "FREE" | "PRO" | "PRO_PLUS";

// POST /api/stripe/webhook — Stripe webhook handler
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan as Plan | undefined;

        if (!userId || !plan) break;

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        await prisma.user.update({
          where: { id: userId },
          data: {
            plan,
            stripeSubscriptionId: subscription.id,
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodEnd: new Date(
              subscription.items.data[0].current_period_end * 1000
            ),
          },
        });

        await prisma.activityLog.create({
          data: {
            userId,
            action: "PLAN_UPGRADED",
            details: `Upgraded to ${plan} plan`,
          },
        });
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const subDetails = invoice.parent?.subscription_details;
        const subscriptionId =
          typeof subDetails?.subscription === "string"
            ? subDetails.subscription
            : subDetails?.subscription?.id ?? null;

        if (!subscriptionId) break;

        const subscription =
          await stripe.subscriptions.retrieve(subscriptionId);

        const user = await prisma.user.findFirst({
          where: { stripeSubscriptionId: subscriptionId },
        });

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              stripeCurrentPeriodEnd: new Date(
                subscription.items.data[0].current_period_end * 1000
              ),
            },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;

        const user = await prisma.user.findFirst({
          where: { stripeSubscriptionId: subscription.id },
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

      case "customer.subscription.updated": {
        const subscription = event.data.object;

        const user = await prisma.user.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (user) {
          const proPriceId = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID;
          const proPlusPriceId = process.env.NEXT_PUBLIC_STRIPE_PRO_PLUS_PRICE_ID;
          const currentPriceId = subscription.items.data[0].price.id;

          let newPlan: Plan = "FREE";
          if (currentPriceId === proPriceId) newPlan = "PRO";
          else if (currentPriceId === proPlusPriceId) newPlan = "PRO_PLUS";

          await prisma.user.update({
            where: { id: user.id },
            data: {
              plan: newPlan,
              stripePriceId: currentPriceId,
              stripeCurrentPeriodEnd: new Date(
                subscription.items.data[0].current_period_end * 1000
              ),
            },
          });
        }
        break;
      }
    }
  } catch (error) {
    logger.error({ error, eventType: event.type }, "Stripe webhook handler failed");
  }

  return NextResponse.json({ received: true });
}
