import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (session.user.email !== adminEmail) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { message } = await request.json();
    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Verify ticket exists
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    // Create reply (admin reply has no userId)
    const reply = await prisma.ticketReply.create({
      data: {
        ticketId: id,
        message,
        // userId is null for admin replies
      },
      include: {
        user: { select: { email: true } },
      },
    });

    // Update ticket status to IN_PROGRESS if it was NEW
    if (ticket.status === "NEW") {
      await prisma.supportTicket.update({
        where: { id },
        data: { status: "IN_PROGRESS" },
      });
    }

    return NextResponse.json(reply, { status: 201 });
  } catch (error) {
    logger.error({ error }, "Send reply error");
    return NextResponse.json(
      { error: "Failed to send reply" },
      { status: 500 }
    );
  }
}
