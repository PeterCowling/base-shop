/**
 * Generic content utilities index.
 *
 * Re-exports all utilities used by GenericOrFallbackContent.
 */

// Probes for checking structured content presence
export { hasStructuredEn,hasStructuredLocal } from "./computeProbes";

// Gating decisions
export { shouldRenderGenericContent } from "./gating";

// Translator utilities
export {
  computeGenericContentProps,
  type GenericContentBase,
  type GenericContentMerged,
  type GuidesTranslator,
  makeBaseGenericProps,
  resolveEnGuidesTranslator,
} from "./translator";

// Translator wrapper for GenericContent
export {
  getEnTranslatorCandidates,
  resolveEnglishTranslator,
  translatorProvidesStructured,
  withTranslator,
} from "./translatorWrapper";

// Fallback content detection
export { manualFallbackHasMeaningfulContent } from "./fallbackDetection";

// Content detection utilities
export {
  computeHasStructuredEn,
  getLocalizedManualFallback,
  hasExplicitLocalizedContent,
  hasManualFallbackMeaningfulContent,
  hasManualParagraphFallback,
  hasManualStringFallback,
  hasMeaningfulStructuredFallback,
  hasOnlyFaqs,
  hasRuntimeStructuredContent,
  resolveFallbackTranslator,
  resolveTargetLocale,
} from "./contentDetection";

// Guide-specific policies
export {
  allowsEmptyRender,
  allowsStructuredArraysWhenLocalized,
  getGuidePolicy,
  GUIDE_RENDER_POLICIES,
  type GuideRenderPolicy,
  needsLegacySecondArgInvocation,
  prefersStructuredFallbackWhenEn,
  requiresStructuredEnForForceGeneric,
  shouldForceGenericWhenUnlocalized,
  shouldPreserveTranslatorWhenLocalized,
  shouldSkipFallbacksWhenUnlocalized,
  shouldSkipWhenPureEmpty,
} from "./guidePolicies";

// Props helpers
export {
  applyIntroSuppression,
  applySectionExtras,
  attachArticleDescription,
  attachCoverageMetadata,
  preparePropsForRender,
  shouldSuppressIntroForDescriptionDupe,
} from "./propsHelpers";
