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

**Overall: Baseline — first snapshot pending**

This artifact was created on 2026-03-12. Populate by running SEO audits, i18n parity checks, and product validation.

## SEO Health

<!-- Update weekly. Source: MCP seo_get_latest tool for HBAG shop -->

| Metric | Value | Target | Notes |
|---|---|---|---|
| SEO audit score | — | ≥80 | Latest audit score |
| Critical issues | — | 0 | Blocking indexation |
| Warning issues | — | <5 | Degrading ranking |
| Structured data (Product) | Present | Present | JSON-LD on product pages |
| Structured data (FAQ) | Present | Present | JSON-LD on home page |
| Structured data (Breadcrumb) | Present | Present | JSON-LD on product pages |
| Open Graph tags | Missing | Present | Not implemented yet |
| Canonical URLs | Implicit | Explicit | Using Next.js defaults |

## Translation Coverage

<!-- Update weekly. Source: site-content.generated.json + i18n parity audit -->

| Locale | Content keys translated | Products translated | FAQs translated | Policies translated |
|---|---|---|---|---|
| EN (base) | 100% | 100% | 100% | 100% |
| DE | — | 100% | — | — |
| IT | — | 100% | — | — |

**Active locales:** EN, DE, IT (from `data/shops/caryina/settings.json`)

## Price & Inventory Health

<!-- Update weekly. Source: products.json + inventory.json validation -->

| Metric | Value | Target | Notes |
|---|---|---|---|
| Products with valid price | — | 100% | Price stored in minor units (cents) |
| Price currency | EUR | EUR | Single currency |
| Products in stock | — | — | From inventory.json |
| Products with all media slots | — | 100% | 6 required, 1 optional per SKU |
| Price display format correct | — | All locales | de-DE, it-IT, en-IE formatting |

## Checkout Flow Health

<!-- Update weekly. Source: checkoutReconciliation.server.ts -->

| Metric | Value | Target | Notes |
|---|---|---|---|
| Stale checkout attempts | — | 0 | Unreconciled payment attempts |
| Payment success rate | — | ≥95% | Completed / attempted |
| Cart-to-checkout conversion | — | — | Requires GA4 measurement |

## Error Handling

<!-- Update monthly. Source: manual review -->

| Page type | Error handling | Status |
|---|---|---|
| 404 (not found) | Custom error page | Needs improvement (dispatch: ugly default error page) |
| Product not found | notFound() handler | Working |
| Runtime errors | error.tsx boundary | Logs to console only (no aggregation) |

## Recent Issues

- 2026-03-12: Artifact created. Known issues from queue: ugly 404 page, EN-only nav/legal text for DE/IT visitors, (en) in page titles.

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
