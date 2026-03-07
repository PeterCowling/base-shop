---
Type: Plan
Status: Archived
Domain: API
Workstream: Engineering
Created: 2026-03-07
Last-reviewed: 2026-03-07
Last-updated: 2026-03-07T15:00:00Z
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-inbox-draft-dedup
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception Inbox Draft Dedup Plan

## Summary

The reception inbox sync pipeline creates a new draft row every time a thread is re-synced, even when a pending draft already exists. This produces orphaned draft rows in the D1 database. The fix adds a dedup guard to the sync pipeline's draft creation path: check for an existing pending draft (status `generated`) before inserting, and update it instead of creating a duplicate. Drafts with status `edited` or `approved` are preserved (not overwritten) to protect operator work. Five unit test scenarios verify the dedup, protection, and regression behaviors.

## Active tasks

- [x] TASK-01: Add `getPendingDraft` helper to `api-models.server.ts`
- [x] TASK-02: Add dedup guard to sync pipeline draft creation
- [x] TASK-03: Add unit tests for draft dedup behavior

## Goals

- Only one pending draft per thread at any time in the D1 database.
- Subsequent sync runs update the existing `generated` draft rather than inserting a new row.
- Drafts with status `edited` or `approved` are never overwritten by the sync pipeline.

## Non-goals

- Retroactive cleanup of existing duplicate drafts.
- Changing the MCP `draft_generate` tool (it does not persist to DB).
- Changing the UI rendering logic or draft lifecycle statuses.
- Modifying the Gmail-level dedup in `gmail_create_draft` (already working).

## Constraints & Assumptions

- Constraints:
  - No DB migration. Application-level guard only.
  - D1 single-writer model means true concurrent duplicate inserts are not possible; the application-level check is sufficient.
- Assumptions:
  - The sync pipeline (`sync.server.ts` line 612) is the only unguarded draft creation path. The PUT and regenerate routes already have upsert logic.
  - `getCurrentDraft` is not status-aware and must not be reused for the dedup check.

## Inherited Outcome Contract

- **Why:** Duplicate pending drafts for the same thread create confusion in the inbox UI and waste operator attention sorting through redundant drafts.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Only one pending draft exists per thread at any time; subsequent draft_generate calls either replace or skip if a pending draft already exists.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/reception-inbox-draft-dedup/fact-find.md`
- Key findings used:
  - Primary duplication vector: `sync.server.ts` line 612 calls `createDraft` without checking for existing drafts.
  - `getCurrentDraft` returns `drafts[0]` regardless of status — not safe for dedup check.
  - PUT and regenerate routes already implement check-then-update pattern.
  - Draft status lifecycle: `generated` -> `edited` -> `approved` -> `sent`.
  - Existing test infrastructure supports new tests via `db` parameter injection.

## Proposed Approach

- Option A: Add a `getPendingDraft` helper that filters by `status = 'generated'`, then modify the sync pipeline to call `updateDraft` when a pending draft exists and `createDraft` only when none exists. Skip draft creation entirely if an `edited`/`approved` draft exists.
- Option B: Add a SQL UNIQUE partial index on `(thread_id) WHERE status IN ('generated', 'edited')` and catch constraint violations. Requires a migration.
- Chosen approach: Option A. Application-level guard with no migration. Consistent with patterns already in the codebase (PUT route, regenerate route). Simpler, lower risk, faster to ship.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add `getPendingDraft` helper | 90% | S | Complete (2026-03-07) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Add dedup guard to sync pipeline | 85% | S | Complete (2026-03-07) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Add unit tests for draft dedup | 85% | S | Complete (2026-03-07) | TASK-01, TASK-02 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Pure helper function, no side effects |
| 2 | TASK-02 | TASK-01 | Uses the new helper in sync pipeline |
| 3 | TASK-03 | TASK-01, TASK-02 | Tests verify both helper and sync pipeline behavior |

## Tasks

### TASK-01: Add `getPendingDraft` helper to `api-models.server.ts`

- **Type:** IMPLEMENT
- **Deliverable:** New exported function `getPendingDraft` in `apps/reception/src/lib/inbox/api-models.server.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-07)
- **Affects:** `apps/reception/src/lib/inbox/api-models.server.ts`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 90%
  - Implementation: 95% — pure filter function on an existing array, trivial logic
  - Approach: 95% — follows the same module pattern as `getCurrentDraft`
  - Impact: 90% — helper enables the dedup guard; if the filter logic is wrong, dedup fails
- **Acceptance:**
  - `getPendingDraft(record)` returns the most recent draft with `status === "generated"`, or `null` if none exists.
  - Drafts with status `edited`, `approved`, or `sent` are never returned.
  - Exported from `api-models.server.ts` alongside `getCurrentDraft`.
- **Validation contract (TC-XX):**
  - TC-01: Thread with one `generated` draft -> returns that draft.
  - TC-02: Thread with one `edited` draft -> returns `null`.
  - TC-03: Thread with no drafts -> returns `null`.
  - TC-04: Thread with both `generated` and `edited` drafts -> returns only the `generated` one.
  - TC-05: Thread with one `sent` draft -> returns `null`.
- **Execution plan:**
  - Red: Write `getPendingDraft` function that filters `record.drafts` by `status === "generated"` and returns the first match (array is already sorted by `updated_at DESC`).
  - Green: Export it. Verify TypeScript compiles.
  - Refactor: None needed — function is trivial.
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** None: trivial filter function.
- **Edge Cases & Hardening:**
  - Empty `drafts` array -> returns `null` (safe, `.find()` returns `undefined` -> `?? null`).
  - Multiple `generated` drafts -> returns most recent (first in the DESC-sorted array). This is correct: the dedup guard in TASK-02 will update this one.
- **What would make this >=90%:**
  - Already at 90%. Would reach 95% with the test from TASK-03 passing.
- **Rollout / rollback:**
  - Rollout: Deploy with TASK-02. Helper alone has no behavioral impact.
  - Rollback: Revert the function. No consumers outside this feature.
- **Documentation impact:** None.
- **Notes / references:**
  - `getCurrentDraft` (line 147 of `api-models.server.ts`) is the existing status-unaware helper. `getPendingDraft` is the status-filtered complement.

### TASK-02: Add dedup guard to sync pipeline draft creation

- **Type:** IMPLEMENT
- **Deliverable:** Modified draft creation block in `apps/reception/src/lib/inbox/sync.server.ts` — extracted to `upsertSyncDraft` function
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-07)
- **Affects:** `apps/reception/src/lib/inbox/sync.server.ts`, `[readonly] apps/reception/src/lib/inbox/api-models.server.ts`, `[readonly] apps/reception/src/lib/inbox/repositories.server.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 85%
  - Implementation: 85% — logic is straightforward but requires reading the thread record before draft creation, which may need an additional `getThread` call or use of the thread record already available in the sync loop. Held-back test: no single unknown would drop this below 80 — the thread data is already fetched upstream in the sync loop for admission/message upsert, and `getThread` returns drafts in its record.
  - Approach: 90% — mirrors the pattern in `regenerate/route.ts` lines 101-129
  - Impact: 90% — directly eliminates the primary duplication vector
- **Acceptance:**
  - When syncing a thread that already has a `generated` draft, the existing draft is updated (not duplicated).
  - When syncing a thread that has an `edited` or `approved` draft, draft creation is skipped entirely (operator work is preserved).
  - When syncing a thread with no existing draft, a new draft is created as before.
  - Thread metadata `lastDraftId` is updated correctly in all cases.
- **Validation contract (TC-XX):**
  - TC-01: Re-sync thread with existing `generated` draft -> draft count remains 1, draft content is updated to the new generation.
  - TC-02: Re-sync thread with existing `edited` draft -> draft is not overwritten, no new draft created, thread status remains `drafted` (not regressed to `pending`).
  - TC-03: Re-sync thread with existing `approved` draft -> same as TC-02 (draft preserved, thread status remains `drafted`).
  - TC-04: Sync new thread with no drafts -> new `generated` draft is created (existing behavior preserved).
  - TC-05: Re-sync thread with existing `sent` draft -> new `generated` draft is created (sent drafts do not block new generation).
- **Execution plan:**
  - Red: Before the `createDraft` call at line 612, fetch the thread record via `getThread(threadId, db)` and call `getPendingDraft(record)`.
    - If a `generated` draft exists: call `updateDraft` with the existing draft's ID and the new content.
    - If an `edited`/`approved` draft exists (check `getCurrentDraft(record)` for non-null with status `edited`/`approved`): skip draft creation entirely. Handle three downstream consumers with separate control variables:
      1. Set `draftCreated = true` so `determineThreadStatus` returns `drafted` (not `pending`). Without this, `determineThreadStatus(admission, false, false)` regresses to `pending`.
      2. Set `draftId` to the existing draft's ID for the `updateThreadStatus` metadata at line 637.
      3. Introduce `draftIsNew = false` (new boolean) to gate the `drafted` telemetry event at line 677-688 and the `counts.draftsCreated` increment at line 688. The operator already has their draft; emitting a `drafted` event would miscount.
      4. Preserve thread metadata: do NOT overwrite `draftTemplateSubject` or `draftQualityPassed` with the newly generated candidate values. These metadata fields (used by `buildThreadMetadata` at line 593) belong to the existing operator-acted draft. Keep them from `existingMetadata` or read them from the existing draft row.
    - If no relevant draft exists: call `createDraft` as before, set `draftIsNew = true`.
  - Green: Verify TypeScript compiles. Existing sync tests pass.
  - Refactor: Extract the decision logic into a named function `upsertSyncDraft` if the inline block exceeds ~15 lines.

  **Consumer tracing (new outputs):**
  - `draftId` variable: consumed by `updateThreadStatus` at line 628. Set from `updateDraft` return (update path), existing draft ID (skip path), or `createDraft` return (create path). All paths addressed.
  - `draftCreated` boolean: consumed by `determineThreadStatus` at line 592. Set to `true` in all paths where a usable draft exists (update, skip, create). Ensures thread status stays `drafted`.
  - `draftIsNew` boolean (new): gates `drafted` telemetry event (line 677-688) and `counts.draftsCreated` (line 688). `true` only on create path and update path (where content changed). `false` on skip path (no content change, no event).
  - `draftTemplateSubject` / `draftQualityPassed`: consumed by `buildThreadMetadata` at line 593. On skip path, NOT updated from the discarded generation — retain existing values from `existingMetadata`.

  **Modified behavior check:**
  - `createDraft` call at line 612: modified to be conditional. Callers: only this location in `sync.server.ts`. No other callers affected.

- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** None: the `getThread` function already exists and accepts the `db` parameter.
- **Edge Cases & Hardening:**
  - Thread record not found (deleted between admission and draft creation): `getThread` returns `null` -> skip draft creation entirely. This is safe — the thread was deleted.
  - Multiple existing `generated` drafts (legacy data): `getPendingDraft` returns the most recent one. The update replaces it. Older duplicates remain as orphans (cleanup is a non-goal).
- **What would make this >=90%:**
  - Verified with TASK-03 tests passing. Currently at 85% due to the need to verify the thread record availability within the sync loop.
- **Rollout / rollback:**
  - Rollout: Standard deploy. No migration.
  - Rollback: Revert commit. Behavior returns to current (duplicates accumulate).
- **Documentation impact:** None.
- **Notes / references:**
  - The `regenerate/route.ts` already implements this pattern (lines 64-67, 101-129). The sync pipeline implementation follows the same structure.
  - Note: the sync loop already calls `upsertThreadAndMessages` at line 607 which creates/updates the thread. A `getThread` call after this point will return the thread with its drafts array.

### TASK-03: Add unit tests for draft dedup behavior

- **Type:** IMPLEMENT
- **Deliverable:** 5 test cases added to `apps/reception/src/lib/inbox/__tests__/sync.server.test.ts` under `describe("draft dedup")`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-07)
- **Affects:** `apps/reception/src/lib/inbox/__tests__/sync.server.test.ts`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — test patterns exist in `sync.server.test.ts`; need to verify mock setup supports draft pre-seeding
  - Approach: 90% — standard Jest unit test with D1 mock
  - Impact: 85% — tests verify the dedup guard works correctly
- **Acceptance:**
  - Test: re-syncing a thread with a `generated` draft results in one draft (updated, not duplicated).
  - Test: re-syncing a thread with an `edited` draft preserves the edited draft, does not create a new one, and thread status remains `drafted`.
  - Test: re-syncing a thread with an `approved` draft preserves the approved draft and thread status remains `drafted`.
  - Test: re-syncing a thread with a `sent` draft creates a new `generated` draft (sent drafts do not block new generation).
  - Test: syncing a new thread creates a draft as before (regression guard).
  - All existing sync tests continue to pass.
- **Validation contract (TC-XX):**
  - TC-01: Sync thread twice -> second sync updates existing `generated` draft, total draft count = 1.
  - TC-02: Sync thread, manually edit draft (set status `edited`), sync again -> edited draft preserved, total draft count = 1, thread status = `drafted`.
  - TC-03: Sync new thread -> draft created with status `generated`, total draft count = 1 (regression baseline).
  - TC-04: Sync thread, approve draft (set status `approved`), sync again -> approved draft preserved, total draft count = 1, thread status = `drafted`.
  - TC-05: Sync thread, send draft (set status `sent`), sync again -> new `generated` draft created, total draft count = 2 (sent + new generated).
- **Execution plan:**
  - Red: Write test cases using existing mock patterns from `sync.server.test.ts`. Pre-seed the D1 mock with a thread and draft row before re-syncing.
  - Green: Run tests. Verify they pass with the TASK-02 implementation.
  - Refactor: Group tests under a `describe("draft dedup")` block.
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** None: test infrastructure already supports this pattern.
- **Edge Cases & Hardening:** None: tests themselves are the hardening mechanism.
- **What would make this >=90%:**
  - Verified test infrastructure supports draft pre-seeding in the D1 mock. Would confirm during implementation.
- **Rollout / rollback:**
  - Rollout: Tests run in CI only (per testing policy).
  - Rollback: Revert test file changes.
- **Documentation impact:** None.
- **Notes / references:**
  - Tests run in CI only per `docs/testing-policy.md`. Do not run locally.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Existing duplicate drafts remain after fix | Low | Low | Out of scope; follow-up cleanup can purge orphans |
| `getThread` call adds latency to sync pipeline | Very Low | Low | D1 read is fast; thread is already in DB from prior upsert step |
| Test mock setup does not support draft pre-seeding | Low | Low | Adapt mock or create new test file with simpler setup |

## Observability

- Logging: Existing `recordInboxEvent` with `event_type: "drafted"` currently fires on new draft creation in sync. After TASK-02, it will also fire when an existing `generated` draft is updated (replace path). This is an acceptable semantic broadening — the event means "a draft is now ready for review" in both cases. When the skip path fires (edited/approved draft preserved), the telemetry event should be omitted since no draft content changed.
- Metrics: `counts.draftsCreated` in the sync summary will need care: increment only on actual new inserts, not on updates. Use a `draftIsNew` boolean in TASK-02 to distinguish.
- Alerts/Dashboards: None new required.

## Acceptance Criteria (overall)

- [ ] No duplicate `generated` drafts are created when a thread is re-synced.
- [ ] Operator-edited (`edited`/`approved`) drafts are never overwritten by the sync pipeline.
- [ ] All existing sync and draft tests pass.
- [ ] New dedup tests pass in CI.
- [ ] TypeScript compiles without errors.

## Decision Log

- 2026-03-07: Chose application-level dedup guard (Option A) over DB constraint (Option B). Rationale: no migration needed, consistent with existing codebase patterns, lower risk.
- 2026-03-07: Chose "replace" strategy for `generated` drafts, "skip" for `edited`/`approved`. Rationale: operator work must be preserved; new generated drafts should reflect latest email content.
- 2026-03-07: Chose to add `getPendingDraft` helper rather than modifying `getCurrentDraft`. Rationale: `getCurrentDraft` is used by PUT and regenerate routes where status-unaware behavior is correct (they check status separately). Adding a status filter would change their semantics.

## Overall-confidence Calculation

- TASK-01: 90% * S(1) = 90
- TASK-02: 85% * S(1) = 85
- TASK-03: 85% * S(1) = 85
- Overall: (90 + 85 + 85) / 3 = 86.7% -> 85% (rounded to multiple of 5, downward bias)

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Add `getPendingDraft` helper | Yes | None | No |
| TASK-02: Add dedup guard to sync pipeline | Yes — depends on TASK-01 which produces the helper function; `getThread`, `updateDraft`, `createDraft` all exist in `repositories.server.ts` | None | No |
| TASK-03: Add unit tests | Yes — depends on TASK-01 and TASK-02; test infrastructure and mock patterns exist in `sync.server.test.ts` | None | No |
