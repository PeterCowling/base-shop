---
Type: Plan
Status: Active
Domain: Platform
Workstream: Engineering
Created: 2026-03-12
Last-reviewed: 2026-03-12
Last-updated: 2026-03-12
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: do-workflow-deliverable-quality-metrics
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/do-workflow-deliverable-quality-metrics/analysis.md
---

# Deliverable Quality Metrics Plan

## Summary

Add a `deterministic_check_results` optional field to `WorkflowStepTelemetryRecord` that captures compact validator pass/fail summaries (`{ valid, error_count, warning_count }` per check). Extend the telemetry CLI with a `--check-result` flag to accept these results, and add a quality/completeness section to the report generator. Update the schema doc to v1.6.0. This follows the exact pattern established by C003 (`per_module_bytes`).

## Active tasks

- [x] TASK-01: Add deterministic_check_results to record type, builder, CLI, and dedupe key
- [x] TASK-02: Add validator results to report generator and update schema doc

## Goals

- Capture validator pass/fail results in telemetry records
- Enable the report generator to surface quality/completeness data alongside existing size and token metrics

## Non-goals

- Adding new validators (e.g. `validate-build-record.ts`)
- Changing validator logic or pass/fail criteria
- Real-time alerting or dashboards

## Constraints & Assumptions

- Constraints:
  - Backward-compatible with existing records (new field optional)
  - Must not break existing consumers (`summarizeWorkflowStepTelemetry`, `computePerModuleBreakdown`, ideas rollup)
  - Schema bump 1.5.0 -> 1.6.0
- Assumptions:
  - All validators produce JSON to stdout with typed result interfaces
  - `parseArgs` handles new `--check-result` repeatable flag (proven by 4 existing `multiple: true` flags)

## Inherited Outcome Contract

- **Why:** Work can be marked complete even if it's missing key sections like engineering coverage evidence or outcome statements. Without checking completeness automatically, gaps only surface when someone manually reviews.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Validator pass/fail results are captured in workflow telemetry so completeness gaps are visible in reports without manual review
- **Source:** auto

## Analysis Reference

- Related analysis: `docs/plans/do-workflow-deliverable-quality-metrics/analysis.md`
- Selected approach inherited:
  - Option A — compact summary field `deterministic_check_results?: Record<string, { valid: boolean; error_count: number; warning_count: number }>`
- Key reasoning used:
  - Compact record size (10-20x smaller than full results)
  - Uniform shape enables report aggregation without validator-specific knowledge
  - CLI flag design is straightforward with colon-delimited format
  - Detail not lost — recoverable by re-running validators on the artifact

## Selected Approach Summary

- What was chosen:
  - Option A: Add an optional `deterministic_check_results` field with compact per-check summary objects to `WorkflowStepTelemetryRecord`. Add a `--check-result` CLI flag. Add quality section to report generator. Bump schema to 1.6.0.
- Why planning is not reopening option selection:
  - Analysis compared 3 options against 5 explicit criteria; Option A won decisively on all high-priority criteria. No new evidence has emerged.

## Fact-Find Support

- Supporting brief: `docs/plans/do-workflow-deliverable-quality-metrics/fact-find.md`
- Evidence carried forward:
  - `deterministic_checks: string[]` stores names only (telemetry.ts:44)
  - Validator return types: `FactFindValidationResult`, `EngineeringCoverageValidationResult`, `PlanValidationResult`
  - `per_module_bytes` additive-field pattern proven by C003

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add deterministic_check_results to record type, builder, CLI, and dedupe key | 90% | S | Complete (2026-03-12) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Add validator results to report generator and update schema doc | 85% | S | Complete (2026-03-12) | TASK-01 | - |

## Engineering Coverage

| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | N/A — internal telemetry data pipeline, no UI | - | - |
| UX / states | N/A — CLI and data records, no user-facing states | - | - |
| Security / privacy | N/A — internal tooling reading local files | - | - |
| Logging / observability / audit | Required — this IS the observability improvement | TASK-01, TASK-02 | Validator outcomes become visible in telemetry reports |
| Testing / validation | Required — TC contracts for new field, report, dedupe | TASK-01, TASK-02 | Follow C003 test patterns |
| Data / contracts | Required — interface addition, schema doc bump | TASK-01, TASK-02 | Additive optional field |
| Performance / reliability | N/A — append-only JSONL, no hot path | - | - |
| Rollout / rollback | N/A — additive optional field, old records unaffected | - | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Interface + builder + CLI + dedupe key |
| 2 | TASK-02 | TASK-01 | Report generator + schema doc (depends on new type) |

## Delivered Processes

| Area | Trigger | Delivered step-by-step flow | Tasks / dependencies | Unresolved issues / rollback seam |
|---|---|---|---|---|
| Telemetry recording | Agent completes DO stage, validators pass | 1. Agent runs validators → gets JSON stdout. 2. Agent extracts `valid`, error count, warning count from each result. 3. Agent calls telemetry CLI with `--deterministic-check <name>` AND `--check-result <name>:<pass\|fail>:<errors>:<warnings>` for each check. 4. CLI parses `--check-result` flags into `deterministic_check_results` field. 5. Record appended with both script names and results. | TASK-01 | Field is optional; records without `--check-result` flags get `undefined` (backward compatible) |
| Report generation | Operator runs report CLI | 1. Report reads JSONL records. 2. For records with `deterministic_check_results`, aggregates pass/fail counts and error/warning totals per check name. 3. Markdown output includes `## Validator Results` section. 4. JSON output includes `validator_summary` in envelope. | TASK-02 | Must handle mixed records (some with results, some legacy without) |

## Tasks

### TASK-01: Add deterministic_check_results to record type, builder, CLI, and dedupe key

- **Type:** IMPLEMENT
- **Deliverable:** code-change to `scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry.ts` and test file
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-12)
- **Affects:** `scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-workflow-telemetry.test.ts`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 90%
  - Implementation: 90% - follows exact `per_module_bytes` pattern: add optional field to interface, populate in builder, include in dedupe key, add CLI flag with `multiple: true`
  - Approach: 90% - single approach, proven pattern, no architectural decision
  - Impact: 90% - directly enables downstream report generation
- **Acceptance:**
  - `WorkflowStepTelemetryRecord` interface has `deterministic_check_results?: Record<string, { valid: boolean; error_count: number; warning_count: number }>`
  - `CheckResultSummary` interface exported for consumer use
  - `buildWorkflowStepTelemetryRecord()` populates field from parsed `--check-result` flags
  - `computeTelemetryKey()` includes `deterministic_check_results` in hash input
  - CLI accepts `--check-result <name>:<pass|fail>:<errors>:<warnings>` (repeatable via `multiple: true`)
  - Records without `--check-result` flags have `deterministic_check_results: undefined` (backward compatible)
- **Engineering Coverage:**
  - UI / visual: N/A — no UI
  - UX / states: N/A — no user-facing states
  - Security / privacy: N/A — internal tooling
  - Logging / observability / audit: Required — new field captures validator outcomes in telemetry
  - Testing / validation: Required — TC-01 through TC-04 cover field construction, CLI parsing, dedupe, and backward compat
  - Data / contracts: Required — interface addition, dedupe key change
  - Performance / reliability: N/A — no hot path
  - Rollout / rollback: N/A — additive optional field
- **Validation contract (TC-XX):**
  - TC-01: Build record with `--check-result validate-fact-find.sh:pass:0:2` → `deterministic_check_results` contains `{ "validate-fact-find.sh": { valid: true, error_count: 0, warning_count: 2 } }`
  - TC-02: Build record with multiple `--check-result` flags → all entries present in `deterministic_check_results`
  - TC-03: Build record without `--check-result` flags → `deterministic_check_results` is `undefined`
  - TC-04: Two records with same `deterministic_checks` array but different `deterministic_check_results` values (e.g., different `error_count` per check) → different telemetry keys (dedupe regression test)
- **Execution plan:** Red -> Green -> Refactor
  - Red: Add TC-01 through TC-04 tests expecting new field behavior
  - Green: Add `CheckResultSummary` interface, `deterministic_check_results` to `WorkflowStepTelemetryRecord`, parse `--check-result` flags in CLI, populate in builder, include in dedupe key
  - Refactor: Extract `--check-result` parsing into a helper function if the parser is >10 lines
- **Planning validation (required for M/L):** None: S-effort task
- **Consumer tracing:**
  - New output: `deterministic_check_results` field on `WorkflowStepTelemetryRecord`
  - Consumers: TASK-02 report generator (`computeValidatorSummary`), `computeTelemetryKey()` (same task)
  - Consumer `summarizeWorkflowStepTelemetry` is unchanged because it does not read `deterministic_check_results` — it already handles unknown optional fields via its existing aggregation logic
  - Consumer `computePerModuleBreakdown` is unchanged — it reads `per_module_bytes` only
  - Ideas rollup code ignores `workflow_step` records entirely
- **Scouts:** None: proven pattern from C003
- **Edge Cases & Hardening:**
  - Malformed `--check-result` flag (missing parts) → skip with warning, do not fail entire record
  - Duplicate check names in multiple `--check-result` flags → last wins
  - `--check-result` name not in `--deterministic-check` → auto-append name to `deterministic_checks` array before building record (prevents inconsistent records where results exist without names)
- **What would make this >=90%:**
  - Already at 90%. Would reach 95% with a verified prototype of the colon-delimited parser.
- **Rollout / rollback:**
  - Rollout: merge to dev; field immediately available for next telemetry recording
  - Rollback: revert commit; old records unaffected
- **Documentation impact:**
  - Schema doc update deferred to TASK-02
- **Notes / references:**
  - Pattern precedent: `per_module_bytes` field added in C003 (same files, same builder, same dedupe key)
- **Build evidence:**
  - Commit: ecea901888
  - Post-build validation: Mode 2 (Data Simulation), Attempt 1, Pass
  - Data simulation: `--check-result validate-plan.sh:pass:0:1 --check-result validate-engineering-coverage.sh:fail:2:0` → `deterministic_check_results` correctly populated with both entries
  - No check-result → `deterministic_check_results` absent from JSON output (undefined)
  - Auto-append verified: check names from `--check-result` added to `deterministic_checks`
  - Typecheck: pass (npx tsc --noEmit -p scripts/tsconfig.json)
  - Engineering coverage: Logging/observability — new field captures validator outcomes ✓; Testing — TC-01 through TC-04 written ✓; Data/contracts — CheckResultSummary interface exported, dedupe key includes new field ✓

### TASK-02: Add validator results to report generator and update schema doc

- **Type:** IMPLEMENT
- **Deliverable:** code-change to `scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry-report.ts`, test file, and `docs/business-os/startup-loop/ideas/lp-do-ideas-telemetry.schema.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-12)
- **Affects:** `scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry-report.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-workflow-telemetry-report.test.ts`, `docs/business-os/startup-loop/ideas/lp-do-ideas-telemetry.schema.md`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% - follows `computePerModuleBreakdown` pattern for aggregation function
  - Approach: 85% - report section design is straightforward; slight uncertainty on optimal markdown table layout for mixed records
  - Impact: 80% - report becomes useful for quality visibility; impact limited to manual report runs
- **Acceptance:**
  - New exported function `computeValidatorSummary(records, filters)` returns per-check pass/fail counts and aggregate error/warning totals
  - `formatMarkdown()` includes `## Validator Results` section when quality data is present
  - JSON output envelope includes `validator_summary` alongside existing `summary` and `per_module_breakdown`
  - Schema doc bumped to v1.6.0 with `deterministic_check_results` field documented
  - Legacy records (without `deterministic_check_results`) handled gracefully — counted as "no quality data"
- **Engineering Coverage:**
  - UI / visual: N/A — no UI
  - UX / states: N/A — no user-facing states
  - Security / privacy: N/A — internal tooling
  - Logging / observability / audit: Required — report now surfaces quality data
  - Testing / validation: Required — TC-05 through TC-08 cover aggregation, filtering, legacy handling, markdown output
  - Data / contracts: Required — report envelope change, schema doc update
  - Performance / reliability: N/A — no hot path
  - Rollout / rollback: N/A — additive report section
- **Validation contract (TC-XX):**
  - TC-05: `computeValidatorSummary` with 2 records having `deterministic_check_results` → aggregates pass counts and error/warning totals per check name
  - TC-06: `computeValidatorSummary` with featureSlug filter → only matching records included
  - TC-07: Mixed records (some with `deterministic_check_results`, some without) → function counts records with data vs total, excludes legacy from aggregation
  - TC-08: `formatMarkdown` with validator summary data → output contains `## Validator Results` section with per-check table
- **Execution plan:** Red -> Green -> Refactor
  - Red: Add TC-05 through TC-08 tests
  - Green: Implement `computeValidatorSummary`, update `formatMarkdown` signature to accept validator summary data (third parameter or options object), add `## Validator Results` section to markdown output, add `validator_summary` to JSON envelope, update schema doc
  - Refactor: Simplify if aggregation logic overlaps with `computePerModuleBreakdown`
- **Planning validation (required for M/L):** None: S-effort task
- **Consumer tracing:**
  - New output: `validator_summary` in JSON report envelope; `## Validator Results` section in markdown
  - Consumers: human operator reading markdown reports; no automated consumers of the JSON envelope
  - Consumer `summarizeWorkflowStepTelemetry` is unchanged — it does not produce quality data
- **Scouts:** None: proven pattern from C003 report generator changes
- **Edge Cases & Hardening:**
  - All records lack `deterministic_check_results` → `## Validator Results` section omitted (not an error)
  - `deterministic_check_results` present but empty `{}` → treated as "no checks recorded"
- **What would make this >=90%:**
  - Verify that the markdown table layout is readable with 3-4 check names across multiple records
- **Rollout / rollback:**
  - Rollout: merge to dev; report immediately shows quality data for new records
  - Rollback: revert commit; report falls back to existing size/token/module output
- **Documentation impact:**
  - Schema doc `lp-do-ideas-telemetry.schema.md` updated inline as part of this task (v1.5.0 → v1.6.0)
- **Notes / references:**
  - Pattern precedent: `computePerModuleBreakdown` and per-module markdown section added in C003
- **Build evidence (TASK-02):**
  - `computeValidatorSummary()` exported from `lp-do-ideas-workflow-telemetry-report.ts` — aggregates `CheckResultSummary` per check name with pass/fail counts and error/warning totals
  - `formatMarkdown()` updated with third parameter for validator summary; renders `## Validator Results` table when data present
  - JSON envelope extended with `validator_summary` and `validator_record_count` fields
  - Schema doc bumped to v1.6.0 with `deterministic_check_results` field documented in Section 4A table and Section 10 changelog
  - TC-08 through TC-11 test cases added covering aggregation, filtering, mixed legacy records, and output shape
  - TypeScript compiles clean, ESLint passes
  - Legacy records handled gracefully: `undefined` and empty `{}` both treated as "no quality data"

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Colon-delimited `--check-result` format breaks on unusual validator names | Very Low | Low | No current validator names contain colons; document naming constraint; use last-3-colons parsing |
| Agents forget to pass `--check-result` flag | Medium | Medium | Field is optional so safe; skill instructions already specify the flag; future: consider inline validator execution as fallback |
| Warning semantics diverge across validators | Low | Low | Map uniformly: `error_count` = blocking issues/errors count; `warning_count` = warnings count or 0 |

## Observability

- Logging: Telemetry records now contain validator pass/fail — the feature IS the observability improvement
- Metrics: Report generator surfaces aggregate pass rates and error counts
- Alerts/Dashboards: None planned (non-goal)

## Acceptance Criteria (overall)

- [ ] `WorkflowStepTelemetryRecord` includes `deterministic_check_results` optional field
- [ ] CLI accepts `--check-result` repeatable flag
- [ ] Report generator shows `## Validator Results` section when quality data present
- [ ] Schema doc at v1.6.0
- [ ] All existing tests pass (backward compatibility)
- [ ] Typecheck + lint pass
- [ ] 8 TC contracts implemented and passing

## Decision Log

- 2026-03-12: Analysis chose Option A (compact summary field) over Option B (full results) and Option C (separate log). Rationale: compact record size, uniform shape, simple CLI flag design.
- 2026-03-12: Merged interface+builder+CLI+dedupe into single TASK-01 (S-effort) rather than splitting — all changes are in one file and tightly coupled.

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Add deterministic_check_results to record type, builder, CLI, and dedupe key | Yes — no dependencies; entry points verified at telemetry.ts:26-59 (interface), :434 (builder), :646 (CLI), :294 (dedupe key) | None | No |
| TASK-02: Add validator results to report generator and update schema doc | Yes — depends on TASK-01 for new type export; report.ts already imports from telemetry.ts | None | No |

## Overall-confidence Calculation

- TASK-01: 90% × S(1) = 90
- TASK-02: 85% × S(1) = 85
- Overall = (90 + 85) / (1 + 1) = 87.5% → 88%
