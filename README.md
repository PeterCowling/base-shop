// README.md

# Base-Shop

A multilingual, hybrid-rendered e-commerce demo built with **Next.js 15** and **React 19**. The full technical roadmap is documented in [./IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md).

## Getting Started

Requires **Node.js >=20** and **pnpm 10.12.1**. See [docs/install.md](docs/install.md) for installation instructions and [docs/setup.md](docs/setup.md) for full setup and CI guidance.

Run `pnpm init-shop` to scaffold a new shop. The configurator lists available plugins and, when invoked with `--auto-env`, writes `TODO_*` placeholders for any required environment variables so teams can fill them in later.

### Testing

Cypress fixtures live under `test/data/shops`. Override this path by setting the `TEST_DATA_ROOT` environment variable.

Seed data before running the Cypress suite:

```bash
pnpm tsx packages/platform-core/prisma/seed.ts
pnpm e2e
```

## Key Features

- Stripe handles deposits via escrow sessions.
- Returned deposits can be refunded automatically by the deposit release service. See [docs/machine.md](docs/machine.md).
- Inventory lives in JSON files under data/shops/\*/inventory.json.
- Low-stock alerts email the configured recipient (`STOCK_ALERT_RECIPIENT`) when inventory falls below its threshold.
- Rental pricing matrix defined in data/rental/pricing.json with duration discounts and damage-fee rules.
- Return logistics options stored in data/return-logistics.json.
- RBAC: ShopAdmin currently manages all shops. See [docs/permissions.md](docs/permissions.md) for default roles and permissions.
- Product and recommendation carousels adapt their visible item count to the screen width, clamped between caller-provided `minItems` and `maxItems` values.

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

## Database

The project uses [Prisma](https://www.prisma.io/) with PostgreSQL as the
primary datastore. The schema includes:

- `Shop` – JSON shop configuration.
- `Page` – per-shop pages tied to a `Shop`.
- `RentalOrder` – rental lifecycle data with unique constraints on
  `(shop, sessionId)` and `(shop, trackingNumber)`; indexed by
  `customerId`. See [docs/orders.md](docs/orders.md).
- `SubscriptionUsage` – monthly shipment counts with a unique
  `(shop, customerId, month)` tuple. See
  [docs/subscription-usage.md](docs/subscription-usage.md).
- `CustomerProfile` and `CustomerMfa` – customer metadata and MFA
  secrets keyed by `customerId`. See
  [docs/customer-profiles.md](docs/customer-profiles.md) and
  [docs/mfa.md](docs/mfa.md).
- `User` – application users with a unique `email`. See
  [docs/users.md](docs/users.md).
- `ReverseLogisticsEvent` – return tracking events indexed by `shop`. See
  [docs/reverse-logistics-events.md](docs/reverse-logistics-events.md).

## Persistence

Several repositories store data as JSON files under a common root so the demo works without a database. See [docs/persistence.md](docs/persistence.md) for details on disk fallbacks and the `DATA_ROOT` environment variable.

## Contributing

See [docs/contributing.md](docs/contributing.md) for contribution guidelines.

## Shop maintenance

See [docs/upgrade-preview-republish.md](docs/upgrade-preview-republish.md) for guidance on upgrading a shop, previewing changes and republishing. See [docs/edit-preview-republish.md](docs/edit-preview-republish.md) for details on editing components, previewing those edits and republishing. See [docs/upgrade-flow.md](docs/upgrade-flow.md) for version tracking, the diff API, using previews and republishing or rolling back upgrades.

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

`variantAttributes` is a free-form map of strings (e.g. `size`, `color`) that differentiates variants under the same product. Only the keys present are written to CSV export.

### Stock alerts

Set `STOCK_ALERT_RECIPIENT` in the shop's `.env`. When `writeInventory` persists items and an item's `quantity` is less than or equal to its `lowStockThreshold`, an email is sent to the configured recipient summarising the affected SKUs.

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

Configuration and usage examples for both are documented in [docs/machine.md](docs/machine.md).

# Environment Variables

After running `pnpm create-shop <id>`, the CLI generates `.env` and `.env.template` under `apps/shop-<id>/`, validates the variables, and can pull secrets from an external vault by passing `--vault-cmd <cmd>` (the command receives each variable name). Configure the resulting `.env` with:

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
- `SENDGRID_API_KEY` – optional API key for SendGrid when using the SendGrid provider
- `SENDGRID_MARKETING_KEY` – API key for SendGrid marketing endpoints (contact management and segments)
- `RESEND_API_KEY` – API key for Resend when using the Resend provider (requires `emails.send`, `contacts.write`, `contacts.read`, and `segments.read` scopes)
- `SENDGRID_WEBHOOK_PUBLIC_KEY` – public key to verify SendGrid event webhook signatures
- `RESEND_WEBHOOK_SECRET` – secret used to verify Resend webhook signatures

### Sanity blog plugin variables

The `cmsEnvSchema` and each app's `.env.production` file include **DO NOT REMOVE** comments with placeholder Sanity credentials:

- `SANITY_PROJECT_ID`
- `SANITY_API_VERSION`
- `SANITY_DATASET`
- `SANITY_API_TOKEN`
- `SANITY_PREVIEW_SECRET`

These dummy values keep the build working until a real Sanity project is configured. Replace them with production credentials, but do not remove the variables until a feature flag or conditional logic can skip the Sanity setup.

SendGrid and Resend can be configured to POST event webhooks to:

- `/api/marketing/email/provider-webhooks/sendgrid?shop=<SHOP_ID>`
- `/api/marketing/email/provider-webhooks/resend?shop=<SHOP_ID>`

Both endpoints verify the signatures using the environment variables above and map delivered, open, click, unsubscribe and bounce events to internal analytics.

## Marketing Automation

See [packages/email/marketing-automation.md](packages/email/marketing-automation.md) for details on scheduling campaigns, building segments and retrieving analytics.

The scaffolded `.env` also includes generated placeholders for `NEXTAUTH_SECRET` and `PREVIEW_TOKEN_SECRET`. Replace all placeholders with real values or supply them via your CI's secret store. Missing variables will cause the CLI to exit before running.

## Google Apps Script

Apps Script code lives under `apps-script/` and compiles with its own `tsconfig.json`. Next.js projects exclude this folder to avoid type conflicts with DOM typings.

## TypeScript Project References Policy

Add a project reference whenever package A imports package B. In that case, A’s
`tsconfig.json` must include:

```json
{ "references": [{ "path": "../<B>" }] }
```

Provider packages must enable project references by setting the following
compiler options in their `tsconfig.json`:

```json
{
  "composite": true,
  "declaration": true,
  "declarationMap": true,
  "rootDir": "src",
  "outDir": "dist"
}
```

The provider’s `package.json` must then point to the generated type declarations:

```json
{ "types": "dist/index.d.ts" }
```

## TSConfig path fallbacks for apps

Every app should map workspace packages to both their built `dist` output and the raw `src` files. This mirrors `apps/shop-bcd` and lets TypeScript resolve imports even when packages haven't been built.

```json
{
  "compilerOptions": {
    "paths": {
      "@acme/lib": [
        "../../packages/lib/dist/index.d.ts",
        "../../packages/lib/src/index.ts"
      ],
      "@acme/lib/*": ["../../packages/lib/dist/*", "../../packages/lib/src/*"]
    }
  }
}
```

Repeat this pattern for any other packages an app consumes to avoid missing module errors when the package hasn't been built yet.

## Troubleshooting

- If `pnpm run dev` fails with an `array.length` error, run the appropriate Codex command to retrieve detailed failure information.

## Notes

See [docs/lighthouse.md](docs/lighthouse.md) for running Lighthouse audits.

## Resolving TS2307: Cannot find module errors

TS2307 occurs when TypeScript can’t locate a module or its type declarations due to misconfigured paths, missing type definitions, or package issues.

- Missing type definitions for third-party packages: installing `@types/your-lib` or creating a `.d.ts` file resolves this.
- Incorrect import paths for local files: verify the file exists and use the correct relative path without the `.ts`/`.tsx` extension.
- Misconfigured module resolution: ensure `baseUrl` and `paths` in `tsconfig.json` align with your folder structure.
- Verify module existence: always check that the module is present locally or in `node_modules`.

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@utils/*": ["src/utils/*"]
    }
  }
}
```

Remind contributors to install missing type definitions and avoid disabling type checking with `skipLibCheck` unless absolutely necessary.
