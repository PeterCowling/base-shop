import type { PorterGuideKey } from "./porter-service-positano.types";

export const GUIDE_KEY = "porterServices" satisfies PorterGuideKey;
export const GUIDE_SLUG = "porter-service-positano" as const;

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

export const HERO_IMAGE_PATH = "/img/positano-porter-stands.avif" as const;

export const GALLERY_IMAGES = [
  { path: "/img/positano-porter-stands.avif", width: 1200, height: 800 },
  { path: "/img/positano-luggage-cart.avif", width: 1200, height: 800 },
] as const;

export const RELATED_GUIDES = [
  { key: "ferryDockToBrikette" },
  { key: "chiesaNuovaArrivals" },
  { key: "chiesaNuovaDepartures" },
  { key: "ferrySchedules" },
] as const;

export const ALSO_HELPFUL_TAGS = ["porters", "logistics", "positano"] as const;
