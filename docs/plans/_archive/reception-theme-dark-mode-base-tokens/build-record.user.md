---
Type: Build-Record
Plan-Slug: reception-theme-dark-mode-base-tokens
Business: BRIK
Created: 2026-03-08
Status: Complete
---

# Build Record — Reception Visual Depth Follow-On

## Summary

Executed a two-task wave deepening the reception app's dark OKLCH token values and introducing three interaction-depth semantic tokens, then consuming them on the highest-value table and workspace surfaces.

## Tasks Completed

| Task | Status | Commit |
|------|--------|--------|
| TASK-01: Update dark tokens + add interaction-depth tokens | Complete | `36e7a53d8d` |
| TASK-02: Consume new tokens in BookingRow, CheckoutTable, ThreadList | Complete | `dc980f8f27` |
| CHECKPOINT-01: Local gates (typecheck + lint) | Complete | — |

## What Was Done

**TASK-01 — Token deepening:**
- Updated 17 dark OKLCH values in `packages/themes/reception/src/tokens.ts`:
  - Surfaces: L steps increased from ~0.05 to 0.060–0.070; chroma raised from 0.003–0.006 to 0.012–0.022; hue unified at 165
  - Text: `--color-fg` raised to L=0.950 (crisper); `--color-fg-muted` reduced to L=0.560 (clearer hierarchy)
  - Borders: chroma raised to 0.016–0.028 (borders now read as structural lines)
  - Primary: brighter dark mode green (L=0.780, C=0.210)
- Added 3 new interaction-depth tokens: `--color-table-row-hover`, `--color-table-row-alt`, `--color-surface-elevated`
- Regenerated `tokens.css` via `pnpm build:tokens`
- Registered new tokens in `apps/reception/src/app/globals.css @theme` block
- All contrast checks passed (`pnpm tokens:contrast:check` exits 0)

**TASK-02 — Token consumption:**
- `BookingRow.tsx`: `hover:bg-surface-2` → `hover:bg-table-row-hover odd:bg-table-row-alt`
- `CheckoutTable.tsx`: removed manual `rowBg` index-alternation; replaced with `hover:bg-table-row-hover odd:bg-table-row-alt transition-colors`
- `ThreadList.tsx`: isSelected ternary on `<button>` only — `bg-surface-2` → `bg-surface-elevated`, `hover:bg-surface-2/50` → `hover:bg-table-row-hover`; all 4 other `bg-surface-2` usages (structural/badge surfaces) preserved

**Controlled scope expansions (TASK-01):**
- `inbox/route.ts`: pre-existing TS2322 type assertion fix
- `firebaseAuth.ts`: pre-existing import sort lint fix
- `SafeReconcileForm.tsx`: pre-existing unused-arg rename

## Validation Passed

- `pnpm build:tokens` ✅
- `pnpm tokens:drift:check` ✅
- `pnpm tokens:contrast:check` ✅
- `pnpm --filter @apps/reception typecheck` ✅ (both tasks)
- `pnpm --filter @apps/reception lint` ✅ (exits 0; 8 pre-existing warnings only)

## Outcome Contract

- **Why:** Reception staff use this app all day. The dark palette was too flat after Wave 1 shell work — surfaces didn't distinguish, borders read as suggestions, and the green atmosphere that makes it feel like hospitality tooling was absent.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Routes already on the shared reception shell (check-in, checkout) and the inbox workspace thread list now have visibly better depth, hierarchy, and interaction feedback. Staff can scan check-in and checkout rows with zebra rhythm and clear hover states. The inbox selected thread is clearly anchored.
- **Source:** operator

## Pending (Post-Deploy)

- Visual QA on `/checkin`, `/checkout`, `/inbox` in dark mode after dev→staging→main deploy — run `lp-design-qa`, `tools-ui-contrast-sweep` (explicit dark mode), `tools-ui-breakpoint-sweep`
- Auto-fix any Critical/Major findings before sign-off
