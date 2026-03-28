import Link from "next/link";
import { Shield } from "lucide-react";
import { getDictionary } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";

export default async function NotFound() {
  const locale = await getServerLocale();
  const t = await getDictionary(locale);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <Shield className="w-16 h-16 text-zinc-600 mb-6" />
      <h1 className="text-6xl font-bold text-white mb-2">404</h1>
      <p className="text-xl text-zinc-400 mb-8">{t.notFound.message}</p>
      <Link
        href="/"
        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition font-medium"
      >
        {t.notFound.backHome}
      </Link>
    </div>
  );
}
