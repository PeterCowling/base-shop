---
Type: Plan
Status: Complete
Domain: UI
Workstream: Engineering
Created: 2026-02-23
Last-reviewed: 2026-02-23
Last-updated: 2026-02-23
Relates-to charter: docs/theming-charter.md
Feature-Slug: ui-theme-toggle-lint-remediation
Deliverable-Type: code-change
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Overall-confidence: 90%
---

# UI ThemeToggle Lint Remediation Plan

## Summary
Addressed pre-existing lint failures in `packages/ui/src/molecules/ThemeToggle.tsx` so `pnpm --filter @acme/ui lint` passes without scoped exceptions. The original failures were import ordering (`simple-import-sort/imports`) and raw color usage (`ds/no-raw-color`).

## Active tasks
- [x] TASK-01: Inventory and classify `ThemeToggle` lint violations
- [x] TASK-02: Replace raw color literals with semantic design tokens and fix import order
- [x] TASK-03: Validate with full `@acme/ui` lint + typecheck and add/adjust tests if behavior changes

## Scope
- In scope:
  - `packages/ui/src/molecules/ThemeToggle.tsx`
  - Any directly-required token source updates if missing semantic token coverage
  - Targeted tests for ThemeToggle behavior/styling contracts (if needed)
- Out of scope:
  - Broad raw-color migration beyond ThemeToggle
  - Unrelated lint debt in other UI molecules/organisms

## Acceptance criteria
- `pnpm --filter @acme/ui lint` passes with no ThemeToggle violations. (validated 2026-02-23)
- `pnpm --filter @acme/ui typecheck` passes. (validated 2026-02-23)
- Theme toggle behavior and visual intent are preserved across light/dark modes.

## Risks
- Risk: token substitution changes visual contrast or mood.
  - Mitigation: use existing semantic tokens first; if missing, add minimal tokenized extension with contrast checks.
- Risk: lint pass uncovers adjacent debt in same package.
  - Mitigation: treat adjacent findings as separate follow-up unless strictly required to unblock ThemeToggle lint.

## Resolution
- File updated: `packages/ui/src/molecules/ThemeToggle.tsx`
  - Replaced raw hex colors with semantic token-driven values.
  - Fixed import ordering to satisfy `simple-import-sort`.
- Validation:
  - `pnpm exec eslint src/molecules/ThemeToggle.tsx` (pass)
  - `pnpm --filter @acme/ui lint` (pass)
- Trigger source: lint failure observed during brik color-token consolidation validation on 2026-02-23.
