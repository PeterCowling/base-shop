#!/bin/sh
# Pre-commit hook to prevent accidental commits of local environment files
# This script checks for .env.local and similar files that should never be committed

set -e

# ANSI color codes for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get list of staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

# Patterns to check for (add more as needed)
FORBIDDEN_PATTERNS=(
  "\.env\.local$"
  "\.env\..*\.local$"
  "\.env\.production\.local$"
  "\.env\.development\.local$"
)

# Files that are explicitly allowed (from .gitignore)
ALLOWED_EXCEPTIONS=(
  "\.env\.example$"
  "\.env\.production$"
  "docs/\.env\.reference\.md$"
  "\.env\.template$"
  "\.env\.ts$"
  "\.env\.test\.ts$"
)

found_forbidden=0
forbidden_files=""

# Check each staged file
for file in $STAGED_FILES; do
  is_forbidden=0

  # Check if file matches forbidden patterns
  for pattern in "${FORBIDDEN_PATTERNS[@]}"; do
    if echo "$file" | grep -qE "$pattern"; then
      is_forbidden=1
      break
    fi
  done

  # If forbidden, check if it's in the allowed exceptions
  if [ $is_forbidden -eq 1 ]; then
    is_allowed=0
    for exception in "${ALLOWED_EXCEPTIONS[@]}"; do
      if echo "$file" | grep -qE "$exception"; then
        is_allowed=1
        break
      fi
    done

    # If not allowed, add to list of forbidden files
    if [ $is_allowed -eq 0 ]; then
      found_forbidden=1
      forbidden_files="${forbidden_files}\n  - $file"
    fi
  fi
done

# If forbidden files were found, abort the commit
if [ $found_forbidden -eq 1 ]; then
  echo "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo "${RED}❌ COMMIT BLOCKED: Environment files detected${NC}"
  echo "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "${YELLOW}The following files should NOT be committed:${NC}"
  echo -e "$forbidden_files"
  echo ""
  echo "${YELLOW}These files likely contain sensitive credentials or secrets.${NC}"
  echo ""
  echo "To fix this issue:"
  echo "  1. Unstage the files:  ${YELLOW}git reset HEAD <file>${NC}"
  echo "  2. Verify .gitignore includes these patterns"
  echo "  3. Check if secrets need rotation (if previously committed)"
  echo ""
  echo "If you believe this is a false positive, please:"
  echo "  - Verify the file doesn't contain secrets"
  echo "  - Add it to ALLOWED_EXCEPTIONS in scripts/git-hooks/pre-commit-check-env.sh"
  echo "  - Update .gitignore to explicitly allow it"
  echo ""
  exit 1
fi

exit 0
