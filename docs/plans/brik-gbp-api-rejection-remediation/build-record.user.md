---
Type: Build-Record
Status: Partial — TASK-01 awaiting operator sign-off
Feature-Slug: brik-gbp-api-rejection-remediation
Completed-date: 2026-02-25
artifact: build-record
---

# Build Record: BRIK GBP API Rejection — Decision & Remediation

## Outcome Contract

- **Why:** Google rejected BRIK's GBP API access application (case #1-1062000040302, submitted 2026-02-23). Operator needed a documented decision on the API path and confirmation that the Octorate/Hotel Free Listing channel is not blocked.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Close the GBP API application track with a documented decision; establish manual GBP maintenance cadence; confirm Google Hotel Free Listing plan is unblocked.
- **Source:** operator

## What Was Built

**TASK-01 — Decision Memo (artifact complete; awaiting sign-off)**
Wrote `docs/plans/brik-gbp-api-rejection-remediation/task-01-decision-memo.md` — a formal closure document for the GBP API application track. The memo records the rejection event (case #1-1062000040302, 2026-02-25), presents the accept-manual-management verdict with four rationale points (ROI/~15 min saving, audience mismatch, opaque criteria, Hotel Free Listing independence), documents what the rejection does and does not affect (Hotel Free Listing path is entirely unaffected), sets next-step actions (Hotel Free Listing plan, monthly maintenance), includes a scale caveat for multi-property expansion, and provides ongoing monitoring notes for the description edit control and Hotel Center matching. An operator sign-off block is present and awaiting Peter Cowling's review.

**TASK-02 — Monthly Maintenance Checklist (complete)**
Wrote `docs/plans/brik-gbp-api-rejection-remediation/task-02-gbp-maintenance-cadence.md` — an operational reference document derived from the TASK-16 runbook. Covers all four maintenance areas (Photos, Q&A, Posts, Insights) each with an explicit access path/URL, acceptance condition, time estimate, and evidence format. Includes a Monthly Log table for ongoing tracking. Adds Probe A (description edit availability — monthly until resolved, with a June 2026 escalation trigger) and Probe B (Hotel Center property matching — one-time post-Octorate activation, with 48h check and escalation path to Octorate support).

## Tests Run

| Check | Result | Notes |
|---|---|---|
| Mode 3 Document Review — TASK-01 | Pass (attempt 1) | All required sections present; sign-off block present |
| Mode 3 Document Review — TASK-02 | Pass (attempt 1) | All 4 areas + 2 probes present; internal links valid |
| VC-03 self-review — TASK-02 | Pass | All 6 checks pass |

## Validation Evidence

### TASK-01
- VC-01 gate: artifact exists at `task-01-decision-memo.md`; all required sections present (verdict, rationale, scale caveat, Hotel Free Listing next action, sign-off block). **Awaiting operator completion of sign-off block (name + date) — deadline 2026-03-04.**

### TASK-02
- VC-03: 4 TASK-16 areas present, each with access path + acceptance condition + time estimate + evidence format ✅; description edit probe with monthly cadence and 3-month escalation ✅; Hotel Center matching probe with 48h check and Octorate escalation path ✅

## Scope Deviations

None. Both artifacts scoped to their task deliverables as defined in plan.md. Photo count threshold (≥25) is a maintenance heuristic derived from TASK-16 baseline (20 photos at time of audit + 10 uploaded = 30 total). Kept in range.

## Pending Before Plan Closure

1. **TASK-01 sign-off**: Peter Cowling must open `task-01-decision-memo.md` and fill the sign-off block (name + date). Deadline: 2026-03-04.
2. **VC-02 (plan-level downstream gate)**: `brikette-google-hotel-free-listing` plan.md must be created within 5 business days of TASK-01 sign-off. Run `/lp-do-plan brikette-google-hotel-free-listing` to start.
