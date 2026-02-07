import type { ContentLocale, Locale } from "@acme/types";

/**
 * Return the fallback chain for a given ContentLocale.
 * All non-English locales fall back to English.
 *
 * Examples:
 * - de → ["de", "en"]
 * - it → ["it", "en"]
 * - zh-Hans → ["zh-Hans", "en"]
 * - en → ["en"]
 */
export function contentFallbackChain(locale: ContentLocale): ContentLocale[] {
  if (locale === "en") {
    return ["en"];
  }
  return [locale, "en"];
}

/**
 * @deprecated Use contentFallbackChain instead.
 * Return the fallback chain for a given locale (legacy 3-locale support).
 */
export function fallbackChain(locale: Locale): Locale[] {
  switch (locale) {
    case "de":
      return ["de", "en"];
    case "it":
      return ["it", "en"];
    case "en":
    default:
      return ["en"];
  }
}
