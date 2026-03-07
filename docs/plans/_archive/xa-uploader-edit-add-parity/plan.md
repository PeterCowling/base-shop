---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-04
Last-reviewed: 2026-03-04
Last-updated: 2026-03-04
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-uploader-edit-add-parity
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# XA Uploader Edit/Add Data Parity Plan

## Summary
Fix the 3 confirmed data-field bugs in the xa-uploader catalog editor so Edit mode (Revise Existing tab) faithfully round-trips product data. Issue 1: brand/collection selectors show stale values when switching products — fix with `key` prop on form to force remount. Issue 2: size selection silently overwrites title/description in Edit mode — guard auto-derivation with `selectedSlug` check. Issue 6: bag taxonomy fields are read-only in both modes — convert display divs to editable inputs.

## Active tasks
- [x] TASK-01: Fix stale selectors + guard SizeSelector auto-derivation (Issues 1 & 2)
- [x] TASK-02: Convert TaxonomyFields read-only divs to editable inputs (Issue 6)

## Goals
- Brand/collection selectors sync correctly when switching products in Edit mode.
- Size selection in Edit mode updates only size-specific fields, preserving title/description.
- Bag taxonomy fields (strapStyle, closureType, interior, whatFits, dimensions, strapDrop) are editable.

## Non-goals
- Image fields (separate scope).
- Schema changes to `CatalogProductDraftInput`.
- New runtime endpoints.
- Redesigning the Add flow or brand registry.
- Issues 3, 4, 5, 7, 8 — verified as non-bugs or future concerns in fact-find.

## Constraints & Assumptions
- Constraints:
  - Data fields only — images out of scope.
  - No schema changes.
  - Cloudflare free tier (no new endpoints).
- Assumptions:
  - `selectedSlug === null` reliably indicates New Product mode (verified: `handleNewImpl()` sets `selectedSlug` to null, `handleSelectImpl()` sets it to the product slug).
  - The `key` prop remount pattern is safe — switching products should always reload fresh state.
  - TaxonomyFields read-only divs can safely become editable without validation changes (values are freeform text).

## Inherited Outcome Contract

- **Why:** The catalog editor's Edit mode doesn't faithfully round-trip product data — fields get overwritten, reset, or stuck after save/reload, making the editor unreliable for revising existing products.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Fix the 3 confirmed data-field bugs so Edit mode is a faithful editor of what Add/Save-as-Draft produces: brand/collection selectors sync on product switch, auto-derivation respects existing edits in Edit mode, and bag taxonomy fields are editable rather than read-only.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/xa-uploader-edit-add-parity/fact-find.md`
- Key findings used:
  - Only 3 of 8 reported issues are confirmed bugs (Issues 1, 2, 6).
  - Issue 1 root cause: `BrandCollectionSelectors` uses `useState` initializer that only runs on mount.
  - Issue 2 root cause: `SizeSelector.handleChange()` unconditionally overwrites title/slug/description/popularity.
  - Issue 6 root cause: `TaxonomyFields` renders bag-specific fields as `<div className="opacity-60">` instead of editable inputs.
  - Fix patterns: `key` prop for remount (React standard), conditional guard on `selectedSlug`, subcategory input pattern (already editable at line 579-595).

## Proposed Approach
- Option A: Add `key` prop to `CatalogProductForm` + thread `selectedSlug` to `SizeSelector` + convert TaxonomyFields divs to inputs.
- Option B: Use `useEffect` to sync brand/collection state when draft changes (more complex, more error-prone).
- Chosen approach: Option A — simplest, most predictable, follows established React patterns. The `key` prop cleanly solves Issue 1, and the `selectedSlug` guard is a minimal change for Issue 2.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Fix stale selectors + guard SizeSelector auto-derivation | 85% | S | Complete (2026-03-04) | - | - |
| TASK-02 | IMPLEMENT | Convert TaxonomyFields read-only divs to editable inputs | 85% | S | Complete (2026-03-04) | - | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | - | Independent: TASK-01 touches ProductEditor + SizeSelector; TASK-02 touches TaxonomyFields. Both in same file but different functions — no merge conflict. |

## Tasks

### TASK-01: Fix stale selectors + guard SizeSelector auto-derivation (Issues 1 & 2)
- **Type:** IMPLEMENT
- **Deliverable:** code-change in `CatalogConsole.client.tsx`, `CatalogProductForm.client.tsx`, `CatalogProductBaseFields.client.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-04)
- **Affects:** `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx`, `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx`, `apps/xa-uploader/src/components/catalog/CatalogProductBaseFields.client.tsx`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% - All changes are small, well-scoped: (1) add `key` prop to `CatalogProductForm` in `ProductEditor`, (2) add `selectedSlug` to `BaseFieldsProps`, (3) thread through to `SizeSelector`, (4) guard auto-derivation with `if (selectedSlug !== null)`.
  - Approach: 90% - `key` prop for React remount is a standard pattern. Guarding with `selectedSlug` is clean and minimal. Held-back test: no single unknown would drop this below 80 because both patterns are well-established React idioms with no side effects beyond the intended remount/guard.
  - Impact: 85% - Directly fixes the two highest-severity Edit mode bugs (stale selectors, overwritten title/description).
- **Acceptance:**
  - [ ] Switching products in Revise mode shows correct brand/collection in dropdowns.
  - [ ] Selecting a size in Edit mode updates dimensions/whatFits/strapDrop/popularity but preserves title/slug/description.
  - [ ] Selecting a size in Add mode (New Product) still auto-derives title/slug/description/popularity.
  - [ ] Form state resets cleanly when switching from Edit to New Product tab.
  - **Expected user-observable behavior:**
    - In Revise mode, click product A → dropdowns show A's brand/collection. Click product B → dropdowns immediately show B's brand/collection (no stale values from A).
    - In Revise mode, select a different size → title, slug, and description remain unchanged. Dimensions, strapDrop, whatFits, and popularity update.
    - In New Product mode, select a size → title, slug, description, popularity auto-derive as before.
- **Validation contract (TC-01):**
  - TC-01: Switch product in Revise mode → brand/collection dropdowns reflect selected product's values.
  - TC-02: Edit mode + change size (with registry match) → title, slug, and description unchanged; dimensions, strapDrop, whatFits, and popularity updated.
  - TC-03: New Product mode + select size (with registry match) → title, slug, description, and popularity all auto-derived.
  - TC-04: Switch from Revise to New Product tab → form resets to empty draft.
- **Execution plan:** Red → Green → Refactor
  - Red: Verify stale selectors reproduce (switch products, observe wrong dropdown value). Verify title overwrite reproduces (edit mode, change size, observe title clobber).
  - Green: (1) Add `key={selectedSlug ?? "new"}` to `<CatalogProductForm>` in `ProductEditor` (CatalogConsole.client.tsx:132). (2) Add `selectedSlug?: string | null` to `BaseFieldsProps` type. (3) Pass `selectedSlug` from `CatalogProductForm` to `CatalogProductBaseFields` (line 179). (4) Thread `selectedSlug` from `IdentityFields` to `SizeSelector`. (5) In `SizeSelector.handleChange()` (lines 125-145): when `selectedSlug != null` (Edit mode), skip only the title/slug/description overwrite but still update sizes, details (dimensions/whatFits/strapDrop), and popularity (derived from size/color). When `selectedSlug == null` (New Product), keep all auto-derivation including title/slug/description.
  - Refactor: Verify typecheck passes. Review for any missed consumers of `selectedSlug`.
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** None: all fix locations and patterns verified in fact-find.
- **Edge Cases & Hardening:**
  - Edge case: Product loaded with null/undefined brandHandle → `key` prop remount handles this correctly since it keys on selectedSlug, not brandHandle.
  - Edge case: Custom brand (CUSTOM_BRAND_HANDLE) in Edit mode → key prop still works; brand selector re-initializes from draft.brandHandle on remount.
  - Edge case: SizeSelector with no registry match (else branch at line 146-153) → this branch doesn't auto-derive title/description, so no guard needed there.
- **What would make this >=90%:**
  - Existing test coverage for SizeSelector behavior.
- **Rollout / rollback:**
  - Rollout: No deployment — xa-uploader runs locally.
  - Rollback: Revert commit.
- **Documentation impact:** None.
- **Notes / references:**
  - `CatalogProductForm` already receives `selectedSlug` prop (line 92) but doesn't pass it to `CatalogProductBaseFields`.
  - The `key` prop fix also solves potential stale state in `SizeSelector` (local `useState` at line 106) and `MaterialColorSelectors` when switching products.

### TASK-02: Convert TaxonomyFields read-only divs to editable inputs (Issue 6)
- **Type:** IMPLEMENT
- **Deliverable:** code-change in `CatalogProductBaseFields.client.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-04)
- **Affects:** `apps/xa-uploader/src/components/catalog/CatalogProductBaseFields.client.tsx`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% - Clear pattern exists at lines 579-595 (subcategory field): `<input>` with `value`, `onChange`, `disabled` when collection defaults exist. Apply same pattern to 6 fields: strapStyle, closureType, dimensions, strapDrop, interior, whatFits.
  - Approach: 90% - Follows existing subcategory pattern exactly. Each field becomes an editable input that defaults to collection value but allows override. Held-back test: no single unknown would drop this below 80 because the pattern is proven in the same component.
  - Impact: 85% - Removes the editability gap that prevents operators from correcting bag taxonomy values.
- **Acceptance:**
  - [ ] strapStyle, closureType, dimensions, strapDrop, interior, whatFits render as editable inputs.
  - [ ] Fields pre-populate from collection defaults when a collection is selected.
  - [ ] Editing a field updates the draft state correctly.
  - [ ] Fields render even when empty (no conditional-render regression).
  - [ ] Department and category remain read-only (system-level fields).
  - **Expected user-observable behavior:**
    - Previously read-only bag fields now show as text inputs.
    - Typing in a field updates the draft — visible when saving.
    - Collection defaults pre-fill the value but the field is always editable.
- **Validation contract (TC-02):**
  - TC-01: Bag product loaded → strapStyle, closureType, dimensions, strapDrop, interior, whatFits render as `<input>` elements.
  - TC-02: Edit strapStyle value → draft.taxonomy.strapStyle updates.
  - TC-03: Edit interior value → draft.details.interior updates.
  - TC-04: Collection with defaults selected → fields pre-populate but remain editable.
  - TC-05: Bag product with no strapStyle value → field renders empty input (not hidden).
- **Execution plan:** Red → Green → Refactor
  - Red: Verify bag fields render as non-editable divs.
  - Green: For each of the 6 read-only fields in `TaxonomyFields` (lines 597-637), convert from `<div className="opacity-60">{value}</div>` to `<input value={value ?? ""} onChange={(e) => onChange({...draft, taxonomy/details: updated})} className={INPUT_CLASS} />`. All 6 fields are always editable (no `disabled`). Collection defaults serve as initial values only. Key changes per field:
    - `dimensions` (line 597-602): `draft.details.dimensions` → editable input, onChange updates `draft.details.dimensions`. Always editable (no `disabled`).
    - `strapStyle` (line 604-609): `draft.taxonomy.strapStyle` → editable input, onChange updates `draft.taxonomy.strapStyle`. Always editable.
    - `strapDrop` (line 611-616): `draft.details.strapDrop` → editable input, onChange updates `draft.details.strapDrop`. Always editable.
    - `closureType` (line 618-623): `draft.taxonomy.closureType` → editable input, onChange updates `draft.taxonomy.closureType`. Always editable.
    - `interior` (line 625-630): `draft.details.interior` → editable input, onChange updates `draft.details.interior`. Always editable.
    - `whatFits` (line 632-637): `draft.details.whatFits` → editable input, onChange updates `draft.details.whatFits`. Always editable.
    - Department and category remain read-only divs (system-level classification, not operator-editable).
  - Refactor: Remove conditional rendering (`{value ? ... : null}`) — show the input even when empty so operators can add values. For the `disabled` prop: use `disabled={false}` (always editable) — the collection default is the initial value but operators can always override. Only department and category remain truly read-only (these are system-level classifications). Verify typecheck passes.
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** None: subcategory pattern already proven in same component.
- **Edge Cases & Hardening:**
  - Edge case: Field value is empty string → render empty input (editable). Previously would render nothing due to truthiness check.
  - Edge case: `draft.details` is undefined → use `draft.details?.field ?? ""` with fallback.
  - Edge case: Department/category remain read-only divs — only the 6 bag-specific fields become editable.
- **What would make this >=90%:**
  - Existing test coverage for TaxonomyFields rendering.
- **Rollout / rollback:**
  - Rollout: No deployment — xa-uploader runs locally.
  - Rollback: Revert commit.
- **Documentation impact:** None.
- **Notes / references:**
  - The subcategory field at lines 579-595 is the exact pattern to follow.
  - Current rendering uses conditional `{value ? <div>...</div> : null}` which hides empty fields. New rendering should always show the input.
  - `collDefaults` comes from `findCollectionDefaults()` at line 559.

## Consumer Tracing

### TASK-01 new outputs
- `BaseFieldsProps.selectedSlug` (new field): consumed by `CatalogProductBaseFields`, `IdentityFields`, `SizeSelector`. All within same file. `CatalogProductForm` is the sole caller of `CatalogProductBaseFields` (verified: only import is at `CatalogProductForm.client.tsx:9`).

### TASK-01 modified behaviors
- `SizeSelector.handleChange()`: callers are the `<select onChange>` at line 166 — internal to component. No external consumers.
- `ProductEditor` gains `key` prop: `ProductEditor` is rendered in `ConsoleBody` (line 169) and `CatalogConsole` (line 224) — both in `CatalogConsole.client.tsx`. The key prop flows through to `CatalogProductForm` and causes remount when `selectedSlug` changes. No other consumers.

### TASK-02 modified behaviors
- `TaxonomyFields` rendering: called only from `CatalogProductBaseFields` at line 719. No external consumers.
- Draft state updates from new onChange handlers: consumed by the parent `onChangeDraft` callback chain → `useCatalogConsole.setDraft`. Same path as all other form fields. No new consumers needed.

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Fix stale selectors + guard SizeSelector | Yes | None — `selectedSlug` is available in `CatalogProductForm` (line 92), `BaseFieldsProps` is the shared type for all field components, `SizeSelector` receives props via spread | No |
| TASK-02: Convert TaxonomyFields to editable inputs | Yes | None — subcategory pattern proven at lines 579-595, `onChange` callback available in `BaseFieldsProps`, `collDefaults` already computed at line 559 | No |

## Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `key` prop remount discards unsaved changes when switching products | Low | Medium | Intended behavior — switching products should reset form state. Console doesn't track unsaved changes for a "dirty" warning (matches current behavior). |
| Auto-derivation guard makes new-product size selection not auto-derive | Low | High | Guard uses `selectedSlug == null` which is only true for New Product (handleNewImpl sets null). Verified in catalogConsoleActions.ts:42. |
| Removing conditional rendering on TaxonomyFields shows empty inputs for non-bag products | Low | Low | TaxonomyFields only renders when `sections.has("taxonomy") && props.draft.collectionHandle` (line 714). Bag fields are always relevant when taxonomy section shows. |

## Observability
None: internal operations tool, no logging/metrics/alerts needed.

## Acceptance Criteria (overall)
- [ ] Typecheck passes (`pnpm typecheck`).
- [ ] Lint passes (`pnpm lint`).
- [ ] CI tests pass (existing test suite — regression guard).
- [ ] Switching products in Revise mode shows correct brand/collection/size values.
- [ ] Editing title in Edit mode → changing size doesn't overwrite it.
- [ ] Bag taxonomy fields are editable in both Add and Edit modes.

## Test Coverage Note
No existing tests cover the affected components (BrandCollectionSelectors, SizeSelector, TaxonomyFields). All fixes are UI state/rendering changes verifiable by manual inspection and typecheck. Adding new tests for these components would require full React rendering setup and is deferred to a future test-hardening scope. The `key` prop remount and `selectedSlug` guard are deterministic patterns unlikely to regress without intentional changes.

## Decision Log
- 2026-03-04: Chose `key` prop over `useEffect` sync for Issue 1 — simpler, more predictable, avoids stale-state bugs.
- 2026-03-04: Combined Issues 1 & 2 into single task — same component tree, `selectedSlug` threading serves both fixes.
- 2026-03-04: Chose to always show taxonomy inputs (even empty) rather than conditional render — enables operators to add values to fields not pre-filled by collection.

## Build Evidence

### TASK-01 (Complete 2026-03-04)
- Added `key={state.selectedSlug ?? "new"}` to `CatalogProductForm` in `ProductEditor` (CatalogConsole.client.tsx:133).
- Added `selectedSlug?: string | null` to `BaseFieldsProps` type (CatalogProductBaseFields.client.tsx:27).
- Threaded `selectedSlug` through `CatalogProductForm` → `CatalogProductBaseFields` → `IdentityFields` → `BrandCollectionSelectors` → `SizeSelector`.
- Guarded title/slug/description auto-derivation in `SizeSelector.handleChange()` with `if (selectedSlug == null)` — Edit mode preserves existing title/description, New Product mode auto-derives as before. Popularity and size-specific details (dimensions, whatFits, strapDrop) still update in both modes.
- Typecheck: xa-uploader passes (0 errors). Lint: 0 errors.

### TASK-02 (Complete 2026-03-04)
- Converted 6 read-only `<div className="opacity-60">` elements to editable `<input>` elements in `TaxonomyFields` (CatalogProductBaseFields.client.tsx:597-661).
- Fields converted: dimensions, strapStyle, strapDrop, closureType, interior, whatFits.
- Each input follows the same pattern: `<label>` wrapper, `<input value={...} onChange={...} className={INPUT_CLASS} />`.
- Removed conditional rendering (`{value ? ... : null}`) — fields always render, even when empty.
- Department and category remain read-only divs (system-level fields).
- Typecheck: xa-uploader passes (0 errors). Lint: 0 errors.

## Overall-confidence Calculation
- TASK-01: S (weight 1) × 85 = 85
- TASK-02: S (weight 1) × 85 = 85
- Overall = (85 + 85) / 2 = 85%
- Rounded to nearest 5: 85%
