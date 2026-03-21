import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// POST /api/switch/check-in — user confirms they are alive
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

  const existing = await prisma.deadManSwitch.findUnique({
    where: { userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Switch not configured" }, { status: 404 });
  }

  if (existing.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "Switch is not active" },
      { status: 400 }
    );
  }

  const now = new Date();
  const nextCheckDate = new Date(now.getTime() + existing.intervalDays * 24 * 60 * 60 * 1000);

  const updated = await prisma.deadManSwitch.update({
    where: { userId: session.user.id },
    data: {
      lastCheckIn: now,
      nextCheckDate,
    },
  });

  // Log the check-in as a ping
  await prisma.switchPing.create({
    data: {
      switchId: existing.id,
      sentAt: now,
      respondedAt: now,
    },
  });

  return NextResponse.json({
    switch: updated,
    message: "Check-in successful. Timer reset.",
  });
  } catch (error) {
    logger.error({ error }, "Failed to check in");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
