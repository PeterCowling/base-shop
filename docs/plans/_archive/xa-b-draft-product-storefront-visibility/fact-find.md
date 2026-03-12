---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: API
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: xa-b-draft-product-storefront-visibility
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/xa-b-draft-product-storefront-visibility/analysis.md
Trigger-Why: Products can go live on the XA store without photos, breaking the shopping experience. P1 — store not ready for real customers until resolved.
Trigger-Intended-Outcome: type: operational | statement: The xa-b storefront only displays products that are publishable (live or out_of_stock with complete images); draft products with missing images never appear in any listing. | source: operator
---

# XA-B Draft Product Storefront Visibility Fact-Find Brief

## Scope
### Summary
When an operator publishes a single product via the per-product publish endpoint (`POST /api/catalog/publish`), ALL products from the snapshot (including unfinished drafts with no images) are passed to `buildCatalogArtifactsFromDrafts`. Draft products end up in the published catalog with `status: "draft"`. The xa-b storefront includes `"draft"` status products in its catalog model without filtering, so they appear in every listing page — potentially with no images, breaking the shopping experience for a luxury brand.

A secondary path: an authenticated operator can call the publish API directly (bypassing the UI gate) for a product with no images. The API has no server-side `isPublishReady` check. The product would enter the snapshot with `publishState: "live"` but `deriveCatalogPublishState` would override it to `"draft"` in the contract (due to missing images). The storefront then shows this `"draft"` product.

The sync route (`POST /api/catalog/sync`) already has the correct behaviour — it filters to `isCatalogPublishableState(deriveCatalogPublishState(product))` before building the contract. The per-product publish route does not.

### Goals
- Ensure the per-product publish route only includes publishable products in the contract (matching sync behaviour)
- Ensure xa-b storefront filters out `"draft"` status products from all listings
- Eliminate the possibility of a product with no images appearing on the live storefront

### Non-goals
- Changing the UI gate (`showMakeLiveAction`) — already correct
- Changing the sync route — already correct
- Adding server-side `isPublishReady` check to the publish API (defense-in-depth; out of scope for this fix)
- Changes to caryina — already uses `includeDraft: false` in `listShopSkus`
- Investigating product detail page (PDP) behavior for draft products — scoped out; the xa-b fix (`normalizeProductStatus` returning null for "draft") prevents draft products from entering the catalog model entirely, which covers the PDP path by exclusion (no draft product can be navigated to)

### Constraints & Assumptions
- Constraints:
  - Fix must not change the published contract format for live/out_of_stock products
  - Fix must not break the existing sync route behavior
  - Fix must not affect caryina (separate storefront, already safe)
- Assumptions:
  - The operator uses the per-product publish button as the primary day-to-day workflow
  - Draft products in the snapshot represent work-in-progress items that should never appear on the storefront
  - `isCatalogPublishableState("live") === true` and `isCatalogPublishableState("out_of_stock") === true`; `isCatalogPublishableState("draft") === false`

## Outcome Contract

- **Why:** Products can go live on the XA store without photos, breaking the shopping experience. P1 priority — store not ready for real customers until resolved.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The xa-b storefront only displays products that are publishable (live or out_of_stock with complete images); draft products with missing images never appear in any listing.
- **Source:** operator

## Current Process Map

- **Trigger:** Operator clicks "Make Live" on a product in xa-uploader → POST /api/catalog/publish fires
- **End condition:** Live catalog contract is published and xa-b storefront displays updated product list

### Process Areas
| Area | Current step-by-step flow | Owners / systems / handoffs | Evidence refs | Known issues |
|---|---|---|---|---|
| Per-product publish | 1. Operator clicks Make Live (UI gate: isPublishReady required). 2. POST /api/catalog/publish with draftId + ifMatch. 3. `executeCloudPublish` reads full snapshot. 4. `updateProductPublishStateInCloudSnapshot` sets target product publishState="live" in snapshot. 5. `buildCatalogArtifactsFromDrafts` called with ALL products in snapshot (no filter). 6. `deriveCatalogPublishState` called per-product: no-image products get status="draft". 7. Contract written with all products including draft-status ones. 8. xa-b fetches catalog from NEXT_PUBLIC_XA_CATALOG_PUBLIC_URL. 9. `parseXaCatalogModel` includes status="draft" products. 10. Listing renders all products without status filter. | xa-uploader (API), xa-b (storefront) | `apps/xa-uploader/src/app/api/catalog/publish/route.ts:113-119`, `apps/xa-uploader/src/lib/catalogPublishState.ts:9-37`, `apps/xa-b/src/lib/xaCatalogModel.ts:185-252` | **GAP**: Step 5 passes ALL products (not just publishable), so draft-state products with no images appear in the live catalog |
| Sync route | 1. POST /api/catalog/sync. 2. `isCatalogPublishableState(deriveCatalogPublishState(product))` pre-filters snapshot. 3. Only live/out_of_stock products passed to `buildCatalogArtifactsFromDrafts`. | xa-uploader (API) | `apps/xa-uploader/src/app/api/catalog/sync/route.ts:400-402` | **CORRECT** — sync already filters; publish should match |
| xa-b catalog parsing | 1. Fetch catalog JSON from public URL. 2. `parseXaCatalogModel` normalizes products. 3. `normalizeProductStatus` returns "draft"\|"live"\|"out_of_stock" or null. 4. Products with status=null are filtered; "draft" is accepted. 5. `filterAndSortProducts` does not filter by status. 6. `getAvailableStock` returns 1 for "draft" (only 0 for out_of_stock). | xa-b storefront | `apps/xa-b/src/lib/xaCatalogModel.ts:185-252`, `apps/xa-b/src/lib/useXaListingFilters.ts:197-207`, `apps/xa-b/src/lib/inventoryStore.ts:36-38` | **GAP**: "draft" products shown as in-stock on all listing pages |

## Discovery Contract Output

- **Gap Case ID:** n/a
- **Recommended First Prescription:** n/a

## Evidence Audit (Current State)
### Entry Points
- `apps/xa-uploader/src/app/api/catalog/publish/route.ts` — per-product publish API endpoint
- `apps/xa-uploader/src/app/api/catalog/sync/route.ts` — full sync endpoint (reference: correct behaviour)
- `apps/xa-b/src/lib/xaCatalogModel.ts` — storefront catalog parsing
- `apps/xa-b/src/components/XaDepartmentListing.tsx` — listing page entry point

### Key Modules / Files
- `apps/xa-uploader/src/app/api/catalog/publish/route.ts:113-119` — `executeCloudPublish` passes `updatedSnapshot.products` (all) to `buildCatalogArtifactsFromDrafts`; no publishability filter
- `apps/xa-uploader/src/app/api/catalog/sync/route.ts:400-402` — sync pre-filters: `snapshot.products.filter(p => isCatalogPublishableState(deriveCatalogPublishState(p)))` — correct
- `apps/xa-uploader/src/lib/catalogPublishState.ts:9-37` — `updateProductPublishStateInCloudSnapshot`: sets `publishState` on draft in-memory; does not check isPublishReady
- `apps/xa-uploader/src/lib/catalogDraftToContract.ts:438-455` — `buildCatalogArtifactsFromDrafts`: line 446 `status: deriveCatalogPublishState(parsed)` — re-derives from readiness, overrides explicit publishState; no-image product always gets `"draft"`
- `packages/lib/src/xa/catalogWorkflow.ts:94-105` — `deriveCatalogPublishState`: if `!isPublishReady` returns `"draft"` regardless of explicit publishState; `isCatalogPublishableState`: only `"live"` or `"out_of_stock"` return true
- `apps/xa-b/src/lib/xaCatalogModel.ts:185-252` — `normalizeProductStatus` accepts `"draft"` (returns it, not null); products with `status="draft"` are included in the catalog model
- `apps/xa-b/src/lib/useXaListingFilters.ts:168-230` — `filterAndSortProducts`: no status filter; only filters by stock/price/dates/facets
- `apps/xa-b/src/lib/inventoryStore.ts:36-38` — `getAvailableStock`: returns 1 for `"draft"` (only returns 0 for `"out_of_stock"`)
- `apps/xa-b/src/components/XaDepartmentListing.tsx:20-29` — reads `useXaCatalogSnapshot().products`, applies `filterByDepartment`/`filterByCategory` only; no status filter
- `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx` — `showMakeLiveAction` gated on `readiness.isPublishReady && !!price && draft.publishState !== "live"` — UI gate is correct

### Patterns & Conventions Observed
- `isCatalogPublishableState` + `deriveCatalogPublishState` is the correct pre-filter pattern, used in sync route
- `strict: false` is used in both publish and sync routes; image validation is advisory not blocking for the contract build
- The per-product publish route re-publishes the full catalog (all products) on every single product publish — this is the architectural reason draft products leak

### Data & Contracts
- Types/schemas/events:
  - `CatalogProductDraftInput` — draft representation (has `publishState`, `imageFiles` fields)
  - `CatalogProduct` (contract output) — has `status: CatalogPublishState` field
  - `CatalogPublishState` = `"draft" | "live" | "out_of_stock"`
  - Published catalog JSON at `NEXT_PUBLIC_XA_CATALOG_PUBLIC_URL`
- Persistence:
  - Cloud draft snapshot (Firestore-like) — source of truth for xa-uploader
  - Published catalog contract — what xa-b reads from
- API/contracts:
  - `POST /api/catalog/publish` — per-product publish (gap here)
  - `POST /api/catalog/sync` — full sync (correct behaviour, reference implementation)

### Dependency & Impact Map
- Upstream dependencies:
  - Cloud draft snapshot (source of all products passed to contract builder)
- Downstream dependents:
  - xa-b storefront (reads published catalog, affected by gap)
  - caryina (reads via `listShopSkus` with `includeDraft: false` — safe, not affected)
- Likely blast radius:
  - Fix to publish route: low blast radius — only changes which products appear in published contract
  - Fix to xa-b storefront: low blast radius — adds a filter at parse or listing layer; no structural change

### Test Landscape
#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Per-product publish route | Unit | `apps/xa-uploader/src/app/api/catalog/publish/__tests__/route.publish.test.ts` | Tests golden path, out_of_stock, conflict, lock failure; no test for snapshot containing draft products alongside live products |
| Sync route | Unit | `apps/xa-uploader/src/app/api/catalog/sync/__tests__/route.test.ts`, `route.cloud-publish.test.ts` | Has publishable-products filter coverage |
| xa-b catalog model | Unit | `apps/xa-b/src/lib/__tests__/demoData.test.ts` | Tests catalog parsing; all test fixtures use `status: "live"` |
| xa-b inventory | Unit | `apps/xa-b/src/lib/__tests__/inventoryStore.test.ts` | Tests `getAvailableStock`; covers `"live"` and `"out_of_stock"` but not `"draft"` |

#### Coverage Gaps
- No test verifying that publish route with a snapshot containing both live and draft products only publishes the live ones
- No test for xa-b rendering/filtering when catalog contains `status: "draft"` products

## Engineering Coverage Matrix
| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | xa-b listing pages (`XaDepartmentListing`, `XaProductListing.client.tsx`) pass all catalog products from snapshot to `filterAndSortProducts`; no status filter | Draft products (potentially with no hero image) appear in listings — broken layout risk for luxury brand | Yes — fix in xa-b storefront |
| UX / states | Required | `getAvailableStock` returns 1 for `"draft"` products (treated as in-stock); add-to-cart flow may fire for draft items | Customer could attempt to add/purchase a draft-state product | Yes — fix `getAvailableStock` or add upstream filter |
| Security / privacy | N/A | No auth/data exposure change | — | No |
| Logging / observability / audit | N/A | No log paths affected | — | No |
| Testing / validation | Required | Publish route test suite has no snapshot-with-drafts scenario; xa-b catalog model tests use all-live fixtures | Gap will not be caught by regression tests | Yes — add unit tests in both packages |
| Data / contracts | Required | Published catalog contract currently may include `status: "draft"` entries; after fix it will not | Fix is a contract behavior change; xa-b must not rely on draft products being present | Yes — verify xa-b handles empty-catalog edge case |
| Performance / reliability | N/A | Both fixes are simple filter additions; no hot-path or latency impact | — | No |
| Rollout / rollback | Required | Per-product publish route fix changes what gets written to the live catalog contract; rollback = `git revert` safe, no data migration | If a live xa-b deployment reads the catalog while a publish is mid-flight, the previous (draft-inclusive) catalog is briefly visible — acceptable | Yes |

## Questions
### Resolved
- Q: Can a product with no images reach the live storefront through the normal UI?
  - A: Yes. In the normal flow: operator has product A (no images, `status: "draft"`) and product B (has images, `status: "live"`) in the snapshot. When operator publishes product B, ALL snapshot products (including A) are passed to `buildCatalogArtifactsFromDrafts`. Product A enters the contract with `status: "draft"`. xa-b shows it on the listing.
  - Evidence: `apps/xa-uploader/src/app/api/catalog/publish/route.ts:113-119`, `apps/xa-b/src/lib/xaCatalogModel.ts:185-252`

- Q: Is the sync route affected by this gap?
  - A: No. Sync pre-filters with `isCatalogPublishableState(deriveCatalogPublishState(product))` before calling `buildCatalogArtifactsFromDrafts`. Only `"live"` and `"out_of_stock"` products pass through.
  - Evidence: `apps/xa-uploader/src/app/api/catalog/sync/route.ts:400-402`

- Q: Is caryina affected?
  - A: No. `readShopSkus` calls `listShopSkus` with `includeDraft: false`, which filters draft products at the repository layer.
  - Evidence: `apps/caryina/src/lib/shop.ts:21`

- Q: Would a no-image product set to `"live"` via direct API call bypass the `deriveCatalogPublishState` override?
  - A: No. `deriveCatalogPublishState` always returns `"draft"` when `!isPublishReady` (which is true for no-image products), regardless of the explicit `publishState` field. So a direct-API-call for a no-image product results in `status: "draft"` in the contract — not `"live"`. However, the `"draft"` product still appears on the storefront (current gap).
  - Evidence: `packages/lib/src/xa/catalogWorkflow.ts:94-100`

- Q: What is the right fix — server (publish route), client (xa-b), or both?
  - A: Both. (1) Fix publish route to filter to publishable products only, matching sync route. This is the authoritative fix — prevents draft products from entering the contract at all. (2) Fix xa-b to filter out `"draft"` products as a defense-in-depth safeguard. The storefront should never render draft products regardless of what the contract contains.
  - Evidence: Sync route pattern at `apps/xa-uploader/src/app/api/catalog/sync/route.ts:400-402` is the reference.

### Open (Operator Input Required)
None. All questions are agent-resolvable from the codebase.

## Confidence Inputs
- Implementation: 96% — both fix sites exactly identified with line numbers; fix for publish route is a 2-3 line addition matching an existing pattern; fix for xa-b is a 1-line filter addition
- Approach: 95% — both fixes follow established patterns already present in the codebase
- Impact: 97% — gap is confirmed: draft products with no images appear on xa-b listings when publish route is used; fixes fully close both paths
- Delivery-Readiness: 95% — no unknowns remain; implementation paths are clear
- Testability: 90% — unit tests for publish route and xa-b catalog model are straightforward to add

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Publish route fix breaks a scenario where draft products were intentionally included in the contract | Low | Medium | No evidence of intentional draft product publishing; the sync route explicitly excludes drafts, showing the design intent is drafts-excluded |
| xa-b fix incorrectly filters `"out_of_stock"` products | Low | High | Filter must be `status !== "draft"` or `isCatalogPublishableState(status)`, not `status === "live"` — verify against `isCatalogPublishableState` |
| Edge case: snapshot with only draft products causes publish route to send empty catalog | Low | Medium | Matches sync route behavior (`publishableProducts.length === 0` returns 409 `no_publishable_products`); publish route should handle similarly or simply publish empty catalog |
| Test coverage gap: existing publish tests don't cover multi-product snapshot with mixed states | Medium | Low | New tests needed to prevent regression |

## Planning Constraints & Notes
- Must-follow patterns:
  - Publish route fix must use `isCatalogPublishableState(deriveCatalogPublishState(product))` — exact same filter as sync route (line 400-402 of sync route.ts)
  - Publish route fix also requires adding `isCatalogPublishableState` and `deriveCatalogPublishState` to the publish route's imports from `@acme/lib/xa` — neither is currently imported in the publish route (sync route's `route.ts` imports them from `"@acme/lib/xa"` — same pattern)
  - xa-b fix must preserve `"out_of_stock"` products — they are publishable and should remain visible
  - `strict: false` should stay as-is; this is orthogonal to the draft-exclusion fix
  - Empty-catalog after publish-route filter: if all remaining snapshot products are draft, `updatedSnapshot.products.filter(...)` yields zero items and the catalog publishes as empty/single-product — no 409 guard needed (publish is a targeted per-product operation, not a bulk sync). Verify xa-b renders an empty listing gracefully (it uses `BUNDLED_SNAPSHOT` fallback only when the URL is unavailable, not when the response is empty).
- Rollout/rollback expectations:
  - Standard Next.js + API deploy; rollback is `git revert`; no data migration
  - After fix: next time operator publishes a product, the contract will no longer include draft products — any previously-visible draft products will disappear from xa-b listings
- Observability expectations:
  - None required for this fix; it's a correctness change, not a behavioral change that needs metrics

## Suggested Task Seeds (Non-binding)
- TASK-01 (IMPLEMENT, S): Fix publish route to filter `updatedSnapshot.products` to only publishable products before passing to `buildCatalogArtifactsFromDrafts` (2-3 line change + update existing test)
- TASK-02 (IMPLEMENT, S): Fix xa-b `normalizeProductStatus` or `parseXaCatalogModel` to exclude `"draft"` status products from the catalog model; update `getAvailableStock` if needed; add test

## Execution Routing Packet
- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package: xa-b storefront listing pages show no products with `status: "draft"`; publish route contract output contains only publishable products when snapshot has mixed states
- Post-delivery measurement plan: manual smoke test — create a draft product in xa-uploader (no images), publish a different live product, confirm the draft product does not appear on xa-b

## Evidence Gap Review
### Gaps Addressed
- Full publish API flow traced end-to-end from snapshot read through contract write
- xa-b catalog parsing and listing filter chain traced end-to-end
- Sync route confirmed as correct reference implementation
- caryina confirmed as not affected

### Confidence Adjustments
- No downward adjustments required; all key evidence directly verified in source

### Remaining Assumptions
- The `isCatalogPublishableState` helper from `@acme/lib/xa` is available in the xa-uploader publish route (it's already imported in the sync route; needs to be added to publish route imports)

### Resolved Assumptions
- `NEXT_PUBLIC_XA_CATALOG_PUBLIC_URL` is the only catalog source for xa-b: Confirmed by `apps/xa-b/src/lib/liveCatalog.ts:27-29` — single URL with bundled fallback; no secondary catalog endpoint

## Rehearsal Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Publish route — draft product leak path | Yes | None | No |
| Sync route — correct reference pattern confirmed | Yes | None | No |
| xa-b storefront — status filter absence confirmed | Yes | None | No |
| xa-b inventory — `"draft"` treated as in-stock confirmed | Yes | None | No |
| caryina — `includeDraft: false` confirmed safe | Yes | None | No |
| Test coverage landscape — gaps identified | Yes | [Missing test] Publish route has no mixed-state snapshot test | No (documented as TASK gap) |

## Scope Signal
- Signal: right-sized
- Rationale: Two small, well-scoped fixes in two files each, following established patterns already in the codebase. No architecture change required. Risks are low. Evidence is complete.

## Analysis Readiness
- Status: Ready-for-analysis
- Blocking items: None
- Recommended next step: `/lp-do-analysis xa-b-draft-product-storefront-visibility`
