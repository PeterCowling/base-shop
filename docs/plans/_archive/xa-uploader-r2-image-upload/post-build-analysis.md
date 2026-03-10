---
Type: Post-Build-Analysis
Feature-Slug: xa-uploader-r2-image-upload
Analysis-Date: 2026-03-03
Status: Actionable
---

# XA Uploader R2 Image Upload — Post-Build Analysis

End-to-end flow simulation, Cloudflare free tier verification, and Workers CPU budget analysis performed after code completion but before first deploy.

## 1. End-to-End Flow Trace

Three parallel flows were traced through the code to verify the full upload-to-display pipeline.

### Flow A: Data-Only Save (Product Without Images)

1. Vendor fills product form fields in `CatalogProductForm.client.tsx`.
2. Save triggers POST to `/api/catalog/products` → `products/route.ts`.
3. `derivePublishState()` (line 68–73) calls `getCatalogDraftWorkflowReadiness()`.
4. `getCatalogDraftWorkflowReadiness()` (`catalogWorkflow.ts:46–67`) computes:
   - `hasImages = splitList(draft.imageFiles ?? "").length > 0` → **false** (no images).
   - `isPublishReady = dataValidation.success && hasImages` → **false**.
5. `derivePublishState()` returns `"draft"`.
6. Product saved with `publishState: "draft"`.
7. Cloud sync (`sync/route.ts:655–720`) filters: only `"ready"` or `"live"` products are published → **draft product excluded from catalog JSON**.
8. **Result**: Data saved, product visible in uploader console, NOT visible in xa-b. Correct behavior.

### Flow B: Image Upload

1. Vendor selects a role from the dropdown (front/side/top/detail/lifestyle/packaging).
2. Vendor picks a file via `<input type="file">`.
3. `handleFileChange()` (`CatalogProductImagesFields.client.tsx:115–122`) triggers `handleUpload()`.
4. Client-side file size pre-check (8MB limit, line 53–57).
5. POST to `/api/catalog/images?storefront=xa-b&slug={slug}&role={role}` with `FormData`.
6. Server route (`images/route.ts`) validation chain:
   - Rate limit check (10 uploads per 60s per IP).
   - Auth: `hasUploaderSession(request)` → 404 if unauthenticated.
   - Query params: storefront, slug, role must all be present.
   - R2 bucket: `getMediaBucket()` → 503 if unavailable.
   - FormData parsing → file extraction.
   - File size: `file.size > 8MB` → 413.
   - Magic bytes: `detectImageFormat(buf)` → must be JPEG/PNG/WebP → 400 if not.
   - Dimensions: `parseImageDimensionsFromBuffer(buf)` + `validateMinImageEdge(w, h, 1600)` → 400 if too small.
7. R2 write: `bucket.put("xa-b/{slug}/{timestamp}-{role}.{ext}", arrayBuffer, { contentType })`.
8. Response: `{ ok: true, key: "xa-b/{slug}/{timestamp}-{role}.jpg" }`.
9. Client receives key, appends to pipe-delimited fields:
   - `imageFiles`: `"xa-b/slug/1709510400-front.jpg"` (or appended with `|` delimiter).
   - `imageRoles`: `"front"` (or appended).
   - `imageAltTexts`: `"front view"` (or appended).
10. **React state updated via `onChange()`** — but NOT auto-saved to server.

### Flow C: Image Display in xa-b

1. Cloud sync publishes `catalog.media.json` containing `CatalogMediaEntry[]`:
   - `buildMediaEntries()` (`catalogDraftToContract.ts:215–248`) maps `imageFiles` → `{ type: "image", path, altText }`.
2. xa-b reads catalog JSON at build time.
3. `buildXaImageUrl("xa-b/slug/1709510400-front.jpg")` (`xaImages.ts`):
   - `IMAGE_BASE_URL` = `"https://pub-xa-media.r2.dev"` (from `NEXT_PUBLIC_XA_IMAGES_BASE_URL`).
   - `hasVariant("xa-b/slug/1709510400-front.jpg")` → `true` (path contains `/`).
   - Returns `"https://pub-xa-media.r2.dev/xa-b/slug/1709510400-front.jpg"`.
4. Browser fetches image from R2 public URL.
5. **Result**: Image displayed. Correct behavior (when R2 bucket exists and public access is enabled).

---

## 2. Issues Found

### Issue 1 — No auto-save after image upload (Medium)

**Location**: `CatalogProductImagesFields.client.tsx:101–106`

After a successful upload, the R2 key is appended to React state (`onChange()` call) but the product is not auto-saved to the server. If the vendor navigates away or closes the browser without clicking "Save", the R2 key is lost from the draft and the uploaded image becomes an orphaned R2 object.

**Impact**: Vendor confusion — "I uploaded an image but it's not there". Orphaned R2 storage waste.

**Suggested fix**: Either auto-save after upload (call the products SAVE endpoint), or add a prominent unsaved-changes warning. Auto-save is the better UX since the vendor already initiated a deliberate action.

**Free tier impact**: None — save is a JSON POST, not an image upload.

**data=draft/image=published compatibility**: Compatible. Auto-saving after image upload would trigger `derivePublishState()`, which would detect `hasImages=true` and transition from `"draft"` to `"ready"` — exactly the intended behavior. This is actually how the feature should work: uploading an image makes the product publish-ready, which the next sync will pick up.

---

### Issue 2 — imageRoles dropped during sync (Low, pre-existing)

**Location**: `catalogDraftToContract.ts:215–248`

`buildMediaEntries()` takes `imageFiles` and `imageAltTexts` but does NOT take `imageRoles`. The `CatalogMediaEntry` type is `{ type: "image"; path: string; altText: string }` — there is no `role` field. Roles are stored in the draft but dropped when the catalog is published.

**Impact**: xa-b has no way to know which image is "front" vs "side" vs "detail". Currently xa-b renders images in array order, which happens to match the upload order but is not semantically guaranteed.

**Pre-existing**: This gap existed before the R2 upload work. The upload UI correctly stores roles in `imageRoles` pipe-delimited field, but the sync pipeline doesn't propagate them.

**Suggested fix**: Add `role?: string` to `CatalogMediaEntry` and pass `imageRoles` into `buildMediaEntries()`. Low priority — xa-b already renders images correctly by array order, and the catalog admin schema enforces required roles per category.

---

### Issue 3 — R2 public URL is a placeholder (High — deployment blocker)

**Location**: `apps/xa-b/wrangler.toml:9`

```toml
NEXT_PUBLIC_XA_IMAGES_BASE_URL = "https://pub-xa-media.r2.dev"
```

This is a reasonable placeholder based on R2 public URL conventions, but the actual URL won't be known until the R2 bucket is created and public access is enabled. The Cloudflare dashboard shows the public URL after enabling it.

**Fix required before deploy**: Create R2 bucket → enable public access → copy the actual public URL → update `wrangler.toml`.

**Steps**:
```bash
# Create buckets
wrangler r2 bucket create xa-media
wrangler r2 bucket create xa-media-preview

# Enable public access via Cloudflare dashboard:
# Storage & Databases → R2 → xa-media → Settings → Public access → Enable
# Copy the public URL (format: https://pub-{hash}.r2.dev or custom domain)

# Update xa-b wrangler.toml with actual URL
```

---

### Issue 4 — R2 bucket does not yet exist (High — deployment blocker)

**Location**: `apps/xa-uploader/wrangler.toml:36–38`

The wrangler.toml declares the R2 binding but the bucket hasn't been created yet. First deploy will fail if the bucket doesn't exist.

**Fix required before deploy**: Run `wrangler r2 bucket create xa-media` (and `xa-media-preview` for preview environment).

---

### Issue 5 — Orphaned R2 objects on re-upload (Low, known)

**Location**: `images/route.ts:143–145`

R2 key format: `{storefront}/{slug}/{timestamp}-{role}.{ext}`. The timestamp prefix means re-uploading the same role creates a new object rather than overwriting the old one. The previous R2 object is orphaned (still takes storage but is no longer referenced by the draft).

**Impact**: Storage waste over time. At typical product photography sizes (1-3MB) and low re-upload frequency, this will not approach the 10GB free tier limit for a long time.

**Suggested fix (future)**: Add a cleanup step that deletes the old R2 object when a new one replaces the same role for the same product. Not needed for MVP.

---

### Issue 6 — No image preview after upload (Low)

**Location**: `CatalogProductImagesFields.client.tsx`

After uploading, the vendor sees a "Upload successful" message but no thumbnail preview. The uploaded image key is appended to the textarea, but there's no visual confirmation of what was uploaded.

**Suggested fix**: Add a thumbnail grid below the upload section showing all uploaded images with their roles. Use `NEXT_PUBLIC_XA_IMAGES_BASE_URL` + key to construct preview URLs. Low priority — the textarea shows the R2 keys, and the vendor can verify via the xa-b preview.

---

### Issue 7 — Generic alt text placeholder (Low)

**Location**: `CatalogProductImagesFields.client.tsx:98`

```ts
const altText = `${selectedRole} view`;
```

After upload, the alt text is set to `"front view"`, `"side view"`, etc. These are generic placeholders — not product-specific. SEO-optimized alt text would include the product name.

**Suggested fix**: Use `${draft.title || draft.slug} — ${selectedRole} view` for auto-generated alt text. Vendor can still edit the alt text textarea manually. Low priority.

---

### Issue 8 — xa-b requires rebuild to display new images (Info)

**Location**: xa-b is a static export (Next.js `output: "export"`)

xa-b reads the catalog JSON at build time. After uploading images and syncing the catalog, the xa-b site must be rebuilt and redeployed for the new images to appear. This is the expected behavior for a static site but may surprise vendors expecting immediate updates.

**Not a bug** — this is inherent to the static export architecture. Just needs to be documented/communicated.

---

## 3. Cloudflare Free Tier Analysis

### R2 Free Tier Limits

| Resource | Free Allowance | Expected Usage | Headroom |
|---|---|---|---|
| Storage | 10 GB | ~200 products x 5 images x 2MB avg = 2 GB | 8 GB |
| Class A writes | 1M / month | ~200 products x 5 images = 1,000 | 999,000 |
| Class B reads | 10M / month | ~50 builds/month x 1,000 images = 50,000 | 9,950,000 |
| Egress | Free (always) | All image serves from R2 public URL | Unlimited |

**Assessment**: R2 free tier is more than sufficient for current and near-term usage. The 10GB storage limit is the binding constraint, but at 2MB average image size, it supports ~5,000 images before hitting the limit. At current catalog scale (~200 products), storage would only become an issue with frequent re-uploads or if the catalog grows 5x+ without cleanup.

### Workers Free Tier Limits

| Resource | Free Allowance | Image Upload Route Usage | Headroom |
|---|---|---|---|
| Requests | 100,000 / day | ~50 uploads/day max | 99,950 |
| CPU time | 10 ms / invocation | ~2-3 ms (see Section 4) | 7-8 ms |
| Memory | 128 MB | ~16 MB for 8MB file (arraybuffer + buffer copy) | 112 MB |
| Request body | 100 MB | 8 MB max (enforced) | 92 MB |

**Assessment**: Workers free tier is sufficient. The 10ms CPU budget was initially flagged as a concern but analysis (Section 4) shows the upload route uses approximately 2-3ms of JS CPU time for the maximum 8MB file. See detailed breakdown below.

### Compatibility with data=draft / image=published Regime

**Fully compatible.** The workflow is:

1. Vendor saves product data (JSON POST, no images) → `derivePublishState()` → `"draft"` (because `hasImages=false`).
2. Vendor uploads images (separate file POST to `/api/catalog/images`) → R2 key returned → appended to `imageFiles` field.
3. Vendor saves product again (or auto-save triggers) → `derivePublishState()` → `"ready"` (because `hasImages=true` and data validates).
4. Cloud sync picks up `"ready"` products → publishes to catalog JSON.

The key code path that enforces this:
- `catalogWorkflow.ts:50`: `hasImages = splitList(draft.imageFiles ?? "").length > 0`
- `catalogWorkflow.ts:64`: `isPublishReady = dataValidation.success && hasImages`
- `products/route.ts:68-73`: `if (!readiness.isPublishReady) return "draft"`

No workflow code changes were needed. The existing state machine handles the separate data/image upload pattern correctly.

---

## 4. Workers CPU Budget Analysis

### The Question

Cloudflare Workers free tier allows 10ms of JS CPU time per invocation. Does the image upload route (processing up to 8MB files) fit within this budget?

### What Counts as CPU Time

Cloudflare measures only **synchronous JavaScript execution time**. The following do NOT count:
- I/O wait (network, R2 reads/writes, DNS)
- `request.formData()` — native C++ in the Workers runtime
- `bucket.put()` — I/O to R2
- Time waiting for the client to send the request body

Only synchronous JS code execution counts: parsing, validation, `Buffer.from()`, string operations, JSON serialization.

### CPU Cost Breakdown for Maximum (8MB) File

| Operation | Estimated CPU | Rationale |
|---|---|---|
| URL parsing, query params | <0.01 ms | Trivial string operations |
| Rate limit check | <0.05 ms | Map lookup + arithmetic |
| Auth check (`hasUploaderSession`) | <0.1 ms | Cookie/header parsing |
| `request.formData()` | ~0 ms JS | Native C++ runtime — mostly I/O |
| `Buffer.from(arrayBuffer)` | ~1.0-1.6 ms | **Dominant cost.** memcpy at ~5-8 GB/s for 8MB. This is the single most expensive JS operation in the route. |
| `detectImageFormat(buf)` | <0.01 ms | Reads first 4-12 bytes only |
| `parseImageDimensionsFromBuffer(buf)` | <0.01 ms | **Header-only parsing** — see below |
| `validateMinImageEdge()` | <0.01 ms | Two integer comparisons |
| R2 key construction (string concat) | <0.01 ms | Template literal |
| `bucket.put()` | ~0 ms JS | I/O to R2 — does not count |
| `NextResponse.json()` | <0.05 ms | Small JSON serialization |
| **Total estimated JS CPU** | **~1.5-2.5 ms** | **Well within 10ms budget** |

### Why Dimension Parsing Is Not Proportional to File Size

The dimension parsers in `packages/lib/src/xa/imageDimensions.ts` use **header-only** strategies:

**PNG** (lines 40-47):
```
Reads bytes 16-23 only (4 bytes width at offset 16, 4 bytes height at offset 20).
Total bytes touched: 24. O(1) regardless of file size.
```

**JPEG** (lines 49-83) — marker-hopping parser:
```
Reads 2-byte marker ID, then 2-byte segment length, then JUMPS:
  offset += length - 2;  // line 79 — skips entire segment
This hops over multi-megabyte EXIF data, embedded thumbnails, ICC profiles.
Only stops at SOF marker (0xFFC0-0xFFC3), reads 5 bytes for dimensions.
Typical iterations: 3-8 marker hops. Total bytes touched: ~50-200.
```

**WebP** (lines 127-143) — chunk header parser:
```
Checks RIFF signature (4 bytes), skips to first chunk.
VP8: reads bytes at offset 26-29. VP8L: reads 4 bytes at offset 21.
Total bytes touched: ~30 bytes. O(1) regardless of file size.
```

**Conclusion**: Dimension parsing adds negligible CPU time (<0.01ms) regardless of whether the image is 100KB or 8MB.

### Maximum Safe File Size

Given the analysis:
- 8MB → ~1.5-2.5ms CPU → safe (5x headroom)
- 16MB → ~2.5-4ms CPU → safe (2.5x headroom)
- 32MB → ~5-8ms CPU → marginal (at budget boundary)

The current 8MB limit (`MAX_IMAGE_BYTES = 8 * 1024 * 1024`) is well within the CPU budget. No change needed.

### Caveats

- These are estimates based on typical V8/Workers performance. Actual CPU time may vary with Workers runtime version and server load.
- The `Buffer.from(arrayBuffer)` estimate assumes V8's optimized memcpy path. If the Workers runtime uses a different buffer implementation, this could be slightly higher.
- Cloudflare's CPU measurement granularity may differ from wall-clock profiling.
- **Recommendation**: After first deploy, check Cloudflare Workers analytics dashboard → CPU time per request to verify these estimates with real data.

---

## 5. Deployment Checklist

Before first deploy of the image upload feature:

- [ ] Create R2 bucket: `wrangler r2 bucket create xa-media`
- [ ] Create preview R2 bucket: `wrangler r2 bucket create xa-media-preview`
- [ ] Enable public access on `xa-media` bucket (Cloudflare dashboard → R2 → Settings → Public access)
- [ ] Note the actual public URL from the dashboard
- [ ] Update `apps/xa-b/wrangler.toml` `NEXT_PUBLIC_XA_IMAGES_BASE_URL` with actual R2 public URL (replace placeholder `https://pub-xa-media.r2.dev`)
- [ ] Deploy xa-uploader: `wrangler deploy` (in `apps/xa-uploader/`)
- [ ] Deploy xa-b: rebuild with updated env var, then deploy
- [ ] Verify end-to-end: upload test image → check R2 → check public URL → check xa-b renders it
- [ ] Check Workers analytics for CPU time per image upload request (should be 1-3ms)

## 6. Future Improvements (Not Blocking)

Prioritized by impact:

1. **Auto-save after image upload** (Issue 1) — prevents data loss and completes the draft→ready transition automatically.
2. **Image thumbnail preview** (Issue 6) — visual confirmation of upload success.
3. **Product-specific alt text** (Issue 7) — better SEO, trivial change.
4. **R2 cleanup on re-upload** (Issue 5) — prevents orphaned storage waste over time.
5. **Propagate imageRoles through sync** (Issue 2) — enables semantic image ordering in xa-b.
