#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$repo_root"

usage() {
  cat <<'EOF'
Usage:
  scripts/run-ideas-go-faster.sh [ideas-go-faster args...]
  scripts/run-ideas-go-faster.sh --preflight-only [ideas-go-faster args...]

Examples:
  IDEAS_GO_FASTER_AGENT_CLI=codex scripts/run-ideas-go-faster.sh --dry-run --stance=improve-data
  scripts/run-ideas-go-faster.sh --dry-run --stance=improve-data
  scripts/run-ideas-go-faster.sh --dry-run --allow-api-degraded --stance=improve-data
  scripts/run-ideas-go-faster.sh --preflight-only --dry-run --stance=improve-data
  scripts/run-ideas-go-faster.sh --stance=grow-business

Notes:
  - Loads BOS Agent API env from .env.local.
  - Performs deterministic API preflight check before invoking the agent.
  - Runs agent CLI through scripts/agents/integrator-shell.sh --read-only (git guard, no outer writer lock).
  - Runner CLI is auto-selected: codex first, then claude (but if already inside Codex, auto picks claude to avoid nested-codex recursion).
  - Override with IDEAS_GO_FASTER_AGENT_CLI=codex|claude.
  - --allow-api-degraded is valid only with --dry-run.
EOF
}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  usage
  exit 0
fi

if [[ "${IDEAS_GO_FASTER_RUNNER_ACTIVE:-0}" == "1" ]]; then
  echo "ERROR: recursive runner invocation detected (IDEAS_GO_FASTER_RUNNER_ACTIVE=1)." >&2
  echo "DETAIL: run '/ideas-go-faster ...' directly in the current agent session; do not call scripts/run-ideas-go-faster.sh again from within the sweep." >&2
  exit 2
fi

if [[ ! -f ".env.local" ]]; then
  echo "ERROR: .env.local not found in repo root." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env.local
set +a

: "${BOS_AGENT_API_BASE_URL:?ERROR: BOS_AGENT_API_BASE_URL not set (expected from .env.local)}"
: "${BOS_AGENT_API_KEY:?ERROR: BOS_AGENT_API_KEY not set (expected from .env.local)}"

agent_cli="${IDEAS_GO_FASTER_AGENT_CLI:-auto}"
dry_run=0
allow_api_degraded=0
preflight_only=0
stance="improve-data"
skill_args=()

for arg in "$@"; do
  if [[ "$arg" == "--preflight-only" ]]; then
    preflight_only=1
    continue
  fi
  if [[ "$arg" == "--dry-run" ]]; then
    dry_run=1
  fi
  if [[ "$arg" == "--allow-api-degraded" ]]; then
    allow_api_degraded=1
  fi
  skill_args+=("$arg")
done

for ((i = 0; i < ${#skill_args[@]}; i++)); do
  case "${skill_args[$i]}" in
    --stance=*)
      stance="${skill_args[$i]#--stance=}"
      ;;
    --stance)
      if (( i + 1 < ${#skill_args[@]} )); then
        stance="${skill_args[$((i + 1))]}"
      fi
      ;;
  esac
done

if (( allow_api_degraded == 1 && dry_run == 0 )); then
  echo "ERROR: --allow-api-degraded is only valid with --dry-run." >&2
  exit 1
fi

resolve_agent_cli() {
  local selected="${1:-auto}"
  if [[ "$selected" == "auto" ]]; then
    # Avoid nested codex sessions when this runner is launched from within codex itself.
    if [[ -n "${CODEX_THREAD_ID:-}" || -n "${CODEX_CI:-}" ]]; then
      if command -v claude >/dev/null 2>&1; then
        echo "claude"
        return 0
      fi
    fi

    if command -v codex >/dev/null 2>&1; then
      echo "codex"
      return 0
    fi
    if command -v claude >/dev/null 2>&1; then
      echo "claude"
      return 0
    fi
    echo "ERROR: Neither 'codex' nor 'claude' CLI is available on PATH." >&2
    return 1
  fi

  if [[ "$selected" != "codex" && "$selected" != "claude" ]]; then
    echo "ERROR: IDEAS_GO_FASTER_AGENT_CLI must be one of: auto, codex, claude." >&2
    return 1
  fi

  if ! command -v "$selected" >/dev/null 2>&1; then
    echo "ERROR: Requested runner '$selected' not found on PATH." >&2
    return 1
  fi

  echo "$selected"
}

preflight_url="${BOS_AGENT_API_BASE_URL%/}/api/agent/businesses"
preflight_body="$(mktemp)"
http_code="$(curl -sS --connect-timeout 8 --max-time 20 -o "$preflight_body" -w '%{http_code}' -H "X-Agent-API-Key: ${BOS_AGENT_API_KEY}" "$preflight_url" || true)"

if [[ "$http_code" != 2* ]]; then
  if (( dry_run == 1 && allow_api_degraded == 1 )); then
    echo "WARN: API preflight returned HTTP ${http_code:-unknown} at ${preflight_url}; continuing in degraded-filesystem-only dry-run mode." >&2
  else
    echo "ERROR: API preflight failed (HTTP ${http_code:-unknown}) at ${preflight_url}." >&2
    echo "DETAIL: use --dry-run --allow-api-degraded to proceed without API preflight in dry-run mode." >&2
    rm -f "$preflight_body"
    exit 1
  fi
fi
rm -f "$preflight_body"

resolved_agent_cli="$(resolve_agent_cli "$agent_cli")"
echo "INFO: ideas-go-faster runner CLI: ${resolved_agent_cli}" >&2

if (( preflight_only == 1 )); then
  echo "INFO: preflight-only mode complete (no agent execution)." >&2
  exit 0
fi

run_date="$(date +%F)"
prompt="/ideas-go-faster"
if [[ "${#skill_args[@]}" -gt 0 ]]; then
  prompt+=" ${skill_args[*]}"
fi

if (( allow_api_degraded == 1 )); then
  prompt+=$'\nExecution rule: --allow-api-degraded is set. If Agent API preflight fails, continue in degraded-filesystem-only mode, record API-Preflight-Mode accordingly, and complete the dry-run without follow-up questions.'
fi
prompt+=$'\nRunner note: API preflight was already executed by scripts/run-ideas-go-faster.sh. Execute the ideas-go-faster skill directly in this session. Do NOT invoke scripts/run-ideas-go-faster.sh from within this run.'
prompt+=$'\nExecution contract (mandatory): initialize/refresh docs/business-os/sweeps/'"${run_date}"'-progress.user.md immediately with Current-Stage=preflight and Last-Updated-UTC before long analysis; continue heartbeat updates <=90s during long stages.'

progress_poll_sec="${IDEAS_GO_FASTER_PROGRESS_POLL_SEC:-15}"
progress_start_timeout_sec="${IDEAS_GO_FASTER_PROGRESS_START_TIMEOUT_SEC:-240}"
progress_stale_timeout_sec="${IDEAS_GO_FASTER_PROGRESS_STALE_TIMEOUT_SEC:-120}"
progress_file="docs/business-os/sweeps/${run_date}-progress.user.md"

if ! [[ "$progress_poll_sec" =~ ^[0-9]+$ ]] || (( progress_poll_sec <= 0 )); then
  echo "ERROR: IDEAS_GO_FASTER_PROGRESS_POLL_SEC must be a positive integer." >&2
  exit 2
fi
if ! [[ "$progress_start_timeout_sec" =~ ^[0-9]+$ ]] || (( progress_start_timeout_sec <= 0 )); then
  echo "ERROR: IDEAS_GO_FASTER_PROGRESS_START_TIMEOUT_SEC must be a positive integer." >&2
  exit 2
fi
if ! [[ "$progress_stale_timeout_sec" =~ ^[0-9]+$ ]] || (( progress_stale_timeout_sec <= 0 )); then
  echo "ERROR: IDEAS_GO_FASTER_PROGRESS_STALE_TIMEOUT_SEC must be a positive integer." >&2
  exit 2
fi

timestamp_to_epoch() {
  local ts="$1"
  local epoch=""

  epoch="$(date -j -u -f "%Y-%m-%dT%H:%M:%SZ" "$ts" "+%s" 2>/dev/null || true)"
  if [[ -n "$epoch" ]]; then
    echo "$epoch"
    return 0
  fi

  epoch="$(date -u -d "$ts" "+%s" 2>/dev/null || true)"
  if [[ -n "$epoch" ]]; then
    echo "$epoch"
    return 0
  fi

  return 1
}

file_mtime_epoch() {
  local path="$1"
  stat -f %m "$path" 2>/dev/null || stat -c %Y "$path" 2>/dev/null
}

terminate_process_tree() {
  local pid="$1"
  local child_pid
  while IFS= read -r child_pid; do
    [[ -z "$child_pid" ]] && continue
    terminate_process_tree "$child_pid"
  done < <(pgrep -P "$pid" 2>/dev/null || true)

  kill "$pid" 2>/dev/null || true
}

initialize_progress_artifact() {
  local now_utc
  now_utc="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  local persistence_mode
  persistence_mode="live"
  if (( dry_run == 1 )); then
    persistence_mode="dry-run"
  fi

  mkdir -p "$(dirname "$progress_file")"
  cat >"$progress_file" <<EOF
---
Type: Sweep-Progress
Date: ${run_date}
Run-Status: running
Persistence-Mode: ${persistence_mode}
Stance: ${stance}
Current-Stage: preflight
Last-Updated-UTC: ${now_utc}
Progress-Events: 1
Final-Report-Path: pending
---

## Progress Events

| # | Stage | State | Timestamp | Detail |
|---|---|---|---|---|
| 1 | preflight | started | ${now_utc} | Runner initialized progress artifact and launched ideas-go-faster. |
EOF
}

monitor_progress() {
  local child_pid="$1"
  local started_at="$2"
  local baseline_mtime="$3"
  local saw_progress="0"
  local saw_active_stage="0"

  while kill -0 "$child_pid" 2>/dev/null; do
    local now
    now="$(date +%s)"

    if [[ -f "$progress_file" ]]; then
      local file_mtime
      file_mtime="$(file_mtime_epoch "$progress_file" || true)"
      if [[ -n "$file_mtime" ]] && (( file_mtime > baseline_mtime )); then
        saw_progress="1"
      fi

      if [[ "$saw_progress" == "1" ]]; then
        if rg -q '^Current-Stage: (preflight|stage-[0-9]+(\.[0-9]+)?|complete)$' "$progress_file"; then
          saw_active_stage="1"
        fi

        local last_updated
        last_updated="$(sed -n 's/^Last-Updated-UTC:[[:space:]]*//p' "$progress_file" | head -n 1)"
        local last_epoch
        last_epoch=""
        if [[ -n "$last_updated" ]]; then
          last_epoch="$(timestamp_to_epoch "$last_updated" || true)"
        fi
        if [[ -z "$last_epoch" || -z "$file_mtime" || "$last_epoch" -gt $((now + 60)) || "$last_epoch" -lt $((started_at - 300)) ]]; then
          last_epoch="$file_mtime"
        fi

        if [[ -n "$last_epoch" && "$saw_active_stage" == "1" ]]; then
          local age
          age=$((now - last_epoch))
          if (( age < 0 )); then
            age=0
          fi
          if (( age > progress_stale_timeout_sec )); then
            echo "ERROR: progress heartbeat stalled for ${age}s (> ${progress_stale_timeout_sec}s)." >&2
            echo "DETAIL: progress artifact ${progress_file} is stale; terminating runner." >&2
            terminate_process_tree "$child_pid"
            wait "$child_pid" 2>/dev/null || true
            return 124
          fi
        fi
      fi
    fi

    if [[ "$saw_progress" == "0" && $((now - started_at)) -gt "$progress_start_timeout_sec" ]]; then
      echo "ERROR: progress artifact was not updated within ${progress_start_timeout_sec}s after runner start." >&2
      echo "DETAIL: expected path ${progress_file}." >&2
      terminate_process_tree "$child_pid"
      wait "$child_pid" 2>/dev/null || true
      return 125
    fi

    sleep "$progress_poll_sec"
  done

  if [[ "$saw_progress" == "0" ]]; then
    echo "WARN: runner exited before progress artifact was observed at ${progress_file}." >&2
  fi

  return 0
}

runner_cmd=(scripts/agents/integrator-shell.sh --read-only --)
if [[ "$resolved_agent_cli" == "claude" ]]; then
  max_turns="${CLAUDE_MAX_TURNS:-80}"
  runner_cmd+=(
    claude -p
    --permission-mode bypassPermissions
    --output-format text
    --max-turns "$max_turns"
    "$prompt"
  )
else
  runner_cmd+=(
    codex exec
    --sandbox danger-full-access
    --dangerously-bypass-approvals-and-sandbox
    -C "$repo_root"
    "$prompt"
  )
fi

initialize_progress_artifact

IDEAS_GO_FASTER_RUNNER_ACTIVE=1 "${runner_cmd[@]}" &
runner_pid="$!"

monitor_started_at="$(date +%s)"
progress_baseline_epoch="$(file_mtime_epoch "$progress_file" 2>/dev/null || echo 0)"

monitor_rc=0
monitor_progress "$runner_pid" "$monitor_started_at" "$progress_baseline_epoch" || monitor_rc="$?"

runner_rc=0
wait "$runner_pid" || runner_rc="$?"

if (( monitor_rc != 0 )); then
  exit "$monitor_rc"
fi
exit "$runner_rc"
