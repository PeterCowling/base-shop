---
Type: Card
Lane: Done
Priority: P3
Owner: Pete
ID: PLAT-ENG-0019
Title: UI Lint Remediation Plan
Business: PLAT
Tags:
  - plan-migration
  - platform
Created: 2026-01-16T00:00:00.000Z
Updated: 2026-01-20T00:00:00.000Z
---
# UI Lint Remediation Plan

**Source:** Migrated from `ui-lint-remediation-plan.md`


# UI Lint Remediation Plan

## Problem Statement

> **Final Status 2026-01-20:** After UI-LINT-05, `@acme/ui` has **0 errors and 0 warnings** (100% reduction from original 1477).

## Goals
- Reduce `@acme/ui` lint warnings to a manageable level.
- Remove obsolete `eslint-disable` directives.
- Migrate hardcoded copy to i18n keys where appropriate.
- Keep changes scoped and reviewable, avoiding regressions in UI behavior.

## Non-Goals
- Broad UI redesigns or behavior changes unrelated to lint fixes.
- Zero-warning state in one pass (too large a scope). _(Achieved anyway!)_

## Milestones

- [x] ~~M1: Config parsing error resolved~~ _(Invalid - no tsup.config.ts exists)_

[... see full plan in docs/plans/ui-lint-remediation-plan.md]
