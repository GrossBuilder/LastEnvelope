import { prisma } from "@/lib/prisma";
import { AdminDashboardClient } from "./dashboard-client";

export default async function AdminDashboardPage() {
  const [
    totalUsers,
    proUsers,
    proPlusUsers,
    activeSwitches,
    triggeredSwitches,
    totalPayments,
    confirmedPayments,
    recentUsers,
    recentPayments,
    newTickets,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { plan: "PRO" } }),
    prisma.user.count({ where: { plan: "PRO_PLUS" } }),
    prisma.deadManSwitch.count({ where: { status: "ACTIVE" } }),
    prisma.deadManSwitch.count({ where: { status: "TRIGGERED" } }),
    prisma.cryptoPayment.count(),
    prisma.cryptoPayment.aggregate({
      where: { status: "CONFIRMED" },
      _sum: { amountUsdt: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, plan: true, createdAt: true },
    }),
    prisma.cryptoPayment.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { email: true } } },
    }),
    prisma.supportTicket.count({ where: { status: "NEW" } }),
  ]);

  const revenue = Number(confirmedPayments._sum.amountUsdt ?? 0);

  const stats = {
    totalUsers,
    proUsers,
    proPlusUsers,
    freeUsers: totalUsers - proUsers - proPlusUsers,
    activeSwitches,
    triggeredSwitches,
    totalPayments,
    confirmedRevenue: revenue,
    newTickets,
  };

  const serializedUsers = recentUsers.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  const serializedPayments = recentPayments.map((p) => ({
    id: p.id,
    email: p.user.email,
    plan: p.plan,
    amount: Number(p.amountUsdt),
    status: p.status,
    createdAt: p.createdAt.toISOString(),
  }));

  return (
    <AdminDashboardClient
      stats={stats}
      recentUsers={serializedUsers}
      recentPayments={serializedPayments}
    />
  );
}
