---
Type: Plan
Status: Active
Domain: UI
Workstream: Engineering
Created: 2026-03-06
Last-reviewed: 2026-03-06
Last-updated: 2026-03-06
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-uploader-loading-skeleton
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 86%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# XA Uploader Loading Skeleton Plan

## Summary

The xa-uploader catalog console renders a bare text string while auth resolves and shows a potentially misleading "empty catalog" state while products hydrate after login or storefront switch. Operators on slow connections cannot distinguish loading from broken. This plan adds inline skeleton placeholder states to two components and a scoped hydration-tracking flag to the hook, covering both the auth-check phase and the catalog-hydration phase (both initial login and storefront changes). Scope is four files: `useCatalogConsole.client.ts`, `catalogStyles.ts`, `CatalogConsole.client.tsx`, and `EditProductFilterSelector.client.tsx`.

## Active tasks
- [ ] TASK-01: Add `isCatalogHydrating` state to `useCatalogConsole`
- [ ] TASK-02: Add `SKELETON_BLOCK_CLASS` constant to `catalogStyles.ts`
- [ ] TASK-03: Replace auth-check text with console-layout skeleton in `CatalogConsole`
- [ ] TASK-04: Add `isLoading` prop + sidebar skeleton to `EditProductFilterSelector`

## Goals
- Operators see a two-column layout ghost (sidebar + form panel) during auth resolution instead of bare text
- Operators see sidebar skeleton blocks during catalog hydration (post-auth and post-storefront-switch) instead of an empty/misleading state
- Genuine empty catalog ("no products saved yet") still shows the "New Product" button correctly after hydration completes
- No new CSS variables; only existing `gate-*` tokens and standard Tailwind utilities

## Non-goals
- Adding a spinner or progress bar
- Changing auth logic or session fetching behaviour
- Adding skeleton states to the sync or currency screens
- Importing the DS `Skeleton` atom (inline blocks preferred for XAUP-0001 convention)

## Constraints & Assumptions
- Constraints:
  - `bg-gate-border` does NOT exist as a `bg-*` background utility in `globals.css` — only `border-gate-border` exists; skeleton fill must use `bg-gate-surface border border-gate-border`
  - `motion-reduce:animate-none` is required alongside `animate-pulse` for accessibility parity with DS Skeleton
  - `isCatalogHydrating` flag must cover BOTH session-auth effect AND storefront-change effect but must NOT be set by save/delete/sync-triggered `loadCatalog()` calls (`catalogConsoleActions.ts:376`, `441`, `609`)
  - The `handleStorefrontChangeImpl` at `catalogConsoleActions.ts:167` calls `setProducts([])` synchronously; the `session/storefront` useEffect at `useCatalogConsole.client.ts:207–215` then calls `loadCatalog()` — this is the storefront re-hydration path the flag must cover
  - eslint-disable comment `// eslint-disable-next-line ds/no-arbitrary-tailwind -- XAUP-0001 operator-tool layout` is required for inline skeleton layout Tailwind
  - Parallel agent (IDEA-DISPATCH-20260306150000-0002) may have modified `CatalogConsole.client.tsx` and `EditProductFilterSelector.client.tsx`; merge required at integration
- Assumptions:
  - `animate-pulse` from `@import "tailwindcss"` renders correctly in the OpenNext/Cloudflare Workers build
  - The worktree is isolated; no concurrent write conflict during this build

## Inherited Outcome Contract

- **Why:** xa-uploader UI review found the console provides no visual loading feedback during auth resolution or product list hydration, leaving operators uncertain whether the tool is loading or broken — especially problematic on slow connections.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Operators see a layout-accurate skeleton placeholder during auth check and product list hydration instead of blank space or bare text. The tool looks "loading" rather than "broken or empty" while data resolves.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/xa-uploader-loading-skeleton/fact-find.md`
- Key findings used:
  - `session === null` in `CatalogConsole.client.tsx` line 172 is the auth-check gate — currently renders bare text
  - `products.length === 0` in `EditProductFilterSelector.client.tsx` line 155 fires on both loading and empty — needs disambiguation
  - `loadCatalog()` is reused by save/delete/sync (`catalogConsoleActions.ts:376,441,609`) — naive `isCatalogLoading` toggle would flash skeleton on every action
  - Storefront change clears products at `catalogConsoleActions.ts:167` → triggers the session/storefront `useEffect` → calls `loadCatalog()` again — flag must cover this path too
  - `bg-gate-border` does not exist as a `bg-*` utility; `bg-gate-surface border border-gate-border` is the correct skeleton fill pattern

## Proposed Approach
- Option A: Use DS `Skeleton` atom (`packages/design-system/src/atoms/Skeleton.tsx`) — compatible via `bg-muted`/`--color-muted` from base theme import, confirmed by live usage in 3 existing components
- Option B: Inline skeleton blocks using `gate-*` tokens + standard Tailwind animate — no DS import, stays within XAUP-0001 operator-tool convention
- Chosen approach: **Option B — inline skeleton blocks**. `CatalogConsole` and related files have no DS atom imports. Adding a DS atom for skeleton-only renders introduces a new import dependency pattern into the operator tool; inline blocks with `bg-gate-surface border border-gate-border rounded-md animate-pulse motion-reduce:animate-none` are minimal and self-contained. Option A remains a valid fallback if skeleton blocks become complex.

## Plan Gates
- Foundation Gate: Pass — `Deliverable-Type: code-change`, `Execution-Track: code`, `Primary-Execution-Skill: lp-do-build`, `Startup-Deliverable-Alias: none`; delivery-readiness 90%; test landscape documented
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add `isCatalogHydrating` state to `useCatalogConsole` | 85% | S | Pending | - | TASK-03, TASK-04 |
| TASK-02 | IMPLEMENT | Add `SKELETON_BLOCK_CLASS` to `catalogStyles.ts` | 90% | S | Pending | - | TASK-03, TASK-04 |
| TASK-03 | IMPLEMENT | Auth-check skeleton in `CatalogConsole` | 85% | S | Pending | TASK-01, TASK-02 | - |
| TASK-04 | IMPLEMENT | Sidebar skeleton + `isLoading` prop in `EditProductFilterSelector` | 85% | S | Pending | TASK-01, TASK-02 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | - | Independent; can run in parallel |
| 2 | TASK-03, TASK-04 | TASK-01, TASK-02 complete | Independent of each other; depend on both wave-1 tasks |

## Tasks

---

### TASK-01: Add `isCatalogHydrating` state to `useCatalogConsole`
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts`
- **Depends on:** -
- **Blocks:** TASK-03, TASK-04
- **Confidence:** 85%
  - Implementation: 85% — the session-auth effect (line 207–215) and the storefront-change re-hydration path (storefront changes → `handleStorefrontChangeImpl` clears products → same effect fires) are the two triggers; `loadCatalog()` callback is reused by save/delete/sync so a simple `isCatalogLoading` toggle would cause false positives; one-shot hydration flag requires care
  - Approach: 90% — `isCatalogHydrating` as a React state value set `true` in the session/storefront effect before `loadCatalog()` and `false` in both success and catch of that `loadCatalog()` call. Save/delete/sync action callers do not need to touch this state.
  - Impact: 85% — this is the prerequisite for TASK-03 and TASK-04; without it, TASK-04's `isLoading` prop cannot be meaningfully populated
- **Acceptance:**
  - `useCatalogConsole()` return value includes `isCatalogLoading: boolean`
  - `isCatalogLoading` is `true` when `session` transitions to `authenticated` and `loadCatalog` has not yet resolved
  - `isCatalogLoading` is `true` when `storefront` changes while authenticated and the subsequent `loadCatalog` has not yet resolved
  - `isCatalogLoading` is `false` once `loadCatalog` resolves (success or error) from either of those two hydration paths
  - Save, delete, and sync operations do NOT set `isCatalogLoading` to `true`
  - Expected user-observable behavior: sidebar skeleton appears when user first authenticates and catalog is loading; skeleton appears again when user switches storefront; skeleton does NOT appear after saving or deleting a product
- **Validation contract:**
  - TC-01: Session `null → authenticated` transition → `isCatalogLoading` goes `true` then `false` once catalog resolves
  - TC-02: Storefront change while authenticated → `isCatalogLoading` goes `true` then `false` once new catalog resolves
  - TC-03: Rapid back-to-back storefront changes → `isCatalogLoading` stays `true` while last request is in flight; clears only after last request completes (not after first request's `.finally()`)
  - TC-04: Save action (calls `loadCatalog`) → `isCatalogLoading` stays `false` throughout
  - TC-05: Catalog load error → `isCatalogLoading` returns to `false` (not stuck true)
- **Execution plan:**
  - Red: Add `const catalogHydrationCounterRef = React.useRef(0)` and `const [isCatalogHydrating, setIsCatalogHydrating] = React.useState(false)` to `useCatalogConsoleState`. The counter guards skeleton visibility correctness on rapid storefront changes: each hydration call increments the counter; only the call that holds the current counter value at completion clears the skeleton flag. Note: this counter does NOT prevent stale `setProducts()` writes — `loadCatalog()` still unconditionally writes product data on completion (pre-existing behaviour, out of scope for this plan). Rapid storefront switching was already data-unsafe before this change; the counter purely scopes skeleton state.
  - Green: In the session/storefront `useEffect` (lines 207–215), before calling `loadCatalog()`, increment the counter: `const requestId = ++catalogHydrationCounterRef.current; setIsCatalogHydrating(true);`. In the `.finally()` of that specific `loadCatalog()` call, only clear if this is still the latest request: `if (catalogHydrationCounterRef.current === requestId) setIsCatalogHydrating(false);`
  - Green: Add `isCatalogLoading: isCatalogHydrating` to the `useCatalogConsole` return object
  - Refactor: Confirm the save/delete/sync `loadCatalog` calls in `catalogConsoleActions.ts` do NOT reference `catalogHydrationCounterRef` or `setIsCatalogHydrating` (they won't — both are internal to `useCatalogConsoleState`)
- **Planning validation (required for M/L):**
  - None: S effort task
- **Consumer tracing:**
  - New value: `isCatalogLoading: boolean` exposed from `useCatalogConsole()` return
  - Consumers: TASK-03 (`CatalogConsole.client.tsx` accesses via `state.isCatalogLoading`) and TASK-04 (`EditProductFilterSelector` receives it as `isLoading` prop via `ConsoleBody`)
  - Save/delete/sync callers: `handleSaveImpl`, `handleDeleteImpl`, `handleSyncImpl` in `catalogConsoleActions.ts` each call `loadCatalog` but do not receive or call `setIsCatalogHydrating` — they only receive `loadCatalog` as a param, so this is safe
- **Scouts:** Verify `.finally()` is available (it is — standard Promise API); verify that the `session` useEffect dependency array at line 215 includes both `session` and `storefront` (it includes `loadCatalog` which depends on `storefront` via the `useCallback` dep array at line 166)
- **Edge Cases & Hardening:**
  - Logout: session returns to `{ authenticated: false }` — hydration effect bails early at `if (!session?.authenticated) return;` so `setIsCatalogHydrating(false)` is never set; this is fine since no skeleton is shown for unauthenticated state
  - Storefront change when `isCatalogHydrating` is already `true` (rapid switching): the flag flips `true` again before resolving — this is correct; the `.finally()` of the first call clears it, but the second call's `.finally()` sets it false at the end of the actual visible load
  - Catalog load error: `.catch()` / `.finally()` ensures `isCatalogHydrating` returns to `false` — skeleton clears, error feedback shown via existing `updateActionFeedback` path
- **What would make this >=90%:**
  - A unit test in `useCatalogConsole-domains.test.tsx` covering the `isCatalogLoading` flag transitions would raise testability and push Implementation to 90%
- **Rollout / rollback:**
  - Rollout: ships with TASK-03 and TASK-04 in same commit
  - Rollback: revert commit
- **Documentation impact:** None: internal hook state; no public API
- **Notes / references:**
  - `useCatalogConsole.client.ts` session/storefront effect: lines 207–215
  - `catalogConsoleActions.ts` loadCatalog reuse: lines 376 (save), 441 (delete), 609 (sync)
  - `handleStorefrontChangeImpl` product clear: line 167

---

### TASK-02: Add `SKELETON_BLOCK_CLASS` to `catalogStyles.ts`
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/xa-uploader/src/components/catalog/catalogStyles.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/xa-uploader/src/components/catalog/catalogStyles.ts`
- **Depends on:** -
- **Blocks:** TASK-03, TASK-04
- **Confidence:** 90%
  - Implementation: 90% — `catalogStyles.ts` is the established source of truth for all console style constants; adding one exported const is trivial; token availability verified
  - Approach: 90% — `bg-gate-surface border border-gate-border rounded-md animate-pulse motion-reduce:animate-none` uses only verified available utilities; `bg-gate-border` does NOT exist so border contrast pattern is the correct approach
  - Impact: 90% — single source of truth; TASK-03 and TASK-04 both import from here
- **Acceptance:**
  - `catalogStyles.ts` exports `SKELETON_BLOCK_CLASS` string constant
  - Constant value uses `bg-gate-surface`, `border`, `border-gate-border`, `rounded-md`, `animate-pulse`, and `motion-reduce:animate-none`
  - No new CSS variables added to `globals.css`
  - Expected user-observable behavior: N/A (style constant only; visual effect in TASK-03 and TASK-04)
- **Validation contract:**
  - TC-01: `SKELETON_BLOCK_CLASS` is importable from `catalogStyles.ts` → type-check passes
  - TC-02: All token classes (`bg-gate-surface`, `border-gate-border`) exist in `globals.css` → lint/build passes
- **Execution plan:**
  - Red: Confirm `bg-gate-surface` and `border-gate-border` both exist as `@utility` entries in `globals.css` (verified in fact-find)
  - Green: Add at end of `catalogStyles.ts`: `export const SKELETON_BLOCK_CLASS = "bg-gate-surface border border-gate-border rounded-md animate-pulse motion-reduce:animate-none";`
  - Refactor: None required
- **Planning validation (required for M/L):** None: S effort
- **Consumer tracing:**
  - New export: `SKELETON_BLOCK_CLASS` from `catalogStyles.ts`
  - Consumers: TASK-03 (`CatalogConsole.client.tsx`) and TASK-04 (`EditProductFilterSelector.client.tsx`)
- **Scouts:** None: constant value fully determined from evidence
- **Edge Cases & Hardening:** None: pure constant export
- **What would make this >=90%:** Already at 90%; >=95 would require a visual regression test confirming skeleton contrast ratio — not feasible without E2E tooling
- **Rollout / rollback:** Rollout: part of same commit as TASK-03/04. Rollback: revert commit
- **Documentation impact:** None: internal style constant
- **Notes / references:**
  - `globals.css` `@utility bg-gate-surface` line 74; `@utility border-gate-border` line 102
  - Pattern: `PANEL_CLASS`, `BTN_PRIMARY_CLASS` etc. in `catalogStyles.ts` as precedent

---

### TASK-03: Auth-check skeleton in `CatalogConsole`
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — the `session === null` branch at line 172–174 is the exact insertion point; the grid layout class `grid gap-6 sm:grid-cols-[240px_1fr]` at line 122 is what the skeleton must mirror; eslint-disable pattern is established
  - Approach: 85% — inline `<ConsoleSkeletonPlaceholder />` local function component within the file; mirrors the two-column layout; no new imports needed beyond `SKELETON_BLOCK_CLASS`
  - Impact: 85% — visible improvement: auth-check phase shows layout ghost instead of bare text; no functional regression risk
- **Acceptance:**
  - When `state.session === null`, the component renders a two-column skeleton grid (`grid gap-6 sm:grid-cols-[240px_1fr]`) with placeholder blocks in the sidebar column (3–4 stacked blocks of varying heights) and in the form panel column (4–5 rows of blocks)
  - Skeleton uses `SKELETON_BLOCK_CLASS` from `catalogStyles.ts`
  - eslint-disable comment `// eslint-disable-next-line ds/no-arbitrary-tailwind -- XAUP-0001 operator-tool layout` is present on the skeleton grid div
  - The bare visible text `{t("checkingConsoleAccess")}` is replaced by a `<span className="sr-only">` element containing the same text — it remains present for screen readers but is visually hidden; the skeleton communicates loading state visually for sighted users
  - Expected user-observable behavior: On page load, operators see a two-column layout ghost (sidebar column with 3–4 pulse-animated blocks, form panel column with 4–5 rows). Screen readers hear the existing "Checking console access" text (now hidden but SR-accessible via `sr-only`). The skeleton pulses until auth resolves, then transitions to login form or authenticated console.
  - Post-build QA loop: run `lp-design-qa` scoped to `CatalogConsole`, `tools-ui-contrast-sweep` on the skeleton render path, and `tools-ui-breakpoint-sweep` at mobile/tablet/desktop; log findings; auto-fix Critical/Major issues before marking complete
- **Validation contract:**
  - TC-01: Render `<CatalogConsole>` with `useCatalogConsole` mocked to return `session: null` → skeleton grid present in DOM; `sr-only` span contains `checkingConsoleAccess` text (visible muted text is absent); skeleton blocks present
  - TC-02: Mock transitions `session: null → { authenticated: false }` → skeleton replaced by `CatalogLoginForm`
  - TC-03: Skeleton grid has `sm:grid-cols-[240px_1fr]` class → correct two-column layout on sm+ viewports
  - TC-04: Skeleton blocks have `animate-pulse` and `motion-reduce:animate-none` classes
- **Execution plan:**
  - Red: Remove the visible text from `<div className="text-sm text-gate-muted">{t("checkingConsoleAccess")}</div>` at line 173
  - Green: Add `import { SKELETON_BLOCK_CLASS } from "./catalogStyles";` (or add to existing import)
  - Green: Define a local `function ConsoleSkeletonPlaceholder({ srText }: { srText: string })` (above `CatalogConsole` export) that renders: (a) a `<span className="sr-only">{srText}</span>` as the first child for screen reader accessibility, followed by (b) the two-column skeleton grid with blocks
  - Green: Replace the `session === null` branch return with `return <ConsoleSkeletonPlaceholder srText={t("checkingConsoleAccess")} />;`
  - Refactor: Ensure `ConsoleSkeletonPlaceholder` uses `SKELETON_BLOCK_CLASS` throughout (no inline animated classes)
- **Planning validation (required for M/L):** None: S effort
- **Consumer tracing:**
  - `state.isCatalogLoading` consumed in TASK-04 (not here); this task only reads `state.session`
  - `SKELETON_BLOCK_CLASS` imported from `catalogStyles.ts` (TASK-02)
  - No new exports from this file
- **Scouts:** Confirm `SKELETON_BLOCK_CLASS` import resolves correctly (same directory); `checkingConsoleAccess` i18n key is preserved as `sr-only` text — verify the key exists in the locale files (`uploaderI18n` context) before relying on it
- **Edge Cases & Hardening:**
  - Accessibility: the `checkingConsoleAccess` translated text is preserved as a `<span className="sr-only">` inside `ConsoleSkeletonPlaceholder` — screen readers receive the loading cue; sighted operators see the skeleton; no regression from current state
  - Mobile (< sm): skeleton renders as single column (grid collapses) — acceptable for this tool
  - Parallel agent conflict: TASK-03 modifies the `session === null` branch at line 172–174 which is in the top-level `CatalogConsole` export; parallel agent changes target the `ConsoleBody` function (authenticated state); merge conflict is unlikely but possible — resolve at integration
- **What would make this >=90%:** A render-level RTL test for the `session === null` branch added to `__tests__/`
- **Rollout / rollback:** Rollout: same commit as TASK-01, TASK-02, TASK-04. Rollback: revert commit
- **Documentation impact:** None: visual-only change to operator tool
- **Notes / references:**
  - `CatalogConsole.client.tsx` session gate: line 172–174
  - Layout class: line 122 `grid gap-6 sm:grid-cols-[240px_1fr]`
  - eslint-disable precedent: line 121

---

### TASK-04: Sidebar skeleton + `isLoading` prop in `EditProductFilterSelector`
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/xa-uploader/src/components/catalog/EditProductFilterSelector.client.tsx`, `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/xa-uploader/src/components/catalog/EditProductFilterSelector.client.tsx`, `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — `EditProductFilterSelector` receives `products`, `onSelect`, `onNew`; adding optional `isLoading?: boolean` prop is a small, backwards-compatible addition; call site in `ConsoleBody` passes `state.isCatalogLoading`
  - Approach: 85% — skeleton renders in `EditProductFilterSelector` when `isLoading === true`, before the `products.length === 0` empty-state check; genuine empty catalog still shows correctly once loading completes
  - Impact: 85% — removes the ambiguity between "loading" and "empty catalog"; sidebar no longer shows a misleading empty state during catalog hydration
- **Acceptance:**
  - `EditProductFilterSelector` prop type includes `isLoading?: boolean` (optional, defaults to `false`)
  - When `isLoading === true`, the component renders a sidebar skeleton (3–4 stacked blocks using `SKELETON_BLOCK_CLASS`) instead of any filter UI or empty-state message
  - When `isLoading === false` and `products.length === 0`, the existing "New Product" button + empty text still renders correctly
  - When `isLoading === false` and `products.length > 0`, existing filter UI renders correctly
  - `ConsoleBody` in `CatalogConsole.client.tsx` passes `isLoading={state.isCatalogLoading}` to `EditProductFilterSelector`
  - Expected user-observable behavior: After logging in, the sidebar shows 3–4 pulsing placeholder blocks while the catalog loads. Once loading completes, if there are products the filter selectors appear; if the catalog is genuinely empty the "New Product" button appears. Same behaviour on storefront switch. No skeleton appears after saving or deleting a product.
  - Post-build QA loop: run `lp-design-qa` scoped to `EditProductFilterSelector`, `tools-ui-contrast-sweep` on skeleton render, `tools-ui-breakpoint-sweep` at relevant viewports; auto-fix Critical/Major issues before marking complete
- **Validation contract:**
  - TC-01: `isLoading === true`, any `products` value → skeleton blocks rendered, no filter UI, no empty-state text
  - TC-02: `isLoading === false`, `products.length === 0` → "New Product" button + `editFilterNoProducts` text rendered (existing behaviour preserved)
  - TC-03: `isLoading === false`, `products.length > 0` → brand select and filter UI rendered (existing behaviour preserved)
  - TC-04: `ConsoleBody` renders `EditProductFilterSelector` with `isLoading={state.isCatalogLoading}` prop
  - TC-05: `isLoading` prop omitted (existing test callers) → component behaves as before (defaults to `false`)
- **Execution plan:**
  - Red: Add `isLoading?: boolean` to `EditProductFilterSelectorProps` type
  - Green: In `EditProductFilterSelector` function body, add early return before the `products.length === 0` check: `if (isLoading) return <SidebarSkeletonPlaceholder />;` (local function component using `SKELETON_BLOCK_CLASS`)
  - Green: Update `ConsoleBody` in `CatalogConsole.client.tsx` to pass `isLoading={state.isCatalogLoading}` to `EditProductFilterSelector`
  - Refactor: Ensure `SidebarSkeletonPlaceholder` uses only `SKELETON_BLOCK_CLASS` and appropriate height/spacing utilities with eslint-disable comment
- **Planning validation (required for M/L):** None: S effort
- **Consumer tracing:**
  - New prop: `isLoading?: boolean` on `EditProductFilterSelector`
  - Only call site: `ConsoleBody` in `CatalogConsole.client.tsx` (line 123–127) — updated in this task to pass `isLoading={state.isCatalogLoading}`
  - `state.isCatalogLoading` sourced from TASK-01
  - `SKELETON_BLOCK_CLASS` imported from `catalogStyles.ts` (TASK-02)
- **Scouts:** Verify no other call site for `EditProductFilterSelector` exists outside `CatalogConsole.client.tsx` (confirmed: only used in `ConsoleBody`)
- **Edge Cases & Hardening:**
  - `isLoading` defaults to `false` — existing callers (including tests) are unaffected
  - Rapid storefront switch (skeleton visibility): each call increments `catalogHydrationCounterRef.current`; only the `.finally()` holding the current counter value clears `isCatalogHydrating`; stale `.finally()` calls are no-ops for skeleton state — skeleton stays visible until the last request resolves. Note: stale `setProducts()` writes from earlier requests are NOT prevented by this counter — this is a pre-existing data race unrelated to the skeleton feature and is explicitly out of scope for this plan.
  - Parallel agent conflict: `ConsoleBody` and `EditProductFilterSelector` are both touched by parallel agent; merge conflict likely in these files — resolve at integration (changes are non-overlapping in function)
- **What would make this >=90%:** Render-level RTL test covering TC-01 and TC-02 in `__tests__/`
- **Rollout / rollback:** Rollout: same commit as TASK-01, TASK-02, TASK-03. Rollback: revert commit
- **Documentation impact:** None: operator tool; no public API
- **Notes / references:**
  - `EditProductFilterSelector.client.tsx` prop interface: line 26–30; empty-state: line 155–168
  - `ConsoleBody` call site: `CatalogConsole.client.tsx` line 123–127
  - `state.isCatalogLoading` exposed from TASK-01

---

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Add `isCatalogHydrating` state | Yes — no dependencies | None: self-contained hook addition; `loadCatalog` reuse pattern confirmed safe (save/delete/sync callers do not receive `setIsCatalogHydrating`) | No |
| TASK-02: Add `SKELETON_BLOCK_CLASS` | Yes — no dependencies | None: constant export; tokens verified present in `globals.css` | No |
| TASK-03: Auth-check skeleton | Yes — TASK-01 and TASK-02 complete | Minor: `checkingConsoleAccess` i18n key is preserved as `sr-only` text (not removed); verify key exists in locale files | No (scout updated in TASK-03) |
| TASK-04: Sidebar skeleton + `isLoading` prop | Yes — TASK-01 and TASK-02 complete | Minor: parallel agent conflict risk in `CatalogConsole.client.tsx` and `EditProductFilterSelector.client.tsx` | No (noted in constraints; merge at integration) |

No Critical rehearsal findings. Plan proceeds to Phase 8 persist and Phase 9 critique.

## Risks & Mitigations
- Merge conflict with parallel agent (IDEA-DISPATCH-20260306150000-0002): High likelihood — changes in same files. Mitigation: TASK-03 modifies `session === null` branch (top of `CatalogConsole`); parallel agent targets `ConsoleBody` (authenticated section). TASK-04 modifies `EditProductFilterSelector` prop interface + early-return + `ConsoleBody` caller. Merge at integration point.
- `animate-pulse` absent in Cloudflare Worker build: Low likelihood. Mitigation: standard Tailwind utility included via `@import "tailwindcss"`.
- `isCatalogHydrating` flag stuck `true` on catalog load error: Low likelihood. Mitigation: flag cleared in `.finally()` / both success and catch paths — not dependent on happy-path-only resolution.
- Skeleton visible indefinitely if `loadCatalog` throws and `.finally()` not used: Low likelihood — mitigated by using `.finally()` in execution plan for TASK-01.

## Observability
- Logging: None required (visual-only change)
- Metrics: None required
- Alerts/Dashboards: None required

## Acceptance Criteria (overall)
- [ ] Auth-check phase shows two-column skeleton grid when `session === null`; `checkingConsoleAccess` text preserved as `sr-only` for screen readers
- [ ] Sidebar shows skeleton blocks when authenticated and catalog is hydrating (post-login and post-storefront-switch)
- [ ] Skeleton does NOT appear during save, delete, or sync operations
- [ ] Genuine empty catalog ("no products") shows "New Product" button correctly after hydration completes
- [ ] All skeleton blocks use `SKELETON_BLOCK_CLASS` from `catalogStyles.ts`
- [ ] `motion-reduce:animate-none` present on all skeleton animation classes
- [ ] eslint-disable `XAUP-0001 operator-tool layout` comment present on skeleton layout divs
- [ ] TypeScript typecheck passes (`pnpm --filter xa-uploader typecheck`)
- [ ] Lint passes (`pnpm --filter xa-uploader lint`)

## Decision Log
- 2026-03-06: Chose inline skeleton blocks (Option B) over DS `Skeleton` atom (Option A). Rationale: no DS atom imports in target files; XAUP-0001 operator-tool convention; `bg-muted` is technically available but inline gate-token blocks are simpler and self-contained.
- 2026-03-06: `isCatalogHydrating` flag scoped to session-auth AND storefront-change effects only — not all `loadCatalog()` calls — because save/delete/sync also call `loadCatalog` and must not trigger skeleton.
- 2026-03-06: `checkingConsoleAccess` i18n text retained as `<span className="sr-only">` inside `ConsoleSkeletonPlaceholder` — preserves SR loading cue while removing visible text in favour of skeleton.

## Overall-confidence Calculation
- TASK-01: 85% × S(1) = 85
- TASK-02: 90% × S(1) = 90
- TASK-03: 85% × S(1) = 85
- TASK-04: 85% × S(1) = 85
- Total weight: 4; Weighted sum: 345; Overall-confidence: 345/4 = **86%**
