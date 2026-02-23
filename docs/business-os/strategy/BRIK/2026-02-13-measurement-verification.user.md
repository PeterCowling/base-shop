---
Type: Measurement-Verification
Status: Active
Business: BRIK
Date: 2026-02-13
Owner: Pete
Relates-to: docs/business-os/strategy/BRIK/2026-02-12-ga4-search-console-setup-note.user.md
Review-trigger: After each completed build cycle touching this document.
---

# BRIK Production Measurement Verification (2026-02-13)

## 1) Objective

Verify that GA4 + Search Console production setup is live for `hostel-positano.com` and that telemetry capture has started.

## 2) Verification Results

| Check | Result | Evidence |
|---|---|---|
| GA4 script present on production homepage | Pass | `https://hostel-positano.com/en/` contains `gtag/js?id=G-2ZSYXG8R7T` and `gtag('config', 'G-2ZSYXG8R7T')` |
| GA collect endpoint receives production hits | Pass | Headless browser capture observed `https://region1.google-analytics.com/g/collect` with `tid=G-2ZSYXG8R7T` and events `page_view`, `user_engagement` |
| `web_vitals` events reach GA collect endpoint | Pass (collect-level) | 2026-02-14: Playwright capture on Pages deploy `https://6aa817b6.brikette-website.pages.dev/en/` observed `en=web_vitals` (2 hits) |
| `robots.txt` advertises sitemap index | Pass | `https://hostel-positano.com/robots.txt` includes `Sitemap: https://hostel-positano.com/sitemap_index.xml` |
| Sitemap index is reachable | Pass | `https://hostel-positano.com/sitemap_index.xml` returns valid XML with `https://hostel-positano.com/sitemap.xml` |
| Search Console DNS verification tokens exist | Pass | DNS TXT for `hostel-positano.com` / `www.hostel-positano.com` includes `google-site-verification=...` records |
| Booking-flow `begin_checkout` payload tests (repo) | Pass | `apps/brikette/src/test/components/ga4-08-book-checkout-payload.test.tsx` and `apps/brikette/src/test/components/ga4-07-apartment-checkout.test.tsx` |

## 3) Open Verification Items

1. Resolve why `begin_checkout` and `web_vitals` are zero in the current 7-day GA4 window.
2. Confirm `web_vitals` is visible in GA4 UI (Realtime/DebugView) and becomes non-zero in the rolling 7-day Data API extract.
3. Continue weekly baseline refresh with date-bounded extracts.

## 4) Instrumentation Hardening Completed in Repo

To reduce event-loss risk when confirm-link API calls fail, the shared booking flow now emits `begin_checkout` on CTA intent before network resolution:

- Code: `apps/brikette/src/app/[lang]/book/BookPageContent.tsx`
- Tests:
  - `apps/brikette/src/test/components/ga4-08-book-checkout-payload.test.tsx`
  - `apps/brikette/src/test/components/ga4-07-apartment-checkout.test.tsx`

## 5) Command Evidence (Executed 2026-02-13)

```bash
curl -sL https://hostel-positano.com/en/
curl -sL https://hostel-positano.com/robots.txt
curl -sL https://hostel-positano.com/sitemap_index.xml
dig +short TXT hostel-positano.com
dig +short TXT www.hostel-positano.com
pnpm --filter brikette test -- apps/brikette/src/test/components/ga4-08-book-checkout-payload.test.tsx --maxWorkers=2
pnpm --filter brikette test -- apps/brikette/src/test/components/ga4-07-apartment-checkout.test.tsx --maxWorkers=2
```

## 6) Data API Status (Resolved: 2026-02-13)

GA4 Data API is now enabled and queryable for project `brikette-web` (`98263641014`).

Latest extract (`runReport`, window `7daysAgo..today`, executed 2026-02-13):

- sessions: **73**
- users: **53**
- conversions: **0**
- eventCount: **563**
- page_view: **258**
- user_engagement: **145**
- begin_checkout: **0**
- web_vitals: **0**

Interpretation:

- Baseline extraction is now unblocked and first measured window is captured.
- Conversion/performance instrumentation quality is still not decision-grade because both target events remain zero.

## 7) Production Click-Path Probe (Re-run After Deploy, 2026-02-13)

Production booking flow was rebuilt/exported and deployed to Cloudflare Pages `main`:

```bash
pnpm exec turbo run build --filter=@apps/brikette^...
cd apps/brikette
OUTPUT_EXPORT=1 NEXT_PUBLIC_OUTPUT_EXPORT=1 NEXT_PUBLIC_GA_MEASUREMENT_ID=G-2ZSYXG8R7T pnpm exec next build
pnpm --filter @apps/brikette generate:static-aliases
pnpm exec wrangler pages deploy out --project-name brikette-website --branch main
```

Deployment result:
- Upload/deploy completed successfully with deployment URL `https://231eabad.brikette-website.pages.dev`.
- Production and deployment now serve the same book chunk:
  - `/_next/static/chunks/app/%5Blang%5D/book/page-83b1318a0a463a3b.js`

Bundle behavior check:
- The deployed chunk now calls the checkout event function before `confirm-link` fetch in `handleConfirmClick`.
- The GA emit guard is now `typeof gtag === "function"` (no `confirmUrl` requirement).

Live click-path probe (Playwright):
- Stubbed `/api/octorate/confirm-link` to return `{"status":"unavailable"}` to force fallback path.
- Clicked `Flexible – Go to checkout` on `https://www.hostel-positano.com/en/book`.
- Captured GA collect request:
  - `https://region1.google-analytics.com/g/collect?...&en=begin_checkout&...`
- Probe counters:
  - `confirmCallCount: 1`
  - `beginCheckoutCount: 1`

Implication:
- Production deployment alignment for unconditional CTA-intent `begin_checkout` is complete.
- Remaining measurement gap is report-layer freshness/non-zero confirmation in the rolling 7-day GA4 extract and `web_vitals` event verification.

## 8) Routed Execution Packet

Active routing artifacts for this P1 item:

- Fact-find: `docs/plans/brik-ga4-baseline-lock/fact-find.md`
- Plan: `docs/plans/brik-ga4-baseline-lock/plan.md`

Owner checkpoint:

- Re-run GA4 7-day extract after deployment propagation to confirm non-zero `begin_checkout` in report output and verify `web_vitals` status.
- Continue weekly baseline refresh in `docs/business-os/strategy/BRIK/plan.user.md` and mirror status into weekly decision + workflow docs.
