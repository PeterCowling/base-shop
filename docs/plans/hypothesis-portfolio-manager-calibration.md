---
Type: Reference
Status: Active
Domain: Platform
Last-reviewed: 2026-02-13
Relates-to charter: docs/business-os/business-os-charter.md
---

# Hypothesis Portfolio Calibration Report (HPM-05)

## Scope

Resolve the HPM-05 blockers before HPM-06/HPM-08:

1. normalization fallback policy for small-N and outlier-heavy cohorts,
2. EV-eligible domain defaults (`value_unit`, `value_horizon_days`),
3. mapping from portfolio composite to `/lp-prioritize` score range.

## Method

- Calibrated using deterministic synthetic datasets representative of expected early-stage business usage.
- Used nearest-rank quantiles for p10/p90 anchors.
- Applied the planned policy:
  - EV population excludes non-positive EV values from normalization.
  - `N >= 10`: winsorize at p10/p90, then min-max normalize to `[0,1]`.
  - `N < 10`: direct min-max normalization.
  - Flat distributions (`max == min`) use deterministic constant fallback.

## Dataset Results

## Dataset A — Early portfolio, small N

Input EV values:
- `[7100, 7100, 1400, -3800, 1400]`

Policy:
- positive EV population = `[7100, 7100, 1400, 1400]` (`N=4`, no winsorization).

Output:
- `ev_norm = [1, 1, 0, 0]`
- mapped `/lp-prioritize` normalized score = `[5, 5, 1, 1]`
- negative EV hypothesis blocked with `negative_ev`.

Decision:
- small-N fallback is sufficiently discriminative for MVP.

## Dataset B — Outlier-heavy portfolio

Input EV values:
- `[-2500, -800, -400, 100, 350, 500, 800, 1200, 1500, 1800, 2200, 2600, 3000, 9000, 42000]`

Policy:
- positive EV population size = `12` (`N>=10`, winsorized p10/p90).

Observed result:
- normalized values remained stable under extreme upper outlier (`42000`) after winsorization.
- mapped `/lp-prioritize` scores occupied bounded range with top decile clamped at 5.

Decision:
- keep winsorized p10/p90 nearest-rank policy for `N>=10`.

## Dataset C — Flat EV cohort

Input EV values:
- `[500, 500, 500, 500, 500]`

Output:
- `ev_norm = [1, 1, 1, 1, 1]`
- mapped `/lp-prioritize` score fallback = `[3, 3, 3, 3, 3]`

Decision:
- use neutral 3.0 mapping for flat distributions in `/lp-prioritize` bridge.

## Domain Calibration Decisions

- EV-eligible `value_unit` must satisfy:
  - prefix `USD_`,
  - not rate-like (`MRR`, `ARR`, `ARPU`, `RATE`, `PCT`, `PERCENT`),
  - integrated horizon value.
- Default portfolio domain remains explicit and required:
  - `default_value_unit`,
  - `default_value_horizon_days`.
- If defaults are absent and multiple EV-eligible domains exist:
  - hard fail with `portfolio_default_domain_required`.
- Per-record mismatches are blocked with:
  - `unit_horizon_mismatch`.

## `/lp-prioritize` Mapping Policy

- Input: portfolio composite score in `[0,1]`.
- Output: normalized score in `[1,5]`.
- Anchoring:
  - p10 -> 1,
  - p90 -> 5,
  - clamp outside anchor range.
- Fallbacks:
  - `N < 10`: map using small-N min-max.
  - flat population (`p10 == p90`): map all to neutral `3`.

## Recommended Defaults (v1)

- `ev_score_weight = 0.60`
- `time_score_weight = 0.25`
- `cost_score_weight = 0.15`
- `default_detection_window_days = 45`
- normalization:
  - `N>=10`: winsorized p10/p90 nearest-rank
  - `N<10`: min-max
  - flat distributions: deterministic neutral fallback

## Exit Criteria Check

- >=3 representative datasets analyzed: pass.
- explicit fallback policy for small-N and flat distributions: pass.
- explicit EV-domain and mismatch policy: pass.
- `/lp-prioritize` mapping policy documented with deterministic anchors: pass.

## Confidence Re-score for HPM-05

- Previous confidence: 74%
- Updated confidence: 82%
  - Implementation: 84%
  - Approach: 82%
  - Impact: 82%

Rationale:
- blockers are resolved with explicit, testable policy choices and dataset-backed behavior,
- residual risk remains in live operator adoption, not in mathematical policy ambiguity.

