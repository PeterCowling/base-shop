---
Type: Build-Record
Plan: cms-webpack-build-oom
Status: Complete
Feature-Slug: cms-webpack-build-oom
Business-Unit: PLAT
Card-ID: none
Completed-date: 2026-02-23
Last-updated: 2026-02-23
artifact: build-record
---

# Build Record: cms-webpack-build-oom

## What Was Built

The plan executed TASK-01 through TASK-06 and closed the CMS OOM mitigation lane's first bounded cycle:
- captured reproducible baseline evidence for three CMS webpack probe variants,
- mapped all active CMS build-status consumers across plan/workflow surfaces,
- recorded Option A policy decision (CMS hard blocker remains active),
- implemented one bounded mitigation slice in CMS webpack config and reran the full probe matrix,
- ran a mandatory checkpoint with downstream replan, then
- synchronized dependent `turbopack-full-migration` contracts/matrix wording to the checkpointed hard-blocker posture.

All executable tasks in `docs/plans/_archive/cms-webpack-build-oom/plan.md` are now complete.

## Tests Run

- `pnpm --filter @apps/cms build` -> fail (`exit 134`, OOM/SIGABRT) in baseline and post-mitigation probes.
- `NODE_OPTIONS=--max-old-space-size=8192 pnpm --filter @apps/cms build` -> fail (`exit 134`, OOM/SIGABRT) in baseline and post-mitigation probes.
- `NEXT_BUILD_CPUS=1 NODE_OPTIONS=--max-old-space-size=8192 pnpm --filter @apps/cms build` -> fail (`exit 134`, OOM/SIGABRT) in baseline and post-mitigation probes.
- `pnpm --filter @apps/cms lint -- next.config.mjs` -> pass (warnings only).
- `pnpm --filter @apps/cms exec jest --ci --runInBand --detectOpenHandles --passWithNoTests --config ./jest.config.cjs "apps/cms/src/app/cms/shop/\\[shop\\]/settings/__tests__/useShopEditorForm.test.ts"` -> pass.
- `pnpm --filter @apps/cms test -- src/lib/__tests__/listShops.test.ts` -> pass.
- `pnpm --filter @apps/cms typecheck` -> fail with TS6305 against `packages/theme/dist/index.d.ts` mapping (recorded as pre-existing/non-task-local during TASK-04).
- `rg -n "CMS validation blocker|hard-blocker|Option A|TASK-07|TASK-08" docs/plans/turbopack-full-migration/plan.md docs/plans/turbopack-full-migration/artifacts/migration-matrix.md docs/plans/_archive/cms-webpack-build-oom/plan.md` -> pass (contract sync verification).
- `rg -n "ci.yml|cms.yml|cypress.yml" docs/plans/turbopack-full-migration/artifacts/migration-matrix.md docs/plans/_archive/cms-webpack-build-oom/artifacts/build-surface-matrix.md` -> pass (active consumer alignment verification).

## Validation Evidence

- TASK-01 evidence:
  - `docs/plans/_archive/cms-webpack-build-oom/artifacts/profiling-baseline.md`
  - `docs/plans/_archive/cms-webpack-build-oom/artifacts/raw/2026-02-23-task-01-r4/`
- TASK-02 evidence:
  - `docs/plans/_archive/cms-webpack-build-oom/artifacts/build-surface-matrix.md`
- TASK-03 evidence:
  - Decision recorded in `docs/plans/_archive/cms-webpack-build-oom/plan.md` (Option A hard blocker).
- TASK-04 evidence:
  - Post-mitigation probe data in `docs/plans/_archive/cms-webpack-build-oom/artifacts/profiling-baseline.md`
  - Raw logs in `docs/plans/_archive/cms-webpack-build-oom/artifacts/raw/2026-02-23-task-04-r1/`
- TASK-05 evidence:
  - Checkpoint/replan outcome in `docs/plans/_archive/cms-webpack-build-oom/plan.md` TASK-05 section.
- TASK-06 evidence:
  - `docs/plans/turbopack-full-migration/plan.md` (hard-blocker contract wording sync for TASK-07/TASK-08)
  - `docs/plans/turbopack-full-migration/artifacts/migration-matrix.md` (checkpoint addendum + CMS workflow-coupling alignment)
  - `docs/plans/_archive/cms-webpack-build-oom/plan.md` TASK-06 completion notes

## Scope Deviations

None.

## Pending for Archival

`docs/plans/_archive/cms-webpack-build-oom/results-review.user.md` is required before plan archival (`Status: Archived`) can proceed.

## Addendum (2026-02-23)

`docs/plans/_archive/cms-webpack-build-oom/results-review.user.md` has now been created and completed, and the plan frontmatter has been advanced to `Status: Archived`.
