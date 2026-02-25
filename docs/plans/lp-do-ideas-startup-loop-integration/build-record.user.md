---
Type: Build-Record
Plan: docs/plans/lp-do-ideas-startup-loop-integration/plan.md
Feature-Slug: lp-do-ideas-startup-loop-integration
Status: Complete
Build-Date: 2026-02-24
Built-by: lp-do-build
---

# Build Record: lp-do-ideas Trial-First Integration

## What Was Built

A complete trial-first `lp-do-ideas` pipeline that processes standing-artifact deltas
and routes them to `lp-do-fact-find` or `lp-do-briefing`, with full idempotency,
telemetry, and a defined go-live activation/rollback seam.

### Deliverables

#### Policy and Contract

| Artifact | Path | Description |
|---|---|---|
| Trial policy decision | `docs/plans/lp-do-ideas-startup-loop-integration/artifacts/trial-policy-decision.md` | Operator decision: Option B (queue-with-confirmation), T1-conservative threshold, escalation paths |
| Dispatch schema | `docs/business-os/startup-loop/ideas/lp-do-ideas-dispatch.schema.json` | JSON Schema (draft-07) for dispatch.v1 packets |
| Standing registry schema | `docs/business-os/startup-loop/ideas/lp-do-ideas-standing-registry.schema.json` | Schema for registered standing artifacts |
| Trial contract | `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md` | Full mode boundary, autonomy policy, idempotency, T1 threshold table |

#### Code

| Artifact | Path | Description |
|---|---|---|
| Trial orchestrator | `scripts/src/startup-loop/lp-do-ideas-trial.ts` | Pure function: ingests delta events, emits dispatch.v1 packets, mode-locked to trial |
| Routing adapter | `scripts/src/startup-loop/lp-do-ideas-routing-adapter.ts` | Pure function: routes packets to fact-find or briefing, 10 error codes, casing normalisation |
| Trial queue + telemetry | `scripts/src/startup-loop/lp-do-ideas-trial-queue.ts` | TrialQueue class: monotonic state machine, dual-key idempotency, append-only telemetry, injectable clock |

#### Tests

| Test file | Path | Tests |
|---|---|---|
| Orchestrator tests | `scripts/src/startup-loop/__tests__/lp-do-ideas-trial.test.ts` | 27 tests — TC-01 to TC-04, 3 golden delta class fixtures |
| Routing adapter tests | `scripts/src/startup-loop/__tests__/lp-do-ideas-routing-adapter.test.ts` | 38 tests — TC-01 to TC-15, all 10 error codes |
| Queue + telemetry tests | `scripts/src/startup-loop/__tests__/lp-do-ideas-trial-queue.test.ts` | 27 tests — TC-01 to TC-04, aggregates, sort, clock injection |

**Total: 92 tests, 92 pass.**

#### Documentation

| Artifact | Path | Description |
|---|---|---|
| Routing matrix | `docs/business-os/startup-loop/ideas/lp-do-ideas-routing-matrix.md` | Operator reference: all status/route combinations, payload shapes, error code table |
| Telemetry schema | `docs/business-os/startup-loop/ideas/lp-do-ideas-telemetry.schema.md` | TelemetryRecord fields, QC-01–08 quality checks, state machine diagram |
| Skill documentation | `.claude/skills/lp-do-ideas/SKILL.md` | Invocation syntax, required inputs, T1 keyword table, output format, failure handling |
| Go-live seam | `docs/business-os/startup-loop/ideas/lp-do-ideas-go-live-seam.md` | Integration boundary points, mode-switch procedure (8 steps), no-go conditions |
| Go-live checklist | `docs/business-os/startup-loop/ideas/lp-do-ideas-go-live-checklist.md` | VC-01/02/03 gated activation checklist with sign-off section |
| Rollback playbook | `docs/business-os/startup-loop/ideas/lp-do-ideas-rollback-playbook.md` | 8-step post-activation rollback with command-level verification, pre-activation drill |

---

## Tests Run

```
Test Suites: 3 total
Tests:       92 total, 92 passed, 0 failed
```

Run via:
```bash
pnpm -w run test:governed -- jest -- \
  --config=scripts/jest.config.cjs \
  --testPathPattern="lp-do-ideas" \
  --no-coverage
```

TASK-04 and TASK-05 tests were run in a single pass (65 tests at that point).
All 27 TASK-03 orchestrator tests remained passing throughout.

---

## Validation Evidence

### TC Contracts

| Task | TC | Result |
|---|---|---|
| TASK-03 | TC-01: fixture event → deterministic dispatch_id | ✓ |
| TASK-03 | TC-02: duplicate event → idempotent suppression | ✓ |
| TASK-03 | TC-03: mode=live → explicit fail-closed error | ✓ |
| TASK-03 | TC-04: pure function — no file I/O | ✓ |
| TASK-04 | TC-01: fact_find_ready → FactFindInvocationPayload | ✓ |
| TASK-04 | TC-02: missing location_anchors → MISSING_LOCATION_ANCHORS | ✓ |
| TASK-04 | TC-03: briefing_ready → BriefingInvocationPayload | ✓ |
| TASK-04 | TC-04: all 10 error codes tested | ✓ |
| TASK-05 | TC-01: replay idempotency (dispatch_id + dedupe key) | ✓ |
| TASK-05 | TC-02: invalid packet → error state, diagnostic, no downstream | ✓ |
| TASK-05 | TC-03: monotonic state machine, append-only telemetry | ✓ |
| TASK-05 | TC-04: telemetry schema compliance for all event kinds | ✓ |

### VC Contracts (TASK-07)

| VC | Threshold | Location |
|---|---|---|
| VC-01 | Dispatch precision ≥80% / ≥14 days / ≥40 dispatches | Checklist Section A + Seam Section 6 |
| VC-02 | Suppression variance ≤±10% / ≥2 weekly samples | Checklist Section B + Seam Section 6 |
| VC-03 | Rollback drill ≤30 min / restores trial-only mode | Checklist Section C + Rollback Playbook Part 1 |

---

## Key Design Decisions

- **Option B (queue-with-confirmation)** selected for trial. No auto-invocation; operator confirms each dispatch.
- **T1-conservative threshold**: only ICP/positioning/pricing/channel semantic changes qualify as `fact_find_ready`. Other changes produce `logged_no_action`.
- **Pure function design**: all orchestrators (trial runner, routing adapter, queue) have no file I/O. Persistence is the caller's responsibility.
- **Dual-key idempotency**: duplicate suppression uses both `dispatch_id` (primary) and `(artifact_id, before_sha, after_sha)` dedupe key (secondary).
- **UTC timestamps**: `buildDispatchId` uses UTC methods throughout to prevent timezone-dependent test failures.
- **Live mode deferred**: `mode: live` is hard-rejected in all current code. Activation requires go-live checklist sign-off and explicit code changes per the seam document.

---

## Startup-Loop Runtime Impact

**Nil.** Trial mode does not mutate startup-loop stage state.

- No writes to startup-loop stage status files
- No calls to `cmd-advance` from within the pipeline
- `loop-spec.yaml` unchanged
- IDEAS stage gate (`GATE-IDEAS-01`) intentionally absent from `cmd-advance.md` in v1

---

## Next Steps (Post-Build)

1. Operator produces `results-review.user.md` after observing deployed outcomes.
2. Trial period begins: collect dispatch telemetry over ≥14 days / ≥40 dispatches.
3. After trial period, assess go-live checklist VC-01/02/03 criteria.
4. If criteria met: execute mode-switch procedure per `lp-do-ideas-go-live-seam.md`.
