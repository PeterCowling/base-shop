---
Type: Analysis
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: xa-uploader-concurrency-fixes
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/xa-uploader-concurrency-fixes/fact-find.md
Related-Plan: docs/plans/xa-uploader-concurrency-fixes/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# XA Product Image and Catalog Data Concurrency Fixes — Analysis

## Decision Frame

### Summary

Three issues need resolution in the xa-uploader catalog pipeline:

1. **Image DELETE TOCTOU** (active runtime race): `keyIsStillReferenced()` reads the draft snapshot, then `deletePersistedImageKey()` unconditionally deletes from R2. Between these two steps, another request can assign the image to a product, producing a broken storefront link.
2. **Promotion failure severity** (UX issue): Both `sync/route.ts` and `publish/route.ts` catch `writeCloudDraftSnapshot` failures during publish-state promotion and push `"publish_state_promotion_failed"` as a warning string. The client localizes and renders it via `catalogConsoleActions.ts` (line 142) and tests it in `action-feedback.test.tsx` (line 323), but it has insufficient prominence for an operator to notice or act on.
3. **Dead KV mutex** (maintenance hazard): `acquireSyncMutex`/`releaseSyncMutex` in `syncMutex.ts` are exported but never imported. They contain an acknowledged non-atomic race window. This is dead code, not a live runtime issue.

The primary design decision is which approach to use for closing the image DELETE TOCTOU window. A critical constraint discovered during analysis: `acquireCloudSyncLock` is only used by the sync and publish routes — product save routes (`products/route.ts`, `products/[slug]/route.ts`) mutate the snapshot (including `imageFiles`) using optimistic concurrency (`ifMatchDocRevision`) without acquiring the sync lock. This means wrapping image DELETE in the sync lock alone does not close the race against concurrent product saves.

### Goals

- Close the TOCTOU window in image DELETE so an image cannot be deleted while concurrently being assigned to a product.
- Elevate promotion failure severity in both sync and publish routes so the operator receives a clear signal.
- Remove dead KV mutex functions to prevent future misuse.

### Non-goals

- Rewriting the sync pipeline's existing cloud sync lock mechanism.
- Supporting real-time multi-user concurrent editing.
- Changing the image upload (POST) path.
- Adding `acquireCloudSyncLock` to product save routes (scope expansion beyond this change).

### Constraints & Assumptions

- Constraints:
  - R2 `delete()` is unconditional — no etag-based or conditional-delete API.
  - KV does not support compare-and-set.
  - `acquireCloudSyncLock` is only used by sync and publish routes. Product save routes use `writeCloudDraftSnapshot` with `ifMatchDocRevision` for optimistic concurrency but do NOT acquire the sync lock. Any image delete guard must account for this.
  - The client-side image delete UI (`CatalogProductImagesFields.client.tsx`, line 253) currently logs non-OK DELETE responses to `console.warn` only — it does not retry or surface errors to the operator. Any approach that returns 409 for lock contention needs coordinated client-side handling or graceful degradation.
  - The promotion failure client contract expects `warnings?: string[]` in `catalogConsoleFeedback.ts` (line 64), localizes warning strings in `catalogConsoleActions.ts` (line 138), and builds success feedback from that array. Changing the shape (e.g., structured severity field) requires coordinated client type updates, localization changes, and test updates.
- Assumptions:
  - Single-operator or very small team editing pattern. Concurrent sessions are rare but possible during batch cleanup.
  - The catalog contract service (`writeCloudDraftSnapshot` with `ifMatchDocRevision`) provides reliable optimistic concurrency.

## Inherited Outcome Contract

- **Why:** If two people edit the catalog at the same time, product images can be deleted while still in use, and publish status changes can silently fail without anyone knowing. The dead KV mutex code could also mislead future developers into thinking it provides mutual exclusion when it does not. This means catalog data — the source of truth for what customers see — can end up in an inconsistent state that is hard to diagnose and fix.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Image delete is atomic (delete-if-unreferenced); publish-state promotion failures are surfaced with appropriate severity (not just a warning string) in both sync and publish routes; dead KV mutex code is removed.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/xa-uploader-concurrency-fixes/fact-find.md`
- Key findings used:
  - Image DELETE handler (`images/route.ts` lines 275-321) performs `keyIsStillReferenced()` then `deletePersistedImageKey()` without any lock or atomic guard.
  - R2 `delete()` is unconditional — no conditional-delete API exists.
  - `acquireCloudSyncLock` provides a server-side lease lock with proper 409 conflict semantics, used by sync and publish routes only.
  - Product save routes (`products/route.ts`, `products/[slug]/route.ts`) mutate the snapshot including `imageFiles` via `writeCloudDraftSnapshot` with `ifMatchDocRevision` but WITHOUT `acquireCloudSyncLock`.
  - `acquireSyncMutex`/`releaseSyncMutex` are dead code — zero imports outside their definition file.
  - Promotion failure warning is localized by `catalogConsoleActions.ts` (line 142) and rendered in `action-feedback.test.tsx` (line 323), but only at warning-level prominence.
  - Both `sync/route.ts` (line 189) and `publish/route.ts` (line 150) share the same `publish_state_promotion_failed` silent-catch pattern.
  - DELETE handler has zero test coverage.
  - Client-side image delete UI logs non-OK responses to `console.warn` only — no retry, no user-visible error.

## Evaluation Criteria

| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Correctness | The TOCTOU window must actually be closed against ALL concurrent snapshot mutations, not just sync/publish | Critical |
| Simplicity | Fewer moving parts = fewer bugs in a low-traffic path | High |
| Pattern consistency | Using existing concurrency patterns reduces cognitive load | High |
| Client compatibility | Changes should work with the current client behavior or include coordinated client updates | High |
| Lock contention | Image deletes should not block unrelated catalog operations unnecessarily | Medium |
| R2 storage cost | Approaches that defer deletion accumulate orphaned objects in R2 | Low |
| Implementation speed | Small scope — favor the fastest safe approach | Medium |

## Options Considered

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A: Snapshot-fenced delete (optimistic concurrency gate) | Read snapshot (capture `docRevision`), check references, write a no-op snapshot update with `ifMatchDocRevision` as a concurrency fence, then delete from R2. If any concurrent mutation changed the snapshot between the read and the fence write, the fence write 409-conflicts and the delete is aborted. | Uses the same optimistic concurrency mechanism as product saves — no new lock type. Works against ALL snapshot-mutating routes, not just sync/publish. No new infrastructure. Simple to implement. | Adds one extra `writeCloudDraftSnapshot` call per delete (the fence write). 409 on the fence write means a retry-or-abort decision. The fence write is a "no-op" (products unchanged) which is slightly awkward semantically. | Fence write could fail for non-race reasons (network, service error). Need to handle gracefully. | Yes |
| B: Sync-lock-only wrap | Wrap DELETE in `acquireCloudSyncLock`. Reference check + R2 delete inside the lock lease. | Reuses proven lock mechanism. Simple. | Does NOT close the race against concurrent product saves, which mutate `imageFiles` without the sync lock. Only serializes against sync/publish. | False sense of safety — the most common race vector (product save assigning an image) is not protected. | No — does not close the TOCTOU against product saves |
| C: Soft-delete with deferred garbage collection | Mark images as "pending-delete" in the draft snapshot. GC runs on next sync or as a scheduled job. | Eliminates TOCTOU entirely. | Requires new schema field, GC logic, orphaned R2 storage cost. More moving parts. | GC bugs, schema migration, disproportionate complexity. | Yes but disproportionate |
| D: Re-read-after-delete verification | After deleting from R2, re-read snapshot and check if key was re-assigned. Log an alert if so. | Very simple. No lock, no schema change. | Does not prevent the race — detection-only. Broken image link already exists. | Does not meet outcome contract ("atomic delete"). | No |

## Engineering Coverage Comparison

| Coverage Area | Option A (Snapshot-fenced) | Option C (Soft-delete) | Chosen implication |
|---|---|---|---|
| UI / visual | N/A — no UI changes | N/A — no UI changes | No UI impact either way. |
| UX / states | No change to DELETE response shape for happy path. On fence conflict (rare), returns a structured error indicating concurrent edit detected — client currently logs non-OK to `console.warn`, which is acceptable degradation (delete silently skipped, image preserved). | New "pending-delete" state visible in snapshot. Client must understand pending-delete images. | Option A is simpler — graceful degradation with existing client behavior. No new states. |
| Security / privacy | No new auth surfaces. Fence write uses existing write token. | No new auth surfaces. | Equivalent. |
| Logging / observability / audit | Add `uploaderLog` for DELETE operations (success, skip-referenced, skip-fence-conflict, R2 failure). Straightforward with existing logging patterns. | Add `uploaderLog` for soft-delete marking and GC runs. More logging surface. | Option A has less logging surface. |
| Testing / validation | Test DELETE with snapshot mock (happy path, referenced skip, fence conflict, R2 failure). Follows existing `writeCloudDraftSnapshot` mock patterns. | Test soft-delete marking, GC trigger, GC correctness, orphan detection. Significantly more test surface. | Option A requires fewer new tests. |
| Data / contracts | No schema changes. Fence write uses existing `writeCloudDraftSnapshot` with `ifMatchDocRevision`. The "no-op" write sends the same products back — snapshot content is unchanged, only `docRevision` advances. | New `pendingDelete` field in draft snapshot schema. All consumers must handle it. | Option A avoids schema changes entirely. |
| Performance / reliability | Fence write adds one extra `writeCloudDraftSnapshot` round-trip per delete. Acceptable for admin UI action. Batch optimization: read snapshot once, delete multiple images, fence write once at end. | No fence latency. But GC adds periodic overhead. Orphaned R2 objects accumulate. | Option A adds per-request latency but is simpler overall. Batch optimization mitigates. |
| Rollout / rollback | No schema changes — rollback is a simple revert. | Schema change requires coordinated rollback. | Option A has cleaner rollback. |

## Chosen Approach

- **Recommendation:** Option A — Snapshot-fenced delete (optimistic concurrency gate)
- **Why this wins:**
  - Closes the TOCTOU window against ALL concurrent snapshot mutations, including product saves. This is the critical advantage over sync-lock-only (Option B), which only protects against sync/publish.
  - Uses the same `writeCloudDraftSnapshot` + `ifMatchDocRevision` optimistic concurrency mechanism already used by product save routes — no new lock type or infrastructure.
  - No schema changes, no garbage collection logic, no new client states.
  - Graceful degradation with existing client: if the fence write 409-conflicts (concurrent edit detected), the DELETE returns a structured error. The current client logs non-OK to `console.warn` — the image is preserved (not deleted), which is the safe outcome.
  - Rollback is a simple commit revert.
  - Batch optimization is natural: read snapshot once, delete multiple unreferenced images, single fence write at the end.
- **What it depends on:**
  - `writeCloudDraftSnapshot` with `ifMatchDocRevision` continues to work reliably (it is the core concurrency mechanism for the entire catalog).
  - The "no-op" fence write (same products, same revisions, but `ifMatchDocRevision` set) is accepted by the contract service without error. This needs verification during implementation but is expected to work since the contract service validates `docRevision` match, not content diff.

### Promotion Failure Fix Approach

For the promotion failure severity, the analysis recommends a conservative approach that preserves the existing client contract:

- **Keep the `warnings` array shape.** Do not convert to a structured severity field — this would require coordinated client type changes, localization rewrites, and test updates disproportionate to the benefit.
- **Add `uploaderLog("warn", ...)` for promotion failure** in both `sync/route.ts` and `publish/route.ts` so the failure appears in server logs with structured context (storefront, product count, snapshot revision).
- **Add a distinct `promotionFailed: true` boolean** to the response body alongside `warnings`. This is additive (doesn't break existing client parsing of `warnings`) and gives the client an explicit signal for future UI enhancement.
- This is a scope-appropriate fix: server-side logging makes the failure visible in operational monitoring, and the additive boolean enables future client-side escalation without requiring it now.

### Rejected Approaches

- **Option B (Sync-lock-only wrap)** — Rejected because product save routes (`products/route.ts`, `products/[slug]/route.ts`) mutate `imageFiles` via `writeCloudDraftSnapshot` without the sync lock. The sync lock only serializes against sync/publish, leaving the most common race vector (product save assigning an image during delete) unprotected. This approach gives a false sense of safety.
- **Option C (Soft-delete with deferred GC)** — Rejected because it introduces disproportionate complexity (new schema field, garbage collection code path, more test surface) for a low-likelihood race condition. Better suited to high-concurrency systems.
- **Option D (Re-read-after-delete verification)** — Rejected because detection-only does not meet the stated outcome contract ("image delete is atomic").

### Open Questions (Operator Input Required)

Not investigated: no operator-only questions remain. All design decisions are resolvable from codebase evidence and the evaluation criteria.

## Planning Handoff

- Planning focus:
  - Task 1: Add DELETE handler unit tests (referenced skip, unreferenced delete, R2 failure, reference-check failure). Tests first to establish the baseline before modifying the handler.
  - Task 2: Implement snapshot-fenced delete. Read snapshot (capture `docRevision`), check references, delete from R2, then write a no-op fence update with `ifMatchDocRevision`. If fence write 409-conflicts, log the concurrent edit detection but preserve the deletion (image was already deleted from R2 — the fence conflict means a concurrent mutation happened, but since the image was already confirmed unreferenced at read time and has now been deleted, the worst case is the image was just re-assigned and is now broken, same as today). Alternative: fence write BEFORE R2 delete (safer ordering — if fence fails, don't delete). Planning should evaluate fence-before-delete vs. delete-before-fence ordering.
  - Task 3: Elevate promotion failure visibility in both `sync/route.ts` (line 189) and `publish/route.ts` (line 150). Add `uploaderLog("warn", ...)` with structured context. Add `promotionFailed: true` boolean to response body. Keep `warnings` array shape unchanged for client compatibility.
  - Task 4: Remove dead `acquireSyncMutex`/`releaseSyncMutex` functions from `syncMutex.ts`. Preserve type exports (`UploaderKvNamespace`, `UploaderR2Bucket`) and `getUploaderKv()` which are actively used.
  - Task 5: Add `uploaderLog` calls for DELETE handler operations (success, skip-referenced, fence-conflict, R2 failure).
- Validation implications:
  - DELETE handler tests must cover: referenced-image skip, unreferenced-image delete, R2 failure, reference-check failure, fence write success, fence write 409 conflict.
  - Promotion failure: verify `promotionFailed` boolean is present in response when promotion fails, verify existing `warnings` array still works. Tests in both sync and publish routes.
  - Dead code removal: verify no import breaks after removing mutex functions.
  - No-op fence write: verify the contract service accepts a write where products are unchanged but `ifMatchDocRevision` is set.
- Sequencing constraints:
  - Tests first (Task 1) before implementation (Task 2) to establish regression baseline.
  - Snapshot-fenced delete (Task 2) is independent of promotion failure fix (Task 3).
  - Dead code removal (Task 4) is independent of all other tasks.
  - Logging (Task 5) should be done alongside or after Task 2.
- Risks to carry into planning:
  - No-op fence write acceptance: if the contract service rejects writes with no content diff, a trivial "bumped" field may need to be added. Low risk — optimistic concurrency typically checks revision match, not content diff.
  - Fence ordering decision (fence-before-delete vs. delete-before-fence) has correctness implications. Fence-before-delete is strictly safer: if fence fails, image is preserved. Delete-before-fence means the image is already gone if the fence fails.
  - Client-side: non-OK DELETE responses are currently logged to `console.warn`. The image is preserved (correct outcome), but the operator gets no UI signal that a delete was skipped due to concurrent edit. This is acceptable for now and can be improved in a future client-side enhancement.

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| No-op fence write rejected by contract service | Low | Low | Depends on contract service implementation detail (revision-match vs. content-diff) | Verify during Task 2 implementation. If rejected, add a trivial timestamp bump field. |
| Fence ordering correctness (fence-before vs. delete-before) | N/A (design decision) | Medium | Planning must evaluate and choose the safer ordering | Fence-before-delete is recommended: abort delete on fence conflict rather than delete then discover conflict. |
| Client silently drops concurrent-edit delete failure | Medium | Low | Client-side change is out of scope for this plan | Image is preserved (safe outcome). Document for future client improvement. |
| Fix applied to sync route only, missing publish route | N/A (prevented) | N/A (prevented) | Both routes explicitly scoped in planning handoff | Plan must include both routes for promotion failure fix. |

## Planning Readiness

- Status: Go
- Rationale: All three issues have clear, decisive solutions. The snapshot-fenced delete approach for image DELETE uses the existing optimistic concurrency mechanism and closes the race against ALL snapshot-mutating routes (not just sync/publish). Promotion failure fix is additive and client-compatible. Dead code removal is trivial. No open questions requiring operator input. Evidence gate, option gate, and planning handoff gate all pass.
