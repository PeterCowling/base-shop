import { DEFAULT_LOCALE, LOCALES } from "@/lib/locales";
import type { Locale } from "@/types/locale";

export function stripLocale(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return "/";
  if (LOCALES.includes(parts[0] as Locale)) {
    return `/${parts.slice(1).join("/")}` || "/";
  }
  return pathname;
}

export function withLocale(pathname: string, locale: Locale): string {
  const trimmed = stripLocale(pathname);
  if (trimmed === "/") return `/${locale}`;
  return `/${locale}${trimmed}`;
}

export function replaceLocaleInPath(pathname: string, locale: Locale): string {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return withLocale(normalized, locale);
}

export function getCanonicalPath(locale: Locale, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const base = locale || DEFAULT_LOCALE;
  return `/${base}${normalized === "/" ? "" : normalized}`;
}
