---
Type: Measurement-Setup-Note
Status: Active
Business: BRIK
Date: 2026-02-12
Owner: Pete
---

# BRIK GA4 + Search Console Setup Note

## 1) Why this is now top-priority

Historical baseline data is now active, but it is still proxy-level. Without GA4 + Search Console in production, BRIK cannot measure:

- booking funnel behavior,
- source/channel conversion quality,
- SEO performance by query/page,
- experiment impact by week.

## 2) Current implementation status in code

Tracking hooks already exist in app code and only require runtime configuration:

- GA env key is wired in `apps/brikette/src/config/env.ts` (`NEXT_PUBLIC_GA_MEASUREMENT_ID`).
- GA script injection is wired in `apps/brikette/src/app/layout.tsx`.
- Web Vitals events are wired in `apps/brikette/src/performance/reportWebVitals.ts`.
- Booking intent event (`begin_checkout`) is wired in `apps/brikette/src/app/[lang]/book/BookPageContent.tsx`.

Current blocker: production does not yet have `NEXT_PUBLIC_GA_MEASUREMENT_ID` configured.

## 3) External inputs required from operator

1. Google account with access to create GA4 property and Search Console property.
2. Production domain ownership control for BRIK site (`hostel-positano.com` and variants in use).
3. Cloudflare Pages environment-variable access for the BRIK deploy target.

## 4) Setup checklist

### 4.1 GA4

1. Create GA4 property (timezone `Europe/Rome`, currency `EUR`).
2. Create web data stream for production site URL.
3. Copy measurement ID (`G-...`).
4. Register event-scope custom dimensions:
   - `metric_id`
   - `metric_value`
   - `metric_delta`
   - `metric_rating`
   - `navigation_type`
5. Set Cloudflare Pages production env var:
   - `NEXT_PUBLIC_GA_MEASUREMENT_ID=<G-...>`
6. Trigger production redeploy.

### 4.2 Search Console

1. Add property for production domain.
2. Complete site ownership verification.
3. Submit sitemap:
   - `https://hostel-positano.com/sitemap_index.xml`
4. Confirm indexing status starts populating.

### 4.3 Verification after deploy

1. Open `view-source:https://hostel-positano.com/en/` and confirm `gtag/js?id=G-...` exists.
2. Visit production pages and confirm `web_vitals` events appear in GA4 Realtime/DebugView.
3. Start booking flow and confirm `begin_checkout` event appears in GA4.
4. Confirm Search Console receives sitemap and begins URL discovery.

## 5) Definition of done

- `NEXT_PUBLIC_GA_MEASUREMENT_ID` set in production and deployed.
- GA4 receiving `web_vitals` and `begin_checkout`.
- Search Console property verified with sitemap submitted.
- BRIK plan metrics section can be updated from "Not measured" to observed baseline values.

## 6) Immediate follow-up once done

1. Run first weekly KPI capture and create BRIK weekly K/P/C/S decision doc.
2. Recalibrate BRIK forecast and prioritization using first observed GA4 + Search Console data.
