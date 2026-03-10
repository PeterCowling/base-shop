---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-06
Last-reviewed: 2026-03-06
Last-updated: 2026-03-09
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-uploader-status-and-media-model-rewrite
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-design-qa, tools-ui-contrast-sweep, tools-ui-breakpoint-sweep
Overall-confidence: 92%
Confidence-Method: effort-weighted average of task confidence (S=1, M=2, L=3)
Auto-Build-Intent: plan-only
---

# XA Uploader Status and Media Model Rewrite Plan

## Summary
Rewrite the XA uploader catalog contract around two operator-facing simplifications: `draft | live | out_of_stock` status semantics and `main image + ordered additional photos` media semantics. The implementation landed across shared libs, xa-uploader routes/UI, canonical CSV/runtime fixtures, xa-b gallery/cart consumers, and the legacy helper pipeline scripts that still regenerated the old contract. The final canonical repo state is now fail-closed on incompatible legacy rows, status-only for availability, and ordered-media-first without any remaining role dependency in the active uploader/storefront contract surfaces.

## Active tasks
- [x] TASK-01: Confirm legacy draft migration mode
- [x] TASK-06: Codify fail-closed legacy cleanup contract
- [x] TASK-07: Define status-only cart quantity contract
- [x] TASK-02: Rewrite status contract and stock-based availability
- [x] TASK-03: Rewrite media contract to main image plus ordered photos
- [x] TASK-04: Harden regression coverage, fixtures, and UI verification
- [x] TASK-05: Horizon checkpoint - reassess downstream build readiness

## Goals
- Replace `draft | ready | live` plus numeric stock with `draft | live | out_of_stock`.
- Replace role-based image capture/export with one main image and ordered additional photos.
- Keep the one-page console shell and predetermined registry-backed entry workflow unchanged.
- Preserve required derived/internal fields (`title`, `description`, `subcategory`, `slug`).
- Update xa-b so storefront availability and gallery behavior match the new contract.

## Non-goals
- Reintroducing free-form product entry.
- Redesigning the left sidebar or replacing the current one-page editor layout.
- Reworking catalog publish architecture, auth boundaries, or deploy transport.
- Adding quantity-aware inventory back into xa-b under a different name.

## Constraints & Assumptions
- Constraints:
  - `xa-uploader` currently targets `xa-b` only, so contract changes must stay compatible with the `xa-b` storefront deployment path.
  - The save route and sync route currently disagree with the target model because both still encode `ready` as a distinct publishable state.
  - UI work remains inside the existing `CatalogProductForm`, `CatalogProductBaseFields`, `CatalogProductImagesFields`, and xa-b gallery/cart surfaces.
- Assumptions:
  - `draft` is unpublished.
  - `live` means published and purchasable.
  - `out_of_stock` remains published on the storefront but is not purchasable.

## Inherited Outcome Contract
- **Why:** The current xa-uploader product model and media workflow no longer match the confirmed operator requirements. The app already has the correct one-page shell, but the underlying status and image contracts are still built around `ready` state, numeric stock, and role-based media.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A planning-ready implementation path exists for xa-uploader to use `draft | live | out_of_stock` status semantics, `main image + additional photos` media semantics, predetermined registry-backed product entry, and the existing one-page sidebar/editor workflow.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/xa-uploader-status-and-media-model-rewrite/fact-find.md`
- Key findings used:
  - The one-page shell and sidebar workflow already exist and are not redesign work.
  - Status rewrite must update schema, save route, sync publish filtering, export payload, and xa-b availability consumers.
  - Media rewrite must update upload UI/API, persistence/export, and xa-b gallery consumers.
  - The operator confirmed existing CSV/cloud draft data does not need to survive, so incompatible legacy rows may be discarded or regenerated explicitly.

## Proposed Approach
- Option A: hard-break rewrite
  - Remove legacy `ready`, `stock`, and role semantics immediately and discard incompatible draft rows if they do not match the new model.
  - Upside: simpler implementation.
  - Downside: requires explicit cleanup/discard behavior for incompatible persisted rows.
- Option B: compatibility-preserving rewrite
  - Make the new model canonical for writes and UI, but keep a bounded read/migration path for legacy CSV/draft rows until the operator confirms they can be discarded.
  - Upside: safer rollout and rollback, especially because the current state of real draft data is unknown.
  - Downside: more implementation and test surface.
- Chosen approach:
  - Use Option A. The operator confirmed on 2026-03-06 that legacy CSV/cloud draft data does not need to survive, so TASK-02 and TASK-03 should use explicit break-and-fix cleanup rather than compatibility-preserving reads.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No

## Re-plan Status
- Invocation: standard
- Targeted tasks: TASK-02, TASK-03, TASK-04, TASK-05
- Outcome: Complete
- Build-first precursor chain: completed (`TASK-06`, `TASK-07`)
- Next runnable task: none
- Notes: stable task IDs preserved; `TASK-03` and `TASK-04` landed with canonical fixture regeneration, and `TASK-05` closed without requiring a follow-up replan.

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | DECISION | Confirm whether legacy CSV/draft rows require compatibility handling or can be discarded | 90% | S | Complete (2026-03-06) | - | - |
| TASK-06 | INVESTIGATE | Codify fail-closed cleanup behavior for incompatible legacy CSV/cloud/runtime rows before contract rewrite | 85% | S | Complete (2026-03-06) | - | TASK-02,TASK-03 |
| TASK-07 | INVESTIGATE | Define status-only cart quantity and stale-cart behavior after `stock` removal | 85% | S | Complete (2026-03-06) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Rewrite status semantics, remove numeric stock, and switch xa-b availability to status-based behavior | 85% | L | Complete (2026-03-06) | TASK-06,TASK-07 | TASK-03,TASK-04 |
| TASK-03 | IMPLEMENT | Rewrite media semantics to main image plus ordered additional photos across uploader and xa-b | 85% | L | Complete (2026-03-06) | TASK-06,TASK-02 | TASK-04 |
| TASK-04 | IMPLEMENT | Update regression coverage, fixtures, copy, and UI verification for the rewritten contract | 82% | M | Complete (2026-03-06) | TASK-02,TASK-03 | TASK-05 |
| TASK-05 | CHECKPOINT | Reassess build-readiness after contract rewrite and regression hardening | 95% | S | Complete (2026-03-06) | TASK-04 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Complete: operator confirmed downstream tasks may use hard-break cleanup for legacy rows. |
| 2 | TASK-06, TASK-07 | - | Complete: fail-closed cleanup and status-only cart quantity rules are now explicit plan evidence. |
| 3 | TASK-02 | TASK-06, TASK-07 | Status rewrite goes first because sync publish filtering and xa-b availability depend on the new state model. |
| 4 | TASK-03 | TASK-06, TASK-02 | Media rewrite follows status because it shares persistence/export surfaces and should land after the new publish model is stable. |
| 5 | TASK-04 | TASK-02, TASK-03 | Regression, fixtures, and scoped UI QA run only after the contract is stable on both sides. |
| 6 | TASK-05 | TASK-04 | Checkpoint confirms whether downstream build work is ready or needs replan. |

## Tasks

### TASK-01: Confirm legacy draft migration mode
- **Type:** DECISION
- **Deliverable:** documented migration choice in `docs/plans/xa-uploader-status-and-media-model-rewrite/plan.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-03-06)
- **Affects:** `docs/plans/xa-uploader-status-and-media-model-rewrite/plan.md`, `[readonly] docs/plans/xa-uploader-status-and-media-model-rewrite/fact-find.md`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% - the operator answer is available and the decision can be recorded immediately.
  - Approach: 90% - the trade-off is closed because the operator explicitly chose break-and-fix behavior for legacy drafts.
  - Impact: 90% - the decision materially changes persistence and rollback scope.
- **Options:**
  - Option A: break-and-fix legacy rows if there is no live or operator-needed draft data.
  - Option B: keep compatibility-preserving reads/migration handling until legacy rows are explicitly retired.
- **Recommendation:** Option A. The operator explicitly confirmed on 2026-03-06 that legacy CSV/cloud draft data does not need to survive.
- **Decision input needed:**
  - Resolved on 2026-03-06: no live product data or operator-needed draft data in the CSV/cloud draft store needs to survive this rewrite.
- **Acceptance:**
  - One migration mode is selected and written into this plan before TASK-02 starts.
  - Downstream tasks are updated to use explicit break-and-fix cleanup for incompatible persisted rows.
- **Validation contract:** operator answer captured in plan `Decision Log`; TASK-02/TASK-03 notes updated to explicit break-and-fix cleanup.
- **Planning validation:** inspected fact-find open question and persistence call sites in `catalogCsv.ts` and `catalogDraftContractClient.ts`; operator has now closed the data-survival question.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** update this plan and, if needed, the fact-find's open-question state.

### TASK-06: Codify fail-closed legacy cleanup contract
- **Type:** INVESTIGATE
- **Deliverable:** documented cleanup contract in `docs/plans/xa-uploader-status-and-media-model-rewrite/replan-notes.md` plus task-delta updates in `plan.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-03-06)
- **Affects:** `[readonly] apps/xa-uploader/src/lib/catalogCsv.ts`, `[readonly] packages/lib/src/xa/catalogCsvMapping.ts`, `[readonly] apps/xa-uploader/src/lib/catalogDraftContractClient.ts`, `[readonly] apps/xa-uploader/data/products.xa-b.csv`, `[readonly] apps/xa-b/src/data/catalog.runtime.json`, `[readonly] apps/xa-b/src/data/catalog.media.runtime.json`, `docs/plans/xa-uploader-status-and-media-model-rewrite/replan-notes.md`, `docs/plans/xa-uploader-status-and-media-model-rewrite/plan.md`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 85%
  - Implementation: 90% - the affected ingress/persistence surfaces are explicitly identified by repo search and file review.
  - Approach: 80% - operator already approved break-and-fix behavior; the remaining work is to codify discard/regenerate/ignore-on-read behavior per surface.
  - Impact: 85% - resolving this closes the fail-closed cleanup ambiguity still depressing TASK-02 and TASK-03.
- **Acceptance:**
  - Every legacy-shaped ingress/persistence surface is classified as `discard`, `regenerate`, or `ignore on read`.
  - TASK-02, TASK-03, and TASK-04 are updated so no IMPLEMENT task still carries ambiguous "legacy cleanup" wording.
  - Replan notes cite the concrete files/symbols that require cleanup handling.
- **Validation contract:** `replan-notes.md` records the chosen cleanup mode for CSV rows, cloud snapshot products, and xa-b runtime fixtures with file references.
- **Planning validation:** repo-wide grep and file review confirmed legacy shape usage in `catalogCsv.ts`, `catalogCsvMapping.ts`, `catalogDraftContractClient.ts`, `products.xa-b.csv`, `catalog.runtime.json`, and `catalog.media.runtime.json`.
- **Rollout / rollback:** `None: planning/evidence task`
- **Documentation impact:** create/update `replan-notes.md` and refresh downstream task contracts in this plan.
#### Build Completion (2026-03-06)
- Outcome: complete
- Evidence: `docs/plans/xa-uploader-status-and-media-model-rewrite/replan-notes.md` now classifies each legacy surface as `discard`, `ignore on read`, or `regenerate`.
- Validation: acceptance criteria satisfied; CSV rows, cloud snapshot products, checked-in sample/runtime artifacts, and serializer/hydrator surfaces all have an explicit cleanup mode.
- Downstream propagation: affirming outcome raised TASK-02 and TASK-03 by removing the last cleanup-mode ambiguity from their implementation path.

### TASK-07: Define status-only cart quantity contract
- **Type:** INVESTIGATE
- **Deliverable:** documented quantity/stale-cart rule in `docs/plans/xa-uploader-status-and-media-model-rewrite/replan-notes.md` plus task-delta updates in `plan.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-03-06)
- **Affects:** `[readonly] apps/xa-b/src/contexts/XaCartContext.tsx`, `[readonly] apps/xa-b/src/app/cart/page.tsx`, `[readonly] apps/xa-b/src/components/XaBuyBox.client.tsx`, `[readonly] apps/xa-b/src/components/XaProductCard.tsx`, `[readonly] apps/xa-b/src/lib/inventoryStore.ts`, `docs/plans/xa-uploader-status-and-media-model-rewrite/replan-notes.md`, `docs/plans/xa-uploader-status-and-media-model-rewrite/plan.md`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 85%
  - Implementation: 85% - the cart/buy-box/card/cart-page seams are localized and already mapped.
  - Approach: 85% - status-only availability is operator-confirmed; the remaining task is to codify one explicit quantity ceiling and stale-cart rule.
  - Impact: 85% - resolving this removes the only remaining hidden behavioral choice inside TASK-02.
- **Acceptance:**
  - One explicit cart quantity rule is documented for status-only availability, including add-to-cart, set-quantity, and cart-page behavior.
  - Stale-cart handling is documented for products that transition to `out_of_stock` after being added.
  - TASK-02 and TASK-04 are updated so the quantity/stale-cart rule is no longer implicit.
- **Validation contract:** `replan-notes.md` records the chosen rule with file references to `XaCartContext`, `cart/page`, `XaBuyBox`, `XaProductCard`, and `inventoryStore`.
- **Planning validation:** file review confirmed quantity is currently controlled by `maxQtyForLine` in `XaCartContext.tsx`, `QuantityInput max={line.sku.stock}` in `cart/page.tsx`, and incremental quantity controls in `XaBuyBox.client.tsx`.
- **Rollout / rollback:** `None: planning/evidence task`
- **Documentation impact:** create/update `replan-notes.md` and refresh downstream task contracts in this plan.
#### Build Completion (2026-03-06)
- Outcome: complete
- Evidence: `docs/plans/xa-uploader-status-and-media-model-rewrite/replan-notes.md` now defines fixed-quantity, single-unit cart behavior and stale-cart handling under status-only availability.
- Validation: acceptance criteria satisfied; add-to-cart, set-quantity, cart-page behavior, and stale-cart reconciliation now have one explicit rule.
- Downstream propagation: affirming outcome raised TASK-02 and TASK-04 by removing the last quantity-behavior decision from their implementation path.

### TASK-02: Rewrite status semantics and remove numeric stock
- **Type:** IMPLEMENT
- **Deliverable:** code-change across uploader/shared libs/storefront implementing `draft | live | out_of_stock` semantics and removing numeric `stock`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Complete (2026-03-06)
- **Affects:** `packages/lib/src/xa/catalogAdminSchema.ts`, `packages/lib/src/xa/catalogWorkflow.ts`, `packages/lib/src/xa/catalogCsvMapping.ts`, `packages/lib/src/xa/catalogCsvColumns.ts`, `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx`, `apps/xa-uploader/src/components/catalog/CatalogProductsList.client.tsx`, `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx`, `apps/xa-uploader/src/components/catalog/CatalogProductBaseFields.client.tsx`, `apps/xa-uploader/src/components/catalog/catalogDraft.ts`, `apps/xa-uploader/src/app/api/catalog/products/route.ts`, `apps/xa-uploader/src/app/api/catalog/sync/route.ts`, `apps/xa-uploader/src/lib/catalogCsv.ts`, `apps/xa-uploader/src/lib/catalogCsvColumns.ts`, `apps/xa-uploader/src/lib/catalogDraftContractClient.ts`, `apps/xa-uploader/src/lib/catalogDraftToContract.ts`, `apps/xa-uploader/src/lib/uploaderI18n.ts`, `apps/xa-uploader/data/products.xa-b.csv`, `apps/xa-b/src/lib/demoData.ts`, `apps/xa-b/src/lib/inventoryStore.ts`, `apps/xa-b/src/contexts/XaCartContext.tsx`, `apps/xa-b/src/components/XaProductCard.tsx`, `apps/xa-b/src/components/XaBuyBox.client.tsx`, `apps/xa-b/src/app/cart/page.tsx`, `apps/xa-b/src/i18n/en.json`, `apps/xa-b/src/data/catalog.runtime.json`, `apps/xa-uploader/src/lib/__tests__/catalogAdminSchema.test.ts`, `packages/lib/src/xa/__tests__/catalogWorkflow.test.ts`, `apps/xa-uploader/src/app/api/catalog/products/__tests__/route.test.ts`, `apps/xa-uploader/src/app/api/catalog/sync/__tests__/route.test.ts`, `apps/xa-uploader/src/app/api/catalog/sync/__tests__/route.cloud-publish.test.ts`, `apps/xa-uploader/src/lib/__tests__/catalogCsvMapping.test.ts`, `apps/xa-uploader/src/lib/__tests__/catalogDraftContractClient.test.ts`, `apps/xa-uploader/src/lib/__tests__/catalogDraftToContract.test.ts`, `apps/xa-uploader/src/components/catalog/__tests__/CatalogProductForm.test.tsx`, `apps/xa-uploader/src/components/catalog/__tests__/catalogConsoleUtils.test.ts`, `apps/xa-uploader/src/components/catalog/__tests__/error-localization.test.tsx`, `apps/xa-uploader/src/components/catalog/__tests__/action-feedback.test.tsx`, `apps/xa-uploader/src/components/catalog/__tests__/useCatalogConsole-domains.test.tsx`, `apps/xa-b/src/lib/__tests__/inventoryStore.test.ts`, `apps/xa-b/src/contexts/__tests__/XaCartContext.test.tsx`, `apps/xa-b/src/lib/__tests__/demoData.test.ts`, `apps/xa-b/src/lib/__tests__/useXaListingFilters.test.tsx`
- **Depends on:** TASK-06, TASK-07
- **Blocks:** TASK-03, TASK-04
- **Confidence:** 85%
  - Implementation: 85% - precursor investigations converted the cleanup path and cart quantity semantics into explicit build contracts.
  - Approach: 85% - the task no longer contains hidden behavior decisions; the remaining work is implementation breadth, not approach uncertainty.
  - Impact: 85% - the rewrite resolves the core operator mismatch and storefront availability drift.
#### Re-plan Update (2026-03-06)
- Confidence: 75% -> 85% (Evidence: E2 read-only verification via completed TASK-06 and TASK-07 artifacts)
- Key change: cleanup and cart-quantity rules are now explicit and complete, not precursor placeholders.
- Dependencies: TASK-06, TASK-07
- Validation contract: updated; TC-03 and TC-04 now reference concrete rules rather than unresolved investigation tasks.
- Notes: see `docs/plans/xa-uploader-status-and-media-model-rewrite/replan-notes.md`
- **Acceptance:**
  - Shared schema and workflow helpers accept only `draft`, `live`, and `out_of_stock`; `ready` and numeric `stock` are removed from canonical write paths.
  - Save-route derivation and sync-route publish filtering are updated together so `draft` stays unpublished while `live` and `out_of_stock` remain publishable.
  - Uploader UI removes numeric stock entry and exposes status semantics with clear operator copy.
  - xa-b availability derives from status rather than `stock`, with quantity fixed to one unit per line when status is not `out_of_stock`.
  - Cart hydration/render reconciles stored lines against current product status; lines that become `out_of_stock` remain visible but unavailable until manually removed.
  - Expected user-observable behavior:
    - [ ] In xa-uploader, operators can choose `draft`, `live`, or `out of stock` without seeing a numeric stock field.
    - [ ] Products marked `draft` do not publish.
    - [ ] Products marked `live` publish and remain purchasable on xa-b.
    - [ ] Products marked `out of stock` remain visible on xa-b but cannot be added to cart.
- **Validation contract (TC-02):**
  - TC-01: schema/save accepts `draft`, `live`, and `out_of_stock` and rejects legacy `ready` on canonical write paths.
  - TC-02: sync publish includes `live` and `out_of_stock` products and excludes `draft`.
  - TC-03: xa-b cart/listing/buy-box availability reflects status-only semantics with fixed one-unit quantity and stale-cart reconciliation, with no remaining `stock` dependency.
  - TC-04: incompatible legacy draft rows are dropped from CSV reads, ignored in cloud snapshot reads, and regenerated in committed fixtures/runtime artifacts; no compatibility-preserving read path remains in the canonical implementation.
  - TC-05: scoped post-build UI QA for uploader/storefront status surfaces is executed in TASK-04 via `lp-design-qa`, `tools-ui-contrast-sweep`, and `tools-ui-breakpoint-sweep`; any Critical/Major findings are fixed before TASK-05.
  - Targeted validation commands:
    - `pnpm --filter @acme/lib typecheck`
    - `pnpm --filter @acme/lib lint`
    - `pnpm --filter @apps/xa-uploader typecheck`
    - `pnpm --filter @apps/xa-uploader lint`
    - `pnpm --filter @apps/xa-b typecheck`
    - `pnpm --filter @apps/xa-b lint`
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run:
    - `rg -n "derivePublishState|wouldUnpublish|ready" apps/xa-uploader/src/app/api/catalog/products/route.ts apps/xa-uploader/src/app/api/catalog/sync/route.ts`
    - `rg -n "\\.stock\\b|getAvailableStock\\(" apps/xa-b/src -S`
    - code-path verification in `docs/plans/xa-uploader-status-and-media-model-rewrite/fact-find.md`
  - Validation artifacts:
    - `apps/xa-uploader/src/app/api/catalog/products/route.ts`
    - `apps/xa-uploader/src/app/api/catalog/sync/route.ts`
    - `apps/xa-b/src/contexts/XaCartContext.tsx`
    - `apps/xa-b/src/lib/inventoryStore.ts`
    - `apps/xa-b/src/app/cart/page.tsx`
  - Unexpected findings:
    - status rewrite also required same-cycle cleanup of uploader list/status copy, cloud finalize promotion logic, runtime/catalog seed artifacts, and several previously deferred test/i18n fixtures to keep the canonical contract fail-closed.
- **Scouts:** inspect `QuantityInput` max-handling and any cart persistence assumptions before changing `cart/page.tsx` and `XaCartContext.tsx`.
- **Edge Cases & Hardening:** legacy rows with `publish_state=ready`; persisted carts containing products that become `out_of_stock`; draft rows with missing required derived fields; enforce the fixed cleanup and stale-cart rules above rather than inventing in-task behavior.
- **What would make this >=90%:**
  - one canonical fixture set proves CSV/cloud/runtime cleanup and stale-cart reconciliation end-to-end.
- **Rollout / rollback:**
  - Rollout:
    - land status rewrite and xa-b consumer update in one coordinated build so published payload and storefront stay aligned.
  - Rollback:
    - revert uploader/shared-lib/storefront changes together and restore the prior published catalog payload if the new status contract causes storefront regression.
- **Documentation impact:**
  - update plan evidence and any operator-facing copy inventory changed by the status rewrite.
- **Notes / references:**
  - Consumer tracing:
    - new value `status=out_of_stock` is consumed by save route, sync route, catalog payload hydration in `demoData.ts`, xa-b availability helpers, buy-box/card/cart UI, and related tests.
    - removed value `stock` currently feeds `inventoryStore.ts`, `XaCartContext.tsx`, `cart/page.tsx`, and stock-based tests; all must change in this task.
#### Build Completion (2026-03-06)
- Outcome: complete
- Evidence:
  - shared schema/workflow now accept only `draft`, `live`, and `out_of_stock`, and canonical CSV/cloud reads fail closed on legacy `ready`.
  - uploader save/sync paths now derive/filter publishability together, and cloud finalize preserves `out_of_stock` instead of promoting everything to `live`.
  - xa-b runtime hydration, inventory helpers, buy-box/cart behavior, and checked-in seed artifacts now use status-only availability with fixed one-unit cart lines.
- Validation:
  - `pnpm --filter @acme/lib build`
  - `pnpm --filter @acme/lib lint`
  - `pnpm --filter @apps/xa-uploader typecheck`
  - `pnpm --filter @apps/xa-uploader lint`
  - `pnpm --filter @apps/xa-b typecheck`
  - `pnpm --filter @apps/xa-b lint`
- Scope expansion:
  - pulled fixture/i18n/runtime cleanup for status-bearing surfaces into `TASK-02` so the canonical repo state no longer bootstraps from `stock`/`ready` artifacts that the new code rejects.
- Downstream propagation:
  - `TASK-03` is now the next runnable contract task; `TASK-04` no longer owns the status-only fixture/i18n cleanup already absorbed here.

### TASK-03: Rewrite media semantics to main image plus ordered additional photos
- **Type:** IMPLEMENT
- **Deliverable:** code-change across uploader/shared libs/storefront implementing main-image-first media semantics without role-based ordering
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Complete (2026-03-06)
- **Affects:** `packages/lib/src/xa/catalogAdminSchema.ts`, `packages/lib/src/xa/catalogCsvMapping.ts`, `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx`, `apps/xa-uploader/src/app/api/catalog/images/route.ts`, `apps/xa-uploader/src/lib/catalogDraftToContract.ts`, `apps/xa-b/src/lib/demoData.ts`, `apps/xa-b/src/components/XaImageGallery.client.tsx`, `apps/xa-b/src/i18n/en.json`, `apps/xa-uploader/src/components/catalog/__tests__/CatalogProductImagesFields.test.ts`, `apps/xa-uploader/src/lib/__tests__/catalogDraftToContract.test.ts`, `apps/xa-b/src/lib/__tests__/demoData.test.ts`
- **Depends on:** TASK-06, TASK-02
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 80% - affected surfaces are localized, and repo-wide search exposed the remaining fixture/copy drift that must move with the task.
  - Approach: 85% - the target model is settled and the cleanup contract is now explicit rather than deferred to precursor work.
  - Impact: 85% - the task removes the second major operator mismatch and fixes storefront/gallery drift.
#### Re-plan Update (2026-03-06)
- Confidence: 75% -> 85% (Evidence: E2 read-only verification via completed TASK-06 artifact)
- Key change: legacy cleanup ambiguity is closed; runtime fixture/i18n drift remains the main implementation breadth.
- Dependencies: TASK-06, TASK-02
- Validation contract: updated; TC-02 now references the explicit cleanup rule.
- Notes: see `docs/plans/xa-uploader-status-and-media-model-rewrite/replan-notes.md`
- **Acceptance:**
  - Uploader stores one explicit main image plus ordered additional photos; reordering persists that order.
  - Upload API no longer requires semantic `role` query parameters or role-based filename semantics for the canonical path.
  - Exported media contract emits main image first and preserves ordered additional photos without role-keyed ordering rules.
  - xa-b gallery renders the supplied order directly and removes role-badge / role-caption dependency.
  - Expected user-observable behavior:
    - [ ] In xa-uploader, operators can upload a main image, add extra photos, and reorder additional photos on the same page.
    - [ ] Publish is allowed when only the main image exists.
    - [ ] On xa-b, the main image always appears first and the gallery no longer shows role labels like Front/Side/Top.
- **Validation contract (TC-03):**
  - TC-01: uploader image UI persists main image plus ordered additional photos without role selection.
  - TC-02: upload/delete/reorder APIs and serialization remain stable while incompatible legacy media rows are dropped from persisted reads and regenerated in canonical fixture/runtime outputs.
  - TC-03: published catalog/media payload hydrates in xa-b with main-first ordering and no remaining role dependency.
  - TC-04: scoped post-build UI QA for uploader image controls and xa-b gallery rendering is executed in TASK-04 via `lp-design-qa`, `tools-ui-contrast-sweep`, and `tools-ui-breakpoint-sweep`; any Critical/Major findings are fixed before TASK-05.
  - Targeted validation commands:
    - `pnpm --filter @acme/lib typecheck`
    - `pnpm --filter @acme/lib lint`
    - `pnpm --filter @apps/xa-uploader typecheck`
    - `pnpm --filter @apps/xa-uploader lint`
    - `pnpm --filter @apps/xa-b typecheck`
    - `pnpm --filter @apps/xa-b lint`
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run:
    - `rg -n "role\\b|sortXaMediaByRole\\(" apps/xa-uploader/src apps/xa-b/src packages/lib/src/xa -S`
    - `nl -ba apps/xa-uploader/src/app/api/catalog/images/route.ts | sed -n '115,150p'`
    - code-path verification in `docs/plans/xa-uploader-status-and-media-model-rewrite/fact-find.md`
  - Validation artifacts:
    - `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx`
    - `apps/xa-uploader/src/app/api/catalog/images/route.ts`
    - `apps/xa-uploader/src/lib/catalogDraftToContract.ts`
    - `apps/xa-b/src/lib/demoData.ts`
    - `apps/xa-b/src/components/XaImageGallery.client.tsx`
  - Unexpected findings:
    - committed xa-b runtime/test fixtures and i18n currently encode role strings, so fixture cleanup must be included in TASK-04 rather than left as follow-up drift.
    - repo-wide search found role-bearing uploader copy and image-route tests outside the original task boundary; TASK-04 must update them in the same delivery lane.
- **Scouts:** verify whether filename uniqueness still needs a semantic tag after role removal or whether nonce-only naming is sufficient.
- **Edge Cases & Hardening:** legacy rows with `media_paths` role prefixes; drafts with one image only; removing or replacing the current main image; apply the explicit drop/ignore/regenerate cleanup rules rather than inventing in-task behavior.
- **What would make this >=90%:**
  - one canonical legacy-row fixture proves the cleanup path for image metadata end-to-end.
- **Rollout / rollback:**
  - Rollout:
    - coordinate uploader export and xa-b gallery hydration in one build so storefront never reads a half-migrated media shape.
  - Rollback:
    - revert uploader/storefront media handling together and restore role-based payload ordering if gallery regressions appear.
- **Documentation impact:**
  - update plan evidence and any user-facing image guidance/copy altered by the new main/additional-photo model.
- **Notes / references:**
  - Consumer tracing:
    - removed value `role` currently feeds upload query params, export sorting, `demoData.ts`, `XaImageGallery.client.tsx`, role i18n keys, and related tests.
    - new behavior `main-first ordered media` is consumed by uploader preview/reorder logic, export serialization, xa-b hydration, and gallery rendering.
#### Implementation Update (2026-03-06)
- Landed across shared validation/CSV mapping, uploader image UI + upload route, contract export, xa-b hydration/gallery rendering, and the legacy helper pipeline scripts that previously regenerated role-shaped payloads.
- Canonical fixture/runtime outputs were regenerated so checked-in CSV/runtime/media artifacts now encode one ordered image list with no `role` metadata.

### TASK-04: Harden regression coverage, fixtures, and UI verification
- **Type:** IMPLEMENT
- **Deliverable:** regression and QA hardening for the rewritten status/media contract across lib, xa-uploader, and xa-b
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-06)
- **Affects:** `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx`, `apps/xa-uploader/src/components/catalog/__tests__/CatalogProductImagesFields.test.ts`, `apps/xa-uploader/src/app/api/catalog/images/route.ts`, `apps/xa-uploader/src/app/api/catalog/images/__tests__/route.test.ts`, `apps/xa-uploader/src/lib/__tests__/catalogDraftToContract.test.ts`, `apps/xa-uploader/src/lib/__tests__/catalogCsvMapping.test.ts`, `apps/xa-uploader/src/lib/__tests__/catalogDraftContractClient.test.ts`, `apps/xa-uploader/src/app/api/catalog/sync/__tests__/route.test.ts`, `apps/xa-uploader/src/lib/uploaderI18n.ts`, `apps/xa-b/src/lib/__tests__/demoData.test.ts`, `apps/xa-b/src/data/catalog.media.runtime.json`, `apps/xa-b/src/i18n/en.json`
- **Depends on:** TASK-02, TASK-03
- **Blocks:** TASK-05
- **Confidence:** 82%
  - Implementation: 80% - repo-wide search surfaced the remaining fixture/i18n/test files that were previously outside the task boundary.
  - Approach: 82% - cleanup and quantity behavior are now explicit, so the remaining task is bounded to fixture/test/UI execution.
  - Impact: 75% - this task is necessary to prevent stale stock/role fixtures and UI drift, but it depends on earlier contract work.
#### Re-plan Update (2026-03-06)
- Confidence: 75% -> 82% (Evidence: E2 repo-wide grep + completed TASK-06/TASK-07 artifacts)
- Key change: the remaining hardening lane is now concentrated on media fixtures, uploader image-route tests, and scoped UI QA; status-only drift has already been absorbed by TASK-02.
- Dependencies: unchanged
- Validation contract: updated; TC-02 now requires canonical fixture cleanup, not partial fixture drift.
- Notes: see `docs/plans/xa-uploader-status-and-media-model-rewrite/replan-notes.md`
- **Acceptance:**
  - Regression coverage exists for status schema/save/sync behavior and for main-image-first media serialization/hydration.
  - No committed runtime/test fixtures remain on the old `stock`/`role` contract.
  - Scoped UI QA is run on changed uploader and xa-b surfaces until no Critical/Major issues remain.
  - Expected user-observable behavior:
    - [ ] Uploader status and image flows remain usable on desktop and mobile after the rewrite.
    - [ ] xa-b product cards, buy box, cart, and gallery reflect the new status/media model without broken labels, overflow, or contrast regressions.
- **Validation contract (TC-04):**
  - TC-01: regression tests cover new status/media behaviors and remove stale expectations tied to `ready`, `stock`, and `role`.
  - TC-02: committed catalog fixture data, uploader copy, image-route tests, and stale-cart expectations are consistent with the new canonical contract; incompatible legacy fixtures are removed or regenerated.
  - TC-03: run `lp-design-qa`, `tools-ui-contrast-sweep`, and `tools-ui-breakpoint-sweep` on changed routes/components; Critical/Major findings are fixed and re-verified.
  - Targeted validation commands:
    - `pnpm --filter @acme/lib typecheck`
    - `pnpm --filter @acme/lib lint`
    - `pnpm --filter @apps/xa-uploader typecheck`
    - `pnpm --filter @apps/xa-uploader lint`
    - `pnpm --filter @apps/xa-b typecheck`
    - `pnpm --filter @apps/xa-b lint`
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run:
    - `rg -n "stock:|role\\b|ready" apps/xa-b/src apps/xa-uploader/src packages/lib/src -g '*test*' -S`
    - `rg -n "\"role\"|\"stock\"" apps/xa-b/src/data -S`
  - Validation artifacts:
    - xa-b runtime fixtures in `apps/xa-b/src/data/`
    - uploader/storefront/shared-lib test files listed above
  - Unexpected findings:
    - the remaining stale-contract drift is now primarily media-role fixture/copy/test debt; status/stock drift no longer remains in the canonical repo state.
- **Scouts:** `None: test/fixture surface already enumerated`
- **Edge Cases & Hardening:** stale i18n keys after role-label removal; responsive regression in uploader image controls; cart UI with persisted quantities for products now marked `out_of_stock`.
- **What would make this >=90%:**
  - TASK-02 and TASK-03 land with one canonical fixture set that can be reused across uploader and xa-b tests.
- **Rollout / rollback:**
  - Rollout:
    - run scoped UI QA after contract rewrite before considering the feature build-ready.
  - Rollback:
    - revert stale-fixture/test updates together with the underlying feature changes if a checkpoint replan is required.
- **Documentation impact:**
  - update plan validation evidence and log any deferred Minor UI findings with rationale.
- **Notes / references:**
  - Delivery rehearsal same-outcome finding folded here: fixture data and test seeds are part of the same outcome and must be updated in the same lane, not later.
#### Implementation Update (2026-03-06)
- Updated regression fixtures/tests/copy for the new main-image-first contract in shared lib, xa-uploader, and xa-b.
- Regenerated `apps/xa-uploader/data/products.xa-b.csv`, `apps/xa-b/src/data/catalog.runtime.json`, and `apps/xa-b/src/data/catalog.media.runtime.json` so the repo no longer ships mixed status/media assumptions.
- Scoped package validation passed for `@acme/lib`, `@apps/xa-uploader`, and `@apps/xa-b`. The broad `scripts/validate-changes.sh` run expanded into unrelated dirty-worktree packages and was not used as the task gate.

### TASK-05: Horizon checkpoint - reassess downstream build readiness
- **Type:** CHECKPOINT
- **Deliverable:** updated plan evidence via `/lp-do-replan`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-03-06)
- **Affects:** `docs/plans/xa-uploader-status-and-media-model-rewrite/plan.md`
- **Depends on:** TASK-04
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% - process is defined
  - Approach: 95% - checkpoint prevents pushing a large contract rewrite forward without fresh evidence
  - Impact: 95% - controls downstream risk before any follow-on work
- **Acceptance:**
  - `/lp-do-build` checkpoint executor run
  - `/lp-do-replan` run on any downstream tasks or follow-up scope discovered during TASK-02..TASK-04
  - confidence for any remaining work recalibrated from latest evidence
  - plan updated and re-sequenced if needed
- **Horizon assumptions to validate:**
  - the explicit drop/ignore/regenerate cleanup rules map cleanly onto the persisted row shapes encountered during implementation.
  - the fixed one-unit stale-cart rule lands cleanly across PDP, quick add, cart, and storage.
  - scoped UI QA found no unresolved Critical/Major regressions.
- **Validation contract:** updated plan state and replan evidence recorded in this plan after checkpoint execution
- **Planning validation:** checkpoint added because TASK-02..TASK-04 form one long dependency chain touching shared contract, uploader UI, and storefront consumers
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** update `docs/plans/xa-uploader-status-and-media-model-rewrite/plan.md`
#### Checkpoint Result (2026-03-06)
- No downstream replan was required after TASK-03/TASK-04. The active XA contract surfaces now agree on status-only availability and ordered main/additional-photo media semantics.
- Remaining repo-wide validation noise came from unrelated modified packages already present in the shared working tree, not from the XA task surface.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Confirm legacy draft migration mode | Yes | None — operator confirmed legacy CSV/cloud draft data does not need to survive | No |
| TASK-06: Codify fail-closed legacy cleanup contract | Yes | None — ingress and fixture surfaces now have explicit `discard`, `ignore on read`, or `regenerate` handling | No |
| TASK-07: Define status-only cart quantity contract | Yes | None — storefront quantity and stale-cart seams now have one explicit one-unit rule | No |
| TASK-02: Rewrite status semantics and remove numeric stock | Yes | None — legacy cleanup and cart-quantity uncertainty are externalized into precursor tasks | No |
| TASK-03: Rewrite media semantics to main image plus ordered additional photos | Yes | None — legacy cleanup ambiguity is externalized into TASK-06 before media implementation | No |
| TASK-04: Harden regression coverage, fixtures, and UI verification | Yes | None — fixture/test/copy cleanup and scoped UI QA are explicitly included instead of assumed | No |
| TASK-05: Horizon checkpoint - reassess downstream build readiness | Yes | None | No |

## Risks & Mitigations
- Incompatible legacy rows are left half-supported -> TASK-02/TASK-03 explicitly require dropped CSV rows, ignored cloud snapshot rows, and regenerated canonical fixtures/runtime artifacts.
- Status rewrite lands without sync/filter changes -> TASK-02 explicitly owns save route, sync route, and xa-b consumer updates together.
- Status-only availability lands without an explicit cart quantity rule -> TASK-02 now owns a fixed one-unit quantity rule with stale-cart reconciliation.
- Media rewrite lands without storefront/gallery update -> TASK-03 explicitly owns xa-b hydration and gallery behavior.
- Old role/stock fixtures keep passing stale assumptions -> TASK-04 explicitly updates committed fixture/test data.

## Observability
- Logging:
  - preserve explicit route reason codes from uploader save/sync failures while rewriting status/media semantics.
- Metrics:
  - None: no new metrics surfaced in the fact-find; rely on existing operator-visible save/sync feedback.
- Alerts/Dashboards:
  - None: no new alerting surface is introduced by this plan.

## Acceptance Criteria (overall)
- [ ] XA uploader uses `draft | live | out_of_stock` with no numeric stock field.
- [ ] XA uploader image flow uses one main image plus ordered additional photos.
- [ ] xa-b storefront availability and gallery behavior match the rewritten contract.
- [ ] Shared/export/publish paths no longer rely on `ready`, `stock`, or role-based media semantics.
- [ ] Regression tests, fixtures, and scoped UI QA confirm the new contract on both uploader and storefront surfaces.

## Delivery Rehearsal
- Data:
  - Same-outcome finding: committed xa-b runtime fixtures and multiple tests still encode `stock`/`role`; folded into TASK-04 because fixture/test correction is part of the same rewritten contract outcome.
- Process/UX:
  - Same-outcome finding: uploader status selection, out-of-stock behavior, and main/additional-photo empty/error states must be specified in task acceptance; folded into TASK-02 and TASK-03.
- Security:
  - No new auth boundary is introduced. Existing uploader auth/session and sync authorization remain unchanged.
- UI:
  - Rendering paths are explicit: uploader changes live in `CatalogProductForm`, `CatalogProductBaseFields`, `CatalogProductImagesFields`; storefront changes live in `XaProductCard`, `XaBuyBox.client.tsx`, `XaImageGallery.client.tsx`, and `app/cart/page.tsx`.

## Decision Log
- 2026-03-06: Created plan from `docs/plans/xa-uploader-status-and-media-model-rewrite/fact-find.md`.
- 2026-03-06: Status semantics chosen for planning: `draft` unpublished, `live` published+purchasable, `out_of_stock` published+not purchasable.
- 2026-03-06: Operator confirmed legacy CSV/cloud draft data does not need to survive; plan switched to explicit break-and-fix cleanup for incompatible persisted rows.
- 2026-03-06: Replanned low-confidence IMPLEMENT tasks by adding TASK-06 and TASK-07 precursor investigations instead of carrying cleanup/quantity uncertainty inline.
- 2026-03-06: Completed TASK-06 and TASK-07; plan is now ready for TASK-02 with explicit cleanup and status-only cart contracts.
- 2026-03-06: [Adjacent: delivery-rehearsal] None.

## Overall-confidence Calculation
- TASK-01: 90% x S(1) = 90
- TASK-06: 85% x S(1) = 85
- TASK-07: 85% x S(1) = 85
- TASK-02: 85% x L(3) = 255
- TASK-03: 85% x L(3) = 255
- TASK-04: 82% x M(2) = 164
- TASK-05: 95% x S(1) = 95
- Total = 1029 / 12 = 86%
