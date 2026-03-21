import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendCheckInReminder, notifyBeneficiaries } from "@/lib/notifications";
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

// POST /api/cron/check-switch — called by external cron (e.g., Vercel Cron, GitHub Actions)
// Checks all active switches and triggers overdue ones
export async function POST(req: NextRequest) {
  try {
    // Rate limit: 5 attempts per IP per hour
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    const rl = rateLimit(`cron-switch:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 });
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    if (!verifyCronSecret(req.headers.get("authorization"))) {
      logger.warn({ ip }, "Unauthorized cron/check-switch attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

  const now = new Date();

  // Find all active switches where nextCheckDate has passed
  const overdueSwitches = await prisma.deadManSwitch.findMany({
    where: {
      status: "ACTIVE",
      nextCheckDate: { lte: now },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  const results = {
    checked: overdueSwitches.length,
    graceNotified: 0,
    triggered: 0,
  };

  for (const sw of overdueSwitches) {
    const gracePeriodEnd = new Date(
      sw.nextCheckDate.getTime() + sw.gracePeriodDays * 24 * 60 * 60 * 1000
    );

    if (now >= gracePeriodEnd) {
      // Grace period has also passed — TRIGGER the switch
      await prisma.deadManSwitch.update({
        where: { id: sw.id },
        data: { status: "TRIGGERED" },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: sw.userId,
          action: "SWITCH_TRIGGERED",
          details: `Dead Man's Switch triggered. Grace period ended at ${gracePeriodEnd.toISOString()}.`,
        },
      });

      // Create a ping record for the trigger event
      await prisma.switchPing.create({
        data: {
          switchId: sw.id,
          sentAt: sw.nextCheckDate,
          // respondedAt is null — no response
        },
      });

      // Send notifications to beneficiaries
      await notifyBeneficiaries(sw.userId);

      results.triggered++;
    } else {
      // Still in grace period — send reminder ping
      const existingPing = await prisma.switchPing.findFirst({
        where: {
          switchId: sw.id,
          sentAt: { gte: sw.nextCheckDate },
          respondedAt: null,
        },
      });

      if (!existingPing) {
        await prisma.switchPing.create({
          data: {
            switchId: sw.id,
            sentAt: now,
          },
        });

        // Send reminder notification to user
        await sendCheckInReminder(sw.user);

        results.graceNotified++;
      }
    }
  }

  return NextResponse.json({ ok: true, results });
  } catch (error) {
    logger.error({ error }, "Cron check-switch failed");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
