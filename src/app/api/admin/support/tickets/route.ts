import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

const VALID_STATUSES = ["NEW", "IN_PROGRESS", "RESOLVED", "CLOSED"];

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (session.user.email !== adminEmail) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where =
      status && VALID_STATUSES.includes(status)
        ? { status: status as "NEW" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" }
        : {};

    const tickets = await prisma.supportTicket.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
        replies: {
          orderBy: { createdAt: "asc" },
          include: {
            user: { select: { email: true } },
          },
        },
        files: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    logger.error({ error }, "Get admin tickets error");
    return NextResponse.json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (session.user.email !== adminEmail) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { status, ticketId } = await request.json();
    if (!ticketId) {
      return NextResponse.json(
        { error: "Ticket ID is required" },
        { status: 400 }
      );
    }
    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const ticket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: status as "NEW" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" },
    });

    return NextResponse.json(ticket);
  } catch (error) {
    logger.error({ error }, "Update ticket error");
    return NextResponse.json(
      { error: "Failed to update ticket" },
      { status: 500 }
    );
  }
}
