---
Type: Note
Status: Active
Domain: Platform
Last-reviewed: 2026-03-10
Relates-to:
  - /Users/petercowling/base-shop/docs/plans/startup-loop-results-review-historical-carryover/plan.md
---

# Historical Carry-Over Manifest Contract

## Decision

Historical archive carry-over must use its own audited manifest contract.

It must **not** pretend archived findings already satisfy the canonical active-plan build-origin contract, because the archive rows do not have trustworthy `build_signal_id`, `recurrence_key`, or queue-ready status fields.

## Why

The queue-unification thread proved three things:

1. the live backlog path is already fixed
2. the archive still contains worthwhile items
3. those archive items are legacy-shaped and require human triage

So the follow-on needs a provenance-first manifest that can carry manual decisions explicitly.

## Required Objects

### 1. Historical carry-over manifest

Path:

- `docs/plans/startup-loop-results-review-historical-carryover/artifacts/historical-carryover-manifest.json`

Schema:

```json
{
  "schema_version": "historical-carryover-manifest.v1",
  "generated_at": "ISO-8601",
  "source_audit_path": "docs/plans/_archive/startup-loop-results-review-queue-unification/artifacts/historical-carryover-audit.md",
  "items": []
}
```

### 2. Historical carry-over item

Each normalized candidate must be one manifest item with these fields:

```json
{
  "historical_candidate_id": "hc_<stable-id>",
  "title": "Normalized human title",
  "category": "new_loop_process | ai_to_mechanistic | new_skill | new_standing_data_source",
  "source_plan_slugs": ["archive-plan-slug"],
  "source_paths": [
    "docs/plans/_archive/<slug>/results-review.signals.json",
    "docs/plans/_archive/<slug>/pattern-reflection.entries.json"
  ],
  "source_titles": [
    "raw title or truncated summary variants"
  ],
  "current_state": "worthwhile_unresolved | resolved | superseded | moot",
  "carry_forward_decision": "carry_forward | do_not_carry",
  "decision_reason": "short explicit rationale",
  "manual_judgment_notes": "required when decision was not deterministic",
  "queue_mapping": null,
  "admission_result": null
}
```

## Identity Rules

### Historical candidate identity

Use `historical_candidate_id`, not `build_signal_id`.

Construction rule:

- stable hash over `normalized title + sorted source plan slugs`

Reason:

- archive rows are legacy and do not have trustworthy canonical build-origin IDs
- we need a stable audit key, not a fake live-origin key

### Raw source preservation

Every item must preserve:

- all raw source titles
- all source file paths
- all source plan slugs

Reason:

- some archive duplicates only reconcile via human normalization because `pattern-reflection` stored truncated summaries

## Carry-Forward Queue Mapping

For `carry_forward` items, `queue_mapping` becomes required:

```json
{
  "business": "BOS | BRIK | XA | ...",
  "route": "lp-do-fact-find | lp-do-plan | lp-do-build | lp-do-briefing",
  "status": "fact_find_ready | plan_ready | build_ready | briefing_ready",
  "target_slug": "future slug",
  "target_path": "future path",
  "provenance": {
    "schema_version": "dispatch-historical-carryover.v1",
    "historical_candidate_id": "hc_<stable-id>",
    "source_audit_path": "docs/plans/_archive/startup-loop-results-review-queue-unification/artifacts/historical-carryover-audit.md",
    "source_plan_slugs": ["archive-plan-slug"],
    "source_paths": ["docs/plans/_archive/..."],
    "backfilled_at": null
  }
}
```

`queue_mapping.provenance.backfilled_at` is `null` during TASK-02 and becomes an ISO-8601 timestamp only after TASK-03 performs the actual queue admission.

After queue admission, `admission_result` becomes required for carried items:

```json
{
  "dispatch_id": "IDEA-DISPATCH-...",
  "queue_state": "enqueued | suppressed",
  "telemetry_reason": "historical_carryover_bridge",
  "admitted_at": "ISO-8601",
  "suppression_reason": "optional explicit dedupe explanation"
}
```

## Explicit Non-Rules

Do not:

- fabricate `build_signal_id`
- fabricate `recurrence_key`
- write historical items back through the active build-origin bridge
- re-enable archive reads in `generate-process-improvements.ts`

Those would blur the line between live build-origin intake and manual historical carry-over.

## Deterministic vs Manual Decisions

### Deterministic

Allowed only when all of the following are true:

- source titles reconcile without human interpretation
- current repo state clearly proves `resolved`, `superseded`, or `moot`
- no routing or business-target ambiguity remains

### Manual

Required when any of the following are true:

- truncated and full titles must be human-merged
- the candidate is still worthwhile but route/slug/business need judgment
- the underlying problem is real but current strategic value is context-dependent

## Consequences For Remaining Tasks

### TASK-02

Build the manifest with `12` normalized items and explicit `carry_forward_decision` for each one.

### TASK-03

Only items with:

- `current_state = worthwhile_unresolved`
- `carry_forward_decision = carry_forward`
- non-null `queue_mapping`

may be admitted into queue.

Every admitted item must then record `admission_result` so the manifest remains the authoritative audit surface for what was actually enqueued.

### TASK-04

Verification must prove:

- all non-carried items still have explicit manifest rationale
- queue-only canonicality stayed intact
- no live backlog reader consumes archive data directly
