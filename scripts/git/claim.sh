#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: scripts/git/claim.sh [--force] [--note <text>] <path> [<path> ...]"
  echo ""
  echo "Creates a shared 'claim' on one or more repo paths to prevent parallel agents"
  echo "from editing/committing the same area at the same time."
  echo ""
  echo "Examples:"
  echo "  scripts/git/claim.sh apps/business-os"
  echo "  scripts/git/claim.sh --note \"working on auth\" apps/business-os src"
  echo ""
  echo "List claims:"
  echo "  scripts/git/claims.sh"
}

force="0"
note=""
paths=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --force)
      force="1"
      shift
      ;;
    --note)
      note="${2:-}"
      shift 2
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
mkdir -p "$claims_dir"

who="$(id -un 2>/dev/null || whoami)"
host="$(hostname -s 2>/dev/null || hostname)"
pid="$$"
now="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

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

for raw_path in "${paths[@]}"; do
  path="$(normalize_path "$raw_path")"

  if [[ "$path" != "." && ! -e "${repo_root}/${path}" ]]; then
    echo "ERROR: path does not exist: ${path}" >&2
    echo "Tip: claim the nearest existing parent directory to avoid typos." >&2
    exit 1
  fi

  slug="$(slug_for_path "$path")"
  if [[ -z "$slug" ]]; then
    echo "ERROR: path produced an empty slug: ${path}" >&2
    exit 1
  fi

  claim_file="${claims_dir}/${slug}.claim"

  if [[ -e "$claim_file" && "$force" != "1" ]]; then
    echo "ERROR: path already claimed: ${path}" >&2
    echo "" >&2
    echo "Existing claim:" >&2
    sed 's/^/  /' "$claim_file" >&2
    echo "" >&2
    echo "To take over intentionally: scripts/git/claim.sh --force \"${path}\"" >&2
    exit 1
  fi

  tmp="${claim_file}.tmp.${pid}"
  {
    echo "version=1"
    echo "path=${path}"
    echo "branch=${branch}"
    echo "worktree=${repo_root}"
    echo "user=${who}"
    echo "host=${host}"
    echo "pid=${pid}"
    echo "created_at=${now}"
    if [[ -n "$note" ]]; then
      echo "note=${note}"
    fi
  } > "$tmp"

  mv "$tmp" "$claim_file"
  echo "Claimed: ${path} (branch: ${branch})"
done

echo ""
scripts/git/claims.sh
