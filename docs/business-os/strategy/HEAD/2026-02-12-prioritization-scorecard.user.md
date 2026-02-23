---
Type: Prioritization-Scorecard
Status: Active
Business: HEAD
Date: 2026-02-20
Owner: Pete
Seed-Source: docs/business-os/startup-baselines/HEAD-forecast-seed.user.md
business: HEAD
artifact: prioritization_scorecard
status: Active
owner: Pete
last_updated: 2026-02-20
source_of_truth: true
depends_on:
  - docs/business-os/startup-baselines/HEAD-offer.md
  - docs/business-os/startup-baselines/HEAD/S3-forecast/2026-02-20-lp-forecast.user.md
  - docs/business-os/startup-baselines/HEAD-channels.md
  - docs/business-os/strategy/HEAD/lp-other-products-results.user.md
decisions:
  - DEC-HEAD-CH-01
---

# HEAD Prioritization Scorecard (Refresh 2026-02-20)

## A) Scoring Rubric

Scale: 0-5 per criterion.

- Outcome impact
- Speed to value
- Confidence
- Dependency complexity (inverse: higher = lower complexity)
- Risk if delayed
- Validation leverage

## B) Scored Item Table

| Item | Impact | Speed | Confidence | Dependency | Delay risk | Validation leverage | Weighted score | Priority |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Launch school-ready multi-pack headbands (MVP) | 5 | 4 | 4 | 4 | 5 | 5 | 27 | P1 |
| Launch activity organiser pouch (MVP) | 5 | 4 | 4 | 3 | 4 | 5 | 25 | P1 |
| Launch identity patch packs (MVP) | 4 | 5 | 4 | 4 | 3 | 4 | 24 | P1 |
| Keep analytics/payment reliability baseline decision-grade | 5 | 4 | 4 | 3 | 5 | 5 | 26 | P1 |
| Complete naming clearance and lock masterbrand | 4 | 3 | 3 | 2 | 4 | 3 | 19 | P2 |
| Safety engineering + governance pack for tether-class lane | 5 | 2 | 2 | 1 | 4 | 4 | 18 | P2 |

## C) Top Backlog (P1/P2/P3)

| Priority | Item | Why now | Acceptance criteria | Dependencies | Evidence refs |
|---|---|---|---|---|---|
| P1 | Multi-pack headbands MVP | Highest demand fit with low claim-drift risk | SKU set live with size guidance and wash-cycle QA signoff | Existing headband pattern + packaging | `docs/business-os/strategy/HEAD/lp-other-products-results.user.md` |
| P1 | Organiser pouch MVP | Strong AOV and routine-friction reducer | 2-size pouch line live; compartment/zip QA complete | Pattern sampling + content assets | `docs/business-os/strategy/HEAD/lp-other-products-results.user.md` |
| P1 | Patch packs MVP | Fast attach-rate and repeat mechanism | 3 themed packs live with age-safe attachment controls | Patch supplier + attachment QA | `docs/business-os/strategy/HEAD/lp-other-products-results.user.md` |
| P1 | Analytics + payment reliability baseline | Protects denominator quality for all channel decisions | Daily KPI set includes CVR/CAC/payment success/returns and is reviewed | Tracking + checkout verification | `docs/business-os/contracts/HEAD/outcome-contract.user.md` |
| P2 | Naming clearance lane | Required before final brand lock and scale creative | One shortlisted coined mark passes TM/domain gate with fallback | Shortlist + counsel input | `docs/business-os/strategy/HEAD/2026-02-20-candidate-names.user.md` |
| P2 | Tether safety/governance lane | High customer impact but high safety/intent risk | Safety design spec + warning language + legal review complete | Engineering + legal review | `docs/business-os/strategy/HEAD/lp-other-products-results.user.md` |

## D) Deferred Items and Rationale

- Amazon expansion lane: deferred until own-site + Etsy contribution comparison clears trigger thresholds.
- Tether-class consumer launch: deferred until safety and copy-governance gate is complete.
- Additional seasonal variants (water-day and winter): deferred to month 3+ after MVP execution data.

## E) Execution Recommendation

Run `lp-do-fact-find -> lp-do-plan -> lp-do-build` first on:
1. MVP productisation for multi-pack headbands, organiser pouch, and patch packs.
2. Analytics/payment reliability and returns taxonomy hardening.
3. Naming clearance decision memo and final masterbrand lock.

