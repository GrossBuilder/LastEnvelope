"use client";

import { useSession } from "next-auth/react";
import { Bell, Mail, MessageSquare, Shield, User } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function SettingsClient() {
  const { data: session } = useSession();
  const { t } = useI18n();

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Profile */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <User className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">{t.settings.profile}</h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-zinc-500">{t.common.name}</label>
            <p className="text-white">{session?.user?.name || "—"}</p>
          </div>
          <div>
            <label className="text-xs text-zinc-500">{t.common.email}</label>
            <p className="text-white">{session?.user?.email || "—"}</p>
          </div>
        </div>
      </div>

      {/* Notification preferences */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-semibold text-white">{t.settings.notificationsTitle}</h2>
        </div>
        <p className="text-sm text-zinc-500 mb-4">
          {t.settings.notificationsDesc}
        </p>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-blue-400" />
              <div>
                <p className="text-sm text-zinc-300 font-medium">{t.settings.emailNotifications}</p>
                <p className="text-xs text-zinc-500">{t.settings.emailNotificationsDesc}</p>
              </div>
            </div>
            <div className="w-10 h-6 bg-emerald-600 rounded-full relative cursor-pointer">
              <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1" />
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              <div>
                <p className="text-sm text-zinc-300 font-medium">{t.settings.smsNotifications}</p>
                <p className="text-xs text-zinc-500">{t.settings.smsNotificationsDesc}</p>
              </div>
            </div>
            <div className="w-10 h-6 bg-zinc-700 rounded-full relative cursor-pointer">
              <div className="w-4 h-4 bg-zinc-400 rounded-full absolute left-1 top-1" />
            </div>
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-amber-400" />
              <div>
                <p className="text-sm text-zinc-300 font-medium">{t.settings.beneficiaryNotifications}</p>
                <p className="text-xs text-zinc-500">{t.settings.beneficiaryNotificationsDesc}</p>
              </div>
            </div>
            <div className="w-10 h-6 bg-emerald-600 rounded-full relative cursor-pointer">
              <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-red-400" />
          <h2 className="text-lg font-semibold text-white">{t.settings.security}</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-zinc-800">
            <div>
              <p className="text-sm text-zinc-300 font-medium">{t.settings.changePassword}</p>
              <p className="text-xs text-zinc-500">{t.settings.changePasswordDesc}</p>
            </div>
            <button className="px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white text-sm transition">
              {t.settings.change}
            </button>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm text-zinc-300 font-medium">{t.settings.deleteAccount}</p>
              <p className="text-xs text-zinc-500">{t.settings.deleteAccountDesc}</p>
            </div>
            <button className="px-3 py-1.5 rounded-lg border border-red-800 text-red-400 hover:bg-red-950/50 text-sm transition">
              {t.common.delete}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
