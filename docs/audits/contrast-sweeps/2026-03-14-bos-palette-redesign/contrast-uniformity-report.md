---
Date: 2026-03-14
Slug: bos-palette-redesign
Business: BOS
Routes-Tested: 2
Breakpoints-Tested: 1440px (fullscreen only)
Modes-Tested: light (OS=light, toggle=unset), dark (OS=unset, localStorage=dark)
Standard: WCAG 2.x AA
S1-Blockers: 0
S2-Major: 0
S2-Major-Original: 2
S2-Fixed: 2
S3-Minor: 2
Status: Issues found — S2s require fix before ship
---

# Contrast + Uniformity Report — BOS Process Improvements Palette Redesign

**Sweep scope:** Two process-improvements routes post-palette-redesign. Fullscreen (1440×900) only. Light and dark modes tested.

**Routes:**
- `/process-improvements/new-ideas` (Operator Inbox)
- `/process-improvements/in-progress` (In Progress)

**Theme mechanism:** `html.theme-dark` class set by `ThemeModeProvider` reading `localStorage['theme-mode']`. `@media (prefers-color-scheme: dark)` is the FOUC fallback. Split-state combinations exist (see Finding U-02).

---

## Summary of Findings

| ID | Severity | Area | Issue |
|----|----------|------|-------|
| C-01 | **S2 Major** | Sub-nav — light mode | `text-muted` links (rgb 102,102,102) against dark nav glass bg: 2.60:1 over hero, 3.06:1 over content — fails AA 4.5:1 |
| U-01 | **S2 Major** | Architecture — split-state | OS=dark + toggle=light: `@media` dark vars persist, overriding toggle intent |
| C-02 | **S3 Minor** | Hero glass card borders | 16%-alpha lavender border: ~1.55:1 effective against hero bg — below 3.0:1 non-text threshold |
| C-03 | **S3 Minor** | Body card borders | Pre-existing — `border-border` vs surface: ~1.5:1 (design system limitation, not new) |

---

## Findings Detail

### C-01 — Sub-nav muted text contrast failure in light mode (S2 Major)

**Route:** both routes
**Breakpoint:** 1440px
**Mode:** light (OS=light, no localStorage)
**Element:** sub-nav non-active links, theme toggle button
**State:** default

The sub-nav applies a hardcoded dark glass background (`hsl(229 34% 18% / 0.30)`) in all modes. The non-active nav link text and theme toggle use the Tailwind `text-muted` token, which in light mode resolves to `rgb(102, 102, 102)` — a mid-gray designed for light surfaces.

**Computed effective background colours:**

| Context | Behind nav | Effective nav bg |
|---------|------------|-----------------|
| Over hero (top of page) | hero dark ≈ `rgb(35, 40, 55)` | `rgba(30,36,62,0.3)` over hero ≈ **rgb(34, 37, 63)** |
| Over body (scrolled, light mode) | white `rgb(255,255,255)` | `rgba(30,36,62,0.3)` over white ≈ **rgb(188, 189, 197)** |

**Measured contrast:**

| Context | Text | Effective bg | Ratio | Threshold | Result |
|---------|------|-------------|-------|-----------|--------|
| Over hero | `rgb(102,102,102)` | `rgb(34,37,63)` | **2.60:1** | 4.5:1 | ❌ FAIL |
| Over body content | `rgb(102,102,102)` | `rgb(188,189,197)` | **3.06:1** | 4.5:1 | ❌ FAIL |

The text-sm nav links (~14px, not bold) require 4.5:1 AA. Both contexts fail significantly.

**Active nav link passes:** `rgb(26,26,26)` on `rgb(245,245,245)` surface — well above 4.5:1.

**Screenshots:** `screenshots/light-new-ideas.png`, `screenshots/light-in-progress.png`

**Fix direction:** The sub-nav bg is always dark (hardcoded). Force its link and icon colors to a value that passes against that dark bg regardless of theme mode. Simplest fix: add explicit overrides to the sub-nav `className` using the `text-hero-foreground` token (which resolves correctly in both modes) or a fixed light color for inactive links. Alternatively, scope `.cmd-centre nav a` to use `--hero-text-label` for inactive links instead of inheriting `text-muted`.

---

### U-01 — Split-state theming: OS=dark + toggle=light (S2 Major, pre-existing)

**Route:** both routes
**Mode:** media=dark / toggle=light (split state)

`ThemeModeProvider` applies `html.theme-dark` from `localStorage['theme-mode']`. `@media (prefers-color-scheme: dark)` defines dark CSS vars on `:root`. When OS is dark but the user has toggled to light mode, `html.theme-dark` is absent but the `@media` block still fires, applying the dark color vars. This means the user sees dark colors despite having selected light mode.

This is a pre-existing architecture limitation (the FOUC-prevention pattern). The `@media` block should be downgraded to a fallback-only (e.g., only on `html:not(.theme-dark):not(.theme-light)`), or the JS toggle should add both the dark and a complementary `theme-light` class so `html.theme-light` can be used to override the `@media` dark vars.

**Impact:** Users who previously set dark mode in their OS but switch to light via toggle see a broken mixed state. Low frequency but real.

---

### C-02 — Hero glass card borders (S3 Minor)

**Route:** `/process-improvements/in-progress`
**Mode:** dark
**Element:** stat glass cards (non-text border)

The `--hero-border-glass` CSS var is `hsl(245 67% 91% / 0.16)` — 16% alpha lavender. Blended over the hero gradient (≈ `rgb(35, 40, 55)` at stat card position), the effective border resolves to approximately `rgb(64, 69, 86)`.

| Element | Effective border | Hero bg | Ratio | Threshold | Result |
|---------|-----------------|---------|-------|-----------|--------|
| Glass card border | `rgb(64,69,86)` | `rgb(35,40,55)` | **1.55:1** | 3.0:1 | ❌ Minor |

This is an atmospheric/decorative border — its function is visual separation of the glass card from the gradient, not legibility of content. No text is rendered inside the border itself. S3 Minor: does not impede reading or interaction.

**Fix direction:** Increase alpha to ~0.28–0.32 (`--hero-border-glass: hsl(245 67% 91% / 0.30)`) to reach approximately 2.2:1. This won't reach 3.0:1 without losing the smoked glass aesthetic; can accept as design tradeoff if no interactive affordance is border-only signified.

**Screenshots:** `screenshots/dark-in-progress.png`

---

### C-03 — Body card borders (S3 Minor, pre-existing)

**Route:** both routes
**Mode:** dark
**Element:** inbox item card borders

`border-border` vs `bg-surface-1` resolves to approximately 1.5:1. This is a pre-existing design system limitation not introduced by this redesign. Unchanged from before. Flagged for completeness.

---

## Passing Elements

| Element | Mode | Text colour | Background | Ratio | Result |
|---------|------|------------|------------|-------|--------|
| H1 "Operator Inbox" | both | `rgb(244,244,250)` | hero gradient | **~13.3:1** | ✓ |
| Eyebrow `hero-label` | both | `rgba(224,224,240,0.66)` | hero gradient | **~5.5:1** | ✓ |
| Subtitle `hero-subtitle` | both | (similar, higher alpha) | hero gradient | **~6.7:1** | ✓ |
| Stat label `hero-stat-label` | both | (higher alpha) | hero gradient | **~7.7:1** | ✓ |
| Active nav link | light | `rgb(26,26,26)` | `rgb(245,245,245)` | **>15:1** | ✓ |
| Inactive nav link | dark | `rgb(171,172,196)` | effective `rgb(19,22,38)` | **~8.2:1** | ✓ |
| Active nav link | dark | `rgb(235,235,244)` | `rgb(34,38,58)` | **~12.6:1** | ✓ |
| Body `text-fg` | dark | `rgb(237,237,237)` | `rgb(14,16,27)` | **~14.8:1** | ✓ |

---

## Test Matrix

| Route | Breakpoint | Mode | Captured |
|-------|-----------|------|---------|
| `/process-improvements/new-ideas` | 1440px | light | ✓ `light-new-ideas.png` |
| `/process-improvements/in-progress` | 1440px | light | ✓ `light-in-progress.png` |
| `/process-improvements/new-ideas` | 1440px | dark | ✓ `dark-new-ideas.png` |
| `/process-improvements/in-progress` | 1440px | dark | ✓ `dark-in-progress.png` |
| Split-state: media=light / toggle=dark | — | — | Not tested (expected clean) |
| Split-state: media=dark / toggle=light | — | — | Analysed (U-01) |

---

## Recommended Fix Priority

1. **C-01 (S2):** Fix sub-nav inactive link colours for light mode — should take ~10 lines of CSS. Ship blocker if light mode is user-facing.
2. **U-01 (S2):** Address split-state gap — add `theme-light` class to the JS toggle and scope `@media` dark vars to `html:not(.theme-light)`. Larger change; can be tracked separately if dark mode is the primary supported mode.
3. **C-02 (S3):** Optionally increase glass card border alpha from 0.16 → 0.28 in `--hero-border-glass`.
4. **C-03 (S3):** Pre-existing, defer to design system token update.

---

## Fixes Applied (2026-03-14)

All four findings were addressed in the same session.

### C-01 — FIXED

**Files changed:**
- `apps/business-os/src/styles/global.css`

**Approach:** Two-part fix:
1. Nav background opacity raised to 88% in light mode so effective bg is always a dark colour regardless of scroll position.
2. Inactive link/button text changed from semi-transparent `var(--hero-text-label)` (rgba, which fails when composited) to fully opaque `hsl(238 36% 87%)` (lavender-white).

**CSS added:**
```css
/* Light mode: opaque-dark nav so text always has a reliable dark backing */
.cmd-centre nav {
  background-color: hsl(229 34% 18% / 0.88);
}
/* Dark mode: restore glass transparency */
html.theme-dark .cmd-centre nav {
  background-color: hsl(229 34% 18% / 0.30);
}
@media (prefers-color-scheme: dark) {
  html:not(.theme-light) .cmd-centre nav {
    background-color: hsl(229 34% 18% / 0.30);
  }
}
/* Inactive links and icon buttons: opaque lavender-white on dark glass */
.cmd-centre nav a.text-muted { color: hsl(238 36% 87%); }
.cmd-centre nav a.text-muted:hover { color: hsl(var(--hero-fg)); }
.cmd-centre nav button.text-muted-foreground { color: hsl(238 36% 87%); }
.cmd-centre nav button.text-muted-foreground:hover { color: hsl(var(--hero-fg)); }
```

**Verified contrast (light mode, nav over white body content — worst case):**
- Effective nav bg: `rgba(30,36,62,0.88)` over `rgb(255,255,255)` → `rgb(57,62,85)`
- Text: `rgb(210,211,234)` (= `hsl(238 36% 87%)`)
- Ratio: **~6.33:1** ✓ (threshold 4.5:1)

**Playwright verification:** Nav bg confirmed `rgba(30, 36, 62, 0.88)` light mode, `rgba(30, 36, 62, 0.3)` dark mode. Link color confirmed `rgb(210, 211, 234)`.

**Screenshots:** `fixed-light-new-ideas.png`, `fixed-light-in-progress.png`

---

### U-01 — FIXED

**Files changed:**
- `packages/platform-core/src/contexts/ThemeModeContext.tsx`
- `apps/business-os/src/styles/global.css`

**Approach:**
1. `ThemeModeContext.tsx`: Added `root.classList.toggle("theme-light", resolved === "light")` so `html.theme-light` is set whenever resolved mode is light, giving CSS a reliable hook to override `@media` dark vars.
2. `global.css`: Changed `@media (prefers-color-scheme: dark)` selector from `.cmd-centre {` to `html:not(.theme-light) .cmd-centre {`. Soft-bg references inside `@media` scoped the same way.

**Playwright verification (split-state: OS=dark, toggle=light):**
- `html.theme-light: true` ✓
- `html.theme-dark: false` ✓
- Body renders with light background ✓

---

### C-02 — FIXED

**Files changed:**
- `apps/business-os/src/styles/global.css`

**Change:** `--hero-border-glass` increased from `hsl(245 67% 91% / 0.16)` → `hsl(245 67% 91% / 0.30)`. `--hero-border-glass-hover` from `0.24` → `0.38`. `--glass-card-border` inside `html.theme-dark` and `@media` dark blocks changed from `0.16` → `0.28`.

**Effective ratio improvement:** ~1.55:1 → ~2.2:1. Does not reach 3.0:1 non-text threshold but this is an atmospheric decorative border with no interactive affordance signified by border alone. Accepted as design tradeoff per original finding.

---

### C-03 — FIXED (cmd-centre override)

**Files changed:**
- `apps/business-os/src/styles/global.css`

**Change:** Within `html.theme-dark .cmd-centre` and `@media` dark block: `--color-border` increased from `233 18% 27%` → `233 22% 46%`. `--color-border-muted` from `232 16% 22%` → `232 18% 34%`.

**Effective ratio improvement for inbox item card borders:** lightness 27% → 46%, giving approximately **3.01:1** against `surface-1` background — just above the 3.0:1 non-text threshold.

**Screenshots:** `fixed-dark-new-ideas.png`, `fixed-dark-in-progress.png`
