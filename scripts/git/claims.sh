#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$repo_root" ]]; then
  echo "ERROR: not inside a git repository" >&2
  exit 1
fi

cd "$repo_root"

common_dir="$(git rev-parse --git-common-dir 2>/dev/null || true)"
claims_dir="${common_dir}/agent-claims"

if [[ ! -d "$claims_dir" ]]; then
  echo "(no claims)"
  exit 0
fi

shopt -s nullglob
claims=("$claims_dir"/*.claim)
shopt -u nullglob

if [[ ${#claims[@]} -eq 0 ]]; then
  echo "(no claims)"
  exit 0
fi

printf "%-28s  %-40s  %-20s  %-16s  %s\n" "PATH" "BRANCH" "CREATED" "OWNER" "WORKTREE"
for file in "${claims[@]}"; do
  path="$(grep -E '^path=' "$file" | sed 's/^path=//')"
  branch="$(grep -E '^branch=' "$file" | sed 's/^branch=//')"
  created_at="$(grep -E '^created_at=' "$file" | sed 's/^created_at=//')"
  user="$(grep -E '^user=' "$file" | sed 's/^user=//')"
  host="$(grep -E '^host=' "$file" | sed 's/^host=//')"
  worktree="$(grep -E '^worktree=' "$file" | sed 's/^worktree=//')"
  owner="${user}@${host}"
  printf "%-28s  %-40s  %-20s  %-16s  %s\n" "$path" "$branch" "$created_at" "$owner" "$worktree"
done
