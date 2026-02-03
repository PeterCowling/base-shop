---
Type: Card
Lane: In progress
Priority: P0
Owner: Pete
ID: PLAT-ENG-0007
Title: 'Plan: Re-enable linting for apps/cover-me-pretty'
Business: PLAT
Tags:
  - plan-migration
  - repo
Created: 2026-01-24T00:00:00.000Z
Updated: 2026-01-24T00:00:00.000Z
---
# Plan: Re-enable linting for apps/cover-me-pretty

**Source:** Migrated from `cover-me-pretty-lint-enablement-plan.md`


# Plan: Re-enable linting for apps/cover-me-pretty

## Summary
Cover-me-pretty is the runtime storefront we use for e2e smoke flows, but its package currently skips eslint via a global ignore and a dummy `lint` script (see `eslint.config.mjs` and `apps/cover-me-pretty/package.json`). The next step in hardening the runtime is to run lint for this app so CI and pre-commit hooks start flagging regressions. That requires:

1. removing the special-case ignore,
2. wiring a real `lint` script inside the package,
3. cleaning the code so eslint can parse it with the shared rules (NextRequest imports, forbidden console usage, etc.), and
4. adding a cover-me-pretty–specific override so the existing prototype code keeps a reasonable complexity/length budget without silencing other checks.

## Goals/Oucomes
- `pnpm --filter @apps/cover-me-pretty lint` (and therefore `pnpm lint` + turbo) runs without errors.
- Developers get lint feedback before `git push`, preventing regressions in this runtime app.
- We keep the relaxed DS/TS warnings we already had while still enforcing import sorting, type-only imports, and DS checks for new files.

## Constraints
- The app currently has some legitimate architectural complexity (long API handlers, TryOnPanel client component, streaming SSE handler). Rather than rewrite everything at once, focus on targeted code fixes (type imports, console usages, promise param, React event typing) plus a scoped override for complexity/length to keep lint fast.
- ESLint is configured via the flat config (`eslint.config.mjs`), so overrides must be added in the correct order (our new override should come after the global LINT-01 block and before the test overrides so it can raise the thresholds for both runtime and test files without accidentally overriding the test-specific rules).


[... see full plan in docs/plans/cover-me-pretty-lint-enablement-plan.md]
