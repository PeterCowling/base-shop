---
Type: Build-Record
Status: Complete
Feature-Slug: reception-inbox-draft-failure-reasons
Completed-date: 2026-03-07
artifact: build-record
Build-Event-Ref: docs/plans/reception-inbox-draft-failure-reasons/build-event.json
---

# Build Record: Reception Inbox Draft Failure Reasons

## Outcome Contract

- **Why:** When draft generation fails, reception staff have no way to understand what went wrong. They see "needs manual draft" but cannot tell if the email body was empty, the quality gate failed, or the template engine had no match. This slows triage and wastes staff time investigating causes that the system already knows.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Draft generation failures store a reason code and human-readable message in thread metadata, displayed in the inbox UI so staff knows what went wrong without investigating.
- **Source:** operator

## What Was Built

TASK-01 added `deriveDraftFailureReason()` and `draftFailureReasonFromCode()` to `draft-pipeline.server.ts`. These functions extract staff-facing failure reason codes and messages from `AgentDraftResult`. The sync pipeline (`sync.server.ts`) and recovery pipeline (`recovery.server.ts`) now persist `draftFailureCode` and `draftFailureMessage` in thread metadata whenever `needsManualDraft` is set. When a draft succeeds (sync, recovery, or regeneration), stale failure reasons are explicitly cleared to `null`.

TASK-02 flowed the failure reason through the full data pipeline: `InboxThreadMetadata` type gained two new fields, `buildThreadSummary` and `buildThreadSummaryFromRow` extract them from metadata JSON, `InboxThreadSummary` client type exposes them, `DraftReviewPanel.tsx` shows the specific failure message in the warning banner (e.g., "Auto-draft failed: Draft did not pass quality checks: unanswered questions, missing signature."), and `ThreadList.tsx` adds a `title` tooltip on the "Manual" badge so staff can hover for detail without opening the thread.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm typecheck` (reception) | Pass | Pre-existing `getPendingDraft` broken import fixed as part of commit |
| `npx eslint` (all changed files) | Pass | Pre-existing complexity eslint-disable on `syncInbox` added by concurrent agent |
| Unit tests (CI) | Pending | 10 new tests for `deriveDraftFailureReason` and `draftFailureReasonFromCode` |

## Validation Evidence

### TASK-01
- TC-01-A: `deriveDraftFailureReason()` returns `invalid_input` for error status with `invalid_input` code — 1 test
- TC-01-B: `deriveDraftFailureReason()` returns `generation_failed` for error status without error object — 1 test
- TC-01-C: `deriveDraftFailureReason()` returns `quality_gate_failed` with human-readable check labels — 2 tests
- TC-01-D: `deriveDraftFailureReason()` truncates to 3 failed check labels — 1 test
- TC-01-E: `draftFailureReasonFromCode()` returns default messages for known codes — 1 test
- TC-01-F: `draftFailureReasonFromCode()` accepts custom messages — 1 test
- TC-01-G: `draftFailureReasonFromCode()` returns generic fallback for unknown codes — 1 test
- TC-01-H: Sync failure branch calls `deriveDraftFailureReason()` and persists code/message — verified via code review
- TC-01-I: Recovery pipeline passes failure reason through `flagForManualDraft()` — verified via code review
- TC-01-J: Success paths clear `draftFailureCode` and `draftFailureMessage` to null — verified in sync, recovery, and regenerate

### TASK-02
- TC-02-A: `InboxThreadMetadata` type includes `draftFailureCode` and `draftFailureMessage` — verified
- TC-02-B: `buildThreadSummary()` and `buildThreadSummaryFromRow()` extract failure fields from metadata — verified
- TC-02-C: `InboxThreadSummary` client type includes failure fields — verified
- TC-02-D: `DraftReviewPanel.tsx` shows specific failure message in banner — verified
- TC-02-E: `ThreadList.tsx` badge has `title` tooltip with failure message — verified
- TC-02-F: Regeneration route clears failure fields on success — verified

## Scope Deviations

- Restored `getPendingDraft` export to `api-models.server.ts` — it was removed by a prior commit but still imported by `sync.server.ts`, breaking typecheck. This was a pre-existing broken import, not caused by this build. Fix was minimal (restore 3-line function).
