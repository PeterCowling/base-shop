# Build Record: Theme Token Compiler — Dark Selector + TokenMap

## Outcome Contract

- **Why:** 4 of 7 apps use `html.theme-dark` (not `.dark`), and reception has 107 tokens in flat `TokenMap` format that can't flow through `colorVarMap`. Without these two compiler extensions, app retrofits would require either duplicating logic in `derivedVars` or post-processing the generated CSS — both fragile workarounds.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The theme compiler supports all dark mode selectors and token formats used across the monorepo, unblocking all 7 app retrofit plans.
- **Source:** operator

## What Was Built

Two backward-compatible extensions to `generateThemeCSS()` in `packages/themes/base/src/build-theme-css.ts`:

1. **`darkSelector`** (optional string, defaults to `".dark"`) — replaces the hardcoded `.dark` CSS selector on the dark mode block. Apps using `html.theme-dark` pass their selector via config.

2. **`tokenVarMap`** (optional `Record<\`--${string}\`, { light: string; dark?: string }>`) — emits CSS vars from a flat token map with light/dark values. Keys are emitted verbatim (including `--` prefix). Light-only entries appear only in `:root`; entries with `dark` values appear in both blocks.

## Files Changed

| File | Change |
|---|---|
| `packages/themes/base/src/build-theme-css.ts` | Added `darkSelector`, `tokenVarMap` to `ThemeCSSConfig`; added `generateTokenVarLines` helper; updated `generateThemeCSS()` to use both |
| `packages/themes/base/__tests__/build-theme-css.test.ts` | New test file with 9 test cases covering both features |

## Engineering Coverage Evidence

| Area | Status | Evidence |
|---|---|---|
| Testing / validation | Complete | 9 test cases: TC-01 through TC-08 + combined feature test |
| Data / contracts | Complete | `ThemeCSSConfig` type extended with TSDoc; template literal type enforces `--` prefix on `tokenVarMap` keys |
| Backward compatibility | Verified | `npx tsc --noEmit` passes for both `@themes/base` and `@themes/brikette` with zero changes to brikette config |

## Build Evidence

- TASK-01 (darkSelector): `ThemeCSSConfig.darkSelector?: string` added; line 339 uses `config.darkSelector ?? ".dark"`; TC-01/02/03 cover default, custom, and explicit-default cases
- TASK-02 (tokenVarMap): `ThemeCSSConfig.tokenVarMap` with template literal key type; `generateTokenVarLines()` helper; token entries in both `:root` and dark blocks; TC-04 through TC-08 cover light-only, light+dark, mixed, backward-compat, and verbatim-key cases
- Combined test verifies darkSelector + tokenVarMap work together
