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
VALIDATE_RANGE="${VALIDATE_RANGE:-}"

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

# 1. Find changed files
echo ""
echo "> Finding changed files..."

ALL_CHANGED=""
if [ -n "$VALIDATE_RANGE" ]; then
    echo "  Mode: git range ($VALIDATE_RANGE)"
    ALL_CHANGED=$(git diff --name-only --diff-filter=ACMRTUXB "$VALIDATE_RANGE" 2>/dev/null || true)
elif git diff --cached --quiet 2>/dev/null; then
    echo "  Mode: working tree vs HEAD"
    ALL_CHANGED=$(git diff --name-only --diff-filter=ACMRTUXB HEAD 2>/dev/null || true)
else
    echo "  Mode: staged changes"
    ALL_CHANGED=$(git diff --cached --name-only --diff-filter=ACMRTUXB 2>/dev/null || true)
fi

if [ -z "$ALL_CHANGED" ]; then
    echo "INFO: No changed files detected"
    echo ""
    echo "OK: All checks passed (nothing to validate)"
    exit 0
fi

echo "Changed files (all):"
echo "$ALL_CHANGED" | sed 's/^/  /'

# 2. Typecheck + lint (scoped to changed workspace packages)
echo ""
echo "> Typecheck + lint (changed packages)"

WORKSPACE_DIRS=$(echo "$ALL_CHANGED" \
    | grep -E '^(apps|packages)/' \
    | awk -F/ '{print $1"/"$2}' \
    | sort -u || true)

if [ -z "$WORKSPACE_DIRS" ]; then
    echo "INFO: No changed workspace packages detected; skipping package typecheck/lint."
else
    FILTERS=""
    FILTER_COUNT=0
    for dir in $WORKSPACE_DIRS; do
        if [ -f "$dir/package.json" ]; then
            PKG_NAME=$(node -e "console.log(require('./$dir/package.json').name)" 2>/dev/null || true)
            if [ -n "$PKG_NAME" ]; then
                FILTERS="$FILTERS --filter=$PKG_NAME"
                FILTER_COUNT=$((FILTER_COUNT + 1))
            fi
        fi
    done

    if [ "$FILTER_COUNT" -eq 0 ]; then
        echo "INFO: No package filters resolved from changed paths; skipping package typecheck/lint."
    else
        echo "Typecheck filters:$FILTERS"
        if ! pnpm exec turbo run typecheck $FILTERS; then
            echo "FAIL: Typecheck failed in changed packages"
            exit 1
        fi
        echo "OK: Typecheck passed"

        echo "Lint filters:$FILTERS"
        if ! pnpm exec turbo run lint $FILTERS; then
            echo "FAIL: Lint failed in changed packages"
            exit 1
        fi
        echo "OK: Lint passed"
    fi
fi

# 3. Find changed TS/TSX files for targeted tests
CHANGED=$(echo "$ALL_CHANGED" | grep -E '\.(ts|tsx)$' || true)

if [ -z "$CHANGED" ]; then
    echo ""
    echo "INFO: No changed TS/TSX files detected (skipping targeted test lookup)"
else
    echo ""
    echo "Changed TS/TSX files:"
    echo "$CHANGED" | sed 's/^/  /'
fi

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

        # Build absolute paths for all source files in this package
        ABS_SOURCE_FILES=""
        for sf in $SOURCE_FILES; do
            ABS_SOURCE_FILES="$ABS_SOURCE_FILES $(pwd)/$sf"
        done

        # Single batched probe: find related tests for ALL source files at once
        # (replaces per-file jest --listTests loop for speed)
        if ! RAW_RELATED=$(pnpm --filter "$PKG_PATH" exec jest --listTests --findRelatedTests $ABS_SOURCE_FILES --passWithNoTests 2>&1); then
            echo "    ERROR: Jest failed while probing tests for package: $PKG_PATH"
            echo "    Output: $RAW_RELATED"
            exit 1
        fi

        # Filter to only actual file paths (lines starting with /)
        RELATED=$(echo "$RAW_RELATED" | grep '^/' || true)

        if [ -z "$RELATED" ]; then
            # No tests found for any file in this package batch
            for sf in $SOURCE_FILES; do
                echo "    WARN: No tests found for: $sf"
                MISSING_TESTS=$((MISSING_TESTS + 1))
                MISSING_FILES="$MISSING_FILES $sf"
            done
        else
            # Tests found — run them (coverage thresholds relaxed)
            echo "    Running related tests for files (coverage thresholds relaxed)..."
            if ! JEST_ALLOW_PARTIAL_COVERAGE=1 JEST_DISABLE_COVERAGE_THRESHOLD=1 pnpm --filter "$PKG_PATH" exec jest --findRelatedTests $ABS_SOURCE_FILES --maxWorkers=2 2>&1; then
                echo "    FAIL: Tests failed in $PKG_PATH"
                exit 1
            fi
        fi
    fi

    TESTED_PKGS=$((TESTED_PKGS + 1))
done

# 6. Guide validation (brikette-specific)
# Detect guide content/manifest changes and run validate-content + validate-links.
GUIDE_CONTENT_ALL="$ALL_CHANGED"

GUIDE_JSON_CHANGED=$(echo "$GUIDE_CONTENT_ALL" | grep -E '^apps/brikette/src/locales/.*/guides/content/.*\.json$' || true)
GUIDE_INFRA_CHANGED=$(echo "$GUIDE_CONTENT_ALL" | grep -E '^apps/brikette/src/routes/guides/(guide-manifest|content-schema)\.ts$' || true)

if [ -n "$GUIDE_JSON_CHANGED" ] || [ -n "$GUIDE_INFRA_CHANGED" ]; then
    echo ""
    echo "> Guide validation (brikette)"

    # Extract changed guide keys from JSON paths
    GUIDE_KEYS=""
    if [ -n "$GUIDE_JSON_CHANGED" ]; then
        GUIDE_KEYS=$(echo "$GUIDE_JSON_CHANGED" | sed 's|.*/||;s|\.json$||' | sort -u | tr '\n' ',' | sed 's/,$//')
    fi

    # If only content files changed, scope validation to those guides.
    # If infrastructure changed (manifest/schema), validate all guides.
    GUIDE_FILTER=""
    if [ -z "$GUIDE_INFRA_CHANGED" ] && [ -n "$GUIDE_KEYS" ]; then
        GUIDE_FILTER="--guides=$GUIDE_KEYS"
        echo "  Validating changed guides: $GUIDE_KEYS"
    else
        echo "  Validating all guides (infrastructure changed)"
    fi

    echo "  Running validate-content..."
    if ! pnpm --filter ./apps/brikette validate-content --fail-on-violation $GUIDE_FILTER 2>&1; then
        echo "  FAIL: Guide content validation failed"
        exit 1
    fi

    echo "  Running validate-links..."
    if ! pnpm --filter ./apps/brikette validate-links $GUIDE_FILTER 2>&1; then
        echo "  FAIL: Guide link validation failed"
        exit 1
    fi

    echo "  OK: Guide validation passed"
fi

# 7. Summary
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
