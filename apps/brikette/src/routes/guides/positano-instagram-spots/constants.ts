import type { GuideKey } from "@/routes.guides-helpers";

export const GUIDE_KEY = "instagramSpots" satisfies GuideKey;
export const GUIDE_SLUG = "positano-instagram-spots" as const;

export const FALLBACK_GALLERY = [
  "/img/hostel-communal-terrace-lush-view.webp",
  "/img/hostel-coastal-horizon.webp",
] as const;

export const OG_IMAGE = {
  path: "/img/hostel-communal-terrace-lush-view.webp",
  width: 1200,
  height: 630,
  transform: {
    width: 1200,
    height: 630,
    quality: 85,
    format: "auto",
  },
} as const;
