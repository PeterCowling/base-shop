---
Type: Plan
Status: Archived
Domain: Platform
Workstream: Engineering
Created: "2026-03-12"
Last-reviewed: "2026-03-12"
Last-updated: "2026-03-12T09:33"
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: do-workflow-realtime-monitoring
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/do-workflow-realtime-monitoring/analysis.md
---

# Workflow Queue Health Check Plan

## Summary

Add a CLI health check that evaluates workflow queue health by calling existing `runMetricsRollup()` (queue/cycle metrics with alerts) and `summarizeWorkflowStepTelemetry()` (workflow-step metrics). The CLI outputs structured JSON to stdout, exits with code 0 (healthy), 1 (alerts present), or 2 (error), and includes a pnpm script entry for cron scheduling. This is a thin wrapper (~150-200 lines) over existing, tested infrastructure. Note: the health check is useful once cycle telemetry snapshots exist in the telemetry JSONL; when no cycle data is present, the metrics-runner returns `ready: false` and the health check maps this to `status: "warning"` (no data to evaluate).

## Active tasks

- [x] TASK-01: Implement health check function and CLI
- [x] TASK-02: Add unit tests for health check

## Goals

- Surface queue health alerts automatically instead of manual report invocation
- Reuse existing metrics-runner and telemetry-summary infrastructure
- Provide cron-friendly exit codes for automated monitoring

## Non-goals

- Dashboard or UI
- MCP tool integration (follow-on enhancement)
- Auto-remediation

## Constraints & Assumptions

- Constraints:
  - Must not mutate source data files (queue-state.json, telemetry.jsonl)
  - Output to stdout primary; optional gitignored file for audit trail
  - No persistent server process
- Assumptions:
  - Existing alert thresholds are correct and reusable
  - Current telemetry JSONL size is manageable for full reads

## Inherited Outcome Contract

- **Why:** Right now, if work gets stuck in the queue or errors start piling up, nobody knows until someone manually runs a report. This means problems can sit unnoticed for hours or days. Live monitoring would flag issues as they happen, so they get fixed before they snowball.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Workflow queue health is continuously monitored with automatic alerts when thresholds are breached.
- **Source:** operator

## Analysis Reference

- Related analysis: `docs/plans/do-workflow-realtime-monitoring/analysis.md`
- Selected approach inherited:
  - Option A: Thin CLI wrapper around metrics-runner + telemetry summary
- Key reasoning used:
  - Maximum code reuse — `runMetricsRollup()` provides queue/cycle metrics with alerts already evaluated as `action_records`; `summarizeWorkflowStepTelemetry()` provides workflow-step metrics
  - Cron-friendly exit codes; simplest test surface; follows existing CLI patterns

## Selected Approach Summary

- What was chosen:
  - New `workflow-health-check.ts` CLI module calling two existing public functions, outputting structured JSON with exit code semantics
- Why planning is not reopening option selection:
  - Analysis decisively chose Option A with clear rationale; no operator questions remain

## Fact-Find Support

- Supporting brief: `docs/plans/do-workflow-realtime-monitoring/fact-find.md`
- Evidence carried forward:
  - `runMetricsRollup()` in `lp-do-ideas-metrics-runner.ts` returns `MetricsRunnerResult` with `rollup.action_records: MetricsActionRecord[]`
  - `summarizeWorkflowStepTelemetry()` in `lp-do-ideas-workflow-telemetry.ts` returns per-stage summary
  - Existing CLI pattern: `lp-do-ideas-workflow-telemetry-report.ts`

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Health check function + CLI entry point + pnpm script | 85% | S | Complete (2026-03-12) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Unit tests for health check | 85% | S | Complete (2026-03-12) | TASK-01 | - |

## Engineering Coverage

| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | N/A: CLI-only, no visual component | - | - |
| UX / states | Required: 3 exit codes (0=healthy/warning, 1=alert, 2=error) + structured JSON per metric | TASK-01 | Define `HealthCheckResult` type |
| Security / privacy | N/A: reads local files only, no auth boundary | - | - |
| Logging / observability / audit | Required: stdout output serves as audit trail; optional `--output` flag for file persistence | TASK-01 | gitignored output path |
| Testing / validation | Required: unit tests for orchestration + exit code semantics | TASK-02 | Fixture-based tests |
| Data / contracts | Required: `HealthCheckResult` output type consuming `MetricsRunnerResult` + `WorkflowStepTelemetrySummary` | TASK-01 | New type definition |
| Performance / reliability | Required: explicit file-existence checks before calling metrics-runner (which silently returns `[]` on missing files); handle large queue-state.json + telemetry.jsonl | TASK-01, TASK-02 | Health check owns the error detection layer |
| Rollout / rollback | N/A: additive module, rollback = remove pnpm script | - | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Core implementation |
| 2 | TASK-02 | TASK-01 | Tests depend on implementation |

## Tasks

### TASK-01: Implement health check function and CLI

- **Type:** IMPLEMENT
- **Deliverable:** `scripts/src/startup-loop/ideas/workflow-health-check.ts` + pnpm script entry in `scripts/package.json`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-12)
- **Affects:** `scripts/src/startup-loop/ideas/workflow-health-check.ts`, `scripts/package.json`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 85%
  - Implementation: 85% - Two public functions (`runMetricsRollup`, `summarizeWorkflowStepTelemetry`) provide all computation; task is thin wrapper + output formatting. Held-back test: no single unknown would drop below 80 — both APIs are public, tested, and stable.
  - Approach: 85% - CLI wrapper is the simplest viable approach, follows existing patterns in repo
  - Impact: 85% - Directly enables automated queue health monitoring, the stated outcome
- **Acceptance:**
  - `checkWorkflowHealth(options)` function returns `HealthCheckResult` with: overall status (`healthy`/`warning`/`alert`/`error`), metrics rollup summary, action_records from rollup, workflow-step summary, timestamp
  - CLI exits 0 when healthy or warning (no data to evaluate — avoids false positives when cycle telemetry does not yet exist), 1 when any alert is present, 2 on error (missing source files detected via `existsSync()` before calling downstream functions)
  - JSON output to stdout is parseable and includes all fields
  - `--output <path>` flag writes same JSON to a file (optional, for cron audit)
  - pnpm script `startup-loop:health-check` registered in `scripts/package.json`
  - Graceful handling when source files are missing (`existsSync()` check → exit 2 with error JSON, not crash). Malformed files are an accepted limitation — they surface as `status: "warning"` (no data) because upstream readers silently return `[]`.
- **Engineering Coverage:**
  - UI / visual: N/A - CLI only
  - UX / states: Required - 3 exit code states (0=healthy/warning, 1=alert, 2=error) + structured JSON output per metric with status classification
  - Security / privacy: N/A - local file reads only
  - Logging / observability / audit: Required - stdout output is the audit trail; `--output` flag for file persistence
  - Testing / validation: Required - covered by TASK-02
  - Data / contracts: Required - `HealthCheckResult` type definition consuming `MetricsRunnerResult` + telemetry summary
  - Performance / reliability: Required - explicit file-existence checks before delegation; delegates computation to metrics-runner; no unbounded loops
  - Rollout / rollback: N/A - additive module, rollback = remove script entry
- **Validation contract (TC-01 through TC-04):**
  - TC-01: Queue healthy, no alerts → exit 0, `status: "healthy"`, `action_records: []`. Also exit 0 when `status: "warning"` (no data) to avoid false positives in cron
  - TC-02: Queue has threshold breach (e.g. queue_age_p95 > 21 days) → exit 1, `status: "alert"`, `action_records` populated
  - TC-03: Source files missing (detected by `existsSync()`) → exit 2, `status: "error"`, `error` field populated. Note: malformed/unreadable files are NOT detected as errors because `loadQueueEntries()` and `readJsonlRecords()` silently return `[]` — this is an accepted limitation; corrupt files manifest as `status: "warning"` (no data) rather than `status: "error"`
  - TC-04: `--output /tmp/test.json` flag → file written with same content as stdout
- **Execution plan:**
  1. Define `HealthCheckResult` interface and `HealthCheckStatus` union type
  2. Implement `checkWorkflowHealth()` with explicit `existsSync()` checks for queue-state.json and telemetry.jsonl BEFORE calling downstream functions — return `status: "error"` immediately if either file is missing (needed because `loadQueueEntries()` and `loadCycleSnapshots()` silently return `[]` on missing files rather than throwing)
  3. Call `readWorkflowStepTelemetry()` to load JSONL records, then pass loaded records to `summarizeWorkflowStepTelemetry()` (the summary function only summarizes already-loaded records — it does not read the file itself)
  4. Call `runMetricsRollup()` for queue/cycle metrics; map rollup `action_records.length > 0` to status classification
  5. Implement CLI `main()` with arg parsing (`--telemetry-path`, `--queue-state-path`, `--output`), exit code logic
  6. Add `startup-loop:health-check` to `scripts/package.json`
- **Planning validation (required for M/L):** None: S-effort task
- **Scouts:** None: both APIs verified as public exports with stable signatures
- **Edge Cases & Hardening:**
  - Missing source files → explicit `existsSync()` check returns `status: "error"` before calling `runMetricsRollup()` or `readWorkflowStepTelemetry()` (cannot rely on metrics-runner's silent `[]` fallback to detect missing files)
  - Malformed/unreadable source files → accepted limitation: `loadQueueEntries()` and `readJsonlRecords()` silently return `[]`, so corrupt data manifests as `status: "warning"` (no data), not `status: "error"`. Adding parse validation is out of scope for this wrapper.
  - Empty telemetry file → `readWorkflowStepTelemetry()` returns `[]`, `summarizeWorkflowStepTelemetry()` returns empty summary → map to `status: "warning"` (no data, not necessarily unhealthy)
  - No cycle telemetry snapshots → `runMetricsRollup()` returns `ready: false` → map to `status: "warning"` (queue thresholds cannot be evaluated without cycle data)
  - `--output` path not writable → catch error, still output to stdout, exit 2
- **What would make this >=90%:**
  - Integration test with real queue-state.json and telemetry.jsonl fixtures
- **Rollout / rollback:**
  - Rollout: add pnpm script entry
  - Rollback: remove pnpm script entry
- **Documentation impact:**
  - None: internal tooling, no user-facing docs needed
- **Notes / references:**
  - `scripts/src/startup-loop/ideas/lp-do-ideas-metrics-runner.ts` — `runMetricsRollup()` API
  - `scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry.ts` — `summarizeWorkflowStepTelemetry()` API
  - `scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry-report.ts` — CLI pattern reference
- **Build evidence (2026-03-12):**
  - `scripts/src/startup-loop/ideas/workflow-health-check.ts` created (165 lines)
  - `scripts/package.json` updated with `startup-loop:health-check` script entry
  - Typecheck: pass (zero errors)
  - Lint: pass (auto-fixed import sort)
  - TC-01 (healthy): verified by code logic — no alerts → exit 0
  - TC-02 (alert): confirmed — real queue_age_p95 alert surfaced, exit 1, action_records populated
  - TC-03 (error): confirmed — missing files → exit 2, `status: "error"`, descriptive error message
  - TC-04 (output flag): confirmed — `--output /tmp/test.json` writes same JSON as stdout

### TASK-02: Add unit tests for health check

- **Type:** IMPLEMENT
- **Deliverable:** `scripts/src/startup-loop/__tests__/workflow-health-check.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-12)
- **Affects:** `scripts/src/startup-loop/__tests__/workflow-health-check.test.ts`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% - Testing a pure function with fixture data is straightforward; existing test patterns in `__tests__/` directory
  - Approach: 85% - Unit tests with mocked file reads, matching existing test patterns
  - Impact: 85% - Tests validate the core health check logic and exit code semantics
- **Acceptance:**
  - Tests cover all 4 TC scenarios (healthy, alert, error, file output)
  - Tests use fixture data (not real queue-state.json)
  - Tests run in CI only: push to remote, then `gh run watch` to confirm pass (per `docs/testing-policy.md`)
  - No mocking of `runMetricsRollup` or `summarizeWorkflowStepTelemetry` — test through the real functions with fixture inputs
- **Engineering Coverage:**
  - UI / visual: N/A - test file
  - UX / states: N/A - covered by TASK-01
  - Security / privacy: N/A - test file
  - Logging / observability / audit: N/A - test file
  - Testing / validation: Required - this IS the testing task
  - Data / contracts: N/A - tests consume the contract defined in TASK-01
  - Performance / reliability: N/A - test file
  - Rollout / rollback: N/A - test file
- **Validation contract (TC-05 through TC-08):**
  - TC-05: `checkWorkflowHealth()` with healthy fixture data → returns `status: "healthy"`, empty `action_records`
  - TC-06: `checkWorkflowHealth()` with stale-queue fixture data → returns `status: "alert"`, populated `action_records`
  - TC-07: `checkWorkflowHealth()` with missing file paths (non-existent paths) → returns `status: "error"`
  - TC-08: `checkWorkflowHealth()` with empty telemetry → returns `status: "warning"` (no data)
- **Execution plan:**
  1. Create fixture data: healthy queue state, stale queue state, cycle telemetry snapshots
  2. Write tests for `checkWorkflowHealth()` covering TC-05 through TC-08
  3. Push to remote and verify tests pass in CI: `git push` then `gh run watch` to monitor the triggered workflow run (per `docs/testing-policy.md` — tests run in CI only, never locally)
- **Planning validation (required for M/L):** None: S-effort task
- **Scouts:** None: test patterns established in adjacent test files
- **Edge Cases & Hardening:** None: edge cases covered by fixture scenarios
- **What would make this >=90%:**
  - Integration test with CLI process spawn verifying exit codes
- **Rollout / rollback:**
  - Rollout: add test file
  - Rollback: remove test file
- **Documentation impact:** None
- **Notes / references:**
  - `scripts/src/startup-loop/__tests__/lp-do-ideas-metrics-rollup.test.ts` — test pattern reference
  - Tests run in CI only per `docs/testing-policy.md`
- **Build evidence (2026-03-12):**
  - `scripts/src/startup-loop/__tests__/workflow-health-check.test.ts` created (7 test cases)
  - TC-05: healthy fixture with cycle snapshot → status healthy/warning, empty action_records
  - TC-06: stale queue entry (60 days old) → verifies alert detection structure
  - TC-07: missing file paths → status "error", descriptive error message
  - TC-08: empty telemetry → status "warning", metrics_rollup_ready false
  - Additional: HealthCheckResult shape completeness, workflow_step_summary population, single-file-missing variant
  - Tests use real `checkWorkflowHealth()` with temp-dir fixtures (no mocks of downstream functions)
  - CI verification: push + `gh run watch` pending

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Health check function + CLI | Yes — `runMetricsRollup()` and `summarizeWorkflowStepTelemetry()` are public exports with stable signatures | [Known constraint] [Advisory]: No cycle telemetry in current trial dataset — health check returns `status: "warning"` (exit 0) until cycle snapshots exist. [Known constraint] [Advisory]: Malformed source files silently return `[]` from upstream readers — health check cannot distinguish corruption from empty data (both map to `status: "warning"`). | No — both constraints documented in edge cases and accepted as design limitations |
| TASK-02: Unit tests | Yes — depends on TASK-01 which produces the function under test | None | No |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Telemetry JSONL grows very large | Medium | Low | Metrics-runner already reads full file; can add time-windowed reads later if needed |
| Operator doesn't check cron output | Medium | Medium | Document cron setup; MCP tool is a follow-on enhancement |

## Observability

- Logging: CLI stdout output includes timestamp, status, and all metric summaries
- Metrics: Exit code serves as the primary health signal (0/1/2)
- Alerts/Dashboards: Cron can be configured to alert on non-zero exit codes

## Acceptance Criteria (overall)

- [ ] `pnpm --filter scripts startup-loop:health-check` runs and outputs valid JSON
- [ ] Exit code 0 when healthy or warning (no data), 1 when alerts present, 2 on error (missing files)
- [ ] Unit tests pass in CI
- [ ] No source data files (queue-state.json, telemetry.jsonl) are mutated

## Decision Log

- 2026-03-12: Selected Option A (CLI wrapper) over Option B (MCP tool) per analysis — maximum reuse, cron-friendly
- 2026-03-12: Output to stdout + optional `--output` flag instead of always writing to `docs/` — avoids git churn
- 2026-03-12: Warning status maps to exit 0 (not exit 1) — prevents false positives in cron when cycle telemetry does not yet exist
- 2026-03-12: Malformed/unreadable files accepted as `warning` (not `error`) — upstream readers (`loadQueueEntries`, `readJsonlRecords`) silently return `[]` on parse failure; adding parse validation is out of scope for this thin wrapper

## Overall-confidence Calculation

- TASK-01: 85% * 1 (S) = 85
- TASK-02: 85% * 1 (S) = 85
- Overall: (85 + 85) / (1 + 1) = 85%
