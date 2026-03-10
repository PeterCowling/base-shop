# Results Review

## Observed Outcomes
- Publish now follows the hosted draft snapshot rather than browser draft JSON.
- The operator cannot publish with unsaved image autosave or without a saved revision token.
- Partial-success writeback failures remain fail-open operationally, but they are now visible in publish feedback instead of being silently swallowed.

## Standing Updates
- None.

## New Idea Candidates
- None.

## Intended Outcome Check
- Verdict: Passed.
- Evidence: client guard added for unsaved publish, route contract changed to `draftId` plus `ifMatch`, and XA scoped validation passed.
