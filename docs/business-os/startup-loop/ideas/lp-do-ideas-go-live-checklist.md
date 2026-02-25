---
Type: Checklist
Schema: lp-do-ideas-go-live-checklist
Version: 1.0.0
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

**Evidence**: _Paste or link route_accuracy calculation here before checking_

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

**Evidence**: _Paste weekly suppression rates (week N-1 and week N) here before checking_

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

**Drill completion time**: _Record here (e.g. "12 minutes, 2026-03-15")_

---

## Section D: Code Readiness

| Item | Check |
|---|---|
| `scripts/src/startup-loop/lp-do-ideas-live.ts` created and all tests pass | `[ ]` |
| `scripts/src/startup-loop/lp-do-ideas-routing-adapter.ts` mode guard updated to accept `"live"` | `[ ]` |
| All existing tests in `lp-do-ideas-*.test.ts` still pass after adapter change | `[ ]` |
| New live-mode tests added covering `mode: live` path through orchestrator and adapter | `[ ]` |
| `scripts/src/startup-loop/lp-do-ideas-live-hook.ts` created with SIGNALS integration | `[ ]` |

---

## Section E: Artifact Readiness

| Item | Check |
|---|---|
| `docs/business-os/startup-loop/ideas/live/` directory created | `[ ]` |
| `docs/business-os/startup-loop/ideas/live/telemetry.jsonl` created (empty) | `[ ]` |
| `docs/business-os/startup-loop/ideas/live/queue-state.json` created with empty state | `[ ]` |
| `docs/business-os/startup-loop/ideas/live/standing-registry.json` created with all target artifacts and initial SHAs | `[ ]` |

---

## Section F: Policy and Governance

| Item | Check |
|---|---|
| `trial-policy-decision.md` updated: `mode: live`, version bumped to `1.1.0+`, activation date + approver recorded | `[ ]` |
| `lp-do-ideas-trial-contract.md` updated to note live mode activation and date | `[ ]` |
| `lp-do-ideas-go-live-seam.md` reviewed; all integration boundary points confirmed implemented | `[ ]` |

---

## Section G: Scope Confirmation (no-go conditions)

The following must be confirmed ABSENT before activation. If any are present, this
is an automatic no-go.

| Item (must be absent — check = confirmed absent) | Check |
|---|---|
| Any write to startup-loop stage status in the live orchestrator | `[ ]` |
| Any call to `/startup-loop advance` from within the live orchestrator | `[ ]` |
| `GATE-IDEAS-01` (hard block on live dispatch in cmd-advance) added — must NOT be present in v1 | `[ ]` |
| Live orchestrator auto-invokes `lp-do-fact-find` or `lp-do-briefing` without queue step (Option B only) | `[ ]` |

---

## Sign-Off

Activation is authorised only when all items above are checked and this section
is completed by the designated approver.

**Completed by**: _Name here_
**Date**: _YYYY-MM-DD_
**Rollback drill time**: _X minutes_
**route_accuracy at activation**: _%_
**Total dispatches at activation**: _N_

> Signature (operator confirms all checklist items are complete and activation
> criteria are met):
>
> `[ ] I confirm all items above are checked. lp-do-ideas live mode activation is authorised.`

---

## Revision History

| Version | Date | Change |
|---|---|---|
| 1.0.0 | 2026-02-24 | Initial checklist — all items unchecked (pre-activation) |
