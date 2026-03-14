---
Type: Plan
Status: Active
Domain: UI
Workstream: Engineering
Created: 2026-03-14
Last-reviewed: 2026-03-14
Last-updated: 2026-03-14
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: caryina-theme-token-compiler
Dispatch-ID: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: none
---

# Caryina Theme Token Compiler Plan

## Summary

Retrofit `packages/themes/caryina` with the same compiler-driven token system brikette already uses. A `theme-css-config.ts` file will wire `tokens.ts` (the existing structured token map) into `generateThemeCSS()` via `tokenVarMap` (all 20 token vars as flat map entries — fonts included — with `fontVarMap` left empty), producing a committed generated CSS file `apps/caryina/src/styles/theme-tokens.generated.css`. The `global.css` import is updated to reference the generated file; a `@media (prefers-color-scheme: dark)` block is added to `global.css` to preserve first-paint dark mode for OS-dark users (the JS toggle handles post-hydration, but CSS must handle first paint). The generated dark selector is `html.theme-dark` (matching the existing class toggled by `ThemeModeSwitch.tsx`). Two parity test suites (`generated-parity.test.ts`, `coverage-parity.test.ts`) run in CI against the committed file, giving drift detection equivalent to brikette. The approach uses `tokenVarMap` rather than `colorVarMap` + extending `assets.brandColors`, keeping the diff minimal: `assets.ts` is not modified at all.

## Active tasks
- [x] TASK-01: Write `theme-css-config.ts` with tokenVarMap and fontVarMap — Complete (2026-03-14)
- [x] TASK-02: Add `jest.config.cjs` and wire test infrastructure for `packages/themes/caryina` — Complete (2026-03-14)
- [ ] TASK-03: Generate `theme-tokens.generated.css` via a one-off script
- [ ] TASK-04: Write `generated-parity.test.ts`
- [ ] TASK-05: Write `coverage-parity.test.ts`
- [ ] TASK-06: Update `global.css` import and add dark-mode alias
- [x] TASK-07: Add `./theme-css-config` export to `package.json` and update `tsconfig.json` — Complete (2026-03-14)

## Goals
- Produce `apps/caryina/src/styles/theme-tokens.generated.css` (committed output)
- Write `packages/themes/caryina/src/theme-css-config.ts` following brikette pattern
- Add jest infrastructure to `packages/themes/caryina` and write two parity test suites
- Update `apps/caryina/src/styles/global.css` to import the generated file
- Expose `./theme-css-config` export from `packages/themes/caryina/package.json`

## Non-goals
- Changes to `packages/themes/base/src/build-theme-css.ts`
- Changes to brikette
- Migrating caryina to class-based `.dark` dark mode (no React component changes)
- Adding recipes — `recipes.ts` is empty and stays that way
- Modifying `assets.ts` — `tokenVarMap` approach does not require it

## Constraints & Assumptions
- Constraints:
  - `generateThemeCSS()` emits `:root {}` and a dark selector block — no `@media` blocks. The dark selector is configurable via `darkSelector` prop.
  - No net-new tokens may be introduced — generated output must round-trip to the logical equivalent of the current `tokens.css` values.
  - All 20 token vars in `tokens.ts` must appear in the generated file (15 colors + 2 fonts + 3 radius).
  - Tests run in CI only — never run jest locally.
  - No changes to `@themes/base`.
- Assumptions:
  - `tokenVarMap` (flat map with `--` keys) is the correct path here: caryina's token names don't use `--color-brand-*` namespace, they are flat semantic names matching `tokens.ts` exactly. This avoids extending `assets.brandColors`.
  - Font vars (`--font-sans`, `--font-heading`) belong in `tokenVarMap` with their `var(--font-dm-sans)` / `var(--font-cormorant-garamond)` values as stored in `tokens.ts`. `fontVarMap` is set to `{}` (empty). This keeps generated output identical to current `tokens.css` which has `--font-sans: var(--font-dm-sans)`. Using `fontVarMap` instead would emit the full family string (different format), breaking parity.
  - The generated file will use `html.theme-dark` as the dark selector (from `darkSelector: "html.theme-dark"` in the config), matching the class toggled by `ThemeModeSwitch.tsx` (`root.classList.toggle("theme-dark", ...)`).
  - OS auto-dark mode: `ThemeModeSwitch.tsx` uses JS (`matchMedia`) to detect OS dark mode and call `applyResolvedMode()` which sets `html.theme-dark`. This handles post-hydration. But **first-paint** (SSR / no-JS) previously relied on `@media (prefers-color-scheme: dark) :root {}` in `tokens.css`. The generated file does not emit `@media` blocks. TASK-06 must add a `@media (prefers-color-scheme: dark) :root {}` block to `global.css` that reassigns the dark values directly, preserving first-paint dark mode.
  - The `--color-*-dark` companion vars (e.g. `--color-bg-dark`) in the current `tokens.css` are NOT present in `tokens.ts` TokenMap and will NOT appear in the generated file. The `@media` block in the current `tokens.css` reassigns via `var(--color-bg-dark)` references. The replacement `@media` block in `global.css` will use direct HSL triplet values instead of `--color-*-dark` var references.
  - `--theme-transition-duration` will be emitted by the compiler from `profile.motion.durationNormal` and becomes a net-new token in the generated output (not present in current `tokens.css`). This is additive and not a regression.

## Inherited Outcome Contract

- **Why:** Consistency — brikette's token system is compiler-driven, eliminating hand-edit drift bugs. Caryina should benefit from the same guarantee: any drift between structured source files and deployed tokens becomes a failing CI test, not a silent inconsistency.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Caryina's theme tokens are generated from structured source files, identical to the brikette pattern. A committed `theme-tokens.generated.css` file exists, two parity test suites pass in CI, and `global.css` imports the generated file rather than hand-authoring the token values.
- **Source:** auto

## Analysis Reference
- Related analysis: none (no analysis stage was run; fact-find was sufficient for this well-scoped retrofit)
- Selected approach inherited:
  - Use `tokenVarMap` (flat token map) rather than `colorVarMap` + extended `assets.brandColors`
  - Use `darkSelector: "html.theme-dark"` to match caryina's existing dark mode class
  - Mirror brikette's generate script and test structure exactly
- Key reasoning used:
  - `tokens.ts` already has the full 20-token map in the correct `TokenMap` shape (`{ light, dark? }` per var). `tokenVarMap` in `generateThemeCSS()` accepts this shape directly as `Record<--${string}, { light: string; dark?: string }>`. This means zero changes to `assets.ts`.
  - `fontVarMap` handles the two font vars separately (they are not color vars and cannot go in `tokenVarMap`).

## Selected Approach Summary
- What was chosen:
  - `theme-css-config.ts` uses `tokenVarMap` sourced directly from all 20 entries in `tokens.ts` (15 color + 3 radius + 2 font vars); `fontVarMap: {}` (empty); `darkSelector: "html.theme-dark"`; no `rgbVarMap`.
  - Font vars in `tokenVarMap` use `var(--font-dm-sans)` / `var(--font-cormorant-garamond)` values, matching current `tokens.css` output exactly.
  - TASK-06 adds a `@media (prefers-color-scheme: dark) :root {}` block to `global.css` to preserve first-paint dark mode (direct dark HSL values — no `--color-*-dark` var references).
  - Generate script mirrors `scripts/brikette/generate-theme-tokens.ts` exactly but targets caryina paths.
  - Parity tests mirror brikette tests but target `html.theme-dark` selector and caryina's token bridge.
- Why planning is not reopening option selection:
  - The `tokenVarMap` approach is the purpose-built path for this use case (flat token maps not originating from `assets.brandColors`). The fact-find identified `colorVarMap` + `assets.brandColors` extension as the approach, but `tokenVarMap` is strictly simpler and equally correct. No architectural fork exists.

## Fact-Find Support
- Supporting brief: `docs/plans/caryina-theme-token-compiler/fact-find.md`
- Evidence carried forward:
  - 20 CSS vars in `packages/themes/caryina/tokens.css` `:root {}` (15 color, 2 font, 3 radius)
  - `tokens.ts` has all 20 as a `TokenMap` — bare HSL triplet values, correct format
  - Current `tokens.css` uses `--color-*-dark` companion vars + `@media` reassignment pattern — the generated file replaces this with direct dark values in `html.theme-dark {}` block
  - `global.css` has `@media (prefers-color-scheme: dark) :root:not(.theme-dark) {}` light-override block — this block references light values directly, so it is unaffected
  - No jest infrastructure in `packages/themes/caryina` — must add `jest.config.cjs`
  - `package.json` missing `./theme-css-config` export
  - Brikette reference: `scripts/brikette/generate-theme-tokens.ts`, `packages/themes/brikette/__tests__/generated-parity.test.ts`, `packages/themes/brikette/__tests__/coverage-parity.test.ts`

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Write `theme-css-config.ts` | 90% | S | Complete (2026-03-14) | - | TASK-03, TASK-04, TASK-05 |
| TASK-02 | IMPLEMENT | Add jest infrastructure to `packages/themes/caryina` | 90% | S | Complete (2026-03-14) | - | TASK-04, TASK-05 |
| TASK-03 | IMPLEMENT | Generate `theme-tokens.generated.css` via script | 85% | S | Pending | TASK-01 | TASK-04, TASK-06 |
| TASK-04 | IMPLEMENT | Write `generated-parity.test.ts` | 85% | S | Pending | TASK-01, TASK-02, TASK-03 | - |
| TASK-05 | IMPLEMENT | Write `coverage-parity.test.ts` | 85% | S | Pending | TASK-01, TASK-02, TASK-03 | - |
| TASK-06 | IMPLEMENT | Update `global.css` import and dark-mode alias | 90% | S | Pending | TASK-03 | - |
| TASK-07 | IMPLEMENT | Add `./theme-css-config` export + update `tsconfig.json` | 95% | S | Complete (2026-03-14) | - | TASK-01 |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | Required — generated values must round-trip exactly to current `tokens.css`; parity tests enforce this | TASK-03, TASK-04, TASK-06 | Value format (bare HSL triplets) confirmed correct; `--color-*-dark` companion vars eliminated, dark values moved to `html.theme-dark` block |
| UX / states | Required — dark mode must continue working after import change: (1) first-paint OS dark mode via `@media` block; (2) explicit toggle via `html.theme-dark` class; (3) explicit-light-override via `not(.theme-dark)` | TASK-06 | TASK-06 adds `@media (prefers-color-scheme: dark) :root {}` with direct dark values; existing `not(.theme-dark)` block preserved; `html.theme-dark {}` in generated file handles JS-toggle path |
| Security / privacy | N/A — CSS-only change, no auth or data handling |  |  |
| Logging / observability / audit | N/A — static CSS generation, no runtime surface |  |  |
| Testing / validation | Required — two parity test suites, new jest infrastructure | TASK-02, TASK-04, TASK-05 | Tests run in CI only; deterministic string comparison |
| Data / contracts | Required — `ThemeCSSConfig` type contract; `package.json` export; `tsconfig.json` `include` may need `__tests__` handling | TASK-07 | Note: `tsconfig.json` currently excludes `__tests__` — this is correct; jest config handles test compilation separately |
| Performance / reliability | N/A — static CSS, no runtime impact |  |  |
| Rollout / rollback | Required — `global.css` import change is the deploy boundary; rollback = revert the import line | TASK-06 | Old `tokens.css` in package root is not deleted; it remains as fallback until CI passes |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 (parallel) | TASK-01, TASK-02, TASK-07 | - | All independent; TASK-07 needs TASK-01 to exist but can add the export to `package.json` without the file being complete |
| 2 | TASK-03 | TASK-01 | Generate the CSS file from the config |
| 3 (parallel) | TASK-04, TASK-05, TASK-06 | TASK-02, TASK-03 | Tests and global.css update can run in parallel once generated file exists |

## Delivered Processes

None: no material process topology change. This is a build-time code-generation retrofit. The token files are consumed at CSS import time only; no CI lane, approval path, or operator runbook changes.

## Tasks

---

### TASK-01: Write `theme-css-config.ts` with tokenVarMap and fontVarMap
- **Type:** IMPLEMENT
- **Deliverable:** `packages/themes/caryina/src/theme-css-config.ts` (new file)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Build evidence:** `packages/themes/caryina/src/theme-css-config.ts` created. All 20 token vars in `tokenVarMap`, `fontVarMap: {}`, `darkSelector: "html.theme-dark"`, `colorVarMap: {}`. Compiler output validated inline: 36 CSS vars, correct `:root` and `html.theme-dark` blocks. Lint passed (`turbo --only`). Committed in `06b197b8b0`.
- **Affects:** `packages/themes/caryina/src/theme-css-config.ts` (new), `[readonly] packages/themes/caryina/src/tokens.ts`, `[readonly] packages/themes/caryina/src/assets.ts`, `[readonly] packages/themes/caryina/src/design-profile.ts`, `[readonly] packages/themes/base/src/build-theme-css.ts`
- **Depends on:** -
- **Blocks:** TASK-03, TASK-04, TASK-05
- **Confidence:** 90%
  - Implementation: 90% — `ThemeCSSConfig` interface is fully read; `tokenVarMap` shape matches `tokens.ts` exactly. The only open item is whether radius vars (light-only in `tokens.ts`) should go in `tokenVarMap` or `derivedVars.light`. Analysis: `tokenVarMap` supports light-only entries (dark is optional); they belong in `tokenVarMap` for consistency.
  - Approach: 95% — `tokenVarMap` is the purpose-built path. Confirmed correct by reading `generateTokenVarLines()` in `build-theme-css.ts`.
  - Impact: 90% — CSS-only change, fully reversible.
- **Acceptance:**
  - `packages/themes/caryina/src/theme-css-config.ts` exists and compiles with `npx tsc --noEmit`
  - `themeCSSConfig.tokenVarMap` contains all 20 token entries from `tokens.ts` (15 color + 3 radius + 2 font vars)
  - `themeCSSConfig.fontVarMap` is `{}` (empty) — font vars are in `tokenVarMap` with `var(--font-dm-sans)` values to match current `tokens.css` format
  - `themeCSSConfig.darkSelector` is `"html.theme-dark"`
  - `themeCSSConfig.rgbVarMap` is absent (caryina has no RGB triplet vars)
  - File has the `/* eslint-disable ds/no-raw-color */` header (matching brikette pattern)
- **Engineering Coverage:**
  - UI / visual: Required — this file is the bridge between tokens and the CSS compiler; correct token mapping is essential
  - UX / states: N/A — no UI rendering in this file
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — TASK-04 and TASK-05 validate the output of this config
  - Data / contracts: Required — `ThemeCSSConfig` type from `@themes/base` must be satisfied; all 20 token vars must be represented
  - Performance / reliability: N/A
  - Rollout / rollback: N/A — no deploy boundary; file is only consumed by the generator and tests
- **Validation contract (TC-01):**
  - TC-01: `themeCSSConfig` satisfies `ThemeCSSConfig` type → TypeScript compiles without error
  - TC-02: `tokenVarMap` has exactly 20 keys (15 color + 3 radius + 2 font) → confirmed by review
  - TC-03: `fontVarMap` is `{}` (empty) → confirmed by review
  - TC-04: `darkSelector: "html.theme-dark"` is present → confirmed by review
- **Execution plan:**
  - Red: Create the file with imports from `tokens.ts`, `design-profile.ts`, `assets.ts`; declare `export const themeCSSConfig: ThemeCSSConfig = { ... }` with all required fields populated
  - Green: Populate `tokenVarMap` with all 18 entries from `tokens.ts`; set `fontVarMap`, `darkSelector`; verify type compiles
  - Refactor: Add the eslint-disable comment; verify field ordering matches brikette convention; add file-top docstring
- **Planning validation (required for M/L):** None: S effort task
- **Consumer tracing (new outputs):**
  - `themeCSSConfig` is consumed by: TASK-03 (generate script) and TASK-04 / TASK-05 (tests)
  - The `package.json` export added in TASK-07 makes it importable from external scripts
- **Scouts:** None: all types confirmed read; `tokenVarMap` path verified against `build-theme-css.ts`
- **Edge Cases & Hardening:**
  - Font vars: `tokens.ts` stores `{ light: "var(--font-dm-sans)" }` for `--font-sans`. Placing this in `tokenVarMap` emits `--font-sans: var(--font-dm-sans)` — identical to current `tokens.css`. Using `fontVarMap` instead would emit the full family string `"DM Sans", ui-sans-serif, ...` (different format). To maintain parity: **font vars go in `tokenVarMap`; `fontVarMap: {}`**.
  - The `--theme-transition-duration` var is emitted by `generateProfileVars()` regardless of config — it will appear in the generated file. Since the generated file is the new reference (not the old `tokens.css`), the parity test compares compiler output to the committed generated file — both will have `--theme-transition-duration`. No conflict.
- **What would make this >=90%:**
  - The font var format decision is resolved (tokenVarMap, not fontVarMap). Only uncertainty is whether the compiler handles font-type values in `tokenVarMap` identically — confirmed by reading `generateTokenVarLines()`: it emits `${varName}: ${value}` verbatim, so `--font-sans: var(--font-dm-sans)` is correct.
- **Rollout / rollback:**
  - Rollout: File is inert until consumed by TASK-03 and TASK-06
  - Rollback: Delete the file
- **Documentation impact:** None: no public API change
- **Notes / references:**
  - `packages/themes/brikette/src/theme-css-config.ts` — reference implementation (but uses `colorVarMap`, not `tokenVarMap`)
  - `packages/themes/base/src/build-theme-css.ts` lines 206–217 — `generateTokenVarLines()` confirms `tokenVarMap` shape

---

### TASK-02: Add jest infrastructure to `packages/themes/caryina`
- **Type:** IMPLEMENT
- **Deliverable:** `packages/themes/caryina/jest.config.cjs` (new file)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Build evidence:** `packages/themes/caryina/jest.config.cjs` created with single-line `@acme/config/jest.preset.cjs` invocation. Follows brikette pattern exactly. Committed in `06b197b8b0`.
- **Affects:** `packages/themes/caryina/jest.config.cjs` (new), `[readonly] packages/themes/brikette/jest.config.cjs`, `[readonly] packages/config/jest.preset.cjs`
- **Depends on:** -
- **Blocks:** TASK-04, TASK-05
- **Confidence:** 90%
  - Implementation: 90% — brikette's `jest.config.cjs` is a single-line preset invocation; direct copy-then-path-check
  - Approach: 95% — monorepo jest preset is the established pattern
  - Impact: 95% — only enables test discovery; no runtime impact
- **Acceptance:**
  - `packages/themes/caryina/jest.config.cjs` exists and calls `require("@acme/config/jest.preset.cjs")()`
  - CI picks up tests in `packages/themes/caryina/__tests__/` (verified by CI run)
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: N/A
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — this task is entirely about enabling tests
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: N/A
- **Validation contract (TC-01):**
  - TC-01: `jest.config.cjs` loads without syntax error → confirmed by module syntax check
  - TC-02: `packages/themes/caryina/__tests__/` directory is created (can be empty) → CI test runner finds 0 tests (not an error)
- **Execution plan:**
  - Red: Create `jest.config.cjs` with the single-line content from brikette
  - Green: Create `packages/themes/caryina/__tests__/` directory (placeholder, tests added in TASK-04 / TASK-05)
  - Refactor: None needed
- **Planning validation:** None: S effort, mechanical copy
- **Scouts:** None: brikette pattern confirmed working
- **Edge Cases & Hardening:** The monorepo root jest config must discover packages/themes/caryina — check that the root `jest.config.cjs` or `pnpm` workspace jest runner includes this package. Brikette tests run, so the discovery mechanism is already active for the `packages/themes/` path.
- **What would make this >=90%:** Confirmed by checking if root jest config has a `testMatch` or `projects` array that covers `packages/themes/**`. If the root uses `pnpm --filter` per-package runs, no root config change is needed.
- **Rollout / rollback:** N/A — test infrastructure only
- **Documentation impact:** None
- **Notes / references:** `packages/themes/brikette/jest.config.cjs` — exact model

---

### TASK-03: Generate `theme-tokens.generated.css` via script
- **Type:** IMPLEMENT
- **Deliverable:** `scripts/caryina/generate-theme-tokens.ts` (new file) + `apps/caryina/src/styles/theme-tokens.generated.css` (new committed file)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `scripts/caryina/generate-theme-tokens.ts` (new), `apps/caryina/src/styles/theme-tokens.generated.css` (new), `scripts/package.json`
- **Depends on:** TASK-01
- **Blocks:** TASK-04, TASK-06
- **Confidence:** 85%
  - Implementation: 85% — direct port of `scripts/brikette/generate-theme-tokens.ts`; the import path for `@themes/caryina` must export `themeCSSConfig` (done in TASK-07)
  - Approach: 90% — pattern proven by brikette
  - Impact: 90% — the committed file is the source of truth for parity tests
- **Acceptance:**
  - `apps/caryina/src/styles/theme-tokens.generated.css` exists and is committed
  - File contains `:root {}` block with all 20 tokenVarMap vars + `--theme-transition-duration` (from profile) — total 21 vars in `:root`
  - File contains `html.theme-dark {}` block with dark values for the 15 color vars (radius and font vars have no dark variant in `tokens.ts`)
  - Auto-generated banner comment present at top of file
  - `scripts/package.json` has a `caryina:generate-theme-tokens` script entry
- **Engineering Coverage:**
  - UI / visual: Required — this is the actual CSS output file consumed by `global.css`
  - UX / states: N/A
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — TASK-04 will verify the committed file matches compiler output
  - Data / contracts: Required — file format must be valid CSS; var names must match what `global.css` references
  - Performance / reliability: N/A
  - Rollout / rollback: Required — this file is the deploy artifact; old `tokens.css` in package root is NOT deleted (rollback path)
- **Validation contract (TC-01):**
  - TC-01: `node --import tsx scripts/caryina/generate-theme-tokens.ts` exits 0 and writes the file → verified by running the script
  - TC-02: generated file contains `:root {` and `html.theme-dark {` selectors → confirmed by file content check
  - TC-03: generated file contains `--color-bg:`, `--color-primary:`, `--radius-sm:` → spot-check key vars
- **Execution plan:**
  - Red: Create `scripts/caryina/` directory; copy `scripts/brikette/generate-theme-tokens.ts` to `scripts/caryina/generate-theme-tokens.ts`; update import to `@themes/caryina` (once TASK-07 adds the export); update OUTPUT_PATH to caryina app path; update banner comment
  - Green: Run the script (`pnpm --filter scripts caryina:generate-theme-tokens`); verify file written; check var count
  - Refactor: Add the npm script entry to `scripts/package.json`; commit the generated file
- **Planning validation:** None: S effort
- **Consumer tracing:**
  - `theme-tokens.generated.css` is consumed by `global.css` (updated in TASK-06) and by parity tests (TASK-04)
- **Scouts:** None: import path for `@themes/caryina` is confirmed in `packages/themes/caryina/package.json` after TASK-07 adds the `./theme-css-config` export. The script imports `{ themeCSSConfig } from "@themes/caryina/theme-css-config"` or `from "@themes/caryina"` if index exports it.
- **Edge Cases & Hardening:** The caryina package.json does not have an index barrel currently (no `"."` pointing to an index that includes `themeCSSConfig`). The script should import `from "@themes/caryina/theme-css-config"` using the explicit path export added in TASK-07.
- **What would make this >=90%:** Confirming the `scripts/caryina/` dir doesn't already exist and there are no conflicting npm scripts.
- **Rollout / rollback:**
  - Rollout: Script is idempotent; can be re-run to regenerate
  - Rollback: If the generated file causes issues, delete it and revert TASK-06 (`global.css` import)
- **Documentation impact:** None
- **Notes / references:** `scripts/brikette/generate-theme-tokens.ts` — reference; `scripts/package.json` `brikette:generate-theme-tokens` entry — pattern for npm script

---

### TASK-04: Write `generated-parity.test.ts`
- **Type:** IMPLEMENT
- **Deliverable:** `packages/themes/caryina/__tests__/generated-parity.test.ts` (new file)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `packages/themes/caryina/__tests__/generated-parity.test.ts` (new)
- **Depends on:** TASK-01, TASK-02, TASK-03
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — direct port of brikette's `generated-parity.test.ts`; key differences are path to generated CSS and dark selector (`html.theme-dark` vs `.dark`)
  - Approach: 90% — proven pattern
  - Impact: 90% — this test is the drift-detection gate; failure = hand-edit to generated file
- **Acceptance:**
  - Test file exists and passes in CI
  - Test correctly reads `apps/caryina/src/styles/theme-tokens.generated.css`
  - `extractVarsFromBlock()` finds `:root` and `html.theme-dark` blocks
  - All tests pass: `:root` vars present, values match, `.theme-dark` vars present, values match, no unexpected extra vars
- **Engineering Coverage:**
  - UI / visual: N/A — test file
  - UX / states: N/A
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — this is the primary validation artifact
  - Data / contracts: Required — test imports `themeCSSConfig` from TASK-01 output
  - Performance / reliability: N/A
  - Rollout / rollback: N/A
- **Validation contract (TC-01):**
  - TC-01: All `test.each` cases for `:root` vars pass → generated vars match committed file
  - TC-02: All `test.each` cases for `html.theme-dark` vars pass → dark vars match
  - TC-03: "No unexpected vars" tests pass → no compiler regression introduced extra vars
- **Execution plan:**
  - Red: Copy `packages/themes/brikette/__tests__/generated-parity.test.ts` to caryina path
  - Green: Update `GENERATED_TOKENS_PATH` to point to caryina app path; update dark block selector from `.dark` to `html.theme-dark`; update imports to `../src/theme-css-config` (not brikette's path); update describe block text
  - Refactor: Remove any brikette-specific comment references; verify test descriptions are accurate
- **Planning validation:** None: S effort
- **Scouts:** None: `extractVarsFromBlock()` utility is generic and handles any CSS selector
- **Edge Cases & Hardening:** `extractVarsFromBlock(css, "html.theme-dark")` — the function finds the selector by `css.indexOf(blockSelector)`. "html.theme-dark" appears once in the generated file; no ambiguity.
- **What would make this >=90%:** Having TASK-03 complete so the generated file can be read and verified before TASK-04 is written.
- **Rollout / rollback:** N/A — test file
- **Documentation impact:** None
- **Notes / references:** `packages/themes/brikette/__tests__/generated-parity.test.ts` — direct reference

---

### TASK-05: Write `coverage-parity.test.ts`
- **Type:** IMPLEMENT
- **Deliverable:** `packages/themes/caryina/__tests__/coverage-parity.test.ts` (new file)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `packages/themes/caryina/__tests__/coverage-parity.test.ts` (new)
- **Depends on:** TASK-01, TASK-02, TASK-03
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — direct port of brikette's `coverage-parity.test.ts` with caryina-specific bridge tables; bridges are fully enumerated in the fact-find
  - Approach: 90% — proven pattern; caryina is simpler (no gradients, no keyframes, no recipes, no RGB vars)
  - Impact: 90% — proves source-to-CSS traceability
- **Acceptance:**
  - Test file exists and passes in CI
  - `BRAND_COLOR_BRIDGE` covers all 15 color vars (mapped from `tokenVarMap` keys to CSS var suffixes)
  - `FONT_BRIDGE` covers `font-sans` → body, `font-heading` → heading
  - `DERIVED_VARS` set covers `--radius-sm`, `--radius-md`, `--radius-lg` (these are in `tokenVarMap` with light-only values) — but the test does NOT use `DERIVED_VARS` for radius vars since they are directly in `tokenVarMap` and appear in `:root` (they are accounted for by the token bridge, not a separate derived set)
  - `--theme-transition-duration` is in `PROFILE_BRIDGE` (maps to `profile.motion.durationNormal`), not `DERIVED_VARS`
  - `--brand-mark-color` and `--brand-accent-color` are in `global.css` `:root` block only — NOT in the generated file — so the coverage test (which reads the generated file) does not encounter them and no `DERIVED_VARS` entry is needed
  - No gradient/keyframe/recipe/RGB var sections (caryina has none)
  - All exhaustiveness checks pass (every `:root` var and `html.theme-dark` var is accounted for)
- **Engineering Coverage:**
  - UI / visual: N/A — test file
  - UX / states: N/A
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — this test is the exhaustiveness gate
  - Data / contracts: Required — validates all 20 vars have a traceable source
  - Performance / reliability: N/A
  - Rollout / rollback: N/A
- **Validation contract (TC-01):**
  - TC-01: All color bridge tests pass (15 color vars × 2 modes) → assets/tokens map correctly to CSS
  - TC-02: Font bridge tests pass (2 font vars) → font family values correct
  - TC-03: Exhaustiveness test passes for `:root` → no unaccounted vars
  - TC-04: Exhaustiveness test passes for `html.theme-dark` → no unaccounted dark vars
  - TC-05: Reverse coverage test passes → every token entry is consumed
- **Execution plan:**
  - Red: Copy brikette's `coverage-parity.test.ts` to caryina path
  - Green: Replace `BRAND_COLOR_BRIDGE` with caryina's 15-entry color bridge (CSS var suffix → `tokenVarMap` key mapping); replace `FONT_BRIDGE` with caryina's 2-entry font bridge; populate `DERIVED_VARS` set; remove gradient/keyframe/recipe/RGB test sections; update paths to point to caryina app files; update describe block text
  - Refactor: Remove all brikette-specific comment references; verify that the `getAssetLightColor`/`getAssetDarkColor` helpers are adapted for caryina's `tokenVarMap` structure (the test needs to read from `tokens.ts` directly rather than `assets.brandColors`); simplify helpers accordingly
- **Planning validation:** None: S effort
- **Consumer tracing:**
  - This test is a consumer of `theme-tokens.generated.css` (reads at test time); it is the exhaustiveness gate for the token system
- **Scouts:** The brikette test uses `assets.brandColors` for `getAssetLightColor` / `getAssetDarkColor`. For caryina, the equivalent source is `tokens.ts`'s `TokenMap` entries. The helper functions need to be adapted to read from `tokens` instead of `assets.brandColors`.
- **Edge Cases & Hardening:**
  - `--brand-mark-color` and `--brand-accent-color` are in `global.css` `:root` block, not in the generated file. The coverage-parity test reads from `theme-tokens.generated.css`, so these vars won't appear in `rootVars`. They must NOT be in `DERIVED_VARS` for the generated-file check — they are only relevant if the test also reads `global.css`. Simplify: coverage-parity test reads the generated file only, not `global.css`. These two derived vars are in `global.css` and are explicitly out of scope for this test.
  - `--theme-transition-duration` is emitted by the compiler from `profile.motion.durationNormal`. It belongs in `PROFILE_BRIDGE` (not `DERIVED_VARS`) to correctly map it to `profile.motion.durationNormal`.
- **What would make this >=90%:** Having the generated file from TASK-03 to verify the exact var list before writing the test.
- **Rollout / rollback:** N/A — test file
- **Documentation impact:** None
- **Notes / references:** `packages/themes/brikette/__tests__/coverage-parity.test.ts` — reference; `packages/themes/caryina/src/tokens.ts` — source of truth for test bridge tables

---

### TASK-06: Update `global.css` import and dark-mode alias
- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/caryina/src/styles/global.css`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/caryina/src/styles/global.css`
- **Depends on:** TASK-03
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — surgical edit; the import line and `@media` references are clearly identified
  - Approach: 90% — straightforward import substitution
  - Impact: 90% — CSS-only change; no JS changes needed
- **Acceptance:**
  - `@import "@themes/caryina/tokens.css"` replaced with `@import "./theme-tokens.generated.css"` (or equivalent relative path)
  - `global.css` contains a new `@media (prefers-color-scheme: dark) :root {}` block with all 15 dark color values as direct HSL triplets (no `--color-*-dark` var references) — this preserves first-paint OS dark mode behavior
  - The existing `@media (prefers-color-scheme: dark) :root:not(.theme-dark) {}` block in `global.css` remains unchanged (it forces light values when user selected light despite OS dark)
  - App builds without CSS errors
  - Visual tokens are unchanged (parity tests prove this)
- **Engineering Coverage:**
  - UI / visual: Required — this is the deploy boundary; incorrect import = broken CSS
  - UX / states: Required — dark mode via `html.theme-dark` must still work; OS-based dark mode via `@media` must still work
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — TASK-04 parity test proves the imported file matches compiler output
  - Data / contracts: Required — import path must be resolvable in the Next.js CSS pipeline (`./theme-tokens.generated.css` relative to `global.css`)
  - Performance / reliability: N/A
  - Rollout / rollback: Required — rollback is reverting this file to the original import
- **Validation contract (TC-01):**
  - TC-01: Next.js build (`pnpm --filter caryina build`) completes without CSS errors → import path is valid
  - TC-02: Dark mode visual check — `html.theme-dark` class produces dark tokens → confirmed by parity test
- **Execution plan:**
  - Red: In `global.css`, replace `@import "@themes/caryina/tokens.css"` with `@import "./theme-tokens.generated.css"`
  - Green: Add a `@media (prefers-color-scheme: dark) :root {}` block to `global.css` containing all 15 dark color values as direct HSL triplets (sourced from `tokens.ts` dark values). This block must appear BEFORE the existing `@media (prefers-color-scheme: dark) :root:not(.theme-dark) {}` block so the latter still overrides it for explicit-light-mode users. Verify no remaining references to `--color-*-dark` companion vars anywhere in `global.css` (search confirms none exist).
  - Refactor: Add a comment on the new `@media` block explaining it preserves first-paint OS dark mode; update the import comment
- **Planning validation:** None: S effort
- **Scouts:** `global.css` line 55–105 confirmed: the `@media (prefers-color-scheme: dark) :root:not(.theme-dark) {}` block already uses direct light values; no `--color-*-dark` var references exist in `global.css`. `ThemeModeSwitch.tsx` lines 17-23, 144-156 confirmed: JS reads OS preference via `matchMedia` and calls `applyResolvedMode()` which sets `html.theme-dark` for post-hydration. First-paint requires a CSS `@media` block — confirmed missing after tokens.css is replaced.
- **Edge Cases & Hardening:**
  - CSS cascade order matters: the new `@media (prefers-color-scheme: dark) :root {}` block must appear BEFORE `@media (prefers-color-scheme: dark) :root:not(.theme-dark) {}` — the latter has higher specificity and overrides the former for explicit-light-mode users. Correct ordering preserves all three behavior modes: (1) OS dark + no override → dark (new `@media` block fires); (2) OS dark + user chose light → light (`not(.theme-dark)` overrides); (3) `html.theme-dark` class set → dark (generated file's `html.theme-dark {}` selector fires directly regardless of media query).
  - Search `apps/caryina/` for `var(--color-.*-dark)` before committing — none found in `global.css`; confirm no component CSS uses companion vars.
- **What would make this >=90%:** Confirming no companion vars are referenced in component CSS — a search across the app confirms this.
- **Rollout / rollback:**
  - Rollout: Single-file change; trivial to deploy
  - Rollback: Revert `global.css` to `@import "@themes/caryina/tokens.css"`
- **Documentation impact:** None
- **Notes / references:** `apps/caryina/src/styles/global.css` lines 6-7 and 55-105

---

### TASK-07: Add `./theme-css-config` export to `package.json` and update `tsconfig.json`
- **Type:** IMPLEMENT
- **Deliverable:** Modified `packages/themes/caryina/package.json` and `packages/themes/caryina/tsconfig.json`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Build evidence:** `"./theme-css-config": "./src/theme-css-config.ts"` added to `packages/themes/caryina/package.json` exports. `tsconfig.json` confirmed already covers `src/**/*` — no change needed. Committed in `06b197b8b0`.
- **Affects:** `packages/themes/caryina/package.json`, `packages/themes/caryina/tsconfig.json`
- **Depends on:** -
- **Blocks:** TASK-01 (technically TASK-03 needs the export, but the file can be created before the export exists)
- **Confidence:** 95%
  - Implementation: 95% — one-line JSON edit to both files
  - Approach: 95% — direct copy of brikette pattern
  - Impact: 95% — enabling the export is required for the generator script import
- **Acceptance:**
  - `packages/themes/caryina/package.json` `exports` has `"./theme-css-config": "./src/theme-css-config.ts"`
  - `packages/themes/caryina/tsconfig.json` `include` still covers `src/**/*` (theme-css-config.ts is in src)
  - TypeScript compiles without `Cannot find module '@themes/caryina/theme-css-config'` errors from test files
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: N/A
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — test files import from this export path
  - Data / contracts: Required — the export path is a contract consumed by the generator script and tests
  - Performance / reliability: N/A
  - Rollout / rollback: N/A — package.json change; no runtime impact
- **Validation contract (TC-01):**
  - TC-01: `import { themeCSSConfig } from "@themes/caryina/theme-css-config"` resolves without error in the generator script context → confirmed by running the script after TASK-03
- **Execution plan:**
  - Red: Add `"./theme-css-config": "./src/theme-css-config.ts"` to `exports` in `package.json`
  - Green: Verify `tsconfig.json` includes `src/**/*` — it does; no change needed for the file itself. The `exclude: ["**/__tests__/**"]` correctly excludes test files from the production TypeScript compilation (jest handles test compilation separately via `jest.config.cjs`).
  - Refactor: No refactor needed
- **Planning validation:** None: S effort
- **Scouts:** Confirmed `tsconfig.json` already includes `src/**/*` — TASK-01's new file at `src/theme-css-config.ts` is automatically included.
- **Edge Cases & Hardening:** None — trivial JSON edit
- **What would make this >=90%:** Already at 95%.
- **Rollout / rollback:** N/A
- **Documentation impact:** None
- **Notes / references:** `packages/themes/brikette/package.json` exports `"./theme-css-config": "./src/theme-css-config.ts"` — exact model

---

## Risks & Mitigations
- **First-paint dark mode regression** (High/High): The old `tokens.css` had a `@media (prefers-color-scheme: dark) :root {}` block that applied dark values at first paint for OS-dark users. The generated file does not emit `@media` blocks — only `html.theme-dark {}`. Without the `@media` block, OS-dark users see a flash of light mode until JS hydrates and `ThemeModeSwitch.tsx` sets `html.theme-dark`. Mitigation: TASK-06 adds a `@media (prefers-color-scheme: dark) :root {}` block to `global.css` with direct dark values — fully mitigated by the plan.
- **`--color-*-dark` companion vars eliminated** (Low/Low): The generated file does not emit `--color-bg-dark`, `--color-fg-dark`, etc. If any caryina component CSS references these directly via `var(--color-bg-dark)`, it would break. Mitigation: search caryina for `var(--color-.*-dark)` patterns before committing TASK-06.
- **Test infrastructure not discovered by CI** (Low/Medium): If the root CI jest runner doesn't discover `packages/themes/caryina/__tests__/`, parity tests never run. Mitigation: confirm brikette's `packages/themes/brikette/__tests__/` tests run in CI (they do — confirmed by existing test files). Same discovery mechanism applies.
- **Import path format in generate script** (Low/Low): Script imports `@themes/caryina/theme-css-config` — if `tsx` doesn't resolve package exports correctly, the import fails. Mitigation: follow the exact same pattern as brikette's script which uses `@themes/brikette` imports.

## Observability
- Logging: None
- Metrics: None
- Alerts/Dashboards: None

## Acceptance Criteria (overall)
- [ ] `apps/caryina/src/styles/theme-tokens.generated.css` exists and is committed
- [ ] `packages/themes/caryina/__tests__/generated-parity.test.ts` passes in CI
- [ ] `packages/themes/caryina/__tests__/coverage-parity.test.ts` passes in CI
- [ ] `apps/caryina/src/styles/global.css` imports `theme-tokens.generated.css` (not `@themes/caryina/tokens.css`)
- [ ] `global.css` contains a `@media (prefers-color-scheme: dark) :root {}` block with direct dark HSL values (first-paint dark mode preserved)
- [ ] TypeScript compiles without errors (`npx tsc --noEmit` passes)
- [ ] No visual regression — generated token values are identical to the logical equivalent in current `tokens.css`

## Decision Log
- 2026-03-14: Use `tokenVarMap` instead of `colorVarMap` + extended `assets.brandColors`. The `tokenVarMap` API is purpose-built for flat token maps that don't originate from `assets.brandColors`. `tokens.ts` already has the correct shape. No changes to `assets.ts` required. This supersedes the fact-find recommendation to extend `assets.ts`.
- 2026-03-14: Use `darkSelector: "html.theme-dark"` to match caryina's existing dark mode class. OS auto-dark first-paint behavior must be preserved by adding a `@media (prefers-color-scheme: dark) :root {}` block to `global.css` (TASK-06). `ThemeModeSwitch.tsx` confirms both `html.theme-dark` and `html.dark` are set by the JS toggle; CSS only needs to handle `html.theme-dark` (the generated dark selector).
- 2026-03-14: Font vars go in `tokenVarMap` (not `fontVarMap`) because `tokens.ts` stores `var(--font-dm-sans)` as the value, which is exactly what `tokens.css` currently emits. Using `fontVarMap` would emit the full family string (`"DM Sans", ...`) — a different format that would fail parity tests. `tokenVarMap` emits values verbatim, producing `--font-sans: var(--font-dm-sans)` which matches.
- 2026-03-14: [Adjacent: delivery-rehearsal] Search for `var(--color-.*-dark)` in caryina app source — if any component uses companion vars directly, they break. Not in scope for this plan but must be verified in TASK-06 edge case handling before commit.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Write theme-css-config.ts | Yes — `tokens.ts`, `design-profile.ts`, `assets.ts`, `ThemeCSSConfig` type all readable | None — font var strategy (tokenVarMap for all 20 vars, fontVarMap empty) confirmed by compiler code review | No |
| TASK-02: Add jest.config.cjs | Yes — `packages/config/jest.preset.cjs` exists; brikette pattern confirmed | None | No |
| TASK-07: Add package.json export | Yes — existing exports structure confirmed | None | No |
| TASK-03: Generate CSS file | Partial — depends on TASK-01 (config) and TASK-07 (export); sequenced correctly | Minor: Generate script imports `@themes/caryina/theme-css-config` — requires TASK-07 export to be in place | No — sequenced after TASK-07 in Wave 1 |
| TASK-04: generated-parity.test.ts | Yes — depends on TASK-01, TASK-02, TASK-03; all in prior waves | Minor: Dark selector `"html.theme-dark"` matches `darkSelector` config exactly | No |
| TASK-05: coverage-parity.test.ts | Yes — same prereqs as TASK-04 | Minor: Token bridge helpers read from `tokens.ts` directly (not `assets.brandColors`); test adapts brikette pattern | No |
| TASK-06: Update global.css | Yes — depends on TASK-03 (generated file); rollback path exists | Resolved: TASK-06 execution plan now adds `@media (prefers-color-scheme: dark) :root {}` block to `global.css` preserving first-paint OS dark mode | No — resolved in plan |

## Overall-confidence Calculation
- All tasks are S effort (weight 1 each), 7 tasks total
- TASK-01: 90%, TASK-02: 90%, TASK-03: 85%, TASK-04: 85%, TASK-05: 85%, TASK-06: 90%, TASK-07: 95%
- Weighted sum: (90+90+85+85+85+90+95) / 7 = 620/7 = 88.6%
- Overall-confidence: **88%**
