---
Type: Business-Plan
Status: Active
Business: HEAD
Created: 2026-02-11
Updated: 2026-02-20
Last-reviewed: 2026-02-20
Owner: Pete
business: HEAD
artifact: strategy_plan
status: Active
owner: Pete
last_updated: 2026-02-20
source_of_truth: true
depends_on:
  - docs/business-os/contracts/HEAD/outcome-contract.user.md
  - docs/business-os/startup-baselines/HEAD-offer.md
  - docs/business-os/startup-baselines/HEAD/S3-forecast/2026-02-20-lp-forecast.user.md
  - docs/business-os/startup-baselines/HEAD-channels.md
  - docs/business-os/market-research/HEAD/2026-02-20-market-intelligence.user.md
decisions:
  - DEC-HEAD-CH-01
---

# Headband — Business Plan

## Strategy

### Current Focus (2026-02-20)

1. **Active Outcome Contract (Canonical)** (Priority: High)
   - Canonical contract (source of truth): `docs/business-os/contracts/HEAD/outcome-contract.user.md`
   - Outcome-ID: `HEAD-OUT-2026Q1-01`
   - Decision Link: `DEC-HEAD-01` (scale paid expansion vs hold and fix).
   - Owner: Pete

2. **MVP Offer Execution (Top-3 Adjacent Products)** (Priority: High)
   - Status: Offer architecture is now backfilled into canonical S2B artifact.
   - Scope: school-ready multi-pack headbands, activity organiser pouch, identity patch packs.
   - Canonical offer: `docs/business-os/startup-baselines/HEAD-offer.md`
   - Research basis: `docs/business-os/strategy/HEAD/lp-other-products-results.user.md`

3. **Channel + Forecast Canonicalization** (Priority: High)
   - Status: S3 and S6B backfill artifacts are now published.
   - Canonical forecast: `docs/business-os/startup-baselines/HEAD/S3-forecast/2026-02-20-lp-forecast.user.md`
   - Canonical channels: `docs/business-os/startup-baselines/HEAD-channels.md`
   - Channel authority remains: `docs/business-os/strategy/HEAD/decisions/DEC-HEAD-CH-01.user.md`

4. **Naming Lock and Brand Finalization** (Priority: Medium)
   - Status: Naming shortlist returned, final legal clearance pending.
   - Next: complete TM/domain/counsel checks and confirm masterbrand.
   - Shortlist artifact: `docs/business-os/strategy/HEAD/2026-02-20-naming-shortlist.user.md`

### 90-Day Outcome Contract (Reference)

All authoritative target, guardrail, and kill/pivot contract values are maintained only in:

- `docs/business-os/contracts/HEAD/outcome-contract.user.md`

This plan consumes that contract and does not redefine outcome target/CAC fields.

## Risks

### Active Risks

- **Copy Drift / Intended-Purpose Risk** (Severity: High, Added: 2026-02-20)
  - Source: Category proximity to medical-device accessories.
  - Impact: Regulatory and trust exposure if messaging drifts into hearing-outcome language.
  - Mitigation: enforce approved non-medical copy guardrails across all channels.

- **Child-Safety Risk on Tether-Class Lane** (Severity: High, Added: 2026-02-20)
  - Source: breakaway/lanyard mechanics require higher design and warning standards.
  - Impact: safety exposure and launch risk.
  - Mitigation: defer tether-class launch until safety engineering and legal review are complete.

- **Measurement Denominator Risk** (Severity: Medium, Added: 2026-02-20)
  - Source: low-sample periods can generate false confidence.
  - Impact: premature scale decisions.
  - Mitigation: enforce weekly denominator thresholds from the outcome contract before scaling.

## Opportunities

### Validated (Ready for Cards)

- Multi-pack headbands as repeatable core lane
- Organiser pouch as AOV anchor and routine stabilizer
- Patch packs as low-risk attachment and repeat driver

### Under Investigation

- Tether-class retention ecosystem (pending safety/governance gate)
- Seasonal water-day and winter variants after MVP signal check

## Learnings

Initial synthesis: range expansion can improve economics without increasing claim risk when expansion is kept in textile/organisation/personalisation lanes first.

## Metrics

### Launch Readiness (Refreshed: 2026-02-20)

- **Demand Signal:**
  - Target: see canonical outcome contract guardrail set
  - Measurement: Sessions by channel (weekly)

- **Conversion Signal:**
  - Target: see canonical outcome contract guardrail set
  - Measurement: Orders / sessions (weekly)

- **Economics Signal:**
  - Target: see canonical outcome contract guardrail set
  - Measurement: Paid spend / orders + blended CAC + bundle attach rate (weekly)

- **Reliability Signal:**
  - Target: see canonical outcome contract guardrail set
  - Measurement: Checkout + operations logs (weekly)
