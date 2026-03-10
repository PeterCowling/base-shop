---
Type: Build-Record
Feature-Slug: lp-do-ideas-content-quality
Build-date: 2026-02-26
---

# Build Record: lp-do-ideas Content Quality

## What Was Built

Five additive edits to `.claude/skills/lp-do-ideas/SKILL.md`. No TypeScript changes. No schema changes. All changes are prose rules with worked examples.

**TASK-01 — `area_anchor` format constraint (Step 3)**
Added a format rule block after the existing "Area anchor" bullet in Step 3 (operator-idea intake). The rule specifies: ≤12 words, no full sentences, no narrative prose. A template (`"<Business> <Artifact> — <gap in one clause>"`), two good examples (PWRB IPEI agreement, PWRB hardware SKU), and one bad example (the multi-sentence PWRB 0023 narrative) are inline. The ≤12-word limit is marked guidance-not-schema-enforced, with an explicit note about exceeding it only for genuinely complex multi-system names.

**TASK-02 — Decomposition rule (Step 4)**
Added a "Decomposition rule — one event, multiple narrow packets" block at the start of Step 4, before the auto-execution policy. The rule states that when one incoming event contains multiple distinct gaps, one dispatch packet per gap must be emitted — not one aggregate packet covering the whole event. The PWRB backfill scenario is used as a worked example (4 packets: IPEI agreement, hardware SKU, venue shortlist, brand name).

**TASK-03 — Admin non-idea suppression (Routing Intelligence)**
Added suppression coverage in two places: (1) the `logged_no_action` routing decision bullet now explicitly references administrative startup-loop actions as a suppression trigger; (2) a new `### Admin non-idea suppression` subsection defines the principle question ("Does this describe something the operator *does*, or something to *know or decide*?"), provides three suppression examples (business registration, stage advancement, completed results review with no findings), and covers the edge case where a completed action also reveals a planning gap (suppress the admin action itself; emit the gap as a separate operator-idea dispatch).

**TASK-04 — "No hard keyword lists" qualifier (Routing Intelligence)**
Changed "No hard keyword lists." to "No hard keyword lists for operator-idea routing." and added a parenthetical noting that artifact-delta routing in the TS orchestrator uses the `T1_SEMANTIC_KEYWORDS` list in `lp-do-ideas-trial.ts` — that list applies only to `artifact_delta` events, not to operator ideas handled in the skill.

**TASK-05 — Known Issues section (queue-state.json format divergence)**
Appended a `## Known Issues` section at the end of SKILL.md with a subsection documenting the format divergence between the live `queue-state.json` file (hand-authored; uses `queue_version: "queue.v1"` + `dispatches[]`) and the TypeScript persistence layer (`lp-do-ideas-persistence.ts`; uses `schema_version: "queue-state.v1"` + `entries[]`). States that the TS layer has never written to the live file, that the viewer handles both formats, and explicitly warns against migrating the live file without a dedicated plan.

## Tests Run

No automated tests. Execution-Track is `mixed` (skill doc), not code. Validation is Mode 3 (Document Review).

Mode 3 post-edit read of `.claude/skills/lp-do-ideas/SKILL.md`:
- VC-01 (TASK-01): format rule, word count, template, good/bad examples — all present. Pass.
- VC-01 (TASK-02): decomposition rule + PWRB example — present. Pass.
- VC-01 (TASK-03): suppression principle, examples, redirect note — all present. Pass.
- VC-01 (TASK-04): "No hard keyword lists for operator-idea routing" qualification + T1_SEMANTIC_KEYWORDS note — present. Pass.
- VC-01 (TASK-05): Known Issues section, divergence table, TS-never-written note, viewer note — all present. Pass.

## Validation Evidence

All VC-01 contracts passed via immediate post-edit document read (Mode 3). VC-02 contracts (live invocation verification) are deferred to post-deployment observation (next 2–3 operator-idea dispatches via `/lp-do-ideas`).

Refactor pass: full SKILL.md re-read confirmed no duplicate definitions, no orphaned terminology, and cross-section consistency (intro auto-execute policy matches Step 4 auto-execute policy).

## Scope Deviations

None. All 5 tasks modified `.claude/skills/lp-do-ideas/SKILL.md` only. No TS files, no schema files, no other skill docs.

## Outcome Contract

- **Why:** The lp-do-ideas skill generated a progress report about PWRB business registration instead of decomposed, actionable idea dispatches. Content quality is unmeasured and the operator can't trust the queue as a signal source until it is fixed.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The skill intake path produces narrow, artifact-scoped dispatch packets — one per gap — and suppresses administrative non-ideas (business registration events). Existing queue entries are not retroactively corrected.
- **Source:** operator
