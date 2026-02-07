#!/usr/bin/env bash
set -euo pipefail

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

echo "http://127.0.0.1:${port}/mcp"
