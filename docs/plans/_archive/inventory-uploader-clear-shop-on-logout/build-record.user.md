---
Type: Build-Record
Status: Complete
Domain: Platform
Last-reviewed: 2026-03-13
Feature-Slug: inventory-uploader-clear-shop-on-logout
Execution-Track: code
Completed-date: 2026-03-13
artifact: build-record
Build-Event-Ref: docs/plans/inventory-uploader-clear-shop-on-logout/build-event.json
---

# Build Record: Inventory Uploader — Clear Shop On Logout

## Outcome Contract

- **Why:** If two different staff members use the same computer, the second person logging in could accidentally see the first person's shop already selected. Clearing the shop on logout prevents this mix-up.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Logging out clears the stored shop selection so the next login always starts from the shop selection screen.
- **Source:** operator

## What Was Built

**TASK-01: Clear localStorage shop key on logout**

Added a logout API route (`POST /api/auth/logout`) that clears the `inventory_admin` session cookie (maxAge 0) and attempts KV-backed session revocation, failing open if KV is unavailable. Added a `LogoutButton` client component that removes `localStorage["inventory-uploader:shop"]` immediately on click (before the network call), calls the logout API, and redirects to `/login`. Wired the `LogoutButton` into `InventoryShell`'s header so it appears next to the theme toggle for all authenticated pages.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter @acme/inventory-uploader typecheck` | Pass | Types clean including new route and component |

## Workflow Telemetry Summary

None: micro-build lane; telemetry recorded via post-build scripts.

## Validation Evidence

### TASK-01
- TC-01-A: `localStorage.removeItem(SHOP_STORAGE_KEY)` called in `LogoutButton.handleLogout` before the fetch, ensuring the key is removed regardless of network outcome.
- TC-01-B: `clearInventoryCookie` sets the `inventory_admin` cookie with `maxAge: 0` in the logout route response.
- TC-01-C: `window.location.assign("/login")` called after the fetch in `LogoutButton.handleLogout`.
- TC-01-D: `<LogoutButton />` rendered in `InventoryShell` header `ms-auto` row, visible on all authenticated pages.

## Engineering Coverage Evidence

| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | Sign out button added to header (`InventoryShell.client.tsx`) | Compact styling consistent with existing operator-tool header controls |
| UX / states | Button shows "Signing out…" while busy; disabled during request | Prevents double-submit |
| Security / privacy | localStorage cleared client-side; cookie cleared server-side via `clearInventoryCookie`; KV revocation attempted | Fail-open on KV unavailability — cookie expiry is still enforced |
| Logging / observability / audit | `inventoryLog("info", "logout", {})` on success; `inventoryLog("warn", "logout_revocation_skipped", {...})` on KV failure | Consistent with existing `inventoryLog` patterns |
| Testing / validation | Typecheck passes; manual acceptance criteria defined in micro-build.md | No jest tests added (micro-build lane; straightforward client-side remove + API call) |
| Data / contracts | `SHOP_STORAGE_KEY` constant reused from `inventory-utils.ts` — no new data contracts | Key cleared: `"inventory-uploader:shop"` |
| Performance / reliability | Logout clears localStorage before fetch so even a failed network call leaves a clean state | No performance impact |
| Rollout / rollback | Revert 3 files: `logout/route.ts`, `LogoutButton.client.tsx`, `InventoryShell.client.tsx`. No DB migrations. | Safe to roll back |

## Scope Deviations

None.
