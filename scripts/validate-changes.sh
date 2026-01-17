#!/bin/sh
# Validation gate — run before every commit
# Portable across macOS and Linux (not strictly POSIX due to ps/grep usage)
#
# Usage:
#   ./scripts/validate-changes.sh                      # Warn on missing tests
#   STRICT=1 ./scripts/validate-changes.sh             # Fail on missing tests
#   ALLOW_TEST_PROCS=1 ./scripts/validate-changes.sh   # Skip orphan process check
#
# Limitations:
#   - Filenames with spaces are not supported (repo convention forbids them)
#   - Supports Jest (default) and Node test runner (detected via package.json)

set -e

STRICT="${STRICT:-0}"
ALLOW_TEST_PROCS="${ALLOW_TEST_PROCS:-0}"

echo "========================================"
echo "  Validation Gate"
echo "========================================"

# 0. Check for orphaned test processes (incident 2026-01-16)
if [ "$ALLOW_TEST_PROCS" != "1" ]; then
    JEST_PROCS=$(ps -ef | grep -E 'jest-worker|jest\.js' | grep -v grep | wc -l | tr -d ' ')
    if [ "$JEST_PROCS" -gt 0 ]; then
        echo "WARN: $JEST_PROCS Jest worker processes detected."
        echo "  If these are intentional (watch mode), re-run with:"
        echo "    ALLOW_TEST_PROCS=1 ./scripts/validate-changes.sh"
        echo "  To kill orphans: pkill -f 'jest-worker' && pkill -f 'jest.js'"
        echo "  See: docs/testing-policy.md for testing policy details"
        if [ "$STRICT" = "1" ]; then
            echo "FAIL: Aborting due to STRICT mode."
            exit 1
        fi
        echo "  Continuing anyway (non-strict mode)..."
    fi
fi

# 1. Typecheck
echo ""
echo "> Typecheck"
if ! pnpm typecheck; then
    echo "FAIL: Typecheck failed"
    exit 1
fi
echo "OK: Typecheck passed"

# 2. Lint
echo ""
echo "> Lint"
if ! pnpm lint; then
    echo "FAIL: Lint failed"
    exit 1
fi
echo "OK: Lint passed"

# 3. Find changed files
echo ""
echo "> Finding changed files..."

CHANGED=""
if git diff --cached --quiet 2>/dev/null; then
    CHANGED=$(git diff --name-only HEAD 2>/dev/null | grep -E '\.(ts|tsx)$' || true)
else
    CHANGED=$(git diff --cached --name-only 2>/dev/null | grep -E '\.(ts|tsx)$' || true)
fi

if [ -z "$CHANGED" ]; then
    echo "INFO: No changed TS/TSX files detected"
    echo ""
    echo "OK: All checks passed (no tests to run)"
    exit 0
fi

echo "Changed files:"
echo "$CHANGED" | sed 's/^/  /'

# 4. Group files by package (using type__name to avoid packages/foo vs apps/foo collision)
echo ""
echo "> Grouping by package..."

TMPDIR="${TMPDIR:-/tmp}"
PKG_MAP="$TMPDIR/validate-changes-$$"
mkdir -p "$PKG_MAP"
trap 'rm -rf "$PKG_MAP"' EXIT

for file in $CHANGED; do
    # Determine package type and name from file path
    PKG_KEY=""
    case "$file" in
        packages/*)
            PKG_NAME=$(echo "$file" | cut -d/ -f2)
            PKG_KEY="packages__${PKG_NAME}"
            ;;
        apps/*)
            PKG_NAME=$(echo "$file" | cut -d/ -f2)
            PKG_KEY="apps__${PKG_NAME}"
            ;;
        *)
            # Root-level files (scripts/, etc.) - skip test lookup
            continue
            ;;
    esac

    # Append file to package's file list (keyed by type__name)
    echo "$file" >> "$PKG_MAP/$PKG_KEY"
done

# 5. For each package, check for related tests and run them (one Jest run per package)
echo ""
echo "> Running targeted tests..."

TESTED_PKGS=0
MISSING_TESTS=0
MISSING_FILES=""

for pkg_file in "$PKG_MAP"/*; do
    [ -f "$pkg_file" ] || continue

    # Parse type and name from key (e.g., "packages__ui" -> type=packages, name=ui)
    PKG_KEY=$(basename "$pkg_file")
    PKG_TYPE=$(echo "$PKG_KEY" | sed 's/__.*$//')
    PKG_NAME=$(echo "$PKG_KEY" | sed 's/^[^_]*__//')
    PKG_PATH="./${PKG_TYPE}/${PKG_NAME}"

    if [ ! -d "$PKG_PATH" ]; then
        echo "  WARN: Package directory not found: $PKG_PATH"
        continue
    fi

    # Detect test runner from package.json
    TEST_RUNNER="jest"
    if [ -f "$PKG_PATH/package.json" ]; then
        TEST_SCRIPT=$(grep '"test":' "$PKG_PATH/package.json" 2>/dev/null || true)
        case "$TEST_SCRIPT" in
            *"node --test"*)
                TEST_RUNNER="node"
                ;;
            *"vitest"*)
                TEST_RUNNER="vitest"
                ;;
        esac
    fi

    # Read files for this package
    FILES=$(cat "$pkg_file" | tr '\n' ' ')

    # Separate test files from source files
    # Only treat *.test.ts(x) and *.spec.ts(x) as runnable tests
    # Files in __tests__/ that aren't test files are fixtures/helpers
    SOURCE_FILES=""
    TEST_FILES=""
    for f in $FILES; do
        case "$f" in
            *.test.ts|*.test.tsx|*.spec.ts|*.spec.tsx)
                TEST_FILES="$TEST_FILES $f"
                ;;
            *.d.ts)
                # Skip type definition files
                ;;
            *)
                SOURCE_FILES="$SOURCE_FILES $f"
                ;;
        esac
    done

    echo ""
    echo "  Package: $PKG_PATH (runner: $TEST_RUNNER)"

    # Handle non-Jest runners (node --test, vitest) differently
    if [ "$TEST_RUNNER" = "node" ]; then
        # Node test runner: just run pnpm test for the package
        # Node's test runner doesn't support --findRelatedTests
        if [ -n "$TEST_FILES" ] || [ -n "$SOURCE_FILES" ]; then
            echo "    Running package tests (Node test runner)..."
            if ! pnpm --filter "$PKG_PATH" test 2>&1; then
                echo "    FAIL: Tests failed in $PKG_PATH"
                exit 1
            fi
        fi
        TESTED_PKGS=$((TESTED_PKGS + 1))
        continue
    fi

    if [ "$TEST_RUNNER" = "vitest" ]; then
        # Vitest: use --related flag if available
        if [ -n "$TEST_FILES" ] || [ -n "$SOURCE_FILES" ]; then
            echo "    Running package tests (Vitest)..."
            if ! pnpm --filter "$PKG_PATH" test 2>&1; then
                echo "    FAIL: Tests failed in $PKG_PATH"
                exit 1
            fi
        fi
        TESTED_PKGS=$((TESTED_PKGS + 1))
        continue
    fi

    # Jest runner (default)
    # If test files changed, run them directly
    if [ -n "$TEST_FILES" ]; then
        echo "    Test files changed:$TEST_FILES"
        # Build relative paths for Jest
        RELATIVE_TESTS=""
        for tf in $TEST_FILES; do
            REL=$(echo "$tf" | sed "s|^${PKG_TYPE}/${PKG_NAME}/||")
            RELATIVE_TESTS="$RELATIVE_TESTS $REL"
        done
        # Use explicit -- separator (not --$VAR which is fragile)
        if ! JEST_ALLOW_PARTIAL_COVERAGE=1 JEST_DISABLE_COVERAGE_THRESHOLD=1 pnpm --filter "$PKG_PATH" test -- $RELATIVE_TESTS --maxWorkers=2 2>&1; then
            echo "    FAIL: Tests failed in $PKG_PATH"
            exit 1
        fi
    fi

    # If source files changed, find and run related tests (batched per package)
    if [ -n "$SOURCE_FILES" ]; then
        echo "    Source files:$SOURCE_FILES"

        # Collect all source files that have related tests, and track missing
        FILES_WITH_TESTS=""
        for sf in $SOURCE_FILES; do
            ABS_FILE="$(pwd)/$sf"

            # Probe for related tests
            # Note: Jest --listTests outputs file paths (one per line) on success,
            # but may also output messages like "No tests found" or warnings.
            # We filter to only lines that look like file paths (start with /).
            # Use --passWithNoTests to avoid non-zero exit on empty results.
            if ! RAW_RELATED=$(pnpm --filter "$PKG_PATH" exec jest --listTests --findRelatedTests "$ABS_FILE" --passWithNoTests 2>&1); then
                echo "    ERROR: Jest failed while probing tests for: $sf"
                echo "    Output: $RAW_RELATED"
                exit 1
            fi

            # Filter to only actual file paths (lines starting with /)
            RELATED=$(echo "$RAW_RELATED" | grep '^/' || true)

            if [ -z "$RELATED" ]; then
                echo "    WARN: No tests found for: $sf"
                MISSING_TESTS=$((MISSING_TESTS + 1))
                MISSING_FILES="$MISSING_FILES $sf"
            else
                FILES_WITH_TESTS="$FILES_WITH_TESTS $ABS_FILE"
            fi
        done

        # Run one Jest invocation for all source files that have related tests
        if [ -n "$FILES_WITH_TESTS" ]; then
            echo "    Running related tests for files (coverage thresholds relaxed)..."
            if ! JEST_ALLOW_PARTIAL_COVERAGE=1 JEST_DISABLE_COVERAGE_THRESHOLD=1 pnpm --filter "$PKG_PATH" exec jest --findRelatedTests $FILES_WITH_TESTS --maxWorkers=2 2>&1; then
                echo "    FAIL: Tests failed in $PKG_PATH"
                exit 1
            fi
        fi
    fi

    TESTED_PKGS=$((TESTED_PKGS + 1))
done

# 6. Summary
echo ""
echo "========================================"
echo "Summary:"
echo "  Packages tested: $TESTED_PKGS"
echo "  Files missing tests: $MISSING_TESTS"

if [ "$MISSING_TESTS" -gt 0 ]; then
    echo ""
    echo "Files without test coverage:"
    for f in $MISSING_FILES; do
        echo "  - $f"
    done
    echo ""
    if [ "$STRICT" = "1" ]; then
        echo "FAIL: $MISSING_TESTS changed files have no related tests."
        echo "  Run without STRICT=1 to warn instead of fail."
        exit 1
    else
        echo "WARN: $MISSING_TESTS changed files have no related tests."
        echo "  Run with STRICT=1 to fail instead of warn."
    fi
fi

echo ""
echo "OK: All validation checks passed"
