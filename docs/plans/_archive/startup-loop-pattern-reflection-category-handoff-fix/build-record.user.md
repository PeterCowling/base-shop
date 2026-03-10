# Build Record

**Plan:** startup-loop-pattern-reflection-category-handoff-fix
**Completed:** 2026-03-06
**Business:** PLAT
**Dispatch:** IDEA-DISPATCH-20260306153000-0991

## What Was Built

Two deterministic fixes to `scripts/src/startup-loop/build/lp-do-build-pattern-reflection-prefill.ts`:

**Fix 1 — Category and evidence preservation**

Added `extractBulletEntries()` — a variant of `extractBulletTitles()` that also derives a `PatternCategory` from the bullet prefix (e.g. "AI-to-mechanistic —" → `deterministic`, "New skill —" → `ad_hoc`). Updated `extractCurrentIdeas()` to call `extractBulletEntries()` and return `category` alongside `title`, instead of always returning `category: undefined`. Extended `PatternReflectionInput.currentIdeas` to include optional `reason` and `evidence_refs` fields for future richer callers.

**Fix 2 — needs_refinement skip gate**

Added exported `computeNeedsRefinement(prefillOutput, currentIdeas)` that returns `false` (skip model) when: no `<FILL>`/`<TBD>`/`[FILL]`/`[TBD]` placeholder markers are present, no unclassified entries exist (checked both in `currentIdeas` array and in rendered YAML), and all required YAML fields (`schema_version`, `feature_slug`, `generated_at`, `entries`) are present. `main()` now emits `[pre-fill] needs_refinement: true/false` to stderr after writing the output file.

**SKILL.md update**

Updated `.claude/skills/lp-do-build/SKILL.md` step 2.4 to document the `needs_refinement` signal. Updated step 2.5 to add a hard skip gate: if step 2.4 succeeded and emitted `needs_refinement: false`, skip model execution and use the pre-fill as-is. Removed the instruction to "correct category classifications" (category is now preserved at handoff from the bullet prefix; correction is only needed for genuinely unclassifiable entries).

**Tests added (TC-07 through TC-11)**

- TC-07: `prefillPatternReflection` with `category: "deterministic"` emits `category: deterministic` in YAML; with `category: "ad_hoc"` emits `category: ad_hoc`; with no category falls back to `unclassified`.
- TC-08: `computeNeedsRefinement` returns `false` for complete valid empty artifact.
- TC-09: `computeNeedsRefinement` returns `true` when any idea has no category or is `unclassified`.
- TC-10: `computeNeedsRefinement` returns `true` when placeholder markers present.
- TC-11: `computeNeedsRefinement` returns `false` when all ideas have known categories and output is clean.

## Files Changed

- `scripts/src/startup-loop/build/lp-do-build-pattern-reflection-prefill.ts` — primary fix
- `scripts/src/startup-loop/__tests__/lp-do-build-pattern-reflection-prefill.test.ts` — TC-07–TC-11
- `.claude/skills/lp-do-build/SKILL.md` — step 2.4/2.5 update
- `docs/plans/startup-loop-pattern-reflection-category-handoff-fix/micro-build.md` — plan artifact

## Validation Evidence

- TypeScript: `npx tsc --noEmit` passes with zero errors in changed files (pre-existing errors in unrelated files unchanged).
- Acceptance checks TC-07–TC-11 implemented as unit tests covering all gate branches.
- Existing TC-01–TC-06 unaffected: `extractBulletTitles` (used by `scanArchiveForRecurrences`) unchanged; `prefillPatternReflection` logic unchanged beyond using `idea.category` which was already wired.

## Outcome Contract

- **Why:** Every build cycle was wasting model tokens reclassifying ideas that already have categories and refining artifacts that are already complete. Both are fixable with deterministic code changes — no model judgment required.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** category, reason, and evidence_refs pass through `extractCurrentIdeas()` unmodified; a `needs_refinement` gate in `lp-do-build-pattern-reflection-prefill.ts` skips model execution when the artifact is already complete; reclassification and noop-refinement model calls are eliminated from every build cycle.
- **Source:** operator
