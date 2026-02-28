---
Type: Results-Review
Status: Complete
Feature-Slug: process-improvements-completion-lifecycle
Business-Unit: BOS
Review-date: 2026-02-26
artifact: results-review
---

# Results Review: process-improvements-completion-lifecycle

## Observed Outcomes

- The process-improvements generator now skips ideas that appear in `docs/business-os/_data/completed-ideas.json` — the registry key match is derived from source path + title, making it stable across regenerations.
- Struck-through bullets (`~~text~~`) in results-review files are suppressed at generation time with a stderr warning identifying the source file.
- `appendCompletedIdea()` is exported and idempotent — calling it twice for the same idea produces one registry entry, not two.
- The `lp-do-build` completion step now explicitly instructs agents to record completed ideas in the registry after archiving, closing the feedback loop that caused completed ideas to reappear indefinitely.
- 9/9 tests pass including 4 new completion lifecycle tests.
- The `~~Add view_item_list assertions to the Playwright smoke test~~` idea no longer appears in the live report (suppressed via the strikethrough filter path).

## Standing Updates

- `docs/business-os/_data/completed-ideas.json`: new standing registry file — must be updated by `appendCompletedIdea()` call in each future build completion step when ideas are directly actioned.
- `.claude/skills/lp-do-build/SKILL.md`: Plan Completion step updated — now instructs agents to call `appendCompletedIdea()` for each directly-delivered idea candidate.

## New Idea Candidates

- Backfill older completed ideas into the registry | Trigger observation: many historical results-review files have ideas that have been actioned but are still appearing in the report (51 ideas shown, unknown fraction already done) | Suggested next action: manual audit pass or INVESTIGATE task to identify and backfill the highest-priority completed entries
- None for the other four categories.

## Standing Expansion

- No standing expansion: the registry file itself is the standing artifact. No new Layer A data source is warranted.

## Intended Outcome Check

- **Intended:** Completed ideas no longer appear in the process-improvements report after the generator runs. `completed-ideas.json` registry is the single source of truth. `appendCompletedIdea()` is callable. Strikethrough ideas are suppressed. All filtering covered by unit tests. Drift check passes.
- **Observed:** All outcome contract criteria met and verified. Generator filters both registry-matched and struck-through ideas. 9/9 tests pass. Lint and typecheck clean. Drift check passes on current repo state.
- **Verdict:** Met
- **Notes:** n/a
