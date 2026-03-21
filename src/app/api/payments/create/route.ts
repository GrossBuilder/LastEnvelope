import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  USDT_PLANS,
  SUPPORTED_NETWORKS,
  PAYMENT_WINDOW_MINUTES,
  type PlanType,
  type NetworkType,
} from "@/lib/payments";
import { logger } from "@/lib/logger";

// POST /api/payments/create — create a new USDT payment request
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const plan = body.plan as PlanType;
    const network = (body.network || "TRC20") as NetworkType;

    if (!plan || !USDT_PLANS[plan]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (!SUPPORTED_NETWORKS[network]) {
      return NextResponse.json({ error: "Unsupported network" }, { status: 400 });
    }

    const walletAddress = SUPPORTED_NETWORKS[network].wallet;
    if (!walletAddress) {
      return NextResponse.json(
        { error: "Payment wallet not configured" },
        { status: 503 }
      );
    }

    // Cancel any existing pending payments for this user
    await prisma.cryptoPayment.updateMany({
      where: {
        userId: session.user.id,
        status: "PENDING",
      },
      data: { status: "EXPIRED" },
    });

    const expiresAt = new Date(
      Date.now() + PAYMENT_WINDOW_MINUTES * 60 * 1000
    );

    const payment = await prisma.cryptoPayment.create({
      data: {
        userId: session.user.id,
        plan,
        amountUsdt: USDT_PLANS[plan].priceUsdt,
        network,
        walletAddress,
        expiresAt,
        periodDays: USDT_PLANS[plan].periodDays,
      },
    });

    return NextResponse.json({
      paymentId: payment.id,
      walletAddress,
      amount: Number(payment.amountUsdt),
      network,
      networkName: SUPPORTED_NETWORKS[network].name,
      expiresAt: payment.expiresAt.toISOString(),
      plan: USDT_PLANS[plan].name,
    });
  } catch (error) {
    logger.error({ error }, "Failed to create payment");
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}

// GET /api/payments/create — get user's active or recent payments
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payments = await prisma.cryptoPayment.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        plan: true,
        amountUsdt: true,
        network: true,
        walletAddress: true,
        txHash: true,
        status: true,
        expiresAt: true,
        confirmedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ payments });
  } catch (error) {
    logger.error({ error }, "Failed to fetch payments");
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}
