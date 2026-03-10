---
Type: Fact-Find
Outcome: Planning
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-03
Last-updated: 2026-03-03
Feature-Slug: reception-statistics-yoy-switchable-ui
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-statistics-yoy-switchable-ui/plan.md
Trigger-Why:
Trigger-Intended-Outcome:
---

# Reception Statistics YoY Switchable UI Fact-Find Brief

## Scope
### Summary
Management requires a statistics screen focused on YoY performance with switchable KPI views. Current screen is a single test button and has no management workflow.

### Goals
- Define switchable view contract (at least room-only vs room+bar revenue).
- Define decision-ready layout (YTD summary + month-by-month YoY deltas).
- Define loading/error/empty-state behavior for partial archive data.

### Non-goals
- Advanced BI charts beyond immediate management needs.
- Historical trend tooling outside YoY scope.

## Outcome Contract
- **Why:** Even correct aggregates are insufficient unless management can switch KPI lenses and read YoY deltas quickly in one screen.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A concrete switchable YoY management dashboard scope is defined, including metric toggle behavior and decision-ready visualization requirements.
- **Source:** operator

## Evidence Audit (Current State)
- `apps/reception/src/components/stats/Statistics.tsx` - currently labeled and implemented as connection test.
- `apps/reception/src/components/dashboard/DashboardMetrics.tsx` - only day-over-day KPI card pattern exists, no YoY baseline.
- `apps/reception/src/components/common/PageShell.tsx` - shared shell suitable for statistics view migration.

## Confidence Inputs
- Implementation: 91%
- Approach: 90%
- Impact: 93%
- Delivery-Readiness: 90%
- Testability: 87%

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| UI toggle semantics ambiguous for operators | Medium | Medium | Keep two explicit labels and include source definition helper text |
| Sparse prior-year months misread as regressions | Medium | High | Show missing-data indicator and neutral delta state |

## Planning Readiness
- Status: Ready-for-planning
- Recommended next step:
  - `/lp-do-build` replace stats stub with switchable YoY dashboard bound to aggregation API.
