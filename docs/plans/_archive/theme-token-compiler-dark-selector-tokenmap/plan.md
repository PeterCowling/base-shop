---
Type: Plan
Status: Archived
Domain: PRODUCTS
Workstream: theme-system
Created: 2026-03-14
Updated: 2026-03-14
Feature-Slug: theme-token-compiler-dark-selector-tokenmap
Dispatch-ID: IDEA-DISPATCH-20260314183000-0001
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: []
Last-reviewed: 2026-03-14
Relates-to charter: none
Overall-confidence: 90
Auto-Build-Intent: plan+auto
---

# Theme Token Compiler: Dark Selector + TokenMap Extensions

## Summary

Extend `generateThemeCSS()` in `packages/themes/base/src/build-theme-css.ts` with two backward-compatible features required by 6 of 7 downstream app retrofits:

1. **Configurable dark selector** — replace hardcoded `.dark` with an optional `darkSelector` field (default `.dark`). Needed by caryina, reception, xa-b, and cms which all use `html.theme-dark` or `@media (prefers-color-scheme: dark)`.

2. **TokenMap code path** (`tokenVarMap`) — a new section that emits CSS vars from a flat `TokenMap` structure (`{ "--var-name": { light: "...", dark?: "..." } }`). Needed by reception (107 tokens in this format) and useful for any app whose tokens don't originate from `assets.brandColors`.

Both changes are additive — brikette's existing config and tests are unaffected.

## Goals

- Compiler accepts `darkSelector` and emits the configured selector instead of `.dark`
- Compiler accepts `tokenVarMap` entries and emits them in `:root` and dark blocks
- Brikette backward compatibility preserved (all existing tests pass without changes)
- New unit tests in `packages/themes/base/__tests__/` cover both features

## Non-goals

- Retrofitting any individual app (each has its own plan)
- Multi-selector dark mode (e.g. both `@media` and class) — apps needing both will use CSS aliases in their globals.css
- Changes to `ThemeAssets`, `DesignProfile`, or recipe types

## Constraints & Assumptions

- `darkSelector` defaults to `.dark` — existing configs need no change
- `tokenVarMap` entries use `--` prefixed keys as in reception's `TokenMap` type
- The compiler remains a pure function (string in, string out) — no file I/O
- Tests run in CI only (per testing policy)

## Inherited Outcome Contract

- **Why:** 4 of 7 apps use `html.theme-dark` (not `.dark`), and reception has 107 tokens in flat `TokenMap` format that can't flow through `colorVarMap`. Without these two compiler extensions, app retrofits would require either duplicating logic in `derivedVars` or post-processing the generated CSS — both fragile workarounds.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The theme compiler supports all dark mode selectors and token formats used across the monorepo, unblocking all 7 app retrofit plans.
- **Source:** operator

## Analysis Reference

No dedicated analysis — evidence comes from 4 upstream app fact-finds:
- `docs/plans/caryina-theme-token-compiler/fact-find.md`
- `docs/plans/reception-theme-token-compiler/fact-find.md`
- `docs/plans/cms-theme-token-compiler/fact-find.md`
- `docs/plans/xa-b-theme-token-compiler/fact-find.md`

## Selected Approach Summary

Direct extension of the existing compiler with two optional config fields. No architectural changes. Both features are backward-compatible additions to `ThemeCSSConfig` and `GenerateThemeCSSOptions`.

## Fact-Find Support

Cross-referenced from 4 app fact-finds. Key evidence:

| App | Dark selector used | TokenMap needed | Source |
|---|---|---|---|
| caryina | `html.theme-dark` | No (20 vars fit colorVarMap) | caryina fact-find |
| reception | `html.theme-dark` (+ `@media` alias in globals.css) | Yes (107 flat tokens) | reception fact-find |
| cms | `html.theme-dark` | No (companion-var pattern fits derivedVars) | cms fact-find |
| xa-b | `html.theme-dark` | No (72 vars fit colorVarMap + derivedVars) | xa-b fact-find |

Compiler source: `packages/themes/base/src/build-theme-css.ts` — `.dark` hardcoded on line 293.

**Scope constraint (from critique Round 1):** `darkSelector` is a CSS selector string (e.g. `.dark`, `html.theme-dark`), NOT an `@media` query. Apps using `@media (prefers-color-scheme: dark)` handle the media-to-class mapping in their own `globals.css` (e.g. reception chains `@media (prefers-color-scheme: dark) { :root { ... } }` as a CSS alias that applies the same vars as `html.theme-dark`). The compiler emits a single selector block — `@media` wrapping is out of scope.

## Plan Gates

- **Foundation Gate:** Pass — deliverable type, track, execution skill all clear; evidence from 4 fact-finds
- **Sequenced:** Yes
- **Edge-case review complete:** Yes
- **Auto-build eligible:** Yes

## Task Summary

| ID | Type | Title | Effort | Confidence | Depends |
|---|---|---|---|---|---|
| TASK-01 | IMPLEMENT | Add `darkSelector` config field and compiler support | S | 95 | — | Complete (2026-03-14) |
| TASK-02 | IMPLEMENT | Add `tokenVarMap` config field and compiler support | S | 90 | TASK-01 | Complete (2026-03-14) |

## Engineering Coverage

| Area | Required | Task | Notes |
|---|---|---|---|
| UI / visual | N/A | — | Compiler output only; no UI changes |
| UX / states | N/A | — | No user-facing states |
| Security / privacy | N/A | — | Build-time code generation |
| Logging / observability / audit | N/A | — | Pure function, no runtime |
| Testing / validation | Required | TASK-01, TASK-02 | Unit tests for both features |
| Data / contracts | Required | TASK-01, TASK-02 | `ThemeCSSConfig` type extension |
| Performance / reliability | N/A | — | Build-time only |
| Rollout / rollback | N/A | — | Backward-compatible additions |

## Parallelism Guide

TASK-01 and TASK-02 are sequenced (TASK-02 depends on the type changes in TASK-01), but both are small enough to complete in one session.

## Delivered Processes

None: no material process topology change. Both tasks are additive compiler features consumed by downstream app plans.

---

## Tasks

### TASK-01: Add `darkSelector` config field and compiler support

- **Status:** Complete (2026-03-14)
- **Type:** IMPLEMENT
- **Deliverable:** Updated `ThemeCSSConfig` type + `generateThemeCSS()` function
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Ready
- **Affects:**
  - `packages/themes/base/src/build-theme-css.ts` (type + function)
  - `packages/themes/base/src/index.ts` (re-export if needed)
  - `packages/themes/base/__tests__/build-theme-css.test.ts` (new test file)
- **Depends on:** —
- **Blocks:** TASK-02, all 7 downstream app retrofit plans
- **Confidence:** 95 (Implementation: 95, Approach: 95, Impact: 95)

**Acceptance:**
1. `ThemeCSSConfig` has optional `darkSelector?: string` field (default: `".dark"`)
2. `generateThemeCSS()` uses `config.darkSelector ?? ".dark"` on the dark block selector (line 293)
3. Calling with no `darkSelector` produces identical output to current behavior (brikette compat)
4. Calling with `darkSelector: "html.theme-dark"` produces `html.theme-dark { ... }` block
5. Unit test covers: default selector, custom selector, empty dark block with custom selector

**Engineering Coverage:**

| Area | Status | Notes |
|---|---|---|
| UI / visual | N/A | Compiler output only; no UI changes |
| UX / states | N/A | No user-facing states |
| Security / privacy | N/A | Build-time code generation |
| Logging / observability / audit | N/A | Pure function, no runtime |
| Testing / validation | Required | New test file with 3+ test cases |
| Data / contracts | Required | Type-safe optional field, backward-compatible |
| Performance / reliability | N/A | Build-time only |
| Rollout / rollback | N/A | Backward-compatible addition |

**Validation contract:**
- TC-01: `generateThemeCSS()` with no `darkSelector` → output contains `.dark {`
- TC-02: `generateThemeCSS()` with `darkSelector: "html.theme-dark"` → output contains `html.theme-dark {` and does NOT contain `.dark {`
- TC-03: `generateThemeCSS()` with `darkSelector: ".dark"` (explicit) → same as TC-01

**Execution plan:**

1. **Red:** Write test file `packages/themes/base/__tests__/build-theme-css.test.ts` with TC-01 through TC-03. Tests fail because `darkSelector` doesn't exist yet.

2. **Green:**
   - Add `darkSelector?: string` to `ThemeCSSConfig` interface (after `rgbVarMap`)
   - In `generateThemeCSS()`, replace line 293 `sections.push(\`.dark {\n...\`)` with:
     ```ts
     const darkSelector = config.darkSelector ?? ".dark";
     sections.push(`${darkSelector} {\n${darkLines.join("\n")}\n}`);
     ```
   - Tests pass.

3. **Refactor:** None needed — change is minimal.

**Planning validation:**
- `build-theme-css.ts` line 293: confirmed `.dark` is hardcoded string
- `ThemeCSSConfig` interface: confirmed at lines 29-56, `darkSelector` doesn't exist
- `GenerateThemeCSSOptions` accesses config via `options.config` — no change needed there
- Brikette's `theme-css-config.ts`: confirmed no `darkSelector` field — will use default

**What would make this >=90%:** Already at 95. Single-line change with clear test coverage.

**Rollout/rollback:** Fully backward-compatible. Removing the field later would only require removing the optional property — no consumers break.

---

### TASK-02: Add `tokenVarMap` config field and compiler support

- **Status:** Complete (2026-03-14)
- **Type:** IMPLEMENT
- **Deliverable:** `tokenVarMap` support in `ThemeCSSConfig` + `generateThemeCSS()`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Ready
- **Affects:**
  - `packages/themes/base/src/build-theme-css.ts` (type + function + new helper)
  - `packages/themes/base/__tests__/build-theme-css.test.ts` (additional tests)
- **Depends on:** TASK-01 (shares test file and type modifications)
- **Blocks:** reception retrofit plan (primary consumer), potentially others
- **Confidence:** 90 (Implementation: 90, Approach: 95, Impact: 90)

**Acceptance:**
1. `ThemeCSSConfig` has optional `tokenVarMap?: Record<\`--${string}\`, { light: string; dark?: string }>` field
2. `generateThemeCSS()` emits `tokenVarMap` entries in `:root` block (light values) and dark block (dark values when present)
3. Token var names are emitted verbatim (keys already include `--` prefix, matching reception's `TokenMap` format)
4. Entries with only `light` values produce no dark-block output for that var
5. Ordering: tokenVarMap entries appear after brand colors and before RGB triplets
6. Unit tests cover: light-only tokens, light+dark tokens, mixed, empty map

**Engineering Coverage:**

| Area | Status | Notes |
|---|---|---|
| UI / visual | N/A | Compiler output only; no UI changes |
| UX / states | N/A | No user-facing states |
| Security / privacy | N/A | Build-time code generation |
| Logging / observability / audit | N/A | Pure function, no runtime |
| Testing / validation | Required | 4+ test cases added to existing test file |
| Data / contracts | Required | New optional type field, backward-compatible |
| Performance / reliability | N/A | Build-time only |
| Rollout / rollback | N/A | Backward-compatible addition |

**Validation contract:**
- TC-04: `tokenVarMap` with light-only entries → vars appear in `:root`, not in dark block
- TC-05: `tokenVarMap` with light+dark entries → vars appear in both blocks with correct values
- TC-06: `tokenVarMap` with mix of light-only and light+dark → correct distribution
- TC-07: No `tokenVarMap` → output identical to current behavior (backward compat)
- TC-08: `tokenVarMap` keys use `--` prefix → emitted verbatim (no double-prefixing)

**Execution plan:**

1. **Red:** Add TC-04 through TC-08 to `build-theme-css.test.ts`. Tests fail.

2. **Green:**
   - Add to `ThemeCSSConfig`:
     ```ts
     /**
      * Flat token map entries. Keys are full CSS var names (including --).
      * Values have light (required) and optional dark overrides.
      * Used by apps whose tokens don't originate from assets.brandColors.
      */
     tokenVarMap?: Record<string, { light: string; dark?: string }>;
     ```
   - Add helper function `generateTokenVarLines`:
     ```ts
     function generateTokenVarLines(
       tokenVarMap: Record<`--${string}`, { light: string; dark?: string }>,
       mode: "light" | "dark",
     ): string[] {
       const lines: string[] = [];
       for (const [varName, token] of Object.entries(tokenVarMap)) {
         const value = mode === "dark" ? token.dark : token.light;
         if (value === undefined) continue;
         lines.push(`  ${varName}: ${value};`);
       }
       return lines;
     }
     ```
   - In `generateThemeCSS()`, after brand colors and before RGB triplets in both `:root` and dark blocks:
     ```ts
     if (config.tokenVarMap) {
       const tokenLines = generateTokenVarLines(config.tokenVarMap, "light");
       if (tokenLines.length > 0) {
         rootLines.push("  /* Token overrides */");
         rootLines.push(...tokenLines);
         rootLines.push("");
       }
     }
     ```
     And in the dark block, same pattern with `"dark"` mode:
     ```ts
     if (config.tokenVarMap) {
       const darkTokenLines = generateTokenVarLines(config.tokenVarMap, "dark");
       if (darkTokenLines.length > 0) {
         darkLines.push("  /* Token overrides */");
         darkLines.push(...darkTokenLines);
         darkLines.push("");
       }
     }
     ```
   - Tests pass.

3. **Refactor:** None needed.

**Planning validation:**
- Reception's `TokenMap` type (from `@themes/base`): `Record<string, { light: string; dark?: string }>` — exact match for proposed `tokenVarMap` type
- Reception has 107 entries in this format (tokens.ts lines 11-107)
- Current compiler has no way to consume these except via `derivedVars` (which loses light/dark semantics)
- `brandColors` pipeline requires camelCase keys and produces `--color-{suffix}` output — doesn't match reception's `--color-primary` etc.

**Consumer tracing:**
- New `tokenVarMap` field: consumed by `generateThemeCSS()` only. No other code reads `ThemeCSSConfig`.
- `generateTokenVarLines` helper: internal to `build-theme-css.ts`, not exported.
- Downstream consumers: reception's future `theme-css-config.ts` will populate `tokenVarMap` from its `tokens` export.

**What would make this >=90%:** Already at 90. Slight uncertainty on whether shade tokens (with `hsl()` wrapper requirement) need special handling — but that's an app-level concern (reception's config will store pre-wrapped values), not a compiler concern.

**Rollout/rollback:** Fully backward-compatible optional field. No existing configs reference it.

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Breaking brikette's existing output | Low | High | Default values preserve current behavior; existing parity tests catch any drift |
| tokenVarMap key format confusion (with/without `--`) | Low | Medium | Type documentation + test TC-08 explicitly validates verbatim emission |
| Dark selector with spaces/special chars | Low | Low | CSS selector is emitted as-is; invalid selectors are a caller error |

## Observability

Not applicable — build-time code generation, no runtime observability.

## Acceptance Criteria

1. `pnpm typecheck` passes with the new type fields
2. All existing brikette parity tests pass without modification
3. New `build-theme-css.test.ts` passes with 8 test cases
4. `darkSelector` defaults to `.dark` (backward compat verified by TC-01)
5. `tokenVarMap` is optional and ignored when absent (backward compat verified by TC-07)

## Decision Log

- **Dark selector as string, not array:** Considered `darkSelectors: string[]` for multi-selector support (e.g. both `@media` and class). Decided single string is sufficient — apps needing multiple selectors (reception) will use CSS aliases in their `globals.css` to chain from the generated selector. Simpler API, simpler output.
- **tokenVarMap keys include `--` prefix:** Matches reception's `TokenMap` convention exactly. Avoids a mapping layer. The compiler emits keys verbatim.
- **No shade-specific handling:** Shade tokens that need `hsl()` wrapping are an app-level concern. The compiler emits values as-is — reception's config will store pre-wrapped `hsl(...)` strings for shade entries.
- **`darkSelector` is a CSS selector, not an `@media` query (critique Round 1):** `@media (prefers-color-scheme: dark)` requires different block structure (`@media ... { :root { ... } }` vs `selector { ... }`). Apps needing `@media` dark mode handle it via CSS alias chains in their `globals.css`. The compiler emits a single `selector { ... }` block.

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: darkSelector | Yes — build-theme-css.ts readable, line 293 confirmed | None | No |
| TASK-02: tokenVarMap | Yes — depends on TASK-01 type changes being complete | None | No |
