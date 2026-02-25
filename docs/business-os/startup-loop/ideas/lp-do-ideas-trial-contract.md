---
Type: Contract
Schema: lp-do-ideas-trial-contract
Version: 1.2.0
Mode: trial
Status: Active
Created: 2026-02-24
Updated: 2026-02-25
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
6. Include cluster identity fields on every emitted packet:
   - `root_event_id`
   - `anchor_key`
   - `cluster_key`
   - `cluster_fingerprint`
   - `lineage_depth`

Dispatches failing schema validation must enter `status: error` and must not be
forwarded to any downstream skill.

## 5. Idempotency

Each dispatch is uniquely identified by:
- Primary: `dispatch_id` (generated from processing timestamp + sequence)
- Secondary dedupe key v1 (legacy compatibility): `(artifact_id, before_sha, after_sha)` tuple
- Secondary dedupe key v2 (cluster-aware primary): `cluster_key + cluster_fingerprint`

Rules:
- Duplicate events are suppressed when either v1 or v2 key matches an existing queue entry.
- Queue transition order is deterministic: check duplicate `dispatch_id`, then dedupe v2, then dedupe v1.
- During migration, v1 suppression remains active to prevent historical replay duplicates.
- Suppressed duplicates are recorded as `queue_state: skipped` in telemetry
- Replay safety: processing the same input set twice must produce the same final queue state
- `cluster_fingerprint` must be computed from deterministic inputs only (no free-text summary inputs).

## 6. Trial Artifact Paths

All trial-mode writes are restricted to the following paths:

| Artifact | Path | Format |
|---|---|---|
| Dispatch ledger | `docs/business-os/startup-loop/ideas/trial/dispatch-ledger.jsonl` | newline-delimited JSON |
| Queue state | `docs/business-os/startup-loop/ideas/trial/queue-state.json` | JSON object |
| Telemetry records | `docs/business-os/startup-loop/ideas/trial/telemetry.jsonl` | newline-delimited JSON |
| Standing registry (live) | `docs/business-os/startup-loop/ideas/trial/standing-registry.json` | JSON object conforming to `lp-do-ideas-standing-registry.schema.json` |

No trial-mode operation may write to any path outside this list.

### Live Artifact Paths

When `mode: live` is active (post go-live activation), the corresponding write paths are:

| Artifact | Path | Format |
|---|---|---|
| Queue state | `docs/business-os/startup-loop/ideas/live/queue-state.json` | JSON object |
| Telemetry records | `docs/business-os/startup-loop/ideas/live/telemetry.jsonl` | newline-delimited JSON |
| Standing registry (live) | `docs/business-os/startup-loop/ideas/live/standing-registry.json` | JSON object conforming to `lp-do-ideas-standing-registry.schema.json` |

Trial artifact paths are preserved unchanged after live activation. No migration of trial data to live paths is required.
See `lp-do-ideas-go-live-seam.md` Section 2.3 for the full artifact path switch procedure.

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

### 8.1 Live Mode Implementation Status (2026-02-25)

As of this date, the following live-mode components have been implemented:

| Component | Status | Location |
|---|---|---|
| Live orchestrator (`runLiveOrchestrator`) | Complete | `scripts/src/startup-loop/lp-do-ideas-live.ts` |
| Routing adapter live-mode guard | Complete | `scripts/src/startup-loop/lp-do-ideas-routing-adapter.ts` |
| SIGNALS advisory hook (`runLiveHook`) | Complete | `scripts/src/startup-loop/lp-do-ideas-live-hook.ts` |
| Persistence adapter | Complete | `scripts/src/startup-loop/lp-do-ideas-persistence.ts` |
| Live artifact paths (`live/`) | Complete | `docs/business-os/startup-loop/ideas/live/` |
| Autonomous gate + kill-switch | Complete (inactive) | `scripts/src/startup-loop/lp-do-ideas-autonomous-gate.ts` |
| KPI rollup runner | Complete | `scripts/src/startup-loop/lp-do-ideas-metrics-runner.ts` |
| Production standing registry | Pending | Requires operator artifact review and SHA capture |
| Go-live activation | Pending | Blocked: KPI evidence, rollback drill, policy update |

Activation prerequisites (Section 8, full list in seam doc) remain unmet — KPI evidence
has not yet been collected. The hook is ready to wire into `/lp-weekly`. Live operation
data will drive Section A/B checklist completion.

## 9. Forward Compatibility

This contract is designed for forward compatibility with live mode:

- All artifacts use versioned schemas (`dispatch.v1`, `registry.v2`) with controlled compatibility migration from `registry.v1` entries.
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


## 11. Registry v2 Taxonomy and Cutover Alignment

Registry v2 introduces explicit classification and trigger controls for standing artifacts.

### 11.1 Artifact classes

| `artifact_class` | Default intent | Trigger expectation |
|---|---|---|
| `source_process` | Operator/process-authored standing source | `eligible` when explicitly configured |
| `source_reference` | Data/reference source artifact | `eligible` when explicitly configured |
| `projection_summary` | Derived summary/read-model artifact | non-trigger by default |
| `system_telemetry` | Queue/telemetry/runtime state artifact | never trigger |
| `execution_output` | Build/run output artifact | non-trigger by default |
| `reflection` | Post-build reflection artifact | non-trigger by default |

### 11.2 Trigger policy

`trigger_policy` is explicit per artifact:
- `eligible`: artifact may produce candidates/admissions, subject to runtime guards.
- `manual_override_only`: artifact never auto-admits; operator may force manual route when needed.
- `never`: artifact is always non-triggering.

Fail-open behavior is prohibited. Unknown or unclassified artifacts must be treated as non-trigger (`unknown_artifact_policy = fail_closed_never_trigger`).

### 11.3 Cutover phases (pack-diff -> source-trigger)

| Phase | Behavior | Admission rule |
|---|---|---|
| P0 legacy | Existing pack-centric behavior | legacy admission behavior remains |
| P1 shadow | Source scanning and telemetry enabled in shadow | no new source-only admission change enforced yet |
| P2 source-primary | Source-trigger admission enabled | pack-only diffs cannot admit without corresponding source truth delta |
| P3 pack-disabled | Pack artifacts remain observable only | pack artifacts classified `projection_summary + manual_override_only`; no default admission |

Phase execution invariants for runtime behavior:
- Unknown artifact IDs (not present in standing registry) are fail-closed and do not admit.
- P2/P3 require standing-registry classification to admit source-trigger work.
- Manual override may bypass `manual_override_only` policy for specific artifacts, but cannot bypass `trigger_policy: never`.
- In P2/P3, suppression precedence for pack-like events is mandatory:
  - If event is pack-like and no manual override is present, suppress with `pack_without_source_delta`.
  - Only non-pack events (or pack events with manual override) proceed to projection-immunity and trigger-policy checks.
- Projection/system/execution/reflection classes are projection-immune and do not auto-admit.

### 11.4 Shadow telemetry requirements (P1)

During `P1` runs, runtime must emit shadow telemetry pre-codes before full source-primary enforcement:
- `phase`
- `root_event_count`
- `candidate_count`
- `admitted_count`
- `suppression_reason_counts` (at minimum: `unknown_artifact`, `projection_immunity`, `trigger_policy_blocked`, `pack_without_source_delta`, `duplicate_event`)

These fields are diagnostic in P1 and become enforcement-linked observability inputs in P2/P3.

### 11.4A Cutover suppression acceptance examples

To keep `P2/P3` telemetry semantics stable and testable:

| Scenario | Expected admission | Required suppression counters |
|---|---|---|
| `P2`/`P3` pack-only event (no override) | `dispatched=0` | `pack_without_source_delta=1`, `projection_immunity=0` |
| `P2` projection-summary non-pack event | `dispatched=0` | `projection_immunity=1`, `pack_without_source_delta=0` |
| `P2` mixed source + pack events | source admits only | `pack_without_source_delta=1` for the pack event |

### 11.5 Aggregate pack default classification

For migration safety, aggregate pack artifacts (`MARKET-11`, `SELL-07`, `PRODUCTS-07`, `LOGISTICS-07`) default to:
- `artifact_class: projection_summary`
- `trigger_policy: manual_override_only`

This prevents duplicate admissions during cutover while preserving operator override capability.

### 11.6 Propagation mode semantics and provenance tags

Propagation is explicit per `propagation_mode`:

| Mode | Runtime action | Provenance tag |
|---|---|---|
| `projection_auto` | regenerate projection/read-model artifacts only | `updated_by_process=projection_auto` |
| `source_task` | emit standing-update task artifact(s) with deterministic idempotency key(s) | `updated_by_process=source_task` |
| `source_mechanical_auto` | apply allowlisted mechanical updates only | `updated_by_process=source_mechanical_auto` |

Enforcement rules:
- `projection_auto` updates are intake-suppressed by default.
- `source_task` emits task artifacts instead of semantic source rewrites.
- `source_mechanical_auto` must be allowlisted and must not change semantic fingerprints.
- Automatic semantic source-to-source rewrites remain prohibited.

### 11.7 Anti-loop invariant enforcement (trial runtime)

Runtime enforces the following anti-loop invariants on top of classification and trigger-policy gates:

| Invariant | Runtime rule | Suppression reason code |
|---|---|---|
| Projection immunity | Projection/system/execution/reflection classes never auto-admit. | `projection_immunity` |
| Anti-self-trigger | Events tagged with self-trigger provenance (`projection_auto`, `reflection_emit*`) are suppressed when non-material. | `anti_self_trigger_non_material` |
| Same-origin attach | For duplicate v2 cluster key/fingerprint, queue suppresses re-admission and attaches new evidence/location anchors to canonical entry. | queue duplicate reason (`skipped_duplicate_dedupe_key`) + attached counts |
| Lineage depth cap | Default max depth is `2`; depth `>2` requires explicit root-event override. | `lineage_depth_cap_exceeded` |
| Cooldown | Re-admission for same `cluster_key` + same fingerprint is blocked for default `72h` when non-material. | `cooldown_non_material` |
| Materiality gate | Metadata-only or declared non-material changes do not admit. | `non_material_delta` |

Determinism requirements:
- `cluster_fingerprint` and materiality inputs must be deterministic.
- Non-deterministic free-text summary fields are prohibited in fingerprint paths.
