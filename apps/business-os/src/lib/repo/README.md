---
Type: Documentation
Domain: Business OS
Status: Active
Created: 2026-01-28
---

# Business OS Repository Operations

This document describes the git integration and write operations for Business OS.

## Architecture

### Dedicated Worktree

Phase 0 uses a **dedicated git worktree** for write operations:

```
/Users/pete/base-shop/               (main dev checkout)
/Users/pete/base-shop-business-os-store/  (dedicated worktree)
```

**Why a separate worktree?**
- Prevents pollution of the dev checkout
- Allows dev work to continue while writes happen
- Clean separation between UI dev and data writes

### Work Branch

All writes commit to: `work/business-os-store`

Phase 0: Single branch (single writer - Pete)
Phase 1+: Per-user branches (`work/business-os/<user>`)

## Setup

### Initialize Worktree

```bash
# From apps/business-os/
./scripts/setup-worktree.sh
```

This creates the worktree and checks out the work branch.

### Verify Setup

```bash
cd ../base-shop-business-os-store
git status
# Should show: On branch work/business-os-store
# Should show: nothing to commit, working tree clean
```

## Write Operations

### Save (Local Commit)

1. Write file to worktree
2. `git add <file>`
3. `git commit -m "message"`
4. **No push** - stays local

**Use case:** Make multiple related changes, then sync once.

### Sync (Push to Remote)

1. `git fetch origin`
2. `git merge origin/work/business-os-store` (if exists)
3. `git merge origin/main`
4. `git push origin work/business-os-store`

**Result:** Auto-PR workflow creates PR → CI runs → auto-merge

### Conflict Handling

If conflicts occur during Sync:
- Worktree enters conflict state
- Further writes are **blocked**
- User must resolve manually:
  ```bash
  cd ../base-shop-business-os-store
  # Fix conflicts in files
  git add <resolved-files>
  git commit
  # Or abort:
  git merge --abort
  ```

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

Sync local commits to remote (Sync operation).

**Request:** (no body)

**Response:**
```json
{
  "success": true,
  "pushed": true,
  "commitCount": 3,
  "compareUrl": "https://github.com/PeterCowling/base-shop/compare/main...work/business-os-store",
  "findPrUrl": "https://github.com/PeterCowling/base-shop/pulls?q=is%3Apr+head%3Awork%2Fbusiness-os-store",
  "message": "Changes pushed. Check PR links to verify auto-merge status."
}
```

## Error Handling

### Worktree Not Initialized

**Error:**
```json
{
  "error": "Worktree not initialized",
  "hint": "Run: apps/business-os/scripts/setup-worktree.sh"
}
```

**Fix:** Run setup script.

### Worktree Has Uncommitted Changes

**Error:**
```json
{
  "error": "Worktree has uncommitted changes. Commit or discard them first."
}
```

**Fix:**
```bash
cd ../base-shop-business-os-store
git status
# Either commit or discard changes
```

### Merge Conflict

**Error:**
```json
{
  "error": "Merge conflict with main branch. Resolve conflicts manually.",
  "needsManualResolution": true
}
```

**Fix:**
```bash
cd ../base-shop-business-os-store
git status
# See conflicted files
# Edit files to resolve conflicts
git add <resolved-files>
git commit -m "Resolve merge conflict"
# Then retry Sync
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

## Debugging

### Check Worktree Status

```bash
cd ../base-shop-business-os-store
git status
git log --oneline -10
```

### View Uncommitted Changes

```bash
cd ../base-shop-business-os-store
git diff
git diff --staged
```

### Check Remote Status

```bash
cd ../base-shop-business-os-store
git fetch origin
git log origin/main..HEAD
```

### Reset Worktree (Caution)

```bash
cd ../base-shop-business-os-store
git reset --hard origin/main
git clean -fd
```

**Warning:** This discards all local changes!

## Phase 1+ Considerations

### Multi-User Branches

Phase 1+ will use per-user branches:
- `work/business-os/pete`
- `work/business-os/alice`
- etc.

### Concurrency

Phase 1+ needs:
- Optimistic locking
- Conflict detection before write
- User-scoped worktrees or lock mechanism

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
