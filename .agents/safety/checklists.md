# Pre-Action Checklists

Use these checklists before taking significant actions. They encode lessons from past incidents and help prevent common mistakes.

## Before Commit

Run through this checklist before every `git commit`:

- [ ] **Validation passes**: `pnpm typecheck && pnpm lint`
- [ ] **Tests pass**: Targeted tests for changed files
- [ ] **No secrets**: Check for accidentally staged `.env`, credentials, API keys
- [ ] **No debug code**: Remove `console.log`, `debugger`, commented-out code
- [ ] **Correct branch**: Verify you're on `work/*`, not `main`
- [ ] **Changes reviewed**: `git diff --staged` shows only intended changes
- [ ] **Commit message**: Follows conventional format, explains "why"

### Quick Command
```bash
# Pre-commit validation
pnpm typecheck && pnpm lint && git diff --staged
```

---

## Before Destructive Command

**STOP** if you're about to run any of these:

| Command | Required Steps |
|---------|----------------|
| `git reset --hard` | 1. Run `git stash` first 2. List what will be lost 3. Get explicit user approval |
| `git push --force` | 1. Use `--force-with-lease` instead 2. Confirm no one else pushed 3. Get explicit user approval |
| `git clean -fd` | 1. Run `git clean -n` first 2. Review files to be deleted 3. Get explicit user approval |
| `rm -rf <dir>` | 1. Verify exact path 2. List contents first 3. Get explicit user approval |

### Approval Script
```markdown
"This operation would run `[command]` which [danger].

Files/changes that will be affected:
[list them]

This is irreversible. Do you want to proceed? (yes/no)"
```

---

## Before Large Refactor

Before starting multi-file changes:

- [ ] **Plan exists**: Create plan in `docs/plans/` first
- [ ] **Worktree isolated**: `scripts/git/new-worktree.sh <label>` for parallel work
- [ ] **Baseline captured**: All tests pass before changes
- [ ] **Scope defined**: List of files to touch is explicit
- [ ] **Incremental approach**: Break into atomic commits
- [ ] **Rollback path**: Know how to revert if things go wrong

### Anti-Patterns to Avoid
- Making "just one more change" without committing
- Refactoring unrelated code while fixing a bug
- Skipping tests "because the change is small"
- Not pushing for hours (GitHub is your backup)

---

## Before PR Creation

- [ ] **All commits pushed**: `git push origin HEAD`
- [ ] **CI passes**: Check GitHub Actions status
- [ ] **Branch up to date**: `git pull --rebase origin main`
- [ ] **PR title clear**: Summarizes the change
- [ ] **Description complete**: Explains what and why
- [ ] **Tests added**: New functionality has test coverage
- [ ] **No WIP commits**: Squash or clean up history if needed

---

## Before Running Tests

- [ ] **Filtered scope**: Using `--filter <pkg>` not running all
- [ ] **Specific path**: `-- path/to/file.test.ts` when possible
- [ ] **Worker limit**: `--maxWorkers=2` for broader runs
- [ ] **No orphans**: `ps aux | grep jest | grep -v grep`

### If ESM Errors Appear
```bash
# Retry with CJS forced
JEST_FORCE_CJS=1 pnpm --filter <pkg> test -- path/to/file.test.ts
```

---

## Before Modifying Package Exports

When changing a package's public API:

- [ ] **Check consumers**: Who imports this?
  ```bash
  grep -r "from '@acme/<package>" apps/ packages/
  ```
- [ ] **Deprecation path**: If removing, add deprecation warning first
- [ ] **Update docs**: `exports` map in `package.json` reflects reality
- [ ] **Test imports**: Verify consumers still work

---

## Before Adding Dependencies

- [ ] **Check existing**: Is this already in the monorepo?
  ```bash
  pnpm why <package-name>
  ```
- [ ] **Scope correctly**: Root (`-w`) vs package-specific (`--filter`)
- [ ] **Version pinned**: Use specific version, not `*` or `latest`
- [ ] **License check**: Compatible with project license
- [ ] **Bundle size**: Consider impact on client bundles

### Commands
```bash
# Add to root (shared)
pnpm add -D <package> -w

# Add to specific package
pnpm --filter @acme/<package> add <dependency>
```

---

## Emergency Recovery

If something went wrong:

1. **Don't panic** — Most things are recoverable
2. **Stop making changes** — Avoid compounding the problem
3. **Check reflog**: `git reflog` shows recent HEAD movements
4. **Read the skill**: `.claude/skills/git-recovery/SKILL.md`
5. **Ask for help**: Share `git status` and `git log` output

### Never Do
- Run more destructive commands to "fix" things
- Force push to recover local state
- Delete and re-clone as first resort
