---
Type: Schema
Status: Active
Domain: Business-OS
Workstream: Operations
Created: 2026-02-18
Last-reviewed: 2026-02-18
Owner: Operator
Skill: /lp-weekly
Spec-version: v1
Related-contract: docs/business-os/startup-loop/s10-weekly-orchestration-contract-v1.md
Related-skill: .claude/skills/lp-weekly/SKILL.md
---

# S10 Weekly Packet — Schema v1

## 1. Purpose and Scope

This document defines the schema for the S10 weekly packet artifact. The weekly packet is an **additive** orchestration trace that:

- records the lane statuses, cross-artifact links, and execution trace for one weekly S10 run,
- provides a normalized, replayable snapshot of each week's orchestration output,
- supports two-cycle observability by including the three required two-cycle metrics fields.

The weekly packet **never replaces** any canonical S10 artifact. All canonical artifacts are retained at their existing paths and are referenced (not overwritten) by the packet. This additive-first policy is in force for the first iteration of this contract and applies until a future migration task explicitly changes it.

---

## 2. Canonical Artifacts Retained

The following canonical artifacts are produced outside `/lp-weekly` and remain at their existing paths. The weekly packet links to them; it does not replace them.

| Artifact | Path pattern | Owner |
|---|---|---|
| Weekly KPCS decision memo | `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-weekly-kpcs-decision.user.md` | KPCS prompt authority |
| Signal review artifact | `docs/business-os/strategy/<BIZ>/signal-review-<YYYYMMDD>-<HHMM>-W<ISOweek>.md` | `/lp-signal-review` |
| Feedback-loop audit artifact | `docs/business-os/strategy/<BIZ>/feedback-loop-audit-<YYYY-MM-DD>.md` | GATE-LOOP-GAP-03 |
| Monthly deep-audit summary | `docs/business-os/strategy/<BIZ>/<YYYY-MM>-monthly-audit.user.md` | Operator |

These artifacts are never overwritten by `/lp-weekly`. Their paths are recorded in the weekly packet under the relevant reference fields.

---

## 3. Packet File Path Template

```
docs/business-os/strategy/<BIZ>/s10-weekly-packet-<YYYY-Www>.md
```

- `<BIZ>`: business identifier (e.g., `BRIK`, `HEAD`, `PET`).
- `<YYYY-Www>`: ISO 8601 week key, UTC Monday as anchor (e.g., `2026-W08` for the week beginning 2026-02-16).

Example: `docs/business-os/strategy/BRIK/s10-weekly-packet-2026-W08.md`

---

## 4. Latest-Pointer Path

```
docs/business-os/strategy/<BIZ>/s10-weekly-packet-latest.md
```

The latest pointer is a markdown file containing exactly one line: the relative path to the most recently successfully published weekly packet for that business. It is overwritten on every successful Step 7 publish (see Section 7). It is never overwritten on a failed publish.

Example content of `s10-weekly-packet-latest.md`:

```
docs/business-os/strategy/BRIK/s10-weekly-packet-2026-W08.md
```

---

## 5. Required Packet Fields Schema

All fields below are required in every weekly packet. Fields that have no value for a given run must be set to their defined absent value (shown in the Absent value column) rather than omitted.

This schema maps directly to the Output Contract in `.claude/skills/lp-weekly/SKILL.md`.

| Field | Type | Description | Absent value |
|---|---|---|---|
| `week_key` | String | ISO 8601 week key (`YYYY-Www`), UTC Monday anchor | — (required; `fail-closed` if missing) |
| `biz` | String | Business identifier (`BRIK`, `HEAD`, `PET`, etc.) | — (required; `fail-closed` if missing) |
| `as_of_date` | String | Invocation date (`YYYY-MM-DD`) | — (required; `fail-closed` if missing) |
| `preflight_status` | Enum | `ready` or `restricted` | — (required) |
| `missing_inputs` | List | Inputs absent at preflight time | `[]` |
| `lane_a_status` | Enum | `complete` or `incomplete` | — (required) |
| `lane_b_status` | Enum | `ready` or `restricted` | — (required) |
| `lane_c_status` | Enum | `complete` or `carry-forward` | — (required) |
| `kpcs_decision_ref` | Path | Canonical path to the KPCS decision artifact for this week | `pending` |
| `signal_review_ref` | Path | Path to signal review artifact for this week (if emitted) | `pending` |
| `feedback_audit_ref` | Path | Path to feedback-loop audit artifact for this cycle (if exists) | `pending` |
| `measurement_summary` | Section | Normalized measurement summary or `restricted` note | `restricted` |
| `rem_delta` | Section | New and resolved REM items this week | `[]` |
| `experiment_portfolio_summary` | Section | Rollup of active/concluded/paused experiments | `[]` |
| `next_cycle_backlog_delta` | Section | New next-experiment specs added or carried forward | `[]` |
| `run_trace` | List | Sub-flows invoked with their outcomes | `[]` |
| `missed_section_h_checks_count` | Integer | Count of Section H items that failed or were not evaluated this cycle | `0` |
| `unresolved_rem_carryover_count` | Integer | Count of open REM tasks carried into the next cycle (unresolved at close) | `0` |
| `next_experiment_specs_created_count` | Integer | Count of new next-cycle experiment specs created this cycle | `0` |

### Missing and Late Artifact Link Behavior

If a canonical artifact (e.g., `kpcs_decision_ref`, `signal_review_ref`, `feedback_audit_ref`) is not yet available at packet publish time, the field is set to `pending`. A `pending` value is a valid packet state. It does not block packet write or pointer update. The run continues and the operator is not blocked from closing the weekly cycle.

A REM task is emitted for each `pending` artifact reference so the gap has an owner and a due date.

---

## 6. Idempotency Rule

- **Week key:** `YYYY-Www` — ISO 8601 week number, UTC Monday as anchor. Example: `2026-W08` for the week beginning 2026-02-16.
- **Idempotency rule:** Rerunning `/lp-weekly` for the same week key **overwrites the existing weekly packet in place** at the same canonical path. It does not create a new packet file with a version suffix or timestamp suffix.
- **REM dedup on rerun:** A rerun does not create duplicate unresolved REM tasks. Before emitting a new REM, the orchestrator checks for an existing open REM with the same key. If one exists and is unresolved, the existing REM is kept and the rerun appends a re-check timestamp as a comment.
- **Canonical artifacts on rerun:** Rerun does not overwrite any canonical artifact (KPCS memo, signal review, feedback audit, monthly deep-audit). Overwrite applies only to the weekly packet for the current week key.
- **Audit trail:** Git history is the audit trail for packet rewrites. No additional version-suffix copies are created.

---

## 7. Pointer Update Rule

The latest-pointer file (`s10-weekly-packet-latest.md`) is **always overwritten** on every successful Step 7 publish. It is never updated on a failed publish. A failed publish (packet write failure) emits a REM task; the pointer retains its last-successful value until the next successful publish.

---

## 8. Two-Cycle Metrics Fields

The three required two-cycle observability metrics are mapped to explicit packet fields as follows:

| Metric | Packet field | Definition | Unit |
|---|---|---|---|
| `missed_section_h_checks_per_cycle` | `missed_section_h_checks_count` | Count of Section H weekly audit items (A1–A8) that failed or were not evaluated in this cycle | Integer |
| `unresolved_rem_carryover_count` | `unresolved_rem_carryover_count` | Count of open `REM-<BIZ>-<YYYYMMDD>-<n>` tasks that remain unresolved at the time of packet publish for this cycle | Integer |
| `next_experiment_specs_created_count` | `next_experiment_specs_created_count` | Count of new next-cycle experiment spec entries added to the experiment backlog in lane `c` this cycle | Integer |

These three fields are required in every packet. A value of `0` is valid. A missing or `null` value is a schema violation and must be treated as a preflight failure on the next run.

---

## 9. Cross-References

- Orchestration contract (full S10 sequence, lane contracts, authority isolation, idempotency rules): `docs/business-os/startup-loop/s10-weekly-orchestration-contract-v1.md`
- Orchestrator skill (invocation, output contract, module routing): `.claude/skills/lp-weekly/SKILL.md`
- Weekly decision content authority: `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md`
- Audit cadence contract (Section H full checklist, monthly deep-audit): `docs/business-os/startup-loop/audit-cadence-contract-v1.md`
- Operator workflow guide: `docs/business-os/startup-loop-workflow.user.md`
