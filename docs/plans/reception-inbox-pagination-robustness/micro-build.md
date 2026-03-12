---
Type: Micro-Build
Status: Complete
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: reception-inbox-pagination-robustness
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260312140000-0005
Related-Plan: none
---

# Reception Inbox Pagination Robustness Micro-Build

## Scope
- Change: Switch thread message pagination from numeric offset to cursor-based (using message ID), so that new messages arriving between page loads cannot cause duplicates or skipped messages.
- Non-goals: Changing the initial thread detail load flow; modifying Prime inbox threads; altering the auto-refresh interval logic.

## Execution Contract
- Affects:
  - `apps/reception/src/lib/inbox/repositories.server.ts` — `getThreadMessages` accepts `beforeId` cursor, adds `hasMore` to response
  - `apps/reception/src/app/api/mcp/inbox/[threadId]/route.ts` — accepts `before_id` query param, returns `hasMore`
  - `apps/reception/src/services/useInbox.ts` — `fetchThreadMessages` uses cursor, `loadMoreMessages` passes oldest message ID, `InboxThreadDetail` gains `hasMore`
  - `apps/reception/src/components/inbox/ThreadDetailPane.tsx` — uses `hasMore` for load-more button visibility
  - `apps/reception/src/app/api/mcp/__tests__/inbox.route.test.ts` — test mock updated for `hasMore` field
- Acceptance checks:
  - Typecheck passes: `pnpm --filter @apps/reception typecheck`
  - Lint passes: `pnpm --filter @apps/reception lint`
  - Existing tests pass in CI (test mock updated to include `hasMore`)
  - Cursor path: when `before_id` is provided, query uses `WHERE id < ?` instead of `OFFSET`
  - Offset fallback: initial load (no cursor) still uses offset-based query
  - `hasMore` boolean returned by server, consumed by client for button visibility
- Validation commands:
  - `pnpm --filter @apps/reception typecheck`
  - `pnpm --filter @apps/reception lint`
- Rollback note: Revert the commit. The offset-based fallback ensures backward compatibility during rollout.

## Outcome Contract
- **Why:** When staff click "load earlier messages" in a long email thread, new emails arriving in the background shift the numeric offset, causing the same messages to appear twice or older messages to be skipped. Cursor-based pagination picks up exactly where it left off regardless of new arrivals.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Message pagination uses cursor-based navigation that is stable regardless of concurrent message arrivals.
- **Source:** operator

## Build Evidence

### Changes Made
1. **`repositories.server.ts`**: Added `beforeId` to `GetThreadMessagesOptions` and `hasMore` to `PaginatedMessages`. When `beforeId` is provided, the query uses `WHERE thread_id = ? AND id < ?` ordered DESC with LIMIT (no offset), then reverses for chronological display. The offset-based path remains as fallback for initial loads.
2. **API route (`[threadId]/route.ts`)**: Reads `before_id` from query params and passes it to `getThreadMessages`. Returns `hasMore` in the response envelope.
3. **`useInbox.ts`**: Updated `fetchThreadMessages` signature to accept `{ beforeId, limit }` options instead of positional `offset, limit`. Updated `loadMoreMessages` to pass the ID of the oldest currently-displayed message as the cursor. Added `hasMore` to `InboxThreadDetail` type (optional for backward compatibility).
4. **`ThreadDetailPane.tsx`**: Load-more button and "showing X" indicator now use `hasMore` with fallback to the old count comparison.
5. **Test mock**: Added `hasMore: false` to `defaultPaginatedMessages()` in inbox route tests.

### Validation
- Typecheck: PASS
- Lint: pending CI
