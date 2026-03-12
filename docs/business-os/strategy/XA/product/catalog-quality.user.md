---
Type: Standing-Intelligence
Status: Active
Domain: PRODUCTS
Business: XA
Artifact-ID: XA-PRODUCTS-CATALOG-QUALITY
Created: 2026-03-12
Last-updated: 2026-03-12
---

# XA Product Catalog Quality

Standing intelligence artifact tracking the quality of the XA luxury fashion product catalog. Changes signal catalog completeness issues, upload failures, or sync problems that need investigation.

## Current Health Status

**Overall: Early stage — 1 live product, catalog nearly empty, media index at zero**

First snapshot: 2026-03-12. Data from `apps/xa-b/src/data/catalog.runtime.json`, `catalog.media.json`, and `catalog.runtime.meta.json`.

## Catalog Completeness

<!-- Update weekly. Source: catalog.runtime.json + catalog.media.json -->

| Metric | Value | Target | Notes |
|---|---|---|---|
| Total products (live) | **1** | — | Hermès Birkin 25 Noir Togo |
| Total products (draft) | 0 | — | No drafts in catalog seed |
| Total products (out of stock) | 0 | — | |
| Products with images | 1/1 (100%) | 100% | 1 media item on the live product |
| Avg images per product | **1.0** | ≥3 | **Below luxury brand quality threshold** |
| Media index products | **0** | — | Media index shows 0 products indexed |
| Media index warnings | 0 | 0 | No warnings (but index is empty) |

**Finding:** The media index (`catalog.media.json`) reports 0 products and 0 media — it appears disconnected from the runtime catalog which has 1 product with 1 media item.

## Schema Validation

<!-- Update weekly. Source: catalog.runtime.json fields present -->

| Required field | Product 1 | Notes |
|---|---|---|
| title | ✓ | "Hermès Birkin 25 Noir Togo" |
| description | ✓ | Present |
| brandHandle | ✓ (via brand) | Brand data present |
| department | ✓ | Via taxonomy |
| category | ✓ | Via taxonomy |
| subcategory | ✓ | Via taxonomy |
| color (≥1) | ✓ | Via taxonomy |
| material (≥1) | ✓ | Via taxonomy |
| price | ✓ | USD/EUR/GBP/AUD 400 (minor units) |
| sizes (if clothing) | ✓ | 1 size |

## Upload & Sync Health

<!-- Update weekly. Source: uploaderLogger events -->

| Metric | Value | Target | Notes |
|---|---|---|---|
| Image upload success rate | No data | ≥99% | No upload events in logs |
| Sync conflict rate | No data | <1% | No sync events |
| Cloud media missing (pruned) | No data | 0 | |
| Sync payload warnings | 0 | 0 | Per media index |

## Catalog Freshness

<!-- Update weekly. Source: catalog.runtime.meta.json -->

| Metric | Value | Target | Notes |
|---|---|---|---|
| Last sync timestamp | 2026-03-07 14:21 UTC | <48h ago | **5 days old — stale** |
| Catalog stale? | **Yes** | No | >48h since last sync |
| Catalog version | 1772890822165-5a393b00 | — | |
| Published at | 2026-03-07 13:40 UTC | — | |

**Finding:** Catalog has not been synced for 5 days. The 48-hour freshness threshold is exceeded.

## Multi-Currency Pricing

<!-- Update on price changes. Source: catalog.runtime.json -->

| Currency | Products priced | Price (Product 1) |
|---|---|---|
| USD | 1/1 | 400 |
| EUR | 1/1 | 400 |
| GBP | 1/1 | 400 |
| AUD | 1/1 | 400 |

**Note:** All 4 currencies show identical price (400 minor units = 4.00). This may be placeholder pricing — luxury handbags typically cost orders of magnitude more.

## Recent Issues

- 2026-03-12: First snapshot. Catalog has only **1 live product** — effectively a demo/staging state.
- 2026-03-12: Catalog **stale** (5 days since last sync, 48h threshold exceeded).
- 2026-03-12: Media index reports 0 products despite runtime catalog having 1 — possible index desync.
- 2026-03-12: Pricing appears to be placeholder (USD/EUR/GBP/AUD all 400 = 4.00).

## Data Sources

| Source | Location | Access |
|---|---|---|
| Product schema | `packages/lib/src/xa/catalogAdminSchema.ts` | Validation rules |
| Build artifact factory | `apps/xa-uploader/src/lib/catalogDraftToContract.ts` | Warning collection, media indexing |
| Media validation | `apps/xa-uploader/src/lib/catalogCloudPublish.ts` | R2 existence checks |
| Image upload API | `apps/xa-uploader/src/app/api/catalog/images/route.ts` | Upload/delete operations |
| Sync API | `apps/xa-uploader/src/app/api/catalog/sync/route.ts` | Batch validation |
| Catalog freshness | `apps/xa-b/src/lib/catalogRuntimeMeta.ts` | Age calculation |
| Runtime meta | `apps/xa-b/src/data/catalog.runtime.meta.json` | Sync timestamp |
| Logger | `apps/xa-uploader/src/lib/uploaderLogger.ts` | Structured events |
