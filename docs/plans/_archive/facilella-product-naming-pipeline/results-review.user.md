---
Type: Results-Review
Status: Draft
Feature-Slug: facilella-product-naming-pipeline
Review-date: 2026-02-26
artifact: results-review
---

# Results Review — Facilella Product Naming Pipeline

## Observed Outcomes

- A product naming spec was produced and validated: 5 territories, DWPEIC 6-dimension scoring (max 30), EU MDR hard blockers, compound phonetic constraint, and a pre-generation territory integrity gate. The spec is agent-executable and reusable for Round 2 generation if needed.
- 72 scored product name candidates were generated across 5 territories. 3 candidates were eliminated during generation. All 72 pass the I hard gate (I ≥ 4). The top scorers (Archella 28/30, Nastella 28/30) are coined fragment-blend forms from the Italian Product-Type territory — the compound feminised diminutive pattern proves highly effective for this brand structure.
- A TM pre-screen direction CLI (`tm-prescreen-cli.ts`) was built and run against the top 20 candidates. The EUIPO/WIPO/UIBM direction URLs are generated without making live HTTP requests (direction-only, as designed). The UIBM deep-link URL was not confirmed — the CLI outputs the base URL with manual instructions.
- The sidecar event infrastructure was extended with the `tm_prescreened` stage and `TmPrescreenRecord` type. The extension is fully additive — no existing company naming events or CLI code was affected.
- The ASSESSMENT-13 SKILL.md now points operators to this pipeline for cases requiring a rigorous shortlist. The ASSESSMENT-13 artifact Section B was updated with pipeline scores for all 5 seeds and the top 5 pipeline candidates surfaced for operator selection.
- **Pending operator action:** TM pre-screen searches not yet completed (operator action required: visit EUIPO, WIPO, UIBM URLs in `product-naming-tm-2026-02-26.txt`). Operator selection in `product-naming-shortlist-2026-02-26.user.md` pending.

## Standing Updates

- `docs/business-os/strategy/HEAD/2026-02-26-product-naming.user.md` — Section B updated with pipeline scores and shortlist candidates. TM pre-screen status updated. Done in Wave 4.
- No other standing-information (Layer A) files require update from this build — the pipeline spec, candidates, and shortlist are new artifacts, not corrections to existing standing data.

## New Idea Candidates

- Product naming pipeline as a reusable skill | Trigger observation: the facilella-product-naming-pipeline plan was designed as a standalone pipeline analogous to the company naming pipeline, but no `lp-do-product-naming-pipeline` skill exists — each future business that wants a rigorous product naming run would need to re-plan from scratch | Suggested next action: create a skill document at `.claude/skills/lp-do-product-naming-pipeline/SKILL.md` encoding this pipeline as a repeatable agent workflow (spec → generate → TM direction → shortlist)
- UIBM deep-link URL format research | Trigger observation: the CLI outputs the UIBM base URL with a manual-entry instruction because no confirmed query-parameter format was found. If UIBM supports a deep-link (e.g., `?denominazione=<name>` or `?query=<name>`), the CLI could pre-fill the search | Suggested next action: spike — navigate to uibm.gov.it/bancadati manually and inspect the URL when searching for a term; update `buildUibmUrl()` in `tm-prescreen-cli.ts` if a deep-link format is confirmed

## Standing Expansion

No standing expansion: this build produces new pipeline artifacts (spec, candidates, shortlist, CLI tooling) rather than updating an existing standing-information domain. The ASSESSMENT-13 artifact was updated as part of Wave 4 (TASK-06), which is within scope of this build. No new Layer A standing artifact category is needed.

## Intended Outcome Check

- **Intended:** A product naming pipeline producing a spec file, a generation run of scored candidates, a TM pre-screen direction document, and a shortlist of candidates ready for operator selection. Pipeline tooling persisted as reusable TypeScript and spec infrastructure.
- **Observed:** Spec file produced and validated. 72 scored candidates generated (3 eliminations; English Loan territory at 11 rather than target 15 — minor shortfall, second-round supported). TM direction CLI built and run against top 20. Sidecar events written. Shortlist artifact produced with curator's analysis. ASSESSMENT-13 artifact updated. Operator selection still pending (TM search not yet completed by operator — this is expected at build completion; operator action is the downstream step).
- **Verdict:** Met
- **Notes:** The 72-candidate count vs. planned 75 is a minor shortfall (3 eliminations) within pipeline design — the spec explicitly supports second-round generation. All core deliverables produced and validated.
