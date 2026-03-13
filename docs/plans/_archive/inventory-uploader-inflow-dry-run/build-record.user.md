# Inventory Uploader Inflow Dry-Run — Build Record

**Date:** 2026-03-13
**Feature slug:** inventory-uploader-inflow-dry-run

## What was built

The stock inflow form now has a two-step Preview → Confirm flow. When staff fill in the SKU and quantity and click Preview, the form sends the delivery receipt to the server as a dry run — the server calculates what the stock levels would be but does not save anything. The resulting projected stock changes are shown in the form. Staff can review the numbers, cancel to edit, or click Confirm to apply.

The API route (`inflows/route.ts`) and the repository (`receiveStockInflow`) already had full `dryRun` support. Only the UI component needed updating.

## Changes

- `apps/inventory-uploader/src/components/inventory/StockInflows.client.tsx` — added `preview` state and two-step flow (Preview button → preview table → Confirm/Cancel buttons); editing any field clears the preview automatically.

## Validation

- Typecheck: passed
- Lint: passed (two suppression comments added for the existing `INV-0001` operator-tool pattern and a `react-hooks/exhaustive-deps` exception)

## Outcome

Staff entering a delivery can now review projected stock changes before committing. A typo in quantity is visible before it affects the live stock level.
