---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Infra
Workstream: Engineering
Created: 2026-02-27
Last-updated: 2026-02-27
Feature-Slug: ci-only-test-execution
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-replan, ops-ship
Related-Plan: docs/plans/ci-only-test-execution/plan.md
Dispatch-ID: IDEA-DISPATCH-20260227-0034
Trigger-Source: direct-inject
Business: PLAT
Trigger-Why: Running Jest and e2e tests locally—even in governed mode—consumes 2-4 GB RAM per run and destabilises the machine during bursty multi-agent workflows. The resource governor mitigates the symptom (concurrent process count) but cannot prevent all load: the root cause is that tests run on the local machine at all.
Trigger-Intended-Outcome: type: operational | statement: Establish a policy and enforcement layer that blocks local Jest/e2e test execution via all agent-mediated invocation paths and discourages direct human invocations via policy and documentation; routes test feedback exclusively through GitHub Actions CI; and simplifies or supersedes the test-execution-resource-governor plan | source: operator
---

# CI-Only Test Execution — Fact-Find Brief

## Scope

### Summary

This brief evaluates moving all Jest and e2e test execution off the local machine and onto GitHub Actions CI. The resource governor (in progress) throttles concurrent local test runs; this initiative would eliminate local test runs entirely, reducing local execution to lint + typecheck only. The governor would be simplified from a scheduling/admission system to a hard-block rule.

### Goals

- Block local Jest and e2e test invocations via all governed shell paths (agent-bin wrappers, integrator shell, validate-changes.sh). Note: Jest is fully covered via `test:governed` intents and agent-bin wrappers. E2e (Cypress/Playwright) invocations are not currently routed through the governed runner — these are addressed by policy (humans must not invoke `cypress`, `playwright` locally) and by the fact that e2e already runs exclusively in CI. TASK-03 scope: the `BASESHOP_CI_ONLY_TESTS=1` block in `run-governed-test.sh` covers the Jest/turbo governed paths; explicit Cypress/Playwright wrapper guards are assessed as out of scope given e2e has never had a local-run pattern (no local e2e rule in testing-policy.md). Ungoverned direct-shell invocations of any test runner are addressed by policy only (see Constraints).
- Give agents and humans a clear, fast feedback loop from CI without waiting for local validation.
- Reduce or simplify the test-execution-resource-governor implementation scope.
- Update policy documents (AGENTS.md, docs/testing-policy.md) to reflect the new rule.
- Add a CI redirect message to the enforcement hook so blocked invocations produce actionable output.
- Assess whether any app-specific CI pipelines need trigger adjustments to ensure dev-branch coverage (currently some app pipelines only trigger on `main`/`staging`).

### Non-goals

- Linting and typechecking remain local — this is an explicit exclusion from the dispatch.
- Changing what tests exist, their coverage targets, or CI pass/fail thresholds.
- Replacing or modifying the CI infrastructure itself beyond what is needed to serve higher test load.
- Any changes to the Turbo Remote Cache or CI caching strategy (out of scope for this initiative).

### Constraints & Assumptions

- Constraints:
  - The branch flow is `dev → staging → main`. Agents work on `dev` and push frequently (every 2 hours or every 3 commits per AGENTS.md).
  - GitHub Actions free tier minutes apply for public/private repos; exact quota not retrievable via API for this account but personal accounts get 2,000 min/month free on private repos.
  - Pre-commit hooks must not be bypassed (`--no-verify` is prohibited). The enforcement hook must not break the pre-commit flow. Confirmed: `scripts/git-hooks/pre-commit.sh` invokes lint-staged, typecheck-staged, writer-lock, and env checks — no Jest/test invocations.
  - The resource governor plan is `Active` / `Status: Active`; any supersession must be explicit and leave the governor either updated or archived.
  - **CI coverage gap on `dev` push**: `ci.yml` (Core Platform CI) runs on all non-staging pushes but excludes paths `apps/cms/**` and `apps/skylar/**`. App-specific pipelines (`prime.yml`, `brikette.yml`) trigger on `main` and `staging` but NOT on `dev` pushes — only on pull_request events. `caryina.yml` triggers only on `main` pushes and pull_requests. This means dev-branch unit tests for prime, brikette, and caryina are only covered in CI when a PR is open, not on every dev commit. This is a gap that must be addressed in the plan — either by opening a PR for each feature branch (current practice with ship-to-staging script) or by adjusting app pipeline triggers to include `dev`.
  - **Enforcement model scope**: The agent-bin wrappers and integrator-shell env var cover all agent-mediated invocation paths. Direct ungoverned shell invocations (e.g., a human opening a terminal and running `jest` directly) are addressed by policy and documentation only — full technical enforcement of direct shell access is not achievable and not the goal.
- Assumptions:
  - The repo is private (GitHub personal account). Linux minutes cost 1× multiplier on the free tier.
  - CI already runs `pnpm test:affected` (affected-scope unit tests) on push to `dev` via `ci.yml`. This is confirmed by audit below.
  - An agent pushing to `dev` triggers CI immediately, and CI provides results within 15-40 minutes depending on the workflow.

## Outcome Contract

- **Why:** Running tests locally — even in governed mode — consumes 2-4 GB RAM per run and destabilises the machine under bursty multi-agent workflows. The resource governor targets the symptom (too many concurrent processes); this initiative targets the cause (tests run locally at all).
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Establish a CI-only test policy with local enforcement (block rule via `BASESHOP_CI_ONLY_TESTS=1` in agent shells) that blocks all agent-mediated Jest/e2e test invocations and discourages human direct-shell invocations via policy; updates AGENTS.md and docs/testing-policy.md; and marks the resource governor plan Superseded (scheduler and admission phases no longer needed).
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `AGENTS.md` (lines 97-109) — canonical testing rules for agents; says "GitHub Actions is source of truth for required tests" but does not prohibit local runs
- `docs/testing-policy.md` — governs what tests must run and how; describes governed runner, rules 1-6; does not restrict *where* tests run
- `.github/workflows/ci.yml` (job: `test`, line 374-378) — runs `pnpm test:affected` on push/PR to all branches except `staging`
- `scripts/tests/run-governed-test.sh` — canonical local test entrypoint; routes through scheduler + resource admission
- `scripts/agent-bin/npx`, `npm`, `pnpm`, `turbo` — wrappers that block ungoverned patterns; currently in hard-block mode for `npx jest`, `npm exec jest`, `pnpm exec jest`

### Key Modules / Files

- `docs/plans/test-execution-resource-governor-fact-find.md` — prior fact-find; status `Ready-for-planning`; explicitly scoped out CI adoption as "separate follow-on decision"
- `docs/plans/test-execution-resource-governor-plan.md` — `Status: Active`; 4-phase plan (Phases 0-3 already built: warn-only → hard policy → scheduler → resource admission)
- `docs/plans/test-execution-resource-governor-calibration.md` — day-zero synthetic baseline; 34 governed events across 3 classes; governor is live and collecting data
- `.github/workflows/ci.yml` — Core Platform CI; runs on push/PR to all non-staging branches; jobs: `lint`, `typecheck`, `test` (unit), `storybook-visual`, `build`, `e2e` (shop subset, conditional)
- `.github/workflows/reusable-app.yml` — per-app deploy pipeline; includes sharded Jest (up to 3 shards for Brikette)
- `.github/workflows/brikette.yml`, `prime.yml`, `caryina.yml` — app-specific pipelines that call reusable-app
- `scripts/validate-changes.sh` — local gate; defaults to lint + typecheck only; `VALIDATE_INCLUDE_TESTS=1` opts in to local tests

### Patterns & Conventions Observed

- **CI is already the test authority.** `AGENTS.md` line 98: "GitHub Actions is source of truth for required tests: rely on CI/merge-gate for test pass/fail gating." This is policy already — just not enforced as a hard local block.
- **Local tests are opt-in, not default.** `validate-changes.sh` skips tests unless `VALIDATE_INCLUDE_TESTS=1` is set. This matches the intent of CI-only: tests are already not part of the default local gate.
- **Core Platform CI runs on most dev pushes.** `ci.yml` triggers on `push` with `branches-ignore: [staging]`, so unit tests run for most `dev` pushes. Exception: `ci.yml` has `paths-ignore` for `apps/cms/**` and `apps/skylar/**` — pushes affecting only those paths skip the core CI unit test job (CMS has its own `cypress.yml`; skylar has `skylar.yml`). App-specific pipelines (`prime.yml`, `brikette.yml`) trigger on `push` only for `main`/`staging` branches, and on `pull_request` for all branches — meaning app-level tests for prime and brikette only run on `dev` when a PR is open. This is addressed explicitly in TASK-09 (CI trigger assessment).
- **Per-app pipelines add app-level unit tests.** Brikette uses 3-shard Jest in `reusable-app.yml`. Prime's `prime.yml` runs Firebase cost-gate tests. These are already CI-only.
- **The resource governor is live.** All four phases (0-3) of the governor are implemented: wrappers block `npx jest`, `npm exec jest`, `pnpm exec jest`; `run-governed-test.sh` is the enforced entrypoint; scheduler (`test-lock.sh`) and resource admission (`resource-admission.sh`) are shipped.
- **`CI=true` bypasses the scheduler/admission.** The governor explicitly exempts CI runs (`CI=true` compatibility mode). This means the governor already treats CI as a separate execution context.
- **Enforcement covers agent paths, not all human direct-shell paths.** The wrappers in `scripts/agent-bin/` intercept invocations that pass through the agent shell (where `agent-bin` precedes `node_modules/.bin` on PATH). A human who opens a plain terminal and runs `jest` or `node_modules/.bin/jest` directly can bypass these wrappers. Policy documentation is the primary control for human direct-shell invocations. This is acknowledged in scope as acceptable.

### Data & Contracts

- Types/schemas/events:
  - `.cache/test-governor/events.jsonl` — telemetry log for governed runs; 34 synthetic events captured at calibration
  - `packages/config/coverage-tiers.cjs` — coverage tier assignments and thresholds; checked by CI `check-coverage.sh`
- Persistence:
  - `.cache/test-governor-history.json` — predictor history for resource admission; per-command-class P90 peaks
- API/contracts:
  - `pnpm test:affected` — CI unit test command in `ci.yml` (runs turbo `--affected` scoped test)
  - `pnpm run test:governed -- jest -- <args>` — governed local entrypoint (currently the canonical local runner)

### Dependency & Impact Map

- Upstream dependencies:
  - `docs/testing-policy.md` — must be updated to forbid local test execution
  - `AGENTS.md` — must be updated to remove "when running tests locally" language and replace with CI-only guidance
  - `scripts/tests/run-governed-test.sh` — becomes either a hard-block shim or is superseded by a simpler block script
  - `scripts/agent-bin/npx`, `pnpm`, `npm`, `turbo` — already block ungoverned patterns; need to also block governed runner if invoked locally
- Downstream dependents:
  - All agents (Claude, Codex) reading `AGENTS.md` — their test workflow will change
  - CI workflows — absorb the test load that was previously sometimes run locally
  - `docs/plans/test-execution-resource-governor-plan.md` — needs status update (superseded or simplified)
- Likely blast radius:
  - Policy docs: AGENTS.md + docs/testing-policy.md (text rewrites, no schema changes)
  - Enforcement: `scripts/tests/run-governed-test.sh` + `scripts/validate-changes.sh` (small additions: env var check + exit)
  - Shell config: `scripts/agents/integrator-shell.sh` (add `BASESHOP_CI_ONLY_TESTS=1` export)
  - Governor plan: status update to Superseded + rationale text
  - CI workflow triggers: `prime.yml` and `brikette.yml` may need `push.branches` to include `dev` — assessment task required; this is the only potential CI workflow change
  - No changes to test files, jest configs, or package test scripts required

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (unit/integration), Cypress (CMS e2e), Playwright (xa-uploader e2e, Storybook visual)
- Commands (local, currently permitted): `pnpm run test:governed -- jest -- <args>`, `pnpm test:affected`, targeted filter commands
- CI integration: `pnpm test:affected` (ci.yml), per-app sharded Jest (reusable-app.yml), Cypress (cypress.yml), Playwright visual (ci.yml storybook-visual job)

#### Existing Test Coverage (CI-side)

| Area | Test Type | CI Workflow | Notes |
|---|---|---|---|
| Core packages + apps (all affected) | Jest unit | ci.yml `test` job | `pnpm test:affected` with turbo affected |
| Brikette | Jest unit (sharded 3×) | reusable-app.yml via brikette.yml | Related or full-suite per classification |
| Prime | Jest unit + Firebase cost gate | prime.yml | Firebase cost gate is already CI-only |
| CMS | Cypress e2e + component | cypress.yml | Separate pipeline |
| Shop (cross-app) | Cypress e2e | ci.yml `e2e` job | Conditional on path changes |
| Storybook visual | Playwright | ci.yml `storybook-visual` job | Runs after lint+typecheck |
| XA uploader | Playwright e2e | xa.yml | Separate pipeline |

All current test types already run in CI. There is no test category that currently runs exclusively locally.

#### Coverage Gaps (under CI-only policy)

- None structural — all test types are already represented in CI.
- The only "gap" under CI-only would be the absence of a local fast-feedback unit smoke check before committing. This is addressed in the open question below — the recommended approach is to block all local tests (no exception), relying on the `ops-ship` CI watch-fix loop for feedback.

## Questions

### Resolved

- Q: Does CI already run all test types that are expected to run locally?
  - A: Yes, with a nuance. `ci.yml` runs unit tests (`pnpm test:affected`), e2e (shop subset), and Storybook visual on most `dev` pushes (excluding `apps/cms/**` and `apps/skylar/**` paths). App-specific pipelines (`prime.yml`, `brikette.yml`) run additional sharded Jest tests but only trigger on push to `main`/`staging` — on `dev` they trigger via pull_request events only. Since the `ship-to-staging` script always opens a PR, tests are covered for normal agent workflows. There is no test type currently documented as local-only.
  - Evidence: `ci.yml` jobs `test`, `e2e`, `storybook-visual`; `prime.yml` push.branches: `[main, staging]`; `brikette.yml` push.branches: `[main, staging]`; `reusable-app.yml` sharded Jest

- Q: How fast is CI feedback on a `dev` push?
  - A: Observed from recent runs: Core Platform CI (unit tests + build) completes in ~25 minutes (08:38:50 → 09:03:34). Deploy Brikette (includes sharded Jest + build + deploy) completes in ~28 minutes. Deploy Prime completes in ~14 minutes. These are wall-clock times on ubuntu-latest runners. For pure unit test feedback, the `test` job in `ci.yml` runs in parallel with `lint` and `typecheck`, so first results typically appear within 15-20 minutes of push.
  - Evidence: `gh api` run history timestamps above

- Q: What does an agent do after pushing code to get test results?
  - A: The existing `ops-ship` skill already implements a CI watch-fix loop: it pushes to `dev`, watches CI via `gh run watch`, and iterates on failures. Under CI-only policy, the agent's workflow becomes: push → `gh run watch` for results → fix and re-push if tests fail. No new tooling needed; the skill already supports this.
  - Evidence: AGENTS.md line 198: "ops-ship: Ship local changes to origin/dev with hard-enforced git safety policy, integrator-shell lock/guard flow, validate-changes gating, and CI watch-fix loops until required checks pass."

- Q: Does the validate-changes.sh default local gate already skip tests?
  - A: Yes. `VALIDATE_INCLUDE_TESTS` defaults to `0`. The default gate runs lint + typecheck only. Tests require explicit opt-in. This means the current default behavior is already close to the CI-only target; the only change needed is to make the opt-in (`VALIDATE_INCLUDE_TESTS=1`) unavailable (blocked) rather than merely non-default.
  - Evidence: `scripts/validate-changes.sh` lines 20-21: `VALIDATE_INCLUDE_TESTS="${VALIDATE_INCLUDE_TESTS:-0}"`

- Q: Can the test-execution-resource-governor plan be simplified or superseded?
  - A: Yes, substantially. If no tests run locally, the scheduler (Phase 2), resource admission (Phase 3), and most of Phase 1 (leaf script migration for concurrency shaping) become unnecessary. What remains useful is the command-guard layer (the wrappers in `scripts/agent-bin/`) and the block mechanism — but these would be repurposed from "reroute to governed runner" to "block entirely with CI redirect message." The governor's telemetry infrastructure (`telemetry-log.sh`, `history-store.sh`) becomes unnecessary. The governor plan should be updated to `Status: Superseded` or reduced to a single-task "convert to hard-block shim" plan.
  - Evidence: `docs/plans/test-execution-resource-governor-plan.md` — 4-phase plan; Phases 2+3 are the scheduling/admission complexity; ci.yml already handles CI execution

- Q: Are there any tests that genuinely need to stay local?
  - A: No tests *require* local execution for correctness. However, there is a category worth considering: the Firebase cost-gate suite (`pnpm --filter @apps/prime test:firebase-cost-gate`) and the draft pipeline integration tests are developer-facing regression checks that could, in principle, run locally before committing Firebase-touching code. However: (1) these are already covered in CI (prime.yml, mcp-server tests); (2) running them locally adds the same RAM load that motivates this policy; (3) the CI feedback loop (14-25 min) is acceptable for these cases given the infrequency of Firebase-touching changes. Conclusion: no category warrants a local exception.
  - Evidence: `docs/testing-policy.md` "Prime Firebase Cost-Safety Gate" section; `prime.yml` runs on `pull_request` for all branches and push to `main`/`staging`; on bare `dev` push without PR the firebase cost gate does not run — mitigated by ship-to-staging always opening a PR; addressed in TASK-09

- Q: Do the pre-commit hooks invoke any test commands?
  - A: No — directly confirmed. `.git/hooks/pre-commit` invokes `scripts/git-hooks/block-commit-on-protected-branches.sh` then `scripts/git-hooks/pre-commit.sh`. The latter runs: `pre-commit-check-env.sh`, `require-writer-lock.sh`, `no-partially-staged.js`, `check-next-webpack-flag.mjs --staged`, `run-lint-staged.sh`, `typecheck-staged.sh`, `lint-staged-packages.sh`, `generate-process-improvements.sh`, `pnpm validate:agent-context`. No Jest or test runner invocations. Blocking local test commands will not interfere with the pre-commit hook.
  - Evidence: `/Users/petercowling/base-shop/.git/hooks/pre-commit` — read directly; `/Users/petercowling/base-shop/scripts/git-hooks/pre-commit.sh` — read and audited line by line

- Q: What is the GitHub Actions cost implication of heavier CI test load?
  - A: Marginal. All unit tests already run on every `dev` push via `pnpm test:affected` in `ci.yml`. The change to CI-only does not add new test jobs — it prevents tests from running locally, which were occasionally a *supplement* to CI, not a replacement. The only cost increase would be if engineers previously skipped pushing and only ran tests locally; under CI-only they push earlier, triggering CI sooner. This is a workflow improvement, not a cost increase. GitHub's billing API is not accessible for this account but the test job's `timeout-minutes: 40` bounds the risk. Linux runners cost $0.008/min on paid plans; on the free tier (2,000 min/month), 40-minute jobs have significant headroom unless the team is pushing very frequently.
  - Evidence: `ci.yml` line 339: `timeout-minutes: 40`; run history shows Core CI completes in ~25 min; billing API returned 404 (quota not queryable programmatically for this account type)

- Q: What AGENTS.md and testing-policy.md language needs reframing?
  - A: The following passages assume or permit local test runs and must be updated:
    - `AGENTS.md` line 99: "When running tests locally, always use targeted scope" → replace with "Do not run tests locally; push to dev and use CI"
    - `AGENTS.md` line 40-41: Commands table includes `Test (single file)` and `Test (pattern)` rows → remove or replace with CI polling commands
    - `AGENTS.md` line 53: `VALIDATE_INCLUDE_TESTS=1 bash scripts/validate-changes.sh` as an example → remove
    - `docs/testing-policy.md` Rules 1-5 describe local test execution patterns that become irrelevant (broad-test block, targeted commands, worker limits, orphan checks, stuck tests) → these rules become "blocked — use CI" with a single new Rule 1 replacement
    - `docs/testing-policy.md` "Test Scope Decision Tree" table → remove local commands, replace with "push to dev and watch CI" for all rows
    - `docs/testing-policy.md` "Reference Commands" section → remove Jest command examples, add `gh run watch` pattern
    - `docs/testing-policy.md` `VALIDATE_INCLUDE_TESTS=1` examples → remove
  - Evidence: `AGENTS.md` lines 40-43, 97-109; `docs/testing-policy.md` Rules 1-6, decision table, reference commands

- Q: What is the right enforcement mechanism?
  - A: The existing agent-bin wrappers (`npx`, `pnpm`, `npm`, `turbo`) already block ungoverned Jest invocations. Under CI-only, these wrappers need one additional rule: block the governed runner itself (`pnpm -w run test:governed`) when invoked outside CI context. The simplest approach is to add `BASESHOP_CI_ONLY_TESTS=1` awareness to the governed runner's entry point — if the env var is set (which it would be exported from `scripts/agents/integrator-shell.sh`), the runner prints a CI-redirect message and exits 1. The `VALIDATE_INCLUDE_TESTS=1` path in `validate-changes.sh` is similarly blocked. Enforced env var name throughout: `BASESHOP_CI_ONLY_TESTS` (consistent with `BASESHOP_*` namespace used by all existing governor vars). This is a small addition to existing infrastructure.
  - Evidence: `scripts/tests/run-governed-test.sh` (entry point); `scripts/agent-bin/pnpm` and `npx` (existing block patterns); `scripts/validate-changes.sh` (VALIDATE_INCLUDE_TESTS branch); BASESHOP_* env var namespace established in `scripts/tests/test-lock-config.sh`

### Open (Operator Input Required)

- Q: Should the pre-commit hook be allowed to run a fast subset of tests (e.g., test files directly adjacent to changed files, single-file, under 5 seconds)?
  - Why operator input is required: This is a genuine strategic fork. The agent's recommendation is to block all local tests including any pre-commit fast-subset, relying on the `ops-ship` CI watch-fix loop for feedback. But the operator may prefer a narrow exception for a curated "smoke" set run inside the pre-commit hook before push. This trades a small local RAM spike for faster pre-push confidence. The decision depends on operator risk appetite and workflow preference.
  - Decision impacted: Whether `run-governed-test.sh` is blocked entirely or kept as a pre-commit-only fast path
  - Decision owner: Operator
  - Default assumption (if any) + risk: Default is full block (agent recommendation). Risk of full block: agents push code with broken tests and wait 15-25 min for CI to report failure. This is acceptable per existing `ops-ship` CI watch-fix loop pattern.

## Confidence Inputs

- Implementation: 90%
  - Evidence: Enforcement path is a small wrapper modification; policy doc changes are mechanical rewrites of documented text. All CI infrastructure already exists.
  - What would raise to >=95: Operator confirms no pre-commit exception needed (closes the open question above).

- Approach: 86%
  - Evidence: AGENTS.md already declares CI as source of truth. Default local gate already skips tests. `ops-ship` already implements CI watch loop. The approach aligns with existing direction. Reduced from 88% after identifying CI trigger gap for app-specific pipelines on dev push.
  - What would raise to >=90: Confirm that GitHub Actions free-tier minutes won't be exhausted under normal dev cadence (estimated: well within 2,000 min/month; a single Core CI run is ~25 min, so 80 full runs/month before hitting limit — well above typical usage).

- Impact: 85%
  - Evidence: Eliminates the primary RAM load vector that caused the 2026-01-16 incident type. Simplifies the governor plan by removing 2 of its 4 phases.
  - What would raise to >=90: Operator confirmation that 15-25 min CI feedback is acceptable for agent workflows (currently the case given `ops-ship` already uses CI watch).

- Delivery-Readiness: 92%
  - Evidence: All file paths identified; changes are policy-doc rewrites + a small wrapper modification + governor plan status update. No new infrastructure. No risk of breaking CI.
  - What would raise to >=95: Resolution of the open question about pre-commit exception.

- Testability: 80%
  - Evidence: The enforcement block can be tested with a unit test against the wrapper scripts (already tested in the governor plan). Policy doc linting (docs:lint) can enforce "no local Jest commands" via a regex rule. Integration test: `BASESHOP_CI_ONLY_TESTS=1 pnpm -w run test:governed -- jest -- --version` — the governed runner must exit 1 before reaching Jest when the CI-only flag is active; assert non-zero exit and CI-redirect message in stderr.
  - What would raise to >=90: Add a docs lint rule that flags `npx jest`, `pnpm.*test.*--maxWorkers` in non-archive docs (governor plan Phase 4 already planned this).

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| CI feedback latency (15-25 min) frustrates rapid iteration | Medium | Low | `ops-ship` skill already normalises CI watch-fix loop; agents are designed to operate async |
| Agent pushes to `dev` more frequently, increasing CI minute consumption | Low | Low | All tests already run per push; no new test jobs added; free-tier minutes have significant headroom |
| Governor plan work is abandoned mid-completion without clean archival | Medium | Low | Explicit task in planning brief to update governor plan to Superseded with a written rationale |
| VALIDATE_INCLUDE_TESTS=1 remains accessible in docs and is used | Medium | Medium | Docs lint rule blocks this pattern in active docs; validate-changes.sh modified to reject the flag |
| Pre-commit hooks become broken if they ever called test commands | Low | Low | Pre-commit hooks do not currently invoke test commands — confirmed by `docs/git-hooks.md` reference and no test invocation in observed hook scripts |
| GitHub Actions concurrency limits delay CI feedback during peak pushes | Low | Low | `ci.yml` already uses `cancel-in-progress: true` concurrency group; this prevents pile-up |
| App-specific tests (prime, brikette) don't run on bare `dev` pushes without an open PR | Medium | Medium | These pipelines trigger on `pull_request` for all branches; the ship-to-staging script always opens a PR so this is partially mitigated; TASK-09 investigates whether trigger adjustment is needed |

## Planning Constraints & Notes

- Must-follow patterns:
  - Do not bypass pre-commit hooks (`--no-verify` prohibited per AGENTS.md).
  - Writer lock must be acquired for all file writes (integrator-shell pattern).
  - Governor plan must be explicitly marked Superseded (not silently abandoned).
  - Docs lint rules must be updated to catch raw Jest commands so new docs/plans don't reintroduce them.
- Rollout/rollback expectations:
  - Rollout: Single PR to `dev` containing policy doc updates + enforcement wrapper change.
  - Rollback: Remove `BASESHOP_CI_ONLY_TESTS` export from `scripts/agents/integrator-shell.sh`; revert docs changes.
- Observability expectations:
  - No new telemetry needed. Existing agent-bin wrapper telemetry emits bypass events. A blocked local test attempt emits a `ci-only-block` event to `.cache/test-governor/events.jsonl`.

## Suggested Task Seeds (Non-binding)

- TASK-01: Update `docs/testing-policy.md` — replace Rules 1-5 (local test execution) with a single "Tests run in CI only" rule; keep Rule 6 (mock stability) unchanged; update decision table and reference commands; update `validate-changes.sh` description to remove `VALIDATE_INCLUDE_TESTS` option
- TASK-02: Update `AGENTS.md` Testing Rules section — remove local test commands from the Commands table and Testing Rules bullet list; add a "Test feedback: push to dev and watch CI via `gh run watch`" line
- TASK-03: Modify `scripts/tests/run-governed-test.sh` to hard-block when `BASESHOP_CI_ONLY_TESTS=1` is set — print a clear redirect message pointing to `gh run watch`; exit 1
- TASK-04: Add `BASESHOP_CI_ONLY_TESTS=1` to `scripts/agents/integrator-shell.sh` and any `.envrc` / shell init that agents use — ensures the block fires automatically in all agent shells
- TASK-05: Modify `scripts/validate-changes.sh` to reject `VALIDATE_INCLUDE_TESTS=1` when `BASESHOP_CI_ONLY_TESTS=1` is active — print CI-only message and exit 1
- TASK-06: Update `docs/plans/test-execution-resource-governor-plan.md` — set `Status: Superseded`, add forward pointer to `docs/plans/ci-only-test-execution/plan.md`, write a one-paragraph rationale explaining that the CI-only policy makes the scheduler and resource admission phases unnecessary; keep Phases 0-1 artifacts as the enforcement layer (the wrappers)
- TASK-07: Add a docs lint rule to `scripts/docs-lint` (or equivalent) that fails on `npx jest`, `--maxWorkers`, `--runInBand` patterns appearing in active (non-archive, non-historical) plan and docs files — prevents future docs from encoding local test commands
- TASK-08: CHECKPOINT — verify CI pass rate and agent workflow after 3 days of CI-only operation; confirm no unintended gaps
- TASK-09: INVESTIGATE — audit `prime.yml`, `brikette.yml`, and `caryina.yml` push triggers; determine whether adding `dev` to `push.branches` is desirable or whether the existing PR-based workflow (ship-to-staging script always opens a PR) provides sufficient coverage; document the decision and implement any trigger adjustments if warranted

## Execution Routing Packet

- Primary execution skill:
  - `lp-do-build` (code track; all tasks are doc updates + script modifications)
- Supporting skills:
  - `ops-ship` (for pushing the single PR to dev and watching CI)
  - `lp-do-replan` (if TASK-03/04 integration surface proves more complex than expected)
- Deliverable acceptance package:
  - `docs/plans/ci-only-test-execution/plan.md` produced by `/lp-do-plan`
  - TASK-01 through TASK-07 implemented; TASK-08 CHECKPOINT passed; TASK-09 INVESTIGATE decision documented
  - CI green on `dev` after implementation
  - `docs/plans/test-execution-resource-governor-plan.md` marked Superseded
- Post-delivery measurement plan:
  - Monitor `.cache/test-governor/events.jsonl` for `ci-only-block` events — confirms the block fires as expected
  - Monitor AGENTS.md / testing-policy.md for agent compliance (no local test attempts) over 7 calendar days
  - No new Jest orphan incidents (baseline: 0 since governor shipped)

## Evidence Gap Review

### Gaps Addressed

- CI cycle time: confirmed from live run history (25 min for Core Platform CI, 14 min for Prime).
- Whether all test types already run in CI: confirmed by reading all workflow files.
- Whether `validate-changes.sh` already skips tests by default: confirmed by reading the script header.
- Whether governor is live and shipping: confirmed by calibration doc (34 synthetic events, all four phases implemented).
- GitHub Actions billing quota: API unavailable for this account type; assessed via workflow timeout bounds and run frequency — concluded low risk.
- Pre-commit hook test invocation: directly audited — no Jest calls; finding resolved with direct evidence.
- CI trigger coverage on `dev` (Round 1 critique finding): confirmed that `prime.yml` and `brikette.yml` push triggers are limited to `main`/`staging`; gap acknowledged, scoped to TASK-09 for assessment.
- Enforcement model scope (Round 1 critique finding): overstated claim corrected; scope now accurately described as "all agent-mediated paths"; human direct-shell invocations addressed by policy only.

### Confidence Adjustments

- Implementation confidence raised from initial estimate of 80% to 90% after confirming that the enforcement addition is minimal (env var check in existing entry point) and pre-commit hooks don't need modification.
- Approach confidence adjusted from 88% to 86% after identifying the CI trigger gap for app-specific pipelines on dev push — mitigated by ship-to-staging PR pattern but adds TASK-09 investigation scope.

### Remaining Assumptions

- GitHub personal account free-tier minutes are sufficient (2,000 min/month; estimated usage well below this based on observed run times and push frequency).
- The `integrator-shell.sh` script accepts new env vars without breaking existing agent shells — plausible given its function but not verified by reading the file (low risk, TASK-04 will confirm).
- `docs:lint` or `plans:lint` in CI can be extended to catch raw Jest command patterns — plausible given that `pnpm run docs:lint` and `pnpm run plans:lint` already run in `ci.yml` lint job.
- The `ship-to-staging` PR-based workflow adequately covers app-specific pipeline triggers for agents; TASK-09 confirms or adjusts this assumption.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none — open question (pre-commit exception) defaults to full-block which is the simpler implementation
- Recommended next step: `/lp-do-plan ci-only-test-execution --auto`
