#!/usr/bin/env bash
set -euo pipefail

# Enforce "single writer" commits/pushes in a shared checkout.
#
# Bypass (human only, emergency): SKIP_WRITER_LOCK=1 <git command>

if [[ "${SKIP_WRITER_LOCK:-}" == "1" ]]; then
  exit 0
fi

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$repo_root" ]]; then
  exit 0
fi

cd "$repo_root"

common_dir="$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null || true)"
if [[ -z "$common_dir" ]]; then
  exit 0
fi

lock_dir="${common_dir}/base-shop-writer-lock"
lock_meta="${lock_dir}/meta"

if [[ ! -d "$lock_dir" || ! -f "$lock_meta" ]]; then
  echo "------------------------------------------------------------------" >&2
  echo "BLOCKED: single-writer lock is not held" >&2
  echo "------------------------------------------------------------------" >&2
  echo "" >&2
  echo "This repo runs many agents against ONE checkout. To prevent lost work," >&2
  echo "git write operations require holding the writer lock." >&2
  echo "" >&2
  echo "Acquire a writer-locked shell, then retry:" >&2
  echo "  scripts/agents/with-writer-lock.sh" >&2
  echo "" >&2
  echo "Status:" >&2
  echo "  scripts/git/writer-lock.sh status" >&2
  echo "" >&2
  exit 1
fi

token_expected="$(grep -E '^token=' "$lock_meta" | sed 's/^token=//' | head -n 1)"
token_actual="${BASESHOP_WRITER_LOCK_TOKEN:-}"

if [[ -z "$token_actual" || "$token_actual" != "$token_expected" ]]; then
  echo "------------------------------------------------------------------" >&2
  echo "BLOCKED: writer lock token missing or mismatched" >&2
  echo "------------------------------------------------------------------" >&2
  echo "" >&2
  echo "A writer lock exists, but your current shell does not own it." >&2
  echo "" >&2
  echo "Current lock:" >&2
  sed 's/^/  /' "$lock_meta" >&2 || true
  echo "" >&2
  echo "Resolve by waiting for the lock holder to finish, then acquire it:" >&2
  echo "  scripts/git/writer-lock.sh acquire --wait" >&2
  echo "  scripts/agents/with-writer-lock.sh" >&2
  echo "" >&2
  echo "Bypass (human only, emergency): SKIP_WRITER_LOCK=1 <git command>" >&2
  echo "" >&2
  exit 1
fi

exit 0

