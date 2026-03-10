# @acme/lib

Shared utility library for the base-shop monorepo. Provides type-safe, well-tested primitives for common operations.

## Modules

### Core Utilities

| Module | Import | Description |
|--------|--------|-------------|
| `format` | `@acme/lib/format` | Number, currency, and date formatting |
| `string` | `@acme/lib/string` | String manipulation utilities |
| `array` | `@acme/lib/array` | Array utilities |
| `json` | `@acme/lib/json` | JSON parsing and serialization |
| `http` | `@acme/lib/http` | HTTP utilities (client) |
| `http/server` | `@acme/lib/http/server` | HTTP utilities (server) |
| `security` | `@acme/lib/security` | CSRF tokens, security utilities |
| `shop` | `@acme/lib/shop` | Shop-related utilities |
| `logger` | `@acme/lib/logger` | Pino-based structured logging |
| `context` | `@acme/lib/context` | Request context (server) |

### Math Primitives

Reusable mathematical and computational utilities. Core primitives favor zero
runtime dependencies; advanced adapters may wrap vetted open-source packages
when the central math layer needs capabilities that are not worth rebuilding.

#### Geometry (`@acme/lib/math/geometry`)

Vector, rectangle, and matrix operations for 2D/3D graphics.

```typescript
import { add, sub, normalize, dot, Vector2 } from "@acme/lib/math/geometry";

const a: Vector2 = { x: 1, y: 2 };
const b: Vector2 = { x: 3, y: 4 };
const sum = add(a, b);        // { x: 4, y: 6 }
const unit = normalize(a);    // { x: 0.447, y: 0.894 }
```

**Exports:**
- `Vector2`, `Vector3` interfaces
- Vector operations: `add`, `sub`, `mul`, `div`, `dot`, `cross`, `normalize`, `magnitude`, `distance`, `lerp`, `angle`
- `Rect`, `Bounds` interfaces
- Rectangle operations: `contains`, `intersects`, `intersection`, `union`, `fromPoints`
- `Matrix3x3` type with `IDENTITY`, `translate`, `rotate`, `scale`, `invert`, `decompose`

#### Statistics (`@acme/lib/math/statistics`)

Descriptive statistics, correlation, and streaming algorithms.

```typescript
import { mean, median, percentile, stddev, OnlineStats } from "@acme/lib/math/statistics";

const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
mean(data);           // 5.5
median(data);         // 5.5
percentile(data, 90); // 9.1 (R-7 method, matches Excel/NumPy)
stddev(data);         // 2.87

// Streaming statistics (constant memory)
const stats = new OnlineStats();
for (const x of data) stats.push(x);
console.log(stats.mean, stats.stddev, stats.min, stats.max);
```

**Exports:**
- Descriptive: `sum`, `mean`, `median`, `mode`, `variance`, `stddev`, `range`, `min`, `max`
- Percentiles: `percentile`, `quartiles`, `iqr`
- Distribution: `skewness`, `kurtosis`, `zScore`, `normalizeArray`, `coefOfVariation`
- Correlation: `pearson`, `spearman`, `covariance`
- Classes: `OnlineStats` (Welford's algorithm), `Histogram`

#### Random (`@acme/lib/math/random`)

Deterministic pseudorandom number generation for testing and simulations.

```typescript
import { SeededRandom, hashSeed, ReservoirSampler } from "@acme/lib/math/random";

const rng = new SeededRandom(hashSeed("my-seed"));
rng.next();           // Deterministic float in [0, 1)
rng.nextInt(1, 100);  // Random integer in [1, 100]
rng.shuffle([1,2,3]); // Deterministic shuffle

// Reservoir sampling for streaming data
const sampler = new ReservoirSampler<number>(10, rng);
for (const item of hugeStream) sampler.add(item);
const sample = sampler.getSample(); // Uniform random sample of 10 items
```

**Exports:**
- `SeededRandom` class (xoshiro128** algorithm)
- `hashSeed` (FNV-1a hash for string seeds)
- Distribution sampling: `normalSample`, `exponentialSample`, `poissonSample`, `uniformSample`
- `ReservoirSampler` for streaming uniform sampling

#### Financial (`@acme/lib/math/financial`)

Business calculations with correct rounding semantics.

```typescript
import {
  markupToMargin,
  applyDiscount,
  roundCurrency,
  roundDownToIncrement
} from "@acme/lib/math/financial";

markupToMargin(0.5);              // 0.333... (50% markup = 33.3% margin)
applyDiscount(100, 0.2);          // 80 (20% off)
roundCurrency(12.345, "USD");     // 12.35 (banker's rounding)
roundCurrency(100, "JPY");        // 100 (no decimals for JPY)
roundDownToIncrement(9.99, 0.5);  // 9.50
```

**Exports:**
- Markup/Margin: `markupToMargin`, `marginToMarkup`, `calculateMargin`, `calculateMarkup`
- Discounts: `applyDiscount`, `applyStackedDiscounts`, `effectiveDiscount`
- Tax: `addTax`, `removeTax`, `extractTax`
- Compound: `compoundInterest`, `futureValue`, `presentValue`
- Installments: `pmt`, `amortizationSchedule`
- Rounding: `roundCurrency`, `roundToPrecision`, `roundDownToIncrement`, `roundUpToIncrement`

#### Graph (`@acme/lib/math/graph`)

Centralized graph and dependency-analysis adapters backed by Graphology.

```typescript
import { analyzeDependencyGraph } from "@acme/lib/math/graph";

const summary = analyzeDependencyGraph({
  nodes: [
    { id: "ideas" },
    { id: "fact-find" },
    { id: "plan" },
    { id: "build" },
  ],
  edges: [
    { from: "ideas", to: "fact-find" },
    { from: "fact-find", to: "plan" },
    { from: "plan", to: "build" },
  ],
});
```

**Exports:**
- `analyzeDependencyGraph`
- `DependencyGraphValidationError`
- dependency graph input and summary types

#### Optimization (`@acme/lib/math/optimization`)

Constrained optimization primitives for explicit portfolio and scheduling choices.

```typescript
import { solveBinaryPortfolio } from "@acme/lib/math/optimization";

const result = solveBinaryPortfolio({
  options: [
    { id: "a", utility: 8, coefficients: { capacity: 1, risk: 1 } },
    { id: "b", utility: 10, coefficients: { capacity: 1, risk: 2 } },
    { id: "c", utility: 7, coefficients: { capacity: 1, risk: 1 } },
  ],
  constraints: [
    { key: "capacity", max: 2 },
    { key: "risk", max: 3 },
  ],
});
```

**Exports:**
- `solveBinaryPortfolio`
- `PortfolioModelValidationError`
- binary portfolio input and result types

#### Survival (`@acme/lib/math/survival`)

Time-to-event analysis primitives for churn, slip, close, and escalation curves.

```typescript
import { estimateKaplanMeierCurve } from "@acme/lib/math/survival";

const curve = estimateKaplanMeierCurve([
  { time: 1, event: true },
  { time: 4, event: false },
  { time: 4, event: true },
  { time: 8, event: true },
]);
```

**Exports:**
- `estimateKaplanMeierCurve`
- `SurvivalObservationValidationError`
- time-to-event observation and curve summary types

## Design Principles

1. **Centralize math decisions** in `@acme/lib/math` instead of ad-hoc imports
2. **Prefer zero-dependency core primitives**, but allow vetted adapters for advanced methods
3. **Immutable by default** - all operations return new values
4. **Tree-shakeable** - unused functions are excluded from bundles
5. **Well-documented** - JSDoc with examples on all exports
6. **Thoroughly tested** - 95%+ coverage on math modules

## Migration from Ad-hoc Implementations

If you have ad-hoc statistical calculations, consider migrating to the library:

```typescript
// Before (duplicated across codebase)
function computeMedian(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

// After
import { median } from "@acme/lib/math/statistics";
// Note: returns NaN for empty arrays instead of null
const result = median(values);
const nullableResult = Number.isNaN(result) ? null : result;
```
