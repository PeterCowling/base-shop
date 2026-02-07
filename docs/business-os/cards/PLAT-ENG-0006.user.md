---
Type: Card
Lane: Planned
Priority: P1
Owner: Pete
ID: PLAT-ENG-0006
Title: CI Test Parallelization Plan
Business: PLAT
Tags:
  - plan-migration
  - ci/infrastructure
Created: 2026-01-22T00:00:00.000Z
Updated: 2026-01-22T00:00:00.000Z
Status: Active
Last-updated: 2026-02-05
---
# CI Test Parallelization Plan

**Source:** Migrated from `ci-test-parallelization-plan.md`


# CI Test Parallelization Plan

## Background

This plan was extracted from the UI Package Split Plan (`docs/plans/ui-package-split-plan.md`), which was superseded by the UI Architecture Consolidation Plan. The consolidation plan achieved the architectural goals (single source of truth in `@acme/design-system`) via a shim-based approach rather than mass import rewrites.

The original split plan's motivation included CI parallelization (running tests for `@acme/design-system`, `@acme/cms-ui`, and `@acme/ui` in parallel). This goal was not achieved by the consolidation plan and is worth evaluating independently.

## Current State

### Package Structure (achieved)
- `@acme/design-system`: 305 source files, 66 test files
- `@acme/cms-ui`: 1102 source files, 239 test files
- `@acme/ui`: 2247 source files, 489 test files

### CI Structure (current)
- Single `test` job runs `pnpm test:affected`
- Tests run sequentially, not parallelized by package
- Timeout: 20 minutes

[... see full plan in docs/plans/ci-test-parallelization-plan.md]
