---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-04
Last-updated: 2026-03-04
Feature-Slug: xa-b-design-polish
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: frontend-design
Related-Plan: docs/plans/xa-b-design-polish/plan.md
Trigger-Why: A comprehensive /frontend-design audit of the xa-b luxury fashion storefront identified 4 design gaps that weaken the brand experience across the browse and conversion funnel.
Trigger-Intended-Outcome: type: operational | statement: All 4 design gaps resolved — cart thumbnails, department landing visual cards, New In badge, styled empty states — using xa-b achromatic design language | source: operator
---

# XA-B Design Polish Fact-Find Brief

## Scope

### Summary

A `/frontend-design` audit of the xa-b luxury fashion storefront identified 4 design gaps across the browse and conversion funnel. The cart page has no product images and uses `rounded-lg` borders inconsistent with the sharp-edge aesthetic. Department landing pages are text-only. Product cards lack "New In" badges despite the site featuring a New In section. Empty states across cart, wishlist, and filter-no-results are plain text with no visual treatment.

All gaps are within the xa-b app (`apps/xa-b/`) and involve React component changes — no API routes, no new dependencies. Note: `XaDepartmentLanding.tsx` is a server component; other targets are client components. Implementation must respect these execution boundaries.

### Goals

- Add product thumbnail images to cart line items with sharp-edge styling
- Add visually engaging category cards to department landing pages
- Add "New In" badge to product cards for recently added items
- Style empty states (cart, wishlist) with CTAs consistent with the luxury aesthetic; improve filter no-results visual treatment (already has centered layout + CTA button but uses generic styling)

### Non-goals

- New API routes or server-side features
- Changes outside xa-b app
- Adding color to the achromatic palette
- Product data model changes

### Constraints & Assumptions

- Constraints:
  - Cloudflare free tier only (static export, no SSR)
  - All changes within `apps/xa-b/` scope
  - Must use xa-b achromatic design language (monochrome `0 0% X%`, sharp corners 1-4px radius, wide letter-spacing)
  - Static export to Cloudflare Pages — no route handlers
- Assumptions:
  - `XaProduct.media` array typically has at least one image entry; fallback required for edge cases where it doesn't
  - `XaProduct.createdAt` is reliably populated for "New In" badge logic
  - The 30-day "New In" threshold used in filters is appropriate for the badge

## Outcome Contract

- **Why:** The xa-b storefront has a strong luxury-editorial design language but 4 pages/components break the brand immersion: cart page (no product images, rounded corners), department landing (text-only, no visual engagement), product cards (no "New In" badge), and empty states (plain text). These weaken the conversion funnel and brand perception.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All 4 design gaps resolved — cart thumbnails with sharp-edge styling, department landing visual cards, New In badge on product cards, styled empty states — using xa-b achromatic design language.
- **Source:** operator

## Access Declarations

None — all work is within the xa-b app codebase. No external services required.

## Evidence Audit (Current State)

### Entry Points

- `apps/xa-b/src/app/cart/page.tsx` — Cart page (Gap 1: no product images, `rounded-lg` borders)
- `apps/xa-b/src/components/XaDepartmentLanding.tsx` — Department landing for women/men/kids (Gap 2: text-only category cards)
- `apps/xa-b/src/components/XaProductCard.tsx` — Product card used in all grids (Gap 3: no "New In" badge)
- `apps/xa-b/src/components/XaProductListing.client.tsx` — Product listing with filter empty state (Gap 4a)
- `apps/xa-b/src/app/wishlist/page.tsx` — Wishlist page with empty state (Gap 4b)

### Key Modules / Files

| File | Role | Gap |
|---|---|---|
| `apps/xa-b/src/app/cart/page.tsx` | Cart page — Table layout, no thumbnails | 1 |
| `apps/xa-b/src/components/XaDepartmentLanding.tsx` | Department browse entry — text-only cards | 2 |
| `apps/xa-b/src/components/XaProductCard.tsx` | Product card — missing badge | 3 |
| `apps/xa-b/src/components/XaProductListing.client.tsx` | Listing — plain empty state | 4 |
| `apps/xa-b/src/app/wishlist/page.tsx` | Wishlist — plain empty state | 4 |
| `apps/xa-b/src/app/xa-cyber-atelier.css` | XA theme — defines the achromatic token overrides and typography classes | Ref |
| `apps/xa-b/src/app/globals.css` | Custom utilities (swatch colors, xa-gate-*, tracking, grids) | Ref |
| `apps/xa-b/src/components/XaBuyBox.client.tsx` | PDP buy box — reference for styling patterns (sharp corners, uppercase labels) | Ref |
| `apps/xa-b/src/app/products/[handle]/page.tsx` | PDP — reference for complete page styling | Ref |
| `apps/xa-b/src/components/XaFadeImage.tsx` | Image component with fade-in loading | Ref |

### Patterns & Conventions Observed

- **Sharp corners on interactive elements**: `rounded-none` on buttons, selects, variant swatches, buy box CTA — evidence: `XaBuyBox.client.tsx` lines 98, 129, 157, 165. Note: some elements use `rounded-sm` (product cards) and `rounded-full` (designer chips in `XaDepartmentLanding.tsx:69`). The convention is sharp-to-minimal radius, not blanket `rounded-none`.
- **Uppercase labels**: `.xa-pdp-label` = `text-transform: uppercase; letter-spacing: 0.18em; font-size: 0.62rem; font-weight: 600` — evidence: `xa-cyber-atelier.css:230-235`
- **Muted foreground for secondary text**: `text-muted-foreground` used consistently — evidence: all components
- **Image handling**: `XaFadeImage` component wraps Next.js `Image` with fade-in — evidence: `XaBuyBox.client.tsx:210-216`
- **Design system Grid**: `<Grid columns={{ base: 2, md: 3, lg: 4 }} gap={6}>` is the standard product grid — evidence: `XaDepartmentLanding.tsx:54`, `XaProductListing.client.tsx:160`
- **Panel hover**: `.xa-panel:hover { box-shadow: 0 8px 20px rgba(0,0,0,0.08); transform: translateY(-2px); }` — evidence: `xa-cyber-atelier.css:198-201`
- **Inconsistency found**: Cart page uses `rounded-lg` (lines 40, 48) and wishlist uses `rounded-lg` (line 49) — these are outliers against the sharp-to-minimal radius convention used elsewhere (`rounded-none` on interactive elements, `rounded-sm` on cards)

### Data & Contracts

- **XaProduct**: extends base `SKU` type. Key fields: `media: Array<{ url, type, altText? }>`, `createdAt: string` (ISO), `brand: string`, `title: string`, `price: number`, `sizes: string[]`, `prices?: Partial<Record<Currency, number>>`
- **Cart state**: `Record<string, { sku: XaProduct; qty: number; size?: string }>` — each line item carries the full `XaProduct` object, so `sku.media[0]` is available for thumbnails
- **Wishlist state**: `string[]` of product IDs — products resolved via `XA_PRODUCTS.map`
- **"New In" logic**: `resolveNewInDays()` in `useXaListingFilters.ts:74-76` uses 30 days by default. `createdAt` is compared against reference timestamp. This same logic can be extracted for the badge.
- **Image URLs**: Built via `buildXaImageUrl(path)` from Cloudflare Images paths stored in `catalog.media.runtime.json`

### Dependency & Impact Map

- Upstream dependencies:
  - `@acme/design-system/atoms` (Button, Table, Grid, Section, Select, Price)
  - `@acme/design-system/molecules` (Breadcrumbs, PriceCluster, QuantityInput)
  - `@acme/design-system/primitives` (Inline, Cluster)
  - `@acme/platform-core/contexts/CurrencyContext`
  - `XaCartContext`, `XaWishlistContext` — client-side React contexts
- Downstream dependents:
  - `XaProductCard` is consumed by: home page, department landing, product listing, wishlist, PDP (complete look + more from designer) — any change to its props or layout affects all grids
  - `XaDepartmentLanding` is consumed by: `women/page.tsx`, `men/page.tsx`, `kids/page.tsx`
  - Cart page and wishlist page are leaf routes with no downstream consumers
- Blast radius:
  - Gap 1 (cart): isolated to `cart/page.tsx` — low risk
  - Gap 2 (department landing): isolated to `XaDepartmentLanding.tsx` — low risk
  - Gap 3 (product card badge): affects all product grids site-wide — medium risk, must not break existing layout
  - Gap 4 (empty states): isolated to 3 leaf components — low risk

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest + Testing Library (governed runner)
- Commands: `pnpm --filter @apps/xa-b test` (CI-only)
- CI integration: Governed test runner via `run-governed-test.sh`

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Cart context | Unit | `XaCartContext.test.tsx` | Add/remove/update/persist well-covered |
| Wishlist context | Unit | `XaWishlistContext.test.tsx` | Toggle/clear/persist covered |
| Listing filters | Unit | `useXaListingFilters.test.tsx` | Sort, filter, new-in days covered |
| Catalog utils | Unit | `xaCatalog.test.ts` | Format, filter utilities |
| Demo data | Unit | `demoData.test.ts` | Data integrity checks |
| Inventory | Unit | `inventoryStore.test.ts` | Stock calculation |
| Search | Unit | `4 search test files` | Full search infra covered |

#### Coverage Gaps
- **No component tests** for XaProductCard, XaDepartmentLanding, XaProductListing, cart page, or wishlist page
- Home page test (`page.test.tsx`) mocks XaProductCard as a stub — does not test actual rendering

#### Testability Assessment
- Easy to test: "New In" badge logic (pure date comparison — can unit test the predicate function)
- Easy to test: Empty state render conditions (context state → UI)
- Hard to test: Visual styling changes (would need snapshot or visual regression)
- Test seams needed: Extract `isNewIn(product)` as a pure function for unit testing

#### Recommended Test Approach
- Unit test for: `isNewIn(product, referenceDate?)` predicate function
- No component tests needed for purely visual changes (styling, thumbnails, empty states) — visual regression is the appropriate tool but out of scope for this effort

### Recent Git History (Targeted)

- **Feb 13, 2026** (`f189a1660f`): Major DS compliance migration — xa-b moved from `bg-white`/`text-black` to semantic tokens (`bg-surface`, `text-foreground`). This is foundational; our changes build on it.
- **Multiple "outstanding work" commits** (Feb 2026): Indicates active iteration on xa-b components. `XaProductCard` and `XaProductListing` have uncommitted changes on current dev branch.
- **CSS files** (`xa-cyber-atelier.css`, `globals.css`): Last touched ~Feb 5 — relatively stable.
- **Implication**: Files are actively iterated but stable in design direction. Current uncommitted changes are from the same design polish effort (filter system refactoring).

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Cart page (Gap 1) | Yes | None — cart state carries full `XaProduct` with `media` array; thumbnails are straightforward | No |
| Department landing (Gap 2) | Yes | None — `XaDepartmentLanding` is a simple component consuming product data; no auth/API boundaries | No |
| Product card badge (Gap 3) | Yes | [Minor] No existing `isNewIn` utility; needs extraction from filter logic | No — addressed in task seeds |
| Empty states (Gap 4) | Yes | None — empty states are simple conditional renders in leaf components | No |
| Design token compliance | Yes | None — all proposed changes use existing tokens from `xa-cyber-atelier.css` | No |

## Scope Signal

- **Signal:** right-sized
- **Rationale:** 4 well-bounded UI changes in a single app, all client-side, no API/data model changes, no cross-app dependencies. Each gap is isolated to 1-2 files. The product card badge has the widest blast radius but is additive-only (new visual element, no behavior change). Total scope is ~4-5 files modified, achievable in a single plan with 4 focused tasks.

## Questions

### Resolved

- Q: Should the "New In" badge threshold match the filter threshold (30 days)?
  - A: Yes — using the same 30-day threshold ensures consistency between the "New In" filter toggle and the badge visual indicator.
  - Evidence: `useXaListingFilters.ts:76` uses `appliedNewIn ? 30 : null`

- Q: Should department landing category cards use actual product images or placeholder/icon treatment?
  - A: Use the first product image from each category as a representative thumbnail. This is the simplest approach that adds visual engagement without requiring additional assets or a new data model.
  - Evidence: `XA_PRODUCTS` data is available at build time; `filterByDepartment` + category filter gives representative products. Pattern matches PDP "Complete the look" grid.

- Q: Are there accessibility concerns with the "New In" badge?
  - A: Use text-based badge (not icon-only) with sufficient contrast. The achromatic palette gives good contrast ratios (black text on light surface or white text on dark surface). Badge text serves as its own accessible label.

### Open (Operator Input Required)

None — all questions resolved from available evidence and design conventions.

## Confidence Inputs

- **Implementation: 90%** — All changes are straightforward React component edits using existing data (`XaProduct.media`, `createdAt`), existing design tokens, and existing design system components. No new APIs, no data model changes.
  - To >=80: Already there.
  - To >=90: Already there — all evidence gathered, patterns clear, types verified.

- **Approach: 88%** — Adding thumbnails, badges, visual cards, and styled empty states follows established patterns in the app (PDP, product grid, buy box). One minor gap: no existing `isNewIn` utility needs extraction.
  - To >=80: Already there.
  - To >=90: Extract `isNewIn` as a tested pure function; confirm category image selection strategy works with available data.

- **Impact: 85%** — All 4 gaps address visible conversion funnel weaknesses. Cart thumbnails and department landing visual hierarchy are high-impact. Badge and empty states are medium-low impact individually but collectively strengthen brand perception.
  - To >=80: Already there.
  - To >=90: User testing or analytics would confirm conversion impact (out of scope for code changes).

- **Delivery-Readiness: 90%** — No blockers. All files identified, types verified, patterns established. Static export means no deploy complexity.
  - To >=80: Already there.
  - To >=90: Already there.

- **Testability: 78%** — The `isNewIn` predicate is easy to unit test. Visual changes (thumbnails, styling, empty states) lack automated visual regression tooling. Component tests don't exist for any of these components currently.
  - To >=80: Add unit test for `isNewIn` predicate.
  - To >=90: Would need visual regression test infrastructure (out of scope).

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Product card badge breaks existing grid layout | Low | Medium | Badge positioned absolutely within existing card structure; no layout shift |
| Cart thumbnail images missing for some products | Low | Low | Hard requirement: fallback to product initial or muted placeholder when `media[0]` is absent |
| Department landing category images are poor quality | Low | Low | Using product thumbnails from existing data; quality is consistent with product grid |
| Uncommitted changes on dev branch conflict | Medium | Low | Changes are in filter system (XaProductListing, XaProductCard), not in cart/department/empty state areas; badge addition is additive |

## Planning Constraints & Notes

- Must-follow patterns:
  - Use `rounded-none` or `rounded-sm` (not `rounded-lg`) per xa-b sharp-to-minimal radius convention; match the radius of the nearest peer element
  - Use `text-muted-foreground` for secondary text
  - Use `.xa-pdp-label` pattern for uppercase micro labels
  - Use `XaFadeImage` for product thumbnails (consistent loading behavior)
  - Use `<Grid columns={{ base: 2, md: 3, lg: 4 }} gap={6}>` for product grids
- Rollout/rollback: Static export — deploy is atomic Cloudflare Pages push; rollback is redeploy previous commit
- Observability: No runtime observability needed (static site); visual QA via staging URL

## Suggested Task Seeds (Non-binding)

1. **IMPLEMENT: Cart page thumbnails + sharp-edge styling** — Add product image to cart line items via `sku.media[0]`, replace `rounded-lg` with `rounded-none`, align typography
2. **IMPLEMENT: Department landing visual category cards** — Replace text-only category links with cards showing representative product image
3. **IMPLEMENT: Product card "New In" badge** — Extract `isNewIn(product)` utility, add badge element to XaProductCard, unit test the predicate
4. **IMPLEMENT: Styled empty states** — Cart, wishlist, and filter no-results get consistent styled empty state with CTA

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: `frontend-design`
- Deliverable acceptance package:
  - All 4 gaps visually resolved (manual staging URL review)
  - `isNewIn` predicate unit-tested
  - Typecheck and lint pass
  - No visual regressions in existing product grid layout
- Post-delivery measurement plan: Visual QA on staging URL; no runtime metrics (static site)

## Evidence Gap Review

### Gaps Addressed
- Cart state shape confirmed — `sku.media` available for thumbnails
- "New In" threshold confirmed at 30 days from `useXaListingFilters.ts`
- Design token compliance verified — all proposed changes use existing xa-cyber-atelier tokens
- Product data availability confirmed — `XaProduct.media`, `createdAt`, taxonomy all available

### Confidence Adjustments
- Implementation raised to 90% after confirming cart state carries full XaProduct with media
- Testability held at 78% due to no existing component test infrastructure

### Remaining Assumptions
- `XaProduct.media[0]` is reliably populated (fallback needed if not)
- 30-day "New In" threshold is appropriate for badge display (matches existing filter)

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan xa-b-design-polish --auto`
