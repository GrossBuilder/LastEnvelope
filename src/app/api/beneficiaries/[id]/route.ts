import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateBeneficiarySchema } from "@/lib/validations/beneficiary";
import { logger } from "@/lib/logger";

// GET /api/beneficiaries/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const beneficiary = await prisma.beneficiary.findFirst({
      where: { id, userId: session.user.id },
      include: {
        items: {
          include: {
            vaultItem: { select: { id: true, title: true, type: true } },
          },
        },
      },
    });

    if (!beneficiary) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ beneficiary });
  } catch (error) {
    logger.error({ error }, "Failed to get beneficiary");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/beneficiaries/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.beneficiary.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateBeneficiarySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const beneficiary = await prisma.beneficiary.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone || null }),
        ...(data.relation !== undefined && { relation: data.relation || null }),
      },
      include: {
        items: {
          include: {
            vaultItem: { select: { id: true, title: true, type: true } },
          },
        },
      },
    });

    return NextResponse.json({ beneficiary });
  } catch (error) {
    logger.error({ error }, "Failed to update beneficiary");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/beneficiaries/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.beneficiary.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.beneficiary.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ error }, "Failed to delete beneficiary");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
