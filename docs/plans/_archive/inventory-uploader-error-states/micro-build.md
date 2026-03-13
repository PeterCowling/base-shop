---
Type: Micro-Build
Status: Archived
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: inventory-uploader-error-states
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260313190000-0006
Related-Plan: none
---

# Inventory Uploader Error States Micro-Build

## Scope
- Change: When a fetch call returns 401 (session expired), show a clear "Your session has expired — please log in again." message with a login link instead of the raw "HTTP 401" error string.
- Non-goals: Redirecting automatically on 401 (message + link is sufficient); handling other auth flows; changing non-401 error behaviour.

## Execution Contract
- Affects: apps/inventory-uploader/src/components/products/ProductsView.client.tsx, apps/inventory-uploader/src/components/products/ProductForm.client.tsx
- Acceptance checks:
  - When the products list fetch returns 401, the error area shows "Your session has expired — please log in again." with an underlined "Log in" link pointing to /login
  - When the product save fetch returns 401, the form error area shows the same message and link
  - Non-401 errors continue showing the existing error text unchanged
  - alert() calls for Duplicate and Delete operations also handle 401 with a friendly message
- Validation commands:
  - pnpm --filter @acme/inventory-uploader typecheck
  - pnpm --filter @acme/inventory-uploader lint
- Rollback note: Revert the two component files to restore original error handling.

## Outcome Contract
- **Why:** If a staff member's session expires while they are in the middle of work, they see a confusing error code with no explanation. Showing a clear message that says 'please log in again' means they know exactly what to do.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** 401 responses from any inventory API route result in a clear 'Session expired' message with a login link, rather than a raw HTTP error code.
- **Source:** operator
