---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: xa-b-theme-token-compiler
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: none
Trigger-Why: xa-b sits outside the three-layer generated theme system that brikette already uses; hand-authored tokens in app CSS are unstructured and will drift as the theme evolves
Trigger-Intended-Outcome: type: operational | statement: xa-b has a @themes/xa-b package with assets/design-profile/theme-css-config, a generated tokens file, and a parity test suite matching the brikette pattern | source: operator
---

# xa-b Theme Token Compiler Retrofit — Fact-Find Brief

## Scope

### Summary
xa-b's theme tokens live entirely in hand-authored app CSS files (`globals.css` and `xa-cyber-atelier.css`). The rest of the monorepo is migrating to a three-layer generated system (assets → design profile → ThemeCSSConfig → `generateThemeCSS()`). This work creates a new `@themes/xa-b` package, maps every existing custom property into the structured layers, and adds parity tests that prove the compiler output matches the committed CSS.

### Goals
- Create `packages/themes/xa-b/` with `assets.ts`, `design-profile.ts`, `theme-css-config.ts`, `recipes.ts`, and `index.ts`.
- Wire `generateThemeCSS()` to produce a `theme-tokens.generated.css` file consumed by `apps/xa-b/src/styles/`.
- Add a `generated-parity.test.ts` that passes at build-readiness gate.
- Add a `coverage-parity.test.ts` that maps every existing CSS custom property to a layer-1/2/3 source.
- Update `apps/xa-b/package.json` to add `@themes/xa-b` as a workspace dependency.
- Strip the raw token declarations from `xa-cyber-atelier.css` and `globals.css` once the generated file produces them.

### Non-goals
- Redesigning the xa-b colour palette or typography — this is a structural retrofit only.
- Adding dark-mode tokens that do not already exist in the current CSS.
- Migrating non-token CSS (component rules, layout helpers, typographic utilities) into the compiler.

### Constraints & Assumptions
- Constraints:
  - The generated CSS must be byte-for-byte equivalent on all custom property values (same test pattern used by brikette).
  - `@themes/xa-b` must not exist yet — confirmed: no `packages/themes/xa-b/` directory.
  - The compiler (`generateThemeCSS`) is light-mode `:root` + `.dark` — xa-b uses `html.theme-dark` not `.dark`; this selector difference must be resolved.
  - xa-b uses `hsl()` wrapping at consumption sites — tokens store raw HSL triplets (same pattern as base theme tokens).
  - `apps/xa-b/tailwind.config.mjs` delegates entirely to `@acme/tailwind-config` — no local theme extensions to port.
- Assumptions:
  - The swatch tokens in `globals.css` `:root` are brand assets (Layer 1).
  - The gate theme vars (`.xa-gate-theme`) are app-level component classes, not compiler-generated tokens.
  - The `xa-fab-*` vars are brand assets (chromatic accent, described in a comment as a deliberate contrast choice).
  - The radius, elevation, surface, and semantic color tokens in `xa-cyber-atelier.css` belong in `derivedVars` within `ThemeCSSConfig` (not in `brandColors`) since they are design-system semantics, not brand color decisions.
  - The `--font-sans`, `--font-mono`, `--font-body`, `--font-heading-*` vars are brand font assets (Layer 1).

---

## Outcome Contract

- **Why:** xa-b tokens are hand-authored and isolated from the structured system; as the app grows, divergence from the compiler pattern will make maintenance harder and make agent-assisted theming work unreliable.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `@themes/xa-b` package exists with all three layers, `generateThemeCSS()` produces output that passes parity tests, and the app imports generated tokens instead of hand-authored `:root` blocks.
- **Source:** operator

---

## Current Process Map

None: local code path only. Token authoring is static — a developer edits `xa-cyber-atelier.css` directly. No generation step, no tests, no CI gate on token correctness.

### Process Areas
| Area | Current step-by-step flow | Owners / systems / handoffs | Evidence refs | Known issues |
|---|---|---|---|---|
| Token authoring | Developer edits `xa-cyber-atelier.css` and/or `globals.css` by hand | Developer | `apps/xa-b/src/app/xa-cyber-atelier.css` | No parity test; easy to drift |
| CSS delivery | Next.js bundles the CSS at build time | Next.js / Turbopack | `apps/xa-b/src/app/globals.css` (imports atelier file) | No validation step |

---

## Evidence Audit (Current State)

### Entry Points
- `apps/xa-b/src/app/globals.css` — imports base tokens, ui styles, `xa-cyber-atelier.css`, and declares swatch `:root` block and gate theme classes
- `apps/xa-b/src/app/xa-cyber-atelier.css` — all semantic custom properties: color, font, radius, elevation, surface, FAB accent, and dark-mode overrides

### Key Modules / Files
- `apps/xa-b/src/app/globals.css` — 144 lines; `:root` block (lines 12–29) = 16 swatch vars + utility classes
- `apps/xa-b/src/app/xa-cyber-atelier.css` — 280 lines; main `:root` block (lines 4–68) + `html.theme-dark` block (lines 70–112)
- `apps/xa-b/tailwind.config.mjs` — 2 lines; delegates entirely to `@acme/tailwind-config`
- `packages/themes/base/src/build-theme-css.ts` — the `generateThemeCSS()` compiler; produces `:root` and `.dark` blocks
- `packages/themes/brikette/src/theme-css-config.ts` — reference implementation of `ThemeCSSConfig`
- `packages/themes/brikette/__tests__/generated-parity.test.ts` — test pattern to replicate
- `packages/themes/brikette/__tests__/coverage-parity.test.ts` — coverage bridge test pattern to replicate
- `packages/themes/brikette/package.json` — package scaffold to replicate

### Token Surface — Full Inventory

#### globals.css `:root` (16 vars — brand swatches, Layer 1)
```
--xa-swatch-black: #0f0f0f
--xa-swatch-ivory: #f3f0e8
--xa-swatch-cream: #f4efe4
--xa-swatch-camel: #b88963
--xa-swatch-brown: #7c5a41
--xa-swatch-navy: #1f2a44
--xa-swatch-gold: #d3b26a
--xa-swatch-graphite: #3b3f46
--xa-swatch-tan: #c08a58
--xa-swatch-charcoal: #2b2d31
--xa-swatch-bone: #efe9dd
--xa-swatch-silver: #c9c9c9
--xa-swatch-indigo: #2d3c5a
--xa-swatch-white: #ffffff
--xa-swatch-fallback: #e5e5e5
--xa-swatch-filter-fallback: #f5f5f5
```

#### xa-cyber-atelier.css `:root` (light mode — 56 vars)

**Semantic color tokens (design-system semantics → `derivedVars.light`):**
```
--color-bg: 0 0% 100%
--color-fg: 0 0% 8%
--color-fg-muted: 0 0% 42%
--color-muted: 0 0% 96%
--color-muted-fg: 0 0% 20%
--color-muted-border: 0 0% 86%
--color-panel: 0 0% 98%
--color-border: 0 0% 88%
--color-border-muted: 0 0% 92%
--color-border-strong: 0 0% 75%
--border-control: 0 0% 55%
--surface-1: 0 0% 100%
--surface-2: 0 0% 98%
--surface-3: 0 0% 95%
--surface-input: 0 0% 100%
--color-primary: 0 0% 6%
--color-primary-fg: 0 0% 100%
--color-primary-soft: 0 0% 96%
--color-primary-hover: 0 0% 10%
--color-primary-active: 0 0% 0%
--color-accent: 0 0% 12%
--color-accent-fg: 0 0% 100%
--color-accent-soft: 0 0% 96%
--color-link: 0 0% 8%
--border-1: 0 0% 0% / 0.08
--border-2: 0 0% 0% / 0.12
--border-3: 0 0% 0% / 0.18
--color-focus-ring: 0 0% 0%
--ring: 0 0% 0%
--ring-offset: 0 0% 100%
--color-selection: 0 0% 90%
--color-highlight: 0 0% 96%
```

**Radius tokens (design constants → `derivedVars.light`):**
```
--radius-xs: 1px
--radius-sm: 2px
--radius-md: 3px
--radius-lg: 4px
--radius-xl: 6px
--radius-2xl: 10px
--radius-3xl: 12px
--radius-4xl: 16px
```

**Elevation tokens (design constants → `derivedVars.light`):**
```
--elevation-1: 0 1px 2px rgba(0, 0, 0, 0.04)
--elevation-2: 0 3px 8px rgba(0, 0, 0, 0.08)
--elevation-3: 0 6px 16px rgba(0, 0, 0, 0.1)
--elevation-4: 0 10px 24px rgba(0, 0, 0, 0.12)
--elevation-5: 0 16px 32px rgba(0, 0, 0, 0.14)
```

**Font vars (brand asset → `fontVarMap`):**
```
--font-sans: var(--font-atelier-sans, "Work Sans", "Helvetica Neue", Arial, sans-serif)
--font-mono: var(--font-atelier-mono, "IBM Plex Mono", ui-monospace, monospace)
--font-body: var(--font-sans)
--font-heading-1: var(--font-sans)
--font-heading-2: var(--font-sans)
```

**FAB accent vars (brand chromatic accent → `brandColors`):**
```
--xa-fab-bg: 158 18% 30%
--xa-fab-fg: 0 0% 100%
--xa-fab-hover: 158 18% 24%
```

**Token count: 56 vars in `:root`, 16 in `globals.css` `:root` = 72 total light-mode vars.**

#### xa-cyber-atelier.css `html.theme-dark` (dark mode — 34 vars)
```
--color-bg: 0 0% 6%
--color-fg: 0 0% 92%
--color-fg-muted: 0 0% 60%
--color-muted: 0 0% 12%
--color-muted-fg: 0 0% 88%
--color-muted-border: 0 0% 22%
--color-panel: 0 0% 10%
--color-border: 0 0% 24%
--color-border-muted: 0 0% 18%
--color-border-strong: 0 0% 38%
--border-control: 0 0% 50%
--surface-1: 0 0% 8%
--surface-2: 0 0% 10%
--surface-3: 0 0% 12%
--surface-input: 0 0% 14%
--color-primary: 0 0% 96%
--color-primary-fg: 0 0% 8%
--color-primary-soft: 0 0% 16%
--color-primary-hover: 0 0% 90%
--color-primary-active: 0 0% 100%
--color-accent: 0 0% 88%
--color-accent-fg: 0 0% 10%
--color-accent-soft: 0 0% 14%
--color-link: 0 0% 92%
--border-1: 0 0% 100% / 0.08
--border-2: 0 0% 100% / 0.14
--border-3: 0 0% 100% / 0.22
--color-focus-ring: 0 0% 100%
--ring: 0 0% 100%
--ring-offset: 0 0% 8%
--color-selection: 0 0% 24%
--color-highlight: 0 0% 12%
--xa-fab-bg: 158 14% 68%
--xa-fab-fg: 0 0% 8%
--xa-fab-hover: 158 14% 74%
```

Note: elevation and radius tokens are light-mode only (no dark overrides needed — geometry/shadow scale doesn't change).

### Patterns & Conventions Observed
- Achromatic palette — virtually all semantic colors are `0 0% <L>%` (greyscale HSL triplets); only FAB accent uses chromatic hue — evidence: `xa-cyber-atelier.css` lines 4–68
- Dark-mode selector is `html.theme-dark` NOT `.dark` — this is different from the brikette pattern which uses `.dark`. The compiler emits `.dark` by default. This is the biggest structural gap.
- Swatches in `globals.css` use hex values; semantic tokens use raw HSL triplets (no `hsl()` wrapper) — consumed with `hsl(var(--token))` at call sites
- No keyframe definitions — Tailwind's `tw-animate-css` is imported; xa-b doesn't define custom keyframes
- No gradient assets — header is achromatic surface-1, no brand gradient system
- No Tailwind theme extensions in `tailwind.config.mjs` — pure delegation to shared config

### Data & Contracts
- Types/schemas/events:
  - `ThemeCSSConfig` — `packages/themes/base/src/build-theme-css.ts`
  - `ThemeAssets` — `packages/themes/base/src/theme-expression.ts`
  - `DesignProfile` — `packages/themes/base/src/theme-expression.ts`
- Persistence:
  - Generated file: `apps/xa-b/src/styles/theme-tokens.generated.css` (to be created)
- API/contracts:
  - `generateThemeCSS({ assets, profile, config })` — returns CSS string; must produce output matching the committed generated file (parity test pattern)

### Dependency & Impact Map
- Upstream dependencies:
  - `packages/themes/base` — provides `generateThemeCSS`, `ThemeCSSConfig`, `ThemeAssets`, `DesignProfile` types
  - `@themes/base` workspace alias — already in `apps/xa-b/package.json`
- Downstream dependents:
  - `apps/xa-b/src/app/globals.css` — must be updated to import generated file and remove inline `:root` block
  - `apps/xa-b/src/app/xa-cyber-atelier.css` — `:root` and `html.theme-dark` blocks removed after generation
  - All components consuming `--xa-*`, `--color-*`, `--border-*`, `--surface-*`, `--font-*`, `--radius-*`, `--elevation-*` vars — no change needed (var names stay the same)
- Likely blast radius:
  - Zero visual change if parity test passes
  - Package.json and pnpm-lock.yaml updated for new workspace dependency
  - CI: new test suite added under `packages/themes/brikette` pattern

---

## ThemeCSSConfig Mapping Design

The xa-b token surface splits cleanly across `ThemeCSSConfig` fields:

### `colorVarMap` — brand chromatic swatches (16 entries)
The 16 `--xa-swatch-*` vars map to `brandColors` entries. CSS var names stay as-is:
```
xaSwatchBlack → "xa-swatch-black"   (#0f0f0f, light-only)
xaSwatchIvory → "xa-swatch-ivory"   (#f3f0e8, light-only)
... (all 16 swatches, static / no dark variant)
```
FAB accent (3 vars — chromatic, has dark variant):
```
xaFabBg    → "xa-fab-bg"    (light: hsl(158 18% 30%), dark: hsl(158 14% 68%))
xaFabFg    → "xa-fab-fg"    (light: white, dark: near-black)
xaFabHover → "xa-fab-hover" (light: darker green, dark: lighter green)
```

Note: the 72 semantic color/surface/border/font/radius/elevation tokens all go into `derivedVars` because they are achromatic design-system semantics with specific light/dark pairs, not "brand colors" in the assets sense. This avoids abusing `brandColors` for non-brand values.

### `fontVarMap` — 2 entries (body, mono)
```
body → "font-sans"   (Work Sans stack)
mono → "font-mono"   (IBM Plex Mono stack)
```
`--font-body`, `--font-heading-1`, `--font-heading-2` are derived aliases of `var(--font-sans)` → go into `derivedVars.light`.

### `derivedVars.light` — ~54 entries
All semantic color tokens, surface tokens, border tokens, radius tokens, elevation tokens, and font aliases. These are constant values with no brand color asset source.

### `derivedVars.dark` — ~32 entries
All dark-mode overrides from `html.theme-dark` block.

### Dark-mode selector gap (critical)
`generateThemeCSS()` emits `.dark { ... }` as the dark-mode selector. xa-b uses `html.theme-dark`. Two resolution paths:

**Option A:** Change the dark-mode selector in the generated CSS by either:
  - Post-processing the compiler output (string replace `.dark` → `html.theme-dark`) in the build script
  - Adding a `darkSelector` parameter to `generateThemeCSS()` or `ThemeCSSConfig`

**Option B:** Change `html.theme-dark` in `xa-cyber-atelier.css` to use `.dark` class instead (aligning with the rest of the monorepo).

Option B is cleaner (one pattern across all apps) but requires verifying the JS that applies the dark class — if it sets `html.classList.add('theme-dark')`, it must be changed to `html.classList.add('dark')`. Option A preserves backward compat with zero JS changes.

Recommendation: resolve this during planning by checking which JS/component toggles the dark class.

---

## Gap Analysis

| Gap | Severity | Resolution |
|---|---|---|
| No `@themes/xa-b` package exists | Required | Create from scratch following `@themes/brikette` scaffold |
| Dark-mode selector mismatch (`html.theme-dark` vs `.dark`) | Critical | Option A (post-process) or Option B (align selectors) — decision needed |
| No generated CSS file exists | Required | Create `apps/xa-b/src/styles/theme-tokens.generated.css` |
| No parity tests exist | Required | Add `generated-parity.test.ts` + `coverage-parity.test.ts` |
| FAB accent tokens store HSL triplets (not hex) — `hexToRgbTriplet()` won't parse them | Design choice | Store as `string` in `brandColors` (not `BrandColor`), emit directly via `colorVarMap` |
| `@themes/xa-b` not in `apps/xa-b/package.json` | Required | Add `"@themes/xa-b": "workspace:*"` |
| Swatch tokens in `globals.css` not in `xa-cyber-atelier.css` — two source files | Complexity | Consolidate into single generated file; strip both source `:root` blocks |

---

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | All token vars consumed by components via `hsl(var(--token))` | Parity test is the gate; visual regression only if test passes but compiler is wrong | Yes — confirm parity test covers all 72+ vars |
| UX / states | N/A | Dark mode already works via `html.theme-dark` | Selector gap is a risk if Option B chosen | Yes — dark mode selector decision |
| Security / privacy | N/A | Theme tokens only | None | No |
| Logging / observability / audit | N/A | Build-time generation; no runtime side-effects | None | No |
| Testing / validation | Required | No existing tests on xa-b tokens | Add generated-parity + coverage-parity tests | Yes — testing strategy below |
| Data / contracts | Required | `ThemeCSSConfig` schema | FAB HSL triplet format not supported by `hexToRgbTriplet` | Yes — need handling for non-hex values |
| Performance / reliability | N/A | Generated CSS is static file; no runtime cost | None | No |
| Rollout / rollback | Required | CSS is imported at build time | Strip old `:root` blocks only after parity test passes | Yes |

---

## Testing Strategy

### Test Infrastructure
- Frameworks: Jest (matching brikette pattern; `packages/themes/brikette/jest.config.cjs`)
- Commands: `pnpm --filter @themes/xa-b test`
- CI integration: test suite runs in the existing `packages/themes` test job

### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| xa-b tokens | None | None | No tests exist |
| brikette generated parity | Unit | `packages/themes/brikette/__tests__/generated-parity.test.ts` | Reference pattern |
| brikette coverage parity | Unit | `packages/themes/brikette/__tests__/coverage-parity.test.ts` | Reference pattern |

### Coverage Gaps
- Untested paths: All xa-b token declarations
- Extinct tests: N/A

### Testability Assessment
- Easy to test:
  - Generated CSS parity (read file, run compiler, compare vars) — same pattern as brikette
  - Coverage bridge (every CSS var has a declared layer-1/2/3 source)
  - Swatch brand colors (all hex values; hex-to-RGB round-trip trivial)
- Hard to test:
  - FAB HSL triplet values in `brandColors` — if stored as strings, cannot auto-generate RGB triplets (xa-b doesn't appear to use `rgba(var(--rgb-xa-fab), alpha)` patterns anyway; rgb triplets may not be needed)
  - Dark-mode selector correctness — parity test reads generated CSS and compares; if selector differs, parity test must account for it

### Recommended Test Approach
- Unit tests for:
  - `generated-parity.test.ts` — `generateThemeCSS()` output matches `theme-tokens.generated.css` (both `:root` and dark selector blocks)
  - `coverage-parity.test.ts` — every var in both source CSS files is accounted for in assets/profile/derivedVars
- Integration tests for: N/A
- E2E tests for: N/A (visual correctness = parity test at build time)
- Contract tests for: N/A

---

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Dark-mode selector mismatch causes dark mode to break | High (if ignored) | High | Decide Option A vs B before building; test dark mode manually after deploy |
| FAB HSL triplet format not parseable by `hexToRgbTriplet()` | High | Low | Store as `string` literal in `brandColors`; skip RGB triplet generation for these (xa-b doesn't appear to use rgba() with fab vars) |
| New package scaffold errors (tsconfig, jest config, package.json) | Medium | Low | Copy brikette scaffold exactly; only change name/paths |
| Swatch tokens in separate `globals.css` `:root` are missed by parity test | Medium | Medium | Parity test must read both source files combined, or move swatches to `xa-cyber-atelier.css` before stripping |
| Removing hand-authored `:root` blocks before parity test is green | Low (if ordered correctly) | High | Build order: write package → write generated file → write tests → make tests pass → strip old blocks |

---

## Questions

### Resolved
- Q: Does a `@themes/xa-b` package already exist?
  - A: No. `packages/themes/` contains: base, bcd, brandx, brikette, caryina, dark, dummy, prime, reception. No xa-b.
  - Evidence: `ls /Users/petercowling/base-shop/packages/themes/`

- Q: Does xa-b have a dark mode?
  - A: Yes. `html.theme-dark` block in `xa-cyber-atelier.css` has 35 vars. It is NOT light-only.
  - Evidence: `apps/xa-b/src/app/xa-cyber-atelier.css` lines 70–112

- Q: Are there any Tailwind theme extensions that need porting?
  - A: No. `apps/xa-b/tailwind.config.mjs` is 2 lines; pure delegation to `@acme/tailwind-config`.
  - Evidence: `apps/xa-b/tailwind.config.mjs`

- Q: Does the compiler support non-hex brand color values (e.g. HSL strings)?
  - A: Partially. `brandColors` accepts `string | BrandColor`; `hexToRgbTriplet()` only parses hex. If HSL triplet values are stored in `brandColors`, RGB triplet generation is silently skipped (returns null). This is acceptable for xa-b since FAB vars are not consumed with rgba() patterns.
  - Evidence: `packages/themes/base/src/build-theme-css.ts` lines 76–96

- Q: What does the swatch `globals.css` `:root` block feed? Are the vars consumed in components?
  - A: The `--xa-swatch-*` vars are consumed in product swatch rendering (color filter selectors). They are brand assets (Layer 1) but static/light-only since dark mode doesn't change swatch identity colors.
  - Evidence: naming convention (`--xa-swatch-{colorname}`) and the fallback vars `--xa-swatch-fallback` / `--xa-swatch-filter-fallback`

### Open (Operator Input Required)

- Q: Should the dark-mode selector be unified to `.dark` (Option B) or should the compiler output be post-processed to emit `html.theme-dark` (Option A)?
  - Why operator input is required: This depends on whether the JS dark-mode toggle targets `.dark` class on `<html>` or `theme-dark` class. The agent cannot determine which React/JS component applies the class without inspecting runtime behaviour or additional source files.
  - Decision impacted: Whether app JS must also be updated (Option B) or only the CSS generation post-step (Option A).
  - Decision owner: Peter Cowling
  - Default assumption (if any) + risk: Default to Option A (post-process selector in build script); risk is a non-standard build step that future maintainers might not expect.

---

## Confidence Inputs

- Implementation: 85%
  - Evidence: full token surface mapped; brikette pattern is well-understood; only new-package scaffold and selector gap introduce uncertainty
  - To reach 90%: resolve dark-mode selector question
- Approach: 90%
  - Evidence: the three-layer mapping is clean; derivedVars covers all achromatic semantics; brandColors covers swatches and FAB
  - To reach 95%: confirm FAB HSL triplet approach works (no RGB triplet usage in xa-b)
- Impact: 95%
  - Evidence: parity test is a binary gate; if it passes, no visual regression is possible
- Delivery-Readiness: 80%
  - Evidence: one open operator question (dark-mode selector); all other information is complete
  - To reach 90%: answer the open question
- Testability: 90%
  - Evidence: brikette test pattern is fully replicable; xa-b token surface is fully mapped
  - To reach 95%: confirm combined-file approach for parity test (swatches in `globals.css`, semantics in `xa-cyber-atelier.css`)

---

## Planning Constraints & Notes

- Must-follow patterns:
  - Package scaffold must match `packages/themes/brikette/` exactly: `src/assets.ts`, `src/design-profile.ts`, `src/recipes.ts`, `src/theme-css-config.ts`, `src/index.ts`, `package.json`, `jest.config.cjs`, `tsconfig.json`
  - Test files must match brikette test pattern: `__tests__/generated-parity.test.ts` + `__tests__/coverage-parity.test.ts`
  - Package name: `@themes/xa-b` (following `@themes/brikette` naming)
  - Generated file path: `apps/xa-b/src/styles/theme-tokens.generated.css`
  - Strip old `:root`/`html.theme-dark` blocks from CSS only after tests are green
- Rollout/rollback expectations:
  - No runtime changes — generated CSS replaces hand-authored blocks
  - Rollback = revert generated file and re-add inline blocks (trivial)
- Observability expectations:
  - Parity test failure = CI red; no other observability needed for a CSS token swap

---

## Suggested Task Seeds (Non-binding)

1. Create `packages/themes/xa-b/` directory with `package.json`, `tsconfig.json`, `jest.config.cjs`
2. Write `src/assets.ts` — 16 swatch `brandColors` (hex, light-only) + 3 FAB brand colors (HSL, light+dark)
3. Write `src/design-profile.ts` — achromatic minimal profile (Work Sans body, flat elevation, sharp radii, monochromatic strategy)
4. Write `src/theme-css-config.ts` — `colorVarMap` for swatches+FAB, `fontVarMap` for sans/mono, `derivedVars.light` for all 54 semantic tokens, `derivedVars.dark` for all 34 dark-mode overrides
5. Write `src/recipes.ts` — gate theme, support dock, panel, PDP (app-level compositions; metadata only)
6. Generate `apps/xa-b/src/styles/theme-tokens.generated.css` by running the compiler
7. Add `globals.css` import of generated file; remove old `:root` block
8. Handle dark-mode selector (Option A or B per operator decision)
9. Write `__tests__/generated-parity.test.ts` — reads generated file, runs compiler, compares all vars
10. Write `__tests__/coverage-parity.test.ts` — bridges every CSS var to a layer-1/2/3 source
11. Add `"@themes/xa-b": "workspace:*"` to `apps/xa-b/package.json`
12. Make CI green

---

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - `@themes/xa-b` package exists with all source files
  - `apps/xa-b/src/styles/theme-tokens.generated.css` exists and is committed
  - `generated-parity.test.ts` passes: all vars present + values match
  - `coverage-parity.test.ts` passes: all CSS vars accounted for
  - `apps/xa-b` builds without errors (`pnpm --filter @apps/xa-b typecheck`)
  - Old inline `:root` blocks removed from CSS files
- Post-delivery measurement plan: n/a (structural/infra change; no runtime metrics)

---

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Full token surface mapping | Yes | Dark-mode selector mismatch (`html.theme-dark` vs `.dark`) | Yes — operator decision required |
| FAB HSL triplet format | Yes | `hexToRgbTriplet` won't parse; RGB triplets not needed for xa-b | No — store as string, skip RGB gen |
| Swatch token location (globals.css) | Yes | Separate file means parity test must combine both sources | No — follow brikette pattern of reading both files |
| Package scaffold | Yes | None — brikette is a clean template | No |
| Tailwind config | Yes | No local extensions; nothing to port | No |
| Test pattern | Yes | Coverage bridge must handle `derivedVars` vars (not in brandColors) | No — brikette already shows this pattern |
