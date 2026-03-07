---
Type: Plan
Status: Archived
Domain: Platform
Workstream: Engineering
Created: 2026-03-04
Last-reviewed: 2026-03-04
Last-updated: 2026-03-04
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: build-completion-deterministic-lifts
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Dispatch-ID: IDEA-DISPATCH-20260304020000-0988
---

# Build Completion Deterministic Lifts Plan

## Summary

The lp-do-build plan completion sequence (Steps 1–8) burns 7–15k tokens per build cycle. Investigation shows 60–65% of results-review, pattern-reflection, and standing-updates content is deterministic template fill that a TS script can compute from build diffs, registry paths, and task completion status. This plan delivers a pre-fill script that generates the boilerplate scaffold, reducing per-build token consumption by ~55% while preserving LLM involvement only for genuinely variable content.

## Active tasks
- [ ] TASK-01: Implement results-review pre-fill script
- [ ] TASK-02: Implement pattern-reflection auto-generator
- [ ] TASK-03: Wire pre-fill into lp-do-build SKILL.md
- [ ] TASK-04: Implement tests for pre-fill and pattern-reflection

## Goals
- Build a deterministic pre-fill script (`lp-do-build-results-review-prefill.ts`) that generates boilerplate sections of results-review, pattern-reflection, and standing-updates from build artifacts.
- Reduce per-build token consumption by ~55% on the completion sequence.
- Preserve LLM involvement only for genuinely variable content (idea descriptions, observed-outcomes narrative, edge-case verdicts).

## Non-goals
- Changing the results-review template structure or schema.
- Replacing codemoot/inline fallback entirely — LLM remains the refinement layer.
- Automating the operator-intake structured questions (separate dispatch 0989).

## Constraints & Assumptions
- Constraints:
  - Must not break existing lp-do-build completion flow — pre-fill is additive, codemoot/inline fallback remains.
  - Pre-fill output must conform to `docs/plans/_templates/results-review.user.md` structure.
  - Pattern-reflection must conform to `pattern-reflection.v1` schema.
- Assumptions:
  - Build-record, build-event, and plan are always available at pre-fill time (produced in Steps 1–1.5 before Step 2).
  - Git history is available for diff computation.
  - Standing-registry.json is the single source of truth for artifact paths.

## Inherited Outcome Contract

- **Why:** Each build cycle burns 7–15k tokens on results-review, pattern-reflection, and standing-updates sections that are 60–65% boilerplate. The LLM generates None entries, counts recurrences, and fills verdicts that a TS script could compute deterministically from build diffs and task status.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A deterministic pre-fill script generates 60%+ of results-review, pattern-reflection, and standing-updates content from build artifacts, reducing per-build token consumption by ~55%.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/build-completion-deterministic-lifts/fact-find.md`
- Key findings used:
  - 60–65% of results-review content is deterministic (verified across 5 archived files).
  - `deriveIdeaKey()` at `generate-process-improvements.ts:445` provides per-source-path idea keying. For cross-plan recurrence counting, a title-normalized key is needed (SHA-1 of normalized title only) because `sourcePath` differs per plan slug.
  - Standing-registry.json has 38 active entries with paths suitable for git-diff intersection.
  - pattern-reflection.v1 routing decision tree (Section 4.1 of schema spec) is fully deterministic.
  - Test infrastructure (tmpdir fixtures, YAML parsing, markdown sections) is established in 5 existing test files.
  - Injectable `gitDiffFiles` parameter enables testability without mock git repos.

## Proposed Approach
- Option A: Single monolithic script covering all pre-fill targets.
- Option B: Two focused scripts — one for results-review (including standing-updates and verdict), one for pattern-reflection — with a thin wiring change in SKILL.md.
- Chosen approach: Option B. Separation keeps each script focused and testable. Results-review pre-fill (~300–400 lines) handles 5-category None scan, standing-updates detection, and intended-outcome verdict. Pattern-reflection auto-generator (~200–250 lines) handles archive recurrence counting and routing decision tree. Integration is a 2-line addition to SKILL.md.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---:|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Results-review pre-fill script | 85% | M | Complete (2026-03-04) | - | TASK-03, TASK-04 |
| TASK-02 | IMPLEMENT | Pattern-reflection auto-generator | 85% | M | Complete (2026-03-04) | - | TASK-03, TASK-04 |
| TASK-03 | IMPLEMENT | Wire pre-fill into lp-do-build SKILL.md | 85% | S | Complete (2026-03-04) | TASK-01, TASK-02 | TASK-04 |
| TASK-04 | IMPLEMENT | Tests for pre-fill and pattern-reflection | 85% | M | Complete (2026-03-04) | TASK-01, TASK-02, TASK-03 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | - | Independent scripts, no shared state. Parallel-safe. |
| 2 | TASK-03 | TASK-01, TASK-02 | Wiring depends on both scripts existing. |
| 3 | TASK-04 | TASK-01, TASK-02, TASK-03 | Tests validate the integrated system. |

## Tasks

### TASK-01: Implement results-review pre-fill script
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `scripts/src/startup-loop/build/lp-do-build-results-review-prefill.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-04)
- **Affects:** `scripts/src/startup-loop/build/lp-do-build-results-review-prefill.ts` (new), `[readonly] scripts/src/startup-loop/build/generate-process-improvements.ts`, `[readonly] scripts/src/startup-loop/build/lp-do-build-event-emitter.ts`, `[readonly] docs/plans/_templates/results-review.user.md`, `[readonly] docs/business-os/startup-loop/ideas/standing-registry.json`
- **Depends on:** -
- **Blocks:** TASK-03, TASK-04
- **Confidence:** 85%
  - Implementation: 85% — all inputs are well-defined files; `deriveIdeaKey()` and `readBuildEvent()` are existing exports; standing-registry.json is straightforward JSON; section template structure is known from 5 archived examples.
  - Approach: 85% — pre-fill-then-refine pattern is proven (codemoot already works as a refinement layer; email pipeline `auto_best` mode demonstrates the same pattern). Held-back test: no single unresolved unknown would drop this below 80 because all input schemas and output format are fully specified.
  - Impact: 85% — 60–65% of results-review is demonstrably boilerplate (verified across 5 archived files); even if codemoot still refines some sections, the scaffold eliminates the LLM generating obvious None entries and counting recurrences.
- **Acceptance:**
  - Script exports `prefillResultsReview(opts)` function that returns a markdown string conforming to `docs/plans/_templates/results-review.user.md`.
  - Accepts injectable `gitDiffFiles: string[]` parameter for testability (no direct `git diff` calls inside the function).
  - 5-category idea scan: for each of the 5 categories (New standing data source, New open-source package, New skill, New loop process, AI-to-mechanistic), writes `None.` when no evidence found in build context.
  - Standing-updates detection: intersects git diff file list with `standing-registry.json` artifact paths; lists matches or writes `No standing updates: no registered artifacts changed`.
  - Intended-outcome auto-verdict: reads `build-event.json` for intended_outcome; reads plan task statuses; if all tasks Complete and no deviations → `Met`; if partial completion → `Partially Met`; otherwise leaves placeholder for LLM.
  - Standing Expansion: writes `No standing expansion: no new external data sources or artifacts identified` when no signals detected.
  - Observed Outcomes: writes a placeholder stub `<!-- Pre-filled: LLM should populate observed outcomes from build context -->` — this is the genuinely variable section that requires LLM.
  - Logs pre-fill decisions to stderr: `[pre-fill] standing-updates: N artifacts changed`, `[pre-fill] idea-scan: N/5 categories None`, `[pre-fill] verdict: Met|Partially Met|Placeholder`.
- **Validation contract (TC-XX):**
  - TC-01: Plan with all tasks Complete + build-event present → verdict `Met`, 5/5 categories `None.`, standing updates computed from git diff intersection.
  - TC-02: Plan with 2/3 tasks Complete → verdict `Partially Met`.
  - TC-03: No build-event.json present → verdict section uses placeholder for LLM.
  - TC-04: Git diff includes 2 standing-registry paths → standing-updates lists both with their artifact_id.
  - TC-05: Git diff includes no standing-registry paths → `No standing updates: no registered artifacts changed`.
  - TC-06: Empty `gitDiffFiles` array → standing-updates uses no-change fallback; rest of pre-fill still functions.
  - TC-07: Output markdown parseable by `validateResultsReviewContent()` from `lp-do-build-reflection-debt.ts` — all 4 required sections present and valid.
- **Execution plan:**
  - Red: Write test stubs that call `prefillResultsReview()` with fixture inputs and assert output structure matches template.
  - Green: Implement the function with 5 sub-routines: `scanIdeaCategories()`, `detectStandingUpdates()`, `computeVerdict()`, `renderObservedOutcomesStub()`, `renderStandingExpansion()`. Wire them into template rendering.
  - Refactor: Extract shared types, ensure all log messages use consistent `[pre-fill]` prefix, verify output passes `validateResultsReviewContent()`.
- **Planning validation (required for M/L):**
  - Checks run: Verified `results-review.user.md` template has exactly 5 level-2 sections. Verified `validateResultsReviewContent()` checks for 4 required sections (`Observed Outcomes`, `Standing Updates`, `New Idea Candidates`, `Standing Expansion`) plus 1 warn section (`Intended Outcome Check`). Verified `readBuildEvent()` returns null on missing file (safe fallback). Verified standing-registry.json structure has `artifacts[].path` field for intersection.
  - Validation artifacts: `docs/plans/_templates/results-review.user.md`, `scripts/src/startup-loop/build/lp-do-build-reflection-debt.ts:265` (validateResultsReviewContent), `scripts/src/startup-loop/build/lp-do-build-event-emitter.ts:131` (readBuildEvent).
  - Unexpected findings: None.
- **Consumer tracing (new outputs):**
  - `prefillResultsReview()` function → consumed by TASK-03 (SKILL.md wiring) which calls it and writes output to `docs/plans/<slug>/results-review.user.md`.
  - Output markdown → consumed by codemoot/inline as the scaffold to refine (Step 2 of lp-do-build completion).
  - Output markdown → consumed by `validateResultsReviewContent()` (Step 3 reflection-debt check).
  - Output markdown `## New Idea Candidates` section → consumed by `collectProcessImprovements()` in `generate-process-improvements.ts` (Step 5).
  - All consumers are addressed: TASK-03 creates the call site; codemoot receives the file; reflection-debt and generate-process-improvements consume the same markdown structure as before.
- **Consumer tracing (modified behaviors):**
  - No existing functions are modified. This task creates a new module only. Consumer `validateResultsReviewContent()` is unchanged because the pre-fill output conforms to the existing template.
- **Scouts:** None: all inputs/outputs are well-defined files with known schemas.
- **Edge Cases & Hardening:**
  - Missing plan.md → function should still produce output with verdict placeholder and empty task list.
  - Malformed standing-registry.json → catch parse errors; fall back to empty artifact list with stderr warning.
  - Standing-registry artifact with relative vs absolute path → normalize to relative-from-repo-root before intersection.
- **What would make this >=90%:**
  - Ship the script and verify output on 2 consecutive builds produces valid results-review scaffolds accepted by `validateResultsReviewContent()`.
- **Rollout / rollback:**
  - Rollout: No deployment — script runs locally as part of lp-do-build completion. SKILL.md change (TASK-03) activates it.
  - Rollback: Remove the pre-fill call from SKILL.md; existing codemoot/inline path runs unchanged.
- **Documentation impact:**
  - SKILL.md updated in TASK-03 to reference the pre-fill step.
- **Notes / references:**
  - `generate-process-improvements.ts:445` — `deriveIdeaKey()` for recurrence matching.
  - `lp-do-build-event-emitter.ts:131` — `readBuildEvent()` for intended-outcome.
  - `lp-do-build-reflection-debt.ts:265` — `validateResultsReviewContent()` for output validation.

### TASK-02: Implement pattern-reflection auto-generator
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `scripts/src/startup-loop/build/lp-do-build-pattern-reflection-prefill.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-04)
- **Affects:** `scripts/src/startup-loop/build/lp-do-build-pattern-reflection-prefill.ts` (new), `[readonly] scripts/src/startup-loop/build/generate-process-improvements.ts`, `[readonly] docs/plans/startup-loop-build-reflection-gate/task-01-schema-spec.md`
- **Depends on:** -
- **Blocks:** TASK-03, TASK-04
- **Confidence:** 85%
  - Implementation: 85% — `deriveIdeaKey()` is exported and tested; pattern-reflection.v1 schema is fully specified (Section 2 of task-01-schema-spec.md); routing decision tree (Section 4.1) is deterministic pseudocode. Held-back test: no single unresolved unknown would drop this below 80 because the schema, routing logic, and key derivation are all specified.
  - Approach: 85% — title-normalized recurrence counting avoids the cross-plan key collision problem (critique finding: `deriveIdeaKey` includes sourcePath which differs per slug). Routing decision tree is a direct translation of documented pseudocode.
  - Impact: 85% — eliminates LLM generating the pattern-reflection artifact for builds with no patterns (majority case is empty-state) and auto-fills routing targets and occurrence counts when patterns exist.
- **Acceptance:**
  - Script exports `prefillPatternReflection(opts)` function that returns a markdown string with YAML frontmatter conforming to `pattern-reflection.v1` schema.
  - Scans `docs/plans/_archive/*/results-review.user.md` `## New Idea Candidates` bullets for recurrence counting using a **title-normalized key** (SHA-1 of `normalizeTitle(title)` — lowercased, trimmed, collapsed whitespace). This differs from `deriveIdeaKey()` which includes `sourcePath` — since `sourcePath` differs per plan slug, using `deriveIdeaKey` directly would produce artificially low recurrence counts across plans. The new `deriveRecurrenceKey(title)` function is local to this module.
  - Applies routing decision tree from Section 4.1 of the schema spec: deterministic patterns at `occurrence_count >= 3` → `loop_update`; ad_hoc at `>= 2` → `skill_proposal`; otherwise `defer`.
  - For builds with no New Idea Candidates beyond `None`, produces valid empty-state artifact with `entries: []` and `None identified` body text.
  - Renders `## Access Declarations` section (either from discovered access gaps or `None identified`).
  - Logs: `[pre-fill] pattern-reflection: N entries, M promoted`.
- **Validation contract (TC-XX):**
  - TC-01: Build with 0 non-None idea candidates → empty-state artifact with `entries: []` and `None identified` in both sections.
  - TC-02: Build with 2 idea candidates, each appearing in 1 prior archive → `occurrence_count: 2` for each, `routing_target: defer` (below threshold for both categories).
  - TC-03: Idea candidate with `category: deterministic` and `occurrence_count: 3` → `routing_target: loop_update`.
  - TC-04: Idea candidate with `category: ad_hoc` and `occurrence_count: 2` → `routing_target: skill_proposal`.
  - TC-05: YAML frontmatter includes `schema_version: pattern-reflection.v1`, `feature_slug`, `generated_at`, and `entries` array.
  - TC-06: Output matches the annotated fixture format in Section 6 of the schema spec document.
- **Execution plan:**
  - Red: Write test stubs that call `prefillPatternReflection()` with fixture archive directories and assert YAML frontmatter, entry counts, and routing targets.
  - Green: Implement `scanArchiveForRecurrences(archiveDir, currentIdeas)` using `deriveRecurrenceKey(title)` (local function — SHA-1 of normalized title only) for cross-plan matching. Implement `applyRoutingDecisionTree(entries)` translating Section 4.1 pseudocode. Implement `renderPatternReflectionMarkdown(entries, featureSlug)` producing YAML frontmatter + body.
  - Refactor: Consolidate category classification heuristic; ensure empty-state rendering matches Section 7 fixture exactly.
- **Planning validation (required for M/L):**
  - Checks run: Verified `deriveIdeaKey()` is exported from `generate-process-improvements.ts:445`. Verified pattern-reflection.v1 schema spec has complete field table, routing pseudocode, annotated fixture, and empty-state fixture. Verified `_archive/` directory convention: `docs/plans/_archive/<slug>/results-review.user.md`.
  - Validation artifacts: `docs/plans/startup-loop-build-reflection-gate/task-01-schema-spec.md`, `scripts/src/startup-loop/build/generate-process-improvements.ts:445`.
  - Unexpected findings: None.
- **Consumer tracing (new outputs):**
  - `prefillPatternReflection()` function → consumed by TASK-03 (SKILL.md wiring) which calls it and writes output to `docs/plans/<slug>/pattern-reflection.user.md`.
  - Output markdown → consumed by the LLM in Step 2.5 of lp-do-build completion as the base artifact (instead of generating from scratch).
  - Output YAML `entries` → consumed downstream by any tooling that reads pattern-reflection artifacts (currently advisory only — no automated consumer beyond the LLM).
  - All consumers are addressed: TASK-03 creates the call site; the LLM refinement step in SKILL.md reads the file.
- **Consumer tracing (modified behaviors):**
  - No existing functions are modified. Uses `parseIdeaCandidate` from `generate-process-improvements.ts` as read-only import for extracting idea titles from markdown bullets. Recurrence keying is local to this module (`deriveRecurrenceKey`).
- **Scouts:** None: schema spec and routing pseudocode are fully deterministic.
- **Edge Cases & Hardening:**
  - No `_archive/` directory → fall back to occurrence_count=1 for all entries (first observation).
  - Archived results-review has no `## New Idea Candidates` section → skip that file in recurrence scan.
  - Idea title has em-dash or special characters → `deriveRecurrenceKey()` normalizes (lowercase, trim, collapse whitespace) before hashing, so minor formatting differences across plans are collapsed.
- **What would make this >=90%:**
  - Verify output on 2 builds: one with real idea candidates and one empty-state; both produce valid pattern-reflection.v1 artifacts.
- **Rollout / rollback:**
  - Rollout: No deployment — script runs locally as part of lp-do-build completion.
  - Rollback: Remove the pre-fill call from SKILL.md; existing LLM-generated pattern-reflection continues.
- **Documentation impact:**
  - SKILL.md updated in TASK-03.
- **Notes / references:**
  - `docs/plans/startup-loop-build-reflection-gate/task-01-schema-spec.md` — canonical schema and routing decision tree.
  - `generate-process-improvements.ts` — `parseIdeaCandidate()` for extracting idea titles from markdown bullets (read-only import).

### TASK-03: Wire pre-fill into lp-do-build SKILL.md
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `.claude/skills/lp-do-build/SKILL.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-04)
- **Affects:** `.claude/skills/lp-do-build/SKILL.md`, `scripts/package.json`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 90% — two targeted insertions in a well-documented file at known locations (between Step 1.5 and Step 2 for results-review, between Step 2 and Step 2.5 for pattern-reflection). Held-back test: no single unresolved unknown would drop this below 80 because the insertion points and call signatures are fully specified.
  - Approach: 85% — pre-fill-then-refine wiring is the same pattern as the existing codemoot route check. The only design choice is whether to make pre-fill a TS script invocation (`pnpm ...`) or a direct function call — choosing TS script invocation for consistency with existing Step patterns (bug-scan, generate-process-improvements).
  - Impact: 85% — this is the activation point; without it, TASK-01/02 are dormant.
- **Build evidence:**
  - SKILL.md Step 1.7 inserted with results-review pre-fill invocation and fail-open error handling.
  - SKILL.md Step 2 updated to "refine the pre-filled scaffold" instead of "fill all sections".
  - SKILL.md Step 2.4 inserted with pattern-reflection pre-fill invocation and fail-open error handling.
  - SKILL.md Step 2.5 updated to refine from pre-filled scaffold (or generate from scratch if Step 2.4 was skipped/failed).
  - `scripts/package.json` has `startup-loop:results-review-prefill` and `startup-loop:pattern-reflection-prefill` entries.
  - TC-01 through TC-04 verified.
- **Acceptance:**
  - Step 1.7 (new) in SKILL.md: invoke `pnpm --filter scripts startup-loop:results-review-prefill -- --slug <slug> --plan-dir docs/plans/<slug>` between Step 1.5 and Step 2. On non-zero exit → log warning, fall through to existing codemoot/inline path unchanged.
  - Step 2 (modified): codemoot/inline prompt updated to say "refine the pre-filled scaffold" instead of "fill all sections". Specifically: read the existing `results-review.user.md` if present; only populate sections that contain placeholders or are missing substantive content.
  - Step 2.4 (new): invoke `pnpm --filter scripts startup-loop:pattern-reflection-prefill -- --slug <slug> --plan-dir docs/plans/<slug> --archive-dir docs/plans/_archive` between Step 2 and Step 2.5. On non-zero exit → fall through to existing LLM generation.
  - Step 2.5 (modified): LLM reads the pre-filled pattern-reflection artifact and refines only entries needing category classification from build context.
  - Fail-open contract: if either pre-fill script errors, the existing flow runs unchanged — no build breakage.
- **Validation contract (TC-XX):**
  - TC-01: SKILL.md contains Step 1.7 with pre-fill invocation and fail-open error handling.
  - TC-02: SKILL.md contains Step 2.4 with pattern-reflection pre-fill invocation and fail-open error handling.
  - TC-03: Step 2 codemoot prompt references "refine the pre-filled scaffold" rather than "fill all sections".
  - TC-04: `package.json` (scripts workspace) has `startup-loop:results-review-prefill` and `startup-loop:pattern-reflection-prefill` scripts defined.
- **Execution plan:**
  - Red: Verify current SKILL.md Step 2 prompt says "fill all sections".
  - Green: Insert Step 1.7 and Step 2.4 with pre-fill invocations; update Step 2/2.5 prompts. Add package.json script entries.
  - Refactor: Verify step numbering is consistent; add logging notes to SKILL.md.
- **Planning validation (required for M/L):** None: S effort.
- **Scouts:** None: insertion points are explicit in SKILL.md.
- **Edge Cases & Hardening:**
  - Pre-fill script not yet compiled (first run after merge) → `pnpm` will compile on demand; if compilation fails, exit code is non-zero and fall-through activates.
- **What would make this >=90%:**
  - Run one full plan completion cycle with pre-fill active and verify codemoot only refines variable sections.
- **Rollout / rollback:**
  - Rollout: SKILL.md change is immediate on next build cycle.
  - Rollback: Remove Steps 1.7 and 2.4; revert Step 2/2.5 prompts.
- **Documentation impact:**
  - SKILL.md is the documentation.
- **Notes / references:**
  - SKILL.md Step 2 and Step 2.5 are the current LLM-driven generation points.

### TASK-04: Implement tests for pre-fill and pattern-reflection
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `scripts/src/startup-loop/__tests__/lp-do-build-results-review-prefill.test.ts`, `scripts/src/startup-loop/__tests__/lp-do-build-pattern-reflection-prefill.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-04)
- **Affects:** `scripts/src/startup-loop/__tests__/lp-do-build-results-review-prefill.test.ts` (new), `scripts/src/startup-loop/__tests__/lp-do-build-pattern-reflection-prefill.test.ts` (new)
- **Depends on:** TASK-01, TASK-02, TASK-03
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — existing test files (`lp-do-build-event-emitter.test.ts`, `lp-do-build-reflection-debt.test.ts`, `generate-process-improvements.test.ts`) demonstrate tmpdir fixtures, YAML frontmatter parsing, and markdown section assertion patterns. Direct copy-adapt.
- **Build evidence:**
  - `lp-do-build-results-review-prefill.test.ts`: 8 describe blocks covering TC-01 through TC-07 plus sub-routine unit tests (parseStandingRegistry, parsePlanTaskStatuses, computeVerdict, scanIdeaCategories, renderObservedOutcomesStub, renderStandingExpansion, frontmatter).
  - `lp-do-build-pattern-reflection-prefill.test.ts`: 9 describe blocks covering TC-01 through TC-06 plus deriveRecurrenceKey stability, scanArchiveForRecurrences edge cases, and routing decision tree edge cases.
  - Both files typecheck cleanly (`tsc --noEmit --strict --skipLibCheck`).
  - Tests use `@jest/globals` imports, sync tmpdir with `mkdtempSync`/`rmSync` cleanup, `.js` import extensions.
  - Approach: 85% — injectable `gitDiffFiles` parameter eliminates need for mock git repos. All assertions are against file contents (pure I/O). Held-back test: no single unresolved unknown would drop this below 80 because all test patterns exist.
  - Impact: 85% — tests validate that pre-fill output passes `validateResultsReviewContent()` and pattern-reflection output matches schema, ensuring no silent regressions.
- **Acceptance:**
  - Results-review pre-fill tests:
    - TC-01 through TC-07 from TASK-01 covered as test cases.
    - Fixture: tmpdir with plan.md (3 tasks, all Complete), build-event.json, standing-registry.json (3 entries).
    - Assert output passes `validateResultsReviewContent()`.
  - Pattern-reflection tests:
    - TC-01 through TC-06 from TASK-02 covered as test cases.
    - Fixture: tmpdir with `_archive/` subdirectory containing 2 results-review.user.md files with idea candidates.
    - Assert YAML frontmatter parses correctly and entries match expected routing targets.
  - All tests use `@jest/globals` imports and tmpdir cleanup.
  - Tests are CI-only per testing policy (`pnpm -w run test:governed`).
- **Validation contract (TC-XX):**
  - TC-01: Test file imports from `@jest/globals` (not bare `jest`).
  - TC-02: Each TASK-01 TC (01–07) has a corresponding test case in the results-review test file.
  - TC-03: Each TASK-02 TC (01–06) has a corresponding test case in the pattern-reflection test file.
  - TC-04: All tests use tmpdir fixtures with cleanup.
  - TC-05: Tests pass in CI (`pnpm -w run test:governed`).
- **Execution plan:**
  - Red: Create test files with `describe` blocks and all test cases as `it()` stubs.
  - Green: Implement each test case with fixture creation, function invocation, and assertions.
  - Refactor: Extract shared fixture helpers for standing-registry, plan.md, and build-event.json creation.
- **Planning validation (required for M/L):**
  - Checks run: Verified `lp-do-build-event-emitter.test.ts` (208 lines) uses tmpdir + `@jest/globals`. Verified `generate-process-improvements.test.ts` (461 lines) uses tmpdir fixtures with markdown file creation and idea extraction assertions.
  - Validation artifacts: `scripts/src/startup-loop/__tests__/lp-do-build-event-emitter.test.ts`, `scripts/src/startup-loop/__tests__/generate-process-improvements.test.ts`.
  - Unexpected findings: None.
- **Consumer tracing (new outputs):**
  - Test files produce no runtime outputs. They validate TASK-01 and TASK-02 outputs.
- **Consumer tracing (modified behaviors):**
  - No existing functions or tests are modified.
- **Scouts:** None: test patterns are well-established.
- **Edge Cases & Hardening:** None: test file concerns are covered by the test cases themselves.
- **What would make this >=90%:**
  - All tests pass in CI on first push.
- **Rollout / rollback:**
  - Rollout: Tests are automatically picked up by `test:governed` pattern.
  - Rollback: Delete test files.
- **Documentation impact:** None.
- **Notes / references:**
  - `docs/testing-policy.md` — CI-only test execution policy.

## Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Pre-fill generates incorrect None for a category that has real content | Low | Medium | Codemoot/inline refinement catches it; pre-fill is scaffold not final |
| Pattern-reflection produces false recurrence counts | Low | Low | Using title-normalized key (SHA-1 of lowercased, trimmed title) for cross-plan matching — avoids both fuzzy matching and the source-path-per-slug collision from `deriveIdeaKey` |
| Git diff unavailable in some build contexts | Low | Low | Accept `gitDiffFiles` as optional parameter; fall back to empty list (no standing updates detected) |
| Pre-fill adds complexity to already-long completion sequence | Low | Low | Single function call inserted before Step 2; fail-open (if script errors, existing flow runs) |

## Observability
- Logging: All pre-fill decisions logged to stderr with `[pre-fill]` prefix. Counts of None categories, standing-update matches, verdict result, pattern entries, and promoted count.
- Metrics: Compare token usage on 3 consecutive builds before/after pre-fill activation (manual measurement).
- Alerts/Dashboards: None — local script execution.

## Acceptance Criteria (overall)
- [ ] Pre-fill scripts produce valid results-review and pattern-reflection scaffolds.
- [ ] Output passes `validateResultsReviewContent()` (all 4 required sections present and valid).
- [ ] Pattern-reflection output conforms to `pattern-reflection.v1` schema.
- [ ] Codemoot/inline refinement still runs on pre-filled scaffold.
- [ ] `generate-process-improvements.ts` extracts ideas correctly from pre-filled output.
- [ ] All tests pass in CI.
- [ ] Fail-open: if pre-fill errors, existing completion flow runs unchanged.

## Decision Log
- 2026-03-04: Chose Option B (two separate scripts) over monolithic. Rationale: separation of concerns improves testability and allows independent iteration.
- 2026-03-04: Initially chose `deriveIdeaKey()` for recurrence counting; revised after critique to use title-normalized key (`deriveRecurrenceKey(title)`) because `deriveIdeaKey` includes `sourcePath` which differs per plan slug, producing artificially low cross-plan recurrence counts. `deriveIdeaKey` remains used for completed-ideas exclusion (per-source-path matching is correct there).
- 2026-03-04: Chose TS script invocation via `pnpm` over direct function import in SKILL.md. Rationale: consistency with existing Step patterns (bug-scan, generate-process-improvements).
- 2026-03-04: Added `scripts/package.json` to TASK-03 Affects per critique finding — script registration requires package.json modification.

## Overall-confidence Calculation
- TASK-01: 85% × M(2) = 170
- TASK-02: 85% × M(2) = 170
- TASK-03: 85% × S(1) = 85
- TASK-04: 85% × M(2) = 170
- Total: 595 / 7 = 85%

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Results-review pre-fill | Yes | None | No |
| TASK-02: Pattern-reflection auto-generator | Yes | None | No |
| TASK-03: Wire into SKILL.md | Yes — depends on TASK-01/02 output paths and function signatures | None — function names and package.json entries are specified in TASK-01/02 acceptance | No |
| TASK-04: Tests | Yes — depends on TASK-01/02/03 all being implemented | None — test patterns are established and fixtures are self-contained | No |
