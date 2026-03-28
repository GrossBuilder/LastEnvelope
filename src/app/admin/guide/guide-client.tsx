"use client";

import { useAdminI18n } from "../admin-shell";
import { BookOpen } from "lucide-react";

export function GuideClient() {
  const { t } = useAdminI18n();

  const sections = [
    {
      id: "dashboard",
      title: t.guide.dashboard_section,
      description: t.guide.dashboard_desc,
    },
    {
      id: "users",
      title: t.guide.users_section,
      description: t.guide.users_desc,
    },
    {
      id: "switches",
      title: t.guide.switches_section,
      description: t.guide.switches_desc,
    },
    {
      id: "payments",
      title: t.guide.payments_section,
      description: t.guide.payments_desc,
    },
  ];

  const features = [
    t.guide.feature_1,
    t.guide.feature_2,
    t.guide.feature_3,
    t.guide.feature_4,
    t.guide.feature_5,
  ];

  const tips = [
    t.guide.tip_1,
    t.guide.tip_2,
    t.guide.tip_3,
    t.guide.tip_4,
  ];

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <BookOpen className="w-8 h-8 text-blue-400" />
          <h1 className="text-3xl font-bold text-white">{t.guide.title}</h1>
        </div>
        <p className="text-zinc-400 text-lg">{t.guide.subtitle}</p>
      </div>

      {/* Overview */}
      <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">{t.guide.overview}</h2>
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.id}>
              <h3 className="font-medium text-blue-300 mb-2">{section.title}</h3>
              <p className="text-zinc-300">{section.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Key Features */}
      <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">{t.guide.features}</h2>
        <ul className="space-y-2">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3 text-zinc-300">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-emerald-400 text-xs font-bold">✓</span>
              </div>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Best Practices */}
      <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">{t.guide.tips}</h2>
        <ul className="space-y-3">
          {tips.map((tip, idx) => (
            <li key={idx} className="flex gap-3 text-zinc-300">
              <div className="text-blue-400 font-bold mt-0.5 flex-shrink-0">{idx + 1}.</div>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Support */}
      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-2">{t.guide.support}</h2>
        <p className="text-zinc-300">{t.guide.support_text}</p>
      </div>
    </div>
  );
}
