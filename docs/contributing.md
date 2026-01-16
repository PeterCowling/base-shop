---
Type: Guide
Status: Active
Domain: Repo
Last-reviewed: 2026-01-16
---

# Contributing

This guide defines the contribution workflow for the base-shop monorepo. Follow these procedures to ensure consistent code quality.

## Formatting

Use [pnpm](https://pnpm.io) for package management. The repository uses Prettier and ESLint with semicolons, double quotes, two-space indentation, an 80-character line width, and the Tailwind CSS plugin. Run [`pnpm lint`](../package.json#L24) to check formatting and lint rules, or [`pnpm format`](../package.json#L37) to automatically apply fixes.

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. Start messages with a type such as `feat:` or `fix:` and write in the present tense with a concise subject line under 72 characters.

## Branching

Create branches from `main` and name them descriptively (e.g., `feat/login-form` or `fix/cart-redirect`). Push your branch and open a pull request against `main`.

## Linting and Tests

Before submitting changes, run [`pnpm lint`](../package.json#L24). For tests, avoid monorepo‑wide runs unless necessary; scope tests to the package or files you touched to keep feedback fast.

- Single package: `pnpm --filter <workspace> test`
- Single file/pattern (Jest): `pnpm --filter <workspace> test -- --testPathPattern <pattern>`
- Cypress subsets: use `pnpm e2e:dashboard` or targeted scripts in `docs/cypress.md`

### Exceptions and disable policy

When disabling a rule, include a ticket ID after `--` and, optionally, a TTL:

```ts
// eslint-disable-next-line no-console -- ABC-123 explain; ttl=2025-12-31
```

See `docs/linting.md` for the exceptions registry and CI validation flow.

## Testing

- Policy: Do not run package/app‑wide tests across the whole workspace unless explicitly requested (they’re time‑consuming).
- See [testing](../__tests__/docs/testing.md) for guidance on running tests with Prisma (stubbed vs. real DB), and [coverage](./coverage.md) for when you need instrumentation.

## Prisma model access

Avoid adding `[key: string]: unknown` (or any permissive string index
signature) to `PrismaClient`. When a model name must be chosen dynamically,
use a typed helper to keep type safety:

```ts
function getModelDelegate<K extends keyof PrismaClient>(
  client: PrismaClient,
  model: K,
): PrismaClient[K] {
  return client[model];
}
```

This approach prevents the accidental introduction of an `any`-typed index
signature on the Prisma client.

## API documentation

Generate API reference docs for all public packages by running:

```bash
pnpm doc:api
```

The output is written to `docs/api/`.
