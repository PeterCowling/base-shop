---
Type: Fact-Find
Status: Active
Domain: Brikette
Last-reviewed: 2026-02-01
Last-updated: 2026-02-01
Relates-to charter: none
---

# Brikette — Speeding Up Live Delivery (Fact-Find)

## Goal

Identify the highest-leverage changes to reduce “time to content” and “time to interactive” for viewers in the live Brikette site, with special focus on edge caching, critical-path network requests, and unnecessary eager downloads.

## What I Checked (Evidence)

### Live caching headers (production domain)

Using `curl -I` against `https://www.hostel-positano.com/` and `https://www.hostel-positano.com/en/`:

- HTML responses are not edge-cached:
  - `cache-control: public, max-age=0, must-revalidate`
  - `cf-cache-status: DYNAMIC`
- Static JSON is also not cached:
  - `https://www.hostel-positano.com/data/rates.json` returns the same `cache-control: public, max-age=0, must-revalidate` and `cf-cache-status: DYNAMIC`.
- Many other static assets (fonts, JS, Cloudflare Image Resizing variants) are only cached for 4 hours:
  - `cache-control: public, max-age=14400, must-revalidate`

Impact: even for fully prerendered pages, lack of edge caching forces more origin work and repeat downloads (especially for un-hashed assets like `rates.json`).

### Largest always-on client request

- `apps/brikette/public/data/rates.json` is ~714KB on disk.
  - Evidence: `wc -c apps/brikette/public/data/rates.json` → `730993`.
- The rates fetch is unconditional on app mount:
  - `packages/ui/src/context/RatesContext.tsx` performs `fetch("/data/rates.json")` in a `useEffect()` that runs on every page load.
  - `apps/brikette/src/components/layout/AppLayout.tsx` wraps the entire app with `RatesProvider`, so this fetch happens site-wide.

Impact: large client fetch consumes bandwidth/CPU early and can compete with critical assets on slower connections.

### Translation preloading behavior

- `apps/brikette/src/components/layout/AppLayout.tsx` preloads a very large namespace list (`APP_I18N_NAMESPACES`).
  - `apps/brikette/src/i18n.namespaces.ts` lists dozens of JSON namespaces.
  - Loading is implemented via `apps/brikette/src/utils/loadI18nNs.ts` → `apps/brikette/src/locales/locale-loader.ts`, which resolves JSON via webpack context or dynamic import (many chunks).

Impact: eager preloading increases network requests and main-thread parse time (especially on route entry).

### Prefetch pressure

There are many call sites with `prefetch={true}` on `<Link>` (home hero, nav, guides collections, HTGH content, etc.), for example:
- `packages/ui/src/organisms/LandingHeroSection.tsx`
- `apps/brikette/src/components/guides/GuideCollectionCard.tsx`
- `apps/brikette/src/components/common/AlsoHelpful.tsx`

Impact: large pages with many links can trigger aggressive prefetching, inflating “early network noise”.

### CI/automation gap

- `.github/workflows/ci-lighthouse.yml` only runs LHCI for `apps/cover-me-pretty` and `apps/skylar`, not Brikette.

Impact: performance regressions and caching regressions are easy to miss.

## Key Conclusions (Root Causes)

1. **Caching headers are currently the biggest “free” win.** The live site returns `max-age=0` for HTML and even for large static JSON, preventing edge caching benefits.
2. **The biggest always-on client payload is `rates.json`, and it is fetched eagerly site-wide.** This is a clear bandwidth and latency tax.
3. **Eager i18n preloading and broad link-prefetching both increase request count and CPU parse work.** They may be reasonable in moderation, but current usage is likely over-eager for mobile.
4. **We can’t systematically improve what we don’t measure.** Brikette lacks automated LHCI coverage in CI, and `apps/brikette/src/performance/reportWebVitals.ts` has a `/api/rum` fallback endpoint that is not implemented in the app router.

## Recommendations (Prioritized)

### P0 — Immediate, highest-leverage

1. **Add explicit cache headers for static assets + HTML + `rates.json`.**
   - Prefer Cloudflare Pages `_headers` (or equivalent Next/Pages/Worker header configuration) so the live deployment actually uses it.
   - Suggested policy:
     - `/assets/*`, `/fonts/*`, versioned `/img/*` → `Cache-Control: public, max-age=31536000, immutable`
     - `/data/rates.json` → `Cache-Control: public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400`
     - HTML routes → `Cache-Control: public, max-age=0, s-maxage=86400, stale-while-revalidate=86400`
   - Validate via `curl -I` and Cloudflare “Cache Status” (HIT on repeats).

2. **Stop fetching `/data/rates.json` on every page load.**
   - Make the fetch “on-demand”:
     - Only load when the booking widget/modal needs prices.
     - Or defer via `requestIdleCallback` + `navigator.connection.saveData` check.
   - Consider splitting the JSON by month/season and fetching only the needed window.

3. **Reduce early prefetch pressure.**
   - Audit high-link-count views (guide collections, “AlsoHelpful”, nav menus) and disable/limit prefetching.
   - Use “intent” style prefetching (hover/touchstart) instead of “viewport” for dense link grids.

### P1 — Meaningful improvements with moderate work

4. **Remove global “preload all namespaces” behavior.**
   - Keep only route-level i18n preloads (via `usePagePreload`) and/or load minimal “shell” namespaces (header/footer) at startup.
   - Optionally: create a route → namespaces map and preload based on route selection rather than “everything”.

5. **Make `/` redirect server/edge-driven (not client-driven).**
   - Root navigation should ideally return a 302 to best locale using `Accept-Language` (for humans), while still serving an indexable hreflang cluster to bots.

### P2 — Guardrails and observability

6. **Add Brikette to Lighthouse CI.**
   - Create `lighthouserc.brikette.json` (mobile + desktop) and wire it into `.github/workflows/ci-lighthouse.yml` under a path filter for `apps/brikette/**`.
   - Set budgets around LCP, TBT/INP proxy, and transfer size.

7. **Wire up RUM capture or remove the dead endpoint.**
   - Either implement `/api/rum` in the app router (and store somewhere), or ensure GA is always used and the fallback never fires.

## Acceptance Criteria (Measurable)

- Repeated `curl -I https://www.hostel-positano.com/en/` shows cacheable HTML headers (with `s-maxage`) and Cloudflare reports HIT on repeat.
- `curl -I https://www.hostel-positano.com/data/rates.json` shows non-zero caching TTL and no longer returns `cf-cache-status: DYNAMIC` on repeats.
- No eager `/data/rates.json` request on non-booking pages (verified via DevTools waterfall).
- Lighthouse (mobile, 3-run median) improves on:
  - LCP (target ≤ 2.0s lab)
  - Total transfer size (main route)
  - Request count during first 5 seconds

## What Would Make This ≥90% Certain

- Confirm exactly how the live site is deployed (Pages static vs worker/SSR) and where headers must be configured so they actually apply.
- Add a “perf capture” script (curl + lhci) that runs against staging, so the before/after is recorded.
- After adjusting caching + rates loading, re-run LHCI and compare waterfall + LCP deltas.

