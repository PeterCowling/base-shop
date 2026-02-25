---
Type: Schema
Schema: lp-do-ideas-telemetry
Version: 1.0.0
Status: Active
Created: 2026-02-24
Owner: startup-loop maintainers
Related-contract: lp-do-ideas-trial-contract.md
Related-module: scripts/src/startup-loop/lp-do-ideas-trial-queue.ts
Related-artifacts:
  - docs/business-os/startup-loop/ideas/trial/telemetry.jsonl
  - docs/business-os/startup-loop/ideas/trial/queue-state.json
---

# lp-do-ideas Telemetry Schema

This document defines the telemetry record format, required fields, quality checks, and schema invariants for the `lp-do-ideas` trial queue. All fields are enforced by `TrialQueue` in `lp-do-ideas-trial-queue.ts`.

## 1. Telemetry Record (`TelemetryRecord`)

One record is appended to the telemetry log per state transition. The log is append-only and never mutated after writing.

### Required fields

| Field | Type | Nullable | Description |
|---|---|---|---|
| `recorded_at` | ISO 8601 string | No | Timestamp when this telemetry record was written (uses processing clock). |
| `dispatch_id` | string (non-empty) | No | The `dispatch_id` this record pertains to. Synthetic ID used when packet is rejected before `dispatch_id` can be parsed. |
| `kind` | `TelemetryEventKind` | No | The event kind (see Section 2). |
| `queue_state` | `QueueState` | No | Queue state after this transition. One of `enqueued`, `processed`, `skipped`, `error`. |
| `reason` | string | Yes | Human-readable reason or diagnostic for the transition. Null for normal enqueue events. |
| `event_timestamp` | ISO 8601 string | Yes | Timestamp from `packet.created_at` (event clock). Null when the packet was rejected before `created_at` could be read. |
| `processing_timestamp` | ISO 8601 string | No | Timestamp when the queue processed this transition (processing clock). |

### Field invariants

- `recorded_at` must equal `processing_timestamp` within the same record (both derived from the same clock call).
- `event_timestamp` precedes or equals `processing_timestamp` for packets created before processing (normal case). Skew in the other direction is possible and must not be treated as an error.
- `dispatch_id` must not be empty. For validation-failed packets without a parseable `dispatch_id`, a synthetic ID in the format `REJECTED-<ISO8601>` is used.

## 2. Telemetry Event Kinds (`TelemetryEventKind`)

| Kind | Trigger | Resulting `queue_state` |
|---|---|---|
| `enqueued` | New valid packet accepted into the queue | `enqueued` |
| `advanced_to_processed` | `advance(id, "processed")` called by operator confirmation | `processed` |
| `advanced_to_error` | `advance(id, "error")` called (downstream failure or post-enqueue validation) | `error` |
| `skipped_duplicate_dispatch_id` | `enqueue()` called with a `dispatch_id` already in the queue | `skipped` |
| `skipped_duplicate_dedupe_key` | `enqueue()` called with a different `dispatch_id` but same `(artifact_id, before_sha, after_sha)` tuple | `skipped` |
| `validation_rejected` | `enqueue()` called with a packet that fails schema validation | `error` |

## 3. Queue State Machine

```
enqueued ──────────────────────────────────────────► processed (terminal)
         │                                                  │
         ▼                                                  │
        error (terminal after no skipped path)              │
         │                                                  │
         └─────────────────────────────────────────────────►
                  any state → skipped (idempotency)
skipped ── (terminal; no further transitions permitted) ─────►
```

State machine rules:
- `enqueued` → `processed`: operator confirmation
- `enqueued` → `error`: downstream invocation failure or post-enqueue validation failure
- `enqueued` → `skipped`: duplicate detected during `advance()` (rare; normally caught at `enqueue()`)
- `processed` → `skipped`: idempotency guard (e.g. replay after operator confirmation)
- `error` → `skipped`: idempotency guard
- `skipped` is fully terminal — no transitions out of `skipped` are permitted
- All backward transitions are rejected (monotonic enforcement)

## 4. Telemetry Aggregates (`TelemetryAggregates`)

Aggregates are computed on demand from the telemetry log and entry map. No separate aggregate file is written.

| Field | Type | Description |
|---|---|---|
| `dispatch_count` | number | Total telemetry records written (one per transition/attempt). Not equal to unique dispatches if duplicates or retries are present. |
| `duplicate_suppression_count` | number | Count of records with kind `skipped_duplicate_dispatch_id` or `skipped_duplicate_dedupe_key`. |
| `route_accuracy_denominator` | number | Count of entries currently in `enqueued` or `processed` state. Denominator for dispatch precision measurement. |
| `processed_count` | number | Count of entries in `processed` state. |
| `enqueued_count` | number | Count of entries in `enqueued` state. |
| `error_count` | number | Count of entries in `error` state. |
| `skipped_count` | number | Count of entries in `skipped` state. |

### Route accuracy metric

Dispatch precision (correct route: `lp-do-fact-find` vs `lp-do-briefing`) is measured by operators during trial review:

```
route_accuracy = (correctly_routed_dispatches / route_accuracy_denominator) × 100%
```

The `route_accuracy_denominator` excludes error and skipped entries as they do not constitute routed dispatches.

## 5. Deduplication Key

The deduplication key is derived from the dispatch packet as:

```
dedupe_key = "<artifact_id>:<before_sha|"null">:<after_sha>"
```

Where `before_sha` is the literal string `"null"` when the field is `null` (first registration).

This mirrors `buildDedupeKey()` in `lp-do-ideas-trial.ts`. Both functions must produce identical output for the same inputs.

## 6. Quality Checks

The following checks must pass for a telemetry log to be considered valid:

| Check | Rule |
|---|---|
| QC-01: No empty dispatch_id | Every record must have a non-empty `dispatch_id`. |
| QC-02: Valid queue_state | Every record's `queue_state` must be one of `enqueued`, `processed`, `skipped`, `error`. |
| QC-03: Valid kind | Every record's `kind` must be a recognised `TelemetryEventKind`. |
| QC-04: Timestamps present | `recorded_at` and `processing_timestamp` must be non-empty ISO 8601 strings. |
| QC-05: Monotonic state per dispatch | For a given `dispatch_id`, the sequence of `queue_state` values in the telemetry log must be a valid path in the state machine (no backward transitions in the log). |
| QC-06: Duplicate suppression count consistency | `duplicate_suppression_count` must equal the count of records with kind `skipped_duplicate_dispatch_id` or `skipped_duplicate_dedupe_key`. |
| QC-07: No entry created for validation failures | Records with `kind=validation_rejected` must not correspond to a `dispatch_id` present in the queue entry map. |
| QC-08: Single canonical entry per dedupe key | At most one non-skipped entry in the queue entry map per unique `dedupe_key`. |

## 7. Persistence Contract

Trial-mode writes are restricted to paths defined in Section 6 of `lp-do-ideas-trial-contract.md`:

| Artifact | Path |
|---|---|
| Telemetry log | `docs/business-os/startup-loop/ideas/trial/telemetry.jsonl` |
| Queue state snapshot | `docs/business-os/startup-loop/ideas/trial/queue-state.json` |

The `TrialQueue` class itself performs no file I/O. The CLI layer is responsible for serialising `getTelemetry()` and `listEntries()` to these paths after each operation.

The telemetry JSONL file is append-only. The queue state JSON file is overwritten on each update and represents the current snapshot.

## 8. Schema Versioning

This schema is at version `1.0.0`. Breaking changes require a version bump and a migration note in this document. Non-breaking additions (new optional fields) require a minor version bump only.
