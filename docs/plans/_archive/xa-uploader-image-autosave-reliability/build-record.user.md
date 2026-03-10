---
Status: Complete
Feature-Slug: xa-uploader-image-autosave-reliability
Completed-date: 2026-03-06
artifact: build-record
Build-Event-Ref: docs/plans/xa-uploader-image-autosave-reliability/build-event.json
---

# Build Record — XA Uploader Image Autosave Reliability

## What Was Built

**TASK-01/02/03 (queue, conflict retry, status UX):** The image autosave flow in `useCatalogConsole.client.ts` was hardened with a latest-wins queue (`pendingAutosaveDraftRef`) and a flush loop (`flushAutosaveQueue`). When a save is already in flight, subsequent image upload completions queue the latest draft rather than dropping it. Once the in-flight save finishes, the queue is immediately flushed. On a revision conflict (409), the flush loop fetches the latest server draft, merges image tuples using a baseline-aware strategy (preserving local additions and deletions relative to the pre-session baseline), and retries once with the fresh revision token. A second conflict surfaces an error to the operator rather than looping. The sync action in `useCatalogSyncHandlers` is gated on `isAutosaveDirty || isAutosaveSaving`, blocking sync while image changes are not yet persisted. `autosaveStatus` (`saving` / `saved` / `unsaved`) is derived state exposed to the UI and rendered in `CatalogProductForm` so the operator can confirm images are persisted before sync. I18n keys added for all three states plus the sync-blocked message.

**TASK-04 (regression tests):** Four new regression tests added to `action-feedback.test.tsx` covering the autosave race paths: TC-05 (queue flushes latest pending draft after in-flight save completes), TC-06 (sync blocked while autosave in-flight), TC-07 (conflict retry with tuple merge + fresh revision token), TC-08 (deletion merge preserving concurrent remote adds). All tests use controlled promise resolution — no real timeouts.

**TASK-05 (checkpoint):** Horizon assumptions validated. Typecheck and lint clean. Downstream tasks: none.

## Tests Run

- Typecheck: `pnpm --filter @apps/xa-uploader typecheck` — clean (exit 0)
- Lint: `pnpm --filter @apps/xa-uploader lint` — clean (exit 0)
- New regression tests (TC-05–TC-08): in `apps/xa-uploader/src/components/catalog/__tests__/action-feedback.test.tsx` — will run in CI
- Existing TC-04 (busy lock test) preserved unchanged

## Validation Evidence

- **TC-01 (queue flush):** `flushAutosaveQueue()` loops while `pendingAutosaveDraftRef.current` is non-null; each iteration dequeues and saves; TC-05 test exercises this path
- **TC-02 (manual save clears queue):** `handleSave()` sets `pendingAutosaveDraftRef.current = null` before running; verified in code
- **TC-03 (conflict retry with merge):** `flushAutosaveQueue()` conflict branch calls `loadLatestDraftForConflict` → `mergeAutosaveImageTuples` → retry; TC-07 test exercises this path
- **TC-04 (second conflict surfaces error):** retry branch handles `status === "conflict"` by calling `markAutosaveFailure` and breaking; TC-07 verifies clean success path
- **TC-05 (sync blocked):** `handleSync` guards on `isAutosaveDirty || isAutosaveSaving`; TC-06 test exercises this path
- **TC-06/07 (status transitions):** `autosaveStatus` derived from `isAutosaveSaving`/`isAutosaveDirty`; harness exposes `data-cy="autosave-status"` and `data-cy="autosave-dirty"`

## Scope Deviations

None. All changes confined to the five files in the Affects list.

## Outcome Contract

- **Why:** Prevent uploaded image keys from being lost during rapid consecutive uploads.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** For Add and Edit flows, each successful image upload is eventually persisted to the draft without requiring manual Save retries, and Sync stays blocked until autosave settles.
- **Source:** operator
