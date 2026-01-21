---
Type: Runbook
Status: Canonical
Domain: Repo
Last-reviewed: 2026-01-20
---

# Claude Coding Assistant Guide

This document helps Claude navigate and work effectively within this monorepo.
For universal agent rules, see [AGENTS.md](AGENTS.md).

## Project Overview

**Base-Shop** is a multilingual, hybrid-rendered e-commerce platform built with Next.js 15 and React 19. It's a Turborepo monorepo using pnpm workspaces.

### Key Technologies
- **Framework:** Next.js 15 (App Router), React 19
- **Package Manager:** pnpm 10.12.1
- **Database:** PostgreSQL + Prisma ORM
- **Build System:** Turborepo
- **Testing:** Jest, Cypress, Playwright
- **Styling:** Tailwind CSS 4 with design tokens
- **Deployment:** Cloudflare Pages

## Monorepo Structure

```
base-shop/
├── apps/                    # Applications (cms, brikette, skylar, etc.)
├── packages/               # Shared packages
│   ├── platform-core/      # Domain logic, persistence, cart, pricing
│   ├── ui/                 # Design system and UI components
│   ├── config/             # Shared configuration
│   └── ...                 # auth, i18n, email, stripe, etc.
├── docs/                   # Documentation
├── scripts/                # Build and utility scripts
└── __tests__/              # Test fixtures and data
```

## Architecture Principles

### UI Layer Hierarchy (Atomic Design)

Components follow a strict layering model. **Higher layers may only import from lower layers:**

1. **Atoms** (`packages/ui/components/atoms/`) - Button, Input
2. **Molecules** (`packages/ui/components/molecules/`) - Compositions of atoms
3. **Organisms** (`packages/ui/components/organisms/`) - Complex interface sections
4. **Templates** (`packages/ui/components/templates/`) - Page layouts
5. **Pages** (`apps/*/src/app/`) - Next.js route components

**Import Rule:** Atoms → Molecules → Organisms → Templates → Pages (one direction only)

### Package Layering

```
Apps (apps/*)
    ↓
CMS-only packages (@acme/cms-marketing, @acme/configurator)
    ↓
@acme/ui (design system)
    ↓
@acme/platform-core (domain logic, persistence)
    ↓
Low-level libraries (@acme/types, @acme/date-utils, etc.)
```

**Never import from:**
- Apps in other packages
- Internal package paths (use exports map only)
- Higher layers from lower layers

## Important Patterns

### Importing from Workspace Packages
```typescript
// ✅ Good - use package exports
import { getShop } from '@acme/platform-core'
import { Button } from '@acme/ui'

// ❌ Bad - don't import from src
import { getShop } from '@acme/platform-core/src/internal/shops'
```

### shadcn/ui Components
```typescript
// Import shadcn components from atoms/shadcn
import { Button } from '@/components/atoms/shadcn'

// Alias when using alongside in-house atoms
import { Button } from '@/components/atoms'
import { Button as ShButton } from '@/components/atoms/shadcn'
```

### Client-Only Code (App Router)
```typescript
'use client'

export function ClientComponent() {
  // Can use window, localStorage, etc.
}
```

## Key File Locations

| Category | Location |
|----------|----------|
| Architecture | `docs/architecture.md` |
| Database schema | `packages/platform-core/prisma/schema.prisma` |
| Test fixtures | `__tests__/data/shops/` |
| Environment vars | `docs/.env.reference.md` |

## Common Commands

```bash
# Development
pnpm --filter @apps/cms dev
pnpm typecheck:watch

# Testing (always targeted - see AGENTS.md)
pnpm --filter @acme/ui test -- src/atoms/Button.test.tsx

# Building
pnpm build
pnpm --filter @acme/platform-core build

# Database
pnpm prisma:generate
pnpm --filter @acme/platform-core exec prisma db seed
```

## When Working on Code

1. **Read before editing** — Don't assume structure
2. **Follow existing patterns** — Check similar code first
3. **Respect layer hierarchy** — Check `docs/architecture.md`
4. **Use targeted tests** — Never run `pnpm test` unfiltered
5. **ESM vs CJS in Jest** — If a test or imported file throws ESM parsing errors (`Cannot use import statement outside a module`, `import.meta`), rerun with `JEST_FORCE_CJS=1` to force the CommonJS preset.
6. **Validate before commit** — `pnpm typecheck && pnpm lint`

## Workflow Prompts

For structured workflows, use:
- `.agents/skills/workflows/plan-feature.md` — Planning mode
- `.agents/skills/workflows/build-feature.md` — Building mode

For the full skill system, see `.agents/README.md` and `.agents/skills/manifest.yaml`.

## Quick Reference

| Need | Location |
|------|----------|
| Git rules | [AGENTS.md](AGENTS.md) |
| Testing policy | [docs/testing-policy.md](docs/testing-policy.md) |
| Plan schema | [docs/AGENTS.docs.md](docs/AGENTS.docs.md) |
| Architecture | [docs/architecture.md](docs/architecture.md) |
| Troubleshooting | [docs/troubleshooting.md](docs/troubleshooting.md) |

---

**Previous version:** [docs/historical/CLAUDE-2026-01-17-pre-ralph.md](docs/historical/CLAUDE-2026-01-17-pre-ralph.md)
