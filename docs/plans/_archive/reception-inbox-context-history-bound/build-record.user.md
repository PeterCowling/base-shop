---
Type: Build-Record
Status: Complete
Feature-Slug: reception-inbox-context-history-bound
Completed-date: 2026-03-09
artifact: build-record
Build-Event-Ref: docs/plans/reception-inbox-context-history-bound/build-event.json
---

# Build Record: Reception Inbox Context History Bound

## Outcome Contract

- **Why:** Long thread histories can overflow the processing context, producing incomplete or failed drafts for the most complex conversations that need the best responses.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Conversation history passed to draft generation is bounded to prevent context overflow while preserving the most relevant recent messages.
- **Source:** operator

## What Was Built

The inbox thread-context bounding logic is now centralized in `apps/reception/src/lib/inbox/thread-context.ts`, with `MAX_THREAD_CONTEXT_MESSAGES` fixed at 20 and shared `boundMessages()` / `buildThreadContext()` helpers for consistent behavior.

The live sync-generated draft path now reuses that bounded helper through `apps/reception/src/lib/inbox/sync.server.ts`, which means both sync-driven draft generation and stale-thread recovery no longer pass full unbounded Gmail history into the draft pipeline.

The regenerate route already used `boundMessages()`; the missing regression assertion was added to prove that a 30-message stored thread is truncated to the 20 most recent messages before `generateAgentDraft()` is called.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter @apps/reception typecheck` | Pass | Run locally on 2026-03-09 |
| `pnpm --filter @apps/reception lint` | Pass with warnings | Exit 0; 13 existing warnings, 0 errors |

## Validation Evidence

- Sync path now calls the bounded `buildThreadContext()` export before `generateAgentDraft()`.
- Recovery continues to consume the shared `buildThreadContext()` export and therefore inherits the bounded behavior.
- `build-thread-context.test.ts` covers the helper for 0/5/20/25/50/null-date cases.
- `inbox-actions.route.test.ts` now asserts the regenerate route truncates to the 20 most recent stored messages.

## Scope Deviations

None.
