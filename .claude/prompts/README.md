# Claude Prompt Templates

This directory contains reusable prompt templates for common tasks in this monorepo.

## Usage

Reference these prompts when asking Claude to perform specific tasks. Each prompt includes:
- Context about the monorepo
- Step-by-step workflow
- Quality checks
- Testing requirements

## Available Prompts

### Component Development
- `create-ui-component.md` - Create new UI components (atoms/molecules/organisms)
- `migrate-component.md` - Migrate components from legacy codebases
- `refactor-component.md` - Refactor existing components

### Next.js & React
- `create-app-route.md` - Create new App Router routes
- `migrate-to-app-router.md` - Migrate Pages Router to App Router
- `create-server-action.md` - Create type-safe server actions
- `add-loading-state.md` - Add proper loading and error boundaries

### Database & API
- `create-prisma-model.md` - Add new Prisma models
- `create-api-route.md` - Create API routes with validation
- `add-repository-method.md` - Extend repository pattern

### Testing
- `add-component-tests.md` - Write comprehensive component tests
- `add-integration-tests.md` - Create integration tests
- `fix-failing-tests.md` - Debug and fix test failures

### Styling & Design
- `apply-design-tokens.md` - Use design tokens correctly
- `implement-responsive-design.md` - Make components responsive
- `add-dark-mode.md` - Add dark mode support

### Monorepo Management
- `create-new-package.md` - Scaffold new workspace package
- `migrate-to-monorepo.md` - Migrate external code to monorepo
- `fix-dependency-issues.md` - Resolve dependency conflicts

## How to Use

1. **Copy the prompt template** - Start with the relevant .md file
2. **Fill in placeholders** - Replace {{variables}} with your specifics
3. **Ask Claude** - Paste the filled prompt or reference it
4. **Review output** - Claude will follow the documented workflow

## Adding New Prompts

When adding new prompts:
1. Follow the template structure below
2. Include monorepo-specific context
3. Reference architectural patterns
4. Add quality checks
5. Include testing requirements

### Prompt Template Structure

```markdown
# [Task Name]

## Context
Brief description of what this prompt does and when to use it.

## Prerequisites
- List any requirements
- Files that should exist
- Knowledge needed

## Workflow
1. Step-by-step instructions
2. Use Read tool to understand context
3. Make changes following patterns
4. Run tests
5. Verify output

## Quality Checks
- [ ] Checklist of validation steps
- [ ] Type checking passes
- [ ] Tests added and passing
- [ ] Follows architectural patterns

## Example
Show an example usage if helpful.
```
