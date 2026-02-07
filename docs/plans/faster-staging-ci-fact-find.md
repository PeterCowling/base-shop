---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: CI/Infrastructure
Created: 2026-02-07
Last-updated: 2026-02-07
Feature-Slug: faster-staging-ci
Related-Plan: docs/plans/faster-staging-ci-plan.md
Business-Unit: PLAT
Card-ID:
---

# Brikette CI Test Sharding Acceleration — Fact-Find Brief

## Scope
### Summary
Investigate why Brikette staging CI runtime has regressed (latest test step `1169.105 s`) and identify high-confidence ways to reduce runtime significantly, with sharding as the primary candidate.

### Goals
- Capture exact timing data for the latest run and recent trend.
- Identify the dominant bottlenecks and their evidence.
- Evaluate sharding and adjacent techniques with quantified impact.
- Produce planning-ready implementation seeds.

### Non-goals
- Changing CI behavior in this fact-find step.
- Relaxing quality gates without explicit policy decision.
- Solving unrelated platform-wide CI reliability issues.

### Constraints & Assumptions
- Constraints:
  - Keep validation signal quality (no silent reduction in coverage).
  - Maintain conservative behavior for uncertain classifier states.
  - Preserve deploy safety checks.
- Assumptions:
  - Brikette test suite is sharding-compatible (same as current CMS pattern).
  - GitHub-hosted runners continue to provide stable capacity for matrix jobs.

## Repo Audit (Current State)
### Entry Points
- `.github/workflows/brikette.yml` — caller workflow for Brikette staging/production deploy.
- `.github/workflows/reusable-app.yml` — contains `Lint`, `Typecheck`, `Test`, `Build`, and deploy jobs.
- `apps/brikette/package.json` — `test` command is `pnpm exec jest --ci --runInBand --passWithNoTests`.

### Key Modules / Files
- `.github/workflows/reusable-app.yml` — current sequential validation structure and classifier gating.
- `scripts/src/ci/classify-deploy-change.ts` — deploy-only classifier logic.
- `scripts/src/ci/collect-workflow-metrics.ts` — run/job duration telemetry collector.
- `.github/workflows/cms.yml` — existing in-repo Jest sharding implementation (`--shard=${{ matrix.shard }}/4`), plus cache restore.

### Patterns & Conventions Observed
- Current Brikette test execution is serialized (`--runInBand`) in CI.
- CMS already uses matrix sharding with Jest `--shard`, proving repo-level precedent.
- Deploy classifier currently controls `Lint/Typecheck/Test` execution only; `Build` still runs when workflow is triggered.

### Test Landscape
- Framework: Jest 29.7.0 (supports `--shard`).
- Current Brikette CI test command:
  - `pnpm --filter @apps/brikette test`
  - resolves to `pnpm exec jest --ci --runInBand --passWithNoTests`
- Current behavior in reusable workflow:
  - `Lint` -> `Typecheck` -> `Test` -> `Build` (sequential in one job).

## Telemetry Methodology
### Capture time
- Captured on `2026-02-07` (UTC).

### Commands used
```bash
gh run view 21782285071 --json jobs

gh api repos/PeterCowling/base-shop/actions/runs/21782285071/logs > /tmp/brikette-21782285071.zip
unzip -p /tmp/brikette-21782285071.zip 'Deploy (staging) _ Validate & build/8_Test.txt'

pnpm --filter scripts run collect-workflow-metrics -- \
  --workflow "Deploy Brikette" \
  --limit 60 \
  --branch staging \
  --event push \
  --include-jobs \
  --from "2026-01-20T00:00:00Z" \
  --to "2026-02-07T23:59:59Z"
```

## Measured Baseline
### Latest staging push run (source of `1169.105 s`)
- Workflow run: `21782285071` (`Deploy Brikette`, `staging`, `push`, `success`).
- `Validate & build` job: `27.97m`.
- `Test` step (`8_Test.txt`): `1169.105 s` (`19.49m`).
- Jest summary in log:
  - `104` suites passed, `699` tests total.
  - `Time: 1169.105 s`.

### Latest run step timings (same run)
| Step | Duration |
|---|---:|
| Lint | 1.53m |
| Typecheck | 1.72m |
| Test | 19.52m |
| Build | 3.02m |
| Deploy job | 3.08m |

Inference: test time is now the dominant runtime component (about 62% of end-to-end runtime in this run).

### Recent staging push trend (last 12 runs)
- Runs with `Test` executed (`n=7`):
  - Test step p50 `18.63m`, p90 `18.73m`, avg `18.54m`.
  - End-to-end runtime avg `31.24m`.
- Earlier runs with `Test` skipped (`n=5`):
  - End-to-end p50 `11.58m`, avg `10.55m`.

Inference: enabling full test execution adds roughly `~18.5m` and is the primary cause of the jump from ~11-12m loops to ~30m loops.

### Hotspot suites from latest test log
Top durations (seconds):
- `src/test/routes/guides/__tests__/block-template-wiring.test.tsx` — `179.948`
- `src/test/components/experiences-page.test.tsx` — `99.689`
- `src/test/content-readiness/i18n/i18n-parity-quality-audit.test.ts` — `84.736`
- `src/test/components/layout/AppLayout.i18n-preload.test.tsx` — `43.886`
- `src/test/utils/seo.test.ts` — `27.975`

These five suites alone account for `~436s` (`~7.3m`) of the `~19.5m` run.

## Sharding Analysis
### Data-driven simulation (latest run suite times)
Using latest run suite durations (`104` suites, unknown suite durations backfilled from observed total):
- 2 shards: longest shard `~584.9s` (`~9.7m`)
- 3 shards: longest shard `~390.1s` (`~6.5m`)
- 4 shards: longest shard `~294.0s` (`~4.9m`)

Interpretation:
- 3-way sharding is a strong first target (roughly 2.8-3.0x faster test wall time vs current 19.5m).
- 4-way sharding improves further but may add diminishing returns once extra setup overhead and queue time are included.

## Findings
### 1) Primary bottleneck is serialized Brikette tests
- Evidence: `apps/brikette/package.json` uses `--runInBand`; latest run test step `1169.105 s`.

### 2) Repository already has a proven sharding pattern
- Evidence: `.github/workflows/cms.yml` uses Jest `--shard` matrix (4 shards) with caching.

### 3) Latest expensive run was triggered by test/doc-only change
- Run `21782285071` changed files:
  - `apps/brikette/src/test/app/guides/guide-route-bundle-wiring.test.tsx`
  - `docs/plans/reception-stock-cash-control-plan-v2.md`
- Classifier output reason: `runtime_path_detected`; full validation ran.
- This produced a full deploy pipeline despite no runtime app code change.

### 4) Current classifier cannot skip build/deploy for test-only changes
- Classifier gates validation steps only; workflow still proceeds through build/deploy once triggered.

## Candidate Acceleration Strategies
### Option A (Recommended): Brikette test sharding in CI matrix
- Implement a Brikette-specific matrix for `Test` using Jest `--shard`.
- Start with 3 shards; reevaluate 4 after one week of telemetry.
- Expected impact:
  - Test wall time: `~19.5m` -> `~6.5m` (+setup overhead).
  - End-to-end staging loop: substantial reduction with no test-scope reduction.

### Option B: Add Jest/ts-jest cache restore for Brikette test jobs
- Mirror CMS cache strategy for `.ts-jest` and Jest cache dirs.
- Expected impact: moderate (lower transform/recompute overhead), complements sharding.

### Option C: Narrow trigger/build policy for test-only/doc-only changes
- Avoid full Brikette deploy workflow for changes that only touch tests/docs, or short-circuit before build/deploy.
- Expected impact: prevents unnecessary ~30m deploy loops on non-runtime changes.
- Risk: must preserve required validation coverage in another workflow path.

### Option D: Directly optimize the top slow suites
- Focus on top 3-5 long suites listed above.
- Expected impact: medium; useful after sharding to keep shard balance tight.
- Risk: requires per-suite profiling and likely code/test refactor work.

## Questions
### Resolved
- Q: Is `1169.105 s` real and from the latest staging run?
  - A: Yes. Extracted from run `21782285071`, step log `8_Test.txt`.

- Q: Is sharding technically available in this repo/toolchain?
  - A: Yes. Jest 29.7.0 supports `--shard`; CMS workflow already uses it.

### Open (User Input Needed)
- Q: Preferred initial shard count for Brikette (`3` recommended, or `4`)?
  - Why it matters: controls speed vs operational complexity/overhead.
  - Decision impacted: implementation shape in workflow matrix.

- Q: Should test-only/doc-only Brikette changes bypass deploy workflow entirely?
  - Why it matters: can eliminate expensive no-op deploy loops.
  - Decision impacted: workflow trigger/path policy and guardrail design.
  - Default recommendation: yes, if equivalent validation remains enforced elsewhere.

## Confidence Inputs (for /plan-feature)
- **Implementation:** 90%
  - CI mechanics are straightforward and already proven in `.github/workflows/cms.yml`.
- **Approach:** 87%
  - Sharding provides large speed gains without dropping test coverage.
  - Remaining policy choice: trigger behavior for test-only/doc-only changes.
- **Impact:** 84%
  - Changes touch central workflow behavior and require careful guardrail checks.
- **Testability:** 90%
  - Easy to validate with controlled CI runs and before/after telemetry script.

What would raise all dimensions to >=90:
- Run two controlled staging probes:
  - runtime-heavy change
  - test-only/doc-only change
- Capture before/after timings with `collect-workflow-metrics`.
- Confirm no reliability regression over at least 10 consecutive staging runs.

## Planning Constraints & Notes
- Must-follow patterns:
  - Use existing CMS sharding pattern for consistency.
  - Keep conservative fallback behavior on classifier uncertainty.
- Rollout/rollback:
  - Rollout behind a scoped Brikette-only path first.
  - Roll back by reverting workflow matrix and test command changes.
- Observability:
  - Keep run-level step timing logging and compare p50/p90 weekly.

## Suggested Task Seeds (Non-binding)
- Add Brikette CI test matrix (3 shards) in workflow, using Jest `--shard`.
- Add Brikette Jest cache restore keys in CI.
- Add telemetry checkpoint job that records `Test` step p50/p90 weekly.
- Add policy gate for test-only/doc-only Brikette changes (skip deploy path or short-circuit build/deploy).
- Profile and optimize top 5 slow Brikette test suites.

## Post-change Telemetry Gate (TASK-04)
### Gate command set
```bash
pnpm --filter scripts run collect-workflow-metrics -- \
  --workflow "Deploy Brikette" \
  --limit 60 \
  --branch staging \
  --event push \
  --include-jobs \
  --from "2026-01-20T00:00:00Z" \
  --to "2026-02-07T23:59:59Z"
```

```bash
# Test-step p50/p90 extractor (executed from repo root)
node - <<'NODE'
const { execSync } = require('child_process');
const runs = JSON.parse(execSync(
  "gh run list --workflow 'Deploy Brikette' --branch staging --event push --limit 12 --json databaseId",
  { encoding: 'utf8' },
));
const values = [];
for (const run of runs) {
  const detail = JSON.parse(execSync(`gh run view ${run.databaseId} --json jobs`, { encoding: 'utf8' }));
  const validate = detail.jobs.find((job) => job.name === 'Deploy (staging) / Validate & build');
  if (!validate) continue;
  const test = validate.steps.find((step) => step.name === 'Test');
  if (!test || !['success', 'failure'].includes(test.conclusion)) continue;
  values.push((Date.parse(test.completedAt) - Date.parse(test.startedAt)) / 60000);
}
values.sort((a, b) => a - b);
const pct = (arr, q) => arr[Math.floor((arr.length - 1) * q)];
console.log(JSON.stringify({
  count: values.length,
  p50: pct(values, 0.5),
  p90: pct(values, 0.9),
  avg: values.reduce((s, v) => s + v, 0) / values.length,
}, null, 2));
NODE
```

### Acceptance checks
- Target A: `Test` step p50 `<=8.0m` over a post-change staging push window (`>=10` runs).
- Target B: `Validate & build` p50 decreases materially from pre-change baseline (`26.225m` in the 2026-02-07 snapshot).
- Target C: End-to-end run p50 decreases materially from pre-change baseline (`28.033m` in the 2026-02-07 snapshot).

### Current snapshot (pre-sharding baseline, captured 2026-02-07)
- Staging push runs in window: `10`
- Workflow p50: `28.03m`
- Validate & build p50: `26.23m`
- Test step p50 (executed test runs only, `n=7`): `18.63m`
- Test step p90: `18.73m`
- Target A status today: `FAIL` (expected until sharding is active in CI)

## Planning Readiness
- Status: **Ready-for-planning**
- Blocking items:
  - Choose initial shard count (`3` vs `4`).
  - Confirm deploy policy for test-only/doc-only Brikette changes.
- Recommended next step:
  - Proceed to `/plan-feature` for implementation sequencing.
