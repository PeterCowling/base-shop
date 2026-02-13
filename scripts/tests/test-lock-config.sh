#!/usr/bin/env bash

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  set -euo pipefail
fi

test_lock_repo_root() {
  if [[ -n "${BASESHOP_TEST_LOCK_REPO_ROOT:-}" ]]; then
    printf '%s' "${BASESHOP_TEST_LOCK_REPO_ROOT}"
    return 0
  fi

  git rev-parse --show-toplevel 2>/dev/null || pwd
}

test_lock_scope() {
  local scope="${BASESHOP_TEST_LOCK_SCOPE:-repo}"
  case "$scope" in
    repo|machine)
      printf '%s' "$scope"
      ;;
    *)
      printf 'repo'
      ;;
  esac
}

test_lock_state_root() {
  local scope
  scope="$(test_lock_scope)"

  if [[ "$scope" == "repo" ]]; then
    local repo_root
    repo_root="$(test_lock_repo_root)"
    printf '%s/.cache/test-governor/test-lock' "$repo_root"
    return 0
  fi

  if [[ -n "${BASESHOP_TEST_LOCK_MACHINE_ROOT:-}" ]]; then
    printf '%s' "${BASESHOP_TEST_LOCK_MACHINE_ROOT}"
    return 0
  fi

  local user_name
  user_name="$(id -un 2>/dev/null || whoami)"
  printf '%s/base-shop-test-lock-%s' "${TMPDIR:-/tmp}" "$user_name"
}

test_lock_stale_seconds() {
  local value="${BASESHOP_TEST_LOCK_STALE_SEC:-120}"
  if [[ "$value" =~ ^[0-9]+$ ]]; then
    printf '%s' "$value"
    return 0
  fi
  printf '120'
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  printf 'scope=%s\n' "$(test_lock_scope)"
  printf 'repo_root=%s\n' "$(test_lock_repo_root)"
  printf 'state_root=%s\n' "$(test_lock_state_root)"
  printf 'stale_sec=%s\n' "$(test_lock_stale_seconds)"
fi
