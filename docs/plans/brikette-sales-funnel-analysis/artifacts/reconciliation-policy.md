# Handoff Reconciliation Policy

- Task: `TASK-07B`
- Verification date: `2026-03-01`
- Inputs:
  - `artifacts/click-id-export-persistence.md` (TASK-02)
  - `apps/brikette/src/utils/ga4-events.ts` (TASK-07A schema)
  - `apps/brikette/src/utils/buildOctorateUrl.ts`

## Policy Mode

- Active mode: `proxy`
- Deterministic click-id URL join: `disabled`

## Rationale

TASK-02 did not produce export-row evidence proving that a URL-level click-id survives into stable Octorate export fields. Until that proof exists, adding click-id to handoff URLs risks overclaiming deterministic attribution.

## URL Contract

- Outbound Octorate URLs do **not** include `brik_click_id` in proxy mode.
- `buildOctorateUrl` accepts optional `brikClickId` input for forward compatibility but intentionally does not append it while policy is proxy.

## Event Contract

- `handoff_to_engine` keeps per-attempt `brik_click_id` in analytics payload for proxy cohorting and event-level analysis.
- `brik_click_id` is not treated as continuity state and is not reused across handoff attempts.

## Promotion Criteria to Deterministic Mode

Promote to deterministic only when all are true:
1. Click-id is present in outbound URL and canonical event payload.
2. Octorate export samples show durable click-id persistence in a stable field.
3. Join quality is measured and acceptable over at least one full reporting cycle.
