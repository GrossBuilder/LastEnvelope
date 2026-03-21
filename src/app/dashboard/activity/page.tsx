import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";
import {
  Activity,
  Bell,
  Users,
  Zap,
  ArrowUp,
  ArrowDown,
  Clock,
  AlertTriangle,
} from "lucide-react";

const actionIcons: Record<string, typeof Activity> = {
  CHECK_IN_REMINDER_SENT: Bell,
  BENEFICIARY_NOTIFIED: Users,
  SWITCH_TRIGGERED: AlertTriangle,
  PLAN_UPGRADED: ArrowUp,
  PLAN_UPGRADED_CRYPTO: ArrowUp,
  PLAN_UPGRADED_CRYPTO_AUTO: ArrowUp,
  PLAN_DOWNGRADED: ArrowDown,
  PLAN_DOWNGRADED_AUTO: ArrowDown,
  SUBSCRIPTION_EXPIRY_REMINDER: Clock,
};

const actionColors: Record<string, string> = {
  CHECK_IN_REMINDER_SENT: "text-blue-400",
  BENEFICIARY_NOTIFIED: "text-purple-400",
  SWITCH_TRIGGERED: "text-red-400",
  PLAN_UPGRADED: "text-emerald-400",
  PLAN_UPGRADED_CRYPTO: "text-emerald-400",
  PLAN_UPGRADED_CRYPTO_AUTO: "text-emerald-400",
  PLAN_DOWNGRADED: "text-amber-400",
  PLAN_DOWNGRADED_AUTO: "text-amber-400",
  SUBSCRIPTION_EXPIRY_REMINDER: "text-yellow-400",
};

export default async function ActivityPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const locale = await getServerLocale();
  const t = await getDictionary(locale);
  const userId = session.user.id!;

  const logs = await prisma.activityLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const activityT = t.activity as Record<string, string>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">{t.activity.title}</h1>
        <p className="text-zinc-400 mt-2">{t.activity.subtitle}</p>
      </div>

      {logs.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
          <Activity className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-400">
            {t.activity.noActivity}
          </h3>
          <p className="text-zinc-500 text-sm mt-2">
            {t.activity.noActivityDesc}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const Icon = actionIcons[log.action] || Zap;
            const color = actionColors[log.action] || "text-zinc-400";
            const label = activityT[log.action] || log.action;

            return (
              <div
                key={log.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-start gap-4"
              >
                <div
                  className={`w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 ${color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium">{label}</p>
                  {log.details && (
                    <p className="text-zinc-500 text-sm mt-1 truncate">
                      {log.details}
                    </p>
                  )}
                </div>
                <time className="text-zinc-600 text-xs whitespace-nowrap mt-1">
                  {new Date(log.createdAt).toLocaleDateString(locale, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
