---
Type: Design-Spec
Status: Draft
Feature-Slug: reception-theme-styling-cohesion
Business-Unit: BRIK
Target-App: reception
Theme-Package: packages/themes/reception
Brand-Language: None — internal staff tool; no brand dossier for reception app. Design reference: packages/themes/reception/src/tokens.ts
Created: 2026-03-08
Updated: 2026-03-08
Owner: operator
---

# Design Spec: Reception Screen Archetype System — Wave 1

## Context

**Business:** Brikette (BRIK)
**App:** reception (`apps/reception/`)
**Audience:** Hostel staff (receptionists, managers) — operational context, dense information, low error tolerance. Desktop-first; touch is incidental, not primary.
**Device:** Desktop-first (1024px+ primary). Tablet (768px+) secondary. No mobile requirement.

**Feature goal:** Staff can navigate any operational screen (check-in, checkout) within a consistent, predictable visual container — same gradient, same padding, same header pattern — so the UI recedes and the data is foregrounded.

**Fact-find:** `docs/plans/reception-theme-styling-cohesion/fact-find.md`

**GATE-BD-07:** Waived. Reception is an internal staff operational tool with no customer-facing brand identity. Design language is governed by `packages/themes/reception/src/tokens.ts` — green terminal aesthetic, high-contrast status signals, dark-mode-first surface system.

---

## Visual Intent

Reception screens should feel like a focused workstation: a consistent dark-to-slightly-lighter gradient anchors every screen to the same backdrop, a sharp green accent bar on the left of each screen title draws the eye immediately to the screen name, and action buttons sit flush-right without competing with the title. The overall atmosphere is operational readiness — no decorative noise, no brand personality play, just clear signal and easy data scanning.

---

## Screen Archetypes

### OperationalTableScreen *(Wave 1 — migrate check-in and checkout)*

The canonical archetype for screens that present a filterable/sortable data table as their primary content. Gradient background, standard padding, ScreenHeader (accent bar + title), optional ActionRail (role-gated buttons), optional FilterToolbar (caller-injected controls), TableCard (surface container for the data table).

**Routes:** `/checkin`, `/checkout` (and future: prepayments, search, etc.)

### OperationalWorkspaceScreen *(Wave 2 — deferred)*

Split-pane or canvas-oriented screens (inbox, reports, dashboard). Different layout geometry; not in Wave 1 scope.

### POSFullBleedScreen *(Non-migrating carve-out)*

Bar POS screen (`/bar`). Full-bleed, no standard header, no gradient backdrop — POS grid requires edge-to-edge real estate. **Excluded from all archetype migration waves.** Bar-specific layout is owned by `Bar.tsx` and must not be touched by archetype changes. Any `AuthenticatedApp` wrapper changes must verify bar POS geometry is unaffected (explicit acceptance criterion in TASK-02).

---

## Decision Log

### Decision A — Gradient Ownership

**Chosen:** `OperationalTableScreen` owns the gradient. `AuthenticatedApp` strips its gradient entirely.

**Rationale:**
- `AuthenticatedApp` currently applies `bg-gradient-to-b from-surface to-surface-1` as app chrome — this is the outermost layer and causes the first of three nested gradients.
- `PageShell` applies `bg-gradient-to-b from-surface-2 to-surface-3` — the per-screen gradient, which is the correct layer.
- `CheckinsTableView` applies its own gradient (`from-[var(--color-bg)] to-surface-1`) — a third nested layer from a custom shell.
- **Winner:** `OperationalTableScreen` uses `bg-gradient-to-b from-surface-2 to-surface-3` (PageShell's existing class string). `AuthenticatedApp` removes its gradient class. No CSS gradient must appear in `AuthenticatedApp` after TASK-02.

**Exact class string for `OperationalTableScreen`:**
```
bg-gradient-to-b from-surface-2 to-surface-3
```

### Decision B — AuthenticatedApp Padding Disposition

**Chosen:** `p-6` removed from `AuthenticatedApp` entirely. `OperationalTableScreen` provides `p-4` via inheritance from PageShell's current contract.

**Rationale:**
- `AuthenticatedApp`'s `p-6` was inherited from before per-screen shells existed. With `OperationalTableScreen` now owning layout, the application chrome should be zero-padding: screens control their own geometry.
- `POSFullBleedScreen` (bar) explicitly requires zero outer padding — removing `AuthenticatedApp`'s `p-6` benefits bar directly. **TASK-02 must verify bar POS layout is unchanged after removal.**
- `OperationalTableScreen` inner padding: `p-4` (matches PageShell's existing contract, preserved for all 17 current consumers).

**After TASK-02:**
- `AuthenticatedApp`: no gradient, no `p-6`. App chrome only: `min-h-screen`, `max-w-6xl`, `mx-auto`, `border-l border-r border-border-1/50`, `shadow-xl`.
- `OperationalTableScreen`: owns `bg-gradient-to-b from-surface-2 to-surface-3 min-h-80vh p-4`.

### Decision C — Heading Text Token (Opacity Canon)

**Chosen:** `text-foreground` — full foreground color, no opacity modifier.

**Evidence from current workspace (post in-flight sweep):**
- `PageShell.tsx`: `text-foreground` (line 37)
- `CheckinsHeader.tsx`: `text-foreground tracking-wide` (line 48)
- Both have already converged on `text-foreground`. The `text-primary-main/80` cited in earlier planning is no longer present in either file.

**Canon:** `ScreenHeader` heading uses `text-foreground`. `text-primary-main` is used only for the accent bar (`bg-primary-main`). No opacity modifier on text.

---

## Component Map

### Reused Components

| Component | Package | Usage |
|---|---|---|
| `Inline` (from `@acme/design-system/primitives`) | `@acme/design-system` | ActionRail button row layout |
| `PageShell` (will be evolved into `OperationalTableScreen`) | `apps/reception` | Base to evolve — do not create a new file alongside |

### New Components (Wave 1)

| Component | Target Package | Rationale |
|---|---|---|
| `OperationalTableScreen` | `apps/reception/src/components/common/` | Evolved from `PageShell`. The canonical screen wrapper for table-workflow routes. |
| `ScreenHeader` | `apps/reception/src/components/common/` | Extracted from `CheckinsHeader`'s title area pattern. Provides accent bar + title + optional right slot. |
| `ActionRail` | `apps/reception/src/components/common/` | Extracted from `CheckinsHeader`'s action button area. Slot-based, caller provides role-gated buttons. |
| `FilterToolbar` | `apps/reception/src/components/common/` | New. Slot-based (`children: ReactNode`). Caller injects date selector + any control siblings. |
| `TableCard` | `apps/reception/src/components/common/` | New. Surface wrapper for data table content. |

### Composition Tree

```
OperationalTableScreen
├── headerSlot? (optional override — replaces ScreenHeader entirely when provided)
│   └── (caller renders custom header — used by InboxWorkspace, RoomsGrid in Wave 2)
├── ScreenHeader (default when no headerSlot)
│   ├── [accent bar]
│   ├── title (h1)
│   └── children? (right-slot — e.g., badge, status chip)
├── ActionRail? (optional)
│   └── children: ReactNode (role-gated buttons: NewBookingButton, EditButton, etc.)
├── FilterToolbar? (optional)
│   └── children: ReactNode (DateSelector | DaySelector, "Rooms Ready" toggle, search input)
└── TableCard? (optional — for table-layout screens; workspace screens may omit)
    └── children: ReactNode (table rows, headers, modals as siblings at container level)
```

---

## Prop Contracts

### `OperationalTableScreen`

```typescript
interface OperationalTableScreenProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  /** Override the default ScreenHeader with a custom header node */
  headerSlot?: React.ReactNode;
}
```

- `headerSlot` preserves PageShell's `headerSlot` API for forward compatibility with `InboxWorkspace` and `RoomsGrid` (both deferred to Wave 2).
- `withoutGradient` prop is **dropped** — zero live callers confirmed in current workspace.

### `ScreenHeader`

```typescript
interface ScreenHeaderProps {
  title: string;
  /** Optional right-side slot — e.g., status badge, record count */
  children?: React.ReactNode;
  className?: string;
}
```

- Renders: `<div className="mb-6 flex items-center justify-between">`
  - Left: `<div className="flex items-center gap-3">` → accent bar + h1
  - Right: `{children}` (flex-end, optional)
- Accent bar: `h-7 w-1 rounded-full bg-primary-main` (canonical from PageShell — `h-7`, not `h-8`)
- Title: `text-2xl font-heading font-semibold text-foreground`

### `ActionRail`

```typescript
interface ActionRailProps {
  children: React.ReactNode;
  className?: string;
}
```

- Renders: `<div className="mb-4 flex items-center justify-end gap-2">` → flush-right, caller provides role-gated buttons
- No internal role checks — caller is responsible for conditional rendering

### `FilterToolbar`

```typescript
interface FilterToolbarProps {
  children: React.ReactNode;
  className?: string;
}
```

- Renders: `<div className="mb-4 flex items-center gap-3 flex-wrap">` → horizontal flex row, wraps on narrow viewport
- Date selection is **caller-injected** — `checkins/DateSelector` (role-aware, popup) and `checkout/DaySelector` (unrestricted, inline) are both valid children. No unification in Wave 1.
- "Rooms Ready" toggle and other controls are siblings in the same flex row as the date selector — all passed as children.
- **FilterToolbar does not own access policy.** Role-gating is the responsibility of caller-provided children.

### `TableCard`

```typescript
interface TableCardProps {
  children: React.ReactNode;
  className?: string;
}
```

- Renders: `<div className="bg-surface rounded-lg border border-border-1/50 overflow-hidden">` → surface container with subtle border
- Contains: table header + rows. Modals rendered **outside** `TableCard` (as siblings in the `OperationalTableScreen` children, not inside the card) to preserve portal/z-index independence.

---

## Token Binding

All tokens from `packages/themes/reception/src/tokens.ts` unless noted as base.

| Element | Property | Token Class | Dark Mode | Source |
|---|---|---|---|---|
| Screen background | background (gradient) | `bg-gradient-to-b from-surface-2 to-surface-3` | auto | `tokens.ts` `--surface-2`, `--surface-3` |
| Screen min-height | layout | `min-h-80vh` | n/a | CSS (not a token) |
| Screen padding | layout | `p-4` | n/a | Tailwind spacing |
| Accent bar | background | `bg-primary-main` | auto | `tokens.ts` `--color-primary` |
| Screen title h1 | color | `text-foreground` | auto | `tokens.ts` `--color-fg` |
| Screen title h1 | font-family | `font-heading` | n/a | `tokens.ts` `--font-heading` (inherited Inter) |
| Screen title h1 | font-size | `text-2xl` | n/a | Tailwind |
| Screen title h1 | font-weight | `font-semibold` | n/a | Tailwind |
| TableCard surface | background | `bg-surface` | auto | base tokens `--surface` |
| TableCard border | border | `border-border-1/50` | auto | `tokens.ts` `--color-border-muted` |
| Action button focus ring | outline | `focus-visible:ring-2 ring-primary-main` | auto | `tokens.ts` `--color-focus-ring` |
| App chrome border | border | `border-border-1/50` | auto | `tokens.ts` `--color-border-muted` |

**New tokens required:** None — all required tokens exist in the reception theme package.

---

## Layout

### Desktop (default — 1024px+, primary use case)

```
AuthenticatedApp chrome (max-w-6xl, mx-auto, border-l border-r)
└── OperationalTableScreen (from-surface-2 to-surface-3, min-h-80vh, p-4)
    ├── ScreenHeader            [title left, right-slot right — full width]
    ├── ActionRail (optional)   [right-aligned buttons — full width]
    ├── FilterToolbar (optional)[horizontal flex row of controls — full width]
    └── TableCard               [full width, rounded-lg surface]
        └── [data table]
```

### Tablet (`md:` 768px+)

No structural change from desktop. `p-4` padding maintained. Horizontal filter controls may wrap (`flex-wrap` on FilterToolbar).

### Mobile

Reception is not a mobile-optimised app. No explicit mobile layout changes in Wave 1. Operator must accept functional-but-unoptimised rendering on small viewports. Wave 1 does not worsen the existing mobile state.

**Spacing summary:**
- Screen outer padding: `p-4` (all sides)
- ScreenHeader bottom margin: `mb-6`
- ActionRail bottom margin: `mb-4`
- FilterToolbar bottom margin: `mb-4`
- Accent bar dimensions: `h-7 w-1 rounded-full`
- Gap between accent bar and title: `gap-3`
- ActionRail button gap: `gap-2`
- FilterToolbar control gap: `gap-3`

---

## Interaction States

| Element | Hover | Active | Disabled | Focus |
|---|---|---|---|---|
| Action buttons (existing) | per-button token | per-button token | `opacity-50 cursor-not-allowed` | `focus-visible:ring-2 ring-primary-main ring-offset-1` |
| FilterToolbar controls (caller-provided) | caller-defined | caller-defined | caller-defined | `focus-visible:ring-2 ring-primary-main ring-offset-1` |
| TableCard rows (caller-provided) | caller-defined | caller-defined | — | — |

Note: `OperationalTableScreen`, `ScreenHeader`, `ActionRail`, `FilterToolbar`, and `TableCard` are layout/container primitives — they have no interactive states themselves. All interaction states belong to their children.

---

## Accessibility

- **Focus order:** Screen title is not focusable. First focusable element is the first ActionRail button (if present), then FilterToolbar controls, then table rows. Tab order follows DOM order — no manual `tabindex` needed.
- **ARIA:** `h1` in ScreenHeader is the page landmark title. One `h1` per screen. `aria-hidden="true"` on the decorative accent bar (`<div>` — already implemented in PageShell and CheckinsHeader).
- **Contrast:** `text-foreground` on `from-surface-2 to-surface-3` gradient — both are reception-theme tokens with adequate contrast in light and dark modes. Verified pattern: PageShell already uses this exact combination without accessibility failures.
- **Touch targets:** `OperationalTableScreen` primitives are layout containers only. Touch target requirements (`min-h-11 min-w-11`) are the responsibility of button components inside ActionRail and FilterToolbar — these are pre-existing components with their own sizing.
- **Screen reader:** `ScreenHeader` renders a visible `h1` — no additional visually-hidden text needed. Accent bar has `aria-hidden="true"`.
- **Reduced motion:** No animations in any Wave 1 primitive. No `motion-safe:` prefix needed.

---

## `AuthenticatedApp` Post-TASK-02 Contract

After TASK-02 completes, `AuthenticatedApp.tsx` must contain:

```tsx
<div className="min-h-screen">
  <div className="w-full max-w-6xl mx-auto border-l border-r border-border-1/50 shadow-xl">
    {children}
  </div>
  <AppModals ... />
</div>
```

- **Removed:** `bg-gradient-to-b from-surface to-surface-1` (gradient — moved to OperationalTableScreen)
- **Removed:** `<div className="p-6">` wrapper (padding — dropped; each screen owns its geometry)
- **Preserved:** `min-h-screen`, `max-w-6xl`, `mx-auto`, `border-l border-r border-border-1/50`, `shadow-xl`, `AppModals`

**Bar POS check (TASK-02 requirement):** After removing `p-6`, verify `Bar.tsx` renders without layout overflow or unexpected whitespace. `Bar.tsx` uses `AuthenticatedApp` without `PageShell` — it must render edge-to-edge within `max-w-6xl` after the `p-6` removal.

---

## `withoutGradient` Disposition

**Dropped** when evolving PageShell into `OperationalTableScreen`. Verified: zero live callers in current workspace (`grep -r "withoutGradient" apps/reception/src/` returns zero results). No migration needed.

---

## Prerequisites for Plan

- [x] Theme package exists: `packages/themes/reception/`
- [x] All required tokens exist (see Token Binding above — no new tokens needed)
- [x] `PageShell.tsx` has zero `withoutGradient` callers (safe to drop prop)
- [x] `headerSlot` used by `InboxWorkspace.tsx` and `RoomsGrid.tsx` only (both deferred; prop preserved in OperationalTableScreen API)
- [ ] Gradient class string confirmed in TASK-02: `bg-gradient-to-b from-surface-2 to-surface-3` (verify against Tailwind v4 token resolution for `surface-2`/`surface-3`)
- [ ] Bar POS layout verified after AuthenticatedApp `p-6` removal (TASK-02 acceptance)

---

## QA Matrix

Pre-populated for `lp-design-qa` use in TASK-05 (checkout alignment verification) and post-TASK-04 (check-in migration).

| Element | Expected token / class | QA domain | Check ID |
|---|---|---|---|
| Screen background | `bg-gradient-to-b from-surface-2 to-surface-3` | tokens | TC-01 |
| Screen padding | `p-4` on OperationalTableScreen root | layout | TC-01 |
| AuthenticatedApp — no gradient | zero matches for `bg-gradient` in `AuthenticatedApp.tsx` | tokens | TC-02 |
| AuthenticatedApp — no p-6 | zero matches for `p-6` in `AuthenticatedApp.tsx` | layout | TC-02 |
| Accent bar | `h-7 w-1 rounded-full bg-primary-main` | tokens + visual | TC-03 |
| Screen h1 | `text-2xl font-heading font-semibold text-foreground` | tokens + visual | TC-03 |
| ScreenHeader layout | `flex items-center justify-between mb-6` | layout | TC-03 |
| ActionRail layout | `flex items-center justify-end gap-2 mb-4` | layout | TC-04 |
| FilterToolbar layout | `flex items-center gap-3 flex-wrap mb-4` | layout | TC-04 |
| TableCard surface | `bg-surface rounded-lg border border-border-1/50 overflow-hidden` | tokens + visual | TC-05 |
| Modals | rendered outside TableCard (sibling in OperationalTableScreen, not inside card) | structure | TC-06 |
| headerSlot forwarding | OperationalTableScreen renders `headerSlot` when provided, skips ScreenHeader | structure | TC-07 |
| Checkout alignment | `/checkout` renders via OperationalTableScreen without additional code changes | visual | VR-01 |
| Check-in check | `/checkin` renders via OperationalTableScreen with all 4 primitives | visual | VR-02 |
| Bar POS unchanged | `/bar` layout unchanged after AuthenticatedApp changes | visual | VR-03 |
| Accent bar a11y | `aria-hidden="true"` on decorative `<div>` | a11y | A11Y-01 |
| Focus ring | `focus-visible:ring-2 ring-primary-main ring-offset-1` on interactive children | a11y | A11Y-02 |
| Mobile non-regression | no visual worse than pre-Wave-1 on < 768px | responsive | RS-01 |

---

## Notes

- `ScreenHeader` is intentionally simple — no sub-navigation, no breadcrumbs, no tabs. Those are Wave 2 patterns.
- `ActionRail` and `FilterToolbar` are **optional** slots. Screens that have no actions (e.g., reports view) simply omit them. `OperationalTableScreen` must not render empty placeholder divs for optional slots.
- `TableCard` is also optional. `OperationalWorkspaceScreen` (Wave 2) will likely not use `TableCard` — it has its own surface geometry.
- The accent bar height is canonicalized at `h-7` (PageShell's current value). `CheckinsHeader`'s `h-8` is treated as drift and will be corrected during check-in migration (TASK-04).
- The `tracking-wide` class on `CheckinsHeader`'s h1 is not included in `ScreenHeader`'s canon. It was an ad-hoc addition on a custom header. `ScreenHeader` uses default tracking.
