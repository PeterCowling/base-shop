// src/routes/guides/day-trip-capri-from-positano/constants.ts
import type { GuideKey } from "@/routes.guides-helpers";

export const handle = { tags: ["day-trip", "capri", "ferry", "positano"] };

export const GUIDE_KEY = "capriDayTrip" satisfies GuideKey;
export const GUIDE_SLUG = "day-trip-capri-from-positano" as const;

export const OG_IMAGE = {
  path: "/img/positano-panorama.avif",
  width: 1200,
  height: 630,
  transform: {
    width: 1200,
    height: 630,
    quality: 85,
    format: "auto",
  },
} as const;

export const RELATED_GUIDES = [{ key: "ferrySchedules" }, { key: "boatTours" }, { key: "whatToPack" }] as const;

export const ALSO_HELPFUL_TAGS = ["day-trip", "capri", "ferry", "positano"] as const;

export const GALLERY_IMAGE_SOURCES = [
  { key: "monteSolaro", path: "/img/capri-monte-solaro.avif" },
  { key: "gardensOfAugustus", path: "/img/capri-gardens-augustus.avif" },
] as const;
