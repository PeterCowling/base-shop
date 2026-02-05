---
Type: Plan
Status: Historical
Domain: Platform
Last-reviewed: 2026-01-19
Relates-to charter: docs/runtime/runtime-charter.md
Created: 2026-01-19
Created-by: Claude Opus 4.5
Last-updated: 2026-01-19
Last-updated-by: Claude Opus 4.5
---

# Plan: Mathematical Utilities for Base-Shop

Production-grade mathematical utilities that provide measurable improvements to search, caching, analytics, theming, and rate limiting.

## Summary

Implement a set of well-scoped mathematical algorithms as TypeScript utilities. Each utility solves a specific problem with clear acceptance criteria. Utilities are grouped into tiers by implementation effort and can be developed in parallel.

## Goals

1. **Immediate Value**: Each utility ships independently with measurable impact
2. **No Research Overhead**: Tier 1 items require no data science, ML infrastructure, or experimentation platform
3. **Production Quality**: Full test coverage, typed APIs, documented edge cases
4. **Composable**: Utilities work standalone but integrate cleanly with existing packages

## Non-Goals

- ML/AI infrastructure (recommendations, dynamic pricing)
- Experimentation platform (A/B testing math depends on event instrumentation first)
- External service dependencies (no Redis, no ML runtimes)

## Package Location

All utilities will live in:
```
packages/lib/src/math/
├── index.ts              # Public exports
├── color/                # OKLCH, contrast utilities
├── probabilistic/        # Bloom filter, HyperLogLog, Count-Min Sketch, t-digest
├── search/               # BM25, edit distance, BK-tree
├── rate-limit/           # Token bucket, leaky bucket
├── animation/            # Bézier easing
└── forecasting/          # EWMA, exponential smoothing
```

---

## Tier 1: Low Effort, Immediate Value

### MATH-01: OKLCH Color Utilities

**Status**: Complete (2026-01-19)

**Scope**: Perceptually uniform color manipulation for the design system.

**Use Cases**:
- Generate perceptually uniform gradients between design tokens
- Check if two tokens are visually distinguishable (ΔE threshold)
- Convert between color spaces (sRGB ↔ OKLCH)

**Important Note**: WCAG luminance-based contrast remains the accessibility gate. OKLCH/ΔE are for token spacing and gradient quality, not accessibility compliance.

**Implementation**:
- Source: `packages/lib/src/math/color/oklch.ts`
- Tests: `packages/lib/__tests__/math/color/oklch.test.ts` (78 tests)
- Exports: `@acme/lib`

**API Summary**:
```typescript
// Types
interface OklchColor { l: number; c: number; h: number }
type RgbTuple = [r: number, g: number, b: number]

// Conversions
srgbToOklch(r, g, b): OklchColor
oklchToSrgb(color): RgbTuple
hexToOklch(hex): OklchColor
oklchToHex(color): string
hexToRgb(hex): RgbTuple
rgbToHex(rgb): string

// Perceptual operations
deltaE(a, b): number                    // Euclidean distance in Oklab × 100
areDistinguishable(a, b, threshold?): boolean
interpolateOklch(a, b, t): OklchColor   // Interpolates in Oklab space
generateGradientStops(a, b, steps): OklchColor[]

// WCAG contrast (luminance-based)
relativeLuminance(rgb): number
wcagContrast(fg, bg): number
meetsWcagAA(fg, bg, largeText?): boolean
meetsWcagAAA(fg, bg, largeText?): boolean

// Gamut mapping
isInSrgbGamut(color): boolean
clampToSrgbGamut(color): OklchColor
```

**Definition of Done**:
- [x] All conversion functions pass round-trip tests (sRGB → OKLCH → sRGB within ε)
- [x] ΔE implementation uses Euclidean distance in Oklab (documented in source)
- [x] Gradient generation produces visually smooth results (Oklab interpolation)
- [x] WCAG functions correctly classify contrast ratios (tested against known values)
- [x] Exported from `@acme/lib`
- [x] JSDoc with examples

**Dependencies**: None

**Effort**: ~4 hours (actual)

---

### MATH-02: Bloom Filter

**Status**: Complete

**Scope**: Probabilistic set membership for negative caching.

**Use Cases**:
- Avoid expensive cache-miss lookups ("is this product ID definitely NOT in cache?")
- Existence checks across shards without full lookup
- Rate limiter pre-check ("has this IP been seen recently?")

**Note**: Zero false negatives, tunable false positive rate. Not for general caching—specific to avoiding unnecessary expensive operations.

**API Design**:
```typescript
// packages/lib/src/math/probabilistic/bloom-filter.ts

interface BloomFilterOptions {
  expectedItems: number      // Expected number of items
  falsePositiveRate: number  // Target FP rate (e.g., 0.01 for 1%)
}

class BloomFilter {
  constructor(options: BloomFilterOptions)

  add(item: string): void
  mightContain(item: string): boolean  // true = maybe, false = definitely not

  // Serialization for persistence
  serialize(): Uint8Array
  static deserialize(data: Uint8Array): BloomFilter

  // Stats
  readonly size: number           // Bit array size
  readonly hashCount: number      // Number of hash functions
  readonly itemCount: number      // Items added
  readonly fillRatio: number      // Bits set / total bits
}
```

**Implementation Notes**:
- Use MurmurHash3 or xxHash for speed
- Optimal parameters: `k = (m/n) × ln(2)` hash functions
- Bit array size: `m = -n × ln(p) / (ln(2))²`

**Definition of Done**:
- [ ] False positive rate within 10% of target at expected capacity
- [ ] Zero false negatives (critical invariant)
- [ ] Serialization round-trips correctly
- [ ] Performance: 100k lookups/sec minimum
- [ ] Memory usage matches theoretical (m bits + overhead)
- [ ] Exported from `@acme/lib`

**Dependencies**: None

**Effort**: ~3 hours

---

### MATH-03: Token Bucket Rate Limiter

**Status**: Complete

**Scope**: Clean rate limiting math for API protection and abuse prevention.

**Use Cases**:
- API rate limiting per user/IP
- Bot protection
- Graceful degradation under load

**API Design**:
```typescript
// packages/lib/src/math/rate-limit/token-bucket.ts

interface TokenBucketOptions {
  capacity: number      // Max tokens (burst capacity)
  refillRate: number    // Tokens added per second
}

interface ConsumeResult {
  allowed: boolean
  remainingTokens: number
  retryAfterMs: number | null  // null if allowed, ms to wait if not
}

class TokenBucket {
  constructor(options: TokenBucketOptions)

  consume(tokens?: number): ConsumeResult
  peek(): { tokens: number; capacityUsed: number }
  reset(): void

  // For distributed systems: export/import state
  getState(): { tokens: number; lastRefill: number }
  setState(state: { tokens: number; lastRefill: number }): void
}

// Leaky bucket variant (smooths bursts)
class LeakyBucket {
  constructor(options: { capacity: number; leakRate: number })

  add(amount?: number): { allowed: boolean; overflow: number }
  readonly level: number
}
```

**Definition of Done**:
- [ ] Token refill is time-accurate (handles clock skew gracefully)
- [ ] Burst behavior correct (can use full capacity instantly)
- [ ] State export/import enables distributed use with external store
- [ ] Edge cases: negative time delta, overflow, precision loss
- [ ] Exported from `@acme/lib`

**Dependencies**: None

**Effort**: ~2 hours

---

### MATH-04: HyperLogLog

**Status**: Complete

**Scope**: Cardinality estimation for analytics at minimal memory cost.

**Use Cases**:
- Unique visitor counts without storing all IDs
- Distinct product views per session
- Approximate set union size

**API Design**:
```typescript
// packages/lib/src/math/probabilistic/hyperloglog.ts

interface HyperLogLogOptions {
  precision?: number  // 4-18, default 14 (~16KB, ~0.8% error)
}

class HyperLogLog {
  constructor(options?: HyperLogLogOptions)

  add(item: string): void
  count(): number  // Estimated cardinality

  // Merge multiple HLLs (e.g., from different shards)
  merge(other: HyperLogLog): HyperLogLog
  static union(hlls: HyperLogLog[]): HyperLogLog

  // Serialization
  serialize(): Uint8Array
  static deserialize(data: Uint8Array): HyperLogLog

  // Stats
  readonly precision: number
  readonly registerCount: number  // 2^precision
  readonly standardError: number  // 1.04 / sqrt(registerCount)
}
```

**Definition of Done**:
- [ ] Error rate within 3× standard error for cardinalities 100 to 10M
- [ ] Merge produces same result as single HLL with all items
- [ ] Memory matches theoretical: 6 bits × 2^precision
- [ ] Exported from `@acme/lib`

**Dependencies**: None

**Effort**: ~4 hours

---

### MATH-05: Bézier Easing Functions

**Status**: Complete

**Scope**: Custom animation easing for UI polish.

**Use Cases**:
- Smooth transitions beyond CSS defaults
- Consistent brand-specific animation feel
- Programmatic animation control in canvas/WebGL

**API Design**:
```typescript
// packages/lib/src/math/animation/bezier.ts

type EasingFunction = (t: number) => number

// Cubic Bézier (CSS transition compatible)
function cubicBezier(x1: number, y1: number, x2: number, y2: number): EasingFunction

// Common presets
const easeInOut: EasingFunction      // cubicBezier(0.42, 0, 0.58, 1)
const easeOutQuint: EasingFunction   // cubicBezier(0.22, 1, 0.36, 1)
const easeInOutBack: EasingFunction  // With overshoot
const spring: (tension: number, friction: number) => EasingFunction

// Utilities
function lerp(a: number, b: number, t: number): number
function inverseLerp(a: number, b: number, value: number): number
function remap(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number
```

**Definition of Done**:
- [ ] `cubicBezier` output matches CSS `cubic-bezier()` for t ∈ [0, 1]
- [ ] Presets match industry-standard values
- [ ] Edge cases: t < 0, t > 1 handled gracefully
- [ ] Exported from `@acme/lib`

**Dependencies**: None

**Effort**: ~2 hours

---

## Tier 2: Medium Effort, Strong ROI

### MATH-06: Count-Min Sketch with Time Decay

**Status**: Complete

**Scope**: Frequency estimation for trending products.

**Use Cases**:
- "Trending now" product list
- Hot search terms
- Real-time popularity scoring

**Important Note**: The sketch is easy; the product part is time decay (sliding window or EWMA) + top-k extraction (min-heap). Without decay, "trending" gets stale.

**API Design**:
```typescript
// packages/lib/src/math/probabilistic/count-min-sketch.ts

interface CountMinSketchOptions {
  width: number       // Columns (higher = more accurate)
  depth: number       // Rows/hash functions (higher = lower error)
  decayFactor?: number  // EWMA decay, e.g., 0.99 per interval
}

class CountMinSketch {
  constructor(options: CountMinSketchOptions)

  increment(item: string, count?: number): void
  estimate(item: string): number

  // Time decay
  decay(): void  // Apply decay factor once (call periodically)

  // Top-K tracking (requires additional heap structure)
  topK(k: number): Array<{ item: string; count: number }>

  // Serialization
  serialize(): Uint8Array
  static deserialize(data: Uint8Array): CountMinSketch
}

// Higher-level "trending" abstraction
class TrendingTracker {
  constructor(options: {
    sketchWidth?: number
    sketchDepth?: number
    topK?: number
    decayIntervalMs?: number
    decayFactor?: number
  })

  record(itemId: string): void
  getTrending(): string[]

  // Lifecycle
  start(): void   // Start decay timer
  stop(): void    // Stop decay timer
}
```

**Definition of Done**:
- [ ] Point estimates within ε × N of true count (where ε = e/width)
- [ ] Decay prevents stale items from dominating indefinitely
- [ ] Top-K extraction is O(n log k) not O(n log n)
- [ ] TrendingTracker provides batteries-included experience
- [ ] Exported from `@acme/lib`

**Dependencies**: None (but benefits from MATH-04 HyperLogLog for unique counts)

**Effort**: ~6 hours

---

### MATH-07: BM25 Search Index

**Status**: Complete

**Scope**: Relevance-ranked text search for products.

**Use Cases**:
- Product search with field weighting (title > description)
- Collection/category search
- Blog/content search

**Important Notes**:
- Still needs: tokenization strategy, field boosts, incremental indexing
- Evaluation loop required (even lightweight click-through or manual judgments)
- This is the algorithm; indexing strategy is a separate concern

**API Design**:
```typescript
// packages/lib/src/math/search/bm25.ts

interface BM25Options {
  k1?: number  // Term saturation, default 1.2
  b?: number   // Length normalization, default 0.75
}

interface Document {
  id: string
  fields: Record<string, string>  // e.g., { title: "...", description: "..." }
}

interface FieldConfig {
  boost?: number  // Field weight, default 1.0
}

interface SearchResult {
  id: string
  score: number
  matches: Record<string, number[]>  // Field -> matching positions
}

class BM25Index {
  constructor(options?: BM25Options)

  // Schema
  defineField(name: string, config?: FieldConfig): void

  // Indexing
  addDocument(doc: Document): void
  removeDocument(id: string): void
  updateDocument(doc: Document): void

  // Search
  search(query: string, limit?: number): SearchResult[]

  // Stats
  readonly documentCount: number
  readonly averageDocumentLength: Record<string, number>

  // Serialization (for persistence)
  serialize(): Uint8Array
  static deserialize(data: Uint8Array): BM25Index
}

// Tokenization utilities (separate concern, composable)
interface Tokenizer {
  tokenize(text: string): string[]
}

const defaultTokenizer: Tokenizer  // lowercase, split on whitespace/punctuation
const stemmedTokenizer: Tokenizer  // + Porter stemming
```

**Definition of Done**:
- [ ] BM25 formula correctly implemented and tested against reference
- [ ] Field boosts multiply into final score correctly
- [ ] Incremental add/remove/update works without full reindex
- [ ] Search performance: 10k docs, <10ms query time
- [ ] Tokenizer is pluggable
- [ ] Exported from `@acme/lib`

**Dependencies**: None

**Effort**: ~8 hours

---

### MATH-08: Edit Distance and BK-Tree

**Status**: Complete

**Scope**: Typo-tolerant search suggestions.

**Use Cases**:
- "Did you mean...?" suggestions
- Fuzzy product name matching
- Autocomplete with typo tolerance

**API Design**:
```typescript
// packages/lib/src/math/search/edit-distance.ts

// Core algorithms
function levenshtein(a: string, b: string): number
function damerauLevenshtein(a: string, b: string): number  // Includes transpositions
function normalizedDistance(a: string, b: string): number  // 0-1 range

// BK-Tree for efficient fuzzy search
class BKTree {
  constructor(distanceFn?: (a: string, b: string) => number)

  add(word: string): void
  addAll(words: string[]): void

  // Find all words within distance threshold
  search(query: string, maxDistance: number): Array<{ word: string; distance: number }>

  // Find closest match
  nearest(query: string): { word: string; distance: number } | null

  readonly size: number
}

// N-gram utilities (for blocking/candidate generation)
function ngrams(text: string, n: number): string[]
function ngramSimilarity(a: string, b: string, n?: number): number
```

**Definition of Done**:
- [ ] Levenshtein matches reference implementation exactly
- [ ] BK-Tree search is sublinear (benchmark vs naive O(n))
- [ ] Handles unicode correctly (grapheme clusters, not code points)
- [ ] Empty string and single-char edge cases
- [ ] Exported from `@acme/lib`

**Dependencies**: None (pairs well with MATH-07 BM25)

**Effort**: ~5 hours

---

### MATH-09: EWMA and Exponential Smoothing

**Status**: Complete

**Scope**: Lightweight forecasting for ops dashboards.

**Use Cases**:
- Demand smoothing for inventory alerts
- Anomaly detection baseline
- Moving averages for metrics

**API Design**:
```typescript
// packages/lib/src/math/forecasting/ewma.ts

interface EWMAOptions {
  alpha: number  // Smoothing factor 0-1 (higher = more weight to recent)
  initialValue?: number
}

class EWMA {
  constructor(options: EWMAOptions)

  update(value: number): number  // Returns new smoothed value
  readonly value: number
  reset(initialValue?: number): void
}

// Simple Exponential Smoothing (level only)
class SimpleExponentialSmoothing {
  constructor(alpha: number)

  fit(data: number[]): void
  forecast(steps: number): number[]
  readonly fittedValues: number[]
}

// Holt's method (level + trend)
class HoltSmoothing {
  constructor(alpha: number, beta: number)

  fit(data: number[]): void
  forecast(steps: number): number[]
}

// Utilities
function movingAverage(data: number[], window: number): number[]
function weightedMovingAverage(data: number[], weights: number[]): number[]
```

**Definition of Done**:
- [ ] EWMA update is O(1) time and space
- [ ] Exponential smoothing forecasts match statsmodels/R reference
- [ ] Holt's method captures trend correctly
- [ ] Edge cases: empty data, single point, negative values
- [ ] Exported from `@acme/lib`

**Dependencies**: None

**Effort**: ~4 hours

---

### MATH-10: t-Digest for Quantile Estimation

**Status**: Complete

**Scope**: Accurate tail percentiles (p95, p99) at low memory cost.

**Use Cases**:
- Latency percentile tracking without storing all values
- Order value distribution analysis
- Mergeable across services/time windows

**API Design**:
```typescript
// packages/lib/src/math/probabilistic/t-digest.ts

interface TDigestOptions {
  compression?: number  // Default 100, higher = more accuracy, more memory
}

class TDigest {
  constructor(options?: TDigestOptions)

  add(value: number, weight?: number): void
  addAll(values: number[]): void

  // Quantile queries
  quantile(q: number): number  // e.g., quantile(0.95) for p95
  cdf(value: number): number   // What percentile is this value?

  // Merge (for distributed aggregation)
  merge(other: TDigest): TDigest
  static merge(digests: TDigest[]): TDigest

  // Stats
  readonly count: number
  readonly min: number
  readonly max: number
  readonly mean: number

  // Serialization
  serialize(): Uint8Array
  static deserialize(data: Uint8Array): TDigest
}
```

**Definition of Done**:
- [ ] p50 error < 1%, p99 error < 0.1% (at compression=100)
- [ ] Merge produces same result as single digest with all values
- [ ] Memory bounded: O(compression) centroids
- [ ] Handles negative values, zeros, duplicates
- [ ] Exported from `@acme/lib`

**Dependencies**: None

**Effort**: ~6 hours

---

## Implementation Order

Recommended parallel tracks:

**Track A (Design System)**:
1. MATH-01: OKLCH Colors
2. MATH-05: Bézier Easing

**Track B (Caching/Analytics)**:
1. MATH-02: Bloom Filter
2. MATH-04: HyperLogLog
3. MATH-06: Count-Min Sketch
4. MATH-10: t-Digest

**Track C (Search)**:
1. MATH-08: Edit Distance + BK-Tree
2. MATH-07: BM25 Index

**Track D (Infrastructure)**:
1. MATH-03: Token Bucket
2. MATH-09: EWMA/Forecasting

---

## Acceptance Criteria (All Items)

Every utility must:

1. **Type Safety**: Full TypeScript types, no `any`
2. **Tests**: >95% coverage, including edge cases
3. **Documentation**: JSDoc with examples, algorithm source cited
4. **Performance**: Benchmarked, documented complexity
5. **Bundle Size**: Tree-shakeable, no unnecessary dependencies
6. **Integration**: Exported from `@acme/lib`, works in Node and browser

---

## Future Considerations (Out of Scope)

Items that need data/infrastructure first:

| Item | Blocker |
|------|---------|
| A/B test math (power, CUPED) | Needs event instrumentation |
| Newsvendor inventory model | Needs demand data pipeline |
| Collaborative filtering | Needs interaction volume |
| Dynamic pricing | Needs demand estimation + legal review |

---

## References

- BM25: Robertson & Zaragoza, "The Probabilistic Relevance Framework"
- HyperLogLog: Flajolet et al., "HyperLogLog: the analysis of a near-optimal cardinality estimation algorithm"
- Count-Min Sketch: Cormode & Muthukrishnan, "An Improved Data Stream Summary"
- t-Digest: Dunning & Ertl, "Computing Extremely Accurate Quantiles Using t-Digests"
- Bloom Filter: Bloom, "Space/Time Trade-offs in Hash Coding with Allowable Errors"
- OKLCH: Björn Ottosson, "A perceptual color space for image processing"
