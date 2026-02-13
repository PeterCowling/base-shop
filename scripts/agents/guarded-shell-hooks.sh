#!/usr/bin/env bash

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  set -euo pipefail
fi

telemetry_script_path() {
  local repo_root="${BASESHOP_GUARD_REPO_ROOT:-}"
  if [[ -z "$repo_root" ]]; then
    repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
  fi
  printf '%s/scripts/tests/telemetry-log.sh' "$repo_root"
}

baseshop_guard_is_governed_context() {
  [[ "${BASESHOP_GOVERNED_CONTEXT:-0}" == "1" ]]
}

baseshop_guard_policy_override_enabled() {
  [[ "${BASESHOP_ALLOW_BYPASS_POLICY:-0}" == "1" ]]
}

baseshop_guard_emit_event() {
  local policy_mode="${1:-enforce}"
  local event_class="${2:-unknown}"
  local telemetry_script
  telemetry_script="$(telemetry_script_path)"

  if [[ -x "$telemetry_script" ]]; then
    "$telemetry_script" emit \
      --governed false \
      --policy-mode "$policy_mode" \
      --class "$event_class" \
      --normalized-sig "$event_class" \
      --pressure-level unknown \
      --workers 0 \
      --override-policy-used "${BASESHOP_ALLOW_BYPASS_POLICY:-0}" \
      --override-overload-used "${BASESHOP_ALLOW_OVERLOAD:-0}" >/dev/null 2>&1 || true
  fi
}

baseshop_guard_classify_raw_line() {
  local line="${1:-}"
  [[ -z "$line" ]] && return 1

  # Let governed commands pass without warnings.
  if [[ "$line" =~ (^|[[:space:]])test:governed([[:space:]]|$) ]]; then
    return 1
  fi

  if [[ "$line" =~ (^|[[:space:]])\./node_modules/\.bin/jest([[:space:]]|$) ]]; then
    printf 'local-bin-jest'
    return 0
  fi

  if [[ "$line" =~ (^|[[:space:]])node[[:space:]][^[:space:]]*jest/bin/jest\.js([[:space:]]|$) ]]; then
    printf 'node-jest-bin'
    return 0
  fi

  return 1
}

baseshop_guard_classify_top_level_argv() {
  local cmd="${1:-}"
  local next="${2:-}"

  case "$cmd" in
    ./node_modules/.bin/jest|node_modules/.bin/jest)
      printf 'local-bin-jest'
      return 0
      ;;
    node)
      if [[ "$next" == *"jest/bin/jest.js"* ]]; then
        printf 'node-jest-bin'
        return 0
      fi
      ;;
  esac

  return 1
}

baseshop_guard_block_and_log() {
  local event_class="${1:-unknown}"
  local command_preview="${2:-}"
  echo "BLOCKED: ungoverned Jest invocation detected (${event_class})." >&2
  echo "Command: ${command_preview}" >&2
  echo "Recommended: pnpm -w run test:governed -- jest -- <args>" >&2
  if [[ "${BASESHOP_ALLOW_OVERLOAD:-0}" == "1" ]]; then
    echo "Note: BASESHOP_ALLOW_OVERLOAD=1 does not bypass command-policy blocking." >&2
  fi
  echo "Set BASESHOP_ALLOW_BYPASS_POLICY=1 to reroute this command through the governed runner." >&2
  baseshop_guard_emit_event "enforce" "$event_class"
}

baseshop_guard_override_notice() {
  local event_class="${1:-unknown}"
  local command_preview="${2:-}"
  echo "BYPASS POLICY OVERRIDE: rerouting ungoverned Jest invocation (${event_class})." >&2
  echo "Original command: ${command_preview}" >&2
  baseshop_guard_emit_event "enforce" "$event_class"
}

baseshop_guard_inspect_line() {
  if baseshop_guard_is_governed_context; then
    return 0
  fi

  local line="${1:-}"
  local event_class
  event_class="$(baseshop_guard_classify_raw_line "$line" || true)"
  if [[ -n "$event_class" ]]; then
    if baseshop_guard_policy_override_enabled; then
      # Interactive preexec hooks cannot safely rewrite commands, so override allows through.
      baseshop_guard_override_notice "$event_class" "$line"
      return 0
    fi
    baseshop_guard_block_and_log "$event_class" "$line"
    return 42
  fi
}

baseshop_guard_inspect_argv() {
  if baseshop_guard_is_governed_context; then
    return 0
  fi

  local event_class
  event_class="$(baseshop_guard_classify_top_level_argv "${1:-}" "${2:-}" || true)"
  if [[ -n "$event_class" ]]; then
    local preview
    preview="$*"
    if baseshop_guard_policy_override_enabled; then
      baseshop_guard_override_notice "$event_class" "$preview"
      # Command mode caller can reroute this invocation through test:governed.
      return 43
    fi
    baseshop_guard_block_and_log "$event_class" "$preview"
    return 42
  fi
}

__baseshop_guard_debug_hook() {
  # Prevent recursion while trap executes shell internals.
  if [[ "${BASESHOP_GUARD_HOOK_ACTIVE:-0}" == "1" ]]; then
    return 0
  fi
  BASESHOP_GUARD_HOOK_ACTIVE=1
  if ! baseshop_guard_inspect_line "${BASH_COMMAND:-}"; then
    BASESHOP_GUARD_HOOK_ACTIVE=0
    return 1
  fi
  BASESHOP_GUARD_HOOK_ACTIVE=0
}

__baseshop_guard_zsh_preexec_hook() {
  baseshop_guard_inspect_line "${1:-}" || return 1
}

baseshop_guard_install_hooks() {
  if [[ "${BASESHOP_GUARD_HOOKS_INSTALLED:-0}" == "1" ]]; then
    return 0
  fi

  if [[ -n "${BASH_VERSION:-}" ]]; then
    trap __baseshop_guard_debug_hook DEBUG
  elif [[ -n "${ZSH_VERSION:-}" ]]; then
    if ! typeset -f add-zsh-hook >/dev/null 2>&1; then
      autoload -Uz add-zsh-hook >/dev/null 2>&1 || true
    fi
    if typeset -f add-zsh-hook >/dev/null 2>&1; then
      add-zsh-hook preexec __baseshop_guard_zsh_preexec_hook
    else
      preexec_functions+=(__baseshop_guard_zsh_preexec_hook)
    fi
  fi

  export BASESHOP_GUARD_HOOKS_INSTALLED=1
}

if [[ "${BASESHOP_GUARD_ENABLE_HOOKS:-0}" == "1" ]]; then
  baseshop_guard_install_hooks
fi

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  case "${1:-}" in
    --inspect-argv)
      shift
      baseshop_guard_inspect_argv "$@"
      ;;
    --inspect-line)
      shift
      baseshop_guard_inspect_line "$*"
      ;;
    --install)
      baseshop_guard_install_hooks
      ;;
    *)
      echo "Usage: $0 --inspect-argv <args...> | --inspect-line <command...> | --install" >&2
      exit 2
      ;;
  esac
fi
