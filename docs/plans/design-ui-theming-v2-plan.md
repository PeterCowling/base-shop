Type: Plan
Status: Active
Domain: Repo
Last-reviewed: 2026-01-23
Relates-to charter: none

# Design, UI & Theming Improvement Plan v2

Created: 2026-01-23
Revised: 2026-01-23 (v2.4 — reconcile repo audit + external feedback: deterministic drift reporting, keep `tokens.css` as stable generated entrypoint, CSP/security hardening for ThemeStyle, lint baseline strategy, motion/focus contracts)
Predecessor: [design-system-plan.md](./archive/design-system-plan.md) (archived, completed)

---

## Executive Summary

With the foundational design-system plan complete (tokens, components, documentation), this plan addresses the next wave of improvements: theme architecture consolidation, accessibility hardening, token source-of-truth unification, and systematic tokenization enforcement.

**Key findings from audit:**
- **Token source-of-truth drift (recalculated, method documented below):** `packages/themes/base/src/tokens.ts` exports **138 token keys** (includes `EXTENDED_TOKENS`). Generated `@themes/base/tokens.css` defines **197 unique CSS variables** (138 normalized by stripping `-dark`). Drift is **0** after merging legacy-only tokens and generating CSS from `tokens.ts`; a compatibility copy was used during migration and is now removed.
- **Theme token entrypoint mismatch:** apps previously imported `@themes/*/src/tokens.css`, while tooling expects `@themes/<theme>/tokens.css`. Imports have been migrated to `@themes/base/tokens.css` and the generated entrypoint is now stable.
- **ThemeProvider fragmentation:** Two competing providers (`@acme/ui` light/dark/system vs `@acme/platform-core` base/dark/brandx/system), 6 ThemeToggle implementations, inconsistent type unions.
- **ThemeStyle under-deployed + unsafe-by-default:** Only `apps/cover-me-pretty` uses `ThemeStyle` for per-shop token injection, and it currently injects a `<style>` tag via `dangerouslySetInnerHTML` from `themeTokens: Record<string,string>` with no allowlist/validation/noncing. Other public apps don't apply shop theme tokens.
- **Raw Tailwind color enforcement gap:** `ds/no-raw-tailwind-color` is only enforced in CMS. 740 raw color usages in `packages/ui`, 2,616 across apps.
- **Accessibility gaps:** Reduced-motion protections are not yet implemented for DS animations, and there are JS-driven animations (Framer Motion in `apps/reception`, Lottie in CMS) that also need a reduced-motion contract. `select.tsx` and `dropdown-menu.tsx` use `focus:` instead of `focus-visible:`. Toast and DataGrid selection checkboxes have no focus styling.
- **Primitives duplicated** across `@acme/ui` and `@acme/design-system` (10 files, byte-for-byte identical).
- **Theme contract inconsistency:** `@themes/prime` exists but does not ship `tokens.css`, so it is not discoverable by `listThemes()` (theme selection surfaces). Prime brand overrides currently live in `apps/prime/src/styles/globals.css` instead.

---

## Active tasks

- **UI-V2-01** Prefer-reduced-motion end-to-end (DS + known JS animation hotspots); ban `transition-all`
- **UI-V2-02** Focus ring contract (Radix state styling + forced-colors) and fix current focus-visible gaps
- **UI-V2-10** Unify token source-of-truth: deterministic drift report, generate canonical `@themes/*/tokens.css`, eliminate drift
- **UI-V2-11** Unify ThemeProvider: separate axes (mode vs theme name), separate storage keys, cross-tab sync, init script alignment
- **UI-V2-12** ThemeStyle hardening + rollout: CSP nonce support, token allowlist/value validation, font strategy, head insertion
- **UI-V2-15** Visual regression across themes/modes (tokens/providers changes are "looks wrong" risks)
- **UI-V2-16** Token contrast validation across base + overlays (CI guarantee)
- **UI-V2-03** Remove primitive duplication in `@acme/ui` (partial)
- **UI-V2-05** Fix StatusIndicator token compliance
- **UI-V2-13** Theme package contract standardization (incl. prime + placeholder cleanup)
- **UI-V2-14** Expand tokenization lint enforcement (baseline without `eslint-disable` spam)
- **UI-V2-07** Migrate app-level modal/dropdown patterns with explicit acceptance criteria
- **UI-V2-09** Remove `@acme/ui` deprecation shims (after migrations complete)

## Summary

| Item | Priority | Effort | Status |
|------|----------|--------|--------|
| UI-V2-01: Integrate prefers-reduced-motion | Critical | Small | ✅ |
| UI-V2-02: Fix focus-visible gaps | Critical | Small | ✅ |
| UI-V2-10: Unify token source-of-truth | Critical | Large | ✅ |
| UI-V2-11: Unify ThemeProvider | Critical | Large | ✅ |
| UI-V2-12: ThemeStyle hardening + rollout to public apps | High | Medium | ✅ |
| UI-V2-15: Visual regression across themes/modes | High | Medium | ✅ |
| UI-V2-16: Token contrast validation across themes | High | Medium | ✅ |
| UI-V2-03: Remove primitive duplication in @acme/ui | High | Medium | ✅ |
| UI-V2-04: Complete consumer migration (apps/prime) | High | Small | ✅ |
| UI-V2-05: Fix StatusIndicator token compliance | High | Small | ✅ |
| UI-V2-13: Theme package contract standardization | Medium | Medium | ✅ |
| UI-V2-14: Expand tokenization lint enforcement | Medium | Medium | ✅ |
| UI-V2-07: Migrate app-level modal/dropdown patterns | Medium | Large | ✅ |
| UI-V2-09: Remove @acme/ui deprecation shims | Low | Small | ✅ |

---

## Remaining Checklist (Concrete, File-Level Targets)

All v2 checklist items are complete. See below for completed items and V3 thoughts for future work.

Completed in this pass:
- UI-V2-11: ThemeProvider unification + initTheme alignment
- UI-V2-12: ThemeStyle rollout to storefront heads (env-based shopId)
- UI-V2-03: Primitive duplication verification
- UI-V2-07: Modal/dropdown checklist + audit
- UI-V2-10: Token source-of-truth cleanup + DatePicker vendor CSS removal
- UI-V2-13: Theme package contract standardization (prime + dummy tokens, placeholders removed)
- UI-V2-16: Token contrast validation (script + waivers + passing checks)
- UI-V2-09: Remove @acme/ui deprecation shims (imports/docs/exports cleanup)

## Phase 1: Accessibility (Critical)

### UI-V2-01: Integrate prefers-reduced-motion support

- **Status:** ✅ COMPLETE
- **Problem:** Design-system components include continuous/discrete animations and transitions that do not consistently respect user motion preferences. Additionally, the repo includes JS-driven animations (Framer Motion, Lottie) and global smooth scrolling that must also respect reduced motion to be genuinely "world class".
- **Full inventory (verified):**

  **Design-system (direct class/CSS usage):**

  | File | Classes | Type |
  |------|---------|------|
  | `atoms/Loader.tsx:19` | `animate-spin` | Continuous |
  | `atoms/Skeleton.tsx:12` | `animate-pulse` | Continuous |
  | `primitives/button.tsx:229` | `animate-spin` (loading) | Continuous |
  | `primitives/dialog.tsx:22,42` | `animate-in`, `animate-out`, `fade-in`, `fade-out`, `zoom-in-95`, `zoom-out-95` | Discrete |
  | `atoms/ZoomImage.tsx:38,46` | `transition-transform duration-300`, `transition` | Transition |
  | `atoms/Switch.tsx:27,33` | `transition-colors`, `transition-transform` | Transition |
  | `atoms/Tooltip.tsx:80` | `transition-opacity` | Transition |
  | `atoms/Progress.tsx:40` | `transition-all` | Transition |
  | `atoms/OptionTile.tsx:35,53` | `transition` | Transition |
  | `atoms/OptionPill.tsx:20` | `transition` | Transition |
  | `atoms/ThemeToggle.tsx:137` | `transition-all` | Transition |
  | `primitives/accordion.tsx:167,179` | `transition-colors duration-200` | Transition |
  | `primitives/drawer.tsx:30` | `transition-transform` | Transition |
  | `molecules/DatePicker.css:63` | `transition: background-color 150ms, color 150ms` | CSS transition |

  **Non-design-system motion hotspots (must be included in the contract):**

  | File | Pattern | Type |
  |------|---------|------|
  | `apps/brikette/src/styles/global.css:140` | `scroll-behavior: smooth` | Smooth scrolling |
  | `apps/reception/src/components/bar/sales/TicketList.tsx` | `framer-motion` (AnimatePresence/motion) | JS animation |
  | `packages/ui/src/components/cms/page-builder/lottie.ts` | `lottie-web` + `requestAnimationFrame` scroll/hover triggers | JS animation |

- **Approach (tiered by severity, plus hard "no transition-all" rule):**

  | Tier | Pattern | Action | Rationale |
  |------|---------|--------|-----------|
  | **Must fix** | `animate-spin`, `animate-pulse`, `animate-in/out`, fade/zoom | Prefer `motion-safe:animate-*` OR add `motion-reduce:animate-none` | Continuous/discrete animations are vestibular triggers (WCAG 2.3.3) |
  | **Must fix** | `transition-transform` (ZoomImage, drawer) | Add `motion-reduce:transition-none` (or no transform transition at all when reduced) | Spatial movement can trigger motion sensitivity |
  | **Must fix** | `transition-all` anywhere in design-system | Replace with explicit properties (`transition-colors`, `transition-opacity`, `transition-transform`) | `transition-all` can include spatial movement unexpectedly; it also makes reduced-motion reasoning impossible |
  | **Should fix** | Global `scroll-behavior: smooth` | Disable under `prefers-reduced-motion: reduce` | Smooth scrolling is a common vestibular trigger |
  | **Should fix** | Framer Motion / Lottie | Respect reduced motion (disable or significantly reduce) | JS-driven animations are as impactful as CSS animations |

  1. **Design-system animations:** Add `motion-reduce:animate-none` (or invert to `motion-safe:*`) for continuous/discrete animations.
  2. **Design-system transforms:** Add `motion-reduce:transition-none` where transforms/zoom/slide are used.
  3. **Ban `transition-all` in design-system:** Replace with explicit transition utilities in:
     - `packages/design-system/src/primitives/input.tsx`
     - `packages/design-system/src/primitives/textarea.tsx`
     - `packages/design-system/src/atoms/Progress.tsx`
     - `packages/design-system/src/atoms/ThemeToggle.tsx`
  4. **Global smooth scroll:** Add a reduced-motion override for `scroll-behavior: smooth` (currently in Brikette).
  5. **JS animation contract:** Add reduced-motion handling to `apps/reception` Framer Motion usage and CMS Lottie runtime (disable scroll-triggered animations and autoplay when reduced).

- **Future regression prevention:**
  - Add an ESLint rule in `@acme/eslint-plugin-ds` to **ban** `transition-all` in design-system sources.
  - Add an ESLint rule (or Tailwind lint) that flags `animate-*` usage without `motion-reduce:animate-none` (or without `motion-safe:*` gating).
  - Add a lightweight grep-based check for `scroll-behavior: smooth` that requires a `prefers-reduced-motion` override in the same stylesheet.
- **Definition of done:** No `transition-all` in design-system; continuous/discrete animations are gated by reduced-motion; global smooth scrolling is disabled for reduced-motion; known JS animation hotspots (Framer Motion + Lottie) implement reduced-motion behavior.
- **Progress update (2026-01-23):**
  - Replaced `transition-all` with explicit transitions across `@acme/design-system` and `@acme/ui` primitives/atoms, added `motion-reduce:transition-none` where transforms/opacity are used.
  - Added reduced-motion handling for Framer Motion (`apps/reception/src/components/bar/sales/TicketList.tsx`) and CMS Lottie runtime (`packages/ui/src/components/cms/page-builder/lottie.ts`).
  - Added `ds/no-transition-all` ESLint rule and enabled it for design-system and UI atoms to prevent regressions.

### UI-V2-02: Fix focus-visible gaps

- **Status:** ✅ COMPLETE
- **Problem:** Interactive components use incorrect focus patterns or lack focus indicators entirely (WCAG 2.4.7).
- **Focus ring contract (world-class baseline):**
  - **Default ring:** `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
  - **Offset surface:** use `ring-offset-background` (Tailwind preset maps to `--ring-offset`) when available; otherwise `ring-offset-2` + tokenized offset color
  - **Radix menus/listboxes:** prefer `data-[highlighted]` / `data-[state=open]` styling for keyboard navigation highlights (programmatic focus does not always trigger `:focus-visible` consistently)
  - **Forced-colors:** ensure a visible outline in `@media (forced-colors: active)` (do not rely solely on background colors)
- **Full inventory (verified):**

  | File | Issue | Severity |
  |------|-------|----------|
  | `primitives/select.tsx:24` | Uses `focus:outline-none focus:ring-*` instead of `focus-visible:` | High |
  | `primitives/dropdown-menu.tsx:31,107,123,150` | 4 items use `focus:bg-accent-soft` instead of `focus-visible:` | High |
  | `atoms/Toast.tsx:142,152` | Action + Close buttons have no focus styling at all | High |
  | `molecules/DataGrid.tsx:283,291` | Selection checkboxes have no focus styling | Medium |
  | `atoms/ZoomImage.tsx` | Interactive (onClick) but no focus-visible ring | Medium |
  | `atoms/Tooltip.tsx` | Trigger lacks focus-visible styles | Medium |

  **Already correct** (no action needed): `button.tsx`, `input.tsx`, `textarea.tsx`, `checkbox.tsx`, `accordion.tsx`, `dialog.tsx`, `IconButton.tsx`, `ColorSwatch.tsx`, `OptionTile.tsx`, `OptionPill.tsx`, `Switch.tsx`, `ThemeToggle.tsx`, `DatePicker.tsx`

- **Approach:**
  - **select.tsx:** Replace `focus:outline-none focus:ring-*` -> `focus-visible:*` per contract (SelectTrigger is a normal focusable button)
  - **Toast.tsx, DataGrid.tsx, ZoomImage.tsx, Tooltip.tsx:** Apply the focus ring contract consistently (avoid per-component ad hoc rings)
  - **dropdown-menu.tsx:** Use Radix state attributes for highlight (`data-[highlighted]:bg-accent-soft`) and keep focus ring for truly focus-visible contexts (e.g., triggers). Validate in Chrome/Firefox/Safari keyboard navigation.
  - **Forced-colors:** Add a small design-system CSS escape hatch so critical interactive elements have a visible outline in forced-colors mode (and verify at least one manual pass on Windows forced-colors).
- **Regression prevention:**
  - Ensure `ds/enforce-focus-ring-token` is enabled at least for `packages/design-system/**` so `focus:` ring/outline patterns do not regress.
  - Add a Storybook/Playwright check that tabs through a small set of primitives to visually confirm focus rings across themes.
- **Definition of done:** All interactive elements in design-system have a consistent, tokenized focus ring on keyboard navigation; Radix menu highlight works with keyboard; forced-colors mode still shows a visible focus indicator.
- **Progress update (2026-01-23):**
  - Updated Select and DropdownMenu to use `focus-visible`/`data-[highlighted]` patterns in both `@acme/design-system` and `@acme/ui`.
  - Added focus-visible rings for Toast actions, DataGrid checkboxes, ZoomImage, and Tooltip triggers.
  - Added forced-colors focus ring fallback in shared UI styles and a Storybook/Playwright focus traversal test to keep it from regressing.

---

## Phase 2: Theme Architecture (Critical, Large Effort)

### UI-V2-10: Unify token source-of-truth

- **Status:** ✅ COMPLETE
- **Problem:** The token pipeline had multiple "truths" and entrypoints; drift is now resolved but the migration needs to be completed and locked in:
  1. `packages/themes/base/src/tokens.ts` (canonical intent) now exports **138 token keys** (includes `EXTENDED_TOKENS`)
  2. Generated `@themes/base/tokens.css` defines **197 unique CSS vars** (138 normalized by stripping `-dark`)
     - **Missing (0)** and **Extras (0)** after merging legacy-only families (elevation, z-index, typography scale, weights, line heights)
  3. Generated artifacts exist (`packages/themes/base/tokens.dynamic.css`, `packages/themes/base/tokens.static.css`); the legacy `src/tokens.css` copy was removed after import migration.
  4. `scripts/src/build-tokens.mjs` now sources base tokens from `packages/themes/base/src/tokens.ts` (no `tokens.js` drift).

  **Impact:** Theme correctness is fragile (undefined vars, inconsistent contract across apps), and it is too easy to ship drift because the drift computation is not a first-class artifact.

- **Approach (make drift computation deterministic, keep `tokens.css` stable):**
  1. **Add a canonical drift report script** (new): `scripts/src/tokens/report-drift.ts`
     - Inputs:
       - token keys from `packages/themes/base/src/tokens.ts` (import via `tsx`)
       - token keys from legacy `@themes/base/tokens.css` (unique vars; normalized by stripping `-dark`)
       - token keys from generated `@themes/base/tokens.css` (post-migration)
     - Outputs (printed in CI logs): counts + explicit arrays for missing/extras (no hand-maintained numbers in docs)
  2. **Merge the 36 legacy-only tokens into TS source-of-truth**
     - Add `--text-*`, `--leading-*`, `--font-weight-*`, `--elevation-*`, `--z-*` to `packages/themes/base/src/tokens.ts` (or a structured extension file), with values matching legacy `tokens.css`.
  3. **Make `@themes/*/tokens.css` the stable, generated entrypoint**
     - Generate `@themes/base/tokens.css` from `tokens.ts` (choose the dynamic semantics: `--x: var(--token-x, <default>)` so runtime overrides can target `--token-*`).
     - For a transition period, keep a legacy copy aligned to the generated output; remove once all imports migrate.
     - Fix `packages/themes/base/package.json` export so `@themes/base/tokens.css` resolves correctly (it is currently misconfigured).
     - Migrate all apps to import `@themes/<theme>/tokens.css` (remove `/src/`) so tooling like `syncTheme()` can reliably rewrite theme imports.
  4. **Eliminate build drift sources**
     - Update `scripts/src/build-tokens.mjs` to source tokens from `tokens.ts` (not `tokens.js`), or make `tokens.js` a generated artifact with a drift check.
     - Remove stale duplicate generated files (current duplicates exist under both `packages/themes/base/` and `packages/themes/base/src/`).
  5. **Add CI drift enforcement**
     - CI step runs: build tokens -> run drift report -> fail if generated `tokens.css` differs from committed output (and fail if drift vs TS source exists).
  6. **DatePicker vendor CSS tokenization**
     - `react-datepicker/dist/react-datepicker.css` introduces non-tokenized styling. Prefer a tokenized local stylesheet (or fully override vendor CSS) so DatePicker is genuinely theme-driven.

- **Risks (real risks, not `var()` micro-optimizations):**
  - **CSS payload growth:** Moving to a generated canonical `tokens.css` will likely increase the variable count (because we include the full contract + dark variants). Mitigation: ensure apps ship exactly one tokens file and do not accidentally import legacy + generated variants.
  - **FOUC / ordering:** Token overrides and theme mode must apply before first paint; coordinate with UI-V2-11 (init script/provider alignment) and UI-V2-12 (ThemeStyle head insertion).
  - **Tooling rewrite risk:** `syncTheme()` expects `@themes/<theme>/tokens.css` but apps currently import `@themes/*/src/tokens.css`. Mitigation: migrate imports early and add a small test around `syncTheme()` rewrite behavior.
- **Files (expected):**
  - `scripts/src/tokens/report-drift.ts` (new)
  - `scripts/src/build-tokens.mjs` (source-of-truth + outputs)
  - `packages/themes/base/src/tokens.ts` (add missing tokens)
  - `packages/themes/base/src/tokens.extensions.ts` (optional: absorb legacy-only groups cleanly)
  - `@themes/base/tokens.css` (generated, canonical entrypoint)
  - `@themes/base/tokens.css` (generated copy during migration)
  - `packages/themes/base/package.json` (fix `./tokens.css` export + `files`)
  - `apps/*/src/app/globals.css` or `apps/*/src/styles/global.css` (import path standardization)
  - `packages/platform-core/src/createShop/fsUtils.ts` (syncTheme rewrite regex/path)
- **Definition of done:** `tokens.ts` is the single source-of-truth; `@themes/*/tokens.css` is the stable generated entrypoint (no `/src/` imports in apps); CI produces a deterministic drift report and fails on drift; legacy tokens are preserved as a migration fallback and then removed once apps are migrated.

- **Progress (2026-01-23):**
  - Added deterministic drift reporting (`scripts/src/tokens/report-drift.ts`) and confirmed zero drift after regenerating tokens.
  - Updated `scripts/src/build-tokens.mjs` and `scripts/src/build-tokens.ts` to source base tokens from `src/tokens.ts` and emit a generated `@themes/base/tokens.css` for compatibility.
  - Generated canonical `@themes/base/tokens.css` alongside static/dynamic artifacts.
  - Migrated app imports to `@themes/base/tokens.css` (no `/src/` imports remain).
  - Removed legacy `packages/themes/base/src/tokens.css` and updated token validation to look for `packages/themes/*/tokens.css`.
  - Replaced vendor DatePicker CSS import with a fully tokenized local stylesheet and updated tests to reference `packages/themes/base/tokens.*.css` (no `src/` CSS references remain).

  **Remaining:** none.

### UI-V2-11: Unify ThemeProvider

- **Status:** ✅ COMPLETE
- **Problem:** Two competing ThemeProvider implementations with different semantics, and they currently **mix two separate axes into one `theme` storage key**:
  - **Theme mode (user preference):** `light | dark | system`
  - **Theme name / brand (shop/app selection):** `base | brandx | bcd | prime | ...`

  Mixing these creates ambiguous values (e.g. `"dark"`: mode vs theme name), conflicts between apps, and makes SSR/FOUC mitigation harder.

  | Provider | Location | Theme Union | Storage Key | Used By |
  |----------|----------|-------------|-------------|---------|
  | UI Provider | `packages/ui/src/providers/ThemeProvider.tsx` | `"light" \| "dark" \| "system"` | `"theme"` | Brikette (via re-export) |
  | Platform-Core Provider | `packages/platform-core/src/contexts/ThemeContext.tsx` | `"base" \| "dark" \| "brandx" \| "system"` | `"theme"` | XA, XA-J, XA-B, Cover-Me-Pretty |

  **Additional fragmentation:**
  - `apps/brikette/src/types/theme.ts` defines `Theme = "light" | "dark"` (no "system")
  - `apps/handbag-configurator/src/ui/ThemeToggle.tsx` — standalone, uses no provider
  - 6 different ThemeToggle implementations across the codebase
  - `apps/storybook/.storybook/mocks/ThemeContext.tsx` — separate mock with `"base" | "dark" | "system" | "brandx"`

- **Architectural constraint:** design-system is below platform-core in the package hierarchy. A ThemeProvider that manages localStorage, DOM class names, and `colorScheme` is presentation logic — but if it needs shop-awareness (brand theme resolution), it would create an upward dependency. **Solution: split into two layers.**

- **Approach:**
  1. **Define the persistence contract (separate keys):**
     - `theme-mode` (or namespaced `acme:theme-mode`): `light | dark | system`
     - `theme-name` (or namespaced `acme:theme-name`): `base | brandx | ...` (only if we truly need runtime switching; otherwise derive from shop config and do not persist)
     - Back-compat: read legacy `localStorage["theme"]` once and migrate it into the new keys (then stop writing legacy key).
  2. **Create `ThemeModeProvider` in platform-core for now** (mode only)
     - Reads/writes `theme-mode`
     - Applies `html.theme-dark` (and keeps `html.dark` in sync if needed for backwards compat)
     - Sets `document.documentElement.style.colorScheme`
     - Listens to `prefers-color-scheme` changes when in `system` mode
     - Adds cross-tab sync via `storage` event for `theme-mode`
  3. **Keep `ShopThemeProvider` in platform-core** (shop/theme-name only)
     - Wraps `ThemeModeProvider`
     - Resolves theme name from shop config (`Shop.themeId`) and/or app defaults
     - Avoids persisting theme-name in localStorage for customer-facing storefronts (theme is a shop property, not a user preference)
     - If we need a runtime theme switcher (internal tooling), persist `theme-name` under its own key and apply a non-conflicting selector (prefer `data-theme="<name>"` over `.theme-<name>` to avoid collisions like "dark")
  4. **Unify ThemeToggle**
     - A single controlled toggle in design-system (`mode` + `onModeChange`)
     - Provider-connected wrappers live alongside each provider layer (design-system for mode-only; platform-core for shop-aware apps)
  5. **Migrate apps incrementally** to import the correct layer
  6. **Align and test init scripts**
     - `packages/platform-core/src/utils/initTheme.ts` and `apps/brikette/src/utils/themeInit.ts` must follow the same contract (keys + class names) as `ThemeModeProvider`
     - Add an integration test that asserts init script output matches provider behavior for `light/dark/system`
  7. **(Optional, but recommended) SSR correctness via cookie**
     - LocalStorage-only implies we always need an inline init script to avoid FOUC.
     - If we want server-rendered correctness, set `theme-mode` cookie on user changes and read it server-side to set initial `html` class.

- **Migration strategy:** Incremental, not big-bang.
  1. Create `ThemeModeProvider` in platform-core (new code, no breakage)
  2. Update `ShopThemeProvider` in platform-core to wrap `ThemeModeProvider` internally (behavior-preserving refactor)
  3. Migrate apps one-by-one to import from the correct layer
  4. Deprecate old exports with console warnings (keep working for 1 release cycle)
  5. Remove deprecated exports

- **Risks:**
  - **initTheme coupling:** The inline `<script>` that prevents flash-of-unstyled-content must match the provider's class-name conventions exactly. If class names change during unification, every app's layout script must update atomically. Mitigation: export `THEME_CLASS_NAMES` constant from the provider; initTheme imports it at build time.
  - **SSR hydration:** The provider sets DOM classes on mount. If the initTheme script and provider disagree on initial state, React will log hydration warnings. The integration test catches this.
  - **Dark mode regression:** Changing providers could break dark mode across apps if the class-name semantics differ. Mitigation: add E2E smoke test (Playwright) that toggles dark mode and screenshots a component.

- **Files:**
  - `packages/platform-core/src/contexts/ThemeModeContext.tsx` (new — light/dark/system only)
  - `packages/platform-core/src/contexts/ShopThemeContext.tsx` (refactored — wraps ThemeModeProvider)
  - `packages/ui/src/providers/ThemeProvider.tsx` (deprecate → re-export ThemeModeProvider)
  - `packages/design-system/src/atoms/ThemeToggle.tsx` (controlled component)
  - `packages/platform-core/src/utils/initTheme.ts` (align class names, export constants)
  - `apps/brikette/src/utils/themeInit.ts` (align with shared contract)
  - `apps/*/layout.tsx` or `ClientLayout.tsx` (migrate imports incrementally)
  - E2E test for dark mode toggle
- **Progress (2026-01-23):**
  - Added `ThemeModeContext` + `ShopThemeContext` in `packages/platform-core/src/contexts/` with separate `theme-mode` and `theme-name` keys, cross-tab sync, and `theme-dark`/`theme-brandx` application.
  - Updated legacy `ThemeProvider` in `packages/platform-core/src/contexts/ThemeContext.tsx` to bridge to the new providers and preserve the `useTheme` API.
  - Updated `packages/platform-core/src/utils/initTheme.ts` to read `theme-mode`/`theme-name` with legacy fallback.
  - Updated `apps/brikette/src/utils/themeInit.ts` to read `theme-mode` with legacy fallback.
  - Migrated XA shells (`apps/xa`, `apps/xa-b`, `apps/xa-j`) to `useThemeMode` for light/dark toggles.
  - Updated storefront ThemeContext test to use `ThemeModeProvider` (`theme-mode` persistence).
  - Removed app-level ThemeContext mocks in XA/CMS tests and replaced with ThemeMode/ShopTheme mocks where needed.
  - Migrated app layouts (XA, XA-B, XA-J, Cover-Me-Pretty) and CMS Cypress CT provider to `ShopThemeProvider`.
  - Updated Brikette ThemeProvider wrapper to bridge `ThemeModeProvider` and align `useTheme` with mode-only contract.
  - Migrated handbag-configurator ThemeToggle to `useThemeMode` and wrapped layout with `ShopThemeProvider`.
  - Updated UI ThemeToggle (utilities + tests) to use `ThemeModeContext` (`light/dark/system`) instead of legacy ThemeContext.
  - Updated `packages/ui/src/providers/ThemeProvider.tsx` to read/write `theme-mode` (and mirror legacy `theme` for compatibility) + storage-event sync.
- **SSR policy (current):** Persist mode in `localStorage` and apply an inline `initTheme` script in `<head>` to avoid FOUC. Server renders default theme; cookie-based SSR alignment is deferred to V3 unless a product requires server-accurate first paint.
  - **Progress update (2026-01-23):**
    - Standardized storefront layouts to include `initTheme` in `<head>` with `color-scheme` meta and `suppressHydrationWarning` (`apps/brikette`, `apps/xa`, `apps/xa-b`, `apps/xa-j`, `apps/handbag-configurator`).
- **Definition of done:** Theme mode is a single, consistent contract (keys + class names + init script) used across all apps; theme name/brand is not conflated with mode; cross-tab sync works; init scripts and providers are aligned and tested; deprecated exports warn but still work during migration.

---

## Phase 3: Rollout + Component Architecture (High)

### UI-V2-12: ThemeStyle hardening + rollout to public apps

- **Status:** ✅ COMPLETE
- **Problem:** `ThemeStyle` (server component that injects per-shop tokens as CSS custom properties) is only used by `apps/cover-me-pretty`. Other public-facing apps don't apply shop-specific theme tokens.
- **Current state:**
  - `packages/ui/src/components/ThemeStyle.tsx`
    - Reads `Shop.themeTokens: Record<string,string>`
    - Builds a CSS string and injects via `<style dangerouslySetInnerHTML>`
    - Emits Google Fonts `<link>` tags derived from `--font-body` / `--font-heading-*`
    - Does **not** currently validate token keys/values or support CSP nonces
  - `apps/cover-me-pretty/src/app/[lang]/head.tsx` renders `<ThemeStyle shopId={shop.id} />` in `<head>` (head-correct)
  - `apps/brikette/src/app/layout.tsx` uses an inline init script (`getThemeInitScript()`) for theme mode, but does not inject per-shop tokens
- **Approach (make ThemeStyle safe, CSP-compatible, and head-correct before broad rollout):**
  1. **CSP + injection safety**
     - Add `nonce?: string` prop and forward it to the `<style>` tag (and any inline-able tags as needed).
     - Stop using `dangerouslySetInnerHTML` for CSS; render CSS as a text child of `<style>` to prevent `</style>` injection.
  2. **Token allowlist + value validation (safe-by-construction)**
     - Only allow overrides for known token keys (derive allowlist from `@themes/base` tokens + approved extras).
     - Validate values by token type:
       - colors: allow `hsl(...)`, `rgb(...)`, `#hex`, or the repo's existing `h s l%` triplet format
       - lengths: allow `px|rem|em|%|vh|vw` etc
       - font stacks: allow only from a curated allowlist or safe `var(--font-*)` references
     - Drop (and optionally log) invalid keys/values; never inject arbitrary strings directly into CSS.
  3. **Align ThemeStyle with the token override channel**
     - With UI-V2-10, canonical `tokens.css` should support runtime overrides via `--token-*`.
     - Normalize incoming `themeTokens`:
       - If a key is `--color-*` / `--font-*` etc, rewrite to `--token-<name>` so it overrides cleanly without clobbering the resolved vars.
       - Continue to accept legacy keys during migration.
  4. **Font strategy (privacy/perf)**
     - Default to **no remote font loading** from ThemeStyle in production storefronts (fonts should be a deliberate app decision, ideally via `next/font` or self-hosted assets).
     - If remote fonts remain supported, restrict to an allowlist and ensure measurable performance (preconnect, `display=swap`, and avoid duplicating `<link>` tags).
  5. **Head insertion (no flash)**
     - Ensure ThemeStyle output lands in document `<head>` (e.g., via `app/head.tsx` or layout `<head>` composition) so token overrides apply before first paint.
     - Move Cover-Me-Pretty to a head-correct integration and use that as the reference implementation.
  6. **Rollout**
     - Add ThemeStyle to Brikette once safety + head insertion are correct (ThemeStyle complements `getThemeInitScript()`; script manages mode, ThemeStyle manages tokens).
  7. **Tests**
     - Unit tests for allowlist/normalization (invalid keys/values are dropped; legacy keys normalize to `--token-*`).
     - Regression test: empty token map -> ThemeStyle returns null (no `<style>`).
- **Prerequisites:** UI-V2-10 (canonical tokens + `--token-*` override channel) and UI-V2-11 (mode contract) so ThemeStyle does not fight mode switching.
- **Definition of done:** Public storefronts apply shop token overrides safely (validated, CSP-compatible, head-correct); theme customizations from CMS are visible without FOUC; font loading strategy is explicit and measurable.
  - **Progress (2026-01-23):**
    - Added nonce support, removed `dangerouslySetInnerHTML`, and added token allowlist + value validation in `packages/ui/src/components/ThemeStyle.tsx`.
    - Moved ThemeStyle to `apps/cover-me-pretty/src/app/[lang]/head.tsx` for pre-paint injection; removed from layout.
    - Defaulted remote font loading to opt-in (`allowRemoteFonts`) and added unit tests for validation/allowlist behavior.
    - **Policy:** Storefronts should use `next/font` for production fonts; ThemeStyle remote fonts are explicitly disabled in Cover-Me-Pretty (`allowRemoteFonts={false}`) to avoid CSP/privacy/perf issues.
    - Rolled ThemeStyle into storefront heads for `apps/xa`, `apps/xa-b`, `apps/xa-j`, `apps/brikette`, and `apps/handbag-configurator` using `NEXT_PUBLIC_SHOP_ID` (fallback `default`) and `allowRemoteFonts={false}`.

### UI-V2-03: Remove primitive duplication in @acme/ui

- **Status:** ✅ COMPLETE
- **Problem:** Primitives exist as byte-for-byte copies in BOTH packages:
  - `packages/design-system/src/primitives/*.tsx` (canonical)
  - `packages/ui/src/components/atoms/primitives/*.tsx` (duplicate)
- **Progress since last audit:** `packages/ui/src/components/atoms/Toast.tsx` now delegates to `@acme/design-system/atoms/Toast` (good direction). The duplicated primitives under `packages/ui/src/components/atoms/primitives/` are still present.
- **Affected files (duplicated):**
  - `dropdown-menu.tsx` (207 lines, identical)
  - `table.tsx`
  - `dialog.tsx`
  - `accordion.tsx`
  - `button.tsx`
  - `card.tsx`
  - `checkbox.tsx`
  - `input.tsx`
  - `select.tsx`
  - `textarea.tsx`
- **Approach:**
  1. Replace `packages/ui/src/components/atoms/primitives/*.tsx` files with single-line re-exports from `@acme/design-system/primitives`
  2. Verify all consumers still work (typecheck + tests)
  3. Deduplicate `PaginationControl` molecule (same logic, different Button imports)
  4. Merge shadcn Button implementations (nearly identical in both packages)
- **Definition of done:** No independent implementations remain in @acme/ui; all delegate to @acme/design-system
  - **Progress update (2026-01-23):**
    - `packages/ui/src/components/atoms/primitives/*` now re-export design-system primitives.
    - Verified shadcn components are either re-exports or small wrappers (e.g. destructive Button) without duplicated primitive implementations.

### UI-V2-04: Complete consumer migration (apps/prime)

- **Status:** ✅ COMPLETE
- **Outcome:** apps/prime now consumes `@acme/design-system/primitives` for PrimeButton/Input/Textarea and onboarding/profile components no longer import `@acme/ui`.
- **Evidence:** `apps/prime/src/components/ui/PrimeButton.tsx`, `apps/prime/src/components/ui/PrimeInput.tsx`, `apps/prime/src/components/ui/PrimeTextarea.tsx`, `apps/prime/src/components/onboarding/*.tsx`
- **Definition of done:** ✅ Met

### UI-V2-05: Fix StatusIndicator token compliance

- **Status:** ✅ COMPLETE
- **Problem:** `packages/design-system/src/atoms/StatusIndicator/StatusIndicator.tsx` uses hardcoded Tailwind color scales instead of semantic tokens:
  ```tsx
  // Lines 58-69 — hardcoded arbitrary scales
  pending: 'bg-yellow-500 ring-yellow-500',
  processing: 'bg-blue-500 ring-blue-500',
  completed: 'bg-green-500 ring-green-500',
  cancelled: 'bg-red-500 ring-red-500',

  // Lines 200, 207 — hardcoded gray
  'bg-gray-100 dark:bg-gray-800',
  'text-gray-700 dark:text-gray-200',
  ```
- **Approach:** Replace with semantic token classes:
  - `bg-yellow-500` → `bg-warning`
  - `bg-blue-500` → `bg-info`
  - `bg-green-500` → `bg-success`
  - `bg-red-500` → `bg-danger`
  - `bg-gray-100` → `bg-surface-2`
  - `text-gray-700` → `text-fg-muted`
- **Files:** `packages/design-system/src/atoms/StatusIndicator/StatusIndicator.tsx`
- **Definition of done:** No hardcoded color scales; all colors reference semantic tokens

---

## Phase 4: Quality Gates + Theme Coverage & Enforcement (High/Medium)

### UI-V2-15: Visual regression across themes/modes

- **Status:** ✅ COMPLETE
- **Problem:** Token/provider changes are high-risk because they often "compile fine" but look wrong (incorrect colors, spacing, z-index layering, focus rings) and regressions are usually caught late.
- **Approach:**
  1. Define a small "golden set" of stories/pages that exercise critical UI primitives and theme surfaces (Button, Input/Textarea, Dialog, DropdownMenu, Toast, DataGrid, DatePicker, Tooltip, Popover).
  2. Run screenshot coverage across:
     - light mode (default)
     - dark mode (`html.theme-dark`)
     - at least one overlay theme (e.g., BrandX) once UI-V2-13 standardizes theme overlays
  3. Use Playwright (already in repo) to capture and diff screenshots against committed baselines or CI artifacts.
  4. Scope the CI job to only run when theming-adjacent packages change (`packages/themes/**`, `packages/design-system/**`, `packages/tailwind-config/**`, theme providers).
- **Definition of done:** Visual diffs are produced for theming changes and reviewed in PRs; no more "token refactor shipped but UI looks broken" incidents.
- **Progress update (2026-01-23):**
  - Added Playwright visual test `apps/storybook/.storybook/test-runner/__tests__/visual-themes.test.ts` covering base/brandx light/dark.
  - Added `storybook:visual` + `storybook:visual:update` scripts and a CI job that runs `storybook:visual`.
  - Baseline snapshots committed under `apps/storybook/.storybook/test-runner/__tests__/visual-themes.test.ts-snapshots/`.

### UI-V2-16: Token contrast validation across themes

- **Status:** ✅ COMPLETE
- **Problem:** Multi-theme support requires contrast guarantees at the token level (text, surfaces, interactive states, focus rings). Today there is no automated validation, so overlays can silently ship inaccessible contrast.
- **Approach:**
  1. Define a contrast matrix of required pairs for both light and dark (examples):
     - `--color-fg` on `--color-bg` / `--surface-*`
     - `--color-primary-fg` on `--color-primary`
     - link color on surface
     - focus ring vs surrounding surface (ring must remain visible)
  2. Implement `scripts/src/tokens/validate-contrast.ts`:
     - Read base token values from `@themes/base` (TS source-of-truth)
     - Apply overlay theme overrides (BrandX/BCD/Dark/Prime once standardized) and validate final resolved pairs
     - Emit a clear report and fail CI on critical violations
  3. Add an explicit exception mechanism (waivers with justification + expiry) rather than ignoring failures.
- **Definition of done:** Base + shipped overlays pass the required contrast matrix (or have explicit, time-bounded waivers).
  - **Progress update (2026-01-23):**
    - Hardened `scripts/src/tokens/validate-contrast.ts` with strict failures on unresolved tokens, waiver support, and per-theme reporting.
    - Added `tools/token-contrast/waivers.json` (empty baseline) for explicit, time-bounded exceptions.
    - Adjusted theme overrides to meet contrast requirements (prime primary/accent, dark link token) and verified `pnpm run tokens:contrast:check` passes.

### UI-V2-13: Theme package contract standardization

- **Status:** ✅ COMPLETE
- **Problem:** Theme packages are inconsistent:

  | Theme | package.json | token source | tokens.css present | `@themes/<theme>/tokens.css` import works | Notes |
  |-------|-------------|--------------|--------------------|----------------------------------------|------|
  | base | ✓ | `src/tokens.ts` (+ extensions) | ✓ | ✓ | generated entrypoint |
  | bcd | ✓ | `src/tailwind-tokens.ts` | ✓ | ✓ | generated |
  | brandx | ✓ | `src/tailwind-tokens.ts` | ✓ | ✓ | generated |
  | dark | ✓ | `src/tailwind-tokens.ts` | ✓ | ✓ | generated |
  | prime | ✓ | `src/tokens.ts` | ✓ | ✓ | generated |
  | dummy | ✓ | `src/tailwind-tokens.ts` | ✓ | ✓ | test fixture |

  `listThemes()` in fsUtils.ts correctly filters by `tokens.css` presence, but the registry contains non-functional placeholders that confuse developers.

- **Design decision needed:** Are derivative themes standalone (must define all tokens) or overlays (only override what differs, inherit from base)?
  - Current `validate-tokens.ts` only enforces required tokens on base themes
  - Theme tests expect partial token sets for derivatives
  - **Recommendation:** Overlays. Derivatives layer on base via CSS cascade. But they must still generate a valid `tokens.css` (even if it only contains overrides) for `listThemes()` to discover them.

- **Approach:**
  1. **Trace placeholder dependencies before removal:**
     - `packages/themes/cochlearfit/` — `apps/cochlearfit` exists as a real app. Check whether it imports `@themes/cochlearfit` or falls back to base. If it references the theme, give it a minimal `tokens.css` (override file) rather than deleting.
     - `packages/themes/skylar/` — Check for any app or test that references `@themes/skylar`. If none, delete.
     - `packages/themes/dummy/` — Likely a test fixture. Check `__tests__/` for references. If test-only, move to `__tests__/fixtures/` rather than deleting.
  2. **Standardize the canonical entrypoint** — all apps/tooling should use `@themes/<theme>/tokens.css` (no `/src/` imports). Fix Base theme export as part of UI-V2-10.
  3. **Generate tokens.css for prime** — Update `scripts/src/build-tokens.mjs` to process prime's `src/tokens.ts` (or migrate prime to the same `tailwind-tokens.ts` model) and emit a valid `tokens.css` so `listThemes()` can discover it.
  4. **Standardize exports** — All theme packages export: `./tokens.css`, `./tailwind-tokens` (or `./tokens`), and TS types.
  5. **Update validate-tokens.ts** — Ensure validation matches the post-UI-V2-10 contract (base must define required tokens; overlays must only define known overrides and produce valid CSS).
  6. **Document the contract** in the theming guide.

- **Files:**
  - `packages/themes/*/` (cleanup/standardize)
  - `scripts/src/build-tokens.mjs` (process all themes)
  - `scripts/src/validate-tokens.ts` (derivative validation)
  - `packages/platform-core/src/createShop/fsUtils.ts` (verify listing logic)
- **Definition of done:** All themes in `packages/themes/` either meet the contract (package.json + tokens.css + tailwind-tokens export) or are removed. `listThemes()` returns only functional themes.
  - **Progress update (2026-01-23):**
    - Generated `tokens.css` for `@themes/prime` and `@themes/dummy`.
    - Removed placeholder theme directories (`packages/themes/skylar`, `packages/themes/cochlearfit`) that had no package.json or tokens.
    - Updated theme discovery to rely on package.json + `tokens.css` (no placeholder entries remain).

### UI-V2-14: Expand tokenization lint enforcement

- **Status:** ✅ COMPLETE
- **Problem:** `ds/no-raw-tailwind-color` is only enforced in CMS (`error`); globally it's `off`. This means:
  - `packages/ui/src/`: 740 raw color usages (unpoliced)
  - `apps/prime/`: 250+ raw color usages (customer-facing)
  - `apps/brikette/`: 80+ raw color usages
  - `apps/xa*/`: 200+ raw color usages combined

  Semantic token alternatives exist and are well-defined (`text-muted-foreground`, `bg-surface-*`, `border-border`, etc.) but adoption is inconsistent.

- **Approach (baseline file, no code pollution):**

  The repo already has an exceptions policy (`scripts/lint-exceptions.cjs` + `exceptions.json`) for inline `eslint-disable` comments. Adding thousands of `eslint-disable-next-line` lines is not a world-class baseline strategy and will create permanent noise/merge conflicts.

  1. **Create a baseline file** (committed): `tools/eslint-baselines/ds-no-raw-tailwind-color.json`
     - Store the current set of violations for this rule (path + rule + messageId + location).
  2. **Add a CI gate script** (new): `scripts/src/lint/check-no-raw-tailwind-color-baseline.ts`
     - Runs ESLint with `ds/no-raw-tailwind-color: error` across the chosen globs.
     - Fails CI only if there are new violations vs baseline.
  3. **Wire CI to the baseline check** and keep the baseline file in `tools/eslint-baselines/`.

- **Progress update (2026-01-23):**
  - Added baseline scripts (`scripts/src/lint/report-no-raw-tailwind-color.ts`, `scripts/src/lint/check-no-raw-tailwind-color-baseline.ts`) and committed baseline file under `tools/eslint-baselines/`.
  - Set `ds/no-raw-tailwind-color` to `warn` globally and added a CI check to enforce “no new violations”.
     - Prints the delta (new violations) so fixes are straightforward.
  3. **Optional tightened gate on changed files** (recommended once stable):
     - If a file is changed in the PR, enforce **zero violations in that file** (even if baseline contains older violations elsewhere).
  4. **Burn down baseline intentionally**:
     - When violations are fixed, remove entries from the baseline via a scripted "update baseline" command (do not add inline disables).

  **Rollout order:**
  1. `packages/design-system/` — should already be fully tokenized; expect <10 violations to baseline
  2. `packages/ui/` — 740 violations to baseline
  3. `apps/brikette/`, `apps/prime/`, `apps/cover-me-pretty/` — public-facing apps
  4. `apps/xa*/` — internal but customer-visible
  5. `apps/reception/` — internal tool, lowest priority

- **Files:**
  - Root `eslint.config.mjs` / `eslint.config.js` (rule config + globs)
  - `tools/eslint-baselines/ds-no-raw-tailwind-color.json` (new, committed)
  - `scripts/src/lint/check-no-raw-tailwind-color-baseline.ts` (new)
- **Definition of done:** No new raw Tailwind color violations can be introduced anywhere; the baseline shrinks over time without adding inline disable comments.

### UI-V2-07: Migrate app-level modal/dropdown patterns

- **Status:** ✅ COMPLETE
- **Problem:** Apps implement their own modal/dropdown management instead of using design-system primitives:
  - `apps/reception/src/context/DialogContext.tsx` — custom modal context
  - `apps/brikette/src/context/ModalContext.tsx` — custom modal context
  - `apps/reception/src/components/till/ActionDropdown.tsx` — custom dropdown
  - `apps/reception/src/components/checkins/roomButton/PaymentDropdown.tsx` — custom dropdown
  - `apps/cochlearfit/src/components/Button.tsx` — independent Button implementation
- **Approach (explicit acceptance criteria + staged rollout):**
  1. Define a migration checklist (must preserve behavior):
     - focus trap + restore focus on close
     - ESC closes, click outside closes (where appropriate)
     - stacked dialogs (z-index + focus)
     - scroll lock behavior
     - correct ARIA roles/labels
     - portal/container strategy (no clipping; works in nested layouts)
  2. Start with one app (recommend `apps/reception`) and migrate one modal + one dropdown end-to-end, writing a short "migration recipe" doc.
  3. Apply the recipe to remaining targets incrementally, keeping per-app integration logic in the app layer and UI primitives in design-system.
- **Definition of done:** App-level UI primitives delegate to design-system with verified keyboard/ARIA/stacking parity; remaining app context is business logic, not UI reimplementation.
  - **Progress update (2026-01-23):**
    - Audited Reception + Brikette modals/dropdowns; they already use design-system Dialog/Popover/DropdownMenu via `@acme/ui/molecules/SimpleModal` or direct primitives.
    - Added migration checklist runbook: `docs/modal-dropdown-migration.md`.

---

## Phase 5: Cleanup (Low)

### UI-V2-09: Remove @acme/ui deprecation shims

- **Status:** ✅ COMPLETE
- **Problem:** @acme/ui still has deprecation shims that re-export from design-system with console warnings:
  - `packages/ui/src/components/atoms/shadcn/index.ts` — shadcn shim
  - `packages/ui/src/components/molecules/index.ts` — molecules shim
  - `packages/ui/src/atoms/Button.tsx` — Button prop-mapping shim
  - `packages/ui/src/atoms/Card.tsx` — Card re-export shim
  - `packages/ui/src/atoms/IconButton.tsx` — IconButton prop-mapping shim
- **Prerequisites:** UI-V2-03 and UI-V2-04 must be complete (all consumers migrated)
- **Approach:** Remove shim files and update any remaining consumers
- **Definition of done:** @acme/ui contains only domain-specific components (organisms, checkout, CMS), no presentation shims
  - **Progress update (2026-01-23):**
    - Removed `@acme/ui` presentation shims and updated remaining imports/tests/docs to use design-system paths.

---

## Recommended Execution Order

```
┌──────────────────────────────────────────────────────────────────┐
│ Phase 1: Accessibility (Critical, small effort)                  │
│  1. UI-V2-01 — Reduced motion + ban transition-all              │
│  2. UI-V2-02 — Focus ring contract + forced-colors              │
├──────────────────────────────────────────────────────────────────┤
│ Phase 2: Theme Architecture (Critical, large effort)             │
│                                                                  │
│  ┌─────────────────────────┐  ┌─────────────────────────┐       │
│  │ 3a. UI-V2-10            │  │ 3b. UI-V2-11            │       │
│  │ Token source-of-truth   │  │ Unify ThemeProvider      │       │
│  │ (unblocks 12, 13)       │  │ (independent)            │       │
│  └────────────┬────────────┘  └─────────────────────────┘       │
│               │                                                  │
│               ▼                                                  │
│  ┌─────────────────────────┐                                     │
│  │ 4. UI-V2-12             │                                     │
│  │ ThemeStyle hardening     │                                     │
│  │ (requires 10 + 11)      │                                     │
│  └─────────────────────────┘                                     │
├──────────────────────────────────────────────────────────────────┤
│ Phase 3: Component Architecture (High)                           │
│  5. UI-V2-05 — StatusIndicator tokens (quick win)                │
│  6. UI-V2-04 — Migrate apps/prime (✅ complete)                  │
│  7. UI-V2-03 — Remove primitive duplication (continue)           │
├──────────────────────────────────────────────────────────────────┤
│ Phase 4: Quality Gates + Coverage/Enforcement (High/Medium)      │
│  8. UI-V2-15 — Visual regression across themes/modes             │
│  9. UI-V2-16 — Token contrast validation                          │
│ 10. UI-V2-13 — Theme package contract (requires UI-V2-10)        │
│ 11. UI-V2-14 — Tokenization lint baseline gate                   │
│ 12. UI-V2-07 — App-level modal/dropdown migration                │
├──────────────────────────────────────────────────────────────────┤
│ Phase 5: Cleanup (Low, after migration complete)                 │
│ 13. UI-V2-09 — Remove deprecation shims                         │
└──────────────────────────────────────────────────────────────────┘
```

**Parallelization:** UI-V2-10 and UI-V2-11 are independent and can run concurrently. UI-V2-12 is gated on both (token contract + mode contract). UI-V2-15/16 can be prototyped early but are most valuable once the token pipeline is stable.

**Critical path:** UI-V2-10 + UI-V2-11 → UI-V2-12 → UI-V2-15/16 → UI-V2-13. Start UI-V2-10 early; UI-V2-11 can proceed in parallel without blocking.

---

## Rollback Strategy

UI-V2-10 and UI-V2-11 together change the token source AND the theme switching mechanism. If dark mode or theming breaks in production:

1. **Token rollback (UI-V2-10):** Keep the legacy token entrypoint committed and exportable (e.g., `@themes/base/tokens.legacy.css`). If generated `@themes/base/tokens.css` causes issues, switch the app import back to the legacy file (one-line change) or revert the generator commit.
2. **ThemeProvider rollback (UI-V2-11):** The deprecated providers continue to work during the migration period. If the new `ThemeModeProvider` has issues, apps revert their layout import to the old provider path. No behavioral change needed.
3. **ThemeStyle rollback (UI-V2-12):** ThemeStyle is additive (injects `<style>` with overrides). Removing the `<ThemeStyle />` component from a layout reverts to base theme tokens with no side effects.

**Monitoring:** After each rollout, check:
- Dark mode toggle works in all apps (manual QA or E2E)
- CMS theme editor previews match the storefront
- No hydration warnings in browser console (SSR mismatch)
 - No "flash of wrong theme" regressions on first paint (manual + lighthouse where applicable)

---

## Removed/Reshaped from v2.0

| Original Item | Disposition |
|---------------|-------------|
| UI-V2-06: Backfill non-base theme tokens | **Reshaped** → UI-V2-13. The original task conflicted with the base+override model. Derivatives don't need all tokens; they need valid CSS with their overrides. |
| UI-V2-08: Clean up hardcoded inline styles | **Absorbed** into UI-V2-14. Inline styles are a subset of the broader tokenization enforcement problem. A lint rule catches both inline styles and raw Tailwind classes. |

---

## Audit Methodology

This plan was produced from a deep audit on 2026-01-23 covering:
- **Token architecture** — Drift resolved: `tokens.ts` (138 keys) vs generated `tokens.css` (138 normalized) now match, generator sources TS, and imports use `@themes/*/tokens.css`.
- **ThemeProvider analysis** — Located all provider implementations, context types, storage keys, and consumer patterns across 6 apps
- **ThemeStyle deployment** — Traced `ThemeStyle` component usage across all app layouts
- **Lint enforcement** — Analyzed `ds/no-raw-tailwind-color` configuration and counted violations (3,356 total raw color usages)
- **Consumer adoption** — grep analysis of all import statements across apps/ and packages/
- **Component duplication** — comparison of primitives, atoms, molecules across design-system, ui, cms-ui
- **Accessibility** — Full inventory of all `animate-*`, `transition-*`, `focus:`, and `focus-visible:` patterns in design-system components (14 motion files, 5 focus files)

---

## V3 Thoughts (Post-v2.4 World-Class Guarantees)

These are not required to complete v2.4, but are the remaining ingredients to make the system sustainably world class long-term.

1. **Automated accessibility gating beyond motion/focus**
   - Add a component compliance matrix (per component: keyboard, labels, ARIA, focus management, contrast, reduced-motion behavior).
   - Integrate Storybook + axe checks for design-system components.
   - Add Playwright + axe smoke tests for critical pages in each storefront app.
   - CI gating should block on critical violations (with explicit waivers and expiry).

2. **Token schema + metadata layer (prevents token sprawl)**
   - Introduce a schema that encodes: category (primitive/semantic/component), type (color/size/shadow/font), description, deprecation metadata, and themeability.
   - Generate artifacts from schema: canonical `tokens.css`, TS token unions, Tailwind mapping, and docs tables.
   - Enforce "semantic tokens only in components" with linting and docs.

3. **Governance + ownership**
   - Define owners for tokens schema, theming runtime, accessibility gates, and visual regression baseline.
   - Require lightweight RFCs for new token categories, breaking provider changes, and new theme packages.
   - Add a deprecation policy (time/version-based), with changelog/changeset discipline and optional codemods for common migrations.

4. **Performance measurement + budgets**
   - Define budgets for: CSS payload per app, font requests, and "first paint in correct theme".
   - Track LCP/CLS (and INP where available) for theme changes in CI or RUM.
   - Explicitly measure the impact of font strategy (self-host vs remote) and prevent regressions.

## Related Documentation

- [Theme Customization Guide](../theming-customization-guide.md) — Token override patterns
- [Design System README](../../packages/design-system/README.md) — Canonical imports
- [Architecture](../architecture.md) — Package layering rules
- [Archived Design System Plan](./archive/design-system-plan.md) — Completed foundational work
