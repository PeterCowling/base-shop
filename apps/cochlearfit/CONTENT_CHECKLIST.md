# Content checklist

You can swap the following without code changes elsewhere:

- UI copy and translations: `apps/cochlearfit/i18n/en.json`, `apps/cochlearfit/i18n/it.json`, `apps/cochlearfit/i18n/es.json`, `apps/cochlearfit/i18n/de.json`
- Product catalogue data (titles/descriptions/bullets/media ordering): `data/shops/cochlearfit/products.json`
- Product stock levels: `data/shops/cochlearfit/inventory.json`
- Variant pricing + Stripe price IDs: `data/shops/cochlearfit/variants.json`
- Product images (uploaded media): `data/shops/cochlearfit/uploads/*` (synced into `apps/cochlearfit/public/uploads/cochlearfit/*` at dev/build time)
- Site meta and contact info: `apps/cochlearfit/src/lib/site.ts`
