---
Type: Card
Lane: Planned
Priority: P1
Owner: Pete
ID: PIPE-ENG-0001
Title: 'Centralized catalog, stock inflows, and media uploads'
Business: PIPE
Tags:
  - plan-migration
  - commerce
Created: 2025-12-29T00:00:00.000Z
Updated: 2025-12-29T00:00:00.000Z
---
# Centralized catalog, stock inflows, and media uploads

**Source:** Migrated from `catalog-stock-media-upload-facility-plan.md`


<!-- docs/plans/catalog-stock-media-upload-facility-plan.md -->

Related docs:
- docs/commerce-charter.md
- docs/cms/catalog-inventory-media-ops.md
- docs/permissions.md

Primary code entrypoints:
- packages/platform-core/src/repositories/products.server.ts
- packages/platform-core/src/repositories/inventory.server.ts
- packages/platform-core/src/repositories/media.server.ts
- packages/platform-core/src/repositories/productImport.server.ts
- packages/platform-core/src/repositories/stockInflows.server.ts
- packages/platform-core/src/repositories/catalogSkus.server.ts
- apps/cms/src/app/cms/shop/[shop]/products/**
- apps/cms/src/app/cms/shop/[shop]/uploads/**
- apps/cms/src/app/cms/shop/[shop]/media/**
- apps/cms/src/app/cms/shop/[shop]/data/inventory/**
- apps/cover-me-pretty/src/app/uploads/[shop]/[filename]/route.ts

[... see full plan in docs/plans/catalog-stock-media-upload-facility-plan.md]
