---
Type: Micro-Build
Status: Archived
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: inventory-uploader-clear-shop-on-logout
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260313190000-0007
Related-Plan: none
---

# Inventory Uploader Clear Shop On Logout Micro-Build

## Scope
- Change: Add a logout button to the inventory uploader shell that clears the localStorage shop key (`inventory-uploader:shop`) before calling a new logout API route, then redirects to `/login`. Add the logout API route (`/api/auth/logout`) that clears the session cookie.
- Non-goals: Changing the session token revocation mechanism; UI restyling; adding a logout flow to the login page.

## Execution Contract
- Affects:
  - `apps/inventory-uploader/src/app/api/auth/logout/route.ts` (new)
  - `apps/inventory-uploader/src/components/console/LogoutButton.client.tsx` (new)
  - `apps/inventory-uploader/src/app/InventoryShell.client.tsx` (wire logout button into header)
- Acceptance checks:
  - TC-01-A: After logging out, `localStorage.getItem("inventory-uploader:shop")` returns `null`
  - TC-01-B: After logging out, the `inventory_admin` cookie is cleared (maxAge 0)
  - TC-01-C: After logging out, the browser is redirected to `/login`
  - TC-01-D: The Logout button is visible in the inventory console header
- Validation commands:
  - `pnpm --filter @acme/inventory-uploader typecheck`
- Rollback note: Revert the three file changes; the localStorage key persists on logout but no data is lost.

## Outcome Contract
- **Why:** If two different staff members use the same computer, the second person logging in could accidentally see the first person's shop already selected. Clearing the shop on logout prevents this mix-up.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Logging out clears the stored shop selection so the next login always starts from the shop selection screen.
- **Source:** operator
