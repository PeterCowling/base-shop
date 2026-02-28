---
Type: Plan
Status: Archived
Domain: BOS
Workstream: Operations
Created: 2026-02-26
Last-reviewed: 2026-02-26
Last-updated: 2026-02-26
Build-progress: All tasks complete. CHECKPOINT-A passed. Plan complete.
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: lp-do-worldclass
Deliverable-Type: doc
Startup-Deliverable-Alias: none
Execution-Track: business-artifact
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas
Overall-confidence: 83%
Confidence-Method: min(Implementation,Approach,Impact); effort-weighted average S=1,M=2,L=3
Auto-Build-Intent: plan-only
---

# lp-do-worldclass Plan

## Summary

`/lp-do-worldclass` is a new startup-loop skill that measures a business against a user-defined world-class benchmark and routes gaps into the existing idea pipeline. The operator defines a singular goal as a persistent YAML/markdown artifact per business. From that goal the skill generates a structured deep-research prompt; the operator runs that prompt externally and pastes the resulting benchmark document back. The skill then scans all available data sources — repo artifacts, Stripe, GA4, Firebase, Octorate — comparing current state against the benchmark, asks the user to confirm any uncertain data sources, and formulates each identified gap as an `operator_idea` dispatch for `lp-do-ideas` (auto-executing `fact_find_ready` dispatches immediately). The skill is entirely markdown; no code changes are required.

## Active tasks
- [x] TASK-01: SKILL.md orchestrator
- [x] TASK-02: worldclass-goal.template.md
- [x] TASK-03: modules/goal-phase.md
- [x] TASK-04: modules/scan-phase.md
- [x] TASK-05: modules/ideas-phase.md
- [x] CHECKPOINT-A: consistency gate

## Goals
- Provide a structured path from "operator states a goal" to "dispatch packets in the idea queue comparing current state to world class"
- Keep the benchmark generation external (deep research prompt, not in-skill reasoning) so the benchmark is authoritative rather than hallucinated
- Reuse the existing `lp-do-ideas` intake pipeline for all gap dispatches — no new dispatch format
- Make the goal artifact durable and reusable; regenerate the research prompt when the goal changes

## Non-goals
- Running deep research itself — the skill produces the prompt; the operator runs it externally and pastes back the result
- Replacing `lp-coverage-scan` — this skill measures quality gap to world class; coverage-scan measures existence gap
- Automating benchmark updates — the benchmark is a static artifact; the operator controls when it is refreshed

## Constraints & Assumptions
- Constraints:
  - Goal artifact and benchmark artifact must be manually maintained by the operator
  - Benchmark artifact path is `docs/business-os/strategy/<BIZ>/worldclass-benchmark.md` — must exist for scan phase to run
  - All gap dispatches must conform to `dispatch.v1` schema (`docs/business-os/startup-loop/ideas/lp-do-ideas-dispatch.schema.json`)
  - Skill is agent-only markdown files — no TypeScript or compiled artifacts
- Assumptions:
  - MCP tools (Stripe, Firebase, GA4, Octorate via `mcp__base-shop__*`) are available for data source probing where credentials/config are present for the business
  - `lp-do-ideas` auto-execute policy applies: `fact_find_ready` dispatches are auto-executed without stopping for operator approval

## Inherited Outcome Contract

- **Why:** Current quality audits and coverage scans detect what exists vs what should exist, but neither asks "how far below world class are we and where?" — the gap between current state and best-in-class is invisible until reality forces a reaction. A benchmark-driven skill makes that gap explicit, actionable, and routed into the planning pipeline automatically.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `/lp-do-worldclass --biz <BIZ>` can be invoked for any business with a goal artifact and benchmark, producing dispatch packets for all identified world-class gaps and routing them into `lp-do-ideas`.
- **Source:** operator

## Fact-Find Reference
- Related brief: None (direct-inject from operator conversation 2026-02-26)
- Key findings used:
  - Operator design: goal = persistent artifact; benchmark = output of external deep research prompt; gaps = operator-idea dispatches to lp-do-ideas
  - lp-coverage-scan modules (scan-phase.md, emit-phase.md) are the reference implementation pattern
  - dispatch.v1 schema confirmed at `docs/business-os/startup-loop/ideas/lp-do-ideas-dispatch.schema.json`
  - lp-do-ideas operator-idea intake: `trigger: operator_idea`; `artifact_id`/`before_sha`/`after_sha` omitted; `evidence_refs` uses `operator-stated:` format

## Proposed Approach

**Chosen approach:** Four-phase state machine with persistent goal artifact and external deep-research handoff.

State machine routing (auto-routed by SKILL.md based on artifact presence):
1. **No goal artifact** → stop; emit guidance to create `worldclass-goal.md` from template
2. **Goal exists, no benchmark** → run goal-phase (validate + generate/refresh research prompt) → stop; emit instructions to run prompt and paste result as `worldclass-benchmark.md`
3. **Goal + benchmark exist + benchmark aligned** (`benchmark.goal_version == goal.goal_version`) → run goal-phase validation → run scan-phase → run ideas-phase → emit summary
4. **Goal + benchmark exist but benchmark stale** (`benchmark.goal_version != goal.goal_version`) → stop; emit instructions to rerun deep research with refreshed prompt and replace `worldclass-benchmark.md`

The research prompt must be regenerated when the goal artifact's `goal_version` field is bumped, ensuring the benchmark stays aligned with the current goal.

## Plan Gates
- Foundation Gate: Pass (direct-inject with clear operator requirements; no fact-find needed)
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No (plan-only mode; --notauto passed)

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | SKILL.md orchestrator | 85% | S | Complete (2026-02-26) | - | TASK-03 |
| TASK-02 | IMPLEMENT | worldclass-goal.template.md | 90% | S | Complete (2026-02-26) | - | TASK-03 |
| TASK-03 | IMPLEMENT | modules/goal-phase.md | 80% | M | Complete (2026-02-26) | TASK-01, TASK-02 | TASK-04, TASK-05 |
| TASK-04 | IMPLEMENT | modules/scan-phase.md | 80% | L | Complete (2026-02-26) | TASK-03 | CHECKPOINT-A |
| TASK-05 | IMPLEMENT | modules/ideas-phase.md | 80% | M | Complete (2026-02-26) | TASK-03 | CHECKPOINT-A |
| CHECKPOINT-A | CHECKPOINT | Consistency gate | 95% | S | Complete (2026-02-26) | TASK-04, TASK-05 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | - | Parallel: orchestrator + goal template are independent |
| 2 | TASK-03 | TASK-01, TASK-02 complete | Sequential: goal-phase reads both |
| 3 | TASK-04, TASK-05 | TASK-03 complete | Parallel: scan and ideas phases are independent |
| 4 | CHECKPOINT-A | TASK-04, TASK-05 complete | Consistency review across all 4 modules |

## Tasks

---

### TASK-01: SKILL.md orchestrator
- **Type:** IMPLEMENT
- **Deliverable:** `.claude/skills/lp-do-worldclass/SKILL.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Artifact-Destination:** `.claude/skills/lp-do-worldclass/SKILL.md`
- **Reviewer:** operator
- **Approval-Evidence:** None: skill is operator-invoked; correctness verified by CHECKPOINT-A
- **Build evidence:** `.claude/skills/lp-do-worldclass/SKILL.md` written. VC-01 pass (frontmatter name field). VC-02 pass (all 4 states: no-goal, goal-no-benchmark, goal+benchmark-aligned, goal+benchmark-stale). VC-03 pass (all 3 module paths referenced). VC-04 pass (preflight error strings for missing --biz and missing strategy dir). Wave 1 parallel dispatch.
- **Measurement-Readiness:** None: skill is operational tooling
- **Affects:** `.claude/skills/lp-do-worldclass/SKILL.md`
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** 85%
  - Implementation: 85% — modeled on lp-coverage-scan/SKILL.md; pattern well understood
  - Approach: 90% — state machine routing is designed; module names finalised
  - Impact: 85% — all downstream modules depend on this; if routing logic is wrong, all modules misbehave
- **Acceptance:**
  - Frontmatter: `name: lp-do-worldclass`
  - Invocation signature documented: `--biz <BIZ> [--as-of-date <YYYY-MM-DD>] [--dry-run]`
  - State machine routing table present with all 4 states (no-goal, goal-no-benchmark, goal+benchmark-aligned, goal+benchmark-stale)
  - Module routing table: goal-phase → scan-phase → ideas-phase
  - Preflight gate: error messages for missing `--biz`, missing strategy directory
  - Output paths documented: gap report, queue dispatches
  - Dry-run behaviour documented
- **Validation contract:**
  - VC-TIMEBOX: Execute all VC checks in the same implementation session, within 30 minutes of drafting the artifact, using one full read-through of the produced artifact as the minimum sample; log pass/fail per VC in task notes.
  - VC-01: Frontmatter present with `name: lp-do-worldclass` → pass if frontmatter block contains name field
  - VC-02: All 4 state-machine states present and correctly routed → pass if document contains all four routing branches
  - VC-03: All module paths present (`modules/goal-phase.md`, `modules/scan-phase.md`, `modules/ideas-phase.md`) → pass if all three referenced by name
  - VC-04: Preflight gate with correct error messages → pass if error strings documented
- **Execution plan:** Red → Green → Refactor (VC-first)
  - Red evidence plan: document reading confirms no SKILL.md exists at path yet
  - Green evidence plan: write SKILL.md; verify all VC checks pass by document review
  - Refactor evidence plan: ensure module paths and state-machine branches are self-consistent with TASK-03/04/05 output paths
- **Planning validation:** None required (S effort)
- **Scouts:** None: pattern directly inherited from lp-coverage-scan/SKILL.md
- **Edge Cases & Hardening:**
  - If `--biz` is missing: fail-closed with guidance
  - If strategy directory exists but goal artifact is absent: route to state 1 (not state 3), even if benchmark exists orphaned
  - Dry-run: scan runs; gap report written; no queue writes
- **What would make this >=90%:**
  - After TASK-03/04/05 are written, run lp-do-factcheck to confirm all referenced module paths and output paths exist
- **Rollout / rollback:** None: new skill; no existing callers
- **Documentation impact:** Update `.claude/skills/lp-do-worldclass/SKILL.md` description field for skill registry
- **Notes / references:**
  - Reference: `.claude/skills/lp-coverage-scan/SKILL.md` (pattern source)
  - State machine: state determined by file-existence checks at runtime, not by a stored state field

---

### TASK-02: worldclass-goal.template.md
- **Type:** IMPLEMENT
- **Deliverable:** `docs/plans/lp-do-worldclass/worldclass-goal.template.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Artifact-Destination:** `docs/plans/lp-do-worldclass/worldclass-goal.template.md` (template; per-business copies go to `docs/business-os/strategy/<BIZ>/worldclass-goal.md`)
- **Build evidence:** `docs/plans/lp-do-worldclass/worldclass-goal.template.md` written. VC-01 pass (all 8 fields with inline comments: schema_version, business, goal_version, singular-goal, domains, constraints, created, last-updated, benchmark-status). VC-02 pass (all 3 benchmark-status enum values documented). VC-03 pass (BRIK example block complete with 3 domains and full constraints). goal_version bump requirement documented in plain English. Blank operator template section included.
- **Reviewer:** operator
- **Approval-Evidence:** None: operator will use the template to create the first BRIK goal artifact
- **Measurement-Readiness:** None
- **Affects:** `docs/plans/lp-do-worldclass/worldclass-goal.template.md`
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** 90%
  - Implementation: 90% — simple YAML/markdown template; fields are well-defined from design
  - Approach: 90% — structure is clear; no ambiguity in field semantics
  - Impact: 90% — goal-phase reads this schema; if fields are missing, goal-phase can't parse
- **Acceptance:**
  - `schema_version: worldclass-goal.v1` frontmatter field present
  - Required fields: `business`, `goal_version`, `singular-goal`, `domains`, `constraints`, `created`, `last-updated`, `benchmark-status`
  - `benchmark-status` enum: `none | research-prompt-ready | benchmark-ready`
  - `domains` list: at minimum 1 entry with sub-fields `name`, `context`, `examples`
  - Commented instructions for each field
  - Example block showing a completed BRIK goal entry
- **Validation contract:**
  - VC-TIMEBOX: Execute all VC checks in the same implementation session, within 30 minutes of drafting the artifact, using one full read-through of the produced artifact as the minimum sample; log pass/fail per VC in task notes.
  - VC-01: All required fields present with comments → pass if all 8 fields documented with inline comment
  - VC-02: `benchmark-status` enum values documented → pass if all 3 values present
  - VC-03: At least one completed example entry → pass if example block is non-empty
- **Execution plan:** Red → Green → Refactor
  - Red: no template file exists at path yet
  - Green: write template with all required fields + example
  - Refactor: ensure field names are valid YAML identifiers, comments are clear to a non-technical operator
- **Planning validation:** None required (S effort)
- **Scouts:** None: no codebase dependencies; pure new artifact
- **Edge Cases & Hardening:**
  - `goal_version` must be bumped manually when the goal changes — document this requirement clearly in template comments
  - `domains` list must contain at least 1 entry; if operator wants broad inference, include a catch-all domain entry (for example `Operations`) instead of leaving the list empty
- **What would make this >=90%:** Already at 90%. Held-back test: no single unknown would drop below 90 — template format is entirely within our control.
- **Rollout / rollback:** None: new file; no existing dependents
- **Documentation impact:** Template instructions must make `goal_version` bump requirement explicit

---

### TASK-03: modules/goal-phase.md
- **Type:** IMPLEMENT
- **Deliverable:** `.claude/skills/lp-do-worldclass/modules/goal-phase.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-26)
- **Artifact-Destination:** `.claude/skills/lp-do-worldclass/modules/goal-phase.md`
- **Build evidence:** Module written. VC-01 pass (Step 1 absent-goal stops with State 1 message referencing template path). VC-02 pass (Step 2 regeneration triggers on goal_version mismatch). VC-03 pass (all 5 research prompt sections a–e present). VC-04 pass (benchmark format spec: schema_version worldclass-benchmark.v1, goal_version, generated_at, domains[{id,name}], heading ## [domain_id] Domain Name, all 4 subsections). VC-05 pass (Step 5 covers missing/stale/just-regenerated stop conditions).
- **Reviewer:** operator
- **Approval-Evidence:** None: verified by CHECKPOINT-A
- **Measurement-Readiness:** None
- **Affects:** `.claude/skills/lp-do-worldclass/modules/goal-phase.md`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-04, TASK-05
- **Confidence:** 80%
  - Implementation: 80% — logic is clear (read goal → validate → generate prompt if needed → stop or continue); the deep-research prompt template is the uncertain element
  - Approach: 85% — two-sub-phase design (validate goal + generate prompt) is sound
  - Impact: 80% — research prompt quality directly determines benchmark quality; if prompt is thin, benchmark is thin
- **Acceptance:**
  - Step 1: Read and validate goal artifact; if absent, emit creation guidance and stop
  - Step 2: Check `goal_version` vs last research-prompt version (embedded in prompt file frontmatter); if mismatched or prompt absent, regenerate
  - Step 3: Research prompt generation — structured prompt covering: (a) business context, (b) singular goal verbatim, (c) domain-by-domain what world class looks like instructions, (d) required output format specification for benchmark artifact, (e) reference competitor/exemplar sources to investigate
  - Step 4: Write/overwrite `docs/business-os/strategy/<BIZ>/worldclass-research-prompt.md`; update `benchmark-status` to `research-prompt-ready` in goal artifact
  - Step 5: If benchmark exists and both checks pass (`goal_version == prompt.goal_version` and `benchmark.goal_version == goal.goal_version`) → continue to scan phase; else stop with instructions to run prompt and refresh benchmark artifact
  - Output format specification for benchmark: `worldclass-benchmark.md` must include frontmatter `schema_version: worldclass-benchmark.v1`, `business`, `goal_version`, `generated_at`, and `domains: [{id,name}]`; each domain section heading must use `## [<domain_id>] <Domain Name>` and contain `### Current Best Practice`, `### Exemplars`, `### Key Indicators`, `### Minimum Threshold`
- **Validation contract:**
  - VC-TIMEBOX: Execute all VC checks in the same implementation session, within 30 minutes of drafting the artifact, using one full read-through of the produced artifact as the minimum sample; log pass/fail per VC in task notes.
  - VC-01: Step 1 absent-goal path → stops with guidance message containing template path
  - VC-02: Step 2 version-check logic → if `goal_version` ≠ `prompt.goal_version`, prompt is regenerated (not reused)
  - VC-03: Research prompt has all 5 required sections (a–e) → pass if all sections present in generated prompt
  - VC-04: Benchmark artifact output format specification complete → benchmark frontmatter includes `schema_version`, `business`, `goal_version`, `generated_at`, `domains[{id,name}]` and sections use `## [<domain_id>] <Domain Name>` with all 4 required subsections
  - VC-05: Step 5 stop condition → stops cleanly with operator instructions when benchmark is absent, stale, or `goal_version`-mismatched
- **Execution plan:** Red → Green → Refactor
  - Red: no module file exists at path
  - Green: write module with all 5 steps; verify all VCs pass by document review
  - Refactor: ensure research prompt template in the module is rich enough to produce a usable benchmark (includes exemplar instructions, output format, competitive framing)
- **Planning validation:** Reviewed lp-coverage-scan/modules/emit-phase.md for module structure patterns; confirmed module format (numbered steps, tables, input/output declarations)
- **Scouts:** None: no external dependencies to probe
- **Edge Cases & Hardening:**
  - `goal_version` field missing from existing goal artifact: treat as version `0`; force prompt regeneration
  - Benchmark artifact exists but is empty: treat as absent; regenerate prompt and stop
  - Multiple domain entries: prompt must iterate all domains explicitly, not summarise generically
- **What would make this >=90%:**
  - After TASK-03 written: test the research prompt template against BRIK goal (manually verify it produces a usable benchmark when run against a real deep-research tool)
- **Rollout / rollback:** None: new module; no existing callers

---

### TASK-04: modules/scan-phase.md
- **Type:** IMPLEMENT
- **Deliverable:** `.claude/skills/lp-do-worldclass/modules/scan-phase.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Complete (2026-02-26)
- **Artifact-Destination:** `.claude/skills/lp-do-worldclass/modules/scan-phase.md`
- **Build evidence:** Module written. VC-01 pass (all 5 data source categories present: repo Step 2a, Stripe Step 2b with `mcp__brikette__product_stats`, GA4 Step 2c with `G-[A-Z0-9]{8,12}` grep pattern, Firebase Step 2d with `.firebaserc`/`firebase.json`, Octorate Step 2e with `apps/reception/` grep). VC-02 pass (Step 3 uncertain handling: "pause and ask the operator a structured question before proceeding. Do not assume accessibility. Do not skip silently" — example questions per source, yes/no/skip response handling). VC-03 pass (Step 6 gap table has 7 columns: Domain | Gap | Current State | Threshold | Gap Classification | Evidence Source | Notes; one-row-per-gap rule explicit). VC-04 pass (Step 5 rubric documents `no-data` classification for sources not-configured or skipped and no repo evidence). VC-05 pass (Step 6 output path `docs/business-os/strategy/<BIZ>/worldclass-scan-<YYYY-MM-DD>.md` matches ideas-phase Step 1 input declaration). Wave 3 parallel dispatch.
- **Reviewer:** operator
- **Approval-Evidence:** None: verified by CHECKPOINT-A
- **Measurement-Readiness:** None
- **Affects:** `.claude/skills/lp-do-worldclass/modules/scan-phase.md`
- **Depends on:** TASK-03
- **Blocks:** CHECKPOINT-A
- **Confidence:** 80%
  - Implementation: 80% — data source checks and comparison logic are well understood; the "ask user about uncertain sources" interactive step adds implementation surface area
  - Approach: 80% — comparing benchmark sections to current state is a reasoning task; the module must give the agent enough structure to do this consistently
  - Impact: 85% — this is the primary value-delivery step; if it misses a gap, no dispatch is emitted
- **Acceptance:**
  - Step 1: Read benchmark artifact; validate `schema_version: worldclass-benchmark.v1`; parse `## [<domain_id>] <Domain Name>` sections; extract `### Minimum Threshold` and `### Key Indicators` for each domain
  - Step 2: Enumerate data sources to probe. Fixed list: (a) repo — strategy docs, website pages/code, content files; (b) Stripe — via `mcp__base-shop__product_stats` or `mcp__base-shop__order_list`; (c) GA4 — via GA4 measurement ID in strategy docs or BOS API docs; (d) Firebase — via `.firebaserc`, `firebase.json`, or `mcp__base-shop__*` tools where available; (e) Octorate — via `apps/reception/` references or `mcp__base-shop__octorate_*` tools where available
  - Step 3: For each data source, determine status: `configured` | `not-configured` | `uncertain`. For `uncertain`: ask the operator one structured prompt requesting config evidence (for example ID/path/reference) before proceeding. Do not assume; do not skip.
  - Step 4: For each benchmark domain, scan available sources for current-state evidence. Produce a current-state summary per domain (what exists, where found, quality assessment against key indicators)
  - Step 5: Compare current-state summary to benchmark thresholds per domain. Classify gap: `world-class` (meets or exceeds threshold) | `major-gap` (material distance from threshold) | `minor-gap` (close, incremental improvement needed) | `no-data` (cannot assess — data source missing or uncertain)
  - Step 6: Write gap comparison table to scan output file `docs/business-os/strategy/<BIZ>/worldclass-scan-<YYYY-MM-DD>.md`. Table columns: Domain | Gap | Current State | Threshold | Gap Classification | Evidence Source | Notes. Rule: one row per gap (one indicator or one discrete benchmark requirement). If file exists for same `<YYYY-MM-DD>`, overwrite by default.
  - Step 7: Pass gap table to ideas-phase
- **Validation contract:**
  - VC-TIMEBOX: Execute all VC checks in the same implementation session, within 30 minutes of drafting the artifact, using one full read-through of the produced artifact as the minimum sample; log pass/fail per VC in task notes.
  - VC-01: All 5 data source categories probed (repo, Stripe, GA4, Firebase, Octorate) → pass if all 5 appear in module steps
  - VC-02: Uncertain data source handling → ask-user branch documented for `uncertain` status; never assumed or skipped
  - VC-03: Gap classification table has all 7 columns and one-row-per-gap rule → pass if table spec includes `Gap` and explicit per-gap row rule
  - VC-04: `no-data` classification documented for missing/uncertain sources → pass if `no-data` appears in classification rubric
  - VC-05: Scan output path matches SKILL.md declaration → `worldclass-scan-<YYYY-MM-DD>.md` at `docs/business-os/strategy/<BIZ>/`
- **Execution plan:** Red → Green → Refactor
  - Red: no module file exists; TASK-03 complete provides goal-phase output contract
  - Green: write module with all 7 steps; verify all VCs pass
  - Refactor: ensure data source probe instructions are specific enough (MCP tool names, file patterns) that the agent can execute without guessing
- **Planning validation:** Reviewed lp-coverage-scan/modules/scan-phase.md steps 1–4; confirmed MCP tool names from system context; confirmed repo paths for Firebase/GA4/Octorate detection
- **Scouts:** MCP namespace and tool families validated against available tool contracts (`mcp__base-shop__product_stats`, `mcp__base-shop__order_list`, `mcp__base-shop__shop_health`, `mcp__base-shop__octorate_*`); repo path probes for Octorate references confirmed via `apps/reception/`
- **Edge Cases & Hardening:**
  - All data sources uncertain: emit gap table with all rows classified `no-data`; proceed to ideas-phase (these become gaps too — "cannot assess coverage" is itself an actionable gap)
  - Benchmark domain has no matching current-state evidence in any source: classify `major-gap`, not `no-data`, if the artifact category is clearly absent from repo (absence of evidence is evidence of absence for repo artifacts)
  - `major-gap` vs `minor-gap` rubric must be explicit — avoid leaving classification to agent discretion; provide anchors (e.g. imagery: major-gap if no professional photography, minor-gap if professional but not per-room)
- **What would make this >=90%:**
  - After writing: run a dry-run simulation against BRIK (similar to what we did for lp-coverage-scan) to confirm the comparison logic produces the correct gap classifications for the website imagery and room-funnel examples
- **Rollout / rollback:** None: new module

---

### TASK-05: modules/ideas-phase.md
- **Type:** IMPLEMENT
- **Deliverable:** `.claude/skills/lp-do-worldclass/modules/ideas-phase.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-26)
- **Artifact-Destination:** `.claude/skills/lp-do-worldclass/modules/ideas-phase.md`
- **Build evidence:** Module written. VC-01 pass (Pattern A "External evidence / artifact creation" and Pattern B "Current state vs world-class" both present with distinct current_truth and next_scope_now templates; unambiguous decision rule: Evidence Source containing repo-relative path prefix → Pattern B, otherwise → Pattern A). VC-02 pass (field checklist explicit: 14 core dispatch.v1 fields + 4 operator-idea routing fields (business, trigger, current_truth, next_scope_now) + 3 additional fields (priority, created_at, queue_state) = 21 fields total). VC-03 pass (decomposition rule: "One dispatch per gap row. Never aggregate multiple gap rows into one dispatch"; deterministic key formulas block covers anchor_key, cluster_key, cluster_fingerprint, root_event_id, dispatch_id with sha256 computation documented). VC-04 pass (Priority Mapping Table VC-04: P1 major-gap conversion-critical, P2 major-gap other + no-data, P3 minor-gap; conversion-critical domain identification rule explicit). VC-05 pass (Section "no-data gap handling (VC-05)" provides specific templates for current_truth and next_scope_now, plus priority P2, deliverable_family business-artifact, route lp-do-fact-find). Wave 3 parallel dispatch.
- **Reviewer:** operator
- **Approval-Evidence:** None: verified by CHECKPOINT-A
- **Measurement-Readiness:** None
- **Affects:** `.claude/skills/lp-do-worldclass/modules/ideas-phase.md`
- **Depends on:** TASK-03
- **Blocks:** CHECKPOINT-A
- **Confidence:** 80%
  - Implementation: 85% — dispatch.v1 schema is fully known; lp-do-ideas operator-idea intake is well-documented
  - Approach: 80% — the two gap idea patterns (external evidence + current-state vs world-class) need explicit templates in the module to avoid agent drift
  - Impact: 80% — if dispatch fields are wrong, lp-do-ideas will fail to enqueue; dispatch must be valid against schema
- **Acceptance:**
  - Step 1: Read gap table from scan-phase output
  - Step 2: For each `major-gap` or `minor-gap` row, determine idea pattern:
    - Pattern A (external evidence): gap is a domain/practice BRIK doesn't have and can't assess from existing artifacts — "Not in repo: we need to do X — create/update artifact Y"
    - Pattern B (current-state vs world-class): existing artifact documents current state A; benchmark threshold is Z — "According to [artifact], current state is A; world class is Z; do F, G, H to close gap"
  - Step 3: For each gap row, formulate an `operator_idea` dispatch with:
    - `schema_version: dispatch.v1`, `mode: trial`, `business: <BIZ>`, `trigger: operator_idea`
    - `area_anchor`: ≤12 words, format `"<BIZ> <domain/area> — <gap in one clause>"`
    - `location_anchors`: at least one concrete path/flow anchor tied to the gap row evidence
    - `root_event_id`, `anchor_key`, `cluster_key`, `cluster_fingerprint`, `lineage_depth` populated deterministically per schema using:
      - `anchor_key = "<BIZ>::worldclass::<domain_id>::<gap_slug>"`
      - `cluster_key = "<BIZ>::worldclass::<domain_id>"`
      - `cluster_fingerprint = sha256(cluster_key + "::" + goal_version)`
      - `root_event_id = sha256(anchor_key + "::" + scan_date)`
      - `lineage_depth = 0` for root dispatches
    - `current_truth`: plain-language current state (from gap table evidence)
    - `next_scope_now`: what to investigate/action
    - `recommended_route` and `status` set by routing logic (`fact_find_ready` or `briefing_ready`; `logged_no_action` only when row is non-actionable by policy)
    - `evidence_refs`: `["operator-stated: worldclass-scan gap: <domain>", "docs/business-os/strategy/<BIZ>/worldclass-scan-<date>.md"]`
    - `priority`: P1 for major-gap in conversion-critical domain; P2 for major-gap other; P3 for minor-gap
    - `provisional_deliverable_family`: appropriate for gap type
    - `dispatch_id` and `created_at` populated by queue layer or module deterministic builder before enqueue
  - Step 4: One dispatch per gap row — decomposition rule: never aggregate multiple gaps into one dispatch
  - Step 5: Pass each dispatch to `lp-do-ideas` operator-idea intake (auto-execute policy applies: `fact_find_ready` dispatches are invoked immediately)
  - Step 6: Write summary to scan output file: `N dispatches emitted; M auto-executed; P deferred`
- **Validation contract:**
  - VC-TIMEBOX: Execute all VC checks in the same implementation session, within 30 minutes of drafting the artifact, using one full read-through of the produced artifact as the minimum sample; log pass/fail per VC in task notes.
  - VC-01: Pattern A and Pattern B templates both documented → pass if both appear in module with distinct template text
  - VC-02: Dispatch template includes all schema-required fields (`schema_version`, `dispatch_id`, `mode`, `root_event_id`, `anchor_key`, `cluster_key`, `cluster_fingerprint`, `lineage_depth`, `area_anchor`, `location_anchors`, `provisional_deliverable_family`, `recommended_route`, `status`, `evidence_refs`) plus operator-idea routing fields (`business`, `trigger`, `current_truth`, `next_scope_now`) → pass if checklist is explicit and complete
  - VC-03: Decomposition + determinism documented → one dispatch per gap row and deterministic key formulas are explicitly specified
  - VC-04: Priority mapping table → P1/P2/P3 rules documented per gap classification × domain type
  - VC-05: `no-data` rows → documented handling (emit dispatch for "cannot assess — data source needed" as a P2 gap)
- **Execution plan:** Red → Green → Refactor
  - Red: no module file exists; gap table schema from TASK-04 is the input contract
  - Green: write module with all 6 steps; verify all VCs pass
  - Refactor: ensure Pattern A and Pattern B templates are concrete enough that an agent produces consistent dispatch text without freestyle interpretation
- **Planning validation:** Reviewed dispatch.v1 schema required fields; confirmed `operator_idea` trigger fields (no `artifact_id`/`before_sha`/`after_sha`); confirmed lp-do-ideas operator-idea intake format from skill docs
- **Scouts:** Confirmed `dispatch.v1` required fields: `schema_version`, `dispatch_id`, `mode`, `root_event_id`, `anchor_key`, `cluster_key`, `cluster_fingerprint`, `lineage_depth`, `area_anchor`, `location_anchors`, `provisional_deliverable_family`, `recommended_route`, `status`, `evidence_refs`
- **Edge Cases & Hardening:**
  - `no-data` rows: emit a P2 dispatch — "Cannot assess <domain>: <data source> not confirmed available" — so the gap in data visibility itself becomes a tracked work item
  - Dispatch decomposition: if a single domain has 3 distinct gaps (e.g., imagery + room pages + booking flow), emit 3 dispatches, not 1 aggregate
  - Dry-run: dispatch list written to gap report; no lp-do-ideas invocation
- **What would make this >=90%:**
  - Verify Pattern A and Pattern B templates produce dispatches indistinguishable from hand-crafted operator-idea dispatches when reviewed against existing queue-state.json entries
- **Rollout / rollback:** None: new module; no existing callers

---

### CHECKPOINT-A: Consistency gate
- **Type:** CHECKPOINT
- **Deliverable:** Updated plan evidence via /lp-do-replan
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Build evidence:** All 4 consistency checks pass. (1) Module file paths in SKILL.md (`modules/goal-phase.md`, `modules/scan-phase.md`, `modules/ideas-phase.md`) match actual files at `.claude/skills/lp-do-worldclass/modules/`. (2) Output artifact paths consistent: research-prompt at `docs/business-os/strategy/<BIZ>/worldclass-research-prompt.md`, scan output at `docs/business-os/strategy/<BIZ>/worldclass-scan-<YYYY-MM-DD>.md`, queue at `docs/business-os/startup-loop/ideas/trial/queue-state.json` — all matching across SKILL.md → goal-phase → scan-phase → ideas-phase inputs. (3) Goal artifact field names consistent: `goal_version`, `benchmark-status`, `singular-goal`, `last-updated`, `domains[{name,context,examples}]` identical in template (TASK-02) and goal-phase validation table (TASK-03). (4) dispatch.v1 fields consistent: all 14 required core fields present; operator-idea routing correct (`trigger: operator_idea`, artifact_id/before_sha/after_sha omitted); queue append format `"dispatches"` array matches live queue format. No inconsistencies — no replan required.
- **Affects:** `docs/plans/lp-do-worldclass/plan.md`
- **Depends on:** TASK-04, TASK-05
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% — process is defined
  - Approach: 95% — prevents inconsistent module contracts reaching production
  - Impact: 95% — controls cross-module consistency risk
- **Acceptance:**
  - `/lp-do-build` checkpoint executor run
  - All 4-point consistency checks pass:
    1. Module file paths in SKILL.md match actual module file names
    2. Output artifact paths consistent across SKILL.md, goal-phase, scan-phase (gap report path, queue path, research prompt path)
    3. Goal artifact field names consistent between template (TASK-02) and goal-phase (TASK-03) — `goal_version`, `benchmark-status`, `domains` list
    4. `dispatch.v1` field usage in ideas-phase consistent with schema
  - Any inconsistency found: route to /lp-do-replan for affected task(s)
- **Horizon assumptions to validate:**
  - Goal-phase output format (research prompt + benchmark spec) is sufficiently precise for scan-phase to read
  - Ideas-phase dispatch templates are complete against dispatch.v1 schema
- **Validation contract:**
  - VC-TIMEBOX: Execute checkpoint cross-reference checks in one pass within 30 minutes after TASK-04/TASK-05 completion; minimum sample is one full read-through of SKILL.md plus all three module files.
  - VC-01: All 4 consistency checks pass by document cross-reference
- **Planning validation:** None: process task
- **Rollout / rollback:** None: planning control task
- **Documentation impact:** Plan updated with checkpoint evidence

---

## Risks & Mitigations
- **Research prompt quality risk**: If the generated prompt is too generic, deep research returns generic advice. Mitigation: goal-phase includes domain-specific exemplar instructions and competitor framing; operator reviews prompt before running.
- **Benchmark artifact staleness**: If goal changes but benchmark is not refreshed, scan compares against wrong target. Mitigation: `goal_version` bump triggers prompt regeneration and explicit benchmark-version gate blocks scan until refreshed benchmark is pasted.
- **Dispatch over-emission**: A single broad gap could flood the queue with low-quality dispatches. Mitigation: decomposition rule + priority filtering (only `major-gap` and `minor-gap` emit; `world-class` is silent).
- **Uncertain data sources blocking scan**: If all sources are uncertain, scan produces all `no-data`. Mitigation: `no-data` itself becomes a dispatchable gap, so the scan is never a dead end.

## Observability
- None: skill is markdown-only; outputs are file artifacts and queue dispatches observable directly

## Acceptance Criteria (overall)
- [ ] `/lp-do-worldclass --biz BRIK` with a populated goal + benchmark emits one dispatch per actionable gap row (`major-gap`, `minor-gap`, and `no-data`) and writes those packets to queue-state.json
- [ ] Research prompt generated for BRIK contains domain-specific competitive framing (not generic hospitality advice)
- [ ] CHECKPOINT-A: all 4 consistency checks pass
- [ ] All dispatch packets validate against `dispatch.v1` schema

## Decision Log
- 2026-02-26: Goal is a persistent artifact (not a CLI flag) — operator authored, durable, reusable across invocations
- 2026-02-26: Benchmark generation is external — skill produces deep-research prompt; operator runs it and pastes result back
- 2026-02-26: Gaps route to lp-do-ideas (operator-idea intake) — no new dispatch format; reuse existing pipeline
- 2026-02-26: Skill name: lp-do-worldclass (peer-level to lp-coverage-scan, not a sub-module)
- 2026-02-26: Plan-only mode (--notauto) — operator to review before build

## Overall-confidence Calculation
- TASK-01: 85% × S(1) = 85
- TASK-02: 90% × S(1) = 90
- TASK-03: 80% × M(2) = 160
- TASK-04: 80% × L(3) = 240
- TASK-05: 80% × M(2) = 160
- CHECKPOINT-A: 95% × S(1) = 95
- Sum = 830 / total weight 10 = **83%**
