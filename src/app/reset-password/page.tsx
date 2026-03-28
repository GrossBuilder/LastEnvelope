"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type Step = "email" | "reset" | "done";

export default function ResetPasswordPage() {
  const { t } = useI18n();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t.resetPassword.errorGeneric);
        return;
      }

      setMessage(t.resetPassword.codeSent);
      setStep("reset");
    } catch {
      setError(t.resetPassword.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError(t.resetPassword.errorLength);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t.resetPassword.errorMismatch);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t.resetPassword.errorGeneric);
        return;
      }

      setStep("done");
    } catch {
      setError(t.resetPassword.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-950/50 border border-emerald-800/50 mb-4">
            <Lock className="w-7 h-7 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            {t.resetPassword.title}
          </h1>
          <p className="text-zinc-400 mt-1">{t.resetPassword.subtitle}</p>
        </div>

        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
          {step === "email" && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label
                  htmlFor="reset-email"
                  className="block text-sm font-medium text-zinc-300 mb-1"
                >
                  {t.common.email}
                </label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.resetPassword.emailPlaceholder}
                  className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-medium transition flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading
                  ? t.resetPassword.sending
                  : t.resetPassword.sendCode}
              </button>
            </form>
          )}

          {step === "reset" && (
            <form onSubmit={handleReset} className="space-y-4">
              {message && (
                <p className="text-emerald-400 text-sm">{message}</p>
              )}
              <div>
                <label
                  htmlFor="reset-code"
                  className="block text-sm font-medium text-zinc-300 mb-1"
                >
                  Code
                </label>
                <input
                  id="reset-code"
                  type="text"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="000000"
                  className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-white text-center text-2xl tracking-[0.5em] placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-sm font-medium text-zinc-300 mb-1"
                >
                  {t.resetPassword.newPassword}
                </label>
                <input
                  id="new-password"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t.resetPassword.newPasswordPlaceholder}
                  className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium text-zinc-300 mb-1"
                >
                  {t.resetPassword.confirmNewPassword}
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t.resetPassword.confirmPlaceholder}
                  className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-medium transition flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading
                  ? t.resetPassword.resetting
                  : t.resetPassword.resetButton}
              </button>
            </form>
          )}

          {step === "done" && (
            <div className="text-center py-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <p className="text-white font-medium mb-4">
                {t.resetPassword.success}
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition font-medium"
              >
                {t.resetPassword.backToLogin}
              </Link>
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <Link
            href="/login"
            className="text-zinc-400 hover:text-white transition text-sm inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.resetPassword.backToLogin}
          </Link>
        </div>
      </div>
    </div>
  );
}
