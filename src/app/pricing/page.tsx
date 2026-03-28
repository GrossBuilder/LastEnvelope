"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Check, Sparkles, Crown, Zap, Loader2, CreditCard, Coins } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { t } = useI18n();
  const [loading, setLoading] = useState<string | null>(null);
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [payMethod, setPayMethod] = useState<"card" | "crypto">("card");

  const currentPlan = (session?.user as { plan?: string })?.plan || "FREE";

  const prices = {
    monthly: { PRO: "$4.99", PRO_PLUS: "$9.99" },
    yearly: { PRO: "$49", PRO_PLUS: "$99" },
  };

  const plans = [
    {
      key: "FREE" as const,
      name: t.pricing.free,
      price: t.pricing.priceFree,
      period: t.pricing.periodForever,
      description: t.pricing.freeDesc,
      icon: Zap,
      features: t.pricing.freeFeatures,
      highlighted: false,
    },
    {
      key: "PRO" as const,
      name: t.pricing.pro,
      price: prices[billing].PRO,
      period: billing === "monthly" ? t.pricing.periodMonth : t.pricing.periodYear,
      description: t.pricing.proDesc,
      icon: Sparkles,
      features: t.pricing.proFeatures,
      highlighted: true,
    },
    {
      key: "PRO_PLUS" as const,
      name: t.pricing.proPlus,
      price: prices[billing].PRO_PLUS,
      period: billing === "monthly" ? t.pricing.periodMonth : t.pricing.periodYear,
      description: t.pricing.proPlusDesc,
      icon: Crown,
      features: t.pricing.proPlusFeatures,
      highlighted: false,
    },
  ];

  const handleUpgrade = async (plan: "PRO" | "PRO_PLUS") => {
    if (!session) {
      router.push("/register");
      return;
    }

    setLoading(plan);
    try {
      if (payMethod === "card") {
        // LemonSqueezy Checkout
        const res = await fetch("/api/lemonsqueezy/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan, billing }),
        });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        // USDT Payment
        const res = await fetch("/api/payments/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan, network: "TRC20", billing }),
        });
        const data = await res.json();
        if (data.paymentId) {
          router.push(`/pay?id=${data.paymentId}`);
        }
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">
          {t.pricing.title}
        </h1>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto mb-8">
          {t.pricing.subtitle}
        </p>

        {/* Billing toggle */}
        <div className="inline-flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1">
          <button
            onClick={() => setBilling("monthly")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
              billing === "monthly"
                ? "bg-emerald-600 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {t.pricing.monthly}
          </button>
          <button
            onClick={() => setBilling("yearly")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
              billing === "yearly"
                ? "bg-emerald-600 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {t.pricing.yearly}
            <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
              -17%
            </span>
          </button>
        </div>

        {/* Payment method toggle */}
        <div className="inline-flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1 ml-3">
          <button
            onClick={() => setPayMethod("card")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
              payMethod === "card"
                ? "bg-emerald-600 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Card
          </button>
          <button
            onClick={() => setPayMethod("crypto")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
              payMethod === "crypto"
                ? "bg-emerald-600 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Coins className="w-4 h-4" />
            USDT
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.key;
          const isPaid = plan.key !== "FREE";

          return (
            <div
              key={plan.key}
              className={`relative rounded-2xl p-6 ${
                plan.highlighted
                  ? "bg-emerald-950/30 border-2 border-emerald-600/50"
                  : "bg-zinc-900 border border-zinc-800"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-emerald-600 text-white text-xs font-medium rounded-full">
                  {t.pricing.mostPopular}
                </div>
              )}

              <div className="mb-6">
                <plan.icon
                  className={`w-8 h-8 mb-3 ${
                    plan.highlighted ? "text-emerald-400" : "text-zinc-400"
                  }`}
                />
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <p className="text-zinc-500 text-sm mt-1">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-white">
                  {plan.price}
                </span>
                <span className="text-zinc-500 text-sm ml-1">
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <span className="text-sm text-zinc-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <button
                  disabled
                  className="w-full py-2.5 rounded-xl bg-zinc-800 text-zinc-500 font-medium cursor-not-allowed"
                >
                  {t.pricing.currentPlan}
                </button>
              ) : isPaid ? (
                <button
                  onClick={() => handleUpgrade(plan.key as "PRO" | "PRO_PLUS")}
                  disabled={!!loading}
                  className={`w-full py-2.5 rounded-xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2 ${
                    plan.highlighted
                      ? "bg-emerald-600 text-white hover:bg-emerald-500"
                      : "border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  }`}
                >
                  {loading === plan.key ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t.pricing.redirecting}
                    </>
                  ) : (
                    plan.key === "PRO" ? t.pricing.upgradeToPro : t.pricing.upgradeToProPlus
                  )}
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-2.5 rounded-xl bg-zinc-800 text-zinc-500 font-medium cursor-not-allowed"
                >
                  {t.pricing.freeForever}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="mt-20 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-white text-center mb-8">
          {t.pricing.faqTitle}
        </h2>
        <div className="space-y-4">
          {[
            { q: t.pricing.faqCancel, a: t.pricing.faqCancelAnswer },
            { q: t.pricing.faqDowngrade, a: t.pricing.faqDowngradeAnswer },
            { q: t.pricing.faqEncrypted, a: t.pricing.faqEncryptedAnswer },
            { q: t.pricing.faqSwitch, a: t.pricing.faqSwitchAnswer },
          ].map((faq) => (
            <div
              key={faq.q}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5"
            >
              <h3 className="text-white font-medium">{faq.q}</h3>
              <p className="text-zinc-400 text-sm mt-2">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
