import type { Locale } from "@acme/types";

/**
 * Return the fallback chain for a given locale.
 * - de → ["de", "en"]
 * - it → ["it", "en"]
 * - en → ["en"]
 */
export function fallbackChain(locale: Locale): Locale[] {
  switch (locale) {
    case "de":
      return ["de", "en"];
    case "it":
      return ["it", "en"];
    case "fr":
      return ["fr", "en"];
    case "es":
      return ["es", "en"];
    case "ja":
      return ["ja", "en"];
    case "ko":
      return ["ko", "en"];
    case "en":
    default:
      return ["en"];
  }
}
