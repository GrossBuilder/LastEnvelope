import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// GET /api/payments/status — check current subscription status
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        plan: true,
        stripeCurrentPeriodEnd: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isActive =
      user.plan !== "FREE" &&
      user.stripeCurrentPeriodEnd &&
      new Date(user.stripeCurrentPeriodEnd) > new Date();

    // Get last confirmed payment
    const lastPayment = await prisma.cryptoPayment.findFirst({
      where: { userId: session.user.id, status: "CONFIRMED" },
      orderBy: { confirmedAt: "desc" },
      select: {
        plan: true,
        amountUsdt: true,
        network: true,
        txHash: true,
        confirmedAt: true,
      },
    });

    return NextResponse.json({
      plan: user.plan,
      isActive,
      expiresAt: user.stripeCurrentPeriodEnd?.toISOString() || null,
      lastPayment,
    });
  } catch (error) {
    logger.error({ error }, "Failed to check payment status");
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    );
  }
}
