---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Product
Workstream: Engineering
Created: 2026-03-03
Last-updated: 2026-03-03
Feature-Slug: xa-uploader-auto-save-after-image
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/xa-uploader-auto-save-after-image/plan.md
Trigger-Why: When a user uploads an image via the catalog form, the form data is not auto-saved. This means the product can be in a state where images exist in R2 but the catalog entry is still "draft" with unsaved field changes. If the user navigates away after uploading images but before saving, the form data is lost while the R2 objects persist as orphans.
Trigger-Intended-Outcome: type: operational | statement: After a successful image upload, the catalog form auto-saves the current draft state so that product data and images stay in sync. No data loss on navigation after image upload. | source: operator
Dispatch-ID: IDEA-DISPATCH-20260304001500-0228
---

# XA Uploader Auto-Save After Image Upload — Fact-Find Brief

## Scope

### Summary

The xa-uploader catalog form requires manual "Save Details" clicks. When a user uploads an image, the R2 object is created immediately, but the draft (which now includes the image reference) is only in React state. Navigating away loses the draft, orphaning the R2 object. This fact-find covers adding auto-save behavior after successful image uploads.

### Goals

- Trigger an automatic save of the current draft after a successful image upload
- Ensure product data and image references stay in sync
- Prevent R2 object orphaning from unsaved navigations after upload

### Non-goals

- R2 object lifecycle/cleanup (separate dispatch 0230)
- Image preview thumbnails or alt text improvements (separate dispatch 0231)
- General auto-save/debounce on all form field changes (out of scope — only image upload triggers)

### Constraints & Assumptions

- **HARD CONSTRAINT — Cloudflare free tier ONLY:** Workers 100K req/day, 10ms CPU, 128MB memory. R2: 10GB storage, 1M Class A writes/month, 10M Class B reads/month, zero egress.
- **CONSTRAINT — Step 2 gating ensures non-image data validity only:** `CatalogProductForm` gates Step 2 (images) behind `isDataReady` from `getCatalogDraftWorkflowReadiness()`. All required non-image product fields must be valid before images can be uploaded. However, `normalizeForDataValidation()` (`catalogWorkflow.ts:16`) blanks out image fields before validation — `isDataReady` does NOT validate image roles. Two issues affect auto-save: (1) **Pre-existing image role mismatch:** UI roles `["front", "side", "top", "detail", "lifestyle", "packaging"]` (`CatalogProductImagesFields.client.tsx:12`) vs schema `["front", "side", "top", "back", "detail", "interior", "scale"]` (`catalogAdminSchema.ts:33`). `lifestyle`/`packaging` fail validation. (2) **Category-specific required roles:** `requiredImageRolesByCategory()` (`catalogAdminSchema.ts:36`) requires role sets per category (clothing: `front`+`side`, bags: `front`+`side`+`top`, default: `front`+`side`+`detail`). Auto-save after a single upload can fail when required roles are incomplete.
- **CONSTRAINT — Optimistic concurrency:** Save uses ETag-based `ifMatch` headers. Auto-save must respect the existing concurrency model — use current `draftRevision` and update it from the response.
- Assumption: Single-user editing (no concurrent editors for the same product). Low risk given xa-uploader is an internal tool.

## Outcome Contract

- **Why:** When a user uploads an image via the catalog form, the form data is not auto-saved. This means the product can be in a state where images exist in R2 but the catalog entry is still "draft" with unsaved field changes. Navigating away after upload loses the draft and orphans the R2 object.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** After a successful image upload, the catalog form auto-saves the current draft state so that product data and images stay in sync. No data loss on navigation after image upload.
- **Source:** operator

## Access Declarations

None — all changes are within the xa-uploader codebase. No external services needed.

## Evidence Audit (Current State)

### Entry Points

- `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx` — image upload handler; appends R2 key to draft in-memory
- `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts:handleSaveImpl()` — manual save action

### Key Modules / Files

1. `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx` — Upload handler calls `POST /api/catalog/images`, gets R2 key back, appends to draft `imageFiles|imageRoles|imageAltTexts` (pipe-delimited), then calls `onChange()`. No save triggered.
2. `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts` — `handleSaveImpl()` validates draft via Zod schema, POSTs to `/api/catalog/products` with `ifMatch` ETag, reloads catalog on success. All saves are explicit button clicks via `handleSave`.
3. `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx` — Two-step form (Step 1: product data, Step 2: images). Step 2 locked until `isDataReady`. Receives `onSave` prop but doesn't call it automatically.
4. `apps/xa-uploader/src/components/catalog/catalogDraft.ts` — Draft structure templates (`EMPTY_DRAFT`, `buildEmptyDraft`, `withDraftDefaults`). No auto-save or persistence logic.
5. `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx` — Orchestrates form, passes `handleSave` from `useCatalogConsole` hook down as prop.
6. `apps/xa-uploader/src/app/api/catalog/images/route.ts` — Image upload API. Returns `{ ok: true, key: "..." }` on success. Does not trigger any product save.
7. `apps/xa-uploader/src/app/api/catalog/products/route.ts` — Product save API. POST creates/updates with ETag concurrency.

### Patterns & Conventions Observed

- **Manual save only:** All saves require explicit "Save Details" button click. No auto-save or debounce anywhere in the codebase.
- **Optimistic concurrency:** ETag `ifMatch` headers on save. `draftRevision` state tracks current ETag. Updated from save response.
- **Busy lock:** `busyLockRef.current` prevents concurrent actions. Auto-save must respect this lock.
- **Pipe-delimited image fields:** `imageFiles`, `imageRoles`, `imageAltTexts` are pipe-delimited strings. This is the existing convention.
- **Step gating:** Step 2 (images) requires `isDataReady` — all non-image fields valid. `normalizeForDataValidation()` (`catalogWorkflow.ts:16`) blanks out `imageFiles`/`imageRoles`/`imageAltTexts` before checking, so `isDataReady` does NOT validate image fields. The full Zod schema used by `handleSaveImpl()` validates image roles (allowed set + category-specific required roles). This means auto-save can fail on image role validation even when `isDataReady` is true.
- **Feedback system:** `actionFeedback.draft` shows success/error messages. Auto-save should use this existing feedback channel.

### Dependency & Impact Map

- **Upstream:** Image upload response (`{ ok: true, key }`) triggers draft update; draft update should trigger auto-save.
- **Downstream:** Product save API persists draft; loadCatalog refreshes product list; ETag updated.
- **Blast radius:** Small — one new callback prop or effect in the image upload flow. No API changes needed.
- **Free tier impact:** Each image upload triggers one additional product save (POST to products API). At XA usage levels (~10-50 products, ~2-5 images each), this adds negligible load — well under 1K extra requests/month vs 100K/day limit.

### Test Landscape

- **API routes:** Excellent coverage (9 test cases for image upload, 20+ for product save)
- **catalogConsoleActions.ts:** No direct unit tests, but action handlers (`handleSave`, save flows) have indirect coverage through hook tests (`useCatalogConsole-domains.test.tsx`, `action-feedback.test.tsx`)
- **CatalogProductForm:** No component tests
- **CatalogProductImagesFields:** No component tests
- **E2E:** 3 Playwright tests (TC-09-01, TC-09-02, TC-09-03) cover happy path (login → create → save → sync). Does not cover image upload path.
- **Testing pattern:** Jest + React Testing Library, `@jest-environment jsdom` for components, fetch mocks via `global.fetch = jest.fn()`
- **Test runner:** `pnpm test` via governed runner; jest.config.cjs with shared preset

### Recent Git History (Targeted)

- `2c164f6f37` (2026-03-03): R2 binding + image upload API route committed
- `1437506405` (2026-03-03): Upload UI + xa-b URL config committed
- `de51b6971c` (2026-03-03): R2 image URL env var added to CI build step

## Questions

### Resolved

- Q: Does the image upload flow guarantee required fields are filled?
  - A: Yes. Step 2 (images) is gated behind `isDataReady` from `getCatalogDraftWorkflowReadiness()`. All required fields must be valid before the user can access the upload UI.
  - Evidence: `CatalogProductForm.client.tsx` — Step 2 `disabled={!readiness.isDataReady}`

- Q: Can auto-save conflict with manual save?
  - A: Low risk. The `busyLockRef` prevents concurrent actions. Auto-save should check this lock before proceeding and skip if busy.
  - Evidence: `catalogConsoleActions.ts` — all handlers check `busyLockRef.current` before executing

- Q: Are UI image roles aligned with schema validation?
  - A: No. **Pre-existing mismatch.** UI roles (`CatalogProductImagesFields.client.tsx:12`): `["front", "side", "top", "detail", "lifestyle", "packaging"]`. Schema roles (`catalogAdminSchema.ts:33`): `["front", "side", "top", "back", "detail", "interior", "scale"]`. Two UI roles (`lifestyle`, `packaging`) are absent from schema and will fail Zod validation. Three schema roles (`back`, `interior`, `scale`) are absent from UI and cannot be selected. This must be fixed as a prerequisite to auto-save.
  - Evidence: Direct inspection of both files

- Q: Does the save API need changes?
  - A: No. `handleSaveImpl()` already handles both create (new product) and update (existing product). Auto-save calls the same path.
  - Evidence: `catalogConsoleActions.ts:handleSaveImpl()` — uses POST with `ifMatch` for both cases

## Confidence Inputs

- **Implementation:** 85% — Adding an `onSave` callback to the image upload success path. The plumbing exists (handleSave is already passed as prop). Reduced from 90% because: (1) image role mismatch must be fixed first, (2) category-specific required roles mean partial uploads can fail full schema validation.
- **Approach:** 85% — Triggering save after image upload is the simplest approach, but the validation path needs design: `handleSaveImpl()` uses the full Zod schema which enforces category-specific required roles. Auto-save after each individual upload may fail when required roles are incomplete (e.g. clothing needs `front`+`side`). Options: skip validation on auto-save, use relaxed validation, or accept+handle failures gracefully. Reduced from 95% due to validation complexity.
- **Impact:** 90% — Directly prevents data loss after image upload. The only scenario where auto-save fails is if the product save API is down, which is visible via existing error feedback.
- **Testability:** 80% — CatalogProductImagesFields has no existing tests, so testing the auto-save behavior requires new test setup. API route tests exist and can verify the save side.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Auto-save races with manual save | Very Low | Low — busy lock prevents concurrent saves | Check busyLockRef before auto-save; skip if busy |
| Auto-save fails silently | Low | Medium — user thinks save happened | Use existing actionFeedback to show save result |
| ETag conflict after auto-save | Very Low | Low — only possible with concurrent editors | Single-user tool; conflict would be visible as 409 |
| Image role mismatch blocks auto-save | High (pre-existing) | High — selecting `lifestyle` or `packaging` role causes Zod validation failure on save | Fix UI roles to match schema roles as a prerequisite or parallel task. UI: `["front", "side", "top", "detail", "lifestyle", "packaging"]`; Schema: `["front", "side", "top", "back", "detail", "interior", "scale"]` |
| Category-specific required roles fail on partial uploads | Medium | Medium — schema requires category-specific roles (clothing: `front`+`side`, bags: `front`+`side`+`top`, default: `front`+`side`+`detail`). Auto-save after first image upload fails if required roles are incomplete. | Auto-save must either (a) skip the full Zod validation and use a relaxed check, (b) only trigger after leaving the images section, or (c) accept and handle validation failures gracefully via feedback |

## Scope Signal

- **Signal:** right-sized
- **Rationale:** Two small changes: (1) align UI image roles with schema, (2) trigger existing save mechanism after image upload success. No new APIs, no architectural changes, no new dependencies. Validation strategy for partial uploads is the main design question for planning. Free tier impact is negligible.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Draft state management | Yes | None | No |
| Save mechanism | Yes | None | No |
| Image upload flow | Yes | [Domain] Major: UI image roles `lifestyle`/`packaging` not in Zod schema — validation rejects on save | Yes — prerequisite fix |
| Form step gating | Partial | Step gating covers required fields but NOT image role validity | Yes — addressed by role alignment fix |
| Test landscape | Yes | None | No |
| Free tier impact | Yes | None | No |

## Planning Constraints & Notes

- **Must-follow patterns:**
  - Use existing `handleSave` mechanism — do not create a separate save path
  - Respect `busyLockRef` concurrency lock
  - Use existing `actionFeedback` for save result display
- **Rollout/rollback expectations:**
  - Fully additive — no existing behavior changed. Auto-save is an additional action after image upload.
  - Rollback: remove the auto-save trigger. No data impact.

## Suggested Task Seeds (Non-binding)

1. **IMPLEMENT: Align UI image roles with schema** — Update `IMAGE_ROLES` in `CatalogProductImagesFields.client.tsx` to match `allowedImageRoles` in `catalogAdminSchema.ts`. Remove `lifestyle`/`packaging`, add `back`/`interior`/`scale`. Prerequisite for auto-save — without this, selecting unsupported roles causes validation failure on save.
2. **IMPLEMENT: Add auto-save after image upload with graceful validation handling** — After successful image upload in `CatalogProductImagesFields`, trigger save. Must handle the case where category-specific required roles (`requiredImageRolesByCategory`) are not yet complete — auto-save after each upload would fail full Zod validation. Recommended approach: auto-save uses a relaxed validation that skips required-role checks (since more uploads are expected), or catches validation errors and shows informative feedback without blocking the upload flow. Respect busy lock. Depends on task 1.

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package: Auto-save triggered after image upload; draft persisted with image references; busy lock respected; feedback shown
- Post-delivery measurement plan: Manual verification — upload image, navigate away, return, confirm product data persisted with image reference

## Evidence Gap Review

### Gaps Addressed

- Confirmed Step 2 gating ensures required fields are valid for auto-save
- Confirmed busy lock pattern prevents concurrent save races
- Confirmed save mechanism works for both create and update (no API changes needed)
- **Discovered pre-existing image role mismatch** — UI roles `lifestyle`/`packaging` not in schema; schema roles `back`/`interior`/`scale` not in UI. Must be fixed as prerequisite.

### Confidence Adjustments

- Implementation: 90% → 85% (image role mismatch + partial upload validation)
- Approach: 95% → 85% (full Zod validation includes category-specific required roles that fail on partial uploads; validation strategy needs design decision)

### Remaining Assumptions

- Single-user editing (no concurrent editors) — reasonable for internal tool
- Free tier limits not approached by auto-save additions — confirmed by usage analysis

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: Image role mismatch must be addressed in plan (prerequisite or parallel task, not a blocker on planning itself)
- Recommended next step: `/lp-do-plan xa-uploader-auto-save-after-image --auto`
