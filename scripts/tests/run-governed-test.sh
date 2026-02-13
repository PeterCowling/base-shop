#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
runner_shaping_script="${script_dir}/runner-shaping.sh"
test_lock_script="${script_dir}/test-lock.sh"

# shellcheck source=scripts/tests/runner-shaping.sh
source "$runner_shaping_script"

# pnpm run forwards a separator token before script args; normalize it.
while [[ "${1:-}" == "--" ]]; do
  shift
done

intent="${1:-}"
if [[ -z "$intent" ]]; then
  baseshop_runner_usage >&2
  exit 2
fi
shift || true

if [[ "${1:-}" == "--" ]]; then
  shift
fi

if ! baseshop_runner_intent_allowed "$intent"; then
  echo "ERROR: intent '${intent}' is not allowed." >&2
  baseshop_runner_usage >&2
  exit 2
fi

declare -a raw_args=()
if [[ $# -gt 0 ]]; then
  raw_args=("$@")
fi

# Package scripts can inject additional `--` separators when forwarding args.
# Normalize these tokens so downstream CLI flags keep their intended meaning.
if [[ ${#raw_args[@]} -gt 0 ]]; then
  declare -a normalized_args=()
  for arg in "${raw_args[@]}"; do
    if [[ "$arg" == "--" ]]; then
      continue
    fi
    normalized_args+=("$arg")
  done
  raw_args=("${normalized_args[@]}")
fi

if [[ ${#raw_args[@]} -gt 0 ]]; then
  if ! baseshop_runner_validate_watch_policy "$intent" "${raw_args[@]}"; then
    exit 2
  fi
  baseshop_runner_shape_args "$intent" "${raw_args[@]}"
else
  if ! baseshop_runner_validate_watch_policy "$intent"; then
    exit 2
  fi
  baseshop_runner_shape_args "$intent"
fi

declare -a shaped_args=()
if [[ ${#BASESHOP_SHAPED_ARGS[@]} -gt 0 ]]; then
  shaped_args=("${BASESHOP_SHAPED_ARGS[@]}")
fi

command_sig="${intent}"

case "$intent" in
  jest)
    command=("pnpm" "exec" "jest")
    ;;
  turbo)
    command=("pnpm" "exec" "turbo" "run" "test")
    ;;
  changed)
    command=("pnpm" "exec" "jest" "--findRelatedTests")
    ;;
  watch-exclusive)
    command=("pnpm" "exec" "jest")
    ;;
esac

if [[ ${#shaped_args[@]} -gt 0 ]]; then
  command+=("${shaped_args[@]}")
fi

lock_held="0"
heartbeat_pid=""
command_pid=""
cleanup_running="0"

cleanup() {
  if [[ "$cleanup_running" == "1" ]]; then
    return 0
  fi
  cleanup_running="1"

  if [[ -n "$command_pid" ]] && kill -0 "$command_pid" 2>/dev/null; then
    kill "$command_pid" 2>/dev/null || true
  fi

  if [[ -n "$heartbeat_pid" ]] && kill -0 "$heartbeat_pid" 2>/dev/null; then
    kill "$heartbeat_pid" 2>/dev/null || true
    wait "$heartbeat_pid" 2>/dev/null || true
  fi

  if [[ "$lock_held" == "1" ]]; then
    "$test_lock_script" release >/dev/null 2>&1 || "$test_lock_script" release --force >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

ci_compat_mode="0"
if [[ "${BASESHOP_GOVERNED_CI_MODE:-auto}" != "off" ]]; then
  if [[ "${CI:-}" == "true" || "${CI:-}" == "1" ]]; then
    ci_compat_mode="1"
  fi
fi

if [[ "$ci_compat_mode" == "1" ]]; then
  echo "Running in governed CI compatibility mode: scheduler/admission bypassed, shaping enforced." >&2
else
  "$test_lock_script" acquire --wait --command-sig "$command_sig"
  lock_held="1"

  heartbeat_interval="${BASESHOP_TEST_LOCK_HEARTBEAT_SEC:-30}"
  if ! [[ "$heartbeat_interval" =~ ^[0-9]+$ ]] || [[ "$heartbeat_interval" == "0" ]]; then
    heartbeat_interval="30"
  fi

  (
    while true; do
      sleep "$heartbeat_interval"
      "$test_lock_script" heartbeat --command-sig "$command_sig" >/dev/null 2>&1 || true
    done
  ) &
  heartbeat_pid="$!"
fi

export BASESHOP_GOVERNED_CONTEXT=1

set +e
"${command[@]}" &
command_pid="$!"
wait "$command_pid"
command_exit="$?"
set -e

exit "$command_exit"
