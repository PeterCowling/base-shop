Type: Charter
Status: Canonical
Domain: Runtime
Last-reviewed: 2025-12-02

Primary code entrypoints:
- packages/template-app/src
- apps/storefront/src
- apps/cover-me-pretty/src
- apps/shop-secret/src
- packages/platform-core/src

If behaviour in this doc contradicts the code, treat the code as canonical and update this doc as a follow‑up.

# Runtime Charter

## Goals

- Provide a canonical, platform‑compatible shop runtime (`@acme/template-app`) that tenant apps can adopt or converge towards.
- Keep runtime behaviour (routes, env vars, data contracts) consistent across template and tenant apps so CMS and platform tooling can rely on them.
- Support per‑shop deployments bound by `shopId` and environment, while keeping the underlying domain and persistence shared in `platform-core`.
- Maintain clear performance and operational guardrails (for example performance budgets, error handling, and preview flows).

## Core Flows

- **Shop selection and configuration**
  - Bind each runtime deployment to a single shop via env/config (`NEXT_PUBLIC_SHOP_ID` and related config modules).

- **Cart and checkout**
  - Expose the canonical cart and checkout APIs (`/api/cart`, `/api/checkout-session`, returns, etc.) as defined in shared `platform-core` contracts.
  - Default to Cloudflare-native storage (Durable Objects/KV) on Workers, with Redis as a supported alternative.

- **Page rendering and preview**
  - Render pages using shared Page Builder contracts and templates, and support preview flows that align with CMS.

- **Deployments and environments**
  - Run separate deployments per environment (dev/stage/prod) with environment variables selecting DBs, backends, and external services.

## Key Contracts

- **Template runtime contract**
  - See `docs/runtime/template-contract.md` for environment configuration, HTTP routes, and behaviour required for platform‑compatible runtimes.

- **Architecture and platform boundaries**
  - See `docs/architecture.md` and `docs/platform-vs-apps.md` for how runtimes relate to `platform-core` and CMS.

- **Persistence and backends**
  - See `docs/persistence.md` for DB vs JSON semantics and repository behaviour used by runtimes.

## Out of Scope

- Tenant‑specific visual design systems and copy (covered by app‑local `AGENTS` files such as `apps/skylar/AGENTS.en.md`).
- CMS UI and workflows beyond the runtime contracts they depend on.
