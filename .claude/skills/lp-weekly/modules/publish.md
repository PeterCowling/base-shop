# publish — `/lp-weekly` Module 3

Emits the additive S10 weekly packet, updates the latest pointer, and records final lane statuses. This is the final module in the `/lp-weekly` sequence. It does NOT replace or modify canonical S10 artifacts — it creates an additive cross-artifact linking document.

## Inputs (from orchestrate module)

| Input | Source |
|---|---|
| `week_key` | preflight.md output |
| `biz` | invocation parameter |
| `as_of_date` | invocation parameter |
| `preflight_status` | preflight.md output |
| `missing_inputs` | preflight.md output |
| `lane_a_status` | orchestrate.md output |
| `lane_b_status` | orchestrate.md output |
| `lane_c_status` | orchestrate.md output |
| `kpcs_decision_ref` | orchestrate.md output |
| `signal_review_ref` | orchestrate.md output |
| `feedback_audit_ref` | orchestrate.md output |
| `measurement_summary` | orchestrate.md output |
| `rem_delta` | orchestrate.md output |
| `experiment_portfolio_summary` | orchestrate.md output |
| `next_cycle_backlog_delta` | orchestrate.md output |

## Packet Path

```
docs/business-os/strategy/<BIZ>/s10-weekly-packet-<YYYY-Www>.md
```

This path is fixed per week key. On rerun: overwrite in-place. No version-suffix copies. Git history provides prior state.

## Steps

### Step 6.1 — Construct packet content

Assemble the weekly packet document using the required sections below. Do not omit any required section even if its value is `null`, `restricted`, or `pending` — all sections must be present for auditability.

### Step 6.2 — Write packet file

Write to the fixed packet path, overwriting any prior content for this week key.

If an existing packet is found (idempotency rerun): emit advisory `Overwriting existing packet for week <week_key>. Prior content replaced per idempotency policy.`

### Step 6.3 — Update latest pointer

Write a stable pointer to the most recent weekly packet:

```
docs/business-os/strategy/<BIZ>/s10-weekly-packet-latest.md
```

Content of the pointer file:
```markdown
---
pointer: true
biz: <BIZ>
week_key: <YYYY-Www>
as_of_date: <YYYY-MM-DD>
packet_path: docs/business-os/strategy/<BIZ>/s10-weekly-packet-<YYYY-Www>.md
updated: <YYYY-MM-DD>
---

# Latest S10 Weekly Packet Pointer

Latest packet: [<YYYY-Www>](./s10-weekly-packet-<YYYY-Www>.md)
```

Overwrite this pointer unconditionally on every publish.

### Step 6.4 — Emit completion summary

Print a completion summary to the operator:

```
/lp-weekly complete
biz: <BIZ>
week_key: <YYYY-Www>
preflight_status: ready | restricted
lane_a: complete | incomplete
lane_b: ready | restricted
lane_c: complete | carry-forward
packet: docs/business-os/strategy/<BIZ>/s10-weekly-packet-<YYYY-Www>.md
latest_pointer: docs/business-os/strategy/<BIZ>/s10-weekly-packet-latest.md
kpcs_decision_ref: <path or pending>
signal_review_ref: <path or null>
unresolved_rem_count: <N>
next_experiment_backlog_delta: <+N added, +N carried>
```

## Required Packet Sections

The weekly packet MUST contain all of the following sections:

```markdown
---
type: s10-weekly-packet
biz: <BIZ>
week_key: <YYYY-Www>
as_of_date: <YYYY-MM-DD>
preflight_status: ready | restricted
lane_a_status: complete | incomplete
lane_b_status: ready | restricted
lane_c_status: complete | carry-forward
---

# S10 Weekly Packet — <BIZ> — <YYYY-Www>

## Preflight
- **Status**: ready | restricted
- **Missing inputs**: <list or none>

## Canonical Artifact References

These artifacts are produced by their authoritative owners and referenced here. This packet does not replace them.

| Artifact | Path | Status |
|---|---|---|
| KPCS decision memo | <path or pending> | complete \| pending |
| Signal review | <path or null> | emitted \| not-emitted |
| Feedback loop audit | <path or null> | emitted \| not-emitted |
| Monthly deep-audit | <path or N/A> | due \| not-due \| complete |

## Lane B — Measurement Summary

<measurement_summary block or restricted note>

## Lane A — Audit + CI Summary

### Section H Status
- **Status**: complete | incomplete | pending-decision-memo

### Monthly Audit Trigger
- **Trigger**: due | not-due | unknown

### REM Delta

<rem_delta block>

## Lane C — Experiment Portfolio

### Active Experiments

<experiment_portfolio_summary block>

### Next-Cycle Backlog Delta

<next_cycle_backlog_delta block>

## Run Trace

| Sub-flow | Invoked | Outcome |
|---|---|---|
| `/lp-signal-review` | yes \| no | <artifact path or skip reason> |
| GATE-LOOP-GAP-03 feedback audit | yes \| no | <artifact path or skip reason> |
| KPCS prompt handoff | yes \| no | <artifact path or pending> |
| `/lp-experiment readout` (per experiment) | <list> | <outcomes> |
```

## Additive-First Policy

- This packet is additive: it references canonical artifacts and does not replace them.
- Canonical artifacts (KPCS decision memo, signal review, feedback audit, monthly audit) are produced by their respective skill flows and stored at their canonical paths. The packet stores cross-artifact links only.
- If a canonical artifact is not yet produced when the packet is written, its reference is recorded as `pending` — the packet is still emitted. The operator may re-run `/lp-weekly` once the canonical artifact exists; the rerun will overwrite the packet with updated references per the idempotency policy.

## Week-key and Rerun Handling

- Packet path is derived deterministically from `week_key` and `biz`. No operator naming choice required.
- On rerun for the same `week_key`: step 6.2 overwrites the packet file; step 6.3 overwrites the latest pointer. No cleanup of the prior packet content is needed — the overwrite is complete.
- On first run for a new week key: step 6.2 creates the packet file; step 6.3 updates the latest pointer to the new week.
- The latest pointer ALWAYS reflects the most recently published packet week, regardless of whether that run was complete or partial.

## Failure Handling

| Condition | Action |
|---|---|
| Packet write fails (permission error) | Emit error; do not suppress; operator must resolve filesystem access |
| Latest pointer write fails | Emit warning (non-blocking); packet is still valid without pointer update |
| One or more lanes are `incomplete` or `restricted` | Packet is written with lane status recorded; advisory message emitted |
| All three lanes are `incomplete` or `restricted` | Packet is written with all statuses recorded; operator-level advisory emitted recommending re-run after resolving missing inputs |

No condition in this module blocks the packet write — the goal is always to produce a written artifact that reflects the current orchestration state, however partial.
