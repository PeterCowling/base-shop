---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-06
Last-updated: 2026-03-06
Feature-Slug: xa-uploader-loading-skeleton
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/xa-uploader-loading-skeleton/plan.md
Trigger-Why: xa-uploader UI review found the console provides no visual loading feedback during auth resolution or product list hydration, leaving operators uncertain whether the tool is loading or broken — especially problematic on slow connections for an internal operations tool.
Trigger-Intended-Outcome: type: operational | statement: Add skeleton/placeholder states for the auth-check phase in CatalogConsole and product list hydration in EditProductFilterSelector so operators get clear visual feedback that the tool is loading, not broken. | source: operator
---

# XA Uploader Loading Skeleton Fact-Find Brief

## Scope

### Summary
The xa-uploader catalog console renders a plain text string ("Checking access...") while the auth session resolves, and shows nothing (or an empty sidebar) while the product list loads after auth. Operators on slow connections cannot distinguish "loading" from "broken". This brief covers adding skeleton placeholder states for both gaps.

### Goals
- Replace the bare text auth-check placeholder in `CatalogConsole` with a structured skeleton that mirrors the console layout (sidebar + form panel)
- Replace the empty/missing state in `EditProductFilterSelector` when products are loading after initial authentication with a skeleton that looks like the filter sidebar
- Use only the existing `gate-*` token system — no new CSS variables
- Keep changes within the two component files, `catalogStyles.ts`, and `useCatalogConsole.client.ts` (for an initial-load-only flag); the `useCatalogConsole` hook change is a required part of the scope

### Non-goals
- Adding a loading spinner or progress bar
- Changing auth logic or session fetching behaviour
- Adding skeleton states to the sync/currency screens

### Constraints & Assumptions
- xa-uploader uses the `gate-*` custom token system (defined in `globals.css`); the DS `Skeleton` component uses `bg-muted animate-pulse` which resolves via `--color-muted` from the base theme tokens imported in `globals.css` — other xa-uploader components (`CatalogSyncPanel`, `CurrencyRatesPanel`, `CatalogProductForm`) already use `bg-muted` successfully, so the DS `Skeleton` component is compatible (confirmed by live usage)
- `animate-pulse` from Tailwind base is available via `@import "tailwindcss"` in `globals.css`
- `globals.css` already defines `animate-pulse-slow` as a custom keyframe
- The `bg-gate-surface` token (`hsl(0 0% 96%)`) is the same lightness as `PANEL_CLASS` — any skeleton blocks rendered inside a panel should use `bg-gate-border` (more contrast) rather than `bg-gate-surface` to remain visually distinct
- The console layout is a `grid gap-6 sm:grid-cols-[240px_1fr]` (sidebar + form panel); skeleton must mirror this
- Distinguishing "catalog loading" from "genuinely empty catalog" requires a `isCatalogHydrating` flag in `useCatalogConsole`. The flag must be set `true` when session or storefront changes trigger a `loadCatalog` call (the two user-visible "products are clearing" scenarios), and `false` when that specific load resolves. It must NOT toggle on save/delete/sync-triggered `loadCatalog` calls (`catalogConsoleActions.ts:376`, `:441`, `:609`) — those do not clear the sidebar. The storefront-change path also clears `products` before the `storefront` effect reruns (`catalogConsoleActions.ts:140–175`; `useCatalogConsole.client.ts:207–215`), so "initial auth load only" is too narrow — the flag should cover storefront switches too
- `bg-gate-border` is NOT defined as a `bg-*` background utility in `globals.css` — only `border-gate-border` exists. Skeleton blocks must use `bg-gate-surface border border-gate-border rounded-md animate-pulse motion-reduce:animate-none` — the `border` provides visual contrast; `motion-reduce:animate-none` is required to match the DS Skeleton's accessibility behaviour
- `CatalogConsole` and `EditProductFilterSelector` are currently being touched by a parallel agent (IDEA-DISPATCH-20260306150000-0002 — sidebar/nav work); changes will need to be merged

## Outcome Contract

- **Why:** xa-uploader UI review found the console provides no visual loading feedback during auth resolution or product list hydration, leaving operators uncertain whether the tool is loading or broken — especially problematic on slow connections.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Operators see a layout-accurate skeleton placeholder during auth check and product list hydration instead of blank space or bare text. The tool looks "loading" rather than "broken or empty" while data resolves.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points
- `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx` — top-level console component; root session gate
- `apps/xa-uploader/src/components/catalog/EditProductFilterSelector.client.tsx` — sidebar filter component; empty-state and hydrated-state rendering

### Key Modules / Files
- `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx` — **Auth-check gap (line 172–174):** `if (state.session === null)` renders `<div className="text-sm text-gate-muted">{t("checkingConsoleAccess")}</div>`. No skeleton, no layout structure.
- `apps/xa-uploader/src/components/catalog/EditProductFilterSelector.client.tsx` — **Empty-state gap (lines 155–168):** `if (products.length === 0)` renders a "New Product" button + muted text. This fires on both initial load (products not yet hydrated) and genuine empty catalog. There is currently no distinction between the two cases.
- `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts` — **Session type:** `session: SessionState | null` where `null` = auth check in flight; `{ authenticated: false }` = unauthenticated; `{ authenticated: true }` = authenticated. Session is populated by a `useEffect` → `loadSession()` → `fetch("/api/uploader/session")`. Products are only loaded *after* `session?.authenticated` is truthy (line 208).
- `apps/xa-uploader/src/components/catalog/catalogStyles.ts` — style constants for the console; no skeleton-related constants currently; `PANEL_CLASS` = `rounded-xl border border-gate-border bg-gate-surface p-6 shadow-elevation-2`; `FIELD_LABEL_CLASS`, `SELECT_CLASS` are the relevant sidebar patterns.
- `apps/xa-uploader/src/app/globals.css` — defines all `gate-*` CSS custom properties and `@utility` classes; `animate-pulse-slow` defined here; imports `@themes/base/tokens.css` which provides `--color-muted` (resolves `bg-muted`).
- `packages/design-system/src/atoms/Skeleton.tsx` — DS Skeleton uses `bg-muted animate-pulse`; `bg-muted` **is usable** in xa-uploader — `CatalogSyncPanel.client.tsx` (line 170), `CurrencyRatesPanel.client.tsx` (line 224), and `CatalogProductForm.client.tsx` (line 347) all use `bg-muted` without issue. DS Skeleton import is viable as an option, though inline skeleton blocks with `gate-*` tokens are preferred for consistency with the XAUP-0001 operator-tool convention.

### Patterns & Conventions Observed
- All style constants are extracted to `catalogStyles.ts` — new skeleton block classes should follow this pattern
- The console uses `// eslint-disable-next-line ds/no-arbitrary-tailwind -- XAUP-0001 operator-tool layout` for layout-level inline Tailwind that bypasses the DS lint rule; skeleton layout will need the same escape
- `animate-pulse-slow` (3s ease-in-out, 0%/100% opacity 1, 50% opacity 0.4) is already used in `CatalogProductForm.client.tsx` for the autosave status dot; standard `animate-pulse` is also available
- `bg-gate-surface` is the natural "elevated surface" token — appropriate as the skeleton block fill
- `gate-border` (hsl 0 0% 10% / 0.22) provides sufficient contrast against `gate-bg` (white) for skeleton block outlines
- The existing empty-state in `EditProductFilterSelector` conflates "loading" with "no products yet saved" — planning must distinguish these two states

### Data & Contracts
- Types/schemas/events:
  - `SessionState = { authenticated: boolean }` — `null` = check in flight
  - `products: CatalogProductDraftInput[]` — empty array on both "loading" and "genuinely empty catalog"
  - `useCatalogConsole` returns `session`, `products` — both needed for gating skeleton vs real state
- API/contracts:
  - `/api/uploader/session` → sets `session` (null → value)
  - `/api/catalog/products` → sets `products` ([] → filled) — only called when `session.authenticated`

### Dependency & Impact Map
- Upstream dependencies:
  - `useCatalogConsole.client.ts` — requires a `isCatalogHydrating` boolean state; set `true` from the session-auth effect and the storefront-change effect (both clear products and trigger a fresh fetch); set `false` in the success/catch of those effects' `loadCatalog` calls only; do NOT toggle from save/delete/sync-triggered `loadCatalog` calls; expose as `isCatalogLoading` via `useCatalogConsole` return value
  - `catalogConsoleActions.ts` — read-only evidence; confirms `loadCatalog` is reused on save (line 376), delete (line 441), and sync (line 609); confirms storefront-change clears products (lines 140–175); no changes needed here
  - `catalogStyles.ts` — may receive a new `SKELETON_BLOCK_CLASS` constant
  - `globals.css` — no changes needed (base tokens + standard animate-pulse already available)
- Downstream dependents:
  - `CatalogConsole.client.tsx` — receives new `session === null` branch
  - `EditProductFilterSelector.client.tsx` — receives new loading distinction
- Likely blast radius:
  - Small — `useCatalogConsole` gets a new `isCatalogLoading` state flag (~3 lines); `CatalogConsole` gets a new `session === null` rendering branch; `EditProductFilterSelector` gets a new `isLoading` prop with a skeleton branch; one call site to update in `ConsoleBody`
  - No API changes, no auth logic changes, no schema changes

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest + React Testing Library
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/xa-uploader/jest.config.cjs`
- CI integration: tests run in CI (not locally)

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| CatalogConsole | No direct render test | — | Session gate paths (null/unauth/auth) are NOT directly tested as a component |
| EditProductFilterSelector | No direct render test | — | Filter logic tested via `catalogEditFilter.test.ts` (unit); no component-level render test |
| useCatalogConsole | Domain/integration | `useCatalogConsole-domains.test.tsx` | Tests handler logic; does not test null session rendering |
| CatalogProductForm | Render test | `CatalogProductForm.test.tsx` | Smoke test only |

#### Coverage Gaps
- No render-level tests for the `session === null` branch in `CatalogConsole`
- No render-level test for the `products.length === 0` branch in `EditProductFilterSelector`
- Skeleton placeholders are visual UI — snapshot or `data-testid` tests would be appropriate but are non-blocking given CI policy

#### Testability Assessment
- Easy to test: Render `CatalogConsole` with mocked `useCatalogConsole` returning `session: null` — assert skeleton structure present
- Hard to test: Timing of skeleton → content transition (requires async mocking)
- Test seams needed: `useCatalogConsole` is a hook, not injected — test would mock the hook module

### Recent Git History (Targeted)
- `apps/xa-uploader/src/components/catalog/*` — recent commits:
  - `d5900d1dc` — "unified catalog screen — remove tabs, always-visible sidebar+editor" — introduced the current `grid gap-6 sm:grid-cols-[240px_1fr]` layout that the skeleton must mirror
  - `0d23d6f064` — "autosave queue flush + conflict retry" — no UI surface changes

## Questions

### Resolved

- **Q: Should the DS `Skeleton` component be used or should skeleton blocks be built inline?**
  - A: Either is viable — `bg-muted` is available in xa-uploader via the base theme import. However, inline skeleton blocks using `gate-*` tokens and Tailwind animate-pulse are preferred because they stay within the XAUP-0001 operator-tool convention and avoid importing a DS atom into a file that otherwise has no DS atom imports. The DS `Skeleton` import path is a legitimate fallback if inline blocks become unwieldy.
  - Evidence: `CatalogSyncPanel.client.tsx` line 170; `CurrencyRatesPanel.client.tsx` line 224; `CatalogProductForm.client.tsx` line 347 (all use `bg-muted`); `globals.css` line 3 (imports base tokens providing `--color-muted`).

- **Q: Should the loading state and the "genuinely empty catalog" state be distinguished in EditProductFilterSelector?**
  - A: Yes, but the strategy requires care. `products.length === 0` fires on (a) initial load before `loadCatalog` resolves, (b) genuine empty catalog, (c) after a catalog-load failure, and (d) after a storefront switch (which clears products before re-fetching). A simple flag toggled around every `loadCatalog()` call is incorrect: `loadCatalog` is reused after save (`catalogConsoleActions.ts:376`), delete (`:441`), and sync (`:609`) — toggling on all calls would flash the skeleton on every action. The correct approach is a `isCatalogHydrating` flag set `true` from the session-auth effect and the storefront-change effect (the two cases that clear products before a fresh fetch), and set `false` when those fetches resolve. Action-triggered reloads do not touch this flag. "Initial auth only" is too narrow because storefront switching also clears the sidebar.
  - Evidence: `useCatalogConsole.client.ts` lines 156–165 and 207–215 (session+storefront effects); `catalogConsoleActions.ts` lines 140–175 (storefront change), 376, 441, 609 (action reloads); `EditProductFilterSelector.client.tsx` lines 155–168.

- **Q: What structure should the auth-check skeleton mirror?**
  - A: The console renders a `grid gap-6 sm:grid-cols-[240px_1fr]` layout when authenticated. The auth-check skeleton should render an equivalent two-column ghost structure: a 240px sidebar ghost (3–4 stacked blocks) and a form panel ghost (wider area with 3–4 rows of blocks). This communicates the tool is loading, not empty.
  - Evidence: `CatalogConsole.client.tsx` line 122.

- **Q: Is `animate-pulse` available without adding it to tailwind config?**
  - A: Yes. `apps/xa-uploader/src/app/globals.css` imports `tailwindcss` via `@import "tailwindcss"` which includes the base `animate-pulse` utility. `animate-pulse-slow` is also available as a local custom keyframe.
  - Evidence: `globals.css` line 4 (`@import "tailwindcss"`), line 122 (`@utility animate-pulse-slow`).

### Open (Operator Input Required)
None — all decisions are resolvable from code evidence and design constraints.

## Confidence Inputs
- Implementation: 87% — entry points, state shapes, and token system fully mapped; one-shot `isInitialCatalogLoading` pattern correctly identified; `loadCatalog()` reuse in save/delete/sync confirmed as a key implementation constraint; `bg-gate-border` utility absence confirmed
- Approach: 86% — one-shot initial-load flag correctly scopes skeleton to the narrow auth→first-catalog window; inline gate-token skeleton blocks with `bg-gate-surface border border-gate-border` viable; DS Skeleton is a valid fallback
- Impact: 85% — UX improvement is clear; no risk of regression in auth or product loading logic
- Delivery-Readiness: 90% — no external deps; no schema changes; file-level scope
- Testability: 65% — visual skeleton is testable via RTL but no existing component-level tests for these paths; CI-only test policy means we won't verify locally

What would raise Implementation to >=95: Confirm `animate-pulse` renders correctly in the Cloudflare Workers build (no known issue but untested in this app).
What would raise Testability to >=80: Add at least one RTL render test for `session === null` branch in `CatalogConsole`.

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Merge conflict with parallel agent (IDEA-DISPATCH-20260306150000-0002) touching same files | High | Medium | Changes are additive branches; skeleton is in `session === null` branch (auth-check) which is before the sidebar nav changes; resolve at merge |
| `animate-pulse` CSS absent from Cloudflare Worker build | Low | Low | Standard Tailwind utility included via `@import "tailwindcss"`; no known Workers build exclusion |
| `isLoading` prop addition breaks existing callers of `EditProductFilterSelector` | Low | Low | Only one call site in `ConsoleBody`; update simultaneously; prop is optional with a `false` default |
| `isInitialCatalogLoading` flag accidentally resets on post-action `loadCatalog` calls | Low | High | Use a ref-based one-shot flag (`hasInitialCatalogLoadedRef`) that transitions `false → true` exactly once when the first authenticated load resolves; subsequent `loadCatalog` calls from save/delete/sync ignore the flag entirely |
| Skeleton layout diverges from real layout after future layout changes | Low | Low | Skeleton is intentionally approximate; use relative sizing not pixel-exact |

## Planning Constraints & Notes
- Must-follow patterns:
  - Use `// eslint-disable-next-line ds/no-arbitrary-tailwind -- XAUP-0001 operator-tool layout` for any inline Tailwind in skeleton blocks
  - New style constants go in `catalogStyles.ts`
  - Skeleton blocks use `bg-gate-surface border border-gate-border rounded-md` — `bg-gate-border` does NOT exist as a `bg-*` utility in `globals.css`; border provides contrast instead
  - `animate-pulse` (standard Tailwind) is preferred over `animate-pulse-slow` for skeleton feel (faster = more clearly "loading")
  - `isCatalogHydrating` flag must be set from session-auth AND storefront-change effects (both clear products), but must NOT be toggled by save/delete/sync action reloads; storefront-change clears products at `catalogConsoleActions.ts:140–175`
  - Skeleton blocks use `motion-reduce:animate-none` in addition to `animate-pulse` — required for accessibility, matching DS Skeleton behaviour
- Rollout/rollback expectations:
  - Pure rendering change; rollback = revert commit
- Observability expectations:
  - None required; visual-only change

## Suggested Task Seeds (Non-binding)
1. Add `isCatalogHydrating` boolean state to `useCatalogConsoleState` in `useCatalogConsole.client.ts`; set `true` from both the session-auth effect AND the storefront-change effect (both clear products); set `false` in success/catch of those effects' `loadCatalog` calls; do NOT reset from save/delete/sync action reloads; expose as `isCatalogLoading` via `useCatalogConsole` return
2. Add `SKELETON_BLOCK_CLASS` constant to `catalogStyles.ts` using `bg-gate-surface border border-gate-border rounded-md animate-pulse motion-reduce:animate-none` — `bg-gate-border` does NOT exist as a `bg-*` utility; use `bg-gate-surface` with `border border-gate-border` for contrast; `motion-reduce:animate-none` is required for accessibility
3. Replace `session === null` text in `CatalogConsole` with `<ConsoleSkeletonPlaceholder />` inline component mirroring the `grid gap-6 sm:grid-cols-[240px_1fr]` two-column layout
4. Add `isLoading?: boolean` prop to `EditProductFilterSelector`; render sidebar skeleton blocks when `isLoading === true` (before the `products.length === 0` empty-state check)
5. Update `ConsoleBody` caller in `CatalogConsole` to pass `isLoading={state.isCatalogLoading}` to `EditProductFilterSelector`

## Execution Routing Packet
- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package: skeleton renders in `session === null` state; skeleton renders in sidebar while `isCatalogLoading === true` after authentication; genuine empty catalog ("no products yet saved") still shows the "New Product" button once `isCatalogLoading` resolves to `false`
- Post-delivery measurement plan: visual QA in staging; no metric tracking required

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| `CatalogConsole` auth-check branch (`session === null`) | Yes | None | No |
| `EditProductFilterSelector` empty-state ambiguity | Yes | Loading vs empty distinction requires `isCatalogLoading` flag in hook — `products.length === 0` alone is not safe | Resolved: `isCatalogLoading` state in `useCatalogConsole` |
| `catalogStyles.ts` token/constant source of truth | Yes | None | No |
| DS Skeleton compatibility | Yes | Initial claim that `bg-muted` was absent was incorrect — `bg-muted` works via base theme import; live usage confirmed in 3 components | Resolved: DS Skeleton viable; inline gate-token blocks preferred for convention consistency |
| `loadCatalog()` reuse in save/delete/sync actions | Yes | `isCatalogLoading` naive toggle would flash skeleton on every save/delete/sync action | Resolved: one-shot `isInitialCatalogLoading` pattern that only clears once, ignoring action-triggered reloads |
| `bg-gate-border` skeleton fill token | Yes | `bg-gate-border` does not exist as a `bg-*` utility — only `border-gate-border` exists | Resolved: use `bg-gate-surface border border-gate-border` for contrast |
| Token system (`gate-*` vs DS tokens) | Yes | None | No |
| Test landscape | Yes | No component-level render tests for target paths | No (advisory) |
| Parallel agent conflict (sidebar/nav) | Yes (identified) | File-level merge conflict risk | No (merge at integration) |

## Scope Signal
- **Signal: right-sized**
- **Rationale:** Two targeted rendering branches in two files. No state machine changes. No new API. No new CSS variables. Parallel agent risk is bounded to additive changes in the same files, resolvable at merge. Investigation covered all material dependencies.

## Evidence Gap Review

### Gaps Addressed
1. Citation Integrity: All claims cite specific file paths and line numbers. Initial incorrect `bg-muted` absence claim corrected via live usage evidence. `bg-gate-border` utility absence confirmed (only `border-gate-border` exists). `loadCatalog()` reuse in save/delete/sync confirmed via `catalogConsoleActions.ts` lines 376, 441, 609.
2. Loading signal accuracy: `products.length === 0` is not safe; one-shot `isInitialCatalogLoading` pattern required; must not toggle on every `loadCatalog()` call.
3. Boundary Coverage: Auth flow, initial catalog load, and action-triggered reloads all traced; `isInitialCatalogLoading` scoped to first authenticated load only.
4. Testing Coverage: Existing test landscape confirmed; coverage gaps identified (no component render tests for target branches) — advisory, not blocking.
5. Business Validation: UX improvement hypothesis is direct; no metric needed beyond visual QA.
6. Confidence Calibration: Testability scored at 65% reflecting no local test validation per policy.

### Confidence Adjustments
- Implementation: 87% — one-shot flag pattern correctly identified; token utility constraints confirmed; scope is somewhat larger than originally stated (4 files, not 2–3).
- Testability: 65% — no render tests for target branches; CI-only policy prevents local verification.
- Approach: 86% — DS Skeleton confirmed compatible; inline gate-token blocks with border-contrast approach is viable.

### Remaining Assumptions
- `animate-pulse` from standard Tailwind base renders correctly in the Cloudflare Workers/OpenNext build (no known issue)
- The parallel agent (IDEA-DISPATCH-20260306150000-0002) changes will be mergeable without structural conflict — skeleton changes are in the `session === null` branch (before the authenticated sidebar) while parallel agent changes target the authenticated sidebar nav

## Planning Readiness
- **Status: Ready-for-planning**
- Blocking items: None
- Recommended next step: `/lp-do-plan xa-uploader-loading-skeleton --auto`
