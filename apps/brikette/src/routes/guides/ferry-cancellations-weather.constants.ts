import type { GuideKey } from "@/routes.guides-helpers";

export const GUIDE_KEY = "ferryCancellations" satisfies GuideKey;
export const GUIDE_SLUG = "ferry-cancellations-weather" as const;

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

export const HERO_IMAGE_PATH = "/img/positano-panorama.avif" as const;
export const SECONDARY_IMAGE_PATH = "/img/amalfi-ferry.avif" as const;

export const RELATED_ITEMS = [
  { key: "ferrySchedules" },
  { key: "publicTransportAmalfi" },
  { key: "naplesPositano" },
] as const;

export const ALSO_HELPFUL_TAGS = ["transport", "ferry", "positano", "bus"] as const;
