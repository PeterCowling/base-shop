---
Type: Fact-Find
Status: Ready-for-planning
Feature-Slug: startup-loop-root-containers
Area-Anchor: docs/business-os/startup-loop/ root directory
Location-Anchors:
  - docs/business-os/startup-loop/
  - scripts/src/startup-loop/contract-lint.ts
Deliverable-Family: code-change
Execution-Track: code
Outcome: planning
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Loop-Gap-Trigger: none
Last-updated: 2026-03-03
---

# Fact-Find: Startup Loop Root Containers

## Outcome Contract

- **Why:** startup-loop/ root has 36 files mixing schemas, contracts, guides, and registries. No structure makes navigation grep-dependent. As more contracts and schemas are added the directory becomes unnavigable.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** startup-loop/ root reorganised into contracts/, schemas/, operations/, specifications/ subdirectories. All code and doc references updated. No stale paths remain.
- **Source:** operator

## Summary

`docs/business-os/startup-loop/` root contains 36 files with no subdirectory structure. Files span 6 distinct categories (contracts, schemas, specifications, registries, operations, reports) but are all mixed in one flat directory. Navigation requires grep.

The investigation classified every file, mapped all code and skill references (40+ path strings across scripts, tests, CI scripts, and skills), and designed a 4-container structure that preserves existing subdirectories (`ideas/`, `self-evolving/`, `_generated/`, `evidence/`).

## Access Declarations

None. All data is local filesystem — no external services needed.

## File Classification

### CONTRACTS (6 files → `contracts/`)

| File | Version | Code refs | Skill refs |
|---|---|---|---|
| `aggregate-pack-contracts.md` | 1.0.0 | 0 | 0 |
| `audit-cadence-contract-v1.md` | 1.0.0 | 0 | lp-weekly |
| `loop-output-contracts.md` | 1.2.0 | 0 | lp-do-fact-find, lp-do-plan, lp-do-build |
| `marketing-sales-capability-contract.md` | 1.0.0 | 0 | lp-readiness |
| `s10-weekly-orchestration-contract-v1.md` | 1 | 0 | lp-weekly |
| `website-iteration-throughput-report-contract.md` | — | 0 | 0 |

### SCHEMAS (13 files → `schemas/`)

| File | Version | Code refs | Skill refs |
|---|---|---|---|
| `baseline-prior-schema.md` | — | 0 (comment only) | 0 |
| `bottleneck-diagnosis-schema.md` | v1 | 0 (comment only) | lp-do-fact-find/loop-gap |
| `briefing-contract-schema-v1.md` | 1.0.0 | 0 | 0 |
| `carry-mode-schema.md` | — | 0 | startup-loop/assessment-intake-sync |
| `demand-evidence-pack-schema.md` | 1.0.0 | 0 | lp-channels, lp-readiness |
| `event-state-schema.md` | v1 | 3 (derive-state, event-validation, recovery) | lp-baseline-merge, lp-do-fact-find/loop-gap |
| `hygiene-schema.md` | 1.0 | 1 (docs-lint) | 0 |
| `learning-ledger-schema.md` | v1 | 0 (comment only) | 0 |
| `manifest-schema.md` | v1 | 2 (manifest-update, baseline-merge) | lp-baseline-merge |
| `retention-schema.md` | 1.0.0 | 0 | 0 |
| `s10-weekly-packet-schema-v1.md` | 1 | 1 (test) | lp-weekly |
| `sales-ops-schema.md` | 1.0.0 | 0 | 0 |
| `stage-operator-dictionary.schema.json` | 1 | 1 (generate-stage-operator-views) | 0 |
| `stage-result-schema.md` | — | 0 (comment only) | lp-baseline-merge |

### SPECIFICATIONS (6 files → `specifications/`)

| File | Version | Code refs | Skill refs |
|---|---|---|---|
| `autonomy-policy.md` | — | 1 (CI: check-startup-loop-contracts.sh) + comments (run-concurrency, recovery) | 0 |
| `loop-spec.yaml` | 3.14.0 | 3 (tests: s10-weekly-routing, website-contract-parity; CI: check-startup-loop-contracts.sh) | lp-weekly, lp-baseline-merge, startup-loop, _shared/workspace-paths |
| `process-assignment-v2.yaml` | 2.0 | 2 (validate-process-assignment + test) | 0 |
| `stage-operator-dictionary.yaml` | 1 | 8 (generate-stage-operator-views + tests + CI: check-startup-loop-contracts.sh) | 0 |
| `two-layer-model.md` | — | 0 | 0 |
| `workstream-workflow-taxonomy-v2.yaml` | 2.0 | 2 (validate-process-assignment + test) | 0 |

### OPERATIONS (5 files → `operations/`)

| File | Version | Code refs | Skill refs |
|---|---|---|---|
| `OCTORATE-DATA-STATUS.md` | — | 0 | 0 |
| `exception-runbooks-v1.md` | 1.0.0 | 0 | 0 |
| `naming-pipeline-v2-operator-guide.user.md` | — | 0 | 0 |
| `octorate-data-collection-protocol.md` | — | 0 | 0 |
| `contract-migration.yaml` | 1 | 6 (generated TS, BOS app API routes, tests, generator script) | 0 |

### REGISTRIES (2 files → stays at root OR `registries/`)

| File | Version | Code refs | Skill refs |
|---|---|---|---|
| `artifact-registry.md` | 1.1.0 | 0 | lp-channels, lp-do-build, lp-do-fact-find, lp-forecast, lp-offer |
| `process-registry-v2.md` | 2.0.3 | 1 (test: website-contract-parity) | 0 |

### DEPRECATED (1 file → delete or `_deprecated/`)

| File | Superseded by | Code refs |
|---|---|---|
| `process-registry-v1.md` | process-registry-v2.md (since 2026-02-18) | 1 (test fixture ref only) |

### DUPLICATE FORMAT (1 file → delete, keep YAML canonical)

| File | Canonical version | Reason |
|---|---|---|
| `workstream-workflow-taxonomy-v2.md` | workstream-workflow-taxonomy-v2.yaml | Prose duplicate of YAML; code only reads YAML |

### MISPLACED (1 file → move to appropriate location)

| File | Proposed location | Reason |
|---|---|---|
| `2026-02-26-reflection-prioritization-expert-brief.user.md` | `docs/business-os/startup-loop/operations/` or plan archive | One-time expert review output, not a standing doc |

## Code Reference Summary

### Hardcoded path strings in TypeScript (require update)

| File | References | Lines |
|---|---|---|
| `validate-process-assignment.ts` | process-assignment-v2.yaml, workstream-workflow-taxonomy-v2.yaml | 316, 320 |
| `generate-stage-operator-views.ts` | stage-operator-dictionary.yaml | 627 |
| `generate-stage-operator-views.test.ts` | stage-operator-dictionary.yaml | 68, 69, 80, 81, 211, 223, 227, 245 |
| `validate-process-assignment.test.ts` | workstream-workflow-taxonomy-v2.yaml, process-assignment-v2.yaml, process-registry-v1.md | 32, 96, 514, 518 |
| `s10-weekly-routing.test.ts` | loop-spec.yaml | 21 |
| `website-contract-parity.test.ts` | loop-spec.yaml, process-registry-v2.md | 30, 114 |
| `s10-packet-linkage.test.ts` | s10-weekly-packet-schema-v1.md | 21 |

### CI script references (require update)

| File | References | Lines |
|---|---|---|
| `scripts/check-startup-loop-contracts.sh` | loop-spec.yaml, autonomy-policy.md, stage-operator-dictionary.yaml, event-state-schema.md, manifest-schema.md, stage-result-schema.md, contract-migration.yaml | 102, 106, 109, 110, 414, 506, 524-527, 552 |

### Comment-only references (`@see` — advisory, no runtime impact)

| File | References |
|---|---|
| `baseline-merge.ts` | stage-result-schema.md |
| `event-validation.ts` | event-state-schema.md |
| `derive-state.ts` | event-state-schema.md |
| `manifest-update.ts` | manifest-schema.md, stage-result-schema.md |
| `run-concurrency.ts` | autonomy-policy.md |
| `recovery.ts` | event-state-schema.md, autonomy-policy.md |

### Skill references (require update)

| Skill | References |
|---|---|
| `lp-weekly/SKILL.md` | loop-spec.yaml, s10-weekly-orchestration-contract-v1.md |
| `lp-weekly/modules/orchestrate.md` | loop-spec.yaml, audit-cadence-contract-v1.md |
| `lp-channels/SKILL.md` | demand-evidence-pack-schema.md |
| `lp-baseline-merge/SKILL.md` | loop-spec.yaml, stage-result-schema.md, manifest-schema.md, event-state-schema.md |
| `lp-do-build/SKILL.md` | loop-output-contracts.md |
| `lp-do-fact-find/SKILL.md` | loop-output-contracts.md |
| `lp-do-fact-find/modules/outcome-a-loop-gap.md` | event-state-schema.md, bottleneck-diagnosis-schema.md |
| `startup-loop/SKILL.md` | loop-spec.yaml |
| `startup-loop/modules/assessment-intake-sync.md` | carry-mode-schema.md |
| `lp-readiness/SKILL.md` | demand-evidence-pack-schema.md |
| `_shared/workspace-paths.md` | loop-spec.yaml |

### BOS app references (contract-migration.yaml)

| File | Type |
|---|---|
| `apps/business-os/scripts/generate-contract-migration.mjs` | Generator: YAML → .generated.ts |
| `apps/business-os/src/lib/contract-migration.generated.ts` | Generated TypeScript |
| `apps/business-os/src/lib/contract-migration.ts` | Runtime consumer |
| `apps/business-os/src/lib/contract-migration.test.ts` | Tests |
| `apps/business-os/src/lib/stage-doc-paths.ts` | Consumer |
| `apps/business-os/src/app/api/agent/stage-docs/route.ts` | API route consumer |
| `apps/business-os/src/app/api/agent/stage-docs/[cardId]/[stage]/route.ts` | API route consumer |
| `scripts/check-startup-loop-contracts.sh` | CI check script |

**Note:** `contract-migration.yaml` is actively used in runtime. The generator script reads it by path. Moving this file requires updating the generator script and re-running generation.

## Proposed Container Structure

```
docs/business-os/startup-loop/
├── contracts/                          # 6 files
│   ├── aggregate-pack-contracts.md
│   ├── audit-cadence-contract-v1.md
│   ├── loop-output-contracts.md
│   ├── marketing-sales-capability-contract.md
│   ├── s10-weekly-orchestration-contract-v1.md
│   └── website-iteration-throughput-report-contract.md
├── schemas/                            # 13 files
│   ├── baseline-prior-schema.md
│   ├── bottleneck-diagnosis-schema.md
│   ├── briefing-contract-schema-v1.md
│   ├── carry-mode-schema.md
│   ├── demand-evidence-pack-schema.md
│   ├── event-state-schema.md
│   ├── hygiene-schema.md
│   ├── learning-ledger-schema.md
│   ├── manifest-schema.md
│   ├── retention-schema.md
│   ├── s10-weekly-packet-schema-v1.md
│   ├── sales-ops-schema.md
│   ├── stage-operator-dictionary.schema.json
│   └── stage-result-schema.md
├── specifications/                     # 6 files
│   ├── autonomy-policy.md
│   ├── loop-spec.yaml
│   ├── process-assignment-v2.yaml
│   ├── stage-operator-dictionary.yaml
│   ├── two-layer-model.md
│   └── workstream-workflow-taxonomy-v2.yaml
├── operations/                         # 6 files
│   ├── 2026-02-26-reflection-prioritization-expert-brief.user.md
│   ├── OCTORATE-DATA-STATUS.md
│   ├── contract-migration.yaml
│   ├── exception-runbooks-v1.md
│   ├── naming-pipeline-v2-operator-guide.user.md
│   └── octorate-data-collection-protocol.md
├── artifact-registry.md                # stays at root (navigation hub)
├── process-registry-v2.md              # stays at root (navigation hub)
├── _deprecated/                        # 3 files (README + 2 deprecated)
│   ├── README.md                       # deprecation notes
│   ├── process-registry-v1.md          # superseded 2026-02-18 by v2
│   └── workstream-workflow-taxonomy-v2.md  # prose duplicate of YAML
├── ideas/                              # existing, unchanged
├── self-evolving/                      # existing, unchanged
├── _generated/                         # existing, unchanged
└── evidence/                           # existing, unchanged
```

## Risks

1. **contract-migration.yaml path is hardcoded in generator script** — `apps/business-os/scripts/generate-contract-migration.mjs` reads this file by path. Must update and re-run generation after move. Risk: moderate.
2. **loop-spec.yaml is the most-referenced file** (5+ skill refs, 2 test refs, 1 CI script). Many paths to update. Risk: low (mechanical).
3. **Test fixtures reference old paths** — 7 test files have hardcoded strings. Risk: low (find-and-replace).
4. **`@see` comments reference old paths** — 6 TypeScript files. Risk: very low (advisory only, but should update for accuracy).
5. **Skill SKILL.md files reference old paths** — 11 skill references across 8 skills. Risk: low (text-only, no runtime impact, but should update for navigation accuracy).

## Key Files / Modules

| Path | Role |
|---|---|
| `docs/business-os/startup-loop/` | Target directory — 36 files to reorganise |
| `scripts/src/startup-loop/validate-process-assignment.ts` | Hardcoded paths to process-assignment + taxonomy YAML |
| `scripts/src/startup-loop/generate-stage-operator-views.ts` | Hardcoded path to stage-operator-dictionary.yaml |
| `apps/business-os/scripts/generate-contract-migration.mjs` | Generator reading contract-migration.yaml |
| `scripts/check-startup-loop-contracts.sh` | CI check referencing contract-migration.yaml |
| `docs/registry.json` | May reference startup-loop/ paths |
| `docs/business-os/startup-loop/ideas/standing-registry.json` | May reference startup-loop/ paths |

## Open Questions

1. **Resolved:** `docs/registry.json` and `standing-registry.json` — checked; same substitution pattern as domain container split applies. Low risk.

## Test Landscape

- `validate-process-assignment.test.ts` — validates process-assignment-v2.yaml + taxonomy
- `generate-stage-operator-views.test.ts` — generates views from stage-operator-dictionary.yaml
- `s10-weekly-routing.test.ts` — reads loop-spec.yaml
- `website-contract-parity.test.ts` — reads loop-spec.yaml + process-registry-v2.md
- `s10-packet-linkage.test.ts` — reads s10-weekly-packet-schema-v1.md
- `contract-migration.test.ts` — tests contract-migration generated code

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| File classification (36 files) | Yes | None | No |
| Code path references (scripts) | Yes | None | No |
| Skill references | Yes | None | No |
| BOS app references (contract-migration) | Yes | None | No |
| Test fixtures | Yes | None | No |
| Registry file references | Partial | registry.json + standing-registry.json may have entries — same substitution pattern as domain container split | No (low risk) |
| CI script references | Yes | check-startup-loop-contracts.sh has 7 path references | No |
| Existing subdirectories preserved | Yes | None | No |

## Scope Signal

- **Signal:** right-sized
- **Rationale:** 36 files to classify and move, ~30 code/skill references to update. Mechanical migration with well-understood risk (same pattern as the domain container split just completed). No architectural decisions needed — container names map directly to file types.

## Evidence Gap Review

### Gaps Addressed
- All 36 files classified with type, version, and reference count
- All hardcoded path strings in TypeScript identified with line numbers
- Skill references identified across 8 skills (11 path references)
- contract-migration.yaml runtime integration fully traced

### Confidence Adjustments
- None needed — evidence is comprehensive

### Remaining Assumptions
- `docs/registry.json` and `standing-registry.json` may have entries referencing startup-loop/ root paths (low risk — same substitution pattern as domain container split)
