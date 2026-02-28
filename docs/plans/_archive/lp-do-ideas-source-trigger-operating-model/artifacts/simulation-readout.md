# TASK-11 Simulation Readout

Date: 2026-02-25  
Plan: `lp-do-ideas-source-trigger-operating-model`  
Checkpoint type: `E2E simulation and rollout go/no-go`

## Scope

Validate end-to-end behavior after TASK-01..TASK-10 completion:
- Happy-path source-trigger flow
- Pathological loop/fan-out suppression flow
- P1/P2/P3 cutover correctness
- Dual-key dedupe compatibility against legacy semantics
- Threshold rollup/action determinism

## Commands Executed

```bash
pnpm --filter scripts test -- \
  src/startup-loop/__tests__/lp-do-ideas-trial.test.ts \
  src/startup-loop/__tests__/lp-do-ideas-trial-queue.test.ts \
  src/startup-loop/__tests__/lp-do-ideas-metrics-rollup.test.ts \
  src/startup-loop/__tests__/lp-do-build-reflection-debt.test.ts

pnpm --filter scripts exec tsc -p tsconfig.json --noEmit

pnpm --filter scripts exec eslint \
  src/startup-loop/lp-do-ideas-trial.ts \
  src/startup-loop/lp-do-ideas-trial-queue.ts \
  src/startup-loop/lp-do-ideas-metrics-rollup.ts \
  src/startup-loop/lp-do-build-reflection-debt.ts \
  src/startup-loop/__tests__/lp-do-ideas-trial.test.ts \
  src/startup-loop/__tests__/lp-do-ideas-trial-queue.test.ts \
  src/startup-loop/__tests__/lp-do-ideas-metrics-rollup.test.ts \
  src/startup-loop/__tests__/lp-do-build-reflection-debt.test.ts
```

Results:
- Test suites: `4 passed`
- Tests: `92 passed`
- Typecheck: pass
- Lint: pass

## E2E-01 Happy Path

Assertions:
- Source delta admits exactly one eligible cluster in source-primary phases.
- Projection regeneration does not re-admit work.
- Reflection soft-gate behaves deterministically.
- No double-counting between shadow and enforced telemetry modes.

Evidence:
- `TC-05A-01` (P2/P3 source delta admission): pass
- `TC-05A-06` (P1 shadow telemetry fields): pass
- `TC-07-03` (projection-only zero admissions): pass
- `VC-09-03` (reflection debt resolves on minimum payload completion): pass
- `TC-10-04` (shadow/enforced reconciliation without double count): pass

Outcome: **Pass**

## E2E-02 Pathological Suppression

Assertions:
- Metadata-only and self-trigger non-material events do not admit.
- Cooldown and lineage caps suppress recursive chains.
- Pack-only events are blocked in source-primary phases.
- Legacy v1 dedupe still suppresses during dual-key transition.

Evidence:
- `TC-07-01` (lineage cap): pass
- `TC-07-02` (cooldown non-material suppression): pass
- `TC-07-04` (metadata-only non-material): pass
- `TC-05A-02` (pack-only blocked in P2/P3): pass
- `TC-06-04` (legacy v1 dedupe compatibility): pass

Outcome: **Pass**

## ACC/INV Pass Matrix

| Contract | Result | Evidence |
|---|---|---|
| ACC-08/10 | Pass | TC-06-01/02/04 |
| ACC-11 | Pass | TC-07-03 |
| ACC-14/15 | Pass | TC-07-04 + metadata gate tests |
| ACC-18/19 | Pass | VC-09-02/03 |
| ACC-20/21 | Pass | TC-10-01/02/04 |
| ACC-23 | Pass | E2E-01 + E2E-02 scenario execution |
| INV-01 Projection immunity | Pass | TC-05A-03, TC-07-03 |
| INV-02 Anti-self-trigger | Pass | TC-07-05 |
| INV-03 Same-origin attach | Pass | queue same-origin attach test + TC-06-01 |
| INV-04 Lineage depth cap | Pass | TC-07-01 |
| INV-05 Cooldown | Pass | TC-07-02 |
| INV-06 Materiality | Pass | TC-07-04 |
| INV-07 Fingerprint determinism | Pass | TC-06-03 + fingerprint tests |

## Threshold Outcomes

Validated via `TC-10`:
- `fan_out_admitted > 1.5` (2-cycle streak) -> deterministic action record emitted.
- `loop_incidence > 0.25` (2-cycle streak) -> deterministic action record emitted.
- `queue_age_p95_days > 21` (lane-specific) -> deterministic lane action record emitted.

## Checkpoint Replan/Sequence Review

- Completed-task evidence revalidated: yes.
- `/lp-do-replan` downstream invocation: not required (no downstream implementation tasks after TASK-11).
- `/lp-do-sequence` topology update: not required (task graph unchanged).

## Rollout Recommendation

**Go** for controlled rollout progression, with constraints:
- Keep explicit cutover phase controls (`P1` telemetry shadow, `P2/P3` source-primary enforcement).
- Keep reflection debt soft-gate active (`IMPROVE`, SLA 7 days).
- Keep threshold actions in runbook-driven operation before expanding admission intensity.

Residual risk:
- Real-world telemetry sparsity may require one calibration cycle before tightening thresholds.
