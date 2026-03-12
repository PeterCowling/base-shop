---
Type: Analysis
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: "2026-03-12"
Last-updated: "2026-03-12"
Feature-Slug: do-workflow-realtime-monitoring
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/do-workflow-realtime-monitoring/fact-find.md
Related-Plan: docs/plans/do-workflow-realtime-monitoring/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Real-Time Workflow Queue Monitoring Analysis

## Decision Frame

### Summary

The workflow queue has all the computation and alert logic needed for health monitoring — but no automated way to run it and surface results. This analysis selects the best approach for adding a lightweight health check that evaluates queue health and surfaces alerts.

### Goals

- Select an approach that reuses existing metrics infrastructure (metrics-rollup, metrics-runner)
- Define output contract and alert delivery mechanism
- Keep the solution additive and minimal

### Non-goals

- Dashboard or UI
- Auto-remediation
- External service integration

### Constraints & Assumptions

- Constraints:
  - No persistent server process — must work as a CLI invocation
  - Must not mutate source data files (queue-state.json, telemetry.jsonl)
  - Health check results go to a separate output file
- Assumptions:
  - Current workflow volume makes periodic CLI checks sufficient
  - Existing alert thresholds are correct

## Inherited Outcome Contract

- **Why:** Right now, if work gets stuck in the queue or errors start piling up, nobody knows until someone manually runs a report. This means problems can sit unnoticed for hours or days. Live monitoring would flag issues as they happen, so they get fixed before they snowball.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Workflow queue health is continuously monitored with automatic alerts when thresholds are breached.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/do-workflow-realtime-monitoring/fact-find.md`
- Key findings used:
  - `lp-do-ideas-metrics-runner.ts` (265 lines) reads queue-state + telemetry via `runMetricsRollup()` and produces `IdeasMetricsRollup` including `action_records: MetricsActionRecord[]` (alerts already evaluated). **Important limitation:** the runner only processes `record_type: cycle` lines from telemetry JSONL — it does not read `workflow_step` records. Queue-age, fan-out, and loop-incidence metrics come from cycle data; workflow-step metrics (token spend, context size) are separate.
  - `lp-do-ideas-metrics-rollup.ts` has 3 alert thresholds with consecutive-breach logic (fan_out, loop_incidence use 2+ cycles; queue_age_p95 fires immediately). Alerts are returned as `action_records` on the rollup result — no need to export private functions.
  - `summarizeWorkflowStepTelemetry()` in `lp-do-ideas-workflow-telemetry.ts` handles workflow-step metrics (per-stage token usage, artifact sizes, context input). This is a second data source the health check needs to consume alongside the metrics runner.
  - No monitoring consumer exists — all metrics are batch-computed on manual invocation
  - Existing CLI pattern: `lp-do-ideas-workflow-telemetry-report.ts` (TSX CLI → pnpm script)

## Evaluation Criteria

| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Reuse of existing code | Minimizes new code, reduces risk | High |
| Output actionability | Operator must be able to act on alerts quickly | High |
| Implementation effort | Small scope — should stay small | Medium |
| Extensibility | Future alerting channels (MCP, email) should plug in easily | Low |

## Options Considered

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A: Thin CLI wrapper around metrics-runner + telemetry summary | New `workflow-health-check.ts` CLI that calls `runMetricsRollup()` for queue/cycle health (alerts via `action_records`) and `summarizeWorkflowStepTelemetry()` for workflow-step health, writes structured JSON result to stdout and optionally to a gitignored output file, exits with non-zero on alerts | Maximum reuse; ~150-200 new lines; follows existing CLI pattern; cron-friendly exit codes | No push notification — operator must check output or cron exit | Operator may miss alerts if cron isn't monitored | Yes |
| B: MCP tool health check | Add `workflow_health_check` tool to brikette MCP server that wraps same logic, accessible from BOS | Interactive — operator can query health on demand; integrates with existing BOS workflow | More integration surface; MCP server must be running; not cron-friendly; adds to MCP server scope | MCP server availability dependency; harder to test | Yes |
| C: Full monitoring service | Persistent process with polling loop, WebSocket updates, notification dispatch | Real-time; push-based; most capable | Way out of scope; requires server infrastructure; high implementation effort | Over-engineering for current volume | No — eliminated by scope constraint |

## Engineering Coverage Comparison

| Coverage Area | Option A (CLI wrapper) | Option B (MCP tool) | Chosen implication |
|---|---|---|---|
| UI / visual | N/A — CLI output only | N/A — MCP JSON response | N/A for both |
| UX / states | Clear exit codes (0=healthy, 1=alert, 2=error); structured JSON output with pass/warning/alert per metric | JSON response with same structure; interactive query | Option A: define 3 exit states + JSON body |
| Security / privacy | Local file reads only | Goes through MCP auth layer | N/A for Option A; existing auth for B |
| Logging / observability / audit | Results to stdout + optional gitignored file for audit trail | No persistence — result is ephemeral in MCP response | Option A: stdout primary, optional file for cron |
| Testing / validation | Unit test the orchestration function; integration test with fixture data | Same unit tests plus MCP route test | Option A: simpler test surface |
| Data / contracts | Consumes `MetricsRunnerResult` + `MetricsActionRecord`; outputs new `HealthCheckResult` schema | Same contracts | Define `HealthCheckResult` output schema |
| Performance / reliability | Reads 2 files per invocation (~1.6MB queue-state + growing telemetry JSONL); metrics-runner handles missing files | Same, but MCP adds request overhead | Both acceptable; telemetry growth is the shared concern |
| Rollout / rollback | Add pnpm script; rollback = remove script | Add MCP tool; rollback = remove tool registration | Option A: simpler rollout |

## Chosen Approach

- **Recommendation:** Option A — Thin CLI wrapper around metrics-runner
- **Why this wins:** Maximum code reuse (`runMetricsRollup()` provides queue/cycle metrics with alerts already evaluated as `action_records`; `summarizeWorkflowStepTelemetry()` provides workflow-step metrics), follows existing CLI patterns, cron-friendly with exit codes, simplest test surface.
- **What it depends on:** Two existing public functions: `runMetricsRollup()` from metrics-runner and `summarizeWorkflowStepTelemetry()` from workflow-telemetry. No private function exports needed — `action_records` on the rollup already contains evaluated alerts.

### Rejected Approaches

- **Option B (MCP tool)** — viable but adds unnecessary integration complexity for the initial deliverable. The MCP server must be running, testing is harder, and it doesn't support cron scheduling. Better as a follow-on enhancement.
- **Option C (Full monitoring service)** — eliminated. Over-engineering for current workflow volume (~540 queue entries). No persistent server infrastructure exists or is needed.

### Open Questions (Operator Input Required)

None — all decisions resolvable from evidence and constraints.

## Planning Handoff

- Planning focus:
  - Define `HealthCheckResult` output schema (JSON)
  - Implement `checkWorkflowHealth()` wrapping metrics-runner + alert evaluation
  - Create CLI entry point with pnpm script and exit code semantics
  - Unit tests for orchestration function
  - Output results to stdout (primary); optionally write to a gitignored file (e.g. `data/health-check-latest.json`) for cron audit trail — not in `docs/` to avoid git churn
- Validation implications:
  - Unit tests must cover: healthy state, single-metric alert, multi-metric alert, missing source files
  - Exit code behavior must be tested (0/1/2)
- Sequencing constraints:
  - Health check function depends on both `runMetricsRollup()` and `summarizeWorkflowStepTelemetry()` (both already public)
  - CLI entry point depends on health check function
  - Tests depend on both
- Risks to carry into planning:
  - Telemetry JSONL growth — plan should consider time-windowed reads if performance degrades
  - Cycle telemetry and workflow-step telemetry are in the same JSONL file but parsed by different functions — health check must call both

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| Two data sources needed (cycle + workflow-step) | Certain | Low | Both APIs are public and tested; health check must call both | Plan two data-loading steps in the orchestration function |
| Telemetry file growth | Medium | Low | Growth rate depends on workflow volume; not blocking yet | Add time-window parameter if perf degrades |
| Operator doesn't check cron output | Medium | Medium | Alert delivery channel is an operator choice | Document cron setup; note MCP tool as follow-on |

## Planning Readiness

- Status: Go
- Rationale: All gates pass — evidence is complete, approaches compared, recommendation is decisive, no operator questions remain, engineering coverage implications carried forward.

## Analysis Gates

### Evidence Gate: Pass

- Fact-find exists at `docs/plans/do-workflow-realtime-monitoring/fact-find.md` with `Status: Ready-for-analysis`
- `Deliverable-Type: code-change`, `Execution-Track: code`, `Primary-Execution-Skill: lp-do-build`
- `## Outcome Contract` present
- `## Engineering Coverage Matrix` complete in fact-find
- Current-state evidence sufficient for approach comparison

### Option Gate: Pass

- 2 viable options (A: CLI wrapper, B: MCP tool) compared explicitly
- 1 eliminated option (C: full service) with rationale

### Planning Handoff Gate: Pass

- Chosen approach stated decisively: Option A
- Rejected options documented with rationale
- Planning handoff notes present (validation, sequencing, risk transfer)
- Engineering coverage implications carried forward
- No open operator questions
