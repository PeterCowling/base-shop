---
Type: Build-Record
Status: Complete
Feature-Slug: xa-catalog-workflow-fixes
Completed-date: 2026-03-03
artifact: build-record
Build-Event-Ref: docs/plans/xa-catalog-workflow-fixes/build-event.json
---

# Build Record: XA Catalog Workflow Fixes

## Outcome Contract

- **Why:** Post-rebuild audit revealed gaps in the XA catalog workflow. Live product demotion risk means a single accidental incomplete save can silently remove products from the store. Missing session UI blocks multi-storefront operation.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** XA catalog workflow is production-safe — live products cannot be silently unpublished, console has storefront selector and logout, sync error handling covers all confirmation codes, and dead ZIP/submission code is removed.
- **Source:** operator

## What Was Built

**Dead code removal (TASK-01):** Deleted 14 files of orphaned ZIP/submission code — 3 core modules (`CatalogSubmissionPanel`, `catalogSubmissionClient`, `submissionZip`), 4 API route files (`submission/route.ts` + status + download routes), and 7 test files. Cleaned 3 modified files (`catalogConsoleActions.ts`, `catalogConsoleFeedback.ts`, `useCatalogConsole.client.ts`) by removing all submission imports, types, state, and handlers. Reduced the `ActionDomain` union from 4 to 3 members. Net removal: ~2000 lines of dead code.

**Live product unpublish protection (TASK-02):** Added a `wouldUnpublish()` predicate to the products API route that detects when saving would demote a live product to draft. The POST handler now returns a 409 `would_unpublish` response requiring explicit confirmation before proceeding. The client-side `handleSaveImpl()` intercepts this 409, shows a browser confirmation dialog, and retries with `confirmUnpublish: true` if the operator accepts. The `derivePublishState()` function remains unchanged — the predicate is a separate check.

**Console header (TASK-03):** Added a `ConsoleHeader` component to `CatalogConsole.client.tsx` that displays the current storefront name and a logout button above the tab navigation. Includes conditional dropdown for future multi-storefront support (currently dormant — single storefront `xa-b`). Uses existing `gate-*` design tokens for visual consistency.

**Sync confirmation fix (TASK-04):** Expanded the client-side sync confirmation handler from matching only `catalog_input_empty` to an explicit allowlist (`CONFIRMABLE_SYNC_ERRORS`) that also covers `no_publishable_products`. Each error code now shows a specific confirmation message. Unknown 409 codes fall through to the error display path rather than being silently confirmed.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter xa-uploader exec tsc --noEmit` | Pass | 0 errors |
| `pnpm --filter xa-uploader lint` | Pass (pre-existing only) | 5 pre-existing errors in UploaderHome, CatalogProductBagFields, CatalogProductBaseFields; 1 new warning (min-tap-size on logout button, acceptable) |
| `grep -r "submission" apps/xa-uploader/src/` | Pass | Only i18n keys remain (acceptable — unused keys don't cause errors) |

## Validation Evidence

### TASK-01
- TC-01: `grep -r "submission" apps/xa-uploader/src/` → only i18n key references in `uploaderI18n.ts` (acceptable dead strings)
- TC-02: `tsc --noEmit` → 0 errors
- TC-03: lint → 0 new errors (5 pre-existing in unrelated files)
- Post-build: Mode 2 degraded, Attempt 1, Pass

### TASK-02
- TC-01: `wouldUnpublish()` returns true for `publishState:"live"` + `!isPublishReady` → 409 `would_unpublish` response
- TC-02: With `confirmUnpublish:true` → save proceeds, `derivePublishState()` returns `"draft"`
- TC-03: Live + complete data → `wouldUnpublish()` returns false → save proceeds, stays `"live"`
- TC-04: Draft + incomplete → no warning (only live→draft triggers protection)
- TC-05: Ready + incomplete → demotes to draft (no warning — not live)
- Post-build: Mode 2 degraded, Attempt 1, Pass

### TASK-03
- TC-01: `ConsoleHeader` renders in authenticated branch with storefront label + logout button
- TC-02: Logout button `onClick` calls `state.handleLogout()` → wired to `handleLogoutImpl()`
- TC-03: Unauthenticated branch returns `CatalogLoginForm` without `ConsoleHeader`
- Post-build: Mode 1 degraded (no dev server), Attempt 1, Pass

### TASK-04
- TC-01: `catalog_input_empty` → `syncConfirmEmptyCatalogSync` message (existing behavior preserved)
- TC-02: `no_publishable_products` → `syncConfirmNoPublishableProducts` message (new behavior)
- TC-03: After confirm → `runSyncRequest(true)` retry with `confirmEmptyInput: true`
- TC-04: Unknown 409 codes not in `CONFIRMABLE_SYNC_ERRORS` → fall through to error display
- Post-build: Mode 2 degraded, Attempt 1, Pass

## Scope Deviations

- Removed unused `reason` parameter from `getCatalogApiErrorMessage()` in `catalogConsoleFeedback.ts` — cleanup discovered during lint of TASK-01 changes. Minimal scope expansion, same file already modified.
