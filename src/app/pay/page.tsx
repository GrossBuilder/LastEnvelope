"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Copy,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface PaymentData {
  paymentId: string;
  walletAddress: string;
  amount: number;
  network: string;
  networkName: string;
  expiresAt: string;
  plan: string;
}

interface PaymentHistory {
  id: string;
  plan: string;
  amountUsdt: number;
  network: string;
  txHash: string | null;
  status: string;
  createdAt: string;
  confirmedAt: string | null;
}

export default function PayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      }
    >
      <PayPageContent />
    </Suspense>
  );
}

function PayPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useI18n();
  const paymentId = searchParams.get("id");
  const tab = searchParams.get("tab");

  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [history, setHistory] = useState<PaymentHistory[]>([]);
  const [txHash, setTxHash] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<{
    status: string;
    error?: string;
    plan?: string;
  } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    const res = await fetch("/api/payments/create");
    const data = await res.json();
    setHistory(data.payments || []);
    setLoading(false);
  }, []);

  // Load payment data or history
  useEffect(() => {
    if (paymentId) {
      // Payment ID passed from pricing page — data already created,
      // we just need to fetch it
      fetch("/api/payments/create")
        .then((r) => r.json())
        .then((data) => {
          const p = (data.payments || []).find(
            (p: PaymentHistory) => p.id === paymentId
          );
          if (p && p.status === "PENDING") {
            setPayment({
              paymentId: p.id,
              walletAddress:
                p.walletAddress || process.env.NEXT_PUBLIC_USDT_WALLET || "",
              amount: p.amountUsdt,
              network: p.network,
              networkName: p.network === "TRC20" ? "Tron (TRC-20)" : p.network,
              expiresAt: p.expiresAt,
              plan: p.plan,
            });
          }
          setHistory(data.payments || []);
          setLoading(false);
        });
    } else {
      loadHistory();
    }
  }, [paymentId, loadHistory]);

  // Countdown timer
  useEffect(() => {
    if (!payment?.expiresAt) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const expires = new Date(payment.expiresAt).getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeft(t.pay.expired);
        clearInterval(interval);
        return;
      }

      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, "0")}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [payment?.expiresAt]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleVerify = async () => {
    if (!txHash.trim() || !payment) return;

    setVerifying(true);
    setResult(null);

    try {
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: payment.paymentId,
          txHash: txHash.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({ status: "CONFIRMED", plan: data.plan });
      } else {
        setResult({ status: "FAILED", error: data.error });
      }
    } catch {
      setResult({ status: "FAILED", error: "Network error" });
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto" />
      </div>
    );
  }

  // Show history tab
  if (tab === "history" || (!paymentId && !payment)) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.push("/pricing")}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-white">{t.pay.paymentHistory}</h1>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            {t.pay.noPayments}{" "}
            <button
              onClick={() => router.push("/pricing")}
              className="text-emerald-400 hover:underline"
            >
              {t.pay.viewPlans}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((p) => (
              <div
                key={p.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{p.plan}</span>
                    <span className="text-sm text-zinc-500">
                      {p.amountUsdt} USDT
                    </span>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    {new Date(p.createdAt).toLocaleDateString()} •{" "}
                    {p.network}
                    {p.txHash && (
                      <a
                        href={`https://tronscan.org/#/transaction/${p.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-emerald-400 hover:underline inline-flex items-center gap-1"
                      >
                        TX <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Payment confirmed
  if (result?.status === "CONFIRMED") {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-white mb-4">
          {t.pay.confirmed}
        </h1>
        <p className="text-zinc-400 mb-8">
          {t.pay.confirmedDesc.replace("{plan}", result.plan || "")}
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition"
        >
          {t.pay.goToDashboard}
        </button>
      </div>
    );
  }

  // Active payment form
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.push("/pricing")}
          className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-white">
          {t.pay.title}
        </h1>
      </div>

      {payment && (
        <div className="space-y-6">
          {/* Plan summary */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {payment.plan} {t.pay.plan}
                </h2>
                <p className="text-sm text-zinc-500">{payment.networkName}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-emerald-400">
                  {payment.amount} USDT
                </div>
                <div className="flex items-center gap-1 text-sm text-zinc-500">
                  <Clock className="w-3.5 h-3.5" />
                  {timeLeft === t.pay.expired ? (
                    <span className="text-red-400">{t.pay.expired}</span>
                  ) : (
                    <span>{timeLeft}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Wallet address */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-sm font-medium text-zinc-400 mb-3">
              {t.pay.sendExactly.replace("{amount}", String(payment.amount)).replace("{network}", payment.networkName)}
            </h3>
            <div className="flex items-center gap-2 bg-zinc-950 rounded-lg p-3">
              <code className="text-sm text-emerald-300 flex-1 break-all font-mono">
                {payment.walletAddress}
              </code>
              <button
                onClick={() =>
                  copyToClipboard(payment.walletAddress, "address")
                }
                className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 shrink-0"
              >
                {copied === "address" ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Copy amount */}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-zinc-500">{t.pay.amount}:</span>
              <button
                onClick={() =>
                  copyToClipboard(payment.amount.toString(), "amount")
                }
                className="text-sm text-white hover:text-emerald-400 flex items-center gap-1"
              >
                {payment.amount} USDT
                {copied === "amount" ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <div className="mt-4 text-xs text-zinc-600 space-y-1">
              <p>• {t.pay.wrongNetwork.replace("{network}", payment.networkName)}</p>
              <p>• {t.pay.wrongNetworkWarning}</p>
              <p>• {t.pay.timeWindow}</p>
            </div>
          </div>

          {/* TX Hash submission */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-sm font-medium text-zinc-400 mb-3">
              {t.pay.pasteHash}
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder={t.pay.hashPlaceholder}
                className="flex-1 px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-white text-sm font-mono placeholder:text-zinc-600 focus:outline-none focus:border-emerald-600"
                maxLength={64}
                disabled={timeLeft === t.pay.expired}
              />
              <button
                onClick={handleVerify}
                disabled={
                  !txHash.trim() ||
                  verifying ||
                  timeLeft === t.pay.expired
                }
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {verifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t.pay.verifying}
                  </>
                ) : (
                  t.pay.verify
                )}
              </button>
            </div>

            {result?.status === "FAILED" && (
              <div className="mt-3 flex items-start gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{result.error}</span>
              </div>
            )}
          </div>

          {/* Help */}
          <div className="text-center text-xs text-zinc-600">
            <p>
              {t.pay.havingIssues}{" "}
              <a
                href="mailto:support@lastenvelope.com"
                className="text-emerald-500 hover:underline"
              >
                {t.pay.contactSupport}
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-yellow-500/10 text-yellow-400",
    SUBMITTED: "bg-blue-500/10 text-blue-400",
    CONFIRMING: "bg-blue-500/10 text-blue-400",
    CONFIRMED: "bg-emerald-500/10 text-emerald-400",
    EXPIRED: "bg-zinc-500/10 text-zinc-500",
    FAILED: "bg-red-500/10 text-red-400",
  };

  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        styles[status] || styles.PENDING
      }`}
    >
      {status}
    </span>
  );
}
