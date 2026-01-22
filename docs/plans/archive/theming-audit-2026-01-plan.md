---
Type: Plan
Status: Superseded
Domain: Theming
Last-reviewed: 2026-01-22
Relates-to charter: docs/theming-charter.md
Created: 2026-01-17
Created-by: Codex
Last-updated: 2026-01-22
Last-updated-by: Claude Opus 4.5
Superseded-by: docs/plans/design-system-plan.md
---

# Theming Audit Plan — 2026-01 (SUPERSEDED)

> **⚠️ This plan has been superseded by the [Design System Plan](design-system-plan.md).**
>
> The theming verification tasks (THEME-AUDIT-01 through 04) have been consolidated into Phase 0 of the Design System Plan as DS-VER-01 through DS-VER-04.
>
> The audit checklist document (`docs/theming-audit-2026-01.md`) remains as a working artifact.

---

*Original content preserved below for reference.*

---

Audit the theming system against documented expectations and against plan commitments that should already be implemented. The output is a written audit with evidence and follow-up tasks.

> **Related Work**: The [UI Architecture Consolidation Plan](archive/ui-architecture-consolidation-plan.md) (Complete) implemented token validation infrastructure:
> - `pnpm validate:tokens` script validates required tokens for base themes
> - Token validation runs in CI (`.github/workflows/ci.yml`)
> - This partially addresses THEME-03 (automated guardrails) and checklist items #11-12 (token sources)

## Scope

- Docs: `docs/theming.md`, `docs/theming-advanced.md`, `docs/theme-editor-tokens.md`, `docs/theme-lifecycle-and-library.md`, `docs/typography-and-color.md`, `docs/palette.md`, `docs/design-system-handbook.md`, `docs/theming-plan.md`.
- Plans that imply theming deliverables: `docs/cms/shop-build-plan.md`, `docs/cms/shop-build-gap-analysis.md`, `docs/cms/shop-build-journey-map.md`, and any active plan entries that reference theming in `IMPLEMENTATION_PLAN.md`.
- Code entrypoints: `packages/themes/**`, `packages/design-tokens/**`, `packages/ui/src/components/ThemeStyle.tsx`, `packages/platform-core/src/utils/initTheme.ts`, `apps/cms/src/app/cms/shop/[shop]/themes/**`, `apps/cms/src/actions/shops.server.ts`, configurator preview (`apps/cms/src/app/cms/configurator/**`).

## Existing Artifacts

- **Audit draft**: `docs/theming-audit-2026-01.md` — Contains 18 documented requirements checklist and 7 plan commitment items (all unverified)
- **Token-component matrix**: `docs/theming-token-component-matrix.md` — Maps tokens to components with `data-token` attributes
- **Token validation**: `scripts/src/validate-tokens.ts` — Validates theme packages have required CSS custom properties

## Active tasks

- **THEME-AUDIT-01 — Build doc requirements checklist**
  - Status: ✅ Complete
  - Result: 18 documented requirements captured in `docs/theming-audit-2026-01.md` (items 1-18)
  - Each item includes source doc and intended code location

- **THEME-AUDIT-02 — Compile "should already be implemented" commitments**
  - Status: ✅ Complete
  - Result: 7 plan commitments captured in `docs/theming-audit-2026-01.md`:
    - THEME-01, THEME-02, THEME-03 from `docs/theming-plan.md`
    - CMS-BUILD-02, CMS-BUILD-06, CMS-BUILD-09 from `docs/cms/shop-build-plan.md`
    - Journey map steps from `docs/cms/shop-build-journey-map.md`

- **THEME-AUDIT-03 — Verify implementation against docs and plans**
  - Status: ☐ Not started
  - Scope:
    - Inspect Theme Editor and configurator preview flows against documented behaviour.
    - Verify token catalogs, Tailwind integration, ThemeStyle injection, and dark mode init match documentation.
    - Validate that documented `data-token` mappings exist in UI components.
  - Partial coverage from consolidation plan:
    - ✅ Token validation (`pnpm validate:tokens`) covers items #11, #12
    - ✅ Token-component matrix exists (`docs/theming-token-component-matrix.md`) for item #14
  - Remaining verification needed:
    - Items #1-10: Theme Editor UI behaviors, preview sync, dark mode
    - Items #13, #15-18: Tailwind integration, fonts panel, CLI flags
    - All 7 plan commitments: Need evidence review
  - Dependencies:
    - THEME-AUDIT-01, THEME-AUDIT-02.
  - Definition of done:
    - Each checklist item is marked as implemented, missing, or mismatched with evidence paths and notes.

- **THEME-AUDIT-04 — Publish audit report and follow-ups**
  - Status: ☐ Blocked by THEME-AUDIT-03
  - Scope:
    - Update `docs/theming-audit-2026-01.md` with verification findings and evidence.
    - Update `docs/theming-plan.md` or create follow-up tasks for gaps.
  - Dependencies:
    - THEME-AUDIT-03.
  - Definition of done:
    - Audit report updated with verification status for all 18 items + 7 commitments.
    - Remediation tasks created for gaps.

## Completed / historical

- **THEME-AUDIT-01**: Complete (2026-01-17) — Checklist built in audit draft
- **THEME-AUDIT-02**: Complete (2026-01-17) — Commitments compiled in audit draft
