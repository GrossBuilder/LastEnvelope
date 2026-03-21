import { cookies } from "next/headers";
import type { Locale } from "./config";
import { defaultLocale, locales } from "./config";

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("locale")?.value;
  if (localeCookie && locales.includes(localeCookie as Locale)) {
    return localeCookie as Locale;
  }
  return defaultLocale;
}
