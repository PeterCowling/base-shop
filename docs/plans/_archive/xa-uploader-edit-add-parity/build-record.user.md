---
Status: Complete
Feature-Slug: xa-uploader-edit-add-parity
Completed-date: 2026-03-04
artifact: build-record
Build-Event-Ref: docs/plans/xa-uploader-edit-add-parity/build-event.json
---

# Build Record: XA Uploader Edit/Add Data Parity

## What Was Built

Fixed three confirmed data-field bugs in the xa-uploader catalog editor so that Edit mode (Revise Existing tab) faithfully round-trips product data.

**TASK-01 — Stale selectors + SizeSelector guard (Issues 1 & 2):** Added a React `key` prop (`key={selectedSlug ?? "new"}`) to `CatalogProductForm` inside `ProductEditor`, forcing the entire form tree to remount when switching products. This eliminates stale `useState` initializers in `BrandCollectionSelectors`. Threaded `selectedSlug` through the component tree to `SizeSelector`, where a guard (`if (selectedSlug == null)`) ensures auto-derivation of title/slug/description only runs for new products. In Edit mode, size changes still update dimensions, strapDrop, whatFits, and popularity — only the manually-editable title/slug/description are preserved.

**TASK-02 — TaxonomyFields editability (Issue 6):** Converted 6 read-only `<div className="opacity-60">` elements to editable `<input>` elements in `TaxonomyFields`: dimensions, strapStyle, strapDrop, closureType, interior, whatFits. Each field follows the existing subcategory input pattern with proper `onChange` handlers. Fields now render even when empty (removed conditional rendering), enabling operators to add values. Department and category remain read-only as system-level fields.

## Tests Run

- `pnpm typecheck` — xa-uploader passes (0 errors). Pre-existing errors in cover-me-pretty (editorial/dist not built) are unrelated.
- `pnpm lint` — 0 errors in scope.
- CI tests deferred to push (per testing-policy.md — tests run in CI only).

## Validation Evidence

### TASK-01 TC contracts
- TC-01: `key` prop on `CatalogProductForm` forces remount on product switch → brand/collection dropdowns re-initialize from draft.
- TC-02: `SizeSelector.handleChange()` guarded — Edit mode preserves title/slug/description; updates dimensions/strapDrop/whatFits/popularity.
- TC-03: New Product mode (`selectedSlug == null`) auto-derives all fields as before.
- TC-04: Switching from Revise to New Product tab triggers `handleNew()` → `selectedSlug` set to null → form remounts with empty draft.

### TASK-02 TC contracts
- TC-01: All 6 fields render as `<input>` elements (verified by code inspection).
- TC-02: strapStyle `onChange` updates `draft.taxonomy.strapStyle`.
- TC-03: interior `onChange` updates `draft.details.interior`.
- TC-04: Collection defaults pre-populate value; fields remain editable (no `disabled` prop).
- TC-05: Empty fields render as empty inputs (conditional rendering removed).

## Scope Deviations

None. All changes stayed within the 3 files listed in the plan `Affects` declarations.

## Outcome Contract

- **Why:** The catalog editor's Edit mode doesn't faithfully round-trip product data — fields get overwritten, reset, or stuck after save/reload, making the editor unreliable for revising existing products.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Fix the 3 confirmed data-field bugs so Edit mode is a faithful editor of what Add/Save-as-Draft produces: brand/collection selectors sync on product switch, auto-derivation respects existing edits in Edit mode, and bag taxonomy fields are editable rather than read-only.
- **Source:** operator
