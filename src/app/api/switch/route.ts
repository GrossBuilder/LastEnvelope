import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { configureSwitchSchema, updateSwitchSchema } from "@/lib/validations/switch";
import { logger } from "@/lib/logger";

// GET /api/switch — get current switch config + recent pings
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deadManSwitch = await prisma.deadManSwitch.findUnique({
      where: { userId: session.user.id },
      include: {
        pings: {
          orderBy: { sentAt: "desc" },
          take: 10,
        },
      },
    });

    return NextResponse.json({ switch: deadManSwitch });
  } catch (error) {
    logger.error({ error }, "Failed to get switch");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/switch — configure switch for the first time
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if already exists
    const existing = await prisma.deadManSwitch.findUnique({
      where: { userId: session.user.id },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Switch already configured. Use PATCH to update." },
        { status: 409 }
      );
    }

    const body = await req.json();
    const parsed = configureSwitchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { intervalDays, gracePeriodDays } = parsed.data;

    // Free plan: only 30-day interval
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });

    if (user?.plan === "FREE" && intervalDays !== 30) {
      return NextResponse.json(
        { error: "Free plan only supports 30-day check-in interval. Upgrade to customize." },
        { status: 403 }
      );
    }

    const now = new Date();
    const nextCheckDate = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

    const deadManSwitch = await prisma.deadManSwitch.create({
      data: {
        userId: session.user.id,
        intervalDays,
        gracePeriodDays,
        lastCheckIn: now,
        nextCheckDate,
      },
    });

    return NextResponse.json({ switch: deadManSwitch }, { status: 201 });
  } catch (error) {
    logger.error({ error }, "Failed to create switch");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/switch — update switch settings
export async function PATCH(req: NextRequest) {
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

    const body = await req.json();
    const parsed = updateSwitchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { intervalDays, gracePeriodDays, status } = parsed.data;

    // Free plan check
    if (intervalDays !== undefined) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { plan: true },
      });

      if (user?.plan === "FREE" && intervalDays !== 30) {
        return NextResponse.json(
          { error: "Free plan only supports 30-day interval." },
          { status: 403 }
        );
      }
    }

    // Recalculate next check date if interval changed
    const newInterval = intervalDays ?? existing.intervalDays;
    const nextCheckDate = intervalDays
      ? new Date(existing.lastCheckIn.getTime() + newInterval * 24 * 60 * 60 * 1000)
      : undefined;

    const deadManSwitch = await prisma.deadManSwitch.update({
      where: { userId: session.user.id },
      data: {
        ...(intervalDays !== undefined && { intervalDays }),
        ...(gracePeriodDays !== undefined && { gracePeriodDays }),
        ...(status !== undefined && { status }),
        ...(nextCheckDate && { nextCheckDate }),
      },
    });

    return NextResponse.json({ switch: deadManSwitch });
  } catch (error) {
    logger.error({ error }, "Failed to update switch");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
