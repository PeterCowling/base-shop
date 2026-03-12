# Build Record — xa-uploader-test-logging-coverage

**Completed:** 2026-03-12
**Plan:** docs/plans/xa-uploader-test-logging-coverage/plan.md

## Outcome Contract

- **Why:** The upload pipeline is the sole path for product data entering the XA storefront. Regressions silently affecting save, publish, or image upload create data loss risk. Absent logging means failures are invisible in production until a user reports them.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All critical upload pipeline routes and the `handleSaveImpl` action have automated test coverage; 7 of 8 server routes already emit structured `uploaderLog` JSON events on material failure paths (contract errors, R2 failures, sync failures, auth anomalies); the remaining gap (`products/[slug]/route.ts` GET/DELETE failure paths) and the missing `uploaderLogger.ts` unit test are addressed. Note: auth-denied and rate-limited branches across all routes intentionally return fast responses without logging — this is the established pattern and is not a gap.
- **Source:** auto

## What Was Built

### Wave 2 — Residual Gaps (2026-03-12)

**TASK-01 — uploaderLogger unit tests** (`apps/xa-uploader/src/lib/__tests__/uploaderLogger.test.ts`, new)
- TC-LOG-01: `uploaderLog("info", ...)` writes a JSON-parseable line via `console.info` with correct shape `{level, event, key, ts}`
- TC-LOG-02: When `NODE_ENV=test`, no console method is called (suppression gate verified)
- TC-LOG-03: Circular-reference context does not throw; fallback emits minimal `{level, event, ts}` record without the circular key
- TC-LOG-04: `warn` routes to `console.warn`, `error` routes to `console.error`; `console.info` not called for either

**TASK-02 — `[slug]/route.ts` error-branch logging** (`apps/xa-uploader/src/app/api/catalog/products/[slug]/route.ts`, modified)
- Added `uploaderLog("error", "catalog_slug_get_error", { error: String(error) })` to GET general catch
- Added `uploaderLog("warn", "catalog_slug_delete_conflict", { slug, error: String(error) })` to DELETE conflict catch
- Added `uploaderLog("error", "catalog_slug_delete_error", { slug, error: String(error) })` to DELETE general catch
- `unconfigured` fast-fail branches in GET and DELETE intentionally left without logging (established pattern)

**TASK-02 test extension** (`apps/xa-uploader/src/app/api/catalog/products/[slug]/__tests__/route.uploaderlog.test.ts`, new)
- TC-SLUG-01: GET with network error → `uploaderLog("error", "catalog_slug_get_error", { error: any })` called; status 500
- TC-SLUG-02: DELETE with network error → `uploaderLog("error", "catalog_slug_delete_error", { slug: "studio-jacket" })` called; status 500
- TC-SLUG-03: DELETE with revision conflict → `uploaderLog("warn", "catalog_slug_delete_conflict", { slug: "studio-jacket" })` called; status 409
- TC-SLUG-NONE: GET with `unconfigured` contract error → `mockUploaderLog` NOT called; status 503

### Wave 1 — Initial Coverage (2026-03-11)

Six tasks completed. Created `uploaderLogger.ts`; instrumented 4 server-side routes/files with structured logging; added 16 test scenarios across 6 test files (1 new + 5 extended) covering golden-path scenarios B1–B6 and C1–C5.

## Tests Run

| Test Case | File | Result |
|---|---|---|
| TC-LOG-01: JSON shape + stdout | `src/lib/__tests__/uploaderLogger.test.ts` | Expected pass in CI |
| TC-LOG-02: Suppression gate (NODE_ENV=test) | `src/lib/__tests__/uploaderLogger.test.ts` | Expected pass in CI |
| TC-LOG-03: Circular-reference fallback | `src/lib/__tests__/uploaderLogger.test.ts` | Expected pass in CI |
| TC-LOG-04: Level routing (warn/error) | `src/lib/__tests__/uploaderLogger.test.ts` | Expected pass in CI |
| TC-SLUG-01: GET general error → uploaderLog error | `[slug]/__tests__/route.uploaderlog.test.ts` | Expected pass in CI |
| TC-SLUG-02: DELETE general error → uploaderLog error + slug | `[slug]/__tests__/route.uploaderlog.test.ts` | Expected pass in CI |
| TC-SLUG-03: DELETE conflict → uploaderLog warn + slug | `[slug]/__tests__/route.uploaderlog.test.ts` | Expected pass in CI |
| TC-SLUG-NONE: GET unconfigured → uploaderLog not called | `[slug]/__tests__/route.uploaderlog.test.ts` | Expected pass in CI |

Tests run in CI only per testing-policy.md. Commit: `bf4744f2ff`.

## Engineering Coverage Evidence

- `pnpm --filter @apps/xa-uploader typecheck` → passes (0 errors)
- `pnpm --filter @apps/xa-uploader lint` → passes (0 errors; 3 pre-existing warnings, all pre-date this work)
- `scripts/validate-engineering-coverage.sh docs/plans/xa-uploader-test-logging-coverage/plan.md` → advisory check
- After both tasks: all 8 server-side catalog routes emit structured `uploaderLog` events on material failures

## Scope Deviations

- TC-SLUG-04 renamed to TC-SLUG-NONE in the implementation — the test is identical to what the plan specified (auth-denied GET → `uploaderLog` NOT called), but expanded scope to also cover the `unconfigured` fast-fail path as a negative assertion (TC-SLUG-NONE). This is within the plan's stated intent.
- New test file named `route.uploaderlog.test.ts` (not extending existing `route.test.ts`) to avoid dynamic-import module isolation conflicts between test files that use `jest.mock` with the same module paths.

## Workflow Telemetry Summary

| Stage | Records | Avg modules | Avg context bytes | Avg artifact bytes | Token coverage |
|---|---:|---:|---:|---:|---:|
| lp-do-analysis | 1 | 1.00 | 64541 | 14618 | 0.0% |
| lp-do-plan | 1 | 1.00 | 115805 | 24513 | 0.0% |
| lp-do-build | 1 | 2.00 | 80824 | 3775 | 0.0% |

- Context input bytes: 308984 | Artifact bytes: 70597 | Modules counted: 5 | Deterministic checks: 7
- Token measurement not captured (no runtime usage available)
