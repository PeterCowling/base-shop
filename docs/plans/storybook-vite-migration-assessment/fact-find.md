---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-02-23
Last-updated: 2026-02-23
Feature-Slug: storybook-vite-migration-assessment
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/storybook-vite-migration-assessment/plan.md
Business-OS-Integration: off
Business-Unit: none
Card-ID: none
direct-inject: true
direct-inject-rationale: User requested  for Storybook webpack dependency and migration assessment.
---

# Storybook Vite Migration Assessment Fact-Find Brief

## Scope
### Summary
This brief assesses why webpack is still present in the repository's Storybook stack and what it would take to migrate Storybook to Vite-backed Next integration safely.

Current state is intentionally mixed:
- Storybook runtime configs are explicitly webpack-builder based.
-  and Vite helpers are installed but not active in the configured Storybook entrypoints.
- A known webpack-only build crash still affects the full Storybook build path.

### Goals
- Confirm exact active webpack coupling points for Storybook.
- Identify whether webpack is removable vs merely reducible at Storybook scope.
- Produce planning-ready migration steps and risk gates for a Vite migration lane.

### Non-goals
- Executing the migration in this fact-find run.
- Removing all webpack usage repo-wide (Cypress and other consumers are out of this lane).
- Reworking Storybook tests/tooling beyond migration assessment requirements.

### Constraints & Assumptions
- Constraints:
  - Storybook CI jobs must stay green (, ) during any migration.
  - Existing Next module stubbing behavior in Storybook must be preserved.
  - Migration must not depend on destructive git operations in shared multi-agent workspace.
- Assumptions:
  -  remains the intended framework target for a future migration.
  - Existing Playwright smoke workflows are the practical acceptance gate for migration safety.

## Evidence Audit (Current State)
### Entry Points
- Root Storybook command routing in [package.json](/Users/petercowling/base-shop/package.json#L76) through [package.json](/Users/petercowling/base-shop/package.json#L91).
- App wrapper scripts in [apps/storybook/package.json](/Users/petercowling/base-shop/apps/storybook/package.json#L5).
- Primary Storybook config in [apps/storybook/.storybook/main.ts](/Users/petercowling/base-shop/apps/storybook/.storybook/main.ts#L17).
- CI Storybook config in [apps/storybook/.storybook-ci/main.ts](/Users/petercowling/base-shop/apps/storybook/.storybook-ci/main.ts#L15).

### Key Modules / Files
-  - active framework  plus explicit , plus webpack plugin/fallback wiring.
-  - same webpack builder and webpack-specific alias/plugin setup for CI config.
-  - Vite config exists but is not attached to active Storybook framework/builder config.
-  - build script intentionally bypasses full build ().
-  - explicitly documents webpack pin and previous Vite rollback.
-  - active docs pin webpack builder and warn against retrying Vite without explicit migration task.
-  - has both  and , plus direct  dev dependency.
-  - CI job contract for Storybook coverage, smoke, and runner flows.
-  - non-wildcard multi-target path aliases (for example ) that can destabilize Vite/SWC path resolution.
-  - explicit prior decision that Storybook webpack builder was out-of-scope in earlier Turbopack migration lane.

### Patterns & Conventions Observed
- Storybook configs are currently hard-pinned to webpack builder () in both local and CI configs.
- A partial migration footprint exists (installed , , Vite config file) but is not wired into execution paths.
- Documentation drift exists: guides still reference older rollback context while package set is now Storybook 10.x.
- Migration posture is currently conservative: CI relies on Playwright smoke and minimal official runner usage.

### Data & Contracts
- Build/test contract:
  - Storybook smoke and interaction tests are defined in [](/Users/petercowling/base-shop/.github/workflows/storybook.yml#L95) and [](/Users/petercowling/base-shop/.github/workflows/storybook.yml#L120).
- Dependency contract:
  - Root devDependencies include both framework packages and direct  pin in [package.json](/Users/petercowling/base-shop/package.json#L286) through [package.json](/Users/petercowling/base-shop/package.json#L383).
- Policy/history contract:
  - Prior repo migration explicitly deferred Storybook webpack removal as separate scope in [](/Users/petercowling/base-shop/docs/plans/turbopack-full-migration/plan.md#L466).

### Dependency & Impact Map
- Upstream dependencies:
  - Storybook framework packages (, ,  core).
  - Next/React stubbing and alias logic in Storybook config.
  - TS path alias policy in .
- Downstream dependents:
  - Local Storybook dev workflows.
  - Storybook CI jobs (, , , optional ) in workflow.
  - Docs and operational runbooks referencing Storybook commands.
- Likely blast radius:
  - High for Storybook developer workflow stability.
  - Medium for CI (jobs are scoped to Storybook-facing surfaces).
  - Low for production Next runtime (Storybook is dev/test tooling surface).

### Test Landscape
#### Test Infrastructure
- Storybook smoke and interaction tests are run via Playwright and Storybook test-runner wrappers from root scripts.
- CI executes 
> cms-monorepo@0.1.0 storybook:smoke:ui /Users/petercowling/base-shop
> cross-env WAIT_ON_TIMEOUT=120000 start-server-and-test "pnpm run storybook:ci" http://localhost:6007 "pnpm exec playwright test apps/storybook/.storybook/test-runner/__tests__/rtl-tokens.test.ts --reporter=list"

1: starting server using command "pnpm run storybook:ci"
and when url "[ 'http://localhost:6007' ]" is responding with HTTP status code 200
WAIT_ON_TIMEOUT is set to 120000
running tests using command "pnpm exec playwright test apps/storybook/.storybook/test-runner/__tests__/rtl-tokens.test.ts --reporter=list"


> cms-monorepo@0.1.0 storybook:ci /Users/petercowling/base-shop
> pnpm --filter @apps/storybook run dev:ci


> @apps/storybook@ dev:ci /Users/petercowling/base-shop/apps/storybook
> storybook dev -p 6007 --ci -c ./.storybook-ci


┌  storybook v10.1.11
│
▲  You are currently using Storybook 10.1.11 but you have packages which
│  are incompatible with it:

│  - @storybook/test@8.6.14 which depends on 8.6.14
│  Repo: ]8;;https://github.com/storybookjs/storybook/tree/next/code/lib/testhttps://github.com/storybookjs/storybook/tree/next/code/lib/...]8;;

│  Please consider updating your packages or contacting the maintainers
│  for compatibility details.

│  For more details on compatibility guidance, see:
│  ]8;;https://github.com/storybookjs/storybook/issues/32836https://github.com/storybookjs/storybook/issues/32836]8;;
│
●  Starting...
│
●  Addon-docs: using MDX3
│
●  Using implicit CSS loaders
│
●  Using SWC as compiler
[addon-coverage] Adding istanbul loader to Webpack config
│
●  Using default Webpack5 setup
[@acme/tailwind-config] ✅  preset imported (cwd: /Users/petercowling/base-shop/apps/storybook)
[@acme/tailwind-config] preset keys [ 'content', 'theme', 'plugins', 'presets' ]
[@acme/tailwind-config] has nested { plugins: true, presets: true }
 ELIFECYCLE  Command failed with exit code 1. and 
> cms-monorepo@0.1.0 test-storybook:runner /Users/petercowling/base-shop
> cross-env WAIT_ON_TIMEOUT=120000 start-server-and-test "pnpm run storybook:ci" http://localhost:6007 "pnpm exec test-storybook --config-dir apps/storybook/.storybook-ci --url http://localhost:6007 --includeTags ci --testTimeout 30000 --maxWorkers 2"

1: starting server using command "pnpm run storybook:ci"
and when url "[ 'http://localhost:6007' ]" is responding with HTTP status code 200
WAIT_ON_TIMEOUT is set to 120000
running tests using command "pnpm exec test-storybook --config-dir apps/storybook/.storybook-ci --url http://localhost:6007 --includeTags ci --testTimeout 30000 --maxWorkers 2"


> cms-monorepo@0.1.0 storybook:ci /Users/petercowling/base-shop
> pnpm --filter @apps/storybook run dev:ci


> @apps/storybook@ dev:ci /Users/petercowling/base-shop/apps/storybook
> storybook dev -p 6007 --ci -c ./.storybook-ci


┌  storybook v10.1.11
│
▲  You are currently using Storybook 10.1.11 but you have packages which
│  are incompatible with it:

│  - @storybook/test@8.6.14 which depends on 8.6.14
│  Repo: ]8;;https://github.com/storybookjs/storybook/tree/next/code/lib/testhttps://github.com/storybookjs/storybook/tree/next/code/lib/...]8;;

│  Please consider updating your packages or contacting the maintainers
│  for compatibility details.

│  For more details on compatibility guidance, see:
│  ]8;;https://github.com/storybookjs/storybook/issues/32836https://github.com/storybookjs/storybook/issues/32836]8;;
│
●  Starting...
│
●  Addon-docs: using MDX3
│
●  Using implicit CSS loaders
│
●  Using SWC as compiler
[addon-coverage] Adding istanbul loader to Webpack config
│
●  Using default Webpack5 setup
[@acme/tailwind-config] ✅  preset imported (cwd: /Users/petercowling/base-shop/apps/storybook)
[@acme/tailwind-config] preset keys [ 'content', 'theme', 'plugins', 'presets' ]
[@acme/tailwind-config] has nested { plugins: true, presets: true }
│ [38;2;255;71;133m╭[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m╮[39m
│ [38;2;255;71;133m│[39m   Storybook ready!                                                         [38;2;255;71;133m│[39m
│ [38;2;255;71;133m│[39m                                                                            [38;2;255;71;133m│[39m
│ [38;2;255;71;133m│[39m   - Local:             http://localhost:6007/                              [38;2;255;71;133m│[39m
│ [38;2;255;71;133m│[39m   - On your network:   http://192.168.1.14:6007/                           [38;2;255;71;133m│[39m
│ [38;2;255;71;133m│[39m                                                                            [38;2;255;71;133m│[39m
│ [38;2;255;71;133m│[39m   [38;2;243;173;56mA new version (10.2.8) is available![39m                                     [38;2;255;71;133m│[39m
│ [38;2;255;71;133m│[39m                                                                            [38;2;255;71;133m│[39m
│ [38;2;255;71;133m│[39m   Upgrade now: [38;2;162;224;94mnpx storybook@latest upgrade[39m                                [38;2;255;71;133m│[39m
│ [38;2;255;71;133m│[39m                                                                            [38;2;255;71;133m│[39m
│ [38;2;255;71;133m│[39m   Read full changelog:                                                     [38;2;255;71;133m│[39m
│ [38;2;255;71;133m│[39m   https://github.com/storybookjs/storybook/blob/main/CHANGELOG.md          [38;2;255;71;133m│[39m
│ [38;2;255;71;133m╰[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m╯[39m
│
●  1.19 s for manager and 38 s for preview
jest-haste-map: duplicate manual mock found: componentStub
  The following files share their name; please delete one of them:
    * <rootDir>/test/__mocks__/componentStub.js
    * <rootDir>/.ts-jest/test/__mocks__/componentStub.js

jest-haste-map: duplicate manual mock found: next-server
  The following files share their name; please delete one of them:
    * <rootDir>/test/__mocks__/next-server.ts
    * <rootDir>/.ts-jest/test/__mocks__/next-server.js

jest-haste-map: duplicate manual mock found: pluginSanityStub
  The following files share their name; please delete one of them:
    * <rootDir>/test/__mocks__/pluginSanityStub.ts
    * <rootDir>/.ts-jest/test/__mocks__/pluginSanityStub.js

jest-haste-map: duplicate manual mock found: currencyContextMock
  The following files share their name; please delete one of them:
    * <rootDir>/test/__mocks__/currencyContextMock.tsx
    * <rootDir>/.ts-jest/test/__mocks__/currencyContextMock.js

jest-haste-map: duplicate manual mock found: react-chartjs-2
  The following files share their name; please delete one of them:
    * <rootDir>/test/__mocks__/react-chartjs-2.ts
    * <rootDir>/.ts-jest/test/__mocks__/react-chartjs-2.js

jest-haste-map: duplicate manual mock found: shadcnDialogStub
  The following files share their name; please delete one of them:
    * <rootDir>/test/__mocks__/shadcnDialogStub.tsx
    * <rootDir>/.ts-jest/test/__mocks__/shadcnDialogStub.js

jest-haste-map: duplicate manual mock found: themeContextMock
  The following files share their name; please delete one of them:
    * <rootDir>/test/__mocks__/themeContextMock.tsx
    * <rootDir>/.ts-jest/test/__mocks__/themeContextMock.js

jest-haste-map: duplicate manual mock found: telemetryMock
  The following files share their name; please delete one of them:
    * <rootDir>/test/__mocks__/telemetryMock.ts
    * <rootDir>/.ts-jest/test/__mocks__/telemetryMock.js

jest-haste-map: duplicate manual mock found: ui-pb-dnd.mock
  The following files share their name; please delete one of them:
    * <rootDir>/test/__mocks__/ui-pb-dnd.mock.ts
    * <rootDir>/.ts-jest/test/__mocks__/ui-pb-dnd.mock.js

jest-haste-map: duplicate manual mock found: ui-palette-add.mock
  The following files share their name; please delete one of them:
    * <rootDir>/test/__mocks__/ui-palette-add.mock.tsx
    * <rootDir>/.ts-jest/test/__mocks__/ui-palette-add.mock.js

jest-haste-map: duplicate manual mock found: ui-shadcn-lite
  The following files share their name; please delete one of them:
    * <rootDir>/test/__mocks__/ui-shadcn-lite.tsx
    * <rootDir>/.ts-jest/test/__mocks__/ui-shadcn-lite.js

jest-haste-map: duplicate manual mock found: undici
  The following files share their name; please delete one of them:
    * <rootDir>/test/__mocks__/undici.ts
    * <rootDir>/.ts-jest/test/__mocks__/undici.js

jest-haste-map: duplicate manual mock found: ui-useFileUpload.mock
  The following files share their name; please delete one of them:
    * <rootDir>/test/__mocks__/ui-useFileUpload.mock.ts
    * <rootDir>/.ts-jest/test/__mocks__/ui-useFileUpload.mock.js

jest-haste-map: duplicate manual mock found: @radix-ui/react-dropdown-menu
  The following files share their name; please delete one of them:
    * <rootDir>/test/__mocks__/@radix-ui/react-dropdown-menu.tsx
    * <rootDir>/.ts-jest/test/__mocks__/@radix-ui/react-dropdown-menu.js

jest-haste-map: duplicate manual mock found: @prisma/client
  The following files share their name; please delete one of them:
    * <rootDir>/__mocks__/@prisma/client.ts
    * <rootDir>/.worktrees/do-not-use/__mocks__/@prisma/client.ts

jest-haste-map: duplicate manual mock found: next/headers
  The following files share their name; please delete one of them:
    * <rootDir>/__mocks__/next/headers.js
    * <rootDir>/.worktrees/do-not-use/__mocks__/next/headers.js

jest-haste-map: duplicate manual mock found: next/image
  The following files share their name; please delete one of them:
    * <rootDir>/__mocks__/next/image.js
    * <rootDir>/.worktrees/do-not-use/__mocks__/next/image.js

jest-haste-map: duplicate manual mock found: next/link
  The following files share their name; please delete one of them:
    * <rootDir>/__mocks__/next/link.js
    * <rootDir>/.worktrees/do-not-use/__mocks__/next/link.js

jest-haste-map: duplicate manual mock found: next/navigation
  The following files share their name; please delete one of them:
    * <rootDir>/__mocks__/next/navigation.js
    * <rootDir>/.worktrees/do-not-use/__mocks__/next/navigation.js

jest-haste-map: duplicate manual mock found: componentStub
  The following files share their name; please delete one of them:
    * <rootDir>/.ts-jest/test/__mocks__/componentStub.js
    * <rootDir>/.worktrees/do-not-use/test/__mocks__/componentStub.js

jest-haste-map: duplicate manual mock found: currencyContextMock
  The following files share their name; please delete one of them:
    * <rootDir>/.ts-jest/test/__mocks__/currencyContextMock.js
    * <rootDir>/.worktrees/do-not-use/test/__mocks__/currencyContextMock.tsx

jest-haste-map: duplicate manual mock found: next-link
  The following files share their name; please delete one of them:
    * <rootDir>/test/__mocks__/next-link.tsx
    * <rootDir>/.worktrees/do-not-use/test/__mocks__/next-link.tsx

jest-haste-map: duplicate manual mock found: next-server
  The following files share their name; please delete one of them:
    * <rootDir>/.ts-jest/test/__mocks__/next-server.js
    * <rootDir>/.worktrees/do-not-use/test/__mocks__/next-server.ts

jest-haste-map: duplicate manual mock found: pluginSanityStub
  The following files share their name; please delete one of them:
    * <rootDir>/.ts-jest/test/__mocks__/pluginSanityStub.js
    * <rootDir>/.worktrees/do-not-use/test/__mocks__/pluginSanityStub.ts

jest-haste-map: duplicate manual mock found: react-chartjs-2
  The following files share their name; please delete one of them:
    * <rootDir>/.ts-jest/test/__mocks__/react-chartjs-2.js
    * <rootDir>/.worktrees/do-not-use/test/__mocks__/react-chartjs-2.ts

jest-haste-map: duplicate manual mock found: shadcnDialogStub
  The following files share their name; please delete one of them:
    * <rootDir>/.ts-jest/test/__mocks__/shadcnDialogStub.js
    * <rootDir>/.worktrees/do-not-use/test/__mocks__/shadcnDialogStub.tsx

jest-haste-map: duplicate manual mock found: telemetryMock
  The following files share their name; please delete one of them:
    * <rootDir>/.ts-jest/test/__mocks__/telemetryMock.js
    * <rootDir>/.worktrees/do-not-use/test/__mocks__/telemetryMock.ts

jest-haste-map: duplicate manual mock found: ui-palette-add.mock
  The following files share their name; please delete one of them:
    * <rootDir>/.ts-jest/test/__mocks__/ui-palette-add.mock.js
    * <rootDir>/.worktrees/do-not-use/test/__mocks__/ui-palette-add.mock.tsx

jest-haste-map: duplicate manual mock found: ui-pb-dnd.mock
  The following files share their name; please delete one of them:
    * <rootDir>/.ts-jest/test/__mocks__/ui-pb-dnd.mock.js
    * <rootDir>/.worktrees/do-not-use/test/__mocks__/ui-pb-dnd.mock.ts

jest-haste-map: duplicate manual mock found: ui-shadcn-lite
  The following files share their name; please delete one of them:
    * <rootDir>/.ts-jest/test/__mocks__/ui-shadcn-lite.js
    * <rootDir>/.worktrees/do-not-use/test/__mocks__/ui-shadcn-lite.tsx

jest-haste-map: duplicate manual mock found: ui-useFileUpload.mock
  The following files share their name; please delete one of them:
    * <rootDir>/.ts-jest/test/__mocks__/ui-useFileUpload.mock.js
    * <rootDir>/.worktrees/do-not-use/test/__mocks__/ui-useFileUpload.mock.ts

jest-haste-map: duplicate manual mock found: undici
  The following files share their name; please delete one of them:
    * <rootDir>/.ts-jest/test/__mocks__/undici.js
    * <rootDir>/.worktrees/do-not-use/test/__mocks__/undici.ts

jest-haste-map: duplicate manual mock found: themeContextMock
  The following files share their name; please delete one of them:
    * <rootDir>/.ts-jest/test/__mocks__/themeContextMock.js
    * <rootDir>/.worktrees/do-not-use/test/__mocks__/themeContextMock.tsx

jest-haste-map: duplicate manual mock found: ui-modal-context
  The following files share their name; please delete one of them:
    * <rootDir>/apps/brikette/src/test/__mocks__/ui-modal-context.tsx
    * <rootDir>/apps/reception/src/test/__mocks__/ui-modal-context.tsx

jest-haste-map: duplicate manual mock found: @radix-ui/react-dropdown-menu
  The following files share their name; please delete one of them:
    * <rootDir>/.ts-jest/test/__mocks__/@radix-ui/react-dropdown-menu.js
    * <rootDir>/.worktrees/do-not-use/test/__mocks__/@radix-ui/react-dropdown-menu.tsx

jest-haste-map: duplicate manual mock found: repo
  The following files share their name; please delete one of them:
    * <rootDir>/apps/cms/__tests__/__mocks__/repo.ts
    * <rootDir>/.worktrees/do-not-use/apps/cms/__tests__/__mocks__/repo.ts

jest-haste-map: duplicate manual mock found: buildCfImageUrl
  The following files share their name; please delete one of them:
    * <rootDir>/apps/brikette/src/test/__mocks__/buildCfImageUrl.ts
    * <rootDir>/.worktrees/do-not-use/apps/brikette/src/test/__mocks__/buildCfImageUrl.ts

jest-haste-map: duplicate manual mock found: config-env
  The following files share their name; please delete one of them:
    * <rootDir>/apps/brikette/src/test/__mocks__/config-env.ts
    * <rootDir>/.worktrees/do-not-use/apps/brikette/src/test/__mocks__/config-env.ts

jest-haste-map: duplicate manual mock found: design-system-primitives
  The following files share their name; please delete one of them:
    * <rootDir>/apps/brikette/src/test/__mocks__/design-system-primitives.ts
    * <rootDir>/.worktrees/do-not-use/apps/brikette/src/test/__mocks__/design-system-primitives.ts

jest-haste-map: duplicate manual mock found: guides-fs
  The following files share their name; please delete one of them:
    * <rootDir>/apps/brikette/src/test/__mocks__/guides-fs.ts
    * <rootDir>/.worktrees/do-not-use/apps/brikette/src/test/__mocks__/guides-fs.ts

jest-haste-map: duplicate manual mock found: loadI18nNs
  The following files share their name; please delete one of them:
    * <rootDir>/apps/brikette/src/test/__mocks__/loadI18nNs.ts
    * <rootDir>/.worktrees/do-not-use/apps/brikette/src/test/__mocks__/loadI18nNs.ts

jest-haste-map: duplicate manual mock found: ui-atoms
  The following files share their name; please delete one of them:
    * <rootDir>/apps/brikette/src/test/__mocks__/ui-atoms.tsx
    * <rootDir>/.worktrees/do-not-use/apps/brikette/src/test/__mocks__/ui-atoms.tsx

jest-haste-map: duplicate manual mock found: ui-config-site
  The following files share their name; please delete one of them:
    * <rootDir>/apps/brikette/src/test/__mocks__/ui-config-site.ts
    * <rootDir>/.worktrees/do-not-use/apps/brikette/src/test/__mocks__/ui-config-site.ts

jest-haste-map: duplicate manual mock found: ui-modal-context
  The following files share their name; please delete one of them:
    * <rootDir>/apps/reception/src/test/__mocks__/ui-modal-context.tsx
    * <rootDir>/.worktrees/do-not-use/apps/brikette/src/test/__mocks__/ui-modal-context.tsx

jest-haste-map: duplicate manual mock found: ui-modal-environment
  The following files share their name; please delete one of them:
    * <rootDir>/apps/brikette/src/test/__mocks__/ui-modal-environment.ts
    * <rootDir>/.worktrees/do-not-use/apps/brikette/src/test/__mocks__/ui-modal-environment.ts

jest-haste-map: duplicate manual mock found: i18n
  The following files share their name; please delete one of them:
    * <rootDir>/apps/brikette/src/test/__mocks__/i18n.ts
    * <rootDir>/.worktrees/do-not-use/apps/brikette/src/test/__mocks__/i18n.ts

jest-haste-map: duplicate manual mock found: resend
  The following files share their name; please delete one of them:
    * <rootDir>/packages/email/src/providers/__mocks__/resend.ts
    * <rootDir>/.worktrees/do-not-use/packages/email/src/providers/__mocks__/resend.ts

jest-haste-map: duplicate manual mock found: useFetchBookingsData
  The following files share their name; please delete one of them:
    * <rootDir>/apps/prime/src/hooks/pureData/__mocks__/useFetchBookingsData.ts
    * <rootDir>/.worktrees/do-not-use/apps/prime/src/hooks/pureData/__mocks__/useFetchBookingsData.ts

jest-haste-map: duplicate manual mock found: useFetchGuestDetails
  The following files share their name; please delete one of them:
    * <rootDir>/apps/prime/src/hooks/pureData/__mocks__/useFetchGuestDetails.ts
    * <rootDir>/.worktrees/do-not-use/apps/prime/src/hooks/pureData/__mocks__/useFetchGuestDetails.ts

jest-haste-map: duplicate manual mock found: useFetchPreordersData
  The following files share their name; please delete one of them:
    * <rootDir>/apps/prime/src/hooks/pureData/__mocks__/useFetchPreordersData.ts
    * <rootDir>/.worktrees/do-not-use/apps/prime/src/hooks/pureData/__mocks__/useFetchPreordersData.ts

jest-haste-map: duplicate manual mock found: @sendgrid/mail
  The following files share their name; please delete one of them:
    * <rootDir>/packages/email/src/providers/__mocks__/@sendgrid/mail.ts
    * <rootDir>/.worktrees/do-not-use/packages/email/src/providers/__mocks__/@sendgrid/mail.ts

jest-haste-map: duplicate manual mock found: buildCfImageUrl
  The following files share their name; please delete one of them:
    * <rootDir>/.worktrees/do-not-use/apps/brikette/src/test/__mocks__/buildCfImageUrl.ts
    * <rootDir>/apps/business-os/.open-next/server-functions/default/apps/brikette/src/test/__mocks__/buildCfImageUrl.ts

jest-haste-map: duplicate manual mock found: config-env
  The following files share their name; please delete one of them:
    * <rootDir>/.worktrees/do-not-use/apps/brikette/src/test/__mocks__/config-env.ts
    * <rootDir>/apps/business-os/.open-next/server-functions/default/apps/brikette/src/test/__mocks__/config-env.ts

jest-haste-map: duplicate manual mock found: design-system-primitives
  The following files share their name; please delete one of them:
    * <rootDir>/.worktrees/do-not-use/apps/brikette/src/test/__mocks__/design-system-primitives.ts
    * <rootDir>/apps/business-os/.open-next/server-functions/default/apps/brikette/src/test/__mocks__/design-system-primitives.ts

jest-haste-map: duplicate manual mock found: guides-fs
  The following files share their name; please delete one of them:
    * <rootDir>/.worktrees/do-not-use/apps/brikette/src/test/__mocks__/guides-fs.ts
    * <rootDir>/apps/business-os/.open-next/server-functions/default/apps/brikette/src/test/__mocks__/guides-fs.ts

jest-haste-map: duplicate manual mock found: loadI18nNs
  The following files share their name; please delete one of them:
    * <rootDir>/.worktrees/do-not-use/apps/brikette/src/test/__mocks__/loadI18nNs.ts
    * <rootDir>/apps/business-os/.open-next/server-functions/default/apps/brikette/src/test/__mocks__/loadI18nNs.ts

jest-haste-map: duplicate manual mock found: i18n
  The following files share their name; please delete one of them:
    * <rootDir>/.worktrees/do-not-use/apps/brikette/src/test/__mocks__/i18n.ts
    * <rootDir>/apps/business-os/.open-next/server-functions/default/apps/brikette/src/test/__mocks__/i18n.ts

jest-haste-map: duplicate manual mock found: ui-atoms
  The following files share their name; please delete one of them:
    * <rootDir>/.worktrees/do-not-use/apps/brikette/src/test/__mocks__/ui-atoms.tsx
    * <rootDir>/apps/business-os/.open-next/server-functions/default/apps/brikette/src/test/__mocks__/ui-atoms.tsx

jest-haste-map: duplicate manual mock found: ui-config-site
  The following files share their name; please delete one of them:
    * <rootDir>/.worktrees/do-not-use/apps/brikette/src/test/__mocks__/ui-config-site.ts
    * <rootDir>/apps/business-os/.open-next/server-functions/default/apps/brikette/src/test/__mocks__/ui-config-site.ts

jest-haste-map: duplicate manual mock found: ui-modal-context
  The following files share their name; please delete one of them:
    * <rootDir>/.worktrees/do-not-use/apps/brikette/src/test/__mocks__/ui-modal-context.tsx
    * <rootDir>/apps/business-os/.open-next/server-functions/default/apps/brikette/src/test/__mocks__/ui-modal-context.tsx

jest-haste-map: duplicate manual mock found: webpackGlob
  The following files share their name; please delete one of them:
    * <rootDir>/.worktrees/do-not-use/apps/brikette/src/test/__mocks__/webpackGlob.ts
    * <rootDir>/apps/business-os/.open-next/server-functions/default/apps/brikette/src/test/__mocks__/webpackGlob.ts

jest-haste-map: duplicate manual mock found: ui-modal-environment
  The following files share their name; please delete one of them:
    * <rootDir>/.worktrees/do-not-use/apps/brikette/src/test/__mocks__/ui-modal-environment.ts
    * <rootDir>/apps/business-os/.open-next/server-functions/default/apps/brikette/src/test/__mocks__/ui-modal-environment.ts

jest-haste-map: duplicate manual mock found: useSettingsSaveForm
  The following files share their name; please delete one of them:
    * <rootDir>/apps/cms/src/app/cms/shop/[shop]/settings/hooks/__mocks__/useSettingsSaveForm.ts
    * <rootDir>/.worktrees/do-not-use/apps/cms/src/app/cms/shop/[shop]/settings/hooks/__mocks__/useSettingsSaveForm.ts

jest-haste-map: Haste module naming collision: cms-monorepo
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/package.json
    * <rootDir>/.worktrees/do-not-use/package.json

jest-haste-map: Haste module naming collision: root-tests
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/__tests__/package.json
    * <rootDir>/.worktrees/do-not-use/__tests__/package.json

jest-haste-map: Haste module naming collision: functions
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/functions/package.json
    * <rootDir>/.worktrees/do-not-use/functions/package.json

jest-haste-map: Haste module naming collision: scripts
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/scripts/package.json
    * <rootDir>/.worktrees/do-not-use/scripts/package.json

jest-haste-map: Haste module naming collision: @apps/api
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/apps/api/package.json
    * <rootDir>/.worktrees/do-not-use/apps/api/package.json

jest-haste-map: Haste module naming collision: @apps/brikette
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/apps/brikette/package.json
    * <rootDir>/.worktrees/do-not-use/apps/brikette/package.json

jest-haste-map: Haste module naming collision: @apps/cms
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/apps/cms/package.json
    * <rootDir>/.worktrees/do-not-use/apps/cms/package.json

jest-haste-map: Haste module naming collision: @apps/business-os
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/apps/business-os/package.json
    * <rootDir>/.worktrees/do-not-use/apps/business-os/package.json

jest-haste-map: Haste module naming collision: @apps/cochlearfit
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/apps/cochlearfit/package.json
    * <rootDir>/.worktrees/do-not-use/apps/cochlearfit/package.json

jest-haste-map: Haste module naming collision: @apps/cochlearfit-worker
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/apps/cochlearfit-worker/package.json
    * <rootDir>/.worktrees/do-not-use/apps/cochlearfit-worker/package.json

jest-haste-map: Haste module naming collision: @apps/cover-me-pretty
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/apps/cover-me-pretty/package.json
    * <rootDir>/.worktrees/do-not-use/apps/cover-me-pretty/package.json

jest-haste-map: Haste module naming collision: @apps/dashboard
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/apps/dashboard/package.json
    * <rootDir>/.worktrees/do-not-use/apps/dashboard/package.json

jest-haste-map: Haste module naming collision: @apps/handbag-configurator
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/apps/handbag-configurator/package.json
    * <rootDir>/.worktrees/do-not-use/apps/handbag-configurator/package.json

jest-haste-map: Haste module naming collision: @apps/handbag-configurator-api
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/apps/handbag-configurator-api/package.json
    * <rootDir>/.worktrees/do-not-use/apps/handbag-configurator-api/package.json

jest-haste-map: Haste module naming collision: @apps/prime
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/apps/prime/package.json
    * <rootDir>/.worktrees/do-not-use/apps/prime/package.json

jest-haste-map: Haste module naming collision: @apps/product-pipeline-queue-worker
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/apps/product-pipeline-queue-worker/package.json
    * <rootDir>/.worktrees/do-not-use/apps/product-pipeline-queue-worker/package.json

jest-haste-map: Haste module naming collision: @apps/product-pipeline
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/apps/product-pipeline/package.json
    * <rootDir>/.worktrees/do-not-use/apps/product-pipeline/package.json

jest-haste-map: Haste module naming collision: @apps/skylar
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/apps/skylar/package.json
    * <rootDir>/.worktrees/do-not-use/apps/skylar/package.json

jest-haste-map: Haste module naming collision: @apps/reception
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/apps/reception/package.json
    * <rootDir>/.worktrees/do-not-use/apps/reception/package.json

jest-haste-map: Haste module naming collision: @apps/storybook
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/apps/storybook/package.json
    * <rootDir>/.worktrees/do-not-use/apps/storybook/package.json

jest-haste-map: Haste module naming collision: @apps/xa-b
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/apps/xa-b/package.json
    * <rootDir>/.worktrees/do-not-use/apps/xa-b/package.json

jest-haste-map: Haste module naming collision: @apps/xa-drop-worker
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/apps/xa-drop-worker/package.json
    * <rootDir>/.worktrees/do-not-use/apps/xa-drop-worker/package.json

jest-haste-map: Haste module naming collision: @apps/xa-uploader
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/apps/xa-uploader/package.json
    * <rootDir>/.worktrees/do-not-use/apps/xa-uploader/package.json

jest-haste-map: Haste module naming collision: @acme/auth
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/auth/package.json
    * <rootDir>/.worktrees/do-not-use/packages/auth/package.json

jest-haste-map: Haste module naming collision: @acme/cms-ui
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/cms-ui/package.json
    * <rootDir>/.worktrees/do-not-use/packages/cms-ui/package.json

jest-haste-map: Haste module naming collision: @acme/cms-marketing
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/cms-marketing/package.json
    * <rootDir>/.worktrees/do-not-use/packages/cms-marketing/package.json

jest-haste-map: Haste module naming collision: @acme/date-utils
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/date-utils/package.json
    * <rootDir>/.worktrees/do-not-use/packages/date-utils/package.json

jest-haste-map: Haste module naming collision: @acme/cypress-image-snapshot
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/cypress-image-snapshot/package.json
    * <rootDir>/.worktrees/do-not-use/packages/cypress-image-snapshot/package.json

jest-haste-map: Haste module naming collision: @acme/config
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/config/package.json
    * <rootDir>/.worktrees/do-not-use/packages/config/package.json

jest-haste-map: Haste module naming collision: @acme/configurator
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/configurator/package.json
    * <rootDir>/.worktrees/do-not-use/packages/configurator/package.json

jest-haste-map: Haste module naming collision: @acme/design-system
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/design-system/package.json
    * <rootDir>/.worktrees/do-not-use/packages/design-system/package.json

jest-haste-map: Haste module naming collision: @acme/editorial
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/editorial/package.json
    * <rootDir>/.worktrees/do-not-use/packages/editorial/package.json

jest-haste-map: Haste module naming collision: @acme/email-templates
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/email-templates/package.json
    * <rootDir>/.worktrees/do-not-use/packages/email-templates/package.json

jest-haste-map: Haste module naming collision: @acme/design-tokens
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/design-tokens/package.json
    * <rootDir>/.worktrees/do-not-use/packages/design-tokens/package.json

jest-haste-map: Haste module naming collision: @acme/email
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/email/package.json
    * <rootDir>/.worktrees/do-not-use/packages/email/package.json

jest-haste-map: Haste module naming collision: @acme/eslint-plugin-ds
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/eslint-plugin-ds/package.json
    * <rootDir>/.worktrees/do-not-use/packages/eslint-plugin-ds/package.json

jest-haste-map: Haste module naming collision: @acme/i18n
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/i18n/package.json
    * <rootDir>/.worktrees/do-not-use/packages/i18n/package.json

jest-haste-map: Haste module naming collision: @acme/lib
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/lib/package.json
    * <rootDir>/.worktrees/do-not-use/packages/lib/package.json

jest-haste-map: Haste module naming collision: @acme/guides-core
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/guides-core/package.json
    * <rootDir>/.worktrees/do-not-use/packages/guides-core/package.json

jest-haste-map: Haste module naming collision: @acme/mcp-cloudflare
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/mcp-cloudflare/package.json
    * <rootDir>/.worktrees/do-not-use/packages/mcp-cloudflare/package.json

jest-haste-map: Haste module naming collision: @acme/next-config
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/next-config/package.json
    * <rootDir>/.worktrees/do-not-use/packages/next-config/package.json

jest-haste-map: Haste module naming collision: @acme/mcp-server
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/mcp-server/package.json
    * <rootDir>/.worktrees/do-not-use/packages/mcp-server/package.json

jest-haste-map: Haste module naming collision: @acme/page-builder-core
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/page-builder-core/package.json
    * <rootDir>/.worktrees/do-not-use/packages/page-builder-core/package.json

jest-haste-map: Haste module naming collision: @acme/platform-core
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/platform-core/package.json
    * <rootDir>/.worktrees/do-not-use/packages/platform-core/package.json

jest-haste-map: Haste module naming collision: @acme/page-builder-ui
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/page-builder-ui/package.json
    * <rootDir>/.worktrees/do-not-use/packages/page-builder-ui/package.json

jest-haste-map: Haste module naming collision: @acme/pipeline-engine
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/pipeline-engine/package.json
    * <rootDir>/.worktrees/do-not-use/packages/pipeline-engine/package.json

jest-haste-map: Haste module naming collision: @acme/sanity
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/sanity/package.json
    * <rootDir>/.worktrees/do-not-use/packages/sanity/package.json

jest-haste-map: Haste module naming collision: @acme/product-configurator
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/product-configurator/package.json
    * <rootDir>/.worktrees/do-not-use/packages/product-configurator/package.json

jest-haste-map: Haste module naming collision: @acme/platform-machine
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/platform-machine/package.json
    * <rootDir>/.worktrees/do-not-use/packages/platform-machine/package.json

jest-haste-map: Haste module naming collision: @acme/stripe
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/stripe/package.json
    * <rootDir>/.worktrees/do-not-use/packages/stripe/package.json

jest-haste-map: Haste module naming collision: @acme/template-app
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/template-app/package.json
    * <rootDir>/.worktrees/do-not-use/packages/template-app/package.json

jest-haste-map: Haste module naming collision: @acme/tailwind-config
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/tailwind-config/package.json
    * <rootDir>/.worktrees/do-not-use/packages/tailwind-config/package.json

jest-haste-map: Haste module naming collision: @acme/telemetry
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/telemetry/package.json
    * <rootDir>/.worktrees/do-not-use/packages/telemetry/package.json

jest-haste-map: Haste module naming collision: @acme/theme
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/theme/package.json
    * <rootDir>/.worktrees/do-not-use/packages/theme/package.json

jest-haste-map: Haste module naming collision: @acme/test-utils
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/test-utils/package.json
    * <rootDir>/.worktrees/do-not-use/packages/test-utils/package.json

jest-haste-map: Haste module naming collision: @acme/templates
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/templates/package.json
    * <rootDir>/.worktrees/do-not-use/packages/templates/package.json

jest-haste-map: Haste module naming collision: @acme/zod-utils
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/zod-utils/package.json
    * <rootDir>/.worktrees/do-not-use/packages/zod-utils/package.json

jest-haste-map: Haste module naming collision: @acme/ui
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/ui/package.json
    * <rootDir>/.worktrees/do-not-use/packages/ui/package.json

jest-haste-map: Haste module naming collision: @acme/types
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/types/package.json
    * <rootDir>/.worktrees/do-not-use/packages/types/package.json

jest-haste-map: Haste module naming collision: vscode-mcp-server
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/tools/vscode-mcp-server/package.json
    * <rootDir>/.worktrees/do-not-use/tools/vscode-mcp-server/package.json

jest-haste-map: Haste module naming collision: @acme/plugin-paypal
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/plugins/paypal/package.json
    * <rootDir>/.worktrees/do-not-use/packages/plugins/paypal/package.json

jest-haste-map: Haste module naming collision: @acme/plugin-sanity
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/plugins/sanity/package.json
    * <rootDir>/.worktrees/do-not-use/packages/plugins/sanity/package.json

jest-haste-map: Haste module naming collision: @acme/plugin-premier-shipping
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/plugins/premier-shipping/package.json
    * <rootDir>/.worktrees/do-not-use/packages/plugins/premier-shipping/package.json

jest-haste-map: Haste module naming collision: @themes/base
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/themes/base/package.json
    * <rootDir>/.worktrees/do-not-use/packages/themes/base/package.json

jest-haste-map: Haste module naming collision: @themes/dummy
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/themes/dummy/package.json
    * <rootDir>/.worktrees/do-not-use/packages/themes/dummy/package.json

jest-haste-map: Haste module naming collision: @themes/prime
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/themes/prime/package.json
    * <rootDir>/.worktrees/do-not-use/packages/themes/prime/package.json

jest-haste-map: Haste module naming collision: @themes/dark
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/themes/dark/package.json
    * <rootDir>/.worktrees/do-not-use/packages/themes/dark/package.json

jest-haste-map: Haste module naming collision: @themes/brandx
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/themes/brandx/package.json
    * <rootDir>/.worktrees/do-not-use/packages/themes/brandx/package.json

jest-haste-map: Haste module naming collision: @themes/bcd
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/themes/bcd/package.json
    * <rootDir>/.worktrees/do-not-use/packages/themes/bcd/package.json

jest-haste-map: Haste module naming collision: @acme/guide-system
  The following files share their name; please adjust your hasteImpl:
    * <rootDir>/packages/guide-system/package.json
    * <rootDir>/apps/business-os/.open-next/server-functions/default/packages/guide-system/package.json

 ELIFECYCLE  Command failed with exit code 1..

#### Existing Test Coverage
| Area | Test Type | Files / Commands | Coverage Notes |
|---|---|---|---|
| Storybook UI smoke | Playwright | 
> cms-monorepo@0.1.0 storybook:smoke:ui /Users/petercowling/base-shop
> cross-env WAIT_ON_TIMEOUT=120000 start-server-and-test "pnpm run storybook:ci" http://localhost:6007 "pnpm exec playwright test apps/storybook/.storybook/test-runner/__tests__/rtl-tokens.test.ts --reporter=list"

1: starting server using command "pnpm run storybook:ci"
and when url "[ 'http://localhost:6007' ]" is responding with HTTP status code 200
WAIT_ON_TIMEOUT is set to 120000
running tests using command "pnpm exec playwright test apps/storybook/.storybook/test-runner/__tests__/rtl-tokens.test.ts --reporter=list"


> cms-monorepo@0.1.0 storybook:ci /Users/petercowling/base-shop
> pnpm --filter @apps/storybook run dev:ci


> @apps/storybook@ dev:ci /Users/petercowling/base-shop/apps/storybook
> storybook dev -p 6007 --ci -c ./.storybook-ci


┌  storybook v10.1.11
│
▲  You are currently using Storybook 10.1.11 but you have packages which
│  are incompatible with it:

│  - @storybook/test@8.6.14 which depends on 8.6.14
│  Repo: ]8;;https://github.com/storybookjs/storybook/tree/next/code/lib/testhttps://github.com/storybookjs/storybook/tree/next/code/lib/...]8;;

│  Please consider updating your packages or contacting the maintainers
│  for compatibility details.

│  For more details on compatibility guidance, see:
│  ]8;;https://github.com/storybookjs/storybook/issues/32836https://github.com/storybookjs/storybook/issues/32836]8;;
│
●  Starting...
│
●  Addon-docs: using MDX3
│
●  Using implicit CSS loaders
│
●  Using SWC as compiler
[addon-coverage] Adding istanbul loader to Webpack config
│
●  Using default Webpack5 setup
[@acme/tailwind-config] ✅  preset imported (cwd: /Users/petercowling/base-shop/apps/storybook)
[@acme/tailwind-config] preset keys [ 'content', 'theme', 'plugins', 'presets' ]
[@acme/tailwind-config] has nested { plugins: true, presets: true }
│ [38;2;255;71;133m╭[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m╮[39m
│ [38;2;255;71;133m│[39m   Storybook ready!                                                         [38;2;255;71;133m│[39m
│ [38;2;255;71;133m│[39m                                                                            [38;2;255;71;133m│[39m
│ [38;2;255;71;133m│[39m   - Local:             http://localhost:6007/                              [38;2;255;71;133m│[39m
│ [38;2;255;71;133m│[39m   - On your network:   http://192.168.1.14:6007/                           [38;2;255;71;133m│[39m
│ [38;2;255;71;133m│[39m                                                                            [38;2;255;71;133m│[39m
│ [38;2;255;71;133m│[39m   [38;2;243;173;56mA new version (10.2.8) is available![39m                                     [38;2;255;71;133m│[39m
│ [38;2;255;71;133m│[39m                                                                            [38;2;255;71;133m│[39m
│ [38;2;255;71;133m│[39m   Upgrade now: [38;2;162;224;94mnpx storybook@latest upgrade[39m                                [38;2;255;71;133m│[39m
│ [38;2;255;71;133m│[39m                                                                            [38;2;255;71;133m│[39m
│ [38;2;255;71;133m│[39m   Read full changelog:                                                     [38;2;255;71;133m│[39m
│ [38;2;255;71;133m│[39m   https://github.com/storybookjs/storybook/blob/main/CHANGELOG.md          [38;2;255;71;133m│[39m
│ [38;2;255;71;133m╰[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m╯[39m
│
●  2.76 s for manager and 50 s for preview

Running 1 test using 1 worker

  ✓  1 apps/storybook/.storybook/test-runner/__tests__/rtl-tokens.test.ts:3:5 › Order Summary Matrix story loads under Brand X + RTL globals (2.3s)

  1 passed (25.3s) | Validates token and RTL UI flows in CI config.
| Storybook interaction | Storybook test-runner | 
> cms-monorepo@0.1.0 test-storybook:runner /Users/petercowling/base-shop
> cross-env WAIT_ON_TIMEOUT=120000 start-server-and-test "pnpm run storybook:ci" http://localhost:6007 "pnpm exec test-storybook --config-dir apps/storybook/.storybook-ci --url http://localhost:6007 --includeTags ci --testTimeout 30000 --maxWorkers 2"

1: starting server using command "pnpm run storybook:ci"
and when url "[ 'http://localhost:6007' ]" is responding with HTTP status code 200
WAIT_ON_TIMEOUT is set to 120000
running tests using command "pnpm exec test-storybook --config-dir apps/storybook/.storybook-ci --url http://localhost:6007 --includeTags ci --testTimeout 30000 --maxWorkers 2"


> cms-monorepo@0.1.0 storybook:ci /Users/petercowling/base-shop
> pnpm --filter @apps/storybook run dev:ci


> @apps/storybook@ dev:ci /Users/petercowling/base-shop/apps/storybook
> storybook dev -p 6007 --ci -c ./.storybook-ci


┌  storybook v10.1.11
│
▲  You are currently using Storybook 10.1.11 but you have packages which
│  are incompatible with it:

│  - @storybook/test@8.6.14 which depends on 8.6.14
│  Repo: ]8;;https://github.com/storybookjs/storybook/tree/next/code/lib/testhttps://github.com/storybookjs/storybook/tree/next/code/lib/...]8;;

│  Please consider updating your packages or contacting the maintainers
│  for compatibility details.

│  For more details on compatibility guidance, see:
│  ]8;;https://github.com/storybookjs/storybook/issues/32836https://github.com/storybookjs/storybook/issues/32836]8;;
│
●  Starting...
│
●  Addon-docs: using MDX3
│
●  Using implicit CSS loaders
│
●  Using SWC as compiler
[addon-coverage] Adding istanbul loader to Webpack config
│
●  Using default Webpack5 setup
[@acme/tailwind-config] ✅  preset imported (cwd: /Users/petercowling/base-shop/apps/storybook)
[@acme/tailwind-config] preset keys [ 'content', 'theme', 'plugins', 'presets' ]
[@acme/tailwind-config] has nested { plugins: true, presets: true }
│ [38;2;255;71;133m╭[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m╮[39m
│ [38;2;255;71;133m│[39m   Storybook ready!                                                         [38;2;255;71;133m│[39m
│ [38;2;255;71;133m│[39m                                                                            [38;2;255;71;133m│[39m
│ [38;2;255;71;133m│[39m   - Local:             http://localhost:6007/                              [38;2;255;71;133m│[39m
│ [38;2;255;71;133m│[39m   - On your network:   http://192.168.1.14:6007/                           [38;2;255;71;133m│[39m
│ [38;2;255;71;133m│[39m                                                                            [38;2;255;71;133m│[39m
│ [38;2;255;71;133m│[39m   [38;2;243;173;56mA new version (10.2.8) is available![39m                                     [38;2;255;71;133m│[39m
│ [38;2;255;71;133m│[39m                                                                            [38;2;255;71;133m│[39m
│ [38;2;255;71;133m│[39m   Upgrade now: [38;2;162;224;94mnpx storybook@latest upgrade[39m                                [38;2;255;71;133m│[39m
│ [38;2;255;71;133m│[39m                                                                            [38;2;255;71;133m│[39m
│ [38;2;255;71;133m│[39m   Read full changelog:                                                     [38;2;255;71;133m│[39m
│ [38;2;255;71;133m│[39m   https://github.com/storybookjs/storybook/blob/main/CHANGELOG.md          [38;2;255;71;133m│[39m
│ [38;2;255;71;133m╰[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m─[39m[38;2;255;71;133m╯[39m
│
●  1.08 s for manager and 36 s for preview
jest-haste-map: duplicate manual mock found: componentStub
  The following files share their name; please delete one of them:
    * <rootDir>/test/__mocks__/componentStub.js
    * <rootDir>/.ts-jest/test/__mocks__/componentStub.js

jest-haste-map: duplicate manual mock found: next-server
  The following files share their name; please delete one of them:
    * <rootDir>/test/__mocks__/next-server.ts
    * <rootDir>/.ts-jest/test/__mocks__/next-server.js

jest-haste-map: duplicate manual mock found: currencyContextMock
  The following files share their name; please delete one of them:
    * <rootDir>/test/__mocks__/currencyContextMock.tsx
    * <rootDir>/.ts-jest/test/__mocks__/currencyContextMock.js

jest-haste-map: duplicate manual mock found: react-chartjs-2
  The following files share their name; please delete one of them:
    * <rootDir>/test/__mocks__/react-chartjs-2.ts
    * <rootDir>/.ts-jest/test/__mocks__/react-chartjs-2.js

jest-haste-map: duplicate manual mock found: shadcnDialogStub
  The following files share their name; please delete one of them:
    * <rootDir>/test/__mocks__/shadcnDialogStub.tsx
    * <rootDir>/.ts-jest/test/__mocks__/shadcnDialogStub.js

jest-haste-map: duplicate manual mock found: pluginSanityStub
  The following files share their name; please delete one of them:
    * <rootDir>/test/__mocks__/pluginSanityStub.ts
    * <rootDir>/.ts-jest/test/__mocks__/pluginSanityStub.js

jest-haste-map: duplicate manual mock found: telemetryMock
  The following files share their name; please delete one of them:
    * <rootDir>/test/__mocks__/telemetryMock.ts
    * <rootDir>/.ts-jest/test/__mocks__/telemetryMock.js

jest-haste-map: duplicate manual mock found: themeContextMock
  The following files share their name; please delete one of them:
    * <rootDir>/test/__mocks__/themeContextMock.tsx
    * <rootDir>/.ts-jest/test/__mocks__/themeContextMock.js

jest-haste-map: duplicate manual mock found: ui-palette-add.mock
  The following files share their name; please delete one of them:
    * <rootDir>/test/__mocks__/ui-palette-add.mock.tsx
    * <rootDir>/.ts-jest/test/__mocks__/ui-palette-add.mock.js

jest-haste-map: duplicate manual mock found: ui-shadcn-lite
  The following files share their name; please delete one of them:
    * <rootDir>/test/__mocks__/ui-shadcn-lite.tsx
    * <rootDir>/.ts-jest/test/__mocks__/ui-shadcn-lite.js

jest-haste-map: duplicate manual mock found: ui-useFileUpload.mock
  The following files share their name; please delete one of them:
    * <rootDir>/test/__mocks__/ui-useFileUpload.mock.ts
    * <rootDir>/.ts-jest/test/__mocks__/ui-useFileUpload.mock.js

jest-haste-map: duplicate manual mock found: ui-pb-dnd.mock
  The following files share their name; please delete one of them:
    * <rootDir>/test/__mocks__/ui-pb-dnd.mock.ts
    * <rootDir>/.ts-jest/test/__mocks__/ui-pb-dnd.mock.js

jest-haste-map: duplicate manual mock found: undici
  The following files share their name; please delete one of them:
    * <rootDir>/test/__mocks__/undici.ts
    * <rootDir>/.ts-jest/test/__mocks__/undici.js

jest-haste-map: duplicate manual mock found: @radix-ui/react-dropdown-menu
  The following files share their name; please delete one of them:
    * <rootDir>/test/__mocks__/@radix-ui/react-dropdown-menu.tsx
    * <rootDir>/.ts-jest/test/__mocks__/@radix-ui/react-dropdown-menu.js

jest-haste-map: duplicate manual mock found: @prisma/client
  The following files share their name; please delete one of them:
    * <rootDir>/__mocks__/@prisma/client.ts
    * <rootDir>/.worktrees/do-not-use/__mocks__/@prisma/client.ts

jest-haste-map: duplicate manual mock found: next/headers
  The following files share their name; please delete one of them:
    * <rootDir>/__mocks__/next/headers.js
    * <rootDir>/.worktrees/do-not-use/__mocks__/next/headers.js

jest-haste-map: duplicate manual mock found: next/image
  The following files share their name; please delete one of them:
    * <rootDir>/__mocks__/next/image.js
    * <rootDir>/.worktrees/do-not-use/__mocks__/next/image.js

jest-haste-map: duplicate manual mock found: next/link
  The following files share their name; please delete one of them:
    * <rootDir>/__mocks__/next/link.js
    * <rootDir>/.worktrees/do-not-use/__mocks__/next/link.js

jest-haste-map: duplicate manual mock found: next/navigation
  The following files share their name; please delete one of them:
    * <rootDir>/__mocks__/next/navigation.js
    * <rootDir>/.worktrees/do-not-use/__mocks__/next/navigation.js

jest-haste-map: duplicate manual mock found: componentStub
  The following files share their name; please delete one of them:
    * <rootDir>/.ts-jest/test/__mocks__/componentStub.js
    * <rootDir>/.worktrees/do-not-use/test/__mocks__/componentStub.js

jest-haste-map: duplicate manual mock found: currencyContextMock
  The following files share their name; please delete one of them:
    * <rootDir>/.ts-jest/test/__mocks__/currencyContextMock.js
    * <rootDir>/.worktrees/do-not-use/test/__mocks__/currencyContextMock.tsx

jest-haste-map: duplicate manual mock found: next-link
  The following files share their name; please delete one of them:
    * <rootDir>/test/__mocks__/next-link.tsx
    * <rootDir>/.worktrees/do-not-use/test/__mocks__/next-link.tsx

jest-haste-map: duplicate manual mock found: pluginSanityStub
  The following files share their name; please delete one of them:
    * <rootDir>/.ts-jest/test/__mocks__/pluginSanityStub.js
    * <rootDir>/.worktrees/do-not-use/test/__mocks__/pluginSanityStub.ts

jest-haste-map: duplicate manual mock found: shadcnDialogStub
  The following files share their name; please delete one of them:
    * <rootDir>/.ts-jest/test/__mocks__/shadcnDialogStub.js
    * <rootDir>/.worktrees/do-not-use/test/__mocks__/shadcnDialogStub.tsx

jest-haste-map: duplicate manual mock found: themeContextMock
  The following files share their name; please delete one of them:
    * <rootDir>/.ts-jest/test/__mocks__/themeContextMock.js
    * <rootDir>/.worktrees/do-not-use/test/__mocks__/themeContextMock.tsx

jest-haste-map: duplicate manual mock found: next-server
  The following files share their name; please delete one of them:
    * <rootDir>/.ts-jest/test/__mocks__/next-server.js
    * <rootDir>/.worktrees/do-not-use/test/__mocks__/next-server.ts

jest-haste-map: duplicate manual mock found: react-chartjs-2
  The following files share their name; please delete one of them:
    * <rootDir>/.ts-jest/test/__mocks__/react-chartjs-2.js
    * <rootDir>/.worktrees/do-not-use/test/__mocks__/react-chartjs-2.ts

jest-haste-map: duplicate manual mock found: telemetryMock
  The following files share their name; please delete one of them:
    * <rootDir>/.ts-jest/test/__mocks__/telemetryMock.js
    * <rootDir>/.worktrees/do-not-use/test/__mocks__/telemetryMock.ts

jest-haste-map: duplicate manual mock found: ui-palette-add.mock
  The following files share their name; please delete one of them:
    * <rootDir>/.ts-jest/test/__mocks__/ui-palette-add.mock.js
    * <rootDir>/.worktrees/do-not-use/test/__mocks__/ui-palette-add.mock.tsx

jest-haste-map: duplicate manual mock found: ui-pb-dnd.mock
  The following files share their name; please delete one of them:
    * <rootDir>/.ts-jest/test/__mocks__/ui-pb-dnd.mock.js
    * <rootDir>/.worktrees/do-not-use/test/__mocks__/ui-pb-dnd.mock.ts

jest-haste-map: duplicate manual mock found: ui-useFileUpload.mock
  The following files share their name; please delete one of them:
    * <rootDir>/.ts-jest/test/__mocks__/ui-useFileUpload.mock.js
    * <rootDir>/.worktrees/do-not-use/test/__mocks__/ui-useFileUpload.mock.ts

jest-haste-map: duplicate manual mock found: ui-shadcn-lite
  The following files share their name; please delete one of them:
    * <rootDir>/.ts-jest/test/__mocks__/ui-shadcn-lite.js
    * <rootDir>/.worktrees/do-not-use/test/__mocks__/ui-shadcn-lite.tsx

jest-haste-map: duplicate manual mock found: undici
  The following files share their name; please delete one of them:
    * <rootDir>/.ts-jest/test/__mocks__/undici.js
    * <rootDir>/.worktrees/do-not-use/test/__mocks__/undici.ts

jest-haste-map: duplicate manual mock found: ui-modal-context
  The following files share their name; please delete one of them:
    * <rootDir>/apps/brikette/src/test/__mocks__/ui-modal-context.tsx
    * <rootDir>/apps/reception/src/test/__mocks__/ui-modal-context.tsx

jest-haste-map: duplicate manual mock found: @radix-ui/react-dropdown-menu
  The following files share their name; please delete one of them:
    * <rootDir>/.ts-jest/test/__mocks__/@radix-ui/react-dropdown-menu.js
    * <rootDir>/.worktrees/do-not-use/test/__mocks__/@radix-ui/react-dropdown-menu.tsx

jest-haste-map: duplicate manual mock found: repo
  The following files share their name; please delete one of them:
    * <rootDir>/apps/cms/__tests__/__mocks__/repo.ts
    * <rootDir>/.worktrees/do-not-use/apps/cms/__tests__/__mocks__/repo.ts

jest-haste-map: duplicate manual mock found: buildCfImageUrl
  The following files share their name; please delete one of them:
    * <rootDir>/apps/brikette/src/test/__mocks__/buildCfImageUrl.ts
    * <rootDir>/.worktrees/do-not-use/apps/brikette/src/test/__mocks__/buildCfImageUrl.ts

jest-haste-map: duplicate manual mock found: config-env
  The following files share their name; please delete one of them:
    * <rootDir>/apps/brikette/src/test/__mocks__/config-env.ts
    * <rootDir>/.worktrees/do-not-use/apps/brikette/src/test/__mocks__/config-env.ts

jest-haste-map: duplicate manual mock found: design-system-primitives
  The following files share their name; please delete one of them:
    * <rootDir>/apps/brikette/src/test/__mocks__/design-system-primitives.ts
    * <rootDir>/.worktrees/do-not-use/apps/brikette/src/test/__mocks__/design-system-primitives.ts

jest-haste-map: duplicate manual mock found: guides-fs
  The following files share their name; please delete one of them:
    * <rootDir>/apps/brikette/src/test/__mocks__/guides-fs.ts
    * <rootDir>/.worktrees/do-not-use/apps/brikette/src/test/__mocks__/guides-fs.ts

jest-haste-map: duplicate manual mock found: i18n
  The following files share their name; please delete one of them:
    * <rootDir>/apps/brikette/src/test/__mocks__/i18n.ts
    * <rootDir>/.worktrees/do-not-use/apps/brikette/src/test/__mocks__/i18n.ts

jest-haste-map: duplicate manual mock found: loadI18nNs
  The following files share their name; please delete one of them:
    * <rootDir>/apps/brikette/src/test/__mocks__/loadI18nNs.ts
    * <rootDir>/.worktrees/do-not-use/apps/brikette/src/test/__mocks__/loadI18nNs.ts

jest-haste-map: duplicate manual mock found: ui-atoms
  The following files share their name; please delete one of them:
    * <rootDir>/apps/brikette/src/test/__mocks__/ui-atoms.tsx
    * <rootDir>/.worktrees/do-not-use/apps/brikette/src/test/__mocks__/ui-atoms.tsx

jest-haste-map: duplicate manual mock found: ui-config-site
  The following files share their name; please delete one of them:
    * <rootDir>/apps/brikette/src/test/__mocks__/ui-config-site.ts
    * <rootDir>/.worktrees/do-not-use/apps/brikette/src/test/__mocks__/ui-config-site.ts

jest-haste-map: duplicate manual mock found: ui-modal-environment
  The following files share their name; please delete one of them:
    * <rootDir>/apps/brikette/src/test/__mocks__/ui-modal-environment.ts
    * <rootDir>/.worktrees/do-not-use/apps/brikette/src/test/__mocks__/ui-modal-environment.ts

jest-haste-map: duplicate manual mock found: ui-modal-context
  The following files share their name; please delete one of them:
    * <rootDir>/apps/reception/src/test/__mocks__/ui-modal-context.tsx
    * <rootDir>/.worktrees/do-not-use/apps/brikette/src/test/__mocks__/ui-modal-context.tsx

jest-haste-map: duplicate manual mock found: resend
  The following files share their name; please delete one of them:
    * <rootDir>/packages/email/src/providers/__mocks__/resend.ts
    * <rootDir>/.worktrees/do-not-use/packages/email/src/providers/__mocks__/resend.ts

jest-haste-map: duplicate manual mock found: useFetchBookingsData
  The following files share their name; please delete one of them:
    * <rootDir>/apps/prime/src/hooks/pureData/__mocks__/useFetchBookingsData.ts
    * <rootDir>/.worktrees/do-not-use/apps/prime/src/hooks/pureData/__mocks__/useFetchBookingsData.ts

jest-haste-map: duplicate manual mock found: useFetchGuestDetails
  The following files share their name; please delete one of them:
    * <rootDir>/apps/prime/src/hooks/pureData/__mocks__/useFetchGuestDetails.ts
    * <rootDir>/.worktrees/do-not-use/apps/prime/src/hooks/pureData/__mocks__/useFetchGuestDetails.ts

jest-haste-map: duplicate manual mock found: useFetchPreordersData
  The following files share their name; please delete one of them:
    * <rootDir>/apps/prime/src/hooks/pureData/__mocks__/useFetchPreordersData.ts
    * <rootDir>/.worktrees/do-not-use/apps/prime/src/hooks/pureData/__mocks__/useFetchPreordersData.ts

jest-haste-map: duplicate manual mock found: @sendgrid/mail
  The following files share their name; please delete one of them:
    * <rootDir>/packages/email/src/providers/__mocks__/@sendgrid/mail.ts
    * <rootDir>/.worktrees/do-not-use/packages/email/src/providers/__mocks__/@sendgrid/mail.ts

jest-haste-map: duplicate manual mock found: buildCfImageUrl
  The following files share their name; please delete one of them:
    * <rootDir>/.worktrees/do-not-use/apps/brikette/src/test/__mocks__/buildCfImageUrl.ts
    * <rootDir>/apps/business-os/.open-next/server-functions/default/apps/brikette/src/test/__mocks__/buildCfImageUrl.ts

jest-haste-map: duplicate manual mock found: config-env
  The following files share their name; please delete one of them:
    * <rootDir>/.worktrees/do-not-use/apps/brikette/src/test/__mocks__/config-env.ts
    * <rootDir>/apps/business-os/.open-next/server-functions/default/apps/brikette/src/test/__mocks__/config-env.ts

jest-haste-map: duplicate manual mock found: design-system-primitives
  The following files share their name; please delete one of them:
    * <rootDir>/.worktrees/do-not-use/apps/brikette/src/test/__mocks__/design-system-primitives.ts
    * <rootDir>/apps/business-os/.open-next/server-functions/default/apps/brikette/src/test/__mocks__/design-system-primitives.ts

jest-haste-map: duplicate manual mock found: guides-fs
  The following files share their name; please delete one of them:
    * <rootDir>/.worktrees/do-not-use/apps/brikette/src/test/__mocks__/guides-fs.ts
    * <rootDir>/apps/business-os/.open-next/server-functions/default/apps/brikette/src/test/__mocks__/guides-fs.ts

jest-haste-map: duplicate manual mock found: i18n
  The following files share their name; please delete one of them:
    * <rootDir>/.worktrees/do-not-use/apps/brikette/src/test/__mocks__/i18n.ts
    * <rootDir>/apps/business-os/.open-next/server-functions/default/apps/brikette/src/test/__mocks__/i18n.ts

jest-haste-map: duplicate manual mock found: loadI18nNs
  The following files share their name; please delete one of them:
    * <rootDir>/.worktrees/do-not-use/apps/brikette/src/test/__mocks__/loadI18nNs.ts
    * <rootDir>/apps/business-os/.open-next/server-functions/default/apps/brikette/src/test/__mocks__/loadI18nNs.ts

jest-haste-map: duplicate manual mock found: ui-atoms
  The following files share their name; please delete one of them:
    * <rootDir>/.worktrees/do-not-use/apps/brikette/src/test/__mocks__/ui-atoms.tsx
    * <rootDir>/apps/business-os/.open-next/server-functions/default/apps/brikette/src/test/__mocks__/ui-atoms.tsx

jest-haste-map: duplicate manual mock found: ui-config-site
  The following files share their name; please delete one of them:
    * <rootDir>/.worktrees/do-not-use/apps/brikette/src/test/__mocks__/ui-config-site.ts
    * <rootDir>/apps/business-os/.open-next/server-functions/default/apps/brikette/src/test/__mocks__/ui-config-site.ts

jest-haste-map: duplicate manual mock found: ui-modal-context
  The following files share their name; please delete one of them:
    * <rootDir>/.worktrees/do-not-use/apps/brikette/src/test/__mocks__/ui-modal-context.tsx
    * <rootDir>/apps/business-os/.open-next/server-functions/default/apps/brikette/src/test/__mocks__/ui-modal-context.tsx

jest-haste-map: duplicate manual mock found: webpackGlob
  The following files share their name; please delete one of them:
    * <rootDir>/.worktrees/do-not-use/apps/brikette/src/test/__mocks__/webpackGlob.ts
    * <rootDir>/apps/business-os/.open-next/server-functions/default/apps/brikette/src/test/__mocks__/webpackGlob.ts

jest-haste-map: duplicate manual mock found: ui-modal-environment
  The following files share their name; please delete one of them:
    * <rootDir>/.worktrees/do-not-use/apps/brikette/src/test/__mocks__/ui-modal-environment.ts
    * <rootDir>/apps/business-os/.open-next/server-functions/default/apps/brikette/src/test/__mocks__/ui-modal-environment.ts

jest-haste-map: duplicate manual mock found: useSettingsSaveForm
  The following files share their name; please delete one of them:
    * <rootDir>/apps/cms/src/app/cms/shop/[shop]/settings/hooks/__mocks__/useSettingsSaveForm.ts
    * <rootDir>/.worktrees/do-not-use/apps/cms/src/app/cms/shop/[shop]/settings/hooks/__mocks__/useSettingsSaveForm.ts

 ELIFECYCLE  Command failed with exit code 1. | Runs ci-tagged story interactions.
| Storybook coverage policy | Scripted policy | 
> cms-monorepo@0.1.0 stories:verify /Users/petercowling/base-shop
> node --import tsx tools/storybook/verify-coverage.ts

Components: 631
Missing/incomplete: 27
atoms        | total:  63 | complete:  62 | needs stories: 0 | needs states: 1
molecules    | total:  16 | complete:  16 | needs stories: 0 | needs states: 0
organisms    | total:  71 | complete:  45 | needs stories: 1 | needs states: 25
cms-blocks   | total:  91 | complete:  91 | needs stories: 0 | needs states: 0
templates    | total:  24 | complete:  24 | needs stories: 0 | needs states: 0
layout       | total:   3 | complete:   3 | needs stories: 0 | needs states: 0
other        | total: 363 | complete:  81 | needs stories: 98 | needs states: 184
 ELIFECYCLE  Command failed with exit code 1. | Advisory coverage check in CI.

#### Coverage Gaps
- No dedicated Vite migration canary job exists.
- No automated parity assertion between webpack config behavior and Vite config behavior.
- No guard that verifies  remains executable under ESM without  runtime errors.

#### Testability Assessment
- Easy to test:
  - CI smoke and runner success criteria before and after migration.
  - Dependency graph changes via Legend: production dependency, optional only, dev only

cms-monorepo@0.1.0 /Users/petercowling/base-shop (PRIVATE)

devDependencies:
@cypress/code-coverage 3.14.6
├─┬ @cypress/webpack-preprocessor 6.0.4
│ ├─┬ babel-loader 9.2.1 peer
│ │ └─┬ webpack 5.104.1 peer
│ │   └─┬ terser-webpack-plugin 5.3.16
│ │     └── webpack 5.104.1 peer
│ └─┬ webpack 5.104.1 peer
│   └─┬ terser-webpack-plugin 5.3.16
│     └── webpack 5.104.1 peer
├─┬ babel-loader 9.2.1 peer
│ └─┬ webpack 5.104.1 peer
│   └─┬ terser-webpack-plugin 5.3.16
│     └── webpack 5.104.1 peer
└─┬ webpack 5.104.1 peer
  └─┬ terser-webpack-plugin 5.3.16
    └── webpack 5.104.1 peer
@storybook/addon-docs 10.1.4
└─┬ @storybook/csf-plugin 10.1.4
  └─┬ webpack 5.104.1 peer
    └─┬ terser-webpack-plugin 5.3.16
      └── webpack 5.104.1 peer
@storybook/builder-vite 10.1.4
└─┬ @storybook/csf-plugin 10.1.4
  └─┬ webpack 5.104.1 peer
    └─┬ terser-webpack-plugin 5.3.16
      └── webpack 5.104.1 peer
@storybook/nextjs 10.1.4
├─┬ @pmmmwh/react-refresh-webpack-plugin 0.5.17
│ └─┬ webpack 5.104.1 peer
│   └─┬ terser-webpack-plugin 5.3.16
│     └── webpack 5.104.1 peer
├─┬ @storybook/builder-webpack5 10.1.4
│ ├─┬ css-loader 7.1.2
│ │ └─┬ webpack 5.104.1 peer
│ │   └─┬ terser-webpack-plugin 5.3.16
│ │     └── webpack 5.104.1 peer
│ ├─┬ fork-ts-checker-webpack-plugin 9.1.0
│ │ └─┬ webpack 5.104.1 peer
│ │   └─┬ terser-webpack-plugin 5.3.16
│ │     └── webpack 5.104.1 peer
│ ├─┬ html-webpack-plugin 5.6.3
│ │ └─┬ webpack 5.104.1 peer
│ │   └─┬ terser-webpack-plugin 5.3.16
│ │     └── webpack 5.104.1 peer
│ ├─┬ style-loader 4.0.0
│ │ └─┬ webpack 5.104.1 peer
│ │   └─┬ terser-webpack-plugin 5.3.16
│ │     └── webpack 5.104.1 peer
│ ├─┬ terser-webpack-plugin 5.3.14
│ │ └─┬ webpack 5.104.1 peer
│ │   └─┬ terser-webpack-plugin 5.3.16
│ │     └── webpack 5.104.1 peer
│ ├─┬ webpack 5.104.1
│ │ └─┬ terser-webpack-plugin 5.3.16
│ │   └── webpack 5.104.1 peer
│ └─┬ webpack-dev-middleware 6.1.3
│   └─┬ webpack 5.104.1 peer
│     └─┬ terser-webpack-plugin 5.3.16
│       └── webpack 5.104.1 peer
├─┬ @storybook/preset-react-webpack 10.1.4
│ ├─┬ @storybook/react-docgen-typescript-plugin 1.0.6--canary.9.0c3f3b7.0
│ │ └─┬ webpack 5.104.1 peer
│ │   └─┬ terser-webpack-plugin 5.3.16
│ │     └── webpack 5.104.1 peer
│ └─┬ webpack 5.104.1
│   └─┬ terser-webpack-plugin 5.3.16
│     └── webpack 5.104.1 peer
├─┬ babel-loader 9.2.1
│ └─┬ webpack 5.104.1 peer
│   └─┬ terser-webpack-plugin 5.3.16
│     └── webpack 5.104.1 peer
├─┬ css-loader 6.11.0
│ └─┬ webpack 5.104.1 peer
│   └─┬ terser-webpack-plugin 5.3.16
│     └── webpack 5.104.1 peer
├─┬ node-polyfill-webpack-plugin 2.0.1
│ └─┬ webpack 5.104.1 peer
│   └─┬ terser-webpack-plugin 5.3.16
│     └── webpack 5.104.1 peer
├─┬ postcss-loader 8.1.1
│ └─┬ webpack 5.104.1 peer
│   └─┬ terser-webpack-plugin 5.3.16
│     └── webpack 5.104.1 peer
├─┬ sass-loader 16.0.5
│ └─┬ webpack 5.104.1 peer
│   └─┬ terser-webpack-plugin 5.3.16
│     └── webpack 5.104.1 peer
├─┬ style-loader 3.3.4
│ └─┬ webpack 5.104.1 peer
│   └─┬ terser-webpack-plugin 5.3.16
│     └── webpack 5.104.1 peer
└─┬ webpack 5.104.1 peer
  └─┬ terser-webpack-plugin 5.3.16
    └── webpack 5.104.1 peer
@storybook/nextjs-vite 10.1.4
├─┬ @storybook/builder-vite 10.1.4
│ └─┬ @storybook/csf-plugin 10.1.4
│   └─┬ webpack 5.104.1 peer
│     └─┬ terser-webpack-plugin 5.3.16
│       └── webpack 5.104.1 peer
└─┬ @storybook/react-vite 10.1.4
  └─┬ @storybook/builder-vite 10.1.4
    └─┬ @storybook/csf-plugin 10.1.4
      └─┬ webpack 5.104.1 peer
        └─┬ terser-webpack-plugin 5.3.16
          └── webpack 5.104.1 peer
webpack 5.104.1
└─┬ terser-webpack-plugin 5.3.16
  └── webpack 5.104.1 peer.
- Hard to test:
  - Full parity for all Next server/client stub edge cases across story catalog.
  - Resolver behavior against current multi-target TS path aliases.
- Test seams needed:
  - Temporary canary config using  in parallel with current config.
  - Targeted canary build plus smoke script before default builder switch.

### Recent Git History (Targeted)
- Storybook config surfaces were recently touched (, ), indicating active maintenance rather than abandonment.
- History includes repeated config adjustments and rollback-era updates, consistent with unstable prior migration attempts.

## Questions
### Resolved
- Q: Is Storybook currently using webpack by design in this repo?
  - A: Yes. Both active configs explicitly set .
  - Evidence: [apps/storybook/.storybook/main.ts](/Users/petercowling/base-shop/apps/storybook/.storybook/main.ts#L23), [apps/storybook/.storybook-ci/main.ts](/Users/petercowling/base-shop/apps/storybook/.storybook-ci/main.ts#L20).

- Q: Is a Vite pathway already partially present?
  - A: Yes.  and Vite helper dependencies are installed, and a Vite config file exists.
  - Evidence: [package.json](/Users/petercowling/base-shop/package.json#L291), [package.json](/Users/petercowling/base-shop/package.json#L293), [apps/storybook/.storybook/vite.storybook.ts](/Users/petercowling/base-shop/apps/storybook/.storybook/vite.storybook.ts#L1).

- Q: Is there a current known webpack-specific build issue?
  - A: Yes. Full build path crashes with webpack wasm hash null-pointer, and wrapper script explicitly avoids using full build by default.
  - Evidence: [apps/storybook/package.json](/Users/petercowling/base-shop/apps/storybook/package.json#L8); local command result 
> @apps/storybook@ build:full /Users/petercowling/base-shop/apps/storybook
> storybook build -c ./.storybook


┌  Building storybook v10.1.11
│
◇  Cleaning outputDir: storybook-static
│
◇  Loading presets
│
◇  Building manager..
│
●  Building preview..
│
●  Addon-docs: using MDX3
│
●  Copying static files: ../../public at storybook-static
│
●  Using implicit CSS loaders
│
●  Using SWC as compiler
[addon-coverage] Adding istanbul loader to Webpack config
│
●  Using default Webpack5 setup
│
▲  🚨 Unable to index files:
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ARViewer.stories.tsx,../../packages/ui/src/components/atoms/ARViewer.stories.tsx:
│  Duplicate stories with id: atoms-arviewer--primary
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ARViewer.stories.tsx,../../packages/ui/src/components/atoms/ARViewer.stories.tsx:
│  Duplicate stories with id: atoms-arviewer--large
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ARViewer.stories.tsx,../../packages/ui/src/components/atoms/ARViewer.stories.tsx:
│  Duplicate stories with id: atoms-arviewer--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ARViewer.stories.tsx,../../packages/ui/src/components/atoms/ARViewer.stories.tsx:
│  Duplicate stories with id: atoms-arviewer--broken-model-fallback
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Alert.stories.tsx,../../packages/ui/src/components/atoms/Alert.stories.tsx:
│  Duplicate stories with id: atoms-alert--variants
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Alert.stories.tsx,../../packages/ui/src/components/atoms/Alert.stories.tsx:
│  Duplicate stories with id: atoms-alert--solid
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Alert.stories.tsx,../../packages/ui/src/components/atoms/Alert.stories.tsx:
│  Duplicate stories with id: atoms-alert--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Avatar.stories.tsx,../../packages/ui/src/components/atoms/Avatar.stories.tsx:
│  Duplicate stories with id: atoms-avatar--size-32
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Avatar.stories.tsx,../../packages/ui/src/components/atoms/Avatar.stories.tsx:
│  Duplicate stories with id: atoms-avatar--size-48
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Avatar.stories.tsx,../../packages/ui/src/components/atoms/Avatar.stories.tsx:
│  Duplicate stories with id: atoms-avatar--size-64
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Avatar.stories.tsx,../../packages/ui/src/components/atoms/Avatar.stories.tsx:
│  Duplicate stories with id: atoms-avatar--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Chip.stories.tsx,../../packages/ui/src/components/atoms/Chip.stories.tsx:
│  Duplicate stories with id: atoms-chip--back-compat-variants
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Chip.stories.tsx,../../packages/ui/src/components/atoms/Chip.stories.tsx:
│  Duplicate stories with id: atoms-chip--tones-and-colors
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Chip.stories.tsx,../../packages/ui/src/components/atoms/Chip.stories.tsx:
│  Duplicate stories with id: atoms-chip--sizes-and-actions
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Chip.stories.tsx,../../packages/ui/src/components/atoms/Chip.stories.tsx:
│  Duplicate stories with id: atoms-chip--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ColorSwatch.stories.tsx,../../packages/ui/src/components/atoms/ColorSwatch.stories.tsx:
│  Duplicate stories with id: atoms-colorswatch--palette
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ColorSwatch.stories.tsx,../../packages/ui/src/components/atoms/ColorSwatch.stories.tsx:
│  Duplicate stories with id: atoms-colorswatch--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/FileSelector.stories.tsx,../../packages/ui/src/components/atoms/FileSelector.stories.tsx:
│  Duplicate stories with id: atoms-fileselector--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/FileSelector.stories.tsx,../../packages/ui/src/components/atoms/FileSelector.stories.tsx:
│  Duplicate stories with id: atoms-fileselector--with-preview
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/FormField.stories.tsx,../../packages/ui/src/components/atoms/FormField.stories.tsx:
│  Duplicate stories with id: atoms-formfield--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/FormField.stories.tsx,../../packages/ui/src/components/atoms/FormField.stories.tsx:
│  Duplicate stories with id: atoms-formfield--with-error
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Icon.stories.tsx,../../packages/ui/src/components/atoms/Icon.stories.tsx:
│  Duplicate stories with id: atoms-icon--primary
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Icon.stories.tsx,../../packages/ui/src/components/atoms/Icon.stories.tsx:
│  Duplicate stories with id: atoms-icon--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Icon.stories.tsx,../../packages/ui/src/components/atoms/Icon.stories.tsx:
│  Duplicate stories with id: atoms-icon--missing-icon-fallback
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/IconButton.stories.tsx,../../packages/ui/src/components/atoms/IconButton.stories.tsx:
│  Duplicate stories with id: atoms-iconbutton--variants
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/IconButton.stories.tsx,../../packages/ui/src/components/atoms/IconButton.stories.tsx:
│  Duplicate stories with id: atoms-iconbutton--sizes
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/IconButton.stories.tsx,../../packages/ui/src/components/atoms/IconButton.stories.tsx:
│  Duplicate stories with id: atoms-iconbutton--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/LineChart.stories.tsx,../../packages/ui/src/components/atoms/LineChart.stories.tsx:
│  Duplicate stories with id: atoms-linechart--primary
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/LineChart.stories.tsx,../../packages/ui/src/components/atoms/LineChart.stories.tsx:
│  Duplicate stories with id: atoms-linechart--without-tooltip
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/LineChart.stories.tsx,../../packages/ui/src/components/atoms/LineChart.stories.tsx:
│  Duplicate stories with id: atoms-linechart--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/LinkText.stories.tsx,../../packages/ui/src/components/atoms/LinkText.stories.tsx:
│  Duplicate stories with id: atoms-linktext--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/LinkText.stories.tsx,../../packages/ui/src/components/atoms/LinkText.stories.tsx:
│  Duplicate stories with id: atoms-linktext--soft-tone
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/LinkText.stories.tsx,../../packages/ui/src/components/atoms/LinkText.stories.tsx:
│  Duplicate stories with id: atoms-linktext--inside-panel
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/LinkText.stories.tsx,../../packages/ui/src/components/atoms/LinkText.stories.tsx:
│  Duplicate stories with id: atoms-linktext--as-child
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Loader.stories.tsx,../../packages/ui/src/components/atoms/Loader.stories.tsx:
│  Duplicate stories with id: atoms-loader--primary
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Loader.stories.tsx,../../packages/ui/src/components/atoms/Loader.stories.tsx:
│  Duplicate stories with id: atoms-loader--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Logo.stories.tsx,../../packages/ui/src/components/atoms/Logo.stories.tsx:
│  Duplicate stories with id: atoms-logo--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/PaginationDot.stories.tsx,../../packages/ui/src/components/atoms/PaginationDot.stories.tsx:
│  Duplicate stories with id: atoms-paginationdot--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Popover.stories.tsx,../../packages/ui/src/components/atoms/Popover.stories.tsx:
│  Duplicate stories with id: atoms-popover--panel-surface
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Popover.stories.tsx,../../packages/ui/src/components/atoms/Popover.stories.tsx:
│  Duplicate stories with id: atoms-popover--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Price.stories.tsx,../../packages/ui/src/components/atoms/Price.stories.tsx:
│  Duplicate stories with id: atoms-price--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ProductBadge.stories.tsx,../../packages/ui/src/components/atoms/ProductBadge.stories.tsx:
│  Duplicate stories with id: atoms-productbadge--back-compat-variants
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ProductBadge.stories.tsx,../../packages/ui/src/components/atoms/ProductBadge.stories.tsx:
│  Duplicate stories with id: atoms-productbadge--tones-and-colors
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ProductBadge.stories.tsx,../../packages/ui/src/components/atoms/ProductBadge.stories.tsx:
│  Duplicate stories with id: atoms-productbadge--sizes-and-tones
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ProductBadge.stories.tsx,../../packages/ui/src/components/atoms/ProductBadge.stories.tsx:
│  Duplicate stories with id: atoms-productbadge--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Progress.stories.tsx,../../packages/ui/src/components/atoms/Progress.stories.tsx:
│  Duplicate stories with id: atoms-progress--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Progress.stories.tsx,../../packages/ui/src/components/atoms/Progress.stories.tsx:
│  Duplicate stories with id: atoms-progress--with-zero-value
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Progress.stories.tsx,../../packages/ui/src/components/atoms/Progress.stories.tsx:
│  Duplicate stories with id: atoms-progress--with-overflow-value
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Radio.stories.tsx,../../packages/ui/src/components/atoms/Radio.stories.tsx:
│  Duplicate stories with id: atoms-radio--group
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Radio.stories.tsx,../../packages/ui/src/components/atoms/Radio.stories.tsx:
│  Duplicate stories with id: atoms-radio--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/RatingStars.stories.tsx,../../packages/ui/src/components/atoms/RatingStars.stories.tsx:
│  Duplicate stories with id: atoms-ratingstars--primary
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/RatingStars.stories.tsx,../../packages/ui/src/components/atoms/RatingStars.stories.tsx:
│  Duplicate stories with id: atoms-ratingstars--half-star
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/RatingStars.stories.tsx,../../packages/ui/src/components/atoms/RatingStars.stories.tsx:
│  Duplicate stories with id: atoms-ratingstars--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/SelectField.stories.tsx,../../packages/ui/src/components/atoms/SelectField.stories.tsx:
│  Duplicate stories with id: atoms-selectfield--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/SelectField.stories.tsx,../../packages/ui/src/components/atoms/SelectField.stories.tsx:
│  Duplicate stories with id: atoms-selectfield--with-error
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Skeleton.stories.tsx,../../packages/ui/src/components/atoms/Skeleton.stories.tsx:
│  Duplicate stories with id: atoms-skeleton--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatCard.stories.tsx,../../packages/ui/src/components/atoms/StatCard.stories.tsx:
│  Duplicate stories with id: atoms-statcard--revenue
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatCard.stories.tsx,../../packages/ui/src/components/atoms/StatCard.stories.tsx:
│  Duplicate stories with id: atoms-statcard--sessions
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatCard.stories.tsx,../../packages/ui/src/components/atoms/StatCard.stories.tsx:
│  Duplicate stories with id: atoms-statcard--conversion-rate
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatCard.stories.tsx,../../packages/ui/src/components/atoms/StatCard.stories.tsx:
│  Duplicate stories with id: atoms-statcard--with-custom-styles
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatCard.stories.tsx,../../packages/ui/src/components/atoms/StatCard.stories.tsx:
│  Duplicate stories with id: atoms-statcard--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--room-available
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--room-occupied
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--room-cleaning
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--room-maintenance
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--stock-low
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--stock-ok
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--stock-high
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--order-pending
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--order-processing
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--order-completed
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--small-size
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--large-size
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--dot-only
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--custom-label
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--all-room-statuses
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--all-stock-statuses
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--all-order-statuses
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--sizes
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--dots-only
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--in-data-table
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StockStatus.stories.tsx,../../packages/ui/src/components/atoms/StockStatus.stories.tsx:
│  Duplicate stories with id: atoms-stockstatus--variants
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StockStatus.stories.tsx,../../packages/ui/src/components/atoms/StockStatus.stories.tsx:
│  Duplicate stories with id: atoms-stockstatus--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Switch.stories.tsx,../../packages/ui/src/components/atoms/Switch.stories.tsx:
│  Duplicate stories with id: atoms-switch--uncontrolled
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Switch.stories.tsx,../../packages/ui/src/components/atoms/Switch.stories.tsx:
│  Duplicate stories with id: atoms-switch--controlled
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Switch.stories.tsx,../../packages/ui/src/components/atoms/Switch.stories.tsx:
│  Duplicate stories with id: atoms-switch--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Tag.stories.tsx,../../packages/ui/src/components/atoms/Tag.stories.tsx:
│  Duplicate stories with id: atoms-tag--variants
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Tag.stories.tsx,../../packages/ui/src/components/atoms/Tag.stories.tsx:
│  Duplicate stories with id: atoms-tag--tones-and-colors
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Tag.stories.tsx,../../packages/ui/src/components/atoms/Tag.stories.tsx:
│  Duplicate stories with id: atoms-tag--sizes-and-tones
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Tag.stories.tsx,../../packages/ui/src/components/atoms/Tag.stories.tsx:
│  Duplicate stories with id: atoms-tag--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ThemeToggle.stories.tsx,../../packages/ui/src/components/atoms/ThemeToggle.stories.tsx:
│  Duplicate stories with id: atoms-themetoggle--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ThemeToggle.stories.tsx,../../packages/ui/src/components/atoms/ThemeToggle.stories.tsx:
│  Duplicate stories with id: atoms-themetoggle--with-labels
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ThemeToggle.stories.tsx,../../packages/ui/src/components/atoms/ThemeToggle.stories.tsx:
│  Duplicate stories with id: atoms-themetoggle--medium
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ThemeToggle.stories.tsx,../../packages/ui/src/components/atoms/ThemeToggle.stories.tsx:
│  Duplicate stories with id: atoms-themetoggle--medium-with-labels
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ThemeToggle.stories.tsx,../../packages/ui/src/components/atoms/ThemeToggle.stories.tsx:
│  Duplicate stories with id: atoms-themetoggle--light-selected
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ThemeToggle.stories.tsx,../../packages/ui/src/components/atoms/ThemeToggle.stories.tsx:
│  Duplicate stories with id: atoms-themetoggle--dark-selected
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ThemeToggle.stories.tsx,../../packages/ui/src/components/atoms/ThemeToggle.stories.tsx:
│  Duplicate stories with id: atoms-themetoggle--system-selected
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Toast.stories.tsx,../../packages/ui/src/components/atoms/Toast.stories.tsx:
│  Duplicate stories with id: atoms-toast--soft-variants
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Toast.stories.tsx,../../packages/ui/src/components/atoms/Toast.stories.tsx:
│  Duplicate stories with id: atoms-toast--solid-variants
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Toast.stories.tsx,../../packages/ui/src/components/atoms/Toast.stories.tsx:
│  Duplicate stories with id: atoms-toast--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Tooltip.stories.tsx,../../packages/ui/src/components/atoms/Tooltip.stories.tsx:
│  Duplicate stories with id: atoms-tooltip--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/VideoPlayer.stories.tsx,../../packages/ui/src/components/atoms/VideoPlayer.stories.tsx:
│  Duplicate stories with id: atoms-videoplayer--primary
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/VideoPlayer.stories.tsx,../../packages/ui/src/components/atoms/VideoPlayer.stories.tsx:
│  Duplicate stories with id: atoms-videoplayer--autoplay
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/VideoPlayer.stories.tsx,../../packages/ui/src/components/atoms/VideoPlayer.stories.tsx:
│  Duplicate stories with id: atoms-videoplayer--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/VideoPlayer.stories.tsx,../../packages/ui/src/components/atoms/VideoPlayer.stories.tsx:
│  Duplicate stories with id: atoms-videoplayer--missing-captions-warning
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ZoomImage.stories.tsx,../../packages/ui/src/components/atoms/ZoomImage.stories.tsx:
│  Duplicate stories with id: atoms-zoomimage--click-zoom
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ZoomImage.stories.tsx,../../packages/ui/src/components/atoms/ZoomImage.stories.tsx:
│  Duplicate stories with id: atoms-zoomimage--hover-zoom
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ZoomImage.stories.tsx,../../packages/ui/src/components/atoms/ZoomImage.stories.tsx:
│  Duplicate stories with id: atoms-zoomimage--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ZoomImage.stories.tsx,../../packages/ui/src/components/atoms/ZoomImage.stories.tsx:
│  Duplicate stories with id: atoms-zoomimage--keyboard-toggle
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Button.stories.tsx,../../packages/ui/src/components/atoms/primitives/Button.stories.tsx:
│  Duplicate stories with id: atoms-primitives-button--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Button.stories.tsx,../../packages/ui/src/components/atoms/primitives/Button.stories.tsx:
│  Duplicate stories with id: atoms-primitives-button--variants
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Button.stories.tsx,../../packages/ui/src/components/atoms/primitives/Button.stories.tsx:
│  Duplicate stories with id: atoms-primitives-button--sizes
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Card.stories.tsx,../../packages/ui/src/components/atoms/primitives/Card.stories.tsx:
│  Duplicate stories with id: atoms-primitives-card--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Checkbox.stories.tsx,../../packages/ui/src/components/atoms/primitives/Checkbox.stories.tsx:
│  Duplicate stories with id: atoms-primitives-checkbox--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Cluster.stories.tsx,../../packages/ui/src/components/atoms/primitives/Cluster.stories.tsx:
│  Duplicate stories with id: primitives-cluster--basic
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Cluster.stories.tsx,../../packages/ui/src/components/atoms/primitives/Cluster.stories.tsx:
│  Duplicate stories with id: primitives-cluster--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Cover.stories.tsx,../../packages/ui/src/components/atoms/primitives/Cover.stories.tsx:
│  Duplicate stories with id: primitives-cover--basic
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Cover.stories.tsx,../../packages/ui/src/components/atoms/primitives/Cover.stories.tsx:
│  Duplicate stories with id: primitives-cover--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Dialog.stories.tsx,../../packages/ui/src/components/atoms/primitives/Dialog.stories.tsx:
│  Duplicate stories with id: atoms-primitives-dialog--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Grid.stories.tsx,../../packages/ui/src/components/atoms/primitives/Grid.stories.tsx:
│  Duplicate stories with id: primitives-grid--basic
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Grid.stories.tsx,../../packages/ui/src/components/atoms/primitives/Grid.stories.tsx:
│  Duplicate stories with id: primitives-grid--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Inline.stories.tsx,../../packages/ui/src/components/atoms/primitives/Inline.stories.tsx:
│  Duplicate stories with id: primitives-inline--basic
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Inline.stories.tsx,../../packages/ui/src/components/atoms/primitives/Inline.stories.tsx:
│  Duplicate stories with id: primitives-inline--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Input.stories.tsx,../../packages/ui/src/components/atoms/primitives/Input.stories.tsx:
│  Duplicate stories with id: atoms-primitives-input--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Input.stories.tsx,../../packages/ui/src/components/atoms/primitives/Input.stories.tsx:
│  Duplicate stories with id: atoms-primitives-input--with-long-value
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/PrimitivesPlayground.stories.tsx,../../packages/ui/src/components/atoms/primitives/PrimitivesPlayground.stories.tsx:
│  Duplicate stories with id: atoms-primitives-playground--basic-controls
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Select.stories.tsx,../../packages/ui/src/components/atoms/primitives/Select.stories.tsx:
│  Duplicate stories with id: atoms-primitives-select--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Sidebar.stories.tsx,../../packages/ui/src/components/atoms/primitives/Sidebar.stories.tsx:
│  Duplicate stories with id: primitives-sidebar--basic
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Sidebar.stories.tsx,../../packages/ui/src/components/atoms/primitives/Sidebar.stories.tsx:
│  Duplicate stories with id: primitives-sidebar--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Stack.stories.tsx,../../packages/ui/src/components/atoms/primitives/Stack.stories.tsx:
│  Duplicate stories with id: primitives-stack--basic
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Stack.stories.tsx,../../packages/ui/src/components/atoms/primitives/Stack.stories.tsx:
│  Duplicate stories with id: primitives-stack--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Table.stories.tsx,../../packages/ui/src/components/atoms/primitives/Table.stories.tsx:
│  Duplicate stories with id: primitives-table--hover-vs-selected
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Table.stories.tsx,../../packages/ui/src/components/atoms/primitives/Table.stories.tsx:
│  Duplicate stories with id: primitives-table--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Textarea.stories.tsx,../../packages/ui/src/components/atoms/primitives/Textarea.stories.tsx:
│  Duplicate stories with id: atoms-primitives-textarea--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Textarea.stories.tsx,../../packages/ui/src/components/atoms/primitives/Textarea.stories.tsx:
│  Duplicate stories with id:
│  atoms-primitives-textarea--with-long-unbroken
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/accordion.stories.tsx,../../packages/ui/src/components/atoms/primitives/accordion.stories.tsx:
│  Duplicate stories with id: atoms-primitives-accordion--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/drawer.stories.tsx,../../packages/ui/src/components/atoms/primitives/drawer.stories.tsx:
│  Duplicate stories with id: primitives-drawer--right
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/drawer.stories.tsx,../../packages/ui/src/components/atoms/primitives/drawer.stories.tsx:
│  Duplicate stories with id: primitives-drawer--left
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/drawer.stories.tsx,../../packages/ui/src/components/atoms/primitives/drawer.stories.tsx:
│  Duplicate stories with id: primitives-drawer--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/drawer.stories.tsx,../../packages/ui/src/components/atoms/primitives/drawer.stories.tsx:
│  Duplicate stories with id: primitives-drawer--keyboard-close
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/dropdown-menu.stories.tsx,../../packages/ui/src/components/atoms/primitives/dropdown-menu.stories.tsx:
│  Duplicate stories with id: primitives-dropdownmenu--panel-surface
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/dropdown-menu.stories.tsx,../../packages/ui/src/components/atoms/primitives/dropdown-menu.stories.tsx:
│  Duplicate stories with id: primitives-dropdownmenu--submenu
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/dropdown-menu.stories.tsx,../../packages/ui/src/components/atoms/primitives/dropdown-menu.stories.tsx:
│  Duplicate stories with id: primitives-dropdownmenu--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/overlayScrim.stories.tsx,../../packages/ui/src/components/atoms/primitives/overlayScrim.stories.tsx:
│  Duplicate stories with id: atoms-primitives-overlayscrim--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/slot.stories.tsx,../../packages/ui/src/components/atoms/primitives/slot.stories.tsx:
│  Duplicate stories with id: atoms-primitives-slot--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Button.pseudo.stories.tsx,../../packages/ui/src/components/atoms/shadcn/Button.pseudo.stories.tsx:
│  Duplicate stories with id: atoms-button-pseudo-states--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Button.pseudo.stories.tsx,../../packages/ui/src/components/atoms/shadcn/Button.pseudo.stories.tsx:
│  Duplicate stories with id: atoms-button-pseudo-states--disabled
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Button.pseudo.stories.tsx,../../packages/ui/src/components/atoms/shadcn/Button.pseudo.stories.tsx:
│  Duplicate stories with id: atoms-button-pseudo-states--icon
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Button.stories.tsx,../../packages/ui/src/components/atoms/shadcn/Button.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-button--playground
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Button.stories.tsx,../../packages/ui/src/components/atoms/shadcn/Button.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-button--outline
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Button.stories.tsx,../../packages/ui/src/components/atoms/shadcn/Button.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-button--ghost
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Button.stories.tsx,../../packages/ui/src/components/atoms/shadcn/Button.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-button--destructive
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Button.stories.tsx,../../packages/ui/src/components/atoms/shadcn/Button.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-button--icon-only
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Card.stories.tsx,../../packages/ui/src/components/atoms/shadcn/Card.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-card--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Checkbox.stories.tsx,../../packages/ui/src/components/atoms/shadcn/Checkbox.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-checkbox--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Dialog.stories.tsx,../../packages/ui/src/components/atoms/shadcn/Dialog.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-dialog--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Input.stories.tsx,../../packages/ui/src/components/atoms/shadcn/Input.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-input--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Select.stories.tsx,../../packages/ui/src/components/atoms/shadcn/Select.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-select--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Table.stories.tsx,../../packages/ui/src/components/atoms/shadcn/Table.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-table--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Textarea.stories.tsx,../../packages/ui/src/components/atoms/shadcn/Textarea.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-textarea--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/Accordion.stories.tsx,../../packages/ui/src/components/molecules/Accordion.stories.tsx:
│  Duplicate stories with id: molecules-accordion--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/Accordion.stories.tsx,../../packages/ui/src/components/molecules/Accordion.stories.tsx:
│  Duplicate stories with id: molecules-accordion--long-content
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/Breadcrumbs.stories.tsx,../../packages/ui/src/components/molecules/Breadcrumbs.stories.tsx:
│  Duplicate stories with id: molecules-breadcrumbs--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/CodeBlock.stories.tsx,../../packages/ui/src/components/molecules/CodeBlock.stories.tsx:
│  Duplicate stories with id: molecules-codeblock--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/CodeBlock.stories.tsx,../../packages/ui/src/components/molecules/CodeBlock.stories.tsx:
│  Duplicate stories with id: molecules-codeblock--with-custom-labels
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/CurrencySwitcher.client.stories.tsx,../../packages/ui/src/components/molecules/CurrencySwitcher.client.stories.tsx:
│  Duplicate stories with id: molecules-currencyswitcher-client--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/CurrencySwitcher.stories.tsx,../../packages/ui/src/components/molecules/CurrencySwitcher.stories.tsx:
│  Duplicate stories with id: molecules-currencyswitcher--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/FormField.stories.tsx,../../packages/ui/src/components/molecules/FormField.stories.tsx:
│  Duplicate stories with id: molecules-formfield--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/Image360Viewer.stories.tsx,../../packages/ui/src/components/molecules/Image360Viewer.stories.tsx:
│  Duplicate stories with id: molecules-image360viewer--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/LanguageSwitcher.stories.tsx,../../packages/ui/src/components/molecules/LanguageSwitcher.stories.tsx:
│  Duplicate stories with id: molecules-languageswitcher--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/MediaSelector.stories.tsx,../../packages/ui/src/components/molecules/MediaSelector.stories.tsx:
│  Duplicate stories with id: molecules-mediaselector--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/PaginationControl.stories.tsx,../../packages/ui/src/components/molecules/PaginationControl.stories.tsx:
│  Duplicate stories with id: molecules-paginationcontrol--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/PaymentMethodSelector.stories.tsx,../../packages/ui/src/components/molecules/PaymentMethodSelector.stories.tsx:
│  Duplicate stories with id: molecules-paymentmethodselector--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/PriceCluster.stories.tsx,../../packages/ui/src/components/molecules/PriceCluster.stories.tsx:
│  Duplicate stories with id: molecules-pricecluster--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/PromoCodeInput.stories.tsx,../../packages/ui/src/components/molecules/PromoCodeInput.stories.tsx:
│  Duplicate stories with id: molecules-promocodeinput--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/QuantityInput.stories.tsx,../../packages/ui/src/components/molecules/QuantityInput.stories.tsx:
│  Duplicate stories with id: molecules-quantityinput--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/QuantityInput.stories.tsx,../../packages/ui/src/components/molecules/QuantityInput.stories.tsx:
│  Duplicate stories with id: molecules-quantityinput--at-max
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/RatingSummary.stories.tsx,../../packages/ui/src/components/molecules/RatingSummary.stories.tsx:
│  Duplicate stories with id: molecules-ratingsummary--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/SearchBar.stories.tsx,../../packages/ui/src/components/molecules/SearchBar.stories.tsx:
│  Duplicate stories with id: molecules-searchbar--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/SearchBar.stories.tsx,../../packages/ui/src/components/molecules/SearchBar.stories.tsx:
│  Duplicate stories with id: molecules-searchbar--prefilled-query
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/SearchBar.stories.tsx,../../packages/ui/src/components/molecules/SearchBar.stories.tsx:
│  Duplicate stories with id: molecules-searchbar--keyboard-navigation
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/SustainabilityBadgeCluster.stories.tsx,../../packages/ui/src/components/molecules/SustainabilityBadgeCluster.stories.tsx:
│  Duplicate stories with id:
│  molecules-sustainabilitybadgecluster--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ARViewer.stories.tsx,../../packages/design-system/src/atoms/ARViewer.stories.tsx:
│  Duplicate stories with id: atoms-arviewer--primary
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ARViewer.stories.tsx,../../packages/design-system/src/atoms/ARViewer.stories.tsx:
│  Duplicate stories with id: atoms-arviewer--large
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ARViewer.stories.tsx,../../packages/design-system/src/atoms/ARViewer.stories.tsx:
│  Duplicate stories with id: atoms-arviewer--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ARViewer.stories.tsx,../../packages/design-system/src/atoms/ARViewer.stories.tsx:
│  Duplicate stories with id: atoms-arviewer--broken-model-fallback
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Alert.stories.tsx,../../packages/design-system/src/atoms/Alert.stories.tsx:
│  Duplicate stories with id: atoms-alert--variants
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Alert.stories.tsx,../../packages/design-system/src/atoms/Alert.stories.tsx:
│  Duplicate stories with id: atoms-alert--solid
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Alert.stories.tsx,../../packages/design-system/src/atoms/Alert.stories.tsx:
│  Duplicate stories with id: atoms-alert--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Avatar.stories.tsx,../../packages/design-system/src/atoms/Avatar.stories.tsx:
│  Duplicate stories with id: atoms-avatar--size-32
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Avatar.stories.tsx,../../packages/design-system/src/atoms/Avatar.stories.tsx:
│  Duplicate stories with id: atoms-avatar--size-48
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Avatar.stories.tsx,../../packages/design-system/src/atoms/Avatar.stories.tsx:
│  Duplicate stories with id: atoms-avatar--size-64
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Avatar.stories.tsx,../../packages/design-system/src/atoms/Avatar.stories.tsx:
│  Duplicate stories with id: atoms-avatar--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Chip.stories.tsx,../../packages/design-system/src/atoms/Chip.stories.tsx:
│  Duplicate stories with id: atoms-chip--back-compat-variants
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Chip.stories.tsx,../../packages/design-system/src/atoms/Chip.stories.tsx:
│  Duplicate stories with id: atoms-chip--tones-and-colors
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Chip.stories.tsx,../../packages/design-system/src/atoms/Chip.stories.tsx:
│  Duplicate stories with id: atoms-chip--sizes-and-actions
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Chip.stories.tsx,../../packages/design-system/src/atoms/Chip.stories.tsx:
│  Duplicate stories with id: atoms-chip--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ColorSwatch.stories.tsx,../../packages/design-system/src/atoms/ColorSwatch.stories.tsx:
│  Duplicate stories with id: atoms-colorswatch--palette
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ColorSwatch.stories.tsx,../../packages/design-system/src/atoms/ColorSwatch.stories.tsx:
│  Duplicate stories with id: atoms-colorswatch--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ConfirmDialog.stories.tsx,../../packages/design-system/src/atoms/ConfirmDialog.stories.tsx:
│  Duplicate stories with id: atoms-confirmdialog--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ConfirmDialog.stories.tsx,../../packages/design-system/src/atoms/ConfirmDialog.stories.tsx:
│  Duplicate stories with id: atoms-confirmdialog--destructive
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ConfirmDialog.stories.tsx,../../packages/design-system/src/atoms/ConfirmDialog.stories.tsx:
│  Duplicate stories with id: atoms-confirmdialog--with-description
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/EmptyState.stories.tsx,../../packages/design-system/src/atoms/EmptyState.stories.tsx:
│  Duplicate stories with id: atoms-emptystate--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/EmptyState.stories.tsx,../../packages/design-system/src/atoms/EmptyState.stories.tsx:
│  Duplicate stories with id: atoms-emptystate--with-description
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/EmptyState.stories.tsx,../../packages/design-system/src/atoms/EmptyState.stories.tsx:
│  Duplicate stories with id: atoms-emptystate--with-action
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/EmptyState.stories.tsx,../../packages/design-system/src/atoms/EmptyState.stories.tsx:
│  Duplicate stories with id: atoms-emptystate--error-state
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/FileSelector.stories.tsx,../../packages/design-system/src/atoms/FileSelector.stories.tsx:
│  Duplicate stories with id: atoms-fileselector--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/FileSelector.stories.tsx,../../packages/design-system/src/atoms/FileSelector.stories.tsx:
│  Duplicate stories with id: atoms-fileselector--with-preview
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/FormField.stories.tsx,../../packages/design-system/src/atoms/FormField.stories.tsx:
│  Duplicate stories with id: atoms-formfield--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/FormField.stories.tsx,../../packages/design-system/src/atoms/FormField.stories.tsx:
│  Duplicate stories with id: atoms-formfield--with-error
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Icon.stories.tsx,../../packages/design-system/src/atoms/Icon.stories.tsx:
│  Duplicate stories with id: atoms-icon--primary
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Icon.stories.tsx,../../packages/design-system/src/atoms/Icon.stories.tsx:
│  Duplicate stories with id: atoms-icon--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Icon.stories.tsx,../../packages/design-system/src/atoms/Icon.stories.tsx:
│  Duplicate stories with id: atoms-icon--missing-icon-fallback
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/IconButton.stories.tsx,../../packages/design-system/src/atoms/IconButton.stories.tsx:
│  Duplicate stories with id: atoms-iconbutton--variants
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/IconButton.stories.tsx,../../packages/design-system/src/atoms/IconButton.stories.tsx:
│  Duplicate stories with id: atoms-iconbutton--sizes
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/IconButton.stories.tsx,../../packages/design-system/src/atoms/IconButton.stories.tsx:
│  Duplicate stories with id: atoms-iconbutton--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/LineChart.stories.tsx,../../packages/design-system/src/atoms/LineChart.stories.tsx:
│  Duplicate stories with id: atoms-linechart--primary
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/LineChart.stories.tsx,../../packages/design-system/src/atoms/LineChart.stories.tsx:
│  Duplicate stories with id: atoms-linechart--without-tooltip
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/LineChart.stories.tsx,../../packages/design-system/src/atoms/LineChart.stories.tsx:
│  Duplicate stories with id: atoms-linechart--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/LinkText.stories.tsx,../../packages/design-system/src/atoms/LinkText.stories.tsx:
│  Duplicate stories with id: atoms-linktext--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/LinkText.stories.tsx,../../packages/design-system/src/atoms/LinkText.stories.tsx:
│  Duplicate stories with id: atoms-linktext--soft-tone
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/LinkText.stories.tsx,../../packages/design-system/src/atoms/LinkText.stories.tsx:
│  Duplicate stories with id: atoms-linktext--inside-panel
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/LinkText.stories.tsx,../../packages/design-system/src/atoms/LinkText.stories.tsx:
│  Duplicate stories with id: atoms-linktext--as-child
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Loader.stories.tsx,../../packages/design-system/src/atoms/Loader.stories.tsx:
│  Duplicate stories with id: atoms-loader--primary
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Loader.stories.tsx,../../packages/design-system/src/atoms/Loader.stories.tsx:
│  Duplicate stories with id: atoms-loader--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Logo.stories.tsx,../../packages/design-system/src/atoms/Logo.stories.tsx:
│  Duplicate stories with id: atoms-logo--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/PaginationDot.stories.tsx,../../packages/design-system/src/atoms/PaginationDot.stories.tsx:
│  Duplicate stories with id: atoms-paginationdot--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Popover.stories.tsx,../../packages/design-system/src/atoms/Popover.stories.tsx:
│  Duplicate stories with id: atoms-popover--panel-surface
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Popover.stories.tsx,../../packages/design-system/src/atoms/Popover.stories.tsx:
│  Duplicate stories with id: atoms-popover--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Price.stories.tsx,../../packages/design-system/src/atoms/Price.stories.tsx:
│  Duplicate stories with id: atoms-price--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ProductBadge.stories.tsx,../../packages/design-system/src/atoms/ProductBadge.stories.tsx:
│  Duplicate stories with id: atoms-productbadge--back-compat-variants
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ProductBadge.stories.tsx,../../packages/design-system/src/atoms/ProductBadge.stories.tsx:
│  Duplicate stories with id: atoms-productbadge--tones-and-colors
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ProductBadge.stories.tsx,../../packages/design-system/src/atoms/ProductBadge.stories.tsx:
│  Duplicate stories with id: atoms-productbadge--sizes-and-tones
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ProductBadge.stories.tsx,../../packages/design-system/src/atoms/ProductBadge.stories.tsx:
│  Duplicate stories with id: atoms-productbadge--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Progress.stories.tsx,../../packages/design-system/src/atoms/Progress.stories.tsx:
│  Duplicate stories with id: atoms-progress--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Progress.stories.tsx,../../packages/design-system/src/atoms/Progress.stories.tsx:
│  Duplicate stories with id: atoms-progress--with-zero-value
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Progress.stories.tsx,../../packages/design-system/src/atoms/Progress.stories.tsx:
│  Duplicate stories with id: atoms-progress--with-overflow-value
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Radio.stories.tsx,../../packages/design-system/src/atoms/Radio.stories.tsx:
│  Duplicate stories with id: atoms-radio--group
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Radio.stories.tsx,../../packages/design-system/src/atoms/Radio.stories.tsx:
│  Duplicate stories with id: atoms-radio--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/RatingStars.stories.tsx,../../packages/design-system/src/atoms/RatingStars.stories.tsx:
│  Duplicate stories with id: atoms-ratingstars--primary
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/RatingStars.stories.tsx,../../packages/design-system/src/atoms/RatingStars.stories.tsx:
│  Duplicate stories with id: atoms-ratingstars--half-star
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/RatingStars.stories.tsx,../../packages/design-system/src/atoms/RatingStars.stories.tsx:
│  Duplicate stories with id: atoms-ratingstars--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/SelectField.stories.tsx,../../packages/design-system/src/atoms/SelectField.stories.tsx:
│  Duplicate stories with id: atoms-selectfield--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/SelectField.stories.tsx,../../packages/design-system/src/atoms/SelectField.stories.tsx:
│  Duplicate stories with id: atoms-selectfield--with-error
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Skeleton.stories.tsx,../../packages/design-system/src/atoms/Skeleton.stories.tsx:
│  Duplicate stories with id: atoms-skeleton--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatCard.stories.tsx,../../packages/design-system/src/atoms/StatCard.stories.tsx:
│  Duplicate stories with id: atoms-statcard--revenue
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatCard.stories.tsx,../../packages/design-system/src/atoms/StatCard.stories.tsx:
│  Duplicate stories with id: atoms-statcard--sessions
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatCard.stories.tsx,../../packages/design-system/src/atoms/StatCard.stories.tsx:
│  Duplicate stories with id: atoms-statcard--conversion-rate
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatCard.stories.tsx,../../packages/design-system/src/atoms/StatCard.stories.tsx:
│  Duplicate stories with id: atoms-statcard--with-custom-styles
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatCard.stories.tsx,../../packages/design-system/src/atoms/StatCard.stories.tsx:
│  Duplicate stories with id: atoms-statcard--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--room-available
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--room-occupied
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--room-cleaning
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--room-maintenance
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--stock-low
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--stock-ok
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--stock-high
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--order-pending
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--order-processing
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--order-completed
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--small-size
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--large-size
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--dot-only
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--custom-label
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--all-room-statuses
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--all-stock-statuses
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--all-order-statuses
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--sizes
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--dots-only
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--in-data-table
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StockStatus.stories.tsx,../../packages/design-system/src/atoms/StockStatus.stories.tsx:
│  Duplicate stories with id: atoms-stockstatus--variants
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StockStatus.stories.tsx,../../packages/design-system/src/atoms/StockStatus.stories.tsx:
│  Duplicate stories with id: atoms-stockstatus--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Switch.stories.tsx,../../packages/design-system/src/atoms/Switch.stories.tsx:
│  Duplicate stories with id: atoms-switch--uncontrolled
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Switch.stories.tsx,../../packages/design-system/src/atoms/Switch.stories.tsx:
│  Duplicate stories with id: atoms-switch--controlled
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Switch.stories.tsx,../../packages/design-system/src/atoms/Switch.stories.tsx:
│  Duplicate stories with id: atoms-switch--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Tag.stories.tsx,../../packages/design-system/src/atoms/Tag.stories.tsx:
│  Duplicate stories with id: atoms-tag--variants
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Tag.stories.tsx,../../packages/design-system/src/atoms/Tag.stories.tsx:
│  Duplicate stories with id: atoms-tag--tones-and-colors
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Tag.stories.tsx,../../packages/design-system/src/atoms/Tag.stories.tsx:
│  Duplicate stories with id: atoms-tag--sizes-and-tones
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Tag.stories.tsx,../../packages/design-system/src/atoms/Tag.stories.tsx:
│  Duplicate stories with id: atoms-tag--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ThemeToggle.stories.tsx,../../packages/design-system/src/atoms/ThemeToggle.stories.tsx:
│  Duplicate stories with id: atoms-themetoggle--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ThemeToggle.stories.tsx,../../packages/design-system/src/atoms/ThemeToggle.stories.tsx:
│  Duplicate stories with id: atoms-themetoggle--with-labels
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ThemeToggle.stories.tsx,../../packages/design-system/src/atoms/ThemeToggle.stories.tsx:
│  Duplicate stories with id: atoms-themetoggle--medium
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ThemeToggle.stories.tsx,../../packages/design-system/src/atoms/ThemeToggle.stories.tsx:
│  Duplicate stories with id: atoms-themetoggle--medium-with-labels
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ThemeToggle.stories.tsx,../../packages/design-system/src/atoms/ThemeToggle.stories.tsx:
│  Duplicate stories with id: atoms-themetoggle--light-selected
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ThemeToggle.stories.tsx,../../packages/design-system/src/atoms/ThemeToggle.stories.tsx:
│  Duplicate stories with id: atoms-themetoggle--dark-selected
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ThemeToggle.stories.tsx,../../packages/design-system/src/atoms/ThemeToggle.stories.tsx:
│  Duplicate stories with id: atoms-themetoggle--system-selected
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Toast.stories.tsx,../../packages/design-system/src/atoms/Toast.stories.tsx:
│  Duplicate stories with id: atoms-toast--soft-variants
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Toast.stories.tsx,../../packages/design-system/src/atoms/Toast.stories.tsx:
│  Duplicate stories with id: atoms-toast--solid-variants
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Toast.stories.tsx,../../packages/design-system/src/atoms/Toast.stories.tsx:
│  Duplicate stories with id: atoms-toast--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Tooltip.stories.tsx,../../packages/design-system/src/atoms/Tooltip.stories.tsx:
│  Duplicate stories with id: atoms-tooltip--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/VideoPlayer.stories.tsx,../../packages/design-system/src/atoms/VideoPlayer.stories.tsx:
│  Duplicate stories with id: atoms-videoplayer--primary
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/VideoPlayer.stories.tsx,../../packages/design-system/src/atoms/VideoPlayer.stories.tsx:
│  Duplicate stories with id: atoms-videoplayer--autoplay
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/VideoPlayer.stories.tsx,../../packages/design-system/src/atoms/VideoPlayer.stories.tsx:
│  Duplicate stories with id: atoms-videoplayer--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/VideoPlayer.stories.tsx,../../packages/design-system/src/atoms/VideoPlayer.stories.tsx:
│  Duplicate stories with id: atoms-videoplayer--missing-captions-warning
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ZoomImage.stories.tsx,../../packages/design-system/src/atoms/ZoomImage.stories.tsx:
│  Duplicate stories with id: atoms-zoomimage--click-zoom
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ZoomImage.stories.tsx,../../packages/design-system/src/atoms/ZoomImage.stories.tsx:
│  Duplicate stories with id: atoms-zoomimage--hover-zoom
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ZoomImage.stories.tsx,../../packages/design-system/src/atoms/ZoomImage.stories.tsx:
│  Duplicate stories with id: atoms-zoomimage--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ZoomImage.stories.tsx,../../packages/design-system/src/atoms/ZoomImage.stories.tsx:
│  Duplicate stories with id: atoms-zoomimage--keyboard-toggle
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/Accordion.stories.tsx,../../packages/design-system/src/molecules/Accordion.stories.tsx:
│  Duplicate stories with id: molecules-accordion--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/Accordion.stories.tsx,../../packages/design-system/src/molecules/Accordion.stories.tsx:
│  Duplicate stories with id: molecules-accordion--long-content
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/Breadcrumbs.stories.tsx,../../packages/design-system/src/molecules/Breadcrumbs.stories.tsx:
│  Duplicate stories with id: molecules-breadcrumbs--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/CodeBlock.stories.tsx,../../packages/design-system/src/molecules/CodeBlock.stories.tsx:
│  Duplicate stories with id: molecules-codeblock--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/CodeBlock.stories.tsx,../../packages/design-system/src/molecules/CodeBlock.stories.tsx:
│  Duplicate stories with id: molecules-codeblock--with-custom-labels
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/CurrencySwitcher.client.stories.tsx,../../packages/design-system/src/molecules/CurrencySwitcher.client.stories.tsx:
│  Duplicate stories with id: molecules-currencyswitcher-client--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/CurrencySwitcher.stories.tsx,../../packages/design-system/src/molecules/CurrencySwitcher.stories.tsx:
│  Duplicate stories with id: molecules-currencyswitcher--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/DatePicker.stories.tsx,../../packages/design-system/src/molecules/DatePicker.stories.tsx:
│  Duplicate stories with id: molecules-datepicker--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/DatePicker.stories.tsx,../../packages/design-system/src/molecules/DatePicker.stories.tsx:
│  Duplicate stories with id: molecules-datepicker--with-selected-date
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/DatePicker.stories.tsx,../../packages/design-system/src/molecules/DatePicker.stories.tsx:
│  Duplicate stories with id: molecules-datepicker--with-min-max-dates
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/DatePicker.stories.tsx,../../packages/design-system/src/molecules/DatePicker.stories.tsx:
│  Duplicate stories with id: molecules-datepicker--with-time-select
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/DatePicker.stories.tsx,../../packages/design-system/src/molecules/DatePicker.stories.tsx:
│  Duplicate stories with id: molecules-datepicker--clearable
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/DatePicker.stories.tsx,../../packages/design-system/src/molecules/DatePicker.stories.tsx:
│  Duplicate stories with id: molecules-datepicker--inline
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/DatePicker.stories.tsx,../../packages/design-system/src/molecules/DatePicker.stories.tsx:
│  Duplicate stories with id: molecules-datepicker--disabled
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/DatePicker.stories.tsx,../../packages/design-system/src/molecules/DatePicker.stories.tsx:
│  Duplicate stories with id: molecules-datepicker--invalid
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/Form/Form.stories.tsx,../../packages/design-system/src/molecules/Form/Form.stories.tsx:
│  Duplicate stories with id: molecules-form--login-form
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/Form/Form.stories.tsx,../../packages/design-system/src/molecules/Form/Form.stories.tsx:
│  Duplicate stories with id: molecules-form--registration-form
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/Form/Form.stories.tsx,../../packages/design-system/src/molecules/Form/Form.stories.tsx:
│  Duplicate stories with id: molecules-form--validation-states
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/Form/Form.stories.tsx,../../packages/design-system/src/molecules/Form/Form.stories.tsx:
│  Duplicate stories with id: molecules-form--with-zod-schema
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/FormField.stories.tsx,../../packages/design-system/src/molecules/FormField.stories.tsx:
│  Duplicate stories with id: molecules-formfield--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/Image360Viewer.stories.tsx,../../packages/design-system/src/molecules/Image360Viewer.stories.tsx:
│  Duplicate stories with id: molecules-image360viewer--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/LanguageSwitcher.stories.tsx,../../packages/design-system/src/molecules/LanguageSwitcher.stories.tsx:
│  Duplicate stories with id: molecules-languageswitcher--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/MediaSelector.stories.tsx,../../packages/design-system/src/molecules/MediaSelector.stories.tsx:
│  Duplicate stories with id: molecules-mediaselector--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/PaginationControl.stories.tsx,../../packages/design-system/src/molecules/PaginationControl.stories.tsx:
│  Duplicate stories with id: molecules-paginationcontrol--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/PaymentMethodSelector.stories.tsx,../../packages/design-system/src/molecules/PaymentMethodSelector.stories.tsx:
│  Duplicate stories with id: molecules-paymentmethodselector--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/PriceCluster.stories.tsx,../../packages/design-system/src/molecules/PriceCluster.stories.tsx:
│  Duplicate stories with id: molecules-pricecluster--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/PromoCodeInput.stories.tsx,../../packages/design-system/src/molecules/PromoCodeInput.stories.tsx:
│  Duplicate stories with id: molecules-promocodeinput--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/QuantityInput.stories.tsx,../../packages/design-system/src/molecules/QuantityInput.stories.tsx:
│  Duplicate stories with id: molecules-quantityinput--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/QuantityInput.stories.tsx,../../packages/design-system/src/molecules/QuantityInput.stories.tsx:
│  Duplicate stories with id: molecules-quantityinput--at-max
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/RatingSummary.stories.tsx,../../packages/design-system/src/molecules/RatingSummary.stories.tsx:
│  Duplicate stories with id: molecules-ratingsummary--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/SearchBar.stories.tsx,../../packages/design-system/src/molecules/SearchBar.stories.tsx:
│  Duplicate stories with id: molecules-searchbar--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/SearchBar.stories.tsx,../../packages/design-system/src/molecules/SearchBar.stories.tsx:
│  Duplicate stories with id: molecules-searchbar--prefilled-query
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/SearchBar.stories.tsx,../../packages/design-system/src/molecules/SearchBar.stories.tsx:
│  Duplicate stories with id: molecules-searchbar--keyboard-navigation
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/Stepper.stories.tsx,../../packages/design-system/src/molecules/Stepper.stories.tsx:
│  Duplicate stories with id: molecules-stepper--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/Stepper.stories.tsx,../../packages/design-system/src/molecules/Stepper.stories.tsx:
│  Duplicate stories with id: molecules-stepper--with-descriptions
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/Stepper.stories.tsx,../../packages/design-system/src/molecules/Stepper.stories.tsx:
│  Duplicate stories with id: molecules-stepper--with-custom-icons
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/Stepper.stories.tsx,../../packages/design-system/src/molecules/Stepper.stories.tsx:
│  Duplicate stories with id: molecules-stepper--vertical-orientation
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/Stepper.stories.tsx,../../packages/design-system/src/molecules/Stepper.stories.tsx:
│  Duplicate stories with id: molecules-stepper--with-disabled-steps
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/Stepper.stories.tsx,../../packages/design-system/src/molecules/Stepper.stories.tsx:
│  Duplicate stories with id: molecules-stepper--all-completed
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/Stepper.stories.tsx,../../packages/design-system/src/molecules/Stepper.stories.tsx:
│  Duplicate stories with id: molecules-stepper--first-step
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/Stepper.stories.tsx,../../packages/design-system/src/molecules/Stepper.stories.tsx:
│  Duplicate stories with id: molecules-stepper--vertical-with-icons
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/SustainabilityBadgeCluster.stories.tsx,../../packages/design-system/src/molecules/SustainabilityBadgeCluster.stories.tsx:
│  Duplicate stories with id:
│  molecules-sustainabilitybadgecluster--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Button.stories.tsx,../../packages/design-system/src/primitives/Button.stories.tsx:
│  Duplicate stories with id: atoms-primitives-button--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Button.stories.tsx,../../packages/design-system/src/primitives/Button.stories.tsx:
│  Duplicate stories with id: atoms-primitives-button--variants
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Button.stories.tsx,../../packages/design-system/src/primitives/Button.stories.tsx:
│  Duplicate stories with id: atoms-primitives-button--sizes
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Button.stories.tsx,../../packages/design-system/src/primitives/Button.stories.tsx:
│  Duplicate stories with id: atoms-primitives-button--shape-depths
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Button.stories.tsx,../../packages/design-system/src/primitives/Button.stories.tsx:
│  Duplicate stories with id: atoms-primitives-button--as-child-link
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Card.stories.tsx,../../packages/design-system/src/primitives/Card.stories.tsx:
│  Duplicate stories with id: atoms-primitives-card--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Card.stories.tsx,../../packages/design-system/src/primitives/Card.stories.tsx:
│  Duplicate stories with id: atoms-primitives-card--shape-depths
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Checkbox.stories.tsx,../../packages/design-system/src/primitives/Checkbox.stories.tsx:
│  Duplicate stories with id: atoms-primitives-checkbox--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Cluster.stories.tsx,../../packages/design-system/src/primitives/Cluster.stories.tsx:
│  Duplicate stories with id: primitives-cluster--basic
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Cluster.stories.tsx,../../packages/design-system/src/primitives/Cluster.stories.tsx:
│  Duplicate stories with id: primitives-cluster--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Cover.stories.tsx,../../packages/design-system/src/primitives/Cover.stories.tsx:
│  Duplicate stories with id: primitives-cover--basic
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Cover.stories.tsx,../../packages/design-system/src/primitives/Cover.stories.tsx:
│  Duplicate stories with id: primitives-cover--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Dialog.stories.tsx,../../packages/design-system/src/primitives/Dialog.stories.tsx:
│  Duplicate stories with id: atoms-primitives-dialog--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Dialog.stories.tsx,../../packages/design-system/src/primitives/Dialog.stories.tsx:
│  Duplicate stories with id: atoms-primitives-dialog--square-corners
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Grid.stories.tsx,../../packages/design-system/src/primitives/Grid.stories.tsx:
│  Duplicate stories with id: primitives-grid--basic
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Grid.stories.tsx,../../packages/design-system/src/primitives/Grid.stories.tsx:
│  Duplicate stories with id: primitives-grid--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Inline.stories.tsx,../../packages/design-system/src/primitives/Inline.stories.tsx:
│  Duplicate stories with id: primitives-inline--basic
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Inline.stories.tsx,../../packages/design-system/src/primitives/Inline.stories.tsx:
│  Duplicate stories with id: primitives-inline--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Input.stories.tsx,../../packages/design-system/src/primitives/Input.stories.tsx:
│  Duplicate stories with id: atoms-primitives-input--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Input.stories.tsx,../../packages/design-system/src/primitives/Input.stories.tsx:
│  Duplicate stories with id: atoms-primitives-input--with-long-value
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Input.stories.tsx,../../packages/design-system/src/primitives/Input.stories.tsx:
│  Duplicate stories with id: atoms-primitives-input--shape-depths
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Input.stories.tsx,../../packages/design-system/src/primitives/Input.stories.tsx:
│  Duplicate stories with id: atoms-primitives-input--density-scale
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/PrimitivesPlayground.stories.tsx,../../packages/design-system/src/primitives/PrimitivesPlayground.stories.tsx:
│  Duplicate stories with id: atoms-primitives-playground--basic-controls
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Select.stories.tsx,../../packages/design-system/src/primitives/Select.stories.tsx:
│  Duplicate stories with id: atoms-primitives-select--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Select.stories.tsx,../../packages/design-system/src/primitives/Select.stories.tsx:
│  Duplicate stories with id: atoms-primitives-select--shape-depths
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Select.stories.tsx,../../packages/design-system/src/primitives/Select.stories.tsx:
│  Duplicate stories with id: atoms-primitives-select--density-scale
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Sidebar.stories.tsx,../../packages/design-system/src/primitives/Sidebar.stories.tsx:
│  Duplicate stories with id: primitives-sidebar--basic
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Sidebar.stories.tsx,../../packages/design-system/src/primitives/Sidebar.stories.tsx:
│  Duplicate stories with id: primitives-sidebar--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Stack.stories.tsx,../../packages/design-system/src/primitives/Stack.stories.tsx:
│  Duplicate stories with id: primitives-stack--basic
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Stack.stories.tsx,../../packages/design-system/src/primitives/Stack.stories.tsx:
│  Duplicate stories with id: primitives-stack--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Table.stories.tsx,../../packages/design-system/src/primitives/Table.stories.tsx:
│  Duplicate stories with id: primitives-table--hover-vs-selected
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Table.stories.tsx,../../packages/design-system/src/primitives/Table.stories.tsx:
│  Duplicate stories with id: primitives-table--compact-density
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Table.stories.tsx,../../packages/design-system/src/primitives/Table.stories.tsx:
│  Duplicate stories with id: primitives-table--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Textarea.stories.tsx,../../packages/design-system/src/primitives/Textarea.stories.tsx:
│  Duplicate stories with id: atoms-primitives-textarea--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Textarea.stories.tsx,../../packages/design-system/src/primitives/Textarea.stories.tsx:
│  Duplicate stories with id:
│  atoms-primitives-textarea--with-long-unbroken
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Textarea.stories.tsx,../../packages/design-system/src/primitives/Textarea.stories.tsx:
│  Duplicate stories with id: atoms-primitives-textarea--shape-depths
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Textarea.stories.tsx,../../packages/design-system/src/primitives/Textarea.stories.tsx:
│  Duplicate stories with id: atoms-primitives-textarea--density-scale
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/accordion.stories.tsx,../../packages/design-system/src/primitives/accordion.stories.tsx:
│  Duplicate stories with id: atoms-primitives-accordion--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/combobox.stories.tsx,../../packages/design-system/src/primitives/combobox.stories.tsx:
│  Duplicate stories with id: atoms-primitives-combobox--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/combobox.stories.tsx,../../packages/design-system/src/primitives/combobox.stories.tsx:
│  Duplicate stories with id: atoms-primitives-combobox--with-keywords
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/combobox.stories.tsx,../../packages/design-system/src/primitives/combobox.stories.tsx:
│  Duplicate stories with id: atoms-primitives-combobox--uncontrolled
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/combobox.stories.tsx,../../packages/design-system/src/primitives/combobox.stories.tsx:
│  Duplicate stories with id: atoms-primitives-combobox--compact-density
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/combobox.stories.tsx,../../packages/design-system/src/primitives/combobox.stories.tsx:
│  Duplicate stories with id: atoms-primitives-combobox--custom-empty
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/drawer.stories.tsx,../../packages/design-system/src/primitives/drawer.stories.tsx:
│  Duplicate stories with id: primitives-drawer--right
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/drawer.stories.tsx,../../packages/design-system/src/primitives/drawer.stories.tsx:
│  Duplicate stories with id: primitives-drawer--left
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/drawer.stories.tsx,../../packages/design-system/src/primitives/drawer.stories.tsx:
│  Duplicate stories with id: primitives-drawer--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/drawer.stories.tsx,../../packages/design-system/src/primitives/drawer.stories.tsx:
│  Duplicate stories with id: primitives-drawer--keyboard-close
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/drawer.stories.tsx,../../packages/design-system/src/primitives/drawer.stories.tsx:
│  Duplicate stories with id: primitives-drawer--square-corners
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/dropdown-menu.stories.tsx,../../packages/design-system/src/primitives/dropdown-menu.stories.tsx:
│  Duplicate stories with id: primitives-dropdownmenu--panel-surface
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/dropdown-menu.stories.tsx,../../packages/design-system/src/primitives/dropdown-menu.stories.tsx:
│  Duplicate stories with id: primitives-dropdownmenu--submenu
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/dropdown-menu.stories.tsx,../../packages/design-system/src/primitives/dropdown-menu.stories.tsx:
│  Duplicate stories with id: primitives-dropdownmenu--compact-density
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/dropdown-menu.stories.tsx,../../packages/design-system/src/primitives/dropdown-menu.stories.tsx:
│  Duplicate stories with id: primitives-dropdownmenu--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/overlayScrim.stories.tsx,../../packages/design-system/src/primitives/overlayScrim.stories.tsx:
│  Duplicate stories with id: atoms-primitives-overlayscrim--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/radio-group.stories.tsx,../../packages/design-system/src/primitives/radio-group.stories.tsx:
│  Duplicate stories with id: primitives-radiogroup--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/radio-group.stories.tsx,../../packages/design-system/src/primitives/radio-group.stories.tsx:
│  Duplicate stories with id: primitives-radiogroup--with-disabled
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/scroll-area.stories.tsx,../../packages/design-system/src/primitives/scroll-area.stories.tsx:
│  Duplicate stories with id: primitives-scrollarea--vertical
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/scroll-area.stories.tsx,../../packages/design-system/src/primitives/scroll-area.stories.tsx:
│  Duplicate stories with id: primitives-scrollarea--horizontal
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/separator.stories.tsx,../../packages/design-system/src/primitives/separator.stories.tsx:
│  Duplicate stories with id: primitives-separator--horizontal
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/separator.stories.tsx,../../packages/design-system/src/primitives/separator.stories.tsx:
│  Duplicate stories with id: primitives-separator--vertical
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/slider.stories.tsx,../../packages/design-system/src/primitives/slider.stories.tsx:
│  Duplicate stories with id: primitives-slider--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/slider.stories.tsx,../../packages/design-system/src/primitives/slider.stories.tsx:
│  Duplicate stories with id: primitives-slider--range
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/slider.stories.tsx,../../packages/design-system/src/primitives/slider.stories.tsx:
│  Duplicate stories with id: primitives-slider--with-steps
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/slot.stories.tsx,../../packages/design-system/src/primitives/slot.stories.tsx:
│  Duplicate stories with id: atoms-primitives-slot--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/tabs.stories.tsx,../../packages/design-system/src/primitives/tabs.stories.tsx:
│  Duplicate stories with id: primitives-tabs--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/tabs.stories.tsx,../../packages/design-system/src/primitives/tabs.stories.tsx:
│  Duplicate stories with id: primitives-tabs--with-disabled
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Button.pseudo.stories.tsx,../../packages/design-system/src/shadcn/Button.pseudo.stories.tsx:
│  Duplicate stories with id: atoms-button-pseudo-states--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Button.pseudo.stories.tsx,../../packages/design-system/src/shadcn/Button.pseudo.stories.tsx:
│  Duplicate stories with id: atoms-button-pseudo-states--disabled
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Button.pseudo.stories.tsx,../../packages/design-system/src/shadcn/Button.pseudo.stories.tsx:
│  Duplicate stories with id: atoms-button-pseudo-states--icon
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Button.stories.tsx,../../packages/design-system/src/shadcn/Button.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-button--playground
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Button.stories.tsx,../../packages/design-system/src/shadcn/Button.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-button--outline
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Button.stories.tsx,../../packages/design-system/src/shadcn/Button.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-button--ghost
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Button.stories.tsx,../../packages/design-system/src/shadcn/Button.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-button--destructive
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Button.stories.tsx,../../packages/design-system/src/shadcn/Button.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-button--icon-only
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Card.stories.tsx,../../packages/design-system/src/shadcn/Card.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-card--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Checkbox.stories.tsx,../../packages/design-system/src/shadcn/Checkbox.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-checkbox--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Dialog.stories.tsx,../../packages/design-system/src/shadcn/Dialog.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-dialog--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Input.stories.tsx,../../packages/design-system/src/shadcn/Input.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-input--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Select.stories.tsx,../../packages/design-system/src/shadcn/Select.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-select--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Table.stories.tsx,../../packages/design-system/src/shadcn/Table.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-table--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Textarea.stories.tsx,../../packages/design-system/src/shadcn/Textarea.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-textarea--default
│
■  Error: [38;2;241;97;97mUnable to index files:
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ARViewer.stories.tsx,../../packages/ui/src/components/atoms/ARViewer.stories.tsx:
│  Duplicate stories with id: atoms-arviewer--primary
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ARViewer.stories.tsx,../../packages/ui/src/components/atoms/ARViewer.stories.tsx:
│  Duplicate stories with id: atoms-arviewer--large
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ARViewer.stories.tsx,../../packages/ui/src/components/atoms/ARViewer.stories.tsx:
│  Duplicate stories with id: atoms-arviewer--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ARViewer.stories.tsx,../../packages/ui/src/components/atoms/ARViewer.stories.tsx:
│  Duplicate stories with id: atoms-arviewer--broken-model-fallback
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Alert.stories.tsx,../../packages/ui/src/components/atoms/Alert.stories.tsx:
│  Duplicate stories with id: atoms-alert--variants
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Alert.stories.tsx,../../packages/ui/src/components/atoms/Alert.stories.tsx:
│  Duplicate stories with id: atoms-alert--solid
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Alert.stories.tsx,../../packages/ui/src/components/atoms/Alert.stories.tsx:
│  Duplicate stories with id: atoms-alert--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Avatar.stories.tsx,../../packages/ui/src/components/atoms/Avatar.stories.tsx:
│  Duplicate stories with id: atoms-avatar--size-32
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Avatar.stories.tsx,../../packages/ui/src/components/atoms/Avatar.stories.tsx:
│  Duplicate stories with id: atoms-avatar--size-48
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Avatar.stories.tsx,../../packages/ui/src/components/atoms/Avatar.stories.tsx:
│  Duplicate stories with id: atoms-avatar--size-64
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Avatar.stories.tsx,../../packages/ui/src/components/atoms/Avatar.stories.tsx:
│  Duplicate stories with id: atoms-avatar--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Chip.stories.tsx,../../packages/ui/src/components/atoms/Chip.stories.tsx:
│  Duplicate stories with id: atoms-chip--back-compat-variants
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Chip.stories.tsx,../../packages/ui/src/components/atoms/Chip.stories.tsx:
│  Duplicate stories with id: atoms-chip--tones-and-colors
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Chip.stories.tsx,../../packages/ui/src/components/atoms/Chip.stories.tsx:
│  Duplicate stories with id: atoms-chip--sizes-and-actions
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Chip.stories.tsx,../../packages/ui/src/components/atoms/Chip.stories.tsx:
│  Duplicate stories with id: atoms-chip--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ColorSwatch.stories.tsx,../../packages/ui/src/components/atoms/ColorSwatch.stories.tsx:
│  Duplicate stories with id: atoms-colorswatch--palette
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ColorSwatch.stories.tsx,../../packages/ui/src/components/atoms/ColorSwatch.stories.tsx:
│  Duplicate stories with id: atoms-colorswatch--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/FileSelector.stories.tsx,../../packages/ui/src/components/atoms/FileSelector.stories.tsx:
│  Duplicate stories with id: atoms-fileselector--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/FileSelector.stories.tsx,../../packages/ui/src/components/atoms/FileSelector.stories.tsx:
│  Duplicate stories with id: atoms-fileselector--with-preview
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/FormField.stories.tsx,../../packages/ui/src/components/atoms/FormField.stories.tsx:
│  Duplicate stories with id: atoms-formfield--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/FormField.stories.tsx,../../packages/ui/src/components/atoms/FormField.stories.tsx:
│  Duplicate stories with id: atoms-formfield--with-error
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Icon.stories.tsx,../../packages/ui/src/components/atoms/Icon.stories.tsx:
│  Duplicate stories with id: atoms-icon--primary
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Icon.stories.tsx,../../packages/ui/src/components/atoms/Icon.stories.tsx:
│  Duplicate stories with id: atoms-icon--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Icon.stories.tsx,../../packages/ui/src/components/atoms/Icon.stories.tsx:
│  Duplicate stories with id: atoms-icon--missing-icon-fallback
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/IconButton.stories.tsx,../../packages/ui/src/components/atoms/IconButton.stories.tsx:
│  Duplicate stories with id: atoms-iconbutton--variants
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/IconButton.stories.tsx,../../packages/ui/src/components/atoms/IconButton.stories.tsx:
│  Duplicate stories with id: atoms-iconbutton--sizes
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/IconButton.stories.tsx,../../packages/ui/src/components/atoms/IconButton.stories.tsx:
│  Duplicate stories with id: atoms-iconbutton--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/LineChart.stories.tsx,../../packages/ui/src/components/atoms/LineChart.stories.tsx:
│  Duplicate stories with id: atoms-linechart--primary
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/LineChart.stories.tsx,../../packages/ui/src/components/atoms/LineChart.stories.tsx:
│  Duplicate stories with id: atoms-linechart--without-tooltip
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/LineChart.stories.tsx,../../packages/ui/src/components/atoms/LineChart.stories.tsx:
│  Duplicate stories with id: atoms-linechart--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/LinkText.stories.tsx,../../packages/ui/src/components/atoms/LinkText.stories.tsx:
│  Duplicate stories with id: atoms-linktext--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/LinkText.stories.tsx,../../packages/ui/src/components/atoms/LinkText.stories.tsx:
│  Duplicate stories with id: atoms-linktext--soft-tone
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/LinkText.stories.tsx,../../packages/ui/src/components/atoms/LinkText.stories.tsx:
│  Duplicate stories with id: atoms-linktext--inside-panel
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/LinkText.stories.tsx,../../packages/ui/src/components/atoms/LinkText.stories.tsx:
│  Duplicate stories with id: atoms-linktext--as-child
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Loader.stories.tsx,../../packages/ui/src/components/atoms/Loader.stories.tsx:
│  Duplicate stories with id: atoms-loader--primary
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Loader.stories.tsx,../../packages/ui/src/components/atoms/Loader.stories.tsx:
│  Duplicate stories with id: atoms-loader--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Logo.stories.tsx,../../packages/ui/src/components/atoms/Logo.stories.tsx:
│  Duplicate stories with id: atoms-logo--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/PaginationDot.stories.tsx,../../packages/ui/src/components/atoms/PaginationDot.stories.tsx:
│  Duplicate stories with id: atoms-paginationdot--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Popover.stories.tsx,../../packages/ui/src/components/atoms/Popover.stories.tsx:
│  Duplicate stories with id: atoms-popover--panel-surface
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Popover.stories.tsx,../../packages/ui/src/components/atoms/Popover.stories.tsx:
│  Duplicate stories with id: atoms-popover--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Price.stories.tsx,../../packages/ui/src/components/atoms/Price.stories.tsx:
│  Duplicate stories with id: atoms-price--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ProductBadge.stories.tsx,../../packages/ui/src/components/atoms/ProductBadge.stories.tsx:
│  Duplicate stories with id: atoms-productbadge--back-compat-variants
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ProductBadge.stories.tsx,../../packages/ui/src/components/atoms/ProductBadge.stories.tsx:
│  Duplicate stories with id: atoms-productbadge--tones-and-colors
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ProductBadge.stories.tsx,../../packages/ui/src/components/atoms/ProductBadge.stories.tsx:
│  Duplicate stories with id: atoms-productbadge--sizes-and-tones
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ProductBadge.stories.tsx,../../packages/ui/src/components/atoms/ProductBadge.stories.tsx:
│  Duplicate stories with id: atoms-productbadge--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Progress.stories.tsx,../../packages/ui/src/components/atoms/Progress.stories.tsx:
│  Duplicate stories with id: atoms-progress--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Progress.stories.tsx,../../packages/ui/src/components/atoms/Progress.stories.tsx:
│  Duplicate stories with id: atoms-progress--with-zero-value
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Progress.stories.tsx,../../packages/ui/src/components/atoms/Progress.stories.tsx:
│  Duplicate stories with id: atoms-progress--with-overflow-value
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Radio.stories.tsx,../../packages/ui/src/components/atoms/Radio.stories.tsx:
│  Duplicate stories with id: atoms-radio--group
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Radio.stories.tsx,../../packages/ui/src/components/atoms/Radio.stories.tsx:
│  Duplicate stories with id: atoms-radio--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/RatingStars.stories.tsx,../../packages/ui/src/components/atoms/RatingStars.stories.tsx:
│  Duplicate stories with id: atoms-ratingstars--primary
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/RatingStars.stories.tsx,../../packages/ui/src/components/atoms/RatingStars.stories.tsx:
│  Duplicate stories with id: atoms-ratingstars--half-star
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/RatingStars.stories.tsx,../../packages/ui/src/components/atoms/RatingStars.stories.tsx:
│  Duplicate stories with id: atoms-ratingstars--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/SelectField.stories.tsx,../../packages/ui/src/components/atoms/SelectField.stories.tsx:
│  Duplicate stories with id: atoms-selectfield--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/SelectField.stories.tsx,../../packages/ui/src/components/atoms/SelectField.stories.tsx:
│  Duplicate stories with id: atoms-selectfield--with-error
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Skeleton.stories.tsx,../../packages/ui/src/components/atoms/Skeleton.stories.tsx:
│  Duplicate stories with id: atoms-skeleton--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatCard.stories.tsx,../../packages/ui/src/components/atoms/StatCard.stories.tsx:
│  Duplicate stories with id: atoms-statcard--revenue
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatCard.stories.tsx,../../packages/ui/src/components/atoms/StatCard.stories.tsx:
│  Duplicate stories with id: atoms-statcard--sessions
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatCard.stories.tsx,../../packages/ui/src/components/atoms/StatCard.stories.tsx:
│  Duplicate stories with id: atoms-statcard--conversion-rate
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatCard.stories.tsx,../../packages/ui/src/components/atoms/StatCard.stories.tsx:
│  Duplicate stories with id: atoms-statcard--with-custom-styles
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatCard.stories.tsx,../../packages/ui/src/components/atoms/StatCard.stories.tsx:
│  Duplicate stories with id: atoms-statcard--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--room-available
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--room-occupied
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--room-cleaning
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--room-maintenance
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--stock-low
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--stock-ok
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--stock-high
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--order-pending
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--order-processing
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--order-completed
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--small-size
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--large-size
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--dot-only
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--custom-label
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--all-room-statuses
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--all-stock-statuses
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--all-order-statuses
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--sizes
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--dots-only
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--in-data-table
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StockStatus.stories.tsx,../../packages/ui/src/components/atoms/StockStatus.stories.tsx:
│  Duplicate stories with id: atoms-stockstatus--variants
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StockStatus.stories.tsx,../../packages/ui/src/components/atoms/StockStatus.stories.tsx:
│  Duplicate stories with id: atoms-stockstatus--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Switch.stories.tsx,../../packages/ui/src/components/atoms/Switch.stories.tsx:
│  Duplicate stories with id: atoms-switch--uncontrolled
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Switch.stories.tsx,../../packages/ui/src/components/atoms/Switch.stories.tsx:
│  Duplicate stories with id: atoms-switch--controlled
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Switch.stories.tsx,../../packages/ui/src/components/atoms/Switch.stories.tsx:
│  Duplicate stories with id: atoms-switch--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Tag.stories.tsx,../../packages/ui/src/components/atoms/Tag.stories.tsx:
│  Duplicate stories with id: atoms-tag--variants
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Tag.stories.tsx,../../packages/ui/src/components/atoms/Tag.stories.tsx:
│  Duplicate stories with id: atoms-tag--tones-and-colors
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Tag.stories.tsx,../../packages/ui/src/components/atoms/Tag.stories.tsx:
│  Duplicate stories with id: atoms-tag--sizes-and-tones
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Tag.stories.tsx,../../packages/ui/src/components/atoms/Tag.stories.tsx:
│  Duplicate stories with id: atoms-tag--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ThemeToggle.stories.tsx,../../packages/ui/src/components/atoms/ThemeToggle.stories.tsx:
│  Duplicate stories with id: atoms-themetoggle--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ThemeToggle.stories.tsx,../../packages/ui/src/components/atoms/ThemeToggle.stories.tsx:
│  Duplicate stories with id: atoms-themetoggle--with-labels
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ThemeToggle.stories.tsx,../../packages/ui/src/components/atoms/ThemeToggle.stories.tsx:
│  Duplicate stories with id: atoms-themetoggle--medium
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ThemeToggle.stories.tsx,../../packages/ui/src/components/atoms/ThemeToggle.stories.tsx:
│  Duplicate stories with id: atoms-themetoggle--medium-with-labels
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ThemeToggle.stories.tsx,../../packages/ui/src/components/atoms/ThemeToggle.stories.tsx:
│  Duplicate stories with id: atoms-themetoggle--light-selected
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ThemeToggle.stories.tsx,../../packages/ui/src/components/atoms/ThemeToggle.stories.tsx:
│  Duplicate stories with id: atoms-themetoggle--dark-selected
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ThemeToggle.stories.tsx,../../packages/ui/src/components/atoms/ThemeToggle.stories.tsx:
│  Duplicate stories with id: atoms-themetoggle--system-selected
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Toast.stories.tsx,../../packages/ui/src/components/atoms/Toast.stories.tsx:
│  Duplicate stories with id: atoms-toast--soft-variants
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Toast.stories.tsx,../../packages/ui/src/components/atoms/Toast.stories.tsx:
│  Duplicate stories with id: atoms-toast--solid-variants
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Toast.stories.tsx,../../packages/ui/src/components/atoms/Toast.stories.tsx:
│  Duplicate stories with id: atoms-toast--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Tooltip.stories.tsx,../../packages/ui/src/components/atoms/Tooltip.stories.tsx:
│  Duplicate stories with id: atoms-tooltip--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/VideoPlayer.stories.tsx,../../packages/ui/src/components/atoms/VideoPlayer.stories.tsx:
│  Duplicate stories with id: atoms-videoplayer--primary
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/VideoPlayer.stories.tsx,../../packages/ui/src/components/atoms/VideoPlayer.stories.tsx:
│  Duplicate stories with id: atoms-videoplayer--autoplay
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/VideoPlayer.stories.tsx,../../packages/ui/src/components/atoms/VideoPlayer.stories.tsx:
│  Duplicate stories with id: atoms-videoplayer--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/VideoPlayer.stories.tsx,../../packages/ui/src/components/atoms/VideoPlayer.stories.tsx:
│  Duplicate stories with id: atoms-videoplayer--missing-captions-warning
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ZoomImage.stories.tsx,../../packages/ui/src/components/atoms/ZoomImage.stories.tsx:
│  Duplicate stories with id: atoms-zoomimage--click-zoom
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ZoomImage.stories.tsx,../../packages/ui/src/components/atoms/ZoomImage.stories.tsx:
│  Duplicate stories with id: atoms-zoomimage--hover-zoom
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ZoomImage.stories.tsx,../../packages/ui/src/components/atoms/ZoomImage.stories.tsx:
│  Duplicate stories with id: atoms-zoomimage--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ZoomImage.stories.tsx,../../packages/ui/src/components/atoms/ZoomImage.stories.tsx:
│  Duplicate stories with id: atoms-zoomimage--keyboard-toggle
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Button.stories.tsx,../../packages/ui/src/components/atoms/primitives/Button.stories.tsx:
│  Duplicate stories with id: atoms-primitives-button--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Button.stories.tsx,../../packages/ui/src/components/atoms/primitives/Button.stories.tsx:
│  Duplicate stories with id: atoms-primitives-button--variants
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Button.stories.tsx,../../packages/ui/src/components/atoms/primitives/Button.stories.tsx:
│  Duplicate stories with id: atoms-primitives-button--sizes
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Card.stories.tsx,../../packages/ui/src/components/atoms/primitives/Card.stories.tsx:
│  Duplicate stories with id: atoms-primitives-card--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Checkbox.stories.tsx,../../packages/ui/src/components/atoms/primitives/Checkbox.stories.tsx:
│  Duplicate stories with id: atoms-primitives-checkbox--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Cluster.stories.tsx,../../packages/ui/src/components/atoms/primitives/Cluster.stories.tsx:
│  Duplicate stories with id: primitives-cluster--basic
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Cluster.stories.tsx,../../packages/ui/src/components/atoms/primitives/Cluster.stories.tsx:
│  Duplicate stories with id: primitives-cluster--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Cover.stories.tsx,../../packages/ui/src/components/atoms/primitives/Cover.stories.tsx:
│  Duplicate stories with id: primitives-cover--basic
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Cover.stories.tsx,../../packages/ui/src/components/atoms/primitives/Cover.stories.tsx:
│  Duplicate stories with id: primitives-cover--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Dialog.stories.tsx,../../packages/ui/src/components/atoms/primitives/Dialog.stories.tsx:
│  Duplicate stories with id: atoms-primitives-dialog--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Grid.stories.tsx,../../packages/ui/src/components/atoms/primitives/Grid.stories.tsx:
│  Duplicate stories with id: primitives-grid--basic
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Grid.stories.tsx,../../packages/ui/src/components/atoms/primitives/Grid.stories.tsx:
│  Duplicate stories with id: primitives-grid--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Inline.stories.tsx,../../packages/ui/src/components/atoms/primitives/Inline.stories.tsx:
│  Duplicate stories with id: primitives-inline--basic
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Inline.stories.tsx,../../packages/ui/src/components/atoms/primitives/Inline.stories.tsx:
│  Duplicate stories with id: primitives-inline--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Input.stories.tsx,../../packages/ui/src/components/atoms/primitives/Input.stories.tsx:
│  Duplicate stories with id: atoms-primitives-input--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Input.stories.tsx,../../packages/ui/src/components/atoms/primitives/Input.stories.tsx:
│  Duplicate stories with id: atoms-primitives-input--with-long-value
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/PrimitivesPlayground.stories.tsx,../../packages/ui/src/components/atoms/primitives/PrimitivesPlayground.stories.tsx:
│  Duplicate stories with id: atoms-primitives-playground--basic-controls
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Select.stories.tsx,../../packages/ui/src/components/atoms/primitives/Select.stories.tsx:
│  Duplicate stories with id: atoms-primitives-select--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Sidebar.stories.tsx,../../packages/ui/src/components/atoms/primitives/Sidebar.stories.tsx:
│  Duplicate stories with id: primitives-sidebar--basic
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Sidebar.stories.tsx,../../packages/ui/src/components/atoms/primitives/Sidebar.stories.tsx:
│  Duplicate stories with id: primitives-sidebar--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Stack.stories.tsx,../../packages/ui/src/components/atoms/primitives/Stack.stories.tsx:
│  Duplicate stories with id: primitives-stack--basic
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Stack.stories.tsx,../../packages/ui/src/components/atoms/primitives/Stack.stories.tsx:
│  Duplicate stories with id: primitives-stack--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Table.stories.tsx,../../packages/ui/src/components/atoms/primitives/Table.stories.tsx:
│  Duplicate stories with id: primitives-table--hover-vs-selected
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Table.stories.tsx,../../packages/ui/src/components/atoms/primitives/Table.stories.tsx:
│  Duplicate stories with id: primitives-table--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Textarea.stories.tsx,../../packages/ui/src/components/atoms/primitives/Textarea.stories.tsx:
│  Duplicate stories with id: atoms-primitives-textarea--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Textarea.stories.tsx,../../packages/ui/src/components/atoms/primitives/Textarea.stories.tsx:
│  Duplicate stories with id:
│  atoms-primitives-textarea--with-long-unbroken
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/accordion.stories.tsx,../../packages/ui/src/components/atoms/primitives/accordion.stories.tsx:
│  Duplicate stories with id: atoms-primitives-accordion--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/drawer.stories.tsx,../../packages/ui/src/components/atoms/primitives/drawer.stories.tsx:
│  Duplicate stories with id: primitives-drawer--right
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/drawer.stories.tsx,../../packages/ui/src/components/atoms/primitives/drawer.stories.tsx:
│  Duplicate stories with id: primitives-drawer--left
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/drawer.stories.tsx,../../packages/ui/src/components/atoms/primitives/drawer.stories.tsx:
│  Duplicate stories with id: primitives-drawer--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/drawer.stories.tsx,../../packages/ui/src/components/atoms/primitives/drawer.stories.tsx:
│  Duplicate stories with id: primitives-drawer--keyboard-close
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/dropdown-menu.stories.tsx,../../packages/ui/src/components/atoms/primitives/dropdown-menu.stories.tsx:
│  Duplicate stories with id: primitives-dropdownmenu--panel-surface
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/dropdown-menu.stories.tsx,../../packages/ui/src/components/atoms/primitives/dropdown-menu.stories.tsx:
│  Duplicate stories with id: primitives-dropdownmenu--submenu
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/dropdown-menu.stories.tsx,../../packages/ui/src/components/atoms/primitives/dropdown-menu.stories.tsx:
│  Duplicate stories with id: primitives-dropdownmenu--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/overlayScrim.stories.tsx,../../packages/ui/src/components/atoms/primitives/overlayScrim.stories.tsx:
│  Duplicate stories with id: atoms-primitives-overlayscrim--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/slot.stories.tsx,../../packages/ui/src/components/atoms/primitives/slot.stories.tsx:
│  Duplicate stories with id: atoms-primitives-slot--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Button.pseudo.stories.tsx,../../packages/ui/src/components/atoms/shadcn/Button.pseudo.stories.tsx:
│  Duplicate stories with id: atoms-button-pseudo-states--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Button.pseudo.stories.tsx,../../packages/ui/src/components/atoms/shadcn/Button.pseudo.stories.tsx:
│  Duplicate stories with id: atoms-button-pseudo-states--disabled
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Button.pseudo.stories.tsx,../../packages/ui/src/components/atoms/shadcn/Button.pseudo.stories.tsx:
│  Duplicate stories with id: atoms-button-pseudo-states--icon
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Button.stories.tsx,../../packages/ui/src/components/atoms/shadcn/Button.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-button--playground
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Button.stories.tsx,../../packages/ui/src/components/atoms/shadcn/Button.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-button--outline
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Button.stories.tsx,../../packages/ui/src/components/atoms/shadcn/Button.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-button--ghost
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Button.stories.tsx,../../packages/ui/src/components/atoms/shadcn/Button.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-button--destructive
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Button.stories.tsx,../../packages/ui/src/components/atoms/shadcn/Button.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-button--icon-only
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Card.stories.tsx,../../packages/ui/src/components/atoms/shadcn/Card.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-card--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Checkbox.stories.tsx,../../packages/ui/src/components/atoms/shadcn/Checkbox.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-checkbox--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Dialog.stories.tsx,../../packages/ui/src/components/atoms/shadcn/Dialog.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-dialog--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Input.stories.tsx,../../packages/ui/src/components/atoms/shadcn/Input.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-input--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Select.stories.tsx,../../packages/ui/src/components/atoms/shadcn/Select.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-select--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Table.stories.tsx,../../packages/ui/src/components/atoms/shadcn/Table.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-table--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Textarea.stories.tsx,../../packages/ui/src/components/atoms/shadcn/Textarea.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-textarea--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/Accordion.stories.tsx,../../packages/ui/src/components/molecules/Accordion.stories.tsx:
│  Duplicate stories with id: molecules-accordion--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/Accordion.stories.tsx,../../packages/ui/src/components/molecules/Accordion.stories.tsx:
│  Duplicate stories with id: molecules-accordion--long-content
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/Breadcrumbs.stories.tsx,../../packages/ui/src/components/molecules/Breadcrumbs.stories.tsx:
│  Duplicate stories with id: molecules-breadcrumbs--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/CodeBlock.stories.tsx,../../packages/ui/src/components/molecules/CodeBlock.stories.tsx:
│  Duplicate stories with id: molecules-codeblock--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/CodeBlock.stories.tsx,../../packages/ui/src/components/molecules/CodeBlock.stories.tsx:
│  Duplicate stories with id: molecules-codeblock--with-custom-labels
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/CurrencySwitcher.client.stories.tsx,../../packages/ui/src/components/molecules/CurrencySwitcher.client.stories.tsx:
│  Duplicate stories with id: molecules-currencyswitcher-client--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/CurrencySwitcher.stories.tsx,../../packages/ui/src/components/molecules/CurrencySwitcher.stories.tsx:
│  Duplicate stories with id: molecules-currencyswitcher--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/FormField.stories.tsx,../../packages/ui/src/components/molecules/FormField.stories.tsx:
│  Duplicate stories with id: molecules-formfield--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/Image360Viewer.stories.tsx,../../packages/ui/src/components/molecules/Image360Viewer.stories.tsx:
│  Duplicate stories with id: molecules-image360viewer--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/LanguageSwitcher.stories.tsx,../../packages/ui/src/components/molecules/LanguageSwitcher.stories.tsx:
│  Duplicate stories with id: molecules-languageswitcher--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/MediaSelector.stories.tsx,../../packages/ui/src/components/molecules/MediaSelector.stories.tsx:
│  Duplicate stories with id: molecules-mediaselector--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/PaginationControl.stories.tsx,../../packages/ui/src/components/molecules/PaginationControl.stories.tsx:
│  Duplicate stories with id: molecules-paginationcontrol--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/PaymentMethodSelector.stories.tsx,../../packages/ui/src/components/molecules/PaymentMethodSelector.stories.tsx:
│  Duplicate stories with id: molecules-paymentmethodselector--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/PriceCluster.stories.tsx,../../packages/ui/src/components/molecules/PriceCluster.stories.tsx:
│  Duplicate stories with id: molecules-pricecluster--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/PromoCodeInput.stories.tsx,../../packages/ui/src/components/molecules/PromoCodeInput.stories.tsx:
│  Duplicate stories with id: molecules-promocodeinput--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/QuantityInput.stories.tsx,../../packages/ui/src/components/molecules/QuantityInput.stories.tsx:
│  Duplicate stories with id: molecules-quantityinput--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/QuantityInput.stories.tsx,../../packages/ui/src/components/molecules/QuantityInput.stories.tsx:
│  Duplicate stories with id: molecules-quantityinput--at-max
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/RatingSummary.stories.tsx,../../packages/ui/src/components/molecules/RatingSummary.stories.tsx:
│  Duplicate stories with id: molecules-ratingsummary--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/SearchBar.stories.tsx,../../packages/ui/src/components/molecules/SearchBar.stories.tsx:
│  Duplicate stories with id: molecules-searchbar--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/SearchBar.stories.tsx,../../packages/ui/src/components/molecules/SearchBar.stories.tsx:
│  Duplicate stories with id: molecules-searchbar--prefilled-query
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/SearchBar.stories.tsx,../../packages/ui/src/components/molecules/SearchBar.stories.tsx:
│  Duplicate stories with id: molecules-searchbar--keyboard-navigation
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/SustainabilityBadgeCluster.stories.tsx,../../packages/ui/src/components/molecules/SustainabilityBadgeCluster.stories.tsx:
│  Duplicate stories with id:
│  molecules-sustainabilitybadgecluster--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ARViewer.stories.tsx,../../packages/design-system/src/atoms/ARViewer.stories.tsx:
│  Duplicate stories with id: atoms-arviewer--primary
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ARViewer.stories.tsx,../../packages/design-system/src/atoms/ARViewer.stories.tsx:
│  Duplicate stories with id: atoms-arviewer--large
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ARViewer.stories.tsx,../../packages/design-system/src/atoms/ARViewer.stories.tsx:
│  Duplicate stories with id: atoms-arviewer--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ARViewer.stories.tsx,../../packages/design-system/src/atoms/ARViewer.stories.tsx:
│  Duplicate stories with id: atoms-arviewer--broken-model-fallback
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Alert.stories.tsx,../../packages/design-system/src/atoms/Alert.stories.tsx:
│  Duplicate stories with id: atoms-alert--variants
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Alert.stories.tsx,../../packages/design-system/src/atoms/Alert.stories.tsx:
│  Duplicate stories with id: atoms-alert--solid
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Alert.stories.tsx,../../packages/design-system/src/atoms/Alert.stories.tsx:
│  Duplicate stories with id: atoms-alert--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Avatar.stories.tsx,../../packages/design-system/src/atoms/Avatar.stories.tsx:
│  Duplicate stories with id: atoms-avatar--size-32
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Avatar.stories.tsx,../../packages/design-system/src/atoms/Avatar.stories.tsx:
│  Duplicate stories with id: atoms-avatar--size-48
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Avatar.stories.tsx,../../packages/design-system/src/atoms/Avatar.stories.tsx:
│  Duplicate stories with id: atoms-avatar--size-64
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Avatar.stories.tsx,../../packages/design-system/src/atoms/Avatar.stories.tsx:
│  Duplicate stories with id: atoms-avatar--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Chip.stories.tsx,../../packages/design-system/src/atoms/Chip.stories.tsx:
│  Duplicate stories with id: atoms-chip--back-compat-variants
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Chip.stories.tsx,../../packages/design-system/src/atoms/Chip.stories.tsx:
│  Duplicate stories with id: atoms-chip--tones-and-colors
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Chip.stories.tsx,../../packages/design-system/src/atoms/Chip.stories.tsx:
│  Duplicate stories with id: atoms-chip--sizes-and-actions
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Chip.stories.tsx,../../packages/design-system/src/atoms/Chip.stories.tsx:
│  Duplicate stories with id: atoms-chip--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ColorSwatch.stories.tsx,../../packages/design-system/src/atoms/ColorSwatch.stories.tsx:
│  Duplicate stories with id: atoms-colorswatch--palette
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ColorSwatch.stories.tsx,../../packages/design-system/src/atoms/ColorSwatch.stories.tsx:
│  Duplicate stories with id: atoms-colorswatch--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ConfirmDialog.stories.tsx,../../packages/design-system/src/atoms/ConfirmDialog.stories.tsx:
│  Duplicate stories with id: atoms-confirmdialog--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ConfirmDialog.stories.tsx,../../packages/design-system/src/atoms/ConfirmDialog.stories.tsx:
│  Duplicate stories with id: atoms-confirmdialog--destructive
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ConfirmDialog.stories.tsx,../../packages/design-system/src/atoms/ConfirmDialog.stories.tsx:
│  Duplicate stories with id: atoms-confirmdialog--with-description
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/EmptyState.stories.tsx,../../packages/design-system/src/atoms/EmptyState.stories.tsx:
│  Duplicate stories with id: atoms-emptystate--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/EmptyState.stories.tsx,../../packages/design-system/src/atoms/EmptyState.stories.tsx:
│  Duplicate stories with id: atoms-emptystate--with-description
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/EmptyState.stories.tsx,../../packages/design-system/src/atoms/EmptyState.stories.tsx:
│  Duplicate stories with id: atoms-emptystate--with-action
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/EmptyState.stories.tsx,../../packages/design-system/src/atoms/EmptyState.stories.tsx:
│  Duplicate stories with id: atoms-emptystate--error-state
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/FileSelector.stories.tsx,../../packages/design-system/src/atoms/FileSelector.stories.tsx:
│  Duplicate stories with id: atoms-fileselector--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/FileSelector.stories.tsx,../../packages/design-system/src/atoms/FileSelector.stories.tsx:
│  Duplicate stories with id: atoms-fileselector--with-preview
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/FormField.stories.tsx,../../packages/design-system/src/atoms/FormField.stories.tsx:
│  Duplicate stories with id: atoms-formfield--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/FormField.stories.tsx,../../packages/design-system/src/atoms/FormField.stories.tsx:
│  Duplicate stories with id: atoms-formfield--with-error
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Icon.stories.tsx,../../packages/design-system/src/atoms/Icon.stories.tsx:
│  Duplicate stories with id: atoms-icon--primary
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Icon.stories.tsx,../../packages/design-system/src/atoms/Icon.stories.tsx:
│  Duplicate stories with id: atoms-icon--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Icon.stories.tsx,../../packages/design-system/src/atoms/Icon.stories.tsx:
│  Duplicate stories with id: atoms-icon--missing-icon-fallback
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/IconButton.stories.tsx,../../packages/design-system/src/atoms/IconButton.stories.tsx:
│  Duplicate stories with id: atoms-iconbutton--variants
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/IconButton.stories.tsx,../../packages/design-system/src/atoms/IconButton.stories.tsx:
│  Duplicate stories with id: atoms-iconbutton--sizes
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/IconButton.stories.tsx,../../packages/design-system/src/atoms/IconButton.stories.tsx:
│  Duplicate stories with id: atoms-iconbutton--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/LineChart.stories.tsx,../../packages/design-system/src/atoms/LineChart.stories.tsx:
│  Duplicate stories with id: atoms-linechart--primary
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/LineChart.stories.tsx,../../packages/design-system/src/atoms/LineChart.stories.tsx:
│  Duplicate stories with id: atoms-linechart--without-tooltip
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/LineChart.stories.tsx,../../packages/design-system/src/atoms/LineChart.stories.tsx:
│  Duplicate stories with id: atoms-linechart--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/LinkText.stories.tsx,../../packages/design-system/src/atoms/LinkText.stories.tsx:
│  Duplicate stories with id: atoms-linktext--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/LinkText.stories.tsx,../../packages/design-system/src/atoms/LinkText.stories.tsx:
│  Duplicate stories with id: atoms-linktext--soft-tone
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/LinkText.stories.tsx,../../packages/design-system/src/atoms/LinkText.stories.tsx:
│  Duplicate stories with id: atoms-linktext--inside-panel
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/LinkText.stories.tsx,../../packages/design-system/src/atoms/LinkText.stories.tsx:
│  Duplicate stories with id: atoms-linktext--as-child
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Loader.stories.tsx,../../packages/design-system/src/atoms/Loader.stories.tsx:
│  Duplicate stories with id: atoms-loader--primary
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Loader.stories.tsx,../../packages/design-system/src/atoms/Loader.stories.tsx:
│  Duplicate stories with id: atoms-loader--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Logo.stories.tsx,../../packages/design-system/src/atoms/Logo.stories.tsx:
│  Duplicate stories with id: atoms-logo--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/PaginationDot.stories.tsx,../../packages/design-system/src/atoms/PaginationDot.stories.tsx:
│  Duplicate stories with id: atoms-paginationdot--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Popover.stories.tsx,../../packages/design-system/src/atoms/Popover.stories.tsx:
│  Duplicate stories with id: atoms-popover--panel-surface
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Popover.stories.tsx,../../packages/design-system/src/atoms/Popover.stories.tsx:
│  Duplicate stories with id: atoms-popover--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Price.stories.tsx,../../packages/design-system/src/atoms/Price.stories.tsx:
│  Duplicate stories with id: atoms-price--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ProductBadge.stories.tsx,../../packages/design-system/src/atoms/ProductBadge.stories.tsx:
│  Duplicate stories with id: atoms-productbadge--back-compat-variants
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ProductBadge.stories.tsx,../../packages/design-system/src/atoms/ProductBadge.stories.tsx:
│  Duplicate stories with id: atoms-productbadge--tones-and-colors
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ProductBadge.stories.tsx,../../packages/design-system/src/atoms/ProductBadge.stories.tsx:
│  Duplicate stories with id: atoms-productbadge--sizes-and-tones
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ProductBadge.stories.tsx,../../packages/design-system/src/atoms/ProductBadge.stories.tsx:
│  Duplicate stories with id: atoms-productbadge--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Progress.stories.tsx,../../packages/design-system/src/atoms/Progress.stories.tsx:
│  Duplicate stories with id: atoms-progress--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Progress.stories.tsx,../../packages/design-system/src/atoms/Progress.stories.tsx:
│  Duplicate stories with id: atoms-progress--with-zero-value
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Progress.stories.tsx,../../packages/design-system/src/atoms/Progress.stories.tsx:
│  Duplicate stories with id: atoms-progress--with-overflow-value
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Radio.stories.tsx,../../packages/design-system/src/atoms/Radio.stories.tsx:
│  Duplicate stories with id: atoms-radio--group
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Radio.stories.tsx,../../packages/design-system/src/atoms/Radio.stories.tsx:
│  Duplicate stories with id: atoms-radio--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/RatingStars.stories.tsx,../../packages/design-system/src/atoms/RatingStars.stories.tsx:
│  Duplicate stories with id: atoms-ratingstars--primary
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/RatingStars.stories.tsx,../../packages/design-system/src/atoms/RatingStars.stories.tsx:
│  Duplicate stories with id: atoms-ratingstars--half-star
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/RatingStars.stories.tsx,../../packages/design-system/src/atoms/RatingStars.stories.tsx:
│  Duplicate stories with id: atoms-ratingstars--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/SelectField.stories.tsx,../../packages/design-system/src/atoms/SelectField.stories.tsx:
│  Duplicate stories with id: atoms-selectfield--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/SelectField.stories.tsx,../../packages/design-system/src/atoms/SelectField.stories.tsx:
│  Duplicate stories with id: atoms-selectfield--with-error
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Skeleton.stories.tsx,../../packages/design-system/src/atoms/Skeleton.stories.tsx:
│  Duplicate stories with id: atoms-skeleton--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatCard.stories.tsx,../../packages/design-system/src/atoms/StatCard.stories.tsx:
│  Duplicate stories with id: atoms-statcard--revenue
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatCard.stories.tsx,../../packages/design-system/src/atoms/StatCard.stories.tsx:
│  Duplicate stories with id: atoms-statcard--sessions
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatCard.stories.tsx,../../packages/design-system/src/atoms/StatCard.stories.tsx:
│  Duplicate stories with id: atoms-statcard--conversion-rate
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatCard.stories.tsx,../../packages/design-system/src/atoms/StatCard.stories.tsx:
│  Duplicate stories with id: atoms-statcard--with-custom-styles
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatCard.stories.tsx,../../packages/design-system/src/atoms/StatCard.stories.tsx:
│  Duplicate stories with id: atoms-statcard--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--room-available
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--room-occupied
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--room-cleaning
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--room-maintenance
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--stock-low
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--stock-ok
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--stock-high
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--order-pending
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--order-processing
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--order-completed
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--small-size
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--large-size
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--dot-only
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--custom-label
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--all-room-statuses
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--all-stock-statuses
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--all-order-statuses
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--sizes
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--dots-only
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx,../../packages/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx:
│  Duplicate stories with id: atoms-statusindicator--in-data-table
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StockStatus.stories.tsx,../../packages/design-system/src/atoms/StockStatus.stories.tsx:
│  Duplicate stories with id: atoms-stockstatus--variants
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StockStatus.stories.tsx,../../packages/design-system/src/atoms/StockStatus.stories.tsx:
│  Duplicate stories with id: atoms-stockstatus--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Switch.stories.tsx,../../packages/design-system/src/atoms/Switch.stories.tsx:
│  Duplicate stories with id: atoms-switch--uncontrolled
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Switch.stories.tsx,../../packages/design-system/src/atoms/Switch.stories.tsx:
│  Duplicate stories with id: atoms-switch--controlled
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Switch.stories.tsx,../../packages/design-system/src/atoms/Switch.stories.tsx:
│  Duplicate stories with id: atoms-switch--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Tag.stories.tsx,../../packages/design-system/src/atoms/Tag.stories.tsx:
│  Duplicate stories with id: atoms-tag--variants
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Tag.stories.tsx,../../packages/design-system/src/atoms/Tag.stories.tsx:
│  Duplicate stories with id: atoms-tag--tones-and-colors
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Tag.stories.tsx,../../packages/design-system/src/atoms/Tag.stories.tsx:
│  Duplicate stories with id: atoms-tag--sizes-and-tones
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Tag.stories.tsx,../../packages/design-system/src/atoms/Tag.stories.tsx:
│  Duplicate stories with id: atoms-tag--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ThemeToggle.stories.tsx,../../packages/design-system/src/atoms/ThemeToggle.stories.tsx:
│  Duplicate stories with id: atoms-themetoggle--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ThemeToggle.stories.tsx,../../packages/design-system/src/atoms/ThemeToggle.stories.tsx:
│  Duplicate stories with id: atoms-themetoggle--with-labels
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ThemeToggle.stories.tsx,../../packages/design-system/src/atoms/ThemeToggle.stories.tsx:
│  Duplicate stories with id: atoms-themetoggle--medium
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ThemeToggle.stories.tsx,../../packages/design-system/src/atoms/ThemeToggle.stories.tsx:
│  Duplicate stories with id: atoms-themetoggle--medium-with-labels
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ThemeToggle.stories.tsx,../../packages/design-system/src/atoms/ThemeToggle.stories.tsx:
│  Duplicate stories with id: atoms-themetoggle--light-selected
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ThemeToggle.stories.tsx,../../packages/design-system/src/atoms/ThemeToggle.stories.tsx:
│  Duplicate stories with id: atoms-themetoggle--dark-selected
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ThemeToggle.stories.tsx,../../packages/design-system/src/atoms/ThemeToggle.stories.tsx:
│  Duplicate stories with id: atoms-themetoggle--system-selected
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Toast.stories.tsx,../../packages/design-system/src/atoms/Toast.stories.tsx:
│  Duplicate stories with id: atoms-toast--soft-variants
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Toast.stories.tsx,../../packages/design-system/src/atoms/Toast.stories.tsx:
│  Duplicate stories with id: atoms-toast--solid-variants
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Toast.stories.tsx,../../packages/design-system/src/atoms/Toast.stories.tsx:
│  Duplicate stories with id: atoms-toast--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/Tooltip.stories.tsx,../../packages/design-system/src/atoms/Tooltip.stories.tsx:
│  Duplicate stories with id: atoms-tooltip--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/VideoPlayer.stories.tsx,../../packages/design-system/src/atoms/VideoPlayer.stories.tsx:
│  Duplicate stories with id: atoms-videoplayer--primary
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/VideoPlayer.stories.tsx,../../packages/design-system/src/atoms/VideoPlayer.stories.tsx:
│  Duplicate stories with id: atoms-videoplayer--autoplay
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/VideoPlayer.stories.tsx,../../packages/design-system/src/atoms/VideoPlayer.stories.tsx:
│  Duplicate stories with id: atoms-videoplayer--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/VideoPlayer.stories.tsx,../../packages/design-system/src/atoms/VideoPlayer.stories.tsx:
│  Duplicate stories with id: atoms-videoplayer--missing-captions-warning
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ZoomImage.stories.tsx,../../packages/design-system/src/atoms/ZoomImage.stories.tsx:
│  Duplicate stories with id: atoms-zoomimage--click-zoom
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ZoomImage.stories.tsx,../../packages/design-system/src/atoms/ZoomImage.stories.tsx:
│  Duplicate stories with id: atoms-zoomimage--hover-zoom
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ZoomImage.stories.tsx,../../packages/design-system/src/atoms/ZoomImage.stories.tsx:
│  Duplicate stories with id: atoms-zoomimage--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ZoomImage.stories.tsx,../../packages/design-system/src/atoms/ZoomImage.stories.tsx:
│  Duplicate stories with id: atoms-zoomimage--keyboard-toggle
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/Accordion.stories.tsx,../../packages/design-system/src/molecules/Accordion.stories.tsx:
│  Duplicate stories with id: molecules-accordion--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/Accordion.stories.tsx,../../packages/design-system/src/molecules/Accordion.stories.tsx:
│  Duplicate stories with id: molecules-accordion--long-content
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/Breadcrumbs.stories.tsx,../../packages/design-system/src/molecules/Breadcrumbs.stories.tsx:
│  Duplicate stories with id: molecules-breadcrumbs--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/CodeBlock.stories.tsx,../../packages/design-system/src/molecules/CodeBlock.stories.tsx:
│  Duplicate stories with id: molecules-codeblock--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/CodeBlock.stories.tsx,../../packages/design-system/src/molecules/CodeBlock.stories.tsx:
│  Duplicate stories with id: molecules-codeblock--with-custom-labels
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/CurrencySwitcher.client.stories.tsx,../../packages/design-system/src/molecules/CurrencySwitcher.client.stories.tsx:
│  Duplicate stories with id: molecules-currencyswitcher-client--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/CurrencySwitcher.stories.tsx,../../packages/design-system/src/molecules/CurrencySwitcher.stories.tsx:
│  Duplicate stories with id: molecules-currencyswitcher--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/DatePicker.stories.tsx,../../packages/design-system/src/molecules/DatePicker.stories.tsx:
│  Duplicate stories with id: molecules-datepicker--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/DatePicker.stories.tsx,../../packages/design-system/src/molecules/DatePicker.stories.tsx:
│  Duplicate stories with id: molecules-datepicker--with-selected-date
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/DatePicker.stories.tsx,../../packages/design-system/src/molecules/DatePicker.stories.tsx:
│  Duplicate stories with id: molecules-datepicker--with-min-max-dates
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/DatePicker.stories.tsx,../../packages/design-system/src/molecules/DatePicker.stories.tsx:
│  Duplicate stories with id: molecules-datepicker--with-time-select
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/DatePicker.stories.tsx,../../packages/design-system/src/molecules/DatePicker.stories.tsx:
│  Duplicate stories with id: molecules-datepicker--clearable
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/DatePicker.stories.tsx,../../packages/design-system/src/molecules/DatePicker.stories.tsx:
│  Duplicate stories with id: molecules-datepicker--inline
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/DatePicker.stories.tsx,../../packages/design-system/src/molecules/DatePicker.stories.tsx:
│  Duplicate stories with id: molecules-datepicker--disabled
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/DatePicker.stories.tsx,../../packages/design-system/src/molecules/DatePicker.stories.tsx:
│  Duplicate stories with id: molecules-datepicker--invalid
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/Form/Form.stories.tsx,../../packages/design-system/src/molecules/Form/Form.stories.tsx:
│  Duplicate stories with id: molecules-form--login-form
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/Form/Form.stories.tsx,../../packages/design-system/src/molecules/Form/Form.stories.tsx:
│  Duplicate stories with id: molecules-form--registration-form
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/Form/Form.stories.tsx,../../packages/design-system/src/molecules/Form/Form.stories.tsx:
│  Duplicate stories with id: molecules-form--validation-states
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/Form/Form.stories.tsx,../../packages/design-system/src/molecules/Form/Form.stories.tsx:
│  Duplicate stories with id: molecules-form--with-zod-schema
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/FormField.stories.tsx,../../packages/design-system/src/molecules/FormField.stories.tsx:
│  Duplicate stories with id: molecules-formfield--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/Image360Viewer.stories.tsx,../../packages/design-system/src/molecules/Image360Viewer.stories.tsx:
│  Duplicate stories with id: molecules-image360viewer--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/LanguageSwitcher.stories.tsx,../../packages/design-system/src/molecules/LanguageSwitcher.stories.tsx:
│  Duplicate stories with id: molecules-languageswitcher--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/MediaSelector.stories.tsx,../../packages/design-system/src/molecules/MediaSelector.stories.tsx:
│  Duplicate stories with id: molecules-mediaselector--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/PaginationControl.stories.tsx,../../packages/design-system/src/molecules/PaginationControl.stories.tsx:
│  Duplicate stories with id: molecules-paginationcontrol--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/PaymentMethodSelector.stories.tsx,../../packages/design-system/src/molecules/PaymentMethodSelector.stories.tsx:
│  Duplicate stories with id: molecules-paymentmethodselector--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/PriceCluster.stories.tsx,../../packages/design-system/src/molecules/PriceCluster.stories.tsx:
│  Duplicate stories with id: molecules-pricecluster--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/PromoCodeInput.stories.tsx,../../packages/design-system/src/molecules/PromoCodeInput.stories.tsx:
│  Duplicate stories with id: molecules-promocodeinput--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/QuantityInput.stories.tsx,../../packages/design-system/src/molecules/QuantityInput.stories.tsx:
│  Duplicate stories with id: molecules-quantityinput--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/QuantityInput.stories.tsx,../../packages/design-system/src/molecules/QuantityInput.stories.tsx:
│  Duplicate stories with id: molecules-quantityinput--at-max
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/RatingSummary.stories.tsx,../../packages/design-system/src/molecules/RatingSummary.stories.tsx:
│  Duplicate stories with id: molecules-ratingsummary--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/SearchBar.stories.tsx,../../packages/design-system/src/molecules/SearchBar.stories.tsx:
│  Duplicate stories with id: molecules-searchbar--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/SearchBar.stories.tsx,../../packages/design-system/src/molecules/SearchBar.stories.tsx:
│  Duplicate stories with id: molecules-searchbar--prefilled-query
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/SearchBar.stories.tsx,../../packages/design-system/src/molecules/SearchBar.stories.tsx:
│  Duplicate stories with id: molecules-searchbar--keyboard-navigation
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/Stepper.stories.tsx,../../packages/design-system/src/molecules/Stepper.stories.tsx:
│  Duplicate stories with id: molecules-stepper--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/Stepper.stories.tsx,../../packages/design-system/src/molecules/Stepper.stories.tsx:
│  Duplicate stories with id: molecules-stepper--with-descriptions
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/Stepper.stories.tsx,../../packages/design-system/src/molecules/Stepper.stories.tsx:
│  Duplicate stories with id: molecules-stepper--with-custom-icons
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/Stepper.stories.tsx,../../packages/design-system/src/molecules/Stepper.stories.tsx:
│  Duplicate stories with id: molecules-stepper--vertical-orientation
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/Stepper.stories.tsx,../../packages/design-system/src/molecules/Stepper.stories.tsx:
│  Duplicate stories with id: molecules-stepper--with-disabled-steps
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/Stepper.stories.tsx,../../packages/design-system/src/molecules/Stepper.stories.tsx:
│  Duplicate stories with id: molecules-stepper--all-completed
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/Stepper.stories.tsx,../../packages/design-system/src/molecules/Stepper.stories.tsx:
│  Duplicate stories with id: molecules-stepper--first-step
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/Stepper.stories.tsx,../../packages/design-system/src/molecules/Stepper.stories.tsx:
│  Duplicate stories with id: molecules-stepper--vertical-with-icons
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/molecules/SustainabilityBadgeCluster.stories.tsx,../../packages/design-system/src/molecules/SustainabilityBadgeCluster.stories.tsx:
│  Duplicate stories with id:
│  molecules-sustainabilitybadgecluster--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Button.stories.tsx,../../packages/design-system/src/primitives/Button.stories.tsx:
│  Duplicate stories with id: atoms-primitives-button--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Button.stories.tsx,../../packages/design-system/src/primitives/Button.stories.tsx:
│  Duplicate stories with id: atoms-primitives-button--variants
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Button.stories.tsx,../../packages/design-system/src/primitives/Button.stories.tsx:
│  Duplicate stories with id: atoms-primitives-button--sizes
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Button.stories.tsx,../../packages/design-system/src/primitives/Button.stories.tsx:
│  Duplicate stories with id: atoms-primitives-button--shape-depths
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Button.stories.tsx,../../packages/design-system/src/primitives/Button.stories.tsx:
│  Duplicate stories with id: atoms-primitives-button--as-child-link
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Card.stories.tsx,../../packages/design-system/src/primitives/Card.stories.tsx:
│  Duplicate stories with id: atoms-primitives-card--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Card.stories.tsx,../../packages/design-system/src/primitives/Card.stories.tsx:
│  Duplicate stories with id: atoms-primitives-card--shape-depths
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Checkbox.stories.tsx,../../packages/design-system/src/primitives/Checkbox.stories.tsx:
│  Duplicate stories with id: atoms-primitives-checkbox--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Cluster.stories.tsx,../../packages/design-system/src/primitives/Cluster.stories.tsx:
│  Duplicate stories with id: primitives-cluster--basic
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Cluster.stories.tsx,../../packages/design-system/src/primitives/Cluster.stories.tsx:
│  Duplicate stories with id: primitives-cluster--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Cover.stories.tsx,../../packages/design-system/src/primitives/Cover.stories.tsx:
│  Duplicate stories with id: primitives-cover--basic
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Cover.stories.tsx,../../packages/design-system/src/primitives/Cover.stories.tsx:
│  Duplicate stories with id: primitives-cover--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Dialog.stories.tsx,../../packages/design-system/src/primitives/Dialog.stories.tsx:
│  Duplicate stories with id: atoms-primitives-dialog--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Dialog.stories.tsx,../../packages/design-system/src/primitives/Dialog.stories.tsx:
│  Duplicate stories with id: atoms-primitives-dialog--square-corners
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Grid.stories.tsx,../../packages/design-system/src/primitives/Grid.stories.tsx:
│  Duplicate stories with id: primitives-grid--basic
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Grid.stories.tsx,../../packages/design-system/src/primitives/Grid.stories.tsx:
│  Duplicate stories with id: primitives-grid--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Inline.stories.tsx,../../packages/design-system/src/primitives/Inline.stories.tsx:
│  Duplicate stories with id: primitives-inline--basic
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Inline.stories.tsx,../../packages/design-system/src/primitives/Inline.stories.tsx:
│  Duplicate stories with id: primitives-inline--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Input.stories.tsx,../../packages/design-system/src/primitives/Input.stories.tsx:
│  Duplicate stories with id: atoms-primitives-input--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Input.stories.tsx,../../packages/design-system/src/primitives/Input.stories.tsx:
│  Duplicate stories with id: atoms-primitives-input--with-long-value
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Input.stories.tsx,../../packages/design-system/src/primitives/Input.stories.tsx:
│  Duplicate stories with id: atoms-primitives-input--shape-depths
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Input.stories.tsx,../../packages/design-system/src/primitives/Input.stories.tsx:
│  Duplicate stories with id: atoms-primitives-input--density-scale
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/PrimitivesPlayground.stories.tsx,../../packages/design-system/src/primitives/PrimitivesPlayground.stories.tsx:
│  Duplicate stories with id: atoms-primitives-playground--basic-controls
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Select.stories.tsx,../../packages/design-system/src/primitives/Select.stories.tsx:
│  Duplicate stories with id: atoms-primitives-select--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Select.stories.tsx,../../packages/design-system/src/primitives/Select.stories.tsx:
│  Duplicate stories with id: atoms-primitives-select--shape-depths
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Select.stories.tsx,../../packages/design-system/src/primitives/Select.stories.tsx:
│  Duplicate stories with id: atoms-primitives-select--density-scale
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Sidebar.stories.tsx,../../packages/design-system/src/primitives/Sidebar.stories.tsx:
│  Duplicate stories with id: primitives-sidebar--basic
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Sidebar.stories.tsx,../../packages/design-system/src/primitives/Sidebar.stories.tsx:
│  Duplicate stories with id: primitives-sidebar--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Stack.stories.tsx,../../packages/design-system/src/primitives/Stack.stories.tsx:
│  Duplicate stories with id: primitives-stack--basic
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Stack.stories.tsx,../../packages/design-system/src/primitives/Stack.stories.tsx:
│  Duplicate stories with id: primitives-stack--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Table.stories.tsx,../../packages/design-system/src/primitives/Table.stories.tsx:
│  Duplicate stories with id: primitives-table--hover-vs-selected
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Table.stories.tsx,../../packages/design-system/src/primitives/Table.stories.tsx:
│  Duplicate stories with id: primitives-table--compact-density
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Table.stories.tsx,../../packages/design-system/src/primitives/Table.stories.tsx:
│  Duplicate stories with id: primitives-table--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Textarea.stories.tsx,../../packages/design-system/src/primitives/Textarea.stories.tsx:
│  Duplicate stories with id: atoms-primitives-textarea--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Textarea.stories.tsx,../../packages/design-system/src/primitives/Textarea.stories.tsx:
│  Duplicate stories with id:
│  atoms-primitives-textarea--with-long-unbroken
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Textarea.stories.tsx,../../packages/design-system/src/primitives/Textarea.stories.tsx:
│  Duplicate stories with id: atoms-primitives-textarea--shape-depths
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/Textarea.stories.tsx,../../packages/design-system/src/primitives/Textarea.stories.tsx:
│  Duplicate stories with id: atoms-primitives-textarea--density-scale
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/accordion.stories.tsx,../../packages/design-system/src/primitives/accordion.stories.tsx:
│  Duplicate stories with id: atoms-primitives-accordion--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/combobox.stories.tsx,../../packages/design-system/src/primitives/combobox.stories.tsx:
│  Duplicate stories with id: atoms-primitives-combobox--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/combobox.stories.tsx,../../packages/design-system/src/primitives/combobox.stories.tsx:
│  Duplicate stories with id: atoms-primitives-combobox--with-keywords
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/combobox.stories.tsx,../../packages/design-system/src/primitives/combobox.stories.tsx:
│  Duplicate stories with id: atoms-primitives-combobox--uncontrolled
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/combobox.stories.tsx,../../packages/design-system/src/primitives/combobox.stories.tsx:
│  Duplicate stories with id: atoms-primitives-combobox--compact-density
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/combobox.stories.tsx,../../packages/design-system/src/primitives/combobox.stories.tsx:
│  Duplicate stories with id: atoms-primitives-combobox--custom-empty
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/drawer.stories.tsx,../../packages/design-system/src/primitives/drawer.stories.tsx:
│  Duplicate stories with id: primitives-drawer--right
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/drawer.stories.tsx,../../packages/design-system/src/primitives/drawer.stories.tsx:
│  Duplicate stories with id: primitives-drawer--left
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/drawer.stories.tsx,../../packages/design-system/src/primitives/drawer.stories.tsx:
│  Duplicate stories with id: primitives-drawer--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/drawer.stories.tsx,../../packages/design-system/src/primitives/drawer.stories.tsx:
│  Duplicate stories with id: primitives-drawer--keyboard-close
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/drawer.stories.tsx,../../packages/design-system/src/primitives/drawer.stories.tsx:
│  Duplicate stories with id: primitives-drawer--square-corners
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/dropdown-menu.stories.tsx,../../packages/design-system/src/primitives/dropdown-menu.stories.tsx:
│  Duplicate stories with id: primitives-dropdownmenu--panel-surface
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/dropdown-menu.stories.tsx,../../packages/design-system/src/primitives/dropdown-menu.stories.tsx:
│  Duplicate stories with id: primitives-dropdownmenu--submenu
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/dropdown-menu.stories.tsx,../../packages/design-system/src/primitives/dropdown-menu.stories.tsx:
│  Duplicate stories with id: primitives-dropdownmenu--compact-density
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/dropdown-menu.stories.tsx,../../packages/design-system/src/primitives/dropdown-menu.stories.tsx:
│  Duplicate stories with id: primitives-dropdownmenu--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/overlayScrim.stories.tsx,../../packages/design-system/src/primitives/overlayScrim.stories.tsx:
│  Duplicate stories with id: atoms-primitives-overlayscrim--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/radio-group.stories.tsx,../../packages/design-system/src/primitives/radio-group.stories.tsx:
│  Duplicate stories with id: primitives-radiogroup--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/radio-group.stories.tsx,../../packages/design-system/src/primitives/radio-group.stories.tsx:
│  Duplicate stories with id: primitives-radiogroup--with-disabled
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/scroll-area.stories.tsx,../../packages/design-system/src/primitives/scroll-area.stories.tsx:
│  Duplicate stories with id: primitives-scrollarea--vertical
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/scroll-area.stories.tsx,../../packages/design-system/src/primitives/scroll-area.stories.tsx:
│  Duplicate stories with id: primitives-scrollarea--horizontal
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/separator.stories.tsx,../../packages/design-system/src/primitives/separator.stories.tsx:
│  Duplicate stories with id: primitives-separator--horizontal
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/separator.stories.tsx,../../packages/design-system/src/primitives/separator.stories.tsx:
│  Duplicate stories with id: primitives-separator--vertical
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/slider.stories.tsx,../../packages/design-system/src/primitives/slider.stories.tsx:
│  Duplicate stories with id: primitives-slider--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/slider.stories.tsx,../../packages/design-system/src/primitives/slider.stories.tsx:
│  Duplicate stories with id: primitives-slider--range
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/slider.stories.tsx,../../packages/design-system/src/primitives/slider.stories.tsx:
│  Duplicate stories with id: primitives-slider--with-steps
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/slot.stories.tsx,../../packages/design-system/src/primitives/slot.stories.tsx:
│  Duplicate stories with id: atoms-primitives-slot--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/tabs.stories.tsx,../../packages/design-system/src/primitives/tabs.stories.tsx:
│  Duplicate stories with id: primitives-tabs--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/primitives/tabs.stories.tsx,../../packages/design-system/src/primitives/tabs.stories.tsx:
│  Duplicate stories with id: primitives-tabs--with-disabled
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Button.pseudo.stories.tsx,../../packages/design-system/src/shadcn/Button.pseudo.stories.tsx:
│  Duplicate stories with id: atoms-button-pseudo-states--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Button.pseudo.stories.tsx,../../packages/design-system/src/shadcn/Button.pseudo.stories.tsx:
│  Duplicate stories with id: atoms-button-pseudo-states--disabled
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Button.pseudo.stories.tsx,../../packages/design-system/src/shadcn/Button.pseudo.stories.tsx:
│  Duplicate stories with id: atoms-button-pseudo-states--icon
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Button.stories.tsx,../../packages/design-system/src/shadcn/Button.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-button--playground
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Button.stories.tsx,../../packages/design-system/src/shadcn/Button.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-button--outline
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Button.stories.tsx,../../packages/design-system/src/shadcn/Button.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-button--ghost
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Button.stories.tsx,../../packages/design-system/src/shadcn/Button.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-button--destructive
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Button.stories.tsx,../../packages/design-system/src/shadcn/Button.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-button--icon-only
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Card.stories.tsx,../../packages/design-system/src/shadcn/Card.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-card--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Checkbox.stories.tsx,../../packages/design-system/src/shadcn/Checkbox.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-checkbox--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Dialog.stories.tsx,../../packages/design-system/src/shadcn/Dialog.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-dialog--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Input.stories.tsx,../../packages/design-system/src/shadcn/Input.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-input--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Select.stories.tsx,../../packages/design-system/src/shadcn/Select.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-select--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Table.stories.tsx,../../packages/design-system/src/shadcn/Table.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-table--default
│  -
│  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Textarea.stories.tsx,../../packages/design-system/src/shadcn/Textarea.stories.tsx:
│  Duplicate stories with id: atoms-shadcn-textarea--default[39m
│  at _StoryIndexGenerator.getIndexAndStats
│  (file:///Users/petercowling/base-shop/node_modules/.pnpm/storybook@10.1.11_@testing-library+dom@10.4.0_prettier@3.6.2_react-dom@19.2.1_react@19.2.1__react@19.2.1/node_modules/storybook/dist/core-server/index.js:5468:15)
│  at async _StoryIndexGenerator.getIndex
│  (file:///Users/petercowling/base-shop/node_modules/.pnpm/storybook@10.1.11_@testing-library+dom@10.4.0_prettier@3.6.2_react-dom@19.2.1_react@19.2.1__react@19.2.1/node_modules/storybook/dist/core-server/index.js:5447:13)
│  at async extractStoriesJson
│  (file:///Users/petercowling/base-shop/node_modules/.pnpm/storybook@10.1.11_@testing-library+dom@10.4.0_prettier@3.6.2_react-dom@19.2.1_react@19.2.1__react@19.2.1/node_modules/storybook/dist/core-server/index.js:5732:20)
│  at async Promise.all (index 3)
│  at async buildStaticStandalone
│  (file:///Users/petercowling/base-shop/node_modules/.pnpm/storybook@10.1.11_@testing-library+dom@10.4.0_prettier@3.6.2_react-dom@19.2.1_react@19.2.1__react@19.2.1/node_modules/storybook/dist/core-server/index.js:5903:7)
│  at async withTelemetry
│  (file:///Users/petercowling/base-shop/node_modules/.pnpm/storybook@10.1.11_@testing-library+dom@10.4.0_prettier@3.6.2_react-dom@19.2.1_react@19.2.1__react@19.2.1/node_modules/storybook/dist/_node-chunks/chunk-2372JZ52.js:209:12)
│  at async build
│  (file:///Users/petercowling/base-shop/node_modules/.pnpm/storybook@10.1.11_@testing-library+dom@10.4.0_prettier@3.6.2_react-dom@19.2.1_react@19.2.1__react@19.2.1/node_modules/storybook/dist/bin/core.js:2679:3)
│  at async _Command.<anonymous>
│  (file:///Users/petercowling/base-shop/node_modules/.pnpm/storybook@10.1.11_@testing-library+dom@10.4.0_prettier@3.6.2_react-dom@19.2.1_react@19.2.1__react@19.2.1/node_modules/storybook/dist/bin/core.js:2819:7)
/Users/petercowling/base-shop/apps/storybook:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @apps/storybook@ build:full: `storybook build -c ./.storybook`
Exit status 1 failed with  null-data error.

- Q: Would migrating Storybook alone remove webpack from repo?
  - A: No. Cypress coverage stack also pulls webpack, and Storybook Vite stack still has webpack peer transitive pressure in current package graph.
  - Evidence: local command result Legend: production dependency, optional only, dev only

cms-monorepo@0.1.0 /Users/petercowling/base-shop (PRIVATE)

devDependencies:
@cypress/code-coverage 3.14.6
├─┬ @cypress/webpack-preprocessor 6.0.4
│ ├─┬ babel-loader 9.2.1 peer
│ │ └─┬ webpack 5.104.1 peer
│ │   └─┬ terser-webpack-plugin 5.3.16
│ │     └── webpack 5.104.1 peer
│ └─┬ webpack 5.104.1 peer
│   └─┬ terser-webpack-plugin 5.3.16
│     └── webpack 5.104.1 peer
├─┬ babel-loader 9.2.1 peer
│ └─┬ webpack 5.104.1 peer
│   └─┬ terser-webpack-plugin 5.3.16
│     └── webpack 5.104.1 peer
└─┬ webpack 5.104.1 peer
  └─┬ terser-webpack-plugin 5.3.16
    └── webpack 5.104.1 peer
@storybook/addon-docs 10.1.4
└─┬ @storybook/csf-plugin 10.1.4
  └─┬ webpack 5.104.1 peer
    └─┬ terser-webpack-plugin 5.3.16
      └── webpack 5.104.1 peer
@storybook/builder-vite 10.1.4
└─┬ @storybook/csf-plugin 10.1.4
  └─┬ webpack 5.104.1 peer
    └─┬ terser-webpack-plugin 5.3.16
      └── webpack 5.104.1 peer
@storybook/nextjs 10.1.4
├─┬ @pmmmwh/react-refresh-webpack-plugin 0.5.17
│ └─┬ webpack 5.104.1 peer
│   └─┬ terser-webpack-plugin 5.3.16
│     └── webpack 5.104.1 peer
├─┬ @storybook/builder-webpack5 10.1.4
│ ├─┬ css-loader 7.1.2
│ │ └─┬ webpack 5.104.1 peer
│ │   └─┬ terser-webpack-plugin 5.3.16
│ │     └── webpack 5.104.1 peer
│ ├─┬ fork-ts-checker-webpack-plugin 9.1.0
│ │ └─┬ webpack 5.104.1 peer
│ │   └─┬ terser-webpack-plugin 5.3.16
│ │     └── webpack 5.104.1 peer
│ ├─┬ html-webpack-plugin 5.6.3
│ │ └─┬ webpack 5.104.1 peer
│ │   └─┬ terser-webpack-plugin 5.3.16
│ │     └── webpack 5.104.1 peer
│ ├─┬ style-loader 4.0.0
│ │ └─┬ webpack 5.104.1 peer
│ │   └─┬ terser-webpack-plugin 5.3.16
│ │     └── webpack 5.104.1 peer
│ ├─┬ terser-webpack-plugin 5.3.14
│ │ └─┬ webpack 5.104.1 peer
│ │   └─┬ terser-webpack-plugin 5.3.16
│ │     └── webpack 5.104.1 peer
│ ├─┬ webpack 5.104.1
│ │ └─┬ terser-webpack-plugin 5.3.16
│ │   └── webpack 5.104.1 peer
│ └─┬ webpack-dev-middleware 6.1.3
│   └─┬ webpack 5.104.1 peer
│     └─┬ terser-webpack-plugin 5.3.16
│       └── webpack 5.104.1 peer
├─┬ @storybook/preset-react-webpack 10.1.4
│ ├─┬ @storybook/react-docgen-typescript-plugin 1.0.6--canary.9.0c3f3b7.0
│ │ └─┬ webpack 5.104.1 peer
│ │   └─┬ terser-webpack-plugin 5.3.16
│ │     └── webpack 5.104.1 peer
│ └─┬ webpack 5.104.1
│   └─┬ terser-webpack-plugin 5.3.16
│     └── webpack 5.104.1 peer
├─┬ babel-loader 9.2.1
│ └─┬ webpack 5.104.1 peer
│   └─┬ terser-webpack-plugin 5.3.16
│     └── webpack 5.104.1 peer
├─┬ css-loader 6.11.0
│ └─┬ webpack 5.104.1 peer
│   └─┬ terser-webpack-plugin 5.3.16
│     └── webpack 5.104.1 peer
├─┬ node-polyfill-webpack-plugin 2.0.1
│ └─┬ webpack 5.104.1 peer
│   └─┬ terser-webpack-plugin 5.3.16
│     └── webpack 5.104.1 peer
├─┬ postcss-loader 8.1.1
│ └─┬ webpack 5.104.1 peer
│   └─┬ terser-webpack-plugin 5.3.16
│     └── webpack 5.104.1 peer
├─┬ sass-loader 16.0.5
│ └─┬ webpack 5.104.1 peer
│   └─┬ terser-webpack-plugin 5.3.16
│     └── webpack 5.104.1 peer
├─┬ style-loader 3.3.4
│ └─┬ webpack 5.104.1 peer
│   └─┬ terser-webpack-plugin 5.3.16
│     └── webpack 5.104.1 peer
└─┬ webpack 5.104.1 peer
  └─┬ terser-webpack-plugin 5.3.16
    └── webpack 5.104.1 peer
@storybook/nextjs-vite 10.1.4
├─┬ @storybook/builder-vite 10.1.4
│ └─┬ @storybook/csf-plugin 10.1.4
│   └─┬ webpack 5.104.1 peer
│     └─┬ terser-webpack-plugin 5.3.16
│       └── webpack 5.104.1 peer
└─┬ @storybook/react-vite 10.1.4
  └─┬ @storybook/builder-vite 10.1.4
    └─┬ @storybook/csf-plugin 10.1.4
      └─┬ webpack 5.104.1 peer
        └─┬ terser-webpack-plugin 5.3.16
          └── webpack 5.104.1 peer
webpack 5.104.1
└─┬ terser-webpack-plugin 5.3.16
  └── webpack 5.104.1 peer includes  and Storybook package chains.

### Open (User Input Needed)
- Q: Is the target for this lane Storybook
