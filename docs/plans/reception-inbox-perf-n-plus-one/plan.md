---
Type: Plan
Status: Active
Domain: Platform
Workstream: Engineering
Created: 2026-03-07
Last-reviewed: 2026-03-07
Last-updated: 2026-03-07
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-inbox-perf-n-plus-one
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception Inbox Performance (N+1 Fix) Plan

## Summary

The reception inbox suffers from multi-second load times caused by three compounding issues: (1) an N+1 query pattern in the list endpoint that runs ~200 DB queries for 50 threads, (2) a synchronous Gmail API call blocking the detail endpoint by 100-500ms, and (3) a client-side hook that re-fetches the entire thread list after every action with no caching. This plan addresses all three with a lean list query using LEFT JOIN, removing the Gmail API call from the detail endpoint (D1-synced data is sufficient for the review workflow), and client-side caching with optimistic updates in `useInbox`.

## Active tasks
- [ ] TASK-01: Lean list query with LEFT JOIN for latest draft
- [ ] TASK-02: Non-blocking Gmail fetch in detail endpoint
- [ ] TASK-03: Client-side thread detail cache and optimistic updates

## Goals
- Thread list endpoint responds from 1-2 DB queries instead of ~200
- Thread detail renders from D1-synced data without Gmail API call (Gmail enrichment removed — D1 body text is sufficient for the review workflow)
- Client-side hook caches thread details, uses optimistic updates after actions, and cancels superseded requests

## Non-goals
- Changing the inbox UI layout or component hierarchy
- Adding pagination controls (current limit=50 is sufficient)
- Modifying the Gmail sync pipeline or admission classifier

## Constraints & Assumptions
- Constraints:
  - D1 (Cloudflare) database — limited SQL dialect but supports LEFT JOIN
  - Must preserve existing `InboxThreadSummary` client type shape for backwards compatibility
  - All changes deployed via `wrangler deploy` to the existing Worker
- Assumptions:
  - Typical inbox has 10-50 visible threads (based on `isThreadVisibleInInbox` filtering)
  - Gmail API latency is 100-500ms per `getGmailThread()` call

## Inherited Outcome Contract

- **Why:** Staff experience multi-second delays clicking inbox threads. The N+1 query pattern causes ~200 DB queries for 50 threads on every page load and after every action.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Thread list endpoint responds in <200ms (down from multi-second). Thread detail renders from cache in <100ms on second click. No full list re-fetch after draft save/send/resolve/dismiss.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/reception-inbox-perf-n-plus-one/fact-find.md`
- Key findings used:
  - `buildThreadSummary()` only reads thread row fields + `metadata_json` + latest draft — does NOT use messages, events, or admissions (`api-models.server.ts:203-238`)
  - N+1 source: `Promise.all(visibleThreads.map(getThread))` in list endpoint (`route.ts:53-55`), each `getThread()` runs 5 queries
  - Gmail blocking: `await getGmailThread(params.threadId)` before response in detail endpoint (`[threadId]/route.ts:34-40`), with existing fallback path on failure
  - Full list re-fetch after every action in `useInbox.ts` (lines 282, 301, 319, 336, 352, 364)
  - D1 supports LEFT JOIN (verified from migration schema)
  - Indexes exist on all FK + sort columns (`migrations/0001_inbox_init.sql:69-88`)

## Proposed Approach
- Option A: Single lean query approach — replace N+1 with a LEFT JOIN query returning only thread rows + latest draft per thread, build summary directly from row data
- Option B: Batch query approach — fetch all thread IDs, then batch-fetch drafts in a single query
- Chosen approach: Option A — LEFT JOIN is simpler, uses fewer queries (1-2 vs 2), and D1 supports standard JOINs. The `buildThreadSummary` function already only needs thread + draft data, making the JOIN natural.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Lean list query with LEFT JOIN | 85% | M | Pending | - | - |
| TASK-02 | IMPLEMENT | Non-blocking Gmail fetch in detail endpoint | 85% | S | Pending | - | - |
| TASK-03 | IMPLEMENT | Client cache + optimistic updates in useInbox | 85% | M | Pending | - | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03 | - | All three are independent: TASK-01 changes list endpoint, TASK-02 changes detail endpoint, TASK-03 changes client hook. No file overlap between tasks. |

## Tasks

### TASK-01: Lean list query with LEFT JOIN for latest draft
- **Type:** IMPLEMENT
- **Deliverable:** code-change — new `listThreadsWithLatestDraft()` repository function, updated `buildThreadSummaryFromRow()` helper, updated list endpoint
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/reception/src/lib/inbox/repositories.server.ts`, `apps/reception/src/lib/inbox/api-models.server.ts`, `apps/reception/src/app/api/mcp/inbox/route.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — D1 supports LEFT JOIN. The query pattern is standard SQL. `buildThreadSummary` data requirements are verified (thread row + latest draft only). Held-back test: no single unknown would drop below 80 — the SQL dialect support is confirmed, the data requirements are verified from source.
  - Approach: 90% — replacing N+1 with a JOIN is a textbook optimization with no architectural risk
  - Impact: 90% — eliminates ~200 queries down to 1-2, directly addressing the operator-reported slowness
- **Acceptance:**
  - [ ] New `listThreadsWithLatestDraft()` function returns `InboxThreadRow` joined with latest `InboxDraftRow` per thread in a single SQL query
  - [ ] New `buildThreadSummaryFromRow()` builds `InboxThreadSummary` from the joined row without needing `getThread()`
  - [ ] List endpoint (`GET /api/mcp/inbox`) uses the new function instead of `Promise.all(getThread)`
  - [ ] Response shape (`InboxThreadSummary[]`) is identical to current output
  - [ ] `isThreadVisibleInInbox` filtering still applied correctly
- **Validation contract (TC-XX):**
  - TC-01: List endpoint with 0 threads -> returns empty array
  - TC-02: List endpoint with threads having drafts -> each summary includes `currentDraft` with correct fields
  - TC-03: List endpoint with threads having 0 drafts -> `currentDraft` is null (LEFT JOIN null handling)
  - TC-04: List endpoint with status filter -> only matching threads returned
  - TC-05: Visibility filter applied -> auto_archived and resolved threads excluded when no status param
  - TC-06: Response shape matches existing `InboxThreadSummary` type exactly (id, status, subject, snippet, latestMessageAt, lastSyncedAt, updatedAt, needsManualDraft, latestAdmissionDecision, latestAdmissionReason, currentDraft, guestBookingRef, guestFirstName, guestLastName)
- **Execution plan:** Red -> Green -> Refactor
  - Red: Write test for `listThreadsWithLatestDraft()` with mock D1, assert single query returns joined data. Write test for list endpoint returning correct shape.
  - Green: Implement `listThreadsWithLatestDraft()` with LEFT JOIN SQL. Add `buildThreadSummaryFromRow()` helper. Update list endpoint to use new function.
  - Refactor: Remove `getThread` import from list endpoint. Ensure no unused imports remain.
- **Planning validation (required for M/L):**
  - Checks run: Verified `buildThreadSummary()` reads only `record.thread` fields + `metadata_json` + `record.drafts[0]` at `api-models.server.ts:219-237`. Verified D1 LEFT JOIN support from migration schema using FOREIGN KEY references. Verified `isThreadVisibleInInbox` at `api-models.server.ts:240-242` works on `InboxThreadRow` directly.
  - Validation artifacts: Source code at `api-models.server.ts:203-238`, `repositories.server.ts:236-277`, `route.ts:34-66`
  - Unexpected findings: None
- **Consumer tracing:**
  - New output `listThreadsWithLatestDraft()`: consumed by list endpoint `route.ts` only (replaces existing `listThreads` + `getThread` pattern)
  - New output `buildThreadSummaryFromRow()`: consumed by list endpoint `route.ts` only (replaces `buildThreadSummary(record)`)
  - Modified behavior: `buildThreadSummary` is unchanged — still used by detail endpoint (`[threadId]/route.ts:47`). The new `buildThreadSummaryFromRow` is an alternative entry point for the list-only path.
  - Consumer `ThreadList.tsx` is unchanged because the output shape `InboxThreadSummary[]` is identical
  - Consumer `useInbox.ts` `fetchInboxThreads()` is unchanged because the API contract is identical
- **Scouts:** None: the approach is a standard N+1 fix with verified data requirements
- **Edge Cases & Hardening:**
  - Threads with multiple drafts: LEFT JOIN with subquery `(SELECT ... ORDER BY updated_at DESC LIMIT 1)` ensures only latest draft is joined
  - Threads with 0 drafts: LEFT JOIN returns NULL for all draft columns — `buildThreadSummaryFromRow` handles null draft gracefully (sets `currentDraft: null`)
  - `metadata_json` parsing: reuses existing `parseThreadMetadata()` which handles null/invalid JSON
- **What would make this >=90%:**
  - Existing integration test for the list endpoint (currently none exist)
- **Rollout / rollback:**
  - Rollout: Deploy via `wrangler deploy`. Immediate effect — the new query runs on next list request.
  - Rollback: Revert commit and redeploy. Previous N+1 behavior is restored.
- **Documentation impact:**
  - None: internal implementation change, no API contract changes
- **Notes / references:**
  - Fact-find evidence: `apps/reception/src/lib/inbox/api-models.server.ts:203-238` confirms `buildThreadSummary` only uses thread + draft[0]

### TASK-02: Non-blocking Gmail fetch in detail endpoint
- **Type:** IMPLEMENT
- **Deliverable:** code-change — detail endpoint returns D1 data immediately without waiting for Gmail API
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/app/api/mcp/inbox/[threadId]/route.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — the detail endpoint already has a fallback path when Gmail throws (returns D1 data with `messageBodiesSource: "d1"` and a warning). The change is to make Gmail the exception path rather than the primary path. Held-back test: no single unknown would drop below 80 — the fallback path is verified at `[threadId]/route.ts:34-40`.
  - Approach: 90% — returning cached D1 data first is a standard latency optimization
  - Impact: 85% — eliminates 100-500ms Gmail blocking per detail click
- **Acceptance:**
  - [ ] Detail endpoint returns D1 data immediately without calling `getGmailThread()`
  - [ ] `messageBodiesSource` is set to `"d1"` (D1 messages already contain body text from sync)
  - [ ] Response shape (`InboxThreadDetail`) is unchanged structurally. Functional tradeoff: Gmail-enriched fields (fuller HTML bodies, attachment metadata) are no longer merged. D1 `payload_json` body text (plain + HTML captured at sync time) is used instead. This is sufficient for the inbox review workflow where staff read message content and review/edit drafts.
  - [ ] `warning` field is null (no Gmail error to report since Gmail is not called)
- **Validation contract (TC-XX):**
  - TC-01: Detail endpoint returns thread data with `messageBodiesSource: "d1"` and no `warning`
  - TC-02: Detail endpoint returns correct messages from D1 `payload_json` body text
  - TC-03: Detail endpoint returns 404 for non-existent thread
  - TC-04: Detail endpoint returns 401 without auth
- **Execution plan:** Red -> Green -> Refactor
  - Red: Write test asserting detail endpoint does NOT call `getGmailThread` and returns `messageBodiesSource: "d1"`.
  - Green: Remove `getGmailThread` call from detail endpoint. Use `serializeMessage()` for each stored message instead of `mergeMessagesWithGmailThread`.
  - Refactor: Remove unused `getGmailThread` import. Remove unused `gmailThread` variable and `warning` logic.
- **Planning validation (required for M/L):**
  - None required: S-effort task
- **Consumer tracing:**
  - Modified behavior: `mergeMessagesWithGmailThread` no longer called from detail endpoint. Consumer `ThreadDetailPane.tsx` displays `messageBodiesSource` — it will now always show "D1" instead of sometimes "GMAIL". This is acceptable — the D1 messages already contain body text from sync.
  - Consumer `DraftReviewPanel.tsx` reads `threadDetail.messages` — unchanged since messages are still returned (from D1 instead of Gmail-enriched)
- **Scouts:** None: the D1 fallback path is already exercised when Gmail throws
- **Edge Cases & Hardening:**
  - Messages synced without `payload_json` body: `serializeMessage()` returns `bodyPlain: null` — the UI already handles this with "No body available." fallback at `ThreadDetailPane.tsx:177`
- **What would make this >=90%:**
  - Existing test coverage for the detail endpoint
- **Rollout / rollback:**
  - Rollout: Deploy via `wrangler deploy`. Immediate effect.
  - Rollback: Revert commit and redeploy.
- **Documentation impact:**
  - None: response shape unchanged, `messageBodiesSource` field already exists
- **Notes / references:**
  - Gmail enrichment adds attachments and full HTML. For the inbox review workflow, D1 body text is sufficient. If Gmail-enriched data is needed later, a separate endpoint or query param can be added — but that is out of scope for this plan.

### TASK-03: Client-side thread detail cache and optimistic updates
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `useInbox` hook with thread detail cache, optimistic state updates after actions, and AbortController for superseded requests
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/reception/src/services/useInbox.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — the hook is self-contained with clear boundaries. All action callbacks follow the same pattern (action → loadThreads). The refactor replaces `loadThreads` calls with targeted state updates. Held-back test: no single unknown would drop below 80 — the state management pattern is well-understood and all 6 action callbacks are identical in structure.
  - Approach: 90% — caching + optimistic updates is a standard React performance pattern
  - Impact: 85% — eliminates redundant list re-fetches after every action, reducing perceived latency to near-zero for actions
- **Acceptance:**
  - [ ] Thread detail cache: `selectThread` stores loaded detail in a `Map<string, InboxThreadDetail>`. Second click on same thread returns cached data instantly without network request.
  - [ ] Optimistic removal: after resolve/dismiss, remove the thread from the local `threads` list immediately (no server data needed — the thread is no longer visible). After send, update both `thread.status` to `"sent"` and `thread.currentDraft.status` to `"sent"` in the local list (both fields are used by UI components for badge/count display).
  - [ ] Draft action refresh: after save/regenerate, re-fetch only the single thread detail (`fetchInboxThread(threadId)`) to update the cached detail and the thread's `currentDraft` in the list — NOT the entire list.
  - [ ] AbortController: superseded detail requests are cancelled when user clicks a different thread before the first loads
  - [ ] Cache invalidation: after any action, the cached detail for the affected thread is invalidated (removed from cache) before re-fetching that single thread
  - [ ] No behavioral regression: all existing callbacks (saveDraft, regenerateDraft, sendDraft, resolveThread, dismissThread, syncInbox) continue to work correctly
- **Validation contract (TC-XX):**
  - TC-01: Click thread A, click thread A again -> second click returns cached detail without fetch
  - TC-02: Click thread A, click thread B before A loads -> A's request is aborted, B's loads correctly
  - TC-03: Save draft on thread A -> thread A's cache entry invalidated, single-thread detail re-fetched (not full list), draft updated in list
  - TC-04: Resolve thread A -> thread A removed from local list immediately, no list re-fetch
  - TC-05: Dismiss thread A -> thread A removed from local list immediately, no list re-fetch
  - TC-06: Send draft on thread A -> thread A `status` and `currentDraft.status` both updated to "sent" in local list, no list re-fetch
  - TC-07: Sync inbox -> cache cleared entirely, fresh list loaded
- **Execution plan:** Red -> Green -> Refactor
  - Red: Difficult to unit test React hooks with fetch mocking in current test setup. Primary validation through TC contracts verified via code review of the hook logic.
  - Green: Add `detailCache` Map state. Add `abortControllerRef` for in-flight detail requests. Update `loadThread` to check cache first and use AbortController. For resolve/dismiss: remove thread from local `threads` array and clear selection. For send: update both `thread.status` and `thread.currentDraft.status` to `"sent"` in local `threads` array. For save/regenerate: invalidate cache entry and re-fetch single thread detail, then update the thread's `currentDraft` in the list from the refreshed detail. Remove `loadThreads()` calls from all action callbacks.
  - Refactor: Remove redundant `loadThreads` calls from action callbacks. Simplify the `loadThreads` function to only be called on initial load and sync.
- **Planning validation (required for M/L):**
  - Checks run: Verified all 6 action callbacks at `useInbox.ts:271-368` follow identical pattern: `await actionFn() → await loadThreads()`. Verified `InboxThreadSummary` and `InboxThreadDetail` types at `useInbox.ts:24-84`. Verified `selectedThread` / `selectedThreadId` state management at `useInbox.ts:203-205`.
  - Validation artifacts: Source code at `useInbox.ts:202-393`
  - Unexpected findings: `loadThreads` auto-selects a thread via `loadThread(targetThreadId)` (line 250-251), creating a serial waterfall on initial load. This is acceptable for initial load but the optimistic update path avoids this entirely.
- **Consumer tracing:**
  - Modified behavior: `loadThreads` is no longer called after actions (save, regenerate, send, resolve, dismiss). Consumers `InboxWorkspace.tsx` and `ThreadDetailPane.tsx` read from `threads` and `selectedThread` state — these are updated optimistically instead of via re-fetch, so consumers see updates faster.
  - Consumer `selectThread` (exposed as hook return): now checks cache before fetching. Callers (`ThreadList.tsx` click handler) are unchanged.
- **Scouts:** None: the pattern is well-understood React state management
- **Edge Cases & Hardening:**
  - Cache staleness: cache entries are invalidated after any action on that thread. `syncInbox` clears entire cache. No TTL needed for single-operator system.
  - AbortController cleanup: abort pending request in effect cleanup and when new request starts
  - Concurrent actions: action callbacks are already guarded by `actionsDisabled` flag in the UI, preventing concurrent mutations
- **What would make this >=90%:**
  - Unit tests for the hook using React Testing Library + fetch mocking
- **Rollout / rollback:**
  - Rollout: Deploy via `wrangler deploy`. Immediate effect — client-side only change.
  - Rollback: Revert commit and redeploy.
- **Documentation impact:**
  - None: internal implementation change, no API contract changes
- **Notes / references:**
  - The cache is a simple `Map<string, InboxThreadDetail>` in component state. No external library (SWR, React Query) is introduced — keeping the dependency surface minimal for this focused fix.

## Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| D1 LEFT JOIN returns unexpected results for threads with 0 drafts | Low | Medium | LEFT JOIN handles null drafts by design. TC-03 validates this case. |
| Client-side cache serves stale draft status after another user edits | Low | Low | Single-operator system currently. Cache invalidated after every action. |
| Removing Gmail blocking causes message bodies to appear incomplete on first click | Medium | Low | D1 messages already contain body text from sync. Gmail enrichment adds attachments and HTML — acceptable to not show on first click. |
| Optimistic update shows incorrect state if server action fails | Low | Medium | Action callbacks already throw on failure (fetch throws). On error, the optimistic update is not applied — the catch block can trigger a re-fetch. |

## Observability
- Logging: None: no new server-side logging needed for these optimizations
- Metrics: Compare response times before/after using browser network tab or Cloudflare Worker analytics
- Alerts/Dashboards: None: no new alert needed

## Acceptance Criteria (overall)
- [ ] Thread list loads from 1-2 DB queries (down from ~200)
- [ ] Thread detail renders without Gmail blocking
- [ ] No full list re-fetch after draft save/send/resolve/dismiss
- [ ] All existing functionality preserved (no behavioral regression)

## Decision Log
- 2026-03-07: Chose LEFT JOIN approach over batch query for lean list (simpler, fewer queries, D1-compatible)
- 2026-03-07: Chose to remove Gmail call entirely from detail endpoint rather than making it optional via query param (simpler, D1 data is sufficient for the review workflow)
- 2026-03-07: Chose simple Map cache in useInbox over introducing SWR/React Query (minimal dependency surface for a focused fix)

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Lean list query | Yes | None | No |
| TASK-02: Non-blocking Gmail | Yes | None | No |
| TASK-03: Client cache + optimistic | Yes | None | No |

## Overall-confidence Calculation
- TASK-01: 85% × M(2) = 170
- TASK-02: 85% × S(1) = 85
- TASK-03: 85% × M(2) = 170
- Overall = (170 + 85 + 170) / (2 + 1 + 2) = 425 / 5 = 85%
