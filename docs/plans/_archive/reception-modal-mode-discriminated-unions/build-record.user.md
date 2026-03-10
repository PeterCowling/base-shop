---
Type: Build-Record
Status: Complete
Feature-Slug: reception-modal-mode-discriminated-unions
Completed-date: 2026-03-09
artifact: build-record
Build-Event-Ref: docs/plans/reception-modal-mode-discriminated-unions/build-event.json
---

# Build Record: Reception Modal/Mode Discriminated Unions

## Outcome Contract

- **Why:** Arrays of independent boolean flags for mutually exclusive state create 2^N theoretical states for an N-state reality, require manual enforcement of mutual exclusivity, and inflate component prop interfaces. The pattern is present in 4 components and already cascades into 27-prop `CheckinsTableView`.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Each modal/mode state in reception uses a single discriminated union state variable. Illegal state combinations are impossible by construction. `CheckinsTableView` prop count is reduced via a grouped mode-state prop (from 3 separate boolean props to 1 union-typed prop).
- **Source:** auto

## What Was Built

The reception check-ins flow now uses `CheckinMode` instead of three mutually exclusive booleans, and `CheckinsTableView` consumes a single `checkinMode` prop for its banners and row-click routing.

The till cash-form flow now uses `TillCashForm`, with `useTillReconciliationLogic`, `TillReconciliation`, `FormsContainer`, and the related tests/parity mocks updated to consume one union state plus one setter instead of three booleans and three setters.

`DraftReviewPanel` confirm-dialog state and `Login` panel state now each use a single discriminated union, eliminating impossible cross-true combinations. Reception package validation now passes with the refactor in place.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter @apps/reception typecheck` | Pass | Run on 2026-03-09 during closure backfill |
| `pnpm --filter @apps/reception lint` | Pass with warnings | Exit 0; 13 warnings, 0 errors |

## Validation Evidence

- TASK-01: `useCheckinsModes.ts`, `CheckinsTable.tsx`, `view/CheckinsTable.tsx`, and the associated tests now use `CheckinMode`.
- TASK-02: till UI, till logic, till forms, and affected test/parity files now use `TillCashForm`.
- TASK-03: `DraftReviewPanel.tsx` now uses `confirmDialog` as a discriminated union for all confirmation flows.
- TASK-04: `Login.tsx` now uses `loginPanel` as a discriminated union for credentials, forgot-password, pin-setup, and pin-unlock paths.
- TASK-05: reception typecheck passed, and lint exited successfully with warnings only.

## Scope Deviations

None. The post-build artifacts were backfilled on 2026-03-09 to close a stale build-completion gap; the implementation scope itself stayed within the original plan.
