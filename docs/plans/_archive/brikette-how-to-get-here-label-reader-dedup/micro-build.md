# Micro-Build: brikette-how-to-get-here-label-reader-dedup

**Dispatch:** IDEA-DISPATCH-20260311100001-3101
**Business:** BRIK
**Status:** In Progress
**Last-updated:** 2026-03-11

## Summary

Extract `createGuideLabelReader` and `buildBreadcrumb` from 4 copy-pasted how-to-get-here
route modules into a shared factory and re-export.

## Scope

**Routes in scope:**
- `apps/brikette/src/routes/how-to-get-here/briketteToFerryDock/`
- `apps/brikette/src/routes/how-to-get-here/ferryDockToBrikette/`
- `apps/brikette/src/routes/how-to-get-here/chiesaNuovaArrivals/`
- `apps/brikette/src/routes/how-to-get-here/chiesaNuovaDepartures/`

**New shared module:**
- `apps/brikette/src/routes/how-to-get-here/_shared/guideLabelReaderFactory.ts`
- `apps/brikette/src/routes/how-to-get-here/_shared/buildBreadcrumb.ts`

## Tasks

- [x] Create `_shared/guideLabelReaderFactory.ts` — factory parameterised by `guideKey`
- [x] Create `_shared/buildBreadcrumb.ts` — canonical breadcrumb builder
- [x] Update 4 `labels.ts` call sites to use factory
- [x] Update 4 `breadcrumb.ts` call sites to re-export from shared
- [x] Typecheck passes

## Validation

`pnpm --filter brikette typecheck` passes with 0 errors. No functional change.

## Outcome Contract

- **Why:** Eliminate 4 identical function bodies that only differ by `GUIDE_KEY` reference.
- **Intended Outcome Type:** code_quality
- **Intended Outcome Statement:** Single canonical implementation replaces 4 duplicates; future guide routes can call the factory instead of copy-pasting.
- **Source:** IDEA-DISPATCH-20260311100001-3101 (micro_build_ready, simplify session)
