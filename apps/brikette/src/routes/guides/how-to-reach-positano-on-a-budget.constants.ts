import type { HTMLAttributeReferrerPolicy } from "react";

import { type GuideKey } from "@/routes.guides-helpers";

export const GUIDE_KEY = "reachBudget" satisfies GuideKey;
export const GUIDE_SLUG = "how-to-reach-positano-on-a-budget" as const;

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

export const MAP_EMBED_URL_FALLBACK =
  "https://www.google.com/maps/embed?pb=!1m28!1m12!1m3!1d768989.930376533!2d14.43034800958525!3d40.7530661290345!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m13!3e3!4m5!1s0x133b089b2b18a3e3%3A0x4bafc3f58a62a2a2!2sNaples%20International%20Airport%20(NAP)!3m2!1d40.8860031!2d14.2907817!4m5!1s0x133b98d2a1b9f60f%3A0x54a8f4e7a3413732!2sHostel%20Brikette%2C%20Via%20Guglielmo%20Marconi%2C%20358%2C%2084017%20Positano%20SA!3m2!1d40.6308766!2d14.487226!5e0!3m2!1sen!2sit!4v1700000000000";

export const MAP_REFERRER_POLICY: HTMLAttributeReferrerPolicy = "no-referrer-when-downgrade";

export const MAP_ALLOWED_HOSTS = new Set(["www.google.com", "maps.google.com"]);

export const REFERRER_POLICIES = new Set<HTMLAttributeReferrerPolicy>([
  "no-referrer",
  "no-referrer-when-downgrade",
  "origin",
  "origin-when-cross-origin",
  "same-origin",
  "strict-origin",
  "strict-origin-when-cross-origin",
  "unsafe-url",
]);

export const RELATED_GUIDES = [{ key: "ferrySchedules" }, { key: "pathOfTheGods" }, { key: "sitaTickets" }] as const;

export const ALSO_HELPFUL_TAGS = ["budgeting", "transport", "positano", "ferry", "bus"] as const;

export const DEFAULT_SECTION_IDS = {
  map: "map",
  steps: "steps",
  alternatives: "alternatives",
  costs: "costs",
  tips: "tips",
} as const;
