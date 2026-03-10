---
Type: Build-Record
Plan: startup-loop-naming-pipeline-science-upgrade
Completed: 2026-02-26
Commits: aa687022fa, 40c773f363, 7d2b43d2f2, 096b0b9ee9, 8323e8b24f
---

# Naming Pipeline Science Upgrade — Build Record

## What was delivered

The naming pipeline now operates with quantitative measurement infrastructure in place. Here is what was added, in plain terms:

**Domain checking is more reliable.** The pipeline retries automatically if the domain registry doesn't respond immediately. Failures are now labeled explicitly ("unknown — connection error") instead of appearing silently or inconsistently.

**Every candidate is logged as it moves through the pipeline.** Each name generates a record when it is created, checked for domain availability, shortlisted, or selected by the operator. This logging is silent — it doesn't change any output files the operator sees.

**A probability signal now runs alongside existing scores.** Trained on 1,523 naming round records from HEAD rounds 3–6 and HBAG round 3, this signal estimates how likely a name is to pass the existing shortlist criteria (domain available + score ≥ 18). Calibration: Brier score 0.159 (target < 0.35, PASS). This signal is advisory-only and does not affect which names appear in the shortlist.

**The pipeline recommends how many candidates to generate per round.** Based on historical domain availability (mean 46%), it recommends generating 17 candidates for a target of ≥5 shortlisted names at 95% confidence. This is advisory.

**An adaptive pattern allocator tracks which naming patterns produce available domains.** The allocator starts from a uniform prior and will update as live rounds produce data. Currently in advisory-only mode.

**Regression gates are in place.** If the candidate log format changes or the model's calibration degrades, tests will catch it automatically.

## Test summary

| Runtime | Tests | Result |
|---------|-------|--------|
| Python (naminglab) | 49 | All passed |
| TypeScript (scripts) | 23 | All passed |
| **Total** | **72** | **All passed** |

## Checkpoint outcome (TASK-07)

Shadow mode continues. The model passed its calibration gate but has not yet been evaluated on a live naming round. Gated pilot deferred until ≥2 live rounds with operator selections logged.

## Operator-facing outputs

- `docs/business-os/startup-loop/naming-pipeline-v2-operator-guide.user.md` — how to use the upgraded pipeline
- `docs/plans/startup-loop-naming-pipeline-science-upgrade/artifacts/pilot-readout.user.md` — baseline vs. post-upgrade metrics
- `docs/plans/startup-loop-naming-pipeline-science-upgrade/artifacts/shadow-calibration-report.md` — probability model calibration
- `docs/plans/startup-loop-naming-pipeline-science-upgrade/artifacts/controller-allocation-report.md` — round-size recommendations
- `docs/plans/startup-loop-naming-pipeline-science-upgrade/artifacts/checkpoint-decision.md` — gating decision record

## Observed Outcomes

- All 8 plan tasks delivered on the same day (2026-02-26)
- All acceptance criteria met across TASK-01 through TASK-08
- No existing naming artifacts or operator workflows were modified
- RDAP unknown-state handling confirmed with one real example (HEAD R6 "Collocata", ERROR 000)
- 1,523 proxy labels extracted from 5 historical naming rounds; model Brier 0.159 PASS
- Recommended N for K=5 at 95% confidence: 17 (based on 46.3% mean yield)
