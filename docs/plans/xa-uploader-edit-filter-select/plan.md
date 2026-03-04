---
Type: Plan
Status: Active
Domain: UI
Workstream: Engineering
Created: 2026-03-04
Last-reviewed: 2026-03-04
Last-updated: 2026-03-04
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-uploader-edit-filter-select
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Edit Mode Progressive Filter Selection Plan

## Summary

Replace the flat product list in xa-uploader Edit mode with a progressive filter-down cascade (brand → collection → size → color) that matches the Add mode mental model. When filters narrow to exactly one product, auto-select it and populate the edit form. The core filter logic is a pure utility function, and the cascade UI is a new component wired into ReviseScreen. No server or schema changes required.

## Active tasks

- [ ] TASK-01: Create filterCatalogProducts utility + unit tests
- [ ] TASK-02: Create EditProductFilterSelector component + wire into ReviseScreen

## Goals

- Edit mode product selection uses progressive brand/collection/size/color cascade
- Auto-select and populate form when exactly one product matches
- Custom-brand products remain accessible via escape hatch
- Consistent UX between Add mode and Edit mode selection patterns

## Non-goals

- Changing Add mode workflow
- Modifying server API endpoints
- Schema or data model changes
- Adding brand registry entries

## Constraints & Assumptions

- Constraints:
  - No schema changes — reuse existing `CatalogProductDraftInput` and brand registry
  - Cloudflare free tier — no new runtime endpoints
  - Reuse brand registry lookup functions from `catalogBrandRegistry.ts`
- Assumptions:
  - All saved products have `brandHandle` set (may be empty string, not undefined)
  - Catalog size < 200 products — client-side filtering is performant
  - Custom-brand products (`__custom__` handles) are rare but must be accessible

## Inherited Outcome Contract

- **Why:** Edit mode product selection requires browsing a flat list — should use the same progressive brand/collection/size cascade as Add mode, auto-selecting when filter narrows to one product.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Replace CatalogProductsList in Edit mode with progressive filter-down selectors that match Add mode UX; auto-populate form when single product matches the filter criteria.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/xa-uploader-edit-filter-select/fact-find.md`
- Key findings used:
  - `BrandCollectionSelectors` is tightly coupled to draft mutation — build new filter-only selectors
  - `handleSelect(product)` is synchronous, receives `CatalogProductDraftInput` directly
  - `state.products` contains full draft objects with all filterable fields
  - Brand registry provides cascade hierarchy via `findBrand`, `findCollection`, `findCollectionSizes`, `findCollectionColors`
  - `CatalogProductsList` is only imported by `CatalogConsole` — safe to remove

## Proposed Approach

- Option A: Reuse `BrandCollectionSelectors` directly and add filtering logic alongside draft mutation — rejected because the component tightly couples cascade changes to draft state
- Option B: Build new filter-only selectors that operate on `state.products` and call `handleSelect` on match — chosen approach
- Chosen approach: Option B — new filter-only component that uses the same brand registry data but filters products instead of building drafts. Clean separation between selection (filter cascade) and editing (existing form).

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | filterCatalogProducts utility + tests | 85% | S | Pending | - | TASK-02 |
| TASK-02 | IMPLEMENT | EditProductFilterSelector + ReviseScreen wiring | 85% | M | Pending | TASK-01 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Pure utility, no UI |
| 2 | TASK-02 | TASK-01 | Uses utility from TASK-01 |

## Tasks

### TASK-01: Create filterCatalogProducts utility + unit tests

- **Type:** IMPLEMENT
- **Deliverable:** New utility function + unit test file
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/xa-uploader/src/components/catalog/catalogEditFilter.ts` (new), `apps/xa-uploader/src/components/catalog/__tests__/catalogEditFilter.test.ts` (new), `[readonly] packages/lib/src/xa/catalogAdminSchema.ts`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 85%
  - Implementation: 90% - Pure function with clear input/output contract; all data types already defined
  - Approach: 90% - Standard array filter pattern; straightforward field matching
  - Impact: 85% - Enables TASK-02; correctness is critical for auto-select behavior
- **Acceptance:**
  - [ ] `filterCatalogProducts(products, criteria)` returns products matching all non-empty criteria
  - [ ] Criteria fields: `brand`, `collection`, `size`, `color` — each optional, all must match when present
  - [ ] Size matching: filter `product.sizes` (pipe-delimited string) for substring presence
  - [ ] Color matching: filter `product.taxonomy.color` (pipe-delimited string) for substring presence
  - [ ] Empty/undefined criteria field means "any" (no filtering on that dimension)
  - [ ] `extractFilterOptions(products)` returns unique brand/collection/size/color values present in the product array
  - [ ] `extractFilterOptions` scopes downstream options to current filter (e.g., collections for selected brand only)
- **Validation contract (TC-XX):**
  - TC-01: No criteria → returns all products
  - TC-02: Brand filter only → returns products matching `brandHandle`
  - TC-03: Brand + collection → returns products matching both `brandHandle` and `collectionHandle`
  - TC-04: Brand + collection + size → returns products where `sizes` contains the selected size
  - TC-05: Full cascade (brand + collection + size + color) → returns exact match(es)
  - TC-06: No matches → returns empty array
  - TC-07: Custom brand (`__custom__`) → correctly matches products with custom brand handle
  - TC-08: `extractFilterOptions` with brand selected → only returns collections from products with that brand
  - TC-09: `extractFilterOptions` with no products → returns empty option sets
- **Execution plan:**
  - Red: Write test file with TC-01 through TC-09 using mock product data
  - Green: Implement `filterCatalogProducts` and `extractFilterOptions` to pass all tests
  - Refactor: Extract shared constants, ensure clean types
- **Planning validation (required for M/L):** None: S-effort task
- **Scouts:** None: Pure function with well-defined input types from existing schema
- **Edge Cases & Hardening:**
  - Products with empty `brandHandle` or missing `collectionHandle` — treated as non-matching for those criteria
  - Products with empty `sizes` or empty `taxonomy.color` — treated as non-matching when those criteria are set
  - Case-insensitive matching for brand/collection handles (already slugified/lowercase in the data)
- **What would make this >=90%:**
  - Running the tests and confirming all pass
- **Rollout / rollback:**
  - Rollout: Utility is internal, consumed only by TASK-02
  - Rollback: Delete the two new files
- **Documentation impact:** None
- **Notes / references:**
  - `CatalogProductDraftInput` type: `packages/lib/src/xa/catalogAdminSchema.ts`
  - Key fields for filtering: `brandHandle`, `collectionHandle`, `sizes` (pipe-delimited), `taxonomy.color` (pipe-delimited)

---

### TASK-02: Create EditProductFilterSelector component + wire into ReviseScreen

- **Type:** IMPLEMENT
- **Deliverable:** New React component + CatalogConsole wiring + i18n keys
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/xa-uploader/src/components/catalog/EditProductFilterSelector.client.tsx` (new), `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx`, `apps/xa-uploader/src/lib/uploaderI18n.ts`, `[readonly] apps/xa-uploader/src/components/catalog/catalogEditFilter.ts`, `[readonly] apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts`, `[readonly] apps/xa-uploader/src/lib/catalogBrandRegistry.ts`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% - New component but follows established patterns (select cascade, i18n, styles); all hooks and state exist. Held-back test: no single unresolved unknown would drop below 80 — brand registry lookups, state.products shape, and handleSelect interface are all verified.
  - Approach: 85% - Progressive cascade proven in Add mode; filter-only variant is simpler (no draft mutation). Held-back test: approach is validated by Add mode precedent; no unknown would drop below 80.
  - Impact: 85% - Direct UX improvement visible to operator immediately
- **Acceptance:**
  - [ ] `EditProductFilterSelector` renders brand select → collection select → size select → color select cascade
  - [ ] Each select shows only options present in the currently-filtered product set (via `extractFilterOptions`)
  - [ ] Selecting a cascade level filters products and updates downstream selects
  - [ ] When exactly one product matches, auto-calls `onSelect(product)` to populate the form
  - [ ] When >1 products match at final cascade level, shows compact clickable list of remaining products
  - [ ] "Custom / Other" option at brand level shows filtered list of custom-brand products
  - [ ] All user-facing strings use `useUploaderI18n()` with new i18n keys
  - [ ] `ReviseScreen` uses `EditProductFilterSelector` instead of `CatalogProductsList`
  - [ ] `CatalogProductsList` import removed from `CatalogConsole` (file retained if used elsewhere; deleted if orphaned)
  - **Expected user-observable behavior:**
    - [ ] On the Revise tab, user sees brand dropdown instead of flat product list
    - [ ] Selecting a brand shows collection dropdown with only that brand's collections
    - [ ] Selecting a collection shows size dropdown with only that collection's sizes
    - [ ] If only one product matches after a selection step, the form auto-populates with that product
    - [ ] If multiple products remain, user sees a compact list to pick from
    - [ ] Custom-brand products are accessible via "Other" option
- **Validation contract (TC-XX):**
  - TC-01: Render with products array → brand select visible with unique brands from products
  - TC-02: Select brand → collection select appears with only that brand's collections from products
  - TC-03: Select brand + collection → size select appears if multiple sizes present
  - TC-04: Select brand + collection where only one product exists → auto-select fires, form populates
  - TC-05: Select brand + collection + size where multiple products remain → compact list shown
  - TC-06: Click product in compact list → onSelect called with that product
  - TC-07: Change brand → collection/size/color selections reset
  - TC-08: "Other" brand option → shows custom-brand products as compact list
  - TC-09: Empty products array → appropriate empty state message
- **Execution plan:**
  - Red: Verify no existing `EditProductFilterSelector` component; confirm `CatalogProductsList` is only used in `CatalogConsole`
  - Green: Build `EditProductFilterSelector` with cascade selects using `filterCatalogProducts` + `extractFilterOptions`; wire into `ReviseScreen`; add i18n keys; remove `CatalogProductsList` import
  - Refactor: Clean up unused imports; verify component follows `catalogStyles.ts` token usage
- **Planning validation (required for M/L):**
  - Checks run: Verified `CatalogProductsList` imported only by `CatalogConsole.client.tsx`. Verified `handleSelect` signature accepts `CatalogProductDraftInput`. Verified `state.products` is `CatalogProductDraftInput[]`.
  - Validation artifacts: Grep for `CatalogProductsList` shows 2 source files (its definition and CatalogConsole import)
  - Unexpected findings: None
- **Consumer tracing:**
  - New output: `EditProductFilterSelector` component → consumed by `ReviseScreen` in `CatalogConsole.client.tsx`
  - New output: i18n keys (e.g., `editFilterBrand`, `editFilterCollection`, `editFilterSize`, `editFilterColor`, `editFilterNoProducts`, `editFilterSelectProduct`) → consumed by `EditProductFilterSelector` via `useUploaderI18n()`
  - Modified behavior: `ReviseScreen` renders `EditProductFilterSelector` instead of `CatalogProductsList` → `ReviseScreen` is only rendered by `ConsoleBody` in `CatalogConsole` → no external consumers affected
  - Consumer `CatalogProductsList` is removed from `CatalogConsole` import; file itself retained only if other importers exist (grep shows none → safe to delete)
- **Scouts:** None: All component patterns verified in Add mode precedent
- **Edge Cases & Hardening:**
  - Products with `__custom__` brand handle → shown under "Other" option
  - Products array loaded asynchronously (empty initially) → handle empty state gracefully
  - User changes brand after auto-select → clear form and reset downstream selects
  - Brand with only one collection → auto-advance to size level (skip collection select if single option)
- **What would make this >=90%:**
  - Prototype running in dev server confirming cascade UX flow
  - Integration test confirming auto-select behavior with real product data
- **Post-build QA loop:**
  - Run `lp-design-qa` on `EditProductFilterSelector` component
  - Run `tools-ui-contrast-sweep` on xa-uploader revise tab
  - Run `tools-ui-breakpoint-sweep` on xa-uploader revise tab
  - Auto-fix and re-run until no Critical/Major issues remain
- **Rollout / rollback:**
  - Rollout: Single PR; internal operator tool
  - Rollback: Revert PR; `CatalogProductsList` restored in `ReviseScreen`
- **Documentation impact:** None
- **Notes / references:**
  - Add mode cascade: `CatalogProductBaseFields.client.tsx:196-388`
  - Style tokens: `catalogStyles.ts` (`SELECT_CLASS`, `INPUT_CLASS`, `PANEL_CLASS`)
  - State management: `useCatalogConsole.client.ts` — `products`, `handleSelect`, `query`, `setQuery`

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Custom-brand products become inaccessible | Low | High | "Other" escape hatch at brand level showing custom-brand products as a list |
| Auto-select triggers on wrong product due to imprecise filtering | Low | Medium | Auto-select only when exactly one match; show list otherwise |
| Products with identical filter values can't be distinguished | Very Low | Low | Compact list shows title/slug for manual disambiguation |

## Observability

None: Internal operator tool with single user. No logging, metrics, or dashboards needed.

## Acceptance Criteria (overall)

- [ ] Edit mode Revise tab shows progressive brand → collection → size → color cascade instead of flat list
- [ ] Auto-selection populates form when one product matches
- [ ] Custom-brand products accessible via "Other" option
- [ ] All unit tests pass
- [ ] No TypeScript errors
- [ ] No lint errors

## Decision Log

- 2026-03-04: Build new filter-only selectors instead of reusing Add mode BrandCollectionSelectors (too coupled to draft mutation)
- 2026-03-04: No text search fallback needed — cascade + "Other" covers all selection scenarios
- 2026-03-04: Auto-select threshold is exactly 1 match (not "few matches")

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: filterCatalogProducts utility | Yes | None — `CatalogProductDraftInput` type is stable and importable | No |
| TASK-02: EditProductFilterSelector + wiring | Yes | None — TASK-01 utility available; `handleSelect`, `products`, `query` state props all verified; i18n system available via `useUploaderI18n` | No |

## Overall-confidence Calculation

- TASK-01: confidence 85%, effort S (weight 1)
- TASK-02: confidence 85%, effort M (weight 2)
- Overall = (85×1 + 85×2) / (1+2) = 85%
