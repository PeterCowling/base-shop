export const LOCALES = ["en", "it", "zh"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export function resolveLocale(value: string | string[] | undefined): Locale {
  const normalized = Array.isArray(value) ? value[0] : value;
  return (LOCALES.includes(normalized as Locale) ? (normalized as Locale) : DEFAULT_LOCALE);
}
