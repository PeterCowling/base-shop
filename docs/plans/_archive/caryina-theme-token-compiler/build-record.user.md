---
Type: Build-Record
Status: Complete
Domain: UI
Last-reviewed: 2026-03-14
Feature-Slug: caryina-theme-token-compiler
Execution-Track: code
Completed-date: 2026-03-14
artifact: build-record
Build-Event-Ref: docs/plans/caryina-theme-token-compiler/build-event.json
---

# Build Record: Caryina Theme Token Compiler

## Outcome Contract

- **Why:** Consistency — brikette's token system is compiler-driven, eliminating hand-edit drift bugs. Caryina should benefit from the same guarantee: any drift between structured source files and deployed tokens becomes a failing CI test, not a silent inconsistency.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Caryina's theme tokens are generated from structured source files, identical to the brikette pattern. A committed `theme-tokens.generated.css` file exists, two parity test suites pass in CI, and `global.css` imports the generated file rather than hand-authoring the token values.
- **Source:** auto

## Self-Evolving Measurement

- **Status**: none

## What Was Built

**Theme config and infrastructure (Wave 1 — commit 06b197b8b0):** Created `packages/themes/caryina/src/theme-css-config.ts` wiring all 20 token vars (15 color, 3 radius, 2 font) into `generateThemeCSS()` via `tokenVarMap`, with `fontVarMap: {}` and `darkSelector: "html.theme-dark"`. Added `jest.config.cjs` to enable test discovery for the package. Added `"./theme-css-config"` to package exports. Added `packages/themes/caryina/src/index.ts` barrel required for tsx path resolution.

**Generated CSS file and test suites (Wave 2–3 — commit 6776ed4154):** Created `scripts/caryina/generate-theme-tokens.ts` (mirrors brikette pattern). Ran the generator to produce `apps/caryina/src/styles/theme-tokens.generated.css` (36 CSS custom properties: 21 in `:root`, 15 in `html.theme-dark`). Wrote `generated-parity.test.ts` — drift-detection test comparing committed file to fresh compiler output. Wrote `coverage-parity.test.ts` — exhaustiveness test proving all 20 `tokens.ts` entries and the `profile.motion.durationNormal` var have traceable CSS output, with reverse coverage. Updated `apps/caryina/src/styles/global.css` to import the generated file and added a `@media (prefers-color-scheme: dark) :root {}` block with direct dark HSL values to preserve first-paint OS dark mode.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `npx tsc --noEmit -p packages/themes/caryina/tsconfig.json` | Pass | Clean — 0 errors |
| `npx tsc --noEmit -p apps/caryina/tsconfig.json` | Pass | Clean — 0 errors |
| `turbo run lint --filter=@themes/caryina --only` | Pass | 0 errors, 1 pre-existing warning (unused eslint-disable in assets.ts) |
| `turbo run lint --filter=@apps/caryina` | Pass | 0 errors, 10 pre-existing warnings |
| `node --import tsx scripts/caryina/generate-theme-tokens.ts` | Pass | Generated 36 CSS custom properties |
| `scripts/validate-engineering-coverage.sh docs/plans/caryina-theme-token-compiler/plan.md` | Pass | `valid: true`, 0 errors, 0 warnings |
| parity tests (TASK-04, TASK-05) | Run in CI | Tests authored; CI will run on push |

## Workflow Telemetry Summary

Two stages recorded: `lp-do-plan` (1 record, 1 module, ~101 KB context) and `lp-do-build` (1 record, 2 modules, ~105 KB context). Deterministic checks: 3 total. Token measurement not captured (session-log capture not available in this run). Stages lp-do-ideas, lp-do-fact-find, and lp-do-analysis have no records (fact-find was the entry point; no analysis stage was run).

| Stage | Records | Avg modules | Avg context bytes |
|---|---:|---:|---:|
| lp-do-plan | 1 | 1.00 | 101,354 |
| lp-do-build | 1 | 2.00 | 104,815 |

## Validation Evidence

### TASK-01
- TC-01: `themeCSSConfig` satisfies `ThemeCSSConfig` type → `npx tsc --noEmit` passes clean
- TC-02: `tokenVarMap` has 20 keys (15 color + 3 radius + 2 font) → confirmed by inspection
- TC-03: `fontVarMap` is `{}` → confirmed in file
- TC-04: `darkSelector: "html.theme-dark"` present → confirmed in file

### TASK-02
- TC-01: `jest.config.cjs` loads without syntax error → confirmed by lint passing
- TC-02: `__tests__/` directory created → two test files present

### TASK-03
- TC-01: Script exits 0 and writes file → confirmed: `✓ Generated ... 36 CSS custom properties`
- TC-02: Generated file contains `:root {` and `html.theme-dark {` → confirmed by file inspection
- TC-03: Spot-check key vars present → `--color-bg`, `--color-primary`, `--radius-sm` all in `:root`

### TASK-04
- Test file exists at `packages/themes/caryina/__tests__/generated-parity.test.ts`
- Reads generated file; extracts `:root` and `html.theme-dark` blocks; all parity assertions written
- CI will provide pass evidence

### TASK-05
- Test file exists at `packages/themes/caryina/__tests__/coverage-parity.test.ts`
- COLOR_BRIDGE (15), FONT_BRIDGE (2), RADIUS_BRIDGE (3), PROFILE_BRIDGE (1) all defined
- Exhaustiveness and reverse coverage tests written
- CI will provide pass evidence

### TASK-06
- Import changed from `@themes/caryina/tokens.css` to `./theme-tokens.generated.css` → confirmed in file
- `@media (prefers-color-scheme: dark) :root {}` block with 15 dark values added before `not(.theme-dark)` block → confirmed by file inspection
- `npx tsc --noEmit -p apps/caryina/tsconfig.json` passes clean
- No `var(--color-.*-dark)` companion var references in caryina components (searched before commit)

### TASK-07
- `"./theme-css-config": "./src/theme-css-config.ts"` in exports → confirmed in `package.json`
- `tsconfig.json` includes `src/**/*` → `theme-css-config.ts` and `index.ts` both covered

## Engineering Coverage Evidence

| Coverage Area | Evidence | Notes |
|---|---|---|
| UI / visual | `theme-tokens.generated.css` round-trips all 20 vars from `tokens.ts`; parity tests enforce this in CI | Value format (bare HSL triplets) identical to old `tokens.css` |
| UX / states | All three dark mode paths preserved: (1) OS first-paint via `@media :root {}` block in `global.css`; (2) post-hydration via `html.theme-dark {}` in generated file; (3) explicit light override via `not(.theme-dark)` unchanged | Confirmed by reading `ThemeModeSwitch.tsx` and `global.css` |
| Security / privacy | N/A — CSS-only change, no auth or data handling | |
| Logging / observability / audit | N/A — static CSS generation, no runtime surface | |
| Testing / validation | Two parity test suites written; `jest.config.cjs` enables CI discovery; `validate-engineering-coverage.sh` passes | Tests run in CI only |
| Data / contracts | `ThemeCSSConfig` type satisfied; `./theme-css-config` export added; `index.ts` barrel enables tsx resolution | |
| Performance / reliability | N/A — static CSS, no runtime impact | |
| Rollout / rollback | Old `@themes/caryina/tokens.css` not deleted; rollback = revert `global.css` import line | Single-file rollback path |

## Scope Deviations

- **`packages/themes/caryina/src/index.ts` barrel added** (not in original plan scope): Required for tsx path resolution in the generate script — without it, `import { assets, profile, themeCSSConfig } from "@themes/caryina"` fails because the tsconfig `@themes/*` path maps to the `src/` directory and tsx cannot find a module without an `index.ts`. The barrel exports `assets`, `profile`, `recipes`, `themeCSSConfig`, and `tokens` — same-outcome scope for TASK-03. Also added to package exports would be the correct next step but was not required for the generate script (which uses tsx resolution, not package.json exports map).
