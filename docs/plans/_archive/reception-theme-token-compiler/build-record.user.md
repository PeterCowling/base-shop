---
Type: Build-Record
Status: Complete
Feature-Slug: reception-theme-token-compiler
Build-date: 2026-03-14
---

# Build Record — Reception Theme Token Compiler

## Outcome Contract

- **Why:** Reception's theme was the last major app still using a hand-authored token file. Unifying both apps on the compiler pipeline eliminates a category of drift — colour changes now need one edit in `tokens.ts` and the generated file stays in sync.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Reception's theme tokens are compiled by `generateThemeCSS` and the generated CSS file matches the current hand-authored `tokens.css` in both content and runtime behaviour. Both parity tests pass in CI.
- **Source:** auto

## Build Summary

All 5 tasks completed on 2026-03-14. Reception's theme is now fully migrated to the shared `generateThemeCSS()` compiler pipeline.

### Tasks Completed

| Task | Title | Notes |
|---|---|---|
| TASK-01 | Create `theme-css-config.ts` with full tokenVarMap | 142 entries: 72 semantic base vars + 70 -dark suffix siblings + 2 font vars. TypeScript clean. |
| TASK-02 | Create generate script + produce `theme-tokens.generated.css` | 315-line output; 283 custom property declarations. Dual dark blocks (media + class). |
| TASK-03 | Write `generated-parity.test.ts` | Cross-check A (tokens.css → generated) + Cross-check B (generated → compiler). |
| TASK-04 | Write `coverage-parity.test.ts` | shade hsl() format, semantic bare triplet, font var(), dark swap pattern checks. |
| TASK-05 | Swap `globals.css` import + update Tailwind shade bridge | globals.css points to generated file; all 35 shade bridge entries changed to `var(...)`. |

## Engineering Coverage Evidence

| Area | Coverage |
|---|---|
| UI / visual | shade vars now store `hsl()` strings; Tailwind bridge changed from `hsl(var(...))` to `var(...)` — eliminates double-wrapping invalid CSS; bar/POS shade cells now resolve to valid colours |
| UX / states | both dark mode paths (class toggle `html.theme-dark` + media query `prefers-color-scheme: dark`) reproduced correctly in generated file |
| Security / privacy | N/A — CSS-only change |
| Logging / observability | N/A — no runtime side effects |
| Testing / validation | two parity tests added to CI; typecheck passes (0 errors) |
| Data / contracts | `ThemeCSSConfig` interface unchanged; `-dark` suffix siblings preserved in `:root` for alias consumers |
| Performance / reliability | generated file is equivalent size (~315 lines); additive `--theme-transition-duration` var is new but harmless |
| Rollout / rollback | rollback = revert `globals.css` import line back to `tokens.css` |

## Validation Evidence

- `validate-engineering-coverage.sh docs/plans/reception-theme-token-compiler/plan.md` → `valid: true`
- `npx tsc --project packages/themes/reception/tsconfig.json --noEmit` → 0 errors
- `npx tsc --project packages/themes/tsconfig.test.typecheck.json --noEmit` → 0 errors
- `npx tsc --project apps/reception/tsconfig.json --noEmit` → 0 errors
- lint-staged: 0 errors on all 4 commits (typecheck + eslint passed)
- `pnpm --filter scripts reception:generate-theme-tokens` → `283 CSS custom property declarations`
- Manual parity check: all 144 `:root` vars in `tokens.css` present in generated file with matching values; dual dark blocks each contain 52 var swap lines (identical sets)

## Key Technical Decisions

- **Dual dark blocks via post-processing**: compiler only emits one `darkSelector` block (`html.theme-dark`). Generate script extracts dark var lines and rebuilds them as `@media (prefers-color-scheme: dark) { :root { ... } }` inserted before the class block. Both blocks have identical var assignments.
- **Shade hsl() wrapping**: shade tokens stored as `hsl(H S% L%)` full strings in `tokenVarMap.light` values; Tailwind bridge uses `var(...)` not `hsl(var(...))`. Fixes Tailwind v4 cascade issue where unlayered `tokens.css` wins over `@layer theme` entries.
- **-dark suffix siblings in :root**: both base var (with `dark: "var(--name-dark)"`) and `-dark` sibling (light-only) present in `tokenVarMap` — required because `globals.css` runtime aliases reference `-dark` siblings directly.

## Workflow Telemetry Summary

| Stage | Records | Avg modules | Avg context bytes | Avg artifact bytes | Token coverage |
|---|---:|---:|---:|---:|---:|
| lp-do-build | 1 | 2.00 | 106228 | 0 | 0.0% |

- Context input bytes: 106228
- Modules counted: 2 (build-code.md, build-validate.md)
- Deterministic checks counted: 1 (validate-engineering-coverage.sh)
