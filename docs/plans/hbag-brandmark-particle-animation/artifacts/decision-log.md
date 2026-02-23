# Decision Log

## 2026-02-23 - Test Harness Decision

- Decision: Use app-local Jest config (`apps/caryina/jest.config.cjs`) based on the shared monorepo preset.
- Why: Matches existing app patterns in the repo and provides immediate executable coverage seams for BrandMark integration work.
- Implemented:
  - `apps/caryina/jest.config.cjs`
  - `apps/caryina/package.json` test script
  - `apps/caryina/src/components/BrandMark/BrandMark.test.tsx`
- Validation:
  - `pnpm --filter @apps/caryina test -- --runInBand --testPathPattern=BrandMark.test.tsx` (pass)
  - `pnpm --filter @apps/caryina typecheck` (pass)
  - `pnpm --filter @apps/caryina lint` (pass)

## 2026-02-23 - BOS Tracking Decision

- Decision: Keep this feature as direct-inject for this cycle (`Business-OS-Integration: off`, `Card-ID: none`).
- Why: Operator requested immediate unblock toward planning; no BOS card dependency is required to proceed with the implementation plan.
- Revisit trigger: If operator wants card-level lifecycle tracking before build execution, create/link a BOS card and flip integration on before implementation begins.

## 2026-02-23 - Prototype Evidence Decision

- Decision: Accept local emulated benchmark as sufficient evidence to unblock planning, not as final release sign-off.
- Evidence artifacts:
  - `docs/plans/hbag-brandmark-particle-animation/artifacts/prototype/hourglass-particle-prototype.html`
  - `docs/plans/hbag-brandmark-particle-animation/artifacts/prototype/prototype.js`
  - `docs/plans/hbag-brandmark-particle-animation/artifacts/prototype/run-benchmark.mjs`
  - `docs/plans/hbag-brandmark-particle-animation/artifacts/prototype/benchmark-results.json`
  - `docs/plans/hbag-brandmark-particle-animation/artifacts/prototype/benchmark-summary.md`
- Required follow-up: Real-device iPhone Safari and Android Chrome validation remains a planned execution task.
