---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-04
Last-updated: 2026-03-04
Feature-Slug: reception-blind-mode-variance-measurement
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-blind-mode-variance-measurement/plan.md
Dispatch-ID: IDEA-DISPATCH-20260304201100-0990
Trigger-Source: dispatch-routed
Trigger-Why: The feature intent is bias reduction, but without a standing measurement loop the team cannot confirm impact or decide whether to iterate the workflow.
Trigger-Intended-Outcome: A reproducible weekly blind-mode variance report exists from Firebase discrepancy records, with baseline-vs-post-launch percent change and explicit threshold-based follow-up rules.
---

# Reception Blind-Mode Variance Measurement Fact-Find Brief

## Scope
### Summary
Blind till close mode is implemented, but the loop has no deterministic post-deployment KPI path to verify whether cash/keycard discrepancy variance improved. This fact-find defines the measurement contract needed to convert the shipped behavior into a measurable self-improvement loop.

### Goals
- Define one canonical variance KPI contract (formula, units, windows, exclusions).
- Define baseline and post-launch comparison windows from existing Firebase discrepancy records.
- Define deterministic extraction/reporting path (script or dashboard artifact) with weekly cadence.
- Define threshold-based follow-up rules when improvement is absent or regresses.

### Non-goals
- Re-implementing blind mode UX.
- Building a full BI platform.
- Changing cashier workflow permissions in this cycle.

## Outcome Contract
- **Why:** The feature intent is bias reduction, but without a standing measurement loop the team cannot confirm impact or decide whether to iterate the workflow.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** A reproducible weekly blind-mode variance report exists from Firebase discrepancy records, with baseline-vs-post-launch percent change and explicit threshold-based follow-up rules.
- **Source:** operator

## Evidence Audit (Current State)
- `docs/plans/_archive/reception-till-blind-mode/results-review.user.md` documents the measurement gap and explicitly suggests `create card`.
- `apps/reception/src/components/till/CloseShiftForm.tsx` contains role-aware blind-mode reveal behavior already shipped.
- `apps/reception/src/hooks/client/till/useTillShifts.ts` already interacts with discrepancy-related till data paths and is a likely extraction seam.
- Firebase discrepancy records already exist; no new standing intelligence source is required.

## Questions
- Which variance definition is canonical for this KPI (absolute variance, signed variance, or both)?
- Which date is the activation anchor for baseline/post windows in production?
- Should keycard and cash be tracked as separate KPIs or combined into one score?
- What weekly artifact path should be used as standing output (e.g., markdown report vs structured JSON)?

## Confidence Inputs
- Implementation: 86%
- Approach: 88%
- Impact: 90%
- Delivery-Readiness: 87%
- Testability: 85%

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| KPI definition drift across cycles | Medium | High | Lock one canonical formula in plan Task 1 and reference it in weekly output |
| Baseline window contamination | Medium | Medium | Use explicit activation date and fixed pre/post window lengths |
| Data-quality outliers (manual corrections) | Medium | Medium | Add exclusion rules and annotate outliers in weekly artifact |

## Planning Readiness
- Status: Ready-for-planning
- Recommended next step:
  - `/lp-do-plan` for `reception-blind-mode-variance-measurement`, with tasks for KPI contract, extraction path, weekly artifact generation, and threshold actions.
