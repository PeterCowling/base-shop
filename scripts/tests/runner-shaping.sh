#!/usr/bin/env bash

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  set -euo pipefail
fi

baseshop_runner_usage() {
  cat <<'EOF'
Usage:
  pnpm -w run test:governed -- jest -- <jest args>
  pnpm -w run test:governed -- turbo -- <turbo test args>
  pnpm -w run test:governed -- changed -- <changed file paths>
  BASESHOP_ALLOW_WATCH_EXCLUSIVE=1 pnpm -w run test:governed -- watch-exclusive -- <jest watch args>
EOF
}

baseshop_runner_intent_allowed() {
  case "${1:-}" in
    jest|turbo|changed|watch-exclusive)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

baseshop_runner_has_arg() {
  local target="$1"
  shift
  local arg
  for arg in "$@"; do
    if [[ "$arg" == "$target" ]]; then
      return 0
    fi
  done
  return 1
}

baseshop_runner_has_arg_prefix() {
  local prefix="$1"
  shift
  local arg
  for arg in "$@"; do
    if [[ "$arg" == "${prefix}"* ]]; then
      return 0
    fi
  done
  return 1
}

baseshop_runner_has_watch_adjacent_flags() {
  local arg
  for arg in "$@"; do
    case "$arg" in
      --watch|--watchAll|--watchman|--onlyChanged|--lastCommit|--changedFilesWithAncestor)
        return 0
        ;;
      --watch=*|--watchAll=*|--watchman=*|--onlyChanged=*|--lastCommit=*|--changedFilesWithAncestor=*)
        return 0
        ;;
    esac
  done
  return 1
}

baseshop_runner_validate_watch_policy() {
  local intent="$1"
  shift

  if [[ "$intent" == "watch-exclusive" ]]; then
    if [[ "${BASESHOP_ALLOW_WATCH_EXCLUSIVE:-0}" != "1" ]]; then
      echo "ERROR: watch-exclusive requires BASESHOP_ALLOW_WATCH_EXCLUSIVE=1." >&2
      return 1
    fi
    return 0
  fi

  if baseshop_runner_has_watch_adjacent_flags "$@"; then
    echo "ERROR: watch/watch-adjacent flags are blocked for intent '${intent}'." >&2
    echo "Use explicit watch lane: BASESHOP_ALLOW_WATCH_EXCLUSIVE=1 pnpm -w run test:governed -- watch-exclusive -- <jest args>" >&2
    return 1
  fi

  return 0
}

baseshop_runner_shape_args() {
  local intent="$1"
  shift
  local -a shaped_args=()
  if [[ $# -gt 0 ]]; then
    shaped_args=("$@")
  fi

  case "$intent" in
    jest|changed)
      local has_run_in_band="0"
      local has_max_workers="0"
      local has_max_workers_eq="0"
      local has_force_exit="0"
      if [[ ${#shaped_args[@]} -gt 0 ]] && baseshop_runner_has_arg "--runInBand" "${shaped_args[@]}"; then
        has_run_in_band="1"
      fi
      if [[ ${#shaped_args[@]} -gt 0 ]] && baseshop_runner_has_arg "--maxWorkers" "${shaped_args[@]}"; then
        has_max_workers="1"
      fi
      if [[ ${#shaped_args[@]} -gt 0 ]] && baseshop_runner_has_arg_prefix "--maxWorkers=" "${shaped_args[@]}"; then
        has_max_workers_eq="1"
      fi
      if [[ ${#shaped_args[@]} -gt 0 ]] && baseshop_runner_has_arg "--forceExit" "${shaped_args[@]}"; then
        has_force_exit="1"
      fi
      if [[ "$has_run_in_band" != "1" && "$has_max_workers" != "1" && "$has_max_workers_eq" != "1" ]]; then
        shaped_args+=("--maxWorkers=2")
      fi
      if [[ "$has_force_exit" != "1" ]]; then
        shaped_args+=("--forceExit")
      fi
      ;;
    turbo)
      local has_concurrency="0"
      local has_concurrency_eq="0"
      if [[ ${#shaped_args[@]} -gt 0 ]] && baseshop_runner_has_arg "--concurrency" "${shaped_args[@]}"; then
        has_concurrency="1"
      fi
      if [[ ${#shaped_args[@]} -gt 0 ]] && baseshop_runner_has_arg_prefix "--concurrency=" "${shaped_args[@]}"; then
        has_concurrency_eq="1"
      fi
      if [[ "$has_concurrency" != "1" && "$has_concurrency_eq" != "1" ]]; then
        shaped_args+=("--concurrency=2")
      fi
      ;;
    watch-exclusive)
      local has_watch_run_in_band="0"
      if [[ ${#shaped_args[@]} -gt 0 ]] && baseshop_runner_has_arg "--runInBand" "${shaped_args[@]}"; then
        has_watch_run_in_band="1"
      fi
      if [[ "$has_watch_run_in_band" != "1" ]]; then
        shaped_args+=("--runInBand")
      fi
      ;;
  esac

  BASESHOP_SHAPED_ARGS=()
  if [[ ${#shaped_args[@]} -gt 0 ]]; then
    BASESHOP_SHAPED_ARGS=("${shaped_args[@]}")
  fi
}

BASESHOP_SHAPED_ARGS=()
