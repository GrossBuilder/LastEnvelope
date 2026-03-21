import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createBeneficiarySchema } from "@/lib/validations/beneficiary";
import { logger } from "@/lib/logger";

// GET /api/beneficiaries — list all beneficiaries
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const beneficiaries = await prisma.beneficiary.findMany({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            vaultItem: {
              select: { id: true, title: true, type: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ beneficiaries });
  } catch (error) {
    logger.error({ error }, "Failed to list beneficiaries");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/beneficiaries — create a new beneficiary
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createBeneficiarySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Plan limits: FREE = 1, PRO = 10, FAMILY = unlimited
    const count = await prisma.beneficiary.count({
      where: { userId: session.user.id },
    });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });

    const limits = { FREE: 1, PRO: 10, PRO_PLUS: Infinity } as const;
    const limit = limits[user?.plan ?? "FREE"];

    if (count >= limit) {
      return NextResponse.json(
        { error: "Beneficiary limit reached. Upgrade your plan." },
        { status: 403 }
      );
    }

    const { name, email, phone, relation } = parsed.data;

    const beneficiary = await prisma.beneficiary.create({
      data: {
        userId: session.user.id,
        name,
        email,
        phone: phone || null,
        relation: relation || null,
      },
      include: {
        items: {
          include: {
            vaultItem: {
              select: { id: true, title: true, type: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ beneficiary }, { status: 201 });
  } catch (error) {
    logger.error({ error }, "Failed to create beneficiary");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
