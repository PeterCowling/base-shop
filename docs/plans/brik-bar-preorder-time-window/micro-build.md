---
Type: Micro-Build
Status: Active
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: brik-bar-preorder-time-window
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260314203001-BRIK-002
Related-Plan: none
---

# Bar Preorder Time-Window Gate Removal Micro-Build

## Scope
- Change: Replace `getPreorderType()` null return outside service windows with split-day logic: before 14:00 Rome → `"breakfastPreorders"`, from 14:00 onward → `"evDrinkPreorders"`. Add `isWithinServiceWindow()` helper to render an "(outside service hours)" indicator when data is shown but strict window is inactive.
- Non-goals: Changing the Firebase data structure; showing both preorder types simultaneously; modifying the delete or double-click convert flow.

## Execution Contract
- Affects: `apps/reception/src/components/bar/orderTaking/preorder/PreorderButtons.tsx`, `apps/reception/src/components/bar/orderTaking/preorder/__tests__/PreorderButtons.test.tsx`
- Acceptance checks:
  - Preorder panel renders preorder buttons at any time of day
  - An "(outside service hours)" note is shown when the current time is outside 07:00–10:59 or 18:00–20:59 Rome time
  - Existing delete and double-click convert flows remain unchanged
  - All existing tests pass; updated test covers the new indicator logic
- Validation commands:
  - `pnpm --filter reception typecheck`
  - `pnpm --filter reception lint`
- Rollback note: Revert `getPreorderType()` to original time-window guard logic (restore `return null` branch).

## Outcome Contract
- **Why:** Bar staff can only see guest breakfast orders between 7 AM and 11 AM. If someone arrives early to set up or checks just after 11, the screen shows nothing at all with no warning — it just looks like there are no orders. Always showing pending orders (with a note about whether the service window is open) means staff are never caught off guard.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Preorder buttons are visible whenever pending orders exist, regardless of the time of day. The service window status is indicated visually but does not hide data from staff.
- **Source:** auto
