---
Type: Plan
Status: Active
Domain: Testing
Relates-to charter: CI performance
Created: 2026-01-27
Last-reviewed: 2026-01-27
Last-updated: 2026-01-27
Feature-Slug: coverage-caching
Overall-confidence: 91%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
---

# Coverage Caching Plan

## Summary

Speed up the “Package Quality Matrix” workflow (`.github/workflows/test.yml`) by leveraging Turbo **remote cache** for the “tests with coverage” step. Today the workflow runs `pnpm --filter ... test -- --coverage --coverage-dir=coverage` for *every* workspace on every push to `main` (and nightly), even when a package’s inputs have not changed. By running the test step via Turbo and tightening cache invalidation inputs, unchanged packages can become fast cache hits while preserving existing behaviour: coverage artifacts are still produced and uploaded per workspace, and coverage thresholds remain enforced by each package’s Jest config.

## Success Signals (What “Good” Looks Like)

- In `test.yml`, unchanged workspaces show Turbo **cache hits** for the “test with coverage” step.
- Coverage artifacts still upload per workspace (same locations as today: `${{ matrix.workspace }}/coverage`).
- Coverage gating behaviour is unchanged (tests still fail when a package’s configured coverage threshold is violated).
- README/docs-only changes do **not** invalidate test coverage cache keys for unaffected packages.
- Changes to shared test/coverage configuration **do** invalidate caches (e.g. `packages/config/jest.preset.cjs`, `jest.coverage.cjs`).

## Goals

- Skip re-running “test with coverage” for packages whose relevant inputs haven’t changed.
- Reduce wall-clock time for `test.yml` (main push + nightly) without weakening quality gates.
- Keep current artifact output shape (per-workspace `coverage/` folder) so downstream tooling doesn’t need to change.

## Non-goals

- Changing the tiered coverage policy (`packages/config/coverage-tiers.cjs`).
- Replacing/rewriting Jest coverage collection.
- Introducing a bespoke non-Turbo caching system (Turbo is the cache).
- Reworking the main PR CI flow (`.github/workflows/ci.yml`) (separate pipeline).

## Audit Updates (2026-01-27)

Concrete repo findings that affect correctness and cacheability:

- `test.yml` is a per-workspace matrix and currently **does not** enable Turbo remote cache (it calls `setup-repo` without `turbo-token` / `turbo-team` inputs).
- `turbo.json` defines a `test` task with `outputs: ["coverage/**"]` but has **no explicit `inputs`**, so Turbo's default hashing will invalidate on irrelevant changes and risks missing important global config changes unless we include them via `globalDependencies`.
- `packages/config/jest.preset.cjs` normalizes coverage output into the monorepo root `coverage/<sanitized-package-name>/...`, but `test.yml` passes `--coverage-dir=coverage` to force **package-local** output (`<workspace>/coverage/**`) so artifacts can be uploaded. Turbo caching for this workflow must continue to use package-local `coverage/**` so outputs match the Turbo task outputs.
- `packages/next-config` uses Node's native test runner (not Jest) and has its own `test:coverage` script. Its `test` script does not collect coverage, so it requires special handling in the workflow.
- Test file locations vary across packages: some use `src/**/*.test.ts` (colocated), others use `__tests__/`, `test/`, or root-level `*.test.ts`. Inputs must cover all patterns.
- `pnpm-lock.yaml` in `globalDependencies` ensures Turbo version changes (and all dependency changes) invalidate caches.

## Fact-Find Reference

- `docs/plans/coverage-caching-fact-find.md`

## Proposed Approach

### Option A — Keep matrix, make the test step Turbo-cached (Recommended)

- Enable Turbo remote cache for `test.yml` (pass secrets to `setup-repo`).
- Run the “test with coverage” step via `turbo run test --filter=./<workspace> -- --coverage --coverageDirectory=coverage`.
- Tighten Turbo cache invalidation by defining explicit `inputs` for `test` and adding `globalDependencies` for shared test config.

Pros: minimal workflow shape change, preserves current artifacts and isolation.
Cons: still pays matrix job overhead, but test time becomes near-zero on cache hits.

### Option B — Remove matrix for push-to-main, use `--affected` in one job (Follow-on)

- For push events, run a single job: `turbo run test --affected -- --coverage --coverageDirectory=coverage`.
- Keep nightly schedule as a full matrix (or full run) to refresh artifacts if desired.

Pros: largest CI time/cost reduction (fewer jobs).
Cons: larger workflow change; needs careful artifact strategy.

**Chosen:** Option A for this plan (safe, incremental). Capture Option B as a follow-on after Option A is stable.

## Milestones

| Milestone | Focus | Effort | CI |
|-----------|-------|--------|-----|
| 1 | Correct, stable Turbo cache keys for tests | S | **92%** |
| 2 | Turbo remote cache enabled + Turbo runs in `test.yml` | M | **90%** |
| 3 | Verification + docs/runbook for cache behaviour | S | **90%** |

## Task Summary

| Task ID | Type | Description | CI | Effort | Status | Depends on |
|---|---|---|---:|---:|---|---|
| TASK-01 | IMPLEMENT | Add explicit Turbo `inputs` + `globalDependencies` for `test` caching | 92% | S | **Complete** | - |
| TASK-02 | IMPLEMENT | Enable Turbo remote cache + run tests via Turbo in `test.yml` | 90% | M | **Complete** | TASK-01 |
| TASK-03 | IMPLEMENT | Add cache verification checklist + documentation (what invalidates cache) | 90% | S | Pending | TASK-02 |

> Effort scale: S=1, M=2, L=3

---

## Tasks

### TASK-01: Add explicit Turbo `inputs` + `globalDependencies` for `test` caching

- **Type:** IMPLEMENT
- **Affects:** `turbo.json`
- **Depends on:** -
- **Status:** Complete (2026-01-27)
- **Commits:** `0071b2ad19`
- **CI:** 92%
  - Implementation: 92% — Small JSON change; Turbo behaviour is well understood.
  - Approach: 92% — Conservative: include all code/test inputs + explicit global config dependencies.
  - Impact: 92% — Changes only cache keys; does not change what tests execute.
- **Acceptance:**
  - `turbo.json` `test` task defines an explicit `inputs` list that includes:
    - `src/**/*.ts`, `src/**/*.tsx` (source files)
    - `**/*.test.ts`, `**/*.test.tsx`, `**/*.spec.ts`, `**/*.spec.tsx` (test files in any location)
    - `test/**`, `__tests__/**` (dedicated test directories)
    - `package.json`, `tsconfig*.json`, `jest.config.*`
  - `turbo.json` includes `globalDependencies` for shared config files that must invalidate caches when changed:
    - `jest.coverage.cjs`
    - `jest.config.helpers.cjs`, `jest.moduleMapper.cjs`
    - `packages/config/jest.preset.cjs`
    - `packages/config/coverage-tiers.cjs`
    - `pnpm-lock.yaml` (covers Turbo version + all dependency changes)
  - Docs/README changes inside a workspace do **not** invalidate `test` cache keys (verified by `turbo run test --dry-run`).
  - Changes to any global dependency **do** invalidate caches (verified by `turbo run test --dry-run`).
- **Test plan:**
  - Local: Reset local cache first with `turbo daemon stop && rm -rf node_modules/.cache/turbo`
  - Local: `turbo run test --filter=@acme/config --dry-run` (baseline — expect MISS on first run)
  - Local: rerun same command (expect HIT)
  - Local: edit a README under a workspace → rerun dry-run (cache remains valid — HIT)
  - Local: touch `packages/config/jest.preset.cjs` → rerun dry-run (cache invalidates — MISS)
- **Rollout / rollback:**
  - Rollout: Merge change; observe cache hit rates in CI logs.
  - Rollback: Revert `turbo.json` (returns to default hashing).
- **Validation evidence:**
  - Typecheck: passed (pre-commit hook)
  - Lint: passed (pre-commit hook)
  - Dry-run tests:
    - Baseline hash for `@acme/config`: `734be3bcf5866959`
    - After README edit: hash unchanged (correct — docs don't invalidate)
    - After `jest.preset.cjs` edit: hash changed to `f3f75c35fa422ece` (correct — globalDependencies invalidate)
- **Implementation notes:**
  - Added `globalDependencies` array at root level of `turbo.json`
  - Added explicit `inputs` array to `test` task covering source, test files, and config
  - Test patterns include both colocated (`**/*.test.ts`) and dedicated directories (`test/**`, `__tests__/**`)

### TASK-02: Enable Turbo remote cache + run tests via Turbo in `test.yml`

- **Type:** IMPLEMENT
- **Affects:** `.github/workflows/test.yml`
- **Depends on:** TASK-01
- **Status:** Complete (2026-01-27)
- **Commits:** `e9a6cbe5bf`
- **CI:** 90%
  - Implementation: 90% — Mechanical workflow change; patterns already exist in `.github/workflows/ci.yml`.
  - Approach: 90% — Keep matrix; change only the test-with-coverage step and enable remote cache.
  - Impact: 90% — CI-only; behaviour stays the same except faster cache hits.
- **Acceptance:**
  - `setup-repo` in `test.yml` receives `turbo-token` and `turbo-team` so remote cache is available.
  - For non-`packages/next-config` workspaces, the "Test with coverage" step uses Turbo:
    - `turbo run test --filter=./${{ matrix.workspace }} -- --coverage --coverageDirectory=coverage`
  - Coverage artifacts are still uploaded from `${{ matrix.workspace }}/coverage`.
  - `packages/next-config` continues to run `test:coverage` (uses Node's native test runner, not Jest; its `test` script does not collect coverage).
  - CI logs show Turbo "cache hit" for unchanged workspaces after the first seeded run.
- **Cache warming note:**
  - The **first CI run after merge** will have 100% cache misses (expected). This seeds the remote cache.
  - Subsequent runs will show cache hits for unchanged packages.
  - The nightly scheduled run will also seed/refresh the cache.
- **Test plan:**
  - CI (branch): push two commits:
    1) a code change in one workspace (expect one cache miss, others can hit after seeding)
    2) a docs-only change (expect cache hits for all packages)
  - Verify: Check Turbo output in CI logs for "FULL TURBO" or "cache hit" messages
- **Rollout / rollback:**
  - Rollout: Merge to `main`, monitor the next scheduled run and next push-to-main run.
  - Rollback: Revert `test.yml` to the previous `pnpm --filter ... test` command.
- **Validation evidence:**
  - YAML syntax: validated with Python yaml.safe_load
  - Pre-commit hooks: typecheck and lint passed
- **Implementation notes:**
  - Added `turbo-token` and `turbo-team` inputs to setup-repo action call
  - Changed test command from `pnpm --filter` to `pnpm exec turbo run test --filter=`
  - Used `--coverageDirectory=coverage` (Jest standard) instead of `--coverage-dir=coverage`
  - `packages/next-config` special case preserved (uses Node test runner, not Jest)

### TASK-03: Add cache verification checklist + documentation (what invalidates cache)

- **Type:** IMPLEMENT
- **Affects:** `docs/test-coverage-policy.md` (or a small new doc under `docs/ci/`)
- **Depends on:** TASK-02
- **CI:** 90%
  - Implementation: 90% — Documentation-only.
  - Approach: 90% — Locks expectations so future edits don’t accidentally break caching.
  - Impact: 90% — Low risk.
- **Acceptance:**
  - Document:
    - why `test.yml` uses `--coverageDirectory=coverage` (artifact compatibility + Turbo outputs)
    - the exact list of "global dependencies" that invalidate caches
    - why `packages/next-config` is special-cased (uses Node test runner, not Jest)
    - how to validate cache behaviour locally:
      - reset local cache: `turbo daemon stop && rm -rf node_modules/.cache/turbo`
      - verify with `turbo run test --filter=<pkg> --dry-run`
    - how to interpret CI logs for cache hits/misses ("FULL TURBO", "cache hit", "cache miss")
    - expected behaviour: first run after merge = 100% misses (cache warming), subsequent runs = hits for unchanged packages
- **Test plan:**
  - N/A (docs), but ensure doc references match actual files in `turbo.json` and workflows.

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| False cache hit causes skipped tests when inputs actually changed | Keep `inputs` conservative; include shared config via `globalDependencies`; verify with dry-run. |
| Turbo remote cache unavailable | Turbo falls back to local execution; workflow remains correct (just slower). |
| Coverage artifacts move/stop uploading | Keep `--coverageDirectory=coverage` so outputs stay in `${{ matrix.workspace }}/coverage`. |
| `packages/next-config` loses coverage | Preserve special-case `test:coverage` step (do not route through `test`). |
| First run after merge shows no improvement | Expected — first run seeds the cache (100% misses). Document this so it's not mistaken for a failure. |
| Local dry-run verification gives false results due to stale cache | Document cache reset procedure: `turbo daemon stop && rm -rf node_modules/.cache/turbo`. |

## Acceptance Criteria (overall)

- [ ] Turbo remote cache enabled in `test.yml`.
- [ ] Unchanged packages hit cache for “test with coverage”.
- [ ] Coverage artifacts still upload per workspace.
- [ ] Coverage threshold failures still fail the job (no weakened gating).
- [ ] Clear documentation exists for cache invalidation and verification.

## Decision Log

- 2026-01-27: Keep the workflow matrix and introduce Turbo caching first (lower risk); consider an affected-only job later once cache correctness is proven.
- 2026-01-27: Expanded test file input patterns to cover colocated tests (`**/*.test.ts`) not just dedicated directories.
- 2026-01-27: Added cache warming expectations and local verification guidance to prevent confusion on first run.

