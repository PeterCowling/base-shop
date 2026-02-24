---
Type: Forecast-Summary
Status: Draft
Business: HEAD
Region: Italy
Created: 2026-02-12
Updated: 2026-02-12
Last-reviewed: 2026-02-12
Owner: Pete
Source: docs/business-os/strategy/HEAD/headband-90-day-launch-forecast-v2.user.md
Review-trigger: After each completed build cycle touching this document.
---

# HEAD Launch (90 Days) - Executive Cut (v2)

## Decision

Launch HEAD with channel authority from `DEC-HEAD-CH-01`: own-site DTC primary, constrained marketplace probes, and strict week-1/week-2 recalibration before any scale step.

## Proposed 90-Day Targets

- Net orders: ~110 (P50)
- Net revenue: ~EUR 3,000 (P50)
- Session target: >=6,000 total sessions by day 90
- Returns: <=7%
- Efficiency guardrails: blended CAC <=EUR 13 by day 60 and paid CAC <=EUR 25 by day 90

## Why This Is Plausible

- Italy TAM estimate for cochlear-implant users is small (~17k), so niche reach can be achieved without large spend.
- Competitor anchors exist from EUR 12 to EUR 28.80, giving room for differentiated value, trust, and localization positioning.
- Base conversion assumptions sit within directional Italy ecommerce benchmark ranges, but must be validated with first-party data.

## Critical Risks

1. Paid CAC exceeds contribution on low-AOV single-SKU economics.
2. Fit/compatibility ambiguity causes returns and support load.
3. Checkout/payment friction reduces conversion in a narrow TAM niche.

## Mandatory First-14-Day Checks

1. Validate inventory + shipping SLA.
2. Confirm multi-method payment success across real transactions.
3. Run capped channel tests (high-intent search + retargeting) and track CAC/CVR daily.
4. Tag return reasons from day 1 and fix top failure modes before scale.

## Decision Rule

- If CAC/CVR/returns/payment indicators are inside guardrails after week-2 sampling thresholds, continue controlled scale.
- If not, hold spend expansion, run a focused fix sprint, then re-forecast from observed data.
- Reopen channel-surface mode only via `DEC-HEAD-CH-01` trigger conditions.
