# Prime Outbound UX Polish — Build Record

**Date:** 2026-03-14
**Slug:** prime-outbound-ux-polish
**Dispatch:** IDEA-DISPATCH-20260314160003-BRIK-006
**Business:** BRIK
**Execution track:** code
**Deliverable type:** code-change

---

## Outcome Contract

- **Why:** Broadcast send had no confirmation guard (accidental sends to all guests), no post-send refresh (inbox appeared stale after a broadcast), wrong character limit (server enforces 500 but UI allowed 2000), and raw API errors were exposed to staff as confusing system messages.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Reception staff can safely send Prime broadcasts with a confirmation prompt, correct character limit enforced in the browser, visible post-send thread refresh, and friendly error messages on failure.
- **Source:** operator

---

## What Was Built

Four bounded UX polish changes to `PrimeColumn.tsx` and a minimal prop addition to `InboxWorkspace.tsx`:

**L-01 — Confirmation dialog before broadcast send**
Added `confirmPending` state. Clicking "Send" now flips to a confirmation view showing "Send to all N current guests? This cannot be undone." Staff must click "Confirm send" to fire the API. "Back" returns to compose without losing the draft.

**L-02 — Thread list refresh after successful send**
Added optional `onBroadcastSent?: () => void` prop to `PrimeColumnProps`. `handleConfirmedSend()` calls `onBroadcastSent?.()` immediately after a successful API response. Both `PrimeColumn` usages in `InboxWorkspace` (mobile + desktop) now pass `onBroadcastSent={() => void handleRefreshInbox()}`, triggering `refreshInboxView()` from the inbox hook.

**L-03 — Character limit corrected to 500**
`MAX_BROADCAST_LENGTH` constant changed from `2000` to `500`. The `textarea` already consumed this constant for both `maxLength` and the character counter display — no further changes needed.

**H-04 — Sanitized error messages**
All server error paths now show `"Failed to send — please try again."` to the user. When `body.error` is present, it is logged to `console.error("[PrimeColumn] broadcast send error:", body.error)` for debugging only, not shown in the UI. The 503 path (`"Prime messaging is not available right now."`) and network error path remain unchanged.

---

## Files Changed

- `apps/reception/src/components/inbox/PrimeColumn.tsx` — all four fixes
- `apps/reception/src/components/inbox/InboxWorkspace.tsx` — `onBroadcastSent` prop passed to both PrimeColumn instances

---

## Validation Evidence

- `pnpm --filter @apps/reception typecheck` — passed (types generated successfully)
- Pre-commit hooks — typecheck-staged and lint-staged passed for `@apps/reception`
- Commit: `10ad0e33a5`

---

## Engineering Coverage Evidence

Micro-build lane — formal coverage contract not required. All four acceptance checks from `micro-build.md` verified against the committed code:
- [x] L-01: `confirmPending` state + confirmation UI present in commit
- [x] L-02: `onBroadcastSent?.()` called on success; `refreshInboxView` wired in InboxWorkspace
- [x] L-03: `MAX_BROADCAST_LENGTH = 500`; `maxLength={MAX_BROADCAST_LENGTH}` on textarea
- [x] H-04: `body.error` path logs to `console.error` only; user sees generic message

---

## Workflow Telemetry Summary

| Stage | Records | Avg modules | Avg context bytes | Token coverage |
|---|---:|---:|---:|---:|
| lp-do-build | 1 | 2.00 | 45599 | 0.0% |

- Micro-build lane: fact-find, analysis, plan stages not applicable.
- Deterministic checks run: `scripts/validate-engineering-coverage.sh` (result: valid/skipped — micro-build exempt)
- Token measurement: not captured (direct inline execution)
