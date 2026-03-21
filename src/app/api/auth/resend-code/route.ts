import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

const resendSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    const rl = rateLimit(`resend-code:${ip}`, { limit: 3, windowMs: 15 * 60 * 1000 });
    if (!rl.success) {
      return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
    }

    const body = await req.json();
    const parsed = resendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();

    // Check user exists and is not already verified
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.emailVerified) {
      // Don't reveal whether email exists
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Rate limit per email: 3 resends per 15 minutes
    const emailRl = rateLimit(`resend-code:${email}`, { limit: 3, windowMs: 15 * 60 * 1000 });
    if (!emailRl.success) {
      return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
    }

    // Generate new 6-digit code
    const code = crypto.randomInt(100000, 999999).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Delete old codes for this email
    await prisma.emailVerification.deleteMany({ where: { email } });

    // Create new verification
    await prisma.emailVerification.create({
      data: { email, code, expires },
    });

    // Send email
    const appName = "LastEnvelope";
    await sendEmail(
      email,
      `${appName} — Verification Code`,
      `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #18181b; color: #e4e4e7; border-radius: 16px;">
        <h2 style="color: #10b981; margin-bottom: 8px;">${appName}</h2>
        <p>Your verification code:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 20px; background: #27272a; border-radius: 12px; color: #10b981; margin: 16px 0;">
          ${code}
        </div>
        <p style="color: #a1a1aa; font-size: 14px;">This code expires in 15 minutes. If you didn't request this, please ignore this email.</p>
      </div>
      `
    );

    logger.info({ email }, "Verification code resent");

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    logger.error({ error }, "Resend verification code failed");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
