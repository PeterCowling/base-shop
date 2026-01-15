import type { AppLanguage } from "../../i18n.config";
import { getSlug } from "../../utils/slug";
import type { GuideManifestEntry } from "../../routes/guides/guide-manifest";
import { getGuideManifestEntry, guideAreaToSlugKey } from "../../routes/guides/guide-manifest";
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

export function guideNamespaceKey(key: GuideKey): "experiences" | "howToGetHere" | "assistance" {
  const override = GUIDE_BASE_KEY_OVERRIDES[key];
  if (override) {
    return override;
  }
  const manifestEntry = getGuideManifestEntry(key);
  if (manifestEntry) {
    const primary = guideAreaToSlugKey(manifestEntry.primaryArea);
    if (primary === "experiences" || primary === "howToGetHere" || primary === "assistance") {
      return primary;
    }
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
    const manifestEntry = manifestLookup?.[key];
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

    const areaCandidates = manifestEntry
      ? [
          guideAreaToSlugKey(manifestEntry.primaryArea),
          ...manifestEntry.areas.map((area) => guideAreaToSlugKey(area)),
        ]
      : [guideNamespaceKey(key)];

    const uniqueAreas = Array.from(new Set(areaCandidates));

    for (const area of uniqueAreas) {
      if (area === "experiences" || area === "howToGetHere" || area === "assistance") {
        groups[area].push(key);
      }
    }
  }

  return groups;
}
