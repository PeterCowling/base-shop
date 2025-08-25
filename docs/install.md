# Installation

Requires **Node.js >=20** and **pnpm 10.12.1**.
See [doc/setup.md](../doc/setup.md) for full setup and CI guidance.

## Getting Started

To scaffold a shop and immediately start the dev server in one step:

```bash
pnpm quickstart-shop --id demo --theme base --template template-app --payment stripe --shipping ups
```

This wraps the `init-shop` wizard, validates the generated `.env`, writes `.env.template`, and runs `pnpm dev` for the new shop. You can also provide a configuration file and skip the flags:

```bash
pnpm quickstart-shop --config ./shop.config.json
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

1. **Initialize a shop**

   ```bash
   pnpm init-shop
   # optionally generate a GitHub Actions workflow
   pnpm setup-ci <id>
   ```

   `init-shop` launches an interactive wizard that asks for the shop ID, display name, logo URL,
   contact email, shop type (`sale` or `rental`), and which theme and template to use. Payment and
   shipping providers are chosen from guided lists of available providers. It then
   scaffolds `apps/shop-<id>` and prompts for environment variables like Stripe keys and CMS
   credentials, writing them directly to `apps/shop-<id>/.env` and generating an
   accompanying `.env.template` grouped by provider. Provide `--env-file <path>` or
   `--vault-file <path>` to prefill values from a plain `.env` file or a JSON
   export from your secret vault. For scripted setups you can still call
   `pnpm create-shop <id>` and pass flags like `--name`, `--logo` and `--contact`
   to skip those prompts. Both `init-shop` and `create-shop` accept a `--seed`
   flag to copy sample `products.json` and `inventory.json` from
   `data/templates/default` into the new shop.

   ```bash
   pnpm create-shop <id> --name="Demo Shop" --logo=https://example.com/logo.png \
     --contact=demo@example.com
   ```

2. **Run the app**

   ```bash
   cd apps/shop-<id>
   pnpm dev
   ```

   The wizard validates `.env` during scaffolding. To re-run validation after
   editing the file, use `pnpm validate-env <id>`. Open http://localhost:3000 to
   view the site. Pages hot-reload on save.

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
picker enables quick overrides. Save the form to persist any changes. For a deeper look at base themes, overrides, persistence and live preview, see [docs/theming-advanced.md](docs/theming-advanced.md).

### Device presets

The Page Builder and `/edit-preview` route include a device menu with presets for:

- Desktop 1280
- Desktop 1440
- iPad
- iPad Pro
- iPhone SE
- iPhone 12
- Galaxy S8

Switch between widths using the desktop/tablet/mobile buttons or the dropdown. The chosen preset resets to **Desktop 1280** when the page reloads.
