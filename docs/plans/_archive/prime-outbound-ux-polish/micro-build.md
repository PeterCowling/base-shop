---
Type: Micro-Build
Status: Archived
Created: 2026-03-14
Last-updated: 2026-03-14
Completed: 2026-03-14
Feature-Slug: prime-outbound-ux-polish
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260314160003-BRIK-006
Related-Plan: none
---

# Prime Outbound UX Polish Micro-Build

## Scope
- Change: Four bounded UX polish fixes in PrimeColumn.tsx:
  - L-01: Confirmation dialog before broadcast send ("Send to all X guests? This cannot be undone.")
  - L-02: Thread list refresh (via `onBroadcastSent` callback prop) after successful compose send
  - L-03: Fix `maxLength` — constant is 2000 but server limit is 500; correct to 500
  - H-04: Sanitize raw API error messages; show "Failed to send — please try again" to users, log raw error to console.error only
- Non-goals: Backend changes, new test files, animation/styling overhaul, changes outside PrimeColumn.tsx / InboxWorkspace.tsx

## Execution Contract
- Affects:
  - `apps/reception/src/components/inbox/PrimeColumn.tsx`
  - `apps/reception/src/components/inbox/InboxWorkspace.tsx` (add `onBroadcastSent` prop pass-through to `refreshInboxView`)
- Acceptance checks:
  - [ ] L-01: Clicking "Send" in compose modal shows inline confirmation step before firing API
  - [ ] L-02: After successful send, `onBroadcastSent` is called and inbox thread list refreshes
  - [ ] L-03: `MAX_BROADCAST_LENGTH` constant is 500 (matches server limit); textarea `maxLength={500}`
  - [ ] H-04: All API error paths show "Failed to send — please try again"; raw error only in console.error
  - [ ] TypeScript typecheck passes for `apps/reception`
- Validation commands:
  - `pnpm --filter reception typecheck`
- Rollback note: Single-file change to PrimeColumn.tsx + minimal InboxWorkspace.tsx prop addition; revert both files.

## Outcome Contract
- **Why:** Broadcast send had no confirmation guard (accidental sends to all guests), no post-send refresh (inbox appeared stale), wrong character limit (server rejects at 500 but UI allowed 2000), and raw API errors exposed to staff (confusing)
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Reception staff can safely send Prime broadcasts with confirmation prompt, correct character limit, visible post-send thread refresh, and friendly error messages on failure
- **Source:** operator
