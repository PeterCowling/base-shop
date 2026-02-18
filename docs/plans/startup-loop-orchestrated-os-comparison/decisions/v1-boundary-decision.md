---
Type: Decision
Plan: docs/plans/startup-loop-orchestrated-os-comparison/plan.md
Task: TASK-01
Created: 2026-02-18
Status: Decided
Decided-by: operator (delegated to build agent via explicit "resolve and continue" instruction)
---

# V1 Boundary Decision: Stage Orchestration vs Process-Layer Registry

## Decision

**Selected option: Option A — Additive process-layer contracts only. No loop-spec structural edit in v1.**

> Should v1 permit any loop-spec field additions for process IDs? **No.**

## Rationale

Evidence from TASK-00 contract-overlap matrix (`artifacts/contract-overlap-matrix.md`) confirms:

1. **Stage orchestration is mature and does not need process IDs to function.** All 28 research process IDs map cleanly as operational overlays — none require changes to stage ordering, join barriers, run packet fields, or manifest schema fields to be usable.

2. **DATA-4 (High collision risk) shows the blast radius is real.** Adding a competing weekly-review contract into loop-spec would conflict with the existing S10 + KPCs prompt contract. This is the single `Covered` requirement in the entire matrix — it works precisely because it is NOT embedded in loop-spec stage fields.

3. **15/28 requirements are Partial, 12/28 are Missing — all traceable to the process-layer, not the stage engine.** The gap is operating specificity (artifact schemas, owner roles, cadence rules, exception runbooks) — not stage-graph primitives.

4. **Additive contracts have lower blast radius.** The existing loop-spec v1.5.0 stage graph is stable and relied upon by current BRIK/HEAD/PET runs. Structural edits risk downstream alignment check (VC-02) and consumer breakage.

5. **Delayed native embedding has manageable risk.** If v2 merits process IDs as first-class loop-spec fields, the process-registry-v1.md becomes the migration source. No rework is wasted.

## Selected Option Details

**Option A:** Add a process-registry layer as standalone contracts under `docs/business-os/startup-loop/`. These contracts reference existing stage anchors but do not modify the stage graph, run packet, or manifest schema.

**Option B (rejected):** Embed process-state machine fields directly into loop-spec.yaml and refactor startup-loop orchestration. Rationale for rejection: blast radius is too large for the current operating state; no evidence that process IDs are needed as stage-graph primitives in v1.

## Canonical Files Permitted for V1 Edits

| File | Permitted edit type | Rationale |
|---|---|---|
| `docs/business-os/startup-loop/process-registry-v1.md` | Create (new additive contract) | TASK-02 primary deliverable |
| `docs/business-os/startup-loop/sales-ops-schema.md` | Create (new additive schema) | TASK-03 primary deliverable |
| `docs/business-os/startup-loop/retention-schema.md` | Create (new additive schema) | TASK-04 primary deliverable |
| `docs/business-os/startup-loop/exception-runbooks-v1.md` | Create (new additive runbook) | TASK-05 primary deliverable |
| `docs/business-os/startup-loop/audit-cadence-contract-v1.md` | Create (new additive checklist) | TASK-06 primary deliverable |
| `docs/business-os/startup-loop/marketing-sales-capability-contract.md` | Update CAP-05 and CAP-06 status fields | TASK-03/TASK-04 scope |
| `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md` | Extend only — add CAP-05/CAP-06 denominator hooks | TASK-03/TASK-04 scope; must not modify existing decision rules |
| `docs/business-os/startup-loop-workflow.user.md` | Reference additions only — link to new contracts | TASK-05/TASK-06 scope |

## Explicit Out-of-Scope for V1

| File | Why out-of-scope |
|---|---|
| `docs/business-os/startup-loop/loop-spec.yaml` | **No edits.** Stage graph, run packet, and gate contracts are stable. Process IDs are additive overlays only. |
| `docs/business-os/startup-loop/manifest-schema.md` | **No edits.** Single-writer baseline semantics are unchanged. |
| `docs/business-os/startup-loop/bottleneck-diagnosis-schema.md` | **No edits.** Constraint key taxonomy and ranking logic are stable. Exception runbooks reference (but do not modify) blocked-stage keys. |
| `docs/business-os/startup-loop/artifact-registry.md` | **No edits.** Canonical artifact paths are stable. Process registry may reference them but must not duplicate or override. |
| `docs/business-os/startup-loop/stage-operator-dictionary.yaml` | **No edits.** Stage labels and display strings are stable. |
| `docs/business-os/startup-loop-current-vs-proposed.user.md` | **Read-only reference.** Already documented as `[readonly]` in TASK-01 Affects. |

## Downstream Unblocking

This decision resolves scope ambiguity for TASK-02, TASK-03, and TASK-04. All three can now proceed:

- **TASK-02** (process-registry-v1.md): additive contract mapping all 28 process IDs.
- **TASK-03** (sales-ops-schema.md + CAP-05): closes missing capability with explicit schema.
- **TASK-04** (retention-schema.md + CAP-06): closes missing capability with explicit schema.

No downstream task requires loop-spec.yaml edits. All downstream tasks are bounded by the additive-only rule.

## Validation

Decision closes when downstream tasks can proceed without unresolved scope ambiguity. ✓ — All three downstream tasks have explicit deliverable paths, scope boundaries, and no remaining questions that require loop-spec changes.
