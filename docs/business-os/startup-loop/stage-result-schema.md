# Stage Result Schema + Data-Plane Ownership Contract

Canonical schema for stage-result files emitted by parallel stage workers.
Part of the Startup Loop runtime contract (see `loop-spec.yaml`).

**Decision reference:** `docs/plans/lp-skill-system-sequencing-plan.md` (DL-01, DL-02)

## 1) Purpose

When a stage worker completes (success, failure, or blocked), it writes a `stage-result.json` file into its stage-owned directory. The single-writer control plane reads these files to update the manifest and derived run state. This contract ensures:

1. Parallel workers never contend on shared state.
2. The control plane can deterministically derive current run state from stage results.
3. Missing or malformed results are detectable before any shared state is updated.

## 2) Directory Ownership Contract

```
docs/business-os/startup-baselines/<BIZ>/runs/<run_id>/
  baseline.manifest.json              # CONTROL-PLANE owned (single-writer)
  state.json                          # CONTROL-PLANE owned (derived, single-writer)
  events.jsonl                        # CONTROL-PLANE owned (append-only, single-writer)
  stages/
    S2B/                              # STAGE-OWNED: only S2B worker writes here
      stage-result.json
      offer.md
    S3/                               # STAGE-OWNED: only S3 worker writes here
      stage-result.json
      forecast.md
    S6B/                              # STAGE-OWNED: only S6B worker writes here
      stage-result.json
      channels.md
      seo.md                          # optional
      outreach.md                     # optional
    S4/                               # STAGE-OWNED: only S4 worker writes here
      stage-result.json
      baseline.snapshot.md
    S5A/                              # STAGE-OWNED: only S5A worker writes here
      stage-result.json
      prioritized-items.md
    S5B/                              # STAGE-OWNED: only S5B worker writes here
      stage-result.json
```

**Rules:**
- A stage worker may ONLY write files under `stages/<its-stage-id>/`.
- A stage worker MUST NOT read or write `baseline.manifest.json`, `state.json`, or `events.jsonl`.
- The control plane is the SOLE writer for manifest, state, and events files.
- Stage workers MAY read other stages' `stage-result.json` files (read-only) when needed for input validation (e.g., S4 reads S3 and S6B results).

## 3) Stage Result Schema (v1)

```json
{
  "schema_version": 1,
  "run_id": "<string: SFS-<BIZ>-<YYYYMMDD>-<hhmm>>",
  "stage": "<string: stage ID from loop-spec.yaml>",
  "loop_spec_version": "<string: spec_version from loop-spec.yaml>",
  "status": "<enum: Done | Failed | Blocked>",
  "timestamp": "<string: ISO 8601 UTC>",
  "produced_keys": ["<string: artifact key>"],
  "artifacts": {
    "<key>": "<string: relative path from run root>"
  },
  "error": "<string|null: error message when status=Failed>",
  "blocking_reason": "<string|null: reason when status=Blocked>"
}
```

### Field definitions

| Field | Type | Required | Description |
|---|---|---|---|
| `schema_version` | integer | yes | Always `1` for this version. |
| `run_id` | string | yes | Stable run identifier matching `SFS-<BIZ>-<YYYYMMDD>-<hhmm>` format. |
| `stage` | string | yes | Stage ID from loop-spec.yaml (e.g., `S3`, `S6B`). |
| `loop_spec_version` | string | yes | Version of the loop spec this run is executing against. |
| `status` | enum | yes | `Done` = stage completed successfully. `Failed` = stage encountered an error. `Blocked` = stage cannot proceed due to missing input or gate failure. |
| `timestamp` | string | yes | ISO 8601 UTC timestamp of when the stage completed/failed/blocked. |
| `produced_keys` | string[] | yes | List of artifact keys this stage produced. Empty array for `Failed`/`Blocked`. |
| `artifacts` | object | yes | Map of artifact key to relative path (from run root). Empty object for `Failed`/`Blocked`. |
| `error` | string\|null | no | Error description when `status=Failed`. Null or omitted otherwise. |
| `blocking_reason` | string\|null | no | Blocking reason when `status=Blocked`. Null or omitted otherwise. |

### Validation rules

1. `schema_version` must equal `1`.
2. `stage` must be a valid stage ID in the referenced `loop_spec_version`.
3. `status=Done` requires non-empty `produced_keys` and matching keys in `artifacts`.
4. `status=Failed` requires non-null `error`.
5. `status=Blocked` requires non-null `blocking_reason`.
6. All paths in `artifacts` must be relative (no leading `/`).

## 4) Examples

### Example 1: S2B (Offer design) — Done

```json
{
  "schema_version": 1,
  "run_id": "SFS-HEAD-20260213-1200",
  "stage": "S2B",
  "loop_spec_version": "1.0.0",
  "status": "Done",
  "timestamp": "2026-02-13T12:02:00Z",
  "produced_keys": ["offer"],
  "artifacts": {
    "offer": "stages/S2B/offer.md"
  },
  "error": null,
  "blocking_reason": null
}
```

### Example 2: S3 (Forecast) — Done

```json
{
  "schema_version": 1,
  "run_id": "SFS-HEAD-20260213-1200",
  "stage": "S3",
  "loop_spec_version": "1.0.0",
  "status": "Done",
  "timestamp": "2026-02-13T12:04:00Z",
  "produced_keys": ["forecast"],
  "artifacts": {
    "forecast": "stages/S3/forecast.md"
  },
  "error": null,
  "blocking_reason": null
}
```

### Example 3: S6B (Channel strategy + GTM) — Done with optional artifacts

```json
{
  "schema_version": 1,
  "run_id": "SFS-HEAD-20260213-1200",
  "stage": "S6B",
  "loop_spec_version": "1.0.0",
  "status": "Done",
  "timestamp": "2026-02-13T12:05:00Z",
  "produced_keys": ["channels", "seo", "outreach"],
  "artifacts": {
    "channels": "stages/S6B/channels.md",
    "seo": "stages/S6B/seo.md",
    "outreach": "stages/S6B/outreach.md"
  },
  "error": null,
  "blocking_reason": null
}
```

### Example 4: S4 (Baseline merge) — Blocked due to missing input

```json
{
  "schema_version": 1,
  "run_id": "SFS-HEAD-20260213-1200",
  "stage": "S4",
  "loop_spec_version": "1.0.0",
  "status": "Blocked",
  "timestamp": "2026-02-13T12:06:00Z",
  "produced_keys": [],
  "artifacts": {},
  "error": null,
  "blocking_reason": "Required input missing: S3 stage-result.json not found (forecast artifact required)"
}
```

### Example 5: S3 (Forecast) — Failed

```json
{
  "schema_version": 1,
  "run_id": "SFS-BRIK-20260213-1400",
  "stage": "S3",
  "loop_spec_version": "1.0.0",
  "status": "Failed",
  "timestamp": "2026-02-13T14:10:00Z",
  "produced_keys": [],
  "artifacts": {},
  "error": "lp-forecast failed: missing required input docs/business-os/startup-baselines/BRIK-offer.md",
  "blocking_reason": null
}
```

## 5) Control-Plane Consumption Contract

The single-writer control plane (LPSP-03B) reads stage-result files as follows:

1. **Discovery:** Scan `stages/*/stage-result.json` under the run directory.
2. **Validation:** For each file, verify schema_version, required fields, and status-specific constraints.
3. **Rejection:** If any required stage result is missing, malformed, or has `status=Failed|Blocked`, the control plane MUST NOT update the manifest. It records the blocking reason in `events.jsonl` and updates `state.json` to reflect the blocked stage.
4. **Progression:** If all required upstream results have `status=Done`, the control plane updates the manifest artifact pointers and advances the derived state.

**Malformed detection:** A stage-result file is malformed if:
- JSON parse fails.
- `schema_version` is missing or not `1`.
- `stage` is missing or not a valid stage ID.
- `status` is missing or not one of `Done|Failed|Blocked`.
- `status=Done` but `produced_keys` is empty or `artifacts` has no matching keys.

## 6) Relationship to Other Schemas

| Schema | Owner | Defined in |
|---|---|---|
| Stage result (this doc) | Stage workers (data plane) | This document |
| Baseline manifest | Control plane (LPSP-03B) | `manifest-schema.md` |
| Events ledger | Control plane (LPSP-04A) | `event-state-schema.md` |
| Derived run state | Control plane (LPSP-04A) | `event-state-schema.md` |
| Loop spec | Plan authority | `docs/business-os/startup-loop/loop-spec.yaml` |
