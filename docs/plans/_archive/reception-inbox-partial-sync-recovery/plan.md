---
Type: Plan
Status: Archived
Domain: Platform
Workstream: Engineering
Created: 2026-03-07
Last-reviewed: 2026-03-07
Last-updated: 2026-03-07
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-inbox-partial-sync-recovery
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception Inbox Partial Sync Recovery Plan

## Summary

The reception inbox sync pipeline crashes entirely when any single thread fails during processing, and advances its checkpoint unconditionally to the Gmail profile's current historyId regardless of processing outcome. This plan adds per-thread error isolation (try/catch in the processing loop) and all-or-nothing checkpoint advancement (hold the checkpoint back when any thread fails). The primary change is in `sync.server.ts` with a supporting change to `telemetry.server.ts` (new `thread_sync_error` event type). No schema changes. A new `checkpointAdvanced` boolean on `SyncInboxResult` lets callers distinguish persisted from held-back checkpoints. Unit tests verify partial failure handling, checkpoint hold-back, and error counting.

## Active tasks

- [x] TASK-01: Add per-thread error isolation and all-or-nothing checkpoint hold-back
- [x] TASK-02: Add unit tests for partial sync failure and checkpoint hold-back

## Goals

- Hold back the sync checkpoint when any thread fails during processing, so the next sync re-discovers all threads from the same history point
- Prevent permanent thread skipping when individual threads fail during a batch sync
- Add per-thread error isolation so one failing thread does not crash the entire sync

## Non-goals

- Rewriting the sync architecture (push-based, streaming, etc.)
- Adding a dead-letter queue or persistent retry queue
- Changing the Gmail history API integration pattern
- Adding UI-visible sync status or error reporting
- Adding a circuit breaker (deferred to follow-up if systematic failures are observed)

## Constraints & Assumptions

- Constraints:
  - D1 does not support cross-statement transactions beyond `db.batch()` -- each batch is atomic but there is no multi-batch transaction
  - Gmail History API returns a monotonically increasing `historyId` -- checkpoint must only move forward
  - `SyncInboxResult.checkpoint.nextHistoryId` is typed as non-null `string` -- always set to `finalProfile.historyId`; new `checkpointAdvanced: boolean` field indicates whether the checkpoint was persisted
  - Tests run in CI only (per testing policy) -- do not run locally
- Assumptions:
  - Individual thread failures are rare; re-processing the full batch on partial failure is an acceptable trade-off for correctness
  - Upserts are idempotent (ON CONFLICT DO UPDATE) so re-processing is safe

## Inherited Outcome Contract

- **Why:** A single sync failure can permanently skip threads, causing emails to be missed. This is the most dangerous reliability gap in the pipeline.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Sync checkpoint is held back (not advanced) when any thread fails during processing, ensuring no threads are permanently skipped. On partial failure, the next sync re-discovers all threads from the same history point, giving failed threads another chance.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/reception-inbox-partial-sync-recovery/fact-find.md`
- Key findings used:
  - No try/catch in main processing loop (sync.server.ts lines 601-789)
  - Checkpoint set to `finalProfile.historyId` disconnected from processing outcome (lines 791-805)
  - D1 `db.batch()` is per-thread atomic, not per-sync
  - Per-thread `gmailHistoryId` is not suitable as checkpoint watermark (history is mailbox-global, not ordered per-thread)
  - Recovery pipeline only covers threads already persisted to D1
  - Existing test mock infrastructure supports per-thread failure injection

## Proposed Approach

- Option A: Per-thread watermark checkpoint (advance to max successful thread historyId) -- REJECTED: unsafe because Gmail history is mailbox-global, not ordered per-thread. A successful thread with historyId=150 would skip a failed thread with historyId=120.
- Option B: All-or-nothing checkpoint hold-back (advance only when all threads succeed) -- CHOSEN: simplest correct strategy. On partial failure, checkpoint stays put and next sync re-discovers everything. Re-processing overhead is acceptable due to idempotent upserts.
- Chosen approach: Option B -- all-or-nothing checkpoint with per-thread error isolation

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Per-thread error isolation + checkpoint hold-back | 85% | M | Complete (2026-03-07) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Unit tests for partial failure and checkpoint hold-back | 85% | M | Complete (2026-03-07) | TASK-01 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Core implementation |
| 2 | TASK-02 | TASK-01 | Tests depend on implementation changes |

## Tasks

### TASK-01: Add per-thread error isolation and all-or-nothing checkpoint hold-back

- **Type:** IMPLEMENT
- **Deliverable:** code-change to `apps/reception/src/lib/inbox/sync.server.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-07)
- **Affects:** `apps/reception/src/lib/inbox/sync.server.ts`, `apps/reception/src/lib/inbox/telemetry.server.ts`
- **Depends on:** -
- **Blocks:** TASK-02
- **Build evidence:** All acceptance criteria met. Per-thread loop body extracted into `processThread()` helper function to stay under ESLint complexity limit (max 60). `syncInbox()` now calls `processThread()` inside try/catch for each thread. `checkpointAdvanced` and `threadErrors` added to `SyncInboxResult`. `thread_sync_error` added to `InboxEventType`. Conditional checkpoint via `if (!hasErrors)`. Typecheck passes (only pre-existing `getPendingDraft` error). Lint passes (no errors for sync.server.ts).
- **Confidence:** 85%
  - Implementation: 90% - Clear code paths, single file change, well-understood loop structure. Held-back test: no single unresolved unknown would drop this below 80 because all error paths and the checkpoint write location are fully traced.
  - Approach: 90% - All-or-nothing checkpoint is the simplest correct strategy; no complex watermark tracking needed.
  - Impact: 85% - Directly prevents permanent thread skipping. The only residual risk is that re-processing overhead could be noticeable if failures are frequent, but this is a rare-event trade-off.
- **Acceptance:**
  - [ ] Thread processing loop body (lines 601-789) is wrapped in try/catch
  - [ ] On catch: error is logged with threadId, `threadErrors` counter is incremented, a `thread_sync_error` telemetry event is recorded via `recordInboxEvent`, and processing continues to the next thread
  - [ ] A `hasErrors` boolean flag is set to `true` on any caught error
  - [ ] `SyncInboxResult.counts` includes a new `threadErrors: number` field (default 0)
  - [ ] After the loop: checkpoint is advanced to `finalProfile.historyId` ONLY if `hasErrors` is false
  - [ ] After the loop: if `hasErrors` is true, checkpoint is NOT advanced (previous checkpoint is preserved)
  - [ ] `SyncInboxResult.checkpointAdvanced` is a new boolean field: `true` when checkpoint was persisted, `false` when held back
  - [ ] `SyncInboxResult.checkpoint.nextHistoryId` always returns `finalProfile.historyId` (the value the checkpoint would advance to); callers use `checkpointAdvanced` to know if it was persisted
  - [ ] Existing behavior is preserved: bounded rescan fallback, guest email map error swallowing, draft dedup, admission recording
  - [ ] `recordInboxEvent` call in the catch block is wrapped in its own try/catch (best-effort telemetry, must not mask the original error)
- **Validation contract (TC-XX):**
  - TC-01: All threads succeed -> checkpoint advances to `finalProfile.historyId` -> `threadErrors` is 0
  - TC-02: One thread throws (`getGmailThread` rejects) -> other threads still process -> checkpoint is NOT advanced -> `threadErrors` is 1
  - TC-03: All threads throw -> checkpoint is NOT advanced -> `threadErrors` equals thread count
  - TC-04: `recordInboxEvent` throws in catch block -> original error is still counted, processing continues
  - TC-05: Initial sync (no previous checkpoint) with partial failure -> checkpoint is not written -> `checkpointAdvanced` is false -> `nextHistoryId` is `finalProfile.historyId`
- **Execution plan:** Red -> Green -> Refactor
  1. Add `"thread_sync_error"` to the `inboxEventTypes` array in `telemetry.server.ts` (line 11-22)
  2. Add `threadErrors` field to `SyncInboxResult.counts` type (line ~80) in `sync.server.ts`
  3. Add `checkpointAdvanced: boolean` field to `SyncInboxResult` (top-level, next to `checkpoint`)
  4. Add `let hasErrors = false` and `let threadErrors = 0` before the loop
  5. Wrap the for-loop body (lines 601-789) in try/catch
  6. In catch: `console.error(...)`, `threadErrors += 1`, `hasErrors = true`, best-effort `recordInboxEvent({ threadId, eventType: "thread_sync_error", metadata: { error: ... } })`
  7. After the loop: conditionally call `upsertInboxSyncCheckpoint` only if `!hasErrors`
  8. Set `checkpointAdvanced` to `!hasErrors` in the return value
  9. Set `nextHistoryId` in the return value: always use `finalProfile.historyId` (the value the checkpoint would advance to). Callers use `checkpointAdvanced` to know whether it was persisted.
  10. Update `counts` to include `threadErrors`
- **Consumer tracing:**
  - `SyncInboxResult.counts.threadErrors` (new field): consumed by the route handler at `apps/reception/src/app/api/mcp/inbox-sync/route.ts` which serializes the full result to JSON. No code change needed in the route -- it passes `data: result` through. The MCP tool `mcp__brikette__gmail_organize_inbox` reads the sync result; the new field is additive and backwards-compatible.
  - `SyncInboxResult.checkpointAdvanced` (new field): consumed by the route handler (serialized to JSON). Additive field, no consumer code changes needed. Callers can use this to distinguish between "checkpoint saved" and "checkpoint held back."
  - `SyncInboxResult.checkpoint.nextHistoryId` (semantic change): previously always meant "persisted checkpoint." Now means "candidate checkpoint value" -- it is always `finalProfile.historyId` regardless of whether the checkpoint was persisted. Callers that previously assumed `nextHistoryId` was always persisted must now also check `checkpointAdvanced`. Known callers: the route handler (passes through to JSON, no logic depends on the value) and the browser `runInboxSync()` helper in `useInbox.ts` (discards the sync payload entirely). Neither caller relies on `nextHistoryId` semantics, so no consumer code changes are needed.
  - `inboxEventTypes` array in `telemetry.server.ts` (extended): `"thread_sync_error"` added. No consumer changes needed -- `InboxEventType` union widens automatically.
  - `upsertInboxSyncCheckpoint` (conditionally skipped): no other code path calls this during sync. The checkpoint row in D1 simply retains its previous value.
- **Planning validation (required for M/L):**
  - Checks run: Verified loop structure (lines 601-789), checkpoint write location (lines 791-805), `SyncInboxResult` type (lines 75-94), return statement (lines 807-816)
  - Validation artifacts: `apps/reception/src/lib/inbox/sync.server.ts` read in full
  - Unexpected findings: None
- **Scouts:** None: all code paths are traced and well-understood from the fact-find
- **Edge Cases & Hardening:**
  - Edge: `getGmailProfile()` call at end of sync throws -- this is outside the per-thread loop and should continue to throw (crash-safe, checkpoint not advanced). No change needed.
  - Edge: All threads have no inbound messages (all `continue` before any error-capable code) -- `hasErrors` stays false, checkpoint advances normally. Correct behavior.
  - Edge: `buildGuestEmailMap()` fails -- already swallowed with empty map fallback (line 594-599). Not affected by this change.
  - Edge: Initial sync with no previous checkpoint and partial failure -- do NOT call `upsertInboxSyncCheckpoint`. No checkpoint row is created, and the next sync starts as another initial rescan. `nextHistoryId` is `finalProfile.historyId`, `checkpointAdvanced` is false.
- **What would make this >=90%:**
  - Verified by running tests in CI after implementation
- **Rollout / rollback:**
  - Rollout: Deploy as code change to reception app; no migration, no config change
  - Rollback: Revert the commit; checkpoint format is unchanged
- **Documentation impact:**
  - None: internal implementation detail, no public API contract change (additive field only)
- **Notes / references:**
  - Fact-find resolved question on checkpoint strategy: all-or-nothing is the only safe approach because Gmail history is mailbox-global

### TASK-02: Add unit tests for partial sync failure and checkpoint hold-back

- **Type:** IMPLEMENT
- **Deliverable:** code-change to `apps/reception/src/lib/inbox/__tests__/sync.server.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-07)
- **Build evidence:** 4 new tests added in "partial sync failure and checkpoint hold-back" describe block. Tests cover: (1) partial failure -- one thread fails, checkpoint not advanced, threadErrors=1, (2) all threads succeed -- checkpoint advanced, threadErrors=0, (3) all threads fail -- checkpoint not advanced, threadErrors=2, (4) telemetry failure in catch block does not mask error. buildGuestEmailMap mock added to test setup. Lint passes after eslint autofix.
- **Affects:** `apps/reception/src/lib/inbox/__tests__/sync.server.test.ts`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% - Existing mock infrastructure covers all dependencies (`getGmailThread`, `getGmailProfile`, `upsertInboxSyncCheckpoint`, `recordInboxEvent`, etc.). The mock setup supports per-call behavior via `mockResolvedValueOnce`/`mockRejectedValueOnce`.
  - Approach: 90% - Standard unit test patterns; inject failures via mocked rejections.
  - Impact: 85% - Tests validate the core safety invariant (checkpoint hold-back on partial failure).
- **Acceptance:**
  - [ ] Test: partial failure -- `getGmailThread` rejects for one thread, succeeds for others -> `upsertInboxSyncCheckpoint` is NOT called -> `result.counts.threadErrors` is 1 -> other threads are still processed (counts reflect successful processing)
  - [ ] Test: full success -- all threads succeed -> `upsertInboxSyncCheckpoint` IS called with `finalProfile.historyId` -> `threadErrors` is 0
  - [ ] Test: all threads fail -> `upsertInboxSyncCheckpoint` is NOT called -> `threadErrors` equals total thread count
  - [ ] Test: telemetry error in catch block does not mask original error -- `recordInboxEvent` rejects in catch handler -> processing continues -> `threadErrors` is still incremented
  - [ ] Test: `result.checkpointAdvanced` is false on partial failure and true on full success
  - [ ] Test: `result.checkpoint.nextHistoryId` equals `finalProfile.historyId` in both cases
  - [ ] All new tests follow existing patterns in `sync.server.test.ts` (same mock setup, same test structure)
- **Validation contract (TC-XX):**
  - TC-01: Partial failure test -> `upsertInboxSyncCheckpoint` not called, `threadErrors === 1`
  - TC-02: Full success test -> `upsertInboxSyncCheckpoint` called once with correct historyId, `threadErrors === 0`
  - TC-03: All-fail test -> `upsertInboxSyncCheckpoint` not called, `threadErrors === threadIds.length`
  - TC-04: Telemetry-error-in-catch test -> `threadErrors` still incremented, no unhandled rejection
  - TC-05: `checkpointAdvanced` flag test -> false on partial failure, true on full success; `nextHistoryId` always equals `finalProfile.historyId`
- **Execution plan:** Red -> Green -> Refactor
  1. Add new `describe("partial sync failure")` block in `sync.server.test.ts`
  2. Set up mock with 2+ threads, one `getGmailThread` rejecting
  3. Assert `upsertInboxSyncCheckpoint` was NOT called
  4. Assert `result.counts.threadErrors === 1`
  5. Assert other threads were processed (counts > 0)
  6. Add full-success test asserting checkpoint IS advanced
  7. Add all-fail test
  8. Add telemetry-error-in-catch test
  9. Add `nextHistoryId` value assertions to existing tests
- **Consumer tracing:**
  - Tests only -- no new production outputs.
- **Planning validation (required for M/L):**
  - Checks run: Verified existing test file mock setup (lines 1-68), `createFakeDb()` helper, mock structure for `getGmailThread` (supports per-call rejection)
  - Validation artifacts: `apps/reception/src/lib/inbox/__tests__/sync.server.test.ts` read
  - Unexpected findings: None -- mock infrastructure already supports the needed injection patterns
- **Scouts:** None: mock infrastructure verified
- **Edge Cases & Hardening:**
  - Edge: Test must verify that successfully-processed threads before the failing thread are still reflected in counts (not rolled back)
  - Edge: Test must verify that threads after the failing thread are still attempted (error isolation confirmed)
- **What would make this >=90%:**
  - Tests passing in CI
- **Rollout / rollback:**
  - Rollout: Tests added alongside implementation; CI validates
  - Rollback: Revert with implementation
- **Documentation impact:**
  - None
- **Notes / references:**
  - Tests run in CI only per testing policy

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Per-thread try/catch masks systematic failures (e.g., expired auth token) | Medium | Medium | Monitor `threadErrors` count in sync responses; consider circuit breaker in follow-up if systematic failures observed |
| Re-processing overhead on partial failure | Medium | Low | Upserts are idempotent; re-processing is safe, just redundant. Acceptable trade-off for correctness. |
| `recordInboxEvent` in catch block fails | Low | Low | Wrapped in its own try/catch (best-effort telemetry) |

## Observability

- Logging: `console.error` with threadId on per-thread failure
- Metrics: `threadErrors` count in `SyncInboxResult` returned to API caller
- Alerts/Dashboards: None in this change; MCP tool consumers can inspect `threadErrors` field

## Acceptance Criteria (overall)

- [ ] Per-thread error isolation: one failing thread does not crash the entire sync
- [ ] Checkpoint hold-back: checkpoint is NOT advanced when any thread fails
- [ ] Checkpoint advancement: checkpoint IS advanced when all threads succeed (existing behavior preserved)
- [ ] Error counting: `SyncInboxResult.counts.threadErrors` reflects the number of failed threads
- [ ] Type compatibility: `SyncInboxResult.checkpoint.nextHistoryId` remains a non-null string; new `checkpointAdvanced` boolean indicates persistence
- [ ] Unit tests cover: partial failure, full success, all-fail, telemetry error in catch, nextHistoryId value
- [ ] Existing test suite passes (no regressions)
- [ ] `pnpm typecheck && pnpm lint` passes

## Decision Log

- 2026-03-07: Rejected per-thread historyId watermark approach (Option A) -- Gmail history is mailbox-global, not ordered per-thread. Using `max(thread.historyId)` of successful threads would permanently skip failed threads with lower historyIds.
- 2026-03-07: Chose all-or-nothing checkpoint hold-back (Option B) -- simplest correct strategy. Re-processing overhead on partial failure is acceptable due to idempotent upserts.
- 2026-03-07: Deferred circuit breaker to follow-up -- not evidence-backed as necessary scope for this change. Will add if systematic failures are observed in production.

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Per-thread error isolation + checkpoint hold-back | Yes | None -- all code paths traced, single file change, no dependencies on other tasks or external state | No |
| TASK-02: Unit tests for partial failure and checkpoint hold-back | Yes | None -- depends on TASK-01 code changes; mock infrastructure verified; test patterns established | No |

## Overall-confidence Calculation

- TASK-01: 85% * M(2) = 170
- TASK-02: 85% * M(2) = 170
- Total: 340 / 4 = 85%
