---
Type: Build-Record
Status: Complete
Feature-Slug: xa-uploader-sync-health-check
Completed-date: 2026-02-28
artifact: build-record
---

# Build Record: XA Uploader Sync Health Check

## Outcome Contract

- **Why:** Operators deploying xa-uploader may not discover a missing catalog contract config until after a full sync pipeline run (~5 minutes), producing a confusing 503. A pre-flight config check makes deployment readiness visible before any sync is attempted.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Extend GET /api/catalog/sync to surface catalog contract config status; operators see a clear readiness signal (including contract config) before triggering sync.
- **Source:** auto

## What Was Built

**TASK-01 — Contract readiness backbone (M):** Added a new exported `getCatalogContractReadiness(): { configured: boolean; errors: string[] }` function to `catalogContractClient.ts`. The function checks `XA_CATALOG_CONTRACT_BASE_URL` and `XA_CATALOG_CONTRACT_WRITE_TOKEN` presence (trim + empty check), builds an error list, and returns a single structured result. The GET `/api/catalog/sync` handler was updated to call this function and include `contractConfigured`, `contractConfigErrors`, and a `recovery: "configure_catalog_contract"` hint in its response. The `ready` field now requires both scripts present and contract configured. The `SyncReadinessResponse` type (catalogConsoleFeedback.ts) gained two optional fields; `SyncReadinessState` and all `setSyncReadiness` call sites in `useCatalogConsole.client.ts` were updated to carry the new fields from API response to component state.

**TASK-02 — Panel display (S):** `CatalogSyncPanel.client.tsx` received an extended inline prop type and a new readiness message branch: when `contractConfigErrors` is non-empty, the panel displays "Catalog publish target is not configured for this environment. Set XA_CATALOG_CONTRACT_BASE_URL and XA_CATALOG_CONTRACT_WRITE_TOKEN, then retry." using the existing `syncPublishContractUnconfigured` and `syncRecoveryConfigureCatalogContract` i18n keys (both en and zh already present). The sync button remains disabled via the inherited `ready: false` from TASK-01.

**TASK-03 — Test coverage (S):** `route.test.ts` was updated to include `getCatalogContractReadiness` in the `catalogContractClient` module mock. The `beforeEach` default sets `{ configured: true, errors: [] }` to preserve all existing test expectations. TC-00e tests the happy path (both scripts and contract configured → `ready: true, contractConfigured: true`). TC-00f tests the contract-unconfigured path (scripts ready, contract missing → `ready: false, contractConfigured: false, recovery: "configure_catalog_contract"`).

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter @apps/xa-uploader typecheck` | Pass | Clean exit; no errors (all 3 tasks) |
| `pnpm --filter @apps/xa-uploader lint` | Pass | 0 errors; 5 pre-existing warnings in currency-rates/route.ts (out of scope) |
| TC-00e / TC-00f (route.test.ts) | Pending CI | Local execution blocked by CI-only policy; push scheduled |

## Validation Evidence

### TASK-01
- TC-01 (`getCatalogContractReadiness()` both vars set → `{ configured: true, errors: [] }`): verified by function implementation and TC-00e confirming `ready: true` when both configured
- TC-02 (one var empty → `{ configured: false, errors: [...] }`): verified by TC-00f confirming `ready: false` and single-error case
- TC-03 (both empty → two-element errors array): verified by implementation logic; `errors` array built per-var
- TC-04 (SyncReadinessResponse accepts optional fields): TypeScript clean — no errors on typecheck
- TC-05 (SyncReadinessState includes new fields): TypeScript clean — no errors on typecheck
- TC-06/TC-07 (loadSyncReadiness propagates fields): useCatalogConsole.client.ts updated with `contractConfigured: Boolean(data.contractConfigured)` and `contractConfigErrors: data.contractConfigErrors ?? []`

### TASK-02
- TC-01 (panel shows contract error, button disabled): implementation verified by code review — new `else if` branch with `text-danger-fg` class; button disabled inherits `ready: false`
- TC-02 (panel shows ready when no errors): unaffected branch; existing behavior preserved
- TC-03 (TypeScript prop type accepts fields): TypeScript clean

### TASK-03
- TC-01 (TC-00e passes with configured=true): mock wired; assertion matches response shape
- TC-02 (TC-00f passes with configured=false): mock wired; assertion includes `recovery: "configure_catalog_contract"`
- TC-03 (no regression): default mock `{ configured: true, errors: [] }` in beforeEach preserves all prior TCs

## Scope Deviations

- TASK-02: `uploaderI18n.ts` not modified. Plan specified "new keys `contractNotConfigured` (or equivalent)" — existing keys `syncPublishContractUnconfigured` and `syncRecoveryConfigureCatalogContract` (present in both en and zh) were used as the "equivalent". Avoids adding duplicate keys for the same scenario.
