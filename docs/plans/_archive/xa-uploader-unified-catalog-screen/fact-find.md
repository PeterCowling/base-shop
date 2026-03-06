---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-06
Last-updated: 2026-03-06
Feature-Slug: xa-uploader-unified-catalog-screen
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/xa-uploader-unified-catalog-screen/plan.md
Trigger-Why: Operator wants a single catalog management screen instead of separate add/edit tabs, matching standard catalog-manager UX patterns
Trigger-Intended-Outcome: "type: operational | statement: CatalogConsole renders one unified product-sidebar + editor layout instead of switching between New Product and Revise Existing tabs | source: operator"
---

# XA Uploader Unified Catalog Screen Fact-Find Brief

## Scope

### Summary
Merge the xa-uploader "New Product" and "Revise Existing" tabs into a single unified screen. The product sidebar (EditProductFilterSelector) should always be visible alongside the product editor form. A "New Product" button in the sidebar replaces the current "New Product" tab. The "Currency/Sync" screen remains unchanged as a separate mode.

### Goals
- Remove the tab-based switching between "new" and "revise" screens
- Always show the product sidebar alongside the editor form
- Add a "New Product" button to the sidebar
- Preserve all existing functionality: add, edit, save, autosave, delete, conflict handling
- Keep the currency/sync screen accessible via its existing header button

### Non-goals
- Changing the currency/sync screen
- Modifying the product form fields or validation logic
- Changing the save/autosave/delete handlers
- Changing the API layer

### Constraints & Assumptions
- Constraints:
  - Must run on Cloudflare free tier (existing constraint)
  - Must remain browser-based web app
  - Currency screen stays as-is (out of scope)
- Assumptions:
  - The `EditProductFilterSelector` component (from `xa-uploader-edit-filter-select` plan) is the sidebar to always show
  - The form (`CatalogProductForm`) already adapts correctly based on `selectedSlug` being null vs set

## Outcome Contract

- **Why:** Operator wants a single catalog management screen instead of separate add/edit tabs, matching standard catalog-manager UX patterns (list+detail)
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** CatalogConsole renders one unified product-sidebar + editor layout instead of switching between New Product and Revise Existing tabs
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points
- `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx` — Main orchestrator; defines `ConsoleScreen` type and renders tabs + screen bodies
- `apps/xa-uploader/src/app/page.tsx` — Server component entry; renders `UploaderHomeClient`

### Key Modules / Files
- `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx:20` — `ConsoleScreen = "new" | "revise" | "currency"` type definition
- `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx:24-51` — `ScreenTabs` component rendering "New Product" and "Revise Existing" tabs
- `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx:80-103` — `ReviseScreen` component (two-column grid: sidebar + editor)
- `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx:105-160` — `CurrencyScreen` component (out of scope)
- `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx:162-180` — `ConsoleBody` dispatching to screens based on `screen` state
- `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx:185` — `screen` state initialized to `"new"`
- `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx:187-197` — `openNewScreen`, `openReviseScreen`, `openCurrencyScreen` callbacks
- `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts:678-719` — Hook composition returning all state and handlers
- `apps/xa-uploader/src/components/catalog/EditProductFilterSelector.client.tsx:26-30` — Props: `products`, `onSelect`, `onNew`
- `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts:115-138` — `handleNew()`: resets to empty draft
- `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts:177-204` — `handleSelect()`: populates draft from selected product
- `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx` — Shared form; adapts based on `selectedSlug` (delete button shown only when non-null)

### Patterns & Conventions Observed
- Tab switching is purely a `CatalogConsole` concern — the form, actions, and hooks have no awareness of which tab is active: `CatalogConsole.client.tsx:185`
- `selectedSlug: null` = add mode, `selectedSlug: string` = edit mode — this convention is used throughout the entire action/form layer: `catalogConsoleActions.ts:115,177`
- `EditProductFilterSelector` already has an `onNew` prop for switching to add mode: `EditProductFilterSelector.client.tsx:29`
- Currency screen renders only when `uploaderMode === "internal"` and is triggered by a header button, not by the ScreenTabs component: `CatalogConsole.client.tsx:199-220`

### Data & Contracts
- Types/schemas/events:
  - `ConsoleScreen = "new" | "revise" | "currency"` — to be simplified
  - `ConsoleState = ReturnType<typeof useCatalogConsole>` — unchanged
  - `EditProductFilterSelectorProps = { products, onSelect, onNew }` — unchanged
- Persistence:
  - No persistence changes; draft/product state management unchanged
- API/contracts:
  - No API changes; save/delete endpoints unchanged

### Dependency & Impact Map
- Upstream dependencies:
  - `useCatalogConsole` hook provides `loadCatalog`, `handleNew`, `handleSelect`, `products`
  - `EditProductFilterSelector` requires products array from `loadCatalog()`
- Downstream dependents:
  - `CatalogProductForm` — no changes needed (already mode-agnostic)
  - `catalogConsoleActions` — no changes needed
  - `CatalogProductImagesFields` — no changes needed
- Likely blast radius:
  - `CatalogConsole.client.tsx` — primary change target (remove ScreenTabs, merge layouts)
  - `useCatalogConsole.client.ts` — minor (remove screen-related exports if any)
  - `EditProductFilterSelector.client.tsx` — minor (ensure "New Product" button is prominent)
  - No other files affected

### Delivery & Channel Landscape
Not investigated: internal tool, no external delivery channel.

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest + React Testing Library
- Commands: `pnpm --filter @apps/xa-uploader test` (CI only per testing policy)
- CI integration: Reusable workflow in `.github/workflows/reusable-app.yml`

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Product form rendering | Unit | `__tests__/CatalogProductForm.test.tsx` | Tests add vs edit flow rendering |
| Action feedback/busy lock | Unit | `__tests__/action-feedback.test.tsx` | 8 tests; covers save, autosave, conflict |
| Domain behavior | Unit | `__tests__/useCatalogConsole-domains.test.tsx` | Login/logout, save/delete, storefront switch |
| Sync feedback | Unit | `__tests__/sync-feedback.test.tsx` | 8 tests; sync panel behavior |
| Currency rates | Unit | `__tests__/CurrencyRatesPanel.test.tsx` | 8 tests |
| Error localization | Unit | `__tests__/error-localization.test.tsx` | 3 tests |

#### Coverage Gaps
- No tests for tab switching (`ScreenTabs`, `ConsoleScreen`, `openNewScreen`/`openReviseScreen`)
- No tests for `EditProductFilterSelector` (pending from `xa-uploader-edit-filter-select` plan TASK-02)

#### Testability Assessment
- Easy to test: The unified layout is simpler than the tab-switching pattern — fewer conditional branches
- Hard to test: Nothing identified; removing tabs reduces complexity

#### Recommended Test Approach
- Unit test: Verify CatalogConsole renders sidebar + editor in a single layout (no tab switching)
- Unit test: Verify "New Product" button in sidebar calls `handleNew()`
- Unit test: Verify currency screen still accessible via header button

### Recent Git History (Targeted)
Not investigated: not needed for this scope.

## Questions

### Resolved
- Q: Does the form need changes to work in a unified layout?
  - A: No. `CatalogProductForm` already adapts based on `selectedSlug` being null (add) vs set (edit). Delete button conditionally renders on `selectedSlug !== null`.
  - Evidence: `CatalogProductForm.client.tsx` conditional rendering

- Q: How should the product list load on initial render?
  - A: Call `loadCatalog()` on mount (currently only called when switching to "revise" tab). The sidebar needs products immediately.
  - Evidence: `CatalogConsole.client.tsx:192` — `openReviseScreen` calls `state.loadCatalog()`

- Q: Does `EditProductFilterSelector` already support a "New Product" action?
  - A: Yes, it accepts an `onNew` callback prop already.
  - Evidence: `EditProductFilterSelector.client.tsx:29`

- Q: What happens to the `ConsoleScreen` type?
  - A: Simplify to `"catalog" | "currency"` — the catalog screen is the unified add/edit view, currency remains separate.
  - Evidence: Agent analysis of current switching logic

- Q: Will the `xa-uploader-edit-filter-select` plan conflict?
  - A: No — that plan builds `EditProductFilterSelector` and its filter utility. This plan consumes that component by making it always-visible. The plans are complementary. If edit-filter-select tasks are not yet built, this plan should depend on them or absorb them.
  - Evidence: `docs/plans/xa-uploader-edit-filter-select/plan.md` TASK-01 and TASK-02 both incomplete

### Open (Operator Input Required)
None — all design questions are resolvable from the codebase and operator's stated intent.

## Scope Signal

- **Signal:** right-sized
- **Rationale:** The change is well-bounded to `CatalogConsole.client.tsx` (remove tabs, merge layouts) with minor touches to the sidebar component. The form, actions, hooks, and API layers require zero changes. Evidence from the exploration confirms the `selectedSlug` null/non-null pattern already handles all add vs edit logic downstream.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Tab switching removal | Yes | None | No |
| Layout merge (sidebar always visible) | Yes | None | No |
| Currency screen isolation | Yes | None — currency button is in header, independent of ScreenTabs | No |
| Product list loading on mount | Yes | None — `loadCatalog()` must be called on mount instead of on tab switch | No |
| Form behavior (add/edit) | Yes | None — form is already mode-agnostic via `selectedSlug` | No |
| Related plan interaction | Yes | None — edit-filter-select plan is complementary | No |

## Confidence Inputs
- Implementation: 92% — straightforward removal of tab switching and layout merge; all evidence confirms form is already mode-agnostic
- Approach: 90% — standard catalog-manager pattern (list+detail); no novel design decisions
- Impact: 85% — improves UX by removing unnecessary navigation step; low risk of regression
- Delivery-Readiness: 90% — all dependencies are internal, no external services or approvals needed
- Testability: 85% — existing test infrastructure covers the affected components; new tests are simple

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Product list not loaded on initial render | Low | Medium | Call `loadCatalog()` on mount via useEffect |
| Edit-filter-select plan tasks not yet built | Medium | Low | This plan can absorb or depend on those tasks; the sidebar component already exists in codebase |
| Currency screen accidentally affected | Low | Low | Currency is triggered by header button, not ScreenTabs; keep `"currency"` as a separate screen mode |

## Planning Constraints & Notes
- Must-follow patterns:
  - Preserve `selectedSlug` null/non-null convention for add/edit mode
  - Keep currency screen accessible via header button
  - Call `loadCatalog()` on mount so sidebar has products immediately
- Rollout/rollback expectations:
  - Internal tool; no staged rollout needed
- Observability expectations:
  - None required; internal operator tool

## Suggested Task Seeds (Non-binding)
1. Remove `ScreenTabs` component and simplify `ConsoleScreen` type to `"catalog" | "currency"`
2. Merge `ReviseScreen` layout (two-column grid with sidebar + editor) as the default catalog view
3. Ensure `loadCatalog()` is called on mount
4. Add "New Product" button prominence in `EditProductFilterSelector`
5. Update/add tests for the unified layout

## Execution Routing Packet
- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - `CatalogConsole` renders sidebar + editor in single layout without tab switching
  - Currency screen still accessible and functional
  - All existing tests pass
  - New test confirms unified layout renders correctly
- Post-delivery measurement plan:
  - Manual verification by operator

## Evidence Gap Review

### Gaps Addressed
- Confirmed form is mode-agnostic via `selectedSlug` (no form changes needed)
- Confirmed currency screen is independent of ScreenTabs (header button only)
- Confirmed `EditProductFilterSelector` already accepts `onNew` prop
- Confirmed no test coverage exists for tab switching (no tests to break)

### Confidence Adjustments
- None required; all evidence consistent with initial assessment

### Remaining Assumptions
- `EditProductFilterSelector` component exists and works (it does — built and in codebase)
- `loadCatalog()` is safe to call on mount without side effects beyond fetching products (confirmed from hook implementation)

## Planning Readiness
- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan`
