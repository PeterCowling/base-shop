Type: Guide
Status: Active
Domain: Repo
Last-reviewed: 2026-01-16

# Git Hooks (Agent Runbook)

> **Related:** See [Git Safety Guide](./git-safety.md) for comprehensive git safety documentation.

This project uses [simple-git-hooks](https://github.com/toplenboren/simple-git-hooks) to enforce code quality and security policies before commits and pushes.

## Overview

Git hooks are automatically installed when `pnpm install` runs (via the `prepare` script in [package.json](../package.json:25)).

## Active Hooks

| Hook | Script | Purpose |
|------|--------|---------|
| `pre-commit` | `pre-commit-check-env.sh` + `no-partially-staged.js` + `lint-staged --no-stash` | Block secrets, block partial staging, run linting without backup stashes |
| `pre-push` | `pre-push-safety.sh` + `pnpm typecheck` | Block force pushes; run typecheck before pushing |

---

## Pre-commit Hook

The pre-commit hook runs checks before allowing a commit:

1. **Environment File Check** - Prevents accidental commits of sensitive credential files
2. **Partial staging guard** - Blocks partially staged files to prevent unstaged hunks being staged under `lint-staged --no-stash` behavior
3. **Lint-staged** - Runs ESLint on staged TypeScript/JavaScript files (check-only; no `--fix`)

#### Environment File Protection

**Script:** [scripts/git-hooks/pre-commit-check-env.sh](../scripts/git-hooks/pre-commit-check-env.sh)

This hook prevents commits of local environment files that may contain secrets:

**Blocked patterns:**
- `*.env.local`
- `*.env.*.local` (e.g., `.env.production.local`)
- `*.env.development.local`

**Allowed exceptions:**
- `.env.example` files
- `.env.production` (dummy values only - see [apps/cms/.env.production](../apps/cms/.env.production))
- `.env.template` (root template)
- `docs/.env.reference.md` (documentation)
- `*.env.ts` and `*.env.test.ts` (TypeScript test files)

**Example blocked commit:**
```bash
$ git commit -m "Add config"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ COMMIT BLOCKED: Environment files detected
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The following files should NOT be committed:
  - apps/cms/.env.local

These files likely contain sensitive credentials or secrets.

To fix this issue:
  1. Unstage the files:  git reset HEAD <file>
  2. Verify .gitignore includes these patterns
  3. Check if secrets need rotation (if previously committed)
```

---

## Pre-push Hook

**Script:** [scripts/git-hooks/pre-push-safety.sh](../scripts/git-hooks/pre-push-safety.sh)

The pre-push hook prevents dangerous push operations that could destroy work or overwrite remote history.

### What It Blocks

| Operation | Result |
|-----------|--------|
| Force push to `main` | ❌ **BLOCKED** - Prevents overwriting remote history |
| Force push to `master` | ❌ **BLOCKED** - Same protection |
| Non-fast-forward push to protected branches | ❌ **BLOCKED** |

### What It Warns About

| Operation | Result |
|-----------|--------|
| Direct push to `main` | ⚠️ **WARNING** - Recommends using PR instead |
| Direct push to `master` | ⚠️ **WARNING** - Recommends using PR instead |

### Example Blocked Push

```bash
$ git push --force origin main
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ PUSH BLOCKED: Force push to protected branch
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are attempting to force push to 'main'

This operation would:
  - Overwrite remote history
  - Potentially lose commits from other contributors
  - Break other developers' local branches

Reference: docs/RECOVERY-PLAN-2026-01-14.md

If this must be done (emergency only):
  1. Create a backup: git branch backup-$(date +%Y%m%d-%H%M%S)
  2. Coordinate with all team members
  3. Use: SKIP_GIT_HOOKS=1 git push --force
```

### Why This Exists

On January 14, 2026, destructive git commands caused significant data loss. This hook is one of several protection layers to prevent similar incidents. See [RECOVERY-PLAN-2026-01-14.md](./RECOVERY-PLAN-2026-01-14.md) for details.

### Emergency Bypass

**⚠️ Only use in genuine emergencies after coordinating with the team:**

```bash
SKIP_GIT_HOOKS=1 git push --force origin main
```

---

## Configuration

### Modifying Hooks

Edit the `simple-git-hooks` section in [package.json](../package.json):

```json
"simple-git-hooks": {
  "pre-commit": "scripts/git-hooks/pre-commit-check-env.sh && node scripts/git-hooks/no-partially-staged.js && pnpm exec cross-env NODE_OPTIONS=--max-old-space-size=6144 pnpm exec lint-staged --no-stash",
  "pre-push": "scripts/git-hooks/pre-push-safety.sh && pnpm typecheck"
}
```

After making changes, reinstall the hooks:

```bash
pnpm exec simple-git-hooks
```

### Adding New Forbidden Patterns

Edit [scripts/git-hooks/pre-commit-check-env.sh](../scripts/git-hooks/pre-commit-check-env.sh) and add to the `FORBIDDEN_PATTERNS` array:

```bash
FORBIDDEN_PATTERNS=(
  "\.env\.local$"
  "\.env\..*\.local$"
  "\.env\.production\.local$"
  "\.env\.development\.local$"
  "example-pattern-here"  # Add a pattern
)
```

### Adding Allowed Exceptions

If a specific env file must be allowed (ensure it contains no secrets), add to `ALLOWED_EXCEPTIONS`:

```bash
ALLOWED_EXCEPTIONS=(
  "\.env\.example$"
  "\.env\.production$"
  "docs/\.env\.reference\.md$"
  "\.env\.template$"
  "example-safe-file-here"  # Add an exception
)
```

## Bypassing Hooks (Emergency Only)

⚠️ **Warning:** Only bypass hooks when it is certain this is safe.

### Skip all git hooks temporarily:
```bash
git commit --no-verify -m "Emergency fix"
```

### Skip simple-git-hooks specifically:
```bash
SKIP_SIMPLE_GIT_HOOKS=1 git commit -m "Emergency fix"
```

### Skip for single command:
```bash
git commit -n -m "Trusted change"  # -n is short for --no-verify
```

## Troubleshooting

### Hooks not running

**Problem:** Commits succeed without running hooks

**Solution:**
```bash
# Reinstall hooks
pnpm exec simple-git-hooks

# Verify hook is installed
cat .git/hooks/pre-commit

# Check hook is executable
ls -la .git/hooks/pre-commit
```

### Hook fails with "command not found"

**Problem:** `sh: scripts/git-hooks/pre-commit-check-env.sh: No such file or directory`

**Solution:**
```bash
# Ensure script exists
ls scripts/git-hooks/pre-commit-check-env.sh

# Ensure script is executable
chmod +x scripts/git-hooks/pre-commit-check-env.sh

# Reinstall hooks
pnpm exec simple-git-hooks
```

### False positive: Safe file blocked

**Problem:** The hook blocks a file that doesn't contain secrets

**Solution:**
1. Verify the file truly contains no secrets
2. Add it to `ALLOWED_EXCEPTIONS` in the hook script
3. Update `.gitignore` to explicitly allow it (if appropriate)
4. Reinstall hooks: `pnpm exec simple-git-hooks`

## Testing the Hooks

### Test environment file protection:

```bash
# Create test file (should be blocked)
echo "SECRET=test" > test.env.local
git add -f test.env.local
git commit -m "test"  # Should fail

# Cleanup
git reset HEAD test.env.local
rm test.env.local
```

### Test example files (should pass):

```bash
# Create example file (should be allowed)
echo "SECRET=placeholder" > test.env.example
git add test.env.example
git commit -m "Add example"  # Should succeed

# Cleanup
git reset HEAD test.env.example
rm test.env.example
```

## Related Documentation

- [Git Safety Guide](./git-safety.md) - Comprehensive git safety documentation
- [AGENTS.md](../AGENTS.md) - Git safety rules for AI agents
- [Environment Variables Reference](./.env.reference.md)
- [Recovery Plan](./RECOVERY-PLAN-2026-01-14.md) - Jan 14, 2026 incident details
- [.gitignore](../.gitignore)
- [simple-git-hooks GitHub](https://github.com/toplenboren/simple-git-hooks)
- [lint-staged GitHub](https://github.com/lint-staged/lint-staged)

## CI/CD Integration

Git hooks run locally only. For CI/CD environments:

- Hooks are automatically bypassed in CI (no `.git/hooks` directory)
- Use GitHub Actions or similar for server-side validation
- Consider tools like [pre-commit.ci](https://pre-commit.ci/) for centralized hook management

## Maintenance

### Regular Checks

Add to the maintenance checklist:

- [ ] Review forbidden patterns quarterly
- [ ] Audit exceptions list for unused entries
- [ ] Test hooks after major git or Node.js updates
- [ ] Update documentation when modifying hooks

### Version Upgrades

When upgrading `simple-git-hooks`:

```bash
pnpm update simple-git-hooks
pnpm exec simple-git-hooks  # Reinstall with new version
```

---

**Last Updated:** 2026-01-15

For questions or issues with git hooks, please:
1. Check this documentation and the [Git Safety Guide](./git-safety.md)
2. Review the hook scripts:
   - [pre-commit-check-env.sh](../scripts/git-hooks/pre-commit-check-env.sh)
   - [pre-push-safety.sh](../scripts/git-hooks/pre-push-safety.sh)
3. Open an issue on GitHub
