"use client";

import { SessionProvider } from "next-auth/react";
import { I18nProvider } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
  locale: Locale;
  dictionaryJson: string;
}

export function Providers({ children, locale, dictionaryJson }: ProvidersProps) {
  // Parse dictionary from JSON string passed from server
  const dictionary: Dictionary = JSON.parse(dictionaryJson);

  return (
    <SessionProvider>
      <I18nProvider initialLocale={locale} initialDictionary={dictionary}>
        {children}
      </I18nProvider>
    </SessionProvider>
  );
}
