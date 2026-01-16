# Jest Presets

Centralized Jest configuration presets for the Base-Shop monorepo. These presets provide consistent test configuration across all packages and applications while minimizing boilerplate.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Preset Selection Guide](#preset-selection-guide)
- [Coverage Tiers](#coverage-tiers)
- [Module Mapping Architecture](#module-mapping-architecture)
- [Common Customization Patterns](#common-customization-patterns)
- [Troubleshooting](#troubleshooting)
- [Migration Guide](#migration-guide)

## Overview

The preset system provides two main configurations:

- **`react`** - For packages/apps that test React components (uses jsdom)
- **`node`** - For packages/apps that run in Node.js only (no DOM)

Both presets extend a shared `base` configuration that includes:
- TypeScript transformation via ts-jest
- ESM dependency transpilation
- Workspace package resolution
- Coverage directory normalization
- Setup file orchestration

## Quick Start

### For React Components

```javascript
// jest.config.cjs
const { react, coverageTiers } = require("@acme/config/jest-presets");

module.exports = {
  ...react,
  coverageThreshold: coverageTiers.standard,
};
```

### For Node.js Packages

```javascript
// jest.config.cjs
const { node, coverageTiers } = require("@acme/config/jest-presets");

module.exports = {
  ...node,
  coverageThreshold: coverageTiers.moderate,
};
```

## Preset Selection Guide

### Use the `react` preset when:

- Testing React components or hooks
- Code uses DOM APIs (`document`, `window`, etc.)
- Using React Testing Library or similar tools
- Examples: UI components, React-based apps

### Use the `node` preset when:

- Testing server-side code
- No React or DOM dependencies
- Pure business logic, utilities, or Node.js APIs
- Examples: Database models, API clients, utility libraries

### Decision Flowchart

```
Does your code use React or DOM APIs?
├─ Yes → Use `react` preset
│   └─ Provides jsdom environment + React path resolution
└─ No → Use `node` preset
    └─ Lighter Node environment without DOM overhead
```

## Coverage Tiers

The preset system provides five standardized coverage tiers. Choose based on code criticality and test investment:

### `strict` (90/85/90)

**For critical business logic with high test investment**

```javascript
coverageThreshold: coverageTiers.strict
```

Use for:
- Payment processing logic
- Authentication/authorization systems
- Core domain models (cart, orders, inventory)
- Data validation and sanitization

### `standard` (80/80/80)

**Default for most packages**

```javascript
coverageThreshold: coverageTiers.standard
```

Use for:
- UI components with business logic
- API clients and integrations
- Utility libraries
- Service layer code

### `moderate` (60/60/60)

**For packages with partial coverage**

```javascript
coverageThreshold: coverageTiers.moderate
```

Use for:
- Legacy code being brought under test
- Experimental features
- Configuration packages
- Presentation-heavy components

### `relaxed` (40/30/30)

**For low-risk or presentation-only code**

```javascript
coverageThreshold: coverageTiers.relaxed
```

Use for:
- Pure presentation components
- Simple adapters
- Apps (UI-heavy, integration-focused)

### `minimal` (0/0/0)

**No coverage enforcement**

```javascript
coverageThreshold: coverageTiers.minimal
```

Use for:
- Build scripts and tooling
- Packages under active migration
- Temporary exemptions (document why)

## Module Mapping Architecture

The presets compose module name mappings from five sources, applied in priority order:

```
1. Mocks       → Test doubles (next-auth, @prisma/client)
2. Workspace   → @acme/* package resolution
3. ESM Compat  → .js → .ts mappings for ts-jest
4. React       → Ensure single React instance across tests
5. Runtime     → Dynamic resolution (MSW interceptors)
```

**Why order matters:** Jest tries patterns in object iteration order. More specific patterns must come before generic ones.

### Example: Overriding Mappings

```javascript
const { react } = require("@acme/config/jest-presets");

module.exports = {
  ...react,
  moduleNameMapper: {
    ...react.moduleNameMapper,
    // Your overrides come last (highest priority)
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
```

## Common Customization Patterns

### Pattern 1: Add App-Specific Path Aliases

```javascript
const { react } = require("@acme/config/jest-presets");

module.exports = {
  ...react,
  moduleNameMapper: {
    ...react.moduleNameMapper,
    // Map @/ to app src directory
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
```

### Pattern 2: Custom Setup Files

```javascript
const { react } = require("@acme/config/jest-presets");

module.exports = {
  ...react,
  setupFilesAfterEnv: [
    ...react.setupFilesAfterEnv,
    // Add package-specific setup
    "<rootDir>/jest.setup.local.ts",
  ],
};
```

### Pattern 3: Exclude Specific Files from Coverage

```javascript
const { node, coverageTiers } = require("@acme/config/jest-presets");

module.exports = {
  ...node,
  coverageThreshold: coverageTiers.standard,
  collectCoverageFrom: [
    "src/**/*.ts",
    // Exclude generated files
    "!src/**/*.generated.ts",
    // Exclude types-only files
    "!src/types/**",
  ],
};
```

### Pattern 4: Override Transform Configuration

```javascript
const { react } = require("@acme/config/jest-presets");

module.exports = {
  ...react,
  transform: {
    ...react.transform,
    // Use custom transformer for .graphql files
    "^.+\\.graphql$": "@graphql-tools/jest-transform",
  },
};
```

### Pattern 5: Test Multiple Environments

```javascript
// jest.config.cjs
module.exports = {
  projects: [
    {
      displayName: "jsdom",
      ...require("@acme/config/jest-presets").react,
      testMatch: ["**/*.test.tsx"],
    },
    {
      displayName: "node",
      ...require("@acme/config/jest-presets").node,
      testMatch: ["**/*.test.ts"],
    },
  ],
};
```

## Troubleshooting

### ESM Module Resolution Errors

**Symptom:**
```
Cannot find module 'some-package' from 'node_modules/...'
SyntaxError: Unexpected token 'export'
```

**Solution:** The package uses ESM and needs to be transpiled. Add to `transformIgnorePatterns`:

```javascript
const { react } = require("@acme/config/jest-presets");

module.exports = {
  ...react,
  transformIgnorePatterns: [
    // Copy base pattern and add your package
    "/node_modules/(?!(?:\\.pnpm/[^/]+/node_modules/)?(jose|next-auth|ulid|@upstash|msw|@mswjs|your-package)/)",
  ],
};
```

**How to diagnose:**
1. Check if the package has `"type": "module"` in its package.json
2. Look for `.mjs` extensions or `export` statements in the error stack

### Module Path Not Resolving

**Symptom:**
```
Cannot find module '@acme/platform-core' from 'src/myfile.ts'
```

**Solution:** Ensure the workspace mapping exists. Check `modules/workspace.cjs` or add:

```javascript
moduleNameMapper: {
  ...preset.moduleNameMapper,
  "^@acme/my-package$": "<rootDir>/../../packages/my-package/src/index.ts",
}
```

### Coverage Directory Not Found

**Symptom:** `pnpm test:coverage` can't find or merge coverage reports.

**Solution:** The preset automatically normalizes coverage paths. Ensure you're using the preset's `coverageDirectory` (don't override it):

```javascript
const { react } = require("@acme/config/jest-presets");

module.exports = {
  ...react,
  // DON'T override coverageDirectory unless absolutely necessary
  // coverageDirectory: "./coverage", // ❌ WRONG
};
```

### React Hooks Errors in Tests

**Symptom:**
```
Invalid hook call. Hooks can only be called inside the body of a function component.
```

**Solution:** This usually means multiple React instances. The preset handles this, but if you override `moduleNameMapper`, preserve the React path mappings:

```javascript
moduleNameMapper: {
  // Keep React mappings from preset
  ...react.moduleNameMapper,
  // Your custom mappings
}
```

### Setup File Order Issues

**Symptom:** Mocks aren't available or polyfills fail to load.

**Solution:** The preset orchestrates setup in phases:
1. `dotenv/config` (before environment initialization)
2. `test/setup/env.ts` (before environment initialization)
3. `test/setup/polyfills.ts` (after environment initialization)
4. `test/setup/mocks.ts` (after environment initialization)

If adding custom setup, append to `setupFilesAfterEnv`:

```javascript
setupFilesAfterEnv: [
  ...react.setupFilesAfterEnv,
  "<rootDir>/jest.setup.local.ts", // Runs AFTER all preset setup
]
```

### TypeScript Path Aliases Not Working

**Symptom:**
```
Cannot find module '@myalias/something'
```

**Solution:** Jest doesn't read tsconfig paths automatically. Either:

1. Use the `modules/` approach (add to workspace.cjs), or
2. Add explicit moduleNameMapper entries in your config

```javascript
moduleNameMapper: {
  ...preset.moduleNameMapper,
  "^@myalias/(.*)$": "<rootDir>/src/myalias/$1",
}
```

## Migration Guide

### Migrating from Root Config

If your package currently extends `../../jest.config.cjs`, migrate in these steps:

#### Step 1: Identify Your Environment

Determine which preset you need:
- If `testEnvironment: "jsdom"` or testing React → use `react`
- If `testEnvironment: "node"` → use `node`

#### Step 2: Create New Config

```javascript
// Old (before)
module.exports = require("../../jest.config.cjs");

// New (after)
const { react, coverageTiers } = require("@acme/config/jest-presets");

module.exports = {
  ...react,
  coverageThreshold: coverageTiers.standard, // Choose appropriate tier
};
```

#### Step 3: Migrate Custom Overrides

If your old config had customizations, merge them:

```javascript
// Old
module.exports = {
  ...require("../../jest.config.cjs"),
  coverageThreshold: { global: { lines: 70 } },
  testMatch: ["**/*.spec.ts"],
};

// New
const { node, coverageTiers } = require("@acme/config/jest-presets");

module.exports = {
  ...node,
  coverageThreshold: coverageTiers.moderate, // Use tier instead of custom
  testMatch: ["**/*.spec.ts"], // Keep your override
};
```

#### Step 4: Test the Migration

```bash
# Run tests for your package
pnpm --filter <your-package> test

# Run with coverage to verify thresholds
pnpm --filter <your-package> test --coverage
```

#### Step 5: Remove Rollback Wrapper (if present)

During migration, configs may have had rollback wrappers:

```javascript
// Remove this after successful migration
const USE_NEW_PRESET = process.env.JEST_USE_NEW_PRESET !== "0";
if (USE_NEW_PRESET) {
  // Keep this
} else {
  // Delete fallback code
}
```

### Validating Migration Success

After migration, verify:

1. **Tests pass:** `pnpm --filter <package> test`
2. **Coverage works:** `pnpm --filter <package> test --coverage`
3. **Coverage merges:** `pnpm test:coverage` (from root)
4. **Coverage directory correct:** Check `coverage/<sanitized-name>/` exists

### Rollback Strategy

If issues arise, you can temporarily rollback:

```bash
# Use old config
JEST_USE_NEW_PRESET=0 pnpm --filter <package> test
```

Then investigate and fix the issue before fully migrating.

## Architecture Notes

### Coverage Directory Normalization

The preset automatically normalizes coverage output paths:
- Reads `package.json` name (e.g., `@acme/platform-core`)
- Sanitizes: strips `@`, replaces `/` with `-`
- Outputs to: `<root>/coverage/acme-platform-core/`

This ensures `pnpm test:coverage` can find and merge all results.

### Setup File Orchestration

Setup files run in three phases:

| Phase | Files | Purpose | When |
|-------|-------|---------|------|
| 1 | `dotenv/config`, `setup/env.ts` | Load environment variables | Before environment initialization |
| 2 | `setup/polyfills.ts` | Add browser/Node polyfills | After environment initialization |
| 3 | `setup/mocks.ts` | Initialize MSW, global mocks | After environment initialization |

### Module Mapping Composition

Module mappings are defined as arrays of `[pattern, replacement]` tuples to preserve resolution order. At runtime, they're converted to Jest's object format with proper precedence.

See `modules/` directory for individual mapping files:
- `mocks.cjs` - Test doubles for external dependencies
- `workspace.cjs` - @acme/* workspace package mappings
- `esm-compat.cjs` - ESM .js → .ts resolution
- `react.cjs` - React path resolution for single instance
- `runtime.cjs` - Dynamic resolution (MSW, etc.)

## Additional Resources

- **Testing Documentation:** `/__tests__/docs/testing.md`
- **Coverage Configuration:** `/docs/coverage.md`
- **Plan Document:** `/docs/plans/jest-preset-consolidation-plan.md`
- **CLAUDE.md:** `/CLAUDE.md` (Jest preset usage for AI assistants)

## Contributing

When adding ESM dependencies that need transpilation:

1. Update `transformIgnorePatterns` in `base.cjs`
2. Test across multiple packages to ensure it doesn't break existing tests
3. Document the addition in this README's troubleshooting section

When adding workspace packages:

1. Add mapping to `modules/workspace.cjs`
2. Follow the existing pattern: `["^@acme/pkg$", "path"]`
3. Test in a consuming package
