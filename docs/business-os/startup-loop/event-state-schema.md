---
Type: Reference
Status: Canonical
Domain: Business-OS
Last-reviewed: 2026-02-13
---

# Event Ledger + Derived Run State Schema

Canonical schemas for `events.jsonl` (append-only event ledger) and `state.json`
(deterministic derived state). Both are control-plane-owned, single-writer files.

**Decision reference:** `docs/plans/lp-skill-system-sequencing-plan.md` (LPSP-04A)

## 1) Purpose

The event ledger records every stage transition as an immutable, append-only log.
The derived state is a deterministic projection of the event ledger — replaying
events always produces the same state. This enables auditability, recovery, and
deterministic gate checks.

## 2) Event Schema (v1)

Each line in `events.jsonl` is a single JSON object:

```json
{
  "schema_version": 1,
  "event": "<enum: stage_started | stage_completed | stage_blocked>",
  "run_id": "<string: SFS-<BIZ>-<YYYYMMDD>-<hhmm>>",
  "stage": "<string: stage ID from loop-spec.yaml>",
  "timestamp": "<string: ISO 8601 UTC>",
  "loop_spec_version": "<string: spec_version from loop-spec.yaml>",
  "artifacts": "<object|null: { key: path } when event=stage_completed>",
  "blocking_reason": "<string|null: reason when event=stage_blocked>"
}
```

### Event types

| Event | Meaning | Required fields |
|---|---|---|
| `stage_started` | Stage execution began | `stage`, `timestamp` |
| `stage_completed` | Stage finished successfully | `stage`, `timestamp`, `artifacts` |
| `stage_blocked` | Stage cannot proceed | `stage`, `timestamp`, `blocking_reason` |

### Validation rules

1. `schema_version` must equal `1`.
2. `event` must be one of the three enumerated types.
3. `stage` must be a valid stage ID from the referenced `loop_spec_version`.
4. `stage_completed` requires non-null `artifacts` with at least one entry.
5. `stage_blocked` requires non-null `blocking_reason`.
6. Events must be append-only — existing lines must never be modified or deleted.

### Manual resume

An operator may manually resume a blocked or failed run by appending a `stage_started`
event for the target stage. The derivation function treats this as a valid transition
from Blocked/Failed → Active.

Example: resume S4 after it was blocked:
```json
{"schema_version":1,"event":"stage_started","run_id":"SFS-HEAD-20260213-1200","stage":"S4","timestamp":"2026-02-13T13:00:00Z","loop_spec_version":"1.0.0","artifacts":null,"blocking_reason":null}
```

## 3) Derived State Schema (v1)

The `state.json` file is deterministically derived from `events.jsonl`:

```json
{
  "schema_version": 1,
  "business": "<string: business key>",
  "run_id": "<string: SFS-<BIZ>-<YYYYMMDD>-<hhmm>>",
  "loop_spec_version": "<string>",
  "active_stage": "<string|null: stage ID of the most recently started stage>",
  "stages": {
    "<stage>": {
      "name": "<string: human-readable stage name from loop-spec>",
      "status": "<enum: Pending | Active | Done | Blocked>",
      "timestamp": "<string|null: ISO 8601 of last status change>",
      "artifacts": "<string[]|null: artifact paths when Done>",
      "blocking_reason": "<string|null: reason when Blocked>"
    }
  }
}
```

### Status transitions

```
Pending ──stage_started──▶ Active
Active  ──stage_completed──▶ Done
Active  ──stage_blocked──▶ Blocked
Blocked ──stage_started──▶ Active  (manual resume)
```

### Derivation algorithm

1. Initialize all stages from loop-spec as `Pending` with null fields.
2. Replay events in order. For each event:
   - `stage_started` → set stage status to `Active`, update `active_stage`.
   - `stage_completed` → set stage status to `Done`, record artifacts.
   - `stage_blocked` → set stage status to `Blocked`, record blocking_reason.
3. The `active_stage` is the stage from the most recent `stage_started` event.
4. Output is deterministic: same events → same state (keys sorted, timestamps preserved).

### Compatibility with `/lp-launch-qa`

The derived state is compatible with the existing `loop-state.json` contract:
- `active_stage` serves the same purpose as `currentStage`.
- `stages[stage].status` uses capitalized enum (`Done` vs `complete`) — launch-QA
  should accept both forms during migration.
- `stages[stage].artifacts` is an array of paths (same format launch-QA expects).
- `stages[stage].blocking_reason` replaces the `blockers` array (single reason vs list).

## 4) Stage Name Map

Derived from `loop-spec.yaml`:

| Stage ID | Name |
|---|---|
| S0 | Intake |
| S1 | Readiness |
| S1B | Measurement bootstrap |
| S2A | Historical baseline |
| S2 | Market intelligence |
| S2B | Offer design |
| S3 | Forecast |
| S6B | Channel strategy + GTM |
| S4 | Baseline merge |
| S5A | Prioritize |
| S5B | BOS sync |
| S6 | Site-upgrade synthesis |
| S7 | Fact-find |
| S8 | Plan |
| S9 | Build |
| S9B | QA gates |
| S10 | Weekly readout + experiments |

## 5) Relationship to Other Schemas

| Schema | Owner | Defined in |
|---|---|---|
| Event ledger + derived state (this doc) | Control plane (LPSP-04A) | This document |
| Stage result | Stage workers (data plane) | `stage-result-schema.md` |
| Baseline manifest | Control plane (LPSP-03B) | `manifest-schema.md` |
| Loop spec | Plan authority | `loop-spec.yaml` |
