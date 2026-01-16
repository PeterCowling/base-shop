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
  },

  // Guides that hide ToC completely
  capriDayTrip: { hideToc: true },
  workExchangeItaly: { hideToc: true, showTocWhenLocalizedStructured: true },
  walkingTourAudio: { hideToc: true },
  offSeasonLongStay: { hideToc: true },
  luggageStorage: { hideToc: true },
  itinerariesPillar: { hideToc: true },
  transportMoneySaving: { hideToc: true },
  safetyAmalfi: { hideToc: true },
  cheapEats: { hideToc: true },
  positanoBeaches: { hideToc: true },
  simsAtms: { hideToc: true },

  // Guides that hide ToC based on localization state
  positanoTravelGuide: { hideTocWhenUnlocalized: true },
  photographyGuidePositano: { hideTocWhenLocalized: true },
  etiquetteItalyAmalfi: {
    hideTocWhenUnlocalized: true,
    showTocWhenLocalizedStructured: true,
  },

  // Guides with localized structured ToC behavior
  weekend48Positano: { showTocWhenLocalizedStructured: true },
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
  },

  // Solo travel has custom section filtering
  soloTravelPositano: {
    tocSectionFilter: (sectionId: string) => !/^section-\d+$/.test(sectionId),
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
export function getContentKey(guideKey: GuideKey): string {
  const override = GUIDE_OVERRIDES[guideKey];
  return override?.legacyContentKey ?? guideKey;
}
