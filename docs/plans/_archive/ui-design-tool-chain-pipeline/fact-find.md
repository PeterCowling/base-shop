---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: BOS
Workstream: Engineering
Created: 2026-02-27
Last-updated: 2026-02-27
Feature-Slug: ui-design-tool-chain-pipeline
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-design-spec, tools-ui-frontend-design, tools-design-system, lp-design-qa, tools-ui-contrast-sweep, tools-ui-breakpoint-sweep, tools-refactor
Related-Plan: docs/plans/ui-design-tool-chain-pipeline/plan.md
Trigger-Source: dispatch-routed
Dispatch-ID: IDEA-DISPATCH-20260227-0056
Trigger-Why: Seven UI design skills operate as disconnected units with no declared handoff protocol between them. Stale name references mean agents loading the wrong skill path, and there is no defined intake contract to enter the pipeline from an lp-do-plan IMPLEMENT task.
Trigger-Intended-Outcome: type: operational | statement: Each of the seven UI design SKILL.md files declares its upstream trigger and downstream handoff; all stale name references are replaced with current names; a pipeline integration contract connects lp-do-plan Design-Spec-Required tasks to lp-design-spec; tools-refactor entry criteria from QA output are stated. | source: operator
---

# UI Design Tool Chain Pipeline — Fact-Find Brief

## Access Declarations

No external data sources, APIs, or credentials are needed for this fact-find. All investigation is restricted to reading SKILL.md files within this repository.

None.

## Scope

### Summary

Seven UI design skills exist in `.claude/skills/` but operate as disconnected units. The intended pipeline is:

```
lp-do-plan (IMPLEMENT task flagged Design-Spec-Required)
  → lp-design-spec
  → tools-ui-frontend-design
  → lp-design-qa
  → tools-ui-contrast-sweep / tools-ui-breakpoint-sweep (parallel browser sweeps)
  → tools-refactor (token/maintainability cleanup driven by QA findings)
```

Two of the seven skills (`lp-design-spec` and `lp-design-qa`) have formal `## Integration` sections declaring upstream and downstream. The remaining five skills have no such declarations. Two of the seven SKILL.md files contain stale cross-references pointing to skill names that no longer exist (renamed on 2026-02-27): `lp-design-spec/SKILL.md` and `frontend-design/SKILL.md`. The pipeline entry point — how an `lp-do-plan` IMPLEMENT task flagged `Design-Spec-Required: yes` triggers `lp-design-spec` — is documented only in `lp-design-spec`'s Integration section and nowhere in `lp-do-plan`.

This fact-find identifies every edit needed across all seven SKILL.md files and produces a planning brief with tasks ordered to avoid conflict with the adjacent `lp-responsive-qa-skill` plan (Status: Ready-for-planning).

### Goals

1. Map exact stale name references that must be corrected in each SKILL.md.
2. Identify the upstream trigger and downstream handoff each skill must declare.
3. Determine what handoff artifact (report path, frontmatter field, or completion message) each stage must produce for the next stage to consume.
4. Define the intake contract by which an `lp-do-plan` IMPLEMENT task tagged `Design-Spec-Required: yes` enters the pipeline.
5. Define entry criteria for `tools-refactor` when invoked from QA findings.
6. Produce a sequenced task list that avoids touching `tools-ui-breakpoint-sweep` scope in a way that conflicts with `lp-responsive-qa-skill`.

### Non-goals

- Writing new pipeline logic or orchestration scripts (this is skill documentation and one planning module edit only).
- Redesigning the pipeline stages (scope is Integration section declarations within existing SKILL.md files, plus a Design Gate addition to `lp-do-plan/modules/plan-code.md`).
- Touching `lp-responsive-qa` (new skill being built under `lp-responsive-qa-skill` plan).
- Changing any application code.

### Constraints & Assumptions

- Constraints:
  - `lp-responsive-qa-skill` plan is Ready-for-planning and covers `lp-responsive-qa` skill creation. This fact-find must not create a new `lp-responsive-qa` skill or redefine the scope of `tools-ui-breakpoint-sweep` in a way that conflicts with that plan.
  - The seven skills are: `lp-design-spec`, `tools-ui-frontend-design` (dir: `frontend-design/`), `tools-design-system`, `lp-design-qa`, `tools-ui-contrast-sweep`, `tools-ui-breakpoint-sweep` (dir: `tools-web-breakpoint/`), `tools-refactor`.
  - Changes are documentation markdown edits only — SKILL.md files plus `lp-do-plan/modules/plan-code.md`. No application code, no new skill directories, no build changes.
- Assumptions:
  - The canonical pipeline order is: spec → build UI → static QA → browser sweeps → refactor. This order is confirmed by `lp-design-qa`'s Integration section and `lp-responsive-qa-skill` fact-find's integration diagram.
  - `tools-ui-contrast-sweep` and `tools-ui-breakpoint-sweep` are parallel sweep stages — either can run first; both feed `tools-refactor`.
  - The `Design-Spec-Required: yes` flag lives in fact-find frontmatter or the planning brief — `lp-do-plan` must check for it.

---

## Outcome Contract

- **Why:** Seven UI design skills that should form a coherent pipeline are undiscoverable as a sequence by any agent traversing them. Stale name references mean an agent loading `lp-design-spec` or `frontend-design` will attempt to read a file at a path that does not exist (`.claude/skills/lp-design-system/SKILL.md` was renamed to `.claude/skills/tools-design-system/SKILL.md` on 2026-02-27). The absence of a pipeline intake contract means `lp-do-plan` cannot reliably trigger `lp-design-spec` for Design-Spec-Required tasks.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Each of the seven UI design SKILL.md files declares its upstream trigger and downstream handoff in an Integration section; all five stale name references to `lp-design-system` are replaced with `tools-design-system`; `lp-do-plan`'s plan-code module or Foundation Gate documents how to detect and route `Design-Spec-Required: yes` tasks to `lp-design-spec`; `tools-refactor` entry criteria from QA output are stated.
- **Source:** operator

---

## Evidence Audit (Current State)

### Entry Points

- `.claude/skills/lp-design-spec/SKILL.md` — pipeline entry skill; has Integration section but refers to `lp-design-system` at lines 58 and 133
- `.claude/skills/frontend-design/SKILL.md` — second stage (tools-ui-frontend-design); references `lp-design-system` in frontmatter `related_skills` (line 6), at line 33 (Mandatory References table), and at line 92 (Step 2)
- `.claude/skills/lp-do-plan/SKILL.md` + `modules/plan-code.md` — pipeline trigger point; no reference to `Design-Spec-Required` or `lp-design-spec` anywhere

### Key Modules / Files

| File | Role | Stale Refs | Integration Section |
|------|------|-----------|---------------------|
| `.claude/skills/lp-design-spec/SKILL.md` | Stage 1: spec | `lp-design-system` ×2 (lines 58, 133) | Present — declares upstream/downstream |
| `.claude/skills/frontend-design/SKILL.md` | Stage 2: build UI | `lp-design-system` ×3 (lines 6, 33, 92) | Missing — no Integration section |
| `.claude/skills/tools-design-system/SKILL.md` | Supporting: token ref | None | Missing |
| `.claude/skills/lp-design-qa/SKILL.md` | Stage 3: static QA | None | Present — declares upstream/downstream |
| `.claude/skills/tools-ui-contrast-sweep/SKILL.md` | Stage 4a: contrast sweep | None | Missing — has "Relationship to Other Skills" but no upstream trigger |
| `.claude/skills/tools-web-breakpoint/SKILL.md` | Stage 4b: breakpoint sweep | None | Missing — has "Relationship to Other Skills" but no upstream trigger |
| `.claude/skills/tools-refactor/SKILL.md` | Stage 5: cleanup | None | Missing — no entry criteria, no Integration section |
| `.claude/skills/lp-do-plan/modules/plan-code.md` | Pipeline trigger point | N/A | Missing `Design-Spec-Required` routing |
| `docs/plans/lp-responsive-qa-skill/fact-find.md` | Adjacent plan | N/A | Defines lp-responsive-qa as a new skill between build and static QA |

### Patterns & Conventions Observed

- **Integration section pattern** — `lp-design-spec` and `lp-design-qa` both have `## Integration` sections listing `- **Upstream:** ...` and `- **Downstream:** ...`. This is the correct pattern to replicate.
- **Related skills in frontmatter** — `tools-ui-contrast-sweep` uses `related_skills` in frontmatter to list adjacent skills. `frontend-design` does the same but with the stale `lp-design-system` reference.
- **Relationship to Other Skills prose block** — `tools-ui-contrast-sweep` (lines 14–21) and `tools-web-breakpoint` (lines 14–22) use a prose section to describe how they relate to adjacent skills. This should be complemented by a formal `## Integration` block.
- **Handoff message pattern** — `lp-design-spec` has `## Hand-off Messages` with explicit completion message templates showing what to say when the skill finishes (e.g., "Ready for `/lp-do-plan {slug}`"). This pattern is not replicated in any other pipeline skill.
- **Design-Spec-Required flag** — defined in `lp-design-spec` Integration section at line 316. `lp-do-fact-find` references it in `lp-assessment-bootstrap/SKILL.md` line 16 but it does not appear in `lp-do-plan` anywhere.
- **Rename history** — commit `161c42704d` (2026-02-27) renamed `lp-refactor` → `tools-refactor` and `lp-design-system` → `tools-design-system`. The commit updated only `tools-index.md` and the renamed SKILL.md files themselves. `lp-design-spec` and `frontend-design` were not updated, leaving dangling references.

### Data & Contracts

- Types/schemas/events:
  - `Design-Spec-Required: yes` — a frontmatter flag defined in `lp-design-spec` SKILL.md Integration section; currently has no consuming check in `lp-do-plan`
  - `docs/plans/<slug>-design-spec.md` — the handoff artifact produced by `lp-design-spec`; consumed by `lp-do-plan` (stated) and `lp-design-qa` (required input per its Inputs table)
  - `docs/plans/<slug>-design-qa-report.md` — output of `lp-design-qa`; currently not referenced as entry condition anywhere in `tools-ui-contrast-sweep`, `tools-ui-breakpoint-sweep`, or `tools-refactor`
  - `docs/audits/contrast-sweeps/YYYY-MM-DD-<slug>/contrast-uniformity-report.md` — output of `tools-ui-contrast-sweep`
  - `docs/audits/breakpoint-sweeps/YYYY-MM-DD-<slug>/breakpoint-sweep-report.md` — output of `tools-ui-breakpoint-sweep`
- Persistence: All handoff artifacts are markdown files written to `docs/`; no DB or API dependencies.
- API/contracts: None — all integration is via file-based handoffs and SKILL.md reading conventions.

### Dependency & Impact Map

- Upstream dependencies:
  - `lp-design-spec` ← `lp-do-fact-find` (Design-Spec-Required flag) and `lp-do-plan` (IMPLEMENT task routing)
  - `tools-ui-frontend-design` ← `lp-design-spec` (design spec document)
  - `lp-design-qa` ← `lp-do-build` (completed UI) and `lp-design-spec` (expected visual state)
  - `tools-ui-contrast-sweep` ← `lp-design-qa` report findings (optional; can also run standalone)
  - `tools-ui-breakpoint-sweep` ← `lp-design-qa` report findings (optional; can also run standalone)
  - `tools-refactor` ← QA reports from `lp-design-qa`, `tools-ui-contrast-sweep`, or `tools-ui-breakpoint-sweep`
- Downstream dependents:
  - `lp-design-spec` → `lp-do-plan` (inputs), `tools-ui-frontend-design` (design reference)
  - `lp-design-qa` → `lp-do-build` (fixes), `lp-launch-qa` (assumes QA passed)
  - `tools-ui-contrast-sweep` → `tools-refactor` (fix inputs), `lp-do-build` (fix actions)
  - `tools-ui-breakpoint-sweep` → `tools-refactor` (fix inputs), `lp-do-build` (fix actions)
- Likely blast radius:
  - SKILL.md edits only — seven files total. No application code changed. No new directories.
  - One addition to `lp-do-plan/modules/plan-code.md` (Design-Spec-Required routing rule).
  - Possible addition to `lp-do-plan/SKILL.md` Foundation Gate (if Design-Spec-Required check belongs there rather than in plan-code module).

### Conflict Assessment: lp-responsive-qa-skill

The `lp-responsive-qa-skill` fact-find defines a new skill `lp-responsive-qa` that sits between `lp-do-build` and `lp-design-qa`:

```
lp-do-build → lp-responsive-qa (NEW) → lp-design-qa → lp-launch-qa
```

This plan does not add `lp-responsive-qa` to the canonical pipeline described in this fact-find. When `lp-responsive-qa` is built and merged, the pipeline diagram in each SKILL.md will need updating. The tasks in this plan must avoid:
1. Locking `tools-ui-breakpoint-sweep`'s scope definition in a way that prevents the `lp-responsive-qa-skill` plan from creating its new skill.
2. Creating any `lp-responsive-qa` skill files or modifying what `tools-ui-breakpoint-sweep` is permitted to do.

Safe approach: The pipeline diagram in SKILL.md files for this plan should note `lp-responsive-qa` (under construction) as an emerging stage between build and static QA, with a reference to the `lp-responsive-qa-skill` plan. This prevents the two plans from colliding and avoids rework.

### Test Landscape

#### Test Infrastructure

- Frameworks: None — SKILL.md files are markdown documents, not executable code.
- Commands: None required for validation; a human or agent reading the edited SKILL.md files is the validation check.
- CI integration: No CI gates specifically for SKILL.md content. Standard `pnpm lint` / `pnpm typecheck` gates do not cover markdown skill files.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|------|-----------|-------|----------------|
| Skill file presence | Manual check | `.claude/skills/tools-index.md` | Presence indexed but content not validated |
| Cross-references | None | N/A | No automated check for broken skill path references |

#### Coverage Gaps

- No automated validation that skill cross-references point to existing paths.
- No automated check that `## Integration` sections are present in all pipeline skills.

#### Testability Assessment

- Easy to test: After edits, an agent can read each SKILL.md and confirm Integration section presence, correct path references, and correct skill names.
- Hard to test: Whether the declared pipeline actually functions end-to-end requires an integration run.
- Test seams needed: A lint rule or factcheck pass over skill cross-references would catch future regressions. This is out of scope for this plan but worth noting as a follow-on.

### Recent Git History (Targeted)

- `161c42704d` (2026-02-27) — `chore(skills): reclassify 4 skills into tools-* group`: renamed `lp-refactor` → `tools-refactor` and `lp-design-system` → `tools-design-system`. Only updated `tools-index.md` and the renamed SKILL.md files. Did NOT update `lp-design-spec/SKILL.md` or `frontend-design/SKILL.md`. This is the source of all five stale references.
- `2f3a0eb34d` — `fix: resolve 7 design system integration inconsistencies`: earlier alignment work on design system integration; did not address Integration section declarations.
- `bacca5acb4` — `feat: integrate frontend-design and lp-visual with design system`: original integration of frontend-design skill; explains why `lp-design-system` references exist (pre-rename).

---

## Questions

### Resolved

- Q: Does `lp-design-system` skill still exist?
  - A: No. Renamed to `tools-design-system` on 2026-02-27 (commit `161c42704d`). Directory `.claude/skills/lp-design-system/` does not exist. Any reference to it is broken.
  - Evidence: `ls /Users/petercowling/base-shop/.claude/skills/lp-design-system/` returns "DOES NOT EXIST"; commit message confirms rename.

- Q: How many stale references exist and which files?
  - A: Five stale references to `lp-design-system` across two files:
    - `lp-design-spec/SKILL.md` line 58: table cell referencing `.claude/skills/lp-design-system/SKILL.md`
    - `lp-design-spec/SKILL.md` line 133: prose reference to `lp-design-system` skill
    - `frontend-design/SKILL.md` line 6: frontmatter `related_skills: lp-design-system, ...`
    - `frontend-design/SKILL.md` line 33: Mandatory References table cell referencing `.claude/skills/lp-design-system/SKILL.md`
    - `frontend-design/SKILL.md` line 92: Step 2 instruction referencing `.claude/skills/lp-design-system/SKILL.md`
  - Evidence: Direct `grep` on all seven SKILL.md files confirmed no `lp-refactor` references remain (already cleaned), and exactly five `lp-design-system` references remain.

- Q: Does `lp-do-plan` handle `Design-Spec-Required: yes` anywhere?
  - A: No. Searched `lp-do-plan/SKILL.md` and `lp-do-plan/modules/plan-code.md` — no match. The flag is defined only in `lp-design-spec` SKILL.md and referenced in `lp-assessment-bootstrap` SKILL.md. `lp-do-plan`'s Foundation Gate and plan-code module have no routing logic for it.
  - Evidence: `grep -n "Design-Spec-Required"` returned no matches in any lp-do-plan file.

- Q: Which skills currently have a formal `## Integration` section?
  - A: Two of seven: `lp-design-spec` and `lp-design-qa`. The remaining five (`tools-ui-frontend-design`, `tools-design-system`, `tools-ui-contrast-sweep`, `tools-ui-breakpoint-sweep`, `tools-refactor`) have either no integration declarations or only informal prose ("Relationship to Other Skills").
  - Evidence: Direct file reads confirmed presence/absence of `## Integration` headings.

- Q: Does `tools-refactor` have entry criteria from QA output?
  - A: No. `tools-refactor/SKILL.md` is 114 lines of code refactoring patterns and a checklist. It has no section stating when it is triggered, what its upstream inputs are, or what QA report format it expects. Its `related_skills` frontmatter lists `lp-do-build, tools-design-system, lp-design-qa` but without directional context.
  - Evidence: Full read of `tools-refactor/SKILL.md` confirmed.

- Q: Do `tools-ui-contrast-sweep` and `tools-ui-breakpoint-sweep` declare upstream triggers?
  - A: No. Both have "Relationship to Other Skills" prose sections listing adjacent skills, but neither states a formal upstream trigger (what event or output from the prior stage causes them to be invoked) or a formal downstream handoff.
  - Evidence: Full reads of both SKILL.md files; `grep "trigger\|upstream\|downstream"` returned only `trigger_conditions` frontmatter (which describes invocation keywords, not pipeline position).

- Q: What is the correct pipeline order?
  - A: Confirmed from `lp-design-qa` Integration section and `lp-responsive-qa-skill` fact-find:
    1. `lp-design-spec` (produces design spec doc)
    2. `tools-ui-frontend-design` via `lp-do-build` (builds UI per spec)
    3. `lp-design-qa` (static QA against spec — code analysis, no browser)
    4. `tools-ui-contrast-sweep` and/or `tools-ui-breakpoint-sweep` (browser sweeps — parallel)
    5. `tools-refactor` (token/maintainability cleanup driven by QA findings)
    Note: `lp-responsive-qa` (under construction, `lp-responsive-qa-skill` plan) will sit between steps 2 and 3 once built.
  - Evidence: `lp-design-qa` Integration section: "Loop position: S9B (UI Regression QA) — post-build, pre-launch-qa". `lp-responsive-qa-skill` fact-find integration diagram confirms insertion point.

- Q: What handoff artifact does each stage produce for the next stage?
  - A: Confirmed from SKILL.md Inputs and Output sections:
    - `lp-design-spec` → produces `docs/plans/<slug>-design-spec.md` → consumed by `lp-do-plan` and `lp-design-qa`
    - `tools-ui-frontend-design` (via `lp-do-build`) → produces built component files (listed in task `Affects`) → consumed by `lp-design-qa`
    - `lp-design-qa` → produces `docs/plans/<slug>-design-qa-report.md` → currently undeclared as upstream trigger for sweep tools or refactor
    - `tools-ui-contrast-sweep` → produces `docs/audits/contrast-sweeps/YYYY-MM-DD-<slug>/contrast-uniformity-report.md` → should feed `tools-refactor`
    - `tools-ui-breakpoint-sweep` → produces `docs/audits/breakpoint-sweeps/YYYY-MM-DD-<slug>/breakpoint-sweep-report.md` → should feed `tools-refactor`
    - `tools-refactor` → produces refactored component files (no formal output artifact declared)
  - Evidence: All output paths confirmed from direct SKILL.md reads.

- Q: Where should the `Design-Spec-Required` routing check live in `lp-do-plan`?
  - A: It belongs in `lp-do-plan/modules/plan-code.md` as a pre-task gate. The Foundation Gate in `lp-do-plan/SKILL.md` already checks for `Deliverable-Type`, `Execution-Track`, and confidence inputs. Adding a `Design-Spec-Required` routing check here would add a prerequisite gate that blocks plan creation until `lp-design-spec` runs. The better placement is in `plan-code.md` as a "Design Gate" step: if `Design-Spec-Required: yes` in the fact-find, add an INVESTIGATE/IMPLEMENT task to run `lp-design-spec` before any UI IMPLEMENT tasks, or stop planning and redirect.
  - Evidence: `lp-do-plan/SKILL.md` Phase 3 Foundation Gate pattern; `lp-design-spec` Integration section ("When a fact-find classifies a feature as UI-heavy, it should add `Design-Spec-Required: yes`… This signals that `/lp-design-spec` should run before `/lp-do-plan`.").

### Open (Operator Input Required)

No genuinely open questions. All questions were resolved from repository evidence and reasoning.

---

## Confidence Inputs

- Implementation: 95%
  - Evidence: All seven SKILL.md files were read fully. Stale references are exact-matched by grep. Integration section presence/absence is confirmed. Pipeline order is confirmed by two independent sources. The scope is purely documentation edits with no code changes.
  - What raises to ≥90: Already at 95% — only uncertainty is whether the plan-code module placement for Design-Spec-Required is preferred over Foundation Gate placement; this is a minor ordering choice with no wrong answer.

- Approach: 90%
  - Evidence: The Integration section pattern is established in two of seven skills and is clearly the correct convention to replicate. Stale reference fixes are mechanical substitutions.
  - What raises to ≥90: Already at 90%.
  - What raises to ≥95: A quick agent validation pass confirming all edited references resolve to existing files.

- Impact: 85%
  - Evidence: Stale path references cause agent failures when loading referenced skill files. Absent Integration sections cause agents to misorder skill invocations. The `Design-Spec-Required` gap means UI-heavy IMPLEMENT tasks may proceed without a design spec being produced first.
  - What raises to ≥90: Confirming that agents actually attempt to load the stale paths at runtime (not just list them). The impact is high if agents faithfully follow `related_skills` and path references — confirmed pattern from `frontend-design` Step 2 "Read `.claude/skills/lp-design-system/SKILL.md`".

- Delivery-Readiness: 98%
  - Evidence: Documentation markdown edits only — seven SKILL.md files plus one planning module (`lp-do-plan/modules/plan-code.md`). No application code. No approvals. No infrastructure. No external dependencies. ~30 targeted line changes across eight files.

- Testability: 80%
  - Evidence: No executable tests exist for SKILL.md content. Validation is manual (agent reads edited files and confirms correctness). A factcheck pass after edits provides reasonable assurance.
  - What raises to ≥90: A grep-based post-build check confirming no `lp-design-system` references remain.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| lp-responsive-qa-skill plan touches tools-ui-breakpoint-sweep scope simultaneously | Low | Medium — merge conflict on SKILL.md | Pipeline diagram edits in this plan should note lp-responsive-qa as "under construction" rather than making substantive scope changes to tools-ui-breakpoint-sweep itself |
| Plan-code module Design-Spec-Required addition conflicts with future lp-do-plan changes | Low | Low — small addition in a clearly separate section | Scope addition to plan-code.md as a named "Design Gate" subsection minimizes conflict surface |
| Stale `frontend-design` related_skills frontmatter causes tools-index or skill registry mismatch | Low | Low — index already correct | tools-index.md already lists correct invocation names; frontmatter fix is cosmetic but correct |
| Additional stale references discovered during build that were not found by grep | Very low | Low — pattern is lp-design-system and lp-refactor only | Grep was exhaustive across all seven files; no lp-refactor references found in any file |

---

## Planning Constraints & Notes

- Must-follow patterns:
  - Integration section format: `## Integration` with `- **Upstream:** ...` and `- **Downstream:** ...` bullets and `- **Loop position:** ...` (modelled on `lp-design-qa`'s Integration section)
  - Stale reference replacements: `lp-design-system` → `tools-design-system` and path `.claude/skills/lp-design-system/SKILL.md` → `.claude/skills/tools-design-system/SKILL.md`
  - `lp-do-plan/modules/plan-code.md` addition must not duplicate or conflict with existing Foundation Gate content in `lp-do-plan/SKILL.md`
  - Do NOT create a new `lp-responsive-qa` skill file or modify the scope boundary of `tools-ui-breakpoint-sweep` in ways that conflict with `docs/plans/lp-responsive-qa-skill/`
- Rollout/rollback expectations:
  - Pure documentation edits. Rollback = `git revert`. No migration needed.
- Observability expectations:
  - After edits, agents following the pipeline will find correct skill paths and declared handoffs. Correctness is observable by running the pipeline on a test feature.

---

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Stale reference identification — lp-design-system in lp-design-spec | Yes | None | No |
| Stale reference identification — lp-design-system in frontend-design | Yes | None | No |
| Stale reference identification — lp-refactor across all files | Yes | None — no remaining lp-refactor refs found | No |
| Integration section mapping — lp-design-spec | Yes | None — Integration section present and correct except for stale refs | No |
| Integration section mapping — frontend-design | Yes | None — Integration section absent; plan must add it | No |
| Integration section mapping — tools-design-system | Yes | None — Integration section absent; plan must add brief one | No |
| Integration section mapping — lp-design-qa | Yes | None — Integration section present and correct | No |
| Integration section mapping — tools-ui-contrast-sweep | Yes | None — Relationship prose present; formal Integration section absent | No |
| Integration section mapping — tools-ui-breakpoint-sweep | Yes | None — Relationship prose present; formal Integration section absent | No |
| Integration section mapping — tools-refactor | Yes | None — No integration declarations at all | No |
| Design-Spec-Required intake contract — lp-do-plan | Yes | [Missing domain coverage] [Moderate]: lp-do-plan/modules/plan-code.md has no Design Gate. This is the core gap — addressed by TASK-07 | Yes — addressed by TASK-07 |
| Conflict assessment — lp-responsive-qa-skill | Yes | None — confirmed out-of-scope for this plan; pipeline diagrams will note "under construction" | No |
| Handoff artifact mapping | Yes | None — all output paths confirmed from SKILL.md reads | No |

No Critical scope gaps found. The one Moderate gap (Design-Spec-Required routing in lp-do-plan) is resolved by TASK-07 in the task seed list. Proceeding to persist.

---

## Suggested Task Seeds

The following task ordering avoids conflict with `lp-responsive-qa-skill` (which owns `lp-responsive-qa` skill creation and may touch `tools-ui-breakpoint-sweep` scope annotation). TASK-01 through TASK-06 are SKILL.md documentation additions; TASK-07 adds intake routing to `lp-do-plan/modules/plan-code.md`.

- TASK-01: Fix stale references in `lp-design-spec/SKILL.md` — replace `lp-design-system` with `tools-design-system` at lines 58 and 133; replace path `.claude/skills/lp-design-system/SKILL.md` with `.claude/skills/tools-design-system/SKILL.md`. No other changes.

- TASK-02: Fix stale references in `frontend-design/SKILL.md` — replace `lp-design-system` with `tools-design-system` in frontmatter `related_skills` (line 6), in Mandatory References table (line 33), and in Step 2 instruction (line 92). No other changes to these lines.

- TASK-03: Add `## Integration` section to `frontend-design/SKILL.md` (tools-ui-frontend-design) declaring:
  - Upstream: `lp-design-spec` (design spec document); `lp-do-plan` (IMPLEMENT task)
  - Downstream: `lp-design-qa` (consumes built UI); `lp-do-build` (executes implementation)
  - Loop position: S9A (UI Build) — post-design-spec, pre-design-qa

- TASK-04: Add brief `## Integration` section to `tools-design-system/SKILL.md` declaring:
  - Role: Consulted by `lp-design-spec`, `tools-ui-frontend-design`, `lp-design-qa`, and `tools-refactor` as a token reference. Not a pipeline stage — a supporting reference.
  - No upstream/downstream — it is invoked on demand, not sequentially.

- TASK-05: Add `## Integration` sections to `tools-ui-contrast-sweep/SKILL.md` and `tools-ui-breakpoint-sweep/SKILL.md` declaring:
  - Upstream: `lp-design-qa` report (optional but typical trigger); can also be invoked standalone
  - Downstream: `tools-refactor` (findings feed token/maintainability cleanup); `lp-do-build` (if code fixes needed)
  - Loop position: S9C (Browser QA Sweeps) — post-design-qa, pre-refactor
  - Note: tools-ui-breakpoint-sweep scope annotation should acknowledge lp-responsive-qa (under construction, `docs/plans/lp-responsive-qa-skill/`) as a separate rendered-screenshot skill for breakpoint QA; this skill covers static/DOM-level containment analysis.

- TASK-06: Add `## Integration` and `## Entry Criteria` sections to `tools-refactor/SKILL.md` declaring:
  - Upstream triggers: QA report(s) from one or more of `lp-design-qa`, `tools-ui-contrast-sweep`, `tools-ui-breakpoint-sweep` containing token-compliance or maintainability findings; or explicit operator invocation after build
  - Entry criteria: At least one QA finding citing arbitrary values, missing semantic tokens, or component structure issues — OR operator direction to improve a specific component's maintainability
  - Downstream: `lp-do-build` (executes refactor tasks from the plan); human PR review
  - Loop position: S9D (Post-QA Refactor) — final stage before merge/launch

- TASK-07: Add `Design-Spec-Required` routing to `lp-do-plan/modules/plan-code.md` as a "Design Gate" subsection:
  - If `Design-Spec-Required: yes` appears in the fact-find frontmatter or body: insert a prerequisite task in the plan to run `/lp-design-spec <feature-slug>` before any UI IMPLEMENT tasks; set that prerequisite task as a dependency for all tasks touching UI components.
  - If `Design-Spec-Required` is absent or `no`: no change to existing planning flow.
  - The gate must not block planning for non-UI code tasks (backend, data, infra).

---

## Execution Routing Packet

- Primary execution skill: `lp-do-build` (all changes are documentation markdown edits to SKILL.md files and one planning module — within lp-do-build's scope for skill infrastructure documentation changes)
- Supporting skills: None required
- Deliverable acceptance package:
  - All five stale `lp-design-system` references replaced with `tools-design-system` — verified by grep returning zero matches
  - `## Integration` section present in: `frontend-design/SKILL.md`, `tools-design-system/SKILL.md`, `tools-ui-contrast-sweep/SKILL.md`, `tools-web-breakpoint/SKILL.md`, `tools-refactor/SKILL.md`
  - `## Entry Criteria` section present in `tools-refactor/SKILL.md`
  - Design Gate logic present in `lp-do-plan/modules/plan-code.md`
  - `lp-design-spec/SKILL.md` and `lp-design-qa/SKILL.md` Integration sections unchanged (already correct)
- Post-delivery measurement plan:
  - Run a factcheck pass over all edited files confirming correct paths
  - Grep for `lp-design-system` across all skill files — must return zero results

---

## Evidence Gap Review

### Gaps Addressed

- **Stale reference scope**: Exhaustively grepped all seven SKILL.md files for `lp-design-system` and `lp-refactor`. No surprises — stale refs are exactly where the rename commit left them.
- **Integration section inventory**: All seven SKILL.md files fully read. Presence/absence of Integration sections confirmed for each.
- **Design-Spec-Required routing**: Searched `lp-do-plan/SKILL.md` and `lp-do-plan/modules/plan-code.md`. Confirmed gap — no routing logic exists.
- **Pipeline order**: Confirmed from two independent sources (`lp-design-qa` Integration section, `lp-responsive-qa-skill` fact-find integration diagram).
- **lp-responsive-qa-skill conflict surface**: Read full fact-find at `docs/plans/lp-responsive-qa-skill/fact-find.md`. Conflict surface is limited to scope annotation on `tools-ui-breakpoint-sweep`. Mitigation is to note "under construction" without making substantive changes to breakpoint-sweep's scope definition.

### Confidence Adjustments

- Implementation confidence: 95% (high — exhaustive reads confirm full scope)
- No downward adjustments made. All key evidence was directly observable.

### Remaining Assumptions

- The `Design-Spec-Required` gate belongs in `plan-code.md` rather than `lp-do-plan/SKILL.md` Foundation Gate. This is a placement judgment — both locations work technically. Foundation Gate placement would make it more visible but could be confused with the existing delivery-readiness gate. Plan-code placement scopes it correctly to UI code tasks.
- `tools-ui-breakpoint-sweep` scope annotation approach ("note lp-responsive-qa as under construction") is the minimally invasive path. If the `lp-responsive-qa-skill` plan builds before this plan, the TASK-05 annotation may need minor adjustment.

---

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan ui-design-tool-chain-pipeline --auto`
