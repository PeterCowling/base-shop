import type { GuideKey } from "@/routes.guides-helpers";

export const handle = { tags: ["positano", "pillar", "planning"] };

export const GUIDE_KEY = "positanoTravelGuide" satisfies GuideKey;
export const GUIDE_SLUG = "positano-travel-guide" as const;

export const FALLBACK_GALLERY = [
  "/img/hostel-communal-terrace-lush-view.webp",
  "/img/positano-panorama.avif",
] as const;

export const OG_IMAGE = {
  path: "/img/landing-xl.webp",
  width: 1200,
  height: 630,
  transform: {
    width: 1200,
    height: 630,
    quality: 85,
    format: "auto",
  },
} as const;

export const POSITANO_TRAVEL_GUIDE_CONTENT_KEY = `content.${GUIDE_KEY}` as const;
export const POSITANO_TRAVEL_GUIDE_FALLBACK_KEY = `${POSITANO_TRAVEL_GUIDE_CONTENT_KEY}.fallback` as const;
