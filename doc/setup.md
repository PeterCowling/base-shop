# Project Setup

## Prerequisites

- **Node.js** v20 or newer
- **pnpm** v10 (repo uses pnpm@10.12.1)

## 1. Create a shop

```bash
pnpm init-shop
```

`init-shop` launches an interactive wizard that collects:

- shop ID
- display name
- logo URL
- contact email
- theme and template
- payment and shipping providers (selected from a guided list of available providers)

After answering the prompts the wizard scaffolds `apps/shop-<id>` and generates an `.env` file inside the new app.

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

## 3. (Optional) Setup CI and deploy

```bash
pnpm setup-ci <id>
```

This creates `.github/workflows/shop-<id>.yml` which installs dependencies, runs lint/tests, builds the app and deploys it to Cloudflare Pages via `@cloudflare/next-on-pages`.

## 4. Install plugins

Plugins extend the platform with extra payment providers, shipping integrations or storefront widgets. The platform automatically loads any plugin found under `packages/plugins/*`.

To install a plugin, add it to the `packages/plugins` directory (e.g. `packages/plugins/paypal`) and export a default plugin object. After restarting the CMS you can enable and configure the plugin under **CMS → Plugins**.

## 5. Analytics and event tracking

To send analytics events to Google Analytics and record aggregates:

1. Set the environment variables `GA_MEASUREMENT_ID` and `GA_API_SECRET` in the CMS.
2. In **CMS → Settings**, enable analytics and choose provider `ga` with the measurement ID.
3. Events will be forwarded to Google Analytics and summarized daily under `DATA_ROOT/<shop>/analytics-aggregates.json`.

Ensure these API keys are kept secret and that the app has write access to the data directory for storing aggregates.

## Troubleshooting

- **"Theme 'X' not found" or "Template 'Y' not found"** – ensure the names match directories in `packages/themes` or `packages/`.
- **`validate-env` fails** – verify `apps/shop-<id>/.env` contains all variables listed in the error. Missing values will stop the script.
- **Node or pnpm version errors** – check you are running Node.js ≥20 and pnpm 10.x. Version mismatches can cause dependency resolution issues.
