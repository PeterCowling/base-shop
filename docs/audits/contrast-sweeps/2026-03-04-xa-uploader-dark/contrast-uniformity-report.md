---
Type: Contrast-Uniformity-Report
Status: Complete
Audit-Date: 2026-03-04
Target-URL: http://localhost:3020
Standard: WCAG-2.x-AA
Breakpoints-Tested: 1280
Modes-Tested: dark
Routes-Tested: 2
Issues-Total: 9
S1-Blockers: 4
S2-Major: 3
S3-Minor: 2
---

# Contrast + Uniformity Report — xa-uploader-dark

## Scope

- **Target URL:** http://localhost:3020
- **Breakpoints tested:** 1280px (desktop — primary operator viewport)
- **Modes tested:** dark only (operator confirmed no light mode use)
- **Routes/surfaces tested:** `/login` (login form), `/` (catalog console: tabs, product form, filter selectors, sync panel, header)
- **Assumptions:** Token values computed statically from `globals.css` dark overrides and `packages/themes/base/tokens.css`. Browser verification confirmed body/heading computed values match expected dark tokens. 768px breakpoint omitted — this is a desktop operator tool.

## Severity Summary

| Breakpoint | Mode | S1 | S2 | S3 |
|---|---|---:|---:|---:|
| 1280 | dark | 4 | 3 | 2 |

## Contrast Findings

### C-001 — Focus rings invisible on all dark backgrounds

- **Severity:** S1
- **Breakpoint / Mode / Route:** `1280 / dark / all`
- **Element:** All inputs, selects, buttons using `focus-visible:ring-gate-accent/30`
- **State:** `focus`
- **Measured ratio(s):** worst-case `1.53:1` (on input bg); `1.55:1` (on surface); `1.53:1` (on main bg)
- **Threshold:** `3.0:1` (non-text focus indicator)
- **Expected:** Visible focus ring for keyboard navigation
- **Actual:** Ring at 30% opacity of `hsl(190 70% 40%)` blends into dark backgrounds and is effectively invisible
- **Fix hypothesis:**
  - Likely cause: 30% opacity too low for dark-on-dark; was tuned for light mode
  - Direction: Increase ring opacity to 60-70% in `[data-theme="dark"]`, or use a solid `ring-gate-accent` without opacity modifier. Update `INPUT_CLASS`, `SELECT_CLASS`, `BTN_PRIMARY_CLASS`, `BTN_SECONDARY_CLASS`, `BTN_ACCENT_OUTLINE_CLASS`, `BTN_DANGER_CLASS` in `catalogStyles.ts`, and the inline class on the login form input.

### C-002 — Borders invisible on all dark backgrounds

- **Severity:** S1
- **Breakpoint / Mode / Route:** `1280 / dark / all`
- **Element:** All elements using `border-border-2` — inputs, selects, panels, cards, tab bar
- **State:** `default`
- **Measured ratio(s):** `1.52:1` (on main bg), `1.35:1` (on card surface), `1.24:1` (on input bg)
- **Threshold:** `3.0:1` (non-text essential UI boundary)
- **Expected:** Visible border delineating input fields, panels, and interactive regions
- **Actual:** `--color-border-2: 220 15% 22%` resolves to `rgb(48,53,65)` — too close to the dark backgrounds (8-16% lightness)
- **Fix hypothesis:**
  - Likely cause: `--color-border-2` in the dark override (`globals.css:136`) is set to `220 15% 22%` which is only ~6-14 lightness points above the backgrounds
  - Direction: Raise to `220 15% 32%` or higher in the `[data-theme="dark"]` block to achieve 3:1 on all surfaces. Alternative: use `--color-border-strong` for input/panel borders.

### C-003 — White text on accent button fails AA

- **Severity:** S1
- **Breakpoint / Mode / Route:** `1280 / dark / all`
- **Element:** Primary buttons (`BTN_PRIMARY_CLASS`): "Enter console", "Save as Draft"
- **State:** `default`
- **Measured ratio(s):** `3.49:1`
- **Threshold:** `4.5:1` (normal text)
- **Expected:** Button label clearly readable
- **Actual:** `rgb(255,255,255)` text on `hsl(190 70% 40%)` = `rgb(31,150,173)` background — the cyan accent is too light for white text
- **Fix hypothesis:**
  - Likely cause: `--gate-accent: hsl(190 70% 40%)` is a mid-lightness cyan; not dark enough for white text at normal size
  - Direction: Either darken accent to `hsl(190 70% 30%)` (achieves ~5.3:1) or use dark text (`--gate-ink`) on the accent button. Darkening accent is preferred — it preserves the design intent while passing AA.

### C-004 — Login page missing dark-mode initialization

- **Severity:** S1
- **Breakpoint / Mode / Route:** `1280 / dark / /login`
- **Element:** Entire login page — all gate tokens
- **State:** `default` (fresh page load)
- **Measured ratio(s):** N/A — structural issue, not a ratio failure
- **Threshold:** N/A
- **Expected:** Dark mode persists across all routes when user preference is "dark"
- **Actual:** `/login/page.tsx` does not render `ThemeToggle` component. On fresh navigation to `/login`, `data-theme="dark"` is never set on `<html>`. Gate tokens remain at light-mode values. Body uses `bg-gate-bg text-gate-ink` which resolve to `:root` defaults (dark bg via `hsl(var(--color-fg))` but inputs show white bg with dark text).
- **Fix hypothesis:**
  - Likely cause: ThemeToggle only exists in `UploaderHome.client.tsx`, not in the login page
  - Direction: Extract theme initialization into a shared component or layout-level script that runs on all pages. A minimal `<script>` in `layout.tsx` that reads localStorage and sets `data-theme` + `theme-dark` class before paint would prevent FOUC.

### C-005 — Muted/placeholder text on accent-soft background fails AA

- **Severity:** S2
- **Breakpoint / Mode / Route:** `1280 / dark / /` (edit filter, hover states)
- **Element:** `text-gate-muted` on `bg-gate-accent-soft` — filter selector hover states, product list items
- **State:** `hover`
- **Measured ratio(s):** `4.13:1`
- **Threshold:** `4.5:1`
- **Expected:** Secondary text readable on hover highlight
- **Actual:** `rgb(140,140,140)` on `rgb(23,48,54)` — borderline fail
- **Fix hypothesis:**
  - Likely cause: `--gate-accent-soft` dark value `hsl(190 40% 15%)` is slightly too bright relative to muted text
  - Direction: Darken accent-soft to `hsl(190 40% 12%)` or lighten muted to `hsl(0 0% 60%)` in dark mode

### C-006 — Disabled button/input text falls below AA

- **Severity:** S2
- **Breakpoint / Mode / Route:** `1280 / dark / all`
- **Element:** Disabled buttons and inputs (`disabled:opacity-50`)
- **State:** `disabled`
- **Measured ratio(s):** `4.35:1` (ink at 50%), `2.25:1` (muted at 50%)
- **Threshold:** `4.5:1` (WCAG does not exempt disabled controls, though this is commonly relaxed)
- **Expected:** Disabled controls visually distinct but not invisible
- **Actual:** Primary text barely fails; muted text significantly fails when disabled
- **Fix hypothesis:**
  - Likely cause: `disabled:opacity-50` applied globally in catalogStyles.ts; 50% opacity works for light mode but drops dark-mode text below threshold
  - Direction: Consider `disabled:opacity-60` or apply disabled styling via separate muted text color rather than blanket opacity. Low priority if team accepts WCAG exemption for disabled controls.

### C-007 — Placeholder text on white input (light-mode leak)

- **Severity:** S2
- **Breakpoint / Mode / Route:** `1280 / dark / /login`
- **Element:** Login token input placeholder
- **State:** `default` (when [data-theme="dark"] not applied)
- **Measured ratio(s):** `3.36:1`
- **Threshold:** `4.5:1`
- **Expected:** Placeholder text readable against input background
- **Actual:** `--gate-muted` (55% grey) on white input bg when dark override fails to apply
- **Fix hypothesis:**
  - Linked to C-004 — fixing login page dark init resolves this
  - Additionally: placeholder text at `hsl(0 0% 55%)` on white bg is too low-contrast even for a light-mode design

## Uniformity Findings

### U-001 — Login page vs Console dark-mode inconsistency

- **Severity:** S3
- **Breakpoint / Mode / Route:** `1280 / dark / /login vs /`
- **Component family:** Page layout / theme initialization
- **Observed drift:** Console page correctly initializes dark mode via ThemeToggle; login page has no theme initialization. User experiences a flash of light-mode tokens on login, then dark mode after authentication redirects to console.
- **Expected system behavior:** Consistent dark theme across all routes
- **Likely cause:** ThemeToggle rendered only in UploaderHome, not in login layout
- **Fix direction:** Shared theme-init script in root layout (see C-004)

### U-002 — Header bg and main bg near-identical in dark mode

- **Severity:** S3
- **Breakpoint / Mode / Route:** `1280 / dark / /`
- **Component family:** Header / Page sections
- **Observed drift:** `--gate-header-bg: hsl(220 20% 10%)` and `--gate-bg: hsl(220 20% 8%)` differ by only 2% lightness. The header strip is not visually distinguishable from the content area.
- **Expected system behavior:** Header should be visually distinct from content
- **Likely cause:** `--gate-header-bg` is not overridden in `[data-theme="dark"]` — it uses the same value as light mode, which happens to be very close to the dark main bg
- **Fix direction:** No action required if intentional (dark mode often merges header/body). If distinction is desired, lighten header to `hsl(220 20% 14%)` or add a bottom border.

## Cross-Finding Notes

- C-001 (focus rings) and C-002 (borders) share a root cause: opacity/lightness values tuned for light mode backgrounds that become invisible on dark backgrounds. A single pass through `catalogStyles.ts` + `globals.css` dark overrides can fix both.
- C-004 (login missing ThemeToggle) is the root cause of C-007 (placeholder on white). Fix C-004 first.
- C-003 (button contrast) is independent — the accent color needs darkening regardless of other fixes.

## Assumptions and Coverage Gaps

- Could not authenticate in headless to reach console surfaces — contrast pairings for console computed from static token analysis (catalogStyles.ts class constants matched to globals.css dark values)
- Input placeholder pseudo-element (`::placeholder`) contrast computed from token values, not measured at runtime
- 768px mobile breakpoint not tested — operator confirmed this is a desktop tool
- Interaction states (hover, active) computed from token blending, not observed at runtime
- Edit filter cascade (EditProductFilterSelector) uses same gate tokens as catalogStyles.ts — inherits all findings above

## Suggested Fix Order

1. **C-004** — Add theme initialization to login page / root layout (structural fix, unblocks C-007)
2. **C-002** — Raise `--color-border-2` dark value to `220 15% 32%` in globals.css (single line, fixes all borders)
3. **C-003** — Darken `--gate-accent` to `hsl(190 70% 30%)` in globals.css dark overrides (single line, fixes button contrast)
4. **C-001** — Change `focus-visible:ring-gate-accent/30` to `/60` or `/70` in catalogStyles.ts (6 class constants)
5. **C-005** — Adjust `--gate-accent-soft` or `--gate-muted` in dark mode (minor tweak)
6. **C-006** — Change `disabled:opacity-50` to `disabled:opacity-60` (optional, commonly exempted)
7. **U-002** — Header/bg distinction (cosmetic, optional)
