# Contrast + Uniformity Report Template

Write report to:

`docs/audits/contrast-sweeps/YYYY-MM-DD-<slug>/contrast-uniformity-report.md`

## Required Structure

```markdown
---
Type: Contrast-Uniformity-Report
Status: Complete
Audit-Date: YYYY-MM-DD
Target-URL: <https://...>
Standard: <WCAG-2.x-AA | WCAG-2.x-AAA>
Breakpoints-Tested: <comma-separated px values>
Modes-Tested: <light,dark,brand-x>
Routes-Tested: <count>
Issues-Total: <count>
S1-Blockers: <count>
S2-Major: <count>
S3-Minor: <count>
---

# Contrast + Uniformity Report — <slug>

## Scope

- **Target URL:** <URL>
- **Breakpoints tested:** <list>
- **Modes tested:** <list>
- **Routes/surfaces tested:** <list>
- **Assumptions:** <auth/theme/token assumptions>

## Severity Summary

| Breakpoint | Mode | S1 | S2 | S3 |
|---|---|---:|---:|---:|
| 375 | light | 0 | 2 | 1 |

## Contrast Findings

### C-001 — <title>
- **Severity:** S1 | S2 | S3
- **Breakpoint / Mode / Route:** `<w> / <mode> / <route>`
- **Element:** `<label or selector>`
- **State:** `default | hover | focus | disabled | error | active`
- **Measured ratio(s):** worst-case `<x:1>`; average `<y:1>` (if sampled)
- **Threshold:** `<4.5:1 | 3.0:1 | 7.0:1 | 4.5:1 AAA-large>`
- **Expected:** <what should happen>
- **Actual:** <what happened>
- **Evidence:** `[screenshot](./screenshots/<file>.png)`
- **Fix hypothesis:**
  - Likely cause: <token mismatch / overlay stacking / opacity choice>
  - Direction: <token swap / overlay adjustment / state variant rule>

## Uniformity Findings

### U-001 — <title>
- **Severity:** S1 | S2 | S3
- **Breakpoint / Mode / Route:** `<w> / <mode> / <route>`
- **Component family:** `<Button|Input|Card|Link|Heading...>`
- **Observed drift:** <computed style differences>
- **Expected system behavior:** <single variant/token treatment>
- **Evidence (pair):**
  - Reference: `[good](./screenshots/<file-a>.png)`
  - Drift: `[drift](./screenshots/<file-b>.png)`
- **Likely cause:** <token bypass / local override / missing variant>
- **Fix direction:** <consolidate variant / enforce token / remove one-off>

## Cross-Finding Notes

- Mark responsive-root-cause contrast failures explicitly.
- Link repeated component drift across routes to a shared root cause.

## Assumptions and Coverage Gaps

- <missing auth, unreachable states, skipped routes>

## Suggested Fix Order

1. S1 blockers first (readability and keyboard focus)
2. S2 systemic issues by shared root cause
3. S3 local polish
```

## Optional JSON Artifacts

Use stable IDs and include screenshots as relative paths.

### `contrast-findings.json`

```json
[
  {
    "id": "C-001",
    "severity": "S2",
    "breakpoint": 375,
    "mode": "light",
    "route": "/checkout",
    "state": "focus",
    "element": "button.primary",
    "contrastRatioWorst": 2.8,
    "contrastRatioAverage": 3.4,
    "threshold": 3.0,
    "wcagType": "non-text-focus-indicator",
    "screenshot": "./screenshots/375-light-checkout-focus-primary.png",
    "fixHypothesis": "Focus ring token too close to adjacent surface token"
  }
]
```

### `uniformity-findings.json`

```json
[
  {
    "id": "U-001",
    "severity": "S2",
    "breakpoint": 768,
    "mode": "dark",
    "route": "/settings",
    "componentFamily": "PrimaryButton",
    "drift": "radius and padding differ from same variant on /billing",
    "referenceScreenshot": "./screenshots/768-dark-billing-button-reference.png",
    "driftScreenshot": "./screenshots/768-dark-settings-button-drift.png",
    "likelyCause": "Local class override bypasses shared component variant",
    "fixDirection": "Consolidate to shared PrimaryButton variant and remove route-local overrides"
  }
]
```

## Quality Bar

- Every finding is screenshot-backed and reproducible.
- Contrast findings include measured ratio + threshold + state.
- Uniformity findings include explicit comparison evidence (reference vs drift).
- Severity reflects user impact rather than design preference.
