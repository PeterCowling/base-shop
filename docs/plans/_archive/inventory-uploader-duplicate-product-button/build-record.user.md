---
artifact: build-record
Feature-Slug: inventory-uploader-duplicate-product-button
Built: 2026-03-13
---

# Inventory Uploader Duplicate Product Button — Build Record

## Outcome Contract

- **Why:** Creating a new product that is similar to an existing one means filling in the same form fields from scratch. A Duplicate button copies the existing product and lets staff edit just the differences.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Each product row has a Duplicate action. Clicking it creates a copy with a new auto-generated SKU and returns to the product list with the new row visible.
- **Source:** operator

## What Was Built

Added a `handleDuplicate` async function to `ProductsView.client.tsx` that POSTs to the existing duplicate endpoint (`POST /api/inventory/[shop]/products/[id]`) and triggers a product list refresh on success. A Duplicate button was added between the Edit and Delete actions in each product table row. On API error, an alert is shown with the HTTP status code.

No API changes were required — the endpoint (`duplicateProductInRepo`) was already implemented.

## Engineering Coverage Evidence

- **File changed:** `apps/inventory-uploader/src/components/products/ProductsView.client.tsx`
- **Typecheck:** pass (0 errors, `pnpm --filter @acme/inventory-uploader typecheck`)
- **Lint:** pass (0 warnings/errors, `pnpm --filter @acme/inventory-uploader lint`)
- **Pattern:** mirrors existing `handleDelete` pattern — same fetch/error/refresh flow
- **ESLint disable comment:** preserved at top of file (INV-0001 ds/min-tap-size, compact console buttons)
