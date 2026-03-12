---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-06
Last-updated: 2026-03-06
Feature-Slug: reception-theme-inline-cascade
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-theme-inline-cascade/plan.md
Dispatch-ID: IDEA-DISPATCH-20260306213000-1004
Trigger-Why:
Trigger-Intended-Outcome:
---

# Reception @theme inline Cascade — Fact-Find Brief

## Scope

### Summary

Tailwind v4's `@theme inline` modifier tells the framework that a CSS variable's value is already a valid CSS color — no further wrapping is needed. shadcn/ui v4 recommends it as the standard pattern. Reception currently uses `@theme {}` (without `inline`) and applies `hsl(var(--token))` wrappers inside the block for every semantic token. The shade token families (bar/POS product grid) take a different path: their values are stored as full `hsl(330 55% 66%)` literals in `tokens.css` and referenced with bare `var()` in `@theme`.

Before switching to `@theme inline`, two preconditions must hold: (1) every token value referenced from `@theme` must already be a valid CSS color at the `:root` level, and (2) the cascade ordering must not allow an unlayered source to override what `@theme` exposes. These conditions are currently met only for shade tokens — semantic tokens store raw HSL triplets, not color values.

### Goals

- Classify every token family in `globals.css`'s `@theme` block as `inline-safe` or `needs-pre-wrapping`.
- Confirm whether `@theme inline` co-exists safely with the existing unlayered `tokens.css` imports.
- Pilot `@theme inline` with one token family end-to-end and verify no regressions in parity snapshot tests.
- Document the canonical migration pattern so future token families can be onboarded without re-investigating cascade rules.

### Non-goals

- Migrating other apps (brikette, xa-b) — blocked until reception pilot is validated (per dispatch `adjacent_later`).
- OKLCH migration — depends on this fact-find completing first.
- Changing token values or adding new tokens.
- Touching `packages/themes/base/tokens.css` (base layer is shared across apps; scope is reception only).

### Constraints & Assumptions

- Constraints:
  - Tailwind v4 cascade rule: `@layer theme` has lower specificity than unlayered CSS. `tokens.css` is unlayered. Any token whose `:root` value comes from `tokens.css` will win over `@theme` rewrites at the same variable name.
  - `@theme inline` passes the value through as-is to Tailwind utilities. A raw triplet (`142 72% 30%`) is not a valid CSS color; it would produce broken `background-color` declarations.
  - Dark-mode switching in `tokens.css` is done by reassigning the primary CSS variable name in a `@media (prefers-color-scheme: dark)` block and `html.theme-dark` selector — this must remain intact after any migration.
  - `apps/reception/tailwind.config.mjs` still has a `receptionColorBridge` block using the v3-compat `hsl(var(...))` pattern. This is separate from `@theme` and is not affected by `@theme inline` changes (it generates classes via the v3 `theme.extend.colors` path).
- Assumptions:
  - Tailwind v4 permits mixing `@theme {}` and `@theme inline {}` blocks in the same CSS file (they are additive).
  - The parity snapshot tests (`apps/reception/src/parity/__tests__/`) are the regression gate — they render pages to HTML and diff; color class names must be stable.

## Outcome Contract

- **Why:** shadcn/ui v4's `@theme inline` pattern simplifies color management but interacts directly with the reception shade token cascade fix. Before this change can be safely implemented, we need to verify which token families are safe to migrate, establish the correct pre-wrapping pattern, and pilot the change in reception without breaking the existing shade color fix.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A validated migration path for `@theme inline` in reception documented: which token families are pre-wrapped, which are not, cascade ordering confirmed safe, and at least one token family piloted end-to-end without regressions.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/app/globals.css` — the single CSS entry point for the reception app; imports base tokens, reception tokens, Tailwind, then declares `@theme {}`. This is where `@theme inline` would be adopted.
- `packages/themes/reception/tokens.css` — unlayered `:root` block; source of all CSS variable values. Generated from `packages/themes/reception/src/tokens.ts`.
- `packages/themes/base/tokens.css` — unlayered `:root` block for base-layer tokens (structural, spacing, typography, hospitality signals). Imported before reception tokens in `globals.css`.

### Key Modules / Files

- `apps/reception/src/app/globals.css` — `@theme {}` block, 138 lines; contains all Tailwind v4 token registrations for reception. Current pattern: semantic tokens use `hsl(var(--token))`, shade tokens use bare `var(--token)`.
- `packages/themes/reception/tokens.css` — 282 lines; unlayered `:root` with light values, plus dark swap via `@media (prefers-color-scheme: dark)` and `html.theme-dark`. Shade tokens store `hsl(...)` literals; semantic tokens store raw triplets.
- `packages/themes/reception/src/tokens.ts` — TypeScript source of truth for all token values; generates `tokens.css` via build step.
- `packages/themes/base/tokens.css` — 367 lines; all base semantic and structural tokens as raw triplets with `var(--token-X, fallback)` pattern. Hospitality-specific signals (`--hospitality-ready`, `--hospitality-warning`, etc.) are defined here.
- `apps/reception/tailwind.config.mjs` — v3-compat config extending base config; `receptionColorBridge` defines 7 legacy dark-palette classes using `hsl(var(...))`. Shade families were removed from this file (per memory note).
- `apps/reception/src/components/roomgrid/rvg.css` — second CSS file in reception; defines `:root` custom properties for the room-grid widget using `hsl(var(--color-foreground))` etc. This is a consumer, not a source.
- `apps/reception/src/hooks/data/bar/useProducts.ts` — sole non-CSS consumer of shade token classes; assigns `bg-pinkShades-row1` etc. as Tailwind utility class strings for product grid items.

### Patterns & Conventions Observed

- **Two-tier token wrapping:** Base and reception `tokens.css` store raw HSL triplets (`142 72% 30%`) for semantic tokens. `globals.css` wraps most of them in `hsl(var(...))` when registering in `@theme {}`. This is the conventional Tailwind v4 pattern for tokens that need `hsl()` wrapping. **Exception:** `--color-panel: var(--color-panel)` (line 49) uses a bare `var()` without `hsl()` wrapping — this is structurally identical to the shade pattern but applied to a semantic token whose value is a raw triplet (`150 4% 97%`). This makes it structurally unsafe: if `@theme inline` were applied to it, the raw triplet would pass through to Tailwind utilities as-is and produce invalid CSS. Whether a live `bg-panel` consumer exists and is visually broken today was not investigated; the finding here is structural risk, not a confirmed production regression. Classified as **not inline-safe** and requiring the `hsl()` pre-wrapping treatment before any `inline` adoption.
- **Shade token exception:** Shade tokens store full `hsl(330 55% 66%)` literals at source in `tokens.css`. `globals.css` references them with bare `var()` in `@theme {}` — no wrapping. This was an intentional fix for the cascade conflict (memory: Tailwind v4 @layer theme cascade + shade token fix).
- **Dark mode via variable reassignment:** `tokens.css` dark mode swaps the primary variable name (e.g. `--color-primary` reassigned to `var(--color-primary-dark)`) in both `@media (prefers-color-scheme: dark)` and `html.theme-dark` selectors. The `@theme {}` registration uses the primary name, so dark mode works automatically without `@theme` changes.
- **No `@theme inline` anywhere in the codebase** (excluding node_modules). The pattern is used by `tw-animate-css` in node_modules but not in any app or package source file.
- **`receptionColorBridge` in tailwind.config.mjs** generates 7 classes via v3-compat `theme.extend.colors`; these use `hsl(var(...))` syntax and are independent of the `@theme` block.

### Data & Contracts

- Token families present in `globals.css @theme {}`:
  1. **Reception dark palette** (7 tokens: `darkBg`, `darkSurface`, `darkAccentGreen`, `darkAccentOrange`, `darkBorder`, `surface-dark`, `accent-hospitality`) — consume intermediate alias vars defined in `:root` of `globals.css`. Values ultimately come from `tokens.css` raw triplets via one level of indirection. Pattern: `hsl(var(--reception-dark-bg))`. **Not inline-safe** — values are raw triplets.
  2. **Shared preset surfaces** (3 tokens: `surface`, `surface-2`, `surface-3`) — consume `--surface-1`, `--surface-2`, `--surface-3` from `tokens.css`, raw triplets. Pattern: `hsl(var(--surface-1, var(--color-bg)))`. **Not inline-safe.**
  3. **Semantic colors** (primary, accent, destructive, success, warning, muted, foreground, borders, etc. — ~30 tokens) — consume raw triplets from `tokens.css` via `hsl(var(--color-primary))` etc. **Not inline-safe.**
  4. **DS primitive tokens** (input, panel, inset, ring, danger, info, border families, link — ~12 tokens) — same raw triplet pattern. **Not inline-safe.**
  5. **Soft palette** (6 tokens: accent-soft, primary-soft, danger-soft, etc.) — use fallback expressions like `hsl(var(--color-accent-soft, var(--color-accent) / 0.12))`. **Not inline-safe.**
  6. **Typography tokens** (font-sans, font-mono, font-heading, font-body — 4 tokens) — values are `var(--font-sans)` etc.; these are not colors, they are font stack strings. **Inline-safe** (non-color tokens, `inline` has no effect on font tokens).
  7. **Shade families** (35 tokens across pinkShades, coffeeShades, beerShades, wineShades, teaShades, greenShades, blueShades, purpleShades, spritzShades, orangeShades, grayishShades) — values in `tokens.css` are `hsl(330 55% 66%)` literals (full CSS colors). Pattern in `@theme`: bare `var(--color-pinkShades-row1)`. **Inline-safe already.**
  8. **Z-index tokens** (4 tokens: modal-backdrop, modal, popover, tooltip) — numeric values. **Inline-safe** (non-color, inline irrelevant).
  9. **Chart palette** (7 tokens: chart-1 through chart-7) — consume `--chart-1` etc. which are raw triplets in `tokens.css`. Pattern: `hsl(var(--chart-1))`. **Not inline-safe.**
  10. **Status main/dark/light variants** (primary-main, primary-dark, primary-light, info-main/dark/light, success-main/dark, warning-main/dark, error-main/dark — ~12 tokens) — consume raw triplets. **Not inline-safe.**

- Summary classification:
  - **Inline-safe now (no change needed):** shade families (35), z-index (4), typography (4) — 43 tokens
  - **Not inline-safe (raw triplets at source):** all semantic, surface, dark-palette, chart, status-variant tokens — ~70 tokens
  - **Path to make semantic tokens inline-safe:** convert their source values in `tokens.css` (and `tokens.ts`) from raw triplets to `hsl()` literals, matching the pattern already used for shade tokens.

### Dependency & Impact Map

- Upstream dependencies:
  - `packages/themes/reception/src/tokens.ts` → generates `packages/themes/reception/tokens.css` (build step must be re-run after any token value change).
  - `packages/themes/base/tokens.css` — base tokens imported first; provides fallbacks and hospitality signals. Not in scope to change.
- Downstream dependents:
  - `apps/reception/src/app/globals.css` — direct consumer of both token CSS files.
  - All `apps/reception/src` components that use Tailwind color utilities (e.g., `bg-primary`, `text-foreground`, `border-border`). These are correct as long as the utility class names do not change — and they will not change under this migration.
  - `apps/reception/src/hooks/data/bar/useProducts.ts` — assigns `bg-pinkShades-row1` etc. as class strings. These classes must remain registered after migration; they will remain registered.
  - `apps/reception/src/components/roomgrid/rvg.css` — references `--color-foreground`, `--color-border-1`, `--color-info-light`, `--color-primary-main` etc. via `hsl(var(...))`. These are not `@theme`-registered variables; they read from `:root` directly. Not affected by `@theme inline` changes.
  - Parity snapshot tests (5 files): `checkin-route`, `checkout-route`, `login-route`, `safe-route`, `till-route` — render HTML and diff. Class names in output must not change. Migration is additive/rename-in-same-slot; class names are stable.
- Likely blast radius:
  - Zero consumer changes expected if the migration only converts how values are expressed in `@theme` — the generated utility class names are identical.
  - Risk is confined to CSS rendering: if a token is incorrectly classified as inline-safe when it is not, the color will be broken (raw triplet treated as a color string → transparent or invalid).

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (unit/integration), parity snapshot tests (React/Next.js render to HTML string + snapshot diff).
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs` (governed runner per MEMORY policy).
- CI integration: tests run in CI on push; not run locally.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Parity snapshots | Snapshot | `apps/reception/src/parity/__tests__/checkin-route.parity.test.tsx` etc. (5 files) | Render full route to HTML; catch class name regressions for the routes they exercise (checkin, checkout, login, safe, till). These routes do not render the bar/POS product grid — shade utility classes are not exercised by these tests. |
| Bar products hook | Unit | `apps/reception/src/hooks/data/bar/__tests__/useProducts.test.ts` | **Primary regression gate for shade classes.** Tests product data structure including shade class string assignments (e.g. `bg-pinkShades-row1`). Confirms the class strings are present in product data but does not verify CSS resolution. |
| Safe forms | Unit | `apps/reception/src/components/safe/__tests__/` (4 files) | Use `bg-primary`, `bg-success` etc. — semantic class name presence indirectly tested via snapshot. |

#### Coverage Gaps

- No visual regression tests (Chromatic/Percy) — CSS correctness is not verified at the rendered-pixel level.
- No test directly asserts that `bg-pinkShades-row1` resolves to a specific color value. The parity tests verify class names are present, not that the underlying CSS is correct.
- No Playwright/E2E test for the bar POS grid colors.

#### Testability Assessment

- Easy to test: class name stability for routes covered by parity snapshots (checkin, checkout, login, safe, till); shade class string presence in product data (useProducts unit test).
- Hard to test: (1) Whether the resolved CSS color for shade tokens is visually correct — no pixel-level test exists; (2) bar/POS grid rendering — not covered by parity snapshots; requires manual visual verification in browser.
- Test seams needed: none new for the narrow shade pilot. The useProducts unit test + manual visual check is the practical gate for shade families.

#### Recommended Test Approach

- Unit tests for: none new required.
- Snapshot tests: run all 5 parity tests after each token family pilot; snapshot must pass without diff. Note: parity tests do not cover the bar/POS shade grid — their passing does not verify shade color rendering correctness.
- E2E for: out of scope for this migration (no new user flow).
- Manual visual verification: recommended for the shade family pilot — open the bar POS grid in a browser and verify colors are correct.

### Recent Git History (Targeted)

- `c81e13f3d1` — most recent commit touching `packages/themes/reception/tokens.css` (+61/-0): added shade token families as `hsl()` literals. This is the cascade fix referenced in MEMORY. Shade tokens now use `hsl(330 55% 66%)` format; semantic tokens remain as raw triplets. This commit establishes the two-tier pattern that the `@theme inline` migration must build on.
- `5ab6e572db` feat(reception): Wave 5 — adds print suppression to `globals.css` (16 lines). No token or `@theme` changes.
- `1499cffeb7`, `c2b4c93121` — checkpoint commits; no `@theme` changes.

## Questions

### Resolved

- Q: Does Tailwind v4 permit mixing `@theme {}` and `@theme inline {}` in the same file?
  - A: Yes. The `inline` modifier is per-block, not per-file. Multiple `@theme` blocks are merged additively by Tailwind.
  - Evidence: `tw-animate-css` uses `@theme inline { ... }` alongside standard Tailwind CSS in the same bundle. Tailwind v4 docs confirm per-block modifier.

- Q: Are shade tokens already inline-safe?
  - A: Yes. `tokens.css` stores them as `hsl(330 55% 66%)` literals (confirmed: lines 56-125 of `packages/themes/reception/tokens.css`). `globals.css` references them with bare `var()`. Adding `inline` to their `@theme` block would be safe today.
  - Evidence: `packages/themes/reception/tokens.css` lines 56–125, `packages/themes/reception/src/tokens.ts` lines 65–119.

- Q: What is the correct path to make semantic tokens inline-safe?
  - A: Convert their values in `tokens.ts` (source of truth) from raw triplets (`'142 72% 30%'`) to full `hsl()` strings (`'hsl(142 72% 30%)'`), rebuild `tokens.css` using `pnpm -w run build:tokens` (confirmed at workspace root `package.json:17`: `"build:tokens": "pnpm tsx scripts/src/build-tokens.ts"`), then switch the corresponding `@theme {}` block entries from `hsl(var(--token))` to `var(--token)`. Identical to the shade token pattern already in place.
  - Evidence: Memory note documents this pattern; `tokens.ts` lines 15–55 confirm semantic tokens currently use raw triplet format; `scripts/src/build-tokens.ts` confirmed as the generator (reads from `packages/themes/*/src/tokens.ts`, writes `tokens.css`).

- Q: Does the dark mode swap mechanism break under `@theme inline`?
  - A: No. Dark mode works by reassigning the CSS variable value (e.g., `--color-primary: var(--color-primary-dark)`) in `@media (prefers-color-scheme: dark)` and `html.theme-dark` selectors. `@theme` reads the variable at the time the utility class is applied (runtime), not at the time the CSS is parsed. Dark mode swaps propagate correctly regardless of whether `@theme inline` is used.
  - Evidence: `tokens.css` lines 142–282 confirm the var-reassignment pattern; `globals.css` line 26 shows `--color-primary: hsl(var(--color-primary))` — swapping the raw triplet in dark mode still produces a valid value for the `hsl()` wrapper.

- Q: Does `rvg.css` interact with `@theme inline`?
  - A: No. `rvg.css` reads from `:root` custom properties directly (e.g., `hsl(var(--color-foreground))`), not from `@theme`-registered Tailwind utilities. `@theme` changes do not affect `rvg.css` behavior.
  - Evidence: `apps/reception/src/components/roomgrid/rvg.css` lines 1–29.

- Q: What is the safest family to pilot?
  - A: The shade families. They are already inline-safe (values are `hsl()` literals at source). A pilot consists only of wrapping their `@theme` entries in `@theme inline {}` instead of `@theme {}`. Risk is low — the only affected surface is the bar POS grid. Automated coverage: the `useProducts` unit test (`apps/reception/src/hooks/data/bar/__tests__/useProducts.test.ts`) verifies shade class strings are present in product data. The parity snapshot suite does not render the bar/POS grid and will not catch shade color regressions. Manual visual verification of the bar grid in a browser is required as the color-correctness gate for this pilot.
  - Evidence: Shade family entries confirmed in `globals.css` lines 72–108; `useProducts.ts` confirmed as sole consumer of shade class strings; parity test files inspected — none render bar/POS routes.

### Open (Operator Input Required)

- Q: Should semantic tokens be migrated to `hsl()` literals in `tokens.ts` as part of this plan, or should the `@theme inline` adoption be scoped to shade + non-color tokens only?
  - Why operator input is required: this is a scope decision. The technical path to full migration is clear, but it requires modifying `tokens.ts` for ~40 semantic token values and rebuilding `tokens.css`. This is low-risk but a significant file change and touches the source-of-truth file. The operator may prefer a phased approach (shade tokens only first, semantic tokens deferred).
  - Decision impacted: width of TASK scope in the plan — either a narrow pilot (shade families only, ~5 lines of CSS change) or a full migration (shade + semantic, requiring `tokens.ts` rebuild).
  - Decision owner: operator (Peter)
  - Default assumption (if any) + risk: Default to narrow pilot first (shade families only). Risk: deferred semantic migration leaves the `@theme` block split into two styles (some tokens wrapped, some inline), which is cosmetically inconsistent but functionally safe.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Token family classification (`globals.css` @theme entries) | Yes | None | No |
| Cascade ordering (unlayered tokens.css vs @layer theme) | Yes | None — cascade is well-understood from memory + file evidence | No |
| Shade token pre-wrapping verification | Yes | None — values confirmed as `hsl()` literals in tokens.css and tokens.ts | No |
| Semantic token raw triplet status | Yes | None — confirmed raw triplets throughout tokens.css lines 4–53 | No |
| Dark mode swap interaction | Yes | None — var-reassignment pattern confirmed safe | No |
| Consumer blast radius (useProducts, rvg.css, component classes) | Yes | None — class names unchanged; rvg.css unaffected | No |
| Test landscape (parity snapshots) | Yes | Minor [Missing domain coverage]: no pixel-level visual regression test exists. Parity tests verify class names, not rendered colors. | No |
| tailwind.config.mjs receptionColorBridge | Yes | None — separate v3-compat path; unaffected by @theme changes | No |
| tokens.ts build pipeline | Yes | None — build command confirmed: `pnpm -w run build:tokens` via `scripts/src/build-tokens.ts`. Plan must include this step explicitly if semantic tokens are in scope. | No |

## Scope Signal

Signal: right-sized

Rationale: The investigation covers all token families, the cascade mechanism, both consumer paths (Tailwind utilities and direct var() references), the dark mode swap, and the test landscape. The open question (scope of semantic token migration) is a well-defined decision fork that does not block the pilot. The shade-family pilot is safe to execute with existing evidence.

## Confidence Inputs

- Implementation: 90%
  - Evidence: All key files read; token classification is complete and traceable to file line numbers. The shade pilot requires only a 1-block CSS change. Build command confirmed: `pnpm -w run build:tokens`. Exception token (`--color-panel`) identified and classified.
  - Raises to >=80: already met.
  - Raises to >=90: operator confirms migration scope; manual visual check performed after shade pilot.

- Approach: 85%
  - Evidence: The two-tier approach (shade pilot first, semantic tokens deferred) is consistent with the pattern already established in the codebase. `@theme inline` per-block mixing is confirmed available.
  - Raises to >=80: already met.
  - Raises to >=90: operator confirms preferred migration scope (narrow vs full).

- Impact: 90%
  - Evidence: Blast radius is narrow. Class names do not change. The only observable effect is how Tailwind internally resolves color values. Consumer behavior is identical for inline-safe tokens.
  - Raises to >=80: already met.
  - Raises to >=90: visual verification of the bar POS grid after pilot.

- Delivery-Readiness: 85%
  - Evidence: CSS change for the shade pilot is ~5 lines. Parity tests are the regression gate. No new dependencies required.
  - Raises to >=80: already met.
  - Raises to >=90: operator answers scope question (narrow vs full migration).

- Testability: 75%
  - Evidence: Parity snapshots verify class name stability. No pixel-level CSS correctness test exists. Manual visual check required for color correctness.
  - Raises to >=80: add a note in the plan to require manual visual verification of the bar POS grid post-pilot.
  - Raises to >=90: would require a visual regression test (Chromatic or similar) — out of scope for this migration.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Semantic token classified as inline-safe incorrectly — raw triplet treated as CSS color, renders transparent | Low — classification is explicit and traceable | High — broken colors in production | Scope pilot to shade families only (already confirmed inline-safe). Verify each family before expanding. |
| tokens.ts rebuild not run after semantic token value change | Medium (if semantic tokens in scope) | High — `tokens.css` would be stale | Plan must include explicit build step: regenerate `tokens.css` from `tokens.ts`. |
| Parity snapshot diff caused by ordering change in generated CSS | Low | Low — easy to update snapshots | Update snapshots intentionally; diff review confirms no unexpected changes. |
| Dark mode swap breaks after migration | Low — var-reassignment confirmed safe | High — dark mode colors broken site-wide | Verified: var-reassignment pattern is independent of hsl() wrapping. No code change needed. |
| `receptionColorBridge` in tailwind.config.mjs interacts unexpectedly | Very low — separate v3-compat code path | Low | Confirmed: the config generates classes via `theme.extend.colors`, independent of `@theme`. |

## Planning Constraints & Notes

- Must-follow patterns:
  - Shade tokens retain `hsl()` literal format at source (`tokens.ts`) — this is the established pattern and must not be reverted to raw triplets.
  - Any token moved to `@theme inline {}` must have its source value in `tokens.css` verified as a valid CSS color before the change.
  - Separate `@theme {}` and `@theme inline {}` blocks should be grouped by family in `globals.css` with clear comments.
  - `tokens.ts` is the source of truth; `tokens.css` is generated. Changes to token values go into `tokens.ts` first.
- Rollout/rollback expectations:
  - This is a CSS-only change. Rollback = revert `globals.css`. No database, API, or component changes.
  - If parity snapshots fail after the pilot, the change should be reverted before investigating.
- Observability expectations:
  - Manual visual check of the bar POS grid (the only surface with shade color classes) after pilot.
  - All 5 parity snapshot tests must pass clean (no diff) after migration.

## Suggested Task Seeds (Non-binding)

- TASK-01: Audit and document the final per-family classification table (inline-safe vs not) — confirm against `globals.css` and `tokens.css`.
- TASK-02: Pilot `@theme inline` for shade token families — move shade entries in `globals.css` from `@theme {}` to `@theme inline {}`. Run parity snapshots. Perform manual visual check of bar POS grid.
- TASK-03 (conditional on operator scope decision): Convert semantic tokens in `tokens.ts` to `hsl()` literals, rebuild `tokens.css`, update `globals.css` to use bare `var()` in `@theme inline {}` for those families. Run parity snapshots.
- TASK-04: Document the migration pattern (inline comment in `globals.css` and/or update to `packages/themes/reception/src/tokens.ts` file header) so future token additions follow the correct format.

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package: All 5 parity snapshot tests pass; no diff in snapshot output; manual visual confirmation of bar POS grid colors; `globals.css` uses `@theme inline {}` for all inline-safe families.
- Post-delivery measurement plan: Monitor for CSS color regression reports in reception; verify dark mode functions correctly in browser after deployment.

## Evidence Gap Review

### Gaps Addressed

- Citation integrity: all token family classifications traced to specific line numbers in `globals.css`, `tokens.css`, and `tokens.ts`.
- Cascade boundary: the unlayered-vs-`@layer theme` interaction is the documented production fix; confirmed by both memory and file inspection.
- Consumer blast radius: all consumers identified (useProducts.ts, rvg.css, component class strings). None are affected by the migration.
- Dark mode interaction: var-reassignment pattern confirmed safe through file inspection.
- Test landscape: parity snapshots confirmed as the regression gate; gap acknowledged (no pixel-level visual test).

### Confidence Adjustments

- Implementation score raised to 90%: build pipeline confirmed (`pnpm -w run build:tokens`); `--color-panel` exception identified and correctly classified as not inline-safe. Testability held at 75% — the bar/POS shade grid has no parity test coverage and requires manual visual verification.
- Testability held at 75% to reflect the absence of pixel-level CSS testing — this is a known limitation, not a blocker.

### Remaining Assumptions

- Tailwind v4 processes `@theme inline {}` blocks additively with `@theme {}` blocks in the same file (confirmed by tw-animate-css node_modules usage, but not tested in this repo's specific Tailwind build config).
- The tokens.ts → tokens.css build command (`pnpm -w run build:tokens`, workspace root `package.json:17`) is confirmed. The output format (generated `tokens.css`) matches the current file at `packages/themes/reception/tokens.css`. Whether rebuilding after semantic token value changes produces correctly formatted `hsl()` output has not been dry-run tested — this is a plan-time verification step.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none for the narrow shade-pilot scope. The open question on semantic token scope is advisory for plan width, not a blocker.
- Recommended next step: `/lp-do-plan reception-theme-inline-cascade --auto`
