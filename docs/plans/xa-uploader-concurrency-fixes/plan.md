---
Type: Plan
Status: Active
Domain: Platform
Workstream: Engineering
Created: "2026-03-12"
Last-reviewed: "2026-03-12"
Last-updated: "2026-03-12"
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-uploader-concurrency-fixes
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 87%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/xa-uploader-concurrency-fixes/analysis.md
---

# XA Uploader Concurrency Fixes Plan

## Summary

This plan addresses three issues in the xa-uploader catalog pipeline: (1) an image DELETE TOCTOU race condition where `keyIsStillReferenced()` and `deletePersistedImageKey()` execute without atomicity, allowing a concurrent product save to assign an image between the reference check and the R2 delete; (2) insufficient severity for publish-state promotion failures in both `sync/route.ts` and `publish/route.ts`, where failures are pushed as warning strings with no server-side logging; (3) dead KV mutex functions (`acquireSyncMutex`/`releaseSyncMutex`) that are exported but never imported. The chosen approach uses a snapshot-fenced delete (optimistic concurrency gate via `writeCloudDraftSnapshot` with `ifMatchDocRevision`) to narrow the TOCTOU window from unbounded to milliseconds by detecting concurrent snapshot mutations before the R2 delete proceeds. True atomicity is impossible given R2's unconditional delete API.

## Active tasks
- [x] TASK-01: Add DELETE handler baseline tests (Complete 2026-03-12)
- [ ] TASK-02: Implement snapshot-fenced delete
- [x] TASK-03: Elevate promotion failure visibility (Complete 2026-03-12)
- [x] TASK-04: Remove dead KV mutex functions (Complete 2026-03-12)
- [ ] TASK-05: Add DELETE handler logging

## Goals
- Narrow the image DELETE TOCTOU window from unbounded to milliseconds via an optimistic concurrency fence, significantly reducing the risk of deleting an image while it is concurrently being assigned to a product.
- Elevate promotion failure severity in both sync and publish routes so the operator receives a clear signal via server logs and an additive response field.
- Remove dead KV mutex functions to prevent future misuse.

## Non-goals
- Rewriting the sync pipeline's existing cloud sync lock mechanism.
- Supporting real-time multi-user concurrent editing.
- Changing the image upload (POST) path.
- Adding `acquireCloudSyncLock` to product save routes.
- Client-side UI changes for image delete failure visibility (acceptable degradation via existing `console.warn`).

## Constraints & Assumptions
- Constraints:
  - R2 `delete()` is unconditional — no etag-based or conditional-delete API.
  - KV does not support compare-and-set.
  - `acquireCloudSyncLock` is only used by sync and publish routes. Product save routes use `writeCloudDraftSnapshot` with `ifMatchDocRevision` but do NOT acquire the sync lock.
  - Client-side image delete UI (`CatalogProductImagesFields.client.tsx`, line 253) logs non-OK DELETE responses to `console.warn` only.
  - The promotion failure client contract expects `warnings?: string[]` in `catalogConsoleFeedback.ts` (line 68). Changing the shape requires coordinated client updates.
- Assumptions:
  - Single-operator or very small team editing pattern. Concurrent sessions are rare but possible during batch cleanup.
  - The catalog contract service (`writeCloudDraftSnapshot` with `ifMatchDocRevision`) provides reliable optimistic concurrency.
  - The contract service accepts a "no-op" fence write (same products, same revisions, with `ifMatchDocRevision` set) without error. If it rejects no-content-diff writes, the DELETE handler should abort and return an error (image preserved). Mutating `revisionsById` is not safe — those are per-product optimistic concurrency values used by product save routes.

## Inherited Outcome Contract

- **Why:** If two people edit the catalog at the same time, product images can be deleted while still in use, and publish status changes can silently fail without anyone knowing. The dead KV mutex code could also mislead future developers into thinking it provides mutual exclusion when it does not. This means catalog data — the source of truth for what customers see — can end up in an inconsistent state that is hard to diagnose and fix.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Image delete TOCTOU window is narrowed from unbounded to milliseconds via optimistic concurrency fence (true atomicity is impossible given R2's unconditional delete API); publish-state promotion failures are surfaced via server-side structured logging in both sync and publish routes with additive `promotionFailed` boolean for future client enhancement; dead KV mutex code is removed.
- **Source:** operator

## Analysis Reference
- Related analysis: `docs/plans/xa-uploader-concurrency-fixes/analysis.md`
- Selected approach inherited:
  - Option A: Snapshot-fenced delete (optimistic concurrency gate) — read snapshot, capture `docRevision`, check references, fence write with `ifMatchDocRevision`, then delete from R2 only if fence succeeds. This narrows the TOCTOU window to milliseconds (between fence write completion and R2 delete completion), compared to the current unbounded window. A truly atomic delete is impossible given R2's unconditional delete API and the absence of image-key reservation in the contract service.
- Key reasoning used:
  - Sync-lock-only (Option B) does not protect against product save routes, which mutate `imageFiles` without the sync lock.
  - Soft-delete (Option C) introduces disproportionate complexity for a low-likelihood race.
  - Uses the same optimistic concurrency mechanism already used by product save routes.
  - No option achieves true atomicity given R2 constraints. The fence provides the best available protection by detecting concurrent mutations that occurred before the fence write.

## Selected Approach Summary
- What was chosen:
  - Snapshot-fenced delete with fence-before-delete ordering. Read snapshot, check references, write a no-op fence update with `ifMatchDocRevision`. If the fence write succeeds (no concurrent mutation detected up to this point), proceed to R2 delete. If the fence write 409-conflicts, abort the delete — image is preserved. Note: a narrow residual window exists between fence write completion and R2 delete completion where a concurrent product save could still assign the image. This is a significant narrowing from the current unbounded TOCTOU but not true atomicity, which is impossible given R2's unconditional delete API.
  - Promotion failure: add `uploaderLog("warn", ...)` in both sync and publish routes, plus additive `promotionFailed: true` boolean in response. Keep `warnings` array shape unchanged.
  - Dead code removal: remove `acquireSyncMutex` and `releaseSyncMutex` from `syncMutex.ts`, preserve `UploaderKvNamespace`, `UploaderR2Bucket`, and `getUploaderKv()`.
- Why planning is not reopening option selection:
  - Analysis compared 4 options with clear elimination rationale. The chosen approach was evaluated against all concurrent mutation vectors (not just sync/publish). No new evidence contradicts the analysis.

## Fact-Find Support
- Supporting brief: `docs/plans/xa-uploader-concurrency-fixes/fact-find.md`
- Evidence carried forward:
  - DELETE handler at `images/route.ts` lines 275-321 has zero test coverage and no lock/fence mechanism.
  - `writeCloudDraftSnapshot` with `ifMatchDocRevision` returns 409 on revision conflict (confirmed at `catalogDraftContractClient.ts` line 295).
  - `acquireSyncMutex`/`releaseSyncMutex` have zero imports outside `syncMutex.ts`.
  - `publish_state_promotion_failed` pattern exists at `sync/route.ts` line 189 and `publish/route.ts` line 150.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add DELETE handler baseline tests | 90% | M | Pending | - | TASK-02 |
| TASK-02 | IMPLEMENT | Implement snapshot-fenced delete (fence-before-delete) | 85% | M | Pending | TASK-01 | TASK-05 |
| TASK-03 | IMPLEMENT | Elevate promotion failure visibility in sync + publish routes | 85% | S | Pending | - | - |
| TASK-04 | IMPLEMENT | Remove dead KV mutex functions | 95% | S | Pending | - | - |
| TASK-05 | IMPLEMENT | Add DELETE handler logging | 85% | S | Pending | TASK-02 | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | N/A — no UI changes in this plan | - | Backend-only changes |
| UX / states | No new UI states. On fence conflict, DELETE returns structured error; client logs to console.warn (existing behavior) — image preserved (safe outcome). | TASK-02 | Graceful degradation, no client changes needed |
| Security / privacy | N/A — no new auth surfaces. Fence write uses existing write token. | - | Same auth path as product saves |
| Logging / observability / audit | Required — add `uploaderLog` for DELETE operations and promotion failure server-side logging | TASK-03, TASK-05 | Uses existing `uploaderLog` pattern |
| Testing / validation | Required — baseline DELETE tests (TASK-01), fence mechanism tests (TASK-02), promotion failure tests (TASK-03) | TASK-01, TASK-02, TASK-03 | DELETE handler currently has zero test coverage |
| Data / contracts | Required — no schema changes. Fence write uses existing `writeCloudDraftSnapshot` with `ifMatchDocRevision`. Additive `promotionFailed` boolean in response. | TASK-02, TASK-03 | `promotionFailed` is additive — does not break existing client parsing |
| Performance / reliability | Required — fence write adds one extra `writeCloudDraftSnapshot` round-trip per delete. Acceptable for admin UI action. | TASK-02 | Low-frequency operation |
| Rollout / rollback | No schema changes — rollback is a simple commit revert. | - | Clean rollback path |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-03, TASK-04 | - | All independent; can execute in parallel |
| 2 | TASK-02 | TASK-01 | Needs baseline tests before modifying DELETE handler |
| 3 | TASK-05 | TASK-02 | Logging added after fence mechanism is in place |

## Tasks

### TASK-01: Add DELETE handler baseline tests
- **Type:** IMPLEMENT
- **Deliverable:** New test cases in `apps/xa-uploader/src/app/api/catalog/images/__tests__/route.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-12)
- **Affects:** `apps/xa-uploader/src/app/api/catalog/images/__tests__/route.test.ts`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 90%
  - Implementation: 90% - Test file already exists with mock patterns for auth, R2 bucket, and rate limiting. DELETE handler needs mocking of `readCloudDraftSnapshot` (via `catalogDraftContractClient`). Existing mock patterns in `route.test.ts` are clear.
  - Approach: 95% - Standard test-first approach. No design ambiguity.
  - Impact: 90% - Establishes regression baseline before modifying DELETE handler. Direct risk reduction.
- **Acceptance:**
  - [ ] DELETE handler has tests for: referenced-image skip, unreferenced-image delete, R2 failure, reference-check failure, rate limiting, unauthenticated request, missing query params, invalid key format
  - [ ] Tests use existing mock patterns from the POST handler tests in the same file
  - [ ] All new tests pass in CI
- **Engineering Coverage:**
  - UI / visual: N/A — test-only change
  - UX / states: N/A — test-only change
  - Security / privacy: N/A — test-only change
  - Logging / observability / audit: N/A — test-only change
  - Testing / validation: Required — this IS the testing task. Covers DELETE handler happy path, skip-referenced, R2 failure, reference-check failure, auth, params validation.
  - Data / contracts: N/A — test-only change
  - Performance / reliability: N/A — test-only change
  - Rollout / rollback: N/A — test-only change
- **Validation contract (TC-01):**
  - TC-01: Unreferenced image DELETE -> returns `{ ok: true, deleted: true }`, calls `bucket.delete(key)`
  - TC-02: Referenced image DELETE -> returns `{ ok: true, deleted: false, skipped: "still_referenced" }`, does NOT call `bucket.delete`
  - TC-03: R2 bucket.delete throws -> returns 500 with `error: "upload_failed"`, `reason: "image_delete_failed"`
  - TC-04: R2 bucket unavailable (media bucket throws "media bucket unavailable") -> returns 503 `r2_unavailable`
  - TC-05: Reference check throws -> returns 500 with `reason: "reference_check_failed"`
  - TC-06: Unauthenticated DELETE -> returns 404
  - TC-07: Missing query params -> returns 400 `missing_params`
  - TC-08: Invalid key format (traversal, wrong prefix) -> returns 400 `missing_params`
- **Execution plan:** Red -> Green -> Refactor
  - Red: Write all TC-01 through TC-08 test cases. They should pass against current code (no modifications to production code in this task).
  - Green: Verify all tests pass. These are baseline tests — no code changes required.
  - Refactor: Extract shared DELETE request builders if repetitive.
- **Planning validation (required for M/L):**
  - Checks run: Verified existing test file structure at `apps/xa-uploader/src/app/api/catalog/images/__tests__/route.test.ts`. Confirmed mock patterns for `hasUploaderSession`, `getMediaBucket`, rate limit clear. Identified that `readCloudDraftSnapshot` needs mocking (imported from `../../../../lib/catalogDraftContractClient`).
  - Validation artifacts: Existing test file (269 lines, POST-only), mock structure confirmed.
  - Unexpected findings: None.
- **Scouts:** None: test file and mock patterns already confirmed in planning validation.
- **Edge Cases & Hardening:**
  - Key with path traversal (`..`) — already handled by `parseDeleteQueryParams` validation (line 138).
  - Key with wrong prefix (not `images/` or `<storefront>/`) — already handled (line 141).
  - Key with fewer than 3 segments — already handled (line 144).
- **What would make this >=90%:**
  - Already at 90%. Would reach 95% with confirmed mock for `readCloudDraftSnapshot` working in test isolation.
- **Rollout / rollback:**
  - Rollout: Test-only change, no production impact.
  - Rollback: Revert commit removes tests only.
- **Documentation impact:**
  - None.
- **Notes / references:**
  - Must mock `readCloudDraftSnapshot` from `../../../../lib/catalogDraftContractClient` to return a snapshot with products containing `imageFiles` fields.
  - Must mock `deletePersistedImageKey` indirectly via `getMediaBucket` mock (already exists as `mockBucket`).
- **Build evidence (2026-03-12):**
  - Added 8 test cases (TC-D01 through TC-D08) covering all acceptance criteria.
  - Added `readCloudDraftSnapshotMock` with `jest.mock("../../../../../lib/catalogDraftContractClient", ...)`.
  - Added `mockBucketDelete` to shared `mockBucket` object.
  - Added `makeDeleteRequest` helper function.
  - All tests written against existing production DELETE handler — no production code changes in this task.

### TASK-02: Implement snapshot-fenced delete (fence-before-delete)
- **Type:** IMPLEMENT
- **Deliverable:** Modified DELETE handler in `apps/xa-uploader/src/app/api/catalog/images/route.ts` + new fence tests
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/xa-uploader/src/app/api/catalog/images/route.ts`, `apps/xa-uploader/src/app/api/catalog/images/__tests__/route.test.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-05
- **Confidence:** 85%
  - Implementation: 85% - `writeCloudDraftSnapshot` with `ifMatchDocRevision` is well-understood (used by product saves and sync/publish routes). Fence-before-delete ordering is straightforward. Need to verify no-op fence write acceptance.
  - Approach: 90% - Analysis settled this decisively. Fence-before-delete ordering is strictly safer than delete-before-fence. A narrow residual window exists between fence completion and R2 delete, but this is the best available approach given R2's unconditional delete API.
  - Impact: 85% - Narrows the TOCTOU window from unbounded to milliseconds. Detects concurrent mutations that occurred before the fence write. True atomicity is impossible given R2 constraints.
- **Acceptance:**
  - [ ] DELETE handler reads snapshot and captures `docRevision` before reference check
  - [ ] After confirming image is unreferenced, DELETE handler writes a no-op fence update with `ifMatchDocRevision`
  - [ ] If fence write succeeds (no concurrent mutation), R2 delete proceeds
  - [ ] If fence write returns 409 (concurrent mutation detected), DELETE aborts without deleting from R2
  - [ ] Fence write failure (non-409 errors) is handled gracefully — DELETE aborts, returns error
  - [ ] If `docRevision` is null after snapshot read, DELETE aborts without fence write or R2 delete
  - [ ] Existing baseline tests from TASK-01 still pass (regression)
  - [ ] New fence-specific tests added and passing
- **Engineering Coverage:**
  - UI / visual: N/A — backend-only
  - UX / states: Required — on fence conflict, DELETE returns structured error indicating concurrent edit detected. Client logs non-OK to `console.warn` (existing behavior). Image is preserved (safe outcome). No new UI states.
  - Security / privacy: N/A — fence write uses existing write token via `writeCloudDraftSnapshot`
  - Logging / observability / audit: N/A — logging deferred to TASK-05
  - Testing / validation: Required — fence write success, fence write 409 conflict, fence write non-409 failure, regression against TASK-01 baseline
  - Data / contracts: Required — no schema changes. Fence write sends same products back with `ifMatchDocRevision`. Only `docRevision` advances.
  - Performance / reliability: Required — one extra `writeCloudDraftSnapshot` round-trip per delete. Acceptable for admin UI action (low frequency).
  - Rollout / rollback: N/A — no schema changes, simple commit revert
- **Validation contract (TC-02):**
  - TC-01: Unreferenced image + fence write succeeds -> R2 delete proceeds, returns `{ ok: true, deleted: true }`
  - TC-02: Unreferenced image + fence write 409 (concurrent edit) -> R2 delete NOT called, returns structured error with `concurrentEdit: true`
  - TC-03: Unreferenced image + fence write fails (non-409) -> R2 delete NOT called, returns 500 error
  - TC-04: Referenced image -> fence write NOT called, R2 delete NOT called, returns `{ ok: true, deleted: false, skipped: "still_referenced" }` (unchanged from baseline)
  - TC-05: Snapshot has `docRevision: null` -> DELETE aborts without fence write or R2 delete, returns structured error
  - TC-06: All TASK-01 baseline tests still pass (regression check)
- **Execution plan:** Red -> Green -> Refactor
  - Red: Write TC-01 through TC-04 fence-specific tests. They will fail because the fence mechanism does not yet exist.
  - Green: Modify DELETE handler to: (1) read snapshot via `readCloudDraftSnapshot`, (2) check references with `keyIsStillReferenced` using the snapshot data, (3) write no-op fence update via `writeCloudDraftSnapshot` with `ifMatchDocRevision`, (4) only delete from R2 if fence succeeds. Import `writeCloudDraftSnapshot` from `catalogDraftContractClient`. Handle 409 from fence write by catching `CatalogDraftContractError` with `code === "conflict"`.
  - Refactor: Extract fence logic into a helper if it improves readability.
- **Planning validation (required for M/L):**
  - Checks run: Verified `writeCloudDraftSnapshot` signature at `catalogDraftContractClient.ts` line 274. Accepts `{ storefront, products, revisionsById, ifMatchDocRevision }`. Returns `{ docRevision }`. Throws `CatalogDraftContractError` with `code: "conflict"` on 409 (line 296). Verified `readCloudDraftSnapshot` returns `{ products, revisionsById, docRevision }` (CloudDraftSnapshot type at line 44).
  - Validation artifacts: Function signatures confirmed. Error handling pattern confirmed.
  - Unexpected findings: The `keyIsStillReferenced` function currently calls `readCloudDraftSnapshot` internally (line 168). The fenced delete will need to read the snapshot once at the top of the handler and pass the products to the reference check, rather than calling `keyIsStillReferenced` which reads the snapshot again. This avoids a double-read and ensures the `docRevision` used for the fence matches the snapshot used for the reference check. Consumer tracing: `keyIsStillReferenced` is only called from the DELETE handler (line 301) — safe to refactor.
- **Scouts:** None: all key interfaces verified in planning validation.
- **Edge Cases & Hardening:**
  - No-op fence write rejected by contract service: DELETE handler aborts — image preserved (safe outcome). Do NOT mutate `revisionsById` as fallback (per-product concurrency values). TC-03 covers this path.
  - Network error during fence write: Same as non-409 failure — DELETE aborts, image preserved.
  - `docRevision` is null (first-ever snapshot): `writeCloudDraftSnapshot` converts `ifMatchDocRevision: null` to `undefined`, which is omitted from the request — the contract service does not enforce revision matching when the field is absent. This means the fence write would proceed unfenced, recreating the race. Mitigation: if `docRevision` is null after reading the snapshot, abort the delete and return an error. A null `docRevision` means the snapshot state is not yet established and fencing is impossible. Image deletion should only proceed when a stable snapshot with a non-null `docRevision` exists. This is the conservative, safe choice.
  - Post-fence concurrent product save: A product save could assign the image between fence write completion and R2 delete completion (millisecond window). This is a residual risk acknowledged in the analysis — true atomicity is impossible with R2's unconditional delete API. The fence narrows the window from unbounded to milliseconds. Acceptable given single-operator usage pattern.
- **What would make this >=90%:**
  - Confirmed that no-op fence write (same products, same revisions) is accepted by the contract service. This can only be verified during implementation.
- **Rollout / rollback:**
  - Rollout: Deploy with existing code path. No schema changes. No feature flag needed.
  - Rollback: Revert commit restores pre-fence DELETE behavior.
- **Documentation impact:**
  - None.
- **Notes / references:**
  - The `keyIsStillReferenced` function reads the snapshot internally. The fenced implementation should read the snapshot once, extract products for reference checking, and use the same `docRevision` for the fence write. This may mean inlining the reference check or passing the snapshot to a refactored `keyIsStillReferenced`.
  - Consumer: `keyIsStillReferenced` is called only from the DELETE handler (line 301). No other consumers.

### TASK-03: Elevate promotion failure visibility in sync + publish routes
- **Type:** IMPLEMENT
- **Deliverable:** Modified `sync/route.ts` and `publish/route.ts` + tests
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-12)
- **Affects:** `apps/xa-uploader/src/app/api/catalog/sync/route.ts`, `apps/xa-uploader/src/app/api/catalog/publish/route.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% - Two specific catch blocks to modify. `uploaderLog` is already imported in `publish/route.ts` but NOT in `sync/route.ts` — need to add import. Additive `promotionFailed` boolean is non-breaking. Note: the `SyncResponse` type in `catalogConsoleFeedback.ts` does not currently include `promotionFailed` — the field will be present in the JSON response but ignored by the existing typed client. This is intentional: the primary improvement is server-side logging visibility.
  - Approach: 95% - Conservative approach preserving existing client contract. No schema changes. The `promotionFailed` boolean is explicitly a future-enabling field, not a current UX improvement.
  - Impact: 85% - Makes promotion failures visible in server logs (operational monitoring). The `promotionFailed` boolean enables future client-side severity escalation but does not itself change what the operator sees in the UI — the operator-visible improvement comes from server-side log monitoring.
- **Acceptance:**
  - [ ] Both `sync/route.ts` (line 189) and `publish/route.ts` (line 150) call `uploaderLog("warn", "publish_state_promotion_failed", { storefront, ... })` when promotion fails
  - [ ] Both routes include `promotionFailed: true` in the response body when promotion fails
  - [ ] Existing `warnings` array shape is unchanged — `"publish_state_promotion_failed"` string still pushed to `warnings`
  - [ ] Existing tests for promotion failure warning still pass (regression)
  - [ ] New test verifies `promotionFailed` boolean is present in response when promotion fails
- **Engineering Coverage:**
  - UI / visual: N/A — backend-only
  - UX / states: N/A — no client-side changes. Additive boolean is ignored by existing client.
  - Security / privacy: N/A — no new auth surfaces
  - Logging / observability / audit: Required — `uploaderLog("warn", ...)` added for promotion failure with structured context (storefront, product count, snapshot revision)
  - Testing / validation: Required — verify `promotionFailed` boolean in response, verify existing warning string still present
  - Data / contracts: Required — additive `promotionFailed: true` boolean in response body. Does not break existing `warnings?: string[]` contract.
  - Performance / reliability: N/A — logging call is negligible
  - Rollout / rollback: N/A — additive, non-breaking. Revert removes logging and boolean.
- **Validation contract (TC-03):**
  - TC-01: Sync route promotion failure -> response includes `warnings: ["publish_state_promotion_failed"]` AND `promotionFailed: true`
  - TC-02: Publish route promotion failure -> response includes `warnings: ["publish_state_promotion_failed"]` AND `promotionFailed: true`
  - TC-03: Sync route promotion success -> response does NOT include `promotionFailed` field (or `promotionFailed: false`)
  - TC-04: Existing `route.cloud-publish.test.ts` line 312 still passes (regression)
- **Execution plan:** Red -> Green -> Refactor
  - Red: Add test for `promotionFailed: true` in sync and publish route test files.
  - Green: In both catch blocks, add `uploaderLog("warn", "publish_state_promotion_failed", { storefront, productCount, docRevision })` and set `promotionFailed = true` on the response object.
  - Refactor: None expected — change is small.
- **Scouts:** None: catch blocks and response shapes confirmed.
- **Edge Cases & Hardening:** None: change is additive and non-breaking.
- **What would make this >=90%:**
  - Already at 90%. Would reach 95% with confirmed that `promotionFailed` field does not conflict with any existing response type definition.
- **Rollout / rollback:**
  - Rollout: Deploy directly. Additive field.
  - Rollback: Revert commit.
- **Documentation impact:**
  - None.
- **Build evidence (2026-03-12):**
  - sync/route.ts: Added `uploaderLog("warn", "publish_state_promotion_failed", {...})` in catch block. Tracked `promotionFailed` via local variable through `finalizeCloudPublishStateAndDeploy` return type and `completeCloudPublishAndDeploy` return type. Added `promotionFailed: publishState.promotionFailed || undefined` to final JSON response.
  - publish/route.ts: Added `uploaderLog("warn", "publish_state_promotion_failed", {...})` in catch block. Added `promotionFailed: promotionFailed || undefined` to final JSON response.
  - `uploaderLog` was already imported in publish/route.ts. Added import in sync/route.ts (confirmed by previous session).
  - Typecheck passes cleanly.

### TASK-04: Remove dead KV mutex functions
- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/xa-uploader/src/lib/syncMutex.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-12)
- **Affects:** `apps/xa-uploader/src/lib/syncMutex.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% - Remove two exported functions and their helper. Preserve type exports and `getUploaderKv()`. Zero imports confirmed.
  - Approach: 95% - Dead code removal is unambiguous.
  - Impact: 95% - Eliminates maintenance hazard. No runtime effect.
- **Acceptance:**
  - [ ] `acquireSyncMutex` and `releaseSyncMutex` functions removed from `syncMutex.ts`
  - [ ] `syncLockKey` helper function removed (only used by mutex functions)
  - [ ] `MUTEX_TTL_SECONDS` constant removed (only used by `acquireSyncMutex`)
  - [ ] `UploaderKvNamespace`, `UploaderR2Bucket` type exports preserved
  - [ ] `getUploaderKv()` function preserved
  - [ ] TypeScript compilation passes (`pnpm typecheck`)
  - [ ] No import breaks anywhere in the codebase
- **Engineering Coverage:**
  - UI / visual: N/A — no UI impact
  - UX / states: N/A — dead code removal
  - Security / privacy: N/A — removes unused code only
  - Logging / observability / audit: N/A — no logging changes
  - Testing / validation: Required — verify no import breaks via typecheck
  - Data / contracts: N/A — no runtime contract changes
  - Performance / reliability: N/A — removes dead code
  - Rollout / rollback: N/A — dead code removal, simple revert
- **Validation contract (TC-04):**
  - TC-01: `syncMutex.ts` no longer exports `acquireSyncMutex` or `releaseSyncMutex`
  - TC-02: `syncMutex.ts` still exports `UploaderKvNamespace`, `UploaderR2Bucket`, `getUploaderKv`
  - TC-03: `pnpm typecheck` passes with no new errors
- **Execution plan:** Red -> Green -> Refactor
  - Red: N/A — deletion task, no test-first phase.
  - Green: Remove `acquireSyncMutex`, `releaseSyncMutex`, `syncLockKey`, and `MUTEX_TTL_SECONDS` from `syncMutex.ts`. Verify typecheck passes.
  - Refactor: None.
- **Scouts:** None: zero imports confirmed via grep.
- **Edge Cases & Hardening:** None: dead code removal with zero consumers.
- **What would make this >=90%:**
  - Already at 95%.
- **Rollout / rollback:**
  - Rollout: Deploy directly.
  - Rollback: Revert commit.
- **Documentation impact:**
  - None.
- **Build evidence (2026-03-12):**
  - Removed `MUTEX_TTL_SECONDS`, `syncLockKey()`, `acquireSyncMutex()`, `releaseSyncMutex()` from `syncMutex.ts`.
  - Preserved `UploaderKvNamespace`, `UploaderR2Bucket` interfaces, `CloudflareEnv` declaration, `getUploaderKv()`.
  - Typecheck passes cleanly — zero import references to removed functions confirmed.

### TASK-05: Add DELETE handler logging
- **Type:** IMPLEMENT
- **Deliverable:** Modified DELETE handler in `apps/xa-uploader/src/app/api/catalog/images/route.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/xa-uploader/src/app/api/catalog/images/route.ts`
- **Depends on:** TASK-02
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% - `uploaderLog` is already imported in the file (used by POST handler). Pattern is well-established.
  - Approach: 90% - Matches existing logging patterns in the same file.
  - Impact: 85% - Provides operational visibility into DELETE operations. Enables monitoring of fence conflicts.
- **Acceptance:**
  - [ ] `uploaderLog("info", "image_delete_success", { storefront, key })` on successful delete
  - [ ] `uploaderLog("info", "image_delete_skipped_referenced", { storefront, key })` when image is still referenced
  - [ ] `uploaderLog("warn", "image_delete_fence_conflict", { storefront, key })` when fence write 409-conflicts
  - [ ] `uploaderLog("error", "image_delete_r2_failure", { storefront, key })` on R2 delete failure
  - [ ] `uploaderLog("error", "image_delete_reference_check_failed", { storefront, key })` on reference check failure
- **Engineering Coverage:**
  - UI / visual: N/A — backend-only
  - UX / states: N/A — logging only
  - Security / privacy: N/A — no sensitive data in log entries (storefront + key only)
  - Logging / observability / audit: Required — this IS the logging task
  - Testing / validation: N/A — log output is not tested (consistent with existing uploaderLog usage patterns)
  - Data / contracts: N/A — no contract changes
  - Performance / reliability: N/A — logging calls are negligible
  - Rollout / rollback: N/A — logging only, simple revert
- **Validation contract (TC-05):**
  - TC-01: Successful delete path includes `uploaderLog("info", "image_delete_success", ...)` call
  - TC-02: Referenced-skip path includes `uploaderLog("info", "image_delete_skipped_referenced", ...)` call
  - TC-03: Fence conflict path includes `uploaderLog("warn", "image_delete_fence_conflict", ...)` call
  - TC-04: Visual code review confirms all DELETE exit paths have a corresponding log call
- **Execution plan:** Red -> Green -> Refactor
  - Red: N/A — logging additions, verified by code review not unit tests (consistent with existing pattern).
  - Green: Add `uploaderLog` calls at each DELETE handler exit path.
  - Refactor: None.
- **Scouts:** None: `uploaderLog` already imported and used in the same file.
- **Edge Cases & Hardening:** None: logging-only change.
- **What would make this >=90%:**
  - Confirmed that all exit paths have logging. Visual code review during implementation.
- **Rollout / rollback:**
  - Rollout: Deploy directly.
  - Rollback: Revert commit.
- **Documentation impact:**
  - None.

## Delivered Processes

None: this plan delivers code changes only (bug fixes and dead code removal). No new operational processes are introduced.

## Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| No-op fence write rejected by contract service | Low | Low | If rejected, DELETE handler aborts — image preserved (safe outcome). Do NOT mutate `revisionsById` as fallback (per-product concurrency values, not safe to modify without real edits). TC-03 in TASK-02 covers the non-409 failure path. |
| `docRevision` null on first snapshot | Low | Low | `writeCloudDraftSnapshot` omits `ifMatchDocRevision` when null — fence is ineffective. DELETE handler must abort when `docRevision` is null. Image preserved (safe outcome). TC covers this path. |
| Post-fence residual TOCTOU window | Low | Medium | Narrow window (milliseconds) between fence write completion and R2 delete completion where a concurrent product save could still assign the image. True atomicity is impossible with R2's unconditional delete API. The fence narrows the window from unbounded to milliseconds — acceptable given single-operator usage pattern. |
| Client silently drops concurrent-edit delete failure | Medium | Low | Image is preserved (safe outcome). Client currently logs to `console.warn`. Future client improvement documented but out of scope. |
| `promotionFailed` boolean ignored by current client | Low | Low | The `SyncResponse` type in `catalogConsoleFeedback.ts` does not include `promotionFailed`. The field is present in JSON but ignored by typed client. This is intentional — the primary improvement is server-side logging. Client type update is future scope. |
| `keyIsStillReferenced` refactoring breaks existing behavior | Low | Medium | TASK-01 baseline tests establish regression safety net before TASK-02 modifies the handler. |

## Observability
- Logging: `uploaderLog` calls added for all DELETE handler exit paths (TASK-05) and promotion failure (TASK-03)
- Metrics: None: low-frequency admin operations, log monitoring is sufficient.
- Alerts/Dashboards: None: existing log aggregation captures `uploaderLog` output.

## Acceptance Criteria (overall)
- [ ] Image DELETE TOCTOU window is narrowed via optimistic concurrency fence (fence-before-delete ordering)
- [ ] Both sync and publish routes log promotion failures with structured context
- [ ] Both sync and publish routes include `promotionFailed: true` in response on failure
- [ ] Dead KV mutex functions are removed
- [ ] All DELETE handler exit paths have logging
- [ ] All new and existing tests pass in CI
- [ ] TypeScript compilation passes

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Add DELETE handler baseline tests | Yes | None | No |
| TASK-02: Implement snapshot-fenced delete | Yes — TASK-01 provides regression baseline | [Minor] `keyIsStillReferenced` reads snapshot internally; need to refactor to share snapshot read with fence. Already documented in planning validation. | No — documented in task notes |
| TASK-03: Elevate promotion failure visibility | Yes — independent of TASK-01/02 | None | No |
| TASK-04: Remove dead KV mutex functions | Yes — independent | None | No |
| TASK-05: Add DELETE handler logging | Yes — TASK-02 provides fence mechanism | None | No |

## Decision Log
- 2026-03-12: Fence-before-delete ordering chosen over delete-before-fence. Rationale: if fence fails, image is preserved (safe outcome). Delete-before-fence risks deleting an image and then discovering a concurrent mutation. Analysis recommended fence-before-delete; planning confirms.
- 2026-03-12: `keyIsStillReferenced` refactoring scoped into TASK-02 rather than a separate task. Rationale: the refactoring is tightly coupled to the fence mechanism (need same snapshot for reference check and fence write). Separating would create an artificial dependency.
- 2026-03-12: Client-side improvement for delete failure visibility logged as out of scope. Consumer `CatalogProductImagesFields.client.tsx` unchanged because existing `console.warn` behavior preserves the image (safe degradation).

## Overall-confidence Calculation
- TASK-01: 90% * M(2) = 180
- TASK-02: 85% * M(2) = 170
- TASK-03: 85% * S(1) = 85
- TASK-04: 95% * S(1) = 95
- TASK-05: 85% * S(1) = 85
- Total: 615 / 7 = 87.9%, rounded to nearest 5: 90%
- Applying downward bias (min weighted): Overall-confidence = 87% (conservative between 85 and 90)
