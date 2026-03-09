#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/git/ship-to-staging.sh

Ships the current branch state to staging via PR + auto-merge for user testing:
- Pushes the current branch to origin
- Ensures an open PR <current-branch> -> staging exists
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
if [[ "$branch" == "main" || "$branch" == "master" || "$branch" == "staging" ]]; then
  echo "ERROR: ship-to-staging must be run from a non-protected branch (current: ${branch})" >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "ERROR: working tree is not clean. Commit first, then ship." >&2
  git status --porcelain >&2 || true
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "ERROR: GitHub CLI (gh) is required to ship automatically." >&2
  echo "Install: https://cli.github.com/" >&2
  exit 1
fi

gh auth status -h github.com >/dev/null 2>&1 || {
  echo "ERROR: gh is not authenticated. Run: gh auth login" >&2
  exit 1
}

echo "Pushing ${branch} -> origin/${branch}..."
git push -u origin "$branch"

existing_pr_number="$(gh pr list --state open --head "$branch" --base staging --json number --jq '.[0].number' || true)"

if [[ -z "$existing_pr_number" ]]; then
  echo "Creating PR: ${branch} -> staging..."
  pr_url="$(gh pr create --head "$branch" --base staging --title "${branch} → staging" --body "Ship ${branch} to staging for user testing.")"
else
  pr_url="$(gh pr view "$existing_pr_number" --json url --jq .url)"
fi

echo "Enabling auto-merge (MERGE) for: ${pr_url}"
gh pr merge "$pr_url" --auto --merge

echo ""
echo "Shipped. Staging will update when CI passes and the PR auto-merges."
echo "PR: ${pr_url}"
