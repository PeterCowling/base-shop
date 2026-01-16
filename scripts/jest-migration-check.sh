#!/bin/bash
# Jest Migration Check Script
# Compares current Jest configurations against baseline snapshots
# Returns non-zero exit code if significant differences are found

set -e

BASEDIR="/Users/petercowling/base-shop"
BASELINE_DIR="$BASEDIR/test/jest-baselines"
TMP_DIR="/tmp/jest-migration-check-$$"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# List of packages/apps with jest.config.cjs
PACKAGES=(
  "packages/ui"
  "packages/email"
  "packages/types"
  "packages/tailwind-config"
  "packages/platform-core"
  "packages/page-builder-core"
  "packages/page-builder-ui"
  "packages/cms-marketing"
  "packages/templates"
  "packages/template-app"
  "apps/cms"
  "apps/api"
  "apps/dashboard"
  "apps/reception"
  "apps/cover-me-pretty"
)

# Key fields to check for differences
KEY_FIELDS=(
  "moduleNameMapper"
  "transform"
  "setupFilesAfterEnv"
  "coverageDirectory"
  "testMatch"
  "testRegex"
  "testEnvironment"
  "collectCoverageFrom"
)

# Track overall status
DIFFERENCES_FOUND=0
PACKAGES_CHECKED=0
PACKAGES_FAILED=0

# Create temp directory
mkdir -p "$TMP_DIR"

# Cleanup on exit
trap "rm -rf $TMP_DIR" EXIT

echo "================================================================"
echo "Jest Migration Check"
echo "================================================================"
echo ""
echo "Comparing current Jest configs against baseline snapshots..."
echo "Baseline directory: $BASELINE_DIR"
echo ""

# Function to extract a specific field from config JSON
# Uses Python's json module if jq is not available
extract_field() {
  local file=$1
  local field=$2

  if command -v jq &> /dev/null; then
    jq -r ".configs[0].$field // empty" "$file" 2>/dev/null || echo ""
  else
    python3 -c "import json, sys; data = json.load(open('$file')); print(json.dumps(data['configs'][0].get('$field', '')))" 2>/dev/null || echo ""
  fi
}

# Function to compare two config files
compare_configs() {
  local package=$1
  local baseline=$2
  local current=$3
  local differences=""

  for field in "${KEY_FIELDS[@]}"; do
    local baseline_value=$(extract_field "$baseline" "$field")
    local current_value=$(extract_field "$current" "$field")

    if [ "$baseline_value" != "$current_value" ]; then
      differences="${differences}\n  - Field '$field' differs"
    fi
  done

  echo -e "$differences"
}

# Check each package
for package in "${PACKAGES[@]}"; do
  package_dir="$BASEDIR/$package"
  config_file="$package_dir/jest.config.cjs"

  # Check if jest.config.cjs exists
  if [ ! -f "$config_file" ]; then
    echo -e "${YELLOW}⚠️  Skipping $package (no jest.config.cjs found)${NC}"
    continue
  fi

  # Get the baseline filename
  safe_name=$(echo "$package" | tr '/' '-')
  baseline_file="$BASELINE_DIR/${safe_name}-config.json"

  if [ ! -f "$baseline_file" ]; then
    echo -e "${YELLOW}⚠️  Skipping $package (no baseline found)${NC}"
    continue
  fi

  # Capture current config (complete JSON)
  current_file="$TMP_DIR/${safe_name}-current.json"
  cd "$package_dir"

  if ! npx jest --showConfig 2>/dev/null > "$current_file"; then
    echo -e "${RED}❌ Failed to capture current config for $package${NC}"
    PACKAGES_FAILED=$((PACKAGES_FAILED + 1))
    cd "$BASEDIR"
    continue
  fi

  cd "$BASEDIR"

  # Compare configs
  echo -e "${BLUE}Checking $package...${NC}"
  PACKAGES_CHECKED=$((PACKAGES_CHECKED + 1))

  differences=$(compare_configs "$package" "$baseline_file" "$current_file")

  if [ -n "$differences" ]; then
    echo -e "${RED}  ⚠️  Differences found:${NC}"
    echo -e "${differences}"
    DIFFERENCES_FOUND=$((DIFFERENCES_FOUND + 1))

    # Save full diff for detailed inspection
    diff_file="$TMP_DIR/${safe_name}-diff.txt"
    diff "$baseline_file" "$current_file" > "$diff_file" 2>&1 || true
    echo -e "  ${YELLOW}Full diff saved to: $diff_file${NC}"
  else
    echo -e "${GREEN}  ✅ No significant differences${NC}"
  fi

  echo ""
done

# Summary
echo "================================================================"
echo "Summary"
echo "================================================================"
echo "Packages checked: $PACKAGES_CHECKED"
echo "Packages failed: $PACKAGES_FAILED"

if [ $DIFFERENCES_FOUND -gt 0 ]; then
  echo -e "${RED}Packages with differences: $DIFFERENCES_FOUND${NC}"
  echo ""
  echo "⚠️  Configuration differences detected!"
  echo ""
  echo "Review the differences above to determine if they are intentional."
  echo "Detailed diffs are available in: $TMP_DIR"
  echo ""
  echo "To keep temp files for inspection, copy them before this script exits:"
  echo "  cp -r $TMP_DIR /tmp/jest-diffs"
  echo ""
  exit 1
else
  echo -e "${GREEN}Packages with differences: $DIFFERENCES_FOUND${NC}"
  echo ""
  echo "✅ All checked packages match their baselines!"
  exit 0
fi
