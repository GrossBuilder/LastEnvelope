"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminI18n } from "../admin-shell";
import { Trash2, Zap, Search } from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string;
  plan: string;
  createdAt: string;
  switchStatus: string | null;
}

export function UsersClient({ users }: { users: User[] }) {
  const { t } = useAdminI18n();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(search.toLowerCase()))
  );

  const switchStatusLabel = (status: string | null) => {
    if (!status) return t.users.none;
    const map: Record<string, string> = {
      ACTIVE: t.users.active,
      PAUSED: t.users.paused,
      TRIGGERED: t.users.triggered_status,
      DISABLED: t.users.disabled,
    };
    return map[status] || status;
  };

  const switchStatusColor = (status: string | null) => {
    if (!status) return "text-zinc-500";
    const map: Record<string, string> = {
      ACTIVE: "text-green-400",
      PAUSED: "text-yellow-400",
      TRIGGERED: "text-red-400",
      DISABLED: "text-zinc-500",
    };
    return map[status] || "text-zinc-400";
  };

  const handleDelete = async (userId: string) => {
    if (!confirm(t.users.confirmDelete)) return;
    setLoading(userId);
    try {
      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(userId)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || t.users.error);
      }
    } catch {
      alert(t.users.error);
    } finally {
      setLoading(null);
    }
  };

  const handleTrigger = async (userId: string) => {
    if (!confirm(t.users.confirmTrigger)) return;
    setLoading(userId);
    try {
      const res = await fetch("/api/admin/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || t.users.error);
      }
    } catch {
      alert(t.users.error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{t.users.title}</h1>
        <p className="text-zinc-400 text-sm mt-1">{t.users.subtitle}</p>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.users.searchPlaceholder}
          className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-white/10 rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-zinc-500 py-20">{t.users.noUsers}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-zinc-400 text-left">
                <th className="py-3 px-3">{t.users.name}</th>
                <th className="py-3 px-3">{t.users.email}</th>
                <th className="py-3 px-3">{t.users.plan}</th>
                <th className="py-3 px-3">{t.users.registered}</th>
                <th className="py-3 px-3">{t.users.switch}</th>
                <th className="py-3 px-3">{t.users.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 px-3 text-white">{u.name || "—"}</td>
                  <td className="py-3 px-3 text-zinc-300">{u.email}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        u.plan === "PRO_PLUS"
                          ? "bg-purple-500/20 text-purple-400"
                          : u.plan === "PRO"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-zinc-500/20 text-zinc-400"
                      }`}
                    >
                      {u.plan}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-zinc-400 whitespace-nowrap">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className={`py-3 px-3 ${switchStatusColor(u.switchStatus)}`}>
                    {switchStatusLabel(u.switchStatus)}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      {u.switchStatus && u.switchStatus !== "TRIGGERED" && (
                        <button
                          onClick={() => handleTrigger(u.id)}
                          disabled={loading === u.id}
                          className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition disabled:opacity-50"
                          title={t.users.triggerSwitch}
                        >
                          <Zap className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(u.id)}
                        disabled={loading === u.id}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition disabled:opacity-50"
                        title={t.users.deleteUser}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
