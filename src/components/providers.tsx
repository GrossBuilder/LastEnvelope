"use client";

import { SessionProvider } from "next-auth/react";
import { I18nProvider } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { ReactNode } from "react";

export function Providers({
  children,
  locale,
  dictionary,
}: {
  children: ReactNode;
  locale: Locale;
  dictionary: Dictionary;
}) {
  return (
    <SessionProvider>
      <I18nProvider initialLocale={locale} initialDictionary={dictionary}>
        {children}
      </I18nProvider>
    </SessionProvider>
  );
}
