import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Lock, Users, Bell, FileText, Shield, Activity, Paperclip } from "lucide-react";
import Link from "next/link";
import { getDictionary } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const locale = await getServerLocale();
  const t = await getDictionary(locale);
  const userId = session.user.id!;

  const [vaultCount, beneficiaryCount, switchData, user, fileCount] = await Promise.all([
    prisma.vaultItem.count({ where: { userId } }),
    prisma.beneficiary.count({ where: { userId } }),
    prisma.deadManSwitch.findUnique({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { plan: true } }),
    prisma.file.count({ where: { userId } }),
  ]);

  const switchStatus = switchData
    ? switchData.status === "ACTIVE"
      ? `${t.dashboard.active} · ${t.dashboard.nextCheckIn} ${new Date(switchData.nextCheckDate).toLocaleDateString()}`
      : switchData.status
    : t.dashboard.notConfigured;

  const planLimits = {
    FREE: { vault: 5, beneficiaries: 1 },
    PRO: { vault: "∞", beneficiaries: 10 },
    PRO_PLUS: { vault: "∞", beneficiaries: "∞" },
  };
  const plan = user?.plan ?? "FREE";
  const limits = planLimits[plan];

  const modules = [
    {
      title: t.dashboard.moduleVault,
      description: t.dashboard.moduleVaultDesc,
      icon: Lock,
      href: "/vault",
    },
    {
      title: t.dashboard.moduleBeneficiaries,
      description: t.dashboard.moduleBeneficiariesDesc,
      icon: Users,
      href: "/beneficiaries",
    },
    {
      title: t.dashboard.moduleSwitch,
      description: t.dashboard.moduleSwitchDesc,
      icon: Bell,
      href: "/switch",
    },
    {
      title: t.dashboard.moduleFiles,
      description: t.dashboard.moduleFilesDesc,
      icon: Paperclip,
      href: "/files",
    },
    {
      title: t.dashboard.moduleActivity,
      description: t.dashboard.moduleActivityDesc,
      icon: Activity,
      href: "/dashboard/activity",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Welcome */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white">
          {t.dashboard.welcomeBack} {session.user.name || "User"}
        </h1>
        <p className="text-zinc-400 mt-2">
          {t.dashboard.subtitle}
        </p>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span className="text-zinc-400 text-sm">{t.dashboard.vaultItems}</span>
          </div>
          <p className="text-3xl font-bold text-white">{vaultCount}</p>
          <p className="text-xs text-zinc-500 mt-1">{vaultCount} / {limits.vault} {t.dashboard.used}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-blue-400" />
            <span className="text-zinc-400 text-sm">{t.dashboard.beneficiaries}</span>
          </div>
          <p className="text-3xl font-bold text-white">{beneficiaryCount}</p>
          <p className="text-xs text-zinc-500 mt-1">{beneficiaryCount} / {limits.beneficiaries} {t.dashboard.used}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Paperclip className="w-5 h-5 text-purple-400" />
            <span className="text-zinc-400 text-sm">{t.dashboard.files}</span>
          </div>
          <p className="text-3xl font-bold text-white">{fileCount}</p>
          <p className="text-xs text-zinc-500 mt-1">{t.dashboard.encryptedAttachments}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <span className="text-zinc-400 text-sm">{t.dashboard.switchStatus}</span>
          </div>
          <p className={`text-lg font-semibold ${switchData?.status === "ACTIVE" ? "text-emerald-400" : "text-zinc-500"}`}>
            {switchStatus}
          </p>
        </div>
      </div>

      {/* Module cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {modules.map((m) => (
          <Link
            key={m.title}
            href={m.href}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-emerald-800/50 transition group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center group-hover:bg-emerald-950/50 transition">
                <m.icon className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition">
                  {m.title}
                </h3>
                <p className="text-zinc-400 text-sm mt-1">{m.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Plan info */}
      <div className="mt-10 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-400">{t.dashboard.plan}</p>
          <p className="text-xl font-bold text-white">{plan}</p>
          <p className="text-sm text-zinc-500 mt-1">
            {limits.vault} {t.dashboard.vaultItems.toLowerCase()} · {limits.beneficiaries} {t.dashboard.beneficiaries.toLowerCase()}
          </p>
        </div>
        <Link
          href="/pricing"
          className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition"
        >
          {t.dashboard.upgradeToPro}
        </Link>
      </div>
    </div>
  );
}
