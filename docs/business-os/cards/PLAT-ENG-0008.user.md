---
Type: Card
Lane: Done
Priority: P3
Owner: Pete
ID: PLAT-ENG-0008
Title: Coverage Caching Plan
Business: PLAT
Tags:
  - plan-migration
  - testing
Created: 2026-01-27T00:00:00.000Z
Updated: 2026-01-27T00:00:00.000Z
Status: Active
Last-updated: 2026-02-05
---
# Coverage Caching Plan

**Source:** Migrated from `coverage-caching-plan.md`


# Coverage Caching Plan

## Summary

Speed up the “Package Quality Matrix” workflow (`.github/workflows/test.yml`) by leveraging Turbo **remote cache** for the “tests with coverage” step. Today the workflow runs `pnpm --filter ... test -- --coverage --coverage-dir=coverage` for *every* workspace on every push to `main` (and nightly), even when a package’s inputs have not changed. By running the test step via Turbo and tightening cache invalidation inputs, unchanged packages can become fast cache hits while preserving existing behaviour: coverage artifacts are still produced and uploaded per workspace, and coverage thresholds remain enforced by each package’s Jest config.

## Success Signals (What “Good” Looks Like)

- In `test.yml`, unchanged workspaces show Turbo **cache hits** for the “test with coverage” step.
- Coverage artifacts still upload per workspace (same locations as today: `${{ matrix.workspace }}/coverage`).
- Coverage gating behaviour is unchanged (tests still fail when a package’s configured coverage threshold is violated).
- README/docs-only changes do **not** invalidate test coverage cache keys for unaffected packages.
- Changes to shared test/coverage configuration **do** invalidate caches (e.g. `packages/config/jest.preset.cjs`, `jest.coverage.cjs`).

## Goals

- Skip re-running “test with coverage” for packages whose relevant inputs haven’t changed.
- Reduce wall-clock time for `test.yml` (main push + nightly) without weakening quality gates.
- Keep current artifact output shape (per-workspace `coverage/` folder) so downstream tooling doesn’t need to change.

[... see full plan in docs/plans/coverage-caching-plan.md]
