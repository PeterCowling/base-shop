// src/routes/guides/how-to-get-to-positano.constants.ts
import type { GuideKey } from "@/routes.guides-helpers";

export const GUIDE_KEY = "howToGetToPositano" satisfies GuideKey;
export const GUIDE_SLUG = "how-to-get-to-positano" as const;

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

export const RELATED_GUIDES = [
  { key: "ferrySchedules" },
  { key: "naplesPositano" },
  { key: "salernoPositano" },
] as const;

export const GUIDE_TAGS = ["transport", "decision", "positano", "ferry", "bus"] as const;

export const ALSO_HELPFUL_TAGS = ["transport", "decision", "positano", "bus", "ferry"] as const;
