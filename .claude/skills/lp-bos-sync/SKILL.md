---
name: lp-bos-sync
description: S5B BOS sync stage worker. Persists prioritized baseline outputs to Business OS (D1) via agent API, then emits S5B stage-result.json to signal control plane commit.
---

# BOS Sync (S5B)

Persist the run's candidate baseline outputs to Business OS (D1) in an idempotent way, then write `stages/S5B/stage-result.json` to signal the control plane that it may promote the manifest pointer (`candidate -> current`).

**Loop-spec reference:** `docs/business-os/startup-loop/loop-spec.yaml` — stage `S5B`

## Operating Mode

**STAGE WORKER (data plane)**

This skill writes ONLY to its own stage directory: `stages/S5B/`.
It MUST NOT write to `baseline.manifest.json`, `state.json`, or `events.jsonl` (control-plane owned).

## When To Use

Invoked automatically by the startup-loop control plane after `S5A` completes.
Not typically invoked directly by users.

## Required Inputs

All inputs are read from upstream `stage-result.json` files within the run directory.

| Source Stage | Artifact Key | Required | Description |
|-------------|--------------|----------|-------------|
| S5A | `prioritized_items` | **yes** | The prioritized list selected at S5A (to persist as a baseline stage doc) |

## Blocking Logic

If S5A is not complete, or the required artifact file is missing, write a `stage-result.json` with `status: Blocked` or `status: Failed` to `stages/S5B/` and stop.

### Blocked Output Shape

```json
{
  "schema_version": 1,
  "run_id": "<run_id>",
  "stage": "S5B",
  "loop_spec_version": "<version>",
  "status": "Blocked",
  "timestamp": "<ISO 8601 UTC>",
  "produced_keys": [],
  "artifacts": {},
  "error": null,
  "blocking_reason": "<specific reason>"
}
```

## Persistence Contract (Idempotent Upserts)

Implementation reference: `scripts/src/startup-loop/bos-sync.ts`

### What This Stage Persists

1. **Baseline card** (idempotent upsert)
   - `cardId`: `${BUSINESS}-BASELINE-${RUN_ID}`
   - Fields: title, business, run_id, loop_spec_version

2. **Stage doc** (idempotent upsert)
   - `cardId`: `${BUSINESS}-BASELINE-${RUN_ID}`
   - `stage`: `build` (canonical stage-doc type)
   - `content`: the full `prioritized_items` artifact content from S5A

**Important:** This stage worker does not directly mutate the on-disk manifest pointer. It only writes `stages/S5B/stage-result.json`. The control plane promotes the manifest (`candidate -> current`) when it observes `S5B status=Done`. See `docs/business-os/startup-loop/manifest-schema.md`.

## Outputs

### Files Written To `stages/S5B/`

| File | Condition | Description |
|------|-----------|-------------|
| `stage-result.json` | Always | Stage result per `stage-result-schema.md` |

### Stage Result (Done)

```json
{
  "schema_version": 1,
  "run_id": "<run_id>",
  "stage": "S5B",
  "loop_spec_version": "<version>",
  "status": "Done",
  "timestamp": "<ISO 8601 UTC>",
  "produced_keys": [],
  "artifacts": {},
  "error": null,
  "blocking_reason": null
}
```

## Canonical Paths

| Artifact | Path |
|----------|------|
| Stage result | `<run_root>/stages/S5B/stage-result.json` |

Where `<run_root>` is `docs/business-os/startup-baselines/<BIZ>/runs/<run_id>/`.

## Error Handling

| Error Type | Behavior |
|-----------|----------|
| S5A stage-result missing or not Done | `status: Blocked` with a specific `blocking_reason` |
| S5A artifact file missing | `status: Failed` with `error: "Artifact file missing: <path> referenced in S5A stage-result"` |
| BOS API error | `status: Failed` with `error: "BOS API error: <message>"` |

## Related Resources

- Loop spec: `docs/business-os/startup-loop/loop-spec.yaml`
- Manifest schema: `docs/business-os/startup-loop/manifest-schema.md`
- Stage result schema: `docs/business-os/startup-loop/stage-result-schema.md`
- Tests: `scripts/src/startup-loop/__tests__/bos-sync.test.ts`
