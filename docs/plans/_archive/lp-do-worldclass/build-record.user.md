---
Status: Complete
Feature-Slug: lp-do-worldclass
Completed-date: 2026-02-26
artifact: build-record
---

# Build Record — lp-do-worldclass

## What Was Built

**Wave 1 — Orchestrator + goal template (TASK-01, TASK-02, parallel):**
Created `.claude/skills/lp-do-worldclass/SKILL.md`, the 4-state machine orchestrator that routes any invocation of `/lp-do-worldclass --biz <BIZ>` to the correct phase based on whether a goal artifact and aligned benchmark exist. State 1 (no goal) stops with creation guidance; State 2 (goal, no benchmark) runs goal-phase and stops with research-prompt instructions; State 3 (goal + current benchmark) runs all three phases; State 4 (stale benchmark) stops with rerun guidance. Created `docs/plans/lp-do-worldclass/worldclass-goal.template.md`, the operator copy-paste template for creating a per-business `worldclass-goal.md` artifact, including a complete BRIK worked example covering Website Imagery, Room-Level Booking Funnel, and Direct Booking Conversion domains.

**Wave 2 — Goal-phase module (TASK-03):**
Created `.claude/skills/lp-do-worldclass/modules/goal-phase.md`, a 5-step module that validates the goal artifact against the `worldclass-goal.v1` schema, version-checks the research prompt against `goal_version` (regenerating if mismatched), generates a structured deep-research prompt with 5 sections (business context, singular goal verbatim, domain-by-domain research instructions, required output format specification for `worldclass-benchmark.v1`, and constraints), writes it to `worldclass-research-prompt.md`, and decides whether to continue to scan-phase (when a current benchmark exists) or stop with operator guidance.

**Wave 3 — Scan-phase and ideas-phase modules (TASK-04, TASK-05, parallel):**
Created `.claude/skills/lp-do-worldclass/modules/scan-phase.md`, a 7-step module that reads and validates the benchmark artifact, probes 5 data sources (repo always, Stripe via `mcp__brikette__product_stats`, GA4 via measurement ID grep, Firebase via `.firebaserc`/`firebase.json`, Octorate via `apps/reception/` grep), asks the operator structured confirmation questions for any uncertain sources, scans each configured source for domain-relevant evidence, classifies gaps (world-class/major-gap/minor-gap/no-data) with explicit rubric anchors for imagery and booking funnel domains, and writes the 7-column gap comparison table to `worldclass-scan-<YYYY-MM-DD>.md`. Created `.claude/skills/lp-do-worldclass/modules/ideas-phase.md`, a 6-step module that converts gap rows to `dispatch.v1` `operator_idea` packets using Pattern A (external evidence) or Pattern B (current-state vs world-class) templates, applies priority mapping (P1/P2/P3 by gap classification × domain type), uses deterministic key formulas for all hash fields, writes dispatches to `queue-state.json` via writer lock, and summarises the run.

**CHECKPOINT-A — Consistency gate:**
All 4 consistency checks passed: (1) module paths match actual files; (2) output artifact paths consistent across all 4 modules; (3) goal artifact field names consistent between template and goal-phase validation; (4) `dispatch.v1` fields in ideas-phase match the live schema and operator-idea trigger format.

## Tests Run

Execution-Track: `business-artifact` — no automated tests apply. All validation is document-review based.

| VC | Task | Result |
|---|---|---|
| VC-01 | TASK-01 | Pass — frontmatter `name: lp-do-worldclass` present |
| VC-02 | TASK-01 | Pass — all 4 state-machine branches present |
| VC-03 | TASK-01 | Pass — all 3 module paths referenced |
| VC-04 | TASK-01 | Pass — preflight error strings documented |
| VC-01 | TASK-02 | Pass — all 8 required fields with comments |
| VC-02 | TASK-02 | Pass — all 3 benchmark-status enum values |
| VC-03 | TASK-02 | Pass — BRIK example block non-empty |
| VC-01 | TASK-03 | Pass — absent-goal stop with template path |
| VC-02 | TASK-03 | Pass — goal_version mismatch triggers regeneration |
| VC-03 | TASK-03 | Pass — all 5 research prompt sections (a–e) |
| VC-04 | TASK-03 | Pass — benchmark output format spec complete |
| VC-05 | TASK-03 | Pass — stop conditions for absent/stale/just-regenerated |
| VC-01 | TASK-04 | Pass — all 5 data source categories present |
| VC-02 | TASK-04 | Pass — uncertain handling: ask-user, never assume/skip |
| VC-03 | TASK-04 | Pass — 7-column table, one-row-per-gap rule |
| VC-04 | TASK-04 | Pass — no-data classification in rubric |
| VC-05 | TASK-04 | Pass — scan output path consistent |
| VC-01 | TASK-05 | Pass — Pattern A and Pattern B with distinct templates |
| VC-02 | TASK-05 | Pass — 21-field checklist (14 core + 4 routing + 3 additional) |
| VC-03 | TASK-05 | Pass — decomposition rule + deterministic key formulas |
| VC-04 | TASK-05 | Pass — Priority mapping table P1/P2/P3 |
| VC-05 | TASK-05 | Pass — no-data handling section with specific templates |
| VC-01 | CHECKPOINT-A | Pass — all 4 cross-module consistency checks |

## Validation Evidence

All 23 VC checks above pass by document review (one full read-through per artifact, within 30 minutes of drafting, per VC-TIMEBOX contract).

## Scope Deviations

None. All tasks executed within declared scope. MCP tool prefix in modules uses `mcp__brikette__*` (actual environment) while plan assumptions noted `mcp__base-shop__*` — the module files are correct as written (they reference the working MCP namespace), and CHECKPOINT-A confirmed no inconsistency across modules.

## Outcome Contract

- **Why:** Current quality audits and coverage scans detect what exists vs what should exist, but neither asks "how far below world class are we and where?" — the gap between current state and best-in-class is invisible until reality forces a reaction. A benchmark-driven skill makes that gap explicit, actionable, and routed into the planning pipeline automatically.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `/lp-do-worldclass --biz <BIZ>` can be invoked for any business with a goal artifact and benchmark, producing dispatch packets for all identified world-class gaps and routing them into `lp-do-ideas`.
- **Source:** operator
