# Git Hooks Scripts

This directory contains git hook scripts managed by [simple-git-hooks](https://github.com/toplenboren/simple-git-hooks).

## Scripts

### [pre-commit-check-env.sh](./pre-commit-check-env.sh)

Prevents accidental commits of environment files containing secrets.

### [pre-push-safety.sh](./pre-push-safety.sh)

Prevents dangerous push operations that could destroy work.

**Purpose:** Prevent force pushes to protected branches (main, master)

**Blocks:**
- Force pushes to `main` or `master` (non-fast-forward)

**Warns:**
- Direct pushes to `main` (recommends using PRs instead)

**Bypass (emergency only):**
```bash
SKIP_GIT_HOOKS=1 git push --force
```

**Reference:** This hook exists because of the Jan 14, 2026 incident. See `docs/RECOVERY-PLAN-2026-01-14.md`.

---

#### pre-commit-check-env.sh

Prevents accidental commits of environment files containing secrets.

**Purpose:** Security protection against credential exposure

**Blocks:**
- `*.env.local`
- `*.env.*.local`
- `*.env.production.local`
- `*.env.development.local`

**Allows:**
- `.env.example`
- `.env.production` (in specific locations with dummy values)
- `.env.template`
- `docs/.env.reference.md`
- `*.env.ts` (TypeScript env files)

**Exit codes:**
- `0` - Success, commit can proceed
- `1` - Failure, forbidden file detected

**Testing:**
```bash
# Test blocking behavior
echo "SECRET=test" > test.env.local
git add -f test.env.local
git commit -m "test"  # Should fail

# Cleanup
git reset HEAD test.env.local
rm test.env.local
```

## Adding New Hooks

1. Create a new script in this directory:
   ```bash
   touch scripts/git-hooks/pre-push-check.sh
   chmod +x scripts/git-hooks/pre-push-check.sh
   ```

2. Update [package.json](../../package.json) `simple-git-hooks` section:
   ```json
   "simple-git-hooks": {
     "pre-commit": "sh scripts/git-hooks/pre-commit-check-env.sh && ...",
     "pre-push": "sh scripts/git-hooks/pre-push-check.sh"
   }
   ```

3. Reinstall hooks:
   ```bash
   pnpm exec simple-git-hooks
   ```

## Modifying Existing Hooks

1. Edit the hook script
2. Test the changes locally
3. Reinstall hooks: `pnpm exec simple-git-hooks`
4. Commit the changes
5. Team members will get the updated hooks after `pnpm install`

## Debugging Hooks

### Check installed hooks:
```bash
cat .git/hooks/pre-commit
```

### Test hook directly:
```bash
# Stage some files first
git add <file>

# Run the hook script manually
sh scripts/git-hooks/pre-commit-check-env.sh
echo $?  # Should output 0 (success) or 1 (failure)
```

### Enable hook debugging:
```bash
# Add to top of hook script for debugging
set -x  # Print commands as they execute

# Or run with bash -x
bash -x scripts/git-hooks/pre-commit-check-env.sh
```

## Best Practices

### Script Guidelines

1. **Use POSIX sh syntax** - Don't rely on bash-specific features
2. **Exit with proper codes** - 0 for success, non-zero for failure
3. **Provide clear error messages** - Help users understand what went wrong
4. **Make scripts executable** - `chmod +x script.sh`
5. **Test thoroughly** - Test success and failure cases

### Security Guidelines

1. **Never log sensitive data** - Don't echo file contents
2. **Use strict patterns** - Prefer false positives over false negatives
3. **Document exceptions** - Explain why files are allowed
4. **Review regularly** - Audit patterns and exceptions quarterly

### Performance Guidelines

1. **Keep hooks fast** - Aim for < 1 second execution
2. **Only check staged files** - Use `git diff --cached`
3. **Parallelize when possible** - But remember hooks run serially
4. **Cache results** - If checking external services

## Troubleshooting

### "Permission denied" errors
```bash
chmod +x scripts/git-hooks/*.sh
pnpm exec simple-git-hooks
```

### "Command not found" errors
- Ensure paths are relative to repository root
- Use `sh` or `bash` to invoke scripts explicitly
- Check `$PATH` if calling external commands

### Hooks not running
```bash
# Check if hooks are installed
ls -la .git/hooks/

# Reinstall
pnpm exec simple-git-hooks

# Verify the prepare script runs
pnpm install
```

## Related Documentation

- [Main Git Hooks Documentation](../../docs/git-hooks.md)
- [Environment Variables](../../docs/.env.reference.md)
- [Contributing Guide](../../CONTRIBUTING.md) (if exists)

---

**Maintained by:** DevOps Team
**Last Updated:** 2026-01-12
