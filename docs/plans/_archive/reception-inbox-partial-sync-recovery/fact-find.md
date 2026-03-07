---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-07
Last-updated: 2026-03-07
Feature-Slug: reception-inbox-partial-sync-recovery
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-inbox-partial-sync-recovery/plan.md
Dispatch-ID: IDEA-DISPATCH-20260307153740-9207
---

# Reception Inbox Partial Sync Recovery Fact-Find Brief

## Scope

### Summary

The reception inbox sync pipeline (`syncInbox`) advances its checkpoint (`historyId`) unconditionally after processing a batch of threads. If any thread in the batch fails mid-processing (Gmail API error, D1 write failure, draft generation crash), the entire function throws, but the checkpoint has not yet been written -- which is safe in the crash case. However, a more insidious problem exists: the checkpoint is set to `finalProfile.historyId` (the Gmail profile's current history ID at the end of sync), not to the history ID of the last successfully processed thread. This means the checkpoint leaps forward past all threads in the batch regardless of individual thread outcomes. Any thread that was skipped due to a `continue` statement (no inbound messages) or that encountered a non-throwing error in downstream processing (draft generation returning `status: "error"`) still has the checkpoint advanced past it.

The critical gap: there is **no try/catch around individual thread processing** in the main `for` loop (lines 601-789). A single thread failure (e.g., `getGmailThread` throws, `db.batch` throws, `recordAdmission` throws) will crash the entire sync function. The checkpoint is written only at line 792-805, so a crash means the checkpoint is NOT advanced (which is safe for the crash case). But a single throwing thread kills processing for all remaining threads in the batch, and all prior successfully-processed threads must be re-processed on the next sync.

The specific failure modes that need addressing:

1. **Throwing failures crash the entire sync** -- if any thread-level operation throws (`getGmailThread()`, `upsertThreadAndMessages()`, `classifyForAdmission()`, `recordAdmission()`, etc.), the entire `syncInbox()` function aborts. Threads that were never persisted to D1 are invisible to the recovery pipeline (which queries D1). The crash prevents checkpoint advancement (safe), but remaining threads in the batch are never reached.
2. **D1 batch atomicity is per-thread, not per-sync** -- `db.batch()` is atomic within a single call (all statements in one batch succeed or fail together), but each thread's upsert is a separate `db.batch()` call. There is no transaction spanning the entire sync.
3. **The checkpoint source (`finalProfile.historyId`) is disconnected from processing** -- it reflects Gmail's current state at sync completion, not the outcome of thread processing. If per-thread error isolation is added (try/catch), the checkpoint would advance past failed threads unless explicitly held back.

Note: some code paths that look like gaps are actually handled correctly. Threads with no inbound messages are intentionally skipped (`getLatestInboundMessage()` returns null, line 605-608) -- these are outbound-only threads and are not inbox work. Non-throwing draft generation failures set `needsManualDraft: true` on the persisted thread (lines 669-683), recording them for manual follow-up.

### Goals

- Hold back the sync checkpoint (do not advance it) when any thread fails during processing, so the next sync re-discovers all threads from the same history point
- Prevent permanent thread skipping when individual threads fail during a batch sync
- Add per-thread error isolation so one failing thread does not crash the entire sync

### Non-goals

- Rewriting the sync architecture (push-based, streaming, etc.)
- Adding a dead-letter queue or persistent retry queue (the existing `recovery.server.ts` handles stale threads)
- Changing the Gmail history API integration pattern
- Adding UI-visible sync status or error reporting

### Constraints & Assumptions

- Constraints:
  - D1 does not support cross-statement transactions beyond `db.batch()` -- each batch is atomic but there is no multi-batch transaction
  - Gmail History API returns a monotonically increasing `historyId` -- checkpoint must only move forward
  - The sync is called via an API route (`POST /api/mcp/inbox-sync`) and must return a result, not stream progress
  - Cloudflare Workers have a 30-second CPU time limit; sync must complete within this window
- Assumptions:
  - Individual thread failures are rare but not impossible (Gmail API rate limits, malformed thread data, D1 transient errors)
  - The bounded rescan fallback (30-day window) partially mitigates skipped threads but has a coverage gap for threads older than the window
  - The existing `recoverStaleThreads` function in `recovery.server.ts` provides a safety net for admitted threads that failed draft generation, but does NOT cover threads that were never persisted to D1 at all

## Outcome Contract

- **Why:** A single sync failure can permanently skip threads, causing emails to be missed. This is the most dangerous reliability gap in the pipeline.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Sync checkpoint is held back (not advanced) when any thread fails during processing, ensuring no threads are permanently skipped. On partial failure, the next sync re-discovers all threads from the same history point, giving failed threads another chance.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/app/api/mcp/inbox-sync/route.ts` -- POST route handler, calls `syncInbox()`, catches errors and returns 502
- `apps/reception/src/lib/inbox/sync.server.ts` -- core sync engine, exports `syncInbox()`

### Key Modules / Files

- `apps/reception/src/lib/inbox/sync.server.ts` (lines 537-816) -- `syncInbox()` function: the main sync loop, checkpoint read/write, thread processing
- `apps/reception/src/lib/inbox/sync-state.server.ts` -- `getInboxSyncCheckpoint()` and `upsertInboxSyncCheckpoint()`: checkpoint CRUD against `inbox_sync_state` table
- `apps/reception/src/lib/inbox/repositories.server.ts` -- `getThread()`, `updateThreadStatus()`, `createDraft()`, `recordAdmission()`: D1 persistence layer
- `apps/reception/src/lib/inbox/recovery.server.ts` -- `recoverStaleThreads()`: existing safety net for stale admitted threads without drafts
- `apps/reception/migrations/0002_inbox_sync_state.sql` -- `inbox_sync_state` table schema (mailbox_key PK, last_history_id, last_synced_at, metadata_json)
- `apps/reception/src/lib/inbox/draft-pipeline.server.ts` -- `generateAgentDraft()`: draft generation, can return `status: "error"`

### Patterns & Conventions Observed

- **No per-thread error isolation:** The main processing loop (lines 601-789) has zero try/catch. Any throw from `getGmailThread()`, `upsertThreadAndMessages()`, `classifyForAdmission()`, `generateAgentDraft()`, `upsertSyncDraft()`, `recordAdmission()`, or `recordInboxEvent()` crashes the entire sync. Evidence: `apps/reception/src/lib/inbox/sync.server.ts` lines 601-789, no try/catch visible.

- **Checkpoint leaps to profile.historyId:** At line 791-805, `finalProfile = await getGmailProfile()` fetches the current Gmail historyId, then `upsertInboxSyncCheckpoint()` stores it. This is NOT derived from processed threads -- it is the Gmail account's current history cursor. Evidence: `apps/reception/src/lib/inbox/sync.server.ts` lines 791-805.

- **D1 batch is per-thread atomic:** `upsertThreadAndMessages()` (lines 481-508) calls `db.batch(statements)` with one thread upsert + N message upserts. D1 `batch()` executes all statements atomically. But each thread is a separate `db.batch()` call -- no cross-thread atomicity. Evidence: `apps/reception/src/lib/inbox/sync.server.ts` lines 489-502.

- **Recovery covers only admitted-but-draftless threads:** `recoverStaleThreads()` in `recovery.server.ts` queries `findStaleAdmittedThreads()` which looks for threads with status `pending`, an `admit` admission outcome, and no drafts. Threads that were never persisted to D1 (because `upsertThreadAndMessages` threw before completion) are invisible to recovery. Evidence: `apps/reception/src/lib/inbox/recovery.server.ts` lines 60-114, `apps/reception/src/lib/inbox/repositories.server.ts` lines 968-1021.

- **Bounded rescan is time-windowed:** When history is stale, `listThreadIdsForRescan()` queries Gmail for threads `newer_than:${rescanWindowDays}d` (default 30 days). Threads older than this window that were skipped are permanently lost. Evidence: `apps/reception/src/lib/inbox/sync.server.ts` lines 510-530, constant at line 41.

- **Guest email map failure is swallowed:** Lines 594-599 catch guest email map build failure and continue with an empty map. This is a non-throwing failure that does not affect checkpoint behavior.

### Data & Contracts

- Types/schemas/events:
  - `SyncInboxResult` (lines 75-94): return type includes `counts` with `threadsFetched`, `threadsUpserted`, `messagesUpserted`, etc. -- no error count field
  - `SyncThreadMetadata` (lines 47-67): per-thread metadata stored in `metadata_json`, includes `gmailHistoryId` per-thread
  - `InboxSyncCheckpoint` (sync-state.server.ts lines 16-23): `lastHistoryId`, `lastSyncedAt`, `metadata`
- Persistence:
  - `inbox_sync_state` table: single row per mailbox_key, stores `last_history_id` as the checkpoint
  - `threads` table: per-thread record with `metadata_json` containing `gmailHistoryId` for that thread
  - `messages` table: per-message records linked to thread
  - `admission_outcomes` table: per-thread admission decision records
  - `thread_events` table: telemetry events
- API/contracts:
  - `POST /api/mcp/inbox-sync` returns `{ success: true, data: SyncInboxResult }` or `{ success: false, code: "INBOX_SYNC_ERROR", error: string }` on catch

### Dependency & Impact Map

- Upstream dependencies:
  - Gmail API (`getGmailProfile`, `getGmailThread`, `listGmailHistory`, `listGmailThreads`) -- external, can fail or rate-limit
  - D1 database -- can have transient write failures
  - Draft generation pipeline (`generateAgentDraft`) -- can return `status: "error"` or throw
  - Guest email map (`buildGuestEmailMap`) -- already has error swallowing
- Downstream dependents:
  - Inbox UI (`InboxWorkspace.tsx`, `useInbox.ts`) -- reads threads/drafts from D1
  - Recovery pipeline (`recoverStaleThreads`) -- queries D1 for stale admitted threads
  - Telemetry (`recordInboxEvent`) -- writes thread events
- Likely blast radius:
  - Changes to the sync loop and checkpoint logic. No schema changes expected. No UI changes. Recovery pipeline benefits passively (fewer threads need recovery).

### Test Landscape

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| syncInbox bounded rescan fallback | Unit | `__tests__/sync.server.test.ts` | Tests stale history error triggers bounded rescan |
| Draft dedup (upsertSyncDraft) | Unit | `__tests__/sync.server.test.ts` | 5 tests covering generated/edited/approved/sent/new draft scenarios |
| Recovery pipeline | Unit | `__tests__/recovery.server.test.ts` | Covers stale thread recovery, max retries, manual flagging |
| Route handler | Unit | `__tests__/inbox-sync.route.test.ts` | Tests auth, payload validation, error responses |

#### Coverage Gaps

- **No test for partial batch failure:** No test verifies behavior when one thread in a batch throws during processing
- **No test for checkpoint advancement logic:** No test verifies that the checkpoint value is correctly derived
- **No test for D1 batch failure within upsertThreadAndMessages:** No test verifies behavior when `db.batch()` throws

#### Recommended Test Approach

- Unit tests for: per-thread error isolation (wrap loop body in try/catch, verify other threads still process)
- Unit tests for: checkpoint hold-back on partial failure (verify checkpoint is NOT advanced when any thread fails)
- Unit tests for: checkpoint advancement on full success (verify checkpoint IS advanced when all threads succeed)
- Unit tests for: error counting in SyncInboxResult (new `threadErrors` count field)
- Integration tests for: end-to-end sync with injected thread failures

### Recent Git History (Targeted)

Not investigated: sync.server.ts has been stable; the gap is a design-time omission, not a regression.

## Access Declarations

None. All investigation is codebase-only (file reads, pattern search). No external API calls or database queries required.

## Scope Signal

- **Signal:** right-sized
- **Rationale:** The fix is well-bounded: wrap the per-thread loop body in try/catch, and hold back the checkpoint (do not advance it) when any thread fails. On full success, advance to `finalProfile.historyId` as before. The recovery pipeline already exists as a secondary safety net. No schema changes are needed. The bounded rescan window gap is an existing limitation that this change does not need to address (it is a separate concern).

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Checkpoint management (sync-state.server.ts) | Yes | None | No |
| Main sync loop error handling (sync.server.ts L601-789) | Yes | None -- gap confirmed, fix path clear | No |
| D1 batch atomicity (upsertThreadAndMessages) | Yes | None -- per-thread atomic confirmed | No |
| Checkpoint source (finalProfile.historyId) | Yes | None -- disconnect confirmed, fix path clear | No |
| Bounded rescan window coverage | Yes | [Scope gap] Minor: threads older than rescan window remain unreachable, but this is out-of-scope per non-goals | No |
| Recovery pipeline interaction | Yes | None -- recovery benefits passively | No |
| Gmail History API contract | Yes | None -- historyId monotonicity confirmed | No |

## Questions

### Resolved

- Q: Does D1 `batch()` provide atomicity (all-or-nothing) for statements within a single batch call?
  - A: Yes. Cloudflare D1 `batch()` executes all statements in a single implicit transaction. If any statement fails, all are rolled back. This is per-batch, not per-sync.
  - Evidence: D1 documentation and usage in `upsertThreadAndMessages()` at `apps/reception/src/lib/inbox/sync.server.ts` lines 489-502.

- Q: What happens if `getGmailThread()` throws for one thread in the batch?
  - A: The entire `syncInbox()` function throws because there is no try/catch in the loop body. The checkpoint is NOT written (safe), but all prior thread processing in the current sync is lost in terms of checkpoint advancement -- the next sync will re-process them.
  - Evidence: `apps/reception/src/lib/inbox/sync.server.ts` lines 601-602, no try/catch.

- Q: Can the per-thread `gmailHistoryId` in metadata be used as a checkpoint watermark?
  - A: No. Gmail history is mailbox-global, not an ordered per-thread stream. Thread historyIds do not correspond to discovery order, so using `max(thread.historyId)` of successful threads would skip failed threads with lower historyIds. Each thread's `gmailHistoryId` is stored in `SyncThreadMetadata` (line 48) for per-thread tracking purposes, but it is not suitable as a sync-level checkpoint. The correct strategy is all-or-nothing: hold the checkpoint on any failure, advance to `finalProfile.historyId` only on full success.
  - Evidence: `apps/reception/src/lib/inbox/sync.server.ts` lines 48, 252; Gmail API history documentation.

- Q: Does the recovery pipeline cover threads that were never written to D1?
  - A: No. `findStaleAdmittedThreads()` queries the `threads` table. If a thread was never inserted (because `upsertThreadAndMessages` threw), recovery cannot find it. The next sync would need to re-discover it via history or rescan.
  - Evidence: `apps/reception/src/lib/inbox/repositories.server.ts` lines 968-1021.

- Q: Should the checkpoint use per-thread historyId or a different watermark?
  - A: Gmail history is mailbox-global, not an ordered per-thread stream. Thread historyIds do not correspond to discovery order -- a thread discovered via history entry X may have a historyId lower or higher than another thread from the same history batch. Using `max(thread.historyId)` of successful threads is **unsafe**: if thread A succeeds with historyId=150 and thread B fails with historyId=120, advancing the checkpoint to 150 permanently skips thread B. The correct strategy is: **if any thread fails, do not advance the checkpoint at all** (keep the previous checkpoint). If all threads succeed, advance to `finalProfile.historyId` as currently done. This is a simple all-or-nothing checkpoint policy. Combined with per-thread error isolation (try/catch), this means: on partial failure, the checkpoint stays put, and the next sync re-discovers all threads from the same history point. Successfully-processed threads will be re-processed (safe due to idempotent upserts), and previously-failed threads get another chance. This avoids the complexity of partial checkpoint advancement entirely.
  - Evidence: Gmail API documentation (history is mailbox-global); `apps/reception/src/lib/inbox/sync.server.ts` lines 248-262, 791-805.

### Open (Operator Input Required)

None. All questions resolved from codebase evidence and documented API behavior.

## Confidence Inputs

- **Implementation:** 90% -- The fix is straightforward: wrap loop body in try/catch, set a `hasErrors` flag, and conditionally advance checkpoint only on full success. No schema changes needed.
  - To reach >=90: already there. The code paths are clear and well-understood.
- **Approach:** 90% -- All-or-nothing checkpoint hold-back is the simplest correct strategy. Re-processing overhead on partial failure is acceptable because upserts are idempotent.
  - To reach >=90: already there.
- **Impact:** 95% -- This directly prevents the most dangerous failure mode (permanent thread skipping). The recovery pipeline provides additional safety.
  - To reach >=90: already there.
- **Delivery-Readiness:** 90% -- All code paths understood, no external dependencies to set up, no schema changes.
  - To reach >=90: already there.
- **Testability:** 80% -- The sync function has existing test infrastructure with mocks. Adding error-path tests is feasible but requires mocking individual thread failures within a batch.
  - To reach >=90: verify the mock setup can simulate per-thread failures (e.g., `getGmailThread` throwing for specific thread IDs).

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Per-thread try/catch masks systematic failures (e.g., auth token expired) | Medium | Medium | Monitor `threadErrors` count; if error rate is high, investigate root cause. Consider adding a circuit breaker in a follow-up if systematic failures are observed in practice. |
| Re-processing overhead on partial failure | Medium | Low | When any thread fails, the entire batch is re-processed on next sync. Upserts are idempotent (ON CONFLICT DO UPDATE), so this is safe but adds redundant work. Acceptable trade-off for correctness. |
| Performance regression from per-thread error handling overhead | Very Low | Low | try/catch has negligible overhead in modern V8/Node; no mitigation needed |

## Planning Constraints & Notes

- Must-follow patterns:
  - Maintain idempotent upserts (ON CONFLICT DO UPDATE) so re-processing is safe
  - Keep the existing `SyncInboxResult` return type compatible (add new fields, do not remove existing ones). Note: `checkpoint.nextHistoryId` (currently typed as non-null `string`) must handle the hold-back case. On partial failure, `nextHistoryId` should equal `previousHistoryId` (or be the previous checkpoint value) to indicate the checkpoint was not advanced. This avoids changing the type to nullable while truthfully reflecting the outcome.
  - Preserve the existing bounded rescan fallback behavior
- Rollout/rollback expectations:
  - Deploy as a code change to the reception app; no migration needed
  - Rollback is a simple revert -- the checkpoint format does not change
- Observability expectations:
  - Add an `errors` count to `SyncInboxResult.counts` so the API caller can see how many threads failed
  - Log per-thread errors with thread ID for debugging
  - Consider adding a `thread_sync_error` event type to `thread_events` for failed threads

## Suggested Task Seeds (Non-binding)

1. **Add per-thread error isolation:** Wrap the thread processing loop body (lines 601-789) in try/catch. On catch, log the error, increment an error counter, record a telemetry event, and continue to the next thread. Set a `hasErrors` flag.
2. **All-or-nothing checkpoint advancement:** After the loop, only advance the checkpoint to `finalProfile.historyId` if `hasErrors` is false (all threads succeeded). If any thread failed, keep the previous checkpoint so the next sync re-discovers all threads from the same history point. Successfully-processed threads will be harmlessly re-processed due to idempotent upserts.
3. **Add error count to SyncInboxResult:** Add `threadErrors` to `counts` so the API caller can detect partial failures.
4. **Add unit tests:** Test partial batch failure (one thread throws, others succeed), checkpoint hold-back on partial failure, and error counting.

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - Per-thread error isolation implemented with try/catch in sync loop
  - All-or-nothing checkpoint advancement (hold checkpoint on any thread failure)
  - Error count added to SyncInboxResult
  - Unit tests covering partial failure, checkpoint hold-back, error counting
- Post-delivery measurement plan:
  - Monitor `threadErrors` count in sync API responses for partial failure frequency
  - Monitor `thread_sync_error` telemetry events for individual thread failure patterns
  - Verify checkpoint is held back on partial failure via sync metadata logs (mode, error count in checkpoint metadata)

## Evidence Gap Review

### Gaps Addressed

- [Citation integrity] All claims about checkpoint behavior, loop structure, D1 batch atomicity, and recovery coverage are traced to specific file paths and line numbers
- [Boundary coverage] Gmail API error path (stale history) is covered; D1 batch atomicity is confirmed; draft generation error path is traced
- [Error/fallback paths] The absence of per-thread error handling is confirmed as the core gap; the bounded rescan fallback and recovery pipeline are documented as partial mitigations
- [Testing coverage] Existing tests verified (sync.server.test.ts, recovery.server.test.ts); coverage gaps for error paths identified

### Confidence Adjustments

- No downward adjustments needed. Evidence is direct and from primary sources (the actual code).

### Remaining Assumptions

- D1 transient write failures are rare. If they become frequent, the re-processing overhead from checkpoint hold-back may become noticeable, but upsert idempotency keeps it safe.
- The all-or-nothing checkpoint policy is acceptable from a performance standpoint. In practice, individual thread failures should be infrequent, so re-processing the full batch is a rare event.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan reception-inbox-partial-sync-recovery --auto`
