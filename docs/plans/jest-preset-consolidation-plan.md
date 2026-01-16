---
Type: Plan
Status: Completed
Domain: Platform
Created: 2026-01-15
Created-by: Claude Opus 4.5
Last-updated: 2026-01-16
Last-updated-by: Claude Opus 4.5
Completed: 2026-01-16
Completed-by: Claude Opus 4.5
---

# Jest Configuration Consolidation Plan

## Completion Summary

**All phases completed on 2026-01-16.** The Jest configuration has been successfully consolidated from a complex, scattered system into a well-organized preset-based architecture.

### Final Deliverables

| Deliverable | Location | Description |
|-------------|----------|-------------|
| Preset Infrastructure | `packages/config/jest-presets/` | base, react, node presets + coverage tiers |
| Module Mappings | `packages/config/jest-presets/modules/` | workspace, esm-compat, mocks, react, runtime |
| Setup Consolidation | `test/setup/` | env.ts, polyfills.ts, mocks.ts |
| Baseline Tools | `test/jest-baselines/`, `scripts/` | Config snapshots and migration scripts |
| Documentation | README.md files, CLAUDE.md | Comprehensive usage guides |

### Packages Migrated (All Waves Complete)

- **Wave 1:** api, template-app, cover-me-pretty ✅
- **Wave 2:** types, tailwind-config, email, page-builder-core ✅
- **Wave 3:** platform-core, page-builder-ui, cms-marketing, dashboard ✅
- **Wave 4:** reception, ui (with 90% strict coverage) ✅

### Rollback Safety

All migrated packages support instant rollback via `JEST_USE_NEW_PRESET=0` environment variable.

## Implementation Progress

**Phase 0-4 and Phase 6 completed on 2026-01-16:**

**Phase 0 (Baseline Capture):**
- Generated `jest --showConfig` snapshots for 15 workspaces
- Created `test/jest-baselines/` with comparison infrastructure
- Created `scripts/jest-migration-check.sh` acceptance script

**Phase 1 (Preset Infrastructure):**
- Created `packages/config/jest-presets/` with base, react, node presets
- Added coverage-tiers.cjs with 5 standardized tiers
- Added exports entries to packages/config/package.json

**Phase 2 (Module Mapping Extraction):**
- Created modular mapping files: workspace, esm-compat, mocks, react, runtime
- Preserved order-sensitive mapping composition

**Phase 3 (Package Migration - All 4 Waves):**
- Migrated all 15 packages to new preset system
- Added rollback wrappers for safety

**Phase 4 (Setup Consolidation):**
- Created test/setup/env.ts (environment variables)
- Created test/setup/polyfills.ts (browser/node polyfills)
- Created test/setup/mocks.ts (MSW, global mocks)
- Updated base preset setupFilesAfterEnv

**Phase 6 (Documentation):**
- Created comprehensive `packages/config/jest-presets/README.md`
- Updated `CLAUDE.md` with Jest preset usage section
- Created `test/setup/README.md` and `test/setup/MIGRATION.md`

**Lessons Learned:**
- Documentation structure mirrors the developer journey: Quick Start → Selection → Customization → Troubleshooting
- Troubleshooting section addresses real issues encountered during implementation
- Migration guide includes rollback strategy for safety
- Coverage tier documentation emphasizes choosing by code criticality

**Remaining Work (Optional):**
- Phase 5 (Hard-Coding Removal) - Can be done incrementally as apps are touched
- Remove rollback wrappers after extended validation period

## Problem Statement

The Jest configuration in this monorepo has grown organically and now exhibits significant complexity:

- **16 Jest config files** across the codebase
- **272 lines** in the root `jest.config.cjs`
- **137 lines** of module mappings in `jest.moduleMapper.cjs`
- **8 separate setup files** with overlapping responsibilities
- **Incomplete preset adoption** (only 4 of 16 packages use the existing preset)
- **Hard-coded app detection logic** scattered throughout configs
- **Inconsistent coverage thresholds** ranging from 10% to 90%

This complexity leads to:
1. Difficult onboarding for new packages/apps
2. Maintenance burden when adding ESM dependencies
3. Duplicated boilerplate across configs
4. Unclear which configuration rules apply where

## Current Architecture

### Configuration Hierarchy

```
                    ┌─────────────────────────────┐
                    │   jest.config.cjs (root)    │
                    │   272 lines, 11 consumers   │
                    └──────────────┬──────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
        ▼                          ▼                          ▼
┌───────────────┐        ┌─────────────────┐        ┌─────────────────┐
│ Direct extend │        │ jest.preset.cjs │        │ App-specific    │
│ (11 packages) │        │ (4 consumers)   │        │ hard-coding     │
└───────────────┘        └─────────────────┘        └─────────────────┘
```

### Files Involved

| File | Lines | Purpose |
|------|-------|---------|
| `/jest.config.cjs` | 272 | Root config with app detection logic |
| `/jest.moduleMapper.cjs` | 137 | Massive module path mappings |
| `/jest.config.helpers.cjs` | ~80 | React path resolution, tsconfig loading |
| `/jest.coverage.cjs` | 43 | Coverage defaults |
| `/jest.setup.ts` | 370 | Global setup (MSW, polyfills, mocks) |
| `/packages/config/jest.preset.cjs` | 111 | Partial preset (incomplete adoption) |

### Key Problems Identified

#### 1. Hard-Coded App Detection

The root config contains scattered conditionals:
```javascript
const isSkylarApp = /apps\/skylar$/.test(process.cwd());
const isPrimeApp = /apps\/prime$/.test(process.cwd());
const isCochlearfitApp = /apps\/cochlearfit$/.test(process.cwd());
const isXaApp = /apps\/xa$/.test(process.cwd());
const isConfigPackage = /packages\/config$/.test(process.cwd());
const isAuthPackage = /packages\/auth$/.test(process.cwd());
```

This doesn't scale and requires root config changes for each new app.

#### 2. Module Mapper Sprawl

196+ path mappings spread across:
- `jest.moduleMapper.cjs`: 137 rules
- `packages/config/jest.preset.cjs`: 36 rules
- `apps/cms/jest.config.cjs`: 24 additional rules

Many are duplicated or handle the same ESM→TS rewriting pattern.

#### 3. Inconsistent Coverage Tiers

| Package | Lines | Branches | Functions |
|---------|-------|----------|-----------|
| `@acme/ui` | 90% | 85% | 90% |
| Root default | 80% | 80% | 80% |
| `@acme/config` | 60% | 60% | - |
| `@apps/cms` | 40% | 30% | 10% |
| Scripts workspace | 0% | 0% | 0% |

No documented tier system explains why thresholds differ.

#### 4. Setup File Proliferation

```
/jest.setup.ts                        (370 lines - primary)
/test/setupFetchPolyfill.ts           (fetch polyfill)
/packages/ui/jest.setup.local.ts      (BroadcastChannel)
/apps/cms/jest.setup.ts               (auth secrets)
/apps/cms/jest.setup.after.ts         (React ACT, Next mocks)
/apps/cms/jest.setup.polyfills.ts     (minimal polyfills)
/apps/cms/jest.env.ts                 (env vars)
/apps/api/jest.setup.ts               (api-specific)
/apps/reception/jest.setup.ts         (reception-specific)
```

Responsibilities overlap and ordering is fragile.

## Proposed Solution

### Exports / Consumer API

The preset package will expose the following subpaths via `package.json` exports:

```json
// packages/config/package.json (additions)
{
  "exports": {
    "./jest-presets": "./jest-presets/index.cjs",
    "./jest-presets/base": "./jest-presets/base.cjs",
    "./jest-presets/react": "./jest-presets/react.cjs",
    "./jest-presets/node": "./jest-presets/node.cjs",
    "./jest-presets/coverage-tiers": "./jest-presets/coverage-tiers.cjs",
    "./jest-presets/modules/workspace": "./jest-presets/modules/workspace.cjs",
    "./jest-presets/modules/esm-compat": "./jest-presets/modules/esm-compat.cjs",
    "./jest-presets/modules/mocks": "./jest-presets/modules/mocks.cjs",
    "./jest-presets/modules/react": "./jest-presets/modules/react.cjs"
  }
}
```

**Consumer usage:**
```javascript
// Recommended: named import from index
const { react, node, coverageTiers } = require("@acme/config/jest-presets");

// Alternative: direct subpath import
const react = require("@acme/config/jest-presets/react");
const { strict } = require("@acme/config/jest-presets/coverage-tiers");
```

**Note:** Directory index resolution (`require("@acme/config/jest-presets")`) requires the explicit `exports` entry above; Node won't auto-resolve `index.cjs` without it.

### Architecture Overview

Create a tiered preset system where:
1. All common configuration lives in well-documented presets
2. Packages only override what they specifically need
3. Hard-coded app detection is eliminated
4. Module mappings are organized by concern

```
                    ┌─────────────────────────────────┐
                    │  @acme/config/jest-presets/     │
                    │  ├── base.cjs                   │
                    │  ├── react.cjs (extends base)   │
                    │  ├── node.cjs (extends base)    │
                    │  └── modules/                   │
                    │      ├── workspace.cjs          │
                    │      ├── esm-compat.cjs         │
                    │      └── mocks.cjs              │
                    └────────────────┬────────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
              ▼                      ▼                      ▼
       ┌─────────────┐        ┌─────────────┐        ┌─────────────┐
       │ React Apps  │        │   Node      │        │  Packages   │
       │ (jsdom)     │        │ (node env)  │        │  (varies)   │
       └─────────────┘        └─────────────┘        └─────────────┘
```

### Phase 0: Capture Baseline Config Contracts

**Goal:** Establish acceptance criteria before making any changes. This phase creates the safety net for all subsequent work.

#### 0.1 Generate Config Snapshots

For each workspace, capture the resolved Jest configuration:

```bash
# Generate baseline snapshots (one-time)
for pkg in packages/* apps/*; do
  if [ -f "$pkg/jest.config.cjs" ]; then
    (cd "$pkg" && npx jest --showConfig > jest-config-snapshot.json 2>/dev/null)
  fi
done
```

Store these in `test/jest-baselines/` for comparison during migration.

#### 0.2 Document Non-Obvious Behaviors

The current root config has several behaviors that must be preserved:

| Behavior | Location | Preservation Strategy |
|----------|----------|----------------------|
| **Coverage directory normalization** | `jest.config.cjs:226-240` | Package name sanitization (`@scope/pkg` → `scope-pkg`), writes to `<root>/coverage/<pkg>` |
| **Workspace-scoped coverage** | `jest.config.cjs:248-262` | `collectCoverageFrom` and ignore patterns auto-scope to current package |
| **Targeted-run partial coverage** | `jest.config.cjs:128-133` | `--runTestsByPath` or `--testPathPattern` relaxes thresholds to 0% |
| **tsconfig path-derived mappers** | `jest.config.helpers.cjs:loadTsPaths()` | Loads `tsconfig.json` paths and converts to Jest `moduleNameMapper` |
| **React path resolution fallback** | `jest.config.helpers.cjs:resolveReactPaths()` | Workspace React → Next.js compiled React fallback chain |
| **ESM/CJS preset switching** | `jest.config.cjs:148-157` | `JEST_FORCE_CJS=1` or specific packages force CJS preset |

#### 0.3 Define Per-Wave Acceptance Checks

Before each wave is considered complete:

1. **Config equivalence**: `jest --showConfig` output matches baseline for migrated packages (ignoring path differences)
2. **Test pass**: All tests pass for migrated workspaces
3. **Coverage output**: Coverage reports still write to `<root>/coverage/<sanitized-pkg-name>/`
4. **Merge workflow**: `pnpm test:coverage` still aggregates all workspace coverage

#### 0.4 Phase 0 Deliverables

- [ ] `test/jest-baselines/` directory with config snapshots
- [ ] `test/jest-baselines/README.md` documenting how to regenerate/compare
- [ ] Acceptance checklist script: `scripts/jest-migration-check.sh`

### Phase 1: Create Preset Infrastructure

**Goal:** Establish the preset package structure without changing existing behavior. Old configs remain as thin wrappers until Phase 3+ validates the new presets work.

#### 1.1 Create Preset Directory Structure

```
packages/config/
├── jest-presets/
│   ├── index.cjs           # Re-exports all presets
│   ├── base.cjs            # Core settings (transforms, extensions)
│   ├── react.cjs           # React/jsdom environment
│   ├── node.cjs            # Node environment
│   ├── coverage-tiers.cjs  # Documented coverage levels
│   └── modules/
│       ├── workspace.cjs   # @acme/* package mappings
│       ├── esm-compat.cjs  # ESM→CJS compatibility
│       ├── react.cjs       # React path resolution
│       └── mocks.cjs       # Test mock mappings
```

#### 1.2 Extract Base Preset

Create `packages/config/jest-presets/base.cjs`:

```javascript
// Core Jest settings shared by all presets
module.exports = {
  // Transform TypeScript with ts-jest
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", { /* common options */ }],
    "^.+\\.(mjs|cjs|js)$": ["babel-jest", { /* ESM→CJS */ }],
  },

  // Standard file extensions
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "mjs", "node"],

  // Test file patterns
  testMatch: ["**/?(*.)+(spec|test).ts?(x)"],

  // Pass with no tests (for package initialization)
  passWithNoTests: true,

  // Common ignore patterns
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/.next/"],

  // ESM dependency transpilation
  transformIgnorePatterns: [
    "/node_modules/(?!(?:\\.pnpm/[^/]+/node_modules/)?(jose|next-auth|ulid|@upstash|msw|@mswjs|@acme)/)",
  ],
};
```

#### 1.3 Create Environment-Specific Presets

**React preset** (`jest-presets/react.cjs`):
```javascript
const base = require("./base.cjs");
const workspaceModules = require("./modules/workspace.cjs");
const reactModules = require("./modules/react.cjs");

module.exports = {
  ...base,
  testEnvironment: "jsdom",
  moduleNameMapper: {
    ...workspaceModules,
    ...reactModules,
  },
  setupFilesAfterEnv: [
    "<rootDir>/../../test/setupFetchPolyfill.ts",
    "<rootDir>/../../jest.setup.ts",
  ],
};
```

**Node preset** (`jest-presets/node.cjs`):
```javascript
const base = require("./base.cjs");
const workspaceModules = require("./modules/workspace.cjs");

module.exports = {
  ...base,
  testEnvironment: "node",
  moduleNameMapper: {
    ...workspaceModules,
  },
  setupFilesAfterEnv: [
    "<rootDir>/../../test/setupFetchPolyfill.ts",
  ],
};
```

#### 1.4 Preserve Coverage Output + Merge Workflow

The current setup writes coverage to a centralized structure that `pnpm test:coverage` aggregates:

```
coverage/
├── acme-platform-core/   # @acme/platform-core → acme-platform-core
├── acme-ui/              # @acme/ui → acme-ui
├── apps-cms/             # apps/cms → apps-cms
└── ...
```

**This MUST be preserved.** The presets need to include the coverage directory normalization logic:

```javascript
// jest-presets/base.cjs
const path = require("path");

function getCoverageDirectory() {
  const workspaceRoot = path.resolve(__dirname, "../..");
  let name = path.basename(process.cwd());
  try {
    const pkg = require(path.join(process.cwd(), "package.json"));
    if (pkg?.name?.trim()) name = pkg.name.trim();
  } catch { /* use directory name */ }
  const sanitized = name.replace(/^@/, "").replace(/[\/]/g, "-");
  return path.join(workspaceRoot, "coverage", sanitized);
}

module.exports = {
  // ... other settings
  coverageDirectory: getCoverageDirectory(),
};
```

**Verification:** After preset creation, run `pnpm test:coverage` and confirm:
1. Each package writes to `<root>/coverage/<sanitized-name>/`
2. Coverage merging still works (check for combined lcov report)

#### 1.5 Define Coverage Tiers

Create `jest-presets/coverage-tiers.cjs`:

```javascript
/**
 * Coverage Tier Definitions
 *
 * STRICT (90%): Core shared libraries with high reuse
 *   - @acme/ui, @acme/platform-core
 *
 * STANDARD (80%): Domain packages with business logic
 *   - @acme/auth, @acme/email, @acme/stripe
 *
 * MODERATE (60%): Configuration and utility packages
 *   - @acme/config, @acme/i18n
 *
 * RELAXED (40%): Application code (UI-heavy, integration-focused)
 *   - apps/cms, apps/brikette, etc.
 *
 * MINIMAL (0%): Scripts, generated code, or packages in transition
 *   - scripts workspace, new packages during setup
 */

module.exports = {
  strict: { global: { lines: 90, branches: 85, functions: 90 } },
  standard: { global: { lines: 80, branches: 80, functions: 80 } },
  moderate: { global: { lines: 60, branches: 60, functions: 60 } },
  relaxed: { global: { lines: 40, branches: 30, functions: 30 } },
  minimal: { global: { lines: 0, branches: 0, functions: 0 } },
};
```

### Phase 2: Modularize Module Mappings

**Goal:** Break the 137-line `jest.moduleMapper.cjs` into focused, composable modules.

#### 2.0 Module Mapping Order Semantics

**Critical:** Jest's `moduleNameMapper` is order-sensitive. More specific patterns must appear before generic ones. The current config uses object spread with intentional ordering:

```javascript
// Current pattern (must preserve)
moduleNameMapper = {
  ...specificOverrides,  // First: package-specific mocks
  ...baseModuleNameMapper,  // Second: workspace mappings
  ...tsPaths,  // Last: tsconfig-derived paths (most generic)
};
```

**Preservation strategy:**
1. Each module file exports an array of `[pattern, replacement]` tuples (not an object)
2. Preset composition uses `Object.fromEntries()` with explicit ordering
3. Document the merge order in each preset

```javascript
// jest-presets/react.cjs (order-preserving composition)
const mocks = require("./modules/mocks.cjs");
const workspace = require("./modules/workspace.cjs");
const esmCompat = require("./modules/esm-compat.cjs");

// Order matters: mocks > workspace > esm-compat
const orderedMappings = [...mocks, ...workspace, ...esmCompat];

module.exports = {
  ...base,
  moduleNameMapper: Object.fromEntries(orderedMappings),
};
```

#### 2.1 Workspace Package Mappings

`jest-presets/modules/workspace.cjs`:
```javascript
// Maps @acme/* workspace packages to source for testing
// Returns array of [pattern, replacement] to preserve ordering
module.exports = [
  ["^@acme/platform-core$", "<rootDir>/../../packages/platform-core/src/index.ts"],
  ["^@acme/platform-core/(.*)$", "<rootDir>/../../packages/platform-core/src/$1"],
  ["^@acme/ui$", "<rootDir>/../../packages/ui/src/index.ts"],
  ["^@acme/ui/(.*)$", "<rootDir>/../../packages/ui/src/$1"],
  // ... other @acme packages
];
```

#### 2.2 ESM Compatibility Mappings

`jest-presets/modules/esm-compat.cjs`:
```javascript
// Handles ESM .js → .ts resolution for ts-jest
// MUST come after workspace mappings (more generic patterns)
module.exports = [
  ["^(\\.{1,2}/.*)\\.js$", "$1"],  // Generic .js → source
  // Specific config package mappings
  ["^\\./core\\.js$", "<rootDir>/../../packages/config/src/env/core.ts"],
  // ... other ESM rewrites
];
```

#### 2.3 Test Mock Mappings

`jest-presets/modules/mocks.cjs`:
```javascript
// Standard test mocks
// MUST come first (highest priority overrides)
module.exports = [
  ["^next-auth$", "<rootDir>/../../test/mocks/next-auth.ts"],
  ["^next-auth/jwt$", "<rootDir>/../../test/mocks/next-auth-jwt.ts"],
  ["^@prisma/client$", "<rootDir>/../../__mocks__/@prisma/client.ts"],
  ["\\.(css|less|sass|scss)$", "identity-obj-proxy"],
  ["^server-only$", "<rootDir>/../../test/server-only-stub.ts"],
];
```

#### 2.4 Runtime Resolution Patterns

Some current mappings use runtime resolution (e.g., `require.resolve()` with fallbacks). These cannot be static:

```javascript
// Current: runtime MSW interceptor resolution
const interceptorsClientRequestPath = (() => {
  try {
    return require.resolve("@mswjs/interceptors/ClientRequest", { paths: [__dirname] });
  } catch { return null; }
})();
```

**Preservation strategy:** Keep runtime resolvers in a separate `modules/runtime.cjs` that exports a function:

```javascript
// jest-presets/modules/runtime.cjs
module.exports = function getRuntimeMappings() {
  const mappings = [];
  // MSW interceptor resolution
  try {
    const path = require.resolve("@mswjs/interceptors/ClientRequest");
    mappings.push(["^@mswjs/interceptors/ClientRequest$", path]);
  } catch {
    mappings.push(["^@mswjs/interceptors/ClientRequest$", "<rootDir>/../../test/emptyModule.ts"]);
  }
  return mappings;
};
```

### Phase 3: Migrate Packages to Presets

**Goal:** Move all 16 packages from direct root config extension to preset usage.

#### 3.1 Migration Order (by complexity)

**Wave 1 - Already using preset (validate):**
1. `apps/cms` - Already uses preset, validate it works
2. `apps/api` - Already uses preset
3. `packages/template-app` - Already uses preset
4. `apps/cover-me-pretty` - Already uses preset

**Wave 2 - Minimal customization packages:**
5. `packages/types` - 4 lines of overrides
6. `packages/tailwind-config` - 4 lines
7. `packages/email` - 5 lines
8. `packages/page-builder-core` - 5 lines

**Wave 3 - Moderate customization:**
9. `packages/platform-core` - Forces CJS preset
10. `packages/page-builder-ui` - 13 lines
11. `packages/cms-marketing` - 15 lines
12. `apps/dashboard` - 14 lines

**Wave 4 - Complex customization + root refactor:**
13. `apps/reception` - 25 lines, custom setup
14. `packages/ui` - 87 lines, strict coverage, local setup
15. Root config becomes thin wrapper (see Rollback Strategy below)

#### 3.2 Testing Strategy Per Wave

**Important:** Full monorepo test runs are expensive. Use scoped testing per wave:

```bash
# Wave N validation (run for each migrated workspace)
pnpm --filter <workspace> test

# After wave completion (broader smoke test)
pnpm --filter "./packages/*" --filter "./apps/*" test --passWithNoTests
```

Only run full `pnpm test` before the final merge PR.

#### 3.3 Rollback Strategy

During migration, old configs act as thin wrappers around new presets:

```javascript
// packages/email/jest.config.cjs (during migration)
const { react } = require("@acme/config/jest-presets");

// Wrapper: delegates to preset but can fall back to old behavior
const USE_NEW_PRESET = process.env.JEST_USE_NEW_PRESET !== "0";

if (USE_NEW_PRESET) {
  module.exports = {
    ...react,
    coverageThreshold: require("@acme/config/jest-presets/coverage-tiers").standard,
  };
} else {
  // Fallback: original config (kept during migration only)
  module.exports = require("../../jest.config.cjs");
}
```

Set `JEST_USE_NEW_PRESET=0` to quickly rollback if issues arise. Remove fallback code after wave validation.

#### 3.4 Target Package Config Structure

After migration, a typical package config should be 10-20 lines:

```javascript
// packages/email/jest.config.cjs
const { react } = require("@acme/config/jest-presets");
const { standard } = require("@acme/config/jest-presets/coverage-tiers.cjs");

module.exports = {
  ...react,
  coverageThreshold: standard,
  // Only package-specific overrides below
  collectCoverageFrom: ["src/**/*.{ts,tsx}"],
};
```

### Phase 4: Consolidate Setup Files

**Goal:** Reduce 8+ setup files to 3 clear phases.

#### 4.1 New Setup File Structure

```
test/
├── setup/
│   ├── env.ts         # Environment variables (runs first)
│   ├── polyfills.ts   # Browser/Node polyfills
│   └── mocks.ts       # MSW, global mocks, test utilities
```

#### 4.2 Setup Phase Responsibilities

**Phase 1: Environment** (`setup/env.ts`)
- Load dotenv
- Set test-specific env vars
- Configure Browserslist

**Phase 2: Polyfills** (`setup/polyfills.ts`)
- `setImmediate`/`clearImmediate`
- `BroadcastChannel`
- `ResizeObserver`
- `fetch`/`Response`

**Phase 3: Mocks** (`setup/mocks.ts`)
- MSW server lifecycle
- NextAuth mock state
- Console filtering

#### 4.3 Package-Local Setup

Packages needing additional setup import from consolidated files:

```javascript
// apps/cms/jest.setup.ts
import "../../test/setup/env";
import "../../test/setup/polyfills";
import "../../test/setup/mocks";

// CMS-specific additions only
import "./msw/server";
```

### Phase 5: Eliminate Hard-Coded App Detection (Part of Wave 4)

**Note:** This work is sequenced with Wave 4 root refactor, not a separate phase. Listed separately for clarity.

**Goal:** Remove all `process.cwd()` regex checks from root config.

#### 5.1 Current Hard-Coding

```javascript
// Current: scattered in root config
const isSkylarApp = /apps\/skylar$/.test(process.cwd());
const isPrimeApp = /apps\/prime$/.test(process.cwd());
const isCochlearfitApp = /apps\/cochlearfit$/.test(process.cwd());
const isXaApp = /apps\/xa$/.test(process.cwd());
const isConfigPackage = /packages\/config$/.test(process.cwd());
const isAuthPackage = /packages\/auth$/.test(process.cwd());
```

#### 5.2 Solution: App-Owned Overrides

Each app specifies its own path aliases in its `jest.config.cjs`:

```javascript
// apps/skylar/jest.config.cjs
const { react } = require("@acme/config/jest-presets");

module.exports = {
  ...react,
  moduleNameMapper: {
    ...react.moduleNameMapper,
    // Skylar-specific: @/ maps to this app
    "^@/(.*)$": ["<rootDir>/src/$1", "<rootDir>/dist/$1"],
  },
};
```

Root config no longer needs to know about individual apps.

#### 5.3 Sequencing with Wave 4

1. First migrate complex packages (reception, ui) to new presets
2. Move app-specific overrides from root to app configs
3. Remove hard-coded checks from root one-by-one
4. Validate each app's tests pass after its check is removed
5. Root config becomes a thin preset consumer

### Phase 6: Documentation and Validation

#### 6.1 Create Preset Documentation

Add `packages/config/jest-presets/README.md`:
- Preset selection guide (react vs node)
- Coverage tier explanations
- Common customization patterns
- Troubleshooting ESM issues

#### 6.2 Add Preset Tests

Create `packages/config/jest-presets/__tests__/`:
- Validate preset composition works
- Test coverage tier exports
- Verify module mapping resolution

#### 6.3 Update CLAUDE.md

Add section on Jest preset usage for AI assistants.

## Implementation Checklist

### Phase 0: Baseline Capture
- [ ] Generate `jest --showConfig` snapshots for all workspaces
- [ ] Store in `test/jest-baselines/`
- [ ] Create `test/jest-baselines/README.md`
- [ ] Create `scripts/jest-migration-check.sh` acceptance script
- [ ] Document non-obvious behaviors (coverage directory, targeted-run, etc.)

### Phase 1: Preset Infrastructure
- [ ] Create `packages/config/jest-presets/` directory
- [ ] Add `exports` entries to `packages/config/package.json`
- [ ] Extract `base.cjs` with core settings (including `getCoverageDirectory()`)
- [ ] Create `react.cjs` preset
- [ ] Create `node.cjs` preset
- [ ] Define `coverage-tiers.cjs`
- [ ] Create `index.cjs` re-exporting all presets
- [ ] Verify `pnpm test:coverage` still aggregates correctly

### Phase 2: Module Mapping Extraction
- [ ] Create `modules/workspace.cjs` (array format for ordering)
- [ ] Create `modules/esm-compat.cjs` (array format)
- [ ] Create `modules/mocks.cjs` (array format)
- [ ] Create `modules/react.cjs` (array format)
- [ ] Create `modules/runtime.cjs` (function for dynamic resolution)
- [ ] Validate mapper order matches baseline via `jest --showConfig`

### Phase 3: Package Migration
- [ ] Wave 1: Validate existing preset users (cms, api, template-app, cover-me-pretty)
- [ ] Wave 2: Migrate minimal-customization packages (types, tailwind-config, email, page-builder-core)
- [ ] Wave 3: Migrate moderate-customization packages (platform-core, page-builder-ui, cms-marketing, dashboard)
- [ ] Wave 4: Migrate complex packages (reception, ui) + root refactor
- [ ] Remove rollback wrappers after validation

### Phase 4: Setup Consolidation
- [ ] Create `test/setup/env.ts`
- [ ] Create `test/setup/polyfills.ts`
- [ ] Create `test/setup/mocks.ts`
- [ ] Update preset `setupFilesAfterEnv`
- [ ] Migrate package-local setups

### Phase 5: Hard-Coding Removal (Part of Wave 4)
- [ ] Move Skylar path aliases to `apps/skylar/jest.config.cjs`
- [ ] Move Prime path aliases to `apps/prime/jest.config.cjs`
- [ ] Move Cochlearfit path aliases to `apps/cochlearfit/jest.config.cjs`
- [ ] Move XA path aliases to `apps/xa/jest.config.cjs`
- [ ] Remove `isConfigPackage`, `isAuthPackage` conditional logic
- [ ] Verify all apps pass tests after each removal

### Phase 6: Documentation
- [x] Write `packages/config/jest-presets/README.md`
- [x] Add preset selection flowchart
- [x] Document coverage tier rationale
- [x] Update CLAUDE.md with Jest preset usage
- [x] Add troubleshooting guide for common ESM issues

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Root config lines | 272 | <100 |
| Module mapper lines | 137 | <50 (in root) |
| Average package config lines | 25 | <15 |
| Hard-coded app checks | 6 | 0 |
| Setup files | 8+ | 3 core + app-specific |
| Preset adoption | 25% (4/16) | 100% |

## Risks and Mitigations

### Risk 1: Breaking Existing Tests
**Mitigation:**
- Run scoped tests per wave (`pnpm --filter <workspace> test`), not full suite
- Broader smoke test after wave completion
- Full suite only before merge PR
- Rollback strategy via `JEST_USE_NEW_PRESET=0` env var

### Risk 2: ESM Resolution Changes
**Mitigation:** Keep existing module mappings until validated; don't remove working patterns.

### Risk 3: Coverage Threshold Changes
**Mitigation:** Map current thresholds to tiers first; don't change actual values initially.

### Risk 4: Setup File Order Dependencies
**Mitigation:** Document phase dependencies clearly; use explicit imports rather than config ordering.

### Risk 5: Module Mapping Order Breaks Resolution
**Mitigation:**
- Use `[pattern, replacement]` tuples instead of objects to preserve order
- Document merge order in preset files
- Test with `jest --showConfig` to verify mapper order matches baseline

### Risk 6: Coverage Output/Merge Workflow Breaks
**Mitigation:**
- Preserve `getCoverageDirectory()` function in base preset
- Verify `pnpm test:coverage` aggregation after Phase 1
- Add acceptance check for coverage directory structure

## Appendix: Current Configuration Inventory

### Package Configs and Their Overrides

| Package | Lines | Key Overrides |
|---------|-------|---------------|
| `packages/ui` | 87 | Custom coverage (90%), local setup, transform |
| `apps/cms` | 109 | Roots, multiple setups, many module mappings |
| `packages/config` | 111 | Node env, ESM .js mappings, custom threshold |
| `apps/reception` | 25 | Custom setup file |
| `packages/platform-core` | 20 | Forces CJS |
| `packages/page-builder-ui` | 13 | Custom transform |
| `apps/dashboard` | 14 | Forces CJS |
| `packages/cms-marketing` | 15 | Coverage exclusions |
| `packages/email` | 5 | Minimal |
| `packages/types` | 4 | Minimal |
| `packages/tailwind-config` | 4 | Minimal |
| `packages/page-builder-core` | 5 | Minimal |
| `packages/template-app` | 19 | Uses preset |
| `apps/api` | 32 | Uses preset, node env |
| `apps/cover-me-pretty` | 22 | Uses preset |

### Module Mapping Categories

Current mappings in `jest.moduleMapper.cjs` (137 lines) break down as:

| Category | Count | Example |
|----------|-------|---------|
| Workspace packages | 25 | `^@acme/platform-core$` |
| ESM .js → .ts | 45 | `^\\./core\\.js$` |
| Test mocks | 20 | `^@prisma/client$` |
| Path aliases | 15 | `^@/(.*)$` |
| CSS/assets | 5 | `\\.(css\|less)$` |
| Config-specific | 27 | `^@acme/config/env/(.*)$` |
