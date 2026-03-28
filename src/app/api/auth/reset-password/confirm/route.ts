import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const confirmSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6).regex(/^\d{6}$/),
  newPassword: z
    .string()
    .min(8)
    .max(128)
    .refine(
      (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) && /[0-9]/.test(p),
      {
        message:
          "Password must contain uppercase, lowercase, and a number",
      }
    ),
});

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    const rl = rateLimit(`reset-confirm:${ip}`, {
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many attempts" },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = confirmSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email: rawEmail, code, newPassword } = parsed.data;
    const email = rawEmail.toLowerCase().trim();

    const verification = await prisma.emailVerification.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" },
    });

    if (!verification) {
      return NextResponse.json(
        { error: "No reset code found. Please request a new one." },
        { status: 400 }
      );
    }

    if (verification.attempts >= 5) {
      await prisma.emailVerification.delete({
        where: { id: verification.id },
      });
      return NextResponse.json(
        { error: "Too many attempts. Request a new code." },
        { status: 400 }
      );
    }

    if (new Date() > verification.expires) {
      await prisma.emailVerification.delete({
        where: { id: verification.id },
      });
      return NextResponse.json(
        { error: "Code expired" },
        { status: 400 }
      );
    }

    if (!timingSafeEqual(Buffer.from(verification.code), Buffer.from(code))) {
      await prisma.emailVerification.update({
        where: { id: verification.id },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json(
        { error: "Invalid code" },
        { status: 400 }
      );
    }

    // Code valid — update password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.updateMany({
      where: { email },
      data: { hashedPassword },
    });

    // Clean up
    await prisma.emailVerification.deleteMany({ where: { email } });

    // Log the action
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (user) {
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: "PASSWORD_RESET",
          details: "Password was reset via email code",
        },
      });
    }

    logger.info({ email }, "Password reset successful");

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ error }, "Password reset confirmation failed");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
