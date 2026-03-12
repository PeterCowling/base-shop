# Build Record — brikette-how-to-get-here-label-reader-dedup

**Date:** 2026-03-11
**Business:** BRIK
**Plan slug:** brikette-how-to-get-here-label-reader-dedup
**Dispatch:** IDEA-DISPATCH-20260311100001-3101

## Summary

Extracted `createGuideLabelReader` and `buildBreadcrumb` from 4 copy-pasted
how-to-get-here route modules into shared canonical implementations.

**Shared factory** (`_shared/guideLabelReaderFactory.ts`):
- `createGuideLabelReaderFactory(guideKey, getGuidesFallbackTranslator, tocLabelKeyMap)`
- Returns `createGuideLabelReader(context, fallbackLabels)` with identical behaviour to the 4 originals.

**Shared breadcrumb** (`_shared/buildBreadcrumb.ts`):
- Single canonical implementation for the "how-to-get-here → guide" breadcrumb chain.

**4 route modules updated** (labels.ts + breadcrumb.ts each):
- `briketteToFerryDock` — 3-line wrapper replacing 37-line function
- `ferryDockToBrikette` — 3-line wrapper replacing 37-line function
- `chiesaNuovaArrivals` — 3-line wrapper replacing 37-line function
- `chiesaNuovaDepartures` — 3-line wrapper replacing 37-line function

Note: `chiesaNuovaDepartures/breadcrumb.ts` was already a re-export (from `../chiesaNuovaArrivals`); updated to re-export from `_shared/buildBreadcrumb` instead.

**Validation:** `pnpm --filter brikette typecheck` passes 0 errors. ESLint passes 0 errors. Commit `f1e7559e85` on branch `dev`.

## Outcome Contract

- **Why:** Four identical function bodies (differing only by GUIDE_KEY) were duplicated. Any future change to the label resolution or breadcrumb logic required updating 4 files. Now there is one.
- **Intended Outcome Type:** code_quality
- **Intended Outcome Statement:** Single canonical implementation replaces 4 duplicates; future guide routes call the factory with their own GUIDE_KEY.
- **Source:** IDEA-DISPATCH-20260311100001-3101 (micro_build_ready, from simplify session)
