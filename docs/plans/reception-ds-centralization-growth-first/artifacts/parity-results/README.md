---
Type: Artifact
Status: Complete
Domain: UI
Workstream: Engineering
Created: 2026-02-23
Last-updated: 2026-02-23
Feature-Slug: reception-ds-centralization-growth-first
Task-ID: TASK-02
---

# TASK-02 Parity Harness Results

## Parity command

```bash
pnpm --filter @apps/reception exec jest --ci --runInBand --detectOpenHandles --config ./jest.config.cjs src/parity/__tests__ --updateSnapshot
pnpm --filter @apps/reception exec jest --ci --runInBand --detectOpenHandles --config ./jest.config.cjs src/parity/__tests__
```

## Locked route coverage

- `/bar` unauthenticated login state -> `apps/reception/src/parity/__tests__/login-route.parity.test.tsx`
- `/checkin` -> `apps/reception/src/parity/__tests__/checkin-route.parity.test.tsx`
- `/checkout` -> `apps/reception/src/parity/__tests__/checkout-route.parity.test.tsx`
- `/till-reconciliation` -> `apps/reception/src/parity/__tests__/till-route.parity.test.tsx`
- `/safe-management` -> `apps/reception/src/parity/__tests__/safe-route.parity.test.tsx`

## Execution evidence

- Baseline snapshot run (update mode): pass
  - Command: `pnpm --filter @apps/reception exec jest --ci --runInBand --detectOpenHandles --config ./jest.config.cjs src/parity/__tests__ --updateSnapshot`
  - Result: `5` suites passed, `10` tests passed, snapshot baseline created/updated (`5` total snapshots).
- Verification rerun (no snapshot update): pass
  - Command: `pnpm --filter @apps/reception exec jest --ci --runInBand --detectOpenHandles --config ./jest.config.cjs src/parity/__tests__`
  - Result: `5` suites passed, `10` tests passed, `5` snapshots passed (zero unexpected diffs).
- Gate checks:
  - `pnpm --filter @apps/reception typecheck` -> pass
  - `pnpm --filter @apps/reception lint` -> pass
