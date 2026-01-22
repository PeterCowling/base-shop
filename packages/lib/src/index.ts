export { SHOP_NAME_RE, validateShopName } from "./validateShopName";

// Migrated from @acme/shared-utils - universal exports
export * from "./array";
export * from "./format";
export * from "./http";
export * from "./json";
export * from "./security";
export * from "./shop";
export * from "./string";
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

// Geometry utilities (vectors, rectangles, matrices)
export {
  // Vector2 arithmetic
  add,
  // Vector3 operations
  add3,
  // Vector2 angles
  angle,
  angleBetween,
  area,
  type Bounds,
  boundsFromRect,
  // Rectangle properties
  center,
  clampPoint,
  // Rectangle tests
  containsPoint,
  containsRect,
  corners,
  cross,
  cross2D,
  // Matrix decomposition
  decompose,
  determinant,
  distance,
  distance3,
  distanceSquared,
  distanceSquared3,
  div,
  div3,
  // Vector2 products
  dot,
  dot3,
  expand,
  fromTransform,
  // Matrix constants
  IDENTITY,
  identity,
  // Rectangle operations
  intersection,
  intersects,
  inverse,
  // Vector2 interpolation & projection
  lerpVec2,
  lerpVec3,
  // Vector2 magnitude
  magnitude,
  magnitude3,
  magnitudeSquared,
  magnitudeSquared3,
  // Matrix types
  type Matrix3x3,
  mul,
  mul3,
  // Matrix operations
  multiply,
  negate,
  negate3,
  normalize,
  normalize3,
  normalizeRect,
  perimeter,
  perpendicular,
  project,
  // Rectangle types
  type Rect,
  // Rectangle construction
  rect,
  rectFromBounds,
  rectFromCenter,
  rectFromPoints,
  rectsEqual,
  reflect,
  rotate,
  rotateVec2,
  scale,
  scaleRect,
  skew,
  sub,
  sub3,
  type TransformComponents,
  // Matrix application
  transformPoint,
  transformVector,
  // Matrix construction
  translate,
  translateRect,
  transpose,
  union,
  UNIT_X,
  UNIT_X3,
  UNIT_Y,
  UNIT_Y3,
  UNIT_Z3,
  // Vector construction
  vec2,
  vec3,
  // Vector types
  type Vector2,
  type Vector3,
  // Vector constants
  ZERO2,
  ZERO3,
} from "./math/geometry";

// Statistics utilities
export {
  coefOfVariation,
  // Correlation
  covariance,
  Histogram,
  type HistogramBin,
  iqr,
  kurtosis,
  max,
  mean,
  median,
  min,
  mode,
  normalizeArray,
  // Classes
  OnlineStats,
  type OnlineStatsState,
  pearson,
  percentile,
  quartiles,
  range,
  skewness,
  spearman,
  stddev,
  // Descriptive statistics
  sum,
  variance,
  zScore,
} from "./math/statistics";

// Random utilities (seeded PRNG, sampling)
export {
  exponentialSample,
  hashSeed,
  normalSample,
  poissonSample,
  ReservoirSampler,
  SeededRandom,
  type SeededRandomState,
  uniformSample,
} from "./math/random";

// Financial utilities (markup, margin, discounts, rounding)
export {
  addTax,
  type AmortizationRow,
  amortizationSchedule,
  applyDiscount,
  compoundInterest,
  discountAmount,
  discountPercent,
  futureValue,
  installmentAmount,
  margin,
  markup,
  presentValue,
  priceFromMargin,
  priceFromMarkup,
  removeTax,
  roundCurrency,
  roundDownToIncrement,
  roundToNearest,
  roundUpToIncrement,
  taxAmount,
} from "./math/financial";
