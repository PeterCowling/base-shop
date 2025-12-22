// src/routes/guides/luggage-storage-positano.constants.ts
import type { GuideKey } from "@/routes.guides-helpers";

export const handle = { tags: ["porters", "logistics", "positano"] };

export const GUIDE_KEY = "luggageStorage" as const satisfies GuideKey;
export const GUIDE_SLUG = "luggage-storage-positano" as const;

export const HERO_IMAGE_PATH = "/img/positano-luggage-cart.avif" as const;
export const HERO_IMAGE_DIMENSIONS = { width: 1200, height: 800 } as const;

export const OG_IMAGE_PATH = "/img/positano-panorama.avif" as const;
export const OG_IMAGE_DIMENSIONS = { width: 1200, height: 630 } as const;

export const IMAGE_QUALITY = 85;
export const DEFAULT_IMAGE_FORMAT = "auto" as const;
