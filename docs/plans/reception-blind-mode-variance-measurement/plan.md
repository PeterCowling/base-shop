---
Type: Plan
Status: Complete
Domain: Platform
Workstream: Engineering
Created: 2026-03-04
Last-reviewed: 2026-03-04
Last-updated: 2026-03-04
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-blind-mode-variance-measurement
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Dispatch-ID: IDEA-DISPATCH-20260304201100-0990
Overall-confidence: 84%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception Blind-Mode Variance Measurement Plan

## Summary
Implement a deterministic post-deployment measurement loop for Reception blind till close mode using existing Firebase discrepancy records. The outcome is a weekly artifact reporting baseline-vs-post-launch variance change with explicit threshold actions.

## Active tasks
- [x] TASK-01: Define KPI and measurement contract
- [x] TASK-02: Implement extraction and weekly artifact generation
- [x] TASK-03: Wire review cadence and threshold-based actions
- [x] TASK-04: Validate output correctness and operational readiness

## Goals
- Measure whether blind mode reduced discrepancy variance after deployment.
- Produce repeatable weekly output from existing Firebase data.
- Make follow-up actions deterministic when improvement is absent or regressing.

## Non-goals
- Reworking blind mode UX.
- Replacing Firebase data structures in this cycle.
- Full BI/dashboard platform work.

## Outcome Contract
- **Why:** The feature intent is bias reduction, but without a standing measurement loop the team cannot confirm impact or decide whether to iterate the workflow.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** A reproducible weekly blind-mode variance report exists from Firebase discrepancy records, with baseline-vs-post-launch percent change and explicit threshold-based follow-up rules.
- **Source:** operator

## Fact-Find Reference
- `docs/plans/reception-blind-mode-variance-measurement/fact-find.md`
- `docs/plans/reception-blind-mode-variance-measurement/dispatch.v2.json`

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | KPI contract (formula, windows, exclusions, baseline anchor) | 88% | S | Complete (2026-03-04) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Extraction path + weekly report artifact generation | 84% | M | Complete (2026-03-04) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Weekly review cadence + threshold action contract | 82% | S | Complete (2026-03-04) | TASK-02 | TASK-04 |
| TASK-04 | CHECKPOINT | Validate report accuracy and readiness for recurring use | 86% | S | Complete (2026-03-04) | TASK-03 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Lock semantics first to avoid rework |
| 2 | TASK-02 | TASK-01 | Build extraction/reporting against frozen contract |
| 3 | TASK-03 | TASK-02 | Define operational consumption once artifact exists |
| 4 | TASK-04 | TASK-03 | Final verification and go-forward confirmation |

## Tasks

### TASK-01: Define KPI and Measurement Contract
- **Type:** IMPLEMENT
- **Deliverable:** Contract document section in-repo covering KPI formula, baseline/post windows, date anchor, outlier/exclusion rules, and segmentation policy.
- **Acceptance:**
  - Single canonical variance formula documented.
  - Baseline and post-launch windows explicitly specified with activation anchor.
  - Rules for missing days/outliers/manual corrections documented.
  - Cash and keycard treatment (separate vs combined) explicitly decided.
- **Status:** Complete (2026-03-04)
- **Evidence:** `docs/plans/reception-blind-mode-variance-measurement/task-01-kpi-contract.md`

### TASK-02: Implement Extraction and Weekly Artifact Generation
- **Type:** IMPLEMENT
- **Deliverable:** Deterministic script/query path that reads Firebase discrepancy records and writes a weekly artifact (markdown or JSON+markdown).
- **Acceptance:**
  - Running the extractor twice over same inputs yields identical output.
  - Artifact includes baseline value, post-window value, and percent change.
  - Artifact path and naming are stable and documented.
  - Error paths for empty/missing data are explicit and non-silent.
- **Status:** Complete (2026-03-04)
- **Evidence:**
  - `scripts/src/reception/blind-mode-variance-report.ts`
  - `scripts/package.json` script `reception:blind-mode-variance-report`
  - `docs/plans/reception-blind-mode-variance-measurement/artifacts/task-02-validation.md`

### TASK-03: Wire Review Cadence and Threshold-Based Actions
- **Type:** IMPLEMENT
- **Deliverable:** Operational runbook section defining weekly review owner, cadence, and action thresholds.
- **Acceptance:**
  - Weekly cadence and owner defined.
  - At least two threshold actions defined (no improvement / regression).
  - Link from report artifact to next-action route (`lp-do-fact-find` or direct fix) documented.
- **Status:** Complete (2026-03-04)
- **Evidence:** `docs/plans/reception-blind-mode-variance-measurement/task-03-review-cadence.md`

### TASK-04: Validate Output Correctness and Operational Readiness
- **Type:** CHECKPOINT
- **Deliverable:** Validation note confirming first full run, correctness spot-check, and readiness to continue weekly.
- **Acceptance:**
  - One full weekly run completed with saved artifact.
  - Spot-check confirms reported values match source records.
  - Known limitations and next hardening items recorded.
- **Status:** Complete (2026-03-04)
- **Evidence:** `docs/plans/reception-blind-mode-variance-measurement/task-04-checkpoint.md`

## Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| KPI definition ambiguity causes churn | Medium | High | Freeze formula in TASK-01 before any implementation |
| Baseline window polluted by rollout period | Medium | Medium | Use explicit activation date and fixed windows |
| Data quality anomalies distort trend | Medium | Medium | Add exclusion/outlier policy and annotate anomalies |
| Report not consumed operationally | Medium | High | TASK-03 makes cadence/owner/action contract mandatory |

## What would make this >=90%
- Confirm exact production activation date for blind-mode behavior.
- Verify discrepancy field-level schema in Firebase with one sampled week.
- Complete first full extraction dry-run and reconcile output against raw records.

## Validation Gate (Execution)
- Scoped checks only for touched package(s):
  - `pnpm --filter reception typecheck`
  - `pnpm --filter reception lint`
- Policy gate:
  - `bash scripts/validate-changes.sh`

## Completion Criteria
- All tasks marked complete.
- Weekly artifact generation path is running deterministically.
- Threshold-based action loop is documented and actionable.
- Results-review can mark intended outcome as measurable with live evidence.
