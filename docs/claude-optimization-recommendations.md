Type: Guide
Status: Active
Domain: Development
Last-reviewed: 2026-01-12

# Claude Code Optimization Recommendations

This document provides actionable recommendations to optimize this repository for working with Claude Code (CLI) and Claude in VSCode.

## Current State Assessment

### ✅ What's Already Great

1. **Excellent Documentation Structure**
   - Well-organized `docs/` with clear hierarchy
   - `AGENTS.md` files for AI guidance
   - `docs/AGENTS.docs.md` with doc taxonomy
   - Clear plans in `docs/plans/` and `docs/cms-plan/`

2. **Strong Type Safety**
   - TypeScript with project references
   - Strict compiler options
   - Clear module boundaries

3. **Good Testing Infrastructure**
   - Jest, Cypress, Playwright, Storybook
   - Scoped test commands
   - CI workflows

4. **Clear Conventions**
   - Monorepo structure with Turborepo
   - Package layering rules
   - UI component hierarchy (Atomic Design)

## Recommended Improvements

### 1. VSCode/IDE Configuration

#### 1.1 Create `.vscode/extensions.json`
**Priority: High** | **Effort: Low**

Add recommended extensions for the team:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-vscode.vscode-typescript-next",
    "vitest.explorer",
    "orta.vscode-jest",
    "cypressio.cypress-support"
  ]
}
```

**Why:** Ensures consistent tooling across the team and Claude has context about available extensions.

#### 1.2 Enhance `.vscode/settings.json`
**Priority: High** | **Effort: Low**

Current settings are minimal. Add:

```json
{
  "eslint.suppressWarningIgnored": true,
  "eslint.experimental.useFlatConfig": true,

  // TypeScript
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "typescript.preferences.preferTypeOnlyAutoImports": true,

  // Formatting
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },

  // Tailwind
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ],

  // Files
  "files.exclude": {
    "**/.next": true,
    "**/.turbo": true,
    "**/node_modules": true,
    "**/.eslintcache": true,
    "**/dist": true
  },
  "search.exclude": {
    "**/.next": true,
    "**/.turbo": true,
    "**/node_modules": true,
    "**/dist": true,
    "**/coverage": true,
    "**/storybook-static": true,
    "pnpm-lock.yaml": true
  },

  // Monorepo support
  "typescript.tsserver.experimental.enableProjectDiagnostics": true,

  // Test
  "jest.autoRun": "off",
  "jest.showCoverageOnLoad": false
}
```

**Why:** Provides Claude with context about editor preferences and improves development experience.

#### 1.3 Add `.vscode/tasks.json`
**Priority: Medium** | **Effort: Low**

Add common tasks for quick execution:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Dev: CMS",
      "type": "shell",
      "command": "pnpm --filter @apps/cms dev",
      "problemMatcher": [],
      "isBackground": true
    },
    {
      "label": "Build: All",
      "type": "shell",
      "command": "pnpm build",
      "problemMatcher": ["$tsc"],
      "group": {
        "kind": "build",
        "isDefault": true
      }
    },
    {
      "label": "Typecheck: Watch",
      "type": "shell",
      "command": "pnpm typecheck:watch",
      "problemMatcher": ["$tsc-watch"],
      "isBackground": true
    },
    {
      "label": "Test: Affected",
      "type": "shell",
      "command": "pnpm test:affected",
      "problemMatcher": []
    }
  ]
}
```

**Why:** Makes common commands easily accessible via VSCode's task system.

### 2. Claude-Specific Configuration

#### 2.1 Create `.claude/config.json`
**Priority: High** | **Effort: Low**

Add Claude Code configuration:

```json
{
  "contextFiles": [
    "CLAUDE.md",
    "AGENTS.md",
    "README.md",
    "docs/architecture.md",
    "docs/development.md",
    "docs/AGENTS.docs.md"
  ],
  "ignorePatterns": [
    "**/.next/**",
    "**/.turbo/**",
    "**/node_modules/**",
    "**/dist/**",
    "**/coverage/**",
    "**/storybook-static/**",
    "**/.eslintcache",
    "**/pnpm-lock.yaml",
    "**/*.log"
  ],
  "maxContextTokens": 100000,
  "preferredEditor": "vscode"
}
```

**Why:** Tells Claude which files to prioritize for context and what to ignore.

#### 2.2 Create `.claude/prompts/` Directory
**Priority: Medium** | **Effort: Medium**

Add reusable prompt templates:

**`.claude/prompts/new-component.md`:**
```markdown
# Create New Component

Create a new {{type}} component following these guidelines:

1. Location: `packages/ui/components/{{type}}s/{{name}}/`
2. Files to create:
   - `{{name}}.tsx` - Main component
   - `{{name}}.test.tsx` - Unit tests
   - `{{name}}.stories.tsx` - Storybook story
   - `index.ts` - Re-export

3. Follow atomic design hierarchy:
   - Atoms can't import other UI components
   - Molecules can import atoms only
   - Organisms can import molecules and atoms
   - Templates can import organisms, molecules, and atoms

4. Use TypeScript with proper prop types
5. Add JSDoc comments for public props
6. Ensure accessibility (ARIA labels, keyboard navigation)
7. Use design tokens from `@acme/design-tokens`
```

**`.claude/prompts/test-component.md`:**
```markdown
# Test Component

Write comprehensive tests for {{component}} covering:

1. **Rendering**
   - Renders without crashing
   - Renders with different prop combinations
   - Handles edge cases (empty, null, undefined)

2. **Interactions**
   - Click handlers
   - Form submissions
   - Keyboard navigation

3. **Accessibility**
   - Has proper ARIA labels
   - Keyboard accessible
   - Screen reader friendly

4. **Edge Cases**
   - Error states
   - Loading states
   - Empty states

Use `@testing-library/react` and `jest-axe` for a11y testing.
```

**`.claude/prompts/fix-bug.md`:**
```markdown
# Bug Fix Template

When fixing a bug:

1. **Understand the Issue**
   - Read the bug description carefully
   - Reproduce the bug if possible
   - Check related test failures

2. **Locate the Root Cause**
   - Use Read tool to examine relevant files
   - Check recent git history: `git log --oneline <file>`
   - Look for related issues in comments

3. **Implement Fix**
   - Make minimal changes
   - Follow existing patterns
   - Add defensive checks if needed
   - Update types if necessary

4. **Add Tests**
   - Add regression test for the bug
   - Ensure existing tests still pass
   - Add edge case tests if applicable

5. **Document**
   - Update comments if behavior changed
   - Update relevant docs if needed
```

**Why:** Provides reusable templates that ensure Claude follows best practices consistently.

#### 2.3 Create `.claude/hooks/pre-commit.sh`
**Priority: Low** | **Effort: Low**

Add a hook that Claude can reference:

```bash
#!/bin/bash
# Pre-commit checks for Claude to reference
# This is NOT an actual git hook, but guidance for Claude

echo "🔍 Running pre-commit checks..."

# Typecheck
echo "📘 Type checking..."
pnpm typecheck || exit 1

# Lint
echo "🔧 Linting..."
pnpm lint || exit 1

# Test affected
echo "🧪 Testing affected packages..."
pnpm test:affected || exit 1

echo "✅ All checks passed!"
```

**Why:** Documents the checks Claude should run before suggesting commits.

### 3. Documentation Enhancements

#### 3.1 Create `docs/claude-patterns.md`
**Priority: High** | **Effort: Medium**

Document common patterns Claude should follow:

```markdown
# Claude Code Patterns

## Component Creation Pattern

When creating a new component:

1. Read the target directory first
2. Check for similar components
3. Follow the atomic design layer rules
4. Create tests alongside component
5. Add Storybook story if relevant
6. Run type checking: `pnpm typecheck`
7. Run tests: `pnpm --filter @acme/ui test`

## Bug Fix Pattern

1. Reproduce the issue (if possible)
2. Read relevant files with context
3. Check git history: `git log --oneline <file>`
4. Make minimal, targeted changes
5. Add regression test
6. Verify fix with tests
7. Only commit if explicitly requested

## Refactoring Pattern

1. Get explicit approval before refactoring
2. Read all affected files first
3. Make changes incrementally
4. Run tests after each logical step
5. Keep commits atomic if requested

## Testing Pattern

1. Always run scoped tests: `pnpm --filter <package> test`
2. Never run workspace-wide tests unless asked
3. Check test coverage if critical code
4. Add tests for new features
5. Add regression tests for bugs
```

**Why:** Provides Claude with proven patterns to follow.

#### 3.2 Enhance `CLAUDE.md`
**Priority: Medium** | **Effort: Low**

Add sections we may have missed:

```markdown
## Working with Specific Technologies

### Prisma
- Schema: `packages/platform-core/prisma/schema.prisma`
- Generate client: `pnpm prisma:generate`
- Migrations: Handled per environment
- Never modify generated client files

### Tailwind CSS
- Config: `tailwind.config.mjs`
- Design tokens: `packages/design-tokens/`
- Use utility classes, not arbitrary values
- Follow token system for colors, spacing, typography

### XState
- Machines: `packages/platform-machine/`
- Always define explicit states and transitions
- Use type-safe machine configs
- Test state transitions

### Next.js App Router
- Use 'use client' for client components
- Server Components by default
- Route handlers in `app/api/`
- Middleware in app root

## Common Debugging Patterns

### Build Failures
1. Check TypeScript errors: `pnpm typecheck`
2. Check missing dependencies: `pnpm install`
3. Clear Next cache: `rm -rf .next`
4. Clear Turbo cache: `rm -rf .turbo`

### Test Failures
1. Run in watch mode for quick iteration
2. Use `--testPathPattern` to focus
3. Check for stale mocks
4. Verify test data fixtures

### Type Errors
1. Regenerate Prisma client if schema changed
2. Check tsconfig paths mappings
3. Verify package exports in package.json
4. Run incremental build: `pnpm -r build`
```

#### 3.3 Create `docs/troubleshooting-claude.md`
**Priority: Medium** | **Effort: Medium**

Add Claude-specific troubleshooting:

```markdown
# Troubleshooting for Claude

## Common Issues and Solutions

### "Cannot find module" Errors

**Symptom:** Import statements fail to resolve
**Diagnosis:**
1. Check if package exists in workspace
2. Verify tsconfig paths mappings
3. Check if package was built (dist/ exists)

**Solution:**
```bash
# Build the specific package
pnpm --filter <package> build

# Or build all dependencies
pnpm -r build
```

### "Type X is not assignable to type Y"

**Symptom:** TypeScript type mismatch
**Diagnosis:**
1. Check if types are up to date
2. Verify Prisma client is generated
3. Look for circular dependencies

**Solution:**
```bash
# Regenerate Prisma client
pnpm prisma:generate

# Full typecheck
pnpm typecheck
```

### Test Failures in Scoped Runs

**Symptom:** Tests pass in IDE but fail in scoped runs
**Diagnosis:**
1. Check for missing test setup
2. Verify jest.config imports
3. Check for global state pollution

**Solution:**
- Read `jest.setup.ts`
- Check package-specific jest.config
- Isolate test cases

### ESLint Configuration Conflicts

**Symptom:** Different lint errors in different contexts
**Diagnosis:**
1. Check if using flat config (eslint.config.mjs)
2. Verify ESLint version compatibility
3. Check for conflicting configs

**Solution:**
- Use eslint.config.mjs (primary config)
- Clear ESLint cache: `rm .eslintcache`
```

### 4. Git and Workflow Improvements

#### 4.1 Create `.gitattributes`
**Priority: Low** | **Effort: Low**

Help Claude understand text vs binary files:

```
# Auto detect text files and normalize line endings
* text=auto

# Source code
*.ts text eol=lf
*.tsx text eol=lf
*.js text eol=lf
*.jsx text eol=lf
*.json text eol=lf
*.md text eol=lf
*.yml text eol=lf
*.yaml text eol=lf

# Configs
*.config.js text eol=lf
*.config.mjs text eol=lf
*.config.ts text eol=lf
.eslintrc* text eol=lf
.prettierrc* text eol=lf

# Prisma
*.prisma text eol=lf

# Shell scripts
*.sh text eol=lf

# Lock files (binary)
pnpm-lock.yaml -diff -merge

# Images
*.png binary
*.jpg binary
*.jpeg binary
*.gif binary
*.ico binary
*.svg text
*.webp binary

# Fonts
*.woff binary
*.woff2 binary
*.ttf binary
*.otf binary
```

**Why:** Ensures consistent line endings and helps diff tools.

#### 4.2 Add `.github/CLAUDE_WORKFLOW.md`
**Priority: Medium** | **Effort: Medium**

Document the workflow for Claude:

```markdown
# Claude Workflow for This Repository

## Before Starting Work

1. Read relevant documentation:
   - `CLAUDE.md` (main guide)
   - `AGENTS.md` (global runbook)
   - Relevant files in `docs/`

2. Understand the task:
   - What needs to be done?
   - What's the scope?
   - Are there dependencies?

3. Check current state:
   - Read existing code
   - Check git history
   - Review related tests

## During Work

1. Use TodoWrite for multi-step tasks
2. Read before editing files
3. Follow architectural patterns
4. Run relevant tests frequently
5. Check types: `pnpm typecheck`

## After Work

1. Run checks:
   ```bash
   pnpm typecheck
   pnpm lint
   pnpm --filter <affected-packages> test
   ```

2. Only commit if explicitly requested
3. Follow commit message format
4. Include co-author line

## Pull Request Checklist

- [ ] All tests pass
- [ ] Type checking passes
- [ ] Linting passes
- [ ] Documentation updated if needed
- [ ] Changes follow architectural patterns
- [ ] No over-engineering
- [ ] Commits follow conventions
```

### 5. Monorepo-Specific Optimizations

#### 5.1 Create `scripts/claude-helpers/`
**Priority: Medium** | **Effort: Medium**

Add helper scripts Claude can reference:

**`scripts/claude-helpers/find-component.sh`:**
```bash
#!/bin/bash
# Help Claude find where a component is defined

COMPONENT=$1

if [ -z "$COMPONENT" ]; then
  echo "Usage: $0 <ComponentName>"
  exit 1
fi

echo "🔍 Searching for component: $COMPONENT"
echo ""

# Search in packages/ui
echo "📦 In packages/ui:"
find packages/ui/components -name "*${COMPONENT}*" -type f 2>/dev/null

echo ""
echo "📱 In apps:"
find apps/*/src -name "*${COMPONENT}*" -type f 2>/dev/null

echo ""
echo "🔎 By content (tsx files):"
grep -r "export.*${COMPONENT}" --include="*.tsx" packages/ui/components apps/*/src | head -5
```

**`scripts/claude-helpers/check-dependencies.sh`:**
```bash
#!/bin/bash
# Check if a package can import from another

CONSUMER=$1
PROVIDER=$2

if [ -z "$CONSUMER" ] || [ -z "$PROVIDER" ]; then
  echo "Usage: $0 <consumer-package> <provider-package>"
  exit 1
fi

echo "🔍 Checking if $CONSUMER can depend on $PROVIDER..."

# Check package.json dependencies
if grep -q "\"$PROVIDER\"" "packages/$CONSUMER/package.json" 2>/dev/null || \
   grep -q "\"$PROVIDER\"" "apps/$CONSUMER/package.json" 2>/dev/null; then
  echo "✅ $CONSUMER already depends on $PROVIDER"
  exit 0
else
  echo "❌ $CONSUMER does not depend on $PROVIDER"
  echo "Add to package.json dependencies or check if this violates layer rules"
  exit 1
fi
```

**`scripts/claude-helpers/validate-import.sh`:**
```bash
#!/bin/bash
# Validate an import path follows conventions

IMPORT=$1

if [[ $IMPORT == *"/src/"* ]]; then
  echo "❌ Invalid: Importing from /src/ directly"
  echo "Use package exports instead"
  exit 1
elif [[ $IMPORT == *"/internal/"* ]]; then
  echo "⚠️  Warning: Importing from /internal/"
  echo "Only do this if explicitly documented"
  exit 1
else
  echo "✅ Import looks good"
  exit 0
fi
```

Make them executable:
```bash
chmod +x scripts/claude-helpers/*.sh
```

#### 5.2 Update `package.json` with helper scripts
**Priority: Low** | **Effort: Low**

Add convenience scripts:

```json
{
  "scripts": {
    "claude:find-component": "bash scripts/claude-helpers/find-component.sh",
    "claude:check-deps": "bash scripts/claude-helpers/check-dependencies.sh",
    "claude:validate-import": "bash scripts/claude-helpers/validate-import.sh"
  }
}
```

### 6. Testing Infrastructure

#### 6.1 Create `scripts/test-helpers/run-affected-tests.sh`
**Priority: Medium** | **Effort: Low**

```bash
#!/bin/bash
# Run tests only for packages that changed

# Get changed files
CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD)

# Extract package names
PACKAGES=$(echo "$CHANGED_FILES" | grep -E "^(packages|apps)/" | cut -d/ -f1-2 | sort -u)

if [ -z "$PACKAGES" ]; then
  echo "No packages changed"
  exit 0
fi

echo "📦 Testing changed packages:"
echo "$PACKAGES"
echo ""

# Run tests for each package
for PKG in $PACKAGES; do
  echo "🧪 Testing $PKG..."
  pnpm --filter "./$PKG" test || exit 1
done

echo "✅ All affected tests passed"
```

### 7. Documentation Index Enhancement

#### 7.1 Create `docs/INDEX_FOR_CLAUDE.md`
**Priority: High** | **Effort: Low**

A quick reference specifically for Claude:

```markdown
# Quick Index for Claude

## Start Here
- `CLAUDE.md` - Main guide for working with this repo
- `AGENTS.md` - Global AI runbook
- `README.md` - Project overview

## Architecture
- `docs/architecture.md` - Component layers and package hierarchy
- `docs/platform-vs-apps.md` - Where to put code
- `tsconfig.base.json` - TypeScript configuration

## Development
- `docs/development.md` - CI/CD and workflows
- `docs/testing.md` - Testing strategy
- `docs/linting.md` - Linting rules and exceptions

## Domain-Specific

### CMS
- `docs/cms-plan/index.md` - CMS roadmap
- `apps/cms/` - CMS application

### UI Components
- `packages/ui/components/` - Design system
- Hierarchy: atoms → molecules → organisms → templates → pages

### Platform Core
- `packages/platform-core/` - Domain logic
- `packages/platform-core/prisma/schema.prisma` - Database schema

### Shops
- `apps/brikette/`, `apps/skylar/`, etc. - Shop implementations
- `packages/template-app/` - Shop template

## Common Tasks

### Create Component
1. Read `docs/claude-patterns.md#component-creation-pattern`
2. Choose layer (atom/molecule/organism)
3. Check existing patterns
4. Create with tests and stories

### Fix Bug
1. Reproduce issue
2. Read relevant code
3. Make minimal fix
4. Add regression test
5. Verify with `pnpm --filter <pkg> test`

### Add Feature
1. Check architecture docs for correct location
2. Read existing patterns
3. Follow layer hierarchy
4. Add tests
5. Update docs if needed

## Quick Commands
```bash
# Development
pnpm --filter @apps/cms dev
pnpm typecheck:watch

# Testing
pnpm --filter @acme/ui test
pnpm test:affected

# Building
pnpm build
pnpm --filter @acme/platform-core build

# Linting
pnpm lint
pnpm typecheck
```

## Decision Trees

### "Where does this code belong?"
- UI component? → `packages/ui/`
- Domain logic? → `packages/platform-core/`
- CMS-specific? → `apps/cms/` or `packages/cms-marketing/`
- Shop-specific? → `apps/<shop>/`
- Shared utility? → `packages/shared-utils/`

### "Can package A import package B?"
- Check `docs/architecture.md` for layer rules
- Run: `pnpm claude:check-deps A B`
- Higher layers CAN import lower layers
- Lower layers CANNOT import higher layers

### "Should I create a new package?"
- Is it used by 3+ apps/packages? → Maybe
- Does it have clear boundaries? → Yes
- Is it a single responsibility? → Yes
- Otherwise → Keep it in existing package
```

## Implementation Plan

### Phase 1: Critical (Do First)
1. ✅ Create `CLAUDE.md` (already done)
2. Create `.claude/config.json`
3. Enhance `.vscode/settings.json`
4. Create `.vscode/extensions.json`
5. Create `docs/INDEX_FOR_CLAUDE.md`
6. Create `docs/claude-patterns.md`

### Phase 2: High Value
1. Create `.claude/prompts/` directory with templates
2. Create `docs/troubleshooting-claude.md`
3. Enhance documentation in `CLAUDE.md`
4. Create `.vscode/tasks.json`

### Phase 3: Nice to Have
1. Create helper scripts in `scripts/claude-helpers/`
2. Add npm scripts for helpers
3. Create `.gitattributes`
4. Create `.github/CLAUDE_WORKFLOW.md`
5. Add test helper scripts

## Maintenance

### Regular Updates (Monthly)
- [ ] Review and update `CLAUDE.md` with new patterns
- [ ] Update `docs/INDEX_FOR_CLAUDE.md` with new docs
- [ ] Review `.claude/config.json` context files
- [ ] Update prompt templates based on learnings

### After Major Changes
- [ ] Update architecture docs if layers change
- [ ] Update helper scripts if commands change
- [ ] Update troubleshooting guide with new issues
- [ ] Refresh documentation index

## Metrics for Success

### Velocity Improvements
- Reduced back-and-forth for locating files
- Faster onboarding for new features
- Fewer architectural violations

### Quality Improvements
- More consistent code patterns
- Better test coverage
- Fewer bugs from misunderstanding architecture

### Developer Experience
- Clearer guidance for Claude
- Faster iterations
- More confidence in suggestions

---

**Next Steps:**
1. Review recommendations with team
2. Prioritize based on current pain points
3. Implement Phase 1 items
4. Gather feedback and iterate
5. Roll out remaining phases
