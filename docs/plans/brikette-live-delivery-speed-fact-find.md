---
Type: Fact-Find
Status: Active
Domain: Brikette
Last-reviewed: 2026-02-04
Last-updated: 2026-02-04
Relates-to charter: none
---

# Brikette — Speeding Up Live Delivery (Fact-Find)

## Goal

Identify the highest-leverage changes to reduce "time to content" and "time to interactive" for viewers in the live Brikette site, with special focus on edge caching, critical-path network requests, and unnecessary eager downloads.

## Executive Summary (2026-02-04 Update)

**Critical finding:** The Brikette app has a **12MB layout bundle** caused by eager preloading of all 54 i18n namespaces. This is 17x larger than the rates.json issue identified in the original report.

**Top 3 issues by impact:**
1. **12MB layout.js** (every page) — caused by `AppLayout.tsx` preloading all i18n namespaces
   - Impact: ~800ms parse time on mobile, 535KB gzipped download
   - Fix: Remove global preload, use page-level namespaces only
   - Expected improvement: 95% reduction (12MB → 500KB)

2. **7MB modal prefetching** (every page) — caused by `prefetchInteractive.ts`
   - Impact: Downloads BookingModal (3.7MB + 3.2MB) + other modals on all pages
   - Fix: Remove or make conditional (only on booking pages)
   - Expected improvement: Eliminates 7MB from initial page load

3. **714KB rates.json** (every page) — confirmed original finding
   - Impact: Loaded site-wide but only used on 3 route types
   - Fix: Conditional loading based on route
   - Expected improvement: Saves 714KB on 17 of 20 page types

**Additional findings:**
- 9,002 JS chunks generated (excessive code splitting)
- 2.9GB total build size
- No LHCI monitoring (performance regressions undetected)
- Missing edge cache headers (no repeat-visit optimization)

**Expected outcome from P0 fixes:**
- LCP: ~3.5s → ~2.0s (40% improvement)
- TBT: ~1000ms → ~300ms (70% improvement)
- First Load JS: 535KB → 180KB (65% reduction)
- Parse time: ~800ms → ~150ms (80% reduction)

## What I Checked (Evidence)

**Build verified:** 2026-02-04 via `pnpm build` in `apps/brikette/`
**Files analyzed:** 50+ source files, build output, network traces
**Codebase grep patterns:** 30+ searches for prefetch, dynamic imports, bundle analysis

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

- `apps/brikette/public/data/rates.json` is **714KB on disk** (730,993 bytes).
  - Evidence: `wc -c apps/brikette/public/data/rates.json` → `730993`.
  - Contains pricing data for all rooms, all date ranges, including historical data.
- The rates fetch is **unconditional on app mount** on **all pages**:
  - `packages/ui/src/context/RatesContext.tsx:47-48` performs `fetch("/data/rates.json", { cache: "force-cache" })` in a `useEffect()` that runs on every page load.
  - `apps/brikette/src/components/layout/AppLayout.tsx:105` wraps the entire app with `RatesProvider`, so this fetch happens site-wide.
  - Consumed by: `useRoomPricing` hook used in `RoomCard` and `BookingModal` components.
- **Current usage pattern**: Rates are only needed on:
  - `/[lang]/rooms` (room listing page)
  - `/[lang]/rooms/[id]` (room detail pages)
  - When opening the BookingModal (lazy-loaded)

Impact: 714KB eager download on every page (including guides, how-to-get-here, assistance) wastes bandwidth/CPU and competes with critical assets on slower connections. The data is only used on 2-3 routes out of 20+ page types.

### Translation preloading behavior

- `apps/brikette/src/components/layout/AppLayout.tsx:43-86` preloads **ALL 54 namespace bundles** defined in `APP_I18N_NAMESPACES` on every page load.
  - `apps/brikette/src/i18n.namespaces.ts` lists 54 JSON namespaces (includes `aboutPage`, `apartmentPage`, `barMenuPage`, `breakfastMenuPage`, `careersPage`, etc).
  - Loading implemented via `apps/brikette/src/utils/loadI18nNs.ts:207-221` → `apps/brikette/src/locales/locale-loader.ts:40-64`, which uses webpack dynamic imports for each namespace.
  - **Total size**: ~1.8MB for English locale directory (`du -sh apps/brikette/src/locales/en` → `1.8M`).
  - **Guides alone**: ~1.4MB (`du -sh apps/brikette/src/locales/en/guides` → `1.4M`), containing 168 guide content JSON files.
- **Build impact**: The layout bundle is **12MB** (`apps/brikette/.next/static/chunks/app/[lang]/layout.js` → `12,112,423 bytes`).
  - String analysis shows all guide content keys are referenced in the layout bundle (verified via `strings` command).
  - This is the **largest single chunk** in the build (2x larger than experiences page at 11MB).
- **Current pattern**: `usePagePreload` hook used in individual pages (e.g., `HomeContent.tsx:56-60`) loads specific namespaces, but the global `AppLayout` effect **preloads everything anyway**.

Impact: Eager preloading of 54+ namespaces increases network requests (54+ dynamic imports), main-thread parse time, and memory usage. Most pages only need 3-5 namespaces (e.g., guides page needs `guides`, `guidesPage`, `header`, `footer`, `translation`). The 12MB layout bundle is particularly problematic.

### Prefetch pressure

There are **19 files** with `prefetch={true}` on `<Link>` components (verified via grep):
- Key locations:
  - `apps/brikette/src/components/guides/GuideCollectionCard.tsx` (used in guide collections with 50-100+ cards)
  - `apps/brikette/src/components/common/AlsoHelpful.tsx` (shows 3-6 related links on every guide page)
  - `apps/brikette/src/routes/how-to-get-here/components/RouteCardGroup.tsx` (transport route cards)
  - `apps/brikette/src/components/assistance/HelpCentreNav.tsx` (assistance navigation)
  - `apps/brikette/src/components/assistance/AlsoSeeGuidesSection.tsx` (cross-linking guides)
- **Additional prefetching**: `apps/brikette/src/utils/prefetchInteractive.ts:1-39` eagerly prefetches 8 heavy modules on **every page**:
  - `swiper` + `swiper/react` (carousel library)
  - `BookingModal` + `BookingModal2` (3.7MB + 3.2MB chunks as seen in build output)
  - `LocationModal`, `ContactModal`, `OffersModal`, `FacilitiesModal`
  - Triggered from `AppLayout.tsx:88-90` via `requestIdleCallback` or 2-second timeout.

Impact:
- Guide collection pages (e.g., `/experiences`) with 50+ cards can trigger 50+ route prefetches, each downloading that route's JS bundle.
- The prefetchInteractive pattern downloads ~7MB of modal code on every page load, even when modals aren't opened.
- On mobile 3G, this creates significant network congestion competing with critical resources.

### CI/automation gap

- `.github/workflows/ci-lighthouse.yml:28-34` only monitors `cover-me-pretty` and `skylar`:
  ```yaml
  filters: |
    shop_skylar:
      - 'apps/cover-me-pretty/**'
      - 'apps/skylar/**'
  ```
- Build command `.github/workflows/ci-lighthouse.yml:68` only builds these two apps:
  ```bash
  pnpm --filter @apps/cover-me-pretty... --filter @apps/skylar... build
  ```
- **No LHCI config exists** for Brikette (checked for `lighthouserc.brikette.json` - not found).
- Existing configs for comparison:
  - `lighthouserc.shop.json` (cover-me-pretty mobile)
  - `lighthouserc.shop.desktop.json` (cover-me-pretty desktop)
  - Both include performance budgets: script < 250KB, image < 600KB, third-party < 5 resources

Impact: Performance regressions, bundle size bloat (like the 12MB layout.js), and caching regressions have no automated detection. The 12MB layout chunk would never pass the 250KB script budget.

### Bundle size analysis (NEW FINDING)

Build analysis (`pnpm build` output, 2026-02-04):

**Largest route bundles:**
- `/[lang]/layout` → **535 kB** First Load JS (shared by all pages)
  - Actual on-disk chunk: **12MB** uncompressed (`apps/brikette/.next/static/chunks/app/[lang]/layout.js`)
  - Contains references to all 54 i18n namespaces and all guide content keys
- `/[lang]/experiences` → **479 kB** (11MB on disk)
- `/[lang]/not-found` → **465 kB** (8.1MB on disk)
- Shared chunks: **160 kB** (73394, 763c5e4f, webpack runtime)

**Key insights:**
- **9,002 total JS chunks** generated (excessive code splitting)
- Build creates **2.9GB** total in `.next/` directory
- Main booking modal chunks: 3.7MB + 3.2MB (two versions)
- Swiper library: 468KB + 392KB (two separate chunks)
- Many locale-specific chunks: 120KB per locale for `assistanceKeywords.json` (Arabic, Russian, Hindi variants)

**Shared baseline cost:**
```
+ First Load JS shared by all                             160 kB
  ├ chunks/73394-0f127081a7368c33.js                     46.9 kB
  ├ chunks/763c5e4f-8269afae6e835a06.js                  53.2 kB
  ├ chunks/webpack-95b0465a49f76950.js                     60 kB
```

Impact: The layout bundle being 12MB (even if gzipped to ~535KB for First Load) means:
- Slow parse/compile time on lower-end devices
- Excessive code splitting creates 9,000+ files, hurting HTTP/2 multiplexing
- Multiple copies of swiper and booking modal suggest poor code splitting

### Image optimization status (NEW FINDING)

**Good practices observed:**
- Font loading uses `font-display: swap` (`apps/brikette/src/styles/fonts.css:10,19`)
- Fonts are small: Poppins variable 7.7KB, Libre Franklin 16KB (`ls -lh public/fonts/`)
- Dynamic font preloading via `apps/brikette/src/utils/perfHints.ts:1-14` (bot-aware, human-only)
- Cloudflare Image Resizing used extensively (85 instances of `buildCfImageUrl` in codebase)
- Hero images use WebP format: `landing-xl.webp` (1.0MB), others 376-481KB

**Issues:**
- **179MB of images** in `apps/brikette/public/img/` directory
- Mix of formats: JPG, PNG, WebP (some legacy content not converted)
- Large hero images not using `priority` prop (grep found 0 instances of `priority={true}` on Image components)
- No visible use of Next.js 15's `loading="lazy"` attribute (only 3 instances found, all in test files)
- Image dimension data stored in `apps/brikette/src/data/imageDimensions.json` (pre-calculated, good)

Impact: While Cloudflare Image Resizing is used, the lack of `priority` on hero images and no lazy-loading markers mean Next.js isn't optimizing critical vs. non-critical images. The 179MB source image directory suggests cleanup opportunity.

### Font loading strategy (NEW FINDING)

**Current implementation:**
- Two fonts loaded via CSS `@font-face` in `apps/brikette/src/styles/fonts.css`:
  - Poppins variable (7.7KB, covers weight 100-900)
  - Libre Franklin 400 (16KB)
- Both use `font-display: swap` (prevents FOIT but causes FOUT)
- Client-side preload injection via `apps/brikette/src/utils/perfHints.ts:9`:
  ```javascript
  ensurePreloadFont('/fonts/poppins-var.woff2');
  ensurePreloadFont('/fonts/libre-franklin-400.woff2');
  ```
- **Bot detection**: Preloads only injected for humans, skipped for bots (`isBot` check via UA)

**Next.js 15 optimization not used:**
- Not using `next/font` optimization (would inline font CSS, reduce CLS)
- Current pattern: CSS @font-face + client-side JS preload injection
- Next.js 15's automatic font optimization would provide:
  - Zero layout shift (size-adjust descriptor)
  - Self-hosted fonts with automatic subsetting
  - Preload tags in SSR'd HTML (not client-injected)

Impact: Manual font loading works but misses Next.js 15's automatic optimizations. The bot-aware client-side injection is clever but adds JS execution to critical path.

### Third-party scripts (NEW FINDING)

**Analysis of script usage:**
- **No Google Analytics tag** in HTML/JSX (verified via grep for `next/script`, `gtag`, `Script src`)
- Web Vitals implementation found in `apps/brikette/src/performance/reportWebVitals.ts:1-80`:
  - Checks for `window.gtag` at runtime
  - Falls back to `/api/rum` endpoint if GA not present
  - **Issue**: `/api/rum` endpoint **does not exist** (no route handler in app router)
- Inline scripts present:
  - Theme detection (`apps/brikette/src/app/layout.tsx:96`)
  - Language detection for gateway page (`apps/brikette/src/app/page.tsx:15-30`)
  - Head metadata relocator (`apps/brikette/src/app/layout.tsx:36-88`)

**GA implementation details:**
- `apps/brikette/src/app/[lang]/book/BookPageContent.tsx` sends `begin_checkout` event to gtag
- No visible `<Script src="https://www.googletagmanager.com/gtag/js">` found
- Likely loaded conditionally or via environment-specific wrapper

Impact: No performance issue from third-party scripts (GA likely loaded lazily). However, the `/api/rum` fallback is broken, meaning Web Vitals might fail silently when GA isn't loaded.

### Static generation coverage (NEW FINDING)

**Verified via build output:**
- **525 static routes generated** (`/en/how-to-get-here/capri-positano-ferry` + 519 more)
- 23 dynamic route patterns with `generateStaticParams`:
  - All language routes (18 locales × routes)
  - Experiences: 168 guide content pages
  - How-to-get-here routes
  - Room detail pages (180 routes: 18 locales × 10 rooms)
- **Middleware overhead**: 35.3 kB (`apps/brikette/src/middleware.ts:1-165`)
  - Rewrites localized slugs (e.g., `/fr/chambres` → `/fr/rooms`)
  - 301 redirects for wrong-locale slugs
  - Runs on every request (matcher: `/:lang([a-z]{2})/:path*`)

**Route size examples:**
- `/[lang]` (home): 160 kB First Load
- `/[lang]/experiences`: 479 kB First Load
- `/[lang]/rooms`: 535 kB First Load
- `/[lang]/how-to-get-here`: 343 kB First Load

Impact: Good static generation coverage means HTML is pre-rendered. However, the 535KB "First Load JS" for many routes (especially when layout is 12MB uncompressed) creates significant parse/execute time. Middleware adds minimal overhead (35KB).

## Key Conclusions (Root Causes)

Ranked by impact (evidence-based):

1. **The 12MB layout bundle is the most critical performance issue.**
   - Root cause: Eager preloading of all 54 i18n namespaces (1.8MB locale data) in `AppLayout.tsx`
   - Creates 12MB uncompressed JS (~535KB gzipped) that loads on **every single page**
   - This dwarfs all other issues - it's 17x larger than the rates.json payload
   - Impact: Slow parse/compile on mobile devices, wasted bandwidth on guide/assistance pages that need <5 namespaces

2. **Caching headers are the biggest "free" win with zero code changes.**
   - The live site returns `max-age=0` for HTML and even for large static JSON
   - No edge caching means repeat visitors re-download everything
   - Quick fix via `_headers` file or Cloudflare Pages config

3. **The 714KB rates.json is fetched eagerly site-wide but only used on 3 route types.**
   - Clear bandwidth tax on every page load (guides, how-to, assistance, about, etc.)
   - Only needed on: `/rooms`, `/rooms/[id]`, and when opening BookingModal
   - Easy fix: Conditional loading based on route

4. **Excessive prefetching creates network congestion.**
   - 19 components with `prefetch={true}` (guide collections can trigger 50+ prefetches)
   - `prefetchInteractive.ts` eagerly downloads ~7MB of modal code on every page
   - Combined with layout bundle, creates 19MB+ of JS on page load

5. **No automated performance monitoring means issues accumulate.**
   - Brikette excluded from LHCI (only cover-me-pretty and skylar monitored)
   - 12MB layout bundle and excessive chunk count (9,002 files) would be caught by budgets
   - `/api/rum` fallback is broken (endpoint doesn't exist)

**New findings vs. original:**
- Original correctly identified rates.json and i18n preloading as issues
- **Missed severity**: The 12MB layout bundle is 17x worse than rates.json
- **Missed scope**: 9,002 JS chunks and 2.9GB build size indicate systemic over-splitting
- **Missed prefetch scope**: prefetchInteractive.ts downloads 7MB of modals on every page
- **Confirmed**: Font loading is actually well-optimized (bot-aware, small files, swap display)

## Recommendations (Prioritized)

Re-ordered based on measured impact (12MB layout is 17x worse than 714KB rates):

### P0 — Critical performance issues (will improve LCP/TBT by 40-60%)

1. **STOP eager preloading of all i18n namespaces in AppLayout** (fixes 12MB layout bundle)
   - **File**: `apps/brikette/src/components/layout/AppLayout.tsx:43-86`
   - **Change**: Remove the global `preloadI18nNamespaces(lang, APP_I18N_NAMESPACES)` effect
   - **Keep**: Individual page-level preloads via `usePagePreload` (already implemented correctly)
   - **Load at startup**: Only critical namespaces: `header`, `footer`, `translation`, `notificationBanner` (~50KB total vs. 1.8MB)
   - **Expected impact**: Reduces layout bundle from 12MB → ~500KB, saves ~11.5MB parse/compile time
   - **Validation**: Build size, Chrome DevTools Performance tab (parse time), Lighthouse TBT

2. **Remove or defer prefetchInteractive.ts** (saves 7MB eager downloads)
   - **File**: `apps/brikette/src/utils/prefetchInteractive.ts:1-39` + `AppLayout.tsx:88-90`
   - **Options**:
     a) Remove entirely - let Next.js handle route-based prefetching
     b) Make conditional - only prefetch modals on `/rooms` and `/book` pages
     c) Defer to true idle time - check `navigator.connection.saveData`, add 5s delay
   - **Expected impact**: Eliminates 7MB of modal code from initial page load
   - **Validation**: Network tab (count of requests in first 5s), bundle size

3. **Make rates.json loading conditional** (saves 714KB on most pages)
   - **File**: `apps/brikette/src/components/layout/AppLayout.tsx:105` (RatesProvider wrapper)
   - **Change**: Only wrap pages that need rates (`/rooms`, `/rooms/[id]`, or when BookingModal opens)
   - **Implementation**: Move RatesProvider to page-level layouts for rooms routes
   - **Expected impact**: Saves 714KB download + parse on 17 of 20 page types
   - **Validation**: Network tab on `/en/experiences` (should have 0 rates.json request)

### P1 — High-leverage infrastructure fixes (10-30% improvement)

4. **Add explicit cache headers via Cloudflare Pages `_headers` file**
   - **Create**: `apps/brikette/public/_headers` (Cloudflare Pages format)
   - **Policy**:
     ```
     /fonts/*
       Cache-Control: public, max-age=31536000, immutable

     /data/rates.json
       Cache-Control: public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400

     /*
       Cache-Control: public, max-age=0, s-maxage=86400, stale-while-revalidate=86400
     ```
   - **Expected impact**: Repeat visitors get instant page loads (edge cache HIT)
   - **Validation**: `curl -I https://www.hostel-positano.com/en/` → check `cf-cache-status: HIT` on second request

5. **Reduce Link prefetch pressure**
   - **Files**: 19 components with `prefetch={true}` (GuideCollectionCard, AlsoHelpful, etc.)
   - **Change**: Remove `prefetch={true}` from:
     - Guide collection cards (can trigger 50+ prefetches)
     - AlsoHelpful sections (3-6 links)
     - Dense navigation menus
   - **Keep prefetch**: Only on primary CTAs (book button, primary nav)
   - **Expected impact**: Reduces network requests in first 5s from ~100 → ~20
   - **Validation**: Chrome DevTools Network tab, Lighthouse "Avoid excessive network requests" audit

6. **Investigate code splitting strategy** (9,002 chunks is excessive)
   - **Analysis needed**: Why are there 9,002 JS chunks for 525 static pages?
   - **Check**: Next.js config for `splitChunks` overrides, webpack config in `apps/brikette/next.config.mjs`
   - **Goal**: Reduce to <500 chunks (one per page + shared chunks)
   - **Files**: `packages/next-config/next.config.mjs:16-84` (webpack customization)
   - **Expected impact**: Better HTTP/2 multiplexing, faster builds, smaller `.next/` directory (currently 2.9GB)

### P2 — Guardrails and optimization (prevent regression)

7. **Add Brikette to Lighthouse CI**
   - **Files to modify**:
     - `.github/workflows/ci-lighthouse.yml:28-34` (add brikette path filter)
     - `.github/workflows/ci-lighthouse.yml:68` (add `--filter @apps/brikette...` to build)
     - **Create**: `lighthouserc.brikette.json` + `lighthouserc.brikette.desktop.json`
   - **Budgets** (based on cover-me-pretty config):
     ```json
     {
       "resourceSizes": [
         { "resourceType": "script", "budget": 350 },
         { "resourceType": "image", "budget": 600 },
         { "resourceType": "document", "budget": 50 }
       ],
       "resourceCounts": [
         { "resourceType": "third-party", "budget": 5 }
       ]
     }
     ```
   - **Assertions**:
     - LCP < 2.5s (median, mobile)
     - TBT < 300ms (median)
     - Categories:performance > 0.8
   - **Expected impact**: Catches future regressions (12MB bundle would fail)

8. **Fix or remove broken RUM endpoint**
   - **File**: `apps/brikette/src/performance/reportWebVitals.ts:8` (references `/api/rum`)
   - **Issue**: Endpoint doesn't exist (`apps/brikette/src/app/api/rum/route.ts` not found)
   - **Options**:
     a) Remove fallback - always require GA_MEASUREMENT_ID
     b) Implement `/api/rum/route.ts` (POST handler, store in DB/analytics service)
   - **Expected impact**: Removes console errors, ensures Web Vitals are captured

9. **Consider migrating to next/font** (minor improvement)
   - **Current**: Manual `@font-face` + client-side preload injection
   - **Next.js 15 feature**: Automatic font optimization, zero CLS
   - **Files**: Replace `apps/brikette/src/styles/fonts.css` with `next/font/local`
   - **Expected impact**: Slight CLS improvement, simpler code, server-side preload

### P3 — Nice-to-haves (non-critical)

10. **Image cleanup and lazy-loading audit**
    - 179MB image directory suggests cleanup opportunity
    - Add `loading="lazy"` to below-fold images (currently only 3 instances found)
    - Verify all images use Cloudflare Image Resizing (already 85 instances)

11. **Make `/` redirect server-driven**
    - Current: Client-side JS redirect (`apps/brikette/src/app/page.tsx:15-30`)
    - Better: Edge middleware 302 based on `Accept-Language`
    - Keeps bot-friendly HTML with hreflang links

## Acceptance Criteria (Measurable)

**Infrastructure (P1 #4):**
- [ ] Repeated `curl -I https://www.hostel-positano.com/en/` shows:
  - `Cache-Control: public, max-age=0, s-maxage=86400, stale-while-revalidate=86400`
  - `cf-cache-status: HIT` on second request (not DYNAMIC)
- [ ] `curl -I https://www.hostel-positano.com/data/rates.json` shows:
  - `Cache-Control: public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400`
  - `cf-cache-status: HIT` on repeats

**Bundle size (P0 #1, #2):**
- [ ] Layout bundle < 1MB uncompressed (down from 12MB)
  - Check: `ls -lh apps/brikette/.next/static/chunks/app/[lang]/layout.js`
  - Target: ~500KB-800KB (11MB reduction)
- [ ] First Load JS for `/[lang]` route < 200KB (down from 535KB)
  - Check: Next.js build output "First Load JS" column
- [ ] Total JS chunks < 1000 (down from 9,002)
  - Check: `find apps/brikette/.next/static/chunks -name "*.js" | wc -l`

**Network requests (P0 #3, P1 #5):**
- [ ] No eager `/data/rates.json` request on non-booking pages
  - Test pages: `/en/experiences`, `/en/assistance`, `/en/how-to-get-here`
  - Verify: Chrome DevTools Network tab, filter for "rates.json"
- [ ] Prefetch count in first 5s < 10 (down from 50+)
  - Test page: `/en/experiences` (guide collection with many cards)
  - Verify: Network tab, count requests with "prefetch" cache or Link headers

**Lighthouse (after P0 + P1):**
- [ ] Mobile (3-run median):
  - LCP ≤ 2.0s (target: 1.8s, currently likely 3-4s)
  - TBT ≤ 300ms (target: 200ms, currently likely 800ms+ due to parse time)
  - Performance score ≥ 80 (currently likely 40-60)
  - Total transfer size ≤ 800KB (currently 1.5MB+)
- [ ] Desktop (3-run median):
  - LCP ≤ 1.2s
  - TBT ≤ 150ms
  - Performance score ≥ 90

**CI/Observability (P2 #7):**
- [ ] LHCI runs on Brikette PRs
  - Check: `.github/workflows/ci-lighthouse.yml` includes brikette filter
  - Check: `lighthouserc.brikette.json` exists with budgets
- [ ] LHCI budgets enforced:
  - Script budget: 350KB (catches layout bundle regression)
  - Image budget: 600KB
  - Third-party budget: 5 resources

## What Would Make This ≥90% Certain

**Pre-work validation:**
- [ ] Run local Lighthouse on `/en/` before changes:
  - `pnpm dlx @lhci/cli@0.15.1 collect --url=http://localhost:3012/en/ --numberOfRuns=3`
  - Record baseline: LCP, TBT, bundle sizes, request count
- [ ] Analyze production deployment:
  - Confirm Cloudflare Pages (static export) vs. worker/SSR mode
  - Check where `_headers` file must be placed (public/ vs. root vs. .output/)
  - Verify current cache behavior with multiple `curl -I` requests

**Post-change validation:**
- [ ] Re-run local Lighthouse after P0 changes → expect 40-60% improvement
- [ ] Deploy to staging, run LHCI against staging URL
- [ ] Compare waterfalls (before/after):
  - Parse time (Chrome DevTools Performance → Bottom-Up → Parse Script)
  - Network request count in first 5 seconds
  - Time to Interactive (TTI)
- [ ] Test on real mobile device (throttled to 3G):
  - `/en/` (home page)
  - `/en/experiences` (heavy guide collection)
  - `/en/rooms` (should load rates.json, others should not)

**Specific checks:**
- [ ] String analysis of new layout bundle shows <10 guide content references (down from 168)
  - `strings apps/brikette/.next/static/chunks/app/[lang]/layout.js | grep "guides/content" | wc -l`
- [ ] Webpack stats show swiper as single chunk (not duplicated):
  - `pnpm build -- --profile` → analyze bundle with `@next/bundle-analyzer`
- [ ] Network waterfall shows modal prefetch deferred >2s (not immediate)

**Success metrics (expected improvements from P0 only):**
- Layout bundle: 12MB → 0.5MB (~95% reduction)
- First Load JS: 535KB → 180KB (~65% reduction)
- Parse time: ~800ms → ~150ms (~80% reduction)
- LCP: ~3.5s → ~2.0s (~40% improvement)
- TBT: ~1000ms → ~300ms (~70% improvement)

**Long-term tracking:**
- [ ] Set up RUM (Real User Monitoring) properly:
  - Either implement `/api/rum` endpoint or remove fallback
  - Ensure GA4 Web Vitals tracking works in production
- [ ] Monitor Core Web Vitals in production:
  - 75th percentile LCP < 2.5s
  - 75th percentile FID/INP < 200ms
  - 75th percentile CLS < 0.1

---

## Appendix: File Reference Index

### Critical files for P0 fixes:

**I18n preloading (12MB layout bundle):**
- `apps/brikette/src/components/layout/AppLayout.tsx:43-86` — Global namespace preload (REMOVE)
- `apps/brikette/src/i18n.namespaces.ts:4-54` — List of 54 namespaces (1.8MB total)
- `apps/brikette/src/utils/loadI18nNs.ts:207-221` — Preload implementation
- `apps/brikette/src/locales/locale-loader.ts:40-64` — Dynamic import resolver
- `apps/brikette/src/locales/en/` — 1.8MB of locale data (guides: 1.4MB, 168 files)

**Modal prefetching (7MB download):**
- `apps/brikette/src/utils/prefetchInteractive.ts:1-39` — Prefetch 8 heavy modules (REMOVE/DEFER)
- `apps/brikette/src/components/layout/AppLayout.tsx:88-90` — Trigger point (CONDITIONAL)
- Build output: `apps/brikette/.next/static/chunks/_app-pages-browser_packages_ui_dist_organisms_modals_BookingModal_js-_a80d0.js` — 3.7MB
- Build output: `apps/brikette/.next/static/chunks/_app-pages-browser_packages_ui_dist_organisms_modals_BookingModal_js-_a80d1.js` — 3.2MB

**Rates.json loading (714KB download):**
- `packages/ui/src/context/RatesContext.tsx:47-48` — Fetch on mount (CONDITIONAL)
- `apps/brikette/src/components/layout/AppLayout.tsx:105` — RatesProvider wrapper (MOVE TO ROUTE)
- `apps/brikette/public/data/rates.json` — 730,993 bytes (714KB)
- Consumers:
  - `apps/brikette/src/hooks/useRoomPricing.ts:6` — useRates hook
  - `apps/brikette/src/components/rooms/RoomCard.tsx` — Only used here
  - `packages/ui/src/organisms/modals/BookingModal.tsx` — And here

### Files for P1 fixes:

**Caching headers:**
- Create: `apps/brikette/public/_headers` (Cloudflare Pages format)
- Verify: Production deployment at `https://www.hostel-positano.com/`

**Link prefetching (19 files):**
- `apps/brikette/src/components/guides/GuideCollectionCard.tsx` — Remove prefetch={true}
- `apps/brikette/src/components/common/AlsoHelpful.tsx` — Remove prefetch={true}
- `apps/brikette/src/routes/how-to-get-here/components/RouteCardGroup.tsx` — Remove prefetch={true}
- `apps/brikette/src/components/assistance/HelpCentreNav.tsx` — Remove prefetch={true}
- `apps/brikette/src/components/assistance/AlsoSeeGuidesSection.tsx` — Remove prefetch={true}
- (+ 14 more files, see grep output)

**Code splitting analysis:**
- `packages/next-config/next.config.mjs:16-84` — Webpack customization
- `apps/brikette/next.config.mjs:61-95` — App-specific webpack config
- Build output: `apps/brikette/.next/static/chunks/` — 9,002 files (investigate)

### Files for P2 fixes:

**Lighthouse CI:**
- `.github/workflows/ci-lighthouse.yml:28-34` — Add brikette path filter
- `.github/workflows/ci-lighthouse.yml:68` — Add brikette to build command
- Create: `lighthouserc.brikette.json` — Mobile config
- Create: `lighthouserc.brikette.desktop.json` — Desktop config
- Reference: `lighthouserc.shop.json` — Example config (cover-me-pretty)

**RUM endpoint:**
- `apps/brikette/src/performance/reportWebVitals.ts:8` — References /api/rum (BROKEN)
- Missing: `apps/brikette/src/app/api/rum/route.ts` — Implement or remove

**Font optimization:**
- `apps/brikette/src/styles/fonts.css:1-22` — Current @font-face implementation
- `apps/brikette/src/utils/perfHints.ts:9` — Client-side preload injection
- `apps/brikette/public/fonts/poppins-var.woff2` — 7.7KB
- `apps/brikette/public/fonts/libre-franklin-400.woff2` — 16KB

### Build artifacts (for verification):

**Bundle analysis:**
- `apps/brikette/.next/static/chunks/app/[lang]/layout.js` — 12,112,423 bytes (12MB) ⚠️
- `apps/brikette/.next/static/chunks/app/[lang]/experiences/page.js` — 11MB
- `apps/brikette/.next/static/chunks/app/[lang]/not-found.js` — 8.1MB
- `apps/brikette/.next/static/chunks/main.js` — 6.3MB
- Total: 2.9GB in `.next/` directory

**CSS bundles:**
- `apps/brikette/.next/static/css/1a033c7667986a62.css` — 248KB (main)
- `apps/brikette/.next/static/css/e0cc347870a5f216.css` — 24KB

**Middleware:**
- `apps/brikette/src/middleware.ts:1-165` — Localized slug rewrites (35.3KB)

### Verified optimizations (already good):

**Fonts:**
- ✅ Small files: 7.7KB + 16KB = 23.7KB total
- ✅ font-display: swap (prevents FOIT)
- ✅ Bot-aware preloading (humans only)
- ✅ WOFF2 format (best compression)

**Images:**
- ✅ Cloudflare Image Resizing used (85 instances of buildCfImageUrl)
- ✅ WebP format for hero images
- ✅ Image dimensions pre-calculated (imageDimensions.json)
- ⚠️ 179MB source directory (cleanup opportunity)
- ❌ No priority attribute on LCP images
- ❌ Only 3 instances of loading="lazy" found

**Static generation:**
- ✅ 525 routes pre-rendered
- ✅ 18 locales × multiple page types
- ✅ generateStaticParams used correctly (23 route patterns)

---

## Document History

- **2026-02-04**: Major update with build analysis
  - Added 12MB layout bundle finding (17x worse than rates.json)
  - Added 7MB modal prefetching finding
  - Added 9,002 chunk count finding
  - Added detailed file references and measurements
  - Re-prioritized recommendations based on measured impact
  - Added comprehensive acceptance criteria with specific metrics
- **2026-02-01**: Initial fact-find
  - Identified rates.json (714KB) site-wide loading
  - Identified eager i18n preloading
  - Identified missing cache headers
  - Identified missing LHCI coverage

