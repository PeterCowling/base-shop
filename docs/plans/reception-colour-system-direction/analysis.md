---
Type: Analysis
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: reception-colour-system-direction
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/reception-colour-system-direction/fact-find.md
Related-Plan: docs/plans/reception-colour-system-direction/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Reception Colour System Direction Analysis

## Decision Frame

### Summary

The reception POS app uses green as its primary colour but carries blue through three distinct surfaces: (1) five `blueShades-rowN` tokens used for the Mixed Drinks bar product category, (2) `--chart-1` (hsl 240, blue) appearing in the revenue bar chart and tender breakdown pie, and (3) `--chart-6` (hsl 199, cyan-blue) in the analytics doughnut chart. Green (hsl 142) and blue (hsl 210/240) are visually competitive at comparable saturations. The accent token (amber, hsl 36) sits ~106 degrees from green — a harmonious pairing — but is barely activated.

Two decisions must be made: (A) how to replace the blueShades palette — rename the token family or preserve the name and change only the values; and (B) exactly which warm hues replace chart-1 and chart-6 without crowding the existing warm tokens (chart-3 at hsl 25, chart-4 at hsl 347). The dark-mode primary saturation reduction (`--color-primary-dark` from 70% to 55%) is a minor sub-decision bundled into the same change.

Note on the operator outcome statement: the operator phrasing "two active colour families" describes the branding intent — removing the competing blue from the POS grid and chart-1/chart-6 so that green and amber dominate the brand-bearing surfaces. The full chart palette (chart-2 through chart-5, chart-7) includes green, orange, red, and teal as data-differentiation colours; these are data-visualisation signals, not brand colours, and the operator's scope explicitly targets only chart-1 (hsl 240) and chart-6 (hsl 199) as the blue offenders. This analysis carries that scope precisely.

### Goals

- Remove visual competition between blue and green in the bar POS product grid.
- Redirect the mixed-drinks category colour coding to green-family shades.
- Replace blue chart tokens (chart-1 hsl 240, chart-6 hsl 199) with warm amber/golden tones aligned with the accent system.
- Reduce saturation of `--color-primary` dark, `--color-primary-hover` dark, and `--color-primary-active` dark to soften the electric-green dark-mode feel coherently across all interaction states.
- Preserve `--hospitality-info` and `--color-info` booking status blue — out of scope.

### Non-goals

- Redesigning the booking status colour system (`statusColors.ts`, `rvg.css`).
- Changes outside the reception app.
- Replacing or rebranding the primary green.
- Typography, layout, or spacing changes.

### Constraints & Assumptions

- Constraints:
  - `tokens.css` is generated output — source of truth is `packages/themes/reception/src/tokens.ts`. Direct CSS edits are overwritten by `scripts/src/build-tokens.ts` (run via `pnpm run build:tokens`).
  - `blueShades-rowN` class name strings are hardcoded in `useProducts.ts` (category 8, 28 products). Renaming breaks styling unless `useProducts.ts` is also updated.
  - `tailwind.config.mjs` `receptionShadeColors` must match token family names exactly for utilities to generate.
  - `--hospitality-info` / `--color-info` are in `packages/themes/base/tokens.css` — a different package — and must not be touched.
  - The replacement shade family must provide exactly 5 rows (row1–row5), each with light and dark variants, matching the existing `blueShades` count.
- Assumptions:
  - Hue 110 (chartreuse/lime) for the new `warmGreenShades` family provides 30 degrees of hue separation from the existing `greenShades` at hue 140, and a slightly raised saturation (~46% vs greenShades ~40%) further distinguishes the two families in the bar POS grid. Hue 110 is unambiguously in the yellow-green zone and does not read as blue-adjacent.
  - Chart replacement hues of ~44 (amber) for chart-1 and ~60 (golden-yellow) for chart-6 provide ≥16 degrees of separation from each other, ≥19 degrees from chart-3 (hsl 25), and >15 degrees from chart-4 (hsl 347 → 347 and 44 are 57 degrees apart at the near side), while staying in the warm zone aligned with the accent token (hsl 36).
  - `scripts/src/build-tokens.ts` (invoked via `pnpm run build:tokens`) correctly regenerates `packages/themes/reception/tokens.css` when run.

## Inherited Outcome Contract

- **Why:** The green + blue combination in the current interface creates visual clutter. The operator has identified this as a product quality issue — the interface does not feel coherent or professional, which matters for a POS used daily by front-of-house staff.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The reception app's interface uses green and amber as its two active colour families, with blue removed from bar product categorisation, analytics chart-1 (hsl 240), and analytics chart-6 (hsl 199). The booking status system (hospitality-info, rvg awaiting/confirmed) is preserved. Visual competition is eliminated.
- **Source:** operator
- **Analysis note on scope:** The operator explicitly targets only chart-1 (hsl 240) and chart-6 (hsl 199) for blue removal. The remaining chart tokens (chart-2 green, chart-3 orange, chart-4 red, chart-5 teal, chart-7 green-teal) serve data-visualisation differentiation purposes and are intentionally kept. The "two active colour families" refers to the brand and POS grid surfaces, not the full data visualisation palette. This analysis carries the operator's explicitly stated scope without inferring a broader redesign.

## Fact-Find Reference

- Related brief: `docs/plans/reception-colour-system-direction/fact-find.md`
- Key findings used:
  - `blueShades` has exactly 2 runtime consumers beyond the token source itself: `apps/reception/tailwind.config.mjs` (registers utilities) and `apps/reception/src/hooks/data/bar/useProducts.ts` (hardcoded class name strings, 28 products in category 8).
  - `--hospitality-info` / `--color-info` tokens are in `packages/themes/base/tokens.css` — entirely separate from reception `tokens.ts` — and must not be changed.
  - `--chart-1` (hsl 240 60% 44%) appears in both `RealTimeDashboard.tsx` and `MenuPerformanceDashboard.tsx` as inline `hsl(var(--chart-1))`. `--chart-6` (hsl 199 89% 48%) appears in `MenuPerformanceDashboard.tsx` only.
  - Existing dark mode pattern for greenShades: saturation reduced ~50% and lightness ~22–30%, e.g. `greenShades-row1 dark: "140 22% 22%"`.
  - `--color-primary-dark` is currently `142 70% 48%`, `--color-primary-hover` dark is `142 70% 54%`, `--color-primary-active` dark is `142 70% 58%`. Reducing saturation to ~55% across all three produces coherent dark-mode state transitions and addresses the "electric green" concern without leaving hover/active at the previous higher saturation.
  - Full chart palette (all 7 tokens) confirmed: chart-1 (240), chart-2 (142), chart-3 (25), chart-4 (347), chart-5 (174), chart-6 (199), chart-7 (160).

## Evaluation Criteria

| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Visual harmony achieved | Primary goal — reduces blue/green competition and activates the amber palette | High |
| Change surface minimised | Fewer files = lower risk of partial update and easier review | High |
| Semantic clarity of token names | Misleading token names (blueShades containing green values) create future confusion | Medium |
| Preservation of booking status colours | Hospitality-info tokens must not be disrupted — front-of-house impact | High |
| Rollback speed | Token-only change should be trivially reversible | Medium |
| Dark mode consistency | New tokens must follow the existing darkening pattern to maintain dark mode legibility | Medium |
| Chart palette differentiation | Replacement chart hues must remain visually distinguishable in charts | Medium |

## Options Considered

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A: Rename + value change | Rename `blueShades-rowN` → `warmGreenShades-rowN`, update values to hue 110 (lime/chartreuse) family with raised saturation; update `tailwind.config.mjs` and `useProducts.ts` class strings; replace chart-1 and chart-6 with amber/golden; reduce primary dark/hover/active saturation | Semantically correct token names; hue 110 + higher saturation provides 30 deg visual separation from existing greenShades; no future confusion about blue tokens holding green values | Touches 4 files vs 2 for Option B: tokens.ts + tokens.css generated + tailwind.config.mjs + useProducts.ts (Option B omits the latter two); decisive advantage is semantic, not effort | Partial update risk if any of the 3 lockstep files are missed; chart-6 warm-vs-warm pairing with chart-3 in one doughnut component (acknowledged tradeoff, post-deploy review required) | Yes |
| B: Value-only change | Keep `blueShades-rowN` name, change only the HSL values to hue 110 family; update chart-1 and chart-6 similarly; tokens.ts + regenerated tokens.css only (2 files vs 4) | Smaller blast radius: tokens.ts and tokens.css only for shade changes; useProducts.ts and tailwind.config.mjs untouched | Token name `blueShades` permanently misleads — anyone reading the code sees "blueShades" containing lime/chartreuse hsl values; semantic debt accumulates over theme extensions | Future maintainers or customisers will be confused; token name becomes a maintenance liability | Yes |

## Engineering Coverage Comparison

| Coverage Area | Option A (Rename + value change) | Option B (Value-only change) | Chosen implication |
|---|---|---|---|
| UI / visual | Replaces 5 rows × light+dark shade values at hue 120 + 2 chart tokens; Tailwind utilities regenerate with new names; bar POS and charts update visually | Same visual outcome for end-user; token names in CSS remain misleading (`--color-blueShades-rowN` containing green hsl values) | Option A: warmGreenShades-row1 through row5 in hue 110 range (lime/chartreuse, 30 deg from greenShades), light+dark; chart-1 → hsl 44 (amber); chart-6 → hsl 60 (golden-yellow); primary dark/hover/active saturation reduced from 70% to 55% |
| UX / states | Booking status colours (`statusColors.ts`, `rvg.css`, `--hospitality-info`) are in a separate package — untouched regardless of option | Same | No booking status impact under either option; both explicitly exclude base/tokens.css |
| Security / privacy | N/A — pure visual change | N/A | N/A |
| Logging / observability / audit | N/A — no observability surface | N/A | N/A |
| Testing / validation | `theme-bridge.test.tsx` checks CSS structure not values — passes under both. No automated colour-value tests exist. Manual visual review required under both options. Option A requires verifying class name strings in `useProducts.ts` match new utility names. | Same testing gap; slightly simpler manual checklist (no class name verification needed) | Option A: manual checklist must cover bar POS class rendering + chart colours + booking status unchanged. No new automated tests required — token value snapshot test deferred (effort not justified for pure visual change). |
| Data / contracts | Renames token CSS var names (`--color-warmGreenShades-rowN`) and Tailwind utility keys. Three files must update atomically: `tokens.ts`, `tailwind.config.mjs`, `useProducts.ts`. Contract coupling is fully known and bounded. | Only `tokens.ts` changes for the shade family (plus chart tokens); Tailwind config and useProducts.ts untouched. Simpler atomicity. | Option A chosen: the 3-file lockstep is fully enumerated and low-risk given confined consumer count. Plan must sequence them as a single atomic task. |
| Performance / reliability | N/A — CSS custom property resolution; no hot path | N/A | N/A |
| Rollout / rollback | Rollback = revert `tokens.ts`, regenerate `tokens.css`, revert `tailwind.config.mjs` and `useProducts.ts` class strings. No feature flag needed. | Rollback = revert `tokens.ts`, regenerate `tokens.css` only. Slightly simpler. | Option A: rollback adds 2 files but remains trivial. No feature flag warranted for a purely visual change. |

## Chosen Approach

- **Recommendation:** Option A — rename `blueShades-rowN` to `warmGreenShades-rowN` with hue 110 (lime/chartreuse) values at raised saturation, update chart-1 to amber (hsl 44) and chart-6 to golden-yellow (hsl 60), and reduce dark-mode saturation from 70% to 55% across `--color-primary`, `--color-primary-hover`, and `--color-primary-active`.
- **Why this wins:**
  - Semantic correctness is the decisive factor. Keeping the name `blueShades` for green-hued tokens permanently misleads maintainers and anyone extending the theme. The effort difference between Option A and Option B is minimal — `useProducts.ts` is a single file with 28 enumerable string replacements, and `tailwind.config.mjs` has 5 key renames in the `receptionShadeColors` object. This is not a material burden.
  - Hue 110 (chartreuse/lime) for `warmGreenShades` provides 30 degrees of hue separation from the existing `greenShades` at hue 140, and uses slightly higher saturation (~46% vs ~40%) to amplify the family distinction further. Both families remain in the green zone while being visually distinguishable in the bar POS grid.
  - Chart-1 → hsl 44 (amber) and chart-6 → hsl 60 (golden-yellow): chart-1 is 19 degrees above chart-3 (hsl 25); chart-6 at hsl 60 is 35 degrees above chart-3 and 16 degrees above chart-1's new value (44→60 = 16 deg). Both are well separated from chart-4 (hsl 347, crimson — 57 deg away from hsl 44). Both warm replacements align with the accent system (hsl 36) and eliminate competing blue from the analytics views.
  - Dark-mode primary saturation reduction from 70% to 55% across `--color-primary` dark (`142 55% 48%`), `--color-primary-hover` dark (`142 55% 54%`), and `--color-primary-active` dark (`142 55% 58%`) addresses the electric-green concern coherently — all three state tokens shift together so hover/active states don't retain the vivid saturation that the base token sheds. Same file, same pipeline step.
- **What it depends on:** Three-file lockstep update (tokens.ts, tailwind.config.mjs, useProducts.ts) executed atomically in a single PR. CSS regeneration step via `pnpm run build:tokens` must not be skipped.

### Rejected Approaches

- Option B (value-only, keep blueShades name) — rejected because it creates a permanent semantic mismatch: `--color-blueShades-rowN` CSS variables holding green hue values. The token system is extended over time and misleading names cause real maintenance confusion. The slightly smaller blast radius does not justify the semantic debt.

### Open Questions (Operator Input Required)

None. Both operator questions from the fact-find are resolved decisively by reasoning:

1. **Rename vs value-only**: Rename wins (Option A). The effort difference is negligible; semantic clarity is the primary axis for a token system.
2. **Primary-dark saturation**: Include in this change. Single-token edit in the same file; deferral has no benefit.

## End-State Operating Model

None: no material process topology change.

This is a CSS/token value and naming change. No multi-step workflow, CI/deploy/release lane, approval path, feature flag, or operator runbook is altered. The only operational consideration is that `pnpm run build:tokens` (`scripts/src/build-tokens.ts`) must be run after editing `tokens.ts` to regenerate `tokens.css` — this is an existing build step, not a new one.

## Planning Handoff

- Planning focus:
  - Single atomic task group: edit `tokens.ts` (rename family, set hue 110 values for warmGreenShades rows 1–5 with light+dark variants per the value table below; update chart-1 to hsl 44 amber; chart-6 to hsl 60 golden-yellow; reduce --color-primary / --color-primary-hover / --color-primary-active dark saturation from 70% to 55%), run `pnpm run build:tokens` to regenerate `tokens.css`, update `tailwind.config.mjs` receptionShadeColors keys, update `useProducts.ts` class name strings.
  - Explicit value table for `warmGreenShades` (see below) to hand to build without re-deriving hue choices.
  - Confirm `--hospitality-info` / `--color-info` are not touched in `packages/themes/base/tokens.css`.
- Validation implications:
  - CI (lint, typecheck) must pass — no type-level changes expected from token edits.
  - Manual visual review post-deploy: bar POS Mixed Drinks grid (confirm green-family colouring), RealTimeDashboard (confirm chart-1 is amber not blue), MenuPerformanceDashboard (confirm chart-1 amber, chart-6 golden-yellow), reception room grid (confirm awaiting/confirmed booking states unchanged).
  - No new automated tests required — the token-value snapshot test is deferred as a nice-to-have; effort is not justified for a purely visual change with no logic paths.
- Sequencing constraints:
  - `tokens.ts` edit → `pnpm run build:tokens` → `tokens.css` regenerated → verify CSS diff shows no blue in warmGreenShades position and no hsl 240/199 in chart-1/6.
  - `tailwind.config.mjs` and `useProducts.ts` updates can be in the same commit as the token edit.
  - No migration ordering needed — no database or API surface.
- Risks to carry into planning:
  - Partial update: must treat the 3-file lockstep (tokens.ts, tailwind.config.mjs, useProducts.ts) as one atomic PR task — plan must make this explicit.
  - Missed regeneration: if `pnpm run build:tokens` is not run, `tokens.css` still shows old blue values. Plan task must include a `git diff tokens.css` check to confirm regeneration happened.
  - `grayishShades` at hsl 220 — these are a muted grey-blue and are a separate family (used for different categories). They are not in scope and should not be confused with the blueShades replacement work.

## Resolved Colour Value Table

These values are determined in analysis so planning/build does not re-litigate colour choices:

### warmGreenShades (replaces blueShades, hue 110)

Hue 110 (chartreuse/lime) sits 30 degrees below greenShades (hue 140), providing clear visual separation in the POS grid. Saturation is slightly raised (~46% at row1 vs greenShades ~40%) to amplify the hue distinction. Saturation steps down by ~3pp per row; lightness steps down ~8pp per row in light mode. Dark mode follows the established greenShades darkening pattern: saturation reduced to ~22%, lightness stepping from 22% upward.

| Token | Light (HSL triplet) | Dark (HSL triplet) |
|---|---|---|
| `--color-warmGreenShades-row1` | `110 46% 58%` | `110 22% 22%` |
| `--color-warmGreenShades-row2` | `110 44% 50%` | `110 20% 27%` |
| `--color-warmGreenShades-row3` | `110 41% 42%` | `110 18% 32%` |
| `--color-warmGreenShades-row4` | `110 38% 34%` | `110 16% 37%` |
| `--color-warmGreenShades-row5` | `110 35% 27%` | `110 14% 42%` |

### Chart token replacements

| Token | Current | Replacement | Rationale |
|---|---|---|---|
| `--chart-1` | `240 60% 44%` light / `240 60% 70%` dark | `44 85% 48%` light / `44 85% 65%` dark | Amber at hsl 44; ≥19 deg from chart-3 (hsl 25); matches accent system family |
| `--chart-6` | `199 89% 48%` light / `199 89% 63%` dark | `60 80% 44%` light / `60 80% 62%` dark | Golden-yellow at hsl 60; 35 deg from chart-3 (hsl 25); 16 deg from chart-1 replacement (44→60). Acknowledged tradeoff: in `MenuPerformanceDashboard.tsx:180` the doughnut pairs chart-6 directly with chart-3 (orange). Replacing blue with golden-yellow shifts this pairing from cool-vs-warm to warm-vs-warm. The values differ by 35 degrees in hue and substantially in saturation (80% vs 95%) and lightness (44% vs 53%) — sufficient differentiation for a doughnut chart where wedge area provides shape-coding in addition to colour. This tradeoff is deliberate: eliminating competing blue outweighs the reduced cool/warm contrast in a single doughnut. Post-deploy visual review should confirm readability. |

### Primary dark saturation (3 tokens, same saturation shift)

All three interaction-state tokens shift from 70% to 55% saturation to maintain coherent state transitions:

| Token | Current dark value | New dark value |
|---|---|---|
| `--color-primary` dark | `142 70% 48%` | `142 55% 48%` |
| `--color-primary-hover` dark | `142 70% 54%` | `142 55% 54%` |
| `--color-primary-active` dark | `142 70% 58%` | `142 55% 58%` |

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| Partial update: one of the 3 lockstep files missed in the PR | Medium | Medium — bar POS grid loses colour styling silently | Execution risk, not analysis risk | Plan must treat tokens.ts + tailwind.config.mjs + useProducts.ts as a single atomic task group; PR checklist must verify all 3 |
| `tokens.css` not regenerated after `tokens.ts` edit | Medium | Medium — live site continues showing blue | Execution risk | Plan must include explicit regeneration step and `git diff tokens.css` verification |
| warmGreenShades rows 4–5 too dark to be legible in dark mode | Low | Low — visual only | Cannot verify without rendering; values follow the greenShades darkening pattern which is proven | Manual dark mode review in post-build validation |
| chart-6 (hsl 60 golden-yellow) paired with chart-3 (hsl 25 orange) in `MenuPerformanceDashboard.tsx:180` doughnut — warm-vs-warm pairing reduces cool/warm contrast that blue previously provided | Low-Medium | Low — chart readability only | Deliberately accepted: eliminating blue competition outweighs reduced contrast in one doughnut; shape coding (wedge area) partially compensates; hue-60 and hue-25 differ by 35 deg, plus different saturation (80% vs 95%) | Post-deploy visual review of the doughnut is required; if operator flags readability, chart-6 can shift to hsl 68 (further from chart-3) without downstream impact |
| chart-1 (hsl 44) and chart-6 (hsl 60) too similar in small legend items | Low | Low — chart readability only | 16 degree separation plus saturation/lightness difference; different chart types (bar vs doughnut) in practice | Post-deploy review; chart-6 can be shifted to hsl 68 without downstream impact |
| `grayishShades` (hsl 220, muted blue-grey) confused with blueShades in the plan or PR | Low | Low | Naming risk, not analysis risk | Plan must explicitly note grayishShades is out of scope |

## Planning Readiness

- Status: Go
- Rationale: All edit surfaces confirmed, exact replacement values determined in analysis, no operator-blocking questions remain. Three-file lockstep risk is enumerated and manageable. The change is confined to token values and class name strings with no API, database, or multi-system impact.
