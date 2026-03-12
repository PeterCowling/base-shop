---
Type: Build-Record
Status: Complete
Domain: API
Last-reviewed: 2026-03-12
Feature-Slug: reception-inbox-draft-send-safety
Execution-Track: code
Completed-date: 2026-03-12
artifact: build-record
---

# Build Record: Reception Inbox Draft Send Safety

## Outcome Contract

- **Why:** A guest could receive a stale or wrong email if staff edit and send at the same time; corrupted recipient JSON crashes the send flow silently.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Draft send verifies the draft has not changed since last viewed, and all JSON parsing in draft routes is safe with proper error handling.
- **Source:** operator

## What Was Built

**Optimistic locking on draft send (Issue #21).** The send route now accepts an optional `expectedUpdatedAt` ISO timestamp in the POST body. Before sending, it compares this against the current draft's `updated_at`. If the draft was modified after the caller last viewed it, the route returns 409 Conflict with an explanation. The client-side `sendInboxDraft` function and the `useInbox` hook's `sendDraft` callback now automatically pass the current draft's `updatedAt` from local state, so the lock is enforced transparently.

**Safe JSON parsing across all draft routes (Issues #1 and #5).** The existing `parseJsonArray` utility in `api-models.server.ts` (which wraps `JSON.parse` in a try-catch and validates array contents) was exported and applied to all three draft routes that previously used raw `JSON.parse` with unsafe `as string[]` casts:
- `send/route.ts` line 59 -- replaced with `parseJsonArray`
- `draft/route.ts` PUT handler -- replaced with `parseJsonArray`
- `draft/regenerate/route.ts` -- replaced with `parseJsonArray`

If recipient JSON is corrupted, these routes now gracefully degrade (empty array) instead of throwing an unhandled exception.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter @apps/reception typecheck` | Pass | No errors |
| `pnpm --filter @apps/reception lint` | Pass | No warnings |

## Workflow Telemetry Summary

None: workflow telemetry not recorded.

## Validation Evidence

### Issue #21 -- Optimistic lock on send
- Send route parses body with zod schema accepting `expectedUpdatedAt` (datetime string)
- Compares against `currentDraft.updated_at`; returns 409 if mismatched
- Client passes `selectedThread.currentDraft.updatedAt` automatically

### Issue #1 -- Safe JSON parse in send route
- `JSON.parse(currentDraft.recipient_emails_json) as string[]` replaced with `parseJsonArray(currentDraft.recipient_emails_json)`
- `parseJsonArray` catches parse errors and filters non-string elements

### Issue #5 -- Safe JSON parse in draft and regenerate routes
- Same `parseJsonArray` replacement applied to `draft/route.ts` PUT handler and `draft/regenerate/route.ts`

## Engineering Coverage Evidence

| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | N/A | No UI changes; client passes lock field transparently |
| UX / states | Covered | 409 conflict returns clear user-facing message |
| Security / privacy | Covered | Optimistic lock prevents sending stale drafts to guests |
| Logging / observability / audit | N/A | Existing telemetry records send events unchanged |
| Testing / validation | Deferred to CI | Tests run in CI only per policy |
| Data / contracts | Covered | Zod schema validates send payload; parseJsonArray validates stored JSON |
| Performance / reliability | Covered | Safe parse prevents crash on corrupted data; lock is single extra comparison |
| Rollout / rollback | Safe | `expectedUpdatedAt` is optional; existing clients without it still work |

## Scope Deviations

None.
