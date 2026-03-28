"use client";

import { useAdminI18n } from "../admin-shell";

interface SwitchData {
  id: string;
  userName: string | null;
  userEmail: string;
  status: string;
  intervalDays: number;
  gracePeriodDays: number;
  lastCheckIn: string | null;
  nextCheckDate: string | null;
  triggered: boolean;
  pingsCount: number;
  lastPing: { sentAt: string; respondedAt: string | null } | null;
}

export function SwitchesClient({ switches }: { switches: SwitchData[] }) {
  const { t } = useAdminI18n();

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      ACTIVE: t.switches.active,
      PAUSED: t.switches.paused,
      TRIGGERED: t.switches.triggered,
      DISABLED: t.switches.disabled,
    };
    return map[status] || status;
  };

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      ACTIVE: "bg-green-500/20 text-green-400",
      PAUSED: "bg-yellow-500/20 text-yellow-400",
      TRIGGERED: "bg-red-500/20 text-red-400",
      DISABLED: "bg-zinc-500/20 text-zinc-400",
    };
    return map[status] || "bg-zinc-500/20 text-zinc-400";
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{t.switches.title}</h1>
        <p className="text-zinc-400 text-sm mt-1">{t.switches.subtitle}</p>
      </div>

      {switches.length === 0 ? (
        <div className="text-center text-zinc-500 py-20">{t.switches.noSwitches}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-zinc-400 text-left">
                <th className="py-3 px-3">{t.switches.user}</th>
                <th className="py-3 px-3">{t.switches.status}</th>
                <th className="py-3 px-3">{t.switches.interval}</th>
                <th className="py-3 px-3">{t.switches.gracePeriod}</th>
                <th className="py-3 px-3">{t.switches.lastCheckIn}</th>
                <th className="py-3 px-3">{t.switches.nextCheck}</th>
                <th className="py-3 px-3">{t.switches.pings}</th>
              </tr>
            </thead>
            <tbody>
              {switches.map((s) => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 px-3">
                    <div className="text-white text-sm">{s.userName || "—"}</div>
                    <div className="text-zinc-500 text-xs">{s.userEmail}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(s.status)}`}>
                      {statusLabel(s.status)}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-zinc-300">
                    {s.intervalDays} {t.switches.days}
                  </td>
                  <td className="py-3 px-3 text-zinc-300">
                    {s.gracePeriodDays} {t.switches.days}
                  </td>
                  <td className="py-3 px-3 text-zinc-400 whitespace-nowrap">
                    {s.lastCheckIn
                      ? new Date(s.lastCheckIn).toLocaleString()
                      : "—"}
                  </td>
                  <td className="py-3 px-3 text-zinc-400 whitespace-nowrap">
                    {s.nextCheckDate
                      ? new Date(s.nextCheckDate).toLocaleString()
                      : "—"}
                  </td>
                  <td className="py-3 px-3 text-zinc-400">{s.pingsCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
