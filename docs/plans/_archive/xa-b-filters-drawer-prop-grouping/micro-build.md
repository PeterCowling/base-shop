---
Type: Micro-Build
Status: Archived
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: xa-b-filters-drawer-prop-grouping
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260309090000-XAB-FILTERPROPS-001
Related-Plan: none
---

# XaFiltersDrawer Prop Grouping Micro-Build

## Scope
- Change: Replace 15 individual props on XaFiltersDrawer with 3 grouped objects — `config` (filterConfigs, facetValues), `state` (open, draftValues, draftInStock, draftNewIn, draftMin, draftMax), `actions` (onOpenChange, onToggleValue, onChangeInStock, onChangeNewIn, onChangeMin, onChangeMax, onClear, onApply).
- Non-goals: No behaviour changes. No changes to sub-components (RefineSection, PriceSection, DesignerSection, ColorSection, GenericFilterSection — they receive individual props from XaFiltersDrawer.client.tsx internally). No changes to useXaListingFilters.

## Execution Contract
- Affects:
  - apps/xa-b/src/components/filters/XaFiltersDrawer.types.ts
  - apps/xa-b/src/components/XaFiltersDrawer.client.tsx
  - apps/xa-b/src/components/XaProductListing.client.tsx
- Acceptance checks:
  - XaFiltersDrawer accepts `{ config, state, actions }` instead of 15 flat props
  - XaProductListing passes the 3 grouped objects
  - All internal destructuring inside XaFiltersDrawer.client.tsx unchanged (sub-components still receive individual props)
- Validation commands: pnpm --filter xa-b typecheck && pnpm --filter xa-b lint
- Rollback note: Revert 3 files; no runtime state changes.

## Outcome Contract
- **Why:** 15 individual props make the interface brittle; adding a new filter requires updating both caller and callee. Grouped objects make the contract explicit and easier to extend.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** XaFiltersDrawer accepts 3 grouped prop objects instead of 15 individual props; no behaviour changes; typecheck and lint pass.
- **Source:** operator
