---
Type: Plan
Status: Historical
Domain: Brikette
Last-reviewed: 2026-02-10
Relates-to charter: none
Last-updated: 2026-02-10
Archived-on: 2026-02-10
Archived-reason: Merged into docs/plans/administrative-debt-plan.md
Consolidates:
  - docs/plans/archive/brikette-improvement-plan.md (Phase 3–4 deferred)
  - docs/plans/archive/brikette-htgh-content-fix-plan.md (build verification blocked)
  - docs/plans/archive/brikette-live-delivery-speed-v2-plan.md (TASK-04 user verification, TASK-07 optional chunk work)
---

# Brikette Deferred Work Plan


## Active tasks

No active tasks at this time.

## Context

This plan consolidates all deferred and blocked items from two completed brikette plans:

1. **Brikette Improvement Plan** — Phases 1–2 complete (type safety, error handling, component complexity, over-optimization, hardcoded guide logic). Phase 3 (performance) and Phase 4.2 (translation coverage) deferred.
2. **Brikette HTGH Content Fix Plan** — All code changes complete. Full build verification blocked by unrelated prerender issues.

---

## BRIK-DEF-01: Full Build Verification

**Priority:** P1
**Blocked by:** Unrelated prerender issues in the brikette app
**Origin:** brikette-htgh-content-fix-plan.md, Step 4

### Description

The how-to-get-here content loading fix (dynamic imports with `webpackInclude`) is fully implemented and tested, but `pnpm --filter @apps/brikette build` has not been verified end-to-end because the app has other prerender failures unrelated to HTGH.

### Definition of Done

- `pnpm --filter @apps/brikette build` completes without HTGH-related errors
- Prerender issues resolved or bypassed (may require separate work)

---

## BRIK-DEF-02: Bundle Analyzer Configuration

**Priority:** P3
**Effort:** Small
**Origin:** brikette-improvement-plan.md, Phase 3.2

### Description

Configure `@next/bundle-analyzer` for the brikette app to enable ongoing bundle size audits.

### Tasks

1. Add `@next/bundle-analyzer` as a dev dependency
2. Wire it into `next.config.mjs` behind an env flag (`ANALYZE=true`)
3. Document usage in the app README or a runbook

### Definition of Done

- `ANALYZE=true pnpm --filter @apps/brikette build` opens the bundle report

---

## BRIK-DEF-03: Performance Targets

**Priority:** P2
**Effort:** Medium–Large
**Origin:** brikette-improvement-plan.md, Phase 3

### Description

Push performance metrics from the current baseline to target values. Quick wins (Swiper CSS, dead dependency removal) are already done.

### Targets

| Metric | Current | Target |
|--------|---------|--------|
| Lighthouse Performance | 0.85+ | 0.90+ |
| LCP | 2.5s | 2.0s |
| Bundle size (gzip) | ~250KB | ~240KB |

### Possible Approaches

- Tree-shake or lazy-load remaining large dependencies (react-datepicker already deferred behind lazy modal)
- Reduce critical-path JS with more aggressive code splitting
- Image optimization / priority hints tuning
- Font subsetting or `font-display: optional` adjustments

### Dependencies

- BRIK-DEF-02 (bundle analyzer) for visibility into bundle composition

### Definition of Done

- Lighthouse Performance score ≥ 0.90 on homepage (mobile, 3-run median)
- LCP ≤ 2.0s on homepage (lab conditions)
- Total gzipped JS ≤ 240KB (main bundle, not including lazy chunks)

---

## BRIK-DEF-04: Translation Coverage (Ongoing)

**Priority:** P3 (Low)
**Effort:** Ongoing
**Owner:** Content Team + Engineering
**Origin:** brikette-improvement-plan.md, Phase 4.2

### Description

Reduce English fallback exposure for non-EN users by closing translation gaps in guides and page content.

### Tasks

1. **Audit missing translations**
   - Identify English-only guides
   - Quantify fallback usage per locale

2. **Track fallback usage in telemetry**
   - Requires telemetry infrastructure (not yet in place)
   - Emit events when `fallbackLng: "en"` is used at runtime

3. **Simplify fallback logic**
   - Once translations are sufficiently complete, reduce complexity in:
     - `allowEnglishGuideFallback` usage
     - `translation-fallback.ts` utilities
     - Guide SEO template fallback paths

### Related

- `docs/plans/archive/brikette-translation-coverage-plan.md` (COV-01–06 complete; COV-07 moved to BRIK-DEF-07)

### Definition of Done

- Fallback usage telemetry emitting events (requires telemetry infra)
- No high-traffic guide page shows English fallback for a supported locale
- Fallback logic complexity reduced once coverage is sufficient

---

## BRIK-DEF-05: GA4 Data Flow Verification

**Priority:** P1
**Effort:** Small (user verification)
**Origin:** brikette-live-delivery-speed-v2-plan.md, TASK-04

### Description

GA4 measurement ID `G-2ZSYXG8R7T` is injected into the brikette build via `NEXT_PUBLIC_GA_MEASUREMENT_ID` GitHub repo variable, passed through `brikette.yml` workflow at build time. The gtag script is confirmed loading on staging (`712b2b5d`).

Remaining work is **user verification only** — confirm that pageview and Web Vitals events appear in the GA4 dashboard (typically 24-48h after first live traffic).

### GA4 Stream Details

| Property | Value |
|---|---|
| Stream name | hostel |
| Stream URL | https://hostel-positano.com |
| Stream ID | 10183287178 |
| Measurement ID | G-2ZSYXG8R7T |

### Also noted

- **Prime app** GA4 Measurement ID is `G-1QENFNQRMD` — needs separate setup in future.
- CF Pages project env var was also set via API (redundant for CI-built deploys, but present for any direct CF Pages builds).

### Definition of Done

- GA4 Real-Time report shows pageviews from staging or production
- Web Vitals events (LCP, FID, CLS) visible in GA4 Events report
- `reportWebVitals.ts` confirmed sending data (check browser Network tab for `collect` requests to google-analytics.com)

---

## BRIK-DEF-06: Chunk Reduction — Split guides.state.ts Contexts

**Priority:** P2
**Effort:** Large
**Origin:** brikette-live-delivery-speed-v2-plan.md, TASK-06 investigation + TASK-07

### Description

TASK-06 investigation identified `guides.state.ts` as the primary chunking bottleneck:
- **200KB single chunk** containing all guide state for all locales
- Creates **3 webpack contexts** that pull in 3,801 files
- Actual chunk count is ~815 (corrected from initial 4,088 estimate)

### Recommended Approach (from TASK-06)

**Approach A: Split guides.state.ts into per-locale contexts** (recommended over webpack splitChunks)

1. Refactor `guides.state.ts` so each locale has its own dynamic import context
2. Only the active locale's guide data is loaded at runtime
3. Reduces the 200KB monolithic chunk to ~11KB per locale

### Why not webpack splitChunks (TASK-07 original approach)

- splitChunks groups chunks but doesn't reduce the total JS loaded
- The root cause is a single file importing all locales — splitting at the source is more effective
- splitChunks config adds maintenance burden with marginal benefit

### Key Files

- `apps/brikette/src/data/guides/guides.state.ts` — primary bottleneck (200KB, 3 webpack contexts)
- 5 dynamic import loaders in the i18n architecture (see TASK-06 investigation output in v2 plan)

### Dependencies

- BRIK-DEF-02 (bundle analyzer) would help validate before/after

### Definition of Done

- `guides.state.ts` refactored to per-locale dynamic imports
- Chunk containing all guide state eliminated (target: <15KB per-locale chunk)
- Total chunk count reduced from ~815 to <200
- No regression in guide loading behavior (all locales, all guide types)
- Lighthouse Performance score maintained or improved

### Related Evidence

- Full investigation output: `docs/plans/archive/brikette-live-delivery-speed-v2-plan.md` → TASK-06 Build Completion
- Audit report: `docs/audits/user-testing/2026-02-10-712b2b5d-brikette-staging-delivery-speed-audit.md`

---

## BRIK-DEF-07: Legacy Route-Guide JSON Fate

**Priority:** P3
**Effort:** Small-Medium
**Origin:** docs/plans/archive/brikette-translation-coverage-plan.md (BRIK-I18N-COV-07)

### Description

Decide the fate of 24 extra root route-guide JSON files present in 10 locales but not EN (example: `positanoAmalfiBus.json`). Confirm whether these files are still consumed by any loader/route. If not consumed, remove or consolidate safely; if consumed intentionally, document ownership and consumer references.

### Definition of Done

- Usage confirmed with concrete loader/route references or explicit non-usage evidence
- Either:
  - Unused files are removed safely with no runtime regressions, or
  - Files are retained intentionally with clear documentation of why
- Follow-up evidence captured in this plan or a linked fact-find

## Parking Lot (Nice-to-Have)

These items were mentioned in the improvement plan but are low priority and may never be needed:

- **Error handling documentation** — Document the translation-probe pattern and when bare `catch {}` is acceptable
- **Optimization guidelines** — Document when to use/avoid `useMemo`/`useCallback`
- **Guide overrides documentation** — How to add new entries to `guide-overrides.ts`

---

## Validation

| Task | Validation Command |
|------|-------------------|
| Build | `pnpm --filter @apps/brikette build` |
| Typecheck | `pnpm --filter @apps/brikette typecheck` |
| Tests | `pnpm --filter @apps/brikette test` |
| Bundle analysis | `ANALYZE=true pnpm --filter @apps/brikette build` |
