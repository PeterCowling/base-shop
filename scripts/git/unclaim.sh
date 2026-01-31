#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: scripts/git/unclaim.sh [--force] <path> [<path> ...]"
  echo ""
  echo "Releases a shared claim created by scripts/git/claim.sh."
  echo ""
  echo "Examples:"
  echo "  scripts/git/unclaim.sh apps/business-os"
  echo "  scripts/git/unclaim.sh --force apps/business-os"
}

force="0"
paths=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --force)
      force="1"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    --)
      shift
      break
      ;;
    -*)
      echo "ERROR: unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
    *)
      paths+=("$1")
      shift
      ;;
  esac
done

if [[ ${#paths[@]} -eq 0 ]]; then
  usage >&2
  exit 2
fi

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$repo_root" ]]; then
  echo "ERROR: not inside a git repository" >&2
  exit 1
fi

cd "$repo_root"

branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
if [[ -z "$branch" ]]; then
  echo "ERROR: unable to determine current branch" >&2
  exit 1
fi

common_dir="$(git rev-parse --git-common-dir 2>/dev/null || true)"
if [[ -z "$common_dir" ]]; then
  echo "ERROR: unable to determine git common dir" >&2
  exit 1
fi

claims_dir="${common_dir}/agent-claims"

normalize_path() {
  local raw="$1"
  raw="${raw#./}"
  raw="${raw%/}"
  if [[ -z "$raw" ]]; then
    echo "."
    return 0
  fi
  echo "$raw"
}

slug_for_path() {
  local path="$1"
  printf "%s" "$path" | tr '/ ' '__' | tr -cd 'A-Za-z0-9._-'
}

missing=0

for raw_path in "${paths[@]}"; do
  path="$(normalize_path "$raw_path")"
  slug="$(slug_for_path "$path")"
  claim_file="${claims_dir}/${slug}.claim"

  if [[ ! -e "$claim_file" ]]; then
    echo "No claim found for: ${path}"
    missing=1
    continue
  fi

  owner_branch="$(grep -E '^branch=' "$claim_file" | sed 's/^branch=//')"
  if [[ "$force" != "1" && "$owner_branch" != "$branch" ]]; then
    echo "ERROR: claim for '${path}' is owned by '${owner_branch}', not '${branch}'." >&2
    echo "Use --force to release intentionally." >&2
    exit 1
  fi

  rm -f "$claim_file"
  echo "Released: ${path}"
done

echo ""
scripts/git/claims.sh || true

if [[ "$missing" -eq 1 ]]; then
  exit 1
fi
