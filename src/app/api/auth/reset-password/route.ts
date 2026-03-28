import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { logger } from "@/lib/logger";

const requestSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    const rl = rateLimit(`reset-request:${ip}`, {
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();

    // Always return success to prevent email enumeration
    const successResponse = NextResponse.json({ success: true });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.emailVerified) {
      return successResponse;
    }

    if (!isEmailConfigured()) {
      logger.warn("Email not configured, cannot send reset code");
      return successResponse;
    }

    // Rate limit per email
    const emailRl = rateLimit(`reset-request:${email}`, {
      limit: 3,
      windowMs: 15 * 60 * 1000,
    });
    if (!emailRl.success) {
      return successResponse;
    }

    // Generate 6-digit code
    const code = crypto.randomInt(100000, 999999).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    // Clean up old codes
    await prisma.emailVerification.deleteMany({ where: { email } });

    // Store reset code (reuse EmailVerification table)
    await prisma.emailVerification.create({
      data: { email, code, expires },
    });

    await sendEmail(
      email,
      "LastEnvelope — Password Reset Code",
      `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #18181b; color: #e4e4e7; border-radius: 16px;">
        <h2 style="color: #10b981; margin-bottom: 8px;">LastEnvelope</h2>
        <p>Your password reset code:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 20px; background: #27272a; border-radius: 12px; color: #10b981; margin: 16px 0;">
          ${code}
        </div>
        <p style="color: #a1a1aa; font-size: 14px;">This code expires in 15 minutes. If you didn't request this, please ignore this email.</p>
      </div>
      `
    );

    logger.info({ email }, "Password reset code sent");

    return successResponse;
  } catch (error) {
    logger.error({ error }, "Password reset request failed");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
