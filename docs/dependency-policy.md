Type: Policy
Status: Active
Domain: Repo
Last-reviewed: 2026-01-23
Implements: DS-IMP-01 (DECISION-02, DECISION-06)

# Dependency Version Policy

## Principles

1. **Package.json files must be truthful** — the declared version should match what actually gets installed.
2. **One canonical version per core dep** — defined in root `package.json`.
3. **Overrides are only for transitive patches** — never for direct workspace dependencies.

## Core Dependencies

These dependencies must declare the same base version across all workspace packages. CI **fails** if any workspace package declares a different version.

| Dependency | Canonical source |
|-----------|-----------------|
| `react` | root `dependencies` |
| `react-dom` | root `dependencies` |
| `zod` | root `dependencies` |
| `next` | root `dependencies` |
| `prisma` | root `devDependencies` |
| `@prisma/client` | root `dependencies` |

The enforcement script (`scripts/check-dep-alignment.mjs`) strips range prefixes (`^`, `~`, `>=`) before comparison, so `^19.2.1` and `19.2.1` are both acceptable for a canonical version of `19.2.1`.

## Warn-Only Dependencies

These are checked for alignment but only produce warnings (non-blocking):

- `eslint`, `prettier`, `typescript`, `@types/react`, `@types/react-dom`

## Peer Dependencies

Package `peerDependencies` use broad ranges (e.g., `"react": ">=19 <20"`) to express compatibility. These are **not checked** by the alignment script — they are intentionally wider than the pinned version.

## pnpm.overrides

Overrides in root `package.json` are reserved for **transitive security patches** — fixing vulnerabilities in sub-dependencies that no workspace package directly declares.

Current overrides and their purpose:

| Override | Reason |
|---------|--------|
| `next` | Pin to exact version 15.3.9 for monorepo consistency |
| `@shadcn/ui` | Pin to known-working version |
| `yallist` | Security patch |
| `dom-serializer`, `domhandler`, `domutils` | HTML parser security |
| `form-data` | Security patch |
| `htmlparser2`, `htmlparser2>entities`, `dom-serializer>entities` | Security patch |
| `@tanstack/query-core` | Compatibility fix |
| `@storybook/addon-coverage>vite-plugin-istanbul` | Compatibility fix |
| `linkifyjs`, `path-to-regexp`, `semver`, `tar-fs` | Security patches (CVE mitigations) |
| `diff`, `jws`, `qs`, `undici`, `tar`, `axios` | Security patches |

**Never add overrides for direct workspace dependencies.** If a dep needs upgrading, update all workspace `package.json` files.

## Adding or Upgrading a Dependency

1. Update the version in root `package.json` first.
2. Run `node scripts/check-dep-alignment.mjs` to find all workspace packages that declare a different version.
3. Update each reported package.
4. Run `pnpm install` to regenerate the lockfile.
5. Run `pnpm typecheck && pnpm build` to verify.

## CI Enforcement

The `dep-alignment` job in `.github/workflows/ci.yml` runs `scripts/check-dep-alignment.mjs` on every push and PR. It runs early in the pipeline (before build/typecheck) so mismatches are caught fast.
