// packages/i18n/src/locales.d.ts

export declare const locales: readonly ["en", "de", "it"];
export type Locale = (typeof locales)[number];
export declare function resolveLocale(value: string | undefined): Locale;
