# Results Review: reception-rounded-lg-lint-rule

**Completed:** 2026-02-26
**Plan:** docs/plans/reception-rounded-lg-lint-rule/plan.md

## Intended Outcome Check

**Goal:** ESLint rule `ds/no-bare-rounded` added to the plugin and enabled for `apps/reception/src/**`. Zero bare-`rounded` violations remain. Rule runs in CI.

**Delivered:** Yes — rule in place, 0 violations, CI gate active.

## Observed Outcomes

- Added `ds/no-bare-rounded` rule to `@acme/eslint-plugin-ds` with auto-fix and 11 passing RuleTester tests
- Fixed all bare `rounded` violations: auto-fix handled ~100 instances across 40 files; 12 template-literal cases required manual replacement
- Rule enabled at `error` level in `eslint.config.mjs` LINT-01 reception block
- Typecheck and lint pass clean
- `rounded-full` (8 pill/circular shape instances) confirmed unchanged
- Snapshot files (`.snap`) contain some `rounded` in rendered HTML output — these are from DS component internals and not covered by the lint rule scope (`.{ts,tsx}` only)

## Standing Updates

- `packages/eslint-plugin-ds` now has a `no-bare-rounded` rule. Registration pattern and test setup are confirmed and documented.
- Reception app's `eslint.config.mjs` LINT-01 block now has 8 active DS rules at `error` level.
- Snapshot files may show stale `rounded` in rendered output; these will update naturally when tests regenerate snapshots.

## New Idea Candidates

- **New open-source package:** None identified.
- **New skill:** None — this was a standard `lp-do-build` code-change flow.
- **New loop process:** None identified.
- **New standing data source:** None identified.
- **AI-to-mechanistic:** The `extractFromJsxAttribute` utility correctly handles most cases but returns `confident: false` for template literals with interpolations. A future improvement could expand confidence for template literals where the bare class token is always in the static portion.
