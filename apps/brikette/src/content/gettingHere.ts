// src/content/gettingHere.ts
// Centralised guide link groupings for "getting here" content. These arrays are
// reused across multiple guides to avoid duplicating the same route metadata in
// every translation file. Labels are sourced from each guide's
// `content.<slug>.linkLabel` entry so translators maintain a single canonical
// string per guide.

import type { GuideKey } from "@/routes.guides-helpers";

const ARRIVAL_ESSENTIALS = [
  "chiesaNuovaArrivals",
  "ferryDockToBrikette",
  "briketteToFerryDock",
  "fornilloBeachToBrikette",
  "ferrySchedules",
] as const satisfies readonly GuideKey[];

const ORIGIN_ROUTES = [
  "naplesPositano",
  "salernoPositano",
] as const satisfies readonly GuideKey[];

export const GETTING_HERE_LINK_SETS = Object.freeze({
  arrivalEssentials: ARRIVAL_ESSENTIALS,
  originRoutes: ORIGIN_ROUTES,
});

export type GettingHereLinkSetKey = keyof typeof GETTING_HERE_LINK_SETS;
