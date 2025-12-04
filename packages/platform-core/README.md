# @acme/platform-core

Core APIs and domain logic for the Acme commerce platform. It centralizes cart mechanics, product data, orders, shipping, analytics, theming and more.

## Core APIs

- **db** – Prisma client for PostgreSQL access.
- **createShop** – scaffold utilities and provider discovery.
- **cart**, **cartStore**, **cartCookie** – server and client helpers for cart persistence.
- **orders** and **shipping** – order lifecycle and shipping labels.
- **analytics** – event collection helpers.
- **products**, **shops**, **themeTokens** – domain modules for catalog and theming.
- **plugins** – integration points for payment and shipping providers.
- **utils**, **repositories**, **hooks**, and React contexts for common client features.

Each module is exposed via subpath exports:

```ts
import { cartStore } from "@acme/platform-core/cartStore";
```

## Setup

- Node.js \>=20 and pnpm 10.12.1.
- PostgreSQL database configured via `DATABASE_URL`.
- Install dependencies and build the workspace:

```bash
pnpm install
pnpm -r build
```

- Initialize the database:

```bash
pnpm prisma migrate dev
```

## Testing & coverage

- Default Jest runs enforce global coverage thresholds. For narrow, file-scoped runs (for example when iterating on a single test file with `--runTestsByPath` or `--testPathPattern`), the root Jest config now relaxes coverage gates so quick loops don't fail on unrelated files.
- To force relaxed coverage in other scenarios, set `JEST_ALLOW_PARTIAL_COVERAGE=1` for that run.
- Full or CI runs still enforce the usual thresholds; use targeted runs only for local iteration.

## Related docs

- [Installation guide](../../docs/install.md)
- [Architecture overview (layering & public surfaces)](../../docs/architecture.md)
- [Platform vs apps & public API](../../docs/platform-vs-apps.md)
- [Developer setup](../../doc/setup.md)
- [Theming](../../docs/theming.md)
