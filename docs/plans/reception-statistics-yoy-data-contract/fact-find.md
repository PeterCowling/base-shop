---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Data
Workstream: Engineering
Created: 2026-03-03
Last-updated: 2026-03-03
Feature-Slug: reception-statistics-yoy-data-contract
Execution-Track: code
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-statistics-yoy-data-contract/plan.md
Trigger-Why:
Trigger-Intended-Outcome:
---

# Reception Statistics YoY Data Contract Fact-Find Brief

## Scope
### Summary
Reception needs year-on-year management reporting using current-year Firebase data and prior-year archive data. Current code has no metric/source contract, so KPI outputs are not yet trustworthy.

### Goals
- Define canonical source nodes for YoY KPIs.
- Define inclusion/exclusion rules (voided/corrected transactions, timezone, month boundaries).
- Define fallback behavior when archive DB is unavailable.

### Non-goals
- Final dashboard UI implementation.
- Full historical backfill process design.

### Constraints & Assumptions
- Constraints:
  - Current app config supports one RTDB URL only.
  - Existing archive writes also populate `archive/*` inside the current DB.
- Assumptions:
  - Archive DB mirrors key structures needed for previous-year reporting.

## Outcome Contract
- **Why:** Year-on-year performance is the key management interest and must use current-year + archived prior-year data with clear source-of-truth rules.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Reception has a documented YoY metric contract that unambiguously defines source nodes, date semantics, and inclusion rules for current-year vs prior-year comparisons.
- **Source:** operator

## Evidence Audit (Current State)
### Key Modules / Files
- `apps/reception/src/components/stats/Statistics.tsx` - statistics page is a connection test stub.
- `apps/reception/src/services/useFirebase.ts` - one DB URL wiring (`NEXT_PUBLIC_FIREBASE_DATABASE_URL`).
- `apps/reception/src/schemas/firebaseEnvSchema.ts` - one DB URL schema contract.
- `apps/reception/src/hooks/data/useAllFinancialTransactionsData.ts` - transaction source for revenue signals.
- `apps/reception/src/hooks/mutations/useArchiveCheckedOutGuests.ts` - writes to in-node `archive/*` paths.

### Resolved
- Q: Is a management-ready statistics pipeline already present?
  - A: No; route is still a connection-test placeholder.
- Q: Is dual-database config already wired?
  - A: No; only one DB URL is currently modeled.

## Confidence Inputs
- Implementation: 90%
- Approach: 92%
- Impact: 90%
- Delivery-Readiness: 88%
- Testability: 86%

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Archive DB schema drift from current DB assumptions | Medium | High | Add schema-normalization and partial-data handling in aggregation layer |
| KPI disagreements due to undefined inclusion rules | High | High | Lock contract first; codify rules in API response metadata |

## Planning Readiness
- Status: Ready-for-planning
- Recommended next step:
  - `/lp-do-build` implementation for dual-source contract + API wiring.
