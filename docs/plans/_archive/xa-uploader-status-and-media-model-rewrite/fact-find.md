---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-06
Last-updated: 2026-03-06
Last-reviewed: 2026-03-06
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-uploader-status-and-media-model-rewrite
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/xa-uploader-status-and-media-model-rewrite/plan.md
Dispatch-ID: IDEA-DISPATCH-20260306172218-9027
Trigger-Why: The current xa-uploader product model and media workflow no longer match the confirmed operator requirements. The app already has the correct one-page shell, but the underlying status and image contracts are still built around `ready` state, numeric stock, and role-based media.
Trigger-Intended-Outcome: A planning-ready implementation path exists for xa-uploader to use `draft | live | out_of_stock` status semantics, `main image + additional photos` media semantics, predetermined registry-backed product entry, and the existing one-page sidebar/editor workflow — with xa-b updated in coordination.
---

# XA Uploader Status and Media Model Rewrite Fact-Find Brief

## Scope
### Summary
Investigate the planning scope required to align `apps/xa-uploader` with the newly confirmed operator workflow: one-page catalog editing with predetermined selections, `main product image` plus ordered `additional photos`, and a simplified status model where `live` means published and in stock, `out of stock` is first-class, and numeric stock tracking is removed.

### Goals
- Replace role-based image handling with explicit `main` plus ordered additional photos.
- Replace `draft | ready | live` plus numeric stock with an operator-facing status model centered on `draft | live | out of stock`.
- Preserve predetermined registry-backed selection workflow for brand, collection, size, colors, and materials.
- Keep existing internal derived fields (`title`, `description`, `subcategory`, `slug`) in use.
- Produce a planning-ready brief for the implementation rewrite without starting build work.

### Non-goals
- Reintroducing free-form custom product entry.
- Redesigning the left sidebar or moving away from the existing one-page console layout.
- Removing internal derived fields from the contract.
- Running implementation, plan, or build work in this turn.

### Constraints & Assumptions
- Constraints:
  - The current app is effectively `xa-b` / bags-only in runtime configuration.
  - The sidebar workflow of `New Product`, `Show all products`, and `Find product` remains in place.
  - The operator has explicitly chosen to allow publish with only the main image present.
- Assumptions:
  - `live` should mean both published and in stock.
  - `out of stock` should replace numeric inventory for operator purposes rather than coexist with it.
  - Registry-backed predetermined entry remains the intended operating mode.

## Outcome Contract
- **Why:** The current xa-uploader product model and media workflow no longer match the confirmed operator requirements. The app already has the correct one-page shell, but the underlying status and image contracts are still built around `ready` state, numeric stock, and role-based media.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A planning-ready implementation path exists for xa-uploader to use `draft | live | out of stock` status semantics, `main image + additional photos` media semantics, predetermined registry-backed product entry, and the existing one-page sidebar/editor workflow.
- **Source:** operator

## Access Declarations
None.

## Evidence Audit (Current State)
### Entry Points
- `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx` - one-page catalog shell with sidebar + editor.
- `apps/xa-uploader/src/components/catalog/EditProductFilterSelector.client.tsx` - left sidebar actions and filter-driven product selection.
- `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx` - step-based product editor and status presentation.
- `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx` - role-based image upload flow.
- `apps/xa-uploader/src/app/api/catalog/products/route.ts` - save/list endpoint with publish-state derivation.
- `apps/xa-uploader/src/app/api/catalog/sync/route.ts` - publish pipeline still filters `ready | live` products before building catalog artifacts.

### Key Modules / Files
- `packages/lib/src/xa/catalogAdminSchema.ts` - current draft schema; still contains `publishState` and numeric `stock`.
- `packages/lib/src/xa/catalogWorkflow.ts` - current data/publish readiness logic; publishability depends on role-based image coverage.
- `packages/lib/src/xa/catalogImageRoles.ts` - current role taxonomy and category-required role rules.
- `packages/lib/src/xa/catalogCsvMapping.ts` - current CSV mapping; still persists numeric `stock` and role-derived media paths.
- `apps/xa-uploader/src/lib/catalogDraftToContract.ts` - downstream artifact builder; still emits numeric `stock` and role-sorted media.
- `apps/xa-uploader/src/components/catalog/CatalogProductBaseFields.client.tsx` - registry-backed selectors and derived-field generation.
- `apps/xa-uploader/src/app/api/catalog/images/route.ts` - upload API currently requires a semantic `role` query parameter and encodes it into filenames.
- `apps/xa-uploader/src/app/api/catalog/sync/route.ts` - cloud publish path still treats `ready` as a publishable state and will need status-filter rewrite together with save/export logic.
- `docs/briefs/xa-uploader-hard-blockers-briefing.md` - operator-confirmed blocker analysis and decisions from this session.

### Patterns & Conventions Observed
- The requested one-page shell already exists: sidebar and editor render together in the main catalog screen.
  - Evidence: `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx:144`
- Sidebar actions already align in substance with the requested operator workflow.
  - Evidence: `apps/xa-uploader/src/components/catalog/EditProductFilterSelector.client.tsx:366`
- Product status is currently inferred from readiness plus `publishState`, not selected as the requested final set.
  - Evidence: `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx:74`
- Cloud publish still depends on the legacy `ready | live` status split when deciding which products are publishable.
  - Evidence: `apps/xa-uploader/src/app/api/catalog/sync/route.ts:1083`
- Image upload is currently semantic-role based and publish-readiness requires category-specific role coverage.
  - Evidence: `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx:802`
  - Evidence: `packages/lib/src/xa/catalogWorkflow.ts:40`
- Registry-backed selectors drive size, materials, colors, and derived text generation; this is intentional and should be preserved.
  - Evidence: `apps/xa-uploader/src/components/catalog/CatalogProductBaseFields.client.tsx:94`
  - Evidence: `apps/xa-uploader/src/components/catalog/CatalogProductBaseFields.client.tsx:131`

### Data & Contracts
- Types/schemas/events:
  - `publishState` is currently `draft | ready | live`.
  - `stock` is still a validated numeric field.
  - internal contract still requires `title`, `description`, and `taxonomy.subcategory`.
- Persistence:
  - product drafts still map to CSV rows with numeric `stock`.
  - media still maps through `imageFiles`, `imageAltTexts`, and role-derived `media_paths`.
- API/contracts:
  - product save derives `draft` vs `ready` automatically.
  - sync publish only includes products whose normalized state is `ready` or `live`.
  - image upload requires `storefront`, `slug`, and semantic `role`.

### Dependency & Impact Map
- Upstream dependencies:
  - registry-backed catalog metadata in `apps/xa-uploader/src/lib/catalogBrandRegistry.ts`
  - current schema/helpers in `packages/lib/src/xa/*`
  - upload route semantics in `apps/xa-uploader/src/app/api/catalog/images/route.ts`
- Downstream dependents (xa-uploader internal):
  - CSV mapping and draft persistence (`packages/lib/src/xa/catalogCsvMapping.ts`)
  - publish-readiness helpers (`packages/lib/src/xa/catalogWorkflow.ts`)
  - save route status promotion / unpublish guard (`apps/xa-uploader/src/app/api/catalog/products/route.ts`)
  - contract/export generation for catalog media payloads (`apps/xa-uploader/src/lib/catalogDraftToContract.ts`)
  - sync route (`apps/xa-uploader/src/app/api/catalog/sync/route.ts`) — filters publishable products by `ready | live`, then calls `buildCatalogArtifactsFromDrafts` to assemble the published catalog payload
- Downstream dependents (cross-app — CRITICAL):
  - `apps/xa-b/src/contexts/XaCartContext.tsx:48` — reads `sku.stock` for cart quantity limits; removing `stock` from the published contract makes all items appear unavailable or unlimited
  - `apps/xa-b/src/lib/inventoryStore.ts:40` — reads `product.stock` for availability calculation; same breakage
  - `apps/xa-b/src/components/XaImageGallery.client.tsx:26-30` — maps media item `role` values to ARIA/accessibility labels; removing `role` from published media entries degrades image accessibility on the storefront
  - `apps/xa-b/src/app/cart/page.tsx:149` — `max={line.sku.stock}` sets cart quantity ceiling
  - `apps/xa-drop-worker` — receives and stores the published catalog payload (pass-through for `mediaIndex`; no interpretation of `role`)
- Likely blast radius:
  - schema and workflow helpers (xa-uploader-internal)
  - product form and images UI (xa-uploader-internal)
  - image upload route (xa-uploader-internal)
  - CSV mapping / contract export (xa-uploader-internal)
  - tests covering readiness, image upload, and draft mapping (xa-uploader-internal)
  - xa-b availability model and image gallery (cross-app — requires coordinated update)

### Test Landscape
#### Test Infrastructure
- Frameworks:
  - Jest + React Testing Library in `apps/xa-uploader`
  - shared lib tests in `packages/lib/src/xa/__tests__`
- Commands:
  - `pnpm --filter @apps/xa-uploader typecheck`
  - `pnpm --filter @apps/xa-uploader lint`
- CI integration:
  - CI is the source of truth for tests; local Jest execution is not required for this fact-find.

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Product form behavior | Unit | `apps/xa-uploader/src/components/catalog/__tests__/CatalogProductForm.test.tsx` | Covers step flow and save button behavior. |
| Image fields behavior | Unit | `apps/xa-uploader/src/components/catalog/__tests__/CatalogProductImagesFields.test.ts` | Covers upload/reorder/remove behavior in current role-based model. |
| Edit filter behavior | Unit | `apps/xa-uploader/src/components/catalog/__tests__/catalogEditFilter.test.ts` | Covers sidebar filter logic. |
| Draft schema rules | Unit | `apps/xa-uploader/src/lib/__tests__/catalogAdminSchema.test.ts` | Covers required field validation and category rules. |
| Draft-to-contract / workflow | Unit | `apps/xa-uploader/src/lib/__tests__/catalogDraftToContract.test.ts`, `packages/lib/src/xa/__tests__/catalogWorkflow.test.ts` | Covers export shape and publish-readiness helpers. |
| Sync publish behavior | Unit/integration | `apps/xa-uploader/src/app/api/catalog/sync/__tests__/route.test.ts`, `apps/xa-uploader/src/app/api/catalog/sync/__tests__/route.branches.test.ts`, `apps/xa-uploader/src/app/api/catalog/sync/__tests__/route.cloud-publish.test.ts` | Covers publish flow, cloud publish failures, and branch handling under the current `ready | live` model. |

#### Coverage Gaps
- No tests for a `main image + additional photos` contract because the current model is role-based.
- No tests for `out of stock` as a first-class status because the current model uses numeric stock.
- No tests for the removal of `ready` state because current save logic derives it automatically.
- No tests for sync-publish filtering or empty-catalog confirmation under a `draft | live | out_of_stock` model; current sync tests still assume `ready` remains publishable.

#### Testability Assessment
- Easy to test:
  - status derivation helper changes
  - schema changes for `publishState` and stock removal
  - media ordering and main-image presence rules
- Hard to test:
  - keeping old CSV/contract compatibility while removing role semantics
  - preserving current upload/delete behavior while changing image metadata contract

#### Recommended Test Approach
- Unit tests for:
  - new status schema and derivation rules
  - main-image-only readiness helper
  - media ordering and serialization rules
- Integration tests for:
  - save flow across `draft`, `live`, and `out of stock`
  - image upload flow without semantic roles
  - sync publish flow after `ready` removal, including `no_publishable_products` confirmation behavior
- Contract tests for:
  - CSV mapping, sync selection, and contract export after stock and role removal

## Rehearsal Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| One-page catalog shell | Yes | None | No |
| Sidebar workflow | Yes | None | No |
| Status contract | Yes | None — rewrite surface identified clearly across schema, save route, sync route, UI, and export | No |
| Media contract | Yes | None — rewrite surface identified clearly across UI, route, workflow, export | No |
| Registry-backed entry constraints | Yes | None — operator confirmed predetermined-only entry | No |
| Derived field preservation | Yes | None — operator confirmed no change | No |

## Questions
### Resolved
- Q: Does the one-page sidebar/editor shell need a redesign?
  - A: No. The requested one-page shell already exists and remains in scope as-is.
  - Evidence: `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx:144`

- Q: Should image coverage remain role-based?
  - A: No. The operator chose `main product image` plus ordered `additional photos`, with only the main image required for publish.
  - Evidence: `docs/briefs/xa-uploader-hard-blockers-briefing.md`

- Q: Should numeric stock remain?
  - A: No. Numeric stock tracking is being removed; `live` means published and in stock, `out of stock` is first-class.
  - Evidence: `docs/briefs/xa-uploader-hard-blockers-briefing.md`

- Q: Is free-form product entry required?
  - A: No. Product entry remains predetermined and registry-backed.
  - Evidence: `docs/briefs/xa-uploader-hard-blockers-briefing.md`

- Q: Should hidden derived fields be removed from the contract?
  - A: No. `title`, `description`, and `subcategory` remain in use.
  - Evidence: `docs/briefs/xa-uploader-hard-blockers-briefing.md`

- Q: What is the xa-b availability model after stock removal?
  - A: Cart availability is determined solely by status. If status ≠ `out_of_stock`, the product can go into the cart. No numeric stock field is needed. xa-b cart logic switches from `sku.stock ?? 0` to a status check.
  - Source: operator (2026-03-06)

- Q: What is the xa-b image ordering model after role removal?
  - A: Images are ordered by their numeric index. The one exception is `main` — the main image is always first. No role-based ordering or role-keyed labels are needed going forward.
  - Source: operator (2026-03-06)

- Q: Is there live product data in the CSV store requiring migration compatibility?
  - A: No. Legacy CSV/cloud draft data does not need to survive. The persistence rewrite can use break-and-fix semantics rather than carrying backward-compatible read paths or migration tooling.
  - Source: operator (2026-03-06)

### Open (Operator Input Required)
None.

## Confidence Inputs
- Implementation: 90%
  - Evidence basis: rewrite surfaces are explicit and localized across schema, helpers, save/publish routes, UI, and export. No product-definition ambiguity remains.
  - What would raise this to >=90: already at threshold.
  - What would raise this to >=95: a small schema/serialization spike confirming the cleanest break-and-fix cleanup path for legacy CSV rows.
- Approach: 93%
  - Evidence basis: operator decisions closed all key product questions in-session.
  - What would raise this to >=90: already at threshold.
  - What would raise this to >=95: a small persistence spike proving the cleanest one-shot cleanup for legacy rows.
- Impact: 88%
  - Evidence basis: the rewrite aligns the tool with the confirmed operator workflow and removes mismatched concepts (`ready`, numeric stock, role-based media).
  - What would raise this to >=90: explicit acceptance criteria for the operator-facing status and image UI copy.
  - What would raise this to >=95: a staging walkthrough with representative bag products.
- Delivery-Readiness: 86%
  - Evidence basis: scope is planning-ready, but implementation still spans multiple surfaces even with legacy compatibility removed.
  - What would raise this to >=90: a concrete sequencing plan for schema -> mapping -> UI -> route -> export.
  - What would raise this to >=95: a quick cleanup spike showing how legacy rows are discarded or regenerated safely.
- Testability: 89%
  - Evidence basis: core changes are deterministic and coverable with unit/integration tests, and legacy compatibility no longer needs preserving.
  - What would raise this to >=90: fixture set covering break-and-fix legacy-row cleanup plus the new canonical shapes.
  - What would raise this to >=95: one canonical uploader/storefront fixture pack shared across schema, sync, and xa-b tests.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Status semantics drift between UI, save route, sync publish route, and export | Medium | High | Centralize status derivation and update all current `ready`/stock call sites together, including sync publish filtering and empty-publish confirmation copy |
| Legacy CSV rows still contain numeric stock and role-derived media paths | Medium | Low | Operator confirmed legacy data does not need to survive; implementation can discard or regenerate incompatible rows explicitly |
| Upload route remains coupled to `role` query param and filename convention | High | Medium | Replace route contract and filename generation as part of the same rewrite |
| Removing role coverage weakens current image-quality guarantees | High | Low | Accepted by operator; keep only main-image presence as publish gate |
| `xa-b` cart requires availability model update when `stock` is removed | High | High | Resolved by operator: xa-b cart switches to status check (≠ `out_of_stock`); included as explicit IMPLEMENT task seed |
| `xa-b` image gallery role-keyed labels become orphaned when `role` removed from media | Medium | Low | Resolved by operator: images ordered by numeric index with `main` first; `XaImageGallery` role map removed as part of xa-b coordination task |

## Planning Constraints & Notes
- Must-follow patterns:
  - Preserve the existing one-page shell and sidebar workflow.
  - Preserve registry-backed predetermined entry.
  - Preserve derived internal fields.
  - Remove `ready` and numeric stock together; do not leave mixed semantics behind in save logic, sync publish filtering, or operator copy.
  - xa-b must be updated in coordination with the published catalog contract changes. Stock removal and role removal affect the live storefront's cart and image accessibility — these are cross-app contract changes, not xa-uploader-internal changes.
- Rollout/rollback expectations:
  - Cross-app rewrite: rollback requires reverting both xa-uploader and xa-b changes together, plus any deployed catalog data in the drop worker's store. Plan a coordinated rollback path.
  - Internal tool rewrite alone: reverting schema/UI/export changes is sufficient for the uploader side.
- Observability expectations:
  - At minimum, preserve current operator-facing save/upload feedback and make status transitions explicit.

## Suggested Task Seeds (Non-binding)
- IMPLEMENT: replace draft schema/status helpers with `draft | live | out_of_stock` semantics and remove numeric stock. Update save-route derivation and sync-route publish filtering in the same task. (Canonical enum value: `out_of_stock` for schema; "out of stock" for operator-facing UI copy.)
- IMPLEMENT: replace role-based image model with `main` plus ordered additional photos across UI, route, and export.
- IMPLEMENT: update persistence logic for legacy CSV/media rows using break-and-fix semantics; incompatible legacy rows may be discarded or regenerated rather than migrated forward.
- IMPLEMENT: update tests covering status derivation, sync publish selection, publish-readiness, and media serialization.
- IMPLEMENT: update xa-b to consume the new catalog contract shape — replace `sku.stock`-based cart availability with a status check (available when status ≠ `out_of_stock`); replace `XaImageGallery` role-keyed label mapping with numeric-index ordering, with `main` image always first. Coordinate deployment with the catalog contract rewrite.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - none
- Deliverable acceptance package:
  - one-page shell unchanged
  - predetermined registry-backed entry unchanged
  - status model rewritten to `draft | live | out of stock`
  - main-image-plus-gallery model replaces role semantics
  - numeric stock removed
- Post-delivery measurement plan:
  - operator walkthrough with representative bag products covering draft, live, out-of-stock, and image upload flows

## Scope Signal
- Signal: right-sized
- Rationale: the work is structurally significant but still bounded around one uploader draft contract, one publish pipeline, and one coordinated xa-b consumer update. The product decisions are closed, so planning can focus on sequencing and migration rather than discovery.

## Evidence Gap Review
### Gaps Addressed
- Closed the product-definition ambiguities around media semantics, status semantics, registry-only entry, and derived internal fields.
- Confirmed the one-page shell is already aligned and should not be treated as a redesign task.
- Identified the concrete rewrite surfaces for status and media changes, including save-route derivation and sync-route publish filtering.

### Confidence Adjustments
- Raised implementation confidence because status/media decisions are now explicit operator choices rather than inferred assumptions.
- Reduced scope ambiguity by removing custom-entry and hidden-field redesign from the change set.

### Remaining Assumptions
- Legacy draft/media rows can be discarded or regenerated during the rewrite without requiring compatibility reads.
- The operator accepts the loss of role-based image quality enforcement in favor of main-image-only publishability.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None
- Notes:
  - xa-b availability model and image ordering confirmed by operator — xa-b is in scope as an explicit IMPLEMENT task.
  - Legacy data survival is no longer a planning unknown; the implementation may use break-and-fix persistence cleanup.
- Recommended next step:
  - `/lp-do-plan xa-uploader-status-and-media-model-rewrite --auto`
