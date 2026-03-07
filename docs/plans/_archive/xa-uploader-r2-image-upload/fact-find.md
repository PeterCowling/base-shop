---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: API
Workstream: Engineering
Created: 2026-03-03
Last-updated: 2026-03-03
Feature-Slug: xa-uploader-r2-image-upload
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/xa-uploader-r2-image-upload/plan.md
Trigger-Why: Products cannot go live without images, and there is no way to upload image files — only text path entry exists.
Trigger-Intended-Outcome: type: operational | statement: Vendors can upload product images directly to R2 via the xa-uploader console within Cloudflare free tier | source: operator
Dispatch-ID: IDEA-DISPATCH-20260303220000-0144
---

# XA Uploader R2 Image Upload — Fact-Find Brief

## Scope

### Summary

The xa-uploader catalog console has no image upload capability. Product images are entered as text paths in pipe-delimited textareas. When those paths don't resolve to actual hosted files, xa-b renders broken images. A direct-to-R2 upload route via Worker binding will close this gap, allowing vendors to upload product photos from the console and have them served to xa-b at build time.

### Goals

- Add file upload UI to `CatalogProductImagesFields` for selecting and uploading product images
- Create a new API route (`/api/catalog/images`) that receives image files and writes them to R2
- Configure R2 bucket binding in `wrangler.toml`
- Set `NEXT_PUBLIC_XA_IMAGES_BASE_URL` to the R2 public URL so xa-b resolves images correctly
- Maintain the existing draft→published state machine: data-only = draft, images present = published

### Non-goals

- Image transformation/resizing (out of scope — images must meet 1600px min edge before upload)
- Presigned URL approach (rejected in favour of simpler Worker binding)
- CDN/caching layer (R2 public access with zero egress is sufficient)
- Changing the existing `imageFiles`/`imageRoles`/`imageAltTexts` schema format
- Image deletion from R2 (can be added later; not blocking for MVP)

### Constraints & Assumptions

- **HARD CONSTRAINT — Cloudflare free tier ONLY:** R2 free tier provides 10GB storage, 1M Class A writes/month, 10M Class B reads/month, zero egress. No paid plans, no external storage providers.
- **HARD CONSTRAINT — Separate data/image upload:** Product data can be saved without images (resulting in draft status). Adding images makes the product publish-ready. This maps to the existing `getCatalogDraftWorkflowReadiness()` → `hasImages` gate.
- **HARD CONSTRAINT — Approach:** Direct R2 upload via Worker route binding (Option A). Not presigned URLs, not S3 API.
- Assumption: Product images are typically 1-5MB each (JPG/PNG/WebP). Cloudflare Workers free tier allows 100MB request body — well within limits.
- Assumption: XA catalog will have fewer than 2,000 products × 7 images × 3MB average = ~42GB max. Exceeds 10GB free tier at full scale but current catalog is small enough. Flag for future.
- Assumption: xa-uploader deploys via OpenNext for Cloudflare (confirmed by `@opennextjs/cloudflare` import in `syncMutex.ts`).

## Outcome Contract

- **Why:** Products cannot go live without images, and there is no way to upload image files — only text path entry exists. This blocks the entire XA catalog publish workflow for any product that doesn't already have externally-hosted images.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Vendors can upload product images directly to R2 via the xa-uploader console. Products saved with data only remain draft; adding images makes them publish-ready. All within Cloudflare free tier.
- **Source:** operator

## Access Declarations

None — all evidence is in-repo. R2 bucket creation will use `wrangler r2 bucket create` (Cloudflare CLI, no external service access needed for investigation).

## Evidence Audit (Current State)

### Entry Points

- `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx` — image fields UI (text-only textareas for paths/roles/alt text)
- `apps/xa-uploader/src/app/api/catalog/products/route.ts` — products CRUD (JSON-only, 256KB max, no multipart)
- `apps/xa-uploader/src/app/api/catalog/sync/route.ts` — cloud sync pipeline (publishes catalog JSON referencing image paths, never uploads image binaries)
- `apps/xa-b/src/lib/xaImages.ts` — image URL resolution at xa-b build time

### Key Modules / Files

1. `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx` — text-only image path entry UI. Three textareas: imageFiles, imageRoles, imageAltTexts. Reads `NEXT_PUBLIC_XA_UPLOADER_MIN_IMAGE_EDGE` (default 1600).
2. `packages/lib/src/xa/catalogWorkflow.ts` — `getCatalogDraftWorkflowReadiness()` computes `hasImages = splitList(draft.imageFiles ?? "").length > 0`. Gates `isPublishReady = isDataReady && hasImages`. No changes needed.
3. `packages/lib/src/xa/catalogAdminSchema.ts` — schema validation: imageAltTexts count must match imageFiles count; imageRoles count must match; roles must be from `["front", "side", "top", "back", "detail", "interior", "scale"]`; category-specific required roles (bags: front+side+top).
4. `apps/xa-b/src/lib/xaImages.ts` — `buildXaImageUrl(path)`: if `NEXT_PUBLIC_XA_IMAGES_BASE_URL` set, returns `${base}/${normalizedPath}`; if path has no `/`, appends `/${DEFAULT_VARIANT}`. Already R2-ready — just set the env var.
5. `apps/xa-uploader/wrangler.toml` — has stub env vars (`NEXT_PUBLIC_XA_UPLOADER_R2_DESTINATION`, `NEXT_PUBLIC_XA_UPLOADER_R2_UPLOAD_URL`) but no `[[r2_buckets]]` binding. Already has `[[kv_namespaces]]` for `XA_UPLOADER_KV`.
6. `apps/xa-uploader/src/lib/syncMutex.ts` — demonstrates Worker binding access pattern: `getCloudflareContext({ async: true })` → `env.XA_UPLOADER_KV`. Same pattern for R2: `env.XA_MEDIA_BUCKET`.
7. `packages/lib/src/xa/imageDimensions.ts` — `readImageDimensions()` parses PNG/JPEG/WebP headers to extract width/height. Reads max 512KB of header. Available for server-side dimension validation.
8. `packages/lib/src/math/ops/media-constraints.ts` — `validateMinImageEdge()` checks shortest edge >= minEdgePx. Can validate before R2 write.
9. `apps/xa-uploader/src/lib/catalogDraftToContract.ts` — `buildMediaEntries()` normalizes image paths (strips leading `/`) and builds media index. Image keys from R2 must be compatible with this normalization.
10. `packages/platform-core/src/repositories/media.r2.server.ts` — existing R2 integration via S3-compatible API (aws4fetch). Uses access keys. NOT the approach for this feature (we use Worker binding instead), but demonstrates R2 integration patterns.

### Patterns & Conventions Observed

- **Worker binding access**: `getCloudflareContext({ async: true })` from `@opennextjs/cloudflare` — pattern established in `syncMutex.ts` for KV. Same pattern works for R2.
- **Rate limiting**: IP-based, in-memory, per-route. Pattern: `rateLimit(key, max, windowMs)` → `applyRateLimitHeaders()`. Products POST is 30/60s; images should be similar.
- **Auth guard**: `hasUploaderSession(request)` from `uploaderAuth.ts` — all catalog API routes check session authentication before proceeding.
- **Error response pattern**: `{ ok: false, error: "error_code", message?: "..." }` with appropriate HTTP status.
- **JSON body reading**: `readJsonBodyWithLimit()` utility. Image upload will need `request.formData()` or `request.arrayBuffer()` instead.
- **i18n pattern**: Keys defined in `uploaderI18n.ts` with en/zh translations. New upload-related keys follow existing pattern.

### Data & Contracts

- **Image path format**: Pipe/comma/newline-delimited strings in `imageFiles` field. Parsed by `splitList()` which splits on `/[|,\n]+/g`.
- **R2 key format**: Must contain `/` so `buildXaImageUrl` treats it as a full path (not appending variant). Recommended: `{storefront}/{slug}/{timestamp}-{role}.{ext}` (e.g., `xa-b/hermes-constance-18/1709510400-front.jpg`). The unix-timestamp prefix prevents key collision when re-uploading the same role — schema allows repeated roles and old uploads would silently overwrite without versioning. Previous R2 objects for the same slot are orphaned (acceptable for MVP; cleanup can be added later).
- **Image validation**: Schema requires imageRoles/imageAltTexts counts match imageFiles count. Category-specific required roles (bags: front+side+top; clothing: front+side; jewelry: front+side+detail).
- **Supported formats**: JPG, PNG, WebP (per `readImageDimensions()` — handles PNG 0x89 signature, JPEG 0xFF 0xD8, WebP RIFF+WEBP).
- **Dimension constraint**: Minimum 1600px on shortest edge (configurable via `NEXT_PUBLIC_XA_UPLOADER_MIN_IMAGE_EDGE`).
- **R2 public URL**: Set as `NEXT_PUBLIC_XA_IMAGES_BASE_URL` for xa-b. R2 public access is enabled per-bucket via Cloudflare dashboard (Settings → Public access → Enable) or via custom domain. Free tier supports public access.
- **CloudflareEnv interface**: Already extended for KV in `syncMutex.ts`. Must also declare R2 bucket type.

### Dependency & Impact Map

- **Upstream dependencies:**
  - Cloudflare R2 bucket (must be created via `wrangler r2 bucket create`)
  - R2 public access enabled on bucket (for xa-b to fetch images at build time)
  - OpenNext for Cloudflare runtime (already used, provides `getCloudflareContext`)
- **Downstream dependents:**
  - `xa-b` build process: reads `NEXT_PUBLIC_XA_IMAGES_BASE_URL` + image paths from catalog JSON
  - Cloud sync pipeline: references image paths in `catalog.media.json` — paths must match R2 keys
  - `buildXaImageUrl()`: resolves final image URL — already compatible with `{base}/{path}` format
- **Likely blast radius:**
  - New files: 1 API route (`/api/catalog/images/route.ts`), R2 binding utility
  - Modified files: `CatalogProductImagesFields.client.tsx` (add file input), `wrangler.toml` (add R2 binding), `syncMutex.ts` type declaration (extend CloudflareEnv)
  - Config: `NEXT_PUBLIC_XA_IMAGES_BASE_URL` env var for xa-b, R2 bucket binding name for xa-uploader
  - No changes to: catalogWorkflow.ts, catalogAdminSchema.ts, catalogDraftToContract.ts, products/route.ts

### Security and Performance Boundaries

- **Auth**: Image upload route must use `hasUploaderSession(request)` — same as all other catalog routes. No anonymous uploads.
- **File size**: Enforce max file size server-side (8MB per image — `XA_UPLOADER_MAX_IMAGE_BYTES` is commented-out in wrangler.toml but provides the intended limit). Must be enforced in the new route code. Reject oversized uploads before R2 write.
- **File type validation**: Check Content-Type and/or magic bytes (PNG/JPEG/WebP only). Reject non-image uploads.
- **Dimension validation**: Use `readImageDimensions()` to enforce 1600px min edge before R2 write. Reject undersized images with actionable error.
- **Rate limiting**: Image uploads should be rate-limited (e.g., 10 uploads/60s per IP) to prevent abuse.
- **Path traversal**: R2 keys are constructed server-side from storefront + slug + role — never from user-supplied paths. No path traversal risk.
- **R2 free tier monitoring**: No built-in alert for approaching 10GB limit. Consider logging R2 usage or checking periodically.

### Test Landscape

#### Test Infrastructure

- Framework: Jest (governed runner: `pnpm -w run test:governed`)
- CI only (per `docs/testing-policy.md` — never run locally)
- Existing test patterns: mock `fetch`, mock `getCloudflareContext`, test route handlers as functions

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Image dimensions | Unit | `apps/xa-uploader/src/lib/__tests__/imageDimensions.test.ts` | PNG, WebP parsing |
| Schema validation | Unit | `apps/xa-uploader/src/lib/__tests__/catalogAdminSchema.test.ts` | Image count matching, role validation |
| Products route | Unit | `apps/xa-uploader/src/app/api/catalog/products/__tests__/route.test.ts` | CRUD, auth, unpublish guard |
| Sync route | Unit | `apps/xa-uploader/src/app/api/catalog/sync/__tests__/route.test.ts` | Cloud sync, confirm flow |
| Console actions | Unit | `apps/xa-uploader/src/components/catalog/__tests__/action-feedback.test.tsx` | Save, delete, sync feedback |

#### Coverage Gaps

- No tests for image upload (route doesn't exist yet)
- No tests for R2 binding access from route handler
- No tests for client-side file input → upload → populate imageFiles flow

#### Testability Assessment

- **Easy to test**: New image upload route (mock R2 binding `put()`, mock `readImageDimensions()`)
- **Easy to test**: File type/size validation (pure functions)
- **Hard to test**: Client-side file input interaction (requires component test with file mock)
- **Test seams needed**: R2 binding must be injectable (mock `getCloudflareContext` → mock `env.XA_MEDIA_BUCKET.put()`)

#### Recommended Test Approach

- Unit tests for: image upload route (auth, validation, R2 write, error cases)
- Unit tests for: file type validation, size validation, dimension validation
- No E2E tests needed for MVP (operator-only tool, not customer-facing)

### Recent Git History (Targeted)

- `0ad6941c6e` (2026-03-03): Completed xa-catalog-workflow-fixes — removed dead submission code, added unpublish protection, console header, sync confirm fix. This build explicitly deferred Issue 1 (image upload).
- Prior commits established the current image-as-text-path pattern and wrangler stub env vars.

## Scope Signal

- **Signal:** right-sized
- **Rationale:** The scope is bounded to: one new API route, one UI component modification, one config change. The existing `hasImages` → `isPublishReady` workflow already handles the draft→published state machine. `buildXaImageUrl()` already resolves `{base}/{path}`. The Worker binding pattern is proven via KV in the same app. No architectural changes needed — this is additive infrastructure wiring.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| R2 Worker binding setup | Yes | None | No |
| Image upload API route | Yes | None | No |
| Client-side file input UI | Yes | None | No |
| Image validation (type/size/dimensions) | Yes | None | No |
| R2 key format ↔ buildXaImageUrl compatibility | Yes | None | No |
| hasImages → isPublishReady state machine | Yes | None — existing logic handles this without changes | No |
| xa-b build-time image resolution | Yes | None — `NEXT_PUBLIC_XA_IMAGES_BASE_URL` already consumed by `buildXaImageUrl()` | No |
| Auth boundary | Yes | None — `hasUploaderSession(request)` pattern established for all catalog routes | No |
| Free tier capacity | Partial | [Missing domain coverage] [Minor]: No mechanism to monitor R2 storage usage approaching 10GB limit | No |

## Confidence Inputs

- **Implementation:** 90% — Worker binding pattern proven (KV in same app), image validation utilities exist, R2 API is simple (`bucket.put(key, body)`). What raises to 95: confirming R2 binding type declarations work with OpenNext.
- **Approach:** 95% — Operator chose Option A (Worker binding). Simpler than presigned URLs. No credentials to manage. Pattern matches existing KV usage. What raises to 100: nothing meaningful — approach is validated.
- **Impact:** 90% — Closes the last blocking gap for XA product publishing. Without this, products can never go live from the console. What raises to 95: confirming xa-b correctly resolves R2 URLs at build time (highly likely given existing `buildXaImageUrl` logic).
- **Delivery-Readiness:** 85% — All building blocks exist. New code is additive. No breaking changes. What raises to 90: confirming exact R2 bucket creation commands and public access config for free tier.
- **Testability:** 85% — Route is easily testable by mocking R2 binding. Validation functions are pure. What raises to 90: establishing the R2 mock pattern in the first test.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| R2 10GB free tier exceeded at scale | Low (current catalog small) | Medium — images stop uploading | Monitor storage; compress images client-side; warn when approaching limit |
| Worker CPU time limit (10ms free tier) hit during image dimension validation | Very Low — header parsing reads <512 bytes | Medium — upload fails | readImageDimensions reads only header bytes, not full file; parsing is fast |
| R2 public access misconfigured | Low | High — xa-b gets 403s for all images | Test public URL access during setup; document bucket config steps |
| OpenNext R2 binding not supported | Very Low — KV binding already works | High — approach blocked | Fallback: use S3 API via existing platform-core infra (requires access keys) |
| R2 key collision on re-upload | Low — timestamp prefix mitigates | Low — orphaned objects waste storage | Timestamp prefix in key; optional cleanup job later |

## Planning Constraints & Notes

- Must-follow patterns:
  - Use `getCloudflareContext({ async: true })` for R2 binding access (same as KV)
  - Use `hasUploaderSession(request)` for route protection
  - Use existing rate limiting pattern
  - R2 keys must contain `/` to avoid `buildXaImageUrl` variant suffix issue
- Rollout/rollback expectations:
  - Feature is additive — no rollback risk. If R2 upload fails, existing text-path entry still works.
  - R2 bucket is persistent — uploaded images survive redeployments.
- Observability expectations:
  - Log R2 upload success/failure in route response
  - Return uploaded R2 key to client for immediate use

## Suggested Task Seeds (Non-binding)

1. **IMPLEMENT: R2 binding configuration** — add `[[r2_buckets]]` to wrangler.toml, extend CloudflareEnv type, create R2 binding utility function
2. **IMPLEMENT: Image upload API route** — new `/api/catalog/images/route.ts` with auth, file type/size/dimension validation, R2 write, return key
3. **IMPLEMENT: Image upload UI** — add file input/dropzone to CatalogProductImagesFields, upload handler, progress indicator, auto-populate imageFiles field with returned R2 keys
4. **IMPLEMENT: xa-b image base URL config** — set `NEXT_PUBLIC_XA_IMAGES_BASE_URL` to R2 public URL, verify buildXaImageUrl resolution

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package: image upload route returns R2 key; uploaded images accessible via public URL; imageFiles field populated with R2 keys; product with images transitions to publish-ready
- Post-delivery measurement plan: manual verification — upload image via console, confirm R2 key returned, confirm xa-b resolves image URL

## Questions

### Resolved

- Q: Should we use Worker R2 binding or S3 API for uploads?
  - A: Worker R2 binding (Option A). Simpler, no credentials to manage, pattern proven via KV in same app.
  - Evidence: `syncMutex.ts` demonstrates `getCloudflareContext({ async: true })` → `env.XA_UPLOADER_KV`

- Q: Does the draft→published state machine need changes?
  - A: No. `getCatalogDraftWorkflowReadiness()` already gates `isPublishReady` on `hasImages`. Data-only save = draft; images present = publish-ready. No workflow code changes needed.
  - Evidence: `packages/lib/src/xa/catalogWorkflow.ts` lines 46-67

- Q: Will `buildXaImageUrl()` work with R2 paths?
  - A: Yes. It returns `${NEXT_PUBLIC_XA_IMAGES_BASE_URL}/${normalizedPath}`. R2 keys containing `/` are used as-is (no variant suffix appended). Just set the env var to the R2 public URL.
  - Evidence: `apps/xa-b/src/lib/xaImages.ts` lines 11-29

- Q: What R2 key format should be used?
  - A: `{storefront}/{slug}/{timestamp}-{role}.{ext}` — e.g., `xa-b/hermes-constance-18/1709510400-front.jpg`. Contains `/` so buildXaImageUrl handles it correctly. Timestamp prefix prevents key collision on re-upload. Normalizable by `buildMediaEntries()`.
  - Evidence: `buildXaImageUrl` path-contains-slash logic; `catalogDraftToContract.ts` `normalizeCatalogPath`

- Q: Is there existing R2 infrastructure to reuse?
  - A: Yes, but it uses S3 API (`aws4fetch`) in `packages/platform-core/src/repositories/media.r2.server.ts`. We're using Worker binding instead (simpler for this use case), but the pattern shows R2 works in the monorepo.
  - Evidence: `packages/platform-core/src/repositories/media.r2.server.ts`

- Q: What are the Worker request body size limits?
  - A: Cloudflare Workers free tier allows 100MB request body. Product images at 1-5MB are well within limits.
  - Evidence: Cloudflare Workers documentation

- Q: How should image dimensions be validated?
  - A: Use existing `readImageDimensions()` from `packages/lib/src/xa/imageDimensions.ts` + `validateMinImageEdge()` from `packages/lib/src/math/ops/media-constraints.ts`. Enforce 1600px min edge server-side before R2 write.
  - Evidence: `imageDimensions.ts`, `media-constraints.ts`

### Open (Operator Input Required)

- Q: What should the R2 bucket name be?
  - Why operator input is required: Naming convention is a preference choice that affects Cloudflare dashboard organization.
  - Decision impacted: `wrangler.toml` bucket name, `wrangler r2 bucket create` command.
  - Default assumption: `xa-media` — low risk, can be changed later.

## Evidence Gap Review

### Gaps Addressed

- Confirmed Worker R2 binding pattern works via existing KV binding in same app
- Confirmed `hasImages` → `isPublishReady` requires zero workflow changes
- Confirmed `buildXaImageUrl` resolves R2 paths correctly when base URL is set
- Confirmed image dimension validation utilities already exist
- Confirmed existing schema validation handles imageFiles/roles/altTexts matching

### Confidence Adjustments

- Implementation raised from 85→90 after confirming KV binding pattern in same app is directly transferable to R2
- Approach raised from 90→95 after confirming no credentials needed for Worker binding (unlike S3 API approach)

### Remaining Assumptions

- OpenNext for Cloudflare exposes R2 bindings via `getCloudflareContext()` the same way it exposes KV bindings (very high confidence, same mechanism)
- R2 public access can be enabled on free tier (confirmed by Cloudflare documentation)
- Product image sizes will remain within Worker free tier body size limits (100MB — very high confidence for product photos)

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan xa-uploader-r2-image-upload --auto`
