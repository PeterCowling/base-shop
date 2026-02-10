import "server-only";

import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import { extractGuidesBundle } from "@/utils/extractGuideBundle";

import {
  ASSISTANCE_INDEX_SEEDED_NAMESPACES,
  type AssistanceIndexI18nSeed,
  type AssistanceNamespaceBundleMap,
} from "../[lang]/assistance/i18n-bundle";

import { getTranslations } from "./i18n-server";

const HELPFUL_GUIDE_KEYS = [
  "ageAccessibility",
  "bookingBasics",
  "defectsDamages",
  "depositsPayments",
  "security",
  "travelHelp",
  "simsAtms",
  "whatToPack",
  "bestTimeToVisit",
] as const;

const POPULAR_GUIDE_KEYS = [
  "naplesAirportPositanoBus",
  "positanoNaplesCenterBusTrain",
  "ferryDockToBrikette",
  "chiesaNuovaArrivals",
  "pathOfTheGods",
  "cheapEats",
  "dayTripsAmalfi",
  "positanoBeaches",
] as const;

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
}

function getBundle(lang: AppLanguage | "en", namespace: string): Record<string, unknown> | undefined {
  return asRecord(i18n.getResourceBundle(lang, namespace));
}

function collectQuickLinkGuideKeys(bundle: Record<string, unknown> | undefined): string[] {
  if (!bundle) return [];
  const quickLinks = bundle["quickLinks"];
  if (!Array.isArray(quickLinks)) return [];

  const keys: string[] = [];
  for (const item of quickLinks) {
    const record = asRecord(item);
    const slug = record?.["slug"];
    if (typeof slug === "string" && slug.trim().length > 0) {
      keys.push(slug.trim());
    }
  }
  return keys;
}

function buildNamespaceMap(
  lang: AppLanguage | "en",
): AssistanceNamespaceBundleMap | undefined {
  const map: AssistanceNamespaceBundleMap = {};
  for (const namespace of ASSISTANCE_INDEX_SEEDED_NAMESPACES) {
    const bundle = getBundle(lang, namespace);
    if (bundle) {
      map[namespace] = bundle;
    }
  }
  return Object.keys(map).length > 0 ? map : undefined;
}

export async function loadAssistanceIndexI18nBundle(
  lang: AppLanguage,
): Promise<AssistanceIndexI18nSeed> {
  await getTranslations(lang, [...ASSISTANCE_INDEX_SEEDED_NAMESPACES, "guides"]);

  const localizedAssistance = getBundle(lang, "assistance");
  const englishAssistance = lang === "en" ? undefined : getBundle("en", "assistance");

  const guideKeys = new Set<string>([
    ...HELPFUL_GUIDE_KEYS,
    ...POPULAR_GUIDE_KEYS,
    ...collectQuickLinkGuideKeys(localizedAssistance),
    ...collectQuickLinkGuideKeys(englishAssistance),
  ]);
  const guideKeyList = [...guideKeys];

  return {
    lang,
    namespaces: buildNamespaceMap(lang),
    namespacesEn: lang === "en" ? undefined : buildNamespaceMap("en"),
    guides: extractGuidesBundle(lang, guideKeyList),
    guidesEn: lang === "en" ? undefined : extractGuidesBundle("en", guideKeyList),
  };
}
