#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage:"
  echo "  scripts/agents/with-writer-lock.sh [options] -- <command> [args...]"
  echo "  scripts/agents/with-writer-lock.sh --interactive-shell  # rare explicit locked subshell"
  echo ""
  echo "Acquires the Base-Shop single-writer lock and exports BASESHOP_WRITER_LOCK_TOKEN"
  echo "for child processes (git hooks use this to enforce single-writer commits/pushes)."
  echo "Command-mode interactive shells such as '-- bash' are forbidden; use --interactive-shell instead."
  echo "Long-lived non-write commands such as dev/watch/serve/preview are forbidden while the writer lock is held."
  echo ""
  echo "Options:"
  echo "  --interactive-shell  Explicitly open a locked interactive shell (rare)"
  echo "  --agent-write-session  Explicitly allow a long-lived agent CLI session (for example codex or claude)"
  echo "  --timeout <sec>   Wait timeout while acquiring lock (default: 300s in non-interactive agents; 0 = wait forever only in interactive shells)"
  echo "  --poll <sec>      Poll interval while waiting (default: 30)"
  echo "  --no-wait         Do not wait; fail immediately if lock is held"
  echo "  --wait            Wait for lock (default)"
  echo "  --wait-forever    Equivalent to --wait --timeout 0"
  echo "  -h, --help        Show this help"
}

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$repo_root" ]]; then
  echo "ERROR: not inside a git repository" >&2
  exit 1
fi

cd "$repo_root"

lock_script="${repo_root}/scripts/git/writer-lock.sh"
agent_guard="${repo_root}/scripts/agents/agent-session-guard.sh"
if [[ ! -x "$lock_script" ]]; then
  echo "ERROR: missing ${lock_script}" >&2
  exit 1
fi
if [[ ! -f "$agent_guard" ]]; then
  echo "ERROR: missing ${agent_guard}" >&2
  exit 1
fi

# shellcheck source=/dev/null
source "$agent_guard"

block_implicit_agent_write_session() {
  local agent="$1"

  cat >&2 <<EOF
ERROR: long-lived agent CLI sessions must opt in explicitly before they hold the writer lock.
Failure reason: write mode would hold the Base-Shop writer lock for the full ${agent} session, which blocks unrelated repo work while the shared checkout may still be edited.
Retry posture: retry-forbidden
Exact next step: scripts/agents/integrator-shell.sh --read-only -- ${agent} [args...]
Anti-retry list:
- scripts/agents/with-writer-lock.sh -- ${agent} [args...]
- scripts/agents/with-writer-lock.sh --wait-forever -- ${agent} [args...]
Escalation/stop condition: if this ${agent} session must edit files directly in the shared checkout, rerun with scripts/agents/with-writer-lock.sh --agent-write-session -- ${agent} [args...]; if the work is mostly discovery, waiting, or external verification, stop and redesign the workflow instead of holding the lock.
EOF
  exit 1
}

block_implicit_interactive_shell() {
  cat >&2 <<'EOF'
ERROR: interactive writer shells must opt in explicitly.
Failure reason: opening a locked interactive shell holds the Base-Shop writer lock for the full shell lifetime, which makes long-held locks easy to create accidentally.
Retry posture: retry-forbidden
Exact next step: scripts/agents/with-writer-lock.sh -- <git-write-command>
Anti-retry list:
- scripts/agents/with-writer-lock.sh
- scripts/agents/with-writer-lock.sh --wait-forever
- scripts/agents/with-writer-lock.sh --timeout 0
Escalation/stop condition: if you genuinely need a rare interactive locked shell for a bounded repair, rerun with scripts/agents/with-writer-lock.sh --interactive-shell and exit as soon as the serialized write window closes.
EOF
  exit 1
}

block_command_mode_interactive_shell() {
  cat >&2 <<'EOF'
ERROR: command-mode interactive shells are forbidden while holding the writer lock.
Failure reason: invocations such as scripts/agents/with-writer-lock.sh -- bash still open a locked interactive shell and can hold the Base-Shop writer lock indefinitely.
Retry posture: retry-forbidden
Exact next step: scripts/agents/with-writer-lock.sh -- <git-write-command>
Anti-retry list:
- scripts/agents/with-writer-lock.sh -- bash
- scripts/agents/with-writer-lock.sh -- sh
- scripts/agents/with-writer-lock.sh -- zsh
- scripts/agents/with-writer-lock.sh -- scripts/agents/with-git-guard.sh -- bash
Escalation/stop condition: if you genuinely need a rare interactive locked shell for a bounded repair, rerun with scripts/agents/with-writer-lock.sh --interactive-shell and exit as soon as the serialized write window closes.
EOF
  exit 1
}

block_long_lived_non_write_command() {
  local rendered=""

  printf -v rendered '%q ' "$@"
  rendered="${rendered% }"

  cat >&2 <<EOF
ERROR: long-lived non-write commands are forbidden while holding the writer lock.
Failure reason: ${rendered} is a long-lived non-write session (for example dev/watch/serve/preview) and would hold the Base-Shop writer lock without performing serialized repo mutation.
Retry posture: retry-forbidden
Exact next step: scripts/agents/integrator-shell.sh --read-only -- ${rendered}
Anti-retry list:
- scripts/agents/with-writer-lock.sh -- ${rendered}
- scripts/agents/with-writer-lock.sh --wait-forever -- ${rendered}
- scripts/agents/with-writer-lock.sh --timeout 0 -- ${rendered}
- scripts/agents/with-writer-lock.sh --agent-write-session -- ${rendered}
Escalation/stop condition: if this command truly must mutate the shared checkout while it runs, stop and ask the operator to define the serialized write window explicitly; after one blocked retry, stop local retries and escalate.
EOF
  exit 1
}

wait_for_lock="1"
timeout_sec="${BASESHOP_WRITER_LOCK_TIMEOUT_SEC:-}"
poll_sec="${BASESHOP_WRITER_LOCK_POLL_SEC:-30}"
command_mode="0"
agent_write_session="0"
interactive_shell="0"

if [[ -z "$timeout_sec" ]]; then
  # Agents (non-interactive) should not wait indefinitely.
  if [[ ! -t 0 ]]; then
    timeout_sec="300"
  else
    timeout_sec="0"
  fi
fi

while [[ $# -gt 0 ]]; do
  case "$1" in
    --timeout)
      timeout_sec="${2:-}"
      if [[ -z "$timeout_sec" ]]; then
        echo "ERROR: --timeout requires a value in seconds." >&2
        exit 2
      fi
      shift 2
      ;;
    --poll)
      poll_sec="${2:-}"
      if [[ -z "$poll_sec" ]]; then
        echo "ERROR: --poll requires a value in seconds." >&2
        exit 2
      fi
      shift 2
      ;;
    --no-wait)
      wait_for_lock="0"
      shift
      ;;
    --interactive-shell)
      interactive_shell="1"
      shift
      ;;
    --agent-write-session)
      agent_write_session="1"
      shift
      ;;
    --wait)
      wait_for_lock="1"
      shift
      ;;
    --wait-forever)
      wait_for_lock="1"
      timeout_sec="0"
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

if ! [[ "$timeout_sec" =~ ^[0-9]+$ ]]; then
  echo "ERROR: --timeout must be an integer number of seconds (0 or greater)." >&2
  exit 2
fi
if ! [[ "$poll_sec" =~ ^[0-9]+$ ]]; then
  echo "ERROR: --poll must be an integer number of seconds (0 or greater)." >&2
  exit 2
fi

if [[ "$command_mode" == "1" ]]; then
  if detect_interactive_shell "$@" >/dev/null; then
    block_command_mode_interactive_shell
  fi
  if detect_long_lived_non_write_command "$@" >/dev/null; then
    block_long_lived_non_write_command "$@"
  fi
fi

if [[ "$command_mode" == "1" && "$agent_write_session" != "1" ]]; then
  if agent_name="$(detect_long_lived_agent_cli "$@")"; then
    block_implicit_agent_write_session "$agent_name"
  fi
fi

# Non-interactive agents must not wait forever, and must poll (check) periodically.
if [[ ! -t 0 ]]; then
  poll_sec="30"
  if [[ "$wait_for_lock" == "1" ]]; then
    timeout_sec="300"
  fi
fi

acquire_args=(acquire --timeout "$timeout_sec" --poll "$poll_sec")
if [[ "$wait_for_lock" == "1" ]]; then
  acquire_args+=(--wait)
fi

if ! "$lock_script" "${acquire_args[@]}"; then
  if [[ "$wait_for_lock" == "1" && "$timeout_sec" != "0" ]]; then
    echo "Hint: for read-only work, use: scripts/agents/integrator-shell.sh --read-only -- <command>" >&2
    echo "Hint: to wait indefinitely, add: --wait-forever (or --timeout 0)" >&2
  fi
  exit 1
fi

common_dir="$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null || true)"
lock_meta="${common_dir}/base-shop-writer-lock/meta"
token="$(grep -E '^token=' "$lock_meta" | sed 's/^token=//' | head -n 1)"

if [[ -z "$token" ]]; then
  echo "ERROR: lock acquired but token missing; refusing to continue." >&2
  exit 1
fi

export BASESHOP_WRITER_LOCK_TOKEN="$token"

release_lock() {
  "$lock_script" release || true
}

trap release_lock EXIT INT TERM

if [[ "$command_mode" == "0" ]]; then
  if [[ ! -t 0 ]]; then
    echo "ERROR: stdin is not a terminal; cannot open an interactive locked subshell." >&2
    echo "Run in command mode instead:" >&2
    echo "  scripts/agents/with-writer-lock.sh -- <command> [args...]" >&2
    exit 2
  fi
  if [[ "$interactive_shell" != "1" ]]; then
    block_implicit_interactive_shell
  fi
  echo "Writer lock held for this shell. Exit to release." >&2
  exec bash
fi

if [[ $# -eq 0 ]]; then
  usage >&2
  exit 2
fi

"$@"
