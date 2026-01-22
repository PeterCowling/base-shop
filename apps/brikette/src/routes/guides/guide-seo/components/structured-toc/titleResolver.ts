/**
 * ToC title resolution utilities.
 */
import i18nApp from "@/i18n";

import type { GuideSeoTemplateContext, Translator } from "../../types";
import type { FallbackTranslator } from "../../utils/fallbacks";

import type { StructuredTocOverride } from "./policies";

interface TitleResolverParams {
  guideKey: GuideSeoTemplateContext["guideKey"];
  tGuides: Translator;
  fallbackTranslator: FallbackTranslator | undefined;
  fallbackToEnTocTitle: boolean;
  policy: StructuredTocOverride;
}

/**
 * Check if a value is a meaningful string (not empty, not just a key placeholder).
 */
export function isMeaningful(val: unknown, key: string, guideKey: string): val is string {
  if (typeof val !== "string") return false;
  const trimmed = val.trim();
  if (!trimmed) return false;
  if (trimmed === key) return false;
  if (trimmed === guideKey) return false;
  return true;
}

/**
 * Resolve the title text for the ToC.
 */
export function resolveTocTitleText({
  guideKey,
  tGuides,
  fallbackTranslator,
  fallbackToEnTocTitle,
}: TitleResolverParams): string {
  const primaryTitleRaw = tGuides(`content.${guideKey}.toc.title`) as string;
  const fallbackTitleRaw = tGuides(`content.${guideKey}.tocTitle`) as string;

  const fallbackTitleFromStructured = (() => {
    const translator = fallbackTranslator;
    if (typeof translator !== "function") return undefined;
    const primary = translator(`content.${guideKey}.tocTitle`) as string;
    if (isMeaningful(primary, `content.${guideKey}.tocTitle`, guideKey)) return primary;
    const alternate = translator(`${guideKey}.tocTitle`) as string;
    return isMeaningful(alternate, `${guideKey}.tocTitle`, guideKey) ? alternate : undefined;
  })();

  if (isMeaningful(primaryTitleRaw, `content.${guideKey}.toc.title`, guideKey)) return primaryTitleRaw;
  if (isMeaningful(fallbackTitleRaw, `content.${guideKey}.tocTitle`, guideKey)) return fallbackTitleRaw;
  if (typeof fallbackTitleFromStructured !== "undefined") return fallbackTitleFromStructured;

  // Fallback to English structured title when the localized keys are blank.
  if (fallbackToEnTocTitle !== false) {
    try {
      const getEn = i18nApp?.getFixedT?.("en", "guides");
      if (typeof getEn === "function") {
        const enTitleRaw = getEn(`content.${guideKey}.toc.title`) as unknown;
        if (isMeaningful(enTitleRaw, `content.${guideKey}.toc.title`, guideKey)) return String(enTitleRaw);
      }
    } catch {
      /* noop: fall through to generic label */
    }
  }

  // Final fallback: localized generic label (labels.onThisPage) or default English
  try {
    const generic = tGuides("labels.onThisPage") as unknown;
    if (typeof generic === "string") {
      const trimmed = generic.trim();
      if (trimmed.length > 0 && trimmed !== "labels.onThisPage") return trimmed;
    }
  } catch {
    /* noop */
  }

  return "On this page";
}

/**
 * Resolve the title prop for the ToC component.
 */
export function resolveTocTitleProp(
  titleText: string,
  suppressTocTitle: boolean | undefined,
  policy: StructuredTocOverride,
): string | undefined {
  if (typeof titleText !== "string") return undefined;
  const t = titleText.trim();
  if (!t || t === "labels.onThisPage") return undefined;

  // Suppress the generic fallback label ("On this page") by default so that
  // route-specific English fallbacks can be applied.
  if (t === "On this page") {
    if (policy.allowOnThisPageTitle) return t;
    return undefined;
  }

  if (suppressTocTitle) return undefined;

  return t;
}

/**
 * Try to resolve EN title fallback when policy requires it.
 */
export function resolveEnTitleFallback(
  guideKey: GuideSeoTemplateContext["guideKey"],
): string | undefined {
  try {
    const getEn = i18nApp?.getFixedT?.("en", "guides");
    if (typeof getEn === "function") {
      const raw = getEn(`content.${guideKey}.toc.title`) as unknown;
      if (typeof raw === "string") {
        const v = raw.trim();
        if (v.length > 0 && v !== `content.${guideKey}.toc.title`) return v;
      }
    }
  } catch {
    /* noop */
  }
  return undefined;
}
