# Jest Configuration Baselines

This directory contains baseline Jest configuration snapshots for all packages and apps in the monorepo. These baselines are used during the Jest preset consolidation effort to ensure that migrations don't unintentionally change behavior.

## Purpose

These baseline snapshots serve several critical purposes:

1. **Migration Safety**: Compare current Jest configs against known-good baselines before and after migration
2. **Regression Detection**: Identify unintended configuration changes during refactoring
3. **Documentation**: Provide a historical record of Jest configuration at the start of consolidation
4. **Validation**: Ensure the new preset-based configs produce equivalent behavior to the original configs

## What's Captured

Each baseline file contains the full resolved Jest configuration for a package/app, including:

- `moduleNameMapper` - Module resolution and path mappings
- `transform` - File transformations (TypeScript, JSX, etc.)
- `setupFilesAfterEnv` - Test environment setup files
- `coverageDirectory` - Coverage output location
- `testMatch` - Test file patterns
- `coveragePathIgnorePatterns` - Files excluded from coverage
- `collectCoverageFrom` - Files included in coverage
- And all other Jest configuration options

The configuration is captured using `jest --showConfig`, which shows the fully resolved config after all merging and processing.

## Baseline Files

Current baselines (captured 2026-01-15):

- `packages-ui-config.json` - @acme/ui package
- `packages-email-config.json` - @acme/email package
- `packages-types-config.json` - @acme/types package
- `packages-tailwind-config-config.json` - @acme/tailwind-config package
- `packages-platform-core-config.json` - @acme/platform-core package
- `packages-page-builder-core-config.json` - @acme/page-builder-core package
- `packages-page-builder-ui-config.json` - @acme/page-builder-ui package
- `packages-cms-marketing-config.json` - @acme/cms-marketing package
- `packages-templates-config.json` - @acme/templates package
- `packages-template-app-config.json` - @acme/template-app package
- `apps-cms-config.json` - CMS app
- `apps-api-config.json` - API app
- `apps-dashboard-config.json` - Dashboard app
- `apps-reception-config.json` - Reception app
- `apps-cover-me-pretty-config.json` - Cover Me Pretty app

## How to Regenerate Baselines

If you need to regenerate the baseline snapshots (e.g., after intentional config changes), run:

```bash
cd /Users/petercowling/base-shop
./scripts/capture-jest-baselines.sh
```

This script will:
1. Iterate through all packages/apps with `jest.config.cjs` files
2. Run `jest --showConfig` in each package directory
3. Capture the complete JSON output to a file
4. Save the baseline to this directory

**Note**: Only regenerate baselines when you intentionally want to update the reference point. During migration, you should compare against existing baselines, not regenerate them.

## How to Compare Current Config Against Baseline

### Manual Comparison

To manually compare the current configuration of a package against its baseline:

```bash
# Example: Check packages/ui
cd /Users/petercowling/base-shop/packages/ui
npx jest --showConfig 2>/dev/null > /tmp/current-config.json

# Compare against baseline
diff /Users/petercowling/base-shop/test/jest-baselines/packages-ui-config.json /tmp/current-config.json
```

### Automated Comparison

Use the migration check script for automated comparison:

```bash
cd /Users/petercowling/base-shop
./scripts/jest-migration-check.sh
```

This script will:
1. Compare current configs against baselines for all packages
2. Report differences in key configuration fields
3. Exit with non-zero status if significant differences are found
4. Highlight critical changes that could affect test behavior

See `scripts/jest-migration-check.sh` for more details.

## What to Look For in Comparisons

When comparing configs, pay special attention to these fields:

### Critical Fields (Changes likely indicate problems)
- `moduleNameMapper` - Affects module resolution
- `transform` - Affects how files are processed
- `setupFilesAfterEnv` - Affects test environment initialization
- `testMatch` / `testRegex` - Affects which tests run
- `testEnvironment` - Affects test execution environment

### Important Fields (Changes may be acceptable)
- `coverageDirectory` - Output location (may change intentionally)
- `collectCoverageFrom` - Coverage scope (may be normalized)
- `cacheDirectory` - Cache location (may vary)
- `rootDir` / `cwd` - Working directories (may be normalized)

### Ignore These Fields
- `id` - Unique config identifier (always changes)
- Absolute paths that just change due to directory restructure

## Migration Workflow

During Jest preset consolidation, follow this workflow:

1. **Capture baseline** (if not already done)
   ```bash
   ./scripts/capture-jest-baselines.sh
   ```

2. **Make migration changes** to jest.config.cjs files

3. **Check for differences**
   ```bash
   ./scripts/jest-migration-check.sh
   ```

4. **Review differences** - Ensure any changes are intentional and documented

5. **Run tests** to verify behavior hasn't changed
   ```bash
   pnpm --filter <package> test
   ```

6. **Update baseline** (only if changes are intentional)
   ```bash
   # For a specific package
   cd packages/ui
   npx jest --showConfig 2>/dev/null > /Users/petercowling/base-shop/test/jest-baselines/packages-ui-config.json
   ```

## Troubleshooting

### jest --showConfig fails

If `jest --showConfig` fails for a package:
- Check that `jest.config.cjs` is valid
- Ensure all dependencies are installed (`pnpm install`)
- Look for syntax errors in the config file
- Check that all referenced files/paths exist

### Differences in absolute paths

Absolute paths will naturally differ between machines. Focus on:
- Relative path structure
- Module name mappings (the patterns, not resolved paths)
- Transform configurations

### Large diffs in moduleNameMapper

The moduleNameMapper array can be large. Use tools to focus on semantic changes:
```bash
# Extract just the patterns (ignore resolved paths)
jq '.configs[0].moduleNameMapper | map(.[0])' baseline.json > baseline-patterns.json
jq '.configs[0].moduleNameMapper | map(.[0])' current.json > current-patterns.json
diff baseline-patterns.json current-patterns.json
```

## Related Documentation

- Main Jest consolidation plan: `docs/plans/jest-preset-consolidation-plan.md`
- Jest configuration reference: https://jestjs.io/docs/configuration
- Monorepo testing guide: `__tests__/docs/testing.md`

---

**Created**: 2026-01-15
**Created by**: Claude Opus 4.5
**Last updated**: 2026-01-15
**Status**: Active
