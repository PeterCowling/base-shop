---
Type: Plan
Status: Active
Domain: Theming
Last-reviewed: 2026-01-17
Relates-to charter: docs/theming-charter.md
Created: 2026-01-17
Created-by: Codex
Last-updated: 2026-01-17
Last-updated-by: Codex
---

# Theming Audit Plan — 2026-01

Audit the theming system against documented expectations and against plan commitments that should already be implemented. The output is a written audit with evidence and follow-up tasks.

## Scope

- Docs: `docs/theming.md`, `docs/theming-advanced.md`, `docs/theme-editor-tokens.md`, `docs/theme-lifecycle-and-library.md`, `docs/typography-and-color.md`, `docs/palette.md`, `docs/design-system-handbook.md`, `docs/theming-plan.md`.
- Plans that imply theming deliverables: `docs/cms/shop-build-plan.md`, `docs/cms/shop-build-gap-analysis.md`, `docs/cms/shop-build-journey-map.md`, and any active plan entries that reference theming in `IMPLEMENTATION_PLAN.md`.
- Code entrypoints: `packages/themes/**`, `packages/design-tokens/**`, `packages/ui/src/components/ThemeStyle.tsx`, `packages/platform-core/src/utils/initTheme.ts`, `apps/cms/src/app/cms/shop/[shop]/themes/**`, `apps/cms/src/actions/shops.server.ts`, configurator preview (`apps/cms/src/app/cms/configurator/**`).

## Active tasks

- **THEME-AUDIT-01 — Build doc requirements checklist**
  - Status: ☐
  - Scope:
    - Extract expected behaviours and invariants from theming guides and charter.
    - Capture required UI behaviours (Theme Editor selection, presets, reset, inspect mode, preview syncing, font loading, dark mode override).
  - Dependencies:
    - `docs/theming-charter.md`, `docs/theming.md`, `docs/theme-editor-tokens.md`, `docs/typography-and-color.md`.
  - Definition of done:
    - A checklist of requirements with doc citations and intended code locations exists in the audit draft.

- **THEME-AUDIT-02 — Compile “should already be implemented” commitments**
  - Status: ☐
  - Scope:
    - Review theming-related plan items (THEME-01..03 in `docs/theming-plan.md` and CMS shop-build plan/gap analysis expectations).
    - Distill concrete commitments that imply implementation should exist now.
  - Dependencies:
    - `docs/theming-plan.md`, `docs/cms/shop-build-plan.md`, `docs/cms/shop-build-gap-analysis.md`, `docs/cms/shop-build-journey-map.md`.
  - Definition of done:
    - A commitments list mapped to specific plan IDs and expected code locations exists in the audit draft.

- **THEME-AUDIT-03 — Verify implementation against docs and plans**
  - Status: ☐
  - Scope:
    - Inspect Theme Editor and configurator preview flows against documented behaviour.
    - Verify token catalogs, Tailwind integration, ThemeStyle injection, and dark mode init match documentation.
    - Validate that documented `data-token` mappings exist in UI components.
  - Dependencies:
    - THEME-AUDIT-01, THEME-AUDIT-02.
  - Definition of done:
    - Each checklist item is marked as implemented, missing, or mismatched with evidence paths and notes.

- **THEME-AUDIT-04 — Publish audit report and follow-ups**
  - Status: ☐
  - Scope:
    - Write `docs/theming-audit-2026-01.md` with findings, evidence, and remediation items.
    - Update `docs/theming-plan.md` or create follow-up tasks for gaps.
  - Dependencies:
    - THEME-AUDIT-03.
  - Definition of done:
    - Audit report exists with prioritized findings and linked follow-up tasks.

## Completed / historical

- None yet.
