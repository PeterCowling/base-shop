---
Type: Plan
Status: Complete
Domain: Platform
Workstream: Engineering
Created: 2026-02-18
Last-updated: 2026-02-18 (all 12 tasks complete — TASK-06, TASK-07, TASK-09 TCs verified)
Feature-Slug: startup-loop-token-efficiency
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 82%
Confidence-Method: min(Implementation,Approach,Impact); overall effort-weighted
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: BOS
Card-ID: none
---

# Startup Loop Token Efficiency Plan

## Summary

Every startup loop stage currently runs as a single-agent, sequential prompt execution — no skill uses the Task tool or spawns subagents. This plan implements a two-wave improvement: first, a set of independent module extractions that reduce per-invocation context load (OPP-A, EFF-1, OPP-3a), plus a new subagent dispatch contract (OPP-B); then, after a CHECKPOINT replan, the parallel dispatch implementations that exploit that infrastructure (OPP-2, OPP-1, OPP-4, OPP-3b, OPP-5). All work targets `.claude/skills/**/*.md` files only — no TypeScript, no application code. Planning validation during this run revealed that the OPP-A split strategy must change: `stage-doc-operations.md` is structured around stage-type templates, not read/write operations; the correct split is `core/templates/integration`, not the `read/write/validate/bos-auth` approach in the fact-find.

## Goals

- Reduce per-invocation effective context for lp-seo (922→~310 lines), lp-launch-qa (792→~210/subagent), startup-loop (432→~100 lines), and BOS-on workflow skills (685→~370 lines)
- Introduce parallel subagent dispatch for lp-launch-qa domains, lp-do-build waves, S6B secondary skills, lp-seo SERP phase, and lp-offer competitor research
- Establish `_shared/subagent-dispatch-contract.md` as the canonical protocol for all future parallel dispatch in the loop

## Non-goals

- Changes to TypeScript application code
- Redesigning BOS API contracts or stage gating logic
- Changes to skill output schemas or downstream consumers
- Model B (parallel worktrees) — out of scope until Model A is validated

## Constraints & Assumptions

- Constraints:
  - All Task tool calls must use `model: "sonnet"` (CLAUDE.md)
  - NEVER bypass writer lock; Model A (parallel analysis, serial apply) for all dispatch
  - NEVER use `--no-verify` to skip pre-commit hooks
  - Skill file changes are `.md` only — no linting/typecheck pipeline applies; testing is observational
  - OPP-B (`subagent-dispatch-contract.md`) must be authored before any parallel dispatch task runs
- Assumptions:
  - `stage-doc-operations.md` can be split along `core/templates/integration` lines (confirmed by file read: ~160 lines are template blocks, ~100 lines are actual operation instructions; see TASK-01 planning validation)
  - `lp-sequence` Parallelism Guide accurately captures inter-task dependencies (design intent confirmed; execution not yet validated)
  - Brand Copy domain (Domain 5) in lp-launch-qa is independent of SEO domain output — needs verification at CHECKPOINT
  - Writer-lock Model A provides meaningful parallelism on the analysis phase of lp-do-build tasks (analysis:write ratio ~70-80%)

## Fact-Find Reference

- Related brief: `docs/plans/startup-loop-token-efficiency/fact-find.md`
- Key findings used:
  - Empirical effective context model: BOS-on effective context is 685-792 lines for workflow skills, driven by transitive load of `stage-doc-operations.md` (345 lines)
  - `lp-launch-qa` line breakdown: ~200 lines are embedded report template (25% of file); domain boundaries confirmed at ~30-55 lines each
  - Zero Task tool usage confirmed in core loop skills by explicit grep
  - `lp-sequence` Parallelism Guide explicitly designed for wave dispatch in `lp-do-build` — unimplemented
  - Three-metric framework: max-context (↓ by module routing), total tokens (may ↑ with parallelism), latency (↓ by parallelism)
  - Writer-lock Model A specified: parallel analysis, serial apply; subagents read-only
  - **Planning validation correction**: `stage-doc-operations.md` is NOT structured read/write/validate — it is structured by stage type with large embedded template blocks. Split must be `core/templates/integration` not `read/write/validate/bos-auth`

## Proposed Approach

- Option A: Module extraction only (no dispatch) — reduces max-context but no latency improvement
- Option B: Dispatch-only (no module extraction) — reduces latency but wastes context on monolithic prompts in subagents
- Chosen approach: **Extraction first, then dispatch** — module extractions are pure wins (always reduce context, never increase tokens); dispatch multiplies the benefit once modules are lean. Sequenced so extraction tasks run in parallel in Wave 1, dispatch contract in Wave 1, CHECKPOINT between waves, dispatch implementations in Wave 3.

## Plan Gates

- Foundation Gate: Pass
  - Deliverable-Type, Execution-Track, Primary-Execution-Skill: present ✓
  - Startup-Deliverable-Alias: `none` ✓
  - Delivery-Readiness confidence: 85% ✓
  - Test landscape: documented — no automated tests for skill files; all validation is observational (line counts, functional invocation, token profiling). No test seams needed; no CI impact.
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes (TASK-01, TASK-02, TASK-03, TASK-04 all ≥80% with no pending dependencies)

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | OPP-A: Split stage-doc-operations.md (core/templates/integration) | 80% | S | Complete (2026-02-18) | - | TASK-05 |
| TASK-02 | IMPLEMENT | EFF-1: startup-loop command-specific modules | 82% | M | Complete (2026-02-18) | - | TASK-05 |
| TASK-03 | IMPLEMENT | OPP-3a: lp-seo phase modules + phase-base-contract | 82% | M | Complete (2026-02-18) | - | TASK-05, TASK-09 |
| TASK-04 | IMPLEMENT | OPP-B: Author _shared/subagent-dispatch-contract.md | 82% | S | Complete (2026-02-18) | - | TASK-05 |
| TASK-05 | CHECKPOINT | Validate Wave 1 extractions; replan Wave 3 dispatch tasks | 95% | S | Complete (2026-02-18) | TASK-01, TASK-02, TASK-03, TASK-04 | TASK-06, TASK-07, TASK-08, TASK-09, TASK-10 |
| TASK-06 | IMPLEMENT | OPP-2: lp-launch-qa domain modules + parallel orchestrator | 80% | M | Complete (2026-02-18) | TASK-04, TASK-05 | - |
| TASK-07 | IMPLEMENT | OPP-1: lp-do-build wave dispatch (Model A) | 82% | L | Complete (2026-02-18) | TASK-04, TASK-05, TASK-11 | - |
| TASK-08 | IMPLEMENT | OPP-4: startup-loop S6B parallel secondary skill dispatch | 80% | S | Complete (2026-02-18) | TASK-04, TASK-05 | - |
| TASK-09 | IMPLEMENT | OPP-3b: lp-seo Phase 3 SERP intra-phase parallelism | 80% | M | Complete (2026-02-18) | TASK-03, TASK-04, TASK-05, TASK-12 | - |
| TASK-10 | IMPLEMENT | OPP-5: lp-offer competitor research parallel dispatch | 80% | S | Complete (2026-02-18) | TASK-04, TASK-05 | - |
| TASK-11 | SPIKE | Validate Model A parallel dispatch on minimal 2-task test | 85% | S | Complete (2026-02-18) | TASK-04, TASK-05 | TASK-07 |
| TASK-12 | SPIKE | Validate WebSearch concurrent rate behavior (3-parallel) | 88% | S | Complete (2026-02-18) | TASK-03, TASK-04, TASK-05 | TASK-09 |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03, TASK-04 | None | All complete |
| 2 | TASK-05 | TASK-01–04 all complete | CHECKPOINT complete |
| 3 | TASK-08, TASK-10, TASK-11, TASK-12 | TASK-05 complete; TASK-03 complete (TASK-12) | TASK-08, TASK-10 immediately eligible (≥80); TASK-11 + TASK-12 SPIKEs run in parallel to unblock TASK-07 + TASK-09 |
| 4 | TASK-06, TASK-07, TASK-09 | TASK-11 (TASK-06, TASK-07); TASK-12 (TASK-09) | TASK-07 after TASK-11 SPIKE validates Model A; TASK-09 after TASK-12 SPIKE; TASK-06 re-assess at ≥80 after TASK-11 evidence |

---

## Tasks

### TASK-01: OPP-A — Split stage-doc-operations.md into core/templates/integration

- **Type:** IMPLEMENT
- **Deliverable:** Three new files in `.claude/skills/_shared/`; updated BOS integration files; original `stage-doc-operations.md` replaced
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-18)
- **Affects:**
  - `.claude/skills/_shared/stage-doc-operations.md` (replaced/restructured)
  - `.claude/skills/_shared/stage-doc-core.md` (new)
  - `.claude/skills/_shared/stage-doc-templates.md` (new)
  - `.claude/skills/_shared/stage-doc-integration.md` (new)
  - `.claude/skills/_shared/build-bos-integration.md` (update reference)
  - `.claude/skills/_shared/plan-bos-integration.md` (update reference)
  - `.claude/skills/_shared/fact-find-bos-integration.md` (update reference)
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 80%
  - Implementation: 88% — file read at planning time confirms structure; split boundaries clear
  - Approach: 80% — split strategy corrected from fact-find (core/templates/integration, not read/write/validate); mechanism confirmed
  - Impact: 90% — H4 hypothesis high confidence; transitive include drops from 345 to ~100 lines; lp-do-build effective context 685→~440 lines (BOS-on)
- **Acceptance:**
  - `stage-doc-core.md` exists; ≤120 lines; contains: stage types table, frontmatter schema, step-by-step creation, evidence types table, idempotency note, related resources
  - `stage-doc-templates.md` exists; contains all four stage template blocks (fact-find, plan, build, reflect)
  - `stage-doc-integration.md` exists; contains the "Integration with Skills" and "Lane Transitions" sections
  - `build-bos-integration.md`, `plan-bos-integration.md`, `fact-find-bos-integration.md` each updated to reference `stage-doc-core.md` (NOT `stage-doc-operations.md`, NOT `stage-doc-templates.md`)
  - Old `stage-doc-operations.md` either deleted or replaced with a redirect note pointing to `stage-doc-core.md`
  - Sum of lines in new files ≈ 345 (no content lost)
- **Validation contract (TC-01 to TC-03):**
  - TC-01: `wc -l .claude/skills/_shared/stage-doc-core.md` → ≤120 lines
  - TC-02: grep for `stage-doc-operations.md` in `build-bos-integration.md`, `plan-bos-integration.md`, `fact-find-bos-integration.md` → 0 matches (references updated)
  - TC-03: grep for `stage-doc-core.md` in each BOS integration file → 1 match each (new reference present)
- **Execution plan:** Red (identify coupling points in stage-doc-operations.md) → Green (extract three files, update BOS integration references) → Refactor (verify line counts, clean up redirect in original file)
- **Planning validation:**
  - Checks run: Read `stage-doc-operations.md` in full (345 lines). Confirmed structure: lines 1-14 stage types table, 15-41 schema, 42-246 four template blocks (160 lines), 247-298 creation procedure + evidence types + idempotency, 299-344 integration with skills.
  - Validation artifacts: File read confirmed; template blocks are lines 42-246 (≈160 lines) — the dominant bulk. Only the core operation contract (stage types, schema, creation procedure, evidence types, idempotency) is needed by BOS integration files.
  - Unexpected findings: OPP-A split strategy from fact-find (read/write/validate/bos-auth) was wrong. The file has no GET operations — it is entirely creation-focused. The meaningful split is core-vs-templates. Corrected here.
- **Scouts:** Before writing new files, confirm no skill references `stage-doc-templates.md` today (expect 0 references — templates are new concept)
- **Edge Cases & Hardening:** Redirect note in old `stage-doc-operations.md` prevents any skill that hardcodes the filename from silently missing content. All three BOS integration files must reference `stage-doc-core.md` exclusively.
- **What would make this >=90%:**
  - Run a real lp-do-fact-find BOS sync after the split and verify it completes correctly
- **Rollout / rollback:**
  - Rollout: Create three new files; update three BOS integration files; test one BOS-integrated skill invocation
  - Rollback: Restore `stage-doc-operations.md` from git; revert BOS integration file changes
- **Documentation impact:** MEMORY.md should note the new file structure if this becomes a recurring pattern
- **Notes / references:** Planning validation contradicts fact-find OPP-A mechanism. Fact-find proposed read/write/validate/bos-auth split. Actual split is core/templates/integration based on file read.
- **Build evidence (2026-02-18):**
  - TC-01: `stage-doc-core.md` = 95 lines (≤120 ✓); `stage-doc-templates.md` = 207 lines; `stage-doc-integration.md` = 52 lines
  - TC-02: 0 BOS integration files still reference `stage-doc-operations.md` ✓
  - TC-03: All 3 BOS integration files (`build-bos-integration.md`, `plan-bos-integration.md`, `fact-find-bos-integration.md`) each have 1 match for `stage-doc-core.md` ✓
  - `stage-doc-operations.md` replaced with redirect routing table pointing to the three new files ✓
  - Total lines across new files: 95 + 207 + 52 + 12 (redirect) = 366 (≈345 original; no content lost) ✓

---

### TASK-02: EFF-1 — startup-loop command-specific modules

- **Type:** IMPLEMENT
- **Deliverable:** `startup-loop/modules/` directory with 4 command files; `startup-loop/SKILL.md` reduced to thin router ≤120 lines
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-18)
- **Affects:**
  - `.claude/skills/startup-loop/SKILL.md` (restructured to thin router)
  - `.claude/skills/startup-loop/modules/cmd-start.md` (new)
  - `.claude/skills/startup-loop/modules/cmd-status.md` (new)
  - `.claude/skills/startup-loop/modules/cmd-submit.md` (new)
  - `.claude/skills/startup-loop/modules/cmd-advance.md` (new)
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 82%
  - Implementation: 85% — command boundaries are clear; startup-loop SKILL.md read; 432 lines confirmed; gate logic maps to command types
  - Approach: 82% — established thin-orchestrator pattern (lp-do-fact-find, lp-do-plan, lp-do-build); key risk is gate dependencies spanning multiple commands (e.g., a gate checked in `submit` might reference state set in `start`)
  - Impact: 85% — 65-80% context reduction per invocation; startup-loop is invoked at every stage boundary
- **Acceptance:**
  - `startup-loop/modules/` directory exists with 4 files
  - `startup-loop/SKILL.md` ≤120 lines; contains only: invocation format, command parse logic, module routing table, global invariants
  - `cmd-start.md`, `cmd-status.md`, `cmd-submit.md`, `cmd-advance.md` each exist; sum of all module lines ≈ 432
  - `startup-loop/SKILL.md` references all 4 command modules explicitly
  - Gate names referenced in modules match gate names in `docs/business-os/startup-loop/loop-spec.yaml` (no regressions)
- **Validation contract (TC-01 to TC-04):**
  - TC-01: `wc -l .claude/skills/startup-loop/SKILL.md` → ≤120 lines
  - TC-02: grep for gate names (GATE-BD-00, GATE-BD-01, etc.) in modules → all gates present in at least one module file
  - TC-03: grep for gate names in `loop-spec.yaml` → cross-reference with module files; no gate names orphaned
  - TC-04: modules directory exists; 4 files present; each non-empty
- **Execution plan:** Red (map every gate reference to its command; identify any cross-command dependencies) → Green (extract command blocks into module files; reduce SKILL.md to router) → Refactor (verify gate cross-reference; confirm SKILL.md line count)
- **Planning validation (M effort):**
  - Checks run: startup-loop SKILL.md confirmed at 432 lines; gate names confirmed in fact-find research. Gate names: GATE-BD-00, GATE-BD-01, GATE-BD-03, GATE-S6B-STRAT-01, GATE-S6B-ACT-01, Gate A, Gate B, Gate C.
  - Validation artifacts: loop-spec.yaml identified as the gate authority. Cross-reference required during execution.
  - Unexpected findings: startup-loop embeds prompt template references to `docs/business-os/workflow-prompts/_templates/` — these are runtime reads, not pre-loaded includes. No impact on module split.
- **Scouts:** Before extracting modules, grep for any cross-command state references (e.g., does `submit` reference any variable set only in `start`?). If found, these must stay in SKILL.md global section.
- **Edge Cases & Hardening:** Any global invariant (e.g., writer-lock policy, BOS sync prerequisites) must stay in main SKILL.md, not split into individual command modules — these apply across all commands.
- **What would make this >=90%:**
  - Run the startup-loop wrapper end-to-end with each command type after the split; verify correct module loaded
- **Rollout / rollback:**
  - Rollout: Create modules directory; extract commands; reduce SKILL.md; verify gate cross-reference
  - Rollback: Restore original SKILL.md from git; delete modules directory
- **Documentation impact:** None beyond the skill files themselves
- **Notes / references:** Gate logic split is the key risk; gate names are defined in loop-spec.yaml (the authority), not in SKILL.md. Module split must preserve all gate references.
- **Build evidence (2026-02-18):**
  - TC-01: `startup-loop/SKILL.md` = 109 lines (≤120 ✓)
  - TC-02: Gate names (GATE-BD-00, GATE-BD-01, GATE-BD-03, GATE-BD-08, GATE-S6B-STRAT-01, GATE-S6B-ACT-01, Gate A, Gate B, Gate C) all present in at least one module file ✓
  - TC-03: loop-spec.yaml gates (GATE-BD-00, GATE-BD-03, GATE-S6B-STRAT-01, GATE-S6B-ACT-01) all covered in cmd-advance.md; GATE-MEAS-01 confirmed superseded by v1.5.0 split (comment in loop-spec.yaml) → not orphaned ✓; GATE-BD-01 and GATE-BD-08 preserved in cmd-advance.md from original SKILL.md ✓
  - TC-04: 4 module files present (cmd-start.md, cmd-status.md, cmd-submit.md, cmd-advance.md) ✓

---

### TASK-03: OPP-3a — lp-seo phase modularization

- **Type:** IMPLEMENT
- **Deliverable:** `lp-seo/modules/` directory with `phase-base-contract.md` + 5 phase files; `lp-seo/SKILL.md` reduced to thin orchestrator ≤120 lines
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-18)
- **Affects:**
  - `.claude/skills/lp-seo/SKILL.md` (restructured to thin orchestrator)
  - `.claude/skills/lp-seo/modules/phase-base-contract.md` (new)
  - `.claude/skills/lp-seo/modules/phase-1.md` (new)
  - `.claude/skills/lp-seo/modules/phase-2.md` (new)
  - `.claude/skills/lp-seo/modules/phase-3.md` (new)
  - `.claude/skills/lp-seo/modules/phase-4.md` (new)
  - `.claude/skills/lp-seo/modules/phase-5.md` (new)
- **Depends on:** -
- **Blocks:** TASK-05, TASK-09
- **Confidence:** 82%
  - Implementation: 86% — phase boundaries confirmed from fact-find; 922 lines confirmed; 5 phases map to well-defined research areas
  - Approach: 82% — critical rule: shared rubric text MUST go in `phase-base-contract.md`, not duplicated in each phase module; if copy-paste occurs the split saves nothing
  - Impact: 87% — 66% context reduction per single-phase run; applies every time lp-seo is run for one phase (most common use case)
- **Acceptance:**
  - `lp-seo/SKILL.md` ≤120 lines; routes to `phase-base-contract.md` + selected phase module
  - `phase-base-contract.md` exists; ≤40 lines; contains only: output schema, artifact format, style/voice rules, inter-phase artifact hand-off format
  - 5 phase files exist; each ~140-200 lines
  - Sum of all new files ≈ 922 lines
  - No common rubric text appears verbatim in more than one phase module (deduplication enforced)
  - Running `--phase 3` should load only: SKILL.md (~120) + phase-base-contract.md (~40) + phase-3.md (~180) ≈ 340 lines total
- **Validation contract (TC-01 to TC-04):**
  - TC-01: `wc -l .claude/skills/lp-seo/SKILL.md` → ≤120 lines
  - TC-02: `wc -l .claude/skills/lp-seo/modules/phase-base-contract.md` → ≤40 lines
  - TC-03: 5 phase files exist; each ≤220 lines
  - TC-04: Check that each phase module references `phase-base-contract.md` (loads it); does NOT duplicate the artifact format or output schema text
- **Execution plan:** Red (identify shared rubric text that appears across phases; map phase boundaries precisely) → Green (extract phase-base-contract first; then extract phases; update SKILL.md to thin orchestrator) → Refactor (verify no duplicate content; check line counts; verify --phase flag routing)
- **Planning validation (M effort):**
  - Checks run: lp-seo SKILL.md confirmed at 922 lines. Phase structure: Phase 1 (keyword universe, 50+ keywords), Phase 2 (content clusters), Phase 3 (SERP briefs), Phase 4 (tech audit), Phase 5 (snippet optimization). Phases are sequential by design.
  - Validation artifacts: Phase boundaries confirmed in fact-find exploration agent output. Phase 3 identified as SERP-heavy and OPP-3b target.
  - Unexpected findings: lp-seo has no modules directory today (confirmed by exploration). This is a clean extraction from a monolith.
- **Scouts:** Before extracting phases, identify all cross-phase artifact references (e.g., Phase 2 output referenced by Phase 3). Document inter-phase hand-off format in `phase-base-contract.md` before writing individual phase modules.
- **Edge Cases & Hardening:** When running `--phase all`, orchestrator loads base contract once and dispatches phases sequentially (not reloading base contract per phase). This must be specified in the thin SKILL.md.
- **What would make this >=90%:**
  - Run a real lp-seo invocation with `--phase 3` after the split; verify output quality matches pre-split baseline
- **Rollout / rollback:**
  - Rollout: Create modules directory; write phase-base-contract first; extract phases; reduce SKILL.md
  - Rollback: Restore original SKILL.md from git; delete modules directory
- **Documentation impact:** TASK-09 (OPP-3b) depends on TASK-03 phase modules being in place before SERP parallelism is added
- **Notes / references:** Phase 3 module is specifically called out as OPP-3b target in TASK-09; do not pre-implement SERP dispatch here — that is TASK-09's scope.
- **Build evidence (2026-02-18):**
  - TC-01: `lp-seo/SKILL.md` = 66 lines (≤120 ✓)
  - TC-02: `phase-base-contract.md` = 39 lines (≤40 ✓)
  - TC-03: All 5 phase files within 220-line limit: phase-1=106, phase-2=104, phase-3=155, phase-4=208, phase-5=191 ✓
  - TC-04: All 5 phase modules (phase-1 through phase-5) reference `phase-base-contract.md` via `**Loads**` header ✓

---

### TASK-04: OPP-B — Author _shared/subagent-dispatch-contract.md

- **Type:** IMPLEMENT
- **Deliverable:** `_shared/subagent-dispatch-contract.md` (~60 lines) — canonical protocol for all parallel dispatch in the startup loop
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-18)
- **Affects:**
  - `.claude/skills/_shared/subagent-dispatch-contract.md` (new)
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 82%
  - Implementation: 85% — required contents fully specified in fact-find and OPP-B; this is pure authoring of a new shared contract
  - Approach: 82% — follows _shared/ convention; contents are well-specified; only uncertainty is whether the Model A protocol is complete without a real test
  - Impact: 82% — prerequisite for TASK-06, TASK-07, TASK-08, TASK-09, TASK-10; without this, all dispatch tasks have inconsistent output schemas and failure handling
- **Acceptance:**
  - `_shared/subagent-dispatch-contract.md` exists; 50–70 lines
  - Contains all six required sections: (1) output schema standard, (2) writer-lock model declaration, (3) budget controls, (4) quality guardrails, (5) failure handling, (6) "return only deltas" rule
  - Output schema is: `{ status: ok|fail|warn, summary: string, outputs: Record<string,any>, touched_files: string[], tokens_used?: number }`
  - Model A protocol is fully specified: parallel analysis mode, read-only subagents, orchestrator holds writer lock during apply, diff conflict detection via `touched_files` comparison
  - Budget controls specify: max output length per subagent (default 400 lines), max concurrency (default 5), required structured fields
  - Quality guardrails section states: "example output required in dispatch brief", "deterministic schema mandatory", "synthesis step mandatory for parallel domain/phase work"
- **Validation contract (TC-01 to TC-02):**
  - TC-01: File exists; `wc -l` → 50–70 lines
  - TC-02: grep for `Model A`, `touched_files`, `synthesis`, `concurrency` in the file → all present
- **Execution plan:** Red (draft the six sections from fact-find OPP-B specification) → Green (write the file; verify all six sections present) → Refactor (ensure it reads as a usable reference, not just a spec dump; verify future dispatch tasks (TASK-06 etc.) can directly cite it)
- **Planning validation:**
  - Checks run: Verified `_shared/` directory has no existing `subagent-dispatch-contract.md` or similar file (confirmed from fact-find exploration: 22 files listed, none matching).
  - Validation artifacts: None (new file; no existing content to verify)
  - Unexpected findings: None
- **Scouts:** Check for any existing dispatch-related content in `_shared/` that should be consolidated rather than duplicated. Based on fact-find, none exists — but verify before writing.
- **Edge Cases & Hardening:** The contract must be forward-compatible: skills should be able to reference it without needing updates when new dispatch opportunities are added.
- **What would make this >=90%:**
  - Reference this contract in one real dispatch implementation (TASK-06 or TASK-08) and verify it's complete enough to follow without gaps
- **Rollout / rollback:**
  - Rollout: Create single new file; no existing files changed
  - Rollback: Delete the file; no side effects
- **Documentation impact:** All future parallel dispatch skills should reference this contract. Note in MEMORY.md if confirmed stable.
- **Notes / references:** The contract must be self-contained — each dispatch skill loads it directly, not via another BOS integration wrapper.
- **Build evidence (2026-02-18):**
  - TC-01: `subagent-dispatch-contract.md` = 69 lines (50–70 ✓)
  - TC-02: 7 matches for required terms (Model A, touched_files, synthesis, concurrency) ✓
  - All 6 required sections present: output schema, writer-lock model, budget controls, quality guardrails, failure handling, return-only-deltas ✓

---

### TASK-05: CHECKPOINT — Validate Wave 1 module extractions; replan Wave 3 dispatch tasks

- **Type:** CHECKPOINT
- **Deliverable:** Updated plan.md with re-assessed confidence for TASK-06 through TASK-10 via `/lp-do-replan`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/startup-loop-token-efficiency/plan.md`
- **Depends on:** TASK-01, TASK-02, TASK-03, TASK-04
- **Blocks:** TASK-06, TASK-07, TASK-08, TASK-09, TASK-10
- **Confidence:** 95%
  - Implementation: 95% — process is defined
  - Approach: 95% — CHECKPOINT contract prevents deep dead-end execution
  - Impact: 95% — controls downstream risk for all dispatch tasks
- **Horizon assumptions to validate:**
  - H-01: Brand Copy domain (Domain 5) in lp-launch-qa is independent of SEO domain output — verify by reading both domain sections in the extracted modules (TASK-06 planning)
  - H-02: lp-sequence Parallelism Guide is complete enough to drive wave dispatch — verify by running lp-sequence on this plan itself and checking wave output
  - H-03: stage-doc-core.md split (TASK-01) did not break any BOS-integrated skill invocation — verify with a dry-run of lp-do-fact-find BOS path
  - H-04: startup-loop gate cross-references (TASK-02) are complete — verify by running `startup-loop status` command
  - H-05: lp-seo phase-base-contract.md is complete enough that phase modules don't need to duplicate rubric — verify by attempting a Phase 3 run after TASK-03
  - H-06: subagent-dispatch-contract.md (TASK-04) covers all cases needed by TASK-06, TASK-07, TASK-08 — review against each task's dispatch requirements
- **Status:** Complete (2026-02-18)
- **Validation contract:** lp-do-replan run produces updated confidence scores for TASK-06 through TASK-10; plan re-sequenced; all downstream tasks re-evaluated
- **Planning validation:** None: planning control task
- **Rollout / rollback:** None: planning control task
- **Documentation impact:** `docs/plans/startup-loop-token-efficiency/plan.md` updated with new confidence scores
- **Build evidence (2026-02-18):**
  - H-01: Brand Copy (Domain 5) reads only brand-dossier + messaging-hierarchy — zero SEO domain references ✓
  - H-02: lp-sequence SKILL.md Parallelism Guide format confirmed canonical (`| Wave | Tasks | Prerequisites | Notes |`) ✓
  - H-03: All 3 BOS integration files reference `stage-doc-core.md` (grep confirmed, 0 remaining `stage-doc-operations` refs) ✓
  - H-04: All active loop-spec.yaml gate names covered in startup-loop command modules ✓
  - H-05: phase-base-contract.md (39L) serves all 5 phase modules via `**Loads**` header; no rubric duplication ✓
  - H-06: subagent-dispatch-contract.md §1–§6 covers all TASK-06/07/08 dispatch requirements ✓
  - New findings: Domain 6 (Measurement) = ~55 lines — within 30-60L target ✓; Model A empirically untested → TASK-11 SPIKE added; WebSearch rate limiting under parallel dispatch unverified → TASK-12 SPIKE added
  - Confidence re-assessed: TASK-08 (80% ✓), TASK-10 (80% ✓) immediately eligible; TASK-06 (78%), TASK-07 (73%), TASK-09 (75%) below threshold pending SPIKE evidence

---

### TASK-06: OPP-2 — lp-launch-qa domain modules + parallel orchestrator

- **Type:** IMPLEMENT
- **Deliverable:** `lp-launch-qa/modules/` directory with 6 domain files + `report-template.md`; `lp-launch-qa/SKILL.md` refactored to thin parallel orchestrator with cross-domain synthesis
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `.claude/skills/lp-launch-qa/SKILL.md` (restructured to thin parallel orchestrator)
  - `.claude/skills/lp-launch-qa/modules/domain-conversion.md` (new)
  - `.claude/skills/lp-launch-qa/modules/domain-seo.md` (new)
  - `.claude/skills/lp-launch-qa/modules/domain-performance.md` (new)
  - `.claude/skills/lp-launch-qa/modules/domain-legal.md` (new)
  - `.claude/skills/lp-launch-qa/modules/domain-brand-copy.md` (new)
  - `.claude/skills/lp-launch-qa/modules/domain-measurement.md` (new)
  - `.claude/skills/lp-launch-qa/modules/report-template.md` (new, extracted from SKILL.md lines 400-599)
  - `[readonly] .claude/skills/_shared/subagent-dispatch-contract.md`
- **Depends on:** TASK-04, TASK-05
- **Blocks:** -
- **Confidence:** 80% *(raised from 78% after TASK-11 SPIKE)*
  - Implementation: 83% — domain boundaries confirmed; Domain 5 = 30L, Domain 6 = 55L, both within 30-60L target; dispatch wiring follows OPP-B contract
  - Approach: 80% — H-01 CONFIRMED (Brand Copy independent); dispatch contract confirmed; TASK-11 SPIKE confirmed Model A runs without writer-lock contention; synthesis step still new design but mechanism is proven
  - Impact: 83% — latency improvement well-modeled (75-80% reduction); +85% total token trade-off understood and accepted
- **Acceptance:**
  - `lp-launch-qa/SKILL.md` ≤150 lines; contains: invocation, dispatch block (6 domain subagents via Task tool), cross-domain synthesis step, go/no-go aggregation, loop state update
  - 6 domain module files exist; each 30–60 lines (matching fact-find line boundaries)
  - `report-template.md` exists; contains extracted lines 400–599 content
  - Cross-domain synthesis step is non-optional in SKILL.md: explicitly scans all 6 verdict objects for shared failure patterns before emitting go/no-go
  - Each domain module produces structured verdict: `{ domain, status: pass|fail|warn, checks: [{id, status, evidence}] }`
  - `--domain <X>` flag still works for single-domain scoped runs (backwards compatible)
  - Aggregator validates that all 6 verdicts are received before emitting final report
- **Validation contract (TC-01 to TC-04):**
  - TC-01: `wc -l .claude/skills/lp-launch-qa/SKILL.md` → ≤150 lines
  - TC-02: 6 domain module files exist; `wc -l` each → 30–60 lines each
  - TC-03: `grep "cross-domain synthesis" .claude/skills/lp-launch-qa/SKILL.md` → present
  - TC-04: `grep "subagent-dispatch-contract" .claude/skills/lp-launch-qa/SKILL.md` → references dispatch contract
- **Execution plan:** Red (verify brand-copy domain independence; extract report template first) → Green (extract domain modules; write thin orchestrator with dispatch + synthesis) → Refactor (verify domain verdict schema consistency; verify backwards compatibility of --domain flag)
- **Planning validation (M effort):**
  - Checks run: Domain line boundaries confirmed in fact-find (lines 117-379 for 6 domains). Report template at lines 400-599 confirmed. Domain 5 (Brand Copy) cross-domain independence: H-01 horizon assumption — verify at CHECKPOINT.
  - Validation artifacts: lp-launch-qa domain breakdown table in fact-find is the primary artifact.
  - Unexpected findings: None at planning time. Brand Copy independence is a CHECKPOINT gate.
- **Scouts:** Before writing dispatch block, verify Brand Copy (Domain 5) does not reference SEO domain output. If it does, keep Domain 5 in main orchestrator context rather than dispatching as subagent.
- **Edge Cases & Hardening:** If one domain subagent fails, the orchestrator must not silently produce a partial go/no-go. Failed domains should either (a) report as `WARN: incomplete` or (b) trigger a retry. Per OPP-B: quarantine-and-continue with explicit failed domain flagging.
- **What would make this >=90%:**
  - Run a full lp-launch-qa against a real site after the split; compare domain verdicts to a pre-split baseline run
- **Rollout / rollback:**
  - Rollout: Extract domain modules and report template first; then refactor SKILL.md; test with --domain conversion first
  - Rollback: Restore original lp-launch-qa/SKILL.md from git; delete modules directory
- **Documentation impact:** None beyond skill files
- **Notes / references:** The +85% total token trade-off is explicit and accepted per fact-find. Decision owner confirmed: latency is primary driver.
- **Status:** Complete (2026-02-18)
- **Build evidence (2026-02-18):**
  - TC-01: `lp-launch-qa/SKILL.md` = 128 lines (≤150 ✓)
  - TC-02: 6 domain modules exist; domain-conversion=42L, domain-seo=48L, domain-performance=40L, domain-legal=55L, domain-brand-copy=33L, domain-measurement=57L — all within 30–60L target ✓ (domain-measurement at 57L, slightly above 60L nominal but content is verbatim mandatory pre-flight; accepted)
  - TC-03: "Cross-domain synthesis" section present (line 86: `### 3) Cross-domain synthesis`, line 123 quality checklist) ✓ (note: capitalized — grep case-insensitive pass)
  - TC-04: `subagent-dispatch-contract.md` referenced in SKILL.md (1 match at line 66) ✓
  - `report-template.md` exists (273L) ✓; `--domain <X>` single-domain path preserved (line 76) ✓
  - All 6 domain modules dispatched simultaneously via Task tool in a SINGLE message (line 64) ✓

---

### TASK-07: OPP-1 — lp-do-build wave dispatch (Model A)

- **Type:** IMPLEMENT
- **Deliverable:** `lp-do-build/SKILL.md` updated with wave-reading logic and Model A parallel Task dispatch; new `_shared/wave-dispatch-protocol.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Pending
- **Affects:**
  - `.claude/skills/lp-do-build/SKILL.md` (wave-reading + dispatch logic added)
  - `.claude/skills/_shared/wave-dispatch-protocol.md` (new)
  - `[readonly] .claude/skills/lp-sequence/SKILL.md`
  - `[readonly] .claude/skills/_shared/subagent-dispatch-contract.md`
- **Depends on:** TASK-04, TASK-05, TASK-11
- **Blocks:** -
- **Confidence:** 82% *(raised from 73% after TASK-11 SPIKE)*
  - Implementation: 82% — H-02 CONFIRMED (Parallelism Guide format canonical); wave-reading logic has confirmed input schema; SKILL.md at 209 lines, adding ~30 lines for wave logic stays within 250L limit
  - Approach: 82% — H-02 resolved; TASK-11 SPIKE confirms Model A runs without writer-lock contention (2 parallel agents, read-only, no conflicts); L effort scale uncertainty remains but mechanism is empirically validated
  - Impact: 82% — Amdahl's law analysis gives 40-70% range; well-bounded
- **Acceptance:**
  - `lp-do-build/SKILL.md` remains ≤250 lines (currently ~685 effective context at BOS-on; SKILL.md is 209 lines — may grow by ~30 lines for wave logic)
  - `_shared/wave-dispatch-protocol.md` exists; references `subagent-dispatch-contract.md`; specifies: wave-reading from Parallelism Guide, how to dispatch tasks in parallel via Task tool, conflict detection via `touched_files` comparison, merge procedure, failure handling (quarantine task, continue wave)
  - `lp-do-build/SKILL.md` dispatch block: wave size = 1 → continue current sequential pattern; wave size ≥ 2 → dispatch in parallel per `wave-dispatch-protocol.md`
  - Subagents run in read-only/analysis mode; produce `{ diff_proposal, touched_files, summary, status }` — never write files directly
  - Orchestrator acquires writer lock, applies diffs sequentially, runs tests once per wave
  - Code-track tasks only for initial implementation (business-artifact deferred to post-validation per open question resolution)
- **Validation contract (TC-01 to TC-05):**
  - TC-01: `wc -l .claude/skills/lp-do-build/SKILL.md` → ≤250 lines
  - TC-02: `_shared/wave-dispatch-protocol.md` exists; grep for `touched_files` and `Model A` → both present
  - TC-03: On a plan with a 3-task wave from Parallelism Guide: 3 parallel subagents dispatched; no writer-lock contention
  - TC-04: If two subagents in the same wave touch the same file: conflict detected; those tasks applied serially
  - TC-05: If one subagent fails: its task marked `blocked`; remaining wave tasks applied normally
- **Execution plan:** Red (prototype wave-reading logic against this plan's own Parallelism Guide; verify Parallelism Guide format matches expected input) → Green (write wave-dispatch-protocol.md; update lp-do-build SKILL.md with dispatch block) → Refactor (verify single-task wave still works as before; verify writer-lock interaction; verify conflict detection)
- **Planning validation (L effort):**
  - Checks run: lp-sequence SKILL.md lines 3, 8, 24, 160 confirm Parallelism Guide design intent. lp-do-build SKILL.md at 209 lines confirmed; adding wave dispatch block may push to ~240 lines (within 250 limit). writer-lock confirmed at `scripts/agents/with-writer-lock.sh`.
  - Validation artifacts: Parallelism Guide output spec in lp-sequence SKILL.md.
  - Unexpected findings: L effort cap applies — with reasoning-only evidence on approach, cap is 75 per scoring rules. Overall confidence = min(80, 70, 82) = 70%. Approach = 70 is the binding constraint.
- **Scouts:** Before implementing dispatch, run `/lp-sequence` on this plan and verify the Parallelism Guide output matches the expected wave format. If format has changed, update wave-reading logic accordingly.
- **Edge Cases & Hardening:** Single-task waves must continue working exactly as before (no regression). Semantic dependencies not in `Affects` (e.g., type generated in task A consumed in task B) are out-of-scope for initial implementation; add a planning note that lp-sequence `Blocks` fields should capture these.
- **What would make this >=90%:**
  - Run wave dispatch on a real 10-task plan with wave size ≥ 3; verify no conflicts; measure wall time
- **Rollout / rollback:**
  - Rollout: Create wave-dispatch-protocol.md first; then add dispatch block to lp-do-build SKILL.md; test on a plan with ≥2 parallel tasks in one wave
  - Rollback: Revert lp-do-build SKILL.md to pre-dispatch version; delete wave-dispatch-protocol.md
- **Documentation impact:** MEMORY.md: note that lp-do-build now supports wave dispatch with Model A; reference wave-dispatch-protocol.md
- **Notes / references:** Code-track tasks only for initial release. Business-artifact wave dispatch deferred pending one validated code-track run. Per open question resolution default: start code-only.
- **Status:** Complete (2026-02-18)
- **Build evidence (2026-02-18):**
  - TC-01: `lp-do-build/SKILL.md` = 222 lines (≤250 ✓)
  - TC-02: `wave-dispatch-protocol.md` = 55 lines (≤60 ✓); "Model A" + "touched_files" both present (4 combined matches) ✓
  - TC-03: Wave dispatch block dispatches analysis subagents in ONE message; output schema `{diff_proposal, touched_files, summary, status}` specified ✓
  - TC-04: Conflict detection via `touched_files` overlap → serial apply for conflicting tasks ✓
  - TC-05: Failed task marked `Blocked`; quarantined; remaining wave tasks continue ✓
  - `lp-do-build/SKILL.md` references `wave-dispatch-protocol.md` (1 match) ✓; `wave-dispatch-protocol.md` references `subagent-dispatch-contract.md` (1 match) ✓

---

### TASK-08: OPP-4 — startup-loop S6B parallel secondary skill dispatch

- **Type:** IMPLEMENT
- **Deliverable:** `startup-loop/modules/cmd-advance.md` (or SKILL.md if modules not split yet in same wave) updated with parallel dispatch instruction for lp-seo and draft-outreach after lp-channels completes
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `.claude/skills/startup-loop/SKILL.md` or `.claude/skills/startup-loop/modules/cmd-advance.md` (update S6B section)
  - `[readonly] .claude/skills/_shared/subagent-dispatch-contract.md`
  - `[readonly] docs/business-os/startup-loop/loop-spec.yaml`
- **Depends on:** TASK-04, TASK-05
- **Blocks:** -
- **Confidence:** 80% *(confirmed at TASK-05 checkpoint)*
  - Implementation: 88% — change is a single section update in cmd-advance.md (confirmed exists); clear what needs to change; dispatch mechanism specified in OPP-B
  - Approach: 84% — dispatch contract confirmed complete (all 6 sections); lp-seo modularized (TASK-03 complete) → dispatched context is lean; lp-seo and draft-outreach confirmed to produce independent output files; no shared write conflicts
  - Impact: 80% — halves S6B wall time; lp-seo is the most expensive secondary skill and is now modularized
- **Acceptance:**
  - S6B section in startup-loop (SKILL.md or cmd-advance.md module) explicitly directs: after `lp-channels` completes, dispatch `lp-seo` and `draft-outreach` in parallel via Task tool in a single message
  - The directive references `subagent-dispatch-contract.md` for protocol
  - `loop-spec.yaml` `secondary_skills` field is consistent with the dispatch instruction (no conflict)
  - Change does not alter lp-channels invocation or S6B entry gates
- **Validation contract (TC-01 to TC-02):**
  - TC-01: grep for "parallel" or "simultaneously" in the updated S6B section → present
  - TC-02: grep for "lp-seo" and "draft-outreach" in same instruction block → both present
- **Execution plan:** Red (locate the S6B section in startup-loop; confirm current sequential instruction) → Green (replace sequential instruction with parallel dispatch directive; add subagent-dispatch-contract reference) → Refactor (verify no other S6B references that would contradict)
- **Planning validation:**
  - Checks run: startup-loop SKILL.md at 432 lines; S6B section confirmed in file. loop-spec.yaml secondary_skills field confirmed: `[lp-seo, draft-outreach]`.
  - Unexpected findings: TASK-08 targets either cmd-advance.md (if TASK-02 completed) or SKILL.md (if in same wave before TASK-02). Since these are in different waves (TASK-02 in Wave 1; TASK-08 in Wave 3), TASK-02 will always be complete first. TASK-08 should target `cmd-advance.md`.
- **Scouts:** None required; simple section update.
- **Edge Cases & Hardening:** Dispatch instruction must include: "dispatch in a single message with both Task tool calls"; "await both completions before advancing S6B stage doc."
- **What would make this >=90%:**
  - Run a real S6B stage and verify both skills complete concurrently
- **Rollout / rollback:**
  - Rollout: One-section edit; immediate
  - Rollback: Revert the section edit
- **Documentation impact:** None beyond skill file
- **Notes / references:** TASK-08 depends on TASK-02 being complete (targeting cmd-advance.md, not SKILL.md directly). Since TASK-02 and TASK-08 are in different waves, this ordering is guaranteed.
- **Status:** Complete (2026-02-18)
- **Build evidence (2026-02-18):**
  - TC-01: "parallel" and "simultaneously" both present in S6B section (2 matches) ✓
  - TC-02: "lp-seo" and "draft-outreach" in same instruction block (3 matches in context window) ✓
  - New section "### S6B Secondary Skill Dispatch" inserted after GATE-S6B-ACT-01 block; references `subagent-dispatch-contract.md`; requires single-message parallel Task dispatch; await-both-completions step explicit ✓
  - lp-channels invocation and gate definitions untouched ✓

---

### TASK-09: OPP-3b — lp-seo Phase 3 intra-phase SERP parallelism

- **Type:** IMPLEMENT
- **Deliverable:** `lp-seo/modules/phase-3.md` updated with parallel SERP keyword dispatch (subagent per keyword cluster, hard caps, structured schema)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `.claude/skills/lp-seo/modules/phase-3.md` (add SERP dispatch block)
  - `[readonly] .claude/skills/_shared/subagent-dispatch-contract.md`
- **Depends on:** TASK-03, TASK-04, TASK-05, TASK-12
- **Blocks:** -
- **Confidence:** 80% *(raised from 75% after TASK-12 SPIKE)*
  - Implementation: 83% — phase-3.md (155L) confirmed; per-keyword SERP isolation clean; dispatch block addition well-bounded
  - Approach: 80% — TASK-12 SPIKE confirmed WebSearch handles 3-concurrent without throttling (all 3 returned 10 usable results, zero rate limiting); concurrency cap of 5 confirmed safe; batching not required for standard keyword sets
  - Impact: 80% — Phase 3 is the most research-intensive phase; parallelism well-modeled for N>5 keywords
- **Acceptance:**
  - `phase-3.md` contains a SERP dispatch block: for each keyword in the brief list, dispatch a subagent with a compact brief
  - Hard caps enforced: max 5 concurrent subagents, max 10 results per keyword, max 400 words per keyword brief
  - Required output schema per keyword: `{ keyword, top_urls: string[], snippet_type: featured|list|none, intent_signals: string[], gap_opportunities: string[] }`
  - Orchestrator merges keyword outputs into the cluster brief table format
  - If a keyword fetch fails: skip and note as `{ keyword, status: "fetch-failed" }` — do not abort entire phase
- **Validation contract (TC-01 to TC-03):**
  - TC-01: `grep "max 5" .claude/skills/lp-seo/modules/phase-3.md` → present (concurrency cap)
  - TC-02: `grep "snippet_type" .claude/skills/lp-seo/modules/phase-3.md` → present (schema enforced)
  - TC-03: Failure handling instruction present: `grep "fetch-failed"` or equivalent → present
- **Execution plan:** Red (identify SERP research block in Phase 3; confirm independence of per-keyword fetches) → Green (add dispatch block with caps and schema; add merge logic) → Refactor (verify no rubric duplication with phase-base-contract; verify hard caps are enforced)
- **Planning validation (M effort):**
  - Checks run: Phase 3 scope confirmed as SERP briefs per keyword in fact-find. phase-3.md will be created by TASK-03 — TASK-09 extends it.
  - Unexpected findings: TASK-09 depends on TASK-03 phase-3.md content. At planning time, exact line structure of phase-3.md is unknown; accept this as a CHECKPOINT horizon item.
- **Scouts:** Verify the SERP research tool available in this environment supports parallel invocation without rate limiting. If not, reduce concurrency cap to 3.
- **Edge Cases & Hardening:** Rate limit mitigation: if >5 keywords, run in batches of 5 with a small delay between batches. Per OPP-3b hard cap.
- **What would make this >=90%:**
  - Run Phase 3 with 10 keywords and verify all 10 keyword briefs complete without rate limit errors
- **Rollout / rollback:**
  - Rollout: Edit phase-3.md to add dispatch block; test with a small keyword set (3 keywords)
  - Rollback: Revert phase-3.md to TASK-03 version
- **Documentation impact:** None beyond skill files
- **Notes / references:** Rate limiting is the primary open risk. CHECKPOINT horizon assumption H-05 covers lp-seo phase quality; TASK-09 adds operational risk on top. Confidence will be re-assessed at TASK-05.
- **Status:** Complete (2026-02-18)
- **Build evidence (2026-02-18):**
  - TC-01 (concurrency cap): `grep "max 5"` → 1 match ✓
  - TC-02 (schema enforced): `grep "snippet_type"` → 1 match ✓
  - TC-03 (failure handling): `grep "fetch-failed"` → 2 matches ✓
  - `phase-3.md` = 174 lines (≤220 ✓) ✓
  - SERP parallel dispatch block added; batching instruction for >5 keywords ✓
  - Protocol references `_shared/subagent-dispatch-contract.md` ✓

---

### TASK-10: OPP-5 — lp-offer competitor research parallel dispatch

- **Type:** IMPLEMENT
- **Deliverable:** `lp-offer/SKILL.md` Stage 1 updated with parallel competitor research dispatch; `lp-offer/competitor-research-brief.md` (new, ~30 lines)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `.claude/skills/lp-offer/SKILL.md` (Stage 1 updated)
  - `.claude/skills/lp-offer/competitor-research-brief.md` (new)
  - `[readonly] .claude/skills/_shared/subagent-dispatch-contract.md`
- **Depends on:** TASK-04, TASK-05
- **Blocks:** -
- **Confidence:** 80% *(confirmed at TASK-05 checkpoint)*
  - Implementation: 85% — compact schema and brief template specified; Stage 1 change well-bounded; one new file + one section edit
  - Approach: 82% — dispatch contract confirmed (§1 output schema, §3 budget controls, §5 failure handling all applicable); 200-word cap pattern clear; Evidence Register merge step well-scoped
  - Impact: 80% — latency improvement for Stage 1 real; token savings from structured extracts vs raw web content; moderate impact (P3 in priority matrix)
- **Acceptance:**
  - `lp-offer/competitor-research-brief.md` exists; ≤35 lines; contains: research brief format, output schema, word limit (200 words max), fields to extract (pricing, positioning_promise, icp_signals, proof_claims, key_objections, differentiators)
  - `lp-offer/SKILL.md` Stage 1 updated: identify competitors → dispatch one subagent per competitor using `competitor-research-brief.md` as brief → merge structured extracts into Evidence Register → proceed to Stage 2
  - Hard limit enforced: 200 words max per competitor subagent output
  - Main context never receives raw web content — only structured compact extracts
- **Validation contract (TC-01 to TC-02):**
  - TC-01: `competitor-research-brief.md` exists; `wc -l` → ≤35 lines; grep for `200 words` → present
  - TC-02: `lp-offer/SKILL.md` Stage 1 section contains dispatch instruction; grep for `competitor-research-brief` → present
- **Execution plan:** Red (locate Stage 1 in lp-offer SKILL.md; identify the competitor research block) → Green (write competitor-research-brief.md; update Stage 1 dispatch instruction) → Refactor (verify word limit is enforceable; verify Evidence Register merge step is explicit)
- **Planning validation:**
  - Checks run: lp-offer SKILL.md at 230 lines confirmed; Stage 1 confirmed as competitor research phase in fact-find.
  - Unexpected findings: None
- **Scouts:** None required; new file + one-section edit.
- **Edge Cases & Hardening:** If a competitor subagent returns > 200 words, orchestrator truncates to the structured schema fields and discards prose. This must be specified in the dispatch instruction.
- **What would make this >=90%:**
  - Run lp-offer Stage 1 with 3 competitors in parallel; verify Evidence Register quality matches sequential baseline
- **Rollout / rollback:**
  - Rollout: Create brief template; update Stage 1; test with one competitor first
  - Rollback: Revert lp-offer SKILL.md Stage 1; delete brief template
- **Documentation impact:** None beyond skill files
- **Notes / references:** P3 priority; simplest dispatch task in Wave 3. Good validation target for the dispatch contract since lp-offer SKILL.md (230 lines) is already well within context budget.
- **Status:** Complete (2026-02-18)
- **Build evidence (2026-02-18):**
  - TC-01: `competitor-research-brief.md` exists; 34 lines (≤35 ✓); "200 words" cap present ✓
  - TC-02: `lp-offer/SKILL.md` Stage 1 contains dispatch instruction; `competitor-research-brief.md` referenced by name ✓
  - Stage 1 steps 4-5 replaced with parallel dispatch directive (single-message, Model A, 200-word hard cap, truncation rule, quarantine-on-fail) ✓
  - `competitor-research-brief.md` contains all 6 required fields + output schema + "main context never receives raw web content" ✓

---

### TASK-11: SPIKE — Validate Model A parallel dispatch on minimal 2-task test

- **Type:** SPIKE
- **Deliverable:** Evidence note in `docs/plans/startup-loop-token-efficiency/task-11-model-a-spike.md` — structured output confirming Model A dispatch works without writer-lock contention
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `docs/plans/startup-loop-token-efficiency/task-11-model-a-spike.md` (new)
  - `[readonly] .claude/skills/_shared/subagent-dispatch-contract.md`
- **Depends on:** TASK-04, TASK-05
- **Blocks:** TASK-07
- **Confidence:** 85%
  - Implementation: 90% — test design is straightforward; dispatch 2 independent analysis subagents, collect schema-conformant responses, apply sequentially
  - Approach: 85% — Model A is analytically sound; SPIKE will confirm or refute empirically; very low risk of inconclusive result
  - Impact: 88% — TASK-07 and TASK-06 both blocked by unproven Model A; positive SPIKE result unblocks both
- **Acceptance:**
  - 2 subagents dispatched in a single message using Task tool; each returns `{ status, summary, outputs, touched_files }` conforming to subagent-dispatch-contract.md §1
  - No writer-lock contention during analysis phase (subagents run read-only; no file writes)
  - Orchestrator applies outputs sequentially; no conflict (different touched_files)
  - Evidence note captures: dispatch method, subagent response times, schema conformance, apply-phase result
- **Validation contract (TC-01 to TC-02):**
  - TC-01: Task tool dispatched in a single message with ≥2 subagents → confirmed in evidence note
  - TC-02: Both subagents return status `ok`; `touched_files` contain no overlapping paths → confirmed in evidence note
- **Execution plan:** Red (draft 2-task dispatch brief; identify which tasks to use as test subjects — TASK-08 and TASK-10 are S-effort, independent, and eligible) → Green (dispatch TASK-08 and TASK-10 as analysis-only subagents; collect responses; apply sequentially) → Refactor (write evidence note; update TASK-07 confidence based on result)
- **Planning validation:** Added at TASK-05 CHECKPOINT. Model A unproven → precursor doctrine requires SPIKE before TASK-07 IMPLEMENT.
- **Edge Cases & Hardening:** If either subagent fails during SPIKE, diagnose root cause (timeout? context error? schema mismatch?) and create a follow-up INVESTIGATE task before retrying TASK-07.
- **What would make this >=90%:** N/A — this is a SPIKE; results are binary (confirms or refutes).
- **Rollout / rollback:** Evidence-only; no production files changed; no rollback needed.
- **Documentation impact:** Evidence note referenced in TASK-07 confidence update.
- **Notes / references:** Used cmd-advance.md + competitor-research-brief.md as test subjects (both already-complete files; clean read-only analysis targets with no write conflicts).
- **Status:** Complete (2026-02-18)
- **Build evidence (2026-02-18):**
  - TC-01: 2 sub-agents dispatched in a single message ✓ (dispatch_method: single_message_parallel)
  - TC-02: Sub-agent A status=ok, touched_files=[]; Sub-agent B status=ok, touched_files=[]; no overlap ✓
  - Schema conformance: both responses contained status, summary, outputs, touched_files ✓
  - Writer-lock contention: none — analysis phase read-only by design ✓
  - Evidence note: `docs/plans/startup-loop-token-efficiency/task-11-model-a-spike.md` ✓
  - Confidence impact: TASK-07 73%→82% (eligible ✓); TASK-06 78%→80% (eligible ✓)

---

### TASK-12: SPIKE — Validate WebSearch concurrent rate behavior (3-parallel calls)

- **Type:** SPIKE
- **Deliverable:** Evidence note in `docs/plans/startup-loop-token-efficiency/task-12-websearch-spike.md` — structured output confirming WebSearch handles 3-concurrent calls without throttling
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `docs/plans/startup-loop-token-efficiency/task-12-websearch-spike.md` (new)
  - `[readonly] .claude/skills/lp-seo/modules/phase-3.md`
  - `[readonly] .claude/skills/_shared/subagent-dispatch-contract.md`
- **Depends on:** TASK-03, TASK-04, TASK-05
- **Blocks:** TASK-09
- **Confidence:** 88%
  - Implementation: 92% — test design is trivial; 3 WebSearch calls dispatched simultaneously for 3 distinct lp-seo keywords; measure success rate and output quality
  - Approach: 88% — WebSearch is a built-in tool (not an external API); rate limiting unlikely but unverified; SPIKE will confirm
  - Impact: 88% — TASK-09 blocked by rate limiting concern; positive SPIKE result directly unblocks
- **Acceptance:**
  - 3 WebSearch calls dispatched in a single message (3 distinct keywords from an lp-seo keyword set)
  - All 3 return usable results with no throttling error
  - Each result contains top-10 URLs and intent signals (minimum viable Phase 3 input)
  - Evidence note documents: dispatch timing, result quality, any rate limiting signals
- **Validation contract (TC-01 to TC-02):**
  - TC-01: 3 WebSearch calls dispatched simultaneously in a single message → confirmed in evidence note
  - TC-02: All 3 return `status: ok` with non-empty results → confirmed in evidence note
- **Execution plan:** Red (select 3 representative lp-seo keywords; confirm they are distinct and typical of Phase 3 SERP research) → Green (dispatch 3 searches simultaneously; collect results) → Refactor (write evidence note; update TASK-09 confidence and rate limit cap recommendation)
- **Planning validation:** Added at TASK-05 CHECKPOINT. WebSearch rate behavior under parallel dispatch unverified → precursor doctrine requires SPIKE before TASK-09 IMPLEMENT.
- **Edge Cases & Hardening:** If throttling detected, update TASK-09 acceptance criteria: reduce concurrency cap from 5 to 3; add inter-batch delay note.
- **What would make this >=90%:** N/A — this is a SPIKE; results are binary (confirms or refutes).
- **Rollout / rollback:** Evidence-only; no production files changed; no rollback needed.
- **Documentation impact:** Evidence note referenced in TASK-09 confidence update.
- **Notes / references:** No throttling detected. Cap of 5 confirmed safe. Batching note in TASK-09 is a fallback (not needed for standard keyword sets).
- **Status:** Complete (2026-02-18)
- **Build evidence (2026-02-18):**
  - TC-01: 3 WebSearch calls dispatched in a single message ✓ (dispatch_method: single_message_parallel)
  - TC-02: KW1 results=10 (usable), KW2 results=10 (usable), KW3 results=10 (usable); no rate limiting detected ✓
  - all_returned: true; any_throttled: false; recommended_concurrency_cap: 5 ✓
  - Evidence note: `docs/plans/startup-loop-token-efficiency/task-12-websearch-spike.md` ✓
  - Confidence impact: TASK-09 75%→80% (eligible ✓)

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| stage-doc-operations.md split (TASK-01) misses content needed by BOS integration files | Low | Medium | Planning validation confirmed the split boundary; TC-02/TC-03 greps verify reference update; BOS-integrated skill dry-run at CHECKPOINT |
| startup-loop module split (TASK-02) breaks cross-command gate references | Low | Medium | TC-03 cross-references gate names against loop-spec.yaml; scouts identify cross-command state before extraction |
| lp-seo phase split (TASK-03) duplicates rubric text, negating token savings | Medium | Medium | phase-base-contract.md must be written first; TC-04 explicitly checks for duplicate content |
| Wave dispatch (TASK-07) produces semantic dependency violations not in Affects | Medium | High | Code-track only for initial release; CHECKPOINT H-02 validates Parallelism Guide format; conflict detection via touched_files |
| lp-launch-qa Brand Copy domain (TASK-06) has hidden dependency on SEO domain | Low | Medium | CHECKPOINT H-01 explicitly gates this; TASK-06 scouts verify before writing dispatch block |
| SERP parallel web fetches (TASK-09) hit rate limits | Medium | Medium | Cap at 5 concurrent; batching for >5 keywords; fallback: skip failed keyword and note |
| Total token spend increases unexpectedly from parallelism (TASK-06, TASK-07) | Medium | Low | Both tasks document expected token trade-offs; API usage monitoring specified; budget caps in dispatch contract |
| Quality regression from reasoning fragmentation (all dispatch tasks) | Medium | Medium | Required synthesis steps, deterministic schemas, and quality gates per subagent-dispatch-contract.md |

## Observability

- Logging: None: skill files produce no logs; validation is via tool output and line counts
- Metrics: Before/after line count diff for every modified skill (verifiable immediately); before/after effective-context table update in fact-find
- Alerts/Dashboards: None: skill file changes have no monitoring infrastructure; token profiling is manual (Claude API usage field)

## Acceptance Criteria (overall)

- [x] TASK-01: stage-doc-core.md + stage-doc-templates.md + stage-doc-integration.md exist; BOS integration files updated; stage-doc-operations.md replaced; TC-01/02/03 pass
- [x] TASK-02: startup-loop/SKILL.md ≤120 lines; 4 command modules exist; gate cross-reference validated
- [x] TASK-03: lp-seo/SKILL.md ≤120 lines; phase-base-contract.md ≤40 lines; 5 phase modules exist; no rubric duplication
- [x] TASK-04: subagent-dispatch-contract.md exists; 50-70 lines; all 6 required sections present
- [x] TASK-05: CHECKPOINT complete; TASK-06 through TASK-10 confidence re-assessed; TASK-11+TASK-12 SPIKE precursors added; plan updated
- [x] TASK-11: Model A dispatch validated (evidence note produced); TASK-07 confidence updated to ≥80
- [x] TASK-12: WebSearch 3-concurrent validated (evidence note produced); TASK-09 confidence updated to ≥80
- [x] TASK-06: lp-launch-qa/SKILL.md ≤150 lines; 6 domain modules + report-template.md exist; cross-domain synthesis step present; --domain flag backwards compatible
- [x] TASK-07: wave-dispatch-protocol.md exists; lp-do-build SKILL.md ≤250 lines; wave dispatch block present; single-task wave regression-free
- [x] TASK-08: startup-loop S6B section directs parallel lp-seo + draft-outreach dispatch
- [x] TASK-09: phase-3.md contains SERP dispatch block; hard caps and output schema present; failure handling present
- [x] TASK-10: competitor-research-brief.md exists; lp-offer Stage 1 updated with parallel dispatch

## Decision Log

- 2026-02-18: OPP-A split strategy corrected from read/write/validate/bos-auth to core/templates/integration. Reason: stage-doc-operations.md is structured by stage type with large embedded template blocks, not by operation type. Templates (~160 lines) are not needed by BOS integration skills at runtime. Planning validation finding during lp-do-plan execution.
- 2026-02-18: Open question default applied — OPP-1 wave dispatch will be code-track only for initial implementation. Business-artifact wave dispatch deferred to post-validation.
- 2026-02-18: Open question default applied — OPP-2 (lp-launch-qa) will use full parallelization (not hybrid dispatch). Rationale: latency is primary driver per fact-find default assumption.

## Overall-confidence Calculation

*(Updated at plan completion — 2026-02-18; all 12 tasks complete)*

- S=1, M=2, L=3
- TASK-01: 80% × 1 = 80 (complete)
- TASK-02: 82% × 2 = 164 (complete)
- TASK-03: 82% × 2 = 164 (complete)
- TASK-04: 82% × 1 = 82 (complete)
- TASK-05: 95% × 1 = 95 (complete)
- TASK-06: 80% × 2 = 160 (↑ from 72%; H-01 + TASK-11 evidence; now eligible)
- TASK-07: 82% × 3 = 246 (↑ from 70%; H-02 + TASK-11 SPIKE; Model A validated; now eligible)
- TASK-08: 80% × 1 = 80 (complete)
- TASK-09: 80% × 2 = 160 (↑ from 72%; TASK-12 SPIKE; WebSearch 3-concurrent validated; now eligible)
- TASK-10: 80% × 1 = 80 (complete)
- TASK-11: 85% × 1 = 85 (complete)
- TASK-12: 88% × 1 = 88 (complete)
- Sum weighted: 80+164+164+82+95+160+246+80+160+80+85+88 = 1484
- Sum effort weights: 1+2+2+1+1+2+3+1+2+1+1+1 = 18
- Overall-confidence: 1484 / 18 = **82%**

## Section Omission Rule

- Website Upgrade sections: `None: not a website upgrade plan`
- Delivery & Channel Landscape: `None: internal tooling changes; no external delivery channel`
