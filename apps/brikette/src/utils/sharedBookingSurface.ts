import { getPrivateRoomChildSlug } from "@acme/ui/config/privateRoomChildSlugs";

import type { AppLanguage } from "@/i18n.config";

import type { EntryAttributionPayload } from "./entryAttribution";
import { resolveIntentAwareBookingSurface } from "./intentAwareBookingSurface";
import { getDoubleRoomBookingPath, getPrivateBookingPath } from "./localizedRoutes";
import { getSlug } from "./slug";

function normalizePath(pathname: string | null | undefined): string {
  if (!pathname) return "";
  const trimmed = pathname.trim();
  if (!trimmed) return "";
  return trimmed.endsWith("/") && trimmed !== "/" ? trimmed.slice(0, -1) : trimmed;
}

function isSectionPath(pathname: string, lang: AppLanguage, slugKey: "apartment" | "privateBooking" | "deals" | "howToGetHere" | "assistance"): boolean {
  const sectionPath = `/${lang}/${getSlug(slugKey, lang)}`;
  return pathname === sectionPath || pathname.startsWith(`${sectionPath}/`);
}

function inferPrivateAttribution(
  pathname: string,
  lang: AppLanguage,
): EntryAttributionPayload | null {
  const normalizedPath = normalizePath(pathname);
  if (!normalizedPath) return null;

  const privateBookingPath = normalizePath(getPrivateBookingPath(lang));
  if (normalizedPath === privateBookingPath || normalizedPath.startsWith(`${privateBookingPath}/`)) {
    return {
      source_surface: "shared_booking_surface",
      source_cta: "private_booking_context",
      resolved_intent: "private",
      product_type: null,
      decision_mode: "direct_resolution",
      destination_funnel: "private",
      locale: lang,
      fallback_triggered: false,
      next_page: getPrivateBookingPath(lang),
    };
  }

  const privateSectionPath = `/${lang}/${getSlug("apartment", lang)}`;
  if (!normalizedPath.startsWith(privateSectionPath)) {
    return null;
  }

  const doubleRoomSlug = getPrivateRoomChildSlug("double-room", lang);
  const doubleRoomPath = `${privateSectionPath}/${doubleRoomSlug}`;
  const doubleRoomBookingPath = normalizePath(getDoubleRoomBookingPath(lang));
  const isDoubleRoomContext =
    normalizedPath === doubleRoomPath ||
    normalizedPath.startsWith(`${doubleRoomPath}/`) ||
    normalizedPath === doubleRoomBookingPath ||
    normalizedPath.startsWith(`${doubleRoomBookingPath}/`);

  return {
    source_surface: "shared_booking_surface",
    source_cta: "private_route_context",
    resolved_intent: "private",
    product_type: isDoubleRoomContext ? "double_private_room" : "apartment",
    decision_mode: "direct_resolution",
    destination_funnel: "private",
    locale: lang,
    fallback_triggered: false,
    next_page: isDoubleRoomContext ? getDoubleRoomBookingPath(lang) : getPrivateBookingPath(lang),
  };
}

export function shouldUseIntentAwareSharedBookingSurface(
  pathname: string | null | undefined,
  lang: AppLanguage,
  attribution: EntryAttributionPayload | null,
): boolean {
  const normalizedPath = normalizePath(pathname);
  if (!normalizedPath) {
    return attribution?.resolved_intent === "private";
  }

  return (
    isSectionPath(normalizedPath, lang, "apartment") ||
    isSectionPath(normalizedPath, lang, "privateBooking") ||
    isSectionPath(normalizedPath, lang, "deals") ||
    isSectionPath(normalizedPath, lang, "howToGetHere") ||
    isSectionPath(normalizedPath, lang, "assistance") ||
    attribution?.resolved_intent === "private"
  );
}

export function resolveSharedBookingSurface(
  lang: AppLanguage,
  pathname: string | null | undefined,
  attribution: EntryAttributionPayload | null,
) {
  const inferredPrivateAttribution = inferPrivateAttribution(normalizePath(pathname), lang);
  return resolveIntentAwareBookingSurface(lang, inferredPrivateAttribution ?? attribution);
}
