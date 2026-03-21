import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    return NextResponse.json(
      { status: "error", db: "down", uptime: process.uptime() },
      { status: 503 }
    );
  }

  return NextResponse.json({
    status: "ok",
    db: "connected",
    uptime: process.uptime(),
    latency: Date.now() - start,
  });
}
