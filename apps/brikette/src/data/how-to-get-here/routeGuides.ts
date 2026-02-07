// src/data/how-to-get-here/routeGuides.ts
// Canonical mapping of how-to-get-here transport routes to guide keys.
// This is the single source of truth for registering routes as first-class guides.
//
// NOTE: Keys are kept as plain strings until TASK-02 adds them to GUIDE_SLUG_OVERRIDES,
// which allows them to participate in the GuideKey union type.

/**
 * Transport mode tags derived from the route slug.
 */
export type TransportModeTag = "bus" | "ferry" | "train";

/**
 * Location tags for origin/destination discovery.
 */
export type LocationTag =
  | "positano"
  | "amalfi"
  | "naples"
  | "salerno"
  | "ravello"
  | "sorrento"
  | "capri";

/**
 * Metadata for a how-to-get-here route registered as a guide.
 */
export interface HowToGetHereRouteGuide {
  /** The URL slug (matches routes.json key). */
  slug: string;
  /** Tags for discovery: always includes "transport" + mode(s) + location(s). */
  tags: readonly ["transport", ...Array<TransportModeTag | LocationTag>];
}

/**
 * Canonical mapping from guide key to route metadata.
 * Keys are camelCase versions of the slugs (e.g., "amalfi-positano-bus" → "amalfiPositanoBus").
 */
export const HOW_TO_GET_HERE_ROUTE_GUIDES = {
  amalfiPositanoBus: {
    slug: "amalfi-positano-bus",
    tags: ["transport", "bus", "amalfi", "positano"],
  },
  amalfiPositanoFerry: {
    slug: "amalfi-positano-ferry",
    tags: ["transport", "ferry", "amalfi", "positano"],
  },
  capriPositanoFerry: {
    slug: "capri-positano-ferry",
    tags: ["transport", "ferry", "capri", "positano"],
  },
  naplesAirportPositanoBus: {
    slug: "naples-airport-positano-bus",
    tags: ["transport", "bus", "naples", "positano"],
  },
  naplesCenterPositanoFerry: {
    slug: "naples-center-positano-ferry",
    tags: ["transport", "ferry", "naples", "positano"],
  },
  naplesCenterTrainBus: {
    slug: "naples-center-train-bus",
    tags: ["transport", "train", "bus", "naples", "positano"],
  },
  positanoAmalfiBus: {
    slug: "positano-amalfi-bus",
    tags: ["transport", "bus", "positano", "amalfi"],
  },
  positanoAmalfiFerry: {
    slug: "positano-amalfi-ferry",
    tags: ["transport", "ferry", "positano", "amalfi"],
  },
  positanoCapriFerry: {
    slug: "positano-capri-ferry",
    tags: ["transport", "ferry", "positano", "capri"],
  },
  positanoNaplesAirportBus: {
    slug: "positano-naples-airport-bus",
    tags: ["transport", "bus", "positano", "naples"],
  },
  positanoNaplesCenterBusTrain: {
    slug: "positano-naples-center-bus-train",
    tags: ["transport", "bus", "train", "positano", "naples"],
  },
  positanoNaplesCenterFerry: {
    slug: "positano-naples-center-ferry",
    tags: ["transport", "ferry", "positano", "naples"],
  },
  positanoRavelloBus: {
    slug: "positano-ravello-bus",
    tags: ["transport", "bus", "positano", "ravello"],
  },
  positanoRavelloFerryBus: {
    slug: "positano-ravello-ferry-bus",
    tags: ["transport", "ferry", "bus", "positano", "ravello"],
  },
  positanoSalernoBus: {
    slug: "positano-salerno-bus",
    tags: ["transport", "bus", "positano", "salerno"],
  },
  positanoSalernoFerry: {
    slug: "positano-salerno-ferry",
    tags: ["transport", "ferry", "positano", "salerno"],
  },
  positanoSorrentoBus: {
    slug: "positano-sorrento-bus",
    tags: ["transport", "bus", "positano", "sorrento"],
  },
  positanoSorrentoFerry: {
    slug: "positano-sorrento-ferry",
    tags: ["transport", "ferry", "positano", "sorrento"],
  },
  positanoToNaplesDirectionsByFerry: {
    slug: "positano-to-naples-directions-by-ferry",
    tags: ["transport", "ferry", "positano", "naples"],
  },
  ravelloPositanoBus: {
    slug: "ravello-positano-bus",
    tags: ["transport", "bus", "ravello", "positano"],
  },
  salernoPositanoBus: {
    slug: "salerno-positano-bus",
    tags: ["transport", "bus", "salerno", "positano"],
  },
  salernoPositanoFerry: {
    slug: "salerno-positano-ferry",
    tags: ["transport", "ferry", "salerno", "positano"],
  },
  sorrentoPositanoBus: {
    slug: "sorrento-positano-bus",
    tags: ["transport", "bus", "sorrento", "positano"],
  },
  sorrentoPositanoFerry: {
    slug: "sorrento-positano-ferry",
    tags: ["transport", "ferry", "sorrento", "positano"],
  },
} as const satisfies Record<string, HowToGetHereRouteGuide>;

/**
 * Type representing a how-to-get-here route guide key.
 */
export type HowToGetHereRouteGuideKey = keyof typeof HOW_TO_GET_HERE_ROUTE_GUIDES;

/**
 * Ordered list of all how-to-get-here route guide keys.
 * Stable ordering for iteration and URL inventory.
 */
export const HOW_TO_GET_HERE_ROUTE_GUIDE_KEYS = Object.freeze(
  Object.keys(HOW_TO_GET_HERE_ROUTE_GUIDES) as HowToGetHereRouteGuideKey[],
);

// Set for O(1) lookups
const HOW_TO_GET_HERE_ROUTE_GUIDE_KEY_SET = new Set<string>(
  HOW_TO_GET_HERE_ROUTE_GUIDE_KEYS,
);

/**
 * Type guard to check if a string is a valid how-to-get-here route guide key.
 */
export function isHowToGetHereRouteGuideKey(
  value: string,
): value is HowToGetHereRouteGuideKey {
  return HOW_TO_GET_HERE_ROUTE_GUIDE_KEY_SET.has(value);
}

/**
 * Get the slug for a how-to-get-here route guide key.
 */
export function getHowToGetHereRouteSlug(key: HowToGetHereRouteGuideKey): string {
  return HOW_TO_GET_HERE_ROUTE_GUIDES[key].slug;
}

/**
 * Get the tags for a how-to-get-here route guide key.
 */
export function getHowToGetHereRouteTags(
  key: HowToGetHereRouteGuideKey,
): readonly string[] {
  return HOW_TO_GET_HERE_ROUTE_GUIDES[key].tags;
}
