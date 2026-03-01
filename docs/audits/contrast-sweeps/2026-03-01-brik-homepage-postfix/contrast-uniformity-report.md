---
Type: Contrast-Uniformity-Report
Status: Complete
Audit-Date: 2026-03-01
Target-URL: http://localhost:3012/en
Standard: WCAG-2.x-AA
Breakpoints-Tested: 320, 375, 430, 768, 1024, 1280
Modes-Tested: light, dark
Routes-Tested: 1
Issues-Total: 0
S1-Blockers: 0
S2-Major: 0
S3-Minor: 0
---

# Contrast + Uniformity Report — brik-homepage-postfix

## Scope

- **Target URL:** `http://localhost:3012/en`
- **Breakpoints tested:** `320, 375, 430, 768, 1024, 1280`
- **Modes tested:** `light, dark`
- **Routes/surfaces tested:** Homepage (`/en`) full-page sweep including header/nav, hero, booking widget, date picker (opened), and keyboard focus sampling.
- **Assumptions:** Same matrix and WCAG AA settings as the baseline sweep.

## Severity Summary

| Breakpoint | Mode | S1 | S2 | S3 |
|---|---|---:|---:|---:|
| 320 | light | 0 | 0 | 0 |
| 375 | light | 0 | 0 | 0 |
| 430 | light | 0 | 0 | 0 |
| 768 | light | 0 | 0 | 0 |
| 1024 | light | 0 | 0 | 0 |
| 1280 | light | 0 | 0 | 0 |
| 320 | dark | 0 | 0 | 0 |
| 375 | dark | 0 | 0 | 0 |
| 430 | dark | 0 | 0 | 0 |
| 768 | dark | 0 | 0 | 0 |
| 1024 | dark | 0 | 0 | 0 |
| 1280 | dark | 0 | 0 | 0 |

## Contrast Findings

No contrast failures detected.

## Uniformity Findings

No visual-uniformity failures detected.

## Assumptions and Coverage Gaps

- One transient navigation timeout occurred during the matrix sweep at `375/light`; it was re-run immediately with full screenshots and returned `0` color-contrast violations.

No contrast or visual-uniformity failures detected across the tested breakpoint/mode matrix.
