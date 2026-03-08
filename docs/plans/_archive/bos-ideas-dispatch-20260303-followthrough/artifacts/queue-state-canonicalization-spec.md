---
Type: Spec
Status: Active
Created: 2026-03-03
---

# Queue-State Canonicalization Spec

## Problem
`docs/business-os/startup-loop/ideas/trial/queue-state.json` uses legacy `dispatches[]` structure while `lp-do-ideas-persistence.ts` uses canonical `queue-state.v1` with `entries[]`.

## Canonical Target
- Schema version: `queue-state.v1`
- Root keys: `schema_version`, `mode`, `business`, `generated_at`, `entries[]`
- Entry keys: `dispatch_id`, `queue_state`, `dispatched_at`, `packet`

## State Mapping
- `enqueued` -> `enqueued`
- `processed` -> `processed`
- `completed` -> `processed`
- `auto_executed` -> `processed`
- `skipped` -> `skipped`
- `error` -> `error`
- unknown -> `error`

## Migration Procedure
1. Dry-run canonicalization with:
   - `pnpm --filter scripts startup-loop:queue-state-canonicalize`
2. Validate output counts and packet integrity.
3. Write canonical artifact to sidecar path:
   - `pnpm --filter scripts startup-loop:queue-state-canonicalize -- --write`
4. Update downstream readers in a separate change to consume canonical file.
5. Switch writer to canonical format only after reader cutover.

## Safety Rules
- No in-place overwrite of legacy queue file in this cycle.
- Keep packet payloads lossless during conversion.
- Treat migration as reversible until writer switch is complete.
