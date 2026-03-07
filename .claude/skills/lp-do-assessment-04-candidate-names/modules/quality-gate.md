# Quality Gate and New Round Logic

## Quality gate (before declaring pipeline complete)

- [ ] `<YYYY-MM-DD>-naming-generation-spec.md` updated today
- [ ] `naming-candidates-<date>.md` contains ≥ 240 rows with scores
- [ ] `naming-rdap-<date>.txt` contains a result line for every name in the candidates file
- [ ] `naming-shortlist-<date>.user.md` contains ≥ 10 AVAILABLE names with score ≥ 14
- [ ] All Pattern D entries in the shortlist list both spoken name and domain string
- [ ] If quality gate fails (< 10 available names scoring ≥ 14): trigger new round automatically

If the shortlist contains 0 names with score ≥ 14, or fewer than 5 available names total, trigger a new round: run Part 1 to add the current candidates to the elimination list, then re-run Parts 2–4 with a fresh date.

---

## New round

A new round is triggered in two ways:

**Automatically** — if the quality gate finds fewer than 10 available names with score ≥ 14 after Part 4. The pipeline cannot deliver a credible shortlist from this result.

**User-triggered** — if the operator reviews the shortlist and rejects it (says "none of these work", "try again", "I don't like these", or equivalent). The operator may optionally say *why* (e.g. "too clinical", "wrong feel", "too similar to each other") — if they do, capture that as a **rejection note** and encode it as an additional anti-criterion in the next round's spec.

**New round procedure:**
1. Add all names from the current candidates file to §5.3 of `<YYYY-MM-DD>-naming-generation-spec.md` as eliminated (reason: "domain taken" for RDAP-failed names; "operator rejected" for RDAP-available names the operator did not want). If a rejection note was given, add it as a new bullet under §6 Anti-Criteria.
2. Increment the round counter in the spec frontmatter.
3. Re-run Parts 2–4 with a fresh date stamp. Do not re-run Part 1 unless the ICP or product has changed.
4. Present the new shortlist to the operator.

There is no cap on the number of rounds. Each round adds all prior candidates to the elimination list, so the generation agent always works from a fresh search space.
