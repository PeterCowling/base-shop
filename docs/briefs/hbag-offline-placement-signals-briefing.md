---
Type: Briefing
Outcome: Understanding
Status: Active
Domain: Business
Created: 2026-03-09
Last-updated: 2026-03-09
Topic-Slug: hbag-offline-placement-signals
---

# HBAG Offline Placement Signals Briefing

## Executive Summary

HBAG already has several places that expect first-party demand data, including in-destination sales, but the current host structure is weak for this specific signal. The immediate sale at Luisa Positano should update the HBAG business plan, forecast seed, channel strategy, demand evidence pack, and the pending in-destination trial task because the loop currently still states that HBAG has zero historical sales and that in-destination evidence is future-only. The main structural gap is that the expected `docs/plans/mini-handbag-pmf/demand-log.md` does not exist, and the loop does not yet have a canonical standing artifact for offline retail placement actuals.

## Questions Answered

- Q1: What existing startup-loop artifacts should record the Luisa Positano placement and first sale?
- Q2: What loop additions are needed so this information has a canonical long-term home?

## End-to-End Flow

### Current intended flow
1. HBAG outcome and metrics expect first-purchase signal tracking via a `demand-log.md`.
   Evidence: `docs/business-os/strategy/HBAG/plan.user.md:62`, `docs/business-os/strategy/HBAG/plan.user.md:78`
2. S6B channel strategy already includes an in-destination Positano lane and explicitly expects weekly logging.
   Evidence: `docs/business-os/startup-baselines/HBAG/channels.md:169`, `docs/business-os/startup-baselines/HBAG/channels.md:173`
3. The demand evidence pack expects first-party data to refresh market-level assumptions once live data exists.
   Evidence: `docs/business-os/startup-baselines/HBAG/demand-evidence-pack.md:179`
4. The forecast seed already treats in-destination sales count as a leading indicator and calls for a live weekly demand tracker.
   Evidence: `docs/business-os/startup-baselines/HBAG/forecast-seed.user.md:31`, `docs/business-os/startup-baselines/HBAG/forecast-seed.user.md:70`
5. TASK-10 in the PMF plan defines the in-destination trial and says sales should be logged by channel.
   Evidence: `docs/plans/mini-handbag-pmf/plan.md:601`

### Current break in the flow

The planned host file is missing, so the loop has references to a demand log but no canonical document currently holding the actuals.

Evidence: `docs/business-os/strategy/HBAG/plan.user.md:68`, `docs/business-os/startup-baselines/HBAG/demand-evidence-pack.md:184`, and filesystem check on `docs/plans/mini-handbag-pmf/demand-log.md` returned missing on 2026-03-09.

## Data & Contracts

### Existing artifacts that should be updated now

- `docs/business-os/strategy/HBAG/plan.user.md`
  - Update baseline from `0 sales / €0` to reflect:
    - placement date: about one week before 2026-03-09
    - first offline sale date: 2026-03-08
    - channel: Luisa Positano boutique
    - unit economics:
      - retail price: `€29`
      - commission rate: `50%`
      - net revenue to Caryina: `€14.50`
      - landed cost: `€3.00`
      - unit contribution after commission and landed cost: `€11.50`
      - contribution margin on net revenue: `79.3%`
  - Why: this is now first-party evidence against the current zero-sales baseline.

- `docs/business-os/startup-baselines/HBAG/forecast-seed.user.md`
  - Update `Baseline` and leading-indicator notes to record that in-destination sales are no longer hypothetical.
  - Add an uncertainty note that the sample is `n=1`, off-season, and therefore signal-positive but not decision-grade.

- `docs/business-os/startup-baselines/HBAG/channels.md`
  - Update Channel C from purely planned to `pilot live`.
  - Add one note that the boutique pilot produced 1 sale in roughly the first week despite low season, which is stronger than expected.

- `docs/business-os/startup-baselines/HBAG/demand-evidence-pack.md`
  - Add a first-party event under the in-destination lane.
  - Move the signal from pure market-level evidence toward mixed market-level plus first-party evidence.
  - Keep GATE-S6B-ACT-01 conservative because denominator is still tiny.

- `docs/plans/mini-handbag-pmf/plan.md`
  - Update TASK-10 status from fully pending to `started` or `partial`.
  - Record that one boutique placement is already live and one first sale has happened.

- `docs/business-os/strategy/HBAG/index.user.md`
  - Add the canonical path for whichever artifact becomes the standing host for offline placement actuals, because the index currently has no row for that.

### Existing artifacts that are too weak as the permanent host

- `docs/plans/mini-handbag-pmf/demand-log.md`
  - This is the current intended host across the plan, business plan, DEP, and forecast.
  - It is missing and is plan-local, which is weak for standing channel actuals.
  - Evidence: `docs/business-os/startup-baselines/HBAG/forecast-seed.user.md:75`, `docs/business-os/startup-baselines/HBAG/demand-evidence-pack.md:184`

## If You Later Want to Change This (Non-plan)

### Recommended loop additions

- Add a canonical standing artifact for channel actuals, not just plan-local logging.
  - Best fit: `docs/business-os/strategy/HBAG/channel-health-log.user.md`
  - Reason: GTM-2 already defines this artifact for active channels and distribution health.
  - Evidence: `docs/business-os/startup-loop/process-registry-v2.md:303`
  - Minimum fields needed for HBAG:
    - channel name
    - partner/store name
    - location
    - placement date
    - units placed
    - units sold
    - retail price
    - commission rate
    - net revenue per unit
    - landed cost per unit
    - contribution per unit
    - stock on hand
    - next check-in date
    - qualitative notes

- Add a canonical message-testing / demand-log artifact.
  - Best fit: formalize CAP-02 for real-world message and channel outcomes.
  - Reason: the capability registry explicitly says the canonical message-variants log is still missing.
  - Evidence: `docs/business-os/startup-loop/contracts/marketing-sales-capability-contract.md:39`, `docs/business-os/startup-loop/contracts/marketing-sales-capability-contract.md:53`
  - For Caryina, this should capture not just DMs and Etsy metrics, but also in-store placement outcomes and price reactions.

- Keep `sales-ops.user.md` optional for now.
  - Reason: CAP-05 is for a managed pipeline. One friendly boutique placement is better modeled first as GTM-2 channel actuals than as a full account pipeline.
  - Evidence: `docs/business-os/startup-loop/schemas/sales-ops-schema.md:44`, `docs/business-os/startup-loop/process-registry-v2.md:323`
  - Trigger to activate later: once HBAG has multiple boutiques/accounts, repeated follow-up, staged outreach, and denominator-based close-rate decisions.

### Key risks

- Treating `1` sale as proof of repeatable demand would be too aggressive; it is an encouraging signal, not validation.
- Leaving the signal only in chat or a plan note would lose it at S10, because the weekly loop relies on standing artifacts and denominator-aware memo inputs.
- Keeping offline channel actuals inside a plan file rather than a standing artifact makes future forecast refreshes and weekly decisioning brittle.

## Unknowns / Follow-ups

- Unknown: how many units were placed in Luisa Positano.
  - How to verify: operator note or first entry in the new channel health log.
- Unknown: whether the sold unit was H1, H2, or H3-style merchandising.
  - How to verify: add SKU/variant field in the actuals log.
- Unknown: whether the boutique arrangement is true consignment or a looser informal commission arrangement.
  - How to verify: record partner terms in `channel-health-log.user.md`.
