---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: cochlearfit-theme-token-compiler
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
---

# Cochlearfit Theme Token Compiler Retrofit — Fact-Find Brief

## Scope

### Summary
Brikette has been migrated to a three-layer generated theme token system (`assets.ts` → `design-profile.ts` → `theme-css-config.ts`, compiled by `generateThemeCSS()`). The cochlearfit app still hand-authors its 27 CSS custom properties directly in `apps/cochlearfit/src/app/globals.css`. This retrofit moves cochlearfit's token surface into the same structured system, creating `packages/themes/cochlearfit/` and a generated output file, following the exact pattern established for brikette.

Cochlearfit is light-mode only — there is no `.dark` block and no dark-mode variants. This is the primary simplifying constraint.

### Goals
- Create `packages/themes/cochlearfit/` with `assets.ts`, `design-profile.ts`, `theme-css-config.ts`, `index.ts`, and `package.json`
- Produce a generated CSS file (`apps/cochlearfit/src/app/theme-tokens.generated.css`) that exactly reproduces the current hand-authored `:root` block
- Write tests in `packages/themes/cochlearfit/__tests__/` mirroring the brikette parity test pattern
- Create a generator script (`scripts/cochlearfit/generate-theme-tokens.ts`) following the brikette generator pattern
- Remove the hand-authored `:root` token block from `globals.css` and replace with an `@import` of the generated file

### Non-goals
- Dark mode support — cochlearfit is light-only; no `.dark` block will be generated
- Changing any token values — this is a structure-preserving retrofit, not a redesign
- Migrating the `body`, `::selection`, `@layer utilities`, or `@keyframes` blocks — only the `:root` custom properties are in scope
- Adding cochlearfit tokens to any shared design system package

### Constraints & Assumptions
- Constraints:
  - All 27 existing CSS custom property values must be preserved exactly (no value changes)
  - Tests must pass in CI — tests run in CI only, never locally
  - The existing token format is HSL triplets (not hex), which is different from brikette (hex). The `generateThemeCSS` compiler generates hex colors from `brandColors`. HSL triplet tokens are handled differently — see Token Classification section below.
  - `packages/themes/base` is built (has a `dist/` dir); `@themes/base` must be imported from dist in tests
  - Cochlearfit has no `@themes/cochlearfit` dependency in its `package.json` yet; this must be added
- Assumptions:
  - The brikette parity test pattern (compare generated output to committed generated file) is the correct test structure
  - The HSL triplet tokens should be modelled as `derivedVars.light` entries in `ThemeCSSConfig`, since they are not hex brand colors and the compiler's `brandColors` path converts hex → hex
  - A `color-scheme: light` declaration should appear in the `:root` block (mirrors brikette, and `globals.css` has `color-scheme: light` inline today)

---

## Outcome Contract

- **Why:** TBD
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** cochlearfit's CSS token surface is managed through the same three-layer compiler system as brikette, eliminating hand-authored duplication and enabling systematic theme management
- **Source:** auto

---

## Current Process Map

None: local code path only.

The change is entirely additive (new package + generated file) plus a structural move of `:root` vars from `globals.css` into a generated file. No workflow, CI lane, approval path, or operator runbook is affected.

---

## Evidence Audit (Current State)

### Entry Points
- `apps/cochlearfit/src/app/globals.css` — sole source of all theme tokens today; also contains non-token CSS (body, keyframes, utilities)
- `apps/cochlearfit/tailwind.config.mjs` — thin re-export of `@acme/tailwind-config`; no app-specific keyframes or colors defined here
- `packages/themes/brikette/` — reference implementation for the entire three-layer approach

### Full Token Surface (27 custom properties in `:root`)

The `:root` block in `apps/cochlearfit/src/app/globals.css` declares exactly the following custom properties. Values are HSL triplets throughout:

| CSS Variable | Value | Classification |
|---|---|---|
| `--color-bg` | `42 45% 94%` | Semantic alias (DS token) |
| `--color-fg` | `33 15% 12%` | Semantic alias (DS token) |
| `--color-fg-muted` | `33 11% 33%` | Brand color (muted foreground) |
| `--color-muted` | `40 30% 90%` | Brand color (muted background) |
| `--color-primary` | `9 75% 59%` | Brand color (primary — warm red-orange) |
| `--color-primary-fg` | `0 0% 100%` | Brand color (text on primary) |
| `--color-accent` | `9 62% 48%` | Brand color (accent — deeper red-orange) |
| `--color-accent-fg` | `0 0% 100%` | Brand color (text on accent) |
| `--color-link` | `9 62% 48%` | Derived (equals accent) |
| `--color-info` | `178 51% 29%` | Brand color (info — teal) |
| `--color-info-fg` | `0 0% 100%` | Brand color (text on info) |
| `--color-sand` | `38 52% 80%` | Brand color (decorative — sand) |
| `--color-ocean` | `180 32% 46%` | Brand color (decorative — ocean teal) |
| `--color-berry` | `351 54% 60%` | Brand color (decorative — berry pink) |
| `--surface-1` | `35 100% 98%` | Surface color |
| `--surface-2` | `0 0% 100%` | Surface color |
| `--surface-3` | `42 45% 92%` | Surface color |
| `--surface-input` | `0 0% 100%` | Surface color (form inputs) |
| `--color-panel` | `0 0% 100%` | Semantic alias (DS token) |
| `--color-focus-ring` | `var(--color-primary)` | Derived (references primary) |
| `--ring` | `var(--color-primary)` | Derived (focus ring alias) |
| `--ring-offset` | `var(--color-bg)` | Derived (ring offset alias) |
| `--gradient-hero-from` | `178 51% 29%` | Gradient stop (equals info color) |
| `--gradient-hero-via` | `42 45% 94%` | Gradient stop (equals bg color) |
| `--gradient-hero-to` | `9 75% 59%` | Gradient stop (equals primary color) |
| `color-scheme` | `light` | CSS property (not custom property) |

**Total: 25 custom properties + `color-scheme` (not a custom property).**

Note: `--color-focus-ring`, `--ring`, `--ring-offset`, `--color-link` are `var(...)` references, not HSL triplets.

### HSL Triplet vs. Hex — Critical Design Decision

The brikette compiler's `brandColors` pipeline works exclusively with **hex** colors, converting them to RGB triplets for `rgba()` support. Cochlearfit tokens are **HSL triplets** throughout — consumed as `hsl(var(--color-primary))` in component CSS.

The correct mapping strategy for cochlearfit is:
- **All token values go into `derivedVars.light`** in `ThemeCSSConfig` — they are emitted verbatim, no conversion
- `brandColors` in `assets.ts` is left empty or contains only a color-scheme sentinel
- `colorVarMap`, `fontVarMap`, `rgbVarMap` are all empty maps
- The `generateThemeCSS` compiler already supports this path: `derivedVars.light` entries are emitted as-is with `--${name}: ${value};`
- The `design-profile.ts` can capture design intent (typography, motion, palette character) as agent-guidance metadata — it doesn't need to map to generated CSS vars for cochlearfit's simple case

This approach requires zero changes to the compiler and produces correct output.

### Font Situation
Cochlearfit uses `var(--font-display)` in the `.font-display` utility class inside `globals.css`. However, `--font-display` is **not declared in the `:root` block** — it is injected by Next.js font optimization as a CSS variable via the app layout. It is not a theme token and is out of scope.

### Key Modules / Files
- `apps/cochlearfit/src/app/globals.css` — current hand-authored token source (lines 6–33 are the `:root` block)
- `apps/cochlearfit/tailwind.config.mjs` — re-exports shared config; no changes needed
- `apps/cochlearfit/jest.config.cjs` — extends `@acme/config/jest.preset.cjs` with custom module mapper; any new `packages/themes/cochlearfit` tests will live in that package, not in the app
- `packages/themes/brikette/` — full reference implementation
- `packages/themes/brikette/__tests__/generated-parity.test.ts` — test model to clone
- `packages/themes/brikette/jest.config.cjs` — `module.exports = require("@acme/config/jest.preset.cjs")();` (no overrides needed)
- `packages/themes/brikette/tsconfig.json` — extends `../../../tsconfig.base.json`; `include: ["src/**/*"]`; `exclude: ["dist", "**/__tests__/**"]`
- `scripts/brikette/generate-theme-tokens.ts` — generator script model to clone
- `packages/themes/base/src/build-theme-css.ts` — `generateThemeCSS()` compiler; no changes needed

### Patterns & Conventions Observed
- Package name pattern: `@themes/cochlearfit` (following `@themes/brikette`, `@themes/base`)
- Package structure: `src/assets.ts`, `src/design-profile.ts`, `src/theme-css-config.ts`, `src/index.ts`, `package.json`
- All brikette source files have `main: "./src/index.ts"` — source-first, no build step required (unlike `@themes/base`)
- Test files live in `__tests__/` at the package root (alongside `src/`)
- Generated CSS file committed to the app: `apps/brikette/src/styles/theme-tokens.generated.css`
- Generator script: `scripts/brikette/generate-theme-tokens.ts`, run via `pnpm --filter scripts brikette:generate-theme-tokens`
- The brikette `generated-parity.test.ts` reads the committed generated file and compares it against fresh `generateThemeCSS()` output — this is the canonical test shape
- `globals.css` imports the generated file with `@import "./theme-tokens.generated.css"` and removes the hand-authored `:root` block

### Data & Contracts
- Types/schemas: `ThemeCSSConfig`, `ThemeAssets`, `DesignProfile` from `@themes/base` — no changes to these
- `generateThemeCSS(options: GenerateThemeCSSOptions): string` — public API; stable
- Generated file path convention: `apps/<app>/src/app/theme-tokens.generated.css` (cochlearfit) or `apps/<app>/src/styles/theme-tokens.generated.css` (brikette). Either is fine; `src/app/` is marginally simpler for cochlearfit since globals.css lives there.

### Dependency & Impact Map
- Upstream dependencies: `packages/themes/base` (compiler + types)
- Downstream dependents: `apps/cochlearfit` (sole consumer of its theme tokens)
- Likely blast radius: zero runtime impact — this is a structural reorganization with identical token values. The only risk is a value transcription error during mapping, which the parity test catches.

---

## Test Landscape

### Test Infrastructure
- Frameworks: Jest (via `@acme/config/jest.preset.cjs`)
- Commands: `pnpm --filter @themes/cochlearfit test` (once package is created)
- CI integration: tests run in CI via the monorepo test pipeline

### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Cochlearfit app | Unit/integration | `apps/cochlearfit/src/test/seo/seo-integration.test.ts` | SEO only; no theme tests |
| Brikette theme | Parity | `packages/themes/brikette/__tests__/generated-parity.test.ts` | Full :root + .dark coverage |
| Brikette theme | Coverage | `packages/themes/brikette/__tests__/coverage-parity.test.ts` | Assets/profile/recipe sourcing |

### Coverage Gaps
- No theme token tests exist for cochlearfit today
- No test verifies that the hand-authored `:root` values in globals.css haven't drifted

### Testability Assessment
- Easy to test: generated CSS parity (compare fresh `generateThemeCSS()` output to committed file, var-by-var)
- Easy to test: all 25 custom properties present in generated `:root`
- Easy to test: all values match exactly (with whitespace normalisation)
- Not applicable: dark mode tests (light-only)
- Not applicable: coverage-parity test of the brikette depth (assets → CSS var bridge) — because all tokens live in `derivedVars.light`, there is no bridge to validate separately; a single parity test is sufficient

### Recommended Test Approach
- **Primary test**: `packages/themes/cochlearfit/__tests__/generated-parity.test.ts`
  - Reads committed `apps/cochlearfit/src/app/theme-tokens.generated.css`
  - Calls `generateThemeCSS()` fresh
  - Asserts: every custom property in the committed file exists in generated output with matching value
  - Asserts: no extra vars in generated output (inverse coverage)
  - No `.dark` block tests needed (light-only)
- **No coverage-parity test needed** — with `derivedVars.light` as the sole mechanism, there is no separate assets/profile bridge to validate
- Unit tests for: nothing additional (the parity test is sufficient)
- Integration tests for: none
- E2E tests for: none

---

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | Hand-authored `:root` in globals.css, lines 6–33 | Values must be transcribed exactly; any typo causes a visual regression | Yes — parity test must catch all value mismatches |
| UX / states | N/A | No interactive states depend on token structure | None | No |
| Security / privacy | N/A | CSS tokens only | None | No |
| Logging / observability / audit | N/A | No runtime logging | None | No |
| Testing / validation | Required | No existing theme tests for cochlearfit | Gap closed by new parity test in `packages/themes/cochlearfit/__tests__/` | Yes |
| Data / contracts | Required | `ThemeCSSConfig` interface; `generateThemeCSS()` API | HSL triplet strategy (derivedVars.light) must be confirmed against compiler | Yes — verify compiler emits verbatim values |
| Performance / reliability | N/A | Generated CSS is static; no runtime cost change | None | No |
| Rollout / rollback | Required | Globals.css is the live token source; swap must be atomic | Generated file committed before globals.css is updated; rollback = revert commit | Yes |

---

## ThemeCSSConfig Mapping

The following is the concrete mapping for `packages/themes/cochlearfit/src/theme-css-config.ts`:

```ts
export const themeCSSConfig: ThemeCSSConfig = {
  assets,
  profile,
  colorVarMap: {},   // no hex brand colors
  fontVarMap: {},    // no font vars in :root
  rgbVarMap: {},     // no RGB triplets needed
  derivedVars: {
    light: {
      "color-bg":         "42 45% 94%",
      "color-fg":         "33 15% 12%",
      "color-fg-muted":   "33 11% 33%",
      "color-muted":      "40 30% 90%",
      "color-primary":    "9 75% 59%",
      "color-primary-fg": "0 0% 100%",
      "color-accent":     "9 62% 48%",
      "color-accent-fg":  "0 0% 100%",
      "color-link":       "var(--color-accent)",
      "color-info":       "178 51% 29%",
      "color-info-fg":    "0 0% 100%",
      "color-sand":       "38 52% 80%",
      "color-ocean":      "180 32% 46%",
      "color-berry":      "351 54% 60%",
      "surface-1":        "35 100% 98%",
      "surface-2":        "0 0% 100%",
      "surface-3":        "42 45% 92%",
      "surface-input":    "0 0% 100%",
      "color-panel":      "0 0% 100%",
      "color-focus-ring": "var(--color-primary)",
      "ring":             "var(--color-primary)",
      "ring-offset":      "var(--color-bg)",
      "gradient-hero-from": "178 51% 29%",
      "gradient-hero-via":  "42 45% 94%",
      "gradient-hero-to":   "9 75% 59%",
    },
    // No dark block — light-only theme
  },
};
```

The compiler emits `color-scheme: light` automatically in the `:root` block header, so that property does not need to appear in `derivedVars`.

### Compiler Behaviour Verification

From `build-theme-css.ts` line 215: `rootLines.push("  color-scheme: light;")` — confirmed, `color-scheme: light` is emitted automatically. The `generateDerivedVars()` function at line 186–190 emits `--${name}: ${value};` verbatim. No conversion is applied. The HSL triplet approach is valid and requires no compiler changes.

### Package Creation Needs

| File | Source | Notes |
|---|---|---|
| `packages/themes/cochlearfit/package.json` | Clone from brikette | Change `name` to `@themes/cochlearfit`; no recipes entry needed |
| `packages/themes/cochlearfit/src/assets.ts` | Minimal stub | Empty `brandColors: {}`, empty `fonts`, empty `keyframes`, empty `gradients`, empty `shadows` |
| `packages/themes/cochlearfit/src/design-profile.ts` | Author from scratch | Guidance-only profile (warm earth tones, light-only, simple SPA character) |
| `packages/themes/cochlearfit/src/theme-css-config.ts` | New | As specified in mapping above |
| `packages/themes/cochlearfit/src/index.ts` | Clone from brikette | Export `assets`, `profile`, `themeCSSConfig` (no `recipes`) |
| `packages/themes/cochlearfit/__tests__/generated-parity.test.ts` | Clone and simplify brikette version | No `.dark` tests; reads `apps/cochlearfit/src/app/theme-tokens.generated.css` |
| `packages/themes/cochlearfit/jest.config.cjs` | Clone from brikette | Identical one-liner |
| `packages/themes/cochlearfit/tsconfig.json` | Clone from brikette | Identical |
| `scripts/cochlearfit/generate-theme-tokens.ts` | Clone from brikette | Change import and output path |
| `apps/cochlearfit/src/app/theme-tokens.generated.css` | Generated artifact | Committed output; regenerated by the script |

**`apps/cochlearfit/package.json` changes needed:**
- Add `"@themes/cochlearfit": "workspace:*"` to dependencies

**`scripts/package.json` changes needed:**
- Add `"cochlearfit:generate-theme-tokens": "tsx scripts/cochlearfit/generate-theme-tokens.ts"` script entry

---

## Questions

### Resolved
- Q: Does the compiler need changes to support HSL triplet tokens?
  - A: No. `derivedVars.light` values are emitted verbatim by `generateDerivedVars()`. HSL triplets as string values work as-is.
  - Evidence: `packages/themes/base/src/build-theme-css.ts` lines 186–190
- Q: Does the generated file need a `.dark` block?
  - A: No. Cochlearfit's `globals.css` has `color-scheme: light` and no `.dark` override block. The compiler's `.dark` block will still be emitted (it contains only `color-scheme: dark`) but it is harmless and empty.
  - Evidence: `apps/cochlearfit/src/app/globals.css` line 7; `build-theme-css.ts` lines 261–293
- Q: Where should the generated file live?
  - A: `apps/cochlearfit/src/app/theme-tokens.generated.css` — same directory as `globals.css` for minimal import path (`@import "./theme-tokens.generated.css"`)
- Q: Is a `coverage-parity` test needed (like brikette's second test)?
  - A: No. That test validates the asset → CSS var bridge. With all tokens in `derivedVars.light`, there is no bridge — the parity test alone is sufficient.
- Q: Should `assets.ts` have any content?
  - A: Minimal stub with valid empty collections (the `ThemeAssets` type requires the fields). No brand color definitions needed since all tokens go through `derivedVars`.

### Open (Operator Input Required)
None — all decisions are resolvable from documented evidence and existing patterns.

---

## Confidence Inputs
- Implementation: 95% — the mapping is fully enumerated; compiler is verified to support the approach; package structure is exact-clone of brikette
  - What would raise to 98%: running the generator script locally (not possible per policy; CI will confirm)
- Approach: 95% — `derivedVars.light` is the correct mechanism; verified against compiler source
  - What would raise to 100%: CI green on first attempt
- Impact: 98% — light-only, no dark mode, no value changes; blast radius is zero
- Delivery-Readiness: 92% — all files to create are fully specified; one risk is the empty `.dark` block the compiler emits by default (may contain spurious `color-scheme: dark` in output; test should either skip the `.dark` block or assert it is empty/harmless)
  - Mitigation: parity test can simply not check the `.dark` block for cochlearfit
- Testability: 95% — parity test pattern is proven in brikette; adapting it is mechanical

---

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Compiler emits `color-scheme: dark` in `.dark` block even for light-only themes | High (it always does) | Low — harmless in browser | Parity test skips `.dark` block entirely; or assert `.dark` block has only `color-scheme` |
| HSL triplet value transcription error (typo in derivedVars) | Low | Medium — visual regression | Parity test catches every value mismatch; committed generated file is the source of truth |
| Forgetting to add `@themes/cochlearfit` dependency to cochlearfit `package.json` | Low | High — build/typecheck fails | Explicit task in plan |
| `assets.ts` stub missing required fields (TypeScript compile error) | Low | Medium — blocks build | Author stub against `ThemeAssets` type signature |

---

## Planning Constraints & Notes
- Must-follow patterns:
  - Package name: `@themes/cochlearfit`
  - All source files under `src/`; tests under `__tests__/`
  - Jest config: one-liner `require("@acme/config/jest.preset.cjs")()`
  - Generated file committed to the repo (not gitignored)
  - Generator script in `scripts/cochlearfit/`
  - `globals.css` `:root` block removed and replaced with `@import "./theme-tokens.generated.css"` after the generated file is committed and tested
- Rollout/rollback expectations:
  - Two-phase: (1) create package + generated file + tests passing; (2) update `globals.css` to import generated file and remove hand-authored block
  - Rollback: revert globals.css to hand-authored block (no data migration needed)
- Observability expectations: none (CSS only)

---

## Suggested Task Seeds (Non-binding)
1. Create `packages/themes/cochlearfit/` package skeleton (package.json, tsconfig.json, jest.config.cjs)
2. Author `src/assets.ts` (minimal stub), `src/design-profile.ts` (guidance metadata), `src/theme-css-config.ts` (full `derivedVars.light` mapping as specified above), `src/index.ts`
3. Add `@themes/cochlearfit` dependency to `apps/cochlearfit/package.json`
4. Create `scripts/cochlearfit/generate-theme-tokens.ts`; add script to `scripts/package.json`
5. Run generator → commit `apps/cochlearfit/src/app/theme-tokens.generated.css`
6. Write `packages/themes/cochlearfit/__tests__/generated-parity.test.ts` (light-only variant of brikette test)
7. Update `apps/cochlearfit/src/app/globals.css`: add `@import "./theme-tokens.generated.css"` and remove `:root` custom-property block (keep `color-scheme: light`, body, keyframes, utilities)
8. Verify typecheck passes

---

## Execution Routing Packet
- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - `packages/themes/cochlearfit/` package exists with all source files
  - `apps/cochlearfit/src/app/theme-tokens.generated.css` committed and non-empty
  - `packages/themes/cochlearfit/__tests__/generated-parity.test.ts` passes in CI
  - `apps/cochlearfit/src/app/globals.css` `:root` block contains only `@import` (no hand-authored custom properties)
  - `pnpm typecheck` passes for cochlearfit app
- Post-delivery measurement plan: none (structural change, no user-facing metric)

---

## Rehearsal Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Token surface (27 properties) | Yes | `color-scheme` is a CSS property, not a custom property — not included in derivedVars | No — compiler handles it automatically |
| HSL triplet compatibility with compiler | Yes | All values are string literals; `derivedVars.light` emits verbatim | No |
| Dark mode | Yes | No dark block needed; empty `.dark` compiler output is harmless | No — parity test skips `.dark` |
| Package structure | Yes | Matches brikette pattern exactly | No |
| Font vars | Yes | `--font-display` is Next.js-injected, not a theme token | No |
| Derived var references (`var(--color-primary)` etc.) | Yes | Emitted verbatim by compiler — will work correctly at browser resolution time | No |

---

## Analysis Readiness
- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: proceed directly to `lp-do-plan`
