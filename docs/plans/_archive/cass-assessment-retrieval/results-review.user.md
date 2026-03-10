---
Type: Results-Review
Status: Draft
Feature-Slug: cass-assessment-retrieval
Review-date: 2026-03-02
artifact: results-review
---

# Results Review

## Observed Outcomes
- `DEFAULT_SOURCE_ROOTS` in `scripts/src/startup-loop/cass-retrieve.ts` now has 4 entries: the original 3 plus `"docs/business-os/strategy"`. Every subsequent `pnpm startup-loop:cass-retrieve` invocation will search 104 additional `.user.md` files (brand identity, solution decisions, naming specs, business plans across 9 businesses) without any change to caller invocation patterns.
- `DEFAULT_SOURCE_ROOTS` is now exported, making it assertable in unit tests. Three new tests covering the new entry, regression guard for originals, and exact count gate are live in CI.
- Runbook `docs/runbooks/startup-loop-cass-pilot.md` updated with a `## Default Source Roots Coverage` table that explicitly documents all 4 roots and the topK=8 advisory-only framing.

## Standing Updates
- `docs/runbooks/startup-loop-cass-pilot.md`: updated — source roots coverage table added. No further standing artifact changes required; the operational change takes effect automatically on next invocation.

## New Idea Candidates
<!-- Scan for: new standing data source, new open-source package, new skill, new loop process, AI-to-mechanistic -->
- Per-business strategy scope filter — when corpus grows beyond ~200 files, alphabetical bias may surface wrong-business snippets; a `--business <BIZ>` filter on DEFAULT_SOURCE_ROOTS could scope rg to the relevant subdirectory | Trigger observation: alphabetical bias risk noted in plan Risks section; deferred with explicit rationale | Suggested next action: defer until cross-business noise observed in telemetry
- AI-to-mechanistic: the advisory-only framing in cass-context.md headers could be auto-validated by a script that checks retrieved snippets are from the correct business subdir when `--business` is passed | Trigger observation: advisory framing is currently operator-trust-based with no enforcement | Suggested next action: spike

## Standing Expansion
No standing expansion: the change is a runtime configuration update to `cass-retrieve.ts`. No new standing artifact required; the runbook update closes the documentation gap.

## Intended Outcome Check

- **Intended:** CASS retrieval extended to index assessment containers, so fact-finds and plans for a business automatically receive relevant assessment-layer context (brand decisions, solution evaluations, naming specs) without manual retrieval steps.
- **Observed:** `docs/business-os/strategy/` is now in `DEFAULT_SOURCE_ROOTS`. Every future `pnpm startup-loop:cass-retrieve` invocation searches the 104-file assessment corpus. The next fact-find for any business will include strategy snippets in `cass-context.md` when query terms match. No caller changes required.
- **Verdict:** Met
- **Notes:** Full verification of snippet quality requires observing a real fact-find output — the unit tests assert configuration correctness, not retrieval quality. This is an acceptable constraint for this scope.
