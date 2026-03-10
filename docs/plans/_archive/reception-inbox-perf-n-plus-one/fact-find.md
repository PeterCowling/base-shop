---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-07
Last-updated: 2026-03-07
Feature-Slug: reception-inbox-perf-n-plus-one
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-inbox-perf-n-plus-one/plan.md
Dispatch-IDs: IDEA-DISPATCH-20260307112000-9030, IDEA-DISPATCH-20260307112000-9031, IDEA-DISPATCH-20260307112000-9032
Work-Package-Reason: All three dispatches target the same inbox data flow (list endpoint, detail endpoint, client hook) and share the same affected files. A single plan covering lean list query, non-blocking Gmail fetch, and client-side cache produces fewer tasks and avoids redundant fact-finding across overlapping surfaces.
---

# Reception Inbox Performance Fact-Find Brief

## Scope

### Summary

The reception inbox is slow. Clicking a thread in the left-hand list takes multiple seconds to render the detail pane on the right. The root causes are: (1) an N+1 query pattern in the thread list endpoint that fetches full thread records per visible thread, (2) a synchronous Gmail API call that blocks thread detail rendering, and (3) a client-side hook that re-fetches the entire list after every action with no caching or optimistic updates.

### Goals

- Thread list loads from a single lean DB query, not N individual `getThread()` calls
- Thread detail renders from DB-cached data instantly; Gmail data loaded in background
- Client-side hook caches thread details, uses optimistic updates after actions, and cancels superseded requests

### Non-goals

- Changing the inbox UI layout or component hierarchy
- Adding pagination controls (current limit=50 is sufficient)
- Modifying the Gmail sync pipeline or admission classifier

### Constraints & Assumptions

- Constraints:
  - D1 (Cloudflare) database — no JOINs with subqueries, limited SQL dialect
  - Must preserve existing `InboxThreadSummary` client type shape for backwards compatibility
  - All changes must be deployed via `wrangler deploy` to the existing Worker
- Assumptions:
  - Typical inbox has 10-50 visible threads (based on `isThreadVisibleInInbox` filtering)
  - Gmail API latency is 100-500ms per `getGmailThread()` call with `format=full`

## Outcome Contract

- **Why:** Staff experience multi-second delays clicking inbox threads. The N+1 query pattern causes ~200 DB queries for 50 threads on every page load and after every action.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Thread list endpoint responds in <200ms (down from multi-second). Thread detail renders from cache in <100ms on second click. No full list re-fetch after draft save/send/resolve/dismiss.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/app/api/mcp/inbox/route.ts` — thread list GET endpoint (the N+1 source)
- `apps/reception/src/app/api/mcp/inbox/[threadId]/route.ts` — thread detail GET endpoint (Gmail blocking)
- `apps/reception/src/services/useInbox.ts` — client hook managing all inbox state and fetches

### Key Modules / Files

- `apps/reception/src/lib/inbox/repositories.server.ts` — `listThreads()` (lean query), `getThread()` (5 queries per call)
- `apps/reception/src/lib/inbox/api-models.server.ts` — `buildThreadSummary()`, `isThreadVisibleInInbox()`, `mergeMessagesWithGmailThread()`
- `apps/reception/src/lib/gmail-client.ts` — `getGmailThread()` (external Gmail API call)
- `apps/reception/src/components/inbox/InboxWorkspace.tsx` — orchestrates list + detail, calls `useInbox()`
- `apps/reception/src/components/inbox/ThreadDetailPane.tsx` — renders detail pane from `InboxThreadDetail`
- `apps/reception/src/components/inbox/ThreadList.tsx` — renders thread list from `InboxThreadSummary[]`

### Patterns & Conventions Observed

- N+1 in list endpoint — `route.ts:53-55`: `Promise.all(visibleThreads.map(getThread))` after `listThreads()`. Each `getThread()` runs 5 queries (1 thread + 4 parallel: messages, drafts, events, admissions). For 50 threads = 201 queries. Evidence: `apps/reception/src/app/api/mcp/inbox/route.ts:53-55`
- Gmail API blocks detail render — `[threadId]/route.ts:34-40`: `await getGmailThread(params.threadId)` runs before response. Evidence: `apps/reception/src/app/api/mcp/inbox/[threadId]/route.ts:34-40`
- Full list re-fetch after every action — `useInbox.ts:282,301,319,336,352,364`: every callback calls `loadThreads()` which re-triggers the N+1. Evidence: `apps/reception/src/services/useInbox.ts:282`
- No client cache — `useInbox.ts:202-269`: plain `useState`, no SWR/React Query, no deduplication, no AbortController. Evidence: `apps/reception/src/services/useInbox.ts`
- `buildThreadSummary()` needs full `InboxThreadRecord` — it reads `metadata_json` (from thread row), `currentDraft` (from drafts array), but NOT messages, events, or admissions. The list endpoint fetches all 4 sub-tables per thread but only uses thread + drafts. Evidence: `apps/reception/src/lib/inbox/api-models.server.ts:203-238`

### Data & Contracts

- Types/schemas:
  - `InboxThreadRow` — thread summary row from `threads` table
  - `InboxThreadRecord` — full thread with messages, drafts, events, admissions
  - `InboxThreadSummary` (client) — what ThreadList renders (id, status, subject, snippet, timestamps, currentDraft, guest fields)
  - `InboxThreadDetail` (client) — what ThreadDetailPane renders (thread summary + messages + events + admissions + draft)
- Persistence:
  - D1 database `reception-inbox` with tables: `threads`, `messages`, `drafts`, `thread_events`, `admission_outcomes`
  - Indexes exist on all FK + sort columns (verified in `migrations/0001_inbox_init.sql:69-88`)
- API/contracts:
  - `GET /api/mcp/inbox` — returns `InboxThreadSummary[]`
  - `GET /api/mcp/inbox/[threadId]` — returns `InboxThreadDetail`

### Dependency & Impact Map

- Upstream dependencies:
  - `listThreads()` — lean query, correct as-is
  - `getThread()` — used by list endpoint (wrongly) AND detail endpoint (correctly)
  - `getGmailThread()` — used only by detail endpoint
- Downstream dependents:
  - `ThreadList.tsx` consumes `InboxThreadSummary[]` — only needs summary fields
  - `ThreadDetailPane.tsx` consumes `InboxThreadDetail` — needs full record + Gmail data
  - `DraftReviewPanel.tsx` consumes `InboxThreadDetail` — needs current draft + messages
- Likely blast radius:
  - List endpoint change: affects `fetchInboxThreads()` client function, but output shape is unchanged
  - Detail endpoint change: affects `fetchInboxThread()` client function, output shape unchanged (just faster)
  - Client hook change: internal to `useInbox.ts`, no API contract changes

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (governed runner via CI only)
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs`
- CI integration: tests run in CI pipeline only (per `docs/testing-policy.md`)

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Inbox action routes | Integration (mocked) | `apps/reception/src/app/api/mcp/__tests__/inbox-actions.route.test.ts` | Covers regenerate, send, resolve, dismiss routes |
| Inbox list/detail routes | None | — | No tests for GET list or GET detail endpoints |

#### Coverage Gaps

- No tests for the list endpoint (`GET /api/mcp/inbox`)
- No tests for the detail endpoint (`GET /api/mcp/inbox/[threadId]`)
- No tests for `buildThreadSummary()` or `isThreadVisibleInInbox()`

#### Testability Assessment

- Easy to test: `listThreadsWithSummary()` (new lean query function) — pure DB mock
- Easy to test: `buildThreadSummaryFromRow()` (new function using only thread row + latest draft) — pure function
- Hard to test: Gmail background fetch timing — requires async/streaming patterns
- Test seams needed: mock `getGmailThread` in detail endpoint tests

#### Recommended Test Approach

- Unit tests for: new `listThreadsWithSummary()` repository function, `buildThreadSummaryFromRow()` helper
- Integration tests for: list endpoint returns correct shape without N+1, detail endpoint returns data without blocking on Gmail

## Questions

### Resolved

- Q: Does `buildThreadSummary()` actually need the full `InboxThreadRecord`?
  - A: No. It reads `thread` row fields + `metadata_json` (parsed for guest fields, admission decision, needsManualDraft) + the latest draft (first element of `drafts` array). It does NOT use `messages`, `events`, or `admissionOutcomes`.
  - Evidence: `apps/reception/src/lib/inbox/api-models.server.ts:203-238`

- Q: Can the summary be built from a single SQL query with a LEFT JOIN for the latest draft?
  - A: Yes. D1 supports LEFT JOIN. A single query joining `threads` with `drafts` (selecting the most recent draft per thread) would replace the N+1 entirely. The `metadata_json` field is on the `threads` row and needs only JSON parsing in JS.
  - Evidence: D1 SQL dialect supports standard JOINs. `migrations/0001_inbox_init.sql` uses FOREIGN KEY references confirming relational model.

- Q: Can Gmail fetch be made non-blocking in the detail endpoint?
  - A: Yes. The detail endpoint already has a fallback path — when `getGmailThread()` throws, it sets `warning` and returns `messageBodiesSource: "d1"`. The D1 messages already have `payload_json` with body text from sync. The endpoint can return D1 data immediately and let the client optionally request Gmail-enriched data.
  - Evidence: `apps/reception/src/app/api/mcp/inbox/[threadId]/route.ts:34-40`

### Open (Operator Input Required)

None. All questions are resolvable from codebase evidence.

## Confidence Inputs

- Implementation: 90% — clear N+1 pattern with well-understood fix (JOIN query + lean summary builder). All affected files identified. D1 supports the required SQL.
- Approach: 90% — standard performance optimization patterns (eliminate N+1, background external calls, client cache). No architectural uncertainty.
- Impact: 95% — operator directly reported the problem. N+1 elimination will reduce list endpoint queries from ~200 to 1-2. Gmail background fetch eliminates 100-500ms blocking.
- Delivery-Readiness: 85% — no existing tests for the list/detail endpoints, but the test pattern is established in `inbox-actions.route.test.ts`.
- Testability: 85% — new query function is easily testable with D1 mocks. Gmail background fetch is harder to test but has an existing seam.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| D1 JOIN query returns unexpected results for threads with 0 drafts | Low | Medium | LEFT JOIN handles null drafts. Test with mock data including draft-less threads. |
| Client-side cache serves stale draft status after another user edits | Low | Low | Single-operator system currently. Cache TTL of 30s + invalidation on action covers this. |
| Removing Gmail blocking causes message bodies to appear incomplete on first click | Medium | Low | D1 messages already contain body text from sync. Gmail enrichment adds attachments and HTML — acceptable to load async. |

## Scope Signal

- Signal: right-sized
- Rationale: Three tightly coupled issues (N+1 list query, Gmail blocking, client re-fetch) share the same 6 files and can be addressed in 3-4 focused tasks. No architectural decisions needed — these are standard performance patterns. Adding scope (e.g., pagination, virtual scrolling) would be premature given the 50-thread ceiling.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| List endpoint N+1 pattern | Yes | None | No |
| buildThreadSummary data requirements | Yes | None | No |
| D1 JOIN capability | Yes | None | No |
| Detail endpoint Gmail blocking | Yes | None | No |
| D1 message fallback path | Yes | None | No |
| useInbox re-fetch pattern | Yes | None | No |
| Client cache / dedup gaps | Yes | None | No |
| Test landscape | Yes | [Minor]: No existing list/detail endpoint tests | No — tests will be added as part of implementation |

## Suggested Task Seeds (Non-binding)

1. **Lean list query** — Replace N+1 `Promise.all(getThread)` with a single `listThreadsWithSummary()` query using LEFT JOIN for latest draft. Update `buildThreadSummary` to work from thread row + draft row directly.
2. **Non-blocking Gmail fetch** — Return D1 data immediately from detail endpoint. Make Gmail fetch optional (query param or separate endpoint).
3. **Client-side cache + optimistic updates** — Add thread detail cache to `useInbox`. After actions, update local state optimistically instead of re-fetching entire list. Add AbortController for superseded requests.

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package: list endpoint responds with correct `InboxThreadSummary[]` from 1-2 queries. Detail endpoint returns D1 data without Gmail blocking. Client hook does not re-fetch list after actions.
- Post-delivery measurement plan: compare response times before/after using browser network tab or Cloudflare Worker analytics.

## Evidence Gap Review

### Gaps Addressed

- Confirmed `buildThreadSummary()` does not need messages/events/admissions (only thread row + latest draft)
- Confirmed D1 supports LEFT JOIN for the lean query approach
- Confirmed Gmail fallback path already exists in detail endpoint
- Confirmed indexes exist on all relevant columns

### Confidence Adjustments

- None needed. All evidence confirmed the initial hypothesis.

### Remaining Assumptions

- Gmail API latency of 100-500ms is based on general Google API performance, not measured in production. Actual latency may vary but the fix (non-blocking) is valid regardless.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan reception-inbox-perf-n-plus-one --auto`
