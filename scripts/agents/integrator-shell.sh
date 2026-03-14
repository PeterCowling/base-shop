#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage:"
  echo "  scripts/agents/integrator-shell.sh [options] -- <command> [args...]"
  echo "  scripts/agents/integrator-shell.sh --read-only          # opens a guarded read-only subshell"
  echo "  scripts/agents/integrator-shell.sh --interactive-write-shell"
  echo "                                      # rare explicit locked integrator subshell"
  echo ""
  echo "Integrator mode:"
  echo "  - Default (write mode): acquires the Base-Shop writer lock for bounded write commands"
  echo "  - Read-only mode: enables command guards without taking writer lock"
  echo "  - Agent write session mode: explicit opt-in for long-lived agent CLIs that edit the shared checkout"
  echo "  - Enables command guards (git safety + broad-test safety)"
  echo "  - Command-mode interactive shells such as '-- bash' are forbidden; use --interactive-write-shell instead"
  echo "  - Long-lived non-write commands such as dev/watch/serve/preview are forbidden in write mode"
  echo ""
  echo "Options:"
  echo "  --read-only       Guard-only mode (no writer lock; use for long audits/dry-runs)"
  echo "  --write           Force write mode (default)"
  echo "  --interactive-write-shell  Explicitly open a locked interactive write shell (rare)"
  echo "  --agent-write-session  Explicitly allow a long-lived agent CLI session (for example codex or claude) to hold the writer lock"
  echo "  --timeout <sec>   Lock wait timeout in write mode (default: 300s in non-interactive agents; 0 = wait forever only in interactive shells)"
  echo "  --poll <sec>      Lock polling interval in write mode (default: 30)"
  echo "  --no-wait         Do not wait for lock in write mode"
  echo "  --wait-forever    Wait indefinitely for lock in write mode"
  echo "  -h, --help        Show this help"
  echo ""
  echo "Example:"
  echo "  scripts/agents/integrator-shell.sh --read-only -- codex"
  echo "  scripts/agents/integrator-shell.sh --read-only -- claude"
  echo "  scripts/agents/integrator-shell.sh --agent-write-session -- codex"
  echo "  scripts/agents/integrator-shell.sh --timeout 15 -- <write-command>"
}

block_implicit_agent_write_session() {
  local agent="$1"

  cat >&2 <<EOF
ERROR: long-lived agent CLI sessions must opt in explicitly before they hold the writer lock.
Failure reason: write mode would hold the Base-Shop writer lock for the full ${agent} session, which blocks unrelated repo work while the shared checkout may still be edited.
Retry posture: retry-forbidden
Exact next step: scripts/agents/integrator-shell.sh --read-only -- ${agent} [args...]
Anti-retry list:
- scripts/agents/integrator-shell.sh -- ${agent} [args...]
- scripts/agents/integrator-shell.sh --write -- ${agent} [args...]
- scripts/agents/integrator-shell.sh --wait-forever -- ${agent} [args...]
Escalation/stop condition: if this ${agent} session must edit files directly in the shared checkout, rerun with scripts/agents/integrator-shell.sh --agent-write-session -- ${agent} [args...]; if that session would mostly do discovery, waiting, or external verification, stop and redesign the workflow instead of holding the lock.
EOF
  exit 1
}

block_implicit_interactive_write_shell() {
  cat >&2 <<'EOF'
ERROR: interactive writer shells must opt in explicitly.
Failure reason: opening a locked interactive integrator shell holds the Base-Shop writer lock for the full shell lifetime, which makes long-held locks easy to create accidentally.
Retry posture: retry-forbidden
Exact next step: scripts/agents/integrator-shell.sh -- <write-command> [args...]
Anti-retry list:
- scripts/agents/integrator-shell.sh
- scripts/agents/integrator-shell.sh --write
- scripts/agents/integrator-shell.sh --wait-forever
Escalation/stop condition: if you genuinely need a rare interactive write shell for a bounded repair, rerun with scripts/agents/integrator-shell.sh --interactive-write-shell and exit as soon as the serialized write window closes.
EOF
  exit 1
}

block_command_mode_interactive_write_shell() {
  cat >&2 <<'EOF'
ERROR: command-mode interactive writer shells are forbidden.
Failure reason: invocations such as scripts/agents/integrator-shell.sh -- bash still open a locked interactive shell and can hold the Base-Shop writer lock indefinitely.
Retry posture: retry-forbidden
Exact next step: scripts/agents/integrator-shell.sh -- <write-command> [args...]
Anti-retry list:
- scripts/agents/integrator-shell.sh -- bash
- scripts/agents/integrator-shell.sh -- sh
- scripts/agents/integrator-shell.sh -- zsh
- scripts/agents/integrator-shell.sh -- scripts/agents/with-git-guard.sh -- bash
Escalation/stop condition: if you genuinely need a rare interactive write shell for a bounded repair, rerun with scripts/agents/integrator-shell.sh --interactive-write-shell and exit as soon as the serialized write window closes.
EOF
  exit 1
}

block_long_lived_non_write_write_mode() {
  local rendered=""

  printf -v rendered '%q ' "$@"
  rendered="${rendered% }"

  cat >&2 <<EOF
ERROR: long-lived non-write commands are forbidden in integrator write mode.
Failure reason: ${rendered} is a long-lived non-write session (for example dev/watch/serve/preview) and would hold the Base-Shop writer lock without performing serialized repo mutation.
Retry posture: retry-forbidden
Exact next step: scripts/agents/integrator-shell.sh --read-only -- ${rendered}
Anti-retry list:
- scripts/agents/integrator-shell.sh -- ${rendered}
- scripts/agents/integrator-shell.sh --write -- ${rendered}
- scripts/agents/integrator-shell.sh --wait-forever -- ${rendered}
- scripts/agents/integrator-shell.sh --timeout 0 -- ${rendered}
- scripts/agents/integrator-shell.sh --agent-write-session -- ${rendered}
Escalation/stop condition: if this command truly must mutate the shared checkout while it runs, stop and ask the operator to define the serialized write window explicitly; after one blocked retry, stop local retries and escalate.
EOF
  exit 1
}

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$repo_root" ]]; then
  echo "ERROR: not inside a git repository" >&2
  exit 1
fi

cd "$repo_root"

writer_lock="${repo_root}/scripts/agents/with-writer-lock.sh"
git_guard="${repo_root}/scripts/agents/with-git-guard.sh"
agent_guard="${repo_root}/scripts/agents/agent-session-guard.sh"

if [[ ! -x "$writer_lock" ]]; then
  echo "ERROR: missing ${writer_lock}" >&2
  exit 1
fi
if [[ ! -x "$git_guard" ]]; then
  echo "ERROR: missing ${git_guard}" >&2
  exit 1
fi
if [[ ! -f "$agent_guard" ]]; then
  echo "ERROR: missing ${agent_guard}" >&2
  exit 1
fi

# shellcheck source=/dev/null
source "$agent_guard"

mode="write"
lock_wait="1"
lock_timeout=""
lock_poll=""
command_mode="0"
agent_write_session="0"
interactive_write_shell="0"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --read-only|--guard-only)
      mode="read-only"
      shift
      ;;
    --write)
      mode="write"
      shift
      ;;
    --agent-write-session)
      agent_write_session="1"
      shift
      ;;
    --interactive-write-shell)
      interactive_write_shell="1"
      shift
      ;;
    --timeout)
      lock_timeout="${2:-}"
      if [[ -z "$lock_timeout" ]]; then
        echo "ERROR: --timeout requires a value in seconds." >&2
        exit 2
      fi
      shift 2
      ;;
    --poll)
      lock_poll="${2:-}"
      if [[ -z "$lock_poll" ]]; then
        echo "ERROR: --poll requires a value in seconds." >&2
        exit 2
      fi
      shift 2
      ;;
    --no-wait)
      lock_wait="0"
      shift
      ;;
    --wait)
      lock_wait="1"
      shift
      ;;
    --wait-forever)
      lock_wait="1"
      lock_timeout="0"
      shift
      ;;
    --)
      command_mode="1"
      shift
      break
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "ERROR: unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

# CI-only test execution policy: export BASESHOP_CI_ONLY_TESTS=1 so all child
# processes (agents, commands) receive the block automatically. The governed runner
# checks this variable and exits 1 with a redirect message when CI is not set.
# GitHub Actions sets CI=true, so the block does not fire in CI environments.
export BASESHOP_CI_ONLY_TESTS=1

if [[ "$mode" == "read-only" ]]; then
  if [[ "$command_mode" == "0" ]]; then
    if [[ ! -t 0 ]]; then
      echo "ERROR: stdin is not a terminal; cannot open an interactive guarded subshell." >&2
      echo "Run in command mode instead:" >&2
      echo "  scripts/agents/integrator-shell.sh --read-only -- <command> [args...]" >&2
      exit 2
    fi
    exec "$git_guard"
  fi

  if [[ $# -eq 0 ]]; then
    usage >&2
    exit 2
  fi
  exec "$git_guard" -- "$@"
fi

if [[ -z "$lock_timeout" ]]; then
  if [[ -n "${BASESHOP_INTEGRATOR_LOCK_TIMEOUT_SEC:-}" ]]; then
    lock_timeout="${BASESHOP_INTEGRATOR_LOCK_TIMEOUT_SEC}"
  else
    # Agents (non-interactive) should not wait indefinitely.
    if [[ ! -t 0 ]]; then
      lock_timeout="300"
    else
      lock_timeout="0"
    fi
  fi
fi
if [[ -z "$lock_poll" ]]; then
  lock_poll="${BASESHOP_INTEGRATOR_LOCK_POLL_SEC:-30}"
fi

if ! [[ "$lock_timeout" =~ ^[0-9]+$ ]]; then
  echo "ERROR: --timeout must be an integer number of seconds (0 or greater)." >&2
  exit 2
fi
if ! [[ "$lock_poll" =~ ^[0-9]+$ ]]; then
  echo "ERROR: --poll must be an integer number of seconds (0 or greater)." >&2
  exit 2
fi

if [[ "$command_mode" == "1" ]]; then
  if detect_interactive_shell "$@" >/dev/null; then
    block_command_mode_interactive_write_shell
  fi
  if detect_long_lived_non_write_command "$@" >/dev/null; then
    block_long_lived_non_write_write_mode "$@"
  fi
fi

# Non-interactive agents must not wait forever, and must poll (check) periodically.
if [[ ! -t 0 ]]; then
  lock_poll="30"
  if [[ "$lock_wait" == "1" ]]; then
    lock_timeout="300"
  fi
fi

writer_lock_args=(--timeout "$lock_timeout" --poll "$lock_poll")
if [[ "$lock_wait" == "1" ]]; then
  writer_lock_args+=(--wait)
else
  writer_lock_args+=(--no-wait)
fi

if [[ "$command_mode" == "0" ]]; then
  if [[ ! -t 0 ]]; then
    echo "ERROR: stdin is not a terminal; cannot open an interactive integrator subshell." >&2
    echo "Run in command mode instead:" >&2
    echo "  scripts/agents/integrator-shell.sh -- <command> [args...]" >&2
    exit 2
  fi
  if [[ "$interactive_write_shell" != "1" ]]; then
    block_implicit_interactive_write_shell
  fi
  exec "$writer_lock" "${writer_lock_args[@]}" -- "$git_guard"
fi

if [[ $# -eq 0 ]]; then
  usage >&2
  exit 2
fi

if [[ "$agent_write_session" != "1" ]]; then
  if agent_name="$(detect_long_lived_agent_cli "$@")"; then
    block_implicit_agent_write_session "$agent_name"
  fi
fi

# Run the command inside both the writer lock and git guard.
exec "$writer_lock" "${writer_lock_args[@]}" -- "$git_guard" -- "$@"
