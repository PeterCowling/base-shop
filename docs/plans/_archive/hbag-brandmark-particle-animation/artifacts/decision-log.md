---
Type: Reference
Status: Active
Domain: Repo
Last-reviewed: 2026-02-23
---

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
  - `docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/prototype/hourglass-particle-prototype.html`
  - `docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/prototype/prototype.js`
  - `docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/prototype/run-benchmark.mjs`
  - `docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/prototype/benchmark-results.json`
  - `docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/prototype/benchmark-summary.md`
- Required follow-up: Real-device iPhone Safari and Android Chrome validation remains a planned execution task.

## 2026-02-23 - Motion Defaults Decision (Operator Approved)

- Decision: Approve Option C for implementation baseline.
  - Primary -> accent color drift during dissolve/settle phases.
  - Animation remains enabled across viewport sizes with adaptive particle cap.
  - Hover replay uses abbreviated variant (fine-pointer devices only).
- Decision owner: Pete (operator), confirmed via `proceed` instruction.
- Why: Preserves the brand moment on mobile while keeping density/performance controls and avoids hidden engineering assumptions.
- Implementation impact:
  - Unblocks TASK-03 integration branches and TASK-04 validation assertions.
  - Removes `Needs-Input` gate from plan execution.

## 2026-02-23 - Integrated Animation Contract Decision

- Decision: Keep DOM wordmark semantics authoritative and use Canvas as a presentation-only overlay.
- Implemented constraints:
  - Canvas element is `aria-hidden`, `role="presentation"`, and `pointer-events: none`.
  - Reduced-motion path renders immediate final state with no canvas element.
  - Hover replay is restricted to `(hover: hover) and (pointer: fine)` with a 1200ms cooldown.
  - Sampling readiness is bounded to 500ms and falls back to immediate final state when unresolved.
- Why: Preserves accessibility and interaction safety while meeting the hourglass particle narrative requirements.

## 2026-02-23 - Validation Harness Routing Decision

- Decision: Keep Jest focused on component/engine logic and run browser-level visual validation through Playwright.
- Implementation:
  - Playwright spec added at `apps/caryina/e2e/logo.visual.spec.ts`.
  - Jest scope constrained to component tests under `apps/caryina/src` to avoid cross-runner conflicts.
  - Bundle-budget measurement script added at `docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/prototype/measure-bundle-delta.mjs`.
- Why: Prevents jsdom/Playwright runner collisions and makes visual + bundle evidence reproducible in a single command path.

## 2026-02-23 - Evidence Gate Status

- Decision: Keep TASK-05 blocked until physical-device evidence is recorded; do not infer closure from emulation or automated desktop runs.
- Verified automated evidence on this checkpoint:
  - `pnpm --filter @apps/caryina lint` (pass)
  - `pnpm --filter @apps/caryina typecheck` (pass)
  - `pnpm --filter @apps/caryina test -- --runInBand --testPathPattern='BrandMark'` (pass)
  - `pnpm --filter @apps/caryina build` (pass)
  - `pnpm exec playwright test apps/caryina/e2e/logo.visual.spec.ts --reporter=list` (pass)
  - `node docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/prototype/run-benchmark.mjs` (pass)
  - `node docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/prototype/measure-bundle-delta.mjs` (pass, `featureDeltaGzipBytes=0`)
- Environment probe:
  - `adb devices` -> `command not found`
  - `xcrun xctrace list devices` -> `xctrace not available`
- Required next action: populate `docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/real-device-validation.md` using physical iPhone Safari and Android Chrome runs.
- Note: superseded for this cycle by the explicit operator waiver decision below.

## 2026-02-23 - Operator Waiver Decision (TASK-05)

- Decision: Override the physical-device hard gate for this cycle and proceed to checkpoint/closure.
- Decision owner: Pete (operator), explicit instruction captured as: `ok no prolems move on`.
- Why: Continue cycle progress despite unavailable physical-device bridge tooling in this environment.
- Scope of waiver:
  - Applies only to this cycle closeout.
  - Does not redefine the default contract; physical-device evidence remains the preferred release gate.
- Checkpoint outcome:
  - TASK-06 verdict set to `Proceed` with accepted risk.
  - TASK-07 documentation closeout completed with waiver traceability.
