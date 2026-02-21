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

block_with_guidance() {
  local reason="$1"
  local only_cmd="${2:-scripts/agents/integrator-shell.sh -- git status}"

  echo "BLOCKED: ${reason}" >&2
  echo "" >&2
  echo "Only this path will work in this repo:" >&2
  echo "  ${only_cmd}" >&2
  echo "" >&2
  echo "Do not retry with (hard-blocked):" >&2
  echo "  --no-verify / -n" >&2
  echo "  SKIP_WRITER_LOCK=1 or SKIP_SIMPLE_GIT_HOOKS=1" >&2
  echo "  -c core.hooksPath=... or git config core.hooksPath ..." >&2
  echo "  --force / -f, --amend, rebase, stash pop/apply/drop/clear" >&2
  exit 2
}

# ============================================================================
# Shared evaluator (single semantics)
# ============================================================================

# Keep this explicit check even for compound commands: SKIP_* bypass flags should
# never be used in agent flows.
if [[ "$command_str" =~ (^|[[:space:]])SKIP_(WRITER_LOCK|SIMPLE_GIT_HOOKS)= ]]; then
  block_with_guidance \
    "SKIP_* bypass flags are forbidden for agent workflows. Fix lock/hook state instead." \
    "scripts/agents/integrator-shell.sh -- git status"
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
policy_json="${repo_root}/.agents/safety/generated/git-safety-policy.json"
evaluator="${repo_root}/scripts/agents/evaluate-git-safety.mjs"

if [[ ! -f "$policy_json" || ! -f "$evaluator" ]]; then
  block_with_guidance \
    "Missing git safety evaluator/policy artifacts (fail-closed). Regenerate and retry." \
    "scripts/agents/generate-git-safety-policy --write"
fi

set +e
eval_stderr="$(
  node "$evaluator" \
    --policy "$policy_json" \
    --mode hook \
    --command "$command_str" \
    2>&1 >/dev/null
)"
eval_status="$?"
set -e

if [[ "$eval_status" -eq 0 ]]; then
  exit 0
fi

rule_id="$(printf '%s\n' "$eval_stderr" | sed -nE 's/^Rule:[[:space:]]+//p' | head -n 1)"

case "$rule_id" in
  deny.reset_modes)
    block_with_guidance \
      "reset --hard/--merge/--keep" \
      "scripts/agents/integrator-shell.sh -- git reset HEAD <file>"
    ;;
  deny.clean_force)
    block_with_guidance \
      "clean" \
      "scripts/agents/integrator-shell.sh -- git clean --dry-run"
    ;;
  deny.force_push)
    if [[ "$normalized" =~ git[[:space:]]+push[[:space:]]+.*--mirror ]]; then
      block_with_guidance \
        "--mirror" \
        "scripts/agents/integrator-shell.sh -- git push origin <branch>"
    else
      block_with_guidance \
        "push --force" \
        "scripts/agents/integrator-shell.sh -- git push origin <branch>"
    fi
    ;;
  deny.push_no_verify)
    block_with_guidance \
      "push --no-verify" \
      "scripts/agents/integrator-shell.sh -- git push origin <branch>"
    ;;
  deny.commit_no_verify)
    block_with_guidance \
      "commit --no-verify" \
      "scripts/agents/integrator-shell.sh -- git commit -m \"<message>\""
    ;;
  deny.rebase)
    block_with_guidance \
      "rebase" \
      "scripts/agents/integrator-shell.sh -- git merge --no-ff <target-branch>"
    ;;
  deny.commit_amend)
    block_with_guidance \
      "commit --amend" \
      "scripts/agents/integrator-shell.sh -- git commit -m \"<message>\""
    ;;
  deny.worktree)
    block_with_guidance \
      "worktree" \
      "scripts/agents/integrator-shell.sh -- git switch -c <branch>"
    ;;
  deny.hooks_path_bypass|deny.config_set_hooks_path)
    block_with_guidance \
      "core.hooksPath" \
      "scripts/agents/integrator-shell.sh -- git config --get core.hooksPath"
    ;;
  deny.checkout_force)
    block_with_guidance \
      "checkout -f/--force" \
      "scripts/agents/integrator-shell.sh -- git status"
    ;;
  deny.restore_worktree)
    block_with_guidance \
      "restore --worktree" \
      "scripts/agents/integrator-shell.sh -- git restore --staged <file>"
    ;;
  deny.switch_discard)
    block_with_guidance \
      "switch -f/--discard-changes" \
      "scripts/agents/integrator-shell.sh -- git switch <branch>"
    ;;
  deny.stash_mutations)
    # The legacy tests look for either "stash mutations" or "bare git stash".
    if [[ "$normalized" =~ git[[:space:]]+stash([[:space:]]*($|[;&|])) ]]; then
      block_with_guidance \
        "bare git stash" \
        "scripts/agents/integrator-shell.sh -- git stash list"
    else
      block_with_guidance \
        "stash mutations" \
        "scripts/agents/integrator-shell.sh -- git stash list"
    fi
    ;;
  deny.checkout_restore_bulk_discards)
    # Maintain the legacy reason substrings used by tests.
    if [[ "$normalized" =~ git[[:space:]]+checkout ]]; then
      if [[ "$normalized" =~ git[[:space:]]+checkout[[:space:]]+--[[:space:]]+\. ]]; then
        block_with_guidance \
          "checkout -- ." \
          "scripts/agents/integrator-shell.sh -- git checkout -- <single-file>"
      else
        block_with_guidance \
          "checkout" \
          "scripts/agents/integrator-shell.sh -- git checkout -- <single-file>"
      fi
    else
      block_with_guidance \
        "restore ." \
        "scripts/agents/integrator-shell.sh -- git restore -- <single-file>"
    fi
    ;;
  *)
    block_with_guidance \
      "policy evaluator denied this command (${rule_id:-unknown})" \
      "scripts/agents/integrator-shell.sh -- git status"
    ;;
esac
