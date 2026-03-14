---
Type: Plan
Status: Complete
Domain: Repo / Agents
Workstream: Engineering
Created: "2026-03-11"
Last-reviewed: "2026-03-11"
Last-updated: "2026-03-11"
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: do-workflow-hot-path-telemetry
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas, lp-do-fact-find, lp-do-analysis, lp-do-plan, lp-do-build, lp-do-critique
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/do-workflow-hot-path-telemetry/analysis.md
artifact: plan
---

# DO Workflow Hot-Path Telemetry Plan

## Summary
Add a deterministic hot-path telemetry layer to the DO workflow by extending the existing ideas telemetry stream with discriminated `workflow_step` records, adding a dedicated report command, wiring the stage skills/templates, and persisting a full workflow artifact set for this change.

## Active tasks
- [x] TASK-01: Add shared JSONL helper plus workflow-step telemetry recorder and reporter
- [x] TASK-02: Update contracts, templates, and workflow skills to emit/report telemetry
- [x] TASK-03: Persist workflow artifacts, record telemetry for this feature, and validate outputs

## Goals
- measure actual stage/module/context burden for the DO hot path,
- keep telemetry additive to the current ideas stream,
- provide a human-readable build summary for workflow telemetry.

## Non-goals
- full runtime interception of model token usage,
- queue schema redesign,
- changing non-DO workflows.

## Inherited Outcome Contract
- **Why:** The DO workflow now has better shared contracts, but token efficiency is still measured mostly by inference rather than stage-by-stage telemetry.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Add deterministic hot-path telemetry for the `lp-do-ideas -> lp-do-build` workflow, reusing the existing ideas telemetry stream and summarising stage/module/context cost.
- **Source:** operator

## Analysis Reference
- Related analysis: `docs/plans/do-workflow-hot-path-telemetry/analysis.md`
- Selected approach inherited:
  - shared append-only telemetry stream with discriminated `workflow_step` lines
  - canonical path inference for stage skill/artifact resolution
  - dedicated report command for JSON and markdown summaries

## Selected Approach Summary
- What was chosen:
  - build one deterministic recorder and one deterministic reporter,
  - refactor ideas JSONL append logic into a reusable helper,
  - wire fact-find, analysis, plan, and build around the new commands.
- Why planning did not reopen alternatives:
  - analysis already rejected a separate reporting system and prose-only reporting.

## Engineering Coverage
| Coverage Area | Planned handling | Task ownership |
|---|---|---|
| UI / visual | N/A: repo/process telemetry change only | TASK-02 |
| UX / states | record stage coverage and missing-stage gaps in the report | TASK-01, TASK-02 |
| Security / privacy | keep telemetry repo-local, minimal, and additive | TASK-01 |
| Logging / observability / audit | add `workflow_step` records and report summary | TASK-01, TASK-03 |
| Testing / validation | add unit tests and run targeted TS/lint/validators | TASK-01, TASK-03 |
| Data / contracts | extend telemetry schema additively and preserve rollup compatibility | TASK-01, TASK-02 |
| Performance / reliability | dedupe by telemetry key, infer canonical paths, tolerate missing context paths | TASK-01 |
| Rollout / rollback | additive rollout via docs + helper commands; existing rollups ignore unknown lines | TASK-02, TASK-03 |

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Tasks

### TASK-01: Shared telemetry helper and recorder
- **Type:** IMPLEMENT
- **Deliverable:** code-change in `scripts/src/startup-loop/ideas/`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-11)
- **Affects:** `scripts/src/startup-loop/ideas/ideas-jsonl.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-persistence.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry-report.ts`, `scripts/package.json`, `scripts/src/startup-loop/__tests__/lp-do-ideas-workflow-telemetry.test.ts`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 89%
  - Implementation: 90% - existing append-only persistence pattern was already available.
  - Approach: 90% - additive discriminated lines keep compatibility risk low.
  - Impact: 87% - captures real stage/module/context measurements; token counts remain partial.
- **Acceptance:**
  - recorder infers canonical artifact and stage skill paths from `stage + feature-slug`,
  - reporter summarises workflow-step records by stage,
  - append behavior is idempotent via deterministic telemetry key.
- **Engineering Coverage:**
  - UI / visual: N/A - no user-facing UI
  - UX / states: Required - report stage coverage and gaps
  - Security / privacy: Required - repo-local file telemetry only
  - Logging / observability / audit: Required - append-only workflow-step records
  - Testing / validation: Required - unit test file plus TS/lint validation
  - Data / contracts: Required - discriminated record contract and path inference
  - Performance / reliability: Required - dedupe, additive append, missing-path tolerance
  - Rollout / rollback: Required - additive CLI commands, safe to ignore by existing rollups
- **Validation contract (TC-01):**
  - TC-01: recorder creates deterministic `workflow_step` line with inferred artifact/skill paths
  - TC-02: duplicate append returns zero new records
  - TC-03: reporter summarises only workflow-step lines
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: `pnpm exec tsc -p scripts/tsconfig.json --noEmit`, targeted ESLint
  - Validation artifacts: telemetry JSONL file + report JSON/markdown output
  - Unexpected findings: none
- **Scouts:** None: deterministic extension only
- **Edge Cases & Hardening:** missing artifact or context paths are telemetry signals, not hard failures
- **What would make this >=90%:**
  - real runtime token counts integrated from agent/runtime usage
- **Rollout / rollback:**
  - Rollout: additive scripts + docs updates
  - Rollback: stop invoking recorder/reporter; existing telemetry stream remains parseable
- **Documentation impact:**
  - schema doc, workflow guide, skill docs, build-record template
- **Notes / references:**
  - existing ideas metrics runner ignores non-cycle telemetry lines safely

### TASK-02: Workflow contract and template wiring
- **Type:** IMPLEMENT
- **Deliverable:** docs/skill/template updates
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-11)
- **Affects:** `.claude/skills/lp-do-ideas/SKILL.md`, `.claude/skills/lp-do-fact-find/SKILL.md`, `.claude/skills/lp-do-analysis/SKILL.md`, `.claude/skills/lp-do-plan/SKILL.md`, `.claude/skills/lp-do-build/SKILL.md`, `docs/agents/feature-workflow-guide.md`, `docs/business-os/startup-loop/ideas/lp-do-ideas-telemetry.schema.md`, `docs/business-os/startup-loop/contracts/loop-output-contracts.md`, `docs/plans/_templates/build-record.user.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 88%
  - Implementation: 89% - single-source commands and sections are straightforward.
  - Approach: 90% - stage emit points already exist after validators/persistence.
  - Impact: 86% - adoption depends on agents following the new command path.
- **Acceptance:**
  - each downstream stage names the recorder command at its natural handoff point,
  - build-record template and contract include telemetry summary landing point,
  - ideas skill explains shared-stream relationship.
- **Engineering Coverage:**
  - UI / visual: N/A - no user-facing UI
  - UX / states: Required - stages record coverage and missing-stage gaps
  - Security / privacy: Required - docs reinforce minimal telemetry scope
  - Logging / observability / audit: Required - shared-stream telemetry doctrine documented
  - Testing / validation: Required - commands and summary landing point documented
  - Data / contracts: Required - schema and build-record contract updated
  - Performance / reliability: Required - additive stream compatibility documented
  - Rollout / rollback: Required - stage-local adoption path and rollback-by-nonuse
- **Validation contract (TC-02):**
  - TC-01: telemetry schema doc describes workflow-step lines and invariants
  - TC-02: workflow guide and stage skills reference recorder/reporter commands
  - TC-03: build-record template includes telemetry summary section
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: diff review, docs contract consistency
  - Validation artifacts: updated skill/docs/template files
  - Unexpected findings: none
- **Scouts:** None: bounded docs refactor
- **Edge Cases & Hardening:** None: additive documentation only
- **What would make this >=90%:**
  - one full future feature run using the new commands with measured token data
- **Rollout / rollback:**
  - Rollout: stage docs instruct agents to emit telemetry
  - Rollback: remove command references; telemetry lines remain harmless
- **Documentation impact:**
  - all touched docs are the documentation impact
- **Notes / references:**
  - build summary belongs in `build-record.user.md`

### TASK-03: Artifact persistence and telemetry proof
- **Type:** IMPLEMENT
- **Deliverable:** persisted workflow artifact set plus recorded telemetry lines and report summary
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-11)
- **Affects:** `docs/plans/do-workflow-hot-path-telemetry/fact-find.md`, `docs/plans/do-workflow-hot-path-telemetry/analysis.md`, `docs/plans/do-workflow-hot-path-telemetry/plan.md`, `docs/plans/do-workflow-hot-path-telemetry/build-record.user.md`, `docs/plans/do-workflow-hot-path-telemetry/critique-history.md`, `docs/business-os/startup-loop/ideas/trial/telemetry.jsonl`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 86% - validators and recorder commands are deterministic.
  - Approach: 88% - artifact set mirrors the established DO pattern.
  - Impact: 85% - current run proves the path end to end.
- **Acceptance:**
  - fact-find, analysis, plan, and build-record exist for this slug,
  - workflow-step telemetry lines are appended for the downstream stages used,
  - build-record contains telemetry summary output from the reporter.
- **Engineering Coverage:**
  - UI / visual: N/A - no user-facing UI
  - UX / states: Required - report shows which stages were covered and which were missing
  - Security / privacy: Required - telemetry remains repo-local and minimal
  - Logging / observability / audit: Required - actual workflow-step lines recorded
  - Testing / validation: Required - targeted validators and report command run
  - Data / contracts: Required - artifact and telemetry summary align with contracts
  - Performance / reliability: Required - report captures missing context paths and additive append behavior
  - Rollout / rollback: Required - current run serves as proof before wider reuse
- **Validation contract (TC-03):**
  - TC-01: `validate-fact-find.sh` passes for this slug
  - TC-02: `validate-plan.sh` and `validate-engineering-coverage.sh` pass for this slug artifacts
  - TC-03: telemetry report command returns summary for this slug
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: fact-find/plan/engineering coverage validators, TS/lint, telemetry record/report commands
  - Validation artifacts: build-record summary and telemetry JSONL line(s)
  - Unexpected findings: none
- **Scouts:** None: proof task only
- **Edge Cases & Hardening:** None: additive proof step
- **What would make this >=90%:**
  - a second independent feature run using the same telemetry commands
- **Rollout / rollback:**
  - Rollout: use same commands in future DO cycles
  - Rollback: stop recording workflow-step telemetry; stream remains valid
- **Documentation impact:**
  - build-record captures proof
- **Notes / references:**
  - current run is the first recorded proof of the new telemetry path

## Parallelism Guide
- Wave 1: TASK-01
- Wave 2: TASK-02
- Wave 3: TASK-03

## Validation Contracts
- TC-01: recorder/reporter/JSONL helper compile and lint cleanly
- TC-02: documentation and templates reference the telemetry commands consistently
- TC-03: workflow artifact set validates and telemetry summary is generated for this slug

## Open Decisions
None: analysis settled the architecture; only future runtime token-source integration remains as follow-on work.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01 | Yes | None | No |
| TASK-02 | Yes | None | No |
| TASK-03 | Yes | None | No |

## Decision Log
- 2026-03-11: kept workflow-step telemetry in the existing ideas stream rather than adding a separate file.
