Type: Guide
Status: Active
Domain: Repo
Last-reviewed: 2025-12-02

# Installation

Requires **Node.js >=20**, **pnpm 10.12.1**, and a `DATABASE_URL` pointing to your
PostgreSQL instance. See [setup](./setup.md) for full setup and CI guidance.

Create a `.env` file with your database connection string and apply migrations
before starting:

```env
DATABASE_URL="postgres://user:password@localhost:5432/shop"
```

```bash
pnpm --filter @acme/platform-core exec prisma migrate dev
pnpm --filter @acme/platform-core run prisma:generate
pnpm --filter @acme/platform-core exec prisma db seed
```

`postinstall` runs `prisma generate` automatically. For more details on seeding strategies, backends, and `DATA_ROOT`, see
[setup](./setup.md) and [persistence](./persistence.md). If `DATABASE_URL` is unset, the platform falls back to an in-memory
test stub for local development.

## Getting Started

The quickest way to see a local shop is:

```bash
pnpm quickstart-shop --id demo --theme base --template template-app --auto-plugins --auto-env --presets
```

This wraps the `init-shop` configurator, validates the generated `.env`, and starts `pnpm dev` for the new shop. For a full
explanation of flags, configuration files, seeding options, and CI workflow generation, see [Project Setup](./setup.md).

If you prefer to drive the flow manually with `pnpm init-shop` / `pnpm create-shop`, follow the step‑by‑step guide in
[`docs/setup.md`](./setup.md#1-create-a-shop).

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

## Project layout and deploy

For an overview of the monorepo structure and package layering, see
[architecture](./architecture.md) and [platform vs apps](./platform-vs-apps.md).
For CI and deployment details (including Cloudflare Pages), see
[ci-and-deploy-roadmap](./ci-and-deploy-roadmap.md).

## Storybook

See [storybook](./storybook.md) for details on running Storybook,
executing accessibility tests and publishing Chromatic previews.

## CMS Guide

See [CMS guide](./cms.md) for an overview of the CMS navigation,
switching shops and admin-only routes. Newcomers can follow the
[Page Builder](./cms.md#page-builder) section to learn how to add,
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
