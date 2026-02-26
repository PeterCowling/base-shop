---
Plan: process-improvements-completion-lifecycle
Feature-Slug: process-improvements-completion-lifecycle
Business-Unit: BOS
Build-Date: 2026-02-26
---

# Build Record: Process-improvements completion lifecycle

## Tasks completed

- TASK-01: Added CompletedIdeaEntry, CompletedIdeasRegistry types, deriveIdeaKey(), loadCompletedIdeasRegistry() to generate-process-improvements.ts
- TASK-02: Filtering of completed and struck-through ideas in collectProcessImprovements()
- TASK-03: Seeded docs/business-os/_data/completed-ideas.json with known-completed idea
- TASK-04: Exported appendCompletedIdea() for programmatic use
- TASK-05: Updated lp-do-build SKILL.md completion step
- TASK-06: Unit tests for completion lifecycle (4 new test cases)
- TASK-07: Drift check JSDoc comment

## Output

- `scripts/src/startup-loop/generate-process-improvements.ts` — extended with completion lifecycle
- `docs/business-os/_data/completed-ideas.json` — new registry file
- `.claude/skills/lp-do-build/SKILL.md` — completion step updated
- `scripts/src/startup-loop/__tests__/generate-process-improvements.test.ts` — 4 new tests

## Validation

- TypeScript: `npx tsc --noEmit` in `scripts/` — clean, no errors
- Tests: 9/9 passing (5 pre-existing + 4 new completion lifecycle tests)
- Generator run: `pnpm --filter scripts startup-loop:generate-process-improvements` — ran clean, struck-through idea suppressed, output updated (ideas=51)
- The `~~Add view_item_list assertions to the Playwright smoke test~~` idea from `brikette-cta-sales-funnel-ga4/results-review.user.md` is no longer present in the live report

## Key derivation

The seed entry idea_key `a8cc677f63b4af7ba37b1b47a163e7f32d62af6c` was computed as:
`sha1("docs/plans/brikette-cta-sales-funnel-ga4/results-review.user.md::~~Add view_item_list assertions to the Playwright smoke test~~")`

The title includes `~~` markers because `sanitizeText` does not strip strikethrough syntax. The strikethrough filter runs on the items before `parseIdeaCandidate`, so for the registry key to match the idea must be in the registry with its `~~`-wrapped title. In practice the strikethrough filter fires first and excludes the item before the registry lookup, making the registry entry redundant for this particular idea — but having both filters is correct: the registry path handles ideas completed in a different build cycle from when they were struck through.
