import { type Locale } from "@types";
export declare const locales: readonly ["en", "de", "it"];
export type { Locale };
export declare function resolveLocale(value: string | undefined): Locale;
