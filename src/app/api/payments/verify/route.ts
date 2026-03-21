import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyTRC20Transaction } from "@/lib/tron-verify";
import { sendPaymentConfirmation } from "@/lib/notifications";
import { logger } from "@/lib/logger";

// POST /api/payments/verify — submit TX hash and verify payment
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { paymentId, txHash } = body;

    if (!paymentId || !txHash) {
      return NextResponse.json(
        { error: "paymentId and txHash are required" },
        { status: 400 }
      );
    }

    // Validate txHash format (Tron TX hashes are 64 hex characters)
    if (!/^[a-fA-F0-9]{64}$/.test(txHash)) {
      return NextResponse.json(
        { error: "Invalid transaction hash format" },
        { status: 400 }
      );
    }

    // Check if this TX was already used
    const existingTx = await prisma.cryptoPayment.findUnique({
      where: { txHash },
    });
    if (existingTx) {
      return NextResponse.json(
        { error: "This transaction has already been submitted" },
        { status: 409 }
      );
    }

    // Find the pending payment
    const payment = await prisma.cryptoPayment.findFirst({
      where: {
        id: paymentId,
        userId: session.user.id,
        status: "PENDING",
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found or already processed" },
        { status: 404 }
      );
    }

    // Check if payment window expired
    if (new Date() > payment.expiresAt) {
      await prisma.cryptoPayment.update({
        where: { id: payment.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json(
        { error: "Payment window has expired. Please create a new payment." },
        { status: 410 }
      );
    }

    // Mark as submitted with TX hash
    await prisma.cryptoPayment.update({
      where: { id: payment.id },
      data: { txHash, status: "SUBMITTED" },
    });

    // Verify on blockchain
    const result = await verifyTRC20Transaction(
      txHash,
      payment.walletAddress,
      Number(payment.amountUsdt)
    );

    if (!result.valid) {
      // If not enough confirmations — mark CONFIRMING, cron will retry
      const isLowConfirmations =
        result.error?.includes("Not enough confirmations") ||
        (result.confirmations !== undefined && result.confirmations < 20);

      if (isLowConfirmations) {
        await prisma.cryptoPayment.update({
          where: { id: payment.id },
          data: { status: "CONFIRMING" },
        });
        return NextResponse.json({
          status: "CONFIRMING",
          message: "Transaction found but waiting for confirmations. It will be confirmed automatically.",
          confirmations: result.confirmations,
        });
      }

      await prisma.cryptoPayment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      });
      return NextResponse.json(
        {
          error: result.error || "Transaction verification failed",
          status: "FAILED",
        },
        { status: 400 }
      );
    }

    // Payment verified — activate subscription
    const subscriptionEnd = new Date();
    subscriptionEnd.setDate(subscriptionEnd.getDate() + payment.periodDays);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true },
    });

    await prisma.$transaction([
      prisma.cryptoPayment.update({
        where: { id: payment.id },
        data: {
          status: "CONFIRMED",
          confirmedAt: new Date(),
        },
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          plan: payment.plan,
          stripeCurrentPeriodEnd: subscriptionEnd,
        },
      }),
      prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: "PLAN_UPGRADED_CRYPTO",
          details: `Upgraded to ${payment.plan} via ${result.amount} USDT (${payment.network}). TX: ${txHash}. From: ${result.from}`,
        },
      }),
    ]);

    logger.info(
      { userId: session.user.id, plan: payment.plan, txHash, amount: result.amount, from: result.from },
      "Payment confirmed"
    );

    // Send confirmation email (non-blocking)
    if (user?.email) {
      sendPaymentConfirmation(
        user.email,
        user.name,
        payment.plan,
        result.amount!,
        txHash,
        subscriptionEnd
      ).catch((e) => logger.error({ error: e }, "Failed to send payment confirmation email"));
    }

    return NextResponse.json({
      status: "CONFIRMED",
      plan: payment.plan,
      expiresAt: subscriptionEnd.toISOString(),
      amount: result.amount,
      from: result.from,
      confirmations: result.confirmations,
    });
  } catch (error) {
    logger.error({ error }, "Payment verify failed");
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
