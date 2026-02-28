---
Type: Plan
Status: Active
Domain: SEO / Distribution
Workstream: Sales / Operations
Created: 2026-02-25
Last-reviewed: 2026-02-25
Last-updated: 2026-02-25
Last-build: 2026-02-25
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brik-gbp-api-rejection-remediation
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: business-artifact
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 75%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort (S=1,M=2,L=3)
Auto-Build-Intent: plan+auto
Business-OS-Integration: off
---

# BRIK: GBP API Rejection — Decision & Remediation Plan

## Summary

Google rejected BRIK's Business Profile API application (2026-02-25, case #1-1062000040302). This plan formally closes the API track, documents the accept-manual-management verdict, and establishes the manual GBP maintenance cadence going forward. It does not change the Octorate → Google Hotel Free Listing activation path, which is unaffected and remains the highest-priority next local search action.

Two parallel deliverables: a signed decision memo and a monthly maintenance checklist.

## Active tasks

- [ ] TASK-01: Write and sign off decision memo (accept-manual verdict) — **Blocked: Awaiting operator sign-off**
- [x] TASK-02: Write manual GBP maintenance cadence checklist — **Complete (2026-02-25)**

## Goals

- Formally close the GBP API application track with a documented decision and operator sign-off
- Establish a repeatable monthly manual GBP maintenance process (derived from TASK-16 runbook)
- Confirm and record that the Google Hotel Free Listing plan (`brikette-google-hotel-free-listing`) should proceed as the next local search priority

## Non-goals

- GBP listing optimization (TASK-16 complete, 2026-02-23)
- Google Hotel Free Listing plan creation (separate plan; fact-find confirmed ready)
- Reapplication for GBP API access
- Any code changes to the Brikette website or Octorate integration

## Constraints & Assumptions

- Constraints:
  - GBP API access is controlled exclusively by Google; reapplication timeline and outcome are outside BRIK's control
  - No deployment or code changes in this plan — purely business artifact outputs
- Assumptions:
  - GBP listing remains live and verified (operator would have noticed any suspension)
  - Octorate Metasearch confirmed active as of 2026-02-18; no reason to expect lapse
  - `brikette-google-hotel-free-listing` fact-find remains valid (both blockers confirmed 2026-02-18)

## Inherited Outcome Contract

- **Why:** Google rejected BRIK's GBP API access application (case #1-1062000040302, submitted 2026-02-23). Operator needs a documented decision on the API path and confirmation that the Octorate/Hotel Free Listing channel is not blocked.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Close the GBP API application track with a documented decision; establish manual GBP maintenance cadence; confirm Google Hotel Free Listing plan is unblocked.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/brik-gbp-api-rejection-remediation/fact-find.md`
- Key findings used:
  - Business Profile API and Hotel Prices API are separate — rejection does not affect Octorate activation
  - Manual GBP management proven (TASK-16, ~30 min/session); API adds ~15 min/month savings — ROI doesn't justify reapplication
  - GBP API structurally designed for agencies/multi-location businesses (inferred); single-location hostel does not meet intended use case
  - Description edit control unavailable since 2026-02-23; likely temporary; monitor monthly
  - GBP profile quality (which triggered API rejection) could also affect Hotel Center property matching — monitor 48h after Octorate toggle activation

## Proposed Approach

- Option A: Accept manual-only GBP management; formally close the API track; document maintenance cadence; redirect to Hotel Free Listing.
- Option B: Remediate profile and website quality signals; reapply for API access.
- **Chosen approach: Option A.** ROI is the decisive factor — the API saves ~15 min/month for a single-location property. Remediation effort is unquantifiable (Google's eligibility criteria are not public) and success probability is low given the single-location use case mismatch. Option B is revisable if BRIK scales to multiple properties.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes (TASK-01 and TASK-02 are parallel; no dependency ordering required)
- Edge-case review complete: Yes
- Auto-build eligible: Yes (TASK-01 at 80%, no blocking dependencies)

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Decision memo — close API track, accept-manual verdict, sign-off | 80% | S | Blocked (Awaiting operator sign-off) | - | - |
| TASK-02 | IMPLEMENT | Manual GBP maintenance cadence checklist | 75% | S | Complete (2026-02-25) | - | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | - | Both independent; execute in parallel or sequentially in any order |

---

## Tasks

---

### TASK-01: Decision memo — close GBP API track, accept-manual verdict, operator sign-off

- **Type:** IMPLEMENT
- **Deliverable:** Decision memo artifact at `docs/plans/brik-gbp-api-rejection-remediation/task-01-decision-memo.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Blocked (Awaiting approval evidence — operator sign-off block in task-01-decision-memo.md must be filled)
- **Build evidence:** Artifact written 2026-02-25. Mode 3 document review: Pass (attempt 1). All required sections present. VC-01 gate: sign-off block present and awaiting Peter Cowling to fill name + date.
- **Artifact-Destination:** `docs/plans/brik-gbp-api-rejection-remediation/task-01-decision-memo.md`
- **Reviewer:** Peter Cowling
- **Approval-Evidence:** Operator sign-off block in artifact (name + date + verdict confirmation)
- **Measurement-Readiness:** None: decision memo is a one-time closure artifact; success is sign-off completion within 5 business days
- **Affects:** `docs/plans/brik-gbp-api-rejection-remediation/task-01-decision-memo.md` (new)
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 90% — all decision inputs are present in the fact-find; memo structure is clear; no unknowns remain that require investigation
  - Approach: 85% — standard decision closure memo format; all rationale is pre-resolved in fact-find Q&A
  - Impact: 80% — closes the API track cleanly and establishes the forward path; value is opportunity-cost recovery (redirecting to Hotel Free Listing). Held-back test: "what if operator disagrees with accept-manual verdict?" → operator annotates disagreement in the sign-off block; the memo presents the case with full rationale; operator override doesn't drop implementation below 80. No single unknown drops this below 80.
- **Acceptance:**
  - Memo includes: summary of rejection (case #, date), explicit accept-manual verdict, rationale for no reapplication (ROI argument + structural eligibility inference), scale caveat (revisit if multiple properties), and recommended next action (trigger `brikette-google-hotel-free-listing` plan)
  - Memo includes: brief note on Hotel Free Listing independence from API rejection
  - Operator sign-off block is present and filled (name + date)
  - VC-01 passes before task is marked Complete
- **Validation contract (VC-01):**
  - VC-01: Decision memo content complete and operator sign-off recorded → Pass rule: all required sections present (verdict, rationale, scale caveat, Hotel Free Listing next action); operator name and sign-off date filled in the artifact. Deadline: within 5 business days of memo creation (by 2026-03-04). Sample: single operator review.
- **Downstream trigger gate (plan-level, not TASK-01 completion gate):** `brikette-google-hotel-free-listing` plan creation triggered within 5 business days of TASK-01 sign-off → tracked in overall Acceptance Criteria (VC-02). TASK-01 is marked Complete on VC-01 pass alone.
- **Execution plan:** Red → Green → Refactor (VC-first)
  - Red evidence plan: Current state documented — rejection email received 2026-02-25; case #1-1062000040302 filed 2026-02-23; manual path confirmed working (TASK-16, 2026-02-23); fact-find analysis complete (fact-find.md, Status: Ready-for-planning)
  - Green evidence plan: Memo written with all required sections; operator reviews and fills sign-off block (VC-01 gate); Hotel Free Listing plan creation triggered (VC-02 gate)
  - Refactor evidence plan: None — this is a closure artifact; no iterative refinement expected post sign-off
- **Planning validation:** None: S task; all decision inputs confirmed in fact-find
- **Scouts:** Operator should verify Octorate Metasearch is still active before triggering Hotel Free Listing plan (sanity check: Menu > Metasearch in Octorate dashboard; last confirmed 2026-02-18)
- **Edge Cases & Hardening:**
  - If operator disagrees with accept-manual verdict: annotate in sign-off block with counter-rationale; this plan stops; a new fact-find for remediation + reapplication should be opened
  - If `brikette-google-hotel-free-listing/fact-find.md` blockers have lapsed (Octorate inactive, GBP unverified): re-confirm before triggering plan
- **What would make this ≥90%:** Operator pre-confirms agreement with accept-manual verdict before task execution (reduces sign-off round trip risk)
- **Rollout / rollback:**
  - Rollout: Artifact created; operator reviews asynchronously; sign-off block filled
  - Rollback: None — decision memo is a documentation artifact; if operator disagrees, open a new fact-find rather than reverting
- **Documentation impact:**
  - Creates `docs/plans/brik-gbp-api-rejection-remediation/task-01-decision-memo.md`
  - Recommended: add a note in `docs/plans/brikette-seo-traffic-growth/plan.md` Observability section clarifying that GBP Insights monitoring is manual-only (API track closed)

---

### TASK-02: Manual GBP maintenance cadence checklist

- **Type:** IMPLEMENT
- **Deliverable:** Monthly GBP maintenance checklist at `docs/plans/brik-gbp-api-rejection-remediation/task-02-gbp-maintenance-cadence.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-25)
- **Build evidence:** Artifact written 2026-02-25. Derived from TASK-16 runbook. Mode 3 document review: Pass (attempt 1). VC-03 self-review: all 6 checks pass (4 areas × access/condition/estimate/evidence + description probe + Hotel Center probe).
- **Artifact-Destination:** `docs/plans/brik-gbp-api-rejection-remediation/task-02-gbp-maintenance-cadence.md`
- **Reviewer:** Peter Cowling
- **Approval-Evidence:** None required beyond task completion review — this is an operational reference document, not a sign-off gate
- **Measurement-Readiness:** Monthly self-check — operator runs checklist each month; GBP Insights metrics captured in monitoring table (already in brikette-seo-traffic-growth/plan.md Observability section)
- **Affects:** `docs/plans/brik-gbp-api-rejection-remediation/task-02-gbp-maintenance-cadence.md` (new)
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 75%
  - Implementation: 90% — checklist is derived directly from TASK-16 runbook; structure and content are well-defined; no investigation required
  - Approach: 85% — monthly cadence confirmed appropriate for single-location GBP profile; TASK-16 demonstrated one session covers all areas
  - Impact: 75% — operational hygiene artifact; prevents profile quality degradation over time but does not drive direct conversion; capped by indirect nature of impact
- **Acceptance:**
  - Checklist covers all 4 areas from TASK-16: Photos (new uploads if needed), Q&A (unanswered questions), Posts (one update per month), Insights capture (views, searches, calls, directions, website clicks)
  - Each area has: access path (URL), acceptance condition, time estimate, and evidence format
  - Description edit control check included as a monthly probe (until resolved)
  - Hotel Center property matching check included as a one-time post-Octorate-activation probe
  - VC-03 passes before task is marked Complete
- **Validation contract (VC-03):**
  - VC-03: Maintenance checklist completeness → Pass rule: artifact covers all 4 TASK-16 areas with access path, acceptance condition, time estimate, and evidence format for each; description edit probe and Hotel Center matching probe included. Deadline: at task completion (same session). Sample: agent self-review at task completion; reviewer (Peter Cowling) may independently validate by checking artifact against acceptance criteria above.
- **Execution plan:** Red → Green → Refactor (VC-first)
  - Red evidence plan: TASK-16 runbook (`docs/plans/brikette-seo-traffic-growth/task-16-gbp-audit.md`) documents the full manual execution flow; TASK-16 Monitoring table captures the 4 Insights metrics; TASK-16 execution time (~30 min) establishes the session baseline
  - Green evidence plan: Checklist artifact written with all 4 areas, probes, and time estimates; VC-03 self-review passes
  - Refactor evidence plan: None — operational reference; update only if GBP UI changes materially
- **Planning validation:** None: S task; derived directly from TASK-16 runbook
- **Scouts:** None: checklist is purely derived from documented runbook; no probing needed
- **Edge Cases & Hardening:**
  - If GBP UI structure changes (Google updates the dashboard): checklist access paths may need updating; add a "UI version" note to the artifact header
  - If Hotel Center property matching fails after Octorate activation: add an investigation step to the checklist for that month only; escalate to Octorate support if unresolved after 72h
- **What would make this ≥90%:** First month of manual maintenance completed using the checklist, confirming all access paths work and time estimate is accurate
- **Rollout / rollback:**
  - Rollout: Artifact created; referenced from TASK-01 decision memo as the operational follow-on
  - Rollback: None — operational reference document; safe to iterate
- **Documentation impact:**
  - Creates `docs/plans/brik-gbp-api-rejection-remediation/task-02-gbp-maintenance-cadence.md`
  - Should be cross-referenced from `docs/plans/brikette-seo-traffic-growth/plan.md` Observability section (manual cadence pointer)

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Operator disagrees with accept-manual verdict | Low | Low — decision can be reversed with a new fact-find | TASK-01 memo includes clear rationale and sign-off block for operator to annotate disagreement |
| GBP profile quality flags cause Hotel Center property-match failure after Octorate activation | Low-Medium | High — would delay Hotel Free Listing appearance | TASK-02 checklist includes a one-time Hotel Center matching probe (48h post-Octorate toggle); escalation path to Octorate support documented |
| Description edit limitation persists >3 months | Low-Medium | Low | Monthly check in TASK-02 checklist; if unavailable by June 2026, investigate profile restriction cause |
| Hotel Free Listing plan not triggered after TASK-01 sign-off | Low | Medium — wastes the most important local search action | VC-02 explicitly checks for plan.md existence within 5 business days of sign-off |

## Observability

- Logging: None: documentation artifact plan; no instrumentation needed
- Metrics: GBP Insights monthly metrics already tracked in `docs/plans/brikette-seo-traffic-growth/plan.md` Observability section (views, searches, calls, directions, website clicks)
- Alerts/Dashboards: None: manual monthly review cadence is sufficient for a single-location property

## Acceptance Criteria (overall)

- [ ] TASK-01 decision memo written and operator sign-off recorded (VC-01)
- [ ] `brikette-google-hotel-free-listing` plan creation triggered within 5 business days of TASK-01 sign-off (VC-02)
- [ ] TASK-02 maintenance checklist covers all 4 TASK-16 areas with description edit probe and Hotel Center matching probe (VC-03)

## Decision Log

- 2026-02-25: Plan created from fact-find (brik-gbp-api-rejection-remediation/fact-find.md, Status: Ready-for-planning). Accept-manual verdict chosen over remediate-and-reapply. Key factor: ~15 min/month API time saving vs. unknown remediation cost; single-location use case mismatch with intended API audience.
- 2026-02-25: TASK-03 (Hotel Free Listing plan trigger) explicitly removed from plan scope per fact-find seed note ("not in this plan's scope"); captured as VC-02 at plan-level Acceptance Criteria (downstream trigger gate — not a TASK-01 completion gate).

## Overall-confidence Calculation

| Task | Type | Confidence | Effort | Weighted |
|---|---|---|---|---|
| TASK-01 | IMPLEMENT | 80% | S=1 | 80 |
| TASK-02 | IMPLEMENT | 75% | S=1 | 75 |
| **Total** | | | **2** | **155** |

**Overall-confidence = 155 / 2 = 77.5% → 75%** (downward bias rule applied; result between 75 and 80 rounds down)
