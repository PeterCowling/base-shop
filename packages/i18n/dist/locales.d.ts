export declare const locales: readonly ["en", "de", "it"];
export type Locale = (typeof locales)[number];
export declare function resolveLocale(value: string | undefined): Locale;
