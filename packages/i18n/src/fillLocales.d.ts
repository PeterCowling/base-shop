import { type Locale } from "./locales.js";
/**
 * Ensure all locales have a value, filling in missing entries with a fallback.
 */
export declare function fillLocales(values: Partial<Record<Locale, string>> | undefined, fallback: string): Record<Locale, string>;
