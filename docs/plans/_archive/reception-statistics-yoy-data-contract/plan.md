---
Type: Plan
Status: Archived
Domain: Data
Workstream: Engineering
Created: 2026-03-09
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-statistics-yoy-data-contract
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan-only
---

# Reception Statistics YoY Data Contract Plan

## Summary
Year-on-year reporting needs a canonical contract before API or UI work can be trusted. This plan defines the source-of-truth nodes, metric definitions, month/YTD semantics, inclusion and exclusion rules, and fallback metadata for current-year versus prior-year comparisons. It is intentionally first in the YoY chain: the aggregation API and switchable UI plans must consume this contract rather than invent their own.

## Active tasks
- [x] TASK-01: Define canonical YoY metric and source contract
- [x] TASK-02: Encode the contract in shared schema/types and deterministic tests
- [x] TASK-03: Publish fallback and provenance metadata rules for downstream consumers

## Goals
- Lock one authoritative source contract for YoY KPIs.
- Define month boundaries, timezone treatment, and archive fallback behavior.
- Give the downstream API and UI plans a stable contract to consume.

## Non-goals
- Building the final dashboard UI.
- Implementing full archive backfill tooling.
- Optimizing API performance before contract correctness exists.

## Constraints & Assumptions
- Constraints:
  - Current runtime models one primary RTDB URL.
  - Existing archive writes also land under `archive/*` inside the current database.
- Assumptions:
  - Prior-year reporting can use archive mirror data for the first implementation.

## Inherited Outcome Contract
- **Why:** Year-on-year performance is the key management interest and must use current-year + archived prior-year data with clear source-of-truth rules.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Reception has a documented YoY metric contract that unambiguously defines source nodes, date semantics, and inclusion rules for current-year vs prior-year comparisons.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/reception-statistics-yoy-data-contract/fact-find.md`
- Key findings used:
  - Statistics screen is still a stub, so there is no incumbent contract to preserve.
  - Existing archive writes already produce useful in-node historical data.
  - Dual-source behavior must be defined before route or UI code can be validated.

## Proposed Approach
- Option A: Let the API plan define contract ad hoc while implementing.
- Option B: Define a shared contract first, then make API and UI follow it.
- Chosen approach: Option B. It reduces KPI disagreement risk and gives the downstream work a stable dependency.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Define canonical metric/source/date rules for YoY reporting | 90% | M | Complete (2026-03-09) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Encode the YoY contract in shared schema/types and tests | 90% | M | Complete (2026-03-09) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Add fallback/provenance metadata rules for downstream API/UI consumption | 90% | S | Complete (2026-03-09) | TASK-01, TASK-02 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Contract first |
| 2 | TASK-02 | TASK-01 | Shared schema/type encoding |
| 3 | TASK-03 | TASK-01, TASK-02 | Downstream-consumer metadata |

## Tasks

### TASK-01: Define canonical YoY metric and source contract
- **Type:** IMPLEMENT
- **Deliverable:** documented and code-adjacent contract for metric definitions and source nodes
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-09)
- **Affects:** `apps/reception/src/app/api/statistics/`, `apps/reception/src/hooks/data/`, `docs/plans/reception-statistics-yoy-data-contract/`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 90%
  - Implementation: 90% - Source nodes and current limitations are already known from fact-find.
  - Approach: 90% - Contract-first is the lowest-risk sequencing choice.
  - Impact: 95% - Downstream API/UI correctness depends on this.
- **Acceptance:**
  - Canonical current-year and prior-year source nodes are named.
  - Inclusion/exclusion rules are explicit.
  - Month/YTD semantics and timezone treatment are explicit.

### TASK-02: Encode the contract in shared schema/types and deterministic tests
- **Type:** IMPLEMENT
- **Deliverable:** shared contract module(s) and coverage for the defined rules
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-09)
- **Affects:** `apps/reception/src/app/api/statistics/`, `apps/reception/src/types/`, `apps/reception/src/**/__tests__`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 90%
  - Implementation: 90% - Shared types/schemas are straightforward once rules are fixed.
  - Approach: 90% - Deterministic tests should enforce contract drift control.
  - Impact: 90% - Gives the API plan a stable compile-time boundary.
- **Acceptance:**
  - Shared types/schemas represent the canonical YoY metric contract.
  - Tests cover inclusion/exclusion and date-boundary rules.
  - Downstream code can import the contract instead of duplicating rules.

### TASK-03: Publish fallback and provenance metadata rules for downstream consumers
- **Type:** IMPLEMENT
- **Deliverable:** explicit fallback/provenance contract for API and UI
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-09)
- **Affects:** `apps/reception/src/app/api/statistics/`, `[readonly] docs/plans/reception-statistics-yoy-aggregation-api/plan.md`, `[readonly] docs/plans/reception-statistics-yoy-switchable-ui/plan.md`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% - Small metadata layer once the contract exists.
  - Approach: 90% - Provenance/fallback must be explicit to avoid UI ambiguity.
  - Impact: 90% - Prevents sparse archive data from being misread.
- **Acceptance:**
  - Downstream consumers can tell when prior-year data is partial or unavailable.
  - Contract exposes provenance/fallback metadata alongside KPI values.

## Risks & Mitigations
- KPI disagreement if rules remain implicit.
  - Mitigation: contract-first delivery and deterministic tests.
- Archive drift could break assumptions.
  - Mitigation: provenance and fallback metadata in the contract.

## Observability
- Logging: provenance/fallback metadata in responses
- Metrics: None in this contract phase
- Alerts/Dashboards: None

## Acceptance Criteria (overall)
- [x] Canonical YoY source and metric rules are defined and encoded.
- [x] Downstream API and UI have a stable contract dependency.
- [x] Partial-data behavior is explicit.

## Decision Log
- 2026-03-09: Sequenced YoY work to make the data contract the first required plan in the chain.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Overall-confidence = (90*2 + 90*2 + 90*1) / (2 + 2 + 1) = 450 / 5 = 90%
