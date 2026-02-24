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
  - Repo policy currently fails closed to webpack for `dev` / `build` unless explicitly allowed.
  - Shared Next config (`packages/next-config/next.config.mjs`) still exposes a webpack callback used by multiple apps.
  - Multiple apps contain app-specific webpack callback logic beyond shared config.
- Assumptions:
  - Full migration target is all Next app workflows to Turbopack-compatible surfaces.
  - Storybook webpack builder is treated as a separate migration decision unless explicitly folded into scope.

## Evidence Audit (Current State)
### Entry Points
- Next app scripts with explicit `--webpack` flags in `dev`, `build`, and `preview` command surfaces.
- Repo guardrails that enforce webpack defaults:
  - `scripts/check-next-webpack-flag.mjs`
  - `scripts/__tests__/next-webpack-flag-policy.test.ts`
- Next config callbacks and aliases:
  - `packages/next-config/next.config.mjs` (shared webpack callback + turbopack resolveAlias block)
  - App-level `next.config.mjs` files with `webpack` callbacks
- Webpack magic comments in locale loaders (`webpackInclude`) in app/package source files.
- Storybook webpack builder configuration under `apps/storybook/.storybook/`.

### Key Modules / Files
- `scripts/check-next-webpack-flag.mjs` — fail-closed default policy (`--webpack` required unless matrix exception).
- `scripts/__tests__/next-webpack-flag-policy.test.ts` — policy contract tests enforcing webpack defaults for most apps (12 test cases).
- `scripts/validate-changes.sh` — runs policy script in CI merge gate and pre-commit hooks.
- `packages/next-config/next.config.mjs` — shared webpack callback (resolve extensions, extensionAlias, workspace package aliases for `@acme/design-system`, `@acme/cms-ui`, `@acme/lib`, `@acme/seo`, node: built-in mapping, drizzle-orm disable) and turbopack resolveAlias block.
- `apps/cms/next.config.mjs` — extensive custom webpack callback (~174 lines): `ensureSafeWebpackHash`, filesystem caching in dev, `@` alias, theme subpath aliases, `@acme/configurator`, React/ReactDOM dedup, entity decode/escape, oidc-token-hash, Sentry client exclusion, pino runtime deps, dynamic import warning suppression.
- `apps/business-os/next.config.mjs` — app-level webpack callback: `@` alias, client-side `resolve.fallback` for `fs`, `child_process`, `path` (set to `false`).
- `apps/cochlearfit/next.config.mjs` — webpack callback: cache disable toggle, `@` alias to `src/`.
- `apps/product-pipeline/next.config.mjs` — webpack callback: snapshot path clearing, `@` alias, `@acme/ui` alias to dist.
- `apps/handbag-configurator/next.config.mjs` — webpack callback: cache disable in non-dev builds.
- `apps/skylar/next.config.mjs` — webpack callback: `@` alias to `src/`.
- `apps/xa-uploader/next.config.mjs` — webpack callback: cache disable toggle.
- `packages/template-app/next.config.mjs` — webpack callback: `@acme/i18n` alias, cache disable toggle.
- `apps/storybook/.storybook/main.ts` — explicit `@storybook/builder-webpack5` builder, `webpack.NormalModuleReplacementPlugin` for `node:` prefix stripping, resolve aliases via `getStorybookAliases()`, extension aliases, Node core module fallbacks.
- `package.json` — root `webpack` devDependency at `^5.104.1`.

### Patterns & Conventions Observed
- Script-level bundler pinning remains the dominant coupling pattern: many apps still pin `--webpack` in package scripts.
- Policy coupling is intentional and explicit: the repo enforces webpack-by-default for Next script surfaces outside exception matrix entries (`brikette`, `reception`).
- Shared config drift: `packages/next-config/next.config.mjs` now contains both `webpack` and `turbopack` surfaces; app configs inherit/override selectively.
- Source-level webpack magic comments remain in i18n dynamic imports (`webpackInclude`), plus script tooling that rewrites those comments (`scripts/src/add-locale.ts`).
- Inference: the policy layer is currently a stronger migration blocker than individual app script edits, because CI/hooks will reject many script changes unless the policy matrix is updated first.

### Data & Contracts
- Script contract:
  - Policy scanner parses `dev`/`build` command segments and requires `--webpack` by default (`RULE_REQUIRE_WEBPACK`).
- Exception matrix contract:
  - App exceptions are encoded in `APP_COMMAND_POLICY_MATRIX` and workflow exceptions in `WORKFLOW_APP_MATRIX` in `scripts/check-next-webpack-flag.mjs`.
  - Currently only `brikette` and `reception` have `RULE_ALLOW_ANY` exceptions for both `dev` and `build`.
- Config contract:
  - Shared `webpack` callback and Node alias mappings are centralized in `packages/next-config/next.config.mjs`.
  - App-level callbacks may add additional cache/alias/fallback behavior (see Key Modules above for per-app breakdown).
- CI contract:
  - Merge gate runs `check-next-webpack-flag.mjs` via `validate-changes.sh` and blocks merges on violations.

### Dependency & Impact Map
- Upstream dependencies:
  - Next app package scripts (`apps/*/package.json`, `packages/template-app/package.json`).
  - Shared config (`packages/next-config/next.config.mjs`).
  - Policy and tests (`scripts/check-next-webpack-flag.mjs`, `scripts/__tests__/next-webpack-flag-policy.test.ts`).
- Downstream dependents:
  - CI merge gate and pre-commit validation.
  - App workflows that call package build scripts via turbo/pnpm in `.github/workflows/*.yml`.
- Likely blast radius:
  - Any script migration that removes `--webpack` without policy updates will fail hooks/CI.
  - Any migration of shared webpack callback behavior can affect all Next apps inheriting shared config.
  - Storybook webpack migration (if in-scope) affects local UI dev and CI storybook jobs, not Next app runtime.

### Security & Performance Boundaries
- Security boundary:
  - Guard scripts act as a release-control boundary; migration must preserve equivalent policy intent while changing bundler requirements.
- Performance boundary:
  - Continued webpack pinning on dev/build scripts likely keeps slower compile/HMR paths for those apps compared with Turbopack-capable surfaces.
- Error/fallback boundary:
  - App-level webpack callbacks currently encode fallback behavior (`resolve.fallback`, alias maps). Equivalent behavior must be preserved or intentionally retired during migration.

### Test Landscape
#### Test Infrastructure
- Frameworks: Jest-based policy tests + app-level build/test pipelines.
- Relevant commands:
  - `pnpm exec jest --runInBand --config ./jest.config.cjs scripts/__tests__/next-webpack-flag-policy.test.ts`
  - `node scripts/check-next-webpack-flag.mjs --all`

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Webpack policy enforcement | Unit/contract | `scripts/__tests__/next-webpack-flag-policy.test.ts` | Covers fail-closed behavior and exception matrix branches (12 test cases) |
| i18n webpack-app selector contract | Unit/contract | `packages/i18n/src/__tests__/` | Validates allowed locale list behavior |
| App bundler behavior parity | Integration/build | workflow app builds | Indirectly exercised per app workflow; not a unified Turbopack parity suite |

#### Coverage Gaps
- No single automated parity suite for migrating remaining webpack apps to Turbopack.
- No contract test asserting eventual policy inversion away from webpack fail-closed defaults.
- No explicit migration tests for remaining `webpackInclude` import-comment paths.
- Storybook builder migration path is untested (if included in scope).

#### Testability Assessment
- Easy to test:
  - Script/policy changes via existing Jest policy tests.
  - App script migration via targeted per-app `next dev` and `next build` smoke probes.
- Hard to test:
  - Cross-app alias/fallback compatibility when removing webpack callbacks.
  - Storybook builder equivalence (if migrated away from webpack builder).
- Test seams needed:
  - Shared Turbopack smoke matrix for migrated apps.
  - Policy tests updated to reflect new default semantics.

### Recent Git History (Targeted)
- Policy update allowing Brikette build without `--webpack`; confirms matrix-based exception strategy in active use.
- Introduced app-aware webpack policy matrix; confirms central policy gate is intentional, not accidental.
- Added shared Turbopack `resolveAlias` block in `packages/next-config/next.config.mjs`; indicates mixed webpack/turbopack transitional state.
- Recent alias reversions/fixes in Turbopack migration area; implies alias handling remains an active regression vector.
- Storybook config change while keeping webpack builder surfaces; confirms non-Next webpack usage remains active.

## Questions
### Resolved
- Q: Are there still explicit webpack flags in app scripts?
  - A: Yes. As of 2026-02-23, 28 package-script commands across 14 apps still include `--webpack` (`business-os`, `caryina`, `cms`, `cochlearfit`, `cover-me-pretty`, `handbag-configurator`, `prime`, `product-pipeline`, `skylar`, `template-app`, `xa`, `xa-b`, `xa-j`, `xa-uploader`).
  - Evidence: `rg --glob 'apps/*/package.json' --glob 'packages/template-app/package.json' 'next (dev|build|start)[^\n]*--webpack' apps packages`.

- Q: Is webpack still enforced by repository policy gates?
  - A: Yes. Policy default is still fail-closed requiring `--webpack`, with narrow app/workflow exceptions (`brikette` and `reception` only).
  - Evidence: `scripts/check-next-webpack-flag.mjs` (lines 18-21: `DEFAULT_COMMAND_POLICY`), `scripts/__tests__/next-webpack-flag-policy.test.ts` (12 contract tests), `scripts/validate-changes.sh` (lines 84-92: policy check integration).

- Q: Are webpack runtime APIs (`import.meta.webpackContext`) still active in source?
  - A: No active usage found in non-artifact source scan.
  - Evidence: repo scan with generated/artifact exclusions returned no matches.

- Q: Do `webpackInclude` magic comments still exist in active source?
  - A: Yes. 7 files contain active `webpackInclude` usage: `packages/i18n/src/loadMessages.server.ts`, `packages/template-app/src/app/[lang]/layout.tsx`, `packages/template-app/src/app/[lang]/checkout/layout.tsx`, `apps/cover-me-pretty/src/app/[lang]/layout.tsx`, `apps/skylar/src/app/[lang]/layout.tsx`, `apps/cochlearfit/src/lib/messages.ts`, `scripts/src/add-locale.ts`.
  - Evidence: `rg 'webpackInclude' apps packages scripts --glob '!**/node_modules/**' --glob '!**/dist/**'`.
  - Note: `webpackPrefetch`, `webpackChunkName`, and `import.meta.webpackContext` have all been fully eliminated from active source.

- Q: Does non-Next webpack usage still exist?
  - A: Yes. Storybook config explicitly uses `@storybook/builder-webpack5`, `webpack.NormalModuleReplacementPlugin`, and resolve alias setup.
  - Evidence: `apps/storybook/.storybook/main.ts`, `apps/storybook/.storybook-ci/main.ts`.

- Q: Is Storybook builder migration included in full-migration scope?
  - A: No for this plan. TASK-01 selected Option A (Next runtime only), and Storybook migration is a separate follow-on lane.
  - Evidence: `docs/plans/turbopack-full-migration/plan.md` Decision Log entry dated 2026-02-23.

### Open (User Input Needed)
- None.

## Confidence Inputs
| Dimension | Score | Rationale |
|---|---|---|
| Implementation | 80% | Inventory is mostly complete but still requires refresh checks as repo state evolves (for example, script count is currently 28 commands across 14 apps, including `caryina`). Callback complexity varies significantly per app (CMS ~174 lines vs skylar ~5 lines). |
| Approach | 85% | Policy-first migration strategy is well-supported by existing exception matrix precedent (brikette/reception). Trade-off between matrix expansion and default inversion is well-characterized. |
| Impact | 80% | Cross-app callback migration carries regression risk, especially for alias/fallback behavior. No existing parity test suite. |
| Delivery-Readiness | 85% | Policy tests and validation infrastructure are already in place. Migration matrix artifact needed before implementation. |
| Testability | 80% | Policy layer is well-tested. Callback parity and source-pattern replacement paths lack automated coverage. |

## Risks
- Inventory drift during planning:
  - Likelihood: Medium
  - Impact: High
  - Mitigation: rerun script and callback audits at TASK-02 start and immediately before TASK-08 execution.
- Callback parity gaps in high-complexity configs (especially `apps/cms`):
  - Likelihood: Medium
  - Impact: High
  - Mitigation: require callback responsibility matrix + representative app parity probes before script migration.
- Policy and app wave sequencing mismatch:
  - Likelihood: Medium
  - Impact: High
  - Mitigation: keep policy-gate updates ahead of script flag removals and verify with policy tests each wave.
- Storybook excluded from this plan can leave cleanup coupling:
  - Likelihood: Medium
  - Impact: Medium
  - Mitigation: keep Storybook exclusion explicit in acceptance criteria and dependency-cleanup decisions.

## Planning Readiness
- **Ready for planning:** Yes.
- **Key planning inputs:**
  - 28 package-script commands across 14 apps currently include `--webpack` and require migration handling.
  - Policy gate must be updated before or alongside app script changes.
  - 7 files contain `webpackInclude` magic comments requiring bundler-neutral replacement.
  - 9 config files contain webpack callbacks of varying complexity (CMS is highest risk).
  - Storybook is out-of-scope for this plan; final cleanup must preserve explicit rationale for any retained webpack dependency.
- **Recommended sequencing:** Policy and matrix decisions first, then source-pattern cleanup and callback migration in parallel, then bulk script migration, then hardening.
- **Open blockers:** None.
