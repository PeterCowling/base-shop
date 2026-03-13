---
Type: Micro-Build
Status: Archived
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: inventory-uploader-duplicate-product-button
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260313190000-0004
Related-Plan: none
---

# Inventory Uploader Duplicate Product Button Micro-Build

## Scope
- Change: Add a Duplicate button to each product row in the ProductsView table, wired to the existing POST /api/inventory/[shop]/products/[id] endpoint.
- Non-goals: No changes to the API, no UI changes beyond the table row actions, no new pages or modals.

## Execution Contract
- Affects: apps/inventory-uploader/src/components/products/ProductsView.client.tsx
- Acceptance checks:
  - Each product row shows a Duplicate button between Edit and Delete
  - Clicking Duplicate calls POST /api/inventory/[shop]/products/[id] and refreshes the product list
  - On error, an alert is shown with the HTTP status
  - No TypeScript or lint errors
- Validation commands:
  - `pnpm --filter @acme/inventory-uploader typecheck`
  - `pnpm --filter @acme/inventory-uploader lint`
- Rollback note: Revert the single change to ProductsView.client.tsx.

## Outcome Contract
- **Why:** Creating a new product that is similar to an existing one means filling in the same form fields from scratch. A Duplicate button copies the existing product and lets staff edit just the differences.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Each product row has a Duplicate action. Clicking it creates a copy with a new auto-generated SKU and returns to the product list with the new row visible.
- **Source:** operator
