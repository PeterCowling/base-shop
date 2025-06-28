// README.md

# Base-Shop

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
pnpm e2e	Playwright e2e suite
pnpm test:coverage	Jest tests with coverage summary

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
└─ tests/               // Jest + Playwright
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
