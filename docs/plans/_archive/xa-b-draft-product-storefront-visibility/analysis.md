---
Type: Analysis
Status: Ready-for-planning
Domain: API
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: xa-b-draft-product-storefront-visibility
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/xa-b-draft-product-storefront-visibility/fact-find.md
Related-Plan: docs/plans/xa-b-draft-product-storefront-visibility/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# XA Draft Product Storefront Visibility Analysis

## Decision Frame
### Summary
The per-product publish API route (`POST /api/catalog/publish`) passes all snapshot products — including `"draft"`-state products with no images — to `buildCatalogArtifactsFromDrafts`. This results in draft products appearing in the published catalog contract. The xa-b storefront makes this worse by accepting `"draft"` as a valid `normalizeProductStatus` return value and not filtering by status in `filterAndSortProducts`. The decision is: how to close this leak with minimum blast radius and maximum defense-in-depth.

### Goals
- Ensure the per-product publish route only includes publishable products in the catalog contract
- Ensure xa-b storefront never displays draft products in any listing, regardless of contract content
- Eliminate any path where a product with no images can appear on the live storefront

### Non-goals
- Changing the UI gate (`showMakeLiveAction`) — already correct
- Changing the sync route — already filters correctly; reference implementation only
- Adding server-side `isPublishReady` check to the publish API beyond the existing filter
- Changes to caryina — already safe via `includeDraft: false` in `listShopSkus`
- Investigating product detail page (PDP) separately — xa-b fix covers this by exclusion (no draft product can be navigated to if none enter the catalog model)
- Changing the published contract format for live/out_of_stock products

### Constraints & Assumptions
- Constraints:
  - Must not change the published contract format for `"live"` or `"out_of_stock"` products
  - Must not break the sync route behavior
  - Fix must be confined to xa-uploader publish route + xa-b catalog model; no caryina changes
  - Import of `isCatalogPublishableState` and `deriveCatalogPublishState` required in publish route (already exported from `packages/lib/src/xa/catalogWorkflow.ts`)
- Assumptions:
  - `isCatalogPublishableState("live") === true`, `isCatalogPublishableState("out_of_stock") === true`, `isCatalogPublishableState("draft") === false`
  - After the xa-b fix, `normalizeProductStatus("draft")` returns `null` — products never enter the catalog model
  - Empty-catalog edge case after server-side filter is acceptable: operator is unlikely to publish when zero products are publishable; no 409 guard required

## Inherited Outcome Contract

- **Why:** Products can go live on the XA store without photos, breaking the shopping experience. P1 priority — store not ready for real customers until resolved.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The xa-b storefront only displays products that are publishable (live or out_of_stock with complete images); draft products with missing images never appear in any listing.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/xa-b-draft-product-storefront-visibility/fact-find.md`
- Key findings used:
  - `apps/xa-uploader/src/app/api/catalog/publish/route.ts:113-119` — `buildCatalogArtifactsFromDrafts` called with `updatedSnapshot.products` (all products, no filter)
  - `apps/xa-uploader/src/app/api/catalog/sync/route.ts:400-402` — correct reference: pre-filters with `isCatalogPublishableState(deriveCatalogPublishState(product))`
  - `apps/xa-b/src/lib/xaCatalogModel.ts:185-252` — `normalizeProductStatus` accepts `"draft"`, returns it; products with null are filtered but `"draft"` is not null
  - `apps/xa-b/src/lib/useXaListingFilters.ts` — `filterAndSortProducts` has no status filter; only stock/price/date/facet
  - `apps/xa-b/src/lib/inventoryStore.ts:36-38` — `getAvailableStock` returns 1 for `"draft"` (treats as in-stock)
  - No test covers publish route with a mixed-state snapshot (some draft, some live)

## Evaluation Criteria
| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Completeness of fix | Draft products must not reach the storefront via any path | High |
| Defense-in-depth | Server side is root cause; client side is defense layer against future contract drift | High |
| Blast radius / regression risk | Fix must not alter live/out_of_stock contract outputs | High |
| Test coverage | Regression test gap must be closed for both surfaces | Medium |
| Implementation simplicity | Small team — minimal code surface change preferred | Medium |

## Options Considered
| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A | Server-side filter in publish route + xa-b `normalizeProductStatus` returns null for "draft" | Complete fix at both layers; defense-in-depth; mirrors sync route exactly; xa-b cannot display drafts even if contract ever regresses | Two touch points (publish route + xa-b); slightly more code | Negligible — both changes are additive filters, no existing behavior for live/out_of_stock is altered | Yes — **Chosen** |
| B | Server-side filter in publish route only (single fix) | Addresses root cause; minimal change | xa-b would display drafts if contract ever includes them again (e.g., via a future publish route variation or direct API call); no defense-in-depth | If another publish path is added later, the leak could reopen silently | Viable but suboptimal |
| C | xa-b `normalizeProductStatus` returns null for "draft" only (client-side only) | xa-b is protected regardless of contract content | Root cause unresolved — publish contract still writes draft products; operator-facing APIs still return draft products to any other consumer | Publish contract correctness violated; other potential consumers of the contract also see drafts | Not viable as sole fix |

## Engineering Coverage Comparison
| Coverage Area | Option A | Option B | Option C | Chosen implication (A) |
|---|---|---|---|---|
| UI / visual | Draft products removed from all listing pages | Draft products removed from all listing pages | Draft products removed from all listing pages | xa-b listing pages clean; no broken-image cards possible |
| UX / states | Add-to-cart path for draft products eliminated at both layers | Add-to-cart path unchanged in xa-b (drafts still in model) | Add-to-cart path for draft products eliminated in xa-b | `getAvailableStock` never sees a draft product — no cart flow risk |
| Security / privacy | No auth/data exposure change | No auth/data exposure change | No auth/data exposure change | N/A |
| Logging / observability / audit | No log paths affected | No log paths affected | No log paths affected | N/A |
| Testing / validation | Tests needed for publish route (mixed-state snapshot) + xa-b normalizeProductStatus | Tests needed for publish route only | Tests needed for xa-b only | Both test gaps must be closed; unit tests in xa-uploader publish route test suite + xa-b catalog model tests |
| Data / contracts | Published catalog contract will no longer include `status:"draft"` entries; xa-b model never contains drafts | Published catalog contract will no longer include drafts | Publish contract still includes drafts; xa-b silently drops them | Contract behavior change for publish route; xa-b silently drops drafts as safety net |
| Performance / reliability | Both fixes are simple filter additions; no hot-path impact | Simple filter addition only | Simple null return only | No performance impact either way |
| Rollout / rollback | Safe: git revert on either fix is clean; no data migration | Safe | Safe | Per-fix rollback possible; no migration risk |

## Chosen Approach
- **Recommendation:** Option A — fix both the publish route (server-side root cause) and xa-b's `normalizeProductStatus` (client-side defense layer).
- **Why this wins:** The publish route fix is the root cause fix — it mirrors the already-correct sync route behavior (`isCatalogPublishableState(deriveCatalogPublishState(product))`). The xa-b fix adds defense-in-depth: if any publish path ever regresses or a draft appears in the contract from any source, xa-b can never display it. The combined fix is the only option that closes the gap completely. Both changes are additive; no existing behavior for live/out_of_stock products is altered.
- **What it depends on:**
  - `isCatalogPublishableState` and `deriveCatalogPublishState` must be imported into the publish route (both are exported from `packages/lib/src/xa/catalogWorkflow.ts`)
  - `normalizeProductStatus` in xa-b must return `null` for `"draft"` (currently returns `"draft"`)
  - No test currently covers the mixed-state snapshot case in the publish route test suite — test must be added

### Rejected Approaches
- **Option B (server-side only)** — Viable but leaves xa-b with no defense layer. If a future publish path or direct API call ever produces draft entries in the contract, xa-b would display them silently. Defense-in-depth is worth one additional null return in `normalizeProductStatus`.
- **Option C (client-side only)** — Not viable as a sole fix. The publish contract correctness violation is real: any other contract consumer (future tools, analytics, admin views) would see draft products. Root cause must be addressed server-side.

### Open Questions (Operator Input Required)
None. All decisions are derivable from repo evidence and existing sync route reference behavior.

## End-State Operating Model

| Area | Current state | Trigger | Delivered step-by-step end state | What remains unchanged | Risks / seams to carry into planning |
|---|---|---|---|---|---|
| Per-product publish | `executeCloudPublish` passes ALL snapshot products to `buildCatalogArtifactsFromDrafts`; draft-state products (no images) enter the live catalog contract | Operator clicks "Make Live" → `POST /api/catalog/publish` | 1. Operator clicks Make Live (UI gate: isPublishReady required). 2. `executeCloudPublish` reads full snapshot. 3. `updateProductPublishStateInCloudSnapshot` sets target product publishState=live in snapshot. 4. Snapshot products are pre-filtered: `isCatalogPublishableState(deriveCatalogPublishState(product))` — only live/out_of_stock pass. 5. Filtered products only passed to `buildCatalogArtifactsFromDrafts`. 6. Contract written with publishable products only. | Sync route already correct; caryina already correct; published contract format for live/out_of_stock products unchanged | Empty-catalog edge case: if all products are draft at publish time, contract is written with zero products — acceptable; no guard needed |
| xa-b storefront catalog parsing | `normalizeProductStatus("draft")` returns `"draft"`; draft products enter catalog model and appear in all listing pages | xa-b fetches catalog JSON from `NEXT_PUBLIC_XA_CATALOG_PUBLIC_URL` | 1. Fetch catalog JSON. 2. `parseXaCatalogModel` normalizes products. 3. `normalizeProductStatus("draft")` now returns `null`. 4. Products with status=null are filtered out at parse time. 5. Draft products never enter `XaCatalogSnapshot.products`. 6. `filterAndSortProducts` and `getAvailableStock` only ever see live/out_of_stock products. | normalizeProductStatus behavior for live/out_of_stock unchanged; all filtering logic unchanged | If contract still contains drafts (e.g., before server-side fix is deployed), xa-b fix silently drops them — correct behavior |

## Planning Handoff
- Planning focus:
  - TASK-01: Add `isCatalogPublishableState`/`deriveCatalogPublishState` filter to `executeCloudPublish` in `apps/xa-uploader/src/app/api/catalog/publish/route.ts` — match sync route pattern exactly
  - TASK-02: Change `normalizeProductStatus` in `apps/xa-b/src/lib/xaCatalogModel.ts` to return `null` for `"draft"` (remove `"draft"` from the accepted set)
  - TASK-03: Add test for publish route with mixed-state snapshot (live + draft products); confirm draft products absent from contract — goes in existing file `apps/xa-uploader/src/app/api/catalog/publish/__tests__/route.publish.test.ts`
  - TASK-04: Add test for xa-b `normalizeProductStatus` returning null for `"draft"`; add test for `parseXaCatalogModel` with draft-containing catalog — goes in xa-b catalog model test suite
- Validation implications:
  - Publish route test: fixture must include snapshot with mix of `publishState: "live"` (isPublishReady: true) and unfinished draft products; assert contract output contains only live products
  - xa-b test: `normalizeProductStatus("draft")` must return `null`; `parseXaCatalogModel` with draft-containing JSON must produce empty/live-only product list
  - Existing publish route tests must still pass; existing xa-b catalog model tests must still pass
  - Any existing xa-b tests that assert draft products appear in the catalog model will correctly fail after TASK-02 — those tests were testing broken behavior and should be updated to assert draft products are absent
- Sequencing constraints:
  - TASK-01 and TASK-02 are independent — can execute in parallel or either order
  - TASK-03 depends on TASK-01; TASK-04 depends on TASK-02
  - Alternatively: tests can be written before or alongside implementation (TDD acceptable)
- Risks to carry into planning:
  - Import path for `isCatalogPublishableState`/`deriveCatalogPublishState` must be verified in publish route context
  - `normalizeProductStatus` return type: if TypeScript type is `CatalogPublishState | null`, removing `"draft"` from accepted values will not cause a type error; verify `CatalogPublishState` still includes `"draft"` as a possible input value (it does — the type is `"draft" | "live" | "out_of_stock"`)

## Risks to Carry Forward
| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| Other publish paths could bypass the filter | Resolved | — | Analysis-phase search confirmed: `buildCatalogArtifactsFromDrafts` has exactly 2 call sites in `apps/xa-uploader/src` — `publish/route.ts:113` (unguarded, this fix) and `sync/route.ts:430` (guarded). No other call sites exist. | No action needed — all call sites accounted for |
| Empty-catalog write during publish if all products are draft | Very Low | Low | Acceptable behavior — operator should not publish when no products are ready | No guard needed; note in plan as known edge case |
| xa-b TypeScript type mismatch after `normalizeProductStatus` change | Very Low | Low | `CatalogPublishState` type still includes `"draft"` as input value; returning null is already the pattern for unknown values | Verify with typecheck after edit |

## Planning Readiness
- Status: Go
- Rationale: Evidence gates clear. Two-fix approach is decisive with no operator questions. Both fix sites exactly identified with line numbers. Sync route reference behavior confirmed. Sequencing is simple (TASK-01 and TASK-02 independent). All engineering coverage areas accounted for. Test gaps documented and scoped.
