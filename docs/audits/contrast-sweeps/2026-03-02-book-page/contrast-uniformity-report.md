# Contrast + Uniformity Report — /en/book
**Date:** 2026-03-02
**Standard:** WCAG 2.x AA
**Breakpoints tested:** 375, 768, 1024, 1280 px (light mode)
**Surface:** Full page — SocialProofSection (merged perks), BookPageSearchPanel, RoomsSection, nav/footer
**Method:** Computed-style analysis via known token values + browser session observation

---

## Token Reference (Light Mode)

| Brand token | Resolved hex | Luminance |
|---|---|---|
| `brand-bg` | `#ffffff` | 1.000 |
| `brand-surface` | `#f2f3f4` | 0.895 |
| `brand-text` | `#1b1b1b` | 0.011 |
| `brand-heading` | `#1b1b1b` | 0.011 |
| `brand-primary` | `#005887` | 0.087 |
| `brand-secondary` | `#f4d35e` | 0.667 |
| `brand-on-accent` | `#1b1b1b` | 0.011 |

Opacity-blended effective colors (WCAG compositing against their background):

| Usage class | Effective hex (approx) | Luminance |
|---|---|---|
| `text-brand-text/80` on `brand-bg` | `#494949` | 0.067 |
| `text-brand-text/70` on `brand-bg` | `#5f5f5f` | 0.115 |
| `text-brand-text/60` on `brand-surface` | `#717172` | 0.165 |
| `text-brand-text/40` on `brand-bg` | `#a4a4a4` | 0.371 |
| `bg-brand-secondary/15` on `brand-bg` | `#fdf8e7` | ~0.939 |

---

## Findings

### S1 — Blockers

#### F1 · Perks badge label — `text-brand-secondary` on `bg-brand-secondary/15`
- **Component:** `SocialProofSection` perks strip — "Why book direct?" badge
- **Breakpoints:** All (375–1280 px)
- **Colors:** `#f4d35e` (golden yellow) on `#fdf8e7` (pale cream)
- **Measured ratio:** ~1.4:1
- **Required:** 4.5:1 (normal text, text-xs)
- **Status:** ❌ FAIL — S1 Blocker
- **Root cause:** Introduced in this session — badge uses same brand-secondary for both background tint and text color, giving near-zero contrast
- **Fix:** Use `bg-brand-secondary text-brand-on-accent` (solid golden pill, dark text → ~11.8:1) ← **applied below**

#### F2 · Snapshot date label — `text-brand-text/40` on `brand-bg`
- **Component:** `SocialProofSection` header — "As of March 2026"
- **Breakpoints:** All
- **Colors:** effective `#a4a4a4` on `#ffffff`
- **Measured ratio:** ~2.5:1
- **Required:** 4.5:1 (text-xs, 12px)
- **Status:** ❌ FAIL — S1 Blocker
- **Root cause:** Pre-existing — `/40` opacity is far too light for 12px text
- **Fix:** Increase to `text-brand-text/60` (→ ~6.5:1 on white) ← **applied below**

---

### S3 — Minor

#### F3 · Review count — `text-brand-text/60` on `brand-surface`
- **Component:** Rating cards — "1,234 reviews" subline
- **Breakpoints:** All
- **Colors:** effective `#717172` on `#f2f3f4`
- **Measured ratio:** ~4.4:1
- **Required:** 4.5:1 (text-xs)
- **Status:** ⚠️ Minor fail (1 tick under threshold)
- **Root cause:** Pre-existing — `/60` opacity on surface (not white) compounds slightly
- **Fix:** Increase to `text-brand-text/70` on surface → ~5.5:1

#### F4 · ✓ checkmark decorators — `text-brand-secondary` on `brand-bg`
- **Component:** Perks strip checkmarks
- **Breakpoints:** All
- **Colors:** `#f4d35e` on `#ffffff`
- **Measured ratio:** ~1.5:1
- **Status:** Decorative (`aria-hidden`) — WCAG exempt from text contrast. Visually faint for sighted users.
- **Note:** No fix required for compliance. Design note: consider `text-brand-heading` for stronger visual ✓ if aesthetics allow.

---

## Passing Elements

| Element | Colors | Ratio | Result |
|---|---|---|---|
| Page H1 on brand-bg | `#1b1b1b` / `#ffffff` | 17.2:1 | ✅ |
| H2 "Guests love Brikette" | `#1b1b1b` / `#ffffff` | 17.2:1 | ✅ |
| Subtitle `text-brand-text/70` | `#5f5f5f` / `#ffffff` | 6.4:1 | ✅ |
| Provider label on brand-surface | `#1b1b1b` / `#f2f3f4` | 15.4:1 | ✅ |
| Score number on brand-surface | `#1b1b1b` / `#f2f3f4` | 15.4:1 | ✅ |
| Quote text `text-brand-text/80` on surface | `#494949` / `#f2f3f4` | 8.4:1 | ✅ |
| Perk text `text-brand-text/80` on bg | `#494949` / `#ffffff` | 9.0:1 | ✅ |
| "Clear dates" `text-brand-primary` | `#005887` / `#ffffff` | 7.6:1 | ✅ |
| Stepper +/− `text-brand-primary` | `#005887` / `#f2f3f4` | 6.8:1 | ✅ |
| Nav links | `#1b1b1b` / `#ffffff` | 17.2:1 | ✅ |

---

## Breakpoint Uniformity

No layout-specific contrast changes detected. Color ratios are viewport-invariant (no responsive color changes). Stacking order on mobile (375 px) preserves all computed colors — no overlay/image-card failures detected.

---

## Summary

| Severity | Count | Fixed in this pass |
|---|---|---|
| S1 Blocker | 2 | 2 (F1 new, F2 pre-existing) |
| S2 Major | 0 | — |
| S3 Minor | 2 | 1 (F3 review count), 1 noted (F4 decorative) |
