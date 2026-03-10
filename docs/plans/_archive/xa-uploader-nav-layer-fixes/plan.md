---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-06
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-uploader-nav-layer-fixes
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# XA Uploader Navigation Layer Fixes — Plan

## Summary

Two navigation gaps exist in the xa-uploader operator tool. First, the product filter sidebar forces operators through a brand→collection→size→color cascade with no way to browse or select an arbitrary product directly — a show-all toggle is the correct fix. Second, the currency/sync screen nav button is injected into the parent shell header via an `onHeaderExtra` callback, coupling child state to parent layout — inline nav inside `CatalogConsole` is the correct replacement.

This plan delivers two sequential IMPLEMENT tasks: (1) add a `showAll` mode to `EditProductFilterSelector` with brand/collection disambiguation in the product list, plus new i18n keys for both tasks; (2) remove `onHeaderExtra` from `CatalogConsole` and replace it with a self-contained inline tab bar. Both tasks are pure React UI changes with no API, schema, or shared-package impact. Tasks run sequentially because both modify `uploaderI18n.ts`. A final typecheck+lint gate confirms clean delivery.

## Active tasks

- [x] TASK-01: Add show-all browse mode to EditProductFilterSelector (+ i18n keys for both tasks)
- [x] TASK-02: Replace onHeaderExtra portal with inline nav in CatalogConsole
- [x] TASK-03: Typecheck and lint gate

## Goals

- Operators can browse and select any product from the full catalog without navigating the filter cascade.
- Screen navigation (catalog ↔ currency/sync) is self-contained inside `CatalogConsole` — no parent state required.

## Non-goals

- Changes to the filter cascade's cascading rules.
- Changes to `CatalogProductForm`, `CatalogSyncPanel`, or any other panel component.
- Removing `UploaderShell.headerExtra` prop (optional, harmless — out of scope).
- Free-text product search (future concern if catalog grows large).

## Constraints & Assumptions

- Constraints:
  - All button classes from `catalogStyles.ts` — no inline class construction.
  - `min-h-11 min-w-11` on all interactive elements.
  - `eslint-disable ds/no-arbitrary-tailwind -- XAUP-0001` required for any non-token Tailwind.
  - i18n: all new strings in both `en` and `zh` sections of `uploaderI18n.ts`.
  - `data-testid` attributes on new interactive elements.
  - Tests run in CI only — never locally.
  - Writer lock required: `scripts/agents/with-writer-lock.sh`.
  - No worktrees — repo policy (`AGENTS.md` line 63) forbids them. All work runs on a single checkout. The parallel agent (IDEA-DISPATCH-20260306150000-0005) that also touches these files will need to be merged via standard git after both branches complete independently.
  - TASK-01 and TASK-02 must run sequentially (not in parallel) because both modify `uploaderI18n.ts`. TASK-01 adds all three new i18n keys.
- Assumptions:
  - `showAll` boolean state is independent of `criteria`. When `showAll` is true, the product list renders directly from `products` (bypassing `filterCatalogProducts`) — `criteria` is untouched and preserved for when the operator exits show-all mode.
  - The auto-select `useEffect` (line 86 of `EditProductFilterSelector`) is only relevant in cascade mode (non-show-all). In show-all mode it may fire if exactly 1 product exists — this is acceptable behavior, but `setShowAll(false)` must be added alongside `onSelect` in the product-button click handler so the view exits show-all after selection.
  - `currencyHeaderLabel` in `CatalogConsole` is already a translated string (result of `t("screenCurrencyRates")` or `t("screenSync")`). The currency tab button renders `{currencyHeaderLabel}` directly — NOT `{t(currencyHeaderLabel)}`.
  - Show-all toggle uses dedicated `setShowAll` only — does NOT call `handleReset` or `onNew()`.

## Inherited Outcome Contract

- **Why:** xa-uploader UI review found that operators must navigate the brand→collection cascade to reach any product with no shortcut. The `onHeaderExtra` portal couples child screen state to parent layout and is fragile to restructuring.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Deliver a plan and implementation that (1) adds a browse-all or search mode to EditProductFilterSelector so operators can see and select any product without filtering, and (2) replaces the onHeaderExtra portal with self-contained inline navigation inside CatalogConsole.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/xa-uploader-nav-layer-fixes/fact-find.md`
- Key findings used:
  - `handleReset` calls `onNew()` — show-all toggle must use dedicated `setShowAll` only.
  - `showAll` state is independent of `criteria` — product list in show-all mode renders from `products` directly, preserving `criteria` for cascade mode.
  - `ProductCompactList` needs brand+collection subtitle in show-all context for disambiguation across brands.
  - `onHeaderExtra` wired only in `UploaderHomeClient` — blast radius is three files.
  - Three new i18n keys: `editFilterShowAll`, `editFilterHideAll`, `screenCatalog` — all added in TASK-01.

## Proposed Approach

- Option A: Add free-text search to `EditProductFilterSelector`. Requires debounce, locale handling, and more complex state.
- Option B: Add a `showAll` boolean toggle that renders the full product list directly from `products`, bypassing the cascade. Reuses existing `ProductCompactList` infrastructure.
- Chosen approach: **Option B** — show-all toggle. Catalog is small (tens of products). No debounce or locale complexity. Fully consistent with existing patterns.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add show-all browse mode + all new i18n keys | 90% | M | Complete (2026-03-06) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Replace onHeaderExtra portal with inline nav | 90% | M | Complete (2026-03-09) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Typecheck and lint gate | 95% | S | Complete (2026-03-09) | TASK-01, TASK-02 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Must run first: adds all new i18n keys used by TASK-02 |
| 2 | TASK-02 | TASK-01 complete | `uploaderI18n.ts` already has `screenCatalog` key from TASK-01 |
| 3 | TASK-03 | TASK-01, TASK-02 complete | Final typecheck+lint gate |

## Tasks

### TASK-01: Add show-all browse mode to EditProductFilterSelector (+ all new i18n keys)

- **Type:** IMPLEMENT
- **Deliverable:** Modified `EditProductFilterSelector.client.tsx`; new i18n keys in `uploaderI18n.ts` (all three: `editFilterShowAll`, `editFilterHideAll`, `screenCatalog`)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-06)
- **Affects:**
  - `apps/xa-uploader/src/components/catalog/EditProductFilterSelector.client.tsx`
  - `apps/xa-uploader/src/lib/uploaderI18n.ts`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 90%
  - Implementation: 95% — All component internals fully read. State shape, useEffect behavior, `handleReset`/`onNew()` coupling, and `ProductCompactList` sub-component all understood. The show-all rendering path bypasses `filterCatalogProducts` entirely, which resolves the state-contract issue.
  - Approach: 90% — `showAll` is independent of `criteria`. Product list in show-all mode renders from `props.products` directly. `criteria` is preserved, untouched. On exit from show-all (Back to filter), the cascade view restores with whatever `criteria` was set. On product selection, `onSelect(product)` and `setShowAll(false)` are called together.
  - Impact: 90% — One component + one i18n file. No downstream consumers affected beyond what is specified.
  - Held-back test (Approach 90%): Downward bias applied — merging with IDEA-DISPATCH-20260306150000-0005 changes may require minor adjustments to the same file. Worth 5 points of conservatism.
- **Acceptance:**
  - `showAll` state variable added (default `false`).
  - A "Show all products" button rendered below "New Product" button when `products.length > 0 && !showAll`:
    - uses `BTN_SECONDARY_CLASS` from `catalogStyles.ts`
    - has `data-testid="edit-filter-show-all"`
    - calls only `setShowAll(true)` — does NOT call `handleReset` or `onNew()`
  - When `showAll` is `true`:
    - Filter cascade selects (brand, collection, size, color) are hidden.
    - A scrollable list renders directly from `props.products` (NOT from `filtered` / `filterCatalogProducts`) — with each item showing: product title (bold), brand handle + `"/"` + collection handle as a subtitle line (text-gate-muted, text-xs). Empty brand/collection renders a `"—"` gracefully.
    - Each product button: calls `onSelect(product)` AND `setShowAll(false)` — exits show-all mode on selection.
    - A "Back to filter" button at top: uses `BTN_SECONDARY_CLASS`; has `data-testid="edit-filter-hide-all"`; calls only `setShowAll(false)` — does NOT call `onNew()` or modify `criteria`.
    - `criteria` is untouched throughout show-all mode. When show-all exits, the cascade re-renders with whatever `criteria` was set before.
  - Auto-select `useEffect` (line 86): remains unchanged. In show-all mode, if exactly 1 product exists in the full catalog, it will call `onSelect(filtered[0])` — this is acceptable behavior. The `showAll` state is not cleared by this effect, but the next product selection via the list button clears it.
  - All three new i18n keys added to both `en` and `zh` sections of `uploaderI18n.ts`:
    - `editFilterShowAll`: en "Show all products", zh "显示全部商品"
    - `editFilterHideAll`: en "Back to filter", zh "返回筛选"
    - `screenCatalog`: en "Catalog", zh "商品目录"
  - **Expected user-observable behavior:**
    - [ ] Operator sees a "Show all products" button in the sidebar (below "New Product" button).
    - [ ] Clicking it immediately shows the full product list — no filter navigation required.
    - [ ] Each product in the list shows title prominently, with brand/collection as a subtitle.
    - [ ] Clicking a product selects it and returns to the normal filter view.
    - [ ] A "Back to filter" button exits show-all mode without clearing the editor draft or any current filter criteria.
    - [ ] The existing filter cascade still works normally when show-all is not active.
- **Validation contract (TC-XX):**
  - TC-01: Render with 5 products across 2 brands, `showAll=false` → "Show all products" button visible below "New Product" button.
  - TC-02: Click "Show all products" → `showAll=true` → all 5 products listed with brand+collection subtitles → cascade selects hidden.
  - TC-03: In show-all mode, click a product → `onSelect` called with correct product → `setShowAll(false)` called → cascade view restored.
  - TC-04: In show-all mode, click "Back to filter" → `setShowAll(false)` called → `onNew()` NOT called → `criteria` unchanged (e.g., brand="hermes" preserved).
  - TC-05: In show-all mode, the list renders from `props.products` directly (not `filterCatalogProducts`) — `criteria` is irrelevant to which items appear.
  - TC-06: Render with 0 products → "Show all products" button NOT rendered (existing empty-state path).
  - TC-07: Products with empty `brandHandle` render subtitle as `"— / —"` (or equivalent graceful fallback).
  - TC-08: i18n zh locale → "Show all products" button shows "显示全部商品" → "Back to filter" shows "返回筛选".
  - TC-09: `data-testid="edit-filter-show-all"` and `data-testid="edit-filter-hide-all"` present on correct buttons.
  - TC-10: Exactly 1 product in catalog, show-all mode active → auto-select useEffect calls `onSelect(filtered[0])` → editor loads the product → `showAll` remains `true` (show-all list stays visible) — this is the specified behavior; the operator can click the product or "Back to filter" to exit.
- **Execution plan:**
  - Red: Add `it.skip` stubs for TC-01 through TC-09 in `__tests__/EditProductFilterSelector.test.tsx` (CI only — do not run locally).
  - Green: Add `showAll` state. Add "Show all products" button. Implement conditional rendering: when `showAll`, hide cascade, show product list from `props.products` with brand/collection subtitle, show "Back to filter" button. Product selection: `onSelect(product)` + `setShowAll(false)`. Add all three i18n keys to `uploaderI18n.ts`.
  - Refactor: If inline show-all list JSX exceeds ~20 lines, extract as `BrowseAllProductList` sub-component in same file.
- **Planning validation (required for M/L):**
  - Checks run: Full read of `EditProductFilterSelector.client.tsx` (290 lines) — auto-select useEffect at line 86 calls `onSelect(filtered[0])` only, does not clear `showAll`; `handleReset` at line 139 calls `setCriteria({})` + `onNew()`. Full read of `catalogStyles.ts` — `BTN_SECONDARY_CLASS` confirmed. Full read of `uploaderI18n.ts` filter key block. Read `catalogEditFilter.ts` — `filterCatalogProducts(products, {})` returns all products (TC-01 confirmed).
  - Validation artifacts: `docs/plans/xa-uploader-nav-layer-fixes/fact-find.md`.
  - Unexpected findings: `handleReset` calls `onNew()` — handled by using dedicated `setShowAll`. State contract contradiction from Round 1 critique resolved: show-all renders from `props.products` directly, `criteria` is independent.
- **Scouts:** Auto-select effect with 1 total product in show-all mode: `onSelect` fires (correct behavior — operator wants that product anyway). `showAll` is not cleared by the effect, but user interaction via the list button always clears it.
- **Edge Cases & Hardening:**
  - Products with empty `brandHandle` or `collectionHandle` — subtitle renders `"—"` gracefully.
  - Show-all toggle with non-empty criteria — criteria preserved; on Back to filter, cascade re-renders with existing criteria intact.
  - Exactly 1 product in the full catalog — auto-select effect fires in cascade mode as before; in show-all mode, list renders normally (operator can still click or use Back to filter).
- **What would make this >=95%:** Parallel agent merge (IDEA-DISPATCH-20260306150000-0005) confirmed and completed cleanly.
- **Rollout / rollback:**
  - Rollout: Additive UI. No feature flag.
  - Rollback: Revert commit.
- **Documentation impact:** None: operator tool.
- **Post-build QA loop:**
  - Run `lp-design-qa` on `EditProductFilterSelector.client.tsx`.
  - Run `tools-ui-contrast-sweep` on modified sidebar component (show-all button states, product list items).
  - Run `tools-ui-breakpoint-sweep` at sm/md/lg breakpoints.
  - Auto-fix Critical/Major findings; re-run until none remain.
- **Notes / references:**
  - `EditProductFilterSelector.client.tsx` lines 32–66: existing `ProductCompactList` sub-component (cascade mode).
  - `catalogStyles.ts`: `BTN_SECONDARY_CLASS`.
  - `uploaderI18n.ts`: existing `editFilter*` key block.

---

### TASK-02: Replace onHeaderExtra portal with inline nav in CatalogConsole

- **Type:** IMPLEMENT
- **Deliverable:** Modified `CatalogConsole.client.tsx`; modified `UploaderHome.client.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-09)
- **Affects:**
  - `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx`
  - `apps/xa-uploader/src/app/UploaderHome.client.tsx`
  - `[readonly] apps/xa-uploader/src/lib/uploaderI18n.ts` (key `screenCatalog` already added by TASK-01)
  - `[readonly] apps/xa-uploader/src/app/UploaderShell.client.tsx` (no change needed)
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 90%
  - Implementation: 95% — All wiring fully read. `onHeaderExtra` useEffect (lines 151–170), `CatalogConsoleProps`, `UploaderHomeClient` state all understood. `currencyHeaderLabel` is already a translated string — the tab button renders it directly.
  - Approach: 90% — Inline two-button tab bar above `ConsoleBody` is the correct placement. `currencyHeaderLabel` is used directly (not re-translated). `BTN_SECONDARY_CLASS` / `BTN_ACCENT_OUTLINE_CLASS` for active/inactive states.
  - Impact: 90% — Two files affected. `UploaderShell.headerExtra` stays optional and unused. TypeScript clean.
  - Held-back test (Approach 90%): Same parallel-agent residual as TASK-01. Downward bias applied.
- **Acceptance:**
  - `CatalogConsoleProps` no longer contains `onHeaderExtra`.
  - The `useEffect` block (lines 151–170 of current file) that calls `onHeaderExtra(...)` is removed entirely.
  - An inline two-button tab bar renders above `ConsoleBody` inside the authenticated render, gated on `showCurrency`:
    - "Catalog" tab: label `{t("screenCatalog")}`; active style (`BTN_ACCENT_OUTLINE_CLASS`) when `screen === "catalog"`; inactive style (`BTN_SECONDARY_CLASS`) when `screen === "currency"`; `data-testid="console-tab-catalog"`; calls `openCatalogScreen`.
    - "Currency/Sync" tab: label `{currencyHeaderLabel}` (already a translated string — do NOT wrap in `t()`); active style when `screen === "currency"`; inactive style when `screen === "catalog"`; `data-testid="console-tab-currency"`; calls `openCurrencyScreen`.
  - `UploaderHomeClient` no longer declares `headerExtra` state (`const [headerExtra, setHeaderExtra]`) and no longer passes `onHeaderExtra` to `CatalogConsole`.
  - `screenCatalog` i18n key is already present from TASK-01.
  - **Expected user-observable behavior:**
    - [ ] When authenticated and `uploaderMode === "internal"`, two tab buttons appear inside the console body (not in the shell header).
    - [ ] Active tab is visually highlighted (accent border+text); inactive tab is muted.
    - [ ] Clicking "Catalog" switches to the product editor view.
    - [ ] Clicking "Currency" or "Sync" switches to the currency/sync panel.
    - [ ] The shell header never changes dynamically when switching screens.
    - [ ] When `uploaderMode !== "internal"`, no tab bar is shown.
- **Validation contract (TC-XX):**
  - TC-01: Authenticated, `uploaderMode === "internal"`, `screen === "catalog"` → inline tab bar renders with "Catalog" (active, `BTN_ACCENT_OUTLINE_CLASS`) and currency tab (inactive, `BTN_SECONDARY_CLASS`).
  - TC-02: Click currency tab → `openCurrencyScreen` called → `screen === "currency"` → `CurrencyScreen` renders → currency tab now active.
  - TC-03: Click "Catalog" tab → `openCatalogScreen` called → `screen === "catalog"` → product editor renders.
  - TC-04: Currency tab renders `{currencyHeaderLabel}` directly (a string, not a translation key).
  - TC-05: `onHeaderExtra` prop absent from `CatalogConsoleProps` — TypeScript: no error.
  - TC-06: `UploaderHomeClient` has no `headerExtra` state variable.
  - TC-07: `uploaderMode !== "internal"` → tab bar not rendered.
  - TC-08: i18n zh locale → "Catalog" tab shows "商品目录".
  - TC-09: Tab buttons have `data-testid="console-tab-catalog"` and `data-testid="console-tab-currency"`.
- **Execution plan:**
  - Red: Add `it.skip` stubs for TC-01 through TC-09 in a test file for `CatalogConsole` (CI only).
  - Green: Remove `onHeaderExtra` from `CatalogConsoleProps`. Delete the `useEffect` (lines 151–170). Add inline tab bar JSX above `<ConsoleBody>`, gated on `showCurrency`, using `{currencyHeaderLabel}` directly for the currency tab. Update `UploaderHomeClient`.
  - Refactor: If tab bar JSX > 25 lines, extract as `ConsoleTabBar` inline component.
- **Planning validation (required for M/L):**
  - Checks run: Full read of `CatalogConsole.client.tsx` (201 lines) — `currencyHeaderLabel` is `state.syncReadiness.mode === "local" ? t("screenCurrencyRates") : t("screenSync")` (already translated). `openCatalogScreen`/`openCurrencyScreen` are `useCallback` functions in scope. `UploaderHomeClient` (28 lines) — `headerExtra` state is the only connection.
  - Validation artifacts: `docs/plans/xa-uploader-nav-layer-fixes/fact-find.md`.
  - Unexpected findings: `t(currencyHeaderLabel)` would double-translate — fixed to render `{currencyHeaderLabel}` directly.
- **Scouts:** `UploaderShell.headerExtra` optional prop — remains in place with no TypeScript warnings when unused.
- **Edge Cases & Hardening:**
  - `showCurrency` is `false` — tab bar is not rendered, existing behavior preserved.
  - `currencyHeaderLabel` changes dynamically based on `syncReadiness.mode` — tab label updates correctly since it reads from the existing derived variable.
- **What would make this >=95%:** Parallel agent merge confirmed.
- **Rollout / rollback:**
  - Rollout: Inline UI change. No feature flag.
  - Rollback: Revert commit.
- **Documentation impact:** None.
- **Post-build QA loop:**
  - Run `lp-design-qa` on `CatalogConsole.client.tsx`.
  - Run `tools-ui-contrast-sweep` on inline tab bar (active/inactive states).
  - Run `tools-ui-breakpoint-sweep` at sm/md/lg breakpoints.
  - Auto-fix Critical/Major findings; re-run until none remain.
- **Notes / references:**
  - `CatalogConsole.client.tsx` lines 148–170: existing `showCurrency` and `onHeaderExtra` useEffect.
  - `catalogStyles.ts`: `BTN_SECONDARY_CLASS`, `BTN_ACCENT_OUTLINE_CLASS`.
  - `uploaderI18n.ts`: `screenCatalog` (from TASK-01), `screenCurrencyRates`, `screenSync` (existing).
  - Build evidence (2026-03-09):
    - `CatalogConsole.client.tsx` now owns its inline catalog/currency tab bar and no longer portals controls into the shell header.
    - `UploaderHome.client.tsx` no longer manages `headerExtra` state for the catalog console.
    - `CatalogConsole.test.tsx` covers inline tab rendering, switching, and non-internal suppression.

---

### TASK-03: Typecheck and lint gate

- **Type:** IMPLEMENT
- **Deliverable:** Clean typecheck + lint output for `xa-uploader`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-09)
- **Affects:** none (validation only)
- **Depends on:** TASK-01, TASK-02
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% — Standard gate.
  - Approach: 95% — `pnpm --filter xa-uploader typecheck && pnpm --filter xa-uploader lint`.
  - Impact: 95% — Passes or surfaces fixable errors.
- **Acceptance:**
  - `pnpm --filter xa-uploader typecheck` exits 0.
  - `pnpm --filter xa-uploader lint` exits 0.
- **Validation contract (TC-XX):**
  - TC-01: `pnpm --filter xa-uploader typecheck` exits 0 — no TypeScript errors.
  - TC-02: `pnpm --filter xa-uploader lint` exits 0 — no `ds/no-arbitrary-tailwind` or other violations.
- **Execution plan:**
  - Run `pnpm --filter xa-uploader typecheck`. Fix any errors.
  - Run `pnpm --filter xa-uploader lint`. Fix any violations.
  - Commit only after both pass.
- **Planning validation:** None: S-effort gate task.
- **Scouts:** None.
- **Edge Cases & Hardening:** If `ds/no-arbitrary-tailwind` fires — add `eslint-disable ds/no-arbitrary-tailwind -- XAUP-0001` comment.
- **What would make this >=95%:** Already at 95%.
- **Rollout / rollback:** None: gate task.
- **Documentation impact:** None.
  - Build evidence (2026-03-09):
    - `pnpm --filter @apps/xa-uploader typecheck` passed.
    - `pnpm --filter @apps/xa-uploader lint` passed.

---

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Add show-all browse mode + i18n keys | Yes | None | No |
| TASK-02: Replace onHeaderExtra with inline nav | Yes — depends on TASK-01 for `screenCatalog` key | None | No |
| TASK-03: Typecheck and lint gate | Yes — depends on TASK-01 and TASK-02 | None | No |

No Critical rehearsal findings. Sequential execution is required (TASK-01 before TASK-02) because both modify `uploaderI18n.ts`. TASK-03 correctly gates after both.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Merge conflict with IDEA-DISPATCH-20260306150000-0005 (also modifies same files) | Medium | Medium | Changes are functionally distinct (loading states vs nav); resolved via standard git merge after both branches complete independently — no worktrees per AGENTS.md |
| `handleReset` / `onNew()` called accidentally in show-all toggle | Low | Medium | TC-04 explicitly verifies `onNew()` NOT called; task spec prohibits `handleReset` reuse |
| `t(currencyHeaderLabel)` double-translation | Low | Low | Accepted criterion TC-04 in TASK-02 verifies `currencyHeaderLabel` is used directly as a string, not re-wrapped in `t()` |
| Tab bar overflow at narrow viewports (sm breakpoint) | Low | Low | Post-build QA loop (tools-ui-breakpoint-sweep) catches and fixes |
| Missing zh key degrades localization silently | Low | Low | `uploaderI18n.ts` falls back to English — no runtime error, but zh operator sees English labels until fixed; typecheck validates key presence if the type is strict |

## Observability

- Logging: None: pure client-side UI.
- Metrics: None: operator tool.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)

- [ ] `EditProductFilterSelector` renders a "Show all products" button that displays the full product list (from `props.products` directly) with brand+collection subtitles when clicked.
- [ ] "Back to filter" in show-all mode does NOT call `onNew()` and does NOT clear `criteria`.
- [ ] Product selection in show-all mode calls `onSelect(product)` and `setShowAll(false)`.
- [ ] `CatalogConsole` has no `onHeaderExtra` prop and no `useEffect` that calls it.
- [ ] An inline two-button tab bar appears inside `CatalogConsole` when authenticated and `uploaderMode === "internal"`.
- [ ] Currency tab label renders `{currencyHeaderLabel}` directly — not `t(currencyHeaderLabel)`.
- [ ] `UploaderHomeClient` has no `headerExtra` state.
- [ ] Shell header does not change dynamically when switching screens.
- [ ] `pnpm --filter xa-uploader typecheck` passes.
- [ ] `pnpm --filter xa-uploader lint` passes.
- [ ] Three new i18n keys in both `en` and `zh`: `editFilterShowAll`, `editFilterHideAll`, `screenCatalog`.
- [ ] All new interactive elements have `data-testid` attributes.
- [ ] Post-build QA loop (design-qa, contrast, breakpoint) passes with no Critical/Major issues.

## Decision Log

- 2026-03-06: Chose show-all toggle over free-text search. Evidence: catalog is small; `ProductCompactList` infrastructure exists; no debounce/locale complexity needed.
- 2026-03-06: `UploaderShell.headerExtra` prop retained (optional, harmless — removing adds no value).
- 2026-03-06: `showAll` renders from `props.products` directly, not `filterCatalogProducts` — `criteria` is preserved and independent. Resolves Round 1 critique state-contract contradiction.
- 2026-03-06: TASK-01 and TASK-02 must run sequentially (not parallel) — both modify `uploaderI18n.ts`. TASK-01 adds all three new keys.
- 2026-03-06: `currencyHeaderLabel` is already translated — tab button uses it as a plain string. Wrapping in `t()` would double-translate.
- 2026-03-09: Archived after TASK-02 landed and package validation passed.

## Overall-confidence Calculation

- TASK-01: confidence 90%, effort M (weight 2)
- TASK-02: confidence 90%, effort M (weight 2)
- TASK-03: confidence 95%, effort S (weight 1)
- Overall = (90×2 + 90×2 + 95×1) / (2+2+1) = (180+180+95)/5 = 455/5 = 91%
- Applied 3-point conservatism for parallel-agent merge residual: **Overall-confidence: 88%**
