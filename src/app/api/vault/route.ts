import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createVaultItemSchema } from "@/lib/validations/vault";
import { logger } from "@/lib/logger";

// GET /api/vault — list all vault items for current user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const items = await prisma.vaultItem.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        type: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ items });
  } catch (error) {
    logger.error({ error, route: "GET /api/vault" }, "Failed to list vault items");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/vault — create a new vault item
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createVaultItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { type, title, encryptedData, iv } = parsed.data;

    // Plan limits: FREE = 5 items
    const count = await prisma.vaultItem.count({
      where: { userId: session.user.id },
    });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });

    const limits = { FREE: 5, PRO: Infinity, PRO_PLUS: Infinity } as const;
    const limit = limits[user?.plan ?? "FREE"];

    if (count >= limit) {
      return NextResponse.json(
        { error: "Vault item limit reached. Upgrade your plan." },
        { status: 403 }
      );
    }

    const item = await prisma.vaultItem.create({
      data: {
        userId: session.user.id,
        type,
        title,
        encryptedData,
        iv,
      },
      select: {
        id: true,
        type: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    logger.error({ error, route: "POST /api/vault" }, "Failed to create vault item");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
