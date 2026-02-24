---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: Repo
Workstream: Engineering
Created: 2026-02-23
Last-updated: 2026-02-23
Last-reviewed: 2026-02-23
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: unit-test-sufficiency-audit
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Loop-Gap-Trigger: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/unit-test-sufficiency-audit/plan.md
Business-OS-Integration: off
Business-Unit: none
Card-ID: none
artifact: fact-find
direct-inject: true
direct-inject-rationale: Operator requested a static unit-test sufficiency audit without executing tests.
Audit-Ref: working-tree
Audit-Head: b1fe18b84f1c88e059dceb9c4f6fc87745bcfcd0
---

# Unit Test Sufficiency Audit Fact-Find Brief

> ⚠️ This audit was performed against the working tree, which contains uncommitted changes in relevant paths. Results may differ from the committed state.

## Scope
### Summary
Assess current unit-test sufficiency (scope and depth) across the monorepo without running tests, and identify concrete gap areas for planning.

### Goals
- Quantify unit-test scope against executable source surface.
- Assess depth indicators from static test structure.
- Identify high-risk testing gaps with file-level evidence.

### Non-goals
- Do not execute tests.
- Do not change production or test code in this audit.
- Do not produce a full remediation plan in this artifact.

### Constraints & Assumptions
- Constraints:
  - Static analysis only (file inventory and config review).
  - E2E tests are excluded from this audit.
- Assumptions:
  - Co-located test matching (`<file>.test/spec` and `__tests__/<file>.test/spec`) is a directional proxy for unit depth, not absolute coverage.

## Evidence Audit (Current State)
### Entry Points
- `packages/config/jest.preset.cjs` - global Jest behavior and coverage trigger/threshold logic.
- `packages/config/coverage-tiers.cjs` - coverage policy tiers and package assignments.
- `scripts/validate-changes.sh` - default validation gate behavior.
- `apps/product-pipeline/jest.config.cjs` - package-specific coverage scope.
- `apps/xa-b/package.json` - package test command wiring.
- `packages/telemetry/package.json` - package test command wiring.
- `packages/theme/package.json` - package test command wiring.
- `apps/xa-drop-worker/package.json` - package test command wiring.

### Patterns & Conventions Observed
- Coverage collection is off unless `--coverage` or `JEST_FORCE_COVERAGE=1` is used.
  - Evidence: `packages/config/jest.preset.cjs:209`, `packages/config/jest.preset.cjs:212`, `packages/config/jest.preset.cjs:315`.
- Coverage thresholds are relaxed to zero for targeted runs.
  - Evidence: `packages/config/jest.preset.cjs:232`, `packages/config/jest.preset.cjs:236`, `packages/config/jest.preset.cjs:237`.
- Coverage policy defines a `MINIMAL` tier at 0% and assigns multiple runtime apps/packages to it.
  - Evidence: `packages/config/coverage-tiers.cjs:50`, `packages/config/coverage-tiers.cjs:52`, `packages/config/coverage-tiers.cjs:81`, `packages/config/coverage-tiers.cjs:84`, `packages/config/coverage-tiers.cjs:85`.
- Validation gate runs token checks, typecheck, lint, and targeted tests; it does not enforce coverage collection.
  - Evidence: `scripts/validate-changes.sh:107`, `scripts/validate-changes.sh:132`, `scripts/validate-changes.sh:175`, `scripts/validate-changes.sh:232`.

### Test Landscape
#### Test Infrastructure
- Frameworks:
  - Jest-based unit/integration tests in apps/packages/scripts.
- Command model:
  - Governed targeted runs (`test:governed`) and scoped package test scripts.
- Coverage model:
  - Tiered thresholds exist, but collection is optional and often bypassed in targeted runs.

#### Existing Test Coverage (Static Scope Signals)
Static scan basis (2026-02-23): executable source files vs non-E2E test files.

| Scope | Executable source files | Unit test files | Tests per 100 source | Source files with detected co-located test (proxy) |
|---|---:|---:|---:|---:|
| `apps/cms` | 666 | 421 | 63.2 | 32.7% |
| `apps/reception` | 644 | 338 | 52.5 | 45.3% |
| `packages/ui` | 1056 | 697 | 66.0 | 32.5% |
| `packages/platform-core` | 317 | 375 | 118.3 | 30.6% |
| `apps/prime` | 251 | 112 | 44.6 | 16.7% |
| `apps/brikette` | 766 | 161 | 21.0 | 0.4% |
| `apps/cochlearfit` | 86 | 18 | 20.9 | 0.0% |
| `packages/types` | 143 | 8 | 5.6 | 0.7% |
| `apps/xa-b` | 128 | 4 | 3.1 | 1.6% |
| `apps/product-pipeline` | 251 | 1 | 0.4 | 0.4% |

Inference: `apps/cms`, `apps/reception`, `packages/ui`, and `packages/platform-core` have relatively strong test breadth by file-count signal; `apps/product-pipeline`, `apps/xa-b`, and `packages/types` are low-breadth outliers.

#### Coverage Gaps
1. Broken package test wiring (critical)
- Four packages reference missing local Jest config files in their `test` scripts:
  - `@apps/xa-b` -> missing `apps/xa-b/jest.config.cjs`
    - Evidence: `apps/xa-b/package.json:10`
  - `@acme/telemetry` -> missing `packages/telemetry/jest.config.cjs`
    - Evidence: `packages/telemetry/package.json:15`
  - `@acme/theme` -> missing `packages/theme/jest.config.cjs`
    - Evidence: `packages/theme/package.json:15`
  - `@apps/xa-drop-worker` -> missing `apps/xa-drop-worker/jest.config.cjs`
    - Evidence: `apps/xa-drop-worker/package.json:9`
- Impact:
  - Package-local test commands are not reliably executable as configured.

2. `apps/product-pipeline` unit-test scope is extremely narrow (critical)
- Only one unit test file found:
  - `apps/product-pipeline/src/lib/pipeline/__tests__/triage.test.ts`
- Package coverage collection is explicitly constrained to a single file:
  - `apps/product-pipeline/jest.config.cjs:13`
- Impact:
  - Large app/route surface is not represented in unit tests by static scope signal.

3. `apps/xa-b` has low unit-test breadth and broken config reference (high)
- Four test files found total:
  - `apps/xa-b/src/lib/__tests__/xaImages.test.ts`
  - `apps/xa-b/src/lib/__tests__/demoData.test.ts`
  - `apps/xa-b/src/__tests__/nextConfig.security.test.ts`
  - `apps/xa-b/src/__tests__/middleware.security.test.ts`
- Combined with missing Jest config reference (`apps/xa-b/package.json:10`), test depth and reliability are both weak.

4. Coverage gate policy tolerates low/no coverage for several runtime surfaces (high)
- `MINIMAL` tier is 0%:
  - `packages/config/coverage-tiers.cjs:50`.
- Runtime packages/apps assigned to `MINIMAL` include:
  - `@apps/prime` (`packages/config/coverage-tiers.cjs:81`)
  - `@apps/cochlearfit` (`packages/config/coverage-tiers.cjs:84`)
  - `@apps/product-pipeline` (`packages/config/coverage-tiers.cjs:85`)
- Impact:
  - Coverage thresholds are not a strong backstop for these areas.

5. Low unit-depth signal in several medium/large codebases (medium)
- Static proxy shows very low co-located unit-test mapping in:
  - `apps/brikette` (0.4%)
  - `apps/cochlearfit` (0.0%)
  - `packages/types` (0.7%)
- Inference:
  - Tests likely skew toward route/integration checks in some areas; fine-grained unit seams are comparatively thin.

#### Testability Assessment
- Easy to test:
  - Pure libraries and schema/utility functions (`packages/types`, `apps/xa-b/src/lib`, `apps/product-pipeline/src/lib`).
- Hard to test:
  - Next route handlers and multi-step flow states without shared test harness utilities.
- Test seams needed:
  - Route-level helpers for `apps/product-pipeline` and `apps/xa-b`.
  - Stable package-local Jest config presence and script consistency checks.

#### Recommended Test Approach
- Unit tests for:
  - `apps/product-pipeline` route/domain helpers beyond `triage.ts`.
  - `apps/xa-b` core library modules (`xaFilters`, `xaCatalog`, `ordersStore`, `inventoryStore`).
  - `packages/types` high-change schema composition paths.
- Integration tests for:
  - Key route handlers in `apps/product-pipeline` and `apps/xa-b`.
- Contract tests for:
  - Package `test` script integrity (fail if `--config` target is missing).

## Questions
### Resolved
- Q: Are there major areas with strong test breadth by file-count signal?
  - A: Yes (`apps/cms`, `apps/reception`, `packages/ui`, `packages/platform-core`).
- Q: Are there critical structural test gaps independent of runtime behavior?
  - A: Yes (missing Jest config targets in package test scripts; extremely narrow test scope in `apps/product-pipeline`).

### Open (User Input Needed)
- Q: Should the next phase prioritize fixing test-runner integrity first (missing configs), or expanding low-breadth domain tests first?
  - Why it matters: determines whether reliability or breadth is addressed first.
  - Decision impacted: planning task sequencing.
  - Decision owner: Peter
  - Default assumption (if any) + risk: Fix runner integrity first; risk is delayed breadth gains by one cycle.

## Confidence Inputs
- Implementation: 88%
  - Evidence basis: direct file/config evidence and repository-wide static inventory.
  - What would raise this to >=90: include import-graph based coverage mapping (beyond co-location heuristics).
- Approach: 84%
  - Evidence basis: gap set contains concrete, actionable issues with clear first fixes.
  - What would raise this to >=90: explicit owner-approved prioritization between integrity and breadth tracks.
- Impact: 80%
  - Evidence basis: identified gaps are structural and likely to affect regression detection.
  - What would raise this to >=90: targeted failure-history correlation (which incidents escaped tests).
- Delivery-Readiness: 83%
  - Evidence basis: immediate gap list is plan-ready; no blocking unknowns for planning.
  - What would raise this to >=90: agreed acceptance thresholds per scope.
- Testability: 79%
  - Evidence basis: route-heavy areas need harness seams and config hardening.
  - What would raise this to >=90: reusable route test harness published for under-tested apps.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Co-location proxy understates true test coverage | Medium | Medium | Treat proxy metrics as directional; validate selected areas with import-graph mapping in planning phase. |
| Missing Jest config references remain unfixed and silently reduce package-level test confidence | High | High | Add script integrity guard and restore package-local config files or reference root config explicitly. |
| Low-breadth packages continue shipping with minimal test backstop | High | High | Add minimum test matrix and route/domain priority list in next plan. |

## Suggested Task Seeds (Non-binding)
- Add a CI/static guard that validates `package.json` test script `--config` paths exist.
- Expand `apps/product-pipeline` unit coverage from 1 to a prioritized route/domain matrix.
- Introduce `apps/xa-b` route/lib test baseline and repair local Jest config wiring.
- Review `MINIMAL` tier assignments for runtime apps and define graduation criteria to `STANDARD`.

## Evidence Gap Review
### Gaps Addressed
- Converted broad “test sufficiency” request into quantified static scope/depth signals.
- Isolated concrete structural failures (missing Jest config targets).
- Mapped under-tested scopes with prioritized severity.

### Confidence Adjustments
- Increased confidence from exploratory to planning-ready after validating config-level findings with file-path existence checks.

### Remaining Assumptions
- Co-location metric is used as a depth proxy and may miss non-co-located but valid unit coverage.
- No runtime execution was performed, so this audit does not assert pass/fail health.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None for planning; blockers apply to build execution order only.
- Recommended next step:
  - `/lp-do-plan docs/plans/unit-test-sufficiency-audit/fact-find.md`
