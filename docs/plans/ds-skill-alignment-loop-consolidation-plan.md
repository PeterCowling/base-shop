---
Type: Plan
Status: Active
Domain: Platform
Workstream: Mixed
Created: 2026-02-13
Last-updated: 2026-02-13
Feature-Slug: ds-skill-alignment-loop-consolidation
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: /lp-build
Supporting-Skills: /meta-reflect
Overall-confidence: 84%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Business-OS-Integration: on
Business-Unit: PLAT
Card-ID: pending
---

# Skill Alignment & Loop Consolidation Plan

## Summary

Align the skill inventory with the S0–S10 startup loop by: (1) renaming `site-upgrade` → `lp-site-upgrade`, (2) building 11 new `lp-*` skills that fill three missing spines (Offer, Distribution, Experiment) and three empty stages (S1, S3, S5), (3) extending 3 existing skills to absorb proposed functionality, and (4) updating the `startup-loop` orchestrator and `lp-fact-find` routing to reference the new skills. The `idea-*` family is explicitly untouched — it serves established businesses as a parallel system.

## Goals

- Every startup loop stage (S0–S10 including sub-stages) has a dedicated `lp-*` skill or explicit template
- Three missing spines (Offer, Distribution, Experiment) are covered by skills
- Each new startup stage skill clearly documents how it differs from its `idea-*` equivalent
- Existing cross-cutting skills (`biz-*`, `ops-*`, `review-*`, `meta-*`, `draft-*`) are untouched except for 3 targeted extensions
- The `startup-loop` orchestrator routes to new `lp-*` stage skills

## Non-goals

- Modifying any `idea-*` skill (separate system, permanently coexisting)
- Changing the S0–S10 stage numbering
- Building the 7 deferred skills (partner-prospecting, affiliate-program, swipe-file-builder, pricing-monitor, support-playbook, fulfillment-ops-plan, separate SEO splits)
- Running each new skill on a real business (that's post-plan validation, not part of the build)

## Constraints & Assumptions

- Constraints:
  - SKILL.md files must follow established patterns: Operating Mode, Inputs, Workflow, Output Contract, Quality Checks
  - The rename must update all refs atomically (25 files in blast radius, 3 critical)
  - `idea-*` skills are NOT modified
  - No runtime code changes — this is all skill authoring + ref updates
- Assumptions:
  - Open questions from fact-find use stated defaults: stage-order build priority, `startup-loop` keeps its name
  - Each skill can be validated by running it once on a real business after build (not during)

## Fact-Find Reference

- Related brief: `docs/plans/ds-skill-alignment-loop-consolidation-fact-find.md`
- Key findings:
  - 37 existing skills across 10 prefix families; 8 are stage-bound, 29 cross-cutting
  - Three structural gaps: Offer spine (S2B), Distribution spine (S6B), Experiment spine (S1B/S9B/S10)
  - `idea-*` family (7 skills) serves established businesses — NOT part of startup loop
  - Consolidation: ~40 proposed skills → 11 new + 1 rename + 3 extensions
  - Site-upgrade rename blast radius: 25 files total, 3 critical (skill dir, lp-fact-find, startup-loop)
  - Skill pattern: loop-stage skills are 150-250 lines with Quality Checks section

## Existing System Notes

- Key modules/files:
  - `.claude/skills/` — all skill directories (37 total)
  - `.claude/skills/_shared/card-operations.md` — shared card API patterns
  - `.claude/skills/startup-loop/SKILL.md` — orchestrator (204 lines, references S0-S10 skills)
  - `.claude/skills/lp-fact-find/SKILL.md` — progressive routing table (1032 lines, 13 refs to site-upgrade)
  - `.claude/skills/idea-readiness/SKILL.md` — 230 lines, 7-gate structure (reference for lp-readiness differentiation)
  - `.claude/skills/idea-forecast/SKILL.md` — 203 lines, market-research-gate pattern (reference for lp-forecast differentiation)
  - `.claude/skills/idea-generate/SKILL.md` — Cabinet Secretary pipeline (reference for lp-prioritize differentiation)
- Patterns to follow:
  - `.claude/skills/lp-replan/SKILL.md` — good example of a 150-250 line stage skill with quality checks
  - `.claude/skills/draft-email/SKILL.md` — good example of a minimal artifact drafter (80 lines)
  - `.claude/skills/review-critique/SKILL.md` — good example of multi-schema skill with modes (459 lines)

## Proposed Approach

Build skills in loop-stage order (S1 → S1B → S2B → S3 → S5 → S6 → S6B → S9B → S10) so each skill's output template can reference what the next stage expects. Group into waves for parallelism where skills at the same stage or independent stages can be authored concurrently.

The rename goes first (mechanical, unblocks lp-fact-find ref updates). Then core spine (S1/S3/S5), then offer, then experiment, then distribution, then launch QA, then extensions, then loop integration.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| DS-01 | IMPLEMENT | Rename site-upgrade → lp-site-upgrade | 92% | S | Pending | - | DS-08, DS-16 |
| DS-02 | IMPLEMENT | Build lp-readiness (S1 startup preflight) | 85% | M | Pending | - | DS-05, DS-08, DS-16 |
| DS-03 | IMPLEMENT | Build lp-forecast (S3 startup forecaster) | 85% | M | Pending | - | DS-08, DS-16 |
| DS-04 | IMPLEMENT | Build lp-prioritize (S5 startup ranking) | 85% | M | Pending | - | DS-08, DS-16 |
| DS-05 | IMPLEMENT | Build lp-offer (S2B offer design) | 83% | M | Pending | DS-02 | DS-08, DS-14, DS-16 |
| DS-06 | IMPLEMENT | Build lp-measure (S1B measurement bootstrap) | 83% | M | Pending | - | DS-07, DS-08, DS-16 |
| DS-07 | IMPLEMENT | Build lp-experiment (S8→S10 experiment design + readout) | 82% | M | Pending | DS-06 | DS-08, DS-16 |
| DS-08 | CHECKPOINT | Horizon check — validate core + offer + experiment spine | 95% | S | Pending | DS-01, DS-02, DS-03, DS-04, DS-05, DS-06, DS-07 | DS-09, DS-10, DS-11, DS-12, DS-13, DS-14, DS-15, DS-16 |
| DS-09 | IMPLEMENT | Build lp-channels (S6B channel strategy) | 82% | M | Pending | DS-08 | DS-16 |
| DS-10 | IMPLEMENT | Build lp-seo (S6B phased SEO) | 80% | L | Pending | DS-08 | DS-16 |
| DS-11 | IMPLEMENT | Build draft-outreach (S6B outreach scripts) | 86% | S | Pending | DS-08 | DS-16 |
| DS-12 | IMPLEMENT | Build lp-launch-qa (S9B pre-launch gate) | 82% | M | Pending | DS-08 | DS-16 |
| DS-13 | IMPLEMENT | Build lp-design-qa (S9B UI regression QA) | 82% | M | Pending | DS-08 | DS-16 |
| DS-14 | IMPLEMENT | Extend review-critique with offer schema | 88% | S | Pending | DS-05, DS-08 | DS-16 |
| DS-15 | IMPLEMENT | Extend draft-marketing + draft-email | 87% | S | Pending | DS-08 | DS-16 |
| DS-16 | IMPLEMENT | Update startup-loop orchestrator + lp-fact-find routing | 80% | M | Pending | DS-01, DS-02, DS-03, DS-04, DS-05, DS-06, DS-07, DS-08, DS-09, DS-10, DS-11, DS-12, DS-13, DS-14, DS-15 | - |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Parallelism Guide

Execution waves for subagent dispatch. Tasks within a wave can run in parallel.
Tasks in a later wave require all blocking tasks from earlier waves to complete.

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | DS-01, DS-02, DS-03, DS-04, DS-06 | - | Rename + 4 independent stage skills (S1, S3, S5, S1B). Max parallelism. |
| 2 | DS-05, DS-07 | W1: DS-02, DS-06 | DS-05 (lp-offer) needs DS-02 (lp-readiness defines "offer clarity"). DS-07 (lp-experiment) needs DS-06 (lp-measure defines event taxonomy). |
| 3 | DS-08 | W1 + W2: all | **CHECKPOINT** — reassess distribution/launch QA/extension tasks using evidence from completed skills. Sequential gate. |
| 4 | DS-09, DS-10, DS-11, DS-12, DS-13, DS-14, DS-15 | W3: DS-08 | All post-checkpoint work in parallel: distribution spine (DS-09–DS-11), launch QA (DS-12–DS-13), extensions (DS-14–DS-15). DS-14 also needs DS-05 (satisfied from W2). |
| 5 | DS-16 | W4: all | Final integration — update orchestrator + routing. Must see all skills to reference them. |

**Max parallelism:** 5 (Wave 1) / 7 (Wave 4)
**Critical path:** DS-02 → DS-05 → DS-08 → DS-14 → DS-16 (5 waves)
**Total tasks:** 16 (15 IMPLEMENT + 1 CHECKPOINT)
**Auto-continue scope:** Waves 1–2 (DS-01 through DS-07) proceed automatically. DS-08 CHECKPOINT pauses for reassessment.

## Tasks

### DS-01: Rename site-upgrade → lp-site-upgrade

- **Type:** IMPLEMENT
- **Deliverable:** code-change — renamed directory + updated references
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `.claude/skills/site-upgrade/` (rename to `.claude/skills/lp-site-upgrade/`)
  - **Primary:** `.claude/skills/lp-fact-find/SKILL.md` (13 refs)
  - **Primary:** `.claude/skills/startup-loop/SKILL.md` (2 refs)
  - **Primary:** `docs/plans/ds-skill-alignment-loop-consolidation-fact-find.md`
  - **Secondary:** `[readonly] docs/business-os/startup-loop-workflow.user.md` (1 mention — update for consistency)
- **Depends on:** -
- **Blocks:** DS-08, DS-16
- **Confidence:** 92%
  - Implementation: 95% — mechanical rename + grep/replace. Blast radius fully mapped (25 files, 3 critical).
  - Approach: 92% — simple rename, no alternative approaches.
  - Impact: 90% — blast radius documented. Non-critical refs in user-facing docs can be updated for consistency.
- **Acceptance:**
  - Directory renamed from `site-upgrade` to `lp-site-upgrade`
  - All references in `.claude/skills/lp-fact-find/SKILL.md` updated
  - All references in `.claude/skills/startup-loop/SKILL.md` updated
  - Grep for `site-upgrade` in `.claude/skills/` returns zero hits (excluding `lp-site-upgrade` itself)
- **Validation contract:**
  - VC-01: Directory existence — `ls .claude/skills/lp-site-upgrade/SKILL.md` returns file → pass; missing → fail
  - VC-02: Old directory gone — `ls .claude/skills/site-upgrade/` returns "not found" → pass; exists → fail
  - VC-03: Reference cleanliness — `grep -r "site-upgrade" .claude/skills/ --include="*.md" | grep -v lp-site-upgrade | grep -v fact-find.md` returns empty → pass; non-empty → fail (fact-find brief itself may legitimately mention the old name in historical context)
  - Acceptance coverage: VC-01/VC-02 cover dir rename; VC-03 covers ref updates
  - Validation type: shell commands
  - Run/verify: bash commands above
- **Execution plan:** Red → Green → Refactor
  - Red: verify old dir exists, new dir does not; grep shows old refs
  - Green: rename dir, update all refs, verify VCs pass
  - Refactor: check user-facing docs for stale mentions; clean up
- **Rollout / rollback:**
  - Rollout: atomic commit with dir rename + all ref updates
  - Rollback: `git revert` — single commit
- **Documentation impact:** `docs/business-os/startup-loop-workflow.user.md` mention updated
- **Notes:** Blast radius from exploration: 25 files total. 3 critical (skill dir, lp-fact-find, startup-loop). 20+ non-critical (user-facing docs, artifact files). Non-critical files should be updated for consistency but are not functionally impacted.

---

### DS-02: Build lp-readiness (S1 — startup preflight gate)

- **Type:** IMPLEMENT
- **Deliverable:** business-artifact — `.claude/skills/lp-readiness/SKILL.md`
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Artifact-Destination:** `.claude/skills/lp-readiness/SKILL.md`
- **Reviewer:** Pete
- **Approval-Evidence:** User confirms skill produces useful output when run on a real business
- **Measurement-Readiness:** Validated by first startup-loop run that invokes `/lp-readiness`; Pete reviews output
- **Affects:**
  - **Primary:** `.claude/skills/lp-readiness/SKILL.md` (new)
  - **Secondary:** `[readonly] .claude/skills/idea-readiness/SKILL.md` (differentiation reference)
  - **Secondary:** `[readonly] .claude/skills/startup-loop/SKILL.md` (stage context)
- **Depends on:** -
- **Blocks:** DS-05, DS-08, DS-16
- **Confidence:** 85%
  - Implementation: 88% — clear pattern from `idea-readiness` (230 lines, 7-gate structure). Startup version is simpler (3 core gates). Well-understood SKILL.md format.
  - Approach: 85% — startup preflight needs different gates than established-business readiness. Clear differentiation: offer clarity, distribution feasibility, measurement plan.
  - Impact: 82% — new file, no existing references to break. Integration with startup-loop orchestrator deferred to DS-16.
- **Acceptance:**
  - SKILL.md created with all required sections (Operating Mode, Inputs, Workflow, Output Contract, Quality Checks)
  - "Differs from idea-readiness" section explicitly states the 3 startup gates vs. 7 established-business gates
  - Output template includes: offer-clarity check, distribution-feasibility check, measurement-plan check
  - Quality Checks section includes self-audit checklist
  - Skill length: 120-180 lines (lighter than idea-readiness at 230)
- **Validation contract:**
  - VC-01: Structural compliance — SKILL.md contains sections: Operating Mode, Inputs, Workflow, Output Contract, Quality Checks → pass; any missing → fail. Deadline: at authoring time.
  - VC-02: Differentiation clarity — "Differs from idea-readiness" section exists and names ≥3 concrete differences → pass; vague/missing → fail. Minimum sample: 3 named differences.
  - VC-03: Gate coverage — Output template includes checks for (a) offer clarity, (b) distribution feasibility, (c) measurement plan → pass; any missing → fail.
  - VC-04: Size constraint — file is 100-200 lines → pass; <100 (too thin) or >250 (not lighter) → fail.
  - Acceptance coverage: VC-01 covers structure, VC-02 covers differentiation, VC-03 covers gates, VC-04 covers weight
  - Validation type: review checklist
  - Run/verify: manual review of SKILL.md against VCs
- **Execution plan:** Red → Green → Refactor (VC-first fail-first loop)
  - Red: create skeleton SKILL.md with headers only; verify VC-01 fails (sections empty); verify VC-03 fails (no gates)
  - Green: fill all sections with startup-specific content; verify all VCs pass
  - Refactor: tighten language, ensure integration contract with lp-offer (downstream) is clear; re-verify VCs
- **What would make this ≥90%:** Run the skill on HEAD and verify the output is actionable for S1 gate decision
- **Rollout / rollback:**
  - Rollout: new file, no existing consumers
  - Rollback: delete directory
- **Documentation impact:** None (startup-loop orchestrator updated in DS-16)
- **Notes:** Reference `idea-readiness` for structure but NOT content. The 7 gates (RG-01 through RG-07) are for established businesses. Startup gates should be: (1) Does an offer hypothesis exist? (2) Are ≥2 channels plausible? (3) Can we measure outcomes?

---

### DS-03: Build lp-forecast (S3 — startup 90-day forecaster)

- **Type:** IMPLEMENT
- **Deliverable:** business-artifact — `.claude/skills/lp-forecast/SKILL.md`
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Artifact-Destination:** `.claude/skills/lp-forecast/SKILL.md`
- **Reviewer:** Pete
- **Approval-Evidence:** User confirms skill produces useful output when run on a real business
- **Measurement-Readiness:** Validated by first startup-loop run that invokes `/lp-forecast`; Pete reviews output
- **Affects:**
  - **Primary:** `.claude/skills/lp-forecast/SKILL.md` (new)
  - **Secondary:** `[readonly] .claude/skills/idea-forecast/SKILL.md` (differentiation reference)
- **Depends on:** -
- **Blocks:** DS-08, DS-16
- **Confidence:** 85%
  - Implementation: 88% — clear pattern from `idea-forecast` (203 lines). Startup version works from zero data (market signals only).
  - Approach: 85% — startup forecasting without operational history is a known problem. P10/P50/P90 bands from market comparables + channel benchmarks.
  - Impact: 82% — new file, no existing references to break.
- **Acceptance:**
  - SKILL.md created with all required sections
  - "Differs from idea-forecast" section explains: works from zero, market signals only, no historical data assumed
  - Output template: P10/P50/P90 scenario bands, unit economics assumptions, channel-specific ranges, first-14-day validation plan
  - Quality Checks section present
  - 120-180 lines
- **Validation contract:**
  - VC-01: Structural compliance — all required sections present → pass
  - VC-02: Differentiation clarity — ≥3 named differences from idea-forecast → pass
  - VC-03: Output completeness — template includes P10/P50/P90 bands, unit economics, channel ranges, validation plan → pass; any missing → fail
  - VC-04: Size constraint — 100-200 lines → pass
  - Validation type: review checklist
- **Execution plan:** Red → Green → Refactor (VC-first fail-first loop)
- **What would make this ≥90%:** Run on HEAD and verify forecast output is decision-grade
- **Rollout / rollback:** New file / delete directory
- **Documentation impact:** None (orchestrator updated in DS-16)
- **Notes:** Key difference from idea-forecast: `idea-forecast` requires market intelligence pack as input and assumes price intent exists. `lp-forecast` takes market intel + offer hypothesis from `lp-offer` (S2B) and builds from competitor pricing / channel benchmarks with no historical data.

---

### DS-04: Build lp-prioritize (S5 — startup go-item ranking)

- **Type:** IMPLEMENT
- **Deliverable:** business-artifact — `.claude/skills/lp-prioritize/SKILL.md`
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Artifact-Destination:** `.claude/skills/lp-prioritize/SKILL.md`
- **Reviewer:** Pete
- **Approval-Evidence:** User confirms skill produces useful output when run on a real business
- **Measurement-Readiness:** Validated by first startup-loop run that invokes `/lp-prioritize`; Pete reviews output
- **Affects:**
  - **Primary:** `.claude/skills/lp-prioritize/SKILL.md` (new)
  - **Secondary:** `[readonly] .claude/skills/idea-generate/SKILL.md` (differentiation reference)
- **Depends on:** -
- **Blocks:** DS-08, DS-16
- **Confidence:** 85%
  - Implementation: 88% — simpler than idea-generate's 7-stage Cabinet Secretary. Startup version is a rank-and-pick.
  - Approach: 85% — startup prioritization by effort/impact/learning-value is well-understood.
  - Impact: 82% — new file, no existing references.
- **Acceptance:**
  - SKILL.md created with all required sections
  - "Differs from idea-generate" section explains: no Cabinet Secretary pipeline, no Munger/Buffett filter, simple rank by effort/impact/learning-value
  - Output template: ranked go-items with rationale, acceptance criteria, and effort estimates
  - Includes experiment candidates and distribution bets (not just product features)
  - 100-150 lines (much lighter than idea-generate)
- **Validation contract:**
  - VC-01: Structural compliance → pass/fail
  - VC-02: Differentiation clarity — ≥3 named differences from idea-generate → pass
  - VC-03: Ranking criteria — template includes effort, impact, and learning-value as scoring dimensions → pass; missing any → fail
  - VC-04: Size constraint — 80-170 lines → pass
  - Validation type: review checklist
- **Execution plan:** Red → Green → Refactor (VC-first fail-first loop)
- **What would make this ≥90%:** Run on HEAD and verify ranked output feeds cleanly into lp-fact-find
- **Rollout / rollback:** New file / delete directory
- **Documentation impact:** None
- **Notes:** This is deliberately simpler than `idea-generate`. A startup with 5-10 candidates doesn't need a 7-stage pipeline. It needs: "which 2-3 things should we do first, and why?"

---

### DS-05: Build lp-offer (S2B — offer design)

- **Type:** IMPLEMENT
- **Deliverable:** business-artifact — `.claude/skills/lp-offer/SKILL.md`
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Artifact-Destination:** `.claude/skills/lp-offer/SKILL.md`
- **Reviewer:** Pete
- **Approval-Evidence:** User confirms skill produces useful offer artifact when run on a real business
- **Measurement-Readiness:** Validated by first startup-loop run; offer artifact consumed by lp-forecast (S3)
- **Affects:**
  - **Primary:** `.claude/skills/lp-offer/SKILL.md` (new)
  - **Secondary:** `[readonly] .claude/skills/lp-readiness/SKILL.md` (upstream — readiness checks offer clarity)
- **Depends on:** DS-02 (lp-readiness defines what "offer clarity" means; lp-offer must produce it)
- **Blocks:** DS-08, DS-14 (review-critique offer mode references lp-offer output), DS-16
- **Confidence:** 83%
  - Implementation: 85% — no direct template to follow, but lp-fact-find's brief pattern provides structural inspiration. Consolidates ICP + positioning + pricing into sections of one artifact.
  - Approach: 83% — offer design as a single skill (vs. 4 separate) is the right consolidation per fact-find. Untested hypothesis (H3).
  - Impact: 80% — new concept in the loop. Downstream consumers (lp-forecast, lp-channels) will depend on its output format.
- **Acceptance:**
  - SKILL.md created with all required sections
  - Workflow covers: (1) ICP segmentation, (2) pain/promise mapping, (3) offer structure (bundles, guarantees), (4) positioning one-pager, (5) pricing/packaging hypothesis, (6) objection map + risk reversal
  - Output template: single offer artifact with all 6 sections
  - Includes review mining integration (pains/objections from competitor reviews)
  - Quality Checks section present
  - 150-220 lines
- **Validation contract:**
  - VC-01: Structural compliance → pass/fail
  - VC-02: Section coverage — output template includes all 6 sections (ICP, pain/promise, structure, positioning, pricing, objections) → pass; any missing → fail
  - VC-03: Downstream compatibility — output format explicitly states what lp-forecast and lp-channels will consume → pass; no downstream contract → fail
  - VC-04: Size constraint — 130-250 lines → pass
  - Validation type: review checklist
- **Execution plan:** Red → Green → Refactor (VC-first fail-first loop)
  - Red: skeleton with headers; verify VC-02 fails (sections empty)
  - Green: fill all 6 sections with startup-specific guidance; verify VCs pass
  - Refactor: ensure output template is concrete enough that lp-forecast can consume it; re-verify
- **What would make this ≥90%:** Run on HEAD and verify offer artifact is decision-grade and feeds into lp-forecast
- **Rollout / rollback:** New file / delete directory
- **Documentation impact:** None
- **Notes:** This is the most novel skill — no direct precedent. Base structure on lp-fact-find's brief pattern: clear inputs, workflow steps, output template with sections, quality checks. The offer artifact replaces "price intent" assumptions in forecasting.

---

### DS-06: Build lp-measure (S1B — measurement bootstrap)

- **Type:** IMPLEMENT
- **Deliverable:** business-artifact — `.claude/skills/lp-measure/SKILL.md`
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Artifact-Destination:** `.claude/skills/lp-measure/SKILL.md`
- **Reviewer:** Pete
- **Approval-Evidence:** User confirms skill produces actionable measurement setup when run
- **Measurement-Readiness:** Validated by first startup-loop run; measurement setup enables S10 experiment readouts
- **Affects:**
  - **Primary:** `.claude/skills/lp-measure/SKILL.md` (new)
- **Depends on:** -
- **Blocks:** DS-07, DS-08, DS-16
- **Confidence:** 83%
  - Implementation: 85% — GA4/GSC/pixel setup is well-documented. Event taxonomy patterns exist in industry.
  - Approach: 83% — consolidating measurement bootstrap + event taxonomy into one skill is the right call (event taxonomy is step 2 of bootstrap).
  - Impact: 80% — replaces manual S1B. No existing skill to break.
- **Acceptance:**
  - SKILL.md created with all required sections
  - Workflow covers: (1) GA4 setup, (2) GSC setup, (3) pixel/tag setup, (4) event taxonomy definition, (5) UTM governance, (6) baseline dashboard template
  - Output template: measurement setup doc with verification checklist
  - Handles both pre-website and website-live modes
  - 150-200 lines
- **Validation contract:**
  - VC-01: Structural compliance → pass/fail
  - VC-02: Workflow coverage — covers GA4, GSC, pixels, event taxonomy, UTMs, dashboard → pass; any missing → fail
  - VC-03: Mode handling — explicitly addresses both `pre-website` and `website-live` launch surfaces → pass; single mode only → fail
  - VC-04: Size constraint — 130-220 lines → pass
  - Validation type: review checklist
- **Execution plan:** Red → Green → Refactor (VC-first fail-first loop)
- **What would make this ≥90%:** Run on BRIK (website-live) and HEAD (pre-website) to validate both modes
- **Rollout / rollback:** New file / delete directory
- **Documentation impact:** None
- **Notes:** Replaces the manual S1B template-based process. The existing template at `docs/business-os/workflow-prompts/_templates/pre-website-measurement-bootstrap-prompt.md` should be referenced as input pattern.

---

### DS-07: Build lp-experiment (S8→S10 — experiment design + readout)

- **Type:** IMPLEMENT
- **Deliverable:** business-artifact — `.claude/skills/lp-experiment/SKILL.md`
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Artifact-Destination:** `.claude/skills/lp-experiment/SKILL.md`
- **Reviewer:** Pete
- **Approval-Evidence:** User confirms skill produces actionable experiment designs
- **Measurement-Readiness:** Validated by first S10 weekly decision loop that uses experiment readouts
- **Affects:**
  - **Primary:** `.claude/skills/lp-experiment/SKILL.md` (new)
  - **Secondary:** `[readonly] .claude/skills/lp-measure/SKILL.md` (upstream — measurement provides the event taxonomy)
- **Depends on:** DS-06 (lp-measure defines event taxonomy; lp-experiment depends on it for metrics)
- **Blocks:** DS-08, DS-16
- **Confidence:** 82%
  - Implementation: 85% — experiment design is well-understood (hypothesis → variant → metric → sample → pass/fail). Two modes (design + readout) follow the pattern of lp-experiment having phases.
  - Approach: 82% — two modes in one skill (design + readout) is untested. May need splitting later if too complex.
  - Impact: 80% — new concept. Makes S10 a machine instead of a vibes check.
- **Acceptance:**
  - SKILL.md created with all required sections
  - Two explicit modes: `design` (create experiment spec) and `readout` (weekly write-up)
  - Design mode output: hypothesis, variant, metric, sample/timebox, pass/fail criteria, CRO diagnostics
  - Readout mode output: results, confidence level, decision (continue/pivot/scale/kill), next test
  - Includes CRO funnel diagnostics (absorbed from proposed `/cro-diagnostics`)
  - 180-250 lines
- **Validation contract:**
  - VC-01: Structural compliance → pass/fail
  - VC-02: Mode coverage — both `design` and `readout` modes have distinct workflows and output templates → pass; single mode → fail
  - VC-03: Experiment quality — design template includes all 6 elements (hypothesis, variant, metric, sample, timebox, pass/fail) → pass; any missing → fail
  - VC-04: Decision output — readout template includes explicit decision recommendation (continue/pivot/scale/kill) → pass; no decision → fail
  - VC-05: Size constraint — 160-270 lines → pass
  - Validation type: review checklist
- **Execution plan:** Red → Green → Refactor (VC-first fail-first loop)
- **What would make this ≥90%:** Run design mode on a real HEAD experiment hypothesis and verify output is testable
- **Rollout / rollback:** New file / delete directory
- **Documentation impact:** None
- **Notes:** This skill transforms S10 from "weekly vibes check" to "weekly experiment readout machine." The design mode produces experiment specs; the readout mode consumes results and recommends decisions. CRO diagnostics (funnel leak analysis) is a sub-workflow of design mode.

---

### DS-08: Horizon checkpoint — validate core + offer + experiment spine

- **Type:** CHECKPOINT
- **Depends on:** DS-01, DS-02, DS-03, DS-04, DS-05, DS-06, DS-07
- **Blocks:** DS-09, DS-10, DS-11, DS-12, DS-13, DS-14, DS-15, DS-16
- **Confidence:** 95%
- **Acceptance:**
  - Run `/lp-replan` on all tasks after this checkpoint (DS-09 through DS-16)
  - Reassess remaining task confidence using evidence from completed tasks
  - Verify: do the 7 completed skills have consistent output templates that downstream skills can consume?
  - Verify: does the lp-offer output format work for lp-forecast and lp-channels (DS-09)?
  - Verify: does the lp-measure event taxonomy work for lp-experiment (DS-07)?
  - Confirm or revise the approach for distribution spine and launch QA skills
  - Update plan with any new findings, splits, or abandoned tasks
- **Horizon assumptions to validate:**
  - The 3 startup stage skills (lp-readiness, lp-forecast, lp-prioritize) are meaningfully different from idea-* equivalents (H2)
  - lp-offer as a single skill produces sufficiently detailed output (H3)
  - lp-experiment's two-mode pattern works (design + readout in one skill)
  - Distribution spine skills can consume outputs from earlier spine skills

---

### DS-09: Build lp-channels (S6B — channel strategy + GTM)

- **Type:** IMPLEMENT
- **Deliverable:** business-artifact — `.claude/skills/lp-channels/SKILL.md`
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Artifact-Destination:** `.claude/skills/lp-channels/SKILL.md`
- **Reviewer:** Pete
- **Approval-Evidence:** User confirms skill produces actionable channel strategy
- **Measurement-Readiness:** Validated by first startup-loop run; channel strategy consumed by lp-fact-find (S7) for go-item scoping
- **Affects:**
  - **Primary:** `.claude/skills/lp-channels/SKILL.md` (new)
- **Depends on:** DS-08
- **Blocks:** DS-16
- **Confidence:** 82%
  - Implementation: 85% — channel strategy frameworks are well-established. Absorbs GTM plan (timeline variant).
  - Approach: 82% — combining channel strategy + 30-day GTM into one skill is the right call.
  - Impact: 80% — new concept. Draft-* skills downstream consume channel strategy for asset targeting.
- **Acceptance:**
  - SKILL.md created with all required sections
  - Workflow: (1) channel landscape audit, (2) select 2-3 channels with rationale, (3) cost/constraint analysis, (4) cadence plan, (5) 30-day GTM timeline
  - Output template: channel strategy doc with GTM section
  - 130-180 lines
- **Validation contract:**
  - VC-01: Structural compliance → pass/fail
  - VC-02: Channel selection — output requires exactly 2-3 channels with rationale per channel → pass; no rationale or wrong count → fail
  - VC-03: GTM integration — output includes 30-day timeline with weekly milestones → pass; no timeline → fail
  - VC-04: Size constraint — 110-200 lines → pass
  - Validation type: review checklist
- **Execution plan:** Red → Green → Refactor (VC-first fail-first loop)
- **What would make this ≥90%:** Run on HEAD and verify channel strategy feeds cleanly into creative briefs
- **Rollout / rollback:** New file / delete directory
- **Documentation impact:** None

---

### DS-10: Build lp-seo (S6B — phased SEO skill)

- **Type:** IMPLEMENT
- **Deliverable:** business-artifact — `.claude/skills/lp-seo/SKILL.md`
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Artifact-Destination:** `.claude/skills/lp-seo/SKILL.md`
- **Reviewer:** Pete
- **Approval-Evidence:** User confirms skill produces actionable SEO artifacts at each phase
- **Measurement-Readiness:** Validated by first startup-loop run on BRIK (existing site with SEO needs)
- **Affects:**
  - **Primary:** `.claude/skills/lp-seo/SKILL.md` (new)
- **Depends on:** DS-08
- **Blocks:** DS-16
- **Confidence:** 80%
  - Implementation: 82% — 5 phases in one skill is the most complex new skill. Each phase is individually straightforward but the orchestration needs care.
  - Approach: 80% — phased single skill (vs. 5 separate) is untested (H4). May need splitting later.
  - Impact: 78% — new concept. Generalized beyond Brikette guides to all businesses.
- **Acceptance:**
  - SKILL.md created with all required sections
  - 5 explicit phases: (1) keyword universe, (2) content clusters, (3) SERP briefs, (4) tech audit, (5) snippet optimization
  - Each phase has: inputs, workflow, output template, quality checks
  - Phase invocation: `/lp-seo <phase>` or `/lp-seo all`
  - Generalizes beyond Brikette — works for any business with web presence
  - 250-350 lines (largest new skill)
- **Validation contract:**
  - VC-01: Structural compliance → pass/fail
  - VC-02: Phase coverage — all 5 phases have distinct workflows and output templates → pass; any phase missing or vague → fail
  - VC-03: Phase invocation — skill supports both single-phase and all-phases invocation → pass; only one mode → fail
  - VC-04: Generalization — skill does NOT reference Brikette-specific content; works for any business → pass; Brikette-specific → fail
  - VC-05: Size constraint — 230-370 lines → pass
  - Validation type: review checklist
- **Execution plan:** Red → Green → Refactor (VC-first fail-first loop)
  - Red: skeleton with 5 phase headers; verify VC-02 fails (phases empty)
  - Green: fill all phases; verify all VCs pass
  - Refactor: ensure phase outputs chain correctly (universe → clusters → briefs); re-verify
- **What would make this ≥90%:** Run phase 1 (keyword universe) on BRIK and verify output quality; if too complex, split into 2-3 skills
- **Rollout / rollback:** New file / delete directory
- **Documentation impact:** None
- **Notes:** This is the L-effort task. The 5 phases consolidate the user's 5 proposed SEO skills. If the phased approach proves unwieldy after validation, the deferred skill list includes "SEO separate skills" as a trigger to split.

---

### DS-11: Build draft-outreach (S6B — outreach scripts)

- **Type:** IMPLEMENT
- **Deliverable:** business-artifact — `.claude/skills/draft-outreach/SKILL.md`
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Artifact-Destination:** `.claude/skills/draft-outreach/SKILL.md`
- **Reviewer:** Pete
- **Approval-Evidence:** User confirms skill produces usable outreach scripts
- **Measurement-Readiness:** Validated when first outreach campaign uses the scripts
- **Affects:**
  - **Primary:** `.claude/skills/draft-outreach/SKILL.md` (new)
  - **Secondary:** `[readonly] .claude/skills/draft-email/SKILL.md` (pattern reference)
- **Depends on:** DS-08
- **Blocks:** DS-16
- **Confidence:** 86%
  - Implementation: 90% — follows established `draft-*` pattern (80 lines). Outreach scripts are a well-understood artifact type.
  - Approach: 86% — distinct from `draft-email` (marketing) because outreach is sales/partnership, not marketing broadcast.
  - Impact: 82% — new file, follows existing pattern.
- **Acceptance:**
  - SKILL.md created following `draft-*` pattern
  - Covers: DM scripts, email outreach scripts, follow-up sequences, objection handling
  - Distinguishes from `draft-email` (marketing broadcast) in Operating Mode section
  - Quality Checks present
  - 70-110 lines (follows minimal draft-* pattern)
- **Validation contract:**
  - VC-01: Structural compliance → pass/fail
  - VC-02: Scope clarity — Operating Mode distinguishes outreach (sales) from marketing (broadcast) → pass; blurred boundary → fail
  - VC-03: Output types — covers DM, email, follow-up, objections → pass; missing any → fail
  - VC-04: Size constraint — 60-120 lines → pass
  - Validation type: review checklist
- **Execution plan:** Red → Green → Refactor (VC-first fail-first loop)
- **What would make this ≥90%:** Run on a real partnership outreach scenario
- **Rollout / rollback:** New file / delete directory
- **Documentation impact:** None

---

### DS-12: Build lp-launch-qa (S9B — pre-launch gate)

- **Type:** IMPLEMENT
- **Deliverable:** business-artifact — `.claude/skills/lp-launch-qa/SKILL.md`
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Artifact-Destination:** `.claude/skills/lp-launch-qa/SKILL.md`
- **Reviewer:** Pete
- **Approval-Evidence:** User confirms skill produces actionable pre-launch checklist
- **Measurement-Readiness:** Validated by first pre-launch QA run on HEAD/PET
- **Affects:**
  - **Primary:** `.claude/skills/lp-launch-qa/SKILL.md` (new)
- **Depends on:** DS-08
- **Blocks:** DS-16
- **Confidence:** 82%
  - Implementation: 85% — pre-launch checklists are well-understood. Combines conversion QA, SEO tech, perf budget, legal compliance.
  - Approach: 82% — consolidating 4 concerns (conversion, SEO, perf, legal) into one pre-launch gate is the right scope.
  - Impact: 80% — new concept. Gate before S10.
- **Acceptance:**
  - SKILL.md created with all required sections
  - 4 checklist domains: (1) conversion QA (forms, checkout, analytics firing), (2) SEO tech (indexing, canonicals, schema), (3) performance budget, (4) legal compliance (GDPR, cookies, terms, returns, disclaimers)
  - Output template: pass/fail checklist with per-item evidence
  - Release notes + rollback plan section
  - 150-220 lines
- **Validation contract:**
  - VC-01: Structural compliance → pass/fail
  - VC-02: Domain coverage — all 4 checklist domains present with ≥3 check items each → pass; any domain missing or <3 items → fail
  - VC-03: Evidence format — each checklist item requires pass/fail evidence (not just checkbox) → pass; bare checkboxes → fail
  - VC-04: Size constraint — 130-240 lines → pass
  - Validation type: review checklist
- **Execution plan:** Red → Green → Refactor (VC-first fail-first loop)
- **What would make this ≥90%:** Run on HEAD pre-launch and verify checklist catches real issues
- **Rollout / rollback:** New file / delete directory
- **Documentation impact:** None

---

### DS-13: Build lp-design-qa (S9B — UI regression QA)

- **Type:** IMPLEMENT
- **Deliverable:** business-artifact — `.claude/skills/lp-design-qa/SKILL.md`
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Artifact-Destination:** `.claude/skills/lp-design-qa/SKILL.md`
- **Reviewer:** Pete
- **Approval-Evidence:** User confirms skill produces actionable QA checklist
- **Measurement-Readiness:** Validated by first post-build QA run
- **Affects:**
  - **Primary:** `.claude/skills/lp-design-qa/SKILL.md` (new)
  - **Secondary:** `[readonly] .claude/skills/lp-design-spec/SKILL.md` (upstream — design spec defines what to QA against)
- **Depends on:** DS-08
- **Blocks:** DS-16
- **Confidence:** 82%
  - Implementation: 85% — UI QA checklists are well-understood. Screenshots-to-issues format is standard.
  - Approach: 82% — distinct from lp-design-spec (design) because this is post-build verification.
  - Impact: 80% — new concept. Fills the gap between lp-build and lp-launch-qa.
- **Acceptance:**
  - SKILL.md created with all required sections
  - Covers: UI regression checklist, screenshots-to-issues format, a11y checks, responsive checks, token compliance
  - References lp-design-spec output as the "expected" state
  - 120-170 lines
- **Validation contract:**
  - VC-01: Structural compliance → pass/fail
  - VC-02: Check coverage — includes visual regression, a11y, responsive, token compliance → pass; any missing → fail
  - VC-03: Issue format — output includes structured issue format (screenshot + expected + actual + severity) → pass; unstructured → fail
  - VC-04: Size constraint — 100-190 lines → pass
  - Validation type: review checklist
- **Execution plan:** Red → Green → Refactor (VC-first fail-first loop)
- **What would make this ≥90%:** Run post-build on a recent UI change and verify it catches real issues
- **Rollout / rollback:** New file / delete directory
- **Documentation impact:** None

---

### DS-14: Extend review-critique with offer schema detection

- **Type:** IMPLEMENT
- **Deliverable:** business-artifact — updated `.claude/skills/review-critique/SKILL.md`
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Artifact-Destination:** `.claude/skills/review-critique/SKILL.md` (existing, extend)
- **Reviewer:** Pete
- **Approval-Evidence:** User confirms offer critique mode works on a real offer artifact
- **Measurement-Readiness:** Validated when first lp-offer output is critiqued
- **Affects:**
  - **Primary:** `.claude/skills/review-critique/SKILL.md` (extend)
- **Depends on:** DS-05 (lp-offer defines the output format to critique), DS-08
- **Blocks:** DS-16
- **Confidence:** 88%
  - Implementation: 92% — review-critique already has multi-schema detection (fact-find, plan, process). Adding "offer" schema is a known pattern extension.
  - Approach: 88% — Munger-style inversion for offers (value-prop stress test) fits naturally into the existing critique framework.
  - Impact: 85% — extends existing file, low blast radius.
- **Acceptance:**
  - New "Offer" schema added to review-critique's schema detection
  - Offer schema checks: ICP specificity, positioning distinctiveness, pricing justification, objection completeness, risk reversal strength
  - Munger-style inversion: "Why would this offer fail?" applied to each offer section
  - 30-50 lines added to existing 459-line file
- **Validation contract:**
  - VC-01: Schema detection — review-critique auto-detects offer artifacts and applies offer-specific rubric → pass; doesn't detect → fail
  - VC-02: Critique depth — offer rubric includes ≥5 specific check dimensions → pass; <5 → fail
  - VC-03: Non-regression — existing schemas (fact-find, plan, process) still work → pass; broken → fail
  - Validation type: review checklist
- **Execution plan:** Red → Green → Refactor (VC-first fail-first loop)
- **Rollout / rollback:** Edit existing file / git revert
- **Documentation impact:** None

---

### DS-15: Extend draft-marketing + draft-email

- **Type:** IMPLEMENT
- **Deliverable:** business-artifact — updated `.claude/skills/draft-marketing/SKILL.md` and `.claude/skills/draft-email/SKILL.md`
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Artifact-Destination:** `.claude/skills/draft-marketing/SKILL.md`, `.claude/skills/draft-email/SKILL.md` (existing, extend)
- **Reviewer:** Pete
- **Approval-Evidence:** User confirms new modes work
- **Measurement-Readiness:** Validated when first creative brief or email sequence is drafted
- **Affects:**
  - **Primary:** `.claude/skills/draft-marketing/SKILL.md` (extend)
  - **Primary:** `.claude/skills/draft-email/SKILL.md` (extend)
- **Depends on:** DS-08
- **Blocks:** DS-16
- **Confidence:** 87%
  - Implementation: 90% — both files are minimal (76-80 lines). Adding modes is straightforward.
  - Approach: 87% — `brief` mode for draft-marketing and `sequence` mode for draft-email are natural extensions.
  - Impact: 85% — extends existing files, low blast radius.
- **Acceptance:**
  - draft-marketing: new `brief` mode (creative brief) + `landing-page-copy` artifact type
  - draft-email: new `sequence` mode (welcome, abandon cart, post-purchase, winback)
  - Both maintain existing functionality
  - 20-40 lines added to each file
- **Validation contract:**
  - VC-01: Mode support — draft-marketing supports `brief` and `final` modes via argument → pass; no mode distinction → fail
  - VC-02: Sequence support — draft-email supports `single` and `sequence` modes → pass; no mode → fail
  - VC-03: Non-regression — existing single-artifact modes still work → pass; broken → fail
  - Validation type: review checklist
- **Execution plan:** Red → Green → Refactor (VC-first fail-first loop)
- **Rollout / rollback:** Edit existing files / git revert
- **Documentation impact:** None

---

### DS-16: Update startup-loop orchestrator + lp-fact-find routing

- **Type:** IMPLEMENT
- **Deliverable:** business-artifact — updated `.claude/skills/startup-loop/SKILL.md` and `.claude/skills/lp-fact-find/SKILL.md`
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Artifact-Destination:** `.claude/skills/startup-loop/SKILL.md`, `.claude/skills/lp-fact-find/SKILL.md` (existing, update)
- **Reviewer:** Pete
- **Approval-Evidence:** User confirms `/startup-loop status` shows all stages with skill coverage
- **Measurement-Readiness:** Validated by running `/startup-loop status` for each business after update
- **Affects:**
  - **Primary:** `.claude/skills/startup-loop/SKILL.md` (update stage references)
  - **Primary:** `.claude/skills/lp-fact-find/SKILL.md` (update progressive routing table)
- **Depends on:** DS-01 through DS-15 (all skills must exist before orchestrator can reference them)
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 82% — startup-loop is 204 lines, well-structured. Updates are reference additions. lp-fact-find routing table is a known pattern.
  - Approach: 80% — the orchestrator needs to route to new lp-* skills at each stage. This is straightforward but touches the most critical coordination file.
  - Impact: 78% — startup-loop orchestrator is the entry point for the entire loop. Errors here affect all businesses.
- **Acceptance:**
  - startup-loop SKILL.md updated: S1 → `/lp-readiness`, S1B → `/lp-measure`, S2B → `/lp-offer`, S3 → `/lp-forecast`, S5 → `/lp-prioritize`, S6 → `/lp-site-upgrade`, S6B → `/lp-channels` + `/lp-seo`, S9B → `/lp-launch-qa` + `/lp-design-qa`, S10 → `/lp-experiment`
  - lp-fact-find routing table updated: new Primary-Execution-Skill entries for new deliverable types
  - `/startup-loop status` correctly shows skill coverage for all stages
  - No regressions in existing stage routing (S7/S8/S9 unchanged)
- **Validation contract:**
  - VC-01: Stage coverage — every stage S0-S10 (including sub-stages) has a skill reference or explicit "template/manual" note → pass; any stage missing → fail
  - VC-02: Routing accuracy — each stage skill reference matches the actual skill directory name → pass; typo or mismatch → fail
  - VC-03: Fact-find routing — lp-fact-find progressive routing table includes entries for all new execution skills → pass; missing entries → fail
  - VC-04: Non-regression — S7/S8/S9 routing unchanged → pass; modified → fail
  - Validation type: review checklist + grep verification
  - Run/verify: `grep -c "lp-readiness\|lp-forecast\|lp-prioritize\|lp-offer\|lp-measure\|lp-experiment\|lp-channels\|lp-seo\|lp-launch-qa\|lp-design-qa\|lp-site-upgrade" .claude/skills/startup-loop/SKILL.md` should return ≥11
- **Execution plan:** Red → Green → Refactor (VC-first fail-first loop)
  - Red: verify current startup-loop doesn't reference new skills; verify lp-fact-find routing table lacks new entries
  - Green: add all stage references and routing entries; verify VCs pass
  - Refactor: ensure stage descriptions are concise and consistent; re-verify
- **What would make this ≥90%:** Run `/startup-loop status --business HEAD` and verify all stages show green skill coverage
- **Rollout / rollback:** Edit existing files / git revert
- **Documentation impact:** `docs/business-os/startup-loop-workflow.user.md` should be updated to reflect v2 stage map with new skills

---

## Risks & Mitigations

- **Startup lp-* skills too similar to idea-* equivalents:** Each startup stage skill has a mandatory "Differs from idea-*" section with ≥3 concrete differences. DS-08 checkpoint validates differentiation.
- **lp-seo too broad for one skill:** Phased design with explicit `/lp-seo <phase>` invocation. Deferred list includes "SEO separate skills" trigger if phases prove unwieldy.
- **11 new skills is too many before next loop run:** DS-08 checkpoint after 7 skills. Distribution spine (DS-09–DS-11) and launch QA (DS-12–DS-13) can be deferred past checkpoint if core spine validates.
- **startup-loop orchestrator update introduces routing errors:** DS-16 is last task, all skills verified first. grep-based validation catches typos. Non-regression check preserves S7/S8/S9.
- **Skill quality is untestable during build:** Each skill has a Quality Checks section for self-audit. Post-build validation plan: run each skill once on a real business.

## Observability

- Logging: git commits per task for traceability
- Metrics: count of skills with all required sections (target: 11/11)
- Alerts/Dashboards: `/startup-loop status` shows stage coverage after DS-16

## Acceptance Criteria (overall)

- [ ] 1 rename complete: `site-upgrade` → `lp-site-upgrade` with zero broken references
- [ ] 11 new skills created, each with: Operating Mode, Inputs, Workflow, Output Contract, Quality Checks
- [ ] 3 startup stage skills each have "Differs from idea-*" section with ≥3 differences
- [ ] 3 existing skills extended: review-critique (offer schema), draft-marketing (brief mode), draft-email (sequence mode)
- [ ] startup-loop orchestrator references all new lp-* stage skills
- [ ] lp-fact-find routing table includes new execution skills
- [ ] `/startup-loop status` shows skill coverage for all stages S0–S10
- [ ] idea-* family completely untouched

## Decision Log

- 2026-02-13: idea-* skills kept as separate system for established businesses (user decision). Startup loop gets its own lp-readiness, lp-forecast, lp-prioritize instead of renaming idea-* skills.
- 2026-02-13: Build priority follows stage order (S1 → S1B → S2B → S3 → S5 → S6 → S6B → S9B → S10) per fact-find default.
- 2026-02-13: `startup-loop` orchestrator keeps its name (not renamed to `lp-startup-loop`) — it's the loop itself, not a step.
- 2026-02-13: ~40 proposed new skills consolidated to 11 new + 1 rename + 3 extensions. 7 deferred with documented triggers.
