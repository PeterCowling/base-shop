/**
 * Template-level guide-specific policies.
 *
 * Centralizes guide-specific rendering decisions for _GuideSeoTemplate.
 * All policies are driven by the declarative config in guide-overrides.ts.
 */
import {
  getExplicitTocValue,
  hasRuntimeContentFallback,
  shouldSuppressGenericWhenStructured,
  shouldSuppressGenericWhenUnstructured,
  shouldSuppressGenericWhenUnlocalized as configSuppressGenericWhenUnlocalized,
  shouldSuppressGenericForRequestedLocale,
  shouldSuppressTocBlock,
} from "@/config/guide-overrides";
import type { GuideKey } from "@/guides/slugs";

/**
 * Check if GenericContent should be suppressed for a specific guide.
 */
export function shouldSuppressGenericForGuide(
  guideKey: string,
  hasStructuredLocalInitial: boolean,
  _hasAnyLocalized: boolean,
): boolean {
  if (shouldSuppressGenericWhenStructured(guideKey) && hasStructuredLocalInitial) {
    return true;
  }
  if (shouldSuppressGenericWhenUnstructured(guideKey) && !hasStructuredLocalInitial) {
    return true;
  }
  return false;
}

/**
 * Check if the guide should suppress StructuredTocBlock rendering.
 */
export function isOffSeasonLongStayGuide(guideKey: string): boolean {
  return shouldSuppressTocBlock(guideKey);
}

/**
 * Check if the guide needs special ToC handling (explicit showToc: true).
 */
export function needsExplicitTocTrue(guideKey: string): boolean {
  return getExplicitTocValue(guideKey as GuideKey) === true;
}

/**
 * Check if the guide needs ToC suppression (explicit showToc: false).
 */
export function needsExplicitTocFalse(guideKey: string): boolean {
  return getExplicitTocValue(guideKey as GuideKey) === false;
}

/**
 * Check if the guide has runtime-provided content arrays.
 */
export function isWhatToPackGuide(guideKey: string): boolean {
  return hasRuntimeContentFallback(guideKey);
}

/**
 * Check if the guide should suppress GenericOrFallbackContent when unlocalized.
 */
export function shouldSuppressGenericWhenUnlocalized(guideKey: string): boolean {
  return configSuppressGenericWhenUnlocalized(guideKey);
}

/**
 * Check if the guide should suppress GenericContent for the requested locale.
 */
export function shouldSkipGenericForRequestedLocale(guideKey: string): boolean {
  return shouldSuppressGenericForRequestedLocale(guideKey);
}
