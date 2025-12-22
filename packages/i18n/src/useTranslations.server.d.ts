import type { Locale } from "./locales";
/**
 * Load translation messages for a given locale on the server and return a
 * lookup function that supports simple template variable interpolation
 * using `{var}` placeholders.
 */
export declare function useTranslations(locale: Locale): Promise<(key: string, vars?: Record<string, unknown>) => string>;
