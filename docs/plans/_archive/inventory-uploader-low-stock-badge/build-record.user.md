---
Type: Build-Record
Feature-Slug: inventory-uploader-low-stock-badge
Built: 2026-03-13
Status: Complete
---

# Low-Stock Badge and Filter — Build Record

## What was built

A low-stock warning badge (amber, "Low") now appears on any product row where inventory is at or below 5 units. A "Low stock" toggle button sits next to the search box — activating it filters the table to show only items needing attention.

## How stock data is fetched

`ProductPublication` (the products type) has no stock field. Stock lives in the inventory items store. The component now fetches both endpoints in parallel (`/api/inventory/[shop]/products` and `/api/inventory/[shop]`) and joins by SKU — summing quantities across all variants of a SKU.

## Token decisions

- `bg-gate-warning-subtle` / `text-gate-warning-fg` — new CSS custom properties added to `globals.css` (amber tones, with dark-mode overrides). These use the same pattern as the existing gate token set.
- `text-2xs` — existing utility (10px) reused for badge text, avoiding the banned `text-[10px]` arbitrary value.

## Files changed

- `apps/inventory-uploader/src/components/products/ProductsView.client.tsx` — main feature implementation; `ProductRow` extracted as a sub-component to stay within the 200-line function limit
- `apps/inventory-uploader/src/app/globals.css` — `--gate-warning-subtle`, `--gate-warning-fg` tokens + utilities

## Validation

- `pnpm --filter @acme/inventory-uploader typecheck` — pass
- `pnpm --filter @acme/inventory-uploader lint` — pass
