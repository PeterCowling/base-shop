# Naming Pipeline — What Changed and How to Use It

*Last updated: 2026-02-26*

---

## What changed

The naming pipeline has been upgraded in four areas. From your perspective as the operator running naming rounds, the day-to-day process looks identical — the changes are mostly about reliability and data collection. Here is what is different:

**Domain checks are more reliable.**
Previously, if the domain availability check timed out or hit a connectivity issue, the failure was sometimes silent — a name could appear to have no domain check result when in fact the check had simply not completed. Now, any name where the check could not finish is clearly labeled as "unknown" with the specific reason. The check will also retry automatically before giving up. You will see fewer ambiguous results.

**A probability score now appears alongside existing scores.**
Each name in the pipeline now carries an additional annotation: an estimated probability that the name would pass the shortlist criteria (domain available, scores well across dimensions). This is shown as an extra data point. It does not affect which names you see, which pass through, or how the shortlist is ordered. You are still in full control of selection.

**The pipeline suggests how many names to generate for a round.**
Based on the history of how many generated names typically clear domain availability checks, the pipeline now calculates and notes a recommended candidate count before each round. This appears in the round notes. It is advisory — you can follow it or ignore it entirely.

**Candidate events are logged per round.**
Each time a name enters a stage (generated, domain-checked, shortlisted, or selected), a record is written. This happens silently. It does not change any output files you currently see. The purpose is to build a data trail so future rounds can be evaluated more precisely.

---

## What has NOT changed

- The shortlist you receive is in the same format as always: top 20 names with D/W/P/E/I dimension scores.
- The domain check result file (`naming-rdap-<date>.txt`) uses the same format.
- Your review process is unchanged. You review the shortlist and say which name you want to proceed with, or "none of these work."
- Nothing is hidden from you. No names are excluded, re-ranked, or filtered by any of the new components.

---

## The probability score — what it means

The probability score is based on the pipeline's accumulated history of which types of names ended up with an available domain and scored well across the naming dimensions. It is a number between 0 and 1:

- **0** means the pipeline estimates this name is very unlikely to clear both the domain check and the dimension scoring bar.
- **1** means the pipeline estimates this name is highly likely to clear both.

It is shown alongside the existing scores as an additional data point. It does not gate names — a name with a low probability score still appears in the shortlist if it scores well on D/W/P/E/I and its domain is confirmed available. Do not use this score as a substitute for your own judgment. It is a background signal, not a recommendation.

---

## When will this change how rounds are run?

Not yet. For now, all new features are collecting data in the background. The pipeline runs exactly as it did before. After at least two more naming rounds using the new pipeline, there will be a structured review to decide whether any outputs should become active recommendations (for example, whether the suggested candidate count should become a default rather than a note). Until that review happens, nothing changes in how you run a round.

---

## Interpreting the domain check "unknown" status

If the domain check for a name returns "unknown," it means the check could not confirm or deny whether the domain is registered. The usual causes are: a timeout, a connectivity issue, or the registry returning an unexpected response.

Names with an "unknown" domain check are excluded from the shortlist by default. In previous rounds this sometimes appeared as `ERROR(000)` in the RDAP output file; it now consistently appears as `UNKNOWN(code)` with the specific reason visible, so you can understand what happened.

If you see a name you like that was excluded due to an "unknown" check, you can re-run the domain check manually for that name using the same bash script used in previous rounds. The pipeline does not prevent you from doing this.

---

## Fallback path

If you need to run a naming round without the upgraded tooling — for example, if the tooling is unavailable — the process is identical to previous rounds:

1. Generate candidate names.
2. Run the domain availability check using the bash script in the naming workflow.
3. Score remaining names by the D/W/P/E/I rubric.
4. Present the top 20 to yourself or a reviewer.

No part of your review or decision process depends on the new components. They are additions, not dependencies.

---

## Non-legal notice

The pipeline does not provide legal clearance or trademark advice. A domain confirmed as available by the availability check is not a trademark clearance. Always conduct trademark pre-screening before committing to any name.
