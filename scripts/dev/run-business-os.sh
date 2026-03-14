#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODE_ARGS=()

if [[ $# -gt 0 && "$1" != --* ]]; then
  MODE_ARGS=(--mode "$1")
  shift
fi

exec "${SCRIPT_DIR}/run-next-app.sh" "${MODE_ARGS[@]}" --app-root "${SCRIPT_DIR}/../../apps/business-os" --port "${BUSINESS_OS_PORT:-3022}" -- --webpack "$@"
