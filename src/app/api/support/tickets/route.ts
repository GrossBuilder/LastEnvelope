import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";

const VALID_CATEGORIES = ["general", "billing", "technical", "account", "feature", "other"] as const;
const VALID_PRIORITIES = ["low", "normal", "high"] as const;

const ticketSchema = z.object({
  subject: z.string().min(1).max(200),
  category: z.enum(VALID_CATEGORIES),
  message: z.string().min(1).max(5000),
  priority: z.enum(VALID_PRIORITIES).optional().default("normal"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = ticketSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { subject, category, message, priority } = parsed.data;

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: session.user.id!,
        subject,
        category,
        message,
        priority,
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    logger.error({ error }, "Support ticket creation error");
    return NextResponse.json(
      { error: "Failed to create ticket" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tickets = await prisma.supportTicket.findMany({
      where: { userId: session.user.id! },
      include: {
        replies: {
          orderBy: { createdAt: "asc" },
        },
        files: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    logger.error({ error }, "Get tickets error");
    return NextResponse.json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}
