Type: Guide
Status: Active
Domain: Documentation
Last-reviewed: 2026-01-27

# Quick Index for Claude

This is a fast-reference guide to help Claude navigate this monorepo efficiently.

## Start Here

### Essential Reading (Ralph Methodology)
- [AGENTS.md](../AGENTS.md) - Universal agent runbook (~100 lines)
- [CLAUDE.md](../CLAUDE.md) - Claude-specific context (~160 lines)
- [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md) - Now/Next/Later index

### Workflow (Progressive Disclosure)
- [docs/agents/feature-workflow-guide.md](agents/feature-workflow-guide.md) - Short entrypoint (all agents)
- [.claude/skills/fact-find/SKILL.md](../.claude/skills/fact-find/SKILL.md) - Fact-find mode
- [.claude/skills/plan-feature/SKILL.md](../.claude/skills/plan-feature/SKILL.md) - Planning mode
- [.claude/skills/build-feature/SKILL.md](../.claude/skills/build-feature/SKILL.md) - Building mode
- [.claude/skills/re-plan/SKILL.md](../.claude/skills/re-plan/SKILL.md) - Re-plan mode

### Key Policies
- [docs/testing-policy.md](testing-policy.md) - Testing rules (MANDATORY)
- [docs/git-safety.md](git-safety.md) - Git safety rules

### Quick Context
- **Monorepo:** Turborepo + pnpm workspaces
- **Tech Stack:** Next.js 15, React 19, TypeScript, Prisma, Tailwind 4
- **Package Manager:** pnpm 10.12.1
- **Node Version:** >=20

## 📚 Architecture

### Core Architecture Docs
- [docs/architecture.md](architecture.md) - Component layers and package hierarchy
- [docs/platform-vs-apps.md](platform-vs-apps.md) - Where to put code
- [docs/persistence.md](persistence.md) - Database and data layer

### Key Concepts
- **UI Layers:** atoms → molecules → organisms → templates → pages (one-way imports)
- **Package Layers:** apps → CMS packages → ui → platform-core → low-level libs
- **Rule:** Higher layers can import lower layers, but never vice versa

## 🔧 Development

### Workflow & CI
- [docs/development.md](development.md) - CI/CD and workflows
- [docs/contributing.md](contributing.md) - Contribution guidelines
- [docs/troubleshooting.md](troubleshooting.md) - Common issues and fixes

### Code Quality
- [docs/linting.md](linting.md) - Linting rules and exceptions
- [__tests__/docs/testing.md](../__tests__/docs/testing.md) - Testing strategy
- [docs/coverage.md](coverage.md) - Coverage guidelines

## 🎨 Domain-Specific Documentation

### CMS (Content Management System)
- [docs/cms-plan/index.md](cms-plan/index.md) - CMS roadmap and active tasks
- [docs/cms.md](cms.md) - CMS operator guide
- [apps/cms/](../apps/cms/) - CMS application code
- [docs/shop-editor-refactor.md](shop-editor-refactor.md) - Shop editor details

### UI Components & Design System
- [packages/ui/components/](../packages/ui/components/) - Component library
  - `atoms/` - Primitives (Button, Input)
  - `molecules/` - Atom compositions
  - `organisms/` - Complex UI sections
  - `templates/` - Page layouts
- [docs/typography-and-color.md](typography-and-color.md) - Design tokens
- [packages/design-tokens/](../packages/design-tokens/) - Token definitions

### Platform Core (Domain Logic)
- [packages/platform-core/](../packages/platform-core/) - Business logic
- [packages/platform-core/prisma/schema.prisma](../packages/platform-core/prisma/schema.prisma) - Database schema
- [docs/orders.md](orders.md) - Order management
- [docs/machine.md](machine.md) - State machines and services

### Shops (Applications)
- [apps/brikette/](../apps/brikette/) - Brikette shop
- [apps/skylar/](../apps/skylar/) - Skylar shop
- [apps/cochlearfit/](../apps/cochlearfit/) - Cochlearfit shop
- [packages/template-app/](../packages/template-app/) - Shop template

### Internationalization (i18n)
- [docs/i18n/](i18n/) - i18n documentation
- [docs/adr/adr-00-i18n-foundation.md](adr/adr-00-i18n-foundation.md) - i18n architecture decision
- [packages/i18n/](../packages/i18n/) - i18n implementation

### Theming & Styling
- [docs/theming.md](theming.md) - Theming system
- [docs/palette.md](palette.md) - Color palette
- [docs/theme-lifecycle-and-library.md](theme-lifecycle-and-library.md) - Theme management
- [tailwind.config.mjs](../tailwind.config.mjs) - Tailwind configuration

## 📋 Common Tasks

### Create a Component

1. **Determine layer** (atom/molecule/organism/template)
2. **Read existing patterns:**
   ```bash
   # Find similar components
   pnpm claude:find-component <ComponentName>
   ```
3. **Check layer rules:** Can only import from lower layers
4. **Create files:**
   - `<Component>.tsx` - Main component
   - `<Component>.test.tsx` - Unit tests
   - `<Component>.stories.tsx` - Storybook story
   - `index.ts` - Re-export
5. **Run checks:**
   ```bash
   pnpm typecheck
   pnpm --filter @acme/ui test
   ```

### Fix a Bug

1. **Reproduce:** Try to reproduce the issue locally
2. **Investigate:**
   ```bash
   # Check git history
   git log --oneline <file>

   # Search for related code
   # Use Grep tool with appropriate patterns
   ```
3. **Fix minimally:** Make the smallest change that fixes the issue
4. **Add test:** Add regression test to prevent recurrence
5. **Verify:**
   ```bash
   pnpm --filter <affected-package> test
   pnpm typecheck
   ```

### Add a Feature

1. **Check architecture:** Where does this belong?
   - UI component? → `packages/ui/`
   - Domain logic? → `packages/platform-core/`
   - CMS-specific? → `apps/cms/` or `packages/cms-marketing/`
   - Shop-specific? → `apps/<shop>/`
2. **Read existing patterns:** Look for similar features
3. **Follow layer hierarchy:** Respect import rules
4. **Add tests:** Unit tests for logic, integration for flows
5. **Update docs:** If adding public APIs

### Run Tests

```bash
# Single test file (REQUIRED - always use targeted tests)
pnpm --filter @acme/ui test -- src/atoms/Button.test.tsx

# Test pattern match
pnpm --filter @acme/ui test -- --testPathPattern="Button"

# Limit workers for broader runs
pnpm --filter @acme/ui test -- --maxWorkers=2

# NEVER run unfiltered (see docs/testing-policy.md)
# pnpm test  # PROHIBITED - spawns too many workers
```

### Build & Dev

```bash
# Start development
pnpm --filter @apps/cms dev

# Build everything
pnpm build

# Build specific package
pnpm --filter @acme/platform-core build

# Build CMS dependencies
pnpm build:cms-deps

# Type check (watch mode)
pnpm typecheck:watch
```

## 🧭 Decision Trees

### "Where does this code belong?"

```
Is it a UI component?
  Yes → packages/ui/components/<layer>/

Is it domain logic (cart, orders, pricing)?
  Yes → packages/platform-core/

Is it CMS-specific (configurator, editor)?
  Yes → Is it UI?
    Yes → packages/ui/ (if reusable) or apps/cms/src/components/
    No → apps/cms/ or packages/cms-marketing/

Is it shop-specific (branding, custom flows)?
  Yes → apps/<shop-name>/

Is it a shared utility (date formatting, validation)?
  Yes → packages/shared-utils/ or packages/date-utils/

Is it configuration?
  Yes → packages/config/
```

### "Can package A import package B?"

```
1. Check layer hierarchy in docs/architecture.md
2. Run: pnpm claude:check-deps A B (if available)

Rules:
- ✅ Higher layers CAN import lower layers
- ❌ Lower layers CANNOT import higher layers
- ❌ Apps CANNOT be imported by packages
- ❌ NEVER import from /src/ directly (use package exports)
- ⚠️  Avoid importing from /internal/ unless documented
```

### "Should I create a new file or edit existing?"

```
Does the file already exist?
  Yes → ALWAYS prefer editing existing file (use Edit tool)
  No → Is it necessary for the task?
    Yes → Create it (use Write tool)
    No → Don't create it (especially README/docs)
```

## ⚡ Quick Commands Reference

### Development
```bash
pnpm --filter @apps/cms dev         # Start CMS
pnpm --filter @apps/brikette dev    # Start Brikette shop
pnpm typecheck:watch                # Watch mode type checking
pnpm storybook                      # Start Storybook
```

### Testing
```bash
pnpm --filter @acme/ui test                        # Test UI package
pnpm test:affected                                 # Test changed packages
pnpm e2e                                           # E2E tests
pnpm --filter @acme/ui test -- --watch             # Watch mode
```

### Building
```bash
pnpm build                           # Build all
pnpm build:cms-deps                  # Build CMS dependencies
pnpm --filter @acme/platform-core build  # Build specific package
```

### Linting & Quality
```bash
pnpm lint                            # Lint all
pnpm typecheck                       # Type check all
pnpm format                          # Format with Prettier
```

### Database
```bash
pnpm prisma:generate                 # Generate Prisma client
pnpm --filter @acme/platform-core exec prisma db seed  # Seed database
```

### Inventory
```bash
pnpm inventory export demo --file inventory.csv   # Export inventory
pnpm inventory import demo --file inventory.json  # Import inventory
pnpm inventory:check                              # Validate inventory
```

## 🚨 Common Pitfalls & Fixes

### TypeScript Errors

**"Cannot find module '@acme/...'"**
```bash
# Build the package first
pnpm --filter @acme/<package> build
# Or build all
pnpm -r build
```

**Type mismatches after schema change**
```bash
pnpm prisma:generate
pnpm typecheck
```

### Build Failures

**Next.js build fails**
```bash
# Clear caches
rm -rf apps/<app>/.next
rm -rf .turbo
pnpm build
```

**Stale types**
```bash
# Rebuild packages
pnpm -r build
# Delete tsbuildinfo files
find . -name "*.tsbuildinfo" -delete
```

### Import Errors

**Importing from wrong path**
```
❌ import { x } from '@acme/ui/src/components/...'
✅ import { x } from '@acme/ui'

❌ import { y } from '@acme/platform-core/src/internal/...'
✅ import { y } from '@acme/platform-core'
```

### Test Failures

**Tests pass in IDE but fail in CLI**
- Check jest.setup.ts is loaded
- Verify package-specific jest.config
- Clear jest cache: `pnpm --filter <pkg> test -- --clearCache`

## 📦 Package Quick Reference

### Core Packages
- `@acme/platform-core` - Domain logic, database, persistence
- `@acme/ui` - Design system and components
- `@acme/config` - Shared configuration
- `@acme/types` - Shared TypeScript types

### Infrastructure
- `@acme/auth` - Authentication logic
- `@acme/email` - Email templates and sending
- `@acme/stripe` - Stripe integration
- `@acme/i18n` - Internationalization

### Tools
- `@acme/design-tokens` - Design tokens
- `@acme/zod-utils` - Zod schema utilities
- `@acme/date-utils` - Date formatting and utilities
- `@acme/shared-utils` - Common utilities

### CMS & Features
- `@acme/cms-marketing` - Marketing features
- `@acme/configurator` - Product configurator
- `@acme/page-builder-core` - Page builder logic
- `@acme/page-builder-ui` - Page builder UI

## 🔗 External Resources

### Technology Documentation
- [Next.js 15 Docs](https://nextjs.org/docs)
- [React 19 Docs](https://react.dev)
- [Prisma Docs](https://www.prisma.io/docs)
- [Tailwind CSS 4](https://tailwindcss.com/docs)
- [Turborepo Docs](https://turbo.build/repo/docs)

### Testing
- [Jest](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Cypress](https://docs.cypress.io)
- [Playwright](https://playwright.dev/docs/intro)

## 💡 Tips for Claude

1. **Always read before editing** - Use Read tool before Edit/Write
2. **Respect layer hierarchy** - Check architecture.md for import rules
3. **Run scoped tests** - Don't run workspace-wide unless asked
4. **Use TodoWrite for multi-step tasks** - Track progress
5. **Follow existing patterns** - Look at similar code first
6. **Don't over-engineer** - Make minimal, targeted changes
7. **Only commit if asked** - Never commit without explicit request
8. **Check types frequently** - Run `pnpm typecheck` after changes
9. **Use helper scripts** - `pnpm claude:*` commands when available
10. **Ask if unsure** - Better to clarify than make wrong assumptions

## 📈 Success Metrics

When working effectively, you should:
- ✅ Find relevant files quickly using docs
- ✅ Make changes that pass type checking
- ✅ Follow architectural patterns consistently
- ✅ Add tests that actually prevent regressions
- ✅ Avoid creating unnecessary files
- ✅ Respect the monorepo structure

---

**Need more help?** Check the full documentation in `docs/` or ask the user for clarification.
