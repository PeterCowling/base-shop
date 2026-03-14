---
Type: Micro-Build
Status: Active
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: prime-broadcast-endpoint-hardening
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260314170000-BRIK-001
Related-Plan: none
---

# Prime Broadcast Endpoint Hardening Micro-Build

## Scope
- Change: Add `resolveActorClaims` + `enforceBroadcastRoleGate` + KV rate limit + server-side
  length cap (500 chars) + `recordDirectTelemetry` to `staff-broadcast-send.ts`.
  Remove the plain unsigned `x-prime-actor-uid` header read and its `'prime-owner'` fallback.
  Also add `'broadcast_staff.success'` to `DIRECT_TELEMETRY_METRICS` in `direct-telemetry.ts`.
- Non-goals: change the business logic of upsert/draft/send; modify reception-side call sites;
  alter the rate-limit constants (match review-campaign-send.ts: 3 req / 60 s).

## Execution Contract
- Affects:
  - `apps/prime/functions/api/staff-broadcast-send.ts` (primary)
  - `apps/prime/functions/lib/direct-telemetry.ts` (add metric constant)
- Acceptance checks:
  1. `resolveActorClaims` is called before any business logic; plain header read is removed.
  2. `enforceBroadcastRoleGate` is called with verified roles; returns 403 for unauthorised roles.
  3. `enforceKvRateLimit` uses `RATE_LIMIT` KV with same constants as `review-campaign-send.ts`.
  4. `plainText.length > 500` returns 400 before upsert/draft/send.
  5. `recordDirectTelemetry(env, 'broadcast_staff.success')` fires on successful send.
  6. `'broadcast_staff.success'` added to `DIRECT_TELEMETRY_METRICS` array.
  7. TypeScript: no new errors (`pnpm --filter prime typecheck`).
- Validation commands:
  - `pnpm --filter prime typecheck`
  - `pnpm --filter prime lint`
- Rollback note: Revert `staff-broadcast-send.ts` and `direct-telemetry.ts` to prior commit.

## Outcome Contract
- **Why:** Staff can currently send broadcasts without any identity check. The new endpoint bypasses all BRIK-004 auth hardening built on other endpoints. This means any caller with the gateway token can flood guests with messages as any actor, with no rate limit and no audit trail.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The broadcast endpoint verifies staff identity, limits sends to 3 per 60 s, records every successful send in the telemetry stream, and rejects messages over 500 characters — matching the protection on review-campaign-send.ts.
- **Source:** operator
