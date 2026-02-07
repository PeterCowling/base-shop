#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/mcp/register-ts-language.sh [--claude|--codex|--both]

Registers the VS Code MCP language server using the port in .vscode/.mcp-port.

Examples:
  scripts/mcp/register-ts-language.sh --claude
  scripts/mcp/register-ts-language.sh --codex
  scripts/mcp/register-ts-language.sh --both
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
    # Allow only one mode flag.
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

port_file=".vscode/.mcp-port"
if [[ ! -f "$port_file" ]]; then
  echo "Port file not found: $port_file" >&2
  echo "Open the repo in VS Code and ensure the MCP extension is running." >&2
  exit 1
fi

port=$(tr -d '[:space:]' < "$port_file")
if [[ -z "$port" ]]; then
  echo "Port file is empty: $port_file" >&2
  exit 1
fi

if ! [[ "$port" =~ ^[0-9]+$ ]]; then
  echo "Port file contains non-numeric value: $port" >&2
  exit 1
fi

url="http://127.0.0.1:${port}/mcp"

if [[ "$mode" == "claude" || "$mode" == "both" ]]; then
  claude mcp add --transport http ts-language "$url"
fi

if [[ "$mode" == "codex" || "$mode" == "both" ]]; then
  codex mcp add ts-language --url "$url"
fi

printf 'Registered ts-language MCP endpoint: %s\n' "$url"
