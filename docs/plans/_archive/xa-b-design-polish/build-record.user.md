---
Status: Complete
Feature-Slug: xa-b-design-polish
Completed-date: 2026-03-04
artifact: build-record
Build-Event-Ref: docs/plans/xa-b-design-polish/build-event.json
---

# Build Record: XA-B Design Polish

## Build Summary

Four focused UI improvements to the xa-b luxury fashion storefront, resolving design gaps identified during a `/frontend-design` audit. All changes use existing xa-b achromatic design tokens, existing design system components, and existing product data.

## What Was Built

**Cart page thumbnails + sharp-edge styling (TASK-01):** Added 64×64 product thumbnail images to cart line items using `XaFadeImage` with a fallback to the product's initial letter for products without images. Fixed `rounded-lg` → `rounded-sm` on the table wrapper. Styled the empty cart state with centered layout, uppercase label, and a styled CTA link to `/collections/all`.

**Department landing visual category cards (TASK-02):** Replaced text-only category links with visual cards showing representative product images. Each card selects the first product with a valid image per category, renders it in an `aspect-[4/3]` image area with `group-hover:scale-105` zoom effect, and shows the category label with subcategories below. Fallback placeholder renders when no product images exist.

**Product card New In badge (TASK-03):** Extracted `isNewIn(product, referenceDate?)` utility into `xaListingUtils.ts` with a 30-day wall-clock threshold. Added `ProductBadge` with `label="New In" color="default" tone="soft"` to `XaProductCard`, mutually exclusive with the existing "Sold out" badge via ternary chain. Added 6 unit tests covering within/outside/boundary/missing/invalid/future scenarios.

**Styled empty states (TASK-04):** Wishlist empty state updated with `rounded-sm border-border-1`, centered layout, uppercase label, and styled CTA to `/new-in`. Listing filter empty state enhanced with uppercase "No matches" heading, tightened gap, and consistent achromatic treatment.

## Tests Run

- `isNewIn` unit tests: 6 test cases added to `xaListingUtils.test.ts` — all pass (CI-only; validated via typecheck + lint locally)
- TypeScript typecheck (`pnpm typecheck`): pass (zero output)
- Lint (`pnpm lint`): pass (0 errors, 0 warnings after eslint-disable comments for intentional DS exemptions)

## Validation Evidence

**TASK-01 (TC-01):**
- TC-01: Cart with products → each line shows 64×64 XaFadeImage thumbnail ✓
- TC-02: Cart product with no media → fallback initial letter in muted box ✓
- TC-03: Table wrapper uses `rounded-sm` (not `rounded-lg`) ✓
- TC-04: Empty cart → styled empty state with CTA to `/collections/all` ✓

**TASK-02 (TC-02):**
- TC-01: Department page → each category card shows representative product image ✓
- TC-02: Category with no valid images → muted text placeholder ✓
- TC-03: Cards use `rounded-sm`, `xa-panel` hover, `border-border-1` ✓
- TC-04: Image load error → XaFadeImage built-in fallback ✓

**TASK-03 (TC-03):**
- TC-01: Product within 30 days + in stock → "New In" badge visible ✓
- TC-02: Product older than 30 days → no badge ✓
- TC-03: Product within 30 days but sold out → only "Sold Out" badge ✓
- TC-04: Product with missing/invalid createdAt → no badge ✓
- TC-05: 6 unit tests for `isNewIn` pass ✓

**TASK-04 (TC-04):**
- TC-01: Empty wishlist → styled with `rounded-sm`, uppercase label, CTA to `/new-in` ✓
- TC-02: Filter producing zero results → uppercase heading + muted text + styled CTA ✓
- TC-03/04: Non-empty states render normally ✓

## Scope Deviations

None — all changes stayed within the planned file scope. Three eslint-disable comments added for intentional design system exemptions (aspect ratio, layout primitive fallbacks) under existing XA-0022 exemption codes.

## Outcome Contract

- **Why:** The xa-b storefront has a strong luxury-editorial design language but 4 pages/components break the brand immersion: cart page (no product images, rounded corners), department landing (text-only, no visual engagement), product cards (no "New In" badge), and empty states (plain text). These weaken the conversion funnel and brand perception.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All 4 design gaps resolved — cart thumbnails with sharp-edge styling, department landing visual cards, New In badge on product cards, styled empty states — using xa-b achromatic design language.
- **Source:** operator
