---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: BOS
Workstream: Engineering
Created: 2026-03-06
Last-updated: 2026-03-06
Feature-Slug: startup-loop-structured-sidecar-introduction
Business: PLAT
Priority: P3
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/startup-loop-structured-sidecar-introduction/plan.md
Dispatch-ID: IDEA-DISPATCH-20260306153000-0993
Trigger-Source: IDEA-DISPATCH-20260306153000-0993
---

# Startup Loop Structured Sidecar Introduction — Fact-Find Brief

## Scope

### Summary

The startup loop currently uses `results-review.user.md` and `pattern-reflection.user.md` as the sole machine-readable interface between the build phase and downstream consumers (reporting, self-evolving bridge). These consumers re-parse human prose to extract structured data. The correct inversion is: emit structured JSON sidecars after the final `.user.md` artifacts are authored, then let downstream consumers prefer those sidecars. This fact-find investigates the exact shape of those sidecars, which files consume the current markdown, what each consumer extracts, and the safest migration path.

**Key architectural clarification (from critique):** The prefill scripts (steps 1.7 and 2.4 in `lp-do-build` SKILL.md) produce scaffold-only content with placeholders; the LLM refines each artifact in steps 2 and 2.5 respectively. Sidecar emission at prefill time would freeze placeholder data diverging from the final `.user.md`. The correct emitter is a new post-authoring extraction step (step 2.1 and step 2.55) that runs after the final markdown is authored, reads the `.user.md`, and writes the structured JSON sidecar alongside it.

### Goals

1. Define the schema for `results-review.signals.json` (idea signals extracted after the final `.user.md` is authored).
2. Define the schema for `pattern-reflection.entries.json` (pattern entries extracted after the final `.user.md` is authored).
3. Map every programmatic consumer of `results-review.user.md` and `pattern-reflection.user.md`.
4. Determine the minimal change to `generate-process-improvements.ts` to prefer the JSON sidecar with markdown fallback.
5. Identify any other consumers that would benefit from the sidecars.
6. Confirm the safe migration strategy: emit sidecars in a post-authoring step alongside existing artifacts with no breaking change.

### Non-goals

- Changing the format or content of any `.user.md` artifact visible to operators.
- Changing the queue-state, build-event, or reflection-debt pipelines.
- Introducing new consumer logic for the BOS API or MCP layer.

### Constraints & Assumptions

- Constraints:
  - `.user.md` artifacts must remain unchanged for operator readability — the sidecar is additive only.
  - JSON sidecars must be emitted atomically (write-to-temp, rename) per existing `writeFileAtomic` pattern.
  - Sidecar emission must happen AFTER the final LLM authoring step for each artifact, not at prefill (scaffold) time. Prefill produces placeholder content; the sidecar must reflect the final authored content.
  - No existing tests may regress. New tests must use the governed Jest runner.
  - Schema versioning must be baked in from day one (`schema_version` field).
- Assumptions:
  - A new dedicated extractor script (`lp-do-build-results-review-extract.ts`) reads the final `results-review.user.md` and emits `results-review.signals.json`. This is a post-authoring extraction step called after step 2 in `lp-do-build` SKILL.md.
  - Similarly, a new `lp-do-build-pattern-reflection-extract.ts` reads the final `pattern-reflection.user.md` and emits `pattern-reflection.entries.json`. Called after step 2.5.
  - Both sidecars live alongside their `.user.md` sibling in `docs/plans/<slug>/`.
  - Both extractor scripts are advisory/fail-open: failure to emit a sidecar does not block build completion.

---

## Outcome Contract

- **Why:** The markdown re-parse in `generate-process-improvements.ts` is fragile — regex/bullet-parse bugs silently drop ideas from the operator dashboard. Emitting structured sidecars closes this gap and reduces prompt context for the model by removing the obligation to author prose that code immediately deconstructs.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `generate-process-improvements.ts` reads idea candidates from `results-review.signals.json` when present (falling back to markdown parse when absent), and `self-evolving-from-build-output.ts` reads pattern entries from `pattern-reflection.entries.json` when present (falling back to frontmatter YAML). Zero regressions in existing behaviour.
- **Source:** auto

---

## Access Declarations

None. All evidence is local filesystem — TypeScript source files, test files, and plan artifacts. No external services, APIs, or credentials required.

---

## Evidence Audit (Current State)

### Entry Points

- `scripts/src/startup-loop/build/generate-process-improvements.ts` — Primary aggregator; reads `results-review.user.md` from every plan via `collectProcessImprovements()`. Calls `parseSections()` + `extractBulletItems()` on the `## New Idea Candidates` section body. Lines 538–639 are the markdown-parse hot path.
- `scripts/src/startup-loop/build/lp-do-build-results-review-prefill.ts` — Scaffold emitter of `results-review.user.md` (step 1.7 in SKILL.md). Produces placeholder content; the LLM refines it in step 2. **Not** the right place to emit the sidecar — content is not yet final at this point.
- `scripts/src/startup-loop/build/lp-do-build-pattern-reflection-prefill.ts` — Scaffold emitter of `pattern-reflection.user.md` (step 2.4 in SKILL.md). Produces routing pre-fill; the LLM refines in step 2.5. **Not** the right place to emit the sidecar for the same reason.
- `scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts` — Reads both `results-review.user.md` (via `extractBulletCandidates()`) and `pattern-reflection.user.md` (via `extractPatternReflectionSeeds()`). Called by `lp-do-build` SKILL.md step 2.6. File loading occurs in `runSelfEvolvingFromBuildOutput()` via `safeRead()` at lines 402–404 — this is the correct sidecar-prefer seam.
- `scripts/src/startup-loop/build/lp-do-pattern-promote-loop-update.ts` — Reads `pattern-reflection.user.md` via `parsePatternReflectionEntries()` (dual-format: YAML frontmatter primary, body-format fallback). Shared parser is imported by `lp-do-pattern-promote-skill-proposal.ts` — both paths go through the same `parsePatternReflectionEntries()` function.
- `scripts/src/startup-loop/build/lp-do-pattern-promote-skill-proposal.ts` — Imports `parsePatternReflectionEntries()` from `lp-do-pattern-promote-loop-update.ts` (shared). Reads `pattern-reflection.user.md` via the same shared parser. Consumer map is complete: both promote scripts share one parse path.
- `scripts/git-hooks/generate-process-improvements.sh` — Pre-commit hook that triggers `generate-process-improvements.ts` when `results-review.user.md`, `build-record.user.md`, `reflection-debt.user.md`, `bug-scan-findings.user.json`, `completed-ideas.json`, or `queue-state.json` are staged.

### Key Modules / Files

- `scripts/src/startup-loop/build/generate-process-improvements.ts` — Core parse functions: `parseSections()` (L212–243), `extractBulletItems()` (L245–281), `parseIdeaCandidate()` (L320–360), `stripHtmlComments()` (L142–144), `classifyIdeaItem()` (L426–447), `collectProcessImprovements()` (L523–818). The markdown parse occurs entirely within `collectProcessImprovements()`, specifically the `resultsReviewPaths` loop (L555–639).
- `scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts` — `extractBulletCandidates()` (L113–143): parses `## New Idea Candidates` bullet lines from markdown. `extractPatternReflectionSeeds()` (L238–284): reads `PatternReflectionFrontmatterEntry[]` from YAML frontmatter first, falls back to `extractPatternSectionFallback()` (L194–236) which line-parses the `## Patterns` body.
- `scripts/src/startup-loop/build/lp-do-pattern-promote-loop-update.ts` — `parsePatternReflectionEntries()`: dual-format parser; YAML frontmatter primary (`parseYamlEntries()` L71–98), body-format regex fallback (`parseBodyFormatEntries()` L100–136). Already has a structured path (frontmatter YAML), but still loads the full `.user.md` file.
- `scripts/src/startup-loop/__tests__/generate-process-improvements.test.ts` — 20+ test cases covering the markdown parse path, including `collectProcessImprovements`, `runCheck`, completion lifecycle, dispatch queue collection. All tests rely on writing real `results-review.user.md` fixtures.
- `scripts/src/startup-loop/__tests__/lp-do-build-pattern-reflection-prefill.test.ts` — 15+ test cases for the prefill emitter. Tests use `prefillPatternReflection()` directly and check frontmatter output.
- `scripts/src/startup-loop/__tests__/self-evolving-signal-integrity.test.ts` — Tests `extractBulletCandidates` and `extractPatternReflectionSeeds` from markdown fixtures.

### Patterns & Conventions Observed

- **Atomic writes**: `writeFileAtomic()` (generate-process-improvements.ts L976–981) uses temp-file + rename. The pattern must be replicated for new JSON sidecars — evidence: `writeFileSync(tempPath) → renameSync(tempPath, filePath)`.
- **Schema versioning convention**: `bug-scan-findings.user.json` has `schema_version: "bug-scan-findings.v1"`. The `pattern-reflection.user.md` frontmatter uses `schema_version: pattern-reflection.v1`. Sidecars should adopt the same pattern: `results-review.signals.v1` and `pattern-reflection.entries.v1`.
- **Fail-open consumer pattern**: `collectProcessImprovements()` wraps file reads in try/catch and continues on error. Sidecar reads must be equally fail-open — if the sidecar is absent or malformed, fall back to markdown parse.
- **Idea deduplication key**: `deriveIdeaKey(sourcePath, title)` is a SHA-1 of `"${sourcePath}::${title}"`. The sidecar must carry the pre-computed `idea_key` so downstream consumers don't re-derive it.
- **None-placeholder suppression**: Both the prefill emitter and generate-process-improvements apply multi-form None detection (plain `None.`, `None identified.`, `None for...`, `Category X: None.`). The sidecar must contain only non-None items — suppression happens at emit time.
- **Struck-through suppression**: Ideas prefixed with `~~...~~` are suppressed at parse time (generate-process-improvements.ts L570–577). Pre-suppression must happen in the emitter before writing the sidecar.

### Data & Contracts

- Types/schemas/events:
  - `ProcessImprovementItem` (generate-process-improvements.ts L26–48): existing type with `type`, `business`, `title`, `body`, `suggested_action`, `source`, `date`, `path`, `idea_key`, `priority_tier`, `own_priority_rank`, `urgency`, `effort`, `proximity`, `reason_code`.
  - `PatternEntry` (lp-do-build-pattern-reflection-prefill.ts L27–33): `pattern_summary`, `category`, `routing_target`, `occurrence_count`, `evidence_refs`. Already emitted in YAML frontmatter of `pattern-reflection.user.md`.
  - No existing JSON sidecar files were found anywhere in `docs/plans/` — the feature is net-new.

- Persistence:
  - Sidecars live at `docs/plans/<slug>/results-review.signals.json` and `docs/plans/<slug>/pattern-reflection.entries.json`.
  - `results-review.signals.json` is written by `lp-do-build-results-review-extract.ts` (post-authoring extractor, new step 2.1), after the LLM finalizes `results-review.user.md` in step 2.
  - `pattern-reflection.entries.json` is written by `lp-do-build-pattern-reflection-extract.ts` (post-authoring extractor, new step 2.55), after the LLM finalizes `pattern-reflection.user.md` in step 2.5.
  - The `.user.md` files continue to be written unchanged by their respective prefill + LLM-refine steps. Prefill scripts are not modified.
  - `generate-process-improvements.ts` reads sidecars from the same directories it currently reads `.user.md` files.

- API/contracts:
  - No API changes. No BOS API interaction. Pure filesystem.

### Dependency & Impact Map

- Upstream dependencies:
  - `lp-do-build` SKILL.md step 2 (LLM refines `results-review.user.md`) → new post-authoring step 2.1: run `lp-do-build-results-review-extract.ts` which reads the final `.user.md` and emits `results-review.signals.json`.
  - `lp-do-build` SKILL.md step 2.5 (LLM refines `pattern-reflection.user.md`) → new post-authoring step 2.55: run `lp-do-build-pattern-reflection-extract.ts` which reads the final `.user.md` and emits `pattern-reflection.entries.json`.
  - `prefillResultsReview()` and `prefillPatternReflection()` are NOT modified — they remain scaffold-only emitters. The extraction logic lives in new dedicated extractor scripts.
  - The extractor for `results-review.signals.json` reuses the existing parse logic (`parseSections()`, `extractBulletItems()`, `parseIdeaCandidate()`, `classifyIdeaItem()`) from `generate-process-improvements.ts` — these functions should be extracted to a shared module so both scripts can import them without duplication.
  - The extractor for `pattern-reflection.entries.json` reuses `parsePatternReflectionEntries()` from `lp-do-pattern-promote-loop-update.ts` (already the shared parser).

- Downstream dependents (all programmatic consumers of the markdown):
  1. `generate-process-improvements.ts / collectProcessImprovements()` — reads `results-review.user.md` markdown. Sidecar preference: read `results-review.signals.json` if present, else fall back to markdown parse. This eliminates `parseSections()` + `extractBulletItems()` + `parseIdeaCandidate()` for sidecar-equipped reviews. Seam: add `existsSync` branch before the current markdown-parse block inside the `resultsReviewPaths` loop (L555).
  2. `self-evolving-from-build-output.ts / runSelfEvolvingFromBuildOutput()` — loads `results-review.user.md` via `safeRead(resultsReviewAbs)` at L402, then passes the string to `extractBulletCandidates()`. Sidecar preference seam: before calling `safeRead()`, check for `results-review.signals.json`; if present, read it and reconstruct the candidates list directly, bypassing `extractBulletCandidates()`. The functions `extractBulletCandidates()` and `extractPatternReflectionSeeds()` themselves are string parsers — the sidecar-prefer logic must sit at the file-loading layer in `runSelfEvolvingFromBuildOutput()`, not inside those parse functions.
  3. `self-evolving-from-build-output.ts` (pattern reflection) — loads `pattern-reflection.user.md` via `safeRead(patternReflectionAbs)` at L403, passes to `extractPatternReflectionSeeds()`. Sidecar preference seam: same file-loading layer pattern; check for `pattern-reflection.entries.json` first. Lower priority since `extractPatternReflectionSeeds()` already prefers YAML frontmatter.
  4. `lp-do-pattern-promote-loop-update.ts / parsePatternReflectionEntries()` — reads YAML frontmatter from `pattern-reflection.user.md`. Sidecar preference: read `pattern-reflection.entries.json` if present. Already has a structured YAML path; regression risk is low.
  5. `lp-do-pattern-promote-skill-proposal.ts` — imports `parsePatternReflectionEntries()` from lp-do-pattern-promote-loop-update.ts (shared parser). Same sidecar-prefer change in the shared parser benefits both promote scripts.

- Likely blast radius:
  - Tests in `__tests__/generate-process-improvements.test.ts` must be extended to cover the sidecar-prefer path and malformed-sidecar fallback. Existing markdown-path tests remain valid (they test the fallback).
  - New test files for the extractor scripts: `__tests__/lp-do-build-results-review-extract.test.ts` and `__tests__/lp-do-build-pattern-reflection-extract.test.ts`.
  - Tests in `__tests__/lp-do-build-results-review-prefill.test.ts` and `__tests__/lp-do-build-pattern-reflection-prefill.test.ts` are NOT affected — prefill scripts are not modified.
  - `scripts/git-hooks/generate-process-improvements.sh` does not need changes — it already stages the HTML and JSON outputs of generate-process-improvements. The sidecar is committed by the build agent alongside `results-review.user.md`; the hook fires on `.user.md` staging (trigger condition unchanged). The sidecar requires an explicit `git add docs/plans/<slug>/results-review.signals.json` in the build agent's commit step — this must be documented in SKILL.md step 2.1.

### Test Landscape

#### Test Infrastructure

- Framework: Jest (governed runner via `pnpm -w run test:governed`)
- Test files: `scripts/src/startup-loop/__tests__/` directory
- CI integration: tests run in CI only (per MEMORY.md policy)

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `collectProcessImprovements` markdown parse | Unit | `generate-process-improvements.test.ts` | Full coverage of idea parse, None suppression, struck-through suppression, classification fields |
| `prefillResultsReview` | Unit | `lp-do-build-results-review-prefill.test.ts` | 7 TC contracts; tests check markdown output only, no sidecar |
| `prefillPatternReflection` | Unit | `lp-do-build-pattern-reflection-prefill.test.ts` | 6 TC contracts + unit tests; tests check markdown/YAML output only, no sidecar |
| `extractBulletCandidates` | Unit | `self-evolving-signal-integrity.test.ts` | Covers markdown parse path |
| `parsePatternReflectionEntries` | Unit | `pattern-promote.test.ts` | Covers dual-format YAML+body parse |

#### Coverage Gaps

- No tests for the new extractor scripts (`lp-do-build-results-review-extract.ts`, `lp-do-build-pattern-reflection-extract.ts`) — net-new files, all tests are to be written in TASK-02 and TASK-03.
- No tests for shared parse module (`lp-do-build-results-review-parse.ts`) — new shared module, tests written in TASK-01.
- No tests for sidecar-prefer path in `collectProcessImprovements` — new TC contracts in TASK-04.
- No tests for sidecar-prefer path at `runSelfEvolvingFromBuildOutput()` file-loading layer — new TC contracts in TASK-05.
- No tests for graceful fallback when sidecar is present but malformed JSON.

#### Testability Assessment

- Easy to test:
  - Extractor scripts: write a temp dir with a final `.user.md` (real content, not scaffold), call extractor, assert JSON sidecar exists with expected items.
  - Sidecar-prefer in `collectProcessImprovements`: write both `.user.md` and `.signals.json` in temp dir; assert that idea items come from sidecar (verify by putting divergent content in each).
  - Fallback path: write only `.user.md` (no sidecar); assert markdown-parse path is used.
  - Malformed sidecar fallback: write invalid JSON as sidecar; assert markdown-parse fallback is triggered.
  - Sidecar-prefer in `runSelfEvolvingFromBuildOutput()`: pass a temp dir with sidecar file; assert `extractBulletCandidates` is bypassed.
- Hard to test:
  - Git hook integration (requires a real git repo with staged files) — unchanged, not a new gap.

---

## Questions

### Resolved

- **Q: Should the sidecar carry pre-classified idea items (with `priority_tier`, `urgency`, etc.) or raw unclassified items?**
  - A: Pre-classified items (same shape as `ProcessImprovementItem`). The post-authoring extractor (`lp-do-build-results-review-extract.ts`) reads the final `.user.md`, parses idea candidates via the shared parse module, and runs `classifyIdeaItem()` on each. The sidecar stores the resulting classified items. `collectProcessImprovements` can then skip both parse and classification for sidecar-equipped reviews.
  - Evidence: `classifyIdeaItem()` L426–447 in generate-process-improvements.ts; `IdeaClassificationInput` from `lp-do-ideas-classifier.js`. Classification runs in the extractor, not the prefill script.

- **Q: Should `results-review.signals.json` be staged by the git hook?**
  - A: The sidecar is committed by the build agent alongside `results-review.user.md` using an explicit `git add` in step 2.1. The git hook (`generate-process-improvements.sh`) fires when `results-review.user.md` is staged (trigger condition L4–9 unchanged). The hook only auto-stages `docs/business-os/process-improvements.user.html` and `docs/business-os/_data/process-improvements.json` (L30) — it does not auto-stage the sidecar. The sidecar must be explicitly `git add`-ed by the build agent in the same commit that adds `results-review.user.md`. This is documented in TASK-06 (SKILL.md update).
  - Evidence: `scripts/git-hooks/generate-process-improvements.sh` L4–9, L30.

- **Q: Should `pattern-reflection.entries.json` be staged by the git hook?**
  - A: No. Both sidecar files are committed by the build agent in the plan completion sequence. The git hook trigger condition does not cover pattern-reflection; the hook fires on `results-review.user.md` staging only. The build agent commits both `pattern-reflection.user.md` and `pattern-reflection.entries.json` together in its commit for plan archiving.

- **Q: What is the safest migration strategy?**
  - A: New post-authoring extractor scripts run after the LLM finalizes each artifact (additive, no breaking change). `generate-process-improvements.ts` adds a sidecar-prefer branch: if `results-review.signals.json` exists alongside a `results-review.user.md`, read the sidecar; otherwise execute the existing markdown-parse path unchanged. Historical (archived) plans that have no sidecar are unaffected — the fallback path is always active.
  - Evidence: `collectProcessImprovements()` already iterates `resultsReviewPaths` and does per-file reads — adding an `existsSync` branch before the parse is a local, low-risk change. The extractor scripts are separate tools that only run when invoked from SKILL.md steps 2.1 and 2.55.

- **Q: Does `pattern-reflection.user.md` already carry structured data (YAML frontmatter)?**
  - A: Yes. The frontmatter carries `entries[]` in `PatternEntry` shape. The `extractPatternReflectionSeeds()` in `self-evolving-from-build-output.ts` already prefers frontmatter entries over body-format fallback (L238–284). `parsePatternReflectionEntries()` in `lp-do-pattern-promote-loop-update.ts` also prefers YAML. So `pattern-reflection.entries.json` is a lower-urgency sidecar — the YAML frontmatter already provides a structured path. The primary fragility is in `results-review.user.md` parse.
  - Evidence: `extractPatternReflectionSeeds()` L243–249, `parseYamlEntries()` in lp-do-pattern-promote-loop-update.ts L71–98.

- **Q: Should the sidecar emit the full classified `ProcessImprovementItem[]` or a lighter signal schema?**
  - A: Use a purpose-built `ResultsReviewSignal` type (lighter, no HTML-generation fields like `source`, `path` shape differences) but keep it compatible with `ProcessImprovementItem` by including all fields `collectProcessImprovements` needs: `title`, `body`, `suggested_action`, `business`, `date`, `idea_key`, `priority_tier`, `own_priority_rank`, `urgency`, `effort`, `proximity`, `reason_code`. The `source` field becomes `"results-review.signals.json"` when read from sidecar. The `path` is the sidecar path. This keeps the type consistent downstream.

- **Q: Where should the sidecar extraction logic live — in the prefill scripts or a new extractor step?**
  - A: New dedicated extractor scripts called after the LLM authoring steps, not in the prefill scripts. The prefill scripts (steps 1.7 and 2.4) produce scaffold content with placeholders; the LLM refines each artifact in steps 2 and 2.5 respectively. Emitting a sidecar from the prefill script would freeze placeholder data, diverging from the final `.user.md`. The extractors (`lp-do-build-results-review-extract.ts`, `lp-do-build-pattern-reflection-extract.ts`) run as post-authoring steps (new steps 2.1 and 2.55 in SKILL.md), read the final `.user.md`, and write the JSON sidecar. Both are advisory/fail-open.
  - Evidence: `lp-do-build` SKILL.md step 1.7 (`results-review-prefill`) at L206–211, step 2 LLM refinement at L212–234, step 2.4 (`pattern-reflection-prefill`) at L235–240, step 2.5 LLM refinement at L241–241.

- **Q: How do the parse helper functions get shared between `generate-process-improvements.ts` (current) and the new extractor?**
  - A: Extract `parseSections()`, `extractBulletItems()`, `parseIdeaCandidate()`, `stripHtmlComments()`, and `sanitizeText()` into a shared module (e.g. `lp-do-build-results-review-parse.ts`). Both `generate-process-improvements.ts` and the new extractor import from it. This eliminates duplication and makes the fallback path (markdown parse in generate-process-improvements) and the extractor share the same parse logic exactly.
  - Evidence: All these functions are currently co-located in `generate-process-improvements.ts` (L118–281); they have no external dependencies that would complicate extraction.

### Open (Operator Input Required)

None. All questions answered from codebase evidence and documented constraints.

---

## Confidence Inputs

- Implementation: 92%
  - Evidence: all source files fully read; parse paths traced line-by-line; data types confirmed; emitter timing issue identified and resolved in scope. Task boundaries are clean: shared parse module (TASK-01), new extractors (TASK-02, TASK-03), sidecar-prefer consumers (TASK-04, TASK-05), docs (TASK-06).
  - Raise to >=95%: confirm no other file imports `generate-process-improvements.ts` helper functions directly (pre-task grep in TASK-01).
- Approach: 93%
  - Evidence: post-authoring extractor pattern is the correct approach — prefill-time emission was the main risk (resolved in critique). Atomic write pattern established. Schema versioning convention established. Shared-parse-module pattern is clean and testable.
  - Raise to >=95%: confirm `classifyIdeaItem` import in new extractor has no circular dependency.
- Impact: 88%
  - Evidence: the markdown parse is the fragile path that silently drops ideas. The sidecar eliminates this risk for new plans. Historical plans (no sidecar) continue to work unchanged through the markdown fallback.
- Delivery-Readiness: 90%
  - Evidence: entry points, types, test infrastructure all confirmed. Six tasks, all bounded to `scripts/src/startup-loop/build/` and `self-evolving/`. The SKILL.md update (step 2.1 and 2.55 wiring) is the only out-of-code-directory change.
- Testability: 95%
  - Evidence: new extractor scripts are pure (read file, write file) and are trivially testable with temp directories. Sidecar-prefer branches in `collectProcessImprovements` and `runSelfEvolvingFromBuildOutput` are testable by writing both sidecar and `.user.md` files to a temp dir and asserting which path is taken.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Shared parse module extraction breaks an existing import path | Low | Medium | TASK-01 starts with a grep for all existing imports of `generate-process-improvements.ts` exports; update any found. No external consumers found in investigation, but the grep confirms this before moving. |
| Sidecar schema drift — extractor runs but `.user.md` is later modified by operator | Low | Low | `schema_version` + `generated_at` timestamp on sidecar; `generate-process-improvements.ts` `runCheck` mode can optionally compare sidecar vs markdown parse for a transition period. |
| Post-authoring extractor runs before LLM completes step 2 (build sequence error) | Low | Medium | SKILL.md instruction explicitly places extractors after the relevant LLM steps (step 2.1 after step 2, step 2.55 after step 2.5). Extractors are fail-open — if `.user.md` still has placeholders, sidecar may contain `None` items only (harmless). |
| `self-evolving-from-build-output.ts` sidecar-prefer branch adds complexity | Low | Low | Consumer is advisory/fail-open. Fallback to existing markdown parse is safe even if sidecar read fails. |
| Classification import in new extractor creates circular dependency | Low | Low | Extractor imports `classifyIdeaItem` from `generate-process-improvements.ts` after the shared-parse refactor. Circular dependency unlikely (classifier has no dependency on generate-process-improvements). Verify in TASK-02 pre-task check. |

---

## Planning Constraints & Notes

- Must-follow patterns:
  - Use `writeFileAtomic()` for sidecar writes.
  - Include `schema_version: "results-review.signals.v1"` and `schema_version: "pattern-reflection.entries.v1"` in all sidecars.
  - Sidecar reads must be fail-open: malformed JSON falls through to markdown parse.
  - Import `classifyIdeaItem` / classifier only after confirming no circular dependency.
- Rollout/rollback expectations:
  - Rollback: remove steps 2.1 and 2.55 from `lp-do-build` SKILL.md; delete the extractor scripts. `collectProcessImprovements` and `runSelfEvolvingFromBuildOutput` continue to work unchanged — the markdown fallback path is always present and is never removed. Prefill scripts are untouched throughout.
- Observability expectations:
  - `collectProcessImprovements` should log `[generate-process-improvements] info: reading sidecar for <path>` when it takes the sidecar path, for operator visibility.

---

## Suggested Task Seeds (Non-binding)

1. **TASK-01 (IMPLEMENT)**: Extract shared markdown parse helpers AND classification from `generate-process-improvements.ts` into a new `lp-do-build-results-review-parse.ts` shared module: `parseSections`, `extractBulletItems`, `parseIdeaCandidate`, `stripHtmlComments`, `sanitizeText`, and `classifyIdeaItem` (currently file-local at L426–447). Also export `IdeaClassificationInput` type and the classifier import path. Update `generate-process-improvements.ts` to import from the shared module. No behaviour change — pure refactor enabling TASK-02. Add TC contracts verifying shared module parity with existing parse paths.
2. **TASK-02 (IMPLEMENT)**: Create `lp-do-build-results-review-extract.ts` — a post-authoring extractor that reads the final `results-review.user.md`, extracts idea candidates using the shared parse module from TASK-01 (including `classifyIdeaItem` which is now exported from the shared module), and writes `results-review.signals.json` (schema version `results-review.signals.v1`, atomic write). Fail-open: errors produce a warning, no sidecar written. Add TC contracts. Wire as new step 2.1 in `lp-do-build` SKILL.md (after LLM refines results-review, before step 2.4).
3. **TASK-03 (IMPLEMENT)**: Create `lp-do-build-pattern-reflection-extract.ts` — reads the final `pattern-reflection.user.md`, extracts entries via `parsePatternReflectionEntries()` (shared from `lp-do-pattern-promote-loop-update.ts`), writes `pattern-reflection.entries.json` (schema version `pattern-reflection.entries.v1`, atomic write). Fail-open. Add TC contracts. Wire as new step 2.55 in `lp-do-build` SKILL.md (after step 2.5 LLM refinement, before step 2.6).
4. **TASK-04 (IMPLEMENT)**: In `generate-process-improvements.ts / collectProcessImprovements()`, add sidecar-prefer branch: for each `results-review.user.md` path, check for sibling `results-review.signals.json`; if present and valid, read items from JSON (skipping markdown parse and re-classification); else use existing markdown-parse fallback. Add TC contracts for all three cases (sidecar present/valid, sidecar absent, sidecar malformed). Update tests.
5. **TASK-05 (IMPLEMENT)**: In `self-evolving-from-build-output.ts / runSelfEvolvingFromBuildOutput()`, add sidecar-prefer at the file-loading layer: before `safeRead(resultsReviewAbs)`, check for sibling `results-review.signals.json`; if present, read items directly (bypasses `extractBulletCandidates()`). Add same for `pattern-reflection.entries.json` / `safeRead(patternReflectionAbs)` — both branches are required (not optional) to fulfill the stated outcome contract. Both are fail-open: if sidecar read fails, fall back to `safeRead()` + parse. Add tests for both sidecar-prefer paths and both fallback paths.
6. **TASK-06 (CHECKPOINT)**: Update `loop-output-contracts.md` to document the two new sidecar artifacts (`results-review.signals.json`, `pattern-reflection.entries.json`) as machine-readable companions. Document producer (extractor scripts), consumers, schema version, and fallback policy.

---

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package: sidecar files emitted and tested; `generate-process-improvements.ts` reads sidecar for new plans; zero regressions in existing tests; `loop-output-contracts.md` updated.
- Post-delivery measurement plan: monitor `[generate-process-improvements] info: reading sidecar` log lines in pre-commit hook output after next build cycle completes.

---

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| `results-review.user.md` markdown parse path in `collectProcessImprovements` | Yes | None | No |
| Emitter timing — prefill scripts produce scaffold only, LLM refines in steps 2 and 2.5 | Yes | Resolved (Critical from Round 1 critique): sidecar emission moved to post-authoring extractor scripts, not prefill. | No |
| New post-authoring extractors (`lp-do-build-results-review-extract.ts`, `lp-do-build-pattern-reflection-extract.ts`) | Yes | None — new scripts with no pre-existing dependencies; parse helpers sourced from shared module. | No |
| Shared parse module extraction from `generate-process-improvements.ts` | Yes | [Missing precondition] [Minor]: must confirm no other file imports these functions directly from `generate-process-improvements.ts` before extracting. TASK-01 includes this check. | No (advisory) |
| Sidecar-prefer seam in `collectProcessImprovements` (L555 loop) | Yes | None | No |
| Sidecar-prefer seam in `runSelfEvolvingFromBuildOutput()` at file-loading layer (L402–404) | Yes | None — seam is correctly identified as `safeRead()` calls, not the parse functions. | No |
| `lp-do-pattern-promote-skill-proposal.ts` consumer map | Yes | Resolved (Major from Round 1 critique): both promote scripts share `parsePatternReflectionEntries()` via import; one change to the shared function covers both. | No |
| `extractBulletCandidates` / `extractPatternReflectionSeeds` — string parsers, not file loaders | Yes | Resolved (Major from Round 1 critique): sidecar-prefer sits at `runSelfEvolvingFromBuildOutput()` file-loading layer, not inside these parse functions. | No |
| Git hook staging behaviour | Yes | None | No |
| Test coverage for new sidecar paths | Partial | [Scope gap] [Minor]: no existing tests for extraction scripts or sidecar-prefer paths — all are net-new TC contracts to be written in TASK-01 through TASK-05. | No (expected) |

---

## Scope Signal

Signal: right-sized
Rationale: Six tasks, all bounded to `scripts/src/startup-loop/build/` and `self-evolving/`. No architectural changes, no API changes, no schema migrations. The change is additive — sidecar emission is an additional write via new post-authoring extractor scripts; existing consumers gain a faster, more reliable path. Evidence: all source files read, all consumers mapped, test infrastructure confirmed. Dependencies are intra-package only.

---

## Evidence Gap Review

### Gaps Addressed

- Confirmed all six programmatic consumers of `results-review.user.md` and `pattern-reflection.user.md` — including `lp-do-pattern-promote-skill-proposal.ts` (missed in initial investigation, surfaced by Round 1 critique; shares parser with loop-update via import).
- Confirmed `PatternEntry[]` type is already constructed inside `prefillPatternReflection()` — and that the YAML frontmatter path already carries structured data. The extractor for pattern reflection simply reads the final `.user.md` and re-parses via the existing `parsePatternReflectionEntries()`.
- Confirmed the git hook trigger pattern does not need updating.
- Confirmed no existing sidecar files anywhere in `docs/plans/` — net-new.
- Confirmed `writeFileAtomic` pattern is established and must be reused.
- Resolved emitter timing (Critical, Round 1 critique): post-authoring extractor scripts replace the prefill-time emission approach. Scope updated throughout.
- Resolved consumer map seam for `self-evolving-from-build-output.ts` (Major, Round 1 critique): sidecar-prefer sits at the `safeRead()` file-loading layer in `runSelfEvolvingFromBuildOutput()`, not inside parse-only helper functions.

### Confidence Adjustments

- Implementation: 92% (stable). The timing correction adds one planning constraint (extractor must run after LLM step), but the implementation is straightforward.
- Approach: raised from 90% to 93%: post-authoring extractor pattern is more robust than prefill-time emission; no new risks introduced by the correction.
- All other scores stable.

### Remaining Assumptions

- The shared parse module extraction (TASK-01) has no hidden import consumers. A pre-task grep will confirm before any refactor is applied.
- The sidecar schema carries full `ProcessImprovementItem`-compatible fields so the `collectProcessImprovements` sidecar-read path can drop-in replace the markdown-parse output path without downstream type changes.

---

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan startup-loop-structured-sidecar-introduction --auto`
