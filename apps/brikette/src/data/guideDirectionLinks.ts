// src/data/guideDirectionLinks.ts
// Maps guide keys to their associated direction/travel links

import type { GuideKey } from "@/routes.guides-helpers";

export interface DirectionLink {
  slug: string;
  labelKey: string;
  label?: string;
}

/**
 * Direction links for guides - maps guide keys to related "how to get here" pages.
 * Labels are resolved via i18n at render time using the labelKey.
 */
export const GUIDE_DIRECTION_LINKS: Partial<Record<GuideKey, DirectionLink[]>> = {
  // Add guide direction links as needed
  // Example:
  // positanoBeaches: [
  //   { slug: "naples-airport-bus", labelKey: "naplesAirport" },
  //   { slug: "arriving-by-ferry", labelKey: "ferry" },
  // ],
};
