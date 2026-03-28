import { prisma } from "@/lib/prisma";
import { TicketsClient } from "@/components/admin/support/tickets-client";

export default async function AdminTicketsPage() {
  const tickets = await prisma.supportTicket.findMany({
    include: {
      user: { select: { email: true, name: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          user: { select: { email: true } },
        },
      },
      files: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Serialize dates for client component
  const serialized = tickets.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    user: {
      ...t.user,
      name: t.user.name ?? undefined,
    },
    replies: t.replies.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      user: r.user ?? undefined,
    })),
  }));

  return (
    <div className="p-6">
      <TicketsClient initialTickets={serialized} />
    </div>
  );
}
