---
Type: Contrast-Uniformity-Report
Status: Complete
Audit-Date: 2026-03-04
Target-URL: http://localhost:3013/products/hermes-birkin-25-noir-togo
Standard: WCAG-2.x-AA
Breakpoints-Tested: 320, 375, 430, 768, 1024, 1280
Modes-Tested: light, dark
Routes-Tested: 1
Issues-Total: 7
S1-Blockers: 0
S2-Major: 4
S3-Minor: 3
---

# Contrast + Uniformity Report — xa-b-pdp

## Scope

- **Target URL:** `http://localhost:3013/products/hermes-birkin-25-noir-togo`
- **Breakpoints tested:** 320, 375, 430, 768, 1024, 1280
- **Modes tested:** light, dark
- **Routes/surfaces tested:** PDP (product detail page) — image gallery, buy box, breadcrumbs, product description, bag details, share/contact section, related products, header/nav, footer
- **Assumptions:** No authentication required. Theme tokens from `xa-cyber-atelier.css`. All text/backgrounds are achromatic (HSL 0 0% X%). Token contrast computed from CSS custom property values, confirmed with runtime evaluation.

## Token-Level Contrast Reference

All xa-b colors are achromatic (pure grayscale). Key computed ratios:

| Pair | Light | Dark | Threshold | Verdict |
|------|------:|-----:|----------:|---------|
| fg on bg | 18.42:1 | 16.08:1 | 4.5:1 | PASS |
| fg-muted on bg | 4.74:1 | 6.73:1 | 4.5:1 | PASS |
| fg-muted on surface-2 | 4.54:1 | 6.11:1 | 4.5:1 | PASS |
| fg-muted on surface-3 | 4.24:1 | 5.45:1 | 4.5:1 | FAIL light |
| fg-muted on muted | 4.35:1 | 5.79:1 | 4.5:1 | FAIL light |
| muted-fg on muted | 11.59:1 | 10.79:1 | 4.5:1 | PASS |
| primary-fg on primary (btn) | 19.17:1 | 16.90:1 | 4.5:1 | PASS |
| border on bg | 1.32:1 | 1.76:1 | 3.0:1 | FAIL both |
| border-muted on bg | 1.19:1 | 1.41:1 | 3.0:1 | FAIL both |
| border-strong on bg | 1.84:1 | 3.10:1 | 3.0:1 | FAIL light |

## Severity Summary

Token-level contrast issues are viewport-independent (same tokens apply at all breakpoints). The summary below reflects that findings C-01 through C-04 apply across all 6 breakpoints and both modes unless noted.

| Category | S1 | S2 | S3 |
|----------|---:|---:|---:|
| Contrast | 0 | 4 | 1 |
| Uniformity | 0 | 0 | 2 |
| **Total** | **0** | **4** | **3** |

## Contrast Findings

### C-01 — Quantity control border below 3:1 non-text threshold

- **Severity:** S2
- **Breakpoint / Mode / Route:** `all / light+dark / /products/*`
- **Element:** `.flex.items-center.gap-0.border.border-border-2` (quantity selector wrapper) — `XaBuyBox.client.tsx:121`
- **State:** `default`
- **Measured ratio(s):** worst-case `1.32:1` (light), `1.60:1` (dark)
- **Threshold:** `3.0:1` (WCAG non-text UI component boundary)
- **Expected:** Interactive form control boundary visible at >=3:1 against adjacent background
- **Actual:** Quantity +/- control container border at `border-border-2` (12% opacity black/white) is effectively invisible to users with low vision. The three adjacent cells (−, count, +) merge visually with the surrounding white space.
- **Fix hypothesis:**
  - Likely cause: Opacity border token `--border-2: 0 0% 0% / 0.12` provides only 1.32:1 against white
  - Direction: Use `border-border-strong` (75% gray = 1.84:1, still fails) or introduce a `border-border-control` token at ~55% gray (min 3.0:1 on white). Alternatively, add a subtle background fill (`bg-surface-2`) to the quantity wrapper so the control area is distinguished by fill rather than border alone.

### C-02 — Inactive color/material swatch border below 3:1

- **Severity:** S2
- **Breakpoint / Mode / Route:** `all / light+dark / /products/*`
- **Element:** Inactive swatch buttons `border-border-2` — `XaBuyBox.client.tsx:204,236`
- **State:** `default` (inactive/unselected state)
- **Measured ratio(s):** worst-case `1.32:1` (light)
- **Threshold:** `3.0:1` (WCAG non-text UI component)
- **Expected:** Unselected swatch options visually distinguishable as interactive targets at >=3:1
- **Actual:** Inactive swatches use same `border-border-2` token. Active swatches correctly use `border-foreground` (18.42:1). The inactive-to-active affordance change relies entirely on border contrast that is below threshold.
- **Fix hypothesis:**
  - Likely cause: Same opacity border token as C-01
  - Direction: Apply `border-border-strong` or stronger to inactive swatches. Active/inactive distinction would then be `border-strong` (subtle) vs `border-foreground` (bold).

### C-03 — Gallery navigation disabled state at opacity-30

- **Severity:** S2
- **Breakpoint / Mode / Route:** `all / light+dark / /products/*`
- **Element:** Gallery prev/next `IconButton` with `disabled:opacity-30` — `XaImageGallery.client.tsx:117`
- **State:** `disabled`
- **Measured ratio(s):** Effective foreground: rgb(20,20,20) at 30% on white = ~rgb(184,184,184). Ratio vs white: ~`1.98:1`
- **Threshold:** `3.0:1` (non-text icon contrast) — Note: WCAG 1.4.11 exempts disabled controls from contrast requirements, but the button is still rendered and could confuse users who cannot perceive it.
- **Expected:** Disabled navigation control either hidden or faded to a perceptible-but-inactive state
- **Actual:** At 30% opacity, the arrow icon is nearly invisible against white. Users may not realize a navigation control exists.
- **Fix hypothesis:**
  - Likely cause: `disabled:opacity-30` is too aggressive for maintaining any visual presence
  - Direction: Increase to `disabled:opacity-50` (matching closer to quantity control's `opacity-40`) or `disabled:hidden` to remove entirely when not applicable.

### C-04 — Image gallery container border below 3:1

- **Severity:** S2
- **Breakpoint / Mode / Route:** `all / light+dark / /products/*`
- **Element:** Gallery container `border-border-1` — `XaImageGallery.client.tsx:129`
- **State:** `default`
- **Measured ratio(s):** worst-case `1.19:1` (light, 8% opacity black on white)
- **Threshold:** `3.0:1` (non-text)
- **Expected:** Image container boundary perceptible when image doesn't fill the frame
- **Actual:** The border is purely decorative when an image fills the container (image provides its own boundary). However, the fallback state (no image loaded yet / placeholder) shows only text on `bg-surface` with this invisible border as the sole container indicator.
- **Fix hypothesis:**
  - Likely cause: `--border-1` opacity token (8%) is designed to be minimal/invisible
  - Direction: Swap to `border-border-2` at minimum, or rely on the image content/placeholder background for boundary instead of the border. This is the lowest-priority of the S2 findings since the border is mostly decorative.

### C-05 — fg-muted on surface-3 fails AA for normal text

- **Severity:** S3
- **Breakpoint / Mode / Route:** `all / light / not directly on PDP`
- **Element:** Any `text-muted-foreground` on `bg-surface-3` or similar 95% gray
- **State:** `default`
- **Measured ratio(s):** `4.24:1` (light); `5.45:1` (dark, passes)
- **Threshold:** `4.5:1` (normal text)
- **Expected:** Muted text readable on all surface tiers
- **Actual:** On the PDP specifically, muted text sits on `bg` (white, 4.74:1 = pass) or `bg-surface` (white). The 4.24:1 failure occurs when `text-muted-foreground` lands on `surface-3` backgrounds, which may happen on other routes (department landing, filters drawer). On PDP, this is not directly triggered.
- **Fix hypothesis:**
  - Likely cause: `--color-fg-muted: 0 0% 45%` is at the boundary — passes on pure white but fails on any tinted/gray surface
  - Direction: Darken fg-muted to ~42% (from 45%) to gain margin. This would give ~4.6:1 on surface-3 and ~5.1:1 on bg. Minimal visual change, significant accessibility gain.

## Uniformity Findings

### U-01 — Inconsistent disabled opacity across buy box controls

- **Severity:** S3
- **Breakpoint / Mode / Route:** `all / both / /products/*`
- **Component family:** Button (disabled state)
- **Observed drift:** Gallery prev/next uses `disabled:opacity-30` (`XaImageGallery.client.tsx:117`). Quantity decrease uses `disabled:opacity-40` (`XaBuyBox.client.tsx:129`). Two different disabled visual treatments within the same product page viewport.
- **Expected system behavior:** Single consistent disabled opacity value across interactive controls
- **Likely cause:** Independent development of gallery and buy box components without a shared disabled style token
- **Fix direction:** Standardize on `disabled:opacity-50` across all xa-b controls (provides better visibility while maintaining disabled affordance) or use a shared utility class.

### U-02 — Opacity border tokens used for functional control boundaries

- **Severity:** S3
- **Breakpoint / Mode / Route:** `all / both / /products/*`
- **Component family:** Form controls (quantity selector, swatch selectors, gallery)
- **Observed drift:** `border-border-1` (8% opacity), `border-border-2` (12% opacity) used interchangeably for both decorative container borders AND functional form control boundaries. No semantic distinction between "decorative border" and "interactive control boundary".
- **Expected system behavior:** Decorative borders may be subtle; functional control boundaries should meet 3:1
- **Likely cause:** Single border token scale designed for minimal aesthetic, without separate functional-control tokens
- **Fix direction:** Introduce a `--border-control` semantic token at ~`0 0% 55%` (guarantees 3:1 on white) for interactive element boundaries. Keep `border-1/2/3` for decorative use.

## Cross-Finding Notes

- C-01, C-02, C-04 share the same root cause: opacity-based border tokens below WCAG non-text threshold. A single token-level fix (introducing a `border-control` semantic token) would resolve all three.
- C-03 and U-01 share the disabled-state root: no standardized disabled opacity in the xa-b token system.
- All findings are **token-level, not responsive-root-cause**. They apply identically across all 6 breakpoints. At narrower viewports (320-375), the impact is slightly worse because touch targets rely more heavily on visible boundaries for affordance.
- Dark mode performs better than light for muted text contrast (fg-muted on bg: 6.73:1 vs 4.74:1) but has the same border contrast issues.
- No hardcoded hex/rgb values found in `.tsx` component files (clean token usage).

## Assumptions and Coverage Gaps

- **Auth:** No authenticated states tested (login/checkout flows not in scope for PDP audit)
- **Hover states:** Not systematically tested via browser automation (token analysis confirms hover states use adequate contrast: `primary-hover` at 17.40:1, `foreground/90` at ~16:1)
- **Focus-visible:** Focus ring token defined (`--color-focus-ring: 0 0% 0%` light, `0 0% 100%` dark). Design system `Button` component applies focus-visible styles. Not browser-verified on this sweep — recommend keyboard walkthrough.
- **Search input placeholder:** Default browser placeholder styling not overridden. Typically ~4:1 in Chrome — borderline but not verified.
- **Error states:** Error border uses `border-danger/30 bg-danger/5` — not triggered during sweep. Danger token not defined in xa-cyber-atelier.css (falls back to base theme).

## Suggested Fix Order

1. **Token fix: Introduce `--border-control` semantic token** → Resolves C-01, C-02, C-04 in one change. Target: `0 0% 55%` (3.15:1 on white). Apply to quantity selector, inactive swatches, and gallery container.
2. **Standardize disabled opacity to `0.50`** → Resolves C-03 and U-01. Change gallery `disabled:opacity-30` and quantity `disabled:opacity-40` to a consistent `disabled:opacity-50`.
3. **Darken fg-muted from 45% to 42%** → Resolves C-05 preemptively. Provides safety margin on all surface tiers.
4. **Keyboard focus walkthrough** → Verify focus-visible states on all interactive PDP elements (gallery buttons, size selector, quantity controls, add to bag, wishlist, share buttons).
