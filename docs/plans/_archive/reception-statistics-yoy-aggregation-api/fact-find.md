---
Type: Fact-Find
Outcome: Planning
Status: Archived
Domain: API
Workstream: Engineering
Created: 2026-03-03
Last-updated: 2026-03-03
Feature-Slug: reception-statistics-yoy-aggregation-api
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-statistics-yoy-aggregation-api/plan.md
Trigger-Why:
Trigger-Intended-Outcome:
---

# Reception Statistics YoY Aggregation API Fact-Find Brief

## Scope
### Summary
Reception requires a server-side YoY aggregation endpoint that reads current and archive sources, normalizes monthly/YTD outputs, and returns switch-ready metrics for management UI.

### Goals
- Define API shape for YoY monthly and YTD values.
- Define authentication and role gate for stats access.
- Define computation behavior for missing months and partial datasets.

### Non-goals
- PDF/CSV exports.
- Non-YoY analytics workstreams.

## Outcome Contract
- **Why:** A robust YoY dashboard depends on deterministic centralized aggregation logic rather than ad-hoc client subscriptions.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A tested server aggregation contract is defined for YoY KPIs across current and archived data sources, ready for build implementation.
- **Source:** operator

## Evidence Audit (Current State)
- `apps/reception/src/app/api/` - no statistics aggregation route exists.
- `apps/reception/src/app/api/mcp/_shared/staff-auth.ts` - existing auth pattern reusable for protected stats endpoint.
- `apps/reception/src/lib/roles.ts` - `STATISTICS_ACCESS` permission set already defined.
- `apps/reception/src/hooks/data/*` - client hooks directly subscribe to raw nodes and do not perform dual-source normalization.

## Confidence Inputs
- Implementation: 89%
- Approach: 90%
- Impact: 92%
- Delivery-Readiness: 89%
- Testability: 88%

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Large-node scans causing latency | Medium | Medium | Keep payload narrow and compute only needed year windows |
| Incorrect classification for switchable revenue modes | Medium | High | Publish classification rules in response metadata and tests |

## Planning Readiness
- Status: Ready-for-planning
- Recommended next step:
  - `/lp-do-build` implement `/api/statistics/yoy` with dual-source reads and schema-valid response.
