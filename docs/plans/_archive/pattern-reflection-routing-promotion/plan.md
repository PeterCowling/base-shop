---
Type: Plan
Status: Archived
Domain: BOS
Workstream: Engineering
Created: 2026-03-04
Last-reviewed: 2026-03-04
Last-updated: 2026-03-04
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: pattern-reflection-routing-promotion
Deliverable-Type: typescript-script
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 87%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Pattern-Reflection Routing Promotion Plan

## Summary

Deliver two deterministic TypeScript scripts that consume pattern-reflection entries (both YAML frontmatter and legacy body-format) and produce actionable output for operator review. `lp-do-pattern-promote-loop-update` reads entries with `routing_target: loop_update` and drafts proposed patches to standing process docs. `lp-do-pattern-promote-skill-proposal` reads entries with `routing_target: skill_proposal` and scaffolds SKILL.md templates. Both scripts share a common dual-format parser (YAML frontmatter via `js-yaml` + legacy body-format fallback) and follow the established deterministic-script pattern (CLI entry point, `--dry-run`, typed exports). Anti-loop defense-in-depth is added via `SELF_TRIGGER_PROCESSES` registration.

## Active tasks

- [x] TASK-01: Shared YAML frontmatter parser and loop_update promotion script
- [x] TASK-02: skill_proposal promotion script
- [x] TASK-03: Anti-loop integration
- [x] TASK-04: Test suite

## Goals

- Close the reflection-to-action gap for `loop_update` and `skill_proposal` routing targets
- Keep promotion deterministic — no LLM reasoning in the scripts
- Produce operator-reviewable draft output (not auto-applied)
- Follow established patterns from `self-evolving-write-back.ts` and `lp-do-build-pattern-reflection-prefill.ts`

## Non-goals

- Modifying the pattern-reflection prefill or routing decision tree thresholds
- Auto-applying changes without operator review
- Handling `defer` entries
- Mandatory integration into the build completion sequence (advisory/fail-open only)

## Constraints & Assumptions

- Constraints:
  - Scripts must be deterministic TypeScript (no LLM calls)
  - Must import `PatternEntry`, `RoutingTarget`, `PatternCategory` from existing prefill script (no duplication)
  - Output must be draft files for operator review
- Assumptions:
  - Pattern-reflection artifacts exist in two formats: (a) YAML frontmatter `entries[]` (newer, deterministic prefill), (b) markdown body-only with `**routing_target:**` bullets (older, LLM-authored). Parser must handle both.
  - Low current volume (3 non-defer entries across all archived builds: 1 in YAML frontmatter format, 2 in body-only format)

## Inherited Outcome Contract

- **Why:** Pattern-reflection routing outputs (loop_update, skill_proposal) are produced but never consumed downstream, making the routing decision tree dead code for non-defer targets. Process improvements and skill opportunities identified across builds never reach the standing docs or skill directories they should update.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Produce two deterministic scripts that read pattern-reflection routing outputs and produce actionable drafts (process doc patches and SKILL.md scaffolds), closing the reflection-to-action gap.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/pattern-reflection-routing-promotion/fact-find.md`
- Key findings used:
  - YAML frontmatter `entries[]` is the structured input format (`PatternEntry` type from prefill script)
  - 3 non-defer entries exist in archive: 1 `loop_update`, 2 `skill_proposal`
  - Self-evolving bridge consumes pattern-reflection as document-level blob only — entry-level `routing_target` is unconsumed
  - `SELF_TRIGGER_PROCESSES` has 4 entries; registration is defense-in-depth (commit-hook emits `lp-do-build-post-commit-hook`)
  - Standing process target: `process-registry-v2.md` (20 workstream processes) + `loop-output-contracts.md`

## Proposed Approach

- Option A: Single script handling both routing targets with subcommands
- Option B: Two separate scripts (one per routing target) sharing a common YAML parser module
- Chosen approach: **Option B** — two separate scripts. Each routing target has different output semantics (doc patches vs SKILL.md scaffolds) and different target directories. Separate scripts are simpler to test, invoke, and extend independently. The shared YAML frontmatter parser is extracted into the loop_update script and re-exported for the skill_proposal script to import.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Shared YAML parser + loop_update promotion script | 85% | M | Complete (2026-03-04) | - | TASK-02, TASK-04 |
| TASK-02 | IMPLEMENT | skill_proposal promotion script | 90% | S | Complete (2026-03-04) | TASK-01 | TASK-04 |
| TASK-03 | IMPLEMENT | Anti-loop SELF_TRIGGER_PROCESSES registration | 95% | S | Complete (2026-03-04) | - | TASK-04 |
| TASK-04 | IMPLEMENT | Test suite for both scripts | 85% | M | Complete (2026-03-04) | TASK-01, TASK-02, TASK-03 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-03 | - | Independent: TASK-01 builds parser + loop_update script; TASK-03 adds SELF_TRIGGER_PROCESSES entries |
| 2 | TASK-02 | TASK-01 | Imports shared parser from TASK-01 |
| 3 | TASK-04 | TASK-01, TASK-02, TASK-03 | Tests all deliverables |

## Tasks

### TASK-01: Shared YAML frontmatter parser + loop_update promotion script

- **Type:** IMPLEMENT
- **Deliverable:** `scripts/src/startup-loop/build/lp-do-pattern-promote-loop-update.ts` + `scripts/package.json` entry
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/build/lp-do-pattern-promote-loop-update.ts` (new), `scripts/package.json`, `[readonly] scripts/src/startup-loop/build/lp-do-build-pattern-reflection-prefill.ts`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-04
- **Confidence:** 85%
  - Implementation: 85% — clear input format (YAML frontmatter), known output target (draft markdown files), prefill script provides type imports
  - Approach: 90% — deterministic script pattern proven by write-back script
  - Impact: 80% — only 1 existing `loop_update` entry; value grows as more builds produce entries crossing the threshold
- **Acceptance:**
  - Script parses pattern-reflection entries from both formats: (a) YAML frontmatter `entries[]` (newer artifacts) and (b) markdown body bullets with `**routing_target:**` fields (older artifacts)
  - Filters entries where `routing_target === "loop_update"`
  - For each entry: produces a draft markdown file in the output directory containing the pattern summary, evidence refs, and a proposed patch section identifying the target standing doc
  - Target doc identification uses `evidence_refs` paths and `pattern_summary` content; falls back to `target_doc: unknown` when ambiguous
  - `--dry-run` mode prints what would be produced without writing files
  - Console output summarizes entries processed, drafts produced, entries skipped
  - Exports: `parsePatternReflectionEntries()`, `filterByRoutingTarget()`, `PromotionDraft`, `PromotionResult`
- **Validation contract (TC-XX):**
  - TC-01: Pattern-reflection with 1 `loop_update` entry → 1 draft file produced with correct pattern summary and evidence refs
  - TC-02: Pattern-reflection with 0 `loop_update` entries (all `defer`) → 0 draft files, summary indicates "0 entries matched"
  - TC-03: Pattern-reflection with 2 `loop_update` + 1 `skill_proposal` → 2 draft files (skill_proposal filtered out)
  - TC-04: Malformed YAML frontmatter (invalid YAML syntax, e.g. broken indentation) → graceful skip with warning, no crash. Note: body-format artifacts without `entries` frontmatter are handled by the fallback parser (TC-07a), not treated as errors.
  - TC-05: Empty file → graceful skip with warning
  - TC-06: `--dry-run` mode → console output only, no files written
  - TC-07: Entry with no `evidence_refs` → draft produced with `target_doc: unknown` fallback
  - TC-07a: Body-format pattern-reflection (no YAML frontmatter, `**routing_target:** loop_update` bullets) → entries parsed correctly via fallback parser
  - TC-07b: YAML frontmatter format (archive example: `brik-sticky-book-now-room-context`) → entries parsed via js-yaml
- **Execution plan:** Red → Green → Refactor
  1. Create `lp-do-pattern-promote-loop-update.ts` with:
     - Dual-format parser: (a) extract YAML frontmatter between `---` delimiters and parse with `js-yaml` (already in `scripts/package.json` dependencies); (b) if no frontmatter entries found, fall back to markdown body parsing using regex for `**routing_target:**`, `**pattern_summary:**`, `**category:**`, `**occurrence_count:**` bullet fields
     - `parsePatternReflectionEntries(content: string): PatternEntry[]` — import `PatternEntry` type from prefill script; tries YAML frontmatter first, then body-format fallback
     - `filterByRoutingTarget(entries: PatternEntry[], target: RoutingTarget): PatternEntry[]`
     - `generateLoopUpdateDraft(entry: PatternEntry): PromotionDraft` — produces markdown with pattern summary, evidence refs, target doc identification
     - `promoteLoopUpdateEntries(options: PromoteOptions): PromotionResult` — main entry point
     - CLI: `--reflection-path <path>`, `--output-dir <dir>`, `--dry-run`
  2. Add `scripts/package.json` entry: `"startup-loop:pattern-promote-loop-update"`
- **Planning validation (required for M/L):**
  - Checks run: Verified YAML frontmatter format in archive examples (`brik-sticky-book-now-room-context/pattern-reflection.user.md`). Confirmed `PatternEntry` type is exported from prefill script. Confirmed `renderFrontmatter()` in prefill uses `---` delimiters with indented YAML entries.
  - Validation artifacts: YAML frontmatter format at `docs/plans/_archive/brik-sticky-book-now-room-context/pattern-reflection.user.md` (lines 1-12). Body-format examples at `docs/plans/_archive/lp-do-ideas-execution-guarantee/pattern-reflection.user.md` (line 17: `**routing_target:** loop_update`) and `docs/plans/_archive/bos-loop-assessment-registry/pattern-reflection.user.md` (line 17: `**routing_target:** skill_proposal`). Both body-format examples use `**field:**` bullet pattern for entry fields.
  - Unexpected findings: None
- **Consumer tracing:**
  - New exports: `parsePatternReflectionEntries()` — consumed by TASK-02 (`skill_proposal` script imports this function). No other consumers needed at this time.
  - `filterByRoutingTarget()` — consumed by TASK-02 and internal use. Generic filter, safe for reuse.
  - `PromotionDraft`, `PromotionResult` types — consumed by TASK-04 tests. No runtime consumers beyond the scripts themselves.
  - Consumer `self-evolving-from-build-output.ts` is unchanged because it reads pattern-reflection as a document-level blob — does not parse entries or routing targets.
- **Scouts:** None: input format is verified from archive examples and prefill script source
- **Edge Cases & Hardening:**
  - Pattern-reflection files with no YAML frontmatter (markdown-only, created by LLM refinement without prefill): parser falls back to body-format extraction using `**routing_target:**` bullet patterns
  - `entries` field is a non-array value: parser returns empty array, logs warning
  - Entry missing required fields (`pattern_summary`, `category`, `routing_target`): skip entry with per-entry warning
  - Very long `pattern_summary` (>100 chars): truncate in draft filename, preserve full text in draft body
- **What would make this >=90%:**
  - A spike confirming the YAML frontmatter parser handles all 3 archive examples correctly (would take ~15 min)
- **Rollout / rollback:**
  - Rollout: New standalone script, no integration dependency. Can be invoked manually or added as advisory post-build step later.
  - Rollback: Delete script and package.json entry. No other files affected.
- **Documentation impact:** None: scripts are self-documenting via CLI `--help`
- **Notes / references:**
  - Model: `scripts/src/startup-loop/self-evolving/self-evolving-write-back.ts` (CLI pattern, dry-run, typed exports)
  - Type imports: `scripts/src/startup-loop/build/lp-do-build-pattern-reflection-prefill.ts` (`PatternEntry`, `RoutingTarget`, `PatternCategory`)

### TASK-02: skill_proposal promotion script

- **Type:** IMPLEMENT
- **Deliverable:** `scripts/src/startup-loop/build/lp-do-pattern-promote-skill-proposal.ts` + `scripts/package.json` entry
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/build/lp-do-pattern-promote-skill-proposal.ts` (new), `scripts/package.json`, `[readonly] scripts/src/startup-loop/build/lp-do-pattern-promote-loop-update.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-04
- **Confidence:** 90%
  - Implementation: 90% — imports shared parser from TASK-01, SKILL.md template is a simple string scaffold
  - Approach: 95% — straightforward file generation into known directory structure
  - Impact: 80% — only 2 existing `skill_proposal` entries; value grows with more builds
- **Acceptance:**
  - Script imports `parsePatternReflectionEntries()` and `filterByRoutingTarget()` from TASK-01
  - Filters entries where `routing_target === "skill_proposal"`
  - For each entry: scaffolds a SKILL.md file in the output directory with minimal template (frontmatter, heading, description from pattern summary, placeholder phases, invocation section)
  - Skill name derived from entry's `pattern_summary` (kebab-cased, max 40 chars)
  - `--dry-run` mode prints what would be produced without writing files
  - Console output summarizes entries processed, scaffolds produced
- **Validation contract (TC-XX):**
  - TC-08: Pattern-reflection with 1 `skill_proposal` entry → 1 SKILL.md scaffold with correct name and description
  - TC-09: Pattern-reflection with 0 `skill_proposal` entries → 0 scaffolds, summary indicates "0 entries matched"
  - TC-10: Scaffold contains required SKILL.md sections (frontmatter, heading, description, invocation, operating mode)
  - TC-11: Skill name kebab-casing from pattern summary (spaces → hyphens, lowercase, special chars removed, max 40 chars)
  - TC-12: `--dry-run` mode → console output only, no files written
- **Execution plan:** Red → Green → Refactor
  1. Create `lp-do-pattern-promote-skill-proposal.ts` with:
     - Import `parsePatternReflectionEntries`, `filterByRoutingTarget` from `./lp-do-pattern-promote-loop-update.js`
     - `deriveSkillName(summary: string): string` — kebab-case, max 40 chars
     - `generateSkillScaffold(entry: PatternEntry): string` — produces SKILL.md content
     - `promoteSkillProposalEntries(options: PromoteOptions): PromotionResult` — main entry point
     - CLI: `--reflection-path <path>`, `--output-dir <dir>`, `--dry-run`
  2. Add `scripts/package.json` entry: `"startup-loop:pattern-promote-skill-proposal"`
- **Consumer tracing:**
  - No new exports consumed by other tasks — this is a leaf script
  - Imports from TASK-01 are documented in TASK-01's consumer tracing
- **Scouts:** None: SKILL.md format verified from 3 archive examples in fact-find
- **Edge Cases & Hardening:**
  - Pattern summary produces empty skill name after kebab-casing: fall back to `unnamed-skill-<index>`
  - Duplicate skill names from multiple entries: append `-2`, `-3` suffix
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:**
  - Rollout: New standalone script. No integration dependency.
  - Rollback: Delete script and package.json entry.
- **Documentation impact:** None
- **Notes / references:**
  - SKILL.md examples: `.claude/skills/lp-seo/SKILL.md`, `.claude/skills/guide-translate/SKILL.md`

### TASK-03: Anti-loop SELF_TRIGGER_PROCESSES registration

- **Type:** IMPLEMENT
- **Deliverable:** 2 entries added to `SELF_TRIGGER_PROCESSES` in `lp-do-ideas-trial.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 95%
  - Implementation: 95% — single-line additions to existing Set, pattern proven by write-back script
  - Approach: 95% — defense-in-depth registration, same pattern as `"standing-write-back"`
  - Impact: 90% — forward-looking safety for when scripts may evolve to emit ArtifactDeltaEvents directly
- **Acceptance:**
  - `SELF_TRIGGER_PROCESSES` Set contains `"pattern-promote-loop-update"` and `"pattern-promote-skill-proposal"`
  - Set includes both new entries as members (membership-based acceptance, not cardinality — set may grow from other changes)
  - No other changes to `lp-do-ideas-trial.ts`
- **Validation contract (TC-XX):**
  - TC-13: `grep "pattern-promote-loop-update" lp-do-ideas-trial.ts` returns a match inside `SELF_TRIGGER_PROCESSES`
  - TC-14: `grep "pattern-promote-skill-proposal" lp-do-ideas-trial.ts` returns a match inside `SELF_TRIGGER_PROCESSES`
  - TC-15: Set includes both `"pattern-promote-loop-update"` and `"pattern-promote-skill-proposal"` as members (membership check, not cardinality — set may grow from other changes)
- **Execution plan:** Single edit — add 2 string literals to the Set constructor
- **Scouts:** None: verified current set contents at line 457-462
- **Edge Cases & Hardening:** None: simple string addition
- **What would make this >=90%:** Already at 95%.
- **Rollout / rollback:**
  - Rollout: Immediate on merge
  - Rollback: Remove 2 lines
- **Documentation impact:** None
- **Notes / references:**
  - Current SELF_TRIGGER_PROCESSES: line 457-462 of `lp-do-ideas-trial.ts` (4 entries)
  - Note: these are defense-in-depth. Current commit-hook emits `updated_by_process: "lp-do-build-post-commit-hook"` — these process names only suppress if scripts later evolve to emit ArtifactDeltaEvents directly.

### TASK-04: Test suite for both promotion scripts

- **Type:** IMPLEMENT
- **Deliverable:** `scripts/src/startup-loop/__tests__/pattern-promote.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/__tests__/pattern-promote.test.ts` (new), `[readonly] scripts/src/startup-loop/build/lp-do-pattern-promote-loop-update.ts`, `[readonly] scripts/src/startup-loop/build/lp-do-pattern-promote-skill-proposal.ts`, `[readonly] scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts`
- **Depends on:** TASK-01, TASK-02, TASK-03
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — clear test patterns from prefill and write-back test suites
  - Approach: 90% — tmpdir-based integration testing proven
  - Impact: 85% — tests validate all acceptance criteria
- **Acceptance:**
  - Tests cover TC-01 through TC-15 from TASK-01 through TASK-03
  - Uses `@jest/globals` imports, `.js` extension convention
  - Tmpdir-based integration tests with isolated fixtures
  - TypeScript typecheck clean
- **Validation contract (TC-XX):**
  - TC-16: All TC-01 through TC-15 pass
  - TC-17: TypeScript typecheck clean on test file
- **Execution plan:** Red → Green → Refactor
  1. Create test file with 5 describe blocks:
     - `parsePatternReflectionEntries` — unit tests for dual-format parsing (TC-04, TC-05, TC-07, TC-07a, TC-07b)
     - `promoteLoopUpdateEntries` — integration tests with tmpdir (TC-01, TC-02, TC-03, TC-06)
     - `promoteSkillProposalEntries` — integration tests with tmpdir (TC-08, TC-09, TC-10, TC-11, TC-12)
     - `edge cases` — malformed input, empty files, duplicate names
     - `anti-loop integration` — grep-based verification (TC-13, TC-14, TC-15)
- **Scouts:** None: test patterns verified from existing test suites
- **Edge Cases & Hardening:** Tests themselves cover edge cases from TASK-01 and TASK-02
- **What would make this >=90%:** Confirming the governed test runner works with the new test path
- **Rollout / rollback:**
  - Rollout: Tests run in CI
  - Rollback: Delete test file
- **Documentation impact:** None
- **Notes / references:**
  - Model: `scripts/src/startup-loop/__tests__/lp-do-build-pattern-reflection-prefill.test.ts` (tmpdir pattern, @jest/globals)
  - Model: `scripts/src/startup-loop/__tests__/self-evolving-write-back.test.ts` (anti-loop grep verification)

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| YAML frontmatter parsing edge cases | Low | Low | Defensive parsing with per-entry skip on error; test with malformed inputs (TC-04, TC-05) |
| Target doc identification ambiguous for loop_update | Medium | Medium | Falls back to `target_doc: unknown`; operator resolves manually |
| Low volume means scripts run rarely | Medium | Low | Tests in CI prevent bit-rot; advisory integration later |

## Observability

- Logging: Console output with entry counts, draft counts, skip reasons
- Metrics: None (standalone scripts)
- Alerts/Dashboards: None

## Acceptance Criteria (overall)

- [ ] Both scripts parse YAML frontmatter entries from pattern-reflection artifacts
- [ ] `loop_update` script produces draft patch files for standing process docs
- [ ] `skill_proposal` script scaffolds SKILL.md templates
- [ ] Both scripts support `--dry-run` mode
- [ ] Anti-loop defense-in-depth: `SELF_TRIGGER_PROCESSES` includes both process names (forward-looking — not required for current draft/scaffold output but prevents self-triggering if scripts later emit ArtifactDeltaEvents directly)
- [ ] Test suite passes with 15+ test cases
- [ ] TypeScript typecheck clean across all deliverables

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Shared parser + loop_update script | Yes — `PatternEntry` type exported from prefill script; archive examples verified | None | No |
| TASK-02: skill_proposal script | Yes — depends on TASK-01 exports which are defined in TASK-01 execution plan | None | No |
| TASK-03: Anti-loop registration | Yes — SELF_TRIGGER_PROCESSES location verified (line 457-462) | None | No |
| TASK-04: Test suite | Yes — depends on all 3 prior tasks; test patterns established | None | No |

## Overall-confidence Calculation

- TASK-01: 85% × M(2) = 170
- TASK-02: 90% × S(1) = 90
- TASK-03: 95% × S(1) = 95
- TASK-04: 85% × M(2) = 170
- Total: 525 / 6 = 87.5% → **87%**

## Build Evidence

### TASK-01: Complete (2026-03-04)

- Deliverable: `scripts/src/startup-loop/build/lp-do-pattern-promote-loop-update.ts` (265 lines)
- Package.json entry: `startup-loop:pattern-promote-loop-update`
- Dual-format parser: YAML frontmatter via `js-yaml` + body-format fallback parsing `**routing_target:**` bullets
- Exports: `parsePatternReflectionEntries()`, `filterByRoutingTarget()`, `generateLoopUpdateDraft()`, `promoteLoopUpdateEntries()`, `PromotionDraft`, `PromotionResult`, `PromoteOptions`
- Smoke tests: all 3 archive examples parsed correctly (1 YAML format, 2 body format)
- Post-build validation: Mode 2 (Data Simulation), Attempt 1, Pass. Entry point: CLI with `--reflection-path`, `--output-dir`, `--dry-run`. Happy path: body-format archive → 1 draft produced with correct target doc inference. Edge case: YAML-format archive with no loop_update entries → 0 drafts, correct summary.
- Typecheck + lint: clean
- Commit: `bf33bfc138`

### TASK-02: Complete (2026-03-04)

- Deliverable: `scripts/src/startup-loop/build/lp-do-pattern-promote-skill-proposal.ts` (180 lines)
- Package.json entry: `startup-loop:pattern-promote-skill-proposal`
- Imports shared parser from TASK-01, adds `deriveSkillName()`, `generateSkillScaffold()`, `promoteSkillProposalEntries()`
- Trailing-hyphen fix: `.slice(0, 40).replace(/-$/g, "")` handles truncation edge case
- Duplicate name handling: suffix `-2`, `-3` for duplicate skill names
- Smoke tests: YAML-format and body-format archives both produced correct scaffolds
- Post-build validation: Mode 2, Attempt 1, Pass. Happy path: YAML archive with skill_proposal → SKILL.md scaffold with frontmatter, heading, invocation, phases.
- Typecheck + lint: clean
- Commit: `bf33bfc138`

### TASK-03: Complete (2026-03-04)

- Deliverable: 2 entries added to `SELF_TRIGGER_PROCESSES` in `lp-do-ideas-trial.ts` (lines 462-463)
- Members: `"pattern-promote-loop-update"`, `"pattern-promote-skill-proposal"`
- Set now has 6 entries (was 4)
- Defense-in-depth: commit-hook emits `lp-do-build-post-commit-hook`, not these process names; registration is forward-looking
- Commit: `bf33bfc138`

### TASK-04: Complete (2026-03-04)

- Deliverable: `scripts/src/startup-loop/__tests__/pattern-promote.test.ts` (396 lines)
- Test coverage: TC-01 through TC-15 plus additional edge cases (duplicate skill names, body-format promotions)
- 5 describe blocks: parsePatternReflectionEntries, promoteLoopUpdateEntries, generateLoopUpdateDraft, promoteSkillProposalEntries, anti-loop integration
- Lint autofix: import sort corrected by ESLint
- Typecheck: clean
- Commit: `bf33bfc138`
- CI: pushed to origin/dev, awaiting CI run
