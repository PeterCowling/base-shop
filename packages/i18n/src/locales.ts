// packages/i18n/src/locales.ts
import { LOCALES, type Locale } from "@types";

export const locales = LOCALES;
export type { Locale };
export function resolveLocale(value: string | undefined): Locale {
  return locales.includes(value as Locale) ? (value as Locale) : "en";
}
