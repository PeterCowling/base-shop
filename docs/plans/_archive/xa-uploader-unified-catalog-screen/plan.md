---
Type: Plan
Status: Complete
Domain: UI
Workstream: Engineering
Created: 2026-03-06
Last-reviewed: 2026-03-06
Last-updated: 2026-03-06
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-uploader-unified-catalog-screen
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# XA Uploader Unified Catalog Screen Plan

## Summary

Merge the xa-uploader "New Product" and "Revise Existing" tabs into a single unified catalog screen. The product sidebar (`EditProductFilterSelector`) will always be visible alongside the product editor form in a two-column grid layout. A "New Product" button in the sidebar header replaces the current "New Product" tab. The `ConsoleScreen` type simplifies from `"new" | "revise" | "currency"` to `"catalog" | "currency"`, with `"catalog"` as the default. The currency/sync screen remains unchanged and accessible via its existing header button. The form, actions, hooks, and API layers require zero changes since they already adapt based on `selectedSlug` being null (add) vs set (edit).

## Completed tasks

- [x] TASK-01: Merge CatalogConsole into unified catalog+currency screen layout

## Goals

- Remove the tab-based switching between "new" and "revise" screens
- Always show the product sidebar alongside the editor form
- Preserve all existing functionality: add, edit, save, autosave, delete, conflict handling
- Keep the currency/sync screen accessible via its existing header button

## Non-goals

- Changing the currency/sync screen
- Modifying the product form fields or validation logic
- Changing the save/autosave/delete handlers or API layer

## Constraints & Assumptions

- Constraints:
  - Currency screen stays as-is (out of scope)
  - Must preserve `selectedSlug` null/non-null convention for add/edit mode
- Assumptions:
  - `EditProductFilterSelector` component is already built and functional
  - `loadCatalog()` is safe to call on mount

## Inherited Outcome Contract

- **Why:** Operator wants a single catalog management screen instead of separate add/edit tabs, matching standard catalog-manager UX patterns (list+detail)
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** CatalogConsole renders one unified product-sidebar + editor layout instead of switching between New Product and Revise Existing tabs
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/xa-uploader-unified-catalog-screen/fact-find.md`
- Key findings used:
  - `CatalogProductForm` already adapts based on `selectedSlug` — no form changes needed
  - `EditProductFilterSelector` already accepts `onNew` prop for switching to add mode
  - Currency screen is triggered by header button, independent of `ScreenTabs`
  - No existing tests cover tab switching — no tests to break
  - `loadCatalog()` already called on authenticated mount via `useEffect` in `useCatalogConsole.client.ts:207-215` — no change needed for initial load; `openReviseScreen` merely refreshes

## Proposed Approach

- Chosen approach: Single task — remove `ScreenTabs` component, simplify `ConsoleScreen` type to `"catalog" | "currency"`, make the `ReviseScreen` two-column grid layout the default for `"catalog"`, and add a prominent "New Product" button to the `EditProductFilterSelector` sidebar header. `loadCatalog()` already fires on authenticated mount — no change needed.

  Rationale: All changes are confined to `CatalogConsole.client.tsx` with a minor addition to `EditProductFilterSelector.client.tsx`. The form, actions, and hooks are untouched. This is a single S-effort task — splitting further would create unnecessary coordination overhead.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Merge CatalogConsole into unified catalog+currency screen layout | 85% | S | Complete (2026-03-06) | - | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Single task, no parallelism needed |

## Tasks

### TASK-01: Merge CatalogConsole into unified catalog+currency screen layout

- **Type:** IMPLEMENT
- **Deliverable:** Code changes to `CatalogConsole.client.tsx` and `EditProductFilterSelector.client.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-06)
- **Affects:** `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx`, `apps/xa-uploader/src/components/catalog/EditProductFilterSelector.client.tsx`, `apps/xa-uploader/src/lib/uploaderI18n.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — all code paths are read and understood; changes are deletion + restructuring of existing patterns
  - Approach: 85% — standard list+detail catalog pattern; Held-back test: no single unknown would drop below 80 because the form already adapts via `selectedSlug` and the sidebar already has `onNew`
  - Impact: 85% — removes unnecessary tab navigation; low regression risk since form/actions/hooks unchanged
- **Acceptance:**
  - [ ] `ConsoleScreen` type is `"catalog" | "currency"` (or equivalent two-state)
  - [ ] `ScreenTabs` component is removed
  - [ ] Default screen is `"catalog"` showing two-column grid: sidebar (`EditProductFilterSelector`) + editor (`ProductEditor`)
  - [ ] "New Product" button is visible in sidebar header area, calling `handleNew()` + resetting filters
  - [ ] Currency screen remains accessible via header button and renders unchanged
  - [ ] All existing tests pass (`pnpm --filter @apps/xa-uploader typecheck && pnpm --filter @apps/xa-uploader lint`)
  - **Expected user-observable behavior:**
    - [ ] On login, operator sees the product sidebar and an empty product form side by side (no tabs)
    - [ ] Clicking a product in the sidebar populates the form for editing
    - [ ] Clicking "New Product" in the sidebar clears the form for a new product
    - [ ] Currency/Sync button in header still switches to currency screen and back
- **Validation contract (TC-XX):**
  - TC-01: Authenticated user sees sidebar + editor in single layout -> no "New Product" / "Revise Existing" tabs visible
  - TC-02: Selecting a product in sidebar -> form populates with product data (`selectedSlug` is set)
  - TC-03: Clicking "New Product" button -> form resets to empty draft (`selectedSlug` is null), sidebar filters reset
  - TC-04: Currency header button -> currency screen renders; returning -> catalog screen renders with sidebar
  - TC-05: Existing `action-feedback.test.tsx` and `useCatalogConsole-domains.test.tsx` tests pass unchanged
- **Execution plan:** Red -> Green -> Refactor
  1. **Red:** Remove `ScreenTabs` component. Change `ConsoleScreen` type to `"catalog" | "currency"`. Replace `ConsoleBody` dispatch to render the two-column grid (sidebar + editor) for `"catalog"` and `CurrencyScreen` for `"currency"`. Remove `openNewScreen`/`openReviseScreen` callbacks (`loadCatalog()` already fires on authenticated mount via existing `useEffect` in `useCatalogConsole.client.ts:207-215` — no new effect needed). Add "New Product" button to `EditProductFilterSelector` header (alongside the existing title). Update state initialization from `"new"` to `"catalog"`.
  2. **Green:** Verify typecheck and lint pass. Verify all existing tests pass.
  3. **Refactor:** Remove dead code (`ReviseScreen` component becomes inline; `ScreenTabs` deleted entirely). Clean up unused i18n keys if any (`screenNewProduct`, `screenReviseExisting`).
- **Planning validation (required for M/L):** None: S-effort task
- **Scouts:** None: all code paths verified in fact-find
- **Edge Cases & Hardening:**
  - Empty product list on first load: sidebar shows `editFilterNoProducts` message (existing behavior in `EditProductFilterSelector:155-157`)
  - `loadCatalog()` failure: existing error feedback via `useEffect` catch in `useCatalogConsole.client.ts:209-214` already handles this
- **What would make this >=90%:**
  - Verified working in browser after implementation
- **Rollout / rollback:**
  - Rollout: Direct deploy; internal operator tool
  - Rollback: Revert commit
- **Documentation impact:** None
- **Notes / references:**
  - Related plan `xa-uploader-edit-filter-select` built the sidebar component this task makes always-visible
  - The `onNew` prop on `EditProductFilterSelector` already exists (`handleReset` at line 139-142 calls `onNew()` and resets criteria)
  - Consider whether the existing "Reset" button in the sidebar (line 170-178, shown when `criteria.brand` is set) is sufficient as the "New Product" action, or whether a separate always-visible button is better UX. Recommendation: add a dedicated "New Product" button that is always visible in the sidebar header, distinct from the filter reset button.
- **Build evidence (2026-03-06):**
  - Removed `ScreenTabs` component and `ReviseScreen` component from `CatalogConsole.client.tsx`.
  - `ConsoleScreen` type simplified to `"catalog" | "currency"`. Initial state is `"catalog"`.
  - `openNewScreen`/`openReviseScreen` callbacks removed; `openCatalogScreen` added for currency toggle return.
  - `ConsoleBody` for `"catalog"` now renders the two-column grid (sidebar + editor) unconditionally — was previously only available in `"revise"` screen.
  - `EditProductFilterSelector` now renders a "New Product" button (using `sidebarNewProduct` i18n key) in both the empty-state and the populated filter state sidebar headers.
  - Dead i18n keys removed: `screenNewProduct`, `screenReviseExisting`, `screenNewHint`, `screenReviseHint`. Key `sidebarNewProduct` added in EN/ZH.
  - Header currency button now toggles between catalog and currency screens and labels itself "Sync" in cloud mode.
  - Validation: `pnpm --filter @apps/xa-uploader typecheck` — clean. `pnpm --filter @apps/xa-uploader lint` — clean (0 errors, 0 warnings after adding `min-w-11` to new tap targets).
  - Committed: `feat(xa-uploader): unified catalog screen — remove tabs, always-visible sidebar+editor` (HEAD d5900d1dcf)

## Consumer Tracing

None required: S-effort task with no new outputs consumed by other modules.

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Merge CatalogConsole layout | Yes — all source files read, patterns confirmed | None | No |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `loadCatalog()` called too eagerly (e.g. before auth) | N/A | N/A | Non-issue: existing `useEffect` at `useCatalogConsole.client.ts:208` guards with `if (!session?.authenticated) return` |
| Sidebar renders empty briefly on first load | Low | Low | Acceptable — `editFilterNoProducts` message already handles this |

## Observability

None: internal operator tool

## Acceptance Criteria (overall)

- [ ] No "New Product" / "Revise Existing" tabs in UI
- [ ] Sidebar + editor always visible on catalog screen
- [ ] Currency screen accessible and unchanged
- [ ] All existing tests pass
- [ ] Typecheck and lint clean

## Decision Log

- 2026-03-06: Single-task plan chosen over multi-task split — changes are tightly coupled within `CatalogConsole.client.tsx` and splitting would add coordination overhead without benefit.

## Overall-confidence Calculation

- TASK-01: 85% * S(1) = 85
- Overall = 85 / 1 = **85%**
