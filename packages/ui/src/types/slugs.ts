/* src/types/slugs.ts */
import type { AppLanguage } from "@acme/ui/i18n.config";

/**
 * Mapping of every navigable route slug to its localised-per-language
 * equivalents. Every key MUST be present for every supported language.
 */
export type SlugMap = {
  rooms: Record<AppLanguage, string>;
  deals: Record<AppLanguage, string>;
  careers: Record<AppLanguage, string>;
  about: Record<AppLanguage, string>;
  assistance: Record<AppLanguage, string>;
  experiences: Record<AppLanguage, string>;
  howToGetHere: Record<AppLanguage, string>;
  apartment: Record<AppLanguage, string>;
  /** Booking landing page */
  book: Record<AppLanguage, string>;
  /** Travel guides (SEO content hub) */
  guides: Record<AppLanguage, string>;
  /** Guides tag index */
  guidesTags: Record<AppLanguage, string>;
  /** Terms & Conditions for room bookings */
  terms: Record<AppLanguage, string>;
  /** Public breakfast menu */
  breakfastMenu: Record<AppLanguage, string>;
  /** Public bar menu */
  barMenu: Record<AppLanguage, string>;
};

/** Convenience helper for `keyof SlugMap` usage. */
export type SlugKey = keyof SlugMap;
