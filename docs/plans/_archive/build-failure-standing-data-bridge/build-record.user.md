---
Status: Complete
Feature-Slug: build-failure-standing-data-bridge
---

# Build Record — Build-Failure Standing Data Bridge

## What Was Built

Created a build-failure bridge script (`self-evolving-from-build-failure.ts`) that reads failure signals from plan artifacts and emits `MetaObservation` entries into the self-evolving observation system. Four failure types are supported with differentiated severity: infeasible declarations (0.9), replan exhaustion (0.8), confidence regressions (0.6), and gate blocks (0.5). The bridge follows the established pattern of `self-evolving-from-build-output.ts` with fail-open/advisory semantics — bridge errors never block build flows.

Registered the bridge in `scripts/package.json`, added it to `SELF_TRIGGER_PROCESSES` in `lp-do-ideas-trial.ts` for defense-in-depth anti-loop protection, and documented invocation at three failure exit points in `lp-do-build/SKILL.md` with single-invocation-per-event semantics.

Created comprehensive unit tests covering all 7 TC contracts: 4 failure type observation construction, missing startup-state fallback, hard signature uniqueness across failure types, observation_id uniqueness across calls, edge cases, and anti-loop integration verification.

## Tests Run

- `npx tsc --noEmit --project scripts/tsconfig.json` — clean (all 3 commits)
- `npx eslint` — clean on bridge script, clean after auto-fix import sort on test file
- Unit tests created; CI validation pending (tests run in CI only per policy)

## Validation Evidence

**TASK-01 (bridge script):**
- TC-01..TC-04: 4 failure type configs with correct observation_type and severity values verified in source
- TC-05: fail-open path returns `{ ok: false }` on missing startup-state (code path verified)
- TC-06: hard_signature uses `error_or_reason_code` (differs per failure type) → distinct signatures guaranteed
- TC-07: observation_id uses `Date.now()` in hash input → per-occurrence unique

**TASK-02 (registration):**
- TC-01: `startup-loop:self-evolving-from-build-failure` script entry in package.json (verified)
- TC-02: `SELF_TRIGGER_PROCESSES` contains `"self-evolving-from-build-failure"` (verified)
- TC-03: SKILL.md contains 3 invocation references at confidence regression, infeasible declaration, and gate block exit points (verified)

**TASK-03 (tests):**
- 12 test cases across 5 describe blocks
- All 7 TC contracts from TASK-01 covered
- Anti-loop integration verified by reading live source file

## Scope Deviations

None

## Outcome Contract

- **Why:** Build failures don't propagate to Layer A standing data, risking re-attempts of previously failed approaches.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Produce a build-failure bridge script that reads failure signals from plans (Infeasible status, repeated replan cycles, gate failures) and writes observations to standing data, preventing re-attempts of failed approaches.
- **Source:** operator
