#!/usr/bin/env bash
set -euo pipefail

# Block commits that reuse an existing commit message source (commonly used by `--amend`, `-c`, `-C`).
# This reduces “rewrite then force-push” workflows that have caused rollbacks in the past.
#
# Git passes: <commit-msg-file> [<source>] [<sha>]
#
# Bypass (humans only, emergency): ALLOW_COMMIT_MSG_REUSE=1 git commit ...

if [[ "${ALLOW_COMMIT_MSG_REUSE:-}" == "1" ]]; then
  exit 0
fi

source="${2:-}"

if [[ "$source" != "commit" ]]; then
  exit 0
fi

echo "------------------------------------------------------------------" >&2
echo "COMMIT BLOCKED: commit message reuse / amend-style workflow disabled" >&2
echo "------------------------------------------------------------------" >&2
echo "" >&2
echo "This repo avoids history-rewriting workflows (amend/rebase/force-push), especially for agent work." >&2
echo "" >&2
echo "Write a new commit message and keep history additive; use the PR pipeline (MERGE) instead of rewriting commits." >&2
echo "" >&2
echo "If you believe you must proceed (human only):" >&2
echo "  ALLOW_COMMIT_MSG_REUSE=1 git commit ..." >&2
echo "" >&2
echo "Reference: docs/git-safety.md" >&2
echo "" >&2
exit 1
