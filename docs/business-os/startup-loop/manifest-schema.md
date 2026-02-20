---
Type: Reference
Status: Canonical
Domain: Business-OS
Last-reviewed: 2026-02-13
---

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
  },
  "baseline_pointers": {
    "current": {
      "<artifact_key>": "<string: relative path to current baseline snapshot>"
    },
    "stage_candidate": {
      "<artifact_key>": "<string: relative path to stage-local candidate>"
    },
    "next_seed": {
      "<artifact_key>": "<string: relative path to learning-updated snapshot>"
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
| `baseline_pointers` | object | yes | Pointer classes tracking baseline artifact lifecycle (see §3A). |

### Validation rules

1. `schema_version` must equal `1`.
2. `run_id` must match `SFS-<BIZ>-<YYYYMMDD>-<hhmm>` format.
3. `status` must be `candidate` or `current`.
4. Every key in `artifacts` must have a corresponding entry in `stage_completions` (by stage prefix).
5. Every entry in `stage_completions` with `status=Done` must have non-empty `produced_keys`.
6. All paths in `artifacts` must be relative (no leading `/`).

## 3) Manifest Lifecycle

### 3A) Baseline Pointer Classes

The `baseline_pointers` field tracks three pointer classes for baseline artifacts:

| Pointer class | Description | Writer | Stage |
|---|---|---|---|
| `current` | Baseline snapshot set used to seed the current run | DISCOVERY, S4 | DISCOVERY promotes from previous `next_seed`; S4 writes run-authoritative merge |
| `stage_candidate` | Stage-local outputs before S4 merge | S2B, S3, S6B | Updated during stage completion |
| `next_seed` | Learning-updated snapshots for next run | S10 | Written by learning compiler after experiment outcomes |

**Lifecycle timeline:**

1. **Run start (DISCOVERY):** Initialize `current` from previous run `next_seed`.
   - If no previous run, `current` points to canonical HEAD baseline artifacts.
   - `stage_candidate` and `next_seed` are empty.

2. **During run (S2B/S3/S6B):** Stages update `stage_candidate` only.
   - S2B writes `stage_candidate.offer`.
   - S3 writes `stage_candidate.forecast`.
   - S6B writes `stage_candidate.channels`, `stage_candidate.seo`, `stage_candidate.outreach`.
   - `current` and `next_seed` remain unchanged.

3. **S4 merge:** Set run-authoritative merged baseline as `current`.
   - S4 reads `stage_candidate` outputs and `current` seed inputs.
   - S4 writes merged output to `current` (e.g., `current.offer`, `current.forecast`, `current.channels`).
   - `stage_candidate` may be cleared or left for audit (implementation choice).
   - `next_seed` remains unchanged (still points to previous run learning output).

4. **S10 learning:** Write immutable learning-updated snapshots; set `next_seed` pointers.
   - S10 reads `current` baseline set.
   - S10 learning compiler applies prior deltas and writes new immutable snapshots.
   - S10 updates `next_seed` to point to new snapshots.
   - `current` remains unchanged (preserves current-run baseline integrity).

5. **Next run (DISCOVERY):** Loader promotes previous `next_seed` to new run `current`.
   - New manifest created with `current` = previous manifest `next_seed`.
   - Previous manifest remains immutable with `status: current`.

**Single-writer responsibility:**

- **S2B, S3, S6B:** Write `stage_candidate` only.
- **S4:** Writes `current` only (from `stage_candidate` + seed `current`).
- **S10:** Writes `next_seed` only (from current-run `current` + prior deltas).
- **DISCOVERY:** Copies previous `next_seed` to new run `current` (read-only operation on previous manifest).

### 3B) Status Lifecycle

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
  },
  "baseline_pointers": {
    "current": {
      "offer": "baseline-snapshots/HEAD-offer-20260213-1200.md",
      "forecast": "baseline-snapshots/HEAD-forecast-20260213-1200.md",
      "channels": "baseline-snapshots/HEAD-channels-20260213-1200.md"
    },
    "stage_candidate": {
      "offer": "stages/S2B/offer.md",
      "forecast": "stages/S3/forecast.md",
      "channels": "stages/S6B/channels.md"
    },
    "next_seed": {
      "offer": "baseline-snapshots/HEAD-offer-20260206-1030-learning.md",
      "forecast": "baseline-snapshots/HEAD-forecast-20260206-1030-learning.md",
      "channels": "baseline-snapshots/HEAD-channels-20260206-1030-learning.md"
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
  },
  "baseline_pointers": {
    "current": {
      "offer": "baseline-snapshots/HEAD-offer-20260213-1200.md",
      "forecast": "baseline-snapshots/HEAD-forecast-20260213-1200.md",
      "channels": "baseline-snapshots/HEAD-channels-20260213-1200.md"
    },
    "stage_candidate": {},
    "next_seed": {
      "offer": "baseline-snapshots/HEAD-offer-20260206-1030-learning.md",
      "forecast": "baseline-snapshots/HEAD-forecast-20260206-1030-learning.md",
      "channels": "baseline-snapshots/HEAD-channels-20260206-1030-learning.md"
    }
  }
}
```

### Example 3: After S10 learning update

After S10 completes experiment readouts and learning compilation, `next_seed` is updated:

```json
{
  "schema_version": 1,
  "run_id": "SFS-HEAD-20260213-1200",
  "business": "HEAD",
  "loop_spec_version": "1.0.0",
  "status": "current",
  "created_at": "2026-02-13T12:06:00Z",
  "updated_at": "2026-02-13T15:45:00Z",
  "artifacts": {
    "S2B/offer": "stages/S2B/offer.md",
    "S3/forecast": "stages/S3/forecast.md",
    "S6B/channels": "stages/S6B/channels.md",
    "S6B/outreach": "stages/S6B/outreach.md",
    "S6B/seo": "stages/S6B/seo.md",
    "S10/weekly_readout": "stages/S10/weekly-readout-2026-02-13.md"
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
    },
    "S10": {
      "status": "Done",
      "timestamp": "2026-02-13T15:45:00Z",
      "produced_keys": ["weekly_readout"]
    }
  },
  "baseline_pointers": {
    "current": {
      "offer": "baseline-snapshots/HEAD-offer-20260213-1200.md",
      "forecast": "baseline-snapshots/HEAD-forecast-20260213-1200.md",
      "channels": "baseline-snapshots/HEAD-channels-20260213-1200.md"
    },
    "stage_candidate": {},
    "next_seed": {
      "offer": "baseline-snapshots/HEAD-offer-7b8e4f2a.md",
      "forecast": "baseline-snapshots/HEAD-forecast-7b8e4f2a.md",
      "channels": "baseline-snapshots/HEAD-channels-20260213-1200.md"
    }
  }
}
```

Note: `next_seed.offer` and `next_seed.forecast` now point to learning-updated snapshots
(deterministic snapshot path includes `entry_id` prefix). `channels` unchanged (no experiments
affected channel priors in this run).

## 6) Relationship to Other Schemas

| Schema | Owner | Defined in |
|---|---|---|
| Baseline manifest (this doc) | Control plane (LPSP-03B, LC-01) | This document |
| Stage result | Stage workers (data plane) | `stage-result-schema.md` |
| Event ledger + derived state | Control plane (LPSP-04A) | `event-state-schema.md` |
| Learning ledger | Control plane (LC-01, LC-02) | `learning-ledger-schema.md` |
| Baseline prior schema | Control plane (LC-01, LC-03) | `baseline-prior-schema.md` |
| Loop spec | Plan authority | `loop-spec.yaml` |
