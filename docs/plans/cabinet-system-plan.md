---
Type: Plan
Status: Active
Domain: Business-OS
Created: 2026-02-09
Last-updated: 2026-02-09
Feature-Slug: cabinet-system
Overall-confidence: 81%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Business-Unit: BOS
---

# Cabinet System Plan

## Summary

Evolve the `/ideas-go-faster` skill from a single-lens sweep into a multi-agent "Cabinet" system — a composite idea factory where multiple expert personas independently generate ideas, gatekeepers filter and prioritize, and a technical cabinet reviews the codebase. The system is implemented entirely as prompt-only skill files (SKILL.md + shared library files in `_shared/cabinet/`), with no TypeScript code changes in Phase 0. Ideas flow through a structured pipeline with confidence gating, attribution tracking via a parseable Dossier Header format stored in the existing `content` field, and stance-driven focus control.

## Goals

- Multi-lens composite ideation: 6 business generators + technical cabinet, each sub-expert producing independently-framed ideas with person-level attribution
- Structured attribution: Machine-parseable Dossier Header in idea `content` field tracking originator-expert (person-level), originator-lens (group-level), contributors, confidence tier, VOI-Score, decisions
- Confidence gating: Ideas classified as Presentable / Data Gap Proposal / Hunch before reaching gatekeepers
- Multi-stage pipeline: Generation → Confidence gate → Cluster/dedup → Munger/Buffett filter → Card creation → Drucker/Porter priority → Fact-find seeding (top K only)
- Stance system: `improve-data` (default) and `grow-business` stances shift what all lenses look for
- Knowledge bootstrap: Business plans and people profiles populated as Cabinet prerequisites

## Non-goals

- TypeScript/API schema changes (Phase 0 — all attribution lives in `content` field)
- New D1 database columns or migrations
- Automated scheduling (Pete-triggered only)
- Literal multi-agent runtime or parallel LLM calls
- Replacing the existing kanban pipeline (Cabinet feeds into it)

## Constraints & Assumptions

- Constraints:
  - Prompt-only architecture: all deliverables are `.md` files (SKILL.md, persona definitions, templates)
  - Agent API is source of truth, fail-closed
  - Idea Status enum is fixed: `raw|worked|converted|dropped` — no new values in Phase 0
  - Single Claude Code session per invocation — lenses execute sequentially
  - Existing kanban pipeline is preserved — Cabinet operates upstream of it
- Assumptions:
  - Context window can hold orchestrator (~800 lines) + largest persona file (~200 lines) + business data without degradation (HIGH RISK — mitigated by context discipline strategy in CS-11, validated by CS-12 dry-run)
  - The `_shared/cabinet/` pattern works for persona file loading (same pattern as `_shared/card-operations.md` — MEDIUM confidence)
  - 7 open fact-find questions proceed with documented defaults (all low-risk):
    1. Single skill vs multi-skill architecture? → Option D (orchestrator + persona library in `_shared/cabinet/`)
    2. Attribution in data model vs content? → Phase 0 uses structured markdown in `content` field
    3. Idea Dossier format — how structured? → Full format (provenance, confidence ledger, rivalry record)
    4. Munger/Buffett and Drucker/Porter — separate skills or inline? → Inline stages
    5. Business "tooling" analogs (lint/typecheck/test) — implementation? → Checklist sections in Dossier template
    6. How many stances initially? → 2 (`improve-data`, `grow-business`)
    7. What triggers a stance change? → Parameter to invocation, defaulting to `improve-data`, no persistent state

## Fact-Find Reference

- Related brief: `docs/plans/cabinet-system-fact-find.md`
- Key findings:
  - Current `ideas-go-faster` is 730 lines, single-lens (Musk only), no attribution, no confidence tiers
  - Skill orchestration precedent: `improve-guide` → `improve-en-guide` + `improve-translate-guide`
  - `_shared/` pattern proven for reusable skill helpers (card-operations.md, stage-doc-operations.md)
  - Business plans and people profiles are empty — critical dependency for Drucker/Porter stage
  - Idea `content` field is free-form markdown — Dossier Header stores attribution without API changes
  - Idea Status enum hard-coded in Zod schema — Data Gap Proposals use Tags, not new status values
  - Stance concept (user decision): generators are stance-sensitive, gatekeepers stance-invariant, prioritizers use stance as plan-weight emphasis
  - All lenses from day one, in-depth personas, integrated code-review (user decisions)

## Existing System Notes

- Key modules/files:
  - `.claude/skills/ideas-go-faster/SKILL.md` (730 lines) — current sweep skill, will be replaced by orchestrator
  - `.claude/skills/_shared/card-operations.md` (164 lines) — API calling patterns
  - `.claude/skills/_shared/stage-doc-operations.md` (350 lines) — stage doc lifecycle
  - `.claude/skills/improve-guide/SKILL.md` (226 lines) — orchestration precedent
  - `.claude/skills/work-idea/SKILL.md` — requires `Status: raw` at entry
  - `packages/platform-core/src/repositories/businessOsIdeas.server.ts` — Idea Zod schema, Status enum
  - `docs/business-os/strategy/businesses.json` — business catalog (4 businesses)
  - `docs/business-os/strategy/business-maturity-model.md` — L1/L2/L3 model
- Patterns to follow:
  - Fail-closed API-first (card-operations.md)
  - Progressive disclosure with user choice (improve-guide)
  - Append-only learnings (update-business-plan)
  - Strict Musk algorithm ordering (ideas-go-faster constitution)

## Proposed Approach

**Option D (Hybrid):** Orchestrator SKILL.md + persona definitions in `_shared/cabinet/` + filter/priority stages inline in orchestrator.

- **Orchestrator** (`.claude/skills/ideas-go-faster/SKILL.md`): Replaces current skill. ~800 lines. Implements the full pipeline, stance parameter, confidence gate, clustering, and API integration. Reads persona files from `_shared/cabinet/` as needed.
- **Persona library** (`.claude/skills/_shared/cabinet/`): One file per lens/stage. Each ~100-200 lines. Contains principles, signature questions, failure modes, domain boundaries, stance-specific behavior.
- **Templates** (`.claude/skills/_shared/cabinet/`): Dossier template, stances definition, business tooling checklists.

Why Option D over alternatives:
- Option A (monolithic): 3000+ lines in one file would exceed practical prompt engineering limits
- Option B (orchestrator + lens files only): No separate treatment for heavy filter stages
- Option C (sub-skills): Too many skill directories (10+), heavy per-invocation overhead
- **Option D balances modularity with simplicity**: persona files are reusable references, not standalone skills

**Execution order:** Foundation artifacts first (dossier template, stances, data dependencies), then personas (generators → gatekeepers → technical), then orchestrator integration, then validation.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| CS-01 | IMPLEMENT | Create stance definitions file | 85% | S | Complete (2026-02-09) | - | CS-06, CS-07, CS-08, CS-09, CS-10, CS-11 |
| CS-02 | IMPLEMENT | Bootstrap business plans + people profiles | 80% | M | Complete (2026-02-09) | - | CS-11 |
| CS-03 | IMPLEMENT | Create Dossier template + parseable attribution format | 88% | M | Complete (2026-02-09) | - | CS-04, CS-05, CS-06, CS-07, CS-08, CS-09, CS-10, CS-11 |
| CS-04 | IMPLEMENT | Create Data Gap Proposal lifecycle doc | 85% | S | Complete (2026-02-09) | CS-03 | CS-11 |
| CS-05 | IMPLEMENT | Create dedup/rival clustering mechanism doc | 82% | S | Complete (2026-02-09) | CS-03 | CS-11 |
| CS-06 | IMPLEMENT | Create persona fidelity rubric + regression scenarios | 88% | M | Complete (2026-02-09) | CS-03, CS-01 | CS-07, CS-08, CS-09, CS-10, CS-11 |
| CS-07 | IMPLEMENT | Write persona: Musk lens (feasibility/constraint) | 90% | M | Complete (2026-02-09) | CS-03, CS-01, CS-06 | CS-11 |
| CS-08 | IMPLEMENT | Write persona: Bezos lens (customer-backwards) | 85% | M | Complete (2026-02-09) | CS-03, CS-01, CS-06 | CS-11 |
| CS-09 | IMPLEMENT | Write personas: Marketing, Sales, Sourcing lenses | 82% | L | Complete (2026-02-09) | CS-03, CS-01, CS-06 | CS-11 |
| CS-10 | IMPLEMENT | Write personas: Munger+Buffett filter, Drucker+Porter priority | 85% | L | Complete (2026-02-09) | CS-03, CS-01, CS-06 | CS-11 |
| CS-11 | IMPLEMENT | Write the Cabinet Secretary orchestrator skill | 80% | L | Complete (2026-02-09) | CS-01, CS-02, CS-03, CS-04, CS-05, CS-06, CS-07, CS-08, CS-09, CS-10 | CS-12 |
| CS-12 | CHECKPOINT | Horizon checkpoint — dry-run validation | 95% | S | Ready | CS-11 | CS-13, CS-14 |
| CS-13 | IMPLEMENT | Write persona: Technical code-review cabinet | 82% | L | Pending | CS-12 | CS-14 |
| CS-14 | IMPLEMENT | Validation run — full Cabinet sweep under `improve-data` stance | 75% | M | Blocked-by-checkpoint | CS-12, CS-13 | - |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Parallelism Guide

_Generated by `/sequence-plan`. Tasks within a wave can run in parallel via subagents._

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | CS-01, CS-02, CS-03 | - | Foundation: stances, business plans bootstrap, dossier template. Independent files. |
| 2 | CS-04, CS-05, CS-06 | Wave 1: CS-03 (+ CS-01 for CS-06) | DGP lifecycle, clustering, persona fidelity rubric. CS-06 gates all persona tasks. |
| 3 | CS-07, CS-08, CS-09, CS-10 | Wave 2: CS-06 (+ Wave 1: CS-01, CS-03) | All persona tasks. Max parallelism wave. Each must pass fidelity rubric. |
| 4 | CS-11 | Waves 1-3 complete | Orchestrator integrates all outputs. Sequential bottleneck. |
| 5 | CS-12 | Wave 4 complete | CHECKPOINT — dry-run validation. |
| 6 | CS-13 | Wave 5 complete | Technical code-review persona (post-checkpoint). |
| 7 | CS-14 | Wave 6: CS-13 | Full end-to-end validation run. Status: Blocked-by-checkpoint (75%). |

**Max parallelism:** 4 (Wave 3) | **Critical path:** CS-03 → CS-06 → CS-07 → CS-11 → CS-12 → CS-13 → CS-14 (7 waves) | **Total tasks:** 14

## Tasks

### CS-01: Create stance definitions file

- **Status:** Complete (2026-02-09) — Commit `69fe6bad4d`
- **Type:** IMPLEMENT
- **Affects:** `.claude/skills/_shared/cabinet/stances.md` (new)
- **Depends on:** -
- **Blocks:** CS-06, CS-07, CS-08, CS-09, CS-10, CS-11
- **Confidence:** 85%
  - Implementation: 88% — Stance concept well-defined in fact-find. Two stances with clear descriptions.
  - Approach: 85% — Stance boundary resolved: generators sensitive, gatekeepers invariant, prioritizers use as plan-weight.
  - Impact: 82% — Stance propagation to every lens is the primary risk. If the stance-behavior spec is vague, every persona inherits that vagueness.
- **Effort:** S (1 new file, definitions only)
- **Acceptance:**
  - Two stances defined: `improve-data` (default) and `grow-business`
  - Per-stance: description, diagnostic question shift, what "good" looks like
  - Stance boundary rules: which pipeline stages are stance-sensitive vs invariant
  - Per-lens stance guidance template (structure each persona file must follow)
  - Invocation syntax: `--stance=improve-data` (default) / `--stance=grow-business`
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: Stance file contains both stance definitions with all required sections
    - TC-02: Stance boundary table explicitly marks generators as sensitive, Munger/Buffett as invariant, Drucker/Porter as plan-weight shift
    - TC-03: Per-lens guidance template is included so persona authors know what to write
  - **Acceptance coverage:** TC-01-03 cover all acceptance criteria
  - **Test type:** Content review
  - **Test location:** Manual review
  - **Run:** Read and verify structure
- **TDD execution plan:**
  - **Red:** Persona file (CS-07) needs stance-specific sections but stance template doesn't exist yet
  - **Green:** Define stances with concrete per-lens guidance template
  - **Refactor:** Tighten stance descriptions based on persona authoring feedback
- **Rollout / rollback:**
  - Rollout: New file, no impact
  - Rollback: Delete file
- **Documentation impact:** None
- **Notes / references:**
  - Fact-find stance decisions: `cabinet-system-fact-find.md` § "Questions > Resolved (User Decisions)" > stance entries
  - User quote: "when the stance is 'improve data' the ideas should be more about filling gaps in current data"

---

### CS-02: Bootstrap business plans + people profiles

- **Status:** Complete (2026-02-09) — Commit `69fe6bad4d`
- **Type:** IMPLEMENT
- **Affects:**
  - `docs/business-os/strategy/BRIK/plan.user.md` (new)
  - `docs/business-os/strategy/PIPE/plan.user.md` (new)
  - `docs/business-os/strategy/PLAT/plan.user.md` (new)
  - `docs/business-os/strategy/BOS/plan.user.md` (new)
  - `docs/business-os/people/people.user.md` (new)
- **Depends on:** - (foundation data — prerequisite for meaningful Drucker/Porter evaluation)
- **Blocks:** CS-11
- **Confidence:** 80%
  - Implementation: 85% — Schemas defined in `/update-business-plan` and `/update-people` skills. Content needs to come from Pete (Q&A or manual input).
  - Approach: 82% — Minimum viable content defined in fact-find: top 3 priorities, top 3 risks, 1+ metric per business; workload, skills, availability per person.
  - Impact: 75% — Without plans, Drucker/Porter operates in degraded mode (maturity model proxy only). Without profiles, task assignment has no feasibility input. Moved to Wave 1 so dry-run (CS-12) tests real Drucker/Porter behavior, not fallback mode.
- **Effort:** M (5 new files, content requires user input or inference from existing business data)
- **Acceptance:**
  - 4 business plans bootstrapped with minimum content:
    - Strategy: Top 3 focus areas per business
    - Risks: Top 3 active risks per business
    - Metrics: At least 1 KPI per business
    - Opportunities and Learnings sections (can be empty initially)
  - 1 people profile bootstrapped with minimum content:
    - Pete: Current workload (cards in progress from discovery-index), primary skills, availability
  - Created via `/update-business-plan` and `/update-people` skill invocations (not direct file writes)
  - Content sourced from: businesses.json, maturity model, discovery-index.json, card inventory
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: Each business plan file exists and contains Strategy, Risks, Metrics sections
    - TC-02: People profile exists and contains workload, skills, availability for Pete
    - TC-03: Drucker/Porter stage can read plans and weight priorities (no longer falls back to maturity model)
    - TC-04: Plans follow schema from `/update-business-plan` skill
  - **Acceptance coverage:** TC-01-02 cover existence; TC-03 covers integration; TC-04 covers schema compliance
  - **Test type:** File existence + content validation
  - **Test location:** Manual review + CS-14 integration
  - **Run:** Read files, verify sections exist
- **TDD execution plan:**
  - **Red:** Drucker/Porter stage reads plans → files don't exist → falls back to maturity model
  - **Green:** Bootstrap minimum viable plans and profile
  - **Refactor:** Enrich plan content after first full sweep reveals additional priorities
- **What would make this >=90%:** Pete reviews and confirms plan content is accurate
- **Rollout / rollback:**
  - Rollout: New files in existing directory structure
  - Rollback: Delete files (Drucker/Porter gracefully degrades to maturity model)
- **Documentation impact:** None (these ARE the documentation)
- **Notes / references:**
  - Plan schema: `.claude/skills/update-business-plan/SKILL.md`
  - Profile schema: `.claude/skills/update-people/SKILL.md`
  - Fact-find minimum content: `cabinet-system-fact-find.md` § "Gap Detail: Knowledge System" > maintenance loop proposal

---

### CS-03: Create Dossier template + parseable attribution format

- **Status:** Complete (2026-02-09) — Commit `69fe6bad4d`
- **Type:** IMPLEMENT
- **Affects:** `.claude/skills/_shared/cabinet/dossier-template.md` (new)
- **Depends on:** -
- **Blocks:** CS-04, CS-05, CS-06, CS-07, CS-08, CS-09, CS-10, CS-11
- **Confidence:** 88%
  - Implementation: 90% — Well-defined grammar in fact-find (Dossier Header delimiters, field specs, Decision Log format). Follows existing markdown template patterns in stage-doc-operations.md.
  - Approach: 88% — Parseable format with HTML comment delimiters is proven (similar to frontmatter parsing). Fact-find defines complete grammar rules.
  - Impact: 85% — Core artifact that all other tasks depend on. Must be correct — parsing errors cascade.
- **Effort:** M (1 new file, defines format contract used by all other tasks, needs careful grammar spec)
- **Acceptance:**
  - Dossier Header block with `<!-- DOSSIER-HEADER -->` / `<!-- /DOSSIER-HEADER -->` delimiters
  - All required fields defined: Originator-Expert (person-level, e.g. `hopkins`), Originator-Lens (lens-level, e.g. `marketing`), Contributors, Confidence-Tier, Confidence-Score, Pipeline-Stage, Cluster-ID, Rival-Lenses, VOI-Score
  - `Originator-Expert` is the primary attribution field — each sub-expert (e.g. Hopkins, Ogilvy, Reeves within the marketing lens) gets an independent generation pass and is individually attributed
  - `Originator-Lens` is the grouping field for clustering/dedup
  - `VOI-Score` (Value of Information, 0-1): Rates how much value would be gained by filling this idea's data gaps. Used by DGP lifecycle (CS-04) to prioritize which gaps get investigated first.
  - Enum values for Confidence-Tier: `presentable` / `data-gap` / `hunch`
  - Enum values for Pipeline-Stage: `candidate` / `filtered` / `promoted` / `worked` / `prioritized`
  - Decision Log block with `<!-- DECISION-LOG -->` / `<!-- /DECISION-LOG -->` delimiters
  - Per-expert sections with Verdict + Rationale
  - "Presentable Idea" minimum completeness checklist (5 criteria from fact-find)
  - Business tooling checklists (lint: missing fields, typecheck: consistency, test: hypothesis)
  - Priority formula with Signal-Speed: `Priority = (Impact × Confidence × Signal-Speed) / (Effort × (1 + Risk))`
  - Example dossier showing complete format with all fields populated
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: Dossier Header round-trip — write a complete header, manually parse by splitting on delimiters and `:`, verify all fields extract correctly
    - TC-02: Decision Log round-trip — write a 4-expert log, split on `## `, verify Verdict and Rationale extract per expert
    - TC-03: Presentable Idea checklist — example idea missing "customer identified" fails checklist → classified as data-gap
    - TC-04: Hunch classification — idea with no evidence and no data gap question → classified as hunch
    - TC-05: Business lint — dossier missing Originator-Lens field → lint error reported
  - **Acceptance coverage:** TC-01 covers format spec; TC-02 covers decision log; TC-03-04 cover confidence gate; TC-05 covers business tooling
  - **Test type:** Manual scenario validation (prompt-only system — no executable tests)
  - **Test location:** Inline in task validation during dry-run (CS-12)
  - **Run:** Manual review of example dossier content
- **TDD execution plan:**
  - **Red:** Write an example dossier with intentional format violations (missing delimiter, wrong enum value) — expect orchestrator to reject
  - **Green:** Define the template with all grammar rules so example passes validation
  - **Refactor:** Simplify grammar rules if any are redundant
- **Rollout / rollback:**
  - Rollout: New file, no impact on existing system
  - Rollback: Delete file
- **Documentation impact:** None (self-documenting template)
- **Notes / references:**
  - Fact-find Dossier Header grammar: `cabinet-system-fact-find.md` § "Gap Detail: Data Model" > Dossier Header grammar rules
  - Precedent: `_shared/stage-doc-operations.md` template patterns

---

### CS-04: Create Data Gap Proposal lifecycle doc

- **Status:** Complete (2026-02-09) — Commit `9c253ccdc4`
- **Type:** IMPLEMENT
- **Affects:** `.claude/skills/_shared/cabinet/data-gap-lifecycle.md` (new)
- **Depends on:** CS-03
- **Blocks:** CS-11
- **Confidence:** 85%
  - Implementation: 88% — Lifecycle fully defined in fact-find: store as Idea with `Tags: ["data-gap"]` + Dossier Header `Confidence-Tier: data-gap`.
  - Approach: 85% — No API changes needed. Uses existing Tags field and content field.
  - Impact: 82% — Must integrate cleanly with `/work-idea` (which requires `Status: raw`). Verified: DGPs keep `Status: raw`.
- **Effort:** S (1 new file, lifecycle definition)
- **Acceptance:**
  - DGP storage: Idea entity, `Status: raw`, `Tags: ["data-gap", "sweep-generated"]`, `Confidence-Tier: data-gap` in Dossier Header
  - VOI-Score required: Every DGP must include a `VOI-Score` (0-1) rating how much value would be gained by filling the gap. Pickup order is VOI-Score descending.
  - Pickup mechanism: Next sweep under `improve-data` stance reads DGPs ordered by VOI-Score as prioritized investigation targets
  - Promotion path: When data gap filled, update Dossier Header `Confidence-Tier` to `presentable`, remove `data-gap` tag
  - Hunch suppression: Items below both presentable and data-gap thresholds are logged in sweep report only, not persisted
  - Compatible with `/work-idea` entry requirement (`Status: raw`)
  - **DGP→build guardrail:** DGPs MUST convert to fact-finding cards, never directly to build cards. The DGP lifecycle produces investigation tasks (fact-find stage docs), not implementation tasks. Only after a DGP is promoted to `presentable` and passes Munger/Buffett filter can it enter the build lane via normal pipeline.
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: DGP creation — idea fails presentable checklist → stored with correct Tags and Dossier Header
    - TC-02: DGP pickup — next sweep under `improve-data` queries ideas with `data-gap` tag
    - TC-03: DGP promotion — data gap filled → `Confidence-Tier` updated to `presentable`, tag removed
    - TC-04: Hunch suppression — idea fails both thresholds → not persisted, only in sweep report
    - TC-05: `/work-idea` compatibility — DGP with `Status: raw` can be processed by `/work-idea`
  - **Acceptance coverage:** TC-01-05 cover full lifecycle
  - **Test type:** Scenario walkthrough
  - **Test location:** Manual validation during CS-12 dry-run
  - **Run:** Trace DGP through full lifecycle in sweep report
- **TDD execution plan:**
  - **Red:** Orchestrator encounters sub-presentable idea — no routing mechanism exists
  - **Green:** Define DGP lifecycle with storage, pickup, promotion, and suppression rules
  - **Refactor:** Simplify if DGP/hunch distinction proves unnecessary
- **Rollout / rollback:**
  - Rollout: New file, no impact
  - Rollback: Delete file
- **Documentation impact:** None
- **Notes / references:**
  - Fact-find DGP lifecycle: `cabinet-system-fact-find.md` § "Gap Detail: Confidence Gate Mechanism" > Data Gap Proposal lifecycle
  - Idea Status enum constraint: `businessOsIdeas.server.ts` — `raw|worked|converted|dropped`

---

### CS-05: Create dedup/rival clustering mechanism doc

- **Status:** Complete (2026-02-09) — Commit `9c253ccdc4`
- **Type:** IMPLEMENT
- **Affects:** `.claude/skills/_shared/cabinet/clustering.md` (new)
- **Depends on:** CS-03
- **Blocks:** CS-11
- **Confidence:** 82%
  - Implementation: 82% — Concept defined in fact-find but no repo precedent for clustering. Agent must cluster semantically similar ideas within a single session.
  - Approach: 85% — Single-session clustering is feasible (agent reads all ideas, groups by problem/opportunity, merges into dossiers). No external tooling needed.
  - Impact: 80% — Without clustering, Munger/Buffett waste attention on duplicates. The mechanism must handle 4 businesses × 6 lenses = up to 24 idea candidates per sweep.
- **Effort:** S (1 new file, mechanism definition)
- **Acceptance:**
  - Clustering algorithm: Group by problem/opportunity across lenses (semantic similarity, same business + same MACRO category = likely cluster)
  - Dossier merging: One dossier per cluster, preserving each lens's variant as a named section
  - Rivalry recording: Where lenses disagree on approach/priority/feasibility, record as explicit rivalry section
  - Agreement recording: Where lenses converge, note as reinforcing evidence
  - **Hard clustering boundaries (never violated):**
    - Never merge across different jobs-to-be-done (customer-facing vs infrastructure vs data-quality are separate)
    - Never merge across different businesses (BRIK ideas don't cluster with PIPE ideas)
    - Max cluster size: 4 lens variants per cluster — if more than 4 lenses converge, treat as strong signal but split into sub-clusters by approach
  - Output: Clustered dossiers ready for Munger/Buffett filter
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: Two lenses produce ideas about "install Google Analytics for BRIK" → clustered into single dossier with both variants
    - TC-02: Musk says "delete manual process" while Sales says "automate manual process" for same problem → rivalry recorded
    - TC-03: Three lenses independently identify "no analytics" → agreement reinforcement noted
    - TC-04: Ideas for different businesses are never clustered together
    - TC-05: Idea with no match remains as standalone dossier
  - **Acceptance coverage:** TC-01-05 cover clustering, rivalry, agreement, isolation, and singleton cases
  - **Test type:** Scenario walkthrough
  - **Test location:** Manual validation during CS-12 dry-run
  - **Run:** Trace synthetic ideas through clustering
- **TDD execution plan:**
  - **Red:** 6 lenses produce 18 ideas — no mechanism to reduce duplicates before filter
  - **Green:** Define clustering rules that group by problem/opportunity/business/MACRO
  - **Refactor:** Adjust clustering granularity based on dry-run results
- **What would make this >=90%:** Dry-run with synthetic 6-lens output to verify clustering produces sensible groups
- **Rollout / rollback:**
  - Rollout: New file, no impact
  - Rollback: Delete file
- **Documentation impact:** None
- **Notes / references:**
  - Fact-find clustering proposal: `cabinet-system-fact-find.md` § "Gap Detail: Dedup / Rival Clustering"

---

### CS-06: Create persona fidelity rubric + regression scenarios

- **Status:** Complete (2026-02-09) — Commit `9c253ccdc4`
- **Type:** IMPLEMENT
- **Affects:**
  - `.claude/skills/_shared/cabinet/persona-fidelity.md` (new)
  - `.claude/skills/_shared/cabinet/regression-scenarios.md` (new)
- **Depends on:** CS-03, CS-01
- **Blocks:** CS-07, CS-08, CS-09, CS-10, CS-11
- **Confidence:** 88%
  - Implementation: 90% — Rubric format is well-understood (scoring criteria, pass/fail thresholds). Regression scenarios follow test-case patterns already used in other tasks.
  - Approach: 88% — Defining quality criteria before writing personas ensures consistent standards. Prevents "all personas sound the same" failure mode.
  - Impact: 85% — Without a rubric, persona quality assessment is subjective. Without regression scenarios, there's no repeatable way to detect persona drift or degradation.
- **Effort:** M (2 new files — rubric ~100 lines, regression scenarios ~150 lines with per-stance test cases)
- **Acceptance:**
  - **persona-fidelity.md:**
    - Scoring rubric with 5 dimensions: Voice distinctiveness (does this sound like the expert?), Domain fidelity (stays within expert's domain boundaries), Stance responsiveness (output shifts meaningfully between stances), Differentiation (produces ideas distinct from other experts), Actionability (ideas are specific and implementable, not generic advice)
    - Per-dimension scoring: 1-5 scale with descriptive anchors
    - Pass threshold: Mean score ≥ 3.5, no dimension below 2
    - Failure examples: "Generic advice that any lens could produce" (voice = 1), "Marketing expert recommending database schema" (domain = 1)
  - **regression-scenarios.md:**
    - Standardized test scenarios per stance: 2 scenarios for `improve-data`, 2 for `grow-business`
    - Each scenario: Business state (which business, maturity level, known gaps), expected behavioral constraints (what a good response includes/excludes), red-flag patterns (what indicates persona failure)
    - At least one scenario uses BRIK at L1 (simplest case), one uses PIPE at L2 (more complex)
    - Scenarios are reusable across all persona tasks (CS-07 through CS-10) and the dry-run (CS-12)
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: Rubric has all 5 scoring dimensions with descriptive anchors at each level
    - TC-02: Pass/fail threshold is defined and unambiguous
    - TC-03: At least 4 regression scenarios exist (2 per stance)
    - TC-04: Each scenario specifies business state, expected constraints, and red-flag patterns
    - TC-05: Rubric correctly fails a "generic advice" persona output (voice score ≤ 2)
  - **Acceptance coverage:** TC-01-02 cover rubric completeness; TC-03-04 cover scenario completeness; TC-05 covers rubric discrimination
  - **Test type:** Content review + manual application to synthetic persona output
  - **Test location:** Manual review; applied during CS-07-10 development and CS-12 dry-run
  - **Run:** Score a synthetic persona output against rubric, verify discrimination
- **TDD execution plan:**
  - **Red:** Persona files (CS-07-10) need quality criteria to write against — no rubric exists
  - **Green:** Define rubric with clear pass/fail thresholds and regression scenarios with concrete expected behaviors
  - **Refactor:** Adjust scoring anchors if dry-run reveals calibration issues
- **Rollout / rollback:**
  - Rollout: New files, no impact on existing system
  - Rollback: Delete files
- **Documentation impact:** None
- **Notes / references:**
  - Addresses user feedback: "persona fidelity is not a first-class artifact"
  - Rubric informs all persona tasks (CS-07 through CS-10) — must be created before personas

---

### CS-07: Write persona — Musk lens (feasibility/constraint)

- **Status:** Complete (2026-02-09) — Commit `9c344c9ee9`
- **Type:** IMPLEMENT
- **Affects:** `.claude/skills/_shared/cabinet/lens-musk.md` (new)
- **Depends on:** CS-03, CS-01, CS-06
- **Blocks:** CS-11
- **Confidence:** 90%
  - Implementation: 95% — Musk algorithm already exists in `ideas-go-faster/SKILL.md` (§ "Constitution"). Extract, formalize, add stance variants.
  - Approach: 90% — Proven pattern (already embedded as constitutional invariant). Just needs formalization as a standalone persona file.
  - Impact: 85% — Core lens. Must preserve existing behavior under `grow-business` stance while adding `improve-data` variant.
- **Effort:** M (1 new file ~150-200 lines, requires extracting and enriching existing algorithm + adding stance variants + full persona spec)
- **Acceptance:**
  - Principles & heuristics: 5-step algorithm (Question → Delete → Simplify → Accelerate → Automate)
  - Signature questions: Per-stance diagnostic questions (improve-data: "what's the constraint on data quality?"; grow-business: "what's the constraint on revenue?")
  - Failure modes: Premature automation, theater, local optimization
  - Domain boundaries: Physical-world constraints, manufacturing analogies for digital systems
  - Preferred artifacts: Constraint diagnosis, bottleneck removal plan, shortest credible path
  - Tone: Direct, impatient with theater, first-principles
  - Stance-specific behavior for `improve-data` and `grow-business`
  - Priority formula with Signal-Speed
  - MACRO integration: Which MACRO categories this lens emphasizes per stance
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: Under `improve-data` stance, given BRIK with zero analytics → produces "install measurement" as top idea, not "build new feature"
    - TC-02: Under `grow-business` stance, given BRIK at L2 → produces growth-oriented ideas, not measurement infrastructure
    - TC-03: Ideas are ordered by Musk step (all Delete before Simplify, etc.)
    - TC-04: Failure mode check: persona does NOT recommend automation as first step
    - TC-05: Output follows Dossier Header format with `Originator-Expert: musk`, `Originator-Lens: feasibility`
  - **Acceptance coverage:** TC-01-02 cover stance behavior; TC-03 covers ordering; TC-04 covers failure modes; TC-05 covers person-level attribution
  - **Test type:** Scenario-based persona fidelity check
  - **Test location:** CS-12 dry-run
  - **Run:** Invoke lens against known business state, verify output
- **TDD execution plan:**
  - **Red:** New persona file, expect specific output format and content under each stance
  - **Green:** Extract Musk algorithm from current skill, add stance variants, format as persona spec
  - **Refactor:** Tighten failure modes and domain boundaries based on dry-run
- **Rollout / rollback:**
  - Rollout: New file, no impact on current skill (current skill replaced later by CS-11)
  - Rollback: Delete file
- **Documentation impact:** None
- **Notes / references:**
  - Current Musk embedding: `ideas-go-faster/SKILL.md` § "Constitution" (5-step algorithm), § "Intervention Ordering"
  - Fact-find expert lens table: `cabinet-system-fact-find.md` § "Gap Detail: Expert Lenses" > cabinet generators table

---

### CS-08: Write persona — Bezos lens (customer-backwards)

- **Status:** Complete (2026-02-09) — Commit `9c344c9ee9`
- **Type:** IMPLEMENT
- **Affects:** `.claude/skills/_shared/cabinet/lens-bezos.md` (new)
- **Depends on:** CS-03, CS-01, CS-06
- **Blocks:** CS-11
- **Confidence:** 85%
  - Implementation: 85% — No existing code to extract from, but Bezos principles are well-documented publicly. Stance variants need careful definition.
  - Approach: 88% — Customer-backwards thinking is complementary to Musk's constraint-first approach. Clear differentiation.
  - Impact: 82% — Second most important lens after Musk. Must produce genuinely different ideas, not restatements of Musk output.
- **Effort:** M (1 new file ~150-200 lines, research + stance variants + full persona spec)
- **Acceptance:**
  - Principles & heuristics: Working backwards from customer, Day 1 mentality, two-pizza teams, disagree and commit
  - Signature questions: "Who is the customer?", "What is their problem?", "Why now?", "What does the press release say?"
  - Failure modes: Over-indexing on customer requests vs needs, ignoring unit economics
  - Domain boundaries: Customer-facing businesses, marketplace dynamics
  - Preferred artifacts: Press-release/FAQ format, customer journey map
  - Tone: Customer-obsessed, long-term oriented, institutional patience
  - Stance-specific behavior for `improve-data` and `grow-business`
  - MACRO integration: Emphasizes Acquire and Convert under `grow-business`, Measure under `improve-data`
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: Under `improve-data` stance → produces ideas about understanding customer behavior (analytics, surveys, feedback loops)
    - TC-02: Under `grow-business` stance → produces customer acquisition/conversion ideas with press-release format
    - TC-03: Output is genuinely different from Musk lens on same business state (tests complementarity)
    - TC-04: Ideas identify specific customer segments, not generic "users"
    - TC-05: Output follows Dossier Header format with `Originator-Expert: bezos`, `Originator-Lens: customer-backwards`
  - **Acceptance coverage:** TC-01-02 cover stance; TC-03 covers differentiation; TC-04 covers specificity; TC-05 covers person-level attribution
  - **Test type:** Scenario-based persona fidelity check
  - **Test location:** CS-12 dry-run
  - **Run:** Invoke lens against known business state, compare with Musk output
- **TDD execution plan:**
  - **Red:** Expect Bezos lens to produce customer-centric ideas distinct from Musk's constraint-centric ideas
  - **Green:** Write persona with strong customer-backwards framing and distinct signature questions
  - **Refactor:** Adjust domain boundaries if outputs overlap too much with Musk
- **What would make this >=90%:** Dry-run showing Bezos and Musk produce complementary, non-overlapping ideas for BRIK
- **Rollout / rollback:**
  - Rollout: New file, no impact
  - Rollback: Delete file
- **Documentation impact:** None
- **Notes / references:**
  - Fact-find expert lens table: `cabinet-system-fact-find.md` § "Gap Detail: Expert Lenses" > cabinet generators table

---

### CS-09: Write personas — Marketing, Sales, Sourcing lenses

- **Status:** Complete (2026-02-09) — Commit `9c344c9ee9`
- **Type:** IMPLEMENT
- **Affects:**
  - `.claude/skills/_shared/cabinet/lens-marketing.md` (new)
  - `.claude/skills/_shared/cabinet/lens-sales.md` (new)
  - `.claude/skills/_shared/cabinet/lens-sourcing.md` (new)
- **Depends on:** CS-03, CS-01, CS-06
- **Blocks:** CS-11
- **Confidence:** 82%
  - Implementation: 82% — Three personas to write, each with multiple sub-experts (Marketing: Hopkins/Ogilvy/Reeves/Lafley; Sales: Patterson/Ellison/Chambers; Sourcing: Cook/Fung/Ohno/Toyoda). Each sub-expert gets an independent generation pass with person-level attribution. Scale of content is the primary risk.
  - Approach: 85% — Each lens has clear domain boundaries. Differentiation from Musk/Bezos is straightforward (these are functional specialists, not general strategists).
  - Impact: 80% — These lenses are most valuable under `grow-business` stance. Under `improve-data`, their contribution may be thinner (marketing measurement, sales pipeline data, supply chain data).
- **Effort:** L (3 new files × ~150-200 lines each, multiple sub-experts per file, stance variants for each)
- **Acceptance:**
  - Marketing lens: USP, positioning, proof hierarchy, testable claims. Sub-experts: Hopkins (scientific advertising), Ogilvy (brand/copy), Reeves (USP), Lafley (consumer insight). **Each sub-expert gets an independent generation pass** — Hopkins produces ideas independently from Ogilvy. Stance-specific behavior.
  - Sales lens: Route-to-revenue, pricing mechanics, deal structure, pipeline management. Sub-experts: Patterson (systematic selling), Ellison (competitive positioning), Chambers (partner ecosystems). **Each sub-expert gets an independent generation pass.** Stance-specific behavior.
  - Sourcing lens: Supplier feasibility, quality risk, cost structure, relationships. Sub-experts: Cook (supply chain operations), Fung (trading/sourcing networks), Ohno/Toyoda (lean/quality). **Each sub-expert gets an independent generation pass.** Stance-specific behavior.
  - Each file follows the persona template structure from CS-01
  - Each produces ideas in Dossier Header format from CS-03 with person-level attribution (`Originator-Expert: hopkins`, not just `Originator-Lens: marketing`)
  - Must pass persona fidelity rubric from CS-06 and score against regression scenarios
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: Marketing lens under `grow-business` for BRIK → produces positioning/SEO/content marketing ideas (not generic "do marketing")
    - TC-02: Sales lens under `grow-business` for PIPE → produces route-to-revenue ideas (Amazon seller, pricing, deal structure)
    - TC-03: Sourcing lens under `grow-business` for PIPE → produces supplier/quality/cost ideas relevant to China sourcing
    - TC-04: All three lenses under `improve-data` → produce measurement/data ideas relevant to their domain
    - TC-05: Outputs are distinct from each other AND from Musk/Bezos lenses
    - TC-06: Each output follows Dossier Header format with correct `Originator-Expert` (person-level) and `Originator-Lens` (group-level) values
    - TC-07: Two sub-experts within the same lens (e.g. Hopkins vs Ogilvy) produce distinct ideas for the same business
  - **Acceptance coverage:** TC-01-03 cover per-lens grow-business; TC-04 covers improve-data; TC-05 covers differentiation; TC-06 covers person-level attribution; TC-07 covers sub-expert independence
  - **Test type:** Scenario-based persona fidelity check
  - **Test location:** CS-12 dry-run
  - **Run:** Invoke all three lenses, compare outputs for differentiation
- **TDD execution plan:**
  - **Red:** Three persona files needed, each producing domain-specific ideas under both stances
  - **Green:** Write each with clear principles, failure modes, and stance-specific diagnostic questions
  - **Refactor:** Merge sub-experts if they produce redundant output within a lens
- **What would make this >=90%:** Dry-run showing all 5 business lenses (Musk, Bezos, Marketing, Sales, Sourcing) produce distinct, non-overlapping ideas for the same business
- **Rollout / rollback:**
  - Rollout: New files, no impact
  - Rollback: Delete files
- **Documentation impact:** None
- **Notes / references:**
  - Fact-find expert lens table: `cabinet-system-fact-find.md` § "Gap Detail: Expert Lenses" > cabinet generators table

---

### CS-10: Write personas — Munger+Buffett filter, Drucker+Porter priority

- **Status:** Complete (2026-02-09) — Commit `9c344c9ee9`
- **Type:** IMPLEMENT
- **Affects:**
  - `.claude/skills/_shared/cabinet/filter-munger-buffett.md` (new)
  - `.claude/skills/_shared/cabinet/prioritize-drucker-porter.md` (new)
- **Depends on:** CS-03, CS-01, CS-06
- **Blocks:** CS-11
- **Confidence:** 85%
  - Implementation: 85% — Gatekeeper/prioritizer roles are well-defined in fact-find. Munger/Buffett evaluate truth (stance-invariant). Drucker/Porter weight against business plans (stance as plan emphasis).
  - Approach: 88% — Clear separation of concerns: filter (kill/hold/promote) vs priority (rank against plan targets). Stance boundary resolved.
  - Impact: 82% — Critical pipeline stages. If gatekeepers are too aggressive, good ideas die. If too permissive, noise passes through.
- **Effort:** L (2 new files × ~150-200 lines each, complex decision frameworks, stance boundary enforcement)
- **Acceptance:**
  - Munger+Buffett filter:
    - Principles: Inversion ("how could this fail?"), opportunity cost, circle of competence, margin of safety
    - Verdicts: Kill / Hold / Promote with rationale
    - Stance-invariant: Evaluates truth, downside, opportunity cost regardless of stance
    - Decision logged in Dossier Decision Log block
    - Failure modes: Excessive conservatism, anchoring on sunk costs
  - Drucker+Porter priority:
    - Principles: Effectiveness over efficiency, strategic fit, competitive positioning, value chain analysis
    - Verdicts: P1-P5 priority assignment with rationale
    - Stance-sensitive: Weights plan targets differently based on stance (improve-data → weight measurement/data metrics higher; grow-business → weight revenue/acquisition metrics higher)
    - Requires business plans as input (handles missing plans gracefully — flags as critical finding, uses maturity model as proxy)
    - Decision logged in Dossier Decision Log block
    - Failure modes: Analysis paralysis, over-planning
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: Munger/Buffett kill — idea with high downside, outside circle of competence → Kill verdict
    - TC-02: Munger/Buffett promote — idea with low downside, high optionality, within competence → Promote verdict
    - TC-03: Munger/Buffett hold — idea with uncertain data → Hold verdict (needs more evidence)
    - TC-04: Drucker/Porter under `improve-data` — measurement idea ranks higher than revenue idea
    - TC-05: Drucker/Porter under `grow-business` — revenue idea ranks higher than measurement idea
    - TC-06: Drucker/Porter without business plans — falls back to maturity model, flags missing plan
    - TC-07: Both outputs follow Decision Log format within dossier
  - **Acceptance coverage:** TC-01-03 cover Munger/Buffett verdicts; TC-04-05 cover Drucker/Porter stance sensitivity; TC-06 covers graceful degradation; TC-07 covers attribution format
  - **Test type:** Scenario-based decision fidelity check
  - **Test location:** CS-12 dry-run
  - **Run:** Present synthetic dossiers to each stage, verify verdicts
- **TDD execution plan:**
  - **Red:** Expect clear Kill/Hold/Promote decisions with inversion-based rationale, and P1-P5 ranking against plan targets
  - **Green:** Write both personas with explicit decision criteria and stance boundary rules
  - **Refactor:** Calibrate aggressiveness thresholds based on dry-run (too many Kills? Too few?)
- **What would make this >=90%:** Dry-run showing Munger/Buffett correctly kills a bad idea and promotes a good one, and Drucker/Porter re-ranks ideas differently under each stance
- **Rollout / rollback:**
  - Rollout: New files, no impact
  - Rollback: Delete files
- **Documentation impact:** None
- **Notes / references:**
  - Fact-find filter/priority table: `cabinet-system-fact-find.md` § "Gap Detail: Expert Lenses" > filter/prioritization stages table
  - Stance boundary: `cabinet-system-fact-find.md` § "Questions > Resolved (User Decisions)" > stance boundary entries

---

### CS-11: Write the Cabinet Secretary orchestrator skill

- **Status:** Complete (2026-02-09) — Commit `c9eed936cc`
- **Type:** IMPLEMENT
- **Affects:**
  - `.claude/skills/ideas-go-faster/SKILL.md` — REPLACE (backup current as `.claude/skills/ideas-go-faster/SKILL.md.pre-cabinet`)
  - [readonly] `.claude/skills/_shared/cabinet/` — reads all persona files
  - [readonly] `.claude/skills/_shared/card-operations.md` — API patterns
  - [readonly] `.claude/skills/_shared/stage-doc-operations.md` — stage doc lifecycle
- **Depends on:** CS-01, CS-02, CS-03, CS-04, CS-05, CS-06, CS-07, CS-08, CS-09, CS-10
- **Blocks:** CS-12
- **Confidence:** 80%
  - Implementation: 80% — Largest single deliverable (~800 lines). Integrates all persona files, implements 6-stage pipeline, stance parameter, API calls, confidence gate, clustering, and sweep report. Precedent: `plan-feature/SKILL.md` at 912 lines proves this scale works.
  - Approach: 82% — Hybrid architecture (orchestrator + library) proven by `improve-guide` pattern. Pipeline is well-defined in fact-find.
  - Impact: 78% — Replaces the current working `ideas-go-faster` skill. Must preserve all existing capabilities (MACRO audit, API integration, auto-work-up) while adding Cabinet pipeline.
- **Effort:** L (1 major file ~800 lines replacing existing 730-line skill, complex multi-stage pipeline)
- **Acceptance:**
  - Accepts `--stance` parameter (default: `improve-data`)
  - Reads business data via Agent API (existing pattern from current skill)
  - Reads persona definitions from `_shared/cabinet/` files
  - Implements full pipeline (corrected ordering — fact-find docs AFTER priority ranking):
    1. Composite generation: Each business × each sub-expert (sequentially, one persona file loaded at a time)
    2. Confidence gate: Classify as presentable / data-gap / hunch. Assign VOI-Score to data-gap proposals.
    3. Cluster/dedup: Group similar ideas (hard boundaries: never across JTBD or business), create merged dossiers
    4. Munger/Buffett filter: Kill / Hold / Promote each dossier
    5. Card creation: Promoted ideas → raw ideas via API → create cards (NO fact-find docs yet)
    6. Drucker/Porter priority: Re-rank cards against business plans
    7. Fact-find seeding: Top K cards (per Drucker/Porter ranking) get fact-find stage docs. K defaults to 3.
  - Preserves MACRO framework (31 diagnostic questions)
  - Preserves Musk algorithm ordering as constitutional invariant
  - Creates ideas via Agent API with Dossier Header in content field
  - Work-up is split: card creation (step 5) before Drucker/Porter (step 6), fact-find seeding (step 7) after. This ensures fact-find docs are only created for ideas that survive priority ranking.
  - Sweep report includes: per-expert contributions (person-level attribution), clustering decisions, filter verdicts, priority assignments, DGPs created (with VOI-Scores), hunches suppressed
  - **Context discipline strategy (first-order design constraint):**
    - Each persona file includes a 20-40 line "persona summary block" at the top — a compressed version loadable when full file would exceed budget
    - After each sub-expert's generation pass, compress-and-carry-forward: carry scored ideas + Dossier Headers only, drop reasoning chains
    - Orchestrator tracks running context estimate; switches from full persona file to summary block when approaching limit
    - If context is exhausted before all lenses complete: finish with summary-only passes, flag as degraded in sweep report
  - Technical cabinet integrated with trigger conditions (runs when: scan-repo detected diffs, OR stance is `improve-data`, OR `--force-code-review`)
  - Handles missing business plans/profiles gracefully (flags as findings, uses maturity model as proxy)
  - Backup: Current `ideas-go-faster/SKILL.md` preserved as `.pre-cabinet` file
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: Full sweep under `improve-data` stance for BRIK → produces ideas from all 5 business lenses with Dossier Headers
    - TC-02: Confidence gate correctly routes: presentable ideas to filter, data-gap proposals to DGP storage, hunches to report only
    - TC-03: Clustering merges duplicate ideas from different lenses into single dossiers
    - TC-04: Munger/Buffett filter produces Kill/Hold/Promote verdicts in Decision Log
    - TC-05: Promoted ideas are created as raw ideas via Agent API with correct Tags and Dossier Header
    - TC-06: Work-up creates cards for promoted ideas WITHOUT fact-find stage docs
    - TC-07: Drucker/Porter re-ranks cards based on business plans (or maturity model if no plans)
    - TC-08: Fact-find stage docs created ONLY for top K cards after Drucker/Porter ranking
    - TC-09: Sweep report shows per-expert attribution (person-level), clustering decisions, filter verdicts
    - TC-10: `--stance=grow-business` shifts all lens outputs toward business growth
    - TC-11: Missing business plans → flagged as critical finding (not a crash)
    - TC-12: Technical cabinet skipped when no triggers fire (no scan diffs, stance is grow-business, no force flag)
    - TC-13: Context discipline — when context budget is exceeded, orchestrator switches to summary-block mode and flags degradation in report
  - **Acceptance coverage:** TC-01-13 cover full pipeline, pipeline ordering, stance, context discipline, graceful degradation, and tech cabinet triggers
  - **Test type:** End-to-end scenario (manual invocation)
  - **Test location:** CS-12 dry-run and CS-14 full validation
  - **Run:** Invoke `/ideas-go-faster --stance=improve-data` and review full output
  - **End-to-end coverage:** TC-01 is the primary e2e scenario — full sweep producing ideas via API
- **TDD execution plan:**
  - **Red:** Invoke the new skill — expect full pipeline output with attribution, clustering, and filter verdicts
  - **Green:** Write orchestrator integrating all persona files and pipeline stages
  - **Refactor:** Trim orchestrator if any sections are redundant with persona files
- **What would make this >=90%:** Successful dry-run (CS-12) producing correct API calls, Dossier Headers, and sweep report
- **Rollout / rollback:**
  - Rollout: Replace `ideas-go-faster/SKILL.md` with Cabinet Secretary version. Keep `.pre-cabinet` backup.
  - Rollback: Restore `.pre-cabinet` backup to `SKILL.md`
- **Documentation impact:**
  - Update fact-find brief status to reflect implementation
- **Notes / references:**
  - Current skill: `ideas-go-faster/SKILL.md` (730 lines)
  - Orchestration precedent: `improve-guide/SKILL.md` (226 lines)
  - Largest existing skill: `plan-feature/SKILL.md` (912 lines)

---

### CS-12: Horizon checkpoint — dry-run validation

- **Type:** CHECKPOINT
- **Depends on:** CS-11
- **Blocks:** CS-13, CS-14
- **Confidence:** 95%
- **Acceptance:**
  - Run `/ideas-go-faster --stance=improve-data` (the new Cabinet Secretary) against current business state
  - Verify: All 5 business lenses produce output with correct Dossier Header format
  - Verify: Confidence gate classifies ideas correctly (most should be data-gap under improve-data, given missing analytics)
  - Verify: Clustering produces sensible groups (not everything in one cluster, not all singletons)
  - Verify: Munger/Buffett produces Kill/Hold/Promote verdicts
  - Verify: Context window handles orchestrator + persona files + business data without degradation
  - Verify: API calls succeed (ideas created, tags correct)
  - Verify: Drucker/Porter ranks against bootstrapped business plans (CS-02, Wave 1), not maturity-model fallback
  - Verify: Person-level attribution (`Originator-Expert`) present on all ideas
  - Verify: Fact-find stage docs created only for top K cards AFTER Drucker/Porter ranking
  - Verify: Persona outputs pass fidelity rubric (CS-06) with mean score ≥ 3.5
  - Verify: Context discipline operates correctly (compress-and-carry-forward between lens passes)
  - Run `/re-plan` on CS-13, CS-14 using evidence from dry-run
  - Reassess remaining task confidence
  - Update plan with any new findings
- **Horizon assumptions to validate:**
  - Context window can hold full Cabinet system without degradation (HIGH RISK — primary validation target)
  - Persona definitions produce differentiated, non-overlapping ideas (scored via fidelity rubric)
  - Clustering mechanism works on real (not synthetic) idea output, respects hard boundaries
  - Dossier Header round-trips correctly through API create/read (including Originator-Expert and VOI-Score)
  - Pipeline ordering correct: cards created before Drucker/Porter, fact-find docs seeded after
  - Sweep completes in reasonable time (<30 minutes)

---

### CS-13: Write persona — Technical code-review cabinet

- **Type:** IMPLEMENT
- **Affects:** `.claude/skills/_shared/cabinet/lens-code-review.md` (new)
- **Depends on:** CS-12
- **Blocks:** CS-14
- **Confidence:** 82%
  - Implementation: 82% — Large persona (12+ sub-experts: Fowler, Beck, Martin, Kim, Gregg, Schneier, etc.). Scope of content is the risk.
  - Approach: 85% — Technical lens operates differently from business lenses (reads codebase, not business data). Trigger conditions defined.
  - Impact: 80% — Integrated with skip logic. Value depends on codebase having meaningful diffs to review.
- **Effort:** L (1 file ~200-300 lines, 12+ sub-expert definitions, stance-specific behavior, trigger conditions)
- **Acceptance:**
  - Sub-experts defined: Fowler (refactoring), Beck (TDD/XP), Martin (clean code), Kim (DevOps/flow), Gregg (systems performance), Schneier (security), plus others as appropriate
  - Each sub-expert: principles, signature questions, failure modes, domain boundaries
  - Stance-specific behavior: `improve-data` → focus on observability/measurement/testing gaps; `grow-business` → focus on scalability/reliability/developer velocity
  - Trigger conditions: Run when scan-repo detected diffs, OR stance is `improve-data`, OR `--force-code-review`
  - Output: Technical improvement ideas in Dossier Header format with `Originator-Lens: code-review`
  - Integration: Reads codebase (not just business data) — search patterns, architecture review, test coverage gaps
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: Under `improve-data` stance with trigger → produces observability/testing ideas for actual codebase
    - TC-02: Under `grow-business` stance without trigger → skipped with "Technical cabinet: skipped (no trigger)" in report
    - TC-03: Under `grow-business` with `--force-code-review` → runs despite no other trigger
    - TC-04: Ideas reference actual files/patterns in the repo (not generic advice)
    - TC-05: Output follows Dossier Header format with `Originator-Lens: code-review`
  - **Acceptance coverage:** TC-01 covers primary use; TC-02-03 cover trigger logic; TC-04 covers specificity; TC-05 covers attribution
  - **Test type:** Scenario-based fidelity check
  - **Test location:** CS-14 full validation
  - **Run:** Invoke sweep with technical cabinet active
- **TDD execution plan:**
  - **Red:** Invoke technical cabinet — expect repo-specific improvement ideas
  - **Green:** Write persona with codebase inspection patterns and sub-expert definitions
  - **Refactor:** Reduce sub-expert count if some produce redundant output
- **What would make this >=90%:** Dry-run showing technical cabinet identifies real, actionable improvements in the monorepo
- **Rollout / rollback:**
  - Rollout: New file, integrated via orchestrator trigger conditions
  - Rollback: Delete file; orchestrator skips technical cabinet when file is absent
- **Documentation impact:** None
- **Notes / references:**
  - Fact-find technical cabinet: `cabinet-system-fact-find.md` § "Gap Detail: Expert Lenses" + § "Questions > Resolved" > technical cabinet entries

---

### CS-14: Validation run — full Cabinet sweep under `improve-data` stance

- **Type:** IMPLEMENT
- **Affects:**
  - [readonly] All `_shared/cabinet/` files
  - [readonly] `.claude/skills/ideas-go-faster/SKILL.md`
  - Creates ideas via Agent API (side effect)
- **Depends on:** CS-12, CS-13
- **Blocks:** -
- **Status:** Blocked-by-checkpoint (75% confidence — below 80% threshold, gated on CS-12 evidence)
- **Confidence:** 75%
  - Implementation: 78% — Depends on all prior tasks being correct. Full end-to-end invocation.
  - Approach: 80% — Clear success criteria: ideas created, attribution correct, pipeline stages all execute.
  - Impact: 68% — First real-world test. May reveal issues in persona quality, context window limits, or pipeline logic that require iteration.
- **Effort:** M (invocation + comprehensive output review + comparison with pre-Cabinet sweep)
- **Acceptance:**
  - Full Cabinet sweep completes without errors under `improve-data` stance
  - Ideas created via API with correct Dossier Headers (parseable, all fields present)
  - Multiple lenses contribute distinct ideas (not all lenses producing the same output)
  - Confidence gate correctly classifies: majority should be data-gap proposals (given missing analytics infrastructure)
  - Clustering reduces duplicate count meaningfully (< half the raw idea count)
  - Munger/Buffett filter produces reasoned Kill/Hold/Promote verdicts
  - Drucker/Porter re-ranks using bootstrapped business plans (not maturity model fallback)
  - Technical cabinet runs (stance is `improve-data` → trigger fires) and produces repo-specific ideas
  - Sweep report is comprehensive and includes per-expert attribution (person-level, not just lens-level)
  - Sweep completes in <30 minutes
  - Compare output quality with pre-Cabinet single-lens sweep (should identify more gaps)
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: Full sweep completes without API errors
    - TC-02: Ideas have valid Dossier Headers (parse round-trip succeeds)
    - TC-03: At least 3 distinct lenses contribute ideas (differentiation)
    - TC-04: Data Gap Proposals created with correct Tags and Confidence-Tier
    - TC-05: Clustering reduces raw idea count by ≥30%
    - TC-06: Munger/Buffett filter kills at least 1 idea with inversion rationale
    - TC-07: Drucker/Porter ranks against business plans, not maturity model
    - TC-08: Technical cabinet produces at least 1 repo-specific idea
    - TC-09: Sweep report contains full attribution chain
    - TC-10: Sweep duration ≤30 minutes
  - **Acceptance coverage:** TC-01-10 cover full end-to-end validation
  - **Test type:** End-to-end integration test (manual invocation)
  - **Test location:** Live invocation
  - **Run:** `/ideas-go-faster --stance=improve-data`
- **TDD execution plan:**
  - **Red:** Invoke full sweep — expect comprehensive multi-lens output with attribution
  - **Green:** All prior tasks produce correct artifacts, sweep integrates them
  - **Refactor:** Based on sweep results, identify persona quality issues and iterate
- **What would make this >=90%:** Successful sweep producing higher-quality, more diverse ideas than single-lens sweep, with full attribution chain intact
- **Rollout / rollback:**
  - Rollout: This IS the validation — no deployment
  - Rollback: If validation fails, iterate on individual personas/orchestrator
- **Documentation impact:**
  - Update fact-find brief status to "Implemented"
  - Update this plan with validation results
- **Notes / references:**
  - Compare with current single-lens sweep output for quality assessment

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Context window overflow (orchestrator + all persona files + business data) | **High** | High | First-order design constraint. Mitigated by: (1) persona summary blocks (20-40 lines per lens, loaded instead of full file during generation), (2) compress-and-carry-forward after each lens pass (carry scored ideas only, drop reasoning), (3) orchestrator loads one persona file at a time. CS-12 checkpoint validates. |
| Persona quality too low (generic, not differentiated) | Medium | Medium | CS-12 dry-run tests differentiation via fidelity rubric (CS-06). Iterate before proceeding to CS-13-14. |
| Sweep duration too long (>30 minutes) | Medium | Low | 6 sequential lenses × 4 businesses = 24 lens-business pairs. If too slow, reduce to top 2 businesses per sweep. |
| Dossier Header parsing fragile | Low | High | Strict grammar rules with HTML comment delimiters. TC-01/TC-02 in CS-03 validate round-trip. |
| Over-engineering personas (200 lines produces same quality as 50 lines) | Medium | Low | CS-12 checkpoint. If diminishing returns, trim persona files before CS-13. |
| Business plan content too thin to be useful for Drucker/Porter | Medium | Medium | Minimum viable content defined. Drucker/Porter gracefully degrades to maturity model. CS-02 bootstraps plans in Wave 1 so dry-run validates real behavior. |
| Pre-cabinet skill backup lost or forgotten | Low | High | CS-11 explicitly backs up to `.pre-cabinet` file. Rollback documented. |

## Observability

- Logging: Sweep report includes per-lens contributions, clustering decisions, filter verdicts, priority assignments
- Metrics: Idea count per lens, kill/hold/promote ratios, DGP count, hunch count, sweep duration
- Alerts/Dashboards: N/A (prompt-only system, no runtime monitoring)

## Acceptance Criteria (overall)

- [ ] Persona fidelity rubric and regression scenarios exist as first-class Phase 0 artifacts
- [ ] All persona files exist in `_shared/cabinet/` with full specs (principles, questions, failure modes, stance behavior) and pass fidelity rubric
- [ ] Cabinet Secretary orchestrator replaces `ideas-go-faster/SKILL.md` with full pipeline
- [ ] Stance parameter works (`--stance=improve-data` default, `--stance=grow-business` alternative)
- [ ] Ideas created via API with parseable Dossier Headers (person-level attribution via Originator-Expert)
- [ ] Confidence gate classifies ideas into three tiers (presentable/data-gap/hunch)
- [ ] Clustering reduces duplicate ideas from multiple lenses
- [ ] Munger/Buffett filter produces Kill/Hold/Promote verdicts with rationale
- [ ] Drucker/Porter re-ranks against business plans (or maturity model fallback)
- [ ] Technical cabinet integrated with trigger conditions
- [ ] Business plans and people profiles bootstrapped with minimum viable content
- [ ] Full validation sweep completes under `improve-data` stance
- [ ] Pre-cabinet skill backup preserved

## Decision Log

- 2026-02-09: All lenses from day one, in-depth personas, integrated code-review — Pete's direction
- 2026-02-09: Stance system with `improve-data` (default) and `grow-business` — Pete's concept
- 2026-02-09: Option D (hybrid orchestrator + persona library) chosen over monolithic/sub-skill alternatives — balances modularity with simplicity
- 2026-02-09: Phase 0 uses content-field attribution (Dossier Header), not D1 schema changes — avoids API migration
- 2026-02-09: Data Gap Proposals stored as Ideas with `Tags: ["data-gap"]`, no new Status values — preserves `/work-idea` compatibility
- 2026-02-09: Generators are stance-sensitive, Munger/Buffett stance-invariant, Drucker/Porter stance = plan-weight shift — prevents incoherent priority arguments
- 2026-02-09: Signal-Speed (0-1 score) replaces Time-to-signal in priority formula — fixes ambiguity
- 2026-02-09: Technical cabinet: integrated with skip logic (runs on scan diffs, improve-data stance, or force flag)
- 2026-02-09: 7 open fact-find questions proceed with documented defaults (all low-risk, enumerated in Constraints & Assumptions)
- 2026-02-09: **Plan revision (feedback incorporation):**
  - Pipeline reordered: fact-find stage docs now created AFTER Drucker/Porter ranking (top K only), not during work-up
  - Attribution upgraded from lens-level to person-level: `Originator-Expert` (e.g. `hopkins`) is primary, `Originator-Lens` (e.g. `marketing`) is grouping field
  - CS-02 (bootstrap plans/profiles) moved from post-checkpoint to Wave 1 — prerequisite for meaningful Drucker/Porter evaluation
  - CS-06 added: persona fidelity rubric + regression scenarios as explicit Phase 0 deliverables, gating all persona tasks
  - Context window risk upgraded from Medium to High; context discipline strategy added (persona summary blocks, compress-and-carry-forward)
  - VOI-Score added to Dossier Header for DGP prioritization; DGP→build guardrails added
  - CS-14 marked Blocked-by-checkpoint (75% confidence, below 80% threshold)
  - Hard clustering boundaries added (never merge across JTBD or business, max 4 variants per cluster)
  - Line-number references replaced with heading-based references throughout
  - Sub-expert independent passes required for all multi-expert lenses
- 2026-02-09: **Sequenced by `/sequence-plan`:** 14 tasks renumbered into topological order. Rename map: old CS-02→CS-01, CS-12→CS-02, CS-01→CS-03, CS-03→CS-04, CS-04→CS-05, CS-14→CS-06, CS-05→CS-07, CS-06→CS-08, CS-07→CS-09, CS-08→CS-10, CS-09→CS-11, CS-10→CS-12, CS-11→CS-13, CS-13→CS-14. All Blocks fields corrected to strict inverse of Depends on (removed transitive dependencies).
