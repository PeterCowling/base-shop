# Inventory Uploader Error States — Build Record

**Date:** 2026-03-13
**Feature slug:** inventory-uploader-error-states
**Dispatch ID:** IDEA-DISPATCH-20260313190000-0006

## What was done

When a staff member's session expires and they try to load products or save a product, the inventory uploader now shows a clear "Your session has expired. Log in again" message with a link to `/login`, instead of the raw "HTTP 401" error string.

## Files changed

- `apps/inventory-uploader/src/components/products/ProductsView.client.tsx` — 401 handling added to list load, duplicate, and delete fetch calls; error display updated with login link
- `apps/inventory-uploader/src/components/products/ProductForm.client.tsx` — 401 handling added to save fetch call; error display updated with login link

## Validation

- `pnpm --filter @acme/inventory-uploader typecheck` — passed
- `pnpm --filter @acme/inventory-uploader lint` — passed
- Pre-commit hooks (lint-staged + typecheck-staged) — passed

## Outcome

401 responses from any inventory API route now show a friendly "Your session has expired. Log in again." message with a link to the login page, rather than a raw HTTP error code.
