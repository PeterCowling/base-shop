# Contributing to Prime

## Development Workflow

### Linting

Prime has a **touched-file lint non-regression gate** (TASK-50). This means:

1. **Changed files must pass lint** - Any file you modify in a PR must pass ESLint checks
2. **Existing lint debt is allowed** - Untouched files with lint errors won't block your PR
3. **Local development mirrors CI** - Run `pnpm lint` to check only your changes

#### Commands

```bash
# Changed-file lint (default, used by pre-commit hooks and CI)
pnpm --filter @apps/prime lint

# Full codebase lint (for reference or cleanup work)
pnpm --filter @apps/prime lint -- --full
```

#### How It Works

The lint script (`apps/prime/scripts/lint-wrapper.sh`) automatically detects changed files using `git diff` and runs ESLint only on those files. This ensures:

- Fast feedback (only checking what you changed)
- Non-regression (your changes don't introduce new lint errors)
- Progressive cleanup (existing debt doesn't block progress)

#### Pre-commit Hooks

The repository's pre-commit hook (`scripts/git-hooks/lint-staged-packages.sh`) automatically runs lint on staged Prime files. If lint fails:

1. Review the errors shown in the output
2. Fix the lint errors in your changed files
3. Stage the fixes and commit again

**Do NOT use `--no-verify` to bypass the hooks.** If you encounter persistent issues, reach out to the team.

#### CI Integration

The CI workflow (`.github/workflows/reusable-app.yml`) runs the same changed-file lint gate as your local environment. The "Prime changed-file lint gate" step will fail if:

- You introduce lint errors in files you modified
- The lint script or ESLint configuration is broken

#### Current Lint Debt

As of 2026-02-08, Prime has approximately **1041 lint problems** across the codebase (787 errors, 254 warnings). This is tracked technical debt and won't block your work unless you touch those specific files.

The most common issues are:
- Import sorting (`simple-import-sort/imports`)
- Type import style (`@typescript-eslint/consistent-type-imports`)
- Hardcoded copy warnings (`ds/no-hardcoded-copy` - already disabled as warnings only)

#### Disabled Rules

The following design system rules are intentionally disabled for Prime (see `.eslintrc.cjs`):
- `ds/no-unsafe-viewport-units`
- `ds/container-widths-only-at`
- `ds/no-hardcoded-copy`
- `ds/min-tap-size`
- `ds/enforce-focus-ring-token`

These rules are disabled because Prime is in early development and will adopt design system patterns incrementally.

## Testing

See the main project testing policy in `docs/testing-policy.md`.

## Firebase Cost-Safety

Prime has strict Firebase query budget limits enforced by tests. See Phase 0A tasks in the plan (`docs/plans/prime-guest-portal-gap-plan.md`) for details.
