---
Type: Plan
Status: Active
Domain: Design System
Created: 2026-01-22
Created-by: Claude
Last-updated: 2026-01-22
Last-updated-by: Codex (GPT-5.2)
Audited: 2026-01-22 (repo scan update for DS-IMP-01/03/14/16)
Last-reviewed: 2026-01-22
Supersedes: docs/plans/archive/theming-audit-2026-01-plan.md
Relates-to charter: docs/architecture.md
Relates-to: docs/audits/design-system-audit-2026-01.md
Unblocks: React Router Compat Shim Removal (brikette build)
---

# Design System Plan

This plan consolidates design system improvements and theming verification into a single cohesive roadmap. It addresses gaps identified in the January 2026 audit and verifies theming implementation against documented requirements.

> **Consolidation Note**: This plan supersedes the separate Theming Audit Plan (`docs/plans/archive/theming-audit-2026-01-plan.md`). The audit checklist (`docs/theming-audit-2026-01.md`) remains as a working artifact for Phase 0 verification.

## Goals

1. **Verify theming implementation** — Confirm documented behaviors match code (18 requirements + 7 commitments)
2. **Complete token coverage** — Typography scale, z-index tokens (animation already complete)
3. **Fill component gaps** — DatePicker, DataGrid (CommandPalette, Tabs, Carousel already exist)
4. **Consolidate before adding** — Dedupe existing implementations before evaluating new dependencies
5. **Fix inconsistencies** — Dependency versions, dark mode class mismatch, code duplication
6. **Document patterns** — Theming customization guide, consolidate implementations

## Principles

1. **Consolidation-first**: Before adding any new dependency (cmdk, sonner, vaul), consolidate and dedupe existing implementations. This reduces maintenance burden immediately and reveals whether new dependencies are truly needed.

2. **Source from existing packages**: Token expansion should source from `@acme/design-tokens` and propagate to `@acme/themes` and `@acme/tailwind-config`, not duplicate values.

3. **Wrap existing dependencies**: When a dependency already exists (e.g., react-datepicker), wrap it in design-system with token styling rather than evaluating alternatives.

4. **Explicit policies**: Version management, dark mode class, and other cross-cutting concerns need documented policies, not ad-hoc fixes.

## Active tasks

- **DS-VER-05**: ✅ Persist Theme Editor base theme selection (themeId + defaults) and reload correctly
- **DS-IMP-13**: ✅ Align dark mode contract (`.theme-dark` + `system`) across ThemeProvider/initTheme/Tailwind (+ docs)
- **DS-VER-07**: ✅ Fix token build docs drift (`dist-scripts/build-tokens.js` → `scripts/src/build-tokens.mjs`)
- **DS-VER-09**: ✅ Fix CLI docs mismatch (`init-shop` vs `quickstart-shop` flags ownership)
- **DS-VER-08**: ✅ Clarify theme directory contract and validation scope (filter listThemes / docs)
- **DS-VER-10**: ✅ Confirm CMS-BUILD-06 evidence (matrix view), add explicit matrix section if needed
- **DS-VER-11**: ✅ Link/standardize CMS inline help patterns for theming surfaces (`CmsInlineHelpBanner`)
- **DS-IMP-01**: ✅ Implement dependency version policy (DECISION-02/06)
- **DS-IMP-03**: ✅ Expose typography tokens as CSS variables (DECISION-07)
- **DS-IMP-05**: ✅ Add z-index tokens + Tailwind utilities (DECISION-08) — scale in design-tokens + CSS vars + Tailwind `z-*` utilities + overlay components updated
- **DS-IMP-06**: ✅ Consolidate CommandPalette (cms-ui → re-export from @acme/ui)
- **DS-IMP-08**: ✅ Consolidate toast/notification system (CmsNotificationProvider wired + Toast atom deduped + CMS consumers migrated to useToast())
- **DS-IMP-09**: ✅ Consolidate CarouselSlides (merged best-of-both into @acme/ui; brikette imports from package)
- **DS-IMP-17**: ✅ Stabilize `@acme/cms-ui` migration (lint/TS + consolidation path back to `@acme/ui`/design-system)
- **DS-IMP-10**: ✅ Wrap existing `react-datepicker` with token styling (DatePicker molecule + CSS overrides in design-system; BookingModal consumer updated)
- **DS-IMP-12**: ✅ Implement DataGrid via `@tanstack/react-table` (DECISION-09)
- **DS-IMP-14**: ✅ CLOSED (covered by existing patterns)
- **DS-IMP-15**: ✅ Create theme customization guide
- **DS-IMP-16**: ✅ Finish component API reference (TypeDoc output + links)

## Prioritized Next Steps

Based on critique (2026-01-22), recommended execution order:

1. **DS-IMP-17** — Stabilize `@acme/cms-ui` migration (remove temporary lint concessions by consolidation/refactors)
2. **DS-IMP-06, DS-IMP-08, DS-IMP-09** — Consolidate CommandPalette, Toast, CarouselSlides (no new deps)
3. **DS-IMP-01** — ✅ Implement dependency version policy
4. **DS-IMP-03** ✅, **DS-IMP-05** ✅ — Token expansion sourcing from @acme/design-tokens
5. **DS-IMP-10** ✅ — Wrap existing react-datepicker

## Success Metrics

- [x] Theming audit checklist verified (18 items + 7 commitments)
- [ ] `pnpm validate:tokens` passes for base themes (derivative themes layer on base by design)
- [ ] Dependency version policy documented and enforced (align declared versions, then remove `pnpm.overrides`)
- [ ] CommandPalette consolidated to single implementation (currently 3 copies)
- [ ] Carousel (Swiper) consolidated to single implementation (currently 2 copies)
- [x] Tabs available — EXISTS in `@acme/ui` and `@acme/cms-ui`
- [ ] `@acme/cms-ui` transitional lint overrides removed (page-builder + blocks/nav/media back under standard thresholds)
- [ ] DatePicker wrapped in design-system (react-datepicker already installed)
- [ ] DataGrid available in design-system
- [x] Theme Editor base theme selection persists (`themeId` + refreshed defaults)
- [ ] Runtime theme switching works with canonical contract (`.theme-dark`, localStorage `theme=light|dark|system`)
- [x] Theming docs match CLI reality (`quickstart-shop --brand/--tokens`, not `init-shop`)
- [x] Token build docs reference `scripts/src/build-tokens.mjs`
- [ ] Theme customization guide exists with examples

## Quick Status

| Phase | Complete | In Progress | Remaining |
|-------|----------|-------------|-----------|
| 0. Theming Verification | 4 | 0 | 0 |
| 1. Foundation | 2 | 0 | 2 |
| 2. Tokens | 1 | 1 | 1 |
| 3. External Packages | 3 | 1 | 0 |
| 4. Components | 1 | 0 | 2 |
| 5. Runtime Theming | 2 | 0 | 0 |
| 6. Documentation | 1 | 1 | 5 |
| **Total** | **14** | **3** | **10** |

> **Note**: Status counts revised 2026-01-23. All tasks complete.
> - ✅ COMPLETE: DS-IMP-08, DS-IMP-16 (previously partial, now finished)
> - ✅ COMPLETE: DS-IMP-03 (typography tokens as CSS variables)
> - ✅ COMPLETE: DS-IMP-01 (DECISION-02/06 — policy, alignment, CI enforcement)
> - ✅ COMPLETE (consolidation): DS-IMP-06 (re-export), DS-IMP-09 (merged CarouselSlides)
> - ✅ RESOLVED (no action): DS-IMP-02 (derivative themes intentionally partial)
> - ✅ CLOSED (won't do): DS-IMP-07 (current drawer suffices)
> - ✅ CLOSED (covered by existing patterns): DS-IMP-14 (platform-core presets + build-tokens.mjs)
> - ✅ BLOCKER RESOLVED: DS-BLOCKER-01 (brikette import errors fixed — 86 errors → 0)

---

## Phase 0: Theming Verification (Immediate)

Priority: **High** | Effort: **Medium** | Dependencies: None

This phase verifies that theming implementation matches documented requirements. It absorbs tasks from the former Theming Audit Plan.

**Working Artifact**: `docs/theming-audit-2026-01.md` — Contains 18 documented requirements + 7 plan commitments to verify.

### DS-VER-01: Build requirements checklist

- Status: ✅ COMPLETE (from former THEME-AUDIT-01)
- Result: 18 documented requirements captured in `docs/theming-audit-2026-01.md` (items 1-18)
- Each item includes source doc and intended code location

### DS-VER-02: Compile plan commitments

- Status: ✅ COMPLETE (from former THEME-AUDIT-02)
- Result: 7 plan commitments captured in `docs/theming-audit-2026-01.md`:
  - THEME-01, THEME-02, THEME-03 from `docs/theming-plan.md`
  - CMS-BUILD-02, CMS-BUILD-06, CMS-BUILD-09 from `docs/cms/shop-build-plan.md`
  - Journey map steps from `docs/cms/shop-build-journey-map.md`

### DS-VER-03: Verify implementation against docs

- Status: ✅ COMPLETE (audit updated 2026-01-22)
- Scope:
  - Inspect Theme Editor and configurator preview flows against documented behaviour
  - Verify token catalogs, Tailwind integration, ThemeStyle injection, dark mode init
  - Validate documented `data-token` mappings exist in UI components
- Results summary (see `docs/theming-audit-2026-01.md`):
  - Requirements: ✅ 18 implemented
  - Plan commitments: THEME-01 ⚠️ partial; THEME-02 ✅; THEME-03 ⚠️ partial; CMS-BUILD-02 ✅; CMS-BUILD-06 ✅; CMS-BUILD-09 ✅; journey map ✅
- Definition of done:
  - Each checklist item marked as: ✅ Implemented, ❌ Missing, or ⚠️ Mismatched
  - Evidence paths and notes recorded in audit document

### DS-VER-04: Publish findings and remediation tasks

- Status: ✅ COMPLETE (audit updated 2026-01-22)
- Scope:
  - Update `docs/theming-audit-2026-01.md` with verification findings
  - Create remediation tasks for gaps (add to this plan or create issues)
  - Update `docs/theming-plan.md` if commitments are unmet
- Definition of done:
  - Audit document updated with status for all 18 items + 7 commitments
  - Gaps have corresponding tasks in this plan or GitHub issues
- Remediation tasks captured:
  - DS-VER-05: Persist Theme Editor base theme selection (persist `themeId` + defaults on change).
  - DS-IMP-13: Normalize dark mode contract (`.theme-dark` + `system`) across ThemeProvider, initTheme, Tailwind, and docs.
  - DS-VER-07: Update token build doc references (`dist-scripts/build-tokens.js` → `scripts/src/build-tokens.mjs`).
  - DS-VER-08: Decide whether to document/trim non-theme directories without `tokens.css` or generate them.
  - DS-VER-09: Reconcile CLI docs: `init-shop` vs `quickstart-shop` theme override flags.
  - DS-VER-10: Verify CMS-BUILD-06 evidence and add an explicit matrix view if needed (component/block → surfaces/routes).
  - DS-VER-11: Verify/link the existing CMS help pattern docs (`CmsInlineHelpBanner`) from theming surfaces and guides.

---

## Phase 1: Foundation Fixes (Immediate)

Priority: **Critical** | Effort: **Small** | Dependencies: None

### DS-IMP-01: Establish dependency version policy

- Status: ✅ COMPLETE (2026-01-23)
- Implementation:
  - Upgraded React/React-DOM to 19.2.1 stable across all 14 apps + root
  - Aligned zod to ^3.25.73 (4 packages), Next.js to ^15.3.8 (5 apps)
  - Aligned react-hook-form to ^7.62.0, preact to ^10.27.0
  - Removed redundant pnpm.overrides for react, react-dom, zod, preact
  - Kept transitive security overrides (yallist, dom-serializer, undici, etc.)
  - Created CI enforcement script: `scripts/check-dep-alignment.mjs`
  - Added `dep-alignment` job to `.github/workflows/ci.yml`
  - Created `docs/dependency-policy.md` with core deps list, override policy, upgrade process
  - Updated `docs/package-management.md` to reference new policy
  - Fixed React 19.2 type regressions (CommentsLayer.tsx, EditableCanvas.tsx)
  - Fixed template-app `workspace:^` protocol misuse for react dep

### DS-IMP-02: Complete partial theme tokens

- Status: ✅ RESOLVED (no action required — by design)
- Audit (2026-01-22):
  - `packages/themes/base/src/tokens.ts`: All required tokens present ✓
    - `--color-accent-fg`, `--color-danger`, `--color-danger-fg`, `--color-muted-fg` ✓
    - `--surface-1`, `--surface-2`, `--surface-3`, `--surface-input` ✓
    - `--border-1`, `--border-2`, `--border-3`, `--ring`, `--ring-offset` ✓
  - `packages/themes/bcd/` and `packages/themes/brandx/`: Intentionally partial "derivative themes"
  - `validate-tokens.ts` line 122: Only enforces full tokens for `BASE_THEMES = ["base"]`
- Resolution: **No action required** — derivative themes layer on base theme by design
- Definition of done:
  - ✓ Base theme has comprehensive token coverage
  - ✓ Derivative themes documented as overlay-only

### DS-VER-05: Persist Theme Editor base theme selection

- Status: ✅ COMPLETE (implemented 2026-01-22; required by audit item #5)
- Problem: In `/cms/shop/[shop]/themes`, switching themes updates local state/preview but does not persist `themeId` and refreshed defaults to the shop, so subsequent sessions may not reflect the selected base theme.
- Scope:
  - When a user selects a built-in theme, persist:
    - `shop.themeId = <theme>`
    - `shop.themeDefaults = baseTokens + theme overrides from packages/themes/<theme>`
    - clear `shop.themeOverrides` (overrides reset on base theme change)
    - recompute `shop.themeTokens`
  - Decide preset behavior:
    - Either persist `themeId = <presetName>` with non-empty `themeDefaults` (safe for normal reads), or keep `themeId` as the underlying base theme and persist only defaults/tokens.
  - Ensure Theme Editor UI uses the persisted theme on reload.
- Files:
  - `apps/cms/src/app/cms/shop/[shop]/themes/useThemePresetManager.ts`
  - `apps/cms/src/app/cms/shop/[shop]/themes/useThemeTokenSync.ts`
  - `apps/cms/src/app/api/shops/[shop]/theme/route.ts`
  - `apps/cms/src/services/shops/themeService.ts`
  - `packages/platform-core/src/repositories/shops.server.ts` (reference contract: applyThemeData fallback)
- Definition of done:
  - Selecting a theme in Theme Editor persists `themeId` + refreshed defaults
  - Overrides are cleared on theme change, and `themeTokens` reflect the new defaults
  - Reloading `/cms/shop/[shop]/themes` shows the persisted selection
  - Evidence:
    - `apps/cms/src/app/cms/shop/[shop]/themes/useThemePresetManager.ts`
    - `apps/cms/src/services/shops/themeService.ts`
    - `apps/cms/src/app/api/shops/[shop]/theme/route.ts`

### DS-VER-08: Clarify theme directory contract and validation scope

- Status: ✅ COMPLETE
- Problem: `listThemes()` returned all `packages/themes/*` directories, but not all are theme packages (for example caches/fixtures without `src/tokens.css`), which created ambiguous “theme exists” signals.
- Scope:
  - Define “theme package” criteria (recommended: has `src/tailwind-tokens.ts` OR `src/tokens.css` OR `package.json` with `@themes/*` name).
  - Update `listThemes()` to return only valid theme packages (or add `listThemeDirs()` and keep `listThemes()` strict).
  - Update docs and validation tooling to match (token generation + validate-tokens + Theme Editor theme list).
- Files:
  - `packages/platform-core/src/createShop/fsUtils.ts` (`listThemes`)
  - `packages/platform-core/src/themeTokens/index.ts` (load strategy expectations)
  - `scripts/src/validate-tokens.ts`
  - `docs/typography-and-color.md`
- Definition of done:
  - Theme selection surfaces list only valid theme packages (plus presets, where applicable)
  - “Theme directory exists” is no longer treated as “theme package exists”
  - Token validation and docs match the clarified contract

---

## Phase 2: Token Expansion (Short-term)

Priority: **High** | Effort: **Medium** | Dependencies: Phase 1

### DS-IMP-03: Consolidate typography scale tokens

- Status: ✅ COMPLETE (2026-01-23)
- Implementation:
  - Added CSS custom properties to `packages/themes/base/src/tokens.css`:
    - Font sizes: `--text-xs` through `--text-5xl` (9 tokens)
    - Font weights: `--font-weight-light` through `--font-weight-bold` (5 tokens)
    - Line heights: `--leading-none` through `--leading-loose` (6 tokens)
  - Wired `packages/tailwind-config/src/index.ts` with `fontSize`, `fontWeight`, `lineHeight` keys referencing CSS variables
  - Updated `scripts/src/validate-tokens.ts`: core sizes/weights/heights in REQUIRED, extended (4xl/5xl/snug/loose) in RECOMMENDED
  - Naming per DECISION-07: `--text-*` (sizes), `--font-weight-*` (weights), `--leading-*` (line heights)
  - Fixed pre-existing React 19.2 type error in `useCanvasResize.ts` (MutableRefObject → RefObject, wrong shape)

### DS-IMP-04: Add animation tokens

- Status: ✅ COMPLETE
- Audit (2026-01-22): `packages/themes/base/src/easing.ts` provides comprehensive animation tokens:
  - Duration tokens: `--duration-instant`, `--duration-fastest`, `--duration-faster`, `--duration-fast`, `--duration-normal`, `--duration-slow`, `--duration-slower`, `--duration-slowest` ✓
  - Easing tokens: `--ease-linear`, `--ease-default`, `--ease-in`, `--ease-out`, `--ease-in-out` plus advanced easings ✓
  - Semantic aliases: `--ease-enter`, `--ease-exit`, `--ease-emphasis` ✓
  - Utility functions: `createTransition()`, `createTransitions()` ✓
- Definition of done:
  - ✓ Animation tokens available via CSS variables
  - ✓ Components can use consistent motion

### DS-IMP-05: Add z-index scale tokens

- Status: ☐ NOT STARTED — all decisions made (DECISION-08), ready to implement
- Audit (2026-01-22): No z-index tokens found anywhere in the codebase.
- **Scale values (DECISION-08)**: 100 increments — base:0, dropdown:100, sticky:200, fixed:300, modalBackdrop:400, modal:500, popover:600, tooltip:700, toast:800, max:9999
- Scope:
  - Define z-index scale in `@acme/design-tokens`:
    ```typescript
    // packages/design-tokens/src/z-index.ts
    export const zIndex = {
      base: 0,
      dropdown: 100,
      sticky: 200,
      fixed: 300,
      modalBackdrop: 400,
      modal: 500,
      popover: 600,
      tooltip: 700,
      toast: 800,
      max: 9999,
    }
    ```
  - Generate CSS custom properties in `packages/themes/base/src/tokens.css`
  - Update `@acme/tailwind-config` to expose z-index utilities using CSS variables
  - Replace hardcoded z-index values in overlay components with tokens
  - Update `scripts/src/validate-tokens.ts` to check for z-index tokens
- Files:
  - `packages/design-tokens/src/z-index.ts` (new, source of truth)
  - `packages/design-tokens/src/index.ts` (export z-index)
  - `packages/themes/base/src/tokens.css` (add CSS variables)
  - `packages/tailwind-config/src/index.ts` (reference CSS variables)
  - `packages/design-system/src/primitives/dialog.tsx`
  - `packages/design-system/src/primitives/drawer.tsx`
  - `packages/design-system/src/atoms/Popover.tsx`
  - `packages/design-system/src/atoms/Tooltip.tsx`
  - `packages/design-system/src/atoms/Toast.tsx`
  - `scripts/src/validate-tokens.ts`
- Definition of done:
  - Z-index tokens defined in @acme/design-tokens
  - CSS variables exposed in base theme
  - Tailwind z-* classes use CSS variables
  - Overlay components use tokens (no hardcoded z-index)
  - validate-tokens.ts checks z-index tokens

---

## Phase 3: External Package Integration (Short-term)

Priority: **High** | Effort: **Medium** | Dependencies: None

### DS-IMP-06: Consolidate CommandPalette implementations

- Status: ✅ COMPLETE (Phase 1 — deduplication)
- Completed: 2026-01-22
- **Findings**: `cms-ui/page-builder/CommandPalette.tsx` was already a re-export from @acme/ui. The actual duplicate was `cms-ui/page-builder/hooks/useCommandPalette.ts` (identical code copy).
- **Actions taken**:
  - Converted `packages/cms-ui/src/page-builder/hooks/useCommandPalette.ts` to re-export from `@acme/ui`
  - Typecheck passes — no consumer changes needed
- **Remaining** (not blocking, tracked for future):
  - Two distinct CommandPalettes exist (page-builder insert palette + general Cmd+K palette) — these are intentionally different components, not duplicates
  - cmdk evaluation deferred (no feature gaps observed)
- Future cmdk trigger:
  - Virtualization needed for 1000+ commands
  - Submenu support required
  - Custom impl maintenance becomes burdensome

### DS-IMP-07: Integrate vaul for mobile Drawer

- Status: ✅ CLOSED (Won't Do — current impl sufficient)
- Audit (2026-01-22): Completed consolidation-first audit. See DECISION-05.
- **Audit findings**:
  - Existing `Drawer` with `side="bottom"` already used in production (`MeasuringGuideDrawer`, `PatternPickerDrawer`)
  - `ActionSheet` component exists as separate mobile bottom sheet (should be consolidated with Drawer, not a separate vaul impl)
  - No swipe gesture support exists, but not blocking current mobile UX
- **Resolution**: Current drawer suffices. Swipe gestures can be added as enhancement later if user feedback indicates need.
- **Future considerations**:
  - If swipe-to-dismiss becomes a requirement, can either:
    - Add touch gesture handling to existing Drawer
    - Adopt vaul at that time
  - Consider consolidating `ActionSheet` with `Drawer` (separate task, not tracked here)

### DS-IMP-08: Consolidate toast/notification systems

- Status: 🔶 IN PROGRESS — infrastructure wired, consumer migration pending
- **Completed (2026-01-22)**:
  - Phase 1 (Audit): Toast usage mapped across all apps
  - Phase 2 (Decision): Consolidate on `useToast` in `@acme/ui/operations` (DECISION-03)
  - Infrastructure:
    - `CmsNotificationProvider` wired into CMS layout (`apps/cms/src/app/cms/layout.tsx`)
    - Toast atom deduplicated: `@acme/ui/atoms/Toast.tsx` now re-exports from `@acme/design-system/atoms/Toast`
    - Stale `Toast.d.ts` removed from ui
- **Audit findings (3 systems)**:
  - `@acme/ui/operations/NotificationCenter`: Full `useToast()` hook — now available CMS-wide
  - Page-builder `useToastState`: Local state hook used in `useSavePublish.ts`, `usePublishWithValidation.ts`, `usePresetActions.ts`
  - `apps/reception`: `react-toastify` v11 (isolated, only 3 files)
  - CMS app: ~20+ files using inline `useState<ToastState>` + `<Toast>` pattern
- **Remaining work (follow-up)**:
  - Migrate CMS app consumers (~20 files) from inline `useState<ToastState>` to `useToast()` from NotificationCenter
  - Page-builder `useToastState` migration deferred: would add context dependency to `packages/ui` (hurts package independence)
  - Reception `react-toastify` → `@acme/ui/operations` migration (separate app, lower priority)
- Definition of done (remaining):
  - CMS inline toast consumers migrated to `useToast()`
  - Page-builder migration evaluated (may keep local state for package independence)
  - Reception migration planned (separate PR)

### DS-IMP-09: Standardize carousel approach + consolidate duplication

- Status: ✅ COMPLETE (consolidation done)
- Completed: 2026-01-22
- Decision (2026-01-22): **Standardize on CSS scroll-snap; keep Swiper for complex cases only**
- **Actions taken**:
  - Merged best of both versions into canonical `packages/ui/src/organisms/CarouselSlides.tsx`:
    - From UI: IntersectionObserver-based lazy load (200px rootMargin)
    - From brikette: Height equalisation (`measureSlideHeights` + RAF scheduling)
    - From brikette: CSS import error handling (`import("swiper/css").catch()`)
    - From brikette: i18n resource bundle availability check
  - Updated `apps/brikette/src/app/[lang]/HomeContent.tsx` to import from `@acme/ui/organisms/CarouselSlides`
  - Deleted `apps/brikette/src/components/accommodations-carousel/` directory (3 files)
  - Removed "Copied from" comments in ui package files
- CSS scroll-snap locations (no changes needed):
  - CarouselContainer, ProductCarousel, RecommendationCarousel, ReviewsCarousel, ImageCarousel, TestimonialSlider
- Future trigger for embla: Only if virtualization (1000+ slides), complex autoplay, or wheel nav needed
- Definition of done:
  - ✓ CarouselSlides.tsx exists in one location only
  - ✓ Brikette imports from @acme/ui
  - CSS scroll-snap documented as standard pattern for new carousels

### DS-IMP-17: Stabilize `@acme/cms-ui` migration

- Status: ✅ COMPLETE (2026-01-23) — consolidation complete; cms-ui lint green without local overrides
- Context (2026-01-22): `@acme/cms-ui` now contains a large page-builder/editor surface plus blocks/nav/media components, but it is not yet under the repo’s default complexity/size lint thresholds.
- Short-term guardrail (implemented): Scoped ESLint rule relaxations to keep the repo green while consolidation/refactors proceed:
  - `eslint.config.mjs`: `packages/cms-ui/src/page-builder/**/*.{ts,tsx}` (complexity/max-lines/no-explicit-any)
  - `eslint.config.mjs`: `packages/cms-ui/src/{blocks,media,nav}/**/*.{ts,tsx}` (complexity)
- Progress update (2026-01-22): Consolidated the `page-builder` surface in `@acme/cms-ui` to re-export canonical implementations from `@acme/ui` (page builder core, panels, style-panel, layout/content/interactions subpanels, palette/layers/components helpers, preview and selection helpers). Lint overrides were narrowed to the heavy cms-ui subtrees instead of the entire package.
- Progress update (2026-01-23): Re-exported remaining cms-ui surfaces from `@acme/ui` for `page-builder` hooks/state/utils and `blocks`, `media`, `nav` (including containers, data, products, and media hook utils). Lint now passes in `@acme/cms-ui` with the scoped overrides still in place.
- Progress update (2026-01-23): Removed cms-ui eslint overrides; fixed remaining DS lint warnings (min tap-size + hardcoded copy). `pnpm --filter @acme/cms-ui lint` clean.
- Scope:
  - Consolidate duplicated surfaces back onto canonical packages (`@acme/ui` and/or `@acme/design-system`) where practical.
  - Refactor hotspots to re-enable default lint thresholds and remove the temporary overrides.
  - Reduce DS warnings in cms-ui (hardcoded copy → i18n keys; min tap-size → tokenized sizes).
- Definition of done:
  - ✅ `@acme/cms-ui` passes `pnpm lint` without cms-ui-specific ESLint threshold overrides
  - ✅ Consolidation decisions documented (what stays in cms-ui vs moves to ui/design-system)
  - ✅ No duplicate page-builder primitives/components across ui/cms-ui without explicit rationale

---

## Phase 4: Component Gaps (Medium-term)

Priority: **Medium** | Effort: **Large** | Dependencies: Phase 2

### DS-IMP-10: Wrap existing react-datepicker in design-system

- Status: ☐ NOT STARTED
- Audit (2026-01-22 CORRECTED): `react-datepicker` already installed:
  - `package.json` line 398 (or similar): react-datepicker dependency exists
  - No design-system wrapper with token styling
- **Wrap existing, don't add new dependency**:
  - `react-datepicker` is already in the dependency tree
  - Task is to create a styled wrapper, not evaluate new libraries
- Scope:
  - Create `packages/design-system/src/molecules/DatePicker.tsx`
  - Wrap `react-datepicker` with design tokens:
    - Calendar surfaces use `--surface-*` tokens
    - Selected date uses `--color-primary`
    - Borders use `--border-*` tokens
    - Typography uses token-based scale
  - Support: single date, date range, min/max constraints
  - Create Storybook story
  - Ensure accessibility: keyboard navigation, ARIA labels
- Files:
  - `packages/design-system/package.json` (add react-datepicker as peer dep)
  - `packages/design-system/src/molecules/DatePicker.tsx`
  - `packages/design-system/src/molecules/DatePicker.stories.tsx`
  - `packages/design-system/src/molecules/index.ts`
- Definition of done:
  - DatePicker wrapper in design-system
  - Styled with design tokens (not hardcoded colors)
  - Keyboard accessible
  - Works in forms with react-hook-form

### DS-IMP-11: Add Tabs component

- Status: ✅ COMPLETE (exists in @acme/ui)
- Audit (2026-01-22 CORRECTED): Tabs implementations already exist:
  - `packages/ui/src/components/cms/blocks/Tabs.tsx` — CMS block Tabs
  - `packages/cms-ui/src/blocks/Tabs.tsx` — CMS-UI shim
- Notes:
  - Component exists and is functional
  - Consider whether to consolidate to design-system for wider reuse
  - If design-system version needed, existing impl can be moved/adapted
- Definition of done:
  - ✓ Tabs component available in @acme/ui
  - ✓ Used in CMS blocks

### DS-IMP-12: Add DataGrid component

- Status: ✅ COMPLETE (2026-01-23)
- Implementation: DataGrid molecule wrapping @tanstack/react-table with sorting, filtering, pagination, row selection. 18 unit tests passing.
- **Library choice (DECISION-09)**: Use `@tanstack/react-table` — headless, ~15KB, fits design-system philosophy
- Scope:
  - Add `@tanstack/react-table` dependency to `@acme/design-system`
  - Create `packages/design-system/src/molecules/DataGrid.tsx`
  - Support: sorting, filtering, pagination, row selection
  - Style with design tokens (borders, surfaces, zebra striping)
  - Create Storybook story with realistic data
  - Consider migrating existing `@acme/ui` DataTable to use this (future task)
- Files:
  - `packages/design-system/package.json`
  - `packages/design-system/src/molecules/DataGrid.tsx`
  - `packages/design-system/src/molecules/DataGrid.stories.tsx`
  - `packages/design-system/src/molecules/index.ts`
- Definition of done:
  - DataGrid available for CMS admin views
  - Performant with 1000+ rows (virtual scrolling if needed)
  - Consistent styling with existing Table primitive

---

## Phase 5: Runtime Theming (Medium-term)

Priority: **Medium** | Effort: **Medium** | Dependencies: Phase 2

### DS-IMP-13: Fix ThemeProvider dark mode inconsistency

- Status: ✅ COMPLETE — ThemeProvider/initTheme/Tailwind aligned on `.theme-dark` + `system`; docs updated
- Audit (2026-01-22): ThemeProvider existed but used a different class than Tailwind/initTheme:
  - `packages/ui/src/providers/ThemeProvider.tsx` (pre-fix): toggled `.dark` only
  - `packages/themes/base/src/tokens.static.css` and `packages/themes/base/src/tokens.dynamic.css`: generated with `html.theme-dark` overrides
  - `tailwind.config.mjs` line 190: darkMode uses `.theme-dark` selector
  - `packages/platform-core/src/utils/initTheme.ts` line 5: expects `system` value, uses `.theme-dark`
- **Critical Issue**: ThemeProvider toggles `.dark` but Tailwind and initTheme expect `.theme-dark`
- **Decision (DECISION-01)**: Use `.theme-dark` — update ThemeProvider to align with Tailwind/initTheme
- Also satisfies theming audit requirement #10 (dark mode contract normalization)
- Scope:
  - Update ThemeProvider to use `.theme-dark` class instead of `.dark`
  - Add support for `system` value in ThemeProvider
  - Ensure localStorage stores `light|dark|system` consistently
  - Update docs to reflect the canonical contract
- Files:
  - `packages/ui/src/providers/ThemeProvider.tsx`
  - `tailwind.config.mjs`
  - `packages/platform-core/src/utils/initTheme.ts`
  - `scripts/src/build-tokens.mjs`
  - `packages/themes/base/src/tokens.static.css` (generated; verify output)
  - `packages/themes/base/src/tokens.dynamic.css` (generated; verify output)
- Definition of done:
  - Single dark mode class used consistently (`.theme-dark` recommended per existing Tailwind config)
  - localStorage theme value supports `light|dark|system`
  - No flash of wrong theme on page load
  - Docs updated with canonical contract
  - Evidence:
    - `packages/ui/src/providers/ThemeProvider.tsx`
    - `apps/brikette/src/utils/themeInit.ts`
    - `apps/cms/src/app/cms/CmsCommandPalette.tsx`
    - `packages/ui/src/components/cms/TopBar.client.tsx`

### DS-IMP-14: Add theme preset system

- Status: ✅ CLOSED (Covered by existing patterns)
- Closed: 2026-01-22
- **Resolution**: Existing mechanisms cover all practical use cases:
  - **Build-time themes**: `packages/themes/*/src/tailwind-tokens.ts` + `scripts/src/build-tokens.mjs` generates CSS
  - **Runtime user presets**: `platform-core/themePresets.server.ts` + Theme Editor stores/loads presets via `Record<string, string>`
  - **Token application**: `useThemeTokenSync.ts` injects tokens at runtime via style attributes
- **Original scope analysis**:
  - "Create preset schema" → Already implicit as `Record<string, string>` (token name → value)
  - "Create preset → CSS converter" → Already exists: `generateThemeCss()` in build-tokens.mjs
  - "Allow apps to define brand presets in TS/JSON" → Already possible via `packages/themes/*`
- **Gap not worth filling**: Exposing CSS generation as a design-system library function has no demonstrated use case outside the existing build-time and runtime patterns
- **Future**: If a specific use case emerges for programmatic `generatePresetCSS()` at runtime, a new narrowly-scoped task can be created

---

## Phase 6: Documentation (Ongoing)

Priority: **Medium** | Effort: **Medium** | Dependencies: Phases 1-5

### DS-IMP-15: Create theme customization guide

- Status: ✅ COMPLETE (2026-01-23)
- Implementation: Created `docs/theming-customization-guide.md` with token override patterns, CSS override and theme package approaches, and examples for brand colors, typography, radius, dark mode, elevation, and spacing.
- Scope:
  - Document token override patterns
  - Provide examples for common customizations:
    - Brand primary color
    - Typography (custom fonts)
    - Border radius scale
    - Dark mode adjustments
  - Include code examples and screenshots
- Files:
  - `docs/theming-customization-guide.md`
- Definition of done:
  - Guide exists with practical examples
  - Covers CSS override and preset approaches
  - Links from design-system README

### DS-VER-07: Fix token build script doc drift

- Status: ✅ COMPLETE
- Problem: Docs referenced `dist-scripts/build-tokens.js`, but the repo uses `scripts/src/build-tokens.mjs` (root script `build:tokens`).
- Scope:
  - Update docs to reference the correct script and outputs.
  - Ensure references consistently point to:
    - `pnpm build:tokens` → `scripts/src/build-tokens.mjs`
    - base outputs under `packages/themes/base/src/*`
- Files:
  - `docs/typography-and-color.md`
  - `docs/theming-audit-2026-01.md`
  - `docs/plans/design-system-plan.md`
- Definition of done:
  - Token build guidance references `pnpm build:tokens` (`scripts/src/build-tokens.mjs`)
  - References match `package.json` scripts

### DS-VER-09: Fix CLI docs mismatch (`init-shop` vs `quickstart-shop`)

- Status: ✅ COMPLETE
- Problem: Audit/plan text implied `pnpm init-shop --brand/--tokens`, but flags are implemented in `quickstart-shop`.
- Scope:
  - Align theming docs to the current CLI contract (recommended: keep flags on `quickstart-shop`; keep `init-shop` as interactive/config-driven).
  - Ensure guides and audits point to the right command for brand/tokens flags.
- Files:
  - `docs/theming-advanced.md`
  - `docs/palette.md`
  - `docs/theming-audit-2026-01.md`
- Definition of done:
  - Docs consistently describe where `--brand` and `--tokens` live
  - No guide implies flags exist on `init-shop` unless implemented

### DS-VER-10: Validate CMS-BUILD-06 “matrix” evidence for theming surfaces

- Status: ✅ COMPLETE
- Scope:
  - Confirm whether `docs/cms/shop-build-ui-audit.md` satisfies CMS-BUILD-06’s intent (component/block → surfaces/routes).
  - If not, add a short explicit matrix section (or a companion doc) and link it from theming/design-system docs where relevant.
- Files:
  - `docs/cms/shop-build-ui-audit.md`
  - `docs/cms/shop-build-journey-map.md`
  - `docs/theming-audit-2026-01.md`
- Definition of done:
  - CMS-BUILD-06 evidence is unambiguous and linkable from theming audit/plan

### DS-VER-11: Link/standardize CMS inline help patterns for theming surfaces

- Status: ✅ COMPLETE
- Scope:
  - Ensure theming surfaces use the canonical help pattern (`CmsInlineHelpBanner`) and that theming guides link to the pattern docs.
  - Update/verify that Theme Editor help links are correct and consistent with other CMS build surfaces.
- Files:
  - `docs/cms/shop-build-ui-patterns.md`
  - `apps/cms/src/app/cms/shop/[shop]/themes/ThemeEditor.tsx`
  - `docs/theming.md`
- Definition of done:
  - Theme Editor help follows the documented pattern and links to the right docs
  - Theming docs point to the CMS help pattern guide

### DS-IMP-16: Create component API reference

- Status: ✅ COMPLETE (2026-01-23)
- Implementation: Added `typedoc.json` to design-system package with focused entry points. `pnpm --filter @acme/design-system doc:api` generates 166 markdown files covering all exported components with full prop documentation. Linked from design-system README. Generated output at `docs/api/design-system/` (gitignored).
- Audit (2026-01-22): `typedoc.json` exists at repo root with proper configuration:
  ```json
  {
    "entryPointStrategy": "packages",
    "entryPoints": ["packages/*"],
    "out": "docs/api",
    "plugin": ["typedoc-plugin-markdown"]
  }
  ```
  Output directory: `docs/api` (generated, not committed)
- Remaining work:
  - Verify TypeDoc output covers design-system comprehensively
  - Add usage examples to generated docs
  - Link from design-system README
- Files:
  - `typedoc.json` ✓ (exists)
  - `docs/api/` (generated)
- Definition of done:
  - API reference available for all exported components
  - Props documented with types and descriptions
  - Examples included

### DS-IMP-17: Add visual regression testing

- Status: ✅ COMPLETE
- Audit (2026-01-22): Visual regression fully configured:
  - `.github/workflows/storybook.yml` handles Chromatic integration on PRs and main
  - `docs/visual-regression-coverage.md` documents comprehensive configuration:
    - Critical component list organized by tier (all at 100% coverage)
    - Story requirements: Default, Sizes, Colors, Tones, States, Dark Mode, RTL
    - Multi-mode snapshots (light and dark) configured
- Definition of done:
  - ✓ Visual regression runs on PRs
  - ✓ Light and dark mode both tested
  - ✓ Baseline snapshots established

---

## Phase Summary

| Phase | Tasks | Priority | Effort | Status |
|-------|-------|----------|--------|--------|
| 0. Theming Verification | DS-VER-01 to 04 | High | Medium | ✅ 01-04 |
| 1. Foundation Fixes | DS-IMP-01, DS-IMP-02, DS-VER-05, DS-VER-08 | Critical | Small | ✅ All |
| 2. Token Expansion | DS-IMP-03, DS-IMP-04, DS-IMP-05 | High | Medium | ✅ 03, 04, 05 |
| 3. External Packages | DS-IMP-06, DS-IMP-07, DS-IMP-08, DS-IMP-09 | High | Medium | ✅ 06, 07, 08, 09 |
| 4. Component Gaps | DS-IMP-10, DS-IMP-11, DS-IMP-12 | Medium | Large | ✅ 10, 11, 12 |
| 5. Runtime Theming | DS-IMP-13, DS-IMP-14 | Medium | Medium | ✅ 13, 14 |
| 6. Documentation | DS-IMP-15, DS-IMP-16, DS-IMP-17, DS-VER-07, DS-VER-09, DS-VER-10, DS-VER-11 | Medium | Medium | ✅ All |

---

## Completed / Historical

### DS-VER-01: Build requirements checklist ✅
- Completed: 2026-01-17 (former THEME-AUDIT-01)
- Result: 18 documented requirements in `docs/theming-audit-2026-01.md`
- Notes: Each item includes source doc and intended code location

### DS-VER-02: Compile plan commitments ✅
- Completed: 2026-01-17 (former THEME-AUDIT-02)
- Result: 7 plan commitments in `docs/theming-audit-2026-01.md`
- Notes: From theming-plan.md, shop-build-plan.md, and journey map

### DS-IMP-04: Animation tokens ✅
- Completed: Discovered during 2026-01-22 audit
- Implementation: `packages/themes/base/src/easing.ts`
- Notes: Comprehensive duration + easing tokens with utility functions

### DS-IMP-17: Visual regression testing ✅
- Completed: Discovered during 2026-01-22 audit
- Implementation: `.github/workflows/storybook.yml`, `docs/visual-regression-coverage.md`
- Notes: Chromatic integration, multi-mode snapshots, 100% tier coverage

### DS-IMP-02: Partial theme tokens ✅ (by design)
- Resolved: 2026-01-22 audit confirmed intentional design
- Notes: Base theme has full coverage; BCD/BrandX are derivative overlay themes

### DS-IMP-11: Tabs component ✅
- Completed: Discovered during 2026-01-22 re-audit
- Implementation: `packages/ui/src/components/cms/blocks/Tabs.tsx`
- Shim: `packages/cms-ui/src/blocks/Tabs.tsx`
- Notes: Functional Tabs component exists in @acme/ui, used in CMS blocks

### DS-IMP-07: vaul mobile Drawer ✅ (Won't Do)
- Closed: 2026-01-22
- Resolution: Current Radix-based drawer with `side="bottom"` suffices for mobile UX
- Audit findings: Pattern already used in production (`MeasuringGuideDrawer`, `PatternPickerDrawer`)
- Notes: Swipe gestures can be added later if user feedback indicates need

### DS-IMP-14: Theme preset system ✅ (Covered by existing patterns)
- Closed: 2026-01-22
- Resolution: Existing mechanisms cover all practical use cases
- Evidence:
  - Build-time: `packages/themes/*` + `scripts/src/build-tokens.mjs`
  - Runtime: `platform-core/themePresets.server.ts` + Theme Editor
  - Application: `useThemeTokenSync.ts` injects tokens via style attributes
- Notes: If a specific use case emerges for a design-system-level `generatePresetCSS()` utility, a new task can be created

### DS-BLOCKER-01: Brikette @acme/design-system import errors ✅
- Completed: 2026-01-22
- **Problem**: 86 TypeScript errors in brikette app due to incorrect import paths. During React Router compat shim removal, imports were incorrectly changed from `@acme/ui` to `@acme/design-system`, but the components don't exist in design-system.
- **Root cause**: API mismatch between packages:
  - `@acme/ui/atoms` Grid has `columns` + `as` props
  - `@acme/design-system/primitives` Grid has `cols` (no `columns`, no `as`)
  - Molecules (ThemeToggle, RoomCard, etc.) exist in `@acme/ui`, not design-system
- **Fixes applied**:
  | Category | Fix |
  |----------|-----|
  | Section (20 files) | `@acme/design-system/atoms/Section` → `@acme/ui/atoms` |
  | Grid (16 files) | `@acme/design-system/atoms/Grid` → `@acme/ui/atoms` |
  | Button (8 files) | `@acme/design-system/atoms/Button` → `@acme/design-system/primitives` |
  | Dialog* (4 files) | `@acme/design-system/atoms` → `@acme/design-system/primitives` |
  | Molecules (6 files) | `@acme/design-system/molecules/*` → `@acme/ui/molecules` |
  | RatingsBar | Added named export in `@acme/ui/atoms/index.ts` |
  | Link | Use `AppLink` (supports `to` prop) instead of `Link` (NextLink) |
  | Button size | `size="default"` → `size="md"` |
- **Files modified**: ~40 files in `apps/brikette/src/`, 1 file in `packages/ui/src/atoms/index.ts`
- **Result**: `pnpm --filter @apps/brikette typecheck` passes with 0 errors
- **Lesson learned**: The two Grid components have incompatible APIs. Consider documenting the API differences or consolidating.

## Future Considerations (Not Tracked)

The following items emerged during planning but are explicitly out of scope for this plan:

- **ActionSheet → Drawer consolidation**: `ActionSheet` component duplicates bottom drawer functionality. Could be consolidated with `Drawer` using `side="bottom"`. Not blocking, as both work. See DECISION-05 audit findings.
- **Grid API alignment**: `@acme/ui/atoms` Grid and `@acme/design-system/primitives` Grid have incompatible APIs (`columns` vs `cols`). See DS-BLOCKER-01 lesson learned.

---

## Pending Audit Work

Audit completed on 2026-01-22; no pending verification items remain. Findings and remediation tasks are recorded in `docs/theming-audit-2026-01.md` and Phase 0 remediation tasks above.

---

## Policy Decisions

All decisions have been made. This section documents the rationale for reference.

### DECISION-01: Dark mode class name ✅ DECIDED

- **Affects**: DS-IMP-13
- **Decision**: **Option A — Use `.theme-dark`** (align with Tailwind config and initTheme)
- **Decided**: 2026-01-22
- **Action**: Update ThemeProvider to use `.theme-dark` class instead of `.dark`

### DECISION-02: Dependency version policy ✅ DECIDED

- **Affects**: DS-IMP-01
- **Decision**: **Option A — Align declared versions**
- **Decided**: 2026-01-22
- **Action**: Update all package.json files to match pnpm.overrides, then remove overrides once aligned

### DECISION-03: Toast system consolidation approach ✅ DECIDED

- **Affects**: DS-IMP-08
- **Decision**: **Option A — Consolidate on existing `useToast` in @acme/ui**
- **Decided**: 2026-01-22
- **Action**: Enhance `useToast` if needed; migrate `apps/reception` from react-toastify to @acme/ui toast

### DECISION-04: Canonical location for shared components ✅ DECIDED

- **Affects**: DS-IMP-06 (CommandPalette), DS-IMP-08 (Toast)
- **Decision**: **Option B — Keep in `@acme/ui`**
- **Decided**: 2026-01-22
- **Rationale**: Avoids migration churn; `@acme/design-system` focuses on low-level primitives only
- **Action**: Consolidate CommandPalette and Toast within @acme/ui, not design-system

### DECISION-05: Mobile drawer approach ✅ DECIDED

- **Affects**: DS-IMP-07
- **Audit completed**: 2026-01-22
- **Findings**:
  - Existing `Drawer` with `side="bottom"` is already used for mobile UX in production:
    - `MeasuringGuideDrawer.tsx` uses `side={isMobile ? "bottom" : "right"}`
    - `PatternPickerDrawer.tsx` uses same pattern
  - `ActionSheet` component exists as a separate mobile-first bottom sheet (not using Drawer primitive)
  - **No gesture/swipe support** in either implementation — both use CSS transitions only
  - ActionSheet has hardcoded colors (`bg-white`, `dark:bg-darkSurface`) not design tokens
- **Decision**: **Option A — Current drawer suffices for now**
- **Rationale**:
  - Bottom drawer pattern already established and working in production
  - Swipe-to-dismiss is a nice-to-have, not a blocker
  - ActionSheet should be consolidated with Drawer (uses similar pattern but different code)
  - Adding vaul would create a third implementation path
- **Action**:
  - Close DS-IMP-07 as "Won't Do (current impl sufficient)"
  - Document that swipe gestures can be added later if needed
  - Consider consolidating ActionSheet with Drawer in future

### DECISION-06: CI enforcement for dependency versions ✅ DECIDED

- **Affects**: DS-IMP-01
- **Decision**: **Hybrid — Mandatory for core deps, warning for devDependencies**
- **Decided**: 2026-01-22
- **Rationale**: Core deps (react, zod, prisma) where mismatches cause real bugs should fail CI. DevDependencies (eslint, prettier) don't affect runtime, so a warning is sufficient.
- **Action**:
  - CI check fails for mismatched core dependencies
  - CI check warns (non-blocking) for mismatched devDependencies
  - Core deps list defined in `docs/dependency-policy.md`

### DECISION-07: Typography token naming convention ✅ DECIDED

- **Affects**: DS-IMP-03
- **Decision**: **Option A — Use `--text-*` prefix**
- **Decided**: 2026-01-22
- **Rationale**: Matches Tailwind utility names (`text-xs` → `--text-xs`) for intuitive mapping; consistent with existing `--space-*` pattern
- **Action**: Typography CSS variables will use `--text-xs`, `--text-sm`, `--text-base`, etc.

### DECISION-08: Z-index scale values ✅ DECIDED

- **Affects**: DS-IMP-05
- **Decision**: **Option A — Use 100 increments**
- **Decided**: 2026-01-22
- **Scale**:
  ```
  base: 0, dropdown: 100, sticky: 200, fixed: 300,
  modalBackdrop: 400, modal: 500, popover: 600,
  tooltip: 700, toast: 800, max: 9999
  ```
- **Rationale**: 100 increments leave room for intermediate values if needed (e.g., dropdown-header at 150)
- **Action**: Implement scale in `@acme/design-tokens/src/z-index.ts`

### DECISION-09: DataGrid library choice ✅ DECIDED

- **Affects**: DS-IMP-12
- **Decision**: **Option A — Use `@tanstack/react-table`**
- **Decided**: 2026-01-22
- **Rationale**: Headless approach fits design-system philosophy; industry standard; ~15KB vs ag-grid's 200KB+
- **Action**: Wrap `@tanstack/react-table` in design-system DataGrid component with token-based styling
