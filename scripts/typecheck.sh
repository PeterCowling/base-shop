#!/usr/bin/env bash
set -euo pipefail

# Make `pnpm typecheck` reliable in non-interactive runners (Codex/CI) where
# Turbo's TUI and large log volume can trigger EPIPE/broken-pipe failures.
#
# Interactive terminals keep the existing behavior.

force_interactive="${BASESHOP_TYPECHECK_FORCE_INTERACTIVE:-}"
force_noninteractive="${BASESHOP_TYPECHECK_FORCE_NONINTERACTIVE:-}"

is_tty="0"
if [[ -t 1 ]]; then
  is_tty="1"
fi

if [[ -n "$force_interactive" && -n "$force_noninteractive" ]]; then
  echo "ERROR: Both BASESHOP_TYPECHECK_FORCE_INTERACTIVE and BASESHOP_TYPECHECK_FORCE_NONINTERACTIVE are set." >&2
  exit 2
fi

if [[ -n "$force_interactive" ]]; then
  is_tty="1"
fi
if [[ -n "$force_noninteractive" ]]; then
  is_tty="0"
fi

if [[ "$is_tty" == "1" ]]; then
  tsc -b tsconfig.json --pretty
  turbo run typecheck
  exit 0
fi

# Non-interactive mode:
# - Disable pretty/color output to avoid ANSI control sequences in captured logs.
# - Force Turbo to stream UI + error-only logs to reduce output volume.
export NO_COLOR=1
export FORCE_COLOR=0

tsc -b tsconfig.json --pretty false
turbo run typecheck \
  --ui=stream \
  --output-logs=errors-only \
  --log-order=grouped \
  --no-update-notifier \
  --no-color

