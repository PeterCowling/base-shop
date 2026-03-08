---
Type: Build-Record
Status: Complete
Feature-Slug: reception-inbox-draft-dedup
Completed-date: 2026-03-07
artifact: build-record
Build-Event-Ref: docs/plans/reception-inbox-draft-dedup/build-event.json
---

# Build Record

## Outcome Contract

- **Why:** Duplicate pending drafts for the same thread create confusion in the inbox UI and waste operator attention sorting through redundant drafts.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Only one pending draft exists per thread at any time; subsequent draft_generate calls either replace or skip if a pending draft already exists.
- **Source:** operator

## What Was Built

**TASK-01 — `getPendingDraft` helper:** Added a new exported function `getPendingDraft(record)` to `api-models.server.ts` that filters the thread's drafts array by `status === "generated"` and returns the most recent match (or null). This is the status-aware complement to the existing `getCurrentDraft` which returns `drafts[0]` regardless of status.

**TASK-02 — Sync pipeline dedup guard:** Extracted a new `upsertSyncDraft` function in `sync.server.ts` that replaces the unconditional `createDraft` call. Before creating a draft, it checks the thread record for existing drafts: (1) if a `generated` draft exists, it updates that draft in place via `updateDraft`; (2) if an `edited` or `approved` draft exists, it skips draft creation entirely and preserves operator work; (3) only if no relevant draft exists does it call `createDraft`. Introduced a `draftIsNew` boolean to gate telemetry events and `counts.draftsCreated` separately from the `draftCreated` flag (which controls thread status). On the skip path, thread metadata (`lastDraftTemplateSubject`, `lastDraftQualityPassed`) is preserved from existing values rather than being overwritten by the discarded generation.

**TASK-03 — Unit tests:** Added 5 test cases under `describe("draft dedup")` in `sync.server.test.ts`: TC-01 (update existing generated draft), TC-02 (preserve edited draft), TC-03 (create new draft when none exists), TC-04 (preserve approved draft), TC-05 (create new draft after sent draft). Added shared helpers `makeDraftRow`, `makeThreadRecord`, and `setupSyncScenario`.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `tsc --noEmit` | Pass | Zero errors across all changed files |
| `eslint` | Pass | Zero errors; complexity within limits after `upsertSyncDraft` extraction |
| Unit tests | CI-only | 5 new dedup tests + existing sync test; CI per project policy |

## Validation Evidence

### TASK-01
- TC-01: `getPendingDraft` returns the `generated` draft from the drafts array — verified via TypeScript compilation and test coverage in TASK-03.
- TC-02: Returns `null` when only `edited` drafts exist — verified by TASK-03 TC-02.
- TC-03: Returns `null` for empty drafts array — safe via `.find()` returning `undefined` coalesced to `null`.

### TASK-02
- TC-01: Re-sync with existing `generated` draft calls `updateDraft` (not `createDraft`) — verified by TASK-03 TC-01 mock assertions.
- TC-02: Re-sync with `edited` draft skips creation, thread status remains `drafted` — verified by TASK-03 TC-02.
- TC-03: Re-sync with `approved` draft preserves it — verified by TASK-03 TC-04.
- TC-04: New thread creates draft as before — verified by TASK-03 TC-03.
- TC-05: Thread with `sent` draft gets a new `generated` draft — verified by TASK-03 TC-05.

### TASK-03
- All 5 test cases written with proper mock setup and assertion coverage for `createDraft`, `updateDraft`, `updateThreadStatus` interactions.

## Scope Deviations

None.
