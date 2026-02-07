#!/usr/bin/env bash
set -euo pipefail

# Lint only the workspace packages that have staged changes.
# Replaces the monorepo-wide `pnpm lint` in pre-commit hooks.
#
# Same approach as typecheck-staged.sh — maps staged files to packages.

if [[ "${SKIP_LINT:-}" == "1" ]]; then
  echo "[lint-staged-packages] SKIP_LINT=1; skipping."
  exit 0
fi

# Get staged files (exclude deletions)
staged_files="$(git diff --cached --name-only --diff-filter=ACMRTUXB)"

if [[ -z "$staged_files" ]]; then
  echo "[lint-staged-packages] No staged files; skipping."
  exit 0
fi

# Extract unique workspace directories (apps/X or packages/X)
workspace_dirs="$(echo "$staged_files" \
  | grep -E '^(apps|packages)/' \
  | awk -F/ '{print $1"/"$2}' \
  | sort -u)"

if [[ -z "$workspace_dirs" ]]; then
  echo "[lint-staged-packages] No workspace packages affected; skipping."
  exit 0
fi

# Build turbo --filter flags from workspace directories
filters=()
for dir in $workspace_dirs; do
  if [[ -f "$dir/package.json" ]]; then
    pkg_name="$(node -e "console.log(require('./$dir/package.json').name)" 2>/dev/null || true)"
    if [[ -n "$pkg_name" ]]; then
      filters+=("--filter=$pkg_name")
    fi
  fi
done

if [[ ${#filters[@]} -eq 0 ]]; then
  echo "[lint-staged-packages] No packages with package.json found; skipping."
  exit 0
fi

echo "[lint-staged-packages] Linting ${#filters[@]} affected package(s): ${filters[*]}"

pnpm exec turbo run lint "${filters[@]}"
