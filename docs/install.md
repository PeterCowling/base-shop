---
Type: Guide
Status: Active
Domain: Repo
Last-reviewed: 2026-01-16
---

# Installation

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | >=20 |
| pnpm | 10.12.1 |
| PostgreSQL | Optional (falls back to JSON) |

See [setup](./setup.md) for full setup and CI guidance.

## Database Configuration

Create `.env` with database connection string and apply migrations:

```env
DATABASE_URL="postgres://user:password@localhost:5432/shop"
```

```bash
pnpm --filter @acme/platform-core exec prisma migrate dev
pnpm --filter @acme/platform-core run prisma:generate
pnpm --filter @acme/platform-core exec prisma db seed
```

`postinstall` runs `prisma generate` automatically. For seeding strategies, backends, and `DATA_ROOT`, see [setup](./setup.md) and [persistence](./persistence.md).

**Fallback behavior**: When `DATABASE_URL` is unset, the platform uses an in-memory test stub for local development.

## Quick Start

Scaffold and run a local shop:

```bash
pnpm quickstart-shop --id demo --theme base --template template-app --auto-plugins --auto-env --presets
```

This wraps `init-shop`, validates `.env`, and starts `pnpm dev`. For flags, seeding options, and CI workflow generation, see [Project Setup](./setup.md).

For manual flow with `pnpm init-shop` / `pnpm create-shop`, follow [setup.md](./setup.md#1-create-a-shop).

## Available Scripts

| Script | Action |
|--------|--------|
| `pnpm dev` | Local dev server (next dev) |
| `pnpm build` | Production build (next build) |
| `pnpm preview` | Edge preview with Wrangler |
| `pnpm lint` | ESLint + Prettier |
| `pnpm test` | Jest unit tests |
| `pnpm e2e` | Cypress e2e suite |
| `pnpm test:coverage` | Jest tests with coverage summary |
| `pnpm run lh:checkout` | Lighthouse audit for /en/checkout |
| `pnpm chromatic` | Publish Storybook to Chromatic (requires `CHROMATIC_PROJECT_TOKEN`) |
| `pnpm check:tailwind-preset` | Ensure Tailwind preset resolves |
| `pnpm tailwind:check` | Validate Tailwind build |

## Related Documentation

| Document | Content |
|----------|---------|
| [architecture.md](./architecture.md) | Monorepo structure and package layering |
| [platform-vs-apps.md](./platform-vs-apps.md) | Platform vs tenant app responsibilities |
| [package-architecture.md](./package-architecture.md) | When to create a package vs folder |
| [dependency-graph.md](./dependency-graph.md) | Package layer visualization |
| [ci-and-deploy-roadmap.md](./ci-and-deploy-roadmap.md) | CI and Cloudflare Pages deployment |
| [storybook.md](./storybook.md) | Storybook setup, a11y tests, Chromatic |
| [cms.md](./cms.md) | CMS navigation and Page Builder |
| [theming-advanced.md](./theming-advanced.md) | Theme overrides and live preview |

## Device Presets

The Page Builder and `/edit-preview` route include device presets:

| Preset | Width |
|--------|-------|
| Desktop 1280 | 1280px (default) |
| Desktop 1440 | 1440px |
| iPad | 768px |
| iPad Pro | 1024px |
| iPhone SE | 375px |
| iPhone 12 | 390px |
| Galaxy S8 | 360px |

Toggle via desktop/tablet/mobile buttons or dropdown. Resets to Desktop 1280 on page reload.
