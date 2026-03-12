import type { SlugKey } from "@/types/slugs";

/**
 * Canonical first-segment names as implemented by App Router folders.
 * Localized slugs are rewritten/redirected to these segment names.
 */
export const INTERNAL_SEGMENT_BY_KEY: Readonly<Record<SlugKey, string>> = {
  rooms: "dorms",
  deals: "deals",
  careers: "careers",
  about: "about",
  assistance: "assistance",
  experiences: "experiences",
  howToGetHere: "how-to-get-here",
  apartment: "private-rooms",
  privateBooking: "book-private-accommodations",
  book: "book",
  guides: "guides",
  guidesTags: "tags",
  terms: "terms",
  houseRules: "house-rules",
  privacyPolicy: "privacy-policy",
  cookiePolicy: "cookie-policy",
  breakfastMenu: "breakfast-menu",
  barMenu: "bar-menu",
  doubleRoomBooking: "private-rooms/double-room/book",
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
  "privateBooking",
  "book",
  "guides",
  "terms",
  "houseRules",
  "privacyPolicy",
  "cookiePolicy",
  "breakfastMenu",
  "barMenu",
  "doubleRoomBooking",
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
  "privateBooking",
  "book",
  "apartment",
  "doubleRoomBooking",
];

/**
 * Public canonical sections that should appear in sitemap / hreflang inventories.
 * Booking landing routes stay indexable when they carry published metadata and
 * user-facing selection content, even if the eventual handoff is transactional.
 */
export const PUBLIC_INDEXABLE_SECTION_KEYS: readonly SlugKey[] = [
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
  "privateBooking",
  "apartment",
  "doubleRoomBooking",
];

/**
 * Localized section aliases that must exist for static guide navigation.
 * These are the sections that host guide entry points or guide taxonomies.
 */
export const STATIC_EXPORT_GUIDE_ALIAS_SECTION_KEYS: readonly SlugKey[] = [
  "assistance",
  "experiences",
  "howToGetHere",
];
