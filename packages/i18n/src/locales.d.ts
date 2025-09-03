export { LOCALES } from "@acme/types";
export type { Locale } from "@acme/types";
export declare function assertLocales(value: unknown): asserts value is readonly Locale[];
export declare const locales: typeof LOCALES;
export declare function resolveLocale(value: string | undefined): Locale;
