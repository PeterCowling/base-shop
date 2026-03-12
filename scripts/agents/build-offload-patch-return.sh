#!/usr/bin/env bash
# build-offload-patch-return.sh — Patch-return Codex offload helper
#
# Assembles a task packet (prompt), runs Codex in an isolated home, and
# captures the returned unified-diff artifact to a caller-supplied path.
#
# Usage:
#   build-offload-patch-return.sh \
#     --prompt-file <path>   Path to pre-assembled self-contained prompt file
#     --patch-out   <path>   Destination path for the returned unified diff
#     [--tmproot    <path>]  Optional: override temp root (default: /tmp/codex-patch-return-<ts>)
#
# Exit codes:
#   0  Codex exited 0 and a non-empty patch artifact was written to --patch-out
#   1  Codex exited non-zero, or artifact is empty, or required args are missing
#
# Logs:
#   $TMPROOT/exec-stdout.txt   Codex stdout stream
#   $TMPROOT/exec-stderr.txt   Codex stderr stream
#
# Contract invariants (from build-offload-protocol.md § Patch-Return Pilot Contract):
#   - Isolated CODEX_HOME per run: auth.json + minimal config.toml only
#   - Never copies state_5.sqlite*, archived_sessions/, shell_snapshots/, or mcp_servers entries
#   - --sandbox read-only: shared checkout is never mutated during offload phase
#   - Verified model: gpt-5.4 (only confirmed working model for ChatGPT-account-backed runs)
#   - Prompt must be self-contained; caller is responsible for prompt design rules
#
# Reference: .claude/skills/_shared/build-offload-protocol.md

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$REPO_ROOT" ]]; then
  echo "ERROR: not inside a git repository" >&2
  exit 1
fi

usage() {
  sed -n '2,/^set -euo/p' "${BASH_SOURCE[0]}" | grep '^#' | sed 's/^# \?//'
  exit 1
}

# ── Argument parsing ──────────────────────────────────────────────────────────

PROMPT_FILE=""
PATCH_OUT=""
CUSTOM_TMPROOT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --prompt-file) PROMPT_FILE="$2"; shift 2 ;;
    --patch-out)   PATCH_OUT="$2";   shift 2 ;;
    --tmproot)     CUSTOM_TMPROOT="$2"; shift 2 ;;
    -h|--help)     usage ;;
    *) echo "ERROR: unknown argument: $1" >&2; usage ;;
  esac
done

if [[ -z "$PROMPT_FILE" || -z "$PATCH_OUT" ]]; then
  echo "ERROR: --prompt-file and --patch-out are required" >&2
  usage
fi

if [[ ! -f "$PROMPT_FILE" ]]; then
  echo "ERROR: prompt file not found: $PROMPT_FILE" >&2
  exit 1
fi

if [[ ! -s "$PROMPT_FILE" ]]; then
  echo "ERROR: prompt file is empty: $PROMPT_FILE" >&2
  exit 1
fi

# ── Temp workspace ────────────────────────────────────────────────────────────

TMPROOT="${CUSTOM_TMPROOT:-/tmp/codex-patch-return-$(date +%s)}"
ISOHOME="$TMPROOT/codex-home"
PACKET_REPO="$TMPROOT/packet-repo"

mkdir -p "$ISOHOME" "$PACKET_REPO"

echo "[build-offload-patch-return] tmproot: $TMPROOT"

# ── Isolated CODEX_HOME setup ─────────────────────────────────────────────────

CODEX_AUTH="$HOME/.codex/auth.json"
if [[ ! -f "$CODEX_AUTH" ]]; then
  echo "ERROR: ~/.codex/auth.json not found — Codex auth required" >&2
  exit 1
fi

cp "$CODEX_AUTH" "$ISOHOME/auth.json"

# Minimal config — verified model only. Do NOT add mcp_servers or copy state files.
cat > "$ISOHOME/config.toml" <<'TOML'
model = "gpt-5.4"
model_reasoning_effort = "high"
personality = "pragmatic"
TOML

# Verify no state contamination carried over
for forbidden in state_5.sqlite archived_sessions shell_snapshots; do
  if [[ -e "$ISOHOME/$forbidden" ]]; then
    echo "ERROR: forbidden state item found in isolated home: $forbidden" >&2
    exit 1
  fi
done

# ── Codex invocation ──────────────────────────────────────────────────────────

STDOUT_LOG="$TMPROOT/exec-stdout.txt"
STDERR_LOG="$TMPROOT/exec-stderr.txt"

echo "[build-offload-patch-return] invoking codex (sandbox: read-only, model: gpt-5.4)"

PILOT_EXIT=0
CODEX_HOME="$ISOHOME" nvm exec 22 -- codex exec \
  --sandbox read-only \
  -C "$PACKET_REPO" \
  -o "$PATCH_OUT" \
  "$(cat "$PROMPT_FILE")" \
  > "$STDOUT_LOG" \
  2> "$STDERR_LOG" || PILOT_EXIT=$?

echo "[build-offload-patch-return] codex exit: $PILOT_EXIT"
echo "[build-offload-patch-return] stderr log: $STDERR_LOG"

if [[ $PILOT_EXIT -ne 0 ]]; then
  echo "ERROR: codex exec exited $PILOT_EXIT — see $STDERR_LOG" >&2
  cat "$STDERR_LOG" >&2
  exit 1
fi

# ── Artifact validation ───────────────────────────────────────────────────────

if [[ ! -s "$PATCH_OUT" ]]; then
  echo "ERROR: patch artifact is empty or missing at: $PATCH_OUT" >&2
  echo "  stdout: $STDOUT_LOG" >&2
  echo "  stderr: $STDERR_LOG" >&2
  exit 1
fi

ARTIFACT_BYTES="$(wc -c < "$PATCH_OUT" | tr -d ' ')"
echo "[build-offload-patch-return] patch artifact written: $PATCH_OUT ($ARTIFACT_BYTES bytes)"

# ── Shared-checkout safety check ─────────────────────────────────────────────
# The shared checkout must be clean after the offload run.
# This is a safeguard — read-only sandbox should prevent mutations.

DIRTY="$(git -C "$REPO_ROOT" status --porcelain=v1 2>/dev/null | grep -v '^??' | head -1 || true)"
if [[ -n "$DIRTY" ]]; then
  echo "WARNING: shared checkout has unexpected modifications after offload run" >&2
  echo "  $DIRTY" >&2
  # Non-fatal: caller decides whether to abort. Apply window will use fingerprints.
fi

echo "[build-offload-patch-return] done — artifact ready at $PATCH_OUT"
exit 0
