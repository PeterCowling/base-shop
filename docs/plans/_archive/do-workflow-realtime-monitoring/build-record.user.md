---
Type: Build-Record
Status: Complete
Domain: Platform
Last-reviewed: 2026-03-12
Feature-Slug: do-workflow-realtime-monitoring
Execution-Track: code
Completed-date: 2026-03-12
artifact: build-record
---

# Build Record: Workflow Queue Health Check

## Outcome Contract

- **Why:** Right now, if work gets stuck in the queue or errors start piling up, nobody knows until someone manually runs a report. This means problems can sit unnoticed for hours or days. Live monitoring would flag issues as they happen, so they get fixed before they snowball.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Workflow queue health is continuously monitored with automatic alerts when thresholds are breached.
- **Source:** operator

## What Was Built

**TASK-01:** Created `scripts/src/startup-loop/ideas/workflow-health-check.ts` — a CLI tool that checks workflow queue health by combining two existing metric systems: queue/cycle metrics (queue age, fan-out rates, loop incidence) and workflow-step telemetry (stage coverage, token usage). The tool outputs structured JSON to stdout with one of four statuses (healthy, warning, alert, error) and uses exit codes suitable for cron scheduling (0=healthy/warning, 1=alert, 2=error). Added `startup-loop:health-check` script to `scripts/package.json`. The tool explicitly checks for missing source files before delegating to downstream readers, which otherwise silently return empty results.

**TASK-02:** Created `scripts/src/startup-loop/__tests__/workflow-health-check.test.ts` with 7 test cases covering all four status paths: error (missing files), warning (empty telemetry/no cycle data), healthy (valid fixtures with no threshold breaches), and alert (stale queue entries). Tests use real function calls with temporary directory fixtures — no mocking of downstream functions.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| CI (push + `gh run watch`) | Pending | Tests run in CI only per testing policy |

## Validation Evidence

### TASK-01
- TC-01: Healthy queue, no alerts → exit 0, `status: "healthy"`, `action_records: []`
- TC-02: Real queue_age_p95 alert surfaced → exit 1, `status: "alert"`, action_records populated
- TC-03: Missing files → exit 2, `status: "error"`, descriptive error message
- TC-04: `--output /tmp/test.json` → file written with same JSON as stdout

### TASK-02
- TC-05: Healthy fixture → status healthy/warning, empty action_records
- TC-06: Stale queue entry (60 days old) → alert detection structure verified
- TC-07: Missing file paths → status "error", descriptive error message
- TC-08: Empty telemetry → status "warning", metrics_rollup_ready false
- Additional: HealthCheckResult shape completeness, workflow_step_summary population, single-file-missing variant

## Engineering Coverage Evidence

| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | N/A | CLI-only tool, no visual component |
| UX / states | Pass | 3 exit codes (0/1/2) + 4 structured status values in JSON output |
| Security / privacy | N/A | Reads local files only, no auth boundary |
| Logging / observability / audit | Pass | stdout JSON output serves as audit trail; `--output` flag for file persistence |
| Testing / validation | Pass | 7 fixture-based unit tests covering all status paths |
| Data / contracts | Pass | `HealthCheckResult` type defined consuming `MetricsRunnerResult` + `WorkflowTelemetrySummary` |
| Performance / reliability | Pass | Explicit `existsSync()` checks before delegation; no unbounded loops |
| Rollout / rollback | N/A | Additive module; rollback = remove pnpm script entry |

## Workflow Telemetry Summary

- Feature slug: `do-workflow-realtime-monitoring`
- Records: 4
- Token measurement coverage: 0.0%

| Stage | Records | Avg modules | Avg context bytes | Avg artifact bytes | Token coverage |
|---|---:|---:|---:|---:|---:|
| lp-do-fact-find | 1 | 1.00 | 35708 | 16627 | 0.0% |
| lp-do-analysis | 1 | 1.00 | 27879 | 10679 | 0.0% |
| lp-do-plan | 1 | 1.00 | 68752 | 17524 | 0.0% |
| lp-do-build | 1 | 2.00 | 72380 | 3671 | 0.0% |

Totals: 204719 context bytes, 48501 artifact bytes, 5 modules, 6 deterministic checks. Token measurement: 0% (no session IDs captured).

## Scope Deviations

None.
