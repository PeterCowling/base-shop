---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-04
Last-updated: 2026-03-04
Feature-Slug: assessment-skill-modularization-wave
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-sequence, lp-do-critique
Related-Plan: docs/plans/assessment-skill-modularization-wave/plan.md
Trigger-Why: Assessment skills are now the largest concentration of new monolith growth, so optimization here gives the highest immediate benefit.
Trigger-Intended-Outcome: "type: operational | statement: Create and execute a phased modularization plan that brings priority assessment skill orchestrators under 200 lines while preserving behavior. | source: operator"
---

# Assessment Skill Family Modularization Wave — Fact-Find Brief

## Scope

### Summary

9 of 14 assessment skills exceed the 200-line SKILL.md threshold and none have a `modules/` directory. This fact-find investigates how to extract shared backbone modules, apply reference modularization patterns, and bring priority orchestrators under 200 lines while preserving behavior.

### Goals

- Map the structural anatomy of all 14 assessment skills to identify extractable shared patterns.
- Identify reference modularization patterns already proven in the codebase.
- Define a phased modularization approach targeting the 9 monolith skills.
- Determine what shared modules can be extracted to `_shared/` vs skill-local `modules/`.

### Non-goals

- Changing assessment skill behavior or output contracts.
- Modularizing non-assessment skills (covered by separate dispatches).
- Adding new assessment skills.
- Dispatch adoption or wave-dispatch conversion (separate dispatch IDEA-DISPATCH-20260304122500-0005).

### Constraints & Assumptions

- Constraints:
  - Behavior parity: all modularized skills must produce identical outputs for identical inputs.
  - Anti-gaming: line reduction must come from genuine extraction into typed/data artifacts or reusable modules, not prose shuffling (per ideas-pack acceptance gates).
  - No new shared module may exceed 400 lines (module-monolith advisory threshold).
- Assumptions:
  - The canonical section pattern observed across 14 skills is stable and representative.
  - `_shared/` infrastructure (52 .md files including cabinet/ subdirectory, 10,003 lines total) is available for new shared modules.
  - lp-do-assessment-12-promote (133L) represents a realistic compliant target architecture.

## Outcome Contract

- **Why:** Assessment skills are now the largest concentration of new monolith growth, so optimization here gives the highest immediate benefit.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Create and execute a phased modularization plan that brings priority assessment skill orchestrators under 200 lines while preserving behavior.
- **Source:** operator

## Access Declarations

None. All investigation targets are in-repo skill files and shared modules.

## Evidence Audit (Current State)

### Entry Points

- `.claude/skills/lp-do-assessment-*/SKILL.md` — 14 assessment skill orchestrators (numbered 01–15, no 09)
- `.claude/skills/_shared/` — 52 .md files including cabinet/ subdirectory (10,003 lines total), including `business-resolution.md` (49L, used by 12/14 skills)
- `.claude/skills/lp-design-qa/SKILL.md` — reference Pattern A (Domain Split)
- `.claude/skills/lp-seo/SKILL.md` — reference Pattern C (Phase Split)
- `.claude/skills/lp-do-build/SKILL.md` — reference Pattern B (Type/Track Split)

### Key Modules / Files

| Skill | Lines | Status | Organization |
|---|---:|---|---|
| lp-do-assessment-14-logo-brief | 643 | monolith | 15 Steps |
| lp-do-assessment-01-problem-statement | 346 | monolith | 11 Steps |
| lp-do-assessment-15-packaging-brief | 342 | monolith | Steps + conditionality gate |
| lp-do-assessment-13-product-naming | 336 | monolith | 4 Parts (orchestrator) |
| lp-do-assessment-11-brand-identity | 299 | monolith | 6 Steps |
| lp-do-assessment-05-name-selection | 292 | monolith | 4 Parts |
| lp-do-assessment-04-candidate-names | 280 | monolith | 4 Parts |
| lp-do-assessment-10-brand-profiling | 205 | monolith | Parts-based |
| lp-do-assessment-08-current-situation | 203 | monolith | Steps-based |
| lp-do-assessment-02-solution-profiling | 134 | compliant | 6 Steps |
| lp-do-assessment-03-solution-selection | 151 | compliant | Steps-based |
| lp-do-assessment-06-distribution-profiling | 137 | compliant | Steps-based |
| lp-do-assessment-07-measurement-profiling | 145 | compliant | Steps-based |
| lp-do-assessment-12-promote | 133 | compliant (gold standard) | Gate-style |

### Patterns & Conventions Observed

**Canonical section pattern** across all 14 assessment skills:

| Section | Frequency | Notes |
|---|---|---|
| Integration (upstream/downstream refs) | 14/14 | Universal |
| Invocation block | 12/14 | Missing in 04, 05 |
| Operating Mode declaration | 11/14 | Always "ASSESSMENT ONLY" |
| Quality Gate / Red Flags | 11/14 | Checklists, 5–15 items each |
| Completion Message template | 12/14 | Missing in 01, 03 |
| Artifact path + naming convention | 14/14 | All follow `<YYYY-MM-DD>-<name>.user.md` |

**Structural families** (two dominant patterns):

1. **Step-based** (9 skills): Numbered `## Step N — Title` sections. Steps range from 3 (assessment-12) to 15 (assessment-14). Each step contains inline instructions.
2. **Part-based** (5 skills): `## Part N — Title` sections. These are multi-stage orchestrators (naming pipeline: generate → score → shortlist → select).

**Naming inconsistencies** across 3 section titles:
- "Quality Gate" vs "Quality Checklist" vs "Red Flags" — same function, different names.
- "Completion Message" vs "Output Summary" — same function.
- "Integration" vs "Upstream / Downstream" — same function.

**Reference modularization patterns:**

| Pattern | Example | SKILL.md | Modules | Total | How it works |
|---|---|---:|---|---:|---|
| A: Domain Split | lp-design-qa | 164L | 5 (38–87L) | 429L | Orchestrator routes by scope flag; domain logic lives in modules |
| B: Type/Track Split | lp-do-build | 308L | 6 (18–151L) | 735L | Routes by task type + execution track |
| C: Phase Split | lp-seo | 68L | 6 (39–208L) | 890L | SKILL.md is pure router; shared base-contract module |

**Pattern C (Phase Split) is most applicable** to assessment skills because:
- Assessment skills already have numbered phases (Steps/Parts).
- The orchestrator can become a pure router (like lp-seo at 68L).
- Step-specific logic moves to `modules/step-NN.md` or grouped `modules/phase-N.md`.
- Common sections (Integration, Quality Gate, Completion Message) become a shared backbone.

### Data & Contracts

- Types/schemas/events: Assessment skills produce `<YYYY-MM-DD>-<artifact-name>.user.md` artifacts. No typed schemas — all markdown output.
- Persistence: Artifacts written to `docs/business-os/strategy/<BUSINESS>/assessment/` paths.
- API/contracts: No external APIs. Skills read from and write to local files only.

### Dependency & Impact Map

- Upstream dependencies:
  - `_shared/business-resolution.md` — used by 12/14 assessment skills for business context resolution.
  - `_shared/confidence-scoring-rules.md` — used by skills that score confidence.
  - Prior assessment outputs — sequential chain (01→02→03→04/05→06→07→08→10→11→12→13→14→15).
- Downstream dependents:
  - `/lp-do-plan` and `/lp-do-build` consume assessment outputs for startup loop planning.
  - `lp-do-assessment-12-promote` validates and promotes brand dossiers.
  - Meta-loop efficiency audit (`/meta-loop-efficiency`) scans these files for compliance.
- Likely blast radius:
  - Skill files only (`.claude/skills/lp-do-assessment-*/`). No production code changes.
  - `_shared/` directory for new shared modules.
  - Zero impact on application code, tests, or deployments.

### Test Landscape

#### Test Infrastructure

- Frameworks: No automated tests exist for skill files (markdown-only).
- Commands: `/meta-loop-efficiency` provides structural compliance verification (line counts, module presence).
- CI integration: None for skill files specifically.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Skill structure | Heuristic audit | meta-loop-efficiency | H1 monolith detection, line counting |
| Skill behavior | Manual invocation | None | Skills tested by running them |

#### Coverage Gaps

- No automated behavior-parity tests for skill refactoring.
- No regression detection for skill output format changes.

#### Testability Assessment

- Easy to test: Line count compliance (already covered by meta-loop-efficiency H1 heuristic).
- Hard to test: Behavior parity — skill outputs depend on LLM interpretation of instructions.
- Test seams needed: Before/after invocation comparison on a fixed input set (manual gate).

#### Recommended Test Approach

- Structural: Re-run `/meta-loop-efficiency` after each wave to verify compliance.
- Behavioral: Manual invocation of 1–2 refactored skills on existing business data to verify output parity.
- Contract: Verify that each modularized skill's completion message format matches the original.

### Recent Git History (Targeted)

- `.claude/skills/lp-do-assessment-*` — Assessment skills 01–15 created as part of startup-loop assessment pipeline. All created as monolithic SKILL.md files.
- `.claude/skills/_shared/` — 52 .md files (including cabinet/ subdirectory) established over multiple build cycles. Stable infrastructure.
- `docs/business-os/platform-capability/skill-efficiency-audit-2026-03-04-1143.md` — Latest audit confirming 9 assessment monoliths as primary new backlog driver.

## Questions

### Resolved

- Q: What modularization pattern is best suited for assessment skills?
  - A: Pattern C (Phase Split), as demonstrated by lp-seo (68L orchestrator). Assessment skills already have numbered Steps/Parts that map directly to module boundaries.
  - Evidence: `.claude/skills/lp-seo/SKILL.md` (68L pure router), assessment step numbering in all 14 skills.

- Q: What shared backbone sections can be extracted?
  - A: Three canonical sections appear in ≥10/14 skills and can become shared modules: (1) Integration/upstream-downstream resolution, (2) Quality Gate/Red Flags checklists, (3) Completion Message templates. Additionally, `business-resolution.md` is already shared (12/14 skills).
  - Evidence: Section frequency analysis across all 14 SKILL.md files.

- Q: What is the realistic target line count for a modularized assessment orchestrator?
  - A: 100–150 lines. lp-do-assessment-12-promote achieves 133L as a compliant gate-style skill. lp-seo achieves 68L as a pure router. Assessment orchestrators with 6–15 steps should land at 100–150L with step logic extracted to modules.
  - Evidence: `.claude/skills/lp-do-assessment-12-promote/SKILL.md` (133L), `.claude/skills/lp-seo/SKILL.md` (68L).

- Q: Should step-based and part-based skills be modularized differently?
  - A: No. Both patterns use numbered sections that map to module boundaries. Part-based skills (multi-stage orchestrators like naming pipeline) already have natural module boundaries at each Part. Step-based skills extract steps into `modules/step-NN.md` files.
  - Evidence: Structural analysis of all 14 skills showing both patterns have clear extraction points.

- Q: What is the priority ordering for modularization?
  - A: By line count descending. assessment-14 (643L) first, then assessment-01 (346L), assessment-15 (342L), assessment-13 (336L), assessment-11 (299L). The top 5 account for 1,966 lines — 67% of the total monolith footprint (2,946 lines).
  - Evidence: Line count table from meta-loop-efficiency audit.

### Open (Operator Input Required)

- Q: Should shared assessment backbone modules go into `_shared/assessment/` subdirectory or directly into `_shared/`?
  - Why operator input is required: Both approaches are valid. `_shared/assessment/` provides namespace clarity consistent with existing `_shared/cabinet/` precedent; flat `_shared/` keeps all modules at one level.
  - Decision impacted: File organization for new shared modules.
  - Decision owner: Platform operator.
  - Default assumption: Use `_shared/assessment/` subdirectory for clean separation, consistent with existing `_shared/cabinet/` precedent. Risk: Minimal — either path works.

## Confidence Inputs

- Implementation: 85% — clear reference patterns exist (lp-seo, lp-design-qa), extraction boundaries are well-defined. Would reach ≥90 after first skill successfully modularized.
- Approach: 90% — Phase Split pattern is proven, assessment step/part numbering provides natural module boundaries.
- Impact: 85% — 9 monoliths brought under 200L directly addresses the audit's primary finding. Would reach ≥90 with meta-loop-efficiency re-scan confirming compliance.
- Delivery-Readiness: 80% — all files are in-repo, no external dependencies, no production code changes. Behavior parity verification is manual but feasible.
- Testability: 70% — structural compliance is testable via meta-loop-efficiency. Behavior parity requires manual invocation checks. Would reach ≥80 with a defined before/after comparison protocol.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Module explosion: too many small files | Medium | Low | Cap at 3–5 modules per skill; group related steps into single modules |
| Behavior drift after extraction | Low | High | Manual invocation check on 1–2 skills per wave; completion message format comparison |
| Anti-gaming: line reduction without genuine simplification | Medium | Medium | Acceptance gate: reject changes where SKILL.md shrinks but total markdown grows without deterministic extraction |
| Module-monolith: extracted modules exceed 400L | Low | Medium | H1 advisory threshold check; split further if any module approaches 400L |
| Shared module coupling: changes to backbone affect all skills | Medium | Medium | Keep shared modules focused (single responsibility); version-lock if needed |

## Planning Constraints & Notes

- Must-follow patterns:
  - Pattern C (Phase Split) as primary modularization approach.
  - Existing `_shared/` infrastructure conventions.
  - Anti-gaming acceptance gates from the ideas pack.
- Rollout/rollback expectations:
  - Phased: Wave 1 (top 3 by size), Wave 2 (next 3), Wave 3 (remaining 3).
  - Each wave independently verifiable and committable.
  - Rollback: `git revert` per wave commit.
- Observability expectations:
  - Post-wave `/meta-loop-efficiency` scan to verify H1 compliance.
  - Line count delta tracking per skill.

## Suggested Task Seeds (Non-binding)

1. **IMPLEMENT: Create shared assessment backbone modules** — Extract Integration, Quality Gate, and Completion Message into `_shared/assessment/` shared modules.
2. **IMPLEMENT: Wave 1 — Modularize top 3 monoliths** (assessment-14 at 643L, assessment-01 at 346L, assessment-15 at 342L). Extract step logic into `modules/`, wire to shared backbone.
3. **IMPLEMENT: Wave 2 — Modularize next 3 monoliths** (assessment-13 at 336L, assessment-11 at 299L, assessment-05 at 292L).
4. **IMPLEMENT: Wave 3 — Modularize remaining 3 monoliths** (assessment-04 at 280L, assessment-10 at 205L, assessment-08 at 203L).
5. **CHECKPOINT: Post-modularization audit verification** — Re-run `/meta-loop-efficiency` and verify all 9 skills are H1-compliant (<200L SKILL.md).

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: lp-do-sequence, lp-do-critique
- Deliverable acceptance package:
  - All 9 monolith SKILL.md files under 200 lines.
  - Each skill has a `modules/` directory with extracted step/phase logic.
  - Shared backbone modules in `_shared/assessment/` (or `_shared/`).
  - `/meta-loop-efficiency` re-scan shows 0 assessment monoliths.
- Post-delivery measurement plan:
  - Re-run `/meta-loop-efficiency` to verify H1 compliance.
  - Manual invocation check on 2 modularized skills to verify behavior parity.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Assessment skill structure (14 skills) | Yes | None | No |
| Canonical section frequency analysis | Yes | None | No |
| Reference modularization patterns (3 patterns) | Yes | None | No |
| Shared infrastructure (_shared/ directory) | Yes | None | No |
| Dependency chain (upstream/downstream) | Yes | None | No |
| Behavior parity verification approach | Partial | [Scope gap] [Moderate]: No automated parity test exists; relies on manual invocation | No |
| Anti-gaming acceptance gates | Yes | None | No |

No Critical findings. One Moderate advisory: behavior parity verification is manual. This is inherent to markdown skill files (no executable test harness) and is mitigated by the post-wave manual invocation protocol.

## Scope Signal

- **Signal:** right-sized
- **Rationale:** The investigation covers all 14 assessment skills, identifies clear modularization patterns from 3 proven references, maps shared extraction candidates, and defines a phased wave approach. Scope is bounded to skill files only (zero production code blast radius). The one partial coverage area (behavior parity) is inherent to the domain and has a defined manual mitigation.

## Evidence Gap Review

### Gaps Addressed

- Citation integrity: All claims backed by specific file paths and line counts from direct skill file analysis.
- Boundary coverage: Integration boundaries (upstream/downstream skill chain, _shared/ dependencies) fully mapped.
- Testing/validation: Test landscape documented; structural compliance testable via meta-loop-efficiency, behavior parity requires manual check (documented as limitation).

### Confidence Adjustments

- Testability reduced from 80% to 70% due to lack of automated behavior-parity testing. Concrete path to ≥80: define a before/after invocation comparison protocol.

### Remaining Assumptions

- The canonical section pattern observed in the current 14 skills remains stable through the modularization effort.
- Manual invocation checks are sufficient to verify behavior parity (no automated alternative exists for markdown skill files).

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan assessment-skill-modularization-wave --auto`
