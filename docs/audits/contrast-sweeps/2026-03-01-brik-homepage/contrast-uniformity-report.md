---
Type: Contrast-Uniformity-Report
Status: Complete
Audit-Date: 2026-03-01
Target-URL: http://localhost:3012/en
Standard: WCAG-2.x-AA
Breakpoints-Tested: 320, 375, 430, 768, 1024, 1280
Modes-Tested: light, dark
Routes-Tested: 1
Issues-Total: 5
S1-Blockers: 0
S2-Major: 5
S3-Minor: 0
---

# Contrast + Uniformity Report — brik-homepage

## Scope

- **Target URL:** `http://localhost:3012/en`
- **Breakpoints tested:** `320, 375, 430, 768, 1024, 1280`
- **Modes tested:** `light, dark`
- **Routes/surfaces tested:** Homepage (`/en`) full-page sweep including header/nav, hero, booking widget, date picker (opened), focus-visible sampling via keyboard `Tab`.
- **Assumptions:** User request `all` interpreted as all major responsive widths + both light/dark for the Brik homepage using WCAG AA defaults.

## Severity Summary

| Breakpoint | Mode | S1 | S2 | S3 |
|---|---|---:|---:|---:|
| 320 | light | 0 | 0 | 0 |
| 375 | light | 0 | 0 | 0 |
| 430 | light | 0 | 0 | 0 |
| 768 | light | 0 | 0 | 0 |
| 1024 | light | 0 | 0 | 0 |
| 1280 | light | 0 | 0 | 0 |
| 320 | dark | 0 | 1 | 0 |
| 375 | dark | 0 | 1 | 0 |
| 430 | dark | 0 | 1 | 0 |
| 768 | dark | 0 | 1 | 0 |
| 1024 | dark | 0 | 1 | 0 |
| 1280 | dark | 0 | 1 | 0 |

## Contrast Findings

### C-001 — Date picker month caption fails contrast in dark mode
- **Severity:** S2
- **Breakpoint / Mode / Route:** `1024 / dark / /en`
- **Element:** `.style-module__OTm3gG__caption_label`
- **State:** `active` (date picker opened)
- **Measured ratio(s):** worst-case `1.22:1`; average `1.22:1`
- **Threshold:** `4.5:1`
- **Expected:** Month caption should be readable under dark mode.
- **Actual:** Near-white caption text renders on light gray background.
- **Evidence:** [screenshot](./screenshots/1024-dark-issue-style-module-OTm3gG-caption-label.png)
- **Fix hypothesis:**
  - Likely cause: Date picker caption token pair is mismatched for dark mode.
  - Direction: Bind caption foreground to semantic on-surface token aligned with the calendar surface token in dark mode.

### C-002 — Date picker weekday headers fail contrast in dark mode
- **Severity:** S2
- **Breakpoint / Mode / Route:** `1024 / dark / /en`
- **Element:** `th[aria-label="Monday"]` (representative; repeats all weekday headers)
- **State:** `active`
- **Measured ratio(s):** worst-case `1.16:1`; average `1.16:1`
- **Threshold:** `4.5:1`
- **Expected:** Weekday header labels should pass AA in all modes.
- **Actual:** Weekday labels are effectively unreadable.
- **Evidence:** [screenshot](./screenshots/1024-dark-issue-th-aria-label-Monday.png)
- **Fix hypothesis:**
  - Likely cause: Header row background remains light while text token follows dark-theme light-foreground values.
  - Direction: Apply coordinated dark tokens to both header background and text.

### C-003 — Date picker day cells fail contrast in dark mode
- **Severity:** S2
- **Breakpoint / Mode / Route:** `1024 / dark / /en`
- **Element:** `button[aria-label="Tuesday, March 10th, 2026"]` (representative; repeats across day cells)
- **State:** `active`
- **Measured ratio(s):** worst-case `1.22:1`; average `1.22:1`
- **Threshold:** `4.5:1`
- **Expected:** Day numbers must remain legible for booking selection.
- **Actual:** Day numbers render near-white on light gray cells.
- **Evidence:** [screenshot](./screenshots/1024-dark-issue-button-aria-label-Tuesday-March-10th-2026.png)
- **Fix hypothesis:**
  - Likely cause: Day-cell foreground/background pair is not using dark-variant semantic tokens.
  - Direction: Normalize date-cell foreground/background via shared date picker theme variables.

### C-004 — Booking guests label fails contrast in dark mode
- **Severity:** S2
- **Breakpoint / Mode / Route:** `1024 / dark / /en`
- **Element:** `label[for="booking-guests"]`
- **State:** `default`
- **Measured ratio(s):** worst-case `1.30:1`; average `1.30:1`
- **Threshold:** `4.5:1`
- **Expected:** Form labels should pass AA and remain readable near the booking CTA.
- **Actual:** Label appears near-white over light gray.
- **Evidence:** [screenshot](./screenshots/1024-dark-issue-label-for-booking-guests.png)
- **Fix hypothesis:**
  - Likely cause: Booking widget panel background and text tokens come from mixed token families in dark mode.
  - Direction: Enforce one semantic surface/foreground pair for the widget in dark mode.

## Uniformity Findings

### U-001 — BookingWidget/DateRangePicker dark-mode token drift
- **Severity:** S2
- **Breakpoint / Mode / Route:** `1024 / dark / /en`
- **Component family:** `BookingWidget / DateRangePicker`
- **Observed drift:** Dark mode uses light-gray surfaces while retaining light foreground text; surrounding page sections use coherent dark surfaces.
- **Expected system behavior:** Dark mode should keep consistent semantic surface/foreground token pairings across equivalent booking/form surfaces.
- **Evidence (pair):**
  - Reference: [good](./screenshots/1024-light-home-booking-state.png)
  - Drift: [drift](./screenshots/1024-dark-home-booking-state.png)
- **Likely cause:** Local component/module styles bypass unified semantic tokens for one side of the pair (surface vs text).
- **Fix direction:** Consolidate booking/date-picker styling through shared semantic tokens and dark variants; remove mixed hardcoded/fixed palette paths in the component scope.

## Cross-Finding Notes

- All measured failures were dark-mode only and reproduced at every tested breakpoint.
- The root issue is systemic to booking/date-picker theming, not responsive layout.

## Assumptions and Coverage Gaps

- In-scope route was homepage only (`/en`) per request.
- Modal/drawer states outside homepage booking interactions were not force-opened.
- Brand-theme variants beyond light/dark were not detected as runtime toggles on this route.

## Suggested Fix Order

1. Fix C-002 and C-003 first (date-picker headers/cells: booking-critical legibility).
2. Fix C-001 and C-004 (caption + form-label contrast).
3. Resolve U-001 by consolidating token usage for BookingWidget/DateRangePicker dark mode.
