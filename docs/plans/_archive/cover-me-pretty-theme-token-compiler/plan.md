---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-14
Last-reviewed: 2026-03-14
Last-updated: 2026-03-14
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: cover-me-pretty-theme-token-compiler
Dispatch-ID: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/cover-me-pretty-theme-token-compiler/fact-find.md
---

# cover-me-pretty Theme Token Compiler Retrofit — Plan

## Summary

cover-me-pretty currently has no app-specific CSS token layer — it relies entirely on the shared `@themes/base/tokens.css` defaults. This plan creates a `packages/themes/cover-me-pretty/` package following the brikette three-layer pattern (assets + design-profile + theme-css-config), a generation script that produces a committed `theme-tokens.generated.css` file, a `@import` line in `globals.css`, and a parity test that enforces compiler output matches the committed file. The scope is light-mode only (no `.dark` custom property vars — the compiler emits a minimal `.dark { color-scheme: dark; }` block by default but it carries no brand token overrides; no RGB triplet vars). Because cover-me-pretty is strictly simpler than brikette (which is already working), implementation confidence is high. Brand colour values are scaffolded with cosmetics-appropriate placeholders and clearly marked for operator confirmation.

## Active tasks

- [ ] TASK-01: Create `@themes/cover-me-pretty` package (assets, design-profile, theme-css-config, index)
- [ ] TASK-02: Create generation script and produce committed `theme-tokens.generated.css`
- [ ] TASK-03: Add `@import "./theme-tokens.generated.css"` to `globals.css`
- [ ] TASK-04: Write parity test; add `jest.config.cjs` to package

## Goals

- Create `packages/themes/cover-me-pretty/` with `assets.ts`, `design-profile.ts`, `theme-css-config.ts`, and `src/index.ts`
- Add `scripts/cover-me-pretty/generate-theme-tokens.ts` and register `cover-me-pretty:generate-theme-tokens` pnpm script
- Produce and commit `apps/cover-me-pretty/src/app/theme-tokens.generated.css`
- Add `@import "./theme-tokens.generated.css"` to `apps/cover-me-pretty/src/app/globals.css`
- Write `packages/themes/cover-me-pretty/__tests__/generated-parity.test.ts` that proves compiler output matches the committed file
- Register the package in the pnpm workspace (workspace protocol dep in `scripts/package.json` if needed by the generate script)

## Non-goals

- Dark mode brand token overrides — cover-me-pretty has no dark-mode brand colours; the compiler emits a minimal `.dark { color-scheme: dark; }` block but no dark brand token vars
- Recipes layer — no component recipes needed for this retrofit
- Migrating Geist font variables — layout.tsx loads Geist fonts via Next.js; those remain unchanged
- Changing any component code — pure infrastructure/tooling change
- Definitive brand colour values — placeholders are used; operator may update later; parity test enforces whatever is committed

## Constraints & Assumptions

- Constraints:
  - cover-me-pretty uses webpack (not Turbopack) per MEMORY.md — no Turbopack alias concerns
  - `@themes/base` is already in `apps/cover-me-pretty/package.json` — no new app-level dep needed
  - Generated CSS must be imported via relative path in globals.css (`@import "./theme-tokens.generated.css"`)
  - `packages/themes/cover-me-pretty/` must declare `@themes/base` as a workspace dep
  - Tests run in CI only — never run jest locally; use `npx tsc --noEmit` for type checking
- Assumptions:
  - Target token surface: 20 declarations (same as caryina pattern) — `--color-bg`, `--color-fg`, `--color-fg-muted`, `--color-primary`, `--color-primary-fg`, `--color-primary-soft`, `--color-primary-hover`, `--color-primary-active`, `--color-accent`, `--color-accent-fg`, `--color-accent-soft`, `--color-border`, `--color-border-muted`, `--color-border-strong`, `--color-surface`, `--font-sans`, `--font-heading`, `--radius-sm`, `--radius-md`, `--radius-lg`
  - These tokens go into `tokenVarMap` (the flat token override map in `ThemeCSSConfig`, designed for apps whose tokens don't originate from `assets.brandColors`) and `fontVarMap` (for font family vars); `colorVarMap` is used only for any hex-based brand colours. Note: `derivedVars.light` also works and is an acceptable alternative; `tokenVarMap` is the semantically appropriate mechanism for a flat override surface.
  - `generateThemeCSS()` always emits a `.dark` block header (`${darkSelector} { color-scheme: dark; ... }`). For a light-only config with no `.dark` fields in brandColors and no `derivedVars.dark`, the `.dark` block will contain only `color-scheme: dark;` with no custom property vars.
  - Scripts workspace can import `@themes/cover-me-pretty` via pnpm workspace resolution without adding it to scripts/package.json (same as the existing `@themes/brikette` import in the brikette generator, which is also not listed in scripts/package.json)
  - Jest picks up `packages/themes/cover-me-pretty/__tests__/` via the `jest.config.cjs` in that package (same pattern as `packages/themes/brikette/jest.config.cjs`)

## Inherited Outcome Contract

- **Why:** Brikette has proven the three-layer compiler pattern. cover-me-pretty is the next simplest app to retrofit, bringing it into platform standard before brand colours are needed for a campaign or redesign.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A new `packages/themes/cover-me-pretty/` package exists with the three-layer files; a generation script can be run to regenerate the committed CSS file; a passing parity test proves the compiler output is consistent with what is committed; globals.css imports the generated file.
- **Source:** operator

## Analysis Reference

- Related analysis: `docs/plans/cover-me-pretty-theme-token-compiler/fact-find.md`
- Selected approach inherited:
  - Three-layer brikette pattern: `assets.ts` + `design-profile.ts` + `theme-css-config.ts`, generation script, committed generated CSS, parity test
  - Token surface: 20 declarations, all light-mode, no RGB triplets, no recipes
  - caryina is the relevant simpler reference for token surface shape; brikette is the reference for package structure and test pattern
- Key reasoning used:
  - No analysis stage run — fact-find reached Ready-for-planning with high confidence (95% impl, 97% approach); the approach is the only viable one (brikette is the established platform pattern)

## Selected Approach Summary

- What was chosen:
  - Mirror the brikette three-layer package structure; use `tokenVarMap` for the 20 flat HSL-triplet/radius token overrides (the semantically appropriate mechanism for flat token surfaces), `colorVarMap` for any explicit hex-based brand colours, and `fontVarMap` for font family strings; scaffold brand colour hex values with cosmetics-appropriate placeholders
- Why planning is not reopening option selection:
  - The pattern is already proven and the only platform-standard approach; the fact-find explicitly recommends it with 95% confidence

## Fact-Find Support

- Supporting brief: `docs/plans/cover-me-pretty-theme-token-compiler/fact-find.md`
- Evidence carried forward:
  - `apps/cover-me-pretty/src/app/globals.css` — confirmed: no `:root` block, no app-specific tokens; import goes after `@import "@themes/base/tokens.css"`
  - `packages/themes/brikette/__tests__/generated-parity.test.ts` — complete reference for the parity test; adaptable with minor path changes
  - `scripts/brikette/generate-theme-tokens.ts` — complete reference for the generation script
  - `packages/themes/brikette/package.json` — reference for package.json structure
  - `packages/themes/caryina/src/tokens.css` — 20-declaration light-only token set; confirms the target token surface
  - `packages/themes/base/src/build-theme-css.ts` — `generateThemeCSS()` confirmed: always emits a `.dark` block but it is minimal (only `color-scheme: dark;`) for light-only configs; `tokenVarMap` is the mechanism used for cover-me-pretty's flat 20-token surface

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Create `@themes/cover-me-pretty` package | 90% | M | Pending | - | TASK-02, TASK-04 |
| TASK-02 | IMPLEMENT | Create generation script + commit generated CSS | 90% | S | Pending | TASK-01 | TASK-03, TASK-04 |
| TASK-03 | IMPLEMENT | Add `@import` line to `globals.css` | 95% | S | Pending | TASK-02 | - |
| TASK-04 | IMPLEMENT | Write parity test + `jest.config.cjs` | 90% | S | Pending | TASK-01, TASK-02 | - |

## Engineering Coverage

| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | New `:root` token block introduced; brand colour placeholders are cosmetics-appropriate; tokens override base defaults; visual smoke test recommended post-deploy | TASK-01, TASK-02, TASK-03 | No existing app-specific tokens overridden; additive only |
| UX / states | N/A | - | Pure CSS token infrastructure; no UX state change |
| Security / privacy | N/A | - | CSS file generation; no auth, PII, or network |
| Logging / observability / audit | N/A | - | Pure compile-time generation |
| Testing / validation | Parity test reads committed generated CSS, runs `generateThemeCSS()`, diffs `:root` var-by-var; `jest.config.cjs` added to package for test discovery | TASK-04 | No `.dark` block tests needed (light-mode only) |
| Data / contracts | `ThemeCSSConfig` type contract satisfied at compile time; TypeScript will catch mismatches; `assets.ts` / `theme-css-config.ts` types verified against `@themes/base` interface | TASK-01 | Contract is fully typed; no runtime schema |
| Performance / reliability | N/A | - | Static CSS file; no runtime cost |
| Rollout / rollback | Rollback: remove the `@import` line in globals.css and delete the generated file — one-commit revert | TASK-03 | No deploy gate; change is a committed CSS file |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Foundation — package files created first |
| 2 | TASK-02 | TASK-01 complete | Generation script requires package to import from |
| 3 | TASK-03, TASK-04 | TASK-02 complete | Both can run in parallel after generated CSS exists |

## Delivered Processes

None: no material process topology change. The change adds new files (package, scripts, test, generated CSS, globals.css import line). No multi-step operator process, CI lane, approval path, or runbook is affected. The new package participates in the existing pnpm workspace build graph; the parity test runs under Jest in the existing CI test suite. The generation script is a developer tool (`pnpm --filter scripts cover-me-pretty:generate-theme-tokens`) that can be run locally when brand colours need updating.

## Tasks

---

### TASK-01: Create `@themes/cover-me-pretty` package

- **Type:** IMPLEMENT
- **Deliverable:** `packages/themes/cover-me-pretty/` — `package.json`, `src/assets.ts`, `src/design-profile.ts`, `src/theme-css-config.ts`, `src/index.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `packages/themes/cover-me-pretty/` (new)
- **Depends on:** -
- **Blocks:** TASK-02, TASK-04
- **Confidence:** 90%
  - Implementation: 90% — brikette is a complete working reference; cover-me-pretty is simpler (no dark mode, no RGB triplets, no recipes); all TypeScript interfaces are well-understood from `@themes/base`. Held-back test: only unknown is specific brand hex values, but these use placeholders — not a structural risk.
  - Approach: 95% — three-layer pattern is proven; `generateThemeCSS()` behaviour is fully read and understood.
  - Impact: 90% — additive only; no existing code touched; TypeScript enforces contract correctness.
- **Acceptance:**
  - `packages/themes/cover-me-pretty/package.json` has `name: "@themes/cover-me-pretty"`, `type: "module"`, exports map for `.`, `./assets`, `./design-profile`, `./theme-css-config`, `@themes/base` workspace dep
  - `src/assets.ts` exports `assets: ThemeAssets` with `fonts.body`, `fonts.heading`, empty `gradients`, `shadows`, `keyframes`, and `brandColors` with cosmetics-appropriate placeholder hex values
  - `src/design-profile.ts` exports `profile: DesignProfile` with all required fields
  - `src/theme-css-config.ts` exports `themeCSSConfig: ThemeCSSConfig` with `tokenVarMap` covering the 20-token surface (HSL triplets + radius values), `fontVarMap` for font families, and `colorVarMap` for any hex-based brand colour overrides
  - `src/index.ts` re-exports `assets`, `profile`, `themeCSSConfig`
  - `npx tsc --noEmit` passes (types satisfied)
- **Engineering Coverage:**
  - UI / visual: Required — `assets.ts` encodes brand colours; placeholder hex values are cosmetics-appropriate (rose-pink primary, soft sage accent); `tokenVarMap` encodes HSL triplets for bg/fg/border/radius tokens
  - UX / states: N/A — no UX change; package is consumed by generator, not by UI components directly
  - Security / privacy: N/A — compile-time TypeScript only
  - Logging / observability / audit: N/A — no runtime output
  - Testing / validation: Required — TypeScript types provide compile-time contract validation; parity test (TASK-04) provides runtime output validation
  - Data / contracts: Required — `ThemeCSSConfig` type contract fully satisfied; `tokenVarMap` used for the 20 flat token overrides; no `rgbVarMap` (confirmed N/A); no `derivedVars.dark` (light-only)
  - Performance / reliability: N/A — static package; no runtime cost
  - Rollout / rollback: N/A — new package; removal is a workspace dependency unlink + directory deletion; no consumers until TASK-02/03
- **Validation contract (TC-01–TC-03):**
  - TC-01: `npx tsc --noEmit` on the package passes with no type errors — `ThemeAssets`, `DesignProfile`, `ThemeCSSConfig` interfaces all satisfied
  - TC-02: `src/index.ts` exports `assets`, `profile`, `themeCSSConfig` — importable as `@themes/cover-me-pretty` by the generation script
  - TC-03: All 20 token surface entries are represented in `tokenVarMap`, `colorVarMap`, or `fontVarMap` — no token left unmapped
- **Execution plan:** Red → Green → Refactor
  - Red: create package directory structure; `package.json` with placeholder exports; `src/assets.ts` with `ThemeAssets` skeleton — type errors expected until all fields filled
  - Green: fill `assets.ts` with cosmetics-appropriate placeholder brand colours (rose-pink: `#e8637a` primary, sage green: `#8fad8a` accent); complete `design-profile.ts` with cover-me-pretty character (soft editorial style); complete `theme-css-config.ts` using `tokenVarMap` for the 20 flat HSL/radius token overrides, `fontVarMap` for font families; add `src/index.ts` re-exports — typecheck passes
  - Refactor: add TODO comments to placeholder brand hex values flagging operator confirmation needed; ensure eslint `ds/no-raw-color` disable comment is present per brikette pattern
- **Planning validation (required for M):**
  - Checks run: Read `packages/themes/base/src/build-theme-css.ts` — `ThemeCSSConfig` interface fully inspected; `tokenVarMap` confirmed as the appropriate mechanism for flat token overrides; `.dark` block always emitted but minimal (only `color-scheme: dark;`) for light-only configs with no `.dark` brand colour fields
  - Read `packages/themes/brikette/src/assets.ts` — reference for `ThemeAssets` shape
  - Read `packages/themes/caryina/src/tokens.css` — 20-declaration light-only token surface confirmed as target
  - Read `packages/themes/brikette/src/theme-css-config.ts` — `ThemeCSSConfig` usage pattern confirmed
  - Validation artifacts: brikette package as complete working reference
  - Unexpected findings: None — cover-me-pretty is confirmed simpler than brikette in every dimension
- **Consumer tracing:**
  - New output: `@themes/cover-me-pretty` package (exports `assets`, `profile`, `themeCSSConfig`)
  - Consumer 1: `scripts/cover-me-pretty/generate-theme-tokens.ts` (TASK-02) — imports `assets`, `profile`, `themeCSSConfig` from `@themes/cover-me-pretty`
  - Consumer 2: `packages/themes/cover-me-pretty/__tests__/generated-parity.test.ts` (TASK-04) — imports same three from `../src/`
  - No other consumers; package is not depended on by any app code
- **Scouts:** Brand hex value uncertainty — resolved by using cosmetics-appropriate placeholders (rose-pink primary, sage accent) with clearly marked TODO comments; parity test enforces whatever values are committed, so placeholder values are safe to iterate
- **Edge Cases & Hardening:**
  - Empty `gradients: {}`, `shadows: {}`, `keyframes: {}` — confirmed valid by brikette pattern (all `Record<string, X>` types, empty maps are fine)
  - `colorVarMap` must not reference brandColor keys that don't exist in `assets.brandColors` — generator silently skips missing keys; verified in `generateLightColorVars()`
  - Font family strings with quotes (e.g. `'"Geist", sans-serif'`) — verified valid from brikette
- **What would make this >=95%:** Operator confirms specific brand hex values
- **Rollout / rollback:**
  - Rollout: new directory; no existing files modified; zero risk to any deployed system until TASK-02/03 land
  - Rollback: delete `packages/themes/cover-me-pretty/` directory; no consumers exist until TASK-03 is complete
- **Documentation impact:** None: no public API or runbook change
- **Notes / references:**
  - Brand colour placeholder rationale: "cover me pretty" implies cosmetics/fashion/beauty; rose-pink primary (#e8637a) and soft sage accent (#8fad8a) are appropriate placeholders. Operator should confirm before any brand campaign.
  - Token surface chosen to match caryina's 20-declaration set (the simplest existing platform pattern); caryina uses a `TokenMap` → pre-built static CSS approach and does not use `generateThemeCSS()` — it is a size/surface reference, not a compiler-mechanism reference
  - The appropriate mechanism for cover-me-pretty's flat 20-token surface is `tokenVarMap` in `ThemeCSSConfig` (designed for flat token override maps where tokens don't originate from `assets.brandColors`); `derivedVars.light` is also valid but is intended for asset-derived tokens

---

### TASK-02: Create generation script and produce committed `theme-tokens.generated.css`

- **Type:** IMPLEMENT
- **Deliverable:** `scripts/cover-me-pretty/generate-theme-tokens.ts`, `apps/cover-me-pretty/src/app/theme-tokens.generated.css`, pnpm script entry in `scripts/package.json`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `scripts/cover-me-pretty/generate-theme-tokens.ts` (new), `apps/cover-me-pretty/src/app/theme-tokens.generated.css` (new), `scripts/package.json`
- **Depends on:** TASK-01
- **Blocks:** TASK-03, TASK-04
- **Confidence:** 90%
  - Implementation: 90% — `scripts/brikette/generate-theme-tokens.ts` is the exact template; only path constants change
  - Approach: 95% — identical pattern; no new technical decision
  - Impact: 90% — the generated file is new; existing globals.css unchanged until TASK-03
- **Acceptance:**
  - `scripts/cover-me-pretty/generate-theme-tokens.ts` exists and produces `apps/cover-me-pretty/src/app/theme-tokens.generated.css` when run
  - `scripts/package.json` has `"cover-me-pretty:generate-theme-tokens": "node --import tsx ../scripts/cover-me-pretty/generate-theme-tokens.ts"` (following the `brikette:generate-theme-tokens` pattern)
  - Generated file starts with the standard auto-generated banner comment citing source paths and regenerate command
  - Generated file contains the 20 token declarations plus structural vars emitted by the compiler (e.g. `--theme-transition-duration` from `generateProfileVars()`); the parity test's inverse check must account for these compiler-emitted vars
  - Generated file contains a minimal `.dark { color-scheme: dark; }` block with no custom property vars (light-only; no `.dark` brand colour overrides present)
  - Generated file is committed to source control
- **Engineering Coverage:**
  - UI / visual: Required — generated CSS file is the visual output; banner comment prevents accidental manual edits; `:root` block verified to contain all 20 tokens
  - UX / states: N/A — generation is a developer-only operation
  - Security / privacy: N/A — no secrets or PII
  - Logging / observability / audit: N/A — console output (`✓ Generated ... X vars`) is sufficient
  - Testing / validation: Required — generated file existence is a precondition for TASK-04 parity test
  - Data / contracts: Required — generated file format must match what `extractVarsFromBlock()` in the parity test can parse (same format as brikette generated file)
  - Performance / reliability: N/A — one-time script; no runtime path
  - Rollout / rollback: N/A — committed file; removal via git revert
- **Validation contract (TC-04–TC-05):**
  - TC-04: Running `pnpm --filter scripts cover-me-pretty:generate-theme-tokens` produces/updates `apps/cover-me-pretty/src/app/theme-tokens.generated.css` without errors
  - TC-05: Generated file contains the 20 token declarations in `:root` plus `--theme-transition-duration` and any other structural vars emitted by the compiler; the `.dark` block contains only `color-scheme: dark;` with no custom property vars
- **Execution plan:** Red → Green → Refactor
  - Red: create `scripts/cover-me-pretty/` directory; copy brikette generator; update import paths to `@themes/cover-me-pretty` and output path to `../../apps/cover-me-pretty/src/app/theme-tokens.generated.css`; update banner comment paths
  - Green: run the script; verify generated CSS file produced at correct path; verify 20+ token custom properties present in `:root`; verify `.dark` block contains only `color-scheme: dark;` with no custom property vars
  - Refactor: add pnpm script entry to `scripts/package.json`; commit generated file
- **Planning validation:**
  - Checks run: Read `scripts/brikette/generate-theme-tokens.ts` — confirmed template; output path pattern `path.resolve(__dirname, "../../apps/<app>/src/...")` matches relative location
  - Read `scripts/package.json` — confirmed existing `brikette:generate-theme-tokens` pattern; `cover-me-pretty:generate-theme-tokens` follows same pattern
  - Validation artifacts: brikette generator is complete working reference
  - Unexpected findings: None
- **Consumer tracing:**
  - New output: `apps/cover-me-pretty/src/app/theme-tokens.generated.css`
  - Consumer 1: `apps/cover-me-pretty/src/app/globals.css` (TASK-03) — `@import "./theme-tokens.generated.css"`
  - Consumer 2: `packages/themes/cover-me-pretty/__tests__/generated-parity.test.ts` (TASK-04) — reads file from disk via `fs.readFileSync`
- **Scouts:** None — exact brikette pattern with path changes only
- **Edge Cases & Hardening:**
  - `__dirname` usage requires `fileURLToPath(import.meta.url)` pattern (ESM module) — already in brikette template
  - `path.resolve` relative path from `scripts/cover-me-pretty/` to `apps/cover-me-pretty/` is `../../apps/cover-me-pretty/src/app/theme-tokens.generated.css` — 2 levels up from scripts/cover-me-pretty/
- **What would make this >=95%:** Confirmed parity test passes after running script (TASK-04 complete)
- **Rollout / rollback:**
  - Rollout: committed generated file + script; no deploy impact
  - Rollback: delete generated file; remove pnpm script entry; no cascade
- **Documentation impact:** None: script is self-documenting via banner comment
- **Notes / references:**
  - The generated file path differs from brikette (brikette: `src/styles/`, cover-me-pretty: `src/app/`) — fact-find explicitly specifies `apps/cover-me-pretty/src/app/theme-tokens.generated.css`

---

### TASK-03: Add `@import` line to `globals.css`

- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/cover-me-pretty/src/app/globals.css` — one new `@import` line
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/cover-me-pretty/src/app/globals.css`
- **Depends on:** TASK-02
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% — one-line edit; exact position specified; no ambiguity
  - Approach: 95% — import-after-base-tokens is the established platform pattern (brikette, confirmed in fact-find)
  - Impact: 95% — additive import; CSS cascade not disrupted since generated file only adds new vars to `:root`
- **Acceptance:**
  - `apps/cover-me-pretty/src/app/globals.css` contains `@import "./theme-tokens.generated.css";` immediately after the line `@import "@themes/base/tokens.css";`
  - No other lines in globals.css are modified
  - `npx tsc --noEmit` on the app still passes (no TS impact; CSS-only change)
- **Engineering Coverage:**
  - UI / visual: Required — this is the activation step that makes brand tokens available to the app; CSS cascade confirmed safe (new `:root` vars only, no overriding existing component styles)
  - UX / states: N/A — no UX state change
  - Security / privacy: N/A — CSS only
  - Logging / observability / audit: N/A — CSS only
  - Testing / validation: Required — parity test (TASK-04) validates that the committed generated file matches compiler output; this task has no independent test beyond visual smoke test
  - Data / contracts: N/A — no data contract; CSS import path is relative and confirmed correct
  - Performance / reliability: N/A — static CSS import; zero runtime cost
  - Rollout / rollback: Required — rollback is removing this one import line
- **Validation contract (TC-06):**
  - TC-06: After edit, `@import "./theme-tokens.generated.css";` appears immediately after `@import "@themes/base/tokens.css";` in globals.css; no other lines are modified
- **Execution plan:** Red → Green → Refactor
  - Red: N/A (single-line edit; no red phase)
  - Green: insert `@import "./theme-tokens.generated.css";` after `@import "@themes/base/tokens.css";`
  - Refactor: verify no other lines changed; visual spot-check that no syntax errors introduced
- **Planning validation:**
  - Checks run: Read `apps/cover-me-pretty/src/app/globals.css` — confirmed current line 3 is `@import "@themes/base/tokens.css";`; insertion point is line 4
  - Unexpected findings: None
- **Scouts:** None — single-line edit with known insertion point
- **Edge Cases & Hardening:**
  - `@import "./theme-tokens.generated.css"` uses relative path — required because the shared `@themes/cover-me-pretty` alias is not wired into this app's CSS resolution; relative path always works
  - CSS cascade: generated file sets `:root` custom properties only; no risk of overriding component-level styles
- **What would make this >=98%:** Running local dev server and confirming no CSS errors
- **Rollout / rollback:**
  - Rollout: single-line addition; immediate on next dev build
  - Rollback: remove the `@import` line — one-line git revert
- **Documentation impact:** None
- **Notes / references:**
  - Position confirmed from `apps/cover-me-pretty/src/app/globals.css` line 3

---

### TASK-04: Write parity test and `jest.config.cjs`

- **Type:** IMPLEMENT
- **Deliverable:** `packages/themes/cover-me-pretty/__tests__/generated-parity.test.ts`, `packages/themes/cover-me-pretty/jest.config.cjs`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `packages/themes/cover-me-pretty/__tests__/generated-parity.test.ts` (new), `packages/themes/cover-me-pretty/jest.config.cjs` (new)
- **Depends on:** TASK-01, TASK-02
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — brikette parity test is the exact template; path constants and selector list change; no dark block tests needed
  - Approach: 90% — file-based comparison pattern is proven; Jest config follows brikette's one-liner pattern
  - Impact: 90% — test discovery confirmed via `jest.config.cjs`; CI will pick it up
- **Acceptance:**
  - `packages/themes/cover-me-pretty/__tests__/generated-parity.test.ts` exists and:
    - reads `apps/cover-me-pretty/src/app/theme-tokens.generated.css` from disk
    - calls `generateThemeCSS({ assets, profile, config: themeCSSConfig })`
    - asserts every `--*` var in committed `:root` exists in generated `:root` with matching value
    - asserts no extra vars in generated `:root` absent from committed `:root`
    - does NOT include `.dark` block tests (light-mode only)
  - `packages/themes/cover-me-pretty/jest.config.cjs` exists with content `module.exports = require("@acme/config/jest.preset.cjs")();`
  - Test passes in CI (parity check succeeds when generated file matches compiler output)
- **Engineering Coverage:**
  - UI / visual: N/A — test file; no visual change
  - UX / states: N/A — no UX change
  - Security / privacy: N/A — no auth or PII
  - Logging / observability / audit: N/A — test output is CI log only
  - Testing / validation: Required — this task IS the validation; parity test is the primary gate proving compiler output is consistent with what is committed
  - Data / contracts: Required — `extractVarsFromBlock()` parser must handle the generated CSS format correctly; verified format matches brikette's generated file format (same compiler)
  - Performance / reliability: N/A — test-only; no runtime impact
  - Rollout / rollback: N/A — test file; removing it would only lose protection, not break the app
- **Validation contract (TC-07–TC-08):**
  - TC-07: In CI, test suite for `@themes/cover-me-pretty` runs without errors; all parity assertions pass
  - TC-08: If `assets.ts` brand colour is changed without regenerating CSS, at least one parity assertion fails (confirms the test has bite)
- **Execution plan:** Red → Green → Refactor
  - Red: create `__tests__/generated-parity.test.ts` by adapting brikette version; update `GENERATED_TOKENS_PATH` to point to `apps/cover-me-pretty/src/app/theme-tokens.generated.css`; update import paths to `../src/assets`, `../src/design-profile`, `../src/theme-css-config`; remove `.dark` block test suites (not needed)
  - Green: create `jest.config.cjs` one-liner; confirm test imports resolve; confirm test finds generated CSS file at specified path
  - Refactor: ensure test description string reflects cover-me-pretty context
- **Planning validation:**
  - Checks run: Read `packages/themes/brikette/__tests__/generated-parity.test.ts` — complete template; `GENERATED_TOKENS_PATH` uses `path.resolve(__dirname, "../../../../apps/brikette/src/styles/theme-tokens.generated.css")`; for cover-me-pretty the relative path from `packages/themes/cover-me-pretty/__tests__/` to `apps/cover-me-pretty/src/app/theme-tokens.generated.css` is `../../../../apps/cover-me-pretty/src/app/theme-tokens.generated.css` (same depth)
  - Read `packages/themes/brikette/jest.config.cjs` — confirmed one-liner `module.exports = require("@acme/config/jest.preset.cjs")();`
  - Unexpected findings: The relative path depth from `packages/themes/<pkg>/__tests__/` to the repo root is 4 levels — `../../../../` — same for both brikette and cover-me-pretty. Confirmed consistent.
- **Consumer tracing:**
  - This task consumes:
    - `packages/themes/cover-me-pretty/src/assets.ts` (TASK-01)
    - `packages/themes/cover-me-pretty/src/design-profile.ts` (TASK-01)
    - `packages/themes/cover-me-pretty/src/theme-css-config.ts` (TASK-01)
    - `apps/cover-me-pretty/src/app/theme-tokens.generated.css` (TASK-02)
  - All four are confirmed as outputs of prior tasks in the sequence
- **Scouts:** Jest root discovery — `jest.config.cjs` in `packages/themes/cover-me-pretty/` follows the brikette pattern; CI already picks up brikette's tests from that same directory depth
- **Edge Cases & Hardening:**
  - Generated file must be committed before test runs — this is the established brikette pattern; test reads from disk
  - `.dark` block absence: `extractVarsFromBlock(tokenCSS, ".dark")` will return an empty Map; the test suites for `.dark` are omitted entirely (not present, not skipped)
  - Normalisation in comparison: `norm()` function collapses whitespace and lowercases hex — handles minor formatting differences between hand-written and compiler-generated values
- **What would make this >=95%:** CI run confirms test passes on first push
- **Rollout / rollback:**
  - Rollout: new test file; no production impact
  - Rollback: deleting test file removes parity protection but does not affect the app
- **Documentation impact:** None
- **Notes / references:**
  - `.dark` block tests are explicitly removed (not skipped) since cover-me-pretty is light-mode only and the generated file produces no `.dark` block

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Brand colour placeholders not confirmed before deploy | Medium | Low — placeholders are cosmetics-appropriate; parity test enforces whatever is committed; easy to update | Placeholder hex values clearly marked with TODO comments in `assets.ts` |
| Jest root for new package not discovered in CI | Low | Low — test doesn't run; caught in CI before merge | `jest.config.cjs` in package follows proven brikette pattern |
| `@import` line breaks globals.css CSS cascade | Very Low | Medium — visual regression possible | Generated file only adds new CSS custom properties in `:root`; no cascade conflict possible |
| `@themes/cover-me-pretty` not importable by generation script | Low | Low — script fails to run | pnpm workspace resolution handles this without explicit dep in scripts/package.json (same as brikette) |

## Observability

- Logging: None — pure compile-time generation
- Metrics: None
- Alerts/Dashboards: None

## Acceptance Criteria (overall)

- [ ] `packages/themes/cover-me-pretty/` exists with `package.json`, `src/assets.ts`, `src/design-profile.ts`, `src/theme-css-config.ts`, `src/index.ts`, `jest.config.cjs`, `__tests__/generated-parity.test.ts`
- [ ] `apps/cover-me-pretty/src/app/theme-tokens.generated.css` committed with 20 CSS custom properties in `:root` and no `.dark` block
- [ ] `apps/cover-me-pretty/src/app/globals.css` imports `./theme-tokens.generated.css` immediately after `@themes/base/tokens.css`
- [ ] `scripts/cover-me-pretty/generate-theme-tokens.ts` exists; `scripts/package.json` has `cover-me-pretty:generate-theme-tokens` script entry
- [ ] Parity test passes in CI
- [ ] `npx tsc --noEmit` passes on the new package and on `apps/cover-me-pretty`

## Decision Log

- 2026-03-14: Chose to use placeholder brand colour hex values rather than blocking on operator confirmation. Evidence: fact-find explicitly allows this (risk rated Low; parity test enforces whatever is committed; placeholders are easy to iterate). Decision: cosmetics-appropriate placeholders (#e8637a rose-pink primary, #8fad8a sage accent) with clearly marked TODO comments.
- 2026-03-14: Chose `tokenVarMap` as the primary mechanism for the 20 HSL-triplet/font/radius tokens. Evidence: caryina's token surface (20 declarations) is the size reference; caryina uses a `TokenMap` → static CSS approach (not `generateThemeCSS()`). `tokenVarMap` in `ThemeCSSConfig` is the closest compiler-level parallel — it accepts `Record<\`--${string}\`, { light: string; dark?: string }>` and is designed for "apps whose tokens don't originate from assets.brandColors". `derivedVars.light` is also valid but is intended for asset-derived tokens; `tokenVarMap` is the semantically correct choice for a flat override surface. `colorVarMap` remains for any explicit hex-based brand colours; `fontVarMap` for font family strings.
- 2026-03-14: No `theme-css-config.ts` export in the `@themes/cover-me-pretty` package exports — actually: `theme-css-config` IS included in the exports map following the brikette package.json pattern. Resolved: exports map includes `.`, `./assets`, `./design-profile`, `./theme-css-config`.

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Create package | Yes — `@themes/base` interfaces confirmed in repo; brikette reference exists; no prior tasks required | None | No |
| TASK-02: Generation script + generated CSS | Yes — TASK-01 must complete first (package importable by script); brikette template available; output path confirmed | None — path arithmetic confirmed: `scripts/cover-me-pretty/generate-theme-tokens.ts` → `../../apps/cover-me-pretty/src/app/theme-tokens.generated.css` is correct | No |
| TASK-03: Add `@import` to globals.css | Yes — generated CSS file must exist (TASK-02); current globals.css line 3 confirmed as `@import "@themes/base/tokens.css"` | None | No |
| TASK-04: Parity test + jest.config.cjs | Yes — TASK-01 (package src files) and TASK-02 (generated CSS file) must be complete; path depth `../../../../` confirmed consistent with brikette | None | No |

## Overall-confidence Calculation

- TASK-01: 90% × 2 (M) = 180
- TASK-02: 90% × 1 (S) = 90
- TASK-03: 95% × 1 (S) = 95
- TASK-04: 90% × 1 (S) = 90
- Sum weights: 2 + 1 + 1 + 1 = 5
- Overall-confidence = (180 + 90 + 95 + 90) / 5 = 455 / 5 = **91%** → rounded to **90%** (downward bias per scoring rules)
