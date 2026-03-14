---
Type: BuildRecord
Feature-Slug: xa-uploader-logging-console-cleanup
Build-Date: 2026-03-12
Status: Complete
---

# Build Record — XA Uploader Logging Console Cleanup

## Outcome Contract

- **Why:** When the upload tool breaks in production there is nothing to investigate — no record of what happened or why.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All xa-uploader server-side error paths emit structured log events observable via `wrangler tail`, leaving a clear trail for any production failure.
- **Source:** operator

## What Was Built

Replaced every remaining raw `console.warn` / `console.error` call in xa-uploader route handlers with structured `uploaderLog()` events. Added logging to three previously zero-coverage paths. All changes were additive — no HTTP responses or behaviour changed.

### Files changed

| File | Changes |
|---|---|
| `apps/xa-uploader/src/app/api/catalog/products/route.ts` | `logContractFailure()` body: `console.warn` → `uploaderLog("warn", "catalog_contract_request_failed", ...)`, removed `NODE_ENV` guard |
| `apps/xa-uploader/src/app/api/catalog/sync/route.ts` | `console.error` → `uploaderLog("error", "catalog_publish_failed", ...)` in `tryPublishCloudCatalogPayload`; added `uploaderLog("warn", "sync_lock_busy", ...)` before 409 lock-busy return; added `uploaderLog("error", "cloud_sync_inputs_load_failed", ...)` in both branches of `loadCloudSyncInputs` catch |
| `apps/xa-uploader/src/app/api/catalog/deploy-drain/route.ts` | Session check `.catch` → `uploaderLog("error", "deploy_drain_session_check_failed", ...)`; pending-state read `.catch` → `uploaderLog("error", "deploy_drain_pending_state_read_failed", ...)` |
| `apps/xa-uploader/src/app/api/catalog/products/bulk/route.ts` | Hoisted `storefront` before `try`; three `console.error` → `uploaderLog` (unconfigured, contract error, unexpected); added `uploaderLog("warn", "bulk_validation_errors", { errorCount, sample })` before 400 response |
| `apps/xa-uploader/src/app/api/catalog/currency-rates/route.ts` | GET catch: two `uploaderLog("error", "currency_rates_read_failed", ...)`; PUT catch: two `uploaderLog("error", "currency_rates_write_failed", ...)` |

### New log events

| Event | Level | File |
|---|---|---|
| `catalog_contract_request_failed` | warn | products/route.ts |
| `catalog_publish_failed` | error | sync/route.ts |
| `sync_lock_busy` | warn | sync/route.ts |
| `cloud_sync_inputs_load_failed` | error | sync/route.ts |
| `deploy_drain_session_check_failed` | error | deploy-drain/route.ts |
| `deploy_drain_pending_state_read_failed` | error | deploy-drain/route.ts |
| `bulk_contract_unconfigured` | error | products/bulk/route.ts |
| `bulk_contract_error` | error | products/bulk/route.ts |
| `bulk_upsert_failed` | error | products/bulk/route.ts |
| `bulk_validation_errors` | warn | products/bulk/route.ts |
| `currency_rates_read_failed` | error | currency-rates/route.ts |
| `currency_rates_write_failed` | error | currency-rates/route.ts |

## Engineering Coverage Evidence

| Coverage Area | Outcome |
|---|---|
| UI / visual | N/A — server-side only |
| UX / states | N/A — no response changes; all HTTP status codes unchanged |
| Security / privacy | Verified — no tokens, passwords, or hookUrl values appear in any log context; only storefront IDs, error codes, and stringified error messages |
| Logging / observability / audit | Complete — 12 new structured events; 0 raw console.warn/error remain in modified files (verified by grep) |
| Testing / validation | N/A — additive changes; `uploaderLog` skips in `NODE_ENV === "test"` |
| Data / contracts | N/A — no schema changes |
| Performance / reliability | N/A — console.log is synchronous; no hot-path changes |
| Rollout / rollback | N/A — additive import + call edits; safe to revert |

## Validation Evidence

- `pnpm --filter @apps/xa-uploader typecheck`: ✅ passed (0 errors)
- `pnpm --filter @apps/xa-uploader lint`: ✅ passed (0 errors, 3 pre-existing warnings)
- `grep -n "console\.(warn|error)"` on all 5 files: ✅ no matches
- `scripts/validate-engineering-coverage.sh docs/plans/xa-uploader-logging-console-cleanup/plan.md`: ✅ `{"valid":true}`

## Typecheck fix note

In `products/bulk/route.ts`, `storefront` was originally declared with `const` inside the `try` block, making it inaccessible in the `catch`. Fixed by hoisting the declaration before the `try` block (safe — `parseStorefront` is synchronous and pure).

## Workflow Telemetry Summary

# Workflow Telemetry Summary

- Feature slug: `xa-uploader-logging-console-cleanup`
- Records: 2
- Token measurement coverage: 0.0%

| Stage | Records | Avg modules | Avg context bytes | Avg artifact bytes | Token coverage |
|---|---:|---:|---:|---:|---:|
| lp-do-plan | 1 | 1.00 | 49119 | 24580 | 0.0% |
| lp-do-build | 1 | 2.00 | 76805 | 0 | 0.0% |

## Totals

- Context input bytes: 125924
- Artifact bytes: 24580
- Modules counted: 3
- Deterministic checks counted: 3
