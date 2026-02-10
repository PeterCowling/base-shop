---
Type: Decision-Memo
Status: Approved
Domain: Prime
Created: 2026-02-10
Last-reviewed: 2026-02-10
Relates-to plan: docs/plans/prime-guest-portal-gap-plan.md
Relates-to tasks: TASK-51, TASK-54, TASK-55, TASK-56
---

# Prime Staff Auth Architecture Decision

## Decision
- Choose **Firebase Auth custom-token + role-claims** as the primary staff authentication model.
- Keep the current production default-deny route/API gate as an outer safety switch until task rollout is complete.

## Why
- Prime RTDB rules already expect authenticated identity + role checks (`auth.uid` + role nodes).
- Current `PinAuthProvider` is a client-only localStorage stub and is not a valid security boundary.
- A Firebase-authenticated model aligns client SDK behavior, database rules, and future per-user server verification.

## Options Evaluated

### Option A: Firebase custom-token + claims (selected)
- Flow:
  1. Staff enters PIN to a Function login endpoint.
  2. Function verifies PIN against server-side secret material.
  3. Function issues Firebase custom token with role claims.
  4. Client signs in with Firebase Auth and uses issued identity for SDK reads/writes.
  5. Function APIs validate staff token/claims before sensitive operations.
- Pros:
  - Aligns directly with existing `auth != null` RTDB rule posture.
  - Supports role-based controls consistently across client + data + API boundaries.
  - Reduces long-term divergence between chat/staff data and auth model.
- Risks:
  - Requires token verification contract in Functions (handled in TASK-56 spike).
  - Requires migration from `messagingUsers` role checks toward one canonical role source.

### Option B: Server-validated PIN token only (not selected)
- Pros:
  - Simpler initial Function-only gate.
- Cons:
  - Does not naturally satisfy current RTDB auth model for SDK-backed surfaces.
  - Creates dual-auth complexity (server token + ad-hoc client behavior) and higher drift risk.

## Implementation Contract
- `TASK-55` proves client bootstrap and claim mapping.
- `TASK-56` proves Function-side verification/authorization contract.
- `TASK-51` executes full replacement only after both spikes are green.

## Migration Sequence
1. Keep default-deny production gate active.
2. Add Firebase Auth bootstrap in parallel with existing PIN provider behavior.
3. Introduce validated Function token/claims middleware.
4. Switch staff surfaces to authenticated flow.
5. Remove localStorage-only PIN stub path.

## Rollback
- If spike or rollout fails, keep gate in default-deny and revert to current stub-only non-production usage.
- No data migration is required for rollback from spike stage.

## Evidence References
- `apps/prime/src/contexts/messaging/PinAuthProvider.tsx:29`
- `apps/prime/database.rules.json:197`
- `apps/prime/functions/lib/staff-owner-gate.ts:30`
- `apps/prime/src/services/firebase.ts:4`
