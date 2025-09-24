// packages/i18n/src/locales.ts
// Supported locales for the storefront experience.
// English-only configuration
export const LOCALES = ["en"] as const;
export type Locale = (typeof LOCALES)[number];

export function assertLocales(
  value: unknown
): asserts value is readonly Locale[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("LOCALES must be a non-empty array");
  }
}

assertLocales(LOCALES);

export const locales = LOCALES;
export function resolveLocale(value: string | undefined): Locale {
  return locales.includes(value as Locale) ? (value as Locale) : "en";
}
