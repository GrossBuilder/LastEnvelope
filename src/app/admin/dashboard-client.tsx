"use client";

import { useAdminI18n } from "./admin-shell";
import Link from "next/link";
import { Users, CreditCard, ToggleRight, DollarSign, MessageSquare } from "lucide-react";

interface Stats {
  totalUsers: number;
  proUsers: number;
  proPlusUsers: number;
  freeUsers: number;
  activeSwitches: number;
  triggeredSwitches: number;
  totalPayments: number;
  confirmedRevenue: number;
  newTickets: number;
}

interface RecentUser {
  id: string;
  name: string | null;
  email: string;
  plan: string;
  createdAt: string;
}

interface RecentPayment {
  id: string;
  email: string;
  plan: string;
  amount: number;
  status: string;
  createdAt: string;
}

export function AdminDashboardClient({
  stats,
  recentUsers,
  recentPayments,
}: {
  stats: Stats;
  recentUsers: RecentUser[];
  recentPayments: RecentPayment[];
}) {
  const { t } = useAdminI18n();

  const cards = [
    { label: t.dashboard.totalUsers, value: stats.totalUsers, icon: Users, color: "text-blue-400" },
    { label: t.dashboard.proUsers, value: stats.proUsers, icon: Users, color: "text-emerald-400" },
    { label: t.dashboard.proPlus, value: stats.proPlusUsers, icon: Users, color: "text-purple-400" },
    { label: t.dashboard.freeUsers, value: stats.freeUsers, icon: Users, color: "text-zinc-400" },
    { label: t.dashboard.activeSwitches, value: stats.activeSwitches, icon: ToggleRight, color: "text-green-400" },
    { label: t.dashboard.triggeredSwitches, value: stats.triggeredSwitches, icon: ToggleRight, color: "text-red-400" },
    { label: t.dashboard.totalPayments, value: stats.totalPayments, icon: CreditCard, color: "text-yellow-400" },
    { label: t.dashboard.confirmedRevenue, value: `${stats.confirmedRevenue.toFixed(2)} USDT`, icon: DollarSign, color: "text-emerald-400" },
    { label: t.dashboard.newTickets, value: stats.newTickets, icon: MessageSquare, color: "text-orange-400", link: "/admin/support" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">{t.dashboard.title}</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => {
          const content = (
            <div key={card.label} className="bg-zinc-900 border border-white/10 rounded-xl p-5 h-full">
              <div className="flex items-center justify-between mb-3">
                <span className="text-zinc-400 text-sm">{card.label}</span>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          );

          if (card.link) {
            return (
              <Link key={card.label} href={card.link}>
                {content}
              </Link>
            );
          }
          return content;
        })}
      </div>

      {/* Recent data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent users */}
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">{t.dashboard.recentUsers}</h2>
          {recentUsers.length === 0 ? (
            <p className="text-zinc-500">{t.dashboard.noData}</p>
          ) : (
            <div className="space-y-3">
              {recentUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm">{u.name || u.email}</p>
                    <p className="text-zinc-500 text-xs">{u.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-300">
                      {u.plan}
                    </span>
                    <p className="text-zinc-500 text-xs mt-1">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent payments */}
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">{t.dashboard.recentPayments}</h2>
          {recentPayments.length === 0 ? (
            <p className="text-zinc-500">{t.dashboard.noData}</p>
          ) : (
            <div className="space-y-3">
              {recentPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm">{p.email}</p>
                    <p className="text-zinc-500 text-xs">{p.plan}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-mono text-sm">
                      {p.amount.toFixed(2)} USDT
                    </p>
                    <p className="text-zinc-500 text-xs">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
