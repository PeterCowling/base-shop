Type: Plan
Status: Active
Domain: Theming
Last-reviewed: 2025-12-02
Relates-to charter: docs/theming-charter.md

# Theming Plan — Tokens, Themes, and CMS Editor

This plan tracks work around tokens, base themes, and the CMS Theme Editor.

## Active tasks

- **THEME-01 — Verify token contracts across themes and UI**
  - Status: ☐
  - Scope:
    - Cross-check `packages/themes/base/src/tokens.ts` and derived CSS against usage in `packages/ui` and tenant apps.
    - Confirm that all token names referenced in UI components are present in the base theme and documented in `docs/palette.md` / `docs/typography-and-color.md`.
  - Dependencies:
    - `docs/theming-charter.md`, `docs/theming.md`, and `docs/theme-editor-tokens.md` Canonical/Active.
  - Definition of done:
    - A small matrix exists mapping tokens → components, and any missing tokens or docs are captured as follow-up tasks.

- **THEME-02 — Align Theme Editor with charter**
  - Status: ☐
  - Scope:
    - Review `apps/cms/src/app/cms/shop/[shop]/themes/**` against `docs/theming.md` and `docs/theming-advanced.md`.
    - Ensure behaviour (presets, brand intensity, contrast warnings, reset flows) is documented and matches implementation.
  - Dependencies:
    - THEME-01 (token clarity).
  - Definition of done:
    - The theming guides accurately describe Theme Editor behaviour; any implementation deltas are either fixed or explicitly noted.

- **THEME-03 — Performance and accessibility guardrails**
  - Status: ☐
  - Scope:
    - Use `docs/performance-budgets.md` and Lighthouse configs to set basic budgets for theme-heavy pages.
    - Confirm contrast and font usage rules in `docs/palette.md` / `docs/typography-and-color.md` are enforced via lint or tests where practical.
  - Dependencies:
    - THEME-01 (canonical token palette).
  - Definition of done:
    - Documented guidance for theme-related performance and accessibility exists, and at least one automated check references it.

## Completed / historical

- None yet.

