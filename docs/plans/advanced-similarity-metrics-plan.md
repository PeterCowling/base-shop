---
Type: Plan
Status: Proposed
Domain: Platform
Workstream: Core-Capability
Created: 2026-02-13
Last-updated: 2026-02-13
Last-reviewed: 2026-02-13
Replan-date: Not-set
Relates-to charter: docs/plans/advanced-math-algorithms-fact-find.md
Feature-Slug: advanced-similarity-metrics
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: implementation
Primary-Execution-Skill: /lp-build
Supporting-Skills: none
Overall-confidence: 84%
Confidence-Method: min(Implementation,Approach,Impact) — well-defined mathematical formulas with reference implementations; TypeScript-only; pure functions with comprehensive tests
Business-OS-Integration: off
Business-Unit: PLAT
---

# Advanced Similarity Metrics Library — Implementation Plan

## Summary

Implement a new `packages/lib/src/math/similarity/` module providing advanced dependency and similarity measures that detect relationships beyond Pearson/Spearman:

1. **Hoeffding's D** — detects arbitrary non-monotonic dependencies (e.g., ring-shaped, X-shaped patterns)
2. **Distance Correlation** — detects both linear and non-linear dependencies that Pearson misses
3. **Jensen-Shannon Divergence** — information-theoretic symmetric divergence measure
4. **Normalised Mutual Information** — measures dependency for discrete labels and binned continuous variables
5. **Kendall's Tau** — rank-based concordance measure with O(n log n) implementation

All implementations are TypeScript-native pure functions following existing `@acme/lib/math/` conventions.

**Business context:** These metrics enrich correlation analytics for booking/browsing behavior analysis, enable better re-ranking in search pipelines (two-stage retrieval), and provide richer A/B test analysis beyond linear measures.

**Reference implementations:**
- [fast_vector_similarity](https://github.com/Dicklesworthstone/fast_vector_similarity) (Rust, reference for algorithms)
- [hoeffdings_d_explainer](https://github.com/Dicklesworthstone/hoeffdings_d_explainer) (75-line NumPy reference)

## Goals

1. Port 5 advanced similarity metrics to TypeScript as pure functions
2. Follow existing math library conventions (pure functions, comprehensive tests, TypeScript-native)
3. Validate numerical accuracy against known reference values from academic literature
4. Enable richer analytics beyond Pearson/Spearman for correlation analysis

## Non-goals

1. Rust/Python dependencies or sidecars (TypeScript-only constraint)
2. GPU acceleration or SIMD optimizations (future work)
3. Streaming/online versions in first release (batch-only initially)
4. Integration into specific apps (library-only; consumption is separate work)

## Constraints & Assumptions

- **Constraints:**
  - TypeScript-only — no Python/Rust dependencies
  - Pure functions — no I/O, all side-effect-free
  - Must follow existing `packages/lib/src/math/` module conventions
  - Numerical validation against reference values required
- **Assumptions:**
  - Input arrays fit in memory (no streaming in first release)
  - Float64 precision sufficient (standard TypeScript number type)
  - O(n²) complexity acceptable for Hoeffding's D and Distance Correlation (batch analytics use case)

## Common Input Contract (All Metrics)

1. **Input type:** Public APIs accept `ReadonlyArray<number>` and never mutate inputs.
2. **Length checks:** Length mismatch or empty arrays are invalid for all metrics.
3. **Finite values:** `NaN`, `Infinity`, and `-Infinity` are invalid.
4. **Error policy:** Default behavior returns `NaN` for invalid inputs; `options?.strict === true` throws `RangeError` with actionable messages.
5. **Minimum sample size:** Minimum valid `n` is metric-specific (e.g., Hoeffding `n >= 5`; most pair metrics `n >= 2`).
6. **Constant arrays:** Behavior is explicitly documented per metric when denominators collapse (e.g., zero variance/zero entropy cases).
7. **Deterministic tests:** Validation uses fixed fixtures or seeded PRNGs only (no unseeded randomness in assertions).

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---|---|---|---|
| ASM-01 | IMPLEMENT | Create module structure + exports + type definitions | 92% | S | Pending | - | ASM-02, ASM-03, ASM-04, ASM-05, ASM-06 |
| ASM-02 | IMPLEMENT | Implement Hoeffding's D with reference validation tests | 82% | M | Pending | ASM-01 | ASM-07 |
| ASM-03 | IMPLEMENT | Implement Distance Correlation with reference validation tests | 84% | M | Pending | ASM-01 | ASM-07 |
| ASM-04 | IMPLEMENT | Implement Jensen-Shannon Divergence with reference validation tests | 88% | S | Pending | ASM-01 | ASM-07 |
| ASM-05 | IMPLEMENT | Implement Normalised Mutual Information with reference validation tests | 78% | M | Pending | ASM-01 | ASM-07 |
| ASM-06 | IMPLEMENT | Implement Kendall's Tau with O(n log n) merge-sort algorithm | 86% | M | Pending | ASM-01 | ASM-07 |
| ASM-07 | CHECKPOINT | Validate all metrics against published test cases + integration tests | 85% | S | Pending | ASM-02, ASM-03, ASM-04, ASM-05, ASM-06 | - |

## Active Tasks

- `ASM-01` — Unblocked, ready to build.

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | ASM-01 | - | Create module scaffold |
| 2 | ASM-02, ASM-03, ASM-04, ASM-05, ASM-06 | ASM-01 | All 5 metrics can be implemented in parallel |
| 3 | ASM-07 | ASM-02..ASM-06 | Final integration validation |

## Tasks

### ASM-01: Create module structure + exports + type definitions

- **Type:** IMPLEMENT
- **Deliverable:** code-change
- **Execution-Skill:** /lp-build
- **Confidence:** 92%
- **Affects:**
  - `packages/lib/src/math/similarity/` (new directory)
  - `packages/lib/src/math/similarity/index.ts` (new)
  - `packages/lib/src/math/index.ts` (add export)
- **Acceptance:**
  - Directory structure follows existing math module conventions
  - Index file exports all similarity functions with TypeScript types
  - README/JSDoc module documentation describes use cases
  - TypeScript compilation passes
- **Validation contract (VC-01):**
  - **VC-01-01:** Module structure — `similarity/` directory exists with `index.ts`, `__tests__/` subdirectory
  - **VC-01-02:** Export surface — `packages/lib/src/math/index.ts` includes `export * from "./similarity"`
  - **VC-01-03:** Type safety — `npx tsc --project packages/lib/tsconfig.json --noEmit` passes
  - **Acceptance coverage:** VC-01-01 covers criteria 1,2; VC-01-02 covers criteria 2; VC-01-03 covers criteria 4
  - **Validation type:** static check (file existence + typecheck)
  - **Run/verify:** `ls packages/lib/src/math/similarity/ && npx tsc --noEmit`

### ASM-02: Implement Hoeffding's D with reference validation tests

- **Type:** IMPLEMENT
- **Deliverable:** code-change
- **Execution-Skill:** /lp-build
- **Confidence:** 82%
- **Depends on:** ASM-01
- **Scope:**
  - Implement `hoeffding(xs: ReadonlyArray<number>, ys: ReadonlyArray<number>, options?: { strict?: boolean }): number`
  - Detects arbitrary dependencies (non-monotonic, ring-shaped, X-shaped)
  - Based on bivariate rank-count estimator using `Rᵢ`, `Sᵢ`, `Qᵢ` terms and `D1/D2/D3` aggregation
  - Uses the scaled convention `D* = 30 × D` (Harrell/DescTools-style reporting)
  - Reported range target is `[-0.5, 1]` under no-tie conditions for this scaling convention
  - Reference: Hoeffding (1948), "A Non-Parametric Test of Independence"
- **Implementation notes:**
  - Use rank/count estimator (not explicit quadruple enumeration)
  - Compute `Qᵢ` as count of points where both coordinates are strictly less than point `i`
  - `Qᵢ` implementation: start with O(n²) scan (acceptable), optional future Fenwick-tree optimization to O(n log n)
  - Minimum valid sample size is `n >= 5` for the normalization used (`(n-4)` denominator)
  - Tie policy: use average ranks plus strict `<` for `Qᵢ`; document that heavy ties/discrete marginals reduce interpretability
  - Tie semantics are fully deterministic: midranks, stable tie-breaking via original index, and strict comparison in both coordinates for `Qᵢ`
  - Reference: [hoeffdings_d_explainer](https://github.com/Dicklesworthstone/hoeffdings_d_explainer) (75-line NumPy version)
- **Affects:**
  - `packages/lib/src/math/similarity/hoeffding.ts` (new)
  - `packages/lib/src/math/similarity/__tests__/hoeffding.test.ts` (new)
  - `packages/lib/src/math/similarity/index.ts` (add export)
- **Acceptance:**
  - Pure function signature: `hoeffding(xs: ReadonlyArray<number>, ys: ReadonlyArray<number>, options?: { strict?: boolean }): number`
  - Returns `NaN` for invalid inputs in default mode; throws `RangeError` in strict mode
  - Invalid inputs include empty arrays, mismatched lengths, non-finite values, and `n < 5`
  - Detects perfect independence (returns ~0 for uncorrelated data)
  - Detects non-monotonic patterns (e.g., ring: x² + y² = r²)
  - Tie-heavy datasets have deterministic behavior with documented caveat on discontinuous marginals
  - Scaling convention is documented in JSDoc and fixtures (`D* = 30 × D`) to avoid cross-library constant-factor mismatches
  - Comprehensive tests validate against known reference values
- **Validation contract (VC-02):**
  - **VC-02-01:** Perfect independence (deterministic fixture) — `hoeffding(fixtureIndependentX, fixtureIndependentY)` returns value close to 0 (within ±0.15)
  - **VC-02-02:** Perfect positive linear — `hoeffding([1,2,3,4,5], [2,4,6,8,10])` returns positive value (> 0.5)
  - **VC-02-03:** Ring pattern — `hoeffding(cosine_points, sine_points)` for unit circle detects dependency (> 0.3)
  - **VC-02-04:** Invalid inputs — empty arrays, mismatched lengths, non-finite values, and `n < 5` return `NaN` (or throw in strict mode)
  - **VC-02-05:** Reference validation — test against published values from Hoeffding (1948) Table 1
  - **VC-02-06:** Tie-heavy fixture — deterministic output with exact fixture value assertion (tolerance `<= 1e-12`)
  - **VC-02-07:** Scaling validation — canonical fixture matches documented scaled convention (`D* = 30 × D`)
  - **Acceptance coverage:** VC-02-01..02-07 cover criteria 1-7
  - **Validation type:** unit tests with numerical assertions
  - **Run/verify:** `npx jest --testPathPattern=hoeffding.test`

### ASM-03: Implement Distance Correlation with reference validation tests

- **Type:** IMPLEMENT
- **Deliverable:** code-change
- **Execution-Skill:** /lp-build
- **Confidence:** 84%
- **Depends on:** ASM-01
- **Scope:**
  - Implement `distanceCorrelation(xs: ReadonlyArray<number>, ys: ReadonlyArray<number>, options?: { strict?: boolean }): number`
  - Detects both linear and non-linear dependencies
  - Based on distance matrices (Székely, Rizzo, Bakirov 2007)
  - Range: 0 to 1 (0 = independence, 1 = affine dependence under theorem conditions)
  - Reference: "Measuring and Testing Dependence by Correlation of Distances" (Annals of Statistics, 2007)
- **Implementation notes:**
  - Use a two-pass O(n²)-time/O(n)-memory algorithm (avoid storing full `n x n` matrices)
  - Pass 1: accumulate row means and grand means for X/Y distance matrices
  - Pass 2: recompute centered distances and accumulate covariance/variance sums
  - Document estimator choice explicitly: biased estimator (`1/n²` scaling) in v1
  - Unbiased estimator is deferred to a future revision to avoid low-value API complexity in v1
  - Distance correlation = dCov(X,Y) / sqrt(dVar(X) * dVar(Y))
  - O(n²) time complexity for distance computation
- **Affects:**
  - `packages/lib/src/math/similarity/distance-correlation.ts` (new)
  - `packages/lib/src/math/similarity/__tests__/distance-correlation.test.ts` (new)
  - `packages/lib/src/math/similarity/index.ts` (add export)
- **Acceptance:**
  - Pure function signature: `distanceCorrelation(xs: ReadonlyArray<number>, ys: ReadonlyArray<number>, options?: { strict?: boolean }): number`
  - Returns `NaN` for invalid inputs in default mode; throws `RangeError` in strict mode
  - Returns near 0 on independent fixtures; population distance correlation is 0 iff independence
  - Can return 1 for affine dependence under theorem conditions (linear + shift/scale/rotation)
  - For non-linear deterministic relationships (e.g., `y = x²`), returns high values but generally `< 1`
  - Constant-array behavior: if either input has zero distance variance (constant sample), return `NaN` (or throw in strict mode)
  - Detects non-linear relationships that Pearson misses (e.g., y = x²)
  - Comprehensive tests validate against reference implementation values
- **Validation contract (VC-03):**
  - **VC-03-01:** Independence (deterministic fixture) — `distanceCorrelation(fixtureIndependentX, fixtureIndependentY)` returns value close to 0 (< 0.2)
  - **VC-03-02:** Perfect linear — `distanceCorrelation([1,2,3,4,5], [2,4,6,8,10])` returns value close to 1 (> 0.95)
  - **VC-03-03:** Non-linear detection — with symmetric `x` around 0, `distanceCorrelation(x, x²)` returns high value (> 0.8) while `pearson(x, x²)` remains near 0
  - **VC-03-04:** Invalid inputs — empty arrays, mismatched lengths, non-finite values return `NaN` (or throw in strict mode)
  - **VC-03-05:** Reference validation — test against examples from Székely et al. (2007) paper
  - **VC-03-06:** Constant-array handling — constant `xs` or `ys` returns `NaN` (or throws in strict mode)
  - **Acceptance coverage:** VC-03-01..03-06 cover criteria 1-7
  - **Validation type:** unit tests with numerical assertions
  - **Run/verify:** `npx jest --testPathPattern=distance-correlation.test`

### ASM-04: Implement Jensen-Shannon Divergence with reference validation tests

- **Type:** IMPLEMENT
- **Deliverable:** code-change
- **Execution-Skill:** /lp-build
- **Confidence:** 88%
- **Depends on:** ASM-01
- **Scope:**
  - Implement `jensenShannonDivergence(p: ReadonlyArray<number>, q: ReadonlyArray<number>, options?: { strict?: boolean }): number`
  - Implement `jensenShannonDistance(p: ReadonlyArray<number>, q: ReadonlyArray<number>, options?: { strict?: boolean }): number` as `sqrt(JSD)`
  - Information-theoretic symmetric divergence measure
  - Based on Kullback-Leibler divergence
  - Range: 0 to 1 (after normalization with log2)
  - Reference: "Divergence measures based on the Shannon entropy" (Lin, 1991)
- **Implementation notes:**
  - JS(P||Q) = 0.5 * KL(P||M) + 0.5 * KL(Q||M), where M = 0.5*(P+Q)
  - KL divergence: sum(p[i] * log(p[i] / q[i]))
  - Inputs must be non-negative; auto-normalize count vectors by default
  - Compute with log base 2 (or natural log divided by `log(2)`) to guarantee [0,1] bound
  - If both inputs sum to 0, return `NaN` (or throw in strict mode)
  - Handle log(0) edge cases (define 0*log(0) = 0)
- **Affects:**
  - `packages/lib/src/math/similarity/jensen-shannon.ts` (new)
  - `packages/lib/src/math/similarity/__tests__/jensen-shannon.test.ts` (new)
  - `packages/lib/src/math/similarity/index.ts` (add export)
- **Acceptance:**
  - Pure function signatures include divergence and distance variants
  - Returns `NaN` for invalid inputs in default mode; throws `RangeError` in strict mode
  - Invalid inputs include empty arrays, mismatched lengths, negative values, and both-zero totals
  - Returns 0 for identical distributions
  - Returns 1 for completely disjoint distributions (maximum divergence)
  - Symmetric: JSD(P,Q) = JSD(Q,P)
  - Handles edge cases: zeros in distributions, near-zero probabilities
- **Validation contract (VC-04):**
  - **VC-04-01:** Identical distributions — `jensenShannonDivergence([0.5,0.5], [0.5,0.5])` returns 0
  - **VC-04-02:** Disjoint distributions — `jensenShannonDivergence([1,0,0], [0,0,1])` returns value close to 1
  - **VC-04-03:** Symmetry — `JSD(P,Q) === JSD(Q,P)` for all test cases
  - **VC-04-04:** Edge cases — handles [1,0,0] vs [0.99,0.005,0.005] without NaN/Infinity; both-zero totals return `NaN` (or throw in strict mode)
  - **VC-04-05:** Distance metric — `jensenShannonDistance(P,Q) === Math.sqrt(jensenShannonDivergence(P,Q))`
  - **VC-04-06:** Reference validation — test against known JSD values from information theory literature
  - **Acceptance coverage:** VC-04-01..04-06 cover criteria 1-7
  - **Validation type:** unit tests with numerical assertions
  - **Run/verify:** `npx jest --testPathPattern=jensen-shannon.test`

### ASM-05: Implement Normalised Mutual Information with reference validation tests

- **Type:** IMPLEMENT
- **Deliverable:** code-change
- **Execution-Skill:** /lp-build
- **Confidence:** 78%
- **Replan note:** Lower confidence due to binning strategy complexity for continuous variables
- **Depends on:** ASM-01
- **Scope:**
  - Implement `normalisedMutualInformationDiscrete(labelsX: ReadonlyArray<number>, labelsY: ReadonlyArray<number>, options?: { strict?: boolean }): number`
  - Implement `normalisedMutualInformationBinned(xs: ReadonlyArray<number>, ys: ReadonlyArray<number>, options?: { bins?: number; binning?: "equalWidth" | "quantile"; strict?: boolean }): number`
  - Discrete API is for category labels; binned API is for continuous measurements
  - Based on entropy: NMI(X,Y) = 2*I(X;Y) / (H(X) + H(Y))
  - Range: 0 to 1 (0 = independence, 1 = perfect dependency)
  - Reference: "Normalized Mutual Information Feature Selection" (Estévez et al., 2009)
- **Implementation notes:**
  - `normalisedMutualInformationDiscrete` treats each unique numeric value as a category label
  - `normalisedMutualInformationBinned` bins continuous variables (default 10 bins, configurable)
  - Mutual Information: I(X;Y) = sum(p(x,y) * log(p(x,y) / (p(x)*p(y))))
  - Entropy: H(X) = -sum(p(x) * log(p(x)))
  - Definition used in this module is fixed to `2I/(H(X)+H(Y))`
  - Binning strategy supports both `equalWidth` and `quantile` (equal-frequency) to handle outliers/heavy tails
  - Constant-array policy: if both entropies are zero, return `NaN` (or throw in strict mode); if one entropy is zero and the other non-zero, return 0
- **Affects:**
  - `packages/lib/src/math/similarity/mutual-information.ts` (new)
  - `packages/lib/src/math/similarity/__tests__/mutual-information.test.ts` (new)
  - `packages/lib/src/math/similarity/index.ts` (add export)
- **Acceptance:**
  - Pure function signatures separate discrete-label and binned-continuous modes
  - Returns `NaN` for invalid inputs in default mode; throws `RangeError` in strict mode
  - Returns near 0 on independent fixtures
  - Returns 1 for information-preserving dependence (bijective relationship after discretization/binning)
  - Deterministic many-to-one mappings can be strongly dependent with NMI `< 1`
  - Binned mode supports configurable binning (`equalWidth` and `quantile`)
  - Handles edge cases: constant arrays, identical arrays, heavy-tail distributions
- **Validation contract (VC-05):**
  - **VC-05-01:** Independence (deterministic fixture) — `NMI(fixtureIndependentX, fixtureIndependentY)` returns value close to 0 (< 0.2)
  - **VC-05-02:** Information-preserving dependence — discrete labels with bijective remap return value close to 1 (> 0.95)
  - **VC-05-03:** Deterministic many-to-one mapping — NMI is high but `< 1` on canonical fixture
  - **VC-05-04:** Binning sensitivity — compare `equalWidth` vs `quantile` on heavy-tail fixture; quantile shows improved stability
  - **VC-05-05:** Constant entropy handling — both-constant returns `NaN` (or throws in strict mode); one-constant-one-variable returns 0
  - **VC-05-06:** Reference validation — test against published NMI values from clustering/feature-selection papers
  - **VC-05-07:** Mode semantics — discrete mode and binned mode produce expected, mode-specific fixture values
  - **Acceptance coverage:** VC-05-01..05-07 cover criteria 1-7
  - **Validation type:** unit tests with numerical assertions
  - **Run/verify:** `npx jest --testPathPattern=mutual-information.test`

### ASM-06: Implement Kendall's Tau with O(n log n) merge-sort algorithm

- **Type:** IMPLEMENT
- **Deliverable:** code-change
- **Execution-Skill:** /lp-build
- **Confidence:** 86%
- **Depends on:** ASM-01
- **Scope:**
  - Implement `kendallTau(xs: ReadonlyArray<number>, ys: ReadonlyArray<number>, options?: { strict?: boolean }): number`
  - Rank-based concordance measure (complements existing Spearman)
  - O(n log n) via merge-sort inversion counting (not naive O(n²))
  - Range: -1 to 1 (-1 = perfect discordance, 0 = no association, 1 = perfect concordance)
  - Reference: "A New Measure of Rank Correlation" (Kendall, 1938)
- **Implementation notes:**
  - Kendall's τ = (C - D) / (C + D), where C = concordant pairs, D = discordant pairs
  - Naive algorithm: O(n²) all-pairs comparison
  - Efficient algorithm: O(n log n) using merge-sort inversion counting
  - Pair (xᵢ,yᵢ), (xⱼ,yⱼ) is concordant if (xᵢ-xⱼ)(yᵢ-yⱼ) > 0
  - Merge-sort approach: sort by x, count y-inversions during merge
  - Handles ties with tau-b formula: τb = (C-D) / sqrt((n₀-nₓ)(n₀-nᵧ))
- **Affects:**
  - `packages/lib/src/math/similarity/kendall.ts` (new)
  - `packages/lib/src/math/similarity/__tests__/kendall.test.ts` (new)
  - `packages/lib/src/math/similarity/index.ts` (add export)
- **Acceptance:**
  - Pure function signature: `kendallTau(xs: ReadonlyArray<number>, ys: ReadonlyArray<number>, options?: { strict?: boolean }): number`
  - Returns `NaN` for invalid inputs in default mode; throws `RangeError` in strict mode
  - Returns 1 for perfect concordance (monotonic increasing)
  - Returns -1 for perfect discordance (monotonic decreasing)
  - Returns ~0 for uncorrelated data
  - O(n log n) complexity validated via benchmark harness (not hard fail unit threshold)
  - Handles ties correctly (tau-b variant)
- **Validation contract (VC-06):**
  - **VC-06-01:** Perfect concordance — `kendallTau([1,2,3,4,5], [2,4,6,8,10])` returns 1
  - **VC-06-02:** Perfect discordance — `kendallTau([1,2,3,4,5], [5,4,3,2,1])` returns -1
  - **VC-06-03:** Independence (deterministic fixture) — `kendallTau(fixtureIndependentX, fixtureIndependentY)` returns value close to 0 (within ±0.2)
  - **VC-06-04:** Tie handling — arrays with duplicate values produce valid tau-b in [-1, 1]
  - **VC-06-05:** Performance benchmark — n=10,000 runtime is reported and tracked (non-flaky benchmark, CI informational)
  - **VC-06-06:** Reference validation — test against published tau values from Kendall (1938)
  - **Acceptance coverage:** VC-06-01..06-04 cover criteria 1-7; VC-06-05 covers performance; VC-06-06 covers validation
  - **Validation type:** unit tests with numerical + performance assertions
  - **Run/verify:** `npx jest --testPathPattern=kendall.test`

### ASM-07: Validate all metrics against published test cases + integration tests

- **Type:** CHECKPOINT
- **Deliverable:** validation report + integration tests
- **Execution-Skill:** /lp-build
- **Confidence:** 85%
- **Depends on:** ASM-02, ASM-03, ASM-04, ASM-05, ASM-06
- **Scope:**
  - Cross-metric validation suite (compare against Pearson/Spearman on same data)
  - Integration tests consuming all 5 metrics together
  - Documentation examples (JSDoc) verified to run
  - Performance benchmarks for all metrics
  - Edge case matrix (empty, single, ties, constant, large arrays)
- **Affects:**
  - `packages/lib/src/math/similarity/__tests__/integration.test.ts` (new)
  - `packages/lib/src/math/similarity/README.md` (new, usage guide)
  - `packages/lib/src/math/similarity/index.ts` (final JSDoc review)
- **Acceptance:**
  - Integration test suite covers all 5 metrics together
  - Cross-metric comparison test (same dataset, different results expected)
  - Performance baseline established (n=100, n=1000, n=10000) using benchmark harness
  - Documentation examples all execute successfully
  - No TypeScript errors, no lint errors
  - Test coverage ≥ 90% for similarity module
- **Validation contract (VC-07):**
  - **VC-07-01:** Cross-metric comparison — linear data: Pearson ≈ Distance Corr ≈ 1, Hoeffding > 0.5, Kendall ≈ 1
  - **VC-07-02:** Non-linear detection (symmetric x around 0) — y=x²: Distance Corr > 0.8, Pearson near 0, Hoeffding > 0.3
  - **VC-07-03:** Performance baseline — benchmark report records n=1000 runtimes for all metrics (no strict CI wall-clock assertion)
  - **VC-07-04:** Documentation — all JSDoc examples run without errors
  - **VC-07-05:** Test coverage — `npx jest --coverage --testPathPattern=similarity` shows ≥ 90% line coverage
  - **VC-07-06:** Dataset cookbook — README includes deterministic fixtures: linear up/down, symmetric quadratic, circle/ring, and tie-heavy discrete example
  - **Acceptance coverage:** VC-07-01..07-06 cover criteria 1-6
  - **Validation type:** integration tests + coverage report
  - **Run/verify:** `npx jest --coverage --testPathPattern=similarity`

## Validation Strategy

1. **Numerical accuracy** — validate against frozen fixtures generated once via external R/Python scripts; check fixture files into repo
2. **Edge case robustness** — empty/mismatched arrays, non-finite values, constant arrays, and ties handled per common contract
3. **Performance** — O(n²) metrics benchmarked with reporting harness; Kendall O(n log n) behavior benchmarked separately
4. **Integration** — cross-metric deterministic dataset cookbook ensures coherent behavior and non-flaky comparisons
5. **Fixture-first assertions** — prefer fixture-based numeric assertions over heuristic threshold-only checks
6. **Documentation** — JSDoc examples executable and correct

Runtime remains TypeScript-only; external R/Python tools are one-time dev-only fixture generators.

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Hoeffding's D tie/discrete-data defect can mislead interpretation | High | Lock deterministic tie strategy; document caveat; recommend Distance Corr/NMI for heavy-tie datasets |
| Distance correlation matrix computation expensive or memory-heavy | Medium | Use two-pass O(n²)-time/O(n)-memory algorithm; avoid full matrix allocation |
| Mutual information binning strategy affects accuracy | Medium | Support `equalWidth` and `quantile`; document when to use each |
| Kendall's tau merge-sort implementation complexity | Low | Follow established algorithm (Knight, 1966); validate against naive O(n²) version |
| Reference validation data hard to reproduce from papers | Medium | Generate and version frozen fixtures from one-time R/Python scripts; validate TS outputs against fixtures |

## What Would Make Confidence ≥90%

1. Complete ASM-02 (Hoeffding's D) with validated reference implementation → proves TypeScript port feasibility
2. Performance benchmarks on n=10,000 show acceptable runtime (< 2s for Distance Correlation)
3. Cross-metric integration tests pass showing coherent behavior across all 5 metrics
4. Reference validation for at least 3/5 metrics against published values
5. Test coverage ≥ 95% with comprehensive edge case matrix

## Decision Log

### DL-01: Binning strategy for Mutual Information (ASM-05)

**Decided:** 2026-02-13
**Chosen option:** Equal-width as default, plus quantile binning option for robustness.

**Rationale:**
- Equal-width is simple and predictable for near-uniform distributions
- Quantile binning is more stable for heavy tails/outliers
- Default 10 bins remains configurable for both strategies
- This resolves the lowest-confidence area in ASM-05 with minimal API complexity

---

### DL-02: Kendall's tau tie-handling variant (ASM-06)

**Decided:** 2026-02-13
**Chosen option:** Implement tau-b (tie correction for both X and Y).

**Rationale:**
- Tau-b is the most widely used variant in statistical software (R, Python scipy)
- Handles ties in both variables symmetrically
- Formula: τb = (C-D) / sqrt((n₀-nₓ)(n₀-nᵧ)), where n₀ = n(n-1)/2, nₓ = ties in X, nᵧ = ties in Y
- More robust than tau-a (no tie correction) or tau-c (optimized for contingency tables)

---

### DL-03: Auto-normalization for Jensen-Shannon Divergence (ASM-04)

**Decided:** 2026-02-13
**Chosen option:** Auto-normalize non-negative inputs if they don't sum to 1, with optional strict mode.

**Rationale:**
- Convenience: users can pass raw counts without manual normalization
- Safety: strict mode available for cases requiring exact probability distributions
- Follows precedent in existing `packages/lib` modules (e.g., color gamut mapping auto-clips)
- Default signatures:
  - `jensenShannonDivergence(p: ReadonlyArray<number>, q: ReadonlyArray<number>, options?: { strict?: boolean })`
  - `jensenShannonDistance(p: ReadonlyArray<number>, q: ReadonlyArray<number>, options?: { strict?: boolean })`
- Strict mode throws if inputs are invalid or not pre-normalized (within 1e-10 tolerance)
- Both-zero totals are invalid (`NaN` default, throw in strict)

---

### DL-04: Module-wide invalid-input behavior

**Decided:** 2026-02-13
**Chosen option:** Uniform policy across all metrics: default `NaN`, optional strict throwing.

**Rationale:**
- Keeps numeric workflows tolerant by default (`NaN` propagation)
- Supports fail-fast callers with `strict` mode
- Eliminates cross-metric inconsistency in tests and docs

---

### DL-05: Distance Correlation estimator + memory model

**Decided:** 2026-02-13
**Chosen option:** Biased estimator (`1/n²`) only in v1, implemented with two-pass O(n²)-time/O(n)-memory accumulation.

**Rationale:**
- Avoids infeasible `n x n` allocation for large arrays (e.g., n=10,000)
- Matches common reference implementations by default
- Defers lower-priority unbiased mode until there is concrete consumer demand and fixtures for both variants

---

### DL-06: Hoeffding scaling + tie semantics

**Decided:** 2026-02-13
**Chosen option:** Report scaled Hoeffding statistic `D* = 30 × D` with explicit deterministic tie semantics.

**Rationale:**
- Removes ambiguity across references that differ by a constant factor
- Keeps documented range expectations aligned with selected convention
- Guarantees fixture reproducibility for tie-heavy datasets

## External References

- [fast_vector_similarity](https://github.com/Dicklesworthstone/fast_vector_similarity) — Rust library with reference implementations
- [hoeffdings_d_explainer](https://github.com/Dicklesworthstone/hoeffdings_d_explainer) — 75-line NumPy reference for Hoeffding's D
- Hoeffding, W. (1948). "A Non-Parametric Test of Independence". *Annals of Mathematical Statistics*, 19(4), 546-557.
- Székely, G. J., Rizzo, M. L., & Bakirov, N. K. (2007). "Measuring and Testing Dependence by Correlation of Distances". *Annals of Statistics*, 35(6), 2769-2794.
- Lin, J. (1991). "Divergence measures based on the Shannon entropy". *IEEE Transactions on Information Theory*, 37(1), 145-151.
- Kendall, M. G. (1938). "A New Measure of Rank Correlation". *Biometrika*, 30(1/2), 81-93.
- Knight, W. R. (1966). "A Computer Method for Calculating Kendall's Tau with Ungrouped Data". *Journal of the American Statistical Association*, 61(314), 436-439.

## Next Steps

- [ ] Review plan with platform team; confirm scope and priority
- [ ] Execute ASM-01 (module scaffold) to unblock parallel work on ASM-02..ASM-06
- [ ] Generate frozen fixture vectors (R/Python one-time scripts) and commit JSON fixtures for deterministic validation
- [ ] Add dataset cookbook to `packages/lib/src/math/similarity/README.md` (linear, quadratic symmetric, circle/ring, tie-heavy discrete)
- [ ] Schedule ASM-07 checkpoint after Wave 2 completion
- [ ] Plan downstream integration work (search re-ranking, analytics dashboards) as separate effort
