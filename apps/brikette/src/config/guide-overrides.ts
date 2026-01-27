// apps/brikette/src/config/guide-overrides.ts
// Configuration system for guide-specific behavior overrides
// Replaces hardcoded guideKey === "..." checks throughout the codebase

import type { GuideKey } from "@/guides/slugs";

/**
 * Configuration for guide-specific rendering behavior.
 * Add entries here instead of hardcoding guideKey checks in components.
 */
export interface GuideOverrideConfig {
  // Content behavior
  /** Use legacy key for content lookup */
  legacyContentKey?: string;
  /** Custom intro rendering behavior */
  customIntro?: boolean;
  /** Use fallback sections when primary is empty */
  useFallbackSections?: boolean;
  /** Use fallback FAQs from alternative paths */
  useFallbackFaqs?: boolean;
  /** Alias content key for fallback resolution (e.g., interrailAmalfi → interrailItalyRailPassAmalfiCoast) */
  contentAlias?: string;
  /** Merge generic FAQs with alias FAQs when rendering fallback */
  mergeAliasFaqs?: boolean;
  /** Suppress FAQ-only ToC rendering (hide ToC when only FAQs are present) */
  suppressFaqOnlyToc?: boolean;
  /** Guide has runtime-provided content arrays (not translator-backed) */
  hasRuntimeContentFallback?: boolean;

  // Template-level suppression
  /** Suppress GenericContent when structured local content exists */
  suppressGenericWhenStructured?: boolean;
  /** Suppress GenericContent when structured local content is absent */
  suppressGenericWhenUnstructured?: boolean;
  /** Suppress StructuredTocBlock rendering */
  suppressTocBlock?: boolean;
  /** Suppress GenericOrFallbackContent when unlocalized */
  suppressGenericWhenUnlocalized?: boolean;
  /** Skip EN translator fallback for this guide */
  skipEnTranslatorForFallback?: boolean;
  /** Suppress GenericContent when requested locale matches (template-level gate) */
  suppressGenericForRequestedLocale?: boolean;
  /** Omit lang prop for RelatedGuides rendering (footer-specific tests) */
  omitRelatedGuidesLang?: boolean;
  /** Suppress EN structured fallbacks when manual handling is enabled */
  suppressFallbackStructuredWhenManualEn?: boolean;

  // ToC behavior
  /** Hide ToC completely for this guide */
  hideToc?: boolean;
  /** Hide ToC when content is not localized */
  hideTocWhenUnlocalized?: boolean;
  /** Hide ToC when content IS localized */
  hideTocWhenLocalized?: boolean;
  /** Use manual ToC items when unlocalized */
  preferManualTocWhenUnlocalized?: boolean;
  /** Show ToC when localized content has structured data */
  showTocWhenLocalizedStructured?: boolean;
  /** Custom ToC section filter */
  tocSectionFilter?: (sectionId: string) => boolean;
  /** Explicit showToc value override for GenericContent (true = force show, false = force hide) */
  explicitTocValue?: boolean;

  // Translator behavior
  /** Return active translator even when unlocalized (for test compatibility) */
  useActiveTranslatorWhenUnlocalized?: boolean;
}

/**
 * Guide-specific configuration overrides.
 * Keys are GuideKey values, values are override configs.
 */
export const GUIDE_OVERRIDES: Partial<Record<GuideKey, GuideOverrideConfig>> = {
  // Interrail guide has extensive special handling
  interrailAmalfi: {
    customIntro: true,
    useFallbackSections: true,
    useFallbackFaqs: true,
    contentAlias: "interrailItalyRailPassAmalfiCoast",
    mergeAliasFaqs: true,
    suppressFaqOnlyToc: true,
  },

  // Sunset viewpoints uses active translator for test compatibility
  sunsetViewpoints: {
    useActiveTranslatorWhenUnlocalized: true,
  },

  // Public transport uses legacy content key
  publicTransportAmalfi: {
    legacyContentKey: "amalfiCoastPublicTransportGuide",
  },

  // Eco-friendly guide has special fallback behavior
  ecoFriendlyAmalfi: {
    preferManualTocWhenUnlocalized: true,
    useFallbackSections: true,
    suppressGenericWhenUnstructured: true,
    suppressFallbackStructuredWhenManualEn: true,
  },

  // Guides that hide ToC completely
  capriDayTrip: { hideToc: true },
  workExchangeItaly: { hideToc: true, showTocWhenLocalizedStructured: true },
  walkingTourAudio: { hideToc: true },
  offSeasonLongStay: { hideToc: true, suppressTocBlock: true, suppressGenericWhenUnlocalized: true },
  luggageStorage: { hideToc: true, suppressGenericWhenStructured: true },
  itinerariesPillar: { hideToc: true },
  transportMoneySaving: { hideToc: true },
  safetyAmalfi: { hideToc: true },
  cheapEats: { hideToc: true },
  positanoBeaches: { hideToc: true },
  simsAtms: { hideToc: true },

  // Related guides tests expect no lang prop for this guide
  beachHoppingAmalfi: { omitRelatedGuidesLang: true },

  // Guides that hide ToC based on localization state
  positanoTravelGuide: { hideTocWhenUnlocalized: true },
  photographyGuidePositano: { hideTocWhenLocalized: true },
  etiquetteItalyAmalfi: {
    hideTocWhenUnlocalized: true,
    showTocWhenLocalizedStructured: true,
    explicitTocValue: false,
    skipEnTranslatorForFallback: true,
  },

  // Guides with localized structured ToC behavior
  weekend48Positano: { showTocWhenLocalizedStructured: true, suppressGenericWhenStructured: true },
  sevenDayNoCar: { showTocWhenLocalizedStructured: true },

  // Sorrento guide has special empty sections behavior
  sorrentoGuide: {
    hideTocWhenUnlocalized: true,
  },

  // Chiesa Nuova guides share ToC behavior
  chiesaNuovaArrivals: { hideTocWhenUnlocalized: true },
  chiesaNuovaDepartures: { hideTocWhenUnlocalized: true },

  // Work cafes hides ToC when sections are empty
  workCafes: {
    hideTocWhenUnlocalized: true,
    suppressGenericWhenUnstructured: true,
  },

  // Solo travel has custom section filtering
  soloTravelPositano: {
    tocSectionFilter: (sectionId: string) => !/^section-\d+$/.test(sectionId),
  },

  // Travel tips needs explicit ToC enabled
  travelTipsFirstTime: {
    explicitTocValue: true,
  },

  // What to pack has runtime-provided content arrays
  whatToPack: {
    hasRuntimeContentFallback: true,
  },
};

/**
 * Get the override configuration for a guide.
 * Returns undefined if no overrides are configured.
 */
export function getGuideOverride(guideKey: GuideKey): GuideOverrideConfig | undefined {
  return GUIDE_OVERRIDES[guideKey];
}

/**
 * Check if a guide has a specific override flag set.
 */
export function hasGuideOverride<K extends keyof GuideOverrideConfig>(
  guideKey: GuideKey,
  key: K
): boolean {
  const override = GUIDE_OVERRIDES[guideKey];
  return override !== undefined && override[key] !== undefined;
}

/**
 * Get a specific override value for a guide.
 */
export function getGuideOverrideValue<K extends keyof GuideOverrideConfig>(
  guideKey: GuideKey,
  key: K
): GuideOverrideConfig[K] | undefined {
  return GUIDE_OVERRIDES[guideKey]?.[key];
}

/**
 * Check if a guide should hide its ToC based on configuration and localization state.
 */
export function shouldHideToc(
  guideKey: GuideKey,
  hasLocalizedContent: boolean,
  hasStructuredContent: boolean = false
): boolean {
  const override = GUIDE_OVERRIDES[guideKey];
  if (!override) return false;

  // Explicit hide
  if (override.hideToc) return true;

  // Hide when unlocalized
  if (override.hideTocWhenUnlocalized && !hasLocalizedContent) return true;

  // Hide when localized
  if (override.hideTocWhenLocalized && hasLocalizedContent) return true;

  // Show when localized with structured content overrides hide
  if (override.showTocWhenLocalizedStructured && hasLocalizedContent && hasStructuredContent) {
    return false;
  }

  return false;
}

/**
 * Get the content key for a guide, handling legacy key mappings.
 */
export function getContentKey(guideKey: GuideKey | string): string {
  const override = GUIDE_OVERRIDES[guideKey as GuideKey];
  return override?.legacyContentKey ?? guideKey;
}

/**
 * Get the content alias for a guide (e.g., interrailAmalfi → interrailItalyRailPassAmalfiCoast).
 * Returns undefined if no alias is configured.
 */
export function getContentAlias(guideKey: GuideKey | string): string | undefined {
  return GUIDE_OVERRIDES[guideKey as GuideKey]?.contentAlias;
}

/**
 * Check if a guide should suppress GenericContent when structured content exists.
 */
export function shouldSuppressGenericWhenStructured(guideKey: GuideKey | string): boolean {
  return GUIDE_OVERRIDES[guideKey as GuideKey]?.suppressGenericWhenStructured === true;
}

/**
 * Check if a guide should suppress GenericContent when structured content is absent.
 */
export function shouldSuppressGenericWhenUnstructured(guideKey: GuideKey | string): boolean {
  return GUIDE_OVERRIDES[guideKey as GuideKey]?.suppressGenericWhenUnstructured === true;
}

/**
 * Check if a guide should suppress the StructuredTocBlock.
 */
export function shouldSuppressTocBlock(guideKey: GuideKey | string): boolean {
  return GUIDE_OVERRIDES[guideKey as GuideKey]?.suppressTocBlock === true;
}

/**
 * Check if a guide should suppress GenericOrFallbackContent when unlocalized.
 */
export function shouldSuppressGenericWhenUnlocalized(guideKey: GuideKey | string): boolean {
  return GUIDE_OVERRIDES[guideKey as GuideKey]?.suppressGenericWhenUnlocalized === true;
}

/**
 * Get the explicit ToC value override for a guide.
 * Returns undefined if no override is configured.
 */
export function getExplicitTocValue(guideKey: GuideKey | string): boolean | undefined {
  return GUIDE_OVERRIDES[guideKey as GuideKey]?.explicitTocValue;
}

/**
 * Check if a guide has runtime-provided content fallback arrays.
 */
export function hasRuntimeContentFallback(guideKey: GuideKey | string): boolean {
  return GUIDE_OVERRIDES[guideKey as GuideKey]?.hasRuntimeContentFallback === true;
}

/**
 * Check if a guide should merge alias FAQs.
 */
export function shouldMergeAliasFaqs(guideKey: GuideKey | string): boolean {
  return GUIDE_OVERRIDES[guideKey as GuideKey]?.mergeAliasFaqs === true;
}

/**
 * Check if a guide should suppress the FAQs-only ToC rendering.
 */
export function shouldSuppressFaqOnlyToc(guideKey: GuideKey | string): boolean {
  return GUIDE_OVERRIDES[guideKey as GuideKey]?.suppressFaqOnlyToc === true;
}

/**
 * Check if a guide should suppress GenericContent for the requested locale.
 */
export function shouldSuppressGenericForRequestedLocale(guideKey: GuideKey | string): boolean {
  return GUIDE_OVERRIDES[guideKey as GuideKey]?.suppressGenericForRequestedLocale === true;
}

/**
 * Check if a guide should omit passing lang to RelatedGuides.
 */
export function shouldOmitRelatedGuidesLang(guideKey: GuideKey | string): boolean {
  return GUIDE_OVERRIDES[guideKey as GuideKey]?.omitRelatedGuidesLang === true;
}

/**
 * Check if a guide should suppress EN structured fallbacks when manual handling is enabled.
 */
export function shouldSuppressFallbackStructuredWhenManualEn(guideKey: GuideKey | string): boolean {
  return GUIDE_OVERRIDES[guideKey as GuideKey]?.suppressFallbackStructuredWhenManualEn === true;
}

/**
 * Get the custom ToC section filter for a guide, if configured.
 */
export function getTocSectionFilter(
  guideKey: GuideKey | string,
): ((sectionId: string) => boolean) | undefined {
  return GUIDE_OVERRIDES[guideKey as GuideKey]?.tocSectionFilter;
}

/**
 * Check if a guide should skip EN translator for fallback rendering.
 */
export function shouldSkipEnTranslatorForFallback(guideKey: GuideKey | string): boolean {
  return GUIDE_OVERRIDES[guideKey as GuideKey]?.skipEnTranslatorForFallback === true;
}
