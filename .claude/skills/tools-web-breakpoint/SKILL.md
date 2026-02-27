---
name: tools-ui-breakpoint-sweep
description: Open the app at user-specified viewport widths and systematically detect responsive layout failures (overflow/bleed, clipping, misalignment, broken reflow). Produces a screenshot-backed issue log with repro steps and fix hypotheses.
operating_mode: AUDIT
trigger_conditions: responsive layout, breakpoint QA, overflow, reflow failures, mobile layout, viewport testing, horizontal scroll
related_skills: tools-ui-contrast-sweep, lp-design-qa, lp-launch-qa, lp-do-build
---

# UI Breakpoint Sweep

Run a deterministic responsive QA sweep across explicit viewport widths and routes. Detect containment, reflow, and overlay failures with screenshot-backed evidence.

This is a QA/diagnostic skill, not a redesign exercise.

## Relationship to Other Skills

- `lp-design-qa`: static code audit of responsive intent and token usage; no browser rendering or screenshot evidence.
- `tools-ui-breakpoint-sweep`: live rendered behavior across explicit breakpoints with screenshot-backed defects.
- `meta-user-test`: broad crawl/site-health audit; use it when you need full-site coverage beyond selected routes.
- `lp-launch-qa`: pre-launch gate; consume this sweep as responsive evidence for conversion/performance readiness.
- `lp-do-build`: execute fixes after this sweep report is approved.

## Required First Question

If widths are not already provided, ask exactly:

`Which breakpoint widths (in px) should I test?`
`Example: 320, 375, 430, 768, 1024, 1280`

Do not start the sweep until widths are confirmed.

## Inputs

| Input | Required | Notes |
|------|----------|-------|
| Breakpoints (px) | Yes | Comma-separated widths, e.g. `320,375,430,768,1024,1280` |
| App entry URL | Yes | Local or deployed URL |
| Routes/screens to cover | No (recommended) | If absent, discover primary navigation routes plus at least one dense page |
| Auth scope or test account | No | If login is required and no credentials exist, run no-auth scope and document the gap |
| Theme/mode/locale | No | e.g. light/dark, locale, long-text stress mode |

If the operator only provides widths, proceed with sensible defaults for optional inputs and explicitly document assumptions.

## Defaults (only when operator does not specify)

- Breakpoints: `320, 375, 390, 414, 480, 600, 768, 820, 1024, 1280, 1440`
- Viewport height: `900`
- Routes:
  1. app entry route
  2. primary same-origin navigation targets discovered from visible navigation links
  3. at least one dense route (forms/tables/modals/drawers/filters)
- Theme/locale: app default

If app URL is missing, ask: `What URL should I sweep?`

## Operating Mode

**AUDIT + REPORT (read-only against product code)**

**Allowed:**
- Open app in browser automation and set viewport widths
- Navigate routes and interact with menu/modal/drawer/accordion/dropdown states
- Capture full-page and focused screenshots
- Write report artifact and screenshot files

**Not allowed:**
- Code or CSS changes unless explicitly requested after reporting
- Subjective redesign commentary without reproducible defects
- Marking issues without evidence

## Output Contract

Write one report artifact plus linked screenshots:

- Report: `docs/audits/breakpoint-sweeps/YYYY-MM-DD-<slug>/breakpoint-sweep-report.md`
- Screenshots: `docs/audits/breakpoint-sweeps/YYYY-MM-DD-<slug>/screenshots/`

Use `.claude/skills/tools-web-breakpoint/modules/report-template.md` for required report structure.

Every issue must include: breakpoint, route, repro steps, expected vs actual, severity, and screenshot link(s).

## Workflow

### 1) Intake and Sweep Plan

1. Confirm breakpoint list and URL.
2. Resolve route list:
   - Use operator-provided routes when available.
   - Otherwise discover primary navigation routes and add at least one dense route.
3. Record assumptions (auth, theme, locale, unavailable routes).
4. Prepare artifact directory and screenshot naming convention.

### 2) Execute Breakpoint Matrix

For each width `W`:
1. Set viewport to `W x 900`.
2. For each target route:
   - Navigate and wait for ready state (`network idle` or app-ready selector).
   - Capture baseline full-page screenshot.
   - Run overflow/reflow checks.
   - Trigger interactive states where available:
     - mobile nav/hamburger
     - one modal/drawer/popover
     - one accordion/dropdown
     - key forms/tables/cards
   - Capture focused screenshot(s) for any detected issue.

### 3) Failure Taxonomy

Assess each route+width against:

- **A. Viewport overflow (page-level)**
  - Unexpected horizontal scroll
  - Visible elements extending beyond viewport bounds
- **B. Parent/container overflow (component-level)**
  - Child bleed beyond parent bounds
  - Unintentional clipping from `overflow: hidden|clip`
  - Text truncation that destroys meaning
- **C. Reflow correctness**
  - Columns failing to stack
  - Fixed widths blocking responsive behavior
  - Wrapping that makes controls unusable
  - Misalignment/overlap jitter
- **D. Fixed layers/overlays**
  - Sticky header/footer obscures content
  - Modal/drawer exceeds viewport with no usable internal scroll
  - Off-screen drawer or unreachable close controls
- **E. Density/long-content stress**
  - Long titles/translations/numbers/tags pushing controls off-screen or collapsing hierarchy

### 4) Detection Heuristics (practical pass/fail rules)

Flag an issue if any condition is true:

- `documentElement.scrollWidth > documentElement.clientWidth + 2` (unexpected horizontal scroll)
- Visible element has `rect.right > viewportWidth + 4` or `rect.left < -4`
- Parent with `overflow: hidden|clip` partially hides meaningful child content without intentional truncation behavior
- Critical controls (primary CTA, submit, nav close, modal close) are clipped/off-screen or require horizontal scrolling
- Sticky/fixed layers overlap first actionable content and prevent normal interaction
- Modal/drawer cannot be fully navigated or closed on the current viewport

Noise-control rules (do not over-report):

- Ignore <=2px overflow caused by rounding/subpixel rendering.
- Do not flag intentional horizontal containers (`overflow-x-auto`) when content remains reachable and semantics stay clear.
- Ignore hidden/off-canvas elements not intended to be visible and not intercepting interaction.

### 5) Severity Model

- **S1 Blocker**: core action impossible (submit, checkout, navigation, close modal)
- **S2 Major**: primary content/control impaired or misleading; workaround exists but UX is materially degraded
- **S3 Minor**: cosmetic/alignment issue with preserved usability

### 6) Report and Evidence

For each issue, include:

- Breakpoint width
- Route/screen
- Component or section (best effort)
- Repro steps
- Expected vs actual
- Severity (`S1|S2|S3`)
- Screenshot links (full-page + focused when needed)
- Fix hypothesis (likely CSS cause + quick direction)

Typical fix directions to mention when applicable:

- missing `min-w-0` on flex/grid children
- incorrect `overflow` containment on component shells
- hard-coded widths replacing responsive constraints (`w-full`, `max-w-*`)
- missing wrap rules (`flex-wrap`, text wrap/word-break)
- overlay sizing/scroll fixes (`max-h-[dvh]`, internal scroll region)
- use shared design-system containment helpers where relevant (`overflowContainmentClass(...)` in `packages/design-system/src/utils/style/overflowContainment.ts`)

### 7) Completion Message

Return:

- breakpoints tested
- routes tested
- issue totals by severity
- path to `breakpoint-sweep-report.md`
- explicit assumptions and uncovered scope gaps

If no issues are found, explicitly state:

`No responsive layout failures detected across tested breakpoint/route matrix.`
- If issues were found and fixed via `/lp-do-build`: **re-run this sweep** to confirm findings are resolved before routing to `tools-refactor`.

## Integration

- **Upstream:** `lp-design-qa` (optional trigger — breakpoint-sweep is invoked after lp-design-qa flags responsive or layout concerns); `lp-do-build` (direct invocation for pre-launch QA pass).
- **Downstream:** `tools-refactor` (layout and overflow findings feed the refactor entry criteria); `lp-do-build` (issues returned as structured findings for fix tasks).
- **Loop position:** S9C (Parallel Sweep) — runs alongside `tools-ui-contrast-sweep` after UI build and static QA, before refactor.
- **Note:** `lp-responsive-qa` (under construction, see `docs/plans/lp-responsive-qa-skill/`) is a complementary rendered-screenshot skill for browser-based responsive validation. It will sit between `lp-do-build` and `lp-design-qa` once shipped. `tools-ui-breakpoint-sweep` remains the static layout audit tool.
