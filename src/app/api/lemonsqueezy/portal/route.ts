import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCustomerPortalUrl, isLemonSqueezyConfigured } from "@/lib/lemonsqueezy";
import { logger } from "@/lib/logger";

// POST /api/lemonsqueezy/portal — get LemonSqueezy Customer Portal URL
export async function POST() {
  try {
    if (!isLemonSqueezyConfigured()) {
      return NextResponse.json(
        { error: "Billing portal is not available" },
        { status: 503 }
      );
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No billing account found" },
        { status: 404 }
      );
    }

    const portalUrl = await getCustomerPortalUrl(user.stripeCustomerId);

    return NextResponse.json({ url: portalUrl });
  } catch (error) {
    logger.error({ error }, "LemonSqueezy portal failed");
    return NextResponse.json(
      { error: "Failed to get portal URL" },
      { status: 500 }
    );
  }
}
