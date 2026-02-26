---
Type: Checkpoint-Decision
Task: TASK-07
Plan: startup-loop-naming-pipeline-science-upgrade
Date: 2026-02-26
Decision: shadow-continue
Decided-by: lp-do-build (automated checkpoint)
---

# TASK-07 Horizon Checkpoint — Shadow-to-Gated Readiness Review

## Decision

**REMAIN IN SHADOW MODE.** The pipeline is not ready for a gated pilot.

All model outputs remain advisory-only. The `NAMING_SHADOW_SCORE` and `NAMING_ADAPTIVE_ALLOC` execution switches must not be promoted to gating-active without a second checkpoint after the conditions below are met.

## Evidence Review

### Calibration (from shadow-calibration-report.md)

| Metric | Value | Gate | Result |
|--------|-------|------|--------|
| Brier score (in-sample) | 0.1589 | < 0.35 | PASS |
| CV Brier (5-fold) | 0.219 ± 0.077 | informational | — |
| Reliability alignment | good (all 5 bins within 0.05) | — | — |
| Training samples | 1,523 (631 positive, 892 negative) | — | — |

Calibration passes the pre-committed threshold. However, all 1,523 training samples use **proxy labels** (`viable = RDAP_available AND score ≥ 18`) derived from existing artifacts — not live sidecar events or real operator selections. The model has never been evaluated on an out-of-sample live naming round.

### Replay and CI gates (from TASK-06)

| Gate | Status |
|------|--------|
| Schema CI gate (schema_ci_gate) | Operational |
| Calibration CI gate (calibration_ci_gate, threshold 0.35) | Operational |
| Legacy parity gate (legacy_parity_gate) | Operational |
| Replay harness (replay_sidecar_file) | Operational |

All gates are implemented and tested (49/49 tests passing). No live sidecar data exists yet to run through the replay harness — the gates are confirmed functional but untested on production data.

### Controller advisory outputs (from controller-allocation-report.md)

| Advisory output | Value |
|-----------------|-------|
| Recommended N for K=5, 95% confidence | 17 (based on 46.3% mean yield) |
| Recommended N for K=10, 95% confidence | 31 |
| PatternBandit state | Uniform Beta(2,2) — no live round adaptation yet |

The yield planner and bandit are advisory-only. Pattern-level RDAP data does not yet exist in a structured form suitable for posterior updates.

## Horizon Assumptions — Assessment

### Assumption 1: Calibration stability is sufficient for any gated trial
**NOT MET.** Calibration passes the in-sample gate but:
- Training used proxy labels, not real human viability selections
- CV variance (±0.077) shows the model is sensitive to which rounds are in/out of sample
- Zero live sidecar rounds have been observed — out-of-sample performance is unknown
- A single anomalous round (like HEAD R5 with 15.2% yield) could shift calibration significantly

### Assumption 2: Operator workflow impact is acceptable
**MET.** All changes are additive. No existing naming artifacts, markdown outputs, or operator-facing workflows were modified by any TASK-01 through TASK-06 deliverable.

## Why Shadow Continues (not a gated pilot)

The model needs to earn its gating rights through live operation:
1. It was built without observing a single real naming round's sidecar events
2. Operator shortlist selections have never been logged — true viability labels are absent
3. The PatternBandit has made zero posterior updates from real outcomes

These are not implementation failures — they are the expected state after building infrastructure for a process that hasn't run through the new tooling yet. The tooling is correct. The data isn't there yet.

## Conditions for Next Checkpoint

A second checkpoint may be called when ALL of the following are met:

1. **≥2 live naming rounds** have completed with sidecar events written to `docs/business-os/strategy/<BIZ>/naming-sidecars/`
2. **Operator selections** have been logged as `finalist` sidecar events in at least one round
3. **Replay harness** has been run against live sidecar data and produced a deterministic summary with zero invalid events
4. **Out-of-sample calibration**: the model has been retrained on rounds 1–N and evaluated on round N+1; Brier score remains < 0.30 (tighter threshold for gated trial)
5. **Pattern bandit** has completed ≥1 posterior update from live RDAP data

## Downstream Rollout Scope (TASK-08)

TASK-08 (operator rollout pack) is authorized to proceed. The guide must clearly state:
- Model outputs are **advisory-only** — they annotate shortlists but do not gate names
- The yield planner recommendation (recommended N ≈ 17–35) is an input for human planning
- Gated pilot requires the second checkpoint above

## Decision Log Entry

- 2026-02-26: TASK-07 CHECKPOINT — shadow-continue. Calibration PASS (Brier 0.159) but proxy-only training; no live rounds. TASK-08 authorized to proceed with advisory framing.
