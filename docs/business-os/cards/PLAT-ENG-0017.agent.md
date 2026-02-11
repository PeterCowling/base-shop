---
Type: Card
Lane: Planned
Priority: P1
Owner: Pete
ID: PLAT-ENG-0017
Title: Test Sweep Plan
Business: PLAT
Tags:
  - plan-migration
  - testing
Created: 2026-01-20T00:00:00.000Z
Updated: 2026-01-20T00:00:00.000Z
Status: Active
Last-updated: 2026-02-05
---
# Test Sweep Plan

**Source:** Migrated from `test-sweep-plan.md`


# Test Sweep Plan

## Goal
Systematically run all tests across the monorepo, fix failures, and identify opportunities to improve test breadth, depth, and quality — without triggering the resource exhaustion issues documented in `docs/testing-policy.md`.

## Constraints
- **Never run broad test commands** (`pnpm test`, `pnpm --filter @acme/ui test`)
- **Run one test file at a time** with `--runInBand` or `--maxWorkers=1`
- **Stop on first failure**, fix, then resume
- **Check for orphaned Jest processes** before starting

## Strategy: Dependency-Ordered Package Sweep

Run tests in dependency order (leaf packages first, apps last). This ensures:
1. Foundation packages are verified before dependent code
2. Failures are caught at the source, not propagated
3. Faster feedback on core logic

### Phase 1: Leaf Packages (No Internal Dependencies)

[... see full plan in docs/plans/test-sweep-plan.md]
