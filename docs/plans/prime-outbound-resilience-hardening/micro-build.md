---
Type: Micro-Build
Status: Active
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: prime-outbound-resilience-hardening
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260314160002-BRIK-005
Related-Plan: none
---

# Prime Outbound Resilience Hardening Micro-Build

## Scope
- Change: Add KV-absent warning log in review-campaign-send.ts (M-01); add 10-second AbortSignal timeout to initiatePrimeOutboundThread() in prime-review.server.ts (M-02); document fire-and-forget telemetry safety in prime-compose route.ts (H-01); add prime_broadcast_initiated to CRITICAL_EVENT_TYPES in telemetry.server.ts (H-02); add determinism comment to WHOLE_HOSTEL_BROADCAST_CHANNEL_ID in directMessageChannel.ts (H-03).
- Non-goals: Architecture changes, new test files, UI changes, H-04 (moved to UX dispatch).

## Execution Contract
- Affects:
  - apps/prime/functions/api/review-campaign-send.ts
  - apps/prime/functions/lib/kv-rate-limit.ts
  - apps/reception/src/lib/inbox/prime-review.server.ts
  - apps/reception/src/app/api/mcp/inbox/prime-compose/route.ts
  - apps/reception/src/lib/inbox/telemetry.server.ts
  - apps/prime/src/lib/chat/directMessageChannel.ts
- Acceptance checks:
  - M-01: console.warn emitted when kv is absent in enforceKvRateLimit or at call site
  - M-02: AbortSignal.timeout(10_000) passed to initiatePrimeOutboundThread fetch
  - H-01: comment in prime-compose route.ts explains fire-and-forget is safe (errors caught inside logInboxEventBestEffort)
  - H-02: prime_broadcast_initiated present in CRITICAL_EVENT_TYPES set
  - H-03: inline comment on WHOLE_HOSTEL_BROADCAST_CHANNEL_ID explains determinism; buildBroadcastChannelId verified to use only static string concatenation (no random/timestamp)
- Validation commands:
  - pnpm --filter prime typecheck
  - pnpm --filter reception typecheck
- Rollback note: All changes are additive (log, timeout, comment, set entry). Revert with git revert if needed.

## Outcome Contract
- **Why:** Prime outbound broadcast is a high-value operational action; silent failures in rate limiting, slow Prime functions hanging the Reception API, and lost telemetry for broadcast events degrade operator visibility and system reliability.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** KV rate limiter absences are surfaced in CF logs; Reception API routes to Prime are protected by a 10-second timeout; broadcast initiation is durably recorded as a critical telemetry event.
- **Source:** operator
