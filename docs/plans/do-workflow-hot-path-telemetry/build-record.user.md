---
Type: Build-Record
Status: Complete
Domain: Repo / Agents
Last-reviewed: "2026-03-11"
Feature-Slug: do-workflow-hot-path-telemetry
Execution-Track: mixed
Completed-date: "2026-03-11"
artifact: build-record
---

# Build Record: DO Workflow Hot-Path Telemetry

## Outcome Contract

- **Why:** The DO workflow now has better shared contracts, but token efficiency is still measured mostly by inference rather than stage-by-stage telemetry.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Add deterministic hot-path telemetry for the `lp-do-ideas -> lp-do-build` workflow, reusing the existing ideas telemetry stream and summarising stage/module/context cost.
- **Source:** operator

## What Was Built

Added a reusable JSONL helper for ideas telemetry persistence, a deterministic workflow-step recorder, a deterministic workflow-step report command, and workflow/doc/template wiring so downstream DO stages append telemetry after validators pass and build summaries can carry the aggregated report.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm exec tsc -p scripts/tsconfig.json --noEmit` | Pass | scripts package typecheck clean |
| `pnpm exec eslint scripts/src/startup-loop/ideas/ideas-jsonl.ts scripts/src/startup-loop/ideas/lp-do-ideas-persistence.ts scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry.ts scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry-report.ts scripts/src/startup-loop/__tests__/lp-do-ideas-workflow-telemetry.test.ts` | Pass | targeted lint clean |
| `bash scripts/validate-fact-find.sh docs/plans/do-workflow-hot-path-telemetry/fact-find.md docs/plans/do-workflow-hot-path-telemetry/critique-history.md` | Pass | ready `true`, score `4.6`, no blockers |
| `bash scripts/validate-engineering-coverage.sh docs/plans/do-workflow-hot-path-telemetry/fact-find.md` | Pass | `artifactType=fact-find`, `track=mixed`, no errors |
| `bash scripts/validate-engineering-coverage.sh docs/plans/do-workflow-hot-path-telemetry/analysis.md` | Pass | `artifactType=analysis`, `track=mixed`, no errors |
| `bash scripts/validate-plan.sh docs/plans/do-workflow-hot-path-telemetry/plan.md` | Pass | active IMPLEMENT tasks: `TASK-01`, `TASK-02`, `TASK-03` |
| `bash scripts/validate-engineering-coverage.sh docs/plans/do-workflow-hot-path-telemetry/plan.md` | Pass | `artifactType=plan`, `track=mixed`, no errors |
| `bash scripts/validate-engineering-coverage.sh docs/plans/do-workflow-hot-path-telemetry/build-record.user.md` | Pass | `artifactType=build-record`, `track=mixed`, no errors |
| `pnpm --filter scripts startup-loop:lp-do-ideas-record-workflow-telemetry -- --stage <fact-find/analysis/plan/build> --feature-slug do-workflow-hot-path-telemetry ...` | Pass | four workflow-step records appended to the shared ideas telemetry stream |
| `pnpm --filter scripts startup-loop:lp-do-ideas-report-workflow-telemetry -- --feature-slug do-workflow-hot-path-telemetry --format markdown` | Pass | reporter returned stage summary for this slug |

## Workflow Telemetry Summary

- Feature slug: `do-workflow-hot-path-telemetry`
- Records: `4`
- Token measurement coverage: `0.0%`
- Notes:
  - downstream DO stages are now measured in the shared ideas telemetry stream via `workflow_step` lines
  - `lp-do-ideas` itself still contributes via its native queue/cycle telemetry rather than a downstream `workflow_step` line

| Stage | Records | Avg modules | Avg context bytes | Avg artifact bytes | Token coverage |
|---|---:|---:|---:|---:|---:|
| `lp-do-fact-find` | 1 | 3.00 | 47103 | 6318 | 0.0% |
| `lp-do-analysis` | 1 | 2.00 | 22911 | 4540 | 0.0% |
| `lp-do-plan` | 1 | 2.00 | 47808 | 13526 | 0.0% |
| `lp-do-build` | 1 | 2.00 | 64938 | 4300 | 0.0% |

- Totals:
  - Context input bytes: `182760`
  - Artifact bytes: `28684`
  - Modules counted: `9`
  - Deterministic checks counted: `7`
  - Model input tokens captured: `0`
  - Model output tokens captured: `0`
- Gaps:
  - Stages missing `workflow_step` records: `lp-do-ideas`
  - Stages missing token measurement: `lp-do-fact-find`, `lp-do-analysis`, `lp-do-plan`, `lp-do-build`
  - Records with missing context paths: `0`

## Validation Evidence

### TASK-01
- Added `ideas-jsonl.ts`, `lp-do-ideas-workflow-telemetry.ts`, and `lp-do-ideas-workflow-telemetry-report.ts`.
- Refactored `lp-do-ideas-persistence.ts` to use shared append/read helpers.

### TASK-02
- Updated ideas telemetry schema, workflow guide, DO skill docs, build-record contract, and build-record template.

### TASK-03
- Persisted `fact-find.md`, `analysis.md`, `plan.md`, `critique-history.md`, and this `build-record.user.md`.
- Recorded workflow-step telemetry for fact-find, analysis, plan, and build.
- Generated the first slug-level workflow telemetry summary from the shared ideas telemetry stream and pasted it into this build record.

## Engineering Coverage Evidence

| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | N/A | repo/process telemetry change only |
| UX / states | Recorder/report summary by stage | shows stage coverage and gaps |
| Security / privacy | Repo-local telemetry only | no secrets or external sinks added |
| Logging / observability / audit | `workflow_step` lines in ideas telemetry stream | additive observability layer |
| Testing / validation | TS/lint + artifact validators + unit test file | deterministic proof path |
| Data / contracts | schema doc + recorder/report contract | additive discriminated record type |
| Performance / reliability | dedupe key + missing-context tolerance | append-only and idempotent |
| Rollout / rollback | additive command adoption | stop using recorder to roll back |

## Scope Deviations

None. The work stayed within scripts, workflow docs, templates, and persisted workflow artifacts.
