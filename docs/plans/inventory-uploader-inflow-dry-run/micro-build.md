---
Type: Micro-Build
Status: Active
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: inventory-uploader-inflow-dry-run
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260313190000-0008
Related-Plan: none
---

# Inventory Uploader Inflow Dry-Run Preview Micro-Build

## Scope
- Change: Add a two-step Preview → Confirm flow to the StockInflows UI component. The API (`inflows/route.ts`) and the repository (`receiveStockInflow`) already support `dryRun=true`. Only the UI component needs updating.
- Non-goals: Changes to the API route, repository logic, or schema. No changes to the adjustments flow.

## Execution Contract
- Affects: `apps/inventory-uploader/src/components/inventory/StockInflows.client.tsx`
- Acceptance checks:
  - Clicking "Preview" sends a POST with `?dryRun=true` and shows a projected stock table
  - The "Confirm" button is only shown when a preview is active
  - Editing any field clears the preview (returns to edit mode)
  - Submitting with "Confirm" sends a normal POST (no dryRun) and records the inflow
  - "Cancel" in preview state returns to edit mode without resetting field values
- Validation commands:
  - `pnpm --filter @acme/inventory-uploader typecheck`
  - `pnpm --filter @acme/inventory-uploader lint`
- Rollback note: Revert `StockInflows.client.tsx` to prior state; no DB or API changes.

## Outcome Contract
- **Why:** When a delivery arrives, staff need to count and enter the quantities. A preview step shows exactly what the stock levels will be after receiving the delivery, so a typo can be caught before it is committed to the system.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The inflows form shows a preview of projected stock changes before the delivery is confirmed. Staff can review and correct before committing.
- **Source:** operator
