import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assignItemSchema } from "@/lib/validations/beneficiary";
import { logger } from "@/lib/logger";

// POST /api/beneficiaries/[id]/items — assign a vault item to beneficiary
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: beneficiaryId } = await params;

  // Verify beneficiary ownership
  const beneficiary = await prisma.beneficiary.findFirst({
    where: { id: beneficiaryId, userId: session.user.id },
  });

  if (!beneficiary) {
    return NextResponse.json({ error: "Beneficiary not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = assignItemSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { vaultItemId, note } = parsed.data;

  // Verify vault item ownership
  const vaultItem = await prisma.vaultItem.findFirst({
    where: { id: vaultItemId, userId: session.user.id },
  });

  if (!vaultItem) {
    return NextResponse.json({ error: "Vault item not found" }, { status: 404 });
  }

  // Check if already assigned
  const existing = await prisma.beneficiaryItem.findUnique({
    where: {
      beneficiaryId_vaultItemId: { beneficiaryId, vaultItemId },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Item already assigned to this beneficiary" },
      { status: 409 }
    );
  }

  const assignment = await prisma.beneficiaryItem.create({
    data: {
      beneficiaryId,
      vaultItemId,
      note: note || null,
    },
    include: {
      vaultItem: { select: { id: true, title: true, type: true } },
    },
  });

  return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    logger.error({ error }, "Failed to assign item");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
