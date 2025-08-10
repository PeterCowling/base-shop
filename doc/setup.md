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
Lines that have no value after the equals sign (e.g. `MY_VAR=`) are treated as placeholders and ignored during validation, so you can leave optional variables empty until you have real credentials.

## 3. (Optional) Setup CI and deploy

```bash
pnpm setup-ci <id>
```

This creates `.github/workflows/shop-<id>.yml` which installs dependencies, runs lint/tests, builds the app and deploys it to Cloudflare Pages via `@cloudflare/next-on-pages`.

## Troubleshooting

- **"Theme 'X' not found" or "Template 'Y' not found"** – ensure the names match directories in `packages/themes` or `packages/`.
- **`validate-env` fails** – verify `apps/shop-<id>/.env` contains all variables listed in the error. Missing values will stop the script.
- **Node or pnpm version errors** – check you are running Node.js ≥20 and pnpm 10.x. Version mismatches can cause dependency resolution issues.
