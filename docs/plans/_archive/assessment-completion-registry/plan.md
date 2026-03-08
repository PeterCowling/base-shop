---
Type: Plan
Status: Archived
Domain: Startup-Loop
Workstream: Engineering
Created: 2026-03-03
Last-reviewed: 2026-03-03
Last-updated: 2026-03-03
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: assessment-completion-registry
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Assessment Completion Registry Plan

## Summary

Build a deterministic filesystem scanner that reads assessment artifacts across 5 businesses and produces a JSON registry answering "which ASSESSMENT stages has `<BIZ>` completed and when?" from a single file read. The scanner follows the established `baselines-freshness.ts` pattern (injectable options, testable, no side effects) with a hardcoded stage-to-filename mapping table covering all 14 ASSESSMENT stages. A CLI wrapper provides human-readable matrix output. Unit tests validate the scanner against temp-dir fixtures.

## Active tasks
- [x] TASK-01: Build assessment completion scanner module
- [x] TASK-02: Write scanner unit tests
- [x] TASK-03: Build CLI wrapper and register pnpm script

## Goals
- Programmatic per-business per-stage assessment completion registry
- Single JSON file read answers "what's complete?" for any business
- Human-readable CLI output for operator visibility
- Deterministic: same filesystem state produces same registry output

## Non-goals
- Changing assessment gate logic (registry is read infrastructure)
- Migrating event ledger or derive-state.ts architecture
- Restructuring assessment artifact filesystem layout
- Wiring advancement gates to consume the registry (separate concern)
- mcp-preflight integration (additive follow-on)

## Constraints & Assumptions
- Constraints:
  - Must be backward-compatible with existing `cmd-advance.md` gate checks
  - Must not introduce external dependencies (all data is repo-local)
  - Registry must be deterministic — same filesystem state produces same output
  - Follow `baselines-freshness.ts` pattern (injectable options, testable, no side effects)
  - Tests run in CI only (governed Jest entrypoint)
- Assumptions:
  - 14 ASSESSMENT stages defined across two sources: `stage-operator-dictionary.yaml` (01-11) and `loop-spec.yaml` (13-15). ASSESSMENT-12 is skill-only, not a stage.
  - Assessment artifacts follow mixed filename patterns (dated and undated)
  - No event ledger runs exist yet — scanner is filesystem-only
  - 5 businesses: BRIK, HBAG, HEAD, PET, PWRB

## Inherited Outcome Contract

- **Why:** Assessment completion state is invisible to the loop without manual filesystem traversal. When deciding what stage a business is at, or which assessments remain, there's no single query — you have to glob 5 directories and parse dates from filenames.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A programmatic assessment completion registry exists that can answer "which ASSESSMENT stages has `<BIZ>` completed and when?" from a single file read, populated by a deterministic scanner.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/assessment-completion-registry/fact-find.md`
- Key findings used:
  - 14 ASSESSMENT stages from two YAML sources (01-11 from dictionary, 13-15 from loop-spec)
  - Mixed filename patterns (dated and undated) across 5 businesses
  - `baselines-freshness.ts` establishes exact reusable scanner pattern
  - No programmatic completion tracking exists
  - HBAG `index.user.md` provides reference pattern for manual completion table
  - ASSESSMENT-09 (intake) is a sync process without a distinct output artifact
  - ASSESSMENT-04 (candidate-names) uses `naming-workbench/` directory in some businesses

## Proposed Approach
- Option A: Hardcoded stage-to-pattern mapping table in scanner — stage IDs and their expected filename patterns are defined in a TypeScript lookup. Scanner reads business directories from filesystem, applies patterns, produces JSON.
- Option B: Dynamic pattern extraction from YAML files — parse comments in `loop-spec.yaml` for artifact patterns.
- Chosen approach: Option A. The filename patterns in `loop-spec.yaml` are in YAML comments, not structured data. A hardcoded mapping table is simpler, fully testable, and the 14-stage set is stable (changes require loop-spec version bumps). The mapping table is verified against all 5 businesses' actual files during fact-find.

### Stage-to-Filename Mapping Table (Design Artifact)

| Stage | name_machine | Filename pattern(s) | Notes |
|---|---|---|---|
| ASSESSMENT-01 | problem-framing | `*problem-statement.user.md`, `*problem-framing.user.md`, `current-problem-framing.user.md` | Dated or undated |
| ASSESSMENT-02 | solution-profiling-scan | `*solution-profile-results.user.md` | Dated |
| ASSESSMENT-03 | solution-selection | `*solution-decision.user.md` | Dated |
| ASSESSMENT-04 | candidate-names | `naming-workbench/*candidate-names*.user.md` OR `naming-workbench/*naming-shortlist*.user.md` | File inside workbench dir; directory alone is insufficient; PWRB uses shortlist pattern |
| ASSESSMENT-05 | name-selection | `name-selection-spec.md` (assessment root) OR `naming-workbench/*naming-generation-spec*.md` | Undated; conditional (optional); two valid locations |
| ASSESSMENT-06 | distribution-profiling | `*launch-distribution-plan.user.md` | Dated |
| ASSESSMENT-07 | measurement-profiling | `*measurement-profile.user.md` | Dated |
| ASSESSMENT-08 | current-situation | `*operator-context.user.md` | Dated |
| ASSESSMENT-09 | intake | (none) | No distinct output artifact; special case |
| ASSESSMENT-10 | brand-profiling | `*brand-profile.user.md` | Dated |
| ASSESSMENT-11 | brand-identity | `*brand-identity-dossier.user.md` | Dated |
| ASSESSMENT-13 | product-naming | `*product-naming.user.md` (assessment root) OR `naming-workbench/*product-naming*.user.md` | Dated; actual artifacts found in naming-workbench subdirectory |
| ASSESSMENT-14 | logo-brief | `*logo-brief.user.md` | Dated |
| ASSESSMENT-15 | packaging-brief | `*packaging-brief.user.md` | Dated; conditional (physical-product) |

**Subdirectory scanning rule:** Scanner must scan both the assessment root (`strategy/<BIZ>/assessment/`) and the `naming-workbench/` subdirectory for ASSESSMENT-04, ASSESSMENT-05, and ASSESSMENT-13 artifacts. Other stages are assessment-root only.

Files that do NOT map to stages and must be ignored: `.html` files, `.agent.md` files, `s0a-research-appendix.user.md`, `s1-readiness.user.md`, `DEC-*` files, `*-scorecard.*`, `*-action-backlog.*`, `messaging-hierarchy.*`, `*-gate-dry-run.*`, workspace files inside `naming-workbench/` that don't match stage patterns (prompts, RDAP checks, TM checks, sidecars).

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Build assessment completion scanner module | 85% | M | Complete (2026-03-03) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Write scanner unit tests | 85% | M | Complete (2026-03-03) | TASK-01 | - |
| TASK-03 | IMPLEMENT | Build CLI wrapper and register pnpm script | 85% | S | Complete (2026-03-03) | TASK-01 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Core scanner module |
| 2 | TASK-02, TASK-03 | TASK-01 | Tests and CLI can be built in parallel |

## Tasks

### TASK-01: Build assessment completion scanner module
- **Type:** IMPLEMENT
- **Deliverable:** `scripts/src/startup-loop/assessment/assessment-completion-scanner.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-03)
- **Affects:** `scripts/src/startup-loop/assessment/assessment-completion-scanner.ts`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 85%
  - Implementation: 85% - Clear pattern from `baselines-freshness.ts`; stage-to-filename mapping verified against all 5 businesses' actual file listings
  - Approach: 90% - Deterministic filesystem scanner is the established pattern in this codebase; ASSESSMENT-09 has no distinct output artifact but is handled as a known special case
  - Impact: 85% - Enables immediate operator visibility; downstream consumers (mcp-preflight, advancement gates) can be wired as separate follow-ons
- **Acceptance:**
  - Scanner exports `scanAssessmentCompletion(options)` function following `baselines-freshness` pattern
  - Stage-to-filename mapping covers all 14 ASSESSMENT stages (01-11, 13-15)
  - Handles both dated (`<YYYY-MM-DD>-<type>.user.md`) and undated (`<type>.user.md`) filename patterns
  - ASSESSMENT-09 (intake) handled as special case: `no_artifact_pattern` status
  - ASSESSMENT-05 (name-selection) and ASSESSMENT-15 (packaging-brief) marked as conditional in output
  - ASSESSMENT-04 (candidate-names) detects `*candidate-names*.user.md` files inside `naming-workbench/` directory (directory existence alone is not sufficient — it may contain only workspace files)
  - Produces structured result array with per-business per-stage completion records
  - Each record includes: `business`, `stage_id`, `stage_name`, `status` (`complete` | `not_found` | `no_artifact_pattern`), `artifact_path` (if found), `artifact_date` (from filename or frontmatter), `conditional` flag
  - Options are injectable: `strategyRoot`, `businesses` (optional override), `nowMs`
  - Output is deterministic: same filesystem state produces same output
  - Exports types: `AssessmentCompletionResult`, `AssessmentCompletionOptions`, `AssessmentStageStatus`
- **Validation contract (TC-XX):**
  - TC-01: Scanner with valid strategy directory containing HBAG-like artifacts → returns correct completion records for all found stages
  - TC-02: Scanner with empty business directory → returns `not_found` for all file-based stages and `no_artifact_pattern` for ASSESSMENT-09
  - TC-03: Scanner with dated filename (`2026-02-21-brand-profile.user.md`) → extracts correct date and maps to ASSESSMENT-10
  - TC-04: Scanner with undated filename (`current-problem-framing.user.md`) → maps to ASSESSMENT-01 with date from frontmatter or null
  - TC-05: Scanner with ASSESSMENT-09 → returns `no_artifact_pattern` status regardless of directory contents
  - TC-06: Scanner with conditional stages (05, 15) → sets `conditional: true` in output
  - TC-07: Scanner with non-existent `strategyRoot` and no `businesses` override → returns empty array; with `businesses` override → returns `not_found` for all stages of each listed business
  - TC-08: Scanner with multiple matching files for same stage → uses most recent (by filename date)
  - TC-09: Scanner with `naming-workbench/` containing `*candidate-names*.user.md` → maps to ASSESSMENT-04 as complete
  - TC-10: Scanner with `naming-workbench/` containing only workspace files (no `*candidate-names*.user.md`) → ASSESSMENT-04 returns `not_found`
  - TC-11: Scanner with `name-selection-spec.md` in assessment root → maps to ASSESSMENT-05 as complete
  - TC-12: Scanner with `naming-workbench/*naming-generation-spec*.md` and no root `name-selection-spec.md` → maps to ASSESSMENT-05 as complete
- **Execution plan:**
  - Red: Define exported types (`AssessmentCompletionResult`, `AssessmentCompletionOptions`, `AssessmentStageStatus`) and `STAGE_PATTERNS` mapping table. Export empty `scanAssessmentCompletion()` returning `[]`.
  - Green: Implement per-business directory scan, pattern matching against `STAGE_PATTERNS`, date extraction from filenames and frontmatter, result construction. Verify correct output for HBAG fixture.
  - Refactor: Extract date extraction into helper, handle `naming-workbench/` subdirectory scanning cleanly (ASSESSMENT-04, ASSESSMENT-05, and ASSESSMENT-13 artifacts all require scanning this subdirectory), ensure deterministic sort order (by business then stage_id).
- **Planning validation (required for M/L):**
  - Checks run: File inventory of all 5 businesses' assessment directories; `baselines-freshness.ts` pattern review; `stage-operator-dictionary.yaml` and `loop-spec.yaml` stage definitions verified
  - Validation artifacts: All 5 businesses' assessment directories inventoried (HBAG, HEAD, BRIK, PET, PWRB); `naming-workbench/` subdirectory contents verified across HBAG, HEAD, PET, PWRB
  - Unexpected findings: ASSESSMENT-04 completion artifact is `*candidate-names*.user.md` inside `naming-workbench/` (not directory existence alone); ASSESSMENT-05 has artifacts in two locations (assessment root and naming-workbench); HBAG `index.user.md` stage mappings not fully canonical (operator-context listed under -06 while loop-spec treats it as -08 output)
- **Scouts:** Verified `*candidate-names*.user.md` or `*naming-shortlist*.user.md` exists inside `naming-workbench/` across businesses (confirmed: HBAG has `2026-02-20-candidate-names.user.md` + `latest-candidate-names.user.md`, HEAD has `2026-02-20-candidate-names.user.md` + `latest-candidate-names.user.md`, PET has `2026-02-18-candidate-names.user.md`, PWRB uses `naming-shortlist-2026-02-26.user.md` — `naming-shortlist` pattern already formalized in mapping table)
- **Edge Cases & Hardening:**
  - Multiple files matching same stage pattern: use most recent by filename date (e.g., `2026-02-21-brand-identity-dossier.user.md` preferred over `2026-02-17-brand-identity-dossier.user.md`)
  - Business with no `assessment/` directory: return results for that business with all file-based stages as `not_found` and ASSESSMENT-09 as `no_artifact_pattern` (consistent with empty directory behavior — business is always represented in output when discovered)
  - File with no frontmatter date and undated filename: report as `artifact_date: null`
  - `.html` files, `.agent.md` files: ignored by pattern matching (patterns match `.user.md` or specific undated names only)
  - Non-assessment files in `assessment/` directory (scorecards, action backlogs, gate dry runs): ignored by explicit pattern matching — scanner only matches stage-specific patterns
- **What would make this >=90%:**
  - A working prototype confirming the stage-to-filename mapping table against all 5 businesses
  - Verification that `naming-workbench/` subdirectory scanning (ASSESSMENT-04 and ASSESSMENT-05 artifacts) works across all businesses
  - Confirmation of PWRB ASSESSMENT-04 detection (PWRB has `naming-shortlist` but not `candidate-names` pattern — may need pattern expansion)
- **Rollout / rollback:**
  - Rollout: Additive module — no existing behavior changes
  - Rollback: Delete the file; no consumers exist yet
- **Documentation impact:** None: scanner is internal tooling, documented by code and tests
- **Consumer tracing (new outputs):**
  - `scanAssessmentCompletion()` function → consumed by TASK-02 (tests), TASK-03 (CLI). No other existing consumers.
  - `AssessmentCompletionResult` type → consumed by TASK-02 (type imports), TASK-03 (CLI formatting). No other existing consumers.
  - `STAGE_PATTERNS` constant → internal to scanner; not exported. No consumers.
- **Notes / references:**
  - Follow `baselines-freshness.ts` pattern (lines 104-197): injectable options, per-business directory scan, structured result array
  - Stage-to-filename mapping table derived from `stage-operator-dictionary.yaml` artifacts field + `loop-spec.yaml` `bos_sync` comments + actual file inventory
- **Build evidence (2026-03-03):**
  - File created: `scripts/src/startup-loop/assessment/assessment-completion-scanner.ts` (457 lines)
  - TypeScript compilation: clean (zero errors via `pnpm --filter scripts exec tsc --noEmit`)
  - Exports: `scanAssessmentCompletion()`, `AssessmentCompletionResult`, `AssessmentCompletionOptions`, `AssessmentStageStatus`, `STAGE_PATTERNS`
  - All 14 stages implemented with pattern types: `exact`, `suffix`, `contains_suffix`
  - `naming-workbench/` subdirectory scanning for ASSESSMENT-04, -05, -13
  - Reuses `parseFrontmatterDate` from `baselines-freshness.ts`
  - Post-build validation:
    - Mode: 2 (Data Simulation)
    - Attempt: 1
    - Result: Pass
    - Evidence: Scanner run against actual `docs/business-os/strategy/` — 9 businesses auto-discovered, HBAG 12/14 complete, PWRB 5/14 complete, naming-workbench patterns correctly resolved, ASSESSMENT-09 always `no_artifact_pattern`, conditional flags correct on -05 and -15, edge cases (non-existent root, businesses override) verified
    - Degraded mode: No

### TASK-02: Write scanner unit tests
- **Type:** IMPLEMENT
- **Deliverable:** `scripts/src/startup-loop/__tests__/assessment-completion.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-03)
- **Affects:** `scripts/src/startup-loop/__tests__/assessment-completion.test.ts`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% - Test patterns well-established from `baselines-freshness.test.ts` (temp dirs, fixture files, async fs utilities)
  - Approach: 90% - Same test infrastructure used by adjacent test files; governed Jest entrypoint
  - Impact: 85% - Validates all 14 stage mappings and edge cases; provides regression safety
- **Acceptance:**
  - Tests cover all 14 ASSESSMENT stages with fixture files in temp directories
  - Tests cover happy path: business with multiple completed assessments returns correct records
  - Tests cover incomplete business: missing stages returned as `not_found`
  - Tests cover conditional stages: ASSESSMENT-05 and ASSESSMENT-15 flagged as `conditional: true`
  - Tests cover ASSESSMENT-09 special case: `no_artifact_pattern` status
  - Tests cover ASSESSMENT-04: `*candidate-names*.user.md` or `*naming-shortlist*.user.md` file detection inside `naming-workbench/` subdirectory
  - Tests cover edge cases: empty directory, non-existent directory, multiple matches for same stage (most recent wins)
  - Tests cover dated and undated filename patterns with correct date extraction
  - Tests use temp directories with `beforeEach`/`afterEach` cleanup (same pattern as `baselines-freshness.test.ts`)
  - All tests pass via governed runner: `pnpm -w run test:governed -- jest -- --config=scripts/jest.config.cjs --testPathPattern=assessment-completion`
- **Validation contract (TC-XX):**
  - TC-01: `pnpm -w run test:governed -- jest -- --config=scripts/jest.config.cjs --testPathPattern=assessment-completion` → all tests pass, zero failures
  - TC-02: Tests cover ≥10 distinct scenarios (happy path, empty dir, non-existent dir, dated filename, undated filename, conditional stages, ASSESSMENT-09 special case, ASSESSMENT-04 file-in-subdirectory, ASSESSMENT-13 subdirectory scan, multiple matches, frontmatter date extraction)
  - TC-03: No test uses real filesystem paths — all use temp directories created in `beforeEach`
- **Execution plan:**
  - Red: Write test scaffolding importing `scanAssessmentCompletion` from scanner module. First test: single ASSESSMENT-10 fixture file → correct result.
  - Green: Add tests for all 14 stages, edge cases (empty dir, missing dir, multiple matches), conditional flags, date extraction from both dated filenames and frontmatter.
  - Refactor: Extract `writeAssessmentFixture(dir, stage, options)` helper for DRY fixture creation; ensure each test is isolated via `beforeEach`/`afterEach` temp dir cleanup.
- **Planning validation (required for M/L):**
  - Checks run: `baselines-freshness.test.ts` reviewed (258 lines, temp dir pattern, async `writeFile` helper, `beforeEach`/`afterEach` lifecycle)
  - Validation artifacts: Test file structure confirmed; governed runner pattern confirmed (`pnpm -w run test:governed`)
  - Unexpected findings: None
- **Scouts:** None: test infrastructure is well-established in adjacent files
- **Edge Cases & Hardening:** None: this is the test file itself; edge cases are tested within the scenarios
- **What would make this >=90%:**
  - Prototype of fixture file creation confirming all 14 stages have valid fixture patterns producible from the mapping table
- **Rollout / rollback:**
  - Rollout: Tests run in CI only; no local execution per project policy
  - Rollback: Delete test file
- **Documentation impact:** None
- **Consumer tracing (new outputs):**
  - Test file → no downstream consumers. CI runner is the only consumer.
- **Notes / references:**
  - Follow `baselines-freshness.test.ts` pattern: `beforeEach` temp dir, `afterEach` cleanup, async `writeFile` helper
- **Build evidence (2026-03-03):**
  - File created: `scripts/src/startup-loop/__tests__/assessment-completion.test.ts` (485 lines)
  - TypeScript compilation: clean
  - 17 test cases across 7 describe blocks covering: happy path (multi-stage), empty dir, non-existent dir, dated/undated filenames, ASSESSMENT-09 special case, conditional stages, naming-workbench file detection (ASSESSMENT-04 candidate-names, ASSESSMENT-04 directory-only, ASSESSMENT-05 naming-generation-spec, ASSESSMENT-13 product-naming, PWRB naming-shortlist), multiple matches (most recent wins), file filtering (.html/.agent.md ignored), result structure and sorting
  - Tests run in CI only (governed runner); validated via typecheck locally

### TASK-03: Build CLI wrapper and register pnpm script
- **Type:** IMPLEMENT
- **Deliverable:** `scripts/src/startup-loop/assessment/assessment-completion-cli.ts`, `scripts/package.json` script entry
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-03)
- **Affects:** `scripts/src/startup-loop/assessment/assessment-completion-cli.ts`, `scripts/package.json`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% - Direct pattern from `baselines-freshness-cli.ts` (78 lines, thin wrapper)
  - Approach: 90% - Established CLI pattern with console output and `--verbose` flag
  - Impact: 85% - Immediate operator visibility via `pnpm check-assessment-completion`
- **Acceptance:**
  - CLI imports scanner and produces human-readable per-business per-stage completion matrix
  - Registered as `check-assessment-completion` in `scripts/package.json` following existing `check-baselines-freshness` pattern
  - Supports `--verbose` flag to show all stages including `not_found`
  - Default output shows completion summary per business and highlights incomplete stages
  - Conditional stages (ASSESSMENT-05, ASSESSMENT-15) noted as conditional in output
  - ASSESSMENT-09 shown as `no artifact pattern` (informational, not flagged as missing)
  - Exit code 0 always (informational tool, not a gate)
- **Validation contract (TC-XX):**
  - TC-01: `pnpm --filter scripts check-assessment-completion` → produces readable output listing businesses and their completion status, exits 0
  - TC-02: `pnpm --filter scripts check-assessment-completion --verbose` → includes `not_found` stages in output
  - TC-03: CLI with non-existent strategy directory → prints "No assessment directories found." and exits 0
- **Execution plan:**
  - Red: Create CLI file importing `scanAssessmentCompletion`; skeleton `run()` function.
  - Green: Implement matrix formatting (business rows, stage columns with complete/not_found/conditional markers), summary line, `--verbose` flag.
  - Refactor: Add summary counts (complete/not_found/conditional per business), align output formatting.
- **Planning validation:** None: S-effort task with established pattern
- **Scouts:** None: direct copy of `baselines-freshness-cli.ts` pattern
- **Edge Cases & Hardening:**
  - No businesses found: print informational message and exit 0
  - Scanner throws: catch and print error message, exit 1
- **What would make this >=90%:**
  - Running the CLI against actual assessment directories and confirming output is readable and matches expectations
- **Rollout / rollback:**
  - Rollout: Add pnpm script entry to `scripts/package.json`
  - Rollback: Remove script entry and delete CLI file
- **Documentation impact:** None
- **Consumer tracing (new outputs):**
  - `check-assessment-completion` pnpm script → consumed by operators via command line. No code consumers.
- **Notes / references:**
  - Follow `baselines-freshness-cli.ts` pattern exactly (lines 1-78): `run()` function, `process.cwd()` for repo root, `console.log` output
- **Build evidence (2026-03-03):**
  - File created: `scripts/src/startup-loop/assessment/assessment-completion-cli.ts` (85 lines)
  - pnpm script registered: `check-assessment-completion` in `scripts/package.json`
  - TypeScript compilation: clean
  - Post-build validation:
    - Mode: 2 (Data Simulation)
    - Attempt: 1
    - Result: Pass
    - Evidence: CLI run against actual strategy dirs — 9 businesses, readable matrix output, HBAG shows 12/14 complete, PWRB shows 5/14 complete, conditional stages noted, `--verbose` flag shows all not_found entries (87 vs hidden in default), exit 0
    - Degraded mode: No

## Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Stage-to-filename mapping is inconsistent across businesses | Medium | Medium | Mapping verified against all 5 businesses during fact-find; scanner uses stage-specific pattern rules, not a single regex |
| Conditional stages produce false "incomplete" signals | Medium | Low | Registry records what exists, not what's required; `conditional` flag set on ASSESSMENT-05 and ASSESSMENT-15 |
| ASSESSMENT-04 artifacts inside `naming-workbench/` subdirectory | Low | Low | Scanner scans `naming-workbench/` for `*candidate-names*.user.md` or `*naming-shortlist*.user.md` files; directory existence alone is not sufficient |
| ASSESSMENT-09 has no artifact pattern | Low | Low | Handled as explicit `no_artifact_pattern` status; not counted as missing |
| Future assessment skills change artifact patterns | Low | Low | Stage mapping table is explicit and easy to update; loop-spec version bumps signal changes |

## Observability
- Logging: CLI output provides per-business per-stage completion matrix
- Metrics: None (informational tool)
- Alerts/Dashboards: None (follow-on: mcp-preflight check)

## Acceptance Criteria (overall)
- [ ] Scanner module exists at `scripts/src/startup-loop/assessment/assessment-completion-scanner.ts`
- [ ] Scanner covers all 14 ASSESSMENT stages (01-11, 13-15)
- [ ] Scanner handles both dated and undated filename patterns
- [ ] JSON output is deterministic
- [ ] CLI wrapper produces readable matrix via `pnpm --filter scripts check-assessment-completion`
- [ ] Unit tests pass via governed runner
- [ ] Scanner output for HBAG verified against actual HBAG assessment artifacts (not against HBAG index.user.md which has known non-canonical stage mappings)

## Decision Log
- 2026-03-03: Chose hardcoded stage-to-pattern mapping over dynamic YAML parsing — patterns are in YAML comments, not structured data. Stable 14-stage set.
- 2026-03-03: Deferred mcp-preflight integration — additive follow-on, keeps scope right-sized.
- 2026-03-03: ASSESSMENT-09 handled as special case (`no_artifact_pattern`) — intake sync is a process, not a file producer.
- 2026-03-03: ASSESSMENT-04 detected via `*candidate-names*.user.md` or `*naming-shortlist*.user.md` files inside `naming-workbench/` directory (not directory existence alone — directory can contain only workspace files). Evidence: HBAG, HEAD, PET have `candidate-names` files; PWRB has `naming-shortlist` pattern.

## Overall-confidence Calculation
- TASK-01: 85% * 2 (M) = 170
- TASK-02: 85% * 2 (M) = 170
- TASK-03: 85% * 1 (S) = 85
- Total: 425 / 5 = 85%

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Build assessment completion scanner module | Yes — `scripts/src/startup-loop/` exists, `baselines-freshness.ts` pattern available, strategy directories exist with assessment artifacts | None | No |
| TASK-02: Write scanner unit tests | Yes — TASK-01 produces exported types and `scanAssessmentCompletion()` function; `scripts/jest.config.cjs` exists; governed runner available | None | No |
| TASK-03: Build CLI wrapper and register pnpm script | Yes — TASK-01 produces exported function; `scripts/package.json` exists with existing `check-*` script entries as pattern | None | No |
