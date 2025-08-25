# Project Setup

## Prerequisites

- **Node.js** v20 or newer
- **pnpm** v10 (repo uses pnpm@10.12.1)

For a one-liner that scaffolds a shop, validates the environment, and starts the dev server:

```bash
pnpm quickstart-shop --id demo --theme base --template template-app --payment stripe --shipping ups
```

## 1. Create a shop

```bash
pnpm init-shop
```

`init-shop` launches an interactive wizard that collects:

- shop ID
- display name
- logo URL
- contact email
- shop type (`sale` or `rental`)
- theme and template
- payment and shipping providers (selected from a guided list of available providers)

After answering the prompts the wizard scaffolds `apps/shop-<id>` and generates an `.env` file inside the new app.

Once scaffolded, open the CMS and use the [Page Builder](./cms.md#page-builder) to lay out your pages.

For automated scripts you can still call `pnpm create-shop <id>` with flags:

```bash
pnpm create-shop <id> [--type=sale|rental] [--theme=name] [--template=name] [--payment=p1,p2] [--shipping=s1,s2] [--name=value] [--logo=url] [--contact=email]
```

- `--type` – choose between a standard sales shop or a rental shop (default `sale`).
- `--theme` – name of a theme under `packages/themes`. Omit to be prompted with a list.
- `--template` – which starter app to clone from `packages/`. Omit to be prompted with a list.
- `--payment` – comma‑separated payment providers to configure.
- `--shipping` – comma‑separated shipping providers to configure.
- `--name` – display name for the shop.
- `--logo` – URL of the shop logo.
- `--contact` – contact email for the shop.

### Example wizard run

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
```

## 2. Configure environment variables

Edit `apps/shop-<id>/.env` to replace placeholder secrets.

```bash
pnpm validate-env <id>
```

`validate-env` parses the `.env` file and exits with an error if any required variable is missing or malformed.
Lines that have no value after the equals sign (e.g. `MY_VAR=`) are treated as placeholders and ignored during validation, so you can leave optional variables empty until you have real credentials.

The wizard scaffolds placeholders for common variables (and generates random values for `NEXTAUTH_SECRET`, `SESSION_SECRET` and `PREVIEW_TOKEN_SECRET`):

- `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` / `STRIPE_WEBHOOK_SECRET` – Stripe API keys and webhook signature secret
- `CART_COOKIE_SECRET` – secret for signing cart cookies (required)
- `CART_TTL` – cart expiration in seconds (default 30 days)
- `NEXTAUTH_SECRET` – session encryption secret used by NextAuth
- `SESSION_SECRET` – secret used to sign server-side sessions
- `PREVIEW_TOKEN_SECRET` – token used for preview URLs
- `CMS_SPACE_URL` / `CMS_ACCESS_TOKEN` – headless CMS credentials
- `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_TOKEN` – Sanity blog configuration
- `GMAIL_USER`, `GMAIL_PASS` – credentials for email sending
- `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` – Cloudflare credentials for provisioning custom domains (server-side only)
- `DEPOSIT_RELEASE_ENABLED`, `DEPOSIT_RELEASE_INTERVAL_MS` – control automated deposit refunds (`true`/`false` to enable, interval in milliseconds; default disabled, 60 minutes)

Leave any value blank if the integration isn't needed. You can update the `.env`
file later and rerun `pnpm validate-env <id>` to confirm everything is set up.

## 3. Run the shop

Start the development server for your newly created shop:

```bash
cd apps/shop-<id>
pnpm dev
```

Open <http://localhost:3000> to view the storefront. Pages hot‑reload on save.

## 4. (Optional) Setup CI and deploy

```bash
pnpm setup-ci <id>
```

This creates `.github/workflows/shop-<id>.yml` which installs dependencies, runs lint/tests, builds the app and deploys it to Cloudflare Pages via `@cloudflare/next-on-pages`.

## 5. Install plugins

Plugins extend the platform with extra payment providers, shipping integrations or storefront widgets. The platform automatically loads any plugin found under `packages/plugins/*`.

To install a plugin, add it to the `packages/plugins` directory (e.g. `packages/plugins/paypal`) and export a default plugin object. After restarting the CMS you can enable and configure the plugin under **CMS → Plugins**.

Some plugins require additional environment variables (for example Stripe API
keys). Add these to the shop's `.env` file and rerun `pnpm validate-env <id>`
before using the plugin.

## 6. Analytics and event tracking

To send analytics events to Google Analytics and record aggregates:

1. Set the environment variables `GA_MEASUREMENT_ID` and `GA_API_SECRET` in the CMS.
2. In **CMS → Settings**, enable analytics and choose provider `ga` with the measurement ID.
3. Events will be forwarded to Google Analytics and summarized daily under `DATA_ROOT/<shop>/analytics-aggregates.json`.

Ensure these API keys are kept secret and that the app has write access to the data directory for storing aggregates.

## 7. Shipment tracking providers

Configure supported tracking providers in **CMS → Settings**. Select one or more carriers like UPS or DHL to enable order tracking in the storefront. Leaving all providers unselected disables tracking entirely, which is useful for rental or high-volume shops where shipment updates are unnecessary.

## 8. Deposit release service

Rental shops that collect deposits can automate refunds when items are returned. Run the process once with:

```bash
pnpm release-deposits
```

When a shop is scaffolded, `data/<id>/settings.json` includes a `depositService` block with `enabled: false` and `intervalMinutes: 60` (minutes).
The generated `.env` file also contains `DEPOSIT_RELEASE_ENABLED` and `DEPOSIT_RELEASE_INTERVAL_MS` placeholders for the background service.

To keep it running on a schedule, import `startDepositReleaseService` from `@acme/platform-machine` and optionally pass a custom interval (defaults to one hour). The service scans every shop under `data/shops/*`, issues Stripe refunds and marks orders as refunded.

See [doc/machine.md](./machine.md#deposit-release-service) for more details and configuration options.

## 9. Troubleshooting

- **"Theme 'X' not found" or "Template 'Y' not found"** – ensure the names match directories in `packages/themes` or `packages/`.
- **`validate-env` fails** – verify `apps/shop-<id>/.env` contains all variables listed in the error. Missing values will stop the script.
- **Node or pnpm version errors** – check you are running Node.js ≥20 and pnpm 10.x. Version mismatches can cause dependency resolution issues.
