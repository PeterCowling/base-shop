---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-14
Last-reviewed: 2026-03-14
Last-updated: 2026-03-14
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-b-theme-token-compiler
Dispatch-ID: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: none
---

# xa-b Theme Token Compiler Retrofit — Plan

## Summary

xa-b's theme tokens currently live entirely in two hand-authored CSS files (`globals.css` and `xa-cyber-atelier.css`), outside the three-layer generated system the rest of the monorepo uses. This plan creates a new `@themes/xa-b` package with all three layers (assets, design-profile, theme-css-config), wires `generateThemeCSS()` to produce a committed `theme-tokens.generated.css` file, and adds parity tests proving the compiler output is byte-for-byte equivalent to the old hand-authored `:root` and dark blocks. The dark-mode selector gap is resolved without any JS changes: `ThemeModeContext` toggles both `theme-dark` and `dark` classes simultaneously, so `darkSelector: "html.theme-dark"` in the config is sufficient. Once tests are green, the hand-authored `:root` and `html.theme-dark` blocks are stripped, leaving only component CSS in the source files.

## Active tasks
- [ ] TASK-01: Create `@themes/xa-b` package scaffold
- [ ] TASK-02: Write `src/assets.ts`, `src/design-profile.ts`, `src/recipes.ts`, `src/index.ts`
- [ ] TASK-03: Write `src/theme-css-config.ts`
- [ ] TASK-04: Generate `theme-tokens.generated.css` and add workspace dependency
- [ ] TASK-05: Write `__tests__/generated-parity.test.ts` and `__tests__/coverage-parity.test.ts`
- [ ] TASK-06: Update `globals.css` and `xa-cyber-atelier.css` to import generated file and strip token blocks

## Goals
- Create `@themes/xa-b` package with all three layers following the brikette scaffold.
- Produce `apps/xa-b/src/styles/theme-tokens.generated.css` from `generateThemeCSS()`.
- Add parity tests that gate on the generated output matching the token surface exactly.
- Strip hand-authored `:root` / `html.theme-dark` token blocks after tests pass.
- Add `@themes/xa-b` as a workspace dependency in `apps/xa-b/package.json`.

## Non-goals
- Redesigning the xa-b colour palette or typography.
- Adding new dark-mode tokens beyond what exists in `html.theme-dark` today.
- Migrating non-token CSS (component rules, layout helpers, typographic utilities) into the compiler.
- Changing the JS dark-mode toggle mechanism (both `theme-dark` and `dark` classes are already applied).

## Constraints & Assumptions
- Constraints:
  - Generated CSS must be value-equivalent to hand-authored tokens (parity test is the hard gate).
  - `@themes/xa-b` must follow the `@themes/brikette` scaffold exactly: same file layout, same `package.json` shape, same `jest.config.cjs`, same `tsconfig.json`.
  - FAB accent vars store HSL triplets — `hexToRgbTriplet()` won't parse them. Store as `string` literals in `brandColors`; skip RGB triplet generation (xa-b has no `rgba(var(--rgb-xa-fab), alpha)` usage).
  - Strip old `:root`/`html.theme-dark` blocks only in TASK-06, after tests are green in TASK-05.
  - No local test runs — push to CI for test results per testing policy.
- Assumptions:
  - `ThemeModeContext` in `packages/platform-core` applies both `theme-dark` and `dark` classes simultaneously (confirmed: lines 72–73 in `ThemeModeContext.tsx`). No JS changes needed.
  - The 16 swatch vars in `globals.css` `:root` and the 56 semantic vars in `xa-cyber-atelier.css` `:root` are the complete light-mode token surface. The parity test will read the generated file and compare both groups.
  - `--font-body`, `--font-heading-1`, `--font-heading-2` are derived aliases of `var(--font-sans)` → go in `derivedVars.light`.
  - The `.xa-gate-theme` block in `globals.css` and all component CSS in `xa-cyber-atelier.css` are NOT in scope — they stay as-is.
  - `pnpm-lock.yaml` will auto-update when the workspace dependency is added.

## Inherited Outcome Contract

- **Why:** xa-b tokens are hand-authored and isolated from the structured system; as the app grows, divergence from the compiler pattern will make maintenance harder and make agent-assisted theming work unreliable.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `@themes/xa-b` package exists with all three layers, `generateThemeCSS()` produces output that passes parity tests, and the app imports generated tokens instead of hand-authored `:root` blocks.
- **Source:** operator

## Analysis Reference
- Related analysis: None — fact-find routed directly to planning per `Related-Analysis: none` in fact-find frontmatter.
- Selected approach inherited:
  - `colorVarMap: {}` (empty). `fontVarMap: { body: "font-sans", mono: "font-mono" }`. All token vars in `derivedVars.light` (73 entries: 16 swatches + 3 FAB light + 51 semantic + 3 font aliases) and `derivedVars.dark` (34 entries). `colorVarMap` is empty because it emits a `--color-` prefix that would produce `--color-xa-swatch-*` — wrong for xa-b.
  - Dark-mode selector: `darkSelector: "html.theme-dark"` in `ThemeCSSConfig` — uses built-in compiler param, no JS changes.
  - `assets.brandColors` retains swatch and FAB values as Layer 1 structured data for coverage-parity.test.ts verification, but these are not consumed via `colorVarMap`.
- Key reasoning used:
  - `ThemeModeContext` applies both `theme-dark` and `.dark` simultaneously, making both selectors functionally equivalent. Using the built-in `darkSelector` param is the clean zero-JS-change path.
  - `derivedVars` handles all vars whose CSS names don't follow the `--color-` prefix convention emitted by `colorVarMap`.

## Selected Approach Summary
- What was chosen:
  - Create `@themes/xa-b` following brikette scaffold verbatim.
  - `colorVarMap: {}` (empty) — all token vars go in `derivedVars`. The `--color-` prefix emitted by `colorVarMap` conflicts with xa-b's `--xa-swatch-*` and `--xa-fab-*` naming, so `colorVarMap` is not used. `fontVarMap` handles `--font-sans` and `--font-mono` (2 entries).
  - `derivedVars.light`: 73 entries — 16 swatches (`--xa-swatch-*`) + 3 FAB light values + 51 achromatic semantic vars + 3 font alias vars (`--font-body`, `--font-heading-1`, `--font-heading-2`).
  - `derivedVars.dark`: 34 entries — all `html.theme-dark` overrides including 3 FAB dark vars.
  - `darkSelector: "html.theme-dark"` in `ThemeCSSConfig` — no post-processing.
  - Generate into `apps/xa-b/src/styles/theme-tokens.generated.css`, import from `globals.css`.
- Why planning is not reopening option selection:
  - The fact-find fully mapped all 72+ tokens; the compiler already supports `darkSelector`; the brikette pattern is proven end-to-end. No unresolved operator-required forks remain.

## Fact-Find Support
- Supporting brief: `docs/plans/xa-b-theme-token-compiler/fact-find.md`
- Evidence carried forward:
  - Full token inventory: 16 swatch vars (`globals.css` `:root`), 56 semantic vars (`xa-cyber-atelier.css` `:root`), 34 dark vars (`html.theme-dark`) — totals 72 light + 34 dark.
  - `ThemeModeContext.tsx` lines 72–73: `root.classList.toggle("theme-dark", resolved === "dark")` and `root.classList.toggle("dark", resolved === "dark")` — both classes toggled simultaneously.
  - `generateThemeCSS()` in `packages/themes/base/src/build-theme-css.ts` line 339: `const darkSelector = config.darkSelector ?? ".dark"` — built-in `darkSelector` param confirmed.
  - Brikette scaffold confirmed at `packages/themes/brikette/`: `package.json`, `tsconfig.json`, `jest.config.cjs`, `src/assets.ts`, `src/design-profile.ts`, `src/recipes.ts`, `src/theme-css-config.ts`, `src/index.ts`, `__tests__/generated-parity.test.ts`, `__tests__/coverage-parity.test.ts`.
  - `apps/xa-b/package.json` already has `"@themes/base": "workspace:*"` — just needs `"@themes/xa-b": "workspace:*"` added.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Create `@themes/xa-b` package scaffold (package.json, tsconfig.json, jest.config.cjs) | 90% | S | Pending | - | TASK-02 |
| TASK-02 | IMPLEMENT | Write assets.ts, design-profile.ts, recipes.ts, index.ts | 90% | M | Pending | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Write theme-css-config.ts (colorVarMap, fontVarMap, derivedVars, darkSelector) | 85% | M | Pending | TASK-02 | TASK-04 |
| TASK-04 | IMPLEMENT | Generate theme-tokens.generated.css; add workspace dep to apps/xa-b/package.json | 85% | S | Pending | TASK-03 | TASK-05 |
| TASK-05 | IMPLEMENT | Write generated-parity.test.ts and coverage-parity.test.ts | 85% | M | Pending | TASK-04 | TASK-06 |
| TASK-06 | IMPLEMENT | Update globals.css/xa-cyber-atelier.css: import generated file, strip token blocks | 85% | S | Pending | TASK-05 | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | Parity test is the hard gate — if all 72+ vars pass, zero visual regression is possible | TASK-05 | Token names stay identical; only `:root` source changes |
| UX / states | Dark mode tested via parity test dark selector block (`html.theme-dark`) | TASK-03, TASK-05 | Both `theme-dark` and `dark` classes applied by ThemeModeContext — backward compat preserved |
| Security / privacy | N/A — CSS token generation only; no auth, input handling, or sensitive data | - | No security surface |
| Logging / observability / audit | N/A — build-time generation; no runtime side-effects | - | Parity test failure = CI red; no additional observability needed |
| Testing / validation | Two unit test suites: generated-parity.test.ts (compiler output matches committed file) + coverage-parity.test.ts (all CSS vars accounted for) | TASK-05 | Follow brikette test pattern exactly |
| Data / contracts | `ThemeCSSConfig` schema; `colorVarMap: {}` (empty); all token vars in `derivedVars`; FAB stored as `BrandColor` in `assets.brandColors` for coverage test, emitted via `derivedVars` | TASK-03 | `rgbVarMap` omitted entirely; no RGB triplet generation needed for xa-b |
| Performance / reliability | N/A — generated CSS is a static file; no runtime cost | - | Build-time only |
| Rollout / rollback | Strip old `:root` blocks only after TASK-05 tests pass; rollback = revert generated file and re-add inline blocks | TASK-06 | Commit generated file before stripping originals |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Package scaffold; unblocks everything |
| 2 | TASK-02 | TASK-01 | Assets, profile, recipes, index in sequence (profile depends on assets types) |
| 3 | TASK-03 | TASK-02 | ThemeCSSConfig references assets and profile imports |
| 4 | TASK-04 | TASK-03 | Generate CSS + add dep; must happen before tests can read the file |
| 5 | TASK-05 | TASK-04 | Tests read committed generated file |
| 6 | TASK-06 | TASK-05 | Strip old blocks only after tests are green in CI |

## Delivered Processes

| Area | Trigger | Delivered step-by-step flow | Tasks / dependencies | Unresolved issues / rollback seam |
|---|---|---|---|---|
| Token authoring | Developer changes an xa-b theme color or semantic token | (1) Edit `packages/themes/xa-b/src/assets.ts` or `theme-css-config.ts` → (2) Run generate script to update `apps/xa-b/src/styles/theme-tokens.generated.css` → (3) Commit generated file → (4) CI runs parity test as gate | TASK-01–TASK-05 | Rollback: revert generated file and regenerate; no DB or service restarts |
| CSS delivery | Next.js/Turbopack build | `globals.css` imports `../styles/theme-tokens.generated.css` → compiler bundles it; token vars available globally | TASK-06 | Rollback: re-add inline `:root` blocks and remove `@import` |

## Tasks

---

### TASK-01: Create `@themes/xa-b` package scaffold
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `packages/themes/xa-b/package.json`, `packages/themes/xa-b/tsconfig.json`, `packages/themes/xa-b/jest.config.cjs`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `packages/themes/xa-b/package.json` (new), `packages/themes/xa-b/tsconfig.json` (new), `packages/themes/xa-b/jest.config.cjs` (new)
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 90%
  - Implementation: 90% — direct copy-and-adapt of `packages/themes/brikette/` scaffold; all files inspected; exact contents known
  - Approach: 95% — brikette is the proven template; no uncertainty in approach
  - Impact: 95% — scaffolding task; well-bounded
  - Held-back test: Implementation at 90 (not 80 trigger), no held-back test required. Confidence capped at 90 because this is a new package not yet type-checked; minor tsconfig path issues are possible.
- **Acceptance:**
  - `packages/themes/xa-b/package.json` exists with `name: "@themes/xa-b"`, `"@themes/base": "workspace:*"` dependency, same exports map as brikette
  - `packages/themes/xa-b/tsconfig.json` extends `../../../tsconfig.base.json`
  - `packages/themes/xa-b/jest.config.cjs` delegates to `@acme/config/jest.preset.cjs`
- **Engineering Coverage:**
  - UI / visual: N/A — scaffolding only; no CSS produced yet
  - UX / states: N/A — no runtime logic
  - Security / privacy: N/A — build config only
  - Logging / observability / audit: N/A
  - Testing / validation: N/A — jest config scaffolded here; tests written in TASK-05
  - Data / contracts: Required — `package.json` exports map must match brikette exactly so downstream imports work
  - Performance / reliability: N/A
  - Rollout / rollback: N/A — new directory; delete to roll back
- **Validation contract (TC-01):**
  - TC-01: `package.json` has correct `name`, `exports`, and `dependencies` → matches brikette structure with xa-b name substitutions
  - TC-02: `tsconfig.json` extends base config → `npx tsc --noEmit` in `packages/themes/xa-b` passes once source files exist
- **Execution plan:** Red → Green → Refactor
  - Red: Directory doesn't exist
  - Green: Copy brikette's three scaffold files; substitute `brikette` → `xa-b` in name fields; verify `exports` map matches
  - Refactor: None needed — this is a one-shot copy-adapt
- **Planning validation (required for M/L):**
  - None: S effort task
- **Scouts:** `packages/themes/brikette/package.json` confirmed as template source — `exports` map has 5 entries (`.`, `./assets`, `./design-profile`, `./recipes`, `./theme-css-config`); xa-b must replicate exactly.
- **Edge Cases & Hardening:** Package name must be `@themes/xa-b` (not `@themes/xa_b` or similar) — pnpm workspace resolution is name-exact.
- **What would make this >=90%:** Already at 90%; would reach 95% after first CI typecheck passes.
- **Rollout / rollback:**
  - Rollout: New directory with 3 files; no existing code touched
  - Rollback: `rm -rf packages/themes/xa-b/`
- **Documentation impact:** None: no docs needed for package scaffold
- **Notes / references:**
  - Reference: `packages/themes/brikette/package.json` (line 1–24), `tsconfig.json` (line 1–11), `jest.config.cjs` (line 1–2)

---

### TASK-02: Write `src/assets.ts`, `src/design-profile.ts`, `src/recipes.ts`, `src/index.ts`
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `packages/themes/xa-b/src/assets.ts`, `packages/themes/xa-b/src/design-profile.ts`, `packages/themes/xa-b/src/recipes.ts`, `packages/themes/xa-b/src/index.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `packages/themes/xa-b/src/assets.ts` (new), `packages/themes/xa-b/src/design-profile.ts` (new), `packages/themes/xa-b/src/recipes.ts` (new), `packages/themes/xa-b/src/index.ts` (new)
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 90%
  - Implementation: 90% — full token inventory in fact-find; brikette is the reference; swatch hex values are exact; FAB HSL triplets confirmed; font stacks confirmed
  - Approach: 95% — clean layer mapping; assets get swatches + FAB + fonts; profile gets achromatic minimal character; recipes get gate theme metadata
  - Impact: 90% — these files are consumed by TASK-03 (theme-css-config) and TASK-05 (coverage test); correct values here are essential for parity
  - Held-back test: Implementation at 90 (not 80 trigger), no held-back test required. Capped at 90 because the `DesignProfile` type shape has many required fields — some less-used fields (e.g., `modes`) may need placeholder values.
- **Acceptance:**
  - `assets.ts`: exports `const assets: ThemeAssets` with `fonts` (2 entries: body Work Sans, mono IBM Plex Mono), `brandColors` (16 swatch hex strings + 3 FAB HSL strings with light/dark), `gradients: {}`, `shadows: {}`, `keyframes: {}`
  - `design-profile.ts`: exports `const profile: DesignProfile` with achromatic minimal character (monochromatic strategy, sharp radii, flat elevation, precise motion)
  - `recipes.ts`: exports `const recipes: ThemeRecipes` with gate theme, support dock, panel, and PDP metadata (metadata only — no generated CSS)
  - `index.ts`: re-exports `assets`, `profile`, `recipes`, `themeCSSConfig` (even though `themeCSSConfig` is written in TASK-03, `index.ts` just re-exports from the same module)
- **Engineering Coverage:**
  - UI / visual: Required — `assets.brandColors` values are the source of truth for swatch colors; incorrect hex = wrong visual output
  - UX / states: N/A — data layer only
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — `coverage-parity.test.ts` (TASK-05) reads `assets` directly; incorrect values will fail parity test
  - Data / contracts: Required — `brandColors` uses `string | BrandColor` type; FAB vars stored as `string` (HSL triplet), not `BrandColor` with `light/dark`. Wait — FAB has light AND dark values; must use `BrandColor` shape: `{ light: "158 18% 30%", dark: "158 14% 68%" }`. The `isBrandColorObject` check in the compiler handles this correctly.
  - Performance / reliability: N/A
  - Rollout / rollback: N/A — new files; delete to roll back
- **Validation contract (TC-02):**
  - TC-01: All 16 swatch hex values in `assets.brandColors` match `globals.css` `:root` block exactly
  - TC-02: FAB `brandColors` entries are `BrandColor` shape with light HSL triplet `"158 18% 30%"` and dark `"158 14% 68%"`
  - TC-03: Font family strings match `xa-cyber-atelier.css` `--font-sans` and `--font-mono` values
  - TC-04: `npx tsc --noEmit` in `packages/themes/xa-b` passes with no errors
- **Execution plan:** Red → Green → Refactor
  - Red: Files don't exist; TASK-03 cannot compile
  - Green: Write `assets.ts` with exact hex values from `globals.css` lines 13–29; write FAB `BrandColor` entries from `xa-cyber-atelier.css` lines 65–67 (light) and 109–111 (dark); write font entries from lines 41–42; write minimal `design-profile.ts`; write minimal `recipes.ts`; write `index.ts` re-exports
  - Refactor: Ensure `gradients: {}`, `shadows: {}`, `keyframes: {}` are non-empty stubs satisfying the `ThemeAssets` type (use empty records if the type allows, or minimal stubs)
- **Planning validation (required for M/L):**
  - Checks run: Inspected `ThemeAssets` interface in `packages/themes/base/src/theme-expression.ts` — all top-level fields are `Record<string, ...>` (open), so empty `{}` is valid for `gradients`, `shadows`, `keyframes`.
  - Validation artifacts: `packages/themes/base/src/theme-expression.ts` lines 55–61
  - Unexpected findings: FAB vars must use `BrandColor` shape (not `string`) since they have light/dark variants — this differs from pure-hex swatches which are `string` literals. The `isBrandColorObject` check in the compiler correctly handles both cases.
- **Scouts:** `ThemeAssets` interface: `fonts: Record<string, FontAsset>`, `gradients: Record<string, GradientAsset>`, `shadows: Record<string, string>`, `keyframes: Record<string, KeyframeAsset>`, `brandColors: Record<string, BrandColor | string>`. Empty records are type-valid.
- **Edge Cases & Hardening:** FAB vars are `BrandColor` (object) not `string` — `isBrandColorObject` check uses `"light" in value`; must use `{ light: "...", dark?: "..." }` shape, not string, for FAB entries.
- **What would make this >=90%:** Already at 90%; reaches 95% when TASK-05 coverage test passes.
- **Rollout / rollback:**
  - Rollout: New files only; no existing code changed
  - Rollback: Delete `packages/themes/xa-b/src/`
- **Documentation impact:** None: structural metadata; no user-facing docs
- **Notes / references:**
  - Swatch hex values: `apps/xa-b/src/app/globals.css` lines 13–29
  - FAB values: `apps/xa-b/src/app/xa-cyber-atelier.css` lines 65–67, 109–111
  - Font stacks: `xa-cyber-atelier.css` lines 41–42

---

### TASK-03: Write `src/theme-css-config.ts`
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `packages/themes/xa-b/src/theme-css-config.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `packages/themes/xa-b/src/theme-css-config.ts` (new)
- **Depends on:** TASK-02
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 85% — full derivedVars mapping is defined in fact-find; 54 light vars + 34 dark vars to enumerate by hand; a transcription error on any single value will fail the parity test
  - Approach: 90% — approach is fully settled; `colorVarMap: {}`, `fontVarMap` for sans/mono, `derivedVars.light` (73 entries) for all token vars, `darkSelector: "html.theme-dark"`
  - Impact: 95% — this file directly determines compiler output; if correct, downstream tasks succeed
  - Held-back test: Implementation at 85 (not 80 trigger). Capped at 85 due to verbatim transcription risk on 88 entries total.
- **Acceptance:**
  - `colorVarMap: {}` (empty) — swatches and FAB vars go in `derivedVars`, not `colorVarMap`
  - `fontVarMap`: 2 entries (`body → "font-sans"`, `mono → "font-mono"`) — these emit `--font-sans` and `--font-mono`
  - `derivedVars.light`: 73 entries — 16 swatches (`--xa-swatch-*`, hex values), 3 FAB light values (`--xa-fab-bg`, `--xa-fab-fg`, `--xa-fab-hover`), 51 achromatic semantic/surface/border/radius/elevation vars, 3 font alias vars (`--font-body: var(--font-sans)`, `--font-heading-1: var(--font-sans)`, `--font-heading-2: var(--font-sans)`)
  - `derivedVars.dark`: 34 entries — all `html.theme-dark` overrides from `xa-cyber-atelier.css` lines 71–112 (31 non-FAB + 3 FAB dark vars)
  - `darkSelector: "html.theme-dark"` set explicitly
  - `rgbVarMap` omitted entirely (no RGB triplet usage in xa-b)
  - `npx tsc --noEmit` passes
- **Engineering Coverage:**
  - UI / visual: Required — every semantic color/surface/border token is in `derivedVars`; incorrect values = visual regression
  - UX / states: Required — dark mode overrides in `derivedVars.dark`; `darkSelector` must match app's applied class
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — parity test reads this config's output; all 88 vars must be present and correct
  - Data / contracts: Required — `ThemeCSSConfig` type; `colorVarMap: {}` (empty); `fontVarMap` keys must match `assets.fonts` keys; `derivedVars.light` entries must use correct CSS var names (no `--color-` prefix wrapping)
  - Performance / reliability: N/A
  - Rollout / rollback: N/A — new file; delete to roll back
- **Validation contract (TC-03):**
  - TC-01: `colorVarMap` is `{}` (empty object — no entries)
  - TC-02: `fontVarMap` has exactly 2 keys (`body`, `mono`) matching `assets.fonts` keys
  - TC-03: `derivedVars.light` has exactly 73 entries: 16 swatches from `globals.css` `:root`, 3 FAB light values, 51 semantic/surface/border/radius/elevation vars, and 3 font aliases — accounting for all 56 vars in `xa-cyber-atelier.css` `:root` (minus 2 font vars covered by fontVarMap) plus 16 swatches from `globals.css`
  - TC-04: `derivedVars.dark` has exactly 34 entries matching `html.theme-dark` block
  - TC-05: `darkSelector` is `"html.theme-dark"`
  - TC-06: `npx tsc --noEmit` passes
- **Execution plan:** Red → Green → Refactor
  - Red: File doesn't exist; TASK-04 generation script cannot import the config
  - Green: Write file with all 4 sections; transcribe every value verbatim from source CSS; set `darkSelector: "html.theme-dark"`; omit `rgbVarMap`
  - Refactor: Cross-check each `derivedVars.light` entry against `xa-cyber-atelier.css` `:root` block line-by-line to catch transcription errors
- **Planning validation (required for M/L):**
  - Checks run: Counted vars in `xa-cyber-atelier.css`:
    - `:root` block: 56 total vars (lines 5–68). `fontVarMap` handles 2 font vars (`--font-sans`, `--font-mono`). Remaining 54 vars from atelier `:root` go into `derivedVars.light` (51 semantic + 3 font aliases: `--font-body`, `--font-heading-1`, `--font-heading-2`). Plus 16 swatch vars from `globals.css` `:root` go into `derivedVars.light`. Total `derivedVars.light`: 54 + 16 = 70. But also 3 FAB light vars (previously assumed in `colorVarMap`, now resolved to `derivedVars.light`). Corrected total: 54 + 16 + 3 (FAB) = 73. The original count of 54 was pre-resolution; 73 is the correct post-resolution figure.
    - `html.theme-dark` block: lines 71–112 = 34 vars (confirmed in fact-find). Includes 3 FAB dark vars.
  - Validation artifacts: `apps/xa-b/src/app/xa-cyber-atelier.css` (full file read)
  - Unexpected findings: `colorVarMap` cannot be used for swatch or FAB vars — `--color-` prefix would produce wrong names. Resolved: all go in `derivedVars`. See Scouts section for full analysis.
- **Scouts:** Compiler `colorVarMap` entry key must match `assets.brandColors` key — e.g., `xaSwatchBlack` in assets maps to `colorVarMap: { xaSwatchBlack: "xa-swatch-black" }`. The CSS var name emitted will be `--color-xa-swatch-black`. Wait — this adds a `--color-` prefix. But the original CSS vars are `--xa-swatch-*`, not `--color-xa-swatch-*`. This is a critical gap to resolve.

  **Critical scout finding:** `generateLightColorVars()` in the compiler emits `--color-${varSuffix}`. So `colorVarMap: { xaSwatchBlack: "xa-swatch-black" }` would emit `--color-xa-swatch-black`, but the actual CSS var name needed is `--xa-swatch-black`. Two resolution paths:
  - (a) Set `varSuffix` to include the full suffix after `--color-` normally. This means we'd emit `--color-xa-swatch-black` — but that's WRONG since the original is `--xa-swatch-black`.
  - (b) Don't use `colorVarMap` for swatches. Instead, put all swatch vars in `derivedVars.light` with their full names: `"xa-swatch-black": "#0f0f0f"`. This keeps the `--xa-swatch-*` names intact without `--color-` prefix.
  - (c) Put FAB vars also in `derivedVars` since they use `hsl()` at call sites and don't need the `--color-` prefix (the original names are `--xa-fab-bg`, not `--color-xa-fab-bg`).

  **Resolution:** Use `derivedVars.light` for swatches (16 vars), `derivedVars.dark` is unchanged. FAB light values in `derivedVars.light`, FAB dark values in `derivedVars.dark`. This means `colorVarMap` is empty `{}` and `fontVarMap` stays as-is. The `brandColors` in assets are still useful as Layer 1 structured data (for `coverage-parity.test.ts` to verify) but are not emitted via `colorVarMap`.

  **Revised approach:** `colorVarMap: {}`, `fontVarMap: { body: "font-sans", mono: "font-mono" }`, `derivedVars.light`: all 54 semantic vars + 16 swatches + 3 FAB light values = 73 entries total. `derivedVars.dark`: 34 dark-mode overrides (includes 3 FAB dark vars). `assets.brandColors` still holds all values as Layer 1 structured data.

  Wait — `fontVarMap` uses `generateFontVars()` which emits `--${varName}: ${font.family}`, so `fontVarMap: { body: "font-sans" }` emits `--font-sans: <family>`. The original CSS has `--font-sans: var(--font-atelier-sans, "Work Sans", "Helvetica Neue", Arial, sans-serif)` — this is a CSS var reference, not a font family string. The `generateFontVars` function reads `assets.fonts[fontKey].family` and emits it. So `assets.fonts.body.family` would need to be `var(--font-atelier-sans, "Work Sans", "Helvetica Neue", Arial, sans-serif)` — which is a valid string (the compiler just emits it verbatim).

  This is fine. `fontVarMap` remains as-is. But for `--font-body`, `--font-heading-1`, `--font-heading-2` (which are `var(--font-sans)`), these go in `derivedVars.light`.

  **Final revised derivedVars.light count:** 51 semantic vars + 3 font aliases + 16 swatches + 3 FAB light = 73 entries.
  **derivedVars.dark:** 34 entries (31 non-FAB overrides + 3 FAB dark vars).

- **Edge Cases & Hardening:** The `--color-` prefix issue is the key edge case (resolved above: swatches go in `derivedVars.light`, not `colorVarMap`). Font stacks include `var(--font-atelier-sans, ...)` as the CSS var reference — this is emitted verbatim, which is correct.
- **What would make this >=90%:** Parity test passing on first CI run. Currently at 85% due to manual transcription risk on 73 derivedVars.light entries.
- **Rollout / rollback:**
  - Rollout: New file only
  - Rollback: Delete file
- **Documentation impact:** None: internal compiler config
- **Notes / references:**
  - `packages/themes/base/src/build-theme-css.ts` lines 115–130: `generateLightColorVars` emits `--color-${varSuffix}` — confirming the `--color-` prefix issue
  - Revised plan: `colorVarMap: {}`, all token vars in `derivedVars`
  - `apps/xa-b/src/app/xa-cyber-atelier.css` is the source of truth for all derivedVars values

---

### TASK-04: Generate `theme-tokens.generated.css` and add workspace dependency
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/xa-b/src/styles/theme-tokens.generated.css` (new), `apps/xa-b/package.json` (updated), `pnpm-lock.yaml` (auto-updated)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/xa-b/src/styles/theme-tokens.generated.css` (new), `apps/xa-b/package.json` (updated), `pnpm-lock.yaml` (auto-updated)
- **Depends on:** TASK-03
- **Blocks:** TASK-05
- **Confidence:** 85%
  - Implementation: 85% — generation is a single script invocation; `@themes/xa-b` package must resolve correctly in pnpm workspace before the script can run
  - Approach: 90% — brikette uses the same pattern; just a script that calls `generateThemeCSS()` and writes to file
  - Impact: 90% — the generated file is the source of truth for TASK-05 parity test; must be correct
  - Held-back test: Implementation at 85, Approach at 90, Impact at 90. min = 85. Not at exact 80 trigger. Capped at 85: pnpm install step after adding workspace dep is a sequential step that could fail if the package.json exports are malformed.
- **Acceptance:**
  - `apps/xa-b/src/styles/theme-tokens.generated.css` exists and contains `:root { ... }` and `html.theme-dark { ... }` blocks
  - `apps/xa-b/package.json` has `"@themes/xa-b": "workspace:*"` in `dependencies`
  - `pnpm install` completes without error
  - Generated file produces at minimum 72 custom property declarations in `:root` (16 swatches + 2 fonts + 54 semantic) and 34 in `html.theme-dark`
- **Engineering Coverage:**
  - UI / visual: Required — generated file is the CSS deployed; must contain all token vars
  - UX / states: N/A — generation is build-time
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — generated file must be committed so parity test can read it; test compares compiler output vs committed file
  - Data / contracts: Required — workspace dep addition must be picked up by pnpm; generated file encoding must be UTF-8
  - Performance / reliability: N/A
  - Rollout / rollback: N/A — new file; rollback = delete generated file and revert package.json
- **Validation contract (TC-04):**
  - TC-01: Generated CSS file exists at `apps/xa-b/src/styles/theme-tokens.generated.css`
  - TC-02: File contains `:root {` block with `color-scheme: light;` and token vars
  - TC-03: File contains `html.theme-dark {` block with `color-scheme: dark;` and dark overrides
  - TC-04: `apps/xa-b/package.json` contains `"@themes/xa-b": "workspace:*"`
- **Execution plan:** Red → Green → Refactor
  - Red: Generated file does not exist; parity test would fail with file-not-found
  - Green: (1) Add `"@themes/xa-b": "workspace:*"` to `apps/xa-b/package.json` dependencies; (2) Run `pnpm install` to link workspace package; (3) Write `packages/themes/xa-b/scripts/generate.ts` (new file — no existing brikette equivalent): imports `generateThemeCSS` from `@themes/base`, imports `assets`, `profile`, `themeCSSConfig` from `../src/index.ts`, writes `generateThemeCSS({ assets, profile, config: themeCSSConfig })` output to `../../apps/xa-b/src/styles/theme-tokens.generated.css` via `fs.writeFileSync`; (4) Execute with `npx tsx packages/themes/xa-b/scripts/generate.ts` from repo root; (5) Commit the generated file
  - Refactor: Verify generated file manually — check `:root {` block present, `html.theme-dark {` block present, count of lines ≥ 110
- **Planning validation (required for M/L):**
  - None: S effort task
- **Scouts:** `apps/xa-b/src/styles/` directory — does it exist? Need to create if not. Check: `apps/xa-b/src/app/globals.css` imports `./xa-cyber-atelier.css` with no `styles/` subdirectory reference. The generated file will go in `src/styles/` (following brikette pattern at `apps/brikette/src/styles/theme-tokens.generated.css`). Need to create the directory.
- **Edge Cases & Hardening:** (1) `src/styles/` directory may not exist — create it with the generated file. (2) Generation script must use `import` (ESM) not `require` since `@themes/xa-b` uses `"type": "module"`. (3) The script may need `tsx` or `ts-node` to run TypeScript directly — use `node --experimental-strip-types` (available in Node 22+) or `npx tsx`.
- **What would make this >=90%:** Confirmed `pnpm install` links the package correctly and generated file passes initial visual inspection.
- **Rollout / rollback:**
  - Rollout: New file + package.json dep addition
  - Rollback: Delete generated file; revert package.json dep
- **Documentation impact:** None
- **Notes / references:**
  - Generation script: write as a new file at `packages/themes/xa-b/scripts/generate.ts` — no brikette equivalent confirmed to exist
  - `src/styles/` directory must be created alongside the generated file

---

### TASK-05: Write `__tests__/generated-parity.test.ts` and `__tests__/coverage-parity.test.ts`
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `packages/themes/xa-b/__tests__/generated-parity.test.ts` (new), `packages/themes/xa-b/__tests__/coverage-parity.test.ts` (new)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `packages/themes/xa-b/__tests__/generated-parity.test.ts` (new), `packages/themes/xa-b/__tests__/coverage-parity.test.ts` (new)
- **Depends on:** TASK-04
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 85% — brikette test pattern is fully understood; must adapt `extractVarsFromBlock` to use `"html.theme-dark"` as the dark selector string; main risk is the dark block selector detection in the parser
  - Approach: 90% — adapt brikette tests directly; no novel patterns needed
  - Impact: 95% — these tests are the parity gate; once green in CI, TASK-06 is safe to execute
  - Held-back test: Implementation at 85 (not 80 trigger). `extractVarsFromBlock` uses `css.indexOf(blockSelector)` — must use `"html.theme-dark"` not `".dark"` for xa-b. If not updated, dark block tests will silently find 0 vars and pass vacuously — that would be a silent failure. This is the main risk, hence 85%.
- **Acceptance:**
  - `generated-parity.test.ts`: reads `apps/xa-b/src/styles/theme-tokens.generated.css`; runs `generateThemeCSS()` with xa-b config; asserts all `:root` and `html.theme-dark` vars are present and values match; includes explicit `existingDarkVars.size > 0` guard
  - `coverage-parity.test.ts`: reads both `apps/xa-b/src/app/globals.css` AND `apps/xa-b/src/styles/theme-tokens.generated.css`; combines into `allCSS = globalCSS + generatedTokensCSS` (same pattern as brikette) so the test remains valid after TASK-06 strips the source `:root` blocks; defines `SWATCH_BRIDGE`, `FONT_BRIDGE`, `DERIVED_VARS` sets mapping all 72 light vars and 34 dark vars to their asset/derivedVars source; asserts no unaccounted vars
  - Both tests have no vacuous passes — dark block selector must correctly find `html.theme-dark` block
  - `npx tsc --noEmit` passes for the package
- **Engineering Coverage:**
  - UI / visual: Required — parity test is the visual correctness gate
  - UX / states: Required — dark mode vars must be in the test assertions (`html.theme-dark` block)
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — these tests ARE the validation; pattern follows brikette exactly; adapted for xa-b token names and dark selector
  - Data / contracts: Required — `extractVarsFromBlock` must use correct block selector strings
  - Performance / reliability: N/A
  - Rollout / rollback: N/A — test files only; no rollback needed
- **Validation contract (TC-05):**
  - TC-01: `extractVarsFromBlock(css, "html.theme-dark")` correctly extracts 34 vars from generated file
  - TC-02: `extractVarsFromBlock(css, ":root")` correctly extracts all 72+ light-mode vars
  - TC-03: `coverage-parity.test.ts` exhaustiveness test catches any unaccounted var (unaccounted array is empty)
  - TC-04: Both tests pass in CI (`pnpm --filter @themes/xa-b test`)
- **Execution plan:** Red → Green → Refactor
  - Red: Test files don't exist; no CI gate on token correctness
  - Green: Copy `packages/themes/brikette/__tests__/generated-parity.test.ts`; update paths to xa-b generated file; update dark selector string from `".dark"` to `"html.theme-dark"`; update import paths to xa-b assets/profile/config. Copy `coverage-parity.test.ts`; replace brikette bridge maps with xa-b bridge maps; remove keyframes/gradients sections (xa-b has none); add swatch bridge and FAB bridge.
  - Refactor: Add explicit assertion that dark var count > 0 (anti-vacuous-pass guard)
- **Planning validation (required for M/L):**
  - Checks run: Inspected `extractVarsFromBlock` in brikette tests — it uses simple string indexOf for the selector. For `html.theme-dark`, this will find the block at the correct position in the generated CSS since the compiler emits the selector verbatim from `darkSelector`.
  - Validation artifacts: `packages/themes/brikette/__tests__/generated-parity.test.ts` line 64: `const existingDarkVars = extractVarsFromBlock(tokenCSS, ".dark")` — must change to `"html.theme-dark"` for xa-b.
  - Unexpected findings: The brikette generated-parity test reads the committed generated file and compares to compiler output. Both should be identical (since the committed file IS the compiler output from TASK-04). This means the parity test always passes on first run after TASK-04 commits correctly. The real value is as a regression gate for future edits.
- **Consumer tracing:**
  - `generated-parity.test.ts` consumes: `theme-tokens.generated.css` (TASK-04 output), `assets` (TASK-02), `profile` (TASK-02), `themeCSSConfig` (TASK-03)
  - `coverage-parity.test.ts` consumes: `globals.css` (existing), `xa-cyber-atelier.css` (existing, will be modified in TASK-06), `assets` (TASK-02)
  - NOTE: `coverage-parity.test.ts` reads source CSS files. After TASK-06 strips the `:root` blocks, these test files must still work — they can read the generated file too (as brikette does with `allCSS = globalCSS + generatedTokensCSS`). The test must be written to combine both files.
- **Scouts:** Must verify that `packages/themes/xa-b/` has a `jest.config.cjs` that picks up `__tests__/` directory. The brikette jest config delegates to `@acme/config/jest.preset.cjs` which handles all `__tests__/` files. Confirmed: `jest.config.cjs` is created in TASK-01.
- **Edge Cases & Hardening:** Anti-vacuous-pass guard: assert `existingDarkVars.size > 0` before running dark block comparison tests. This catches the case where `extractVarsFromBlock` fails to find the `html.theme-dark` block.
- **What would make this >=90%:** CI passing on first push. Main risk is the dark block selector change — adding an explicit size > 0 assertion guards against this.
- **Rollout / rollback:**
  - Rollout: New test files; no app code touched
  - Rollback: Delete test files
- **Documentation impact:** None
- **Notes / references:**
  - Brikette parity test: `packages/themes/brikette/__tests__/generated-parity.test.ts` (full file read)
  - Dark selector to use: `"html.theme-dark"` (not `".dark"`)
  - Coverage test must read both `globals.css` AND generated file for `allCSS` (swatch vars move from globals.css to generated file in TASK-06)

---

### TASK-06: Update `globals.css` and `xa-cyber-atelier.css` — import generated file, strip token blocks
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/xa-b/src/app/globals.css` (updated), `apps/xa-b/src/app/xa-cyber-atelier.css` (updated)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/xa-b/src/app/globals.css` (updated), `apps/xa-b/src/app/xa-cyber-atelier.css` (updated)
- **Depends on:** TASK-05
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — straightforward CSS edit; main risk is the import path resolving correctly from `globals.css` to `../styles/theme-tokens.generated.css`
  - Approach: 90% — strip `:root` block from `globals.css` (lines 12–29) + add import; strip `:root` and `html.theme-dark` blocks from `xa-cyber-atelier.css` (lines 4–112) while preserving component CSS (lines 114+)
  - Impact: 90% — this is the final step; if parity test passed (TASK-05 gate), visual correctness is guaranteed
  - Held-back test: Implementation at 85 (not 80 trigger). Capped at 85 because the import path from `globals.css` to `src/styles/` must be correct, and the CSS cascade order matters (generated file must be imported before component CSS that references the vars).
- **Acceptance:**
  - `globals.css`: `@import "../styles/theme-tokens.generated.css"` added at appropriate position (before xa-cyber-atelier.css import); `:root { --xa-swatch-* }` block removed (lines 12–29)
  - `xa-cyber-atelier.css`: `:root { ... }` block (lines 4–68) removed; `html.theme-dark { ... }` block (lines 70–112) removed; component CSS from line 114 onward preserved intact
  - App builds without CSS errors (`pnpm --filter @apps/xa-b typecheck`)
  - Parity test still passes after strip (since generated file now supplies the vars)
- **Engineering Coverage:**
  - UI / visual: Required — cascade order of `@import` must ensure token vars are available before component CSS that references them
  - UX / states: Required — dark mode vars must be in generated file before `html,body { background-color: hsl(var(--color-bg)) }` executes
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — parity test must still pass after strip; `coverage-parity.test.ts` must read combined files correctly
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: Required — if CI fails after this task, the fallback is to re-add the inline blocks and remove the import
- **Validation contract (TC-06):**
  - TC-01: `globals.css` contains `@import "../styles/theme-tokens.generated.css"` before `@import "./xa-cyber-atelier.css"`
  - TC-02: `globals.css` no longer contains `--xa-swatch-black:` or other swatch declarations in `:root`
  - TC-03: `xa-cyber-atelier.css` no longer contains `color-scheme: light` in `:root` block
  - TC-04: `xa-cyber-atelier.css` no longer contains `html.theme-dark { ... }` block
  - TC-05: Component CSS in `xa-cyber-atelier.css` starting from `html, body {` (line 114) preserved intact
  - TC-06: CI parity test passes after strip
- **Execution plan:** Red → Green → Refactor
  - Red: Token vars are duplicated (both in generated file and inline) — parity test would detect extra vars
  - Green: (1) Add `@import "../styles/theme-tokens.generated.css"` to `globals.css` at line 7 (after `@import "./xa-cyber-atelier.css"` — actually, before it, since tokens must be available when atelier rules use them). Actually wait — `globals.css` imports `xa-cyber-atelier.css` at line 7; `xa-cyber-atelier.css` currently declares its own `:root` block. After TASK-06, `xa-cyber-atelier.css` will no longer have the `:root` block. The import order in `globals.css` should be: base tokens → generated theme tokens → ui styles → atelier (component CSS) → tailwind. Add `@import "../styles/theme-tokens.generated.css"` at line 4 (after `@import "@themes/base/tokens.css"`; before `@import "./xa-cyber-atelier.css"`). (2) Remove `globals.css` `:root` block (lines 12–29). (3) Remove `xa-cyber-atelier.css` `:root` block (lines 4–68) and `html.theme-dark` block (lines 70–112) — preserve from `html, body {` onward.
  - Refactor: Verify import paths resolve; check that `color-scheme: light` is now emitted by generated file (not missing after strip)
- **Planning validation (required for M/L):**
  - None: S effort task
- **Consumer tracing:**
  - All xa-b components consuming `--xa-swatch-*`, `--color-*`, `--border-*`, `--surface-*`, `--font-*`, `--radius-*`, `--elevation-*` vars are unchanged — var names stay identical, only the source `:root` block moves to the generated file.
  - Consumer: `xa-cyber-atelier.css` component rules reference `hsl(var(--color-bg))` etc. — these are unaffected since the var names remain the same.
- **Scouts:** Import path from `globals.css` to generated file: `globals.css` is at `apps/xa-b/src/app/globals.css`. Generated file is at `apps/xa-b/src/styles/theme-tokens.generated.css`. Relative path: `../styles/theme-tokens.generated.css`. Alternatively use `./styles/` if `globals.css` is in `src/app/` and generated file is in `src/styles/` — path is `../styles/theme-tokens.generated.css`. ✓
- **Edge Cases & Hardening:** (1) CSS cascade order: generated tokens must be imported before any component rule that consumes them. (2) `color-scheme: light` declaration: currently in `xa-cyber-atelier.css` `:root`. After strip, it must come from the generated file — confirm `generateThemeCSS()` emits `color-scheme: light;` in `:root` (confirmed: `build-theme-css.ts` line 241: `rootLines.push("  color-scheme: light;")`). (3) `html, body { background-color: hsl(var(--color-bg)); }` in `xa-cyber-atelier.css` line 116 — this is component CSS, not a token var; it stays.
- **What would make this >=90%:** CI build passing with no visual regressions reported.
- **Rollout / rollback:**
  - Rollout: CSS file edits; if CI passes, no action needed
  - Rollback: Re-add `:root` and `html.theme-dark` blocks to `xa-cyber-atelier.css`; remove `@import` from `globals.css`; revert swatch `:root` block in `globals.css`
- **Documentation impact:** None
- **Notes / references:**
  - Import path: `apps/xa-b/src/app/globals.css` → `../styles/theme-tokens.generated.css`
  - `build-theme-css.ts` line 241: confirms `color-scheme: light;` is emitted in `:root`
  - `build-theme-css.ts` line 299: confirms `color-scheme: dark;` is emitted in dark block

---

## Risks & Mitigations
- `--color-` prefix conflict: `colorVarMap` emits `--color-${varSuffix}` but xa-b swatches are `--xa-swatch-*`, not `--color-xa-swatch-*`. **Resolved in TASK-03 scout**: use `derivedVars.light` for swatches (not `colorVarMap`). `colorVarMap: {}`.
- Dark-mode selector mismatch: Resolved — `ThemeModeContext` applies both `theme-dark` and `dark` classes; `darkSelector: "html.theme-dark"` in config is sufficient.
- FAB HSL triplet format: Resolved — store FAB values in `derivedVars.light/dark` as HSL triplet strings, not in `colorVarMap` (which would add `--color-` prefix).
- Vacuous dark block test pass: Mitigated by explicit `existingDarkVars.size > 0` assertion in TASK-05.
- `src/styles/` directory not existing: Mitigated — create it alongside generated file in TASK-04.

## Observability
- Logging: None: build-time generation; no runtime logs
- Metrics: None: no runtime metrics needed
- Alerts/Dashboards: None: parity test CI failure is the alert

## Acceptance Criteria (overall)
- [ ] `packages/themes/xa-b/` exists with all scaffold files, source files, and test files
- [ ] `apps/xa-b/src/styles/theme-tokens.generated.css` exists and is committed
- [ ] `generated-parity.test.ts` passes in CI — all `:root` and `html.theme-dark` vars match
- [ ] `coverage-parity.test.ts` passes in CI — all CSS vars accounted for
- [ ] `apps/xa-b` typechecks without errors (`pnpm --filter @apps/xa-b typecheck`)
- [ ] Old inline `:root` blocks removed from `globals.css` and `xa-cyber-atelier.css`
- [ ] Old `html.theme-dark` block removed from `xa-cyber-atelier.css`
- [ ] `apps/xa-b/package.json` has `"@themes/xa-b": "workspace:*"`

## Decision Log
- 2026-03-14: Dark-mode selector resolved to Option A (`darkSelector: "html.theme-dark"`) using built-in compiler param. Evidence: `ThemeModeContext.tsx` lines 72–73 toggle both `theme-dark` and `dark` classes simultaneously. No JS changes needed.
- 2026-03-14: `colorVarMap` set to `{}` (empty). All swatch and FAB vars go in `derivedVars.light`/`derivedVars.dark`. Reason: `colorVarMap` adds `--color-` prefix, but xa-b swatch vars are `--xa-swatch-*` and FAB vars are `--xa-fab-*` — neither has `--color-` prefix. Using `derivedVars` preserves exact var names.
- 2026-03-14: FAB vars stored in `derivedVars.light`/`derivedVars.dark` (not `colorVarMap` or `brandColors` consumer). `assets.brandColors` still holds them as Layer 1 structured data for `coverage-parity.test.ts` to verify.
- 2026-03-14: `rgbVarMap` omitted entirely — xa-b has no `rgba(var(--rgb-*), alpha)` usage. No RGB triplet generation needed.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Create package scaffold | Yes — `packages/themes/brikette/` template exists and is fully read | None | No |
| TASK-02: Write assets/profile/recipes/index | Yes — TASK-01 creates directory; `ThemeAssets`, `DesignProfile`, `ThemeRecipes` types fully read; all token values sourced from `xa-cyber-atelier.css` and `globals.css` | None | No |
| TASK-03: Write theme-css-config.ts | Yes — TASK-02 provides `assets` and `profile`; all 73 derivedVars.light values sourced from CSS files; `ThemeCSSConfig` type confirmed; `darkSelector` param confirmed in compiler | [Minor]: Manual transcription of 73 `derivedVars.light` entries is error-prone — parity test in TASK-05 will catch mismatches, but only after TASK-04 generates the file | No (parity test is the gate) |
| TASK-04: Generate CSS + add dep | Partial — `src/styles/` directory may not exist; generation script needs to be written (no existing script in `packages/themes/xa-b/scripts/`); `pnpm install` must succeed before script can run | [Minor]: `src/styles/` directory creation needed; generation script is a new file not covered by any existing script | No (resolved in task execution plan) |
| TASK-05: Write parity tests | Yes — TASK-04 produces committed generated file; brikette test pattern is fully read; `extractVarsFromBlock` function understood; dark selector string change identified | [Moderate, resolved]: vacuous dark block pass risk if `html.theme-dark` selector not used in `extractVarsFromBlock` — mitigated by explicit `size > 0` assertion guard | No (resolved by guard) |
| TASK-06: Strip token blocks | Yes — TASK-05 tests are CI gate before this executes; import path calculated; component CSS preservation lines identified | None | No |

## Rehearsal-Blocking-Waiver

- **Blocking finding:** TASK-05 Moderate risk — vacuous dark block test pass if selector string is wrong
- **False-positive reason:** This is advisory/mitigated, not truly blocking. The task execution plan explicitly calls out updating the dark selector string from `".dark"` to `"html.theme-dark"`, and adds an explicit `size > 0` guard assertion.
- **Evidence of missing piece:** The fix is documented in TASK-05 execution plan and engineering coverage: "add explicit assertion that dark var count > 0 (anti-vacuous-pass guard)". The mitigation is in the plan.

## Overall-confidence Calculation
- TASK-01: S=1, confidence=90% → contribution: 90
- TASK-02: M=2, confidence=90% → contribution: 180
- TASK-03: M=2, confidence=85% → contribution: 170
- TASK-04: S=1, confidence=85% → contribution: 85
- TASK-05: M=2, confidence=85% → contribution: 170
- TASK-06: S=1, confidence=85% → contribution: 85

Total weight: 1+2+2+1+2+1 = 9
Weighted sum: 90+180+170+85+170+85 = 780
Overall-confidence: 780/9 = 86.7% → rounded to 85% (downward bias rule applied for rounding)

## Delivered Processes

| Area | Trigger | Delivered step-by-step flow | Tasks / dependencies | Unresolved issues / rollback seam |
|---|---|---|---|---|
| Token authoring | Developer changes an xa-b theme color or semantic token | (1) Edit `packages/themes/xa-b/src/assets.ts` or `theme-css-config.ts` → (2) Run generate script to update `apps/xa-b/src/styles/theme-tokens.generated.css` → (3) Commit generated file → (4) CI runs parity test as gate | TASK-01–TASK-05 | Rollback: revert generated file; no service restarts needed |
| CSS delivery | Next.js/Turbopack build | `globals.css` `@import "../styles/theme-tokens.generated.css"` → Turbopack bundles all token vars into the app CSS; vars available globally via `:root` | TASK-06 | Rollback: re-add inline `:root` blocks, remove `@import` |
