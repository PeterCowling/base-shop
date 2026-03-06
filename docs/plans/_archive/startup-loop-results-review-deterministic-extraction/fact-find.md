---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: BOS
Workstream: Engineering
Created: 2026-03-06
Last-updated: 2026-03-06
Feature-Slug: startup-loop-results-review-deterministic-extraction
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/startup-loop-results-review-deterministic-extraction/plan.md
Dispatch-ID: IDEA-DISPATCH-20260306153000-0992
Trigger-Source: dispatch-routed
---

# Results-Review Prefill — Deterministic Signal Extraction Fact-Find

## Scope

### Summary

The `results-review` prefill script currently hardcodes all five idea categories to `None.` and leaves Observed Outcomes as an LLM placeholder, then relies on codemoot to scan build context and fill them. This fact-find investigates which of those first-pass extraction steps are genuinely deterministic (no model judgment required), how to implement each in TypeScript, how to structure the residual model step after pre-population, and what validation paths and risks apply.

### Goals

- Identify which of the 6+ signal types named in the dispatch are extractable deterministically via filesystem or git diff inspection.
- Determine the most practical TypeScript API/approach for each type.
- Characterise the "ambiguous residue" that must remain with the model, and how the model step receives pre-populated signals.
- Map validation paths for each extracted signal type.
- Surface risks and edge cases that could corrupt existing results-review output.

### Non-goals

- Changing the `results-review.user.md` markdown format or any downstream consumer.
- Implementing a JSON sidecar (that is dispatch 0993; this dispatch focuses only on lifting extraction into `lp-do-build-results-review-prefill.ts`).
- Changing the codemoot prompt text in SKILL.md (emerges from build, not planned here).

### Constraints & Assumptions

- Constraints:
  - Must remain fail-open: if any new extractor errors, the existing codemoot/inline step must still receive the scaffold and refine it.
  - Must not change the output markdown format consumed by `validateResultsReviewContent()` in `lp-do-build-reflection-debt.ts`.
  - All new logic goes inside `lp-do-build-results-review-prefill.ts` (or a co-located helper) — not inside SKILL.md itself.
  - Test coverage is mandatory (CI-only per `docs/testing-policy.md`).
- Assumptions:
  - `git diff --name-only HEAD~1 HEAD` is the reliable source of changed-file list (already used by the CLI entrypoint).
  - SKILL.md files live under `.claude/skills/` with a fixed name `SKILL.md`.
  - Startup-loop contract/spec changes are tracked by path prefix (`docs/business-os/startup-loop/` and `.claude/skills/`).
  - Schema/lint/validator additions are detectable by file extension and path patterns (`.schema.md`, `*-validator.ts`, `*-lint.ts`).

## Outcome Contract

- **Why:** Using the model to extract signals that are fully deterministic from file system state inflates prompt context and incurs token cost with no judgment upside. Lifting these extractions into TypeScript removes the cost entirely while making the extractions more reliable and testable.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `lp-do-build-results-review-prefill.ts` pre-populates changed-package detection, new-SKILL.md detection, startup-loop contract/spec changes, standing-registry intersections, schema/lint/validator additions, and build/task completion bullets — all without model involvement. The codemoot/inline step receives a richer scaffold and is responsible only for Observed Outcomes and any idea categories requiring genuine synthesis.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `scripts/src/startup-loop/build/lp-do-build-results-review-prefill.ts` — main prefill script; `prefillResultsReview()` is the pure function; `main()` is the CLI entry. All new extractors belong here (or in a co-located helper imported by this file).
- `.claude/skills/lp-do-build/SKILL.md` lines 206–228 — Step 1.7 runs the prefill; Step 2 runs codemoot to refine. The codemoot prompt at line 222 explicitly tells the model: "Only populate sections that contain placeholders or are missing substantive content." This is where the model handoff contract is defined.

### Key Modules / Files

1. `scripts/src/startup-loop/build/lp-do-build-results-review-prefill.ts` (355 lines) — target file for all new extraction functions.
2. `scripts/src/startup-loop/__tests__/lp-do-build-results-review-prefill.test.ts` (437 lines) — existing test suite (TC-01 through TC-07 plus sub-routine describe blocks). New extractors need additional TCs here.
3. `scripts/src/startup-loop/build/lp-do-build-reflection-debt.ts` — exports `validateResultsReviewContent()` and `REQUIRED_REFLECTION_SECTIONS`. Any output change must still pass this validator.
4. `scripts/src/startup-loop/build/lp-do-build-event-emitter.ts` — `BuildEvent` type; `readBuildEvent()` used by `computeVerdict()`. Already used for the verdict signal.
5. `scripts/src/startup-loop/build/lp-do-build-pattern-reflection-prefill.ts` — parallel prefill for `pattern-reflection.user.md`. Demonstrates the established pattern: pure `prefill*()` function, `main()` CLI, same `require('node:child_process').execSync` approach for git commands.
6. `docs/business-os/startup-loop/ideas/standing-registry.json` — registry.v2 format; `artifacts[]` array with `path`, `artifact_id`, `active` fields. Already consumed by `parseStandingRegistry()` + `detectStandingUpdates()`.
7. `docs/plans/_templates/results-review.user.md` — canonical output shape; 5 named sections; must not change.
8. `scripts/package.json` — `startup-loop:results-review-prefill` script entry; new extractor functions are in-process, no new script entry needed.
9. `.claude/skills/` directory — contains all SKILL.md files; the glob `**/.claude/skills/*/SKILL.md` (relative to repo root) is the detection surface for new skills.
10. `docs/business-os/startup-loop/` — directory subtree; changes to files under this path signal startup-loop contract/spec updates.

### Patterns & Conventions Observed

- All extraction functions in `lp-do-build-results-review-prefill.ts` are exported pure functions that take typed inputs. They do not call the filesystem themselves — filesystem I/O is isolated in `main()` or `prefillResultsReview()`. New extractors should follow this pattern.
- Git diff is called via `execSync('git diff --name-only HEAD~1 HEAD')` in `getGitDiffFiles()` already. This output (the `gitDiffFiles: string[]` array) is passed into every sub-routine that needs it. New extractors receive `gitDiffFiles` as a parameter — no additional git calls needed inside extractors.
- The `detectStandingUpdates()` function demonstrates the established intersection pattern: normalize paths, build a Set from `gitDiffFiles`, iterate artifacts, collect matches.
- Log output goes to `process.stderr` via the private `log()` function — never to `process.stdout` which carries the markdown output.
- Output lines for each section are arrays of strings joined into the final markdown template in `prefillResultsReview()`.
- Fail-open: every extractor returns a safe fallback (empty list, "None." line, or "no X detected" line) on any error.

### Data & Contracts

- Types/schemas/events:
  - `PrefillResultsReviewOptions` — the options object for `prefillResultsReview()`; `gitDiffFiles: string[]` is already present; new extractors will use this without requiring schema changes.
  - `StandingRegistryArtifact` — `{ artifact_id, path, active, ...rest }` — already defined.
  - `TaskStatus` — `{ taskId, status }` — already defined.
  - `BuildEvent` — from `lp-do-build-event-emitter.ts`; `build_id`, `feature_slug`, `why`, `intended_outcome`.
  - No new types required for any of the 6 proposed extractors — all operate on `string[]` inputs and return `string[]` outputs.
- Persistence:
  - Input: `gitDiffFiles` (in-memory from `getGitDiffFiles()`), `planDir` (filesystem path), `standingRegistryPath` (filesystem path).
  - Output: `results-review.user.md` written by `main()` via `fs.writeFileSync`. No new output files.
- API/contracts:
  - `validateResultsReviewContent()` checks for presence of `REQUIRED_REFLECTION_SECTIONS`: `["Observed Outcomes", "Standing Updates", "New Idea Candidates", "Standing Expansion"]`. None of the new extractors change section headers — they only enrich section body lines. Validator continues to pass.

### Dependency & Impact Map

- Upstream dependencies:
  - `git diff --name-only HEAD~1 HEAD` — executed once in `getGitDiffFiles()`; result passed through.
  - `docs/business-os/startup-loop/ideas/standing-registry.json` — already consumed.
  - `docs/plans/<slug>/plan.md` — already consumed for task statuses.
  - `docs/plans/<slug>/build-event.json` — already consumed for verdict.
  - `.claude/skills/` filesystem — new dependency for SKILL.md detection.
  - `docs/business-os/startup-loop/` filesystem — new dependency for contract/spec change detection.
- Downstream dependents:
  - `lp-do-build` Step 2 (codemoot/inline): reads `results-review.user.md` to refine it. With richer pre-population, the codemoot prompt at line 222 already handles this correctly — it says "Only populate sections that contain placeholders or are missing substantive content." No prompt change required.
  - `lp-do-build-reflection-debt.ts` `validateResultsReviewContent()`: validates required sections are present. Unaffected — section headers unchanged.
  - `lp-do-build-pattern-reflection-prefill.ts` `extractIdeasSection()`: parses `## New Idea Candidates` section from the results-review. This parser handles populated bullet lines (not only `None.`). Populated idea categories will be correctly extracted by the existing parser logic.
- Likely blast radius:
  - Narrow. All changes are inside `lp-do-build-results-review-prefill.ts`. The codemoot step, the validator, and the pattern-reflection prefill are all consumers that handle enriched content without modification.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (via `@jest/globals`)
- Commands: CI-only (`pnpm -w run test:governed -- jest -- --config=scripts/jest.config.cjs --testPathPattern=lp-do-build-results-review-prefill`)
- CI integration: governed test runner; tests must not be run locally.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `prefillResultsReview()` integration | Unit | `lp-do-build-results-review-prefill.test.ts` TC-01–TC-07 | Covers all current sub-routines |
| `detectStandingUpdates()` | Unit | TC-04, TC-05, TC-06 | Path normalization, match/no-match |
| `computeVerdict()` | Unit | describe block | All verdict paths |
| `parsePlanTaskStatuses()` | Unit | describe block | Complete, Partial, missing plan.md |
| `parseStandingRegistry()` | Unit | describe block | Active-only filter, malformed JSON |
| `scanIdeaCategories()` | Unit | describe block | 5×None confirmed |
| `validateResultsReviewContent()` | Integration via TC-07 | TC-07 | Output passes validator |

#### Coverage Gaps

- Untested paths:
  - `detectChangedPackages()` — does not yet exist; needs new TCs.
  - `detectNewSkills()` — does not yet exist; needs new TCs.
  - `detectStartupLoopContractChanges()` — does not yet exist; needs new TCs.
  - `detectSchemaValidatorAdditions()` — does not yet exist; needs new TCs.
  - `scanIdeaCategories()` returning populated entries (not just `None.`) — to be unlocked once functions above are wired in.
- Extinct tests: none identified.

#### Testability Assessment

- Easy to test: all new extractors will be pure functions taking `gitDiffFiles: string[]` and returning `string[]`. Identical test pattern to existing TCs. No filesystem calls inside extractors.
- Hard to test: none. The git diff is already abstracted out of extractors.
- Test seams needed: none new — `gitDiffFiles` parameter is the existing seam.

### Recent Git History (Targeted)

- `scripts/src/startup-loop/build/lp-do-build-results-review-prefill.ts` — introduced in commit `642f054383` (2026-03-03) as part of `build-completion-deterministic-lifts`. The commit added both `lp-do-build-results-review-prefill.ts` and `lp-do-build-pattern-reflection-prefill.ts` together, wiring them into SKILL.md Steps 1.7 and 2.4. This is the only commit touching this file.

## Signal-Type Analysis (Core Investigation)

This section documents the determinism assessment for each of the 6 signal types in the dispatch.

### Signal-to-Section Mapping

| Signal | Output section | Idea category |
|---|---|---|
| 1 — Changed packages | `## Observed Outcomes` (build context bullets) | — |
| 2 — New SKILL.md | `## New Idea Candidates` | Category 3: New skill |
| 3 — Startup-loop contract/spec changes | `## New Idea Candidates` | Category 4: New loop process |
| 4 — Standing-registry intersections | `## Standing Updates` | — (already implemented) |
| 5 — Schema/lint/validator additions | `## New Idea Candidates` | Category 5: AI-to-mechanistic |
| 6 — Task completion bullets | `## Observed Outcomes` (completion anchor) | — |

Signals 1 and 6 enrich `## Observed Outcomes` only. Signals 2, 3, and 5 directly populate idea category lines in `## New Idea Candidates` (replacing `None.` when evidence is found). Signal 4 is already deterministic.

### Signal 1: Changed Package Detection

**Question:** Which packages in the monorepo changed in this build's diff?

**Determinism verdict:** Fully deterministic.

**Extraction approach:** Filter `gitDiffFiles` for paths matching `packages/<name>/` or `apps/<name>/`. Extract the first two path segments and deduplicate. A Set-based approach identical to `detectStandingUpdates()` works here.

```typescript
// Pure function signature (illustrative — not to be implemented here):
function detectChangedPackages(gitDiffFiles: string[]): string[]
// Returns lines like: "- packages/email: changed"
```

**Validation path:** Unit test with synthetic `gitDiffFiles` arrays. Assert deduplication, path normalization (leading slash strip, backslash normalization), and the "no packages changed" fallback.

**Risks/edge cases:**
- Files at repo root (e.g., `package.json`, `turbo.json`) — should not be reported as package changes. Guard: only count paths with at least 2 segments where segment[0] is `packages` or `apps`.
- Submodule paths: not present in this monorepo (confirmed by standing-registry structure).
- Cross-package changes: correctly produces multiple lines, one per package.

**Category mapping:** This signal is not directly one of the 5 idea categories. It belongs in `## Observed Outcomes` as a build-context bullet (e.g. "Changed packages: `packages/email`, `apps/brikette`"). The codemoot step already uses it when filling Observed Outcomes — pre-populating it removes one model inference step.

### Signal 2: New SKILL.md Detection

**Question:** Were any new `SKILL.md` files added in this build?

**Determinism verdict:** Fully deterministic.

**Extraction approach:** Filter `gitDiffFiles` for paths matching `**/.claude/skills/*/SKILL.md`. Files that appear in the diff with a creation status are new skills. Since `git diff --name-only` does not include status (A/M/D), use `git diff --name-status HEAD~1 HEAD` instead to distinguish additions (`A`) from modifications (`M`). The existing `getGitDiffFiles()` function uses `--name-only`; a parallel `getGitDiffWithStatus()` returning `Array<{status: string, path: string}>` is the cleanest approach, or pass a `gitDiffWithStatus` parameter alongside `gitDiffFiles`.

**Implementation decision (committed):** Add a `getGitDiffWithStatus()` helper returning `Array<{status: 'A'|'M'|'D', path: string}>` by calling `git diff --name-status HEAD~1 HEAD` and parsing the tab-delimited lines. Filter to `status === 'A'` for new-file detection. This is the correct approach — it is a single git call, no per-file shell invocations, and clearly distinguishes additions from modifications. The per-file `git show HEAD~1:<path>` alternative is inferior (multiple shell calls) and should not be implemented.

**Validation path:** Unit test with synthetic status/path pairs. Test: one new SKILL.md → "New skill: `lp-do-new/SKILL.md`". Test: modified SKILL.md → not reported as new. Test: no matching files → "None." line for `New skill` category.

**Category mapping:** Directly maps to idea category 3: "New skill — recurring agent workflow ready to be codified as a named skill". When detected, emit a populated line rather than `None.` for category 3.

**Risks/edge cases:**
- SKILL.md modified (not added): must not be reported as "new". Requires `--name-status` or a secondary check.
- SKILL.md deleted: irrelevant, but `--name-status` correctly gives `D` — filter to `A` only.
- SKILL.md at non-standard depth (e.g., `.claude/skills/sub-dir/foo/SKILL.md`): the path pattern should match any depth under `.claude/skills/`.

### Signal 3: Startup-Loop Contract/Spec Changes

**Question:** Did any startup-loop specification or contract file change?

**Determinism verdict:** Fully deterministic.

**Extraction approach:** Filter `gitDiffFiles` for paths under the following scoped prefixes only:
- `docs/business-os/startup-loop/contracts/` — formal loop output contracts
- `docs/business-os/startup-loop/specifications/` — loop specification documents
- `.claude/skills/lp-do-` prefix on `SKILL.md` files (e.g., `.claude/skills/lp-do-build/SKILL.md`) — the loop skill definitions are also loop contracts

Broader paths such as `docs/business-os/startup-loop/ideas/` (queue-state, telemetry, ideas trial data) are explicitly excluded — they change every build and are not contract signals.

**Validation path:** Unit test with synthetic paths covering: loop spec file changed, non-loop file changed (not reported), loop skill SKILL.md changed.

**Category mapping:** Maps to idea category 4: "New loop process — missing stage, gate, or feedback path in the startup loop". A contract change is strong evidence that the loop process is evolving. Pre-populate the category 4 entry with the specific file(s) changed.

**Risks/edge cases:**
- False positives: any doc change under `docs/business-os/startup-loop/` is reported. This includes telemetry, queue-state, and ideas files that are not "contracts". Mitigation: narrow the filter to `docs/business-os/startup-loop/contracts/` and `docs/business-os/startup-loop/specifications/` and `.claude/skills/lp-do-*/SKILL.md`. Queue-state changes are noise; contracts/specifications changes are signal.

### Signal 4: Standing-Registry Intersections

**Determinism verdict:** Already implemented.

**Current state:** `detectStandingUpdates()` at line 112 of `lp-do-build-results-review-prefill.ts` fully handles this. It intersects `gitDiffFiles` with `registryArtifacts[].path` and returns `StandingUpdateMatch[]`. The `## Standing Updates` section is correctly pre-populated.

**No work needed** for this signal type. It is the most developed of all six.

### Signal 5: Schema/Lint/Validator Additions

**Question:** Were any new schema definitions, lint rules, or validator files added?

**Determinism verdict:** Mostly deterministic (with a path-pattern heuristic).

**Extraction approach:** Filter `gitDiffFiles` for files matching patterns:
- `*.schema.md`, `*.schema.json`, `*.schema.ts`
- `*-validator.ts`, `*-lint.ts`, `*-lint.cjs`, `*-linter.ts`
- `docs/business-os/startup-loop/**/*.schema.*`
- `scripts/src/**/*-validator*`

Added files (status `A` from `--name-status`) are more signal-rich, but even `--name-only` filtering to schema/validator patterns yields useful results.

**Validation path:** Unit test with synthetic file lists covering: schema file added, non-schema file added (not reported), validator file modified.

**Category mapping:** Maps loosely to idea category 5: "AI-to-mechanistic — LLM reasoning step replaceable with a deterministic script." A new validator is evidence that a previously manual/model check has been codified. Pre-populate category 5 with the validator file name if detected.

**Risks/edge cases:**
- Path heuristic may produce false positives (e.g., a file named `password-validator.ts` in an app is not a loop validator). Mitigation: scope the pattern to `scripts/src/startup-loop/**` for maximum precision; report files from other locations only if they match the `startup-loop` path prefix.
- Low occurrence: schema additions are rare per build. If no matches, emit `None.` for category 5 (current behavior preserved).

### Signal 6: Build/Task Completion Bullets (Observed Outcomes)

**Question:** Can the build's task completion state be pre-populated into `## Observed Outcomes`?

**Determinism verdict:** Partially deterministic.

**Current state:** `parsePlanTaskStatuses()` already extracts task IDs and statuses from `plan.md`. `computeVerdict()` already uses this to determine Met/Partially Met. However, `renderObservedOutcomesStub()` at line 187 returns only a placeholder comment — it does not use the already-extracted task statuses.

**Extraction approach:** Wire `taskStatuses` into `renderObservedOutcomesStub()` (or a replacement function `renderObservedOutcomes()`). Pre-populate with:
- A line per completed task: `- TASK-01: Complete — <task description from plan.md if parseable>`
- A summary line: `- N of M tasks completed.`

This replaces the LLM placeholder for the completion-count portion of Observed Outcomes. The LLM (codemoot/inline) still fills the qualitative "what was achieved" narrative. The pre-populated bullets give the model anchoring context.

**Parsing challenge:** Task descriptions are available in the plan.md table (column 3 in the `| TASK-XX | Type | Description | Confidence | Effort | Status |` format). The existing `parsePlanTaskStatuses()` regex captures only taskId and status. Extending it to also capture description is low-risk (same line, same regex group).

**Validation path:** Update `parsePlanTaskStatuses()` to capture description; update existing TCs to assert description field; add new TC for `renderObservedOutcomes()` with task list input.

**Risks/edge cases:**
- Task description may be truncated or contain markdown syntax — sanitise before embedding in bullet.
- If `plan.md` is missing or malformed, fall back to the current placeholder stub (existing fail-open path).
- The model step must not overwrite pre-populated completion bullets. The codemoot prompt at SKILL.md line 222 already handles this: "Do not overwrite correctly pre-filled None entries unless there is actual evidence" — this principle extends to pre-filled completion bullets. The prompt may need a minor addition: "Do not overwrite pre-filled task completion bullets."

## Residual Model Step Design

After deterministic pre-extraction, the codemoot/inline step receives a scaffold with:
- `## Observed Outcomes`: task-completion bullets pre-populated; qualitative narrative placeholder remains.
- `## Standing Updates`: unchanged (already deterministic).
- `## New Idea Candidates`:
  - Category 3 (New skill): populated if new SKILL.md added; else `None.`
  - Category 4 (New loop process): populated if startup-loop contract changed; else `None.`
  - Category 5 (AI-to-mechanistic): populated if validator/schema added; else `None.`
  - Categories 1 (New standing data source) and 2 (New open-source package): remain `None.` — these require model judgment (looking at `package.json` changes, external API references in diff, documentation mentions).
- `## Standing Expansion`: unchanged (remains `None.` / model fills).
- `## Intended Outcome Check`: unchanged (auto-verdict already deterministic).

**What "ambiguous residue" means:** After pre-extraction, the model step handles:
1. Qualitative narrative in `## Observed Outcomes` — what the build achieved in human terms, not just which tasks completed.
2. Categories 1 and 2 in `## New Idea Candidates` — genuinely require reading diff content for npm package additions, external data source references.
3. Confirming or upgrading pre-populated categories 3/4/5 when the model finds additional evidence.
4. `## Standing Expansion` — model judgment on whether any of the observed changes warrant registering a new standing artifact.

**How the model step receives pre-populated signals:** No change to the handoff mechanism. The codemoot prompt at SKILL.md line 222 already reads the pre-filled scaffold from disk and says "Only populate sections that contain placeholders or are missing substantive content." Pre-populated non-placeholder content is left untouched. The only prompt addition needed: explicitly name which categories can remain `None.` without the model second-guessing them (categories 3/4/5 when `None.` means the detector ran and found nothing).

## Dependency & Impact Map

- Upstream dependencies:
  - `gitDiffFiles: string[]` — already provided to `prefillResultsReview()`; sufficient for signals 1, 3, 4, 5, 6. Signal 2 (new SKILL.md) uses a new `gitDiffWithStatus: Array<{status: 'A'|'M'|'D', path: string}>` input produced by `getGitDiffWithStatus()` and passed into `prefillResultsReview()` via a new optional field in `PrefillResultsReviewOptions`.
  - `planDir: string` — already provided; extended `parsePlanTaskStatuses()` reads `plan.md` from here.
- Downstream dependents:
  - Codemoot prompt (SKILL.md line 222): receives richer scaffold; minor wording addition recommended.
  - `validateResultsReviewContent()`: no change required.
  - `lp-do-build-pattern-reflection-prefill.ts` `extractIdeasSection()`: handles populated bullet lines already (per `extractBulletTitles()` logic that handles both `None.` and real content).

## Questions

### Resolved

- Q: Does `git diff --name-only HEAD~1 HEAD` give a reliable changed-file list?
  - A: Yes. Already used by `getGitDiffFiles()` in the CLI entrypoint. The `gitDiffFiles` array is passed through to all sub-routines as a parameter.
  - Evidence: `lp-do-build-results-review-prefill.ts` lines 303–315.

- Q: Will populating idea categories with non-`None.` lines break the pattern-reflection prefill?
  - A: No. `extractBulletTitles()` in `lp-do-build-pattern-reflection-prefill.ts` (lines 90–101) already handles real content lines (not only `None.`). `isNonePlaceholder()` (lines 60–68) correctly filters `None.` lines and passes through real idea titles for recurrence counting.
  - Evidence: `lp-do-build-pattern-reflection-prefill.ts` lines 60–101.

- Q: Does `validateResultsReviewContent()` require specific body content for the 4 required sections?
  - A: No. It only checks section header presence, not body content. Any non-empty body passes.
  - Evidence: `lp-do-build-reflection-debt.ts` `REQUIRED_REFLECTION_SECTIONS` and the TC-07 test confirming the validator passes with the current prefill output.

- Q: For new SKILL.md detection, is `--name-only` sufficient or does it need `--name-status`?
  - A: `--name-status` is required. A `getGitDiffWithStatus()` helper returning `Array<{status: 'A'|'M'|'D', path: string}>` is the correct implementation (single git call, no per-file invocations). Filter to `status === 'A'` for new-file detection. Using `--name-only` would report modified SKILL.md files as "new" — an unacceptable false positive that would repeat across every build that updates a skill.
  - Evidence: Analysis of `getGitDiffFiles()` at lines 303–315; fix committed in Signal 2 analysis above.

- Q: Are categories 1 and 2 (new data source, new open-source package) deterministic?
  - A: No. Category 1 (new standing data source) requires understanding whether an external feed/API is being integrated — this requires reading diff content semantically. Category 2 (new open-source package) could theoretically be done by diffing `package.json` additions, but distinguishing "adds capability" from "internal dependency bump" requires judgment. Both should remain with the model.
  - Evidence: Reasoning from category definitions in `docs/plans/_templates/results-review.user.md`.

- Q: Can `TaskStatus` be extended to include description without breaking existing tests?
  - A: Yes. The `TaskStatus` interface is `{ taskId: string; status: string }`. Adding `description?: string` is backward-compatible. Existing tests do not assert on the absence of the description field.
  - Evidence: `lp-do-build-results-review-prefill.ts` lines 40–43; test file assertions.

### Open (Operator Input Required)

None. All questions answerable from code evidence and reasoning.

## Confidence Inputs

- **Implementation:** 94% — All six signal types are fully analysed with concrete function signatures. The target file, test file, existing patterns, and data contracts are all known. The `getGitDiffWithStatus()` helper approach for signal 2 is committed (separate helper, not an in-place extension of `getGitDiffFiles()`).
  - Raises to >=80: already there.
  - Raises to >=90: already there.

- **Approach:** 88% — The extraction approach follows established patterns in the codebase exactly. The residual model step design is clear and the codemoot prompt handles it without modification for 4 of 5 signals; only a minor prompt wording addition is needed for signal 2.
  - Raises to >=80: already there.
  - Raises to >=90: already there.

- **Impact:** 85% — The token cost reduction is real (model no longer extracts categories 3/4/5 from diff context for the majority of builds). Magnitude depends on how often these signals fire. When none fire, impact is zero. When they do fire, the model is saved the inference work.
  - Raises to >=90: Instrument actual token cost before/after in one real build cycle.

- **Delivery-Readiness:** 95% — Entry point, test patterns, data contracts, and fail-open design are all established. Implementation is straightforward extension of existing sub-routines.
  - Raises to >=80: already there.
  - Raises to >=90: already there.

- **Testability:** 95% — All new extractors are pure functions with `gitDiffFiles: string[]` as the sole external dependency. Test pattern is identical to existing TCs. No mocking required.
  - Raises to >=80: already there.
  - Raises to >=90: already there.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Path pattern for schema/validator detection produces false positives | Low | Low | Scope to `scripts/src/startup-loop/**` path prefix; limit to known suffixes |
| SKILL.md detection — `getGitDiffWithStatus()` helper introduces a new code path | Low | Low | Simple git call; no external dependencies; same fail-open pattern as `getGitDiffFiles()` |
| Enriched task completion bullets in Observed Outcomes confuse the codemoot refinement step | Low | Low | The codemoot prompt already handles pre-filled content; minor wording addition if needed |
| Task description parsing regex breaks on unusual plan.md formatting | Low | Low | Fail-open: if description capture fails, emit taskId+status only (still better than pure stub) |
| Startup-loop contract path filter too broad (e.g., queue-state.json changes trigger false positive for category 4) | Medium | Low | Narrow filter to `contracts/` and `specifications/` subdirectories only |
| Test file runs locally despite CI-only policy | Low | High | Document CI-only constraint in task; governed test runner enforces this |

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Entry point — `lp-do-build-results-review-prefill.ts` `prefillResultsReview()` | Yes | None | No |
| Git diff data source — `getGitDiffFiles()` and `gitDiffFiles` parameter | Yes | None | No |
| Signal 1: changed package detection — path prefix filter | Yes | None | No |
| Signal 2: new SKILL.md detection — `getGitDiffWithStatus()` helper | Yes | None — implementation decision committed: `getGitDiffWithStatus()` returning `Array<{status,path}>`, filter to `status === 'A'` | No |
| Signal 3: startup-loop contract changes — path filter scope | Yes | None — scope committed: `contracts/`, `specifications/` subdirs and `.claude/skills/lp-do-*/SKILL.md` only | No |
| Signal 4: standing-registry intersections — already implemented | Yes | None | No |
| Signal 5: schema/validator additions — path heuristic | Yes | [Missing domain coverage] [Minor]: build-record.ts and plan.md validators are not schema files — filter must not over-match | No |
| Signal 6: task completion bullets — `parsePlanTaskStatuses()` extension | Yes | None | No |
| Downstream: `validateResultsReviewContent()` compatibility | Yes | None | No |
| Downstream: `extractBulletTitles()` in pattern-reflection prefill | Yes | None | No |
| Test coverage: new TCs for each new extractor | Yes | None — TCs are well-understood pattern; no structural blocker | No |
| Codemoot prompt compatibility (SKILL.md line 222) | Yes | [Integration boundary] [Minor]: Prompt may need one-sentence addition clarifying pre-filled category 3/4/5 entries should not be overwritten | No |

No Critical findings. All findings are Minor and advisory.

## Scope Signal

- Signal: right-sized
- Rationale: The change is tightly scoped to one file (`lp-do-build-results-review-prefill.ts`) with one test file. All six signal types are fully analysed. The residual model step design is clear. No external services, no schema migrations, no API changes. The existing fail-open infrastructure handles all new extractors without modification.

## Evidence Gap Review

### Gaps Addressed

- Confirmed `extractBulletTitles()` handles populated idea category lines (not only `None.`) — gap addressed by reading `lp-do-build-pattern-reflection-prefill.ts` lines 90–101.
- Confirmed `validateResultsReviewContent()` is header-only, not body-content-sensitive — gap addressed by reading `lp-do-build-reflection-debt.ts` and TC-07.
- Confirmed no new `PrefillResultsReviewOptions` schema changes needed — all new extractors use existing `gitDiffFiles: string[]` parameter.
- Confirmed codemoot prompt at SKILL.md line 222 already handles pre-filled content preservation.

### Confidence Adjustments

- Implementation score raised to 92% (from initial estimate of 85%) after confirming all sub-routine patterns are established and no new infrastructure is required.
- Impact score held at 85% because token savings magnitude is build-dependent and cannot be measured without instrumentation.

### Remaining Assumptions

- `getGitDiffWithStatus()` helper is committed as the implementation for signal 2 (SKILL.md detection). The plan task implements it, not decides it.
- The codemoot prompt is assumed to correctly handle pre-filled category 3/4/5 entries without explicit modification; this should be verified in the build task by testing with a synthetic build context.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan startup-loop-results-review-deterministic-extraction --auto`

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - `lp-do-build-results-review-prefill.ts` exports 4–5 new pure functions (signals 1, 2, 3, 5, 6) each returning `string[]`
  - `prefillResultsReview()` wires new extractors into the output template
  - Test file has new TCs for each function; all pass in CI
  - `validateResultsReviewContent()` continues to pass for all outputs
  - SKILL.md codemoot prompt wording confirmed or updated
- Post-delivery measurement plan:
  - Run one real build after deployment and inspect `results-review.user.md` for pre-populated signals
  - Compare codemoot prompt context size before and after (qualitative: fewer placeholder comments in input)

## Suggested Task Seeds (Non-binding)

- TASK-01: Add `detectChangedPackages(gitDiffFiles)` and wire into Observed Outcomes section; unit TCs
- TASK-02: Add `getGitDiffWithStatus()` helper returning `Array<{status: 'A'|'M'|'D', path: string}>`; add `gitDiffWithStatus` optional field to `PrefillResultsReviewOptions`; add `detectNewSkills(diffWithStatus)` for category 3; unit TCs
- TASK-03: Add `detectStartupLoopContractChanges(gitDiffFiles)` for category 4 (path filter: `contracts/`, `specifications/`); unit TCs
- TASK-04: Add `detectSchemaValidatorAdditions(gitDiffFiles)` for category 5 (path heuristic scoped to `scripts/src/startup-loop/**`); unit TCs
- TASK-05: Extend `parsePlanTaskStatuses()` to capture task description; add `renderObservedOutcomes(taskStatuses)` replacing stub; unit TCs
- TASK-06: Wire all new extractors into `prefillResultsReview()`; update integration TC-01 to assert enriched output; confirm `validateResultsReviewContent()` still passes; verify SKILL.md codemoot prompt compatibility
