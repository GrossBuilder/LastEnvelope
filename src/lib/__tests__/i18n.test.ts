import { describe, it, expect } from "vitest";
import en from "@/lib/i18n/dictionaries/en";
import es from "@/lib/i18n/dictionaries/es";
import fr from "@/lib/i18n/dictionaries/fr";
import de from "@/lib/i18n/dictionaries/de";
import ru from "@/lib/i18n/dictionaries/ru";
import tr from "@/lib/i18n/dictionaries/tr";
import pt from "@/lib/i18n/dictionaries/pt";
import ar from "@/lib/i18n/dictionaries/ar";
import { locales } from "@/lib/i18n/config";

const dictionaries: Record<string, typeof en> = { en, es, fr, de, ru, tr, pt, ar };

function getKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const val = obj[key];
    if (val && typeof val === "object" && !Array.isArray(val)) {
      keys.push(...getKeys(val as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys.sort();
}

const enKeys = getKeys(en as unknown as Record<string, unknown>);

describe("i18n dictionaries", () => {
  it("config declares all 8 locales", () => {
    expect(locales).toHaveLength(8);
    expect([...locales].sort()).toEqual(["ar", "de", "en", "es", "fr", "pt", "ru", "tr"]);
  });

  for (const [locale, dict] of Object.entries(dictionaries)) {
    if (locale === "en") continue;

    describe(`${locale} dictionary`, () => {
      const dictKeys = getKeys(dict as unknown as Record<string, unknown>);

      it("has all keys from English dictionary", () => {
        const missing = enKeys.filter((k) => !dictKeys.includes(k));
        expect(missing, `Missing keys in ${locale}: ${missing.join(", ")}`).toEqual([]);
      });

      it("has no extra keys not in English dictionary", () => {
        const extra = dictKeys.filter((k) => !enKeys.includes(k));
        expect(extra, `Extra keys in ${locale}: ${extra.join(", ")}`).toEqual([]);
      });

      it("has no empty string values", () => {
        const empty: string[] = [];
        function check(obj: Record<string, unknown>, prefix = "") {
          for (const [key, val] of Object.entries(obj)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            if (typeof val === "string" && val.trim() === "") {
              empty.push(fullKey);
            } else if (val && typeof val === "object" && !Array.isArray(val)) {
              check(val as Record<string, unknown>, fullKey);
            }
          }
        }
        check(dict as unknown as Record<string, unknown>);
        expect(empty, `Empty values in ${locale}: ${empty.join(", ")}`).toEqual([]);
      });

      it("has no corrupted/mixed-script text in Arabic strings", () => {
        if (locale !== "ar") return;
        const corrupted: string[] = [];
        function check(obj: Record<string, unknown>, prefix = "") {
          for (const [key, val] of Object.entries(obj)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            if (typeof val === "string") {
              // Check for Cyrillic characters mixed with Arabic
              if (/[\u0400-\u04FF]/.test(val) && /[\u0600-\u06FF]/.test(val)) {
                corrupted.push(fullKey);
              }
            } else if (Array.isArray(val)) {
              val.forEach((item, i) => {
                if (typeof item === "string" && /[\u0400-\u04FF]/.test(item) && /[\u0600-\u06FF]/.test(item)) {
                  corrupted.push(`${fullKey}[${i}]`);
                }
              });
            } else if (val && typeof val === "object") {
              check(val as Record<string, unknown>, fullKey);
            }
          }
        }
        check(dict as unknown as Record<string, unknown>);
        expect(corrupted, `Corrupted mixed-script in ar: ${corrupted.join(", ")}`).toEqual([]);
      });

      it("array values have same length as English", () => {
        const mismatched: string[] = [];
        function check(enObj: Record<string, unknown>, locObj: Record<string, unknown>, prefix = "") {
          for (const key of Object.keys(enObj)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            const enVal = enObj[key];
            const locVal = locObj[key];
            if (Array.isArray(enVal) && Array.isArray(locVal)) {
              if (enVal.length !== locVal.length) {
                mismatched.push(`${fullKey} (en: ${enVal.length}, ${locale}: ${locVal.length})`);
              }
            } else if (enVal && typeof enVal === "object" && !Array.isArray(enVal) && locVal && typeof locVal === "object") {
              check(enVal as Record<string, unknown>, locVal as Record<string, unknown>, fullKey);
            }
          }
        }
        check(en as unknown as Record<string, unknown>, dict as unknown as Record<string, unknown>);
        expect(mismatched, `Array length mismatches: ${mismatched.join(", ")}`).toEqual([]);
      });
    });
  }
});
