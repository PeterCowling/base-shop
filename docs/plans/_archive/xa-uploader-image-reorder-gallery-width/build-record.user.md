# Build Record — XA Uploader Image Reorder + Gallery Width

**Plan slug:** xa-uploader-image-reorder-gallery-width
**Completed:** 2026-03-06
**Business:** XA

## Outcome Contract

- **Why:** The xa-uploader image step had no way to reorder images after upload — operators were forced to delete and re-upload to change sequence — and the gallery was constrained to a narrow column that wasted desktop viewport width.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Operators can reorder images using up/down controls in the images step, with order persisted automatically through autosave; the gallery renders at full width with more columns visible per row on desktop.
- **Source:** auto

## What Was Delivered

Three changes to `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx` and one new test file:

1. **Image reorder controls (TASK-01):** Added `reorderPipeEntry` exported utility that swaps adjacent entries in pipe-separated strings with out-of-bounds guard. Added `handleReorderImage` handler in `useImageUploadController` that reorders `imageFiles`, `imageRoles`, and `imageAltTexts` in lockstep and triggers autosave via `onChange` + `onImageUploaded` (same pattern as `handleRemoveImage`). Added per-card up/down buttons in `ImageGallery` using `BTN_SECONDARY_CLASS` with `min-h-11 min-w-11` touch targets; up button disabled at first image, down button disabled at last image.

2. **Full-width gallery layout (TASK-02):** Removed `max-w-prose mx-auto` from the outer wrapper div (replaced with `w-full`); removed the stale `ds/container-widths-only-at` eslint disable comment. Widened the thumbnail grid from `sm:grid-cols-3` to `md:grid-cols-4 lg:grid-cols-5`.

3. **Unit tests (TASK-03):** New test file `apps/xa-uploader/src/components/catalog/__tests__/CatalogProductImagesFields.test.ts` with 10 test cases covering `reorderPipeEntry` boundary conditions (TC-07 through TC-12 plus move-first-down, move-last-up, whitespace trim).

## Commits

- `132b9fdce7` — feat(xa-uploader): add image reorder controls and full-width gallery (TASK-01 + TASK-02)
- `50ade8dfc5` — test(xa-uploader): add unit tests for reorderPipeEntry utility (TASK-03)

## Validation

- Typecheck: pass (`pnpm --filter @apps/xa-uploader typecheck`)
- Lint: pass (`pnpm --filter @apps/xa-uploader lint`)
- Pre-commit hooks: pass (lint-staged + typecheck-staged + validate-agent-context)
- Unit tests: pending CI run (never run locally per policy)

## Files Changed

- `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx` — modified (84 insertions, 14 deletions)
- `apps/xa-uploader/src/components/catalog/__tests__/CatalogProductImagesFields.test.ts` — created (45 lines)
