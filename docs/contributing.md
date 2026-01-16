Type: Guide
Status: Active
Domain: Repo
Last-reviewed: 2026-01-16

# Contributing (Agent Runbook)

Audience: agents only. Follow `AGENTS.md` and `docs/git-safety.md`.

## Git Safety (Required)

1. Never run destructive git commands (see prohibited list in `docs/git-safety.md`).
2. Never work directly on `main` (use `work/*` branches).
3. Commit and push regularly.
4. Use PRs for all changes; direct pushes to `main` are blocked.

Quick reference:

```bash
# Start work on a new feature
git checkout -b work/2026-01-15-my-feature

# Commit often
git add -A && git commit -m "feat: add new feature"

# Push to GitHub
git push -u origin HEAD
```

## Formatting

Use [pnpm](https://pnpm.io) for package management. The repository uses Prettier
and ESLint with semicolons, double quotes, two-space indentation, an 80-character
line width, and the Tailwind CSS plugin. Run `pnpm lint` to check formatting and
lint rules, or `pnpm format` to auto-apply fixes.

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/). Start
messages with a type such as `feat:` or `fix:` and keep the subject line under
72 characters.

## Branching and PRs

Branch naming convention:

```
work/YYYY-MM-DD-brief-description
```

Examples:
- `work/2026-01-15-add-login-form`
- `work/2026-01-15-fix-cart-redirect`

Push the branch and open a PR against `main`.

Protected branches:
- `main` requires PR + approval; CI must pass
- Direct pushes and force pushes are blocked

## Tests (Scoped)

Avoid monorepo-wide runs unless explicitly requested. Scope tests to the package
or files touched.

- Single package: `pnpm --filter <workspace> test`
- Single file/pattern (Jest): `pnpm --filter <workspace> test -- --testPathPattern <pattern>`
- Cypress subsets: use `pnpm e2e:dashboard` or targeted scripts in `docs/cypress.md`

## Exceptions and disable policy

When disabling a rule, include a ticket ID after `--` and, optionally, a TTL:

```ts
// eslint-disable-next-line no-console -- ABC-123 explain; ttl=2025-12-31
```

See `docs/linting.md` for the exceptions registry and CI validation flow.

## Prisma model access

Avoid adding `[key: string]: unknown` (or any permissive string index signature)
to `PrismaClient`. When a model name must be chosen dynamically, use a typed
helper to keep type safety:

```ts
function getModelDelegate<K extends keyof PrismaClient>(
  client: PrismaClient,
  model: K,
): PrismaClient[K] {
  return client[model];
}
```

## API documentation

Generate API reference docs for all public packages by running:

```bash
pnpm doc:api
```

The output is written to `docs/api/`.

## Related Documentation

- `docs/git-safety.md` - Git safety rules
- `AGENTS.md` - Agent runbook
- `docs/git-hooks.md` - Local hook configuration
- `docs/linting.md` - ESLint rules and exceptions
- `__tests__/docs/testing.md` - Test guidelines
