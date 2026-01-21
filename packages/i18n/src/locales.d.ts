import { type Locale as BaseLocale } from "@acme/types";

export declare const LOCALES: readonly ["en", "de", "it"];
export type Locale = BaseLocale;
export declare function assertLocales(value: unknown): asserts value is readonly Locale[];
export declare const locales: readonly ["en", "de", "it"];
export declare function resolveLocale(value: string | undefined): Locale;
