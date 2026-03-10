#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$repo_root" ]]; then
  echo "ERROR: not inside a git repository" >&2
  exit 1
fi

cd "$repo_root"

lock_script="${repo_root}/scripts/git/writer-lock.sh"
if [[ ! -x "$lock_script" ]]; then
  echo "ERROR: missing ${lock_script}" >&2
  exit 1
fi

common_dir="$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null || true)"
if [[ -z "$common_dir" ]]; then
  echo "ERROR: unable to determine git common dir" >&2
  exit 1
fi

lock_meta="${common_dir}/base-shop-writer-lock/meta"

writer_lock_current_token() {
  if [[ -n "${BASESHOP_WRITER_LOCK_TOKEN_FILE:-}" && -f "${BASESHOP_WRITER_LOCK_TOKEN_FILE}" ]]; then
    cat "${BASESHOP_WRITER_LOCK_TOKEN_FILE}"
    return 0
  fi

  printf '%s\n' "${BASESHOP_WRITER_LOCK_TOKEN:-}"
}

writer_lock_store_token() {
  local token="$1"
  export BASESHOP_WRITER_LOCK_TOKEN="$token"
  if [[ -n "${BASESHOP_WRITER_LOCK_TOKEN_FILE:-}" ]]; then
    printf '%s\n' "$token" >"${BASESHOP_WRITER_LOCK_TOKEN_FILE}"
  fi
}

writer_lock_clear_token() {
  unset BASESHOP_WRITER_LOCK_TOKEN
  if [[ -n "${BASESHOP_WRITER_LOCK_TOKEN_FILE:-}" ]]; then
    : >"${BASESHOP_WRITER_LOCK_TOKEN_FILE}"
  fi
}

writer_lock_release_window() {
  local token
  token="$(writer_lock_current_token)"
  if [[ -z "$token" ]]; then
    echo "ERROR: BASESHOP_WRITER_LOCK_TOKEN is not available for release." >&2
    exit 1
  fi

  BASESHOP_WRITER_LOCK_TOKEN="$token" "$lock_script" release
  writer_lock_clear_token
}

writer_lock_acquire_window() {
  local timeout_sec poll_sec wait_mode token
  local -a acquire_args
  timeout_sec="${BASESHOP_WRITER_LOCK_ACTIVE_TIMEOUT_SEC:-300}"
  poll_sec="${BASESHOP_WRITER_LOCK_ACTIVE_POLL_SEC:-30}"
  wait_mode="${BASESHOP_WRITER_LOCK_ACTIVE_WAIT_MODE:-1}"

  acquire_args=(acquire --timeout "$timeout_sec" --poll "$poll_sec")
  if [[ "$wait_mode" == "1" ]]; then
    acquire_args+=(--wait)
  fi

  "$lock_script" "${acquire_args[@]}"

  token="$(grep -E '^token=' "$lock_meta" | sed 's/^token=//' | head -n 1)"
  if [[ -z "$token" ]]; then
    echo "ERROR: writer lock reacquired but token missing." >&2
    exit 1
  fi

  writer_lock_store_token "$token"
}

writer_lock_repo_state_fingerprint() {
  git status --porcelain=v2 --branch --untracked-files=no | git hash-object --stdin
}

writer_lock_staged_tree() {
  git write-tree
}
