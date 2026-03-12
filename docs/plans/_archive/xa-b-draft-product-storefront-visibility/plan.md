---
Type: Plan
Status: Archived
Domain: API
Workstream: Engineering
Created: 2026-03-12
Last-reviewed: 2026-03-12
Last-updated: 2026-03-12
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-b-draft-product-storefront-visibility
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 95%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/xa-b-draft-product-storefront-visibility/analysis.md
---

# XA Draft Product Storefront Visibility Plan

## Summary
Draft products (products with no images or incomplete state) are leaking into the xa-b live storefront via the per-product publish API route. The route passes all snapshot products — including drafts — to `buildCatalogArtifactsFromDrafts` without filtering, writing them into the live catalog contract. The xa-b storefront then accepts `"draft"` status products into its catalog model and displays them in all listing pages. Two S-effort fixes close both layers: (1) add the same publishability filter to the publish route that the sync route already has, and (2) change `normalizeProductStatus` in xa-b to return `null` for `"draft"` products. Each fix includes a regression test. P1 — XA store is not ready for real customers until resolved.

## Active tasks
- [x] TASK-01: Fix publish route — add publishability filter + mixed-state snapshot test
- [x] TASK-02: Fix xa-b storefront — `normalizeProductStatus` returns null for draft + catalog model test

## Goals
- Ensure the per-product publish route only includes publishable (live/out_of_stock) products in the catalog contract
- Ensure xa-b storefront never displays draft products in any listing, regardless of contract content
- Eliminate any path where a product with no images can appear on the live storefront

## Non-goals
- Changing the UI gate (`showMakeLiveAction`) — already correct
- Changing the sync route — already filters correctly; reference implementation only
- Changes to caryina — already safe via `includeDraft: false` in `listShopSkus`
- Investigating PDP behavior separately — xa-b fix covers this by exclusion

## Constraints & Assumptions
- Constraints:
  - Must not change the published contract format for `"live"` or `"out_of_stock"` products
  - Fix confined to xa-uploader publish route + xa-b catalog model; no caryina changes
  - Tests run in CI only (`docs/testing-policy.md`) — verify via CI, not local
- Assumptions:
  - `isCatalogPublishableState("live") === true`, `isCatalogPublishableState("out_of_stock") === true`, `isCatalogPublishableState("draft") === false` (confirmed from source at `packages/lib/src/xa/catalogWorkflow.ts`)
  - Both `isCatalogPublishableState` and `deriveCatalogPublishState` are importable in publish route context from `"@acme/lib/xa"` (confirmed via sync route)

## Inherited Outcome Contract

- **Why:** Products can go live on the XA store without photos, breaking the shopping experience. P1 priority — store not ready for real customers until resolved.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The xa-b storefront only displays products that are publishable (live or out_of_stock with complete images); draft products with missing images never appear in any listing.
- **Source:** operator

## Analysis Reference
- Related analysis: `docs/plans/xa-b-draft-product-storefront-visibility/analysis.md`
- Selected approach inherited:
  - Option A: server-side filter in publish route + xa-b `normalizeProductStatus` returns null for "draft"
- Key reasoning used:
  - Publish route fix mirrors the already-correct sync route reference behavior
  - xa-b fix adds defense-in-depth; draft products cannot reach the storefront even if the contract ever regresses
  - Both changes are additive; no live/out_of_stock behavior altered

## Selected Approach Summary
- What was chosen:
  - Add `isCatalogPublishableState(deriveCatalogPublishState(product))` filter in `executeCloudPublish` before calling `buildCatalogArtifactsFromDrafts` (matching sync route exactly)
  - Remove `"draft"` from accepted values in `normalizeProductStatus` in xa-b, making it return `null` (which triggers existing null-filter at parse time)
- Why planning is not reopening option selection:
  - Analysis confirmed only 2 call sites for `buildCatalogArtifactsFromDrafts`; both accounted for
  - No xa-b admin/preview mode exists that could be broken by the xa-b fix
  - Option B (server-only) rejected: no defense-in-depth; Option C (client-only) rejected: root cause unresolved

## Fact-Find Support
- Supporting brief: `docs/plans/xa-b-draft-product-storefront-visibility/fact-find.md`
- Evidence carried forward:
  - Publish route gap: `apps/xa-uploader/src/app/api/catalog/publish/route.ts:113-115` — `products: updatedSnapshot.products` (unfiltered)
  - Sync route reference: `apps/xa-uploader/src/app/api/catalog/sync/route.ts:400-402` — `isCatalogPublishableState(deriveCatalogPublishState(product))` filter
  - xa-b gap: `apps/xa-b/src/lib/xaCatalogModel.ts:185-188` — `normalizeProductStatus` accepts and returns `"draft"`
  - Import already available: `isCatalogPublishableState`, `deriveCatalogPublishState` imported in sync route from `"@acme/lib/xa"`
  - xa-b test file: `apps/xa-b/src/lib/__tests__/xaCatalog.test.ts` — tests `xaCatalog.ts` only; no test for `parseXaCatalogModel` with draft-containing catalog
  - Publish test file: `apps/xa-uploader/src/app/api/catalog/publish/__tests__/route.publish.test.ts` — mock pattern established; no mixed-state snapshot test exists

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Fix publish route: add publishability filter + mixed-state snapshot test | 95% | S | Complete (2026-03-12) | - | - |
| TASK-02 | IMPLEMENT | Fix xa-b: `normalizeProductStatus` returns null for draft + catalog model test | 95% | S | Complete (2026-03-12) | - | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | Draft products removed from all listing pages | TASK-02 | xa-b fix prevents draft products entering catalog model; no broken-image cards possible |
| UX / states | Add-to-cart path for draft products eliminated at both layers | TASK-01, TASK-02 | `getAvailableStock` never sees a draft product after TASK-02; publish contract clean after TASK-01 |
| Security / privacy | N/A | — | No auth/data exposure change |
| Logging / observability / audit | N/A | — | No log paths affected |
| Testing / validation | New test for publish route (mixed snapshot) + new test for xa-b parseXaCatalogModel with draft products | TASK-01, TASK-02 | Test files identified; mock patterns confirmed |
| Data / contracts | Published catalog contract will no longer include `status:"draft"` entries after TASK-01 | TASK-01 | xa-b silently drops any remaining drafts as safety net (TASK-02) |
| Performance / reliability | N/A | — | Both fixes are simple filter additions; no hot-path impact |
| Rollout / rollback | Standard Next.js + Cloudflare deploy; `git revert` of either fix is clean | TASK-01, TASK-02 | No data migration; per-fix rollback possible |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | - | Independent; can execute in parallel or any order |

## Delivered Processes

| Area | Trigger | Delivered step-by-step flow | Tasks / dependencies | Unresolved issues / rollback seam |
|---|---|---|---|---|
| Per-product publish | Operator clicks "Make Live" → `POST /api/catalog/publish` | 1. `executeCloudPublish` reads full snapshot. 2. `updateProductPublishStateInCloudSnapshot` sets target product publishState=live. 3. Snapshot filtered: `isCatalogPublishableState(deriveCatalogPublishState(product))` — only live/out_of_stock pass. 4. Filtered products only passed to `buildCatalogArtifactsFromDrafts`. 5. Contract written with publishable products only. | TASK-01 | Empty-catalog edge case: if all products are draft at publish time, contract written with zero products — acceptable, no guard needed |
| xa-b storefront parsing | xa-b fetches catalog from `NEXT_PUBLIC_XA_CATALOG_PUBLIC_URL` | 1. `parseXaCatalogModel` normalizes products. 2. `normalizeProductStatus("draft")` now returns `null`. 3. Products with status=null filtered at parse time. 4. `XaCatalogSnapshot.products` contains only live/out_of_stock. 5. All listing pages, `filterAndSortProducts`, `getAvailableStock` see only publishable products. | TASK-02 | If contract still contains drafts before TASK-01 deployed, xa-b silently drops them — correct |

## Tasks

---

### TASK-01: Fix publish route — add publishability filter + mixed-state snapshot test
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/xa-uploader/src/app/api/catalog/publish/route.ts`, `apps/xa-uploader/src/app/api/catalog/publish/__tests__/route.publish.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-12)
- **Build evidence:**
  - Import added: `deriveCatalogPublishState, isCatalogPublishableState` from `"@acme/lib/xa"` — sorted by lint-staged autofix
  - Filter applied: `updatedSnapshot.products.filter(p => isCatalogPublishableState(deriveCatalogPublishState(p)))` before `buildCatalogArtifactsFromDrafts`
  - New test: mixed-state snapshot (p1 live, p2 draft/no-images) → `buildCatalogArtifactsFromDraftsMock` called with only p1
  - TC-04: `pnpm --filter xa-uploader typecheck` — passed (pre-commit hook)
  - TC-05: `pnpm --filter xa-uploader lint` — passed, 0 errors (pre-commit hook)
  - Post-build validation: Mode 2, attempt 1, Pass — data trace confirmed p2 excluded, p1 included
  - Commit: `7e67da512e`
- **Affects:**
  - `apps/xa-uploader/src/app/api/catalog/publish/route.ts`
  - `apps/xa-uploader/src/app/api/catalog/publish/__tests__/route.publish.test.ts`
  - `[readonly] apps/xa-uploader/src/app/api/catalog/sync/route.ts` (reference pattern only)
  - `[readonly] packages/lib/src/xa/catalogWorkflow.ts` (confirming exports)
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% — Exact line numbers identified. Import pattern confirmed from sync route. Filter is 3 lines matching reference exactly. Test file exists; mock pattern established; new test follows existing fixture shape.
  - Approach: 95% — Approved by analysis. Mirrors sync route reference behavior exactly. No alternative viable.
  - Impact: 95% — Fixes the root cause of the contract leak. No regression for live/out_of_stock products: the filter only removes products that `deriveCatalogPublishState` returns "draft" for (i.e., no images / not publish-ready).
- **Acceptance:**
  - [ ] `route.ts` imports `isCatalogPublishableState` and `deriveCatalogPublishState` from `"@acme/lib/xa"`
  - [ ] `executeCloudPublish` calls `updatedSnapshot.products.filter(product => isCatalogPublishableState(deriveCatalogPublishState(product)))` before `buildCatalogArtifactsFromDrafts`
  - [ ] `buildCatalogArtifactsFromDrafts` called with filtered products, not `updatedSnapshot.products`
  - [ ] New test: publish with snapshot containing live product (p1, images present) + draft product (p2, no images) — asserts `buildCatalogArtifactsFromDraftsMock` called with only p1
  - [ ] Existing tests in `route.publish.test.ts` still pass (single-product live/out_of_stock scenarios unaffected)
- **Engineering Coverage:**
  - UI / visual: N/A — No UI change; this is an API route fix
  - UX / states: N/A — No state machine change; publish flow UX unchanged
  - Security / privacy: N/A — No auth or data exposure change
  - Logging / observability / audit: N/A — No log paths affected
  - Testing / validation: Required — Add mixed-state snapshot test asserting filter behavior; existing tests must still pass
  - Data / contracts: Required — Published catalog contract behavior changes: no `"draft"` status products after fix. `live`/`out_of_stock` format unchanged.
  - Performance / reliability: N/A — `.filter()` on snapshot array; no hot-path impact
  - Rollout / rollback: Required — Standard deploy. `git revert` is clean; no data migration.
- **Validation contract (TC-XX):**
  - TC-01: Publish route invoked with snapshot containing `[live product p1, draft product p2 (no images, imageFiles empty)]` → `buildCatalogArtifactsFromDraftsMock` called with `products` array of length 1 containing p1 only (p2 absent); assert both `toHaveBeenCalledWith(expect.objectContaining({ products: [expect.objectContaining({ id: "p1" })] }))` and that mock is NOT called with p2
  - TC-02: Publish route invoked with snapshot containing `[live product p1]` → `buildCatalogArtifactsFromDraftsMock` called with `products: [p1]` (unchanged behavior for all-live snapshot)
  - TC-03: Publish route invoked with snapshot containing `[out_of_stock product p1, draft product p2]` → `buildCatalogArtifactsFromDraftsMock` called with `products: [p1]` only
  - TC-04: TypeScript: publish route typechecks clean after import addition — `pnpm --filter xa-uploader typecheck`
  - TC-05: Lint: publish route lints clean — `pnpm --filter xa-uploader lint`
- **Execution plan:**
  - **Red** (confirm bug path):
    1. Read `apps/xa-uploader/src/app/api/catalog/publish/route.ts` imports section (top ~20 lines) to confirm current import list and absence of `isCatalogPublishableState`/`deriveCatalogPublishState`
    2. Read `apps/xa-uploader/src/app/api/catalog/publish/__tests__/route.publish.test.ts` to understand `VALID_CLOUD_PRODUCT` fixture and `upsertProductInCloudSnapshotMock` return shape
  - **Green** (fix + test):
    3. Add `import { deriveCatalogPublishState, isCatalogPublishableState } from "@acme/lib/xa";` to imports
    4. In `executeCloudPublish`, immediately before `buildCatalogArtifactsFromDrafts` call: add `const publishableProducts = updatedSnapshot.products.filter((product) => isCatalogPublishableState(deriveCatalogPublishState(product)));`
    5. Change `products: updatedSnapshot.products` → `products: publishableProducts`
    6. Add `it` block: snapshot with p1 (target, publishState set to live) + p2 (draft, imageFiles empty); assert `buildCatalogArtifactsFromDraftsMock` called with `expect.objectContaining({ products: expect.arrayContaining([expect.objectContaining({ id: "p1" })]) })` AND `products` field has length 1 (p2 absent)
  - **Refactor** (validate):
    7. Run TC-04: `pnpm --filter xa-uploader typecheck`
    8. Run TC-05: `pnpm --filter xa-uploader lint`
- **Scouts:** None: import confirmed available from `"@acme/lib/xa"` (sync route uses same). Filter pattern confirmed 3-line match. Test mock pattern established.
- **Edge Cases & Hardening:**
  - All-draft snapshot: filter returns empty array → `buildCatalogArtifactsFromDrafts` called with `[]` → empty catalog contract written. Acceptable; no guard needed (operator is not expected to publish when no products are ready).
  - All-live snapshot: filter returns all products → no change in behavior. Existing tests cover this.
  - out_of_stock product: `deriveCatalogPublishState` returns `"out_of_stock"` for products with `publishState: "out_of_stock"` and `isPublishReady: true` → `isCatalogPublishableState("out_of_stock") === true` → included. Covered by TC-03.
- **What would make this >=90%:** Already at 95%. The only theoretical risk is a CatalogProductDraftInput type incompatibility at the filter point — but the filter produces a subset of the same array, so the type is unchanged.
- **Rollout / rollback:**
  - Rollout: standard Next.js / Cloudflare Worker deploy via CI pipeline
  - Rollback: `git revert <commit>` — safe, no data migration. Publish behavior reverts to pre-fix state; drafts reappear in contract until xa-b fix is also reverted.
- **Documentation impact:**
  - None: no public API, schema, or user-facing docs change

---

### TASK-02: Fix xa-b storefront — `normalizeProductStatus` returns null for draft + catalog model test
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/xa-b/src/lib/xaCatalogModel.ts`, `apps/xa-b/src/lib/__tests__/xaCatalogModel.test.ts` (new file)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-12)
- **Build evidence:**
  - Line 186 changed: `if (value === "draft" || value === "live" || value === "out_of_stock")` → `if (value === "live" || value === "out_of_stock")`
  - New file `xaCatalogModel.test.ts` created: TC-01 (draft → empty), TC-02 (live+draft → only live), TC-03 (out_of_stock → included)
  - TC-04: `pnpm --filter xa-b typecheck` — passed (pre-commit hook)
  - TC-05: `pnpm --filter xa-b lint` — passed, 0 errors (pre-commit hook)
  - Post-build validation: Mode 2, attempt 1, Pass — null return confirmed, existing null-filter at line 244 handles exclusion
  - Commit: `7e67da512e`
- **Affects:**
  - `apps/xa-b/src/lib/xaCatalogModel.ts`
  - `apps/xa-b/src/lib/__tests__/xaCatalogModel.test.ts` (new test file)
  - `[readonly] apps/xa-b/src/lib/__tests__/xaCatalog.test.ts` (verify no draft-status assertions)
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% — `normalizeProductStatus` identified at line 185-188. Change is removing `"draft" ||` from the condition (1 line). `parseXaCatalogModel` is exported and testable. New test file pattern matches existing xa-b test files.
  - Approach: 95% — Defense-in-depth layer approved by analysis. `normalizeProductStatus` internal to module; no external callers to update. `null` return is already handled by existing `if (status === null) return products` at line 244.
  - Impact: 95% — Draft products cannot enter `XaCatalogSnapshot.products`. `filterAndSortProducts`, `getAvailableStock`, all listing components never see draft products. No existing xa-b test asserts draft products appear in catalog model (verified: `xaCatalog.test.ts` tests routing/filtering only; no draft-status fixture with `parseXaCatalogModel`).
- **Acceptance:**
  - [ ] `normalizeProductStatus` in `xaCatalogModel.ts` no longer includes `"draft"` in the accepted set — returns `null` for `"draft"` input
  - [ ] New test file `xaCatalogModel.test.ts` created with: (a) test asserting `parseXaCatalogModel` with draft-containing catalog produces empty products array; (b) test asserting live products in same catalog are included
  - [ ] No existing xa-b tests broken by the change
- **Engineering Coverage:**
  - UI / visual: Required — Draft products no longer appear in any listing page. `XaDepartmentListing`, `XaProductListing.client.tsx` only see live/out_of_stock products. No broken-image cards possible.
  - UX / states: Required — `getAvailableStock` never receives a draft product after fix; add-to-cart path for draft items eliminated.
  - Security / privacy: N/A — No auth or data exposure change
  - Logging / observability / audit: N/A — No log paths affected
  - Testing / validation: Required — New `xaCatalogModel.test.ts` tests `parseXaCatalogModel` with draft-containing catalog; asserts draft products absent from result
  - Data / contracts: Required — xa-b catalog model no longer contains `"draft"` status entries. Defense layer against future publish route regression.
  - Performance / reliability: N/A — One condition removed from a parsing function; no performance impact
  - Rollout / rollback: Required — Standard deploy. `git revert` clean; no data migration. If reverted independently, draft products reappear in xa-b model but are still absent from publish contract (TASK-01 still in effect).
- **Validation contract (TC-XX):**
  - TC-01: `parseXaCatalogModel({ products: [{ status: "draft", ... }], collections: [], brands: [] })` → `products` array is empty (draft product excluded)
  - TC-02: `parseXaCatalogModel({ products: [{ status: "live", ...validFields }, { status: "draft", ... }], collections: [], brands: [] })` → `products` contains only the live product
  - TC-03: `parseXaCatalogModel({ products: [{ status: "out_of_stock", ...validFields }], collections: [], brands: [] })` → `products` contains the out_of_stock product (unchanged behavior)
  - TC-04: TypeScript: xa-b typechecks clean after fix — `pnpm --filter xa-b typecheck`
  - TC-05: Lint: xa-b lints clean — `pnpm --filter xa-b lint`
- **Execution plan:**
  - **Red** (confirm bug path):
    1. Read `apps/xa-b/src/lib/xaCatalogModel.ts` lines 185-192 to confirm `normalizeProductStatus` currently accepts `"draft"`
    2. Read `apps/xa-b/src/lib/xaCatalogModel.ts` lines 227-260 to understand `parseXaCatalogModel` signature and minimal required catalog JSON product shape (determines fixture fields for TC-01/TC-02/TC-03)
    3. Read `apps/xa-b/src/lib/__tests__/xaCatalog.test.ts` to confirm test file import/describe pattern
  - **Green** (fix + test):
    4. Remove `"draft" ||` from line 186: `if (value === "draft" || value === "live" || value === "out_of_stock")` → `if (value === "live" || value === "out_of_stock")`
    5. Create `apps/xa-b/src/lib/__tests__/xaCatalogModel.test.ts` with `describe("parseXaCatalogModel")` block covering TC-01 (draft → empty), TC-02 (live + draft → only live), TC-03 (out_of_stock → included); use minimal valid product fixture from step 2 evidence
  - **Refactor** (validate):
    6. Run TC-04: `pnpm --filter xa-b typecheck`
    7. Run TC-05: `pnpm --filter xa-b lint`
- **Scouts:** None: `normalizeProductStatus` confirmed as module-private (not exported). `parseXaCatalogModel` confirmed exported. No existing test asserts draft products appear in catalog model. `null` return already handled at line 244.
- **Edge Cases & Hardening:**
  - All-draft catalog: `parseXaCatalogModel` returns empty `products` array. Listing pages already handle empty catalog (show empty state or "no products found"). This is correct behavior.
  - Unknown status values: already return `null` and are filtered. No change in behavior for unknown values.
  - `out_of_stock` products: condition `value === "out_of_stock"` remains; these continue to be included. Covered by TC-03.
- **What would make this >=90%:** Already at 95%. The minimal remaining risk is that `parseXaCatalogModel` requires additional required fields on products that a minimal test fixture might not provide — mitigated by reading the function signature in execution step 4 before writing the test.
- **Rollout / rollback:**
  - Rollout: standard Next.js / Cloudflare Pages deploy via CI pipeline
  - Rollback: `git revert <commit>` — safe. Draft products reappear in xa-b model if contract has drafts, but publish route fix (TASK-01) ensures contract is clean.
- **Documentation impact:**
  - None: no public API, schema, or user-facing docs change

---

## Risks & Mitigations
- **All-draft snapshot produces empty catalog write**: If operator publishes when all products are draft (after TASK-01), contract is written with zero products. Operator gets no explicit feedback. Mitigation: acceptable behavior — operator should verify products are publish-ready before clicking Make Live. No guard added (out of scope).
- **xa-b test fixture may need additional fields**: `parseXaCatalogModel` may require fields beyond `status` on each product object. Mitigation: execution step 4 (read function signature before writing test) ensures the test fixture is valid.
- **TypeScript CatalogPublishState type still includes "draft"**: The type allows `"draft"` as a valid runtime value. After the xa-b fix, no live product will ever have `status: "draft"` in the xa-b model, but the type does not change. This is correct — the type models possible input values; the function's rejection of `"draft"` is a runtime behavior change. No type update needed.

## Observability
- Logging: None: pure filter additions; no log paths affected
- Metrics: None
- Alerts/Dashboards: None

## Acceptance Criteria (overall)
- [ ] Publish route passes only live/out_of_stock products to `buildCatalogArtifactsFromDrafts`
- [ ] xa-b `normalizeProductStatus` returns `null` for `"draft"` input
- [ ] xa-b `parseXaCatalogModel` with draft-containing catalog produces no draft products in output
- [ ] Mixed-state snapshot test added to publish route test suite
- [ ] xa-b catalog model test file created with happy path + draft exclusion + out_of_stock inclusion tests
- [ ] TypeCheck and lint pass for both `xa-uploader` and `xa-b`

## Decision Log
- 2026-03-12: Plan+auto mode — proceed directly to build after plan gates pass and critique clears.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Fix publish route | Yes | None — import confirmed available from `"@acme/lib/xa"` (sync route confirms); filter pattern is 3-line match; test mock established | No |
| TASK-02: Fix xa-b normalizeProductStatus | Yes | None — function at confirmed line; null return already handled by caller; parseXaCatalogModel exported for testing | No |

## Overall-confidence Calculation
- TASK-01: S=1, confidence=95%
- TASK-02: S=1, confidence=95%
- Overall: (95% × 1 + 95% × 1) / (1 + 1) = **95%**
