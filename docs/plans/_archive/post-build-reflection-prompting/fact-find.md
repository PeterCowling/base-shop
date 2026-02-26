---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: Platform
Workstream: Operations
Created: 2026-02-26
Last-updated: 2026-02-26
Feature-Slug: post-build-reflection-prompting
Execution-Track: business-artifact
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/post-build-reflection-prompting/plan.md
Trigger-Source: direct-operator-decision: operator conversation 2026-02-26 — identified that post-build reflection produces generic stubs with no structured prompting across five improvement-signal categories
Trigger-Why: Post-build results-review stubs are too generic; agents and operators produce idea candidates that cover the immediately obvious outcomes but miss systematic categories — new data sources, new packages, new skills, new loop processes, and AI-to-mechanistic conversion opportunities. These gaps mean improvement opportunities discovered during builds evaporate rather than feeding the loop.
Trigger-Intended-Outcome: type: operational | statement: Post-build pre-fill and results-review template systematically prompt across five improvement-signal categories so that build learnings convert into actionable platform improvement candidates | source: operator
---

# Post-Build Reflection Prompting Fact-Find Brief

## Scope

### Summary
The post-build process (`lp-do-build` plan completion step 2) pre-fills `results-review.user.md` with stubs. The template and the pre-fill instructions both lack structured prompting across five improvement-signal categories that are reliably surfaced by build work but currently captured only by luck:

1. **New standing data sources** — external feeds, APIs, or artifacts that could become Layer A standing intelligence.
2. **New open-source packages** — libraries that could replace custom code or add capability.
3. **New skills** — recognising when a recurring agent workflow should be codified as a named skill.
4. **New startup loop processes** — identifying where the loop is missing a stage, gate, or feedback path.
5. **AI-to-mechanistic conversion** — steps currently done by LLM reasoning that could be replaced with deterministic scripts, saving tokens every cycle.

### Goals
- Add a five-category scan checklist to `lp-do-build` SKILL.md so agents systematically look for these signals when pre-filling results-review.
- Update `results-review.user.md` template to surface the same categories as prompts within `## New Idea Candidates`, so operators also have structured prompting.
- Wire `meta-reflect` SKILL.md to fire naturally when any of the five categories is spotted during a session (currently meta-reflect has no trigger signals for these categories).

### Non-goals
- Adding a new *required* section to `results-review.user.md` (would require changes to the TypeScript reflection-debt emitter and minimum payload check — out of scope).
- Creating a new skill for this (over-engineering; inline prompting suffices).
- Changing the reflection-debt emitter (`lp-do-build-reflection-debt.ts`) — no code changes needed.
- Changing the two-layer-model.md contract rules (R9 already covers standing expansion obligation; it's the prompt quality that's weak, not the contract).

### Constraints & Assumptions
- Constraints:
  - Must not add new required sections to `results-review.user.md` (reflection-debt emitter minimum payload is fixed unless code is changed).
  - All changes are to markdown/SKILL.md files only — no TypeScript changes.
  - `results-review.user.md` minimum payload per `loop-output-contracts.md`: Observed Outcomes, Standing Updates, New Idea Candidates, Standing Expansion. These four sections remain the gate; we enrich within them.
- Assumptions:
  - Pre-fill quality is agent-controlled — better instructions in `lp-do-build` SKILL.md will be followed.
  - The `## New Idea Candidates` section is the right home for the five-category output — it has broad enough semantics (`any new opportunities, problems, or hypotheses`) to absorb these categories without a contract change.
  - `meta-reflect` trigger signals are advisory (semi-automatic) — adding new triggers does not force invocation, just makes it natural when signals are present.

## Outcome Contract

- **Why:** Build cycles consistently produce signals in these five categories but the current pre-fill guidance gives agents no structured way to capture them. Opportunities evaporate rather than feeding the improvement loop.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Post-build pre-fill and results-review template systematically prompt across five improvement-signal categories so that build learnings convert into actionable platform improvement candidates.
- **Source:** operator

## Evidence Audit (Current State)

### Key Modules / Files

- `.claude/skills/lp-do-build/SKILL.md:152-153` — Plan completion step 2. Current text: "pre-fill all agent-fillable sections (Observed Outcomes stub, Standing Updates, New Idea Candidates, Standing Expansion, Intended Outcome Check)". Zero guidance on *what to look for* in any section.
- `docs/plans/_templates/results-review.user.md` — Template for results-review. `## New Idea Candidates` stub: `- <Idea summary — ≤80 chars> | Trigger observation: <one-line evidence> | Suggested next action: <create card | spike | defer>`. No category prompts. `## Standing Expansion` stub: only references standing artifact (Layer A) — no mention of packages, skills, or mechanization.
- `.claude/skills/meta-reflect/SKILL.md:44-68` — "When to Trigger" section. Three trigger groups: planning pipeline signals, execution signals, documentation/skill adequacy signals. None of the five categories is named as a trigger condition.
- `docs/business-os/startup-loop/loop-output-contracts.md:175-176` — Results-review `## New Idea Candidates` contract definition: "Any new opportunities, problems, or hypotheses surfaced by observing the outcomes." Semantics are broad enough to absorb the five categories — no contract change needed.
- `docs/business-os/startup-loop/two-layer-model.md:216-221` — R9 (standing expansion). Already requires operators to decide whether to add/revise standing artifacts and register new triggers. Does NOT mention packages, skills, or mechanization.
- `.claude/skills/meta-loop-efficiency/SKILL.md` — Mechanization audit exists but is operator-initiated weekly scan, not wired to post-build detection. Heuristics (H1-H3) are deterministic shell scans; they surface existing oversized skills but do not capture fresh opportunities identified during a specific build.
- `docs/business-os/startup-loop/ideas/trial/queue-state.json` — Trial queue for ideas dispatch. Current model: signals enter as dispatch packets, then route to fact-find. The five-category signals from builds should naturally feed this queue as candidates.

### Delivery & Channel Landscape

- Audience: agents executing `lp-do-build` pre-fill + operators completing `results-review.user.md` manually after build.
- Channel: internal SKILL.md files and a markdown template — no external delivery, no external stakeholders.
- Approval path: none required for internal skill edits; operator review of this plan is sufficient.
- Measurement availability: qualitative — review next 5 post-change results-reviews for category coverage. No tracking infrastructure required.

### Hypothesis & Validation Landscape

#### Key Hypotheses

| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | Adding explicit five-category scan prompts at three intervention points will increase the frequency of improvement-signal candidates captured in results-reviews | Agents follow expanded pre-fill instructions | Low (read 5 results-reviews) | 2–4 build cycles |
| H2 | The root cause of missing signals is prompt quality at pre-fill time, not context availability at that time | H1 produces non-zero candidates in the five categories | Low (inspect task-completion notes vs. pre-fill quality) | Same 5 reviews |

#### Existing Signal Coverage

| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | No results-reviews with category-prompted pre-fill exist | N/A | Untested — no prior baseline |
| H2 | No systematic comparison of task-completion vs. pre-fill context exists | N/A | Untested |

#### Competing Hypothesis (Context Timing)

A plausible alternative: the root cause is not prompt quality but *context availability*. Agents may have richer build-context at task-completion time than at end-of-plan pre-fill summary time. A task-completion hook (per-task "process notes" capturing these signals while the task is live) would be higher fidelity. This plan takes the lower-cost intervention first (prompt enrichment, 3-file change, no structural rebuild). If prompt-only gains are insufficient after 5 review cycles, the task-completion capture approach should be evaluated as a follow-on.

#### Falsifiability Assessment

- Easy to test: compare New Idea Candidates entries in 5 pre-change reviews vs. 5 post-change reviews; look for any of the five category labels appearing.
- Hard to test: whether *quality* of candidates improved vs. just *quantity* (requires subjective scoring).
- Validation seams: qualitative review is the only practical seam; no automated measurement available.

#### Recommended Validation Approach

- Quick probe: after first 2 post-change builds, read results-reviews and check whether any of the five categories produced a non-None candidate. If 0/5 categories appear across 2 reviews, context-timing hypothesis may dominate.
- Deferred: full quality assessment (do the candidates lead to actionable improvements?) over 5 build cycles.

### Dependency & Impact Map

- Upstream: `lp-do-build` SKILL.md produces the pre-filled `results-review.user.md`.
- Downstream: Operator reads results-review; updates Layer A standing artifacts; optionally enqueues new fact-find ideas.
- Blast radius: Three files change: `lp-do-build/SKILL.md`, `results-review.user.md` template, `meta-reflect/SKILL.md`. No code, no emitter, no contract schema changes.
- Risk of prompting too hard: Pre-fill becomes noisy if agents manufacture candidates where none exist. Mitigated by requiring `None` as an explicit valid output and requiring evidence for each candidate (consistent with existing New Idea Candidates format).

## Questions

### Resolved

- Q: Should a new section `## Platform Improvement Candidates` be added to `results-review.user.md`?
  - A: No. This would require emitter changes (new minimum payload key) and add a hard gate where none is warranted. Instead, expand `## New Idea Candidates` with category prompts — semantics already support it, no contract change, no code change.
  - Evidence: `loop-output-contracts.md:175` — "any new opportunities, problems, or hypotheses"; `lp-do-build-reflection-debt.ts` minimum payload key `New Idea Candidates` exists and doesn't need splitting.

- Q: Does `meta-loop-efficiency` already cover the "AI-to-mechanistic" category?
  - A: Only partially. It mechanically scans for oversized/under-dispatched skills — that is, it audits existing skills for known heuristic patterns. It does not capture *newly identified* mechanization opportunities that emerge from a specific build's context. Build-level detection (what this plan adds to `lp-do-build` pre-fill and `meta-reflect` triggers) is complementary and distinct.
  - Evidence: `meta-loop-efficiency/SKILL.md` heuristics H1-H3 are deterministic file-size/pattern checks over all in-scope skills — they're not build-context-aware.

- Q: Is there a risk of prompt inflation (agents hallucinating improvement candidates)?
  - A: Low. All five categories require the agent to cite a specific trigger observation (already required by the New Idea Candidates format: "Trigger observation: <one-line evidence>"). An agent cannot plausibly hallucinate a concrete build artifact as evidence. The `None` explicit option prevents empty stub filling.
  - Evidence: Current template format already enforces evidence per candidate; this plan preserves and extends that pattern.

- Q: Should `two-layer-model.md` R9 be updated to reference the five categories?
  - A: No. R9 is a contract rule governing standing artifact expansion — it's the right level of abstraction for a contract doc. The five-category scan belongs in operational instructions (`lp-do-build`, results-review template) not in a contract specification. Updating R9 would conflate process guidance with contract semantics.
  - Evidence: R9 already uses inclusive language ("any artifact that meets the qualification criteria") — the categories are within scope of R9 semantically; the gap is in operational prompting, not contract coverage.

### Open (Operator Input Required)

None — all decisions resolved from available evidence.

## Confidence Inputs

- Implementation: 92% — target files are identified, change surface is bounded to three markdown files, no ambiguous integration points.
- Approach: 87% — inline prompting at pre-fill + template + meta-reflect triggers is correct. Minor risk: if lp-do-build pre-fill instructions grow too long, the skill risks bloating. Mitigated by keeping the checklist tight (≤14 lines — 14 lines of headroom at 186/200).
- Impact: 80% — directly improves category coverage in every future build cycle. Hard to measure mechanically (output is qualitative idea candidates), but the mechanism is structurally sound.
- Delivery-Readiness: 93% — three files, no owners to consult, no approvals required for internal skill edits.
- Testability: 75% — changes are to prose instructions; correctness is observable in subsequent results-review outputs but not unit-testable.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Pre-fill instructions in lp-do-build SKILL.md grow too verbose | Medium | Low | Keep checklist to ≤14 lines (14 lines of headroom); use a compact numbered-list format |
| Agents manufacture fake candidates with no evidence | Low | Low | Template format already requires "Trigger observation: <evidence>"; preserve requirement |
| Goodhart compliance: agents enumerate all five categories per build regardless of signal | Medium | Medium | Evidence requirement ("Trigger observation: <proof>") + `None` is explicit valid output; mitigation is partial — relies on agent quality |
| Template change causes confusion for operator writing results-review manually | Low | Low | Use HTML comment syntax for category prompts so they're visually distinct from content |
| meta-reflect over-triggers on minor occurrences | Low | Low | New triggers remain advisory (semi-automatic) — consistent with existing trigger language |

## Planning Constraints & Notes

- Must-follow patterns:
  - `lp-do-build` SKILL.md must stay ≤200 lines (currently 186 lines, some headroom). Add checklist as an inline sub-list under step 2, not a new top-level section.
  - Template changes must use HTML comment syntax for guidance prompts to remain compatible with the operator-authored `.user.md` convention.
  - `meta-reflect` SKILL.md: add a fourth trigger group "Platform evolution signals" consistent with existing trigger group format.
- Rollout/rollback: All changes are markdown — git revert is instant if a change regresses quality.

## Suggested Task Seeds (Non-binding)

1. IMPLEMENT: Add five-category scan checklist to `lp-do-build` SKILL.md step 2 pre-fill block.
2. IMPLEMENT: Update `results-review.user.md` template — add HTML-comment category prompts within `## New Idea Candidates`.
3. IMPLEMENT: Add "Platform evolution signals" trigger group to `meta-reflect` SKILL.md.

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package: All three target files updated; category prompts present; lp-do-build step 2 checklist ≤14 new lines; no new required sections added to results-review; reflection-debt emitter unchanged.
- Post-delivery measurement plan: Review the next 2 results-reviews produced after this change; check whether New Idea Candidates entries include any of the five categories. Qualitative assessment only.

## Evidence Gap Review

### Gaps Addressed
- Confirmed minimum payload check does not need to change — contract semantics of `## New Idea Candidates` are broad enough.
- Confirmed `meta-loop-efficiency` does not overlap — different scope and invocation model.
- Confirmed no emitter code changes required.

### Confidence Adjustments
- Implementation raised from initial 85% to 92% after confirming lp-do-build has 14 lines of headroom before the 200-line constraint.
- Delivery-Readiness raised to 93% after confirming no approvals or co-owners required.

### Remaining Assumptions
- The five-category checklist added to lp-do-build pre-fill will be followed by agents in future build cycles. This is instruction-following assumption — consistent with how all SKILL.md directives work.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan post-build-reflection-prompting --auto`
