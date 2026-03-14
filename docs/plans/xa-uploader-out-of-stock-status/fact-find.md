---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: Platform
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: xa-uploader-out-of-stock-status
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/xa-uploader-out-of-stock-status/analysis.md
Trigger-Why: Operator wants out-of-stock to be a first-class product status so products can remain visible on the storefront while marked as unavailable for purchase.
Trigger-Intended-Outcome: "type: operational | statement: out-of-stock status is fully supported across schema, xa-uploader UI, publish flow, storefront display, and cart validation | source: operator"
---

# Out-of-Stock Product Status for xa-uploader: Fact-Find Brief

## Scope

### Summary

The operator requested adding an out-of-stock product status to xa-uploader so products can remain visible on the xa-b storefront but be marked as unavailable for purchase. Investigation reveals that **this feature already exists end-to-end.** The `out_of_stock` status is fully implemented across the schema, workflow derivation, publish API, UI controls, i18n copy, storefront filtering, cart validation, and inventory logic. No code changes are required.

### Goals

- Confirm that `out_of_stock` is a valid publish state in the catalog schema
- Confirm that the xa-uploader UI supports setting a product to out-of-stock
- Confirm that the storefront (xa-b) correctly handles out-of-stock products
- Identify any gaps in the existing implementation

### Non-goals

- Numeric inventory tracking (explicitly rejected by operator in prior session)
- Semantic image roles (already removed in favour of main-image-plus-gallery)

### Constraints & Assumptions

- Constraints:
  - Must not break existing draft/live state transitions
- Assumptions:
  - The operator may not be aware that this feature is already implemented
  - The prior dispatch (IDEA-DISPATCH-20260306172218-9027) which covered this scope is already `completed`

## Outcome Contract

- **Why:** Operator wants products to remain visible on the storefront while marked as unavailable for purchase, requiring a distinct out-of-stock status beyond draft/live.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** out-of-stock status is fully supported across schema, xa-uploader UI, publish flow, storefront display, and cart validation
- **Source:** operator

## Current Process Map

- Trigger: Operator clicks "Mark Out of Stock" (or "Make Live") button in the xa-uploader product form
- End condition: Product status updated in cloud draft snapshot, catalog contract re-published, optional xa-b deploy triggered

### Process Areas

| Area | Current step-by-step flow | Owners / systems / handoffs | Evidence refs | Known issues |
|---|---|---|---|---|
| Publish state transition | 1. Auth check (`hasUploaderSession`) 2. Parse request payload (draftId, ifMatch, publishState) 3. Acquire cloud sync lock 4. Read cloud draft snapshot + currency rates 5. Update product publishState in snapshot 6. Build catalog artifacts from drafts 7. Validate cloud media existence 8. Publish contract payload to catalog service 9. Write updated draft snapshot 10. Trigger xa-b deploy (if applicable) 11. Release lock | xa-uploader API / Cloud catalog contract / R2 storage / xa-b deploy hook | `apps/xa-uploader/src/app/api/catalog/publish/route.ts` lines 81-181 | Draft snapshot write failure after contract publish is caught but only logged as warning (line 150-155) |

## Evidence Audit (Current State)

### Entry Points

- `apps/xa-uploader/src/app/api/catalog/publish/route.ts` - POST handler accepts `publishState: "live" | "out_of_stock"` and transitions products between states
- `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx` - UI form with "Mark Out of Stock" button for live products

### Key Modules / Files

1. `packages/lib/src/xa/catalogAdminSchema.ts` - Schema source of truth: `catalogPublishStateSchema = z.enum(["draft", "live", "out_of_stock"])` (line 31)
2. `packages/lib/src/xa/catalogWorkflow.ts` - `deriveCatalogPublishState()` preserves `out_of_stock` for publish-ready drafts; `isCatalogPublishableState()` returns true for both `live` and `out_of_stock` (lines 94-105)
3. `apps/xa-uploader/src/lib/catalogPublishState.ts` - `updateProductPublishStateInCloudSnapshot()` accepts `"live" | "out_of_stock"` (line 12)
4. `apps/xa-uploader/src/components/catalog/catalogWorkflow.ts` - `getWorkflowStatusDisplay()` renders "Published as out of stock" with warning colour dot (lines 16-28)
5. `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts` - `handlePublishImpl()` handles out-of-stock feedback messages with full deploy-status variants (lines 582-671)
6. `apps/xa-uploader/src/lib/uploaderI18n.ts` - Complete EN and ZH i18n keys for out-of-stock states: `markOutOfStockRunning`, `markOutOfStockComplete`, `markOutOfStockSuccess`, `workflowOutOfStock`, `statusOutOfStock` (lines 191-213, 289, 650-668, 741)
7. `apps/xa-uploader/src/lib/catalogDraftToContract.ts` - `buildCatalogArtifactsFromDrafts()` writes `status: deriveCatalogPublishState(parsed)` to the catalog contract, which correctly emits `out_of_stock` (line 446)
8. `apps/xa-b/src/lib/xaCatalogModel.ts` - `normalizeProductStatus()` accepts `"out_of_stock"` as valid; `parseXaCatalogModel()` includes out-of-stock products in the model (line 186)
9. `apps/xa-b/src/lib/inventoryStore.ts` - `getAvailableStock()` returns 0 for `out_of_stock` products (line 37)
10. `apps/xa-b/src/contexts/XaCartContext.tsx` - `isLineAvailable()` rejects `out_of_stock` products from being added to cart (line 39); cart page shows "unavailable" label (line 136)

### Patterns & Conventions Observed

- Publish state is a three-value enum (`draft | live | out_of_stock`) at every layer from Zod schema to storefront rendering - evidence: `packages/lib/src/xa/catalogAdminSchema.ts` line 31
- The "Mark Out of Stock" button appears only when a product is currently `live` - evidence: `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx` lines 417-419
- The "Make Live" button appears for both `draft` and `out_of_stock` products (when publish-ready) - evidence: `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx` lines 420-425
- Publish state transitions go through the same cloud sync lock and contract publish pipeline regardless of whether the target is `live` or `out_of_stock` - evidence: `apps/xa-uploader/src/app/api/catalog/publish/route.ts` lines 81-181

### Data & Contracts

- Types/schemas/events:
  - `CatalogPublishState = "draft" | "live" | "out_of_stock"` - `packages/lib/src/xa/catalogAdminSchema.ts`
  - `CatalogProductDraftInput.publishState` uses `catalogPublishStateSchema.optional()` - same file, line 100
  - `XaProduct.status: CatalogPublishState` on the storefront side - `apps/xa-b/src/lib/xaCatalogModel.ts` line 23
- Persistence:
  - Cloud draft snapshots store `publishState` per product - `apps/xa-uploader/src/lib/catalogPublishState.ts`
  - Contract catalog JSON stores `status` per product - `apps/xa-uploader/src/lib/catalogDraftToContract.ts` line 446
  - Runtime catalog JSON (`apps/xa-b/src/data/catalog.runtime.json`) carries the status field
- API/contracts:
  - Publish API accepts `publishState?: "live" | "out_of_stock"` in request body - `apps/xa-uploader/src/app/api/catalog/publish/route.ts` line 37
  - Sync API uses `isCatalogPublishableState()` to filter publishable products (includes both `live` and `out_of_stock`) - `apps/xa-uploader/src/app/api/catalog/sync/route.ts` line 395

### Dependency & Impact Map

- Upstream dependencies:
  - `@acme/lib/xa` provides the canonical schema and workflow functions used by both xa-uploader and xa-b
- Downstream dependents:
  - `apps/xa-b` (storefront) consumes publish state for cart validation, inventory display, and listing filters
  - `scripts/src/xa/run-xa-pipeline.ts` uses `isCatalogPublishableState()` to determine publishable drafts (line 354)
- Likely blast radius:
  - None - the feature is already implemented

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest
- Commands: `pnpm -w run test:governed -- jest`
- CI integration: tests run in CI only per testing policy

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Workflow derivation | Unit | `packages/lib/src/xa/__tests__/catalogWorkflow.test.ts` | Tests `out_of_stock` preservation when publish-ready (line 58-66) |
| Inventory availability | Unit | `apps/xa-b/src/lib/__tests__/inventoryStore.test.ts` | Tests `getAvailableStock` returns 0 for `out_of_stock` (line 35) |
| Cart rejection | Unit | `apps/xa-b/src/contexts/__tests__/XaCartContext.test.tsx` | Tests adding out-of-stock product is rejected (line 107) |
| Listing filters | Unit | `apps/xa-b/src/lib/__tests__/useXaListingFilters.test.tsx` | Includes out-of-stock product fixture (line 70) |
| Publish route | Integration | `apps/xa-uploader/src/app/api/catalog/publish/__tests__/route.publish.test.ts` | Tests publish flow |
| Sync route | Integration | `apps/xa-uploader/src/app/api/catalog/sync/__tests__/route.test.ts` | Tests cloud publish with state filtering |
| Console actions | Unit | `apps/xa-uploader/src/components/catalog/__tests__/catalogConsoleActions.test.ts` | Tests publish action handlers |
| Action feedback | Unit | `apps/xa-uploader/src/components/catalog/__tests__/action-feedback.test.tsx` | Tests feedback messaging |
| Draft to contract | Unit | `apps/xa-uploader/src/lib/__tests__/catalogDraftToContract.test.ts` | Tests contract artifact building |
| Form rendering | Unit | `apps/xa-uploader/src/components/catalog/__tests__/CatalogProductForm.test.tsx` | Tests form component |

#### Coverage Gaps

- No explicit test for the storefront product card rendering of out-of-stock state (XaProductCard.tsx visual indicator) -- pre-existing gap, not introduced by this feature
- No explicit test for the cart-page "unavailable" label rendering path (line 136 of cart/page.tsx) -- pre-existing gap

#### Testability Assessment

- Easy to test: all components are already tested with out-of-stock fixtures
- Hard to test: N/A
- Test seams needed: N/A

### Recent Git History (Targeted)

- `a3f75b1f8f` fix(xa-uploader): deep imports to fix worker build, set prod KV namespace ID
- `e50f5699a2` xa-uploader: Wave 1 baseline DELETE tests, promotion failure logging, dead code removal
- `581074e4d4` fix(xa-uploader): stability, error handling, a11y, and code cleanup (C008-C011)
- `0d2618c606` fix(xa-uploader): autosave no longer disables Make Live button

No recent changes conflict with the out-of-stock feature. The most relevant prior work was the xa-uploader-workflow-rebuild plan which established the current three-state model.

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | N/A | Out-of-stock button, status dot, and labels already rendered in CatalogProductForm.client.tsx and CatalogProductsList.client.tsx | None | None |
| UX / states | N/A | Full state machine: draft -> live -> out_of_stock -> live transitions work; i18n copy covers running/complete/success/failure for all transitions | None | None |
| Security / privacy | N/A | Publish route requires `hasUploaderSession()` auth check; no additional auth surface from existing feature | None | None |
| Logging / observability / audit | N/A | `uploaderLog` calls exist for `publish_start`, `publish_complete`, and `publish_error`; however, only `publish_complete` includes the `publishState` field (line 172). `publish_start` logs storefront only (line 88); `publish_error` logs storefront and reason only (line 234) | Minor: `publishState` not logged on start/error events, but this is pre-existing and not specific to out-of-stock | None |
| Testing / validation | N/A | Unit and integration tests exist for workflow derivation, cart rejection, inventory availability, publish API, and listing filters | None | None |
| Data / contracts | N/A | `catalogPublishStateSchema` includes `out_of_stock`; contract export uses `deriveCatalogPublishState` which preserves it; storefront model accepts it | None | None |
| Performance / reliability | N/A | Same publish pipeline used for live and out_of_stock; no hot path changes | None | None |
| Rollout / rollback | N/A | Feature is already deployed and operational; no rollout needed | None | None |

## Questions

### Resolved

- Q: Is `out_of_stock` already in the Zod schema?
  - A: Yes. `catalogPublishStateSchema = z.enum(["draft", "live", "out_of_stock"])` at `packages/lib/src/xa/catalogAdminSchema.ts` line 31.
  - Evidence: `packages/lib/src/xa/catalogAdminSchema.ts`

- Q: Does the xa-uploader UI support marking products as out-of-stock?
  - A: Yes. The "Mark Out of Stock" button appears when a product's `publishState` is `live`. The `PublishActionButton` component handles `actionKind: "out_of_stock"` with full running/complete states.
  - Evidence: `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx` lines 127-168, 417-419

- Q: Does the storefront correctly handle out-of-stock products?
  - A: Yes. Out-of-stock products remain in the catalog model and are shown in listings. Cart context rejects adding them (`isLineAvailable` returns false). Cart page shows "unavailable" label. `getAvailableStock` returns 0.
  - Evidence: `apps/xa-b/src/contexts/XaCartContext.tsx` line 39, `apps/xa-b/src/lib/inventoryStore.ts` line 37, `apps/xa-b/src/app/cart/page.tsx` line 136

- Q: Does the publish API accept out-of-stock as a target state?
  - A: Yes. `PublishRequestPayload.publishState` is typed as `"live" | "out_of_stock"`. The `parsePublishRequestPayload` function explicitly checks for `out_of_stock`.
  - Evidence: `apps/xa-uploader/src/app/api/catalog/publish/route.ts` lines 37, 54

- Q: Does the sync pipeline include out-of-stock products in the published catalog?
  - A: Yes. `isCatalogPublishableState()` returns true for both `live` and `out_of_stock`, so sync includes out-of-stock products in the contract payload sent to the storefront.
  - Evidence: `packages/lib/src/xa/catalogWorkflow.ts` lines 103-105, `apps/xa-uploader/src/app/api/catalog/sync/route.ts` line 395

- Q: Are there i18n translations for out-of-stock states?
  - A: Yes. Both EN and ZH translations exist for all out-of-stock UI states: `markOutOfStockRunning`, `markOutOfStockComplete`, `markOutOfStockSuccess` (with deploy status variants), `workflowOutOfStock`, `statusOutOfStock`.
  - Evidence: `apps/xa-uploader/src/lib/uploaderI18n.ts` lines 191-202, 212, 289, 650-658, 668, 741

- Q: Is there a prior dispatch covering this scope?
  - A: Yes. `IDEA-DISPATCH-20260306172218-9027` in queue-state.json covers the same scope but is already `completed` (status: `completed`, queue_state: `completed`). That dispatch established the current three-state model.
  - Evidence: `docs/business-os/startup-loop/ideas/trial/queue-state.json` dispatch_id `IDEA-DISPATCH-20260306172218-9027`, queue_state `completed`

### Open (Operator Input Required)

None. The fact-find concludes that out-of-stock status is already fully implemented. If the operator has additional requirements beyond the current implementation, those should be raised as a new, scoped fact-find targeting the specific gaps.

## Confidence Inputs

- Implementation: 95% - The feature is already fully implemented across all layers. Evidence from 10+ files confirms schema, UI, API, i18n, storefront, and test coverage.
- Approach: 95% - No approach decision needed; the work is done.
- Impact: 90% - No code changes are required, so no risk of regression. The only impact risk is if the operator has requirements beyond what was investigated.
- Delivery-Readiness: 95% - Nothing to deliver; the feature exists.
- Testability: 95% - Tests already cover the out-of-stock flow at unit and integration levels.

What would raise each to >=80: Already above 80.
What would raise each to >=90: Operator confirmation that the existing implementation meets their needs.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Operator has requirements beyond what is already implemented | Low | Low | Clarify with operator what specific behaviour they expected that is not present |
| Operator unfamiliarity with existing UI controls | Medium | Low | Provide a walkthrough of the Mark Out of Stock button location and workflow |

## Scope Signal

- Signal: right-sized
- Rationale: The investigation scope was appropriate. All material layers (schema, workflow, publish API, UI, i18n, storefront model, cart validation, inventory, tests) were examined and confirmed to already support out-of-stock status.

## Planning Constraints & Notes

- Must-follow patterns: N/A - no changes needed
- Rollout/rollback expectations: N/A - feature already deployed
- Observability expectations: Pre-existing minor gap: `publishState` logged only on `publish_complete`, not on `publish_start` or `publish_error`. Applies to all publish transitions, not specific to out-of-stock.

## Suggested Task Seeds (Non-binding)

- No implementation tasks needed. If the operator has additional requirements beyond the current implementation, a new fact-find scoped to those specific gaps should be initiated.

## Execution Routing Packet

- Primary execution skill: N/A - no implementation needed
- Supporting skills: none
- Deliverable acceptance package: Operator acknowledgement that the feature meets requirements
- Post-delivery measurement plan: N/A

## Evidence Gap Review

### Gaps Addressed

- Verified schema definition at the source of truth (`catalogAdminSchema.ts`)
- Verified workflow derivation logic preserves `out_of_stock` state
- Verified UI renders both the status display and the action button
- Verified publish API accepts and processes `out_of_stock` transitions
- Verified storefront model, cart context, and inventory store all handle the status
- Verified i18n coverage in both EN and ZH
- Verified test coverage across unit and integration tests
- Verified prior dispatch covering this scope is already completed

### Confidence Adjustments

- No adjustments needed; initial confidence was high and evidence confirmed it

### Remaining Assumptions

- The operator's mental model of "out-of-stock" matches what is implemented (product visible in listings, not purchasable, shown with warning indicator)

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Schema definition (catalogAdminSchema.ts) | Yes | None | No |
| Workflow derivation (catalogWorkflow.ts) | Yes | None | No |
| Publish API route | Yes | None | No |
| Cloud snapshot state management | Yes | None | No |
| Contract export (catalogDraftToContract.ts) | Yes | None | No |
| UI form controls and status display | Yes | None | No |
| i18n translations (EN + ZH) | Yes | None | No |
| Storefront model parsing (xaCatalogModel.ts) | Yes | None | No |
| Cart validation (XaCartContext.tsx) | Yes | None | No |
| Inventory availability (inventoryStore.ts) | Yes | None | No |
| Listing filters (useXaListingFilters.ts) | Yes | None | No |
| Test coverage | Yes | None | No |
| Sync pipeline (sync route + isCatalogPublishableState) | Yes | None | No |
| Pipeline script (run-xa-pipeline.ts) | Yes | None | No |

## Analysis Readiness

- Status: Ready-for-analysis
- Blocking items: None
- Recommended next step: The feature is already implemented end-to-end. Analysis should confirm no further work is needed and close the pipeline. If the operator identifies specific gaps beyond what was investigated, a separate scoped fact-find should be initiated for those gaps.
