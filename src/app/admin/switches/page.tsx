import { prisma } from "@/lib/prisma";
import { SwitchesClient } from "./switches-client";

export default async function AdminSwitchesPage() {
  const switches = await prisma.deadManSwitch.findMany({
    orderBy: { lastCheckIn: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      pings: {
        orderBy: { sentAt: "desc" },
        take: 3,
      },
    },
  });

  const serialized = switches.map((s) => ({
    id: s.id,
    userName: s.user.name,
    userEmail: s.user.email,
    status: s.status,
    intervalDays: s.intervalDays,
    gracePeriodDays: s.gracePeriodDays,
    lastCheckIn: s.lastCheckIn?.toISOString() ?? null,
    nextCheckDate: s.nextCheckDate?.toISOString() ?? null,
    triggered: s.triggered,
    pingsCount: s.pings.length,
    lastPing: s.pings[0]
      ? {
          sentAt: s.pings[0].sentAt.toISOString(),
          respondedAt: s.pings[0].respondedAt?.toISOString() ?? null,
        }
      : null,
  }));

  return <SwitchesClient switches={serialized} />;
}
