#!/usr/bin/env bash
set -euo pipefail

# Block commits of local environment files that are likely to contain secrets.

FORBIDDEN_PATTERNS=(
  '\.env\.local$'
  '\.env\..*\.local$'
)

ALLOWED_EXCEPTIONS=(
  '\.env\.example$'
  '\.env\.production$'
  '\.env\.template$'
  'docs/\.env\.reference\.md$'
  '\.env\.ts$'
  '\.env\..*\.ts$'
  '\.env\..*\.test\.ts$'
  '\.env\..*\.spec\.ts$'
)

matches_any() {
  local value="$1"
  shift
  local patterns=("$@")

  for pattern in "${patterns[@]}"; do
    if [[ "$value" =~ $pattern ]]; then
      return 0
    fi
  done

  return 1
}

blocked=()

while IFS= read -r -d '' path; do
  if matches_any "$path" "${FORBIDDEN_PATTERNS[@]}" && ! matches_any "$path" "${ALLOWED_EXCEPTIONS[@]}"; then
    blocked+=("$path")
  fi
done < <(git diff --cached --name-only -z --diff-filter=ACMR)

if [[ ${#blocked[@]} -eq 0 ]]; then
  exit 0
fi

echo "------------------------------------------------------------------" >&2
echo "COMMIT BLOCKED: Environment files detected" >&2
echo "------------------------------------------------------------------" >&2
echo "" >&2
echo "The following files should NOT be committed:" >&2
for file in "${blocked[@]}"; do
  echo "  - $file" >&2
done
echo "" >&2
echo "These files likely contain sensitive credentials or secrets." >&2
echo "" >&2
echo "To fix this:" >&2
echo "  1) Unstage:  git restore --staged <file>   (or: git reset HEAD <file>)" >&2
echo "  2) Ensure the file is ignored by .gitignore" >&2
echo "  3) Rotate secrets if the file was ever pushed" >&2
echo "" >&2
exit 1
