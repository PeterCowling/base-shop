---
Type: Micro-Build
Status: Archived
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: reception-format-euro-consolidation
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260309100000-0003
Related-Plan: none
---

# Reception FormatEuro Consolidation Micro-Build

## Scope
- Change:
  - Replace local `formatEuro` helpers and inline `€${x.toFixed(2)}` literals with imports from `apps/reception/src/utils/format.ts`.
  - Preserve current output exactly while consolidating onto one canonical formatter.
- Non-goals:
  - Locale redesign or currency-display behavior changes.
  - Broader formatting cleanup outside euro helpers and direct literals.

## Execution Contract
- Affects:
  - `apps/reception/src/utils/format.ts`
  - `apps/reception/src/components/stats/Statistics.tsx`
  - `apps/reception/src/components/dashboard/DashboardMetrics.tsx`
  - `apps/reception/src/components/till/ReconciliationWorkbench.tsx`
  - `apps/reception/src/components/till/TillShiftHistory.tsx`
  - Additional reception call sites currently using inline `€${x.toFixed(2)}` formatting where replacement is mechanical.
- Acceptance checks:
  - No local `formatEuro` redefinitions remain in the reception app.
  - No inline euro template literals remain where `formatEuro` is the direct replacement.
  - Rendered currency output matches existing behavior.
- Validation commands:
  - `pnpm --filter @apps/reception typecheck`
  - `pnpm --filter @apps/reception lint`
- Rollback note:
  - Revert the affected imports and helper removals; no data migration required.

## Outcome Contract
- **Why:** Currency formatting inconsistency is a maintenance hazard because changing euro display requires editing many duplicated helpers and literals.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All euro formatting in the reception app flows through `apps/reception/src/utils/format.ts` `formatEuro`; no local redefinitions or inline euro template literals remain.
- **Source:** operator
