import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// DELETE /api/beneficiaries/[id]/items/[itemId] — unassign vault item
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: beneficiaryId, itemId } = await params;

    // Verify beneficiary ownership
    const beneficiary = await prisma.beneficiary.findFirst({
      where: { id: beneficiaryId, userId: session.user.id },
    });

    if (!beneficiary) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const assignment = await prisma.beneficiaryItem.findFirst({
      where: { id: itemId, beneficiaryId },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    await prisma.beneficiaryItem.delete({ where: { id: itemId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ error }, "Failed to unassign item");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
