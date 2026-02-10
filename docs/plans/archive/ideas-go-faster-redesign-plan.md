---
Type: Plan
Status: Complete
Domain: Business-OS
Created: 2026-02-09
Last-updated: 2026-02-09
Feature-Slug: ideas-go-faster-redesign
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Business-Unit: BOS
---

# Ideas-Go-Faster Skill Redesign Plan

## Summary

Rewrite the `/ideas-go-faster` SKILL.md from a kanban board health checker into a radical business growth process auditor. The current skill counts WIP, finds aging cards, and diagnoses kanban lane bottlenecks. The redesigned skill audits the business machine itself — identifying missing processes, broken feedback loops, unmeasured outcomes, and stalled growth levers — using the Elon Musk 5-step algorithm as the ordering principle for all recommendations. It reads business plans and people profiles as living inputs, tracks progress against targets, and produces simple trajectory forecasts.

## Goals

- Replace kanban flow analysis with business process auditing (Measure, Acquire, Convert, Retain, Operate)
- Embed the Elon Musk 5-step algorithm as the strict ordering for all interventions
- Read and compare business plans against observable reality each sweep
- Read people profiles to inform realistic task allocation in recommendations
- Produce trajectory forecasts per business ("at current pace, X will/won't reach Y by Z")
- Full AI-driven idea pipeline: generate raw ideas with priority scores, auto-work-up top ideas into cards — no human in the loop until cards are in the kanban

## Non-goals

- WIP management (Pete handles daily)
- Card-level backlog grooming (split/merge/reorder)
- Kanban lane health as primary output (signals only, not the point)
- Building forecasting infrastructure (define needs, don't build the system)
- Replacing `/scan-repo` (complementary — scan detects changes, sweep audits state)

## Constraints & Assumptions

- Constraints:
  - Single SKILL.md file (prompt-only, no TypeScript)
  - Phase 0: Pete triggers the sweep, but the idea pipeline within the sweep is fully autonomous (no human gate between diagnosis → raw idea → card creation)
  - Agent API + direct file reads for plans/profiles (API for cards/ideas, files for plans/people)
  - Must follow `card-operations.md` conventions for idea creation via API
- Assumptions:
  - Business plans may not exist on first run — skill must handle gracefully (flag as #1 finding, recommend bootstrapping)
  - People profiles may not exist — skill must degrade gracefully (use default capacity)

## Fact-Find Reference

- Related brief: `docs/plans/ideas-go-faster-redesign-fact-find.md`
- Key findings:
  - Current skill is a kanban flow analyzer — wrong problem
  - Zero business plans exist; zero people profiles exist
  - Brikette has 168 guides but ZERO analytics
  - Product Pipeline has zero revenue, no Amazon account
  - Forecasting primitives exist in `@acme/lib` (EWMA, Holt) but nothing uses them
  - Draft pack at `~/Downloads/kanban-sweep-agent-draft/` has excellent anti-theater material
  - Maturity model (L1/L2/L3) is the strategic framework

## Existing System Notes

- Current skill: `.claude/skills/ideas-go-faster/SKILL.md` (626 lines)
- Business plans expected at: `docs/business-os/strategy/<BUSINESS>/plan.user.md` (none exist)
- People profiles expected at: `docs/business-os/people/people.user.md` (doesn't exist)
- Agent API: `${BOS_AGENT_API_BASE_URL}/api/agent/{businesses,people,cards,ideas,stage-docs}`
- Sweep reports output to: `docs/business-os/sweeps/<YYYY-MM-DD>-sweep.user.md`
- Draft pack (reference): `~/Downloads/kanban-sweep-agent-draft/` (constitution, playbooks, templates)
- Maturity model: `docs/business-os/strategy/business-maturity-model.md`
- Related skills: `/update-business-plan`, `/update-people`, `/scan-repo`, `/work-idea`

## Proposed Approach

Rewrite the SKILL.md from scratch around a **Business Process Audit** framework instead of kanban flow analysis. The core loop becomes:

```
Ingest (plans + profiles + cards + ideas)
  → Audit each business against 5 process categories
  → Diagnose ONE constraint per business (with evidence)
  → Generate interventions using Musk 5-step ordering
  → Compare to plan targets → forecast trajectory
  → Write report
  → Create raw ideas with priority scores
  → Auto-work-up top ideas into cards (no human gatekeeping)
```

**Key design decisions:**

1. **Framework: MACRO (Measure, Acquire, Convert, Retain, Operate)** — Five process categories that cover the full growth machine. "Measure" comes first because without measurement, everything else is guesswork.

2. **Constraint diagnosis per business, not system-wide** — Each business has its own bottleneck. Brikette's constraint (no analytics) is different from PIPE's (no product launched).

3. **File reads for plans/profiles** — The agent API doesn't expose business plans or people profiles. The skill reads them directly from the filesystem. This is a pragmatic Phase 0 decision; API endpoints can be added later.

4. **Trajectory forecasts as prose, not models** — "At current pace, Brikette will reach L3 by Q3 2026" rather than Monte Carlo simulations. Simple, useful, doesn't require infrastructure.

5. **Full AI-driven idea pipeline (two-stage priority)** — No human in the loop between diagnosis and kanban entry. The sweep:
   - **Stage 1 (Raw):** Generates all ideas with a raw priority score from the scoring rubric. Logs to inbox via API, tagged `raw`, `sweep-generated`, `sweep-<date>`.
   - **Stage 2 (Auto-work-up):** For ideas scoring above a threshold, automatically works them up into cards. This means the sweep invokes `/work-idea` logic inline — creating a card with kanban priority (P0-P3), description, business assignment, and an initial fact-find stage doc. Cards enter the kanban at the Inbox lane, ready for `/fact-find`.
   - **Safeguards:** Max 3 auto-worked-up cards per sweep. All auto-created cards tagged `sweep-auto` so Pete can identify AI-generated work. Ideas below the threshold remain raw in the inbox for manual review.
   - **Two-stage priority:** The raw score is a triage signal from business process analysis (Impact × Confidence × Time-to-signal) / (Effort × (1 + Risk)). The kanban priority (P0-P3) is a commitment signal assigned during work-up based on constraint severity, business maturity stage, and plan alignment.

6. **No permission flags** — No `--create-ideas`. No confirmation prompts. The skill diagnoses, scores, and acts. Pete reviews the output, not the input.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Write the redesigned SKILL.md | 85% | L | Complete (2026-02-09) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Update cross-references in related skills | 90% | S | Complete (2026-02-09) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Validation run — invoke skill against current state | 80% | S | Deferred (API not available) | TASK-01 | - |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | TASK-01 | - | Core implementation — writes the SKILL.md |
| 2 | TASK-02, TASK-03 | TASK-01 | Can run in parallel after SKILL.md is written |

**Max parallelism:** 2 | **Critical path:** 2 waves | **Total tasks:** 3

## Tasks

### TASK-01: Write the redesigned SKILL.md

- **Type:** IMPLEMENT
- **Affects:** `.claude/skills/ideas-go-faster/SKILL.md`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 85%
  - Implementation: 88% — Clear structure from fact-find, draft pack materials available as source, existing skill as starting point. Single file rewrite.
  - Approach: 85% — User direction is clear (Elon Musk philosophy, business process auditor). MACRO framework is well-defined. Minor uncertainty: exact forecasting format.
  - Impact: 82% — Replaces current skill entirely. Integration points with other skills well-mapped. Risk: first sweep may bootstrap missing plans/profiles awkwardly.
- **Effort:** L
  - Files affected: 1 (but 600+ lines, complete rewrite)
  - New patterns introduced: Yes (business process audit framework, trajectory forecasting, plan/profile integration)
  - Integration boundaries: 3+ (agent API, business plans, people profiles, related skills)
- **Acceptance:**
  - SKILL.md contains a Constitution section embodying the Elon Musk 5-step algorithm
  - SKILL.md defines the MACRO framework (Measure, Acquire, Convert, Retain, Operate) with per-category diagnostic questions
  - Workflow reads business plans and people profiles (with graceful degradation if missing)
  - Constraint diagnosis produces ONE constraint per business with evidence
  - Interventions follow strict Musk ordering (Question → Delete → Simplify → Accelerate → Automate)
  - Sweep report template is business-focused with per-business sections
  - Includes one-pager output (5 lines: constraint + 3 actions + consequence)
  - Includes trajectory forecast per business
  - Two-stage idea pipeline: raw ideas with priority scores → auto-work-up top ideas into cards
  - Raw ideas tagged `raw`, `sweep-generated`, `sweep-<date>` with scoring rubric scores
  - Auto-work-up for ideas above priority threshold: creates card + fact-find stage doc, tagged `sweep-auto`
  - Max 3 auto-created cards per sweep; remaining ideas stay raw in inbox
  - No `--create-ideas` flag or human gatekeeping — fully AI-driven
  - Self-evaluation is a pass/fail checklist (not a 30-point rubric)
  - Red flags section prevents process theater
  - Integration section references correct skill names and data flows
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: Skill frontmatter has `name: ideas-go-faster` and updated description → matches new purpose
    - TC-02: Constitution section includes all 5 Musk algorithm steps in strict order → present and ordered
    - TC-03: MACRO framework defines 5 categories with ≥3 diagnostic questions each → framework is actionable, not vague
    - TC-04: Workflow section reads business plans from `docs/business-os/strategy/<BIZ>/plan.user.md` → file paths correct
    - TC-05: Workflow section reads people profiles → graceful fallback when profiles don't exist
    - TC-06: Constraint diagnosis requires evidence bullets and confidence score → no unsourced claims
    - TC-07: Intervention generation enforces Musk ordering (Delete before Simplify before Accelerate before Automate) → not a tiebreaker, hard ordering
    - TC-08: Report template includes per-business sections with plan-target-vs-actual comparison → not system-wide only
    - TC-09: One-pager section defined with exact format (1 sentence + 3 bullets + 1 sentence) → concise forcing function
    - TC-10: Trajectory forecast section uses prose, not models → "At current pace..." format
    - TC-11: Two-stage idea pipeline defined: Stage 1 (raw with scores) → Stage 2 (auto-work-up to card) → no human gate between them
    - TC-12: Raw idea format includes priority score from rubric (Impact, Confidence, Time-to-signal, Effort, Risk) → score is computed, not arbitrary
    - TC-13: Auto-work-up section creates card + fact-find stage doc for top-scoring ideas → uses `/work-idea` or card-operations conventions
    - TC-14: Max 3 auto-created cards per sweep; threshold for auto-work-up defined → safeguard against noise
    - TC-15: All auto-created cards tagged `sweep-auto` → traceable, reviewable by Pete
    - TC-16: No `--create-ideas` flag or human confirmation → fully AI-driven pipeline
    - TC-17: Red flags include "recommends Automate before exhausting Delete" → Musk ordering enforced in guardrails
    - TC-18: No WIP counting, aging metrics, or lane health as primary analysis → kanban housekeeping removed
    - TC-19: Maturity model (L1/L2/L3) referenced in business assessment → strategic context used
  - **Acceptance coverage:** TC-01 covers frontmatter; TC-02 covers constitution; TC-03 covers MACRO; TC-04-05 covers plan/profile reads; TC-06 covers evidence; TC-07 covers Musk ordering; TC-08-10 covers report template; TC-11-16 covers AI-driven idea pipeline; TC-17 covers anti-theater guardrails; TC-18 covers non-goals; TC-19 covers maturity
  - **Test type:** Manual review (prompt-only skill — no automated tests)
  - **Test location:** Review the written SKILL.md against acceptance criteria
  - **Run:** Read the file and verify each TC
- **TDD execution plan:**
  - **Red:** N/A — prompt-only skill, no executable tests. Validation is by review.
  - **Green:** Write the SKILL.md incorporating all acceptance criteria.
  - **Refactor:** Review for coherence, remove redundancy, ensure radical tone (not conventional).
- **Source materials to incorporate:**
  - `~/Downloads/kanban-sweep-agent-draft/constitution.md` — Anti-theater stances, constraint-first mentality
  - `~/Downloads/kanban-sweep-agent-draft/playbooks/deletion_first.md` — Forcing questions for every process
  - `~/Downloads/kanban-sweep-agent-draft/playbooks/bottleneck_selection.md` — Constraint diagnosis method
  - `~/Downloads/kanban-sweep-agent-draft/playbooks/scoring_rubric.md` — Priority formula
  - `~/Downloads/kanban-sweep-agent-draft/evaluation/red_flags.md` — Anti-patterns
  - `docs/business-os/strategy/business-maturity-model.md` — L1/L2/L3 framework
  - `.claude/skills/update-business-plan/SKILL.md` — Plan schema reference
  - `.claude/skills/update-people/SKILL.md` — People profile schema reference
  - `.claude/skills/_shared/card-operations.md` — API conventions
- **What would make this ≥90%:**
  - Bootstrap one business plan (BRIK) as a concrete reference before writing the skill
  - Define exact trajectory forecast calculations with sample data
- **Rollout / rollback:**
  - Rollout: Replace `.claude/skills/ideas-go-faster/SKILL.md` entirely. Available immediately for `/ideas-go-faster` invocation.
  - Rollback: `git checkout -- .claude/skills/ideas-go-faster/SKILL.md` restores the current kanban version.
- **Documentation impact:**
  - None — the SKILL.md is self-documenting
- **Notes / references:**
  - The SKILL.md structure should follow this outline:
    1. Frontmatter (name, description)
    2. Constitution (Musk algorithm, anti-theater invariants)
    3. Operating Mode (read + analyze + write ideas/plans)
    4. MACRO Framework (5 categories with diagnostic questions)
    5. Data Sources (API endpoints, file paths for plans/profiles)
    6. Sweep Workflow (8 steps: ingest → audit → diagnose → intervene → forecast → report → create raw ideas → auto-work-up top ideas)
    7. Constraint Diagnosis (per-business, evidence-required, confidence-scored)
    8. Intervention Generation (Musk-ordered, scored, max 5)
    9. Plan & Profile Integration (read, compare-to-reality, flag gaps)
    10. Forecasting (trajectory statements, plan target burn rate)
    11. Sweep Report Template (one-pager + per-business sections)
    12. Evaluation Checklist (pass/fail, 5-7 items)
    13. Red Flags (hard guardrails, 7-10 items)
    14. Edge Cases (no plans exist, no profiles exist, API down)
    15. Integration with Other Skills
    16. Phase 0 Constraints

#### Build Completion (2026-02-09)
- **Status:** Complete
- **Commits:** 8405942fd2
- **TDD cycle:**
  - Test cases executed: TC-01 through TC-19 (all 19)
  - Red-green cycles: 1 (prompt-only skill — manual review, all TCs passed on first write)
  - Initial test run: N/A (prompt-only skill, no executable tests)
  - Post-implementation: PASS (all 19 TCs verified by review)
- **Confidence reassessment:**
  - Original: 85%
  - Post-test: 88%
  - Delta reason: Tests validated all assumptions. Structure follows outline exactly. 730 lines (target was ~500 but MACRO diagnostic tables and two-stage pipeline require detail).
- **Validation:**
  - Manual review: all 19 test cases PASS
  - No typecheck/lint needed (prompt-only skill file)
- **Documentation updated:** None required (SKILL.md is self-documenting)
- **Implementation notes:**
  - Complete rewrite — 625 lines of kanban health checker replaced with 730 lines of business growth auditor
  - Also removes old `.claude/skills/kanban-sweep/SKILL.md` (git rename + rewrite)
  - Slightly longer than target due to MACRO framework tables (31 diagnostic questions) and detailed two-stage idea pipeline API payloads

### TASK-02: Update cross-references in related skills

- **Type:** IMPLEMENT
- **Affects:** `.claude/skills/update-business-plan/SKILL.md`, `.claude/skills/update-people/SKILL.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 90%
  - Implementation: 95% — Simple text replacements in known files
  - Approach: 90% — Clear what needs updating: trigger references from generic "sweep" or `/scan-repo` to `/ideas-go-faster`
  - Impact: 85% — Low blast radius; only updating integration section references
- **Effort:** S
- **Acceptance:**
  - `update-business-plan/SKILL.md` references `/ideas-go-faster` as a trigger for plan updates
  - `update-people/SKILL.md` references `/ideas-go-faster` for workload-based availability updates
  - No references to `kanban-sweep` remain in any active skill file
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: `grep -r "kanban-sweep" .claude/skills/` returns zero results → no stale references
    - TC-02: `update-business-plan/SKILL.md` mentions `/ideas-go-faster` in its integration section → correct trigger documented
    - TC-03: `update-people/SKILL.md` mentions `/ideas-go-faster` in its integration section → correct trigger documented
  - **Acceptance coverage:** TC-01 covers stale refs; TC-02-03 cover forward refs
  - **Test type:** grep verification
  - **Test location:** `.claude/skills/`
  - **Run:** `grep -r "kanban-sweep" .claude/skills/`
- **TDD execution plan:**
  - **Red:** Run grep for "kanban-sweep" — should find zero (already renamed, but verify)
  - **Green:** Update any remaining references to point to `/ideas-go-faster` with correct context
  - **Refactor:** Verify integration descriptions match the redesigned skill's actual behavior
- **Rollout / rollback:**
  - Rollout: Direct file edits. Immediate effect.
  - Rollback: `git checkout` affected files.
- **Documentation impact:** None

#### Build Completion (2026-02-09)
- **Status:** Complete
- **Commits:** 9b62419a05
- **TDD cycle:**
  - Test cases executed: TC-01, TC-02, TC-03
  - Red-green cycles: 1
  - `grep -r "kanban-sweep" .claude/skills/` → zero results (TC-01 PASS)
  - `update-business-plan/SKILL.md` mentions `/ideas-go-faster` (TC-02 PASS)
  - `update-people/SKILL.md` mentions `/ideas-go-faster` (TC-03 PASS)
- **Confidence reassessment:**
  - Original: 90%
  - Post-test: 90%
  - Delta reason: Tests validated — straightforward edits as expected
- **Validation:** grep verification passed
- **Documentation updated:** None required
- **Implementation notes:** Added `/ideas-go-faster` integration line to both skills' Integration sections

### TASK-03: Validation run — invoke skill against current state

- **Type:** IMPLEMENT
- **Affects:** `docs/business-os/sweeps/` (output location)
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 85% — Invoke `/ideas-go-faster` and review output
  - Approach: 80% — Output quality is subjective; need to evaluate against acceptance criteria
  - Impact: 75% — May create ideas via API; may attempt to read nonexistent plans/profiles. Need API to be running.
- **Effort:** S
- **Acceptance:**
  - Skill invocation completes without errors
  - Sweep report is written to `docs/business-os/sweeps/`
  - Report includes per-business constraint diagnosis with evidence
  - Report includes at least one deletion recommendation
  - Report follows Musk algorithm ordering for interventions
  - Missing business plans are flagged as a finding (not a crash)
  - Missing people profiles degrade gracefully
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: Invoke `/ideas-go-faster` → completes without error → sweep report created
    - TC-02: Report mentions Brikette's missing analytics as a constraint → radical finding, not soft
    - TC-03: Report mentions PIPE's missing Amazon account / first product as a blocker → business-level, not card-level
    - TC-04: Report does NOT contain WIP counts, aging tables, or lane distribution as primary analysis → kanban housekeeping removed
    - TC-05: Report includes trajectory forecast per business → prose format, evidence-based
    - TC-06: Missing plans/profiles handled gracefully → flagged as findings, not errors
  - **Acceptance coverage:** TC-01 covers basic function; TC-02-03 covers radical diagnosis; TC-04 covers non-goals; TC-05-06 covers new features
  - **Test type:** Manual invocation and review
  - **Test location:** Run in Claude Code session
  - **Run:** `/ideas-go-faster`
- **TDD execution plan:**
  - **Red:** Attempt to invoke skill before TASK-01 → would produce kanban-focused output (wrong)
  - **Green:** After TASK-01, invoke skill → produces business-focused output matching acceptance criteria
  - **Refactor:** If output is too conventional, iterate on SKILL.md wording to sharpen radical tone
- **Prerequisites:**
  - Business OS agent API must be running (local or prod)
  - Environment variables set: `BOS_AGENT_API_BASE_URL`, `BOS_AGENT_API_KEY`
- **Rollout / rollback:**
  - Rollout: N/A — validation only, produces a sweep report
  - Rollback: Delete generated sweep report if output is poor
- **Documentation impact:** None
- **Notes:**
  - If API is not available, validation can be deferred. The SKILL.md itself can still be reviewed against TASK-01's test contract.

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Skill falls back to conventional kanban analysis despite redesign | Red Flags section explicitly bans WIP tables, aging metrics, lane health as primary output. Review TASK-03 output for regression. |
| Business plans don't exist, making plan-vs-reality comparison empty | Skill handles gracefully: flags missing plans as finding #1, recommends bootstrapping via `/update-business-plan`. |
| Agent API not running during validation | TASK-03 can be deferred. TASK-01 acceptance can be verified by manual SKILL.md review. |
| Skill becomes too long/complex (current is 626 lines) | Target ~500 lines. Cut kanban-specific sections (flow signals, WIP calculations, lane analysis). Add business process sections. Net change should be approximately neutral. |
| Related skills expect old kanban-sweep behavior | TASK-02 updates cross-references. The fundamental outputs (sweep report, draft ideas) remain compatible — only the analysis method changes. |

## Observability

- Logging: Skill produces a sweep report that is its own observability artifact
- Metrics: Self-evaluation checklist at end of each sweep (pass/fail per item)
- Alerts/Dashboards: N/A (Phase 0, manual invocation)

## Acceptance Criteria (overall)

- [ ] `/ideas-go-faster` SKILL.md is a business growth process auditor, not a kanban health checker
- [ ] Elon Musk 5-step algorithm is the ordering principle for all interventions
- [ ] MACRO framework (Measure, Acquire, Convert, Retain, Operate) replaces kanban flow signals
- [ ] Business plans and people profiles are read and compared to reality
- [ ] Trajectory forecasts are included per business
- [ ] Two-stage AI-driven idea pipeline: raw ideas with scores → auto-work-up top ideas into cards
- [ ] No human gatekeeping — sweep diagnoses, scores, and acts autonomously
- [ ] No WIP counts, aging tables, or lane distribution as primary output
- [ ] Cross-references in related skills updated
- [ ] Validation run produces a business-focused sweep report

## Decision Log

- 2026-02-09: Chose MACRO framework (Measure, Acquire, Convert, Retain, Operate) over AARRR pirate metrics — MACRO puts Measurement first (the biggest gap) and includes Operate (process efficiency). AARRR is too SaaS-focused for a hostel + product pipeline + fashion e-commerce portfolio.
- 2026-02-09: Chose to always create ideas (remove `--create-ideas` flag) — permission-seeking is process theater. A radical skill acts on its findings.
- 2026-02-09: Chose file reads for plans/profiles over API-only — pragmatic Phase 0 decision. API endpoints can be added later.
- 2026-02-09: Chose per-business constraint diagnosis over system-wide — each business has a different bottleneck. System-wide diagnosis hides the specifics.
- 2026-02-09: Chose prose trajectory forecasts over quantitative models — no time-series DB exists. Simple, useful, doesn't require infrastructure.
- 2026-02-09: Chose to inline plan/profile reading logic rather than sub-invoking `/update-business-plan` and `/update-people` — keeps sweep self-contained; recommends full skills for deeper updates.
- 2026-02-09: Chose full AI-driven idea pipeline (no human gatekeeping) — sweep generates raw ideas with priority scores, then auto-works-up top-scoring ideas into cards with kanban priority. Max 3 auto-created cards per sweep. Pete reviews output (cards in kanban), not input (raw ideas). This removes the human bottleneck from the idea-to-card pipeline.
