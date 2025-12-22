import type { GuideKey } from "@/routes.guides-helpers";

export const GUIDE_KEY = "chiesaNuovaDepartures" satisfies GuideKey;

export const OG_IMAGE = {
  path: "/img/positano-panorama.avif",
  width: 1200,
  height: 630,
  transform: { width: 1200, height: 630, quality: 85, format: "auto" },
} as const;

export const STOP_IMAGE_SRC = "/img/directions/positano-bus-stop.png" as const;

export const RELATED_GUIDES = [
  { key: "chiesaNuovaArrivals" },
  { key: "ferryDockToBrikette" },
  { key: "porterServices" },
] as const;

export const ALSO_HELPFUL_TAGS = ["stairs", "logistics", "positano"] as const;

export const REQUIRED_NAMESPACES = [
  "guides",
  "guidesFallback",
  "header",
  "assistanceCommon",
] as const;
