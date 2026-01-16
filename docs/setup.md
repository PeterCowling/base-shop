Type: Guide
Status: Active
Domain: Repo
Last-reviewed: 2026-01-16

# Project Setup (Agent Runbook)

Audience: agents only. Follow `AGENTS.md` for git safety and test scoping.

## Prerequisites

- **Node.js** v20 or newer
- **pnpm** v10 (repo uses pnpm@10.12.1)
- `DATABASE_URL` in `.env` pointing to a PostgreSQL database. See [environment variable reference](./.env.reference.md) for the full list of required keys and [plugin environment variables](./plugins.md) for provider credentials.

See [Next.js configuration](./nextjs-config.md) for Cloudflare-specific framework options.

Example `.env` entry:

```env
DATABASE_URL="postgres://user:password@localhost:5432/shop"
```

Run migrations and seed data:

```bash
pnpm --filter @acme/platform-core exec prisma migrate dev
pnpm --filter @acme/platform-core run prisma:generate
pnpm --filter @acme/platform-core exec prisma db seed
```

Inventory fixtures come from `data/shops/*/inventory.json` and compute `variantKey` automatically. Run `pnpm --filter @acme/platform-core exec prisma db seed -- --skip-inventory` to skip seeding inventory.

`postinstall` runs `prisma generate` automatically.

If `DATABASE_URL` is unset, the platform falls back to an in-memory test stub.

For a one-liner that scaffolds a shop, validates the environment, and starts the dev server:

```bash
pnpm quickstart-shop --id demo --theme base --template template-app --auto-plugins --auto-env --presets --seed-full
```

`--auto-plugins` selects any detected provider plugins, `--auto-env` populates required environment variables with placeholders, and `--presets` applies default navigation, pages, and a GitHub Actions workflow.

`quickstart-shop` runs `pnpm -r build` automatically before seeding or launching the dev server, so a manual workspace build is not required.

Add `--seed` to copy sample products and inventory. Use `--seed-full` to also copy `shop.json`, navigation defaults, page templates, and settings so the shop is immediately populated. Pass `--pages-template <name>` to apply predefined page layouts (`hero`, `product-grid`, `contact`). The script also accepts `--config <file>` to prefill options and skip prompts:

```bash
pnpm quickstart-shop --config ./shop.config.json --seed-full
```

Example `shop.config.json`:

```json
{
  "id": "demo",
  "theme": "base",
  "template": "template-app",
  "payment": ["stripe"],
  "shipping": ["ups"],
  "navItems": [{ "label": "Home", "href": "/" }],
  "pages": [{ "slug": "about", "title": "About Us" }]
}
```

## 1. Create a shop

```bash
pnpm init-shop
```

`init-shop` launches an interactive configurator that collects:

- shop ID
- display name
- logo URL
- contact email
- shop type (`sale` or `rental`)
- theme and template
- payment and shipping providers (selected from a guided list of available providers)
- navigation links (label + URL pairs)
- basic pages (slug and title) to scaffold
- theme token overrides (`token=value` pairs)
- environment variables like Stripe keys and CMS credentials

Passing `--defaults` tells the configurator to prefill navigation links and pages
from the selected template's `shop.json` when those fields exist. Any missing
entries fall back to interactive prompts.

After answering the prompts the configurator scaffolds `apps/shop-<id>` and writes the answers to `apps/shop-<id>/.env`.
The initializer also respects analytics/lead toggles: set `--analytics off` or `--lead-capture off` (or edit `settings.json` after scaffolding) to keep signals disabled until keys are configured.
During `init-shop`, the starter pages include Consent + Newsletter/Contact blocks so new shops launch with wiring visible; leave analytics/lead toggles off until ready to supply IDs/endpoints.
If analytics is enabled, ensure `NEXT_PUBLIC_GA4_ID` and `GA_API_SECRET` are provided. If lead capture is enabled, set `leadCapture.endpoint` (or leave it off for local JSONL persistence only).
Starter pages now include Consent + Newsletter/Contact blocks automatically; keep analytics/lead toggles off until IDs/endpoints are ready, then re-publish.

To skip the theme prompts, provide overrides via flags:

```bash
pnpm init-shop --brand "#663399" --tokens ./my-tokens.json
```

`--brand` sets the primary brand color and `--tokens` merges additional token overrides from a JSON file.

For deeper customization, import design tokens from common sources like Figma or Style Dictionary, or start with theme presets tailored to a specific vertical to avoid editing each value by hand.

To populate the new shop with sample data, run `pnpm init-shop --seed`. Use `--seed-full` to also copy `shop.json`, navigation defaults, page templates, and settings. Provide `--pages-template <name>` to copy predefined page layouts (`hero`, `product-grid`, `contact`). Use `pnpm init-shop --defaults` to apply preset nav links and pages from the
selected template without prompting for them.
Add `--auto-env` to skip prompts for provider environment variables. The configurator writes
`TODO_*` placeholders to the new shop's `.env` file; replace them with real
secrets before deploying.
To prefill answers from an existing file, supply `--env-file <path>`.
Keys in the file are merged before prompting—any variables already present are
written directly to the generated `.env` and prompts for them are skipped. After
validation the configurator warns about unused entries or missing required variables.
To reuse answers across runs, create `profiles/<name>.json` and run
`pnpm init-shop --profile <name>`. Profile values prefill the configurator. Combine
with `--skip-prompts` to accept defaults for remaining questions and run
non-interactively.

Once scaffolded, use the CMS [Page Builder](./cms.md#page-builder) to lay out pages. The shop dashboard now
includes quick actions for staging upgrades and requesting a rollback—use **Upgrade & preview** to run the templating script and
review changes at `/cms/shop/<id>/upgrade-preview`, or **Rollback to previous version** to restore the last published template
without leaving the CMS. See [Upgrade & rollback workflows](./cms.md#upgrade--rollback-workflows) for details.

### Analytics & lead capture switches

- Toggle analytics per shop in `settings.json` → `analytics.enabled` (provider/id set when ready). Consent must still be `true` for browser beacons.
- Lead capture is gated by `leadCapture.enabled`; submissions persist to `data/shops/<id>/leads.jsonl` or forward to a configured `endpoint`.
- The client SDK `@platform-core/analytics/client` is used by storefront beacons; no app changes needed when toggling these flags.

### Rental shops

Choosing `rental` as the shop type enables additional workflows:

- Define rental prices in `data/rental/pricing.json` and currency conversion
  rates in `data/rental/exchangeRates.json`.
- Set `rentalInventoryAllocation` and any `rentalSubscriptions` in the shop's
  `shop.json` when stock reservations or subscription plans are required.
- Configure deposit release by setting `DEPOSIT_RELEASE_ENABLED=true` and
  `DEPOSIT_RELEASE_INTERVAL_MS` in the generated `.env` file. Run
  `pnpm release-deposits` to process refunds on demand.
- Ensure `coverageIncluded` or coverage codes are set in shop settings when
  offering damage coverage at checkout.

For automated scripts, call `pnpm create-shop <id>` with flags:

```bash
pnpm create-shop <id> [--type=sale|rental] [--theme=name] [--template=name] [--payment=p1,p2] [--shipping=s1,s2] [--name=value] [--logo=url] [--contact=email] [--seed] [--config=path]
```

- `--type` – choose between a standard sales shop or a rental shop (default `sale`).
- `--theme` – name of a theme under `packages/themes`. Omit to be prompted with a list.
- `--template` – which starter app to clone from `packages/`. Omit to be prompted with a list.
- `--payment` – comma‑separated payment providers to configure.
- `--shipping` – comma‑separated shipping providers to configure.
- `--name` – display name for the shop.
- `--logo` – URL of the shop logo.
- `--seed` – copy sample `products.json` and `inventory.json` into the new shop.
- `--seed-full` – additionally copy `shop.json`, navigation defaults, page templates, and `settings.json`.
- `--contact` – contact email for the shop.
- `--config` – path to a JSON or TS file exporting options. Values from the file prefill the configurator and skip prompts.

Example configuration file:

```json
{
  "type": "sale",
  "theme": "base",
  "template": "template-app",
  "payment": ["stripe"],
  "shipping": ["ups"],
  "name": "Demo Shop",
  "logo": "https://example.com/logo.png",
  "contactInfo": "demo@example.com"
}
```

Run with:

```bash
pnpm create-shop demo --config ./shop.config.json
```

### Example configurator run

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
Nav label (leave empty to finish): Home
Nav URL: /
Nav label (leave empty to finish): Shop
Nav URL: /shop
Nav label (leave empty to finish):
Page slug (leave empty to finish): about
Page title: About Us
Page slug (leave empty to finish):
Theme token override (key=value, blank to finish): color.primary=#ff0000
Theme token override (key=value, blank to finish):
Scaffolded apps/shop-demo
```

## 2. Review environment variables

The configurator captures common environment variables and writes them to `apps/shop-<id>/.env`.

After scaffolding, the configurator writes both `.env` and `.env.template` to `apps/shop-<id>/`.
The template lists all variables required by the selected providers. When `--auto-env` is used,
`.env` contains placeholder values like `TODO_API_KEY`. Supplying `--env-file` copies matching keys
from that file, and `--vault-cmd <cmd>` invokes the given command with each variable name to retrieve
secrets from an external vault. Placeholders and missing variables must be replaced with real
credentials before deployment.

The configurator validates the environment immediately. Rerun the check manually any time after editing:

```bash
pnpm validate-env <id>
```

`validate-env` parses the `.env` file and exits with an error if a required variable is missing or malformed.

## 3. Run the shop

Start the development server for the newly created shop:

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

During `init-shop`, the configurator lists detected plugins. Selected plugins are added to the new shop's `package.json` and the configurator prompts for any required environment variables.

To add a plugin manually, place it in the `packages/plugins` directory (e.g. `packages/plugins/paypal`) and export a default plugin object. After restarting the CMS, enable and configure the plugin under **CMS → Plugins**.

Some plugins require additional environment variables (for example Stripe API keys). Add these to the shop's `.env` file and rerun `pnpm validate-env <id>` before using the plugin.

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

See [machine](./machine.md#deposit-release-service) for more details and configuration options.

## 9. Troubleshooting

- **"Theme 'X' not found" or "Template 'Y' not found"** – ensure the names match directories in `packages/themes` or `packages/`.
- **`validate-env` fails** – verify `apps/shop-<id>/.env` contains all variables listed in the error. Missing values will stop the script.
- **Node or pnpm version errors** – confirm Node.js >=20 and pnpm 10.x. Version mismatches can cause dependency resolution issues.
- **`pnpm dev` throws an `array.length` error** – see `docs/troubleshooting.md` for steps to capture detailed logs and resolve the issue.
