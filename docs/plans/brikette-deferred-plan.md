---
Type: Plan
Status: Active
Domain: Brikette
Last-reviewed: 2026-01-23
Relates-to charter: none
Consolidates:
  - docs/plans/archive/brikette-improvement-plan.md (Phase 3–4 deferred)
  - docs/plans/archive/brikette-htgh-content-fix-plan.md (build verification blocked)
---

# Brikette Deferred Work Plan

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

- `docs/plans/brikette-translation-coverage-plan.md` (BRIK-I18N-COV-01–06 complete; COV-07 deferred)

### Definition of Done

- Fallback usage telemetry emitting events (requires telemetry infra)
- No high-traffic guide page shows English fallback for a supported locale
- Fallback logic complexity reduced once coverage is sufficient

---

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
