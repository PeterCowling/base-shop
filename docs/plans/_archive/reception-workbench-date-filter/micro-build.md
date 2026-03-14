---
Type: Micro-Build
Status: Archived
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: reception-workbench-date-filter
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260314161500-0002
Related-Plan: none
---

# Workbench Date Filter Micro-Build

## Scope
- Change: Filter `cashCounts` to today's entries before picking `lastCashCount`, and filter `postings` and `batches` to today in `ReconciliationWorkbench`
- Non-goals: Changes to Firebase queries, hooks interface changes, date-picker UI

## Execution Contract
- Affects: `apps/reception/src/components/till/ReconciliationWorkbench.tsx`
- Acceptance checks:
  - `lastCashCount` comes from today's cash counts only (filtered by `timestamp`)
  - PMS postings filtered to today (by `createdAt`)
  - Terminal batches filtered to today (by `createdAt`)
  - "No PMS postings entered for today" warning reflects today's data only
  - "No terminal batch entered for today" warning reflects today's data only
  - TypeScript passes with no new errors
- Validation commands:
  - `pnpm --filter @apps/reception typecheck`
- Rollback note: Revert the filter additions in `ReconciliationWorkbench.tsx`

## Outcome Contract
- **Why:** Without date filtering, the workbench accumulates all-time PMS postings and terminal batches — making totals wrong whenever entries exist from previous shifts.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Workbench shows only today's data — cash drawer count, PMS postings, and terminal batches — so reconciliation totals reflect the current shift.
- **Source:** operator
