import type { AppLanguage } from "@/i18n.config";

import type { EntryAttributionPayload } from "./entryAttribution";
import type { EntryAttributionParams } from "./ga4-events";
import { getBookPath } from "./localizedRoutes";
import {
  resolveSharedBookingSurface,
  shouldUseIntentAwareSharedBookingSurface,
} from "./sharedBookingSurface";

export const HEADER_BOOKING_OPTIONS_ID = "booking-options";

type HeaderPrimaryCtaAttribution = Omit<EntryAttributionParams, "source_cta">;

export type HeaderPrimaryCtaTarget = {
  href: string;
  attribution: HeaderPrimaryCtaAttribution | null;
};

function normalizePath(pathname: string | null | undefined): string {
  if (!pathname) return "";
  const trimmed = pathname.trim();
  if (!trimmed) return "";
  return trimmed.endsWith("/") && trimmed !== "/" ? trimmed.slice(0, -1) : trimmed;
}

export function resolveHeaderPrimaryCtaTarget(
  lang: AppLanguage,
  pathname: string | null | undefined,
  attribution: EntryAttributionPayload | null,
): HeaderPrimaryCtaTarget {
  const normalizedPath = normalizePath(pathname);
  const hostelHref = getBookPath(lang);

  if (!shouldUseIntentAwareSharedBookingSurface(normalizedPath, lang, attribution)) {
    return {
      href: hostelHref,
      attribution: {
        source_surface: "sitewide_shell",
        resolved_intent: "hostel",
        product_type: null,
        decision_mode: "direct_resolution",
        destination_funnel: "hostel_central",
        locale: lang,
        fallback_triggered: false,
        next_page: hostelHref,
      },
    };
  }

  const bookingSurface = resolveSharedBookingSurface(lang, normalizedPath, attribution);
  if (bookingSurface.mode === "chooser") {
    return {
      href: `${normalizedPath || `/${lang}`}#${HEADER_BOOKING_OPTIONS_ID}`,
      attribution: null,
    };
  }

  return {
    href: bookingSurface.primary.href,
    attribution: {
      source_surface: "sitewide_shell",
      resolved_intent: bookingSurface.primary.resolvedIntent,
      product_type: bookingSurface.primary.productType,
      decision_mode: bookingSurface.primary.decisionMode,
      destination_funnel: bookingSurface.primary.destinationFunnel,
      locale: lang,
      fallback_triggered: false,
      next_page: bookingSurface.primary.href,
    },
  };
}
