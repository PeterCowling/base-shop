---
Type: Plan
Status: Proposed
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
Overall-confidence: 79%
Confidence-Method: min(Implementation,Approach,Impact) - validation contracts corrected, ABT-00 de-risks numerical foundations, and sequential testing split into approximation-first plus simulation-gated always-valid inference
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
| ABT-00 | IMPLEMENT | Special functions and distribution utilities (normal/t/beta/gamma/chi-square primitives) | 78% | M | Pending | - | ABT-02, ABT-03, ABT-04, ABT-05, ABT-07A, ABT-07B |
| ABT-01 | IMPLEMENT | Module scaffold and exports | 95% | XS | Pending | - | ABT-02, ABT-03, ABT-04, ABT-05, ABT-06, ABT-07A, ABT-07B |
| ABT-02 | IMPLEMENT | Sample-size calculator for two-proportion tests | 88% | S | Pending | ABT-00, ABT-01 | - |
| ABT-03 | IMPLEMENT | Frequentist significance tests (z-test, Welch t-test, chi-square GOF) | 86% | M | Pending | ABT-00, ABT-01 | ABT-07A |
| ABT-04 | IMPLEMENT | Confidence interval functions (proportion/mean/differences) | 88% | S | Pending | ABT-00, ABT-01 | - |
| ABT-05 | IMPLEMENT | Bayesian A/B testing (Beta-Binomial, credible intervals, superiority) | 83% | M | Pending | ABT-00, ABT-01 | ABT-06, ABT-07B |
| ABT-06 | IMPLEMENT | Thompson sampling and regret simulation for Beta-Bernoulli bandits | 84% | M | Pending | ABT-00, ABT-01, ABT-05 | - |
| ABT-07A | IMPLEMENT | Group-sequential testing using documented O'Brien-Fleming approximation | 80% | M | Pending | ABT-00, ABT-01, ABT-03 | - |
| ABT-07B | IMPLEMENT | Always-valid inference (mSPRT) with simulation-based error-control validation | 68% | L | Pending | ABT-00, ABT-01, ABT-05 | - |

## Tasks

### ABT-00: Special functions and distribution utilities

- **Type**: IMPLEMENT
- **Deliverable**: code-change + tests
- **Execution-Skill**: /lp-build
- **Confidence**: 78%
- **Effort**: M (4-6 hours)
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
  - Utility outputs match reference implementations across representative grids.
  - Tail behavior remains stable for high-confidence/tail p-values used by tests.
- **Validation contract (VC-00)**:
  - **VC-00-01**: `normalPpf(0.975)` ~= `1.9599639845` (abs err < 1e-6).
  - **VC-00-02**: `studentTCdf(2.045, 29)` ~= `0.975` (abs err < 1e-4).
  - **VC-00-03**: `chiSquareSf(10, 2)` ~= `0.006737947` (abs err < 1e-6).
  - **VC-00-04**: `logGamma(0.5)` ~= `0.5723649429` (abs err < 1e-8).
  - **VC-00-05**: Test suite has >=20 tests, including edge/tail cases.

---

### ABT-01: Module scaffold and exports

- **Type**: IMPLEMENT
- **Deliverable**: code-change
- **Execution-Skill**: /lp-build
- **Confidence**: 95%
- **Effort**: XS (30 min)
- **Scope**:
  - Create `packages/lib/src/math/experimentation/` directory.
  - Add `index.ts` module barrel with top-level JSDoc.
  - Export from `packages/lib/src/math/index.ts`.
  - Verify `@acme/lib` package export behavior remains valid.
- **Acceptance**:
  - Import from `@acme/lib/math/experimentation` typechecks.
  - Export style is consistent with existing math modules.
- **Validation contract (VC-01)**:
  - **VC-01-01**: `pnpm --filter @acme/lib typecheck` passes with experimentation import.
  - **VC-01-02**: Module header JSDoc includes at least 3 use-case examples.

---

### ABT-02: Sample-size calculator (two-proportion)

- **Type**: IMPLEMENT
- **Deliverable**: code-change + tests
- **Execution-Skill**: /lp-build
- **Confidence**: 88%
- **Effort**: S (2-3 hours)
- **Scope**:
  - Implement `sampleSizeForProportions(options)`.
  - Options: `{ baselineRate, minimumDetectableEffect, alpha, power, alternative? }`.
  - `alternative` defaults to `"two-sided"`; one-sided alternatives use `z_(1-alpha)`.
  - Return: `{ samplesPerVariant: number, totalSamples: number }`.
- **Acceptance**:
  - Results match textbook formula and reference software within tolerance.
  - Input validation is strict and actionable.
- **Validation contract (VC-02)**:
  - **VC-02-01**: Baseline `0.05`, treatment `0.06`, `alpha=0.05`, `power=0.8`, `alternative="two-sided"` -> `samplesPerVariant ~= 8155` (total ~= 16310, tolerance +/-2%).
  - **VC-02-02**: Same inputs with one-sided alternative -> `samplesPerVariant ~= 6424` (tolerance +/-2%).
  - **VC-02-03**: `minimumDetectableEffect = 0` -> throws `RangeError`.
  - **VC-02-04**: `alpha <= 0` or `alpha >= 1`, or `power <= 0` or `power >= 1` -> throws `RangeError`.
  - **VC-02-05**: Test suite has >=10 tests covering formulas, alternatives, and validation.

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
- **Effort**: M (4-5 hours)
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
  - P-values match reference tools within numerical tolerance.
  - Directional alternatives are explicit and tested.
  - API never assumes hidden alpha for significance flags.
- **Validation contract (VC-03)**:
  - **VC-03-01**: z-test with `50/1000` vs `65/1000` -> `z ~= 1.441`, two-sided `p ~= 0.1496`, one-sided (`greater`) `p ~= 0.0748`.
  - **VC-03-02**: Welch t-test with `mean1=100, stddev1=15, n1=30, mean2=104, stddev2=20, n2=35` -> `t ~= -0.919`, `df ~= 61.98`, two-sided `p ~= 0.361`.
  - **VC-03-03**: Chi-square GOF with `observed=[10,20,30]`, `expected=[20,20,20]` -> `chiSquare=10`, `df=2`, `p ~= 0.00674`.
  - **VC-03-04**: Chi-square with any expected count `<5` includes a warning entry in `warnings`.
  - **VC-03-05**: Test suite has >=18 tests across alternatives, alpha behavior, and validation.

**Implementation notes**:
- Build p-value computations on ABT-00 primitives.
- Avoid direct tail subtraction when survival-function variants are more stable.

---

### ABT-04: Confidence interval functions

- **Type**: IMPLEMENT
- **Deliverable**: code-change + tests
- **Execution-Skill**: /lp-build
- **Confidence**: 88%
- **Effort**: S (2-3 hours)
- **Scope**:
  - Implement `proportionConfidenceInterval(successes, total, confidenceLevel?)` using Wilson interval.
  - Implement `meanConfidenceInterval(mean, stddev, n, confidenceLevel?)` using Student-t critical value.
  - Implement `proportionDifferenceCI(s1, n1, s2, n2, confidenceLevel?)` using Newcombe-Wilson hybrid.
  - Implement `meanDifferenceCI(mean1, stddev1, n1, mean2, stddev2, n2, confidenceLevel?)` using Welch standard error and t critical value.
  - Return shape for all interval APIs:
    - `{ estimate: number, lower: number, upper: number, halfWidth: number }`
- **Acceptance**:
  - Wilson/Newcombe methods are used for proportion intervals.
  - Confidence-level validation is strict (`0 < level < 1`).
  - Asymmetric intervals remain representable by explicit lower/upper bounds.
- **Validation contract (VC-04)**:
  - **VC-04-01**: Wilson CI for `50/1000`, 95% -> approximately `[0.038, 0.065]`.
  - **VC-04-02**: Mean CI for `mean=100`, `stddev=15`, `n=30`, 95% -> approximately `[94.4, 105.6]`.
  - **VC-04-03**: Proportion difference CI for `(50/1000, 65/1000)`, 95% -> approximately `[-0.014, 0.044]`.
  - **VC-04-04**: `confidenceLevel <= 0` or `>= 1` throws `RangeError`.
  - **VC-04-05**: Test suite has >=14 tests including interval method checks and validation.

**References**:
- Brown, Cai, DasGupta (2001), Wilson coverage properties.
- Newcombe (1998), difference-in-proportions interval methods.

---

### ABT-05: Bayesian A/B testing (Beta-Binomial)

- **Type**: IMPLEMENT
- **Deliverable**: code-change + tests
- **Execution-Skill**: /lp-build
- **Confidence**: 83%
- **Effort**: M (4-5 hours)
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
  - Posterior update math is correct and deterministic with a seed.
  - Probability-of-superiority aligns with reference simulation.
  - Bayesian terminology is explicit in JSDoc.
- **Validation contract (VC-05)**:
  - **VC-05-01**: `50/1000` vs `65/1000` with Jeffreys prior -> `P(treatment > control) ~= 0.92-0.93`.
  - **VC-05-02**: Equal data (`50/1000` vs `50/1000`) -> `P(treatment > control)` near `0.50`.
  - **VC-05-03**: Strong prior `Beta(100,100)` with weak data (`5/10`, `6/10`) keeps posterior means near `0.5`.
  - **VC-05-04**: 95% credible interval for `95/1000` (Jeffreys prior) ~= `[0.078, 0.114]`.
  - **VC-05-05**: Test suite has >=12 tests across posterior updates, intervals, simulation, and seeding.

**Implementation notes**:
- Use `SeededRandom` for deterministic Monte Carlo tests.
- Keep Beta quantile calls for intervals only (two quantiles per posterior).

---

### ABT-06: Thompson sampling for multi-armed bandits

- **Type**: IMPLEMENT
- **Deliverable**: code-change + tests
- **Execution-Skill**: /lp-build
- **Confidence**: 84%
- **Effort**: M (4-5 hours)
- **Scope**:
  - Implement `thompsonSampling(arms, options?)` for Beta-Bernoulli bandits.
  - Implement `thompsonSamplingSimulation(options)` for regret analysis.
  - Reuse Beta sampling from ABT-05 (Gamma-ratio method).
- **Acceptance**:
  - Selection balances exploration and exploitation.
  - Same seed yields deterministic sequences.
  - Regret simulation converges toward the best arm.
- **Validation contract (VC-06)**:
  - **VC-06-01**: Equal priors `Beta(1,1)` across 3 arms -> each selected about 33% over 1000 trials.
  - **VC-06-02**: Arms with posteriors `Beta(10,5)` vs `Beta(5,10)` -> first arm selected >70% over repeated draws.
  - **VC-06-03**: Simulation with true rates `[0.05, 0.08, 0.06]`, `10000` trials -> best arm dominates by end.
  - **VC-06-04**: Same seed reproduces identical selection sequence.
  - **VC-06-05**: Test suite has >=12 tests for selection, regret, and determinism.

---

### ABT-07A: Group-sequential testing (O'Brien-Fleming approximation)

- **Type**: IMPLEMENT
- **Deliverable**: code-change + tests
- **Execution-Skill**: /lp-build
- **Confidence**: 80%
- **Effort**: M (3-5 hours)
- **Scope**:
  - Implement `groupSequentialTest(options)` using a documented classical O'Brien-Fleming approximation.
  - Options: `{ informationFractions, alpha, observedZ, alternative? }`
  - Return: `{ stopEarly, lookIndex, criticalValues, adjustedPValueApprox, method }`
  - Method contract: approximation formula is explicit in docs and tests.
- **Acceptance**:
  - Critical boundaries are strict early and relax toward final look.
  - API and docs clearly state this is an approximation, not full `gsDesign` equivalence.
- **Validation contract (VC-07A)**:
  - **VC-07A-01**: For `informationFractions=[0.5,0.75,1.0]`, `alpha=0.05`, two-sided boundaries are approximately `[2.77, 2.26, 1.96]`.
  - **VC-07A-02**: At look 1 (`t=0.5`), observed `z=3.5` -> `stopEarly=true`.
  - **VC-07A-03**: At look 1 (`t=0.5`), observed `z=2.5` -> `stopEarly=false`.
  - **VC-07A-04**: Boundaries are monotonically non-increasing across looks.
  - **VC-07A-05**: Test suite has >=10 tests for boundaries and stopping logic.

---

### ABT-07B: Always-valid inference (mSPRT, phase 2)

- **Type**: IMPLEMENT
- **Deliverable**: code-change + tests
- **Execution-Skill**: /lp-build
- **Confidence**: 68%
- **Effort**: L (1-2 days)
- **Scope**:
  - Implement `alwaysValidPValue(options)` with an explicitly documented mSPRT variant for binomial A/B tests.
  - Options include:
    - `{ controlSuccesses, controlTotal, treatmentSuccesses, treatmentTotal, alpha, alternative?, mixturePrior? }`
  - Return:
    - `{ pValue, eValue, canStop, method, assumptions }`
  - Add simulation harness to empirically validate type-I error and power behavior under repeated monitoring.
- **Acceptance**:
  - Null-control simulations confirm empirical false positive rate near alpha under continuous monitoring.
  - Alternative simulations confirm expected stop/power behavior.
  - Method assumptions and limitations are explicit in JSDoc.
- **Validation contract (VC-07B)**:
  - **VC-07B-01**: Null simulation (>=10000 runs, alpha=0.05) yields empirical type-I error <= 0.055.
  - **VC-07B-02**: Effect simulation (`p_control=0.05`, `p_treatment=0.08`) achieves materially earlier stopping than fixed-horizon testing at comparable power.
  - **VC-07B-03**: Deterministic simulation outputs with fixed seed.
  - **VC-07B-04**: Test suite has >=12 tests including simulation checks (unit + bounded integration).

---

## Validation Strategy

1. **VC sanity sweep first:** lock formulas/methods before implementation tests.
2. **Cross-implementation checks:** compare key outputs with at least two references (R/scipy).
3. **Determinism:** all random procedures use seed-controlled RNG in tests.
4. **Edge-case robustness:** strict validation for counts, rates, confidence levels, and sample-size inputs.
5. **Performance checks:** benchmark typical paths (`N < 10000`) and confirm no quantile-in-loop hot paths for sampling.
6. **Sequential simulation gate:** ABT-07B requires empirical type-I checks before release.

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Incorrect baseline VCs cause false confidence | High | Complete VC sanity sweep before coding and keep formula/method annotations adjacent to each VC |
| Special-function implementation errors in tails | High | Centralize in ABT-00; add dense grid and tail-focused tests against scipy/R |
| mSPRT method mis-specification or weak calibration | High | Keep ABT-07B separate, require simulation-based release gate |
| API misuse for directional hypotheses | Medium | Use explicit `alternative` enum and avoid hidden alpha defaults |
| Performance regressions from expensive quantile sampling | Medium | Use Gamma-based Beta sampling and benchmark hot paths |

## What Would Make Confidence >=90%

1. ABT-00 passes dense numeric parity grids against R/scipy, including tail cases.
2. All VCs have source-linked formulas and verified expected numbers.
3. ABT-07B ships with stable simulation evidence for type-I and power across representative scenarios.
4. API review confirms clear semantics for `alternative`, `alpha`, and significance flags.
5. External statistics review signs off on method choices and assumptions.

## Integration Points

- **Existing modules:**
  - `statistics/descriptive.ts` for reusable summary statistics utilities.
  - `random/index.ts` (`SeededRandom`) for deterministic simulation.
- **Future consumers:**
  - `platform-core/src/pricing/experiments.ts`
  - `apps/brikette/src/lib/analytics/experiments.ts`
  - `apps/prime/src/lib/owner/experimentDashboard.ts`

## Success Metrics

- **Adoption:** At least 3 experiments use this module within 3 months.
- **Correctness:** Zero confirmed statistical-correctness bugs in first 6 months.
- **Performance:** Typical single-call paths complete in <10ms for common input sizes.
- **DX:** Call-site feedback confirms API clarity around alternatives and interval interpretation.

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
