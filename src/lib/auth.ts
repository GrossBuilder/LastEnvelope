import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = (credentials.email as string).toLowerCase().trim();

        // Rate limit by IP: 30 attempts per 15 minutes
        const ip =
          (req?.headers instanceof Headers
            ? req.headers.get("x-forwarded-for")?.split(",")[0].trim()
            : undefined) || "unknown";
        const ipRl = rateLimit(`login-ip:${ip}`, { limit: 30, windowMs: 15 * 60 * 1000 });
        if (!ipRl.success) {
          logger.warn({ ip }, "Login IP rate limit exceeded");
          throw new Error("Too many login attempts. Please wait 15 minutes.");
        }

        // Rate limit by email: 10 attempts per 15 minutes
        const rl = rateLimit(`login:${email}`, { limit: 10, windowMs: 15 * 60 * 1000 });
        if (!rl.success) {
          logger.warn({ email }, "Login rate limit exceeded");
          throw new Error("Too many login attempts. Please wait 15 minutes.");
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.hashedPassword) {
          logger.info({ email }, "Login failed: user not found");
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.hashedPassword
        );

        if (!isValid) {
          logger.info({ email }, "Login failed: wrong password");
          return null;
        }

        if (!user.emailVerified) {
          logger.info({ email }, "Login failed: email not verified");
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        logger.info({ userId: user.id }, "Login successful");

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.plan = (user as { plan?: string }).plan || "FREE";
      }
      // Refresh plan from DB on session update
      if (trigger === "update" && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { plan: true },
        });
        if (dbUser) token.plan = dbUser.plan;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        (session.user as { plan?: string }).plan = token.plan as string;
      }
      return session;
    },
  },
});
