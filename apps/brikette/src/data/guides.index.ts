// src/data/guides.index.ts
import type { GuideKey } from "@/guides/slugs";
import { guideNamespaceKey } from "@/guides/slugs/namespaces";

import {
  HOW_TO_GET_HERE_ROUTE_GUIDE_KEYS,
  HOW_TO_GET_HERE_ROUTE_GUIDES,
  type HowToGetHereRouteGuideKey,
} from "./how-to-get-here/routeGuides";

/**
 * User-facing guide namespace taxonomy.
 *
 * This is the canonical type for guide areas as they appear in URLs and UI.
 * The manifest's internal `GuideArea` type (`"help" | "experience" | "howToGetHere"`)
 * is mapped to this via `guideAreaToSlugKey()` in guide-manifest.ts.
 *
 * @see guideAreaToSlugKey - maps internal manifest areas to user-facing slugs
 * @see guideNamespaceKey - determines the canonical namespace for a guide
 */
export type GuideNamespaceKey = "experiences" | "assistance" | "howToGetHere";

/**
 * Section type for GUIDES_INDEX and guide filtering.
 *
 * GUIDES_INDEX uses GuideNamespaceKey values (experiences, assistance, howToGetHere).
 * The legacy "help" value is included for backwards compatibility with block configs
 * that may still reference "help" - it will be normalized by normaliseGuideSection().
 *
 * New code should use GuideNamespaceKey values directly.
 */
export type GuideSection = GuideNamespaceKey | "help";

export type GuideMeta = {
  key: GuideKey;
  tags: string[];
  /** Derived from guideNamespaceKey() - the canonical namespace for this guide */
  section: GuideNamespaceKey;
  status?: "draft" | "review" | "published";
};

/** Internal type for declaring guide entries without section (section is derived) */
type GuideIndexEntry = {
  key: GuideKey;
  tags: string[];
  status?: "draft" | "review" | "published";
};

/**
 * Base guide index entries - section is derived from guideNamespaceKey() to ensure
 * consistency with URL routing. Only tags and status are declared here.
 */
const GUIDES_INDEX_BASE: GuideIndexEntry[] = [
  // --- Assistance articles (converted from legacy help system) ---
  { key: "rules", tags: ["policies", "hostel-life"], status: "draft" },
  { key: "ageAccessibility", tags: ["policies", "accessibility"], status: "draft" },
  { key: "arrivingByFerry", tags: ["transport", "ferry", "arrivals"], status: "draft" },
  { key: "changingCancelling", tags: ["booking", "cancellation"], status: "draft" },
  { key: "checkinCheckout", tags: ["booking", "hostel-life"], status: "draft" },
  { key: "defectsDamages", tags: ["policies", "hostel-life"], status: "draft" },
  { key: "depositsPayments", tags: ["booking", "payments"], status: "draft" },
  { key: "legal", tags: ["policies", "legal"], status: "draft" },
  { key: "naplesAirportBus", tags: ["transport", "bus", "naples"], status: "draft" },
  { key: "security", tags: ["policies", "safety", "hostel-life"], status: "draft" },
  { key: "travelHelp", tags: ["transport", "assistance"], status: "draft" },
  { key: "bookingBasics", tags: ["booking", "policies", "hostel-life"], status: "draft" },
  // --- End assistance articles ---

  { key: "onlyHostel", tags: ["accommodation", "hostel-life", "positano"] },
  { key: "howToGetToPositano", tags: ["transport", "decision", "positano"] },
  { key: "reachBudget", tags: ["transport", "budgeting"] },
  { key: "ferrySchedules", tags: ["transport", "ferry"] },
  { key: "pathOfTheGods", tags: ["hiking", "stairs", "positano"] },
  { key: "pathOfTheGodsFerry", tags: ["hiking", "ferry", "amalfi"] },
  { key: "pathOfTheGodsBus", tags: ["hiking", "bus", "amalfi"] },
  { key: "pathOfTheGodsNocelle", tags: ["hiking", "nocelle", "positano"] },
  { key: "topOfTheMountainHike", tags: ["hiking", "positano", "viewpoints"] },
  { key: "santaMariaDelCastelloHike", tags: ["hiking", "positano", "viewpoints", "village"], status: "published" },
  { key: "sunriseHike", tags: ["hiking", "viewpoints", "positano"] },
  { key: "parking", tags: ["transport", "car", "positano"] },
  { key: "luggageStorage", tags: ["porters", "logistics", "positano"] },
  // Use the actual guide key that maps to src/routes/guides/positano-beaches.tsx
  { key: "positanoBeaches", tags: ["beaches", "positano"] },
  { key: "positanoMainBeach", tags: ["beaches", "positano", "tips"] },
  { key: "marinaDiPraiaBeaches", tags: ["beaches", "praiano", "tips"] },
  { key: "fiordoDiFuroreBeachGuide", tags: ["beaches", "furore", "tips"] },
  { key: "hostelBriketteToFiordoDiFuroreBus", tags: ["beaches", "bus", "stairs", "positano", "furore"] },
  { key: "hostelBriketteToFornilloBeach", tags: ["beaches", "stairs", "positano"] },
  { key: "fornilloBeachGuide", tags: ["beaches", "positano", "tips"] },
  { key: "lauritoBeachGuide", tags: ["beaches", "positano", "tips"] },
  { key: "gavitellaBeachGuide", tags: ["beaches", "praiano", "tips"] },
  { key: "arienzoBeachClub", tags: ["beaches", "positano", "tips"] },
  { key: "reginaGiovannaBath", tags: ["beaches", "sorrento", "day-trip"] },
  { key: "hostelBriketteToReginaGiovannaBath", tags: ["transport", "beaches", "sorrento", "bus"] },
  { key: "positanoMainBeachWalkDown", tags: ["beaches", "stairs", "positano"] },
  { key: "positanoMainBeachBusDown", tags: ["beaches", "bus", "stairs", "positano"] },
  { key: "positanoMainBeachWalkBack", tags: ["beaches", "stairs", "positano"] },
  { key: "positanoMainBeachBusBack", tags: ["beaches", "bus", "stairs", "positano"] },
  { key: "lauritoBeachBusDown", tags: ["beaches", "bus", "stairs", "positano"] },
  { key: "lauritoBeachBusBack", tags: ["beaches", "bus", "positano"] },
  { key: "arienzoBeachBusBack", tags: ["beaches", "bus", "positano"] },
  { key: "hostelBriketteToArienzoBus", tags: ["beaches", "bus", "positano"] },
  { key: "fiordoDiFuroreBusReturn", tags: ["beaches", "bus", "amalfi"] },
  { key: "fornilloBeachToBrikette", tags: ["beaches", "stairs", "positano", "bus"], status: "published" },
  { key: "positanoPompeii", tags: ["day-trip", "pompeii", "transport"] },
  { key: "capriDayTrip", tags: ["day-trip", "capri", "ferry"] },
  { key: "sitaTickets", tags: ["transport", "bus"] },
  { key: "ferryCancellations", tags: ["transport", "ferry"] },
  { key: "whatToPack", tags: ["travel-tips"] },
  { key: "positanoAmalfi", tags: ["transport", "amalfi", "positano", "ferry", "bus"] },
  { key: "positanoRavello", tags: ["transport", "ravello", "positano", "bus", "ferry"] },
  { key: "sunsetViewpoints", tags: ["photography", "viewpoints", "positano"] },
  { key: "terraceSunsets", tags: ["bar", "sunset", "hostel-life", "positano"] },
  { key: "simsAtms", tags: ["connectivity", "logistics", "positano"] },
  { key: "digitalConcierge", tags: ["concierge", "assistance", "hostel-life", "positano"] },
  { key: "bestTimeToVisit", tags: ["seasonal", "positano"] },
  { key: "boatTours", tags: ["experiences", "boat"] },
  { key: "porterServices", tags: ["porters", "logistics", "positano"] },
  { key: "groceriesPharmacies", tags: ["logistics", "positano"] },
  { key: "laundryPositano", tags: ["laundry", "logistics", "positano"] },
  { key: "workCafes", tags: ["connectivity", "digital-nomads", "positano"] },
  { key: "chiesaNuovaArrivals", tags: ["stairs", "logistics", "positano"], status: "published" },
  { key: "chiesaNuovaDepartures", tags: ["stairs", "logistics", "positano"], status: "published" },
  { key: "ferryDockToBrikette", tags: ["porters", "stairs", "logistics", "positano"], status: "published" },
  { key: "briketteToFerryDock", tags: ["porters", "stairs", "logistics", "positano", "ferry"], status: "published" },
  { key: "naplesPositano", tags: ["transport", "naples", "positano", "ferry", "bus", "car"] },
  { key: "salernoPositano", tags: ["transport", "salerno", "positano", "ferry", "bus"] },
  { key: "positanoBudget", tags: ["budgeting", "positano", "travel-tips"] },
  { key: "cheapEats", tags: ["budgeting", "cuisine", "positano"] },
  { key: "eatingOutPositano", tags: ["cuisine", "positano", "experiences"] },
  { key: "positanoTravelGuide", tags: ["positano", "pillar", "planning"] },
  { key: "freeThingsPositano", tags: ["budgeting", "positano", "free"] },
  { key: "instagramSpots", tags: ["photography", "viewpoints", "positano"] },
  { key: "ravelloFestival", tags: ["event", "culture", "ravello"] },
  { key: "ferragostoPositano", tags: ["event", "seasonal", "positano"] },
  { key: "limoncelloCuisine", tags: ["cuisine", "culture", "positano"] },
  { key: "positanoDining", tags: ["cuisine", "positano", "tips"] },
  { key: "dayTripsAmalfi", tags: ["day-trip", "amalfi", "capri", "pompeii", "ravello"] },
  { key: "transportBudget", tags: ["transport", "budgeting", "passes"] },
  { key: "salernoVsNaples", tags: ["transport", "budgeting", "decision"] },
  { key: "offSeasonLongStay", tags: ["digital-nomads", "off-season", "positano"] },
  { key: "interrailAmalfi", tags: ["transport", "train", "amalfi"] },
  { key: "budgetAccommodationBeyond", tags: ["accommodation", "budgeting", "amalfi"] },
  { key: "capriOnABudget", tags: ["budgeting", "capri", "day-trip"] },
  { key: "campingAmalfi", tags: ["camping", "amalfi", "budgeting"] },
  { key: "positanoWinterBudget", tags: ["seasonal", "winter", "positano", "budgeting"] },
  { key: "positanoCostBreakdown", tags: ["budgeting", "cost", "positano"] },
  { key: "transportMoneySaving", tags: ["budgeting", "transport", "tips"] },
  { key: "workAndTravelPositano", tags: ["digital-nomads", "work-life", "positano"] },
  { key: "souvenirsAmalfi", tags: ["souvenirs", "budgeting", "amalfi", "positano"] },
  { key: "positanoCostComparison", tags: ["comparison", "cost", "positano"] },
  { key: "travelInsuranceAmalfi", tags: ["insurance", "amalfi", "positano"] },
  { key: "hitchhikingAmalfi", tags: ["hitchhiking", "amalfi", "budgeting"] },
  { key: "walkingTourAudio", tags: ["walking-tour", "positano", "audio-guide"] },
  { key: "workExchangeItaly", tags: ["work-exchange", "hostel-life", "italy"] },
  { key: "stayingFitPositano", tags: ["wellness", "hiking", "positano", "beach", "kayaking"] },
  { key: "couplesInHostels", tags: ["couples", "accommodation", "hostel-life"] },
  { key: "luminariaPraiano", tags: ["event", "seasonal", "amalfi"] },
  // — Assistance (general planning/help) additions —
  { key: "sorrentoGuide", tags: ["sorrento", "transport", "comparison", "day-trip"] },
  { key: "salernoGatewayGuide", tags: ["salerno", "transport", "gateway", "ferry", "bus"] },
  { key: "naplesCityGuide", tags: ["naples", "day-trip", "food", "culture"] },
  { key: "safetyAmalfi", tags: ["safety", "positano", "amalfi", "general-tourists", "solo-travel"] },
  { key: "italianPhrasesCampania", tags: ["language", "campania", "positano", "travel-tips"] },
  { key: "ecoFriendlyAmalfi", tags: ["sustainability", "amalfi", "positano", "hiking", "travel-tips"] },

  // --- How-to-get-here transport routes ---
  // Tags are derived from the canonical routeGuides.ts mapping (single source of truth).
  ...HOW_TO_GET_HERE_ROUTE_GUIDE_KEYS.map((key) => ({
    key: key as GuideKey,
    tags: [...HOW_TO_GET_HERE_ROUTE_GUIDES[key as HowToGetHereRouteGuideKey].tags],
    status: "published" as const,
  })),
  // --- End how-to-get-here transport routes ---
];

/**
 * Build GUIDES_INDEX by deriving section from guideNamespaceKey().
 * This ensures section always matches the canonical URL routing.
 */
export const GUIDES_INDEX: GuideMeta[] = GUIDES_INDEX_BASE.map((entry) => ({
  key: entry.key,
  tags: entry.tags,
  // Derive section from canonical namespace routing
  section: guideNamespaceKey(entry.key),
  // Default to published unless explicitly overridden
  status: entry.status ?? "published",
}));

// --- Area-based guide collections ---
// These collections group guides by their namespace (derived from guideNamespaceKey)

const experiencesGuides = GUIDES_INDEX.filter((guide) => guide.section === "experiences");
const assistanceGuides = GUIDES_INDEX.filter((guide) => guide.section === "assistance");
const howToGetHereGuides = GUIDES_INDEX.filter((guide) => guide.section === "howToGetHere");

/** Guides in the experiences namespace */
export const EXPERIENCES_GUIDES = Object.freeze(experiencesGuides) as ReadonlyArray<GuideMeta>;

/** Guides in the assistance namespace */
export const ASSISTANCE_GUIDES = Object.freeze(assistanceGuides) as ReadonlyArray<GuideMeta>;

/** Guides in the how-to-get-here namespace */
export const HOW_TO_GET_HERE_GUIDES = Object.freeze(howToGetHereGuides) as ReadonlyArray<GuideMeta>;

/**
 * @deprecated Use ASSISTANCE_GUIDES instead. This alias exists for backwards compatibility
 * and will be removed in TASK-03 when all consumers are updated.
 */
export const HELP_GUIDES = ASSISTANCE_GUIDES;

export const EXPERIENCE_GUIDE_KEYS = Object.freeze(
  experiencesGuides.map((guide) => guide.key),
) as ReadonlyArray<GuideKey>;

export const GUIDE_SECTION_BY_KEY = Object.fromEntries(
  GUIDES_INDEX.map((guide) => [guide.key, guide.section])
) as Record<GuideKey, GuideNamespaceKey>;

export const TAGS_BY_KEY = Object.fromEntries(
  GUIDES_INDEX.map((g) => [g.key, new Set(g.tags)])
) as Record<GuideKey, Set<string>>;

export const GUIDE_STATUS_BY_KEY = Object.freeze(
  Object.fromEntries(
    GUIDES_INDEX.map((guide) => [guide.key, (guide as { status?: string }).status ?? "published"]),
  ),
) as Readonly<Record<GuideKey, "draft" | "review" | "published">>;

// --- Guide Type Classification ---
// Directions guides are about getting to/from places (routes, transport instructions)
// Content guides are about the places/experiences themselves

export type GuideType = "content" | "directions";

/**
 * Patterns that indicate a guide is about directions/routes rather than content
 */
const DIRECTIONS_PATTERNS = [
  /^hostelBriketteTo/i,    // hostelBriketteTo* - directions from hostel
  /ToBrikette$/i,          // *ToBrikette - directions back to hostel
  /ToHostel$/i,            // *ToHostel - directions back to hostel
  /WalkDown$/i,            // *WalkDown - walking route down
  /WalkBack$/i,            // *WalkBack - walking route back
  /BusDown$/i,             // *BusDown - bus route down
  /BusBack$/i,             // *BusBack - bus route back
  /BusReturn$/i,           // *BusReturn - bus return route
  /FerryReturn$/i,         // *FerryReturn - ferry return route
] as const;

/**
 * Determines if a guide is a directions guide based on its key
 */
export function isDirectionsGuide(guideKey: string): boolean {
  return DIRECTIONS_PATTERNS.some((pattern) => pattern.test(guideKey));
}

/**
 * Gets the guide type (content or directions) for a guide
 */
export function getGuideType(guide: GuideMeta): GuideType {
  return isDirectionsGuide(guide.key) ? "directions" : "content";
}

/**
 * Splits an array of guides into content guides and directions guides
 */
export function splitGuidesByType(guides: GuideMeta[]): {
  contentGuides: GuideMeta[];
  directionsGuides: GuideMeta[];
} {
  const contentGuides: GuideMeta[] = [];
  const directionsGuides: GuideMeta[] = [];

  for (const guide of guides) {
    if (isDirectionsGuide(guide.key)) {
      directionsGuides.push(guide);
    } else {
      contentGuides.push(guide);
    }
  }

  return { contentGuides, directionsGuides };
}
