---
Type: Contrast-Uniformity-Report
Status: Complete
Audit-Date: 2026-02-26
Target-URL: http://localhost:3020
Standard: WCAG-2.x-AA
Breakpoints-Tested: token-analysis (dark mode, desktop)
Modes-Tested: dark
Routes-Tested: 1
Issues-Total: 2
S1-Blockers: 1
S2-Major: 1
S3-Minor: 0
---

# Contrast + Uniformity Report — reception-login

## Scope

- **Target URL:** `http://localhost:3020` (login screen)
- **Breakpoints tested:** Token analysis (dark mode). Viewport-based screenshot sweep not performed — see Coverage Gaps.
- **Modes tested:** Dark (reception app is dark-first; light mode is not implemented)
- **Routes/surfaces tested:** `/` — login form (the `Login.tsx` component), including: logo, title, subtitle, email/password inputs, sign-in button, forgot-password link
- **Assumptions:**
  - Reception app theme is `packages/themes/reception/` — dark mode token values read from `tokens.ts` and `packages/themes/base/src/tokens.ts`
  - `--color-error-main` resolves via `globals.css` `@theme` block: `hsl(var(--color-danger))` = `hsl(0 63% 31%)` in dark mode
  - `--border-2` resolves via base tokens: `var(--color-fg) / 0.22` = 22% opacity of `hsl(150 10% 92%)` blended onto card background
  - Card background = `--surface-2` = `hsl(160 8% 8%)` (the card wrapping the login form)
  - Token-computed contrast ratios use WCAG relative luminance formula; no live browser rendering verified for these two failures

---

## Severity Summary

| Breakpoint | Mode | S1 | S2 | S3 |
|---|---|---:|---:|---:|
| token-analysis | dark | 1 | 1 | 0 |

---

## Contrast Findings

### C-001 — Error text invisible on dark card background

- **Severity:** S1 (Blocker)
- **Breakpoint / Mode / Route:** `token-analysis / dark / /`
- **Element:** Error message text — `className="text-error-main"` rendered below input fields on invalid submission
- **State:** `error` (form validation triggered)
- **Measured ratio(s):** worst-case `2.0:1`
- **Threshold:** `4.5:1` (normal text, WCAG AA)
- **Expected:** Error text legible against card background at ≥4.5:1
- **Actual:** `hsl(0 63% 31%)` (dark red, `--color-danger` dark mode value) on `hsl(160 8% 8%)` card background = **2.0:1** — less than half the required ratio
- **Evidence:** No screenshot captured (token-analysis pass); see Coverage Gaps. Reproducible by submitting an invalid form and inspecting the rendered error text colour.
- **Fix hypothesis:**
  - Likely cause: `--color-danger` dark value was chosen for warning indicators on light backgrounds. On the dark card surface, the dark red `hsl(0 63% 31%)` has luminance ≈ 0.056, nearly the same as the near-black card (luminance ≈ 0.007). Token is not dark-mode-safe for body text.
  - Direction: Add a `--color-error-fg` dark token tuned for dark surfaces. A value of approximately `hsl(0 80% 72%)` (luminance ≈ 0.26) yields ≈4.8:1 on the dark card — above the 4.5:1 floor. Replace `text-error-main` in `Login.tsx` with the new token, or swap to `text-error-light` if that token is set appropriately. **This is a blocker** — login errors are inaccessible to users with low vision.

---

### C-002 — Input field border invisible against dark card background

- **Severity:** S2 (Major)
- **Breakpoint / Mode / Route:** `token-analysis / dark / /`
- **Element:** Email and password input borders — `className="... border border-border-2 ..."` on the `<Input>` components
- **State:** `default` (unfocused)
- **Measured ratio(s):** worst-case `1.8:1`
- **Threshold:** `3.0:1` (non-text essential UI — input control boundary, WCAG AA 1.4.11)
- **Expected:** Input field boundary visually distinct at ≥3.0:1 so users can locate and activate the control
- **Actual:** `--border-2` = `var(--color-fg) / 0.22` = `hsl(150 10% 92%)` at 22% opacity blended onto `hsl(160 8% 8%)` card = blended RGB ≈ `hsl(153 7% 24%)`, luminance ≈ 0.045 → contrast **1.8:1** against card background
- **Evidence:** No screenshot captured (token-analysis pass); see Coverage Gaps. Reproducible by inspecting the rendered input border colour in browser DevTools.
- **Fix hypothesis:**
  - Likely cause: `border-border-2` (22% opacity foreground) is designed for subtle dividers and decorative separators. It is too low-contrast for the functional boundary of a form input control on a dark card.
  - Direction: In `Login.tsx`, replace `border-border-2` on the input `className` with a higher-opacity token. Using `border-foreground/40` (≈40% opacity fg) achieves ≈3.4:1 and passes. Alternatively, introduce a dedicated `--color-input-border` token in the reception theme at a fixed value ≥ `hsl(150 10% 40%)` for dark mode (luminance ≈ 0.12, ratio ≈3.5:1). Do not use `border-border-2` for interactive control boundaries in the dark theme.

---

## Uniformity Findings

None. The login screen uses a single, consistent visual treatment across all interactive elements. No component drift detected.

---

## Passing Elements (dark mode)

All elements below pass WCAG AA with wide margin.

| Element | Token / Value | Contrast | Threshold | Result |
|---|---|---:|---:|---:|
| Logo letter "B" | `text-primary-fg` on `bg-primary-main` | ~9.7:1 | 4.5:1 | ✓ |
| "Brikette Operating System" title | `text-foreground` on card | ~16.7:1 | 4.5:1 | ✓ |
| Subtitle / muted text | `text-muted-foreground` on card | ~8.1:1 | 4.5:1 | ✓ |
| Label text ("Email address", "Password") | `text-foreground` on card | ~16.7:1 | 4.5:1 | ✓ |
| Input placeholder text | `text-muted-foreground` on input bg | ~8.1:1 | 4.5:1 | ✓ |
| "Sign in" button label | `text-primary-fg` on `bg-primary-main` | ~9.7:1 | 4.5:1 | ✓ |
| "Forgot your password?" link | `text-primary-main` on card | ~9.7:1 | 4.5:1 | ✓ |
| Focus ring (green border) | `ring-primary-main` on card | ~9.7:1 | 3.0:1 | ✓ |

---

## Cross-Finding Notes

- C-001 and C-002 both have the same root pattern: tokens chosen for light or mixed surfaces are applied unchanged in a fully dark context where they fail. This is a dark-mode token coverage gap in the reception theme, not a one-off override error.
- No responsive root cause: these failures are present at all viewport widths because they are determined solely by colour token values.

---

## Assumptions and Coverage Gaps

- **No live browser screenshots captured.** Contrast ratios were computed from design token source files (`packages/themes/reception/src/tokens.ts`, `packages/themes/base/src/tokens.ts`, `apps/reception/src/app/globals.css`). Calculated values are accurate given token definitions; browser rendering (anti-aliasing, subpixel rendering) may produce minor variation.
- **Light mode not tested.** The reception app does not implement a light mode; no light mode findings applicable.
- **Single breakpoint.** The login layout is a centred single-column card; contrast ratios are viewport-independent. No responsive stacking issues identified.
- **Interaction states.** Focus state for inputs was verified via token analysis (focus ring passes). Hover/active/disabled states on the "Forgot password" link and "Sign in" button were not live-tested.
- **Error state screenshot.** The error state (C-001) requires a live form submission to trigger; not captured in this sweep.

---

## Suggested Fix Order

1. **C-001 (S1)** — Fix error text contrast first. Error messages are safety-critical feedback for users who cannot complete the sign-in flow. Replace `text-error-main` with a dark-mode-safe error text token or override.
2. **C-002 (S2)** — Fix input border visibility. Users who rely on high contrast or magnification need to locate input fields. Replace `border-border-2` on inputs with `border-foreground/40` or a dedicated input border token.
3. After fixing, re-run the sweep with live browser screenshots to verify rendered output matches token calculations.
