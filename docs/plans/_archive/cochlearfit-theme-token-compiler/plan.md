---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-14
Last-reviewed: 2026-03-14
Last-updated: 2026-03-14
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: cochlearfit-theme-token-compiler
Dispatch-ID: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 90%
Confidence-Method: "min(Implementation,Approach,Impact); overall weighted by effort"
Auto-Build-Intent: plan+auto
Related-Analysis: "None: no analysis stage; fact-find was sufficient for direct planning"
---

# Cochlearfit Theme Token Compiler Retrofit — Plan

## Summary

Cochlearfit's 25 CSS custom properties are currently hand-authored in `apps/cochlearfit/src/app/globals.css`. This plan moves them into the same structured three-layer compiler system used by brikette (`assets.ts` → `design-profile.ts` → `theme-css-config.ts`, compiled by `generateThemeCSS()`). A new `packages/themes/cochlearfit/` package is created from scratch, a generator script is added, the generated CSS file is committed to the app, a parity test is added, and the hand-authored `:root` block in `globals.css` is replaced with an `@import` of the generated file. Zero compiler changes are required. The change is light-only (no dark mode) and structure-preserving — all token values are identical to today.

## Active tasks
- [x] TASK-01: Create `packages/themes/cochlearfit/` package skeleton — Complete (2026-03-14)
- [x] TASK-02: Author source files (`assets.ts`, `design-profile.ts`, `theme-css-config.ts`, `index.ts`) — Complete (2026-03-14)
- [x] TASK-03: Add generator script entry to `scripts/package.json` — Complete (2026-03-14)
- [x] TASK-04: Create generator script and run it to produce the committed generated CSS — Complete (2026-03-14)
- [x] TASK-05: Write parity test — Complete (2026-03-14)
- [x] TASK-06: Update `globals.css` — replace `:root` block with `@import` — Complete (2026-03-14)

## Goals
- Move cochlearfit's token surface into the same three-layer compiler system as brikette
- Produce `apps/cochlearfit/src/app/theme-tokens.generated.css` committed to repo, containing all 25 hand-authored custom properties plus the compiler-emitted extras (`--theme-transition-duration`, `.dark { color-scheme: dark; }`)
- Write a parity test that proves fresh `generateThemeCSS()` output matches the committed generated file (generator-to-snapshot freshness gate)
- Remove the hand-authored `:root` custom-property block from `globals.css`; replace with `@import "./theme-tokens.generated.css"`

## Non-goals
- Dark mode — cochlearfit is light-only; no `.dark` override block will be authored
- Token value changes — structure-preserving retrofit only
- Migrating `body`, `::selection`, `@layer utilities`, or `@keyframes` blocks — only the `:root` custom properties are in scope
- Adding cochlearfit tokens to any shared package
- Compiler changes — `generateThemeCSS()` already supports the `derivedVars.light` path

## Constraints & Assumptions
- Constraints:
  - All 25 existing CSS custom property values must be preserved exactly (no value changes)
  - Tests run in CI only — never run `jest`/`pnpm test` locally; typecheck via `pnpm --filter @apps/cochlearfit typecheck` (which wraps `run-next-app.sh --mode typecheck`)
  - Jest resolves `@themes/*` to `packages/themes/*/src` via workspace path mapping — parity test imports `@themes/base` via this mechanism, and cochlearfit source files via relative `../src/*` imports
  - The generator script (`scripts/cochlearfit/generate-theme-tokens.ts`) MUST use **relative file imports** (e.g. `../../packages/themes/base/src/index.js`, `../../packages/themes/cochlearfit/src/index.js`) — NOT `@themes/*` package name imports. When `pnpm --filter scripts cochlearfit:generate-theme-tokens` runs, it sets CWD to `scripts/`; from there `@themes/brikette` and `@themes/cochlearfit` are NOT resolvable (`node_modules/@themes/` at root only has `base`; `scripts/tsconfig.json` paths override inherited `@themes/*` paths). This is confirmed: `pnpm --filter scripts brikette:generate-theme-tokens` currently fails with `Cannot find module '@themes/brikette'`. Relative file paths from `scripts/cochlearfit/` do resolve correctly (verified).
  - `--color-link` in globals.css is a literal HSL value (`9 62% 48%`), not a `var(...)` reference — the fact-find mapping (which marks it as `var(--color-accent)`) must be corrected; see TASK-02 notes
  - The app does NOT need `@themes/cochlearfit` in its `package.json` — brikette does not have `@themes/brikette` in `apps/brikette/package.json`; the parity test uses relative imports `../src/*`; the generator uses relative file paths
- Assumptions:
  - The brikette package/test/generator structure is the correct and complete reference, with the exception that the generator script import style must change to relative paths (brikette generator is currently broken for the same reason)
  - `derivedVars.light` is the correct mechanism for all 25 tokens (confirmed by reviewing compiler source)
  - The compiler always emits a `.dark { color-scheme: dark; }` block and `--theme-transition-duration` regardless of config — these are **accepted shipped behavior** in the committed generated file, not errors. The parity test proves generator-to-snapshot freshness, not literal equivalence to the hand-authored globals.css block. This is the same design as brikette.
  - No post-processing step is needed to strip the compiler extras — the generated file is the intended deployed output

## Inherited Outcome Contract

- **Why:** Hand-authored CSS custom properties drift silently — there is no gate to detect a value change or a new token that should have been added. Moving cochlearfit into the compiler system gives the same structural protection brikette has: a committed generated file and a parity test that fails when the source config diverges from the committed snapshot.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** cochlearfit's CSS token surface is managed through the same three-layer compiler system as brikette, eliminating hand-authored duplication and enabling systematic theme management
- **Source:** auto

## Analysis Reference
- Related analysis: None — no analysis stage performed; fact-find was sufficient for direct planning (all decisions were resolvable without option comparison)
- Selected approach inherited:
  - `derivedVars.light` for all 25 tokens; no `brandColors`, `colorVarMap`, `fontVarMap`, or `rgbVarMap`
- Key reasoning used:
  - HSL triplet values are emitted verbatim by `generateDerivedVars()` — no conversion required
  - Compiler already supports empty color/font/rgb maps
  - All decisions resolved from codebase evidence; no operator forks required

## Selected Approach Summary
- What was chosen:
  - All 25 custom properties go into `derivedVars.light` in `ThemeCSSConfig`
  - `assets.ts` is a minimal stub (empty maps satisfying `ThemeAssets` interface)
  - `design-profile.ts` contains real guidance metadata for cochlearfit's warm-earth, light-only character
  - Package structure mirrors brikette exactly (minus `recipes.ts` — cochlearfit has no component recipes)
- Why planning is not reopening option selection:
  - The fact-find confirmed the approach with evidence from compiler source (line 198–204, `generateDerivedVars()` emits verbatim); no viable alternatives exist for this migration path

## Fact-Find Support
- Supporting brief: `docs/plans/cochlearfit-theme-token-compiler/fact-find.md`
- Evidence carried forward:
  - Full 25-property token mapping enumerated in `fact-find.md` § ThemeCSSConfig Mapping
  - Compiler behaviour verified: `color-scheme: light` is emitted automatically (line 241); `derivedVars.light` emitted verbatim (lines 198–204)
  - Brikette package structure and test pattern confirmed as reference
  - One correction needed vs. fact-find: `--color-link` in actual `globals.css` is `9 62% 48%` (literal HSL), not `var(--color-accent)` — see globals.css line 17

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Create package skeleton (package.json, tsconfig.json, jest.config.cjs) | 95% | S | Pending | - | TASK-02 |
| TASK-02 | IMPLEMENT | Author source files (assets.ts, design-profile.ts, theme-css-config.ts, index.ts) | 90% | M | Pending | TASK-01 | TASK-03, TASK-04 |
| TASK-03 | IMPLEMENT | Add generator script entry to `scripts/package.json` | 95% | S | Pending | TASK-01 | TASK-04 |
| TASK-04 | IMPLEMENT | Create generator script; run it to produce committed generated CSS | 90% | S | Pending | TASK-02, TASK-03 | TASK-05 |
| TASK-05 | IMPLEMENT | Write parity test in `packages/themes/cochlearfit/__tests__/` | 90% | S | Pending | TASK-04 | TASK-06 |
| TASK-06 | IMPLEMENT | Update globals.css: add `@import`, remove hand-authored `:root` block | 95% | S | Pending | TASK-04, TASK-05 | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | Parity test + committed generated file guarantee exact token value reproduction | TASK-04, TASK-05 | Zero value changes; parity test is the gate |
| UX / states | N/A | - | No interactive state depends on token structure |
| Security / privacy | N/A | - | CSS tokens only |
| Logging / observability / audit | N/A | - | No runtime logging |
| Testing / validation | New parity test in `packages/themes/cochlearfit/__tests__/generated-parity.test.ts` | TASK-05 | Light-only variant of brikette test; `.dark` block skipped |
| Data / contracts | `ThemeCSSConfig`, `ThemeAssets`, `DesignProfile` all stable; `generateThemeCSS()` API unchanged | TASK-02 | HSL triplet strategy verified against compiler source |
| Performance / reliability | N/A | - | Generated CSS is static; no runtime cost change |
| Rollout / rollback | Two-phase: generated file committed before globals.css is updated; rollback = revert TASK-06 commit | TASK-04, TASK-06 | Intermediate state (both committed file and hand-authored block) is valid for one commit window |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Package skeleton; no dependencies |
| 2 | TASK-02, TASK-03 | TASK-01 | Can proceed in parallel; TASK-02 authors source files; TASK-03 adds scripts entry (no app dep change needed) |
| 3 | TASK-04 | TASK-02, TASK-03 | Generator needs source files + script entry in place |
| 4 | TASK-05 | TASK-04 | Parity test reads committed generated file |
| 5 | TASK-06 | TASK-04, TASK-05 | globals.css swap must come after parity test exists and passes |

## Delivered Processes

None: no material process topology change. The change is additive (new package + generated file + test) plus a structural swap of `:root` vars in globals.css. No workflow, CI lane, approval path, operator runbook, or multi-step process is modified.

## Tasks

---

### TASK-01: Create `packages/themes/cochlearfit/` package skeleton
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `packages/themes/cochlearfit/package.json`, `packages/themes/cochlearfit/tsconfig.json`, `packages/themes/cochlearfit/jest.config.cjs`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `packages/themes/cochlearfit/package.json` (new)
  - `packages/themes/cochlearfit/tsconfig.json` (new)
  - `packages/themes/cochlearfit/jest.config.cjs` (new)
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 95%
  - Implementation: 95% — exact clone of brikette package skeleton; only name and exports differ
  - Approach: 95% — package name `@themes/cochlearfit` confirmed by fact-find and existing package naming pattern
  - Impact: 95% — scaffold only; no runtime impact until source files authored in TASK-02
- **Acceptance:**
  - `packages/themes/cochlearfit/package.json` exists with `name: "@themes/cochlearfit"`, `"@themes/base": "workspace:*"` dependency, no `recipes` export (cochlearfit has no recipes)
  - `packages/themes/cochlearfit/tsconfig.json` exists, extends `../../../tsconfig.base.json`, includes `src/**/*`, excludes `dist` and `**/__tests__/**`
  - `packages/themes/cochlearfit/jest.config.cjs` exists as one-liner: `module.exports = require("@acme/config/jest.preset.cjs")();`
- **Engineering Coverage:**
  - UI / visual: N/A — scaffold files only
  - UX / states: N/A — scaffold files only
  - Security / privacy: N/A — scaffold files only
  - Logging / observability / audit: N/A — scaffold files only
  - Testing / validation: Required — `jest.config.cjs` must be correct for CI to pick up tests authored in TASK-05
  - Data / contracts: N/A — no contract surfaces introduced
  - Performance / reliability: N/A — scaffold files only
  - Rollout / rollback: N/A — new files; rollback is deletion
- **Validation contract (TC-01):**
  - TC-01: `packages/themes/cochlearfit/package.json` has correct name, type module, no recipes export → present with correct values
  - TC-02: `jest.config.cjs` one-liner matches brikette exactly → confirmed by diff
- **Execution plan:**
  - Red: no package files exist
  - Green: create `package.json` (clone brikette; change name, remove recipes export), `tsconfig.json` (clone brikette; identical), `jest.config.cjs` (clone brikette; identical one-liner)
  - Refactor: none needed for scaffold
- **Planning validation:**
  - Checks run: read brikette `package.json`, `tsconfig.json`, `jest.config.cjs`
  - Validation artifacts: confirmed exact file contents above
  - Unexpected findings: brikette has a `recipes` export in `package.json`/`index.ts` — cochlearfit has no recipes; exports block omits it
- **Scouts:** Verify no existing `packages/themes/cochlearfit/` directory before creating (none found in glob scan)
- **Edge Cases & Hardening:** The `"type": "module"` field is required for ESM compatibility; do not omit
- **What would make this >=90%:** Already at 95%; CI green would confirm jest.config picks up tests
- **Rollout / rollback:**
  - Rollout: new files only; no existing files modified
  - Rollback: delete `packages/themes/cochlearfit/` directory
- **Documentation impact:** None
- **Notes / references:** Brikette reference: `packages/themes/brikette/package.json`, `packages/themes/brikette/tsconfig.json`, `packages/themes/brikette/jest.config.cjs`

---

### TASK-02: Author source files
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `packages/themes/cochlearfit/src/assets.ts`, `src/design-profile.ts`, `src/theme-css-config.ts`, `src/index.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `packages/themes/cochlearfit/src/assets.ts` (new)
  - `packages/themes/cochlearfit/src/design-profile.ts` (new)
  - `packages/themes/cochlearfit/src/theme-css-config.ts` (new)
  - `packages/themes/cochlearfit/src/index.ts` (new)
- **Depends on:** TASK-01
- **Blocks:** TASK-04
- **Confidence:** 90%
  - Implementation: 90% — all content fully specified in fact-find; one correction needed for `--color-link` (see notes); `ThemeAssets` and `DesignProfile` types inspected
  - Approach: 95% — `derivedVars.light` strategy verified against compiler source lines 198–204, 286–292; produces verbatim output
  - Impact: 90% — correct token values are the sole risk; parity test in TASK-05 is the safety net
- **Acceptance:**
  - `assets.ts` exports `const assets: ThemeAssets` with all five required fields (`fonts`, `gradients`, `shadows`, `keyframes`, `brandColors`) as empty objects/records — TypeScript compiles without error
  - `design-profile.ts` exports `const profile: DesignProfile` with all required fields populated
  - `theme-css-config.ts` exports `const themeCSSConfig: ThemeCSSConfig` with `colorVarMap: {}`, `fontVarMap: {}`, `rgbVarMap: {}`, and `derivedVars.light` containing all 25 tokens
  - `--color-link` value is `"9 62% 48%"` (literal HSL from globals.css line 17, not `var(--color-accent)`)
  - `index.ts` exports `assets`, `profile`, `themeCSSConfig` (no `recipes`)
  - `pnpm --filter @apps/cochlearfit typecheck` passes (covers the app; the theme package typechecks via `npx tsc --noEmit` run from `packages/themes/cochlearfit/ `)
- **Engineering Coverage:**
  - UI / visual: Required — all 25 token values must match globals.css exactly; `--color-link` correction from var-ref to literal is the key risk
  - UX / states: N/A — source files only, no interactive state
  - Security / privacy: N/A — CSS tokens only
  - Logging / observability / audit: N/A — no runtime logging
  - Testing / validation: Required — source files must typecheck cleanly; parity test in TASK-05 validates values
  - Data / contracts: Required — `ThemeAssets` requires all 5 fields; `DesignProfile` requires `typography`, `motion`, `space`, `surface`, `components`, `guidance`; verify against `theme-expression.ts`
  - Performance / reliability: N/A — static CSS config
  - Rollout / rollback: N/A — new files only
- **Validation contract (TC-02):**
  - TC-01: `assets.ts` satisfies `ThemeAssets` interface (all 5 fields present) → TypeScript compiles
  - TC-02: `theme-css-config.ts` has exactly 25 entries in `derivedVars.light` matching globals.css → confirmed by parity test (TASK-05)
  - TC-03: `--color-link` = `"9 62% 48%"` (literal, not var-ref) → matches globals.css line 17
  - TC-04: `index.ts` exports match brikette pattern minus `recipes` → TypeScript compiles
- **Execution plan:**
  - Red: source directory does not exist
  - Green: create `src/` directory; author all 4 files per fact-find specification with `--color-link` correction applied
  - Refactor: ensure `design-profile.ts` guidance fields accurately reflect cochlearfit's warm-earth, healthcare-adjacent character
- **Planning validation (M effort):**
  - Checks run: inspected `ThemeAssets` interface at `packages/themes/base/src/theme-expression.ts` lines 55–61; confirmed 5 required fields. Inspected `DesignProfile` interface (lines 86–). Verified `generateDerivedVars()` at build-theme-css.ts lines 198–204 emits `--${name}: ${value};` verbatim.
  - Validation artifacts: `ThemeAssets { fonts, gradients, shadows, keyframes, brandColors }` — all empty objects valid. `DesignProfile` requires `typography`, `motion`, `space`, `surface`, `components`, `guidance` categories.
  - Unexpected findings: `--color-link` in globals.css is `9 62% 48%` literal (not `var(--color-accent)` as stated in fact-find token table). The fact-find's "Classification" column said "Derived (equals accent)" but the value row shows the literal. The `ThemeCSSConfig Mapping` in the fact-find also lists it as `var(--color-accent)`. The actual globals.css line 17 is authoritative: `--color-link: 9 62% 48%;` — use this literal.
- **Consumer tracing (new outputs):**
  - `assets`, `profile`, `themeCSSConfig` — consumed by generator script (TASK-04) and parity test (TASK-05). Both are addressed in their respective tasks.
  - No existing consumer is modified — this is a new package.
- **Scouts:** Read `packages/themes/base/src/theme-expression.ts` lines 55–61, 86–160 to confirm all required interface fields before authoring
- **Edge Cases & Hardening:**
  - `ThemeAssets` fields must be empty `{}` or `{}` typed objects, not `undefined` — interface requires the fields to be present
  - `DesignProfile` has no optional fields in Categories A/B/C — must supply all required properties
- **What would make this >=90%:** Already at 90%; CI green would confirm no TypeScript errors
- **Rollout / rollback:**
  - Rollout: new files; no existing files modified
  - Rollback: delete `packages/themes/cochlearfit/src/`
- **Documentation impact:** None
- **Notes / references:**
  - Token mapping: `fact-find.md` § ThemeCSSConfig Mapping — use with `--color-link` correction
  - `ThemeAssets` interface: `packages/themes/base/src/theme-expression.ts` line 55
  - `DesignProfile` interface: `packages/themes/base/src/theme-expression.ts` line 86+
  - `generateDerivedVars()`: `packages/themes/base/src/build-theme-css.ts` lines 198–204

---

### TASK-03: Add generator script entry to `scripts/package.json`
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `scripts/package.json` (add script entry)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `scripts/package.json` (modified — add generator script entry)
- **Depends on:** TASK-01
- **Blocks:** TASK-04
- **Confidence:** 95%
  - Implementation: 95% — single line addition to `scripts` object following the brikette pattern exactly
  - Approach: 95% — `tsx` resolves workspace packages without needing an explicit app-level dep; confirmed by brikette which has no `@themes/brikette` in `apps/brikette/package.json`
  - Impact: 95% — no runtime impact; enables generator invocation via `pnpm --filter scripts`
- **Acceptance:**
  - `scripts/package.json` `scripts` object contains `"cochlearfit:generate-theme-tokens": "node --import tsx ../scripts/cochlearfit/generate-theme-tokens.ts"`
  - `apps/cochlearfit/package.json` is NOT modified — no `@themes/cochlearfit` dep needed (parity test uses relative `../src/*` imports; generator uses relative file path imports to avoid broken workspace package resolution from `scripts/` CWD)
- **Engineering Coverage:**
  - UI / visual: N/A — package.json change only
  - UX / states: N/A
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: N/A — test resolution uses relative imports, not package resolution
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: N/A — manifest-only change; revert removes entry
- **Validation contract (TC-03):**
  - TC-01: generator script entry in `scripts/package.json` matches brikette pattern with cochlearfit paths → confirmed by diff
  - TC-02: `apps/cochlearfit/package.json` unchanged (no spurious dep added) → confirmed by diff
- **Execution plan:**
  - Red: `scripts/package.json` lacks the script entry
  - Green: add `"cochlearfit:generate-theme-tokens": "node --import tsx ../scripts/cochlearfit/generate-theme-tokens.ts"` to `scripts/package.json` scripts object
  - Refactor: none
- **Planning validation:** Confirmed brikette entry `"brikette:generate-theme-tokens": "node --import tsx ../scripts/brikette/generate-theme-tokens.ts"` at line 63. The `../scripts/` prefix works because `pnpm` runs scripts from the package directory (`scripts/`), so `../scripts/brikette/` resolves to the monorepo's `scripts/brikette/` dir. Match the pattern exactly.
- **Scouts:** Verify brikette app `package.json` has no `@themes/brikette` dep (confirmed — `apps/brikette/package.json` has no such entry)
- **Edge Cases & Hardening:** Do not add `@themes/cochlearfit` to `apps/cochlearfit/package.json` — this would be unnecessary churn. The generator must use relative file imports (not `@themes/*` names) because workspace package resolution is broken from the `scripts/` CWD.
- **What would make this >=90%:** Already at 95%
- **Rollout / rollback:**
  - Rollout: single line addition to scripts/package.json
  - Rollback: remove the added line
- **Documentation impact:** None
- **Notes / references:** Brikette script entry: `scripts/package.json` line 63

---

### TASK-04: Create generator script and produce committed generated CSS
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `scripts/cochlearfit/generate-theme-tokens.ts` (new), `apps/cochlearfit/src/app/theme-tokens.generated.css` (new, committed)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `scripts/cochlearfit/generate-theme-tokens.ts` (new)
  - `apps/cochlearfit/src/app/theme-tokens.generated.css` (new — must be committed)
- **Depends on:** TASK-02, TASK-03
- **Blocks:** TASK-05, TASK-06
- **Confidence:** 90%
  - Implementation: 90% — exact clone of brikette generator with path corrections; running the script requires TASK-02+03 complete
  - Approach: 90% — script runs via `pnpm --filter scripts cochlearfit:generate-theme-tokens`; writes to output path
  - Impact: 90% — generated file is the source of truth for the parity test and globals.css import
- **Acceptance:**
  - `scripts/cochlearfit/generate-theme-tokens.ts` exists, uses **relative file path imports** (e.g. `../../packages/themes/base/src/index.js` and `../../packages/themes/cochlearfit/src/index.js`) — NOT `@themes/*` package name imports, which do not resolve from the `scripts/` CWD; outputs to `apps/cochlearfit/src/app/theme-tokens.generated.css`
  - Generated CSS file exists at `apps/cochlearfit/src/app/theme-tokens.generated.css` and is committed (not gitignored)
  - Generated file `:root` block contains all 25 custom properties plus `--theme-transition-duration` (compiler-emitted from `generateProfileVars()`) — this is accepted shipped behavior
  - Generated file contains `color-scheme: light;` in `:root` (compiler emits it automatically)
  - Generated file contains a `.dark { color-scheme: dark; }` block with no custom properties — this is accepted shipped behavior (the compiler always emits it; it is harmless in the browser for a light-only theme)
  - Generated file has the auto-generated banner comment
- **Engineering Coverage:**
  - UI / visual: Required — generated file must contain all 25 tokens with correct values
  - UX / states: N/A
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — committed file is the source of truth for parity test (TASK-05); must be committed before test is written
  - Data / contracts: Required — `generateThemeCSS()` API call matches `GenerateThemeCSSOptions` signature `{ assets, profile, config }`
  - Performance / reliability: N/A
  - Rollout / rollback: Required — two-phase rollout: generated file committed here; globals.css updated in TASK-06. Rolling back TASK-06 is safe because this generated file remains valid.
- **Validation contract (TC-04):**
  - TC-01: Generator runs without error (`pnpm --filter scripts cochlearfit:generate-theme-tokens` exits 0) → confirmed by running
  - TC-02: Generated file contains 25 `--` custom properties in `:root` block → confirmed by output inspection
  - TC-03: Generated file contains `color-scheme: light;` → confirmed by output inspection
  - TC-04: `.dark` block contains only `color-scheme: dark;` (no custom properties — accepted shipped behavior) → confirmed by output inspection
- **Execution plan:**
  - Red: generator script does not exist; no generated CSS file
  - Green: create `scripts/cochlearfit/` directory; author `generate-theme-tokens.ts` — **use relative file path imports** (`import { generateThemeCSS } from "../../packages/themes/base/src/index.js"` and `import { assets, profile, themeCSSConfig } from "../../packages/themes/cochlearfit/src/index.js"`) instead of `@themes/*` package names (required because `@themes/cochlearfit` is not resolvable from `scripts/` CWD); update OUTPUT_PATH to `apps/cochlearfit/src/app/theme-tokens.generated.css`; update banner comment to reference cochlearfit; run `pnpm --filter scripts cochlearfit:generate-theme-tokens`; commit generated CSS
  - Refactor: none
- **Consumer tracing:** `apps/cochlearfit/src/app/theme-tokens.generated.css` is consumed by:
  - Parity test (TASK-05) — reads it to extract committed vars
  - `globals.css` `@import` (TASK-06) — imports it to replace hand-authored block
  Both consumers are addressed in later tasks.
- **Planning validation:**
  - Checks run: confirmed brikette generator structure; confirmed output path convention `apps/<app>/src/app/theme-tokens.generated.css`; **confirmed `pnpm --filter scripts brikette:generate-theme-tokens` currently fails** with `Cannot find module '@themes/brikette'` — this is a known issue in the existing brikette generator. The cochlearfit generator must use relative file path imports to avoid the same failure.
  - Validation artifacts: brikette generator at `scripts/brikette/generate-theme-tokens.ts` is the structural template but the import style must differ; relative import `../../packages/themes/brikette/src/index.ts` from `scripts/cochlearfit/` resolves correctly (verified by running `node --import tsx cochlearfit/test-gen.ts` from `scripts/` dir)
  - Unexpected findings: the brikette generator is currently broken for the `pnpm --filter scripts` invocation path. The cochlearfit generator will work correctly by using relative imports.
- **Scouts:** Verify `apps/cochlearfit/src/app/` directory exists (confirmed — globals.css lives there)
- **Edge Cases & Hardening:** If the generator script fails, confirm it is using relative file imports (e.g. `../../packages/themes/cochlearfit/src/index.js`) and NOT `@themes/*` package names — the latter do not resolve from `scripts/` CWD regardless of `pnpm install` state
- **What would make this >=90%:** Already at 90%; CI green (parity test passes) would confirm
- **Rollout / rollback:**
  - Rollout: run script, commit generated file
  - Rollback: delete `apps/cochlearfit/src/app/theme-tokens.generated.css` and `scripts/cochlearfit/generate-theme-tokens.ts`
- **Documentation impact:** None
- **Notes / references:** Brikette generator: `scripts/brikette/generate-theme-tokens.ts`

---

### TASK-05: Write parity test
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `packages/themes/cochlearfit/__tests__/generated-parity.test.ts` (new)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `packages/themes/cochlearfit/__tests__/generated-parity.test.ts` (new)
- **Depends on:** TASK-04
- **Blocks:** TASK-06
- **Confidence:** 90%
  - Implementation: 90% — near-exact clone of brikette parity test; `.dark` block tests are removed (light-only)
  - Approach: 90% — test reads committed generated CSS and compares to fresh `generateThemeCSS()` output var-by-var
  - Impact: 90% — this is the primary safety gate for value correctness
- **Acceptance:**
  - `packages/themes/cochlearfit/__tests__/generated-parity.test.ts` exists
  - Test reads `apps/cochlearfit/src/app/theme-tokens.generated.css` (the committed snapshot)
  - Test calls `generateThemeCSS()` fresh and compares to snapshot: every `--` var in the committed `:root` block exists in generated output with matching value (normalised whitespace)
  - Test asserts: no extra vars in generated `:root` output not in committed `:root` (inverse check)
  - The test proves generator-to-snapshot freshness — it does not test equality to the original hand-authored globals.css block (the committed snapshot is the intended deployed output, which includes `--theme-transition-duration` and `.dark { color-scheme: dark; }`)
  - `.dark` block test: the parity test may include the `.dark` block check but it will trivially pass (no `--` vars in either the committed `.dark` block or generated `.dark` block)
  - Test passes in CI
- **Engineering Coverage:**
  - UI / visual: Required — test validates all 25 token values are preserved
  - UX / states: N/A
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — this is the test itself; proves generated output matches committed file
  - Data / contracts: Required — test exercises `generateThemeCSS()` API with cochlearfit config
  - Performance / reliability: N/A
  - Rollout / rollback: N/A — test-only file
- **Validation contract (TC-05):**
  - TC-01: All 25 `--` vars in committed file are present in generated output → `test.each` on committed vars passes
  - TC-02: All 25 values match after whitespace normalisation → `norm()` comparison passes
  - TC-03: No extra vars in generated output → inverse check passes
  - TC-04: Test file passes Jest with `--ci` flag → CI green
- **Execution plan:**
  - Red: no test file; no coverage of generated token values
  - Green: clone brikette `generated-parity.test.ts`; update `GENERATED_TOKENS_PATH` to point to `apps/cochlearfit/src/app/theme-tokens.generated.css`; update imports to `../src/assets`, `../src/design-profile`, `../src/theme-css-config`; remove `.dark` describe blocks; update test suite name to cochlearfit
  - Refactor: clean up any brikette-specific comments
- **Planning validation:**
  - Checks run: reviewed brikette parity test in full; confirmed structure is clone-and-adapt
  - Validation artifacts: `packages/themes/brikette/__tests__/generated-parity.test.ts` is the template
  - Unexpected findings: the brikette test's `extractVarsFromBlock` helper correctly returns empty Map when selector not found — the cochlearfit parity test can reuse it for `.dark` without breakage even though cochlearfit's `.dark` block has no custom properties (the test simply won't generate any `.dark` test cases from the committed file, since `extractVarsFromBlock` will find the block but find no `--` vars inside it)
- **Consumer tracing:** This test file has no consumers. It reads the committed generated CSS (produced by TASK-04) and the source files (produced by TASK-02). Both are confirmed present before this task runs.
- **Scouts:** None — all inputs are confirmed present at this point in the sequence
- **Edge Cases & Hardening:**
  - The compiler also emits `--theme-transition-duration` from `generateProfileVars()` (line 192–196 in build-theme-css.ts) because the `DesignProfile` always provides `motion.durationNormal`. This var will appear in the generated output but NOT in the committed file (which is produced by running the generator). Since the committed file IS the generator output, both will contain `--theme-transition-duration` — parity is maintained. The inverse check (no extra vars in generated) may flag it if the committed file is somehow out of date. This is a non-issue as long as TASK-04 is run and committed before TASK-05.
  - Wait — this is a critical edge case to verify: `generateProfileVars()` ALWAYS emits `--theme-transition-duration`. So the committed generated CSS will also contain it. The parity test compares generated-fresh to committed-file, so both will have it. The test will pass. But TASK-06's globals.css update must NOT include `--theme-transition-duration` in the vars to remove (it was never in globals.css; it will be new in the generated file, but that is fine — it just adds a new var that existing CSS doesn't use yet).
- **What would make this >=90%:** Already at 90%; CI green is the confirmation
- **Rollout / rollback:**
  - Rollout: new test file only
  - Rollback: delete test file
- **Documentation impact:** None
- **Notes / references:** Brikette parity test: `packages/themes/brikette/__tests__/generated-parity.test.ts`

---

### TASK-06: Update `globals.css` — replace `:root` block with `@import`
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/cochlearfit/src/app/globals.css` (modified)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/cochlearfit/src/app/globals.css` (modified)
- **Depends on:** TASK-04, TASK-05
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% — well-defined edit: remove lines 6–33, add one `@import` line
  - Approach: 95% — `@import "./theme-tokens.generated.css"` pattern confirmed from brikette globals.css
  - Impact: 95% — zero visual change (token values are identical); parity test from TASK-05 provides assurance before this runs
- **Acceptance:**
  - `globals.css` no longer contains any `--` custom property declarations inside `:root`
  - `globals.css` contains `@import "./theme-tokens.generated.css"` (placed after existing `@import` lines, before the `* { ... }` block)
  - `color-scheme: light` in the `:root` block — this was in globals.css line 7; since the generated file now provides it via the compiler, confirm whether to keep or remove the `color-scheme: light` line from globals.css's `:root` block. Decision: the compiler emits `color-scheme: light` inside `:root` in the generated file, so it is redundant in globals.css — remove it from the hand-authored `:root` block. If the `:root` block becomes empty after removing `color-scheme` and all `--` vars, remove the empty `:root { }` block entirely.
  - Body, `::selection`, `@layer utilities`, `@keyframes` blocks are all preserved unchanged
  - `pnpm --filter @apps/cochlearfit typecheck` passes
- **Engineering Coverage:**
  - UI / visual: Required — this is the live switch; generated file provides exactly the same token values
  - UX / states: N/A
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — parity test (TASK-05) confirms generated file matches original values before this edit
  - Data / contracts: N/A — no contract surfaces
  - Performance / reliability: N/A — static CSS swap
  - Rollout / rollback: Required — if any visual regression is detected, rollback is to revert this commit (restore hand-authored `:root` block)
- **Validation contract (TC-06):**
  - TC-01: `globals.css` has no `--` custom property declarations in `:root` after edit → confirmed by inspection
  - TC-02: `globals.css` contains `@import "./theme-tokens.generated.css"` → confirmed by inspection
  - TC-03: `body`, `::selection`, `@layer utilities`, `@keyframes` blocks unchanged → confirmed by diff
  - TC-04: App typechecks without error → `pnpm --filter @apps/cochlearfit typecheck` passes
- **Execution plan:**
  - Red: globals.css has hand-authored `:root` block; no `@import` of generated file
  - Green: add `@import "./theme-tokens.generated.css"` line after existing `@import` lines; remove entire `:root { ... }` block (lines 6–33 in current file); if `:root` block becomes empty after removal, delete the empty block
  - Refactor: verify no other CSS in globals.css was accidentally removed
- **Consumer tracing:** `globals.css` is consumed by the cochlearfit Next.js app at build time. The import chain changes from "hand-authored vars in globals.css" to "generated file imported by globals.css". The token names and values are identical — no consumer CSS rules are affected.
- **Scouts:** Confirm the generated file is present at `apps/cochlearfit/src/app/theme-tokens.generated.css` before making this edit (guaranteed by TASK-04 dependency)
- **Edge Cases & Hardening:**
  - `@import` must come after any other `@import` statements that already exist in globals.css (lines 1–4 are `@config` and `@import` lines — place the new import after these)
  - If any CSS tool or linter in cochlearfit enforces import ordering, the generated-file import should follow existing imports
- **What would make this >=90%:** Already at 95%
- **Rollout / rollback:**
  - Rollout: single commit; both files (generated CSS + globals.css) should ideally be in the same commit, but depends on TASK-04 being a prior commit
  - Rollback: revert this commit to restore hand-authored `:root` block; generated file remains committed but unused
- **Documentation impact:** None
- **Notes / references:** Brikette globals.css for import pattern reference. Cochlearfit globals.css current content documented in fact-find.md § Evidence Audit

---

## Risks & Mitigations
- **`--color-link` value discrepancy:** The fact-find's token mapping table marks `--color-link` as `var(--color-accent)` but the actual globals.css value is `9 62% 48%`. Mitigation: TASK-02 acceptance criteria explicitly require the literal value. Parity test (TASK-05) catches any mismatch.
- **`--theme-transition-duration` in generated output:** `generateProfileVars()` always emits this var. It will appear in the generated file and committed snapshot. The parity test compares generated-fresh to committed-file (both have it), so the test passes. Existing cochlearfit CSS doesn't use this var — it is a harmless additive change. Accepted shipped behavior.
- **`.dark { color-scheme: dark; }` block:** The compiler always emits this block. It is accepted shipped behavior in the generated file. The browser ignores it for light-only themes (no `.dark` class is ever applied). No post-processing needed.
- **Typecheck failure for `ThemeAssets` stub:** `assets.ts` must provide all 5 required fields (`fonts`, `gradients`, `shadows`, `keyframes`, `brandColors`) as empty objects; `undefined` is not acceptable. Mitigation: TASK-02 acceptance criteria explicitly require this.

## Observability
- Logging: None
- Metrics: None
- Alerts/Dashboards: None

## Acceptance Criteria (overall)
- [ ] `packages/themes/cochlearfit/` package exists with all source files typechecking cleanly
- [ ] `apps/cochlearfit/src/app/theme-tokens.generated.css` is committed and non-empty (25+ custom properties)
- [ ] `packages/themes/cochlearfit/__tests__/generated-parity.test.ts` passes in CI
- [ ] `apps/cochlearfit/src/app/globals.css` `:root` block contains no hand-authored `--` custom properties
- [ ] `apps/cochlearfit/src/app/globals.css` contains `@import "./theme-tokens.generated.css"`
- [ ] `pnpm --filter @apps/cochlearfit typecheck` passes

## Decision Log
- 2026-03-14: `--color-link` value in `derivedVars.light` set to `"9 62% 48%"` (literal HSL from globals.css line 17), not `var(--color-accent)` as stated in the fact-find token table. The fact-find's `ThemeCSSConfig Mapping` block had an error; the actual globals.css is authoritative.
- 2026-03-14: `design-profile.ts` will include real guidance values (not minimal stub) — cochlearfit has enough design character visible in globals.css to author a meaningful profile.
- 2026-03-14: `recipes.ts` is omitted — cochlearfit has no component recipes and the brikette pattern requires it only if recipes exist.
- 2026-03-14: `@import` of generated file placed after existing `@import` lines in globals.css; empty `:root {}` block (after removing hand-authored vars) is deleted entirely.
- 2026-03-14 [Round 1 critique autofix]: `--theme-transition-duration` and `.dark { color-scheme: dark; }` are accepted shipped behavior in the committed generated file — the compiler always emits them. No post-processing step is needed. The parity test proves generator-to-snapshot freshness, not literal equality to the original globals.css. This is the same design as brikette.
- 2026-03-14 [Round 1 critique autofix]: `@themes/cochlearfit` dep removed from TASK-03 scope — `apps/cochlearfit/package.json` does NOT need this dep. Confirmed by brikette pattern: `apps/brikette/package.json` has no `@themes/brikette` dep. The parity test uses relative `../src/*` imports; the generator runs via `tsx` which resolves workspace packages directly. TASK-03 is now `scripts/package.json` entry only.
- 2026-03-14 [Round 1 critique autofix]: Outcome contract `Why` field populated — silent token drift is the problem being solved.
- 2026-03-14 [Round 2 critique autofix]: Generator script MUST use relative file path imports (`../../packages/themes/base/src/index.js`, `../../packages/themes/cochlearfit/src/index.js`) instead of `@themes/*` package names. Confirmed: `pnpm --filter scripts brikette:generate-theme-tokens` currently fails with `Cannot find module '@themes/brikette'`; relative imports from `scripts/cochlearfit/` resolve correctly (verified). This is a known gap in the existing brikette generator.
- 2026-03-14 [Round 2 critique autofix]: TASK-06 now depends on TASK-05 (not just TASK-04) — ensures the parity test exists and passes before the production-facing globals.css swap.
- 2026-03-14 [Round 2 critique autofix]: Typecheck command corrected to `pnpm --filter @apps/cochlearfit typecheck` (wraps `run-next-app.sh --mode typecheck`); `npx tsc --noEmit` alone is insufficient for the app. Theme package can use `npx tsc --noEmit` run from within `packages/themes/cochlearfit/`.
- 2026-03-14 [Round 2 critique autofix]: Jest `@themes/*` resolution confirmed to map to `packages/themes/*/src` (not `dist`) — corrected constraint statement.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Create package skeleton | Yes — `packages/themes/` exists; no existing cochlearfit package | None | No |
| TASK-02: Author source files | Yes — TASK-01 creates package skeleton; `ThemeAssets`/`DesignProfile` interfaces inspected | Minor: `--color-link` literal vs var-ref discrepancy between fact-find mapping and actual globals.css — resolved in task notes and decision log | No |
| TASK-03: Add scripts entry | Yes — TASK-01 provides package name; scripts/package.json script pattern confirmed; no app-level dep needed | None | No |
| TASK-04: Create generator and run it | Yes — TASK-02 provides source; TASK-03 provides script entry; generator uses relative file imports (verified) | Minor: `--theme-transition-duration` and `.dark { color-scheme: dark; }` appear in generated output — accepted shipped behavior; decision log entry 2026-03-14 | No |
| TASK-05: Write parity test | Yes — TASK-04 provides committed generated CSS at correct path; relative imports resolve to TASK-02 source | None | No |
| TASK-06: Update globals.css | Yes — TASK-04 provides generated file; TASK-05 confirms generator-to-snapshot freshness | None | No |

## Overall-confidence Calculation
- TASK-01: confidence 95%, effort S=1
- TASK-02: confidence 90%, effort M=2
- TASK-03: confidence 95%, effort S=1
- TASK-04: confidence 90%, effort S=1
- TASK-05: confidence 90%, effort S=1
- TASK-06: confidence 95%, effort S=1

Overall = (95×1 + 90×2 + 95×1 + 90×1 + 90×1 + 95×1) / (1+2+1+1+1+1)
       = (95 + 180 + 95 + 90 + 90 + 95) / 7
       = 645 / 7
       = 92.1% → rounded to nearest 5 = **90%**
