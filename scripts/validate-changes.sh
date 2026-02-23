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
# Hard cap for batched --findRelatedTests breadth. Above this we run source-adjacent tests.
RELATED_TEST_LIMIT="${RELATED_TEST_LIMIT:-20}"
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

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
CHANGE_MODE=""
WEBPACK_POLICY_SOURCE="fs"
if [ -n "$VALIDATE_RANGE" ]; then
    echo "  Mode: git range ($VALIDATE_RANGE)"
    ALL_CHANGED=$(git diff --name-only --diff-filter=ACMRTUXB "$VALIDATE_RANGE" 2>/dev/null || true)
    CHANGE_MODE="range"

    end_ref="$(printf '%s' "$VALIDATE_RANGE" | awk -F'\\.\\.' '{print $NF}')"
    end_sha="$(git rev-parse "$end_ref" 2>/dev/null || true)"
    if [ -n "$end_sha" ]; then
        WEBPACK_POLICY_SOURCE="ref:${end_sha}"
    else
        WEBPACK_POLICY_SOURCE="ref:${end_ref}"
    fi
elif git diff --cached --quiet 2>/dev/null; then
    echo "  Mode: working tree vs HEAD"
    ALL_CHANGED=$(git diff --name-only --diff-filter=ACMRTUXB HEAD 2>/dev/null || true)
    CHANGE_MODE="worktree"
else
    echo "  Mode: staged changes"
    ALL_CHANGED=$(git diff --cached --name-only --diff-filter=ACMRTUXB 2>/dev/null || true)
    CHANGE_MODE="staged"
    WEBPACK_POLICY_SOURCE="index"
fi

if [ -z "$ALL_CHANGED" ]; then
    echo "INFO: No changed files detected"
    echo ""
    echo "OK: All checks passed (nothing to validate)"
    exit 0
fi

echo "Changed files (all):"
echo "$ALL_CHANGED" | sed 's/^/  /'

# 1. Policy checks (fast, deterministic)
echo ""
echo "> Policy checks"
echo "Checking Next.js command policy matrix..."
if ! printf '%s\n' "$ALL_CHANGED" | node "$REPO_ROOT/scripts/check-next-webpack-flag.mjs" --repo-root "$REPO_ROOT" --source "$WEBPACK_POLICY_SOURCE"; then
    echo "FAIL: Next.js command policy matrix check failed (${CHANGE_MODE})"
    exit 1
fi
echo "OK: Next.js command policy matrix check passed"

echo "Checking Jest config path policy..."
if ! printf '%s\n' "$ALL_CHANGED" | node "$REPO_ROOT/scripts/src/ci/check-jest-config-paths.mjs" --repo-root "$REPO_ROOT" --source "$WEBPACK_POLICY_SOURCE"; then
    echo "FAIL: Jest config path policy check failed (${CHANGE_MODE})"
    exit 1
fi
echo "OK: Jest config path policy check passed"

I18N_RESOLVER_CHANGED=$(echo "$ALL_CHANGED" | grep -E '^(packages/i18n/|packages/next-config/)|(^|/)tsconfig[^/]*\.json$' || true)
if [ -n "$I18N_RESOLVER_CHANGED" ]; then
    echo ""
    echo "Checking i18n resolver contract..."
    if ! node "$REPO_ROOT/scripts/check-i18n-resolver-contract.mjs" --repo-root "$REPO_ROOT"; then
        echo "FAIL: i18n resolver contract check failed (${CHANGE_MODE})"
        exit 1
    fi
    echo "OK: i18n resolver contract check passed"
else
    echo "Skipping i18n resolver contract check (no relevant path changes)"
fi

# 1b. Token checks (contrast + drift) for theme/token/UI style changes
TOKEN_CHECK_CHANGED=$(echo "$ALL_CHANGED" | grep -E '^(package\.json|scripts/src/tokens/|packages/themes/|packages/design-tokens/|packages/tailwind-config/|packages/design-system/src/(primitives|styles|tokens)/|packages/ui/src/(components|styles)/|apps/[^/]+/tailwind\.config\.(js|cjs|mjs|ts)$|apps/[^/]+/src/(components|styles|app)/.*\.(ts|tsx|js|jsx|css|scss)$)' || true)
if [ -n "$TOKEN_CHECK_CHANGED" ]; then
    echo ""
    echo "> Token checks (contrast + drift)"
    echo "Token-check trigger paths:"
    echo "$TOKEN_CHECK_CHANGED" | sed 's/^/  /'

    echo "Running tokens:contrast:check..."
    if ! pnpm run tokens:contrast:check; then
        echo "FAIL: tokens:contrast:check failed (${CHANGE_MODE})"
        exit 1
    fi

    echo "Running tokens:drift:check..."
    if ! pnpm run tokens:drift:check; then
        echo "FAIL: tokens:drift:check failed (${CHANGE_MODE})"
        exit 1
    fi

    echo "OK: Token checks passed"
else
    echo "Skipping token checks (no theme/token/UI style path changes)"
fi

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
# Ignore generated build output so it does not inflate related-test resolution.
CHANGED=$(echo "$ALL_CHANGED" \
    | grep -E '\.(ts|tsx)$' \
    | grep -Ev '^apps/[^/]+/\.wrangler/tmp/' \
    | grep -Ev '^apps/[^/]+/\.next/' \
    | grep -Ev '^apps/[^/]+/dist/' || true)

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
            # Handle nested packages (e.g., packages/themes/prime) where the
            # parent directory has no package.json.
            if [ ! -f "packages/${PKG_NAME}/package.json" ]; then
                SUB_NAME=$(echo "$file" | cut -d/ -f3)
                if [ -n "$SUB_NAME" ] && [ -f "packages/${PKG_NAME}/${SUB_NAME}/package.json" ]; then
                    PKG_NAME="${PKG_NAME}/${SUB_NAME}"
                fi
            fi
            # Use ~ as separator for nested names to avoid / in temp file paths
            PKG_KEY="packages__$(echo "$PKG_NAME" | tr '/' '~')"
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

# Run Jest with package-specific configuration when needed.
run_jest_exec() {
    pkg_path="$1"
    shift

    if [ "$pkg_path" = "./packages/mcp-server" ]; then
        # Always run via the governed runner to comply with test policy.
        # Use the package-local config so Jest's haste-map doesn't index unrelated apps,
        # which can trigger duplicate manual mock errors.
        JEST_FORCE_CJS=1 bash "$REPO_ROOT/scripts/tests/run-governed-test.sh" -- jest -- \
            --config "$REPO_ROOT/packages/mcp-server/jest.config.cjs" \
            "$@"
        return $?
    fi

    (
        cd "$pkg_path" || exit 1
        if [ -f "jest.config.cjs" ]; then
            bash "$REPO_ROOT/scripts/tests/run-governed-test.sh" -- jest -- --config ./jest.config.cjs "$@"
            exit $?
        fi
        bash "$REPO_ROOT/scripts/tests/run-governed-test.sh" -- jest -- --config "$REPO_ROOT/jest.config.cjs" "$@"
    )
}

# For broad related sets, run only tests adjacent to changed source files.
find_source_adjacent_tests() {
    pkg_path="$1"
    pkg_type="$2"
    pkg_name="$3"
    source_files="$4"

    adjacent_tests=""
    for sf in $source_files; do
        rel_sf=$(echo "$sf" | sed "s|^${pkg_type}/${pkg_name}/||")
        rel_dir=$(dirname "$rel_sf")
        source_name=$(basename "$rel_sf")
        source_stem=${source_name%.*}

        for candidate in \
            "$pkg_path/$rel_dir/__tests__/${source_stem}.test.ts" \
            "$pkg_path/$rel_dir/__tests__/${source_stem}.test.tsx" \
            "$pkg_path/$rel_dir/__tests__/${source_stem}.spec.ts" \
            "$pkg_path/$rel_dir/__tests__/${source_stem}.spec.tsx" \
            "$pkg_path/$rel_dir/${source_stem}.test.ts" \
            "$pkg_path/$rel_dir/${source_stem}.test.tsx" \
            "$pkg_path/$rel_dir/${source_stem}.spec.ts" \
            "$pkg_path/$rel_dir/${source_stem}.spec.tsx"
        do
            if [ -f "$candidate" ]; then
                adjacent_tests="$adjacent_tests
$(pwd)/$candidate"
            fi
        done
    done

    echo "$adjacent_tests" | grep '^/' | sort -u | tr '\n' ' '
}

find_source_named_tests() {
    pkg_path="$1"
    pkg_type="$2"
    pkg_name="$3"
    source_files="$4"

    named_tests=""
    for sf in $source_files; do
        rel_sf=$(echo "$sf" | sed "s|^${pkg_type}/${pkg_name}/||")
        source_name=$(basename "$rel_sf")
        source_stem=${source_name%.*}
        test_root="$pkg_path/src/__tests__"
        if [ ! -d "$test_root" ]; then
            continue
        fi

        matches=$(find "$test_root" -type f \( \
            -iname "*${source_stem}*.test.ts" -o \
            -iname "*${source_stem}*.test.tsx" -o \
            -iname "*${source_stem}*.spec.ts" -o \
            -iname "*${source_stem}*.spec.tsx" \
        \) 2>/dev/null || true)

        if [ -n "$matches" ]; then
            named_tests="$named_tests
$matches"
        fi
    done

    echo "$named_tests" | grep '^/' | sort -u | tr '\n' ' '
}

for pkg_file in "$PKG_MAP"/*; do
    [ -f "$pkg_file" ] || continue

    # Parse type and name from key (e.g., "packages__ui" -> type=packages, name=ui)
    # Nested packages use ~ as separator (e.g., "packages__themes~prime" -> name=themes/prime)
    PKG_KEY=$(basename "$pkg_file")
    PKG_TYPE=$(echo "$PKG_KEY" | sed 's/__.*$//')
    PKG_NAME=$(echo "$PKG_KEY" | sed 's/^[^_]*__//' | tr '~' '/')
    PKG_NAME_SAFE=$(echo "$PKG_NAME" | tr '/' '-')
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
        ABS_TEST_FILES=""
        for tf in $TEST_FILES; do
            ABS_TEST_FILES="$ABS_TEST_FILES $(pwd)/$tf"
        done
        if ! JEST_ALLOW_PARTIAL_COVERAGE=1 JEST_DISABLE_COVERAGE_THRESHOLD=1 run_jest_exec "$PKG_PATH" --runTestsByPath $ABS_TEST_FILES --maxWorkers=2 2>&1; then
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

        if [ "$PKG_PATH" = "./packages/mcp-server" ]; then
            echo "    INFO: Skipping --listTests probe for $PKG_PATH (non-terminating in some governed runs)."
            ADJACENT_TESTS=$(find_source_adjacent_tests "$PKG_PATH" "$PKG_TYPE" "$PKG_NAME" "$SOURCE_FILES")
            if [ -n "$ADJACENT_TESTS" ]; then
                echo "    Source-adjacent tests:$ADJACENT_TESTS"
                if ! JEST_ALLOW_PARTIAL_COVERAGE=1 JEST_DISABLE_COVERAGE_THRESHOLD=1 run_jest_exec "$PKG_PATH" --runTestsByPath $ADJACENT_TESTS --maxWorkers=2 2>&1; then
                    echo "    FAIL: Source-adjacent tests failed in $PKG_PATH"
                    exit 1
                fi
            else
                NAMED_TESTS=$(find_source_named_tests "$PKG_PATH" "$PKG_TYPE" "$PKG_NAME" "$SOURCE_FILES")
                if [ -n "$NAMED_TESTS" ]; then
                    echo "    Source-name matched tests:$NAMED_TESTS"
                    if ! JEST_ALLOW_PARTIAL_COVERAGE=1 JEST_DISABLE_COVERAGE_THRESHOLD=1 run_jest_exec "$PKG_PATH" --runTestsByPath $NAMED_TESTS --maxWorkers=2 2>&1; then
                        echo "    FAIL: Source-name matched tests failed in $PKG_PATH"
                        exit 1
                    fi
                else
                    echo "    WARN: No source-adjacent or source-name matched tests found in $PKG_PATH."
                    for sf in $SOURCE_FILES; do
                        echo "    WARN: No tests found for: $sf"
                        MISSING_TESTS=$((MISSING_TESTS + 1))
                        MISSING_FILES="$MISSING_FILES $sf"
                    done
                fi
            fi
        else
            # Single batched probe: find related tests for ALL source files at once
            # (replaces per-file jest --listTests loop for speed)
            RELATED_PROBE_LOG="$TMPDIR/validate-related-tests-${PKG_TYPE}-${PKG_NAME_SAFE}-$$.log"
            if ! run_jest_exec "$PKG_PATH" --listTests --findRelatedTests $ABS_SOURCE_FILES --passWithNoTests >"$RELATED_PROBE_LOG" 2>&1; then
                RAW_RELATED="$(cat "$RELATED_PROBE_LOG" 2>/dev/null || true)"
                rm -f "$RELATED_PROBE_LOG"
                echo "    ERROR: Jest failed while probing tests for package: $PKG_PATH"
                echo "    Output: $RAW_RELATED"
                exit 1
            fi

            # Filter to only actual file paths (lines starting with /)
            RELATED=$(grep '^/' "$RELATED_PROBE_LOG" || true)
            rm -f "$RELATED_PROBE_LOG"

            if [ -z "$RELATED" ]; then
                # No tests found for any file in this package batch
                for sf in $SOURCE_FILES; do
                    echo "    WARN: No tests found for: $sf"
                    MISSING_TESTS=$((MISSING_TESTS + 1))
                    MISSING_FILES="$MISSING_FILES $sf"
                done
            else
                RELATED_COUNT=$(echo "$RELATED" | sed '/^$/d' | wc -l | tr -d ' ')
                if [ "$RELATED_COUNT" -gt "$RELATED_TEST_LIMIT" ]; then
                    echo "    INFO: Related test set size $RELATED_COUNT exceeds limit $RELATED_TEST_LIMIT."
                    echo "    Running source-adjacent tests to avoid full-sweep behavior..."

                    ADJACENT_TESTS=$(find_source_adjacent_tests "$PKG_PATH" "$PKG_TYPE" "$PKG_NAME" "$SOURCE_FILES")
                    if [ -n "$ADJACENT_TESTS" ]; then
                        echo "    Source-adjacent tests:$ADJACENT_TESTS"
                        if ! JEST_ALLOW_PARTIAL_COVERAGE=1 JEST_DISABLE_COVERAGE_THRESHOLD=1 run_jest_exec "$PKG_PATH" --runTestsByPath $ADJACENT_TESTS --maxWorkers=2 2>&1; then
                            echo "    FAIL: Source-adjacent tests failed in $PKG_PATH"
                            exit 1
                        fi
                    else
                        echo "    WARN: No source-adjacent tests found; falling back to related tests."
                        if ! JEST_ALLOW_PARTIAL_COVERAGE=1 JEST_DISABLE_COVERAGE_THRESHOLD=1 run_jest_exec "$PKG_PATH" --findRelatedTests $ABS_SOURCE_FILES --maxWorkers=2 2>&1; then
                            echo "    FAIL: Tests failed in $PKG_PATH"
                            exit 1
                        fi
                    fi
                else
                    # Tests found — run them (coverage thresholds relaxed)
                    echo "    Running related tests for files (coverage thresholds relaxed)..."
                    if ! JEST_ALLOW_PARTIAL_COVERAGE=1 JEST_DISABLE_COVERAGE_THRESHOLD=1 run_jest_exec "$PKG_PATH" --findRelatedTests $ABS_SOURCE_FILES --maxWorkers=2 2>&1; then
                        echo "    FAIL: Tests failed in $PKG_PATH"
                        exit 1
                    fi
                fi
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

# 7. Ideas-go-faster contract drift checks
echo ""
echo "> Ideas-go-faster contract checks..."
if [ -x "./scripts/check-ideas-go-faster-contracts.sh" ]; then
    if ! ./scripts/check-ideas-go-faster-contracts.sh; then
        echo "FAIL: ideas-go-faster contract checks failed"
        exit 1
    fi
    echo "OK: ideas-go-faster contract checks passed"
else
    echo "INFO: scripts/check-ideas-go-faster-contracts.sh not found; skipping."
fi

# 8. Summary
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
