// src/routes/guides/positano-on-a-backpacker-budget/constants.ts
import type { GuideKey } from "@/routes.guides-helpers";

export const handle = { tags: ["budgeting", "itinerary", "positano"] } as const;

export const GUIDE_KEY: GuideKey = "backpackerItineraries";
export const GUIDE_SLUG = "positano-backpacker-budget-itineraries" as const;

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

export const SECTION_IDS = {
  day1: "day1",
  day2: "day2",
  day3: "day3",
  savings: "savings",
  food: "food",
  transport: "transport",
} as const;

export const RELATED_GUIDES = {
  items: [{ key: "reachBudget" }, { key: "pathOfTheGods" }, { key: "positanoAmalfi" }],
} as const;
