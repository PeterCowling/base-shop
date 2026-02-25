# Breakpoint Sweep Report Template

Write report to:

`docs/audits/breakpoint-sweeps/YYYY-MM-DD-<slug>/breakpoint-sweep-report.md`

## Required Structure

```markdown
---
Type: Breakpoint-Sweep-Report
Status: Complete
Audit-Date: YYYY-MM-DD
Target-URL: <https://...>
Breakpoints-Tested: <comma-separated px values>
Routes-Tested: <count>
Issues-Total: <count>
S1-Blockers: <count>
S2-Major: <count>
S3-Minor: <count>
---

# Breakpoint Sweep Report — <slug>

## Scope

- **Target URL:** <URL>
- **Breakpoints tested:** <list>
- **Routes tested:** <list>
- **Auth/theme/locale assumptions:** <list>

## Summary Matrix

| Breakpoint | Route | S1 | S2 | S3 | Notes |
|---|---|---:|---:|---:|---|
| 320 | / | 0 | 1 | 0 | header CTA clipped |

## Issues

### BP-001 — <short title>
- **Severity:** S1 | S2 | S3
- **Breakpoint:** <px>
- **Route:** </path>
- **Component/Section:** <best effort>
- **Repro steps:**
  1. <step>
  2. <step>
  3. <step>
- **Expected:** <what should happen>
- **Actual:** <what happened>
- **Heuristic trigger(s):** <overflow / clipping / overlap condition>
- **Evidence:**
  - Full page: `[w<px>-<route>-full](./screenshots/<file>.png)`
  - Focused: `[w<px>-<route>-focus](./screenshots/<file>.png)`
- **Fix hypothesis:**
  - Likely CSS cause: <fixed width / min-width / overflow / positioning>
  - Quick direction: <specific remediation>

## Assumptions and Coverage Gaps

- <missing auth scope, skipped route, unavailable modal state, etc.>

## Suggested Fix Order

1. S1 blockers
2. S2 majors by shared root cause
3. S3 minors
```

## Quality Bar

- Every issue has a reproducible route + breakpoint + screenshot.
- No issue is logged without expected-vs-actual.
- Severity reflects user impact, not visual preference.
