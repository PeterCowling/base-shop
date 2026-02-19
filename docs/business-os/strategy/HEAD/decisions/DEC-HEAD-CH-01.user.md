---
Type: Strategy-Decision
Status: Active
Decision-ID: DEC-HEAD-CH-01
Business: HEAD
Created: 2026-02-19
Updated: 2026-02-19
Last-reviewed: 2026-02-19
Owner: Pete
Depends-on:
  - docs/business-os/contracts/HEAD/outcome-contract.user.md
  - docs/business-os/startup-baselines/HEAD-intake-packet.user.md
  - docs/business-os/market-research/HEAD/2026-02-12-market-intelligence.user.md
  - docs/business-os/strategy/HEAD/headband-90-day-launch-forecast-v2-exec-summary.user.md
---

# DEC-HEAD-CH-01 - Channel Surface Decision

## Decision State

- State: Decided (Active)
- Primary channel surface: `own_site_dtc`
- Secondary channel mode: constrained marketplace probes (Etsy first, Amazon only if operationally feasible)
- Effective date: 2026-02-19
- Owner: Pete

## Decision Statement

HEAD will run **own-site DTC as the primary learning and conversion surface** for the first 90-day window. Marketplace activity is allowed only as a constrained probe track to collect demand and pricing signal without replacing own-site as the primary execution surface.

## Evidence Basis

- Intake and strategy posture prioritize own-site execution speed and direct learning loops.
- Market intelligence confirms marketplace demand signal and competition pressure, but also highlights trust/compliance and support requirements that must be controlled in the owned flow.
- Forecast execution requires week-1/week-2 measured recalibration; this is easiest to enforce with own-site denominator control.

## Trigger to Reopen This Decision

Reopen `DEC-HEAD-CH-01` if one of the following holds after minimum sampling thresholds:

1. Own-site CVR remains below 0.9% after >=500 sessions in a 7-day window and two focused conversion-fix iterations.
2. Payment success remains below 97% after >=100 attempts despite checkout remediation.
3. Constrained marketplace probes produce materially better contribution economics than own-site (>=25% better contribution per order) across >=30 fulfilled orders.

## Next Evidence Required (Week 1-2)

- Channel-split sessions, CVR, paid CAC, blended CAC, payment success, and return reasons.
- Probe-specific marketplace economics snapshot (orders, fees, net contribution, support load).
- Explicit recommendation: keep `own_site_dtc`, switch to `hybrid`, or escalate to marketplace-led mode.

## Fallback Action

If trigger conditions are met before week-2 confidence thresholds, hold spend expansion, run a focused reliability/conversion sprint, and rerun the decision with updated evidence.
