---
Type: Contrast-Uniformity-Report
Status: Complete
Audit-Date: 2026-03-02
Target-URL: http://localhost:3020
Standard: WCAG-2.x-AA
Breakpoints-Tested: 320, 375, 430, 768, 1024, 1280
Modes-Tested: light
Routes-Tested: 1
Issues-Total: 18
S1-Blockers: 12
S2-Major: 0
S3-Minor: 6
---

# Contrast + Uniformity Report — xa-uploader-authenticated

## Scope

- **Target URL:** `http://localhost:3020`
- **Breakpoints tested:** `320, 375, 430, 768, 1024, 1280`
- **Modes tested:** `light`
- **Routes/surfaces tested:** `/` authenticated catalog console
- **Assumptions:** authenticated with local dev token loaded from configured env for this session.

## Severity Summary

| Breakpoint | Mode | S1 | S2 | S3 |
|---|---|---:|---:|---:|
| 320 | light | 2 | 0 | 1 |
| 375 | light | 2 | 0 | 1 |
| 430 | light | 2 | 0 | 1 |
| 768 | light | 2 | 0 | 1 |
| 1024 | light | 2 | 0 | 1 |
| 1280 | light | 2 | 0 | 1 |

## Contrast Findings

### C-001 — Save button focus indicator below non-text threshold
- **Severity:** S1
- **Breakpoint / Mode / Route:** `all tested breakpoints / light / /`
- **Element:** `button.rounded-md.border` ("Save details")
- **State:** `focus`
- **Measured ratio(s):** worst-case `2.91:1`
- **Threshold:** `3.0:1`
- **Expected:** Focus-visible indicator should be clearly discernible for keyboard navigation.
- **Actual:** Focus treatment is slightly under AA non-text contrast target.
- **Evidence:**
  - [320 auth](./screenshots/320-light-root-auth.png)
  - [1280 auth](./screenshots/1280-light-root-auth.png)
- **Fix hypothesis:** move focus-visible ring to higher-contrast token (`ring-ring`) with adequate ring-offset.

### C-002 — Currency rates Save & sync focus indicator below threshold
- **Severity:** S1
- **Breakpoint / Mode / Route:** `all tested breakpoints / light / /`
- **Element:** `button.rounded-md.border` ("Save & sync")
- **State:** `focus`
- **Measured ratio(s):** worst-case `2.91:1`
- **Threshold:** `3.0:1`
- **Expected:** Focus-visible indicator should satisfy non-text contrast minimum.
- **Actual:** Focus indicator is slightly below threshold.
- **Evidence:**
  - [320 auth](./screenshots/320-light-root-auth.png)
  - [1280 auth](./screenshots/1280-light-root-auth.png)
- **Fix hypothesis:** same shared CTA focus variant likely reused; update once at shared class level.

### C-003 — Numeric input text near-threshold contrast
- **Severity:** S3
- **Breakpoint / Mode / Route:** `all tested breakpoints / light / /`
- **Element:** `input.mt-2.w-full` (currency numeric input values)
- **State:** `default`
- **Measured ratio(s):** worst-case `4.35:1`
- **Threshold:** `4.5:1`
- **Expected:** Normal text should remain >=4.5:1.
- **Actual:** Slightly under threshold in measured state.
- **Evidence:**
  - [320 auth](./screenshots/320-light-root-auth.png)
  - [1024 auth](./screenshots/1024-light-root-auth.png)
- **Fix hypothesis:** raise input foreground contrast by one token step (`text-gate-ink` stronger variant or reduce muted opacity).

## Uniformity Findings

No system-level uniformity drift detected in authenticated `/` surface during this pass.

## Assumptions and Coverage Gaps

- `/` authenticated surface only; modal/edge/error states not exhaustively forced.
- Theme matrix constrained to light mode for current runtime.

## Suggested Fix Order

1. Address S1 focus-visible contrast for action buttons.
2. Tweak numeric input text contrast to clear 4.5:1.
3. Re-run authenticated sweep for regression confirmation.
