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

// DELETE /api/admin/users?id=xxx
export async function DELETE(req: NextRequest) {
  const session = await verifyAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const userId = req.nextUrl.searchParams.get("id");
  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "Missing user id" }, { status: 400 });
  }

  // Don't allow deleting yourself
  if (userId === session.user!.id) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  try {
    // Delete all related data first, then user
    await prisma.$transaction(async (tx) => {
      // Find switches to delete their pings
      const switches = await tx.deadManSwitch.findMany({ where: { userId }, select: { id: true } });
      const switchIds = switches.map((s) => s.id);
      if (switchIds.length > 0) {
        await tx.switchPing.deleteMany({ where: { switchId: { in: switchIds } } });
      }
      await tx.deadManSwitch.deleteMany({ where: { userId } });
      await tx.vaultItem.deleteMany({ where: { userId } });
      await tx.beneficiary.deleteMany({ where: { userId } });
      await tx.file.deleteMany({ where: { userId } });
      await tx.cryptoPayment.deleteMany({ where: { userId } });
      await tx.activityLog.deleteMany({ where: { userId } });
      await tx.account.deleteMany({ where: { userId } });
      await tx.session.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });

    logger.info({ adminEmail: session.user!.email, deletedUserId: userId }, "Admin deleted user");

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ error, userId }, "Admin failed to delete user");
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
