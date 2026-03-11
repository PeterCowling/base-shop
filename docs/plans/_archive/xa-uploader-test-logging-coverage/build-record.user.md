# Build Record — xa-uploader-test-logging-coverage

**Completed:** 2026-03-11
**Plan:** docs/plans/xa-uploader-test-logging-coverage/plan.md

## Outcome Contract

- **Why:** The XA upload golden path had no structured logging and key paths were untested, making production failures invisible and regressions undetectable.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** xa-uploader golden path emits structured log events for production diagnosis, and deterministic test scenarios prevent silent regression across the core upload pipeline.
- **Source:** operator

## Build Summary

Six tasks completed in two sessions across 2026-03-11.

**Group A — Structured logging:**
- TASK-01: Created `apps/xa-uploader/src/lib/uploaderLogger.ts` — minimal structured JSON-line logger, Cloudflare Workers compatible, suppressed in test env
- TASK-02: Instrumented four server-side files — images/route.ts (upload_start/success/failed), publish/route.ts (publish_start/complete/error with durationMs), deployHook.ts (deploy_hook_triggered/retry/failed/exhausted with masked hookUrl), catalogDraftContractClient.ts (sync_lock_failed, read_snapshot_error, write_snapshot_error)
- TASK-03: Instrumented catalogConsoleActions.ts with save_start/conflict/success/error log events

**Group B — Golden path tests:**
- TASK-04: Created catalogConsoleActions.test.ts (B1: conflict retry, B2: image merge cycle); extended products/[slug]/route.test.ts (B3: session expiry → 404 on GET+DELETE); extended route.publish.test.ts (B4: unknown publishState normalises to "live", "out_of_stock" accepted); extended currency-rates/route.test.ts (B5: null rates → {ok:true, rates:null}, unconfigured → 503)
- TASK-05: Extended rateLimit.test.ts (C1: applyRateLimitHeaders headers on allowed/denied, rateLimit() exhaustion)
- TASK-06: Extended route.cloud-publish.test.ts (C2: strict mode + bucket null → 400, strict mode + missing keys → 400); extended sync/route.test.ts (C3: confirmEmptyInput:true bypasses empty-catalog 409); extended middleware.test.ts (C4: malformed cookie doesn't crash, still 404/passthrough); extended CatalogProductImagesFields.test.ts (C5: tuple reorder in sync, promote-to-main via sequential steps)

**Total new tests:** 16 scenarios across 6 test files (1 new + 5 extended)

## Engineering Coverage Evidence

- `scripts/validate-engineering-coverage.sh docs/plans/xa-uploader-test-logging-coverage/plan.md` → `{"valid":true,"skipped":false,"artifactType":"plan","track":"code","errors":[],"warnings":[]}`
- `pnpm --filter @apps/xa-uploader typecheck` → passes (no errors)
- `pnpm --filter @apps/xa-uploader lint` → passes (0 errors, 1 pre-existing warning in UploaderShell.client.tsx)
- Bug scan: 0 findings on changed files

## Notable Decisions Made During Build

- `upload_start` log placed after `isUploadFileLike` guard (not before) — `file` variable only narrowed after the guard
- Import-sort ESLint autofix required for deployhook.ts and catalogDraftContractClient.ts after adding uploaderLogger import
- B6 (concurrent sync lock 409) already existed in sync/route.test.ts — no duplicate added
- C5 tests placed in CatalogProductImagesFields.test.ts testing `reorderPipeEntry` tuple alignment; image promote modelled as two sequential up-reorder steps since `movePipeEntryToFront` is not exported

## Workflow Telemetry Summary

| Stage | Records | Avg modules | Avg context bytes | Avg artifact bytes | Token coverage |
|---|---:|---:|---:|---:|---:|
| lp-do-plan | 1 | 1.00 | 59284 | 37066 | 0.0% |
| lp-do-build | 1 | 2.00 | 80230 | 0 | 0.0% |

- Context input bytes: 139514 | Artifact bytes: 37066 | Modules counted: 3 | Deterministic checks: 3
- Token measurement not captured (no runtime usage available)
