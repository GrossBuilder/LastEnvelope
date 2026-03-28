"use client";

import { useState } from "react";
import { useAdminI18n } from "../admin-shell";

interface CryptoPayment {
  id: string;
  userName: string | null;
  userEmail: string;
  userPlan: string;
  plan: string;
  billing: string | null;
  amountUsdt: number;
  network: string;
  status: string;
  txHash: string | null;
  createdAt: string;
}

interface CardPayment {
  id: string;
  userName: string | null;
  userEmail: string;
  userPlan: string;
  plan: string;
  billing: string;
  amount: number;
  currency: string;
  provider: string;
  status: string;
  subscriptionId: string | null;
  createdAt: string;
}

export function PaymentsClient({
  cryptoPayments,
  cardPayments,
  totalCryptoConfirmed,
  totalCardRevenue,
}: {
  cryptoPayments: CryptoPayment[];
  cardPayments: CardPayment[];
  totalCryptoConfirmed: number;
  totalCardRevenue: number;
}) {
  const { t } = useAdminI18n();
  const [tab, setTab] = useState<"card" | "crypto">("card");

  const cryptoStatusColors: Record<string, string> = {
    PENDING: "bg-yellow-500/20 text-yellow-400",
    CONFIRMED: "bg-green-500/20 text-green-400",
    EXPIRED: "bg-zinc-500/20 text-zinc-400",
    FAILED: "bg-red-500/20 text-red-400",
  };

  const cardStatusColors: Record<string, string> = {
    active: "bg-green-500/20 text-green-400",
    cancelled: "bg-zinc-500/20 text-zinc-400",
    expired: "bg-yellow-500/20 text-yellow-400",
    refunded: "bg-red-500/20 text-red-400",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.payments.title}</h1>
          <p className="text-zinc-400 text-sm mt-1">{t.payments.subtitle}</p>
        </div>
        <div className="text-right space-y-1">
          <div>
            <p className="text-zinc-500 text-xs">{t.payments.cardRevenue}</p>
            <p className="text-xl font-bold text-emerald-400">
              ${totalCardRevenue.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-zinc-500 text-xs">{t.payments.totalRevenue}</p>
            <p className="text-xl font-bold text-emerald-400">
              {totalCryptoConfirmed.toFixed(2)} USDT
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/10">
        <button
          onClick={() => setTab("card")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "card"
              ? "border-emerald-400 text-emerald-400"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          {t.payments.tabCard} ({cardPayments.length})
        </button>
        <button
          onClick={() => setTab("crypto")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "crypto"
              ? "border-emerald-400 text-emerald-400"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          {t.payments.tabCrypto} ({cryptoPayments.length})
        </button>
      </div>

      {/* Card payments tab */}
      {tab === "card" && (
        cardPayments.length === 0 ? (
          <div className="text-center text-zinc-500 py-20">{t.payments.noPayments}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400 text-left">
                  <th className="py-3 px-3">{t.payments.date}</th>
                  <th className="py-3 px-3">{t.payments.user}</th>
                  <th className="py-3 px-3">{t.payments.plan}</th>
                  <th className="py-3 px-3">{t.payments.billing}</th>
                  <th className="py-3 px-3">{t.payments.amount}</th>
                  <th className="py-3 px-3">{t.payments.provider}</th>
                  <th className="py-3 px-3">{t.payments.status}</th>
                </tr>
              </thead>
              <tbody>
                {cardPayments.map((p) => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-3 text-zinc-400 whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-white text-sm">{p.userName || "—"}</div>
                      <div className="text-zinc-500 text-xs">{p.userEmail}</div>
                    </td>
                    <td className="py-3 px-3 text-white">{p.plan}</td>
                    <td className="py-3 px-3 text-zinc-400">
                      {({monthly: t.payments.billingMonthly, annual: t.payments.billingAnnual} as Record<string, string>)[p.billing] || p.billing}
                    </td>
                    <td className="py-3 px-3 text-white font-mono">
                      {p.amount.toFixed(2)} {p.currency}
                    </td>
                    <td className="py-3 px-3 text-zinc-400 capitalize">{p.provider}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${cardStatusColors[p.status] || ""}`}
                      >
                        {({active: t.payments.statusActive, cancelled: t.payments.statusCancelled, expired: t.payments.statusExpired, refunded: t.payments.statusRefunded} as Record<string, string>)[p.status] || p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Crypto payments tab */}
      {tab === "crypto" && (
        cryptoPayments.length === 0 ? (
          <div className="text-center text-zinc-500 py-20">{t.payments.noPayments}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400 text-left">
                  <th className="py-3 px-3">{t.payments.date}</th>
                  <th className="py-3 px-3">{t.payments.user}</th>
                  <th className="py-3 px-3">{t.payments.plan}</th>
                  <th className="py-3 px-3">{t.payments.billing}</th>
                  <th className="py-3 px-3">{t.payments.amount}</th>
                  <th className="py-3 px-3">{t.payments.network}</th>
                  <th className="py-3 px-3">{t.payments.status}</th>
                  <th className="py-3 px-3">{t.payments.tx}</th>
                </tr>
              </thead>
              <tbody>
                {cryptoPayments.map((p) => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-3 text-zinc-400 whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-white text-sm">{p.userName || "—"}</div>
                      <div className="text-zinc-500 text-xs">{p.userEmail}</div>
                    </td>
                    <td className="py-3 px-3 text-white">{p.plan}</td>
                    <td className="py-3 px-3 text-zinc-400">
                      {p.billing ? ({monthly: t.payments.billingMonthly, annual: t.payments.billingAnnual} as Record<string, string>)[p.billing] || p.billing : "—"}
                    </td>
                    <td className="py-3 px-3 text-white font-mono">
                      {p.amountUsdt.toFixed(2)} USDT
                    </td>
                    <td className="py-3 px-3 text-zinc-400">{p.network}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${cryptoStatusColors[p.status] || ""}`}
                      >
                        {({PENDING: t.payments.statusPending, CONFIRMED: t.payments.statusConfirmed, EXPIRED: t.payments.statusExpired, FAILED: t.payments.statusFailed} as Record<string, string>)[p.status] || p.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {p.txHash ? (
                        <span
                          className="text-emerald-400 text-xs font-mono truncate block max-w-[120px]"
                          title={p.txHash}
                        >
                          {p.txHash.slice(0, 8)}…{p.txHash.slice(-6)}
                        </span>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
