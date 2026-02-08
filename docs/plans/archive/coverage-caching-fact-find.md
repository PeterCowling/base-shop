---
Type: Fact-Find
Outcome: Planning
Status: Draft
Domain: Testing
Created: 2026-01-27
Last-updated: 2026-01-27
Feature-Slug: coverage-caching
Related-Plan: docs/plans/coverage-caching-plan.md
---

# Coverage Caching Fact-Find Brief

## Scope

### Summary
Add package-level coverage caching to avoid re-collecting coverage for unchanged packages in CI, while still enforcing tiered coverage thresholds (90%/80%/0%) and flagging when new tests are needed.

### Goals
- Skip coverage collection for packages whose source and test files haven't changed
- Maintain enforcement of tiered coverage thresholds (CRITICAL: 90%, STANDARD: 80%, MINIMAL: 0%)
- Detect when coverage drops below threshold due to new code (tests needed)
- Optimize CI pipeline duration without compromising quality gates

### Non-goals
- Per-file incremental coverage (too complex, diminishing returns)
- Changing the tiered coverage policy itself
- Modifying the test sweep process (which intentionally skips coverage)

### Constraints & Assumptions
- Constraints:
  - Must integrate with existing Turbo caching infrastructure
  - Must not break the `pnpm test:coverage` workflow
  - Coverage thresholds remain enforced on every PR affecting a package
  - CI must still fail if coverage drops below threshold
- Assumptions:
  - Turbo remote cache is enabled via `TURBO_TOKEN` and `TURBO_TEAM`
  - Coverage thresholds are already correctly configured per `packages/config/coverage-tiers.cjs`

## Repo Audit (Current State)

### Entry Points
- [ci.yml](.github/workflows/ci.yml:156-176) — Main CI: runs `pnpm test:affected` (no explicit coverage collection)
- [test.yml](.github/workflows/test.yml) — "Package Quality Matrix": runs per-package `test --coverage` nightly + on-push to main
- [check-coverage.sh](scripts/check-coverage.sh) — Local coverage gate enforcement script
- [run-changed-tests.ts](scripts/src/run-changed-tests.ts) — Hash-based test caching (NOT coverage caching)

### Key Modules / Files
- [turbo.json](turbo.json:32-40) — Test task definition with `coverage/**` as outputs
- [coverage-tiers.cjs](packages/config/coverage-tiers.cjs) — Tiered threshold definitions (CRITICAL/STANDARD/MINIMAL)
- [jest.coverage.cjs](jest.coverage.cjs) — Coverage collection configuration
- `.cache/test-status.json` — Test file hash cache (16,725 entries)

### Patterns & Conventions Observed
- **Turbo output caching**: `turbo.json` defines `coverage/**` as outputs for the `test` task, meaning coverage artifacts are cached when task inputs are unchanged
- **No explicit inputs**: The `test` task has no `inputs` array, relying on Turbo's default file hashing (all files in package)
- **Hash-based caching pattern**: `run-changed-tests.ts` uses SHA-256 of file content → JSON cache, already proven for test runs
- **Tiered enforcement**: Coverage tiers are defined programmatically in `coverage-tiers.cjs` with `validateCoverage()` function

### Data & Contracts
- Types/schemas:
  - `CoverageTier`: `{ global: { lines, branches, functions, statements: number } }`
  - `ValidationResult`: `{ passed: boolean, tier: string, threshold: object, failures: string[] }`
- Persistence:
  - Coverage reports: `coverage/<package-name>/coverage-summary.json`
  - Merged coverage: `coverage/merged/coverage.json`
  - Test status cache: `.cache/test-status.json`
- API/event contracts:
  - Codecov upload: `./coverage/lcov.info` (in ci.yml)

### Dependency & Impact Map
- Upstream dependencies:
  - Turbo (build orchestration + caching)
  - Jest (coverage collection)
  - nyc (coverage merging)
- Downstream dependents:
  - CI pipelines (ci.yml, test.yml)
  - Local development (`pnpm test:coverage`)
  - Codecov integration
- Likely blast radius:
  - Low: Changes confined to CI/scripts layer
  - Medium risk: False cache hits could silently skip coverage validation

### Tests & Quality Gates
- Existing tests:
  - No tests for `run-changed-tests.ts` itself
  - No tests for `check-coverage.sh`
- Gaps:
  - No validation that coverage cache correctly invalidates
  - No integration test for CI coverage flow
- Commands/suites:
  - `pnpm test:coverage` — Full coverage run
  - `pnpm coverage:merge` — Merge coverage reports
  - `./scripts/check-coverage.sh` — Local gate

### Recent Git History (Targeted)
- `turbo.json` — Stable, no recent changes to test task
- `coverage-tiers.cjs` — Recently created (test sweep initiative)
- `run-changed-tests.ts` — Created 2026-01-24 for test sweep, actively used

## External Research (If needed)
- Turbo `inputs` configuration: Specifying explicit inputs can improve cache hit rates by excluding irrelevant files (e.g., README changes)
- Turbo `--affected` flag: Already used in `test:affected`, compares git diff to determine changed packages
- Jest `--changedSince`: Can run only tests for changed files, but doesn't help with coverage caching

## Questions

### Resolved
- Q: Does Turbo already cache coverage outputs?
  - A: Yes, `coverage/**` is in outputs, but cache key depends on ALL package files (no explicit inputs)
  - Evidence: [turbo.json:32-40](turbo.json#L32-L40)

- Q: How does `test:affected` work?
  - A: Uses Turbo's `--affected` flag which compares git state to determine changed packages
  - Evidence: `package.json` line 38: `"test:affected": "CI=true turbo run test --affected"`

- Q: Where are coverage thresholds defined?
  - A: [coverage-tiers.cjs](packages/config/coverage-tiers.cjs) with `PACKAGE_TIERS` mapping
  - Evidence: File content shows CRITICAL (90%), STANDARD (80%), MINIMAL (0%)

- Q: How does the Package Quality Matrix workflow work?
  - A: Runs per-package with `--coverage`, uploads artifacts, runs nightly + on-push to main
  - Evidence: [test.yml](.github/workflows/test.yml)

### Open (User Input Needed)
- Q: Should coverage caching apply to CI only, or also local development?
  - Why it matters: Local caching adds complexity but improves DX
  - Decision impacted: Where to store cache (Turbo remote vs local file)
  - Default assumption: CI only (simpler) + risk: developers may run full coverage unnecessarily

- Q: What should happen when a package's source files change but tests don't?
  - Why it matters: New code without tests = coverage regression
  - Decision impacted: Cache invalidation strategy
  - Default assumption: Invalidate cache on ANY source/test change (conservative) + risk: some unnecessary re-runs

## Confidence Inputs (for /plan-feature)

- **Implementation:** 85%
  - High: Clear patterns exist (run-changed-tests.ts, Turbo outputs)
  - Gap: Need to determine optimal cache invalidation strategy (source hash vs file list)

- **Approach:** 75%
  - Multiple valid approaches:
    1. **Turbo-native**: Add `inputs` to test task for better cache hits
    2. **Custom script**: Mirror run-changed-tests.ts pattern for coverage
    3. **CI paths-filter**: Skip coverage jobs for unchanged packages
  - Need user input on local vs CI-only scope

- **Impact:** 90%
  - Well-understood blast radius (CI/scripts only)
  - Low risk to runtime code
  - Coverage enforcement remains intact with proper invalidation

## Planning Constraints & Notes

- Must-follow patterns:
  - Use existing `coverage-tiers.cjs` for threshold validation
  - Follow `run-changed-tests.ts` caching pattern if creating custom script
  - Maintain compatibility with Codecov upload

- Rollout/rollback expectations:
  - Can be rolled out incrementally (CI only first)
  - Rollback: Remove caching, CI runs full coverage (safe fallback)

- Observability expectations:
  - CI should log "coverage cache hit" vs "coverage collected" per package
  - PR comments should show coverage status (existing via Codecov)

## Suggested Task Seeds (Non-binding)

1. **Turbo inputs optimization** — Add `inputs` to test task in `turbo.json` to improve cache hit rate
2. **CI paths-filter integration** — Skip coverage for unchanged packages in test.yml matrix
3. **Coverage cache validation** — Script to verify cached coverage against current thresholds
4. **Coverage regression detection** — Flag when new source files added without corresponding test coverage

## Planning Readiness

- Status: **Ready-for-planning**
- Blocking items: None (open questions have sensible defaults)
- Recommended next step: Proceed to `/plan-feature` to select approach and define tasks
