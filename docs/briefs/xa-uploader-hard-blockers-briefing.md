---
Type: Briefing
Outcome: Understanding
Status: Active
Domain: UI
Created: 2026-03-06
Last-updated: 2026-03-06
Topic-Slug: xa-uploader-hard-blockers
---

# XA Uploader Hard Blockers Briefing

## Executive Summary
The requested one-page `xa-uploader` workflow is partly already live. The console already renders a fixed left sidebar and editor on one catalog screen, and the sidebar already exposes the same three operator actions in substance: add a new product, show all products, and find a product.

The main gaps are not page layout gaps. They are product-model and workflow-semantics gaps:
- status model rewrite (`draft | ready | live` today vs first-class `out of stock` with no numeric stock tracking)
- image model rewrite decision (replace role-based shots with explicit main-image-plus-gallery ordering)
- save-before-upload gating that makes the page one screen but still a two-step flow

No absolute hard blocker was found for a bag-oriented implementation. The main structural rewrites are now status and image handling, but both are implementation decisions rather than unresolved design disputes.

## Questions Answered
- Is the requested one-page layout already present?
- Does the current sidebar already match the requested left-hand actions?
- Which requested fields already exist in the live form?
- Which requested fields are incomplete or constrained by the current data model?
- Are there true hard blockers, or mostly medium-difficulty changes?

## High-Level Architecture
- Components:
  - `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx` - main console shell for catalog vs currency screens
  - `apps/xa-uploader/src/components/catalog/EditProductFilterSelector.client.tsx` - left sidebar actions and product finder
  - `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx` - step-based product editor (`Product` then `Images`)
  - `apps/xa-uploader/src/components/catalog/CatalogProductBaseFields.client.tsx` - brand, collection, size, materials, colors, stock, price, and bag-derived fields
  - `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx` - image upload, role assignment, reorder/remove
- Data stores / external services:
  - `packages/lib/src/xa/catalogAdminSchema.ts` - core product draft schema and validation contract
  - `apps/xa-uploader/src/app/api/catalog/products/route.ts` - save/list API with publish-state derivation
  - `apps/xa-uploader/src/lib/catalogDraftToContract.ts` - downstream catalog/media artifact builder

## End-to-End Flow
### Current primary flow
1. The console opens to the catalog screen, not separate add/edit tabs.
2. The screen renders a two-column layout: left sidebar for product actions, right panel for the product editor.
3. The operator uses the sidebar to create a new draft or locate an existing product.
4. The product form saves details first.
5. Only after the product is data-valid does the image step become available.
6. Images are uploaded with required shot roles and then autosaved into the draft.

- Evidence: `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx:144`
- Evidence: `apps/xa-uploader/src/components/catalog/EditProductFilterSelector.client.tsx:366`
- Evidence: `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx:213`
- Evidence: `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx:638`

### Requested vs current alignment
- Already aligned:
  - one-page sidebar + editor layout
  - left sidebar actions for new/show all/find product
  - bag-oriented fields for brand, collection, materials, exterior colours, price
- Partially aligned:
  - size, interior colours, hardware colour
  - images
  - status

## Data & Contracts
- Key types/schemas:
  - `publishState` is currently `draft | ready | live`
  - numeric `stock` is currently still part of the schema and downstream export
  - required internal product fields still include `title`, `description`, and `taxonomy.subcategory`
  - image readiness is currently based on role coverage, not primary-vs-gallery semantics
- Source of truth:
  - product draft validation: `packages/lib/src/xa/catalogAdminSchema.ts`
  - save-time publish-state derivation: `apps/xa-uploader/src/app/api/catalog/products/route.ts`
  - exported catalog/media shape: `apps/xa-uploader/src/lib/catalogDraftToContract.ts`

## Operator Decision
- Decision:
  - add `out of stock` as a first-class status
  - remove numeric stock tracking from the operator workflow and contract
  - treat availability as binary rather than quantity-based
  - define `live` to mean both published and in stock; do not store publish state and availability separately
  - adopt Option B
  - replace role-based image capture with `main product image` plus ordered `additional photos`
  - drop the current category-specific minimum-role requirement
  - allow publish with only the main image present
  - keep product entry predetermined; no free-form custom product entry
- Immediate implication:
  - the current `stock` field and `0 means sold out` hint become obsolete
  - status derivation logic can no longer infer availability from numeric stock
  - this removes the policy argument for required front/side/top coverage
  - it also means the current role-based schema, upload API, readiness logic, and export ordering should be treated as implementation targets for replacement rather than preserved constraints
  - registry-backed select-only behavior for brand, collection, size, and related attributes is aligned with the intended workflow
  - existing internal derived fields such as `title`, `description`, and `subcategory` remain in use; they are not in scope for removal

## Initial Hard Blockers
### 1. Status model rewrite (decided)
- Current state:
  - schema accepts `draft | ready | live`
  - save route derives `draft` or `ready` automatically unless the product is already `live`
  - UI copy shows readiness labels like `Incomplete`, `Draft ready`, `Ready to publish`, `Published to catalog`
  - `out of stock` is represented indirectly through numeric stock, not through status
- Chosen future state:
  - add `out of stock` as a first-class state
  - remove numeric stock quantity tracking
  - keep availability binary rather than count-based
  - use `live` to mean published and in stock
- Why this matters:
  - the current save flow treats `ready` as an internal publish-readiness state, not an operator-facing product status
  - the current schema, UI, save route, and export payload all still carry numeric stock
  - if numeric stock is removed, availability must be represented directly in the status model
- Difficulty: medium-hard
- Blocker class: structural rewrite, but not a hard blocker
- Practical effect on blockers:
  - this is no longer a product-decision blocker
  - it is now an implementation rewrite across schema, UI, save derivation, publish-readiness messaging, and export
- Evidence:
  - `packages/lib/src/xa/catalogAdminSchema.ts:35`
  - `packages/lib/src/xa/catalogAdminSchema.ts:107`
  - `apps/xa-uploader/src/app/api/catalog/products/route.ts:104`
  - `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx:74`
  - `apps/xa-uploader/src/lib/uploaderI18n.ts:285`

### 2. Image model rewrite (decided)
- Current state:
  - images are uploaded against a selected shot role (`front`, `side`, `top`, `back`, `detail`, `interior`, `scale`)
  - required roles vary by category
  - downstream media export sorts by role
- Chosen future state:
  - one explicit `main product image`
  - zero or more ordered `additional photos`
  - publish permitted when only the main image exists
- Why this matters:
  - the current system has no explicit `main image` field, only role-ordered media
  - upload API, validation, and downstream export all currently assume a semantic role value
- Difficulty: medium-hard
- Blocker class: structural rewrite, but not a hard blocker
- Practical effect on blockers:
  - this is no longer blocked by product-policy disagreement
  - it is now a straightforward implementation rewrite across schema, UI, API, readiness rules, and export behavior
- Evidence:
  - `packages/lib/src/xa/catalogImageRoles.ts:33`
  - `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx:802`
  - `apps/xa-uploader/src/lib/catalogDraftToContract.ts:420`

## Important Gaps That Are Not Hard Blockers
### Save-before-upload gating
- Current state:
  - the editor is still a two-step flow inside one page
  - image upload is blocked until the product has a slug and has been saved
- Difficulty: medium
- Risk:
  - if the requirement is only "one screen", current behavior already satisfies it
  - if the requirement is "single uninterrupted create flow", extra work is needed
- Evidence:
  - `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx:213`
  - `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx:638`

### Minimum image coverage is no longer a blocker candidate
- Current state:
  - publish-readiness currently depends on category-specific role coverage
- Operator decision:
  - only the main image should be required for publish
- Effect:
  - this removes the previous product-quality gate as a blocker discussion
  - the remaining work is implementation: replace role-based readiness with main-image presence
- Evidence:
  - `packages/lib/src/xa/catalogWorkflow.ts:40`
  - `packages/lib/src/xa/catalogImageRoles.ts:33`

### Predetermined registry-only entry is intentional
- Current state:
  - `size` is registry-backed
  - `interior colours` and `hardware colour` render from registry-backed options
  - the selector-driven workflow depends on predetermined brand and collection data
- Operator decision:
  - no free-form custom entry is required
- Effect:
  - this is no longer a product-gap or blocker candidate
  - missing fallback inputs for custom products should not be treated as defects for the requested workflow
- Evidence:
  - `apps/xa-uploader/src/components/catalog/CatalogProductBaseFields.client.tsx:94`
  - `apps/xa-uploader/src/components/catalog/CatalogProductBaseFields.client.tsx:173`
  - `apps/xa-uploader/src/components/catalog/CatalogProductBaseFields.client.tsx:471`

### Hidden required fields remain part of the contract
- Current state:
  - backend validation still requires `title`, `description`, and `subcategory`
  - for registry-backed products, title/slug/description are auto-derived from brand, collection, size, color, and material
- Operator decision:
  - these values remain in use exactly as they do today
- Effect:
  - this is not a blocker candidate
  - the current derivation path should be preserved rather than redesigned away
- Evidence:
  - `packages/lib/src/xa/catalogAdminSchema.ts:100`
  - `packages/lib/src/xa/catalogAdminSchema.ts:110`
  - `packages/lib/src/xa/catalogAdminSchema.ts:119`
  - `apps/xa-uploader/src/components/catalog/CatalogProductBaseFields.client.tsx:131`

### Numeric stock removal is straightforward but cross-cutting
- Current state:
  - the form still exposes `stock`
  - the schema still validates `stock`
  - CSV mapping and downstream catalog payload still emit numeric `stock`
- Difficulty: medium
- Risk:
  - removing the field is conceptually simpler than adding quantity-aware inventory
  - but it still touches form fields, schema, mappings, sample data, export, and any readiness or storefront assumptions that consume numeric stock
- Evidence:
  - `packages/lib/src/xa/catalogAdminSchema.ts:107`
  - `apps/xa-uploader/src/components/catalog/CatalogProductBaseFields.client.tsx:683`
  - `packages/lib/src/xa/catalogCsvMapping.ts:112`
  - `apps/xa-uploader/src/lib/catalogDraftToContract.ts:450`

## Low-Severity Notes
- The runtime is effectively bag-only today (`xa-b` only), which matches the requested field set but matters if broader catalog scope is assumed.
  - Evidence:
    - `apps/xa-uploader/src/lib/catalogStorefront.ts:8`
    - `apps/xa-uploader/src/app/UploaderShell.client.tsx:63`
- The user instructions are stale and still mention old Add/Edit tabs.
  - Evidence:
    - `apps/xa-uploader/src/lib/uploaderI18n.ts:425`

## Tests and Coverage
- Existing tests:
  - form behavior: `apps/xa-uploader/src/components/catalog/__tests__/CatalogProductForm.test.tsx`
  - filter behavior: `apps/xa-uploader/src/components/catalog/__tests__/catalogEditFilter.test.ts`
  - image behavior: `apps/xa-uploader/src/components/catalog/__tests__/CatalogProductImagesFields.test.ts`
  - workflow readiness: `packages/lib/src/xa/__tests__/catalogWorkflow.test.ts`
- Confidence notes:
  - there is good unit coverage around the current workflow
  - the most disruptive changes would be schema and contract changes, not layout changes

## If You Later Want to Change This (Non-plan)
- Likely change points:
  - `packages/lib/src/xa/catalogAdminSchema.ts`
  - `apps/xa-uploader/src/components/catalog/CatalogProductBaseFields.client.tsx`
  - `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx`
  - `apps/xa-uploader/src/app/api/catalog/products/route.ts`
  - `apps/xa-uploader/src/lib/catalogDraftToContract.ts`
- Key risks:
  - status semantics drifting between UI, save API, and sync/export after removing `ready` and numeric `stock`
  - replacing role-based media with ordered media without fully updating upload, validation, and export codepaths
  - breaking registry-backed auto-generation paths for title/description/slug
