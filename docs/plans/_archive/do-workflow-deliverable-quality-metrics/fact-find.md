---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: Platform
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: do-workflow-deliverable-quality-metrics
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/do-workflow-deliverable-quality-metrics/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260312075840-C004
Trigger-Why: Work can be marked complete even if it's missing key sections like engineering coverage evidence or outcome statements. Without checking completeness automatically, gaps only surface when someone manually reviews.
Trigger-Intended-Outcome: type: operational | statement: Validator pass/fail results are captured in workflow telemetry so completeness gaps are visible in reports without manual review | source: auto
artifact: fact-find
---

# Deliverable Quality Metrics Fact-Find Brief

## Scope

### Summary

The DO workflow pipeline (fact-find -> analysis -> plan -> build) has deterministic validators that check whether output artifacts contain required sections and fields. However, validator pass/fail results are not persisted to telemetry. The `WorkflowStepTelemetryRecord` tracks script names in `deterministic_checks: string[]` but has no field for check outcomes. This means there is no way to measure artifact quality over time without manually reviewing each artifact.

### Goals

- Capture validator pass/fail results in telemetry records so completeness gaps are visible in reports
- Enable the workflow telemetry report to surface quality/completeness data alongside existing size and token metrics

### Non-goals

- Adding new validators beyond what already exists (e.g. no new `validate-build-record.ts`)
- Changing what validators check or their pass/fail criteria
- Real-time alerting or dashboards
- Changing the validator invocation flow in skills

### Constraints & Assumptions

- Constraints:
  - Must be backward-compatible with existing telemetry records (new fields optional)
  - Must not break existing telemetry consumers (`summarizeWorkflowStepTelemetry`, `computePerModuleBreakdown`, ideas rollup code)
  - Telemetry schema version bump required (minor: 1.5.0 -> 1.6.0)
  - Validators are run as shell scripts; results must be captured from their stdout/exit codes
- Assumptions:
  - Validators already produce structured output (JSON) that can be parsed
  - The telemetry recording CLI can run validators inline or accept pre-computed results

## Outcome Contract

- **Why:** Work can be marked complete even if it's missing key sections like engineering coverage evidence or outcome statements. Without checking completeness automatically, gaps only surface when someone manually reviews.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Validator pass/fail results are captured in workflow telemetry so completeness gaps are visible in reports without manual review
- **Source:** auto

## Current Process Map

- Trigger: Agent completes a DO stage (fact-find, analysis, plan, or build) and validators pass
- Step 1: Agent runs deterministic validators (`validate-fact-find.sh`, `validate-engineering-coverage.sh`, `validate-plan.sh`)
- Step 2: If validators pass, agent runs `lp-do-ideas-record-workflow-telemetry` CLI with `--deterministic-check <script-name>` flags
- Step 3: CLI builds a `WorkflowStepTelemetryRecord`, recording script names in `deterministic_checks[]` and count in `deterministic_check_count`
- Step 4: Record is appended to `docs/business-os/startup-loop/ideas/trial/telemetry.jsonl`
- Step 5: Report generator (`lp-do-ideas-workflow-telemetry-report.ts`) reads records and produces summary with size/token metrics
- End condition: Telemetry record persisted, report available on demand

### Process Areas

| Area | Current step-by-step flow | Owners / systems / handoffs | Evidence refs | Known issues |
|---|---|---|---|---|
| Validator execution | Shell scripts run TS validators via `pnpm --filter skill-runner validate-*`; exit 0 = pass, non-zero = fail; JSON to stdout | Agent (caller) -> shell script -> skill-runner | `scripts/validate-fact-find.sh`, `packages/skill-runner/src/validate-fact-find.ts` | Exit code and JSON output are consumed by agent but NOT passed to telemetry recorder |
| Telemetry recording | CLI accepts `--deterministic-check` flags (names only); builds record; appends to JSONL | Agent -> `lp-do-ideas-workflow-telemetry.ts` CLI | `scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry.ts:80-90` (options interface) | `deterministic_checks` stores script names but no outcomes; no `--deterministic-check-result` flag exists |
| Report generation | Reads JSONL, filters by feature/business, aggregates size/token/module metrics | `lp-do-ideas-workflow-telemetry-report.ts` | `scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry-report.ts` | No quality/completeness dimension in summary output |

## Evidence Audit (Current State)

### Entry Points

- `scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry.ts` — telemetry record builder and CLI
- `scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry-report.ts` — report generator
- `packages/skill-runner/src/validate-fact-find.ts` — fact-find validator (returns `FactFindValidationResult`)
- `packages/skill-runner/src/validate-engineering-coverage.ts` — engineering coverage validator (returns `EngineeringCoverageValidationResult`)

### Key Modules / Files

- `packages/skill-runner/src/validate-fact-find.ts` — checks 7 required sections, frontmatter Status, Delivery-Readiness >= 60, critique score. Returns `{ ready, score, criticalCount, blockingIssues[], warnings[] }`
- `packages/skill-runner/src/validate-engineering-coverage.ts` — checks artifact type, execution track, required section name, 8 canonical coverage areas. Returns `{ valid, skipped, artifactType, track, errors[], warnings[] }`
- `packages/skill-runner/src/validate-plan.ts` — checks 10 frontmatter fields, valid status/track/deliverable values, 6 required sections, IMPLEMENT task confidence >= 80 for Active status. Returns `PlanValidationResult`: `{ valid: boolean; errors: PlanValidationError[]; warnings: string[] }` where each error has `{ scope, message, section?, taskId? }`
- `scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry.ts` — `WorkflowStepTelemetryRecord` interface (lines 26-59), `buildWorkflowStepTelemetryRecord()` builder, CLI with `--deterministic-check` flag
- `scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry-report.ts` — `summarizeWorkflowStepTelemetry()` and `computePerModuleBreakdown()` functions, markdown/JSON output
- `docs/business-os/startup-loop/ideas/lp-do-ideas-telemetry.schema.md` — schema doc at v1.5.0

### Patterns & Conventions Observed

- Additive optional fields pattern: new telemetry fields are added as optional (e.g. `per_module_bytes?: Record<string, number>`) with backward compatibility — evidence: `lp-do-ideas-workflow-telemetry.ts:58`
- Validators return typed result objects: `FactFindValidationResult`, `EngineeringCoverageValidationResult` — evidence: `validate-fact-find.ts:5-11`, `validate-engineering-coverage.ts:23-37`
- CLI flag-per-field pattern: telemetry CLI uses `--deterministic-check` (repeatable) for script names — evidence: `lp-do-ideas-workflow-telemetry.ts` CLI section
- Schema version bumping: minor bumps for new optional fields (1.4.0 -> 1.5.0 for `per_module_bytes`) — evidence: `lp-do-ideas-telemetry.schema.md` version history
- Dedupe key includes all material fields: `computeTelemetryKey()` hashes record fields to prevent duplicates — evidence: `lp-do-ideas-workflow-telemetry.ts`

### Data & Contracts

- Types/schemas/events:
  - `WorkflowStepTelemetryRecord` interface — the central telemetry record type
  - `FactFindValidationResult` — `{ ready: boolean; score: number | null; criticalCount: number; blockingIssues: string[]; warnings: string[] }`
  - `EngineeringCoverageValidationResult` — `{ valid: boolean; skipped: boolean; artifactType: string | null; track: string | null; errors: EngineeringCoverageValidationError[]; warnings: string[] }`
  - Telemetry schema: `docs/business-os/startup-loop/ideas/lp-do-ideas-telemetry.schema.md` v1.5.0
- Persistence:
  - `docs/business-os/startup-loop/ideas/trial/telemetry.jsonl` — append-only JSONL
- API/contracts:
  - CLI interface: `pnpm --filter scripts startup-loop:lp-do-ideas-record-workflow-telemetry -- --stage <stage> --feature-slug <slug> --deterministic-check <script>`
  - Report CLI: `pnpm --filter scripts startup-loop:lp-do-ideas-report-workflow-telemetry -- --feature-slug <slug> --format json|markdown`

### Dependency & Impact Map

- Upstream dependencies:
  - Validators in `packages/skill-runner/src/` — produce the results to capture
  - Agent skill orchestrators — invoke validators and telemetry CLI
- Downstream dependents:
  - Report generator reads telemetry records — must handle new optional field
  - Ideas rollup code ignores `workflow_step` records — unaffected
  - Any future dashboards or alerting would consume this data
- Likely blast radius:
  - `WorkflowStepTelemetryRecord` interface (additive change)
  - `buildWorkflowStepTelemetryRecord()` builder function
  - `computeTelemetryKey()` dedupe function
  - Report generator summary and markdown output
  - Telemetry schema doc
  - Test files for telemetry and report

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (governed runner)
- Commands: `pnpm -w run test:governed -- jest -- --config=scripts/jest.config.cjs --testPathPattern=<pattern>`
- CI integration: Tests run in CI only per testing policy

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Telemetry builder | Unit | `scripts/src/startup-loop/__tests__/lp-do-ideas-workflow-telemetry.test.ts` | Tests record construction, per_module_bytes, dedupe key divergence, runtime token capture |
| Report generator | Unit | `scripts/src/startup-loop/__tests__/lp-do-ideas-workflow-telemetry-report.test.ts` | Tests per-module breakdown aggregation, filtering, legacy record handling |
| Fact-find validator | Unit | Integrated in skill-runner tests | Tests section presence, frontmatter, critique score |
| Engineering coverage validator | Unit | Integrated in skill-runner tests | Tests artifact type detection, track filtering, coverage area presence |

#### Coverage Gaps

- Untested paths:
  - No test verifies that validator results flow into telemetry records (integration gap — this is exactly the gap this feature closes)
- Extinct tests:
  - None identified

#### Testability Assessment

- Easy to test:
  - New optional field on `WorkflowStepTelemetryRecord` — same pattern as `per_module_bytes`
  - Report generator consuming new field — same pattern as per-module breakdown
  - Dedupe key including new field — same pattern as existing tests
- Hard to test:
  - CLI integration (validator execution -> telemetry recording) — requires filesystem mocking or integration test
- Test seams needed:
  - None new — existing test patterns for the telemetry builder and report generator are sufficient

#### Recommended Test Approach

- Unit tests for: new record field construction, report generator quality section, dedupe key with quality data
- Integration tests for: not required — unit tests cover the logic; CLI integration is tested by existing patterns
- Contract tests for: schema doc field definition matches TypeScript interface

### Recent Git History (Targeted)

- `scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry.ts` — recently modified to add `per_module_bytes` field (C003 build, committed today)
- `scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry-report.ts` — recently modified to add `computePerModuleBreakdown()` and per-module report section (C003 build, committed today)
- `docs/business-os/startup-loop/ideas/lp-do-ideas-telemetry.schema.md` — bumped to v1.5.0 for `per_module_bytes` (C003 build, committed today)

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | N/A | No UI component — internal telemetry data pipeline | - | - |
| UX / states | N/A | No user-facing states — CLI and data records | - | - |
| Security / privacy | N/A | Internal tooling reading local files; no auth, no user data | - | - |
| Logging / observability / audit | Required | Telemetry system is itself the observability layer. Currently tracks script names but not outcomes. | Gap: validator outcomes not captured — this is the core deliverable | Must capture pass/fail, error counts, and optionally blocking-issue details |
| Testing / validation | Required | Existing tests cover record building, report generation, dedupe. Test patterns are well-established. | Gap: no tests for quality-metrics fields yet (they don't exist yet) | Add TC contracts for new field construction, report rendering, dedupe inclusion |
| Data / contracts | Required | `WorkflowStepTelemetryRecord` interface, telemetry schema doc v1.5.0, report generator output format | Gap: no quality/completeness fields in the interface or schema | Add optional field(s) to interface, bump schema to 1.6.0, update report envelope |
| Performance / reliability | N/A | Append-only JSONL, no hot path — telemetry recording happens once per stage completion | - | - |
| Rollout / rollback | N/A | Additive optional field — old records without the field are handled by existing null-check pattern | - | - |

## Scope Signal

- **Signal:** right-sized
- **Rationale:** The change is tightly bounded: one new optional field on the telemetry record, one new CLI flag to accept validator results, one new report section. The pattern was just established by C003 (`per_module_bytes`) and can be followed exactly. No architecture decisions, no external research needed.

## Questions

### Resolved

- Q: What structured data do validators already produce?
  - A: `validate-fact-find.ts` returns `{ ready, score, criticalCount, blockingIssues[], warnings[] }`. `validate-engineering-coverage.ts` returns `{ valid, skipped, artifactType, track, errors[], warnings[] }`. Both produce JSON to stdout.
  - Evidence: `packages/skill-runner/src/validate-fact-find.ts:5-11`, `packages/skill-runner/src/validate-engineering-coverage.ts:23-37`

- Q: Does a `validate-build-record.ts` exist?
  - A: No. Build records are not validated by a deterministic script today. Only `check-archive-ready.ts` checks for required file existence (3 files).
  - Evidence: Searched `packages/skill-runner/src/` — no `validate-build-record` file exists

- Q: How should the new field be structured?
  - A: Follow the `per_module_bytes` pattern — an optional field on `WorkflowStepTelemetryRecord`. All three validators return typed result objects with `valid/ready: boolean` and arrays of errors/blocking issues. The unified capture format should be designed during analysis after comparing all three return types.
  - Evidence: `validate-fact-find.ts:5-11` (`FactFindValidationResult`), `validate-engineering-coverage.ts:23-37` (`EngineeringCoverageValidationResult`), `validate-plan.ts:16` (`PlanValidationResult`)

- Q: Will adding new fields break existing consumers?
  - A: No. Ideas rollup code ignores `workflow_step` records entirely. The report generator and summary function already handle optional fields gracefully (null checks on `per_module_bytes`).
  - Evidence: Schema doc Section 4A notes "These records do not affect queue-transition metrics or ideas-cycle rollups."

### Open (Operator Input Required)

None. All decisions can be resolved from codebase evidence and established patterns.

## Confidence Inputs

- Implementation: 90% — follows exact pattern of C003 `per_module_bytes` addition. Same files, same test patterns, same schema bump process. Evidence: C003 build just completed successfully with identical scope shape.
- Approach: 85% — single viable approach (additive optional field + CLI flag + report section). No architectural fork. Slight uncertainty around CLI flag design for passing structured JSON through shell scripts. Would reach 90% after prototyping the CLI interface.
- Impact: 85% — directly closes the stated gap. Quality data becomes visible in reports. Would reach 90% if a `validate-build-record.ts` were also added (but that's a non-goal for this scope).
- Delivery-Readiness: 90% — all entry points identified, all patterns established, all test patterns known.
- Testability: 90% — follows established TC patterns from C003. Easy to test in isolation.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Validator JSON output format varies between validators | Low | Low | Each validator has a typed return interface; parse by type. Schema is stable. |
| CLI flag parsing complexity for structured data | Low | Medium | Use `--check-result` flag with JSON string, or a temp file path. Follow existing `--deterministic-check` repeatable flag pattern. |
| Agents omit --check-result flag, leaving field perpetually null | Medium | Medium | Field is optional so null is safe, but defeats purpose. Mitigation: make flag easy to use (accept file path or inline JSON); consider defaulting to running validators inline if no result provided. |

## Planning Constraints & Notes

- Must-follow patterns:
  - Follow `per_module_bytes` additive-field pattern exactly
  - Use existing validator result types (`FactFindValidationResult`, `EngineeringCoverageValidationResult`) as the source of truth for what to capture
  - Minor schema version bump (1.5.0 -> 1.6.0)
- Rollout/rollback expectations:
  - Additive optional field — no rollback needed. Old records without the field work unchanged.
- Observability expectations:
  - The change IS the observability improvement — validator outcomes become visible in telemetry reports

## Suggested Task Seeds (Non-binding)

1. Add `deterministic_check_results` field to `WorkflowStepTelemetryRecord`, builder, and dedupe key
2. Add `--check-result` CLI flag to accept validator outcomes during telemetry recording
3. Add quality/completeness section to report generator (summary + markdown + JSON)
4. Update schema doc to v1.6.0 with new field documentation
5. Add unit tests for new field construction, report rendering, and dedupe inclusion

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package: TC contracts for new field, report section, dedupe behavior; typecheck + lint pass; schema doc updated
- Post-delivery measurement plan: Run report with `--format markdown` on next completed build cycle to verify quality data appears

## Evidence Gap Review

### Gaps Addressed

- Confirmed validator output types are structured and parseable (not just exit codes)
- Confirmed no `validate-build-record.ts` exists — out of scope for this feature
- Confirmed existing consumers handle optional fields gracefully
- Confirmed C003 pattern is directly replicable

### Confidence Adjustments

- No downward adjustments needed. All evidence paths converged on a clear, bounded solution.

### Remaining Assumptions

- Validator JSON output format will remain stable (low risk — typed interfaces)
- CLI can accept structured data via flag or environment (standard Node.js parseArgs capability)

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Telemetry record interface | Yes | None | No |
| Record builder function | Yes | None | No |
| Dedupe key computation | Yes | None | No |
| CLI flag parsing | Yes | None | No |
| Report generator summary | Yes | None | No |
| Report generator markdown/JSON output | Yes | None | No |
| Schema doc update | Yes | None | No |
| Test landscape | Yes | None | No |
| Backward compatibility | Yes | None | No |

## Analysis Readiness

- Status: Ready-for-analysis
- Blocking items: None
- Recommended next step: `/lp-do-analysis do-workflow-deliverable-quality-metrics`
