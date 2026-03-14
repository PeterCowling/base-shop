---
Type: Micro-Build
Status: Active
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: brik-bar-preorder-single-click
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260314203002-BRIK-003
Related-Plan: none
---

# Bar Preorder Single-Click Convert-to-Sale Micro-Build

## Scope
- Change: Replace the `console.log` stub in `handlePreorderClick` with the same convert-to-sale flow used by `handleDoubleClick`: assign bleep, create zero-price sale via `createSale`, remove preorder from Firebase on success.
- Non-goals: Adding a confirmation dialog for single-click; changing the double-click behavior; modifying the delete flow.

## Execution Contract
- Affects: `apps/reception/src/components/bar/orderTaking/preorder/PreorderButtons.tsx`, `apps/reception/src/components/bar/orderTaking/preorder/__tests__/PreorderButtons.test.tsx`
- Acceptance checks:
  - Single-click on a preorder button calls `createSale` with zero-price items
  - Single-click assigns a bleep number and calls `setBleeperAvailability`
  - Single-click removes the preorder from Firebase on success
  - The test that previously verified console.log is updated to verify `createSale` is called
  - All other tests pass
- Validation commands:
  - `pnpm --filter reception typecheck`
  - `pnpm --filter reception lint`
- Rollback note: Restore `handlePreorderClick` to its `console.log("Complimentary order:", order)` implementation.

## Outcome Contract
- **Why:** Staff tapping a guest's breakfast order once see nothing happen — no confirmation, no ticket, no visual change. There is no indication that the tap registered at all. Wiring the single tap to the same flow as a double-tap means every touch on a guest order produces a visible result, and no orders get silently ignored.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Single-clicking a preorder button triggers the same convert-to-sale flow as double-clicking: a confirmed sale ticket is created, a bleep is assigned, and the preorder is removed from the pending panel.
- **Source:** auto
