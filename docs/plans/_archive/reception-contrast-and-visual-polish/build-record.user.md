---
Type: Build-Record
Plan-Slug: reception-contrast-and-visual-polish
Business: BRIK
Created: 2026-03-08
Status: Complete
---

# Build Record — Reception Dark Mode Contrast and Visual Polish

## Summary

Executed a two-task wave fixing the root cause of near-invisible secondary data in the reception app's dark mode. Token values for muted text were raised and two component-level contrast issues were resolved — a 60% opacity clock icon on pending check-in rows and a 10.4px price badge in the bar POS grid.

## Tasks Completed

| Task | Status | Commit |
|------|--------|--------|
| TASK-01: Raise fg-muted and muted-fg dark token values | Complete | `58ab4561c1` |
| TASK-02: Fix StatusButton opacity and ProductGrid price badge size | Complete | `58ab4561c1` |

## What Was Done

**TASK-01 — Token raise:**
- `--color-fg-muted` dark: `oklch(0.560 0.015 165)` → `oklch(0.720 0.018 165)` in `packages/themes/reception/src/tokens.ts`
- `--color-muted-fg` dark: `oklch(0.600 0.015 165)` → `oklch(0.720 0.018 165)` in `packages/themes/reception/src/tokens.ts`
- `pnpm build:tokens` regenerated `packages/themes/reception/tokens.css` with both updated dark values
- Approximate contrast improvement: surface-2 ratio 2.44:1 → 3.08:1 (passes 3:1 large-text AA); surface-1 ratio 3.21:1 → 4.05:1
- These tokens propagate automatically via `text-muted-foreground` Tailwind alias to all components using secondary/muted text — payment amounts, balance figures, status labels in check-in rows, and any other muted text across all reception routes

**TASK-02 — Component fixes:**
- `StatusButton.tsx` code=0 state: `text-foreground/60` → `text-foreground`. Removes 60% opacity on the pending-state clock icon; contrast improves from ~2.34:1 to ~5.26:1 on surface-3. Affects `/checkin` and `/prepare` routes.
- `ProductGrid.tsx` price badge: `text-0_65rem` (10.4px) → `text-xs` (12px). Raises price label from below practical legibility floor to a minimum readable size on bar POS product buttons.

## Validation Passed

- `pnpm build:tokens` ✅
- `pnpm tokens:drift:check` ✅
- `pnpm tokens:contrast:check` ✅
- `pnpm --filter @apps/reception typecheck` ✅
- `pnpm --filter @apps/reception lint` ✅ (0 errors, 8 pre-existing warnings)

## Outcome Contract

- **Why:** Reception staff use the app all day in dark mode. Secondary data in table rows — payment amounts, balance figures, status icons, and doc status — was nearly invisible at the previous token values. Staff could not quickly scan booking state without leaning in to read, causing friction during check-in and potential errors during shift handovers.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All secondary text, status icons, and action button labels in the reception dark mode are legible at a glance without straining. Staff can scan check-in rows and read bar product prices from normal desk distance.
- **Source:** operator

## Pending (Post-Deploy)

- Visual QA on `/checkin`, `/bar`, `/prepare` in dark mode after dev → staging → main deploy
- Run `lp-design-qa`, `tools-ui-contrast-sweep` (explicit dark mode) on changed routes
- Auto-fix any Critical/Major findings before sign-off
