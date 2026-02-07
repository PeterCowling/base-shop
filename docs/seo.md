Type: Guide
Status: Active
Domain: SEO
Last-reviewed: 2025-12-02

# SEO

This guide summarises the current SEO-related surfaces:

- AI product catalogue API.
- Sitemaps.
- SEO audit storage and Lighthouse helper script.

For a broader commerce picture, see `docs/commerce-charter.md`.

## AI Product Catalogue

The template app exposes a machine‑readable product feed for AI crawlers at:

- `GET /api/ai/catalog`
  - Implemented in `packages/template-app/src/app/api/ai/catalog/route.ts`.

Key behaviours:

- **Enablement**
  - The feed is controlled by per-shop settings:
    - `ShopSettings.seo.aiCatalog.enabled` must be `true`.
    - Optional `ShopSettings.seo.aiCatalog.pageSize` controls page size; defaults to 50.
    - Optional `ShopSettings.seo.aiCatalog.fields` can restrict fields to a subset of:
      - `id`, `title`, `description`, `price`, `media`.
  - If the feature is not enabled for the current shop, the route returns `404`.

- **Pagination**
  - Query params:
    - `page` (1-based, integer, default `1`).
    - `limit` (page size; overrides `aiCatalog.pageSize` when valid).
  - Response body:
    - `{ items, page, total }` where:
      - `items` is an array of selected fields for each product.
      - `page` is the current page number.
      - `total` is the total number of available items.

- **Fields and fallbacks**
  - Publications are loaded via `readRepo<ProductPublication>(shop)` from `@acme/platform-core/repositories/products.server`.
  - When no publications exist, a built-in catalogue (`PRODUCTS` from `@acme/platform-core/products`) is used as a fallback.
  - For each item:
    - `id` / `title` / `description` come from the publication.
    - `price` falls back to the SKU’s price if absent on the publication.
    - `media` falls back to the SKU’s media if absent on the publication.

- **Caching and `If-Modified-Since`**
  - The handler computes `Last-Modified` from the maximum `updated_at` across all products.
  - If the request includes a valid `If-Modified-Since` header:
    - And there are no updates since that time:
      - Responds with `304 Not Modified` and a `Last-Modified` header.
    - Otherwise:
      - Responds with `200 OK` and a JSON body plus `Last-Modified`.

- **Analytics**
  - Each request emits an `ai_crawl` analytics event via `@acme/platform-core/analytics`:
    - Includes `shop`, `page`, `status`, and `items` count.

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

## Sitemaps

Sitemaps are generated from the template app's Next.js sitemap route:

- `src/app/sitemap.ts` under `packages/template-app` (or corresponding runtime app).
- The sitemap reflects products, pages, and shop configuration for the bound `shopId`.

Refresh behaviour:

- During development:
  - Requests to `/sitemap.xml` use the latest in-memory data.
- In production builds:
  - Rebuild and redeploy the app when products or shop settings change to update the sitemap.
  - Example:

    ```bash
    pnpm --filter @acme/template-app build
    # for a specific shop app:
    pnpm --filter @apps/<shop-id> build
    ```

## SEO audits

SEO audits can be run locally and stored per shop:

- **Storage**
  - `packages/platform-core/src/repositories/seoAudit.json.server.ts` handles JSONL-based audit storage under:
    - `<DATA_ROOT>/<shop>/seo-audits.jsonl`
  - Repositories expose:
    - `readSeoAudits(shop)` – read all audit entries for a shop.
    - `appendSeoAudit(shop, entry)` – append a new audit entry.

- **Lighthouse helper**
  - `pnpm run seo:audit http://localhost:3000` runs a Lighthouse audit focused on SEO.
  - The optional first argument is the URL to audit (default `http://localhost:3000`).
  - Generates an HTML report at `seo-report.html` in the current working directory.

These audits can be ingested by dashboards or used to enrich `seo-audits.jsonl` for each shop.

## CMS SEO guardrails

- The CMS SEO page surfaces a banner of “SEO to-dos” for missing titles/descriptions, disabled AI feed, stale crawls, or stale Lighthouse audits (older than 30 days).
- Saving SEO now requires a title and description per locale; empty values are blocked with inline errors.
- SEO audit panel is anchor-linked (`#seo-audit`) so owners can jump directly from the banner and re-run Lighthouse (`pnpm run seo:audit http://localhost:3000`).
- Per-locale status chips show whether each language has both title and description populated.
- AI catalog settings include an inline preview (first 10 items) to validate the feed before enabling.
- A sitemap status panel shows `sitemap.xml` and `ai-sitemap.xml` last-modified times plus a rebuild action that hands off to your deploy pipeline.
- Rebuild webhook: set `SITEMAP_REBUILD_WEBHOOK` (or `env.SITEMAP_REBUILD_WEBHOOK`) to a CI/deploy endpoint to trigger sitemap rebuilds directly from the SEO page.
- Notification webhook: set `SEO_NOTIFY_WEBHOOK` (or `env.SEO_NOTIFY_WEBHOOK`) to a Slack/email bridge to receive SEO to-do reminders.
- Webhook payloads:
  - `POST SEO_NOTIFY_WEBHOOK` body: `{"shop":"<shop>","issues":["..."],"timestamp":"<ISO>"}`.
  - `POST SITEMAP_REBUILD_WEBHOOK` body: `{"origin":"<base-url>","reason":"seo-panel"}`.
- Recommended recipients: shop ops/marketing plus an engineering on-call to action rebuilds quickly.
- Scheduled reminders: hit `/api/seo/notify/cron` via your scheduler (daily) to auto-notify when issues persist beyond a day; notifications are cooldown-limited and retried with persistence.
- Structured data validation: server enforces valid JSON with `@context` and `@type` (Product/WebPage). Banner shows locales with invalid JSON so owners can fix before publish.
