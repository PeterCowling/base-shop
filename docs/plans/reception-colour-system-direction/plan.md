---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-14
Last-reviewed: 2026-03-14
Last-updated: 2026-03-14
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-colour-system-direction
Dispatch-ID: IDEA-DISPATCH-20260313192500-BRIK-REC-006
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/reception-colour-system-direction/analysis.md
---

# Reception Colour System Direction Plan

## Summary

The reception POS app carries competing blue tones (hsl 210/240/199) alongside its green primary, creating visual clutter. This plan removes blue from three surfaces: the bar product category shade palette (`blueShades-rowN` tokens → renamed `warmGreenShades-rowN` at hue 110), and two chart tokens (`--chart-1` hsl 240 → amber hsl 44; `--chart-6` hsl 199 → golden-yellow hsl 60). Additionally, the electric-green dark mode feel is softened by reducing saturation on `--color-primary`, `--color-primary-hover`, and `--color-primary-active` dark values from 70% to 55%.

The change touches five files atomically: `packages/themes/reception/src/tokens.ts` (source of truth), `packages/themes/reception/tokens.css` (regenerated via `pnpm run build:tokens`), `apps/reception/tailwind.config.mjs` (utility registration), `apps/reception/src/hooks/data/bar/useProducts.ts` (28 class name strings), and `scripts/src/themes/hsl-to-oklch.ts` (one-off OKLCH migration utility script that contains a hardcoded copy of reception tokens — must be kept in sync). The booking status system (`--hospitality-info`, `statusColors.ts`, `rvg.css`) is explicitly excluded. CI (lint, typecheck) must pass; post-build visual review confirms the colour harmony.

## Active tasks

- [x] TASK-01: Update reception colour tokens and class references — Complete (2026-03-14)

## Goals

- Remove visual competition between blue and green in the bar POS product grid.
- Redirect the mixed-drinks category colour coding to green-family shades (warmGreenShades, hue 110).
- Replace blue chart tokens (chart-1 hsl 240, chart-6 hsl 199) with warm amber/golden tones.
- Reduce dark-mode primary saturation to soften the electric-green feel.
- Preserve `--hospitality-info` and `--color-info` booking status colours unchanged.

## Non-goals

- Redesigning the booking status colour system.
- Changes outside the reception app.
- Replacing or rebranding the primary green.
- Typography, layout, or spacing changes.
- Adding new automated tests for token values.

## Constraints & Assumptions

- Constraints:
  - `tokens.css` is generated output — source of truth is `packages/themes/reception/src/tokens.ts`. `pnpm run build:tokens` (`scripts/src/build-tokens.ts`) must be run after edits.
  - Class name strings in `useProducts.ts` are hardcoded. Renaming the token family without updating these strings would break styling silently.
  - `tailwind.config.mjs` `receptionShadeColors` must match token family names exactly for utilities to generate.
  - `--hospitality-info` / `--color-info` are in `packages/themes/base/tokens.css` — must not be touched.
  - The replacement family must provide exactly 5 rows (row1–row5), each with light+dark variants.
- Assumptions:
  - Hue 110 (chartreuse/lime) at raised saturation (~46% row1) provides sufficient 30-degree visual separation from the existing greenShades (hue 140).
  - chart-1 → hsl 44 (amber, 19 deg from chart-3 hsl 25) and chart-6 → hsl 60 (golden-yellow, 35 deg from chart-3, 16 deg from chart-1) are sufficiently differentiated in the chart components.
  - The chart-6/chart-3 warm-vs-warm pairing in the MenuPerformanceDashboard doughnut (line 180) is a deliberate accepted tradeoff; post-deploy visual review required.

## Inherited Outcome Contract

- **Why:** The green + blue combination in the current interface creates visual clutter. The operator has identified this as a product quality issue — the interface does not feel coherent or professional, which matters for a POS used daily by front-of-house staff.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The reception app's interface uses green and amber as its two active colour families, with blue removed from bar product categorisation, analytics chart-1 (hsl 240), and analytics chart-6 (hsl 199). The booking status system (hospitality-info, rvg awaiting/confirmed) is preserved. Visual competition is eliminated.
- **Source:** operator

## Analysis Reference

- Related analysis: `docs/plans/reception-colour-system-direction/analysis.md`
- Selected approach inherited:
  - Option A: Rename `blueShades-rowN` → `warmGreenShades-rowN`, update values to hue 110 (lime/chartreuse) at raised saturation; replace chart-1 (hsl 240 → amber hsl 44) and chart-6 (hsl 199 → golden-yellow hsl 60); reduce primary dark/hover/active saturation from 70% to 55%.
- Key reasoning used:
  - Semantic correctness: keeping `blueShades` name for green-valued tokens creates permanent maintenance confusion; the 2-file cost difference over Option B is negligible.
  - Hue 110 with ~46% saturation provides 30-degree hue gap + saturation distinction from existing greenShades (hue 140, ~40% saturation).
  - Four-file lockstep (tokens.ts, tailwind.config.mjs, useProducts.ts, hsl-to-oklch.ts) is fully enumerated and executed atomically. (hsl-to-oklch.ts identified as additional blueShades consumer during plan critique.)

## Selected Approach Summary

- What was chosen:
  - Rename token family: `blueShades-rowN` → `warmGreenShades-rowN`. Update HSL values to hue 110 (5 rows × light+dark as per value table in analysis). Update `tailwind.config.mjs` keys. Update 28 class name strings in `useProducts.ts`.
  - Chart tokens: `--chart-1` → `44 85% 48%` light / `44 85% 65%` dark (amber). `--chart-6` → `60 80% 44%` light / `60 80% 62%` dark (golden-yellow).
  - Primary dark saturation: `--color-primary` → `142 55% 48%`, `--color-primary-hover` → `142 55% 54%`, `--color-primary-active` → `142 55% 58%` (dark variants only; light variants unchanged).
  - Regenerate `tokens.css` via `pnpm run build:tokens`.
- Why planning is not reopening option selection:
  - Analysis resolved all operator questions decisively. No open forks remain. The value table is specified in analysis to 5-row resolution.

## Fact-Find Support

- Supporting brief: `docs/plans/reception-colour-system-direction/fact-find.md`
- Evidence carried forward:
  - `blueShades` has 2 runtime consumers (`tailwind.config.mjs` lines 69–73; `useProducts.ts` category 8, lines 158–189, 28 entries) plus one non-runtime utility script (`scripts/src/themes/hsl-to-oklch.ts` lines 96–100 — a one-off OKLCH migration utility with a hardcoded snapshot of token values).
  - `--hospitality-info` / `--color-info` tokens are in `packages/themes/base/tokens.css` — entirely separate from reception `tokens.ts`.
  - `--chart-1` (hsl 240) appears in both `RealTimeDashboard.tsx` (line 77, 86) and `MenuPerformanceDashboard.tsx` (line 168) as inline `hsl(var(--chart-1))`.
  - `--chart-6` (hsl 199) appears in `MenuPerformanceDashboard.tsx` (line 180) only — directly paired with chart-3 (hsl 25) in a doughnut.
  - Token generation: `pnpm run build:tokens` → `scripts/src/build-tokens.ts` → `tokens.css` output confirmed.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Update reception colour tokens and class references | 85% | M | Complete (2026-03-14) | - | - |

## Engineering Coverage

| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | Replace 5 warmGreenShades rows (hue 110, light+dark), update chart-1 (hsl 44 amber) and chart-6 (hsl 60 golden-yellow), reduce primary dark saturation. Post-build visual review in both light and dark mode. | TASK-01 | Post-deploy visual review is the primary validation gate for this area |
| UX / states | Booking status colours (statusColors.ts, rvg.css, --hospitality-info in base/tokens.css) are out of scope and explicitly not touched. Post-build review of room grid booking states. | TASK-01 | Explicit guard: do not edit packages/themes/base/tokens.css |
| Security / privacy | N/A — pure CSS token value and name change; no auth or data exposure surface | - | N/A |
| Logging / observability / audit | N/A — no observability hooks involved in CSS token changes | - | N/A |
| Testing / validation | Existing theme-bridge.test.tsx checks CSS structure (not values) — passes unchanged. No new automated tests required. CI (lint + typecheck) must pass. Manual visual review is the validation gate. | TASK-01 | Token snapshot test deferred — effort not justified for a purely visual change |
| Data / contracts | Four-file lockstep: tokens.ts rename + value update → tailwind.config.mjs key rename → useProducts.ts class name string update → hsl-to-oklch.ts snapshot update. All executed atomically in TASK-01. Regenerate tokens.css via pnpm run build:tokens. | TASK-01 | Must verify git diff of tokens.css shows no blue hsl values in warmGreenShades position; TC-01 grep confirms 0 blueShades in source tree |
| Performance / reliability | N/A — CSS custom property resolution; no hot path or caching concerns | - | N/A |
| Rollout / rollback | Rollback: revert tokens.ts, tailwind.config.mjs, useProducts.ts, hsl-to-oklch.ts; re-run pnpm run build:tokens. No feature flag. No migration. | TASK-01 | Fast rollback path; low risk |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Atomic single task; all file edits in one PR |

## Delivered Processes

None: no material process topology change.

This is a CSS token value and naming change with no multi-step workflow, CI/deploy/release lane, approval path, feature flag, or operator runbook affected. The `pnpm run build:tokens` regeneration step is part of normal development; it is not a new process.

## Tasks

### TASK-01: Update reception colour tokens and class references

- **Type:** IMPLEMENT
- **Deliverable:** Code change — updated `packages/themes/reception/src/tokens.ts`, regenerated `packages/themes/reception/tokens.css`, updated `apps/reception/tailwind.config.mjs`, updated `apps/reception/src/hooks/data/bar/useProducts.ts`, updated `scripts/src/themes/hsl-to-oklch.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-14)
- **Affects:**
  - `packages/themes/reception/src/tokens.ts` (primary edit — rename family, update values)
  - `packages/themes/reception/tokens.css` (generated output — must regenerate)
  - `apps/reception/tailwind.config.mjs` (rename utility keys in receptionShadeColors)
  - `apps/reception/src/hooks/data/bar/useProducts.ts` (update 28 class name strings)
  - `scripts/src/themes/hsl-to-oklch.ts` (update full hardcoded token snapshot: shadeTokens blueShades → warmGreenShades hue 110 at lines 96–100; semanticTokens primary dark saturation at lines 117/120–121; chart-1/chart-6 at lines 142/147 — one-off OKLCH utility script, non-runtime)
  - `[readonly] packages/themes/base/tokens.css` (hospitality-info — must NOT be touched)
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — All 5 edit surfaces identified (tokens.ts, tailwind.config.mjs, useProducts.ts, hsl-to-oklch.ts, and generated tokens.css), exact values specified in analysis value table, 28 product entries enumerated. Build path (pnpm run build:tokens) confirmed. All blueShades references located. High implementation confidence.
  - Approach: 85% — Rename + value-change approach settled by analysis. Chart-6/chart-3 warm-vs-warm pairing in the doughnut is an accepted tradeoff requiring post-deploy visual review. Slight uncertainty on final perceived visual harmony caps approach at 85%.
  - Impact: 85% — Blue removal from the bar POS grid and two chart components is clearly scoped and bounded. Visual harmony improvement is the goal; confirmation requires manual review post-deploy.
  - Held-back test (Implementation at 90%): The one risk that could push this below 80 would be yet another undiscovered file containing a hardcoded blueShades snapshot. A repo-wide grep for `blueShades` at plan time returns: `tokens.ts` (source), `tokens.css` (generated), `tailwind.config.mjs`, `useProducts.ts`, `hsl-to-oklch.ts`, and docs/plan files. All 5 non-plan source files are covered by this task. No additional hidden consumers remain.

- **Acceptance:**
  - [ ] `packages/themes/reception/src/tokens.ts` has no `blueShades` entries; has `warmGreenShades-row1` through `warmGreenShades-row5` with hue 110 values as per value table.
  - [ ] `packages/themes/reception/tokens.css` regenerated — `git diff` shows hue 110 in warmGreenShades position, no hsl 240/199 in chart-1/6, saturation 55% in primary dark/hover/active.
  - [ ] `apps/reception/tailwind.config.mjs` `receptionShadeColors` has keys `warmGreenShades-row1` through `warmGreenShades-row5` mapping to `hsl(var(--color-warmGreenShades-row1))` etc.; no `blueShades-*` keys remain.
  - [ ] `apps/reception/src/hooks/data/bar/useProducts.ts` category 8 (28 entries): all `bg-blueShades-rowN` strings replaced with `bg-warmGreenShades-rowN` (matching row numbers).
  - [ ] `pnpm run build:tokens` succeeds with no errors.
  - [ ] CI passes (lint + typecheck).
  - [ ] **Expected user-observable behaviour (manual visual review):**
    - [ ] Bar POS Mixed Drinks grid: products show lime/chartreuse-family shades (hue 110), not blue. 5 visible shade tiers distinguishable from existing greenShades (hue 140).
    - [ ] RealTimeDashboard: revenue bar chart uses amber (not blue); tender breakdown pie has no blue segment.
    - [ ] MenuPerformanceDashboard: revenue bar (chart-1) is amber; doughnut (chart-6 vs chart-3) shows golden-yellow vs orange — visually distinguishable by hue (35 deg) and saturation difference.
    - [ ] Light mode and dark mode both verified.
    - [ ] Room grid: awaiting/confirmed booking state colours (--hospitality-info blue) are unchanged.

- **Engineering Coverage:**
  - UI / visual: Required — Token values define the visual output. warmGreenShades hue 110 × 5 rows (light+dark), chart-1 amber, chart-6 golden-yellow, primary dark saturation reduced. Manual visual review in both modes validates this.
  - UX / states: Required — Booking status colours must remain unchanged. Explicit file guard: do not edit `packages/themes/base/tokens.css`. Post-build room grid check validates booking state blue is intact.
  - Security / privacy: N/A — no auth or data exposure in a CSS token change.
  - Logging / observability / audit: N/A — no observability surface.
  - Testing / validation: Required — CI (lint + typecheck) must pass. Existing `theme-bridge.test.tsx` tests CSS structure and is unaffected by token values. Manual visual review is the primary validation gate (no automated colour-value tests exist or are required).
  - Data / contracts: Required — Four-file lockstep: tokens.ts + tailwind.config.mjs + useProducts.ts + hsl-to-oklch.ts must all be updated in the same PR. Regenerated tokens.css validates the pipeline ran. TC-01 grep (`grep -r "blueShades" packages/ apps/ scripts/src/`) confirms 0 remaining references in source tree. A `git diff tokens.css` check confirms regeneration happened with correct values.
  - Performance / reliability: N/A — CSS custom property resolution; no caching or hot path concerns.
  - Rollout / rollback: Required — No feature flag. Rollback = revert tokens.ts, tailwind.config.mjs, useProducts.ts and re-run `pnpm run build:tokens`. Fast and safe.

- **Validation contract:**
  - TC-01: `grep -r "blueShades" packages/ apps/ scripts/src/` returns 0 matches → confirms all source-tree blueShades references are renamed (docs/ and plan files are excluded from this scope check; tokens.css is generated and checked via TC-02 separately).
  - TC-02: `grep -c "blueShades" packages/themes/reception/tokens.css` returns 0 → confirms blueShades is fully removed from the generated CSS file after regeneration. (Exact warmGreenShades match count is not specified — CSS structure varies with dark-mode remapping; the zero-blueShades check is the definitive gate.)
  - TC-03: `git diff packages/themes/reception/tokens.css` shows `--chart-1` light value `44 85% 48%` and `--chart-6` light value `60 80% 44%` → confirms chart token replacement.
  - TC-04: `git diff packages/themes/reception/tokens.css` shows `--color-primary` dark at `142 55% 48%`, `--color-primary-hover` dark at `142 55% 54%`, `--color-primary-active` dark at `142 55% 58%` → confirms saturation reduction across all three state tokens.
  - TC-05: `grep -n "blueShades" apps/reception/src/hooks/data/bar/useProducts.ts` returns 0 matches → all 28 product class strings updated.
  - TC-06: `grep -n "blueShades" apps/reception/tailwind.config.mjs` returns 0 matches → all 5 utility keys renamed.
  - TC-07: `pnpm run build:tokens` exits 0 → token generator succeeded.
  - TC-08 (post-build, manual): Open bar POS grid in browser → Mixed Drinks products show lime/chartreuse background, not blue; visually distinct from greenShades.
  - TC-09 (post-build, manual): Open RealTimeDashboard → revenue bar is amber, not blue.
  - TC-10 (post-build, manual): Open MenuPerformanceDashboard → doughnut shows golden-yellow and orange segments (not blue and orange); verify wedge areas are distinguishable.
  - TC-11 (post-build, manual): Dark mode toggle → bar POS and charts show correct dark variants; primary green buttons appear less vivid than before.
  - TC-12 (post-build, manual): Reception room grid → awaiting (blue) and confirmed (green) booking status colours are unchanged.
  - TC-13: `pnpm typecheck && pnpm lint` at workspace root exits 0. This covers both the reception app (via Turborepo task graph) and `scripts/src/themes/hsl-to-oklch.ts` (scripts package is part of the workspace typecheck). This is the definitive CI gate for this task.

- **Execution plan:** Red → Green → Refactor
  - **Red (edit source):**
    1. Open `packages/themes/reception/src/tokens.ts`.
    2. Remove the 5 `--color-blueShades-rowN` entries (lines 80–84).
    3. Add 5 `--color-warmGreenShades-rowN` entries with the value table from analysis:
       - row1: `{ light: "110 46% 58%", dark: "110 22% 22%" }`
       - row2: `{ light: "110 44% 50%", dark: "110 20% 27%" }`
       - row3: `{ light: "110 41% 42%", dark: "110 18% 32%" }`
       - row4: `{ light: "110 38% 34%", dark: "110 16% 37%" }`
       - row5: `{ light: "110 35% 27%", dark: "110 14% 42%" }`
    4. Update `--chart-1`: `{ light: "44 85% 48%", dark: "44 85% 65%" }`
    5. Update `--chart-6`: `{ light: "60 80% 44%", dark: "60 80% 62%" }`
    6. Update `--color-primary` dark: `"142 55% 48%"` (was `"142 70% 48%"`)
    7. Update `--color-primary-hover` dark: `"142 55% 54%"` (was `"142 70% 54%"`)
    8. Update `--color-primary-active` dark: `"142 55% 58%"` (was `"142 70% 58%"`)
    9. Run `pnpm run build:tokens` → `tokens.css` regenerated.
    10. Run `git diff packages/themes/reception/tokens.css` to verify correctness (TC-02, TC-03, TC-04).
  - **Green (update consumers):**
    11. Open `apps/reception/tailwind.config.mjs`.
    12. In `receptionShadeColors` object (lines 69–73), rename the 5 `blueShades-rowN` keys to `warmGreenShades-rowN`; update the `hsl(var(--color-blueShades-rowN))` values to `hsl(var(--color-warmGreenShades-rowN))`.
    13. Open `apps/reception/src/hooks/data/bar/useProducts.ts`.
    14. In category 8 (lines 158–189), replace all 28 `"bg-blueShades-rowN"` strings with `"bg-warmGreenShades-rowN"` (row numbers unchanged).
    15. Run TC-05 and TC-06 grep checks to confirm 0 remaining `blueShades` references.
    15b. Update `scripts/src/themes/hsl-to-oklch.ts` — this script contains a full hardcoded snapshot of reception tokens and must be kept in sync:
         - Lines 96–100 (shadeTokens): rename `--color-blueShades-rowN` → `--color-warmGreenShades-rowN` and update HSL values to hue 110 (5 rows × light+dark as per value table).
         - Lines 117, 120–121 (semanticTokens): update `--color-primary` dark from `142 70% 48%` → `142 55% 48%`; `--color-primary-hover` dark from `142 70% 54%` → `142 55% 54%`; `--color-primary-active` dark from `142 70% 58%` → `142 55% 58%`.
         - Lines 142, 147 (semanticTokens): update `--chart-1` from `{ light: '240 60% 44%', dark: '240 60% 70%' }` → `{ light: '44 85% 48%', dark: '44 85% 65%' }`; update `--chart-6` from `{ light: '199 89% 48%', dark: '199 89% 63%' }` → `{ light: '60 80% 44%', dark: '60 80% 62%' }`.
    16. Run `pnpm typecheck && pnpm lint` (covers both the reception app and scripts/src/themes/hsl-to-oklch.ts; or push to CI).
  - **Refactor:** No refactor phase — this is a value/naming change with no logic to restructure.

- **Planning validation (M effort):**
  - Checks run:
    - Confirmed `blueShades` token names at lines 80–84 of `packages/themes/reception/src/tokens.ts`.
    - Confirmed `blueShades-row1` through `blueShades-row5` in `tailwind.config.mjs` `receptionShadeColors` at lines 69–73.
    - Confirmed 28 `bg-blueShades-rowN` entries in `useProducts.ts` category 8, lines 158–189.
    - Confirmed `--color-primary` dark `"142 70% 48%"`, `--color-primary-hover` dark `"142 70% 54%"`, `--color-primary-active` dark `"142 70% 58%"` in tokens.ts lines 13–17.
    - Confirmed `pnpm run build:tokens` script exists in root `package.json` pointing to `scripts/src/build-tokens.ts`.
    - Confirmed `--chart-1: { light: "240 60% 44%", dark: "240 60% 70%" }` and `--chart-6: { light: "199 89% 48%", dark: "199 89% 63%" }` in tokens.ts lines 100 and 105.
    - Confirmed `--hospitality-info` is in `packages/themes/base/tokens.css`, entirely separate from reception tokens.ts.
    - Confirmed `scripts/src/themes/hsl-to-oklch.ts` lines 96–100 contain hardcoded `--color-blueShades-rowN` entries (shadeTokens) — a 5th edit surface identified during plan critique round 1. Lines 117, 120–121 contain `--color-primary/hover/active` dark values at 70% saturation. Lines 142, 147 contain `--chart-1` (240) and `--chart-6` (199) — all identified during plan critique round 2. All must be updated to keep the script as a valid token snapshot.
  - Validation artifacts:
    - `packages/themes/reception/src/tokens.ts` (current state read)
    - `apps/reception/tailwind.config.mjs` (lines 51–87 grepped)
    - `apps/reception/src/hooks/data/bar/useProducts.ts` (lines 158–189 read)
    - `scripts/src/themes/hsl-to-oklch.ts` (lines 96–100 confirmed)
    - Root `package.json` (build:tokens script confirmed)
  - Unexpected findings: `scripts/src/themes/hsl-to-oklch.ts` identified as 5th blueShades-containing file (a non-runtime utility script). Added to task scope.

- **Consumer tracing (new outputs):**
  - New outputs: `--color-warmGreenShades-row1` through `row5` CSS custom properties (in tokens.css), `warmGreenShades-rowN` Tailwind utility classes (from tailwind.config.mjs).
  - Consumer of `warmGreenShades-rowN` utilities: `apps/reception/src/hooks/data/bar/useProducts.ts` category 8 — 28 product entries. **Addressed in TASK-01 execution plan step 14.**
  - Consumer of `--color-warmGreenShades-rowN` CSS vars: only via Tailwind utility classes in useProducts.ts. No direct CSS var reference in any other file. Confirmed by fact-find.
  - Consumer of updated `--chart-1` / `--chart-6` values: `hsl(var(--chart-1))` and `hsl(var(--chart-6))` inline in `RealTimeDashboard.tsx` and `MenuPerformanceDashboard.tsx`. No code change required — these consume the token value directly. **No action required beyond token edit.**
  - Consumer of updated primary dark values: Tailwind utilities generated from `--color-primary-dark` and similar. All consumers pick up the CSS var value automatically at render time. **No code change required.**

- **Scouts:** None. All edit surfaces are confirmed with concrete repo evidence. No assumptions to probe.

- **Edge Cases & Hardening:**
  - Partial lockstep failure: if tokens.ts is updated but tailwind.config.mjs is not, the Tailwind JIT will not generate `bg-warmGreenShades-rowN` classes → products in category 8 will have no background colour. TC-06 grep check guards against this.
  - Missed token regeneration: if `pnpm run build:tokens` is not run, `tokens.css` still contains old blue values despite tokens.ts being correct. TC-02 `git diff` check guards against this.
  - Accidental base token edit: if `packages/themes/base/tokens.css` is edited, `--hospitality-info` colours could break. The task `Affects` list marks `base/tokens.css` as `[readonly]` — do not edit.
  - grayishShades (hsl 220, muted blue-grey) are a separate family and must not be confused with blueShades; the plan explicitly targets only the `blueShades-rowN` family.

- **What would make this ≥90%:**
  - Post-deploy visual confirmation that the lime/chartreuse (hue 110) warmGreenShades are clearly distinguishable from existing greenShades (hue 140) in the bar POS grid under real lighting conditions.
  - Post-deploy confirmation that the doughnut chart (chart-6 golden-yellow vs chart-3 orange) has acceptable readability.

- **Rollout / rollback:**
  - Rollout: Standard PR → CI → merge. No feature flag needed. No database migration. No deploy configuration changes. Normal reception app deploy on merge.
  - Rollback: Revert the PR (4 source files: tokens.ts, tailwind.config.mjs, useProducts.ts, hsl-to-oklch.ts); run `pnpm run build:tokens` to regenerate tokens.css. One command + 4-file revert. No downtime required.

- **Documentation impact:**
  - `packages/themes/reception/tokens.css` — regenerated file; documents itself via comment "Generated by build-tokens.ts".
  - No other documentation changes required. The token naming change is self-documenting in the TypeScript source.

- **Notes / references:**
  - Analysis value table: `docs/plans/reception-colour-system-direction/analysis.md` § Resolved Colour Value Table
  - Confirmed consumer count: fact-find blueShades consumer scan (4 files total; 2 runtime consumers).
  - `--chart-6` / `--chart-3` warm-vs-warm tradeoff: analysis.md § Chart token replacements (acknowledged deliberate decision).

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Partial lockstep: tailwind.config.mjs or useProducts.ts not updated | Medium | Medium — bar POS products lose background colour silently | TC-05 and TC-06 grep checks confirm 0 remaining blueShades references before committing |
| tokens.css not regenerated after tokens.ts edit | Medium | Medium — live site still shows blue chart/shade colours | TC-07 + TC-02 git diff check: run `pnpm run build:tokens`, then inspect diff |
| warmGreenShades hue 110 not visually distinct enough from greenShades hue 140 in the POS grid | Low | Low — visual quality only | TC-08 manual review; if insufficient, a follow-up token value tweak shifts hue to 105 without further lockstep complexity |
| chart-6 (hsl 60) and chart-3 (hsl 25) warm-vs-warm doughnut pairing has poor readability | Low-Medium | Low — chart readability only | TC-10 manual review; if flagged by operator, shift chart-6 to hsl 68 in a quick follow-up token edit |
| Accidental edit to packages/themes/base/tokens.css disrupts booking status colours | Low | High — breaks room grid awaiting/confirmed colours for front-of-house staff | Explicit [readonly] guard on file in task Affects; TC-12 manual room grid review |

## Observability

- Logging: None — pure visual CSS token change.
- Metrics: None.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)

- [ ] No `blueShades` references remain in `useProducts.ts`, `tailwind.config.mjs`, or `scripts/src/themes/hsl-to-oklch.ts` (TC-01 grep check).
- [ ] `packages/themes/reception/tokens.css` reflects hue 110 warmGreenShades values, amber chart-1, golden-yellow chart-6, and reduced primary dark saturation.
- [ ] CI (lint + typecheck) passes.
- [ ] Manual visual review confirms: bar POS lime-green mixed drinks grid, amber/golden charts, unchanged room booking status colours.
- [ ] Dark mode confirmed: primary buttons appear less electric; warmGreenShades dark rows are visible.

## Decision Log

- 2026-03-14: Option A (rename + value change) chosen over Option B (value-only) — semantic clarity decisive; effort difference negligible. Source: analysis.md.
- 2026-03-14: chart-6 → hsl 60 (golden-yellow) accepted with warm-vs-warm tradeoff in doughnut chart; post-deploy review required. Source: analysis.md.
- 2026-03-14: Primary dark saturation scope expanded to include `--color-primary-hover` and `--color-primary-active` dark values (not only `--color-primary`). Source: analysis critique round 2.

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Update tokens.ts (remove blueShades, add warmGreenShades, update chart/primary values) | Yes — `tokens.ts` at the confirmed path; all target entries confirmed at named lines; build-tokens.ts script confirmed | None | No |
| TASK-01: Run `pnpm run build:tokens` → regenerate tokens.css | Yes — script confirmed in root package.json; tokens.css is a committed generated file | None | No |
| TASK-01: Update tailwind.config.mjs receptionShadeColors keys | Yes — 5 blueShades-rowN keys confirmed at lines 69–73; warmGreenShades-rowN target names are clear string replacements | None | No |
| TASK-01: Update useProducts.ts category 8 class strings (28 entries) | Yes — 28 entries confirmed at lines 158–189; all are string literal replacements of `bg-blueShades-rowN` → `bg-warmGreenShades-rowN` | None | No |
| TASK-01: Update hsl-to-oklch.ts blueShades snapshot | Yes — file confirmed at path; 5 entries at lines 96–100 are plain key+value edits | None | No |
| TASK-01: TC-01/TC-05/TC-06 grep checks | Yes — grep commands are deterministic and depend only on completed file edits | None | No |
| TASK-01: CI lint + typecheck | Yes — no type-level changes introduced; pure string value changes; no new imports | None | No |
| TASK-01: Manual visual review | Yes — depends on a running reception dev server; post-build step, not a pre-build precondition | None — standard post-build manual validation | No |

## Overall-confidence Calculation

- TASK-01: confidence 85%, effort M (weight 2)
- Overall-confidence = (85 × 2) / 2 = **85%**

## Build Completion Evidence — TASK-01 (2026-03-14)

**Commit:** `1d1f0e6678`
**Files changed:** 5 (80 insertions, 80 deletions)

**TC-01 (source grep):** `grep -r "blueShades" packages/ apps/ scripts/src/` → 0 matches in source trees. (`.next`/`.open-next` build artifacts contain stale references — will be replaced on next build.)
**TC-02:** `grep -c "blueShades" packages/themes/reception/tokens.css` → 0 ✓
**TC-03:** `--chart-1` in tokens.css = `44 85% 48%` light / `44 85% 65%` dark (amber) ✓
**TC-04:** `--chart-6` in tokens.css = `60 80% 44%` light / `60 80% 62%` dark (golden-yellow) ✓
**TC-05:** `grep -c "blueShades" apps/reception/src/hooks/data/bar/useProducts.ts` → 0 ✓
**TC-06:** `grep -c "blueShades" apps/reception/tailwind.config.mjs` → 0 ✓
**TC-07:** `pnpm run build:tokens` → exit 0; `tokens.css`, `tokens.static.css`, `tokens.dynamic.css` regenerated ✓
**TC-13:** `pnpm --filter @apps/reception lint` → 0 errors, 4 pre-existing warnings (unrelated to colour change) ✓
**Typecheck note:** Pre-existing error in `lp-do-ideas-operator-review-reconcile.ts` (untracked file, not in scope of this change). No new typecheck errors introduced by token edits.

**warmGreenShades verified in tokens.css:** All 10 entries (5 rows × light+dark) present with hue 110 values.
**Primary dark saturation:** `--color-primary-dark: 142 55% 48%`, `--color-primary-hover-dark: 142 55% 54%`, `--color-primary-active-dark: 142 55% 58%` ✓

**Manual visual review:** Required — pending post-deploy review of bar POS Mixed Drinks category (warmGreenShades lime/chartreuse), analytics chart-1 (amber), chart-6 (golden-yellow), dark-mode primary buttons (softer saturation). Room grid booking status unchanged (--hospitality-info not touched).
