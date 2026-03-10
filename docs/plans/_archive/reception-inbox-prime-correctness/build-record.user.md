---
Type: Build-Record
Status: Complete
Feature-Slug: reception-inbox-prime-correctness
---

# Build Record: reception-inbox-prime-correctness

## Outcome Contract

- **Why:** Four code audit findings confirmed correctness gaps in the unified Reception inbox: staff were seeing resolved Prime threads that should be hidden, could not inspect full message content before approving, saw stale state after sending, and wasted network resource on thread switches.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All four inbox correctness gaps are fixed, verified by targeted unit tests, and the inbox behaves consistently between email and Prime paths.
- **Source:** operator

## Build Summary

All six tasks completed in a single build cycle. Commit: `1290cd4c02`.

### TASK-01 — Prime visibility filter (server-side)

- Added `statusFilter?: PrimeReviewStatus` param to `listPrimeReviewThreads`.
- Default call adds `WHERE t.review_status NOT IN ('resolved', 'sent', 'auto_archived')`.
- Optional `status` query param added to `GET /api/review-threads`; validated against `primeReviewStatuses`, returns 400 for invalid values.
- TC-02 SQL mock string in `review-threads.test.ts` updated to include the new WHERE clause.
- New tests: TC-02b (invalid status → 400), TC-02c (explicit `status=resolved` → resolved threads returned).

### TASK-02 — Prime visibility filter (Reception defense-in-depth)

- `isPrimeThreadVisibleInInbox()` added to `prime-review.server.ts`.
- `route.ts` applies this filter to Prime rows when no status param is set.
- `listPrimeInboxThreadSummaries()` accepts and forwards optional `status` to the Prime API call.
- Test added: resolved Prime row absent from default list; pending row present.

### TASK-03 — Prime rich message field serialization

- `PrimeReviewMessage` type extended with `links?`, `attachments?`, `cards?`, `audience?`, `campaignId?`.
- `serializeMessage()` now parses `links_json`, `attachments_json`, `cards_json` via new `parseJsonArray<T>()` helper; passes `audience` directly (enum, not JSON); maps `campaign_id` → `campaignId`.
- Test TC-03-rich added: DB row with `links_json` populated → `links` present in API response; `audience` and `campaignId` pass through correctly.

### TASK-04 — Reception rich message mapper update

- `InboxMessageApiModel` extended with five optional Prime fields (`links?`, `primeAttachments?`, `cards?`, `audience?`, `campaignId?`).
- `InboxMessage` (client type) extended with the same five fields.
- `PrimeReviewThreadDetail.messages` local type in `prime-review.server.ts` extended to include rich fields from `PrimeReviewMessage`.
- Message mapper updated: `primeAttachments: message.attachments ?? null`; all five fields passed through with `?? null` fallback.
- Test added: Prime thread detail fixture with rich message fields → response includes all five fields.

### TASK-05 — sendDraft post-send server refresh

- `sendDraft()` now calls `await refreshThreadDetail(threadId)` after `sendInboxDraft()` succeeds; refresh errors wrapped in try/catch (best-effort, do not mask successful send).
- `refreshThreadDetail()` now guards `setSelectedThreadId`/`setSelectedThread`/`setThreads` calls with `if (threadId === selectedThreadIdRef.current)` to prevent stale-thread state updates.
- Local optimistic state update removed from `sendDraft` (server refresh is now authoritative).
- Hook-level tests in new `useInbox.test.ts`: TC-01 asserts two fetch calls after sendDraft (send + refresh); TC-02 covers stale-thread guard path.

### TASK-06 — AbortController signal wiring

- `fetchInboxThread(threadId, signal?)` accepts optional `AbortSignal`.
- Signal passed in `inboxRequest` init as `{ signal }`.
- `selectThread()` passes `controller.signal` to `fetchInboxThread`.
- Hook-level test: `selectThread('thread-2')` → fetch call receives `signal` in init options.

## Validation

- TypeScript: `@apps/prime` typecheck clean; `@apps/reception` typecheck clean.
- Lint: `@apps/prime` 0 errors (15 pre-existing i18n warnings); `@apps/reception` 0 errors (8 pre-existing layout-primitive warnings).
- Pre-commit hooks: lint-staged, typecheck-staged, validate-agent-context all passed.
- CI: tests run in CI on push to dev branch.

## Files Changed

- `apps/prime/functions/lib/prime-messaging-repositories.ts` (TASK-01)
- `apps/prime/functions/api/review-threads.ts` (TASK-01)
- `apps/prime/functions/lib/prime-review-api.ts` (TASK-03)
- `apps/prime/functions/__tests__/review-threads.test.ts` (TASK-01, TASK-03)
- `apps/reception/src/lib/inbox/prime-review.server.ts` (TASK-02, TASK-04)
- `apps/reception/src/app/api/mcp/inbox/route.ts` (TASK-02)
- `apps/reception/src/lib/inbox/api-models.server.ts` (TASK-04)
- `apps/reception/src/services/useInbox.ts` (TASK-04, TASK-05, TASK-06)
- `apps/reception/src/app/api/mcp/__tests__/inbox.route.test.ts` (TASK-02, TASK-04)
- `apps/reception/src/services/__tests__/useInbox.test.ts` (new; TASK-05, TASK-06)
