---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-07
Last-updated: 2026-03-07
Feature-Slug: xa-b-live-catalog-client-runtime
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/xa-b-live-catalog-client-runtime/plan.md
Trigger-Why: New XA products should appear on xa-b without needing a site rebuild, while staying on Cloudflare free tier and avoiding a full SSR/runtime migration.
Trigger-Intended-Outcome: type: operational | statement: xa-b reads live catalog data client-side from Cloudflare so new products become browseable immediately without a Pages rebuild | source: operator
---

# xa-b Live Catalog Client Runtime Fact-Find Brief

## Scope
### Summary
`xa-b` is currently deployed as a static export to Cloudflare Pages, but it bakes catalog data into the build via `catalog.runtime.json`. That means new products, brands, and collections only appear after a rebuild/deploy. SEO is explicitly out of scope, so the smallest viable change is to keep the static shell and move catalog rendering to client-side reads of the published catalog.

### Goals
- Remove the operational requirement to rebuild `xa-b` for ordinary catalog publishes.
- Keep `xa-b` on Cloudflare free-tier infrastructure.
- Reuse the existing published catalog payload instead of adding a second source of truth.
- Preserve current fixed taxonomy routes (`/women`, `/women/bags`, `/search`, etc.) while serving fresh products client-side.
- Add stable client-routed shells for data-driven entities so new product/brand/collection handles remain reachable without new static paths.

### Non-goals
- SSR, ISR, or a Next-on-Workers migration.
- SEO improvements or crawler-friendly rendering.
- Replacing the catalog contract or uploader publish flow.
- Eliminating all legacy static dynamic routes in one pass.

### Constraints & Assumptions
- Constraints:
  - `xa-b` remains a static export on Cloudflare Pages free tier.
  - Product data must come from the already-published catalog contract, not a second data store.
  - Browser-side fetches cannot rely on secrets.
- Assumptions:
  - The published `xa-b` catalog payload is public-safe: live product data, pricing, and media only.
  - A public read endpoint for `xa-b` is acceptable if scoped explicitly to published catalog reads.
  - Query-based stable shell routes are acceptable while SEO is irrelevant.

## Outcome Contract
- **Why:** New catalog publishes should show up on xa-b immediately without waiting for or troubleshooting a Pages rebuild.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** xa-b fetches the live published catalog client-side, and newly uploaded products become browseable through listing/search/product/designer/collection flows without rebuilding the site.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `apps/xa-b/next.config.mjs` - static export config (`output: "export"`) and build-time env exposure.
- `apps/xa-b/scripts/build-xa.mjs` - fetches contract payload before `next build`, proving catalog sync is build-coupled today.
- `apps/xa-b/src/lib/demoData.ts` - normalizes bundled catalog JSON into `XA_PRODUCTS`, `XA_BRANDS`, `XA_COLLECTIONS`.
- `apps/xa-drop-worker/src/index.ts` - serves authenticated catalog GET at `/catalog/:storefront`.

### Key Modules / Files
- `apps/xa-b/src/app/page.tsx` - home page reads `XA_PRODUCTS` at build time.
- `apps/xa-b/src/components/XaDepartmentLanding.tsx` - category landing content built from static `XA_PRODUCTS`.
- `apps/xa-b/src/components/XaDepartmentListing.tsx` - fixed taxonomy listings currently filter static `XA_PRODUCTS`.
- `apps/xa-b/src/app/products/[handle]/page.tsx` - product detail pages are pre-generated from `XA_PRODUCTS`.
- `apps/xa-b/src/app/designers/page.tsx` - designer index uses static `XA_BRANDS`.
- `apps/xa-b/src/app/collections/page.tsx` - collection index uses static `XA_COLLECTIONS`.
- `apps/xa-b/src/lib/search/xaSearchService.ts` - search service only uses bundled `XA_PRODUCTS`.
- `apps/xa-drop-worker/src/index.ts` - authenticated GET path exists; no public read path yet.

### Patterns & Conventions Observed
- `xa-b` already uses many client components for listings, search, cart, wishlist, and PDP subcomponents.
- Fixed taxonomy paths are static and enumerable independently of product uploads (`department/category/subcategory`).
- Data-driven entity routes (`/products/[handle]`, `/designer/[slug]`, `/collections/[handle]`) are build-coupled because they derive params from catalog data.
- `xa-b` already ships a Pages advanced-mode worker via `out/_worker.js`, but it is currently used only for security headers/CSP.

### Data & Contracts
- Published catalog contract payload shape is `{ ok, storefront, version, publishedAt, catalog, mediaIndex }`.
- `catalog` includes public-facing product fields: slug, brand, collection, price(s), description, taxonomy, media paths.
- `mediaIndex` provides alt-text metadata used by `demoData.ts`.
- Contract reads are currently protected by `CATALOG_READ_TOKEN` or `CATALOG_WRITE_TOKEN`.

### Dependency & Impact Map
- Upstream dependencies:
  - `xa-drop-worker` published catalog object in R2.
  - GitHub Actions build env already provides `XA_CATALOG_CONTRACT_READ_URL`.
- Downstream dependents:
  - `xa-b` listing/search/product/designer/collection flows.
  - Browser clients consuming current static bundle.
- Likely blast radius:
  - `xa-drop-worker` public read path and tests.
  - `xa-b` route helpers, catalog normalization, and client pages/components.

### Test Landscape
#### Test Infrastructure
- Frameworks: Jest, eslint, TypeScript
- Commands:
  - `pnpm --filter @apps/xa-b typecheck`
  - `pnpm --filter @apps/xa-b lint`
  - `pnpm --filter @apps/xa-drop-worker typecheck`
  - `pnpm --filter @apps/xa-drop-worker lint`
- CI integration: `.github/workflows/xa.yml`

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Catalog auth/read | Unit | `apps/xa-drop-worker/__tests__/xaDropWorker.test.ts` | Existing GET auth coverage can be extended for public path |
| Bundled catalog parsing | Unit | `apps/xa-b/src/lib/__tests__/demoData.test.ts` | Can absorb parser extraction safely |
| Home page shell | Unit | `apps/xa-b/src/app/__tests__/page.test.tsx` | Existing stale-banner tests should keep working |

#### Coverage Gaps
- No tests for browser-side live catalog fetch path.
- No tests for stable query-shell entity routes.
- No tests for public catalog endpoint exposure rules.

## Questions
### Resolved
- Q: Can this be solved without SSR or a full runtime Next migration?
  - A: Yes. SEO is explicitly irrelevant, so a static shell plus client-fetched catalog is sufficient.
  - Evidence: operator constraint in-session; existing `xa-b` route mix is already heavily client-side.

- Q: Is extra infrastructure required beyond JSON + Cloudflare?
  - A: No additional paid infrastructure is required. The existing Cloudflare catalog worker can expose a public read route, and the static Pages site can fetch it directly.
  - Evidence: `apps/xa-drop-worker/src/index.ts`, `apps/xa-b/next.config.mjs`, `apps/xa-b/scripts/build-xa.mjs`

- Q: Can fixed taxonomy routes stay as-is without rebuilds?
  - A: Yes. Their path space is static; only the filtered products need to become client-fetched.
  - Evidence: `apps/xa-b/src/components/XaDepartmentListing.tsx`, `apps/xa-b/src/lib/xaCatalog.ts`

- Q: What breaks if data-driven handles remain build-generated?
  - A: New product/brand/collection handles would 404 until rebuild. A stable shell route per entity avoids that.
  - Evidence: `apps/xa-b/src/app/products/[handle]/page.tsx`, `apps/xa-b/src/app/designer/[slug]/page.tsx`, `apps/xa-b/src/app/collections/[handle]/page.tsx`

### Open (Operator Input Required)
None.

## Confidence Inputs
- Implementation: 89%
  - Evidence: all required seams are present and bounded to two packages; no paid-runtime migration needed.
  - What would raise to >=90%: complete end-to-end build validation against a live Pages preview after deploy.
- Approach: 92%
  - Evidence: aligns with the explicit “SEO does not matter” constraint and removes rebuild coupling directly.
  - What would raise to >=90%: already met.
- Impact: 95%
  - Evidence: directly removes the current Make Live -> deploy dependency for ordinary catalog visibility.
  - What would raise to >=90%: already met.
- Delivery-Readiness: 86%
  - Evidence: repo already has static Pages deploy, client components, and catalog contract; only a public read seam is missing.
  - What would raise to >=90%: confirm public catalog route deploys cleanly and browser fetch works in preview.
- Testability: 82%
  - Evidence: targeted typecheck/lint and unit tests for drop-worker route rules are straightforward; browser runtime behavior remains mainly CI-verified.
  - What would raise to >=90%: add targeted unit coverage for live catalog parser/hook consumers.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Public catalog route exposes more than intended | Low | High | Scope public reads to `xa-b` only and reuse already-published payload only |
| Client fetch fails and catalog appears empty | Medium | Medium | Keep bundled catalog as fallback in hook/service |
| Legacy links keep pointing to build-generated routes | Medium | Medium | Centralize new href builders and update all known product/designer/collection links |
| Search index stays session-stale after initial load | Low | Low | Seed search from live snapshot during service init; refresh occurs on reload |
| Query-based shell routes are less elegant than pretty paths | High | Low | Acceptable under zero-SEO constraint; legacy pretty routes can remain for already-built pages |

## Planning Constraints & Notes
- Must-follow patterns:
  - Reuse one normalization path for bundled and fetched catalog payloads.
  - Keep contract source of truth in `xa-drop-worker`; do not add a second JSON publishing pipeline.
- Rollout/rollback expectations:
  - Roll forward safely because bundled catalog remains fallback.
  - Rollback is straightforward: revert client live-catalog consumers and public route.
- Observability expectations:
  - Client path should fail closed to bundled data rather than blank pages.

## Suggested Task Seeds (Non-binding)
- TASK-01: Add explicit public catalog read path in `xa-drop-worker`.
- TASK-02: Extract shared catalog normalization and live snapshot hook in `xa-b`.
- TASK-03: Move fixed taxonomy/search/home flows to live client catalog.
- TASK-04: Add stable query-shell pages and update links for product/designer/collection entities.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - none
- Deliverable acceptance package:
  - public catalog endpoint, live catalog hook, stable shell routes, updated links, targeted validations
- Post-delivery measurement plan:
  - publish a new product and confirm it appears on home/search/listings/PDP without a redeploy

## Evidence Gap Review
### Gaps Addressed
- Confirmed `xa-b` is static-exported and build-coupled to contract reads.
- Confirmed the contract payload is already shaped for public storefront rendering.
- Confirmed the main missing capability is runtime route/data decoupling, not infrastructure cost.

### Confidence Adjustments
- Delivery confidence rose once stable query-shell routes were identified as the minimal replacement for build-generated product/designer/collection pages.

### Remaining Assumptions
- Public exposure of the published `xa-b` catalog is acceptable for this storefront.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None
- Recommended next step:
  - `/lp-do-plan`
