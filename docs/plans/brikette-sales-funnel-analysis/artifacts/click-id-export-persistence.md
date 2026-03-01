# Click-ID Export Persistence Assessment (GV-02)

- Task: `TASK-02`
- Plan: `docs/plans/brikette-sales-funnel-analysis/plan.md`
- Verification date: `2026-03-01`
- Investigator: `Codex`

## Scope

This investigation determines whether `brik_click_id` can be treated as a deterministic join key in Octorate export workflows.

## Evidence

### E1 — Current handoff URL contract in app code
- File: `apps/brikette/src/utils/buildOctorateUrl.ts`
- Finding: Current URL builder has no `brik_click_id` parameter in emitted query string.
- Implication: Deterministic click-id reconciliation cannot work until click-id is actually present in outbound handoff URLs and any downstream export-visible fields.

### E2 — Current canonical analytics event contract
- File: `apps/brikette/src/utils/ga4-events.ts`
- Finding: `handoff_to_engine` currently emits `handoff_mode`, `engine_endpoint`, `checkin`, `checkout`, `pax`, optional `source`; `brik_click_id` is not yet in payload.
- Implication: There is no canonical click-id signal parity between event payload and handoff URL yet.

### E3 — Export sampling access
- Attempted source: Octorate export rows for reservation-level fields.
- Result: No export dataset is available in-repo and no authenticated export retrieval path was available in this execution context.

## Decision Boundary

- Deterministic mode (`click_id` join) status: `Not validated`
- Proxy mode status: `Safe default`

### Decision

Until export-field persistence is proven with sampled rows, reconciliation policy must remain proxy/aggregate (time-window + route/source cohort matching) and explicitly non-deterministic at booking level.

## Required Follow-up for Deterministic Promotion

1. Emit `brik_click_id` in both:
   - outbound handoff URL query param, and
   - canonical `handoff_to_engine` event payload.
2. Pull sampled Octorate export rows (minimum: 20 rows across 7+ days).
3. Demonstrate click-id presence in a stable export field with retention long enough for reconciliation jobs.
4. Update policy artifact to `deterministic` only after evidence above is captured.

## Current Policy Statement (to consume in TASK-07B)

`Reconciliation operates in proxy mode. Booking-level deterministic attribution via click-id is not yet validated from Octorate exports.`
