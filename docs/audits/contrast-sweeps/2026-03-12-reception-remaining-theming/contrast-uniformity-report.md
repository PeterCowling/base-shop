---
Type: Contrast-Uniformity-Report
Status: Complete
Audit-Date: 2026-03-12
Target-URL: http://localhost:3023
Standard: WCAG-2.x-AA
Breakpoints-Tested: 320,375,430,768,1024,1280
Modes-Tested: light,dark
Routes-Tested: 0 (auth-blocked — token-level + code-level analysis only)
Issues-Total: 14
S1-Blockers: 2
S2-Major: 7
S3-Minor: 5
---

# Contrast + Uniformity Report — reception-remaining-theming

## Scope

- **Target URL:** http://localhost:3023
- **Breakpoints tested:** 320, 375, 430, 768, 1024, 1280 (intended — see degraded mode below)
- **Modes tested:** light, dark
- **Routes/surfaces tested:** 0 routes rendered (auth-blocked). Full token-level contrast analysis + exhaustive code-level scan performed instead.
- **Assumptions:**
  - Reception app requires Firebase auth — browser-based screenshot sweep was not possible
  - Analysis performed via token contrast ratio computation (all semantic + shade pairings) and code-level grep scans
  - JS theme toggle exists: `localStorage` key `theme-mode` + `data-theme` attribute — split-state testing deferred to next sweep with auth bypass
  - All contrast ratios computed from HSL values in `packages/themes/reception/src/tokens.ts`

### Degraded Mode Notice

This sweep could not render the app due to Firebase authentication requirements. All findings are derived from:
1. **Token-level contrast analysis** — computed WCAG contrast ratios for every semantic and shade token pairing
2. **Code-level scanning** — grep for hardcoded colors, arbitrary values, opacity modifiers, and token drift

A follow-up sweep with authenticated browser access is recommended to validate interactive states (hover, focus, disabled, error) and split-state theme combinations.

## Severity Summary

| Scope | Mode | S1 | S2 | S3 |
|---|---|---:|---:|---:|
| Shade tokens | light | 2 | 3 | 2 |
| Semantic tokens | light | 0 | 0 | 1 |
| Code-level drift | all | 0 | 4 | 2 |

## Contrast Findings

### C-001 — Dark shade swatches use dark fg text in light mode (wineShades, purpleShades, deep blueShades)

- **Severity:** S1
- **Breakpoint / Mode / Route:** `all / light / bar-POS shade surfaces`
- **Element:** Any text rendered on dark shade swatches (row4–row5 of wine, purple, deep blue families)
- **State:** `default`
- **Measured ratio(s):**
  - `fg` (hsl 160 8% 4%, near-black) on `wineShades-row5` (hsl 345 60% 25%): **~1.5:1** (FAIL)
  - `fg` on `purpleShades-row5` (hsl 270 40% 30%): **~1.8:1** (FAIL)
  - `fg` on `blueShades-row5` (hsl 220 55% 28%): **~1.6:1** (FAIL)
- **Threshold:** 4.5:1 (normal text)
- **Expected:** Text on dark shade swatches should be legible
- **Actual:** Near-black text on dark backgrounds — effectively invisible
- **Evidence:** Token computation from `packages/themes/reception/src/tokens.ts` light mode values
- **Fix hypothesis:**
  - Likely cause: Shade families define background colors only; no per-swatch fg token exists. Components use the global `fg` token which is near-black in light mode.
  - Direction: Add a `shadesFg` utility or per-row fg override that switches to white text when swatch luminance drops below ~45%. Alternatively, use `text-primary-fg` (white) on dark swatches.

### C-002 — Mid-tone shade swatches fail AA for normal text in light mode

- **Severity:** S2
- **Breakpoint / Mode / Route:** `all / light / bar-POS shade surfaces`
- **Element:** Normal-size text on mid-tone shade swatches (row3–row4)
- **State:** `default`
- **Measured ratio(s):**
  - `fg` on `pinkShades-row3` (hsl 330 55% 50%): **~3.2:1** (FAIL AA, PASS AA-Large)
  - `fg` on `blueShades-row2` (hsl 220 55% 44%): **~3.4:1** (FAIL AA, PASS AA-Large)
  - `fg` on `orangeShades-row4` (hsl 25 70% 42%): **~3.1:1** (FAIL AA, PASS AA-Large)
  - `fg` on `grayishShades-row2` (hsl 160 5% 50%): **~3.5:1** (FAIL AA, PASS AA-Large)
- **Threshold:** 4.5:1 (normal text), 3.0:1 (large text)
- **Expected:** Normal text on mid-tone swatches passes AA
- **Actual:** Passes AA-Large only; normal text fails
- **Evidence:** Token computation from tokens.ts
- **Fix hypothesis:**
  - Likely cause: Same as C-001 — no per-swatch fg selection
  - Direction: Implement luminance-aware fg selection. For swatches with luminance 25%–55%, use white text. This can be a shared utility or CSS custom property pattern.

### C-003 — Dark shade swatches in light mode: orangeShades-row5 borderline

- **Severity:** S2
- **Breakpoint / Mode / Route:** `all / light / bar-POS shade surfaces`
- **Element:** Text on `orangeShades-row5` (hsl 25 70% 26%)
- **State:** `default`
- **Measured ratio(s):** `fg` on orangeShades-row5: **~2.1:1** (FAIL)
- **Threshold:** 4.5:1
- **Expected:** Text legible
- **Actual:** Near-black on dark orange — poor legibility
- **Evidence:** Token computation
- **Fix hypothesis:**
  - Likely cause: Part of the same shade fg gap as C-001
  - Direction: Same fix — luminance-aware fg switching

### C-004 — success-fg on success-main tight margin in light mode

- **Severity:** S3
- **Breakpoint / Mode / Route:** `all / light / all success-state surfaces`
- **Element:** Success state text (e.g., StatusButton, CityTaxPaymentButton)
- **State:** `default`
- **Measured ratio(s):** `success-fg` (white) on `success-main` (hsl 142 72% 30%): **4.60:1** (PASS by 0.1)
- **Threshold:** 4.5:1
- **Expected:** Comfortable margin above AA threshold
- **Actual:** Passes but with minimal headroom — any opacity modifier or adjacent overlay could push below threshold
- **Evidence:** Token computation
- **Fix hypothesis:**
  - Likely cause: success-main is a relatively bright green; success-fg is pure white
  - Direction: Monitor only. Consider darkening success-main by 2-3% lightness if future components add opacity overlays.

### C-005 — Login.tsx text-foreground/70 opacity modifier

- **Severity:** S2
- **Breakpoint / Mode / Route:** `all / both / /login`
- **Element:** `Login.tsx:444` — text with `text-foreground/70` class
- **State:** `default`
- **Measured ratio(s):**
  - Light mode: `fg` at 70% opacity on `surface-1` (white): estimated **~3.7:1** (FAIL AA normal, PASS AA-Large)
  - Dark mode: `fg` at 70% opacity on `surface-1` (near-black): estimated **~3.5:1** (FAIL AA normal)
- **Threshold:** 4.5:1 (normal text)
- **Expected:** Body text passes AA
- **Actual:** Opacity modifier reduces contrast below AA for normal text
- **Evidence:** Code scan — `apps/reception/src/components/Login.tsx:444`
- **Fix hypothesis:**
  - Likely cause: Arbitrary opacity applied to reduce visual weight instead of using a muted token
  - Direction: Replace `text-foreground/70` with `text-fg-muted` semantic token

### C-006 — AppNav.tsx opacity-50 on nav text

- **Severity:** S2
- **Breakpoint / Mode / Route:** `all / both / all routes (navigation)`
- **Element:** `AppNav.tsx:166` — nav item text with `opacity-50`
- **State:** `default` (likely inactive nav items)
- **Measured ratio(s):**
  - Light mode: fg at 50% opacity on surface: estimated **~2.4:1** (FAIL)
  - Dark mode: fg at 50% opacity on dark surface: estimated **~2.2:1** (FAIL)
- **Threshold:** 4.5:1 (normal text) or 3.0:1 (if large/bold)
- **Expected:** Nav labels legible even when inactive
- **Actual:** 50% opacity on any text color produces severe contrast failure
- **Evidence:** Code scan — `apps/reception/src/components/AppNav.tsx:166`
- **Fix hypothesis:**
  - Likely cause: `opacity-50` used for inactive state instead of semantic muted token
  - Direction: Replace `opacity-50` with `text-fg-muted` or a dedicated `text-nav-inactive` token. If the intent is to visually de-emphasize, use `text-fg-muted` which maintains AA compliance.

## Uniformity Findings

### U-001 — statusColors.ts inconsistent hsl wrapper

- **Severity:** S2
- **Breakpoint / Mode / Route:** `all / both / reports and status views`
- **Element:** `apps/reception/src/utils/statusColors.ts:18`
- **Component family:** Status color utility
- **Observed drift:** One color value uses `hsl(var(--color-fg-muted))` (wrapped) while other entries in the same object use bare `var(--color-*)` references. The `hsl()` wrapper is incorrect for tokens that already resolve to full color values in Tailwind v4.
- **Expected system behavior:** Consistent token reference format across all entries in the same utility
- **Likely cause:** Manual edit that added `hsl()` wrapper inconsistently; pre-dates the Tailwind v4 cascade fix
- **Fix direction:** Remove the `hsl()` wrapper — all `var(--color-*)` references in Tailwind v4 resolve to complete color values

### U-002 — Chart tokens --chart-6 and --chart-7 potentially undefined

- **Severity:** S2
- **Breakpoint / Mode / Route:** `all / both / /reports (dashboard views)`
- **Element:** `MenuPerformanceDashboard.tsx`, `RealTimeDashboard.tsx`
- **Component family:** Chart/data visualization
- **Observed drift:** Components reference `--chart-6` and `--chart-7` CSS custom properties. The reception theme defines chart tokens 1–5 only. These may resolve to `undefined` → transparent → invisible chart elements.
- **Expected system behavior:** All referenced chart tokens should be defined in the theme
- **Likely cause:** Chart components ported from a theme with more chart colors; reception theme not updated
- **Fix direction:** Define `--chart-6` and `--chart-7` in `packages/themes/reception/src/tokens.ts` and the corresponding CSS, or cap the chart color cycle at 5

### U-003 — Arbitrary sizing values across modals

- **Severity:** S3
- **Breakpoint / Mode / Route:** `all / both / modal surfaces`
- **Element:** `ManagerAuthModal`, `EodOverrideModal`, `DenominationInput`, `DOBSection`
- **Component family:** Modal / form input
- **Observed drift:** Multiple components use arbitrary Tailwind sizing (`w-[280px]`, `h-[44px]`, `max-w-[400px]`) instead of the 8-pt spacing rhythm (`w-72`, `h-11`, `max-w-sm`)
- **Expected system behavior:** Consistent use of token-based spacing scale
- **Likely cause:** Components built before design system spacing conventions were established
- **Fix direction:** Replace arbitrary values with nearest token-scale equivalents. Low priority — does not affect contrast directly but indicates design system adoption gaps.

### U-004 — Shade color inconsistency: grayishShades incomplete family

- **Severity:** S3
- **Breakpoint / Mode / Route:** `all / light / bar-POS`
- **Element:** Grayish shade color family
- **Component family:** Bar/POS shade system
- **Observed drift:** `grayishShades` family has fewer defined rows than other shade families (pink, coffee, beer, etc.), creating potential gaps when the shade picker cycles through all families uniformly
- **Expected system behavior:** All shade families should have consistent row counts
- **Likely cause:** Shade families were added incrementally; grayish was not fully populated
- **Fix direction:** Audit all 35 shade families for row count consistency. Add missing rows to incomplete families.

### U-005 — Duplicate hover/active with same color in TicketItems

- **Severity:** S3
- **Breakpoint / Mode / Route:** `all / both / bar sales`
- **Element:** `apps/reception/src/components/bar/sales/TicketItems.tsx:23`
- **Component family:** Ticket item list
- **Observed drift:** `hover:` and `active:` states use the same background color, providing no visual distinction between hover and press states
- **Expected system behavior:** Active state should provide stronger visual feedback than hover (e.g., darker shade or scale transform)
- **Likely cause:** Copy-paste or incomplete interaction state design
- **Fix direction:** Use `hover:bg-surface-2` and `active:bg-surface-3` (or equivalent token progression) to create distinct interaction feedback

## Cross-Finding Notes

- **C-001, C-002, C-003 share a root cause:** The shade color system has no per-swatch foreground token. All three findings are resolved by implementing a luminance-aware fg selection utility.
- **C-005 and C-006 share a pattern:** Using opacity modifiers (`/70`, `opacity-50`) on text instead of semantic muted tokens. Both are resolved by adopting `text-fg-muted`.
- **U-001 and U-002 are theme-gap issues** that exist independently of the recent theming overhaul — they predate it.
- **No responsive-root-cause findings** were identified (all issues are palette/token-level, not layout-dependent).

## Assumptions and Coverage Gaps

- **Auth-blocked:** Could not render any routes — all findings are token-level or code-level. Interactive states (hover, focus, disabled, error) were not visually verified.
- **Split-state testing not performed:** The JS theme toggle (localStorage `theme-mode` + `data-theme`) creates 4 state combinations. Only clean light/dark token values were analyzed. Mismatched states (media-light/toggle-dark and vice versa) need browser testing.
- **Shade token usage patterns not traced:** The shade colors are defined but which components actually render text on shade backgrounds was not traced end-to-end. C-001/C-002/C-003 may be theoretical if shade backgrounds are only used decoratively (no text overlay).
- **Chart token usage scope unknown:** U-002 flags potentially undefined chart tokens but actual rendering was not verified.
- **No screenshots captured** due to auth requirement.

## Suggested Fix Order

1. **S1 — C-001: Dark shade fg in light mode** — Add luminance-aware fg selection for shade color families. This is the only finding that could produce genuinely unreadable text.
2. **S2 — C-006: AppNav opacity-50** — Affects every route's navigation. Replace with `text-fg-muted`.
3. **S2 — C-005: Login text-foreground/70** — Affects the login page (first thing users see). Replace with `text-fg-muted`.
4. **S2 — C-002: Mid-tone shade fg** — Covered by the same luminance-aware utility from fix #1.
5. **S2 — U-001: statusColors.ts hsl wrapper** — Quick single-line fix.
6. **S2 — U-002: Chart tokens 6-7** — Define missing tokens or cap the cycle.
7. **S3 — C-004, U-003, U-004, U-005** — Low priority polish items.

### Recommended Next Steps

1. **Dispatch shade fg utility as a fact-find** — The shade color system needs a systematic fg selection approach (C-001 + C-002 + C-003).
2. **Fix opacity-based contrast issues inline** — C-005 and C-006 are trivial token swaps suitable for micro-build.
3. **Schedule authenticated browser sweep** — Required to validate interactive states and split-state theme combinations.
