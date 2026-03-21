import { getDictionary } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";

export default async function TermsPage() {
  const locale = await getServerLocale();
  const t = await getDictionary(locale);

  const sections = [
    { title: t.terms.introduction, content: t.terms.introductionText },
    { title: t.terms.plansAndLimits, content: t.terms.plansAndLimitsText },
    { title: t.terms.storageLimits, content: t.terms.storageLimitsText },
    { title: t.terms.payments, content: t.terms.paymentsText },
    { title: t.terms.prohibitedUse, content: t.terms.prohibitedUseText },
    { title: t.terms.penalties, content: t.terms.penaltiesText },
    { title: t.terms.dataHandling, content: t.terms.dataHandlingText },
    { title: t.terms.termination, content: t.terms.terminationText },
    { title: t.terms.liability, content: t.terms.liabilityText },
    { title: t.terms.contact, content: t.terms.contactText },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">{t.terms.title}</h1>
      <p className="text-zinc-500 text-sm mb-10">{t.terms.lastUpdated}</p>

      <div className="space-y-8">
        {sections.map((section, i) => (
          <section key={i}>
            <h2 className="text-xl font-semibold text-white mb-3">
              {i + 1}. {section.title}
            </h2>
            <p className="text-zinc-400 leading-relaxed whitespace-pre-line">
              {section.content}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
