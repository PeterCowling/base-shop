---
Type: Decision
Status: Closed
Task: TASK-01
Plan: docs/plans/lp-do-ideas-startup-loop-integration/plan.md
Decided-by: Operator
Date: 2026-02-24
---

# Trial Policy Decision: Autonomy Mode + Trigger Threshold

## Selected Policy

| Field | Value |
|---|---|
| `mode` | `trial` |
| `trigger_threshold` | `T1-conservative` |
| `invocation_policy` | `queue-with-confirmation` (Option B) |

## Decision Detail

### Autonomy Mode: Option B — Queue with Confirmation

Dispatches are enqueued and surfaced to the operator before any downstream skill
(`lp-do-fact-find` / `lp-do-briefing`) is invoked. No auto-invocation in trial mode.

**Rationale**: Controls blast radius during trial. Prevents automated skill chain
from running without operator review until routing precision is established.

**Fallback policy**: Remain on Option B unless trial KPI evidence supports escalation.

**Escalation path**: After trial review period (target: ≥14 days, ≥40 dispatches),
escalate to Option C (hybrid — auto for P1/high-confidence, queue for P2/P3)
when dispatch precision ≥80% is demonstrated. Requires an explicit policy
decision update and contract version bump.

### Trigger Threshold: T1-Conservative

A standing-artifact delta qualifies as `fact_find_ready` only when it represents
a **semantic change** to one of the following section types in a registered standing
artifact:

| Section type | Examples |
|---|---|
| ICP definition | Target customer, segment, persona, job-to-be-done |
| Positioning / value proposition | Unique angle, competitor differentiation, key message |
| Pricing / offer structure | Price point, bundle, offer mechanics, promotional structure |
| Channel strategy | Launch channel selection, channel mix, channel priorities |

All other artifact changes are classified as `logged_no_action` during trial.

**Rationale**: Minimises operator noise while capturing high-signal opportunities.
Accepted risk is under-triggering useful opportunities during initial trial period.

**Escalation path**: Widen to T2-moderate (any section-level structural change to
MARKET/SELL/PRODUCTS/LOGISTICS standing docs) once T1 false-negative rate is
measured and acceptable throughput is confirmed. Requires explicit policy decision
update before activating.

## Acceptance Criteria

- [x] `mode`: `trial`
- [x] `trigger_threshold`: `T1-conservative` — semantic ICP/positioning/pricing/channel changes only
- [x] `invocation_policy`: `queue-with-confirmation` (Option B)
- [x] Explicit rationale recorded for both decisions
- [x] Explicit escalation paths documented for both threshold and autonomy mode
