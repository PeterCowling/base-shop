---
Type: Fact-Find
Outcome: planning
Status: Ready-for-analysis
Domain: Platform
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: xa-uploader-concurrency-fixes
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/xa-uploader-concurrency-fixes/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260312150000-C007
artifact: fact-find
Trigger-Why:
Trigger-Intended-Outcome:
---

# XA Product Image and Catalog Data Concurrency Fixes — Fact-Find Brief

## Scope

### Summary

Three issues exist in the xa-uploader catalog pipeline. One is an active runtime race condition: the image DELETE handler performs a non-atomic check-then-act sequence that can cause data loss under concurrent requests. The second is a code quality issue: a KV-based mutex in `syncMutex.ts` is dead code (exported but never called) with an acknowledged race window — it is a maintenance hazard, not a live runtime problem. The third is a UX severity issue: both the sync and publish routes catch publish-state promotion failures and surface them as warning-level strings, but the prominence is insufficient for an operator to notice or act on. The sync route itself already uses a server-side cloud sync lock (`acquireCloudSyncLock`) with 409-conflict semantics, which properly protects the main sync pipeline.

### Goals

- Make image delete safe against concurrent product edits (close the TOCTOU window between reference check and R2 delete).
- Surface publish-state promotion failures clearly to the operator instead of swallowing them as a warning string.
- Clean up the dead KV mutex code or mark it as deprecated to prevent future misuse.

### Non-goals

- Rewriting the sync pipeline's existing cloud sync lock mechanism (it works correctly).
- Supporting multi-user concurrent editing with real-time conflict resolution (out of scope for this change).
- Changing the image upload path (no concurrency issue there).

### Constraints & Assumptions

- Constraints:
  - Cloudflare R2 `delete()` is unconditional — no etag-based or conditional-delete API is available. The R2 interface in `syncMutex.ts` (line 21) confirms: `delete(key: string): Promise<void>`.
  - Cloudflare KV does not support compare-and-set or conditional writes.
  - The sync route already depends on `acquireCloudSyncLock` from `catalogDraftContractClient.ts` — any image delete locking must not conflict with this.
- Assumptions:
  - The xa-uploader is operated by a single person or very small team. Concurrent catalog sessions are rare but possible during batch cleanup operations.
  - The `acquireCloudSyncLock` mechanism provides proper server-side locking with 409 conflict semantics and is the canonical lock for catalog mutations.

## Outcome Contract

- **Why:** If two people edit the catalog at the same time, product images can be deleted while still in use, and publish status changes can silently fail without anyone knowing. The dead KV mutex code could also mislead future developers into thinking it provides mutual exclusion when it does not. This means catalog data — the source of truth for what customers see — can end up in an inconsistent state that is hard to diagnose and fix.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Image delete is atomic (delete-if-unreferenced); publish-state promotion failures are surfaced with appropriate severity (not just a warning string) in both sync and publish routes; dead KV mutex code is removed.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/xa-uploader/src/app/api/catalog/images/route.ts` — Image upload (POST) and delete (DELETE) API. The DELETE handler (lines 275-321) is the primary concurrency hazard entry point.
- `apps/xa-uploader/src/app/api/catalog/sync/route.ts` — Sync pipeline entry point. POST handler (lines 487-554) acquires the cloud sync lock, runs the sync pipeline, and calls `finalizeCloudPublishStateAndDeploy` (lines 171-203).

### Key Modules / Files

- `apps/xa-uploader/src/app/api/catalog/images/route.ts` — Image upload and delete API. Lines 164-179: `keyIsStillReferenced()` reads the full cloud draft snapshot and checks whether any product's `imageFiles` field references the key. Lines 181-187: `deletePersistedImageKey()` unconditionally calls `bucket.delete(key)` on R2. The gap between these two operations is the TOCTOU window.
- `apps/xa-uploader/src/lib/syncMutex.ts` — KV-based mutex with acknowledged race window (lines 64-75). Also exports `UploaderKvNamespace` and `UploaderR2Bucket` type interfaces used across the app. The mutex functions (`acquireSyncMutex`, `releaseSyncMutex`) are exported but never imported by any route handler.
- `apps/xa-uploader/src/app/api/catalog/sync/route.ts` — Sync pipeline. Lines 171-203: `finalizeCloudPublishStateAndDeploy` catches snapshot write failure and pushes `"publish_state_promotion_failed"` as a warning string. The warning appears in the `warnings` array of the 200 OK response. The client-side localization in `catalogConsoleActions.ts` (line 142) handles this warning string, and `action-feedback.test.tsx` (line 323) verifies it is rendered. The issue is severity/prominence, not absence of surfacing.
- `apps/xa-uploader/src/app/api/catalog/publish/route.ts` — Direct publish route. Contains the same `publish_state_promotion_failed` warning pattern (line 150). Both the sync and publish routes share this behavior — any fix must address both paths.
- `apps/xa-uploader/src/lib/catalogPublishState.ts` — `promoteDerivedPublishStatesInCloudSnapshot` iterates products and promotes publish states. Called by the sync finalize step. Pure function; no concurrency logic of its own.
- `apps/xa-uploader/src/lib/catalogDraftContractClient.ts` — Cloud draft snapshot CRUD. `writeCloudDraftSnapshot` supports `ifMatchDocRevision` for optimistic concurrency (409 on conflict). `acquireCloudSyncLock`/`releaseCloudSyncLock` provide server-side locking for the sync route.
- `apps/xa-uploader/src/lib/r2Media.ts` — Thin wrapper around `getCloudflareContext` to obtain the R2 bucket binding. No conditional-delete support.

### Patterns & Conventions Observed

- Optimistic concurrency via `ifMatchDocRevision` — evidence: `catalogDraftContractClient.ts` `writeCloudDraftSnapshot` parameter.
- Server-side lease-based locking for sync — evidence: `catalogDraftContractClient.ts` `acquireCloudSyncLock`, consumed by `sync/route.ts` line 525.
- Fail-open on KV unavailability — evidence: `syncMutex.ts` line 49 returns null, `acquireSyncMutex` line 64 treats null KV as lock-acquired.
- Rate limiting on all API routes — evidence: `rateLimit` calls in both image and sync routes.

### Data & Contracts

- Types/schemas/events:
  - `UploaderKvNamespace` — minimal KV interface (get/put/delete). Defined in `syncMutex.ts`.
  - `UploaderR2Bucket` — minimal R2 interface (put/get/head/delete). Defined in `syncMutex.ts`.
  - `CloudDraftSnapshot` — product draft state including `docRevision` for optimistic concurrency. Defined in `catalogDraftContractClient.ts`.
  - `CatalogProductDraftInput` — individual product schema including `imageFiles` comma-separated string and `publishState`. From `@acme/lib/xa`.
- Persistence:
  - R2 bucket (`XA_MEDIA_BUCKET`) for product images. Keys follow `<storefront>/<slug>/<filename>` pattern.
  - Cloud draft snapshot (via service binding `XA_CATALOG_CONTRACT_SERVICE`) for product catalog state.
  - KV (`XA_UPLOADER_KV`) for deploy pending state and (unused) sync mutex.
- API/contracts:
  - `writeCloudDraftSnapshot` accepts `ifMatchDocRevision` for optimistic concurrency. Returns 409 on conflict.
  - `acquireCloudSyncLock` returns `{ status: "busy" }` or `{ lock: CloudSyncLockLease }`.
  - R2 `delete()` is unconditional — no concurrency guard at the storage layer.

### Dependency & Impact Map

- Upstream dependencies:
  - `@acme/lib/xa` — product schema, publish state derivation (`deriveCatalogPublishState`, `isCatalogPublishableState`).
  - `@opennextjs/cloudflare` — `getCloudflareContext` for KV and R2 bindings.
  - Cloud catalog contract service — via service binding for draft snapshot CRUD.
- Downstream dependents:
  - Storefront (xa-b app) — consumes the published catalog. Broken image references from the TOCTOU race would appear as missing product images.
  - Deploy hook — triggered after successful sync+publish. Stale publish states affect what the operator sees in the editor, not the published output.
- Likely blast radius:
  - Limited to xa-uploader app. No cross-app code dependencies.
  - Storefront impact is indirect (broken image links from deleted-while-referenced images).

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (unit tests)
- Commands: `pnpm --filter @apps/xa-uploader test`
- CI integration: Standalone `xa.yml` workflow

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Image upload (POST) | Unit | `images/__tests__/route.test.ts` | 10+ test cases covering auth, validation, rate limits, happy path |
| Sync route | Unit | `sync/__tests__/route.cloud-publish.test.ts` | Cover cloud publish, conflict retry, currency rates, publish state. Includes test for `publish_state_promotion_failed` warning on `writeCloudDraftSnapshot` failure (line 312). |
| Publish route | Client-side mock | Via `action-feedback.test.tsx` (line 1009) | Tests client-side feedback rendering with a mocked publish response containing `publish_state_promotion_failed`. Note: this is a client-side mock test, not a route-level test of `publish/route.ts` itself. The publish route's server-side warning generation has no dedicated route-level test. |
| Catalog publish state | Unit | Covered via sync golden path tests | `promoteDerivedPublishStatesInCloudSnapshot` exercised indirectly |
| Client warning display | Unit | `action-feedback.test.tsx` (line 323) | Verifies sync success feedback includes `publish_state_promotion_failed` warning. `catalogConsoleActions.ts` (line 142) localizes the warning string. |

#### Coverage Gaps

- Untested paths:
  - DELETE handler in `images/route.ts` — zero test coverage. No tests for: referenced-image skip, unreferenced-image delete, R2 failure, reference-check failure.
  - `acquireSyncMutex`/`releaseSyncMutex` — no tests (dead code).
- Correction from initial research: The promotion failure warning path IS tested in `route.cloud-publish.test.ts` (line 312) and the client-side rendering is tested in `action-feedback.test.tsx` (line 323). The gap is not test coverage but rather the severity/prominence of the warning — it is surfaced as a localized string but not as an error-level alert.
- Extinct tests:
  - None identified.

#### Testability Assessment

- Easy to test:
  - DELETE handler — standard request/response mocking, already established patterns from POST handler tests.
  - Promotion failure warning — mock `writeCloudDraftSnapshot` to throw and assert warnings array.
- Hard to test:
  - Actual TOCTOU race condition — requires concurrent request interleaving, not feasible in unit tests. Can be covered by design review of the fix approach.
- Test seams needed:
  - None additional — existing mock patterns for `readCloudDraftSnapshot`, `getMediaBucket`, and `writeCloudDraftSnapshot` are sufficient.

#### Recommended Test Approach

- Unit tests for: DELETE handler (referenced skip, unreferenced delete, R2 failure, reference-check failure), promotion failure warning path.
- Integration tests for: Not required — all interactions are via mocked service bindings.
- E2E tests for: Not required for this scope.
- Contract tests for: Not required — existing optimistic concurrency contract via `ifMatchDocRevision` is already tested.

### Recent Git History (Targeted)

- `581074e4d4` — Stability, error handling, a11y, and code cleanup for xa-uploader (most recent, C008-C011 dispatch batch).
- `7bf8d2cbd7` — Added confirm-before-removing-last-image from live product. Relevant: shows existing UI safeguard for image deletion, but at the client side (does not prevent server-side race).
- `fcae38a096` — Golden path tests including conflict retry and publish state. Relevant: establishes test patterns for sync route error handling.
- `62ee135dcd` — Branch coverage tests (C2-C5). Relevant: shows test coverage approach for edge cases.

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | N/A | No UI changes needed — fixes are server-side API logic. | None. | None. |
| UX / states | Required | DELETE handler returns `{ ok: true, deleted: false, skipped: "still_referenced" }` for referenced images. Promotion failure is pushed as a warning string in both sync and publish responses. Client-side localization exists in `catalogConsoleActions.ts` (line 142) and rendering is tested in `action-feedback.test.tsx`. | Promotion failure is surfaced but only as a warning-level string. The issue is severity/prominence, not absence. DELETE error states are well-structured but untested. Same warning pattern exists in `publish/route.ts` (line 150). | Decide on appropriate severity level for promotion failure. Ensure fix covers both sync and publish routes. |
| Security / privacy | N/A | Auth (`hasUploaderSession`) and rate limiting are already applied to both image and sync routes. No new auth surfaces. | None. | None. |
| Logging / observability / audit | Required | `uploaderLog` used for upload success/failure. No logging for DELETE operations or promotion failure. | Image delete operations are unlogged. Promotion failure is silently swallowed. | Add `uploaderLog` calls for DELETE success/failure/skip. Add logging for promotion failure with snapshot revision context. |
| Testing / validation | Required | POST handler has 10+ tests. DELETE handler has zero tests. Promotion failure warning path IS tested in `route.cloud-publish.test.ts` (line 312) and client-side in `action-feedback.test.tsx` (line 323). | Critical gap: DELETE handler is completely untested. No gap in promotion failure coverage — tests exist. | Add DELETE handler tests. If promotion failure severity is changed, update existing tests accordingly. |
| Data / contracts | Required | `writeCloudDraftSnapshot` supports `ifMatchDocRevision` optimistic concurrency. R2 delete is unconditional. | Image delete has no concurrency guard. Reference check and delete are separate unguarded operations. | Evaluate: cloud sync lock wrapping, soft-delete, or snapshot-lock for image delete. |
| Performance / reliability | Required | `keyIsStillReferenced` does a full snapshot read and product scan on every delete call. Promotion failure is caught but only pushed as a warning. | Full snapshot read per delete is wasteful for batch deletes. Promotion failure warning may not reach the operator. | Batch delete should read snapshot once. Promotion failure needs prominent surfacing. |
| Rollout / rollback | N/A | Server-side logic changes only. No database migrations, no config keys, no feature flags needed. Rollback = revert the commit. | None. | None. |

## Scope Signal

- **Signal:** right-sized
- **Rationale:** Three distinct but focused fixes within a single app. Blast radius is limited to xa-uploader. No cross-app dependencies, no database migrations, no new config keys. The image delete fix requires the most design thought (soft-delete vs. snapshot-lock approach), but the solution space is well-bounded by the existing `acquireCloudSyncLock` pattern. Promotion warning fix and dead code cleanup are straightforward.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Image delete TOCTOU (route.ts DELETE handler) | Yes | None — entry point identified, mechanism traced, R2 API constraint verified. | No |
| Sync mutex dead code (syncMutex.ts) | Yes | None — confirmed zero imports of `acquireSyncMutex`/`releaseSyncMutex` outside definition file. | No |
| Publish-state promotion failure (sync/route.ts finalizeCloudPublishStateAndDeploy) | Yes | None — warning path traced, `ifMatchDocRevision` constraint verified. | No |
| Cloud sync lock (catalogDraftContractClient.ts) | Yes | None — existing lock mechanism works correctly, not in scope for changes. | No |
| R2 storage API constraints | Yes | None — confirmed R2 delete is unconditional via interface definition. | No |
| Test landscape | Yes | None — client-side warning rendering verified in `catalogConsoleActions.ts` (line 142) and `action-feedback.test.tsx` (line 323). Publish route lacks a route-level test for the warning path (client-side mock only). | No |
| catalogPublishState.ts pure function | Yes | None — function is pure, no concurrency logic needed. | No |

## Confidence Inputs

- **Implementation:** 80% — The three fixes are well-scoped. The image delete fix has two viable approaches (cloud-sync-lock wrapping or soft-delete). Both are implementable with existing patterns. Score is not higher because the optimal approach depends on analysis of trade-offs (R2 storage cost vs. lock contention).
  - To >=80: current score.
  - To >=90: finalize image delete approach after analysis comparison.

- **Approach:** 75% — Two viable approaches for image delete (lock-wrap vs. soft-delete). Promotion failure fix is straightforward (convert warning to error or retry). Dead code cleanup is trivial. Score reduced because the optimal image delete approach is not yet selected.
  - To >=80: analysis stage compares the two approaches with trade-off matrix.
  - To >=90: prototype the chosen approach and validate against edge cases.

- **Impact:** 85% — Image delete race is real but low-likelihood given single-operator pattern. Promotion failure is self-healing on next sync. Dead code has no runtime impact today. Fixing all three improves catalog reliability and reduces future-developer risk.
  - To >=80: current score.
  - To >=90: confirm frequency of batch delete operations and concurrent editing sessions from operator.

- **Delivery-Readiness:** 85% — All code paths are identified. Test patterns are established. No external dependencies or approvals needed. Existing mock infrastructure is sufficient.
  - To >=80: current score.
  - To >=90: confirm DELETE handler test setup works with existing mock patterns.

- **Testability:** 80% — DELETE handler is easily testable with existing patterns. Promotion failure is easily testable. TOCTOU race itself is not unit-testable but the fix can be validated by design review. Dead code removal needs no tests.
  - To >=80: current score.
  - To >=90: verify mock setup for `readCloudDraftSnapshot` in DELETE test context.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Image deleted while concurrently assigned to a product | Low | Medium | Single-operator editing pattern reduces likelihood. Broken storefront image is user-visible. Fix: close TOCTOU window via locking or soft-delete. |
| Future developer uses dead KV mutex functions | Low | Low | Code exists, is exported, and has no deprecation marker. Fix: remove dead code. |
| Stale publish states after promotion failure (both sync and publish routes) | Medium | Low | Self-healing on next sync. Operator sees outdated status in editor. No data loss. Warning is currently surfaced with low prominence. Fix: elevate severity. |
| Lock-wrap approach adds contention to image deletes | Low | Low | Only relevant if lock-wrap is chosen. Cloud sync lock is lease-based with timeout, so contention is bounded. |
| Fix applied to sync route only, missing publish route | Medium | Medium | Both `sync/route.ts` and `publish/route.ts` have the same `publish_state_promotion_failed` pattern. Analysis and plan must scope both routes. |

## Questions

### Resolved

- Q: Is the KV mutex dead code intentional?
  - A: Yes — `acquireSyncMutex`/`releaseSyncMutex` were superseded by `acquireCloudSyncLock` from `catalogDraftContractClient.ts` and never cleaned up. The sync route (line 525) uses `acquireCloudSyncLock` exclusively. The type exports (`UploaderKvNamespace`, `UploaderR2Bucket`) and `getUploaderKv()` from `syncMutex.ts` are still actively used.
  - Evidence: `grep -r 'acquireSyncMutex\|releaseSyncMutex' apps/xa-uploader/` returns only the definition in `syncMutex.ts`. No imports found.

- Q: Does the frontend display `warnings` from the sync response?
  - A: Yes. `catalogConsoleActions.ts` (line 142) explicitly localizes `publish_state_promotion_failed` via `t("syncWarningPublishStatePromotionFailed")`, and `action-feedback.test.tsx` (line 323) verifies the warning is rendered in sync success feedback. The same pattern applies to the publish route (line 1009 of the same test file). The issue is not absence of surfacing but rather severity/prominence — the warning appears as a localized string but not as an error-level alert.
  - Evidence: `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts` line 142, `apps/xa-uploader/src/components/catalog/__tests__/action-feedback.test.tsx` lines 323 and 1009.

- Q: How many storefronts run concurrent catalog sessions?
  - A: Based on the single-operator editing pattern and the `rateLimit` configuration (3 sync requests per 60s per IP), concurrent sessions are near-theoretical for normal operation. Batch cleanup operations (multiple image deletes in sequence) are the most likely scenario for the TOCTOU race.
  - Evidence: Rate limit constants in `sync/route.ts` lines 68-69. Single-operator assumption from business context.

- Q: Should image deletes be soft-deletes?
  - A: This is a design decision for the analysis stage. Soft-delete closes the TOCTOU window entirely but adds R2 storage cost for deferred cleanup. Lock-wrap (using the existing cloud sync lock) is simpler but adds lock contention. Both approaches are viable.
  - Evidence: R2 `delete()` is unconditional. `acquireCloudSyncLock` is available and proven.

### Open (Operator Input Required)

Not investigated: no operator-only questions remain. All questions were resolvable from codebase evidence and business context.

## Planning Constraints & Notes

- Must-follow patterns:
  - Use `acquireCloudSyncLock` pattern for any new locking (not the dead KV mutex).
  - Follow existing `uploaderLog` conventions for new logging.
  - Follow existing DELETE response shape (`{ ok: true, deleted: boolean, skipped?: string }`).
- Rollout/rollback expectations:
  - No database migrations. Rollback = revert commit.
  - No feature flags needed — fixes are transparent improvements to existing behavior.
- Observability expectations:
  - Add `uploaderLog` calls for DELETE handler operations.
  - Surface promotion failure with structured logging (snapshot revision, storefront, product count).

## Suggested Task Seeds (Non-binding)

- TASK-01: Add DELETE handler unit tests (referenced skip, unreferenced delete, R2 failure, reference-check failure).
- TASK-02: Fix image delete TOCTOU — implement chosen concurrency approach (lock-wrap or soft-delete).
- TASK-03: Improve promotion failure severity — elevate from warning-level string to a more prominent signal in both `sync/route.ts` and `publish/route.ts`. Update existing tests if severity/shape changes.
- TASK-04: Remove dead KV mutex functions (`acquireSyncMutex`, `releaseSyncMutex`) from `syncMutex.ts`, preserving type exports and `getUploaderKv()`.

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package: All new and modified tests pass. Image delete is safe against concurrent edits. Promotion failure is surfaced to operator. Dead code removed.
- Post-delivery measurement plan: Monitor sync and publish route responses for `publish_state_promotion_failed` — after fix, this should be surfaced with appropriate severity rather than a bare warning string. Monitor image delete operations via `uploaderLog`.

## Evidence Gap Review

### Gaps Addressed

- Verified all file paths and line numbers against actual source code.
- Confirmed `acquireSyncMutex`/`releaseSyncMutex` are genuinely dead code (zero imports outside definition).
- Verified R2 `delete()` is unconditional via interface definition.
- Confirmed `acquireCloudSyncLock` is the active locking mechanism for the sync route.
- Verified `promoteDerivedPublishStatesInCloudSnapshot` is a pure function operating on snapshot copy.

### Confidence Adjustments

- Implementation raised to 80% (from initial estimate) after confirming both lock-wrap and soft-delete approaches are viable with existing infrastructure.
- Approach held at 75% — two viable approaches need analysis-stage comparison.
- Testability confirmed at 80% — existing mock patterns are sufficient, no new seams needed.

### Remaining Assumptions

- Single-operator editing pattern is the norm (inferred from rate limits and business context, not explicitly confirmed).

## Analysis Readiness

- Status: Ready-for-analysis
- Blocking items: none
- Recommended next step: `/lp-do-analysis` to compare image delete approaches (lock-wrap vs. soft-delete) and finalize promotion failure handling strategy.
