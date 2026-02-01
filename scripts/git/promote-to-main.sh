#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/git/promote-to-main.sh

DEPRECATED (2026-02-01):
This repo's canonical workflow is `work/*` branches with zero-touch PRs to `main`.
Production promotion is handled by GitHub Actions per-app (manual workflow inputs),
not by a `staging`→`main` git-branch promotion pipeline.

This script is kept only for historical reference. Do not use it unless you
explicitly decide to adopt a `staging`→`main` branch pipeline and update docs/CI.

Requirements:
- None (this script exits by default).
EOF
}

if [[ "${ALLOW_DEPRECATED_PIPELINE_SCRIPTS:-}" != "1" ]]; then
  usage >&2
  exit 1
fi

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

echo "Pushing staging -> origin/staging..."
git push -u origin staging

existing_pr_number="$(gh pr list --state open --head staging --base main --json number --jq '.[0].number' || true)"

if [[ -z "$existing_pr_number" ]]; then
  echo "Creating PR: staging -> main..."
  pr_url="$(gh pr create --head staging --base main --title \"staging → main\" --body \"Promote staging to production.\" )"
else
  pr_url="$(gh pr view "$existing_pr_number" --json url --jq .url)"
fi

echo "Enabling auto-merge (MERGE) for: ${pr_url}"
gh pr merge "$pr_url" --auto --merge

echo ""
echo "Promotion queued. Production updates when CI passes and the PR auto-merges."
echo "PR: ${pr_url}"
