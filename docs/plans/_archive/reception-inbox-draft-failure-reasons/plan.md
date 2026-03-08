---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-07
Last-reviewed: 2026-03-07
Last-updated: 2026-03-07
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-inbox-draft-failure-reasons
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception Inbox Draft Failure Reasons Plan

## Summary

When draft generation fails during inbox sync or recovery, the system sets `needsManualDraft=true` but discards all failure detail. Staff see "Auto-draft unavailable" with no explanation. This plan adds two new optional fields (`draftFailureCode` and `draftFailureMessage`) to thread metadata, flows them through the API model and client type, and displays them in the inbox UI. The change touches two server-side pipelines (sync, recovery), the regeneration endpoint (clear-on-success only), and two UI components (DraftReviewPanel banner, ThreadList badge tooltip). No D1 migration is needed — metadata is flexible JSON.

## Active tasks

- [x] TASK-01: Add failure reason types, helper, and server-side persistence — Complete (2026-03-07)
- [x] TASK-02: Flow failure reason through API models, client types, and UI components — Complete (2026-03-07)

## Goals

- Store a structured failure reason (code + message) in thread metadata when `needsManualDraft` is set to true
- Surface failure reason in the inbox UI where the "Manual" badge and "Auto-draft unavailable" banner currently appear
- Cover sync pipeline and recovery pipeline — the two paths that persist `needsManualDraft: true`

## Non-goals

- Auto-retry logic changes
- Quality check threshold tuning
- Draft generation algorithm improvements
- D1 schema migrations
- Regeneration endpoint failure persistence (separate, lower-priority enhancement)

## Constraints & Assumptions

- Constraints:
  - No D1 schema migration — `metadata_json` is flexible JSON
  - Backward-compatible: threads without failure reason fields continue to work
  - Tests run in CI only
- Assumptions:
  - Staff need a summarized reason, not raw `failed_checks` arrays
  - The `AgentDraftResult` provides sufficient categorization for sync/recovery failures
  - Recovery `max_retries` path needs a standalone reason code (no `AgentDraftResult` available)

## Inherited Outcome Contract

- **Why:** When draft generation fails, reception staff have no way to understand what went wrong. They see "needs manual draft" but cannot tell if the email body was empty, the quality gate failed, or the template engine had no match. This slows triage and wastes staff time investigating causes that the system already knows.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Draft generation failures store a reason code and human-readable message in thread metadata, displayed in the inbox UI so staff knows what went wrong without investigating.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/reception-inbox-draft-failure-reasons/fact-find.md`
- Key findings used:
  - Three failure categories: `invalid_input`, `quality_gate_failed`, `max_retries_exceeded`
  - `needs_follow_up` is NOT an independent failure category — it falls through to quality_gate_failed when quality fails
  - Metadata is flexible JSON in D1 — no migration needed
  - `SyncThreadMetadata` -> `InboxThreadMetadata` -> `buildThreadSummary` -> `InboxThreadSummary` -> UI is the established data flow
  - Recovery `flagForManualDraft()` is a separate code path that must also persist failure reason
  - Recovery `max_retries` path (line 128-131) calls `flagForManualDraft` without an `AgentDraftResult`

## Proposed Approach

- Option A: Add `draftFailureCode` and `draftFailureMessage` as optional fields in metadata types, with a pure helper function `deriveDraftFailureReason(draftResult)` that maps `AgentDraftResult` to a `{ code, message }` tuple, plus a standalone overload for recovery-specific codes like `max_retries_exceeded`.
- Option B: Store the full `AgentDraftResult` in metadata and derive the message at display time.
- Chosen approach: Option A. Storing derived code+message is simpler, more space-efficient, and decouples UI display from pipeline internals. The helper function is easily testable in isolation.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add failure reason types, helper, and server-side persistence | 90% | M | Pending | - | TASK-02 |
| TASK-02 | IMPLEMENT | Flow failure reason through API models, client types, and UI | 90% | M | Pending | TASK-01 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Server-side types and persistence |
| 2 | TASK-02 | TASK-01 | API model + client + UI display |

## Tasks

### TASK-01: Add failure reason types, helper, and server-side persistence

- **Type:** IMPLEMENT
- **Deliverable:** code-change in `apps/reception/src/lib/inbox/`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-07)
- **Affects:**
  - `apps/reception/src/lib/inbox/sync.server.ts` — `SyncThreadMetadata` type + failure branch
  - `apps/reception/src/lib/inbox/draft-pipeline.server.ts` — new `deriveDraftFailureReason()` export
  - `apps/reception/src/lib/inbox/recovery.server.ts` — `flagForManualDraft()` signature + call sites
  - `apps/reception/src/lib/inbox/__tests__/draft-pipeline.server.test.ts` — unit tests
  - `[readonly] apps/reception/src/lib/inbox/draft-core/quality-check.ts` — `QualityCheckResult` type reference
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 90%
  - Implementation: 95% — Clear types and helper; well-understood data flow
  - Approach: 95% — Follows established metadata extension pattern
  - Impact: 85% — Persists reason data; UI benefit depends on TASK-02
- **Acceptance:**
  - [ ] `SyncThreadMetadata` has optional `draftFailureCode?: string | null` and `draftFailureMessage?: string | null` fields (matching existing nullable-metadata pattern e.g. `lastDraftTemplateSubject?: string | null`)
  - [ ] `deriveDraftFailureReason(draftResult: AgentDraftResult): { code: string; message: string }` helper exists in `draft-pipeline.server.ts` and maps:
    - `status === "error"` with `error.code === "invalid_input"` -> `{ code: "invalid_input", message: "The email had no body text to generate a reply from." }`
    - `qualityResult.passed === false` -> `{ code: "quality_gate_failed", message: "Draft did not pass quality checks: <primary failed check names>." }`
    - Fallback for any other failure: `{ code: "generation_failed", message: "Draft generation failed unexpectedly." }`
  - [ ] Standalone `draftFailureReasonFromCode(code: string, message?: string)` overload for recovery-specific codes
  - [ ] `sync.server.ts` failure branch (around line 679-681) calls `deriveDraftFailureReason(draftResult)` and includes `draftFailureCode` and `draftFailureMessage` in metadata
  - [ ] `recovery.server.ts` `flagForManualDraft()` accepts optional `failureCode` and `failureMessage` params and persists them in metadata
  - [ ] Recovery `max_retries` call site passes `code: "max_retries_exceeded"`, `message: "Draft generation failed after multiple retry attempts."`
  - [ ] Recovery draft-failed call site (line 238-241) calls `deriveDraftFailureReason(draftResult)` to derive failure reason
  - [ ] When draft generation succeeds (sync or recovery), `draftFailureCode` and `draftFailureMessage` are explicitly set to `null` in metadata to clear any stale failure reason from a prior cycle
  - [ ] Existing threads without the new fields continue to parse correctly (backward-compatible)
  - [ ] TypeScript compiles without errors
  - [ ] Unit tests for `deriveDraftFailureReason()` added to `apps/reception/src/lib/inbox/__tests__/draft-pipeline.server.test.ts` (or new file if test file does not exist) covering: invalid_input, quality_gate_failed (with specific failed_checks), max_retries_exceeded (via standalone helper), generation_failed (fallback), and edge cases (null qualityResult, empty failed_checks)
- **Validation contract (TC-01):**
  - TC-01: Sync with `draftResult.status === "error"` -> metadata includes `draftFailureCode: "invalid_input"` and human-readable message
  - TC-02: Sync with `qualityResult.passed === false` and `failed_checks: ["unanswered_questions", "missing_signature"]` -> metadata includes `draftFailureCode: "quality_gate_failed"` and message mentioning the failed checks
  - TC-03: Recovery `max_retries` path -> metadata includes `draftFailureCode: "max_retries_exceeded"`
  - TC-04: Recovery draft-failed path -> metadata includes derived failure code from `AgentDraftResult`
  - TC-05: Existing thread with `needsManualDraft: true` but no `draftFailureCode` -> `parseMetadata` returns `{}` for missing fields (no crash)
  - TC-06: Sync success path (draft created with quality passed) -> metadata has `draftFailureCode: null` and `draftFailureMessage: null` (clears any stale failure from prior cycle)
  - TC-07: Recovery success path (draft quality passed) -> metadata has `draftFailureCode: null` and `draftFailureMessage: null`
- **Execution plan:**
  1. Add `draftFailureCode` and `draftFailureMessage` optional fields to `SyncThreadMetadata` type in `sync.server.ts`
  2. Create `deriveDraftFailureReason()` in `draft-pipeline.server.ts` — pure function mapping `AgentDraftResult` to `{ code, message }`
  3. Create `draftFailureReasonFromCode()` in `draft-pipeline.server.ts` for standalone reason codes
  4. Update sync failure branch to call `deriveDraftFailureReason(draftResult)` and spread result into metadata extras
  5. Update `flagForManualDraft()` in `recovery.server.ts` to accept optional `failureCode`/`failureMessage` and persist in metadata
  6. Update both call sites of `flagForManualDraft` in recovery: `max_retries` (line 129) and draft-failed (line 238-241)
  7. Add clear-on-success: in sync success path (around line 686-689 where metadata is built for successful drafts), set `draftFailureCode: null` and `draftFailureMessage: null`. In recovery success path (line 210-225), include the same null values in metadata update.
  8. Run typecheck to verify compilation
- **Planning validation (required for M/L):**
  - Checks run: verified `SyncThreadMetadata` type, sync failure branch logic, recovery `flagForManualDraft` signature and call sites
  - Validation artifacts: fact-find evidence audit
  - Unexpected findings: none
- **Consumer tracing:**
  - New output `draftFailureCode` in metadata: consumed by `parseMetadata()` in sync.server.ts (existing, tolerant of extra fields), `parseThreadMetadata()` in api-models.server.ts (TASK-02 will add explicit field), `parseMetadata()` in recovery.server.ts (existing, tolerant)
  - New output `draftFailureMessage` in metadata: same consumers as above
  - New export `deriveDraftFailureReason`: consumed by sync.server.ts failure branch (this task) and recovery.server.ts draft-failed branch (this task)
  - New export `draftFailureReasonFromCode`: consumed by recovery.server.ts max_retries branch (this task)
  - Modified `flagForManualDraft` signature: two call sites in recovery.server.ts (both updated in this task)
- **Scouts:** None: all patterns verified in fact-find
- **Edge Cases & Hardening:**
  - `draftResult` with `status !== "error"` AND `qualityResult === null` -> treated as `generation_failed` (fallback code)
  - `draftResult` with `qualityResult.failed_checks` empty array but `passed === false` -> message says "Draft did not pass quality checks." (no specific check names)
  - `deriveDraftFailureReason` called with a result where `status === "error"` but `error` is undefined -> fallback to `generation_failed`
- **What would make this >=90%:**
  - Already at 90%. Would reach 95% with unit tests for `deriveDraftFailureReason` running green.
- **Rollout / rollback:**
  - Rollout: deploy with reception app; new fields appear in metadata immediately for new sync/recovery cycles
  - Rollback: revert commit; existing threads with new fields are harmlessly ignored by the old code (unknown JSON keys are tolerated by `parseMetadata`)
- **Documentation impact:** None
- **Notes / references:**
  - `failed_checks` names from quality-check.ts: `unanswered_questions`, `prohibited_claims`, `missing_plaintext`, `missing_html`, `missing_signature`, `missing_required_link`, `missing_required_reference`, `reference_not_applicable`, `contradicts_thread`, `missing_policy_mandatory_content`, `policy_prohibited_content`
  - Human-readable names for common checks: "unanswered questions" / "prohibited claims" / "missing signature" / "missing HTML" / etc.

### TASK-02: Flow failure reason through API models, client types, and UI

- **Type:** IMPLEMENT
- **Deliverable:** code-change in `apps/reception/src/`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-07)
- **Affects:**
  - `apps/reception/src/lib/inbox/api-models.server.ts` — `InboxThreadMetadata` type, `buildThreadSummary`, `buildThreadSummaryFromRow`
  - `apps/reception/src/services/useInbox.ts` — `InboxThreadSummary` type
  - `apps/reception/src/components/inbox/DraftReviewPanel.tsx` — failure reason banner
  - `apps/reception/src/components/inbox/ThreadList.tsx` — badge tooltip
  - `apps/reception/src/app/api/mcp/inbox/[threadId]/draft/regenerate/route.ts` — clear stale failure reason on successful regeneration
  - `[readonly] apps/reception/src/components/inbox/presentation.ts` — badge helper unchanged, reference only
  - `[readonly] apps/reception/src/components/inbox/InboxWorkspace.tsx` — reference only
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — Straightforward type additions and UI text changes
  - Approach: 95% — Follows established pattern for metadata -> summary -> UI
  - Impact: 90% — Direct user-facing improvement
- **Acceptance:**
  - [ ] `InboxThreadMetadata` has optional `draftFailureCode?: string` and `draftFailureMessage?: string` fields
  - [ ] `buildThreadSummary` and `buildThreadSummaryFromRow` expose `draftFailureCode: string | null` and `draftFailureMessage: string | null` in their return types
  - [ ] `InboxThreadSummary` client type has `draftFailureCode?: string | null` and `draftFailureMessage?: string | null`
  - [ ] `DraftReviewPanel` banner (currently "Auto-draft unavailable for this thread. Write a manual reply below.") displays the `draftFailureMessage` when available, falling back to the generic message when absent
  - [ ] `ThreadList.tsx` badge `<span>` includes `title={thread.draftFailureMessage}` when `thread.needsManualDraft` is true and `draftFailureMessage` is present (tooltip is applied at the component level, not inside `buildInboxThreadBadge`)
  - [ ] `regenerate/route.ts` metadata update includes `draftFailureCode: null` and `draftFailureMessage: null` to clear stale failure reason on successful regeneration
  - [ ] TypeScript compiles without errors
  - [ ] Lint passes
  - **Expected user-observable behavior:**
    - [ ] Thread with `needsManualDraft=true` and `draftFailureCode="quality_gate_failed"` shows banner: "Draft did not pass quality checks: unanswered questions, missing signature." instead of "Auto-draft unavailable for this thread."
    - [ ] Thread with `needsManualDraft=true` and `draftFailureCode="invalid_input"` shows banner: "The email had no body text to generate a reply from."
    - [ ] Thread with `needsManualDraft=true` and `draftFailureCode="max_retries_exceeded"` shows banner: "Draft generation failed after multiple retry attempts."
    - [ ] Thread with `needsManualDraft=true` and no `draftFailureCode` (legacy) shows: "Auto-draft unavailable for this thread. Write a manual reply below."
    - [ ] "Manual" badge in thread list shows failure message as title attribute on hover
  - **Post-build QA requirements:**
    - [ ] Run `lp-design-qa` on DraftReviewPanel failure banner
    - [ ] Verify banner text contrast meets WCAG AA (warning banner colors)
    - [ ] Note: badge tooltip uses HTML `title` attribute which is not shown on touch devices; the failure reason is always visible in the DraftReviewPanel banner when a thread is selected, so mobile users get the detail there. No mobile-specific badge QA needed.
- **Validation contract (TC-02):**
  - TC-01: Thread summary API response for thread with `draftFailureCode` in metadata -> response includes `draftFailureCode` and `draftFailureMessage` fields
  - TC-02: Thread summary API response for thread without `draftFailureCode` in metadata -> response has `draftFailureCode: null` and `draftFailureMessage: null`
  - TC-03: DraftReviewPanel renders failure message from `draftFailureMessage` when present
  - TC-04: DraftReviewPanel renders generic fallback when `draftFailureMessage` is absent
  - TC-05: ThreadList badge has title attribute with failure message when `needsManualDraft` and `draftFailureMessage` present
- **Execution plan:**
  1. Add `draftFailureCode` and `draftFailureMessage` to `InboxThreadMetadata` type in `api-models.server.ts`
  2. Update `buildThreadSummary` return type and implementation to expose `draftFailureCode: metadata.draftFailureCode ?? null` and `draftFailureMessage: metadata.draftFailureMessage ?? null`
  3. Update `buildThreadSummaryFromRow` return type and implementation identically
  4. Add `draftFailureCode?: string | null` and `draftFailureMessage?: string | null` to `InboxThreadSummary` in `useInbox.ts`
  5. Update `regenerate/route.ts` metadata update (line 134-141) to include `draftFailureCode: null, draftFailureMessage: null` in the spread
  6. Update `DraftReviewPanel.tsx` banner: when `requiresManualDraft` is true, show `threadDetail.thread.draftFailureMessage` if available, else show generic message
  7. Update `ThreadList.tsx` badge `<span>` to include `title={thread.draftFailureMessage ?? undefined}` when `thread.needsManualDraft` is true
  8. Run typecheck and lint
- **Planning validation (required for M/L):**
  - Checks run: verified `buildThreadSummary` return type structure, `InboxThreadSummary` usage in components, DraftReviewPanel banner rendering logic
  - Validation artifacts: fact-find evidence audit
  - Unexpected findings: none
- **Consumer tracing:**
  - New output `draftFailureCode` in `buildThreadSummary` return: consumed by API route handler (existing, passes through as JSON), `InboxThreadSummary` client type (updated this task), `DraftReviewPanel` (updated this task), `ThreadList` (updated this task)
  - New output `draftFailureMessage` in `buildThreadSummary` return: same consumers as above
  - New output `draftFailureCode` in `buildThreadSummaryFromRow` return: consumed by API list route handler (existing, passes through), `InboxThreadSummary` (updated)
  - `buildInboxThreadBadge` signature: unchanged (tooltip applied directly in ThreadList.tsx, not via badge helper)
  - Modified DraftReviewPanel banner: self-contained UI change, no downstream consumers
- **Scouts:** None: all UI patterns verified in fact-find
- **Edge Cases & Hardening:**
  - `draftFailureMessage` is null/undefined -> render generic fallback message (no crash, no empty banner)
  - `draftFailureMessage` is empty string -> treat as absent, render generic fallback
  - `draftFailureCode` is present but `needsManualDraft` is false -> fields are inert (not displayed), no harm
  - Thread transitions from manual-draft to drafted (via regeneration) -> regeneration route also spreads existing metadata; must clear `draftFailureCode: null` and `draftFailureMessage: null` alongside `needsManualDraft: false` in the metadata update at `regenerate/route.ts` line 134-141
- **What would make this >=90%:**
  - Already at 90%. Would reach 95% with visual QA confirming banner readability.
- **Rollout / rollback:**
  - Rollout: deploy with reception app; new UI text appears immediately for threads with failure reasons
  - Rollback: revert commit; UI reverts to generic message; new metadata fields are harmlessly ignored
- **Documentation impact:** None
- **Notes / references:**
  - `buildInboxThreadBadge` currently does not receive draftFailureMessage — its signature takes `InboxThreadSummary` which will gain the field via the type update
  - The badge tooltip approach (HTML `title` attribute) is the simplest path; a custom tooltip component is out of scope

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Legacy threads show "unknown" reason | Low | Low | Graceful fallback to generic message for missing fields |
| Message wording confuses staff | Low | Low | Messages use plain language; can be tuned post-deploy |
| Metadata size increase | Very Low | Very Low | Two small string fields; negligible |

## Observability

- Logging: failure reasons are persisted in thread metadata_json (queryable via D1)
- Metrics: existing `manualDraftFlags` counter in sync result tracks volume
- Alerts/Dashboards: None: existing telemetry events in recovery already log outcomes

## Acceptance Criteria (overall)

- [ ] When sync sets `needsManualDraft=true`, metadata includes `draftFailureCode` and `draftFailureMessage`
- [ ] When recovery sets `needsManualDraft=true`, metadata includes `draftFailureCode` and `draftFailureMessage`
- [ ] Inbox UI displays specific failure reason instead of generic "Auto-draft unavailable" message
- [ ] Legacy threads without failure reason fields show the generic fallback message
- [ ] TypeScript compiles, lint passes, existing tests pass
- [ ] Unit tests added for `deriveDraftFailureReason()` covering all three failure categories + fallback
- [ ] Existing inbox route tests or recovery tests updated to assert `draftFailureCode`/`draftFailureMessage` presence in API responses and metadata

## Decision Log

- 2026-03-07: Chose Option A (derived code+message in metadata) over Option B (store full AgentDraftResult). Simpler, more space-efficient, decouples UI from pipeline internals.
- 2026-03-07: Scoped to sync and recovery pipelines only. Regeneration endpoint failure persistence is a separate enhancement (does not set `needsManualDraft`).
- 2026-03-07: Badge tooltip uses HTML `title` attribute rather than custom tooltip component — simplest approach, adequate for staff-facing tool.

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Server-side types, helper, persistence | Yes | None | No |
| TASK-02: API models, client types, UI | Yes (TASK-01 provides types and metadata fields) | None | No |

## Overall-confidence Calculation

- TASK-01: 90% * M(2) = 180
- TASK-02: 90% * M(2) = 180
- Overall = (180 + 180) / (2 + 2) = 90%
