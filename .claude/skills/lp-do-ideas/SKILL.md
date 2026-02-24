---
name: lp-do-ideas
description: Trial-mode idea orchestrator. Ingests standing-artifact delta events and emits schema-valid dispatch packets routed to lp-do-fact-find or lp-do-briefing. Trial mode only — does not mutate startup-loop stage state.
---

# lp-do-ideas Trial Orchestrator

`/lp-do-ideas` generates actionable dispatch packets from standing-artifact deltas.
It runs in `mode: trial` and queues packets for operator review before any downstream
skill is invoked.

## Operating Mode

**TRIAL ONLY**

This skill and its backing runtime (`lp-do-ideas-trial.ts`) operate exclusively in
`mode: trial`. Invoking with `mode: live` is rejected fail-closed. Live-mode
activation criteria are defined in
`docs/business-os/startup-loop/ideas/lp-do-ideas-go-live-seam.md`.

## Invocation

```
/lp-do-ideas <artifact-path-or-id> [--business <BIZ>] [--before <sha>] [--after <sha>]
```

Or provide a `ArtifactDeltaEvent` JSON payload directly.

## Required Inputs

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
