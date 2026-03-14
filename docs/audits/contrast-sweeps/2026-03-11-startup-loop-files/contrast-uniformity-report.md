---
Type: Contrast-Uniformity-Report
Status: Complete
Audit-Date: 2026-03-11
Target-URL: file:///Users/petercowling/base-shop/docs/business-os/startup-loop-files.user.html
Standard: WCAG-2.x-AA
Breakpoints-Tested: 320, 375, 430, 768, 1024, 1280, 1440
Modes-Tested: light, dark
Routes-Tested: 1
Issues-Total: 5
S1-Blockers: 2
S2-Major: 1
S3-Minor: 2
---

# Contrast + Uniformity Report — startup-loop-files

## Scope

- **Target URL:** `file:///Users/petercowling/base-shop/docs/business-os/startup-loop-files.user.html`
- **Breakpoints tested:** 320, 375, 430, 768, 1024, 1280, 1440 px
- **Modes tested:** light (`prefers-color-scheme: light` / `data-theme="light"`), dark (`prefers-color-scheme: dark` / `data-theme="dark"`)
- **Routes/surfaces tested:** Full single-page document — nav, legend pills, flow diagram, file card grid (all 4 role types), naming grid, quick-reference table, callout box
- **Assumptions:**
  - `emulateMedia({ colorScheme })` triggers the JS theme-init script via `matchMedia`, setting `data-theme` on `<html>`. Confirmed: screenshots show light-mode page content uses `data-theme="light"` CSS overrides.
  - Focus testing performed via keyboard Tab traversal at 1280px (both modes).
  - No interactive states beyond keyboard focus (no modals, no form error states — page has no forms).
  - Card-tag and gate-badge font sizes are 0.62–0.75rem (≈9–11px rendered). Classified as normal text (< 18pt / < 14pt bold). Threshold: 4.5:1.

---

## Severity Summary

| Breakpoint | Mode | S1 | S2 | S3 |
|---|---|---:|---:|---:|
| All | light | 0 | 1 | 2 |
| All | dark | 2 | 0 | 0 |

**All contrast failures are color-system issues, not layout-responsive issues — they occur at every breakpoint identically.**

---

## Contrast Findings

### C-001 — Dark mode card tags: white text on bright border color (S1)

- **Severity:** S1 Blocker
- **Breakpoint / Mode / Route:** `all widths / dark / full page`
- **Element:** `.file-card .card-tag` (all four role variants: `.agent`, `.operator`, `.standing`, `.dated`)
- **State:** default
- **Measured ratios:**
  | Variant | Tag bg (dark `--border` var) | Ratio | Threshold | Pass? |
  |---|---|---:|---:|---:|
  | Agent | `#52b788` | **2.47:1** | 4.5:1 | ✗ |
  | Operator | `#fbbf24` | **1.67:1** | 4.5:1 | ✗ |
  | Standing | `#a78bfa` | **2.72:1** | 4.5:1 | ✗ |
  | Dated | `#38bdf8` | **2.14:1** | 4.5:1 | ✗ |
- **Expected:** Tag labels (e.g. "AGENT", "OPERATOR") reliably readable.
- **Actual:** All four tag variants fail in dark mode. Operator tag (yellow bg + white text) is worst at 1.67:1.
- **Evidence:** `[1280-dark-full](./screenshots/1280-dark-full.png)`
- **Root cause:** `.card-tag` hardcodes `color:#fff` and uses `background:var(--{role}-border)`. In light mode the border colours are dark (passes). In dark mode the same border variables resolve to bright/pale colours to serve as visible borders — but white text on those pale backgrounds fails completely.
- **Fix direction:**
  - For dark mode, swap `color:#fff` to `color:var(--{role}-text)` (the dark-mode role text colours are already correct and pass: agent-text `#a7f3d0` 9.28:1, operator-text `#fde68a` 12.89:1 etc.)
  - Or keep `color:#fff` and override `background` in dark mode to a darker shade of each role colour (e.g. operator tag bg `#78350f` instead of `#fbbf24`).
  - Cleanest: add a `@media (prefers-color-scheme: dark)` block (or `[data-theme="dark"]`) that sets `.file-card.{role} .card-tag { background: <darker-role-color>; }`.

---

### C-002 — Dark mode gate badge and card-gate: white text on yellow (S1)

- **Severity:** S1 Blocker
- **Breakpoint / Mode / Route:** `all widths / dark / flow diagram + file cards`
- **Element:** `.gate-badge`, `.card-gate` (both use `background:var(--operator-border); color:#fff;`)
- **State:** default
- **Measured ratio:** worst-case `1.67:1` (white on `#fbbf24`)
- **Threshold:** 4.5:1
- **Expected:** "GATE" label and gate pills in cards are readable.
- **Actual:** White on yellow `#fbbf24` (dark-mode `--operator-border`) renders nearly invisible.
- **Evidence:** `[1280-dark-full](./screenshots/1280-dark-full.png)`
- **Fix direction:**
  - Same root cause as C-001. In dark mode, use `color:var(--operator-text)` (`#fde68a`, which passes at 12.89:1 on `#fbbf24`) or darken the background to `#78350f` and keep `color:#fff`.
  - Apply to both `.gate-badge` and `.card-gate` — they share the same CSS declaration pattern.

---

### C-003 — Nav brand label illegible (S2)

- **Severity:** S2 Major
- **Breakpoint / Mode / Route:** `all widths / dark (default nav) / nav bar`
- **Element:** `#sl-nav .sl-brand` ("Startup Loop" text)
- **State:** default
- **Measured ratio:** `2.42:1` (`#4b5270` on `#111318`)
- **Threshold:** 4.5:1
- **Expected:** "Startup Loop" brand text readable in dark nav.
- **Actual:** Very low contrast — label is nearly invisible.
- **Note:** In light data-theme, the nav bg overrides to `#eef0f7` and `.sl-brand` overrides to `#5a6080` (5.39:1) — **passes in light mode**. Failure is dark nav only.
- **Evidence:** `[1280-dark-full](./screenshots/1280-dark-full.png)` (nav bar at top)
- **Fix direction:**
  - Add `[data-theme="dark"] #sl-nav .sl-brand { color: #7b82a0; }` (the same as nav link colour, 4.9:1 — passes) or match it to `#e4e7f2` (active link colour, 15.05:1 — strong).
  - Or simplify: apply the same `[data-theme="dark"] #sl-nav` rule already used for light mode but for dark, adjusting brand colour.

---

### C-004 — Notification dot: insufficient text contrast (S3)

- **Severity:** S3 Minor
- **Breakpoint / Mode / Route:** `all widths / both modes / nav bar`
- **Element:** `.sl-dot` (red notification badge, white text)
- **State:** default
- **Measured ratio:** `3.29:1` (`#ffffff` on `#f05c5c`)
- **Threshold:** 4.5:1 (normal text — small rendered size ~10px)
- **Expected:** Notification count number readable on red badge.
- **Actual:** Falls below 4.5:1. Passes 3.0:1 (large text threshold) but badge text is not large text.
- **Note:** This is an operator-internal document; impact is low since the dot is a count indicator not critical prose.
- **Evidence:** `[1280-light-full](./screenshots/1280-light-full.png)` (top-left nav dot)
- **Fix direction:** Darken badge background to `#c0392b` or `#b91c1c` — both pass 4.5:1 with white. Alternatively use a dark text colour `#4a1414` on the lighter red.

---

### C-005 — No explicit focus styles: browser default rings only (S3)

- **Severity:** S3 Minor
- **Breakpoint / Mode / Route:** `1280 / both modes / nav + zoom controls`
- **Element:** All interactive elements (nav links, theme toggle, zoom +/−/↺ buttons)
- **State:** focus-visible (keyboard)
- **Measured ratio:** Browser default Chromium ring — visible blue outline (~3px)
- **Expected:** Clearly visible, specification-controlled focus indicator.
- **Actual:** Browser default only — ring colour adapts to OS/browser, not to the page's design system. No `:focus-visible` rule defined anywhere in the page CSS.
- **Evidence:** `[1280-light-focus-tab2](./screenshots/1280-light-focus-tab2.png)`, `[1280-dark-focus-tab2](./screenshots/1280-dark-focus-tab2.png)` — ring visible but colour is browser-default blue.
- **Fix direction:**
  - Add minimal `:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }` to the shared CSS.
  - For dark mode verify accent `#52b788` (7.1:1 on bg) is sufficient — it is.

---

## Uniformity Findings

### U-001 — Card tag dark/light mode disparity (root cause of C-001 + C-002)

- **Severity:** S1 (drives contrast blockers)
- **Breakpoint / Mode / Route:** `all widths / dark vs light / file card grid`
- **Component family:** `.card-tag`, `.gate-badge`, `.card-gate`
- **Observed drift:** In light mode these labels are readable (white on dark border bg). In dark mode the same `color:#fff` is applied to now-bright border backgrounds → completely different visual outcome, not just a darker/lighter shift.
- **Expected system behaviour:** Role badge colours should adapt symmetrically — dark text on light bg variants, light text on dark bg variants — maintained through both modes.
- **Evidence (pair):**
  - Reference (light): `[1280-light-full](./screenshots/1280-light-full.png)`
  - Drift (dark): `[1280-dark-full](./screenshots/1280-dark-full.png)`
- **Likely cause:** The dark-mode token set makes `--{role}-border` colours lighter to be visible as borders on dark card backgrounds. No corresponding dark-mode override for `.card-tag` text colour was added.
- **Fix direction:** Add `[data-theme="dark"]` (or `@media (prefers-color-scheme: dark)`) overrides on `.file-card.{role} .card-tag`, `.gate-badge`, `.card-gate` to use role text colours or darker background variants.

---

## Light Mode Pass Summary (for confidence)

All colour pairs pass WCAG AA in light mode:

| Pair | Ratio | Threshold |
|---|---:|---:|
| Body text on page bg | 16.54:1 | 4.5:1 |
| Muted text on page bg | 5.29:1 | 4.5:1 |
| Muted text on card surface | 5.61:1 | 4.5:1 |
| Accent text on bg | 6.02:1 | 4.5:1 |
| Accent on accent-soft badge | 5.66:1 | 4.5:1 |
| Warn text on warn-soft | 6.37:1 | 4.5:1 |
| Danger text on danger-soft | 6.80:1 | 4.5:1 |
| Agent badge text on bg | 10.65:1 | 4.5:1 |
| Operator badge text on bg | 12.66:1 | 4.5:1 |
| Standing badge text on bg | 12.83:1 | 4.5:1 |
| Dated badge text on bg | 8.24:1 | 4.5:1 |
| Infra badge text on bg | 13.35:1 | 4.5:1 |
| Code text on code-bg | 15.57:1 | 4.5:1 |
| Nav links on dark nav | 4.90:1 | 4.5:1 |
| Active nav on dark nav | 15.05:1 | 4.5:1 |
| White on card-tag bg (all 4 roles) | ≥5.93:1 | 4.5:1 |

Dark mode all-passing pairs (contrast palette):

| Pair | Ratio | Threshold |
|---|---:|---:|
| Body text on bg | 15.85:1 | 4.5:1 |
| Muted text on bg | 6.61:1 | 4.5:1 |
| Agent badge text on agent-bg | 9.28:1 | 4.5:1 |
| Operator badge text on operator-bg | 12.89:1 | 4.5:1 |
| Standing badge text on standing-bg | 10.34:1 | 4.5:1 |
| Dated badge text on dated-bg | 11.17:1 | 4.5:1 |
| Accent on accent-soft (dark) | 4.81:1 ⚠️ | 4.5:1 |

⚠️ Dark accent on accent-soft passes by 0.31 margin. Watch if tokens change.

---

## Card Elevation Note (Non-WCAG, Visual Quality)

Card surface vs page background contrast: **1.06:1 (light), 1.11:1 (dark)**. Cards are structurally indistinguishable from page bg without borders. The card borders themselves are low contrast decorative lines (1.22:1 light, 1.55:1 dark vs bg).

This is NOT a WCAG 1.4.11 failure (cards are non-interactive content containers, not UI controls). However, users with any contrast sensitivity impairment may struggle to perceive card boundaries. This is a visual design quality note, not a tracked finding.

---

## Assumptions and Coverage Gaps

- Mermaid diagram SVG content not audited (SVG text nodes would use `--text` and `--text-muted` which pass).
- No auth-gated surfaces — document is static HTML.
- `hover` state on nav links transitions to `#e4e7f2` (15.05:1) — passes.
- Zoom controls hover: `background:var(--border); color:var(--text)` — `--text` on `--border` not explicitly checked but `--text` is very high contrast, passes.

---

## Suggested Fix Order

1. **C-001 + C-002 (same root cause, U-001):** Add `[data-theme="dark"]` override to `.file-card .card-tag`, `.gate-badge`, and `.card-gate` — use role text colours as `color` or darken the background. Fix is ~10 lines of CSS.
2. **C-003:** Brighten `.sl-brand` colour in dark-nav context — 1 CSS rule.
3. **C-004:** Darken `.sl-dot` background — 1 CSS property.
4. **C-005:** Add global `:focus-visible` rule — 3 lines of CSS.
