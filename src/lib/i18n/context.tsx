"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import type { Dictionary } from "./dictionaries/en";
import type { Locale } from "./config";
import { defaultLocale, locales } from "./config";

interface I18nContextType {
  locale: Locale;
  t: Dictionary;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextType | null>(null);

// Lazy-load dictionaries
const dictionaryCache: Partial<Record<Locale, Dictionary>> = {};

async function loadDictionary(locale: Locale): Promise<Dictionary> {
  if (dictionaryCache[locale]) return dictionaryCache[locale]!;

  let dict: Dictionary;
  switch (locale) {
    case "es":
      dict = (await import("./dictionaries/es")).default;
      break;
    case "fr":
      dict = (await import("./dictionaries/fr")).default;
      break;
    case "de":
      dict = (await import("./dictionaries/de")).default;
      break;
    case "ru":
      dict = (await import("./dictionaries/ru")).default;
      break;
    case "tr":
      dict = (await import("./dictionaries/tr")).default;
      break;
    case "pt":
      dict = (await import("./dictionaries/pt")).default;
      break;
    case "ar":
      dict = (await import("./dictionaries/ar")).default;
      break;
    default:
      dict = (await import("./dictionaries/en")).default;
  }

  dictionaryCache[locale] = dict;
  return dict;
}

export function I18nProvider({
  children,
  initialLocale,
  initialDictionary,
}: {
  children: ReactNode;
  initialLocale: Locale;
  initialDictionary: Dictionary;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [dictionary, setDictionary] = useState<Dictionary>(initialDictionary);

  const setLocale = useCallback(async (newLocale: Locale) => {
    if (!locales.includes(newLocale)) return;
    const dict = await loadDictionary(newLocale);
    setDictionary(dict);
    setLocaleState(newLocale);
    document.cookie = `locale=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
    document.documentElement.lang = newLocale;
    document.documentElement.dir = newLocale === "ar" ? "rtl" : "ltr";
  }, []);

  return (
    <I18nContext.Provider value={{ locale, t: dictionary, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
