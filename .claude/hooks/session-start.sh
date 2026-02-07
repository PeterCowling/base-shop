#!/usr/bin/env bash
# Ensures agent git guard is always active for Claude Code sessions.
# The guard enforces docs/git-safety.md § Command Policy Matrix at PATH level.

set -euo pipefail

# Derive repo root from script location (script is at .claude/hooks/session-start.sh)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Handle missing CLAUDE_ENV_FILE gracefully
if [[ -z "${CLAUDE_ENV_FILE:-}" ]]; then
  echo "Warning: CLAUDE_ENV_FILE not set, skipping PATH export" >&2
  git config --global pull.ff only
  exit 0
fi

# Prepend scripts/agent-bin to PATH
echo "export PATH=\"$REPO_ROOT/scripts/agent-bin:\$PATH\"" >> "$CLAUDE_ENV_FILE"

# Set git pull to fail on non-fast-forward
git config --global pull.ff only
