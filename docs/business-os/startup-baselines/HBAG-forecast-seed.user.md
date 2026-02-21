---
Type: Startup-Baseline-Seed
Status: Active
Business: HBAG
Created: 2026-02-20
Updated: 2026-02-20
Last-reviewed: 2026-02-20
Owner: Pete
Seed-Source: docs/business-os/startup-baselines/HBAG/S3-forecast/2026-02-20-lp-forecast.user.md
---

# HBAG Forecast Seed for SFS-00

## 0a) Business-Now (Outcome Contract Proposal)

- Outcome-ID: `HBAG-OUT-2026Q1-01`
- Outcome statement: Achieve first paid demand signal for HBAG — 10 sales or €500 revenue from Etsy and Instagram/TikTok — validating that premium €80–€150 Birkin-style mini handbag accessories find buyers at launch scale.
- Baseline (2026-02-17):
  - paid orders: 0
  - net revenue: €0
  - contribution margin: not measured (awaiting TASK-02 supplier quote)
  - return rate: not measured
- Target (90 days — conservative first-signal target):
  - paid orders: 10 OR net revenue €500 — whichever comes first (P10 planning target)
  - P50 stretch: 34 Etsy orders + 8 in-destination = 42 combined orders, ~€2,787 net revenue
  - contribution margin: ≥35% after all costs at target retail price
  - return rate: TBD (no benchmark; target <15% given premium positioning)
- By (deadline): 2026-05-17
- Owner: Pete
- Leading indicators:
  - weekly Etsy listing views and add-to-cart count
  - weekly Instagram/TikTok DM purchase inquiries
  - weekly Etsy favourites per listing
  - in-destination sales count (weekly, June–Sept only)
- Decision link: `DEC-HBAG-01` — if 0 sales by 2026-04-17 (60-day gate), pause channel spend, run `/lp-do-replan` on pricing and variant selection
- Stop/Pivot guardrails:
  - if 0 sales across all active channels after 60 days: halt, replan
  - if Etsy views <3/day per listing after 14 days: investigate Etsy SEO and tags
  - if DM inquiries include >50% price-shock objections: consider testing 10% price reduction
  - if photography perception test fails: do not proceed to listing; reshoot

## 0b) Existing-Work-Now (From Current Evidence)

Confirmed available now:
- Product: Birkin-style mini handbag (5 variants scored and ranked)
- Top 2 variants: H1 bag charm (score 9/10, strongest demand signal) and H2 AirPod holder (score 8/10, fit confirmed 2026-02-17)
- Brand positioning: Premium €80–€150 (Pete confirmed 2026-02-17)
- CE marking investigation complete: not required for H1–H4 fashion accessory variants (2026-02-18)
- AirPod holder fit confirmed: AirPods Pro and AirPods 4 both verified
- PMF plan active: `docs/plans/mini-handbag-pmf/plan.md` (4 of 11 tasks complete)
- Photography brief ready: `docs/plans/mini-handbag-pmf/task-06-photography-brief.md`
- Operator is based in Positano — in-destination channel available June–September

Still missing / needs confirmation before channel launch:
- Unit cost, MOQ, China→EU shipping (TASK-02 — critical for margin stack)
- Customer-facing brand name (must be decided before Etsy shop naming)
- Product photography (TASK-06 — the gating asset for all channel launch)
- Instagram/TikTok account status for HBAG (separate from Brikette hostel account)
- Whether existing Etsy shop exists or must be created from scratch

## 0c) Merge + Classification for First Execution Pack

Reuse-existing:
- Forecast benchmarks and ICP hypotheses from `docs/business-os/startup-baselines/HBAG/S3-forecast/2026-02-20-lp-forecast.user.md`
- Market intelligence and competitor benchmarks from `docs/business-os/market-research/HBAG/2026-02-20-market-intelligence.user.md`
- PMF plan task structure from `docs/plans/mini-handbag-pmf/plan.md`
- CE marking investigation findings from `docs/plans/mini-handbag-pmf/ce-marking-investigation.md`

Adapt-existing:
- Convert PMF plan tasks into live weekly demand tracker once TASK-07/08 launch
- Refine ICP from "fashion-conscious women" to tracked buyer segment after first 10 sales (age, location, purchase trigger)
- Shift offer from single-SKU per variant to potential bundle once demand signal confirms both H1 and H2 are selling

New required artifacts:
- `docs/plans/mini-handbag-pmf/demand-log.md` (weekly: Etsy views/favs/sales + DM log)
- `docs/plans/mini-handbag-pmf/supply-chain-investigation.md` (TASK-02 output)
- Photography directory `docs/plans/mini-handbag-pmf/photography/` (TASK-06 output)
- Brand naming research prompt via `/brand-naming-research` (pre-Etsy launch)

## Ready-to-Execute Go Items (Seed)

1. Pete answers Q1 (unit cost/MOQ) — gates TASK-02 completion and all pricing decisions.
2. TASK-06: Photography session for H1, H2, H3 variants; run perception test (≥3/5 estimate ≥€80).
3. TASK-07/08: Open Etsy shop + Instagram/TikTok demand probe — only after TASK-02 and TASK-06 clear.
4. Run `/brand-naming-research` to generate naming research prompt before Etsy shop is named.
5. TASK-09: 4-week checkpoint — re-score downstream tasks from observed demand data.

## Priors (Machine)

Last updated: 2026-02-20 12:00 UTC

```json
[
  {
    "id": "forecast.target.paid_orders",
    "type": "target",
    "statement": "First-signal target: 10 paid orders OR €500 net revenue within 90 days (P10 conservative target)",
    "confidence": 0.6,
    "value": 10,
    "unit": "orders",
    "last_updated": "2026-02-20T00:00:00Z",
    "evidence": ["docs/business-os/strategy/HBAG/plan.user.md HBAG-OUT-2026Q1-01"]
  },
  {
    "id": "forecast.target.net_revenue",
    "type": "target",
    "statement": "P50 stretch target: ~€2,787 net revenue (34 Etsy orders + 8 in-destination = 42 combined)",
    "confidence": 0.4,
    "value": 2787,
    "unit": "EUR",
    "last_updated": "2026-02-20T00:00:00Z",
    "evidence": ["docs/business-os/startup-baselines/HBAG/S3-forecast/2026-02-20-lp-forecast.user.md"]
  },
  {
    "id": "forecast.constraint.contribution_margin",
    "type": "constraint",
    "statement": "Contribution margin must be ≥35% after all costs (Etsy fees, unit cost, packaging, shipping) at target retail price",
    "confidence": 0.6,
    "value": 35,
    "unit": "percent",
    "operator": "gte",
    "last_updated": "2026-02-20T00:00:00Z",
    "evidence": ["docs/plans/mini-handbag-pmf/plan.md TASK-02 acceptance criteria"]
  },
  {
    "id": "forecast.gate.photography",
    "type": "constraint",
    "statement": "Photography perception test (TASK-06) must pass — ≥3/5 cold reviewers estimate ≥€80 for H1 lead photo — before any listing goes live",
    "confidence": 0.9,
    "value": 3,
    "unit": "out_of_5_reviewers",
    "operator": "gte",
    "last_updated": "2026-02-20T00:00:00Z",
    "evidence": ["docs/plans/mini-handbag-pmf/plan.md TASK-06 VC-01"]
  },
  {
    "id": "forecast.risk.supply_chain",
    "type": "risk",
    "statement": "Unit cost, MOQ, and China→EU shipping unknown; forecast unit economics are estimates until TASK-02 completes",
    "confidence": 0.9,
    "last_updated": "2026-02-20T00:00:00Z",
    "evidence": ["docs/plans/mini-handbag-pmf/plan.md TASK-02 Status: Pending"]
  },
  {
    "id": "market.bag_charm.trend_runway",
    "type": "market_signal",
    "statement": "Bag charm trend has 12–24 month runway minimum based on JOOR 12× wholesale growth trajectory and Labubu comparisons",
    "confidence": 0.75,
    "last_updated": "2026-02-17T00:00:00Z",
    "evidence": ["docs/plans/mini-handbag-pmf/fact-find.md §Existing Signal Coverage H1"]
  }
]
```
