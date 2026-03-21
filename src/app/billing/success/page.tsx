import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { getDictionary } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";

export default async function BillingSuccessPage() {
  const locale = await getServerLocale();
  const t = await getDictionary(locale);

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-6" />
      <h1 className="text-3xl font-bold text-white mb-4">
        {t.billing.successTitle}
      </h1>
      <p className="text-zinc-400 mb-8">
        {t.billing.successDesc}
      </p>
      <Link
        href="/dashboard"
        className="inline-block px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition"
      >
        {t.billing.goToDashboard}
      </Link>
    </div>
  );
}
