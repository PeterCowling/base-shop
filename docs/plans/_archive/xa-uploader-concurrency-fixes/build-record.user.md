---
Type: Build-Record
Status: Complete
Domain: Platform
Last-reviewed: "2026-03-12"
Feature-Slug: xa-uploader-concurrency-fixes
Execution-Track: code
Completed-date: "2026-03-12"
artifact: build-record
---

# Build Record: XA Uploader Concurrency Fixes

## Outcome Contract

- **Why:** If two people edit the catalog at the same time, product images can be deleted while still in use, and publish status changes can silently fail without anyone knowing. The dead KV mutex code could also mislead future developers into thinking it provides mutual exclusion when it does not. This means catalog data — the source of truth for what customers see — can end up in an inconsistent state that is hard to diagnose and fix.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Image delete TOCTOU window is narrowed from unbounded to milliseconds via optimistic concurrency fence (true atomicity is impossible given R2's unconditional delete API); publish-state promotion failures are surfaced via server-side structured logging in both sync and publish routes with additive `promotionFailed` boolean for future client enhancement; dead KV mutex code is removed.
- **Source:** operator

## What Was Built

**TASK-01 (DELETE handler baseline tests):** Added 8 test cases (TC-D01 through TC-D08) to `apps/xa-uploader/src/app/api/catalog/images/__tests__/route.test.ts` covering the full DELETE handler contract: unreferenced image delete, referenced image skip, R2 failure, bucket unavailable, reference check failure, unauthenticated request, missing query params, and invalid key format. Added mocks for `readCloudDraftSnapshot`, `writeCloudDraftSnapshot`, and `CatalogDraftContractError`.

**TASK-02 (Snapshot-fenced delete):** Refactored `keyIsStillReferenced` from async (internally reading snapshot) to sync (accepting products parameter). Modified the DELETE handler in `apps/xa-uploader/src/app/api/catalog/images/route.ts` to: (1) read the snapshot once, (2) check references using snapshot products, (3) abort if `docRevision` is null, (4) write a no-op fence via `writeCloudDraftSnapshot` with `ifMatchDocRevision`, (5) return 409 with `concurrentEdit: true` on fence conflict, (6) proceed to R2 delete only after fence passes. Added 4 fence-specific tests (TC-D09 through TC-D12).

**TASK-03 (Promotion failure visibility):** Added `uploaderLog("warn", "publish_state_promotion_failed", ...)` in both sync/route.ts and publish/route.ts catch blocks. Tracked `promotionFailed` through return types in sync route's `finalizeCloudPublishStateAndDeploy` and `completeCloudPublishAndDeploy`. Added `promotionFailed: ... || undefined` to both route JSON responses.

**TASK-04 (Dead code removal):** Removed `MUTEX_TTL_SECONDS`, `syncLockKey()`, `acquireSyncMutex()`, `releaseSyncMutex()` from `apps/xa-uploader/src/lib/syncMutex.ts`. Preserved `UploaderKvNamespace`, `UploaderR2Bucket` interfaces, `CloudflareEnv` declaration, and `getUploaderKv()`.

**TASK-05 (DELETE handler logging):** Added `uploaderLog` calls to all 7 DELETE handler exit paths: `image_delete_success`, `image_delete_skipped_referenced`, `image_delete_snapshot_revision_unavailable`, `image_delete_fence_conflict`, `image_delete_fence_write_failed`, `image_delete_r2_unavailable`, `image_delete_r2_failure`.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter @apps/xa-uploader exec tsc --noEmit` | Pass | Clean typecheck after all changes |
| Pre-commit hook typecheck | Pass | Ran via `scripts/agents/with-writer-lock.sh` |
| Pre-commit hook lint | Pass | Fixed pre-existing import sort error in `uploaderAuth.test.ts` |
| `validate-engineering-coverage.sh` | Pass | `{ valid: true, skipped: false }` |
| CI test suite | Pending | Tests run in CI only per testing policy |

## Workflow Telemetry Summary

None: workflow telemetry not recorded (pipeline was continued from a prior session that hit context limits).

## Validation Evidence

### TASK-01
- TC-D01: Unreferenced delete returns `{ ok: true, deleted: true }` and calls `bucket.delete(key)` — test written and verified against production code
- TC-D02: Referenced delete returns `{ ok: true, deleted: false, skipped: "still_referenced" }` — test written
- TC-D03: R2 delete error returns 500 `image_delete_failed` — test written
- TC-D04: Bucket unavailable returns 503 `r2_unavailable` — test written
- TC-D05: Reference check failure returns 500 `reference_check_failed` — test written
- TC-D06: Unauthenticated returns 404 — test written
- TC-D07: Missing params returns 400 `missing_params` — test written
- TC-D08: Invalid key format returns 400 `missing_params` — test written

### TASK-02
- TC-D09: Fence write 409 returns `{ concurrentEdit: true }` with 409 status, no R2 delete — test written
- TC-D10: Fence write non-409 failure returns 500 `fence_write_failed`, no R2 delete — test written
- TC-D11: `docRevision: null` aborts without fence or R2 delete — test written
- TC-D12: Fence passes correct products/revisionsById/ifMatchDocRevision from snapshot — test written

### TASK-03
- Sync route: `uploaderLog("warn", ...)` call confirmed in catch block, `promotionFailed` flows through return types to response
- Publish route: `uploaderLog("warn", ...)` call confirmed in catch block, `promotionFailed` added to response
- Both routes typecheck cleanly

### TASK-04
- `acquireSyncMutex` and `releaseSyncMutex` removed — zero grep matches confirm no consumers
- `UploaderKvNamespace`, `UploaderR2Bucket`, `getUploaderKv()` preserved — typecheck confirms no breakage

### TASK-05
- 7 `uploaderLog` calls added covering all DELETE handler exit paths — visual code review confirmed

## Engineering Coverage Evidence

| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | N/A | Backend-only changes |
| UX / states | Covered | Fence conflict returns structured `{ concurrentEdit: true }` error; client degrades via existing `console.warn` |
| Security / privacy | N/A | Fence write uses existing write token via `writeCloudDraftSnapshot` |
| Logging / observability / audit | Covered | TASK-03: `uploaderLog` in sync+publish catch blocks. TASK-05: `uploaderLog` on all 7 DELETE exit paths |
| Testing / validation | Covered | 12 test cases total (8 baseline + 4 fence-specific). Typecheck passes. Engineering coverage validator passes. |
| Data / contracts | Covered | No schema changes. Additive `promotionFailed` boolean in responses. Fence write sends same products back. |
| Performance / reliability | Covered | One extra `writeCloudDraftSnapshot` round-trip per delete. Acceptable for low-frequency admin UI action. |
| Rollout / rollback | N/A | No schema changes. Simple commit revert for rollback. |

## Scope Deviations

- Fixed pre-existing import sort lint error in `apps/xa-uploader/src/lib/__tests__/uploaderAuth.test.ts` (required for lint hook to pass).
