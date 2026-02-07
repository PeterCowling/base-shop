---
Type: Guide
Status: Active
Domain: Repo
Last-reviewed: 2026-01-24
---

# Project Digest (Always-on)

High-signal reference for repo layout, invariants, and where to look next.
Operational rules and universal commands live in `AGENTS.md`.

## Repo Layout

- `apps/` - Tenant apps (cms, skylar, brikette, etc.).
- `packages/` - Shared packages (platform-core, ui, design-system, cms-ui, etc.).
- `docs/` - Architecture, workflows, and domain guides.
- `scripts/` - Build, CI, and utility scripts.
- `data/` - JSON fixtures and runtime data (inventory, templates).
- `__tests__/` - Test docs and fixtures.
- `.claude/` - Claude Code configuration and skills.

## Key Commands (non-universal)

Universal commands (install/build/lint/typecheck/test) are in `AGENTS.md`.

- Dev server: `pnpm --filter @apps/cms dev` (replace with target app).
- Watch typecheck: `pnpm typecheck:watch`.
- Build CMS deps: `pnpm build:cms-deps`.
- Storybook: `pnpm storybook:app`.
- Prisma generate: `pnpm prisma:generate`.
- Seed data: `pnpm --filter @acme/platform-core exec prisma db seed`.
- E2E: `pnpm e2e` (seed first when required).

## Architecture Invariants

- UI layers are one-way: **atoms → molecules → organisms → templates → pages**.
- Package layering is one-way: **apps → CMS packages → @acme/ui → @acme/design-system → @acme/platform-core → low-level libs**.
- Never import from apps inside packages.
- Never import from `@acme/*/src/**`; use public exports only.
- Presentation primitives come from `@acme/design-system`; domain UI lives in `@acme/ui`.
- CMS/editor-specific UI lives in `@acme/cms-ui` and can depend on `@acme/ui` and `@acme/design-system`.

## Import Patterns

```ts
// ✅ Good - package exports only
import { getShop } from "@acme/platform-core";
import { Button } from "@acme/design-system/primitives";

// ❌ Bad - internal paths
import { getShop } from "@acme/platform-core/src/internal/shops";
```

## Where Does This Code Belong?

- UI component: `packages/ui/components/<layer>/` (respect layer order).
- Domain logic (cart, orders, pricing): `packages/platform-core/`.
- CMS/editor UI: `packages/cms-ui/` or `apps/cms/src/` when app-specific.
- CMS orchestration (non-UI): `packages/cms-*` or `apps/cms/`.
- Shop-specific branding or overrides: `apps/<shop>/`.

## Notable Packages

- `@acme/platform-core` - domain logic, persistence, carts, pricing.
- `@acme/ui` - domain UI components and shims.
- `@acme/design-system` - primitives, presentation atoms/molecules.
- `@acme/cms-ui` - CMS/editor UI layer.
- `@acme/page-builder-core` - PB state/transforms (no React/I/O).
- `@acme/page-builder-ui` - PB React UI on top of core.

## Data Defaults (Know Before You Change Things)

- `DATABASE_URL` unset → JSON fallbacks remain active for some repos (notably inventory).
- Inventory JSON lives under `data/shops/<shop>/inventory.json`.
- Pages/shops can be forced to JSON via `PAGES_BACKEND=json` or `SHOP_BACKEND=json`.
- Migration plan: `docs/inventory-migration.md`.

## When to Read Deeper Docs

| Need | Read |
| --- | --- |
| Architecture rules, layering | `docs/architecture.md`, `docs/platform-vs-apps.md` |
| Data layer / persistence | `docs/persistence.md` |
| CI/CD and workflows | `docs/development.md` |
| Testing rules | `docs/testing-policy.md`, `__tests__/docs/testing.md` |
| Linting policy | `docs/linting.md` |
| Plan schema | `docs/AGENTS.docs.md` |
| Theming & tokens | `docs/theming.md`, `docs/typography-and-color.md` |
| i18n | `docs/i18n/` |
| CMS specifics | `docs/cms.md`, `docs/cms-plan/index.md` |
| Troubleshooting | `docs/troubleshooting.md` |

## Key File Locations

- Prisma schema: `packages/platform-core/prisma/schema.prisma`.
- Env reference: `docs/.env.reference.md`.
- Test fixtures: `__tests__/data/shops/`.
- Inventory JSON fallback: `data/shops/<shop>/inventory.json`.
- Tailwind config: `tailwind.config.mjs`.
- Storybook config: `apps/storybook/.storybook/main.ts`.
- Cypress config: `apps/cms/cypress.config.mjs`.
- Next.js app configs: `apps/<app>/next.config.mjs`.
- CMS middleware: `apps/cms/middleware.ts`.

## Quick Facts

- Node.js: >= 20
- Package manager: pnpm 10.12.1
- Tech stack: Next.js 15, React 19, Prisma, Tailwind 4
