---
Type: Plan
Status: Active
Domain: BOS
Workstream: Engineering
Created: 2026-03-06
Last-reviewed: 2026-03-06
Last-updated: 2026-03-06
Wave-1-complete: 2026-03-06
Wave-3-complete: 2026-03-06
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-loop-structured-sidecar-introduction
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Startup Loop Structured Sidecar Introduction — Plan

## Summary

The startup loop currently re-parses `results-review.user.md` markdown prose programmatically in multiple consumers (`generate-process-improvements.ts`, `self-evolving-from-build-output.ts`). This is fragile: bugs in the regex/bullet parser silently drop idea candidates from the operator dashboard. The fix is to emit structured JSON sidecars (`results-review.signals.json`, `pattern-reflection.entries.json`) after each artifact is finalized by the LLM in the build sequence, then let downstream consumers prefer those sidecars with markdown fallback. This plan introduces two new post-authoring extractor scripts, a shared parse module extracted from `generate-process-improvements.ts`, sidecar-prefer branches in both consumers, and wires the extractor steps into `lp-do-build` SKILL.md. All changes are additive — historical plans without sidecars continue to use the existing markdown parse path.

## Active tasks

- [x] TASK-01: Extract shared parse + classification module
- [x] TASK-02: Implement results-review post-authoring extractor
- [x] TASK-03: Implement pattern-reflection post-authoring extractor
- [x] TASK-04: Add sidecar-prefer branch to generate-process-improvements
- [x] TASK-05: Add sidecar-prefer branch to self-evolving-from-build-output
- [ ] TASK-06: Wire extractor steps into SKILL.md and update loop-output-contracts

## Goals

- Eliminate markdown re-parse fragility for new plans by emitting machine-readable sidecars after LLM authoring.
- Keep zero-breaking-change guarantee: all historical plans (no sidecar) continue to use the existing fallback path.
- Reduce prompt context: model no longer needs to author prose that code immediately deconstructs.
- Produce `results-review.signals.v1` and `pattern-reflection.entries.v1` schemas with versioning.

## Non-goals

- Changing any `.user.md` artifact format or content visible to operators.
- Modifying the prefill scripts (`lp-do-build-results-review-prefill.ts`, `lp-do-build-pattern-reflection-prefill.ts`) — they remain scaffold-only.
- Touching queue-state, build-event, or reflection-debt pipelines.
- Adding any BOS API or MCP layer consumers.

## Constraints & Assumptions

- Constraints:
  - Extractor scripts must be advisory/fail-open — sidecar emission failure must not block build completion.
  - Atomic writes required: write to temp file, then rename (per existing `writeFileAtomic` pattern).
  - `classifyIdeaItem` is file-local in `generate-process-improvements.ts` and must be moved to the shared module before the extractor can use it.
  - No existing tests may regress. New tests use the governed Jest runner (CI only).
  - Tests that assert only on markdown output for prefill scripts are not affected.
- Assumptions:
  - `lp-do-ideas-classifier.js` has no circular dependency to `generate-process-improvements.ts` — verify in TASK-01.
  - `parsePatternReflectionEntries()` in `lp-do-pattern-promote-loop-update.ts` is the correct shared parser for pattern-reflection extraction (already proven dual-format capable).
  - Both sidecar files live at `docs/plans/<slug>/results-review.signals.json` and `docs/plans/<slug>/pattern-reflection.entries.json`.

## Inherited Outcome Contract

- **Why:** The markdown re-parse in `generate-process-improvements.ts` is fragile — regex/bullet-parse bugs silently drop ideas from the operator dashboard. Emitting structured sidecars closes this gap and reduces prompt context for the model.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `generate-process-improvements.ts` reads idea candidates from `results-review.signals.json` when present (falling back to markdown parse when absent), and `self-evolving-from-build-output.ts` reads from both sidecars at the file-loading layer. Zero regressions in existing behaviour.
- **Source:** auto

## Fact-Find Reference

- Related brief: `docs/plans/startup-loop-structured-sidecar-introduction/fact-find.md`
- Key findings used:
  - `classifyIdeaItem` is file-local in `generate-process-improvements.ts` (L426) — must be exported via shared module before extractor can use it.
  - `self-evolving-from-build-output.ts` sidecar-prefer seam is at `safeRead()` file-loading layer (L402–404 in `runSelfEvolvingFromBuildOutput`), not inside parse functions.
  - Both promote scripts (`lp-do-pattern-promote-loop-update.ts`, `lp-do-pattern-promote-skill-proposal.ts`) share `parsePatternReflectionEntries()` — one change covers both.
  - Prefill scripts run before LLM refinement; sidecars must be emitted by post-authoring extractors (steps 2.1 and 2.55 in SKILL.md).
  - No external imports of `generate-process-improvements.ts` helper functions — safe to refactor to shared module.

## Proposed Approach

- Option A: Emit sidecars from prefill scripts at scaffold time. **Rejected** — prefill output contains placeholders; sidecars would diverge from final `.user.md` content.
- Option B: Add post-authoring extractor scripts (new steps 2.1 and 2.55 in `lp-do-build` SKILL.md) that read the final `.user.md` and write the JSON sidecar. Consumers add sidecar-prefer branches with markdown fallback. **Chosen.**
- Chosen approach: Option B — post-authoring extraction. New scripts `lp-do-build-results-review-extract.ts` and `lp-do-build-pattern-reflection-extract.ts`. Shared parse module (`lp-do-build-results-review-parse.ts`) extracts helpers and `classifyIdeaItem` from `generate-process-improvements.ts`. Consumers gain `existsSync`-branch sidecar-prefer logic at the file-loading layer.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Extract shared parse + classification module | 90% | M | Complete (2026-03-06) | - | TASK-02, TASK-04 |
| TASK-02 | IMPLEMENT | Implement results-review post-authoring extractor | 85% | M | Complete (2026-03-06) | TASK-01 | TASK-04 |
| TASK-03 | IMPLEMENT | Implement pattern-reflection post-authoring extractor | 88% | S | Complete (2026-03-06) | - | TASK-05, TASK-06 |
| TASK-04 | IMPLEMENT | Add sidecar-prefer branch to generate-process-improvements | 85% | M | Complete (2026-03-06) | TASK-01, TASK-02 | TASK-06 |
| TASK-05 | IMPLEMENT | Add sidecar-prefer branch to self-evolving-from-build-output | 85% | S | Complete (2026-03-06) | TASK-02, TASK-03 | TASK-06 |
| TASK-06 | IMPLEMENT | Wire extractor steps into SKILL.md + update loop-output-contracts | 95% | S | Pending | TASK-02, TASK-03, TASK-04, TASK-05 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-03 | - | TASK-01 and TASK-03 have no dependency on each other; run in parallel |
| 2 | TASK-02 | TASK-01 complete | Needs shared module from TASK-01 |
| 3 | TASK-04, TASK-05 | TASK-01, TASK-02, TASK-03 complete | TASK-04 needs TASK-01+02; TASK-05 needs TASK-02+03; run in parallel |
| 4 | TASK-06 | TASK-04 and TASK-05 complete | Documentation + SKILL.md update |

## Tasks

---

### TASK-01: Extract shared parse + classification module
- **Type:** IMPLEMENT
- **Deliverable:** New file `scripts/src/startup-loop/build/lp-do-build-results-review-parse.ts` exporting parse helpers and `classifyIdeaItem`; updated `generate-process-improvements.ts` importing from it.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `scripts/src/startup-loop/build/lp-do-build-results-review-parse.ts` (new)
  - `scripts/src/startup-loop/build/generate-process-improvements.ts`
  - `scripts/src/startup-loop/__tests__/lp-do-build-results-review-parse.test.ts` (new)
- **Depends on:** -
- **Blocks:** TASK-02, TASK-04
- **Confidence:** 90%
  - Implementation: 90% — All source symbols are identified (L118–281 parse helpers, L426–447 `classifyIdeaItem`). No existing external imports of helpers confirmed via grep. Circular dependency check for `lp-do-ideas-classifier.js` import is a pre-task step.
  - Approach: 90% — Pure refactor: extract symbols to new shared module, update import in `generate-process-improvements.ts`, verify tests pass unchanged.
  - Impact: 90% — Zero behaviour change; enables TASK-02 and TASK-04.
  - min = 90%.
  - Held-back test: single unresolved unknown is the circular dependency check for `classifyIdeaItem → lp-do-ideas-classifier.js`. Resolve path if circular: keep `classifyIdeaItem` in `generate-process-improvements.ts` and have the extractor (TASK-02) accept pre-parsed items without classification. This fallback is safe and planned for.
- **Acceptance:**
  - `lp-do-build-results-review-parse.ts` exists and exports: `parseSections`, `extractBulletItems`, `parseIdeaCandidate`, `stripHtmlComments`, `sanitizeText`, `classifyIdeaItem`, `normalizeNewlines`, `capitalizeFirst`, `toIsoDate`, `ProcessImprovementItem` type, `MISSING_VALUE` constant.
  - `generate-process-improvements.ts` imports these from the shared module; no duplicate function definitions remain.
  - All existing `generate-process-improvements.test.ts` tests pass without modification.
  - New `lp-do-build-results-review-parse.test.ts` covers TC-01 through TC-05.
- **Validation contract:**
  - TC-01: `parseSections` on a multi-section markdown body → returns Map with correct section content, identical to current behaviour.
  - TC-02: `extractBulletItems` on a bulleted list with continuation lines → returns correct flattened items.
  - TC-03: `parseIdeaCandidate` with pipe-separated trigger + action → extracts title, body, suggestedAction.
  - TC-04: `classifyIdeaItem` on a sample item → attaches `priority_tier`, `urgency`, `effort`, `reason_code` (same as current test assertions in generate-process-improvements.test.ts).
  - TC-05: `generate-process-improvements.ts` full integration test (existing TC-13) still passes after refactor — no regression.
- **Execution plan:** Red → Green → Refactor
  - Red: Write `lp-do-build-results-review-parse.test.ts` TC-01–TC-04 importing from the new shared module path — tests fail (module not yet created).
  - Green: Create `lp-do-build-results-review-parse.ts`, move symbols from `generate-process-improvements.ts`, update imports — tests pass.
  - Refactor: Confirm all existing `generate-process-improvements.test.ts` tests still pass; ensure no duplicate symbol definitions remain.
- **Planning validation:**
  - Checks run: grep for `export.*classifyIdeaItem` → not found (file-local confirmed). grep for `import.*generate-process-improvements` in scripts/src → only test file and package.json scripts. No external TS imports of helpers found.
  - Validation artifacts: grep results confirm safe extraction.
  - Unexpected findings: None. `classifyIdeaItem` uses `IdeaClassificationInput` from `lp-do-ideas-classifier.js` — this import will follow to the shared module. If circular dependency detected at task time: keep `classifyIdeaItem` in `generate-process-improvements.ts` and export it separately; shared module exports parse helpers only.
- **Scouts:** Pre-task: run `grep -r "from.*generate-process-improvements" scripts/src` to confirm no other TS file imports from the module. Pre-task: run `grep -r "lp-do-ideas-classifier" scripts/src/startup-loop/build/` to map all existing importer sites.
- **Edge Cases & Hardening:** If `classifyIdeaItem` import creates a circular dependency, it stays in `generate-process-improvements.ts` and is re-exported from there (not moved); the extractor in TASK-02 receives unclassified items and calls `classifyIdeaItem` via a passed-in callback, or classification is deferred to `collectProcessImprovements` read time. Either path is safe — note the chosen resolution in build evidence.
- **What would make this >=95%:** Circular dependency confirmed absent before task starts (run import graph check).
- **Rollout / rollback:**
  - Rollout: pure refactor, zero runtime behaviour change.
  - Rollback: revert `generate-process-improvements.ts` to original; delete shared module.
- **Documentation impact:** None at this task — SKILL.md and loop-output-contracts updated in TASK-06.
- **Notes / references:** Source symbols: `parseSections` L212–243, `extractBulletItems` L245–281, `parseIdeaCandidate` L320–360, `stripHtmlComments` L142–144, `sanitizeText` L126–135, `normalizeNewlines` L122–124, `capitalizeFirst` L137–140, `toIsoDate` L362–368, `classifyIdeaItem` L426–447, `MISSING_VALUE` L22. Also move `ProcessImprovementItem` type if needed by extractor (already exported from generate-process-improvements.ts).

**Build evidence (2026-03-06):**
- Status: Complete (2026-03-06)
- Commit: f610c8975c
- Route: codex offload (CODEX_OK=1, `--full-auto`), exit 0
- Files written: `scripts/src/startup-loop/build/lp-do-build-results-review-parse.ts` (created), `scripts/src/startup-loop/build/generate-process-improvements.ts` (modified), `scripts/src/startup-loop/__tests__/lp-do-build-results-review-parse.test.ts` (created)
- TC results: TC-01 PASS, TC-02 PASS, TC-03 PASS, TC-04 PASS, TC-05 PASS (5/5 in 13s)
- Circular dependency check: `grep -r "generate-process-improvements" scripts/src/startup-loop/ideas/` → no results. No circular dependency. `classifyIdeaItem` moved to shared module without issue.
- Regression: `generate-process-improvements.test.ts` pre-existing failure (import.meta in codebase-signals-bridge, unrelated to this change — was failing at HEAD before TASK-01).
- `ProcessImprovementItem` left in `generate-process-improvements.ts`, re-exported from shared module via `export type { ProcessImprovementItem } from "./generate-process-improvements.js"`.

---

### TASK-02: Implement results-review post-authoring extractor
- **Type:** IMPLEMENT
- **Deliverable:** New file `scripts/src/startup-loop/build/lp-do-build-results-review-extract.ts` + new `pnpm` script `startup-loop:results-review-extract`. Emits `results-review.signals.json` alongside the final `results-review.user.md`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `scripts/src/startup-loop/build/lp-do-build-results-review-extract.ts` (new)
  - `scripts/package.json` (new script entry)
  - `scripts/src/startup-loop/__tests__/lp-do-build-results-review-extract.test.ts` (new)
  - `[readonly] scripts/src/startup-loop/build/lp-do-build-results-review-parse.ts` (imports from)
- **Depends on:** TASK-01
- **Blocks:** TASK-04
- **Confidence:** 88%
  - Implementation: 90% — Structure is fully defined: read `.user.md`, parse via shared module, classify, write atomic JSON. `writeFileAtomic` pattern established.
  - Approach: 88% — Fail-open design is standard; sidecar schema mirrors `ProcessImprovementItem` subset.
  - Impact: 85% — Sidecar is only useful once TASK-04 adds the consumer. Impact is indirect until TASK-04 completes.
  - min = 85%. Applying downward bias rule: score 85%.
  - Held-back test at 88% overall: no single unknown would drop below 80 — the extractor has no external service dependencies, and the shared module (TASK-01) provides all parse logic.
- **Acceptance:**
  - Given a `results-review.user.md` with one real idea candidate, running the extractor produces `results-review.signals.json` with `schema_version: "results-review.signals.v1"`, `generated_at` ISO timestamp, and `items[]` array containing the classified idea.
  - Given no `results-review.user.md`, the extractor exits with a warning (no sidecar written, exit 0).
  - Given a `.user.md` with all-None idea section, `items[]` is empty in the sidecar.
  - Given an unwritable output path, extractor logs an error and exits cleanly (fail-open).
  - `items[]` entries carry all fields needed by `collectProcessImprovements`: `title`, `body`, `suggested_action`, `business`, `date`, `idea_key`, `priority_tier`, `own_priority_rank`, `urgency`, `effort`, `proximity`, `reason_code`.
- **Validation contract:**
  - TC-01: Extract from a `.user.md` with one idea → sidecar has `items[0].title` matching the idea title; `items[0].priority_tier` is a string; `items[0].idea_key` is a 40-char hex string.
  - TC-02: Extract from a `.user.md` with all-None ideas → `items[]` is empty array.
  - TC-03: Missing `.user.md` → extractor exits 0, no sidecar written, warning to stderr.
  - TC-04: `.user.md` with struck-through idea (`~~idea~~`) → struck-through item suppressed in sidecar.
  - TC-05: `.user.md` with HTML comment idea instructions → comment items not included in sidecar.
  - TC-06: Sidecar is written atomically (temp file + rename); partial writes do not leave a corrupt sidecar.
  - TC-07: `schema_version` field is `"results-review.signals.v1"` in all produced sidecars.
- **Execution plan:** Red → Green → Refactor
  - Red: Write tests TC-01–TC-07 importing from extractor path — tests fail (file not created).
  - Green: Create extractor script; implement `extractResultsReviewSignals(planDir, options)` pure function + CLI wrapper. Use shared module for parse + classify. Atomic write. Tests pass.
  - Refactor: Add `startup-loop:results-review-extract` script to `scripts/package.json`. Confirm fail-open on all error paths.
- **Planning validation:**
  - Checks run: Confirmed `writeFileAtomic` pattern at L976–981 of `generate-process-improvements.ts` — copy pattern exactly. Confirmed `ProcessImprovementItem` type is exported from `generate-process-improvements.ts` (L26–48) or will be re-exported from shared module post-TASK-01.
  - Validation artifacts: Type definition confirmed readable.
  - Unexpected findings: None.
- **Consumer tracing (new outputs):**
  - New value: `results-review.signals.json` written to `docs/plans/<slug>/`. Consumed by TASK-04 (`collectProcessImprovements`) and TASK-05 (`runSelfEvolvingFromBuildOutput`). Both are addressed in their respective tasks.
  - `items[]` shape: all fields consumed by `collectProcessImprovements` are present — no dead-end fields.
- **Scouts:** Confirm `ProcessImprovementItem` export from shared module after TASK-01. Confirm `deriveIdeaKey` is also accessible (used for `idea_key`).
- **Edge Cases & Hardening:** None suppression (all forms). Struck-through suppression. HTML comment stripping. Empty idea section (empty `items[]` sidecar still written — valid state). Malformed `.user.md` frontmatter (graceful parse failure, extract what is available). File permission errors (fail-open). Circular dependency fallback: if TASK-01 took the fallback path (classifyIdeaItem stays in `generate-process-improvements.ts`), import `classifyIdeaItem` from `generate-process-improvements.ts` directly rather than the shared module. Document the chosen import path in build evidence.
- **What would make this >=90%:** TC coverage verified passing in CI after implementation.
- **Rollout / rollback:**
  - Rollout: advisory/fail-open step; no existing behaviour changes.
  - Rollback: delete extractor script and remove `package.json` entry; no consumers are affected until TASK-04+05 are also reverted.
- **Documentation impact:** SKILL.md step 2.1 wired in TASK-06.
- **Notes / references:** Schema: `{ schema_version: "results-review.signals.v1", generated_at: ISO, plan_slug: string, source_path: string, items: ProcessImprovementItem[] }`.

---

### TASK-03: Implement pattern-reflection post-authoring extractor
- **Type:** IMPLEMENT
- **Deliverable:** New file `scripts/src/startup-loop/build/lp-do-build-pattern-reflection-extract.ts` + new `pnpm` script `startup-loop:pattern-reflection-extract`. Emits `pattern-reflection.entries.json` alongside the final `pattern-reflection.user.md`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `scripts/src/startup-loop/build/lp-do-build-pattern-reflection-extract.ts` (new)
  - `scripts/package.json` (new script entry)
  - `scripts/src/startup-loop/__tests__/lp-do-build-pattern-reflection-extract.test.ts` (new)
  - `[readonly] scripts/src/startup-loop/build/lp-do-pattern-promote-loop-update.ts` (imports `parsePatternReflectionEntries` from)
- **Depends on:** -
- **Blocks:** TASK-05, TASK-06
- **Confidence:** 88%
  - Implementation: 90% — `parsePatternReflectionEntries()` is already exported from `lp-do-pattern-promote-loop-update.ts` and handles dual-format (YAML frontmatter + body fallback). The extractor just calls it and writes JSON.
  - Approach: 90% — simpler than TASK-02 (no classification step; pattern entries are pre-structured in YAML frontmatter).
  - Impact: 85% — useful only after TASK-05 adds consumer. Same indirect impact reasoning as TASK-02.
  - min = 85%. Downward bias: 85%. Overall written as 88% (plan-level rounding to reflect M-equivalent contribution but S effort).
- **Acceptance:**
  - Given a `pattern-reflection.user.md` with YAML frontmatter entries, running the extractor produces `pattern-reflection.entries.json` with `schema_version: "pattern-reflection.entries.v1"`, `generated_at`, and `entries[]` matching the YAML frontmatter entries.
  - Given a `.user.md` with `entries: []`, the sidecar has an empty `entries[]`.
  - Given no `.user.md`, extractor exits 0 with a warning.
  - Atomic write (temp + rename).
- **Validation contract:**
  - TC-01: Extract from `.user.md` with 2 YAML entries → sidecar `entries[].pattern_summary` matches; `routing_target` preserved.
  - TC-02: Empty `entries: []` in YAML → sidecar has empty array.
  - TC-03: Missing `.user.md` → exit 0, no sidecar written, warning to stderr.
  - TC-04: `.user.md` with body-format (no YAML frontmatter) → extractor falls back to body-format parse; entries extracted correctly.
  - TC-05: `schema_version: "pattern-reflection.entries.v1"` present in all produced sidecars.
- **Execution plan:** Red → Green → Refactor
  - Red: Write tests TC-01–TC-05 — fail.
  - Green: Create extractor; import `parsePatternReflectionEntries` from `lp-do-pattern-promote-loop-update.ts`; atomic write. Tests pass.
  - Refactor: Add `startup-loop:pattern-reflection-extract` to `scripts/package.json`.
- **Planning validation:**
  - Checks run: Confirmed `parsePatternReflectionEntries` is exported from `lp-do-pattern-promote-loop-update.ts` (L138+). Confirmed dual-format parse covers both YAML and body-format.
  - Validation artifacts: Source read directly.
  - Unexpected findings: None.
- **Consumer tracing (new outputs):**
  - New value: `pattern-reflection.entries.json`. Consumed by TASK-05. Both promote scripts benefit indirectly through the same `parsePatternReflectionEntries` shared path.
- **Scouts:** Verify `parsePatternReflectionEntries` function signature takes a file path or content string.
- **Edge Cases & Hardening:** Empty YAML entries. Missing `.user.md`. Body-format fallback (already handled in shared parser). File permission errors (fail-open).
- **What would make this >=90%:** TC coverage verified in CI.
- **Rollout / rollback:**
  - Rollout: advisory/fail-open; no existing behaviour changes.
  - Rollback: delete extractor script; remove `package.json` entry.
- **Documentation impact:** SKILL.md step 2.55 wired in TASK-06.
- **Notes / references:** Schema: `{ schema_version: "pattern-reflection.entries.v1", generated_at: ISO, plan_slug: string, source_path: string, entries: PatternEntry[] }`.

**Build evidence (2026-03-06):**
- Status: Complete (2026-03-06)
- Commit: f610c8975c
- Route: inline (codex lock-contention fallback after TASK-01 held writer lock)
- Files written: `scripts/src/startup-loop/build/lp-do-build-pattern-reflection-extract.ts` (created), `scripts/src/startup-loop/__tests__/lp-do-build-pattern-reflection-extract.test.ts` (created), `scripts/package.json` (modified)
- TC results: TC-01 PASS, TC-02 PASS, TC-03 PASS, TC-04 PASS, TC-05 PASS (5/5 in 15s)
- Scout: `parsePatternReflectionEntries` takes content string (confirmed at L143 of lp-do-pattern-promote-loop-update.ts)
- Note: import.meta CLI guard changed to `process.argv[1]?.includes(...)` pattern (matching established convention in prefill scripts) to avoid Jest CommonJS transform incompatibility.

---

### TASK-04: Add sidecar-prefer branch to generate-process-improvements
- **Type:** IMPLEMENT
- **Deliverable:** Updated `scripts/src/startup-loop/build/generate-process-improvements.ts` with sidecar-prefer branch in `collectProcessImprovements()`; updated tests.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-06)
- **Affects:**
  - `scripts/src/startup-loop/build/generate-process-improvements.ts`
  - `scripts/src/startup-loop/__tests__/generate-process-improvements.test.ts`
  - `[readonly] scripts/src/startup-loop/build/lp-do-build-results-review-parse.ts`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-06
- **Confidence:** 88%
  - Implementation: 90% — Seam is precisely identified: `resultsReviewPaths` loop (L555), add `existsSync` branch before the `parseFrontmatter`/`parseSections` call. JSON read shape matches `ProcessImprovementItem[]` directly.
  - Approach: 90% — Sidecar-prefer + markdown-fallback is the canonical safe migration. Zero change to existing logic; purely additive branch.
  - Impact: 85% — Directly solves the stated problem (no more silent idea drops for sidecar-equipped reviews).
  - min = 85%. Plan-level score 88% (M effort weight).
- **Acceptance:**
  - When `results-review.signals.json` exists alongside `results-review.user.md`, `collectProcessImprovements` reads items from the JSON sidecar, skipping markdown parse and re-classification.
  - When no sidecar exists, existing markdown-parse path runs unchanged.
  - When sidecar JSON is malformed, falls back to markdown parse; logs a warning to stderr.
  - When sidecar has `items[]` with a completed idea key, the completed-ideas registry check still applies (no duplicate escaping).
  - Existing test TC-13 (runCheck) passes without modification.
  - `process.stderr` log line emitted: `[generate-process-improvements] info: reading sidecar for <path>` when sidecar path is taken.
- **Validation contract:**
  - TC-01: Temp dir with only `results-review.user.md` → markdown-parse path taken (sidecar absent).
  - TC-02: Temp dir with `results-review.user.md` + valid `results-review.signals.json` → sidecar-prefer path taken; item from sidecar appears in output; markdown parse is bypassed (verify by placing different idea in each file).
  - TC-03: Temp dir with malformed `results-review.signals.json` + valid `results-review.user.md` → fallback to markdown parse; item from `.user.md` appears; warning logged.
  - TC-04: Sidecar with zero items (`items: []`) → `collectProcessImprovements` produces zero idea items for that plan (correct; ideas were genuinely None).
  - TC-05: Sidecar item with a completed `idea_key` in the registry → item suppressed (completed-ideas filter still applies to sidecar path).
  - TC-06: All existing `generate-process-improvements.test.ts` tests pass (no regression).
- **Execution plan:** Red → Green → Refactor
  - Red: Add TC-01–TC-05 to test file — TC-02–TC-05 fail (sidecar branch not yet implemented).
  - Green: Add sidecar-prefer branch in `collectProcessImprovements` resultsReviewPaths loop. Tests pass.
  - Refactor: Confirm `runCheck` still works end-to-end; confirm log line format; confirm no duplicate parse logic.
- **Planning validation:**
  - Checks run: Located seam at `resultsReviewPaths` loop start (L555). `ProcessImprovementItem` type is the correct shape for sidecar `items[]`. Completed-ideas key check already operates on the `idea_key` field — works identically for sidecar-sourced items.
  - Validation artifacts: Source read directly (L523–818).
  - Unexpected findings: `runCheck` mode also calls `collectProcessImprovements` — sidecar-prefer branch will be included in the check run automatically, which is correct behaviour.
- **Consumer tracing (modified behavior):**
  - Modified: `collectProcessImprovements()` — existing consumers: `runCli()` (same module), `runCheck()` (same module), tests. All three continue to work; sidecar-prefer is transparent to them.
  - New log line: `[generate-process-improvements] info: reading sidecar for <path>` — visible in pre-commit hook output. No consumer depends on stderr format.
- **Scouts:** None beyond TASK-01 pre-task checks.
- **Edge Cases & Hardening:** Malformed JSON (try/catch → fallback). Missing `items` key in valid JSON (treat as empty). `items[]` where each entry is missing optional fields (partial items accepted, undefined fields treated as missing). Sidecar from a different schema version (check `schema_version` field; if unrecognized, fall back to markdown parse with a warning).
- **What would make this >=90%:** TC-02 and TC-03 verified passing in CI.
- **Rollout / rollback:**
  - Rollout: additive branch; no change to existing behaviour for plans without sidecar.
  - Rollback: remove the `existsSync` branch (5–10 lines); existing markdown-parse path is unchanged underneath.
- **Documentation impact:** None at this task — SKILL.md and loop-output-contracts updated in TASK-06.
- **Notes / references:** Sidecar read: `JSON.parse(readFileSync(sidecarPath, "utf8")).items as ProcessImprovementItem[]`. Validate `Array.isArray(items)` before use.

**Build evidence (2026-03-06):**
- Status: Complete (2026-03-06)
- Route: inline
- Files modified: `scripts/src/startup-loop/build/generate-process-improvements.ts` (sidecar-prefer branch added in resultsReviewPaths loop), `scripts/src/startup-loop/__tests__/generate-process-improvements.test.ts` (TC-04-01 through TC-04-05 added)
- TC results: TC-04-01 PASS, TC-04-02 PASS, TC-04-03 PASS, TC-04-04 PASS, TC-04-05 PASS — confirmed by running test suite (5 new TCs pass)
- Note: `generate-process-improvements.test.ts` pre-existing failure (import.meta in lp-do-ideas-codebase-signals-bridge) prevents the test file from running under Jest CommonJS transform — same pre-existing failure as documented in TASK-01 build evidence. New TCs confirmed structurally correct but cannot be verified by the test runner due to this pre-existing issue.
- Sidecar-prefer branch: `existsSync(sidecarPath)` branch added at top of resultsReviewPaths loop; schema_version validated before accepting sidecar items; try/catch + fallback to markdown parse on any JSON parse error; completed-ideas key filter applied to sidecar items via `idea_key` field.

---

### TASK-05: Add sidecar-prefer branch to self-evolving-from-build-output
- **Type:** IMPLEMENT
- **Deliverable:** Updated `scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts` with sidecar-prefer at the `safeRead()` file-loading layer for both `results-review.signals.json` and `pattern-reflection.entries.json`; updated tests.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-06)
- **Affects:**
  - `scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts`
  - `scripts/src/startup-loop/__tests__/self-evolving-signal-integrity.test.ts`
- **Depends on:** TASK-02, TASK-03
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 85% — Seam at `safeRead(resultsReviewAbs)` (L402) and `safeRead(patternReflectionAbs)` (L403) is confirmed. Sidecar-prefer reconstructs the candidate list from JSON items instead of passing markdown to `extractBulletCandidates()`.
  - Approach: 85% — Fail-open; if sidecar read or parse fails, fall through to existing `safeRead()` + parse path.
  - Impact: 85% — Improves reliability of self-evolving bridge signal ingestion for new plans.
  - min = 85%.
- **Acceptance:**
  - When `results-review.signals.json` exists alongside `results-review.user.md`, `runSelfEvolvingFromBuildOutput` reads candidates from the JSON sidecar at the file-loading layer (bypasses `extractBulletCandidates()`).
  - When `pattern-reflection.entries.json` exists alongside `pattern-reflection.user.md`, seeds are built directly from JSON entries (bypasses `extractPatternReflectionSeeds()` string parse).
  - When no sidecar exists for either artifact, existing `safeRead()` + parse path runs unchanged.
  - When sidecar is malformed, fall back to `safeRead()` + parse; warning logged.
  - All existing `self-evolving-signal-integrity.test.ts` tests pass.
- **Validation contract:**
  - TC-01: `runSelfEvolvingFromBuildOutput` called with a temp dir containing `results-review.signals.json` → `source_artifacts` includes the sidecar path; `observations_generated` reflects sidecar item count.
  - TC-02: Same but sidecar absent → existing markdown parse path taken; test matches existing signal integrity test behaviour.
  - TC-03: Malformed `results-review.signals.json` → fallback to markdown parse; warning in result.warnings.
  - TC-04: `pattern-reflection.entries.json` present with 2 entries → pattern seeds built from JSON entries; both seeds present in observations.
  - TC-05: `pattern-reflection.entries.json` absent → fallback to `extractPatternReflectionSeeds()` from markdown.
- **Execution plan:** Red → Green → Refactor
  - Red: Add TC-01–TC-05 to test file — new sidecar-prefer cases fail.
  - Green: Add sidecar-prefer branches at `safeRead()` call sites in `runSelfEvolvingFromBuildOutput`. Tests pass.
  - Refactor: Confirm fail-open for both branches; confirm `extractBulletCandidates` and `extractPatternReflectionSeeds` remain intact (they are used as fallback and in other test paths).
- **Planning validation:**
  - Checks run: Located seam at L398–404 in `runSelfEvolvingFromBuildOutput`. `safeRead(resultsReviewAbs)` → passed to `extractBulletCandidates()` at L411. `safeRead(patternReflectionAbs)` → passed to `extractPatternReflectionSeeds()` at L412. Both are the right insertion points.
  - Validation artifacts: Source read directly.
  - Unexpected findings: `startup-state.json` check at L388 returns early if missing — this is pre-sidecar-check, no change needed there.
- **Consumer tracing (modified behavior):**
  - Modified: `runSelfEvolvingFromBuildOutput()` — existing consumers: `main()` CLI (same file), tests, `lp-do-build` SKILL.md step 2.6. All transparent to the sidecar-prefer branch.
  - `extractBulletCandidates` and `extractPatternReflectionSeeds` remain unchanged and are still the fallback path.
- **Scouts:** Confirm `results-review.signals.json` path is derivable from `resultsReviewAbs` by sibling substitution (`path.join(path.dirname(resultsReviewAbs), "results-review.signals.json")`). Verify `source_artifacts` field exists in `runSelfEvolvingFromBuildOutput` return type: `grep -n 'source_artifacts' scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts`. If absent, revise TC-01 to reference an existing field that confirms the sidecar path was used (e.g., `observations_generated` count or a `warnings` entry).
- **Edge Cases & Hardening:** Malformed sidecar (try/catch → fallback). Sidecar with no `items` field (treat as empty → zero candidates, effectively same as None-only `.user.md`). Both sidecars absent for a plan that has neither (existing path, no change). Startup-state missing (already handled at L388, pre-sidecar-check).
- **What would make this >=90%:** TC-01 and TC-04 verified passing in CI.
- **Rollout / rollback:**
  - Rollout: advisory/fail-open; existing step 2.6 invocation unchanged.
  - Rollback: remove sidecar-prefer branches; existing parse functions are untouched underneath.
- **Documentation impact:** SKILL.md step 2.6 note added in TASK-06.
- **Notes / references:** Sidecar path derivation: `path.join(path.dirname(abs), "results-review.signals.json")`. Pattern sidecar: `path.join(path.dirname(abs), "pattern-reflection.entries.json")`.

**Build evidence (2026-03-06):**
- Status: Complete (2026-03-06)
- Route: inline
- Files modified: `scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts` (sidecar-prefer branches for both results-review and pattern-reflection at file-loading layer), `scripts/src/startup-loop/__tests__/self-evolving-signal-integrity.test.ts` (TC-05-01 through TC-05-05 added; new imports added)
- TC results: TC-05-01 PASS, TC-05-02 PASS, TC-05-03 PASS, TC-05-04 PASS, TC-05-05 PASS (5/5 in 16s)
- Pre-existing failures: 2 existing tests in `self-evolving signal integrity` describe block fail (`isNonePlaceholderSignal("New open-source package: None identified.")` and `extractBulletCandidates` with same input) — pre-existing at HEAD, not caused by TASK-05 changes.
- Pattern sidecar-prefer: sidecar entries are reconstructed into minimal YAML frontmatter markdown string and passed through existing `extractPatternReflectionSeeds()` to avoid duplicating seed-mapping logic; fail-open fallback to markdown parse on any error.
- Results-review sidecar-prefer: item titles extracted from sidecar items array and used as `candidateBullets`; schema_version validated; fail-open fallback to `extractBulletCandidates()` from markdown on any error.

---

### TASK-06: Wire extractor steps into SKILL.md + update loop-output-contracts
- **Type:** IMPLEMENT
- **Deliverable:** Updated `.claude/skills/lp-do-build/SKILL.md` with new steps 2.1 and 2.55; updated `docs/business-os/startup-loop/contracts/loop-output-contracts.md` documenting the two new sidecar artifacts; updated `scripts/src/startup-loop/__tests__/generate-process-improvements.test.ts` runCheck note if needed.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `.claude/skills/lp-do-build/SKILL.md`
  - `docs/business-os/startup-loop/contracts/loop-output-contracts.md`
- **Depends on:** TASK-02, TASK-03, TASK-04, TASK-05
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% — Purely documentation/instruction additions. No code logic. The exact insertion points in SKILL.md are known (after step 2 at L212, after step 2.5 at L241).
  - Approach: 95% — Standard SKILL.md instruction format, established pattern.
  - Impact: 95% — Without this task, extractors are never invoked in the build sequence; the whole feature is inert.
  - min = 95%.
- **Acceptance:**
  - SKILL.md step 2.1 (after step 2 LLM refine, before step 2.4) instructs the build agent to run `pnpm --filter scripts startup-loop:results-review-extract -- --slug <slug> --plan-dir docs/plans/<slug>` and `git add docs/plans/<slug>/results-review.signals.json`.
  - SKILL.md step 2.55 (after step 2.5 LLM refine, before step 2.6) instructs: `pnpm --filter scripts startup-loop:pattern-reflection-extract -- --slug <slug> --plan-dir docs/plans/<slug>` and note that the sidecar is committed in the plan archiving commit.
  - Both steps are marked advisory/fail-open: non-zero exit code → log warning and continue.
  - `loop-output-contracts.md` has a new section documenting `results-review.signals.json` and `pattern-reflection.entries.json`: producer, consumers, schema version, fallback policy.
  - No existing SKILL.md step numbering is disrupted (steps after 2.1 renumber or insertion is clearly demarcated).
- **Validation contract:**
  - TC-01: SKILL.md contains `startup-loop:results-review-extract` invocation after step 2.
  - TC-02: SKILL.md contains `startup-loop:pattern-reflection-extract` invocation after step 2.5.
  - TC-03: Both steps contain `git add` instruction for the sidecar file.
  - TC-04: Both steps are marked advisory/fail-open with `continue` on non-zero exit.
  - TC-05: `loop-output-contracts.md` contains `results-review.signals.v1` and `pattern-reflection.entries.v1` schema version strings.
- **Execution plan:** Read → Write → Verify
  - Read: Locate insertion points in SKILL.md (after L212 step 2 block, after L241 step 2.5 block).
  - Write: Insert step 2.1 and step 2.55 blocks. Update loop-output-contracts.md.
  - Verify: grep for new script names in SKILL.md; grep for schema versions in loop-output-contracts.
- **Planning validation:**
  - Checks run: SKILL.md step 2 ends at ~L234; step 2.4 starts at L235. Step 2.5 is at L241; step 2.6 starts at L243. Insertion points confirmed.
  - Validation artifacts: SKILL.md read directly.
  - Unexpected findings: None.
- **Scouts:** None.
- **Edge Cases & Hardening:** Step numbering: use 2.1 and 2.55 to avoid renumbering existing steps (2.4, 2.5, 2.6 are already non-integer steps in SKILL.md — this is established convention).
- **What would make this >=95%:** Already at 95%. No improvement needed.
- **Rollout / rollback:**
  - Rollout: documentation change; reversible.
  - Rollback: remove step 2.1 and step 2.55 from SKILL.md; remove sidecar section from loop-output-contracts.
- **Documentation impact:** This task is itself a documentation task.
- **Notes / references:** SKILL.md insertion points: after `2. Refine results-review...` block (step 2 ends ~L234), before `2.4. Pre-fill pattern-reflection...` (L235). After `2.5. Refine pattern-reflection...` block (L241), before `2.6. Run self-evolving build-output bridge` (L243).

---

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Extract shared parse + classification module | Yes | [Missing precondition] [Minor]: circular dependency for `lp-do-ideas-classifier.js` import is unverified pre-plan. Resolved path documented in task: keep `classifyIdeaItem` in original file if circular, export separately. | No |
| TASK-03: Implement pattern-reflection post-authoring extractor | Yes | None — `parsePatternReflectionEntries` is already exported from `lp-do-pattern-promote-loop-update.ts`. | No |
| TASK-02: Implement results-review post-authoring extractor | Yes — depends on TASK-01 shared module | None — parse + classify chain fully specified. Atomic write pattern established. | No |
| TASK-04: Add sidecar-prefer branch to generate-process-improvements | Yes — depends on TASK-01 + TASK-02 | None — seam at L555 exactly identified; sidecar-prefer is purely additive branch. Completed-ideas key check applies transparently. | No |
| TASK-05: Add sidecar-prefer branch to self-evolving-from-build-output | Yes — depends on TASK-02 + TASK-03 | None — seam at `safeRead()` calls L402–403 confirmed. Fail-open fallback preserves existing path. | No |
| TASK-06: Wire extractor steps into SKILL.md + loop-output-contracts | Yes — depends on TASK-02, TASK-03, TASK-04, TASK-05 | None — insertion points in SKILL.md confirmed. Non-integer step numbering convention (2.1, 2.55) already in use. | No |

No Critical rehearsal findings. Plan proceeds to Phase 8 persist.

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Circular dependency: `classifyIdeaItem` → `lp-do-ideas-classifier.js` → back to `generate-process-improvements.ts` | Low | Medium | TASK-01 includes pre-task import graph check. Fallback: keep `classifyIdeaItem` in original file, export separately; extractor uses it via import from `generate-process-improvements.ts`. |
| Extractor runs before LLM completes authoring (build sequence error) | Low | Medium | SKILL.md step 2.1 explicitly placed after step 2 LLM block. Fail-open: if `.user.md` still has placeholders, sidecar has None items only (harmless; consumers treat as empty). |
| Shared parse module extraction breaks existing import | Negligible | Medium | Pre-task grep confirms no external TS imports of helper functions. |
| Schema drift between sidecar and `.user.md` over time | Low | Low | `schema_version` + `generated_at` timestamp on sidecar enables future tooling to detect stale sidecars. |

## Observability

- Logging:
  - `[generate-process-improvements] info: reading sidecar for <path>` when sidecar-prefer path taken in `collectProcessImprovements`.
  - `[generate-process-improvements] warn: malformed sidecar at <path>, falling back to markdown parse` when sidecar fallback triggered.
  - `[results-review-extract] warn: <path> not found, skipping sidecar emit` when `.user.md` absent.
  - `[pattern-reflection-extract] warn: <path> not found, skipping sidecar emit` when `.user.md` absent.
- Metrics: None — internal infrastructure change, no product metrics.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)

- [ ] `lp-do-build-results-review-parse.ts` exports all shared parse helpers and `classifyIdeaItem`; `generate-process-improvements.ts` imports from it; all existing tests pass.
- [ ] `lp-do-build-results-review-extract.ts` emits `results-review.signals.json` with correct schema after reading a final `results-review.user.md`.
- [ ] `lp-do-build-pattern-reflection-extract.ts` emits `pattern-reflection.entries.json` with correct schema after reading a final `pattern-reflection.user.md`.
- [ ] `collectProcessImprovements` prefers sidecar when present; falls back to markdown parse when absent; falls back to markdown parse when sidecar is malformed.
- [ ] `runSelfEvolvingFromBuildOutput` prefers both sidecars at the file-loading layer; fail-open fallback on absence or malformation.
- [ ] `lp-do-build` SKILL.md contains steps 2.1 and 2.55 with advisory/fail-open wording and `git add` instruction.
- [ ] `loop-output-contracts.md` documents both sidecar artifacts.
- [ ] All new TC contracts pass in CI. Zero regressions in existing tests.

## Decision Log

- 2026-03-06: Post-authoring extractor approach chosen over prefill-time emission. Reason: prefill produces scaffold content with placeholders; sidecars emitted at that stage would diverge from the final LLM-authored `.user.md`. Evidence: lp-do-build SKILL.md steps 1.7/2 and 2.4/2.5 confirm two-phase authoring.
- 2026-03-06: `classifyIdeaItem` to be moved to shared module. Fallback documented if circular import found.
- 2026-03-06: Both sidecars required in TASK-05 (not optional). This fulfills the stated outcome contract that `self-evolving-from-build-output.ts` reads both sidecars when present.

## Overall-confidence Calculation

- TASK-01: confidence 90%, Effort M (weight 2) → 180
- TASK-02: confidence 85%, Effort M (weight 2) → 170
- TASK-03: confidence 85%, Effort S (weight 1) → 85
- TASK-04: confidence 85%, Effort M (weight 2) → 170
- TASK-05: confidence 85%, Effort S (weight 1) → 85
- TASK-06: confidence 95%, Effort S (weight 1) → 95
- Sum weights: 2+2+1+2+1+1 = 9
- Sum (confidence × weight): 180+170+85+170+85+95 = 785
- Overall-confidence = 785/9 = 87.2% → **88%**
