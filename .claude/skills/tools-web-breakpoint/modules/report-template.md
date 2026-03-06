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

## QA Inventory

Built from three sources before sweep began:

**User requirements:**
- <requirement 1>

**Features / controls tested:**
- <control or interactive behaviour 1>

**Claims to sign off:**
- <user-visible claim 1>

**Exploratory scenarios (≥2 required):**
- Scenario A: <off-happy-path interaction>
- Scenario B: <off-happy-path interaction>

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

## Functional QA Pass

- Controls exercised via real input (keyboard / mouse / touch):
  - <control> — <full cycle tested: yes/no>
- End-to-end critical flow verified: <flow name> — <pass/fail>
- Reversible controls cycled to initial state: <yes/no>

## Visual QA Pass

- Regions inspected in settled state: <nav, hero/content area, CTA, footer, modals>
- In-transition states inspected: <drawer open, modal appear, etc. or none>
- Aesthetic judgement: <intentional and coherent / concerns noted>

## Negative Confirmation

Defect classes checked and not found at this breakpoint/route:

- [ ] A. Viewport overflow (unexpected horizontal scroll)
- [ ] B. Container overflow (component-level clipping or bleed)
- [ ] C. Reflow correctness (stacking, wrapping, alignment)
- [ ] D. Fixed layers / overlays (sticky header, modal/drawer reach)
- [ ] E. Density / long-content stress (long text, dense tables, tags)

Any class with issues found is documented under `## Issues` above.

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
