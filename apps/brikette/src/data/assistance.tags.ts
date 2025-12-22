// src/data/assistance.tags.ts
// Map Assistance article keys to high-level guide tags to power cross-links.
// Tags should match those used in src/data/guides.index.ts

import type { HelpArticleKey } from "@/routes.assistance-helpers";

export const ASSISTANCE_TAGS: Record<HelpArticleKey, string[]> = {
  ageAccessibility: ["stairs", "safety", "positano"],
  bookingBasics: ["accommodation", "planning", "tips", "positano", "comparison"],
  changingCancelling: ["planning", "budgeting", "insurance", "tips"],
  checkinCheckout: ["logistics", "planning", "positano"],
  defectsDamages: ["safety", "hostel-life", "planning"],
  depositsPayments: ["budgeting", "planning", "comparison"],
  rules: ["hostel-life", "accommodation", "planning"],
  security: ["safety", "hostel-life", "legal"],
  legal: ["planning", "insurance"],
  arrivingByFerry: ["transport", "ferry", "bus", "logistics", "stairs", "porters"],
  naplesAirportBus: ["transport", "bus", "naples", "logistics", "planning"],
  travelHelp: ["transport", "planning", "positano"],
};

export function tagsForAssistance(key: HelpArticleKey | undefined): string[] {
  if (!key) return [];
  return ASSISTANCE_TAGS[key] ?? [];
}
