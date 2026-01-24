#!/usr/bin/env bash
set -euo pipefail

port_file=".vscode/.mcp-port"
if [[ ! -f "$port_file" ]]; then
  echo "Port file not found: $port_file" >&2
  exit 1
fi

port=$(tr -d '[:space:]' < "$port_file")
if [[ -z "$port" || ! "$port" =~ ^[0-9]+$ ]]; then
  echo "Invalid port in $port_file: $port" >&2
  exit 1
fi

url="http://127.0.0.1:${port}/mcp"
status=$(curl -s -o /dev/null -w "%{http_code}" "$url" || true)

case "$status" in
  400|404|405)
    echo "MCP endpoint reachable at $url (status $status)"
    exit 0
    ;;
  000)
    echo "No response from $url" >&2
    exit 1
    ;;
  *)
    echo "Unexpected status from $url: $status" >&2
    exit 1
    ;;
esac
