---
Type: Reference
Status: Canonical
Domain: Business-OS
Last-reviewed: 2026-02-13
---

# Learning Ledger Schema

Canonical schema for `learning-ledger.jsonl` — the append-only, control-plane-owned
ledger that records all experiment outcomes and their impact on baseline priors.

**Decision reference:** `docs/plans/archive/learning-compiler-plan.md` (LC-01, DL-LC-05, DL-LC-07)

## 1) Purpose

The learning ledger provides a durable, immutable record of all S10 experiment outcomes.
Each entry represents a complete experiment readout, the priors it affected, and a pointer
to the specific prior deltas applied. The ledger supports deterministic replay, correction
via supersede semantics, and auditable lineage from experiment to baseline state.

## 2) Schema (v1)

Each line in `learning-ledger.jsonl` is a single JSON object:

```json
{
  "schema_version": 1,
  "entry_id": "<string: sha256(run_id + experiment_id + readout_digest)>",
  "run_id": "<string: SFS-<BIZ>-<YYYYMMDD>-<hhmm>>",
  "experiment_id": "<string: unique experiment identifier>",
  "readout_path": "<string: relative path to S10 readout artifact>",
  "readout_digest": "<string: sha256 of canonical digest payload>",
  "created_at": "<string: ISO 8601 UTC>",
  "verdict": "<enum: PASS | FAIL | INCONCLUSIVE>",
  "confidence": "<enum: HIGH | MEDIUM | LOW>",
  "affected_priors": "<string[]: list of prior_id values affected by this entry>",
  "prior_deltas_path": "<string: relative path to prior-delta artifact>",
  "supersedes_entry_id": "<string|null: entry_id of superseded entry if correction>"
}
```

### Field definitions

| Field | Type | Required | Description |
|---|---|---|---|
| `schema_version` | integer | yes | Always `1` for this version. |
| `entry_id` | string | yes | Deterministic dedup key: `sha256(run_id + experiment_id + readout_digest)`. |
| `run_id` | string | yes | Run identifier matching `SFS-<BIZ>-<YYYYMMDD>-<hhmm>`. |
| `experiment_id` | string | yes | Unique experiment identifier (scoped to business). |
| `readout_path` | string | yes | Path to S10 readout artifact (relative to business root). |
| `readout_digest` | string | yes | SHA-256 hash of canonical digest payload (see §4). |
| `created_at` | string | yes | ISO 8601 UTC timestamp when entry was created. |
| `verdict` | enum | yes | Experiment outcome: `PASS`, `FAIL`, or `INCONCLUSIVE`. |
| `confidence` | enum | yes | Outcome confidence: `HIGH`, `MEDIUM`, or `LOW`. |
| `affected_priors` | string[] | yes | List of prior IDs affected by this entry. |
| `prior_deltas_path` | string | yes | Path to prior-delta artifact (relative to business root). |
| `supersedes_entry_id` | string or null | yes | Entry ID of superseded entry when correcting prior outcome; null otherwise. |

### Validation rules

1. `schema_version` must equal `1`.
2. `entry_id` must be valid SHA-256 hex (64 characters).
3. `run_id` must match `SFS-<BIZ>-<YYYYMMDD>-<hhmm>` format.
4. `verdict` must be one of `PASS`, `FAIL`, `INCONCLUSIVE`.
5. `confidence` must be one of `HIGH`, `MEDIUM`, `LOW`.
6. `affected_priors` must be non-empty array.
7. `prior_deltas_path` must point to valid JSON artifact containing invertible deltas.
8. If `supersedes_entry_id` is non-null, it must reference an existing entry in the ledger.
9. Entries must be append-only — existing lines must never be modified or deleted.

## 3) Deterministic Identity

The `entry_id` is computed deterministically:

```typescript
entry_id = sha256(run_id + experiment_id + readout_digest)
```

This ensures:
- **Deduplication:** Identical readouts produce identical `entry_id`.
- **Idempotency:** Rerunning S10 with same digest does not create duplicate entries.
- **Correction support:** Corrected readouts produce new `entry_id` and reference superseded entry.

### Example computation

Given:
- `run_id = "SFS-HEAD-20260213-1200"`
- `experiment_id = "forecast_mrr_month3_test"`
- `readout_digest = "a3f5...c2e1"` (64-char SHA-256 hex)

Compute:
```
entry_id = sha256("SFS-HEAD-20260213-1200" + "forecast_mrr_month3_test" + "a3f5...c2e1")
         = "7b8e4f2a9c1d3e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f"
```

## 4) Readout Digest Normalization

The `readout_digest` is computed from a canonical `digest_payload` to ensure deterministic
identity across editorial changes.

### Included fields

Only compiler-consumed fields are included:
- `experiment_id`
- `verdict`
- `confidence`
- `prior_refs` (array of prior references)
- Metric values used in delta computation (e.g., `observed_value`, `threshold`)

### Excluded fields

Editorial and metadata fields are excluded:
- Prose narrative (e.g., `summary`, `interpretation`, `next_steps`)
- Timestamps (except `readout_digest` is stable across reprints)
- Author/reviewer metadata
- Formatting-only changes (whitespace, markdown style)

### Canonicalization algorithm

1. Extract included fields from readout artifact.
2. Serialize to JSON with sorted keys (alphabetical).
3. Remove all whitespace (newlines, spaces, tabs).
4. Compute SHA-256 hash of resulting byte string.

### Example

Readout artifact (partial):
```json
{
  "experiment_id": "forecast_mrr_month3_test",
  "verdict": "PASS",
  "confidence": "HIGH",
  "prior_refs": ["forecast#forecast.target.mrr_month3"],
  "observed_value": 4200,
  "summary": "Exceeded month 3 MRR target by 5%"
}
```

Digest payload (canonical):
```json
{"confidence":"HIGH","experiment_id":"forecast_mrr_month3_test","observed_value":4200,"prior_refs":["forecast#forecast.target.mrr_month3"],"verdict":"PASS"}
```

Digest:
```
readout_digest = sha256('{"confidence":"HIGH","experiment_id":"forecast_mrr_month3_test","observed_value":4200,"prior_refs":["forecast#forecast.target.mrr_month3"],"verdict":"PASS"}')
               = "a3f5...c2e1"
```

## 5) Supersede Semantics

When an operator corrects a prior experiment outcome, the new entry must reference the
superseded entry via `supersedes_entry_id`. The learning compiler enforces **replacement
consistency**: the resulting baseline must equal "base + new_deltas" (not "base + old_deltas + new_deltas").

### Supersede algorithm

1. **Append new entry:** Write new entry with `supersedes_entry_id = <old_entry_id>`.
2. **Load superseded deltas:** Read prior deltas from `old_entry.prior_deltas_path`.
3. **Invert superseded deltas:** Compute inverse deltas (swap `old` ↔ `new` confidence values).
4. **Apply inverse deltas:** Update baseline priors by applying inverse deltas (undo old outcome).
5. **Apply new deltas:** Update baseline priors by applying new deltas from current entry.
6. **Write snapshot:** Write immutable baseline snapshot with final state.
7. **Update manifest:** Set `next_seed` pointers to new snapshot.

### Worked example: Replacement-consistent supersede

#### Initial state

Baseline prior:
```json
{
  "id": "forecast.target.mrr_month3",
  "type": "target",
  "statement": "Month 3 MRR target is $4000",
  "confidence": 0.6,
  "value": 4000,
  "unit": "USD"
}
```

#### Entry A: PASS/HIGH (incorrect)

Experiment readout claims PASS (observed $4200).

Delta A:
```json
{
  "artifact_path": "docs/business-os/startup-baselines/HEAD-forecast-seed.user.md",
  "prior_id": "forecast.target.mrr_month3",
  "old_confidence": 0.6,
  "new_confidence": 0.8,
  "reason": "Month 3 MRR exceeded target",
  "evidence_ref": "docs/business-os/strategy/HEAD/2026-02-13-forecast-readout.md"
}
```

Baseline after applying Delta A:
```json
{
  "id": "forecast.target.mrr_month3",
  "confidence": 0.8,
  ...
}
```

#### Entry B: Supersedes Entry A with FAIL/HIGH (corrected)

Operator discovers data error — actual observed MRR was $3500 (FAIL, not PASS).

Delta B (new):
```json
{
  "artifact_path": "docs/business-os/startup-baselines/HEAD-forecast-seed.user.md",
  "prior_id": "forecast.target.mrr_month3",
  "old_confidence": 0.6,
  "new_confidence": 0.3,
  "reason": "Month 3 MRR missed target (corrected)",
  "evidence_ref": "docs/business-os/strategy/HEAD/2026-02-15-forecast-correction.md"
}
```

#### Supersede compilation steps

1. **Invert Delta A:**
   ```json
   {
     "prior_id": "forecast.target.mrr_month3",
     "old_confidence": 0.8,
     "new_confidence": 0.6
   }
   ```

2. **Apply inverse:** `0.8 → 0.6` (undo Entry A).

3. **Apply Delta B:** `0.6 → 0.3` (apply Entry B).

4. **Final baseline:**
   ```json
   {
     "id": "forecast.target.mrr_month3",
     "confidence": 0.3,
     ...
   }
   ```

#### Verification: Replacement consistency

- **Without supersede (incorrect):** `0.6 → 0.8 → 0.3` = `0.3` (but ledger shows conflicting evidence).
- **With supersede (correct):** `0.6 → 0.3` (ledger effective view matches baseline).

Ledger query with `view=effective` returns only Entry B; Entry A is marked superseded
and excluded from effective view.

## 6) Effective View Query

The ledger supports two query modes:

| View | Description | Use case |
|---|---|---|
| `all` | Returns all entries (including superseded) | Audit trail, debugging |
| `effective` | Returns only non-superseded entries | Baseline replay, current state |

### Example ledger with supersede

```jsonl
{"schema_version":1,"entry_id":"abc123...","run_id":"SFS-HEAD-20260213-1200","experiment_id":"exp1","verdict":"PASS","confidence":"HIGH","affected_priors":["prior1"],"prior_deltas_path":"deltas/abc123.json","supersedes_entry_id":null,...}
{"schema_version":1,"entry_id":"def456...","run_id":"SFS-HEAD-20260215-1400","experiment_id":"exp1","verdict":"FAIL","confidence":"HIGH","affected_priors":["prior1"],"prior_deltas_path":"deltas/def456.json","supersedes_entry_id":"abc123...",...}
```

Query results:
- `view=all`: Returns both entries (abc123, def456).
- `view=effective`: Returns only def456 (abc123 is superseded).

## 7) Examples

### Example 1: First experiment outcome (no supersede)

```json
{
  "schema_version": 1,
  "entry_id": "7b8e4f2a9c1d3e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f",
  "run_id": "SFS-HEAD-20260213-1200",
  "experiment_id": "forecast_mrr_month3_test",
  "readout_path": "docs/business-os/strategy/HEAD/2026-02-13-forecast-readout.md",
  "readout_digest": "a3f5e8d4b2c1f7e9a6b3d8c2e5f1a4b7c9d0e6f2a8b5c3d7e1f4a9b6c8d2e5f0",
  "created_at": "2026-02-13T15:30:00Z",
  "verdict": "PASS",
  "confidence": "HIGH",
  "affected_priors": ["forecast.target.mrr_month3"],
  "prior_deltas_path": "docs/business-os/startup-baselines/HEAD/deltas/7b8e4f2a.json",
  "supersedes_entry_id": null
}
```

### Example 2: Corrected outcome (supersedes prior entry)

```json
{
  "schema_version": 1,
  "entry_id": "9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1",
  "run_id": "SFS-HEAD-20260215-1400",
  "experiment_id": "forecast_mrr_month3_test",
  "readout_path": "docs/business-os/strategy/HEAD/2026-02-15-forecast-correction.md",
  "readout_digest": "b4c6f9e1a7d2b8c3e5f0a9b2d7c1e4f8a3b6d9c0e2f5a1b8c4d7e9f0a6b3c5d8",
  "created_at": "2026-02-15T10:00:00Z",
  "verdict": "FAIL",
  "confidence": "HIGH",
  "affected_priors": ["forecast.target.mrr_month3"],
  "prior_deltas_path": "docs/business-os/startup-baselines/HEAD/deltas/9f1a2b3c.json",
  "supersedes_entry_id": "7b8e4f2a9c1d3e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f"
}
```

## 8) Relationship to Other Schemas

| Schema | Owner | Defined in |
|---|---|---|
| Learning ledger (this doc) | Control plane (LC-01, LC-02) | This document |
| Baseline prior schema | Control plane (LC-01, LC-03) | `baseline-prior-schema.md` |
| Baseline manifest | Control plane (LPSP-03B) | `manifest-schema.md` |
| Event ledger + derived state | Control plane (LPSP-04A) | `event-state-schema.md` |
| Stage result | Stage workers (data plane) | `stage-result-schema.md` |
