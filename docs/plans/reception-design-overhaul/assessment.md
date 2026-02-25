# Reception Design Overhaul — Assessment

## What We Fixed Today

| Fix | File | Impact |
|-----|------|--------|
| Cleared 1.9GB `.next` cache | `apps/reception/.next/` | Dev server was hanging — Tailwind v4 scanning bloated cache |
| Added `@theme` block | `globals.css` | **Root cause**: TW v4 doesn't generate utilities from JS `@config` custom colors. 38 custom colors now registered via CSS `@theme` |
| Added `postcss.config.cjs` | `apps/reception/` | Every other app has one — needed for PostCSS pipeline |
| Added `background`/`color` on `html,body` | `globals.css` | Page had no base colors applied |
| Default to dark mode | `ReceptionThemeProvider.tsx` | `bootstrapCanonicalMode` now defaults to `"dark"` when no preference stored |

## Current State of the App (150+ components)

### What Works
- Login screen — well-styled, uses standard TW colors (`gray-900`, `indigo-*`)
- Dark mode toggle mechanism — `ReceptionThemeBridge` correctly toggles `dark`/`theme-dark` classes
- Token system — base theme tokens switch correctly between light/dark via `html.theme-dark`
- `@theme` block — custom reception colors now generate proper TW utilities

### What's Broken or Ugly

**1. Dual dark-mode system (827+ occurrences)**
Every component manually specifies `dark:bg-darkBg dark:text-darkAccentGreen` alongside base classes like `bg-surface-2`. This means:
- Components don't benefit from the token system's automatic dark/light switching
- 827+ `dark:` declarations to maintain manually
- Light mode looks different from dark mode in unpredictable ways

**2. Two parallel component systems**
- ~65 files import styled DS primitives (`Button`, `Table` from `@acme/design-system`)
- ~70 files import unstyled shims (`ReceptionButton`, `ReceptionInput` from `@acme/ui/operations`)
- `ReceptionInput/Select/Textarea` are **bare HTML elements with zero styling** — every call site independently replicates border, bg, focus ring, dark mode classes
- Same component (`OrderList.tsx`) even imports from both paths

**3. 73 raw Tailwind color values bypass tokens**
Files like `AlertModal.tsx`, `CategoryHeader.tsx`, and `Login.tsx` use `bg-gray-300`, `bg-blue-700`, `bg-stone-200` etc. instead of semantic tokens.

**4. `-main`/`-dark`/`-light` status colors have no backing tokens**
Classes like `bg-primary-main`, `bg-error-main`, `bg-info-light` are used 300+ times but had no CSS variable definitions. The `@theme` block maps them to base tokens as a stopgap, but proper status color tokens are needed.

**5. RoomGrid is a styling island**
Own CSS variable namespace (`--rvg-color-*`) with hardcoded hex values. Light mode completely disconnected from theme system.

**6. No reception theme package**
Despite 150+ components with a distinct aesthetic (green-on-black terminal), reception relies on ad-hoc token bridges in `globals.css` rather than a proper `packages/themes/reception/` package.

## Design Direction: Skeuomorphic Hospitality POS

The vision: a **dark, tactile POS interface** inspired by physical hotel/hostel equipment — cash registers, room key boards, check-in desks. Think textured surfaces, embossed buttons, physical affordances.

### Design Principles
1. **Dark-first** — reception is used in dimly-lit hostel environments
2. **Tactile** — buttons should feel pressable, cards should feel like physical objects
3. **High-contrast status** — green/amber/red must pop immediately for operational awareness
4. **Dense but scannable** — staff need to process many items quickly (POS grid, check-in table)
5. **Touch-friendly** — used on tablets behind reception desks

### Token Architecture (Proposed)

```
packages/themes/reception/
├── tokens.css          ← reception-specific token overrides
├── surfaces.css        ← skeuomorphic surface treatments (grain, bevels, depth)
├── components.css      ← reception component tokens (POS grid, status badges, etc.)
└── index.css           ← barrel import
```

**Key additions to the token system:**
- `--reception-surface-raised` / `--reception-surface-inset` — skeuomorphic depth
- `--reception-bevel-highlight` / `--reception-bevel-shadow` — edge treatments
- `--reception-texture-grain` — subtle noise/grain overlay
- `--reception-button-depth` — 3D button press effect
- `--reception-status-glow-*` — colored glow halos for status indicators

### Migration Path

**Phase 1: Foundation (eliminates the most technical debt)**
1. Create `packages/themes/reception/` with proper token overrides
2. Migrate `globals.css` token bridges → reception theme package
3. Replace `ReceptionInput/Select/Textarea` shims with properly styled DS primitives
4. Remove the dual dark-mode pattern — use token auto-switching instead of 827 `dark:` overrides

**Phase 2: Skeuomorphic Components**
5. Create reception-specific DS variant classes (raised surfaces, beveled buttons, inset inputs)
6. Build `ReceptionCard`, `ReceptionStatusBadge`, `ReceptionPOSButton` as DS extensions
7. Apply texture/grain overlays via CSS (pseudo-elements, not images)

**Phase 3: View-by-View Polish**
8. Bar POS — product grid with tactile cards, category tabs with physical feel
9. Check-in table — dense data table with status color system
10. Room grid — integrate with theme system, remove hardcoded hex values
11. Till/Safe — cash-register aesthetic with mechanical number displays
12. Dashboard — operational glanceable metrics with status glows

### What NOT to Change
- The login screen — it already looks great
- The `ReceptionThemeBridge` / toggle mechanism — works correctly
- The hospitality token definitions in base theme — they're well-designed
- The `@config` + `@theme` CSS architecture — this is the correct TW v4 pattern
