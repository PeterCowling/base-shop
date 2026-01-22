# Statistics Patterns Audit (AUDIT-02)

**Audit Date:** 2026-01-21
**Scope:** `packages/*`, `apps/*`
**Purpose:** Identify ad-hoc statistical calculations for potential migration to a centralized statistics library

## Executive Summary

This audit identified **47 distinct locations** with statistical calculations across the codebase. The findings fall into several categories:

1. **Existing Library Usage (Good)**: Several files already use `@acme/lib` statistical primitives (EWMA, t-Digest)
2. **Ad-hoc Averages**: ~15 locations with manual `reduce/length` average calculations
3. **Ad-hoc Variance/StdDev**: 2 locations with manual variance calculations
4. **Ad-hoc Trend Detection**: 1 location with manual linear regression
5. **Display-only Statistics**: Many locations that display pre-computed statistics (not candidates)

### Recommendation Summary

| Category | Count | Recommendation |
|----------|-------|----------------|
| Should migrate to lib | 8 | High priority - clear candidates |
| Consider migrating | 6 | Medium priority - evaluate case-by-case |
| Keep as-is | 33 | Low priority - display/simple/already using lib |

---

## 1. Existing Library Usage (Already Using @acme/lib)

These files correctly use the existing statistical primitives from `@acme/lib`:

### 1.1 EWMA/Forecasting Usage

| File | Line | Usage |
|------|------|-------|
| `apps/brikette/src/lib/metrics/smoothed-metrics.ts` | 26-29 | Imports `EWMA`, `HoltSmoothing`, `SimpleExponentialSmoothing` from `@acme/lib` |
| `apps/brikette/src/lib/metrics/latency-tracker.ts` | 25 | Imports `TDigest` from `@acme/lib` |

**Status:** No migration needed - these are exemplary usage patterns.

### 1.2 t-Digest/Percentile Usage

| File | Line | Usage |
|------|------|-------|
| `apps/brikette/src/lib/metrics/latency-tracker.ts` | 25 | Uses `TDigest` for p50, p95, p99, p999 percentile tracking |

**Status:** No migration needed.

---

## 2. Ad-hoc Average Calculations (High Priority)

These locations calculate averages manually using `reduce/length` patterns:

### 2.1 Review Rating Averages

| File | Line | Pattern | Context |
|------|------|---------|---------|
| `packages/ui/src/components/cms/blocks/ReviewsSection.tsx` | 72 | `ratings.reduce((a, b) => a + b, 0) / ratings.length` | Calculates average product rating |
| `packages/cms-ui/src/blocks/ReviewsSection.tsx` | 72 | `ratings.reduce((a, b) => a + b, 0) / ratings.length` | Duplicate of above (shared block) |

**Recommendation:** **MIGRATE** - Create a `mean()` utility function in `@acme/lib`

### 2.2 Analytics Averages

| File | Line | Pattern | Context |
|------|------|---------|---------|
| `packages/mcp-server/src/tools/analytics.ts` | 167 | `totalRevenue / totalOrders` | Average order value calculation |
| `packages/mcp-server/src/tools/analytics.ts` | 189-190 | `(totalOrders / totalPageViews) * 100` | Conversion rate calculation |
| `apps/prime/src/services/firebaseMetrics.ts` | 148-149 | `durations.reduce((a, b) => a + b, 0) / durations.length` | Average query duration |
| `apps/prime/src/services/firebaseMetrics.ts` | 162 | `totalDuration / queriesWithDuration` | Average query time |

**Recommendation:** **MIGRATE** - These are prime candidates for `mean()` utility

### 2.3 SEO Score Averages

| File | Line | Pattern | Context |
|------|------|---------|---------|
| `apps/cms/src/app/cms/shop/[shop]/settings/seo/SeoProgressPanel.tsx` | 53-55 | `scores.reduce((total, val) => total + val, 0) / audits.length` | Average SEO score |

**Recommendation:** **MIGRATE** - Good candidate for `mean()` utility

### 2.4 Test Quality Averages

| File | Line | Pattern | Context |
|------|------|---------|---------|
| `scripts/src/analyze-test-quality.ts` | 440-443 | `nums.reduce((a, b) => a + b, 0) / nums.length` | Average test quality scores |
| `scripts/src/analyze-test-quality.ts` | 399-408 | Multiple `.reduce((sum, a) => sum + a.xxx, 0)` patterns | Sum calculations |

**Recommendation:** **CONSIDER** - Script code, lower priority but could benefit

---

## 3. Ad-hoc Variance/Standard Deviation (High Priority)

### 3.1 Anomaly Detection Variance

| File | Line | Pattern | Context |
|------|------|---------|---------|
| `apps/brikette/src/lib/metrics/smoothed-metrics.ts` | 147-151 | Manual mean + variance + sqrt(variance) | Anomaly detection threshold calculation |

```typescript
const mean = this.history.reduce((a, b) => a + b, 0) / this.history.length;
const variance =
  this.history.reduce((sum, v) => sum + (v - mean) ** 2, 0) /
  this.history.length;
const std = Math.sqrt(variance);
```

**Recommendation:** **MIGRATE** - Create `variance()`, `stdDev()`, and `zScore()` utilities

---

## 4. Ad-hoc Trend/Regression (Medium Priority)

### 4.1 Linear Regression for Trend Detection

| File | Line | Pattern | Context |
|------|------|---------|---------|
| `apps/brikette/src/lib/metrics/smoothed-metrics.ts` | 351-386 | Manual linear regression slope calculation | Trend detection function |

```typescript
// Manual linear regression calculation
let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
for (let i = 0; i < n; i++) {
  sumX += i;
  sumY += data[i];
  sumXY += i * data[i];
  sumX2 += i * i;
}
const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
```

**Recommendation:** **MIGRATE** - Create `linearRegression()` utility with slope, intercept, r-squared

---

## 5. Domain-Specific Variance Calculations (Keep As-Is)

These calculate "variance" in the accounting/business sense (difference from expected), not statistical variance:

### 5.1 Financial Variance (Accounting)

| File | Line | Pattern | Context |
|------|------|---------|---------|
| `apps/reception/src/hooks/data/endOfDay/variance.ts` | 11-32 | `closingCash - expectedCash` | Cash variance (expected vs actual) |
| `apps/reception/src/hooks/data/endOfDay/variance.ts` | 44-63 | `closingKeycards - expectedKeycards` | Keycard variance |
| `apps/reception/src/hooks/data/endOfDay/variance.ts` | 77-107 | Safe variance calculations | Safe balance variance |
| `apps/reception/src/components/reports/VarianceHeatMap.tsx` | All | Display variance data | Displays pre-computed variances |
| `apps/reception/src/components/reports/VarianceSummary.tsx` | All | Display variance data | Displays pre-computed variances |

**Recommendation:** **KEEP AS-IS** - These are business/accounting variances, not statistical variances

---

## 6. Sum Calculations (Low Priority)

Many locations use `.reduce()` for simple sums. These are straightforward and don't need migration:

### 6.1 Cart/Order Totals

| File | Line | Pattern |
|------|------|---------|
| `packages/ui/src/components/cms/blocks/HeaderCart.tsx` | 33, 38 | Cart quantity and price sums |
| `packages/ui/src/components/cms/blocks/ProductBundle.tsx` | 25 | Bundle price sum |
| `packages/platform-core/src/checkout/totals.ts` | 21-22, 52-53 | Checkout subtotals |
| `packages/platform-core/src/checkout/reprice.ts` | 149-150 | Order repricing |
| `apps/xa/src/app/checkout/page.tsx` | 25 | Checkout total |
| `apps/xa/src/app/cart/page.tsx` | 27 | Cart total |
| `apps/reception/src/hooks/client/till/useShiftCalculations.ts` | Multiple | Till transaction sums |

**Recommendation:** **KEEP AS-IS** - Simple sums are idiomatic JavaScript

---

## 7. Min/Max Operations (Low Priority)

The codebase uses `Math.min()` and `Math.max()` extensively (~100+ locations), primarily for:

- UI clamping (pagination, canvas bounds, zoom levels)
- Input validation (ensuring values stay in range)
- Color calculations

### 7.1 Noteworthy Statistical Min/Max

| File | Line | Pattern | Context |
|------|------|---------|---------|
| `packages/ui/src/components/cms/blocks/ProductFilter.tsx` | 58-59 | `Math.min(...prices)`, `Math.max(...prices)` | Price range for filters |
| `packages/lib/src/math/probabilistic/t-digest.ts` | 97-98, 267-268 | Track min/max values | Statistical data structure |

**Recommendation:** **KEEP AS-IS** - Standard JavaScript patterns, well-used

---

## 8. Median/Percentile Display (Keep As-Is)

These locations display pre-computed medians/percentiles but don't calculate them:

| File | Line | Context |
|------|------|---------|
| `apps/product-pipeline/src/app/candidates/[id]/StageMSummary.tsx` | 156-169 | Displays `priceMedian`, `reviewMedian` |
| `apps/product-pipeline/src/app/candidates/[id]/stageMHelpers.ts` | 43-44 | Extracts pre-computed medians from API data |

**Recommendation:** **KEEP AS-IS** - These display API data, not calculate statistics

---

## 9. Duplicate Moving Average Implementation

| File | Line | Pattern |
|------|------|---------|
| `apps/brikette/src/lib/metrics/smoothed-metrics.ts` | 321-342 | `movingAverage()` function |
| `packages/lib/src/math/forecasting/ewma.ts` | 382-409 | `movingAverage()` function (original) |

**Recommendation:** **REFACTOR** - Remove duplicate in `brikette`, import from `@acme/lib`

---

## Recommended New Functions for @acme/lib

Based on this audit, the following functions should be added to `@acme/lib`:

### Basic Descriptive Statistics

```typescript
// packages/lib/src/math/statistics/descriptive.ts

/** Calculate arithmetic mean */
export function mean(values: number[]): number;

/** Calculate variance (population or sample) */
export function variance(values: number[], sample?: boolean): number;

/** Calculate standard deviation */
export function stdDev(values: number[], sample?: boolean): number;

/** Calculate median (50th percentile) */
export function median(values: number[]): number;

/** Calculate any percentile */
export function percentile(values: number[], p: number): number;

/** Calculate z-score for anomaly detection */
export function zScore(value: number, mean: number, stdDev: number): number;

/** Check if value is an outlier (beyond n standard deviations) */
export function isOutlier(value: number, values: number[], sigmas?: number): boolean;
```

### Trend Analysis

```typescript
// packages/lib/src/math/statistics/regression.ts

interface LinearRegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
  predict: (x: number) => number;
}

/** Simple linear regression */
export function linearRegression(x: number[], y: number[]): LinearRegressionResult;

/** Detect trend direction from time series */
export function detectTrend(values: number[], threshold?: number): 'up' | 'down' | 'flat';
```

---

## Migration Priority Matrix

| Priority | File | Function/Pattern | Effort |
|----------|------|------------------|--------|
| P0 | `brikette/smoothed-metrics.ts` | Variance/StdDev calculation | Low |
| P0 | `brikette/smoothed-metrics.ts` | Linear regression | Medium |
| P0 | `brikette/smoothed-metrics.ts` | Remove duplicate `movingAverage` | Low |
| P1 | `ui/ReviewsSection.tsx` | Mean rating calculation | Low |
| P1 | `cms-ui/ReviewsSection.tsx` | Mean rating calculation | Low |
| P1 | `mcp-server/analytics.ts` | Average order value | Low |
| P1 | `cms/SeoProgressPanel.tsx` | Average SEO score | Low |
| P2 | `prime/firebaseMetrics.ts` | Average query duration | Low |
| P2 | `scripts/analyze-test-quality.ts` | Average scores | Low |

---

## Appendix: Files Examined

### Packages
- `packages/lib/src/math/forecasting/ewma.ts`
- `packages/lib/src/math/probabilistic/t-digest.ts`
- `packages/lib/src/index.ts`
- `packages/ui/src/components/cms/blocks/ReviewsSection.tsx`
- `packages/ui/src/components/molecules/RatingSummary.tsx`
- `packages/cms-ui/src/blocks/ReviewsSection.tsx`
- `packages/mcp-server/src/tools/analytics.ts`
- `packages/platform-core/src/checkout/totals.ts`
- `packages/platform-core/src/checkout/reprice.ts`

### Apps
- `apps/brikette/src/lib/metrics/smoothed-metrics.ts`
- `apps/brikette/src/lib/metrics/latency-tracker.ts`
- `apps/cms/src/app/cms/shop/[shop]/settings/seo/SeoProgressPanel.tsx`
- `apps/prime/src/services/firebaseMetrics.ts`
- `apps/reception/src/hooks/data/endOfDay/variance.ts`
- `apps/reception/src/components/reports/VarianceHeatMap.tsx`
- `apps/reception/src/components/reports/VarianceSummary.tsx`
- `apps/product-pipeline/src/app/candidates/[id]/StageMSummary.tsx`
- `apps/product-pipeline/src/app/candidates/[id]/stageMHelpers.ts`
- `apps/xa/src/app/checkout/page.tsx`
- `apps/xa/src/app/cart/page.tsx`

### Scripts
- `scripts/src/analyze-test-quality.ts`
