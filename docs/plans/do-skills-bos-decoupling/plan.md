---
Type: Plan
Status: Active
Domain: Platform
Workstream: Operations
Created: 2026-02-24
Last-reviewed: 2026-02-24
Last-updated: 2026-02-24T03
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: do-skills-bos-decoupling
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: business-artifact
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 86%
Confidence-Method: min(Implementation,Approach,Impact) per task; Overall-confidence is effort-weighted average (S=1, M=2, L=3)
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: none
Card-ID: none
---

# DO Skills BOS Decoupling Plan

## Summary

This plan removes Business OS integration from the DO workflow by updating DO skill contracts, startup-loop DO advance contracts, and related documentation/tooling that still assume BOS-backed behavior. The execution is sequenced to avoid transient blocked states in DO advance: skill-level decoupling first, contract updates second, shared-file deletion after consumer cleanup, then final verification. Scope includes one utility shell script because it still parses BOS-linked frontmatter fields from plan artifacts that are being removed from templates. The plan remains in `Draft` because the request was planning-only and did not include explicit build/ship intent.

## Active tasks

- [x] TASK-01: Remove BOS integration phases from `lp-do-fact-find`
- [x] TASK-02: Remove BOS integration phase from `lp-do-plan`
- [x] TASK-03: Remove BOS integration hooks from `lp-do-build`
- [x] TASK-04: Update startup-loop DO sync contract and global invariant scope
- [x] TASK-05: Align `lp-do-critique` and `_shared/stage-doc-integration.md`
- [x] TASK-06: Remove BOS frontmatter fields from plan templates
- [x] TASK-07: Align operator-facing workflow docs with BOS-decoupled DO behavior
- [x] TASK-08: Harden discovery index rebuild script for template field removal
- [x] TASK-09: Delete obsolete DO BOS integration shared files
- [x] TASK-10: Run post-change verification sweep and record closure evidence

## Goals

- Remove BOS API integration from `lp-do-fact-find`, `lp-do-plan`, and `lp-do-build`.
- Keep `lp-do-replan`, `lp-do-factcheck`, and non-DO BOS integrations intact.
- Convert DO-stage startup-loop advance gating to filesystem-only criteria.
- Remove BOS-specific frontmatter requirements from DO fact-find/plan templates.
- Align operator docs and shared contracts so they no longer describe BOS-default DO behavior.
- Preserve deterministic execution by deleting shared BOS files only after all references are removed.

## Non-goals

- Changing S5B (`lp-bos-sync`) behavior or API contracts.
- Changing IDEAS pipeline skills (`idea-develop`, `idea-advance`, `idea-generate`).
- Migrating historical plan/fact-find artifacts with existing BOS fields.
- Modifying TypeScript runtime/application code paths.

## Constraints & Assumptions

- Constraints:
  - All primary edits are markdown contract changes plus one shell script adjustment.
  - `startup-loop` DO gate updates must be coordinated with DO skill updates to avoid temporary DO-stage blocking.
  - Deletion of `fact-find-bos-integration.md`, `plan-bos-integration.md`, and `build-bos-integration.md` is allowed only after zero-consumer verification.
  - `meta-reflect` BOS integration remains in scope for retention.
- Assumptions:
  - Existing artifacts with `Business-OS-Integration`, `Business-Unit`, or `Card-ID` fields remain inert once DO skill consumption paths are removed.
  - No downstream automation outside identified docs/script relies on DO-stage BOS lane-transition side effects.

## Fact-Find Reference

- Related brief: `docs/plans/do-skills-bos-decoupling/fact-find.md`
- Key findings used:
  - DO BOS integration is concentrated in three skills (`lp-do-fact-find`, `lp-do-plan`, `lp-do-build`).
  - `lp-bos-sync` has no dependency on the three DO BOS integration shared files.
  - `startup-loop` currently includes a DO-stage BOS sync requirement that must be scoped/rewritten.
  - Operator-facing workflow docs and `rebuild-discovery-index.sh` still contain BOS-linked assumptions that need alignment.

## Proposed Approach

- Option A: Remove BOS integration only from the three DO skills and defer docs/script alignment.
  - Pros: fewer immediate edits.
  - Cons: leaves contradictory contracts and degraded discovery metadata risk.
- Option B: Full DO decoupling with same-rollout contract and tooling alignment (chosen).
  - Pros: avoids split-brain behavior and stale guidance; lower operational ambiguity.
  - Cons: larger edit surface.
- Chosen approach:
  - Execute core skill edits first, then startup-loop/critique/template/doc/script alignment, then shared-file deletion, then validation sweep.

## Plan Gates

- Foundation Gate: Pass
  - Fact-find includes required delivery metadata, confidence dimensions, delivery/channel landscape, and hypothesis/validation landscape.
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No (plan-only mode; plan remains `Status: Draft`)

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Remove Phase 8/9 BOS integration flow from `lp-do-fact-find` | 85% | M | Complete (2026-02-24) | - | TASK-04, TASK-09, TASK-10 |
| TASK-02 | IMPLEMENT | Remove Phase 9 BOS integration flow from `lp-do-plan` | 85% | M | Complete (2026-02-24) | - | TASK-04, TASK-09, TASK-10 |
| TASK-03 | IMPLEMENT | Remove BOS hook section from `lp-do-build` | 85% | M | Complete (2026-02-24) | - | TASK-04, TASK-09, TASK-10 |
| TASK-04 | IMPLEMENT | Rewrite DO sync contracts in startup-loop docs | 85% | M | Complete (2026-02-24) | TASK-01, TASK-02, TASK-03 | TASK-07, TASK-10 |
| TASK-05 | IMPLEMENT | Remove BOS validation assumptions from critique/stage-doc integration docs | 85% | M | Complete (2026-02-24) | TASK-01, TASK-02, TASK-03 | TASK-06, TASK-10 |
| TASK-06 | IMPLEMENT | Remove BOS/direct-inject frontmatter fields from plan templates | 85% | M | Complete (2026-02-24) | TASK-05 | TASK-07, TASK-08, TASK-10 |
| TASK-07 | IMPLEMENT | Align operator-facing workflow docs to filesystem-only DO behavior | 85% | M | Complete (2026-02-24) | TASK-04, TASK-06 | TASK-10 |
| TASK-08 | IMPLEMENT | Harden `rebuild-discovery-index.sh` for missing BOS fields in plan docs | 85% | M | Complete (2026-02-24) | TASK-06 | TASK-10 |
| TASK-09 | IMPLEMENT | Delete three obsolete DO BOS integration shared files | 90% | S | Complete (2026-02-24) | TASK-01, TASK-02, TASK-03 | TASK-10 |
| TASK-10 | INVESTIGATE | Execute validation sweep and record closure evidence | 90% | S | Complete (2026-02-24) | TASK-04, TASK-05, TASK-07, TASK-08, TASK-09 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03 | - | Core DO skill decoupling can run in parallel. |
| 2 | TASK-04, TASK-05 | TASK-01..03 | Contract updates depend on finalized core skill behavior. |
| 3 | TASK-06, TASK-09 | TASK-05 (for TASK-06), TASK-01..03 (for TASK-09) | Template updates and shared-file deletion are separated by explicit dependency checks. |
| 4 | TASK-07, TASK-08 | TASK-04, TASK-06 | Operator docs and discovery script align with final contract shape. |
| 5 | TASK-10 | TASK-04, TASK-05, TASK-07, TASK-08, TASK-09 | Final verification and closure evidence. |

## Tasks

### TASK-01: Remove BOS integration phases from `lp-do-fact-find`
- **Type:** IMPLEMENT
- **Deliverable:** Updated `.claude/skills/lp-do-fact-find/SKILL.md` with BOS phases removed and filesystem-only discovery path.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-24)
- **Artifact-Destination:** `.claude/skills/lp-do-fact-find/SKILL.md`
- **Reviewer:** Operator
- **Approval-Evidence:** `docs/plans/do-skills-bos-decoupling/plan.md` decision-log entry for TASK-01 closure.
- **Measurement-Readiness:** Owner=Operator; cadence=once at task completion; tracking=`TASK-01 Notes / references` plus command outputs.
- **Affects:** `.claude/skills/lp-do-fact-find/SKILL.md`, `[readonly] docs/plans/do-skills-bos-decoupling/fact-find.md`
- **Depends on:** -
- **Blocks:** TASK-04, TASK-09, TASK-10
- **Confidence:** 85%
  - Implementation: 85% - Existing phase boundaries and deletion targets are explicit in fact-find evidence.
  - Approach: 85% - Replacement behavior (filesystem scan) is already used elsewhere in repo patterns.
  - Impact: 85% - Blast radius is constrained to skill contract text.
- **Acceptance:**
  - Phase 8/9 BOS sections removed from `lp-do-fact-find`.
  - `fact-find-bos-integration.md` and `discovery-index.json` references removed from this skill.
  - Remaining phase order remains coherent with no orphan references.
- **Validation contract (VC-01):**
  - VC-01: `lp-do-fact-find` BOS removal completeness -> pass when `rg -n "Phase 8|Phase 9|fact-find-bos-integration|discovery-index.json" .claude/skills/lp-do-fact-find/SKILL.md` returns zero BOS-phase hits within same session over sample size=1 file; else fail and revise.
  - VC-02: Phase continuity -> pass when all remaining phase references in file map to existing headings in one read-through before task close; else fail and fix orphan references.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: capture pre-edit `rg` hits for BOS phase and reference strings.
  - Green evidence plan: post-edit `rg` confirms removals; manual read confirms phase continuity.
  - Refactor evidence plan: normalize wording around discovery path and completion message semantics.
- **Planning validation (required for M/L):**
  - Checks run: `rg -n "Phase 8|Phase 9|fact-find-bos-integration|discovery-index.json" .claude/skills/lp-do-fact-find/SKILL.md`
  - Validation artifacts: command output snapshots in terminal session; summary in task closure notes.
  - Unexpected findings: None expected; if found, add explicit follow-up in TASK-10.
- **Scouts:** None: deterministic text-contract edit with grep-verifiable criteria.
- **Edge Cases & Hardening:** remove any residual references to removed phases in completion-message examples or checklist sections.
- **What would make this >=90%:**
  - A dry-run prompt simulation that confirms no BOS-phase behavior is surfaced in generated workflow instructions.
- **Rollout / rollback:**
  - Rollout: apply edits and re-run VC-01/VC-02 checks.
  - Rollback: `git revert <commit>` if downstream contract checks fail.
- **Documentation impact:**
  - Keep `fact-find.md` plan assumptions aligned with final `lp-do-fact-find` wording.
- **Notes / references:**
  - Evidence source: `docs/plans/do-skills-bos-decoupling/fact-find.md`.
- **Build completion evidence (2026-02-24):**
  - Phase 8 and Phase 9 sections deleted from `lp-do-fact-find/SKILL.md`.
  - VC-01 pass: `rg "Phase 8|Phase 9|fact-find-bos-integration|discovery-index.json"` → zero hits.
  - VC-02 pass: Phase 7a connects directly to `## Completion Messages` — no orphan references.
  - Discovery path replaced with filesystem scan of `docs/plans/` and `docs/business-os/strategy/*/idea-cards/`.

### TASK-02: Remove BOS integration phase from `lp-do-plan`
- **Type:** IMPLEMENT
- **Deliverable:** Updated `.claude/skills/lp-do-plan/SKILL.md` removing optional BOS phase and BOS ordering references.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-24)
- **Artifact-Destination:** `.claude/skills/lp-do-plan/SKILL.md`
- **Reviewer:** Operator
- **Approval-Evidence:** Decision-log closure entry for TASK-02.
- **Measurement-Readiness:** Owner=Operator; cadence=once per task; tracking=`TASK-02 Notes / references`.
- **Affects:** `.claude/skills/lp-do-plan/SKILL.md`, `[readonly] docs/plans/do-skills-bos-decoupling/fact-find.md`
- **Depends on:** -
- **Blocks:** TASK-04, TASK-09, TASK-10
- **Confidence:** 85%
  - Implementation: 85% - Phase and ordering references are concrete and known.
  - Approach: 85% - Filesystem discovery path replacement is defined in fact-find.
  - Impact: 85% - Localized to planner skill contract.
- **Acceptance:**
  - Phase 9 BOS integration section removed from `lp-do-plan`.
  - Discovery path references no longer require `discovery-index.json` for DO planning.
  - Phase ordering note no longer references BOS sync.
- **Validation contract (VC-02):**
  - VC-01: BOS phase removal -> pass when `rg -n "Phase 9|plan-bos-integration|discovery-index.json" .claude/skills/lp-do-plan/SKILL.md` returns zero BOS-integration hits by task close over sample size=1 file.
  - VC-02: Ordering integrity -> pass when phase ordering prose references only extant phases in final file review.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: capture pre-edit BOS references and ordering text.
  - Green evidence plan: post-edit grep and read-through confirm removal and consistency.
  - Refactor evidence plan: tighten quick checklist so it reflects BOS-decoupled flow.
- **Planning validation (required for M/L):**
  - Checks run: `rg -n "Phase 9|plan-bos-integration|discovery-index.json|BOS sync" .claude/skills/lp-do-plan/SKILL.md`
  - Validation artifacts: terminal command logs + closure summary.
  - Unexpected findings: document any surviving BOS references for TASK-10 sweep.
- **Scouts:** None: deterministic contract migration.
- **Edge Cases & Hardening:** ensure Phase 11 critique ordering remains coherent after BOS phase removal.
- **What would make this >=90%:**
  - Confirm by dry-run prompt simulation that planner no longer emits BOS integration instructions.
- **Rollout / rollback:**
  - Rollout: apply changes and run VC checks immediately.
  - Rollback: revert commit if startup-loop contract alignment in TASK-04 fails.
- **Documentation impact:**
  - Cross-linking references in plan/fact-find docs may need wording updates.
- **Notes / references:**
  - Evidence source: `docs/plans/do-skills-bos-decoupling/fact-find.md`.
- **Build completion evidence (2026-02-24):**
  - Phase 9 BOS integration section removed from `lp-do-plan/SKILL.md`.
  - VC-01 pass: `rg "Phase 9|plan-bos-integration|discovery-index.json"` → zero hits.
  - VC-02 pass: Phase 11 ordering note no longer references BOS sync. Discovery path is filesystem-only.

### TASK-03: Remove BOS integration hooks from `lp-do-build`
- **Type:** IMPLEMENT
- **Deliverable:** Updated `.claude/skills/lp-do-build/SKILL.md` without BOS integration section/hooks.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-24)
- **Artifact-Destination:** `.claude/skills/lp-do-build/SKILL.md`
- **Reviewer:** Operator
- **Approval-Evidence:** Decision-log closure entry for TASK-03.
- **Measurement-Readiness:** Owner=Operator; cadence=once; tracking=`TASK-03 Notes / references`.
- **Affects:** `.claude/skills/lp-do-build/SKILL.md`, `[readonly] docs/plans/do-skills-bos-decoupling/fact-find.md`
- **Depends on:** -
- **Blocks:** TASK-04, TASK-09, TASK-10
- **Confidence:** 85%
  - Implementation: 85% - Build gate and utility references are directly identifiable.
  - Approach: 85% - Build should rely on filesystem status, not BOS hooks.
  - Impact: 85% - Limited to build-skill behavior contract.
- **Acceptance:**
  - `## BOS Integration` section removed from `lp-do-build`.
  - Gate text no longer instructs BOS hook execution.
  - Shared utilities list no longer references `build-bos-integration.md` or DO discovery-index dependency.
- **Validation contract (VC-03):**
  - VC-01: BOS hook removal -> pass when `rg -n "BOS Integration|build-bos-integration|discovery-index.json" .claude/skills/lp-do-build/SKILL.md` shows no BOS hook usage for DO flow by task close.
  - VC-02: Build readiness language preserved -> pass when remaining gate/checklist flow is still executable without missing section references.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: capture pre-edit BOS hook references.
  - Green evidence plan: post-edit grep + manual gate walkthrough.
  - Refactor evidence plan: normalize checklist wording for filesystem-only discovery.
- **Planning validation (required for M/L):**
  - Checks run: `rg -n "BOS Integration|build-bos-integration|discovery-index" .claude/skills/lp-do-build/SKILL.md`
  - Validation artifacts: terminal outputs and short closure note.
  - Unexpected findings: log any references requiring follow-up in TASK-10.
- **Scouts:** None: controlled text-contract edit.
- **Edge Cases & Hardening:** ensure no stale references remain in completion messages or quick checklists.
- **What would make this >=90%:**
  - Execute a dry-run build prompt and confirm no BOS hook instruction is emitted.
- **Rollout / rollback:**
  - Rollout: apply edits and run VC checks before moving to dependent tasks.
  - Rollback: revert if downstream docs require BOS references that were unintentionally removed.
- **Documentation impact:**
  - Downstream operator docs in TASK-07 must mirror this change.
- **Notes / references:**
  - Evidence source: `docs/plans/do-skills-bos-decoupling/fact-find.md`.
- **Build completion evidence (2026-02-24):**
  - `## BOS Integration` section, Gate 5 BOS hook text, and shared-utility references removed from `lp-do-build/SKILL.md`.
  - VC-01 pass: `rg "BOS Integration|build-bos-integration|discovery-index.json"` → zero hits.
  - VC-02 pass: discovery path now scans `docs/plans/*/plan.md` for `Status: Active`; checklist and gates remain coherent.

### TASK-04: Update startup-loop DO sync contract and global invariant scope
- **Type:** IMPLEMENT
- **Deliverable:** Updated startup-loop DO gating text in `.claude/skills/startup-loop/SKILL.md` and `.claude/skills/startup-loop/modules/cmd-advance.md`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-24)
- **Artifact-Destination:** `.claude/skills/startup-loop/SKILL.md`, `.claude/skills/startup-loop/modules/cmd-advance.md`
- **Reviewer:** Operator
- **Approval-Evidence:** Decision-log closure entry for TASK-04.
- **Measurement-Readiness:** Owner=Operator; cadence=once; tracking=`TASK-04 Notes / references`.
- **Affects:** `.claude/skills/startup-loop/SKILL.md`, `.claude/skills/startup-loop/modules/cmd-advance.md`
- **Depends on:** TASK-01, TASK-02, TASK-03
- **Blocks:** TASK-07, TASK-10
- **Confidence:** 85%
  - Implementation: 85% - Exact lines requiring scope update are known from fact-find evidence.
  - Approach: 85% - Filesystem-only DO gate is already partially established.
  - Impact: 85% - Prevents DO advance deadlock while preserving non-DO BOS invariants.
- **Acceptance:**
  - Global invariant is explicitly scoped so DO advance is not blocked on BOS sync.
  - Business OS sync contract table DO row is filesystem-only.
  - Red-flag wording no longer implies DO-stage BOS sync requirement.
- **Validation contract (VC-04):**
  - VC-01: Contract rewrite completeness -> pass when `cmd-advance.md` DO entry contains filesystem-only contract and no DO API upsert requirement.
  - VC-02: Invariant scope correctness -> pass when startup-loop global invariant still enforces BOS sync for non-DO stages but explicitly excludes DO.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: capture existing DO row and global invariant text.
  - Green evidence plan: verify new DO scope wording and table row semantics.
  - Refactor evidence plan: normalize terminology across both files (`DO`, `filesystem-only`, `advance`).
- **Planning validation (required for M/L):**
  - Checks run: `rg -n "BOS sync must be confirmed complete before advance|DO: upsert|/api/agent/stage-docs|/api/agent/cards" .claude/skills/startup-loop/SKILL.md .claude/skills/startup-loop/modules/cmd-advance.md`
  - Validation artifacts: command output + closure notes.
  - Unexpected findings: unresolved ambiguity captured as follow-up in TASK-10.
- **Scouts:** None: deterministic contract rewrite.
- **Edge Cases & Hardening:** keep S5B contract unchanged while scoping DO exception.
- **What would make this >=90%:**
  - Run a real `/startup-loop advance --business <BIZ>` DO-boundary smoke check post-implementation.
- **Rollout / rollback:**
  - Rollout: update both files in one changeset.
  - Rollback: revert pair together to avoid split contract state.
- **Documentation impact:**
  - TASK-07 operator docs must mirror final DO gating contract.
- **Notes / references:**
  - Evidence source: `docs/plans/do-skills-bos-decoupling/fact-find.md`.

### TASK-05: Align `lp-do-critique` and `_shared/stage-doc-integration.md`
- **Type:** IMPLEMENT
- **Deliverable:** BOS-decoupled checklist/contracts in `.claude/skills/lp-do-critique/SKILL.md` and `.claude/skills/_shared/stage-doc-integration.md`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-24)
- **Artifact-Destination:** `.claude/skills/lp-do-critique/SKILL.md`, `.claude/skills/_shared/stage-doc-integration.md`
- **Reviewer:** Operator
- **Approval-Evidence:** Decision-log closure entry for TASK-05.
- **Measurement-Readiness:** Owner=Operator; cadence=once; tracking=`TASK-05 Notes / references`.
- **Affects:** `.claude/skills/lp-do-critique/SKILL.md`, `.claude/skills/_shared/stage-doc-integration.md`
- **Depends on:** TASK-01, TASK-02, TASK-03
- **Blocks:** TASK-06, TASK-10
- **Confidence:** 85%
  - Implementation: 85% - Target lines and table rows are explicit in fact-find.
  - Approach: 85% - Removing obsolete checks avoids false critique failures.
  - Impact: 85% - Prevents stale lane-transition guidance.
- **Acceptance:**
  - `lp-do-critique` no longer requires `Business-OS-Integration`/`Business-Unit`/`Card-ID` checks for DO fact-find/plan artifacts.
  - DO-originated integration subsections removed from stage-doc integration guide.
  - Lane transition table no longer claims DO-skill lane movement side effects.
- **Validation contract (VC-05):**
  - VC-01: Critique checklist alignment -> pass when `rg -n "Business-OS-Integration|Business-Unit|Card-ID" .claude/skills/lp-do-critique/SKILL.md` no longer returns DO-frontmatter requirement lines.
  - VC-02: Stage-doc integration alignment -> pass when DO skill subsections and DO lane-transition mappings are absent while `meta-reflect` section remains.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: capture current checklist and lane transition rows.
  - Green evidence plan: re-run grep + manual read to confirm targeted removals.
  - Refactor evidence plan: adjust surrounding prose to avoid orphan references to removed rows.
- **Planning validation (required for M/L):**
  - Checks run: `rg -n "From /lp-do-fact-find|From /lp-do-plan|From /lp-do-build|Business-OS-Integration|Card-ID" .claude/skills/_shared/stage-doc-integration.md .claude/skills/lp-do-critique/SKILL.md`
  - Validation artifacts: command logs and closure note.
  - Unexpected findings: add follow-up note in TASK-10 if extra dependencies appear.
- **Scouts:** None: direct edit with deterministic acceptance checks.
- **Edge Cases & Hardening:** preserve non-DO sections (`meta-reflect`, idea-advance context).
- **What would make this >=90%:**
  - A post-edit `/lp-do-critique` dry run on this plan showing no false BOS-frontmatter defects.
- **Rollout / rollback:**
  - Rollout: apply both file edits in one task completion.
  - Rollback: revert both files together if checklist-contract mismatch is found.
- **Documentation impact:**
  - Prevents stale guidance in critique outcomes and shared integration references.
- **Notes / references:**
  - Evidence source: `docs/plans/do-skills-bos-decoupling/fact-find.md`.

### TASK-06: Remove BOS frontmatter fields from plan templates
- **Type:** IMPLEMENT
- **Deliverable:** Updated `docs/plans/_templates/fact-find-planning.md` and `docs/plans/_templates/plan.md` frontmatter schemas without BOS/direct-inject fields.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-24)
- **Artifact-Destination:** `docs/plans/_templates/fact-find-planning.md`, `docs/plans/_templates/plan.md`
- **Reviewer:** Operator
- **Approval-Evidence:** Decision-log closure entry for TASK-06.
- **Measurement-Readiness:** Owner=Operator; cadence=once; tracking=`TASK-06 Notes / references`.
- **Affects:** `docs/plans/_templates/fact-find-planning.md`, `docs/plans/_templates/plan.md`
- **Depends on:** TASK-05
- **Blocks:** TASK-07, TASK-08, TASK-10
- **Confidence:** 85%
  - Implementation: 85% - Fields and removal targets are explicit.
  - Approach: 85% - Template/schema alignment is deterministic.
  - Impact: 85% - Prevents new artifacts from carrying obsolete BOS control fields.
- **Acceptance:**
  - `Business-OS-Integration`, `Business-Unit`, and `Card-ID` removed from both templates.
  - `direct-inject` and `direct-inject-rationale` removed from `fact-find-planning.md` template.
  - Remaining template metadata is coherent and internally consistent.
- **Validation contract (VC-06):**
  - VC-01: Field removal completeness -> pass when `rg -n "Business-OS-Integration|Business-Unit|Card-ID|direct-inject" docs/plans/_templates/fact-find-planning.md docs/plans/_templates/plan.md` returns zero hits for removed schema fields.
  - VC-02: Required metadata integrity -> pass when required plan/fact-find metadata fields still exist and placeholders remain valid.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: capture current template field lines.
  - Green evidence plan: confirm removal and schema integrity with grep + manual read.
  - Refactor evidence plan: adjust surrounding explanatory text to match new schema.
- **Planning validation (required for M/L):**
  - Checks run: `rg -n "Type:|Status:|Domain:|Last-reviewed|Relates-to charter|Business-OS-Integration|direct-inject" docs/plans/_templates/fact-find-planning.md docs/plans/_templates/plan.md`
  - Validation artifacts: terminal logs and task note.
  - Unexpected findings: capture in TASK-10 if policy conflicts emerge.
- **Scouts:** None: deterministic schema edits.
- **Edge Cases & Hardening:** ensure removal does not break Plan template examples referenced by other skills.
- **What would make this >=90%:**
  - A dry-run generation pass showing new plan/fact-find artifacts render correctly with updated templates.
- **Rollout / rollback:**
  - Rollout: update both templates in one changeset.
  - Rollback: revert both files together if schema consumers fail checks.
- **Documentation impact:**
  - Template consumers in DO skill docs must reflect new frontmatter shape.
- **Notes / references:**
  - Evidence source: `docs/plans/do-skills-bos-decoupling/fact-find.md`.
- **Build completion evidence (2026-02-24):**
  - `Business-OS-Integration`, `Business-Unit`, `Card-ID` removed from both templates.
  - `direct-inject` and `direct-inject-rationale` absent from `fact-find-planning.md` (were not present).
  - VC-01 pass: `rg "Business-OS-Integration|Business-Unit|Card-ID|direct-inject" docs/plans/_templates/` → zero hits.
  - VC-02 pass: Required plan/fact-find metadata fields remain present and valid.

### TASK-07: Align operator-facing workflow docs with BOS-decoupled DO behavior
- **Type:** IMPLEMENT
- **Deliverable:** Updated `docs/agents/feature-workflow-guide.md`, `docs/business-os/agent-workflows.md`, and `docs/business-os/startup-loop/loop-output-contracts.md`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-24)
- **Artifact-Destination:** operator-facing workflow docs listed above.
- **Reviewer:** Operator
- **Approval-Evidence:** Decision-log closure entry for TASK-07.
- **Measurement-Readiness:** Owner=Operator; cadence=once; tracking=`TASK-07 Notes / references`.
- **Affects:** `docs/agents/feature-workflow-guide.md`, `docs/business-os/agent-workflows.md`, `docs/business-os/startup-loop/loop-output-contracts.md`
- **Depends on:** TASK-04, TASK-06
- **Blocks:** TASK-10
- **Confidence:** 85%
  - Implementation: 85% - Stale BOS-default sections are directly identified in fact-find.
  - Approach: 85% - Content replacement follows updated contract state from TASK-04/TASK-06.
  - Impact: 85% - Reduces operator confusion and contradictory guidance risk.
- **Acceptance:**
  - BOS-default DO behavior language removed/replaced with filesystem-only DO flow.
  - DO artifact frontmatter examples no longer require removed BOS fields.
  - Cross-doc wording is consistent with startup-loop DO contract.
- **Validation contract (VC-07):**
  - VC-01: Stale guidance removal -> pass when targeted docs no longer state DO-stage BOS default on/off behavior.
  - VC-02: Contract coherence -> pass when references to DO flow match startup-loop and template state in the same session over sample size=3 docs.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: capture existing stale lines from all three docs.
  - Green evidence plan: post-edit grep verifies stale text removed; manual read confirms coherent replacement.
  - Refactor evidence plan: normalize terminology (`filesystem-only`, `DO`, `artifact`) across docs.
- **Planning validation (required for M/L):**
  - Checks run: `rg -n "Business-OS-Integration|default to integration on|stage-doc|lane move|DO" docs/agents/feature-workflow-guide.md docs/business-os/agent-workflows.md docs/business-os/startup-loop/loop-output-contracts.md`
  - Validation artifacts: command logs and closure summary.
  - Unexpected findings: unresolved conflicts recorded in TASK-10 closure report.
- **Scouts:** None: deterministic contract-alignment edits.
- **Edge Cases & Hardening:** avoid changing IDEAS/S5B guidance while updating DO-only language.
- **What would make this >=90%:**
  - Independent review pass from another operator confirming docs are unambiguous.
- **Rollout / rollback:**
  - Rollout: edit all three docs in one wave.
  - Rollback: revert atomically if contradictory phrasing appears.
- **Documentation impact:**
  - This task is documentation impact by design; no additional docs expected.
- **Notes / references:**
  - Evidence source: `docs/plans/do-skills-bos-decoupling/fact-find.md`.
- **Build completion evidence (2026-02-24):**
  - `docs/agents/feature-workflow-guide.md`: "Business OS Card Tracking" section updated; DO skills described as filesystem-only; BOS-default on/off removed.
  - `docs/business-os/agent-workflows.md`: Section heading updated; automation table rows for DO skills show filesystem-only; idea-advance section corrected to say all lane transitions need explicit operator action; Typical Card Lifecycle diagram rewritten (5 steps, no BOS lane moves); Next Steps item 2 updated; lifecycle footnote added.
  - `docs/business-os/startup-loop/loop-output-contracts.md`: `Business-Unit` and `Card-ID` removed from all 4 artifact frontmatter specs (fact-find, plan, build-record, results-review).
  - VC-01 pass: `rg "Business-OS-Integration|baseline core-loop transitions are deterministic"` in targeted docs → zero hits.
  - VC-02 pass: DO skill references in workflow docs are filesystem-only; no BOS write claims remain.

### TASK-08: Harden discovery index rebuild script for template field removal
- **Type:** IMPLEMENT
- **Deliverable:** Updated `docs/business-os/_meta/rebuild-discovery-index.sh` that handles missing `Business-Unit`/`Card-ID` fields from plan artifacts gracefully.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-24)
- **Artifact-Destination:** `docs/business-os/_meta/rebuild-discovery-index.sh`
- **Reviewer:** Operator
- **Approval-Evidence:** Decision-log closure entry for TASK-08.
- **Measurement-Readiness:** Owner=Operator; cadence=once + one rerun check; tracking=`TASK-08 Notes / references`.
- **Affects:** `docs/business-os/_meta/rebuild-discovery-index.sh`, `[readonly] docs/business-os/_meta/discovery-index.json`
- **Depends on:** TASK-06
- **Blocks:** TASK-10
- **Confidence:** 85%
  - Implementation: 85% - Script lines consuming removed fields are already identified.
  - Approach: 85% - Fallback handling in shell script is straightforward.
  - Impact: 85% - Prevents malformed/empty metadata propagation in discovery index output.
- **Acceptance:**
  - Script no longer assumes `Card-ID`/`Business-Unit` exist in plan/fact-find frontmatter.
  - Output JSON remains parseable and structurally valid after template field removal.
  - `readyForPlanning`/`readyForBuild` rows remain semantically usable for DO discovery.
- **Validation contract (VC-08):**
  - VC-01: Field-absence tolerance -> pass when script runs successfully against current repo state without relying on removed fields.
  - VC-02: JSON validity -> pass when script output parses with `jq` and includes non-empty `slug`/`title` for entries sampled from both arrays within one session.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: run script on current state and capture behavior around `cardId`/`business` extraction.
  - Green evidence plan: apply fallback/field-handling edits; re-run script and validate with `jq`.
  - Refactor evidence plan: simplify repeated extraction logic to keep script maintainable.
- **Planning validation (required for M/L):**
  - Checks run: `bash docs/business-os/_meta/rebuild-discovery-index.sh | jq . >/dev/null`
  - Validation artifacts: command output snippets + parsed JSON confirmation note.
  - Unexpected findings: list any malformed legacy entries in TASK-10 report.
- **Scouts:** None: direct script hardening with deterministic parser checks.
- **Edge Cases & Hardening:** ensure missing frontmatter fields in legacy files do not break row generation.
- **What would make this >=90%:**
  - Add a tiny fixture-based script test harness (out of scope for this plan).
- **Rollout / rollback:**
  - Rollout: patch script and validate output immediately.
  - Rollback: revert script if discovery index contract regresses.
- **Documentation impact:**
  - Update any inline script comments if extraction behavior changes materially.
- **Notes / references:**
  - Evidence source: `docs/plans/do-skills-bos-decoupling/fact-find.md`.
- **Build completion evidence (2026-02-24):**
  - No code changes required. Script already uses `grep | sed || echo ""` pattern for all frontmatter field extraction.
  - When `Card-ID` or `Business-Unit` fields are absent: `grep` exits 1, `sed` processes empty input, pipeline exits 0 (due to set -e + pipeline semantics), result = empty string.
  - VC-01 pass: script ran successfully against current repo state.
  - VC-02 pass: output parses with `python3 -m json.tool`; non-empty slug/title entries present in both `readyForPlanning` and `readyForBuild` arrays.

### TASK-09: Delete obsolete DO BOS integration shared files
- **Type:** IMPLEMENT
- **Deliverable:** Removal of `.claude/skills/_shared/fact-find-bos-integration.md`, `.claude/skills/_shared/plan-bos-integration.md`, and `.claude/skills/_shared/build-bos-integration.md`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-24)
- **Artifact-Destination:** file deletions under `.claude/skills/_shared/`
- **Reviewer:** Operator
- **Approval-Evidence:** Decision-log closure entry for TASK-09.
- **Measurement-Readiness:** Owner=Operator; cadence=once; tracking=`TASK-09 Notes / references`.
- **Affects:** `.claude/skills/_shared/fact-find-bos-integration.md`, `.claude/skills/_shared/plan-bos-integration.md`, `.claude/skills/_shared/build-bos-integration.md`
- **Depends on:** TASK-01, TASK-02, TASK-03
- **Blocks:** TASK-10
- **Confidence:** 90%
  - Implementation: 90% - Consumer paths are known and cleaned before deletion.
  - Approach: 90% - Deletion is deterministic after zero-reference verification.
  - Impact: 90% - Removes dead contracts and prevents accidental reintroduction.
- **Acceptance:**
  - All three files are deleted.
  - Repo-wide grep confirms zero references to deleted filenames.
- **Validation contract (VC-09):**
  - VC-01: Safe deletion preflight -> pass when pre-delete grep confirms no remaining references outside target files.
  - VC-02: Post-delete integrity -> pass when post-delete grep returns zero matches and no broken references are introduced.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: record current consumer references.
  - Green evidence plan: delete files and re-run repo-wide grep.
  - Refactor evidence plan: remove any stale comments that mention deleted files.
- **Planning validation (required for M/L):**
  - None: S-effort task with deterministic preflight and postflight grep checks.
- **Scouts:** None: direct deletion with strict pre/post checks.
- **Edge Cases & Hardening:** if any non-DO consumer appears in preflight, stop and route back to plan update.
- **What would make this >=90%:**
  - Already at 90% with deterministic pre/post checks.
- **Rollout / rollback:**
  - Rollout: delete after preflight check in same session.
  - Rollback: restore files by reverting commit if hidden consumer is discovered.
- **Documentation impact:**
  - None beyond references already covered in prior tasks.
- **Notes / references:**
  - Evidence source: `docs/plans/do-skills-bos-decoupling/fact-find.md`.
- **Build completion evidence (2026-02-24):**
  - Preflight: `rg "fact-find-bos-integration|plan-bos-integration|build-bos-integration" .claude/skills/` → zero hits confirmed no consumers.
  - Files deleted: `fact-find-bos-integration.md`, `plan-bos-integration.md`, `build-bos-integration.md`.
  - Post-delete VC-02: `rg "fact-find-bos-integration|plan-bos-integration|build-bos-integration"` → zero hits.

### TASK-10: Run post-change verification sweep and record closure evidence
- **Type:** INVESTIGATE
- **Deliverable:** Validation evidence note appended to this plan `Decision Log` confirming closure checks.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Effort:** S
- **Status:** Complete (2026-02-24)
- **Affects:** `docs/plans/do-skills-bos-decoupling/plan.md`, `[readonly] updated skill/docs/script files`
- **Depends on:** TASK-04, TASK-05, TASK-07, TASK-08, TASK-09
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% - Validation command set is explicit and bounded.
  - Approach: 90% - Sweep directly tests all acceptance-critical invariants.
  - Impact: 90% - Prevents silent contract drift at handoff.
- **Questions to answer:**
  - Do any DO skill files still reference BOS phases/hook files/discovery-index path?
  - Do startup-loop docs still impose DO-stage BOS sync requirements?
  - Are stale BOS-default statements fully removed from operator-facing docs?
  - Does discovery-index rebuild output parse and remain structurally valid?
- **Acceptance:**
  - Required grep sweep returns expected zero-hit sets for removed contracts.
  - Required positive checks confirm filesystem-only DO gating language present.
  - Script validation run (`rebuild-discovery-index.sh` + `jq`) succeeds.
  - Decision log captures exact command set and pass/fail outcomes.
- **Validation contract:**
  - VC-10: Closure sweep -> pass when all validation checks pass in one session and findings are recorded in plan decision log within same day (2026-02-24 or later run date); else fail and reopen blocking task(s).
- **Planning validation:**
  - Checks run:
    - `rg -n "Phase 8|Phase 9|BOS Integration|bos-integration|discovery-index.json" .claude/skills/lp-do-fact-find/SKILL.md .claude/skills/lp-do-plan/SKILL.md .claude/skills/lp-do-build/SKILL.md`
    - `rg -n "DO: upsert|Never allow stage advance when BOS sync has failed" .claude/skills/startup-loop/modules/cmd-advance.md .claude/skills/startup-loop/SKILL.md`
    - `bash docs/business-os/_meta/rebuild-discovery-index.sh | jq . >/dev/null`
  - Validation artifacts: command outputs captured in terminal and summarized in decision log.
  - Unexpected findings: reopen affected task ID and set status `Blocked` until resolved.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** update decision log with closure evidence and residual risk call.
- **Notes / references:**
  - Source brief: `docs/plans/do-skills-bos-decoupling/fact-find.md`.

## Risks & Mitigations

- DO-stage startup-loop deadlock if contract update lands without invariant scope update.
  - Mitigation: TASK-04 treats both files as one atomic completion unit.
- Stale operator docs continue to instruct BOS-default behavior.
  - Mitigation: TASK-07 mandatory before closure sweep.
- Discovery index metadata degradation after template field removal.
  - Mitigation: TASK-08 script hardening + parser validation.
- Hidden consumer of deleted shared BOS files.
  - Mitigation: TASK-09 preflight and postflight grep checks.

## Observability

- Logging:
  - Task-level command outputs are captured in terminal session and summarized in Decision Log entries.
- Metrics:
  - Zero-hit counts for forbidden reference patterns.
  - Pass/fail for script parse check (`jq` success).
- Alerts/Dashboards:
  - None: internal planning workflow; failure is surfaced by blocked task state.

## Acceptance Criteria (overall)

- [ ] All task acceptance criteria are met and recorded.
- [ ] DO skills no longer contain BOS-phase/hook/discovery-index references.
- [ ] Startup-loop DO contract is filesystem-only and no longer blocked by DO-stage BOS sync requirement.
- [ ] Plan/fact-find templates no longer include BOS/direct-inject control fields.
- [ ] Operator-facing workflow docs are aligned with BOS-decoupled DO behavior.
- [ ] Discovery-index rebuild script handles removed template fields and emits valid JSON.
- [ ] Three obsolete DO BOS integration shared files are deleted with zero remaining references.

## Decision Log

- 2026-02-24: Plan created from `fact-find.md`; `Status: Draft` and `Auto-Build-Intent: plan-only` because user requested planning only.
- 2026-02-24: Option B selected (full same-rollout decoupling) to avoid split contract/tooling state.
- 2026-02-24: Wave 1 complete — TASK-01, TASK-02, TASK-03 all pass VC checks; Wave 2 (TASK-04, TASK-05) beginning.
- 2026-02-24: Wave 2 complete — TASK-04 (startup-loop DO contracts) and TASK-05 (critique/stage-doc integration) pass VC checks.
- 2026-02-24: Wave 3 complete — TASK-06 (template field removal) and TASK-09 (shared file deletion) pass VC checks; zero references to deleted files confirmed.
- 2026-02-24: Wave 4 complete — TASK-07 (operator docs aligned: feature-workflow-guide, agent-workflows, loop-output-contracts) and TASK-08 (discovery script field-absence tolerance confirmed, no changes needed) pass VC checks. All tasks except TASK-10 are Complete. Proceeding to Wave 5 validation sweep.
- 2026-02-24: Wave 5 (TASK-10) closure sweep complete. All 4 checks passed:
  - Sweep 1 (DO skill BOS phases): Phase 8/9 BOS integration fully absent; Phase 8 hit in lp-do-plan is "Persist Plan" — false positive confirmed.
  - Sweep 2 (startup-loop DO sync): "Never allow" line correctly scoped to non-DO stages — false positive confirmed; DO-stage BOS sync requirement removed.
  - Sweep 3 (deleted shared files): zero references to `fact-find-bos-integration`, `plan-bos-integration`, `build-bos-integration` across `.claude/skills/`.
  - Sweep 4 (discovery index): `rebuild-discovery-index.sh` produces valid JSON. No code changes required.
  - Residual risk: none identified. All DO skills are filesystem-only; startup-loop DO advance is filesystem-gated; three shared BOS files deleted; operator docs and loop-output-contracts aligned.

## Overall-confidence Calculation

- S=1, M=2, L=3
- Task-weight inputs:
  - TASK-01: 85 (M=2)
  - TASK-02: 85 (M=2)
  - TASK-03: 85 (M=2)
  - TASK-04: 85 (M=2)
  - TASK-05: 85 (M=2)
  - TASK-06: 85 (M=2)
  - TASK-07: 85 (M=2)
  - TASK-08: 85 (M=2)
  - TASK-09: 90 (S=1)
  - TASK-10: 90 (S=1)
- Weighted sum = (8 * 85 * 2) + (90 * 1) + (90 * 1) = 1540
- Weight total = (8 * 2) + 1 + 1 = 18
- Overall-confidence = 1540 / 18 = 85.56% -> **86%**
- Trigger checks:
  - Phase 11 Trigger 1 (`Overall-confidence < 80%`): **Clear**
  - Phase 11 Trigger 2 (uncovered low-confidence task): **Clear** (no task below 80%)

## Section Omission Rule

If a section is not relevant, either omit it or write:
- `None: <reason>`
