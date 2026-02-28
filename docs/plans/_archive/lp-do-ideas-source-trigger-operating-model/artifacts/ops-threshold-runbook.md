# lp-do-ideas Ops Threshold Runbook

## Scope

Operational response rules for `lp-do-ideas` telemetry rollups produced by:
- `scripts/src/startup-loop/lp-do-ideas-metrics-rollup.ts`

Metrics covered:
- `fan_out_admitted`
- `loop_incidence`
- `queue_age_p95_days` (`DO`, `IMPROVE`)

## Thresholds

| Metric | Threshold | Window rule | Action |
|---|---|---|---|
| `fan_out_admitted` | `> 1.5` | 2 consecutive cycles | Investigate clustering quality and candidate clustering boundaries |
| `loop_incidence` | `> 0.25` | 2 consecutive cycles | Review same-origin/cooldown/materiality invariant tuning |
| `queue_age_p95_days.DO` | `> 21` | Current cycle | Rebalance DO WIP cap or reduce DO admissions |
| `queue_age_p95_days.IMPROVE` | `> 21` | Current cycle | Rebalance IMPROVE WIP cap or reduce IMPROVE admissions |

## Deterministic Alert Contract

Every threshold breach emits one deterministic action record:

- `action_id`: deterministic metric scope key (`<metric>:<scope>`)
- `metric`: one of `fan_out_admitted`, `loop_incidence`, `queue_age_p95_days`
- `cycle_ids`: consecutive breach cycles (empty for lane queue-age alert)
- `lane`: required for queue-age alerts
- `observed_value`
- `threshold`
- `recommended_action`
- `reason`

## Interpretation Notes

- `fan_out_admitted` measures admission intensity after clustering; sustained values above threshold indicate over-fragmented clustering or low materiality bar.
- `loop_incidence` uses loop-guard suppression numerator only (`same_origin_attach`, `anti_self_trigger`, `lineage_cap`, `cooldown`, `materiality`).
- `queue_age_p95_days` is computed from currently `enqueued` dispatches only.

## Operator Response Checklist

1. Confirm the alert is based on reconciled telemetry (`enforced` preferred over `shadow` for same cycle+phase).
2. For `fan_out_admitted` alerts:
   - Review cluster key/fingerprint boundaries.
   - Check for over-splitting by anchor keys.
3. For `loop_incidence` alerts:
   - Inspect suppression reason distribution by invariant group.
   - Re-tune cooldown/materiality only with replay evidence.
4. For queue-age alerts:
   - Adjust lane WIP caps and re-run scheduler.
   - If persistent, reduce admission rate in the affected lane.
5. Record changes in next cycle notes before applying further threshold-driven changes.

## Rollback Guidance

If threshold actions degrade throughput or increase duplicate admissions:
- Restore prior scheduler cap settings.
- Revert invariant tuning changes.
- Run one cycle in observe-only mode before applying another action.
