---
Type: Guide
Status: Canonical
Domain: Architecture
Created: 2026-01-16
Created-by: Claude Opus 4.5
---

# Package Architecture Guide

This guide defines when to create a new package versus organizing code within an existing package folder. Follow these rules to maintain a consistent, scalable monorepo structure.

## Decision Criteria

Use this decision tree to determine whether code belongs in a new package or an existing folder.

### Create a New Package When

| Criterion | Rationale |
|-----------|-----------|
| **Multiple consumers** | Code is imported by 2+ apps or packages |
| **Independent versioning** | Code needs its own release cycle or changelog |
| **Separate build output** | Code requires its own `dist/` for bundling or tree-shaking |
| **Distinct dependency graph** | Code has dependencies that shouldn't propagate to consumers |
| **Public API boundary** | Code defines exports that must remain stable |
| **Layer boundary** | Code belongs to a different layer (see [dependency-graph.md](dependency-graph.md)) |

### Use a Folder Within an Existing Package When

| Criterion | Rationale |
|-----------|-----------|
| **Single consumer** | Code is only used by one app or one package |
| **Internal implementation** | Code is an implementation detail, not a public API |
| **Same build output** | Code shares build configuration with its parent |
| **Tight coupling** | Code is tightly coupled to its parent and would be awkward to extract |
| **No versioning need** | Code doesn't need independent releases |

## Layer Assignment

All packages must belong to exactly one layer. Lower layers cannot import from higher layers.

| Layer | Purpose | Examples |
|-------|---------|----------|
| 1 | Foundation (no internal deps) | `@acme/shared-utils`, `@acme/i18n`, `@acme/zod-utils` |
| 2 | Configuration & Types | `@acme/config`, `@acme/types` |
| 3 | Core Business Logic | `@acme/platform-core`, `@acme/page-builder-core` |
| 4 | Domain Services | `@acme/auth`, `@acme/email`, `@acme/telemetry` |
| 5 | UI Components | `@acme/ui`, `@acme/page-builder-ui`, `@acme/theme` |
| 6 | Plugins & Integrations | `@acme/sanity`, `@acme/plugin-paypal` |
| 7 | Templates & Scaffolding | `@acme/templates`, `@acme/template-app` |

See [dependency-graph.md](dependency-graph.md) for the full layer diagram and import rules.

## Namespace Conventions

| Namespace | Location | Purpose |
|-----------|----------|---------|
| `@acme/*` | `packages/*` | Core shared packages |
| `@apps/*` | `apps/*` | Applications |
| `@themes/*` | `packages/themes/*` | Theme packages |

## Package Creation Checklist

When creating a new package:

1. **Verify layer assignment** — Determine which layer the package belongs to
2. **Check for existing overlap** — Search for similar functionality in existing packages
3. **Create package directory**:
   ```bash
   mkdir -p packages/<name>/src
   ```
4. **Add package.json** with required fields:
   ```json
   {
     "name": "@acme/<name>",
     "version": "0.0.0",
     "private": true,
     "exports": {
       ".": "./src/index.ts"
     },
     "scripts": {
       "build": "tsc -b",
       "typecheck": "tsc --noEmit",
       "lint": "eslint src/",
       "test": "jest"
     }
   }
   ```
5. **Add tsconfig.json** extending base:
   ```json
   {
     "extends": "../../tsconfig.base.json",
     "compilerOptions": {
       "composite": true,
       "rootDir": "src",
       "outDir": "dist"
     },
     "include": ["src"]
   }
   ```
6. **Add README.md** following the [package-agent-brief.md](templates/package-agent-brief.md) template
7. **Register in tsconfig.base.json** paths if needed
8. **Add to turbo.json** pipeline if custom build steps required

## Common Patterns

### Shared Utilities

**Package**: Create a package when utilities are used across 3+ consumers.

**Folder**: Keep in `src/utils/` or `src/lib/` when used only within one package/app.

### Types and Interfaces

**Package**: Shared types go in `@acme/types` (Layer 2).

**Folder**: Internal types stay in `src/types/` within the consuming package.

### React Components

**Package**: Reusable UI components go in `@acme/ui` (Layer 5).

**Folder**: App-specific components stay in `apps/<app>/src/components/`.

### Domain Logic

**Package**: Cross-app business logic goes in `@acme/platform-core` (Layer 3).

**Folder**: App-specific logic stays in `apps/<app>/src/lib/` or `src/services/`.

## Anti-Patterns to Avoid

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| Creating packages for single-use code | Unnecessary complexity | Keep in folder until 2+ consumers exist |
| Circular dependencies | Build failures, unclear ownership | Use dependency injection or events |
| Importing from higher layers | Violates architecture | Refactor to lower layer or use DI |
| Naming collisions | Confusion (`templates` vs `template-app`) | Use distinct, descriptive names |
| Exporting from `src/` directly | Inconsistent consumption patterns | Always export from `dist/` or via `exports` map |

## Migration: Folder to Package

When code outgrows its folder:

1. **Identify all consumers** — Grep for imports of the folder
2. **Create the new package** — Follow the creation checklist above
3. **Move code** — Relocate files preserving relative structure
4. **Update imports** — Change all consumers to use `@acme/<name>`
5. **Add tests** — Ensure existing tests pass in new location
6. **Update docs** — Add README and update any referencing docs

## Related Documents

- [dependency-graph.md](dependency-graph.md) — Package layer visualization
- [architecture.md](architecture.md) — Overall system architecture
- [contributing.md](contributing.md) — Development workflow
- [templates/package-agent-brief.md](templates/package-agent-brief.md) — README template for packages
