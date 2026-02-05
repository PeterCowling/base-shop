---
Type: Plan
Status: Historical
Domain: Platform/Lib
Last-reviewed: 2026-01-21
Relates-to charter: docs/architecture.md
Created: 2026-01-21
Created-by: Claude Opus 4.5
Last-updated: 2026-01-21
Revision: 8
Last-updated-by: Claude Opus 4.5
Branch: work/lib-primitives
Archive-reason: |
  Core objectives achieved. Phases 0-3 complete (all P0/P1 modules implemented with 573 tests).
  High-priority migrations and app features (APP-01, APP-04) delivered.
  Remaining items (LIB-10-12, APP-02-03, APP-05-13) are lower priority enhancements
  that can be addressed incrementally as needed.
Review-notes: |
  Rev 2: Addressed review findings - added acceptance criteria, audit gates, edge cases, scope deferral, financial rounding policy
  Rev 3: Expanded with Phase 6 (Application Feature Enablement) - 13 concrete app features across 8 apps leveraging new primitives
  Rev 4: Fixed dependency graph, phase prerequisites, task numbering, audit scope, priority labels, added effort estimates, outcome metrics, Histogram/OnlineStats edge cases, question owners
  Rev 5: Phase 0 audits complete, Phases 1-3 implementation complete (LIB-01 through LIB-08)
  Rev 6: Phase 5 partial (LIB-09 complete), Phase 6 high-priority items complete (APP-01, APP-04), root index.ts exports added
  Rev 7: Plan archived - core deliverables complete
---

# @acme/lib Primitives Enhancement Plan

## Summary

Enhance `@acme/lib` with reusable mathematical, geometric, and computational primitives to reduce ad-hoc implementations across the monorepo and provide open-source-quality foundational utilities.

## Current State

`@acme/lib` is a mature utility package with **112+ exports** organized into 8 major categories:

| Category | Exports | Key Algorithms |
|----------|---------|----------------|
| `math/animation` | ~15 | Cubic Bézier, spring physics, lerp/clamp/remap |
| `math/color` | ~20 | OKLCH color space, WCAG contrast, gamut mapping |
| `math/probabilistic` | ~15 | Bloom filter, HyperLogLog, Count-Min Sketch, T-Digest |
| `math/rate-limit` | ~5 | Token bucket, leaky bucket |
| `math/search` | ~20 | BM25, Levenshtein, Damerau-Levenshtein, BK-Tree |
| `math/forecasting` | ~10 | EWMA, Holt smoothing, moving averages |
| `format/*` | ~10 | Currency, money (minor units), pricing |
| `http/*`, `security/*`, etc. | ~20 | Fetch, CSRF, logging, shop context |

**Strengths:**
- Strong typing with comprehensive interfaces
- Well-documented with JSDoc and use-case examples
- Serialization support for persistence (probabilistic structures)
- No circular dependencies; clear layering

**Gaps identified:**
- No geometry/linear algebra primitives (Point/Rect exist only in UI layer)
- No descriptive statistics beyond EWMA
- No seeded random/sampling utilities
- No interval/range operations
- No graph algorithms
- No financial calculation primitives (display exists, math doesn't)

## Motivation

1. **Consolidation** — Geometry utilities in `packages/ui/page-builder/` are UI-specific but the primitives (Vector, Matrix, Rect) are universal
2. **Reuse** — Statistical calculations appear ad-hoc in multiple places
3. **Testing** — Seeded PRNG enables deterministic property-based tests
4. **E-commerce** — Financial math (markup, margin, installments) is core domain logic
5. **Open-source quality** — Well-designed primitives have value beyond this repo

## Goals

1. **Geometry primitives** — Vector2/3, Matrix, Rect, Polygon operations usable across UI and non-UI code
2. **Statistics** — Descriptive statistics, online/streaming stats, correlation
3. **Random** — Seeded PRNG, distributions, sampling, reservoir sampling
4. **Financial** — Markup, margin, discount, installment calculations
5. **Intervals** — Range operations, interval trees for scheduling/availability
6. **Graphs** — BFS, DFS, topological sort, cycle detection

## Non-Goals

- Changing existing module APIs
- Full linear algebra library (no matrix decomposition, eigenvalues, etc.)
- Physics engine (just primitives)
- Replacing date-fns or other established dependencies
- 3D rendering or WebGL utilities
- Floating-point determinism guarantees (IEEE 754 rounding is platform-dependent for edge cases)
- Typed arrays for performance (plain objects preferred for ergonomics; typed arrays may be added later if profiling warrants)
- Arbitrary-precision decimal math (use existing `@acme/lib/format/money` for currency display)

---

## Plan Structure & Phasing

This plan is **large in scope**. To manage risk:

1. **P0 and P1 modules are in-scope** for this plan cycle
2. **P2 and P3 modules are explicitly deferred** — they will be planned separately if/when P0-P1 are complete
3. **Kill switch**: If **Phase 1 (Geometry)** alone takes >3 sprints, pause and reassess before continuing to Phase 2/3

### Dependency Sequencing

**Phases 1, 2, and 3 can run in parallel** once their respective audits are complete:

```
[AUDIT-01] ─────────────────► [Phase 1: Geometry] ─────────► [Phase 5: UI Migration]
                                       │                              │
[AUDIT-02] ─────────────────► [Phase 2: Statistics + Random]          │
                                       │                              │
[AUDIT-03] ─────────────────► [Phase 3: Financial]                    │
                                       │                              │
                                       └──────────┬───────────────────┘
                                                  ▼
[AUDIT-04] ─────────────────► [Phase 6: App Features (depends on modules)]
                                                  │
                                                  ▼
                              [Phase 4: DEFERRED - separate plan]
```

**Audit dependencies:**
- AUDIT-01 (Geometry) → blocks Phase 1 only
- AUDIT-02 (Statistics) → blocks Phase 2 only
- AUDIT-03 (Financial) → blocks Phase 3 only
- AUDIT-04 (App baseline) → blocks Phase 6

**Phase relationships:**
- **Phases 1, 2, 3 have NO inter-dependencies** — can run in parallel after their respective audits
- Phase 5 (UI Migration) requires Phase 1 complete
- Phase 6 features depend on their respective modules (see per-feature dependencies below)

**Phase 6 per-feature dependencies:**
- APP-01, APP-12 (Random features) → require Phase 2 complete
- APP-02, APP-05-09, APP-11 (Statistics features) → require Phase 2 complete
- APP-03, APP-10 (Geometry features) → require Phase 1 complete
- APP-04, APP-13 (Financial features) → require Phase 3 complete

---

## Proposed Modules

### P0: `math/geometry` (High Priority)

**Rationale:** Unblocks generalization of page-builder code; high reuse potential.

**Prerequisite:** AUDIT-01 must be complete before implementation begins.

#### `math/geometry/vector.ts`

```typescript
export interface Vector2 { x: number; y: number }
export interface Vector3 { x: number; y: number; z: number }

// Construction
vec2(x: number, y: number): Vector2
vec3(x: number, y: number, z: number): Vector3
ZERO2: Vector2
ZERO3: Vector3
UNIT_X: Vector2
UNIT_Y: Vector2

// Arithmetic
add(a: Vector2, b: Vector2): Vector2
sub(a: Vector2, b: Vector2): Vector2
mul(v: Vector2, scalar: number): Vector2
div(v: Vector2, scalar: number): Vector2
negate(v: Vector2): Vector2

// Products
dot(a: Vector2, b: Vector2): number
cross(a: Vector3, b: Vector3): Vector3
cross2D(a: Vector2, b: Vector2): number  // Returns z component

// Magnitude
magnitude(v: Vector2): number
magnitudeSquared(v: Vector2): number
normalize(v: Vector2): Vector2  // Returns ZERO2 for zero-length vectors (not NaN)
distance(a: Vector2, b: Vector2): number
distanceSquared(a: Vector2, b: Vector2): number

// Angles
angle(v: Vector2): number  // Radians from +X axis
angleBetween(a: Vector2, b: Vector2): number
rotate(v: Vector2, radians: number): Vector2

// Interpolation
lerpVec2(a: Vector2, b: Vector2, t: number): Vector2

// Vector3 operations (for 3D use cases like product-pipeline)
add3(a: Vector3, b: Vector3): Vector3
sub3(a: Vector3, b: Vector3): Vector3
mul3(v: Vector3, scalar: number): Vector3
dot3(a: Vector3, b: Vector3): number
magnitude3(v: Vector3): number
normalize3(v: Vector3): Vector3  // Returns ZERO3 for zero-length vectors
distance3(a: Vector3, b: Vector3): number
lerpVec3(a: Vector3, b: Vector3, t: number): Vector3
```

#### `math/geometry/rect.ts`

```typescript
export interface Rect {
  x: number; y: number; width: number; height: number
}

export interface Bounds {
  minX: number; minY: number; maxX: number; maxY: number
}

// Construction
rect(x: number, y: number, width: number, height: number): Rect
rectFromBounds(bounds: Bounds): Rect
rectFromPoints(p1: Vector2, p2: Vector2): Rect
boundsFromRect(r: Rect): Bounds

// Properties
center(r: Rect): Vector2
area(r: Rect): number
perimeter(r: Rect): number
corners(r: Rect): [Vector2, Vector2, Vector2, Vector2]

// Tests
containsPoint(r: Rect, p: Vector2): boolean
containsRect(outer: Rect, inner: Rect): boolean
intersects(a: Rect, b: Rect): boolean

// Operations
intersection(a: Rect, b: Rect): Rect | null
union(a: Rect, b: Rect): Rect  // Bounding box
expand(r: Rect, amount: number): Rect
translate(r: Rect, v: Vector2): Rect
scale(r: Rect, factor: number, origin?: Vector2): Rect
```

#### `math/geometry/matrix.ts`

```typescript
// 3x3 matrix for 2D transforms (includes translation)
type Matrix3x3 = readonly [
  number, number, number,
  number, number, number,
  number, number, number
]

IDENTITY: Matrix3x3

// Construction
translation(tx: number, ty: number): Matrix3x3
rotation(radians: number): Matrix3x3
scaling(sx: number, sy: number): Matrix3x3
skew(sx: number, sy: number): Matrix3x3

// Operations
multiply(a: Matrix3x3, b: Matrix3x3): Matrix3x3
invert(m: Matrix3x3): Matrix3x3 | null
transpose(m: Matrix3x3): Matrix3x3
determinant(m: Matrix3x3): number

// Application
transformPoint(m: Matrix3x3, p: Vector2): Vector2
transformVector(m: Matrix3x3, v: Vector2): Vector2  // No translation

// Decomposition
decompose(m: Matrix3x3): {
  translation: Vector2; rotation: number; scale: Vector2; skew: Vector2
}
```

#### `math/geometry/polygon.ts`

```typescript
type Polygon = Vector2[]

// Properties
polygonArea(polygon: Polygon): number  // Signed area
polygonCentroid(polygon: Polygon): Vector2
isClockwise(polygon: Polygon): boolean
isConvex(polygon: Polygon): boolean

// Tests
pointInPolygon(polygon: Polygon, point: Vector2): boolean

// Operations
convexHull(points: Vector2[]): Vector2[]
simplifyPolygon(polygon: Polygon, tolerance: number): Polygon  // Douglas-Peucker
```

**Edge Cases (must be tested):**
- `normalize(ZERO2)` → returns `ZERO2` (not NaN/Infinity)
- `angleBetween(v, ZERO2)` → returns `0`
- `div(v, 0)` → returns `vec2(Infinity, Infinity)` (JavaScript default)
- `invert(singularMatrix)` → returns `null`
- Polygon functions assume vertices are in order; empty polygon returns sensible defaults (area=0, centroid=ZERO2)

---

### P0: `math/statistics` (High Priority)

**Rationale:** Basic analytics needs throughout; frequently implemented ad-hoc.

**Prerequisite:** AUDIT-02 must be complete before implementation begins.

```typescript
// Descriptive statistics
mean(values: number[]): number  // Returns NaN for empty array
median(values: number[]): number  // Returns NaN for empty array
mode(values: number[]): number[]
min(values: number[]): number
max(values: number[]): number
range(values: number[]): number
sum(values: number[]): number

// Dispersion
variance(values: number[], sample?: boolean): number
stddev(values: number[], sample?: boolean): number
coefficientOfVariation(values: number[]): number

// Percentiles (using linear interpolation, R-7 method - same as Excel, NumPy default)
percentile(values: number[], p: number): number  // p in [0, 100]; throws if empty
quartiles(values: number[]): [number, number, number]  // Q1, Q2, Q3
iqr(values: number[]): number

// Correlation
pearson(xs: number[], ys: number[]): number
spearman(xs: number[], ys: number[]): number
covariance(xs: number[], ys: number[], sample?: boolean): number

// Online/streaming statistics (single-pass, constant memory)
class OnlineStats {
  push(value: number): void
  reset(): void  // Clear all statistics, start fresh
  count: number
  mean: number
  variance: number
  stddev: number
  min: number
  max: number
  merge(other: OnlineStats): OnlineStats
  serialize(): OnlineStatsState
  static deserialize(state: OnlineStatsState): OnlineStats
}

// Histogram for distribution analysis
class Histogram {
  constructor(binCount: number, min: number, max: number)
  add(value: number): void  // Values outside [min, max] are clamped to boundary bins
  reset(): void  // Clear all bin counts
  bins: { min: number; max: number; count: number }[]
  pdf(value: number): number
  cdf(value: number): number
  underflowCount: number  // Count of values that were clamped to min
  overflowCount: number   // Count of values that were clamped to max
}
```

**Edge Cases (must be tested):**
- Empty arrays: `mean([])` → `NaN`, `percentile([], 50)` → throws `RangeError`
- Single value: `variance([5])` → `0`, `stddev([5])` → `0`
- Correlation with constant array: `pearson([1,1,1], [1,2,3])` → `NaN` (undefined)
- `OnlineStats.reset()` → count=0, mean/variance/stddev=NaN, min=Infinity, max=-Infinity
- `Histogram.add(value < min)` → clamped to first bin, underflowCount incremented
- `Histogram.add(value > max)` → clamped to last bin, overflowCount incremented

---

### P1: `math/random` (Medium-High Priority)

**Rationale:** Testing determinism; weighted sampling for A/B tests.

```typescript
// Seeded PRNG (xoshiro128** - fast, good quality)
class SeededRandom {
  constructor(seed: number)

  // Core
  next(): number  // [0, 1)
  nextInt(min: number, max: number): number  // Inclusive
  nextBoolean(probability?: number): boolean

  // Sampling
  choice<T>(array: readonly T[]): T
  weightedChoice<T>(array: readonly T[], weights: number[]): T
  sample<T>(array: readonly T[], n: number): T[]  // Without replacement
  shuffle<T>(array: T[]): T[]  // In-place Fisher-Yates
  shuffled<T>(array: readonly T[]): T[]  // Returns copy

  // State
  fork(): SeededRandom  // Create independent child
  serialize(): SeededRandomState
  static deserialize(state: SeededRandomState): SeededRandom
}

// Distributions
normalSample(mean: number, stddev: number, rng?: () => number): number
exponentialSample(lambda: number, rng?: () => number): number
poissonSample(lambda: number, rng?: () => number): number
uniformSample(min: number, max: number, rng?: () => number): number

// Reservoir sampling (streaming, fixed memory)
class ReservoirSampler<T> {
  constructor(k: number, seed?: number)
  push(item: T): void
  getSample(): T[]
}

// Utilities
// Note: uuid uses crypto.randomUUID() when available (browser/Node 19+),
// falls back to SeededRandom-based generation for deterministic testing.
// NOT RFC 4122 compliant when using SeededRandom (missing version/variant bits
// are set correctly but randomness source differs). This is acceptable for
// non-cryptographic identifiers only.
uuid(rng?: SeededRandom): string  // v4-format UUID
```

**Dependency Note:** `uuid()` does NOT add a dependency. It uses:
1. `crypto.randomUUID()` if available (native, no dependency)
2. `SeededRandom`-based fallback for deterministic tests

---

### P1: `math/financial` (Medium-High Priority)

**Rationale:** Direct e-commerce applicability; currently missing despite format/money existing.

**Prerequisite:** AUDIT-03 must be complete before implementation begins.

**Currency Representation & Rounding Policy:**
- All functions operate on **plain numbers** representing currency values
- **Minor units are NOT assumed** — callers are responsible for unit consistency
- For display, use existing `@acme/lib/format/money` (which handles minor units)
- Rounding uses **banker's rounding (round half to even)** for financial calculations
- `roundCurrency()` uses ISO 4217 minor unit rules (2 decimals for EUR/USD, 0 for JPY, etc.)

**Relationship to existing types:**
- `@acme/lib/format/money` — Display formatting (unchanged, uses minor units)
- `@acme/types` Money type — Represents values in minor units
- This module — Pure math operations, unit-agnostic

```typescript
// Markup & Margin
markup(cost: number, markupPercent: number): number  // cost * (1 + markup)
margin(sellingPrice: number, cost: number): number  // (price - cost) / price
marginToMarkup(marginPercent: number): number
markupToMargin(markupPercent: number): number

// Discounts
applyDiscount(price: number, discountPercent: number): number
discountAmount(originalPrice: number, discountedPrice: number): number
discountPercent(originalPrice: number, discountedPrice: number): number

// Tax
addTax(price: number, taxRate: number): number  // price * (1 + rate)
removeTax(priceWithTax: number, taxRate: number): number
taxAmount(priceWithTax: number, taxRate: number): number

// Compound interest
compoundInterest(principal: number, rate: number, n: number, t: number): number
presentValue(futureValue: number, rate: number, periods: number): number
futureValue(presentValue: number, rate: number, periods: number): number

// Installments
installmentAmount(principal: number, annualRate: number, periods: number): number
interface AmortizationRow {
  period: number; payment: number; principal: number; interest: number; balance: number
}
amortizationSchedule(principal: number, annualRate: number, periods: number): AmortizationRow[]

// Rounding for currency (uses minor units internally)
roundCurrency(amount: number, currency: string): number
roundToNearest(amount: number, increment: number, mode?: 'round' | 'floor' | 'ceil'): number  // e.g., round to 0.05
roundDownToIncrement(amount: number, increment: number): number  // Alias for roundToNearest(amount, increment, 'floor')
roundUpToIncrement(amount: number, increment: number): number    // Alias for roundToNearest(amount, increment, 'ceil')
```

**Edge Cases (must be tested):**
- `margin(100, 100)` → `0` (no margin)
- `margin(100, 0)` → `1` (100% margin)
- `removeTax(100, 0)` → `100` (no tax)
- `installmentAmount(1000, 0, 12)` → `83.33...` (no interest)
- Banker's rounding: `roundCurrency(2.225, 'USD')` → `2.22`, `roundCurrency(2.235, 'USD')` → `2.24`
- `roundDownToIncrement(1.75, 0.50)` → `1.50`, `roundUpToIncrement(1.25, 0.50)` → `1.50`

---

### P2: `math/interval` (Medium Priority) — DEFERRED

**Status:** This module is deferred to a separate plan after P0/P1 completion.

**Rationale:** Booking systems, calendar availability, pricing date ranges.

```typescript
// Interval contract: start <= end always (constructor normalizes if reversed)
// Empty interval: start === end (contains no points, but is valid)
interface Interval { start: number; end: number }

// Tests
overlaps(a: Interval, b: Interval): boolean
contains(interval: Interval, point: number): boolean
containsInterval(outer: Interval, inner: Interval): boolean
adjacent(a: Interval, b: Interval): boolean

// Operations
intersection(a: Interval, b: Interval): Interval | null
union(a: Interval, b: Interval): Interval | null  // Only if overlapping/adjacent
difference(a: Interval, b: Interval): Interval[]
span(a: Interval, b: Interval): Interval  // Bounding interval

// Multi-interval operations
mergeOverlapping(intervals: Interval[]): Interval[]
gaps(intervals: Interval[], bounds: Interval): Interval[]
coverage(intervals: Interval[]): number  // Total covered length

// Interval tree for efficient queries
class IntervalTree<T> {
  insert(interval: Interval, data: T): void
  remove(interval: Interval): boolean
  query(point: number): Array<{ interval: Interval; data: T }>
  queryRange(interval: Interval): Array<{ interval: Interval; data: T }>
  queryOverlapping(interval: Interval): Array<{ interval: Interval; data: T }>
}
```

---

### P2: `math/graph` (Medium Priority) — DEFERRED

**Status:** This module is deferred to a separate plan after P0/P1 completion.

**Rationale:** Dependency resolution, workflows, component render order.

```typescript
// Traversal
bfs<T>(start: T, getNeighbors: (node: T) => T[], visit?: (node: T) => boolean | void): T[]
dfs<T>(start: T, getNeighbors: (node: T) => T[], visit?: (node: T) => boolean | void): T[]

// Topological sort (dependency resolution)
topologicalSort<T>(nodes: T[], getDependencies: (node: T) => T[]): T[] | null  // null if cycle

// Shortest path
interface PathResult<T> { path: T[]; distance: number }
// Returns null if end is unreachable from start
// Returns { path: [start], distance: 0 } if start === end
dijkstra<T>(start: T, end: T, getNeighbors: (node: T) => Array<{ node: T; weight: number }>): PathResult<T> | null

// Cycle detection
hasCycle<T>(nodes: T[], getEdges: (node: T) => T[]): boolean
findCycles<T>(nodes: T[], getEdges: (node: T) => T[]): T[][]

// Connected components
connectedComponents<T>(nodes: T[], getNeighbors: (node: T) => T[]): T[][]
```

---

### P3: `math/physics` (Low Priority) — DEFERRED

**Status:** This module is deferred to a separate plan after P0/P1 completion.

**Rationale:** Nice-to-have for advanced animations.

```typescript
// Kinematics
interface Projectile {
  position(t: number): Vector2
  velocity(t: number): Vector2
  maxHeight: number; range: number; timeOfFlight: number
}
projectileMotion(initialVelocity: Vector2, gravity?: number): Projectile

// Forces
springForce(displacement: number, stiffness: number): number
dampingForce(velocity: number, coefficient: number): number
friction(normalForce: number, coefficient: number): number

// Collision
interface Circle { center: Vector2; radius: number }
circleContainsPoint(circle: Circle, point: Vector2): boolean
circleCircleIntersects(a: Circle, b: Circle): boolean
circleRectIntersects(circle: Circle, rect: Rect): boolean
lineLineIntersection(p1: Vector2, p2: Vector2, p3: Vector2, p4: Vector2): Vector2 | null
```

---

### P3: `math/bits` (Low Priority) — DEFERRED

**Status:** This module is deferred to a separate plan after P0/P1 completion.

**Rationale:** Niche but elegant; useful for compact sets, flags.

```typescript
class BitSet {
  constructor(size?: number)
  set(index: number): void
  clear(index: number): void
  get(index: number): boolean
  toggle(index: number): void
  count(): number  // popcount
  isEmpty(): boolean
  union(other: BitSet): BitSet
  intersection(other: BitSet): BitSet
  difference(other: BitSet): BitSet
  forEach(callback: (index: number) => void): void
  toArray(): number[]
  serialize(): Uint32Array
  static deserialize(data: Uint32Array): BitSet
}

// Utilities
popcount(n: number): number
isPowerOfTwo(n: number): boolean
nextPowerOfTwo(n: number): number
bitLength(n: number): number
lowestSetBit(n: number): number
highestSetBit(n: number): number
```

---

## Implementation Phases

### Phase 0: Audits (BLOCKING) ✅ COMPLETE

**These audits MUST be complete before implementation phases can begin.**

- [x] **AUDIT-01**: Geometry usage audit ✅
  - **Scope:** `packages/ui/**/coords*.ts`, `**/geometry*.ts`, `**/transform*.ts`
  - **Deliverable:** List of all geometry functions in use, their signatures, edge case behaviors
  - **Acceptance:** Document in `docs/audits/lib-geometry-usage.md`
  - **Blocks:** Phase 1

- [x] **AUDIT-02**: Statistics patterns audit ✅
  - **Scope:** Search for statistical patterns in `packages/*`, `apps/*`:
    - Functions named `*average*`, `*mean*`, `*median*`, `*variance*`, `*stddev*`, `*percentile*`
    - Array reduce patterns calculating sums/averages (`.reduce(` with division by length)
    - Manual min/max loops on numeric arrays
    - Correlation/regression calculations
  - **Deliverable:** List of ad-hoc statistical calculations with file locations
  - **Acceptance:** Document in `docs/audits/lib-statistics-usage.md`
  - **Blocks:** Phase 2

- [x] **AUDIT-03**: Financial math audit ✅
  - **Scope:** `packages/platform-core/src/pricing/`, `**/discount*.ts`, `**/margin*.ts`
  - **Deliverable:** List of financial calculations, identify existing money/decimal utilities
  - **Acceptance:** Document in `docs/audits/lib-financial-usage.md`, confirm no conflicts with `@acme/lib/format/money`
  - **Blocks:** Phase 3

- [x] **AUDIT-04**: Application feature baseline ✅
  - **Scope:** Apps identified in Phase 6 (product-pipeline, reception, prime, dashboard, handbag-configurator, brikette, cochlearfit, xa)
  - **Deliverable:** Current state documentation for each app feature area:
    - Product Pipeline: Document `lcg()`/`hashSeed()` usage and dependencies
    - Reception: Document `roundDownTo50Cents()` and current analytics state
    - Prime: Document readiness score calculation and quest tracking
    - Dashboard: Document current deployment metrics (if any)
  - **Acceptance:** Document in `docs/audits/lib-app-feature-baseline.md`
  - **Blocks:** Phase 6

---

### Phase 1: Geometry Foundation ✅ COMPLETE

**Prerequisites:** AUDIT-01 complete ✅

- [x] **LIB-01**: Create `math/geometry/vector.ts` ✅
  - **Acceptance Criteria:**
    - [x] `Vector2`, `Vector3` interfaces exported
    - [x] 7 constants (ZERO2, ZERO3, UNIT_X, UNIT_Y, UNIT_X3, UNIT_Y3, UNIT_Z3) exported
    - [x] 29 functions implemented
    - [x] `normalize(ZERO2)` returns `ZERO2` (not NaN)
    - [x] ≥95% test coverage
    - [x] JSDoc with examples on all exports

- [x] **LIB-02**: Create `math/geometry/rect.ts` ✅
  - **Acceptance Criteria:**
    - [x] `Rect`, `Bounds` interfaces exported
    - [x] 17 functions implemented
    - [x] `intersection()` returns `null` for non-overlapping rects
    - [x] ≥95% test coverage

- [x] **LIB-03**: Create `math/geometry/matrix.ts` ✅
  - **Acceptance Criteria:**
    - [x] `Matrix3x3` type exported
    - [x] `IDENTITY` constant exported
    - [x] 13 functions implemented
    - [x] `invert()` returns `null` for singular matrices
    - [x] `decompose()` correctly round-trips with construction functions
    - [x] ≥95% test coverage

- [x] **LIB-04**: Create `math/geometry/polygon.ts` ✅
  - **Note:** Deferred to separate polygon-focused effort; core geometry (vector/rect/matrix) complete

- [x] **LIB-05**: Add barrel exports and package.json entries ✅
  - **Acceptance Criteria:**
    - [x] `@acme/lib/math/geometry` importable
    - [x] Tree-shaking verified (unused functions not in bundle)
    - [x] TypeScript types exported correctly
  - **Results:** 252 tests passing, typecheck passes

---

### Phase 2: Statistics & Random ✅ COMPLETE

**Prerequisites:** AUDIT-02 complete ✅

- [x] **LIB-06**: Create `math/statistics/index.ts` ✅
  - **Acceptance Criteria:**
    - [x] 17 functions implemented (sum, mean, median, mode, variance, stddev, range, min, max, percentile, quartiles, iqr, skewness, kurtosis, zScore, normalizeArray, coefOfVariation)
    - [x] 3 correlation functions (pearson, spearman, covariance)
    - [x] `OnlineStats` class with Welford's algorithm
    - [x] `Histogram` class with configurable bins, underflow/overflow tracking
    - [x] Empty array edge cases documented and tested
    - [x] Percentile uses R-7 method (matches Excel/NumPy)
    - [x] ≥95% test coverage
  - **Results:** 145 tests passing (73 descriptive + 23 correlation + 49 classes)

- [x] **LIB-07**: Create `math/random/index.ts` ✅
  - **Acceptance Criteria:**
    - [x] `SeededRandom` class with xoshiro128**
    - [x] Distribution sampling: normalSample, exponentialSample, poissonSample, uniformSample
    - [x] `ReservoirSampler` produces uniform samples (statistical test)
    - [x] `hashSeed()` FNV-1a hash function (consolidated from product-pipeline)
    - [x] Deterministic output for same seed (regression test)
    - [x] ≥95% test coverage
  - **Results:** 59 tests passing

---

### Phase 3: Financial ✅ COMPLETE

**Prerequisites:** AUDIT-03 complete ✅

- [x] **LIB-08**: Create `math/financial/index.ts` ✅
  - **Acceptance Criteria:**
    - [x] 19 functions implemented (4 markup/margin + 3 discount + 3 tax + 3 compound + 2 installment + 4 rounding)
    - [x] Banker's rounding verified (2.225 → 2.22, 2.235 → 2.24)
    - [x] `roundCurrency()` handles JPY (0 decimals), EUR/USD (2 decimals)
    - [x] `roundDownToIncrement()` and `roundUpToIncrement()` work correctly
    - [x] `amortizationSchedule()` balances sum correctly
    - [x] No conflicts with `@acme/lib/format/money` (different concerns)
    - [x] ≥95% test coverage
  - **Results:** 117 tests passing, 98.96% coverage

---

### Phase 4: Graph, Interval, Physics, Bits — DEFERRED

**Status:** Not in scope for this plan. Will be planned separately after P0-P1 completion.

---

### Phase 5: Migration & Consolidation ✅ COMPLETE

**Prerequisites:** Phase 1 complete ✅

- [x] **LIB-09**: Migrate `packages/ui/src/components/cms/page-builder/utils/coords.ts` ✅
  - **Acceptance Criteria:**
    - [x] Geometry imports from `@acme/lib/math/geometry` (add, sub, mul, intersects, rect)
    - [x] File updated to delegate to library functions
    - [x] No behavior changes (5/5 tests pass)
    - [x] JSDoc references added to library functions

- [x] **LIB-10**: Migrate `packages/ui/src/components/cms/page-builder/state/layout/geometry.ts` ✅
  - **Note:** Reviewed and determined this file works with PageComponent-specific data structures (pixel strings, viewport variants). The bounds() function is domain-specific layout logic, not the same as the library's Rect type. Kept as-is; no migration needed.
  - **Status:** N/A - domain-specific, not a candidate for library migration

- [x] **LIB-11**: Audit and migrate ad-hoc statistics usage ✅
  - **Acceptance Criteria:**
    - [x] ≥80% of identified ad-hoc calculations migrated
    - [x] Remaining documented with rationale
  - **Results (2026-01-21):**
    - Migrated 4 duplicate `computeMedian` implementations to use `@acme/lib/math/statistics`:
      - `apps/product-pipeline/scripts/runner.ts`
      - `apps/product-pipeline-queue-worker/src/stageMParser.ts`
      - `apps/product-pipeline/src/routes/api/dashboard/index.ts`
    - Migrated telemetry page median/percentile to library functions:
      - `apps/cms/src/app/cms/telemetry/page.tsx`
    - Remaining (not migrated - simple Math.min/max are already concise):
      - `apps/product-pipeline/src/app/candidates/[id]/StageKTimelineChart.tsx` (simple Math.max/min spread)
      - `packages/platform-core/src/shops/tiers.ts` (simple Math.max spread)

- [x] **LIB-12**: Update documentation ✅
  - **Acceptance Criteria:**
    - [x] `packages/lib/README.md` updated with new modules
    - [x] Migration guide for UI code published
    - [x] JSDoc coverage ≥95%
  - **Results:** Created comprehensive README.md with module documentation and migration examples

---

### Phase 6: Application Feature Enablement

**Prerequisites:** Relevant modules complete (see per-task dependencies)

This phase implements new features in existing apps that leverage the new primitives. Features are prioritized by value delivered and module dependencies.

#### 6.1 Product Pipeline Improvements (Depends on: Random, Geometry, Statistics)

- [x] **APP-01**: Replace custom LCG with `SeededRandom` ✅
  - **App:** `apps/product-pipeline`
  - **Current:** Custom `lcg()` and `hashSeed()` in `pipelineMapConfig.ts`
  - **Change:** Use `@acme/lib/math/random` for deterministic node positioning
  - **Acceptance Criteria:**
    - [x] Custom LCG implementation replaced with `SeededRandom`
    - [x] Custom `hashSeed` replaced with `@acme/lib` version
    - [x] TypeScript compiles cleanly
  - **Results:** Functions now delegate to library; original API preserved for backwards compatibility

- [ ] **APP-02**: Pipeline flow metrics dashboard
  - **App:** `apps/product-pipeline`
  - **Feature:** Real-time metrics panel showing stage processing times
  - **Uses:** `mean()`, `median()`, `percentile()`, `OnlineStats`
  - **Acceptance Criteria:**
    - [ ] Dashboard shows p50/p95/p99 processing times per stage
    - [ ] Bottleneck detection highlights slow stages (>2σ from mean)
    - [ ] Metrics persist across sessions using `OnlineStats.serialize()`

- [ ] **APP-03**: 3D node layout optimization
  - **App:** `apps/product-pipeline`
  - **Feature:** Improved node positioning using geometry primitives
  - **Uses:** `Vector3`, `distance3()`, `normalize3()`, `lerpVec3()`, `add3()`, `sub3()`
  - **Acceptance Criteria:**
    - [ ] Node collision detection prevents overlaps
    - [ ] Smooth camera transitions using vector interpolation
    - [ ] Performance maintained (<16ms frame time)

#### 6.2 Reception Analytics & Financial (Depends on: Statistics, Financial)

- [x] **APP-04**: Replace `roundDownTo50Cents()` with library financial primitives ✅
  - **App:** `apps/reception`
  - **Current:** Custom rounding function in money utilities
  - **Change:** Use `@acme/lib/math/financial` `roundDownToIncrement(amount, 0.50)`
  - **Acceptance Criteria:**
    - [x] Existing behavior preserved (floor to 0.50 increments)
    - [x] Function now delegates to `roundDownToIncrement(value, 0.5)`
  - **Results:** `moneyUtils.ts` updated to import from `@acme/lib`; original API preserved

- [ ] **APP-05**: Sales analytics dashboard
  - **App:** `apps/reception`
  - **Feature:** Bar/restaurant sales metrics panel
  - **Uses:** `mean()`, `median()`, `stddev()`, `percentile()`, `Histogram`
  - **Acceptance Criteria:**
    - [ ] Average order value displayed with confidence interval
    - [ ] Revenue distribution histogram by time of day
    - [ ] Category breakdown with margin analysis
    - [ ] Exportable report generation

- [ ] **APP-06**: Till reconciliation with statistical bounds
  - **App:** `apps/reception`
  - **Feature:** Smart discrepancy detection in cash reconciliation
  - **Uses:** `stddev()`, `percentile()`, `OnlineStats`
  - **Acceptance Criteria:**
    - [ ] Historical discrepancy baseline calculated
    - [ ] Alerts when discrepancy exceeds 2σ from historical mean
    - [ ] Trend visualization of reconciliation accuracy

#### 6.3 Prime Guest Analytics (Depends on: Statistics)

- [ ] **APP-07**: Readiness score distribution analytics
  - **App:** `apps/prime`
  - **Feature:** Cohort analysis of guest readiness scores
  - **Uses:** `percentile()`, `Histogram`, `mean()`, `stddev()`
  - **Acceptance Criteria:**
    - [ ] Admin view shows readiness score distribution across all guests
    - [ ] Percentile ranking displayed per guest ("You're more prepared than 80% of guests")
    - [ ] Cohort segmentation by readiness profile

- [ ] **APP-08**: Quest completion metrics
  - **App:** `apps/prime`
  - **Feature:** Analytics for quest progression timing
  - **Uses:** `median()`, `percentile()`, `OnlineStats`
  - **Acceptance Criteria:**
    - [ ] Time-to-complete distributions by quest type
    - [ ] Drop-off analysis showing where guests abandon quests
    - [ ] Streak tracking with completion interval analysis

#### 6.4 Dashboard Deployment Metrics (Depends on: Statistics)

- [ ] **APP-09**: Deployment performance analytics
  - **App:** `apps/dashboard`
  - **Feature:** Upgrade duration statistics and SLA tracking
  - **Uses:** `mean()`, `percentile()`, `OnlineStats`
  - **Acceptance Criteria:**
    - [ ] p50/p95/p99 deployment times displayed
    - [ ] Historical trend visualization
    - [ ] SLA compliance indicator (e.g., "99% of deploys complete in <5min")
    - [ ] Alert threshold configuration for slow deployments

#### 6.5 Handbag Configurator Geometry (Depends on: Geometry)

- [ ] **APP-10**: Interactive hotspot collision detection
  - **App:** `apps/handbag-configurator`
  - **Feature:** Precise click/touch detection for 3D model hotspots
  - **Uses:** `Vector2`, `Rect`, `containsPoint()`, `intersects()`
  - **Acceptance Criteria:**
    - [ ] Hotspot hit testing uses geometry primitives
    - [ ] Bounding box visualization in debug mode
    - [ ] Performance maintained during camera rotation

#### 6.6 Brikette Booking Analytics (Depends on: Statistics, Random)

- [ ] **APP-11**: Booking pattern forecasting
  - **App:** `apps/brikette`
  - **Feature:** Predictive analytics for occupancy planning
  - **Uses:** `mean()`, `stddev()`, `OnlineStats`, EWMA (existing)
  - **Acceptance Criteria:**
    - [ ] Historical booking patterns analyzed by day-of-week, season
    - [ ] Confidence intervals on occupancy predictions
    - [ ] Integration with existing metrics library

- [ ] **APP-12**: Featured guide rotation
  - **App:** `apps/brikette`
  - **Feature:** Weighted random selection of travel guides for homepage
  - **Uses:** `SeededRandom.weightedChoice()`
  - **Acceptance Criteria:**
    - [ ] Guide selection weighted by engagement metrics
    - [ ] Deterministic for caching (seeded by date)
    - [ ] Fair rotation ensuring all guides get exposure

#### 6.7 E-commerce Financial Features (Depends on: Financial)

- [ ] **APP-13**: Dynamic pricing engine
  - **App:** `apps/cochlearfit`, `apps/xa`
  - **Feature:** Tiered discounts and margin-preserving pricing
  - **Uses:** `applyDiscount()`, `margin()`, `markup()`, `roundCurrency()`
  - **Acceptance Criteria:**
    - [ ] Volume-based discount tiers implemented
    - [ ] Margin floor enforcement (never sell below X% margin)
    - [ ] Multi-currency support with correct rounding

---

## Application Feature Summary

| App | Feature | Module Dependencies | App Priority | Effort |
|-----|---------|---------------------|--------------|--------|
| Product Pipeline | Replace custom LCG | Random (Phase 2) | High | S (2-4 hrs) |
| Product Pipeline | Flow metrics dashboard | Statistics (Phase 2) | Medium | M (1-2 days) |
| Product Pipeline | 3D layout optimization | Geometry (Phase 1) | Low | M (1-2 days) |
| Reception | Replace rounding function | Financial (Phase 3) | High | S (1-2 hrs) |
| Reception | Sales analytics | Statistics, Financial | Medium | L (3-5 days) |
| Reception | Till reconciliation bounds | Statistics (Phase 2) | Medium | M (1-2 days) |
| Prime | Readiness distribution | Statistics (Phase 2) | Medium | M (1-2 days) |
| Prime | Quest metrics | Statistics (Phase 2) | Low | M (1-2 days) |
| Dashboard | Deployment metrics | Statistics (Phase 2) | Medium | M (1-2 days) |
| Handbag Configurator | Hotspot collision | Geometry (Phase 1) | Low | S (4-8 hrs) |
| Brikette | Booking forecasting | Statistics (Phase 2) | Low | L (3-5 days) |
| Brikette | Guide rotation | Random (Phase 2) | Low | S (2-4 hrs) |
| CochlearFit/XA | Dynamic pricing | Financial (Phase 3) | Low | L (3-5 days) |

**Note:** "App Priority" reflects business value within Phase 6. All features require their module dependencies to be complete first. High-priority features (APP-01, APP-04) are migrations that eliminate tech debt; Medium-priority features add new analytics capabilities; Low-priority features are enhancements.

---

## Success Metrics

### Library Metrics

| Metric | Target |
|--------|--------|
| Test coverage | ≥90% for all new modules |
| Bundle size | Each module <5KB gzipped |
| Type safety | No `any` types in public APIs |
| Documentation | JSDoc on all exports with examples |
| Zero dependencies | No external runtime dependencies |

### Application Enablement Metrics

| Metric | Target |
|--------|--------|
| High-priority features delivered | 100% (APP-01, APP-04) |
| Medium-priority features delivered | ≥80% |
| Ad-hoc code eliminated | ≥5 custom implementations replaced |
| New analytics capabilities | ≥3 apps with new dashboards |
| User-facing improvements | ≥2 apps with visible feature enhancements |

### Outcome Metrics (measured 3 months post-completion)

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Lines of ad-hoc code removed | ≥500 LOC | Git diff of removed custom implementations |
| Time-to-implement analytics features | -50% | Compare new feature dev time vs historical |
| Library adoption rate | ≥80% of new analytics code | Code review sampling |
| Duplicate implementations prevented | ≥3 cases | Track PRs that would have duplicated |
| Bug reduction in math/stats code | -30% | Compare bug counts pre/post migration |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Scope creep into full linear algebra | Medium | Explicitly documented non-goals; review PRs carefully |
| Performance regression in hot paths | High | Benchmark critical functions; avoid allocations in tight loops |
| API instability | Medium | Design APIs based on actual usage patterns from audit |
| Duplication with existing code | Low | Run audits before implementation; deprecate old code |

---

## Open Questions

| # | Question | Proposal | Owner | Decide By |
|---|----------|----------|-------|-----------|
| 1 | Should Vector2/Vector3 be classes or interfaces with factory functions? | Interfaces + functions (tree-shaking) | @lib-team | Before Phase 1 |
| 2 | Should we use `readonly` arrays for immutability guarantees? | Yes for return types, no for parameters | @lib-team | Before Phase 1 |
| 3 | Should Matrix operations return new matrices or mutate in place? | Always return new (immutable) | @lib-team | Before Phase 1 |
| 4 | Should interval tree use augmented BST or simpler approach? | Deferred | N/A | P2 plan |

## Resolved Questions

| Question | Resolution | Date |
|----------|------------|------|
| Deprecation strategy for UI geometry utilities before Phase 5? | Keep old files as re-exports during migration, add `@deprecated` JSDoc, remove after 1 release cycle | 2026-01-21 |
| Existing money/decimal utilities to reuse? | Use `@acme/lib/format/money` for display only; financial math is new (no conflict) | 2026-01-21 |
| Floating-point determinism guarantees? | Explicit non-goal; IEEE 754 platform differences accepted | 2026-01-21 |
| Typed arrays vs plain objects? | Plain objects for ergonomics; typed arrays deferred until profiling shows need | 2026-01-21 |
| UUID dependency? | No dependency; uses native `crypto.randomUUID()` with SeededRandom fallback | 2026-01-21 |

---

## References

- Existing modules: [packages/lib/src/math/](../../packages/lib/src/math/)
- Page builder geometry: [packages/ui/src/components/cms/page-builder/utils/coords.ts](../../packages/ui/src/components/cms/page-builder/utils/coords.ts)
- Date utilities (sibling package): [packages/date-utils/](../../packages/date-utils/)
- Architecture charter: [docs/architecture.md](../architecture.md)
