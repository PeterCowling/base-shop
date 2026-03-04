---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-04
Last-reviewed: 2026-03-04
Last-updated: 2026-03-05
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-b-design-polish
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: frontend-design
Overall-confidence: 82%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# XA-B Design Polish Plan

## Summary

Four focused UI improvements to the xa-b luxury fashion storefront that resolve design gaps identified during a `/frontend-design` audit. (1) Cart page gets product thumbnail images and sharp-edge styling. (2) Department landing pages get visual category cards with representative product images. (3) Product cards get a "New In" badge for recently added items. (4) Empty states on wishlist and filter-no-results pages get consistent styled treatment. All changes use existing xa-b achromatic design tokens, existing design system components, and existing product data — no new APIs, dependencies, or data model changes.

## Active tasks
- [x] TASK-01: Cart page thumbnails + sharp-edge styling
- [x] TASK-02: Department landing visual category cards
- [x] TASK-03: Product card New In badge
- [x] TASK-04: Styled empty states (wishlist + listing)

## Goals
- Add product thumbnail images to cart line items with sharp-edge styling consistent with xa-b aesthetic
- Add visual category cards to department landing pages with representative product images
- Add "New In" badge to product cards for items added within the last 30 days
- Style empty states on wishlist page and listing filter-no-results with consistent achromatic treatment and CTAs

## Non-goals
- New API routes or server-side features
- Changes outside `apps/xa-b/` scope
- Adding color to the achromatic palette
- Product data model changes
- Visual regression test infrastructure
- Changing the "New In" filter algorithm (badge uses wall-clock time independently)

## Constraints & Assumptions
- Constraints:
  - Cloudflare free tier only (static export, no SSR)
  - All changes within `apps/xa-b/` scope
  - Must use xa-b achromatic design language (monochrome `0 0% X%`, sharp corners 1-4px, wide letter-spacing)
  - Static export to Cloudflare Pages — no route handlers
- Assumptions:
  - `XaProduct.media` array typically has at least one image entry; fallback required when absent
  - `XaProduct.createdAt` is reliably populated for New In badge logic
  - 30-day "New In" threshold (matching filter logic) is appropriate for badge display

## Inherited Outcome Contract

- **Why:** The xa-b storefront has a strong luxury-editorial design language but 4 pages/components break the brand immersion: cart page (no product images, rounded corners), department landing (text-only, no visual engagement), product cards (no "New In" badge), and empty states (plain text). These weaken the conversion funnel and brand perception.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All 4 design gaps resolved — cart thumbnails with sharp-edge styling, department landing visual cards, New In badge on product cards, styled empty states — using xa-b achromatic design language.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/xa-b-design-polish/fact-find.md`
- Key findings used:
  - Cart state carries full `XaProduct` with `media` array — thumbnails available via `sku.media[0]`
  - `XaDepartmentLanding.tsx` is a server component — can import client components but cannot use hooks
  - "New In" filter uses 30-day threshold via `resolveNewInDays()` — badge uses the same 30-day window but with wall-clock reference time (intentional divergence from filter's catalog-relative reference; see TASK-03 execution plan)
  - No `isNewIn` utility exists — must be extracted as a pure function
  - `ProductBadge` already used for "Sold out" in `XaProductCard` — reuse for "New In"
  - Sharp-to-minimal radius convention: `rounded-none` on interactive elements, `rounded-sm` on cards, `rounded-full` on chips
  - `rounded-lg` on cart page (lines 40, 48) and wishlist (line 49) are outliers that need fixing

## Proposed Approach
- Option A: Four independent tasks, one per gap — maximizes parallelism (all tasks touch different primary files)
- Option B: Two tasks — one for "visual additions" (thumbnails, cards, badge) and one for "styling fixes" (empty states, radius) — couples unrelated changes
- Chosen approach: Option A — four independent S-effort tasks. Cart empty state is included in TASK-01 (same file, same concern: fixing `rounded-lg` and adding visual treatment). This keeps all tasks independent for parallel execution.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---:|---:|---|---|---|---|
| TASK-01 | IMPLEMENT | Cart page thumbnails + sharp-edge styling | 85% | S | Complete (2026-03-04) | - | - |
| TASK-02 | IMPLEMENT | Department landing visual category cards | 85% | S | Complete (2026-03-04) | - | - |
| TASK-03 | IMPLEMENT | Product card New In badge + utility | 80% | S | Complete (2026-03-04) | - | - |
| TASK-04 | IMPLEMENT | Styled empty states (wishlist + listing) | 80% | S | Complete (2026-03-04) | - | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03, TASK-04 | - | All tasks touch different primary files; fully parallelizable |

## Tasks

### TASK-01: Cart page thumbnails + sharp-edge styling
- **Type:** IMPLEMENT
- **Deliverable:** code-change in `apps/xa-b/src/app/cart/page.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-04)
- **Build evidence:** Typecheck pass, lint pass (0 errors, 0 warnings). Cart line items now show 64×64 XaFadeImage thumbnail with fallback to product initial letter. Table wrapper and empty state both use `rounded-sm border-border-1`. Empty state centered with uppercase label and styled CTA.
- **Affects:** `apps/xa-b/src/app/cart/page.tsx`, `[readonly] apps/xa-b/src/components/XaFadeImage.tsx`, `[readonly] apps/xa-b/src/lib/demoData.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% - Cart state carries full `XaProduct` with `media` array; `sku.media[0]` gives direct access to image URL. `XaFadeImage` component available. Straightforward table cell addition.
  - Approach: 85% - Follows PDP image patterns from `XaBuyBox.client.tsx`; fix `rounded-lg` → `rounded-sm` on both table wrapper and empty state div.
  - Impact: 85% - Cart is a key conversion page; product thumbnails improve purchase confidence and visual consistency.
- **Acceptance:**
  - Cart line items show a product thumbnail (64×64px) to the left of the product title/price
  - When `sku.media[0]` is absent, a muted placeholder (product initial or text fallback) renders instead — no broken image
  - Table wrapper uses `rounded-sm` instead of `rounded-lg`
  - Empty state div uses `rounded-sm` instead of `rounded-lg`; includes a centered layout with muted icon/text and CTA link styled with xa-b uppercase tracking
  - **Expected user-observable behavior:**
    - [ ] User sees a small product image next to each item in their cart
    - [ ] Products without images show a clean placeholder, not a broken image icon
    - [ ] Cart corners are sharp/minimal, matching the rest of the site
    - [ ] Empty cart message has a styled appearance with a clear "Browse products" CTA
- **Validation contract (TC-01):**
  - TC-01: Cart with products → each line shows thumbnail image from `sku.media[0]`
  - TC-02: Cart product with no media → fallback placeholder renders (no broken image)
  - TC-03: Table wrapper and empty state div → use `rounded-sm` (not `rounded-lg`)
  - TC-04: Empty cart → styled empty state with CTA link to `/collections/all`
  - Post-build QA: run `lp-design-qa`, `tools-ui-contrast-sweep`, `tools-ui-breakpoint-sweep` on `/cart` route
- **Execution plan:**
  1. Import `XaFadeImage` component
  2. Add a thumbnail cell to the table — 64×64px `XaFadeImage` with `rounded-sm`, `object-cover`, `aspect-square`
  3. Add fallback: when `line.sku.media[0]` is absent, render a muted `div` with product title initial
  4. Replace `rounded-lg` with `rounded-sm` on the table wrapper div (line 48) and empty state div (line 40)
  5. Style the empty state: center content, add `.xa-pdp-label`-style uppercase text, underline CTA link
- **Planning validation (required for M/L):** None: S effort
- **Scouts:** None: straightforward table cell addition; `sku.media` availability confirmed in fact-find
- **Edge Cases & Hardening:**
  - Product with empty `media` array → show text fallback (product title initial in muted box)
  - Very long product titles → truncate with `line-clamp-1` on the title in the existing cell
  - Image load failure → `XaFadeImage` already handles this with its `onError` fallback display
- **What would make this >=90%:**
  - Component test verifying thumbnail renders with and without media
- **Rollout / rollback:**
  - Rollout: Atomic Cloudflare Pages deploy
  - Rollback: Redeploy previous commit
- **Documentation impact:** None
- **Notes / references:**
  - Cart state shape: `Record<string, { sku: XaProduct; qty: number; size?: string }>`
  - XaFadeImage handles load errors with a muted text fallback automatically

### TASK-02: Department landing visual category cards
- **Type:** IMPLEMENT
- **Deliverable:** code-change in `apps/xa-b/src/components/XaDepartmentLanding.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-04)
- **Build evidence:** Typecheck pass, lint pass. Category cards now show representative product image (first product with valid media per category), `rounded-sm border-border-1`, xa-panel hover, uppercase label, muted subcategories. Fallback placeholder for categories without product images. Image selection uses `find()` to prefer first product WITH a valid image.
- **Affects:** `apps/xa-b/src/components/XaDepartmentLanding.tsx`, `[readonly] apps/xa-b/src/components/XaFadeImage.tsx`, `[readonly] apps/xa-b/src/lib/demoData.ts`, `[readonly] apps/xa-b/src/lib/xaCatalog.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% - Products are already filtered by department; need to further filter by category to get a representative image. `XaDepartmentLanding` is a server component but can import `XaFadeImage` (client component). Image data is available at build time.
  - Approach: 85% - Card layout follows existing patterns (product card structure with image + text). Replace `rounded-lg` with `rounded-sm`.
  - Impact: 85% - Department landing is the browse entry point; visual cards dramatically improve engagement vs text-only links.
- **Acceptance:**
  - Each category card shows a representative product image (first valid image from the first product with media in that category for this department)
  - Card layout: image on top (aspect 4:3 or 3:2), category label + subcategories text below
  - Cards use `rounded-sm` instead of `rounded-lg`
  - Cards have hover effect consistent with `.xa-panel` pattern
  - When no products exist for a category, a muted placeholder renders instead of a broken image
  - **Expected user-observable behavior:**
    - [ ] User sees visually engaging category cards with product images on department pages
    - [ ] Hovering a card shows a subtle lift/shadow effect
    - [ ] Categories without products show a clean placeholder, not a broken layout
    - [ ] Card corners are sharp/minimal, matching the site aesthetic
- **Validation contract (TC-02):**
  - TC-01: Department page with products in all categories → each card shows representative product image
  - TC-02: Category with no products for this department → card shows muted text placeholder
  - TC-03: Cards use `rounded-sm` and hover shadow
  - TC-04: Image with load error → `XaFadeImage` fallback renders cleanly
  - Post-build QA: run `lp-design-qa`, `tools-ui-contrast-sweep`, `tools-ui-breakpoint-sweep` on `/women`, `/men`, `/kids` routes
- **Execution plan:**
  1. Import `XaFadeImage` from `./XaFadeImage`
  2. Extend `categoryCards` mapping to include `imageUrl` and `imageAlt` — filter `products` by `taxonomy.category`, find the first product that has a valid image URL (not just the first product), take that product's first image
  3. Replace the text-only `<Link>` card with a visual card: `<Link className="group rounded-sm border border-border-1 overflow-hidden xa-panel">` containing an image div (aspect-[4/3]) + text div (p-4)
  4. Add fallback div when `imageUrl` is absent: `bg-surface text-muted-foreground` centered text
  5. Replace `rounded-lg` with `rounded-sm` on category cards
- **Planning validation (required for M/L):** None: S effort
- **Scouts:** None: product data shape confirmed; server component can import client components
- **Edge Cases & Hardening:**
  - Department with no products in a category → muted placeholder with category label text
  - Image aspect ratio mismatch → `object-cover` on the image ensures consistent card layout
- **What would make this >=90%:**
  - Component test verifying card renders with image when products exist
- **Rollout / rollback:**
  - Rollout: Atomic Cloudflare Pages deploy
  - Rollback: Redeploy previous commit
- **Documentation impact:** None
- **Notes / references:**
  - `XaDepartmentLanding` is a server component — no `"use client"` directive
  - `XaFadeImage` is a client component — safe to import in server components (Next.js handles the boundary)
  - Products available at build time via `XA_PRODUCTS` and `filterByDepartment()`

### TASK-03: Product card New In badge + utility
- **Type:** IMPLEMENT
- **Deliverable:** code-change in `apps/xa-b/src/components/XaProductCard.tsx` + `apps/xa-b/src/lib/xaListingUtils.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-04)
- **Build evidence:** Typecheck pass, lint pass. `isNewIn(product, referenceDate?)` exported from `xaListingUtils.ts` with 30-day wall-clock threshold. 6 unit test cases added (within/outside/exact-boundary/missing/invalid/future). ProductBadge with `color="default" tone="soft"` shows on non-sold-out products within 30 days. Mutually exclusive with "Sold out" badge via ternary chain.
- **Affects:** `apps/xa-b/src/components/XaProductCard.tsx`, `apps/xa-b/src/lib/xaListingUtils.ts`, `apps/xa-b/src/lib/__tests__/xaListingUtils.test.ts`, `[readonly] apps/xa-b/src/lib/useXaListingFilters.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 90% - Date comparison is trivial; `ProductBadge` already imported and used for "Sold out" in the same component. Additive-only change.
  - Approach: 90% - 30-day threshold matches existing filter logic (`resolveNewInDays`). Badge positioning follows "Sold out" pattern. `isNewIn` extracted as a pure testable function.
  - Impact: 80% - Held-back test: no single unresolved unknown would drop below 80; the badge is purely additive and reinforces the existing New In section. It is visual polish, not a conversion driver.
- **Acceptance:**
  - `isNewIn(product, referenceDate?)` function exported from `xaListingUtils.ts` — returns `true` when `createdAt` is within 30 days of reference date
  - Unit test for `isNewIn`: products within 30 days return `true`; older products return `false`; products with missing `createdAt` return `false`
  - `XaProductCard` shows "New In" `ProductBadge` when `isNewIn(product)` is `true` and product is NOT sold out
  - Badge positioned at `start-2 top-2` (same position as "Sold out" badge — they are mutually exclusive)
  - Badge uses `color="default"` `tone="soft"` `size="sm"` for subtle achromatic appearance
  - **Expected user-observable behavior:**
    - [ ] User sees a "New In" badge on recently added products across all product grids
    - [ ] Badge does not appear on sold-out products (only "Sold out" badge shows)
    - [ ] Badge is visually subtle and consistent with the achromatic palette
- **Validation contract (TC-03):**
  - TC-01: Product with `createdAt` within 30 days and in stock → "New In" badge visible
  - TC-02: Product with `createdAt` older than 30 days → no badge
  - TC-03: Product with `createdAt` within 30 days but sold out → only "Sold Out" badge, no "New In"
  - TC-04: Product with missing/empty `createdAt` → no badge (graceful fallback)
  - TC-05: `isNewIn` unit test — 3+ test cases covering within/outside/missing threshold
  - Post-build QA: run `lp-design-qa`, `tools-ui-contrast-sweep`, `tools-ui-breakpoint-sweep` on `/collections/all` route
- **Execution plan:**
  1. Add `isNewIn(product: XaProduct, referenceDate?: Date): boolean` to `xaListingUtils.ts` — compare `product.createdAt` against 30-day window relative to `referenceDate` (defaults to `new Date()` = wall-clock time)
  2. Design note: the "New In" filter in `useXaListingFilters` uses a catalog-relative reference timestamp (`max(createdAt)` across all products) as an optimization for static data. The badge intentionally uses wall-clock time (`Date.now()`) because it should reflect current reality — if a product was added 35 days ago, it is no longer "New In" regardless of catalog staleness. This means badge and filter may disagree near the 30-day boundary for stale catalogs; this is correct behavior.
  3. Add unit tests in `xaListingUtils.test.ts` for `isNewIn` (within 30 days, outside 30 days, missing createdAt, with explicit referenceDate override)
  4. Import `isNewIn` in `XaProductCard.tsx`
  5. Add `ProductBadge` with `label="New In"` inside the existing badge position area, guarded by `!soldOut && isNewIn(product)`
- **Planning validation (required for M/L):** None: S effort
- **Scouts:** None: `ProductBadge` API confirmed (label, color, tone, size); 30-day threshold confirmed from filter logic
- **Edge Cases & Hardening:**
  - Product with `createdAt` exactly 30 days ago → treat as "New In" (inclusive threshold: `<= 30`)
  - Product with invalid `createdAt` string → `new Date(invalid)` produces `NaN` → `isNewIn` returns `false`
  - Timezone edge cases → use UTC comparison for consistency
- **What would make this >=90%:**
  - Component test verifying badge renders/hides based on `createdAt`
- **Rollout / rollback:**
  - Rollout: Atomic Cloudflare Pages deploy
  - Rollback: Redeploy previous commit
- **Documentation impact:** None
- **Notes / references:**
  - `resolveNewInDays()` in `useXaListingFilters.ts:74-76` uses 30 days — badge uses the same 30-day window but evaluates against wall-clock time (not the filter's catalog-relative max `createdAt` reference)
  - `ProductBadge` is already imported in `XaProductCard.tsx` for "Sold out" — no new import needed
  - Consumer tracing: `isNewIn` is new; only consumer is `XaProductCard.tsx`

### TASK-04: Styled empty states (wishlist + listing)
- **Type:** IMPLEMENT
- **Deliverable:** code-change in `apps/xa-b/src/app/wishlist/page.tsx` + `apps/xa-b/src/components/XaProductListing.client.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-04)
- **Build evidence:** Typecheck pass, lint pass. Wishlist empty state: `rounded-sm border-border-1`, centered layout, uppercase label, styled CTA to `/new-in`. Listing filter empty state: uppercase "No matches" heading added, tightened gap, consistent achromatic treatment. Both use `text-muted-foreground` for secondary text.
- **Affects:** `apps/xa-b/src/app/wishlist/page.tsx`, `apps/xa-b/src/components/XaProductListing.client.tsx`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 85% - Simple conditional render changes; fix `rounded-lg` → `rounded-sm` on wishlist; enhance filter no-results with consistent styling.
  - Approach: 85% - Follows achromatic patterns established throughout the app (muted text, uppercase tracking, subtle borders).
  - Impact: 80% - Held-back test: no single unresolved unknown would drop below 80; empty states affect few users, but those who see them get a polished experience consistent with brand standards.
- **Acceptance:**
  - Wishlist empty state: `rounded-sm` border, centered layout, uppercase label text with wide tracking, CTA link to `/new-in` styled as underlined text with muted color
  - Listing filter empty state: consistent styling with wishlist empty state — uppercase heading, muted description text, "Clear all filters" button retains existing `rounded-none` sharp styling
  - Both empty states use `text-muted-foreground` for secondary text
  - **Expected user-observable behavior:**
    - [ ] User sees a styled empty wishlist message with a clear "Browse new arrivals" CTA
    - [ ] User sees a styled filter-no-results message with "Clear all filters" button
    - [ ] Empty state corners are sharp/minimal, matching the rest of the site
- **Validation contract (TC-04):**
  - TC-01: Empty wishlist → styled empty state with `rounded-sm`, uppercase label, CTA to `/new-in`
  - TC-02: Filter producing zero results → styled empty state with muted text and clear CTA
  - TC-03: Wishlist with products → empty state not rendered (normal product grid)
  - TC-04: Filter with results → empty state not rendered (normal product grid)
  - Post-build QA: run `lp-design-qa`, `tools-ui-contrast-sweep`, `tools-ui-breakpoint-sweep` on `/wishlist` and listing routes
- **Execution plan:**
  1. Wishlist page (`wishlist/page.tsx` line 49): Replace `rounded-lg` with `rounded-sm`; restructure content to centered layout with uppercase heading (`.xa-pdp-label`-style), muted body text, and styled CTA link
  2. Listing filter empty state (`XaProductListing.client.tsx` lines 149-158): Add uppercase heading above the existing muted text; ensure consistent spacing and visual hierarchy
  3. Verify both empty states use `text-muted-foreground` and achromatic border tokens
- **Planning validation (required for M/L):** None: S effort
- **Scouts:** None: straightforward styling changes to existing conditional renders
- **Edge Cases & Hardening:**
  - Screen readers: empty state messages remain accessible (text content + link/button targets)
  - Mobile layout: centered layout works across breakpoints (no grid dependencies)
- **What would make this >=90%:**
  - Component tests verifying empty state renders when list is empty
- **Rollout / rollback:**
  - Rollout: Atomic Cloudflare Pages deploy
  - Rollback: Redeploy previous commit
- **Documentation impact:** None
- **Notes / references:**
  - Cart empty state is handled by TASK-01 (same file, same concern)
  - Listing filter empty state already has `rounded-none` on the button and centered layout — needs enhancement, not replacement

## Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Product card badge breaks existing grid layout | Low | Medium | Badge positioned absolutely within existing card structure; `!soldOut` guard prevents overlap with "Sold out" badge |
| Cart thumbnail images missing for some products | Low | Low | Fallback to muted placeholder when `media[0]` is absent |
| Department landing category images are poor quality | Low | Low | Using product thumbnails from existing data; quality is consistent with product grid |
| Uncommitted changes on dev branch conflict | Medium | Low | Changes target different primary files; badge addition is additive to XaProductCard |
| `XaFadeImage` in server component causes hydration issues | Low | Medium | `XaFadeImage` is a client component — Next.js handles the serialization boundary automatically; this pattern is standard in App Router |

## Observability
- Logging: None — static site, no runtime logging
- Metrics: None — visual changes, no measurable runtime metrics
- Alerts/Dashboards: None — visual QA on staging URL

## Acceptance Criteria (overall)
- [ ] All 4 gaps visually resolved on staging
- [ ] `isNewIn` predicate unit-tested (TASK-03)
- [ ] No `rounded-lg` remaining in cart page or wishlist empty state
- [ ] Typecheck and lint pass
- [ ] No visual regressions in existing product grid layout (verified via QA sweeps)

## Decision Log
- 2026-03-04: All questions resolved from evidence — no DECISION tasks needed
- 2026-03-04: Cart empty state included in TASK-01 (same file, same concern) rather than TASK-04 — avoids file conflict and enables full parallelism
- 2026-03-04: (Critique R1 fix) `isNewIn` badge uses wall-clock time (`Date.now()`) intentionally, not catalog-relative timestamp — badge should reflect current reality
- 2026-03-04: (Critique R1 fix) Category card image selection prefers first product WITH a valid image, not just first product
- 2026-03-04: (Critique R1 fix) Removed contradictory non-goal about cart empty state (TASK-01 explicitly styles it)

## Overall-confidence Calculation
- S=1, M=2, L=3
- TASK-01: 85% × 1 = 85
- TASK-02: 85% × 1 = 85
- TASK-03: 80% × 1 = 80
- TASK-04: 80% × 1 = 80
- Overall-confidence = (85 + 85 + 80 + 80) / 4 = 82%

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Cart thumbnails + sharp-edge styling | Yes — `XaFadeImage` exists, cart state carries `sku.media`, `rounded-sm` is a valid token | None | No |
| TASK-02: Department landing visual cards | Yes — `products` available via `filterByDepartment()`, `XaFadeImage` importable in server component, `XA_ALLOWED_CATEGORIES` provides category list | None | No |
| TASK-03: Product card New In badge | Yes — `ProductBadge` already imported in `XaProductCard.tsx`, `xaListingUtils.ts` exists for utility, test file exists for unit tests | None | No |
| TASK-04: Styled empty states | Yes — wishlist and listing files identified, conditional render branches exist, achromatic tokens available | None | No |
