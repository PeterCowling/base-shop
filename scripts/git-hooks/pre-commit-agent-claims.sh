#!/usr/bin/env bash
set -euo pipefail

# Optional: set SKIP_AGENT_CLAIMS=1 to bypass this check.
if [[ "${SKIP_AGENT_CLAIMS:-}" == "1" ]]; then
  exit 0
fi

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$repo_root" ]]; then
  exit 0
fi

cd "$repo_root"

branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
if [[ -z "$branch" ]]; then
  exit 0
fi

# Never allow commits directly to protected branches.
if [[ "$branch" == "main" || "$branch" == "master" ]]; then
  echo "------------------------------------------------------------------" >&2
  echo "COMMIT BLOCKED: protected branch" >&2
  echo "------------------------------------------------------------------" >&2
  echo "" >&2
  echo "You are on '${branch}'. Create a work branch instead." >&2
  echo "" >&2
  exit 1
fi

requires_claim_for_file() {
  local file="$1"
  case "$file" in
    apps/*|packages/*|src/*|docs/*|scripts/*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

matches_claim() {
  local file="$1"
  local claim_path="$2"

  if [[ "$claim_path" == "." ]]; then
    return 0
  fi

  if [[ "$file" == "$claim_path" ]]; then
    return 0
  fi

  if [[ "$file" == "$claim_path/"* ]]; then
    return 0
  fi

  return 1
}

enforce="0"
if [[ "${AGENT_CLAIMS_REQUIRED:-}" == "1" ]]; then
  enforce="1"
fi

# Default enforcement for agent-named branches (created via scripts/git/new-worktree.sh codex-* / claude-*).
if [[ "$branch" == work/* ]]; then
  if [[ "$branch" == *codex* || "$branch" == *claude* || "$branch" == *agent* ]]; then
    enforce="1"
  fi
fi

common_dir="$(git rev-parse --git-common-dir 2>/dev/null || true)"
claims_dir="${common_dir}/agent-claims"

declare -a claim_paths=()
declare -a claim_branches=()
declare -a claim_files=()

if [[ -d "$claims_dir" ]]; then
  shopt -s nullglob
  for claim_file in "$claims_dir"/*.claim; do
    claim_path="$(grep -E '^path=' "$claim_file" | sed 's/^path=//')"
    claim_branch="$(grep -E '^branch=' "$claim_file" | sed 's/^branch=//')"
    claim_paths+=("$claim_path")
    claim_branches+=("$claim_branch")
    claim_files+=("$claim_file")
  done
  shopt -u nullglob
fi

declare -a staged_files=()
while IFS= read -r -d '' file; do
  staged_files+=("$file")
done < <(git diff --cached --name-only -z --diff-filter=ACMR)

if [[ ${#staged_files[@]} -eq 0 ]]; then
  exit 0
fi

declare -a conflict_entries=()
declare -a missing_claim_files=()

for file in "${staged_files[@]}"; do
  if ! requires_claim_for_file "$file"; then
    continue
  fi

matched_owned="0"
matched_other="0"

for i in "${!claim_paths[@]}"; do
    claim_path="${claim_paths[$i]}"
    claim_branch="${claim_branches[$i]}"
    claim_file="${claim_files[$i]}"

    if ! matches_claim "$file" "$claim_path"; then
      continue
    fi

    if [[ "$claim_branch" == "$branch" ]]; then
      matched_owned="1"
      continue
    fi

    matched_other="1"
    owner_user="$(grep -E '^user=' "$claim_file" | sed 's/^user=//')"
    owner_host="$(grep -E '^host=' "$claim_file" | sed 's/^host=//')"
    created_at="$(grep -E '^created_at=' "$claim_file" | sed 's/^created_at=//')"
    conflict_entries+=("file=${file} claim=${claim_path} owner_branch=${claim_branch} owner=${owner_user}@${owner_host} created_at=${created_at}")
  done

  if [[ "$enforce" == "1" && "$matched_owned" != "1" ]]; then
    missing_claim_files+=("$file")
  fi
done

if [[ ${#conflict_entries[@]} -gt 0 ]]; then
  echo "------------------------------------------------------------------" >&2
  echo "COMMIT BLOCKED: files claimed by another branch" >&2
  echo "------------------------------------------------------------------" >&2
  echo "" >&2
  echo "Current branch: ${branch}" >&2
  echo "" >&2
  echo "Conflicts:" >&2
  for entry in "${conflict_entries[@]}"; do
    echo "  - ${entry}" >&2
  done
  echo "" >&2
  echo "Resolve by coordinating ownership (or waiting), then claim the area:" >&2
  echo "  scripts/git/claims.sh" >&2
  echo "  scripts/git/claim.sh <path>" >&2
  echo "" >&2
  exit 1
fi

if [[ "$enforce" == "1" && ${#missing_claim_files[@]} -gt 0 ]]; then
  echo "------------------------------------------------------------------" >&2
  echo "COMMIT BLOCKED: missing required claim (agent branch)" >&2
  echo "------------------------------------------------------------------" >&2
  echo "" >&2
  echo "Branch '${branch}' requires claims before committing changes in apps/packages/src/docs/scripts." >&2
  echo "" >&2
  echo "Files missing a claim:" >&2
  for file in "${missing_claim_files[@]}"; do
    echo "  - ${file}" >&2
  done
  echo "" >&2
  echo "Create a claim, then retry the commit:" >&2
  echo "  scripts/git/claim.sh <path>" >&2
  echo "" >&2
  echo "List active claims:" >&2
  echo "  scripts/git/claims.sh" >&2
  echo "" >&2
  echo "Bypass (not recommended): SKIP_AGENT_CLAIMS=1 git commit ..." >&2
  echo "" >&2
  exit 1
fi

exit 0
