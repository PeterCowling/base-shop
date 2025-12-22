// src/routes/guides/laundry-positano/constants.ts
import type { GuideKey } from "@/routes.guides-helpers";

export const GUIDE_KEY = "laundryPositano" satisfies GuideKey;
export const GUIDE_SLUG = "laundry-positano" as const;

export const OG_IMAGE = {
  path: "/img/positano-laundry.avif",
  width: 1200,
  height: 630,
  transform: {
    width: 1200,
    height: 630,
    quality: 85,
    format: "auto",
  },
} as const;

export const GALLERY_IMAGES = [
  { path: "/img/positano-laundry.avif", width: 1200, height: 630 },
  { path: "/img/positano-sink.avif", width: 1200, height: 800 },
] as const;

export const RELATED_GUIDES = [{ key: "porterServices" }, { key: "ferryDockToBrikette" }, { key: "groceriesPharmacies" }] as const;

export const ALSO_HELPFUL_TAGS = ["laundry", "logistics", "positano"] as const;
