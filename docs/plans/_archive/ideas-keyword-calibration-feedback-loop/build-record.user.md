---
Type: Build-Record
Status: Complete
Feature-Slug: ideas-keyword-calibration-feedback-loop
Build-date: 2026-03-04
artifact: build-record
---

# Build Record

## Build Summary

Added a keyword calibration feedback loop to the ideas dispatch routing system. The T1 semantic keyword matching was upgraded from binary (match/no-match) to weighted scoring that incorporates calibration priors computed from operator-confirmed dispatch outcomes. This creates a feedback path where routing accuracy improves over time as more dispatches are completed or skipped.

## Tasks Completed

| Task | Description | Commit |
|---|---|---|
| TASK-01 | Calibration script — reads artifact_delta dispatch outcomes, computes per-keyword effectiveness deltas, writes priors JSON | f8b3be4830 |
| TASK-02 | Weighted keyword matching — scoreT1Match() with base 0.75 + priors, T1_ROUTING_THRESHOLD=0.6 | 39d5925997 |
| TASK-03 | Tests (15 cases covering all TC contracts), SELF_TRIGGER_PROCESSES registration, package.json script | be008f7a37 |

## Key Deliverables

- `scripts/src/startup-loop/ideas/lp-do-ideas-keyword-calibrate.ts` — calibration script (340 lines)
- `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts` — modified with scoreT1Match(), loadKeywordPriors(), T1_ROUTING_THRESHOLD
- `scripts/src/startup-loop/__tests__/lp-do-ideas-keyword-calibrate.test.ts` — test suite (15 test cases)
- `scripts/package.json` — added `startup-loop:ideas-keyword-calibrate` script

## Outcome Contract

- **Why:** Static keyword list doesn't adapt to operator feedback. Dispatch outcomes (confirmed vs skipped) were not fed back to adjust routing weights.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Produce a deterministic calibration script that analyzes confirmed vs skipped dispatches and adjusts T1 semantic keyword weights, creating a feedback loop from dispatch outcomes to routing accuracy.
- **Source:** operator

## Validation Evidence

- Typecheck: clean across all 3 commits
- Lint: clean across all 3 commits
- Mode 2 data simulation: TASK-01 TC-01 through TC-07, TASK-02 TC-01 through TC-06 — all passed
- TASK-01 codex offload: exit 0
- Pre-commit hooks: all passed (lint-staged, agent-context validation)
