---
Type: Contrast-Uniformity-Report
Status: Complete
Audit-Date: 2026-03-02
Target-URL: http://localhost:3020
Standard: WCAG-2.x-AA
Breakpoints-Tested: 320, 375, 430, 768, 1024, 1280
Modes-Tested: light
Routes-Tested: 2
Issues-Total: 24
S1-Blockers: 12
S2-Major: 12
S3-Minor: 0
---

# Contrast + Uniformity Report — xa-uploader

## Scope

- **Target URL:** `http://localhost:3020`
- **Breakpoints tested:** `320, 375, 430, 768, 1024, 1280`
- **Modes tested:** `light`
- **Routes/surfaces tested:** `/login` and `/` (unauthenticated state), including form fields and primary CTA on the login surface
- **Assumptions:**
  - Operator requested “all”; no explicit breakpoint/mode matrix supplied, so default matrix from skill was used.
  - No authenticated session/token was provided, so post-login catalog console surfaces were not reachable.
  - `/` resolves to the same unauthenticated login experience during this sweep.

## Severity Summary

| Breakpoint | Mode | S1 | S2 | S3 |
|---|---|---:|---:|---:|
| 320 | light | 2 | 2 | 0 |
| 375 | light | 2 | 2 | 0 |
| 430 | light | 2 | 2 | 0 |
| 768 | light | 2 | 2 | 0 |
| 1024 | light | 2 | 2 | 0 |
| 1280 | light | 2 | 2 | 0 |

## Contrast Findings

### C-001 — Primary login CTA text/background contrast failure
- **Severity:** S2
- **Breakpoint / Mode / Route:** `all tested breakpoints / light / /login and /`
- **Element:** `button.inline-flex.items-center` ("Enter console")
- **State:** `default`
- **Measured ratio(s):** worst-case `1.00:1`
- **Threshold:** `4.5:1`
- **Expected:** Button label text must remain readable against CTA background under WCAG AA normal-text threshold.
- **Actual:** CTA foreground and background compute to the same color (`rgb(26, 26, 26)`), producing unreadable text.
- **Evidence:**
  - [320 login](./screenshots/320-light-login.png)
  - [768 login](./screenshots/768-light-login.png)
  - [1280 login](./screenshots/1280-light-login.png)
- **Fix hypothesis:**
  - Likely cause: token mapping mismatch in CTA classes (`bg-gate-ink` combined with `text-primary-fg` resolving to same value).
  - Direction: use a guaranteed contrast foreground token for dark CTA fill (for example `text-primary-foreground` or a dedicated on-dark CTA token), then enforce this via shared button variant.

### C-002 — Primary login CTA focus indicator not visually distinguishable
- **Severity:** S1
- **Breakpoint / Mode / Route:** `all tested breakpoints / light / /login and /`
- **Element:** `button.inline-flex.items-center` ("Enter console")
- **State:** `focus`
- **Measured ratio(s):** worst-case `1.00:1`
- **Threshold:** `3.0:1`
- **Expected:** Keyboard focus indicator must be visually discernible against adjacent colors.
- **Actual:** Focus-visible indicator color collapses into adjacent CTA/background color.
- **Evidence:**
  - [375 login](./screenshots/375-light-login.png)
  - [1024 login](./screenshots/1024-light-login.png)
- **Fix hypothesis:**
  - Likely cause: focus style inherits/uses same dark token as CTA background.
  - Direction: apply a dedicated high-contrast focus ring token and explicit `focus-visible` ring utility for this button variant.

## Uniformity Findings

No visual-uniformity drift was detected in the unauthenticated surfaces tested. (`uniformity-findings.json` is empty.)

## Cross-Finding Notes

- Failures are systemic (same component variant) rather than breakpoint-specific responsive issues.
- Root cause appears token/variant mapping, not layout stacking.

## Assumptions and Coverage Gaps

- Authenticated catalog surfaces, sync panel states, submission/upload states, and error-state flows were not covered due missing authenticated session context.
- Dark mode and alternate brand themes were not available/configured for this app session.

## Suggested Fix Order

1. Fix CTA text/background contrast (readability blocker for primary login action).
2. Fix focus-visible treatment on CTA to restore keyboard accessibility.
3. Re-run contrast sweep on unauthenticated + authenticated surfaces after token/variant patch.
