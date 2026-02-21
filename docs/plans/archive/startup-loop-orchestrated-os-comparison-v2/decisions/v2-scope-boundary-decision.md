---
Type: Decision Artifact
Task: TASK-00
Plan: startup-loop-orchestrated-os-comparison-v2
Status: Closed
Decided: 2026-02-18
Decided-by: Operator
---

# v2 Scope Boundary Decision

## Chosen Options

### Decision 1: Stage label rename scope
**Choice: Option B** — stage short labels ARE renamed in the v2 core wave (not deferred).

**Rationale**: Operator preference for a single clean cut rather than a two-wave approach. Label rename is included alongside taxonomy and assignment refactor.

**Out-of-scope for v2 (unchanged by this decision)**:
- Stage ordering, stage IDs, gate semantics in `loop-spec.yaml`
- Process IDs (`CDI-1`..`DATA-4`) and CAP-05/CAP-06 contracts
- Full runtime orchestration rewrite

### Decision 2: v1/v2 migration mode
**Choice: `supersede-now`** — v2 registry immediately replaces v1 as the sole source of truth upon merge.

**Rationale**: Operator prefers a hard cut with no coexist period. v1 is archived with a tombstone notice pointing to v2.

---

## Migration Mode Consequences Matrix

| Dimension | `supersede-now` (chosen) |
|---|---|
| SoT (definitions) | `process-registry-v2.md` from merge date |
| SoT (assignments) | `process-assignment-v2.yaml` from merge date |
| v1 edit policy | **Frozen immediately** — no new edits; add tombstone header pointing to v2 |
| Required v1/v2 banners | v1 gets `> ARCHIVED: superseded by process-registry-v2.md as of YYYY-MM-DD` at top |
| Allowed PR scope while active | All process/assignment changes must land in v2 artifacts only |
| Change-order rule | Assignment update in YAML first → prose update in v2 registry second |

---

## Authority & Deprecation Policy

- **Process definitions source-of-truth**: `docs/business-os/startup-loop/process-registry-v2.md`
- **Assignment source-of-truth**: `docs/business-os/startup-loop/process-assignment-v2.yaml`
- **v1 edit freeze policy**: Immediate freeze on merge; tombstone header required; file retained as historical reference only
- **Change-order rule**: Assignment updates must land in `process-assignment-v2.yaml` first; `process-registry-v2.md` prose follows in the same PR

---

## Transitional Canonical Process-ID Set

The frozen v1 process-ID set is canonical during the v2 build:
`CDI-1, CDI-2, CDI-3, CDI-4, OFF-1, OFF-2, OFF-3, OFF-4, GTM-1, GTM-2, GTM-3, GTM-4, OPS-1, OPS-2, OPS-3, OPS-4, CX-1, CX-2, CX-3, CX-4, FIN-1, FIN-2, FIN-3, FIN-4, DATA-1, DATA-2, DATA-3, DATA-4`

TASK-03 and TASK-05 validators must use this exact set as the coverage target.

---

## Option B Scope Additions (vs. Option A baseline plan)

These files are now **in scope** for v2 due to Option B:

| File | Change |
|---|---|
| `docs/business-os/startup-loop/stage-operator-dictionary.yaml` | `label` fields updated; backward-compat `aliases[]` added for each renamed label |
| `scripts/src/startup-loop/generate-stage-operator-views.ts` | Update label derivation logic to emit v2 labels |
| `scripts/src/startup-loop/stage-addressing.ts` | Update label resolution; support alias fallback |
| Operator docs and skills listed in TASK-06 `Affects` | Stage label literals also updated alongside vocabulary terms |
| Regression test scope | Extended to cover label resolution + alias fallback (TASK-07) |

**Note**: `loop-spec.yaml` stage IDs and gate semantics remain out of scope. Only label strings and their consumer display/resolution logic change.

---

## De-risking Note

Option B increases implementation risk in TASK-05 and TASK-07. The operator has authorized `/lp-do-replan` to add TDD tasks as needed to gate label rename changes behind test coverage before implementation proceeds.
