# Naming Pipeline Upgrade — First Readout

*Last updated: 2026-02-26*

---

## What this readout covers

This is the first data point for the upgraded naming pipeline. It covers what was built and validated before any live naming rounds were run through the new setup. Because no naming rounds have been completed using the new pipeline yet, the operational metrics (how often rerounds happen, how many names make the final shortlist, whether rankings are consistent) cannot be measured yet. Those columns will be filled in after the first live round.

The one metric that can already be assessed — the probability signal's calibration — has been checked against historical data and passes the reliability threshold.

---

## Metrics comparison

| Metric | Before the upgrade | After the upgrade | Status |
|---|---|---|---|
| Reround rate (how often a round produces no finalist) | HEAD: at least 4 rerounds in 6 confirmed rounds. HBAG: unknown — only one round artifact available. | Not yet measured — no live rounds completed. | Pending first live round |
| Viable finalist yield (how many shortlisted names the operator selected from) | Not recorded in any round. Selection was not logged. This was identified as a gap. | Not yet measured. | Pending first live round |
| Ranking consistency (do similar inputs produce similar rank orders?) | Not measured before the upgrade. | Not yet measured. | Pending first live round |
| Probability signal reliability (does a higher score actually predict a better outcome?) | Not applicable — no such signal existed before. | Score: 0.1589 on historical data. Threshold: below 0.35 to pass. **Pass.** Note: measured on historical proxies only, not live operator selections. | Pass — ready to collect live data |

---

## What was known before the upgrade

**HEAD naming history (6 confirmed rounds):**
Domain availability varied significantly across rounds — from around 15% (rounds with a difficult vocabulary cluster) to around 60% (early rounds where more name space was unused). Averaged across the four rounds with full data, roughly 39% of generated names cleared the domain check. Head ran 6 rounds total, which means at least 4 rounds did not produce a finalist on the first attempt.

**HBAG naming history (3 confirmed rounds):**
The most recent round with a confirmed artifact had 75% domain availability, likely because HBAG names tend to use longer token combinations where unused space is larger. Data from earlier rounds was not available for comparison.

**What was not tracked:**
How many names from each shortlist the operator actually selected — that is, whether a name from the top 20 was taken forward — was never logged. Time per stage (generation, domain check, review) was also not tracked. Both are now logged automatically.

---

## What is now measurable that wasn't before

From the first live round onward, the pipeline will record:

- **Per-candidate history:** each name generates a record at each stage it passes through — generated, domain-checked, shortlisted, or selected. This makes it possible to calculate yield and reround rate precisely.
- **Domain check reliability:** names where the check could not complete are now flagged explicitly rather than silently dropped. The rate of unresolvable checks can be tracked.
- **Probability signal alongside selections:** once an operator selects a name, that selection can be compared against the probability score to assess whether the signal is useful.
- **Recommended candidate count:** the pipeline now suggests how many names to generate based on historical availability rates. Whether operators follow this recommendation and whether it affects outcomes can be assessed after a few rounds.

---

## What needs to happen before any of this becomes an active recommendation

For the pipeline to move from background data collection to active recommendations (for example, the probability signal influencing what is shown, or the candidate count recommendation becoming a default), the following needs to be true:

1. At least two naming rounds completed using the new pipeline.
2. At least one round where the operator selected a finalist name, so that selection logging can be confirmed working end to end.
3. The domain check unknown rate confirmed below 1% in live conditions (not just historical data).
4. The probability signal reviewed: does it correlate with what the operator actually preferred? The current score (0.1589) was measured on historical data only — it has not yet been tested against live operator selections.

Until all four conditions are met, everything new runs silently in the background. Nothing in the operator workflow changes.

---

## Scope of what was rolled out

- All new features are in observation mode only. The probability signal and the recommended candidate count are annotations that appear in background records, not in operator-facing outputs.
- No names are hidden, re-ranked, or excluded based on any new output.
- The existing shortlist format, domain check, and scoring rubric work identically to previous rounds.
- The upgrade is reversible. If the new tooling becomes unavailable, rounds can be run identically to how they were run before.
