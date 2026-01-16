Type: Guide
Status: Active
Domain: CochlearFit
Last-reviewed: 2025-12-28

# CochlearFit customer purchase flow

This guide describes how a customer can shop and purchase a headband in the
CochlearFit app, including alternate entry points.

## Entry points (start here)
- Home page `/{lang}` (root `/` redirects to `/en`)
  - "Shop headbands" CTA -> `/{lang}/shop`
  - Featured product cards -> `/{lang}/product/retention-headband`
  - Pattern chips on product cards -> `/{lang}/patterns/{pattern}`
- Shop page `/{lang}/shop`
  - Product card -> `/{lang}/product/retention-headband`
  - Pattern chips -> `/{lang}/patterns/{pattern}`
- Patterns index `/{lang}/patterns`
  - Pattern tile -> `/{lang}/patterns/{pattern}`
  - "Shop headbands" CTA -> `/{lang}/shop`
- Pattern detail `/{lang}/patterns/{pattern}`
  - "Shop this pattern" CTA -> `/{lang}/product/retention-headband?pattern={pattern}`
- Direct product link `/{lang}/product/retention-headband`
  - Optional preselect params: `size`, `material`, `pattern`
    - Example: `?size=adult&material=classic&pattern=dinosaur`
- Cart icon `/{lang}/cart` (if items are already in the cart)

## Purchase flow (from the product page)
1. Choose size (Kids, Adult, XL).
   - Optional: open "How to measure" to view the sizing guide.
2. Optional: open the device setup details to capture brand and wearing style.
3. Choose material (Classic Cotton or Sport Knit are purchasable now; other
   materials show as unavailable).
4. Choose a pattern:
   - Open the pattern picker drawer, or
   - Select a popular pattern chip
5. Set quantity.
6. Select "Add to cart".
   - Enabled only when size, material, and pattern are selected and the variant
     is in stock.
   - Selections update the URL query string so the link can be shared.
7. Go to the cart using the cart icon.
8. Review items, update quantities, or remove items.
9. Select "Checkout" to go to `/{lang}/checkout`.
10. Review the order summary and select "Pay".
    - The app creates a Stripe Checkout session and redirects to Stripe.

## After checkout
- Success: Stripe redirects to `/{lang}/thank-you?session_id=...`. The page
  fetches the session and displays status and totals.
- Cancel: Stripe redirects to `/{lang}/checkout`.

## Notes
- Cart contents persist in local storage, so returning customers can go straight
  to the cart and checkout.
- If a fully selected configuration is unavailable or out of stock, the product
  page shows a "Notify me" form instead of enabling checkout.
- If behavior in this guide conflicts with the code, treat the code as
  canonical and update this guide.

## Primary code entrypoints
- apps/cochlearfit/src/app/[lang]/page.tsx
- apps/cochlearfit/src/app/[lang]/shop/page.tsx
- apps/cochlearfit/src/app/[lang]/patterns/page.tsx
- apps/cochlearfit/src/app/[lang]/patterns/[pattern]/page.tsx
- apps/cochlearfit/src/app/[lang]/product/[slug]/page.tsx
- apps/cochlearfit/src/components/ProductDetail.tsx
- apps/cochlearfit/src/components/cart/CartContents.tsx
- apps/cochlearfit/src/components/cart/CartSummary.tsx
- apps/cochlearfit/src/components/checkout/CheckoutPanel.tsx
- apps/cochlearfit/src/components/checkout/ThankYouPanel.tsx
- apps/cochlearfit-worker/src/index.ts
