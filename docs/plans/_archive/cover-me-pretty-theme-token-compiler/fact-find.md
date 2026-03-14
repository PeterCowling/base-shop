---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: cover-me-pretty-theme-token-compiler
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Trigger-Why: Brikette has a working three-layer generated theme token system. cover-me-pretty is a simpler light-mode-only app with ~37 tokens. Retrofitting it brings it into parity with the platform pattern and makes future brand updates safe and auditable.
Trigger-Intended-Outcome: type: operational | statement: cover-me-pretty has a packages/themes/cover-me-pretty package with assets.ts, design-profile.ts, and theme-css-config.ts; a generate-theme-tokens script; and a generated CSS file imported by globals.css, with a parity test proving the compiler output matches the generated file. | source: operator
---

# cover-me-pretty Theme Token Compiler Retrofit — Fact-Find Brief

## Scope

### Summary

cover-me-pretty's `globals.css` imports `@themes/base/tokens.css` (the shared design-system base token layer) but has no app-specific token block. Brand colours and fonts flow through layout.tsx via Next.js Google Font variables (`--font-geist-sans`, `--font-geist-mono`), and `shop.json` declares `themeId: "base"` — meaning the app currently has no custom brand token file at all.

The retrofit creates `packages/themes/cover-me-pretty/` with the three-layer structure, a generation script, a committed generated CSS file, and a parity test — following the exact brikette pattern. Because cover-me-pretty is light-mode only (no `.dark` block needed) and has a small token surface (fewer than the ~37 token entries in caryina's `tokens.css`), this is the simplest possible retrofit case.

### Goals

- Create `packages/themes/cover-me-pretty/` with `assets.ts`, `design-profile.ts`, and `theme-css-config.ts`
- Add a generation script `scripts/cover-me-pretty/generate-theme-tokens.ts` analogous to the brikette generator
- Produce a committed `apps/cover-me-pretty/src/app/theme-tokens.generated.css` imported by `globals.css`
- Write a parity test in `packages/themes/cover-me-pretty/__tests__/generated-parity.test.ts` that asserts the compiler output matches the committed generated file (mirroring brikette's `generated-parity.test.ts`)
- Register the new package in `pnpm-lock.yaml` / `package.json` workspace

### Non-goals

- Dark mode support — cover-me-pretty has no `.dark` block and no dark-mode variant requirement
- Recipes layer — no custom component recipes needed; brikette's recipe layer is specific to its gradient/CTA pattern
- Migrating existing Geist font variables — layout.tsx loads Geist fonts via Next.js; those variables remain and are not part of the brand token system
- Changing any component code — this is a pure infrastructure/tooling change

### Constraints & Assumptions

- Constraints:
  - cover-me-pretty uses webpack (not Turbopack) per MEMORY.md; no Turbopack alias concerns
  - `@themes/base` is already in `apps/cover-me-pretty/package.json` dependencies — no new dep needed at the app level
  - The generated CSS file must be imported via a relative path in `globals.css` (the same pattern as brikette's `@import "./theme-tokens.generated.css"`)
  - `packages/themes/cover-me-pretty/` must add `@themes/base` as a workspace dependency (same as brikette's package.json pattern)
- Assumptions:
  - The token surface is what's in `packages/themes/caryina/src/tokens.css` — 15 semantic variables (`--color-bg`, `--color-fg`, `--color-fg-muted`, `--color-primary`, `--color-primary-fg`, `--color-primary-soft`, `--color-primary-hover`, `--color-primary-active`, `--color-accent`, `--color-accent-fg`, `--color-accent-soft`, `--color-border`, `--color-border-muted`, `--color-border-strong`, `--color-surface`, `--font-sans`, `--font-heading`, `--radius-sm`, `--radius-md`, `--radius-lg`) — actually 20 declarations. These override the base token defaults.
  - Since there is currently **no** app-specific `:root` token block in cover-me-pretty's globals.css, the generated file will introduce a new token override layer. Token values will be derived from the brand identity implied by the app name ("cover me pretty" — cosmetics/fashion) unless the operator supplies specific hex values.
  - Because no hand-authored token block exists to parity-test against, the parity test will compare `generateThemeCSS()` output against the **committed generated file** (same approach as brikette's `generated-parity.test.ts`) rather than against an existing globals.css block.

## Outcome Contract

- **Why:** Brikette has proven the three-layer compiler pattern. cover-me-pretty is the next simplest app to retrofit. Doing so brings it into the platform standard before brand colours are needed for a campaign or redesign.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A new `packages/themes/cover-me-pretty/` package exists with the three-layer files; a generation script can be run to regenerate the committed CSS file; a passing parity test proves the compiler output is consistent with what is committed; globals.css imports the generated file.
- **Source:** operator

## Current Process Map

None: local code path only.

The change adds new files (package, scripts, test, generated CSS, globals.css import line). No multi-step operator process, CI lane, or approval path is affected. The new package participates in the existing pnpm workspace build graph but adds no new build step to CI (the parity test runs under Jest in the existing test suite).

## Evidence Audit (Current State)

### Entry Points

- `apps/cover-me-pretty/src/app/globals.css` — sole CSS entry point; imports `@themes/base/tokens.css` and shared UI styles; no app-specific `:root` block
- `apps/cover-me-pretty/src/app/layout.tsx` — loads Google Geist fonts via Next.js; sets `--font-geist-sans` and `--font-geist-mono` CSS variables on `<html>`
- `apps/cover-me-pretty/shop.json` — declares `themeId: "base"` (no custom theme)

### Key Modules / Files

- `packages/themes/base/src/build-theme-css.ts` — the `generateThemeCSS()` compiler; accepts `ThemeCSSConfig` and returns a `:root { }` block string (and `.dark { }` if dark overrides exist)
- `packages/themes/base/src/index.ts` — exports `generateThemeCSS`, `ThemeCSSConfig`, `ThemeAssets`, `DesignProfile`, `hexToRgbTriplet`
- `packages/themes/brikette/src/assets.ts` — reference implementation of `ThemeAssets`
- `packages/themes/brikette/src/design-profile.ts` — reference implementation of `DesignProfile`
- `packages/themes/brikette/src/theme-css-config.ts` — reference implementation of `ThemeCSSConfig` (colorVarMap, fontVarMap, rgbVarMap, derivedVars)
- `packages/themes/brikette/__tests__/generated-parity.test.ts` — the test to replicate; reads committed generated CSS, runs compiler, diffs vars presence and values in `:root` and `.dark`
- `packages/themes/brikette/__tests__/coverage-parity.test.ts` — complementary coverage test (optional to replicate; lower priority for simple retrofit)
- `packages/themes/brikette/package.json` — package.json pattern to follow: `name: "@themes/brikette"`, exports map, `@themes/base` dep
- `scripts/brikette/generate-theme-tokens.ts` — generation script pattern; writes to `apps/brikette/src/styles/theme-tokens.generated.css`
- `apps/brikette/src/styles/global.css` — shows the `@import "./theme-tokens.generated.css"` pattern after base tokens import
- `packages/themes/caryina/src/tokens.css` — a smaller, simpler theme token set (20 declarations, light-only like cover-me-pretty needs); useful as a size reference

### Token Surface — Full Inventory

cover-me-pretty currently has **no app-specific CSS custom properties**. The app relies entirely on:

1. `@themes/base/tokens.css` defaults (the shared 200+ token base layer)
2. Next.js Geist font variables (`--font-geist-sans`, `--font-geist-mono`)

The **target token surface** for the generated file (what needs to be defined in `assets.ts` + `theme-css-config.ts`) is the brand override set. Based on the caryina pattern (the simplest existing theme), the minimal viable set is:

| CSS custom property | Source layer | Notes |
|---|---|---|
| `--color-bg` | `derivedVars.light` | HSL triplet — page background |
| `--color-fg` | `derivedVars.light` | HSL triplet — page foreground text |
| `--color-fg-muted` | `derivedVars.light` | HSL triplet |
| `--color-primary` | `colorVarMap` via `brandColors.primary` | Brand primary hex |
| `--color-primary-fg` | `colorVarMap` | Foreground on primary |
| `--color-primary-soft` | `colorVarMap` | Light tint of primary |
| `--color-primary-hover` | `colorVarMap` | Hover shade |
| `--color-primary-active` | `colorVarMap` | Active shade |
| `--color-accent` | `colorVarMap` via `brandColors.accent` | Second brand color |
| `--color-accent-fg` | `colorVarMap` | Foreground on accent |
| `--color-accent-soft` | `colorVarMap` | Light tint of accent |
| `--color-border` | `derivedVars.light` | Border colour |
| `--color-border-muted` | `derivedVars.light` | Subtle border |
| `--color-border-strong` | `derivedVars.light` | Emphatic border |
| `--color-surface` | `colorVarMap` via `brandColors.surface` | Card/panel surface |
| `--font-sans` | `fontVarMap` via `assets.fonts.body` | Body font family |
| `--font-heading` | `fontVarMap` via `assets.fonts.heading` | Heading font family |
| `--radius-sm` | `derivedVars.light` | 2px |
| `--radius-md` | `derivedVars.light` | 4px |
| `--radius-lg` | `derivedVars.light` | 8px |

That is 20 token declarations — all light-mode, no `.dark` block required. No RGB triplet vars (no `rgba()` usage detected in globals.css). No derived gradient or layering vars.

**Key simplifications vs brikette:**
- No `rgbVarMap` needed (no `rgba(var(--rgb-brand-*), …)` usage in the app)
- No `derivedVars.dark` block (light-mode only)
- No gradient assets or recipe layer
- Font vars map to `--font-sans` and `--font-heading` (same pattern as caryina)

### Patterns & Conventions Observed

- brikette pattern: generate script writes `theme-tokens.generated.css`; globals.css does `@import "./theme-tokens.generated.css"` immediately after base tokens; parity test reads the committed file and diffs against compiler output
- Package naming: `@themes/<appname>` (e.g. `@themes/brikette`, `@themes/caryina`)
- Package exports: `.`, `./assets`, `./design-profile`, `./theme-css-config` — the build entry (`src/index.ts`) re-exports all three
- `ThemeCSSConfig` requires: `assets`, `profile`, `colorVarMap`, `fontVarMap`; optionally `rgbVarMap`, `derivedVars`
- Tokens that cannot flow through `colorVarMap` (because they are HSL triplets consumed via `hsl(var(--token))`, not direct hex) go into `derivedVars.light`
- The generator script path: `scripts/<appname>/generate-theme-tokens.ts`
- Registered as a pnpm script in `scripts/package.json` (pattern: `"<appname>:generate-theme-tokens": "tsx scripts/<appname>/generate-theme-tokens.ts"`)

### Dependency & Impact Map

- Upstream dependencies:
  - `@themes/base` (already in `apps/cover-me-pretty/package.json`) — needed in new package too
  - `packages/themes/cover-me-pretty/` → `@themes/base` (workspace dep)
- Downstream dependents:
  - `apps/cover-me-pretty/src/app/globals.css` — will import the generated file
  - `packages/themes/cover-me-pretty/__tests__/generated-parity.test.ts` — new test that depends on the generated CSS file being committed
- Likely blast radius:
  - Confined to the new package and the single `globals.css` import line — no component code touched

### Data & Contracts

- Types/schemas/events:
  - `ThemeAssets` from `@themes/base` — `fonts`, `gradients`, `shadows`, `keyframes`, `brandColors`
  - `DesignProfile` from `@themes/base` — `typography`, `motion`, `space`, `surface`, `components`, `guidance`
  - `ThemeCSSConfig` from `@themes/base/build-theme-css` — `colorVarMap`, `fontVarMap`, `rgbVarMap?`, `derivedVars?`
  - `GenerateThemeCSSOptions` — `{ assets, profile, config }` → `string`
- Persistence: generated CSS file committed to source tree (same as brikette)
- API/contracts: none (pure compile-time generation)

## Test Landscape

### Test Infrastructure

- Frameworks: Jest (CJS preset via `@acme/config/jest.preset.cjs`)
- Commands: `pnpm --filter @apps/cover-me-pretty test` (runs `jest.config.cjs` rooted at repo root)
- CI integration: standard Jest run in CI pipeline

### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| cover-me-pretty app | Jest (various) | `apps/cover-me-pretty/src/**/*.test.{ts,tsx}` | Existing app tests; no theme-related tests |
| brikette theme parity | Jest | `packages/themes/brikette/__tests__/generated-parity.test.ts` | Reference implementation to replicate |
| brikette theme coverage | Jest | `packages/themes/brikette/__tests__/coverage-parity.test.ts` | Complementary coverage test |

### Coverage Gaps

- Untested paths:
  - No test currently validates that cover-me-pretty's theme tokens are correctly generated
  - No test validates that a change to `assets.ts` or `theme-css-config.ts` doesn't silently drift from the committed CSS

### Testability Assessment

- Easy to test:
  - Parity test: read the committed generated CSS, run `generateThemeCSS()`, diff the `:root` block var-by-var — identical to the brikette pattern, copy-adaptable
  - The test needs to live in `packages/themes/cover-me-pretty/__tests__/` and the jest roots must include this path (or use the monorepo root jest config)
- Hard to test:
  - Nothing is hard to test for this scope
- Test seams needed:
  - The generated CSS file must be committed before the parity test can run (test reads from disk). The workflow: write assets → run generator → commit generated file → write test.

### Recommended Test Approach

- Unit tests for: `generateThemeCSS()` called with cover-me-pretty config — assert all expected CSS vars are present and values match the committed file
- Integration tests for: none (no runtime integration required)
- E2E tests for: none
- Contract tests for: none

**The parity test is the primary and sufficient test. It must:**
1. Read `apps/cover-me-pretty/src/app/theme-tokens.generated.css` from disk
2. Parse the `:root` block vars
3. Call `generateThemeCSS({ assets, profile, config: themeCSSConfig })`
4. Parse the generated `:root` block
5. Assert every var in the committed file exists in the generated output and values match (case-insensitive normalised)
6. Assert no unexpected extra vars in generated output (inverse check)

No `.dark` block tests needed (light-mode only).

**Jest roots:** The test file is in `packages/themes/cover-me-pretty/__tests__/`. The brikette tests run from `packages/themes/brikette/__tests__/` and are picked up by the root jest config. The cover-me-pretty `jest.config.cjs` only covers `apps/cover-me-pretty/src` and `apps/cover-me-pretty/__tests__`. The new parity test needs to be discoverable by either the root config or a new jest config in `packages/themes/cover-me-pretty/`. **Recommended:** follow brikette's approach and add a `jest.config.cjs` in `packages/themes/cover-me-pretty/` pointing roots at `__tests__`, then verify it is included in the monorepo test sweep.

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | No app-specific `:root` block in globals.css; tokens fall through to base defaults | Generated file introduces new token overrides — must match intended brand values | Yes — operator must confirm hex values for brand colours |
| UX / states | N/A | No UX state change | None | No |
| Security / privacy | N/A | CSS file generation; no auth, PII, or network | None | No |
| Logging / observability / audit | N/A | Pure compile-time generation | None | No |
| Testing / validation | Required | No theme parity tests exist for cover-me-pretty | Parity test must be written and must pass before generated file is declared canonical | Yes |
| Data / contracts | Required | `ThemeCSSConfig` type contract must be satisfied | Low risk — TypeScript will catch mismatches at compile time | No |
| Performance / reliability | N/A | Static CSS file; no runtime cost | None | No |
| Rollout / rollback | Required | New `@import` line in globals.css | If generated CSS introduces incorrect values, rollback is a one-line import removal + CSS file deletion | No — rollback is trivial |

## Questions

### Resolved

- Q: Does cover-me-pretty have any existing app-specific CSS custom properties that need to be replicated?
  - A: No. `globals.css` contains no `:root` block with custom properties — only utility classes and layout helpers. The generated file will introduce the brand token layer for the first time.
  - Evidence: `apps/cover-me-pretty/src/app/globals.css` (37 lines, zero `:root` var declarations)

- Q: Is dark mode required?
  - A: No. `shop.json` has `themeId: "base"`, layout.tsx has `<meta name="color-scheme" content="light dark">` but there is no `.dark` CSS block in globals.css and no dark-specific brand token usage. The ThemeModeProvider supports dark mode at the platform level, but cover-me-pretty has no custom dark overrides. Light-mode-only generated file is correct.
  - Evidence: `apps/cover-me-pretty/src/app/globals.css`, `apps/cover-me-pretty/src/app/layout.tsx`

- Q: Are RGB triplet vars (`--rgb-brand-*`) needed?
  - A: No. Unlike brikette which uses `rgba(var(--rgb-brand-primary), 0.10)` in shadow definitions, cover-me-pretty's globals.css has no such `rgba(var(--rgb-…))` patterns. No `rgbVarMap` needed.
  - Evidence: `apps/cover-me-pretty/src/app/globals.css` (no rgba pattern)

- Q: Where does `packages/themes/cover-me-pretty/` need to appear in Jest roots?
  - A: A `jest.config.cjs` in `packages/themes/cover-me-pretty/` pointing roots at `["<rootDir>/__tests__"]` with `rootDir` at the package directory follows the brikette pattern. The monorepo root jest config or CI must be confirmed to pick it up. If not, it can be added to the root `jest.config.cjs` roots array.
  - Evidence: `packages/themes/brikette/__tests__/generated-parity.test.ts` exists and runs in CI

- Q: Does `@themes/cover-me-pretty` need to be added to `apps/cover-me-pretty/package.json`?
  - A: Yes — to import `assets`, `profile`, and `themeCSSConfig` from the package in the generation script and test. However, the generation script lives in `scripts/`, not in the app, so the app itself may not need the dep. The generation script's own deps are managed at the `scripts` package level. The parity test in `packages/themes/cover-me-pretty/__tests__/` imports directly from `../src/`, so no cross-package dep needed from the app. Conclusion: app-level dep is not required; scripts package will need `@themes/cover-me-pretty` if the generator is registered there.
  - Evidence: `scripts/brikette/generate-theme-tokens.ts` imports `@themes/brikette` — scripts package has that as a dep

### Open (Operator Input Required)

- Q: What are the actual hex values for cover-me-pretty's brand colours?
  - Why operator input is required: the app currently has no brand colour definitions anywhere — no globals.css `:root` block, no token file. The operator must specify the intended palette.
  - Decision impacted: the content of `assets.ts` `brandColors`
  - Decision owner: operator / designer
  - Default assumption (if any) + risk: If values are not provided, planner can scaffold with placeholder values matching the cosmetics/fashion character implied by "cover me pretty" (pink-rose primary, soft sage accent) — but these must be confirmed before the generated CSS is considered canonical. The parity test will enforce whatever values are committed, so any placeholder is safe to iterate.

## Confidence Inputs

- Implementation: 95%
  - Evidence: brikette is a complete working reference; the pattern is fully understood; cover-me-pretty is simpler (no dark mode, no RGB triplets, no recipes). The only unknowns are the specific hex values for brand colours — but these don't affect the structural implementation.
  - To raise to >=98: operator confirms brand colour hex values before coding starts.
- Approach: 97%
  - Evidence: three-layer compiler pattern is proven; `generateThemeCSS()` already handles light-only output (it emits a `.dark` block only if `derivedVars.dark` is present and non-empty); all type contracts are clearly defined.
  - To raise to 100: confirm that Jest picks up `packages/themes/cover-me-pretty/__tests__/` in CI without config changes.
- Impact: 90%
  - Evidence: no component code is touched; risk is confined to the new `@import` line; worst case is a CSS regression limited to the app, easily rolled back.
  - To raise to >=95: run visual smoke test after deploying to confirm base token fallbacks are not disrupted.
- Delivery-Readiness: 90%
  - Evidence: all dependencies exist; brikette is a complete guide; the only blocker is brand colour confirmation.
  - To raise to >=95: operator supplies hex values.
- Testability: 98%
  - Evidence: the parity test pattern is copy-adaptable from brikette with minimal changes; no mocking required; deterministic file-based comparison.
  - To raise to 100: confirm jest roots include the new package.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Brand colour values not confirmed before build starts | Medium | Low — placeholders work; test enforces whatever is committed | Scaffold with placeholder values; plan task T1 explicitly asks operator to confirm hex values |
| Jest root for new package not auto-discovered | Low | Low — test doesn't run, caught in CI before merge | Add `jest.config.cjs` to package and verify in CI before marking done |
| New `@import` line breaks globals.css CSS cascade | Very Low | Medium — visual regression on cover-me-pretty | Generated file only sets CSS custom properties in `:root`; no cascade conflict possible |
| `@themes/cover-me-pretty` workspace dep missing from scripts package | Low | Low — generation script fails to run | Add dep to `scripts/package.json` and run `pnpm install` |

## Planning Constraints & Notes

- Must-follow patterns:
  - Package name: `@themes/cover-me-pretty`
  - Package structure: `src/assets.ts`, `src/design-profile.ts`, `src/theme-css-config.ts`, `src/index.ts`, `__tests__/generated-parity.test.ts`, `package.json`
  - Generated file path: `apps/cover-me-pretty/src/app/theme-tokens.generated.css`
  - Import location: immediately after `@import "@themes/base/tokens.css";` in globals.css
  - Generation script path: `scripts/cover-me-pretty/generate-theme-tokens.ts`
  - pnpm script: `"cover-me-pretty:generate-theme-tokens"` in `scripts/package.json`
  - Banner comment in generated CSS: same format as brikette (auto-generated warning, source paths, regenerate command)
- Rollout/rollback expectations:
  - No deploy gate — the change is a committed CSS file and new package; rollback is removing the `@import` line
  - Tests must pass before merging
- Observability expectations:
  - None — pure compile-time generation

## Suggested Task Seeds (Non-binding)

- T1: Operator confirms brand colour hex values (or planner scaffolds with fashion-appropriate placeholders with a clear TODO comment)
- T2: Create `packages/themes/cover-me-pretty/` — `package.json`, `src/assets.ts`, `src/design-profile.ts`, `src/theme-css-config.ts`, `src/index.ts`
- T3: Create `scripts/cover-me-pretty/generate-theme-tokens.ts`; register pnpm script; run script to produce `apps/cover-me-pretty/src/app/theme-tokens.generated.css`
- T4: Add `@import "./theme-tokens.generated.css"` to `apps/cover-me-pretty/src/app/globals.css`
- T5: Write `packages/themes/cover-me-pretty/__tests__/generated-parity.test.ts` (adapt from brikette); add `jest.config.cjs` if needed; confirm test passes
- T6: Typecheck and lint the new package

## Execution Routing Packet

- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - none
- Deliverable acceptance package:
  - `packages/themes/cover-me-pretty/` exists with all four src files and the parity test
  - `apps/cover-me-pretty/src/app/theme-tokens.generated.css` committed
  - `apps/cover-me-pretty/src/app/globals.css` has the import
  - Parity test passes
  - Typecheck passes
- Post-delivery measurement plan:
  - Visual smoke test of cover-me-pretty local dev confirming no CSS regression

## Evidence Gap Review

### Gaps Addressed

- Confirmed: no existing `:root` block in globals.css — the generated file is additive, not replacing anything
- Confirmed: light-mode only — no `.dark` block needed
- Confirmed: no RGB triplet vars needed
- Confirmed: brikette parity test pattern is directly adaptable

### Confidence Adjustments

- Implementation confidence is high (95%) because cover-me-pretty is strictly simpler than brikette, which is already done.

### Remaining Assumptions

- Brand hex values: planner must either get from operator or scaffold with fashion-appropriate placeholders and flag clearly.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Token surface inventory | Yes | No existing app-specific tokens — additive only | No |
| Brikette reference pattern | Yes | None | No |
| Package structure | Yes | None | No |
| Test strategy | Yes | Jest root for new package needs verification | Low — add jest.config.cjs |
| Dark mode | Yes | Not required | No |
| RGB triplets | Yes | Not required | No |
| Brand colour values | Partial | Unknown — operator input or placeholder needed | Yes — T1 |
| Rollback | Yes | Trivial — remove one import line | No |

## Analysis Readiness

- Status: Ready-for-planning
- Blocking items:
  - Brand colour hex values (T1) — can be scaffolded with placeholders; not a planning blocker
- Recommended next step:
  - `/lp-do-plan`
