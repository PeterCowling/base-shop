import type { Locale } from "@acme/types";
/**
 * Return the fallback chain for a given locale.
 * - de → ["de", "en"]
 * - it → ["it", "en"]
 * - en → ["en"]
 */
export declare function fallbackChain(locale: Locale): Locale[];
