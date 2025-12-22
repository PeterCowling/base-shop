import type { GuideKey } from "@/routes.guides-helpers";

export const GUIDE_KEY = "pathOfTheGods" satisfies GuideKey;
export const GUIDE_SLUG = "path-of-the-gods" as const;

export const PATH_OF_THE_GODS_HANDLE = { tags: ["hiking", "nocelle", "stairs", "positano"] } as const;

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

export const GALLERY_IMAGE_CONFIG = [
  { path: "/img/positano-panorama.avif", width: 1200, height: 630 },
  // Use an existing sunset asset to avoid 404s in dev
  { path: "/img/hostel-coastal-horizon.webp", width: 1200, height: 800 },
] as const;
