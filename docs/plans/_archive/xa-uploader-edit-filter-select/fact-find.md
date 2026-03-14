---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-04
Last-updated: 2026-03-04
Feature-Slug: xa-uploader-edit-filter-select
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/xa-uploader-edit-filter-select/plan.md
Trigger-Why: Edit mode product selection requires browsing a flat list — should use the same progressive brand/collection/size cascade as Add mode, auto-selecting when filter narrows to one product.
Trigger-Intended-Outcome: "type: operational | statement: Replace CatalogProductsList in Edit mode with progressive filter-down selectors that match Add mode UX; auto-populate form when single product matches the filter criteria. | source: operator"
---

# Edit Mode Progressive Filter Selection — Fact-Find Brief

## Scope

### Summary

The xa-uploader Edit mode currently uses a flat product list (`CatalogProductsList`) with text search. Users must browse or search by slug/title to find products. Add mode already has a progressive brand → collection → size cascade (`BrandCollectionSelectors` + `SizeSelector`). This feature replaces the Edit mode product selector with the same progressive cascade, filtering against the saved catalog and auto-selecting when the filter narrows to exactly one product.

### Goals

- Replace `CatalogProductsList` in Edit mode with progressive filter-down selectors (brand → collection → size → color)
- Reuse existing `BrandCollectionSelectors` and `SizeSelector` component patterns
- Auto-populate the edit form when exactly one product matches the current filter criteria
- Keep the existing text search as a fallback or remove it if the cascade covers all selection scenarios

### Non-goals

- Changing the Add mode workflow
- Modifying server-side product API endpoints
- Schema or data model changes
- Adding new brand registry entries

### Constraints & Assumptions

- Constraints:
  - No schema changes — reuse existing `CatalogProductDraftInput` and brand registry
  - Cloudflare free tier — no new runtime endpoints
  - Reuse existing selector components where possible
- Assumptions:
  - All saved products have `brandHandle` and `collectionHandle` set (registry products do)
  - Custom brand/collection products (`__custom__` sentinel handles) are rare but must remain accessible
  - The catalog is small enough (< 200 products) that client-side filtering is performant

## Outcome Contract

- **Why:** Edit mode product selection requires browsing a flat list — should use the same progressive brand/collection/size cascade as Add mode, auto-selecting when filter narrows to one product.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Replace CatalogProductsList in Edit mode with progressive filter-down selectors that match Add mode UX; auto-populate form when single product matches the filter criteria.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx` — Main console orchestrator; `ReviseScreen` renders the Edit mode layout
- `apps/xa-uploader/src/components/catalog/CatalogProductsList.client.tsx` — Current Edit mode product selector (flat list with text search)
- `apps/xa-uploader/src/components/catalog/CatalogProductBaseFields.client.tsx` — Add mode selectors (`BrandCollectionSelectors`, `SizeSelector`, `MaterialColorSelectors`)

### Key Modules / Files

- `apps/xa-uploader/src/components/catalog/CatalogProductsList.client.tsx` — Flat product list with text search; receives `products`, `query`, `selectedSlug`, `onSelect` props. Filters by slug/title match. This is the component to be replaced.
- `apps/xa-uploader/src/components/catalog/CatalogProductBaseFields.client.tsx` — Contains `BrandCollectionSelectors` (lines 196-388) and `SizeSelector` (lines 94-194). These manage local `selectedBrand`/`selectedCollection` state and cascade downstream clearing. `SizeSelector` auto-derives title, description, slug, dimensions, and popularity when a size is selected.
- `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts` — Central state hook. `handleSelect(product)` normalizes and loads a product into the form. `loadCatalog()` fetches products from `/api/catalog/products`. Returns `products: CatalogProductDraftInput[]`.
- `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts` — Pure action functions. `handleSelectImpl` calls `withDraftDefaults(product)`, sets `selectedSlug`, populates `draft`, and looks up revision for optimistic concurrency.
- `apps/xa-uploader/src/lib/catalogBrandRegistry.ts` — `XA_BRAND_REGISTRY` with brand → collections → sizes/colors/materials hierarchy. Lookup functions: `findBrand`, `findCollection`, `findCollectionSizes`, `findCollectionColors`. Sentinel values: `CUSTOM_BRAND_HANDLE`, `CUSTOM_COLLECTION_HANDLE`.
- `apps/xa-uploader/src/components/catalog/catalogDraft.ts` — `buildEmptyDraft()`, `withDraftDefaults()`, `EMPTY_DRAFT` constant.

### Patterns & Conventions Observed

- **Cascade-with-clear pattern**: In Add mode, `BrandCollectionSelectors` clears downstream state (collection, sizes, details) when brand changes, and clears sizes/details when collection changes. Evidence: `CatalogProductBaseFields.client.tsx:220-271`
- **Auto-derive pattern**: `SizeSelector` auto-generates title, slug, description, dimensions, popularity when a size is selected from the registry. Evidence: `CatalogProductBaseFields.client.tsx:125-188`
- **Extracted action functions**: All handler logic is in pure functions in `catalogConsoleActions.ts` receiving setters as parameters. Evidence: `catalogConsoleActions.ts:93-120`
- **Busy lock**: Concurrent async actions prevented by `busyLockRef`. Evidence: `useCatalogConsole.client.ts`
- **Optimistic concurrency**: `revisionsById` maps product IDs to revision hashes for `ifMatch` header on save. Evidence: `catalogConsoleActions.ts:241`

### Data & Contracts

- Types/schemas:
  - `CatalogProductDraftInput` (Zod input type) — `packages/lib/src/xa/catalogAdminSchema.ts:270`. Key filter fields: `brandHandle: string`, `collectionHandle?: string`, `sizes?: string` (pipe-delimited), `taxonomy.color?: string` (pipe-delimited), `taxonomy.material?: string` (pipe-delimited).
  - `CatalogBrandEntry`, `CatalogCollectionEntry`, `CatalogCollectionSize` — `packages/lib/src/xa/catalogAdminSchema.ts`. Brand registry types.
- Persistence:
  - Products stored as CSV files per storefront, served by `/api/catalog/products` route. Loaded into `state.products` array on Edit mode entry.
- API/contracts:
  - `GET /api/catalog/products?storefront=<s>` — returns `{ ok: boolean, products: CatalogProductDraftInput[], revisionsById: Record<string, string> }`
  - No new endpoints needed.

### Dependency & Impact Map

- Upstream dependencies:
  - `XA_BRAND_REGISTRY` — drives the cascade options. Already used by Add mode.
  - `state.products` — the loaded catalog array that filter matches against.
  - `handleSelect(product)` — existing callback to load a matched product into the form.
- Downstream dependents:
  - `CatalogProductForm` — receives the selected product via `state.draft`; unchanged.
  - `CatalogSyncPanel` — unaffected.
- Likely blast radius:
  - `CatalogConsole.client.tsx` — `ReviseScreen` component layout changes
  - New component: `EditProductSelector` (or similar) — the progressive filter UI for Edit mode
  - `CatalogProductsList.client.tsx` — may become unused and can be removed if cascade fully replaces it

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest + React Testing Library
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/xa-uploader/jest.config.cjs`
- CI integration: Tests run in CI only (per `docs/testing-policy.md`)

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| useCatalogConsole | Unit | `__tests__/useCatalogConsole-domains.test.tsx` | Multi-domain feedback state |
| CurrencyRatesPanel | Unit | `__tests__/CurrencyRatesPanel.test.tsx` | Load/save/sync flow |
| Action feedback | Unit | `__tests__/action-feedback.test.tsx` | Feedback state management |
| Catalog API routes | Unit | `api/catalog/products/__tests__/route.test.ts` | Product CRUD API |
| Schema validation | Unit | `lib/__tests__/catalogAdminSchema.test.ts` | Draft schema validation |

#### Coverage Gaps

- No tests for `CatalogProductsList` — pure UI component, no test file exists
- No tests for `BrandCollectionSelectors` or `SizeSelector` — pure UI components
- No tests for cascade filtering logic against a product array (this is the new logic)

#### Testability Assessment

- Easy to test: Filter logic (pure function: given products array + brand/collection/size selections → matched products). This is the core new logic and is trivially unit-testable.
- Hard to test: Full cascade interaction in rendered components (requires React Testing Library with multiple select interactions).

#### Recommended Test Approach

- Unit tests for: Product filter utility function (`filterProducts(products, { brand, collection, size, color }) → CatalogProductDraftInput[]`)
- Unit tests for: Auto-select logic (when exactly one product matches, call `onSelect`)

## Questions

### Resolved

- Q: Should Add mode selectors (`BrandCollectionSelectors`, `SizeSelector`) be directly reused or should we build new filter-only selectors?
  - A: Build new filter-only selectors. The Add mode selectors mutate the draft (set `collectionHandle`, clear `sizes`, derive `title`/`description`/`slug`). Edit mode selectors should only filter the product array and call `handleSelect` when one match remains. The cascade UI pattern (brand select → collection select → size select) can be replicated, but the onChange handlers must filter `state.products` instead of modifying `state.draft`.
  - Evidence: `CatalogProductBaseFields.client.tsx:220-271` — `handleCollectionChange` sets `draft.collectionHandle`, `draft.collectionTitle`, clears `draft.sizes`, modifies `draft.details` and `draft.taxonomy`. This is Add-mode-specific behavior.

- Q: How should custom-brand products (`__custom__` handles) be handled in the filter cascade?
  - A: Add a "Custom / Other" option at each filter level. If selected, fall back to displaying a filtered text list of products with that sentinel handle. Custom-brand products are rare in XA's catalog.
  - Evidence: `catalogBrandRegistry.ts:5-6` — `CUSTOM_BRAND_HANDLE = "__custom__"`, `CUSTOM_COLLECTION_HANDLE = "__custom__"`.

- Q: Should the existing text search (`CatalogProductsList`) be kept as a fallback?
  - A: No. The progressive cascade plus a "Custom / Other" escape hatch covers all selection scenarios. Keeping both would add UI complexity without benefit. If the cascade is insufficient, a text search can be added later.
  - Evidence: Operator confirmed this approach. Products are well-structured with brand/collection/size metadata.

- Q: What happens when multiple products match the filter criteria (e.g., same brand/collection/size but different colors)?
  - A: Display the remaining matches as a compact list for the user to pick from. The cascade should narrow as far as possible (brand → collection → size → color if needed), and auto-select only when exactly one product remains.
  - Evidence: `CatalogProductDraftInput` has `taxonomy.color` as a distinguishing field. Two products with same brand/collection/size but different colors would need the color step to disambiguate.

### Open (Operator Input Required)

No open questions — all routing decisions are answerable from evidence.

## Confidence Inputs

- Implementation: 85% — Clear component architecture; reuses established patterns; new filter logic is straightforward. Would reach 90% with a prototype confirming the cascade UX flow.
- Approach: 90% — Evidence strongly supports filter-over-list approach. Matches Add mode mental model.
- Impact: 85% — Direct UX improvement for the operator. Edit mode becomes consistent with Add mode.
- Delivery-Readiness: 85% — All infrastructure exists (brand registry, product loading, handleSelect). Only new work is the filter component and utility function.
- Testability: 85% — Core filter logic is a pure function, trivially testable. Component interaction testing is possible with RTL.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Custom-brand products become inaccessible if cascade doesn't handle `__custom__` handles | Low | High | Add "Custom / Other" option at each cascade level; fall back to filtered list for custom products |
| Products with identical brand/collection/size/color can't be disambiguated | Very Low | Medium | The title/slug always differs; show remaining matches as a compact list for manual pick |
| Add mode selector component coupling — if selectors are tightly coupled to draft mutation | N/A | N/A | Resolved: build new filter-only selectors instead of reusing Add mode components directly |

## Planning Constraints & Notes

- Must-follow patterns:
  - Follow the extracted-action-function pattern (pure functions receiving setters) for any new state logic
  - Use existing `SELECT_CLASS`, `INPUT_CLASS` from `catalogStyles.ts` for UI consistency
  - Use `useUploaderI18n()` for all user-facing strings
- Rollout/rollback: Single PR; no feature flag needed (internal operator tool)
- Observability: None needed (internal tool, single user)

## Suggested Task Seeds (Non-binding)

1. **IMPLEMENT: Create `filterCatalogProducts` utility** — Pure function: given products array + filter criteria (brand, collection, size, color) → filtered products. Include unit tests.
2. **IMPLEMENT: Create `EditProductFilterSelector` component** — Progressive cascade UI (brand select → collection select → size select → color select if needed). Filters `state.products` at each step. Auto-calls `handleSelect` when exactly one match. Shows compact remaining-matches list when >1 match.
3. **IMPLEMENT: Wire `EditProductFilterSelector` into `ReviseScreen`** — Replace `CatalogProductsList` rendering in `ReviseScreen` with the new component. Remove `CatalogProductsList` if fully replaced. Add i18n keys.

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package: Unit tests for filter utility pass; Edit mode renders cascade selectors; auto-selection works when one product matches; custom-brand products remain accessible
- Post-delivery measurement plan: Manual verification in xa-uploader dev server

## Scope Signal

- Signal: right-sized
- Rationale: Three focused tasks (utility + component + wiring) with clear boundaries. Reuses existing brand registry and state management patterns. No server changes. No schema changes. Scope is bounded to Edit mode product selection only.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Brand registry data access | Yes | None | No |
| Product loading & state | Yes | None | No |
| handleSelect integration | Yes | None | No |
| Custom brand/collection handling | Yes | None — escape hatch designed | No |
| Add mode impact | Yes | None — Add mode unchanged | No |
| i18n coverage | Partial | New filter UI needs i18n keys | No (addressed in task scope) |

## Evidence Gap Review

### Gaps Addressed

- Confirmed `handleSelect` is purely synchronous and receives a `CatalogProductDraftInput` directly — no async loading needed when auto-selecting
- Confirmed `state.products` contains full `CatalogProductDraftInput` objects with `brandHandle`, `collectionHandle`, `sizes`, `taxonomy.color` etc. — all fields needed for filtering
- Confirmed `BrandCollectionSelectors` is tightly coupled to draft mutation — justifies building new filter-only selectors

### Confidence Adjustments

- No adjustments needed. All initial assumptions validated.

### Remaining Assumptions

- Products always have `brandHandle` set (may be empty string for legacy data, but not undefined)
- Catalog size remains small enough for client-side filtering (currently ~50-100 products)

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan xa-uploader-edit-filter-select --auto`
