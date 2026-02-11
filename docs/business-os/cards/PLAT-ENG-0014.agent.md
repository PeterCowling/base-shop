---
Type: Card
Lane: Planned
Priority: P1
Owner: Pete
ID: PLAT-ENG-0014
Title: Postbuild Script tsx Runtime Resolution Fix - Plan
Business: PLAT
Tags:
  - plan-migration
  - build
Created: 2026-01-30T00:00:00.000Z
Updated: 2026-01-30 (BUILD-04 complete)
Status: Active
Last-updated: 2026-02-05
---
# Postbuild Script tsx Runtime Resolution Fix - Plan

**Source:** Migrated from `postbuild-tsx-esm-fix-plan.md`


# Postbuild Script tsx Runtime Resolution Fix - Plan

## Summary

Fix `apps/brikette` build `postbuild` failures by preventing `tsx` runtime module resolution from resolving workspace packages to `.d.ts` files via TypeScript `paths`.

The issue occurs when running `apps/brikette/scripts/generate-public-seo.ts` via `tsx` from within `apps/brikette/`, causing `@acme/guides-core` to resolve to an empty runtime module (`dist/index.d.ts`) instead of the actual implementation.

## Active tasks

- **BUILD-01:** Add a scripts-specific tsconfig with runtime-safe `paths`
- **BUILD-02:** Wire `postbuild` to use `tsx --tsconfig tsconfig.scripts.json`
- **BUILD-03:** (Optional hardening) Apply scripts tsconfig to other brikette `tsx` scripts after auditing transitive imports
- **BUILD-04:** Add a regression check for the `.d.ts` runtime-resolution class of failures

## Goals

- `cd apps/brikette && pnpm run postbuild` exits 0
- `pnpm --filter @apps/brikette build` completes (including postbuild)

[... see full plan in docs/plans/postbuild-tsx-esm-fix-plan.md]
