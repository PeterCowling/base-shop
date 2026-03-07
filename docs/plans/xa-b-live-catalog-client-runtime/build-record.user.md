---
Type: Build-Record
Status: Complete
Domain: UI
Workstream: Engineering
Created: 2026-03-07
Last-updated: 2026-03-07
Feature-Slug: xa-b-live-catalog-client-runtime
Relates-to charter: docs/business-os/business-os-charter.md
---

# xa-b Live Catalog Client Runtime Build Record

## Outcome Contract
- **Why:** New catalog publishes should show up on xa-b immediately without waiting for or troubleshooting a Pages rebuild.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** xa-b fetches the live published catalog client-side, and newly uploaded products become browseable through listing/search/product/designer/collection flows without rebuilding the site.
- **Source:** operator

## Completed Work
- Added a public published-catalog read route for `xa-b` in `xa-drop-worker`.
- Added shared catalog normalization and a cached live catalog hook in `xa-b`.
- Moved home, search, fixed taxonomy listings, designer index, collection index, megamenu, and variant strips to read live catalog data client-side with bundled fallback.
- Added stable runtime shell routes:
  - `/product?handle=...`
  - `/designer?handle=...`
  - `/collection?handle=...`
- Updated xa-uploader publish flow to stop triggering xa-b rebuilds on Make Live and to report that xa-b now reads the live catalog directly.

## Validation
- `pnpm --filter @apps/xa-b typecheck` passed
- `pnpm --filter @apps/xa-b lint` passed
- `pnpm --filter @apps/xa-drop-worker typecheck` passed
- `pnpm --filter @apps/xa-drop-worker lint` passed
- `pnpm --filter @apps/xa-uploader typecheck` passed
- `pnpm --filter @apps/xa-uploader lint` passed

## Remaining Notes
- Legacy build-generated routes such as `/products/[handle]`, `/designer/[slug]`, and `/collections/[handle]` still exist for already-built pages, but new internal links now target the stable runtime shell routes.
- I did not run Jest locally because repo policy says tests run in CI only.
- Commit/deploy handling is performed separately from this build record because the repo has a very large number of unrelated in-progress changes outside this workstream and the commit must stay task-scoped.
