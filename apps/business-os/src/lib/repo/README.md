---
Type: Documentation
Domain: Business OS
Status: Active
Created: 2026-01-28
---

# Business OS Repository Operations

This document describes the git integration and write operations for Business OS.

## Architecture

### Single Checkout + Writer Lock

Phase 0 uses the Base-Shop repo checkout directly (no git worktrees). Writes are serialized by:

- The repo-level writer lock: `scripts/git/writer-lock.sh`
- The Business OS repo lock directory: `docs/business-os/.locks` (guards Business OS operations)

### Branch Model

All Business OS writes commit to `dev`. A separate pipeline PR ships `dev` → `staging` and auto-merges on green.
Promotion `staging` → `main` is explicit via `scripts/git/promote-to-main.sh`.

## Setup

### Initialize Repo (No Worktrees)

```bash
# From repo root
apps/business-os/scripts/setup-repo.sh
```

This ensures you’re on `dev` and that the repo is ready for Business OS write operations.

## Write Operations

### Save (Local Commit)

1. Write file to repo checkout
2. `git add <file>`
3. `git commit -m "message"`
4. **No push** - stays local

**Use case:** Make multiple related changes, then sync once.

### Sync (Push `dev` to Remote)

`POST /api/sync` pushes the `dev` branch to GitHub.

**Result:** CI auto-creates/updates PR `dev` → `staging` and auto-merges when checks pass.

## API Routes

### POST /api/ideas

Create a new idea (Save operation).

**Request:**
```json
{
  "business": "BRIK",
  "content": "# Idea Title\n\nIdea description...",
  "tags": ["tag1", "tag2"]
}
```

**Response:**
```json
{
  "success": true,
  "ideaId": "BRIK-OPP-0003",
  "filePath": "docs/business-os/ideas/inbox/BRIK-OPP-0003.user.md",
  "commitHash": "abc123",
  "message": "Idea created locally. Run Sync to push."
}
```

### POST /api/sync

Push local commits to GitHub (Sync operation).

**Request:** (no body)

**Response:**
```json
{
  "success": true,
  "pushed": true,
  "commitCount": 3,
  "compareUrl": "https://github.com/PeterCowling/base-shop/compare/staging...dev",
  "findPrUrl": "https://github.com/PeterCowling/base-shop/pulls?q=is%3Apr+head%3Adev+base%3Astaging",
  "message": "Changes pushed. Check PR links to verify auto-merge status."
}
```

## Error Handling

### Repo Not Ready

**Error:**
```json
{
  "error": "Repository not ready",
  "hint": "Run: apps/business-os/scripts/setup-repo.sh"
}
```

**Fix:** Run setup script.

### Repo Has Uncommitted Changes

**Error:**
```json
{
  "error": "Repo has uncommitted changes. Commit or discard them first."
}
```

**Fix:**
```bash
git status
# Commit the work on dev, or revert changes safely.
```

### Conflicts / Non-Fast-Forward Push

If push fails due to remote changes:
- Fetch, inspect, and resolve via safe merges (no rebases/force pushes).
- Prefer using the `dev` → `staging` PR pipeline rather than manual merges.

See: `docs/git-safety.md`

## Debugging

### Check Repo Status

```bash
git status
git log --oneline -10
scripts/git/writer-lock.sh status
```

### View Changes

```bash
git status
git diff
git diff --staged
```

### Authentication Failed

**Error:**
```json
{
  "error": "Push failed: authentication required"
}
```

**Fix:**
```bash
# Ensure git credentials are configured
gh auth login
# Or configure HTTPS credentials
git config --global credential.helper osxkeychain
```

## Security

### Authorization

All writes are checked against the path allowlist:
- **Allowed:** `docs/business-os/**`
- **Denied:** All other paths

See: `apps/business-os/src/lib/auth/authorize.ts`

### Git Credentials

Phase 0: Uses existing git credential helper (e.g., `osxkeychain`)
- No credentials stored in app
- No environment variables needed
- Uses system git configuration

### Commit Authorship

Commits include co-authorship:
```
Add idea: BRIK-OPP-0003

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### Git Safety

Business OS follows the same git safety rules as the rest of the repo: never use destructive commands like
`git reset --hard` or `git clean -fd`. See: `docs/git-safety.md`

## Phase 1+ Considerations

### Multi-User Branches

Phase 1+ likely needs a database-backed store instead of git-based writes.

### Concurrency

Phase 1+ needs:
- Optimistic locking
- Conflict detection before write
- Clear single-writer behavior (or DB transactions)

### Hosted Deployment

BOS-00-A blocker: Hosted deployment needs proven writable checkout mechanism.
Options:
- Self-hosted VM with git checkout
- GitHub API commits (no local repo)
- Serverless function + worker with checkout

## References

- Plan: `docs/plans/business-os-kanban-plan.md` (BOS-10)
- Authorization: `apps/business-os/src/lib/auth/authorize.ts`
- Writer: `apps/business-os/src/lib/repo-writer.ts`
- Security: `docs/business-os/security.md`
