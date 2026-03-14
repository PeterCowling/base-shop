# Build Record — Reception Colour System Direction

**Feature slug:** `reception-colour-system-direction`
**Build date:** 2026-03-14
**Status:** Complete
**Commit:** `1d1f0e6678`

---

## Outcome Contract

**Why:** The green + blue combination in the current interface creates visual clutter. The operator identified this as a product quality issue — the interface does not feel coherent or professional, which matters for a POS used daily by front-of-house staff.

**Intended Outcome Type:** operational

**Intended Outcome Statement:** The reception app's interface uses green and amber as its two active colour families, with blue removed from bar product categorisation, analytics chart-1 (hsl 240), and analytics chart-6 (hsl 199). The booking status system (hospitality-info, rvg awaiting/confirmed) is preserved. Visual competition is eliminated.

**Source:** operator

---

## What Was Done

Five source files were edited atomically to remove blue from the reception POS interface colour system and replace it with chartreuse/lime (warmGreenShades) and amber/golden tones:

1. **`packages/themes/reception/src/tokens.ts`** — Renamed `blueShades-rowN` (hue 210) → `warmGreenShades-rowN` (hue 110, raised saturation). Updated `--chart-1` (hsl 240 blue → hsl 44 amber) and `--chart-6` (hsl 199 cyan → hsl 60 golden-yellow). Reduced `--color-primary`, `--color-primary-hover`, `--color-primary-active` dark saturation from 70% → 55%.
2. **`packages/themes/reception/tokens.css`** — Regenerated via `pnpm run build:tokens`; all 10 warmGreenShades entries confirmed at hue 110; no blueShades remaining.
3. **`apps/reception/tailwind.config.mjs`** — Renamed 5 `blueShades-rowN` keys to `warmGreenShades-rowN` in `receptionShadeColors`.
4. **`apps/reception/src/hooks/data/bar/useProducts.ts`** — Replaced 28 `bg-blueShades-rowN` class strings with `bg-warmGreenShades-rowN` across the Mixed Drinks bar category.
5. **`scripts/src/themes/hsl-to-oklch.ts`** — Synced the hardcoded shade snapshot (blueShades → warmGreenShades) and semantic token values (primary/chart) to match the updated source.

The booking-status blue (`--hospitality-info` in `packages/themes/base/tokens.css`) was not touched.

---

## Engineering Coverage Evidence

| Coverage Area | Status | Evidence |
|---|---|---|
| UI / visual | Covered | warmGreenShades (hue 110, 10 CSS vars), chart-1 amber, chart-6 golden-yellow confirmed in tokens.css. Manual visual review pending post-deploy. |
| UX / states | Confirmed out of scope | `packages/themes/base/tokens.css` not modified; `--hospitality-info` unchanged; no statusColors.ts or rvg.css edits. |
| Security / privacy | N/A | Pure CSS token value and name change; no auth or data surface. |
| Logging / observability | N/A | No observability hooks involved. |
| Testing / validation | Covered | TC-01 through TC-07 passed; lint 0 errors; no new type errors from token edits. |
| Data / contracts | Covered | Four-file lockstep executed atomically in one commit. Tokens.css regenerated. hsl-to-oklch.ts synced. |
| Performance / reliability | N/A | CSS custom property resolution; no hot path concerns. |
| Rollout / rollback | Documented | Rollback: revert tokens.ts, tailwind.config.mjs, useProducts.ts, hsl-to-oklch.ts; re-run build:tokens. No feature flag. |

---

## Validation Results

| Test | Result |
|---|---|
| TC-01: `grep -r "blueShades" packages/ apps/ scripts/src/` | 0 matches ✓ |
| TC-02: `grep -c "blueShades" tokens.css` | 0 ✓ |
| TC-03: chart-1 value in tokens.css | `44 85% 48%` light / `44 85% 65%` dark ✓ |
| TC-04: chart-6 value in tokens.css | `60 80% 44%` light / `60 80% 62%` dark ✓ |
| TC-05: blueShades in useProducts.ts | 0 matches ✓ |
| TC-06: blueShades in tailwind.config.mjs | 0 matches ✓ |
| TC-07: `pnpm run build:tokens` | Exit 0; tokens.css regenerated ✓ |
| TC-13: `pnpm --filter @apps/reception lint` | 0 errors, 4 pre-existing warnings ✓ |
| Typecheck | Pre-existing error in unrelated untracked file; no new errors from token edits ✓ |

**Manual visual review (pending):** Post-deploy review required for bar POS Mixed Drinks (warmGreenShades lime), chart-1 amber bar chart, chart-6 golden-yellow analytics doughnut, dark-mode primary button saturation.

---

## Workflow Telemetry Summary

| Stage | Records | Avg modules | Avg context bytes | Avg artifact bytes |
|---|---:|---:|---:|---:|
| lp-do-fact-find | 1 | 4.00 | 72764 | 32551 |
| lp-do-analysis | 1 | 1.00 | 78241 | 23018 |
| lp-do-plan | 1 | 1.00 | 136990 | 30988 |
| lp-do-build | 1 | 2.00 | 121094 | 0 |

**Total context input:** 409,089 bytes across 4 stages. **Modules used:** 8 total.
