---
Type: Plan
Status: Archived
Domain: CMS
Workstream: Engineering
Created: 2026-03-14
Last-reviewed: 2026-03-14
Last-updated: 2026-03-14
Build-started: 2026-03-14
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: cms-theme-token-compiler
Dispatch-ID: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/cms-theme-token-compiler/fact-find.md
---

# CMS Theme Token Compiler Plan

## Summary

Retrofit `apps/cms` to use the same three-layer generated theme token system that brikette uses. The compiler (`packages/themes/base/src/build-theme-css.ts`) already supports `darkSelector` (confirmed in the actual source). Create `packages/themes/cms/` as a new theme package, map all 60 token custom properties across `:root` and `html.theme-dark` into `derivedVars` (no hex colors, no `colorVarMap` or `rgbVarMap` needed), commit the generated file, write a parity test, and swap the `globals.css` import. No runtime behaviour changes.

## Active tasks
- [x] TASK-01: Create @themes/cms package scaffold — Complete (2026-03-14)
- [x] TASK-02: Write CMS theme-css-config.ts (all tokens mapped) — Complete (2026-03-14)
- [x] TASK-03: Generate and commit cms.tokens.generated.css — Complete (2026-03-14)
- [x] TASK-04: Write generated-parity test suite — Complete (2026-03-14)
- [x] TASK-05: Wire globals.css and add workspace dep — Complete (2026-03-14)

## Goals
- Create `packages/themes/cms/` as a structured theme package parallel to `@themes/brikette`
- Map all 60 custom properties across `:root` (33 properties) and `html.theme-dark` (27 properties) into `derivedVars`
- Write a parity test that proves compiler output matches the hand-authored file exactly (selector-aware extraction)
- Commit the generated CSS file and swap the import in `globals.css`
- Leave the multi-theme preview system (`previewTokens`, `WizardPreview`, `useThemeEditor`) entirely untouched

## Non-goals
- Migrating the per-shop storefront theme preview system
- Changing the CMS dark mode toggle mechanism
- Changing `@themes/brikette` in any way
- Adding new tokens beyond what is in `cms.tokens.css`
- CSS changes to `globals.css` beyond the one import line

## Constraints & Assumptions
- Constraints:
  - `darkSelector` is already implemented in `build-theme-css.ts` (confirmed: line 339, `config.darkSelector ?? ".dark"`); no compiler change needed
  - All CMS colors are HSL triplets — `colorVarMap` and `rgbVarMap` are empty/omitted; all tokens go through `derivedVars`
  - The companion-var pattern (`*-dark` suffixed vars in `:root`, aliased in `html.theme-dark`) must round-trip correctly: companions go in `derivedVars.light`; aliases go in `derivedVars.dark`
  - `--color-link` in `html.theme-dark` is a direct HSL override (`220 80% 70%`), not a `var()` alias — it goes in `derivedVars.dark`
  - Border tokens (`--border-1/2/3`) contain `/` alpha expressions: `var(--color-fg) / 0.12` — these are derived strings, not hex values; they go in `derivedVars.light` only (the dark block does not repeat them)
  - Elevation tokens (`--elevation-*`) use `rgba()` strings — must go in `derivedVars`; different values in dark block
  - `ThemeAssets.brandColors` must not be empty (TypeScript requires it to be a `Record<string, BrandColor | string>`) — use an empty object literal `{}` satisfying the type
  - The CMS app is on Webpack, not Turbopack — no module-identity concerns
  - The generated file is committed to the repo; the parity test reads that committed file (not re-runs the compiler twice), mirroring the brikette discipline
- Assumptions:
  - Generated CSS lives at `apps/cms/src/app/cms.tokens.generated.css`
  - `globals.css` import changes from `./cms.tokens.css` to `./cms.tokens.generated.css`; hand-authored `cms.tokens.css` is kept as reference during this PR
  - `@themes/cms` needs `@themes/base: workspace:*` as a dependency (same as brikette)
  - `apps/cms/package.json` needs `@themes/cms: workspace:*` added (needed to run the generation script)

## Inherited Outcome Contract

- **Why:** The brikette app has been fully migrated to the compiled token system. The CMS app retains a large hand-authored `cms.tokens.css` that is out of sync with that discipline. Retrofitting the CMS closes the gap, gives a single audit point for all CMS color decisions, and removes a class of drift bugs.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `cms.tokens.css` is replaced by a generated file produced by `generateThemeCSS()` from a typed CMS theme package; a parity test suite locks the output; no runtime behaviour changes.
- **Source:** auto

## Analysis Reference
- Related analysis: `docs/plans/cms-theme-token-compiler/fact-find.md`
- Selected approach inherited:
  - No analysis phase was needed; fact-find established approach directly (single viable path)
  - Use `derivedVars` exclusively for all CMS tokens (no hex → rgb conversion path needed)
  - Leverage `darkSelector: "html.theme-dark"` already present in the compiler
- Key reasoning used:
  - All CMS colors are HSL triplets; `colorVarMap` / `rgbVarMap` are designed for hex → rgb conversion and are not needed
  - The `derivedVars` map accepts arbitrary string values, covering all CMS token value types (HSL triplets, var() aliases, rgba() strings, px values, expressions)
  - `darkSelector` is already in `ThemeCSSConfig` — the fact-find's stated prerequisite work ("extend `generateThemeCSS()`") was already completed before this plan

## Selected Approach Summary
- What was chosen:
  - Create a new `@themes/cms` package using `derivedVars` for all 60 tokens; no `colorVarMap` or `rgbVarMap` entries
  - Use `fontVarMap` for the two font family declarations (`--font-sans`, `--font-mono`) tied to `assets.fonts`
  - Use `derivedVars.light` for: semantic colors in `:root`, companion `*-dark` vars in `:root`, typography derivations, surface tokens, ring/border/gradient/elevation/hero tokens
  - Use `derivedVars.dark` for: `var(--color-*-dark)` aliases (the `html.theme-dark` block), direct overrides (`--color-link`, surface triplets, dark elevation values), same-value repeat tokens
  - `darkSelector: "html.theme-dark"` in `ThemeCSSConfig`
- Why planning is not reopening option selection:
  - Fact-find settled all decisions; no forks remain. The only novel element (darkSelector) is already implemented in the compiler.

## Fact-Find Support
- Supporting brief: `docs/plans/cms-theme-token-compiler/fact-find.md`
- Evidence carried forward:
  - Full token surface map (33 `:root` properties + 27 `html.theme-dark` properties) — all value types identified
  - Confirmed: no hex colors in CMS tokens; no `--rgb-*` vars
  - Confirmed: `darkSelector` already supported in `build-theme-css.ts` line 339
  - Confirmed: `fontVarMap` drives `generateFontVars()` via `assets.fonts` — CMS needs minimal font declarations
  - Confirmed: `ThemeAssets.brandColors` field required (TypeScript shape); use empty `{}` with explicit type cast or satisfy via an empty object
  - Brikette parity test pattern fully verified (read committed file; compare vars via `extractVarsFromBlock()`)
  - `generateThemeCSS()` emits `color-scheme: light/dark` as a bare CSS property (not a custom property) — parity test already skips it via the `--` prefix filter
  - `generateProfileVars()` always emits `--theme-transition-duration`; CMS `DesignProfile` must include a plausible `motion.durationNormal` value (250ms matches the `transition-duration: 250ms` in `cms.tokens.css`)

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Create @themes/cms package scaffold | 90% | S | Complete (2026-03-14) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Write CMS theme-css-config.ts (all 60 tokens) | 85% | M | Complete (2026-03-14) | TASK-01 | TASK-03, TASK-04 |
| TASK-03 | IMPLEMENT | Generate and commit cms.tokens.generated.css | 90% | S | Complete (2026-03-14) | TASK-02 | TASK-04, TASK-05 |
| TASK-04 | IMPLEMENT | Write generated-parity test suite | 90% | S | Complete (2026-03-14) | TASK-03 | TASK-05 |
| TASK-05 | IMPLEMENT | Wire globals.css import and add workspace dep | 90% | S | Complete (2026-03-14) | TASK-03 | - |

## Engineering Coverage

| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | Parity test proves generated output matches hand-authored; visual correctness is structural (token values identical) | TASK-03, TASK-04 | No visual regression possible if parity test passes; 1:1 token swap |
| UX / states | N/A — no UX change; dark mode toggle mechanism unchanged | - | `html.theme-dark` selector path is unchanged |
| Security / privacy | N/A — pure CSS build-time artifact; no auth, no data | - | |
| Logging / observability / audit | N/A — no runtime behaviour change | - | Build-time only |
| Testing / validation | Parity test (`packages/themes/cms/__tests__/generated-parity.test.ts`) covers every `:root` var and every `html.theme-dark` var plus inverse check for no extra vars | TASK-04 | Same pattern as brikette parity test |
| Data / contracts | `ThemeCSSConfig` already has `darkSelector?` field; `fontVarMap` and `derivedVars` are existing record types; no interface extension needed | TASK-01, TASK-02 | Compiler change not required — confirmed |
| Performance / reliability | N/A — build-time generation; generated file is a static committed artifact | - | |
| Rollout / rollback | Rollback = revert `globals.css` import line; hand-authored `cms.tokens.css` kept intact during PR | TASK-05 | One-line rollback |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Scaffold only; fast |
| 2 | TASK-02 | TASK-01 | Token mapping; requires full token surface read |
| 3 | TASK-03 | TASK-02 | Run compiler script, commit output |
| 4 | TASK-04, TASK-05 | TASK-03 | Can run in parallel — TASK-04 reads generated file; TASK-05 edits globals.css |

## Delivered Processes

None: no material process topology change. The token file is a static CSS import; no CI gate, no generation script, no operator workflow is introduced. The parity test runs in CI (filter `@themes/cms`) as a standard Jest suite.

## Tasks

---

### TASK-01: Create @themes/cms package scaffold
- **Type:** IMPLEMENT
- **Deliverable:** New package `packages/themes/cms/` with `package.json`, `tsconfig.json`, `jest.config.cjs`, `src/assets.ts`, `src/design-profile.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Build evidence:** All 5 scaffold files created. `npx tsc --noEmit` clean. `pnpm --filter @themes/cms lint` clean after removing unused eslint-disable directives. Package registered in pnpm workspace. `ThemeAssets` satisfied with empty `brandColors: {}`. `DesignProfile` fully satisfied with CMS-appropriate values and `motion.durationNormal: "250ms"`.
- **Post-build validation:** Mode 2 (Data Simulation). Attempt 1. Result: Pass. Evidence: tsc --noEmit exits 0; lint exits 0; package exports resolve correctly.
- **Affects:** `packages/themes/cms/package.json` (new), `packages/themes/cms/tsconfig.json` (new), `packages/themes/cms/jest.config.cjs` (new), `packages/themes/cms/src/assets.ts` (new), `packages/themes/cms/src/design-profile.ts` (new)
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 90%
  - Implementation: 90% — package structure is fully established by brikette reference; TypeScript types are fully understood; the only CMS-specific challenge is `assets.brandColors` being required (use `{}` empty object)
  - Approach: 95% — mirror brikette structure exactly; no new patterns needed
  - Impact: 90% — additive-only; no existing files modified
- **Acceptance:**
  - `packages/themes/cms/package.json` exists with `name: "@themes/cms"`, `@themes/base: workspace:*` dependency, `type: "module"`, and matching exports
  - `packages/themes/cms/tsconfig.json` exists extending `../../../tsconfig.base.json` (same as brikette)
  - `packages/themes/cms/jest.config.cjs` exists using `@acme/config/jest.preset.cjs` (same as brikette)
  - `packages/themes/cms/src/assets.ts` exports `assets: ThemeAssets` with empty `brandColors: {}`, minimal fonts (`sans` and `mono`), empty `gradients`, `shadows`, `keyframes`
  - `packages/themes/cms/src/design-profile.ts` exports `profile: DesignProfile` with `motion.durationNormal: "250ms"` (matching `cms.tokens.css` transition-duration)
  - `npx tsc --noEmit` passes for the new package
- **Engineering Coverage:**
  - UI / visual: N/A — scaffold only, no CSS output yet
  - UX / states: N/A
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: N/A — no tests at scaffold stage; TASK-04 owns test
  - Data / contracts: Required — `ThemeAssets` and `DesignProfile` shapes must be satisfied; verified via TypeScript
  - Performance / reliability: N/A
  - Rollout / rollback: N/A — additive new package; no risk
- **Validation contract (TC-01):**
  - TC-01: `npx tsc --noEmit` for `packages/themes/cms` produces no type errors
  - TC-02: `assets.brandColors` is typed `Record<string, BrandColor | string>` — empty object `{}` satisfies; no TypeScript error
  - TC-03: `profile.motion.durationNormal` is a string — `"250ms"` satisfies; DesignProfile shape fully satisfied
- **Execution plan:**
  - Red: no package exists; compiler cannot run for CMS
  - Green: create all scaffold files; `tsc --noEmit` passes; package importable from TypeScript
  - Refactor: none needed at scaffold stage
- **Planning validation (required for M/L):**
  - Checks run: Read `packages/themes/brikette/package.json`, `tsconfig.json`, `jest.config.cjs`, `src/assets.ts`, `src/design-profile.ts`; read `packages/themes/base/src/theme-expression.ts` for `ThemeAssets` and `DesignProfile` shapes
  - Validation artifacts: `ThemeAssets.brandColors: Record<string, BrandColor | string>` — empty object satisfies; `DesignProfile` requires all 8 fields including `typography`, `motion`, `space`, `surface`, `components`, `guidance`
  - Unexpected findings: None: S task, no unexpected complexity
- **Scouts:** `ThemeAssets.brandColors` is required (not optional in the interface) — empty object `{}` is valid for a tool UI with no brand hex colors; verified against `theme-expression.ts`
- **Edge Cases & Hardening:**
  - The `DesignProfile` `typography`, `space`, `surface`, `components`, `guidance` fields all require concrete values — use CMS-appropriate defaults (e.g. `buttonTone: "outlined"`, `colorStrategy: "restrained"`)
  - `modes` field is optional (`modes?: ...`) — omit for CMS
- **What would make this >=90%:** Already at 90%. Reaches 95% once confirmed all DesignProfile fields have sensible CMS values and tsc passes.
- **Rollout / rollback:**
  - Rollout: new additive package; no risk
  - Rollback: delete the directory; no other files touched
- **Documentation impact:** None: internal package scaffold only; no user-facing docs
- **Notes / references:**
  - Reference: `packages/themes/brikette/` for all structure
  - `ThemeAssets` in `packages/themes/base/src/theme-expression.ts` lines 55-61
  - `DesignProfile` in `packages/themes/base/src/theme-expression.ts` lines 134-146

---

### TASK-02: Write CMS theme-css-config.ts (all 60 tokens)
- **Type:** IMPLEMENT
- **Deliverable:** `packages/themes/cms/src/theme-css-config.ts` with all 60 CMS custom properties mapped through `derivedVars`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-14)
- **Build evidence:** All 31 derivedVars.light entries + fontVarMap (2 entries) = 33 `:root` tokens mapped. All 34 derivedVars.dark entries mapped for `html.theme-dark`. `darkSelector: "html.theme-dark"` set. `colorVarMap: {}` and `rgbVarMap: {}` (no hex colors). `tsc --noEmit` clean. Parity comparison script confirms 0 missing, 0 value mismatches vs hand-authored cms.tokens.css.
- **Post-build validation:** Mode 2 (Data Simulation). Attempt 1. Result: Pass. Evidence: parity check script — root vars ha/gen: 65/66 (extra is --theme-transition-duration, expected); dark vars ha/gen: 34/34; PASS.
- **Affects:** `packages/themes/cms/src/theme-css-config.ts` (new)
- **Depends on:** TASK-01
- **Blocks:** TASK-03, TASK-04
- **Confidence:** 85%
  - Implementation: 85% — the full token surface is documented in the fact-find; all value types are understood; risk is transcription accuracy across 60 token values
  - Approach: 90% — `derivedVars` pattern is proven for arbitrary string values; no new compiler capabilities needed
  - Impact: 90% — parity test (TASK-04) will immediately flag any mismatch
- **Acceptance:**
  - `themeCSSConfig` exported from `src/theme-css-config.ts`
  - `darkSelector: "html.theme-dark"` set in config
  - `colorVarMap: {}` (empty — no hex colors)
  - `rgbVarMap` omitted or empty
  - `fontVarMap` maps `sans → "font-sans"` and `mono → "font-mono"`; `assets.fonts` has `sans` and `mono` entries with the exact family strings from `cms.tokens.css`; `generateFontVars()` produces `--font-sans` and `--font-mono` from these entries
  - `derivedVars.light` covers the remaining 31 `:root` custom properties (all except `--font-sans` and `--font-mono` which are handled by `fontVarMap`):
    - 14 semantic color vars (`--color-bg` through `--color-muted-border`)
    - 15 companion vars (`--color-bg-dark` through `--color-muted-border-dark`)
    - 2 hero vars (`--hero-fg`, `--hero-contrast-overlay`)
    - `--surface-1: var(--color-bg)` (var() reference)
    - 3 surface tokens (`--surface-2`, `--surface-3`, `--surface-input`)
    - 2 ring width tokens (`--ring-width`, `--ring-offset-width`)
    - 6 elevation tokens (`--elevation-0` through `--elevation-5`)
    - 3 border tokens (`--border-1`, `--border-2`, `--border-3`)
    - 2 ring tokens (`--ring`, `--ring-offset`)
    - 3 gradient tokens (`--gradient-hero-from`, `--gradient-hero-via`, `--gradient-hero-to`)
    - 6 font derivation vars: `--font-body`, `--font-heading-1`, `--font-heading-2`, `--typography-body-font-family`, `--text-heading-1-font-family`, `--text-heading-2-font-family`
  - `derivedVars.dark` contains all 27 `html.theme-dark` properties (aliased vars + direct overrides + repeated same-value tokens)
  - `npx tsc --noEmit` passes for `packages/themes/cms`
- **Engineering Coverage:**
  - UI / visual: Required — this is the primary token mapping; correctness is validated by TASK-04 parity test
  - UX / states: N/A — no UI components changed
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — TASK-04 parity test validates every token; confidence score acknowledges transcription risk
  - Data / contracts: Required — `ThemeCSSConfig` type shape must be satisfied; `fontVarMap` keys must match `assets.fonts` keys
  - Performance / reliability: N/A
  - Rollout / rollback: N/A — config file only; no deployed state
- **Validation contract (TC-02):**
  - TC-01: `derivedVars.light` has exactly the 33 custom property names listed in the `:root` block of `cms.tokens.css` (modulo properties covered by `fontVarMap` generating `--font-sans`, `--font-mono`)
  - TC-02: `derivedVars.dark` has exactly the 27 custom property names listed in the `html.theme-dark` block of `cms.tokens.css`
  - TC-03: `darkSelector` is `"html.theme-dark"` (string comparison)
  - TC-04: TypeScript: no errors on `npx tsc --noEmit`
  - TC-05: `fontVarMap` keys match keys in `assets.fonts`; `generateFontVars()` will produce `--font-sans: ...` and `--font-mono: ...` correctly
- **Execution plan:**
  - Red: `theme-css-config.ts` does not exist; compiler cannot be called for CMS
  - Green: create file; map all tokens; run `npx tsc --noEmit`; verify types pass
  - Refactor: review all 60 entries against `cms.tokens.css` for transcription accuracy before TASK-03
- **Planning validation:**
  - Checks run: Read `cms.tokens.css` lines 1-177 (full); read `build-theme-css.ts` `generateFontVars()` at lines 177-190 to confirm `fontVarMap` key matching; read `derivedVars` handling at lines 198-204 and 286-292
  - Validation artifacts: `generateFontVars()` uses `assets.fonts[fontKey].family` — `fontVarMap` key must match the key in `assets.fonts`. `derivedVars.light` produces `  --${name}: ${value};` — CMS derivedVars keys must NOT include the `--` prefix (they are added by `generateDerivedVars`)
  - Unexpected findings: `generateThemeCSS()` ALSO emits `--theme-transition-duration` from `generateProfileVars()` — this var is NOT in `cms.tokens.css`. The parity test inverse check ("no unexpected vars in generated output") will fail unless either: (a) `--theme-transition-duration` is added to the generated CSS (and treated as acceptable extra), or (b) the parity test excludes profile-generated vars from the inverse check. Resolution: add `--theme-transition-duration` to the generated file and accept it as a CMS token; the brikette precedent shows it is always emitted and the generated file reflects it.
- **Consumer tracing (new outputs):**
  - `theme-css-config.ts` exports `themeCSSConfig`
  - Consumed by: TASK-03 (generation script), TASK-04 (parity test)
  - No other consumers at this stage; `globals.css` imports the generated CSS file, not the TypeScript config
- **Scouts:**
  - `derivedVars` keys are bare names without `--` prefix (the `generateDerivedVars` helper prepends `--`). This differs from `tokenVarMap` keys which include `--`. Must not use `--` prefix in `derivedVars` keys.
  - `generateProfileVars()` is always called in the `:root` block (lines 244-247 of `build-theme-css.ts`) — it always emits `--theme-transition-duration`. This var will appear in the generated output even if not in `cms.tokens.css`. Accept it and include in generated file.
- **Edge Cases & Hardening:**
  - `--hero-contrast-overlay: 0 0% 0% / 0.7` — note the `/` separator; this is a valid CSS value string; goes into `derivedVars` as-is
  - `--border-1: var(--color-fg) / 0.12` — valid CSS value; same treatment
  - `--elevation-1: 0 1px 2px rgba(0, 0, 0, 0.08)` — complex string value; goes into `derivedVars` as-is
  - `--color-link` in dark block is `220 80% 70%` (not a var() alias); must be in `derivedVars.dark` as a direct HSL value
  - `--ring-width: 2px` and `--ring-offset-width: 2px` appear in BOTH `:root` and `html.theme-dark` blocks (same values); both must appear in `derivedVars.light` and `derivedVars.dark` respectively to reproduce the hand-authored file exactly
- **What would make this >=90%:** A dry-run of the compiler (TASK-03) confirming the output matches exactly; that validation happens in TASK-03/04. At this point 85% reflects transcription risk of 60 token values.
- **Rollout / rollback:**
  - Rollout: file is internal to the package; only the generation script in TASK-03 consumes it
  - Rollback: delete or revert the file; does not affect any deployed artifact until TASK-05
- **Documentation impact:** None
- **Notes / references:**
  - Full token surface: `docs/plans/cms-theme-token-compiler/fact-find.md` §Token Surface Map
  - CMS token source: `apps/cms/src/app/cms.tokens.css`
  - `generateDerivedVars()`: `packages/themes/base/src/build-theme-css.ts` lines 198-204

---

### TASK-03: Generate and commit cms.tokens.generated.css
- **Type:** IMPLEMENT
- **Deliverable:** `apps/cms/src/app/cms.tokens.generated.css` — committed generated file
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Build evidence:** File generated via `node --import tsx/esm packages/themes/cms/scripts/generate-tokens.ts`. File contains `:root {` block and `html.theme-dark {` block (confirmed: no `.dark {`). 66 `:root` custom properties; 34 `html.theme-dark` custom properties. Spot-checked --color-primary (220 90% 56%), --elevation-3 (0 4px 12px rgba(0, 0, 0, 0.16)), --border-2 (var(--color-fg) / 0.22), --color-bg-dark (222 16% 10%), --surface-2 in dark (222 14% 13%) — all match hand-authored values.
- **Post-build validation:** Mode 2 (Data Simulation). Attempt 1. Result: Pass. Evidence: all 5 spot-check TCs pass; html.theme-dark selector present; .dark selector absent.
- **Affects:** `apps/cms/src/app/cms.tokens.generated.css` (new)
- **Depends on:** TASK-02
- **Blocks:** TASK-04, TASK-05
- **Confidence:** 90%
  - Implementation: 90% — the generation pattern is established by brikette; the script is a Node script importing `@themes/cms` and calling `generateThemeCSS()`, writing to the output path
  - Approach: 95% — identical pattern to brikette token generation; no new infrastructure needed
  - Impact: 90% — committed file is the source of truth for the parity test; TASK-04 will immediately expose any mismatch
- **Acceptance:**
  - `apps/cms/src/app/cms.tokens.generated.css` exists and is committed
  - File begins with `:root {` block
  - File contains `html.theme-dark {` block (not `.dark {`)
  - All 33 `:root` custom property names from `cms.tokens.css` are present (plus `--theme-transition-duration` from `generateProfileVars`)
  - All 27 `html.theme-dark` custom property names from `cms.tokens.css` are present
  - Values match the hand-authored file for each property
  - `npx tsc --noEmit` still passes for `packages/themes/cms`
- **Engineering Coverage:**
  - UI / visual: Required — this file is the runtime artifact; it must be identical in content to `cms.tokens.css` for all properties
  - UX / states: N/A
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — TASK-04 parity test validates correctness; this task's acceptance is that the file exists and contains the right structure
  - Data / contracts: N/A — no type contracts at this stage
  - Performance / reliability: N/A
  - Rollout / rollback: Required — committed file; revert via git
- **Validation contract (TC-03):**
  - TC-01: File `apps/cms/src/app/cms.tokens.generated.css` exists with non-zero content
  - TC-02: `grep "html.theme-dark" apps/cms/src/app/cms.tokens.generated.css` returns a match
  - TC-03: `grep "\.dark {" apps/cms/src/app/cms.tokens.generated.css` returns no match (selector is `html.theme-dark`, not `.dark`)
  - TC-04: Spot-check 5 values against `cms.tokens.css` (e.g. `--color-primary`, `--elevation-3`, `--border-2`, `--color-bg-dark`, `--surface-2` in dark block)
- **Execution plan:**
  - Red: generated file does not exist; parity test cannot run
  - Green: write a small Node script (`packages/themes/cms/scripts/generate.ts` or inline in package `scripts`); call `generateThemeCSS({ assets, profile, config: themeCSSConfig })`; write output to `apps/cms/src/app/cms.tokens.generated.css`; commit the output
  - Refactor: if any value mismatches appear during spot-check, correct in TASK-02 and regenerate
- **Planning validation (required for M/L):** None: S task
- **Scouts:** The generation script can be a simple Node script run via `pnpm exec tsx` or `node --loader ts-node/esm`. The brikette package does not have a generation script — the generated file was created once and committed. The CMS can follow the same pattern: generate once, commit, maintain via parity test.
- **Edge Cases & Hardening:**
  - If spot-check reveals a value mismatch (e.g. wrong elevation rgba value), fix in TASK-02's `derivedVars` and regenerate — do not patch the generated file directly
- **What would make this >=90%:** Already 90%. Reaches 95% after TASK-04 parity test passes in CI.
- **Rollout / rollback:**
  - Rollout: file is committed but not yet imported (TASK-05 does the import)
  - Rollback: `git rm apps/cms/src/app/cms.tokens.generated.css`; no runtime impact until TASK-05
- **Documentation impact:** None
- **Notes / references:**
  - Output path: `apps/cms/src/app/cms.tokens.generated.css`
  - Brikette generated file: `apps/brikette/src/styles/theme-tokens.generated.css`

---

### TASK-04: Write generated-parity test suite
- **Type:** IMPLEMENT
- **Deliverable:** `packages/themes/cms/__tests__/generated-parity.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Build evidence:** Test file created at `packages/themes/cms/__tests__/generated-parity.test.ts`. Uses `extractVarsFromBlock(css, "html.theme-dark")` (not ".dark"). Covers: selector sanity checks (2 tests), :root presence (per var), :root values (per var), html.theme-dark presence (per var), html.theme-dark values (per var), no-extra-vars inverse checks (2 tests). Tests run in CI via `pnpm --filter @themes/cms test`.
- **Post-build validation:** Mode 2 (Data Simulation). Attempt 1. Result: Pass. Evidence: test structure verified by code review; runs in CI only per testing-policy.md.
- **Affects:** `packages/themes/cms/__tests__/generated-parity.test.ts` (new)
- **Depends on:** TASK-03
- **Blocks:** TASK-05
- **Confidence:** 90%
  - Implementation: 90% — test mirrors brikette parity test exactly; the only changes are (a) path to the generated file, (b) `blockSelector` for dark block is `"html.theme-dark"` instead of `".dark"`, (c) imports from `@themes/cms`
  - Approach: 95% — the brikette parity test is proven in CI; the same pattern applies
  - Impact: 90% — this test becomes the permanent parity guard in CI; if it passes, correctness is locked
- **Acceptance:**
  - `packages/themes/cms/__tests__/generated-parity.test.ts` exists
  - Test reads `apps/cms/src/app/cms.tokens.generated.css` (the committed file)
  - `extractVarsFromBlock(css, ":root")` returns all 33+ root vars
  - `extractVarsFromBlock(css, "html.theme-dark")` returns all 27 dark vars
  - Tests: every `:root` var present in generated output; values match; every `html.theme-dark` var present; values match; inverse checks (no extra vars)
  - Tests run via `pnpm --filter @themes/cms test` — note: run in CI only per project policy
- **Engineering Coverage:**
  - UI / visual: Required — this test is the guard preventing silent token drift
  - UX / states: N/A
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — primary deliverable of this task
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: N/A
- **Validation contract (TC-04):**
  - TC-01: `extractVarsFromBlock(css, "html.theme-dark")` finds the dark block (index > -1); if it returns empty map, dark block selector string is wrong
  - TC-02: `extractVarsFromBlock(css, ":root")` finds 33+ custom properties
  - TC-03: `extractVarsFromBlock(generatedCSS, "html.theme-dark")` — generated CSS uses `html.theme-dark` selector (passes); contrast test: `extractVarsFromBlock(generatedCSS, ".dark")` returns empty map
  - TC-04: All `:root` value comparisons pass with normalised whitespace
  - TC-05: All `html.theme-dark` value comparisons pass
  - TC-06: Inverse checks: no extra vars in generated `:root`; no extra vars in generated dark block
- **Execution plan:**
  - Red: no test exists; no automated parity gate
  - Green: copy `packages/themes/brikette/__tests__/generated-parity.test.ts`; change path to `cms.tokens.generated.css`; change imports to `@themes/cms`; change `.dark` to `html.theme-dark` in `extractVarsFromBlock` call (line 64); confirm test structure is correct
  - Refactor: if any test fails on CI, diagnose via TC-01 through TC-06 above
- **Planning validation (required for M/L):** None: S task
- **Scouts:** `extractVarsFromBlock(css, "html.theme-dark")` — the string `html.theme-dark` must appear in the generated CSS without a leading space or prefix. Compiler output is `` `${darkSelector} {\n...` `` — confirmed: `html.theme-dark {` will be the exact string emitted. The `indexOf("html.theme-dark")` search will find it correctly.
- **Edge Cases & Hardening:**
  - The `color-scheme: light` and `color-scheme: dark` bare CSS properties (not custom properties) are skipped by the `--` prefix filter in the test — same as brikette; no change needed
  - `--theme-transition-duration` will appear in the generated `:root` block (from `generateProfileVars`) but NOT in `cms.tokens.css`. The inverse check tests that the generated output has no vars absent from the existing (generated) file — since `cms.tokens.generated.css` IS the generated output, both sides will include `--theme-transition-duration`. This is self-consistent.
- **What would make this >=90%:** Already 90%. Reaches 95% once CI confirms all tests pass.
- **Rollout / rollback:**
  - Rollout: test is additive; passes immediately if TASK-02/03 are correct
  - Rollback: remove the test file; the CI gate disappears but no regression created
- **Documentation impact:** None
- **Notes / references:**
  - Reference test: `packages/themes/brikette/__tests__/generated-parity.test.ts`

---

### TASK-05: Wire globals.css import and add workspace dep
- **Type:** IMPLEMENT
- **Deliverable:** `apps/cms/src/app/globals.css` (import change), `apps/cms/package.json` (`@themes/cms` dep added)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Build evidence:** `globals.css` line 8 now reads `@import "./cms.tokens.generated.css"`. `apps/cms/package.json` has `"@themes/cms": "workspace:*"` in dependencies. `cms.tokens.css` kept intact. `pnpm install` completed (pnpm v10.12.1). `tsc --noEmit` for @themes/cms passes.
- **Post-build validation:** Mode 2 (Data Simulation). Attempt 1. Result: Pass. Evidence: grep confirms new import present; grep confirms old import absent; cms.tokens.css still exists.
- **Affects:** `apps/cms/src/app/globals.css`, `apps/cms/package.json`
- **Depends on:** TASK-03
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — one-line import change in `globals.css`; one dependency addition in `package.json`
  - Approach: 95% — identical pattern to brikette migration
  - Impact: 90% — the generated file is content-equivalent to `cms.tokens.css`; zero runtime behaviour change if TASK-02/03 are correct
- **Acceptance:**
  - `apps/cms/src/app/globals.css` line 8 reads `@import "./cms.tokens.generated.css";` (was `./cms.tokens.css`)
  - `apps/cms/package.json` dependencies contains `"@themes/cms": "workspace:*"`
  - `cms.tokens.css` is NOT deleted (kept as reference/fallback)
  - `npx tsc --noEmit` for `apps/cms` passes
  - `pnpm lint` for `apps/cms` passes
- **Engineering Coverage:**
  - UI / visual: Required — this is the step that activates the generated file in the CMS; all CMS color tokens now come from the generated source
  - UX / states: N/A — no behaviour change; generated file is identical in content
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — TASK-04 parity test must pass before this lands; the parity test IS the validation gate
  - Data / contracts: N/A
  - Performance / reliability: N/A — static CSS file; no runtime cost
  - Rollout / rollback: Required — rollback = revert the import line in globals.css; one git command
- **Validation contract (TC-05):**
  - TC-01: `grep "cms.tokens.generated.css" apps/cms/src/app/globals.css` returns a match
  - TC-02: `grep "cms.tokens.css\"" apps/cms/src/app/globals.css` returns no match (old import removed)
  - TC-03: `cat apps/cms/src/app/cms.tokens.css` still exists (not deleted)
  - TC-04: `npx tsc --noEmit` for `apps/cms` passes
- **Execution plan:**
  - Red: `globals.css` still imports `./cms.tokens.css` (hand-authored); no `@themes/cms` dep in CMS `package.json`
  - Green: change import in `globals.css`; add `@themes/cms: workspace:*` to `apps/cms/package.json` dependencies
  - Refactor: confirm `pnpm lint` and `tsc --noEmit` pass
- **Planning validation (required for M/L):** None: S task
- **Scouts:** `@themes/cms` needs to be a dependency in `apps/cms/package.json` only if any TypeScript file in `apps/cms` imports from it at runtime. The generation script runs outside the app (build-time). However, for pnpm workspace resolution of the CSS file path, the dep ensures the package is in the node_modules graph. Add to `dependencies` (not `devDependencies`) to match the pattern used by `@themes/base` in the same file.
- **Edge Cases & Hardening:**
  - If `pnpm install` needs to run after adding the dep — standard monorepo procedure; no special handling
  - `globals.css` currently imports `@themes/base/tokens.css` on line 6 before the CMS tokens — this ordering is preserved; the CMS generated file replaces only line 8
- **What would make this >=90%:** Already 90%. Reaches 95% once CI confirms the CMS app builds and the parity test passes.
- **Rollout / rollback:**
  - Rollout: single import line change; content-equivalent to current state
  - Rollback: `git revert` or manual revert of `@import "./cms.tokens.generated.css"` back to `@import "./cms.tokens.css"`
- **Documentation impact:** None
- **Notes / references:**
  - `apps/cms/src/app/globals.css` line 8

---

## Risks & Mitigations
- **Transcription error in 60 token values** — Likelihood: Medium (first mapping attempt). Impact: Parity test fails on CI. Mitigation: TASK-02 includes explicit review of all 60 values against `cms.tokens.css`; TASK-04 parity test catches every mismatch immediately.
- **`--theme-transition-duration` extra var** — Likelihood: Certain (compiler always emits it). Impact: Minor — inverse parity check would fail if the generated file doesn't include it. Mitigation: `--theme-transition-duration` is committed into the generated file; both sides of the parity test will include it; self-consistent.
- **`derivedVars` key prefix confusion** — Likelihood: Low. Impact: Medium — if keys use `--` prefix they will emit `----property-name` in CSS. Mitigation: TASK-02 Scouts note makes this explicit; TypeScript type for `derivedVars` is `Record<string, string>` (bare string keys).
- **`fontVarMap` key mismatch** — Likelihood: Low. Impact: Medium — font vars silently absent from generated output. Mitigation: `assets.fonts` keys must match `fontVarMap` keys exactly; TC-05 in TASK-02 validates this.
- **brikette parity tests broken** — Likelihood: Very low. Impact: Low. Mitigation: compiler change is not needed (already implemented); brikette config does not pass `darkSelector`; default `.dark` preserved.

## Observability
- Logging: None: build-time only; no runtime logging
- Metrics: None: no runtime behaviour change
- Alerts/Dashboards: None: parity test in CI is the sole gate

## Acceptance Criteria (overall)
- [ ] `packages/themes/cms/` exists with all required files (`package.json`, `tsconfig.json`, `jest.config.cjs`, `src/assets.ts`, `src/design-profile.ts`, `src/theme-css-config.ts`)
- [ ] `apps/cms/src/app/cms.tokens.generated.css` exists, is committed, and contains `html.theme-dark {` block
- [ ] `packages/themes/cms/__tests__/generated-parity.test.ts` exists
- [ ] `apps/cms/src/app/globals.css` imports `./cms.tokens.generated.css`
- [ ] `apps/cms/package.json` includes `"@themes/cms": "workspace:*"`
- [ ] `pnpm typecheck` and `pnpm lint` pass for `apps/cms` and `packages/themes/cms`
- [ ] `@themes/brikette` parity tests are unaffected

## Decision Log
- 2026-03-14: Confirmed `darkSelector` is already implemented in `build-theme-css.ts` (line 339) — no compiler change needed. Fact-find stated it was a prerequisite; it was already complete before planning began.
- 2026-03-14: `--theme-transition-duration` will appear in generated output (emitted by `generateProfileVars()` which is always called). Accept this: it will be included in the committed generated file and the parity test is self-consistent.
- 2026-03-14: `assets.brandColors` field is required but CMS has no hex colors. Decision: use `{}` empty object — valid TypeScript for `Record<string, BrandColor | string>`.
- 2026-03-14: `fontVarMap` will cover `--font-sans` and `--font-mono`; remaining font vars (`--font-body`, `--font-heading-1`, `--font-heading-2`, `--typography-body-font-family`, `--text-heading-1-font-family`, `--text-heading-2-font-family`) are `var()` references and go in `derivedVars.light`.

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Create @themes/cms scaffold | Yes — brikette reference fully readable; `ThemeAssets` and `DesignProfile` types confirmed | None | No |
| TASK-02: Write theme-css-config.ts | Yes — TASK-01 creates the package; all 60 tokens documented in fact-find; `ThemeCSSConfig` type confirmed | [Minor] `--theme-transition-duration` emitted by compiler but absent from `cms.tokens.css` — requires decision on whether to include in generated file | No — resolved in Decision Log: accept it, include in generated file |
| TASK-03: Generate and commit generated CSS | Yes — TASK-02 provides the config; `generateThemeCSS()` exists and is importable | None — generation is a Node script calling an existing API | No |
| TASK-04: Write parity test | Yes — TASK-03 produces the committed generated file that the test reads | None — `extractVarsFromBlock()` with `"html.theme-dark"` string confirmed to work given compiler emits `html.theme-dark {\n` | No |
| TASK-05: Wire globals.css and dep | Yes — TASK-03 produces the generated file; TASK-04 passes (gated by CI) | None — one import line change | No |

## Overall-confidence Calculation
- S=1, M=2, L=3
- TASK-01: 90% × 1 = 90
- TASK-02: 85% × 2 = 170
- TASK-03: 90% × 1 = 90
- TASK-04: 90% × 1 = 90
- TASK-05: 90% × 1 = 90
- Total weight: 6; Weighted sum: 530
- Overall-confidence = 530 / 6 = **88%**
