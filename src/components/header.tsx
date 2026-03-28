"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, Settings } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "./language-switcher";

export function Header() {
  const { data: session } = useSession();
  const { t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Hide header on admin panel
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const isAdmin = (session?.user as { isAdmin?: boolean } | undefined)?.isAdmin;

  return (
    <header className="border-b border-white/10 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="LastEnvelope" width={180} height={36} priority />
          </Link>

          {/* Desktop */}
          <nav className="hidden md:flex items-center gap-6">
            {session ? (
              <>
                <Link href="/dashboard" className="text-zinc-300 hover:text-white transition">
                  {t.nav.dashboard}
                </Link>
                <Link href="/vault" className="text-zinc-300 hover:text-white transition">
                  {t.nav.vault}
                </Link>
                <Link href="/beneficiaries" className="text-zinc-300 hover:text-white transition">
                  {t.nav.beneficiaries}
                </Link>
                <Link href="/switch" className="text-zinc-300 hover:text-white transition">
                  {t.nav.switch}
                </Link>
                <Link href="/files" className="text-zinc-300 hover:text-white transition">
                  {t.nav.files}
                </Link>
                <Link href="/settings" className="text-zinc-300 hover:text-white transition">
                  {t.nav.settings}
                </Link>
                <Link href="/pricing" className="text-zinc-300 hover:text-white transition">
                  {t.nav.pricing}
                </Link>
                <LanguageSwitcher />
                {/* Hidden admin button */}
                {isAdmin && (
                  <Link
                    href="/admin"
                    title="Admin Panel"
                    className="group relative inline-block opacity-50 hover:opacity-100 transition-opacity"
                  >
                    <Settings className="w-5 h-5 text-zinc-400 hover:text-emerald-500 transition cursor-pointer" />
                    <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-zinc-900 border border-emerald-500/50 rounded px-2 py-1 text-xs text-emerald-400 whitespace-nowrap">
                      Admin Panel
                    </div>
                  </Link>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="ml-4 px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition"
                >
                  {t.common.signOut}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-zinc-300 hover:text-white transition">
                  {t.common.signIn}
                </Link>
                <LanguageSwitcher />
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition font-medium"
                >
                  {t.common.getStarted}
                </Link>
              </>
            )}
          </nav>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-zinc-300"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
                
        {/* Mobile menu */}
        {mobileOpen && (
          <nav className="md:hidden pb-4 flex flex-col gap-3">
            {session ? (
              <>
                <Link href="/dashboard" className="text-zinc-300 hover:text-white" onClick={() => setMobileOpen(false)}>{t.nav.dashboard}</Link>
                <Link href="/vault" className="text-zinc-300 hover:text-white" onClick={() => setMobileOpen(false)}>{t.nav.vault}</Link>
                <Link href="/beneficiaries" className="text-zinc-300 hover:text-white" onClick={() => setMobileOpen(false)}>{t.nav.beneficiaries}</Link>
                <Link href="/switch" className="text-zinc-300 hover:text-white" onClick={() => setMobileOpen(false)}>{t.nav.deadMansSwitch}</Link>
                <Link href="/files" className="text-zinc-300 hover:text-white" onClick={() => setMobileOpen(false)}>{t.nav.files}</Link>
                <Link href="/settings" className="text-zinc-300 hover:text-white" onClick={() => setMobileOpen(false)}>{t.nav.settings}</Link>
                <Link href="/pricing" className="text-zinc-300 hover:text-white" onClick={() => setMobileOpen(false)}>{t.nav.pricing}</Link>
                <div className="py-1"><LanguageSwitcher /></div>
                <button onClick={() => signOut({ callbackUrl: "/" })} className="text-left text-zinc-400 hover:text-white">{t.common.signOut}</button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-zinc-300 hover:text-white" onClick={() => setMobileOpen(false)}>{t.common.signIn}</Link>
                <Link href="/register" className="text-zinc-300 hover:text-white" onClick={() => setMobileOpen(false)}>{t.common.getStarted}</Link>
                <div className="py-1"><LanguageSwitcher /></div>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
