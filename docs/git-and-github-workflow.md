Type: Guide
Status: Active
Domain: Repo
Last-reviewed: 2026-02-01

# Git & GitHub Workflow (Human UX)

This repo is designed so that shipping a change feels like:

1. Make a change on a `work/**` branch.
2. Commit early and often.
3. Push.
4. A PR appears automatically, runs the right checks, and **auto‑merges on green**.

If something is red or idle for too long, the PR may auto-close (by design). You fix the issue, push again, and the system makes a new PR.

## The Happy Path (One Change)

### 1) Start a work branch

```bash
git fetch origin --prune
git switch -c work/$(date +%Y-%m-%d)-short-description origin/main
```

### 2) Make your change and commit it

```bash
git status
git add -A
git commit -m "feat: short description"
```

### 3) Push and let GitHub handle the PR

```bash
git push -u origin HEAD
```

What you should expect next:

- Within ~1 minute, GitHub creates a PR from your branch into `main`.
- The PR gets the `zero-touch` label and has auto‑merge enabled (squash).
- CI runs (and the **Merge Gate / Gate** check summarizes whether you’re “good to merge”).
- When required checks are green, the PR merges automatically.

## What GitHub Is Doing For You

### Auto PRs (only for `work/**` branches)

Pushing a `work/**` branch triggers an “Auto PR (Zero‑Touch)” workflow that:

- Creates a PR (if one doesn’t already exist)
- Adds the `zero-touch` label
- Enables auto‑merge (squash)

### Merge Gate (the one check to watch)

You’ll see many workflows on a PR. The user experience is: watch **Merge Gate / Gate**.

- Green Merge Gate means “all required workflows for this change set passed.”
- Red Merge Gate means “something required failed.”

## When Things Go Wrong (And What To Do)

### “I pushed, but no PR appeared”

1. Confirm your branch name starts with `work/` (not `feature/`, `fix/`, etc.).
2. Refresh GitHub → Pull requests (it can take ~1 minute).
3. If it still doesn’t exist, create one manually (GitHub UI is fine), then enable auto‑merge.

### “The PR auto-closed”

Two common reasons:

- **Failing required checks**: if **Merge Gate** fails, zero-touch PRs auto-close.
- **Stale PR**: after **5 days with no commits**, the PR is marked stale; after **2 more days**, it auto-closes.

To recover:

1. Keep working on the same branch.
2. Push a new commit.
3. The auto‑PR workflow will create a new PR for that branch.

If you want to intentionally keep a PR open while it’s red or idle, add the `keep-open` label.

### “Git won’t let me commit/push”

That’s usually a hook doing its job:

- If you’re blocked from committing/pushing, read the message and follow the suggested fix.
- If you’re in the **main checkout** and see a writer‑lock error, either:
  - Use a worktree (`scripts/git/new-worktree.sh <label>`), or
  - Run your git command via `scripts/agents/with-writer-lock.sh <cmd>` (single‑writer safety).

### “I accidentally started on `main`”

Do not try to “clean it up” with resets or rebases.

```bash
git switch -c work/$(date +%Y-%m-%d)-short-description
git push -u origin HEAD
```

## Parallel Work (Without Conflicts)

If you want two branches in flight at the same time (or you’re working alongside an agent), use worktrees.

```bash
scripts/git/new-worktree.sh my-task
```

User experience: you get a new folder for a new branch, so changes don’t collide.

## After It Merges (Cleanup)

GitHub will usually show a “Delete branch” button on the PR after merge. You can use that, or delete manually:

```bash
git branch -d work/<your-branch>
git push origin --delete work/<your-branch>
```

## FAQ

### “Can I keep a PR open for review?”

Yes. Add the `keep-open` label so the PR won’t be auto-closed for failures or staleness.

If you also want to prevent auto‑merge, disable auto‑merge in the GitHub UI (note: future pushes may re‑enable it because `work/**` branches are auto‑managed).

## Safety Rules (Non‑Negotiable)

- Never use destructive history‑rewriting commands in this repo (for example: `git reset --hard`, `git clean -fd`, `git push --force`, `git rebase`, `git commit --amend`).
- If you need to undo something, prefer `git revert` (it creates a new commit and keeps history intact).

See `docs/git-safety.md` for the full safety rules and rationale.
