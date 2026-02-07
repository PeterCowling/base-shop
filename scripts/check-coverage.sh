#!/bin/sh
# Coverage Gate — Enforce tiered coverage thresholds locally
#
# This script runs tests with coverage and validates against the tiered
# policy defined in packages/config/coverage-tiers.cjs.
#
# Usage:
#   ./scripts/check-coverage.sh                    # Check all packages
#   ./scripts/check-coverage.sh @acme/stripe       # Check specific package
#   ./scripts/check-coverage.sh apps/cms           # Check by path
#   DRY_RUN=1 ./scripts/check-coverage.sh          # Show what would run
#
# Exit codes:
#   0 - All packages meet their tier thresholds
#   1 - One or more packages failed coverage
#   2 - Script error (missing deps, etc.)
#
# Tiers:
#   CRITICAL (90%): @acme/stripe, @acme/auth, @acme/platform-core
#   STANDARD (80%): All other packages (default)
#   MINIMAL  (0%):  @acme/types, @acme/templates, scripts

set -e

# Colors for output (disable if not a terminal)
if [ -t 1 ]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[0;33m'
    BLUE='\033[0;34m'
    NC='\033[0m' # No Color
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    NC=''
fi

DRY_RUN="${DRY_RUN:-0}"
PACKAGE_FILTER="${1:-}"

echo "========================================"
echo "  Coverage Gate"
echo "========================================"
echo ""

# Verify we're in the repo root
if [ ! -f "package.json" ] || [ ! -d "packages/config" ]; then
    echo "${RED}ERROR: Must run from repository root${NC}"
    exit 2
fi

# Check that coverage-tiers.cjs exists
if [ ! -f "packages/config/coverage-tiers.cjs" ]; then
    echo "${RED}ERROR: packages/config/coverage-tiers.cjs not found${NC}"
    exit 2
fi

# Define tier thresholds (matching coverage-tiers.cjs)
# We duplicate here for shell script simplicity; source of truth is the .cjs file
get_tier_threshold() {
    pkg="$1"
    case "$pkg" in
        "@acme/stripe"|"@acme/auth"|"@acme/platform-core")
            echo "90"
            ;;
        "@acme/types"|"@acme/templates"|"@acme/template-app"|"@acme/tailwind-config"|"scripts")
            echo "0"
            ;;
        *)
            echo "80"
            ;;
    esac
}

get_tier_name() {
    pkg="$1"
    case "$pkg" in
        "@acme/stripe"|"@acme/auth"|"@acme/platform-core")
            echo "CRITICAL"
            ;;
        "@acme/types"|"@acme/templates"|"@acme/template-app"|"@acme/tailwind-config"|"scripts")
            echo "MINIMAL"
            ;;
        *)
            echo "STANDARD"
            ;;
    esac
}

# Find packages to check
find_packages() {
    if [ -n "$PACKAGE_FILTER" ]; then
        # Single package specified
        echo "$PACKAGE_FILTER"
    else
        # All packages and apps with package.json
        find packages apps -maxdepth 2 -name "package.json" -type f 2>/dev/null | while read -r pjson; do
            dirname "$pjson"
        done
    fi
}

# Extract coverage from Jest JSON output
# Jest outputs coverage-summary.json with format:
# { "total": { "lines": { "pct": 85.5 }, "branches": { ... } } }
extract_coverage() {
    summary_file="$1"
    metric="$2"

    if [ ! -f "$summary_file" ]; then
        echo "0"
        return
    fi

    # Use node for reliable JSON parsing
    node -e "
        const fs = require('fs');
        try {
            const data = JSON.parse(fs.readFileSync('$summary_file', 'utf8'));
            const pct = data.total?.${metric}?.pct ?? 0;
            console.log(Math.floor(pct));
        } catch {
            console.log('0');
        }
    " 2>/dev/null || echo "0"
}

# Main execution
FAILED_PACKAGES=""
PASSED_PACKAGES=""
SKIPPED_PACKAGES=""
TOTAL_CHECKED=0

echo "${BLUE}> Finding packages to check...${NC}"
echo ""

for pkg_path in $(find_packages); do
    # Skip if path doesn't exist
    [ -d "$pkg_path" ] || continue

    # Get package name from package.json
    if [ -f "$pkg_path/package.json" ]; then
        pkg_name=$(node -e "console.log(require('./$pkg_path/package.json').name || '')" 2>/dev/null || echo "")
    else
        pkg_name=""
    fi

    # Use path-based name if package.json name is empty
    if [ -z "$pkg_name" ]; then
        pkg_name="$pkg_path"
    fi

    tier_name=$(get_tier_name "$pkg_name")
    threshold=$(get_tier_threshold "$pkg_name")

    echo "----------------------------------------"
    echo "${BLUE}Package:${NC} $pkg_name"
    echo "${BLUE}Tier:${NC}    $tier_name ($threshold%)"

    # Skip MINIMAL tier packages (no coverage needed)
    if [ "$tier_name" = "MINIMAL" ]; then
        echo "${YELLOW}SKIP:${NC}    Minimal tier - no coverage required"
        SKIPPED_PACKAGES="$SKIPPED_PACKAGES $pkg_name"
        continue
    fi

    # Skip packages without test files
    if ! find "$pkg_path" -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" 2>/dev/null | grep -q .; then
        echo "${YELLOW}SKIP:${NC}    No test files found"
        SKIPPED_PACKAGES="$SKIPPED_PACKAGES $pkg_name"
        continue
    fi

    TOTAL_CHECKED=$((TOTAL_CHECKED + 1))

    if [ "$DRY_RUN" = "1" ]; then
        echo "${YELLOW}DRY RUN:${NC} Would run: pnpm --filter \"$pkg_name\" test --coverage"
        continue
    fi

    # Run tests with coverage
    echo "${BLUE}Running:${NC} pnpm --filter \"$pkg_name\" test --coverage --maxWorkers=2"

    # Create temp dir for coverage output
    COVERAGE_DIR="coverage/$(echo "$pkg_name" | sed 's/@//' | sed 's/\//-/g')"

    # Run Jest with coverage, capture exit code
    set +e
    pnpm --filter "$pkg_name" test --coverage --maxWorkers=2 --coverageReporters=json-summary 2>&1
    TEST_EXIT=$?
    set -e

    if [ $TEST_EXIT -ne 0 ]; then
        echo "${RED}FAIL:${NC}    Tests failed (exit code $TEST_EXIT)"
        FAILED_PACKAGES="$FAILED_PACKAGES $pkg_name"
        continue
    fi

    # Find the coverage summary
    SUMMARY_FILE="$COVERAGE_DIR/coverage-summary.json"
    if [ ! -f "$SUMMARY_FILE" ]; then
        # Try alternate location
        SUMMARY_FILE="coverage/coverage-summary.json"
    fi

    if [ ! -f "$SUMMARY_FILE" ]; then
        echo "${YELLOW}WARN:${NC}    No coverage summary found"
        PASSED_PACKAGES="$PASSED_PACKAGES $pkg_name"
        continue
    fi

    # Extract coverage metrics
    lines=$(extract_coverage "$SUMMARY_FILE" "lines")
    branches=$(extract_coverage "$SUMMARY_FILE" "branches")
    functions=$(extract_coverage "$SUMMARY_FILE" "functions")
    statements=$(extract_coverage "$SUMMARY_FILE" "statements")

    echo "${BLUE}Coverage:${NC} lines=$lines% branches=$branches% functions=$functions% statements=$statements%"

    # Check against threshold
    FAILED=0
    if [ "$lines" -lt "$threshold" ]; then
        echo "${RED}  FAIL: lines $lines% < $threshold%${NC}"
        FAILED=1
    fi
    if [ "$branches" -lt "$threshold" ]; then
        echo "${RED}  FAIL: branches $branches% < $threshold%${NC}"
        FAILED=1
    fi
    if [ "$functions" -lt "$threshold" ]; then
        echo "${RED}  FAIL: functions $functions% < $threshold%${NC}"
        FAILED=1
    fi
    if [ "$statements" -lt "$threshold" ]; then
        echo "${RED}  FAIL: statements $statements% < $threshold%${NC}"
        FAILED=1
    fi

    if [ $FAILED -eq 1 ]; then
        FAILED_PACKAGES="$FAILED_PACKAGES $pkg_name"
    else
        echo "${GREEN}PASS:${NC}    All metrics meet $tier_name tier ($threshold%)"
        PASSED_PACKAGES="$PASSED_PACKAGES $pkg_name"
    fi
done

# Summary
echo ""
echo "========================================"
echo "  Summary"
echo "========================================"
echo ""

if [ "$DRY_RUN" = "1" ]; then
    echo "${YELLOW}DRY RUN MODE - no tests were executed${NC}"
    echo ""
fi

echo "Packages checked: $TOTAL_CHECKED"

if [ -n "$PASSED_PACKAGES" ]; then
    echo "${GREEN}Passed:${NC}$PASSED_PACKAGES"
fi

if [ -n "$SKIPPED_PACKAGES" ]; then
    echo "${YELLOW}Skipped:${NC}$SKIPPED_PACKAGES"
fi

if [ -n "$FAILED_PACKAGES" ]; then
    echo "${RED}Failed:${NC}$FAILED_PACKAGES"
    echo ""
    echo "${RED}Coverage gate FAILED${NC}"
    echo ""
    echo "To fix:"
    echo "  1. Add tests to increase coverage"
    echo "  2. Review coverage-tiers.cjs if tier assignment is wrong"
    echo "  3. See docs/test-coverage-policy.md for policy details"
    exit 1
fi

echo ""
echo "${GREEN}Coverage gate PASSED${NC}"
exit 0
