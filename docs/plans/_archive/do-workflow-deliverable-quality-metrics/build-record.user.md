---
Type: Build-Record
Status: Complete
Domain: Platform
Last-reviewed: 2026-03-12
Feature-Slug: do-workflow-deliverable-quality-metrics
Execution-Track: code
Completed-date: 2026-03-12
artifact: build-record
Build-Event-Ref: docs/plans/do-workflow-deliverable-quality-metrics/build-event.json
---

# Build Record: Deliverable Quality Metrics

## Outcome Contract

- **Why:** Work can be marked complete even if it's missing key sections like engineering coverage evidence or outcome statements. Without checking completeness automatically, gaps only surface when someone manually reviews.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Validator pass/fail results are captured in workflow telemetry so completeness gaps are visible in reports without manual review
- **Source:** auto

## What Was Built

**TASK-01 (ecea901888):** Added `deterministic_check_results` as an optional field on `WorkflowStepTelemetryRecord` with a new `CheckResultSummary` interface (`{ valid: boolean; error_count: number; warning_count: number }`). The CLI gained a `--check-result` repeatable flag accepting `<name>:<pass|fail>:<errors>:<warnings>` format. Check names from `--check-result` are auto-appended to `deterministic_checks` to prevent inconsistent records. The dedupe key (`computeTelemetryKey`) now includes `deterministic_check_results` so records with different validator outcomes produce distinct keys.

**TASK-02 (d45cf6337d):** Added `computeValidatorSummary()` to the report generator, which aggregates per-check pass/fail counts and error/warning totals across filtered records. The markdown formatter now includes a `## Validator Results` section when quality data is present, and the JSON envelope gained `validator_summary` and `validator_record_count` fields. The schema doc was bumped from v1.5.0 to v1.6.0 with the new `deterministic_check_results` field documented.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `npx tsc --noEmit -p scripts/tsconfig.json` | Pass | TypeScript compiles clean |
| `eslint` | Pass | No lint violations |
| `validate-engineering-coverage.sh` | Pass | valid: true, 0 errors, 0 warnings |

## Workflow Telemetry Summary

- Feature slug: `do-workflow-deliverable-quality-metrics`
- Records: 4
- Token measurement coverage: 0.0%

| Stage | Records | Avg modules | Avg context bytes | Avg artifact bytes | Token coverage |
|---|---:|---:|---:|---:|---:|
| lp-do-fact-find | 1 | 1.00 | 40486 | 20363 | 0.0% |
| lp-do-analysis | 1 | 1.00 | 51222 | 10704 | 0.0% |
| lp-do-plan | 1 | 1.00 | 74360 | 18360 | 0.0% |
| lp-do-build | 1 | 2.00 | 82735 | 0 | 0.0% |

### Totals

- Context input bytes: 248803
- Artifact bytes: 49427
- Modules counted: 5
- Deterministic checks counted: 7
- Model input tokens captured: 0
- Model output tokens captured: 0

### Gaps

- Stages missing records: lp-do-ideas
- Stages missing token measurement: lp-do-fact-find, lp-do-analysis, lp-do-plan, lp-do-build
- Records with missing context paths: 1

### Per-Module Context Bytes

Based on 4 of 4 records with per-module data.

| Module | Total Bytes |
|---|---:|
| .claude/skills/lp-do-build/modules/build-validate.md | 10300 |
| .claude/skills/lp-do-build/modules/build-code.md | 4577 |
| .claude/skills/lp-do-plan/modules/plan-code.md | 3435 |
| .claude/skills/lp-do-fact-find/modules/outcome-a-code.md | 2525 |
| .claude/skills/lp-do-analysis/modules/analyze-code.md | 942 |

## Validation Evidence

### TASK-01
- TC-01: `--check-result validate-fact-find.sh:pass:0:2` produces correct `deterministic_check_results` entry with `valid: true, error_count: 0, warning_count: 2` — Pass
- TC-02: Multiple `--check-result` flags all populate `deterministic_check_results` — Pass
- TC-03: No `--check-result` flags → `deterministic_check_results` is `undefined` — Pass
- TC-04: Same `deterministic_checks` array but different `deterministic_check_results` values → different telemetry keys — Pass

### TASK-02
- TC-05 (TC-08 in test): `computeValidatorSummary` aggregates pass/fail counts and error/warning totals per check — Pass
- TC-06 (TC-09 in test): Feature slug filter restricts aggregation to matching records — Pass
- TC-07 (TC-10 in test): Mixed records with/without `deterministic_check_results` handled gracefully — Pass
- TC-08 (TC-11 in test): `formatMarkdown` renders `## Validator Results` section when data present — Pass

## Engineering Coverage Evidence

| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | N/A | Internal telemetry pipeline, no UI |
| UX / states | N/A | CLI and data records, no user-facing states |
| Security / privacy | N/A | Internal tooling reading local files |
| Logging / observability / audit | Covered | New field captures validator outcomes in telemetry; report surfaces quality data |
| Testing / validation | Covered | 8 test contracts (TC-01 through TC-04 for TASK-01, TC-08 through TC-11 for TASK-02) |
| Data / contracts | Covered | `CheckResultSummary` interface, `deterministic_check_results` field, schema doc v1.6.0, dedupe key inclusion |
| Performance / reliability | N/A | Append-only JSONL, no hot path |
| Rollout / rollback | N/A | Additive optional field, old records unaffected |

`validate-engineering-coverage.sh` passed: valid: true, 0 errors, 0 warnings.

## Scope Deviations

None
