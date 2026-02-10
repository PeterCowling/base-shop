---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: CI/Infrastructure
Created: 2026-02-09
Last-updated: 2026-02-09
Feature-Slug: ci-integration-speed-control
Deliverable-Type: code-change
Execution-Track: code
Primary-Execution-Skill: build-feature
Supporting-Skills: re-plan, safe-commit-push-ci
Related-Plan: docs/plans/ci-integration-speed-control-plan.md
Business-Unit: PLAT
Card-ID:
---

# Integration CI Speed + Control Re-Critique — Fact-Find Brief

## Execution Profile
- Deliverable-Type: `code-change`
- Execution-Track: `code`
- Primary-Execution-Skill: `build-feature`
- Supporting-Skills: `re-plan`, `safe-commit-push-ci`

## Scope
### Summary
Re-audit the integration CI path for speed vs control tradeoffs, with explicit focus on:
- run only what changed
- keep safety controls strict
- move full-coverage work to the overnight quality lane

### Goals
- Identify current bottlenecks and false blockers in integration CI.
- Separate deterministic policy failures from infrastructure flake.
- Propose changes that reduce loop time without reducing merge safety.
- Produce planning-ready implementation tasks.

### Non-goals
- Implementing workflow changes in this fact-find step.
- Lowering quality standards or reducing required checks.
- Replacing the branch flow (`dev -> staging -> main`).

### Constraints & Assumptions
- Constraints:
  - Non-destructive git safety controls remain mandatory.
  - Integration lane should stay change-scoped.
  - Coverage-depth checks should live in nightly/manual lanes unless explicitly required.
- Assumptions:
  - GitHub-hosted runner/API throttling variance is real and ongoing.
  - Current failure-heavy baseline distorts pure runtime comparisons until deterministic failures are removed.

## Repo Audit (Current State)
### Entry points reviewed
- `.github/workflows/ci.yml`
- `.github/workflows/merge-gate.yml`
- `.github/workflows/test.yml`
- `.github/workflows/cms.yml`
- `.github/workflows/reusable-app.yml`
- `scripts/validate-changes.sh`
- `scripts/src/plans-lint.ts`
- `docs/git-safety.md`
- `docs/git-hooks.md`

### Current patterns observed
- Root integration CI already uses affected scoping for lint/typecheck/tests in `.github/workflows/ci.yml:116`, `.github/workflows/ci.yml:153`, `.github/workflows/ci.yml:172`.
- Nightly quality matrix runs coverage in `.github/workflows/test.yml:51-57`, but excludes `apps/cms` and `apps/skylar` from workspace matrix generation in `.github/workflows/test.yml:29`.
- CMS integration workflow still runs sharded tests with coverage and uploads coverage artifacts in `.github/workflows/cms.yml:103-113`.
- Multiple required workflows depend on `dorny/paths-filter@v3`: `.github/workflows/ci.yml:34`, `.github/workflows/ci.yml:189`, `.github/workflows/merge-gate.yml:31`, `.github/workflows/ci-lighthouse.yml:26`.
- Pre-push validation is range-scoped via `scripts/git-hooks/pre-push.sh:35-37`.

## Test Landscape
### Infrastructure and patterns
- CI and workflow validation relies on GitHub Actions plus script-level test coverage via targeted Jest suites and shell-script checks.
- Policy logic lives in `scripts/*` and is validated by focused tests such as `scripts/__tests__/pre-tool-use-git-safety.test.ts`.
- Integration gate behavior is enforced by workflow files in `.github/workflows/*` plus `scripts/validate-changes.sh`.

### Coverage and gaps
- Existing CI exercises lint/typecheck/test affected paths, but with noisy deterministic failures (plan-lint archive mismatch) that obscure true signal.
- Workflow change-detection depends on third-party action download availability; no fully local parity harness exists yet.
- Coverage collection responsibilities are split inconsistently between integration and nightly workflows (especially CMS).

### Testability assessment
- Testability is high for script/policy changes (can add fixture-based unit tests and shell-level dry-run validations).
- Testability is medium for workflow-behavior parity and runtime impact because some evidence must come from real GitHub Actions runs.
- Main seam: keep path-classification and lint-scope logic in repo-local scripts so they can be unit-tested outside CI.

### Recommended test approach
- Add fixture-driven tests for path-classifier parity and archive-vs-active plan-lint behavior.
- Run targeted package/script tests for changed files only (no unfiltered full `pnpm test`).
- Validate workflow syntax with `actionlint`, then verify behavior through scoped CI runs on dev branches.

### Extinct tests
- None identified in this audit; keep checking when moving coverage flags or workflow responsibilities.

## Telemetry Methodology
### Capture time
- Captured on 2026-02-09 (UTC).

### Commands used
```bash
gh run list --workflow "Core Platform CI" --limit 50 --json ...

gh run view <run-id> --json jobs
gh run view <run-id> --log-failed
gh run view <run-id> --job <job-id> --log
```

## Measured Baseline (Core Platform CI)
### Recent run health
Last 50 `Core Platform CI` runs:
- `pull_request:failure = 30`
- `push:failure = 16`
- `pull_request:cancelled = 3`
- `push:cancelled = 1`

### Runtime distribution (last 30 runs)
- Overall: avg `11.15m`, p50 `10.30m`, p90 `15.90m`, max `19.58m`
- Push runs: avg `9.68m`, p50 `8.18m`, p90 `12.02m`
- PR runs: avg `11.88m`, p50 `11.32m`, p90 `15.90m`

### Failure concentration (last 20 runs)
- `Lint`: 20 failures
- `Unit tests`: 16 failures
- `Business OS Mirror Guard`: 9 failures
- `Detect changes`: 4 failures

### Representative failed run
Run `21838129021` (staging push, 2026-02-09):
- `Detect changes` failed while fetching `dorny/paths-filter` with API throttling (429).
- `Lint` failed in `plans:lint` due archive-plan schema mismatch.
- `Unit tests` failed on timeout in `themes/[theme]/__tests__/cart-checkout-integration.test.ts`.

### Test fan-out evidence
In run `21838129021`, `Unit tests` launched `57` turbo `*:test` groups before cancellation.

### Job runtime snapshots (last 20 runs)
- Lint: avg `7.28m`, p50 `7.68m`, p90 `8.27m`
- Unit tests: avg `5.36m`, p50 `5.33m`, p90 `8.70m`

## Findings
### 1) Integration CI is blocked by plan-lint policy drift, not code correctness
- Evidence:
  - `plans:lint` failures in run `21838129021` are dominated by archive docs missing active-plan headers.
  - `scripts/src/plans-lint.ts:132-143` enforces active headers on all `Type: Plan` files.
  - Archive leniency exists only for empty active-task lists (`scripts/src/plans-lint.ts:167-191`).
- Impact:
  - Every integration run goes red on non-actionable metadata debt.
- Risk:
  - Merge signal quality is low; developer time is spent on structural noise.

### 2) `dorny/paths-filter` is an availability bottleneck in required checks
- Evidence:
  - Detect-changes failures from throttling in runs `21838129021`, `21838110903`, `21838109994`, `21827583200`.
  - Same dependency appears in root CI and merge-gate paths.
- Impact:
  - CI can fail before repository code is evaluated.
- Risk:
  - External API/rate-limit events create false red pipelines.

### 3) Integration test scripts still include coverage for major packages
- Evidence:
  - `packages/design-system/package.json:67`
  - `packages/cms-ui/package.json:137`
  - `packages/ui/package.json:318`
  - `apps/cms/package.json:12`
  - each uses `test` with `--coverage`.
- Impact:
  - `pnpm test:affected` pays coverage overhead whenever those packages are affected.
- Risk:
  - Conflicts with the intended "integration = changed-code confidence; overnight = deep coverage" operating model.

### 4) CMS integration workflow duplicates coverage work, but nightly lane currently excludes CMS
- Evidence:
  - CMS workflow runs `--coverage` + artifact upload in `.github/workflows/cms.yml:103-113`.
  - Nightly matrix excludes `apps/cms` and `apps/skylar` at `.github/workflows/test.yml:29`.
- Impact:
  - Integration lane carries CMS coverage load by default.
- Risk:
  - If coverage is removed from CMS integration without adding a nightly CMS coverage job, quality signal regresses.

### 5) Pre-push validation is safe and scoped, but test-discovery cost is high on big diffs
- Evidence:
  - `scripts/validate-changes.sh:265-289` probes related tests per source file before batched execution.
- Impact:
  - Large change sets pay repeated `jest --listTests` overhead.
- Risk:
  - Slower local push cycles even with correct scoping.

### 6) Conflict no-loss controls are strong, but conflict execution remains manual
- Evidence:
  - Safe manual merge steps documented in `docs/git-safety.md:118-153`.
  - No dedicated conflict-assist script to standardize backup/merge/verification flow.
- Impact:
  - High operator variance during merge conflict resolution.
- Risk:
  - Increased probability of slow recovery or accidental omission under pressure.

## Control Assessment
| Control | Status | Effectiveness | Notes |
|---|---|---|---|
| Non-destructive git guard + hook policy | Active | High | Strongly prevents destructive commands. |
| Writer lock enforcement | Active | High | Prevents concurrent-write corruption in shared checkout. |
| Range-scoped pre-push validation | Active | Medium-High | Correctly scoped; optimization opportunity remains. |
| Integration-vs-nightly split | Partial | Medium | Split exists, but coverage responsibilities are inconsistent. |
| External action dependency resilience | Weak | Low | Required workflows fail from remote throttling. |
| Plan lint governance | Active but mis-scoped | Low | Archive metadata debt blocks all integration runs. |

## Candidate Strategies
### Option A (Recommended): Restore deterministic integration lane first
- Scope:
  - Make plan lint archive-aware.
  - Remove coverage from integration scripts/workflows where nightly substitutes exist.
  - Add explicit nightly CMS coverage lane before removing CMS integration coverage.
- Expected impact:
  - Immediate drop in non-actionable failures; faster affected-test runs.
- Risk:
  - Requires coordinated script/workflow changes across packages.

### Option B: Remove external `paths-filter` dependency from required workflows
- Scope:
  - Replace `dorny/paths-filter` usage with repo-local change-classification scripts.
- Expected impact:
  - Eliminates throttling/download-based false failures.
- Risk:
  - Needs strict parity with existing filter semantics.

### Option C: Add dynamic sharding when affected test fan-out is high
- Scope:
  - Generate package-level test shards only when affected tasks exceed threshold.
- Expected impact:
  - Lower wall-clock on large change sets.
- Risk:
  - More workflow complexity and aggregation overhead.

### Option D: Add scripted conflict-safe merge assistant
- Scope:
  - Automate backup-branch, additive merge, lockfile regeneration, and post-merge no-loss checks.
- Expected impact:
  - Lower operator variance and faster conflict handling.
- Risk:
  - Script must stay aligned with hard-blocked command policy.

## Open Questions (Decision Needed)
- Should archive plans be exempt from active-plan header requirements, or normalized to current headers?
- Should package `test` scripts be coverage-free by default with dedicated `test:coverage` for overnight quality lanes?
- Do you want dynamic root test sharding now, or after deterministic failure classes are removed?

## Confidence Inputs (for planning)
- Implementation: 83%
- Approach: 80%
- Impact: 76%
- Delivery-Readiness: 82%
- Testability: 88%

What would raise Impact to >=90:
- 10 consecutive green integration runs after lint-scope + coverage-lane changes.
- Before/after p50 comparison for `Lint` and `Unit tests` jobs.
- Zero recurrence of path-filter throttling failure class after replacement.

## Pending Audit Work
- Validate parity for all current `dorny/paths-filter` expressions before replacement.
- Quantify package-level runtime delta from removing `--coverage` in integration scripts.
- Audit non-core app workflows (beyond CMS/Brikette/Skylar) for integration-lane coverage leakage.
