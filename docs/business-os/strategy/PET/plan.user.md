---
Type: Business-Plan
Status: Active
Business: PET
Created: 2026-02-11
Updated: 2026-02-12
Last-reviewed: 2026-02-12
Owner: Pete
---

# Pet Product — Business Plan

## Strategy

### Current Focus (2026-02-12)

1. **Active Outcome Contract (Locked)** (Priority: High)
   - Outcome-ID: `PET-OUT-2026Q1-01`
   - Outcome: Achieve first reliable PET sales in Italy via pre-website execution, then stabilize contribution-positive growth with bundle/attach economics.
   - Baseline (2026-02-12): orders 0, gross revenue EUR 0, blended CAC unmeasured, returns unmeasured.
   - Target by 2026-05-13: 178 orders, EUR 5,874 gross revenue incl VAT.
   - CAC guardrail: blended CAC <= EUR 12 by day 60; maintain blended CAC <=70% of observed contribution/order pre-ads.
   - Owner: Pete
   - Decision Link: `DEC-PET-01` (scale spend/channel breadth vs hold and fix).

2. **Category and Segment Prioritization** (Priority: High)
   - Status: Initial category options exist but no ranked decision set.
   - Next: Rank target segment and define primary offer scope for first validation cycle.
   - Artifact: `docs/business-os/strategy/PET/italy-90-day-launch-forecast-v2.user.md`
   - Exec Summary: `docs/business-os/strategy/PET/italy-90-day-launch-forecast-v2-exec-summary.user.md`

3. **Evidence and Tooling Baseline** (Priority: Medium)
   - Status: Baseline contract is now frozen; observed channel economics and operations reliability still need week-1/week-2 data.
   - Next: Enforce weekly scorecard and run mandatory recalibration gates.
   - Dry-run Evidence: `docs/business-os/strategy/PET/2026-02-11-week2-gate-dry-run.user.md`
   - Action Backlog: `docs/business-os/strategy/PET/launch-readiness-action-backlog.user.md`

### 90-Day Outcome Contract (Frozen on 2026-02-12)

- Sales target: 178 orders and EUR 5,874 gross revenue incl VAT by 2026-05-13.
- CAC guardrail: blended CAC <= EUR 12 by day 60; blended CAC must stay <=70% of observed contribution/order pre-ads.

#### Weekly leading indicators

| Indicator | Definition | Weekly guardrail |
|---|---|---|
| Sessions (all channels) | Total tracked sessions | >=900 sessions by week 4 |
| CVR (7-day trailing) | Orders / sessions | >=1.5% target; 1.2% floor |
| Blended CAC (7-day trailing) | Paid spend / all orders | <=EUR 12 |
| Contribution guardrail | Blended CAC / contribution per order pre-ads | <=70% |
| Payment success rate | Successful payments / attempts | >=97% (decision-valid at >=100 attempts) |
| On-time ship rate | On-time shipments / shipments | >=95% |
| Return rate (30-day trailing) | Returned orders / shipped orders | <=8% (decision-valid at >=25 shipped orders) |

#### Kill/Pivot thresholds (enforced)

1. If CVR is below 1.2% after >=500 sessions and >=10 orders in a 7-day window, switch to fix-first mode before adding spend.
2. If blended CAC exceeds 70% of observed contribution/order pre-ads, stop cold expansion and keep retargeting only.
3. If return rate exceeds 8% after >=25 shipped orders, hold growth and remediate offer/operations quality.
4. If on-time ship rate drops below 95%, hold growth until SLA recovers.
5. If payment success drops below 97% after >=100 attempts, pause traffic increases until checkout reliability recovers.
6. If denominator thresholds are not met, mark gates `insufficient-sample` and extend observation before scale decisions.

## Risks

### Active Risks

- **Category Dilution** (Severity: High, Added: 2026-02-11)
  - Source: Broad category exploration without a constrained first bet.
  - Impact: Slow learning and fragmented execution.
  - Mitigation: Narrow scope to one primary segment and one validation channel.

- **Unmeasured Unit Economics** (Severity: Medium, Added: 2026-02-11)
  - Source: Contract is frozen but observed unit economics are still week-0.
  - Impact: Risk of scaling low-margin work.
  - Mitigation: Enforce contribution/CAC gate before expansion decisions.

## Opportunities

### Validated (Ready for Cards)
_None yet — to be populated by Cabinet sweeps_

### Under Investigation
_None yet_

## Learnings

_No learnings recorded yet. This section is append-only — learnings are added after card reflections._

## Metrics

### Commercial Signals (Established: 2026-02-12)

- **Qualified Demand:** Week-0 baseline
  - Target: >=900 sessions/week by week 4
  - Measurement: Sessions by channel (weekly)

- **Conversion Signal:** Week-0 baseline
  - Target: >=1.5% CVR (7-day trailing), hard floor 1.2%
  - Measurement: Orders / sessions (weekly)

- **Economics Signal:** Week-0 baseline
  - Target: blended CAC <=EUR 12 and <=70% of contribution/order pre-ads
  - Measurement: Paid spend, orders, contribution tracker (weekly)

- **Reliability Signal:** Week-0 baseline
  - Target: payment success >=97%, on-time ship >=95%, return rate <=8%
  - Measurement: Checkout + operations logs (weekly)
