---
Type: Plan
Status: Active
Domain: API
Workstream: Engineering
Created: 2026-03-07
Last-reviewed: 2026-03-07
Last-updated: 2026-03-07
Build-completed: 2026-03-07
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-inbox-context-history-bound
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception Inbox Context History Bound — Plan

## Summary

Bound the conversation history passed to the draft generation pipeline via `buildThreadContext()` to a configurable maximum of 20 most-recent messages. Currently all messages in a Gmail thread are included with no truncation, causing signal dilution in `summarizeThreadContext()` for long threads. This plan adds a `MAX_THREAD_CONTEXT_MESSAGES` constant, implements bounding in `buildThreadContext()`, refactors the regenerate route to use the same function (eliminating duplicated unbounded logic), and adds unit tests covering the bounding behaviour.

## Active tasks

- [x] TASK-01: Implement message bounding in `buildThreadContext()`
- [x] TASK-02: Refactor regenerate route to use `boundMessages()`
- [x] TASK-03: Add unit tests for bounded `buildThreadContext()`

## Goals

- Bound thread context to a configurable maximum (default 20 messages) to prevent signal dilution.
- Preserve the most recent messages, which carry the highest-signal conversation state.
- Eliminate duplicated unbounded context construction in the regenerate route.
- Add test coverage for the bounding behaviour.

## Non-goals

- LLM-based summarization of older messages.
- Changes to the draft generation pipeline (template ranking, knowledge injection, quality checks).
- Changes to message persistence in D1.

## Constraints & Assumptions

- Constraints:
  - `ThreadContext` and `ThreadMessage` types must remain unchanged — bounding is in the mapping, not the type.
  - Three locations produce thread context; all must be bounded consistently.
  - The draft pipeline is deterministic (no LLM); "context overflow" means diluted signal.
- Assumptions:
  - 20 messages captures ~10 back-and-forth exchanges — sufficient for hostel email threads.
  - Most threads are 2-10 messages; bounding only affects edge-case long threads.

## Inherited Outcome Contract

- **Why:** Long thread histories can overflow the processing context, producing incomplete or failed drafts for the most complex conversations that need the best responses.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Conversation history passed to draft generation is bounded to prevent context overflow while preserving the most relevant recent messages.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/reception-inbox-context-history-bound/fact-find.md`
- Key findings used:
  - `buildThreadContext()` at `sync.server.ts:156` maps all messages with full `body.plain` text (500-2000+ chars each).
  - Two direct call sites (`syncInbox`, `recoverStaleThreads`) plus one duplicated construction in the regenerate route.
  - Downstream `summarizeThreadContext()` iterates all messages — signal dilution risk with old resolved questions.
  - Pipeline is deterministic (no LLM); no hard token limit but processing overhead and signal dilution.
  - No existing truncation or bounding anywhere in the path.

## Proposed Approach

- Option A: Keep most recent N messages only (simple, predictable).
- Option B: Keep first 2 + last N-2 messages (preserves original booking context).
- Chosen approach: Option A — most recent N messages. The fact-find concluded that preserving the first message adds complexity without clear benefit for typical hostel threads. The bound is a named constant, so switching to Option B later is trivial.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add MAX_THREAD_CONTEXT_MESSAGES constant and bound buildThreadContext() | 90% | S | Complete (2026-03-07) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Refactor regenerate route to use boundMessages() | 85% | S | Complete (2026-03-07) | TASK-01 | - |
| TASK-03 | IMPLEMENT | Add unit tests for bounded buildThreadContext() | 90% | S | Complete (2026-03-07) | TASK-01 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Core bounding implementation |
| 2 | TASK-02, TASK-03 | TASK-01 | Refactor and tests are independent — can run in parallel after TASK-01 |

## Tasks

### TASK-01: Add MAX_THREAD_CONTEXT_MESSAGES constant and bound buildThreadContext()

- **Type:** IMPLEMENT
- **Deliverable:** code-change in `apps/reception/src/lib/inbox/sync.server.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/lib/inbox/sync.server.ts`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 90%
  - Implementation: 95% — pure function, clear inputs/outputs, single file change
  - Approach: 90% — "most recent N" is standard and recommended by fact-find
  - Impact: 85% — prevents unbounded growth; actual draft quality improvement on long threads is hard to measure without real data
- **Acceptance:**
  - `buildThreadContext()` returns at most `MAX_THREAD_CONTEXT_MESSAGES` messages.
  - Messages are sorted by date (ascending) and the most recent N are kept.
  - When thread has fewer than N messages, all messages are included (no change to short threads).
  - `MAX_THREAD_CONTEXT_MESSAGES` is an exported named constant (default: 20).
  - `ThreadContext` and `ThreadMessage` types are unchanged.
- **Validation contract (TC-XX):**
  - TC-01: Thread with 5 messages -> all 5 included in output (no truncation).
  - TC-02: Thread with 25 messages -> only 20 most recent included, sorted ascending by date.
  - TC-03: Thread with 50 messages -> only 20 most recent included.
  - TC-04: Thread with 0 messages -> empty messages array returned.
  - TC-05: Messages are sorted by date ascending in output (most recent last).
- **Execution plan:**
  1. Add `const MAX_THREAD_CONTEXT_MESSAGES = 20;` (exported) near existing constants.
  2. In `buildThreadContext()`, sort `thread.messages` by date, then slice to keep the last `MAX_THREAD_CONTEXT_MESSAGES` entries.
  3. Verify existing callers (`syncInbox`, `recoverStaleThreads`) require no changes — they pass the result through unchanged.
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** None: pure function with well-understood inputs.
- **Edge Cases & Hardening:**
  - Messages with missing/null dates: `compareMessagesByDate()` already handles this (falls back to empty string comparison). Messages with null dates sort to the beginning, so they are naturally dropped when bounding to most recent.
  - Thread with exactly `MAX_THREAD_CONTEXT_MESSAGES` messages: all included, no truncation.
- **What would make this >=90%:**
  - Already at 90%. To reach 95%: verify on a real 50+ message thread that draft quality is maintained.
- **Rollout / rollback:**
  - Rollout: normal deploy, no feature flag needed.
  - Rollback: revert the commit.
- **Documentation impact:** None.
- **Notes / references:**
  - Existing `compareMessagesByDate()` function at sync.server.ts:135 can be reused for sorting.
  - Consumer `summarizeThreadContext()` iterates whatever messages it receives — no changes needed there.

### TASK-02: Refactor regenerate route to use buildThreadContext()

- **Type:** IMPLEMENT
- **Deliverable:** code-change in `apps/reception/src/app/api/mcp/inbox/[threadId]/draft/regenerate/route.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/app/api/mcp/inbox/[threadId]/draft/regenerate/route.ts`, `apps/reception/src/app/api/mcp/__tests__/inbox-actions.route.test.ts`, `[readonly] apps/reception/src/lib/inbox/sync.server.ts`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — imports shared `boundMessages()` utility and wraps existing manual `.map()`. Held-back test: if stored message payload shape diverges from `ThreadMessage`, the adapter mapping needs updating. This is unlikely but caps confidence at 85.
  - Approach: 90% — eliminating duplicated logic is clearly correct
  - Impact: 85% — ensures regenerate path is also bounded; without this, the regenerate route remains unbounded
- **Acceptance:**
  - Regenerate route uses the shared `boundMessages()` utility (extracted in TASK-01) to bound its `threadMessages` array.
  - Thread context passed to `generateAgentDraft()` is bounded to `MAX_THREAD_CONTEXT_MESSAGES`.
  - Existing regenerate route tests continue to pass.
  - Functional behaviour (draft content, quality checks) is unchanged for short threads.
- **Validation contract (TC-XX):**
  - TC-01: Regenerate on thread with 5 stored messages -> all 5 in context (no truncation).
  - TC-02: Regenerate on thread with 30 stored messages -> only 20 most recent in context.
  - TC-03: Existing regenerate test suite passes without modification (happy-path assertions unaffected by bounding).
  - TC-04: (new test in `inbox-actions.route.test.ts`) Regenerate with 30+ stored messages -> assert `generateAgentDraft` receives at most 20 messages in `threadContext.messages`.
- **Execution plan:**
  1. Import `boundMessages` from `sync.server.ts` (extracted in TASK-01) into the regenerate route.
  2. Replace the manual `threadMessages` array with `boundMessages(record.messages.map(...))` — the manual `.map()` that converts stored messages to `{ from, date, snippet }` remains (it is the adapter from DB shape to ThreadMessage shape), but bounding is now delegated to the shared utility.
  3. Add a bounding-specific test case to `inbox-actions.route.test.ts` that verifies bounded context length when many messages are stored.
  4. Push and verify existing + new tests pass in CI.
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** None: the regenerate route's `threadMessages` shape already matches `ThreadMessage` — `{ from, date, snippet }`.
- **Edge Cases & Hardening:**
  - Stored messages with missing `sent_at`/`created_at`: route already falls back to `message.created_at`. Bounding sort handles null dates same as TASK-01.
- **What would make this >=90%:**
  - Confirm stored message payload shape matches `ThreadMessage` in a real test run. Currently at 85% due to adapter uncertainty.
- **Rollout / rollback:**
  - Rollout: normal deploy, no feature flag needed.
  - Rollback: revert the commit.
- **Documentation impact:** None.
- **Notes / references:**
  - Current manual construction at route.ts:71-78 maps `record.messages` to `{ from, date, snippet }`.
  - The extracted `boundMessages()` utility could live in `sync.server.ts` alongside `buildThreadContext()`, or in a shared `thread-context.ts` utility file.

### TASK-03: Add unit tests for bounded buildThreadContext()

- **Type:** IMPLEMENT
- **Deliverable:** code-change — new test file `apps/reception/src/lib/inbox/__tests__/build-thread-context.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/lib/inbox/__tests__/build-thread-context.test.ts` (new file)
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — pure function tests, straightforward mock data
  - Approach: 90% — standard unit test pattern
  - Impact: 90% — covers the core bounding behaviour and edge cases
- **Acceptance:**
  - Tests cover: 0 messages, 5 messages, 20 messages (boundary), 25 messages, 50 messages.
  - Tests verify most recent messages are preserved.
  - Tests verify output is sorted by date ascending.
  - Tests verify `MAX_THREAD_CONTEXT_MESSAGES` constant is exported and used.
  - All tests pass in CI.
- **Validation contract (TC-XX):**
  - TC-01: 0 messages -> empty array.
  - TC-02: 5 messages -> all 5 returned, sorted ascending.
  - TC-03: 20 messages (exact boundary) -> all 20 returned.
  - TC-04: 25 messages -> 20 most recent returned, 5 oldest dropped.
  - TC-05: 50 messages -> 20 most recent returned, 30 oldest dropped.
  - TC-06: Messages with null dates sort to beginning and are dropped first when bounding.
- **Execution plan:**
  1. Create test file with helper to generate mock `ParsedGmailThread` with N messages.
  2. Write test cases for each TC above.
  3. Import `buildThreadContext` and `MAX_THREAD_CONTEXT_MESSAGES` from `sync.server.ts`.
  4. Push and verify tests pass in CI (per repo CI-only test policy).
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** None: pure function testing.
- **Edge Cases & Hardening:** Covered by TC-06 (null dates).
- **What would make this >=90%:**
  - Already at 90%. To reach 95%: add property-based tests with randomized message counts.
- **Rollout / rollback:**
  - Rollout: tests only, no production impact.
  - Rollback: revert the commit.
- **Documentation impact:** None.
- **Notes / references:**
  - `buildThreadContext()` requires `ParsedGmailThread` which includes `id`, `historyId`, `snippet`, `messages`. Only `messages` matters for testing; others can use stub values.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Dropping early messages loses original booking context | Low | Medium | Start with generous bound of 20; monitor draft quality. Upgrade to "first + last N" if real quality issues emerge. |
| Regenerate route adapter shape mismatch | Low | Low | Route already produces `{ from, date, snippet }` — same as `ThreadMessage`. Extract shared utility rather than requiring full `ParsedGmailThread`. |
| Bound too aggressive for edge-case threads | Low | Low | Named constant allows easy tuning without code changes. |

## Observability

- Logging: None required — existing telemetry events cover draft creation.
- Metrics: None required — `thread_summary.previous_response_count` already tracks staff response count in derived data.
- Alerts/Dashboards: None required.

## Acceptance Criteria (overall)

- [ ] `buildThreadContext()` returns at most 20 messages (configurable via constant).
- [ ] Regenerate route uses the same bounding logic (no duplicated unbounded construction).
- [ ] Unit tests cover bounding at 0, 5, 20, 25, 50 messages.
- [ ] All existing tests continue to pass.
- [ ] `ThreadContext` and `ThreadMessage` types are unchanged.

## Decision Log

- 2026-03-07: Chose "most recent N" over "first + last N" — simpler, sufficient for hostel threads, constant allows tuning later.
- 2026-03-07: Chose to extract `boundMessages()` utility rather than requiring regenerate route to construct a full `ParsedGmailThread` — simpler adapter pattern.

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Bound buildThreadContext() | Yes | None | No |
| TASK-02: Refactor regenerate route | Yes — depends on TASK-01 constant and utility being available | None | No |
| TASK-03: Add unit tests | Yes — depends on TASK-01 exports | None | No |

## Overall-confidence Calculation

- TASK-01: 90% * 1 (S) = 90
- TASK-02: 85% * 1 (S) = 85
- TASK-03: 90% * 1 (S) = 90
- Overall = (90 + 85 + 90) / 3 = 88% (rounded to 90%)
