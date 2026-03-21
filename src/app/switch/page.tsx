import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import SwitchClient from "@/components/switch/switch-client";
import { getDictionary } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";

export default async function SwitchPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const locale = await getServerLocale();
  const t = await getDictionary(locale);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">{t.switch.pageTitle}</h1>
        <p className="text-zinc-400 mt-1">{t.switch.pageSubtitle}</p>
      </div>

      <SwitchClient />
    </div>
  );
}
