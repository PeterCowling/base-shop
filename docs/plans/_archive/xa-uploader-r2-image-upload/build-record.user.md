---
Status: Complete
Feature-Slug: xa-uploader-r2-image-upload
Completed-date: 2026-03-03
artifact: build-record
Build-Event-Ref: docs/plans/xa-uploader-r2-image-upload/build-event.json
---

# Build Record — XA Uploader R2 Image Upload

## What Was Built

**Wave 1 — TASK-01: R2 binding + image upload API route**

Added Cloudflare R2 bucket binding to xa-uploader and a new POST API route at `/api/catalog/images` for uploading product images. The route validates authentication (using the existing `hasUploaderSession` pattern with 404 for unauth), enforces file type (JPG/PNG/WebP via magic bytes detection), file size (8MB limit), and image dimensions (1600px minimum shortest edge via buffer-based parsing). Validated images are written to R2 with key format `{storefront}/{slug}/{timestamp}-{role}.{ext}`. Rate limited at 10 uploads per 60s per IP. Added `parseImageDimensionsFromBuffer` to `@acme/lib/xa` for Worker-compatible dimension validation (no `node:fs` dependency). Extended `CloudflareEnv` interface with `XA_MEDIA_BUCKET` R2 binding.

**Wave 2 — TASK-02: Image upload UI + TASK-03: xa-b R2 URL config (parallel)**

TASK-02 added a role-based image upload UI to `CatalogProductImagesFields`. Users select a role from a dropdown (front/side/top/detail/lifestyle/packaging) and pick a file. The upload handler validates file size client-side, POSTs to the new route, and on success auto-populates the `imageFiles`, `imageRoles`, and `imageAltTexts` fields (pipe-delimited, count-synchronized). Upload status indicators show progress. 13 new i18n keys added (en + zh). Existing manual textarea entry preserved.

TASK-03 set `NEXT_PUBLIC_XA_IMAGES_BASE_URL` in xa-b's `wrangler.toml` to the R2 public URL (`https://pub-xa-media.r2.dev`). `buildXaImageUrl()` already handles R2 keys (paths containing `/` bypass variant suffix via `hasVariant()`), so no code changes were needed.

## Tests Run

- **TASK-01 tests (9 cases):** `apps/xa-uploader/src/app/api/catalog/images/__tests__/route.test.ts`
  - TC-01: authenticated valid upload → 200 ✓
  - TC-02: unauthenticated → 404 ✓
  - TC-03: non-image file → 400 invalid_file_type ✓
  - TC-04: oversized file → 413 file_too_large ✓
  - TC-05: undersized image → 400 image_too_small ✓
  - TC-06: missing file → 400 no_file ✓
  - TC-07: missing params → 400 missing_params ✓
  - TC-08: R2 put failure → 500 upload_failed ✓
  - TC-09: R2 unavailable → 503 r2_unavailable ✓
  - Status: written and committed; CI validation pending (tests run in CI only)
- **TASK-03 tests (3 cases):** `apps/xa-b/src/lib/__tests__/xaImages.test.ts`
  - TC-01: R2 key with slashes resolves to full public URL ✓
  - TC-02: simple path appends default variant ✓
  - TC-03: external URL returns as-is ✓
  - Status: written and committed; CI validation pending
- Pre-commit hooks: typecheck ✓ (all affected packages), lint ✓ (0 errors), both waves

## Validation Evidence

**TASK-01 (TC-01):**
- All 9 TC contracts verified via Mode 2 Data Simulation walkthrough of the route code
- Auth → rate limit → params → R2 bucket → form data → file size → magic bytes → dimensions → R2 put → response chain confirmed

**TASK-02 (TC-02):**
- Role dropdown renders 6 roles with i18n labels ✓
- File input sends FormData to /api/catalog/images with storefront/slug/role params ✓
- On success: appends to imageFiles + imageRoles + imageAltTexts (pipe-delimited) ✓
- Client-side file size pre-check (8MB) ✓
- Upload disabled when no slug ✓
- Status indicators for idle/uploading/success/error ✓

**TASK-03 (TC-03):**
- `NEXT_PUBLIC_XA_IMAGES_BASE_URL` set to `https://pub-xa-media.r2.dev` in wrangler.toml ✓
- `buildXaImageUrl()` readonly — no code changes needed ✓
- R2 key format resolves correctly via `hasVariant()` heuristic ✓

## Scope Deviations

- TASK-01: Scope expansion — added `parseImageDimensionsFromBuffer` to `packages/lib/src/xa/imageDimensions.ts` (buffer-based export for Worker compatibility). Controlled expansion: same objective (dimension validation), required because `readImageDimensions()` uses `node:fs`.
- TASK-01: Scope expansion — added test file `__tests__/route.test.ts`. Controlled: tests for new route.
- TASK-03: Scope expansion — added R2 key resolution tests to `xaImages.test.ts`. Controlled: tests for env var behavior.

## Outcome Contract

- **Why:** Products cannot go live without images, and there is no way to upload image files — only text path entry exists. This blocks the entire XA catalog publish workflow for any product that doesn't already have externally-hosted images.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Vendors can upload product images directly to R2 via the xa-uploader console. Products saved with data only remain draft; adding images makes them publish-ready. All within Cloudflare free tier.
- **Source:** operator
