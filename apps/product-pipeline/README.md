# Product Pipeline

Standalone product sourcing pipeline UI + engine. This app deploys to Cloudflare Pages as `product-pipeline` and talks to a dedicated Worker API.

## Local development

```bash
pnpm --filter @apps/product-pipeline dev
```

## Build (static export)

```bash
OUTPUT_EXPORT=1 pnpm --filter @apps/product-pipeline build
```

## Notes

- The UI is static and fetches data from the Worker API.
- Access control is expected via Cloudflare Access (single-user key) in production.
- Cloudflare bindings are defined in `apps/product-pipeline/wrangler.toml`.
