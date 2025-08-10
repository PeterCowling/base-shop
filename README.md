// README.md

# Base-Shop

Requires **Node.js >=20** and **pnpm 10.12.1**.  
See [doc/setup.md](doc/setup.md) for full setup and CI guidance.

Key points:

- Stripe handles deposits via escrow sessions.
- Inventory lives in JSON files under data/shops/\*/inventory.json.
- Rental pricing matrix defined in data/rental/pricing.json with duration discounts and damage-fee rules.
- Return logistics options stored in data/return-logistics.json.
- RBAC: ShopAdmin currently manages all shops.
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
   contact email and which theme, template, payment and shipping providers to use. It then
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
? Theme › base
? Template › template-app
? Payment providers › stripe
? Shipping providers › ups
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

# Environment Variables

After running `pnpm create-shop <id>`, configure `apps/shop-<id>/.env` with:

- `STRIPE_SECRET_KEY` – secret key used by the Stripe server SDK
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` – public key for the Stripe client SDK
- `CMS_SPACE_URL` – base URL of the CMS API
- `CMS_ACCESS_TOKEN` – access token for pushing schemas
- `CHROMATIC_PROJECT_TOKEN` – token for publishing Storybook previews

The scaffolded `.env` also includes generated placeholders for `NEXTAUTH_SECRET`
and `PREVIEW_TOKEN_SECRET`. Replace all placeholders with real values or supply
them via your CI's secret store. Missing variables will cause the CLI to exit
before running.

## Google Apps Script

Apps Script code lives under `apps-script/` and compiles with its own `tsconfig.json`.
Next.js projects exclude this folder to avoid type conflicts with DOM typings.

## Notes

See [docs/lighthouse.md](docs/lighthouse.md) for running Lighthouse audits.
