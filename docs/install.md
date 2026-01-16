Type: Guide
Status: Active
Domain: Repo
Last-reviewed: 2026-01-16

# Installation (Agent Runbook)

Audience: agents only. Follow `AGENTS.md` for git safety and branch rules.

## Requirements

- Node.js >=20
- pnpm 10.12.1
- `DATABASE_URL` pointing to PostgreSQL (omit to use the in-memory stub)

## Database setup

Create a `.env` file with the database connection string:

```env
DATABASE_URL="postgres://user:password@localhost:5432/shop"
```

Run migrations, generate the client, and seed:

```bash
pnpm --filter @acme/platform-core exec prisma migrate dev
pnpm --filter @acme/platform-core run prisma:generate
pnpm --filter @acme/platform-core exec prisma db seed
```

Note: `postinstall` runs `prisma generate` automatically. When `DATABASE_URL` is
unset, the platform falls back to an in-memory test stub for local development.

## Quickstart shop (fast path)

```bash
pnpm quickstart-shop --id demo --theme base --template template-app --auto-plugins --auto-env --presets
```

This wraps `init-shop`, validates the generated `.env`, and starts `pnpm dev` for
`apps/shop-demo`. For flags, config files, and seeding details, see
`docs/setup.md`.

If manual control is required, use `pnpm init-shop` or `pnpm create-shop` and
follow `docs/setup.md#1-create-a-shop`.

## Common commands (scoped)

| Command | Purpose | Notes |
| --- | --- | --- |
| `pnpm dev` | Local dev server | `next dev` |
| `pnpm build` | Production build | `next build` |
| `pnpm preview` | Edge preview | Wrangler |
| `pnpm lint` | ESLint + Prettier | Use for CI parity |
| `pnpm test` | Jest unit tests | Keep scoped to package/file |
| `pnpm e2e` | Cypress E2E suite | Seed data first |
| `pnpm test:coverage` | Jest coverage summary | CI reporting |
| `pnpm run lh:checkout` | Lighthouse audit | `/en/checkout` |
| `pnpm chromatic` | Publish Storybook | Requires `CHROMATIC_PROJECT_TOKEN` |
| `pnpm check:tailwind-preset` | Validate Tailwind preset | Token check |
| `pnpm tailwind:check` | Validate Tailwind build | Token check |

## Coverage output reference

```
------------------|---------|----------|---------|---------|-------------------
File              | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
------------------|---------|----------|---------|---------|-------------------
All files         |   100   |      100 |   100   |   100   |
------------------|---------|----------|---------|---------|-------------------
```

## Repo context

- Architecture overview: `docs/architecture.md`
- Package layering: `docs/platform-vs-apps.md`
- CI and deployment: `docs/ci-and-deploy-roadmap.md`

## Storybook

See `docs/storybook.md` for how to run Storybook, execute accessibility tests,
and publish Chromatic previews.

## CMS operations (reference)

- CMS overview: `docs/cms.md`
- Page Builder entrypoint: `docs/cms.md#page-builder`

### Theme overrides

- Use the CMS theme editor to edit tokens per shop.
- Tokens are grouped by purpose and show preview swatches.
- For deeper context on overrides and persistence, see
  `docs/theming-advanced.md`.

### Device presets

The Page Builder and `/edit-preview` route include presets for:

- Desktop 1280
- Desktop 1440
- iPad
- iPad Pro
- iPhone SE
- iPhone 12
- Galaxy S8

Switch via the desktop/tablet/mobile buttons or the dropdown. Presets reset to
Desktop 1280 on reload.
