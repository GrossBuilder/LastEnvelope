import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { verifyTRC20Transaction } from "@/lib/tron-verify";
import {
  sendPaymentConfirmation,
  sendSubscriptionExpiryReminder,
} from "@/lib/notifications";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

function verifyCronSecret(authHeader: string | null): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || !authHeader) return false;
  const expected = `Bearer ${cronSecret}`;
  if (authHeader.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected));
  } catch {
    return false;
  }
}

// POST /api/cron/payments — automated payment lifecycle management
// Called every 5 minutes via cron. Handles:
//   1. Auto-expire PENDING payments past their window
//   2. Auto-retry verification for SUBMITTED/CONFIRMING payments
//   3. Auto-downgrade users with expired subscriptions
//   4. Send subscription expiry reminders (3 days before)
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    const rl = rateLimit(`cron-payments:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 });
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    if (!verifyCronSecret(req.headers.get("authorization"))) {
      logger.warn({ ip }, "Unauthorized cron/payments attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const results = {
      expired: 0,
      retried: 0,
      confirmed: 0,
      retryFailed: 0,
      downgraded: 0,
      reminders: 0,
    };

    // ── 1. Auto-expire PENDING payments past their window ──

    const expiredResult = await prisma.cryptoPayment.updateMany({
      where: {
        status: "PENDING",
        expiresAt: { lt: now },
      },
      data: { status: "EXPIRED" },
    });
    results.expired = expiredResult.count;

    // ── 2. Auto-retry verification for SUBMITTED/CONFIRMING payments ──
    // These are payments where the user submitted a TX hash but TronGrid
    // hadn't confirmed yet (slow propagation, not enough confirmations)

    const pendingVerification = await prisma.cryptoPayment.findMany({
      where: {
        status: { in: ["SUBMITTED", "CONFIRMING"] },
        txHash: { not: null },
        // Only retry payments created in the last 24h
        createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    });

    for (const payment of pendingVerification) {
      results.retried++;

      try {
        const result = await verifyTRC20Transaction(
          payment.txHash!,
          payment.walletAddress,
          Number(payment.amountUsdt)
        );

        if (result.valid) {
          // Confirmed! Activate subscription
          const subscriptionEnd = new Date();
          subscriptionEnd.setDate(
            subscriptionEnd.getDate() + payment.periodDays
          );

          await prisma.$transaction([
            prisma.cryptoPayment.update({
              where: { id: payment.id },
              data: { status: "CONFIRMED", confirmedAt: now },
            }),
            prisma.user.update({
              where: { id: payment.userId },
              data: {
                plan: payment.plan,
                stripeCurrentPeriodEnd: subscriptionEnd,
              },
            }),
            prisma.activityLog.create({
              data: {
                userId: payment.userId,
                action: "PLAN_UPGRADED_CRYPTO_AUTO",
                details: `Auto-confirmed ${payment.plan} via ${result.amount} USDT (${payment.network}). TX: ${payment.txHash}. From: ${result.from}. Confirmations: ${result.confirmations}`,
              },
            }),
          ]);

          results.confirmed++;

          logger.info(
            {
              userId: payment.userId,
              plan: payment.plan,
              txHash: payment.txHash,
              amount: result.amount,
              from: result.from,
              confirmations: result.confirmations,
            },
            "Payment auto-confirmed by cron"
          );

          // Send confirmation email
          sendPaymentConfirmation(
            payment.user.email,
            payment.user.name,
            payment.plan,
            result.amount!,
            payment.txHash!,
            subscriptionEnd
          ).catch((e) =>
            logger.error({ error: e }, "Failed to send auto-confirm email")
          );
        } else if (
          result.confirmations !== undefined &&
          result.confirmations > 0
        ) {
          // Has some confirmations but not enough — update to CONFIRMING
          await prisma.cryptoPayment.update({
            where: { id: payment.id },
            data: { status: "CONFIRMING" },
          });
        } else {
          // If SUBMITTED for over 2 hours with no confirmations at all — mark FAILED
          const ageHours =
            (Date.now() - payment.createdAt.getTime()) / (1000 * 60 * 60);
          if (ageHours > 2 && payment.status === "SUBMITTED") {
            await prisma.cryptoPayment.update({
              where: { id: payment.id },
              data: { status: "FAILED" },
            });
            results.retryFailed++;

            logger.warn(
              { paymentId: payment.id, txHash: payment.txHash },
              "Payment marked FAILED after 2h with no confirmations"
            );
          }
        }
      } catch (err) {
        logger.error(
          { paymentId: payment.id, error: err },
          "Error retrying payment verification"
        );
      }
    }

    // ── 3. Auto-downgrade expired subscriptions ──

    const expiredUsers = await prisma.user.findMany({
      where: {
        plan: { not: "FREE" },
        stripeCurrentPeriodEnd: { lt: now },
      },
      select: { id: true, email: true, name: true, plan: true },
    });

    for (const user of expiredUsers) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { plan: "FREE" },
        }),
        prisma.activityLog.create({
          data: {
            userId: user.id,
            action: "PLAN_DOWNGRADED_AUTO",
            details: `Subscription expired. Downgraded from ${user.plan} to FREE.`,
          },
        }),
      ]);

      results.downgraded++;
      logger.info(
        { userId: user.id, plan: user.plan },
        "User auto-downgraded"
      );
    }

    // ── 4. Subscription expiry reminders (3 days before) ──

    const reminderWindow = new Date();
    reminderWindow.setDate(reminderWindow.getDate() + 3);
    const reminderWindowEnd = new Date(reminderWindow);
    reminderWindowEnd.setMinutes(reminderWindowEnd.getMinutes() + 5); // 5 min window to avoid duplicates

    const usersNearExpiry = await prisma.user.findMany({
      where: {
        plan: { not: "FREE" },
        stripeCurrentPeriodEnd: {
          gte: reminderWindow,
          lt: reminderWindowEnd,
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        stripeCurrentPeriodEnd: true,
      },
    });

    for (const user of usersNearExpiry) {
      // Check if we already sent a reminder recently
      const recentReminder = await prisma.activityLog.findFirst({
        where: {
          userId: user.id,
          action: "SUBSCRIPTION_EXPIRY_REMINDER",
          createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });

      if (!recentReminder) {
        await prisma.activityLog.create({
          data: {
            userId: user.id,
            action: "SUBSCRIPTION_EXPIRY_REMINDER",
            details: `Reminder sent: ${user.plan} expires on ${user.stripeCurrentPeriodEnd!.toISOString()}`,
          },
        });

        sendSubscriptionExpiryReminder(
          user.email,
          user.name,
          user.plan,
          user.stripeCurrentPeriodEnd!
        ).catch((e) =>
          logger.error({ error: e }, "Failed to send expiry reminder")
        );

        results.reminders++;
      }
    }

    // ── 5. Cleanup: delete old activity logs (>90 days) ──

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    await prisma.activityLog.deleteMany({
      where: { createdAt: { lt: ninetyDaysAgo } },
    });

    logger.info({ results }, "Payment cron completed");

    return NextResponse.json({ ok: true, results });
  } catch (error) {
    logger.error({ error }, "Payment cron failed");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
