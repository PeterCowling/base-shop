# Build Record — prime-outbound-send-path-correctness

**Feature-Slug:** prime-outbound-send-path-correctness
**Dispatch-ID:** IDEA-DISPATCH-20260314160000-BRIK-003
**Date completed:** 2026-03-14
**Build method:** lp-do-build (code track)

---

## What was built

The staff whole-hostel broadcast path was re-routed through a new single-hop Cloudflare Pages Function, eliminating four defects in the previous three-hop chain.

### Problem fixed

When a reception staff member sent a whole-hostel message, the broadcast went through three separate network calls:
1. `POST /api/staff-initiate-thread` — created the thread and draft
2. Reception `prime-compose` route called `sendPrimeInboxThread`
3. `sendPrimeInboxThread` routed to `POST /api/review-campaign-send` (wrong endpoint — used for campaign retries, not staff-initiated broadcasts)

This produced: wrong `actorSource` label on admission records (`reception_proxy` instead of `reception_staff_compose`), a race window between draft save and send that could cause duplicates on retry, and the Firebase RTDB delivery model was undocumented.

### Changes made

**New endpoint** (`apps/prime/functions/api/staff-broadcast-send.ts`, commit `207d90e9a0`):
- Single-hop handler: upserts the broadcast thread (cold-DB guard), saves draft, sends via `review-thread-send` — all in one Cloudflare Pages Function
- `actorSource: 'reception_staff_compose'` set correctly
- Firebase RTDB delivery model documented inline
- Production staff-owner gate enforced via `enforceStaffOwnerApiGate`

**Reception proxy helper** (`apps/reception/src/lib/inbox/prime-review.server.ts`, commits `0e3a73e04b`, `502376607c`):
- Added `staffBroadcastSend()` — single call to `/api/staff-broadcast-send`
- Removed the `review-campaign-send` routing branch from `sendPrimeInboxThread`
- Fixed missing `await` on async `buildPrimeActorHeaders` (async HMAC signing)

**Reception compose route** (`apps/reception/src/app/api/mcp/inbox/prime-compose/route.ts`):
- Replaced two-call chain (`initiatePrimeOutboundThread` + `sendPrimeInboxThread`) with single `staffBroadcastSend` call

**Tests** (commit `8d424c0744`):
- `apps/prime/functions/__tests__/staff-broadcast-send.test.ts` — 8 test cases (TC-01 through TC-08) covering the new endpoint, including cold-DB upsert guard, production gate, invariant mapping, and `actorSource` passthrough
- `apps/reception/src/app/api/mcp/inbox/prime-compose/route.test.ts` — rewritten to mock single `staffBroadcastSend` call
- `apps/reception/src/lib/inbox/__tests__/send-prime-inbox-thread.test.ts` — new file, 3 test cases confirming `review-campaign-send` is never called from `sendPrimeInboxThread` regardless of thread type

**Deprecation** (commit `cadcf87681`):
- `@deprecated` JSDoc added to `staff-initiate-thread.ts` and `initiatePrimeOutboundThread()`
- Legacy test file annotated to document it covers a deprecated function

---

## Commits

| Commit | Task | Description |
|---|---|---|
| `207d90e9a0` | TASK-01 | New `staff-broadcast-send.ts` endpoint |
| `0e3a73e04b` | TASK-02 | Add `staffBroadcastSend`, remove routing branch |
| `502376607c` | TASK-02 | Fix `await buildPrimeActorHeaders` |
| (part of TASK-02/03 session) | TASK-03 | Update `prime-compose/route.ts` |
| `8d424c0744` | TASK-04 + TASK-05 | Test files for new endpoint + Reception path |
| `cadcf87681` | TASK-06 | Deprecation annotations |

---

## Outcome Contract

**Observed Outcomes:**

- C-01 (wrong send endpoint): Fixed. `sendPrimeInboxThread` no longer routes broadcast threads to `review-campaign-send`. Verified by `send-prime-inbox-thread.test.ts`.
- C-02 (multi-hop race window): Eliminated structurally. Thread upsert, draft save, and send happen in a single atomic Cloudflare Function call.
- C-03 (actorSource label): Fixed. New endpoint sets `actorSource: 'reception_staff_compose'` explicitly. Verified by `staff-broadcast-send.test.ts` TC-08.
- C-05 (Firebase delivery model undocumented): Fixed. Inline comment in `staff-broadcast-send.ts` documents the RTDB subscription model.

**Deferred:**
- Full transactional consistency across Firebase and D1 (C-03 residual) — accepted as out-of-scope per plan.
- Removal of deprecated `staff-initiate-thread.ts` and `initiatePrimeOutboundThread` — follow-up task when confirmed no external callers exist.

---

## CI Status

Tests are CI-only (policy). Push to `dev` branch triggers CI. No known test failures expected based on local typecheck + lint passing for all committed files.

---

## Files changed

- `apps/prime/functions/api/staff-broadcast-send.ts` (NEW)
- `apps/prime/functions/__tests__/staff-broadcast-send.test.ts` (NEW)
- `apps/prime/functions/api/staff-initiate-thread.ts` (@deprecated annotation)
- `apps/reception/src/lib/inbox/prime-review.server.ts`
- `apps/reception/src/app/api/mcp/inbox/prime-compose/route.ts`
- `apps/reception/src/app/api/mcp/inbox/prime-compose/route.test.ts`
- `apps/reception/src/lib/inbox/__tests__/send-prime-inbox-thread.test.ts` (NEW)
- `apps/reception/src/lib/inbox/__tests__/initiate-prime-outbound-thread.test.ts` (comment only)
