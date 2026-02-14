---
Type: Plan
Status: Active
Domain: Venture-Studio
Workstream: Mixed
Created: 2026-02-13
Last-updated: 2026-02-14
Last-reviewed: 2026-02-14
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brik-ga4-baseline-lock
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: startup-weekly-kpcs-memo
Execution-Track: mixed
Primary-Execution-Skill: /lp-build
Supporting-Skills: /lp-sequence
Overall-confidence: 81%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort (S=1, M=2, L=3)
Business-OS-Integration: off
Business-Unit: BRIK
Card-ID:
Audit-Ref: working-tree
Audit-Date: 2026-02-14
---

# BRIK GA4 Event Verification + 7-Day Baseline Lock Plan

## Summary
This plan operationalizes the highest-priority BRIK P1 item from the startup-loop scorecard: confirm event-level telemetry truth (`web_vitals`, `begin_checkout`) and persist the first measured 7-day KPI baseline into canonical strategy docs. The work is documentation and decision-signal hardening, not instrumentation redesign. Completion of this plan raises confidence for S10 weekly decisions and for the day-14 forecast recalibration.

## Goals
- Capture decision-grade evidence that `web_vitals` and `begin_checkout` are visible in GA4.
- Lock first 7-day measured KPI baseline in `docs/business-os/strategy/BRIK/plan.user.md`.
- Update workflow and weekly decision artifacts to reference the now-active execution route.

## Non-goals
- New GA4 instrumentation architecture work.
- New growth experiment design.
- Full day-14 forecast recalibration execution.

## Constraints & Assumptions
- Constraints:
  - S2A measurement closure must be evidence-backed.
  - Baseline table must be date-bounded and source-cited.
  - Workflow updates must preserve existing stage-table schema.
- Assumptions:
  - Existing code-level instrumentation remains valid based on passing tests.

## Fact-Find Reference
- Related brief: `docs/plans/brik-ga4-baseline-lock/fact-find.md`
- Key findings:
  - `begin_checkout` instrumentation is active and test-verified in both booking surfaces.
  - `web_vitals` emitter path exists but lacks direct unit test coverage.
  - GA4 Data API probe currently fails with `SERVICE_DISABLED`, so operator UI verification remains mandatory until access is enabled.

## Existing System Notes
- Key modules/files:
  - `apps/brikette/src/app/[lang]/book/BookPageContent.tsx` - room booking `begin_checkout` emit.
  - `apps/brikette/src/performance/reportWebVitals.ts` - `web_vitals` emit path.
  - `docs/business-os/strategy/BRIK/2026-02-13-measurement-verification.user.md` - verification evidence anchor.
  - `docs/business-os/strategy/BRIK/plan.user.md` - canonical baseline destination.
  - `docs/business-os/startup-loop-workflow.user.md` - open-task and stage-gap tracking.
- Patterns to follow:
  - Date-stamped, evidence-linked `.user.md` documentation.
  - Explicit missing/gap language instead of implicit assumptions.

## Proposed Approach
- Option A: Keep waiting for ad-hoc manual checks and defer baseline lock.
  - Trade-off: fastest now, but maintains decision-quality gap.
- Option B: Create explicit verification/baseline execution packet and track it as active routed work.
  - Trade-off: slightly more process work, but removes ambiguity and strengthens weekly decisions.
- Chosen: Option B, because it closes the highest-impact measurement truth gap without introducing technical debt.

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Capture event-level verification evidence (`web_vitals`, `begin_checkout`) in measurement note, including Data API blocker evidence and/or UI proof | 81% | M | Complete (2026-02-13) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Persist first 7-day measured KPI baseline in canonical BRIK plan metrics section | 82% | S | Complete (2026-02-13) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Update weekly decision + workflow state rows to reflect active routed execution and baseline status | 84% | S | Complete (2026-02-13) | TASK-01 | - |
| TASK-04 | INVESTIGATE | Add direct test coverage plan for `reportWebVitals.ts` to raise testability confidence | 76% ⚠️ | S | Pending | - | - |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-03, TASK-04 | - | Verification logging, routing status sync, and testability investigation can run in parallel |
| 2 | TASK-02 | TASK-01 | Baseline lock requires verification evidence |

**Max parallelism:** 3 | **Critical path:** 2 waves | **Total tasks:** 4

## Active tasks

- TASK-04: Add direct test coverage plan for `reportWebVitals.ts` to raise testability confidence (INVESTIGATE; Pending; 76%)

## Tasks

### TASK-01: Capture event-level verification evidence (`web_vitals`, `begin_checkout`) in measurement note
- **Type:** IMPLEMENT
- **Deliverable:** multi-deliverable update to measurement verification artifact with explicit pass/fail evidence and blockers.
- **Startup-Deliverable-Alias:** startup-weekly-kpcs-memo
- **Execution-Skill:** /lp-build
- **Artifact-Destination:** `docs/business-os/strategy/BRIK/2026-02-13-measurement-verification.user.md`
- **Reviewer:** Pete
- **Approval-Evidence:** section entry in `docs/business-os/strategy/BRIK/2026-02-13-measurement-verification.user.md` with dated sign-off line
- **Measurement-Readiness:** owner=Pete; cadence=weekly; tracking=`docs/business-os/strategy/BRIK/plan.user.md` metrics + weekly decision memo
- **Affects:** `docs/business-os/strategy/BRIK/2026-02-13-measurement-verification.user.md`, `[readonly] docs/business-os/strategy/BRIK/2026-02-12-ga4-search-console-setup-note.user.md`, `[readonly] apps/brikette/src/app/[lang]/book/BookPageContent.tsx`, `[readonly] apps/brikette/src/performance/reportWebVitals.ts`
- **Depends on:** -
- **Blocks:** TASK-02
- **Status:** Complete (2026-02-13)
- **Confidence:** 81%
  - Implementation: 84% - evidence path and target artifact are explicit.
  - Approach: 81% - closes the highest-priority signal-quality gap first.
  - Impact: 81% - impacts decision docs, not production runtime behavior.
- **Acceptance:**
  - Measurement note includes a dated subsection for event-level verification status of `web_vitals` and `begin_checkout`.
  - Measurement note records GA4 Data API `SERVICE_DISABLED` blocker and required enablement path.
  - Measurement note states whether verification is complete or pending with explicit next action owner.
- **Validation contract:**
  - VC-01: Verification record quality -> both target events have explicit status (`verified` or `pending`) with dated evidence source.
  - VC-02: Blocker diagnostic quality -> Data API failure reason and activation URL are captured when API query fails.
  - VC-03: Reviewer acknowledgement -> named owner sign-off line is present in artifact.
  - VC-04: Measurement readiness -> next cadence checkpoint and destination doc are specified.
  - **Acceptance coverage:** VC-01 covers event status; VC-02 covers blocker evidence; VC-03 covers approval; VC-04 covers operational follow-through.
  - **Validation type:** review checklist + evidence logging
  - **Validation location/evidence:** `docs/business-os/strategy/BRIK/2026-02-13-measurement-verification.user.md`
  - **Run/verify:** artifact review against VC checklist
- **Execution plan:** Red -> Green -> Refactor
  - **Red evidence:** GA4 Data API runReport returned `403 SERVICE_DISABLED` for `analyticsdata.googleapis.com` (2026-02-13).
  - **Green evidence:** measurement note updated with explicit event statuses and blocker/owner details.
  - **Refactor evidence:** language normalized for consistent weekly reuse.
- **Scouts:**
  - Data API readiness assumption -> probed via service account runReport -> disproved (service disabled).
- **Planning validation:**
  - Checks run: `pnpm --filter brikette test -- apps/brikette/src/test/components/ga4-08-book-checkout-payload.test.tsx --maxWorkers=2` (pass), `pnpm --filter brikette test -- apps/brikette/src/test/components/ga4-07-apartment-checkout.test.tsx --maxWorkers=2` (pass).
  - Validation artifacts written: none in planning phase.
  - Unexpected findings: GA4 Data API disabled for service-account project.
- **What would make this >=90%:** successful GA4 UI or Data API evidence for both target events.
- **Rollout / rollback:**
  - Rollout: documentation update only.
  - Rollback: revert measurement note section if evidence is invalid.
- **Documentation impact:**
  - Update `docs/business-os/strategy/BRIK/2026-02-13-measurement-verification.user.md`.
- **Notes / references:**
  - `docs/plans/brik-ga4-baseline-lock/fact-find.md`

### TASK-02: Persist first 7-day measured KPI baseline in canonical BRIK plan metrics section
- **Type:** IMPLEMENT
- **Deliverable:** business-plan update with 7-day KPI baseline table and source window metadata.
- **Startup-Deliverable-Alias:** startup-weekly-kpcs-memo
- **Execution-Skill:** /lp-build
- **Artifact-Destination:** `docs/business-os/strategy/BRIK/plan.user.md`
- **Reviewer:** Pete
- **Approval-Evidence:** dated baseline lock note in `docs/business-os/strategy/BRIK/plan.user.md`
- **Measurement-Readiness:** owner=Pete; cadence=weekly roll-forward; tracking=`docs/business-os/strategy/BRIK/2026-02-13-weekly-kpcs-decision.user.md`
- **Affects:** `docs/business-os/strategy/BRIK/plan.user.md`, `[readonly] docs/business-os/strategy/BRIK/2026-02-13-measurement-verification.user.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Status:** Complete (2026-02-13)
- **Confidence:** 82%
  - Implementation: 84% - update surface is stable and localized.
  - Approach: 82% - canonical plan is the right baseline anchor.
  - Impact: 82% - high decision leverage, low technical blast radius.
- **Acceptance:**
  - Adds a date-bounded 7-day KPI table (sessions/users/conversions and event-level checks) to plan metrics section.
  - Includes data source path and extraction timestamp.
  - Marks any unknown values explicitly as pending, not inferred.
- **Validation contract:**
  - VC-01: Baseline table completeness -> each KPI row has value, date window, and source.
  - VC-02: Guardrail traceability -> baseline values map to at least one outcome guardrail or leading indicator.
  - VC-03: Approval evidence -> reviewer sign-off line recorded.
  - VC-04: Measurement readiness -> weekly refresh owner/cadence retained in doc.
  - **Acceptance coverage:** VC-01/VC-02 cover metric quality; VC-03/VC-04 cover operational adoption.
  - **Validation type:** review checklist
  - **Validation location/evidence:** `docs/business-os/strategy/BRIK/plan.user.md`
  - **Run/verify:** manual checklist review against VC rows
- **Execution plan:** Red -> Green -> Refactor
  - **Red evidence:** current metrics section still states conversion metrics as unmeasured.
  - **Green evidence:** baseline table inserted with source metadata.
  - **Refactor evidence:** metric wording normalized with existing outcome-contract terminology.
- **What would make this >=90%:** automated GA4 extraction query or reproducible script outputs attached alongside the table.
- **Rollout / rollback:**
  - Rollout: documentation update only.
  - Rollback: remove baseline table and restore prior metrics text if evidence invalidated.
- **Documentation impact:**
  - Update `docs/business-os/strategy/BRIK/plan.user.md`.
- **Notes / references:**
  - `docs/business-os/strategy/BRIK/2026-02-13-startup-loop-90-day-forecast-v1.user.md`

### TASK-03: Update weekly decision + workflow state rows to reflect routed execution and baseline status
- **Type:** IMPLEMENT
- **Deliverable:** synchronized status updates in weekly memo and startup-loop workflow guide.
- **Startup-Deliverable-Alias:** startup-weekly-kpcs-memo
- **Execution-Skill:** /lp-build
- **Artifact-Destination:** `docs/business-os/strategy/BRIK/2026-02-13-weekly-kpcs-decision.user.md`, `docs/business-os/startup-loop-workflow.user.md`
- **Reviewer:** Pete
- **Approval-Evidence:** updated dated section in weekly memo linking changed status rows
- **Measurement-Readiness:** owner=Pete; cadence=weekly; tracking=`docs/business-os/startup-loop-workflow.user.md` open tasks + BRIK gap table
- **Affects:** `docs/business-os/strategy/BRIK/2026-02-13-weekly-kpcs-decision.user.md`, `docs/business-os/startup-loop-workflow.user.md`, `[readonly] docs/business-os/strategy/BRIK/plan.user.md`
- **Depends on:** TASK-01
- **Blocks:** -
- **Status:** Complete (2026-02-13)
- **Confidence:** 84%
  - Implementation: 86% - changes are schema-preserving row edits.
  - Approach: 84% - closes routing ambiguity in canonical operator guide.
  - Impact: 84% - improves execution clarity across startup-loop operations.
- **Acceptance:**
  - Workflow row for BRIK S5 routing references active fact-find/plan artifact path.
  - BRIK gap table reflects routed execution state for this P1 item.
  - Weekly decision memo references current measurement baseline status and next checkpoint.
- **Validation contract:**
  - VC-01: Status consistency -> all updated docs use the same routed-state wording.
  - VC-02: Evidence-link completeness -> each updated status row points to concrete artifact path.
  - VC-03: Reviewer acknowledgement -> weekly memo includes dated owner acknowledgement.
  - VC-04: Measurement readiness -> next checkpoint date is explicitly stated.
  - **Acceptance coverage:** VC-01/VC-02 cover alignment; VC-03/VC-04 cover ownership cadence.
  - **Validation type:** cross-doc review checklist
  - **Validation location/evidence:** updated `.user.md` docs listed above
  - **Run/verify:** read-through validation of row consistency and links
- **Execution plan:** Red -> Green -> Refactor
  - **Red evidence:** current workflow still marks S5 routing as generic required task.
  - **Green evidence:** rows updated to routed-active state with plan links.
  - **Refactor evidence:** wording harmonized with section 5.4 stage-gap conventions.
- **Rollout / rollback:**
  - Rollout: documentation update only.
  - Rollback: revert status rows if baseline lock is rolled back.
- **Documentation impact:**
  - Update `docs/business-os/startup-loop-workflow.user.md` and weekly decision doc.
- **Notes / references:**
  - `docs/business-os/strategy/BRIK/2026-02-13-prioritization-scorecard.user.md`

### TASK-04: Add direct test coverage plan for `reportWebVitals.ts`
- **Type:** INVESTIGATE
- **Deliverable:** scoped test task proposal appended to the next GA4 instrumentation plan update.
- **Execution-Skill:** /lp-build
- **Artifact-Destination:** `docs/plans/brik-ga4-baseline-lock/plan.md` (Decision Log follow-up)
- **Reviewer:** Pete
- **Approval-Evidence:** decision-log entry accepting or deferring the test addition
- **Measurement-Readiness:** owner=Pete; cadence=next GA4 maintenance sprint; tracking=plan decision log
- **Affects:** `[readonly] apps/brikette/src/performance/reportWebVitals.ts`, `[readonly] apps/brikette/src/test/components/`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 76% ⚠️ BELOW THRESHOLD
  - Implementation: 78% - likely straightforward, but no direct precedent in local test suite.
  - Approach: 76% - needs agreement on test boundary and env mocking pattern.
  - Impact: 76% - low runtime risk, moderate test-maintenance impact.
- **Blockers / questions to answer:**
  - Best test seam for prod-gated `web-vitals` callbacks.
  - Whether to colocate tests under `src/test/performance` or `src/test/components`.
- **Acceptance:**
  - Select preferred test seam and file location with one concrete example test case outline.
  - Update this plan with an IMPLEMENT task if confidence rises >=80.
- **Notes / references:**
  - `docs/plans/brik-ga4-baseline-lock/fact-find.md` testability section.

## Risks & Mitigations
- Conversion and vitals event streams remain zero even after Data API access is restored.
  - Mitigation: production deployment alignment is complete; continue bounded post-deploy extracts and keep click-path probe evidence until report-layer non-zero signals are stable.
- Root-cause confusion between repo code and production bundle can delay fixes.
  - Mitigation: keep click-path probe evidence and deployed chunk checks in the measurement note.
- Baseline table added without reproducible extraction metadata.
  - Mitigation: require date window + source path in TASK-02 acceptance.
- Workflow status drift from actual evidence state.
  - Mitigation: TASK-03 cross-doc consistency validation.

## Observability
- Logging: dated verification and blocker entries in measurement note.
- Metrics: first 7-day KPI baseline table in canonical plan.
- Alerts/Dashboards: weekly memo must flag missing updates in the next cadence checkpoint.

## Acceptance Criteria (overall)
- [x] Event-level verification status for `web_vitals` and `begin_checkout` is documented with explicit evidence or blocker.
- [x] First 7-day measured KPI baseline is locked in `docs/business-os/strategy/BRIK/plan.user.md`.
- [x] Startup-loop workflow and weekly decision docs reflect active routed execution state and baseline status.

## Decision Log
- 2026-02-13: Scoped this plan to verification/baseline lock only (not instrumentation redesign) to close immediate S5 P1 routing gap.
- 2026-02-13: GA4 Data API probe initially returned `SERVICE_DISABLED`; after IAM/API remediation, extraction is now working and baseline lock is complete.
- 2026-02-13: Measured 7-day baseline is locked (sessions/users/event totals), production deployment alignment is complete, and live click-path probe now captures `en=begin_checkout`; remaining critical path is report-layer non-zero confirmation plus `web_vitals` verification.
