---
Type: Build-Record
Plan: hbag-brandmark-particle-animation
Status: Complete
Created: 2026-02-23
Last-updated: 2026-02-23
---

# Build Record: hbag-brandmark-particle-animation

## What Was Built

- Added deterministic particle engine and text sampling modules for BrandMark:
  - `apps/caryina/src/components/BrandMark/particleEngine.ts`
  - `apps/caryina/src/components/BrandMark/sampleTextPixels.ts`
- Integrated Canvas hourglass choreography into BrandMark while preserving API/accessibility contracts:
  - `apps/caryina/src/components/BrandMark/BrandMark.tsx`
  - `apps/caryina/src/components/BrandMark/BrandMark.module.css`
- Added deterministic tests and browser visual validation:
  - `apps/caryina/src/components/BrandMark/BrandMark.particleEngine.test.ts`
  - `apps/caryina/src/components/BrandMark/BrandMark.sampleTextPixels.test.ts`
  - `apps/caryina/src/components/BrandMark/BrandMark.test.tsx`
  - `apps/caryina/e2e/logo.visual.spec.ts`
- Added benchmark/bundle evidence scripts and artifacts:
  - `docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/prototype/run-benchmark.mjs`
  - `docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/prototype/measure-bundle-delta.mjs`
  - `docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/prototype/bundle-budget-report.json`

## Validation Evidence

Validated on 2026-02-23:

- `pnpm --filter @apps/caryina lint` (pass)
- `pnpm --filter @apps/caryina typecheck` (pass)
- `pnpm --filter @apps/caryina test -- --runInBand --testPathPattern='BrandMark'` (pass)
- `pnpm --filter @apps/caryina build` (pass)
- `pnpm exec playwright test apps/caryina/e2e/logo.visual.spec.ts --reporter=list` (pass)
- `node docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/prototype/run-benchmark.mjs` (pass)
- `node docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/prototype/measure-bundle-delta.mjs` (pass)

Bundle result:
- `featureDeltaGzipBytes = 0` (`withinBudget = true`)

## Gate Decisions

- TASK-01 motion defaults approved (Option C).
- TASK-05 physical-device gate waived for this cycle by explicit operator instruction: `ok no prolems move on`.
- TASK-06 checkpoint verdict: Proceed with accepted risk.

## Open Risk

- Physical-device matrix evidence (iPhone Safari + Android Chrome) was not captured in this cycle.
- Capture procedure and template remain at:
  - `docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/real-device-validation.md`

## Next Step

`results-review.user.md` is complete and the plan is archived.
If broader rollout is planned, complete the physical-device capture matrix first.
