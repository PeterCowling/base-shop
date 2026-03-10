# TASK-01: RoomsGrid CSS Module — Full Scope

**Plan:** reception-ui-screen-polish
**Date:** 2026-02-26
**Status:** Investigation complete

---

## 1. File List

All files under `apps/reception/src/components/roomgrid/`:

| File | Type | Role |
|------|------|------|
| `RoomsGrid.tsx` | TSX (top-level) | Outer container — date controls, iterates rooms |
| `RoomGrid.tsx` | TSX | Single-room wrapper — imports CSS module, drives ReservationGrid |
| `RoomGrid.module.css` | CSS Module | Scoped overrides for `.rvg-*` global classes |
| `ReservationGrid.tsx` | TSX | Re-export of Grid + DndProvider wrapper; imports `rvg.css` |
| `_ReservationGrid.tsx` | TSX | Thin re-export (delegates to `_g.tsx`) |
| `_g.tsx` | TSX | Alternate Grid entry without DndProvider; imports `rvg.css` |
| `_BookingTooltip.tsx` | TSX | Floating tooltip — uses `style={{}}` for position only |
| `BookingDetailsModal.tsx` | TSX | Booking detail modal — no inline colors |
| `GridCell.tsx` | TSX | Legacy grid cell — applies `backgroundColor` via `style={{}}` from statusColors |
| `rvg.css` | Global CSS | RVG root token definitions and table/cell layout rules |
| `_reservationGrid.css` | Global CSS | Older legacy variant (not imported by production components) |
| `constants/statusColors.ts` | TS | Maps status strings to CSS custom property references |
| `constants/theme.ts` | TS | THEME constant — all values reference `--rvg-*` CSS variables |
| `constants/locales.ts` | TS | Day name translations — no color values |
| `components/Grid/Grid.tsx` | TSX | Table scaffold — no color values |
| `components/Header/Header.tsx` | TSX | Header row — no color values |
| `components/Row/Row.tsx` | TSX | Data row — no color values |
| `components/Row/RowCell.tsx` | TSX | Cell with DnD — `style={{ opacity }}` only, no color |
| `components/Day/Day.tsx` | TSX | Day type dispatcher |
| `components/Days/SingleFull.tsx` | TSX | SVG: full booking — receives `topColor` as prop |
| `components/Days/SingleStart.tsx` | TSX | SVG: arrival — receives `topColor` as prop |
| `components/Days/SingleEnd.tsx` | TSX | SVG: departure — receives `topColor` as prop |
| `components/Days/SingleFree.tsx` | TSX | SVG: free day — receives `topColor` as prop |
| `components/Days/SingleDisabled.tsx` | TSX | SVG: disabled — receives `topColor` as prop |
| `components/Days/Intersection.tsx` | TSX | SVG: overlap — receives `topColor`+`bottomColor` as props |
| `components/Day/utils/styleUtils/styleUtils.ts` | TS | createTheme/setVariables — no hardcoded colors |

---

## 2. Hardcoded Color Values Enumeration

### 2a. In Active Production Source (non-test files)

**Result: 0 hardcoded hex/rgb values in active production CSS or TSX files.**

The only hardcoded hex values in the directory appear inside `RoomsGrid.tsx`, but they are entirely within a **commented-out** block (a dead code CSS template string that was never used). The comment block spans lines 20–56 of `RoomsGrid.tsx`.

### 2b. Commented-Out Block in RoomsGrid.tsx (Dead Code)

These values are not rendered — they exist only inside a `/* ... */` comment:

| Hex Value | Context (fallback for CSS var) | Semantic Meaning |
|-----------|-------------------------------|------------------|
| `#DDEBF3` | `var(--color-border, #DDEBF3)` | Border (light blue) |
| `#FFFFFF` | `var(--color-background, #FFFFFF)` | Background white |
| `#E4FFE6` | `var(--color-today, #E4FFE6)` | Today highlight (light green) |
| `#F8FAFB` | `var(--color-weekend, #F8FAFB)` | Weekend (near white) |
| `#759AB5` | `var(--date-status-disabled, #759AB5)` | Disabled (muted blue) |
| `#DDEBF3` | `var(--date-status-awaiting, #DDEBF3)` | Awaiting (light blue — same as border fallback) |
| `#006490` | `var(--date-status-confirmed, #006490)` | Confirmed (strong blue) |

**Count: 7 distinct hardcoded hex values (all in dead commented-out code)**

### 2c. Test Files (excluded from production scope)

Test files under `__tests__/` contain additional hardcoded hex values used as test fixtures. These do not affect production rendering and are out of scope for migration.

---

## 3. Token Mapping Table

All 7 commented-out fallback values map cleanly to existing reception tokens:

| Hardcoded Hex | Approximate HSL | Candidate Token | Token Value |
|---------------|-----------------|-----------------|-------------|
| `#DDEBF3` (border/awaiting) | hsl(205 40% 88%) | `--reception-signal-info-bg` → `hsl(var(--hospitality-info))` | Already used in `statusColors.ts` for `awaiting` |
| `#FFFFFF` (background) | hsl(0 0% 100%) | `--color-bg` | `0 0% 100%` in tokens.css |
| `#E4FFE6` (today) | hsl(126 100% 94%) | `--color-success-soft` or `hsl(var(--color-success) / 0.12)` | Defined in globals.css |
| `#F8FAFB` (weekend) | hsl(210 13% 98%) | `--surface-2` (hsl `150 4% 96%`) or `--color-inset` | Close match in tokens.css |
| `#759AB5` (disabled) | hsl(207 30% 58%) | `--reception-signal-warning-fg` | Already used in `statusColors.ts` for `disabled` |
| `#006490` (confirmed) | hsl(201 100% 28%) | `--reception-signal-info-fg` | Already used in `statusColors.ts` for `confirmed` |

**Note:** The commented-out block is dead code. The live system already uses the correct tokens via `statusColors.ts` and `rvg.css`. No migration of these fallbacks is required unless the dead code block is revived.

---

## 4. Inline Style Props — Split

### Inline `style={{}}` usage in production TSX files:

| File | Line | Style Content | Color-bearing? |
|------|------|---------------|----------------|
| `components/Row/RowCell.tsx` | 158 | `style={{ opacity: isDragging ? 0.5 : 1 }}` | No — opacity only |
| `_BookingTooltip.tsx` | 31–36 | `style={{ position: "fixed", top: y+10, left: x+10, zIndex: 10000 }}` | No — positioning only |
| `GridCell.tsx` | 128–129 | `style={{ backgroundColor }}` where `backgroundColor` comes from `statusColors` lookup | Yes — indirect |

**`GridCell.tsx`** is the only file that writes a color via inline style, but the value it writes is always a CSS custom property reference string (e.g. `"var(--reception-signal-info-bg)"`) returned by `statusColors.ts` — never a hardcoded hex.

**`RowCell.tsx`** in `components/Row/` uses `topColor`/`bottomColor` as SVG `fill` prop values passed to Day variant components. These values also originate from `theme["date.status"]` which maps to CSS custom property strings via `statusColors.ts`. No hardcoded hex values in the render path.

---

## 5. CSS Custom Properties Used by the Grid

### 5a. RVG internal tokens (defined in `rvg.css`)

| Custom Property | Light Value | Dark Value (`.dark`) |
|-----------------|-------------|----------------------|
| `--rvg-color-text` | `hsl(var(--color-foreground))` | `var(--reception-dark-accent-green)` |
| `--rvg-color-background` | `hsl(var(--color-bg))` | `var(--reception-dark-surface)` |
| `--rvg-color-border` | `hsl(var(--color-border-1))` | `var(--reception-dark-border)` |
| `--rvg-color-free` | `transparent` | (not overridden) |
| `--rvg-color-awaiting` | `hsl(var(--color-info-light))` | `var(--reception-dark-accent-orange)` |
| `--rvg-color-confirmed` | `hsl(var(--color-info-main))` | `var(--reception-dark-accent-green)` |
| `--rvg-color-inaccessible` | `hsl(var(--color-muted))` | `var(--reception-dark-surface)` |
| `--rvg-color-today` | `hsl(var(--color-success-light))` | `var(--reception-dark-accent-green)` |
| `--rvg-color-selected` | `hsl(var(--color-error-light))` | `var(--reception-dark-accent-orange)` |
| `--rvg-color-weekend` | `hsl(var(--color-surface-2))` | `var(--reception-dark-bg)` |

### 5b. Reception signal tokens (defined in `globals.css`, consumed by `statusColors.ts`)

| Custom Property | Resolves To |
|-----------------|-------------|
| `--reception-signal-ready-bg` | `hsl(var(--hospitality-ready))` |
| `--reception-signal-ready-fg` | `hsl(var(--hospitality-ready-fg))` |
| `--reception-signal-warning-bg` | `hsl(var(--hospitality-warning))` |
| `--reception-signal-warning-fg` | `hsl(var(--hospitality-warning-fg))` |
| `--reception-signal-info-bg` | `hsl(var(--hospitality-info))` |
| `--reception-signal-info-fg` | `hsl(var(--hospitality-info-fg))` |

### 5c. Legacy _reservationGrid.css (not actively imported)

This file defines its own parallel set of properties (`--color-background`, `--color-border`, `--date-status-*`, `--color-today`, `--color-weekend`) but is not imported by any active component. It has a `.dark {}` block referencing `theme('colors.darkSurface')` etc. — Tailwind v3 syntax that would not work under Tailwind v4. This file is orphaned.

---

## 6. Additional Observations

### Orphaned / Legacy Files

- `_reservationGrid.css`: Contains parallel CSS rules with CSS var fallbacks. Not imported anywhere in the active component tree. Can be deleted without functional impact.
- `_ReservationGrid.tsx` + `_g.tsx`: Alternate entry points that import `rvg.css` without the DnD provider. Currently not imported by `RoomGrid.tsx` (which uses the `ReservationGrid` from `ReservationGrid.tsx`). Status: legacy/alternate exports.

### Token Coherence Issue

The `rvg.css` light-mode values reference tokens like `--color-foreground`, `--color-border-1`, `--color-success-light`, `--color-error-light`, and `--color-surface-2` which are **not present in `packages/themes/reception/tokens.css`**. These are presumed to be defined elsewhere (e.g., design-system tokens or a separate CSS layer). This is worth confirming before any migration that touches `rvg.css`.

### Color Routing Architecture

The grid uses a two-layer color system:
1. **Table/cell structure** colors (background, border, today, weekend, selected) flow through `--rvg-*` CSS custom properties set by `rvg.css` and overridden by `styleUtils.setVariables()` at runtime when a `theme` prop is passed.
2. **Status/booking occupancy** colors (free, awaiting, confirmed, disabled, ready, etc.) flow through `statusColors.ts` → `theme["date.status"]` → SVG `fill` prop on Day variant components — applied as direct style attributes on SVG elements, not via CSS classes.

---

## 7. Effort Estimate for TASK-02

**S (Small)** — revised downward from plan's M estimate.

Rationale:
- Zero hardcoded color values exist in active production files. The only 7 hex values are inside a commented-out dead code block that can be deleted outright.
- The live system already routes all colors through CSS custom properties (`--rvg-*`, `--reception-signal-*`).
- `statusColors.ts` already maps every status to a properly-named token reference.
- The main work items for the migration task are:
  1. Delete the commented-out CSS block in `RoomsGrid.tsx` (~36 lines of dead code) — trivial.
  2. Delete the orphaned `_reservationGrid.css` file — trivial.
  3. Add card container wrapper (`bg-surface rounded-xl shadow-lg`) to the outer grid panel — small, self-contained.
  4. No TSX style prop changes needed; no CSS class rewriting needed.

---

## Summary

| Metric | Value |
|--------|-------|
| Total CSS files in scope | 3 (`RoomGrid.module.css`, `rvg.css`, `_reservationGrid.css`) |
| Active CSS files with hardcoded values | 0 |
| Hardcoded hex values in dead code (comments) | 7 |
| Hardcoded hex values in test fixtures | ~14 (out of scope) |
| Inline `style` props with color | 1 (`GridCell.tsx` — value always a CSS var string) |
| Inline `style` props without color | 2 (`RowCell.tsx` opacity, `_BookingTooltip.tsx` position) |
| CSS custom properties controlling color/bg/border | 10 (`--rvg-*`) + 6 (`--reception-signal-*`) |
| Token mapping candidates needed | 0 (already done) |
| Effort estimate | **S** (revised from plan's M) |
