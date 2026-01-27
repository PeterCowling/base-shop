import type { AppLanguage } from "../../i18n.config";
import type { GuideManifestEntry } from "../../routes/guides/guide-manifest";
import { getGuideManifestEntry, guideAreaToSlugKey } from "../../routes/guides/guide-manifest";
import { getSlug } from "../../utils/slug";

import type { GuideKey } from "./keys";
import { GUIDE_KEYS } from "./keys";

// Decide which top-level route base a guide should live under.
// Default is "experiences" unless explicitly overridden here.
export const GUIDE_BASE_KEY_OVERRIDES: Partial<Record<
  GuideKey,
  "howToGetHere" | "experiences" | "assistance"
>> = {
  chiesaNuovaArrivals: "howToGetHere",
  chiesaNuovaDepartures: "howToGetHere",
  ferryDockToBrikette: "howToGetHere",
  briketteToFerryDock: "howToGetHere",
  fornilloBeachToBrikette: "howToGetHere",
  // Point-to-point arrival/departure routes belong under How‑To‑Get‑Here
  naplesPositano: "howToGetHere",
  salernoPositano: "howToGetHere",
  // --- How-to-get-here transport routes (TASK-03) ---
  amalfiPositanoBus: "howToGetHere",
  amalfiPositanoFerry: "howToGetHere",
  capriPositanoFerry: "howToGetHere",
  naplesAirportPositanoBus: "howToGetHere",
  naplesCenterPositanoFerry: "howToGetHere",
  naplesCenterTrainBus: "howToGetHere",
  positanoAmalfiBus: "howToGetHere",
  positanoAmalfiFerry: "howToGetHere",
  positanoCapriFerry: "howToGetHere",
  positanoNaplesAirportBus: "howToGetHere",
  positanoNaplesCenterBusTrain: "howToGetHere",
  positanoNaplesCenterFerry: "howToGetHere",
  positanoRavelloBus: "howToGetHere",
  positanoRavelloFerryBus: "howToGetHere",
  positanoSalernoBus: "howToGetHere",
  positanoSalernoFerry: "howToGetHere",
  positanoSorrentoBus: "howToGetHere",
  positanoSorrentoFerry: "howToGetHere",
  positanoToNaplesDirectionsByFerry: "howToGetHere",
  ravelloPositanoBus: "howToGetHere",
  salernoPositanoBus: "howToGetHere",
  salernoPositanoFerry: "howToGetHere",
  sorrentoPositanoBus: "howToGetHere",
  sorrentoPositanoFerry: "howToGetHere",
  // --- End how-to-get-here transport routes ---
  // General planning/help belong under Assistance
  onlyHostel: "assistance",
  porterServices: "assistance",
  luggageStorage: "assistance",
  parking: "assistance",
  whatToPack: "assistance",
  simsAtms: "assistance",
  workCafes: "assistance",
  workAndTravelPositano: "assistance",
  workExchangeItaly: "assistance",
  ferrySchedules: "assistance",
  transportBudget: "assistance",
  transportMoneySaving: "assistance",
  interrailAmalfi: "assistance",
  travelInsuranceAmalfi: "assistance",
  couplesInHostels: "assistance",
  groceriesPharmacies: "assistance",
  hitchhikingAmalfi: "assistance",
  bestTimeToVisit: "assistance",
  positanoCostBreakdown: "assistance",
  positanoCostComparison: "assistance",
  howToGetToPositano: "assistance",
  budgetAccommodationBeyond: "assistance",
  offSeasonLongStay: "assistance",
  sorrentoGuide: "assistance",
  salernoGatewayGuide: "assistance",
  naplesCityGuide: "assistance",
  safetyAmalfi: "assistance",
  italianPhrasesCampania: "assistance",
  ecoFriendlyAmalfi: "assistance",
  drivingAmalfi: "assistance",
  laundryPositano: "assistance",
  publicTransportAmalfi: "assistance",
  salernoVsNaples: "assistance",
  sitaTickets: "assistance",
  travelFaqsAmalfi: "assistance",
  reachBudget: "assistance",
};

export function guideNamespaceKey(
  key: GuideKey,
  manifestEntry?: GuideManifestEntry,
): "experiences" | "howToGetHere" | "assistance" {
  // Manifest-first: if we have a manifest entry with areas, use primaryArea
  const entry = manifestEntry ?? getGuideManifestEntry(key);
  if (entry) {
    const primary = guideAreaToSlugKey(entry.primaryArea);
    if (primary === "experiences" || primary === "howToGetHere" || primary === "assistance") {
      return primary;
    }
  }

  // Fallback: check GUIDE_BASE_KEY_OVERRIDES for legacy compatibility
  const override = GUIDE_BASE_KEY_OVERRIDES[key];
  if (override) {
    return override;
  }

  return "experiences";
}

export function guideNamespace(
  lang: AppLanguage,
  key: GuideKey,
): { baseKey: "experiences" | "howToGetHere" | "assistance"; baseSlug: string } {
  const baseKey = guideNamespaceKey(key);
  const baseSlug = getSlug(baseKey, lang);
  return { baseKey, baseSlug };
}

// Group keys by base and filter by publication status depending on env.
export function publishedGuideKeysByBase(
  isProd: boolean,
  statusMap?: Readonly<Partial<Record<GuideKey, "draft" | "review" | "published">>>,
  manifestEntries?: ReadonlyArray<GuideManifestEntry>,
): { experiences: GuideKey[]; howToGetHere: GuideKey[]; assistance: GuideKey[] } {
  const groups = {
    experiences: [] as GuideKey[],
    howToGetHere: [] as GuideKey[],
    assistance: [] as GuideKey[],
  };

  const manifestLookup: Partial<Record<GuideKey, GuideManifestEntry>> | undefined =
    manifestEntries && manifestEntries.length > 0
      ? manifestEntries.reduce<Partial<Record<GuideKey, GuideManifestEntry>>>((acc, entry) => {
          acc[entry.key] = entry;
          return acc;
        }, {})
      : undefined;

  for (const key of GUIDE_KEYS as GuideKey[]) {
    const manifestEntry = manifestLookup?.[key] ?? getGuideManifestEntry(key);
    const status =
      statusMap?.[key] ??
      (manifestEntry
        ? manifestEntry.status === "live"
          ? "published"
          : (manifestEntry.status as "draft" | "review")
        : "published");

    if (isProd && status !== "published") {
      continue;
    }

    // Manifest-first: use manifest areas, fall back to GUIDE_BASE_KEY_OVERRIDES
    const areaCandidates = manifestEntry
      ? [
          guideAreaToSlugKey(manifestEntry.primaryArea),
          ...manifestEntry.areas.map((area) => guideAreaToSlugKey(area)),
        ]
      : (() => {
          // Legacy fallback when no manifest entry
          const override = GUIDE_BASE_KEY_OVERRIDES[key];
          return override ? [override] : ["experiences" as const];
        })();

    const uniqueAreas = Array.from(new Set(areaCandidates));

    for (const area of uniqueAreas) {
      if (area === "experiences" || area === "howToGetHere" || area === "assistance") {
        groups[area].push(key);
      }
    }
  }

  return groups;
}
