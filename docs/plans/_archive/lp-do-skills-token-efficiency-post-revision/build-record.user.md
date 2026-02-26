---
Status: Complete
Feature-Slug: lp-do-skills-token-efficiency-post-revision
Completed-date: 2026-02-26
artifact: build-record
---

# Build Record: lp-do Skills Token Efficiency + Effectiveness Post-Revision

## What Was Built

**Wave 1 — Shared modules + utility skill tightening (TASK-01, 04, 06, 07, 08)**

Created two new shared modules that eliminate near-identical logic blocks:

- `_shared/critique-loop-protocol.md` (58 lines) — unified 3-round critique loop protocol for lp-do-fact-find (Phase 7a, fact-find mode) and lp-do-plan (Phase 9, plan mode). Contains the pre-critique factcheck gate, iteration rules table, Round 1/2/3 specification, and post-loop gate verdicts keyed by mode.
- `_shared/queue-check-gate.md` (41 lines) — unified queue check gate for lp-do-fact-find (Phase 0, fact-find mode) and lp-do-briefing (Phase 0, briefing mode). The single mode-specific difference (briefing-only `status: briefing_ready` filter) is inline in the shared content.

Extracted lp-do-critique's 84-line Offer Lens to `lp-do-critique/modules/offer-lens.md` — Section D (6 check lists + scoring weights + Munger inversion attacks) is now loaded on-demand for offer artifacts only.

Tightened lp-do-factcheck: removed verbose code-block examples from Fix Guidelines (3→2 code blocks), reduced Anti-Patterns from 10 to 6 (kept the substantive, removed restatements). 496→445 lines.

Rewrote lp-do-build: eliminated redundant Task-Type Execution Policy section, compressed Plan Completion from 39-line multi-step with checklist to a compact 4-step sequence, compressed Always-Confirm-First to inline list. 263→185 lines (≤200 ✓).

**Wave 2 — Reference replacement in lp-do-fact-find and lp-do-plan (TASK-02, 03)**

Replaced lp-do-fact-find Phase 7a (54 inline lines) with a 3-line reference to `_shared/critique-loop-protocol.md`. 291→241 lines.

Replaced lp-do-plan Phase 11 (critique loop, 52 inline lines) and Phase 10 (build handoff) with correct execution order: renamed Phase 11 → Phase 9 (critique), Phase 10 stays Phase 10 (build handoff). File reordered so Phase 9 precedes Phase 10. Repaired the 8→10→11 phase gap to 8→9→10. 303→256 lines (≤260 ✓; ≤200 not achievable without removing governing content).

**Wave 3 — Queue check gate reference replacement (TASK-05)**

Replaced lp-do-fact-find Phase 0 (35 inline lines) with a 2-line reference to `_shared/queue-check-gate.md`. Additional controlled scope expansion applied (Phase 1 compacted, compatibility rule merged, Phase 3 sentences merged — needed to compensate for Phase 7a being 54L vs 65L estimated in TASK-02). Final: 195 lines (≤200 ✓).

Replaced lp-do-briefing Phase 0 (35 inline lines) with a 2-line reference. 114→81 lines (≤85 ✓).

## Tests Run

No code tests applicable — all changes are skill/documentation files (`.md`). Pre-commit hooks ran and passed on each wave commit:
- `validate-agent-context.cjs` ✓ (all 3 commits)
- `typecheck-staged` — no workspace packages affected (all 3 commits)
- `lint-staged-packages` — no workspace packages affected (all 3 commits)

## Validation Evidence

| Task | VC | Result |
|---|---|---|
| TASK-01 | VC-01: critique-loop-protocol.md exists, 55–65 lines | ✓ 58 lines |
| TASK-01 | VC-02: fact-find mode + plan mode sections present | ✓ both modes present |
| TASK-02 | VC-01: no inline critique table in fact-find SKILL.md | ✓ 0 matches |
| TASK-02 | VC-02: critique-loop-protocol reference = 1 | ✓ 1 match |
| TASK-03 | VC-01: Phase 11 gone from lp-do-plan SKILL.md | ✓ 0 matches |
| TASK-03 | VC-02: Phase 9 exists in lp-do-plan SKILL.md | ✓ 1 match |
| TASK-03 | VC-03: critique-loop-protocol reference = 1 | ✓ 1 match |
| TASK-04 | VC-01: queue-check-gate.md exists | ✓ 41 lines |
| TASK-04 | VC-02: briefing-mode content present | ✓ 2 matches for briefing_ready |
| TASK-06 | VC-01: offer-lens.md exists, 80–90 lines | ✓ 83 lines |
| TASK-06 | VC-02: ICP Segmentation not inline in SKILL.md | ✓ 0 inline matches |
| TASK-06 | VC-03: offer-lens reference in SKILL.md | ✓ 1 match |
| TASK-07 | VC-01: Fix Guidelines has exactly 2 code blocks | ✓ 2 code blocks |
| TASK-07 | VC-02: Anti-Patterns ≤7 items | ✓ 6 items |
| TASK-07 | VC-03: lp-do-factcheck ≤450 lines | ✓ 445 lines |
| TASK-08 | VC-01: lp-do-build SKILL.md ≤200 lines | ✓ 185 lines |
| TASK-08 | VC-02: Plan Completion section ≤12 lines | ✓ compact 4-step |
| TASK-05 | VC-01: queue-state.json = 0 in both files | ✓ 0 each |
| TASK-05 | VC-02: queue-check-gate ref = 1 in both files | ✓ 1 each |
| TASK-05 | VC-03: lp-do-fact-find ≤200 lines | ✓ 195 lines |
| TASK-05 | VC-04: lp-do-briefing ≤85 lines | ✓ 81 lines |
| TASK-05 | VC-05: Trigger-Source preserved | ✓ in queue-check-gate.md:40 |

## Scope Deviations

**TASK-05 controlled scope expansion**: Phase 7a was 54 lines (not 65 lines as estimated), so Phase 0 replacement alone would yield 210 lines (over ≤200). Applied 4 additional non-governing compactions to lp-do-fact-find: Phase 1 sub-headings → flat bullets (−5L), removed redundant briefing-redirect line (−1L), merged compatibility rule heading+bullets → 1 sentence (−5L), merged Phase 3 two-sentence paragraph (−1L). These are editorial compressions of non-governing framing text, not removals of governing content. Final result: 195 lines.

**TASK-03 scope note**: lp-do-plan ≤260 target (not ≤200) — confirmed justified during fact-find. ≤200 would require removing governing content (routing rules, DECISION gate, consumer tracing). Not attempted.

## Outcome Contract

- **Why:** BOS decoupling left two near-identical logic blocks in separate orchestrators. Deduplicating now prevents drift between copies on future edits.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All lp-do orchestrators ≤200 lines (three primary orchestrators; critique/factcheck are verified exceptions); critique loop and queue check gate deduplicated into `_shared/` modules; lp-do-plan phase numbering coherent; lp-do-critique Offer Lens extracted to module
- **Source:** operator
