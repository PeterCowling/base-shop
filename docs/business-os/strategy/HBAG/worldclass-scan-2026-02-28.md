---
schema_version: worldclass-scan.v1
business: HBAG
goal_version: 2
scan_date: 2026-02-28
status: active
---

# World-Class Gap Scan — HBAG (2026-02-28)

## Data Sources Probed

| Data Source | Status | Notes |
|---|---|---|
| Repo | configured | — |
| Stripe | not-configured | Payment provider is Axerve (not Stripe); MCP shop_list failed (package error). No Stripe integration in apps/caryina/ source. |
| GA4 | not-configured | analytics.provider: "console" in data/shops/caryina/settings.json; no GA4 measurement ID found anywhere in repo or app source |
| Firebase | not-configured | No HBAG Firebase config; .firebaserc at repo root is for BRIK project |
| Octorate | not-configured | No Octorate references in apps/caryina/ source |

## Gap Comparison Table

| Domain | domain_id | Gap | Current State | Threshold | Gap Classification | Evidence Source | Notes |
|---|---|---|---|---|---|---|---|
| Launch Readiness | launch-readiness | No SCA/3DS-capable checkout flow | Custom CardForm collects raw card details (number, expiry, CVV); `requireStrongCustomerAuth: false`; Axerve `callPayment` is a direct charge with no 3D Secure redirect/challenge flow | One live-like test order (including at least one failed transaction), SCA-capable card flow verified, webhook-confirmed payment handling in place, and refunds + fulfilment notifications tested end-to-end | major-gap | apps/caryina/src/app/[lang]/checkout/CheckoutClient.client.tsx, data/shops/caryina/settings.json | Italy is EEA; PSD2 SCA applies to most card transactions. Axerve supports 3DS but the current `callPayment` flow does not trigger it. This is a regulatory gap, not just a UX gap. |
| Launch Readiness | launch-readiness | No customer order confirmation email | On successful payment, only a merchant notification email is sent (fire-and-forget to MERCHANT_NOTIFY_EMAIL). No customer confirmation email is sent with order summary, transaction ID, or next-steps guidance. | Refunds + fulfilment notifications tested end-to-end so a real customer order cannot "disappear" operationally | major-gap | apps/caryina/src/app/api/checkout-session/route.ts | Success page shows generic "Order confirmed — support can help with any follow-up" copy; no order reference displayed. Buyer has no record of their purchase. |
| Launch Readiness | launch-readiness | No test order workflow or sandbox mode | Route reads `AXERVE_SHOP_LOGIN` and `AXERVE_API_KEY` from env vars with no sandbox/test-mode logic. No pre-launch checklist, no test card documented, no failed-transaction test script exists anywhere in the app or strategy docs. | One live-like test order (including at least one failed transaction) required before launch | major-gap | apps/caryina/src/app/api/checkout-session/route.ts | Axerve provides a sandbox environment but the app has no test-mode detection or documented test credential setup. |
| Launch Readiness | launch-readiness | No refund workflow | No `/api/refund` endpoint exists. No admin UI for processing refunds. No documentation of how a refund is executed if a customer requests one. | Refunds (full and partial) tested end-to-end before launch | major-gap | apps/caryina/src/app/api/ (directory enumerated — no refund route present) | Logistics policy (`logistics-pack.user.md`) states "30-day free exchange" but no mechanism exists to execute it operationally via the payment provider. |
| First Visitor Conversion | first-visitor-conversion | No social proof (reviews, ratings, or UGC) | No review system, no star ratings, no testimonials, no UGC module on any PDP. The proof section shows 5 product bullets (materials, design, provenance, finishes, exchange policy) but no third-party validation. | Mobile-first product pages with strong visuals plus scannable specs, clearly linked shipping/returns/warranty near the buy decision, and a low-friction checkout that avoids common usability pitfalls | major-gap | apps/caryina/src/app/[lang]/product/[slug]/page.tsx | For an unknown brand at €80–€150, absence of any third-party validation is a significant trust gap. The benchmark explicitly flags social proof as a key indicator and names warranty/proof-of-quality substitutes as a compensatory mechanism — those are partially present (90-day hardware guarantee in proof bullets) but not prominent. |
| First Visitor Conversion | first-visitor-conversion | Material specs absent from all SKUs | `product.materials`, `product.dimensions`, `product.weight` fields are not present in any of the 3 SKUs in products.json. The PDP spec-sheet section (materials/dimensions/weight/origin) conditionally renders only when all three fields are populated — it currently never renders. Supplier confirmation pending (`supplier-spec-confirmed.user.md`). | Scannable spec-sheet detail (materials, dimensions, weight/feel equivalents) per benchmark Key Indicator 2; explicitly required to avoid the "under-specified premium" failure | major-gap | data/shops/caryina/products.json, apps/caryina/src/app/[lang]/product/[slug]/page.tsx | Spec section is conditionally gated at lines 148–182 of page.tsx. Operator action required: fill in and return `supplier-spec-confirmed.user.md` with confirmed material, dimension, and weight values before the lp-do-build agent can populate the product data. |
| First Visitor Conversion | first-visitor-conversion | No gifting cues on PDP | No gift-packaging description, no gift message option, no "gift-ready" framing visible on the PDP or in site-content.generated.json. The logistics policy offers 30-day free exchange which is relevant to gift recipients but this is not surfaced as a gifting benefit. | Gifting cues explicit (gift-ready packaging, gift receipt/message options) per benchmark Key Indicator 5 | minor-gap | apps/caryina/src/app/[lang]/product/[slug]/page.tsx, data/shops/caryina/site-content.generated.json | The benchmark identifies gifting as important at €80–€150 accessories. Existing trust strip and exchange policy partially compensate, but no explicit gift-oriented copy or UI element exists. |
| Launch Measurement | launch-measurement | No GA4 ecommerce events — wrong event names and no item arrays | Analytics provider is "console" (settings.json). Even if switched to "ga", the event types used ("product_view", "checkout_started", "order_completed") are not GA4 recommended names ("view_item", "begin_checkout", "purchase") and none include item arrays (item_id, item_name, price, quantity, currency). Product-level revenue is not trackable. | GA4 ecommerce tracking implemented with recommended events and correct purchase/item parameters | major-gap | data/shops/caryina/settings.json, packages/platform-core/src/analytics/index.ts, apps/caryina/src/app/[lang]/product/[slug]/ProductAnalytics.client.tsx | GoogleAnalyticsProvider exists in platform-core and can be enabled by setting analytics.provider: "ga" + analytics.id in settings.json plus GA_API_SECRET env var. But event names and params must also be updated to match GA4 ecommerce spec before the data is useful. |
| Launch Measurement | launch-measurement | No UTM parameter capture | None of the analytics components (ShopAnalytics, ProductAnalytics, CheckoutAnalytics, SuccessAnalytics) read or forward UTM parameters from URL search params. TikTok/Instagram source attribution is impossible without utm_source/utm_medium/utm_campaign capture on landing. | Consistent UTM tagging across all TikTok/Instagram links so the first €1,000 can be attributed to specific products and channels | major-gap | apps/caryina/src/app/[lang]/shop/ShopAnalytics.client.tsx, apps/caryina/src/app/[lang]/product/[slug]/ProductAnalytics.client.tsx | UTMs need to be both: (1) used on every outbound social link (operator action), and (2) captured and forwarded in analytics events (code change). Currently neither is in place. |
| Launch Measurement | launch-measurement | No cookie consent mechanism — analytics never fires for new visitors | The analytics client requires `consent.analytics=true` cookie. No cookie consent banner exists in the layout. For EU/GDPR visitors (the primary audience), analytics events will be silently skipped for all visitors who have not somehow set this cookie. | Measurement is operationally debuggable: operator can validate events in real time (test purchase, confirm receipt in GA4 / platform diagnostics) | major-gap | apps/caryina/src/app/[lang]/layout.tsx, packages/platform-core/src/analytics/client.ts | Without a consent banner that sets `consent.analytics=true`, zero analytics data will be collected from real visitors. This blocks all measurement goals. |

## Scan Summary

- World-class domains: 0
- Major gaps: 9
- Minor gaps: 1
- No-data gaps: 0
- Total gap rows emitted: 10

## Ideas Summary

- Total gap rows found: 10
- Ideas presented to operator: 10 (0 already queued)
- Selected by operator: 5
  - P1 (major-gap, conversion-critical): 0
  - P2 (major-gap other + no-data): 4
  - P3 (minor-gap): 1
- Skipped (not selected): 5
  - Idea 1: HBAG Launch Readiness — no SCA/3DS-capable checkout flow (operator decision)
  - Idea 5: HBAG First Visitor Conversion — no social proof reviews or UGC on PDP (operator decision)
  - Idea 6: HBAG First Visitor Conversion — material specs absent from all SKUs (active plan in progress)
  - Idea 7: HBAG Launch Measurement — no GA4 ecommerce events (operator decision)
  - Idea 8: HBAG Launch Measurement — no UTM parameter capture (operator decision)
- Passed to lp-do-ideas: 5
  - IDEA-DISPATCH-20260228-0073: no customer order confirmation email (SELL / lp-do-fact-find)
  - IDEA-DISPATCH-20260228-0074: no test order workflow or Axerve sandbox mode (SELL / lp-do-fact-find)
  - IDEA-DISPATCH-20260228-0075: no refund workflow or admin refund tooling (SELL / lp-do-fact-find)
  - IDEA-DISPATCH-20260228-0076: no cookie consent banner, analytics blocked (SELL / lp-do-fact-find)
  - IDEA-DISPATCH-20260228-0077: no gifting cues on PDP (SELL / lp-do-briefing — enqueued, awaiting confirmation)
