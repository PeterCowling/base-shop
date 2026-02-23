---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Infra
Workstream: Engineering
Created: 2026-02-23
Last-updated: 2026-02-23
Feature-Slug: turbopack-full-migration
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/turbopack-full-migration/plan.md
Business-OS-Integration: off
Business-Unit: PLAT
Card-ID: none
direct-inject: true
direct-inject-rationale: User requested a repo-wide audit of remaining webpack usage to plan full Turbopack migration.
---

# Turbopack Full Migration Fact-Find Brief

## Scope
### Summary
This brief documents where webpack is still active in the repository after the brikette migration work. The current state still has webpack hard-coded across Next app scripts, repository policy gates, shared Next config callbacks, webpack magic comments in i18n loaders, and Storybook's webpack builder. The objective is to capture evidence and define planning-ready migration surfaces for a full Turbopack transition.

### Goals
- Produce a verified inventory of active webpack usage across runtime scripts, config, and policy enforcement.
- Separate true runtime coupling from historical/documentation noise.
- Identify migration blockers and sequencing constraints before implementation planning.

### Non-goals
- Applying migration code changes in this fact-find run.
- Rewriting completed historical plan artifacts.
- Deciding Storybook builder migration policy without explicit owner decision.

### Constraints & Assumptions
- Constraints:
  - Repo policy currently fails closed to webpack for  /  unless explicitly allowed.
  - Shared Next config () still exposes a webpack callback used by multiple apps.
  - Multiple apps contain app-specific webpack callback logic beyond shared config.
- Assumptions:
  - Full migration target is all Next app workflows to Turbopack-compatible surfaces.
  - Storybook webpack builder is treated as a separate migration decision unless explicitly folded into scope.

## Evidence Audit (Current State)
### Entry Points
- Next app scripts with explicit  flags in  and .
- Repo guardrails that enforce webpack defaults:
  - 
  - ========================================
  Validation Gate
========================================

> Finding changed files...
  Mode: working tree vs HEAD
Changed files (all):
  apps/business-os/src/lib/business-catalog.ts
  docs/business-os/market-research/HBAG/latest.user.md
  docs/business-os/startup-loop-workflow.user.md
  docs/business-os/strategy/businesses.json
  docs/business-os/workflow-prompts/_templates/measurement-agent-setup-prompt.md
  docs/plans/brikette-seo-traffic-growth/plan.md
  docs/plans/brikette-seo-traffic-growth/task-16-gbp-audit.md
  packages/themes/base/tokens.dynamic.css
  packages/themes/base/tokens.static.css
  packages/themes/prime/tokens.css
  pnpm-lock.yaml

> Policy checks
Checking Next.js command policy matrix...
OK: Next.js command policy matrix check passed
Skipping i18n resolver contract check (no relevant path changes)

> Typecheck + lint (changed packages)
Typecheck filters: --filter=@apps/business-os
• Packages in scope: @apps/business-os
• Running typecheck in 1 packages
• Remote caching disabled
@acme/zod-utils:build: cache miss, executing ff6995ade3ba0fde
@acme/guide-system:build: cache miss, executing 711bb85ea2f86638
@acme/date-utils:build: cache miss, executing 231b1add1adb2b12
@acme/seo:build: cache miss, executing 8cb6cba17a3b1ea4
@themes/base:build: cache miss, executing e154e7e9da85d228
@acme/telemetry:build: cache miss, executing 13503ca8c12b1c26
@acme/types:build: cache miss, executing 0948edbf7de74451
@acme/seo:build: 
@acme/seo:build: > @acme/seo@0.0.0 build /Users/petercowling/base-shop/packages/seo
@acme/seo:build: > tsc -b
@acme/seo:build: 
@acme/guide-system:build: 
@acme/guide-system:build: > @acme/guide-system@0.0.0 build /Users/petercowling/base-shop/packages/guide-system
@acme/guide-system:build: > tsc -b
@acme/guide-system:build: 
@acme/types:build: 
@acme/types:build: > @acme/types@0.0.1 build /Users/petercowling/base-shop/packages/types
@acme/types:build: > tsc -b
@acme/types:build: 
@acme/zod-utils:build: 
@acme/zod-utils:build: > @acme/zod-utils@0.0.0 build /Users/petercowling/base-shop/packages/zod-utils
@acme/zod-utils:build: > tsc -b
@acme/zod-utils:build: 
@acme/date-utils:build: 
@acme/date-utils:build: > @acme/date-utils@0.0.0 build /Users/petercowling/base-shop/packages/date-utils
@acme/date-utils:build: > tsc -b
@acme/date-utils:build: 
@acme/telemetry:build: 
@acme/telemetry:build: > @acme/telemetry@0.0.1 build /Users/petercowling/base-shop/packages/telemetry
@acme/telemetry:build: > tsc -b
@acme/telemetry:build: 
@themes/base:build: 
@themes/base:build: > @themes/base@0.0.0 build /Users/petercowling/base-shop/packages/themes/base
@themes/base:build: > tsc -p tsconfig.json
@themes/base:build: 
@acme/i18n:build: cache miss, executing f921277e134b86ba
@acme/page-builder-core:build: cache miss, executing 046db281183a45d3
@acme/plugin-sanity:build: cache miss, executing 038f1fda606d7071
@acme/config:build: cache miss, executing 2866cc92c45ca371
@acme/plugin-sanity:build: 
@acme/plugin-sanity:build: > @acme/plugin-sanity@0.0.0 build /Users/petercowling/base-shop/packages/plugins/sanity
@acme/plugin-sanity:build: > tsc -b
@acme/plugin-sanity:build: 
@acme/i18n:build: 
@acme/i18n:build: > @acme/i18n@0.0.0 build /Users/petercowling/base-shop/packages/i18n
@acme/i18n:build: > tsc -b
@acme/i18n:build: 
@acme/config:build: 
@acme/config:build: > @acme/config@0.0.0 prebuild /Users/petercowling/base-shop/packages/config
@acme/config:build: > pnpm --filter @acme/zod-utils run build && pnpm run build:stubs
@acme/config:build: 
@acme/page-builder-core:build: 
@acme/page-builder-core:build: > @acme/page-builder-core@1.0.0 build /Users/petercowling/base-shop/packages/page-builder-core
@acme/page-builder-core:build: > tsc -b
@acme/page-builder-core:build: 
@acme/templates:build: cache miss, executing 761eb0744649b2e5
@acme/templates:build: 
@acme/templates:build: > @acme/templates@0.0.0 build /Users/petercowling/base-shop/packages/templates
@acme/templates:build: > tsc -b
@acme/templates:build: 
@acme/config:build: 
@acme/config:build: > @acme/zod-utils@0.0.0 build /Users/petercowling/base-shop/packages/zod-utils
@acme/config:build: > tsc -b
@acme/config:build: 
@acme/config:build: 
@acme/config:build: > @acme/config@0.0.0 build:stubs /Users/petercowling/base-shop/packages/config
@acme/config:build: > node ./scripts/generate-env-stubs.mjs
@acme/config:build: 
@acme/config:build: 
@acme/config:build: > @acme/config@0.0.0 build /Users/petercowling/base-shop/packages/config
@acme/config:build: > tsc -b
@acme/config:build: 
@acme/stripe:build: cache miss, executing 10a00c7b3cd7b7fe
@acme/lib:build: cache miss, executing 580e884d3800db54
@acme/stripe:build: 
@acme/stripe:build: > @acme/stripe@0.0.0 build /Users/petercowling/base-shop/packages/stripe
@acme/stripe:build: > tsc -b --force
@acme/stripe:build: 
@acme/lib:build: 
@acme/lib:build: > @acme/lib@0.0.0 build /Users/petercowling/base-shop/packages/lib
@acme/lib:build: > tsc -b
@acme/lib:build: 
@acme/platform-core:build: cache miss, executing ee476d4f37ca7509
@acme/platform-core:build: 
@acme/platform-core:build: > @acme/platform-core@0.0.0 build /Users/petercowling/base-shop/packages/platform-core
@acme/platform-core:build: > tsc -b
@acme/platform-core:build: 
@acme/design-system:build: cache miss, executing 8c4ee2caf19a39bb
@acme/auth:build: cache miss, executing a9993e964a5738a5
@acme/auth:build: 
@acme/auth:build: > @acme/auth@0.0.0 build /Users/petercowling/base-shop/packages/auth
@acme/auth:build: > tsc -b
@acme/auth:build: 
@acme/design-system:build: 
@acme/design-system:build: > @acme/design-system@0.1.0 build /Users/petercowling/base-shop/packages/design-system
@acme/design-system:build: > tsc -b && cp src/molecules/DatePicker.css dist/molecules/DatePicker.css
@acme/design-system:build: 
@acme/ui:build: cache miss, executing be62493e87aa381c
@acme/ui:build: 
@acme/ui:build: > @acme/ui@0.1.0 build /Users/petercowling/base-shop/packages/ui
@acme/ui:build: > tsc -b
@acme/ui:build: 
@apps/business-os:typecheck: cache miss, executing f2f6f7e81b057097
@apps/business-os:typecheck: 
@apps/business-os:typecheck: > @apps/business-os@ typecheck /Users/petercowling/base-shop/apps/business-os
@apps/business-os:typecheck: > tsc -p tsconfig.json --noEmit
@apps/business-os:typecheck: 

 Tasks:    19 successful, 19 total
Cached:    0 cached, 19 total
  Time:    3m49.314s 

OK: Typecheck passed
Lint filters: --filter=@apps/business-os
• Packages in scope: @apps/business-os
• Running lint in 1 packages
• Remote caching disabled
@acme/guide-system:lint: cache miss, executing 55903c48af73c247
@acme/telemetry:lint: cache miss, executing 41a7c4e628988bcc
@acme/seo:lint: cache miss, executing 02ff0abf99420176
@acme/date-utils:lint: cache miss, executing 761f07f73284ff3d
@acme/types:lint: cache miss, executing 0e3af46b92f14f0f
@themes/base:lint: cache miss, executing 89f4383bcd0cba7b
@acme/zod-utils:lint: cache miss, executing 71dca41fa8b7afd3
@acme/guide-system:lint: 
@acme/guide-system:lint: > @acme/guide-system@0.0.0 lint /Users/petercowling/base-shop/packages/guide-system
@acme/guide-system:lint: > eslint .
@acme/guide-system:lint: 
@acme/types:lint: 
@acme/types:lint: > @acme/types@0.0.1 lint /Users/petercowling/base-shop/packages/types
@acme/types:lint: > eslint .
@acme/types:lint: 
@themes/base:lint: 
@themes/base:lint: > @themes/base@0.0.0 lint /Users/petercowling/base-shop/packages/themes/base
@themes/base:lint: > eslint .
@themes/base:lint: 
@acme/telemetry:lint: 
@acme/telemetry:lint: > @acme/telemetry@0.0.1 lint /Users/petercowling/base-shop/packages/telemetry
@acme/telemetry:lint: > eslint .
@acme/telemetry:lint: 
@acme/seo:lint: 
@acme/seo:lint: > @acme/seo@0.0.0 lint /Users/petercowling/base-shop/packages/seo
@acme/seo:lint: > eslint .
@acme/seo:lint: 
@acme/date-utils:lint: 
@acme/date-utils:lint: > @acme/date-utils@0.0.0 lint /Users/petercowling/base-shop/packages/date-utils
@acme/date-utils:lint: > eslint .
@acme/date-utils:lint: 
@acme/zod-utils:lint: 
@acme/zod-utils:lint: > @acme/zod-utils@0.0.0 lint /Users/petercowling/base-shop/packages/zod-utils
@acme/zod-utils:lint: > eslint .
@acme/zod-utils:lint: 
@acme/config:lint: cache miss, executing 70d5ad9923104e4c
@acme/config:lint: 
@acme/config:lint: > @acme/config@0.0.0 lint /Users/petercowling/base-shop/packages/config
@acme/config:lint: > eslint .
@acme/config:lint: 
@acme/page-builder-core:lint: cache miss, executing 229e862bbab38da1
@acme/i18n:lint: cache miss, executing 164b8e68cd024751
@acme/plugin-sanity:lint: cache miss, executing 6902d4fc57f336ba
@acme/i18n:lint: 
@acme/i18n:lint: > @acme/i18n@0.0.0 lint /Users/petercowling/base-shop/packages/i18n
@acme/i18n:lint: > eslint .
@acme/i18n:lint: 
@acme/plugin-sanity:lint: 
@acme/plugin-sanity:lint: > @acme/plugin-sanity@0.0.0 lint /Users/petercowling/base-shop/packages/plugins/sanity
@acme/plugin-sanity:lint: > eslint .
@acme/plugin-sanity:lint: 
@acme/page-builder-core:lint: 
@acme/page-builder-core:lint: > @acme/page-builder-core@1.0.0 lint /Users/petercowling/base-shop/packages/page-builder-core
@acme/page-builder-core:lint: > eslint .
@acme/page-builder-core:lint: 
@acme/templates:lint: cache miss, executing 005978d54f613f1f
@acme/templates:lint: 
@acme/templates:lint: > @acme/templates@0.0.0 lint /Users/petercowling/base-shop/packages/templates
@acme/templates:lint: > eslint .
@acme/templates:lint: 
@acme/lib:lint: cache miss, executing 80f877f539898223
@acme/next-config:lint: cache miss, executing b5a438d8d5c51f03
@acme/stripe:lint: cache miss, executing 56d9734097b7fb18
@acme/stripe:lint: 
@acme/stripe:lint: > @acme/stripe@0.0.0 lint /Users/petercowling/base-shop/packages/stripe
@acme/stripe:lint: > eslint .
@acme/stripe:lint: 
@acme/next-config:lint: 
@acme/next-config:lint: > @acme/next-config@ lint /Users/petercowling/base-shop/packages/next-config
@acme/next-config:lint: > eslint .
@acme/next-config:lint: 
@acme/lib:lint: 
@acme/lib:lint: > @acme/lib@0.0.0 lint /Users/petercowling/base-shop/packages/lib
@acme/lib:lint: > eslint .
@acme/lib:lint: 
@acme/platform-core:lint: cache miss, executing b724bf386381fb23
@acme/platform-core:lint: 
@acme/platform-core:lint: > @acme/platform-core@0.0.0 lint /Users/petercowling/base-shop/packages/platform-core
@acme/platform-core:lint: > eslint .
@acme/platform-core:lint: 
@acme/auth:lint: cache miss, executing 0bc649cfcd46ab32
@acme/design-system:lint: cache miss, executing 81a74d666892c98a
@acme/design-system:lint: 
@acme/design-system:lint: > @acme/design-system@0.1.0 lint /Users/petercowling/base-shop/packages/design-system
@acme/design-system:lint: > eslint .
@acme/design-system:lint: 
@acme/auth:lint: 
@acme/auth:lint: > @acme/auth@0.0.0 lint /Users/petercowling/base-shop/packages/auth
@acme/auth:lint: > eslint .
@acme/auth:lint: 
@acme/ui:lint: cache miss, executing 231b05aacca55025
@acme/ui:lint: 
@acme/ui:lint: > @acme/ui@0.1.0 lint /Users/petercowling/base-shop/packages/ui
@acme/ui:lint: > eslint .
@acme/ui:lint: 
@apps/business-os:lint: cache miss, executing 2423df4bbb088333
@apps/business-os:lint: 
@apps/business-os:lint: > @apps/business-os@ lint /Users/petercowling/base-shop/apps/business-os
@apps/business-os:lint: > eslint "src/**/*.{ts,tsx}" --cache --cache-location .eslintcache
@apps/business-os:lint: 
@apps/business-os:lint: 
@apps/business-os:lint: /Users/petercowling/base-shop/apps/business-os/src/app/api/agent/stage-docs/route.ts
@apps/business-os:lint:   125:18  warning  Hardcoded copy detected. Move text into packages/i18n/src/<locale>.json and reference via t('key'). See docs/i18n/add-translation-keys.md. Exemptions are tech debt and only for non‑UI strings — they must include a ticket (// i18n-exempt -- ABC-123 [ttl=YYYY-MM-DD]) or they will be ignored  ds/no-hardcoded-copy
@apps/business-os:lint: 
@apps/business-os:lint: ✖ 1 problem (0 errors, 1 warning)
@apps/business-os:lint: 

 Tasks:    20 successful, 20 total
Cached:    0 cached, 20 total
  Time:    3m48.32s 

OK: Lint passed

Changed TS/TSX files:
  apps/business-os/src/lib/business-catalog.ts

> Grouping by package...

> Running targeted tests...

  Package: ./apps/business-os (runner: jest)
    Source files: apps/business-os/src/lib/business-catalog.ts
    Running related tests for files (coverage thresholds relaxed)...
Joined test queue as ticket 000000001890
PASS src/app/api/agent/ideas/__tests__/route.test.ts (8.211 s)
PASS src/app/api/agent/cards/__tests__/route.test.ts
PASS src/components/navigation/NavigationHeader.test.tsx (22.134 s)
PASS src/components/capture/QuickCaptureModal.test.tsx
PASS src/app/api/business/[business]/growth-ledger/route.test.ts
PASS src/app/api/agent/businesses/__tests__/route.test.ts
PASS src/components/keyboard/KeyboardShortcutProvider.test.tsx
PASS src/app/api/agent/allocate-id/__tests__/route.test.ts
PASS src/app/api/ideas/__tests__/route.test.ts
PASS src/components/capture/CaptureFAB.test.tsx

Test Suites: 10 passed, 10 total
Tests:       62 passed, 62 total
Snapshots:   0 total
Time:        49.614 s
Ran all test suites related to files matching /\/Users\/petercowling\/base-shop\/apps\/business-os\/src\/lib\/business-catalog.ts/i.

> Ideas-go-faster contract checks...
PASS: ideas-go-faster contract checks passed.
OK: ideas-go-faster contract checks passed

========================================
Summary:
  Packages tested: 1
  Files missing tests: 0

OK: All validation checks passed
  - 
  - 
- Next config callbacks and aliases:
  - 
  - app-level  files with  callbacks
- Webpack magic comments in locale loaders () in app/package source files.
- Storybook webpack builder configuration under .

### Key Modules / Files
-  - fail-closed default policy ( required unless matrix exception).
-  - policy contract tests enforcing webpack defaults for most apps.
-  - runs policy script in CI.
-  - shared webpack callback and alias mapping.
-  - custom webpack callback with cache and alias behavior.
-  - app-level webpack callback and client fallbacks.
-  - app-level webpack callback controlling cache and aliases.
-  - app-level webpack callback and source alias wiring.
-  - explicit webpack builder + plugin usage.
-  - root  dependency.

### Patterns & Conventions Observed
- Script-level bundler pinning remains the dominant coupling pattern: many apps still pin  in package scripts.
- Policy coupling is intentional and explicit: the repo enforces webpack-by-default for Next script surfaces outside exception matrix entries (, ).
- Shared config drift:  now contains both  and  surfaces; app configs inherit/override selectively.
- Source-level webpack magic comments remain in i18n dynamic imports (), plus script tooling that rewrites those comments.
- Inference: the policy layer is currently a stronger migration blocker than individual app script edits, because CI/hooks will reject many script changes unless the policy matrix is updated first.

### Data & Contracts
- Script contract:
  - Policy scanner parses / command segments and requires  by default ().
- Exception matrix contract:
  - App exceptions are encoded in  and workflow exceptions in  in .
- Config contract:
  - Shared  callback and Node alias mappings are centralized in .
  - App-level callbacks may add additional cache/alias/fallback behavior.
- CI contract:
  - Merge gate runs  and blocks merges on violations.

### Dependency & Impact Map
- Upstream dependencies:
  - Next app package scripts (, ).
  - Shared config ().
  - Policy and tests (, ).
- Downstream dependents:
  - CI merge gate and pre-commit validation.
  - App workflows that call package build scripts via  ERROR  Unsupported package selector: {"exclude":false,"excludeSelf":false,"includeDependencies":true,"includeDependents":false,"followProdDepsOnly":false}

pnpm: Unsupported package selector: {"exclude":false,"excludeSelf":false,"includeDependencies":true,"includeDependents":false,"followProdDepsOnly":false}
    at _filterGraph (/Users/petercowling/.cache/node/corepack/v1/pnpm/10.12.1/dist/pnpm.cjs:105304:17)
    at filterWorkspacePackages (/Users/petercowling/.cache/node/corepack/v1/pnpm/10.12.1/dist/pnpm.cjs:105264:121)
    at filterPkgsBySelectorObjects (/Users/petercowling/.cache/node/corepack/v1/pnpm/10.12.1/dist/pnpm.cjs:105228:33)
    at filterPackages (/Users/petercowling/.cache/node/corepack/v1/pnpm/10.12.1/dist/pnpm.cjs:105220:14)
    at filterPackagesFromDir (/Users/petercowling/.cache/node/corepack/v1/pnpm/10.12.1/dist/pnpm.cjs:105215:18)
    at async main (/Users/petercowling/.cache/node/corepack/v1/pnpm/10.12.1/dist/pnpm.cjs:224132:31)
    at async runPnpm (/Users/petercowling/.cache/node/corepack/v1/pnpm/10.12.1/dist/pnpm.cjs:224433:5)
    at async /Users/petercowling/.cache/node/corepack/v1/pnpm/10.12.1/dist/pnpm.cjs:224425:7 in .
- Likely blast radius:
  - Any script migration that removes  without policy updates will fail hooks/CI.
  - Any migration of shared webpack callback behavior can affect all Next apps inheriting shared config.
  - Storybook webpack migration (if in-scope) affects local UI dev and CI storybook jobs, not Next app runtime.

### Security & Performance Boundaries
- Security boundary:
  - Guard scripts act as a release-control boundary; migration must preserve equivalent policy intent while changing bundler requirements.
- Performance boundary:
  - Continued webpack pinning on dev/build scripts likely keeps slower compile/HMR paths for those apps compared with Turbopack-capable surfaces.
- Error/fallback boundary:
  - App-level webpack callbacks currently encode fallback behavior (, alias maps). Equivalent behavior must be preserved or intentionally retired during migration.

### Test Landscape
#### Test Infrastructure
- Frameworks: Jest-based policy tests + app-level build/test pipelines.
- Relevant commands:
  - 
  - 

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Webpack policy enforcement | Unit/contract |  | Covers fail-closed behavior and exception matrix branches |
| i18n webpack-app selector contract | Unit/contract |  | Validates allowed  list behavior |
| App bundler behavior parity | Integration/build | workflow app builds | Indirectly exercised per app workflow; not a unified Turbopack parity suite |

#### Coverage Gaps
- No single automated parity suite for migrating remaining webpack apps to Turbopack.
- No contract test asserting eventual policy inversion away from webpack fail-closed defaults.
- No explicit migration tests for remaining  import-comment paths.
- Storybook builder migration path is untested (if included in scope).

#### Testability Assessment
- Easy to test:
  - Script/policy changes via existing Jest policy tests.
  - App script migration via targeted per-app  and  smoke probes.
- Hard to test:
  - Cross-app alias/fallback compatibility when removing webpack callbacks.
  - Storybook builder equivalence (if migrated away from webpack builder).
- Test seams needed:
  - Shared Turbopack smoke matrix for migrated apps.
  - Policy tests updated to reflect new default semantics.

### Recent Git History (Targeted)
-  - policy update allowing Brikette build without ; confirms matrix-based exception strategy in active use.
-  - introduced app-aware webpack policy matrix; confirms central policy gate is intentional, not accidental.
-  - added shared Turbopack resolveAlias block in ; indicates mixed webpack/turbopack transitional state.
-  and  - recent alias reversions/fixes in Turbopack migration area; implies alias handling remains an active regression vector.
-  - Storybook config change while keeping webpack builder surfaces; confirms non-Next webpack usage remains active.

## Questions
### Resolved
- Q: Are there still explicit webpack flags in app scripts?
  - A: Yes.  remains in 26  script entries across 13 apps (, , , , , , , , , , , , ).
  - Evidence: package script audit across  and .

- Q: Is webpack still enforced by repository policy gates?
  - A: Yes. Policy default is still fail-closed requiring , with narrow app/workflow exceptions.
  - Evidence: , , ========================================
  Validation Gate
========================================

> Finding changed files...
  Mode: working tree vs HEAD
Changed files (all):
  AGENTS.md
  apps/business-os/src/lib/business-catalog.ts
  docs/business-os/market-research/HBAG/latest.user.md
  docs/business-os/startup-loop-workflow.user.md
  docs/business-os/strategy/businesses.json
  docs/business-os/workflow-prompts/_templates/measurement-agent-setup-prompt.md
  docs/plans/brikette-seo-traffic-growth/plan.md
  docs/plans/brikette-seo-traffic-growth/task-16-gbp-audit.md
  packages/themes/base/tokens.dynamic.css
  packages/themes/base/tokens.static.css
  packages/themes/prime/tokens.css
  pnpm-lock.yaml

> Policy checks
Checking Next.js command policy matrix...
OK: Next.js command policy matrix check passed
Skipping i18n resolver contract check (no relevant path changes)

> Typecheck + lint (changed packages)
Typecheck filters: --filter=@apps/business-os
• Packages in scope: @apps/business-os
• Running typecheck in 1 packages
• Remote caching disabled
@acme/date-utils:build: cache hit, replaying logs 231b1add1adb2b12
@acme/date-utils:build: 
@acme/date-utils:build: > @acme/date-utils@0.0.0 build /Users/petercowling/base-shop/packages/date-utils
@acme/date-utils:build: > tsc -b
@acme/date-utils:build: 
@acme/telemetry:build: cache hit, replaying logs 13503ca8c12b1c26
@acme/telemetry:build: 
@acme/telemetry:build: > @acme/telemetry@0.0.1 build /Users/petercowling/base-shop/packages/telemetry
@acme/telemetry:build: > tsc -b
@acme/telemetry:build: 
@acme/zod-utils:build: cache hit, replaying logs ff6995ade3ba0fde
@acme/zod-utils:build: 
@acme/zod-utils:build: > @acme/zod-utils@0.0.0 build /Users/petercowling/base-shop/packages/zod-utils
@acme/zod-utils:build: > tsc -b
@acme/zod-utils:build: 
@themes/base:build: cache hit, replaying logs e154e7e9da85d228
@themes/base:build: 
@themes/base:build: > @themes/base@0.0.0 build /Users/petercowling/base-shop/packages/themes/base
@themes/base:build: > tsc -p tsconfig.json
@themes/base:build: 
@acme/guide-system:build: cache hit, replaying logs 711bb85ea2f86638
@acme/guide-system:build: 
@acme/guide-system:build: > @acme/guide-system@0.0.0 build /Users/petercowling/base-shop/packages/guide-system
@acme/guide-system:build: > tsc -b
@acme/guide-system:build: 
@acme/seo:build: cache hit, replaying logs 8cb6cba17a3b1ea4
@acme/seo:build: 
@acme/seo:build: > @acme/seo@0.0.0 build /Users/petercowling/base-shop/packages/seo
@acme/seo:build: > tsc -b
@acme/seo:build: 
@acme/config:build: cache hit, replaying logs 2866cc92c45ca371
@acme/config:build: 
@acme/config:build: > @acme/config@0.0.0 prebuild /Users/petercowling/base-shop/packages/config
@acme/config:build: > pnpm --filter @acme/zod-utils run build && pnpm run build:stubs
@acme/config:build: 
@acme/config:build: 
@acme/config:build: > @acme/zod-utils@0.0.0 build /Users/petercowling/base-shop/packages/zod-utils
@acme/config:build: > tsc -b
@acme/config:build: 
@acme/config:build: 
@acme/config:build: > @acme/config@0.0.0 build:stubs /Users/petercowling/base-shop/packages/config
@acme/config:build: > node ./scripts/generate-env-stubs.mjs
@acme/config:build: 
@acme/config:build: 
@acme/config:build: > @acme/config@0.0.0 build /Users/petercowling/base-shop/packages/config
@acme/config:build: > tsc -b
@acme/config:build: 
@acme/stripe:build: cache hit, replaying logs 10a00c7b3cd7b7fe
@acme/stripe:build: 
@acme/stripe:build: > @acme/stripe@0.0.0 build /Users/petercowling/base-shop/packages/stripe
@acme/stripe:build: > tsc -b --force
@acme/stripe:build: 
@acme/types:build: cache hit, replaying logs 0948edbf7de74451
@acme/types:build: 
@acme/types:build: > @acme/types@0.0.1 build /Users/petercowling/base-shop/packages/types
@acme/types:build: > tsc -b
@acme/types:build: 
@acme/plugin-sanity:build: cache hit, replaying logs 038f1fda606d7071
@acme/plugin-sanity:build: 
@acme/plugin-sanity:build: > @acme/plugin-sanity@0.0.0 build /Users/petercowling/base-shop/packages/plugins/sanity
@acme/plugin-sanity:build: > tsc -b
@acme/plugin-sanity:build: 
@acme/page-builder-core:build: cache hit, replaying logs 046db281183a45d3
@acme/page-builder-core:build: 
@acme/page-builder-core:build: > @acme/page-builder-core@1.0.0 build /Users/petercowling/base-shop/packages/page-builder-core
@acme/page-builder-core:build: > tsc -b
@acme/page-builder-core:build: 
@acme/lib:build: cache hit, replaying logs 580e884d3800db54
@acme/lib:build: 
@acme/lib:build: > @acme/lib@0.0.0 build /Users/petercowling/base-shop/packages/lib
@acme/lib:build: > tsc -b
@acme/lib:build: 
@acme/i18n:build: cache hit, replaying logs f921277e134b86ba
@acme/i18n:build: 
@acme/i18n:build: > @acme/i18n@0.0.0 build /Users/petercowling/base-shop/packages/i18n
@acme/i18n:build: > tsc -b
@acme/i18n:build: 
@acme/templates:build: cache hit, replaying logs 761eb0744649b2e5
@acme/templates:build: 
@acme/templates:build: > @acme/templates@0.0.0 build /Users/petercowling/base-shop/packages/templates
@acme/templates:build: > tsc -b
@acme/templates:build: 
@acme/platform-core:build: cache hit, replaying logs ee476d4f37ca7509
@acme/platform-core:build: 
@acme/platform-core:build: > @acme/platform-core@0.0.0 build /Users/petercowling/base-shop/packages/platform-core
@acme/platform-core:build: > tsc -b
@acme/platform-core:build: 
@acme/auth:build: cache hit, replaying logs a9993e964a5738a5
@acme/auth:build: 
@acme/auth:build: > @acme/auth@0.0.0 build /Users/petercowling/base-shop/packages/auth
@acme/auth:build: > tsc -b
@acme/auth:build: 
@acme/design-system:build: cache hit, replaying logs 8c4ee2caf19a39bb
@acme/design-system:build: 
@acme/design-system:build: > @acme/design-system@0.1.0 build /Users/petercowling/base-shop/packages/design-system
@acme/design-system:build: > tsc -b && cp src/molecules/DatePicker.css dist/molecules/DatePicker.css
@acme/design-system:build: 
@acme/ui:build: cache hit, replaying logs be62493e87aa381c
@acme/ui:build: 
@acme/ui:build: > @acme/ui@0.1.0 build /Users/petercowling/base-shop/packages/ui
@acme/ui:build: > tsc -b
@acme/ui:build: 
@apps/business-os:typecheck: cache hit, replaying logs f2f6f7e81b057097
@apps/business-os:typecheck: 
@apps/business-os:typecheck: > @apps/business-os@ typecheck /Users/petercowling/base-shop/apps/business-os
@apps/business-os:typecheck: > tsc -p tsconfig.json --noEmit
@apps/business-os:typecheck: 

 Tasks:    19 successful, 19 total
Cached:    19 cached, 19 total
  Time:    2.071s >>> FULL TURBO

OK: Typecheck passed
Lint filters: --filter=@apps/business-os
• Packages in scope: @apps/business-os
• Running lint in 1 packages
• Remote caching disabled
@acme/telemetry:lint: cache hit, replaying logs 41a7c4e628988bcc
@acme/telemetry:lint: 
@acme/telemetry:lint: > @acme/telemetry@0.0.1 lint /Users/petercowling/base-shop/packages/telemetry
@acme/telemetry:lint: > eslint .
@acme/telemetry:lint: 
@acme/seo:lint: cache hit, replaying logs 02ff0abf99420176
@acme/seo:lint: 
@acme/seo:lint: > @acme/seo@0.0.0 lint /Users/petercowling/base-shop/packages/seo
@acme/seo:lint: > eslint .
@acme/seo:lint: 
@acme/date-utils:lint: cache hit, replaying logs 761f07f73284ff3d
@acme/date-utils:lint: 
@acme/date-utils:lint: > @acme/date-utils@0.0.0 lint /Users/petercowling/base-shop/packages/date-utils
@acme/date-utils:lint: > eslint .
@acme/date-utils:lint: 
@themes/base:lint: cache hit, replaying logs 89f4383bcd0cba7b
@themes/base:lint: 
@themes/base:lint: > @themes/base@0.0.0 lint /Users/petercowling/base-shop/packages/themes/base
@themes/base:lint: > eslint .
@themes/base:lint: 
@acme/zod-utils:lint: cache hit, replaying logs 71dca41fa8b7afd3
@acme/zod-utils:lint: 
@acme/zod-utils:lint: > @acme/zod-utils@0.0.0 lint /Users/petercowling/base-shop/packages/zod-utils
@acme/zod-utils:lint: > eslint .
@acme/zod-utils:lint: 
@acme/types:lint: cache hit, replaying logs 0e3af46b92f14f0f
@acme/types:lint: 
@acme/types:lint: > @acme/types@0.0.1 lint /Users/petercowling/base-shop/packages/types
@acme/types:lint: > eslint .
@acme/types:lint: 
@acme/guide-system:lint: cache hit, replaying logs 55903c48af73c247
@acme/guide-system:lint: 
@acme/guide-system:lint: > @acme/guide-system@0.0.0 lint /Users/petercowling/base-shop/packages/guide-system
@acme/guide-system:lint: > eslint .
@acme/guide-system:lint: 
@acme/config:lint: cache hit, replaying logs 70d5ad9923104e4c
@acme/config:lint: 
@acme/config:lint: > @acme/config@0.0.0 lint /Users/petercowling/base-shop/packages/config
@acme/config:lint: > eslint .
@acme/config:lint: 
@acme/plugin-sanity:lint: cache hit, replaying logs 6902d4fc57f336ba
@acme/plugin-sanity:lint: 
@acme/plugin-sanity:lint: > @acme/plugin-sanity@0.0.0 lint /Users/petercowling/base-shop/packages/plugins/sanity
@acme/plugin-sanity:lint: > eslint .
@acme/plugin-sanity:lint: 
@acme/page-builder-core:lint: cache hit, replaying logs 229e862bbab38da1
@acme/page-builder-core:lint: 
@acme/page-builder-core:lint: > @acme/page-builder-core@1.0.0 lint /Users/petercowling/base-shop/packages/page-builder-core
@acme/page-builder-core:lint: > eslint .
@acme/page-builder-core:lint: 
@acme/i18n:lint: cache hit, replaying logs 164b8e68cd024751
@acme/i18n:lint: 
@acme/i18n:lint: > @acme/i18n@0.0.0 lint /Users/petercowling/base-shop/packages/i18n
@acme/i18n:lint: > eslint .
@acme/i18n:lint: 
@acme/next-config:lint: cache hit, replaying logs b5a438d8d5c51f03
@acme/next-config:lint: 
@acme/next-config:lint: > @acme/next-config@ lint /Users/petercowling/base-shop/packages/next-config
@acme/next-config:lint: > eslint .
@acme/next-config:lint: 
@acme/lib:lint: cache hit, replaying logs 80f877f539898223
@acme/lib:lint: 
@acme/lib:lint: > @acme/lib@0.0.0 lint /Users/petercowling/base-shop/packages/lib
@acme/lib:lint: > eslint .
@acme/lib:lint: 
@acme/stripe:lint: cache hit, replaying logs 56d9734097b7fb18
@acme/stripe:lint: 
@acme/stripe:lint: > @acme/stripe@0.0.0 lint /Users/petercowling/base-shop/packages/stripe
@acme/stripe:lint: > eslint .
@acme/stripe:lint: 
@acme/templates:lint: cache hit, replaying logs 005978d54f613f1f
@acme/templates:lint: 
@acme/templates:lint: > @acme/templates@0.0.0 lint /Users/petercowling/base-shop/packages/templates
@acme/templates:lint: > eslint .
@acme/templates:lint: 
@acme/platform-core:lint: cache hit, replaying logs b724bf386381fb23
@acme/platform-core:lint: 
@acme/platform-core:lint: > @acme/platform-core@0.0.0 lint /Users/petercowling/base-shop/packages/platform-core
@acme/platform-core:lint: > eslint .
@acme/platform-core:lint: 
@acme/auth:lint: cache hit, replaying logs 0bc649cfcd46ab32
@acme/auth:lint: 
@acme/auth:lint: > @acme/auth@0.0.0 lint /Users/petercowling/base-shop/packages/auth
@acme/auth:lint: > eslint .
@acme/auth:lint: 
@acme/design-system:lint: cache hit, replaying logs 81a74d666892c98a
@acme/design-system:lint: 
@acme/design-system:lint: > @acme/design-system@0.1.0 lint /Users/petercowling/base-shop/packages/design-system
@acme/design-system:lint: > eslint .
@acme/design-system:lint: 
@acme/ui:lint: cache hit, replaying logs 231b05aacca55025
@acme/ui:lint: 
@acme/ui:lint: > @acme/ui@0.1.0 lint /Users/petercowling/base-shop/packages/ui
@acme/ui:lint: > eslint .
@acme/ui:lint: 
@apps/business-os:lint: cache hit, replaying logs 2423df4bbb088333
@apps/business-os:lint: 
@apps/business-os:lint: > @apps/business-os@ lint /Users/petercowling/base-shop/apps/business-os
@apps/business-os:lint: > eslint "src/**/*.{ts,tsx}" --cache --cache-location .eslintcache
@apps/business-os:lint: 
@apps/business-os:lint: 
@apps/business-os:lint: /Users/petercowling/base-shop/apps/business-os/src/app/api/agent/stage-docs/route.ts
@apps/business-os:lint:   125:18  warning  Hardcoded copy detected. Move text into packages/i18n/src/<locale>.json and reference via t('key'). See docs/i18n/add-translation-keys.md. Exemptions are tech debt and only for non‑UI strings — they must include a ticket (// i18n-exempt -- ABC-123 [ttl=YYYY-MM-DD]) or they will be ignored  ds/no-hardcoded-copy
@apps/business-os:lint: 
@apps/business-os:lint: ✖ 1 problem (0 errors, 1 warning)
@apps/business-os:lint: 

 Tasks:    20 successful, 20 total
Cached:    20 cached, 20 total
  Time:    760ms >>> FULL TURBO

OK: Lint passed

Changed TS/TSX files:
  apps/business-os/src/lib/business-catalog.ts

> Grouping by package...

> Running targeted tests...

  Package: ./apps/business-os (runner: jest)
    Source files: apps/business-os/src/lib/business-catalog.ts
    Running related tests for files (coverage thresholds relaxed)...
Joined test queue as ticket 000000001892
PASS src/components/navigation/NavigationHeader.test.tsx
PASS src/app/api/agent/ideas/__tests__/route.test.ts
PASS src/components/keyboard/KeyboardShortcutProvider.test.tsx
PASS src/components/capture/QuickCaptureModal.test.tsx
PASS src/components/capture/CaptureFAB.test.tsx
PASS src/app/api/agent/businesses/__tests__/route.test.ts
PASS src/app/api/agent/allocate-id/__tests__/route.test.ts
PASS src/app/api/agent/cards/__tests__/route.test.ts
PASS src/app/api/ideas/__tests__/route.test.ts
PASS src/app/api/business/[business]/growth-ledger/route.test.ts

Test Suites: 10 passed, 10 total
Tests:       62 passed, 62 total
Snapshots:   0 total
Time:        8.892 s, estimated 25 s
Ran all test suites related to files matching /\/Users\/petercowling\/base-shop\/apps\/business-os\/src\/lib\/business-catalog.ts/i.

> Ideas-go-faster contract checks...
PASS: ideas-go-faster contract checks passed.
OK: ideas-go-faster contract checks passed

========================================
Summary:
  Packages tested: 1
  Files missing tests: 0

OK: All validation checks passed, .

- Q: Are webpack runtime APIs () still active in source?
  - A: No active usage found in non-artifact source scan.
  - Evidence: repo scan with generated/artifact exclusions returned no matches.

- Q: Does non-Next webpack usage still exist?
  - A: Yes. Storybook config explicitly uses webpack builder and webpack plugins.
  - Evidence: , .

### Open (User Input Needed)
- Q: Is Storybook builder migration included in fully
