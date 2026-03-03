# Ideas Dispatch Lifecycle

Single-page overview of how idea dispatches progress through the system, from creation to completion, and how the trial-to-live transition works.

## 1. Dispatch Creation

Standing-artifact deltas (changes to registered artifacts like ICP, pricing, brand identity) trigger the ideas orchestrator. The orchestrator:

1. Detects which registered artifact changed (via SHA comparison against the standing registry)
2. Classifies the change against the T1 trigger threshold (semantic keywords: ICP, positioning, pricing, channels, brand, solution, naming, distribution)
3. Emits a `dispatch.v2` packet with routing recommendation (`lp-do-fact-find` or `lp-do-briefing`)

Each dispatch carries required fields: `dispatch_id`, `schema_version`, `mode`, `anchor_key`, `cluster_key`, `evidence_refs`, and intake fields needed by the downstream skill.

**Schema references:**
- Primary: `schemas/lp-do-ideas-dispatch.v2.schema.json`
- Compat (v1, deprecated): `_deprecated/lp-do-ideas-dispatch.schema.json`

**Detail:** `lp-do-ideas-trial-contract.md` Section 4 (Dispatch Contract)

## 2. Trial Queue Processing

Dispatches enter the trial queue at `trial/queue-state.json`. The queue layer:

1. Checks idempotency (v2 cluster-aware dedupe via `cluster_key` + `cluster_fingerprint`)
2. Admits new dispatches as `queue_state: "enqueued"`
3. Rejects duplicates as `queue_state: "skipped"`
4. Records all events in `trial/telemetry.jsonl`

Queue lifecycle states are monotonic (dispatches move forward only):
- `enqueued` — admitted, awaiting operator review
- `processed` — consumed by a fact-find or briefing
- `skipped` — duplicate, suppressed by idempotency check
- `error` — validation failure

**Detail:** `lp-do-ideas-trial-contract.md` Section 5 (Queue Layer)

## 3. Operator Confirmation

The system currently operates under **Option B autonomy** (queue with manual confirmation). This means:

- The routing adapter produces invocation payloads but does **not** auto-invoke skills
- The operator reviews queued dispatches and decides which to action
- No dispatch is invoked without explicit operator confirmation

Escalation to Option C (hybrid auto-invoke for P1 dispatches) requires meeting all three thresholds: 14+ days of trial operation, 40+ dispatches processed, and 80%+ routing precision.

**Detail:** `lp-do-ideas-routing-matrix.md` Section 6 (Option B Policy Boundary)

## 4. Downstream Invocation

When the operator confirms a dispatch, the routing adapter determines the downstream skill:

| Dispatch Status | Route | Lane |
|---|---|---|
| `fact_find_ready` | `/lp-do-fact-find` | DO (default) |
| `briefing_ready` | `/lp-do-briefing` | IMPROVE (default) |
| `logged_no_action` | No route | Terminal no-op |

The adapter validates all required intake fields before producing a payload. Missing fields produce a `RouteError` with a specific error code (e.g., `MISSING_AREA_ANCHOR`, `MISSING_EVIDENCE_REFS`).

Once invoked, the standard feature pipeline runs: fact-find produces a brief, which feeds `/lp-do-plan`, which feeds `/lp-do-build`.

**Detail:** `lp-do-ideas-routing-matrix.md` Section 2 (Route Matrix)

## 5. Completion

When the downstream build completes:

1. The plan is archived to `docs/plans/_archive/<feature-slug>/`
2. The queue-state completion hook marks the originating dispatch as `completed` in `trial/queue-state.json`
3. Build artifacts (build-record, results-review, pattern-reflection) are committed

The dispatch lifecycle is then complete. Any new standing-artifact changes from the build may trigger fresh dispatches (cascade), identified by the `triggered_by` field linking back to the original dispatch.

## 6. Trial-to-Live Transition

The system is currently in **trial mode** with live activation deferred. The transition requires meeting all preconditions in the go-live checklist:

### Activation Preconditions

| Gate | Requirement | Current Status |
|---|---|---|
| Trial KPIs (VC-01) | 14+ days, 40+ dispatches, 80%+ precision | NO-GO |
| Idempotency stability (VC-02) | Suppression variance <=10% over 2 consecutive weeks | NO-GO |
| Rollback readiness (VC-03) | Drill completed in <=30 min, no stage mutations | NO-GO |
| Code readiness | Live orchestrator created, adapter updated, tests pass | GO |
| Artifact paths | `live/` directory with queue-state, telemetry, standing-registry | Partial |
| Policy & governance | Policy decision and trial contract updated | NO-GO |
| Scope confirmation | No stage writes, no advance calls, no auto-invoke | GO |
| Lane governance | WIP caps configured, scheduler tested, aging verified | Partial |
| Payload quality (v2 contract) | 50%+ operator-authored `why`, 80%+ complete v2 fields | NO-GO |

### What Changes in Live Mode

In live mode, dispatches are triggered automatically by `/lp-do-build` commits (instead of manual `/lp-do-ideas` invocation):

1. `/lp-do-build` completes a task and commits files
2. The build-time hook compares committed files against `live/standing-registry.json`
3. If a registered artifact changed, `runLiveHook()` computes the SHA delta and emits a live dispatch
4. The dispatch enters `live/queue-state.json` (separate from trial queue)
5. Operator confirmation is still required (Option B applies to live mode too)

Live dispatches are **advisory** — they never block `/lp-do-build` or `/startup-loop advance`.

### Rollback

If live mode causes problems (precision drop below 70%, suppression instability, unexpected stage mutations, or queue data loss), the rollback playbook provides an 8-step procedure targetable within 30 minutes. The rollback reverts to trial-only operation without data loss.

**Detail:**
- `lp-do-ideas-go-live-checklist.md` — full activation gate checklist
- `lp-do-ideas-go-live-seam.md` — mode-switch procedure (8 steps)
- `lp-do-ideas-rollback-playbook.md` — emergency rollback procedure

## Schema Locations

| Schema | Location | Status |
|---|---|---|
| Dispatch v2 (primary) | `schemas/lp-do-ideas-dispatch.v2.schema.json` | Active |
| Dispatch v1 (compat) | `_deprecated/lp-do-ideas-dispatch.schema.json` | Deprecated — reference only for 129 historical v1 packets |
| Standing registry | `schemas/lp-do-ideas-standing-registry.schema.json` | Active |
| Telemetry events | `lp-do-ideas-telemetry.schema.md` | Active |

## Related Documents

- Trial operating contract: `lp-do-ideas-trial-contract.md`
- Routing matrix: `lp-do-ideas-routing-matrix.md`
- Go-live seam contract: `lp-do-ideas-go-live-seam.md`
- Go-live checklist: `lp-do-ideas-go-live-checklist.md`
- Rollback playbook: `lp-do-ideas-rollback-playbook.md`
