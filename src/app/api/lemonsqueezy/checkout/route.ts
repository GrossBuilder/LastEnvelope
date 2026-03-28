import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createCheckout,
  isLemonSqueezyConfigured,
  LS_PLANS,
  type LSPlanType,
} from "@/lib/lemonsqueezy";
import { logger } from "@/lib/logger";

// POST /api/lemonsqueezy/checkout — create a LemonSqueezy Checkout session
export async function POST(req: NextRequest) {
  try {
    if (!isLemonSqueezyConfigured()) {
      return NextResponse.json(
        { error: "Card payments are not yet available. Please use USDT." },
        { status: 503 }
      );
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const plan = body.plan as LSPlanType;
    const billing = body.billing as "monthly" | "yearly" | undefined;

    if (!plan || !LS_PLANS[plan]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const planConfig = LS_PLANS[plan];
    const variantId =
      billing === "yearly" ? planConfig.yearlyVariantId : planConfig.variantId;

    if (!variantId) {
      return NextResponse.json(
        { error: "Plan variant not configured" },
        { status: 500 }
      );
    }

    const checkoutUrl = await createCheckout({
      variantId,
      userId: session.user.id,
      userEmail: user.email,
      userName: user.name || undefined,
      redirectUrl: `${appUrl}/billing/success`,
      plan,
    });

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    logger.error({ error }, "LemonSqueezy checkout failed");
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
