# Prime Broadcast Endpoint Hardening — Build Record

**Feature slug:** prime-broadcast-endpoint-hardening
**Build date:** 2026-03-14
**Status:** Complete

## Outcome Contract

- **Why:** Staff could send broadcasts to all guests without any identity check, rate limit, or audit trail. The new broadcast endpoint bypassed all BRIK-004 hardening built on other endpoints.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The broadcast endpoint verifies staff identity, limits sends to 3 per 60 seconds, records every successful send in the telemetry stream, and rejects messages over 500 characters — matching the protection already in place on all other staff-only Prime endpoints.
- **Source:** operator

## What Was Built

Four protections added to `apps/prime/functions/api/staff-broadcast-send.ts`:

1. **Auth (C-1):** `resolveActorClaims` + `enforceBroadcastRoleGate` called at entry — the plain unsigned `x-prime-actor-uid` header and its `'prime-owner'` fallback are removed. Only verified `owner`/`admin` roles may broadcast.
2. **Rate limit (C-2):** `enforceKvRateLimit` with `RATE_LIMIT` KV binding — 3 requests per 60 seconds per actor UID, matching `review-campaign-send.ts`.
3. **Server-side length cap (Mo-6):** `plainText.length > 500` returns 400 before any DB write.
4. **Telemetry (Mo-1):** `recordDirectTelemetry(env, 'broadcast_staff.success')` fires on every successful send. `'broadcast_staff.success'` added to `DIRECT_TELEMETRY_METRICS` in `direct-telemetry.ts` so it appears in daily rollup aggregation.

## Engineering Coverage Evidence

| Row | Coverage | Notes |
|---|---|---|
| Auth enforcement | ✅ Required | `resolveActorClaims` + `enforceBroadcastRoleGate` added |
| Rate limiting | ✅ Required | `enforceKvRateLimit` with same constants as review-campaign-send |
| Input validation | ✅ Required | Length cap 500 chars server-side |
| Telemetry | ✅ Required | `broadcast_staff.success` metric added |
| TypeScript | ✅ Required | `pnpm --filter @apps/prime typecheck` — clean |
| Tests | N/A | Micro-build; unit tests for auth/rate-limit in existing test suites |

## Validation Evidence

- `pnpm --filter @apps/prime typecheck` — exit 0, no errors
- Code confirmed identical to `fe670ff020` (concurrent build applied same changes) — idempotent write

## Workflow Telemetry Summary

Telemetry recording skipped — micro-build lane; no upstream packet inputs.
