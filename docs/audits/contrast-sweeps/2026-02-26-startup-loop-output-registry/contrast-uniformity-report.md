# Contrast + Uniformity Audit — Startup Loop Output Registry

**Date:** 2026-02-26
**Route:** `file:///…/docs/business-os/startup-loop-output-registry.user.html`
**Breakpoints tested:** 1440×900 (fullscreen)
**Themes tested:** dark (`data-theme="dark"`), light (`data-theme="light"`)
**Standard:** WCAG 2.x AA
**Method:** Static CSS analysis + computed WCAG contrast ratios via linearised sRGB luminance formula

---

## Summary

| Severity | Count | IDs |
|----------|-------|-----|
| S1 Blocker | 0 | — |
| S2 Major | 4 | C-01, C-02, C-05, U-01 |
| S3 Minor | 3 | C-03, C-04, U-02 |
| **Total** | **7** | |

---

## Contrast Findings

### C-01 · S2 Major — Dark mode: secondary/muted text fails AA across multiple surfaces

**Theme:** dark | **Breakpoint:** 1440×900 | **State:** default

**Affected elements and selectors:**

| Element | Selector | Font size | Foreground | Background (effective) | Ratio | Threshold | Result |
|---------|----------|-----------|------------|------------------------|-------|-----------|--------|
| Page subtitle | `.page-header p` | 13px | `--muted: #5a6b7a` | `#0e1016` (body) | **3.47:1** | 4.5:1 | ❌ FAIL |
| Snapshot chip | `.snapshot-chip` | 11px mono | `--muted: #5a6b7a` | `#0e1016` (body) | **3.47:1** | 4.5:1 | ❌ FAIL |
| Panel metadata | `.panel-meta` | 12px mono | `--muted: #5a6b7a` | panel gradient on body | **~3.40:1** | 4.5:1 | ❌ FAIL |
| Build summary status | `.build-summary-status` | 12px mono | `--muted: #5a6b7a` | panel gradient on body | **~3.40:1** | 4.5:1 | ❌ FAIL |
| Filter labels | `.build-summary-controls label` | 11px mono, uppercase | `--muted: #5a6b7a` | panel gradient on body | **~3.40:1** | 4.5:1 | ❌ FAIL |
| Empty table state | `.build-summary-empty` | 12px italic | `--muted: #5a6b7a` | panel gradient on body | **~3.40:1** | 4.5:1 | ❌ FAIL |
| Fold metadata | `.fold-meta` | 10px mono | `--muted: #5a6b7a` | fold summary bg on body | **~3.35:1** | 4.5:1 | ❌ FAIL |

**Measurement detail:**
- Background body (sl-theme dark): `#0e1016` → L = 0.00496
- `--muted: #5a6b7a` → L = 0.14092
- Contrast = (0.14092 + 0.05) / (0.00496 + 0.05) = **3.47:1**
- Panel gradient composited on body adds slight opacity but remains very dark; ratios drop to ~3.35–3.40:1 at mid-gradient.

**Root cause:** The `:root` CSS block defines `--muted: #5a6b7a` as a secondary text colour calibrated for the original deep-space gradient background. The `sl-theme-css` block introduces a separate `--text-muted: #6b728f` variable for the theme system but never overrides `--muted`. All elements that use `var(--muted)` therefore keep the darker value in every theme, while the effective background under `data-theme="dark"` shifts to `#0e1016` — slightly lighter than the original gradient, reducing contrast.

**Fix direction:** Add `--muted: #909db5` (or equivalent value yielding ≥ 4.5:1 on `#0e1016`) to the `html[data-theme="dark"] { … }` block in `sl-theme-css`. Alternatively, unify the two muted-colour token names (see U-01).

---

### C-02 · S2 Major — Dark mode: nav brand label near-invisible

**Theme:** dark | **Breakpoint:** 1440×900 | **State:** default

| Element | Selector | Font size | Foreground | Background | Ratio | Threshold | Result |
|---------|----------|-----------|------------|------------|-------|-----------|--------|
| Nav brand "Startup Loop" | `#sl-nav .sl-brand` | 10px, uppercase, bold | `#4b5270` | `#111318` (nav bg) | **2.42:1** | 4.5:1 (text), 3.0:1 (non-text) | ❌ FAIL both |

**Measurement detail:**
- `#111318` → L = 0.00657
- `#4b5270` → L = 0.08716
- Contrast = (0.08716 + 0.05) / (0.00657 + 0.05) = **2.42:1**

The "Startup Loop" brand label is the primary navigation landmark and first visible text on every page. At 10px uppercase it is small text; it also fails the non-text 3.0:1 threshold, so it would be effectively invisible to users with any degree of low vision.

Note: the light-mode override correctly raises this to `#5a6080` → 5.54:1 on `#eef0f7`, so this failure is **dark mode only**.

**Fix direction:** Change `#sl-nav .sl-brand { color: #4b5270 }` to `color: #7b82a0` (matches the inactive link color → 4.91:1) in the `#sl-nav` style block. The brand label does not require accent colour — it just needs to be legible.

---

### C-03 · S3 Minor — Light mode: artifact path text near-miss

**Theme:** light | **Breakpoint:** 1440×900 | **State:** default

| Element | Selector | Font size | Foreground | Background | Ratio | Threshold | Result |
|---------|----------|-----------|------------|------------|-------|-----------|--------|
| Artifact file path | `.artifact-path` | 11px | `#6b7a96` | `#f8f9fd` (artifact bg, light) | **4.17:1** | 4.5:1 | ❌ FAIL |

**Measurement detail:**
- `#f8f9fd` → L ≈ 0.9560
- `#6b7a96` → L = 0.19244
- Contrast = (0.9560 + 0.05) / (0.19244 + 0.05) = **4.17:1**

Small margin miss. The path text is the file location shown below each artifact title — useful for navigating to files. At 11px it is small normal text, so 4.5:1 applies.

**Fix direction:** In `sl-theme-registry-light`, change `.artifact-path` override from `#6b7a96` to `#5a6880` (≈ 4.7:1 on `#f8f9fd`), or `#506070` for comfortable margin.

---

### C-04 · S3 Minor — Dark mode: diagram zoom control buttons

**Theme:** dark | **Breakpoint:** 1440×900 | **State:** default / hover

| Element | Selector | Font size | Foreground | Background | Ratio | 4.5:1 text | 3.0:1 non-text | Result |
|---------|----------|-----------|------------|------------|-------|------------|----------------|--------|
| Zoom controls (+, −, ↺) | `.zoom-controls button` | 13px mono | `--text-muted: #6b728f` | `--surface: #161921` | **3.70:1** | ❌ FAIL | ✅ PASS | Borderline |

**Measurement detail:**
- `#161921` → L = 0.00977
- `#6b728f` → L = 0.17138
- Contrast = (0.17138 + 0.05) / (0.00977 + 0.05) = **3.70:1**

These buttons use Unicode text characters as icons. They have `title` attributes for tooltip disclosure but no `aria-label`. Under WCAG, interactive controls require 4.5:1 for their label text unless the label is purely decorative (which it is not here — it conveys the zoom function).

**Fix direction:** Either (a) increase `.zoom-controls button { color }` to `var(--text)` (≥ 15:1) in dark mode, or (b) add `aria-label` attributes (`aria-label="Zoom in"` etc.) and switch the visual character to a true SVG icon so it qualifies as non-text UI (3.0:1 threshold → already passes).

---

### C-05 · S2 Major — Light mode: build summary secondary text invisible on semi-transparent gradient

**Theme:** light | **Breakpoint:** 1440×900 | **State:** default

| Element | Selector | Foreground | Effective background | Ratio | Threshold | Result |
|---------|----------|------------|----------------------|-------|-----------|--------|
| Build summary status | `.build-summary-status` | `--muted: #5a6b7a` | ~`#404858` (gradient composited on `#f5f6fa`) | **~1.68:1** | 4.5:1 | ❌ FAIL |
| Filter labels | `.build-summary-controls label` | `--muted: #5a6b7a` | ~`#404858` | **~1.68:1** | 4.5:1 | ❌ FAIL |
| Empty table message | `.build-summary-empty` | `--muted: #5a6b7a` | ~`#404858` | **~1.68:1** | 4.5:1 | ❌ FAIL |

**Measurement detail:**
The `.build-summary` element uses `background: linear-gradient(180deg, rgba(12,24,48,0.62), rgba(7,15,30,0.92))`. In dark mode this composites onto a near-black body and remains very dark. In light mode (`data-theme="light"`, body `#f5f6fa`) the gradient composites to a mid blue-gray (approx. `#404858` at the 50% gradient stop):

- R = 9.5 × 0.77 + 245 × 0.23 ≈ 64; G ≈ 72; B ≈ 88 → effective bg `#404858`
- `#404858` → L ≈ 0.0634
- `--muted: #5a6b7a` → L = 0.14092
- Contrast = (0.14092 + 0.05) / (0.0634 + 0.05) = **1.68:1**

The muted colour is a blue-grey sitting close to the composited gradient background in both hue and luminance. Labels such as "BUSINESS", "TIMEFRAME", the entry-count status line, and the empty-state italic message are essentially invisible in light mode.

**Root cause:** The `sl-theme-registry-light` stylesheet overrides `.panel`, `.artifact`, `.artifact-fold`, `.operator-block`, etc. but has **no override for `.build-summary`**. The build summary's dark semi-transparent gradient persists in light mode, creating an intermediate background that is too dark for the muted colour used on it.

**Fix direction (two options):**
- **Option A (simpler):** Add to `sl-theme-registry-light`: `.build-summary { background: #ffffff !important; border-color: #dde0ed !important; }` and `.build-summary-status, .build-summary-controls label, .build-summary-empty { color: #5a6080 !important; }` — mirrors the pattern used for `.panel`.
- **Option B:** Change the muted text inside `.build-summary` to always use a light colour (e.g. `#b8c5d6`) regardless of theme, since the gradient is always dark. Add those overrides inline rather than relying on the theme token.

---

## Uniformity Findings

### U-01 · S2 Major — Two parallel muted-colour token systems, one never theme-adapted

**Themes:** all | **Breakpoint:** all | **Component:** global token layer

The codebase has two separate secondary/muted colour variables that are never bridged:

| Variable | Defined in | Dark value | Light value | Used by |
|----------|------------|------------|-------------|---------|
| `--muted` | `:root { }` in body CSS | `#5a6b7a` (never changed) | `#5a6b7a` (never changed) | `.page-header p`, `.snapshot-chip`, `.panel-meta`, `.build-summary-status`, `.build-summary-controls label`, `.build-summary-empty`, `.fold-meta`, `.section-placeholder p` |
| `--text-muted` | `sl-theme-css` (`html[data-theme="dark"]` / `light`) | `#6b728f` (dark) / `#5a6080` (light) | adapts | `.zoom-controls button`, `.mermaid .edgeLabel`, `.diagram-caption` |

Elements using `var(--muted)` receive a dark-mode-only value calibrated for the original deep-space gradient. They are never updated by the theme layer. This creates:
1. Contrast failures in dark mode (see C-01) — `#5a6b7a` is too dark for the lighter sl-theme dark background `#0e1016`.
2. Invisible text in light mode build-summary (see C-05) — `#5a6b7a` is too dark for the composited mid-gradient background.
3. Inconsistent secondary text appearance between regions that use `--muted` and those that use `--text-muted`.

**Fix direction:** Add `--muted` to both theme blocks in `sl-theme-css`:
```css
html[data-theme="dark"]  { …; --muted: #909db5; }   /* ≥4.5:1 on #0e1016 */
html[data-theme="light"] { …; --muted: #5a6080; }   /* already defined as --text-muted light */
```
Then the existing usages of `var(--muted)` throughout the file will automatically receive the correct adapted value, and C-01 / C-05 are resolved in one change.

---

### U-02 · S3 Minor — No custom focus-visible styles

**Themes:** all | **Breakpoint:** all | **Component:** interactive elements (links, buttons, selects)

No `:focus-visible` rule is defined anywhere in the stylesheet. Interactive elements (nav links, tab buttons, build-summary controls, zoom buttons, "Open" artifact links) rely entirely on the browser's default focus indicator.

In Chromium, the default focus ring is a 2px blue outline (`#005FCC` approximately). On the dark nav bar (`#111318`) and dark panel backgrounds, the default ring has adequate contrast; on the light-mode white panels the ring may still be acceptable. However:
- The ring is not visually consistent with the accent colours used elsewhere.
- It has no `outline-offset`, meaning it may clip inside border-radius corners on rounded elements (`.tab-button`, `.artifact`).
- It is absent in non-Chromium environments by default unless the user agent provides a fallback.

**Fix direction:** Add explicit focus-visible styles targeting the interactive elements:
```css
a:focus-visible,
button:focus-visible,
select:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}
```
This anchors the focus ring to the accent colour (blue in dark mode, `#5b9cf6`; blue in light mode, `#3362d0`), which passes 3.0:1 non-text contrast against both background families.

---

## Passing Checks (representative samples)

| Element | Theme | Foreground | Background | Ratio | Threshold | Result |
|---------|-------|------------|------------|-------|-----------|--------|
| Page `h1` | dark | `#ece8e0` | `#0e1016` | 16.1:1 | 4.5:1 | ✅ |
| Nav links (inactive) | dark | `#7b82a0` | `#111318` | 4.91:1 | 4.5:1 | ✅ |
| Nav links (active) | dark | `#e4e7f2` | `#111318` | 15.0:1 | 4.5:1 | ✅ |
| Nav brand label | light | `#5a6080` | `#eef0f7` | 5.54:1 | 4.5:1 | ✅ |
| Body text | dark | `--text: #e4e7f2` | `#0e1016` | 15.5:1 | 4.5:1 | ✅ |
| Body text | light | `--text: #1a1d2e` | `#f5f6fa` | 15.5:1 | 4.5:1 | ✅ |
| Accent links | dark | `--accent: #5b9cf6` | panel gradient | 6.9:1 | 4.5:1 | ✅ |
| Accent links | light | `--accent: #3362d0` | `#f8f9fd` | 7.1:1 | 4.5:1 | ✅ |
| Panel `h2` | dark | `#ece8e0` | panel gradient | 14.8:1 | 4.5:1 | ✅ |
| Panel `h2` | light | `#1a1d2e` | `#ffffff` | 18.1:1 | 4.5:1 | ✅ |
| Build summary `h2` | light | `#ece8e0` | composited gradient mid | 4.34:1 | 3.0:1 (large text, 18px/600wt) | ✅ |
| Fold summary text | dark | `#ece6d8` | fold header bg | 14.8:1 | 4.5:1 | ✅ |
| Table header | dark | `#efeadd` | thead bg | 14.4:1 | 4.5:1 | ✅ |
| Table body text | dark | `#e4e7f2` | panel gradient | 15.5:1 | 4.5:1 | ✅ |
| Artifact content text | light | `#2a2f4a` | `#f8f9fd` | 12.6:1 | 4.5:1 | ✅ |
| Content table `th` | light | `#1a1d2e` | `#e8eaf5` | 14.3:1 | 4.5:1 | ✅ |
| Active tab HEAD | light | `#4c3aaa` | `rgba(120,80,200,.1)+white` | 7.6:1 | 4.5:1 | ✅ |
| Active tab BRIK | light | `#7a5a00` | `rgba(200,150,0,.1)+white` | 6.2:1 | 4.5:1 | ✅ |

---

## Assumptions and Scope Gaps

- **Screenshots not captured:** The browser MCP tooling available (Playwright-backed session with a11y-tree observe/act interface) does not expose a direct screenshot API. All ratios are computed analytically from the stylesheet using the WCAG linearised-sRGB luminance formula. Evidence for each finding is the CSS source + arithmetic shown above.
- **Gradient sampling:** For elements on the semi-transparent `.build-summary` and `.panel` gradients, background luminance is computed at the 50% gradient stop (worst-case middle). The top and bottom stops are better and worse respectively; worst-case is reported per WCAG guidance.
- **Select element rendering:** `<select>` elements in `.build-summary-controls` use `background: rgba(255,255,255,0.04)` which Chromium overrides with platform-native rendering. These were excluded from contrast analysis.
- **Responsive breakpoint (768px):** Only one CSS breakpoint exists (`@media (max-width: 768px)`) which affects tab layout only (tabs go to 50% width). No text-colour or background changes occur at that breakpoint. Responsive contrast behaviour is identical to 1440px.

---

## Recommended Fix Priority

1. **Fix U-01 first** — Adding `--muted` overrides to both `sl-theme-css` theme blocks simultaneously resolves C-01 and most of C-05 with a two-line CSS change, unifying the token systems.
2. **Fix C-05 remainder** — Add `.build-summary` background override to `sl-theme-registry-light` so the section has an opaque light background in light mode (same pattern already used for `.panel`).
3. **Fix C-02** — Change nav brand colour from `#4b5270` to `#7b82a0` in the `#sl-nav` inline style block.
4. **Fix C-03** — Darken `.artifact-path` in the light-mode override from `#6b7a96` to `#506070`.
5. **Fix U-02** — Add a global `:focus-visible` rule.
6. **Fix C-04** — Optionally lighten zoom button colour or add `aria-label` + switch to SVG icons.
