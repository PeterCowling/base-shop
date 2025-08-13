// README.md

# Base-Shop

Requires **Node.js >=20** and **pnpm 10.12.1**.  
See [doc/setup.md](doc/setup.md) for full setup and CI guidance.

Key points:

- Stripe handles deposits via escrow sessions.
- Returned deposits can be refunded automatically by the deposit release service. See [doc/machine.md](doc/machine.md).
- Inventory lives in JSON files under data/shops/\*/inventory.json.
- Low-stock alerts email the configured recipient (`STOCK_ALERT_RECIPIENT`) when inventory falls below its threshold.
- Rental pricing matrix defined in data/rental/pricing.json with duration discounts and damage-fee rules.
- Return logistics options stored in data/return-logistics.json.
- RBAC: ShopAdmin currently manages all shops. See [doc/permissions.md](doc/permissions.md) for default roles and permissions.
- Product and recommendation carousels adapt their visible item count to the screen width, clamped between caller-provided `minItems` and `maxItems` values.
  A multilingual, hybrid-rendered e-commerce demo built with **Next.js 15** and **React 19**.
  The full technical roadmap is documented in [./IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md).

---

## Getting Started

1. **Initialize a shop**

   ```bash
   pnpm init-shop
   # optionally generate a GitHub Actions workflow
   pnpm setup-ci <id>
   ```

   `init-shop` launches an interactive wizard that asks for the shop ID, display name, logo URL,
   contact email, shop type (`sale` or `rental`), and which theme and template to use. Payment and
   shipping providers are chosen from guided lists of available providers. It then
   scaffolds `apps/shop-<id>` and writes an `.env` file inside the new app. Edit the `.env` file to
   provide real secrets (see [Environment Variables](#environment-variables)). For scripted
   setups you can still call `pnpm create-shop <id>` and pass flags like `--name`, `--logo` and
   `--contact` to skip those prompts.

   ```bash
   pnpm create-shop <id> --name="Demo Shop" --logo=https://example.com/logo.png \
     --contact=demo@example.com
   ```

2. **Run the app**

   ```bash
   pnpm validate-env <id>
   cd apps/shop-<id>
   pnpm dev
   ```

   Open http://localhost:3000 to view the site. Pages hot-reload on save.

3. _(Optional)_ Each Next.js app must provide its own `postcss.config.cjs` that forwards to the repo root configuration so Tailwind resolves correctly. After updating Tailwind or any CSS utilities, run `pnpm tailwind:check` to verify the build.

### Example

```bash
pnpm init-shop
? Shop ID … demo
? Display name … Demo Shop
? Logo URL … https://example.com/logo.png
? Contact email … demo@example.com
? Shop type (sale or rental) … sale
? Theme › base
? Template › template-app
Available payment providers:
  1) stripe
  2) paypal
Select payment providers by number (comma-separated, empty for none): 1
Available shipping providers:
  1) dhl
  2) ups
Select shipping providers by number (comma-separated, empty for none): 2
Scaffolded apps/shop-demo

pnpm setup-ci demo  # optional
pnpm validate-env demo
cd apps/shop-demo
pnpm dev
```

### Useful targets

Script What it does
pnpm dev Local dev server (next dev)
pnpm build Production build (next build)
pnpm preview Edge preview with Wrangler
pnpm lint ESLint + Prettier
pnpm test Jest unit tests
pnpm e2e Cypress e2e suite
pnpm test:coverage Jest tests with coverage summary
pnpm run lh:checkout Lighthouse audit for /en/checkout
pnpm chromatic Publish Storybook to Chromatic
pnpm check:tailwind-preset Ensure Tailwind preset resolves
pnpm tailwind:check Validate Tailwind build

# Requires `CHROMATIC_PROJECT_TOKEN` to be set

Example summary:

```
------------------|---------|----------|---------|---------|-------------------
File              | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
------------------|---------|----------|---------|---------|-------------------
All files         |   100   |      100 |   100   |   100   |
------------------|---------|----------|---------|---------|-------------------
```

Project Structure
src/
├─ app/ // Next.js App Router
│ ├─ [lang]/… // i18n routes (en, de, it)
│ └─ api/… // Edge Route Handlers
├─ components/ // UI building blocks
├─ contexts/ // React context providers
├─ lib/ // Server-side helpers (Stripe, products, etc.)
└─ tests/ // Jest + Cypress
public/ // Static assets
Learn More
Next.js Docs – https://nextjs.org/docs

Interactive tutorial – https://nextjs.org/learn

GitHub repo – https://github.com/vercel/next.js

Deploy
The project is CI-deployed to Cloudflare Pages via
@cloudflare/next-on-pages.

## Svelte integration

This repo includes a minimal example plugin located at `packages/svelte-tool`.
The plugin is registered via `svelte.config.ts` and uses the
`vite-plugin-svelte` Node plugin installed as a dev dependency.

To experiment with Svelte:

```bash
pnpm install
pnpm build
```

## Storybook

See [doc/storybook.md](doc/storybook.md) for details on running Storybook,
executing accessibility tests and publishing Chromatic previews.

## CMS Guide

See [doc/cms.md](doc/cms.md) for an overview of the CMS navigation,
switching shops and admin-only routes. Newcomers can follow the
[Page Builder](doc/cms.md#page-builder) section to learn how to add,
rearrange and publish blocks.

### Theme overrides

The CMS theme editor lets admins customize design tokens per shop. Tokens are
grouped by purpose (Background, Text, Accent) and each color token displays a
preview swatch. Clicking a swatch focuses its corresponding field, where a color
picker enables quick overrides. Save the form to persist any changes.

## Inventory Management

### Variant schema

Inventory items live in `data/shops/<shop>/inventory.json` and follow this structure:

```json
{
  "sku": "green-sneaker-41",
  "productId": "green-sneaker",
  "variantAttributes": { "size": "41", "color": "green" },
  "quantity": 2,
  "lowStockThreshold": 1
}
```

`variantAttributes` is a free-form map of strings (e.g. `size`, `color`) that differentiates
variants under the same product. Only the keys present are written to CSV export.

### Stock alerts

Set `STOCK_ALERT_RECIPIENT` in the shop's `.env`. When `writeInventory` persists items and
an item's `quantity` is less than or equal to its `lowStockThreshold`, an email is sent to the
configured recipient summarising the affected SKUs.

```bash
STOCK_ALERT_RECIPIENT=alerts@example.com
```

### Import / export

Inventory can be round-tripped as JSON or CSV through the CMS API.

Export inventory:

```bash
curl "http://localhost:3000/cms/api/data/demo/inventory/export?format=csv" -o inventory.csv
curl "http://localhost:3000/cms/api/data/demo/inventory/export" -o inventory.json
```

Import inventory:

```bash
curl -X POST -F "file=@inventory.csv;type=text/csv" http://localhost:3000/cms/api/data/demo/inventory/import
curl -X POST -F "file=@inventory.json;type=application/json" http://localhost:3000/cms/api/data/demo/inventory/import
```

CSV files use headers to define variant attributes:

```csv
sku,productId,size,color,quantity,lowStockThreshold
green-sneaker-41,green-sneaker,41,green,2,1
```

JSON import/export is an array of inventory objects matching the schema shown above.

## Machine utilities

The `@acme/platform-machine` package bundles a small set of runtime helpers:

- **Deposit release service** – scans rental orders and issues Stripe refunds for returned items on a schedule.
- **Finite State Machine** – a minimal, type-safe state machine for UI or service workflows.

Configuration and usage examples for both are documented in [doc/machine.md](doc/machine.md).

# Environment Variables

After running `pnpm create-shop <id>`, configure `apps/shop-<id>/.env` with:

- `STRIPE_SECRET_KEY` – secret key used by the Stripe server SDK
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` – public key for the Stripe client SDK
- `STRIPE_WEBHOOK_SECRET` – secret used to verify Stripe webhook signatures
- `CMS_SPACE_URL` – base URL of the CMS API
- `CMS_ACCESS_TOKEN` – access token for pushing schemas
- `CHROMATIC_PROJECT_TOKEN` – token for publishing Storybook previews
- `STOCK_ALERT_RECIPIENT` – email address that receives low stock alerts; leave unset to disable notifications
- `CART_COOKIE_SECRET` – secret used to sign cart cookies (required)
- `CART_TTL` – cart expiration in seconds (defaults to 30 days)
- `DEPOSIT_RELEASE_ENABLED` – `true` or `false` to toggle automated deposit refunds
- `DEPOSIT_RELEASE_INTERVAL_MS` – interval in milliseconds for running the refund service
- `LOG_LEVEL` – controls logging output (`error`, `warn`, `info`, `debug`; defaults to `info`)
- `EMAIL_PROVIDER` – campaign email provider (`smtp`, `sendgrid`, or `resend`)
- `SENDGRID_API_KEY` – API key for SendGrid when using the SendGrid provider
- `RESEND_API_KEY` – API key for Resend when using the Resend provider
- `SENDGRID_WEBHOOK_PUBLIC_KEY` – public key to verify SendGrid event webhook signatures
- `RESEND_WEBHOOK_SECRET` – secret used to verify Resend webhook signatures

When using the SendGrid or Resend providers, a lightweight API request is
performed during initialization to verify the supplied API key. If the
check fails, a descriptive error is thrown.

SendGrid and Resend can be configured to POST event webhooks to:

- `/api/marketing/email/provider-webhooks/sendgrid?shop=<SHOP_ID>`
- `/api/marketing/email/provider-webhooks/resend?shop=<SHOP_ID>`

Both endpoints verify the signatures using the environment variables above and
map delivered, open, click, unsubscribe and bounce events to internal analytics.

The scaffolded `.env` also includes generated placeholders for `NEXTAUTH_SECRET`
and `PREVIEW_TOKEN_SECRET`. Replace all placeholders with real values or supply
them via your CI's secret store. Missing variables will cause the CLI to exit
before running.

## Google Apps Script

Apps Script code lives under `apps-script/` and compiles with its own `tsconfig.json`.
Next.js projects exclude this folder to avoid type conflicts with DOM typings.

## Notes

See [docs/lighthouse.md](docs/lighthouse.md) for running Lighthouse audits.
