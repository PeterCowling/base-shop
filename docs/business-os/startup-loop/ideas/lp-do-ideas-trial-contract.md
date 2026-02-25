---
Type: Contract
Schema: lp-do-ideas-trial-contract
Version: 1.0.0
Mode: trial
Status: Active
Created: 2026-02-24
Owner: startup-loop maintainers
Related-plan: docs/plans/lp-do-ideas-startup-loop-integration/plan.md
Related-schema: lp-do-ideas-dispatch.schema.json, lp-do-ideas-standing-registry.schema.json
Related-skill: /lp-do-ideas (pending — TASK-03)
Related-artifacts: docs/plans/lp-do-ideas-startup-loop-integration/artifacts/trial-policy-decision.md
---

# lp-do-ideas Trial Mode Contract

## 1. Mode Boundary

**Trial mode does not mutate startup-loop stage state.**

All `lp-do-ideas` operations in `mode: trial` are:

| Permission | Scope |
|---|---|
| **Read-only** | startup-loop stage gates, advancement state, `loop-spec.yaml`, `cmd-advance` modules, stage status files |
| **Write-allowed** | Designated trial artifact paths only (see Section 6) |
| **Prohibited** | Any write to startup-loop stage status, gate state, or orchestration modules |

This boundary is enforced by contract (this document) and by test assertions in
TASK-03 (TC-04: no writes outside designated trial artifact paths).

Attempting to invoke `mode: live` in this tranche must be rejected fail-closed
with an explicit error. Live mode is reserved for the go-live integration phase
defined in `lp-do-ideas-go-live-seam.md` (TASK-07 deliverable).

## 2. Autonomy Policy

**Active policy**: Option B — Queue with Confirmation

| Behaviour | Rule |
|---|---|
| Dispatch generated | Dispatch is enqueued in trial queue |
| Downstream invocation | None — no auto-invocation in trial mode |
| Operator action required | Operator reviews queue and confirms each invocation explicitly |
| Auto-execute status | `auto_executed` status is reserved; must not be set in trial mode under Option B |

**Escalation path to Option C (hybrid)**:
Escalation requires ALL of the following conditions met:
- Trial review period ≥ 14 days
- Sample size ≥ 40 dispatches
- Dispatch precision ≥ 80% (correct route: `lp-do-fact-find` vs `lp-do-briefing`)

When conditions are met, the operator may update the policy decision artifact
and bump `Version` to `1.1.0` to activate Option C: auto-invoke P1 dispatches,
queue P2/P3 for confirmation.

## 3. Trigger Threshold

**Active threshold**: T1-conservative

A standing-artifact delta qualifies as `fact_find_ready` only when it contains
a semantic change to one of the following section types:

| Section type | Qualifying keywords (case-insensitive substring match) |
|---|---|
| ICP definition | `icp`, `target customer`, `segment`, `persona`, `job-to-be-done`, `jtbd` |
| Positioning / value proposition | `positioning`, `value proposition`, `unique`, `differentiation`, `key message` |
| Pricing / offer structure | `pricing`, `price point`, `offer`, `bundle`, `promotional` |
| Channel strategy | `channel strategy`, `launch channel`, `channel mix`, `channel priorities`, `channel selection` |

All other artifact changes yield `status: logged_no_action`.

**Escalation path to T2-moderate**:
Escalation is permitted once:
- T1 false-negative rate is measured (at least one trial review cycle completed)
- Acceptable throughput is confirmed by operator
- Policy decision artifact is updated with T2 rationale and version bumped

## 4. Dispatch Contract

All dispatches emitted in trial mode must:

1. Conform to `lp-do-ideas-dispatch.schema.json` (`schema_version: dispatch.v1`)
2. Carry `"mode": "trial"` — immutable in this tranche
3. Include all required intake fields for their route:

| Route | Required fields beyond base schema |
|---|---|
| `lp-do-fact-find` | `area_anchor` (non-empty), `location_anchors` (≥1 item), `provisional_deliverable_family` |
| `lp-do-briefing` | `area_anchor` (non-empty) |

4. Carry non-empty `evidence_refs` (at least one artifact path or anchor)
5. Include a valid `recommended_route` value: `lp-do-fact-find` or `lp-do-briefing`

Dispatches failing schema validation must enter `status: error` and must not be
forwarded to any downstream skill.

## 5. Idempotency

Each dispatch is uniquely identified by:
- Primary: `dispatch_id` (generated from processing timestamp + sequence)
- Deduplication key: `(artifact_id, before_sha, after_sha)` tuple

Rules:
- Duplicate events (same deduplication key) must be suppressed before dispatch generation
- Suppressed duplicates are recorded as `queue_state: skipped` in telemetry
- Replay safety: processing the same input set twice must produce the same final queue state
- `dispatch_id` generation must be deterministic for a given `(artifact_id, before_sha, after_sha)` tuple

## 6. Trial Artifact Paths

All trial-mode writes are restricted to the following paths:

| Artifact | Path | Format |
|---|---|---|
| Dispatch ledger | `docs/business-os/startup-loop/ideas/trial/dispatch-ledger.jsonl` | newline-delimited JSON |
| Queue state | `docs/business-os/startup-loop/ideas/trial/queue-state.json` | JSON object |
| Telemetry records | `docs/business-os/startup-loop/ideas/trial/telemetry.jsonl` | newline-delimited JSON |
| Standing registry (live) | `docs/business-os/startup-loop/ideas/trial/standing-registry.json` | JSON object conforming to `lp-do-ideas-standing-registry.schema.json` |

No trial-mode operation may write to any path outside this list.

## 7. Queue Lifecycle

Queue entries follow a monotonic state machine:

```
enqueued → processed
         → skipped   (duplicate suppression)
         → error     (schema validation failure or processing error)
```

Transitions:
- `enqueued` → `processed`: operator confirms invocation
- `enqueued` → `error`: downstream invocation fails or validation rejects packet
- Any state → `skipped`: duplicate detection fires (idempotency guard)

State transitions are append-only in the telemetry record. The queue state file
reflects the current state; the telemetry log preserves full history.

## 8. Mode Switch (Trial → Live)

Mode switch is deferred to a separate go-live decision. Go-live activation
criteria and rollback playbook are defined in `lp-do-ideas-go-live-seam.md`
(TASK-07 deliverable, pending TASK-06 checkpoint).

**Activation prerequisites** (minimum — full list in go-live seam doc):
- Dispatch precision ≥ 80% over ≥14 days / ≥40 dispatches
- Duplicate suppression rate variance ≤ ±10% over ≥2 consecutive weekly samples
- Rollback drill completes in ≤30 minutes with verified no stage mutations

Until these conditions are met:
- `mode: live` invocation is rejected fail-closed
- Trial artifact paths remain the only permitted write targets
- Startup-loop stage orchestration remains unchanged

## 9. Forward Compatibility

This contract is designed for forward compatibility with live mode:

- All artifacts use versioned schemas (`dispatch.v1`, `registry.v1`)
- `mode` field is present and validated in all dispatch packets
- Required fields for `lp-do-fact-find` intake are a strict superset of live mode requirements
- No standing registry entries depend on startup-loop internal state
- Queue/telemetry formats are designed to be consumed by go-live KPI analysis without migration

## 10. Schema Cross-Reference

| Concept | Defined in |
|---|---|
| Dispatch packet format | `lp-do-ideas-dispatch.schema.json` |
| Standing artifact registry format | `lp-do-ideas-standing-registry.schema.json` |
| Autonomy/threshold policy | `docs/plans/lp-do-ideas-startup-loop-integration/artifacts/trial-policy-decision.md` |
| Go-live activation criteria | `lp-do-ideas-go-live-seam.md` (TASK-07, pending) |
| Fact-find intake contract | `.claude/skills/lp-do-fact-find/SKILL.md` |
| Briefing intake contract | `.claude/skills/lp-do-briefing/SKILL.md` |
| Startup-loop stage spec | `docs/business-os/startup-loop/loop-spec.yaml` |
