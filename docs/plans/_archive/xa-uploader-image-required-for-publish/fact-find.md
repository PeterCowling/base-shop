---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: Platform
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: xa-uploader-image-required-for-publish
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/xa-uploader-image-required-for-publish/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260303200000-0138
---

# XA Uploader — Image Required for Publish Fact-Find Brief

## Scope

### Summary

The dispatch concern was that products could go live without images. Investigation confirms that image upload capability is **fully implemented** (R2 storage, upload endpoint, client UI) — but a specific bypass bug in the publish gate allows this anyway. When a staff member attempts to publish a product with no images, the server returns a 409 `would_unpublish` error, the client prompts for confirmation, and if confirmed it retries with `confirmUnpublish: true`. The server then **bypasses the guard entirely and saves the product as `publishState: "live"` without images**. The storefront renders a plain text-in-gray-box fallback in place of the image — inappropriate for a luxury brand. The fix is a targeted client-side hardening of the retry path.

### Goals

- Prevent products from being saved with `publishState: "live"` when `imageFiles` is empty.
- Ensure the publish block is enforced on both client (hard UI gate) and server (hard data gate).
- Preserve the existing `would_unpublish` confirmation for the legitimate case: removing images from an already-live product.

### Non-goals

- Image optimization, resizing, or CDN changes.
- Changes to the R2 upload endpoint or image management UI.
- Changes to the storefront's no-image fallback rendering.
- Migrating image storage off R2.
- Any other xa-uploader feature work.

### Constraints & Assumptions

- Constraints:
  - Tests run in CI only — do not run `pnpm test` locally.
  - English-only — XA uploader is an internal tool with no i18n.
  - No new API routes; fix must use existing `/api/catalog/products` route.
  - `deriveCatalogPublishState()` from `packages/lib/src/xa/catalogWorkflow.ts` is already correct — it returns `"draft"` when `imageFiles` is empty. The server must consult it authoritatively.
- Assumptions:
  - Staff can always save a product as "draft" (no images required for draft state).
  - The `would_unpublish` dialog must be preserved for the "remove images from live product" case.
  - A product with images whose `publishState: "live"` and `deriveCatalogPublishState() === "live"` can be saved normally without changes.

## Outcome Contract

- **Why:** When staff add products using the main upload workflow, products can appear live in the store without images, which looks unprofessional and loses sales — shoppers browsing a luxury fashion brand expect visuals for everything.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Products cannot go live without at least one image.
- **Source:** operator

## Access Declarations

None — investigation is entirely within the repository. No external services queried.

## Evidence Audit (Current State)

### Entry Points

| Entry Point | File | Notes |
|---|---|---|
| Save product (POST) | `apps/xa-uploader/src/app/api/catalog/products/route.ts:262–280` | Contains `wouldUnpublish` guard; bypassed when `confirmUnpublish: true` |
| Client save action | `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts:440–465` | `doSave(confirm?)` — retries with `confirmUnpublish: true` after 409 **without downgrading publishState** |
| Publish state derivation | `packages/lib/src/xa/catalogWorkflow.ts:94–101` | `deriveCatalogPublishState()` already returns `"draft"` when no images |
| Would-unpublish check | `packages/lib/src/xa/catalogWorkflow.ts:65–92` | `isPublishReady = dataReady && hasImages` — images are already in the readiness gate |

### Key Modules / Files

1. **`apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts`** — Client save action. Bug site: lines 455–465. `doSave(true)` retries with `confirmUnpublish: true` + original `publishState: "live"`.
2. **`apps/xa-uploader/src/app/api/catalog/products/route.ts`** — Server POST handler. `wouldUnpublish` guard (lines 262–280). Bypassed when `confirmUnpublish: true`.
3. **`packages/lib/src/xa/catalogWorkflow.ts`** — Contains `deriveCatalogPublishState()`, `getCatalogDraftWorkflowReadiness()`, `wouldUnpublish` logic. Already correct — `isPublishReady = dataReady && hasImages`.
4. **`packages/lib/src/xa/catalogAdminSchema.ts`** — `CatalogProductDraftInput` type; `imageFiles: string` (pipe-separated paths).
5. **`apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx`** — Form with image upload UI wired in (uses `useImageUploadController` hook + `ImageDropZone`/`MainImagePanel`/`AdditionalImagesPanel`).
6. **`apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx`** — Image upload client component. Slug required to persist uploads; buffers pending image until slug available after first save.
7. **`apps/xa-b/src/components/XaProductCard.tsx`** — Storefront card. When no `primaryImage`: renders product title as text inside a gray square (`bg-surface`). No crash, but visually broken for a luxury brand.
8. **`apps/xa-b/src/lib/xaImages.ts`** — `buildXaImageUrl(path)` returns `""` for empty/falsy paths — no fallback image URL.

### Data & Contracts

**`CatalogProductDraftInput.publishState`** field values:
- `"draft"` — not shown on storefront
- `"live"` — shown on storefront
- `"out_of_stock"` — shown but flagged

**`deriveCatalogPublishState(draft)`** logic:
```
if !getCatalogDraftWorkflowReadiness(draft).isPublishReady → return "draft"
isPublishReady = dataReady && hasImages  // images ARE required
```
The function already enforces images. The gap is that the server doesn't call it before persisting when `confirmUnpublish: true`.

**`wouldUnpublish(product)`**:
```
publishState === "live" && deriveCatalogPublishState(product) === "draft"
```

**Server guard** (route.ts line 270):
```typescript
if (!confirmUnpublish && wouldUnpublish(product)) {
  return 409;  // bypassed when confirmUnpublish: true
}
```

**The bug** (catalogConsoleActions.ts line 461):
```typescript
// After 409 would_unpublish + user confirms:
return await doSave(true);  // passes confirmUnpublish: true WITH publishState: "live"
```
The server bypasses the guard and persists `publishState: "live"` with no images.

### Dependency & Impact Map

| Layer | Component | Impact |
|---|---|---|
| Client | `catalogConsoleActions.ts:doSave` | Bug site; targeted fix |
| Server | `route.ts:wouldUnpublish` guard | Needs server-side enforcement independent of `confirmUnpublish` |
| Library | `catalogWorkflow.ts:deriveCatalogPublishState` | Already correct; no change needed |
| Storefront | `XaProductCard` | Renders gray box with title when no images; no crash |
| Storage | R2 / `buildXaImageUrl` | Returns `""` for empty paths; no crash but broken img |

Blast radius: narrow. Only `catalogConsoleActions.ts` (client) and `route.ts` (server) need changes. No schema changes. No storefront changes required.

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | `CatalogProductForm` shows `workflowImageRequired` hint when `!hasImages && dataReady && !publishReady` — but it is a text hint, not a hard block | No hard UI gate prevents the "Publish" action when no images | Client-side hard gate: disable/error publish button when `imageFiles` empty |
| UX / states | Required | Staff sees `would_unpublish` dialog; if confirmed, product goes live without images (the bug) | UX conflates "you're removing images from a live product" with "you can't publish without images" — misleading confirmation | Two distinct UX flows: (1) block publish + show "add images first" message, (2) keep confirm dialog for image-removal-from-live-product only |
| Security / privacy | N/A | Admin-only tool, session auth unchanged | No security surface change | None |
| Logging / observability / audit | Required | `uploaderLog("info", "save_start", ...)` in `catalogConsoleActions.ts`; no specific log for `would_unpublish` confirmation bypass | Would-unpublish bypass that leads to imageless publish is silent | Add structured log event when `confirmUnpublish: true` is used and product has no images |
| Testing / validation | Required | `route.test.ts` does NOT test `would_unpublish` guard or the `confirmUnpublish: true` bypass. The `branches.test.ts` variant may cover some cases (not verified). `catalogWorkflow.test.ts` covers `deriveCatalogPublishState`. | No CI test exercises the bypass bug path | Add TCs: (1) POST with `publishState: "live"`, no images, `confirmUnpublish: true` → must return downgraded state or reject; (2) client doSave retry with confirmed flag downgrades publishState |
| Data / contracts | Required | `CatalogProductDraftInput.publishState` — no schema change needed; the fix enforces existing derived-state logic at persist time | `withAutoCatalogDraftFields()` normalizes `publishState` but does not call `deriveCatalogPublishState()` — so "live" passes through even with no images | Server-side: normalize to `deriveCatalogPublishState(product)` at write time (not just at read/guard time) |
| Performance / reliability | N/A | Single synchronous state derivation; negligible overhead | None | None |
| Rollout / rollback | Required | CSS-level/server-level change; no migration | Clean git revert; no migration rollback needed | Verify CI passes before merging |

## Current Process Map

**Trigger:** Staff member opens a product in `CatalogConsole`, sets `publishState: "live"`, and clicks "Save".

**Flow today (imageless-product path — the bug):**
1. Form state: `draft.publishState = "live"`, `draft.imageFiles = ""` (no images uploaded yet)
2. `catalogConsoleActions.ts:doSave()` → POST `/api/catalog/products` body: `{ product: draft }` — no `confirmUnpublish`
3. Server: `wouldUnpublish(product)` = `true` (live AND no images) → returns `{ status: 409, error: "would_unpublish", requiresConfirmation: true }`
4. Client: shows `window.confirm("This will unpublish your product")` → staff clicks OK
5. Client: calls `doSave(true)` → POST with body: `{ product: draft, confirmUnpublish: true }` — **`draft.publishState` is STILL `"live"`**
6. Server: `confirmUnpublish = true` → **guard bypassed** → `withAutoCatalogDraftFields(draft)` → `publishState: "live"` preserved → saved to cloud
7. Cloud: product record has `publishState: "live"`, `imageFiles: ""`
8. On next sync/deploy: xa-b renders `XaProductCard` without images → gray box with title text

**Flow today (remove-image-from-live-product path — legitimate):**
1. Product is `publishState: "live"`, `imageFiles: "xa-b/slug/img.jpg"` (has images)
2. Staff removes the only image → `imageFiles = ""`
3. Same guard fires: `wouldUnpublish = true` → 409 → confirm dialog
4. **Bug: same bypass path — product stays "live" with no images**

**Expected flow (after fix):**
- If no images AND trying to publish: hard block, not a dialog ("Add at least one image before publishing")
- If already live AND removing last image: confirmation → save as "draft" (not confirm to stay live)

## Test Landscape

| Test file | What it covers | Gap for this fix |
|---|---|---|
| `apps/xa-uploader/src/app/api/catalog/products/__tests__/route.test.ts` | Product CRUD, conflict detection | Does NOT test `would_unpublish` guard or `confirmUnpublish: true` bypass |
| `apps/xa-uploader/src/app/api/catalog/images/__tests__/route.test.ts` | Upload/delete, magic bytes, rate limiting | Not affected by this fix |
| `packages/lib/src/xa/__tests__/catalogWorkflow.test.ts` | `deriveCatalogPublishState`, workflow readiness | Covers images-required logic correctly |
| `apps/xa-uploader/src/lib/__tests__/accessControl.test.ts` | IP allowlist | Not affected |
| `apps/xa-uploader/src/components/catalog/__tests__/catalogConsoleActions.test.ts` | `handleSaveImpl` tested with fetch mock + `confirmUnpublish` mock + 409 paths (B1–B3 suites) | Does NOT test `would_unpublish` confirmation-retry path — that is the gap. TC-03 (client retry publishState downgrade) can be added to the B1 suite with minimal setup |

**TCs required:**
- TC-01: POST product, `publishState: "live"`, `imageFiles: ""`, `confirmUnpublish: true` → server must return downgraded state `"draft"` OR reject (not save as "live")
- TC-02: POST product, `publishState: "live"`, `imageFiles: "xa-b/slug/x.jpg"` → saves normally
- TC-03: Client retry path (unit) — after `would_unpublish` 409 confirmed, retry payload has `publishState` downgraded to `"draft"` (not "live")

### Recent Git History (Targeted)

- `f463fe63b5` (2026-03-06): `feat(reception): migrate shade token families @theme inline` — unrelated
- `0d70286d86` (2026-03-12): BOS process improvements inbox — unrelated
- Prior xa-uploader work: `xa-uploader-media-path-and-publish-flow-hardening` (2026-03-04, Status: Complete) — hardened image path contract and improved publish-state UX, but did not close the `confirmUnpublish: true` bypass bug
- `xa-uploader-dual-upload-zones` plan exists (unarchived, Status unknown) — may have introduced the two-upload-zone UI that is now present

## Scope Signal

**Signal:** `right-sized`
**Rationale:** The fix is precisely located — two files, ~10 lines of logic change. `catalogWorkflow.ts` already has the correct derived-state logic; the server just needs to call it at persist time and the client needs to stop sending `publishState: "live"` in the retry. No schema changes, no new endpoints, no storefront changes needed. Narrow blast radius confirmed.

## Confidence Inputs

| Dimension | Score | Evidence |
|---|---|---|
| Implementation | 93% | Bug site is exactly identified (catalogConsoleActions.ts:461 + route.ts:270). Fix is ~10 lines. `deriveCatalogPublishState()` already provides the correct enforcement logic. |
| Approach | 90% | Two options (client-only vs client+server). Client-only is simpler; adding server enforcement is defense-in-depth and closes the API-bypass path. Both are low-complexity. |
| Impact | 95% | Without fix: products can go live without images, rendering gray boxes on a luxury storefront. With fix: hard gate at both layers. Blast radius is limited to the save action path. |
| Delivery-Readiness | 92% | `deriveCatalogPublishState()` is the authoritative truth; no research needed at build time. |
| Testability | 88% | Server-side TC-01 is straightforward (mock product sans images, POST with `confirmUnpublish: true`). Client-side TC-03 needs catalogConsoleActions test setup, which currently lacks coverage — doable but needs a test harness setup. |

**What reaches 80%+:** Already there. Implementation and test paths are clearly defined.
**What would reach 90%+:** Verifying `branches.test.ts` content to confirm it doesn't already cover these TCs (minor gap).

## Risks

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| `confirmUnpublish: true` is used legitimately elsewhere in a way I haven't found | Medium | Low | Grep confirms only one consumer in `catalogConsoleActions.ts`; only one server-side check. Server normalization of publishState at persist is safe regardless. |
| Downgrading publishState at server persist time changes semantics for other callers | Low | Low | Only the POST `/api/catalog/products` path is affected. GET, bulk, and sync routes are unaffected. |
| Client-side hard UI gate breaks the "remove images from live product" confirmation flow | Medium | Low | The two cases must be distinguished: (1) no-images-trying-to-publish → hard block; (2) removing-images-from-live → keep confirm-to-downgrade dialog |
| TC-03 client retry test does not yet exist | Low | Low | `catalogConsoleActions.test.ts` has a full harness (`handleSaveImpl` + fetch mock + `confirmUnpublish` mock) — TC-03 can be added to the B1 suite. Effort: Low |

## Evidence Gap Review

### Gaps Addressed

- Confirmed image upload IS implemented (R2 endpoint, client UI, storefront CDN rendering).
- Confirmed the dispatch's original concern about "sync not uploading images" is already resolved by the R2 implementation.
- Precisely identified the remaining gap: the `confirmUnpublish: true` server bypass.
- Confirmed `deriveCatalogPublishState()` already has the correct enforcement logic.
- Confirmed storefront fallback (title-in-gray-box) exists but is inadequate for a luxury brand.
- Confirmed test coverage gap: no test for `confirmUnpublish: true` bypass path.

### Confidence Adjustments

No downward adjustments. The gap is precisely located, the fix is well-bounded, and the existing `deriveCatalogPublishState()` provides the authoritative enforcement logic already.

### Remaining Assumptions

- The `confirmUnpublish` flag is not used anywhere else in xa-uploader beyond `catalogConsoleActions.ts` — confirmed by grep.
- `withAutoCatalogDraftFields()` does not already normalize `publishState` to the derived state (if it did, the server fix would be a one-liner before that call). Unverified — safe to check at build time.

## Analysis Readiness

The fact-find is ready for analysis. All minimum evidence requirements are met:

- Entry points and bug site exactly identified with line references
- Fix direction established: client-side publishState downgrade + server-side normalization via `deriveCatalogPublishState()`
- Engineering Coverage Matrix complete with all canonical rows addressed
- Test landscape mapped; existing test harness confirmed in `catalogConsoleActions.test.ts`
- Three concrete TCs defined (TC-01 server guard, TC-02 happy path, TC-03 client retry)
- Blast radius confirmed narrow: two files, ~10 lines total

No operator-only unknowns remain. Critique round 1 complete (score 4.0, verdict credible, 4 fixes applied).

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Bug site (catalogConsoleActions.ts:461) | Yes | None | No |
| Server guard (route.ts:270) | Yes | None | No |
| `deriveCatalogPublishState` authoritativeness | Yes | None | No |
| Test landscape (would_unpublish path) | Partial | [Missing Coverage] [Advisory]: `route.test.ts` has no TC for `confirmUnpublish: true` bypass | No — planned as TC-01..TC-03 in build |
| Storefront impact (XaProductCard) | Yes | None | No |
| Two-case UX distinction (no-images vs remove-from-live) | Yes | [UX Conflation] [Advisory]: current dialog message conflates the two scenarios | No — addressed in fix design |

No blocking rehearsal findings.
