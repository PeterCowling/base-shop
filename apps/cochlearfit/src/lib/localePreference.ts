import { DEFAULT_LOCALE, LOCALES } from "@/lib/locales";
import type { Locale } from "@/types/locale";

const STORAGE_KEY = "cochlearfit:locale";

export function getPreferredLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  return LOCALES.includes(stored as Locale) ? (stored as Locale) : DEFAULT_LOCALE;
}

export function setPreferredLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, locale);
}
