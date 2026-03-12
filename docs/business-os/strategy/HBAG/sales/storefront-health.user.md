---
Type: Standing-Intelligence
Status: Active
Domain: SELL
Business: HBAG
Artifact-ID: HBAG-SELL-STOREFRONT-HEALTH
Created: 2026-03-12
Last-updated: 2026-03-12
---

# HBAG Storefront Health (Caryina)

Standing intelligence artifact tracking the health of the Caryina e-commerce storefront. Changes signal SEO degradation, translation gaps, pricing errors, or checkout issues that need investigation.

## Current Health Status

**Overall: Needs attention — 0% DE/IT site content translated, only 3 products, no SEO audit on file**

First snapshot: 2026-03-12. Data from `data/shops/caryina/` files and `site-content.generated.json`.

## SEO Health

<!-- Update weekly. Source: MCP seo_get_latest tool for HBAG shop -->

| Metric | Value | Target | Notes |
|---|---|---|---|
| SEO audit score | No audit on file | ≥80 | MCP tool `seo_get_latest` returned import error — needs `server-only` package |
| Critical issues | Unknown | 0 | No audit data |
| Warning issues | Unknown | <5 | No audit data |
| Structured data (Product) | Present | Present | JSON-LD on product pages (schema.org/Product + Breadcrumb) |
| Structured data (FAQ) | Present | Present | FAQPage JSON-LD on home page |
| Structured data (Organization) | Present | Present | JSON-LD on home page |
| Open Graph tags | **Missing** | Present | Not implemented — social sharing broken |
| Canonical URLs | Implicit | Explicit | Using Next.js defaults only |

## Translation Coverage

<!-- Update weekly. Source: site-content.generated.json analysis -->

| Locale | Site content keys | Products (title+desc) | Overall |
|---|---|---|---|
| EN (base) | 83/83 (100%) | 3/3 (100%) | **100%** |
| DE | **0/83 (0%)** | 3/3 (100%) | **3.5%** |
| IT | **0/83 (0%)** | 3/3 (100%) | **3.5%** |

**Active locales:** EN, DE, IT (from settings.json)

**Critical finding:** Product titles and descriptions are translated into all 3 locales, but **zero** site content (navigation, FAQs, policies, trust copy, home page text) is translated into DE or IT. German and Italian visitors see English everywhere except product names.

## Price & Inventory Health

<!-- Update weekly. Source: products.json + inventory.json -->

| Metric | Value | Target | Notes |
|---|---|---|---|
| Total products | 3 | — | Mini Facade Bag Charm in Silver, Rose Splash, Peach |
| Products with valid price | 3/3 (100%) | 100% | All EUR 29.00 (2900 minor units) |
| Price currency | EUR | EUR | Single currency |
| Products in stock | 3/3 (100%) | — | All 3 items available |
| Products with images | **0/3 (0%)** | 100% | **No product images in products.json** |
| Price display format | de-DE, it-IT, en-IE | All locales | `formatMoney()` handles locale formatting |

**Critical finding:** No product images are stored in `products.json`. Product pages may show placeholder or broken images.

## Checkout Flow Health

<!-- Update weekly. Source: checkoutReconciliation.server.ts -->

| Metric | Value | Target | Notes |
|---|---|---|---|
| Stale checkout attempts | — | 0 | Requires runtime query |
| Payment success rate | — | ≥95% | Stripe + Axerve integration exists |
| Cart-to-checkout conversion | — | — | No GA4 measurement set up |

## Error Handling

<!-- Update monthly. Source: manual review -->

| Page type | Error handling | Status |
|---|---|---|
| 404 (not found) | Default Next.js error | **Needs custom page** (ugly default) |
| Product not found | notFound() handler | Working |
| Runtime errors | error.tsx boundary | Logs to console only (no Sentry/aggregation) |

## Recent Issues

- 2026-03-12: First snapshot. **0% site content translated** for DE/IT — only product data has translations.
- 2026-03-12: **0 product images** in products.json — visual product display broken or placeholder.
- 2026-03-12: No SEO audit on file — MCP tool blocked by missing `server-only` package.
- 2026-03-12: No Open Graph tags — social media sharing shows no preview.

## Data Sources

| Source | Location | Access |
|---|---|---|
| SEO audits | MCP tools `seo_get_latest`, `seo_list_audits` | On-demand |
| Product catalog | `data/shops/caryina/products.json` | File read |
| Inventory | `data/shops/caryina/inventory.json` | File read |
| Site content | `data/shops/caryina/site-content.generated.json` | File read |
| Shop settings | `data/shops/caryina/settings.json` | File read |
| Checkout reconciliation | `apps/caryina/src/lib/checkoutReconciliation.server.ts` | Server function |
| Shop health | MCP tool `shop_health` | On-demand |
