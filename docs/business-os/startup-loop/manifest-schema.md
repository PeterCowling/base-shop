# Baseline Manifest Schema

Canonical schema for `baseline.manifest.json` — the control-plane-owned pointer file
that tracks artifact locations and run progression.

**Decision reference:** `docs/plans/lp-skill-system-sequencing-plan.md` (DL-02, LPSP-03B)

## 1) Purpose

The baseline manifest is the single source of truth for which artifacts exist in a run
and whether the run's baseline has been committed as current. Only the single-writer
control plane may create or update this file.

## 2) Schema (v1)

```json
{
  "schema_version": 1,
  "run_id": "<string: SFS-<BIZ>-<YYYYMMDD>-<hhmm>>",
  "business": "<string: business key>",
  "loop_spec_version": "<string: spec_version from loop-spec.yaml>",
  "status": "<enum: candidate | current>",
  "created_at": "<string: ISO 8601 UTC>",
  "updated_at": "<string: ISO 8601 UTC>",
  "artifacts": {
    "<stage>/<artifact_key>": "<string: relative path from run root>"
  },
  "stage_completions": {
    "<stage>": {
      "status": "<enum: Done | Failed | Blocked>",
      "timestamp": "<string: ISO 8601 UTC>",
      "produced_keys": ["<string: artifact key>"]
    }
  }
}
```

### Field definitions

| Field | Type | Required | Description |
|---|---|---|---|
| `schema_version` | integer | yes | Always `1` for this version. |
| `run_id` | string | yes | Stable run identifier matching `SFS-<BIZ>-<YYYYMMDD>-<hhmm>`. |
| `business` | string | yes | Business key (e.g., `BRIK`, `HEAD`, `PET`). |
| `loop_spec_version` | string | yes | Version of the loop spec this manifest was built against. |
| `status` | enum | yes | `candidate` = S4 has merged but S5B has not committed. `current` = S5B has committed the pointer. |
| `created_at` | string | yes | ISO 8601 UTC — when the manifest was first created (by S4). |
| `updated_at` | string | yes | ISO 8601 UTC — when the manifest was last updated. |
| `artifacts` | object | yes | Map of `<stage>/<artifact_key>` to relative path from run root. |
| `stage_completions` | object | yes | Map of stage ID to completion summary (status, timestamp, produced_keys). |

### Validation rules

1. `schema_version` must equal `1`.
2. `run_id` must match `SFS-<BIZ>-<YYYYMMDD>-<hhmm>` format.
3. `status` must be `candidate` or `current`.
4. Every key in `artifacts` must have a corresponding entry in `stage_completions` (by stage prefix).
5. Every entry in `stage_completions` with `status=Done` must have non-empty `produced_keys`.
6. All paths in `artifacts` must be relative (no leading `/`).

## 3) Status Lifecycle

```
(empty) ──S4──▶ candidate ──S5B──▶ current
```

- **S4 `/lp-baseline-merge`** creates the manifest with `status: candidate` after joining S3/S6B outputs.
- **S5B `/lp-bos-sync`** promotes `status: candidate → current` after persisting cards and stage-docs to D1.
- A manifest at `current` is immutable for the run. New runs create new manifests.

## 4) Single-Writer Update Contract

The control plane updates the manifest via a deterministic function:

1. **Discovery:** Scan `stages/*/stage-result.json` under the run directory.
2. **Validation:** For each discovered file, validate against the stage-result schema (v1).
3. **Gate check:** All required upstream stage results must have `status: Done`.
   - Required stages for S4 barrier: `S2B` (offer), `S3` (forecast), `S6B` (channels).
   - If any required result is missing, malformed, or `Failed`/`Blocked`, the update is rejected.
4. **Artifact collection:** Collect artifact pointers from all `Done` stage results.
5. **Manifest write:** Write `baseline.manifest.json` with collected artifacts and stage completions.
6. **Idempotency:** Given identical stage-result inputs, the function produces an identical manifest
   (excluding `updated_at`, which reflects wall-clock time; content hash is stable).

### Rejection behavior

When the update is rejected, the function returns a structured error:

```json
{
  "success": false,
  "reason": "<string: human-readable rejection reason>",
  "missing_stages": ["<stage ID>"],
  "failed_stages": ["<stage ID>"],
  "blocked_stages": ["<stage ID>"],
  "malformed_stages": ["<stage ID>"]
}
```

### Idempotency guarantee

The manifest content (excluding `updated_at`) is deterministic:
- Artifact keys are sorted alphabetically.
- Stage completion entries are sorted by stage ID.
- JSON is serialized with 2-space indentation and sorted keys.

Two invocations with identical stage-result files produce byte-identical manifests
(when `updated_at` is held constant or excluded from comparison).

## 5) Examples

### Example 1: Candidate manifest after S4 merge

```json
{
  "schema_version": 1,
  "run_id": "SFS-HEAD-20260213-1200",
  "business": "HEAD",
  "loop_spec_version": "1.0.0",
  "status": "candidate",
  "created_at": "2026-02-13T12:06:00Z",
  "updated_at": "2026-02-13T12:06:00Z",
  "artifacts": {
    "S2B/offer": "stages/S2B/offer.md",
    "S3/forecast": "stages/S3/forecast.md",
    "S6B/channels": "stages/S6B/channels.md",
    "S6B/outreach": "stages/S6B/outreach.md",
    "S6B/seo": "stages/S6B/seo.md"
  },
  "stage_completions": {
    "S2B": {
      "status": "Done",
      "timestamp": "2026-02-13T12:02:00Z",
      "produced_keys": ["offer"]
    },
    "S3": {
      "status": "Done",
      "timestamp": "2026-02-13T12:04:00Z",
      "produced_keys": ["forecast"]
    },
    "S6B": {
      "status": "Done",
      "timestamp": "2026-02-13T12:05:00Z",
      "produced_keys": ["channels", "seo", "outreach"]
    }
  }
}
```

### Example 2: Current manifest after S5B commit

```json
{
  "schema_version": 1,
  "run_id": "SFS-HEAD-20260213-1200",
  "business": "HEAD",
  "loop_spec_version": "1.0.0",
  "status": "current",
  "created_at": "2026-02-13T12:06:00Z",
  "updated_at": "2026-02-13T12:15:00Z",
  "artifacts": {
    "S2B/offer": "stages/S2B/offer.md",
    "S3/forecast": "stages/S3/forecast.md",
    "S6B/channels": "stages/S6B/channels.md",
    "S6B/outreach": "stages/S6B/outreach.md",
    "S6B/seo": "stages/S6B/seo.md"
  },
  "stage_completions": {
    "S2B": {
      "status": "Done",
      "timestamp": "2026-02-13T12:02:00Z",
      "produced_keys": ["offer"]
    },
    "S3": {
      "status": "Done",
      "timestamp": "2026-02-13T12:04:00Z",
      "produced_keys": ["forecast"]
    },
    "S6B": {
      "status": "Done",
      "timestamp": "2026-02-13T12:05:00Z",
      "produced_keys": ["channels", "seo", "outreach"]
    }
  }
}
```

## 6) Relationship to Other Schemas

| Schema | Owner | Defined in |
|---|---|---|
| Baseline manifest (this doc) | Control plane (LPSP-03B) | This document |
| Stage result | Stage workers (data plane) | `stage-result-schema.md` |
| Events ledger | Control plane (LPSP-04A) | To be defined in LPSP-04A |
| Derived run state | Control plane (LPSP-04A) | To be defined in LPSP-04A |
| Loop spec | Plan authority | `loop-spec.yaml` |
