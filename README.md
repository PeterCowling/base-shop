// README.md

# Base-Shop

Requires **Node.js >=20** and **pnpm 10.12.1**.  
See [docs/install.md](docs/install.md) for installation instructions and [doc/setup.md](doc/setup.md) for full setup and CI guidance.

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

## Security Headers

The root middleware applies [next-secure-headers](https://www.npmjs.com/package/next-secure-headers) to every request with:

- **Content-Security-Policy** – limits all resources to this origin (`default-src 'self'`, `base-uri 'self'`, `object-src 'none'`, `form-action 'self'`, `frame-ancestors 'none'`).
- **Strict-Transport-Security** – `max-age=31536000; includeSubDomains; preload` to enforce HTTPS.
- **X-Frame-Options** – `DENY` to block iframe embedding.
- **Referrer-Policy** – `no-referrer`.
- **X-Content-Type-Options** and **X-Download-Options** – `nosniff` and `noopen`.


## Installation

See [docs/install.md](docs/install.md) for setup and quickstart instructions.

## Architecture

See [docs/architecture.md](docs/architecture.md) for a component layer overview.

## Contributing

See [docs/contributing.md](docs/contributing.md) for contribution guidelines.

## Shop maintenance

See [doc/upgrade-preview-republish.md](doc/upgrade-preview-republish.md) for guidance on upgrading a shop, previewing changes and republishing.
See [doc/edit-preview-republish.md](doc/edit-preview-republish.md) for details on editing components, previewing those edits and republishing.
See [docs/upgrade-flow.md](docs/upgrade-flow.md) for version tracking, the diff API, using previews and republishing or rolling back upgrades.

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

Inventory can be round-tripped as JSON or CSV using the `inventory` CLI, which wraps the CMS API.

Export inventory:

```bash
pnpm inventory export demo --file inventory.csv
pnpm inventory export demo --file inventory.json
```

Import inventory:

```bash
pnpm inventory import demo --file inventory.csv
pnpm inventory import demo --file inventory.json
```

The underlying API endpoints remain available if you prefer using `curl`.

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
- `SENDGRID_MARKETING_KEY` – API key for SendGrid marketing endpoints (contact management and segments)
- `RESEND_API_KEY` – API key for Resend when using the Resend provider (requires `emails.send`, `contacts.write`, `contacts.read`, and `segments.read` scopes)
- `SENDGRID_WEBHOOK_PUBLIC_KEY` – public key to verify SendGrid event webhook signatures
- `RESEND_WEBHOOK_SECRET` – secret used to verify Resend webhook signatures

SendGrid and Resend can be configured to POST event webhooks to:

- `/api/marketing/email/provider-webhooks/sendgrid?shop=<SHOP_ID>`
- `/api/marketing/email/provider-webhooks/resend?shop=<SHOP_ID>`

Both endpoints verify the signatures using the environment variables above and
map delivered, open, click, unsubscribe and bounce events to internal analytics.

## Marketing Automation

See [packages/email/marketing-automation.md](packages/email/marketing-automation.md) for details on scheduling campaigns, building segments and retrieving analytics.

The scaffolded `.env` also includes generated placeholders for `NEXTAUTH_SECRET`
and `PREVIEW_TOKEN_SECRET`. Replace all placeholders with real values or supply
them via your CI's secret store. Missing variables will cause the CLI to exit
before running.

## Google Apps Script

Apps Script code lives under `apps-script/` and compiles with its own `tsconfig.json`.
Next.js projects exclude this folder to avoid type conflicts with DOM typings.

## Notes

See [docs/lighthouse.md](docs/lighthouse.md) for running Lighthouse audits.
