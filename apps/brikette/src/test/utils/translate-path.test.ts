
import "@testing-library/jest-dom";
import type { AppLanguage } from "@/i18n.config";
import { SLUGS } from "@/slug-map";
import type { SlugKey } from "@/types/slugs";
import { translatePath } from "@/utils/translate-path";

describe("translatePath", () => {
  const languages: AppLanguage[] = [
    "de",
    "en",
    "es",
    "fr",
    "it",
    "ja",
    "ko",
    "pt",
    "ru",
    "zh",
    "ar",
    "hi",
    "vi",
    "pl",
    "sv",
    "no",
    "da",
    "hu",
  ];
  const keys = Object.keys(SLUGS) as SlugKey[];

  it("returns the expected slug for each key/language pair", () => {
    for (const key of keys) {
      for (const lang of languages) {
        const result = translatePath(key, lang);
        expect(result).toBe(SLUGS[key][lang]);
      }
    }
  });

  it("always returns a non-empty string", () => {
    for (const key of keys) {
      for (const lang of languages) {
        const result = translatePath(key, lang);
        expect(typeof result).toBe("string");
        expect(result.length).toBeGreaterThan(0);
      }
    }
  });

  it("preserves return type per key/language at compile time", () => {
    const path: string = translatePath("rooms", "en");
    expect(path).toBe(SLUGS.rooms.en);
  });
});