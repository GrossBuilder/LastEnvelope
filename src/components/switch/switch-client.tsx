"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  Clock,
  Shield,
  Play,
  Pause,
  Power,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  History,
  Settings,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface SwitchPing {
  id: string;
  sentAt: string;
  respondedAt: string | null;
}

interface SwitchData {
  id: string;
  status: "ACTIVE" | "PAUSED" | "TRIGGERED" | "DISABLED";
  intervalDays: number;
  gracePeriodDays: number;
  lastCheckIn: string;
  nextCheckDate: string;
  pings: SwitchPing[];
}

export default function SwitchClient() {
  const { t } = useI18n();
  const [switchData, setSwitchData] = useState<SwitchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Configure form
  const [showConfigure, setShowConfigure] = useState(false);
  const [intervalDays, setIntervalDays] = useState(30);
  const [gracePeriodDays, setGracePeriodDays] = useState(3);

  // Settings edit
  const [showSettings, setShowSettings] = useState(false);
  const [editInterval, setEditInterval] = useState(30);
  const [editGrace, setEditGrace] = useState(3);

  const fetchSwitch = useCallback(async () => {
    try {
      const res = await fetch("/api/switch");
      const data = await res.json();
      setSwitchData(data.switch);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSwitch();
  }, [fetchSwitch]);

  const handleConfigure = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intervalDays, gracePeriodDays }),
      });
      if (res.ok) {
        await fetchSwitch();
        setShowConfigure(false);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/switch/check-in", { method: "POST" });
      if (res.ok) {
        await fetchSwitch();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (status: "ACTIVE" | "PAUSED" | "DISABLED") => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/switch", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await fetchSwitch();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateSettings = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/switch", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intervalDays: editInterval,
          gracePeriodDays: editGrace,
        }),
      });
      if (res.ok) {
        await fetchSwitch();
        setShowSettings(false);
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 text-zinc-500 animate-spin" />
      </div>
    );
  }

  // ---------- NOT CONFIGURED ----------
  if (!switchData) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
        {!showConfigure ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Bell className="w-12 h-12 text-zinc-600 mb-4" />
            <h2 className="text-xl font-semibold text-zinc-300 mb-2">
              {t.switch.notConfigured}
            </h2>
            <p className="text-zinc-500 text-center max-w-lg mb-8">
              {t.switch.notConfiguredDesc}
            </p>

            <div className="grid sm:grid-cols-3 gap-6 w-full max-w-2xl mb-8">
              <div className="text-center p-4 bg-zinc-800/50 rounded-xl">
                <Clock className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                <p className="text-sm text-zinc-300 font-medium">{t.switch.checkInInterval}</p>
                <p className="text-xs text-zinc-500 mt-1">{t.switch.every7to90}</p>
              </div>
              <div className="text-center p-4 bg-zinc-800/50 rounded-xl">
                <Shield className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-zinc-300 font-medium">{t.switch.gracePeriod}</p>
                <p className="text-xs text-zinc-500 mt-1">{t.switch.grace1to14}</p>
              </div>
              <div className="text-center p-4 bg-zinc-800/50 rounded-xl">
                <Bell className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <p className="text-sm text-zinc-300 font-medium">{t.switch.notifications}</p>
                <p className="text-xs text-zinc-500 mt-1">{t.switch.emailAndSms}</p>
              </div>
            </div>

            <button
              onClick={() => setShowConfigure(true)}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition"
            >
              {t.switch.configureSwitch}
            </button>
          </div>
        ) : (
          /* CONFIGURE FORM */
          <div className="max-w-md mx-auto py-8">
            <h2 className="text-xl font-semibold text-white mb-6">
              {t.switch.configureTitle}
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  {t.switch.intervalLabel}
                </label>
                <input
                  type="range"
                  min={7}
                  max={90}
                  value={intervalDays}
                  onChange={(e) => setIntervalDays(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <div className="flex justify-between text-xs text-zinc-500 mt-1">
                  <span>{t.switch.days7}</span>
                  <span className="text-emerald-400 font-medium text-sm">
                    {intervalDays} {t.switch.days}
                  </span>
                  <span>{t.switch.days90}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  {t.switch.gracePeriodLabel}
                </label>
                <input
                  type="range"
                  min={1}
                  max={14}
                  value={gracePeriodDays}
                  onChange={(e) => setGracePeriodDays(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
                <div className="flex justify-between text-xs text-zinc-500 mt-1">
                  <span>{t.switch.day1}</span>
                  <span className="text-amber-400 font-medium text-sm">
                    {gracePeriodDays} {t.switch.days}
                  </span>
                  <span>{t.switch.days14}</span>
                </div>
              </div>

              <p className="text-xs text-zinc-500">
                {t.switch.reminderText.replace("{interval}", String(intervalDays)).replace("{grace}", String(gracePeriodDays))}
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleConfigure}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition disabled:opacity-50"
                >
                  {actionLoading ? t.switch.saving : t.switch.activateSwitch}
                </button>
                <button
                  onClick={() => setShowConfigure(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white transition"
                >
                  {t.common.cancel}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------- CONFIGURED VIEW ----------
  const now = new Date();
  const nextCheck = new Date(switchData.nextCheckDate);
  const daysUntilCheck = Math.max(
    0,
    Math.ceil((nextCheck.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );
  const isOverdue = now > nextCheck && switchData.status === "ACTIVE";

  const statusConfig = {
    ACTIVE: { color: "text-emerald-400", bg: "bg-emerald-400/10", label: t.switch.statusActive },
    PAUSED: { color: "text-amber-400", bg: "bg-amber-400/10", label: t.switch.statusPaused },
    TRIGGERED: { color: "text-red-400", bg: "bg-red-400/10", label: t.switch.statusTriggered },
    DISABLED: { color: "text-zinc-500", bg: "bg-zinc-500/10", label: t.switch.statusDisabled },
  };

  const sc = statusConfig[switchData.status];

  return (
    <div className="space-y-6">
      {/* Status card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${switchData.status === "ACTIVE" ? "bg-emerald-400 animate-pulse" : switchData.status === "TRIGGERED" ? "bg-red-400 animate-pulse" : "bg-zinc-600"}`} />
            <span className={`text-sm font-medium ${sc.color}`}>{sc.label}</span>
          </div>
          <button
            onClick={() => {
              setEditInterval(switchData.intervalDays);
              setEditGrace(switchData.gracePeriodDays);
              setShowSettings(!showSettings);
            }}
            className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Timer display */}
        {switchData.status === "ACTIVE" && (
          <div className="text-center py-6">
            {isOverdue ? (
              <>
                <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-3" />
                <p className="text-2xl font-bold text-red-400">{t.switch.overdue}</p>
                <p className="text-zinc-500 text-sm mt-1">
                  {t.switch.graceRemaining.replace("{days}", String(switchData.gracePeriodDays))}
                </p>
              </>
            ) : (
              <>
                <p className="text-6xl font-bold text-white mb-2">
                  {daysUntilCheck}
                </p>
                <p className="text-zinc-500 text-sm">
                  {t.switch.daysUntilCheckIn}
                </p>
              </>
            )}

            <button
              onClick={handleCheckIn}
              disabled={actionLoading}
              className="mt-6 px-8 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition disabled:opacity-50 inline-flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              {actionLoading ? t.switch.checkingIn : t.switch.checkInButton}
            </button>
          </div>
        )}

        {switchData.status === "PAUSED" && (
          <div className="text-center py-6">
            <Pause className="w-16 h-16 text-amber-400 mx-auto mb-3" />
            <p className="text-xl font-semibold text-zinc-300">{t.switch.paused}</p>
            <p className="text-zinc-500 text-sm mt-1">
              {t.switch.pausedDesc}
            </p>
          </div>
        )}

        {switchData.status === "TRIGGERED" && (
          <div className="text-center py-6">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-3" />
            <p className="text-xl font-semibold text-red-400">{t.switch.triggered}</p>
            <p className="text-zinc-500 text-sm mt-1">
              {t.switch.triggeredDesc}
            </p>
          </div>
        )}

        {switchData.status === "DISABLED" && (
          <div className="text-center py-6">
            <Power className="w-16 h-16 text-zinc-600 mx-auto mb-3" />
            <p className="text-xl font-semibold text-zinc-400">{t.switch.disabled}</p>
            <p className="text-zinc-500 text-sm mt-1">
              {t.switch.disabledDesc}
            </p>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3 justify-center mt-4 pt-4 border-t border-zinc-800">
          {switchData.status === "ACTIVE" && (
            <button
              onClick={() => handleStatusChange("PAUSED")}
              disabled={actionLoading}
              className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-amber-400 hover:border-amber-400/30 transition text-sm inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Pause className="w-4 h-4" /> {t.switch.pause}
            </button>
          )}
          {switchData.status === "PAUSED" && (
            <button
              onClick={() => handleStatusChange("ACTIVE")}
              disabled={actionLoading}
              className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-emerald-400 hover:border-emerald-400/30 transition text-sm inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Play className="w-4 h-4" /> {t.switch.resume}
            </button>
          )}
          {(switchData.status === "ACTIVE" || switchData.status === "PAUSED") && (
            <button
              onClick={() => handleStatusChange("DISABLED")}
              disabled={actionLoading}
              className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-400/30 transition text-sm inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Power className="w-4 h-4" /> {t.switch.disable}
            </button>
          )}
          {(switchData.status === "DISABLED" || switchData.status === "TRIGGERED") && (
            <button
              onClick={() => handleStatusChange("ACTIVE")}
              disabled={actionLoading}
              className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-emerald-400 hover:border-emerald-400/30 transition text-sm inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Play className="w-4 h-4" /> {t.switch.activate}
            </button>
          )}
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">{t.switch.settings}</h3>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                {t.switch.intervalSetting.replace("{days}", String(editInterval))}
              </label>
              <input
                type="range"
                min={7}
                max={90}
                value={editInterval}
                onChange={(e) => setEditInterval(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                {t.switch.graceSetting.replace("{days}", String(editGrace))}
              </label>
              <input
                type="range"
                min={1}
                max={14}
                value={editGrace}
                onChange={(e) => setEditGrace(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleUpdateSettings}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition disabled:opacity-50 text-sm"
              >
                {t.switch.saveChanges}
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white transition text-sm"
              >
                {t.common.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <Clock className="w-5 h-5 text-amber-400 mb-2" />
          <p className="text-xs text-zinc-500">{t.switch.interval}</p>
          <p className="text-lg font-semibold text-white">
            {switchData.intervalDays} {t.switch.days}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <Shield className="w-5 h-5 text-emerald-400 mb-2" />
          <p className="text-xs text-zinc-500">{t.switch.gracePeriod}</p>
          <p className="text-lg font-semibold text-white">
            {switchData.gracePeriodDays} {t.switch.days}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <CheckCircle className="w-5 h-5 text-blue-400 mb-2" />
          <p className="text-xs text-zinc-500">{t.switch.lastCheckIn}</p>
          <p className="text-lg font-semibold text-white">
            {new Date(switchData.lastCheckIn).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Ping history */}
      {switchData.pings.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-zinc-400" />
            <h3 className="text-lg font-semibold text-white">{t.switch.pingHistory}</h3>
          </div>
          <div className="space-y-2">
            {switchData.pings.map((ping) => (
              <div
                key={ping.id}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-800/50"
              >
                <span className="text-sm text-zinc-400">
                  {new Date(ping.sentAt).toLocaleString()}
                </span>
                {ping.respondedAt ? (
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {t.switch.responded} {new Date(ping.respondedAt).toLocaleString()}
                  </span>
                ) : (
                  <span className="text-xs text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {t.switch.noResponse}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
