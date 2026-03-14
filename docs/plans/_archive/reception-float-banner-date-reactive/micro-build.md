---
Type: Micro-Build
Status: Archived
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: reception-float-banner-date-reactive
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260314161500-0010
Related-Plan: none
---

# Float Banner Stale Date Fix Micro-Build

## Scope
- Change: Extract a `useTodayBounds` hook that returns reactive `startAt`/`endAt` ISO strings that update at midnight; use it in `TillReconciliation` so the float-done-today check and Firebase query stay current without a page reload
- Non-goals: Automatic session handoff, EOD flow changes

## Execution Contract
- Affects:
  - `apps/reception/src/components/till/TillReconciliation.tsx`
- Acceptance checks:
  - Float banner check and cash count query use a midnight-refreshing date bound
  - TypeScript passes
- Validation commands:
  - `pnpm --filter @apps/reception typecheck`

## Outcome Contract
- **Why:** The float-done-today check and Firebase query bounds are computed from `new Date()` at mount time. A shift that starts before midnight and runs past it will show stale data — the "Opening float not set" banner may be wrong.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The float banner check uses a reactive date bound that refreshes at midnight without a page reload.
- **Source:** operator
