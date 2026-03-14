---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: CMS
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: cms-theme-token-compiler
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
---

# CMS Theme Token Compiler Retrofit — Fact-Find Brief

## Scope

### Summary
Retrofit the CMS app to use the same three-layer generated theme token system that brikette now uses.
The compiler (`packages/themes/base/src/build-theme-css.ts` → `generateThemeCSS()`) currently hardcodes a `.dark` selector for the dark-mode block. The CMS uses `html.theme-dark` (class-based dark toggle, not `prefers-color-scheme`), so the compiler must be extended to accept a configurable dark selector before the CMS package can be wired in.

The work has two parts, in order:
1. **Testing**: write a parity test suite for the CMS (mirroring `packages/themes/brikette/__tests__/generated-parity.test.ts`) that proves a future `generateThemeCSS()` call reproduces the hand-authored `cms.tokens.css` exactly.
2. **Compilation**: create `packages/themes/cms/` with `assets.ts`, `design-profile.ts`, and `theme-css-config.ts`; extend `generateThemeCSS()` to accept a `darkSelector` option; wire the generated CSS into `apps/cms/src/app/cms.tokens.css`.

### Goals
- Create `packages/themes/cms/` as a structured theme package parallel to `@themes/brikette`.
- Map all 66 custom properties across `:root` (100 lines) and `html.theme-dark` (49 lines) of `cms.tokens.css` into the three-layer system.
- Extend `generateThemeCSS()` with an optional `darkSelector` parameter (default: `.dark`; CMS passes `html.theme-dark`).
- Write a parity test (in the new package's `__tests__/`) that proves compiler output matches the hand-authored file, with selector-aware extraction.
- Ensure the existing CMS multi-theme preview system (`pb:theme-changed` custom event, `previewTokens` localStorage, `WizardPreview`) is unaffected.

### Non-goals
- Migrating the CMS multi-theme _preview_ token system (per-shop overrides, `tokensByTheme`, `PalettePicker`, `useThemeEditor`) — that is a runtime layer on top of these base tokens and remains untouched.
- Changing the CMS dark mode mechanism itself (`html.theme-dark` class toggle stays as-is).
- Changing how `@themes/brikette` works — any compiler extension must remain backward-compatible.
- Adding new tokens beyond what is currently in `cms.tokens.css`.
- CSS changes to `globals.css` (no tokens live there; it only imports `cms.tokens.css`).

### Constraints & Assumptions
- Constraints:
  - The compiler emits a `.dark` block today. CMS needs `html.theme-dark`. The extension must be backward-compatible — the `darkSelector` option is optional and defaults to `.dark`.
  - `cms.tokens.css` uses HSL triplet format for semantic colors (same convention as the rest of the system).
  - Several tokens use `rgba()` strings for elevation shadows rather than HSL triplets — these are not hex colors and cannot go through `hexToRgbTriplet`. They must land in `derivedVars`.
  - Border tokens (`--border-1`, `--border-2`, `--border-3`) contain `/` alpha syntax: `var(--color-fg) / 0.12`. These are derived expressions, not hex values.
  - Dark-mode stores **two** kinds of values: (a) semantic aliases like `var(--color-bg-dark)` that redirect to pre-declared `*-dark` companion vars, and (b) direct HSL overrides like `222 14% 13%`. Both must be expressible in the config.
  - The CMS has no brand-color concept (it is a tool UI, not a storefront). There are no `--color-brand-*` vars. All colors are semantic (`--color-bg`, `--color-primary`, etc.).
  - The CMS app is still on Webpack (`--webpack` flag in dev/build scripts). No Turbopack module-identity concerns.
- Assumptions:
  - The generated CSS file will live at `apps/cms/src/app/cms.tokens.generated.css` and be imported in `globals.css` in place of the hand-authored `cms.tokens.css`.
  - `packages/themes/cms/` will follow the same package structure as `packages/themes/brikette/` (own `package.json`, `tsconfig.json`, `jest.config.cjs`, `__tests__/`).
  - The CMS has no `--rgb-brand-*` triplet vars; `rgbVarMap` in the config will be empty or omitted.

## Outcome Contract

- **Why:** The brikette app has been fully migrated to the compiled token system. The CMS app retains a large hand-authored `cms.tokens.css` that is out of sync with that discipline. Retrofitting the CMS closes the gap, gives a single audit point for all CMS color decisions, and removes a class of drift bugs.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `cms.tokens.css` is replaced by a generated file produced by `generateThemeCSS()` from a typed CMS theme package; a parity test suite locks the output; no runtime behaviour changes.
- **Source:** auto

## Current Process Map

None: local code path only. The token file is a static CSS import; no CI gate, no generation script, no operator process is involved.

## Evidence Audit (Current State)

### Entry Points
- `apps/cms/src/app/globals.css` — imports `./cms.tokens.css` (line 8), which is the entire token surface for the CMS
- `apps/cms/src/app/cms.tokens.css` — the hand-authored token file, 177 lines

### Key Modules / Files
- `apps/cms/src/app/cms.tokens.css` — full token surface (see Token Surface Map below)
- `apps/cms/src/app/globals.css` — global stylesheet; `@import "./cms.tokens.css"` on line 8
- `packages/themes/base/src/build-theme-css.ts` — the compiler; emits `:root {}` and `.dark {}` blocks; dark selector is currently hardcoded on line 293: `` `.dark {\n${darkLines.join("\n")}\n}` ``
- `packages/themes/brikette/src/theme-css-config.ts` — reference config showing all three maps: `colorVarMap`, `fontVarMap`, `rgbVarMap`, `derivedVars`
- `packages/themes/brikette/__tests__/generated-parity.test.ts` — reference parity test; reads committed generated file, runs compiler, diffs vars
- `packages/themes/brikette/__tests__/coverage-parity.test.ts` — reference exhaustiveness test
- `apps/cms/src/app/cms/CmsCommandPalette.tsx` — dark mode toggle: `root.classList.toggle("theme-dark", !isDark)`, fires `pb:theme-changed` custom event, saves `theme` to `localStorage`
- `apps/cms/src/app/cms/wizard/previewTokens.ts` — multi-theme preview: `savePreviewTokens()` writes `cms-preview-tokens` to `localStorage`, dispatches `previewTokens:update` event
- `apps/cms/src/app/cms/shop/[shop]/themes/useThemeTokenSync.ts` — orchestrates live token preview (debounced write, auto-save to server)
- `apps/cms/src/app/cms/shop/[shop]/themes/ThemePreview.tsx` — renders `WizardPreview` with `previewTokens as CSSProperties` inline style (completely independent of base token file)

### Token Surface Map (full inventory, 177 lines)

**`:root` block (100 lines, 33 custom properties)**

| Token | Value type | Notes |
|---|---|---|
| `color-scheme` | literal `light` | CSS property, not custom prop |
| `--color-bg` | HSL triplet | `0 0% 100%` |
| `--color-fg` | HSL triplet | `0 0% 10%` |
| `--color-primary` | HSL triplet | `220 90% 56%` |
| `--color-primary-fg` | HSL triplet | `0 0% 100%` |
| `--color-accent` | HSL triplet | `260 83% 70%` |
| `--color-accent-fg` | HSL triplet | `0 0% 10%` |
| `--color-danger` | HSL triplet | `0 86% 97%` |
| `--color-danger-fg` | HSL triplet | `0 74% 42%` |
| `--color-success` | HSL triplet | `142 76% 97%` |
| `--color-success-fg` | HSL triplet | `142 72% 30%` |
| `--color-warning` | HSL triplet | `40 90% 96%` |
| `--color-warning-fg` | HSL triplet | `25 85% 31%` |
| `--color-info` | HSL triplet | `210 90% 96%` |
| `--color-info-fg` | HSL triplet | `210 90% 35%` |
| `--color-muted` | HSL triplet | `0 0% 88%` |
| `--color-link` | HSL triplet | `220 75% 40%` |
| `--color-muted-fg` | HSL triplet | `0 0% 20%` |
| `--color-muted-border` | HSL triplet | `0 0% 72%` |
| `--color-bg-dark` | HSL triplet | `222 16% 10%` — companion var, declared in :root |
| `--color-fg-dark` | HSL triplet | `210 20% 92%` — companion var |
| `--color-primary-dark` | HSL triplet | `221 75% 62%` — companion var |
| `--color-primary-fg-dark` | HSL triplet | `0 0% 10%` — companion var |
| `--color-accent-dark` | HSL triplet | `276 62% 72%` — companion var |
| `--color-accent-fg-dark` | HSL triplet | `0 0% 10%` — companion var |
| `--color-danger-dark` | HSL triplet | `0 62% 48%` — companion var |
| `--color-danger-fg-dark` | HSL triplet | `0 0% 100%` — companion var |
| `--color-success-dark` | HSL triplet | `142 45% 32%` — companion var |
| `--color-success-fg-dark` | HSL triplet | `0 0% 100%` — companion var |
| `--color-warning-dark` | HSL triplet | `38 84% 52%` — companion var |
| `--color-warning-fg-dark` | HSL triplet | `0 0% 10%` — companion var |
| `--color-info-dark` | HSL triplet | `210 92% 56%` — companion var |
| `--color-info-fg-dark` | HSL triplet | `0 0% 10%` — companion var |
| `--color-muted-dark` | HSL triplet | `222 10% 28%` — companion var |
| `--color-muted-fg-dark` | HSL triplet | `0 0% 92%` — companion var |
| `--color-muted-border-dark` | HSL triplet | `0 0% 40%` — companion var |
| `--hero-fg` | HSL triplet | `0 0% 100%` |
| `--hero-contrast-overlay` | HSL+alpha | `0 0% 0% / 0.7` |
| `--font-sans` | var() chain | `var(--font-geist-sans, ui-sans-serif, ...)` |
| `--font-mono` | var() chain | `var(--font-geist-mono, ui-monospace, ...)` |
| `--font-body` | var() reference | `var(--font-sans)` |
| `--font-heading-1` | var() reference | `var(--font-sans)` |
| `--font-heading-2` | var() reference | `var(--font-sans)` |
| `--typography-body-font-family` | var() reference | `var(--font-body)` |
| `--text-heading-1-font-family` | var() reference | `var(--font-heading-1)` |
| `--text-heading-2-font-family` | var() reference | `var(--font-heading-2)` |
| `--surface-1` | var() reference | `var(--color-bg)` |
| `--surface-2` | HSL triplet | `0 0% 94%` |
| `--surface-3` | HSL triplet | `0 0% 92%` |
| `--surface-input` | HSL triplet | `0 0% 96%` |
| `--ring-width` | px | `2px` |
| `--ring-offset-width` | px | `2px` |
| `--elevation-0` | literal | `none` |
| `--elevation-1` | rgba shadow | `0 1px 2px rgba(0, 0, 0, 0.08)` |
| `--elevation-2` | rgba shadow | `0 2px 6px rgba(0, 0, 0, 0.12)` |
| `--elevation-3` | rgba shadow | `0 4px 12px rgba(0, 0, 0, 0.16)` |
| `--elevation-4` | rgba shadow | `0 8px 24px rgba(0, 0, 0, 0.20)` |
| `--elevation-5` | rgba shadow | `0 12px 36px rgba(0, 0, 0, 0.24)` |
| `--border-1` | alpha expression | `var(--color-fg) / 0.12` |
| `--border-2` | alpha expression | `var(--color-fg) / 0.22` |
| `--border-3` | alpha expression | `var(--color-fg) / 0.38` |
| `--ring` | var() reference | `var(--color-primary)` |
| `--ring-offset` | var() reference | `var(--surface-1)` |
| `--gradient-hero-from` | HSL triplet | `234 70% 55%` |
| `--gradient-hero-via` | HSL triplet | `272 60% 52%` |
| `--gradient-hero-to` | HSL triplet | `222 30% 18%` |

**`html.theme-dark` block (49 lines, 27 custom properties)**

| Token | Value type | Notes |
|---|---|---|
| `color-scheme` | literal `dark` | CSS property |
| `--color-bg` | var() alias | `var(--color-bg-dark)` |
| `--color-fg` | var() alias | `var(--color-fg-dark)` |
| `--color-primary` | var() alias | `var(--color-primary-dark)` |
| `--color-primary-fg` | var() alias | `var(--color-primary-fg-dark)` |
| `--color-accent` | var() alias | `var(--color-accent-dark)` |
| `--color-accent-fg` | var() alias | `var(--color-accent-fg-dark)` |
| `--color-danger` | var() alias | `var(--color-danger-dark)` |
| `--color-danger-fg` | var() alias | `var(--color-danger-fg-dark)` |
| `--color-success` | var() alias | `var(--color-success-dark)` |
| `--color-success-fg` | var() alias | `var(--color-success-fg-dark)` |
| `--color-warning` | var() alias | `var(--color-warning-dark)` |
| `--color-warning-fg` | var(--color-warning-fg-dark) |
| `--color-info` | var() alias | `var(--color-info-dark)` |
| `--color-info-fg` | var() alias | `var(--color-info-fg-dark)` |
| `--color-muted` | var() alias | `var(--color-muted-dark)` |
| `--color-link` | HSL direct | `220 80% 70%` (overridden directly, no companion) |
| `--color-muted-fg` | var() alias | `var(--color-muted-fg-dark)` |
| `--color-muted-border` | var() alias | `var(--color-muted-border-dark)` |
| `--hero-fg` | HSL triplet | `0 0% 100%` (same as light) |
| `--hero-contrast-overlay` | HSL+alpha | `0 0% 0% / 0.7` (same as light) |
| `--surface-1` | var() alias | `var(--color-bg-dark)` |
| `--surface-2` | HSL triplet | `222 14% 13%` |
| `--surface-3` | HSL triplet | `222 12% 16%` |
| `--ring` | var() reference | `var(--color-primary-dark)` |
| `--ring-offset` | var() reference | `var(--surface-1)` |
| `--surface-input` | HSL triplet | `222 12% 18%` |
| `--ring-width` | px | `2px` |
| `--ring-offset-width` | px | `2px` |
| `--elevation-0` | literal | `none` |
| `--elevation-1` | rgba shadow | `0 1px 2px rgba(0, 0, 0, 0.14)` |
| `--elevation-2` | rgba shadow | `0 2px 6px rgba(0, 0, 0, 0.18)` |
| `--elevation-3` | rgba shadow | `0 4px 12px rgba(0, 0, 0, 0.24)` |
| `--elevation-4` | rgba shadow | `0 8px 24px rgba(0, 0, 0, 0.30)` |
| `--elevation-5` | rgba shadow | `0 12px 36px rgba(0, 0, 0, 0.36)` |

**Note on companion-var pattern**: The CMS declares `*-dark` suffixed companions in `:root` (e.g. `--color-bg-dark: 222 16% 10%`) and then aliases them in `html.theme-dark` (`--color-bg: var(--color-bg-dark)`). This two-step pattern means the compiler must emit **both** the companion vars (in the `:root` block as derived vars) and the alias expressions (in the dark block as derived vars). No hex-to-RGB conversion is needed anywhere in the CMS token set.

### Multi-Theme Preview System

The CMS has two distinct "theme" concepts that must not be confused:

1. **CMS app dark/light mode** (`html.theme-dark` class): this is what `cms.tokens.css` / `globals.css` drives. Toggled via `CmsCommandPalette.tsx:toggleTheme()` → `classList.toggle("theme-dark")` → fires `pb:theme-changed` custom event. Persisted to `localStorage("theme")`. **This is what we are compiling.**

2. **Per-shop storefront theme preview** (`previewTokens` system): a completely separate runtime layer. The `useThemeEditor` / `useThemeTokenSync` hooks write per-shop palette tokens to `localStorage("cms-preview-tokens")` and dispatch `previewTokens:update`. `WizardPreview` renders a sandboxed iframe/div with those tokens as inline CSS custom properties. **This system is untouched by this work.**

The `ThemeEditor` page also has `ThemeSelector` which picks a named base theme (e.g. "bcd", "brandx", "dark", "dummy", "prime") — these are the `@themes/*` packages listed in `apps/cms/package.json`. The CMS app has no dependency on `@themes/brikette` and does not need one.

### Patterns & Conventions Observed
- All theme packages follow the same shape: `src/assets.ts`, `src/design-profile.ts`, optional `src/recipes.ts`, `tokens.css`, `__tests__/`, `jest.config.cjs`, `package.json` — evidence: `packages/themes/brikette/`
- Brikette's parity test reads from a **committed generated file** (`theme-tokens.generated.css`) rather than re-running the compiler inline — this prevents the test from being trivially self-referential and creates a commit-time gate
- The `ThemeCSSConfig.derivedVars` map accepts arbitrary string values (var() references, px values, rgba strings, bare HSL triplets) — all CMS tokens that are not hex colors can go here
- `generateThemeCSS()` currently hardcodes `.dark` on line 293 of `build-theme-css.ts`; the only change needed is to thread an optional `darkSelector?: string` through `GenerateThemeCSSOptions` and use it at the emit site

### Dependency & Impact Map
- Upstream dependencies:
  - `packages/themes/base/src/build-theme-css.ts` — must be extended (non-breaking)
  - `packages/themes/base/src/index.ts` — exports `generateThemeCSS` and `ThemeCSSConfig`; no change needed
- Downstream dependents:
  - `@themes/brikette` parity tests — must continue to pass; backward-compatible default means no change required
  - `apps/cms/src/app/globals.css` — import line changes from `./cms.tokens.css` to `./cms.tokens.generated.css`
  - Multi-theme preview system — zero impact; it reads from per-shop `tokensByTheme` served by the API, not from the base token file
- Likely blast radius:
  - Compiler change: two-line change in `build-theme-css.ts`, trivially backward-compatible
  - New package: additive only
  - CSS swap: rename of import in `globals.css`; content is identical

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | `cms.tokens.css` drives all CMS colors and surfaces | If generated output diverges even one token from hand-authored, colors shift silently | Yes — parity test is the primary guard |
| UX / states | N/A | Dark mode toggle in CmsCommandPalette is unchanged | None | No |
| Security / privacy | N/A | No auth, no data — pure CSS compilation | None | No |
| Logging / observability / audit | N/A | No runtime behaviour change | None | No |
| Testing / validation | Required | No parity test exists today for CMS tokens | Must create test package with selector-aware extraction | Yes — primary deliverable |
| Data / contracts | Required | `ThemeCSSConfig` type must accept `darkSelector` | Breaking if not optional | Yes — keep `darkSelector` optional with `.dark` default |
| Performance / reliability | N/A | Build-time generation only | None | No |
| Rollout / rollback | Required | Generated file is committed; rollback = revert one file | Low risk | No |

## Test Landscape

### Test Infrastructure
- Frameworks: Jest (CJS config, same as `packages/themes/brikette/jest.config.cjs`)
- Commands: `pnpm --filter @themes/cms test`
- CI integration: `packages/themes/brikette` runs in CI — `@themes/cms` will be included in the same filter scope once created

### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| CMS token file | None | — | Hand-authored, no parity gate |
| ThemeSelector component | Unit | `apps/cms/src/app/cms/shop/[shop]/themes/__tests__/components.test.tsx` | Tests onChange callback only; no token values |
| useThemeEditor | Unit | `apps/cms/src/app/cms/shop/[shop]/themes/__tests__/useThemeEditor.test.ts` | Runtime preview system; unrelated |

### Coverage Gaps
- Untested paths:
  - The correctness of `cms.tokens.css` values (no gate exists today)
  - That the compiler with `html.theme-dark` selector produces syntactically valid CSS
  - That the companion-var pattern (`:root` declares `*-dark` vars; `html.theme-dark` aliases them) round-trips correctly

### Testability Assessment
- Easy to test:
  - Compiler output matches hand-authored file: read both, parse vars, diff — identical to brikette pattern
  - `darkSelector` option: `generateThemeCSS()` with `darkSelector: "html.theme-dark"` — assert emitted CSS contains `html.theme-dark {` not `.dark {`
  - Exhaustiveness: every `:root` and `html.theme-dark` property appears in the generated output
- Hard to test:
  - That no visual regressions occur — CSS correctness is structural, not visual; parity test + visual inspection at PR review covers this
- Test seams needed:
  - `extractVarsFromBlock()` helper in the parity test must be adapted to find `html.theme-dark` (not `.dark`) — the existing helper is a string-search function; just change the `blockSelector` argument

### Recommended Test Approach
- Unit tests for:
  - `generateThemeCSS()` with `darkSelector: "html.theme-dark"` emits correct selector string
  - `generateThemeCSS()` with no `darkSelector` still emits `.dark` (backward compat)
- Integration / parity tests for (in `packages/themes/cms/__tests__/`):
  - Every `:root` var in committed `cms.tokens.generated.css` is present and equal in compiler output
  - Every `html.theme-dark` var in committed file is present and equal in compiler output
  - No unexpected vars in generated output (inverse check)
- Contract tests for:
  - `ThemeCSSConfig` accepts `darkSelector` without TypeScript error
  - `GenerateThemeCSSOptions` propagates `darkSelector` to `ThemeCSSConfig`

## Questions

### Resolved
- Q: Does `generateThemeCSS()` need to change at all, or can the CMS just post-process the output?
  - A: It must change — the selector string is embedded in the emitted CSS at emit time, not added via post-processing. A regex replace would be fragile. The correct fix is an optional `darkSelector` parameter.
  - Evidence: `packages/themes/base/src/build-theme-css.ts` line 293: `` `.dark {\n...` `` is a template literal with the selector hardcoded.

- Q: Does the CMS have any `--rgb-*` triplet vars requiring hex conversion?
  - A: No. All CMS colors are HSL triplets declared as literal strings, not hex. The `rgbVarMap` in the CMS config will be empty.
  - Evidence: Full scan of `cms.tokens.css` — no `--rgb-` vars, no hex color literals.

- Q: Does the companion-var pattern (`*-dark` vars in `:root`) need new compiler support?
  - A: No. The `:root` companion vars are just additional entries in `derivedVars.light`. The `html.theme-dark` aliases are entries in `derivedVars.dark`. The existing `derivedVars` map handles arbitrary string values.
  - Evidence: `ThemeCSSConfig.derivedVars` type: `Record<string, string>` — accepts any string value including `var()` references.

- Q: Does `@themes/cms` need to be listed in `apps/cms/package.json` dependencies?
  - A: Yes, for the generation script. At test time, the package is referenced directly from the `__tests__/` directory within the package itself (same as brikette). For the build-time script that writes the generated file, the CMS app will need `@themes/cms: workspace:*`.
  - Evidence: Pattern from `packages/themes/brikette/package.json` — self-contained; brikette app imports it in the token generation script, not at runtime.

- Q: What happens to `apps/cms/src/app/cms.tokens.css` once the generated file is in place?
  - A: It should be kept as a reference/fallback and not deleted immediately; the import in `globals.css` switches to `./cms.tokens.generated.css`. The hand-authored file can be archived or deleted once the parity test is green and the PR is merged.
  - Evidence: Convention from brikette migration — generated file committed, old hand-authored block removed from `global.css`.

- Q: Is there a build script that writes the generated CSS, or is it a test-only artifact?
  - A: Brikette uses a Node script to write `theme-tokens.generated.css`. The CMS needs the same. This is a new script (`scripts/generate-cms-tokens.ts` or similar) that imports from `@themes/cms` and writes to `apps/cms/src/app/cms.tokens.generated.css`. It runs as a pre-build step or manually before commit.
  - Evidence: `packages/themes/brikette/` has no generation script — the generated file is committed and the parity test guards it. Same model applies here.

### Open (Operator Input Required)
- None. All decisions are resolvable from the codebase.

## Confidence Inputs
- Implementation: 92%
  - Evidence basis: compiler change is two lines; token surface is fully mapped; no hex colors means no complex conversion path.
  - Would raise to 95%: confirm the companion-var pattern round-trips cleanly in a throwaway test before the plan is written.
- Approach: 90%
  - Evidence basis: pattern established in brikette; only novel element is `darkSelector` extension.
  - Would raise to 95%: confirm no other caller of `generateThemeCSS()` will be broken by the interface change (only brikette calls it; no `darkSelector` in its config means the default covers it).
- Impact: 95%
  - Evidence basis: pure CSS swap; multi-theme preview system is entirely separate runtime layer.
  - Would raise further: N/A — impact is structurally zero at runtime.
- Delivery-Readiness: 88%
  - Evidence basis: all files located, all types understood, token mapping complete.
  - Would raise to 95%: a quick TypeScript check confirming `ThemeCSSConfig` extension doesn't break brikette's import.
- Testability: 92%
  - Evidence basis: parity test pattern is already proven in brikette; only selector string in `extractVarsFromBlock()` changes.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Companion-var double-declaration bug | Low | Medium | The `*-dark` vars in `:root` must appear in `derivedVars.light`, not `colorVarMap`, since they are HSL triplets not hex colors. If misrouted, the compiler will try hexToRgbTriplet on them and produce no output. Test catches this immediately. |
| `darkSelector` change breaks brikette test | Very Low | Low | Default value `.dark` preserves backward compat; brikette does not pass `darkSelector` so it gets the default. |
| `html.theme-dark` selector parsing in test helper | Low | Low | The brikette `extractVarsFromBlock()` uses `css.indexOf(blockSelector)` — for `html.theme-dark`, the string must be passed exactly; if the CSS emits `html.theme-dark` with no leading space after `html`, the search must match exactly. Unit test for the selector emission covers this. |
| Generated file diverges from hand-authored | Medium (first run) | High | Parity test fails at CI; diff output shows exact mismatching vars. Fix is to update `assets.ts` / `derivedVars`. This is the expected first iteration of the work — fail fast, fix. |

## Planning Constraints & Notes
- Must-follow patterns:
  - `darkSelector` must be optional in `GenerateThemeCSSOptions` and `ThemeCSSConfig`; default must be `.dark` to preserve brikette.
  - Parity test reads a **committed** generated file (not re-runs the compiler twice) — same discipline as brikette.
  - The CMS package structure must mirror brikette: `package.json` with `@themes/base: workspace:*` dependency, `tsconfig.json`, `jest.config.cjs`, `src/`, `__tests__/`.
  - No new runtime dependencies; this is a build-time / test-time concern only.
- Rollout/rollback expectations:
  - Rollback = revert `globals.css` import line. The hand-authored `cms.tokens.css` remains intact until deliberately deleted.
- Observability expectations:
  - None at runtime. Parity test is the sole gate.

## Suggested Task Seeds (Non-binding)
1. Extend `GenerateThemeCSSOptions` and `ThemeCSSConfig` in `build-theme-css.ts` with optional `darkSelector?: string`; wire through to the `.dark { ... }` emit site.
2. Create `packages/themes/cms/` scaffold: `package.json`, `tsconfig.json`, `jest.config.cjs`.
3. Write `packages/themes/cms/src/assets.ts` — no brand colors, no hex values; fonts only (geist-sans, geist-mono).
4. Write `packages/themes/cms/src/design-profile.ts` — CMS tool profile (no marketing/editorial modes needed).
5. Write `packages/themes/cms/src/theme-css-config.ts` — map all 33 `:root` tokens and all 27 `html.theme-dark` tokens through `derivedVars` (and `fontVarMap` for font tokens); set `darkSelector: "html.theme-dark"`.
6. Run compiler, commit output to `apps/cms/src/app/cms.tokens.generated.css`.
7. Write `packages/themes/cms/__tests__/generated-parity.test.ts` — adapts brikette pattern with `html.theme-dark` as the dark block selector.
8. Update `apps/cms/src/app/globals.css` import from `./cms.tokens.css` to `./cms.tokens.generated.css`.
9. Add `@themes/cms: workspace:*` to `apps/cms/package.json` (dev dependency, build-time only).

## Execution Routing Packet
- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - `packages/themes/cms/` exists with all three source files
  - `packages/themes/cms/__tests__/generated-parity.test.ts` passes
  - `apps/cms/src/app/cms.tokens.generated.css` committed and matches `cms.tokens.css` content exactly (modulo selector name in dark block)
  - `apps/cms/src/app/globals.css` imports generated file
  - `@themes/brikette` parity tests still pass
  - `pnpm typecheck` and `pnpm lint` pass for `apps/cms` and `packages/themes/base`
- Post-delivery measurement plan: parity test in CI is the permanent guard; no further measurement needed

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Token surface (all 177 lines) | Yes | Companion-var pattern (`*-dark` vars in `:root`) is not expressible through `colorVarMap` (hex only); must use `derivedVars` | No — resolved: `derivedVars` accepts arbitrary strings |
| Dark selector difference | Yes | Compiler hardcodes `.dark`; CMS needs `html.theme-dark` | Yes — add optional `darkSelector` to compiler |
| Multi-theme preview system | Yes | Entirely separate runtime layer; unaffected | No |
| Brikette backward compat | Yes | Optional `darkSelector` with `.dark` default preserves existing behaviour | No |
| Test infrastructure | Yes | Parity test must use `html.theme-dark` as the block selector string | No — trivial: pass different string to `extractVarsFromBlock()` |
| No hex colors in CMS | Yes | `hexToRgbTriplet` never called; `rgbVarMap` omitted | No |
