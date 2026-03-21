import Link from "next/link";
import {
  Shield,
  Lock,
  Users,
  Bell,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { getDictionary } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";

export default async function HomePage() {
  const locale = await getServerLocale();
  const t = await getDictionary(locale);

  const features = [
    {
      icon: Lock,
      title: t.landing.featureEncryptedVault,
      description: t.landing.featureEncryptedVaultDesc,
    },
    {
      icon: Users,
      title: t.landing.featureBeneficiaries,
      description: t.landing.featureBeneficiariesDesc,
    },
    {
      icon: Bell,
      title: t.landing.featureDeadMansSwitch,
      description: t.landing.featureDeadMansSwitchDesc,
    },
    {
      icon: Shield,
      title: t.landing.featureZeroKnowledge,
      description: t.landing.featureZeroKnowledgeDesc,
    },
  ];

  const plans = [
    {
      name: t.landing.planFree,
      price: t.landing.priceFree,
      period: t.landing.periodForever,
      features: t.landing.freeFeatures,
      cta: t.common.getStarted,
      highlight: false,
    },
    {
      name: t.landing.planPro,
      price: t.landing.pricePro,
      period: t.landing.periodMonth,
      features: t.landing.proFeatures,
      cta: t.landing.ctaUpgradePro,
      highlight: true,
    },
    {
      name: t.landing.planProPlus,
      price: t.landing.priceProPlus,
      period: t.landing.periodMonth,
      features: t.landing.proPlusFeatures,
      cta: t.landing.ctaGetProPlus,
      highlight: false,
    },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/20 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-32 lg:pb-36">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-800/50 text-emerald-400 text-sm mb-6">
              <Shield className="w-4 h-4" />
              {t.landing.badge}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
              {t.landing.heroTitle}
              <br />
              <span className="text-emerald-400">{t.landing.heroHighlight}</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto">
              {t.landing.heroDescription}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="px-8 py-3.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition shadow-lg shadow-emerald-900/30 flex items-center gap-2"
              >
                {t.landing.ctaCreate}
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="#features"
                className="px-8 py-3.5 rounded-xl bg-zinc-800 text-zinc-300 font-medium hover:bg-zinc-700 hover:text-white transition"
              >
                {t.landing.ctaLearn}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              {t.landing.featuresTitle}
            </h2>
            <p className="mt-4 text-zinc-400 text-lg max-w-2xl mx-auto">
              {t.landing.featuresSubtitle}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-emerald-800/50 transition group"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-950/50 flex items-center justify-center mb-4 group-hover:bg-emerald-900/50 transition">
                  <f.icon className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {f.title}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 lg:py-28 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              {t.landing.howItWorksTitle}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "1", title: t.landing.stepStore, desc: t.landing.stepStoreDesc },
              { step: "2", title: t.landing.stepAssign, desc: t.landing.stepAssignDesc },
              { step: "3", title: t.landing.stepRelax, desc: t.landing.stepRelaxDesc },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-600 text-white text-xl font-bold flex items-center justify-center mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {s.title}
                </h3>
                <p className="text-zinc-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              {t.landing.pricingTitle}
            </h2>
            <p className="mt-4 text-zinc-400 text-lg">
              {t.landing.pricingSubtitle}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`p-8 rounded-2xl border ${
                  plan.highlight
                    ? "bg-emerald-950/30 border-emerald-700/50 ring-1 ring-emerald-500/20"
                    : "bg-zinc-900 border-zinc-800"
                }`}
              >
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">
                    {plan.price}
                  </span>
                  <span className="text-zinc-400">{plan.period}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-zinc-300"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-8 block text-center py-2.5 rounded-xl font-medium transition ${
                    plan.highlight
                      ? "bg-emerald-600 text-white hover:bg-emerald-500"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28 bg-zinc-900/50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            {t.landing.ctaTitle}
          </h2>
          <p className="mt-4 text-zinc-400 text-lg">
            {t.landing.ctaDescription}
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition shadow-lg shadow-emerald-900/30"
          >
            {t.landing.ctaButton}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
