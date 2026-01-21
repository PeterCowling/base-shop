# Git State Recovery

## When to Use

Use this skill when git state is confusing, commits seem lost, or you need to recover from a problematic git situation.

## Trigger Patterns

You likely need this skill when:
- `git status` shows unexpected state
- Commits seem to have disappeared
- Merge conflicts are overwhelming
- Branch state doesn't match expectations
- You're unsure what happened to recent work

## First Response: STOP and Assess

**Do NOT run any git commands until you understand the current state.**

```bash
# Capture current state
git status
git log --oneline -10
git branch -vv
git stash list
```

Share this output with the user before proceeding.

## Recovery Scenarios

### Scenario 1: Lost Uncommitted Work

If work was lost due to `reset --hard` or similar:

1. **Check reflog** (saves commits for ~30 days):
   ```bash
   git reflog
   ```

2. **Find the lost commit**:
   ```bash
   git reflog | grep -i "commit message keyword"
   ```

3. **Recover by creating a branch**:
   ```bash
   git branch recovery-branch <commit-hash>
   ```

### Scenario 2: Detached HEAD

If `git status` shows "HEAD detached":

1. **Check what you have**:
   ```bash
   git log --oneline -5
   ```

2. **If you have uncommitted work, stash it**:
   ```bash
   git stash
   ```

3. **Return to your branch**:
   ```bash
   git checkout <your-branch>
   git stash pop  # if you stashed
   ```

### Scenario 3: Merge Conflict Overwhelm

If conflicts are too complex:

1. **Abort the merge** (safe, no data loss):
   ```bash
   git merge --abort
   ```

2. **Try rebasing instead** (often cleaner):
   ```bash
   git rebase <target-branch>
   # Resolve conflicts one commit at a time
   ```

3. **Or get help**:
   ```bash
   git status  # Share this with user
   ```

### Scenario 4: Wrong Commits on Branch

If commits ended up on wrong branch:

1. **Note the commit hashes**:
   ```bash
   git log --oneline -5
   ```

2. **Cherry-pick to correct branch**:
   ```bash
   git checkout correct-branch
   git cherry-pick <commit-hash>
   ```

3. **Remove from wrong branch** (soft reset keeps changes):
   ```bash
   git checkout wrong-branch
   git reset --soft HEAD~1  # Keeps changes staged
   ```

## Safe Commands (Always OK)

These commands never lose data:

| Command | Purpose |
|---------|---------|
| `git status` | See current state |
| `git log` | See commit history |
| `git reflog` | See all recent HEAD movements |
| `git stash` | Temporarily save uncommitted work |
| `git stash list` | See saved stashes |
| `git branch -a` | List all branches |
| `git diff` | See uncommitted changes |

## Dangerous Commands (STOP and Ask)

Never run these without explicit user approval:

| Command | Danger |
|---------|--------|
| `git reset --hard` | Loses uncommitted work |
| `git clean -fd` | Deletes untracked files |
| `git push --force` | Overwrites remote history |
| `git rebase -i` on shared branches | Rewrites shared history |

## Common Pitfalls

❌ **Don't** panic and run commands without understanding state
❌ **Don't** use `reset --hard` to "fix" things
❌ **Don't** force push to fix local issues

✅ **Do** run `git status` and share output first
✅ **Do** use `git stash` to protect uncommitted work
✅ **Do** check `git reflog` for recovery options

## Quality Checks

- [ ] Current state is understood (status, log captured)
- [ ] No uncommitted work was lost
- [ ] Recovery approach explained to user before executing
- [ ] User approved any potentially destructive operations

## Related

- `.agents/safety/rationale.md` — Why these rules exist
- `docs/git-safety.md` — Full git safety guide
- `AGENTS.md` § "Git Rules" — Quick reference
