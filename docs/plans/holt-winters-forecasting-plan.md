---
Type: Plan
Status: Archived
Domain: Platform
Workstream: Math-Library
Created: 2026-02-13
Last-updated: 2026-02-13
Last-reviewed: 2026-02-13
Relates-to charter: none
Feature-Slug: holt-winters-forecasting
Deliverable-Type: single-deliverable
Execution-Track: implementation
Primary-Execution-Skill: /lp-build
Supporting-Skills: none
Overall-confidence: 86%
Confidence-Method: min(Implementation,Approach,Impact) - formulas and APIs are well-defined, but interval calibration and initialization quality still require careful validation
Business-OS-Integration: off
Business-Unit: PLAT
---

# Holt-Winters Seasonal Forecasting - Implementation Plan

## Summary

This plan extends `packages/lib/src/math/forecasting/` with seasonal forecasting capabilities on top of the existing EWMA/SES/Holt foundation. It adds deterministic Holt-Winters additive and multiplicative models, seasonal decomposition, prediction intervals, model selection helpers, and parameter optimization.

Primary reference: `docs/plans/advanced-math-algorithms-fact-find.md` (Opportunity D).

## Goals

1. Add production-grade seasonal forecasting for rental/tourism businesses with strong seasonality.
2. Enable data-driven model selection (AIC/BIC) to choose between SES, Holt, and Holt-Winters.
3. Provide prediction intervals (confidence bands) with a method that can evolve without API breaks.
4. Preserve existing library conventions: TypeScript-native, zero external deps, deterministic tests.

## Non-goals

1. ARIMA/state-space/ETS likelihood optimization (future extension).
2. Automatic seasonality detection (user provides seasonal period).
3. UI/dashboard integration.
4. Real-time streaming updates.

## Constraints and Assumptions

- Constraints:
  - TypeScript-only implementation (no Python/Rust/sidecars).
  - Code lives under `packages/lib/src/math/forecasting/` and reuses existing statistics helpers.
  - No I/O in library code.
- Assumptions:
  - Seasonal period is known and integer (`m >= 2`).
  - Input series is regularly spaced.
  - Recommended data length is at least `2*m`.

## API and Statistical Contracts (Must Stay Consistent)

1. **Fitted value convention:** `fittedValues[t]` is one-step-ahead prediction for `Y_t` from state at `t-1` (not post-update smoothed value).
2. **Core residual definition (scoring):** `residual[t] = data[t] - fittedValues[t]`, only where `fittedValues[t]` is finite.
3. **HW fitted edge policy:** for Holt-Winters models, only `fittedValues[0]` is `NaN`; `fittedValues[t]` is finite for `t >= 1`.
4. **Decomposition edge policy:** decomposition outputs remain `number[]`; undefined trend/remainder entries use `NaN`.
5. **Model burn-in index:** each model exposes `minResidualIndex` for scoring/selection windows.
6. **Model-comparison window:** cross-model AIC/BIC comparisons use a shared window start `start = max(minResidualIndex among compared models)`.
7. **Effective sample size:** residual metrics use `nEffective = count(isFinite(residual[t]) for t in comparison window)`.
8. **Multiplicative interval errors:** multiplicative bootstrap uses ratio or log error terms (not additive differences) to preserve positivity.
9. **Multiplicative domain:** multiplicative decomposition and multiplicative HW require all data points `> 0`; otherwise throw informative error.
10. **Step semantics and season wrap:** `forecast(steps)` and `forecastWithInterval(steps, ...)` return empty arrays when `steps <= 0`; seasonal lookups use modulo wrap for all horizons.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---|---|---|---|
| HW-00 | IMPLEMENT | Contracts + shared forecasting utils scaffold | 91% | S | Complete (2026-02-13) | - | HW-01, HW-02, HW-03, HW-04, HW-05, HW-06 |
| HW-01 | IMPLEMENT | Seasonal decomposition with explicit edge semantics | 86% | M | Complete (2026-02-13) | HW-00 | HW-02, HW-03 |
| HW-02 | IMPLEMENT | Holt-Winters additive model with deterministic initialization | 84% | M | Complete (2026-02-13) | HW-00, HW-01 | HW-04, HW-05, HW-06 |
| HW-03 | IMPLEMENT | Holt-Winters multiplicative model with strict positivity contract | 83% | M | Complete (2026-02-13) | HW-00, HW-01 | HW-04, HW-05, HW-06 |
| HW-04 | IMPLEMENT | Model-selection helpers (log-likelihood, AIC/BIC, nEffective) | 85% | S | Complete (2026-02-13) | HW-02, HW-03 | HW-06 |
| HW-05 | IMPLEMENT | Prediction intervals (method-pluggable: naive + bootstrap) | 80% | M | Complete (2026-02-13) | HW-02, HW-03 | HW-06 |
| HW-06 | IMPLEMENT | Parameter optimization (deterministic two-stage grid search) | 82% | L | Complete (2026-02-13) | HW-04, HW-05 | - |

## Tasks

### HW-00: Contracts + shared forecasting utils scaffold

- **Type:** IMPLEMENT
- **Status:** Pending
- **Deliverable:** code-change + tests.
- **Execution-Skill:** /lp-build
- **Confidence:** 91% (Implementation 92 / Approach 90 / Impact 91)
- **Affects:** `packages/lib/src/math/forecasting/`
- **Depends on:** none
- **Blocks:** HW-01..HW-06
- **Scope:**
  - Add internal `utils.ts` with:
    - `assertFiniteArray(data)`
    - `assertSeasonalPeriod(m, n)` (`m` integer, `m >= 2`, `n >= 2*m` where required)
    - `normalizeSeasonalAdditive(seasonals)` (mean 0)
    - `normalizeSeasonalMultiplicative(seasonals)` (mean 1)
    - `seasonIndex(offset, m)` and `seasonAtHorizon(lastIndex, h, m)`
    - `finiteResiduals(values)` and `sumSquaredError(values)`
    - `scoreModel(residuals, startIndex, numParams)` for aligned `n`, `SSE`, `sigma2MLE`, `logLik`, `AIC`, `BIC`
  - Add module-level JSDoc contract documenting one-step-ahead fitted values and `NaN` sentinel policy.
- **Acceptance:**
  - Utility functions are used by decomposition, HW models, AIC/BIC, and intervals.
  - `NaN` sentinel and `nEffective` policy are written once and reused.
- **Validation contract (VC-HW-00):**
  - **VC-HW-00-01:** `assertSeasonalPeriod` rejects non-integer, `<2`, and insufficient-length inputs with actionable messages.
  - **VC-HW-00-02:** Seasonal normalization tests prove additive mean approximately 0 and multiplicative mean approximately 1.
  - **VC-HW-00-03:** Wrap helper test confirms periodicity for horizons `h = 1..3m`.
  - **VC-HW-00-04:** Comparison-window helper aligns two residual series with different warm-up starts to the same `startIndex`.
  - **Validation location/evidence:** `packages/lib/__tests__/math/forecasting/utils.test.ts`

### HW-01: Seasonal decomposition with explicit edge semantics

- **Type:** IMPLEMENT
- **Status:** Pending
- **Deliverable:** code-change + tests.
- **Execution-Skill:** /lp-build
- **Confidence:** 86% (Implementation 87 / Approach 84 / Impact 86)
- **Affects:** `seasonal-decomposition.ts`
- **Depends on:** HW-00
- **Blocks:** HW-02, HW-03
- **Scope:**
  - Implement `decomposeAdditive(data, seasonalPeriod)` and `decomposeMultiplicative(data, seasonalPeriod)`.
  - Trend extraction:
    - Odd `m`: centered moving average directly.
    - Even `m`: moving average `m`, then moving average `2` for centering.
  - Return type:
    - `{ trend: number[], seasonal: number[], seasonalIndices: number[], remainder: number[] }`
    - all time-aligned arrays length `n`; undefined edge values use `NaN`.
  - Enforce multiplicative decomposition input `> 0`.
- **Acceptance:**
  - Seasonal indices are normalized (additive sum approximately 0, multiplicative mean approximately 1).
  - Reconstruction checks only indices where trend/remainder are finite.
- **Validation contract (VC-HW-01):**
  - **VC-HW-01-01:** Reconstruction on finite indices only: additive and multiplicative max absolute reconstruction error `< 1e-8`.
  - **VC-HW-01-02:** Even-period centering is correct for `m=12` (alignment check against expected center positions).
  - **VC-HW-01-03:** Arrays preserve original length with `NaN` edges.
  - **VC-HW-01-04:** Multiplicative decomposition throws when any value `<= 0`.
  - **Validation location/evidence:** `packages/lib/__tests__/math/forecasting/seasonal-decomposition.test.ts`

### HW-02: Holt-Winters additive model with deterministic initialization

- **Type:** IMPLEMENT
- **Status:** Pending
- **Deliverable:** code-change + tests.
- **Execution-Skill:** /lp-build
- **Confidence:** 84% (Implementation 86 / Approach 82 / Impact 84)
- **Affects:** `holt-winters.ts`
- **Depends on:** HW-00, HW-01
- **Blocks:** HW-04, HW-05, HW-06
- **Scope:**
  - Implement `HoltWintersAdditive` class with `fit`, `forecast`, and `fittedValues`.
  - Deterministic initialization:
    - `L0 = mean(first m observations)`
    - `T0 = mean((Y[m+i] - Y[i]) / m)` for `i=0..m-1`
    - for `t=0..2m-1`, baseline `B_t = L0 + T0*t`; seasonal raw term is `Y_t - B_t` by season position, then normalize to mean 0.
  - One-step-ahead fitted values where only `fittedValues[0] = NaN`; all `t >= 1` are finite.
  - Set `minResidualIndex = seasonalPeriod` for scoring/comparison helpers.
  - Forecast formula uses wrapped seasonal index for all horizons.
- **Acceptance:**
  - Captures additive seasonal phase/amplitude on synthetic series.
  - `forecast(steps <= 0)` returns `[]`.
  - `fit` validates `seasonalPeriod` integer and minimum data length.
- **Validation contract (VC-HW-02):**
  - **VC-HW-02-01:** Additive synthetic pattern recovery (phase + amplitude) is within tolerance.
  - **VC-HW-02-02:** One-step-ahead MAE on held-out seasonal data is lower than `HoltSmoothing`.
  - **VC-HW-02-03:** Forecast wraparound is periodic for `h = 1..3m`.
  - **VC-HW-02-04:** Only `fittedValues[0]` is `NaN`; `fittedValues[t]` is finite for `t >= 1`.
  - **VC-HW-02-05:** `minResidualIndex` is exposed and used by model-selection helpers.
  - **Validation location/evidence:** `packages/lib/__tests__/math/forecasting/holt-winters.test.ts`

### HW-03: Holt-Winters multiplicative model with strict positivity contract

- **Type:** IMPLEMENT
- **Status:** Pending
- **Deliverable:** code-change + tests.
- **Execution-Skill:** /lp-build
- **Confidence:** 83% (Implementation 84 / Approach 82 / Impact 83)
- **Affects:** `holt-winters.ts`
- **Depends on:** HW-00, HW-01
- **Blocks:** HW-04, HW-05, HW-06
- **Scope:**
  - Implement `HoltWintersMultiplicative` with API parity to additive.
  - Deterministic initialization:
    - `L0 = mean(first m)`
    - `T0 = mean((Y[m+i] - Y[i]) / m)`
    - for `t=0..2m-1`, baseline `B_t = L0 + T0*t`; seasonal raw term is `Y_t / B_t` by season position, then normalize to mean 1.
  - Fail fast when input contains `<= 0` values.
  - One-step-ahead fitted values where only `fittedValues[0] = NaN`; all `t >= 1` are finite.
  - Set `minResidualIndex = seasonalPeriod` for scoring/comparison helpers.
  - Wraparound forecast indexing for all horizons.
- **Acceptance:**
  - Multiplicative data yields positive seasonal factors averaging approximately 1.
  - Non-positive data throws clear error, no silent clamping.
- **Validation contract (VC-HW-03):**
  - **VC-HW-03-01:** Multiplicative synthetic pattern recovery is within tolerance.
  - **VC-HW-03-02:** Additive-vs-multiplicative comparison chooses multiplicative on proportional-amplitude data.
  - **VC-HW-03-03:** Input containing zero/negative values throws before updates start.
  - **VC-HW-03-04:** Forecast wraparound periodicity holds for `h = 1..3m`.
  - **VC-HW-03-05:** Only `fittedValues[0]` is `NaN`; `minResidualIndex` is exposed for aligned scoring.
  - **Validation location/evidence:** `packages/lib/__tests__/math/forecasting/holt-winters.test.ts`

### HW-04: Model-selection helpers (log-likelihood, AIC/BIC, nEffective)

- **Type:** IMPLEMENT
- **Status:** Pending
- **Deliverable:** code-change + tests.
- **Execution-Skill:** /lp-build
- **Confidence:** 85% (Implementation 86 / Approach 84 / Impact 85)
- **Affects:** `model-selection.ts`, `ewma.ts`, `holt-winters.ts`
- **Depends on:** HW-02, HW-03
- **Blocks:** HW-06
- **Scope:**
  - Implement helpers:
    - `logLikelihoodGaussian(residuals: number[]): number`
    - `calculateAIC(logLikelihood, numParams): number`
    - `calculateBIC(logLikelihood, numParams, sampleSize): number`
    - `scoreModel(residuals, startIndex, numParams)` for aligned scoring windows
    - `compareModels(models)` that applies `start = max(minResidualIndex)` across candidates
  - Use:
    - shared comparison window start index (aligned across compared models)
    - `nEffective = count(finite residuals in comparison window)`
    - `SSE = sum(residual^2 over finite residuals in comparison window)`
    - `sigma2MLE = max(SSE / nEffective, EPS)` to avoid `log(0)`
  - Parameter-count policy (deterministic initialization not counted as free parameters):
    - SES: `k=1`, Holt: `k=2`, HW additive/multiplicative: `k=3`.
- **Acceptance:**
  - All fitted models return finite AIC/BIC when `nEffective > 0`.
  - Ranking logic is stable on controlled synthetic datasets.
- **Validation contract (VC-HW-04):**
  - **VC-HW-04-01:** Formula-level test on fixed residual vectors matches hand-computed AIC/BIC.
  - **VC-HW-04-02:** `nEffective` excludes non-finite residuals and respects explicit comparison start index.
  - **VC-HW-04-03:** Two models with different raw warm-up lengths are compared on the same aligned window.
  - **VC-HW-04-04:** Near-zero SSE uses epsilon floor and returns finite log-likelihood/AIC/BIC.
  - **VC-HW-04-05:** Seasonal data model ordering generally favors HW over SES/Holt; tests assert ordering, not exact parity with R.
  - **Validation location/evidence:** `packages/lib/__tests__/math/forecasting/model-selection.test.ts`

### HW-05: Prediction intervals (method-pluggable)

- **Type:** IMPLEMENT
- **Status:** Pending
- **Deliverable:** code-change + tests.
- **Execution-Skill:** /lp-build
- **Confidence:** 80% (Implementation 81 / Approach 78 / Impact 80)
- **Affects:** `prediction-intervals.ts`, `ewma.ts`, `holt-winters.ts`
- **Depends on:** HW-02, HW-03
- **Blocks:** HW-06
- **Scope:**
  - Add `forecastWithInterval(steps: number, options?: { level?: number; method?: "naive" | "bootstrap"; simulations?: number; seed?: number })`.
  - Return: `{ forecast: number[], lower: number[], upper: number[] }`.
  - Methods:
    - `naive`: normal quantile with `SE_h = sigma * sqrt(h)` for backward-compatible simple behavior.
    - `bootstrap`: path simulation with deterministic seed support.
      - additive models: sample additive errors `e_t = data_t - fitted_t` from scoring window.
      - multiplicative models: sample ratio or log errors (`r_t = data_t / fitted_t` or `u_t = log(data_t) - log(fitted_t)`), not additive differences.
  - Default method:
    - SES/Holt: `naive`
    - HW additive/multiplicative: `bootstrap`
  - Default `seed = 0` for reproducible outputs unless caller overrides.
  - Multiplicative bootstrap keeps forecasts positive by construction.
- **Acceptance:**
  - Deterministic outputs with same seed.
  - `steps <= 0` returns empty arrays.
  - No `NaN`/`Infinity` in interval arrays for valid inputs.
- **Validation contract (VC-HW-05):**
  - **VC-HW-05-01:** Seed determinism - same seed yields identical interval arrays.
  - **VC-HW-05-02:** Bootstrap empirical coverage on synthetic data is within broad tolerance (`0.90` to `0.99`) using minimum 2000 replications.
  - **VC-HW-05-03:** Multiplicative model lower bounds remain positive for positive data.
  - **VC-HW-05-04:** Naive method width is non-decreasing by horizon.
  - **VC-HW-05-05:** Invalid level (`<=0` or `>=1`) throws.
  - **VC-HW-05-06:** Coverage tests are marked slow or env-gated to avoid CI flakiness.
  - **Validation location/evidence:** `packages/lib/__tests__/math/forecasting/prediction-intervals.test.ts`

### HW-06: Parameter optimization (deterministic two-stage grid search)

- **Type:** IMPLEMENT
- **Status:** Pending
- **Deliverable:** code-change + tests.
- **Execution-Skill:** /lp-build
- **Confidence:** 82% (Implementation 84 / Approach 80 / Impact 82)
- **Affects:** `parameter-optimization.ts`
- **Depends on:** HW-04, HW-05
- **Blocks:** none
- **Scope:**
  - Implement `optimizeParameters(data, seasonalPeriod, modelType)`.
  - Stage 1 coarse grid: `0.1..0.9` step `0.1`.
  - Stage 2 local refinement around best coarse point (default step `0.02`, clamped to `[0.01, 0.99]`).
  - Objective: minimize SSE over the model-selection aligned scoring window (compute AIC for reporting after selecting best params).
  - Return: `{ alpha, beta, gamma, sse, aic, evaluatedCandidates }`.
- **Acceptance:**
  - Optimized parameters improve SSE versus default params.
  - Output params always stay within configured bounds.
  - Algorithm is deterministic for same input.
- **Validation contract (VC-HW-06):**
  - **VC-HW-06-01:** Optimization decreases SSE on synthetic seasonal data.
  - **VC-HW-06-02:** Refined search beats or matches coarse-only search.
  - **VC-HW-06-03:** Boundary cases are handled without exceptions.
  - **VC-HW-06-04:** Unit tests assert candidate-count bounds; performance checks are benchmark-only (not strict CI wall-clock gate).
  - **Validation location/evidence:** `packages/lib/__tests__/math/forecasting/parameter-optimization.test.ts`

## Validation Strategy

1. Unit tests for every module with deterministic seeds where randomness is used (default seed `0` unless overridden).
2. Synthetic data suites for additive and multiplicative seasonality with explicit known structure.
3. Formula-level correctness tests for AIC/BIC/log-likelihood, aligned scoring windows, and helper utilities.
4. Reference parity checks against R/Python for directional behavior and ranges, not exact equality unless formulas/initialization are identical.
5. Benchmark/performance checks separated from strict pass/fail unit tests; slow coverage simulations are env-gated.

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Initialization quality dominates forecast quality | High | Lock deterministic initialization algorithm and test with known synthetic data |
| Miscalibrated intervals mislead decisions | Medium | Default HW to bootstrap intervals with ratio/log error simulation for multiplicative models |
| Multiplicative instability for non-positive data | High | Fail fast on `<= 0` input with clear error messages |
| AIC/BIC inconsistency due to residual accounting | High | Use aligned comparison windows via `start = max(minResidualIndex)` and shared scoring helpers |
| CI flakiness from stochastic/perf tests | Medium | Seed all randomness, use broad coverage tolerances, keep hard timing checks out of unit tests |

## What Would Make Confidence >=90%

1. Validate initialization and forecast parity against two independent references on shared fixtures.
2. Add end-to-end tests that enforce residual/AIC/interval consistency on the same fitted model outputs.
3. Add benchmark report showing optimization and bootstrap costs on representative dataset sizes.
4. Validate interval calibration quality across multiple synthetic seasonal/noise regimes.

## Dependencies and Integration

- **Dependencies:**
  - `packages/lib/src/math/statistics/descriptive.ts` for `mean`, `stddev`, `variance`.
  - `packages/lib/src/math/forecasting/ewma.ts` for SES/Holt baselines and API consistency.
- **Integration:**
  - Export new classes/functions from `packages/lib/src/math/forecasting/index.ts`.
  - Re-export from `packages/lib/src/math/index.ts` and `packages/lib/src/index.ts`.
  - Keep JSDoc examples aligned with one-step-ahead semantics, aligned scoring windows, and bootstrap method options.

## Implementation Notes

### Code Organization

```
packages/lib/src/math/forecasting/
|- ewma.ts                         # existing (EWMA, SES, Holt)
|- utils.ts                        # NEW (validation, normalization, residual and scoring helpers)
|- holt-winters.ts                 # NEW (additive + multiplicative)
|- seasonal-decomposition.ts       # NEW
|- prediction-intervals.ts         # NEW
|- model-selection.ts              # NEW
|- parameter-optimization.ts       # NEW
`- index.ts                        # updated exports

packages/lib/__tests__/math/forecasting/
|- ewma.test.ts                    # existing
|- utils.test.ts                   # NEW
|- holt-winters.test.ts            # NEW
|- seasonal-decomposition.test.ts  # NEW
|- prediction-intervals.test.ts    # NEW
|- model-selection.test.ts         # NEW
`- parameter-optimization.test.ts  # NEW
```

### Conventions to Follow

1. Deterministic tests by default (seeded where stochastic, default `seed=0`).
2. Existing forecast API behavior preserved (`steps <= 0` returns empty arrays).
3. Public methods must throw actionable errors for invalid domains.
4. Residual-based calculations always ignore non-finite entries.

## Next Steps

1. Review this revised plan and approve the contract decisions (aligned scoring windows, multiplicative error-space bootstrap, and burn-in semantics).
2. Execute HW-00 first, then continue in dependency order.
3. Run targeted validation per task (`pnpm --filter @acme/lib typecheck`, `pnpm --filter @acme/lib lint`, targeted forecasting tests).

---

**Estimated total effort:** 1-2 weeks (1 developer full-time)
- HW-00: 0.5 day
- HW-01: 1.5 days
- HW-02: 2 days
- HW-03: 2 days
- HW-04: 1 day
- HW-05: 2 days
- HW-06: 2.5 days

**Delivery order:** `HW-00 -> HW-01 -> (HW-02 + HW-03) -> (HW-04 + HW-05) -> HW-06`.
