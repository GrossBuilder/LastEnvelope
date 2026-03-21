"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { Loader2, CheckCircle, MailIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const { t } = useI18n();

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    if (value.length > 1) {
      // Handle paste of full code
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      for (let i = 0; i < 6; i++) {
        newCode[i] = digits[i] || "";
      }
      setCode(newCode);
      const focusIdx = Math.min(digits.length, 5);
      inputRefs.current[focusIdx]?.focus();
      return;
    }
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      const newCode = [...code];
      for (let i = 0; i < 6; i++) {
        newCode[i] = pasted[i] || "";
      }
      setCode(newCode);
      const focusIdx = Math.min(pasted.length, 5);
      inputRefs.current[focusIdx]?.focus();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setError(t.verify.errorIncomplete);
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code: fullCode }),
    });

    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      if (data.error === "Invalid code") setError(t.verify.errorInvalid);
      else if (data.error === "Code expired") setError(t.verify.errorExpired);
      else if (data.error?.includes("Too many")) setError(t.verify.errorTooMany);
      else setError(t.verify.errorGeneric);
      return;
    }

    setVerified(true);
    setLoading(false);

    // Auto-login after short delay
    setTimeout(() => {
      router.push("/login");
    }, 2000);
  }

  async function handleResend() {
    setResending(true);
    setResent(false);
    setError("");

    const res = await fetch("/api/auth/resend-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setResending(false);

    if (res.ok) {
      setResent(true);
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      setTimeout(() => setResent(false), 5000);
    } else {
      const data = await res.json();
      if (data.error?.includes("Too many")) setError(t.verify.errorTooMany);
      else setError(t.verify.errorGeneric);
    }
  }

  if (verified) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-12rem)] px-4">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">{t.verify.successTitle}</h1>
          <p className="text-zinc-400">{t.verify.successRedirect}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-12rem)] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image src="/logo-icon.svg" alt="LastEnvelope" width={48} height={48} className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">{t.verify.title}</h1>
          <p className="text-zinc-400 mt-2">{t.verify.subtitle}</p>
          {email && (
            <div className="flex items-center justify-center gap-2 mt-3 text-emerald-400 text-sm">
              <MailIcon className="w-4 h-4" />
              <span>{email}</span>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6"
        >
          {error && (
            <div className="bg-red-950/50 border border-red-800/50 text-red-400 text-sm p-3 rounded-xl">
              {error}
            </div>
          )}

          {resent && (
            <div className="bg-emerald-950/50 border border-emerald-800/50 text-emerald-400 text-sm p-3 rounded-xl">
              {t.verify.codeSent}
            </div>
          )}

          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-12 h-14 text-center text-xl font-bold rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-600 transition"
                autoComplete="one-time-code"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || code.join("").length !== 6}
            className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t.verify.verifying}
              </>
            ) : (
              t.verify.verifyButton
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-sm text-zinc-400 hover:text-emerald-400 transition disabled:opacity-50"
            >
              {resending ? t.verify.resending : t.verify.resendCode}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
