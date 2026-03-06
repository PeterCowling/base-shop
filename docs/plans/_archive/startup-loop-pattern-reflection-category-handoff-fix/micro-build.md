---
Type: Micro-Build
Status: Archived
Created: 2026-03-06
Last-updated: 2026-03-06
Feature-Slug: startup-loop-pattern-reflection-category-handoff-fix
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260306153000-0991
Related-Plan: none
---

# Pattern Reflection Category Handoff Fix Micro-Build

## Scope
- Change: Fix two token-efficiency bugs in `scripts/src/startup-loop/build/lp-do-build-pattern-reflection-prefill.ts`: (1) preserve `category`, `reason`, and `evidence_refs` from `extractCurrentIdeas()` through to the prefill payload instead of always returning `category: undefined`; (2) add a deterministic `needs_refinement` gate before the model call — false when no placeholder markers, no unclassified entries, and all required fields are present. Update `.claude/skills/lp-do-build/SKILL.md` step 2.5 to reflect that category is preserved at handoff and refinement is gated.
- Non-goals: Changing the results-review.user.md markdown format; adding sidecar JSON schemas; changing any other startup-loop pipeline stages.

## Execution Contract
- Affects:
  - `scripts/src/startup-loop/build/lp-do-build-pattern-reflection-prefill.ts`
  - `scripts/src/startup-loop/__tests__/lp-do-build-pattern-reflection-prefill.test.ts`
  - `.claude/skills/lp-do-build/SKILL.md`
- Acceptance checks:
  - TC-07: `extractCurrentIdeas()` now extracts category from the bullet prefix (e.g. "New skill —" → category key) when present; ideas without a recognizable prefix still get `category: undefined`.
  - TC-08: `computeNeedsRefinement()` returns false when the prefill output has 0 ideas, no placeholder markers, no unclassified entries, and all required fields are present.
  - TC-09: `computeNeedsRefinement()` returns true when any idea has `category: "unclassified"`.
  - TC-10: `computeNeedsRefinement()` returns true when the output contains a placeholder marker (`<FILL>`).
  - TC-11: `main()` emits `[pre-fill] needs_refinement: false` to stderr for the zero-ideas case.
  - Existing TC-01 through TC-06 continue to pass.
- Validation commands:
  - `pnpm --filter scripts typecheck`
  - `pnpm --filter scripts startup-loop:pattern-reflection-prefill -- --help 2>&1 || true`
- Rollback note: Revert the two edited files. No data migrations or side effects.

## Outcome Contract
- **Why:** Every build cycle wastes model tokens reclassifying ideas that already have categories and refining artifacts that are already complete. Both are fixable with deterministic code changes — no model judgment required.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** category, reason, and evidence_refs pass through `extractCurrentIdeas()` unmodified; a `needs_refinement` gate in `lp-do-build-pattern-reflection-prefill.ts` skips model execution when the artifact is already complete; reclassification and noop-refinement model calls are eliminated from every build cycle.
- **Source:** operator
