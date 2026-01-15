---
Type: Runbook
Status: Canonical
Domain: Repo
Last-reviewed: 2026-01-15
---

# Claude Coding Assistant Guide

This document helps Claude (and AI coding assistants) navigate and work effectively within this monorepo.

## Project Overview

**Base-Shop** is a multilingual, hybrid-rendered e-commerce platform built with Next.js 15 and React 19. It's a Turborepo monorepo using pnpm workspaces with multiple applications and shared packages.

### Key Technologies
- **Framework:** Next.js 15 (App Router), React 19
- **Package Manager:** pnpm 10.12.1
- **Node Version:** >=20
- **Database:** PostgreSQL + Prisma ORM
- **Build System:** Turborepo
- **Testing:** Jest, Cypress, Playwright, Storybook test runner
- **Styling:** Tailwind CSS 4 with design tokens
- **Deployment:** Cloudflare Pages (primary), Next.js standalone
- **State Management:** XState for finite state machines
- **Authentication:** NextAuth.js

## Monorepo Structure

```
base-shop/
├── apps/                    # Applications
│   ├── cms/                # Content Management System (port 3006)
│   ├── brikette/           # Brikette shop example
│   ├── cover-me-pretty/    # Cover Me Pretty shop
│   ├── cochlearfit/        # Cochlearfit shop
│   ├── skylar/             # Skylar shop
│   ├── dashboard/          # Dashboard app
│   ├── product-pipeline/   # Product import pipeline
│   ├── handbag-configurator/ # Interactive product configurator
│   ├── xa/                 # XA shop
│   ├── storybook/          # Storybook (port 6007)
│   └── *-worker/           # Cloudflare Workers
├── packages/               # Shared packages
│   ├── platform-core/      # Domain logic, persistence, cart, pricing
│   ├── ui/                 # Design system and UI components
│   ├── config/             # Shared configuration
│   ├── auth/               # Authentication logic
│   ├── i18n/               # Internationalization
│   ├── email/              # Email templates and marketing
│   ├── stripe/             # Stripe integration
│   ├── configurator/       # Product configurator engine
│   ├── page-builder-core/  # Page builder core logic
│   ├── page-builder-ui/    # Page builder React UI
│   ├── platform-machine/   # XState machines and services
│   ├── design-tokens/      # Design tokens
│   └── types/              # Shared TypeScript types
├── docs/                   # Documentation
├── scripts/                # Build and utility scripts
├── __tests__/              # Test fixtures and data
└── test/                   # Test utilities
```

## Architecture Principles

### UI Layer Hierarchy (Atomic Design)

Components follow a strict layering model. **Higher layers may only import from lower layers:**

1. **Atoms** (`packages/ui/components/atoms/`) - Primitive components (Button, Input)
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

## Important File Locations

### Configuration
- Root config: `package.json`, `turbo.json`, `tsconfig.json`
- Tailwind: `tailwind.config.mjs`, `packages/tailwind-config/`
- ESLint: `eslint.config.mjs`, `.eslintrc.cjs`
- TypeScript: `tsconfig.base.json`, `tsconfig.packages.json`
- Jest: `jest.config.cjs`, `jest.setup.ts`
- Cypress: `apps/cms/cypress.config.mjs`

### Key Documentation
- Architecture: `docs/architecture.md`
- Setup: `docs/setup.md`, `docs/install.md`
- Testing: `__tests__/docs/testing.md`
- Development: `docs/development.md`
- Environment vars: `docs/.env.reference.md`
- Linting: `docs/linting.md`
- Database: `packages/platform-core/prisma/schema.prisma`

### Data
- Test fixtures: `__tests__/data/shops/`
- Inventory: `data/shops/*/inventory.json`
- Rental pricing: `data/rental/pricing.json`

## Critical Rules & Conventions

### GIT SAFETY RULES (MANDATORY)

**Read and follow `AGENTS.md` for complete Git safety procedures.** Key rules:

1. **Commit every 30 minutes** — Uncommitted work is unrecoverable
2. **Push every 2 hours (or 3 commits)** — GitHub is your backup
3. **Never run destructive commands** — See prohibited list below
4. **Never work on `main`** — Always use `work/*` branches
5. **Check git status before risky operations** — Commit first

#### Prohibited Commands (NEVER RUN)

```bash
git reset --hard    # Destroys uncommitted work
git clean -fd       # Deletes files permanently
git checkout -- .   # Discards all changes
git stash pop       # Can cause conflicts; let human handle stashes
git stash drop      # Loses stashed work
git push --force    # Overwrites remote history
git rebase -i       # Can lose commits
```

**If user requests these:** REFUSE and offer safe alternatives from `AGENTS.md`.

**Reference incident (2026-01-14):** `git reset --hard` deleted 8 apps. Recovery took days. See `docs/RECOVERY-PLAN-2026-01-14.md`.

#### Other Preservation Rules

- **Never delete files** — Move to `archive/` folder instead
- **Never delete plans** — Mark as COMPLETED and move to `docs/historical/`
- **Read before edit** — Don't assume file contents
- **Fix root causes** — Don't take shortcuts that create tech debt

### PLAN DOCUMENTATION LIFECYCLE (MANDATORY)

Plans are critical artifacts for understanding project history, decision-making, and reconstruction of events. They must NEVER be deleted and MUST include proper attribution and dating.

#### 1. Plans Are NEVER Deleted

**ABSOLUTE PROHIBITION** - Plans are historical records that may be needed for:
- Understanding why decisions were made
- Reconstructing timelines after incidents
- Auditing who did what and when
- Learning from past approaches

**Correct approach:**
```markdown
# WRONG - Information destroyed
[Delete the plan file when done]
rm docs/plans/feature-xyz-plan.md

# RIGHT - Archive and mark complete
mv docs/plans/feature-xyz-plan.md docs/historical/plans/feature-xyz-plan.md
# Then add completion header to the file (see below)
```

#### 2. Required Plan Metadata Headers

Every plan document MUST include these metadata fields at the top:

```markdown
---
Type: Plan
Status: Active | Completed | Superseded | Frozen
Domain: <CMS | Runtime | Platform | Commerce | etc.>
Created: YYYY-MM-DD
Created-by: <Human name> | Claude <model> | Codex
Last-updated: YYYY-MM-DD
Last-updated-by: <Human name> | Claude <model> | Codex
Completed: YYYY-MM-DD (if applicable)
Completed-by: <Human name> | Claude <model> | Codex (if applicable)
Superseded-by: <path to new plan> (if applicable)
Related-PR: #123 (if applicable)
---
```

**Example:**
```markdown
---
Type: Plan
Status: Completed
Domain: CMS
Created: 2026-01-10
Created-by: Peter Cowling
Last-updated: 2026-01-15
Last-updated-by: Claude Opus 4.5
Completed: 2026-01-15
Completed-by: Claude Opus 4.5
Related-PR: #456
---

# Feature XYZ Implementation Plan

## Completion Summary
Implemented in PR #456 on 2026-01-15. All tasks completed successfully.

[Original plan content preserved below...]
```

#### 3. Authorship Attribution Rules

**Always track who did what:**
- Human work: Use full name (e.g., "Peter Cowling")
- Claude work: Use "Claude <model>" (e.g., "Claude Opus 4.5", "Claude Sonnet 4")
- Codex work: Use "Codex"
- Collaborative work: List all contributors (e.g., "Peter Cowling, Claude Opus 4.5")

**In commit messages, always include:**
```
Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```
or
```
Co-Authored-By: Codex <noreply@openai.com>
```

#### 4. Plan Status Transitions

Plans move through these states:

```
Active → Completed (work finished, plan archived)
Active → Superseded (replaced by better plan)
Active → Frozen (paused indefinitely, may resume)
```

**When completing a plan:**
1. Update the `Status:` to `Completed`
2. Add `Completed:` date and `Completed-by:` attribution
3. Add a "Completion Summary" section at the top
4. Move to `docs/historical/plans/` directory
5. Update any references to point to archived location

**When superseding a plan:**
1. Update old plan's `Status:` to `Superseded`
2. Add `Superseded-by:` pointing to the new plan
3. Move old plan to `docs/historical/plans/`
4. New plan should reference the old plan in its context

#### 5. Archive Directory Structure

```
docs/
├── historical/
│   ├── plans/           # Completed and superseded plans (flat, no date subdirs)
│   ├── research/        # Historical research docs
│   └── decisions/       # Historical decision records
```

**Note:** The canonical plan metadata fields are defined in `AGENTS.md`. Optional fields like `Related-PR` and `Relates-to charter` can be added when relevant.

#### 6. Why This Matters

**Reference incident (2026-01-14):** During recovery from a `git reset --hard` incident, the ability to reconstruct work depended entirely on having preserved documentation with clear authorship and dates. Without this metadata, determining what was lost and who did what would have been impossible.

Plans with proper attribution allow:
- **Audit trails**: Who made decisions and when
- **Reconstruction**: Rebuild lost work from documented plans
- **Learning**: Understand past approaches and their outcomes
- **Accountability**: Clear ownership of work and decisions

### File Operations
- **Read before write:** ALWAYS read a file with the Read tool before editing
- **Prefer Edit over Write:** Use Edit for existing files, Write only for new files
- **Don't create docs:** Never proactively create README.md or documentation files unless explicitly requested
- **Avoid over-engineering:** Only make changes that are directly requested

### TypeScript
- Use project references for package dependencies
- Apps must map workspace packages to both `src` and `dist` in tsconfig paths
- Provider packages need: `composite: true`, `declaration: true`, `declarationMap: true`

### Testing
- **Avoid workspace-wide tests** unless explicitly asked
- Prefer scoped runs: `pnpm --filter @acme/platform-core test`
- Seed data before E2E: `pnpm --filter @acme/platform-core exec prisma db seed`
- Coverage: `pnpm test:coverage`

### Git & Commits

**Follow `AGENTS.md` Git Safety Rules.** Key points:

- **Commit automatically every 30 minutes** (or after significant changes) — see AGENTS.md Rule 1
- **Push to GitHub every 2 hours** (or every 3 commits) — see AGENTS.md Rule 2
- **Work on `work/*` branches only** — never directly on `main`
- **Never run destructive commands** — see prohibited list in AGENTS.md Rule 3
- Use attribution matching the agent that did the work (see AGENTS.md for format)
- Use heredoc for commit messages
- Resolve conflicts properly — never reset to avoid them

### Code Style
- Don't add unnecessary error handling for scenarios that can't happen
- Trust internal code and framework guarantees
- Don't create abstractions for one-time operations
- Don't add comments/docstrings to code you didn't change
- Delete unused code completely (no `// removed` comments)

## Common Commands

### Development
```bash
# Start all apps in dev mode
pnpm dev

# Start specific app
pnpm --filter @apps/cms dev
pnpm --filter @apps/brikette dev

# Type checking (watch mode)
pnpm typecheck:watch

# Build everything
pnpm build

# Build specific dependencies for CMS
pnpm build:cms-deps
```

### Testing
```bash
# Run tests for specific package
pnpm --filter @acme/platform-core test

# E2E tests
pnpm e2e
pnpm e2e:cms
pnpm e2e:shop

# Storybook
pnpm storybook
pnpm test-storybook

# Coverage
pnpm test:coverage
```

### Linting & Quality
```bash
pnpm lint
pnpm typecheck
pnpm format
```

### Database
```bash
# Generate Prisma client
pnpm prisma:generate

# Seed database
pnpm --filter @acme/platform-core exec prisma db seed

# Seed with skip inventory
pnpm --filter @acme/platform-core exec prisma db seed -- --skip-inventory
```

### Shop Management
```bash
# Initialize new shop
pnpm init-shop

# Inventory operations
pnpm inventory export <shop> --file inventory.csv
pnpm inventory import <shop> --file inventory.json
pnpm inventory:check
```

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

### Environment Variables
- Next.js apps: `NEXT_PUBLIC_*` for client-side
- Server-only: no prefix required
- See `.env.template` and `docs/.env.reference.md`

### Client-Only Code (App Router)
```typescript
// Use 'use client' directive
'use client'

export function ClientComponent() {
  // Can use window, localStorage, etc.
}
```

## Security

- Content Security Policy enforced via middleware
- Strict-Transport-Security headers
- Never commit secrets or `.env` files
- Warn if user tries to commit `.env`, `credentials.json`, etc.

## Database Schema Highlights

```prisma
Shop             // JSON shop configuration
Page             // Per-shop pages
RentalOrder      // Rental transactions
SubscriptionUsage // Monthly shipment counts
CustomerProfile  // Customer metadata
CustomerMfa      // MFA secrets
User             // Application users
ReverseLogisticsEvent // Return tracking
```

## Development Ports

Check `docs/dev-ports.md` for current port assignments. Common ones:
- CMS: 3006
- Storybook: 6007
- Shops: Various (see dev-ports.md)

## Migration & Upgrade Guidance

- Check `docs/plans/` for active migration plans
- Check `docs/upgrade-preview-republish.md` for shop upgrade workflows
- Inventory is JSON-based (migration to Prisma planned - see `docs/inventory-migration.md`)

## When Asked to Code

### Before Writing Code
1. Read relevant files first (don't assume structure)
2. Check existing patterns in the codebase
3. Review architecture docs for the relevant layer
4. Verify you're in the correct package/app

### During Implementation
1. Use TodoWrite to track multi-step tasks
2. Follow existing code style and patterns
3. Respect the UI layer hierarchy
4. Use existing types and utilities
5. Add tests if the area has test coverage

### After Implementation
1. Run relevant tests: `pnpm --filter <package> test`
2. Run type checking: `pnpm typecheck`
3. Run linting: `pnpm lint`
4. Commit changes (follow AGENTS.md Rule 1 — commit every 30 min or after significant work)

## Common Pitfalls to Avoid

### Destructive Actions (CRITICAL)
1. **NEVER run `git reset --hard`** - This destroyed 8 apps worth of work on 2026-01-14
2. **NEVER run `git clean`, `git checkout -- .`, or other destructive git commands**
3. **NEVER delete files** - Archive them instead (`mv file.ts archive/file.ts`)
4. **NEVER delete plan files** - Mark them as COMPLETED with status header
5. **NEVER take shortcuts** - If a solution involves deleting something to simplify, find another way

### Architecture & Code
6. **Don't break layer hierarchy** - atoms can't import organisms
7. **Don't import from internal paths** - use package exports
8. **Don't use bash for file operations** - use Read/Edit/Write tools
9. **Don't create files unnecessarily** - prefer editing existing ones
10. **Don't work directly on `main`** - use `work/*` branches (see AGENTS.md)
11. **Don't add backwards-compatibility hacks** - archive unused code instead
12. **Don't guess URLs** - only use user-provided or documented URLs
13. **Don't add time estimates** - focus on what needs to be done

### Decision Making
14. **Don't assume you know what a file contains** - Read it first
15. **Don't fix symptoms instead of causes** - Investigate root cause
16. **Don't choose easy over correct** - The extra effort now saves pain later

## Helpful Context

- This is a rental/e-commerce platform with deposits handled via Stripe
- Inventory tracks stock levels and sends low-stock alerts
- Multiple shops can be created and managed via the CMS
- Page Builder allows visual editing of shop pages
- Marketing automation supports SendGrid and Resend
- Offline support via Service Workers (see XA app pattern)

## Getting Help

- Full docs: `docs/`
- Testing docs: `__tests__/docs/testing.md`
- Plans & RFCs: `docs/plans/`, `docs/cms-plan/`
- Troubleshooting: `docs/troubleshooting.md`

## Quick Reference

| Task | Command |
|------|---------|
| Install | `pnpm install` |
| Dev | `pnpm --filter <app> dev` |
| Build | `pnpm build` |
| Test | `pnpm --filter <package> test` |
| Typecheck | `pnpm typecheck` |
| Lint | `pnpm lint` |
| Format | `pnpm format` |
| Storybook | `pnpm storybook` |

---

**Last Updated:** 2026-01-15

**Incident Reference:** See `docs/RECOVERY-PLAN-2026-01-14.md` for why destructive commands are prohibited.

For questions or clarifications, check the extensive documentation in `docs/` or ask the user.
