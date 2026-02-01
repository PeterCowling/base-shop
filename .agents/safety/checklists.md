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

## Before Destructive / History-Rewriting Command

**STOP. Agents must not run these commands in Base-Shop.** If one seems necessary, capture diagnostics and ask for human guidance.

| Command | Agent Action |
|---------|--------------|
| `git reset --hard` | STOP. Do not run. Ask for help. |
| `git clean -fd` | STOP. Do not run. Ask for help. |
| `git push --force` / `-f` / `--force-with-lease` | STOP. Do not run. Ask for help. |
| `git checkout -- .` / `git restore .` | STOP. Do not run. Ask for help. |
| `git stash drop` / `git stash clear` | STOP. Do not run. Ask for help. |
| `git rebase` (incl. `-i`) / `git commit --amend` | STOP. Do not run. Ask for help. |
| `rm -rf <dir>` | STOP. Do not run. Ask for help. |

### Hand-off Script
```markdown
The command you’re asking for (`[command]`) is destructive or rewrites history.
That’s a common cause of accidental rollbacks / lost work, so I won’t run it as an agent.

Here are safer alternatives:
- [safe alternative 1]
- [safe alternative 2]

If you still want to proceed, please follow `docs/git-safety.md` and run it yourself.
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
- [ ] **Branch synced (optional)**: `git fetch origin --prune` (avoid rebases; merge `origin/main` only if needed)
- [ ] **PR title clear**: Summarizes the change
- [ ] **Description complete**: Explains what and why
- [ ] **Tests added**: New functionality has test coverage
- [ ] **No history rewrites**: Don’t `rebase`/`--amend`/force-push; PR squash-merge keeps history tidy

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
