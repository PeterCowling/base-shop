---
Type: Plan
Status: Active
Domain: Platform
Workstream: Analytics
Created: 2026-02-13
Last-updated: 2026-02-13
Last-reviewed: 2026-02-13
Relates-to charter: none
Feature-Slug: ab-testing-framework
Deliverable-Type: single-deliverable
Execution-Track: implementation
Primary-Execution-Skill: /lp-build
Supporting-Skills: none
Overall-confidence: 81%
Confidence-Method: effort-weighted average of per-task min(Implementation,Approach,Impact); ABT-07B at 68% with precursor chain (ABT-08, ABT-09) gating promotion
Business-OS-Integration: off
Business-Unit: PLAT
---

# A/B Testing and Experimentation Framework Plan

## Summary

Implement a statistically rigorous experimentation module in `packages/lib/src/math/experimentation/` for pricing, UX, and marketing experiments.

**Current state:** No statistical experimentation framework exists. Teams lack standardized sample-size planning, significance tests, confidence/credible intervals, Bayesian inference, and sequential decision tooling.

**Target state:** Pure TypeScript functions for:
1. Sample-size planning
2. Frequentist hypothesis tests and confidence intervals
3. Bayesian A/B testing with Beta-Binomial models
4. Thompson sampling for multi-armed bandits
5. Sequential testing in two phases: group-sequential boundaries first, always-valid inference second

**Primary references:**
- Fact-find: `docs/plans/advanced-math-algorithms-fact-find.md` (Opportunity C)
- Existing conventions: `packages/lib/src/math/statistics/`, `packages/lib/src/math/random/`

## Goals

1. Unblock data-driven pricing and UX experiments with statistically sound decisions.
2. Ensure pre-launch power planning is available and testable.
3. Support both frequentist and Bayesian inference paths with explicit API contracts.
4. Enable deterministic Thompson sampling workflows for adaptive allocation.
5. Provide sequential-testing support with clear scope and validation boundaries.

## Non-goals

1. Experiment tracking infrastructure (event logging, assignment, exposure modeling).
2. Dashboard/UI components for analysis and reporting.
3. Integration with third-party analytics providers.
4. Causal inference / uplift modeling / advanced econometrics.

## Constraints and Assumptions

- **Constraints:**
  - TypeScript-only implementation, no sidecars.
  - Pure functions only (no I/O side effects like `console.warn`).
  - Reuse existing math modules where possible.
- **Assumptions:**
  - Conversion-rate experiments are the primary initial use case.
  - Inputs are pre-aggregated (counts, means, stddev/variance, sample sizes).
  - Callers choose and pass directional alternatives explicitly.

## API and Statistical Contracts (Must Stay Consistent)

1. All hypothesis-test APIs use `alternative: "two-sided" | "greater" | "less"`.
2. Functions must not hide alpha defaults when returning significance decisions.
3. If convenience significance flags are returned, they require explicit `alpha` input.
4. Confidence/credible interval returns include `estimate`, `lower`, `upper`, `halfWidth`.
5. Chi-square assumption notices are returned in structured output (`warnings: string[]`), never emitted via console.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---|---|---|---|
| ABT-00 | IMPLEMENT | Special functions and distribution utilities (normal/t/beta/gamma/chi-square primitives) | 80% | M | Complete (2026-02-13) | - | ABT-02, ABT-03, ABT-04, ABT-05, ABT-07A, ABT-07B |
| ABT-01 | IMPLEMENT | Module scaffold and exports | 95% | XS | Complete (2026-02-13) | - | ABT-02, ABT-03, ABT-04, ABT-05, ABT-06, ABT-07A, ABT-07B |
| ABT-02 | IMPLEMENT | Sample-size calculator for two-proportion tests | 88% | S | Complete (2026-02-13) | ABT-00, ABT-01 | - |
| ABT-03 | IMPLEMENT | Frequentist significance tests (z-test, Welch t-test, chi-square GOF) | 86% | M | Complete (2026-02-13) | ABT-00, ABT-01 | ABT-07A |
| ABT-04 | IMPLEMENT | Confidence interval functions (proportion/mean/differences) | 88% | S | Complete (2026-02-13) | ABT-00, ABT-01 | - |
| ABT-05 | IMPLEMENT | Bayesian A/B testing (Beta-Binomial, credible intervals, superiority) | 83% | M | Complete (2026-02-13) | ABT-00, ABT-01 | ABT-06, ABT-07B |
| ABT-06 | IMPLEMENT | Thompson sampling and regret simulation for Beta-Bernoulli bandits | 84% | M | Complete (2026-02-13) | ABT-00, ABT-01, ABT-05 | - |
| ABT-07A | IMPLEMENT | Group-sequential testing using documented O'Brien-Fleming approximation | 80% | M | Complete (2026-02-13) | ABT-00, ABT-01, ABT-03 | - |
| ABT-08 | INVESTIGATE | mSPRT variant specification and mathematical formulation for binomial A/B tests | 88% | S | Pending | - | ABT-09 |
| ABT-09 | SPIKE | mSPRT simulation harness prototype with type-I error validation | 82% | S | Pending | ABT-00, ABT-01, ABT-05, ABT-08 | ABT-07B |
| ABT-07B | IMPLEMENT | Always-valid inference (mSPRT) with simulation-based error-control validation | 68% (→ 82% conditional on ABT-08, ABT-09) | L | Pending | ABT-00, ABT-01, ABT-05, ABT-08, ABT-09 | - |

## Parallelism Guide

```
Wave 1 (parallel):  ABT-00, ABT-01, ABT-08
Wave 2 (parallel):  ABT-02, ABT-03, ABT-04, ABT-05
Wave 3 (parallel):  ABT-06, ABT-07A, ABT-09
Wave 4:             ABT-07B
```

- **Max parallelism:** 4 (Wave 2)
- **Critical path:** ABT-00 → ABT-05 → ABT-09 → ABT-07B
- **Independent of ABT-07B chain:** ABT-02, ABT-03, ABT-04, ABT-06, ABT-07A (can all complete without ABT-07B)

## Tasks

### ABT-00: Special functions and distribution utilities

- **Type**: IMPLEMENT
- **Deliverable**: code-change + tests
- **Execution-Skill**: /lp-build
- **Confidence**: 80%
  - Implementation: 80% — well-documented algorithms (Lanczos, Abramowitz-Stegun, continued fractions) with existing analogous numerical code in codebase
  - Approach: 85% — single viable approach per function, no design decisions required
  - Impact: 85% — internal module consumed only by downstream ABT tasks
- **Effort**: M (4-6 hours)
- **Depends on**: -
- **Blocks**: ABT-02, ABT-03, ABT-04, ABT-05, ABT-07A, ABT-07B
- **Affects**:
  - `packages/lib/src/math/experimentation/internal/special-functions.ts` [primary]
  - `packages/lib/__tests__/math/experimentation/internal/special-functions.test.ts` [primary]
- **Scope**:
  - Create internal utilities under `packages/lib/src/math/experimentation/internal/`:
    - `normalCdf(x)`, `normalPpf(p)`
    - `studentTCdf(t, df)`, `studentTPpf(p, df)`
    - `chiSquareSf(x, df)`
    - `regularizedIncompleteBeta(x, a, b)`
    - `regularizedIncompleteGamma(s, x)`
    - `logGamma(z)` (Lanczos), `logBeta(a, b)`
  - Numerical design:
    - Tail-safe implementations (`sf` in upper tails where needed)
    - Stable log-space evaluation for extreme parameters
- **Acceptance**:
  1. Utility outputs match reference implementations across representative grids.
  2. Tail behavior remains stable for high-confidence/tail p-values used by tests.
- **Test contract:**
  - **TC-00-01:** `normalPpf(0.975)` → ~= `1.9599639845` (abs err < 1e-6)
  - **TC-00-02:** `studentTCdf(2.045, 29)` → ~= `0.975` (abs err < 1e-4)
  - **TC-00-03:** `chiSquareSf(10, 2)` → ~= `0.006737947` (abs err < 1e-6)
  - **TC-00-04:** `logGamma(0.5)` → ~= `0.5723649429` (abs err < 1e-8)
  - **TC-00-05:** Test suite has >=20 tests, including edge/tail cases
  - **Acceptance coverage:** TC-00-01..04 cover criterion 1 (reference parity); TC-00-05 covers criterion 2 (tail stability)
  - **Test type:** unit
  - **Test location:** `packages/lib/__tests__/math/experimentation/internal/special-functions.test.ts` (new)
  - **Run:** `npx jest --config jest.config.cjs --testPathPattern='experimentation/internal/special-functions'`

#### Re-plan Update (2026-02-13)
- **Previous confidence:** 78%
- **Updated confidence:** 80%
  - **Evidence class:** E2 (executable verification)
  - Implementation: 80% — existing `normalQuantile()` in `prediction-intervals.ts:230-253` proves special function implementation works in this codebase (Abramowitz-Stegun rational approx). 505/506 math tests pass including HyperLogLog++ bias correction, Holt-Winters optimization, and Box-Muller transform — all involve analogous numerical computation.
  - Approach: 85% — algorithms fully specified (Lanczos for logGamma, continued fraction for incomplete beta, Abramowitz-Stegun/Beasley-Springer-Moro for normal CDF/PPF)
  - Impact: 85% — internal module, no external consumers, clean dependency boundary
- **Investigation performed:**
  - Repo: `packages/lib/src/math/forecasting/prediction-intervals.ts:230-253` (existing normalQuantile), `packages/lib/src/math/random/index.ts:524-541` (Box-Muller), `packages/lib/src/math/probabilistic/hyperloglog.ts` (bias correction), `packages/lib/src/math/forecasting/parameter-optimization.ts` (iterative grid search)
  - Tests: Ran `npx jest --testPathPattern=math/forecasting` → 170 PASS; ran `npx jest --testPathPattern=math/(statistics|random|probabilistic)` → 335/336 PASS (1 pre-existing bloom-filter failure). Total: 505/506 math tests pass.
  - Docs: Abramowitz-Stegun 26.2.23 (normal quantile), Lanczos approximation (logGamma), continued fraction for regularized incomplete beta
- **Decision / resolution:**
  - Existing codebase demonstrates numerical computation capability at the required level. The `normalQuantile()` function is a direct proof-of-concept for ABT-00's scope. Combined with 505 passing math tests (E2), promote from 78% → 80%.

#### Build Completion (2026-02-13)
- **Status:** Complete
- **Commits:** `dbbcd97b12`
- **Execution cycle:**
  - Validation cases executed: TC-00-01, TC-00-02, TC-00-03, TC-00-04, TC-00-05
  - Cycles: 3 (red -> green -> precision fix)
  - Initial validation: FAIL expected (module missing), then FAIL (normal CDF/PPF precision), then PASS
  - Final validation: PASS
- **Confidence reassessment:**
  - Original: 80%
  - Post-validation: 80%
  - Delta reason: Validation required one precision-tuning iteration for normal CDF/PPF but stayed in-task with no scope expansion.
- **Validation:**
  - Ran: `pnpm --filter @acme/lib test -- __tests__/math/experimentation/internal/special-functions.test.ts` — PASS (24/24)
  - Ran: `pnpm --filter @acme/lib build` — FAIL (pre-existing unrelated type errors in `packages/lib/src/growth/store.ts`)
  - Ran: `pnpm --filter @acme/lib lint` — PASS with 2 pre-existing warnings in `packages/lib/src/growth/__tests__/store.test.ts`
- **Documentation updated:** None required
- **Implementation notes:** Added `special-functions.ts` with normal/t/chi-square primitives and stable Lanczos + incomplete-gamma/beta implementations; added 24 unit tests with edge and tail coverage.

---

### ABT-01: Module scaffold and exports

- **Type**: IMPLEMENT
- **Deliverable**: code-change
- **Execution-Skill**: /lp-build
- **Confidence**: 95%
  - Implementation: 95% — trivial directory creation and barrel export, follows 10 existing modules
  - Approach: 95% — single approach: match existing module pattern
  - Impact: 95% — additive only, no existing code modified beyond `math/index.ts` barrel
- **Effort**: XS (30 min)
- **Depends on**: -
- **Blocks**: ABT-02, ABT-03, ABT-04, ABT-05, ABT-06, ABT-07A, ABT-07B
- **Affects**:
  - `packages/lib/src/math/experimentation/index.ts` [primary]
  - `packages/lib/src/math/index.ts` [primary]
- **Scope**:
  - Create `packages/lib/src/math/experimentation/` directory.
  - Add `index.ts` module barrel with top-level JSDoc.
  - Export from `packages/lib/src/math/index.ts`.
  - Verify `@acme/lib` package export behavior remains valid.
- **Acceptance**:
  1. Import from `@acme/lib/math/experimentation` typechecks.
  2. Export style is consistent with existing math modules.
- **Test contract:**
  - **TC-01-01:** `pnpm --filter @acme/lib typecheck` passes with experimentation import → PASS
  - **TC-01-02:** Module header JSDoc includes at least 3 use-case examples → manual review
  - **Acceptance coverage:** TC-01-01 covers criterion 1; TC-01-02 covers criterion 2
  - **Test type:** typecheck + review
  - **Test location:** N/A (typecheck validation)
  - **Run:** `pnpm --filter @acme/lib typecheck`

#### Build Completion (2026-02-13)
- **Status:** Complete
- **Commits:** `2b780b721b`
- **Execution cycle:**
  - Validation cases executed: TC-01-01, TC-01-02
  - Cycles: 2 (initial scaffold, then lint-driven export-style adjustment)
  - Initial validation: FAIL (`@typescript-eslint/consistent-type-exports` on `math/index.ts`)
  - Final validation: PASS
- **Confidence reassessment:**
  - Original: 95%
  - Post-validation: 95%
  - Delta reason: Validation confirmed assumptions; only a style-conformance adjustment was needed.
- **Validation:**
  - Ran: `pnpm exec tsc -p /tmp/abt01-tsconfig.json` — PASS (verifies `import "@acme/lib/math/experimentation"` typechecks in a focused harness)
  - Ran: `pnpm --filter @acme/lib exec eslint src/math/index.ts src/math/experimentation/index.ts` — PASS
  - Ran: `pnpm --filter @acme/lib build` — PASS
  - Ran: `pnpm --filter @acme/lib lint` — PASS with 2 pre-existing warnings in `packages/lib/src/growth/__tests__/store.test.ts`
- **Documentation updated:** None required
- **Implementation notes:** Added experimentation module barrel with top-level JSDoc and three usage examples, introduced shared `AlternativeHypothesis` type export, and wired `math/index.ts` to re-export experimentation types.

---

### ABT-02: Sample-size calculator (two-proportion)

- **Type**: IMPLEMENT
- **Deliverable**: code-change + tests
- **Execution-Skill**: /lp-build
- **Confidence**: 88%
  - Implementation: 88% — closed-form formula, single function, clear spec
  - Approach: 90% — textbook formula with no design choices
  - Impact: 88% — additive module, no existing code affected
- **Effort**: S (2-3 hours)
- **Depends on**: ABT-00, ABT-01
- **Blocks**: -
- **Affects**:
  - `packages/lib/src/math/experimentation/sample-size.ts` [primary]
  - `packages/lib/__tests__/math/experimentation/sample-size.test.ts` [primary]
  - `packages/lib/src/math/experimentation/internal/special-functions.ts` [readonly]
  - `packages/lib/src/math/experimentation/index.ts` [primary — add export]
- **Scope**:
  - Implement `sampleSizeForProportions(options)`.
  - Options: `{ baselineRate, minimumDetectableEffect, alpha, power, alternative? }`.
  - `alternative` defaults to `"two-sided"`; one-sided alternatives use `z_(1-alpha)`.
  - Return: `{ samplesPerVariant: number, totalSamples: number }`.
- **Acceptance**:
  1. Results match textbook formula and reference software within tolerance.
  2. Input validation is strict and actionable.
- **Test contract:**
  - **TC-02-01:** Baseline `0.05`, treatment `0.06`, `alpha=0.05`, `power=0.8`, `alternative="two-sided"` → `samplesPerVariant ~= 8155` (total ~= 16310, tolerance +/-2%)
  - **TC-02-02:** Same inputs with one-sided alternative → `samplesPerVariant ~= 6424` (tolerance +/-2%)
  - **TC-02-03:** `minimumDetectableEffect = 0` → throws `RangeError`
  - **TC-02-04:** `alpha <= 0` or `alpha >= 1`, or `power <= 0` or `power >= 1` → throws `RangeError`
  - **TC-02-05:** Test suite has >=10 tests covering formulas, alternatives, and validation
  - **Acceptance coverage:** TC-02-01..02 cover criterion 1 (formula parity); TC-02-03..04 cover criterion 2 (validation)
  - **Test type:** unit
  - **Test location:** `packages/lib/__tests__/math/experimentation/sample-size.test.ts` (new)
  - **Run:** `npx jest --config jest.config.cjs --testPathPattern='experimentation/sample-size'`

#### Build Completion (2026-02-13)
- **Status:** Complete
- **Commits:** `1b1e132b54`
- **Execution cycle:**
  - Validation cases executed: TC-02-01, TC-02-02, TC-02-03, TC-02-04, TC-02-05
  - Cycles: 2 (red missing module -> green implementation)
  - Initial validation: FAIL expected (module missing)
  - Final validation: PASS
- **Confidence reassessment:**
  - Original: 88%
  - Post-validation: 88%
  - Delta reason: Validation confirmed formula parity and strict input guards with no scope expansion.
- **Validation:**
  - Ran: `pnpm --filter @acme/lib test -- __tests__/math/experimentation/sample-size.test.ts` — PASS (12/12)
  - Ran: `pnpm --filter @acme/lib test -- __tests__/math/experimentation/internal/special-functions.test.ts` — PASS (24/24 regression)
  - Ran: `pnpm --filter @acme/lib build` — PASS
  - Ran: `pnpm --filter @acme/lib lint` — PASS with 2 pre-existing warnings in `packages/lib/src/growth/__tests__/store.test.ts`
  - Ran: `pnpm --filter @acme/lib exec eslint src/math/experimentation/index.ts src/math/experimentation/sample-size.ts __tests__/math/experimentation/sample-size.test.ts` — PASS
- **Documentation updated:** None required
- **Implementation notes:** Added two-proportion sample-size planner using ABT-00 normal quantiles, explicit one-sided/two-sided alpha handling, and strict probability/rate validation; exported planner from experimentation barrel.

**Reference formula**:
```
n = (z_alpha + z_beta)^2 * [p1(1-p1) + p2(1-p2)] / (p1 - p2)^2

where:
- for two-sided tests: z_alpha = z_(1 - alpha/2)
- for one-sided tests: z_alpha = z_(1 - alpha)
- z_beta = z_(power)
```

---

### ABT-03: Frequentist significance tests

- **Type**: IMPLEMENT
- **Deliverable**: code-change + tests
- **Execution-Skill**: /lp-build
- **Confidence**: 86%
  - Implementation: 86% — three tests using ABT-00 primitives, straightforward formulas
  - Approach: 88% — standard statistical tests with explicit API contracts
  - Impact: 86% — additive module, no existing code affected; ABT-07A depends on this
- **Effort**: M (4-5 hours)
- **Depends on**: ABT-00, ABT-01
- **Blocks**: ABT-07A
- **Affects**:
  - `packages/lib/src/math/experimentation/hypothesis-tests.ts` [primary]
  - `packages/lib/__tests__/math/experimentation/hypothesis-tests.test.ts` [primary]
  - `packages/lib/src/math/experimentation/internal/special-functions.ts` [readonly]
  - `packages/lib/src/math/experimentation/index.ts` [primary — add export]
- **Scope**:
  - Implement `zTestProportions(options)`.
    - Options: `{ controlSuccesses, controlTotal, treatmentSuccesses, treatmentTotal, alternative?, alpha? }`
    - Return: `{ zScore, pValue, alternative, isSignificant?, warnings: string[] }`
  - Implement `welchTTest(options)`.
    - Options: `{ mean1, stddev1, n1, mean2, stddev2, n2, alternative?, alpha? }`
    - Return: `{ tStatistic, degreesOfFreedom, pValue, alternative, isSignificant? }`
  - Implement `chiSquareGoodnessOfFit(observed, expected, options?)`.
    - Options include `{ alpha?, alternative? }`
    - Return: `{ chiSquare, degreesOfFreedom, pValue, isSignificant?, warnings: string[] }`
  - No side effects: warnings are structured return data, not console output.
- **Acceptance**:
  1. P-values match reference tools within numerical tolerance.
  2. Directional alternatives are explicit and tested.
  3. API never assumes hidden alpha for significance flags.
- **Test contract:**
  - **TC-03-01:** z-test with `50/1000` vs `65/1000` → `z ~= 1.441`, two-sided `p ~= 0.1496`, one-sided (`greater`) `p ~= 0.0748`
  - **TC-03-02:** Welch t-test with `mean1=100, stddev1=15, n1=30, mean2=104, stddev2=20, n2=35` → `t ~= -0.919`, `df ~= 61.98`, two-sided `p ~= 0.361`
  - **TC-03-03:** Chi-square GOF with `observed=[10,20,30]`, `expected=[20,20,20]` → `chiSquare=10`, `df=2`, `p ~= 0.00674`
  - **TC-03-04:** Chi-square with any expected count `<5` → includes a warning entry in `warnings`
  - **TC-03-05:** Test suite has >=18 tests across alternatives, alpha behavior, and validation
  - **Acceptance coverage:** TC-03-01..03 cover criterion 1 (p-value parity); TC-03-01 one-sided covers criterion 2 (alternatives); TC-03-04 covers criterion 3 (no hidden alpha, warnings are structured)
  - **Test type:** unit
  - **Test location:** `packages/lib/__tests__/math/experimentation/hypothesis-tests.test.ts` (new)
  - **Run:** `npx jest --config jest.config.cjs --testPathPattern='experimentation/hypothesis-tests'`

#### Build Completion (2026-02-13)
- **Status:** Complete
- **Commits:** `460c333c92`
- **Execution cycle:**
  - Validation cases executed: TC-03-01, TC-03-02, TC-03-03, TC-03-04, TC-03-05
  - Cycles: 2 (implementation + export-sort conformance fix)
  - Initial validation: PASS tests; FAIL lint (`simple-import-sort/exports`) in experimentation barrel
  - Final validation: PASS
- **Confidence reassessment:**
  - Original: 86%
  - Post-validation: 86%
  - Delta reason: Validation confirmed statistical parity and API behavior; only lint-order conformance changed.
- **Validation:**
  - Ran: `pnpm --filter @acme/lib test -- __tests__/math/experimentation/hypothesis-tests.test.ts` — PASS (18/18)
  - Ran: `pnpm --filter @acme/lib test -- __tests__/math/experimentation/hypothesis-tests.test.ts __tests__/math/experimentation/sample-size.test.ts __tests__/math/experimentation/internal/special-functions.test.ts` — PASS (54/54)
  - Ran: `pnpm --filter @acme/lib exec eslint src/math/experimentation/hypothesis-tests.ts __tests__/math/experimentation/hypothesis-tests.test.ts src/math/experimentation/index.ts` — PASS
  - Ran: `pnpm --filter @acme/lib build` — PASS
  - Ran: `pnpm --filter @acme/lib lint` — PASS with 2 pre-existing warnings in `packages/lib/src/growth/__tests__/store.test.ts`
- **Documentation updated:** None required
- **Implementation notes:** Added frequentist testing module with z-test, Welch t-test, and chi-square GOF, explicit directional alternatives, optional alpha-gated significance flags, and structured warning outputs.

**Implementation notes**:
- Build p-value computations on ABT-00 primitives.
- Avoid direct tail subtraction when survival-function variants are more stable.

---

### ABT-04: Confidence interval functions

- **Type**: IMPLEMENT
- **Deliverable**: code-change + tests
- **Execution-Skill**: /lp-build
- **Confidence**: 88%
  - Implementation: 88% — Wilson/Newcombe are well-documented closed-form computations
  - Approach: 90% — method choices specified (Wilson for proportions, Newcombe for differences)
  - Impact: 88% — additive module, no existing code affected
- **Effort**: S (2-3 hours)
- **Depends on**: ABT-00, ABT-01
- **Blocks**: -
- **Affects**:
  - `packages/lib/src/math/experimentation/confidence-intervals.ts` [primary]
  - `packages/lib/__tests__/math/experimentation/confidence-intervals.test.ts` [primary]
  - `packages/lib/src/math/experimentation/internal/special-functions.ts` [readonly]
  - `packages/lib/src/math/experimentation/index.ts` [primary — add export]
- **Scope**:
  - Implement `proportionConfidenceInterval(successes, total, confidenceLevel?)` using Wilson interval.
  - Implement `meanConfidenceInterval(mean, stddev, n, confidenceLevel?)` using Student-t critical value.
  - Implement `proportionDifferenceCI(s1, n1, s2, n2, confidenceLevel?)` using Newcombe-Wilson hybrid.
  - Implement `meanDifferenceCI(mean1, stddev1, n1, mean2, stddev2, n2, confidenceLevel?)` using Welch standard error and t critical value.
  - Return shape for all interval APIs:
    - `{ estimate: number, lower: number, upper: number, halfWidth: number }`
- **Acceptance**:
  1. Wilson/Newcombe methods are used for proportion intervals.
  2. Confidence-level validation is strict (`0 < level < 1`).
  3. Asymmetric intervals remain representable by explicit lower/upper bounds.
- **Test contract:**
  - **TC-04-01:** Wilson CI for `50/1000`, 95% → approximately `[0.038, 0.065]`
  - **TC-04-02:** Mean CI for `mean=100`, `stddev=15`, `n=30`, 95% → approximately `[94.4, 105.6]`
  - **TC-04-03:** Proportion difference CI for `(50/1000, 65/1000)`, 95% → approximately `[-0.014, 0.044]`
  - **TC-04-04:** `confidenceLevel <= 0` or `>= 1` → throws `RangeError`
  - **TC-04-05:** Test suite has >=14 tests including interval method checks and validation
  - **Acceptance coverage:** TC-04-01 covers criterion 1 (Wilson method); TC-04-04 covers criterion 2 (validation); TC-04-01..03 cover criterion 3 (lower/upper bounds)
  - **Test type:** unit
  - **Test location:** `packages/lib/__tests__/math/experimentation/confidence-intervals.test.ts` (new)
  - **Run:** `npx jest --config jest.config.cjs --testPathPattern='experimentation/confidence-intervals'`

#### Build Completion (2026-02-13)
- **Status:** Complete
- **Commits:** `838b8c61aa`
- **Execution cycle:**
  - Validation cases executed: TC-04-01, TC-04-02, TC-04-03, TC-04-04, TC-04-05
  - Cycles: 3 (red missing module -> green implementation -> lint/rule conformance)
  - Initial validation: FAIL expected (module missing), then FAIL (`max-params`, export sort), then PASS
  - Final validation: PASS
- **Confidence reassessment:**
  - Original: 88%
  - Post-validation: 88%
  - Delta reason: Validation confirmed Wilson/Newcombe+t interval behavior and strict input guards; no scope expansion.
- **Validation:**
  - Ran: `pnpm --filter @acme/lib test -- __tests__/math/experimentation/confidence-intervals.test.ts` — PASS (14/14)
  - Ran: `pnpm --filter @acme/lib test -- __tests__/math/experimentation/hypothesis-tests.test.ts __tests__/math/experimentation/sample-size.test.ts __tests__/math/experimentation/internal/special-functions.test.ts __tests__/math/experimentation/confidence-intervals.test.ts` — PASS (68/68)
  - Ran: `pnpm --filter @acme/lib exec eslint src/math/experimentation/confidence-intervals.ts __tests__/math/experimentation/confidence-intervals.test.ts src/math/experimentation/index.ts` — PASS
  - Ran: `pnpm --filter @acme/lib build` — PASS
  - Ran: `pnpm --filter @acme/lib lint` — PASS with 2 pre-existing warnings in `packages/lib/src/growth/__tests__/store.test.ts`
- **Documentation updated:** None required
- **Implementation notes:** Added Wilson proportion CI, Student-t mean CI, Newcombe-Wilson proportion-difference CI, and Welch-based mean-difference CI with canonical return shape (`estimate/lower/upper/halfWidth`).

**References**:
- Brown, Cai, DasGupta (2001), Wilson coverage properties.
- Newcombe (1998), difference-in-proportions interval methods.

---

### ABT-05: Bayesian A/B testing (Beta-Binomial)

- **Type**: IMPLEMENT
- **Deliverable**: code-change + tests
- **Execution-Skill**: /lp-build
- **Confidence**: 83%
  - Implementation: 83% — Gamma-ratio Beta sampling + regularized incomplete beta for quantiles; no existing Beta/Gamma sampling in codebase but pattern is well-documented
  - Approach: 85% — Gamma-ratio method chosen over inverse-CDF; Jeffreys prior default
  - Impact: 85% — additive module; ABT-06 and ABT-07B depend on this
- **Effort**: M (4-5 hours)
- **Depends on**: ABT-00, ABT-01
- **Blocks**: ABT-06, ABT-07B
- **Affects**:
  - `packages/lib/src/math/experimentation/bayesian.ts` [primary]
  - `packages/lib/__tests__/math/experimentation/bayesian.test.ts` [primary]
  - `packages/lib/src/math/experimentation/internal/special-functions.ts` [readonly]
  - `packages/lib/src/math/random/index.ts` [readonly]
  - `packages/lib/src/math/experimentation/index.ts` [primary — add export]
- **Scope**:
  - Implement `bayesianABTest(options)`.
  - Options:
    - `{ controlSuccesses, controlTotal, treatmentSuccesses, treatmentTotal, priorAlpha?, priorBeta?, credibleIntervalLevel?, simulationSamples?, seed? }`
  - Default prior: Jeffreys prior (`alpha=0.5`, `beta=0.5`).
  - Return:
    - `{ controlPosterior, treatmentPosterior, probabilityTreatmentBetter, expectedLift }`
  - Credible intervals via Beta quantile (root-finding over regularized incomplete beta).
  - Posterior simulation via Gamma sampling (Marsaglia-Tsang), not inverse-transform quantile sampling.
- **Acceptance**:
  1. Posterior update math is correct and deterministic with a seed.
  2. Probability-of-superiority aligns with reference simulation.
  3. Bayesian terminology is explicit in JSDoc.
- **Test contract:**
  - **TC-05-01:** `50/1000` vs `65/1000` with Jeffreys prior → `P(treatment > control) ~= 0.92-0.93`
  - **TC-05-02:** Equal data (`50/1000` vs `50/1000`) → `P(treatment > control)` near `0.50`
  - **TC-05-03:** Strong prior `Beta(100,100)` with weak data (`5/10`, `6/10`) → posterior means near `0.5`
  - **TC-05-04:** 95% credible interval for `95/1000` (Jeffreys prior) → ~= `[0.078, 0.114]`
  - **TC-05-05:** Test suite has >=12 tests across posterior updates, intervals, simulation, and seeding
  - **Acceptance coverage:** TC-05-01..03 cover criterion 1 (posterior correctness); TC-05-01 covers criterion 2 (superiority probability); TC-05-04 covers credible intervals
  - **Test type:** unit
  - **Test location:** `packages/lib/__tests__/math/experimentation/bayesian.test.ts` (new)
  - **Run:** `npx jest --config jest.config.cjs --testPathPattern='experimentation/bayesian'`

#### Build Completion (2026-02-13)
- **Status:** Complete
- **Commits:** pending
- **Execution cycle:**
  - Validation cases executed: TC-05-01, TC-05-02, TC-05-03, TC-05-04, TC-05-05
  - Cycles: 2 (implementation + lint export/import ordering fix)
  - Initial validation: PASS tests; FAIL lint (`simple-import-sort`) in new files/barrel
  - Final validation: PASS
- **Confidence reassessment:**
  - Original: 83%
  - Post-validation: 83%
  - Delta reason: Validation confirmed deterministic posterior/simulation behavior and reference-range parity.
- **Validation:**
  - Ran: `pnpm --filter @acme/lib test -- __tests__/math/experimentation/bayesian.test.ts` — PASS (12/12)
  - Ran: `pnpm --filter @acme/lib test -- __tests__/math/experimentation/internal/special-functions.test.ts __tests__/math/experimentation/sample-size.test.ts __tests__/math/experimentation/hypothesis-tests.test.ts __tests__/math/experimentation/confidence-intervals.test.ts __tests__/math/experimentation/bayesian.test.ts` — PASS (80/80)
  - Ran: `pnpm --filter @acme/lib exec eslint src/math/experimentation/bayesian.ts __tests__/math/experimentation/bayesian.test.ts src/math/experimentation/index.ts` — PASS
  - Ran: `pnpm --filter @acme/lib build` — PASS
  - Ran: `pnpm --filter @acme/lib lint` — PASS with 2 pre-existing warnings in `packages/lib/src/growth/__tests__/store.test.ts`
- **Documentation updated:** None required
- **Implementation notes:** Added Bayesian A/B module with Jeffreys-prior defaults, posterior updates, beta-credible intervals via inverse regularized incomplete beta, and seeded Monte Carlo superiority/lift estimates using Marsaglia-Tsang gamma sampling.

**Implementation notes**:
- Use `SeededRandom` for deterministic Monte Carlo tests.
- Keep Beta quantile calls for intervals only (two quantiles per posterior).

---

### ABT-06: Thompson sampling for multi-armed bandits

- **Type**: IMPLEMENT
- **Deliverable**: code-change + tests
- **Execution-Skill**: /lp-build
- **Confidence**: 84%
  - Implementation: 84% — reuses Beta sampling from ABT-05; selection logic is straightforward
  - Approach: 86% — Thompson sampling is the standard Bayesian bandit approach
  - Impact: 84% — additive module, no downstream dependents
- **Effort**: M (4-5 hours)
- **Depends on**: ABT-00, ABT-01, ABT-05
- **Blocks**: -
- **Affects**:
  - `packages/lib/src/math/experimentation/thompson-sampling.ts` [primary]
  - `packages/lib/__tests__/math/experimentation/thompson-sampling.test.ts` [primary]
  - `packages/lib/src/math/experimentation/bayesian.ts` [readonly]
  - `packages/lib/src/math/random/index.ts` [readonly]
  - `packages/lib/src/math/experimentation/index.ts` [primary — add export]
- **Scope**:
  - Implement `thompsonSampling(arms, options?)` for Beta-Bernoulli bandits.
  - Implement `thompsonSamplingSimulation(options)` for regret analysis.
  - Reuse Beta sampling from ABT-05 (Gamma-ratio method).
- **Acceptance**:
  1. Selection balances exploration and exploitation.
  2. Same seed yields deterministic sequences.
  3. Regret simulation converges toward the best arm.
- **Test contract:**
  - **TC-06-01:** Equal priors `Beta(1,1)` across 3 arms → each selected about 33% over 1000 trials
  - **TC-06-02:** Arms with posteriors `Beta(10,5)` vs `Beta(5,10)` → first arm selected >70% over repeated draws
  - **TC-06-03:** Simulation with true rates `[0.05, 0.08, 0.06]`, `10000` trials → best arm dominates by end
  - **TC-06-04:** Same seed reproduces identical selection sequence
  - **TC-06-05:** Test suite has >=12 tests for selection, regret, and determinism
  - **Acceptance coverage:** TC-06-01..02 cover criterion 1 (exploration/exploitation); TC-06-04 covers criterion 2 (determinism); TC-06-03 covers criterion 3 (convergence)
  - **Test type:** unit
  - **Test location:** `packages/lib/__tests__/math/experimentation/thompson-sampling.test.ts` (new)
  - **Run:** `npx jest --config jest.config.cjs --testPathPattern='experimentation/thompson-sampling'`

#### Build Completion (2026-02-13)
- **Status:** Complete
- **Commits:** pending
- **Execution cycle:**
  - Validation cases executed: TC-06-01, TC-06-02, TC-06-03, TC-06-04, TC-06-05
  - Cycles: 2 (implementation + lint ordering fix)
  - Initial validation: PASS tests; FAIL lint (`simple-import-sort`) in new test/barrel exports
  - Final validation: PASS
- **Confidence reassessment:**
  - Original: 84%
  - Post-validation: 84%
  - Delta reason: Determinism, exploration/exploitation balance, and convergence checks passed with expected thresholds.
- **Validation:**
  - Ran: `pnpm --filter @acme/lib test -- __tests__/math/experimentation/thompson-sampling.test.ts` — PASS (12/12)
  - Ran: `pnpm --filter @acme/lib test -- __tests__/math/experimentation/sample-size.test.ts __tests__/math/experimentation/hypothesis-tests.test.ts __tests__/math/experimentation/confidence-intervals.test.ts __tests__/math/experimentation/bayesian.test.ts __tests__/math/experimentation/thompson-sampling.test.ts` — PASS (68/68)
  - Ran: `pnpm --filter @acme/lib build` — PASS
  - Ran: `pnpm --filter @acme/lib lint` — PASS with 2 pre-existing warnings in `packages/lib/src/growth/__tests__/store.test.ts`
- **Documentation updated:** None required
- **Implementation notes:** Added seeded Thompson arm selection + simulation with posterior updates, cumulative regret/reward tracking, and strict input validation for bandit configuration.

---

### ABT-07A: Group-sequential testing (O'Brien-Fleming approximation)

- **Type**: IMPLEMENT
- **Deliverable**: code-change + tests
- **Execution-Skill**: /lp-build
- **Confidence**: 80%
  - Implementation: 80% — O'Brien-Fleming approximation formula is documented; boundary computation is straightforward
  - Approach: 85% — explicit approximation approach avoids complex spending function machinery
  - Impact: 80% — additive module, no downstream dependents; must clearly document limitations
- **Effort**: M (3-5 hours)
- **Depends on**: ABT-00, ABT-01, ABT-03
- **Blocks**: -
- **Affects**:
  - `packages/lib/src/math/experimentation/group-sequential.ts` [primary]
  - `packages/lib/__tests__/math/experimentation/group-sequential.test.ts` [primary]
  - `packages/lib/src/math/experimentation/internal/special-functions.ts` [readonly]
  - `packages/lib/src/math/experimentation/index.ts` [primary — add export]
- **Scope**:
  - Implement `groupSequentialTest(options)` using a documented classical O'Brien-Fleming approximation.
  - Options: `{ informationFractions, alpha, observedZ, alternative? }`
  - Return: `{ stopEarly, lookIndex, criticalValues, adjustedPValueApprox, method }`
  - Method contract: approximation formula is explicit in docs and tests.
- **Acceptance**:
  1. Critical boundaries are strict early and relax toward final look.
  2. API and docs clearly state this is an approximation, not full `gsDesign` equivalence.
- **Test contract:**
  - **TC-07A-01:** For `informationFractions=[0.5,0.75,1.0]`, `alpha=0.05` → two-sided boundaries approximately `[2.77, 2.26, 1.96]`
  - **TC-07A-02:** At look 1 (`t=0.5`), observed `z=3.5` → `stopEarly=true`
  - **TC-07A-03:** At look 1 (`t=0.5`), observed `z=2.5` → `stopEarly=false`
  - **TC-07A-04:** Boundaries are monotonically non-increasing across looks
  - **TC-07A-05:** Test suite has >=10 tests for boundaries and stopping logic
  - **Acceptance coverage:** TC-07A-01,04 cover criterion 1 (boundaries); TC-07A-02..03 cover stopping logic; TC-07A-01 method label covers criterion 2
  - **Test type:** unit
  - **Test location:** `packages/lib/__tests__/math/experimentation/group-sequential.test.ts` (new)
  - **Run:** `npx jest --config jest.config.cjs --testPathPattern='experimentation/group-sequential'`

#### Build Completion (2026-02-13)
- **Status:** Complete
- **Commits:** pending
- **Execution cycle:**
  - Validation cases executed: TC-07A-01, TC-07A-02, TC-07A-03, TC-07A-04, TC-07A-05
  - Cycles: 2 (implementation + one-sided expectation correction in tests)
  - Initial validation: FAIL tests (two incorrect one-sided expectations); Final validation: PASS
- **Confidence reassessment:**
  - Original: 80%
  - Post-validation: 80%
  - Delta reason: Boundary approximation and stopping semantics validated across two-sided and one-sided paths.
- **Validation:**
  - Ran: `pnpm --filter @acme/lib test -- __tests__/math/experimentation/group-sequential.test.ts` — PASS (12/12)
  - Ran: `pnpm --filter @acme/lib test -- __tests__/math/experimentation/sample-size.test.ts __tests__/math/experimentation/hypothesis-tests.test.ts __tests__/math/experimentation/confidence-intervals.test.ts __tests__/math/experimentation/bayesian.test.ts __tests__/math/experimentation/thompson-sampling.test.ts __tests__/math/experimentation/group-sequential.test.ts` — PASS (80/80)
  - Ran: `pnpm --filter @acme/lib build` — PASS
  - Ran: `pnpm --filter @acme/lib lint` — PASS with 2 pre-existing warnings in `packages/lib/src/growth/__tests__/store.test.ts`
- **Documentation updated:** None required
- **Implementation notes:** Added explicit O'Brien-Fleming approximation API with monotonic critical boundaries, deterministic stop logic at current look, and approximate adjusted p-value reporting.

---

### ABT-08: mSPRT variant specification (INVESTIGATE)

- **Type**: INVESTIGATE
- **Deliverable**: decision memo (appended to this plan)
- **Execution-Skill**: /lp-build
- **Confidence**: 88%
  - Implementation: 88% — literature review and specification document, well-scoped
  - Approach: 90% — clear deliverable (mathematical formulation document)
  - Impact: 90% — only affects ABT-09 and ABT-07B, no other dependencies
- **Effort**: S (2-3 hours)
- **Depends on**: -
- **Blocks**: ABT-09
- **Affects**:
  - `docs/plans/ab-testing-framework-plan.md` [primary — decision memo appended]
- **Scope**:
  - Review Johari et al. (2017) "Always Valid Inference" and identify the specific mSPRT variant suitable for binomial A/B tests.
  - Document the exact mathematical formulation: mixture prior specification, likelihood ratio computation, e-value/p-value conversion.
  - Specify the simulation harness requirements: what scenarios to simulate, how to measure type-I error, what tolerance is acceptable.
  - Identify any numerical stability concerns (log-space computation, extreme parameter ranges).
- **Acceptance**:
  1. Decision memo specifies the exact mSPRT formula and mixture prior for binomial data.
  2. Simulation validation requirements are enumerated with specific scenarios and pass/fail criteria.
  3. Numerical stability concerns are documented with mitigation strategies.
- **Exit criteria**: Decision memo is committed with formulas, simulation spec, and stability notes. ABT-09 scope is unambiguous.
- **Test contract:**
  - **TC-08-01:** Decision memo exists and specifies mSPRT formula → manual review
  - **TC-08-02:** Simulation scenarios are enumerated with pass/fail thresholds → manual review
  - **Test type:** review
  - **Test location:** `docs/plans/ab-testing-framework-plan.md` (decision memo section)
  - **Run:** Manual review of appended decision memo

---

### ABT-09: mSPRT simulation harness prototype (SPIKE)

- **Type**: SPIKE
- **Deliverable**: code-change + tests (prototype)
- **Execution-Skill**: /lp-build
- **Confidence**: 82%
  - Implementation: 82% — Monte Carlo simulation loop using SeededRandom is straightforward; the main risk is whether the chosen mSPRT variant achieves acceptable type-I control
  - Approach: 85% — simulation approach is standard (10k+ runs with SeededRandom)
  - Impact: 82% — prototype feeds into ABT-07B; establishes feasibility of the method
- **Effort**: S (2-3 hours)
- **Depends on**: ABT-00, ABT-01, ABT-05, ABT-08
- **Blocks**: ABT-07B
- **Affects**:
  - `packages/lib/src/math/experimentation/internal/msprt-spike.ts` [primary, temporary — promotes to production in ABT-07B]
  - `packages/lib/__tests__/math/experimentation/internal/msprt-spike.test.ts` [primary, temporary]
  - `packages/lib/src/math/experimentation/internal/special-functions.ts` [readonly]
  - `packages/lib/src/math/random/index.ts` [readonly]
- **Scope**:
  - Implement minimal mSPRT computation per ABT-08 specification.
  - Build simulation harness that runs N null-hypothesis experiments and measures empirical type-I error.
  - Run with >=10000 simulations under null (both arms equal) and verify type-I error <= 0.055 at alpha=0.05.
- **Acceptance**:
  1. mSPRT computation produces finite, non-NaN e-values for representative inputs.
  2. Null simulation with >=10000 runs yields empirical type-I error <= 0.055.
  3. Simulation is deterministic with fixed seed.
- **Exit criteria**: Simulation output shows type-I error <= 0.055 with 10k+ runs. If type-I error exceeds 0.06, the SPIKE fails and ABT-07B needs rescoping.
- **Test contract:**
  - **TC-09-01:** mSPRT e-value for equal arms (`50/1000` vs `50/1000`) → finite positive number
  - **TC-09-02:** Null simulation (10000 runs, alpha=0.05) → empirical type-I error <= 0.055
  - **TC-09-03:** Same seed produces identical simulation output
  - **Acceptance coverage:** TC-09-01 covers criterion 1; TC-09-02 covers criterion 2; TC-09-03 covers criterion 3
  - **Test type:** unit + integration
  - **Test location:** `packages/lib/__tests__/math/experimentation/internal/msprt-spike.test.ts` (new)
  - **Run:** `npx jest --config jest.config.cjs --testPathPattern='experimentation/internal/msprt-spike'`

---

### ABT-07B: Always-valid inference (mSPRT, phase 2)

- **Type**: IMPLEMENT
- **Deliverable**: code-change + tests
- **Execution-Skill**: /lp-build
- **Confidence**: 68% (→ 82% conditional on ABT-08, ABT-09)
  - Confidence cannot be promoted until precursor tasks complete and provide E2/E3 evidence
  - Implementation: 68% — mSPRT method not yet specified (ABT-08 resolves), simulation harness feasibility not yet proven (ABT-09 resolves)
  - Approach: 75% — approach depends on ABT-08 decision; simulation-gated release is sound
  - Impact: 70% — no downstream dependents, but must clearly document limitations and assumptions
- **Effort**: L (1-2 days)
- **Depends on**: ABT-00, ABT-01, ABT-05, ABT-08, ABT-09
- **Blocks**: -
- **Affects**:
  - `packages/lib/src/math/experimentation/always-valid-inference.ts` [primary]
  - `packages/lib/__tests__/math/experimentation/always-valid-inference.test.ts` [primary]
  - `packages/lib/src/math/experimentation/internal/special-functions.ts` [readonly]
  - `packages/lib/src/math/random/index.ts` [readonly]
  - `packages/lib/src/math/experimentation/index.ts` [primary — add export]
- **Scope**:
  - Implement `alwaysValidPValue(options)` with an explicitly documented mSPRT variant for binomial A/B tests.
  - Options include:
    - `{ controlSuccesses, controlTotal, treatmentSuccesses, treatmentTotal, alpha, alternative?, mixturePrior? }`
  - Return:
    - `{ pValue, eValue, canStop, method, assumptions }`
  - Add simulation harness to empirically validate type-I error and power behavior under repeated monitoring.
- **Acceptance**:
  1. Null-control simulations confirm empirical false positive rate near alpha under continuous monitoring.
  2. Alternative simulations confirm expected stop/power behavior.
  3. Method assumptions and limitations are explicit in JSDoc.
- **Test contract:**
  - **TC-07B-01:** Null simulation (>=10000 runs, alpha=0.05) → empirical type-I error <= 0.055
  - **TC-07B-02:** Effect simulation (`p_control=0.05`, `p_treatment=0.08`) → materially earlier stopping than fixed-horizon testing at comparable power
  - **TC-07B-03:** Deterministic simulation outputs with fixed seed
  - **TC-07B-04:** Test suite has >=12 tests including simulation checks (unit + bounded integration)
  - **Acceptance coverage:** TC-07B-01 covers criterion 1; TC-07B-02 covers criterion 2; TC-07B-03..04 cover reliability
  - **Test type:** unit + integration
  - **Test location:** `packages/lib/__tests__/math/experimentation/always-valid-inference.test.ts` (new)
  - **Run:** `npx jest --config jest.config.cjs --testPathPattern='experimentation/always-valid-inference'`

#### Re-plan Update (2026-02-13)
- **Previous confidence:** 68%
- **Updated confidence:** 68% (→ 82% conditional on ABT-08, ABT-09)
  - Confidence cannot be promoted until precursor tasks complete and provide E2/E3 evidence
- **Investigation performed:**
  - Reviewed plan scope: mSPRT requires specific variant selection (mixture prior, likelihood ratio formulation) and simulation-based error control
  - Identified two blocking unknowns: (1) which mSPRT variant to use for binomial data, (2) whether the chosen variant achieves acceptable type-I control under continuous monitoring
- **Precursor tasks created:**
  - ABT-08 (INVESTIGATE): mSPRT variant specification — resolves unknown #1
  - ABT-09 (SPIKE): mSPRT simulation harness prototype — resolves unknown #2
- **Dependencies updated:** Now depends on ABT-08, ABT-09 in addition to ABT-00, ABT-01, ABT-05

---

## Validation Strategy

1. **TC sanity sweep first:** lock formulas/methods before implementation tests.
2. **Cross-implementation checks:** compare key outputs with at least two references (R/scipy).
3. **Determinism:** all random procedures use seed-controlled RNG in tests.
4. **Edge-case robustness:** strict validation for counts, rates, confidence levels, and sample-size inputs.
5. **Performance checks:** benchmark typical paths (`N < 10000`) and confirm no quantile-in-loop hot paths for sampling.
6. **Sequential simulation gate:** ABT-07B requires empirical type-I checks before release (gated by ABT-09 SPIKE).

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Incorrect baseline TCs cause false confidence | High | Complete TC sanity sweep before coding and keep formula/method annotations adjacent to each TC |
| Special-function implementation errors in tails | High | Centralize in ABT-00; add dense grid and tail-focused tests against scipy/R |
| mSPRT method mis-specification or weak calibration | High | ABT-08 INVESTIGATE specifies variant; ABT-09 SPIKE validates calibration; ABT-07B only builds after both |
| API misuse for directional hypotheses | Medium | Use explicit `alternative` enum and avoid hidden alpha defaults |
| Performance regressions from expensive quantile sampling | Medium | Use Gamma-based Beta sampling and benchmark hot paths |

## What Would Make Confidence >=90%

1. ABT-00 passes dense numeric parity grids against R/scipy, including tail cases.
2. All TCs have source-linked formulas and verified expected numbers.
3. ABT-07B ships with stable simulation evidence for type-I and power across representative scenarios.
4. API review confirms clear semantics for `alternative`, `alpha`, and significance flags.
5. External statistics review signs off on method choices and assumptions.

## Integration Points

- **Existing modules:**
  - `statistics/descriptive.ts` for reusable summary statistics utilities.
  - `random/index.ts` (`SeededRandom`) for deterministic simulation.
  - `forecasting/prediction-intervals.ts` contains existing `normalQuantile()` (Abramowitz-Stegun 26.2.23) — ABT-00 will provide a higher-precision replacement.
- **Future consumers:**
  - `platform-core/src/pricing/experiments.ts`
  - `apps/brikette/src/lib/analytics/experiments.ts`
  - `apps/prime/src/lib/owner/experimentDashboard.ts`

## Success Metrics

- **Adoption:** At least 3 experiments use this module within 3 months.
- **Correctness:** Zero confirmed statistical-correctness bugs in first 6 months.
- **Performance:** Typical single-call paths complete in <10ms for common input sizes.
- **DX:** Call-site feedback confirms API clarity around alternatives and interval interpretation.

## Decision Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-02-13 | Split ABT-07B precursors into ABT-08 (INVESTIGATE) + ABT-09 (SPIKE) | mSPRT has two blocking unknowns: variant selection and type-I calibration. Sequential precursors resolve each before committing to full L-effort implementation. |
| 2026-02-13 | ABT-08 can run in Wave 1 (parallel with ABT-00, ABT-01) | INVESTIGATE task requires no code dependencies — literature review only. Enables early start on mSPRT specification while foundational code is built. |
| 2026-02-13 | Promote ABT-00 from 78% → 80% with E2 evidence | Existing `normalQuantile()` in prediction-intervals.ts:230-253 + 505 passing math tests prove numerical computation capability at the required level. |

## References

### Academic
- Brown, L. D., Cai, T. T., and DasGupta, A. (2001). Interval estimation for a binomial proportion.
- Newcombe, R. G. (1998). Interval estimation for the difference between independent proportions.
- Jennison, C., and Turnbull, B. W. (1999). Group sequential methods with applications to clinical trials.
- Johari, R., et al. (2017). Always valid inference: continuous monitoring of A/B tests.
- Russo, D., et al. (2018). A tutorial on Thompson sampling.

### Practical references
- R (`pwr`, `stats`, `gsDesign`) for parity checks.
- SciPy (`scipy.stats`) for parity checks.
- Evan Miller A/B calculators for sanity checks.

## Appendix: Formula Quick Reference

### Two-Proportion Sample Size
```
n = (z_alpha + z_beta)^2 * [p1(1-p1) + p2(1-p2)] / (p1 - p2)^2
```

### Two-Proportion Z-Test (pooled)
```
z = (p2 - p1) / sqrt(p_pool * (1 - p_pool) * (1/n1 + 1/n2))
p_pool = (x1 + x2) / (n1 + n2)
```

### Welch T-Test
```
t = (mean1 - mean2) / sqrt(s1^2/n1 + s2^2/n2)

df = (s1^2/n1 + s2^2/n2)^2 /
     [ (s1^2/n1)^2/(n1-1) + (s2^2/n2)^2/(n2-1) ]
```

### Wilson Score Interval
```
CI = [p_hat + z^2/(2n) +/- z * sqrt(p_hat(1-p_hat)/n + z^2/(4n^2))] / (1 + z^2/n)
```

### Newcombe-Wilson Difference Interval
```
Given Wilson intervals [l1, u1], [l2, u2]:
CI_diff = [l2 - u1, u2 - l1]
```

### Beta-Binomial Posterior
```
Prior: Beta(alpha, beta)
Posterior: Beta(alpha + successes, beta + failures)
```

### Beta Sampling via Gamma Ratio
```
X ~ Gamma(alpha, 1)
Y ~ Gamma(beta, 1)
X / (X + Y) ~ Beta(alpha, beta)
```

### O'Brien-Fleming Approximation Used in ABT-07A
```
z_k ~= z_(1-alpha/2) / sqrt(t_k)
```
