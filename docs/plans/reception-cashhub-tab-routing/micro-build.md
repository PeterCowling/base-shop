---
Type: Micro-Build
Status: Active
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: reception-cashhub-tab-routing
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260314161500-0006
Related-Plan: none
---

# CashHub Tab URL Routing Micro-Build

## Scope
- Change: Sync the active CashHub tab with the URL search param `?tab=till|safe|workbench`
- Non-goals: Deep linking to specific transactions, browser history management beyond tab selection

## Execution Contract
- Affects: `apps/reception/src/components/cash/CashHub.tsx`
- Acceptance checks:
  - Navigating to `/cash?tab=safe` opens the Safe tab directly
  - Clicking a tab updates the URL without full page reload
  - Invalid/missing tab param defaults to "till"
  - TypeScript passes
- Validation commands:
  - `pnpm --filter @apps/reception typecheck`
- Rollback note: Revert CashHub.tsx to useState-only tab management

## Outcome Contract
- **Why:** The safe and workbench tabs were not deep-linkable — refreshing the page always returned to the Till tab, losing context.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Each CashHub tab is directly linkable and survives a page refresh.
- **Source:** operator
