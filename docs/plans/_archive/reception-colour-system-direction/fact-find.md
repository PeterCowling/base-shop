---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: UI
Workstream: Engineering
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: reception-colour-system-direction
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/reception-colour-system-direction/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260313192500-BRIK-REC-006
---

# Reception Colour System Direction — Fact-Find Brief

## Scope

### Summary

The reception app uses green as its primary colour but also carries blue throughout: as `--color-info` / `--hospitality-info` tokens (hsl 210), as `--chart-1` (hsl 240), and as five `blueShades-rowN` palette entries used in the bar's mixed-drinks category colouring. Green and blue are 68 degrees apart in hue with comparable saturation, creating visual competition. The accent token is already warm amber (hsl 36), which sits ~106 degrees from green — a strongly harmonious pairing — but is barely used in the bar product grid or charts.

The proposed direction is to replace blue appearances in the interface with green-family shades (for occupancy/category colour coding) and amber/warm tones (for charts), producing a coherent two-colour system.

### Goals

- Remove visual competition between blue and green in the bar product POS grid.
- Redirect `blueShades-rowN` tokens to green-family hues so the mixed-drinks category is coded in green tones.
- Evaluate replacing `--chart-1` (hsl 240, blue) and `--chart-6` (hsl 199, cyan-blue) with amber or warm tones to remove competing blue from analytics charts. Both tokens appear in chart components alongside green chart-2.
- Reduce saturation of `--color-primary-dark` (142 70% 48%) to avoid the "electric green" feel in dark mode.
- Preserve the `--hospitality-info` semantic blue where it signals booking states (awaiting/confirmed), as this has an existing UX meaning distinct from primary branding.

### Non-goals

- Redesigning the `--hospitality-info` booking-state colour system (status colours have a UX purpose and are not purely aesthetic).
- Changes to any other app beyond the reception app.
- Replacing primary green — it remains the primary colour.
- Typography, layout, or spacing changes.

### Constraints & Assumptions

- Constraints:
  - `tokens.css` is generated from `tokens.ts` via `scripts/build-tokens.ts`. Editing the CSS directly is not durable; source of truth is `packages/themes/reception/src/tokens.ts`.
  - The `blueShades-rowN` token names are referenced by string literal in `useProducts.ts` (hardcoded as `"bg-blueShades-rowN"` Tailwind class names). Renaming the token without updating the class reference would break styling.
  - `tailwind.config.mjs` in the reception app registers `blueShades-rowN` as colour utilities via `receptionShadeColors`. Any rename must update the Tailwind config as well.
  - `--hospitality-info` and `--color-info` at hsl(210, 90%, 35/96%) are used for room-booking status colour coding in `statusColors.ts`, `rvg.css`, and the `statusColors` record. Changing these would affect booking state legibility — out of scope.
  - The `blueShades` family has 5 rows (row1–row5) each with light + dark variants. Any replacement family must also provide 5 rows.
- Assumptions:
  - A new token family (e.g. `warmGreenShades-rowN`) using hues in the 110–155 range at varying lightness would replace `blueShades-rowN` semantically for mixed-drinks categories.
  - Chart colours are set directly via `hsl(var(--chart-N))` inline in chart components; changing the token value changes all chart appearances.
  - Dark mode variants of new tokens follow the same lightness-reduction pattern used by existing `greenShades` (140 22% 22% at row1 dark).

## Outcome Contract

- **Why:** The green + blue combination in the current interface creates visual clutter. The operator has identified this as a product quality issue — the interface does not feel coherent or professional, which matters for a POS used daily by front-of-house staff.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The reception app's interface uses green and amber as its two active colour families, with blue removed from bar product categorisation, analytics chart-1 (hsl 240), and analytics chart-6 (hsl 199). The booking status system (hospitality-info, rvg awaiting/confirmed) is preserved. Visual competition is eliminated.
- **Source:** operator

## Current Process Map

None: local code path only. This is a CSS/token change with no multi-step workflow, CI/deploy/release lane, approval path, or operator runbook affected beyond normal deploy.

## Discovery Contract Output

- **Gap Case ID:** n/a
- **Recommended First Prescription:** n/a
- **Required Inputs:** n/a
- **Expected Artifacts:** n/a
- **Expected Signals:** n/a

### Prescription Candidates

Not applicable — this is a direct product improvement, not a prescription-discovery task.

## Evidence Audit (Current State)

### Entry Points

- `packages/themes/reception/src/tokens.ts` — source of truth for all reception colour tokens; compiled to `tokens.css` by `scripts/build-tokens.ts`. This is the authoritative edit point.
- `packages/themes/reception/tokens.css` — generated output; imported by `apps/reception/src/app/globals.css`. Must be regenerated after `tokens.ts` changes.
- `apps/reception/src/hooks/data/bar/useProducts.ts` — hardcodes Tailwind class names like `"bg-blueShades-row1"` through `"bg-blueShades-row5"` for 28 products in category 8 (Mixed Drinks).
- `apps/reception/tailwind.config.mjs` — registers `blueShades-rowN` colour utilities in `receptionShadeColors`; must be updated in lockstep with any token rename.

### Key Modules / Files

- `packages/themes/reception/src/tokens.ts` — 107-line token map; defines all `blueShades-rowN` (lines 80–84) and `chart-1` (line 100). Primary edit surface.
- `apps/reception/src/hooks/data/bar/useProducts.ts` — product catalogue with inline Tailwind class strings; lines 160–188 contain all `bg-blueShades-row*` references.
- `apps/reception/tailwind.config.mjs` — `receptionShadeColors` object (lines 51–87) includes `blueShades-row1` through `blueShades-row5`.
- `apps/reception/src/components/roomgrid/statusColors.ts` — uses `--reception-signal-info-bg/fg` (wraps `--hospitality-info`). Not touching blue-removal scope but confirms that info/booking tokens are a separate concern.
- `apps/reception/src/components/roomgrid/rvg.css` — `--rvg-color-awaiting` and `--rvg-color-confirmed` reference `--color-info` and `--color-info-soft`. Out of scope.
- `apps/reception/src/app/globals.css` — imports reception `tokens.css`; also defines `--reception-signal-info-bg/fg` using `--hospitality-info`. Out of scope for changes.
- `packages/themes/base/tokens.css` — `--hospitality-info` default values are hsl(210). Not touched.
- `apps/reception/src/components/reports/RealTimeDashboard.tsx` — uses `hsl(var(--chart-1))` for the "Sales" bar chart and `hsl(var(--chart-1))` through `hsl(var(--chart-5))` in the tender breakdown pie. The blue appears via chart-1 (hsl 240) and chart-2 is already green — chart-1 is the blue conflict here.
- `apps/reception/src/components/analytics/MenuPerformanceDashboard.tsx` — uses `hsl(var(--chart-1))` for the revenue bar chart (line 168), `hsl(var(--chart-6))` for a doughnut chart (line 180) alongside chart-3, and `hsl(var(--chart-7))` for a line chart (lines 191–192). Both `--chart-1` (hsl 240 60% 44%) and `--chart-6` (hsl 199 89% 48%) are blue/cyan tones competing with green chart-2 (hsl 142).

### Patterns & Conventions Observed

- Token source of truth is `tokens.ts` (TypeScript); `tokens.css` is generated output — evidence: `tokens.css:1` contains comment `/* Generated by build-tokens.ts */`. Any direct CSS edit will be overwritten.
- Token naming follows `--color-<familyName>-row<N>` with `-dark` variants; Tailwind utilities are `<familyName>-rowN` keys in `receptionShadeColors` mapping to `hsl(var(--color-<familyName>-rowN))`.
- Shade families are categorised by product type in the bar POS (pinkShades = cocktails, coffeeShades = coffee, blueShades = mixed drinks/spirits).
- All chart colours are consumed inline as `hsl(var(--chart-N))` — no intermediary constant file.

### Data & Contracts

- Types/schemas/events:
  - Token type: `{ light: string; dark?: string }` defined in `packages/themes/base` and imported in `tokens.ts` line 9.
  - Tailwind config: `receptionShadeColors` object in `tailwind.config.mjs` maps token CSS var names to utility classes; must match token family names exactly.
- Persistence:
  - `tokens.css` is a generated file committed to the repo. After editing `tokens.ts`, the script `scripts/build-tokens.ts` must be run to regenerate it.
- API/contracts:
  - No API surface. Pure CSS token and Tailwind config changes.

### Dependency & Impact Map

- Upstream dependencies:
  - `scripts/build-tokens.ts` generates `tokens.css` from `tokens.ts` → must be re-run after token edits.
  - `packages/themes/base/tokens.css` provides `--hospitality-info` defaults (not being changed).
- Downstream dependents:
  - `apps/reception/src/hooks/data/bar/useProducts.ts` references `blueShades-rowN` Tailwind class names directly as strings.
  - `apps/reception/tailwind.config.mjs` registers the Tailwind colour utilities.
  - `apps/reception/src/components/reports/RealTimeDashboard.tsx` consumes `--chart-1` (and chart-2 through 5 for the tender pie). `MenuPerformanceDashboard.tsx` consumes `--chart-1`, `--chart-6`, and `--chart-7` inline. Both blue tokens (`--chart-1` and `--chart-6`) appear in these components.
  - `apps/reception/src/app/__tests__/theme-bridge.test.tsx` tests that `globals.css` imports the correct tokens file — this test checks CSS selectors and would pass unchanged.
- Likely blast radius:
  - Changing `blueShades-rowN` token values in `tokens.ts` + regenerating CSS + updating Tailwind config key names (if renaming) + updating `useProducts.ts` string literals covers the full blast radius for the bar POS grid.
  - Changing `--chart-1` in `tokens.ts` affects `RealTimeDashboard.tsx` and `MenuPerformanceDashboard.tsx`. Changing `--chart-6` in `tokens.ts` additionally affects `MenuPerformanceDashboard.tsx` (line 180 doughnut). Both are pure CSS var references — no code changes needed.
  - Changing `--color-primary-dark` saturation only requires a token value edit and CSS regeneration.
  - The test at `theme-bridge.test.tsx` checks `globals.css` structure, not token values — will not fail.

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest (reception app)
- Commands: `pnpm --filter reception test` (CI only per testing-policy.md)
- CI integration: Tests run in CI on push

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Theme bridge / globals.css | Unit | `apps/reception/src/app/__tests__/theme-bridge.test.tsx` | Checks CSS imports and custom property names in globals.css; will not fail unless CSS var names change |
| Reception theme provider | Unit | `apps/reception/src/providers/__tests__/ReceptionThemeProvider.test.tsx` | Theme switching; unaffected by token value changes |
| Theme toggle | Unit | `apps/reception/src/app/__tests__/App.theme-toggle.test.tsx` | UI toggle; unaffected |
| Room grid cells | Unit/integration | `apps/reception/src/components/roomgrid/__tests__/` | Various; use `#hex` or `var(--reception-signal-*)` — not testing blueShades |
| Order age colour | Unit | `apps/reception/src/hooks/orchestrations/bar/actions/clientActions/__tests__/useOrderAgeColor.test.ts` | Unrelated to blueShades |

#### Coverage Gaps

- Untested paths:
  - No tests assert that `blueShades-rowN` token values render correctly, that they are consumed by `useProducts.ts`, or that the Tailwind utility classes exist.
  - No tests validate `chart-N` token values or chart component colours.
  - No visual regression tests; colour appearance is purely visual.
- Extinct tests: None identified.

#### Testability Assessment

- Easy to test: Token value changes in `tokens.ts` can be validated with a simple TypeScript unit test that reads the token map and asserts expected HSL values.
- Hard to test: Visual appearance (whether the colours harmonise) requires manual review or a screenshot tool; automated colour-harmony assertions are not standard in the project.
- Test seams needed: A minimal token-values snapshot test could be added; not required for build-eligibility but useful for regression.

#### Recommended Test Approach

- Unit tests for: none required (token value changes produce no logic paths)
- Integration tests for: none required
- E2E tests for: none required
- Manual validation: Open the bar POS screen and real-time dashboard in the browser after deploying; visually confirm colour harmony.

### Recent Git History (Targeted)

- `packages/themes/reception/src/tokens.ts` / `tokens.css` — `ba9a276` "Fix reception theme contract for Tailwind v4": adjusted token cascade for Tailwind v4 compatibility. Recent change establishes the current token structure.
- `packages/themes/reception/src/tokens.ts` — `58ab456` "fix(reception): raise dark-mode contrast — fg-muted tokens + StatusButton opacity + price badge size": dark-mode contrast improvements made to fg-muted. Confirms dark token values are being actively maintained.
- `packages/themes/reception/src/tokens.ts` — `f1dcc15` "feat(themes): migrate reception tokens to OKLCH": earlier large migration; current codebase has reverted back to HSL triplets (OKLCH not present in current `tokens.ts`). Current state is HSL.

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | `tokens.ts` defines all shade and chart token values; Tailwind utilities wrap them; bar POS uses `bg-blueShades-rowN` classes; charts use `hsl(var(--chart-1))` and `hsl(var(--chart-6))` inline | No visual regression tests; colour harmony is subjective and must be validated manually | Analysis must decide which replacement hue range and lightness steps to use for the new warmGreenShades (or renamed blueShades), and which warm tones replace both `--chart-1` (hsl 240) and `--chart-6` (hsl 199) |
| UX / states | Required | `statusColors.ts` maps booking states to `reception-signal-info-*` (blue) — these are out of scope but must not be disrupted. No UX impact on booking state colours if only blueShades and chart-1 change. | Risk of accidentally touching hospitality-info tokens if a global rename is used | Analysis must confirm that hospitality-info / rvg booking colours are left unchanged |
| Security / privacy | N/A | No auth, no data exposure; pure visual CSS token change | None | N/A |
| Logging / observability / audit | N/A | No observability hooks involved in CSS token changes | None | N/A |
| Testing / validation | Required | One existing test (`theme-bridge.test.tsx`) checks globals.css structure but not token values. No tests assert shade colour values or chart colours. | No automated coverage of new token values; manual visual review required post-deploy | Analysis should confirm whether a token-value snapshot test is worth adding |
| Data / contracts | Required | `tokens.ts` → `tokens.css` pipeline via `build-tokens.ts`. Tailwind config maps token names to utility class names. `useProducts.ts` has hardcoded string class names. | If token family is renamed (e.g. `blueShades` → `warmGreenShades`), three files must be updated in lockstep: `tokens.ts`, `tailwind.config.mjs`, `useProducts.ts`. Partial update would silently drop colour styling. | Analysis must choose: rename the token family (semantic clarity) vs. keep the name and change the values only (simpler, fewer files touched) |
| Performance / reliability | N/A | CSS custom property resolution; no hot path or caching concerns | None | N/A |
| Rollout / rollback | Required | Pure CSS/token change with no database migration or feature flag. Rollback = revert the token values in `tokens.ts` and regenerate `tokens.css`. | Fast rollback path; low risk | Analysis should confirm no feature flag is needed |

## Questions

### Resolved

- Q: Is `tokens.css` the edit point or is `tokens.ts`?
  - A: `tokens.ts` is the source of truth. `tokens.css` is generated by `scripts/build-tokens.ts`. Editing `tokens.css` directly would be overwritten.
  - Evidence: `packages/themes/reception/tokens.css:1` comment "Generated by build-tokens.ts"; `scripts/build-tokens.ts` confirmed present.

- Q: Do `blueShades-rowN` tokens have any usages outside the bar product grid?
  - A: No. The only non-Tailwind-config consumer is `useProducts.ts` (category 8 mixed drinks/spirits). The Tailwind config registers the utilities but the only JSX consumer is `useProducts.ts`.
  - Evidence: Repo-wide grep for `blueShades` returns four files: the source definition (`packages/themes/reception/src/tokens.ts`), the generated CSS output (`packages/themes/reception/tokens.css`), and two runtime consumers (`apps/reception/src/hooks/data/bar/useProducts.ts`, `apps/reception/tailwind.config.mjs`). The token definition and generated CSS are the same logical entity (source + generated output). The two runtime consumer files are where changes must be applied beyond the token itself.

- Q: Is `--hospitality-info` (booking status blue) the same token family as `blueShades`?
  - A: No. They are entirely separate. `--hospitality-info` is a semantic status token defined in `packages/themes/base/tokens.css` at `210 90% 35/96%`, consumed via `--reception-signal-info-*` in `globals.css` and `statusColors.ts`. `blueShades-rowN` is a product-category colour palette defined in `packages/themes/reception/src/tokens.ts`. They do not share a token name or value.
  - Evidence: `statusColors.ts` (reception-signal-info-*), `rvg.css` (color-info-soft, color-info), `tokens.ts` lines 80–84 (blueShades-row1 through row5).

- Q: Does renaming `blueShades` break anything beyond the files identified?
  - A: No. The only files containing `blueShades` in the repo are: `packages/themes/reception/src/tokens.ts` (source definition), `packages/themes/reception/tokens.css` (generated output — same logical entity), `apps/reception/tailwind.config.mjs` (registers the utility), and `apps/reception/src/hooks/data/bar/useProducts.ts` (uses the class name at runtime). The generated CSS and source tokens.ts are one logical unit — edit tokens.ts, regenerate to get tokens.css. The two runtime consumer files that require explicit editing are `tailwind.config.mjs` and `useProducts.ts`.
  - Evidence: Repo-wide search for `blueShades` returns four files: `packages/themes/reception/src/tokens.ts`, `packages/themes/reception/tokens.css`, `apps/reception/tailwind.config.mjs`, `apps/reception/src/hooks/data/bar/useProducts.ts`.

- Q: Which chart components consume blue chart tokens?
  - A: Two blue tokens exist: `--chart-1` (hsl 240 60% 44%) and `--chart-6` (hsl 199 89% 48%). `RealTimeDashboard.tsx` uses `hsl(var(--chart-1))` for the bar chart (line 77) and in the tender pie array (line 86). `MenuPerformanceDashboard.tsx` uses `hsl(var(--chart-1))` for the revenue bar chart (line 168) and `hsl(var(--chart-6))` for the doughnut chart (line 180). Both are inline CSS var references with no intermediary constant.
  - Evidence: `grep chart- apps/reception/src/components/reports/RealTimeDashboard.tsx` and `grep chart- apps/reception/src/components/analytics/MenuPerformanceDashboard.tsx`.

- Q: What hue should replace blueShades and the blue chart tokens (chart-1, chart-6)?
  - A: Resolvable by reasoning. BlueShades replacement should use hues within 30 degrees of the primary green (hsl 142) but at clearly lower saturation to avoid competing with primary. Hue 110–130 range (yellow-green to green) with reduced saturation relative to primary provides differentiated shades without introducing a competing hue. Alternatively, the existing `greenShades` family (hue 140) already provides 3 rows; a "warmGreenShades" at ~120 provides a distinct family that visually reads as "green-adjacent" without confusion. For chart-1 (hsl 240) and chart-6 (hsl 199), both should move to amber/warm tones to align with the accent system — the green/teal range is occupied by chart-2 (hsl 142), chart-5 (hsl 174), and chart-7 (hsl 160). Chart-1 could move to hsl ~42–48 (amber); chart-6 to hsl ~52–58 (golden-yellow), keeping ≥15 deg separation from chart-3 (hsl 25). Exact values to be validated in analysis against the full 7-token palette.
  - Evidence: `tokens.ts` `--color-accent: { light: "36 90% 50%" }` (barely used); `--chart-1: 240 60% 44%`, `--chart-6: 199 89% 48%`; `--chart-3: 25 95% 53%`; greenShades at hue 140; primary at 142.

- Q: Is there a `build-tokens` script to run after editing `tokens.ts`?
  - A: Yes. `scripts/build-tokens.ts` is the generator; run `npx tsx scripts/build-tokens.ts` (or the workspace equivalent) to regenerate all theme CSS files. The script targets `packages/themes/*/src/tailwind-tokens.ts` → `tokens.css`.
  - Evidence: `scripts/build-tokens.ts` lines 158–196 (theme build loop).

### Open (Operator Input Required)

- Q: Should `blueShades-rowN` be renamed (e.g. to `warmGreenShades-rowN`) or should the token name stay and only the HSL values change?
  - Why operator input is required: This is a naming preference decision. Keeping the name `blueShades` while supplying green hue values is semantically misleading. Renaming requires updating three files and changes public token names that could theoretically affect downstream customisation. The operator must decide which is more important: semantic clarity vs. change surface size.
  - Decision impacted: Whether `useProducts.ts` class name strings need editing (rename path) or not (value-only path).
  - Decision owner: operator (product owner)
  - Default assumption (if any) + risk: Default to rename (`warmGreenShades`) for semantic clarity. Risk: slightly larger change surface (3 files instead of 1); low risk in practice since blueShades are only used in one JSX file.

- Q: Should `--color-primary-dark` saturation be reduced (from 70% to ~55%) in the initial change, or deferred?
  - Why operator input is required: Reducing the dark-mode green saturation is a visual preference judgement. The operator raised this as a concern but it is a separate adjustment from the blue-removal work. Decision affects whether this is bundled or deferred.
  - Decision impacted: Scope of the token changes in this task.
  - Decision owner: operator
  - Default assumption + risk: Default to include it (single-token change, low risk, aligns with stated goal of making dark mode feel less vivid). Risk: might change perceived brand feel in dark mode.

## Confidence Inputs

- Implementation: 92%
  - Evidence: All edit surfaces are identified and confirmed. The change is a token value edit + CSS regeneration + class name update (if renaming). No API, database, or multi-system change. Would raise to 95% only if the operator confirms the rename-vs-value-only decision.
  - What raises to ≥80: Already above threshold.
  - What raises to ≥90: Operator confirmation of naming direction. Already at 92%.

- Approach: 82%
  - Evidence: The correct approach (edit `tokens.ts`, regenerate CSS, update Tailwind config and class strings) is clear. One design decision remains: exact hue values for replacement shades and chart-1.
  - What raises to ≥80: Already above threshold.
  - What raises to ≥90: Settling on specific HSL values for warmGreenShades and chart-1 amber replacement — can be done in analysis without operator input.

- Impact: 85%
  - Evidence: Visual impact on the bar POS grid (5 shade rows × light+dark) and on 2 chart components is confirmed. Hospitality-info booking colours are not affected. Impact is visually significant but technically low-risk.
  - What raises to ≥80: Already above threshold.
  - What raises to ≥90: Manual visual review post-deploy confirming the improvement.

- Delivery-Readiness: 88%
  - Evidence: All code surfaces identified. Token generator script located. Build process understood. 3–4 files to edit.
  - What raises to ≥80: Already above threshold.
  - What raises to ≥90: Operator confirmation of naming choice.

- Testability: 70%
  - Evidence: No automated tests for token values exist; visual harmony is not automatable. A snapshot test for `tokens.ts` values could be added but is not required.
  - What raises to ≥80: Adding a token-values snapshot test.
  - What raises to ≥90: Visual regression tooling (not currently present in the project).

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Partial update: token renamed in `tokens.ts` but `useProducts.ts` class strings not updated → mixed-drinks products silently lose background colour | Medium (easy to forget the string coupling) | Medium (visual regression on the bar POS grid) | Must update all three files atomically in a single PR; add explicit note in plan |
| `tokens.css` not regenerated after `tokens.ts` edit → live site still shows blue | Medium (manual step) | Medium | Add regeneration step as an explicit task in the plan; validate by diffing `tokens.css` post-edit |
| Accidentally changing `--color-info` or `--hospitality-info` tokens while editing the reception token file | Low (they are in `packages/themes/base/tokens.css`, not `reception/tokens.ts`) | High (breaks booking status colours in the room grid) | Clear separation confirmed in investigation; plan must explicitly list which files to edit |
| Dark mode variants of new warmGreenShades use wrong lightness → poor contrast | Medium (new token values need calibration) | Low (visual, not functional) | Follow the darkening pattern of existing greenShades: ~50% saturation reduction, lightness 22–30% |
| chart-1 and chart-6 warm replacements too similar to each other or to chart-3 (hsl 25) → charts lose differentiation | Medium (amber ~36 and chart-3 ~25 are only ~11 deg apart; chart-7 at hsl 160 occupies the green-teal range) | Low (chart readability only) | Spread warm replacements: chart-1 at ~42–48 (amber), chart-6 at ~52–58 (golden-yellow) to stay ≥15 deg from chart-3 (25) and ≥15 deg from chart-7 (160). Exact values to be validated in analysis against full 7-token palette. |

## Planning Constraints & Notes

- Must-follow patterns:
  - Edit `packages/themes/reception/src/tokens.ts` (source of truth), then regenerate `packages/themes/reception/tokens.css` via `scripts/build-tokens.ts`.
  - Update `receptionShadeColors` in `apps/reception/tailwind.config.mjs` to add/rename key if family is renamed.
  - Update class name strings in `apps/reception/src/hooks/data/bar/useProducts.ts` if token family is renamed.
  - Do NOT edit `packages/themes/base/tokens.css` — hospitality-info tokens are in the base package and must remain unchanged.
- Rollout/rollback expectations:
  - Rollback = revert `tokens.ts` and `tokens.css` changes; no migration, no data change.
  - No feature flag required; this is a purely visual change with no user-facing behaviour toggle.
- Observability expectations:
  - None. No metrics or logs are relevant to a colour token change.

## Suggested Task Seeds (Non-binding)

1. DECIDE: operator confirms rename-vs-value-only for `blueShades` tokens (unblocks task 2).
2. IMPLEMENT: Update `packages/themes/reception/src/tokens.ts` — add `warmGreenShades-row1` through `row5` (or update `blueShades` values in-place); update `--chart-1` to amber hsl; update `--chart-6` to a warm/green tone (not blue); optionally reduce `--color-primary-dark` saturation. Regenerate `tokens.css`.
3. IMPLEMENT: Update `apps/reception/tailwind.config.mjs` — add/rename `warmGreenShades-rowN` keys in `receptionShadeColors`.
4. IMPLEMENT: Update `apps/reception/src/hooks/data/bar/useProducts.ts` — update 28 product entries in category 8 to use new class names.
5. VALIDATE: Manual visual check of bar POS grid and dashboard charts in light + dark mode.

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - `packages/themes/reception/src/tokens.ts` updated with new shade values and warm replacements for `--chart-1` and `--chart-6`.
  - `packages/themes/reception/tokens.css` regenerated (no blue in the blueShades position).
  - `apps/reception/tailwind.config.mjs` updated with matching utility names.
  - `apps/reception/src/hooks/data/bar/useProducts.ts` updated with matching class name strings.
  - CI passes (lint, typecheck, existing tests).
- Post-delivery measurement plan:
  - Visual review: open bar POS and dashboard in light and dark mode; confirm no blue competes with green; confirm booking status colours (room grid) are unchanged.

## Evidence Gap Review

### Gaps Addressed

- Confirmed that `blueShades-rowN` tokens are exclusively used in `useProducts.ts` (mixed-drinks) and `tailwind.config.mjs` — no other consumers.
- Confirmed that `--hospitality-info` / `--color-info` (booking status blue) are entirely separate tokens in a different package and are out of scope.
- Confirmed that `--chart-1` (hsl 240 60% 44%) appears in two components via `hsl(var(--chart-1))` inline; no config layer in between.
- Confirmed the token generation pipeline: `tokens.ts` → `build-tokens.ts` → `tokens.css`; `tokens.css` is committed generated output.
- Identified the existing green shade family (`greenShades-row1/2/3`) which provides a reference pattern for hue/saturation/lightness steps.

### Confidence Adjustments

- Adjusted delivery-readiness upward (initially estimated 75%, raised to 88%) after confirming the precise three-file change surface and finding no hidden consumers of `blueShades`.
- Testability remains at 70% — no automated colour-value tests exist; this is a known gap but acceptable for a visual token change.

### Remaining Assumptions

- Assumed that replacing `--chart-1` and `--chart-6` with warm tones will not create conflicts with existing `--chart-3` (hsl 25), `--chart-4` (hsl 347), and `--chart-5` (hsl 174). Analysis must verify the full chart palette separation before settling on exact values.
- Assumed that `scripts/build-tokens.ts` correctly regenerates `packages/themes/reception/tokens.css` when run. Not confirmed by test — assume confirmed by the existing generated file structure.
- Assumed that 5 rows of `warmGreenShades` at hue 110–130 will provide sufficient visual differentiation between products in the mixed-drinks category. Exact values to be settled in analysis.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Token source-of-truth identification | Yes | None | No |
| `blueShades` consumer scan (all files) | Yes | None — confirmed 2 consumers only | No |
| `hospitality-info` / booking status separation | Yes | None — confirmed separate package, separate token chain | No |
| Chart token consumers | Yes | None — 2 components; `--chart-1` (hsl 240) in both; `--chart-6` (hsl 199) in MenuPerformanceDashboard. Both are blue and within scope. | No |
| Token generation pipeline | Yes | None — build-tokens.ts confirmed, script path confirmed | No |
| Test landscape coverage | Yes | Minor: no token-value tests exist; visual validation must be manual | No |
| Dark mode variant pattern | Yes | None — existing greenShades dark variants provide a clear template | No |
| Tailwind config coupling | Yes | None — receptionShadeColors confirmed as the utility registration point | No |

## Scope Signal

Signal: right-sized

Rationale: The change surface is three to four files (tokens.ts, tokens.css generated, tailwind.config.mjs, useProducts.ts). The hospitality-info booking state colours are confirmed out of scope. There are no database, API, or multi-system changes. All consumers of the tokens are identified. The open question (rename vs value-only) does not block the investigation; it is a planning decision. The scope is realistic for a single build iteration.

## Analysis Readiness

- Status: Ready-for-analysis
- Blocking items: None
- Recommended next step: `/lp-do-analysis reception-colour-system-direction`
