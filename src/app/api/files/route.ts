import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptAndSaveFile } from "@/lib/file-storage";
import { logger } from "@/lib/logger";

const MAX_FILE_SIZE_FREE = 10 * 1024 * 1024; // 10MB
const MAX_FILE_SIZE_PAID = 100 * 1024 * 1024; // 100MB
const MAX_FILES_FREE = 3;
const MAX_FILES_PRO = 50;

// Total storage limits per plan
const STORAGE_LIMITS = {
  FREE: 50 * 1024 * 1024,       // 50MB
  PRO: 500 * 1024 * 1024,       // 500MB
  PRO_PLUS: 2048 * 1024 * 1024, // 2GB
} as const;

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "application/json",
  "video/mp4",
  "audio/mpeg",
  "audio/mp4",
]);

// GET /api/files — list user files
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const files = await prisma.file.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        originalName: true,
        mimeType: true,
        size: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ files });
  } catch (error) {
    logger.error({ error }, "Failed to list files");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/files — upload a file
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });

    const plan = user?.plan ?? "FREE";

    // Check file count limits
    const fileCount = await prisma.file.count({
      where: { userId: session.user.id },
    });

    const maxFiles = plan === "FREE" ? MAX_FILES_FREE : plan === "PRO" ? MAX_FILES_PRO : Infinity;

    if (fileCount >= maxFiles) {
      return NextResponse.json(
        { error: `File limit reached (${maxFiles}). Upgrade your plan.` },
        { status: 403 }
      );
    }

    // Check total storage usage
    const storageUsed = await prisma.file.aggregate({
      where: { userId: session.user.id },
      _sum: { size: true },
    });
    const totalUsed = storageUsed._sum.size || 0;
    const storageLimit = STORAGE_LIMITS[plan as keyof typeof STORAGE_LIMITS] || STORAGE_LIMITS.FREE;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate MIME type
    const mimeType = file.type || "application/octet-stream";
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        { error: "File type not allowed. Supported: PDF, images, documents, archives, media." },
        { status: 400 }
      );
    }

    // Check file size
    const maxSize = plan === "FREE" ? MAX_FILE_SIZE_FREE : MAX_FILE_SIZE_PAID;

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum: ${maxSize / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // Check total storage limit
    if (totalUsed + file.size > storageLimit) {
      const limitMb = Math.round(storageLimit / (1024 * 1024));
      const usedMb = Math.round(totalUsed / (1024 * 1024));
      return NextResponse.json(
        { error: `Storage limit reached (${usedMb}MB / ${limitMb}MB). Upgrade your plan.` },
        { status: 403 }
      );
    }

    // Validate file name
    const originalName = file.name.replace(/[^a-zA-Z0-9._\-\s]/g, "_");

    const buffer = Buffer.from(await file.arrayBuffer());
    const { storagePath, iv } = await encryptAndSaveFile(buffer, originalName);

    const savedFile = await prisma.file.create({
      data: {
        userId: session.user.id,
        name: originalName,
        originalName: file.name,
        mimeType,
        size: file.size,
        storagePath,
        iv,
      },
      select: {
        id: true,
        name: true,
        originalName: true,
        mimeType: true,
        size: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ file: savedFile }, { status: 201 });
  } catch (error) {
    logger.error({ error }, "Failed to upload file");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
