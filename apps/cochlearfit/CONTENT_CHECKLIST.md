# Content checklist

You can swap the following without code changes elsewhere:

- Copy and translations: `apps/cochlearfit/i18n/en.json`, `apps/cochlearfit/i18n/it.json`
- Product names, descriptions, and care/compatibility notes (via translation keys in the files above)
- Product images (SVGs): `apps/cochlearfit/public/images/*.svg`
- Pricing, stock flags, and Stripe price IDs: `apps/cochlearfit/src/data/products.ts`
- Site meta and contact info: `apps/cochlearfit/src/lib/site.ts`

When updating Stripe price IDs, mirror the same changes in `apps/cochlearfit-worker/src/index.ts`.
