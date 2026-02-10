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

## Prime Functions Email Staging Contract

`/api/process-messaging-queue` requires the following staging configuration:

- `PRIME_EMAIL_WEBHOOK_URL` (Cloudflare Pages env var)
- `PRIME_EMAIL_WEBHOOK_TOKEN` (Cloudflare secret)

Recommended smoke contract before promoting messaging automation:

```bash
pnpm --filter @apps/prime test -- --testPathPattern="email-provider-smoke"
```

Expected contract outcomes:

- Valid config sends one deterministic `arrival.48hours` message (`sent` outcome).
- Missing config fails closed with `Prime email provider is not configured`.
- Invalid webhook token/key fails closed with explicit webhook error in `lastError`.

## Prime Staff Auth Contract

`/api/staff-auth-session` + staff lookup APIs now require explicit staff auth configuration:

- `PRIME_STAFF_PIN_HASH` (bcrypt hash for the staff PIN)
- `PRIME_FIREBASE_SERVICE_ACCOUNT_EMAIL` (service account client email)
- `PRIME_FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY` (service account PKCS8 private key; `\n`-escaped is supported)
- `CF_FIREBASE_API_KEY` (Identity Toolkit lookup for staff token gate)

Optional controls:

- `PRIME_STAFF_AUTH_UID` (defaults to `prime_staff`)
- `PRIME_STAFF_AUTH_ROLE` (defaults to `staff`, accepts `staff|admin|owner`)
- `PRIME_STAFF_LOCKOUT_MAX_ATTEMPTS` (defaults to `5`)
- `PRIME_STAFF_LOCKOUT_WINDOW_SECONDS` (defaults to `900`)

Recommended validation before promotion:

```bash
pnpm --filter @apps/prime test -- functions/__tests__/staff-auth-session.test.ts functions/__tests__/staff-auth-token-gate.test.ts functions/__tests__/arrival-signals.test.ts --maxWorkers=2
pnpm --filter @apps/prime test -- src/contexts/messaging/__tests__/PinAuthProvider.replacement.test.tsx --maxWorkers=2
```

Expected contract outcomes:

- Valid PIN returns a custom token payload that bootstraps to staff role claims.
- Invalid PIN returns deterministic lockout counters (no silent failure path).
- `/api/check-in-lookup` returns `401/403` when staff bearer token is missing/invalid.

## Firebase Cost-Safety

Prime has strict Firebase query budget limits enforced by tests. See Phase 0A tasks in the plan (`docs/plans/prime-guest-portal-gap-plan.md`) for details.
