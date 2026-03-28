import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { encryptAndSaveFile, decryptFile, deleteFile } from "@/lib/file-storage";
import { logger } from "@/lib/logger";
import path from "path";

const ALLOWED_EXTENSIONS = new Set([
  "jpg", "jpeg", "png", "gif", "webp", "bmp",
  "pdf", "txt", "doc", "docx", "xls", "xlsx", "csv",
]);

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function getExtension(filename: string): string {
  return (filename.split(".").pop() || "").toLowerCase();
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket || ticket.userId !== session.user.id!) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    // Validate file extension
    const ext = getExtension(file.name);
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: "File type not allowed. Accepted: images, PDF, documents, CSV, TXT" },
        { status: 400 }
      );
    }

    // Encrypt and save to non-public directory
    const buffer = Buffer.from(await file.arrayBuffer());
    const { storagePath, iv } = await encryptAndSaveFile(buffer, file.name);

    const ticketFile = await prisma.ticketFile.create({
      data: {
        ticketId,
        name: path.basename(storagePath),
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        storagePath,
        iv,
      },
    });

    return NextResponse.json(ticketFile, { status: 201 });
  } catch (error) {
    logger.error({ error }, "File upload error");
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Allow admin or ticket owner
    const adminEmail = process.env.ADMIN_EMAIL;
    const isAdmin = session.user.email === adminEmail;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket || (!isAdmin && ticket.userId !== session.user.id!)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Check if requesting a specific file download
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");

    if (fileId) {
      // Serve decrypted file
      const file = await prisma.ticketFile.findUnique({ where: { id: fileId } });
      if (!file || file.ticketId !== ticketId) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }

      const decrypted = await decryptFile(file.storagePath, file.iv || "");
      return new NextResponse(new Uint8Array(decrypted), {
        headers: {
          "Content-Type": file.mimeType || "application/octet-stream",
          "Content-Disposition": `inline; filename="${encodeURIComponent(file.originalName)}"`,
          "Content-Length": String(decrypted.length),
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    // List files
    const files = await prisma.ticketFile.findMany({
      where: { ticketId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(files);
  } catch (error) {
    logger.error({ error }, "Get files error");
    return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId } = await request.json();

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket || ticket.userId !== session.user.id!) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const file = await prisma.ticketFile.findUnique({
      where: { id: fileId },
    });

    if (!file || file.ticketId !== ticketId) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Delete encrypted file from filesystem (path.basename used by deleteFile internally)
    try {
      await deleteFile(file.storagePath);
    } catch (err) {
      logger.error({ err }, "Failed to delete file from filesystem");
    }

    await prisma.ticketFile.delete({ where: { id: fileId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ error }, "Delete file error");
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
}
