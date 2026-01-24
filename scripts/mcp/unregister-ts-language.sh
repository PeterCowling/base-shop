#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/mcp/unregister-ts-language.sh [--claude|--codex|--both]

Unregisters the ts-language MCP server from local clients.

Examples:
  scripts/mcp/unregister-ts-language.sh --claude
  scripts/mcp/unregister-ts-language.sh --codex
  scripts/mcp/unregister-ts-language.sh --both
USAGE
}

mode=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --claude)
      mode="claude"
      shift
      ;;
    --codex)
      mode="codex"
      shift
      ;;
    --both)
      mode="both"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
  if [[ -n "$mode" && $# -gt 0 ]]; then
    if [[ "$mode" != "" && "$1" == --* ]]; then
      echo "Multiple mode flags provided. Use only one." >&2
      usage
      exit 1
    fi
  fi
done

if [[ -z "$mode" ]]; then
  echo "Missing mode flag." >&2
  usage
  exit 1
fi

if [[ "$mode" == "claude" || "$mode" == "both" ]]; then
  claude mcp remove ts-language
fi

if [[ "$mode" == "codex" || "$mode" == "both" ]]; then
  codex mcp remove ts-language
fi

printf 'Removed ts-language MCP registration (mode: %s)\n' "$mode"
