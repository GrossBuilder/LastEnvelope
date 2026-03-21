import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6).regex(/^\d{6}$/),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    const rl = rateLimit(`verify:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
    if (!rl.success) {
      return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
    }

    const body = await req.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { email, code } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const verification = await prisma.emailVerification.findFirst({
      where: { email: normalizedEmail },
      orderBy: { createdAt: "desc" },
    });

    if (!verification) {
      return NextResponse.json({ error: "No verification pending" }, { status: 400 });
    }

    if (verification.attempts >= 5) {
      await prisma.emailVerification.delete({ where: { id: verification.id } });
      return NextResponse.json({ error: "Too many attempts. Request a new code." }, { status: 400 });
    }

    if (new Date() > verification.expires) {
      await prisma.emailVerification.delete({ where: { id: verification.id } });
      return NextResponse.json({ error: "Code expired" }, { status: 400 });
    }

    if (verification.code !== code) {
      await prisma.emailVerification.update({
        where: { id: verification.id },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    // Code is valid — verify user email
    await prisma.user.updateMany({
      where: { email: normalizedEmail },
      data: { emailVerified: new Date() },
    });

    // Clean up all verification records for this email
    await prisma.emailVerification.deleteMany({
      where: { email: normalizedEmail },
    });

    logger.info({ email: normalizedEmail }, "Email verified successfully");

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    logger.error({ error }, "Email verification failed");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
