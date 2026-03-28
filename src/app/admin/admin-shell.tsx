"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, createContext, useContext } from "react";
import { adminDictionaries, AdminDictionary, AdminLocale } from "./i18n";
import { LayoutDashboard, ArrowLeft, X, Users, CreditCard, ToggleRight, MessageSquare } from "lucide-react";
import Image from "next/image";

const AdminI18nContext = createContext<{
  t: AdminDictionary;
  locale: AdminLocale;
  setLocale: (l: AdminLocale) => void;
}>({
  t: adminDictionaries.en,
  locale: "en",
  setLocale: () => {},
});

export const useAdminI18n = () => useContext(AdminI18nContext);

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [locale, setLocale] = useState<AdminLocale>("en");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("admin-locale");
    if (saved === "ru" || saved === "en") setLocale(saved);
  }, []);

  const changeLocale = (l: AdminLocale) => {
    setLocale(l);
    localStorage.setItem("admin-locale", l);
  };

  const t = adminDictionaries[locale];

  const navItems = [
    { href: "/admin", label: t.sidebar.dashboard, icon: LayoutDashboard },
    { href: "/admin/users", label: t.sidebar.users, icon: Users },
    { href: "/admin/payments", label: t.sidebar.payments, icon: CreditCard },
    { href: "/admin/switches", label: t.sidebar.switches, icon: ToggleRight },
    { href: "/admin/support", label: t.sidebar.support, icon: MessageSquare },
  ];

  return (
    <AdminI18nContext.Provider value={{ t, locale, setLocale: changeLocale }}>
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        {/* Top header */}
        <header className="border-b border-white/10 bg-zinc-900">
          <div className="h-16 px-6 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2">
              <Image src="/logo.svg" alt="LastEnvelope" width={160} height={32} priority />
            </Link>
            
            <div className="flex items-center gap-4">
              {/* Language toggle - Circle with EN/RU */}
              <button
                onClick={() => changeLocale(locale === "en" ? "ru" : "en")}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-sm font-bold text-emerald-400 hover:text-emerald-300 transition flex items-center justify-center"
                title={`${t.sidebar.switchLang} ${locale === "en" ? "Русский" : "English"}`}
              >
                {locale.toUpperCase()}
              </button>
              
              {/* Back to app */}
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </header>

        {/* Main content with navigation */}
        <div className="flex-1 flex flex-col">
          {/* Horizontal navigation */}
          <nav className="border-b border-white/10 bg-zinc-900/50 overflow-x-auto">
            <div className="px-6 flex gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-3 text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-colors border-b-2 ${
                      isActive
                        ? "border-emerald-400 text-emerald-400"
                        : "border-transparent text-zinc-400 hover:text-white"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          <main className="flex-1 p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </AdminI18nContext.Provider>
  );
}
