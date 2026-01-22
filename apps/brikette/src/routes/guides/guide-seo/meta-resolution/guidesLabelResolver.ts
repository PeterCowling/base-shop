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

  const englishTranslatorMeaningful =
    typeof englishGuidesTranslatorValue === "string" &&
    (() => {
      const trimmed = (englishGuidesTranslatorValue as string).trim();
      if (trimmed.length === 0) return false;
      if (trimmed.startsWith("［Stub］")) return false;
      const normalized = trimmed.toLowerCase();
      if (normalized === primaryKey.toLowerCase()) return false;
      if (normalized === altKey.toLowerCase()) return false;
      if (normalized === indexKey.toLowerCase()) return false;
      if (normalized === metaIndexKey.toLowerCase()) return false;
      if (normalized === nsKey.toLowerCase()) return false;
      return true;
    })();

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

  // Try English candidates
  const englishCandidates: string[] = [];
  if (typeof englishGuidesTranslatorValue === "string") {
    englishCandidates.push(englishGuidesTranslatorValue as string);
  }
  if (typeof englishGuidesResource === "string") {
    englishCandidates.push(englishGuidesResource as string);
  }
  try {
    const val = guidesEn(altKey) as unknown;
    if (typeof val === "string") englishCandidates.push(val);
  } catch {
    void 0;
  }
  try {
    const val = guidesEn(indexKey) as unknown;
    if (typeof val === "string") englishCandidates.push(val);
  } catch {
    void 0;
  }
  try {
    const val = hookI18n?.getFixedT?.("en", "guides")?.(metaIndexKey);
    if (typeof val === "string") englishCandidates.push(val);
  } catch {
    void 0;
  }
  try {
    const val = i18n.getFixedT?.("en", "guides")?.(metaIndexKey);
    if (typeof val === "string") englishCandidates.push(val);
  } catch {
    void 0;
  }

  for (const candidate of englishCandidates) {
    if (candidate === primaryKey) continue;
    const trimmed = candidate.trim();
    if (trimmed.length === 0) return "";
    if (
      trimmed.length > 0 &&
      trimmed !== altKey &&
      trimmed !== indexKey &&
      !trimmed.startsWith("［Stub］") &&
      (allowEnglishFallback || !englishFallbacks.has(trimmed.toLowerCase()))
    ) {
      return trimmed;
    }
  }

  return primaryKey;
}
