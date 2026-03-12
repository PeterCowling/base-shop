---
Type: Micro-Build
Status: Complete
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: reception-inbox-thread-message-pagination
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260312120000-0002
Related-Plan: none
---

# Reception Inbox Thread Message Pagination Micro-Build

## Scope
- Change: Add offset/limit pagination to the thread detail messages query (most recent messages first with default limit of 20), expose totalMessages in the API response, and add a "Load earlier messages" button in ThreadDetailPane.
- Non-goals: Virtual scrolling, message search within a thread, pagination of drafts/events/admissions.

## Execution Contract
- Affects:
  - `apps/reception/src/lib/inbox/repositories.server.ts` — new `getThreadMessages` function with pagination
  - `apps/reception/src/app/api/mcp/inbox/[threadId]/route.ts` — accept limit/offset query params, return totalMessages
  - `apps/reception/src/services/useInbox.ts` — add fetchThreadMessages, update InboxThreadDetail type
  - `apps/reception/src/components/inbox/ThreadDetailPane.tsx` — "Load earlier messages" button
- Acceptance checks:
  - Thread detail API accepts `limit` and `offset` query params
  - Response includes `totalMessages` count and `messageOffset` value
  - Default response shows last 20 messages (most recent)
  - UI shows "Load earlier messages" button when more messages exist
  - Clicking the button prepends older messages without losing scroll position
  - TypeScript compiles cleanly
  - ESLint passes
- Validation commands:
  - `pnpm --filter @apps/reception typecheck`
  - `pnpm --filter @apps/reception lint`
- Rollback note: Revert commit. No database schema changes; query changes are backward compatible.

## Outcome Contract
- **Why:** When staff open a long email conversation, they wait for every message to load before seeing the latest reply. Paginating means staff see the latest conversation immediately.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Thread detail loads the most recent messages first with a "load more" option for older messages, reducing initial load time for long threads.
- **Source:** auto
