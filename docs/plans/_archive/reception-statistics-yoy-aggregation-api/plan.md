---
Type: Plan
Status: Archived
Domain: API
Workstream: Engineering
Created: 2026-03-09
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-statistics-yoy-aggregation-api
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan-only
---

# Reception Statistics YoY Aggregation API Plan

## Summary
This plan builds the server-side aggregation layer that consumes the canonical YoY data contract and exposes switch-ready KPI payloads for the statistics screen. It is deliberately sequenced after `reception-statistics-yoy-data-contract`: the route, monthly/YTD outputs, and missing-data behavior must all be derived from that upstream contract rather than redefined locally.

## Active tasks
- [ ] TASK-01: Bind the API route to the shared YoY contract and auth gate
- [ ] TASK-02: Implement deterministic dual-source aggregation helpers
- [ ] TASK-03: Add route and aggregation regression coverage

## Goals
- Provide one protected server endpoint for YoY statistics.
- Normalize current-year and prior-year data into route-ready monthly and YTD outputs.
- Expose provenance and missing-data metadata for the UI.

## Non-goals
- Dashboard UI rendering.
- Export workflows.
- Broader analytics endpoints outside YoY scope.

## Constraints & Assumptions
- Constraints:
  - This plan depends on `reception-statistics-yoy-data-contract` completing first.
  - Stats access must stay behind the existing permission model.
- Assumptions:
  - The route can operate on a narrow year-window payload without full historical scans.

## Inherited Outcome Contract
- **Why:** A robust YoY dashboard depends on deterministic centralized aggregation logic rather than ad-hoc client subscriptions.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A tested server aggregation contract is defined for YoY KPIs across current and archived data sources, ready for build implementation.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/reception-statistics-yoy-aggregation-api/fact-find.md`
- Key findings used:
  - No statistics aggregation route exists today.
  - Existing staff auth and statistics permission patterns can be reused.
  - Client hooks should not own dual-source normalization logic.

## Proposed Approach
- Option A: Compute YoY aggregates in the client from raw subscriptions.
- Option B: Centralize the logic in a protected server route that imports the shared contract.
- Chosen approach: Option B. It is the only approach that keeps logic deterministic, permission-scoped, and reusable by the UI.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes, after `reception-statistics-yoy-data-contract` completes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Bind a protected YoY route to the upstream shared contract | 90% | M | Pending | EXTERNAL: reception-statistics-yoy-data-contract | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Implement monthly/YTD dual-source aggregation and provenance output | 90% | M | Pending | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Add route and aggregation regression coverage | 90% | M | Pending | TASK-01, TASK-02 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | Upstream data contract complete | Route boundary first |
| 2 | TASK-02 | TASK-01 | Aggregation logic builds on route contract |
| 3 | TASK-03 | TASK-01, TASK-02 | Lock behavior with tests |

## Tasks

### TASK-01: Bind the API route to the shared YoY contract and auth gate
- **Type:** IMPLEMENT
- **Deliverable:** protected `/api/statistics/yoy` contract wired to shared schema/types
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/reception/src/app/api/statistics/yoy/route.ts`, `[readonly] docs/plans/reception-statistics-yoy-data-contract/plan.md`, `[readonly] apps/reception/src/lib/roles.ts`
- **Depends on:** EXTERNAL: reception-statistics-yoy-data-contract
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 90%
  - Implementation: 90% - Existing route and auth patterns are known.
  - Approach: 90% - Upstream contract removes route-shape ambiguity.
  - Impact: 95% - This is the API dependency for the UI plan.

### TASK-02: Implement deterministic dual-source aggregation helpers
- **Type:** IMPLEMENT
- **Deliverable:** aggregation helpers that emit monthly/YTD KPI payloads with provenance
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/reception/src/app/api/statistics/yoy/route.ts`, `apps/reception/src/lib/`, `apps/reception/src/hooks/data/`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 90%
  - Implementation: 90% - Bounded year-window computation keeps scope tractable.
  - Approach: 90% - Centralized helpers prevent UI duplication.
  - Impact: 90% - Required for trustworthy KPI output.

### TASK-03: Add route and aggregation regression coverage
- **Type:** IMPLEMENT
- **Deliverable:** API and aggregation test coverage
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/reception/src/app/api/statistics/yoy/__tests__/`, `apps/reception/src/**/__tests__`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% - Existing route test patterns are available.
  - Approach: 90% - Regression coverage is the right guard for a metrics route.
  - Impact: 90% - Prevents KPI drift and partial-data regressions.

## Risks & Mitigations
- Large scans could degrade latency.
  - Mitigation: keep the route focused on the required YoY windows only.
- KPI provenance could be lost between route and UI.
  - Mitigation: make provenance a first-class response field.

## Observability
- Logging: route-level failure and provenance metadata
- Metrics: None in first release
- Alerts/Dashboards: None

## Acceptance Criteria (overall)
- [ ] `/api/statistics/yoy` exists behind the correct auth gate.
- [ ] Route output follows the upstream data contract and includes provenance.
- [ ] Regression coverage protects aggregation behavior.

## Decision Log
- 2026-03-09: Sequenced this API plan after the YoY data contract plan.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Overall-confidence = (90*2 + 90*2 + 90*2) / (2 + 2 + 2) = 540 / 6 = 90%
