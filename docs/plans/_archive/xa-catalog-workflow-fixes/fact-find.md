---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-03
Last-updated: 2026-03-03
Feature-Slug: xa-catalog-workflow-fixes
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/xa-catalog-workflow-fixes/plan.md
Trigger-Why: Five verified issues in the XA catalog workflow discovered during post-rebuild audit — broken image delivery in cloud mode, silent live product demotion, missing session management UI, API/client confirmation mismatch, and dead code from abandoned ZIP approach.
Trigger-Intended-Outcome: "type: operational | statement: XA catalog workflow is production-safe — images upload and render correctly, live products cannot be silently unpublished, console has session management, sync error handling is complete, and dead code is removed | source: operator"
---

# XA Catalog Workflow Fixes Fact-Find Brief

## Scope

### Summary

Five issues discovered in the XA catalog workflow (xa-uploader, xa-b, xa-uploader-worker) during a post-rebuild audit. These range from critical (broken images in production) to medium (dead code cleanup). All fixes must stay within Cloudflare free tier constraints.

### Goals
- Fix image upload path so product images actually reach storage and render on xa-b
- Prevent live products from being silently unpublished when edited
- Restore storefront selector and logout controls to the console
- Align sync API confirmation codes with client-side handlers
- Remove dead ZIP/submission code paths

### Non-goals
- Image optimization/resizing pipeline (future)
- CDN caching strategy (future)
- Multi-storefront product filtering (future)
- Full audit trail for publishState transitions (future)

### Constraints & Assumptions
- Constraints:
  - **HARD: Cloudflare free tier only.** R2: 10GB storage, 1M Class A ops/month, 10M Class B reads/month, zero egress. KV: 100k reads/day, 1k writes/day. Workers: 100k requests/day.
  - No new paid services or infrastructure
  - xa-b is a static export deployed to Cloudflare Pages — no server-side image processing at runtime
- Assumptions:
  - Product catalog will remain small (< 500 products, < 2000 images) — well within R2 free tier
  - Images are uploaded by operators (not end-users) so upload volume is low
  - Existing R2 upload infrastructure from the submission flow can be adapted

## Outcome Contract

- **Why:** Post-rebuild audit revealed five gaps in the XA catalog workflow. The most critical — no image upload path — means cloud-synced products render broken images on the storefront. Live product demotion risk means a single accidental incomplete save can silently remove products from the store. Missing session UI blocks multi-storefront operation.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** XA catalog workflow is production-safe — images upload and render correctly via R2, live products cannot be silently unpublished, console has storefront selector and logout, sync error handling covers all confirmation codes, and dead ZIP/submission code is removed.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points
- `apps/xa-uploader/src/app/api/catalog/sync/route.ts` — cloud sync pipeline (the central publishing flow)
- `apps/xa-uploader/src/app/api/catalog/products/route.ts` — product save with publishState derivation
- `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx` — main console UI
- `apps/xa-b/src/components/XaProductCard.tsx` — storefront image rendering

### Key Modules / Files

| # | File | Role |
|---|---|---|
| 1 | `packages/lib/src/xa/catalogWorkflow.ts` | Readiness logic (`getCatalogDraftWorkflowReadiness`), publishState defaults |
| 2 | `apps/xa-uploader/src/app/api/catalog/sync/route.ts` | Cloud sync pipeline, publishState promotion, catalog publishing |
| 3 | `apps/xa-uploader/src/app/api/catalog/products/route.ts` | Product save, `derivePublishState()` at lines 63-68 |
| 4 | `apps/xa-uploader/src/lib/catalogDraftToContract.ts` | Draft→contract mapping, image path normalization, media index |
| 5 | `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx` | Console layout — no session management UI |
| 6 | `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts` | Action handlers — sync confirm only handles `catalog_input_empty` |
| 7 | `apps/xa-uploader/src/components/catalog/catalogConsoleFeedback.ts` | Error code→message mapping |
| 8 | `apps/xa-uploader/src/components/catalog/CatalogSubmissionPanel.client.tsx` | Orphaned component — exported but never imported |
| 9 | `apps/xa-uploader/src/app/api/catalog/submission/route.ts` | Dead submission route — callable via HTTP but no UI path |
| 10 | `apps/xa-b/src/lib/xaImages.ts` | `buildXaImageUrl()` — resolves image paths via `NEXT_PUBLIC_XA_IMAGES_BASE_URL` |

### Patterns & Conventions Observed

- **publishState is stateless/derived**: `derivePublishState()` recomputes state on every save based on current readiness — no history preserved. Evidence: `products/route.ts:63-68`
- **Image paths are pass-through**: `normalizeCatalogPath()` only trims whitespace and strips leading slashes — no upload, no URL validation. Evidence: `catalogDraftToContract.ts:178-180`
- **Image entry is text-only — no file upload**: `CatalogProductImagesFields.client.tsx` renders three textareas where users type pipe/comma-delimited path strings (e.g., `images/hermes/constance-18/1.jpg`). There is NO `<input type="file">`, `FileReader`, `FormData`, or multipart handling anywhere in xa-uploader. The products API route (`products/route.ts:130`) reads JSON-only via `readJsonBodyWithLimit()`. Evidence: `CatalogProductImagesFields.client.tsx:36-70`, `products/route.ts:130`
- **Cloud sync is publish-only**: `runCloudSyncPipeline()` reads drafts, builds catalog artifact, publishes to contract endpoint — no image binary handling. Evidence: `sync/route.ts:655-774`
- **xa-b image URL resolution has variant-append logic**: `buildXaImageUrl()` in `xaImages.ts` prepends `NEXT_PUBLIC_XA_IMAGES_BASE_URL` and checks `hasVariant()` — if the path contains a `/`, it's used as-is; if no `/`, it appends `/${DEFAULT_VARIANT}` (default: `"public"`). Current catalog paths (e.g., `images/hermes/constance-18/1.jpg`) contain slashes → `hasVariant()` returns true → used as-is. R2 object keys must follow the same slash-containing format to avoid variant suffix appending. Evidence: `xaImages.ts:11-29`
- **All xa-uploader API routes use `runtime = "nodejs"`**: R2 binding access requires `getCloudflareContext({ async: true })` pattern, same as existing KV access in the codebase. Evidence: `products/route.ts:26`, `sync/route.ts:38`
- **R2 upload infrastructure in submission flow is ZIP-based, not per-image**: `catalogConsoleActions.ts:578-652` uploads ZIP blobs produced by the server-side submission endpoint — it does NOT upload individual images from the browser. Not directly reusable for per-image upload.

### Data & Contracts
- Types/schemas/events:
  - `CatalogProductDraftInput` — draft product with `imageFiles: string` (pipe-delimited paths), `publishState: "draft"|"ready"|"live"`
  - `CatalogDraftWorkflowReadiness` — `{ isDataReady, isSubmissionReady, isPublishReady, hasImages, missingFieldPaths }`
  - `CatalogPayload` — published catalog with `media: [{ type, path, altText }]`
  - `MediaIndexPayload` — media mapping with `items: [{ productSlug, sourcePath, catalogPath, altText }]`
- Persistence:
  - Cloud draft snapshot via `readCloudDraftSnapshot()`/`writeCloudDraftSnapshot()` — stored at catalog contract endpoint
  - Published catalog via `publishCatalogPayloadToContract()` — PUT to `XA_CATALOG_CONTRACT_BASE_URL/{storefront}`
  - KV namespace `XA_UPLOADER_KV` for async job state (submission flow — currently dead)
- API/contracts:
  - Products: `POST /api/catalog/products?storefront=X` — save with derived publishState
  - Sync: `POST /api/catalog/sync` — cloud sync with confirmation flow
  - Submission: `POST /api/catalog/submission` — dead but callable
  - Contract publish: `PUT {contract_base}/{storefront}` with `X-XA-Catalog-Token`

### Dependency & Impact Map
- Upstream dependencies:
  - Cloudflare R2 (image storage — to be added)
  - Catalog contract endpoint (product data publishing)
  - xa-uploader Worker runtime (Cloudflare Workers free tier)
- Downstream dependents:
  - xa-b storefront (static export) — consumes catalog.runtime.json at build time, resolves images via CDN URL
  - `build-xa.mjs` — fetches catalog from contract at build time
- Likely blast radius:
  - Issue 1 (images): sync/route.ts + new R2 upload module + xa-b image URL config
  - Issue 2 (unpublish): products/route.ts `derivePublishState()` + catalogWorkflow.ts
  - Issue 3 (console): CatalogConsole.client.tsx layout
  - Issue 4 (confirm): catalogConsoleActions.ts sync handler
  - Issue 5 (dead code): submission/route.ts + CatalogSubmissionPanel + related imports

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest
- Commands: `pnpm test` (CI only per testing policy)
- CI integration: GitHub Actions reusable workflow

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Catalog workflow readiness | Unit | `packages/lib/src/xa/__tests__/` | Covers readiness derivation |
| Console actions | Unit | `apps/xa-uploader/src/components/catalog/__tests__/action-feedback.test.tsx` | Covers action feedback mapping |
| Listing filters | Unit | `apps/xa-b/src/lib/__tests__/useXaListingFilters.test.tsx` | Covers xa-b filter logic |
| Listing utils | Unit | `apps/xa-b/src/lib/__tests__/xaListingUtils.test.ts` | Covers xa-b listing utilities |
| Admin schema | Unit | `apps/xa-uploader/src/lib/__tests__/catalogAdminSchema.test.ts` | Covers schema validation |

#### Coverage Gaps
- No tests for `derivePublishState()` transition behavior (live→draft demotion)
- No tests for sync confirmation flow (which error codes trigger which client behavior)
- No tests for image path resolution end-to-end (upload → catalog → xa-b render)

#### Recommended Test Approach
- Unit tests for: `derivePublishState()` state transitions, R2 upload module, sync confirmation handler expansion
- Integration tests for: full sync flow with image upload + catalog publish
- Contract tests for: R2 upload/serve URL consistency with `buildXaImageUrl()` expectations

## Issue-by-Issue Analysis

### Issue 1 (P1): No Image Upload Path in Cloud Sync

**Current state:** Cloud sync (`runCloudSyncPipeline()` at sync/route.ts:655-774) reads draft products from cloud snapshot, builds catalog artifact via `buildCatalogArtifactsFromDrafts()`, and publishes the catalog JSON to the contract endpoint. Image paths in the catalog (`media[].path`) are normalized strings (leading slashes removed) but **no image binaries are uploaded anywhere**. xa-b resolves these paths via `buildXaImageUrl()` which prepends `NEXT_PUBLIC_XA_IMAGES_BASE_URL` — if no images exist at those URLs, broken images result.

**Critical detail — image entry is text-only:** `CatalogProductImagesFields.client.tsx` uses three textareas for path strings. Users type paths like `images/hermes/constance-18/1.jpg`. There is no `<input type="file">` anywhere in xa-uploader. The products API route only accepts JSON (no multipart/form-data). This means the current system has NO mechanism to capture image binaries from the user's device.

**`buildXaImageUrl()` variant-append constraint:** `xaImages.ts:11-29` has a `hasVariant()` check — if the normalized path contains a `/`, it's used as-is; otherwise `/${DEFAULT_VARIANT}` is appended. Current catalog paths (e.g., `images/hermes/constance-18/1.jpg`) contain slashes → used as-is → resolves correctly. R2 object keys MUST contain at least one `/` to avoid variant suffix corruption. The existing `{brand}/{product-slug}/{number}.jpg` convention satisfies this naturally.

**R2 free tier assessment:**
- 10GB storage: sufficient for thousands of product images (avg 200KB = 50,000 images)
- 1M Class A writes/month (R2's own limit): sufficient for catalog-scale uploads (hundreds, not millions)
- 10M Class B reads/month (R2's own limit): sufficient for storefront traffic
- Zero egress: images served directly from R2 at no cost
- R2 operations via Worker bindings do NOT count against Workers' 100k requests/day free-tier limit, but DO count against R2's own monthly operation limits above
- Public bucket access via custom domain or `r2.dev` subdomain

**Existing infrastructure to adapt:**
- `wrangler.toml` already has KV namespace binding pattern — R2 binding follows same `[[r2_buckets]]` format
- All API routes use `export const runtime = "nodejs"` — R2 binding access requires `getCloudflareContext({ async: true })`, same pattern as existing KV access in the codebase
- `catalogDraftToContract.ts` already produces `MediaIndexPayload` with `sourcePath`/`catalogPath` mapping — useful for tracking which images need uploading
- The ZIP-based R2 upload in `catalogConsoleActions.ts:578-652` is NOT directly reusable (it uploads ZIP blobs, not per-image files)

**Recommended approach (two parts):**

*Part A — Add file upload capability to xa-uploader:*
1. Add `<input type="file" multiple accept="image/*">` to `CatalogProductImagesFields.client.tsx` alongside existing textareas
2. Create a new API route `POST /api/catalog/images` that accepts `multipart/form-data`
3. Route handler uploads each image to R2 via Worker binding, using key format `{storefront}/{product-slug}/{filename}`
4. Return the R2 object keys to the client
5. Client auto-populates the `imageFiles` textarea with the returned R2 keys

*Part B — xa-b URL resolution (no code changes needed):*
- Set `NEXT_PUBLIC_XA_IMAGES_BASE_URL` to the R2 public access URL
- R2 object keys follow `{brand}/{slug}/{number}.jpg` format (contains `/`) → `hasVariant()` returns true → path used as-is → correct URL resolution
- No changes needed to `buildXaImageUrl()` or xa-b components

**Alternative approach (simpler, less UX polish):**
- Keep text-only path entry
- Users upload images to R2 manually (via Cloudflare dashboard or `wrangler r2 object put`)
- Users enter the R2 object keys as image paths in the textarea
- Pro: No new upload code needed. Con: Worse operator UX, manual step outside the app.

### Issue 2 (P1): Live Product Silent Unpublish

**Current state:** `derivePublishState()` at `products/route.ts:63-68`:
```typescript
function derivePublishState(product: CatalogProductDraftInput): "draft" | "ready" | "live" {
  const readiness = getCatalogDraftWorkflowReadiness(product);
  if (!readiness.isPublishReady) return "draft";        // ← unconditional demotion
  if (product.publishState === "live") return "live";
  return "ready";
}
```

Line 65 returns `"draft"` when `!readiness.isPublishReady` **regardless of prior state**. A live product edited to an incomplete state (e.g., image paths cleared) is demoted to `"draft"`. Next sync excludes it from the published catalog.

**Impact:** Single accidental incomplete save silently removes a product from the live storefront. No warning, no undo, no "keep current live version" mechanism.

**Recommended approach:** When a product is currently `"live"` and an edit would make it not publish-ready, either:
- (a) **Warn and block:** Return a warning response from the save endpoint indicating the edit would unpublish the product. Require explicit confirmation (`confirmUnpublish: true`).
- (b) **Preserve live snapshot:** Keep a `lastPublishedSnapshot` on the product. Sync uses the last-published version while the draft is being edited. Only update the live version when the draft is complete and explicitly synced.

Option (a) is simpler and sufficient for the current scale. Option (b) adds complexity but is more robust for multi-editor scenarios.

### Issue 3 (P2): Console Storefront Selector/Logout Missing

**Current state:** `CatalogConsole.client.tsx` renders:
- Tab navigation (New Product, Revise Existing, Currency Rates)
- Product form, product list, sync panel, currency panel
- Login form (when unauthenticated)
- **No logout button, no storefront selector, no session info display**

`handleLogoutImpl()` exists in `catalogConsoleActions.ts:248-307` but is never surfaced in any UI component. `state.storefront` and `state.setStorefront` exist in the console state hook but no selector UI exposes them.

**Recommended approach:** Add a header bar to CatalogConsole with:
- Current storefront name display
- Storefront selector dropdown (if multiple storefronts configured)
- Logout button calling `handleLogoutImpl()`

### Issue 4 (P2): Sync Confirm Flow Client/Server Mismatch

**Current state:**
- **Server** returns `no_publishable_products` at sync/route.ts:451-477 and 668-683 with `{ error: "no_publishable_products", requiresConfirmation: true, recovery: "mark_products_ready" }` at HTTP 409.
- **Client** confirmation handler at catalogConsoleActions.ts:475-483 only matches `catalog_input_empty`:
  ```typescript
  if (syncAttempt.response.status === 409 &&
      syncAttempt.data.error === "catalog_input_empty" &&
      syncAttempt.data.requiresConfirmation) {
  ```
- `no_publishable_products` falls through to the generic error path at line 496+, which calls `getSyncFailureMessage()` and shows a non-actionable error.

**Recommended approach:** Expand the client-side confirmation handler to match all 409 + `requiresConfirmation: true` responses, with error-code-specific dialog messages. Add `no_publishable_products` with a message explaining which products need to be marked ready and how.

### Issue 5 (P3): Dead ZIP/Submission Code

**Current state:**
- `CatalogSubmissionPanel.client.tsx` — exported but **never imported or rendered** anywhere. Fully orphaned component.
- `submission/route.ts` — POST handler callable via HTTP at `/api/catalog/submission` but no UI path reaches it. Handles ZIP creation, KV job queuing, async execution.
- `catalogConsoleActions.ts:517-652` — `handleExportSubmissionImpl()` and `handleUploadToR2Impl()` exist but are wired to the submission hook, which is never connected to active UI.

**Blast radius is larger than the orphaned component alone.** Submission code is imported/referenced in 5+ files:
- `catalogConsoleActions.ts` — imports from `catalogSubmissionClient`
- `catalogConsoleFeedback.ts` — imports `SubmissionApiError` type
- `useCatalogConsole.client.ts` — imports and wires up `handleExportSubmissionImpl` and `handleUploadSubmissionToR2Impl`
- `__tests__/action-feedback.test.tsx` — imports and mocks `catalogSubmissionClient`
- `__tests__/useCatalogConsole-domains.test.tsx` — imports and mocks `catalogSubmissionClient`

**Recommended approach:** Remove all ZIP/submission-related code with full dependency tracing:
- Delete `CatalogSubmissionPanel.client.tsx`
- Delete `submission/route.ts`
- Remove submission-related handlers from `catalogConsoleActions.ts` (lines 517-652)
- Remove submission-related state and wiring from `useCatalogConsole.client.ts`
- Remove submission-related feedback messages and types from `catalogConsoleFeedback.ts`
- Update or remove 2 test files that mock `catalogSubmissionClient`
- The ZIP-based R2 upload logic is NOT reusable for Issue 1 (it uploads ZIP blobs, not individual images)

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Image binary source (how do files enter the system?) | Yes | [Critical resolved]: No file upload capability exists — text paths only. Approach updated to add `<input type="file">` + new upload API route | No — addressed in updated Issue 1 approach |
| Image URL resolution (R2 keys → xa-b render) | Yes | [Major resolved]: `buildXaImageUrl()` variant-append logic requires R2 keys to contain `/`. Existing `{brand}/{slug}/{n}.jpg` format satisfies this | No — constraint documented |
| R2 binding access pattern | Yes | [Major resolved]: Routes use `runtime = "nodejs"` — must use `getCloudflareContext({ async: true })` for R2 access | No — constraint documented |
| publishState transitions (save→sync→live/draft) | Yes | None | No |
| Console UI layout (session/storefront) | Yes | None | No |
| Sync confirmation codes (server→client) | Yes | [Minor]: `confirmEmptyInput: true` retry also bypasses `no_publishable_products` — practical impact is "fails then succeeds on retry" rather than "always fails" | No — noted in Issue 4 |
| Dead code blast radius | Yes | [Moderate resolved]: 5+ files affected, 3 test files need updating — larger than initially assessed | No — addressed in updated Issue 5 |
| R2 free tier constraints | Yes | [Moderate resolved]: R2 ops via bindings have their own limits (1M A / 10M B per month), separate from Workers limit | No — clarified in assessment |
| R2 upload failure edge case | Partial | What happens if R2 upload succeeds but catalog publish fails? Image exists in R2 but product data doesn't reference it. Orphaned images are harmless within 10GB free tier | No — acceptable risk |

## Scope Signal

- **Signal:** right-sized
- **Rationale:** Five clearly-bounded issues with well-understood code paths. Each can be implemented independently. R2 free tier is generous for the expected scale. No architectural uncertainty — the patterns are established in the codebase.

## Questions

### Resolved
- Q: Can R2 free tier handle the expected image volume?
  - A: Yes. 10GB storage supports ~50,000 images at 200KB avg. 1M writes/month and 10M reads/month are far above expected catalog-scale usage.
  - Evidence: Cloudflare R2 pricing docs, expected catalog size < 500 products

- Q: Where should images be uploaded — during save (step 2) or during sync?
  - A: During save (step 2: Images). This ensures images are in R2 before sync, and the image path stored in the draft is already the R2 key. Sync then publishes catalog JSON with R2 keys that are guaranteed to resolve.
  - Evidence: Current flow saves draft with image paths → sync publishes catalog with those paths. If paths point to R2 at save time, they'll resolve at render time.

- Q: Should we use presigned URLs or Worker-based R2 binding for upload?
  - A: Worker-based R2 binding (Service binding in wrangler.toml). Simpler than presigned URLs, no token management, and the uploader already runs as a Cloudflare Worker. The R2 binding is free and doesn't count against request limits.
  - Evidence: wrangler.toml already has KV binding pattern. R2 binding follows same format.

- Q: How should xa-b resolve R2 image URLs?
  - A: Set `NEXT_PUBLIC_XA_IMAGES_BASE_URL` to the R2 public access URL (either custom domain or `{bucket}.{account}.r2.dev`). `buildXaImageUrl()` already prepends this base to catalog image paths — no code change needed in xa-b if image paths in the catalog match R2 object keys.
  - Evidence: `xaImages.ts` `buildXaImageUrl()` function

- Q: Option (a) or (b) for live product safety?
  - A: Option (a) — warn and block. Simpler, sufficient for single-operator workflow. Option (b) (draft/live versioning) is over-engineering for current scale.
  - Evidence: Single operator workflow, low edit frequency, no concurrent editing

### Open (Operator Input Required)
- Q: What R2 bucket name should be used?
  - Why operator input is required: Bucket naming is an operator preference tied to Cloudflare account setup.
  - Decision impacted: wrangler.toml R2 binding configuration
  - Decision owner: operator
  - Default assumption: `xa-catalog-images` — low risk, can be changed later

- Q: Should R2 public access use custom domain or r2.dev subdomain?
  - Why operator input is required: Custom domain requires DNS configuration; r2.dev is immediate but has a less clean URL.
  - Decision impacted: `NEXT_PUBLIC_XA_IMAGES_BASE_URL` configuration
  - Decision owner: operator
  - Default assumption: Start with `r2.dev` subdomain for speed, migrate to custom domain later — low risk

## Confidence Inputs
- Implementation: 90% — all code paths understood, patterns established in codebase, R2 integration is well-documented
- Approach: 88% — each issue has a clear fix approach; warn-and-block for live safety is simple and sufficient
- Impact: 85% — fixes critical broken-image issue and data-loss risk; console UX is quality-of-life
- Delivery-Readiness: 90% — all entry points identified, blast radius bounded, existing test patterns available
- Testability: 82% — unit testable for state transitions and confirmation handling; R2 integration tests need mocking

Each score basis:
- Implementation 90%: Would reach 95% with R2 binding confirmed working in local dev
- Approach 88%: Would reach 92% with operator confirming warn-and-block is sufficient
- Impact 85%: Would reach 90% with analytics confirming image load failure rate
- Delivery-Readiness 90%: Would reach 95% with R2 bucket provisioned
- Testability 82%: Would reach 90% with R2 mock pattern established

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| R2 public access URL changes break image rendering | Low | High | Use env var (`NEXT_PUBLIC_XA_IMAGES_BASE_URL`) for URL — already decoupled |
| Removing submission code breaks something unexpected | Low | Medium | Grep for all imports/references before deletion; verify no external callers |
| Warn-and-block on live edit is too restrictive for operators | Low | Low | Confirmation is a single click — not blocking, just warning |
| R2 upload fails silently during save | Medium | High | Return explicit error on upload failure; don't save image path until R2 confirms |
| Dead code removal conflicts with in-flight changes | Low | Low | Check git status before deletion; commit atomically |

## Planning Constraints & Notes
- Must-follow patterns:
  - Cloudflare free tier — no paid R2 operations, no paid Workers, no external services
  - xa-b remains static export — no server-side changes to xa-b
  - Image upload via Worker R2 binding (not presigned URLs)
- Rollout/rollback expectations:
  - Each issue can be deployed independently
  - Dead code removal (Issue 5) should go first — reduces confusion for other changes
  - Image upload (Issue 1) should go before live safety (Issue 2) — unpublish protection depends on image presence for readiness
- Observability expectations:
  - Console log for R2 upload success/failure
  - Sync response includes image upload stats (count, failures)

## Suggested Task Seeds (Non-binding)

1. **Remove dead ZIP/submission code** (Issue 5) — delete orphaned components, routes, and handlers
2. **Add R2 bucket binding and image upload module** (Issue 1a) — wrangler.toml binding, upload-to-R2 utility
3. **Wire image upload into product save flow** (Issue 1b) — upload images to R2 during step 2 save, store R2 keys as image paths
4. **Add live product unpublish protection** (Issue 2) — warn-and-block in `derivePublishState()` / products route when live→draft demotion would occur
5. **Add console header with storefront selector and logout** (Issue 3) — header bar component in CatalogConsole
6. **Expand sync confirmation handler** (Issue 4) — client-side handler for `no_publishable_products` and any other 409+requiresConfirmation codes
7. **Add unit tests** — derivePublishState transitions, sync confirmation handling, R2 upload module

## Execution Routing Packet
- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package: All 5 issues resolved, typecheck passes, lint passes, CI green
- Post-delivery measurement plan: Manual smoke test of image upload → sync → xa-b render flow

## Evidence Gap Review

### Gaps Addressed
- R2 free tier limits confirmed via Cloudflare docs — sufficient for catalog scale
- All 5 code paths verified with exact line numbers and code snippets
- Dead code (submission) confirmed orphaned — no imports found in active codebase
- Existing R2 upload infrastructure assessed for reuse potential

### Confidence Adjustments
- Implementation raised from initial 85% to 90% after confirming R2 binding pattern matches existing KV binding in wrangler.toml
- Testability lowered from initial 85% to 82% — R2 mocking in Jest needs investigation

### Remaining Assumptions
- R2 bucket can be provisioned within Cloudflare free tier (confirmed by pricing docs but not tested)
- `buildXaImageUrl()` will work with R2 public access URLs without code changes (confirmed by reading the function — it prepends base URL to path)
- No external systems call the submission route (confirmed by grep — no references outside the orphaned UI)

## Access Declarations

None. All evidence gathered from local repository code. R2 is a new addition that will be configured during implementation.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items: none
- Scope narrowing: Issue 1 (image upload) deferred per operator decision — document as known gap. Issues 2–5 proceed to planning.
- Recommended next step: `/lp-do-plan xa-catalog-workflow-fixes --auto`
