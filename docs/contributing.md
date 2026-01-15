Type: Guide
Status: Active
Domain: Repo
Last-reviewed: 2026-01-15

# Contributing

Contributions are welcome! Please open an issue or pull request with improvements.

> **⚠️ Important:** Before contributing, read the [Git Safety Guide](./git-safety.md). Following these rules protects everyone's work.

## Git Safety (REQUIRED)

**All contributors must follow these rules:**

1. **Never run destructive git commands** - See [prohibited commands](./git-safety.md#1-never-run-destructive-git-commands)
2. **Never work directly on `main`** - Always use feature branches
3. **Commit and push regularly** - Protect your work from loss
4. **Create PRs for all changes** - Direct pushes to main are blocked

**For AI agents (Claude/Codex):** Follow the rules in [AGENTS.md](../AGENTS.md).

**Quick reference:**
```bash
# Start work on a new feature
git checkout -b work/2026-01-15-my-feature

# Commit often
git add -A && git commit -m "feat: add new feature"

# Push to GitHub
git push -u origin HEAD

# Then create a PR on GitHub
```

## Formatting

Use [pnpm](https://pnpm.io) for package management. The repository uses Prettier and ESLint with semicolons, double quotes, two-space indentation, an 80-character line width, and the Tailwind CSS plugin. Run [`pnpm lint`](../package.json#L24) to check formatting and lint rules, or [`pnpm format`](../package.json#L37) to automatically apply fixes.

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. Start messages with a type such as `feat:` or `fix:` and write in the present tense with a concise subject line under 72 characters.

## Branching

Create branches from `main` using the naming convention:

```
work/YYYY-MM-DD-brief-description
```

Examples:
- `work/2026-01-15-add-login-form`
- `work/2026-01-15-fix-cart-redirect`

Push your branch and open a pull request against `main`.

**Protected branches:**
- `main` - Requires PR with approval, CI must pass
- Direct pushes and force pushes are blocked

See [Git Safety Guide](./git-safety.md) for full details.

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

## Related Documentation

- [Git Safety Guide](./git-safety.md) - Required reading for all contributors
- [AGENTS.md](../AGENTS.md) - Rules for AI agents (Claude/Codex)
- [Git Hooks](./git-hooks.md) - Local hook configuration
- [Linting](./linting.md) - ESLint rules and exceptions
- [Testing](./__tests__/docs/testing.md) - Test guidelines
