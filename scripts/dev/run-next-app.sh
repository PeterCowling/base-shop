#!/usr/bin/env bash
set -euo pipefail

MODE="dev"
PORT=""
APP_ROOT="$(pwd -P)"
CACHE_ROOT_OVERRIDE=""

usage() {
  cat >&2 <<'EOF'
Usage:
  run-next-app.sh --port <port> [--mode dev|typegen|typecheck] [--app-root <path>] [--cache-root <path>] [-- <command-or-next-args...>]

Examples:
  run-next-app.sh --port 3022 -- --webpack
  run-next-app.sh --mode typecheck --port 3022 -- pnpm exec tsc -p tsconfig.json --noEmit
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode)
      MODE="${2:-}"
      shift 2
      ;;
    --port)
      PORT="${2:-}"
      shift 2
      ;;
    --app-root)
      APP_ROOT="${2:-}"
      shift 2
      ;;
    --cache-root)
      CACHE_ROOT_OVERRIDE="${2:-}"
      shift 2
      ;;
    --)
      shift
      break
      ;;
    *)
      usage
      exit 64
      ;;
  esac
done

if [[ -z "${PORT}" ]]; then
  echo "run-next-app.sh requires --port" >&2
  usage
  exit 64
fi

APP_ROOT="$(cd "${APP_ROOT}" && pwd -P)"
APP_NAME="$(basename "${APP_ROOT}")"
PORT_KEY="${PORT//[^0-9A-Za-z._-]/-}"
REPO_ROOT="$(git -C "${APP_ROOT}" rev-parse --show-toplevel)"

DEFAULT_CACHE_ROOT="${REPO_ROOT}/node_modules/.cache/base-shop-next/${APP_NAME}/ports/${PORT_KEY}"
CACHE_ROOT="${BASESHOP_NEXT_RUNTIME_CACHE_ROOT:-${CACHE_ROOT_OVERRIDE:-${DEFAULT_CACHE_ROOT}}}"
LINK_PATH="${APP_ROOT}/.next"

ensure_symlink() {
  local link_path="$1"
  local target_path="$2"

  if [[ -L "${link_path}" ]]; then
    local current_target
    current_target="$(readlink "${link_path}")"
    if [[ "${current_target}" == "${target_path}" ]]; then
      return
    fi
    rm -f "${link_path}"
  elif [[ -e "${link_path}" ]]; then
    rm -rf "${link_path}"
  fi

  ln -s "${target_path}" "${link_path}"
}

cache_has_content() {
  find "$1" -mindepth 1 -maxdepth 1 -print -quit 2>/dev/null | grep -q .
}

mkdir -p "${CACHE_ROOT}"

if [[ -d "${LINK_PATH}" && ! -L "${LINK_PATH}" ]] && ! cache_has_content "${CACHE_ROOT}"; then
  cp -R "${LINK_PATH}/." "${CACHE_ROOT}/"
fi

ensure_symlink "${LINK_PATH}" "${CACHE_ROOT}"

echo "${APP_NAME} dev runtime cache: ${CACHE_ROOT}" >&2

cd "${APP_ROOT}"

case "${MODE}" in
  dev)
    exec pnpm exec next dev -p "${PORT}" "$@"
    ;;
  typegen)
    exec pnpm exec next typegen "$@"
    ;;
  typecheck)
    pnpm exec next typegen
    if [[ $# -gt 0 ]]; then
      exec "$@"
    fi
    exec pnpm exec tsc -p tsconfig.json --noEmit
    ;;
  *)
    echo "run-next-app.sh invalid --mode: ${MODE}" >&2
    usage
    exit 64
    ;;
esac
