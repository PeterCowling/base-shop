# SEO

## AI Product Catalogue

The template app exposes a machine‑readable product feed for AI crawlers at `/api/ai/catalog`.
It returns paginated JSON with product metadata and honours `If-Modified-Since`.

Example usage:

```bash
curl -i "https://example.com/api/ai/catalog?limit=10" \
  -H "Accept: application/json"
```

To leverage caching:

```bash
curl -i "https://example.com/api/ai/catalog" \
  -H "If-Modified-Since: <timestamp>"
```

## Regenerating sitemaps

`sitemap.xml` is generated from the files in `src/app/sitemap.ts`. When products
or shop settings change, rebuild the app to refresh the sitemap:

```bash
pnpm --filter @acme/template-app build
# for a specific shop:
pnpm --filter @apps/<shop-id> build
```

During development, requesting `/sitemap.xml` will always serve the latest data.
