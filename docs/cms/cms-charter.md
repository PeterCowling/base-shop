Type: Charter
Status: Canonical
Domain: CMS
Last-reviewed: 2025-12-02

Primary code entrypoints:
- apps/cms/src/app/cms
- apps/cms/src/app/cms/configurator
- apps/cms/src/app/cms/shop/[shop]
- packages/platform-core/src/repositories

If behaviour in this doc contradicts the code, treat the code as canonical and update this doc as a follow‑up.

# CMS Charter

## Goals

- Enable non‑technical users to create, configure, and launch new shops in ≈ 1 hour, assuming external accounts (e.g. Stripe) already exist.
- Keep shops configurable post‑launch so changes to pages, settings, and theme flow through CMS, not ad‑hoc app edits.
- Centralise shop domain models and persistence in `@acme/platform-core`, with CMS as the primary authoring and orchestration surface.
- Provide safe, repeatable flows for create → configure → launch → upgrade → rollback, with guardrails enforced by shared checks.

## Core Flows

- **Shop creation**
  - Create shops via `/cms/configurator`, seeding `Shop` and `ShopSettings` with sensible defaults and templates.

- **Configuration and theming**
  - Edit shop identity, providers, theme, navigation, and page content from CMS (shop settings, theme editor, Page Builder).

- **Launch and health**
  - Gate launch behind server‑side configuration checks (ConfigChecks) and expose readiness/health indicators per shop.

- **Upgrade and rollback**
  - Upgrade shops to newer template versions with preview and rollback flows backed by deployment metadata.

## Key Contracts

- **Source of truth and persistence**
  - See `docs/persistence.md` for `*_BACKEND` and `DATA_ROOT` semantics.
  - Shop business state and settings are owned by Prisma models (`Shop`, `ShopSettings`) via `platform-core` repositories when in DB mode.

- **Platform vs apps**
  - See `docs/platform-vs-apps.md` for platform vs tenant responsibilities and public API boundaries.

- **Runtime template contract**
  - See `docs/runtime/template-contract.md` for what it means for a shop runtime to be platform‑compatible.

- **CMS architecture and planning**
  - See `docs/architecture.md`, `docs/historical/cms-research.md`, and `docs/cms-plan/*` for deeper details and implementation threads.

## Out of Scope

- Tenant‑specific branding and marketing content outside CMS‑managed surfaces (for example hard‑coded experiments in a brand app).
- Infrastructure‑level deployment details beyond the `ShopDeploymentAdapter` contract and its use from CMS.
