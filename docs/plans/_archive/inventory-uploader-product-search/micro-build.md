---
Type: Micro-Build
Status: Archived
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: inventory-uploader-product-search
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260313190000-0005
Related-Plan: none
---

# Inventory Uploader Product Search Micro-Build

## Scope
- Change: Add a real-time search input above the products table in ProductsView.client.tsx that filters visible rows by SKU or title as the user types. No server round-trip — filters the already-loaded products array in component state.
- Non-goals: Server-side search, pagination, advanced filters, sorting.

## Execution Contract
- Affects: apps/inventory-uploader/src/components/products/ProductsView.client.tsx
- Acceptance checks:
  - Search input appears above the products table
  - Typing in the search input filters rows matching SKU or title (case-insensitive)
  - Clearing the search restores the full list
  - "No products match" message shown when search yields no results
  - Existing empty state (no products at all) still shown when there are no products
- Validation commands:
  - `pnpm --filter @acme/inventory-uploader typecheck`
  - `pnpm --filter @acme/inventory-uploader lint`
- Rollback note: Revert single file ProductsView.client.tsx.

## Outcome Contract
- **Why:** With many products in the catalogue, finding a specific one means scrolling through the whole list. A search box at the top means typing a few letters instantly narrows it down.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A search input above the products table filters rows in real time by SKU or title. Clearing the search restores the full list.
- **Source:** operator
