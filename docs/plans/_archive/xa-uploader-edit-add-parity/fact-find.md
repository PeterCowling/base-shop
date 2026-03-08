---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-04
Last-updated: 2026-03-04
Feature-Slug: xa-uploader-edit-add-parity
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Loop-Gap-Trigger: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/xa-uploader-edit-add-parity/plan.md
artifact: fact-find
direct-inject: false
dispatch-routed: IDEA-DISPATCH-20260304150000-0001
---

# XA Uploader Edit/Add Data Parity Fact-Find Brief

## Scope

### Summary
The xa-uploader catalog editor's Edit mode (Revise Existing tab) doesn't faithfully round-trip product data. When loading an existing product for editing, fields get overwritten by defaults, selectors show stale values, auto-derivation clobbers manual edits, and timestamps are reset. Eight specific data-field discrepancies have been identified between Add (New Product) and Edit (Revise Existing) flows.

### Goals
- Make Edit mode a faithful editor of what Add/Save-as-Draft produces.
- Ensure product data round-trips correctly through save → load → edit → save.
- Fix stale form state when switching between products in the product list.

### Non-goals
- Image fields (separate scope — CatalogProductImagesFields).
- Schema changes to CatalogProductDraftInput.
- New runtime endpoints (Cloudflare free tier constraint).
- Redesigning the Add flow or brand registry.

### Constraints & Assumptions
- Constraints:
  - Data fields only — images out of scope.
  - No schema changes to `CatalogProductDraftInput` type.
  - Cloudflare free tier (no new runtime endpoints).
  - xa-b is the sole active storefront target.
- Assumptions:
  - Hermès is currently the only brand in the registry but custom brands must work.
  - The `withAutoCatalogDraftFields()` function is called on the CSV save path (via `catalogCsvMapping.ts:87`) but NOT on the cloud save path (`upsertProductInCloudSnapshot` skips it).
  - The server always overrides `publishState` via `derivePublishState()`.

## Outcome Contract

- **Why:** The catalog editor's Edit mode doesn't faithfully round-trip product data — fields get overwritten, reset, or stuck after save/reload, making the editor unreliable for revising existing products.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Fix the 3 confirmed data-field bugs so Edit mode is a faithful editor of what Add/Save-as-Draft produces: brand/collection selectors sync on product switch, auto-derivation respects existing edits in Edit mode, and bag taxonomy fields are editable rather than read-only. (5 other reported issues verified as non-bugs or future concerns.)
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points
- `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx:229` — main console; switches between New/Revise/Currency screens.
- `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx:91` — two-step wizard (product data → images).
- `apps/xa-uploader/src/app/api/catalog/products/route.ts:115` — POST handler that saves products.

### Key Modules / Files
1. `apps/xa-uploader/src/components/catalog/CatalogProductBaseFields.client.tsx` — form fields: BrandCollectionSelectors, SizeSelector, MaterialColorSelectors, TaxonomyFields, CommercialFields. **Issues 1, 2, 6, 7.**
2. `apps/xa-uploader/src/components/catalog/catalogDraft.ts` — `EMPTY_DRAFT`, `EMPTY_TAXONOMY`, `withDraftDefaults()`, `buildEmptyDraft()`. **Issues 4, 5.**
3. `packages/lib/src/xa/catalogWorkflow.ts` — `withAutoCatalogDraftFields()`, `getCatalogDraftWorkflowReadiness()`. **Issues 3, 8.**
4. `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx` — form wrapper, step management. **Issue 1 fix location.**
5. `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts` — `handleSelectImpl()` (loads product with `withDraftDefaults()`), `handleSaveImpl()` (validates + POSTs).
6. `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts` — state hook composing auth, draft, and sync handlers.
7. `apps/xa-uploader/src/lib/catalogBrandRegistry.ts` — `XA_BRAND_REGISTRY`, `findBrand()`, `findCollection()`, `CUSTOM_BRAND_HANDLE`, `CUSTOM_COLLECTION_HANDLE`.
8. `apps/xa-uploader/src/app/api/catalog/products/route.ts` — server-side save: `derivePublishState()` overrides `publishState`. Note: `withAutoCatalogDraftFields()` is called on CSV path only (via `catalogCsvMapping.ts:87`), not on cloud path (`upsertProductInCloudSnapshot` skips it).

### Patterns & Conventions Observed
- Draft state is managed in `useCatalogConsole` as `[draft, setDraft]` React state — evidence: `useCatalogConsole.client.ts`.
- All form components receive `onChange: (next: CatalogProductDraftInput) => void` and produce immutable spread updates — evidence: `CatalogProductBaseFields.client.tsx:31`.
- Brand/collection selectors use local `useState` for dropdown values, separate from the parent `draft` state — evidence: `CatalogProductBaseFields.client.tsx:188-193`.
- Save pipeline: client validates → POST → server applies `derivePublishState()` → CSV/cloud upsert — evidence: `catalogConsoleActions.ts:258-293`, `route.ts:174-177`.
- Product selection loads via `handleSelectImpl()` which applies `withDraftDefaults()` — evidence: `catalogConsoleActions.ts:112`.

### Data & Contracts
- Types/schemas:
  - `CatalogProductDraftInput` — Zod-validated schema at `packages/lib/src/xa/catalogAdminSchema.ts`. All form data conforms to this type.
  - `catalogProductDraftSchema` — Zod schema used for validation before save (`catalogConsoleActions.ts:244`).
- Persistence:
  - Local: CSV file via `catalogCsv.ts` (when `isLocalFsRuntimeEnabled()`).
  - Cloud: D1/R2 via `catalogDraftContractClient.ts`.
- API contracts:
  - POST `/api/catalog/products` — accepts `{ product, ifMatch?, confirmUnpublish? }`, returns `{ ok, product, revision }`.
  - Server always overrides `publishState` via `derivePublishState()` (line 176).

### Dependency & Impact Map
- Upstream dependencies:
  - `@acme/lib/xa/catalogAdminSchema` — type definitions, Zod schema, `slugify()`, `splitList()`, `joinList()`.
  - `@acme/lib/xa/catalogWorkflow` — `withAutoCatalogDraftFields()`, `getCatalogDraftWorkflowReadiness()`.
  - `catalogBrandRegistry.ts` — brand/collection lookup functions.
- Downstream dependents:
  - `CatalogProductForm` renders `CatalogProductBaseFields` (+ category-specific fields).
  - `CatalogConsole` orchestrates screen routing and save callbacks.
  - Server route consumes the draft produced by the form.
  - xa-b storefront reads the persisted catalog data.
- Likely blast radius:
  - Changes to `catalogDraft.ts` (`withDraftDefaults`, `EMPTY_DRAFT`) affect every product load path.
  - Changes to `catalogWorkflow.ts` (`withAutoCatalogDraftFields`) affect the CSV save path (local runtime); cloud path is unaffected.
  - Adding `key` to form affects component remounting (intentional).
  - Changes to `TaxonomyFields` affect form rendering for bags category only.

### Test Landscape

#### Test Infrastructure
- Framework: Jest (governed test runner via `pnpm -w run test:governed`).
- Tests run in CI only (never locally per `docs/testing-policy.md`).
- 6 existing test files in `apps/xa-uploader/src/components/catalog/__tests__/`.

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Console domains | Unit | `useCatalogConsole-domains.test.tsx` | Tests storefront switching, not edit data flow |
| Action feedback | Unit | `action-feedback.test.tsx` | Tests feedback state transitions |
| Error localization | Unit | `error-localization.test.tsx` | Tests i18n error messages |
| Console utils | Unit | `catalogConsoleUtils.test.ts` | Tests log block formatting |
| Currency panel | Unit | `CurrencyRatesPanel.test.tsx` | Tests currency rate UI |
| Sync feedback | Unit | `sync-feedback.test.tsx` | Tests sync error messages |

#### Coverage Gaps
- **No tests for `withDraftDefaults()`** — the exact function causing issues 4 and 5.
- **No tests for `withAutoCatalogDraftFields()`** — the exact function causing issues 3 and 8.
- **No tests for `BrandCollectionSelectors` state management** — the component causing issue 1.
- **No tests for `SizeSelector` auto-derivation** — the component causing issue 2.
- **No tests for `TaxonomyFields` rendering** — the component causing issue 6.

#### Testability Assessment
- Easy to test:
  - `withDraftDefaults()` — pure function, no DOM needed.
  - `withAutoCatalogDraftFields()` — pure function, no DOM needed.
  - `maybeRegenerateDerived()` — pure function (not exported, but could be).
- Hard to test:
  - `BrandCollectionSelectors` local `useState` — needs full component rendering.
  - Product switching in Edit mode — needs the full `CatalogConsole` + `CatalogProductsList` interaction.

#### Recommended Test Approach
- Unit tests for: `withDraftDefaults()`, `withAutoCatalogDraftFields()` round-trip fidelity.
- Integration tests for: not needed for this scope — pure function fixes + key prop.

### Recent Git History (Targeted)
- `449300b538` — `feat(xa-uploader): auto-save after image upload + align image roles with schema` — recent image-related change, not data fields.
- `1437506405` — `feat(xa-uploader): add image upload UI + xa-b R2 base URL config (Wave 2)` — image upload, not data.
- `6bfccb1c63` — `fix(xa): restore catalog workflow modules and schema parity` — restored `catalogWorkflow.ts` after module reorganization. Confirms `withAutoCatalogDraftFields()` is the canonical pre-save function.
- `0ad6941c6e` — `fix(xa-uploader): remove dead submission code, add unpublish protection, console header, sync confirm fix` — added the `wouldUnpublish()` check and console header. Confirms the unpublish protection exists.
- `ca2eae42cc` — `refactor catalog form panels into smaller components` — split `CatalogProductBaseFields` into sub-components. This is when `BrandCollectionSelectors`, `SizeSelector`, `TaxonomyFields` etc. were created.

## Verified Issues (8 Data-Field Discrepancies)

### Issue 1: Brand/Collection selectors show stale values on product switch
- **Location:** `CatalogProductBaseFields.client.tsx:188-193`
- **Root cause:** `BrandCollectionSelectors` uses `useState(() => deriveInitialBrandSelection(draft.brandHandle))` — initializer only runs on mount. When switching products in Edit mode, the draft prop changes but the dropdown local state remains from the previous product.
- **Impact:** Dropdowns show wrong brand/collection when switching between products.
- **Fix:** Add `key={selectedSlug ?? "new"}` to `CatalogProductForm` to force remount on product switch. This is the simplest fix — it ensures all local `useState` inside the form tree re-initializes.

### Issue 2: Size selection silently overwrites title/description
- **Location:** `CatalogProductBaseFields.client.tsx:114-157` (`SizeSelector.handleChange`)
- **Root cause:** When a size is selected and brand/collection have registry matches, lines 135-145 always overwrite `title`, `slug`, `description`, and `popularity` via `generateTitle()`/`generateDescription()`.
- **Impact:** In Edit mode, selecting a size (or re-selecting the current size) clobbers manually-edited title and description.
- **Fix:** Only auto-derive these fields when the product is new (`selectedSlug === null`). In Edit mode, only update size-specific fields (dimensions, whatFits, strapDrop).

### Issue 3: createdAt timestamp reset on every save
- **Location:** `packages/lib/src/xa/catalogWorkflow.ts:32-35`
- **Root cause:** `withAutoCatalogDraftFields()` replaces empty `createdAt` with `nowIso`. But `withDraftDefaults()` merges `EMPTY_DRAFT` (which has `createdAt: ""`) under the loaded product. If the product's `createdAt` comes through as `undefined` (not `""`) it gets overwritten to `""` by the merge, then to a new timestamp by the save function.
- **Verification:** Looking at the code more carefully, `withDraftDefaults()` line 90: `{ ...EMPTY_DRAFT, ...product }`. If `product.createdAt` is present and non-empty, the spread preserves it. The issue only occurs if `createdAt` is missing from the loaded product (undefined). The `EMPTY_DRAFT.createdAt` is `""`, which then triggers the `nowIso` fallback in `withAutoCatalogDraftFields()`.
- **Severity:** Low — only affects products loaded without a `createdAt` field. The CSV/cloud storage should always have `createdAt`. Re-classified as **minor** — not a blocking bug, but the function should be defensive.

### Issue 4: Taxonomy merge resets optional fields to empty strings
- **Location:** `catalogDraft.ts:99` — `{ ...EMPTY_TAXONOMY, ...(product.taxonomy ?? {}) }`
- **Root cause:** `EMPTY_TAXONOMY` has all fields set to empty strings (lines 2-26). When loading an existing product, the spread `{ ...EMPTY_TAXONOMY, ...product.taxonomy }` correctly prefers product values over empty defaults. Fields genuinely missing from the product get `""`.
- **Verification:** This is actually correct behaviour — it ensures all taxonomy keys exist on the draft object so form inputs don't crash on `undefined`. The issue would only manifest if a field was intentionally deleted (set to `undefined`) vs left as `""` — but the CSV/schema always stores `""`.
- **Re-assessment:** **Not a real bug.** The EMPTY_TAXONOMY spread is defensive and correct. Downgraded to informational.

### Issue 5: EMPTY_DRAFT bleeds brandHandle:"hermes" into all products
- **Location:** `catalogDraft.ts:46-47` — `brandHandle: "hermes"`, `brandName: "Hermès"`
- **Root cause:** `EMPTY_DRAFT` hardcodes `brandHandle: "hermes"` and `brandName: "Hermès"`. In `withDraftDefaults()` line 90: `{ ...EMPTY_DRAFT, ...product }` — if the loaded product has `brandHandle` set (even to `""`), it wins. But `buildEmptyDraft()` also uses `...EMPTY_DRAFT`, meaning every new product starts with Hermès pre-selected.
- **Verification:** For Edit mode, the loaded product always has `brandHandle` set (from CSV/cloud), so the EMPTY_DRAFT value doesn't bleed in Edit mode. For Add mode, starting with Hermès is intentional — it's the only brand in the registry currently.
- **Re-assessment:** **Not a bug in Edit mode.** In Add mode, the default is intentional for current use. If multiple brands are added later, `EMPTY_DRAFT.brandHandle` should become `""`. Downgraded to **future concern**, not current fix.

### Issue 6: Bag taxonomy fields are read-only in both modes (editability gap)
- **Location:** `CatalogProductBaseFields.client.tsx:558-640` (`TaxonomyFields`)
- **Root cause:** Fields like department, category, strapStyle, closureType, interior, whatFits, dimensions, strapDrop are rendered as `<div className="opacity-60">` — read-only display. These are populated by collection defaults when a collection is selected but cannot be manually overridden in either Add or Edit mode.
- **Impact:** An operator cannot correct a wrong strap style, closure type, or interior description. The values are locked to collection defaults. This is a UX editability gap affecting both flows, not strictly an Add-vs-Edit parity issue.
- **Fix:** Convert the read-only `<div>` elements to editable `<input>` fields, using the same pattern as `subcategory` (line 579-595) which is already editable with a disabled state when collection defaults exist. Default to collection value but allow override.

### Issue 7: Category change doesn't clear stale taxonomy fields
- **Root cause:** The form doesn't clear category-specific fields when switching categories. If a bag product has `strapStyle: "crossbody"` and the operator changes category to `clothing`, the strapStyle remains in the draft object.
- **Verification:** Looking at the form structure, category is rendered as a hardcoded `<div>` showing "Bags" (line 576). There's no category selector — the category is fixed per taxonomy section. Category switching is not currently a user-facing operation.
- **Re-assessment:** **Not a bug** — category is not editable in the current UI. The TaxonomyFields component always shows bags-category fields. Downgraded to informational.

### Issue 8: forSale/forRental forced on every save
- **Location:** `packages/lib/src/xa/catalogWorkflow.ts:40-41`
- **Root cause:** `withAutoCatalogDraftFields()` always sets `forSale: true` and `forRental: false`, ignoring any operator edits.
- **Impact:** Products always save as `forSale: true`. If an operator wanted to mark a product as not-for-sale, it would be overwritten.
- **Verification:** There is no UI to edit `forSale`/`forRental` — these fields have no form inputs. The forced values match the only currently-supported use case.
- **Re-assessment:** **Not a current bug** — no UI exposes these fields, and the forced values are correct for the current use case. If rental support is added later, the function should be updated. Downgraded to **future concern**.

## Confirmed Fixes (3 actual issues)

After evidence verification, 3 of the 8 reported issues are confirmed bugs requiring fixes:

| # | Issue | Severity | File | Fix approach |
|---|---|---|---|---|
| 1 | Stale brand/collection selectors on product switch | High | `CatalogProductForm.client.tsx` | Add `key={selectedSlug ?? "new"}` to form component |
| 2 | Size selection overwrites title/description in Edit | Medium | `CatalogProductBaseFields.client.tsx` | Guard auto-derivation with `selectedSlug === null` check |
| 6 | Bag taxonomy fields read-only (both modes) | Medium | `CatalogProductBaseFields.client.tsx` | Convert `<div>` to `<input>` fields |

The other 5 issues were either not bugs (correct defensive behaviour), not applicable (no UI for the field), or future concerns.

## Scope Signal

- **Signal:** right-sized
- **Rationale:** Three confirmed bugs with clear root causes in 2 files. Fix approaches are straightforward (key prop, conditional guard, div-to-input conversion). No schema changes, no new endpoints, no cross-app impact.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| BrandCollectionSelectors state (Issue 1) | Yes | None | No |
| SizeSelector auto-derivation (Issue 2) | Yes | None | No |
| withDraftDefaults merge (Issues 4, 5) | Yes | Not bugs after verification | No |
| withAutoCatalogDraftFields (Issues 3, 8) | Yes | Minor/future only | No |
| TaxonomyFields rendering (Issue 6) | Yes | None | No |
| Category switching (Issue 7) | Yes | Not applicable — no category selector | No |
| Server-side save flow | Yes | None — server always overrides publishState correctly | No |
| Test landscape coverage | Yes | [Scope gap] [Moderate]: No tests for withDraftDefaults or form state management | No — test gap noted for planning |

## Questions

### Resolved
- Q: Does `withDraftDefaults()` overwrite existing product data during Edit load?
  - A: No — `{ ...EMPTY_DRAFT, ...product }` correctly prefers product values. The spread is defensive.
  - Evidence: `catalogDraft.ts:90`

- Q: Are `forSale`/`forRental` editable in the UI?
  - A: No — no form inputs expose these fields. The forced values in `withAutoCatalogDraftFields()` are correct for current use.
  - Evidence: Searched all form components — no input for these fields.

- Q: Is category changeable in Edit mode?
  - A: No — `TaxonomyFields` renders category as a hardcoded "Bags" div. No category selector exists.
  - Evidence: `CatalogProductBaseFields.client.tsx:574-577`

### Open (Operator Input Required)
None — all questions resolved from code evidence.

## Confidence Inputs
- Implementation: 90% — all three fixes are straightforward: key prop (1 line), conditional guard (add `selectedSlug` parameter check), div-to-input conversion (6-7 elements). All changes are in 2 files.
- Approach: 95% — `key` prop for form remount is a standard React pattern. Guarding auto-derivation with an isNew check is a clean, minimal approach. Converting div-to-input follows existing subcategory pattern.
- Impact: 85% — fixes the three confirmed data-parity issues. 5 other reported issues verified as non-bugs.
- Delivery-Readiness: 90% — no dependencies, no schema changes, no new APIs. All fixes are client-side React component changes.
- Testability: 75% — pure function tests are easy. Component state tests (BrandCollectionSelectors remount) need full render but are achievable. Would reach 85% with `withDraftDefaults()` round-trip tests.

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `key` prop causes unwanted side effects (loses unsaved form state on product switch) | Low | Medium | This is the intended behaviour — switching products should always reload fresh state |
| Auto-derivation guard breaks Add flow | Low | High | Guard uses `selectedSlug === null` which is only true for New Product. Revise mode always has a slug. |
| Converting TaxonomyFields to editable may allow invalid taxonomy values | Medium | Low | Values are freeform text already (subcategory uses `slugify()`). No validation change needed. |

## Planning Constraints & Notes
- Must-follow patterns:
  - Form components use `onChange: (next: CatalogProductDraftInput) => void` pattern.
  - All form inputs use `INPUT_CLASS` and `SELECT_CLASS` styling constants.
  - Test stubs must use `test.todo()` or `it.skip()` (no failing tests in planning).
- Rollout/rollback: No deployment needed — xa-uploader runs locally.
- Observability: N/A — internal operations tool.

## Suggested Task Seeds (Non-binding)
1. **IMPLEMENT** — Add `key` prop to `CatalogProductForm` for form remount on product switch. Guard SizeSelector auto-derivation to only run on new products.
2. **IMPLEMENT** — Convert TaxonomyFields read-only divs to editable inputs.
3. **IMPLEMENT** — Add unit tests for `withDraftDefaults()` round-trip fidelity and form state management.

## Execution Routing Packet
- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package: Typecheck passes. Edit mode correctly round-trips product data for all form fields. Switching products in Revise mode shows correct brand/collection/size. Size selection in Edit mode preserves existing title/description.
- Post-delivery measurement plan: N/A — internal tool.

## Evidence Gap Review

### Gaps Addressed
- Verified all 8 reported issues against current source code — 3 confirmed as real bugs, 5 downgraded.
- Traced full save pipeline (client validate → POST → server derivePublishState → CSV/cloud write).
- Traced full load pipeline (GET → products list → handleSelectImpl → withDraftDefaults → setDraft).
- Checked existing test coverage — no tests for affected functions.

### Confidence Adjustments
- Implementation raised from initial 80% to 90% after verifying that 5/8 issues don't need fixes.
- Risk lowered after confirming server always overrides publishState (no client-side publishState bugs possible).

### Remaining Assumptions
- CSV/cloud storage always returns `createdAt` on loaded products (confirmed by looking at CSV column order and schema).
- Hermès-only brand registry is intentional for current phase.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan xa-uploader-edit-add-parity --auto`

## Access Declarations
None
