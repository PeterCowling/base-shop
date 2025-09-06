import { type Locale } from "./locales";
/**
 * Load translation messages for a given locale on the server and return a lookup function.
 */
export declare function useTranslations(locale: Locale): Promise<(key: string) => string>;

