---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-09
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-statistics-yoy-switchable-ui
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan-only
---

# Reception Statistics YoY Switchable UI Plan

## Summary
This plan replaces the current statistics stub with a management-focused YoY dashboard. It is intentionally last in the YoY sequence: the screen must consume the upstream shared data contract and the aggregation API rather than inventing its own KPI meanings or fallback behavior. The initial UI will focus on two explicit KPI lenses, YTD context, month-by-month deltas, and clear partial-data states.

## Active tasks
- [ ] TASK-01: Bind statistics screen to the upstream YoY API contract
- [ ] TASK-02: Build switchable KPI dashboard with YTD and monthly comparison views
- [ ] TASK-03: Add loading, error, and sparse-data states plus UI regression coverage

## Goals
- Replace the statistics stub with a management-usable YoY screen.
- Let operators switch KPI lenses without ambiguity.
- Surface sparse prior-year data clearly instead of implying negative performance.

## Non-goals
- Export/report generation.
- Broad BI charting beyond the immediate YoY workflow.
- Any independent client-side aggregation logic.

## Constraints & Assumptions
- Constraints:
  - This plan depends on both `reception-statistics-yoy-data-contract` and `reception-statistics-yoy-aggregation-api`.
  - Toggle semantics must remain explicit and operator-readable.
- Assumptions:
  - The first release needs only a small number of KPI lenses, not arbitrary query builders.

## Inherited Outcome Contract
- **Why:** Even correct aggregates are insufficient unless management can switch KPI lenses and read YoY deltas quickly in one screen.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A concrete switchable YoY management dashboard scope is defined, including metric toggle behavior and decision-ready visualization requirements.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/reception-statistics-yoy-switchable-ui/fact-find.md`
- Key findings used:
  - The current statistics page is still a placeholder.
  - Existing dashboard card patterns can inform the new screen.
  - Sparse prior-year months need an explicit neutral/missing state.

## Proposed Approach
- Option A: Continue with a generic stats page and add YoY bits incrementally.
- Option B: Replace the stub with a dedicated switchable YoY dashboard bound to the API contract.
- Chosen approach: Option B. It keeps the management use case focused and avoids an incoherent half-generic, half-YoY screen.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes, after upstream YoY contract and API plans complete

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Bind the screen to the upstream YoY API contract | 90% | M | Pending | EXTERNAL: reception-statistics-yoy-data-contract, EXTERNAL: reception-statistics-yoy-aggregation-api | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Build the switchable KPI dashboard UI | 90% | M | Pending | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Add sparse-data states and UI regression coverage | 90% | M | Pending | TASK-01, TASK-02 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | Upstream contract and API complete | UI should not guess route semantics |
| 2 | TASK-02 | TASK-01 | Build dashboard surface |
| 3 | TASK-03 | TASK-01, TASK-02 | Hardening and coverage |

## Tasks

### TASK-01: Bind statistics screen to the upstream YoY API contract
- **Type:** IMPLEMENT
- **Deliverable:** statistics page data integration against the protected YoY API
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/reception/src/components/stats/Statistics.tsx`, `[readonly] docs/plans/reception-statistics-yoy-data-contract/plan.md`, `[readonly] docs/plans/reception-statistics-yoy-aggregation-api/plan.md`
- **Depends on:** EXTERNAL: reception-statistics-yoy-data-contract, EXTERNAL: reception-statistics-yoy-aggregation-api
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 90%
  - Implementation: 90% - The current screen is a stub, so there is little migration baggage.
  - Approach: 90% - API-first binding avoids client-side KPI drift.
  - Impact: 95% - Required to make the screen operational.

### TASK-02: Build switchable KPI dashboard with YTD and monthly comparison views
- **Type:** IMPLEMENT
- **Deliverable:** new statistics dashboard UI with explicit toggle behavior
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/reception/src/components/stats/Statistics.tsx`, `apps/reception/src/components/dashboard/`, `apps/reception/src/components/common/PageShell.tsx`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 90%
  - Implementation: 90% - Existing page shell and dashboard patterns can be reused.
  - Approach: 90% - A small explicit toggle set is clearer than an over-generic filter bar.
  - Impact: 95% - This is the operator-facing management surface.

### TASK-03: Add loading, error, and sparse-data states plus UI regression coverage
- **Type:** IMPLEMENT
- **Deliverable:** UI hardening and coverage for the YoY dashboard
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/reception/src/components/stats/Statistics.tsx`, `apps/reception/src/components/stats/__tests__/`, `apps/reception/src/app/statistics/`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% - State handling is bounded once the screen exists.
  - Approach: 90% - Explicit missing-data states reduce operator misread risk.
  - Impact: 90% - Prevents misleading regressions when archive coverage is sparse.

## Risks & Mitigations
- Operators could misread missing prior-year data as a negative delta.
  - Mitigation: explicit sparse-data state and neutral delta treatment.
- Toggle semantics could be ambiguous.
  - Mitigation: keep the first release to clearly named KPI lenses with helper text.

## Observability
- Logging: UI/API error surfacing for failed loads
- Metrics: None in first release
- Alerts/Dashboards: None

## Acceptance Criteria (overall)
- [ ] Statistics screen is backed by the upstream YoY API.
- [ ] Operators can switch KPI lenses without ambiguity.
- [ ] Partial-data states are explicit and tested.

## Decision Log
- 2026-03-09: Sequenced the UI plan after both the data-contract and aggregation API plans.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Overall-confidence = (90*2 + 90*2 + 90*2) / (2 + 2 + 2) = 540 / 6 = 90%
