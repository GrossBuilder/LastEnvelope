import { prisma } from "@/lib/prisma";
import { UsersClient } from "./users-client";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      plan: true,
      createdAt: true,
      deadManSwitch: {
        select: { status: true },
      },
    },
  });

  const serialized = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    plan: u.plan,
    createdAt: u.createdAt.toISOString(),
    switchStatus: u.deadManSwitch?.status ?? null,
  }));

  return <UsersClient users={serialized} />;
}
