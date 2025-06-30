// README.md

# Base-Shop

Key points:

- Stripe handles deposits via escrow sessions.
- Inventory lives in JSON files under data/shops/\*/inventory.json.
- Rental pricing matrix defined in data/rental/pricing.json with duration discounts and damage-fee rules.
- Return logistics options stored in data/return-logistics.json.
- RBAC: ShopAdmin currently manages all shops.
  A multilingual, hybrid-rendered e-commerce demo built with **Next.js 15** and **React 19**.  
  The full technical roadmap is documented in [./IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md).

---

## Getting Started

````bash
# with pnpm
pnpm dev

# or npm
npm run dev
Open http://localhost:3000 to view the site. Pages hot-reload on save.

Useful targets
Script	What it does
pnpm dev	Local dev server (next dev)
pnpm build	Production build (next build)
pnpm preview	Edge preview with Wrangler
pnpm lint	ESLint + Prettier
pnpm test	Jest unit tests
pnpm e2e	Cypress e2e suite
pnpm test:coverage	Jest tests with coverage summary
pnpm run lh:checkout    Lighthouse audit for /en/checkout
pnpm chromatic  Publish Storybook to Chromatic
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
├─ app/                 // Next.js App Router
│  ├─ [lang]/…          // i18n routes (en, de, it)
│  └─ api/…             // Edge Route Handlers
├─ components/          // UI building blocks
├─ contexts/            // React context providers
├─ lib/                 // Server-side helpers (Stripe, products, etc.)
└─ tests/               // Jest + Cypress
public/                 // Static assets
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
````

## Storybook

See [doc/storybook.md](doc/storybook.md) for details on running Storybook,
executing accessibility tests and publishing Chromatic previews.

# Environment Variables

The CLI and demo application expect several variables to be defined:

- `STRIPE_SECRET_KEY` – secret key used by the Stripe server SDK
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` – public key for the Stripe client SDK
- `CMS_SPACE_URL` – base URL of the CMS API
- `CMS_ACCESS_TOKEN` – access token for pushing schemas
- `CHROMATIC_PROJECT_TOKEN` – token for publishing Storybook previews

Missing variables will cause the CLI to exit with an error before running.

See [docs/lighthouse.md](docs/lighthouse.md) for running Lighthouse audits.
