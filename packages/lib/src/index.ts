export { SHOP_NAME_RE, validateShopName } from "./validateShopName";

// Migrated from @acme/shared-utils - universal exports
export * from "./format";
export * from "./string";
export * from "./array";
export * from "./json";
export * from "./http";
export * from "./security";
export * from "./shop";
/**
 * Re-export Zod helpers from their module files rather than the package
 * root.  The root of @acme/zod-utils lacks a compiled index.d.ts, which
 * causes TS6305 errors.  Importing from the specific module files avoids this.
 */
export type { GeneratedMeta,ProductData } from "./generateMeta";
export { generateMeta } from "./generateMeta";
export {
  applyFriendlyZodMessages,
  friendlyErrorMap,
} from "@acme/zod-utils/zodErrorMap";

// Math utilities
export type { BloomFilterOptions } from "./math/probabilistic/bloom-filter";
export { BloomFilter } from "./math/probabilistic/bloom-filter";
export type {
  CountMinSketchOptions,
  TrendingTrackerOptions,
} from "./math/probabilistic/count-min-sketch";
export { CountMinSketch, TrendingTracker } from "./math/probabilistic/count-min-sketch";
export type { HyperLogLogOptions } from "./math/probabilistic/hyperloglog";
export { HyperLogLog } from "./math/probabilistic/hyperloglog";
export type { TDigestOptions } from "./math/probabilistic/t-digest";
export { TDigest } from "./math/probabilistic/t-digest";
export type {
  ConsumeResult,
  LeakyBucketAddResult,
  LeakyBucketOptions,
  TokenBucketOptions,
  TokenBucketState,
} from "./math/rate-limit/token-bucket";
export { LeakyBucket,TokenBucket } from "./math/rate-limit/token-bucket";

// Color utilities (OKLCH)
export {
  areDistinguishable,
  clampToSrgbGamut,
  // Perceptual operations
  deltaE,
  generateGradientStops,
  hexToOklch,
  hexToRgb,
  // Gradient/interpolation
  interpolateOklch,
  // Gamut mapping
  isInSrgbGamut,
  meetsWcagAA,
  meetsWcagAAA,
  // Types
  type OklchColor,
  oklchToHex,
  oklchToSrgb,
  // WCAG contrast (accessibility)
  relativeLuminance,
  rgbToHex,
  type RgbTuple,
  // Core conversions
  srgbToOklch,
  wcagContrast,
} from "./math/color/oklch";

// Animation utilities (Bézier easing)
export {
  clamp,
  clamp01,
  // Core
  cubicBezier,
  ease,
  easeIn,
  easeInOut,
  easeInOutBack,
  easeInOutQuint,
  easeOut,
  easeOutBack,
  easeOutQuint,
  // Types
  type EasingFunction,
  inverseLerp,
  // Utilities
  lerp,
  // Presets
  linear,
  remap,
  spring,
} from "./math/animation/bezier";

// Forecasting utilities (EWMA, exponential smoothing)
export {
  EWMA,
  type EWMAOptions,
  exponentialMovingAverage,
  HoltSmoothing,
  movingAverage,
  SimpleExponentialSmoothing,
  weightedMovingAverage,
} from "./math/forecasting/ewma";

// Search utilities (edit distance, fuzzy matching)
export {
  BKTree,
  type BKTreeSearchResult,
  damerauLevenshtein,
  type DistanceFunction,
  findCandidates,
  levenshtein,
  ngrams,
  ngramSimilarity,
  normalizedDistance,
  similarity,
} from "./math/search/edit-distance";

// Search utilities (BM25 full-text search)
export {
  type Document as BM25Document,
  BM25Index,
  type BM25Options,
  defaultTokenizer,
  type FieldConfig,
  type SearchResult,
  stemmedTokenizer,
  type Tokenizer,
} from "./math/search/bm25";
