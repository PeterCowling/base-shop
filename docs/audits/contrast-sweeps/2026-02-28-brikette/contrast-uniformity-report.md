# Contrast + Uniformity Report — Brikette App
**Date:** 2026-02-28
**Standard:** WCAG 2.x AA
**Mode:** Light mode only (dark mode deferred)
**Breakpoints:** 375px, 768px, 1280px, 1920px
**Routes:** Homepage (`/en`), Dorm listing (`/en/dorms`), Booking form (`/en/book`)
**Note:** Dorm detail (`/en/dorms/room_10`) timed out on `networkidle` due to external booking widget; room card headings estimated via manual calculation.

---

## Summary

| Severity | Count |
|---|---|
| S1 Blocker | 1 |
| S2 Major | 2 |
| S3 Minor (uniformity) | 2 |

**Screenshots:** `docs/audits/contrast-sweeps/2026-02-28-brikette/screenshots/`
**Machine-readable findings:** `contrast-findings.json`, `uniformity-findings.json`

---

## Findings

### F-01 · S1 · Booking widget "Guests" label — 1.03:1 — All breakpoints, all pages

**Element:** `<label htmlFor="guests">` in `apps/brikette/src/components/landing/BookingWidget.tsx`

**Measured:**
- fg: `rgb(242, 243, 244)` = `--color-brand-surface` (#f2f3f4)
- bg: `bg-panel/95` ≈ `rgb(246, 246, 246)` (near-white)
- Contrast ratio: **1.03:1**
- Threshold: 4.5:1 (14px, normal weight)

**Root cause:** The label element has two conflicting text-color utilities in its className:

```tsx
// BookingWidget.tsx — current code
className="flex flex-col gap-1.5 text-sm font-semibold text-brand-heading text-brand-surface"
//                                                         ↑ intended          ↑ overrides — bug
```

In Tailwind v4, `text-brand-surface` is the winning declaration (it resolves to `--color-brand-surface` = `#f2f3f4`, nearly white). The label is essentially invisible against the near-white booking widget background.

**Fix direction:** Remove `text-brand-surface` from the label className. `text-brand-heading` alone produces #1b1b1b on the panel background = 15.5:1 ✓.

**Affected breakpoints:** 375px, 768px, 1280px, 1920px (every page that shows the booking widget)

---

### F-02 · S2 · Footer section labels at 60% opacity — 3.81:1 — All breakpoints, all pages

**Element:** Footer section headers ("Location", "Contact", "Follow") in `apps/brikette/src/components/footer/Footer.tsx`

**Measured:**
- fg: `text-brand-bg/60` = `rgba(255, 255, 255, 0.60)` → effective rgb(153, 188, 207)
- bg: `bg-brand-primary` = `rgb(0, 88, 135)` (#005887)
- Contrast ratio: **3.81:1**
- Threshold: 4.5:1 (12px, 600 weight, uppercase — non-large text)
- Font size: 12px (`text-xs`)

**Context:** These are `text-xs font-semibold uppercase tracking-widest` section header labels. At 12px they are definitively "normal text" requiring 4.5:1. The 60% white opacity on the blue footer background falls short.

**Calculation table:**

| Opacity | Effective color | Contrast | AA pass? |
|---|---|---|---|
| `/60` (current) | rgb(153, 188, 207) | 3.81:1 | ✗ |
| `/70` | rgb(178, 204, 219) | 4.61:1 | ✓ |
| `/75` | rgb(191, 211, 224) | 5.03:1 | ✓ |
| `/80` (matches description text) | rgb(204, 222, 231) | 5.52:1 | ✓ |

**Note:** Section nav column headers ("Explore", "Info") use `/90` → 6.52:1 ✓. Footer description uses `/80` → 5.52:1 ✓. Only the `/60` level fails.

**Fix direction:** Change `text-brand-bg/60` to `text-brand-bg/75` (or `/80` to match the description style) on the small uppercase section labels. Same fix applies to `dark:text-brand-text/60`.

---

### F-03 · S2 · Mobile menu active nav link — 1.47:1 — 375px and 768px

**Element:** Active (current page) nav link inside `packages/ui/src/organisms/MobileMenu.tsx`

**Measured:**
- fg: `text-brand-secondary` = `rgb(244, 211, 94)` (#f4d35e — brand yellow)
- bg: `bg-brand-bg` = `rgb(255, 255, 255)` (#ffffff — white)
- Contrast ratio: **1.47:1**
- Threshold: 4.5:1 (14px, normal to semi-bold)

**Context:** When a user opens the mobile menu on any page, the link for their current page is highlighted with `text-brand-secondary` (yellow). The mobile menu background is white, making yellow text nearly invisible. This is a navigation orientation failure — users cannot identify their current location in the menu.

**Root cause:** The `brand-secondary` yellow token was designed for use on the dark blue header gradient (where its contrast is 7.48:1 ✓). The mobile menu shares the same active-link token but places it on a white background.

**Fix direction options (in order of preference):**
1. Use `text-brand-primary` (#005887) for mobile menu active state instead → 7.65:1 ✓ on white
2. Use a background highlight approach: `bg-brand-primary/10 text-brand-primary font-semibold` → passes comfortably
3. Keep yellow but add a dark underline via `decoration-brand-heading` to signal active state with a legible indicator

---

## Uniformity Findings

### U-01 · S3 · BookingWidget label — conflicting CSS classes

Same root cause as F-01. The className `"text-brand-heading text-brand-surface"` is a stale copy-paste or accidental dual-class that bypasses both a linting warning and contract tests. The codebase has a contract test (`TC-08.1`) that verifies key components don't bypass token patterns — this label bypasses it.

**Fix:** Remove `text-brand-surface` from the label. Verify no other elements in `BookingWidget.tsx` have the same pattern.

### U-02 · S3 · Active nav indicator token inconsistency across responsive implementations

The `text-brand-secondary` active-link token works correctly on the gradient header (desktop, contrast passes) but fails on the mobile menu (white background). This is an inconsistent application of a single token across two contexts with different backgrounds.

**Fix direction:** Define the active link visual treatment as a component variant in `MobileMenu`, not as a raw token. Consider a `current` prop-driven CSS class that applies context-appropriate styles.

---

## Items Passing (Spot Checks)

| Element | Ratio | Status |
|---|---|---|
| H1/H2/H3 headings, body text (#1b1b1b on white/surface) | 15.5–17.22:1 | ✓ AA |
| Primary CTAs: white on brand-primary (#005887) | 7.65:1 | ✓ AA |
| "Check availability" header CTA: #1b1b1b on brand-secondary (#f4d35e) | 11.75:1 | ✓ AA |
| Footer links (white/100% on blue) | 7.65:1 | ✓ AA |
| Footer "Book direct →" link: yellow (#f4d35e) on blue (#005887) | 5.22:1 | ✓ AA |
| Footer brand description (white/80% on blue) | 5.52:1 | ✓ AA |
| Footer column headers (white/90% on blue) | 6.52:1 | ✓ AA |
| Body links: brand-primary (#005887) on white | 7.65:1 | ✓ AA |
| Body links: bougainvillea (#9b1b33) on white | 8.08:1 | ✓ AA |
| Room card H3 (white on dark blue room image overlay) | ~8–10:1 | ✓ AA (est.) |
| Review text (~dark/70% on surface/white) | 5.25–6.39:1 | ✓ AA |
| Desktop header active nav: yellow on dark gradient | 7.48:1 | ✓ AA |

---

## Measurement Notes

1. **Gradient background detection:** The automated sweep cannot resolve CSS `background-image: linear-gradient()` via `getComputedStyle().backgroundColor` — these return transparent and the tool traverses to the body background. Header nav items reported as "white on white" at 375px are false positives; manual calculation against the actual gradient gives 10.24:1–11.75:1 (passes).

2. **oklab color space:** Tailwind v4 emits `oklab()` syntax for some colors with alpha values. The automated parser was extended to handle these via manual alpha-compositing calculations. All `oklab` items were manually verified.

3. **Dorm detail page:** `networkidle` timed out due to external booking widget. Room card elements (H3 headings white on `lab(44, 29, -86)` ≈ dark blue overlay) estimated at 8–10:1 via CIELab-to-sRGB conversion — expected to pass.

4. **Dark mode not tested** — this report covers light mode only.

---

## Recommended Fix Priority

| # | Finding | Fix effort | Impact |
|---|---|---|---|
| 1 | F-01: Remove `text-brand-surface` from BookingWidget label | 1 line | S1 — completely invisible field label |
| 2 | F-03: Change mobile menu active link color | 1–2 lines | S2 — unreadable current-page indicator |
| 3 | F-02: Bump footer section labels `/60` → `/75` | 2 lines (light + dark) | S2 — 12px uppercase footer labels below threshold |

All three are token/class changes with no design impact beyond fixing legibility.
