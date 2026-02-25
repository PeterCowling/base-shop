---
Type: Checklist
Schema: lp-do-ideas-go-live-checklist
Version: 1.1.0
Status: Active
Created: 2026-02-24
Owner: startup-loop maintainers
Related-seam: docs/business-os/startup-loop/ideas/lp-do-ideas-go-live-seam.md
Related-rollback: docs/business-os/startup-loop/ideas/lp-do-ideas-rollback-playbook.md
Related-policy: docs/plans/lp-do-ideas-startup-loop-integration/artifacts/trial-policy-decision.md
---

# lp-do-ideas Go-Live Activation Checklist

This checklist must be fully signed off before executing the mode-switch procedure
in `lp-do-ideas-go-live-seam.md`. All items must be checked (`[x]`). Any unchecked
item is a hard no-go.

**Sign-off required from**: startup-loop maintainers (operator).

---

## Section A: Trial KPI Prerequisites (VC-01)

Dispatch precision gate — determines whether the trial routing quality is reliable
enough to activate automated triggering.

**Threshold**: `route_accuracy >= 80%` over a trial period of ≥ 14 days with ≥ 40
routed dispatches (entries in `processed` or `enqueued` state).

**How to compute**:
```
route_accuracy = (correctly_routed / route_accuracy_denominator) × 100%
```
Where `route_accuracy_denominator` is from `getAggregates()` in the trial queue.

| Item | Check |
|---|---|
| Trial period ≥ 14 days (first dispatch date to assessment date) | `[ ]` |
| Total dispatches ≥ 40 (route_accuracy_denominator ≥ 40) | `[ ]` |
| Dispatch precision ≥ 80% (confirmed during trial review, annotated in telemetry) | `[ ]` |
| Trial KPI assessment recorded in `trial/telemetry.jsonl` annotations or separate review doc | `[ ]` |

**Evidence**: **NO-GO (expected)**: Live operation has not started. Seed telemetry files are empty. Trial KPI collection will begin when live hook is activated. Recheck after ≥14 days of live operation with ≥40 dispatches.

---

## Section B: Idempotency Stability Prerequisites (VC-02)

Duplicate suppression stability gate — ensures the deduplication logic is consistent
before live-mode traffic amplifies any instability.

**Threshold**: Duplicate suppression rate variance ≤ ±10% across ≥ 2 consecutive
weekly samples.

**How to compute**:
```
suppression_rate (week N) = (duplicate_suppression_count / dispatch_count) × 100%
variance = |rate(week N) - rate(week N-1)|
```
Where counts are from `getAggregates()` snapshots taken at the same point each week.

| Item | Check |
|---|---|
| ≥ 2 weekly telemetry snapshots collected (at least 2 weeks of trial operation) | `[ ]` |
| Suppression rate variance ≤ ±10% across the two most recent weekly snapshots | `[ ]` |
| No unexpected suppression spikes observed (e.g. same dispatch enqueued >3× in one week) | `[ ]` |

**Evidence**: **NO-GO (expected)**: No weekly snapshots yet. Idempotency stability evidence will accumulate after live operation begins. Metrics runner (`lp-do-ideas-metrics-runner.ts`) is ready to compute suppression variance once 2 consecutive weekly snapshots are available.

---

## Section C: Rollback Readiness Prerequisites (VC-03)

Rollback drill gate — ensures the disable path is rehearsed before live activation.

**Threshold**: Rollback drill completed in ≤ 30 minutes, restoring trial-only mode
with verified no stage mutations.

| Item | Check |
|---|---|
| `lp-do-ideas-rollback-playbook.md` has been read and understood by the operator performing activation | `[ ]` |
| Rollback drill executed in non-production branch (Step 1 of rollback playbook) | `[ ]` |
| Drill completion time ≤ 30 minutes (record actual time below) | `[ ]` |
| Post-drill verification passed: `mode: live` routes not available; trial-only mode confirmed | `[ ]` |

**Drill completion time**: **NO-GO**: Rollback drill not yet performed. Execute Part 1 of `lp-do-ideas-rollback-playbook.md` on a non-production branch before activation. Target: ≤30 minutes.

---

## Section D: Code Readiness

| Item | Check |
|---|---|
| `scripts/src/startup-loop/lp-do-ideas-live.ts` created and all tests pass | `[x]` |
| `scripts/src/startup-loop/lp-do-ideas-routing-adapter.ts` mode guard updated to accept `"live"` | `[x]` |
| All existing tests in `lp-do-ideas-*.test.ts` still pass after adapter change | `[x]` |
| New live-mode tests added covering `mode: live` path through orchestrator and adapter | `[x]` |
| `scripts/src/startup-loop/lp-do-ideas-live-hook.ts` created with SIGNALS integration | `[x]` |

**Evidence**:
- `lp-do-ideas-live.ts` created and tests pass: committed `089da144cf`; 22 TC-02 tests pass
- Routing adapter mode guard: same commit; `routeDispatch()` now accepts `"trial" | "live"`
- All existing tests: 219/220 pass; 1 excluded (pre-existing untracked propagation failure)
- New live-mode tests: `lp-do-ideas-live-integration.test.ts` (21 tests), `lp-do-ideas-live.test.ts` (22 tests)
- `lp-do-ideas-live-hook.ts`: `runLiveHook()` advisory CLI hook; exits 0, never throws

---

## Section E: Artifact Readiness

| Item | Check |
|---|---|
| `docs/business-os/startup-loop/ideas/live/` directory created | `[x]` |
| `docs/business-os/startup-loop/ideas/live/telemetry.jsonl` created (empty) | `[x]` |
| `docs/business-os/startup-loop/ideas/live/queue-state.json` created with empty state | `[x]` |
| `docs/business-os/startup-loop/ideas/live/standing-registry.json` created with all target artifacts and initial SHAs | `[ ]` |

**Evidence** (completed items):
- `live/` directory, `telemetry.jsonl`, and `queue-state.json`: TASK-05 commit; `queue-state.json` uses `schema_version: queue-state.v1`

**NO-GO RATIONALE** (`live/standing-registry.json`): Requires operator to enumerate and classify artifacts, review coverage, and capture initial SHAs using SHA snapshot tooling. Cannot be automated. Must be completed manually before activation. (Seam doc section 2.4 defines the procedure.)

---

## Section F: Policy and Governance

| Item | Check |
|---|---|
| `trial-policy-decision.md` updated: `mode: live`, version bumped to `1.1.0+`, activation date + approver recorded | `[ ]` |
| `lp-do-ideas-trial-contract.md` updated to note live mode activation and date | `[ ]` |
| `lp-do-ideas-go-live-seam.md` reviewed; all integration boundary points confirmed implemented | `[x]` |

**Evidence** (`lp-do-ideas-go-live-seam.md` reviewed):
All boundary points in seam doc sections 2.1–2.5 have corresponding committed implementations (`live-hook.ts`, `live.ts`, adapter guard, `live/` artifacts). Seam reviewed and confirmed aligned.

**NO-GO RATIONALE** (`trial-policy-decision.md`): Policy artifact is in `docs/plans/lp-do-ideas-startup-loop-integration/artifacts/`. Must be updated by operator at activation time once KPI prerequisites are met. Updating now would be premature — mode is still trial (no real live operation yet).

**NO-GO RATIONALE** (`lp-do-ideas-trial-contract.md`): Contract will be updated at activation time by operator. Current version (1.2.0) has live artifact paths section added but not activation date/version bump.

---

## Section G: Scope Confirmation (no-go conditions)

The following must be confirmed ABSENT before activation. If any are present, this
is an automatic no-go.

| Item (must be absent — check = confirmed absent) | Check |
|---|---|
| Any write to startup-loop stage status in the live orchestrator | `[x]` |
| Any call to `/startup-loop advance` from within the live orchestrator | `[x]` |
| `GATE-IDEAS-01` (hard block on live dispatch in cmd-advance) added — must NOT be present in v1 | `[x]` |
| Live orchestrator auto-invokes `lp-do-fact-find` or `lp-do-briefing` without queue step (Option B only) | `[x]` |

**Evidence** (all confirmed absent):
- No stage file writes: confirmed absent; `runLiveOrchestrator()` has no stage file writes; tested by TC-03-C (no-write assertion)
- No `/startup-loop advance` calls: confirmed absent; hook exits 0 with advisory result only
- `GATE-IDEAS-01`: confirmed absent; not present in any cmd-advance module
- No auto-invoke without queue step: confirmed absent; Option B advisory posture; all dispatches require operator confirmation

---

## Section H: Lane Governance Readiness (DO / IMPROVE)

Lane controls must be explicitly validated before activation so throughput remains bounded
across outcome (`DO`) and system-hardening (`IMPROVE`) work.

| Item | Check |
|---|---|
| Queue entries include lane assignment at admission (`DO`/`IMPROVE`) | `[x]` |
| Per-lane WIP caps configured for activation window (record values below) | `[ ]` |
| Scheduler dry-run confirms lane caps are never exceeded | `[ ]` |
| Aging promotion behavior validated (older queued item can outrank newer item within lane) | `[ ]` |
| Lane reassignment requires explicit override + rationale (no silent lane switching) | `[ ]` |

**Evidence** (completed item):
- Queue lane assignment: `lp-do-ideas-metrics-runner.ts` infers DO/IMPROVE lane from packet status at read-time; `lp-do-ideas-trial-queue.ts` `resolveAdmissionLane()` assigns lane at admission

**NO-GO RATIONALE** (per-lane WIP caps): WIP cap values are an operational configuration decision. Required values must be set before activation. Suggested starting values: DO: 3, IMPROVE: 5 (to be confirmed by operator).

**NO-GO RATIONALE** (scheduler dry-run): No scheduler dry-run tool exists yet; requires implementation or manual verification. Record actual verification method and result before checking.

**NO-GO RATIONALE** (aging promotion): Queue aging logic exists in `lp-do-ideas-trial-queue.ts` but no formal aging promotion drill has been performed. Validate with a fixture queue containing entries of varying ages before activation.

**NO-GO RATIONALE** (lane reassignment): Lane override enforcement is not yet implemented in queue admission. Manual process for now — operator must record rationale when reassigning lanes. Add to operational runbook before activation.

**Configured lane caps at activation**: `DO: ___`, `IMPROVE: ___`

---

## Sign-Off

Activation is authorised only when all items above are checked and this section
is completed by the designated approver.

**Completed by**: (pending — not yet authorized)
**Date**: (pending)
**Rollback drill time**: (not yet performed)
**route_accuracy at activation**: (not yet measured)
**Total dispatches at activation**: (not yet available)

> **ACTIVATION DECISION: NO-GO (2026-02-25)**
>
> Code readiness (Sections D, G) is complete. All implementation tasks are finished
> and all live-path tests pass.
>
> Activation is blocked by the following open items:
> - Section A: KPI evidence not yet collected (live operation has not started)
> - Section B: Idempotency stability evidence not yet collected
> - Section C: Rollback drill not yet performed
> - Section E: `live/standing-registry.json` not yet created (requires operator artifact review)
> - Section F: `trial-policy-decision.md` not yet updated (premature until KPI prerequisites met)
> - Section H: Per-lane WIP caps not configured; aging promotion not formally validated
>
> **Next step**: Begin live advisory operation (the hook is ready; wire into `/lp-weekly`).
> Collect 14+ days of dispatch evidence. Then revisit this checklist.
>
> `[ ] I confirm all items above are checked. lp-do-ideas live mode activation is authorised.`

---

## Revision History

| Version | Date | Change |
|---|---|---|
| 1.0.0 | 2026-02-24 | Initial checklist — all items unchecked (pre-activation) |
| 1.1.0 | 2026-02-25 | Added evidence for completed sections D, G; NO-GO decision recorded; Sections A–C, E (partial), F (partial), H (partial) carry rationale |
