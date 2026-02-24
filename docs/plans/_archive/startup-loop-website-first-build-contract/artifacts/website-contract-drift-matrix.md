---
Type: Build-Artifact
Status: Complete
Domain: Venture-Studio
Created: 2026-02-23
Last-updated: 2026-02-23
Feature-Slug: startup-loop-website-first-build-contract
Task-ID: TASK-01
---

# WEBSITE Contract Drift Matrix

## Purpose
Classify WEBSITE-related startup-loop surfaces by contract role, then identify remaining drift that can cause operator confusion or implementation stalls.

## Surface Classification Matrix

| Surface | Classification | WEBSITE Role | Current state | Drift status |
|---|---|---|---|---|
| `docs/business-os/startup-loop/loop-spec.yaml` | authoritative | Runtime stage graph + WEBSITE container semantics | WEBSITE container + `WEBSITE-01/02` conditions are explicit and sequenced (`S5B -> WEBSITE -> DO`) | No drift |
| `docs/business-os/startup-loop/stage-operator-dictionary.yaml` | authoritative | Operator naming, aliases, display labels for WEBSITE stages | WEBSITE labels/aliases align to loop-spec v3.11.0 | No drift |
| `.claude/skills/startup-loop/modules/cmd-start.md` | authoritative (command gate behavior) | Gate C WEBSITE completion checks and prompt handoff routing | Launch-surface split and required output paths are explicit | No drift |
| `docs/business-os/workflow-prompts/_templates/website-first-build-framework-prompt.md` | authoritative (WEBSITE-01 prompt contract) | L1 first-build framework requirements | Framework-first sections + measurable DoD are explicit | No drift |
| `docs/business-os/workflow-prompts/README.user.md` | operator-reference | Prompt-pack stage map for WEBSITE-01/02 | WEBSITE prompt rows are aligned and explicit | No drift |
| `docs/business-os/startup-loop/process-registry-v2.md` | process-layer contract | Workstream ownership and stage/process coverage | WEBSITE-01/02 now mapped through OFF-3 bootstrap+recurring model | Minor residual drift outside WEBSITE rows |
| `docs/business-os/startup-loop-workflow.user.md` | operator-reference | Human-facing workflow tables, quick actions, handoff map | WEBSITE handoff rows aligned; other sections still contain legacy stage labels | Drift remains |
| `docs/business-os/startup-loop/_generated/stage-operator-map.json` + `docs/business-os/startup-loop/_generated/stage-operator-table.md` | derived | Generated WEBSITE operator views | Generated outputs current and consistent with dictionary | No drift |

## Inconsistency Register (Exact References)

### Open drift (requires follow-up work)

| ID | Severity | Finding | Evidence |
|---|---|---|---|
| DRIFT-01 | High | Stage status table still uses legacy pre-3.x labels (`S0`, `S1`, `S1B`, `S2A`) while canonical flow uses `ASSESSMENT-*`, `MEASURE-*`, and WEBSITE container stages | `docs/business-os/startup-loop-workflow.user.md:128`, `docs/business-os/startup-loop-workflow.user.md:129`, `docs/business-os/startup-loop-workflow.user.md:130`, `docs/business-os/startup-loop-workflow.user.md:131` |
| DRIFT-02 | High | Quick Actions table still references legacy stage labels (`S0`, `S1`, `S1B`, `S2A`, `S5`) in trigger language | `docs/business-os/startup-loop-workflow.user.md:267`, `docs/business-os/startup-loop-workflow.user.md:268`, `docs/business-os/startup-loop-workflow.user.md:269`, `docs/business-os/startup-loop-workflow.user.md:270`, `docs/business-os/startup-loop-workflow.user.md:274` |
| DRIFT-03 | High | Run-packet field contract still documents `current_stage` as `S0..S10` instead of canonical stage IDs including `ASSESSMENT-*`, `MEASURE-*`, `WEBSITE-*` | `docs/business-os/startup-loop-workflow.user.md:646` |
| DRIFT-04 | Medium | Stage-to-BOS update matrix still uses legacy stage IDs (`S0`, `S1`, `S1B`) | `docs/business-os/startup-loop-workflow.user.md:688`, `docs/business-os/startup-loop-workflow.user.md:689`, `docs/business-os/startup-loop-workflow.user.md:690` |
| DRIFT-05 | Medium | FIN-3 stage anchor still references retired `S1` label in process details table | `docs/business-os/startup-loop/process-registry-v2.md:591` |
| DRIFT-06 | Medium | Current-state/gap snapshots still use legacy `S1`/`S2A` labels, which can be read as active contract labels if not marked historical | `docs/business-os/startup-loop-workflow.user.md:431`, `docs/business-os/startup-loop-workflow.user.md:433`, `docs/business-os/startup-loop-workflow.user.md:447`, `docs/business-os/startup-loop-workflow.user.md:448` |

### Resolved drift (completed before/within this cycle)

| ID | Resolution | Evidence |
|---|---|---|
| RESOLVED-01 | WEBSITE-01 now explicitly represented in process-layer stage coverage map | `docs/business-os/startup-loop/process-registry-v2.md:102` |
| RESOLVED-02 | OFF-3 now anchors both WEBSITE-01 bootstrap and WEBSITE-02 recurring operations | `docs/business-os/startup-loop/process-registry-v2.md:60`, `docs/business-os/startup-loop/process-registry-v2.md:248` |
| RESOLVED-03 | Prompt handoff map now includes WEBSITE-01 first-build framework prompt path + output path | `docs/business-os/startup-loop-workflow.user.md:556` |

## Enforcement Boundary Recommendation

Use the following contract boundary split for future edits:

1. **Runtime authority**: `loop-spec.yaml` + stage dictionary + generated stage-operator views.
2. **Command/gate authority**: `cmd-start.md` for launch-surface WEBSITE gating and handoff rules.
3. **Operator-reference authority**: workflow and registry docs must not introduce stage labels not present in runtime authority unless explicitly tagged historical.

## Validation Snapshot

- `pnpm --filter ./scripts run check-stage-operator-views` -> PASS
- `pnpm --filter ./scripts test -- --testPathPattern=\"generate-stage-operator-views.test.ts|derive-state.test.ts\" --maxWorkers=2` -> PASS

## Task-01 Acceptance Check

- Matrix classifies WEBSITE-relevant surfaces by contract role: **PASS**
- Inconsistency register provides exact path/line references for WEBSITE-01/02-related drift: **PASS**
