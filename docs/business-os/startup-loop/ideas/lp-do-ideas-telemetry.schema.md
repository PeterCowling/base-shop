---
Type: Schema
Schema: lp-do-ideas-telemetry
Version: 1.6.0
Status: Active
Created: 2026-02-24
Owner: startup-loop maintainers
Related-contract: lp-do-ideas-trial-contract.md
Related-module: scripts/src/startup-loop/ideas/lp-do-ideas-trial-queue.ts
Related-module-2: scripts/src/startup-loop/ideas/lp-do-ideas-metrics-rollup.ts
Related-module-3: scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry.ts
Related-module-4: scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry-report.ts
Related-module-5: scripts/src/startup-loop/ideas/workflow-runtime-token-usage.ts
Related-artifacts:
  - docs/business-os/startup-loop/ideas/trial/telemetry.jsonl
  - docs/business-os/startup-loop/ideas/trial/queue-state.json
---

# lp-do-ideas Telemetry Schema

This document defines the telemetry record format, required fields, quality checks, and schema invariants for the `lp-do-ideas` trial queue and the downstream DO workflow telemetry stream. Queue-transition fields are enforced by `TrialQueue` in `lp-do-ideas-trial-queue.ts`. Downstream `workflow_step` fields are emitted by `lp-do-ideas-workflow-telemetry.ts`.

Codex runtime token usage is auto-captured when the recorder can resolve the current session via `CODEX_THREAD_ID`. Claude Code runtime usage can also be auto-captured when the recorder is given an explicit Claude session id (`CLAUDE_SESSION_ID` / `WORKFLOW_TELEMETRY_CLAUDE_SESSION_ID` or `--claude-session-id`). Without that explicit session seam, Claude remains on the existing manual/unknown fallback.

## 1. Queue Transition Telemetry Record (`TelemetryRecord`)

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

## 4A. Workflow Step Telemetry Record (`WorkflowStepTelemetryRecord`)

The same append-only telemetry JSONL stream may also contain downstream DO workflow records with:

```json
{ "record_type": "workflow_step", ... }
```

These records do not affect queue-transition metrics or ideas-cycle rollups. Existing ideas rollup code ignores them because they do not carry the required cycle snapshot fields. They are consumed by `lp-do-ideas-workflow-telemetry-report.ts`.

### Required fields

| Field | Type | Nullable | Description |
|---|---|---|---|
| `record_type` | `"workflow_step"` | No | Discriminator for downstream DO workflow telemetry. |
| `recorded_at` | ISO 8601 string | No | Timestamp when the telemetry line was written. |
| `telemetry_key` | string | No | Deterministic dedupe key for idempotent append behavior. |
| `mode` | `"trial"` \| `"live"` | No | Telemetry namespace mode. Defaults to `trial` for current DO flow usage. |
| `business` | string | No | Business identifier, or `REPO` for repo/process work. |
| `feature_slug` | string | No | Canonical `docs/plans/<feature-slug>/` slug. |
| `stage` | `lp-do-ideas` \| `lp-do-fact-find` \| `lp-do-analysis` \| `lp-do-plan` \| `lp-do-build` | No | Workflow stage being measured. |
| `artifact_path` | repo-relative path | Yes | Canonical artifact path when the stage persists one. |
| `artifact_exists` | boolean | No | Whether `artifact_path` existed at record time. |
| `artifact_bytes` | number | No | UTF-8 byte size of the persisted artifact, or `0` if absent. |
| `artifact_lines` | number | No | Line count of the persisted artifact, or `0` if absent. |
| `context_paths` | string[] | No | Repo-relative paths the recorder counted as stage context input (skill shell, modules, artifact, explicit input files). |
| `missing_context_paths` | string[] | No | Subset of `context_paths` that did not exist at record time. |
| `context_input_bytes` | number | No | Total UTF-8 byte size of existing `context_paths`. |
| `context_input_lines` | number | No | Total line count of existing `context_paths`. |
| `modules_loaded` | string[] | No | Stage-local modules intentionally loaded for this run. |
| `module_count` | number | No | Count of `modules_loaded`. |
| `deterministic_checks` | string[] | No | Deterministic commands/checks executed or required at this stage. |
| `deterministic_check_count` | number | No | Count of `deterministic_checks`. |
| `execution_track` | string | Yes | `code`, `business-artifact`, or `mixed` when known. |
| `deliverable_type` | string | Yes | Canonical downstream deliverable type when known. |
| `dispatch_ids` | string[] | No | Related ideas dispatch IDs when available. |
| `model_input_tokens` | number | Yes | Prompt/input token count when available from runtime telemetry or operator-supplied usage data. |
| `model_output_tokens` | number | Yes | Output token count when available from runtime telemetry or operator-supplied usage data. |
| `token_source` | `"api_usage"` \| `"operator_provided"` \| `"unknown"` | No | Provenance of token counts. |
| `runtime_usage_provider` | `"codex"` \| `"claude"` | Yes | Runtime provider used for automatic token capture when available. |
| `runtime_session_id` | string | Yes | Provider session/thread identifier used to resolve the runtime token snapshot. |
| `runtime_usage_mode` | `"delta_from_previous_feature_record"` \| `"last_response_fallback"` | Yes | How stage token counts were derived from runtime telemetry. |
| `runtime_usage_snapshot_at` | ISO 8601 string | Yes | Timestamp of the provider-side usage snapshot used for this record. |
| `runtime_total_input_tokens` | number | Yes | Cumulative provider-side input-token total at record time. Used as the baseline for the next feature-stage delta. |
| `runtime_total_output_tokens` | number | Yes | Cumulative provider-side output-token total at record time. Used as the baseline for the next feature-stage delta. |
| `per_module_bytes` | `Record<string, number>` | Yes | Per-module context byte sizes keyed by resolved repo-relative module path. `undefined` on legacy records (pre-1.5.0); empty `{}` when zero modules loaded; populated with module path → byte size when modules are present. |
| `deterministic_check_results` | `Record<string, CheckResultSummary>` | Yes | Per-check validator pass/fail summaries keyed by check name. Each value is `{ valid: boolean, error_count: number, warning_count: number }`. `undefined` on legacy records (pre-1.6.0); empty `{}` when no check results supplied; populated via `--check-result` CLI flag. |
| `notes` | string | Yes | Short operator/agent note for unusual telemetry conditions. |

### Field invariants

- `telemetry_key` is the dedupe authority for workflow-step lines.
- `context_input_bytes` and `context_input_lines` count only paths that existed at record time.
- `missing_context_paths.length` may be non-zero; this is a telemetry quality signal, not a hard error.
- `model_input_tokens` and `model_output_tokens` may remain null until true runtime token usage is available. The current contract supports progressive backfill.
- When `runtime_usage_mode = delta_from_previous_feature_record`, `model_input_tokens` and `model_output_tokens` are computed from the current cumulative runtime totals minus the prior workflow-step record for the same feature and runtime session.
- When `runtime_usage_mode = last_response_fallback`, the recorder could not find a prior feature baseline and falls back to the provider's latest-response usage snapshot.
- Claude automatic capture requires an explicit Claude session id. The recorder must not guess the active Claude session from ambient history or latest telemetry files.

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

## 8. Metrics Rollup Contract

`lp-do-ideas-metrics-rollup.ts` computes deterministic weekly/cycle metrics from reconciled cutover snapshots and queue state:

### Inputs

1. `cycle_snapshots` (per cycle+phase, source mode = `shadow` or `enforced`)
   - `cycle_id`
   - `phase`
   - `mode`
   - `root_event_ids[]` (preferred) or `root_event_count`
   - `candidate_count`
   - `admitted_cluster_count`
   - `suppression_reason_counts`
2. `queue_entries`
   - `dispatch_id`, `lane`, `queue_state`, `event_timestamp`, `processing_timestamp`

### Reconciliation rule (shadow vs enforced)

For each `(cycle_id, phase)` pair:
- If both `shadow` and `enforced` exist, `enforced` is selected as canonical.
- If only one exists, that snapshot is selected.
- Selected source is recorded in rollup provenance (`selected_mode`, `shadow_present`, `enforced_present`).

This prevents shadow + enforced double counting during cutover.

### Formula definitions

- `root_event_count`: sum of per-cycle root counts where each cycle count is:
  - unique size of `root_event_ids` when provided, else `root_event_count`.
- `fan_out_raw = candidate_count / root_event_count`
- `fan_out_admitted = admitted_cluster_count / root_event_count`
- `suppressed_by_loop_guards = Σ(same_origin_attach + anti_self_trigger + lineage_cap + cooldown + materiality)`
- `loop_incidence = suppressed_by_loop_guards / candidate_count`
- `queue_age_p95_days` (per lane): p95 age of `enqueued` items using `now - event_timestamp`
- `throughput = processed_dispatch_count / cycle_count`
- `lane_mix = DO_completed : IMPROVE_completed`

### Suppression grouping by invariant

Reason codes are grouped into invariant buckets:
- `same_origin_attach`: `duplicate_event`
- `anti_self_trigger`: `anti_self_trigger_non_material`
- `lineage_cap`: `lineage_depth_cap_exceeded`
- `cooldown`: `cooldown_non_material`
- `materiality`: `non_material_delta`
- `projection_immunity`: `projection_immunity`
- `policy_gate`: `unknown_artifact`, `inactive_artifact`, `trigger_policy_blocked`, `missing_registry_for_source_primary`, `pack_without_source_delta`

## 9. Threshold Alert Contract

Action records are emitted when threshold contracts are breached:

- `fan_out_admitted > 1.5` for 2 consecutive cycles
  - action: investigate clustering quality/boundaries
- `loop_incidence > 0.25` for 2 consecutive cycles
  - action: review invariants/materiality tuning
- `queue_age_p95_days > 21` in lane `DO` or `IMPROVE`
  - action: rebalance WIP caps or reduce admissions

Action records are deterministic and include:
- `action_id`
- `metric`
- `cycle_ids` (where applicable)
- `lane` (for queue age alerts)
- `observed_value`
- `threshold`
- `recommended_action`

## 10. Schema Versioning

This schema is at version `1.6.0`.

- `1.6.0` adds optional `deterministic_check_results` field to `workflow_step` records for per-check validator pass/fail summaries (`CheckResultSummary: { valid, error_count, warning_count }`). Report generator adds `## Validator Results` markdown section and `validator_summary` + `validator_record_count` to JSON envelope. CLI accepts `--check-result <name>:<pass|fail>:<errors>:<warnings>` repeatable flag. Check names from `--check-result` are auto-appended to `deterministic_checks` array.
- `1.5.0` adds optional `per_module_bytes` field to `workflow_step` records for per-module context byte tracking. Report generator JSON output wrapped in `{ summary, per_module_breakdown, per_module_record_count }` envelope (breaking change to JSON CLI contract; no automated consumers).
- `1.4.0` adds runtime token usage fields for automatic Codex/Claude session capture.
- `1.2.0` adds `workflow_step` records for downstream DO workflow telemetry in the shared append-only telemetry stream.
- `1.1.0` adds rollup/reconciliation formulas, invariant suppression grouping, and threshold action contract.
- Breaking changes require a major version bump and migration note.
- Non-breaking additions (new optional fields) require a minor version bump.
