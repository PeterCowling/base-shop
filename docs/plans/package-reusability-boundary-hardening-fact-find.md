---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-02-11
Last-updated: 2026-02-11
Feature-Slug: package-reusability-boundary-hardening
Deliverable-Type: code-change
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/package-reusability-boundary-hardening-plan.md
Business-OS-Integration: off
---

# Package Reusability And Boundary Hardening Fact-Find Brief

## Scope
### Summary
Audit package structure and dependency boundaries to determine whether monorepo packages are optimized for reuse, and identify where boundary leakage is causing repeated implementation and duplicated testing effort.

### Goals
- Map current package ownership boundaries and import contracts.
- Quantify overlap/duplication in the most affected shared UI packages.
- Identify concrete boundary leaks that force repetitive testing work.
- Provide planning-ready constraints and task seeds for a cleanup initiative.

### Non-goals
- No implementation or refactor in this lp-do-fact-find.
- No package API removals or migration execution in this step.
- No CI workflow rewiring in this step.

### Constraints & Assumptions
- Constraints:
  - Refactors must be incremental and preserve consumer behavior across multiple apps.
  - Existing package consumers across `apps/*` need compatibility shims during migration.
  - Validation gates must remain green during transition.
- Assumptions:
  - The present `ui/cms-ui` split is transitional and not intended as permanent duplication.

## Evidence Audit (Current State)
### Entry Points
- `pnpm-workspace.yaml` - workspace boundaries and package discovery.
- `turbo.json` - build/lint/typecheck/test orchestration.
- `tsconfig.base.json` - global alias strategy and source-path resolution.
- `scripts/validate-changes.sh` - current validation gate behavior.

### Key Modules / Files
- `packages/ui/package.json` - broad export surface and mixed domain ownership.
- `packages/cms-ui/package.json` - package positioned as CMS owner while depending directly on `@acme/ui`.
- `packages/cms-ui/src/index.ts` - re-export bridge into `@acme/ui/components/cms`.
- `packages/ui/src/components/cms/MIGRATION.md` - explicit in-repo statement that CMS UI is being moved out of `@acme/ui`.
- `packages/cms-ui/jest.config.cjs` - test mapper routing imports to `../ui/src/*`.
- `packages/ui/jest.config.cjs` - coverage excludes CMS paths while tests still exist there.

### Patterns & Conventions Observed
- **Source-first aliasing**: TypeScript aliases resolve packages to `packages/*/src` before `dist`.
  - Evidence: `tsconfig.base.json:31`.
- **App alias visibility from packages**: `@cms/*` alias available and used in package tests.
  - Evidence: `tsconfig.base.json:67`, `packages/ui/tsconfig.test.typecheck.json:27`, `packages/ui/src/components/cms/tests/MediaManager.upload.test.tsx:1`.
- **Direct source consumption in tests/scripts**: root tests, app tests, and scripts import `packages/*/src` paths directly.
  - Evidence: `__tests__/coupons.test.ts:2`, `test/__tests__/checkout.test.tsx:5`, `apps/cms/cypress/e2e/modal-a11y.cy.tsx:11`, `scripts/src/build-tokens.ts:12`.
- **Intentional transitional duplication** documented but still active.
  - Evidence: `packages/ui/src/components/cms/MIGRATION.md:1`.

### Data & Contracts
- Package export maps exist but are frequently bypassed by source aliases and test mappers.
  - Evidence: `packages/ui/package.json:8`, `packages/cms-ui/package.json:8`, `tsconfig.base.json:31`, `packages/cms-ui/jest.config.cjs:43`.
- `@acme/ui` currently exposes a very large API surface (78 `exports` entries), mixing reusable UI and CMS/domain-facing modules.
  - Evidence: `packages/ui/package.json:8`.

### Dependency & Impact Map
- Workspace graph snapshot (manifest audit): 72 workspace manifests, 193 internal workspace edges, no dependency cycles detected.
- Highest shared hubs by incoming dependency count include `@acme/design-system`, `@acme/config`, `@acme/i18n`, `@acme/next-config`, `@acme/platform-core`, `@acme/types`, `@acme/ui`.
- Highest outward dependency consumers include `@apps/cms`, `@apps/cover-me-pretty`, `@acme/template-app`, and `@apps/xa-*` apps.
- `@acme/cms-ui` currently depends on `@acme/ui` while simultaneously mirroring/re-exporting its CMS surface.
  - Evidence: `packages/cms-ui/package.json:149`, `packages/cms-ui/src/index.ts:12`.

Likely blast radius for remediation:
- Package-level imports across `apps/cms`, `packages/template-app`, and other app consumers.
- Unit tests under `packages/ui` and `packages/cms-ui`.
- Root and app-level tests/scripts that import package internals by file path.

### Test Landscape (required for `code` or `mixed`)
#### Test Infrastructure
- **Frameworks:** Jest (primary), Cypress for app-level E2E/component checks.
- **Commands:** package-local `pnpm --filter <pkg> test`; targeted gate in `scripts/validate-changes.sh`.
- **CI integration:** Turbo task graph (`turbo.json`) plus scoped package validation in `scripts/validate-changes.sh`.
- **Coverage tools:** Jest thresholds via shared preset (`packages/config/jest.preset.cjs`) with package overrides.

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|------|-----------|-------|----------------|
| `packages/ui/src/components/cms` | unit | 277 test/spec files | Active despite migration note; excluded from `@acme/ui` coverage threshold. |
| `packages/cms-ui/src` | unit | 244 test/spec files | 244/244 map to equivalent `packages/ui` CMS test paths; 171 exact file duplicates. |
| root `test/` + `__tests__/` + app E2E | mixed | multiple | Several tests import `packages/*/src` directly, bypassing package contracts. |

#### Test Patterns & Conventions
- High use of heavy mocking and cross-package alias shims in UI tests.
  - Evidence: `packages/ui/src/components/cms/tests/MediaManager.upload.test.tsx:7`.
- Package Jest configs explicitly map sibling package imports to source directories.
  - Evidence: `packages/cms-ui/jest.config.cjs:43`.
- Some app-level Cypress tests mount UI primitives directly from package source files.
  - Evidence: `apps/cms/cypress/e2e/modal-a11y.cy.tsx:11`.

#### Coverage Gaps (Planning Inputs)
- **Untested/under-governed contract surface:**
  - Package-boundary contract itself is not enforced consistently (source imports allowed broadly).
  - Evidence: `tsconfig.base.json:31`, `packages/ui/tsconfig.test.typecheck.json:27`.
- **Validation consistency gaps:** many packages do not define a local `typecheck` script; some lint scripts are placeholder/no-op.
  - Evidence: `apps/brikette/package.json:10`, `apps/product-pipeline/package.json:9`, `apps/storybook/package.json:12`.
- **Theme package validation gap:** theme packages such as `@themes/base` have no local test script.
  - Evidence: `packages/themes/base/package.json:26`.

#### Extinct Tests (tests asserting obsolete behavior)
- **Duplicate mirror tests between `ui` and `cms-ui` are candidates for extinct classification** once package ownership is finalized.
- Current examples include fully identical CMS campaign and style tests across both packages.
  - Evidence pair:
    - `packages/ui/src/components/cms/marketing/campaign/__tests__/CampaignWizard.test.tsx`
    - `packages/cms-ui/src/marketing/campaign/__tests__/CampaignWizard.test.tsx`
  - Evidence pair:
    - `packages/ui/src/components/cms/style/__tests__/TextToken.test.tsx`
    - `packages/cms-ui/src/style/__tests__/TextToken.test.tsx`

#### Testability Assessment
- **Easy to test:** package-local pure components/utilities with stable import seams.
- **Hard to test:** modules relying on app aliases (`@cms/*`) or cross-package source path mappers.
- **Test seams needed:** explicit package-level adapters/interfaces for app server actions and app-only runtime hooks.

#### Recommended Test Approach
- **Unit tests for:** canonical owner package only (remove mirrored duplicates over time).
- **Integration tests for:** app-level wiring (`apps/cms`) against package public exports only.
- **E2E tests for:** critical CMS flows in app runtime, not source-path-mounted package internals.
- **Contract tests for:** exported package APIs to prevent direct `src` import regressions.

### Recent Git History (Targeted)
- `a094e85d18` (`packages/ui`, `packages/cms-ui`, `packages/design-system`, `packages/platform-core`) - broad checkpoint commit indicates active churn in relevant surfaces.
- `2cc8fd1f58` (`@acme/ui`) - lint-focused fixes, suggests ongoing maintenance burden in shared UI.
- `087acc45ab`, `7a437b1775`, `e1f8474c50` (`@acme/design-system`) - ongoing design-system feature and test work; dependencies still tightly interwoven with platform contexts.

## External Research (If needed)
- None required; repository evidence was sufficient for this first-pass architectural lp-do-fact-find.

## Questions
### Resolved
- Q: Is there concrete evidence that package reuse boundaries are blurred?
  - A: Yes. Global and package test aliases expose app internals and package source files directly.
  - Evidence: `tsconfig.base.json:67`, `packages/ui/tsconfig.test.typecheck.json:27`, `test/__tests__/checkout.test.tsx:5`.
- Q: Is there measurable duplicated test effort?
  - A: Yes. `cms-ui` test set is fully mirrored against `ui` CMS-path test set, with majority exact duplicates.
  - Evidence: `packages/cms-ui/src/*/__tests__`, `packages/ui/src/components/cms/*/__tests__`.
- Q: Is the current state known to be transitional?
  - A: Yes. Migration note explicitly states CMS/page-builder code should leave `@acme/ui`.
  - Evidence: `packages/ui/src/components/cms/MIGRATION.md:1`.

### Open (User Input Needed)
- Q: Which package should be the canonical owner for CMS/page-builder UI during cleanup?
  - Why it matters: Determines where tests live and which package exposes stable contracts.
  - Decision impacted: Scope and sequencing of deduplication/migration tasks.
  - Default assumption + risk: Default to `@acme/cms-ui` as CMS owner, keep `@acme/ui` compatibility shims temporarily. Risk: short-term dual-path imports during transition.

## Confidence Inputs (for /lp-do-plan)
- **Implementation:** 86%
  - Evidence is strong and file-level issues are concrete; execution is mostly deterministic refactor + rule enforcement.
  - To reach >=90: spike one package slice (`media` or `campaign`) end-to-end to validate migration mechanics and CI timing impact.
- **Approach:** 79%
  - Primary uncertainty is target ownership decision for CMS surface and deprecation path.
  - To reach >=80: lock a single ownership decision (`cms-ui` canonical) and migration policy in plan assumptions.
  - To reach >=90: produce import-graph diff and a branch-level dry run showing no behavior regressions on one migrated slice.
- **Impact:** 77%
  - Blast radius is broad across apps/tests/scripts; impact is understood at high level but not fully enumerated by call-site.
  - To reach >=80: generate full call-site inventories for `@acme/ui/components/cms/*` and `@acme/cms-ui/*` consumers.
  - To reach >=90: execute staged rollout rehearsal with targeted app validations (`apps/cms`, one non-CMS app, one root-test suite).
- **Delivery-Readiness:** 84%
  - Deliverable is clear (code-change), execution path clear (`/lp-do-build`), validation gate known.
  - To reach >=90: predefine exact acceptance checklist for each migration phase and add CI rule for forbidden import patterns.
- **Testability:** 72%
  - Current tests are abundant but noisy/duplicative due boundary leaks and mirrored suites.
  - To reach >=80: designate canonical test owners and add import-boundary lint rules.
  - To reach >=90: remove mirrored suites for migrated domains and add contract tests that enforce package export-only consumption.

## Planning Constraints & Notes
- Must-follow patterns:
  - Do not introduce new `packages/*/src` imports outside the owning package.
  - Do not introduce new `@cms/*` imports inside reusable packages.
  - Prefer package exports and explicit adapters over path-level cross-package linking.
- Rollout/rollback expectations:
  - Phase migration by domain slice (e.g., `media`, then `marketing`, then `page-builder`).
  - Keep temporary compatibility exports until all call-sites are migrated.
- Observability expectations:
  - Track counts of forbidden imports and mirrored test files as migration metrics.

## Suggested Task Seeds (Non-binding)
- Decide canonical ownership model (`@acme/cms-ui` recommended for CMS surface).
- Add lint rules to ban app aliases inside packages and ban direct `packages/*/src` imports outside owning package.
- Convert `cms-ui` from mirror/wrapper package into true owner for one pilot slice (`media`), with `ui` compatibility facades.
- Remove duplicated tests for migrated slice and keep single canonical suite.
- Update root/app tests to import package exports instead of source paths.
- Introduce package-quality matrix gate: each shared package must provide `build`, `lint`, `typecheck`, and targeted `test` contract.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - none
- Deliverable acceptance package (what must exist before task can be marked complete):
  - Written ownership decision and migration policy.
  - Enforced boundary rules in lint/typecheck.
  - One migrated domain slice with deduplicated tests and unchanged runtime behavior.
  - Updated validation scripts/pipeline to enforce new rules.
- Post-delivery measurement plan:
  - Track reduction in duplicate test files across `ui/cms-ui`.
  - Track count of forbidden import violations over time.
  - Track targeted test runtime reduction for affected packages.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items (if any):
  - None blocking planning; ownership decision is the first task in planning.
- Recommended next step:
  - Proceed to `/lp-do-plan` using this brief and lock canonical CMS ownership in task 1.
