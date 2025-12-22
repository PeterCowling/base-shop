import type { GuideKey } from "@/routes.guides-helpers";

export const GUIDE_KEY = "briketteToFerryDock" satisfies GuideKey;

export const HERO_IMAGE_PATH = "/img/positano-dock-arrivals.avif" as const;

export const OG_IMAGE = {
  path: HERO_IMAGE_PATH,
  width: 1200,
  height: 630,
  transform: { width: 1200, height: 630, quality: 85, format: "auto" },
} as const;

export const RELATED_GUIDES = [
  { key: "porterServices" },
  { key: "ferryDockToBrikette" },
  { key: "ferrySchedules" },
] as const;

export const ALSO_HELPFUL_TAGS = ["porters", "stairs", "logistics", "positano", "ferry"] as const;

export const REQUIRED_NAMESPACES = [
  "guides",
  "guidesFallback",
  "header",
  "assistanceCommon",
] as const;
