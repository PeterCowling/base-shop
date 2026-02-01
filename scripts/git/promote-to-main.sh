#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/git/promote-to-main.sh

Promotes staging -> main via PR + auto-merge:
- Ensures local branch 'staging' is up to date with origin
- Ensures an open PR staging -> main exists
- Enables auto-merge (MERGE) on that PR

Requirements:
- You must hold the writer lock (use scripts/agents/with-writer-lock.sh).
- GitHub CLI must be installed and authenticated (`gh auth status`).
EOF
}

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$repo_root" ]]; then
  echo "ERROR: not inside a git repository" >&2
  exit 1
fi
cd "$repo_root"

scripts/git-hooks/require-writer-lock.sh

branch="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$branch" != "staging" ]]; then
  echo "ERROR: promote-to-main must be run from branch 'staging' (current: ${branch})" >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "ERROR: working tree is not clean. Commit first, then promote." >&2
  git status --porcelain >&2 || true
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "ERROR: GitHub CLI (gh) is required to promote automatically." >&2
  echo "Install: https://cli.github.com/" >&2
  exit 1
fi

gh auth status -h github.com >/dev/null 2>&1 || {
  echo "ERROR: gh is not authenticated. Run: gh auth login" >&2
  exit 1
}

echo "Fetching origin..."
git fetch origin --prune >/dev/null 2>&1 || true

if git show-ref --verify --quiet "refs/remotes/origin/staging"; then
  echo "Fast-forwarding local staging -> origin/staging..."
  git merge --ff-only origin/staging >/dev/null 2>&1 || {
    echo "ERROR: unable to fast-forward staging to origin/staging." >&2
    echo "Resolve manually (no history rewrites) then retry." >&2
    exit 1
  }
else
  echo "ERROR: origin/staging does not exist. Create the staging branch first." >&2
  exit 1
fi

existing_pr_number="$(gh pr list --state open --head staging --base main --json number --jq '.[0].number' || true)"

if [[ -z "$existing_pr_number" ]]; then
  echo "Creating PR: staging -> main..."
  pr_url="$(gh pr create --head staging --base main --title \"staging → main\" --body \"Promote staging to production.\" )"
else
  pr_url="$(gh pr view \"$existing_pr_number\" --json url --jq .url)"
fi

echo "Enabling auto-merge (MERGE) for: ${pr_url}"
gh pr merge "$pr_url" --auto --merge

echo ""
echo "Promotion queued. Production updates when CI passes and the PR auto-merges."
echo "PR: ${pr_url}"
