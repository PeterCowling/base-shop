---
Type: Card
Lane: In progress
Priority: P0
Owner: Pete
ID: PLAT-ENG-0018
Title: Test Typechecking Plan
Business: PLAT
Tags:
  - plan-migration
  - testing
Created: 2026-01-18T00:00:00.000Z
Updated: 2026-01-18T00:00:00.000Z
Status: Active
Last-updated: 2026-02-05
---
# Test Typechecking Plan

**Source:** Migrated from `test-typechecking-plan.md`


# Test Typechecking Plan

## Problem Statement

Test files (`.test.ts`, `.spec.ts`, `__tests__/**`) are excluded from the main `tsconfig.json` files across the monorepo. This creates two distinct problems:

1. **Editor UX**: VS Code doesn't typecheck test files because it uses `tsconfig.json` by default
2. **CI/CLI Typechecking**: Running `tsc -p tsconfig.test.json` fails due to architecture issues

## Progress Updates

### 2026-01-18

- Aligned test typecheck config `rootDir`/`include` to workspace sources to clear TS6059/TS6307 (see repo changes).
- Running targeted package checks with `TYPECHECK_FILTER=packages/ui node scripts/typecheck-tests.mjs`.
- Current focus: clearing remaining `packages/ui` test type errors (module aliases, strict prop typing in fixtures, and page-builder test scaffolding).

## Current State (Verified 2026-01-18)


[... see full plan in docs/plans/test-typechecking-plan.md]
