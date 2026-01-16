// src/data/guides.index.ts
import type { GuideKey } from "@/guides/slugs";

export type GuideSection = "help" | "experiences";
export type GuideMeta = {
  key: GuideKey;
  tags: string[];
  section: GuideSection;
  status?: "draft" | "review" | "published";
};

const GUIDES_INDEX_BASE: Array<GuideMeta | Omit<GuideMeta, "status">> = [
  { key: "onlyHostel", section: "help", tags: ["accommodation", "hostel-life", "positano"] },
  { key: "backpackerItineraries", section: "experiences", tags: ["budgeting", "itinerary", "positano"] },
  { key: "howToGetToPositano", section: "help", tags: ["transport", "decision", "positano"] },
  { key: "reachBudget", section: "help", tags: ["transport", "budgeting"] },
  { key: "ferrySchedules", section: "help", tags: ["transport", "ferry"] },
  { key: "pathOfTheGods", section: "experiences", tags: ["hiking", "stairs", "positano"] },
  { key: "pathOfTheGodsFerry", section: "experiences", tags: ["hiking", "ferry", "amalfi"] },
  { key: "pathOfTheGodsBus", section: "experiences", tags: ["hiking", "bus", "amalfi"] },
  { key: "pathOfTheGodsNocelle", section: "experiences", tags: ["hiking", "nocelle", "positano"] },
  { key: "topOfTheMountainHike", section: "experiences", tags: ["hiking", "positano", "viewpoints"] },
  {
    key: "santaMariaDelCastelloHike",
    section: "experiences",
    tags: ["hiking", "positano", "viewpoints", "village"],
    status: "published",
  },
  { key: "sunriseHike", section: "experiences", tags: ["hiking", "viewpoints", "positano"] },
  { key: "parking", section: "help", tags: ["transport", "car", "positano"] },
  { key: "luggageStorage", section: "help", tags: ["porters", "logistics", "positano"] },
  // Use the actual guide key that maps to src/routes/guides/positano-beaches.tsx
  { key: "positanoBeaches", section: "experiences", tags: ["beaches", "positano"] },
  { key: "positanoMainBeach", section: "experiences", tags: ["beaches", "positano", "tips"] },
  {
    key: "marinaDiPraiaBeaches",
    section: "experiences",
    tags: ["beaches", "praiano", "tips"],
  },
  {
    key: "fiordoDiFuroreBeachGuide",
    section: "experiences",
    tags: ["beaches", "furore", "tips"],
  },
  {
    key: "hostelBriketteToFiordoDiFuroreBus",
    section: "experiences",
    tags: ["beaches", "bus", "stairs", "positano", "furore"],
  },
  {
    key: "hostelBriketteToFornilloBeach",
    section: "experiences",
    tags: ["beaches", "stairs", "positano"],
  },
  {
    key: "fornilloBeachGuide",
    section: "experiences",
    tags: ["beaches", "positano", "tips"],
  },
  {
    key: "lauritoBeachGuide",
    section: "experiences",
    tags: ["beaches", "positano", "tips"],
  },
  {
    key: "gavitellaBeachGuide",
    section: "experiences",
    tags: ["beaches", "praiano", "tips"],
  },
  {
    key: "arienzoBeachClub",
    section: "experiences",
    tags: ["beaches", "positano", "tips"],
  },
  {
    key: "reginaGiovannaBath",
    section: "experiences",
    tags: ["beaches", "sorrento", "day-trip"],
  },
  {
    key: "hostelBriketteToReginaGiovannaBath",
    section: "experiences",
    tags: ["transport", "beaches", "sorrento", "bus"],
  },
  {
    key: "positanoMainBeachWalkDown",
    section: "experiences",
    tags: ["beaches", "stairs", "positano"],
  },
  {
    key: "positanoMainBeachBusDown",
    section: "experiences",
    tags: ["beaches", "bus", "stairs", "positano"],
  },
  {
    key: "positanoMainBeachWalkBack",
    section: "experiences",
    tags: ["beaches", "stairs", "positano"],
  },
  {
    key: "positanoMainBeachBusBack",
    section: "experiences",
    tags: ["beaches", "bus", "stairs", "positano"],
  },
  {
    key: "lauritoBeachBusDown",
    section: "experiences",
    tags: ["beaches", "bus", "stairs", "positano"],
  },
  {
    key: "lauritoBeachBusBack",
    section: "experiences",
    tags: ["beaches", "bus", "positano"],
  },
  {
    key: "arienzoBeachBusBack",
    section: "experiences",
    tags: ["beaches", "bus", "positano"],
  },
  {
    key: "hostelBriketteToArienzoBus",
    section: "experiences",
    tags: ["beaches", "bus", "positano"],
  },
  {
    key: "fiordoDiFuroreBusReturn",
    section: "experiences",
    tags: ["beaches", "bus", "amalfi"],
  },
  {
    key: "fornilloBeachToBrikette",
    section: "help",
    tags: ["beaches", "stairs", "positano", "bus"],
    status: "published",
  },
  { key: "positanoPompeii", section: "experiences", tags: ["day-trip", "pompeii", "transport"] },
  { key: "capriDayTrip", section: "experiences", tags: ["day-trip", "capri", "ferry"] },
  { key: "sitaTickets", section: "help", tags: ["transport", "bus"] },
  { key: "ferryCancellations", section: "help", tags: ["transport", "ferry"] },
  { key: "whatToPack", section: "help", tags: ["travel-tips"] },
  {
    key: "positanoAmalfi",
    section: "experiences",
    tags: ["transport", "amalfi", "positano", "ferry", "bus"],
  },
  {
    key: "positanoRavello",
    section: "experiences",
    tags: ["transport", "ravello", "positano", "bus", "ferry"],
  },
  { key: "sunsetViewpoints", section: "experiences", tags: ["photography", "viewpoints", "positano"] },
  { key: "simsAtms", section: "help", tags: ["connectivity", "logistics", "positano"] },
  { key: "bestTimeToVisit", section: "help", tags: ["seasonal", "positano"] },
  { key: "boatTours", section: "experiences", tags: ["experiences", "boat"] },
  { key: "porterServices", section: "help", tags: ["porters", "logistics", "positano"] },
  { key: "groceriesPharmacies", section: "help", tags: ["logistics", "positano"] },
  { key: "laundryPositano", section: "help", tags: ["laundry", "logistics", "positano"] },
  { key: "workCafes", section: "help", tags: ["connectivity", "digital-nomads", "positano"] },
  { key: "chiesaNuovaArrivals", section: "help", tags: ["stairs", "logistics", "positano"], status: "published" },
  { key: "chiesaNuovaDepartures", section: "help", tags: ["stairs", "logistics", "positano"], status: "published" },
  { key: "ferryDockToBrikette", section: "help", tags: ["porters", "stairs", "logistics", "positano"], status: "published" },
  { key: "briketteToFerryDock", section: "help", tags: ["porters", "stairs", "logistics", "positano", "ferry"], status: "published" },
  {
    key: "naplesPositano",
    section: "experiences",
    tags: ["transport", "naples", "positano", "ferry", "bus", "car"],
  },
  {
    key: "salernoPositano",
    section: "experiences",
    tags: ["transport", "salerno", "positano", "ferry", "bus"],
  },
  { key: "positanoBudget", section: "help", tags: ["budgeting", "positano", "travel-tips"] },
  { key: "cheapEats", section: "experiences", tags: ["budgeting", "cuisine", "positano"] },
  {
    key: "eatingOutPositano",
    section: "experiences",
    tags: ["cuisine", "positano", "experiences"],
  },
  { key: "positanoTravelGuide", section: "experiences", tags: ["positano", "pillar", "planning"] },
  { key: "freeThingsPositano", section: "experiences", tags: ["budgeting", "positano", "free"] },
  { key: "instagramSpots", section: "experiences", tags: ["photography", "viewpoints", "positano"] },
  { key: "ravelloFestival", section: "experiences", tags: ["event", "culture", "ravello"] },
  { key: "ferragostoPositano", section: "experiences", tags: ["event", "seasonal", "positano"] },
  { key: "limoncelloCuisine", section: "experiences", tags: ["cuisine", "culture", "positano"] },
  {
    key: "positanoDining",
    section: "experiences",
    tags: ["cuisine", "positano", "tips"],
  },
  { key: "itinerariesPillar", section: "experiences", tags: ["itinerary", "amalfi", "pillar"] },
  { key: "weekend48Positano", section: "experiences", tags: ["itinerary", "positano", "weekend"] },
  { key: "sevenDayNoCar", section: "experiences", tags: ["itinerary", "amalfi", "no-car"] },
  { key: "dayTripsAmalfi", section: "experiences", tags: ["itinerary", "day-trip", "amalfi", "capri", "pompeii", "ravello"] },
  { key: "transportBudget", section: "help", tags: ["transport", "budgeting", "passes"] },
  { key: "salernoVsNaples", section: "help", tags: ["transport", "budgeting", "decision"] },
  { key: "offSeasonLongStay", section: "help", tags: ["digital-nomads", "off-season", "positano"] },
  { key: "interrailAmalfi", section: "help", tags: ["transport", "train", "amalfi"] },
  { key: "budgetAccommodationBeyond", section: "help", tags: ["accommodation", "budgeting", "amalfi"] },
  { key: "capriOnABudget", section: "experiences", tags: ["budgeting", "capri", "day-trip"] },
  { key: "campingAmalfi", section: "experiences", tags: ["camping", "amalfi", "budgeting"] },
  { key: "positanoWinterBudget", section: "experiences", tags: ["seasonal", "winter", "positano", "budgeting"] },
  { key: "positanoCostBreakdown", section: "help", tags: ["budgeting", "cost", "positano"] },
  { key: "transportMoneySaving", section: "help", tags: ["budgeting", "transport", "tips"] },
  { key: "workAndTravelPositano", section: "help", tags: ["digital-nomads", "work-life", "positano"] },
  { key: "souvenirsAmalfi", section: "experiences", tags: ["souvenirs", "budgeting", "amalfi", "positano"] },
  { key: "backpackingSouthernItaly", section: "experiences", tags: ["itinerary", "southern-italy", "amalfi", "positano"] },
  { key: "positanoCostComparison", section: "help", tags: ["comparison", "cost", "positano"] },
  { key: "travelInsuranceAmalfi", section: "help", tags: ["insurance", "amalfi", "positano"] },
  { key: "hitchhikingAmalfi", section: "help", tags: ["hitchhiking", "amalfi", "budgeting"] },
  { key: "walkingTourAudio", section: "experiences", tags: ["walking-tour", "positano", "audio-guide"] },
  { key: "workExchangeItaly", section: "help", tags: ["work-exchange", "hostel-life", "italy"] },
  { key: "stayingFitAmalfi", section: "experiences", tags: ["wellness", "hiking", "positano"] },
  { key: "couplesInHostels", section: "help", tags: ["couples", "accommodation", "hostel-life"] },
  { key: "luminariaPraiano", section: "experiences", tags: ["event", "seasonal", "amalfi"] },
  // — Assistance (general planning/help) additions —
  { key: "sorrentoGuide", section: "help", tags: ["sorrento", "transport", "comparison", "day-trip"] },
  { key: "salernoGatewayGuide", section: "help", tags: ["salerno", "transport", "gateway", "ferry", "bus"] },
  { key: "naplesCityGuide", section: "help", tags: ["naples", "day-trip", "food", "culture"] },
  { key: "safetyAmalfi", section: "help", tags: ["safety", "positano", "amalfi", "general-tourists", "solo-travel"] },
  { key: "italianPhrasesCampania", section: "help", tags: ["language", "campania", "positano", "travel-tips"] },
  { key: "ecoFriendlyAmalfi", section: "help", tags: ["sustainability", "amalfi", "positano", "hiking", "travel-tips"] },
  { key: "drivingAmalfi", section: "help", tags: ["transport", "car", "amalfi", "positano", "couples", "families"] },
];

// Ensure every entry has an explicit status (default to 'published')
export const GUIDES_INDEX: GuideMeta[] = (GUIDES_INDEX_BASE as GuideMeta[]).map((g) => ({
  ...g,
  // Default all experiences and assistance (help) to draft unless explicitly overridden.
  // Individual guides can opt-in to publish via an explicit status.
  status: g.status ?? (g.section === "experiences" || g.section === "help" ? "draft" : "published"),
}));

const HELP_GUIDE_SECTION = "help" satisfies GuideSection;
const EXPERIENCES_GUIDE_SECTION = "experiences" satisfies GuideSection;

const helpGuides = GUIDES_INDEX.filter((guide) => guide.section === HELP_GUIDE_SECTION);
const experiencesGuides = GUIDES_INDEX.filter(
  (guide) => guide.section === EXPERIENCES_GUIDE_SECTION,
);

export const HELP_GUIDES = Object.freeze(helpGuides) as ReadonlyArray<GuideMeta>;
export const EXPERIENCES_GUIDES = Object.freeze(experiencesGuides) as ReadonlyArray<GuideMeta>;
export const EXPERIENCE_GUIDE_KEYS = Object.freeze(
  experiencesGuides.map((guide) => guide.key),
) as ReadonlyArray<GuideKey>;

export const GUIDE_SECTION_BY_KEY = Object.fromEntries(
  GUIDES_INDEX.map((guide) => [guide.key, guide.section])
) as Record<GuideKey, GuideSection>;

export const TAGS_BY_KEY = Object.fromEntries(
  GUIDES_INDEX.map((g) => [g.key, new Set(g.tags)])
) as Record<GuideKey, Set<string>>;

export const GUIDE_STATUS_BY_KEY = Object.freeze(
  Object.fromEntries(
    GUIDES_INDEX.map((guide) => [guide.key, (guide as { status?: string }).status ?? "published"]),
  ),
) as Readonly<Record<GuideKey, "draft" | "review" | "published">>;
