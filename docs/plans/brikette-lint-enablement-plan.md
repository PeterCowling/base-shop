---
Type: Implementation
Status: Proposed
Domain: Repo
Last-reviewed: 2026-01-24
Relates-to: apps/brikette lint enablement
---

## Summary

Re‑enable automated linting for `@apps/brikette` by addressing the current blocker list (imports, DS-rule violations, project service coverage, hardcoded copy, and overly complex helpers). The goal is to bring the app in line with `eslint.config.mjs`’s expectations so the existing `pnpm lint` command can be turned back on without failing. This effort is scoped to the Brikette app, but it may require touching shared translation/localization assets and design-system primitives.

## Tasks

1. Audit and patch the TypeScript/ESLint project configuration so all source, mock, and helper files under `apps/brikette` are included, eliminating the “project service could not find file” errors.
2. Run `eslint --fix` for import sorting and clean up simple violations across `src`/`test`. Keep fixes modular so reviewers can verify them (e.g., per directory chunk).
3. Start remediating rule violations that currently fail lint:
   - Convert `@acme/ui/atoms` imports to the new `@acme/design-system/primitives` (or equivalent safe APIs) where the rule shows restrictions.
   - Replace hardcoded strings, z-index, spacing, and layout classes with DS tokenized equivalents or move them into `packages/i18n` keys.
   - Refactor excessively long/complex functions (e.g., `BarMenuContent`, `BreakfastMenuContent`, `routeHead`, `ensureGuideContent`) to reduce `complexity` and `max-lines-per-function` counts.
4. Add localized keys where required and wire Brikette’s components up to the shared translation files so `ds/no-hardcoded-copy` passes.
5. After the above, remove the `apps/brikette/**` ignore entry from `eslint.config.mjs` (if still present) and re-enable the `lint` script in `apps/brikette/package.json`.

## Acceptance criteria

- `pnpm --filter @apps/brikette exec eslint src` completes with zero errors/warnings.
- `pnpm --filter @apps/brikette run lint` (the package-local script) passes inside the monorepo lint sweep.
- All previously ignored `apps/brikette` files are part of TypeScript’s `include` so ESLint’s project service doesn’t warn.
- Tokenization/localization changes are reviewed and have corresponsing entries in `packages/i18n`.

## Risks & Mitigations

- **Risk:** The DS/copied-text rules are numerous, so fixing them one-by-one could take multiple passes. _Mitigation:_ Focus initial work on import sorting, config fixes, and gradually handle copy/layout violations while logging progress in this plan.
- **Risk:** Refactoring large files may introduce regressions. _Mitigation:_ Keep changes small and use localized helper components (and unit tests when necessary); run targeted tests for modified files.

