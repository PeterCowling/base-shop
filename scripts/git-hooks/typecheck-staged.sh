#!/usr/bin/env bash
set -euo pipefail

# Typecheck only the workspace packages that have staged changes.
# Replaces the monorepo-wide `pnpm typecheck` in pre-commit hooks.
#
# How it works:
#   1. List staged files (added/changed/modified/renamed)
#   2. Map each file to its workspace package (apps/* or packages/*)
#   3. Deduplicate
#   4. Run `turbo run typecheck --filter=<pkg>` for each affected package
#
# Falls back to full typecheck if root-level TS files are staged.

if [[ "${SKIP_TYPECHECK:-}" == "1" ]]; then
  echo "[typecheck-staged] SKIP_TYPECHECK=1; skipping."
  exit 0
fi

# Get staged files (exclude deletions)
staged_files="$(git diff --cached --name-only --diff-filter=ACMRTUXB)"

if [[ -z "$staged_files" ]]; then
  echo "[typecheck-staged] No staged files; skipping."
  exit 0
fi

# Extract unique workspace directories (apps/X or packages/X)
workspace_dirs="$(echo "$staged_files" \
  | grep -E '^(apps|packages)/' \
  | awk -F/ '{print $1"/"$2}' \
  | sort -u)"

# Check for root-level TS files that would need the root tsc -b
root_ts_files="$(echo "$staged_files" | grep -E '^\w+\.tsx?$' || true)"

if [[ -n "$root_ts_files" && -z "$workspace_dirs" ]]; then
  echo "[typecheck-staged] Root-level TS files staged; running full typecheck."
  pnpm typecheck
  exit $?
fi

if [[ -z "$workspace_dirs" ]]; then
  echo "[typecheck-staged] No workspace packages affected; skipping."
  exit 0
fi

# Build turbo --filter flags from workspace directories
filters=()
for dir in $workspace_dirs; do
  if [[ -f "$dir/package.json" ]]; then
    # Read the package name from package.json
    pkg_name="$(node -e "console.log(require('./$dir/package.json').name)" 2>/dev/null || true)"
    if [[ -n "$pkg_name" ]]; then
      filters+=("--filter=$pkg_name")
    fi
  fi
done

if [[ ${#filters[@]} -eq 0 ]]; then
  echo "[typecheck-staged] No packages with package.json found; skipping."
  exit 0
fi

echo "[typecheck-staged] Typechecking ${#filters[@]} affected package(s): ${filters[*]}"

# turbo run typecheck will also build upstream deps (dependsOn: [^build])
pnpm exec turbo run typecheck "${filters[@]}"
