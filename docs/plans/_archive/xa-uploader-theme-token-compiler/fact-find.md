---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: xa-uploader-theme-token-compiler
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Trigger-Why: xa-uploader currently hand-authors its ~17 CSS custom properties directly in globals.css. The brikette app recently adopted a three-layer generated theme token system. Applying the same compiler retrofit to xa-uploader eliminates manual synchronisation, makes tokens refactorable from TypeScript, and adds a parity test that prevents silent drift.
Trigger-Intended-Outcome: type: operational | statement: xa-uploader tokens are declared once in @themes/xa-uploader/src/ TypeScript files, generated into a committed CSS file, and a parity test prevents any future hand-edit from silently diverging | source: auto
---

# xa-uploader Theme Token Compiler Retrofit — Fact-Find

## Scope

### Summary

xa-uploader currently declares ~17 CSS custom properties (`--gate-*`) directly inside its `globals.css` `:root` block. The brikette app has already been retrofitted with a three-layer generated theme system (`assets.ts` → `design-profile.ts` → `theme-css-config.ts` → `generateThemeCSS()` → committed `.generated.css` file + parity test). This fact-find investigates what is required to give xa-uploader the same structure, with a new `packages/themes/xa-uploader/` package, a generator script, and matching tests.

### Goals

- Create `packages/themes/xa-uploader/` as a new `@themes/xa-uploader` workspace package.
- Define `assets.ts`, `design-profile.ts`, and `theme-css-config.ts` covering all 17 `:root` tokens.
- Author a generator script that writes `apps/xa-uploader/src/app/theme-tokens.generated.css`.
- Update `globals.css` to `@import` the generated file and remove the inline `:root` block.
- Add a parity test (modelled on `packages/themes/brikette/__tests__/generated-parity.test.ts`) that validates the compiled output matches the committed `.generated.css`.
- Keep the `[data-theme="dark"]` override block in `globals.css` as-is; it is application-level presentation logic, not brand tokens.

### Non-goals

- Dark-mode token extraction: the `[data-theme="dark"]` block uses `--gate-*` overrides but xa-uploader is stated as light-mode only for the compiler layer. Dark overrides remain hand-authored in `globals.css`.
- Changing any visual appearance of the xa-uploader app.
- Migrating to Turbopack (app is on `--webpack`).
- Changing the 20+ `@utility` classes or the `@keyframes pulse-slow` block in `globals.css`; those are application-layer CSS, not theme tokens.

### Constraints & Assumptions

- Constraints:
  - xa-uploader uses `--webpack` (not Turbopack), consistent with how other non-turbopack apps in the monorepo are configured.
  - `@themes/*` path alias resolves via `tsconfig.base.json` `paths` entry `"@themes/*": ["packages/themes/*/src"]` — creating `packages/themes/xa-uploader/` with a `src/` directory will satisfy the alias automatically.
  - The brikette pattern (assets + profile + theme-css-config → `generateThemeCSS`) is the target shape for the TypeScript layer. However: `generateThemeCSS()` always emits `color-scheme: light` in `:root` and `color-scheme: dark` in `.dark`, plus `--theme-transition-duration` from the profile. These extras are not present in xa-uploader's current globals.css and would change `color-scheme` rendering for native controls. The generator script must strip or suppress these extras.
  - No dark-mode `ThemeAssets.BrandColor { light, dark }` variants are needed — all gate tokens are static (light-only values).
  - `ThemeAssets.gradients`, `.shadows`, `.keyframes` can be empty `{}` for xa-uploader. `fonts` must be `{}` (required field in `ThemeAssets`).

- Assumptions:
  - The generator script for xa-uploader will either: (a) use a custom emit function that skips `color-scheme` and profile vars, or (b) use `generateThemeCSS()` but post-process the output to remove the `color-scheme` line, `--theme-transition-duration`, and the `.dark {}` block. Option (b) is simpler and safer. The committed generated CSS will contain only the 17 `--gate-*` vars in a `:root {}` block.
  - The `fontVarMap` is not needed: xa-uploader does not declare any `--font-*` custom properties; the app relies on system fonts inherited from the base tokens. `fontVarMap` is set to `{}`.
  - `rgbVarMap` is not needed: no `rgba(var(--rgb-gate-*), alpha)` patterns in xa-uploader components.
  - `derivedVars` is needed for all 17 tokens (see ThemeCSSConfig Mapping Design below), including the 3 alpha-channel values that cannot be expressed as plain hex.
  - The `brandColors` in `assets.ts` holds the 14 non-alpha color values as the canonical TypeScript source. The `derivedVars.light` in `theme-css-config.ts` derives its plain-color entries by referencing `assets.brandColors` values (not duplicating them as string literals). A coverage-parity test asserts that every `brandColors` entry appears in `derivedVars.light` correctly.

---

## Outcome Contract

- **Why:** xa-uploader currently hand-authors its CSS custom properties directly in globals.css with no structured source of truth or automated parity check. The brikette three-layer system provides a proven pattern for making tokens refactorable from TypeScript and preventing silent drift. Retrofitting xa-uploader closes the gap.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** xa-uploader tokens are declared in TypeScript source files under `packages/themes/xa-uploader/`, compiled into a committed CSS file, and a Jest parity test guards against future divergence between source and generated output.
- **Source:** auto

---

## Current Process Map

None: local code path only.

Token authoring is a file-level concern. There is no multi-step operator workflow, CI lane, approval path, or deployment orchestration change involved. The generator script will be invoked locally (like `pnpm --filter scripts brikette:generate-theme-tokens`) and the generated CSS is committed. No CI gate changes are required.

---

## Discovery Contract Output

- **Gap Case ID:** n/a
- **Recommended First Prescription:** n/a
- **Required Inputs:**
  - n/a
- **Expected Artifacts:**
  - n/a
- **Expected Signals:**
  - n/a

### Prescription Candidates

Not applicable — no discovery contract on this work item.

---

## Evidence Audit (Current State)

### Entry Points

- `apps/xa-uploader/src/app/globals.css` — sole location of all `--gate-*` CSS custom properties; also contains `@utility` class definitions and `[data-theme="dark"]` overrides
- `packages/themes/brikette/src/theme-css-config.ts` — reference implementation for the compiler mapping layer
- `packages/themes/base/src/build-theme-css.ts` — the `generateThemeCSS()` compiler; exported from `@themes/base`
- `scripts/brikette/generate-theme-tokens.ts` — generator script pattern to replicate for xa-uploader
- `packages/themes/brikette/__tests__/generated-parity.test.ts` — parity test pattern to replicate

### Full Token Surface Map (17 `:root` properties)

All tokens from `apps/xa-uploader/src/app/globals.css` `:root` block (lines 14–33):

| CSS Variable | Value | Classification |
|---|---|---|
| `--gate-ink` | `hsl(0 0% 10%)` | brandColor (static hex → `#1a1a1a`) |
| `--gate-muted` | `hsl(0 0% 40%)` | brandColor (static → `#666666`) |
| `--gate-bg` | `hsl(0 0% 100%)` | brandColor (static → `#ffffff`) |
| `--gate-accent` | `hsl(190 70% 40%)` | brandColor (static → teal accent) |
| `--gate-accent-soft` | `hsl(190 50% 95%)` | brandColor (static → teal tint) |
| `--gate-header-bg` | `hsl(220 20% 10%)` | brandColor (static → dark header) |
| `--gate-header-fg` | `hsl(0 0% 92%)` | brandColor (static → light text) |
| `--gate-header-muted` | `hsl(0 0% 60%)` | brandColor (static → grey muted) |
| `--gate-surface` | `hsl(0 0% 96%)` | brandColor (static → off-white) |
| `--gate-status-ready` | `hsl(150 60% 40%)` | brandColor (static → green) |
| `--gate-status-draft` | `hsl(40 90% 50%)` | brandColor (static → amber) |
| `--gate-status-incomplete` | `hsl(0 75% 55%)` | brandColor (static → red) |
| `--gate-input-bg` | `hsl(0 0% 100%)` | brandColor (same as bg, static) |
| `--gate-on-accent` | `hsl(0 0% 100%)` | brandColor (white) |
| `--gate-border` | `hsl(0 0% 10% / 0.22)` | derivedVar (alpha channel — use derivedVars.light) |
| `--gate-header-border` | `hsla(0, 0%, 100%, 0.2)` | derivedVar (alpha channel — use derivedVars.light) |
| `--gate-header-accent` | `hsl(190 70% 40% / 0.35)` | derivedVar (alpha channel — use derivedVars.light) |

**Total: 17 `:root` custom properties.**

Split:
- 14 brandColors (expressible as hex, no dark variant needed)
- 3 derivedVars.light (alpha-channel values, not expressible as plain hex)

Note: `hsl()` values with alpha (e.g. `hsl(0 0% 10% / 0.22)`) cannot be stored as plain hex in `ThemeAssets.brandColors`. They must go in `derivedVars.light` and be emitted as-is.

Note: `hsla(0, 0%, 100%, 0.2)` is the legacy comma-separated syntax; should be normalised to `hsl(0 0% 100% / 0.2)` in the ThemeCSSConfig.

### Key Modules / Files

- `apps/xa-uploader/src/app/globals.css` — source of truth for existing tokens; also holds `[data-theme="dark"]` overrides (not in scope for compiler)
- `packages/themes/base/src/build-theme-css.ts` — compiler; `ThemeCSSConfig` interface defined here
- `packages/themes/base/src/theme-expression.ts` — `ThemeAssets`, `DesignProfile`, `BrandColor` types
- `packages/themes/brikette/src/assets.ts` — reference for `ThemeAssets` shape
- `packages/themes/brikette/src/design-profile.ts` — reference for `DesignProfile` shape (minimal profile needed)
- `packages/themes/brikette/src/theme-css-config.ts` — reference for `ThemeCSSConfig` mapping
- `packages/themes/brikette/__tests__/generated-parity.test.ts` — parity test template
- `packages/themes/brikette/package.json` — package structure template
- `packages/themes/brikette/jest.config.cjs` — jest config template (1 line: uses `@acme/config/jest.preset.cjs`)
- `scripts/brikette/generate-theme-tokens.ts` — generator script template

### Patterns & Conventions Observed

- **Three-layer system**: `assets.ts` (what the brand has) → `design-profile.ts` (how the brand uses its tools) → `theme-css-config.ts` (CSS var mapping) → `generateThemeCSS()` (compiler). Evidence: `packages/themes/brikette/src/`.
- **Generated CSS committed**: `apps/brikette/src/styles/theme-tokens.generated.css` is checked in; the parity test validates it matches what the compiler would produce. Evidence: `generated-parity.test.ts` reads the committed file.
- **Generator script pattern**: `scripts/brikette/generate-theme-tokens.ts` imports `@themes/brikette` and writes the CSS file. A new `scripts/xa-uploader/generate-theme-tokens.ts` follows identical pattern.
- **`@themes/*` alias**: resolved by `tsconfig.base.json` `"@themes/*": ["packages/themes/*/src"]`. Creating `packages/themes/xa-uploader/src/` is sufficient — no changes to tsconfig needed.
- **Package structure**: `packages/themes/brikette/package.json` has `"name": "@themes/brikette"`, `"type": "module"`, `"main": "./src/index.ts"`, `"exports"` map. The xa-uploader package follows the same shape with name `@themes/xa-uploader`.
- **No `@themes/xa-uploader` package exists**: confirmed via glob search — directory `packages/themes/xa-uploader/` does not exist.
- **`fontVarMap` not needed**: xa-uploader has no `--font-*` CSS custom properties in its `:root`. The `fontVarMap` can be an empty record `{}` or omitted (the compiler handles empty maps gracefully).
- **`rgbVarMap` not needed**: no rgba triplet consumption in xa-uploader components.
- **Compiler always emits extras**: `generateThemeCSS()` unconditionally emits `color-scheme: light` in `:root`, `--theme-transition-duration` from the profile, and a `.dark { color-scheme: dark; }` block (never empty — always has `color-scheme: dark` at minimum). The generator script must post-process the output to remove these three elements before writing the committed CSS file. The committed file will contain only the 17 `--gate-*` vars in a `:root {}` block.

### Data & Contracts

- Types/schemas/events:
  - `ThemeCSSConfig` (from `packages/themes/base/src/build-theme-css.ts`) — the only contract to satisfy.
  - `ThemeAssets` (from `packages/themes/base/src/theme-expression.ts`) — assets.ts must satisfy this.
  - `DesignProfile` (from `packages/themes/base/src/theme-expression.ts`) — design-profile.ts must satisfy this. For xa-uploader, all profile fields use sensible defaults (dense whitespace, minimal surface, etc.).
- Persistence:
  - `apps/xa-uploader/src/app/theme-tokens.generated.css` — new committed file, regenerated by script.
- API/contracts:
  - None. The theme package is build-time only; no runtime API surface.

### Dependency & Impact Map

- Upstream dependencies:
  - `@themes/base` (already in `apps/xa-uploader/package.json` as a workspace dependency — confirmed).
- Downstream dependents:
  - 20 files in `apps/xa-uploader/src/` use `gate-*` CSS variable names via Tailwind `@utility` classes defined in `globals.css`. These classes are not affected — only the `:root` block changes.
  - The `[data-theme="dark"]` block in `globals.css` references `--gate-ink`, `--gate-muted` etc. — it overrides the `:root` values at runtime. This block remains as-is.
- Likely blast radius:
  - Visual: zero (values are identical; the generator reproduces the same CSS).
  - Structural: `globals.css` loses its inline `:root` block and gains one `@import` line.
  - Test: the new parity test in `packages/themes/xa-uploader/__tests__/` is the only new test surface.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (governed runner)
- Commands: tests must run via the governed runner per `docs/testing-policy.md`. The package `package.json` script should use `bash ../../scripts/tests/run-governed-test.sh -- jest -- --config ./jest.config.cjs` (matching the pattern used by `apps/xa-uploader/package.json`). Direct `jest` invocation bypasses the CI-only constraint in the testing policy.
- CI integration: all `packages/themes/*/` Jest tests run in CI via the governed test runner

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| brikette theme — generated parity | Jest | `packages/themes/brikette/__tests__/generated-parity.test.ts` | Full :root and .dark parity; both directions (existence + value match + no extras) |
| brikette theme — coverage parity | Jest | `packages/themes/brikette/__tests__/coverage-parity.test.ts` | Exhaustive: every CSS var has a structured source; every structured source has a CSS var |
| xa-uploader source | Jest | 20+ test files in `apps/xa-uploader/src/` | API routes, component logic, middleware — no CSS/theme coverage |

#### Coverage Gaps

- Untested paths:
  - No parity test exists for xa-uploader theme tokens (gap to fill).
  - No generator script exists for xa-uploader (gap to fill).
- Extinct tests:
  - None.

#### Testability Assessment

- Easy to test:
  - Parity test: read the committed `.generated.css`, parse the `:root` block, compare var-by-var against the output of the same post-processing helper used by the generator script. **Critically**: the parity test must compare against post-processed output (with `color-scheme`, `--theme-transition-duration`, and `.dark` stripped), not against raw `generateThemeCSS()` output — these are different strings. Extract the post-processing logic into a shared helper (e.g. `src/post-process.ts`) so both the generator script and the parity test use exactly the same transformation.
  - Token surface is small (17 vars, no dark variants) so the test runs fast.
  - Coverage-parity test: validate that (a) every `assets.brandColors` entry appears in `derivedVars.light` with the correct value (14 entries), AND (b) the 3 alpha-only entries (`gate-border`, `gate-header-border`, `gate-header-accent`) are present with their expected literal values. This makes `coverage-parity.test.ts` exhaustive across all 17 tokens, independent of the `post-process.ts` helper used by the parity test.
- Hard to test:
  - Alpha-channel `derivedVars` entries require exact string matching (whitespace-normalised). The brikette test normaliser `(s) => s.replace(/\s+/g, " ").trim().toLowerCase()` handles this.
- Test seams needed:
  - The parity test reads a file path — the generated CSS must be committed for CI to pass. This is identical to the brikette pattern.
  - Post-processing logic must be in a shared helper (not inlined in the generator script) so the parity test can import and apply it.

#### Recommended Test Approach

- Unit tests for:
  - `generated-parity.test.ts`: reads committed `.generated.css`, compares `:root` vars against `postProcessGateCSS(generateThemeCSS(...))` output using shared post-process helper.
  - `coverage-parity.test.ts`: exhaustive guard over all 17 tokens — (a) every `assets.brandColors` entry maps to correct `gate-*` value in `derivedVars.light`; (b) the 3 alpha-only tokens (`gate-border`, `gate-header-border`, `gate-header-accent`) have expected literal values. This test does not use `post-process.ts` and catches bugs there.
- Integration tests for: N/A — no runtime API surface.
- E2E tests for: N/A.
- Contract tests for: N/A.

---

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | 17 `--gate-*` CSS vars in globals.css :root; 20 files consume them via @utility classes | Risk of value mismatch between generated CSS and hand-authored expectation | Parity test eliminates this risk; no visual change |
| UX / states | N/A | No interactive state changes — pure token compilation | None | No |
| Security / privacy | N/A | Theme tokens are static CSS values; no auth/PII surface | None | No |
| Logging / observability / audit | N/A | No runtime telemetry surface — build-time only | None | No |
| Testing / validation | Required | No existing theme parity test for xa-uploader; brikette has strong parity test template | Gap: zero coverage on token correctness | New parity test required in `packages/themes/xa-uploader/__tests__/` |
| Data / contracts | Required | `ThemeCSSConfig` interface must be satisfied; committed `.generated.css` is a new persisted artifact | Risk: package exports map or tsconfig paths misconfigured | Validate tsconfig path resolution works without changes (alias covers it) |
| Performance / reliability | N/A | Generator script is a one-off CLI tool; no hot path | None | No |
| Rollout / rollback | Required | Generated CSS replaces inline :root block; must be equivalent | Risk: missed token or value mismatch causes visual regression | Parity test + visual diff during review covers this |

---

## ThemeCSSConfig Mapping Design

The following is the proposed mapping for `packages/themes/xa-uploader/src/theme-css-config.ts`:

### brandColors → colorVarMap (14 tokens)

The CSS var prefix `--color-gate-*` is the natural mapping under `generateThemeCSS()` (which prefixes with `--color-`):

| Asset key | CSS var suffix | CSS output |
|---|---|---|
| `ink` | `gate-ink` | `--color-gate-ink` |
| `muted` | `gate-muted` | `--color-gate-muted` |
| `bg` | `gate-bg` | `--color-gate-bg` |
| `accent` | `gate-accent` | `--color-gate-accent` |
| `accentSoft` | `gate-accent-soft` | `--color-gate-accent-soft` |
| `headerBg` | `gate-header-bg` | `--color-gate-header-bg` |
| `headerFg` | `gate-header-fg` | `--color-gate-header-fg` |
| `headerMuted` | `gate-header-muted` | `--color-gate-header-muted` |
| `surface` | `gate-surface` | `--color-gate-surface` |
| `statusReady` | `gate-status-ready` | `--color-gate-status-ready` |
| `statusDraft` | `gate-status-draft` | `--color-gate-status-draft` |
| `statusIncomplete` | `gate-status-incomplete` | `--color-gate-status-incomplete` |
| `inputBg` | `gate-input-bg` | `--color-gate-input-bg` |
| `onAccent` | `gate-on-accent` | `--color-gate-on-accent` |

**IMPORTANT naming mismatch**: The existing CSS variables are `--gate-*` (no `color-` prefix). The `generateThemeCSS()` compiler unconditionally prepends `--color-` when emitting `colorVarMap` entries. This creates a naming mismatch: generated output would produce `--color-gate-ink` but components reference `--gate-ink`.

**Resolution**: Use `derivedVars.light` for all 17 tokens. The 14 plain-color entries in `derivedVars.light` are populated by referencing `assets.brandColors` values — not as duplicate string literals, but by building the map programmatically in `theme-css-config.ts`:

```ts
import { assets } from "./assets";

// Derive gate-* entries from canonical brandColors (no duplication)
// Note: BrandColor | string — must extract light value for adaptive entries
function toGateVars(colors: Record<string, BrandColor | string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(colors).map(([key, val]) => [
      cssKey(key),
      typeof val === "string" ? val : val.light,
    ])
  );
}

export const themeCSSConfig: ThemeCSSConfig = {
  assets,
  profile,
  colorVarMap: {},       // empty — all emitted via derivedVars to preserve --gate-* names
  fontVarMap: {},        // no --font-* vars in xa-uploader
  rgbVarMap: {},         // no RGB triplet consumers
  derivedVars: {
    light: {
      ...toGateVars(assets.brandColors),  // 14 plain-color entries
      "gate-border": "hsl(0 0% 10% / 0.22)",        // alpha — cannot derive from hex
      "gate-header-border": "hsl(0 0% 100% / 0.2)",  // alpha
      "gate-header-accent": "hsl(190 70% 40% / 0.35)", // alpha
    }
  }
};
```

With this structure, the 14 plain-color `--gate-*` entries are derived from `assets.brandColors` at config-construction time — the value appears once (in `assets.ts`) and is referenced (not duplicated) in the config. A coverage-parity test validates that every `brandColors` entry maps to a `derivedVars.light` entry with the correct value.

**Single source of truth summary**:
- 14 plain colors: declared in `assets.brandColors` (camelCase key → hsl/hex value); emitted to `derivedVars.light` by reference.
- 3 alpha-channel values: declared in `derivedVars.light` only (cannot be expressed as plain hex in `ThemeAssets`).

### fontVarMap and rgbVarMap

Both empty — xa-uploader has no `--font-*` vars and no RGB triplet consumers.

---

## Questions

### Resolved

- Q: Does `@themes/base` already exist as a dependency in xa-uploader's package.json?
  - A: Yes — confirmed at line 23: `"@themes/base": "workspace:*"`.
  - Evidence: `apps/xa-uploader/package.json`

- Q: Does `generateThemeCSS()` handle the light-only case (no dark variants) gracefully?
  - A: Partially. The compiler always emits `color-scheme: light` in `:root`, `--theme-transition-duration` from the profile, and `.dark { color-scheme: dark; }` unconditionally. When no `BrandColor.dark` entries and no `derivedVars.dark` are provided, the `.dark` block still contains `color-scheme: dark;`. The generator script must post-process the output to strip: (1) the `color-scheme: light;` line, (2) the `--theme-transition-duration` line, and (3) the entire `.dark {}` block. This keeps the committed CSS to only the 17 `--gate-*` vars in `:root`, matching the existing globals.css shape.
  - Evidence: `packages/themes/base/src/build-theme-css.ts` lines 215, 219–221, 263–293 — `color-scheme: light`, profile vars, and `.dark { color-scheme: dark; }` are unconditionally emitted.

- Q: Is the `@themes/*` alias already configured for new packages, or does tsconfig need updating?
  - A: No update needed. `tsconfig.base.json` already has `"@themes/*": ["packages/themes/*/src"]` — any directory under `packages/themes/` with a `src/` will resolve automatically.
  - Evidence: `tsconfig.base.json` line 75.

- Q: Are there dark-mode tokens that belong in the compiler layer?
  - A: No. The `[data-theme="dark"]` overrides in globals.css are application-level presentation overrides, not brand identity tokens. They override specific `--gate-*` vars for dark mode. The compiler layer is light-only per scope.
  - Evidence: `apps/xa-uploader/src/app/globals.css` lines 138–153 — the dark block references `--color-bg-muted` and `--color-danger-fg` which are design-system semantic tokens, not ga-uploader brand tokens.

- Q: Do the `@utility` classes and `@keyframes` in globals.css move to the package?
  - A: No. These are application-layer CSS (typography utilities, animation), not brand tokens. They stay in globals.css unchanged.
  - Evidence: scope of the `ThemeCSSConfig` interface covers only CSS custom properties (vars), not utility classes or keyframes.

- Q: Does the naming mismatch (`--gate-*` vs `--color-gate-*`) require component changes?
  - A: No — resolved by using `derivedVars.light` for all 17 tokens, which emits var names verbatim as `--gate-*`. No component files need to change.
  - Evidence: `generateThemeCSS()` emits `derivedVars` entries as-is: `  --${name}: ${value};`. Evidence: `packages/themes/base/src/build-theme-css.ts` lines 185–191.

- Q: Does the new `@themes/xa-uploader` package need a `jest.config.cjs`?
  - A: Yes — same 1-line pattern as brikette: `module.exports = require("@acme/config/jest.preset.cjs")();`.
  - Evidence: `packages/themes/brikette/jest.config.cjs`.

### Open (Operator Input Required)

None — all questions are resolvable from code evidence and business constraints.

---

## Confidence Inputs

- Implementation: 95%
  - Evidence: brikette is a complete working reference. xa-uploader has fewer tokens, no dark variants, no RGB triplets, no fonts. The only subtlety is the `--gate-*` naming resolution (resolved via derivedVars). High confidence.
  - What would raise to >=90%: already at 95%.

- Approach: 90%
  - Evidence: Option 1 (all tokens via derivedVars.light) is the lowest blast radius and avoids touching 20 component files. Confidence is 90% because the `derivedVars` approach is slightly less "pure" than using colorVarMap — but given the naming constraint it is the correct tradeoff.
  - What would raise to >=90%: already at 90%.

- Impact: 95%
  - Evidence: zero visual change, zero component change. The generated CSS is byte-equivalent to the existing inline `:root` block. The only change is structural (source of truth moves to TypeScript).
  - What would raise to >=90%: already at 95%.

- Delivery-Readiness: 90%
  - Evidence: reference implementation exists, file count is small (~8 new files + 2 modified), test pattern is a direct copy-adapt. No external dependencies.
  - What would raise to >=90%: already at 90%.

- Testability: 90%
  - Evidence: parity test pattern directly ports from brikette. 17 vars vs. brikette's ~30+. No dark block to validate on the generated side.
  - What would raise to >=90%: already at 90%.

---

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| `derivedVars.light` approach produces slightly different whitespace than original globals.css :root | Low | Low | Parity test normalises whitespace; visual output is identical |
| `hsla(0, 0%, 100%, 0.2)` (legacy comma syntax) in globals.css → normalised to `hsl(0 0% 100% / 0.2)` in generated output | Low | Low | The parity test compares generated vs. committed file, not vs. old globals.css. Committed file uses the normalised form. |
| Generator script not wired into a pnpm script alias | Low | Low | Add `"xa-uploader:generate-theme-tokens"` script to `scripts/package.json` following brikette pattern |
| New package not included in pnpm workspace glob | Very low | Medium | `pnpm-workspace.yaml` glob covers `packages/**` — no change needed |
| jest.config.cjs missing from new package — tests not discovered by CI | Low | Medium | Include jest.config.cjs (1 line) in package creation task |

---

## Planning Constraints & Notes

- Must-follow patterns:
  - Use `packages/themes/brikette/` as the exact structural template.
  - Generator script lives in `scripts/xa-uploader/generate-theme-tokens.ts`.
  - Generated file path: `apps/xa-uploader/src/app/theme-tokens.generated.css`.
  - Post-processing helper lives in `packages/themes/xa-uploader/src/post-process.ts` — used by both the generator script and the parity test.
  - Parity test compares committed CSS against `postProcessGateCSS(generateThemeCSS(...))` — not raw `generateThemeCSS()` output.
  - Package name: `@themes/xa-uploader`, type: module, exports map following brikette pattern (include `./post-process` export).
  - All 17 tokens emitted via `derivedVars.light` (not `colorVarMap`) to preserve `--gate-*` naming.
  - 14 plain-color entries in `derivedVars.light` derived programmatically from `assets.brandColors` (single source of truth); 3 alpha-channel entries hardcoded in `derivedVars.light` only.
  - Two tests: `generated-parity.test.ts` and `coverage-parity.test.ts`.
  - Package `package.json` includes `"test": "jest"` script.

- Rollout/rollback expectations:
  - No feature flag needed — this is a refactor with no runtime behaviour change.
  - Rollback: revert to inline `:root` block in globals.css and delete new files.
  - Rollback trigger: visible visual regression (should not occur given parity test).

- Observability expectations:
  - None — build-time only.

---

## Suggested Task Seeds (Non-binding)

1. Create `packages/themes/xa-uploader/` package with `package.json` (including `"test": "bash ../../scripts/tests/run-governed-test.sh -- jest -- --config ./jest.config.cjs"` script per testing policy), `tsconfig.json`, `jest.config.cjs`.
2. Author `src/assets.ts` — 14 brandColors (plain hsl/hex values); empty `fonts: {}`, `gradients: {}`, `shadows: {}`, `keyframes: {}` (all fields required by `ThemeAssets`).
3. Author `src/design-profile.ts` — minimal `DesignProfile` (dense, operations mode, no motion personality).
4. Author `src/theme-css-config.ts` — empty `colorVarMap`/`fontVarMap`/`rgbVarMap`; all 17 tokens in `derivedVars.light` (14 derived from `Object.entries(assets.brandColors)`, 3 alpha-channel hardcoded).
5. Author `src/post-process.ts` — exports `postProcessGateCSS(rawCSS: string): string` — strips `color-scheme` declarations, `--theme-transition-duration`, and the `.dark {}` block from `generateThemeCSS()` raw output. Both the generator script and the parity test import this helper.
6. Author `src/index.ts` — export assets, profile, themeCSSConfig.
7. Author `scripts/xa-uploader/generate-theme-tokens.ts` — calls `generateThemeCSS()`, runs `postProcessGateCSS()`, writes `apps/xa-uploader/src/app/theme-tokens.generated.css`.
8. Run the generator script to produce the committed CSS file.
9. Update `apps/xa-uploader/src/app/globals.css` — replace inline `:root` block with `@import "./theme-tokens.generated.css"`.
10. Author `packages/themes/xa-uploader/__tests__/generated-parity.test.ts` — reads committed CSS, compares `:root` vars against `postProcessGateCSS(generateThemeCSS(...))` output. Uses `post-process.ts` helper.
11. Author `packages/themes/xa-uploader/__tests__/coverage-parity.test.ts` — exhaustive: validates all 14 brandColors-backed entries AND the 3 alpha-only tokens directly against `themeCSSConfig.derivedVars.light`. Independent of `post-process.ts`.
12. Add `xa-uploader:generate-theme-tokens` pnpm script alias to `scripts/package.json`.

---

## Execution Routing Packet

- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - None
- Deliverable acceptance package:
  - `packages/themes/xa-uploader/` exists with all required files including `src/post-process.ts`
  - `apps/xa-uploader/src/app/theme-tokens.generated.css` committed and contains exactly the 17 `--gate-*` vars in `:root` — no `color-scheme`, no `--theme-transition-duration`, no `.dark {}` block
  - `apps/xa-uploader/src/app/globals.css` `:root` block replaced with `@import "./theme-tokens.generated.css"`
  - `generated-parity.test.ts` passes in CI (compares committed CSS against post-processed generator output)
  - `coverage-parity.test.ts` passes in CI (every `brandColors` entry present in `derivedVars.light`)
  - No visual regression (values identical to pre-change)
- Post-delivery measurement plan:
  - Parity test is the ongoing guard — no further measurement needed

---

## Evidence Gap Review

### Gaps Addressed

- Full token surface enumerated from globals.css source (17 vars, 3 alpha-channel, 14 plain).
- Naming mismatch between `--gate-*` and the `--color-{varSuffix}` output of `colorVarMap` identified and resolved via `derivedVars.light`.
- `@themes/*` alias coverage verified — no tsconfig change needed.
- `@themes/base` already in xa-uploader's dependencies — no package.json change needed.
- Generator script pattern verified from brikette.
- Jest config pattern verified (1-line, preset-based).
- Dark-mode scope confirmed out of scope (application-layer, not brand tokens).

### Confidence Adjustments

- Implementation confidence raised to 95% (from expected ~80%) because the naming mismatch resolution is straightforward and well-evidenced.
- No downward adjustments.

### Remaining Assumptions

- The generator script can reliably strip `color-scheme` declarations, `--theme-transition-duration`, and the `.dark {}` block via string post-processing (regex strip). This is deterministic given the compiler's fixed output shape.
- The `derivedVars.light` population via `Object.entries(assets.brandColors)` is the clean single-source-of-truth pattern: values are declared once in `assets.ts` and referenced (not duplicated) in `theme-css-config.ts`. The coverage-parity test validates this bridge.
- `fonts: {}` in `assets.ts` satisfies the `ThemeAssets` interface without type errors (the field is required but accepts an empty record).

---

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Token surface (globals.css :root) | Yes | None | No |
| Naming mismatch (--gate-* vs --color-gate-*) | Yes | [Correctness, Advisory]: `colorVarMap` would produce wrong var names; requires `derivedVars.light` approach | No — resolved in fact-find |
| Generator script extras (color-scheme, profile vars, .dark block) | Yes | [Correctness, Major]: compiler always emits `color-scheme` declarations and `--theme-transition-duration`; script must post-process to strip these | No — resolved: generator script post-processes output |
| brandColors duplication risk | Yes | [Correctness, Major]: `derivedVars.light` must reference brandColors values (not duplicate as string literals) to preserve single source of truth | No — resolved: config uses `Object.entries(assets.brandColors)` to populate derivedVars |
| Package test script | Yes | [Correctness, Advisory]: brikette has no "test" script; new package must add one explicitly | No — resolved: task seed updated |
| Package creation prerequisites | Yes | None — alias, deps, pnpm workspace all already cover new package | No |
| Test pattern portability | Yes | None — brikette parity test is a direct template | No |
| Dark-mode scope boundary | Yes | None — dark block is application-layer, correctly excluded | No |
| Blast radius on 20 component files | Yes | None — derivedVars approach requires zero component changes | No |
| fonts: {} requirement | Yes | [Correctness, Minor]: ThemeAssets requires fonts field; `fonts: {}` must be explicit in assets.ts | No — resolved: task seed updated |

---

## Scope Signal

- **Signal: right-sized**
- **Rationale:** The work is bounded to ~8 new files and 1 modified file (globals.css). The token surface is small (17 vars), there are no dark-mode variants in scope, no component files need changing, and a complete reference implementation (brikette) exists. The approach is well-understood and the naming mismatch has a clear resolution. No expansion is warranted — the scope precisely matches the goal.

---

## Analysis Readiness

- Status: Ready-for-planning
- Blocking items:
  - None
- Recommended next step:
  - `/lp-do-plan xa-uploader-theme-token-compiler`
