/**
 * Guides breadcrumb label resolution utilities.
 */
import type { TFunction } from "i18next";

import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";

import type { Translator } from "../types";

import { toCandidate } from "./sanitizers";

type HookI18n = { getFixedT?: (lng: string, ns?: string) => TFunction };

interface GuidesLabelResolverParams {
  lang: AppLanguage;
  tGuides: Translator;
  guidesEn: Translator;
  hookI18n: HookI18n | undefined;
  englishGuidesResource: unknown;
  englishGuidesTranslatorValue: unknown;
}

/**
 * Build English fallback set for guides label.
 */
function buildEnglishFallbacks(
  englishGuidesResource: unknown,
  englishGuidesTranslatorValue: unknown,
  guidesEn: Translator,
  hookI18n: HookI18n | undefined,
): Set<string> {
  const altKey = "breadcrumbs.guides" as const;
  const indexKey = "labels.indexTitle" as const;
  const metaIndexKey = "meta.index.title" as const;
  const nsKey = "guides:labels.indexTitle" as const;

  const values = new Set<string>(["guides"]);
  const register = (candidate: unknown) => {
    if (typeof candidate !== "string") return;
    const trimmed = candidate.trim();
    if (trimmed.length === 0) return;
    values.add(trimmed.toLowerCase());
  };

  register(englishGuidesResource);
  register(englishGuidesTranslatorValue);

  try {
    register(guidesEn(altKey) as unknown);
  } catch {
    /* ignore */
  }
  try {
    register(guidesEn(indexKey) as unknown);
  } catch {
    /* ignore */
  }
  try {
    register(guidesEn(metaIndexKey) as unknown);
  } catch {
    /* ignore */
  }
  try {
    register(guidesEn(nsKey) as unknown);
  } catch {
    /* ignore */
  }
  try {
    register(hookI18n?.getFixedT?.("en", "guides")?.(metaIndexKey));
  } catch {
    /* ignore */
  }
  try {
    register(i18n.getFixedT?.("en", "guides")?.(metaIndexKey));
  } catch {
    /* ignore */
  }

  return values;
}

function isMeaningfulEnglishGuidesTranslatorValue(
  value: unknown,
  placeholders: readonly string[],
): boolean {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.startsWith("［Stub］")) return false;
  const normalized = trimmed.toLowerCase();
  return !placeholders.some((placeholder) => normalized === placeholder.toLowerCase());
}

function collectEnglishGuidesCandidates(params: {
  englishGuidesTranslatorValue: unknown;
  englishGuidesResource: unknown;
  guidesEn: Translator;
  hookI18n: HookI18n | undefined;
}): string[] {
  const { englishGuidesTranslatorValue, englishGuidesResource, guidesEn, hookI18n } = params;
  const candidates: string[] = [];
  const registerCandidate = (value: unknown) => {
    if (typeof value === "string") candidates.push(value);
  };

  registerCandidate(englishGuidesTranslatorValue);
  registerCandidate(englishGuidesResource);
  try {
    registerCandidate(guidesEn("breadcrumbs.guides"));
  } catch {
    void 0;
  }
  try {
    registerCandidate(guidesEn("labels.indexTitle"));
  } catch {
    void 0;
  }
  try {
    registerCandidate(hookI18n?.getFixedT?.("en", "guides")?.("meta.index.title"));
  } catch {
    void 0;
  }
  try {
    registerCandidate(i18n.getFixedT?.("en", "guides")?.("meta.index.title"));
  } catch {
    void 0;
  }

  return candidates;
}

function resolveGuidesFromEnglishCandidates(params: {
  candidates: string[];
  primaryKey: string;
  altKey: string;
  indexKey: string;
  allowEnglishFallback: boolean;
  englishFallbacks: Set<string>;
}): string | undefined {
  const { candidates, primaryKey, altKey, indexKey, allowEnglishFallback, englishFallbacks } = params;
  for (const candidate of candidates) {
    if (candidate === primaryKey) continue;
    const trimmed = candidate.trim();
    if (trimmed.length === 0) return "";
    if (trimmed === altKey || trimmed === indexKey || trimmed.startsWith("［Stub］")) continue;
    if (allowEnglishFallback || !englishFallbacks.has(trimmed.toLowerCase())) return trimmed;
  }
  return undefined;
}

/**
 * Resolve the guides breadcrumb label.
 */
export function resolveGuidesLabel({
  lang,
  tGuides,
  guidesEn,
  hookI18n,
  englishGuidesResource,
  englishGuidesTranslatorValue,
}: GuidesLabelResolverParams): string {
  const primaryKey = "labels.guidesBreadcrumb" as const;
  const altKey = "breadcrumbs.guides" as const;
  const indexKey = "labels.indexTitle" as const;
  const metaIndexKey = "meta.index.title" as const;
  const nsKey = "guides:labels.indexTitle" as const;

  const englishFallbacks = buildEnglishFallbacks(
    englishGuidesResource,
    englishGuidesTranslatorValue,
    guidesEn,
    hookI18n,
  );

  const englishTranslatorMeaningful = isMeaningfulEnglishGuidesTranslatorValue(
    englishGuidesTranslatorValue,
    [primaryKey, altKey, indexKey, metaIndexKey, nsKey],
  );

  const allowEnglishFallback = lang === "en" || englishTranslatorMeaningful;

  // Try localized keys
  const localizedKeys: Array<[unknown, string]> = [
    [tGuides(primaryKey) as unknown, primaryKey],
    [tGuides(altKey) as unknown, altKey],
    [tGuides(indexKey) as unknown, indexKey],
    [tGuides(metaIndexKey) as unknown, metaIndexKey],
    [tGuides(nsKey) as unknown, nsKey],
  ];

  for (const [raw, placeholder] of localizedKeys) {
    const disallowed = placeholder === primaryKey && !allowEnglishFallback ? ["Guides"] : [];
    const candidate = toCandidate(raw, placeholder, {
      disallowed,
      allowEnglishFallback,
      englishFallbacks,
      additionalPlaceholders: [primaryKey],
    });
    if (candidate !== null) return candidate;
  }

  // Check for empty English resources
  const englishTranslatorMissing = typeof englishGuidesTranslatorValue !== "string";
  const englishResourceBlank =
    typeof englishGuidesResource === "string" && (englishGuidesResource as string).trim().length === 0;
  if (englishTranslatorMissing && englishResourceBlank) return primaryKey;

  const englishCandidates = collectEnglishGuidesCandidates({
    englishGuidesTranslatorValue,
    englishGuidesResource,
    guidesEn,
    hookI18n,
  });
  const englishResolved = resolveGuidesFromEnglishCandidates({
    candidates: englishCandidates,
    primaryKey,
    altKey,
    indexKey,
    allowEnglishFallback,
    englishFallbacks,
  });
  if (typeof englishResolved !== "undefined") return englishResolved;

  return primaryKey;
}
