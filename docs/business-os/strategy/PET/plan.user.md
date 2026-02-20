---
Type: Business-Plan
Status: Active
Business: PET
Created: 2026-02-11
Updated: 2026-02-17
Last-reviewed: 2026-02-17
Owner: Pete
---

# Pet Product — Business Plan

## Strategy

### Current Focus (2026-02-17)

1. **Dog Accessories PMF — Product 1: Dog Poop Bag Holder** (Priority: High)
   - Status: Plan active. Card: PET-001. Plan: `docs/plans/pets-dog-accessories-pmf/plan.md`
   - Product: Premium dog poop bag holder at €80. Mini Birkin-style body + leash clip.
     Same supplier as HBAG. Leash clip confirmed to fit — Pete, 2026-02-17.
   - Brand: TBD — brand name selection pending from `/lp-offer` output
     (Options: **Mio** [recommended], Rue & Hound, Passi).
   - Offer artifact: `docs/business-os/startup-baselines/PET-offer.md`
   - Next: Pete selects brand name → TASK-01 closes → TASK-04 (photography) + TASK-05 (social) unblock.

2. **Category Lock** (Priority: Complete)
   - Status: ✅ Resolved 2026-02-17. Category = dog lifestyle accessories. Product 1 = poop bag holder.
   - Scope: Broad over time — full dog lifestyle accessories line (lead charms, collar accessories,
     travel pouches, grooming, apparel add-ons). Holder is product 1 and the demand signal test.
   - No crossover with HBAG at launch: separate brand identity, ICP, and channels.

## Risks

### Active Risks

- **Channel cold-start — new social account** (Severity: High, Added: 2026-02-17)
  - Source: PETS Instagram/TikTok account launches from 0 followers.
  - Impact: Insufficient organic reach to measure demand signal in 2-week probe.
  - Mitigation: Reels/TikTok format for organic reach; VC-02 (1,000 impressions in 14 days)
    flags insufficient reach before concluding demand is absent.

- **€80 premium ceiling on Etsy dog accessories** (Severity: Medium, Added: 2026-02-17)
  - Source: Etsy artisan dog accessories typically top out at $50–60; €80 is at the boundary.
  - Impact: Listing views but no conversion if Etsy buyers won't pay €80 without brand context.
  - Mitigation: Instagram/TikTok probe provides brand context that Etsy listing alone cannot.
    If VC-01 (3 Etsy sales in 28 days) fails, test Instagram-first DM-to-buy before concluding
    pricing is wrong.

- **Single operator bandwidth** (Severity: High, Added: 2026-02-17)
  - Source: Pete running HBAG and PETS demand tests in parallel.
  - Impact: Neither test gets adequate attention; signal quality degrades.
  - Mitigation: Stagger PETS launch 1–2 weeks behind HBAG. Never run both active probes in same week.

## Opportunities

### Validated (Ready for Cards)
_None yet — to be populated by Cabinet sweeps_

### Under Investigation
_None yet_

## Learnings

_No learnings recorded yet. This section is append-only — learnings are added after card reflections._

## Outcome Contracts

### PET-OUT-2026Q1-02

| Field | Value |
|---|---|
| **Outcome-ID** | `PET-OUT-2026Q1-02` |
| **Outcome** | Achieve first paid demand signal for the dog holder: 10 sales or €800 revenue across active channels, validating premium €80 positioning |
| **Baseline** | Dog holder Revenue: €0. Sales: 0. Date: 2026-02-17. |
| **Target** | 10 paid sales OR €800 cumulative revenue — whichever comes first |
| **By** | 2026-05-17 (90 days) |
| **Owner** | Pete |
| **Leading-Indicator-1** | Weekly Etsy listing views + add-to-cart count (tracked in `docs/plans/pets-dog-accessories-pmf/demand-log.md`) |
| **Leading-Indicator-2** | Weekly Instagram/TikTok DM purchase inquiries (tracked in demand-log) |
| **Decision-Link** | `DEC-PET-02` — if 0 sales by 2026-04-17 (60-day gate): pause channel spend, run `/lp-do-replan` on pricing and variant selection before continuing |
| **Stop/Pivot Threshold** | 0 sales across all active channels after 60 days → halt, replan. Fewer than 3 Etsy views/day after 14 days → investigate tags/title before waiting full 28 days |
| **Evidence-Pointers** | `docs/plans/pets-dog-accessories-pmf/fact-find.md`, `docs/plans/pets-dog-accessories-pmf/plan.md` |

## Metrics

### Dog Holder Demand Test Signals (From: 2026-02-17 — active on listing launch)

- **First-Purchase Signal:** Not yet measured (TASK-06 Etsy listing + TASK-07 social probe pending)
  - Target: 10 sales or €800 by 2026-05-17
  - Measurement: Weekly — `docs/plans/pets-dog-accessories-pmf/demand-log.md`

- **Etsy Engagement Signal:** Not yet measured
  - Target: ≥30 unique listing views + ≥3 favourites per listing within 14 days of going live
  - Measurement: Etsy Shop Manager analytics

- **Social DM Signal:** Not yet measured
  - Target: ≥3 genuine purchase DM inquiries within 14 days of first post
  - Measurement: DM log in `docs/plans/pets-dog-accessories-pmf/demand-log.md`
