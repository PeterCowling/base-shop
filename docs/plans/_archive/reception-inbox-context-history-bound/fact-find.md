---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: API
Workstream: Engineering
Created: 2026-03-07
Last-updated: 2026-03-07
Feature-Slug: reception-inbox-context-history-bound
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-inbox-context-history-bound/plan.md
Dispatch-ID: IDEA-DISPATCH-20260307153740-9204
Trigger-Why:
Trigger-Intended-Outcome:
---

# Reception Inbox Context History Bound — Fact-Find Brief

## Scope

### Summary

`buildThreadContext()` in `apps/reception/src/lib/inbox/sync.server.ts` passes every message in a Gmail thread to the draft generation pipeline with no truncation, bounding, or summarization. For threads with many messages (50+), the combined `snippet` fields (which contain full plain-text bodies, not Gmail's short snippets) can grow to tens of thousands of characters, risking degraded draft quality or silent failures in downstream interpretation.

The draft pipeline is entirely deterministic (no LLM calls) — it uses rule-based pattern matching, template ranking, and keyword extraction. However, `summarizeThreadContext()` in `interpret-thread.ts` iterates over every message to extract prior commitments, open/resolved questions, tone history, and guest name. Unbounded message arrays create unnecessary processing and dilute signal (old resolved questions pollute the context). The derived `thread_summary` stored in `interpret_json` on draft rows can also grow with more messages, though raw `threadContext.messages` is not persisted.

### Goals

- Bound the number of messages passed through `buildThreadContext()` to a configurable maximum.
- Preserve the most recent and most relevant messages (prioritizing the latest inbound and latest staff response).
- Ensure `summarizeThreadContext()` operates on a bounded, high-signal message set.

### Non-goals

- Adding LLM-based summarization of older messages (out of scope for this change).
- Changing the draft generation pipeline itself (template ranking, knowledge injection, quality checks).
- Modifying how messages are stored in D1 (all messages are still persisted; only the context passed to draft generation is bounded).

### Constraints & Assumptions

- Constraints:
  - The draft pipeline is deterministic (no LLM). "Context overflow" means diluted signal and increased processing, not a hard token limit.
  - Two call sites use `buildThreadContext()` directly: `syncInbox()` and `recoverStaleThreads()`. A third location — the `/api/mcp/inbox/[threadId]/draft/regenerate` route — manually constructs the same `{ messages: [...] }` shape without calling `buildThreadContext()`. All three must produce bounded context.
  - The regenerate route builds its own `threadMessages` array from stored messages — it should be refactored to use `buildThreadContext()` or apply the same bounding logic.
- Assumptions:
  - Most hostel email threads are short (2-10 messages). Long threads (20+) are edge cases but are the highest-value conversations.
  - A bound of ~20 most recent messages is sufficient to capture the active conversation window while preventing unbounded growth.
  - The `snippet` field in `buildThreadContext()` uses `message.body.plain || message.snippet` — full plain-text bodies, which can be 500-2000+ chars each.

## Outcome Contract

- **Why:** Long thread histories can overflow the processing context, producing incomplete or failed drafts for the most complex conversations that need the best responses.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Conversation history passed to draft generation is bounded to prevent context overflow while preserving the most relevant recent messages.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/lib/inbox/sync.server.ts:156` — `buildThreadContext()` function definition
- `apps/reception/src/lib/inbox/sync.server.ts:662` — call site in `syncInbox()`, passes result to `generateAgentDraft()`
- `apps/reception/src/lib/inbox/recovery.server.ts:183` — call site in `recoverStaleThreads()`
- `apps/reception/src/app/api/mcp/inbox/[threadId]/draft/regenerate/route.ts:71-85` — manual construction of `threadMessages` array (same shape, no bounding)

### Key Modules / Files

- `apps/reception/src/lib/inbox/sync.server.ts` — contains `buildThreadContext()`, the primary function to modify
- `apps/reception/src/lib/inbox/draft-pipeline.server.ts` — `generateAgentDraft()` receives `threadContext` and passes it through to `interpretDraftMessage()`
- `apps/reception/src/lib/inbox/draft-core/interpret.ts` — `interpretDraftMessage()` passes `threadContext` to `summarizeThreadContext()`
- `apps/reception/src/lib/inbox/draft-core/interpret-thread.ts` — `summarizeThreadContext()` iterates all messages to extract prior commitments, questions, tone, guest name
- `apps/reception/src/lib/inbox/draft-core/action-plan.ts` — defines `ThreadContext` and `ThreadMessage` types
- `apps/reception/src/lib/gmail-client.ts` — defines `ParsedGmailThread` and `ParsedGmailThreadMessage` types

### Patterns & Conventions Observed

- **Snippet field is full body text:** `buildThreadContext()` maps each message to `{ from, date, snippet: message.body.plain || message.snippet }`. The `body.plain` field contains the full plain-text email body (not Gmail's 200-char snippet). This means each message context entry can be 500-2000+ characters.
- **No existing truncation:** There is zero truncation, bounding, or summarization anywhere in the path from `buildThreadContext()` through `summarizeThreadContext()`. Every message in the Gmail thread is included.
- **Deterministic pipeline:** The entire draft pipeline (`interpretDraftMessage` → `generateDraftCandidate` → `runQualityChecks`) is rule-based pattern matching. No LLM calls. The "context overflow" risk is not a hard token limit but signal dilution and unnecessary processing.
- **Coercion layer exists:** `interpret.ts` has `coerceThreadContext()` which filters invalid messages but does not limit count.

### Data & Contracts

- Types/schemas/events:
  - `ThreadContext: { messages: ThreadMessage[] }` — defined in `action-plan.ts:65-67`
  - `ThreadMessage: { from: string; date: string; snippet: string }` — defined in `action-plan.ts:59-63`
  - `ParsedGmailThreadMessage` — full message type with `body: { plain: string; html?: string }`, `snippet: string`, etc.
- Persistence:
  - Thread context is not persisted directly. It is consumed by `interpretDraftMessage()` to produce `EmailActionPlan.thread_summary`, which is stored in the draft's `interpret` JSON column.
  - All messages are separately persisted in the `messages` table via `buildMessageUpsertStatements()`.
- API/contracts:
  - The regenerate API route constructs its own `threadMessages` from stored messages and passes `{ messages: threadMessages }` directly — bypasses `buildThreadContext()`.

### Dependency & Impact Map

- Upstream dependencies:
  - Gmail API (`getGmailThread()`) provides the `ParsedGmailThread` with all messages.
- Downstream dependents:
  - `interpretDraftMessage()` → `summarizeThreadContext()` — consumes `threadContext.messages` to build `ThreadSummary`
  - `ThreadSummary` influences escalation classification and is stored in draft interpret results
- Likely blast radius:
  - Small. Only `buildThreadContext()` output shape changes (fewer messages). `ThreadContext` type is unchanged. Downstream consumers iterate whatever messages they receive.

### Delivery & Channel Landscape

Not investigated: code-only change, no external delivery channel.

### Test Landscape

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `buildThreadContext` | Unit (mocked) | `recovery.server.test.ts:182,250` | Mocked in recovery tests; no direct unit test of the function itself |
| `summarizeThreadContext` | Unit | `interpret.test.ts:26-69` | Tests with short thread contexts (1-2 messages); no test for long threads |
| `syncInbox` | Integration (mocked) | `sync.server.test.ts` | Mocks `generateAgentDraft`; does not test context size |
| Regenerate route | Unit (mocked) | `apps/reception/src/app/api/mcp/__tests__/inbox-actions.route.test.ts` | Existing tests cover successful regenerate flow; no bounding-specific assertions |

#### Coverage Gaps

- No unit test for `buildThreadContext()` itself — it is always mocked in consumer tests.
- No test for behaviour with large thread (20+ messages).
- No bounding-specific test for the regenerate route's manual `threadMessages` construction with many messages (existing tests at `inbox-actions.route.test.ts` cover the happy path only).

#### Testability Assessment

- Easy to test:
  - `buildThreadContext()` is a pure function (takes `ParsedGmailThread`, returns `ThreadContext`). Adding unit tests with varying message counts is straightforward.
  - `summarizeThreadContext()` is a pure function. Testing with bounded vs unbounded inputs is straightforward.
- Hard to test:
  - End-to-end impact of bounding on draft quality requires real thread data and manual review.

#### Recommended Test Approach

- Unit tests for:
  - `buildThreadContext()` with 0, 5, 25, 50 messages — verify output is bounded to configured max.
  - Verify most recent messages are preserved.
  - Verify both inbound and outbound messages are included in bounded set.
- Integration tests for:
  - Regenerate route (`inbox-actions.route.test.ts`): add a bounding-specific test case verifying that threads with many stored messages produce bounded `threadMessages` in the draft call.

### Recent Git History (Targeted)

Not investigated: not needed for this scope.

## Questions

### Resolved

- Q: Does the draft pipeline use an LLM with a token limit?
  - A: No. The entire draft pipeline (`interpretDraftMessage` → `generateDraftCandidate` → `runQualityChecks`) is deterministic, rule-based pattern matching. No LLM calls are made. The risk is signal dilution and unnecessary processing, not a hard token limit.
  - Evidence: `apps/reception/src/lib/inbox/draft-core/interpret.ts`, `apps/reception/src/lib/inbox/draft-core/generate.ts`, `apps/reception/src/lib/inbox/draft-core/quality-check.ts` — all synchronous, no async LLM calls.

- Q: What does `snippet` actually contain in `buildThreadContext()`?
  - A: It uses `message.body.plain || message.snippet`. The `body.plain` field is the full plain-text email body (can be 500-2000+ chars), not Gmail's short snippet (which is ~200 chars max).
  - Evidence: `apps/reception/src/lib/inbox/sync.server.ts:162` — `snippet: message.body.plain || message.snippet`

- Q: How many call sites need to be updated?
  - A: Three: (1) `syncInbox()` at sync.server.ts:662, (2) `recoverStaleThreads()` at recovery.server.ts:183, (3) regenerate route at route.ts:71-85. The first two call `buildThreadContext()` directly; the third constructs its own array and should use `buildThreadContext()` or apply the same bounding.
  - Evidence: Grep results for `buildThreadContext` and `threadContext: { messages:` across reception/src.

- Q: What is the right bound for message count?
  - A: 20 messages is a reasonable default. Most hostel email threads are 2-10 messages. A bound of 20 captures the active conversation window while preventing unbounded growth. The bound should be a named constant for easy tuning.
  - Evidence: Domain knowledge — hostel guest email threads are typically short. 20 messages covers ~10 back-and-forth exchanges.

- Q: Is there existing truncation or summarization?
  - A: No. Zero truncation exists anywhere in the path. `coerceThreadContext()` in `interpret.ts` filters malformed messages but does not limit count.
  - Evidence: Grep for `truncat|max.messages|CONTEXT_LIMIT` across `apps/reception/src` — no results relevant to thread context bounding.

### Open (Operator Input Required)

No open questions. All decisions can be made from evidence and reasonable defaults.

## Confidence Inputs

- Implementation: 95% — pure function modification, clear inputs/outputs, three well-identified call sites.
  - To reach >=90: already there.
- Approach: 90% — bounding by recency is the standard approach; no evidence suggests a more complex strategy is needed.
  - To reach >=90: already there.
- Impact: 85% — prevents unbounded growth and signal dilution. Actual draft quality impact on long threads is hard to measure without real data.
  - To reach >=90: A/B comparison of drafts on a real 50+ message thread before and after bounding.
- Delivery-Readiness: 95% — no external dependencies, no config changes, no DB migrations.
  - To reach >=90: already there.
- Testability: 90% — pure functions, easy to unit test with varying message counts.
  - To reach >=90: already there.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Dropping early messages loses context about original booking issue | Low | Medium | Include first 1-2 messages in bounded set (first + last N strategy) |
| Regenerate route bypasses `buildThreadContext()` and remains unbounded | Medium | Medium | Refactor regenerate route to use `buildThreadContext()` or apply same bounding logic |
| Bound too aggressive for edge-case threads | Low | Low | Use configurable constant; start at 20 (generous); monitor draft quality |

## Planning Constraints & Notes

- Must-follow patterns:
  - Keep `buildThreadContext()` as a pure function.
  - Use a named constant for the message limit (e.g., `MAX_THREAD_CONTEXT_MESSAGES`).
  - Preserve `ThreadContext` and `ThreadMessage` types unchanged — bounding is in the mapping, not the type.
- Rollout/rollback expectations:
  - No rollout concern — change is internal to draft generation. Deploy normally.
- Observability expectations:
  - None required beyond existing telemetry. The `thread_summary.previous_response_count` field already tracks staff response count.

## Suggested Task Seeds (Non-binding)

1. Add `MAX_THREAD_CONTEXT_MESSAGES` constant and implement bounding in `buildThreadContext()` — keep most recent N messages sorted by date. The "most recent N" strategy is the recommended default; preserving the first message is a potential enhancement but adds complexity without clear evidence of benefit for hostel email threads.
2. Refactor regenerate route to use `buildThreadContext()` instead of manual array construction.
3. Add unit tests for `buildThreadContext()` with 0, 5, 25, 50 message inputs.

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package: All three call sites pass bounded context; unit tests pass for edge cases; existing tests continue to pass.
- Post-delivery measurement plan: Query draft quality results from `quality_json`/`interpret_json` columns on draft rows for threads with high message counts. Note: this is queryable stored data, not existing event-based telemetry.

## Scope Signal

- **Signal:** right-sized
- **Rationale:** The scope is well-bounded: one pure function to modify, one route to refactor, three call sites total. The `ThreadContext` type is unchanged, limiting blast radius. Evidence is complete — all call sites identified, all downstream consumers traced, test landscape mapped. No external dependencies or config changes needed.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| `buildThreadContext()` function body | Yes | None | No |
| `syncInbox()` call site | Yes | None | No |
| `recoverStaleThreads()` call site | Yes | None | No |
| Regenerate route manual construction | Yes | None | No |
| `summarizeThreadContext()` downstream consumer | Yes | None | No |
| `ThreadContext`/`ThreadMessage` types | Yes | None | No |
| Test landscape for `buildThreadContext()` | Yes | [Coverage gap] Minor: no existing unit test for the function | No |

## Evidence Gap Review

### Gaps Addressed

- Confirmed the draft pipeline is fully deterministic (no LLM) — adjusts framing from "context overflow" to "signal dilution and processing overhead".
- Identified all three call sites including the regenerate route which bypasses `buildThreadContext()`.
- Confirmed `snippet` field contains full body text, not Gmail's short snippet.

### Confidence Adjustments

- Implementation confidence raised from initial estimate to 95% due to pure function scope and clear call sites.
- Impact confidence set at 85% — the change is clearly beneficial but measuring draft quality improvement requires real data.

### Remaining Assumptions

- Assumed 20-message bound is sufficient. This is a reasonable default based on hostel email thread patterns but should be a named constant for easy adjustment.
- Recommended "most recent N" as the selection strategy. An alternative "first 2 + last N-2" strategy could preserve original booking context but adds complexity without clear evidence of benefit for typical hostel threads. Planning should proceed with "most recent N" as the default.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan reception-inbox-context-history-bound --auto`
