import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { logger } from "@/lib/logger";

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128)
    .refine(
      (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) && /[0-9]/.test(p),
      { message: "Password must contain uppercase, lowercase, and a number" }
    ),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 5 registrations per IP per 15 minutes
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    const rl = rateLimit(`register:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email: rawEmail, password } = parsed.data;
    const email = rawEmail.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Don't reveal whether email exists — prevents enumeration attacks
      return NextResponse.json(
        { error: "Unable to create account. Please try a different email." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
      },
    });

    // If email service is not configured, auto-verify the user
    if (!isEmailConfigured()) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });

      logger.info({ userId: user.id }, "User registered, auto-verified (email not configured)");

      return NextResponse.json(
        { user: { id: user.id, name: user.name, email: user.email }, needsVerification: false },
        { status: 201 }
      );
    }

    // Generate 6-digit verification code
    const code = crypto.randomInt(100000, 999999).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.emailVerification.create({
      data: { email, code, expires },
    });

    // Send verification email
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

    logger.info({ userId: user.id }, "User registered, verification code sent");

    return NextResponse.json(
      { user: { id: user.id, name: user.name, email: user.email }, needsVerification: true },
      { status: 201 }
    );
  } catch (error) {
    logger.error({ error }, "Registration failed");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
