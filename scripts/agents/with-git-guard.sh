#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage:"
  echo "  scripts/agents/with-git-guard.sh -- <command> [args...]"
  echo "  scripts/agents/with-git-guard.sh            # opens a guarded subshell"
  echo ""
  echo "Prepends scripts/agent-bin/ to PATH so command guards are active:"
  echo "  - git: blocks destructive/history-rewriting commands"
  echo "  - pnpm/turbo: block broad test fan-out commands"
  echo "  - npm/npx: warn on ungoverned Jest entry points"
  echo "  - shell hooks: warn on raw node/jest and local-bin Jest invocations"
  echo ""
  echo "Example:"
  echo "  scripts/agents/with-git-guard.sh -- codex"
}

reroute_raw_jest_to_governed() {
  local first="${1:-}"
  shift || true
  local -a jest_args=()

  case "$first" in
    node)
      # node /.../jest/bin/jest.js <jest args...>
      if [[ $# -gt 0 ]]; then
        shift || true
      fi
      if [[ $# -gt 0 ]]; then
        jest_args=("$@")
      fi
      ;;
    ./node_modules/.bin/jest|node_modules/.bin/jest)
      if [[ $# -gt 0 ]]; then
        jest_args=("$@")
      fi
      ;;
    *)
      # Fallback: preserve arguments as-is.
      jest_args=("$first" "$@")
      ;;
  esac

  echo "BYPASS POLICY OVERRIDE: rerouting through governed runner." >&2
  exec pnpm -w run test:governed -- jest -- "${jest_args[@]}"
}

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$repo_root" ]]; then
  echo "ERROR: not inside a git repository" >&2
  exit 1
fi

cd "$repo_root"

guard_bin="${repo_root}/scripts/agent-bin"
hook_script="${repo_root}/scripts/agents/guarded-shell-hooks.sh"
if [[ ! -d "$guard_bin" ]]; then
  echo "ERROR: missing ${guard_bin}" >&2
  exit 1
fi
if [[ ! -f "$hook_script" ]]; then
  echo "ERROR: missing ${hook_script}" >&2
  exit 1
fi

export PATH="${guard_bin}:${PATH}"
export BASESHOP_GUARD_REPO_ROOT="$repo_root"
export BASESHOP_GUARD_ENABLE_HOOKS=1

if [[ $# -eq 0 ]]; then
  if [[ ! -t 0 ]]; then
    echo "ERROR: stdin is not a terminal; cannot open an interactive guarded subshell." >&2
    echo "Run in command mode instead:" >&2
    echo "  scripts/agents/with-git-guard.sh -- <command> [args...]" >&2
    exit 2
  fi

  echo "Git/test guard enabled for this shell (PATH prepended with scripts/agent-bin)." >&2
  echo "Run your agent from here, or exit to disable." >&2

  exec bash --rcfile <(
    cat <<RC
if [[ -f ~/.bashrc ]]; then
  source ~/.bashrc
fi
export BASESHOP_GUARD_REPO_ROOT=$(printf %q "$repo_root")
export BASESHOP_GUARD_ENABLE_HOOKS=1
source $(printf %q "$hook_script")
RC
  )
fi

if [[ "${1:-}" != "--" ]]; then
  usage >&2
  exit 2
fi

shift
if [[ $# -eq 0 ]]; then
  usage >&2
  exit 2
fi

# Top-level command mode: classify raw direct invocations before execution.
if [[ -x "$hook_script" ]]; then
  set +e
  "$hook_script" --inspect-argv "$@"
  inspect_status="$?"
  set -e
  case "$inspect_status" in
    0)
      ;;
    43)
      reroute_raw_jest_to_governed "$@"
      ;;
    42)
      exit 1
      ;;
    *)
      exit "$inspect_status"
      ;;
  esac
fi

exec "$@"
