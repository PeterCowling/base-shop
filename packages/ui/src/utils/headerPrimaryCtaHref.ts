import type { AppLanguage } from "../i18n.config";
import type { SlugMap } from "../slug-map";

import { translatePath } from "./translate-path";

export const HEADER_PRIMARY_CTA_BOOKING_OPTIONS_ID = "booking-options";

function normalizePath(pathname: string | null | undefined): string {
  if (!pathname) return "";
  const trimmed = pathname.trim();
  if (!trimmed) return "";
  return trimmed.endsWith("/") && trimmed !== "/" ? trimmed.slice(0, -1) : trimmed;
}

function isSectionPath(
  pathname: string,
  lang: AppLanguage,
  slugKey: "apartment" | "assistance" | "deals" | "howToGetHere" | "privateBooking",
): boolean {
  const sectionPath = `/${lang}/${translatePath(slugKey as keyof SlugMap, lang)}`;
  return pathname === sectionPath || pathname.startsWith(`${sectionPath}/`);
}

export function resolveHeaderPrimaryCtaHref(params: {
  lang: AppLanguage;
  pathname: string | null | undefined;
  primaryCtaHref?: string;
}): string {
  const { lang, pathname, primaryCtaHref } = params;
  if (primaryCtaHref) {
    return primaryCtaHref;
  }

  const normalizedPath = normalizePath(pathname);
  const hostelBookingPath = `/${lang}/${translatePath("book", lang)}`;
  if (!normalizedPath) {
    return hostelBookingPath;
  }

  const privateBookingPath = `/${lang}/${translatePath("privateBooking", lang)}`;
  if (
    isSectionPath(normalizedPath, lang, "apartment") ||
    isSectionPath(normalizedPath, lang, "privateBooking")
  ) {
    return privateBookingPath;
  }

  if (
    isSectionPath(normalizedPath, lang, "assistance") ||
    isSectionPath(normalizedPath, lang, "deals") ||
    isSectionPath(normalizedPath, lang, "howToGetHere")
  ) {
    return `${normalizedPath}#${HEADER_PRIMARY_CTA_BOOKING_OPTIONS_ID}`;
  }

  return hostelBookingPath;
}
