// src/data/assistance.tags.ts
// Map Assistance guide keys to high-level guide tags to power cross-links.
// Tags should match those used in src/data/guides.index.ts

import type { GuideKey } from "@/routes.guides-helpers";

// Partial because we only define tags for the assistance guides, not all guides.
export const ASSISTANCE_TAGS: Partial<Record<GuideKey, string[]>> = {
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
  hostelFaqs: ["hostel-life", "accommodation", "planning", "tips"],
};

export function tagsForAssistance(key: GuideKey | undefined): string[] {
  if (!key) return [];
  return ASSISTANCE_TAGS[key] ?? [];
}
