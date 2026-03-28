import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

async function verifyAdmin() {
  const session = await auth();
  if (!session?.user) return null;
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || session.user.email !== adminEmail) return null;
  return session;
}

// POST /api/admin/switch — manually trigger a user's switch
export async function POST(req: NextRequest) {
  const session = await verifyAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const userId = body?.userId;
  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    const deadSwitch = await prisma.deadManSwitch.findFirst({
      where: { userId },
    });

    if (!deadSwitch) {
      return NextResponse.json({ error: "No switch configured" }, { status: 404 });
    }

    await prisma.deadManSwitch.update({
      where: { id: deadSwitch.id },
      data: {
        status: "TRIGGERED",
        triggered: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: "SWITCH_TRIGGERED_MANUAL",
        details: `Manually triggered by admin ${session.user!.email}`,
      },
    });

    logger.info(
      { adminEmail: session.user!.email, userId, switchId: deadSwitch.id },
      "Admin manually triggered switch"
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ error, userId }, "Admin failed to trigger switch");
    return NextResponse.json({ error: "Failed to trigger switch" }, { status: 500 });
  }
}
