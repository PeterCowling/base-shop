---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: Platform
Workstream: Engineering
Created: "2026-03-12"
Last-updated: "2026-03-12"
Feature-Slug: do-workflow-realtime-monitoring
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/do-workflow-realtime-monitoring/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260312075840-C002
Trigger-Why: Right now, if work gets stuck in the queue or errors start piling up, nobody knows until someone manually runs a report. This means problems can sit unnoticed for hours or days. Live monitoring would flag issues as they happen, so they get fixed before they snowball.
Trigger-Intended-Outcome: "type: operational | statement: Workflow queue health is continuously monitored with automatic alerts when thresholds are breached. | source: operator"
---

# Real-Time Workflow Queue Monitoring Fact-Find Brief

## Scope

### Summary

The startup-loop workflow queue has batch-computed metrics, defined alert thresholds, and consecutive-breach detection logic — but all of it runs offline on manual invocation. There is no mechanism to evaluate queue health continuously or notify the operator when thresholds breach. This fact-find investigates what infrastructure exists, what's missing, and what a minimal real-time monitoring layer would need.

### Goals

- Map the existing telemetry, metrics, and alert infrastructure
- Identify the minimum viable monitoring surface (what to check, how often, how to alert)
- Determine whether the existing threshold/alert logic can be reused or needs extension
- Assess feasibility of a lightweight CLI-based health check that can run on a cron

### Non-goals

- Building a live dashboard or UI
- Real-time WebSocket/SSE event streaming
- Auto-remediation or auto-scaling of WIP caps
- Monitoring of external services (only internal queue and telemetry)

### Constraints & Assumptions

- Constraints:
  - Platform runs locally / in CI — no persistent server process available for continuous monitoring
  - Alert delivery must be lightweight (console output, file-based, or existing MCP tool integration)
  - Must not mutate queue state or telemetry as a side effect of monitoring. Health check results may be written to a separate, dedicated output file (not the source data files).
- Assumptions:
  - A cron-scheduled CLI check (e.g. every 10-30 minutes) is sufficient for "real-time" monitoring at the current workflow volume
  - Existing `lp-do-ideas-metrics-rollup.ts` threshold logic is correct and reusable

## Outcome Contract

- **Why:** Right now, if work gets stuck in the queue or errors start piling up, nobody knows until someone manually runs a report. This means problems can sit unnoticed for hours or days. Live monitoring would flag issues as they happen, so they get fixed before they snowball.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Workflow queue health is continuously monitored with automatic alerts when thresholds are breached.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `scripts/src/startup-loop/ideas/lp-do-ideas-metrics-rollup.ts` — batch metrics computation with 3 alert thresholds (fan_out, loop_incidence, queue_age_p95)
- `scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry.ts` — append-only telemetry recording and summarization (718 lines)
- `scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry-report.ts` — CLI report generator supporting markdown/JSON output (126 lines)
- `scripts/src/startup-loop/ideas/workflow-runtime-token-usage.ts` — runtime token capture with hybrid cascade (745 lines)

### Key Modules / Files

1. `scripts/src/startup-loop/ideas/lp-do-ideas-metrics-rollup.ts` (494 lines) — owns cycle reconciliation, 7 metrics (fan_out_raw, fan_out_admitted, loop_incidence, queue_age_p95_days, throughput, lane_mix, suppression_by_invariant), and alert emission logic
2. `scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry.ts` (718 lines) — owns `buildWorkflowStepTelemetryRecord()`, `appendWorkflowStepTelemetry()`, `readWorkflowStepTelemetry()`, `summarizeWorkflowStepTelemetry()`
3. `scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry-report.ts` (126 lines) — CLI wrapper for report generation
4. `scripts/src/startup-loop/ideas/lp-do-ideas-metrics-runner.ts` (265 lines) — already reads queue-state.json + telemetry.jsonl from disk and produces `IdeasMetricsRollup`; handles missing files gracefully (returns not-ready result). This is the primary reusable building block for health checks.
5. `scripts/src/startup-loop/ideas/lp-do-ideas-trial-queue.ts` — queue state machine, telemetry record emission, deduplication
6. `docs/business-os/startup-loop/ideas/trial/queue-state.json` — live trial queue (540+ total entries)
7. `docs/business-os/startup-loop/ideas/trial/telemetry.jsonl` — append-only telemetry stream

### Data & Contracts

- Types/schemas/events:
  - `WorkflowStepTelemetryRecord` (lines 26-59 of workflow-telemetry.ts): record_type, recorded_at, telemetry_key, mode, business, feature_slug, stage, artifact metrics, context metrics, token usage fields
  - `MetricsActionRecord` (lines 68-78 of metrics-rollup.ts): action_id, metric name, cycle_ids, observed_value, threshold, comparator, recommended_action, reason
  - Queue entry schema: dispatch_id, dedupe_key, queue_state, lane, packet, event_timestamp, processing_timestamp
- Persistence:
  - Telemetry: append-only JSONL at `docs/business-os/startup-loop/ideas/trial/telemetry.jsonl`
  - Queue state: JSON overwrite at `docs/business-os/startup-loop/ideas/trial/queue-state.json`
- API/contracts:
  - Alert thresholds are hard-coded constants (lines 130-132 of metrics-rollup.ts):
    - `ALERT_THRESHOLD_FAN_OUT_ADMITTED = 1.5`
    - `ALERT_THRESHOLD_LOOP_INCIDENCE = 0.25`
    - `ALERT_THRESHOLD_QUEUE_AGE_P95_DAYS = 21`
  - Consecutive breach detection applies to `fan_out_admitted` and `loop_incidence` only (2+ cycles above threshold before alerting); `queue_age_p95_days` fires immediately when exceeded

### Dependency & Impact Map

- Upstream dependencies:
  - `queue-state.json` — source of queue age, error rates, lane distribution
  - `telemetry.jsonl` — source of workflow step metrics and token usage
  - Metrics rollup functions — already compute all needed health indicators
- Downstream dependents:
  - Operator (manual report consumer today)
  - No automated consumers exist yet
- Likely blast radius:
  - Thin wrapper around existing `lp-do-ideas-metrics-runner.ts` (265 lines) which already reads queue-state.json + telemetry.jsonl and produces `IdeasMetricsRollup` — the health check extends this with alert evaluation and output formatting rather than building from scratch
  - Possible new `pnpm` script entry for cron scheduling
  - Optional integration point with MCP server for BOS notification

### Test Landscape

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Metrics rollup | Unit | `scripts/src/startup-loop/__tests__/lp-do-ideas-metrics-rollup.test.ts` | Covers cycle reconciliation, metric computation, consecutive breach detection |
| Workflow telemetry | Unit | `scripts/src/startup-loop/__tests__/lp-do-ideas-workflow-telemetry.test.ts` | Covers record building, dedup, summarization |
| Token usage | Unit | `scripts/src/startup-loop/__tests__/workflow-runtime-token-usage.test.ts` | Covers Claude session discovery cascade, token aggregation |
| Trial queue | Unit | `scripts/src/startup-loop/__tests__/lp-do-ideas-trial-queue.test.ts` | Covers queue state machine, telemetry emission |

#### Coverage Gaps

- No tests for real-time monitoring (doesn't exist yet)
- No tests for alert delivery or notification formatting
- Metrics rollup tests don't cover cron-style invocation patterns

#### Testability Assessment

- Easy to test: Health check function that reads queue-state.json + telemetry.jsonl, runs existing metrics computation, and returns structured alert records
- Easy to test: Output formatting (console, JSON, markdown)
- Hard to test: Cron scheduling itself (system-level, not unit-testable)

### Recent Git History (Targeted)

- `3cc5b2edd1` — Added reception inbox analytics (recent, includes telemetry.jsonl and SKILL.md updates)
- `04c3625683` — Fixed release-gate drift and queue path handling
- `e09b4a381c` — Built process improvements operator inbox
- Recent pattern: telemetry and metrics infrastructure is actively evolving; monitoring is the missing consumer layer

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | N/A | No UI component — CLI-only health check | None | N/A |
| UX / states | Required | Health check needs clear pass/warning/alert output states | No output format exists yet | Define output format in analysis |
| Security / privacy | N/A | Reads local files only, no auth boundary | None | N/A |
| Logging / observability / audit | Required | This IS the observability layer — must log its own health check runs | No health check audit trail exists | Define where health check results are persisted |
| Testing / validation | Required | Existing metrics rollup and telemetry tests cover computation; health check wrapper needs new tests | No tests for the monitoring entry point | Plan unit tests for health check function |
| Data / contracts | Required | Consumes existing `MetricsActionRecord` and queue-state schemas | Health check output schema not defined | Define health check output contract |
| Performance / reliability | Required | Must handle large queue-state.json (540+ entries) and telemetry.jsonl efficiently; `lp-do-ideas-metrics-runner.ts` already handles missing files gracefully | Telemetry JSONL will grow unbounded; need to consider read performance | Assess whether tail-scanning or time-windowed reads are needed |
| Rollout / rollback | N/A | Additive CLI module, no migration or deploy dependency | None | N/A |

## Scope Signal

- **Signal:** right-sized
- **Rationale:** The existing metrics rollup and alert threshold logic provides 80%+ of the computation needed. The gap is a thin orchestration layer (health check CLI) that reads queue state + telemetry, runs existing computations, and formats output. No new data sources, no UI, no external service integration. The scope is bounded and the building blocks exist.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Metrics rollup functions | Yes | None | No |
| Alert threshold constants | Yes | None | No |
| Consecutive breach detection | Yes | None | No |
| Queue-state.json structure | Yes | None | No |
| Telemetry JSONL format | Yes | None | No |
| Health check output contract | Partial | [Scope gap] [Minor]: Output schema not yet defined — deferred to analysis | No |
| Cron scheduling mechanism | Partial | [Missing domain] [Minor]: No investigation of cron infrastructure in repo — likely handled outside repo | No |

## Questions

### Resolved

- Q: Are existing alert thresholds correct and reusable?
  - A: Yes. Three thresholds defined in `lp-do-ideas-metrics-rollup.ts` (lines 130-132) with consecutive breach detection logic (lines 313-357). These are production-quality and directly reusable.
  - Evidence: `scripts/src/startup-loop/ideas/lp-do-ideas-metrics-rollup.ts`

- Q: Can the health check run without mutating state?
  - A: Yes. `summarizeWorkflowStepTelemetry()` and metrics rollup are pure read operations. Queue-state.json is read-only for metrics computation.
  - Evidence: Function signatures in both modules are side-effect-free for reads.

- Q: Is there an existing pattern for scheduled CLI scripts in the repo?
  - A: `lp-do-ideas-metrics-runner.ts` is the closest reusable building block — it reads queue-state.json and telemetry.jsonl, produces a rollup, and handles missing files gracefully. The health check wraps this runner with alert evaluation and output formatting. `lp-do-ideas-workflow-telemetry-report.ts` provides an additional CLI entry point pattern.
  - Evidence: `scripts/src/startup-loop/ideas/lp-do-ideas-metrics-runner.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry-report.ts`

### Open (Operator Input Required)

None — all questions resolvable from codebase evidence.

## Confidence Inputs

- **Implementation:** 85% — existing metrics computation and alert logic cover the hard part; remaining work is a thin CLI wrapper + output formatting. Would reach 90% with output schema defined.
- **Approach:** 80% — CLI health check on cron is the obvious fit for this platform (no server process). Alternative approaches (MCP tool, BOS endpoint) are viable but more complex for the same outcome.
- **Impact:** 75% — addresses a real operator pain point (silent queue stalls), but impact depends on how frequently the cron runs and how alerts are surfaced. Would reach 85% with a concrete alert delivery mechanism defined.
- **Delivery-Readiness:** 85% — all building blocks exist; no external dependencies; additive change only.
- **Testability:** 85% — core logic already tested; health check wrapper is straightforward to unit test.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Telemetry JSONL grows large and slows health check | Medium | Low | Time-window reads (last N days) or tail-scan from end of file |
| Operator doesn't notice CLI output without push notification | Medium | Medium | Consider file-based alert log that BOS can surface, or MCP tool integration |
| Alert fatigue from too-frequent breach notifications | Low | Medium | Consecutive breach detection (already built) prevents single-cycle noise |
| Cron scheduling not available in all environments | Low | Low | Health check works as manual CLI too; cron is optional enhancement |

## Planning Constraints & Notes

- Must-follow patterns:
  - Follow existing CLI pattern from `lp-do-ideas-workflow-telemetry-report.ts` (TSX script with pnpm script entry)
  - Reuse alert threshold logic from metrics-rollup rather than reimplementing (note: `buildConsecutiveBreachAlert()` is currently module-private — may need to be exported or the health check may call the higher-level rollup API that includes alert evaluation)
- Rollout/rollback expectations:
  - Additive module — rollback is simply not running the cron
- Observability expectations:
  - Health check should write its invocation timestamp and result summary to a dedicated output file (separate from queue-state.json and telemetry.jsonl) to enable meta-monitoring without violating the no-mutation-of-source-data constraint

## Suggested Task Seeds (Non-binding)

1. Define health check output contract (JSON schema for check results)
2. Implement `checkWorkflowHealth()` function wrapping `lp-do-ideas-metrics-runner.ts` with alert evaluation from metrics-rollup
3. Create CLI entry point (`workflow-health-check.ts`) with pnpm script
4. Add unit tests for health check orchestration
5. Document cron setup for periodic execution

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package: health check CLI that reads queue-state + telemetry, evaluates thresholds, and outputs structured alerts
- Post-delivery measurement plan: verify health check catches a simulated stale-queue scenario in tests

## Evidence Gap Review

### Gaps Addressed

- Confirmed existing alert thresholds and consecutive breach detection are directly reusable (no reimplementation needed)
- Confirmed queue-state.json and telemetry.jsonl are the only data sources needed
- Confirmed existing CLI pattern provides a template for the new module

### Confidence Adjustments

- Implementation confidence raised from initial 78% (dispatch) to 85% after confirming reusable building blocks
- No confidence reductions needed — evidence supports the approach

### Remaining Assumptions

- Cron scheduling is available in the operator's environment (mitigated: CLI works manually too)
- Current telemetry JSONL size is manageable for full reads (mitigated: can add time-windowing if needed)

## Analysis Readiness

- Status: Ready-for-analysis
- Blocking items: none
- Recommended next step: `/lp-do-analysis do-workflow-realtime-monitoring`
