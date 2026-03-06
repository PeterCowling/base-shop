---
Type: Plan
Status: Active
Domain: BOS
Workstream: Engineering
Created: 2026-03-06
Last-reviewed: 2026-03-06
Last-updated: 2026-03-06
Build-completed: 2026-03-06
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-loop-results-review-deterministic-extraction
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Results-Review Prefill — Deterministic Signal Extraction Plan

## Summary

Five new pure-function extractors are added to `lp-do-build-results-review-prefill.ts`, each handling a signal type that is deterministically extractable from the git diff and filesystem without model involvement. A sixth task wires all new extractors into `prefillResultsReview()` and updates the integration test. After this build, the codemoot/inline refinement step receives a pre-populated scaffold for changed-package bullets, new-skill detection (category 3), startup-loop contract changes (category 4), schema/validator additions (category 5), and task-completion bullets — reducing the model to handling only genuinely ambiguous synthesis (observed-outcome narrative, idea categories 1 and 2).

All new extractors follow the established pattern: typed inputs, `string[]` output, `process.stderr` logging, fail-open fallback. Tests run CI-only. No output format changes; `validateResultsReviewContent()` continues to pass. No prompt changes to SKILL.md are required for the existing codemoot prompt.

## Active tasks

- [x] TASK-01: Add `detectChangedPackages()` extractor
- [x] TASK-02: Add `getGitDiffWithStatus()` helper + `detectNewSkills()` extractor
- [x] TASK-03: Add `detectStartupLoopContractChanges()` extractor
- [x] TASK-04: Add `detectSchemaValidatorAdditions()` extractor
- [x] TASK-05: Extend `parsePlanTaskStatuses()` + add `renderObservedOutcomes()`
- [x] TASK-06: Wire extractors into `prefillResultsReview()` + integration test update

## Goals

- Lift 5 deterministic signal extractions out of the model step and into TypeScript.
- Each new extractor is a pure function: testable, typed, fail-open.
- Downstream consumers (`validateResultsReviewContent()`, `extractBulletTitles()`, codemoot prompt) work without modification.
- All new TCs pass in CI.

## Non-goals

- Changing `results-review.user.md` markdown format.
- Implementing a JSON sidecar (dispatch 0993 scope).
- Modifying SKILL.md codemoot prompt text.
- Adding categories 1 or 2 (new data source, new open-source package) — these require model judgment.

## Constraints & Assumptions

- Constraints:
  - Must remain fail-open: any extractor error must fall through to the codemoot/inline step.
  - Output markdown format must not change (`validateResultsReviewContent()` must pass).
  - All new logic in `lp-do-build-results-review-prefill.ts`; no new source files.
  - Tests run CI-only; never run `jest` locally.
- Assumptions:
  - `git diff --name-only HEAD~1 HEAD` is reliable for single-commit builds (already in use).
  - `git diff --name-status HEAD~1 HEAD` tab-delimited format is standard across git versions in use.
  - SKILL.md files live at exactly `.claude/skills/<name>/SKILL.md` (one level deep).
  - `scripts/src/startup-loop/**` path prefix adequately scopes schema/validator detection.

## Inherited Outcome Contract

- **Why:** Using the model to extract signals that are fully deterministic from file system state inflates prompt context and incurs token cost with no judgment upside. Lifting these extractions into TypeScript removes the cost entirely while making the extractions more reliable and testable.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `lp-do-build-results-review-prefill.ts` pre-populates changed-package detection, new-SKILL.md detection, startup-loop contract/spec changes, standing-registry intersections, schema/lint/validator additions, and build/task completion bullets — all without model involvement. The codemoot/inline step receives a richer scaffold and is responsible only for Observed Outcomes and any idea categories requiring genuine synthesis.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/startup-loop-results-review-deterministic-extraction/fact-find.md`
- Key findings used:
  - All 6 signal types assessed; signals 1–3 and 5–6 are fully deterministic; signal 4 already implemented.
  - `getGitDiffWithStatus()` committed approach for signal 2 (SKILL.md detection).
  - Signal-to-section mapping: signals 1+6 → Observed Outcomes; signals 2+3+5 → New Idea Candidates categories 3/4/5.
  - `PrefillResultsReviewOptions` requires only one new optional field (`gitDiffWithStatus`) for signal 2.
  - `validateResultsReviewContent()` is header-only; all new extractors are safe.
  - `extractBulletTitles()` in pattern-reflection prefill already handles populated idea lines.

## Proposed Approach

- Option A: Six separate IMPLEMENT tasks (one per signal type) + one wiring task. Tasks 1–5 are independent (parallel Wave 1); task 6 depends on all five (serial Wave 2).
- Option B: Single large task implementing all extractors at once.
- Chosen approach: Option A. Separation keeps each task focused, reviewable, and independently testable. The wiring task (TASK-06) is the integration point and can verify the full output in one place.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add `detectChangedPackages()` + unit TCs | 90% | S | Complete (2026-03-06) | - | TASK-06 |
| TASK-02 | IMPLEMENT | Add `getGitDiffWithStatus()` helper + `detectNewSkills()` + unit TCs | 88% | S | Complete (2026-03-06) | - | TASK-06 |
| TASK-03 | IMPLEMENT | Add `detectStartupLoopContractChanges()` + unit TCs | 90% | S | Complete (2026-03-06) | - | TASK-06 |
| TASK-04 | IMPLEMENT | Add `detectSchemaValidatorAdditions()` + unit TCs | 85% | S | Complete (2026-03-06) | - | TASK-06 |
| TASK-05 | IMPLEMENT | Extend `parsePlanTaskStatuses()` + add `renderObservedOutcomes()` + unit TCs | 88% | S | Complete (2026-03-06) | - | TASK-06 |
| TASK-06 | IMPLEMENT | Wire all extractors into `prefillResultsReview()` + update integration tests | 90% | M | Complete (2026-03-06) | TASK-01, TASK-02, TASK-03, TASK-04, TASK-05 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03, TASK-04, TASK-05 | - | All independent pure-function extractors; safe to run in any order or in parallel |
| 2 | TASK-06 | All Wave 1 tasks | Wires all extractors into `prefillResultsReview()`; requires all new functions to exist |

## Tasks

---

### TASK-01: Add `detectChangedPackages()` extractor

- **Type:** IMPLEMENT
- **Deliverable:** New exported function `detectChangedPackages(gitDiffFiles: string[]): string[]` in `scripts/src/startup-loop/build/lp-do-build-results-review-prefill.ts`; new test describe block in `scripts/src/startup-loop/__tests__/lp-do-build-results-review-prefill.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-06)

**Build evidence:** `detectChangedPackages()` implemented at lines ~171–202. Normalizes paths, filters to `packages/`/`apps/` prefix, deduplicates via `Set`, returns bullet lines. TC-01a–e added to test file covering path normalization, deduplication, root-file exclusion, and empty array fallback.
- **Affects:** `scripts/src/startup-loop/build/lp-do-build-results-review-prefill.ts`, `scripts/src/startup-loop/__tests__/lp-do-build-results-review-prefill.test.ts`
- **Depends on:** -
- **Blocks:** TASK-06
- **Confidence:** 90%
  - Implementation: 95% — Pure function following exact pattern of `detectStandingUpdates()`. Normalise paths, filter to `packages/` or `apps/` prefix, deduplicate on first two segments, return bullet lines. Pattern fully established.
  - Approach: 95% — Path prefix filter is the correct approach. No ambiguity.
  - Impact: 90% — Pre-populates changed-package context in `## Observed Outcomes`. Immediately useful to the codemoot refinement step. Held-back test: no single unknown would drop this below 90 — the only risk is that a build has no `packages/` or `apps/` file changes (handled by the fallback `None:` line).
- **Acceptance:**
  - `detectChangedPackages(['packages/email/src/send.ts', 'apps/brikette/page.tsx'])` returns `['- packages/email: changed', '- apps/brikette: changed']`
  - `detectChangedPackages(['packages/email/a.ts', 'packages/email/b.ts'])` deduplicates to one `packages/email` entry
  - `detectChangedPackages(['package.json', 'turbo.json'])` returns the fallback `['- No package changes detected']` (root files excluded)
  - `detectChangedPackages([])` returns the fallback line
  - Path normalization: leading slash stripped, backslashes converted to forward slashes
- **Validation contract (TC-01):**
  - TC-01a: `['packages/email/src/send.ts', 'apps/brikette/page.tsx']` → two bullets, one per top-level package
  - TC-01b: duplicate paths under same package → deduplicated to one bullet
  - TC-01c: root-level files (`package.json`) → no package bullet, fallback returned
  - TC-01d: empty array → fallback returned
  - TC-01e: leading slash normalization `['/packages/email/foo.ts']` → `packages/email` extracted correctly
- **Execution plan:**
  - Red: write failing TCs (TC-01a–e) against a stub that returns `[]`
  - Green: implement `detectChangedPackages()` — normalize paths, filter to segment[0] === 'packages' || 'apps', collect unique `segment[0]/segment[1]` keys, return bullet lines
  - Refactor: ensure consistent fallback message format matches existing `detectStandingUpdates()` style
- **Planning validation (required for M/L):** None: S-effort task; fact-find evidence sufficient.
- **Scouts:** Path normalization edge cases (leading slash, backslash) — handled identically to `detectStandingUpdates()` lines 126–127.
- **Edge Cases & Hardening:** Root-level files excluded via segment count guard (`segments.length >= 2 && (segments[0] === 'packages' || segments[0] === 'apps')`). Deduplication via `Set`.
- **What would make this >=90%:** Already at 90%. Reaches 95% after TC-01a–e pass in CI.
- **Rollout / rollback:**
  - Rollout: function is exported but not yet called by `prefillResultsReview()` until TASK-06. Adding the function has zero runtime effect.
  - Rollback: delete the function and its TCs.
- **Documentation impact:** None: internal script; no user-facing docs.
- **Notes / references:** Fact-find Signal 1 analysis; `detectStandingUpdates()` at lines 112–143 as pattern reference.

---

### TASK-02: Add `getGitDiffWithStatus()` helper + `detectNewSkills()` extractor

- **Type:** IMPLEMENT
- **Deliverable:** New exported helper `getGitDiffWithStatus(): Array<{status: 'A'|'M'|'D', path: string}>` and new exported function `detectNewSkills(diffWithStatus: Array<{status: 'A'|'M'|'D', path: string}>): string[]`; new optional field `gitDiffWithStatus` on `PrefillResultsReviewOptions`; new test describe blocks
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-06)

**Build evidence:** `DiffEntry` interface added to Types section. `getGitDiffWithStatus()` implemented with tab-split parsing, rename-line skip (length ≠ 2), try/catch fallback. `detectNewSkills()` filters to `status === 'A'` and `.claude/skills/[^/]+/SKILL.md` regex. `gitDiffWithStatus?: DiffEntry[]` added to `PrefillResultsReviewOptions`. TC-02a–f added.
- **Affects:** `scripts/src/startup-loop/build/lp-do-build-results-review-prefill.ts`, `scripts/src/startup-loop/__tests__/lp-do-build-results-review-prefill.test.ts`
- **Depends on:** -
- **Blocks:** TASK-06
- **Confidence:** 88%
  - Implementation: 90% — `getGitDiffWithStatus()` is a one-liner modification of `getGitDiffFiles()`: call `git diff --name-status HEAD~1 HEAD`, split lines, parse `\t`-delimited `status\tpath` pairs, filter to truthy. `detectNewSkills()` filters to `status === 'A'` and paths matching `.claude/skills/*/SKILL.md`.
  - Approach: 90% — `--name-status` approach committed in fact-find. Single git call. Tab-delimited parsing is standard.
  - Impact: 85% — Category 3 (New skill) in `## New Idea Candidates` is correctly populated when a new SKILL.md is added. Held-back test: if `--name-status` format varies across git versions (unlikely in this repo), the parser could fail — but `getGitDiffWithStatus()` has a try/catch fallback returning `[]`, so the worst case is a `None.` entry for category 3 (acceptable).
- **Acceptance:**
  - `getGitDiffWithStatus()` returns `[{status: 'A', path: '...'}, {status: 'M', path: '...'}]` parsed from `git diff --name-status` output
  - `detectNewSkills([{status: 'A', path: '.claude/skills/lp-do-new/SKILL.md'}])` returns a populated category-3 bullet
  - `detectNewSkills([{status: 'M', path: '.claude/skills/lp-do-existing/SKILL.md'}])` returns `['- New skill — None.']` (modification not reported as new)
  - `detectNewSkills([])` returns `['- New skill — None.']`
  - `PrefillResultsReviewOptions.gitDiffWithStatus` is optional; if absent, `detectNewSkills` is called with `[]` and returns `None.`
- **Validation contract (TC-02):**
  - TC-02a: status `A`, path matches SKILL.md pattern → populated bullet
  - TC-02b: status `M`, path matches SKILL.md pattern → `None.` (modification excluded)
  - TC-02c: status `D`, path matches SKILL.md pattern → `None.` (deletion excluded)
  - TC-02d: empty input → `None.`
  - TC-02e: path under `.claude/skills/` but not `SKILL.md` → `None.`
  - TC-02f: `PrefillResultsReviewOptions` without `gitDiffWithStatus` field → `detectNewSkills` receives `[]` → `None.`
- **Execution plan:**
  - Red: write failing TCs (TC-02a–f) against stubs
  - Green: implement `getGitDiffWithStatus()` (try/catch around `execSync('git diff --name-status HEAD~1 HEAD')`; parse `status\tpath` lines); implement `detectNewSkills()` (filter to `status === 'A'`, match `.claude/skills/*/SKILL.md` via path-segment check or regex); add optional `gitDiffWithStatus` to `PrefillResultsReviewOptions`
  - Refactor: ensure `log()` call emits count of new SKILL.md files found (consistent with other extractors)
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** Tab-delimiter parsing: `line.split('\t')` → `[status, path]`. Lines without tabs (e.g., rename entries `R100\told\tnew`) are skipped (length !== 2 after split; safe to ignore for this use case).
- **Edge Cases & Hardening:** Rename lines from `--name-status` (`R` prefix with two paths) — skip lines where split produces != 2 parts. `getGitDiffWithStatus()` returns `[]` on any exception.
- **What would make this >=90%:** Reaches 95% once TC-02a–f pass in CI and rename-line edge case is confirmed handled.
- **Rollout / rollback:**
  - Rollout: `getGitDiffWithStatus()` called in `main()` alongside `getGitDiffFiles()`; result passed to `prefillResultsReview()` via new optional field. Fully isolated until TASK-06 wires it in.
  - Rollback: remove the helper, remove the optional field, remove TCs.
- **Documentation impact:** None: internal script.
- **Notes / references:** Fact-find Signal 2 analysis; `getGitDiffFiles()` at lines 303–315 as pattern reference.

---

### TASK-03: Add `detectStartupLoopContractChanges()` extractor

- **Type:** IMPLEMENT
- **Deliverable:** New exported function `detectStartupLoopContractChanges(gitDiffFiles: string[]): string[]` in `lp-do-build-results-review-prefill.ts`; new test describe block
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-06)

**Build evidence:** `detectStartupLoopContractChanges()` filters to `contracts/`, `specifications/`, and `.claude/skills/lp-do-` prefixes. Non-`lp-do-` skills and `ideas/` paths correctly excluded. TC-03a–f added.
- **Affects:** `scripts/src/startup-loop/build/lp-do-build-results-review-prefill.ts`, `scripts/src/startup-loop/__tests__/lp-do-build-results-review-prefill.test.ts`
- **Depends on:** -
- **Blocks:** TASK-06
- **Confidence:** 90%
  - Implementation: 95% — Straightforward path-prefix filter: `docs/business-os/startup-loop/contracts/`, `docs/business-os/startup-loop/specifications/`, and `.claude/skills/lp-do-*/SKILL.md`. Returns bullet per matching file. Pattern identical to `detectStandingUpdates()`.
  - Approach: 90% — Path scoping committed in fact-find. Queue-state and ideas paths explicitly excluded.
  - Impact: 90% — Category 4 (New loop process) populated when a contract/spec file changes. Held-back test: no single unknown would drop this below 90 — the filter is deterministic and the fallback is `None.`.
- **Acceptance:**
  - `detectStartupLoopContractChanges(['docs/business-os/startup-loop/contracts/loop-output-contracts.md'])` returns a populated category-4 bullet
  - `detectStartupLoopContractChanges(['.claude/skills/lp-do-build/SKILL.md'])` returns a populated category-4 bullet (loop skill SKILL.md counts as contract)
  - `detectStartupLoopContractChanges(['docs/business-os/startup-loop/ideas/trial/queue-state.json'])` returns `['- New loop process — None.']` (ideas/ path excluded)
  - `detectStartupLoopContractChanges(['docs/business-os/startup-loop/ideas/trial/telemetry.jsonl'])` returns `None.` (telemetry excluded)
  - `detectStartupLoopContractChanges(['.claude/skills/idea-scan/SKILL.md'])` returns `None.` (non-lp-do skill excluded)
  - Empty input → `None.`
- **Validation contract (TC-03):**
  - TC-03a: `contracts/` path → populated bullet
  - TC-03b: `specifications/` path → populated bullet
  - TC-03c: `.claude/skills/lp-do-build/SKILL.md` → populated bullet
  - TC-03d: `ideas/trial/queue-state.json` → `None.`
  - TC-03e: `.claude/skills/idea-scan/SKILL.md` (non-lp-do skill) → `None.`
  - TC-03f: empty input → `None.`
- **Execution plan:**
  - Red: write failing TCs (TC-03a–f)
  - Green: implement `detectStartupLoopContractChanges()` — filter paths matching `docs/business-os/startup-loop/contracts/`, `docs/business-os/startup-loop/specifications/`, or `.claude/skills/lp-do-` prefix; collect; return bullets or fallback
  - Refactor: consistent `log()` call
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** The `.claude/skills/lp-do-*` pattern: check via `path.startsWith('.claude/skills/lp-do-')` — matches `lp-do-build/SKILL.md`, `lp-do-plan/SKILL.md`, etc.
- **Edge Cases & Hardening:** Non-`lp-do-` skills (e.g., `idea-scan`, `tools-*`) must not match. Guard: require prefix `.claude/skills/lp-do-` not just `.claude/skills/`.
- **What would make this >=90%:** Already at 90%. Reaches 95% after TC-03a–f pass in CI.
- **Rollout / rollback:**
  - Rollout: exported but not called until TASK-06. Zero runtime effect.
  - Rollback: delete function and TCs.
- **Documentation impact:** None.
- **Notes / references:** Fact-find Signal 3 analysis.

---

### TASK-04: Add `detectSchemaValidatorAdditions()` extractor

- **Type:** IMPLEMENT
- **Deliverable:** New exported function `detectSchemaValidatorAdditions(gitDiffFiles: string[]): string[]` in `lp-do-build-results-review-prefill.ts`; new test describe block
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-06)

**Build evidence:** `detectSchemaValidatorAdditions()` uses `SCHEMA_VALIDATOR_SUFFIXES` constant for 7 suffix patterns scoped to `scripts/src/startup-loop/` prefix. TC-04a–f added covering all suffix types, out-of-scope paths, and empty input.
- **Affects:** `scripts/src/startup-loop/build/lp-do-build-results-review-prefill.ts`, `scripts/src/startup-loop/__tests__/lp-do-build-results-review-prefill.test.ts`
- **Depends on:** -
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 90% — Path-suffix filter for schema/validator patterns scoped to `scripts/src/startup-loop/**`. Clear implementation.
  - Approach: 85% — The path-pattern heuristic is correct but slightly weaker than the other signals because it relies on file naming conventions. Held-back test: if a new validator file is named differently (e.g., `check-output.ts` instead of `check-output-validator.ts`), it would be missed. Acceptable: the `None.` fallback is already the current behavior, so false negatives leave the existing state unchanged.
  - Impact: 85% — Category 5 (AI-to-mechanistic) populated when a new schema/validator is detected in the startup-loop scripts. Low occurrence per build but valuable signal when present.
- **Acceptance:**
  - `detectSchemaValidatorAdditions(['scripts/src/startup-loop/build/lp-do-build-reflection-debt-validator.ts'])` returns a populated category-5 bullet
  - `detectSchemaValidatorAdditions(['scripts/src/startup-loop/ideas/scan-proposals.schema.md'])` returns a populated category-5 bullet
  - `detectSchemaValidatorAdditions(['apps/brikette/src/lib/password-validator.ts'])` returns `['- AI-to-mechanistic — None.']` (outside startup-loop scope)
  - `detectSchemaValidatorAdditions(['scripts/src/startup-loop/build/lp-do-build-event-emitter.ts'])` returns `None.` (not a schema/validator by name)
  - Empty input → `None.`
- **Validation contract (TC-04):**
  - TC-04a: `scripts/src/startup-loop/**/*-validator.ts` → populated bullet
  - TC-04b: `scripts/src/startup-loop/**/*.schema.md` → populated bullet
  - TC-04c: `scripts/src/startup-loop/**/*.schema.json` → populated bullet
  - TC-04d: `apps/brikette/**/*-validator.ts` → `None.` (out of scope)
  - TC-04e: `scripts/src/startup-loop/**/regular-file.ts` → `None.`
  - TC-04f: empty input → `None.`
- **Execution plan:**
  - Red: write failing TCs (TC-04a–f)
  - Green: implement `detectSchemaValidatorAdditions()` — require path to start with `scripts/src/startup-loop/`; match suffixes `-validator.ts`, `-lint.ts`, `-lint.cjs`, `-linter.ts`, `.schema.md`, `.schema.json`, `.schema.ts`; collect; return bullets or fallback
  - Refactor: consistent `log()` call
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** File-suffix matching via `path.basename(p)` checks against known suffixes. List of suffixes: `['-validator.ts', '-lint.ts', '-lint.cjs', '-linter.ts', '.schema.md', '.schema.json', '.schema.ts']`.
- **Edge Cases & Hardening:** Scope guard (`startsWith('scripts/src/startup-loop/')`) prevents false positives from app validators. File name is included in the bullet so the operator can quickly identify which schema/validator was added.
- **What would make this >=90%:** Reaches 90% when TC-04a–f pass in CI. Reaches 95% if the suffix list is confirmed against all existing startup-loop validators.
- **Rollout / rollback:**
  - Rollout: exported but not called until TASK-06. Zero runtime effect.
  - Rollback: delete function and TCs.
- **Documentation impact:** None.
- **Notes / references:** Fact-find Signal 5 analysis.

---

### TASK-05: Extend `parsePlanTaskStatuses()` + add `renderObservedOutcomes()`

- **Type:** IMPLEMENT
- **Deliverable:** Extended `TaskStatus` interface (`description?: string`); updated `parsePlanTaskStatuses()` capturing description from plan.md table column 3; new exported function `renderObservedOutcomes(taskStatuses: TaskStatus[]): string`; updated existing TCs to assert `description` field; new TCs for `renderObservedOutcomes()`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-06)

**Build evidence:** `TaskStatus.description?: string` added (additive). Regex updated: group 1=taskId, group 2=description, group 3=status; `match[2]`→`match[3]` for status. `sanitiseDescription()` private helper strips `**bold**` and `` `code` ``. `renderObservedOutcomes()` emits per-Complete-task bullets + summary count, falls back to stub for empty/all-pending. TC-05a–e added; no regression on existing parsePlanTaskStatuses describe tests.
- **Affects:** `scripts/src/startup-loop/build/lp-do-build-results-review-prefill.ts`, `scripts/src/startup-loop/__tests__/lp-do-build-results-review-prefill.test.ts`
- **Depends on:** -
- **Blocks:** TASK-06
- **Confidence:** 88%
  - Implementation: 90% — `TaskStatus.description` is an additive optional field. The existing regex `^\|\s*(TASK-\d+)\s*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|\s*([^|]+?)\s*\|` captures 6 pipe-delimited columns; column 3 (description) is currently `[^|]*` (uncaptured). Adding a capture group for column 3 is a one-character change. `renderObservedOutcomes()` iterates `taskStatuses`, emits one bullet per completed task, sanitises description (strip markdown bold/backticks), adds a summary count line.
  - Approach: 90% — Description capture is additive and backward-compatible. Existing tests do not assert on the absence of `description`. `renderObservedOutcomes()` replaces `renderObservedOutcomesStub()` in TASK-06.
  - Impact: 85% — Task-completion bullets in `## Observed Outcomes` give the codemoot step concrete anchoring context instead of a blank placeholder. Held-back test: if plan.md uses a non-standard table format (extra columns, different header), the regex may not match — but `parsePlanTaskStatuses()` already handles this via the try/catch + empty-array fallback.
- **Acceptance:**
  - `parsePlanTaskStatuses(planDir)` returns `[{taskId: 'TASK-01', status: 'Complete', description: 'Add detectChangedPackages extractor'}]` for a standard plan table
  - `renderObservedOutcomes([{taskId: 'TASK-01', status: 'Complete', description: 'Add extractor'}])` returns a string containing `- TASK-01: Complete — Add extractor` and a summary line
  - `renderObservedOutcomes([])` returns the existing placeholder stub (fallback)
  - `renderObservedOutcomes` sanitises markdown bold (`**text**` → `text`) in descriptions
  - Existing TC parsePlanTaskStatuses tests continue to pass with the description field present (additive only)
- **Validation contract (TC-05):**
  - TC-05a: plan with 3 tasks all Complete → `parsePlanTaskStatuses()` returns descriptions; `renderObservedOutcomes()` emits 3 bullets + summary
  - TC-05b: plan with mixed Complete/Pending → `renderObservedOutcomes()` emits only Complete tasks in bullets + summary count
  - TC-05c: empty task list → `renderObservedOutcomes()` returns placeholder stub
  - TC-05d: description contains `**bold**` markdown → sanitised to `bold` in output
  - TC-05e: existing `parsePlanTaskStatuses` describe tests → all still pass (no regression)
- **Execution plan:**
  - Red: write TC-05a–e; add `description?: string` to `TaskStatus`; TCs initially fail because `description` is undefined
  - Green: change the existing regex in `parsePlanTaskStatuses()` from `^\|\s*(TASK-\d+)\s*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|\s*([^|]+?)\s*\|` to `^\|\s*(TASK-\d+)\s*\|\s*[^|]*\s*\|\s*([^|]+?)\s*\|\s*[^|]*\s*\|\s*[^|]*\s*\|\s*([^|]+?)\s*\|` — group 1 is taskId, group 2 is description (column 3), group 3 is status (column 6). Update all `match[2]` references in the function to `match[3]` for status and add `match[2].trim()` for description. Implement `renderObservedOutcomes()` with sanitisation and summary line. Keep `renderObservedOutcomesStub()` as fallback for empty task list.
  - Refactor: consolidate description sanitisation into a small `sanitiseDescription()` helper to keep `renderObservedOutcomes()` readable
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** Regex group index: current regex `match[2]` is status; adding capture group at position 2 makes description `match[2]` and status `match[3]`. Alternatively, keep status as-is and add description as `match[2]` by inserting the capture group before the status group. **Important:** update all existing `match[2]` references to `match[3]` (or restructure group order) to avoid silent regression.
- **Edge Cases & Hardening:** Regex group index shift — `parsePlanTaskStatuses()` currently uses `match[1]` for taskId and `match[2]` for status. After adding a capture group for description, status shifts to `match[3]`. All `match[N]` references in the function must be updated. TCs will catch any regression.
- **What would make this >=90%:** Reaches 90% when TC-05a–e pass and no regression in existing describe tests.
- **Rollout / rollback:**
  - Rollout: `renderObservedOutcomes()` is exported but not called until TASK-06. `TaskStatus.description` is optional so existing callers are unaffected.
  - Rollback: revert regex to original; remove `description` from `TaskStatus`; remove `renderObservedOutcomes()`; remove new TCs.
- **Documentation impact:** None.
- **Notes / references:** Fact-find Signal 6 analysis; `parsePlanTaskStatuses()` lines 77–95 in `lp-do-build-results-review-prefill.ts`.

---

### TASK-06: Wire all extractors into `prefillResultsReview()` + update integration tests

- **Type:** IMPLEMENT
- **Deliverable:** Updated `prefillResultsReview()` function calling all 5 new extractors; updated `PrefillResultsReviewOptions` with `gitDiffWithStatus` optional field; updated `main()` to call `getGitDiffWithStatus()`; updated TC-01 integration test asserting enriched output; `validateResultsReviewContent()` still passes on all outputs
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-06)

**Build evidence:** `prefillResultsReview()` wired: `detectChangedPackages()`+`renderObservedOutcomes()` combined into `## Observed Outcomes` (packages first, then completions); categories 1+2 hardcoded `None.`; categories 3/4/5 use extractor outputs. `scanIdeaCategories()` refactored to return 7-line HTML comment preamble only. `main()` calls `getGitDiffWithStatus()` and passes result as `gitDiffWithStatus`. TC-01 updated (category assertions per-line instead of `noneCount===5`). TC-06a–g added. `scanIdeaCategories` describe test updated to assert 7-line comment block. TC-02f verifies absent `gitDiffWithStatus` defaults to `[]`.
- **Affects:** `scripts/src/startup-loop/build/lp-do-build-results-review-prefill.ts`, `scripts/src/startup-loop/__tests__/lp-do-build-results-review-prefill.test.ts`
- **Depends on:** TASK-01, TASK-02, TASK-03, TASK-04, TASK-05
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — Mechanical wiring: call each new function inside `prefillResultsReview()`, insert outputs into the appropriate sections (`## Observed Outcomes` lines for TASK-01+05, idea category lines for TASK-02+03+04). `main()` gets one new call to `getGitDiffWithStatus()`.
  - Approach: 90% — The section insertion points are well-defined in the existing template. The only question is how the 5 category lines for `## New Idea Candidates` are rendered: currently all 5 are produced by `scanIdeaCategories()` as `None.` lines. After wiring, categories 3/4/5 come from the new extractors, and categories 1/2 remain as `None.`. `scanIdeaCategories()` should be refactored to accept optional overrides for categories 3/4/5, or replaced entirely with inline construction.
  - Impact: 95% — This is the task that activates all pre-extraction. Full integration test verifies the output.
- **Acceptance:**
  - `prefillResultsReview()` with a `gitDiffFiles` containing `packages/email/foo.ts` produces a `## Observed Outcomes` section with `- packages/email: changed`
  - `prefillResultsReview()` with a `gitDiffWithStatus` containing a new SKILL.md produces category-3 bullet in `## New Idea Candidates` instead of `None.`
  - `prefillResultsReview()` with `gitDiffFiles` containing `docs/business-os/startup-loop/contracts/loop-output-contracts.md` produces category-4 bullet
  - `prefillResultsReview()` with `gitDiffFiles` containing a startup-loop validator file produces category-5 bullet
  - `prefillResultsReview()` with completed task statuses produces task-completion bullets in `## Observed Outcomes`
  - `validateResultsReviewContent(output)` returns `{valid: true}` for all above cases
  - Existing TC-01 through TC-07 all continue to pass (no regression)
- **Validation contract (TC-06):**
  - TC-06a: packages change signal → `## Observed Outcomes` contains changed-package bullet
  - TC-06b: new SKILL.md signal → category-3 bullet in `## New Idea Candidates` (not `None.`)
  - TC-06c: startup-loop contract change signal → category-4 bullet
  - TC-06d: schema/validator addition signal → category-5 bullet
  - TC-06e: task completion → `## Observed Outcomes` contains completion bullets
  - TC-06f: all signals absent → all categories remain `None.`, `validateResultsReviewContent()` passes
  - TC-06g: existing TC-01 still passes (no regression on verdict/standing-updates path)
- **Execution plan:**
  - Red: write TC-06a–g; update `prefillResultsReview()` signature (add `gitDiffWithStatus` to options); TCs fail because extractors are not called yet
  - Green: call `detectChangedPackages()` and `renderObservedOutcomes()` in `prefillResultsReview()`; refactor `## New Idea Candidates` construction — keep `scanIdeaCategories()` only for the HTML comment block preamble (or inline the comment and remove the function); construct each of the 5 category lines individually: categories 1 and 2 always emit `'- New standing data source — None.'` and `'- New open-source package — None.'`; categories 3/4/5 use extractor output if non-empty, else `'- <Category> — None.'`; call `getGitDiffWithStatus()` in `main()`; pass `gitDiffWithStatus` through `PrefillResultsReviewOptions`
  - Refactor: ensure `scanIdeaCategories()` (or its inlined replacement) is consistent — the 5 category lines are assembled in order with the HTML comment block prepended; existing `scanIdeaCategories` describe test is updated to assert the new per-category construction (not 5×`None.` unconditionally)
- **Planning validation (required for M/L):**
  - Checks run: Read `prefillResultsReview()` body to confirm all insertion points; verify `## New Idea Candidates` section construction pattern; verify `main()` call site.
  - Validation artifacts: `lp-do-build-results-review-prefill.ts` lines 197–269 (the `prefillResultsReview()` function body).
  - Unexpected findings: `scanIdeaCategories()` currently returns all 5 category lines as a flat `string[]`. After TASK-06, categories 3/4/5 are replaced by extractor outputs. The cleanest refactor is to keep `scanIdeaCategories()` for the HTML comment block only, and construct each category line individually. This is a minor internal refactor with no output change.
- **Consumer tracing (new outputs):**
  - `detectChangedPackages()` output → inserted into `## Observed Outcomes` lines array (replacing or preceding the task-completion bullets). No other consumer reads individual Observed Outcomes bullets (only the LLM refinement step, which handles pre-filled content correctly per SKILL.md line 222).
  - `detectNewSkills()` output → replaces category 3 line in `## New Idea Candidates`. Consumer: `extractBulletTitles()` in `lp-do-build-pattern-reflection-prefill.ts` — confirmed to handle non-`None.` lines.
  - `detectStartupLoopContractChanges()` output → replaces category 4 line. Same consumer as above.
  - `detectSchemaValidatorAdditions()` output → replaces category 5 line. Same consumer.
  - `renderObservedOutcomes()` output → replaces `renderObservedOutcomesStub()` in `## Observed Outcomes`. No structured consumer; LLM step reads markdown.
  - All new outputs consumed safely.
- **Modified behavior check:**
  - `scanIdeaCategories()` — currently called unconditionally; after refactor, it may only be called for the category comment block. If `scanIdeaCategories()` is exported and tested, the test must be updated to reflect any signature change. Current test: `describe('scanIdeaCategories')` asserts 5×`None.` lines — this will need updating to assert the new construction pattern. **Action:** update `scanIdeaCategories` describe test in TASK-06.
  - `renderObservedOutcomesStub()` — currently exported; after TASK-06, `renderObservedOutcomes()` replaces it in the main function, but `renderObservedOutcomesStub()` remains as the fallback path (empty task list). Keep exported; update test if needed.
- **Scouts:** The `## Observed Outcomes` section currently contains one line: the stub. After TASK-06, it contains: (1) changed-package bullets (TASK-01), (2) task-completion bullets (TASK-05), (3) remaining qualitative narrative placeholder. Order: packages first (static context), then completions (specific evidence), then placeholder (for model to fill narrative). This ordering should be stated explicitly in the task output.
- **Edge Cases & Hardening:** All 5 extractor fallbacks return safe `None.`/fallback lines — no risk of malformed output. `validateResultsReviewContent()` TC-06f confirms the all-`None.` case still passes.
- **What would make this >=90%:** Already at 90%. Reaches 95% when TC-06a–g all pass in CI and no regression on TC-01–TC-07.
- **Rollout / rollback:**
  - Rollout: this task activates all new behavior. No feature flag needed — fail-open design means any extractor error falls through to the same stub output as before.
  - Rollback: revert `prefillResultsReview()` to pre-TASK-06 state; all 5 extractor functions remain (harmless, unused).
- **Documentation impact:** None: internal script; no user-facing or operator-facing output changes.
- **Notes / references:** `prefillResultsReview()` lines 197–269; `scanIdeaCategories()` lines 97–109; SKILL.md line 222 (codemoot prompt).

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| TASK-05 regex group index shift causes silent status regression | Low | Medium | Explicit held-back test in TASK-05 notes; TCs cover regression path (TC-05e) |
| `scanIdeaCategories()` refactor in TASK-06 breaks existing `scanIdeaCategories` describe test | Low | Low | TASK-06 explicitly notes: update the describe test as part of the wiring |
| `--name-status` rename entries (`R100\told\tnew`) cause parse errors in `getGitDiffWithStatus()` | Low | Low | Skip lines where `split('\t').length !== 2`; documented in TASK-02 Edge Cases |
| Category 3/4/5 false positives mislead codemoot refinement | Low | Low | Fail-open: if a signal is spurious, codemoot prompt ("only populate placeholders") will not over-rely on it |
| Tests accidentally run locally | Low | High | CI-only constraint documented in every task; governed test runner enforces it |

## Observability

- Logging: Each new extractor uses `log()` to `process.stderr` with count of signals found (consistent with existing extractors).
- Metrics: None: internal build script; no telemetry integration.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)

- [ ] `detectChangedPackages()`, `detectNewSkills()`, `detectStartupLoopContractChanges()`, `detectSchemaValidatorAdditions()`, `renderObservedOutcomes()` all exported from `lp-do-build-results-review-prefill.ts`
- [ ] `prefillResultsReview()` calls all 5 new extractors and uses their output in the appropriate sections
- [ ] All new TCs (TC-01 through TC-06) pass in CI
- [ ] All existing TCs (TC-01–TC-07 + sub-routine describe blocks) still pass (no regression)
- [ ] `validateResultsReviewContent(output)` returns `{valid: true}` for output with all signals absent (fallback case)
- [ ] `validateResultsReviewContent(output)` returns `{valid: true}` for output with all signals present

## Decision Log

- 2026-03-06: `getGitDiffWithStatus()` as a separate helper (not an extension of `getGitDiffFiles()`) — cleaner type signature, no change to existing callers.
- 2026-03-06: Categories 1 and 2 remain with the model — both require semantic judgment that cannot be extracted via path patterns alone.
- 2026-03-06: `scanIdeaCategories()` to be refactored in TASK-06 into per-category line construction — cleaner than passing overrides to the current function.
- 2026-03-06: Option A (6 separate tasks) chosen over Option B (single large task) — cleaner separation, independently testable.

## Overall-confidence Calculation

- TASK-01: 90%, S (weight 1)
- TASK-02: 88%, S (weight 1)
- TASK-03: 90%, S (weight 1)
- TASK-04: 85%, S (weight 1)
- TASK-05: 88%, S (weight 1)
- TASK-06: 90%, M (weight 2)
- Weighted sum: (90+88+90+85+88)×1 + 90×2 = 441 + 180 = 621
- Weighted effort: 5×1 + 1×2 = 7
- Overall-confidence = 621 / 7 = 88.7% → **88%**

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: `detectChangedPackages()` | Yes — no dependencies; `gitDiffFiles` parameter already exists in `PrefillResultsReviewOptions` | None | No |
| TASK-02: `getGitDiffWithStatus()` + `detectNewSkills()` | Yes — no dependencies; `gitDiffWithStatus` optional field added to options; `getGitDiffWithStatus()` is a new helper with no external callers | None | No |
| TASK-03: `detectStartupLoopContractChanges()` | Yes — no dependencies; `gitDiffFiles` parameter sufficient | None | No |
| TASK-04: `detectSchemaValidatorAdditions()` | Yes — no dependencies; `gitDiffFiles` parameter sufficient | None | No |
| TASK-05: `parsePlanTaskStatuses()` extension | Yes — additive `description?: string` field; `renderObservedOutcomes()` is new; no external callers until TASK-06 | [Type contract] [Minor]: regex group index shifts when description capture group is added — must update `match[2]` → `match[3]` for status; TCs catch this | No — TCs cover the regression |
| TASK-06: Wire extractors into `prefillResultsReview()` | Partial — depends on TASK-01–05 all being complete; precondition is met by Wave 1 completing before Wave 2 starts | [Ordering] [Minor]: TASK-06 must run after all Wave 1 tasks; enforced by `Depends on` field | No — dependency declared |
| TASK-06: `scanIdeaCategories()` describe test update | Yes — existing test asserts 5×`None.`; TASK-06 notes this test must be updated | [Missing precondition] [Minor]: test update must happen in same PR as the wiring change | No — noted in TASK-06 execution plan |

No Critical findings. Minor findings noted and addressed within task notes.
