import type { Locale } from "@/types/locale";

export const LOCALES: Locale[] = ["en", "it", "es", "de"];
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: string | undefined): value is Locale {
  if (!value) return false;
  return LOCALES.includes(value as Locale);
}

export function resolveLocale(value: string | string[] | undefined): Locale {
  if (Array.isArray(value)) {
    return isLocale(value[0]) ? value[0] : DEFAULT_LOCALE;
  }
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function getLocaleFromPath(pathname: string): Locale {
  const [, maybeLocale] = pathname.split("/");
  return isLocale(maybeLocale) ? maybeLocale : DEFAULT_LOCALE;
}

export function toIntlLocale(locale: Locale): string {
  if (locale === "it") return "it-IT";
  if (locale === "es") return "es-ES";
  if (locale === "de") return "de-DE";
  return "en-US";
}
