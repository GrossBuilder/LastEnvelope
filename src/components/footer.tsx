"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t } = useI18n();
  const { data: session } = useSession();
  const pathname = usePathname();

  // Hide footer on admin panel
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const isAdmin = (session?.user as { isAdmin?: boolean } | undefined)?.isAdmin;

  return (
    <footer className="border-t border-white/10 bg-zinc-950 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="LastEnvelope" width={150} height={30} />
          </div>
          <div className="flex items-center gap-4 text-sm text-zinc-400">
            <Link href="/terms" className="hover:text-white transition">
              {t.footer.terms}
            </Link>
            <span className="text-zinc-700">|</span>
            <Link href="/privacy" className="hover:text-white transition">
              {t.privacy.title}
            </Link>
            <span className="text-zinc-700">|</span>
            <a
              href="mailto:aetheriaarchitect@proton.me"
              className="hover:text-white transition"
            >
              aetheriaarchitect@proton.me
            </a>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-zinc-500 text-sm">
              &copy; {new Date().getFullYear()} LastEnvelope. {t.footer.tagline}
            </p>
            {isAdmin && (
              <Link
                href="/admin"
                className="w-2 h-2 rounded-full bg-zinc-700 hover:bg-emerald-500 transition-colors"
                title="Admin"
              />
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
