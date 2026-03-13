---
Type: Micro-Build
Status: Archived
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: inventory-uploader-low-stock-badge
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260313190000-0003
Related-Plan: none
---

# Inventory Uploader Low-Stock Badge Micro-Build

## Scope
- Change: Add a low-stock badge (amber, ≤5 units threshold) to each product row in the products table. Add a "Low stock" filter button above the table so staff can see only items needing attention. Fetch inventory quantities in parallel with products and join by SKU.
- Non-goals: Changing the threshold per-product (uses a fixed constant of 5). Adding stock editing from this view. Changing inventory API contracts.

## Execution Contract
- Affects: `apps/inventory-uploader/src/components/products/ProductsView.client.tsx`, `apps/inventory-uploader/src/app/globals.css`
- Acceptance checks:
  - Products with quantity ≤ 5 show an amber "Low" badge in the Stock column
  - Products with quantity > 5 show no badge
  - "Low stock" filter button appears above the table; when active it filters to low-stock rows only
  - Filter button is inactive/dimmed by default
  - No TypeScript errors; no lint errors
- Validation commands:
  - `pnpm --filter @acme/inventory-uploader typecheck`
  - `pnpm --filter @acme/inventory-uploader lint`
- Rollback note: Single-file change to ProductsView.client.tsx; revert the file to remove the feature.

## Outcome Contract
- **Why:** When a product is about to run out, staff need to notice it immediately. A coloured badge on low-stock items means nothing slips through unnoticed.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Products with stock at or below 5 units show a visible amber warning badge. A filter button lets staff review all low-stock items at a glance.
- **Source:** operator
