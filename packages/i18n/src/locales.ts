// packages/i18n/src/locales.ts
// Supported locales
// Source of truth comes from @acme/types/constants to keep packages consistent.
import { LOCALES as BASE_LOCALES, type Locale as BaseLocale } from "@acme/types";

export const LOCALES = BASE_LOCALES;
export type Locale = BaseLocale;

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
