#!/usr/bin/env bash
# Source of truth: docs/git-safety.md § Command Policy Matrix (Deny table)
# When updating patterns, update the matrix first, then this script.

set -euo pipefail

# Read JSON from stdin
input=$(cat)

# Exit 0 (allow) if stdin is empty or malformed
if [[ -z "$input" ]]; then
  exit 0
fi

# Parse JSON using jq if available, fallback to node
if command -v jq &>/dev/null; then
  tool_name=$(echo "$input" | jq -r '.tool_name // empty' 2>/dev/null || echo "")
  command_str=$(echo "$input" | jq -r '.tool_input.command // empty' 2>/dev/null || echo "")
else
  # Fallback to node
  eval "$(echo "$input" | node -e "
    try {
      const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
      console.log('tool_name=' + JSON.stringify(d.tool_name || ''));
      console.log('command_str=' + JSON.stringify((d.tool_input||{}).command || ''));
    } catch(e) {
      console.log('tool_name=\"\"');
      console.log('command_str=\"\"');
    }
  " 2>/dev/null || echo 'tool_name=""; command_str=""')"
fi

# Fast path: if not Bash tool, allow immediately
if [[ "$tool_name" != "Bash" ]]; then
  exit 0
fi

# Exit 0 if command is empty
if [[ -z "$command_str" ]]; then
  exit 0
fi

# Normalize command: strip leading env var assignments
# Handle patterns like: VAR=value VAR2=value command args
normalized="$command_str"
while [[ "$normalized" =~ ^[A-Z_][A-Z0-9_]*= ]]; do
  normalized=$(echo "$normalized" | sed -E 's/^[A-Z_][A-Z0-9_]*=[^[:space:]]+ *//')
done

# Extract git command, handling absolute paths
# Match: git, /usr/bin/git, /opt/homebrew/bin/git, etc.
if [[ ! "$normalized" =~ (^|[[:space:]])(/[^[:space:]]*/)?git([[:space:]]|$) ]]; then
  # Not a git command, allow
  exit 0
fi

# ============================================================================
# DENY PATTERNS (evaluate before allow patterns)
# ============================================================================

# SKIP_* bypass env vars should never be used in agent flows.
if [[ "$command_str" =~ (^|[[:space:]])SKIP_(WRITER_LOCK|SIMPLE_GIT_HOOKS)= ]]; then
  echo "BLOCKED: SKIP_* bypass flags are forbidden for agent workflows. Fix lock/hook state instead." >&2
  exit 2
fi

# git reset --hard/--merge/--keep
if [[ "$normalized" =~ git[[:space:]]+reset[[:space:]]+(--(hard|merge|keep)|.*[[:space:]]--(hard|merge|keep)) ]]; then
  echo "BLOCKED: git reset --hard/--merge/--keep destroys working tree content. Use a checkpoint commit instead." >&2
  exit 2
fi

# git clean -f (any variant with -f flag, but not dry-run)
if [[ "$normalized" =~ git[[:space:]]+clean[[:space:]].*-[a-z]*f ]] && \
   [[ ! "$normalized" =~ (--dry-run|-n) ]]; then
  echo "BLOCKED: git clean -f removes untracked files. Use --dry-run first or commit your changes." >&2
  exit 2
fi

# git checkout -f / --force
if [[ "$normalized" =~ git[[:space:]]+checkout[[:space:]]+(-f|--force) ]]; then
  echo "BLOCKED: git checkout -f/--force discards uncommitted changes. Use a checkpoint commit instead." >&2
  exit 2
fi

# git checkout -- . or -- <dir>/ or -- <glob-with-*>
if [[ "$normalized" =~ git[[:space:]]+checkout[[:space:]]+--[[:space:]]+(\.|\*|.*/) ]]; then
  echo "BLOCKED: git checkout -- . (or broad pathspecs) discards uncommitted changes. Use a checkpoint commit instead." >&2
  exit 2
fi

# git restore . or <dir>/ or -- <glob-with-*>
if [[ "$normalized" =~ git[[:space:]]+restore[[:space:]]+(\.|\*|.*/|--[[:space:]]+(\.|\*)) ]]; then
  echo "BLOCKED: git restore . (or broad pathspecs) discards uncommitted changes. Use a checkpoint commit instead." >&2
  exit 2
fi

# git restore --worktree with broad pathspecs
if [[ "$normalized" =~ git[[:space:]]+restore[[:space:]]+.*--worktree ]]; then
  echo "BLOCKED: git restore --worktree discards working tree changes. Use a checkpoint commit instead." >&2
  exit 2
fi

# git switch --discard-changes or -f
if [[ "$normalized" =~ git[[:space:]]+switch[[:space:]]+.*(-f|--discard-changes|--force) ]]; then
  echo "BLOCKED: git switch -f/--discard-changes discards uncommitted changes. Use a checkpoint commit instead." >&2
  exit 2
fi

# git push --force / -f / --force-with-lease / --mirror
if [[ "$normalized" =~ git[[:space:]]+push[[:space:]]+.*(-f[[:space:]]|--force([[:space:]]|$)|--force-with-lease|--mirror) ]]; then
  echo "BLOCKED: git push --force/--force-with-lease/--mirror can overwrite remote history. Coordinate with team first." >&2
  exit 2
fi

# git commit/push --no-verify (-n) bypass
if [[ "$normalized" =~ git[[:space:]]+commit[[:space:]]+.*([[:space:]])(--no-verify|-n)($|[[:space:]]) ]]; then
  echo "BLOCKED: git commit --no-verify/-n bypasses safety hooks." >&2
  exit 2
fi

if [[ "$normalized" =~ git[[:space:]]+push[[:space:]]+.*([[:space:]])(--no-verify|-n)($|[[:space:]]) ]]; then
  echo "BLOCKED: git push --no-verify/-n bypasses safety hooks." >&2
  exit 2
fi

# git rebase (all variants)
if [[ "$normalized" =~ git[[:space:]]+rebase ]]; then
  echo "BLOCKED: git rebase rewrites history and can cause data loss. Use merge or coordinate with team." >&2
  exit 2
fi

# git commit --amend
if [[ "$normalized" =~ git[[:space:]]+commit[[:space:]]+.*--amend ]]; then
  echo "BLOCKED: git commit --amend rewrites history. Create a new commit instead (especially after hook failures)." >&2
  exit 2
fi

# git stash drop / clear
if [[ "$normalized" =~ git[[:space:]]+stash[[:space:]]+(drop|clear) ]]; then
  echo "BLOCKED: git stash drop/clear permanently removes stashed changes. Use git stash list to review first." >&2
  exit 2
fi

# git worktree (all operations)
if [[ "$normalized" =~ git[[:space:]]+worktree ]]; then
  echo "BLOCKED: git worktree operations can cause repository state issues. Use branches instead." >&2
  exit 2
fi

# git -c core.hooksPath=... (hook bypass)
if [[ "$normalized" =~ git[[:space:]]+-c[[:space:]]+core\.hooksPath ]]; then
  echo "BLOCKED: git -c core.hooksPath bypasses safety hooks. Remove this flag." >&2
  exit 2
fi

# git config core.hooksPath
if [[ "$normalized" =~ git[[:space:]]+config[[:space:]]+.*core\.hooksPath ]]; then
  echo "BLOCKED: git config core.hooksPath bypasses safety hooks. Do not modify hook configuration." >&2
  exit 2
fi

# ============================================================================
# ALLOW PATTERNS
# ============================================================================

# Dry-run clean operations
if [[ "$normalized" =~ git[[:space:]]+clean[[:space:]].*(--dry-run|-n) ]] && [[ ! "$normalized" =~ -[a-z]*f ]]; then
  exit 0
fi

# Safe reset (unstage only, no mode flags like --hard/--merge/--keep)
if [[ "$normalized" =~ git[[:space:]]+reset[[:space:]]+HEAD[[:space:]]+[^-] ]] && \
   [[ ! "$normalized" =~ --(hard|merge|keep|mixed|soft) ]]; then
  exit 0
fi

# Safe restore (--staged only, unstage)
if [[ "$normalized" =~ git[[:space:]]+restore[[:space:]]+--staged ]] && \
   [[ ! "$normalized" =~ --worktree ]]; then
  exit 0
fi

# Safe stash operations
if [[ "$normalized" =~ git[[:space:]]+stash[[:space:]]+(list|show|push) ]]; then
  exit 0
fi

# Read-only operations
if [[ "$normalized" =~ git[[:space:]]+(status|log|diff|show|branch|remote|fetch|describe|tag|ls-files|ls-remote|rev-parse|symbolic-ref) ]]; then
  exit 0
fi

# Safe write operations
if [[ "$normalized" =~ git[[:space:]]+(add|commit[[:space:]]+-m|push[[:space:]]+[^-]|pull[[:space:]]+--ff-only) ]]; then
  exit 0
fi

# If we got here, allow by default.
exit 0
