---
Type: Build-Record
Status: Complete
Feature-Slug: reception-inbox-perf-n-plus-one
Completed-date: 2026-03-07
artifact: build-record
Build-Event-Ref: docs/plans/reception-inbox-perf-n-plus-one/build-event.json
---

# Build Record: Reception Inbox Performance (N+1 Fix)

## Outcome Contract

- **Why:** Staff experience multi-second delays clicking inbox threads. The N+1 query pattern causes ~200 DB queries for 50 threads on every page load and after every action.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Thread list endpoint responds in <200ms (down from multi-second). Thread detail renders from cache in <100ms on second click. No full list re-fetch after draft save/send/resolve/dismiss.
- **Source:** operator

## What Was Built

**TASK-01 — Lean list query with LEFT JOIN:** Added `listThreadsWithLatestDraft()` to `repositories.server.ts` using a single SQL query with LEFT JOIN to fetch threads and their latest draft in one roundtrip. Added `buildThreadSummaryFromRow()` to `api-models.server.ts` to build summaries directly from the joined row data. Updated the list endpoint (`/api/mcp/inbox`) to use the new function, replacing the N+1 `Promise.all(getThread)` pattern. Query count dropped from ~200 to 1-2.

**TASK-02 — Remove Gmail blocking from detail endpoint:** Removed the synchronous `getGmailThread()` call from the detail endpoint (`/api/mcp/inbox/[threadId]`). The endpoint now returns D1-synced data immediately using `serializeMessage()` for each stored message. D1 body text (plain + HTML captured at sync time) is sufficient for the inbox review workflow. Sets `messageBodiesSource: "d1"` with no warning.

**TASK-03 — Client-side cache and optimistic updates:** Refactored `useInbox.ts` to add a `Map<string, InboxThreadDetail>` cache and `AbortController` for superseded requests. After resolve/dismiss: optimistically removes thread from list and selects next. After send: optimistically updates both `thread.status` and `currentDraft.status` to "sent". After save/regenerate: re-fetches only the single thread detail via `refreshThreadDetail()`. After sync: clears entire cache. Eliminated all `loadThreads()` calls from action callbacks.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `npx tsc --noEmit --project apps/reception/tsconfig.json` | Pass | Reception-specific typecheck clean |
| `npx eslint apps/reception/src/lib/inbox/repositories.server.ts apps/reception/src/lib/inbox/api-models.server.ts apps/reception/src/app/api/mcp/inbox/route.ts apps/reception/src/app/api/mcp/inbox/\\[threadId\\]/route.ts apps/reception/src/services/useInbox.ts` | Pass | All changed files lint clean |

## Validation Evidence

### TASK-01
- TC-01 (empty array): `listThreadsWithLatestDraft` returns `result.results ?? []` — empty results handled
- TC-02 (threads with drafts): LEFT JOIN subquery selects latest draft by `updated_at DESC, created_at DESC LIMIT 1`. `buildThreadSummaryFromRow` constructs `currentDraft` when `row.draft_id` is truthy
- TC-03 (threads without drafts): LEFT JOIN returns NULL for draft columns. `buildThreadSummaryFromRow` sets `currentDraft: null` when `row.draft_id` is falsy
- TC-04 (status filter): WHERE clause conditionally adds `t.status = ?` when `options.status` provided
- TC-05 (visibility filter): `isThreadVisibleInInbox` applied in route handler when no status param
- TC-06 (response shape): `buildThreadSummaryFromRow` returns all 14 fields matching `InboxThreadSummary` type

### TASK-02
- TC-01 (d1 source): `messageBodiesSource: "d1" as const` set in response, `warning: null`
- TC-02 (messages from D1): `record.messages.map((message) => serializeMessage(message))` uses D1 `payload_json` body
- TC-03 (404): `getThread` returns null → `notFoundResponse` called
- TC-04 (401): `requireStaffAuth` gate returns error response

### TASK-03
- TC-01 (cache hit): `selectThread` checks `detailCacheRef.current.get(threadId)` before fetching
- TC-02 (abort): `abortControllerRef.current?.abort()` called at start of `selectThread`, new controller created
- TC-03 (draft save refresh): `saveDraft` calls `refreshThreadDetail(selectedThreadId)` — invalidates cache, re-fetches single thread, updates list entry
- TC-04 (resolve removal): `resolveThread` removes thread from list via `prev.filter`, selects next thread
- TC-05 (dismiss removal): `dismissThread` removes thread from list via `prev.filter`, selects next thread
- TC-06 (send optimistic): `sendDraft` updates both `t.status: "sent"` and `t.currentDraft: { ...t.currentDraft, status: "sent" }`
- TC-07 (sync cache clear): `syncInbox` calls `detailCacheRef.current.clear()` before re-fetching

## Scope Deviations

None. All changes stayed within the three planned files per task.
