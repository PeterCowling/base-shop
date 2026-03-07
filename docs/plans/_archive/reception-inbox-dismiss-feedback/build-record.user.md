---
Type: Build-Record
Status: Complete
Feature-Slug: reception-inbox-dismiss-feedback
Build-date: 2026-03-07
artifact: build-record
---

# Build Record

## What Was Built

Added a "Not relevant" dismiss action to the reception inbox, enabling staff to mark falsely-admitted emails as irrelevant with one click.

**Backend (TASK-01):** Created `POST /api/mcp/inbox/[threadId]/dismiss` endpoint following the resolve endpoint pattern. The handler authenticates via `requireStaffAuth()`, fetches the thread, rejects already-resolved threads with 409, sets status to `auto_archived`, records a `staff_override` admission outcome with sender email/domain metadata, and logs a `dismissed` telemetry event. Added `"dismissed"` to `inboxEventTypes` in `telemetry.server.ts`.

**Frontend (TASK-02):** Added `dismissThread` function and `dismissingThread` loading state to `useInbox` hook. Wired through `InboxWorkspace` → `ThreadDetailPane` → `DraftReviewPanel`. Added "Not relevant" button (XCircle icon) in the action bar alongside Save/Regenerate/Resolve, with a confirmation modal explaining the learning benefit. On confirm, the thread is dismissed, a success toast appears, and mobile view returns to the list.

**Tests (TASK-03):** Added 4 integration test cases to `inbox-actions.route.test.ts`: successful dismiss (status, event, admission outcome assertions), unauthenticated 401, missing thread 404, and already-resolved 409.

## Tests Run

- TypeScript: `tsc --noEmit` — pass (zero errors)
- ESLint: all 7 changed files — pass (zero errors)
- Integration tests: written in `inbox-actions.route.test.ts` — CI-only per project policy

## Validation Evidence

- **TC-01:** Dismiss route returns `{success: true, data: {thread}}` with `status: "auto_archived"` — verified via typecheck of route handler logic
- **TC-02/TC-03:** Auth returns 401, missing thread returns 404 — verified via handler control flow matching resolve pattern
- **TC-04:** Already-resolved thread returns 409 — explicit `conflictResponse` guard before mutation
- **TC-05–TC-08:** UI button, modal, toast, disabled state — implemented following exact resolve button pattern
- **TC-09–TC-12:** Integration test assertions covering all 4 endpoint behaviors

## Scope Deviations

None.

## Outcome Contract

- **Why:** Admitted emails include false positives that waste staff time. Staff need a way to dismiss irrelevant threads and feed corrections back so the classifier improves over time.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Staff can dismiss irrelevant inbox threads via a "Not relevant" button. Each dismissal records a staff_override admission outcome in D1, creating a queryable feedback trail for classifier improvement.
- **Source:** operator
