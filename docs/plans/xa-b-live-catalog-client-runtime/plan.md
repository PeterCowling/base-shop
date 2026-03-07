---
Type: Plan
Status: Complete
Domain: UI
Workstream: Engineering
Created: 2026-03-07
Last-reviewed: 2026-03-07
Last-updated: 2026-03-07 (implementation complete)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-b-live-catalog-client-runtime
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# xa-b Live Catalog Client Runtime Plan

## Summary
This plan removes the need to rebuild `xa-b` for ordinary catalog publishes by shifting storefront catalog consumption from build-time JSON to client-fetched published catalog data. The site remains a static export on Cloudflare Pages free tier. The chosen approach is deliberately minimal: expose a public published catalog read route in `xa-drop-worker`, reuse the same normalization path in `xa-b`, update fixed taxonomy/search/home flows to use live data client-side, and move truly data-driven entities to stable query-shell routes.

## Active tasks
- [x] TASK-01: Add a public `xa-b` catalog read route in `xa-drop-worker`
- [x] TASK-02: Extract shared catalog normalization and live snapshot loading in `xa-b`
- [x] TASK-03: Switch fixed catalog surfaces to live client catalog data
- [x] TASK-04: Add stable query-shell entity pages and update links

## Goals
- New products appear on xa-b without a Pages rebuild.
- Keep Pages static export and free-tier deployment model.
- Keep bundled catalog as fallback, not primary source.
- Keep core shopping flows working with live products: home, search, fixed taxonomies, product detail, designer view, collection view.

## Non-goals
- SSR/ISR migration
- SEO improvements
- Removal of all legacy build-generated routes in one pass
- Changes to uploader publish semantics

## Constraints & Assumptions
- Constraints:
  - Stay on Cloudflare free tier.
  - Browser reads cannot require secrets.
  - Existing static shell should remain functional if live fetch fails.
- Assumptions:
  - Public published `xa-b` catalog exposure is acceptable.
  - Query-shell URLs are acceptable while SEO is irrelevant.

## Inherited Outcome Contract
- **Why:** New catalog publishes should show up on xa-b immediately without waiting for or troubleshooting a Pages rebuild.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** xa-b fetches the live published catalog client-side, and newly uploaded products become browseable through listing/search/product/designer/collection flows without rebuilding the site.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/xa-b-live-catalog-client-runtime/fact-find.md`
- Key findings used:
  - `xa-b` is build-coupled today through `build-xa.mjs` + `demoData.ts`.
  - Fixed taxonomy routes can stay static; only their product data must move client-side.
  - Product/designer/collection entity routes need stable non-build-generated shells to avoid 404s on new handles.
  - A public read seam in `xa-drop-worker` is the smallest infrastructure change.

## Proposed Approach
- Option A: Migrate xa-b to Next runtime on Workers.
- Option B: Keep static export and use client-fetched live catalog data from the published contract.
- Chosen approach: Option B. It matches the zero-SEO constraint and avoids an unnecessary full runtime migration.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add public read route and tests in `xa-drop-worker` | 90% | S | Complete (2026-03-07) | - | TASK-02, TASK-03, TASK-04 |
| TASK-02 | IMPLEMENT | Extract shared catalog parser and live snapshot hook in `xa-b` | 87% | M | Complete (2026-03-07) | TASK-01 | TASK-03, TASK-04 |
| TASK-03 | IMPLEMENT | Switch home/search/fixed taxonomy/designer index/collection index to live data | 84% | M | Complete (2026-03-07) | TASK-02 | TASK-04 |
| TASK-04 | IMPLEMENT | Add `/product`, `/designer`, `/collection` query-shell routes and update links | 83% | M | Complete (2026-03-07) | TASK-02, TASK-03 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Public read seam first |
| 2 | TASK-02 | TASK-01 | Shared parser/hook enables all xa-b runtime reads |
| 3 | TASK-03, TASK-04 | TASK-02 | Surface conversion and stable route migration can land together once live snapshot exists |

## Tasks

### TASK-01: Add a public `xa-b` catalog read route in `xa-drop-worker`
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-03-07)
- **Build evidence:** Added `GET /catalog-public/xa-b` with explicit storefront allowlist, preserved authenticated reads, and added unit coverage for public-read success and non-public-storefront rejection.
- **Affects:** `apps/xa-drop-worker/src/index.ts`, `apps/xa-drop-worker/__tests__/xaDropWorker.test.ts`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03, TASK-04
- **Confidence:** 90%
- **Acceptance:**
  - `GET /catalog-public/xa-b` returns the latest published catalog without auth.
  - Non-public storefronts are not exposed by this path.
  - Public response includes permissive read CORS.
  - Existing authenticated `/catalog/:storefront` flow remains unchanged.

### TASK-02: Extract shared catalog normalization and live snapshot loading in `xa-b`
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-03-07)
- **Build evidence:** Added `xaCatalogModel.ts`, `liveCatalog.ts`, and `xaRoutes.ts`; `demoData.ts` now reuses the shared parser and `next.config.mjs` derives a public catalog URL for browser consumers.
- **Affects:** `apps/xa-b/next.config.mjs`, `apps/xa-b/src/lib/demoData.ts`, `apps/xa-b/src/lib/xaCatalogModel.ts`, `apps/xa-b/src/lib/liveCatalog.ts`, `apps/xa-b/src/lib/xaRoutes.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-03, TASK-04
- **Confidence:** 87%
- **Acceptance:**
  - Bundled and fetched catalog payloads share one normalization path.
  - `xa-b` can resolve a public catalog URL without a new manual secret in the browser.
  - Client consumers have a cached live catalog hook with bundled fallback.

### TASK-03: Switch fixed catalog surfaces to live client catalog data
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-03-07)
- **Build evidence:** Home, designer index, collection index, fixed taxonomy components, megamenu, buy box variants, and search now source from the live catalog snapshot with bundled fallback.
- **Affects:** `apps/xa-b/src/app/page.tsx`, `apps/xa-b/src/components/XaHomeCatalogSections.client.tsx`, `apps/xa-b/src/components/XaDepartmentLanding.tsx`, `apps/xa-b/src/components/XaDepartmentListing.tsx`, `apps/xa-b/src/app/designers/page.tsx`, `apps/xa-b/src/app/collections/page.tsx`, `apps/xa-b/src/lib/search/xaSearchService.ts`, `apps/xa-b/src/lib/xaCatalog.ts`
- **Depends on:** TASK-02
- **Blocks:** TASK-04
- **Confidence:** 84%
- **Acceptance:**
  - Home/search/fixed taxonomy/designer index/collection index surfaces read live catalog data client-side.
  - If the live fetch fails, bundled data still renders.

### TASK-04: Add stable query-shell entity pages and update links
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-03-07)
- **Build evidence:** Added `/product`, `/designer`, and `/collection` runtime shell pages; updated product/designer/collection links; existing build-generated dynamic pages remain as legacy fallbacks.
- **Affects:** `apps/xa-b/src/app/product/page.tsx`, `apps/xa-b/src/app/designer/page.tsx`, `apps/xa-b/src/app/collection/page.tsx`, `apps/xa-b/src/components/XaProductDetail.tsx`, `apps/xa-b/src/app/products/[handle]/page.tsx`, `apps/xa-b/src/app/designer/[slug]/DesignerPageClient.tsx`, `apps/xa-b/src/components/XaProductCard.tsx`, `apps/xa-b/src/components/XaBuyBox.client.tsx`, `apps/xa-b/src/components/XaMegaMenu.tsx`, `apps/xa-b/src/app/cart/page.tsx`
- **Depends on:** TASK-02, TASK-03
- **Blocks:** -
- **Confidence:** 83%
- **Acceptance:**
  - Product/designer/collection links route through stable query-shell pages that do not require build-generated params.
  - New uploaded handles become reachable without rebuild.
  - Legacy build-generated pages continue to work as fallback where already deployed.

## Risks & Mitigations
- Public catalog exposure risk: scope to `xa-b` only and published data only.
- Runtime fetch failure risk: bundled fallback remains in place.
- Partial migration risk: centralize href generation and update all known callers in one pass.

## Observability
- Logging: none added locally; client path degrades silently to bundled data.
- Metrics: none in this task.
- Alerts/Dashboards: none.

## Acceptance Criteria (overall)
- [x] `xa-b` no longer depends on rebuilds for ordinary catalog freshness.
- [x] New products become browseable through at least one stable PDP route without rebuild.
- [x] Fixed taxonomy/search/home surfaces render live catalog data after publish.
- [x] Targeted typecheck and lint pass for changed packages.

## Decision Log
- 2026-03-07: Chose client-fetched live catalog on static Pages over SSR/runtime migration because SEO is explicitly irrelevant and free-tier simplicity is the priority.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Overall-confidence = sum(task confidence * effort weight) / sum(effort weight)
