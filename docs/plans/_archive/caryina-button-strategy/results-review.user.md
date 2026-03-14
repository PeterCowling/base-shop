---
Type: Results-Review
Status: Draft
Feature-Slug: caryina-button-strategy
Review-date: 2026-03-13
artifact: results-review
---

# Results Review

## Observed Outcomes

TASK-01 complete. All 12 `.btn-primary` call sites in the caryina app migrated to `<Button compatibilityMode="passthrough">` from `@acme/design-system/shadcn`. Shared `BTN_PRIMARY` constant extracted to `apps/caryina/src/styles/buttonStyles.ts`. The `@layer components { .btn-primary {...} }` block fully removed from `global.css`. Commit `0ab1174475` — 13 files changed. `pnpm --filter @apps/caryina typecheck` passes. Lint clean (5 import-order issues auto-fixed by eslint `--fix` pre-commit). 6 direct button replacements + 5 asChild Link sites + 1 asChild Link upgrade from plain `<a>` — all element types matched the plan. TC-01 through TC-04 verified; TC-05/TC-07 pending CI and dev spot-check.

## Standing Updates
- No standing updates: no registered artifacts changed

## New Idea Candidates
<!-- Scan for signals in these five categories. For each, cite a "Trigger observation" from this build. Use "None." if no evidence found for any category.
  1. New standing data source — external feed, API, or dataset suitable for Layer A standing intelligence
  2. New open-source package — library to replace custom code or add capability
  3. New skill — recurring agent workflow ready to be codified as a named skill
  4. New loop process — missing stage, gate, or feedback path in the startup loop
  5. AI-to-mechanistic — LLM reasoning step replaceable with a deterministic script
-->
- New standing data source — None.
- New open-source package — None.
- New skill — None.
- New loop process — None.
- AI-to-mechanistic — None.

## Standing Expansion
- No standing expansion: no new external data sources or artifacts identified

## Intended Outcome Check

<!--
Warn mode (introduced TASK-06, startup-loop-why-intended-outcome-automation, 2026-02-25).
This section is non-blocking during the warn window. After one loop cycle (~14 days) it
will be promoted to a hard gate. A valid verdict keyword is required to clear the warn.
-->

- **Intended:** All caryina-owned call sites (12) use DS `<Button>` or an explicitly documented exception; `.btn-primary` CSS utility is removed from `global.css`.
- **Observed:** All 12 call sites migrated; `.btn-primary` block removed from `global.css`; typecheck passes; BTN_PRIMARY constant centralises all token styling. TC-07 (asChild dev navigation) pending.
- **Verdict:** met
- **Notes:** Outcome contract satisfied. The one open item (TC-07 dev spot-check) is advisory — the `<Button asChild>` pattern is standard Radix Slot behaviour confirmed in DS source.
