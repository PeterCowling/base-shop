---
Type: Decision-Memo
Status: Accepted
Domain: Prime
Created: 2026-02-10
Last-reviewed: 2026-02-10
Relates-to plan: docs/plans/prime-guest-portal-gap-plan.md
Relates-to tasks: TASK-52, TASK-57, TASK-58, TASK-59
---

# Prime Messaging Processor Architecture Decision

## Decision
- Choose **Cloudflare scheduled-worker queue processor** for Prime messaging events in `messagingQueue/{eventId}`.
- Start with one trigger (`arrival.48hours`) and promote only after idempotency + failure contracts pass.

## Why
- Prime already runs on Cloudflare Pages/Functions and writes queue records to RTDB.
- Scheduled worker processing keeps execution model consistent with current deployment.
- Email-first rollout is sufficient for Phase 3 and avoids multi-channel complexity.

## Options Evaluated

### Option A: Cloudflare scheduled worker polling RTDB (selected)
- Pros:
  - Fits existing Prime runtime and deployment model.
  - Easy to stage with one trigger.
  - Keeps queue processing logic close to existing Function adapters.
- Risks:
  - Requires clear lock/idempotency semantics to avoid duplicate sends.
  - Needs explicit observability + retry handling from day one.

### Option B: Firebase-native trigger processor (not selected)
- Pros:
  - Event-driven by default.
- Cons:
  - Adds operational split across runtimes and tooling.
  - Increases deployment/control-plane complexity for Prime team.

## Processing Contract
- Queue states: `pending` -> `processing` -> `sent` or `failed`.
- Idempotency key: `eventId` (single-send guarantee).
- Retry contract:
  - transient provider errors increment `retryCount` and return to `pending`.
  - permanent failures mark `failed` with `lastError`.
- Provider seam remains adapter-driven with explicit staging config gate.

## Implementation Boundaries
- `TASK-58` implements and verifies one event (`arrival.48hours`) end-to-end.
- `TASK-59` wires staging provider config and smoke-dispatch checks.
- `TASK-52` is promoted only after both precursor spikes are green.

## Rollback
- Disable processor schedule and keep queue writes only (no dispatch).
- Existing webhook/noop path remains available for extension-request flow.
- No queue schema rollback required.

## Evidence References
- `apps/prime/src/lib/messaging/useMessagingQueue.ts:51`
- `apps/prime/src/lib/messaging/triggers.ts:121`
- `apps/prime/functions/lib/email-dispatch.ts:17`
- `apps/prime/wrangler.toml:11`
