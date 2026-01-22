/**
 * Template-level guide-specific policies.
 *
 * Centralizes guide-specific rendering decisions for _GuideSeoTemplate.
 */

/**
 * Check if GenericContent should be suppressed for a specific guide.
 */
export function shouldSuppressGenericForGuide(
  guideKey: string,
  hasStructuredLocalInitial: boolean,
  hasAnyLocalized: boolean,
): boolean {
  // Luggage storage guide renders its own localized intro/sections
  // and a simple inline ToC in the article lead.
  if (guideKey === "luggageStorage" && hasStructuredLocalInitial) {
    return true;
  }

  // 48-hour Positano weekend: this route renders a manual
  // structured article lead and ToC when localized content is available.
  if (guideKey === "weekend48Positano" && hasStructuredLocalInitial) {
    return true;
  }

  // Eco-friendly Amalfi: when the active locale lacks structured
  // arrays, suppress GenericContent entirely.
  if (guideKey === "ecoFriendlyAmalfi" && !hasStructuredLocalInitial) {
    return true;
  }

  // Work cafes: prefer manual sections and coverage links when the
  // locale lacks structured arrays.
  if (guideKey === "workCafes" && !hasStructuredLocalInitial) {
    return true;
  }

  return false;
}

/**
 * Check if off-season long stay guide specific logic applies.
 */
export function isOffSeasonLongStayGuide(guideKey: string): boolean {
  return guideKey === "offSeasonLongStay";
}

/**
 * Check if Positano beaches guide specific logic applies.
 */
export function isPositanoBeachesGuide(guideKey: string): boolean {
  return guideKey === "positanoBeaches";
}

/**
 * Check if the guide needs special ToC handling (travelTipsFirstTime).
 */
export function needsExplicitTocTrue(guideKey: string): boolean {
  return guideKey === "travelTipsFirstTime";
}

/**
 * Check if the guide needs ToC suppression (etiquetteItalyAmalfi).
 */
export function needsExplicitTocFalse(guideKey: string): boolean {
  return guideKey === "etiquetteItalyAmalfi";
}

/**
 * Check if the guide is "whatToPack" which has special runtime content handling.
 */
export function isWhatToPackGuide(guideKey: string): boolean {
  return guideKey === "whatToPack";
}
