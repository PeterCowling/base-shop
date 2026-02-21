# Domain: Performance Budget

**Goal**: Verify site meets Core Web Vitals targets and performance budget for critical user journeys.
**Required output schema**: `{ domain: "performance", status: "pass|fail|warn", checks: [{ id: "<P1>", status: "pass|fail|warn", evidence: "<string>" }] }`

## Checks

- **P1: Core Web Vitals (Lighthouse)**
  - **What:** Run Lighthouse audit (desktop + mobile) on home page and primary conversion page
  - **Pass condition:** Performance score ≥90; LCP <2.5s, FID <100ms, CLS <0.1
  - **Evidence:** Lighthouse report summary with scores + Core Web Vitals metrics
  - **Fail condition:** Performance score <90, any Core Web Vital in "Needs Improvement" or "Poor" range

- **P2: Asset size budget**
  - **What:** Inspect network tab for total page weight (home page + primary conversion page)
  - **Pass condition:** Total transfer size ≤1MB for initial page load (excluding video); largest asset ≤500KB
  - **Evidence:** Network tab screenshot showing total transfer size + largest assets
  - **Fail condition:** Page weight >1MB, single asset >500KB (excluding video)

- **P3: Critical rendering path**
  - **What:** Inspect for render-blocking resources (synchronous scripts, blocking CSS in `<head>`)
  - **Pass condition:** No render-blocking scripts in `<head>`; critical CSS inlined or preloaded; fonts use `font-display: swap`
  - **Evidence:** HTML `<head>` snippet showing async/defer on scripts + font-display usage
  - **Fail condition:** Synchronous scripts block rendering, fonts cause FOIT (Flash of Invisible Text)

- **P4: Image optimization**
  - **What:** Inspect images for modern formats (WebP, AVIF) and responsive sizing
  - **Pass condition:** Hero images use modern formats; images have `width` and `height` attributes (prevents CLS); responsive images use `srcset` or `<picture>`
  - **Evidence:** Image tag snippet showing format + attributes
  - **Fail condition:** JPEG/PNG only, missing dimensions, no responsive images

- **P5: Third-party script budget**
  - **What:** Count third-party scripts (analytics, ads, tracking pixels) and measure their impact on load time
  - **Pass condition:** ≤3 third-party scripts; total third-party script weight ≤100KB; scripts load async
  - **Evidence:** Network tab showing third-party requests + sizes
  - **Fail condition:** >3 third-party scripts, >100KB third-party weight, synchronous third-party scripts

## Domain Pass Criteria

P1–P3 must pass (blockers). P4–P5 failures are warnings (fix before scaling traffic).
