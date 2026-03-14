---
Type: Plan
Status: Complete
Domain: Repo / Agents
Workstream: Engineering
Created: "2026-03-11"
Last-reviewed: "2026-03-11"
Last-updated: "2026-03-11"
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: do-workflow-stage-handoff-packets
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas, lp-do-fact-find, lp-do-analysis, lp-do-plan, lp-do-build, lp-do-critique
Overall-confidence: 89%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/do-workflow-stage-handoff-packets/analysis.md
artifact: plan
---

# DO Workflow Stage Handoff Packets Plan

## Summary
Add a deterministic stage handoff packet generator in `packages/skill-runner`, define one canonical packet contract for `fact-find`, `analysis`, and `plan`, update the DO workflow docs and skills so downstream stages use packet-first progressive disclosure, and prove the flow with a persisted feature slug that emits real packet sidecars and workflow telemetry.

## Active tasks
- [x] TASK-01: Add deterministic stage handoff packet generation in `skill-runner`
- [x] TASK-02: Wire packet-first progressive disclosure into the workflow contract and stage skills
- [x] TASK-03: Persist the workflow artifact chain, emit real packet sidecars, and validate end to end

## Goals
- reduce cross-stage context load by default,
- lift the bounded summary work into deterministic code,
- keep engineering coverage, validation, and task selection intact across the workflow.

## Non-goals
- eliminating all remaining hidden thread/system overhead,
- replacing the canonical markdown artifacts,
- changing the ideas queue routing semantics.

## Constraints & Assumptions
- Constraints:
  - packet generation must be deterministic and source-derived,
  - packet semantics must be defined in one canonical contract,
  - build still needs full task-block escalation on demand.
- Assumptions:
  - `skill-runner` typecheck/lint plus artifact validators are sufficient proof for this change,
  - packet files can be treated as normal telemetry `--input-path` artifacts.

## Inherited Outcome Contract
- **Why:** The workflow now measures real token usage and shows that repeated stage-shell and thread carryover dominate cost, especially between analysis and plan.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Add deterministic stage handoff packets so downstream DO stages can load bounded structured sidecars first, escalate to full upstream markdown only when needed, and preserve engineering coverage expectations across the whole workflow.
- **Source:** operator

## Analysis Reference
- Related analysis: `docs/plans/do-workflow-stage-handoff-packets/analysis.md`
- Selected approach inherited:
  - deterministic packet sidecars for `fact-find`, `analysis`, and `plan`,
  - one canonical packet contract,
  - packet-first loading with explicit markdown escalation only when needed.
- Key reasoning used:
  - docs-only guidance would not mechanize the repeated workload,
  - a larger runtime handoff system is the next optimization, not the immediate one.

## Selected Approach Summary
- What was chosen:
  - implement a generator and CLI wrapper in `packages/skill-runner`,
  - add `do-stage-handoff-packet-contract.md` as the canonical contract,
  - update the workflow guide and stage skills to require packet generation and packet-first loading,
  - prove the flow with a real feature slug and packet files.
- Why planning is not reopening option selection:
  - analysis already rejected docs-only discipline and a larger runtime-handoff program for this increment.

## Fact-Find Support
- Supporting brief: `docs/plans/do-workflow-stage-handoff-packets/fact-find.md`
- Evidence carried forward:
  - telemetry proves the cost problem is real,
  - the workflow currently lacks bounded sidecars,
  - the existing markdown parsers are sufficient to extract compact stage payloads.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add deterministic stage handoff packet generation in `skill-runner` | 90% | M | Complete (2026-03-11) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Wire packet-first progressive disclosure into the workflow contract and stage skills | 88% | M | Complete (2026-03-11) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Persist the workflow artifact chain, emit real packet sidecars, and validate end to end | 89% | S | Complete (2026-03-11) | TASK-01, TASK-02 | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | N/A: workflow/process change only | TASK-02 | no product UI |
| UX / states | packet-first loading and clear fallback rules | TASK-02, TASK-03 | progressive disclosure stays explicit |
| Security / privacy | packets remain source-derived and repo-local | TASK-01, TASK-03 | no extra sensitive runtime data |
| Logging / observability / audit | telemetry examples and proof run include packet paths | TASK-02, TASK-03 | packet use becomes measurable |
| Testing / validation | typecheck/lint + fact-find/plan/coverage validators + real packet generation | TASK-01, TASK-03 | proof is deterministic |
| Data / contracts | one canonical packet contract plus generator schema | TASK-01, TASK-02 | avoids drifting semantics |
| Performance / reliability | compact packet fields and packet-first load order | TASK-01, TASK-02 | bounded context is the main performance goal |
| Rollout / rollback | additive sidecars with markdown fallback | TASK-02, TASK-03 | packet-first, not packet-only |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Generator first so the contract refers to a real tool. |
| 2 | TASK-02 | TASK-01 | Contract and skills align to the implemented generator. |
| 3 | TASK-03 | TASK-01, TASK-02 | Proof run happens against the final packet semantics. |

## Tasks

### TASK-01: Add deterministic stage handoff packet generation in skill-runner
- **Type:** IMPLEMENT
- **Deliverable:** code-change in `packages/skill-runner` plus shell wrapper in `scripts/`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-11)
- **Affects:** `packages/skill-runner/src/generate-stage-handoff-packet.ts`, `packages/skill-runner/src/stage-handoff-packet-markdown.ts`, `packages/skill-runner/src/stage-handoff-packet-types.ts`, `packages/skill-runner/src/cli/generate-stage-handoff-packet.ts`, `packages/skill-runner/src/index.ts`, `scripts/generate-stage-handoff-packet.sh`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 90%
  - Implementation: 91% - parser helpers already exist and the packet envelope is tightly bounded.
  - Approach: 90% - deterministic extraction is the cleanest way to mechanize the handoff.
  - Impact: 89% - packet generation creates the concrete artifact the workflow needs.
- **Acceptance:**
  - generator produces `fact-find.packet.json`, `analysis.packet.json`, and `plan.packet.json` from the canonical markdown artifacts,
  - packet content is source-derived and bounded,
  - `@acme/skill-runner` typecheck and lint pass.
- **Engineering Coverage:**
  - UI / visual: N/A - no user-facing UI
  - UX / states: Required - packets must preserve enough state for downstream stage routing
  - Security / privacy: Required - no runtime/system leakage; repo-source only
  - Logging / observability / audit: Required - packet path is canonical and auditable
  - Testing / validation: Required - targeted typecheck/lint and real packet generation
  - Data / contracts: Required - explicit packet schema/version and compact stage payloads
  - Performance / reliability: Required - compact payloads and stable regeneration
  - Rollout / rollback: Required - additive sidecar only
- **Validation contract (TC-01):**
  - TC-01-A: `pnpm --filter @acme/skill-runner typecheck`
  - TC-01-B: `pnpm --filter @acme/skill-runner lint`
  - TC-01-C: generator writes packet files for the persisted feature slug
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: targeted package typecheck/lint
  - Validation artifacts: generated packet files for this slug
  - Unexpected findings: none
- **Edge Cases & Hardening:** packet content must stay bounded and deterministic even when sections are missing

### TASK-02: Wire packet-first progressive disclosure into the workflow contract and stage skills
- **Type:** IMPLEMENT
- **Deliverable:** workflow contract and skill/doc updates
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-11)
- **Affects:** `docs/business-os/startup-loop/contracts/do-stage-handoff-packet-contract.md`, `docs/business-os/startup-loop/contracts/loop-output-contracts.md`, `docs/agents/feature-workflow-guide.md`, `.claude/skills/lp-do-ideas/SKILL.md`, `.claude/skills/lp-do-fact-find/SKILL.md`, `.claude/skills/lp-do-analysis/SKILL.md`, `.claude/skills/lp-do-plan/SKILL.md`, `.claude/skills/lp-do-build/SKILL.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 88%
  - Implementation: 89% - the docs are already centralized enough to update coherently.
  - Approach: 89% - one canonical packet contract is better than repeating semantics in every stage file.
  - Impact: 88% - this makes packet use the default rather than a hidden utility.
- **Acceptance:**
  - one canonical packet contract exists,
  - `loop-output-contracts.md` references the sidecars,
  - workflow guide and DO skills require packet generation and packet-first loading.
- **Engineering Coverage:**
  - UI / visual: N/A - no user-facing UI
  - UX / states: Required - load-order behavior is explicit and consistent
  - Security / privacy: Required - contract states packets are source-derived only
  - Logging / observability / audit: Required - packet telemetry input-path rules are explicit
  - Testing / validation: Required - skill instructions line up with generator/validator seams
  - Data / contracts: Required - one source of truth for packet semantics
  - Performance / reliability: Required - packet-first rule is explicit, not implied
  - Rollout / rollback: Required - markdown escalation rule remains documented
- **Validation contract (TC-02):**
  - TC-02-A: packet contract defines load order, envelope, and stage payload requirements
  - TC-02-B: workflow guide documents packet-first progressive disclosure and generator command
  - TC-02-C: DO stage skills mention packet generation/consumption in the correct stage order
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: diff review and artifact validation
  - Validation artifacts: updated contract/guide/skill files
  - Unexpected findings: none
- **Edge Cases & Hardening:** build wording must stay packet-first, not packet-only

### TASK-03: Persist the workflow artifact chain, emit real packet sidecars, and validate end to end
- **Type:** IMPLEMENT
- **Deliverable:** persisted workflow docs, packet sidecars, telemetry lines, and build record
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-11)
- **Affects:** `docs/plans/do-workflow-stage-handoff-packets/fact-find.md`, `docs/plans/do-workflow-stage-handoff-packets/analysis.md`, `docs/plans/do-workflow-stage-handoff-packets/plan.md`, `docs/plans/do-workflow-stage-handoff-packets/fact-find.packet.json`, `docs/plans/do-workflow-stage-handoff-packets/analysis.packet.json`, `docs/plans/do-workflow-stage-handoff-packets/plan.packet.json`, `docs/plans/do-workflow-stage-handoff-packets/critique-history.md`, `docs/plans/do-workflow-stage-handoff-packets/build-record.user.md`, `docs/business-os/startup-loop/ideas/trial/telemetry.jsonl`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** -
- **Confidence:** 89%
  - Implementation: 90% - once the generator and contract exist, the proof run is deterministic.
  - Approach: 89% - the persisted slug is the cleanest proof that the packets work in the real workflow.
  - Impact: 89% - packet artifacts and telemetry make the new handoff path visible and measurable.
- **Acceptance:**
  - the slug has canonical `fact-find`, `analysis`, `plan`, and `build-record` artifacts,
  - packet sidecars are generated for the three upstream stages,
  - validators pass and workflow telemetry records the packet paths for this slug.
- **Engineering Coverage:**
  - UI / visual: N/A - no user-facing UI
  - UX / states: Required - stage handoff behavior is proven in a real feature chain
  - Security / privacy: Required - packet files contain repo-derived data only
  - Logging / observability / audit: Required - telemetry summary includes packet-aware stage records
  - Testing / validation: Required - validators and generator commands pass
  - Data / contracts: Required - packet outputs match the documented contract
  - Performance / reliability: Required - generated packet files are stable and bounded
  - Rollout / rollback: Required - build record captures the additive packet path
- **Validation contract (TC-03):**
  - TC-03-A: `validate-fact-find.sh`, `validate-plan.sh`, and `validate-engineering-coverage.sh` pass for this slug
  - TC-03-B: packet-generation commands succeed for `fact-find.md`, `analysis.md`, and `plan.md`
  - TC-03-C: workflow telemetry records the packet paths for the analysis/plan/build stages
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: validators, packet generator commands, telemetry recorder/reporter, `git diff --check`
  - Validation artifacts: packet files and build-record summary
  - Unexpected findings: none
- **Edge Cases & Hardening:** build stage still escalates to the full plan task block when needed

## Risks & Mitigations
- Packet drift from markdown source
  - Mitigation: generator is deterministic and packets are regenerated after validators pass.
- Packet-first wording misread as packet-only
  - Mitigation: contract and build skill explicitly preserve on-demand full-markdown escalation.
- Packet bloat reduces the value of the optimization
  - Mitigation: compact field set, bounded summaries, and task briefs instead of full task blocks.

## Observability
- Logging: workflow telemetry records packet files via `--input-path` when they are part of stage context.
- Metrics: packet-aware slug summary reports context bytes, module count, and token coverage for the same workflow stream.
- Alerts/Dashboards: none; this is a local workflow proof rather than a production runtime surface.

## Validation Contracts
- TC-01: packet generator and wrapper compile/lint and produce bounded packet files
- TC-02: workflow contract and skills enforce packet-first loading consistently
- TC-03: the persisted feature slug validates and emits packet-aware workflow telemetry

## Open Decisions
None. The packet is additive and bounded; a larger runtime handoff system remains future work.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01 | Yes | None | No |
| TASK-02 | Yes | None | No |
| TASK-03 | Yes | None | No |

## Decision Log
- 2026-03-11: chose deterministic packet sidecars over docs-only guidance so progressive disclosure becomes measurable and repeatable.
- 2026-03-11: kept build packet-first rather than packet-only because task execution still needs the full task block on demand.

