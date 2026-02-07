import type { SlugKey } from "@/types/slugs";

/**
 * Canonical first-segment names as implemented by App Router folders.
 * Localized slugs are rewritten/redirected to these segment names.
 */
export const INTERNAL_SEGMENT_BY_KEY: Readonly<Record<SlugKey, string>> = {
  rooms: "rooms",
  deals: "deals",
  careers: "careers",
  about: "about",
  assistance: "assistance",
  experiences: "experiences",
  howToGetHere: "how-to-get-here",
  apartment: "apartment",
  book: "book",
  guides: "guides",
  guidesTags: "tags",
  terms: "terms",
  houseRules: "house-rules",
  privacyPolicy: "privacy-policy",
  cookiePolicy: "cookie-policy",
  breakfastMenu: "breakfast-menu",
  barMenu: "bar-menu",
};

/**
 * Top-level localized section slugs that middleware resolves for first path segment.
 */
export const TOP_LEVEL_SEGMENT_KEYS: readonly SlugKey[] = [
  "rooms",
  "deals",
  "careers",
  "about",
  "assistance",
  "experiences",
  "howToGetHere",
  "apartment",
  "book",
  "guides",
  "terms",
  "houseRules",
  "privacyPolicy",
  "cookiePolicy",
  "breakfastMenu",
  "barMenu",
];

/**
 * Route sections intentionally included in static URL inventory for App Router.
 */
export const STATIC_EXPORT_SECTION_KEYS: readonly SlugKey[] = [
  "about",
  "rooms",
  "deals",
  "careers",
  "breakfastMenu",
  "barMenu",
  "terms",
  "houseRules",
  "privacyPolicy",
  "cookiePolicy",
  "assistance",
  "experiences",
  "howToGetHere",
  "book",
  "apartment",
];
