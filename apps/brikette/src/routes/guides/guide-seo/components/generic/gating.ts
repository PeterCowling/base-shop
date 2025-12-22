/**
 * Decide whether to render GenericContent when a route opts into manual handling
 * for unlocalized pages, allowing specific exceptions based on runtime EN arrays.
 */
export function shouldRenderGenericContent(params: {
  preferManualWhenUnlocalized?: boolean;
  hasLocalizedContent: boolean;
  guideKey: string;
  hasStructuredFallback?: boolean;
  structuredFallbackSource?: "guidesFallback" | "guidesEn";
  preferGenericWhenFallback?: boolean;
}): boolean {
  const {
    preferManualWhenUnlocalized,
    hasLocalizedContent,
    guideKey: _guideKey,
    hasStructuredFallback,
    structuredFallbackSource,
    preferGenericWhenFallback,
  } = params;
  if (preferManualWhenUnlocalized && !hasLocalizedContent) {
    return false;
  }
  // When a structured fallback exists for an unlocalized page, prefer the
  // structured fallback path by default only for curated guidesFallback
  // sources. If the structured fallback source is English structured guides
  // (guidesEn), prefer GenericContent so tests can assert GenericContent is
  // invoked with the EN translator.
  if (!hasLocalizedContent && hasStructuredFallback) {
    if (structuredFallbackSource === "guidesEn") return true;
    return Boolean(preferGenericWhenFallback);
  }
  return true;
}
