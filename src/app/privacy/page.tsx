import { getDictionary } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default async function PrivacyPage() {
  const locale = await getServerLocale();
  const t = await getDictionary(locale);

  const sections = [
    { title: t.privacy.overview, content: t.privacy.overviewText },
    { title: t.privacy.dataCollection, content: t.privacy.dataCollectionText },
    { title: t.privacy.encryption, content: t.privacy.encryptionText },
    { title: t.privacy.dataUsage, content: t.privacy.dataUsageText },
    { title: t.privacy.thirdParties, content: t.privacy.thirdPartiesText },
    { title: t.privacy.cookies, content: t.privacy.cookiesText },
    { title: t.privacy.retention, content: t.privacy.retentionText },
    { title: t.privacy.rights, content: t.privacy.rightsText },
    { title: t.privacy.children, content: t.privacy.childrenText },
    { title: t.privacy.changes, content: t.privacy.changesText },
    { title: t.privacy.contact, content: t.privacy.contactText },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">{t.privacy.title}</h1>
      <p className="text-zinc-500 text-sm mb-10">{t.privacy.lastUpdated}</p>

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
