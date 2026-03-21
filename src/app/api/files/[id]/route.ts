import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptFile, deleteFile } from "@/lib/file-storage";
import { logger } from "@/lib/logger";

// GET /api/files/[id] — download a file
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

    const file = await prisma.file.findUnique({
      where: { id },
    });

    if (!file || file.userId !== session.user.id) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const decryptedBuffer = await decryptFile(file.storagePath, file.iv);

    logger.info({ userId: session.user.id, fileId: id }, "File downloaded");

    return new NextResponse(new Uint8Array(decryptedBuffer), {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(file.originalName)}"`,
        "Content-Length": decryptedBuffer.length.toString(),
      },
    });
  } catch (error) {
    logger.error({ error }, "File download failed");
    return NextResponse.json({ error: "Failed to download file" }, { status: 500 });
  }
}

// DELETE /api/files/[id] — delete a file
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

    const file = await prisma.file.findUnique({
      where: { id },
    });

    if (!file || file.userId !== session.user.id) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Delete from disk
    try {
      await deleteFile(file.storagePath);
    } catch {
      // File may already be deleted from disk, continue with DB cleanup
    }

    // Delete from DB
    await prisma.file.delete({ where: { id } });

    logger.info({ userId: session.user.id, fileId: id }, "File deleted");

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error({ error }, "File delete failed");
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
}
