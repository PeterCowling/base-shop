---
Type: Plan
Status: Active
Domain: CI/Infrastructure
Created: 2026-01-22
Created-by: Claude Opus 4.5
Last-updated: 2026-01-22
Last-updated-by: Claude Opus 4.5
Relates-to: docs/plans/archive/ui-package-split-plan.md
Priority: P2 — Improvement
---

# CI Test Parallelization Plan

## Background

This plan was extracted from the UI Package Split Plan (`docs/plans/ui-package-split-plan.md`), which was superseded by the UI Architecture Consolidation Plan. The consolidation plan achieved the architectural goals (single source of truth in `@acme/design-system`) via a shim-based approach rather than mass import rewrites.

The original split plan's motivation included CI parallelization (running tests for `@acme/design-system`, `@acme/cms-ui`, and `@acme/ui` in parallel). This goal was not achieved by the consolidation plan and is worth evaluating independently.

## Current State

### Package Structure (achieved)
- `@acme/design-system`: 305 source files, 66 test files
- `@acme/cms-ui`: 1102 source files, 239 test files
- `@acme/ui`: 2247 source files, 489 test files

### CI Structure (current)
- Single `test` job runs `pnpm test:affected`
- Tests run sequentially, not parallelized by package
- Timeout: 20 minutes

### Test Distribution
| Package | Test Files | % of Total |
|---------|------------|------------|
| `@acme/design-system` | 66 | 8% |
| `@acme/cms-ui` | 239 | 30% |
| `@acme/ui` | 489 | 62% |
| **Total** | 794 | 100% |

## Goals

1. **Evaluate ROI**: Determine if parallel CI test jobs provide meaningful time savings
2. **Audit current CI performance**: Establish baseline metrics
3. **Implement if beneficial**: Only proceed with parallelization if the audit justifies it

## Non-Goals

- Changing the package architecture (already settled by consolidation plan)
- Removing backward-compatibility shims (they stay for stability)
- Moving tests between packages

---

## Active Tasks

### Phase 0: Audit (BLOCKING)

- [ ] **CI-PAR-01**: Measure current CI test performance
  - Status: ☐
  - Scope:
    - Run CI workflow 5 times on main branch
    - Record: total workflow time, test job time, test job CPU/memory usage
    - Identify: longest-running test files, bottlenecks
  - Definition of done:
    - Baseline metrics documented in this plan
    - Bottleneck analysis complete

- [ ] **CI-PAR-02**: Estimate parallel execution savings
  - Status: ☐
  - Scope:
    - Calculate theoretical parallel time: `max(design-system, cms-ui, ui)` vs `sum(all)`
    - Factor in job startup overhead (~30-60s per job)
    - Factor in shared dependencies (setup-repo action, node_modules)
    - Compare estimated parallel time vs current sequential time
  - Dependencies: CI-PAR-01
  - Definition of done:
    - Savings estimate documented
    - Go/no-go recommendation made

- [ ] **CI-PAR-03**: Evaluate alternatives to parallelization
  - Status: ☐
  - Scope:
    - Consider: `--shard` flag for Jest (split within single job)
    - Consider: `turbo run test` with package-level caching
    - Consider: Only running affected tests (`test:affected` already does this)
    - Compare complexity vs benefit of each approach
  - Dependencies: CI-PAR-01
  - Definition of done:
    - Alternative approaches evaluated
    - Best approach selected (may be "no change needed")

### Phase 1: Implementation (conditional)

**Only proceed if Phase 0 concludes parallelization is worthwhile.**

- [ ] **CI-PAR-04**: Add parallel test jobs to CI
  - Status: ☐
  - Scope:
    - Add `test-design-system` job
    - Add `test-cms-ui` job
    - Add `test-ui` job (or keep as `test` for domain tests)
    - Configure job dependencies correctly
  - Dependencies: CI-PAR-02 (must show > 20% time savings)
  - Definition of done:
    - Three parallel test jobs in CI
    - All tests pass
    - Measured time savings match estimate

- [ ] **CI-PAR-05**: Verify no regressions
  - Status: ☐
  - Scope:
    - Run parallel CI 5 times
    - Confirm no flaky tests introduced
    - Confirm coverage reporting still works
    - Confirm codecov aggregation across jobs
  - Dependencies: CI-PAR-04
  - Definition of done:
    - No new flaky tests
    - Coverage still reports correctly

### Phase 2: Documentation

- [ ] **CI-PAR-06**: Document CI test structure
  - Status: ☐
  - Scope:
    - Update `CONTRIBUTING.md` or CI docs with test job structure
    - Document how to run package-specific tests locally
  - Dependencies: CI-PAR-05 (if implemented) or CI-PAR-03 (if not)
  - Definition of done:
    - Docs updated

---

## Decision Criteria

**Proceed with parallelization if:**
- Current test job time > 10 minutes
- Estimated parallel time < 70% of current time (30%+ savings)
- Job startup overhead doesn't negate savings

**Do not proceed if:**
- Current test job time < 5 minutes (not worth the complexity)
- Estimated savings < 20% (complexity not justified)
- `test:affected` already provides sufficient optimization
- Turbo caching provides better ROI with less complexity

---

## Metrics (to be filled during audit)

### Baseline (CI-PAR-01)

| Metric | Value | Notes |
|--------|-------|-------|
| Total CI workflow time | TBD | |
| Test job time | TBD | |
| Longest test file | TBD | |
| Test job memory usage | TBD | |

### Estimate (CI-PAR-02)

| Metric | Value | Notes |
|--------|-------|-------|
| design-system test time | TBD | |
| cms-ui test time | TBD | |
| ui test time | TBD | |
| Job startup overhead | ~45s | Typical for actions/checkout + setup |
| Estimated parallel time | TBD | |
| Estimated savings | TBD | |

---

## Risks

| Risk | Mitigation |
|------|------------|
| Parallel jobs increase total compute cost | Monitor GitHub Actions billing |
| Codecov aggregation fails | Test coverage reporting in PR before merging |
| Flaky tests appear in parallel | Run 5x verification in CI-PAR-05 |
| Complexity not justified | Phase 0 audit provides go/no-go decision |

---

## Related

- Supersedes: `docs/plans/ui-package-split-plan.md` tasks UI-21 (parallel CI), UI-28 (CI measurement)
- Related: `docs/plans/archive/ui-architecture-consolidation-plan.md` (achieved architecture goals)
- CI workflow: `.github/workflows/ci.yml`
