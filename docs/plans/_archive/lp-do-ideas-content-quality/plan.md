---
Type: Plan
Status: Archived
Domain: BOS
Workstream: Engineering
Created: 2026-02-26
Last-reviewed: 2026-02-26
Last-updated: 2026-02-26
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: lp-do-ideas-content-quality
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# lp-do-ideas Content Quality Plan

## Summary

The `lp-do-ideas` SKILL.md intake path (Steps 3–4) generates progress-report content
instead of narrow actionable idea dispatches. Three rules are missing: an `area_anchor`
format constraint, a "one event → multiple narrow packets" decomposition requirement, and
a guard suppressing administrative non-ideas (business registration events). A fourth task
clarifies the "No hard keyword lists" statement to distinguish operator-idea routing from
artifact-delta routing. A fifth task documents the known queue-state.json format
divergence. All five tasks are edits to `.claude/skills/lp-do-ideas/SKILL.md` only. No
TypeScript changes.

## Active tasks

- [x] TASK-01: Add `area_anchor` format constraint to SKILL.md Step 3
- [x] TASK-02: Add decomposition rule (one event → multiple narrow packets) to Step 4
- [x] TASK-03: Add administrative non-idea suppression rule to Step 4
- [x] TASK-04: Clarify "No hard keyword lists" in Routing Intelligence section
- [x] TASK-05: Add known-issues note about queue-state.json format divergence

## Goals

- Future operator-idea dispatches produce narrow, artifact-scoped `area_anchor` values
  (≤12 words, not narrative prose).
- A single event with multiple gaps produces multiple focused dispatch packets.
- Business registration and other admin actions are routed `logged_no_action` with a
  redirect note.
- The skill accurately describes how T1 keyword routing applies to artifact-delta vs
  operator-idea paths.
- Agents reading the skill understand the queue-state.json format divergence before
  writing to it.

## Non-goals

- Retroactively correcting the 26 existing queue-state.json dispatches.
- Changing the T1 keyword list in `lp-do-ideas-trial.ts`.
- Fixing the schema mismatch between TS persistence and the hand-authored queue file
  (separate work).
- Changing the autonomy policy or trigger threshold escalation conditions.

## Constraints & Assumptions

- Constraints:
  - SKILL.md changes must remain consistent with trial contract Section 4 — no new
    required schema fields, no changes to `area_anchor` schema validation.
  - Trial contract Section 2 (Option B): no auto-execution policy change — escalation
    requires ≥14 days, ≥40 dispatches, and ≥80% precision.
  - All changes are additive only — no removal of existing intake guidance.
  - TASK-01 through TASK-05 all edit the same file; must be applied sequentially.
- Assumptions:
  - Prose rules in SKILL.md are sufficient to fix the observed failure mode; no automated
    enforcement (lint/CI) is needed for this iteration.
  - The TS codebase does not need changes.

## Inherited Outcome Contract

- **Why:** The lp-do-ideas skill generated a progress report about PWRB business
  registration instead of decomposed, actionable idea dispatches. Content quality is
  unmeasured and the operator can't trust the queue as a signal source until it is fixed.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The skill intake path produces narrow, artifact-scoped
  dispatch packets — one per gap — and suppresses administrative non-ideas (business
  registration events). Existing queue entries are not retroactively corrected.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/lp-do-ideas-content-quality/fact-find.md`
- Key findings used:
  - SKILL.md Step 3 has no `area_anchor` format constraint; agents fill it with narratives.
  - SKILL.md Step 4 has no "one event → multiple packets" guidance.
  - No suppression guard for admin-action events (business registration).
  - "No hard keyword lists" is accurate for operator-idea routing but misleading given the
    T1 list in the TS orchestrator for artifact-delta routing.
  - `TrialDispatchPacketV2.trigger` includes `"operator_idea"` for TS compatibility, but
    the TS orchestrator does not author or execute operator-idea intake.
  - queue-state.json uses `queue_version: "queue.v1"` + `dispatches[]`; TS persistence
    layer uses `schema_version: "queue-state.v1"` + `entries[]`. The TS layer has never
    written to the live file.

## Proposed Approach

- Option A: SKILL.md prose rules only — additive, no schema or TS changes.
- Option B: SKILL.md prose rules + lint script over queue-state.json to enforce format.
- Chosen approach: **Option A.** The failure mode is agent judgment, not a schema gap.
  A lint script would add complexity without addressing the root cause. Worked examples
  (good/bad pairs) inline in the skill are sufficient to anchor agent behavior. Lint can
  be added in a follow-on if compliance proves poor after 2–3 observed dispatches.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---:|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | area_anchor format constraint (Step 3) | 85% | S | Complete (2026-02-26) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Decomposition rule — one event → N packets (Step 4) | 85% | S | Complete (2026-02-26) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Admin non-idea suppression rule (Step 4) | 85% | S | Complete (2026-02-26) | TASK-02 | TASK-04 |
| TASK-04 | IMPLEMENT | Clarify "No hard keyword lists" (Routing Intelligence) | 90% | S | Complete (2026-02-26) | TASK-03 | TASK-05 |
| TASK-05 | IMPLEMENT | Known-issues note — queue-state.json format divergence | 90% | S | Complete (2026-02-26) | TASK-04 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 → TASK-02 → TASK-03 → TASK-04 → TASK-05 | - | All edit same file; sequential within one build pass |

## Tasks

### TASK-01: Add `area_anchor` format constraint to SKILL.md Step 3

- **Type:** IMPLEMENT
- **Deliverable:** `.claude/skills/lp-do-ideas/SKILL.md` — updated Step 3 intake for
  operator ideas, with format rule and good/bad worked examples.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Build evidence:** SKILL.md Step 3 operator-idea branch updated. Format rule (≤12 words, no narrative prose), template `"<Business> <Artifact> — <gap in one clause>"`, good examples (PWRB IPEI agreement, PWRB hardware SKU), and bad example (PWRB 0023 narrative) inserted after existing "Area anchor" bullet. VC-01 passed: format rule, word count, template, and examples confirmed present.
- **Artifact-Destination:** `.claude/skills/lp-do-ideas/SKILL.md` (skill used in-session)
- **Reviewer:** operator (review next dispatch after change)
- **Approval-Evidence:** None: no formal approval process for skill doc edits
- **Measurement-Readiness:** Post-fix review of next 2–3 operator-idea dispatches;
  confirm `area_anchor` is ≤12 words and not narrative prose
- **Affects:** `.claude/skills/lp-do-ideas/SKILL.md`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 85%
  - Implementation: 95% — target section (Step 3, operator-idea branch) is identified;
    exact text to add is specified in fact-find Resolved Q.
  - Approach: 90% — format constraint and worked examples are evidence-based (drawn from
    actual good/bad dispatch examples in queue-state.json).
  - Impact: 85% — relies on agent compliance; no automated enforcement. Held-back test:
    the single unknown is "will agents follow prose rules?" — since there's no schema
    gate, a sufficiently degraded model could still produce narrative area_anchors. This
    caps Impact at 85 rather than 90+.
- **Acceptance:**
  - [ ] Step 3 operator-idea branch includes: `area_anchor` must be ≤12 words, no full
    sentences, no narrative prose.
  - [ ] Format template provided: `"<Business> <Artifact> — <gap in one clause>"`.
  - [ ] At least one good example and one bad example (PWRB 0023) inline.
- **Validation contract (VC-01):**
  - VC-01: Read `.claude/skills/lp-do-ideas/SKILL.md` Step 3 → confirm format rule, word
    count, and examples are present → Pass if all three acceptance criteria met; Fail if
    any missing. Check: immediate post-edit read.
  - VC-02: Next operator-idea dispatch → `area_anchor` field is ≤12 words and matches
    the `"<Business> <Artifact> — <gap>"` pattern → Pass within next 2 live invocations.
- **Execution plan:**
  - Red evidence plan: Current SKILL.md Step 3 has no `area_anchor` format rule — read
    confirms absence.
  - Green evidence plan: Edit SKILL.md Step 3 to add the rule after the existing
    "Area anchor" bullet. Insert format template and good/bad examples.
  - Refactor evidence plan: Re-read full Step 3 for consistency; confirm no duplicate
    definitions, no orphaned old text.
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** None: format constraint and examples are fully specified in fact-find.
- **Edge Cases & Hardening:** If the area anchor for a complex multi-system gap genuinely
  needs more words, the rule explicitly states it is guidance not schema-enforced — agent
  may exceed 12 words but must never use full sentences or narrative prose.
- **What would make this >=90%:** Automated lint check over queue-state.json validating
  word count on next dispatch (out of scope this iteration).
- **Rollout / rollback:**
  - Rollout: Effective on next `/lp-do-ideas` invocation.
  - Rollback: Revert SKILL.md edit. Zero production risk.
- **Documentation impact:** SKILL.md is both the target and the documentation.
- **Notes / references:** Fact-find Resolved Q "What is a suitable area_anchor format
  constraint?" Evidence: `queue-state.json:48–59` (bad example), `lp-do-ideas-trial.ts:402–411` (TS DOMAIN_TO_AREA).

---

### TASK-02: Add decomposition rule — one event → multiple narrow packets

- **Type:** IMPLEMENT
- **Deliverable:** `.claude/skills/lp-do-ideas/SKILL.md` — updated Step 4, with explicit
  decomposition requirement when one event contains multiple distinct gaps.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Build evidence:** Decomposition rule added to Step 4 before existing auto-execution policy block. Rule states: one incoming event with multiple distinct gaps → emit one dispatch packet per gap. Each packet must be independently actionable. PWRB backfill example (4 separate packets) included inline. VC-01 passed: rule and example confirmed present.
- **Artifact-Destination:** `.claude/skills/lp-do-ideas/SKILL.md`
- **Reviewer:** operator
- **Approval-Evidence:** None: S skill doc edit
- **Measurement-Readiness:** Post-fix review — confirm PWRB backfill gaps produce ≥4
  separate dispatch packets when re-submitted.
- **Affects:** `.claude/skills/lp-do-ideas/SKILL.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 85%
  - Implementation: 95% — target location (Step 4, before auto-execution policy block)
    is clear; rule text is specified.
  - Approach: 90% — decomposition principle is standard practice; worked example (PWRB
    backfill → 4+ packets) is concrete.
  - Impact: 85% — same agent-compliance cap as TASK-01.
- **Acceptance:**
  - [ ] Step 4 includes explicit rule: when one incoming event contains multiple distinct
    gaps, emit one dispatch packet per gap — not one aggregate packet.
  - [ ] Example provided: PWRB strategy backfill → at least 4 packets (IPEI agreement,
    hardware SKU, venue selection, brand name).
  - [ ] Rule specifies that each packet must be independently actionable.
- **Validation contract (VC-02):**
  - VC-01: Read SKILL.md Step 4 → confirm decomposition rule and PWRB example present.
  - VC-02: When PWRB backfill gaps are re-submitted via `/lp-do-ideas`, confirm ≥4
    separate dispatch packets emitted (one per gap).
- **Execution plan:**
  - Red: Current Step 4 has no decomposition rule.
  - Green: Add decomposition rule after the "Apply routing intelligence" instruction.
  - Refactor: Re-read Step 4 for consistency with existing routing guidance.
- **Planning validation (required for M/L):** None: S-effort.
- **Scouts:** None: rule is fully specified.
- **Edge Cases & Hardening:** If all gaps in one event share the same `area_anchor` and
  `location_anchor`, they may still be one packet — the rule applies when gaps are
  independently actionable and would route to different fact-finds or briefings.
- **What would make this >=90%:** Second confirmed dispatch session where decomposition
  rule is observed to work correctly.
- **Rollout / rollback:** Same as TASK-01.
- **Documentation impact:** SKILL.md only.
- **Notes / references:** Fact-find Summary defect #2; operator conversation.

---

### TASK-03: Add administrative non-idea suppression rule to Step 4

- **Type:** IMPLEMENT
- **Deliverable:** `.claude/skills/lp-do-ideas/SKILL.md` — updated routing intelligence
  section with suppression examples for admin events.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Build evidence:** Admin non-idea suppression added in two places: (1) `logged_no_action` bullet in Routing decision now references the suppression section; (2) new `### Admin non-idea suppression` subsection added with the principle question, suppression examples (business registration, stage advancement, completed results review), and edge case (completed action that reveals a planning gap → submit gap as separate dispatch). VC-01 passed: all three acceptance criteria confirmed.
- **Artifact-Destination:** `.claude/skills/lp-do-ideas/SKILL.md`
- **Reviewer:** operator
- **Approval-Evidence:** None: S skill doc edit
- **Measurement-Readiness:** Post-fix: confirm PWRB registration event routes
  `logged_no_action` if re-submitted.
- **Affects:** `.claude/skills/lp-do-ideas/SKILL.md`
- **Depends on:** TASK-02
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 90% — suppression examples are specified in fact-find; routing
    intelligence section location is known.
  - Approach: 90% — framing as a principle ("describes an admin action, not a knowledge
    gap") rather than an exhaustive list is the correct approach per fact-find risk table.
  - Impact: 85% — agent compliance cap; no schema enforcement.
- **Acceptance:**
  - [ ] Routing intelligence section includes a suppression principle: events describing
    startup-loop admin actions (not knowledge/planning gaps) route `logged_no_action`.
  - [ ] At least 2 suppression examples listed: business registration, stage advancement.
  - [ ] Redirect note included: for registration events, direct operator to
    `/startup-loop start`.
- **Validation contract (VC-03):**
  - VC-01: Read SKILL.md routing intelligence → confirm suppression principle, examples,
    and redirect note present.
  - VC-02: Re-submit "PWRB startup loop not yet formally started" event → confirm routes
    `logged_no_action` on next invocation.
- **Execution plan:**
  - Red: Current routing intelligence has no admin suppression rule.
  - Green: Add suppression principle under `logged_no_action` definition in Routing
    Intelligence section.
  - Refactor: Re-read routing intelligence block for internal consistency.
- **Planning validation (required for M/L):** None: S-effort.
- **Scouts:** None.
- **Edge Cases & Hardening:** "Stage advancement" is admin but a completed stage may
  open real planning gaps (e.g. "stage S3 complete → brand profiling now needed"). The
  rule must clarify: suppress the admin action itself; if the completion event also opens
  a planning gap, that gap should be submitted as a separate operator-idea.
- **What would make this >=90%:** Confirmed live test of suppression on a business
  registration event.
- **Rollout / rollback:** Same as TASK-01.
- **Documentation impact:** SKILL.md only.
- **Notes / references:** Fact-find Resolved Q "What events qualify as administrative
  non-ideas?".

---

### TASK-04: Clarify "No hard keyword lists" in Routing Intelligence

- **Type:** IMPLEMENT
- **Deliverable:** `.claude/skills/lp-do-ideas/SKILL.md` — routing intelligence section
  clarified to distinguish operator-idea routing (prose/judgment) from artifact-delta
  routing (T1_SEMANTIC_KEYWORDS in TS code).
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Build evidence:** "No hard keyword lists" statement qualified in-place: changed to "No hard keyword lists for operator-idea routing." Parenthetical note added: "artifact-delta routing in the TS orchestrator uses the `T1_SEMANTIC_KEYWORDS` list in `lp-do-ideas-trial.ts` — that list applies only to `artifact_delta` events, not to operator ideas handled here." VC-01 passed: qualification confirmed present.
- **Artifact-Destination:** `.claude/skills/lp-do-ideas/SKILL.md`
- **Reviewer:** operator
- **Approval-Evidence:** None: S skill doc edit
- **Measurement-Readiness:** None: clarity fix, no measurable outcome beyond "statement
  is now accurate".
- **Affects:** `.claude/skills/lp-do-ideas/SKILL.md`
- **Depends on:** TASK-03
- **Blocks:** TASK-05
- **Confidence:** 90%
  - Implementation: 95% — exact line is identified; fix is a one-sentence clarification.
  - Approach: 90% — the distinction between operator-idea (prose routing) and
    artifact-delta (T1 keyword routing) is factually confirmed in the TS code.
  - Impact: 90% — prevents future agents from being confused by the apparent
    contradiction; no compliance dependency.
- **Acceptance:**
  - [ ] "No hard keyword lists" statement is qualified: it applies to operator-idea
    routing only.
  - [ ] A note clarifies that artifact-delta routing uses `T1_SEMANTIC_KEYWORDS` in
    `lp-do-ideas-trial.ts`.
- **Validation contract (VC-04):**
  - VC-01: Read SKILL.md Routing Intelligence → "No hard keyword lists" qualified with
    operator-idea scope note.
- **Execution plan:**
  - Red: Current statement is unqualified and misleading for artifact-delta path.
  - Green: Add parenthetical or follow-on sentence to the "No hard keyword lists" line.
  - Refactor: Re-read routing section for consistency.
- **Planning validation (required for M/L):** None: S-effort.
- **Scouts:** None.
- **Edge Cases & Hardening:** None: purely a clarification, no behavioral change.
- **What would make this >=90%:** Already at 90%; no further evidence needed.
- **Rollout / rollback:** Same as TASK-01.
- **Documentation impact:** SKILL.md only.
- **Notes / references:** `lp-do-ideas-trial.ts:26–48` (T1_SEMANTIC_KEYWORDS); SKILL.md
  Routing Intelligence section "No hard keyword lists."

---

### TASK-05: Add known-issues note — queue-state.json format divergence

- **Type:** IMPLEMENT
- **Deliverable:** `.claude/skills/lp-do-ideas/SKILL.md` — new "Known Issues" note
  documenting the queue-state.json format divergence.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Build evidence:** `## Known Issues` section appended at end of SKILL.md. Section contains: subsection heading "queue-state.json format divergence", comparative table (live file vs TS persistence key names), statement that TS layer has never written to the live file, note that `ideas.user.html` viewer handles both formats, and explicit warning against migrating without a dedicated plan. VC-01 passed: all four acceptance criteria confirmed.
- **Artifact-Destination:** `.claude/skills/lp-do-ideas/SKILL.md`
- **Reviewer:** operator
- **Approval-Evidence:** None: S skill doc edit
- **Measurement-Readiness:** None: documentation note.
- **Affects:** `.claude/skills/lp-do-ideas/SKILL.md`
- **Depends on:** TASK-04
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — content is fully specified; location is a new section appended
    to the skill.
  - Approach: 95% — documenting a factual known divergence.
  - Impact: 90% — prevents future agents from assuming `persistOrchestratorResult()`
    was used for the live file, or from attempting to migrate the format without context.
- **Acceptance:**
  - [ ] SKILL.md has a clearly-labelled "Known Issues" or "Queue State Notes" section.
  - [ ] Section explains: live `queue-state.json` uses `queue_version: "queue.v1"` +
    `dispatches[]`; TS persistence layer (`lp-do-ideas-persistence.ts`) expects
    `schema_version: "queue-state.v1"` + `entries[]`.
  - [ ] Section clarifies: TS layer has never written to the live file; all current
    dispatches are agent-authored.
  - [ ] Section notes: `ideas.user.html` viewer handles both formats.
- **Validation contract (VC-05):**
  - VC-01: Read SKILL.md Known Issues section → all four acceptance criteria present.
- **Execution plan:**
  - Red: No such section exists.
  - Green: Append "Known Issues" section at end of SKILL.md with divergence note.
  - Refactor: Re-read section for accuracy against the two source files.
- **Planning validation (required for M/L):** None: S-effort.
- **Scouts:** None.
- **Edge Cases & Hardening:** Note must not imply the TS persistence layer is broken or
  should be removed — it's infrastructure for eventual live-mode activation.
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:** Same as TASK-01.
- **Documentation impact:** SKILL.md only.
- **Notes / references:** `lp-do-ideas-persistence.ts:55–65` (PersistedQueueState);
  `ideas.user.html` viewer format branch.

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Agent ignores new rules and continues narrative area_anchors | Medium | Medium | Worked good/bad examples inline; observable post-fix via queue review |
| "Administrative non-idea" principle too vague, misapplied | Low | Low | Concrete examples + edge-case clarification in TASK-03 |
| TASK-03 edge case: completed-stage event suppressed when it should open a planning gap | Low | Medium | TASK-03 explicitly addresses this — suppress the admin action; submit planning gap as separate dispatch |
| All 5 tasks edit the same file; sequential execution required | Medium | Low | Noted in Parallelism Guide; Wave 1 is fully sequential |

## Observability

- Logging: None: SKILL.md edits have no runtime logs.
- Metrics: Post-fix queue review — check `area_anchor` word count and format on next
  2–3 operator-idea dispatches.
- Alerts/Dashboards: None: manual review only.

## Acceptance Criteria (overall)

- [ ] `.claude/skills/lp-do-ideas/SKILL.md` updated with all 5 changes (TASK-01 through
  TASK-05).
- [ ] Each rule accompanied by at least one worked example (good or bad).
- [ ] No regressions to existing dispatch contract (trial contract Section 4).
- [ ] No removal of existing intake guidance — additive only.
- [ ] Next PWRB operator-idea invocation produces ≥4 narrow dispatches (one per gap)
  with area_anchor ≤12 words each.

## Decision Log

- 2026-02-26: Chose Option A (prose rules only) over Option B (lint script). Lint adds
  complexity without addressing root cause; worked examples are the right anchor for
  agent behavior. Lint deferred to follow-on if compliance proves poor.
- 2026-02-26: Merge TASK-03 edge case (stage-completion gap) into task body rather than
  creating a DECISION task — agent can resolve this with the documented principle.

## Overall-confidence Calculation

- All tasks Effort S (weight=1 each). Weighted average = simple mean when all weights equal.
- TASK-01: min(95,90,85)=85%, TASK-02: min(95,90,85)=85%, TASK-03: min(90,90,85)=85%,
  TASK-04: min(95,90,90)=90%, TASK-05: min(95,95,90)=90%
- Overall = (1×85 + 1×85 + 1×85 + 1×90 + 1×90) / (1+1+1+1+1) = 435/5 = 87%
- Rounded to nearest 5: **85%**
