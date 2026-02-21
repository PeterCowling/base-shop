---
Type: Contract
Status: Active
Domain: Business-OS
Workstream: Operations
Created: 2026-02-18
Last-reviewed: 2026-02-18
Owner: Operator
Skill: /lp-weekly
Canonical code: .claude/skills/lp-weekly/
Related-fact-find: docs/plans/startup-loop-s10-weekly-orchestration/fact-find.md
Related-plan: docs/plans/startup-loop-s10-weekly-orchestration/plan.md
Spec-version: v1
---

# S10 Weekly Orchestration Contract — v1

## 1. Purpose

This document is the single authoritative source for how S10 is orchestrated each week. It defines:

- the authority stack (what each surface owns and does not own),
- the deterministic 7-step execution sequence (S10 Sequence v0),
- the lane contracts for lanes `a`, `b`, and `c`,
- the additive artifact continuity policy,
- the no-block first-iteration policy,
- the decision-to-experiment-action mapping table, and
- rerun and idempotency semantics.

This contract governs the orchestrator skill `/lp-weekly`. It does not replace and must not override any surface listed under authority isolation below.

---

## 2. Authority Isolation

Authority over S10 is split across three distinct surfaces. Each surface has explicit scope. Scope is non-overlapping.

| Surface | Owns | Does NOT own |
|---|---|---|
| `docs/business-os/startup-loop/loop-spec.yaml` | Stage graph: stage IDs, stage ordering constraints, gate semantics, skill mapping, run packet contract | Weekly decision content; execution sequence within S10; lane structure |
| `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md` | Weekly decision content authority: KPI denominator checks (Section A), KPI delta summary (B), decision class (C), signal analysis (D), next-week actions (E), risk watchlist (F), data quality (G), weekly audit compliance (Section H) | Stage graph; execution order of S10 steps; lane orchestration; packet structure |
| S10 orchestrator (`/lp-weekly`, this contract) | Execution order of S10 steps; preflight checks; lane sequencing; additive packet structure; cross-artifact linking; idempotency key; REM emission policy | Does not set decision content (that is the KPCS prompt's authority); does not mutate stage IDs, gate semantics, or stage ordering (those belong to `loop-spec.yaml`) |

**Invariant:** No change to this contract may expand the orchestrator's authority into the KPCS prompt's decision content scope or into `loop-spec.yaml`'s stage graph scope. Any such expansion requires an explicit update to the relevant authority surface first.

---

## 3. S10 Sequence v0 — 7-Step Execution Order

The sequence below is deterministic. Every reviewer reading this contract must derive the same step order. Steps are numbered 1–7 and must execute in order unless a step explicitly permits a skip.

### Step 1 — Preflight

| Field | Value |
|---|---|
| Inputs | Business code, week anchor (`YYYY-Www`), required KPI source list, prior-week decision artifact path |
| Output | Preflight status: `ready` or `restricted`; missing-input list (empty if `ready`) |
| Exit condition | Preflight status determined; missing-input list emitted |
| Failure handling | If any required input is absent: set overall run status to `restricted`; emit REM task per missing input; continue sequence at Step 2 in `restricted` mode — do not halt |
| Owner | Orchestrator (`/lp-weekly`) |

**Note:** `restricted` mode means downstream steps execute but their outputs are flagged as restricted-quality. No step is skipped due to `restricted` status in the first iteration.

### Step 2 — Measurement Compilation

| Field | Value |
|---|---|
| Inputs | KPI sources from Step 1, denominator data, data-quality notes |
| Output | Normalized measurement summary section for the weekly packet |
| Exit condition | All required KPI families assessed or explicitly marked restricted |
| Failure handling | Missing denominator: mark affected KPI family as `restricted`; emit REM task; continue |
| Owner | Lane `b` (see Section 4) |

### Step 3 — Decisioning

| Field | Value |
|---|---|
| Inputs | Measurement summary from Step 2, outcome contract, experiment results |
| Output | Completed KPCS decision artifact at canonical path: `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-weekly-kpcs-decision.user.md` |
| Exit condition | Decision artifact written to canonical path; Section H audit appended |
| Failure handling | If decision artifact cannot be written: emit REM task; mark lane `b` output as incomplete; do not block close |
| Owner | KPCS prompt authority (`weekly-kpcs-decision-prompt.md`); orchestrator links the output, does not author decision content |

**Authority note:** The orchestrator invokes the KPCS prompt and links the resulting artifact. It does not set, interpret, or modify the decision content produced by the prompt.

### Step 4 — Weekly Audit Lane (`a`)

| Field | Value |
|---|---|
| Inputs | KPCS artifact from Step 3, exception tickets, CAP state, prior REM backlog |
| Output | Section H status summary, monthly deep-audit trigger evaluation, CI summary for this step |
| Exit condition | Weekly checks completed; monthly trigger evaluated (trigger fires if first week of month) |
| Failure handling | Any failed check: warning emitted; lane `a` marked `incomplete`; REM task created per failed item; no new hard gate |
| Owner | Lane `a` (see Section 4) |

### Step 5 — CI Capture

| Field | Value |
|---|---|
| Inputs | Signal-review output, feedback-loop audit output |
| Output | REM delta summary; deduplicated CI finding list; cross-links to signal-review and feedback-audit artifacts |
| Exit condition | CI findings linked and deduplicated; REM summary emitted |
| Failure handling | Dedup key conflict: retain earlier REM; emit warning; do not create duplicate unresolved artifact |
| Owner | Lane `a` (see Section 4) |

**Dedup rule:** Two CI findings share the same dedup key if they reference the same artifact path and the same check ID. When a key collision is detected, the earlier REM is retained and the newer finding is appended as a comment on the existing REM.

### Step 6 — Experiment Lane (`c`)

| Field | Value |
|---|---|
| Inputs | Experiment readouts, decision class from Step 3, prior experiment references |
| Output | Experiment portfolio rollup; updated or created next-cycle experiment backlog entries |
| Exit condition | Next-cycle backlog updated or explicit rationale recorded if no update warranted |
| Failure handling | Missing readout: warning emitted; carry-forward action recorded with named owner; no new hard gate |
| Owner | Lane `c` (see Section 4) |

### Step 7 — Publish

| Field | Value |
|---|---|
| Inputs | All lane outputs from Steps 1–6 |
| Output | Additive S10 weekly packet at `docs/business-os/strategy/<BIZ>/s10-weekly-packet-<YYYY-Www>.md`; updated latest pointer at `docs/business-os/strategy/<BIZ>/s10-weekly-packet-latest.md` |
| Exit condition | Packet written; latest pointer updated |
| Failure handling | If packet write fails: emit REM task; run is complete in-memory but pointer is not updated until next successful publish |
| Owner | Orchestrator (`/lp-weekly`) |

**Week key format:** `YYYY-Www` — ISO 8601 week number, UTC Monday as week anchor. Example: `2026-W08` for the week beginning 2026-02-16.

---

## 4. Lane Contracts

S10 is a composite of three lanes. Each lane has explicit inputs, outputs, exit condition, failure handling, and owner.

### Lane `a` — Audit + Continuous Improvement

| Field | Value |
|---|---|
| Inputs | KPCS decision artifact (Step 3 output), open exception tickets (EXC-*), CAP state snapshot, prior REM backlog |
| Outputs | Section H completion status; monthly deep-audit trigger result (`triggered` or `not-triggered`); CI summary (signal-review links + feedback-audit links, deduplicated); REM delta (new REMs created this cycle) |
| Exit condition | All 8 Section H items evaluated; monthly trigger evaluated; CI findings linked and deduplicated |
| Failure handling | Any check failure: emit warning; mark lane `a` as `incomplete`; create `REM-<BIZ>-<YYYYMMDD>-<n>` per failed item with named owner and due date; do not create new hard gate |
| Owner | Operator |

### Lane `b` — Measurement + Reporting

| Field | Value |
|---|---|
| Inputs | KPI snapshots (all required KPI families), denominator values, data-quality notes from current week |
| Outputs | Measurement summary section (normalized, denominator-validated); denominator validity state per KPI family (`pass` or `restricted`) |
| Exit condition | All required KPI families assessed or explicitly restricted; denominator validity state recorded for each |
| Failure handling | Missing denominator for a KPI family: set that family to `restricted` state; emit REM task with data-owner as owner; overall run continues; if A1 (measurement active) fails in Section H, all KPI families inherit `restricted` regardless of nominal values |
| Owner | Operator and data owner (joint) |

### Lane `c` — Next Experiments

| Field | Value |
|---|---|
| Inputs | Experiment readouts (per active experiment), decision class from Step 3, prior experiment references (`prior_refs`) |
| Outputs | Experiment portfolio rollup (status per active experiment: `running`, `concluded`, `paused`); next-cycle experiment backlog updates (new specs or explicit no-new-spec rationale) |
| Exit condition | Portfolio rollup complete; next-cycle backlog updated or rationale recorded; prior experiment references validated |
| Failure handling | Missing readout: warning emitted; carry-forward action created with growth owner as named owner; missing `prior_refs`: emit warning and validation check result; no new hard gate in first iteration |
| Owner | Growth owner / Operator |

---

## 5. Additive Artifact Continuity Policy

The orchestrator operates on an additive-first basis in the first iteration. The following rules apply:

1. **Canonical artifacts are never replaced.** The orchestrator references canonical artifacts; it does not overwrite them. Canonical artifacts for this policy are:
   - Weekly KPCS decision memo (`<YYYY-MM-DD>-weekly-kpcs-decision.user.md`)
   - Signal review artifact (`signal-review-<YYYYMMDD>-<HHMM>-W<ISOweek>.md`)
   - Feedback-loop audit artifact (`feedback-loop-audit-<YYYY-MM-DD>.md`)
   - Monthly deep-audit summary (`<YYYY-MM>-monthly-audit.user.md`)
2. **The weekly packet is additive.** The S10 weekly packet (`s10-weekly-packet-<YYYY-Www>.md`) is a new artifact that links to canonical artifacts and adds orchestration trace, lane status, and cross-artifact linking. It does not replace any canonical artifact path.
3. **First iteration never converts warnings into hard gates.** Any failure in any step or lane produces a warning, a `restricted` state flag, and a REM task. No new blocking gate is introduced in the first iteration of this contract.
4. **Migration to replacement** is an explicit future task and must be planned separately. Until a migration task is planned and approved, this additive-first policy is in force.

---

## 6. No-Block First-Iteration Policy

Failures anywhere in the S10 sequence or lanes must not block stage close in the first iteration of this contract.

Failure handling hierarchy:

| Severity | Handling | New gate introduced? |
|---|---|---|
| Missing optional input | Warning emitted in packet | No |
| Missing required input | Lane or KPI family set to `restricted`; REM task created | No |
| Step execution failure | Step output marked `incomplete`; REM task created; sequence continues | No |
| Lane exit condition not met | Lane marked `incomplete`; REM task created; publish proceeds with `incomplete` lane noted | No |
| Publish failure | REM task created; latest pointer not updated | No |

**Explicit prohibition:** This contract does not introduce any new hard gate that can prevent S10 stage close. Hard gate changes require an update to `loop-spec.yaml` and an explicit version bump with downstream alignment check.

---

## 7. Decision-to-Experiment-Action Mapping Table

This table defines the mandatory experiment-action response for each decision class produced by the KPCS prompt (Step 3). The orchestrator uses this table in Step 6 (Experiment Lane `c`) to determine what next-cycle backlog update is required.

| Decision class (from KPCS Section C) | Required experiment-lane action | Backlog update required? | Notes |
|---|---|---|---|
| `Continue` | Review active experiments; carry forward if still valid; create no new spec unless a failing Section A metric has an unresolved hypothesis | Conditional | Only create new spec if there is an unresolved failing metric with no active experiment |
| `Investigate` | Create at least one new experiment spec targeting the identified gap; link to the Section A failure that triggered `Investigate` | Yes — at least one new spec | Spec must reference the denominator or signal that is failing |
| `Pivot` | Conclude all experiments that test the pivoted hypothesis; create new specs for the post-pivot hypothesis | Yes — conclude + new spec | Prior experiments on old hypothesis must be marked `concluded` in portfolio rollup |
| `Scale` | Create scaling experiment spec (test increased spend, reach, or distribution for the best-performing channel/action); link to Section C rationale | Yes — scaling spec | Requires all relevant KPI families to have passed denominator check (Section A) |
| `Kill` | Mark all active experiments as `concluded`; no new specs; create REM task to archive experiment portfolio | Yes — conclude all, no new | Requires all relevant KPI families to have passed denominator check (Section A) |
| `no-decision` (denominator fail) | No scaling or kill experiment action; carry forward active experiments; emit REM task per failing denominator | No new spec | Experiment lane proceeds with carry-forward only until denominators recover |
| `pipeline-no-decision` | Same as `no-decision` for pipeline-referencing experiments | No new spec for pipeline actions | CAP-05 rule applies |
| `retention-no-decision` | Same as `no-decision` for retention-referencing experiments | No new spec for retention actions | CAP-06 PMF+ rule applies |

---

## 8. Rerun and Idempotency Semantics

- **Week key:** `YYYY-Www` (ISO 8601 week, UTC Monday as anchor). Example: `2026-W08`.
- **Idempotency rule:** Rerunning `/lp-weekly` for the same week key overwrites the existing weekly packet in place at the same path. It does not create a new packet file.
- **REM dedup rule:** Rerun does not create duplicate unresolved REM tasks. Before emitting a new REM, the orchestrator checks for an existing open REM with the same key (`REM-<BIZ>-<YYYYMMDD>-<n>` base). If one exists and is unresolved, the existing REM is kept and the rerun appends a re-check timestamp as a comment.
- **Canonical artifact paths:** Rerun does not alter the canonical decision artifact path or overwrite prior-week canonical artifacts. Overwrite applies only to the weekly packet for the current week key.
- **Latest pointer:** The `s10-weekly-packet-latest.md` pointer is always updated to the most recently published week key on every successful Step 7.

---

## 9. Adoption Phases

This contract is introduced in Phase 0/1 (additive wrapper, no mapping change to `loop-spec.yaml`).

| Phase | Behavior | `loop-spec.yaml` change? |
|---|---|---|
| Phase 0 (this contract, v1) | `/lp-weekly` exists and is additive; `loop-spec.yaml` S10 skill remains `/lp-experiment`; operator may invoke `/lp-weekly` directly | No |
| Phase 1 (default route) | Internal S10 routing dispatches through `/lp-weekly` orchestration sequence; `/lp-experiment` runs as sub-step | No (routing only) |
| Phase 2 (remap, future) | `loop-spec.yaml` S10 skill updated to `/lp-weekly`; requires explicit TASK approval and spec version bump | Yes — future task |

---

## 10. Cross-References

- Stage graph authority: `docs/business-os/startup-loop/loop-spec.yaml`
- Decision content authority: `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md`
- Weekly audit checklist (full): `docs/business-os/startup-loop/audit-cadence-contract-v1.md`
- Operator workflow guide: `docs/business-os/startup-loop-workflow.user.md`
- Fact-find basis: `docs/plans/startup-loop-s10-weekly-orchestration/fact-find.md`
