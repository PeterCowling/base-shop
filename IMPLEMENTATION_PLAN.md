“Base-Shop” — Implementation Plan
rev 2025-06-21 · Sprint 5 status update ①

Layer Tech & notes Δ
Framework Next.js 15 (App Router, React 19) –
Styling Tailwind CSS 4.1 –
i18n JSON bundles (en, de, it) via Context –
State React hooks · CartContext → localStorage –
Payments Stripe Elements v2025-05-28 ✔ – edge-ready client (stripeServer.ts) NEW
API Edge Routes: /api/cart (stub) · /api/checkout-session (client-secret) NEW
Tooling TS 5.8 · ESLint/Prettier · Jest/RTL · Playwright 1.53 · Wrangler –
Inventory persists through Prisma with JSON or SQLite fallbacks in data/shops/\*/inventory.json
Inventory items use flexible `variantAttributes` maps with optional `lowStockThreshold`.
Saving inventory triggers email alerts to `STOCK_ALERT_RECIPIENT` when quantity falls below threshold.
CMS API supports JSON or CSV import/export; CSV headers map variant attribute keys.
Rental pricing matrix at data/rental/pricing.json
Return logistics configured in data/return-logistics.json
RBAC: ShopAdmin scope = all shops

1 · Route & Component Map (💳 Checkout added)
URL Key components Status
/, /[lang] HeroBanner · ValueProps · ReviewsCarousel ✔
/[lang]/shop ShopClient → FilterBar · ProductGrid · ProductCard ✔
/[lang]/product/[slug] PdpClient → ImageGallery · SizeSelector ✔
/[lang]/checkout OrderSummary (RSC) · CheckoutForm (Stripe Elements) ✔ new
/api/cart POST/PATCH stub ✔
/api/checkout-session returns SetupIntent client-secret ✔ new

Component inventory Δ

components/checkout/CheckoutForm.tsx
Loads client-secret, mounts <Elements locale={…}>, TS-safe cast.

components/checkout/OrderSummary.tsx

lib/stripeServer.ts (Edge-friendly Stripe SDK, API v 2025-05-28)

app/[lang]/checkout/page.tsx (awaits params, reads cookie via cookies())

2 · Sprint Tracker
Sprint Key outputs Status
S-0 Bootstrap Scaffold, CI, configs ✅
S-1 Layout + i18n LocaleLayout · nav ✅
S-2 Home MVP Hero & core content ✅
S-3 Shop catalogue Product grid · cart add/persist ✅
S-4 PDP + Cart API PDP page, size selector, cart badge, /api/cart ✅
S-5 Checkout flow Stripe Elements form + /api/checkout-session 🟢 90 %
S-6 Blog pipeline MDX loader · ISR 1 h ⏳
S-7 SEO & a11y JSON-LD · alt audit · keyboard nav ⏳
S-8 Launch-hardening Playwright E2E · error pages · translation freeze ⏳

3 · Repo Layout (new/changed)
bash
Copy
Edit
src/
├─ app/[lang]/checkout/page.tsx
├─ app/api/checkout-session/route.ts (edge server action)
├─ components/checkout/
│ ├─ CheckoutForm.tsx // 'use client'
│ └─ OrderSummary.tsx // RSC
├─ lib/stripeServer.ts
└─ tests/checkout.test.tsx // (todo)
4 · Performance Guard-Rails
Checkout bundle + Stripe Elements JS ≈ 18 kB → still under 50 kB page budget.

LCP unaffected (Elements iframe lazy-loads after main content).

5 · Launch Checklist (delta)
Stripe publishable & secret keys set in Pages env.

API version locked to 2025-05-28 in Dashboard.

Add pay-success & pay-fail routes (to come in S-5 wrap-up).

🔜 Immediate Tasks to finish Sprint 5
Task Owner
/api/checkout-session – final logic: create PaymentIntent, include cart subtotal & metadata. dev
Integrate selected size into metadata & line-items. dev
Success / cancel pages with redirect after confirmPayment. dev
Jest: renders Elements once clientSecret resolved. dev
Lighthouse ≥ 90 on checkout (iframe excluded). dev
Merge branch feat/checkout → CI preview. dev

Once merged we move to Sprint 6 (Blog pipeline).
