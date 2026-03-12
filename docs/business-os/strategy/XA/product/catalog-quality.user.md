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

**Overall: Baseline — first snapshot pending**

This artifact was created on 2026-03-12. Populate by running catalog validation against the admin schema and checking R2 media state.

## Catalog Completeness

<!-- Update weekly. Source: catalogDraftToContract.ts mediaIndex.totals -->

| Metric | Value | Target | Notes |
|---|---|---|---|
| Total products (live) | — | — | publishState = "live" |
| Total products (draft) | — | — | publishState = "draft" |
| Total products (out of stock) | — | — | publishState = "out_of_stock" |
| Products with images | — | 100% | At least 1 image per product |
| Avg images per product | — | ≥3 | Quality threshold for luxury brand |
| Products with alt text | — | 100% | imageAltTexts matching imageFiles count |
| Media index warnings | — | 0 | From build artifact validation |

## Schema Validation

<!-- Update weekly. Source: catalogAdminSchema.ts validation -->

| Required field | Coverage | Notes |
|---|---|---|
| title | — | Required |
| description | — | Required |
| brandHandle | — | Required |
| department | — | Required |
| category | — | Required |
| subcategory | — | Required |
| color (≥1) | — | Required |
| material (≥1) | — | Required |
| price | — | Required |
| sizes (if clothing) | — | Required for category=clothing |

## Upload & Sync Health

<!-- Update weekly. Source: uploaderLogger events -->

| Metric | Value | Target | Notes |
|---|---|---|---|
| Image upload success rate | — | ≥99% | upload_success / upload_start |
| Sync conflict rate | — | <1% | fence_conflict events |
| Cloud media missing (pruned) | — | 0 | R2 keys not found during publish |
| Sync payload warnings | — | 0 | From catalogDraftToContract build |

## Catalog Freshness

<!-- Update weekly. Source: catalogRuntimeMeta.ts -->

| Metric | Value | Target | Notes |
|---|---|---|---|
| Last sync timestamp | — | <48h ago | From catalog.runtime.meta.json |
| Catalog stale? | — | No | isStale flag (>48h threshold) |
| Catalog version | — | — | Contract version ID |
| Published at | — | — | Last publish timestamp |

## Multi-Currency Pricing

<!-- Update on price changes. Source: products.json -->

| Currency | Products priced | Notes |
|---|---|---|
| USD | — | Primary |
| EUR | — | European market |
| GBP | — | UK market |
| AUD | — | Australian market |

## Recent Issues

- 2026-03-12: Artifact created. Known issues from queue: products going live without photos, no offline testing capability, unfiltered product lists, publish safety concerns.

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
