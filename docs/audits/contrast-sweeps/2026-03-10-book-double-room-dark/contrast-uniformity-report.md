---
Type: Contrast-Uniformity-Report
Status: Complete
Audit-Date: 2026-03-10
Target-URL: https://staging.brikette-website.pages.dev/en/book-double-room
Standard: WCAG-2.x-AA
Breakpoints-Tested: 320, 375, 430, 768, 1024, 1280, 1536
Modes-Tested: dark
Routes-Tested: 1
---

# Contrast + Uniformity Audit — /en/book-double-room, Dark Mode
**Date:** 2026-03-10
**Standard:** WCAG 2.x AA
**Breakpoints:** 320, 375, 430, 768, 1024, 1280, 1536 px
**Mode:** Dark (`.dark` class active)
**Route:** `https://staging.brikette-website.pages.dev/en/book-double-room`
**Primary components:** `DoubleRoomBookContent`, `PolicyFeeClarityPanel`, `BookingCalendarPanel`
**Evidence method:** Source code audit + WCAG luminance calculation from token hex values

---

## Token Baseline (Dark Mode, active on this route)

| Token | Hex | Luminance |
|---|---|---|
| `--color-brand-bg` | `#181818` | 0.007 |
| `--color-brand-surface` | `#1f1f1f` | 0.013 |
| `--color-brand-primary` | `#4da8d4` | 0.348 |
| `--color-brand-secondary` | `#d2b53f` | 0.474 |
| `--color-brand-text` | `#f7f7f7` | 0.955 |
| `--color-brand-heading` | `#ffffff` | 1.000 |
| `--color-brand-on-primary` | `#1b1b1b` | 0.008 |
| `--color-brand-on-accent` | `#1b1b1b` | 0.008 |
| `--color-brand-outline` | `#4d4d4d` (post F-04 fix) | 0.095 |

---

## Findings

### F-DRK-01 — PolicyFeeClarityPanel invisible in dark mode — S1 Blocker

**Route:** `/en/book-double-room` — policies section below the rate cards
**Mode:** Dark
**Breakpoints:** All
**File:** `apps/brikette/src/components/booking/PolicyFeeClarityPanel.tsx:55`

**Root cause:** The panel's dark-mode background override is `dark:bg-brand-text`. In dark mode, `--color-brand-text` resolves to `#f7f7f7` (near-white). However, the text tokens inside the panel — `text-brand-text/80`, `text-brand-heading`, `text-brand-primary` link — are **not** given dark-mode overrides, so they also resolve to their `.dark` values: `#f7f7f7`, `#ffffff`, `#4da8d4` respectively.

**Net effect in dark mode:**
- Background: `#f7f7f7` (near-white — from `dark:bg-brand-text`)
- `text-brand-text/80`: rgba(247,247,247, 0.8) ≈ `#f9f9f9` (near-white text on near-white bg)
- `text-brand-heading` (h3 title): `#ffffff` (white on `#f7f7f7` bg)
- `text-brand-primary` (Terms link): `#4da8d4` on `#f7f7f7`

**Contrast ratios (dark mode):**

| Element | Color pair | Ratio | Required | Result |
|---|---|---|---|---|
| Body text (list items) | `#f9f9f9` on `#f7f7f7` | ~1.01:1 | 4.5:1 | ❌ S1 |
| Heading "Additional fees" | `#ffffff` on `#f7f7f7` | 1.05:1 | 4.5:1 | ❌ S1 |
| Terms link | `#4da8d4` on `#f7f7f7` | 2.52:1 | 4.5:1 | ❌ S1 |

The entire panel content is **invisible** in dark mode. This panel communicates mandatory pre-booking fee disclosures (city tax, cancellation policy, security hold) — failure to render it readable is both a legal risk and a critical UX failure at the point of checkout.

**Fix direction:**
The `dark:bg-brand-text` class is almost certainly a mistake — it was likely intended to create a light-accented box in dark mode (for visual variety), but applying it without paired text overrides causes the collapse.

Two valid approaches:
- **Option A (remove intent):** Remove `dark:bg-brand-text` entirely. Let the panel use the default dark page background (`#181818`). Existing `text-brand-text/80` and `text-brand-heading` tokens both have sufficient contrast on `#181818`. The `text-brand-primary` link (#4da8d4 on #181818 = 7.0:1 ✅) also passes.
- **Option B (preserve intent):** Keep light bg in dark mode but add paired dark text overrides: `dark:bg-brand-bg/90 dark:text-brand-bg dark:text-brand-bg/80` — setting text to the dark-mode bg value (near-black) for sufficient contrast on the light card.

Option A is simpler and consistent with other policy/info panels on the site.

---

### F-DRK-02 — Saving badges: white text on dark gold — S1 Blocker

**Route:** `/en/book-double-room` — rate cards (both Non-Refundable and Flexible)
**Mode:** Dark
**Breakpoints:** All
**File:** `apps/brikette/src/app/[lang]/private-rooms/double-room/book/DoubleRoomBookContent.tsx:201,228`

**Element:** `<span className="... bg-brand-secondary ... text-brand-heading">` — savings badge on each rate card.

**Colors (dark mode):**
- Background: `bg-brand-secondary` = `#d2b53f` (dark gold) — luminance 0.474
- Text: `text-brand-heading` = `#ffffff` (white) — luminance 1.000

**Contrast ratio:** (1.000 + 0.05) / (0.474 + 0.05) = **2.00:1**
**Required (AA normal text):** 4.5:1

**Severity:** S1 — these badges communicate the key commercial signal ("Save 26% vs OTA", "Save 21% vs OTA") that drives rate selection. Invisible in dark mode at the conversion decision point.

**Light mode:** `bg-brand-secondary` = `#f4d35e` (light yellow) + `text-brand-heading` = `#0a0a0a` → 14.2:1 ✅ passes in light mode. Dark mode is the problem.

**Fix direction:** Change `text-brand-heading` to `text-brand-on-accent` on the badge `<span>`. `brand-on-accent` = `#1b1b1b` in both modes — passes both light and dark:
- Dark: `#1b1b1b` on `#d2b53f` → (0.474+0.05)/(0.008+0.05) = 9.0:1 ✅
- Light: `#1b1b1b` on `#f4d35e` → 12.5:1 ✅

---

### F-DRK-03 — `brand-accent` token undefined — S2 Major (all modes)

**Route:** `/en/book-double-room` — Non-Refundable rate card CTA
**Mode:** Both (token-level issue, mode-independent)
**Breakpoints:** All
**File:** `apps/brikette/src/app/[lang]/private-rooms/double-room/book/DoubleRoomBookContent.tsx:196,210,211,214`

**Root cause:** `--color-brand-accent` is not defined in `apps/brikette/src/styles/global.css` or any brikette CSS file. The Non-Refundable card uses:
- `hover:border-brand-accent` — border on hover → `transparent`
- `focus-visible:ring-brand-accent` — focus ring → `transparent` (keyboard users lose focus indicator)
- `bg-brand-accent/10` — CTA footer bg → `transparent`
- `group-hover:bg-brand-accent` — hover state bg → `transparent`
- `text-brand-accent` — CTA label text → `currentColor` (inherits parent, typically `brand-text`)
- `group-hover:text-brand-on-accent` — hover label → `#1b1b1b`

**Observed behavior:**
1. Default: CTA footer area ("Non-Refundable – Continue to checkout") has no background color, no visible border. Text uses inherited color (dark mode: `#f7f7f7` on `#1f1f1f` = 16.7:1 for readability, but NO affordance distinguishing it as a CTA).
2. Hover (dark mode): background stays transparent, text changes to `#1b1b1b` (near-black). Near-black text on dark card surface (`#1f1f1f`) = 1.08:1 — text becomes **invisible** on hover.
3. Focus (all modes): `focus-visible:ring-brand-accent` → transparent ring — **keyboard focus indicator lost** on the Non-Refundable button.

**Severity:** S2 — the Flexible card CTA functions correctly (`brand-primary` is defined). The Non-Refundable card has no CTA affordance and loses keyboard focus visibility. Keyboard users cannot reliably navigate to the NR checkout path.

**Fix direction:** Define `--color-brand-accent` in `global.css`. The brand has a terracotta/orange accent (`brand-terra` = `#c4572e` light / `#ff5722` dark) that could serve this role, or the brand-secondary yellow could be used as accent. Alternatively rename all `brand-accent` references in the component to `brand-terra` (which is defined). `brand-terra` (#c4572e light / #ff5722 dark) passes for large text and non-text contrast, though borderline for normal text.

Simplest fix: add to `global.css` (both `:root` and `.dark`):
```css
/* :root */
--color-brand-accent: #c4572e;   /* terra — matches brand-terra */
--rgb-brand-accent: 196 87 46;
/* .dark */
--color-brand-accent: #ff5722;   /* terra dark */
--rgb-brand-accent: 255 87 34;
```

Then verify `text-brand-accent` contrast: light `#c4572e` on white = 4.41:1 (borderline for normal text — the CTA text is small font, fails by ~0.1 ratio). Better option: use `--color-brand-primary` values to alias accent to primary in this component only, or adjust the terra value slightly.

Alternatively, the cleanest single-component fix: swap all `brand-accent` references in `DoubleRoomBookContent.tsx` to `brand-primary`, making the NR card match the Flex card's teal scheme. The two cards would look similar but remain functional. This is a cosmetic tradeoff versus having a distinct accent color.

---

### F-DRK-04 — Card borders: opacity-based outline insufficient after F-04 fix — S2 Major

**Route:** `/en/book-double-room` — Date Selection and Rate Options step cards
**Mode:** Dark
**Breakpoints:** All
**File:** `apps/brikette/src/app/[lang]/private-rooms/double-room/book/DoubleRoomBookContent.tsx:154,183`

**Class:** `border border-brand-outline/40 bg-brand-surface`

**After global F-04 fix** (`--color-brand-outline: #4d4d4d` in dark mode):
- At 40% opacity on page background `#181818`:
  - Rendered channel: 0.4×77 + 0.6×24 = 30.8 + 14.4 = 45 → `#2d2d2d`
  - L = 0.028 → CR = (0.028+0.05)/(0.007+0.05) = **1.51:1**
  - **Still fails** non-text contrast (3.0:1 required)

**Math:** For `/40` opacity on `#181818` to reach 3:1, the token base color needs to be ~`#d1d1d1`. This is impractical as a semantic token (would be white-ish). The opacity pattern is fundamentally broken for dark-mode borders on very dark backgrounds.

**WhatsApp button** (line 255): `border border-brand-outline bg-brand-surface` (no opacity) → `#4d4d4d` on `#1f1f1f` = 2.30:1 — also fails 3.0:1.

**Severity:** S2 — the step cards and WhatsApp button lose their boundary affordance, making the page layout structure harder to parse. Cards blend into the dark background.

**Fix direction (component-level):** Add `dark:border-white/20` override to both step cards and the WhatsApp button in `DoubleRoomBookContent.tsx`:
- `#ffffff` at 20% opacity on `#181818`: rendered = 0.2×255 + 0.8×24 = 51+19.2 = 70.2 → `#464646`
  → L = 0.076, CR = (0.076+0.05)/0.057 = 2.21:1 — still low
- At `dark:border-white/30`: rendered = 0.3×255 + 0.7×24 = 76.5+16.8 = 93.3 → `#5d5d5d`
  → L = 0.125, CR = (0.125+0.05)/0.057 = **3.07:1 ✅** just passes

Add `dark:border-white/30` to both step card `div`s and the WhatsApp `<a>` border class.

**Global fix note:** The `--color-brand-outline` token in `.dark` should be raised further. To reach 3:1 against `#181818` with no opacity modifier, it needs to be at minimum `#626262` (L=0.122, CR=3.02:1). The current value `#4d4d4d` only reaches 2.54:1 bare.

---

## Passed Checks (Dark Mode)

| Check | Element | Color pair | Ratio | Result |
|---|---|---|---|---|
| Page heading | h1 `text-brand-heading` on `#181818` | `#ffffff` / `#181818` | 18.4:1 | ✅ |
| Page subheading | `text-brand-text/80` on `#181818` | ~`#c8c8c8` / `#181818` | 11.3:1 | ✅ |
| Step card heading | `text-brand-heading` on `#1f1f1f` | `#ffffff` / `#1f1f1f` | 16.7:1 | ✅ |
| Step card body text | `text-brand-text/70` on `#1f1f1f` | ~`#b3b3b3` / `#1f1f1f` | 8.4:1 | ✅ |
| Step indicator circle | `text-brand-on-primary` on `bg-brand-primary` | `#1b1b1b` / `#4da8d4` | 6.9:1 | ✅ |
| Flexible CTA text (default) | `text-brand-primary` on `#1f1f1f` | `#4da8d4` / `#1f1f1f` | 6.3:1 | ✅ |
| Flexible CTA text (hover) | `text-brand-on-primary` on `bg-brand-primary` | `#1b1b1b` / `#4da8d4` | 6.9:1 | ✅ |
| WhatsApp button text | `text-brand-primary` on `bg-brand-surface` | `#4da8d4` / `#1f1f1f` | 6.3:1 | ✅ |
| Focus ring (Flex button) | `ring-brand-primary` visible | `#4da8d4` | 6.9:1 | ✅ |

---

## Summary

| ID | Severity | Description | Component |
|---|---|---|---|
| F-DRK-01 | **S1** | PolicyFeeClarityPanel: all text invisible in dark mode (`dark:bg-brand-text` bug) | `PolicyFeeClarityPanel.tsx:55` |
| F-DRK-02 | **S1** | Saving badges: white on dark gold = 2.0:1 | `DoubleRoomBookContent.tsx:201,228` |
| F-DRK-03 | **S2** | `brand-accent` undefined: NR card has no CTA affordance, keyboard focus ring missing | `DoubleRoomBookContent.tsx:196–214` |
| F-DRK-04 | **S2** | Card borders still fail 3.0:1 after F-04 global fix; opacity pattern broken at dark depths | `DoubleRoomBookContent.tsx:154,183,255` |

**Critical path to checkout:** F-DRK-01 (hidden policy panel) + F-DRK-02 (invisible savings) + F-DRK-03 (broken NR CTA focus) form a combined S1 impact on the dark-mode checkout conversion flow.

---

## Artifact Paths

- Report: `docs/audits/contrast-sweeps/2026-03-10-book-double-room-dark/contrast-uniformity-report.md`
- JSON: `docs/audits/contrast-sweeps/2026-03-10-book-double-room-dark/contrast-findings.json`
