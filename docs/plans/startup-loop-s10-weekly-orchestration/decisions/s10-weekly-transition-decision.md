---
Type: Decision
Plan: docs/plans/startup-loop-s10-weekly-orchestration/plan.md
Task: TASK-01
Status: Closed
Decided: 2026-02-18
Decision-owner: Operator
---

# S10 Weekly Orchestration — Transition Decision

## Decision 1: Transition mode

**Question**: Approve Phase 0 + Phase 1 together in wave 1, or Phase 0 only?

**Options**:
- Option A: Phase 0 only (manual `/lp-weekly` alias, no default route change).
- Option B: Phase 0 + Phase 1 together (introduce `/lp-weekly` skill AND wire it as S10 default route in startup-loop surfaces).

**Decision**: **Option B — Phase 0 + Phase 1 together.**

**Rationale**: Avoids a dead-code alias period where `/lp-weekly` exists but is not the S10 default. Routing regression risk is acceptable given no stage-semantic changes and the no-block first-iteration policy. Phase 2 remap (`loop-spec.yaml` S10 skill pointer) remains deferred pending TASK-07 checkpoint evidence.

**Implication for implementation**:
- TASK-02 and TASK-03 (skill contract + skeleton) are delivered in wave 2.
- TASK-04 (startup-loop routing wiring) is delivered in wave 3 alongside TASK-05.
- Phase 2 remap is explicitly gated by TASK-07 checkpoint → TASK-08 decision.

---

## Decision 2: Week anchor convention

**Question**: What is the canonical week-key format and timezone for packet idempotency?

**Decision**: **ISO week, UTC Monday anchor. Key format: `YYYY-Www` (e.g., `2026-W07`).**

**Rationale**: Consistent with existing signal-review artifact naming convention (`W<ISOweek>` suffix). ISO week (Monday–Sunday) is unambiguous for week-boundary grouping. UTC avoids timezone-per-business-unit configuration overhead in Phase 0/1.

**Normative rule**:
- Week key is derived from the UTC date at invocation time using ISO 8601 week numbering.
- Week boundary: Monday 00:00:00 UTC to Sunday 23:59:59 UTC.
- Key string: zero-padded two-digit week number, e.g., `2026-W07`.
- Artifact path template: `docs/business-os/strategy/<BIZ>/s10-weekly-packet-<YYYY-Www>.md`.

---

## Decision 3: Idempotency rule

**Question**: On rerun for the same week key, overwrite in-place or supersede with version suffix?

**Decision**: **Overwrite in-place.**

**Rationale**: Single fixed path per week key ensures no duplicate unresolved packet files. Git history provides the audit trail for prior state. Supersede versioning would require resolution logic for which packet is authoritative, adding overhead inconsistent with the no-block first-iteration policy.

**Normative rule**:
- On rerun for the same `YYYY-Www` key: overwrite packet file at fixed path.
- No version-suffix copies are created.
- All canonical artifact references (KPCS decision memo, signal review, etc.) are re-linked in the overwritten packet; they are never deleted.
- If canonical artifacts change between runs, the packet reflects the latest link.

---

## Summary table

| Decision | Value |
|---|---|
| Transition mode | Option B: Phase 0 + Phase 1 in wave 1; Phase 2 deferred |
| Week anchor | ISO week, UTC Monday; format `YYYY-Www` |
| Idempotency | Overwrite in-place per week key |

---

## Decision log

- 2026-02-18: All three decisions confirmed by operator. TASK-01 closed. Wave 2 unblocked (TASK-02, TASK-03).
