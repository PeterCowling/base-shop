# Build Record: Reception/Prime Deprecated Endpoint Cleanup

**Date:** 2026-03-14
**Feature slug:** `reception-prime-deprecated-endpoint-cleanup`
**Commit:** `5aabbd000e`

## What was done

Removed the deprecated `initiatePrimeOutboundThread` function and the `/api/staff-initiate-thread` endpoint it called — both unused since `staffBroadcastSend` took over. Auth and signing test coverage was preserved by ensuring the replacement test files cover those same contracts before the deletion happened.

## Files changed

### Auth coverage preserved (already in place prior to deletion)
- `apps/prime/functions/__tests__/staff-broadcast-send.test.ts` — TC-09 through TC-14 covering: unsigned request → 401, invalid signature → 401, missing secret → 503, staff-only role → 403, owner/admin role → proceeds past gate
- `apps/reception/src/lib/inbox/__tests__/staff-broadcast-send.test.ts` *(new file)* — TC-01 through TC-07 covering: signed header present when actorUid provided, header absent when no actorUid, null return when Prime config absent, network error propagation, non-ok HTTP propagation, successful response unwrapping

### Deleted
- `apps/reception/src/lib/inbox/prime-review.server.ts` — removed `initiatePrimeOutboundThread` function and JSDoc (previously lines 599–634)
- `apps/reception/src/lib/inbox/__tests__/initiate-prime-outbound-thread.test.ts` — deleted (coverage ported to `staff-broadcast-send.test.ts`)
- `apps/prime/functions/api/staff-initiate-thread.ts` — deleted
- `apps/prime/functions/__tests__/staff-initiate-thread.test.ts` — deleted (coverage ported to `staff-broadcast-send.test.ts`)

## Validation

- `pnpm --filter @apps/reception typecheck` — passed
- `pnpm --filter @apps/prime typecheck` — passed
- `pnpm --filter @apps/reception lint` — passed (0 errors, pre-existing warnings only)
- `pnpm --filter @apps/prime lint` — passed (0 errors)
- Pre-commit hooks (lint-staged, typecheck-staged) — all passed

## Outcome

`initiatePrimeOutboundThread` and `/api/staff-initiate-thread` no longer exist in the codebase. The broadcast pipeline runs solely through `staffBroadcastSend` → `/api/staff-broadcast-send`. Auth contract regression coverage is intact in the replacement test files.
