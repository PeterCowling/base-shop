---
Type: Pattern-Reflection
Feature-Slug: reception-till-drawer-lock
Review-date: 2026-03-01
artifact: pattern-reflection
---

# Pattern Reflection — reception-till-drawer-lock

## Patterns

- **pattern_summary:** Modal component created by cloning existing component; no template codified
  **category:** ad_hoc
  **routing_target:** defer
  **occurrence_count:** 1
  **evidence_refs:** ["docs/plans/reception-till-drawer-lock/results-review.user.md"]
  **idea_key:** reception-manager-modal-template
  **Notes:** DrawerOverrideModal was built by direct transposition from VarianceSignoffModal. If a third manager-credential modal is needed, a shared template or hook would reduce duplication. Not yet at occurrence threshold for loop_update routing.

- **pattern_summary:** Pre-staged files from parallel agents swept into task commits
  **category:** ad_hoc
  **routing_target:** defer
  **occurrence_count:** 2
  **evidence_refs:** ["docs/plans/reception-till-drawer-lock/build-record.user.md"]
  **idea_key:** writer-lock-staging-loss
  **Notes:** Multiple TASK-0X changes were committed by other agents because this agent's staging area was captured when the other agent acquired the writer lock and committed all staged files. This is a writer-lock protocol gap — background commit attempts lose staging when the shell environment is forked. The pattern has now recurred across at least two builds and warrants surfacing as a loop process issue. Routed defer pending a second occurrence in a different plan.

## Access Declarations

None identified.
