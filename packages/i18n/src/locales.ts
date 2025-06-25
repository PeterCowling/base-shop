// packages/i18n/src/locales.ts
export const locales = ["en", "de", "it"] as const;
export type Locale = (typeof locales)[number];

export function resolveLocale(value: string | undefined): Locale {
  return locales.includes(value as Locale) ? (value as Locale) : "en";
}
