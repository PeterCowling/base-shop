---
Type: Reference
Status: Active
Domain: Platform
Last-reviewed: 2026-02-13
Relates-to charter: none
---

# Advanced Similarity Metrics NMI Calibration (ASM-05)

## Scope

Resolve ASM-05 blockers before ASM-08 implementation:

1. canonical normalization formula for NMI,
2. default binning policy for continuous heavy-tail inputs,
3. deterministic fixture/threshold contract for test implementation.

## Candidate Policy Evaluation

Compared three symmetric normalization variants on deterministic fixtures:

- `sqrt`: `MI / sqrt(H(X) * H(Y))`
- `avg`: `2 * MI / (H(X) + H(Y))`
- `max`: `MI / max(H(X), H(Y))`

Reference behavior on many-to-one mapping fixture (`X` has higher entropy than `Y`):

- `sqrt`: `0.7469`
- `avg`: `0.7162`
- `max`: `0.5579`

Decision:
- Use `sqrt` as canonical normalization.
- Rationale: symmetric, bounded in `[0,1]` for the chosen contracts, and less over-penalizing on many-to-one dependence than `max`.

## Binning Calibration

Heavy-tail probe used deterministic exponential-shape data with periodic outliers.
Compared equal-width vs quantile binning for stability under outlier injection.

Observed NMI deltas (`|base - outlier|`) by bin count:

- 8 bins: equal-width `0.9228`, quantile `0.1317`
- 12 bins: equal-width `0.6506`, quantile `0.1411`
- 16 bins: equal-width `0.5882`, quantile `0.1405`

Decision:
- Default continuous binning strategy: `quantile`.
- Keep `equalWidth` available as explicit override.
- Rationale: quantile mode is materially more stable under heavy-tail/outlier conditions while remaining deterministic.

## Canonical API Contract (for ASM-08)

Implement two explicit entry points:

- `normalizedMutualInformationDiscrete(xs, ys, options?)`
- `normalizedMutualInformationBinned(xs, ys, options?)`

Defaults:

- Normalization: `sqrt` (fixed).
- Binned strategy default: `quantile`.
- Default bin count: `clamp(round(sqrt(n)), 4, 16)`.

Input semantics:

- `discrete`: finite scalar labels (`string | number | boolean`) treated as categories.
- `binned`: finite numeric arrays only.
- Length mismatch or fewer than 2 rows: follow shared similarity validation policy.
- Non-finite values: follow shared similarity validation policy.

Edge-case semantics:

- If both entropies are ~0 (`H(X) <= eps && H(Y) <= eps`), return `1` only when both arrays are constant; otherwise return `0`.
- If only one entropy is ~0, return `0`.
- Always clamp numerical noise outside `[0,1]` back into range.

## Fixture Contract for ASM-08 Tests

Adopt deterministic fixtures and thresholds:

1. Independent discrete fixture:
   - Expected NMI: `<= 0.20`
2. Bijective mapping fixture:
   - Expected NMI: `>= 0.99`
3. Many-to-one mapping fixture:
   - Expected NMI: `>= 0.65` and `< 0.95`
4. Heavy-tail continuous fixture:
   - Both `quantile` and `equalWidth` must be deterministic (stable reruns)
   - Quantile mode should preserve higher dependence signal than equal-width in outlier stress fixture
5. Invalid input fixtures:
   - Must follow shared strict/non-strict validation policy used by similarity module.

## Exit Criteria Check

- Canonical normalization contract fixed: pass.
- Default binning strategy fixed with stability evidence: pass.
- Deterministic fixture/threshold contract for ASM-08 defined: pass.

## Confidence Re-score (ASM-05)

- Previous confidence: 76%
- Updated confidence: 84%
  - Implementation: 85%
  - Approach: 84%
  - Impact: 84%

Rationale:
- calibration removed the main API ambiguity (normalization and binning defaults),
- remaining risk is implementation correctness, not contract uncertainty.
