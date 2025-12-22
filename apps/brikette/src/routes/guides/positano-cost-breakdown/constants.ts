import type { GuideKey } from "@/routes.guides-helpers";

export const handle = { tags: ["budgeting", "cost", "positano"] };

export const GUIDE_KEY = "positanoCostBreakdown" satisfies GuideKey;
export const GUIDE_SLUG = "positano-cost-breakdown" as const;

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

export const COST_ITEM_DEFS = [
  { key: "dorm", low: 25, mid: 45, high: 70 },
  { key: "private", low: 70, mid: 120, high: 200 },
  { key: "breakfast", low: 4, mid: 8, high: 15 },
  { key: "lunch", low: 6, mid: 12, high: 25 },
  { key: "dinner", low: 12, mid: 20, high: 40 },
  { key: "coffee", low: 2, mid: 4, high: 6 },
  { key: "bus", low: 4, mid: 6, high: 8 },
  { key: "ferry", low: 0, mid: 20, high: 40 },
  { key: "activities", low: 0, mid: 10, high: 60 },
] as const;
