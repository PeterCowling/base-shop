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

## Running SEO audits

Run an automated Lighthouse audit focusing on SEO using the helper script:

```bash
pnpm run seo:audit http://localhost:3000
```

The optional first argument is the URL to audit (defaults to `http://localhost:3000`).
An HTML report is written to `seo-report.html` in the current working directory.

The CMS API validates audit URLs and only accepts hosts on an allow‑list to avoid
server‑side request forgery. For additional protection, consider running
Lighthouse in a sandbox or routing requests through a safelist proxy.
