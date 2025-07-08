// packages/i18n/src/locales.ts
export const LOCALES = ["en", "de", "it"] as const;
export type Locale = (typeof LOCALES)[number];

export const locales = LOCALES;
export function resolveLocale(value: string | undefined): Locale {
  return locales.includes(value as Locale) ? (value as Locale) : "en";
}
