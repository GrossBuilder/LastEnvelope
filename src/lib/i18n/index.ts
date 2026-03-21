import type { Locale } from "./config";
import type { Dictionary } from "./dictionaries/en";

export { locales, defaultLocale, rtlLocales, localeNames, localeFlags } from "./config";
export type { Locale } from "./config";
export type { Dictionary } from "./dictionaries/en";
export { I18nProvider, useI18n } from "./context";

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  switch (locale) {
    case "es":
      return (await import("./dictionaries/es")).default;
    case "fr":
      return (await import("./dictionaries/fr")).default;
    case "de":
      return (await import("./dictionaries/de")).default;
    case "ru":
      return (await import("./dictionaries/ru")).default;
    case "tr":
      return (await import("./dictionaries/tr")).default;
    case "pt":
      return (await import("./dictionaries/pt")).default;
    case "ar":
      return (await import("./dictionaries/ar")).default;
    default:
      return (await import("./dictionaries/en")).default;
  }
}
