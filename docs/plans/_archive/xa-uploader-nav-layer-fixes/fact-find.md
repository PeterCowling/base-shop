---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-06
Last-updated: 2026-03-06
Feature-Slug: xa-uploader-nav-layer-fixes
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/xa-uploader-nav-layer-fixes/plan.md
Trigger-Source: dispatch
Dispatch-ID: IDEA-DISPATCH-20260306150000-0002
Trigger-Why: xa-uploader UI review found two navigation-layer gaps — the sidebar forces brand→collection cascades with no browse-all option, making product discovery slow, and the onHeaderExtra portal pattern breaks layout ownership and is fragile to future parent restructuring.
Trigger-Intended-Outcome: type: operational | statement: Deliver a plan and implementation that (1) adds a browse-all or search mode to EditProductFilterSelector so operators can see and select any product without filtering, and (2) replaces the onHeaderExtra portal with self-contained inline navigation inside CatalogConsole. | source: operator
---

# XA Uploader Navigation Layer Fixes — Fact-Find Brief

## Scope

### Summary

Two navigation gaps in xa-uploader require fixes: (1) the product filter sidebar requires operators to navigate a brand→collection→size→color cascade before they can select a product — there is no way to see or select an arbitrary product directly; (2) the nav button for the currency/sync screen is injected into the parent shell header via an `onHeaderExtra` callback, a portal-like pattern that couples CatalogConsole's internal screen state to the shell's layout.

### Goals

- Add a "show all" or search mode to `EditProductFilterSelector` so operators can browse and select any product without completing the filter cascade.
- Replace the `onHeaderExtra` portal with a self-contained inline nav bar inside `CatalogConsole`.

### Non-goals

- Changes to the filter cascade's cascading rules — the brand→collection→size→color narrowing logic remains.
- Changes to `CatalogProductForm`, `CatalogSyncPanel`, or any other panel component.
- Changes to `UploaderShell`'s layout beyond removing the `headerExtra` prop dependency.
- Redesign of the filter sidebar's visual style.
- Removing the auto-advance or auto-select `useEffect` hooks — they remain active in normal (non-show-all) mode; show-all mode simply bypasses them by keeping criteria empty (`{}`), which means no auto-advance triggers and the auto-select only fires if one product remains in the full list (effectively never for a real catalog).

### Constraints & Assumptions

- Constraints:
  - `catalogStyles.ts` is the single source of truth for button/panel class constants; all new UI must use existing constants from that file.
  - The `gate-*` design token prefix applies throughout.
  - No arbitrary Tailwind must be used without an `eslint-disable ds/no-arbitrary-tailwind -- XAUP-0001` comment.
  - Both `CatalogConsole.client.tsx` and `EditProductFilterSelector.client.tsx` are being modified by a parallel agent (IDEA-DISPATCH-20260306150000-0005) — these files will need merging, but the worktree is isolated.
  - The app uses OpenNext Cloudflare Workers build (not standard Next.js). Tests run in CI only — no local jest.
  - i18n: all user-visible strings must be added to both `en` and `zh` sections of `uploaderI18n.ts`. Two new keys: `editFilterShowAll` and `screenCatalog`.
- Assumptions:
  - "Show all products" mode is the right primitive (not a free-text search input). A scrollable flat list of all products is the appropriate addition. A search input would require debounce logic and would not support the Chinese locale cleanly without additional considerations.
  - In show-all mode, `criteria` stays at `{}` (empty), which means: (a) auto-advance `useEffect` (line 145) has no brand/collection/size set so no cascade fires; (b) auto-select `useEffect` (line 86) only triggers if `filtered.length === 1`, which is effectively impossible for a full catalog list. No extra suppression is needed.
  - The "show all" toggle is a separate control — it does NOT call `handleReset` or `onNew()`. It only calls `setShowAll(false)` when toggled off, leaving criteria and editor state untouched. `handleReset` remains for the existing "Reset" button and "New Product" button paths.
  - `ProductCompactList` items in show-all mode must show brand + collection alongside title for disambiguation (the current cascade-mode display of title + color is insufficient when browsing across all brands). The plan task must specify that `ProductCompactList` or a local variant renders an additional brand/collection subtitle line in show-all context.
  - The `onHeaderExtra` prop should be removed from `CatalogConsole` entirely. The inline nav replaces it. `UploaderHomeClient` no longer needs `headerExtra` state.
  - The `showCurrency` screen toggle logic stays inside `CatalogConsole` — only its rendering location changes (from header injection to inline within the console body).
  - The inline nav reuses existing i18n keys (`screenCurrencyRates` or `screenSync` for the currency/sync button; a new `screenCatalog` key for the catalog button). Only one truly new key is needed: `editFilterShowAll` for the show-all toggle. The inline nav needs one additional new key (`screenCatalog`: en "Catalog", zh "商品目录") to label the catalog screen button in the tab bar.

## Outcome Contract

- **Why:** xa-uploader UI review found that operators must navigate the brand→collection cascade to reach any product — there is no shortcut to browse or select directly. The `onHeaderExtra` portal is fragile: it requires the parent to manage state (`setHeaderExtra`) and couples child screen state to parent layout.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Deliver a plan and implementation that (1) adds a browse-all or search mode to EditProductFilterSelector so operators can see and select any product without filtering, and (2) replaces the onHeaderExtra portal with self-contained inline navigation inside CatalogConsole.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/xa-uploader/src/app/page.tsx` — Server component entry; does auth check, redirects to `/login`, renders `UploaderHomeClient`.
- `apps/xa-uploader/src/app/UploaderHome.client.tsx` — Client shell coordinator; owns `headerExtra` state; passes `onHeaderExtra={setHeaderExtra}` to `CatalogConsole`, passes `headerExtra` to `UploaderShell`.
- `apps/xa-uploader/src/app/UploaderShell.client.tsx` — Layout shell; renders header with `{headerExtra}` in the `ms-auto flex items-center gap-3` bar alongside nav link and toggles.

### Key Modules / Files

- `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx` — Main console; owns `screen` state (`"catalog" | "currency"`); uses `useEffect` to call `onHeaderExtra(node)` with a button when `showCurrency` is true; the button toggles between screens.
- `apps/xa-uploader/src/components/catalog/EditProductFilterSelector.client.tsx` — Sidebar filter cascade; renders brand/collection/size/color `<select>` elements; shows `ProductCompactList` only when filters are exhausted but multiple matches remain (`shouldShowProductList`); does NOT have a "show all" or bypass mode.
- `apps/xa-uploader/src/components/catalog/catalogEditFilter.ts` — Pure filter logic: `filterCatalogProducts(products, criteria)` and `extractFilterOptions(products, criteria)`. No component logic.
- `apps/xa-uploader/src/components/catalog/catalogStyles.ts` — Style constants: `BTN_ACCENT_OUTLINE_CLASS`, `BTN_SECONDARY_CLASS`, `SELECT_CLASS`, `FIELD_LABEL_CLASS`, `PANEL_CLASS`, etc.
- `apps/xa-uploader/src/lib/uploaderI18n.ts` — Bilingual string dictionary (en + zh) in a single TypeScript file. Existing filter-related keys: `editFilterTitle`, `editFilterAllBrands`, `editFilterReset`, `editFilterNoMatches`, `editFilterMatchCount`, `editFilterSelectProduct`, `sidebarNewProduct`. Screen nav keys: `screenCurrencyRates`, `screenSync`. Two new keys required: `editFilterShowAll` (for the show-all toggle) and `screenCatalog` (for the inline nav catalog button label).

### Patterns & Conventions Observed

- All buttons use `catalogStyles.ts` constants or inline classes with `eslint-disable ds/no-arbitrary-tailwind -- XAUP-0001` — evidence: `EditProductFilterSelector.client.tsx` line 54, 161, 180.
- `min-h-11 min-w-11` touch targets on all interactive elements — evidence: existing button patterns in `EditProductFilterSelector`.
- i18n is consumed via `useUploaderI18n()` → `t(key)` — all string keys in `uploaderI18n.ts`.
- `ProductCompactList` already exists as a sub-component with scrollable list, hover states, and `data-testid` — reusable for the "show all" mode.
- `shouldShowProductList` is a pure function determining when the list appears — can be bypassed with a `showAll` boolean state.

### Data & Contracts

- Types/schemas/events:
  - `CatalogProductDraftInput` from `@acme/lib/xa` — the product type for the full catalog.
  - `EditFilterCriteria: { brand?, collection?, size?, color? }` — current criteria shape.
  - `EditFilterOptions: { brands, collections, sizes, colors }` — available option sets.
  - `CatalogConsoleProps: { monoClassName?: string; onHeaderExtra?: (node: React.ReactNode) => void }` — target for prop removal.
  - `ConsoleScreen: "catalog" | "currency"` — local state in CatalogConsole.
- Persistence: none (all UI state is transient React state).
- API/contracts: no API changes required. All changes are pure UI.

### Dependency & Impact Map

- Upstream dependencies:
  - `UploaderHomeClient` → `CatalogConsole` (passes `onHeaderExtra`). After fix: prop removed; `UploaderHomeClient` no longer needs `headerExtra` state.
  - `UploaderShell` → receives `headerExtra?: ReactNode`. After fix: prop becomes unused for the console page (stays in shell for potential future use, but will receive `null` or be removed).
- Downstream dependents:
  - `EditProductFilterSelector` is only rendered by `CatalogConsole` (confirmed: no other call sites via grep).
  - `onHeaderExtra` is only called from `CatalogConsole` and only wired up in `UploaderHomeClient`.
- Likely blast radius:
  - Contained to: `CatalogConsole.client.tsx`, `EditProductFilterSelector.client.tsx`, `UploaderHomeClient.tsx` (minor).
  - No API, no database, no external service, no shared packages affected.
  - `catalogEditFilter.ts` and `catalogStyles.ts` may gain minor additions but are otherwise unchanged.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest + React Testing Library
- Commands: CI only (never local); governed test runner: `pnpm -w run test:governed`
- CI integration: `reusable-app.yml`

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `catalogEditFilter.ts` | Unit | `__tests__/catalogEditFilter.test.ts` | Full coverage of `filterCatalogProducts` and `extractFilterOptions` — 15 test cases |
| `CatalogConsole` / feedback | Integration | `__tests__/action-feedback.test.tsx`, `__tests__/sync-feedback.test.tsx` | Covers feedback/action flows |
| `useCatalogConsole` | Integration | `__tests__/useCatalogConsole-domains.test.tsx` | Domain state coverage |
| `EditProductFilterSelector` | None | — | No existing component-level tests for the filter selector UI |
| `CatalogConsole` nav/screen switching | None | — | No tests for the `onHeaderExtra` pattern or screen toggle |

#### Coverage Gaps

- Untested paths:
  - `EditProductFilterSelector` component rendering, "show all" toggle, product list display.
  - `CatalogConsole` inline nav rendering, screen switching.
  - `shouldShowProductList` function — currently untested (pure function, easily unit-testable).
- Extinct tests: none identified.

#### Testability Assessment

- Easy to test:
  - `shouldShowProductList` as a pure function — can be extracted and unit-tested directly.
  - "Show all" toggle in `EditProductFilterSelector` — straightforward RTL test (click toggle, verify full product list renders).
  - Inline nav in `CatalogConsole` — RTL test for button presence and screen switching.
- Hard to test: none — all changes are pure React UI with no side effects or external dependencies.
- Test seams needed: none; existing `useCatalogConsole` mock patterns in existing tests can be reused.

### Recent Git History (Targeted)

- `d5900d1dcf feat(xa-uploader): unified catalog screen — remove tabs, always-visible sidebar+editor` — This commit introduced the current sidebar+editor grid layout and eliminated a previous tab pattern. The `onHeaderExtra` pattern for the currency/sync button was part of this same work. This is the most recent structural change to the layout.
- `65572cf6a3 fix(xa-uploader): preserve save auto-advance on add flow` — Fixed auto-select after save; touches `EditProductFilterSelector` auto-advance logic.
- `db688badcd feat(xa-uploader): TASK-01 truthful status semantics + publish blockers` — Recent autosave work; does not affect nav layer.
- `0d23d6f064 feat(xa-uploader): autosave queue flush + conflict retry + sync gating` — Most recent commit; autosave/sync layer only.

## Questions

### Resolved

- Q: Is a "show all" toggle the right pattern, or should it be a search/filter input?
  - A: Show all toggle is correct. The product catalog is expected to be small (tens, not thousands). A scrollable flat list of all products is immediately readable, requires no debounce logic, and avoids Chinese locale complications with free-text search. The existing `ProductCompactList` sub-component can be reused directly.
  - Evidence: `ProductCompactList` in `EditProductFilterSelector.client.tsx` lines 32–66 already provides a scrollable, styled list with hover states. Reuse is straightforward.

- Q: Should `onHeaderExtra` be removed from `UploaderShell` too, or just from `CatalogConsole`?
  - A: Remove from `CatalogConsole` (both the prop and the `useEffect` that calls it). `UploaderHomeClient` should drop its `headerExtra` state and the prop pass-through. `UploaderShell`'s `headerExtra?: ReactNode` prop can remain for now (it's optional and not harmful) — removing it would require verifying all shell usages, which is out of scope. Setting it to never-rendered is sufficient.
  - Evidence: `UploaderShell.client.tsx` line 18 — `headerExtra?: ReactNode` is optional. `UploaderHomeClient.tsx` line 16 — `headerExtra` state and `setHeaderExtra` are the only consumers.

- Q: Where exactly should the inline nav render inside `CatalogConsole`?
  - A: A tab bar or button row above `ConsoleBody`, rendered only when `showCurrency` is true. This keeps the nav visually connected to the content it controls, and avoids the shell header ownership problem. A simple two-button approach (Catalog / Currency or Sync) styled with `BTN_SECONDARY_CLASS` / `BTN_ACCENT_OUTLINE_CLASS` from `catalogStyles.ts` is sufficient.
  - Evidence: `CatalogConsole.client.tsx` lines 187–200 — the current authenticated render is `<div className="space-y-6">` containing feedback + `<ConsoleBody>`. The inline nav fits naturally above `ConsoleBody`.

- Q: Does `filterCatalogProducts(products, {})` return all products (for "show all" mode)?
  - A: Yes. `filterCatalogProducts` with empty criteria returns the full `products` array — confirmed by test TC-01: `"no criteria returns all products"` in `catalogEditFilter.test.ts` line 92–94.
  - Evidence: `catalogEditFilter.ts` line 45 — `products.filter((p) => { if (criteria.brand && ...) })` — all conditions guard on criteria being set. This also means auto-advance (`useEffect` line 145) never fires when criteria is `{}` because `criteria.brand` is falsy, and auto-select (`useEffect` line 86) only fires when `filtered.length === 1` — impossible for a real multi-product catalog in show-all mode.

- Q: Does the existing `handleReset` (line 139) call `onNew()`, creating a risk if reused for the show-all toggle?
  - A: Yes. `handleReset` calls both `setCriteria({})` and `onNew()`. The show-all toggle must NOT use `handleReset`. Instead: toggling show-all on/off uses a dedicated `setShowAll` state setter only, leaving criteria and the editor draft untouched. This is a distinct code path from reset.
  - Evidence: `EditProductFilterSelector.client.tsx` line 139–142: `const handleReset = React.useCallback(() => { setCriteria({}); onNew(); }, [onNew]);`

- Q: Is `ProductCompactList` sufficient for a full-catalog browse, or does it need disambiguation?
  - A: Needs light enhancement. The current item renders `p.title || p.slug` + optional `p.taxonomy.color`. In a cascade-narrowed context (same brand/collection), title + color is enough. In browse-all context across brands, operators need brand and collection visible. The plan task must specify: in show-all mode, each list item shows brand handle (or name) and collection handle as a subtitle beneath the product title. This can be done with a prop or a separate rendering path — not a structural change to `ProductCompactList` itself.

- Q: Are there other places that use `onHeaderExtra` in the codebase?
  - A: Only `UploaderHomeClient.tsx`. The prop is declared only in `CatalogConsole` and consumed only there.

### Open (Operator Input Required)

None. All questions are resolvable from code evidence.

## Confidence Inputs

- Implementation: 95%
  - Evidence: All files fully read. Entry points, data flow, and prop chain are completely understood. No unknown dependencies.
  - To reach 95%: already at 95% — no blocking unknowns.
  - To reach 90%+: already there; only residual risk is the parallel agent merge (IDEA-DISPATCH-20260306150000-0005).

- Approach: 92%
  - Evidence: "Show all" toggle reuses `ProductCompactList`. Inline nav reuses existing `catalogStyles.ts` button constants. Both approaches follow existing patterns precisely.
  - To reach 90%+: already there.

- Impact: 90%
  - Evidence: Blast radius is fully contained to three files. No API, schema, or shared package changes.
  - To reach 90%+: already there.

- Delivery-Readiness: 90%
  - Evidence: All required patterns, constants, and i18n keys identified. Two new i18n keys required: `editFilterShowAll` (show-all toggle) and `screenCatalog` (inline nav catalog tab). Auto-advance/auto-select interaction in show-all mode is now fully analyzed and resolved. Parallel agent merge is the main residual risk.
  - To reach 95%+: confirm parallel agent's exact changes before final merge.

- Testability: 90%
  - Evidence: Pure React UI changes with no external dependencies. Existing RTL test infrastructure ready. `catalogEditFilter.ts` already has unit test coverage that extends cleanly.
  - To reach 90%+: already there.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Parallel agent merge conflict (IDEA-DISPATCH-20260306150000-0005 also touches CatalogConsole.client.tsx and EditProductFilterSelector.client.tsx) | Medium | Medium | Changes are functionally distinct (loading states vs nav); worktree isolation prevents immediate conflict; explicit merge step required post-build |
| "Show all" list performance with a very large product catalog | Low | Low | Catalog is expected to be small (tens of products); `ProductCompactList` uses `max-h-[280px] overflow-y-auto` scroll containment already |
| TypeScript error if `onHeaderExtra` prop is removed but UploaderShell still types it | Low | Low | `UploaderShell.headerExtra?: ReactNode` is optional — removing the pass-through in `UploaderHomeClient` is a clean drop |
| i18n key omission in zh locale | Low | Low | i18n keys must be added to both en and zh blocks in `uploaderI18n.ts` — easy to verify with existing lint/typecheck |

## Planning Constraints & Notes

- Must-follow patterns:
  - All button classes from `catalogStyles.ts` (no inline class construction for new buttons).
  - `min-h-11 min-w-11` on all interactive elements.
  - `eslint-disable ds/no-arbitrary-tailwind -- XAUP-0001` comment required for any non-token Tailwind.
  - i18n: all new strings must be added to both `en` and `zh` sections of `uploaderI18n.ts`.
  - `data-testid` attributes required on new interactive elements (kebab-case, prefixed with component name).
  - Tests run in CI only — never locally. Typecheck and lint are fine locally via `pnpm typecheck && pnpm lint`.
  - Writer lock required for all commits: `scripts/agents/with-writer-lock.sh`.
- Rollout/rollback expectations: no feature flag needed — changes are purely additive UI. Rollback is a revert commit.
- Observability expectations: none required — these are operator-tool UI changes, no analytics instrumentation needed.

## Suggested Task Seeds (Non-binding)

1. **TASK-01: Add "show all" toggle to `EditProductFilterSelector`**
   - Add a boolean `showAll` state (default false). Add a toggle button (separate from "New Product" and "Reset" buttons; uses `BTN_SECONDARY_CLASS`) that calls only `setShowAll(true)` — must NOT call `handleReset` or `onNew()`.
   - When `showAll` is true: render a full-catalog list using `ProductCompactList` styling but with brand + collection shown as a subtitle line beneath each product title (for disambiguation across brands). The filter cascade selects are hidden.
   - When exiting show-all (via an "Exit browse" / back button), call only `setShowAll(false)` — does not touch criteria or call `onNew()`.
   - Because show-all keeps `criteria` at `{}`, auto-advance `useEffect` (line 145) is inert (no brand set), and auto-select `useEffect` (line 86) only fires if one product exists — safe in all realistic scenarios.
   - Add i18n keys: `editFilterShowAll` (en: "Show all products"; zh: "显示全部商品") and `editFilterHideAll` (en: "Back to filter"; zh: "返回筛选"). Add `data-testid="edit-filter-show-all"` to toggle button.

2. **TASK-02: Add inline screen nav to `CatalogConsole`, remove `onHeaderExtra`**
   - Remove `onHeaderExtra` prop from `CatalogConsoleProps`. Remove the `useEffect` that calls it (lines 151–170).
   - Add an inline two-button tab bar above `ConsoleBody` (visible only when `showCurrency` is true) using `BTN_SECONDARY_CLASS` for inactive tab, `BTN_ACCENT_OUTLINE_CLASS` for active tab.
   - Tab labels: "Catalog" (`screenCatalog` key, new) and `screenCurrencyRates` / `screenSync` (existing keys).
   - Update `UploaderHomeClient` to remove `headerExtra` state and `onHeaderExtra` prop pass-through.
   - Add i18n key: `screenCatalog` (en: "Catalog"; zh: "商品目录").

3. **TASK-03: Typecheck and lint gate**
   - `pnpm --filter xa-uploader typecheck && pnpm --filter xa-uploader lint`.

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - `EditProductFilterSelector` renders all products when "show all" is toggled, without requiring filter cascade navigation.
  - `CatalogConsole` has no `onHeaderExtra` prop; currency/sync nav is rendered inline.
  - `UploaderHomeClient` has no `headerExtra` state.
  - `pnpm --filter xa-uploader typecheck` passes.
  - `pnpm --filter xa-uploader lint` passes.
- Post-delivery measurement plan: operator smoke test (manual verification that both features work in the browser).

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| EditProductFilterSelector — filter cascade and show-all bypass path | Yes | None | No |
| CatalogConsole — onHeaderExtra portal pattern and screen state | Yes | None | No |
| UploaderHomeClient — headerExtra state wiring | Yes | None | No |
| UploaderShell — headerExtra prop and layout ownership | Yes | None | No |
| catalogStyles.ts — style constants for new UI | Yes | None | No |
| uploaderI18n.ts — existing keys and new key requirements | Yes | None | No |
| Test landscape — existing tests, gaps, testability | Yes | [Minor] No component-level tests for EditProductFilterSelector exist; new tests needed in CI | No |
| Parallel agent conflict surface | Partial | [Moderate] IDEA-DISPATCH-20260306150000-0005 also touches both target files; merge required | No (advisory — worktree isolation covers build phase) |

## Scope Signal

- Signal: right-sized
- Rationale: The two navigation gaps are well-scoped, fully contained to three files with no API or schema changes. All patterns are established and reusable. No blocking unknowns. The parallel agent merge is an expected coordination overhead, not a scope risk.

## Evidence Gap Review

### Gaps Addressed

- Full read of `EditProductFilterSelector.client.tsx` — filter cascade, auto-advance (line 145), auto-select (line 86), `shouldShowProductList` logic, `handleReset` calling `onNew()` (line 139), and `ProductCompactList` sub-component all fully understood.
- Auto-advance/auto-select interaction in show-all mode analyzed: keeping criteria at `{}` safely deactivates both effects. Confirmed via `filterCatalogProducts` test TC-01 and code reading of both useEffects.
- `handleReset` / `onNew()` coupling identified and resolved: show-all toggle uses dedicated `setShowAll` only.
- `ProductCompactList` display gap identified: brand + collection subtitle required in show-all mode for disambiguation.
- Full read of `CatalogConsole.client.tsx` — `onHeaderExtra` useEffect pattern, screen state, and all authenticated render paths fully understood.
- Full read of `catalogEditFilter.ts` — confirmed `filterCatalogProducts({})` returns all products.
- Full read of `catalogStyles.ts` — all button/panel constants identified.
- Full read of `UploaderHome.client.tsx` and `UploaderShell.client.tsx` — complete prop chain for `headerExtra` understood.
- i18n key inventory completed — two new keys required: `editFilterShowAll`, `editFilterHideAll` (for show-all toggle), `screenCatalog` (for inline nav). (Three keys total, not one or two as originally stated; corrected.)
- Test landscape fully mapped — existing tests confirmed, coverage gaps identified.

### Confidence Adjustments

- Approach confidence raised from estimated 80% to 92% after full code reading.
- Delivery-Readiness raised from 88% to 90% after resolving all auto-advance/auto-select and i18n key gaps.
- No downward adjustments.

### Remaining Assumptions

- "Show all" mode will not require pagination — catalog size is small. If the catalog grows significantly, a search input would be a better UX but is a future concern.
- `UploaderShell.headerExtra` prop can be left in place (optional, harmless) rather than removed, reducing blast radius.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan xa-uploader-nav-layer-fixes --auto`
