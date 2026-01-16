# CochlearFit Headbands

Production-ready e-commerce site for CochlearFit Headbands (static Next.js export) plus a separate Cloudflare Worker for Stripe checkout.

## Local development

1. Install dependencies and build shared packages:
   ```bash
   pnpm install
   pnpm -r build
   ```
2. Run the Worker API:
   ```bash
   pnpm --filter @apps/cochlearfit-worker dev
   ```
3. Run the frontend:
   ```bash
   pnpm --filter @apps/cochlearfit dev
   ```

If the worker runs on a different host/port, set:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8788
```

## Required environment variables

### Frontend

- `NEXT_PUBLIC_API_BASE_URL` (optional): API base URL for the Worker. Leave empty when the Worker is routed under the same domain at `/api`.

### Worker (set via Wrangler)

- `STRIPE_SECRET_KEY` (secret)
- `STRIPE_WEBHOOK_SECRET` (secret)
- `SITE_URL` (string, e.g. `https://cochlearfit.example`)
- `PAGES_ORIGIN` (string, e.g. `https://cochlearfit.pages.dev`)
- `INVENTORY_AUTHORITY_URL` (string, base URL for Node inventory authority)
- `INVENTORY_AUTHORITY_TOKEN` (secret, service token for inventory validation)

Set secrets:

```bash
pnpm --filter @apps/cochlearfit-worker exec wrangler secret put STRIPE_SECRET_KEY
pnpm --filter @apps/cochlearfit-worker exec wrangler secret put STRIPE_WEBHOOK_SECRET
pnpm --filter @apps/cochlearfit-worker exec wrangler secret put INVENTORY_AUTHORITY_TOKEN
```

Set `INVENTORY_AUTHORITY_URL` in the Worker deployment environment (Cloudflare dashboard or Wrangler config) to the Node inventory authority base URL.

## Cloudflare Pages build settings

- Build command: `OUTPUT_EXPORT=1 pnpm --filter @apps/cochlearfit build`
- Output directory: `apps/cochlearfit/out`
- Redirects file: `apps/cochlearfit/public/_redirects`

## Stripe setup

1. Create Stripe products and prices for each variant (kids/adult x sand/ocean/berry for both Classic and Sport).
2. Copy the Stripe Price IDs into:
   - `apps/cochlearfit-worker/src/index.ts` (checkout source of truth)
   - `apps/cochlearfit/src/lib/catalog.ts` and `apps/cochlearfit/src/lib/cochlearfitCatalog.server.ts` (UI price/variant metadata)
3. Deploy the Worker and route `/api/*` to it in Cloudflare so the frontend can call it.

## Worker deploy

```bash
pnpm --filter @apps/cochlearfit-worker exec wrangler deploy
```

## Content checklist

See `apps/cochlearfit/CONTENT_CHECKLIST.md` for swappable copy, images, and pricing.
