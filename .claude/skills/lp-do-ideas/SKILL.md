---
name: lp-do-ideas
description: Trial-mode idea orchestrator. Ingests standing-artifact delta events and emits schema-valid dispatch packets routed to lp-do-fact-find or lp-do-briefing. Trial mode only — does not mutate startup-loop stage state.
---

# lp-do-ideas Trial Orchestrator

`/lp-do-ideas` generates actionable dispatch packets from standing-artifact deltas.
It runs in `mode: trial`. When a dispatch resolves to `fact_find_ready`, the agent
**immediately invokes `/lp-do-fact-find` without stopping for operator approval**.
`briefing_ready` dispatches are enqueued and presented for review only.

## Operating Mode

**TRIAL ONLY**

This skill and its backing runtime (`lp-do-ideas-trial.ts`) operate exclusively in
`mode: trial`. Invoking with `mode: live` is rejected fail-closed. Live-mode
activation criteria are defined in
`docs/business-os/startup-loop/ideas/lp-do-ideas-go-live-seam.md`.

## Invocation

```
/lp-do-ideas [<artifact-path-or-id>] [--business <BIZ>] [--before <sha>] [--after <sha>]
```

Or provide a `ArtifactDeltaEvent` JSON payload directly. Or invoke with no arguments to use the intake path.

## Intake Path (No Arguments or Free Text)

When invoked with no arguments, or with a plain description rather than a structured payload, run the intake flow.

### Step 1 — Gather the idea

Ask:

> What's the new information or idea? Describe it in plain language.

### Step 2 — Determine trigger type

From the description, determine which of two trigger types applies:

**`artifact_delta`** — the user describes a change that has *already happened* to a specific standing document. The artifact reflects the new truth now.

**`operator_idea`** — the user describes new information, a signal, or an idea that has *not yet been written into any standing artifact*. The artifact update is a downstream output of the work this dispatch will trigger — not a precondition.

If unclear, ask one question: "Has this already been written into a doc, or is this something new you want to act on?"

### Step 3 — Gather minimum context

**For artifact delta:**
- Which business?
- Which artifact changed? (show list from standing registry if needed)
- What changed? — user describes in plain language; agent infers `changed_sections` from description if SHAs are unavailable

**For operator idea:**
- Which business? (infer from context or ask)
- Area anchor — which system, product area, or business domain does this touch? (infer from description or confirm with one question)
- Domain — `MARKET | SELL | PRODUCTS | LOGISTICS | STRATEGY` (infer from area anchor; confirm only if genuinely ambiguous)
- Routing — is this something to investigate and plan, or just understand? Apply routing intelligence to decide; only ask the user if the description is genuinely ambiguous between planning and understanding

### Step 4 — Apply routing intelligence, emit, and auto-execute

Apply routing intelligence (see below) to determine `status` and `recommended_route`. Emit a schema-valid dispatch packet and enqueue it in `queue-state.json`.

For operator idea packets:
- `trigger: "operator_idea"`
- `artifact_id`, `before_sha`, `after_sha` — omit
- `evidence_refs` — include operator-stated rationale using the format: `"operator-stated: <one-line summary>"`
- All other required fields apply as normal

**Auto-execution policy:**
- `fact_find_ready` → immediately invoke `/lp-do-fact-find` with the dispatch packet. Do NOT stop for user approval. Set `queue_state: "auto_executed"` after invocation.
- `briefing_ready` → enqueue (`queue_state: "enqueued"`) and present a summary to the operator. Wait for confirmation before invoking `/lp-do-briefing`.
- `logged_no_action` → record and report. No downstream invocation.

## Required Inputs (Structured Invocation)

For structured / programmatic invocation with an artifact delta:

| Input | Description |
|---|---|
| `artifact_id` | Registered artifact key (must exist in standing registry) |
| `business` | Business identifier (e.g. `HBAG`, `BRIK`) |
| `after_sha` | Content hash of artifact after the delta |
| `path` | Relative path to the artifact from repo root |

Optional but needed for classification:
| Input | Description |
|---|---|
| `before_sha` | Content hash before delta (null = first registration → logged_no_action) |
| `changed_sections` | List of section headings that changed (used for routing assessment) |
| `domain` | `MARKET \| SELL \| PRODUCTS \| LOGISTICS \| STRATEGY \| BOS` |

## Cutover Phase Behavior (Source-Trigger Migration)

Runtime admission behavior is phase-aware:

| Phase | Intent | Admission behavior |
|---|---|---|
| `P0` | Legacy baseline | Existing admission logic remains, with fail-closed unknown-artifact suppression when registry is present |
| `P1` | Shadow | Same admission policy as P0 plus shadow telemetry (`root_event_count`, `candidate_count`, `admitted_count`, suppression pre-codes) |
| `P2` | Source-primary | Requires standing registry; only source-class + `trigger_policy=eligible` artifacts auto-admit; pack-only deltas do not admit unless manual override |
| `P3` | Pack-disabled steady state | Same as P2, with aggregate packs operationally non-trigger by default |

Safety rules:
- Unknown artifacts never auto-admit.
- Projection/read-model artifacts (`projection_summary`) do not auto-admit.
- `trigger_policy: never` cannot be bypassed by manual override.

## Routing Intelligence

Any delta with `changed_sections` present is assessed by the agent. The agent reads
the changed section content and exercises judgment to determine whether the change
warrants planning investigation, understanding only, or no action.

No hard keyword lists. The agent must answer these questions:

1. **Is the change material?** Substantive edit, or a typo/formatting fix?
2. **Does it open a planning gap?** Does what's documented now differ from what's
   built, planned, or actively running in a way that requires investigation and tasks?
3. **Is the area already covered?** Check `docs/plans/*/fact-find.md` and
   `docs/plans/*/plan.md` for any active or in-flight work covering the same area.
   If yes, a duplicate fact-find is wasteful — prefer `briefing_ready` to review
   what's already in-flight.

**Routing decision:**

- `fact_find_ready` → change is material AND creates a planning gap AND no
  in-flight fact-find or active plan already covers the area. Route to
  `lp-do-fact-find`. This applies to any domain that affects strategy, offer,
  distribution, product, measurement, brand/visual direction, or supply/logistics —
  not just ICP/pricing/channel.
- `briefing_ready` → change is material but the gap is informational rather than
  a planning gap (existing behaviour, context, background), OR in-flight work
  already covers the area and a briefing to review it is a better fit.
- `logged_no_action` → change is not material (formatting, typo, minor
  clarification), OR `before_sha` is null (first registration).

No `changed_sections` or missing `before_sha` → `logged_no_action` (no dispatch emitted).

## Evidence Fields for Classification

When gathering context in Step 3, listen for signals in the operator's description that
indicate one or more evidence fields should be captured. These fields are used downstream
to determine how urgently an idea is acted on and which tier it lands in. They are
advisory — if the operator doesn't provide them, proceed without asking; the downstream
classifier will apply automatic demotion to surface the gap.

Capture evidence fields during Step 3 and include any provided values in the dispatch
packet under `evidence_refs` or as structured fields alongside operator-stated rationale.

| Field | When to ask for it |
|---|---|
| `incident_id` | The operator mentions an active outage, failure, or ongoing bug |
| `deadline_date` | The operator mentions a deadline, launch date, or time constraint |
| `repro_ref` | The operator references a specific log, test result, or reproduction steps |
| `leakage_estimate_value` + `leakage_estimate_unit` | The operator mentions an estimated cost of the issue (e.g. "losing ~$50/day") |
| `first_observed_at` | The operator says the issue is recurring or has been seen before |
| `risk_vector` | The operator mentions legal, safety, security, privacy, or compliance exposure |
| `risk_ref` | Required alongside `risk_vector` — ask for a reference such as a CVE, legal document, or audit finding |
| `failure_metric` + `baseline_value` | A metric is breaking or performing worse than a known baseline |
| `funnel_step` + `metric_name` + `baseline_value` | The idea has a direct impact on a conversion step (pricing view, checkout, payment, or confirmation) |

**Example**: If the operator says "we have a live payment failure", ask for the incident
reference and whether there is a deadline for resolution. Those two data points
(`incident_id`, `deadline_date`) are enough to unlock the highest urgency tier.

If none of these signals are present in the operator's description, omit the evidence
fields entirely and route based on the description alone.

## Outputs

Each processed delta produces a `dispatch.v1` packet conforming to
`docs/business-os/startup-loop/ideas/lp-do-ideas-dispatch.schema.json`.

Key output fields:
| Field | Value |
|---|---|
| `schema_version` | `dispatch.v1` |
| `mode` | `trial` |
| `status` | `fact_find_ready \| briefing_ready \| logged_no_action` |
| `recommended_route` | `lp-do-fact-find \| lp-do-briefing` |
| `queue_state` | `enqueued` (initial) |

Results are enqueued in `docs/business-os/startup-loop/ideas/trial/queue-state.json`
by the queue layer (TASK-05: `lp-do-ideas-trial-queue.ts`).

## Idempotency

Duplicate events (same `artifact_id` + `before_sha` + `after_sha`) are suppressed.
The `seenDedupeKeys` set is maintained across calls to the queue layer.

## Failure Handling

| Condition | Outcome |
|---|---|
| `mode != "trial"` | Fail-closed — returns error, no packets emitted |
| Missing `after_sha` | Event counted as noop, no packet emitted |
| Null `before_sha` | First registration — logged_no_action, no packet |
| No `changed_sections` | Conservative — logged_no_action, no packet |
| Duplicate event hash | Suppressed — counted in `suppressed` result field |

## Contract References

- Dispatch schema: `docs/business-os/startup-loop/ideas/lp-do-ideas-dispatch.schema.json`
- Standing registry: `docs/business-os/startup-loop/ideas/lp-do-ideas-standing-registry.schema.json`
- Trial contract: `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md`
- Policy decision: `docs/plans/lp-do-ideas-startup-loop-integration/artifacts/trial-policy-decision.md`
- Routing adapter: `scripts/src/startup-loop/lp-do-ideas-routing-adapter.ts` (TASK-04)
- Queue + telemetry: `scripts/src/startup-loop/lp-do-ideas-trial-queue.ts` (TASK-05)
