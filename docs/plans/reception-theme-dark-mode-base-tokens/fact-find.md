---
Type: Fact-Find
Status: Ready-for-planning
Feature-Slug: reception-theme-dark-mode-base-tokens
Domain: UI
Workstream: Engineering
Created: 2026-03-08
Last-reviewed: 2026-03-08
Relates-to charter: docs/business-os/business-os-charter.md
Outcome: planning
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Loop-Gap-Trigger: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-design-spec, lp-do-build
Delivery-Readiness: 82%
Design-Spec-Required: yes
---

# Fact-Find: Reception Dark Mode Visual Identity

## Scope & Intent

The reception app uses dark mode exclusively. The current theme token values are technically correct (OKLCH format, semantic names, archetype system now in place from Wave 1) but produce a flat, wireframe-y visual result. The problem is not the token architecture — it is the token *values*. Surface lightness steps are too small to perceive, chroma is near-zero in background layers, and borders barely contrast against their surfaces. This fact-find audits the current state and makes a clear recommendation for where to take the visual identity.

**Constraint**: dark mode only. The light-mode values in `tokens.ts` can be preserved or set to identical light-equivalent values — they are not used in the app. All changes that matter live in the dark-mode values.

## Access Declarations

None. All evidence sourced from local files.

## Evidence Audit (Current State)

### Token Layer — Actual Rendered Values (Dark Mode)

| Token | Dark Value (OKLCH) | Approximate hex | Problem |
|---|---|---|---|
| `--color-bg` / `surface-1` | `oklch(0.147 0.003 174)` | #171f1e | Very dark green-black. Fine as the deepest layer. |
| `surface-2` | `oklch(0.196 0.0055 173)` | #1e2827 | Card backgrounds. Only 0.05 L above bg — nearly invisible step. |
| `surface-3` | `oklch(0.241 0.0059 173)` | #262f2e | Raised surfaces. 0.045 L above surface-2 — again barely perceptible. |
| `--color-fg` | `oklch(0.941 0.0051 165)` | #edf5f2 | Near-white with ghost green tint. Fine. |
| `--color-fg-muted` | `oklch(0.73 0.0119 164)` | #aab9b5 | Too light — almost as bright as foreground. Kills text hierarchy. |
| `--color-border` | `oklch(0.347 0.0108 164)` | #3a4a47 | L=0.347 on surface-3 at L=0.241: only 0.1 gap — borders are nearly invisible. |
| `--color-border-strong` | `oklch(0.473 0.0158 164)` | #586b67 | Better, but still subtle. |
| `--color-primary` | `oklch(0.753 0.200 149)` | ~#4fd87a | Good bright green. Well-saturated. Keep hue. |
| `--color-accent` | `oklch(0.778 0.146 72)` | ~#dfa94a | Warm amber. Good complement. Keep. |

**Root causes of wireframe-y appearance:**

1. **Invisible surface steps**: the 3 depth levels (bg, surface-2, surface-3) differ by only 0.05–0.09 in OKLCH lightness. The human eye perceives lightness differences reliably only above ~0.07 in OKLCH. These are at or below that threshold.

2. **Near-zero chroma in surfaces**: all backgrounds have chroma 0.003–0.006 — essentially achromatic. The intent was "green-tinted" but the values are so low the tint is invisible. The result reads as plain dark gray, not dark green.

3. **Muted foreground too bright**: `--color-fg-muted` at L=0.73 is almost as bright as `--color-fg` at L=0.94. There is insufficient contrast between primary and secondary text. Everything reads at the same visual weight.

4. **Borders too subtle**: `--color-border` at L=0.347 against surface-3 at L=0.241 — 0.1 difference — borders function architecturally but feel like suggestions, not structure.

5. **No table row differentiation tokens**: there is no `--color-table-row-hover`, no `--color-table-row-alt` (zebra). All table rows render identically; the table feels like a wall of text.

6. **Gradient is imperceptible**: `OperationalTableScreen` uses `from-surface-2 to-surface-3`. The difference between these two values is L=0.045. The gradient does not register visually — the screen appears flat.

### Screen-by-Screen Audit

| Screen | What works | What is flat/wireframe-y |
|---|---|---|
| **Check-in table** (`/checkin`) | Primary green accent bar, action button borders | Card barely separates from background. All rows same shade. Date chips readable. Mode banners (edit/delete/add) rely on `bg-info-light/10` — too transparent against dark surfaces. |
| **Bar POS** (`/bar`) | Product shade families (pink/coffee/wine/beer etc.) give real color. Green price badges. | Tab/category header area plain. `bg-surface` card within the outer container. Outer gradient invisible. Product tile `bg-surface-2` borders barely show. |
| **Inbox** (`/inbox`) | Thread list structure clear. | Thread list items undifferentiated — no hover state visible, no read/unread distinction in color. Header plain. |
| **Room grid** (`/rooms-grid`) | Date inputs and the grid content (RoomGrid cells) likely have color. | Overall `PageShell` background flat. |
| **Checkout** (`/checkout`) | Auto-aligned via OperationalTableScreen. | Same surface flatness as check-in. |

### Component Visual Audit

- **`OperationalTableScreen`**: gradient `from-surface-2 to-surface-3` — imperceptible difference. The whole-screen gradient that creates "depth" and "atmosphere" is currently invisible.
- **`TableCard`**: `bg-surface-2 border-border-strong shadow-xl ring-1 ring-border-1/30` — shadow-xl on a near-matching background is also invisible. Ring at `border-1/30` is a ghost.
- **`CheckinsHeader`**: `bg-primary-main` accent bar is the one piece of colour that lands. The buttons (`NewBookingButton`, `EditButton`, `DeleteButton`) are `Button` DS components — likely outline/ghost style with thin borders on dark backgrounds.
- **`ProductGrid` items**: `bg-surface-2 border-border-1/50` tiles with `hover:bg-primary-soft` — the hover state (`oklch(0.298 0.058 153)`) is barely distinguishable from the resting surface.
- **`BookingRow`**: not read directly but the TableBody rows use no alternating backgrounds — confirmed by the absence of any alt-row token in the theme.

### Typography

- Inter for UI (sans), JetBrains Mono for mono — good, these are the right choices.
- No `font-heading` override — `--font-heading: var(--font-sans)` means headings use Inter. Acceptable but a display weight or slightly different treatment could add character.

### Gradient Architecture (post Wave 1)

The `OperationalTableScreen` archetype now correctly owns the single gradient. But `from-surface-2 to-surface-3` with the current token values is a no-op visually. Fixing the token values will activate this gradient automatically — no JSX changes needed.

## Theme Direction Recommendation

**Personality**: A premium operational dark tool for a boutique Mediterranean hostel. Staff use this all day under real conditions. It should feel like a refined hospitality terminal — confident, purposeful, alive. Think Vercel dashboard crossed with a well-designed point-of-sale terminal: deep dark greens with visible structure, not just "dark mode gray with a green button".

**Colour story**: The green primary is correct — it signals "operational readiness" which is exactly right for a hostel front desk. The problem is the supporting surfaces have no relationship to that green. The fix is to bring the green hue through the entire surface stack with sufficient chroma to read as intentional, while widening the lightness steps so depth is visible.

**Recommended token changes (dark values only):**

### 1. Background and surface stack — widen steps, add chroma

| Token | Current dark | Proposed dark | Change |
|---|---|---|---|
| `--color-bg` | `oklch(0.147 0.003 174)` | `oklch(0.110 0.012 165)` | Deeper, more chromatic base. The canvas is now clearly dark-green, not charcoal. |
| `surface-1` | `oklch(0.147 0.003 174)` | `oklch(0.140 0.014 165)` | Slightly lighter than bg, matches card insets. |
| `surface-2` | `oklch(0.196 0.0055 173)` | `oklch(0.200 0.018 165)` | Card background. Now 0.09 L above bg — clearly distinct. Chroma pushes green atmosphere. |
| `surface-3` | `oklch(0.241 0.0059 173)` | `oklch(0.260 0.022 165)` | Raised surfaces. 0.06 above surface-2 — visible step. |
| `surface-input` | `oklch(0.219 0.005 173)` | `oklch(0.220 0.018 165)` | Align with surface-2 range. |
| `--color-inset` | `oklch(0.172 0.004 173)` | `oklch(0.155 0.013 165)` | Slightly lighter than bg-deep. |
| `--color-panel` | `oklch(0.219 0.005 173)` | `oklch(0.220 0.018 165)` | Same as surface-2. |

### 2. Text hierarchy — restore muted contrast

| Token | Current dark | Proposed dark | Change |
|---|---|---|---|
| `--color-fg` | `oklch(0.941 0.005 165)` | `oklch(0.950 0.010 165)` | Slightly more chromatic — gives white text a warm green character. |
| `--color-fg-muted` | `oklch(0.730 0.012 164)` | `oklch(0.560 0.015 165)` | Drop by 0.17 in lightness. Creates real distinction between primary and secondary text. |
| `--color-muted-fg` | `oklch(0.887 0.005 165)` | `oklch(0.600 0.015 165)` | Same treatment for the DS-layer alias. |

### 3. Borders — give them presence

| Token | Current dark | Proposed dark | Change |
|---|---|---|---|
| `--color-border` | `oklch(0.347 0.011 164)` | `oklch(0.320 0.022 165)` | More chroma, slight lightness bump vs proposed surface-2. Now reads as a real line. |
| `--color-border-strong` | `oklch(0.473 0.016 164)` | `oklch(0.420 0.028 165)` | Clearly visible structural border. |
| `--color-border-muted` | `oklch(0.284 0.007 164)` | `oklch(0.260 0.016 165)` | Very subtle dividers; now has some character. |

### 4. Primary green — keep hue, push brightness slightly

| Token | Current dark | Proposed dark | Change |
|---|---|---|---|
| `--color-primary` | `oklch(0.753 0.200 149)` | `oklch(0.780 0.210 149)` | Slightly brighter and more saturated. More presence on dark surfaces. |
| `--color-primary-soft` | `oklch(0.298 0.058 153)` | `oklch(0.260 0.065 153)` | Deepen hover soft bg so it actually shows on new surfaces. |
| `--color-primary-hover` | `oklch(0.789 0.196 150)` | `oklch(0.820 0.200 150)` | Brighter hover. |

### 5. New tokens required

| Token | Value (dark) | Purpose |
|---|---|---|
| `--color-table-row-hover` | `oklch(0.220 0.030 165)` | Subtle green hover for table rows — gives interactivity without full primary colour. |
| `--color-table-row-alt` | `oklch(0.175 0.016 165)` | Zebra-stripe alternate row — creates scan rhythm in dense tables. |
| `--color-surface-elevated` | `oklch(0.280 0.024 165)` | For floating elements (dropdowns, popovers, modals) — clearly above surface-3. |

### 6. Token changes NOT required

- Bar POS shade families (pink/coffee/wine/beer etc.) — leave untouched. These are working.
- Chart palette — leave untouched.
- Amber accent `--color-accent` — leave untouched.
- Status colors (danger/success/warning/info) from base theme — leave untouched.
- OKLCH format — keep.
- Font tokens — keep.

## Planning Constraints & Notes

- **Dark-only scope**: `tokens.ts` has both `light` and `dark` keys. The light values should be updated to plausible equivalents when changed (they will not be used but should not be wildly inconsistent) or simply set to the existing light values from the base theme.
- **Cascade order**: `globals.css` imports `@import "../../../../packages/themes/reception/tokens.css"` after the base tokens. Any change to `tokens.ts` must be regenerated into `tokens.css` via the existing `build-tokens.ts` script — check `scripts/src/themes/` for the build pipeline.
- **`tailwind.config.mjs` legacy bridge**: the `receptionColorBridge` object maps old `--reception-dark-*` vars that are then aliased via `globals.css :root {}`. These legacy aliases will continue to resolve correctly as long as the underlying `--color-bg-dark` and `--surface-2-dark` token values are updated.
- **No JSX changes needed for gradient activation**: fixing `surface-2` and `surface-3` values automatically makes `OperationalTableScreen`'s `from-surface-2 to-surface-3` gradient visible. The Wave 1 archetype system was built correctly — only the token values are wrong.
- **Table row tokens**: once added to `tokens.ts`, they need to be consumed in `BookingRow.tsx` (check-in table) and `CheckoutTable.tsx`. This is a small amount of JSX work.
- **`tokens.css` build script**: confirm the regeneration path — `scripts/src/themes/build-tokens.ts` or similar. If it generates `tokens.css` from `tokens.ts`, a single build step updates all downstream consumers.
- **Testing**: visual changes — no unit tests will catch these. CI parity snapshots (if any exist for check-in/checkout) will need their snapshots updated.

## Planning Readiness

- **Deliverable-Type**: `code-change`
- **Execution-Track**: `code`
- **Primary-Execution-Skill**: `lp-do-build`
- **Design-Spec-Required**: yes — the token values above are recommendations; a design spec should lock the exact OKLCH numbers and verify them against WCAG contrast ratios before implementation.
- **Confidence Inputs**:
  - Token architecture: 95% — the structure is sound; only values change.
  - Visual impact: 82% — the proposed values are evidence-based but need WCAG contrast verification in a design spec before committing. Held-back risk: chroma push could reduce WCAG AA compliance for some text-on-surface combinations.
  - Scope: 90% — clearly bounded to `packages/themes/reception/src/tokens.ts` + `tokens.css` + 2 JSX files for new row tokens. No architectural changes.

## Open Questions

1. **Token build pipeline**: is `tokens.css` generated from `tokens.ts` via a script, or maintained manually? If generated, what is the exact command? (Check `scripts/src/themes/` or the `packages/themes/reception/package.json` build script.)
2. **WCAG verification**: the proposed `--color-fg-muted` drop to L=0.56 — does it maintain WCAG AA (4.5:1) on the proposed surface-2 (L=0.20)? This needs a contrast check before implementation.
3. **Snapshot tests**: are there any visual parity snapshot tests for reception screens that will need updating after the token change?

## Resolved Questions

- **Dark-only scope confirmed**: `tokens.css` applies dark values via `@media (prefers-color-scheme: dark)` and `html.theme-dark` selector. The app uses dark mode exclusively, confirmed by `globals.css` (`html.dark, body.dark { color-scheme: dark }`).
- **Gradient fix is token-only**: `OperationalTableScreen` already uses `from-surface-2 to-surface-3`. No JSX change needed — fixing the token values activates the gradient.
- **Bar POS shades are separate**: they use named shade families (`pinkShades`, `coffeeShades` etc.) — not semantic surface tokens. They are unaffected by surface/border token changes.
- **`receptionColorBridge` in tailwind.config.mjs**: wraps legacy aliases with `hsl(var(...))` — these are bridge-only and will continue resolving correctly as the underlying vars are updated.

## Evidence Gap Review

### Gaps Addressed

- Current surface OKLCH values extracted and converted to approximate hex — confirms the visual flatness is a numerical fact, not perception.
- Bar POS product tile code read — confirms shade families are independent of surface tokens.
- `OperationalTableScreen` and `TableCard` code read — confirms gradient/surface tokens are the only lever needed.
- `CheckinsHeader` read — confirms accent bar and button patterns.

### Confidence Adjustments

- Initial estimate for impact confidence was 75%. Raised to 82% after confirming the gradient and surface tokens are cleanly separated from the bar shade families — the risk of breaking bar visuals is lower than initially estimated.

### Remaining Assumptions

- The `build-tokens.ts` script exists and generates `tokens.css` from `tokens.ts` — needs verification before implementation.
- WCAG AA compliance for proposed muted text values — needs contrast calculation in design spec.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Token value audit (surfaces/borders/fg) | Yes | None | No |
| Screen-by-screen visual inventory | Yes — all 5 archetypes | None | No |
| Bar POS shade independence | Yes | None | No |
| Token build pipeline | Partial — script exists in `scripts/src/themes/` but not read | Moderate: build command unknown | Yes — verify in design spec |
| WCAG contrast for proposed muted values | No | Moderate: fg-muted at L=0.56 on surface-2 at L=0.20 needs calculation | Yes — design spec gate |
| New token consumption (table row hover/alt) | Yes — identified 2 JSX targets | None | No |

No Critical rehearsal findings. Two Moderate findings carried to planning as acceptance criteria.

## Scope Signal

- **Signal**: right-sized
- **Rationale**: scope is clearly bounded to `packages/themes/reception/src/tokens.ts` + `tokens.css` regeneration + 2 JSX files (BookingRow, CheckoutTable) for new row tokens. The design spec gate (GATE-BD-07 waived for internal tool) and WCAG verification are the only pre-implementation gates. No architectural changes, no component renames, no new primitives.

## Outcome Contract

- **Why:** The reception app looks wireframe-y and generic. Staff use it all day. A dark theme with real depth, visible structure, and hospitality character will reduce visual fatigue and communicate quality to any visitor who sees the screen.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The reception app dark theme has clearly differentiated surface depth levels, visible borders, chromatic green atmosphere, and correct text hierarchy. The check-in screen looks like a premium hospitality tool, not a monochrome wireframe.
- **Source:** operator
