---
Type: Analysis
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: do-workflow-deliverable-quality-metrics
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/do-workflow-deliverable-quality-metrics/fact-find.md
Related-Plan: docs/plans/do-workflow-deliverable-quality-metrics/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Deliverable Quality Metrics Analysis

## Decision Frame

### Summary

The fact-find confirmed that deterministic validators produce structured JSON results (pass/fail, error counts, blocking issues) but these results are discarded after the agent reads them. The telemetry record stores only script names. The decision is: what shape should the captured validator data take in the telemetry record, and how should it flow from validators to the record?

### Goals

- Capture validator pass/fail results in telemetry records
- Enable the report generator to surface quality/completeness data

### Non-goals

- Adding new validators (e.g. `validate-build-record.ts`)
- Changing validator logic or pass/fail criteria
- Real-time alerting or dashboards

### Constraints & Assumptions

- Constraints:
  - Backward-compatible with existing records (new field must be optional)
  - Must not break existing consumers (`summarizeWorkflowStepTelemetry`, `computePerModuleBreakdown`, ideas rollup)
  - Schema bump 1.5.0 -> 1.6.0
- Assumptions:
  - All three validators (`validate-fact-find`, `validate-engineering-coverage`, `validate-plan`) produce JSON to stdout
  - `parseArgs` in the telemetry CLI can handle the chosen input method

## Inherited Outcome Contract

- **Why:** Work can be marked complete even if it's missing key sections like engineering coverage evidence or outcome statements. Without checking completeness automatically, gaps only surface when someone manually reviews.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Validator pass/fail results are captured in workflow telemetry so completeness gaps are visible in reports without manual review
- **Source:** auto

## Fact-Find Reference

- Related brief: `docs/plans/do-workflow-deliverable-quality-metrics/fact-find.md`
- Key findings used:
  - `deterministic_checks: string[]` stores names only, no outcomes (telemetry.ts:44)
  - Three validators return typed result objects: `FactFindValidationResult` (`{ ready, score, criticalCount, blockingIssues[], warnings[] }`), `EngineeringCoverageValidationResult` (`{ valid, skipped, artifactType, track, errors[], warnings[] }`), `PlanValidationResult` (`{ valid, errors[], activeImplementTaskIds[] }`)
  - `per_module_bytes` additive-field pattern established by C003 — directly replicable
  - No `validate-build-record.ts` exists
  - `validate-analysis.sh` also exists as a fourth validator (for analysis artifacts) — same skill-runner infrastructure

## Evaluation Criteria

| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Compact record size | Telemetry JSONL is append-only and grows indefinitely; each record should stay small | High |
| Sufficient detail for reports | Report must show pass/fail and error counts to be useful | High |
| Uniform shape across validators | Different validators return different types; the captured field should normalize this | Medium |
| CLI ergonomics | Agents pass data via shell flags; complex JSON is error-prone in shell | Medium |
| Consumer simplicity | Report generator should aggregate without knowing validator-specific schemas | Medium |

## Options Considered

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A: Summary field | Add `deterministic_check_results?: Record<string, { valid: boolean; error_count: number; warning_count: number }>` — compact summary keyed by check name | Small record size; uniform shape; easy to aggregate in reports; simple CLI flag design (`--check-result name:valid:errors:warnings`) | Loses detail (specific error messages, task IDs, critique score); can't reconstruct blocking issues from summary alone | Summary may prove insufficient for debugging; adding more fields later requires another schema bump | Yes |
| B: Full results field | Add `deterministic_check_results?: Record<string, unknown>` — store entire validator JSON output per check | Full detail preserved; no information loss; easy to pass (just pipe stdout) | Large record size (validator results can be 10+ lines of JSON each); non-uniform shape makes aggregation harder; report generator must know each validator's schema or ignore detail | Record bloat; consumer complexity; schema evolution couples telemetry to validator internals | Yes |
| C: Separate quality log | Write a separate `quality-metrics.jsonl` alongside `telemetry.jsonl` — full detail in a separate stream | No record bloat in main telemetry; full detail preserved; independent evolution | Two files to maintain; report generator must join across streams; breaks single-stream contract; more complex persistence | Maintenance overhead; join complexity; fragmented observability | Inferior — eliminated |

## Engineering Coverage Comparison

| Coverage Area | Option A (Summary) | Option B (Full results) | Chosen implication |
|---|---|---|---|
| UI / visual | N/A | N/A | N/A |
| UX / states | N/A | N/A | N/A |
| Security / privacy | N/A | N/A | N/A |
| Logging / observability / audit | Pass/fail + error/warning counts visible in reports; sufficient for trend analysis | Full error messages visible; richer debugging but harder to aggregate | Option A: aggregation wins; debugging detail is available via the artifact itself |
| Testing / validation | Simple test assertions on fixed shape | Complex assertions on variable shapes per validator | Option A: uniform shape simplifies test contracts |
| Data / contracts | One typed interface addition; report generator consumes a single shape | `Record<string, unknown>` requires per-validator type guards or ignoring detail | Option A: clean contract boundary |
| Performance / reliability | ~50-100 bytes per check entry | ~500-2000 bytes per check entry (full JSON) | Option A: 10-20x smaller per record |
| Rollout / rollback | Additive optional field; backward compatible | Same | Same for both |

## Chosen Approach

- **Recommendation:** Option A — compact summary field.
- **Why this wins:** Record size stays small (critical for append-only JSONL that grows indefinitely). Uniform shape (`{ valid, error_count, warning_count }`) means the report generator aggregates without knowing validator internals. CLI flag design is straightforward (`--check-result <name>:<pass|fail>:<errors>:<warnings>`). Tests are simple assertions on a fixed interface. Detail is not lost — it lives in the artifact itself and can be recovered by re-running the validator.
- **What it depends on:** The compact format must be sufficient for report consumers. If debugging needs arise that require error messages in telemetry, a future schema bump can add an optional `details` field.

### Rejected Approaches

- **Option B (Full results)** — Rejected because it couples telemetry schema evolution to validator internal schemas, bloats records 10-20x, and makes report aggregation harder. The detail it preserves is already available by re-running validators on the artifact.
- **Option C (Separate quality log)** — Rejected because it breaks the single-stream contract, adds join complexity, and fragments observability for no clear benefit.

### Open Questions (Operator Input Required)

None. All design decisions are resolvable from evidence and established patterns.

## End-State Operating Model

| Area | Current state | Trigger | Delivered step-by-step end state | What remains unchanged | Risks / seams to carry into planning |
|---|---|---|---|---|---|
| Validator execution | Shell scripts run validators; JSON to stdout; agent reads result | Agent completes DO stage, validators pass | Same — no change to validator execution | Validator scripts, return types, exit codes | None |
| Telemetry recording | CLI accepts `--deterministic-check` (names only) | Agent calls CLI after validators pass | Agent calls CLI with `--check-result <name>:<pass|fail>:<errors>:<warnings>` for each validator run. CLI parses these into `deterministic_check_results` field. Record appended with both names and results. | JSONL path, dedupe logic, all other record fields | CLI flag parsing must handle shell quoting correctly |
| Report generation | Summary shows size/token/module metrics only | Operator runs report CLI | Report includes new `## Validator Results` section showing per-check pass/fail rates and aggregate error counts across records. JSON output includes `validator_summary` in envelope. | Existing summary dimensions unchanged | Report must handle mixed records (some with results, some without) |

## Planning Handoff

- Planning focus:
  - Add `deterministic_check_results` field to `WorkflowStepTelemetryRecord`, builder, and dedupe key
  - Add `--check-result` CLI flag parsing and record population
  - Add validator results aggregation to report generator (summary + markdown + JSON)
  - Update schema doc to v1.6.0
- Validation implications:
  - TC contracts for: record field construction, CLI flag parsing, report aggregation, dedupe key inclusion
  - Typecheck + lint must pass
  - Existing tests must continue to pass (backward compatibility)
- Sequencing constraints:
  - TASK-01 (interface + builder) must precede TASK-02 (CLI) and TASK-03 (report)
  - TASK-04 (schema doc) can run in parallel with TASK-03
- Risks to carry into planning:
  - CLI flag parsing for colon-delimited structured data — test with edge cases (validator names containing colons)

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| Colon-delimited format breaks on validator names with colons | Very Low | Low | No current validator names contain colons; format is internal convention | Use first 3 colons from right as delimiters, or document naming constraint |
| Agents forget to pass --check-result flag | Medium | Medium | Agent behavior is skill-driven; can't enforce at code level | Consider running validators inline in telemetry CLI as a fallback when no results provided |

## Planning Readiness

- Status: Go
- Rationale: Single viable approach chosen decisively. All entry points identified. Proven pattern (C003). No operator questions. Bounded scope with clear task seeds.
