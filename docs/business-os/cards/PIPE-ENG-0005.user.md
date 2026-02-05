---
Type: Card
Lane: Planned
Priority: P1
Owner: Pete
ID: PIPE-ENG-0005
Title: XA app 80% coverage plan
Business: PIPE
Tags:
  - plan-migration
  - commerce
Created: 2026-01-15T00:00:00.000Z
Updated: 2026-01-15T00:00:00.000Z
Status: Active
Last-updated: 2026-02-05
---
# XA app 80% coverage plan

**Source:** Migrated from `xa-coverage-80-plan.md`


# XA app 80% coverage plan

## Context
The XA app currently has only a handful of unit/security tests, and the
monorepo Jest config explicitly relaxes coverage thresholds to 0 for
`apps/xa`. The goal is to reach a minimum of 80% coverage across lines,
branches, and functions for the XA app.

## Goals
- Enforce 80% global Jest coverage thresholds for `apps/xa`.
- Add meaningful unit and component tests that exercise core behavior.
- Keep tests deterministic, fast, and isolated (no network or heavy Next
  runtime assumptions).

## Non-goals
- End-to-end or Playwright coverage.
- Testing generated `.vercel/output` artifacts.
- Large-scale refactors unrelated to testability.


[... see full plan in docs/plans/xa-coverage-80-plan.md]
