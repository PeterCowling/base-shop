# Resume Logic and New Round

## Resume logic

If the pipeline is interrupted or rerun, check which parts are already complete:

| Condition | Resume from |
|-----------|-------------|
| No spec exists | Part 1 |
| Spec exists, no candidates file | Part 2 |
| Candidates file exists, no TM direction file | Part 3 |
| TM direction file exists, no shortlist | Part 4 |
| Shortlist exists | Pipeline complete — await operator review |

When resuming from Part 2 after a new round, use a new date-stamped candidates filename so prior rounds are preserved.

---

## New round

A new round is triggered in two ways:

**Automatically** — if the quality gate finds fewer than 10 candidates with score ≥ 18 after Part 4.

**User-triggered** — if the operator reviews the shortlist and rejects it (says "none of these work", "try again", "I don't like these", or equivalent). If the operator says why (e.g., "too clinical", "doesn't sound Italian enough"), capture that as a rejection note and encode it as an additional anti-criterion in the next round's spec.

**New round procedure:**
1. Add all names from the current candidates file to §5.3 of the spec (reason: "operator rejected" for names the operator did not want; "TM conflict" for names where the operator confirmed a conflict after TM review).
2. Increment the round counter in the spec.
3. Re-run Parts 2–4 with a fresh date stamp. Do not re-run Part 1 unless the ICP or product has changed.
4. Present the new shortlist.

There is no cap on the number of rounds.
