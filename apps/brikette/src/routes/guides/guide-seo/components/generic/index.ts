/**
 * Generic content utilities index.
 *
 * Re-exports all utilities used by GenericOrFallbackContent.
 */

// Probes for checking structured content presence
export { hasStructuredLocal, hasStructuredEn } from "./computeProbes";

// Gating decisions
export { shouldRenderGenericContent } from "./gating";

// Translator utilities
export {
  resolveEnGuidesTranslator,
  makeBaseGenericProps,
  computeGenericContentProps,
  type GuidesTranslator,
  type GenericContentBase,
  type GenericContentMerged,
} from "./translator";

// Translator wrapper for GenericContent
export {
  resolveEnglishTranslator,
  getEnTranslatorCandidates,
  translatorProvidesStructured,
  withTranslator,
} from "./translatorWrapper";

// Fallback content detection
export { manualFallbackHasMeaningfulContent } from "./fallbackDetection";

// Content detection utilities
export {
  computeHasStructuredEn,
  hasRuntimeStructuredContent,
  hasExplicitLocalizedContent,
  hasMeaningfulStructuredFallback,
  getLocalizedManualFallback,
  resolveTargetLocale,
  hasManualFallbackMeaningfulContent,
  hasManualStringFallback,
  hasManualParagraphFallback,
  hasOnlyFaqs,
  resolveFallbackTranslator,
} from "./contentDetection";

// Guide-specific policies
export {
  type GuideRenderPolicy,
  GUIDE_RENDER_POLICIES,
  getGuidePolicy,
  shouldSkipWhenPureEmpty,
  allowsEmptyRender,
  prefersStructuredFallbackWhenEn,
  shouldPreserveTranslatorWhenLocalized,
  shouldSkipFallbacksWhenUnlocalized,
  shouldForceGenericWhenUnlocalized,
  requiresStructuredEnForForceGeneric,
  needsLegacySecondArgInvocation,
  allowsStructuredArraysWhenLocalized,
} from "./guidePolicies";

// Props helpers
export {
  attachArticleDescription,
  attachCoverageMetadata,
  preparePropsForRender,
  applySectionExtras,
  shouldSuppressIntroForDescriptionDupe,
  applyIntroSuppression,
} from "./propsHelpers";
