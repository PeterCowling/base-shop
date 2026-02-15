---
Type: Deep-Research-Prompt
Status: Active
Business: BRIK
Date: 2026-02-15
Owner: Codex
Target-Output: docs/business-os/market-research/BRIK/2026-02-15-market-intelligence.user.md
Previous-Pack: docs/business-os/market-research/BRIK/2026-02-12-market-intelligence.user.md
---

# BRIK Deep Research Prompt (Market Intelligence Refresh)

Use the prompt below directly in Deep Research.

```text
You are a market intelligence analyst for a venture studio launching B2C consumer-product businesses.

Task:
Produce a decision-grade Market Intelligence Pack for:
- Business code: BRIK
- Business name: Brikette
- Region: Europe (primary country: Italy)
- Launch-surface mode: website-live (`website-live` or `pre-website`)

Input packet:
- Business idea: multilingual e-commerce platform for hostel bookings and travel experiences (`observed`).
- Products and specs: Hostel bookings + travel experience commerce
- Initial target customer: Travelers booking hostel stays/experiences
- Planned channels: Direct website and content-led acquisition
- Budget guardrails: Do not scale paid acquisition until conversion and measurement baselines are reliable.
- Stock timeline: Not applicable (service/booking business).
- Known constraints/non-negotiables: See Risks section in business plan
- Previous market intelligence pack (internal reference): docs/business-os/market-research/BRIK/2026-02-12-market-intelligence.user.md


MANDATORY internal baselines (embedded below):
- You MUST incorporate these internal baselines into segment, pricing, channel, and website implications.
- If the internal baseline block is missing or incomplete, return `Status: BLOCKED` and list exact missing fields before giving recommendations.

BEGIN_INTERNAL_BASELINES
# Internal Baseline Snapshot (BRIK, as-of 2026-02-15)

## Previous Market Intelligence Pack (Executive Summary Excerpt)

- (observed) Italy tourism demand remains large: 458.4M accommodation presences in 2024, up 2.5% YoY; foreign presences grew faster (+6.8%).
- (observed) Italy inbound travel spending reached EUR54.2B in 2024 (+16.8% YoY), which supports continued demand depth in destination-led booking markets.
- (observed) EU short-stay demand on online platforms remained expansionary in 2025 (+17.8% YoY in Q2 nights), confirming digital-booking momentum.
- (observed) BRIK internal baseline shows seasonality and a softer recent shape: Feb-Dec 2025 net value is down 15.13% vs Feb-Dec 2024.
- (observed) BRIK Cloudflare request proxies are directionally useful but not decision-grade attribution data (`r ~= 0.37` vs net value in overlapping months).
- (observed) Hostel demand behavior is mobile and near-term: Hostelworld reports 67% of bookings are made <=7 days before stay and 83% of bookings happen via app.
- (observed) Direct-booking competitors increasingly use loyalty-discount mechanics (e.g., 5-25% member discounts) to shift demand from OTA-heavy journeys.
- (observed) Booking funnels are offer-led: cancellation flexibility, visible discounts, and fee clarity are consistently used conversion levers.
- (inferred) BRIK should treat mobile speed + pricing/fee transparency + policy clarity as core conversion primitives, not design polish extras.
- (inferred) Until GA4/Search Console are fully live, channel scale decisions should be constrained to low-risk tests and measured weekly against net-value and proxy traffic movement.
- (inferred) Fastest 90-day upside is conversion optimization on current demand, not broad top-of-funnel expansion.

## Observed Internal Performance (from monthly exports)

- Trailing 3 complete months (2025-11..2026-01): net value 28927.79; bookings 100; direct share 18.0%; net per booking 289.28.
- YoY vs same 3-month window: net value -14.6%; bookings -2.9%; direct share delta 9.3pp.
- Trailing 12 complete months: net value 514800.23; bookings 1906; direct share 20.5%.
- YoY vs prior 12 months: net value -15.2%; bookings -13.6%; direct share delta 6.4pp.

- Peak net value month: 2024-06 (104807.43).
- Trough net value month: 2025-11 (3118.65).

## Monthly Table (Joined)

| Month | Net booking value | Bookings | Direct share | Net per booking | Cloudflare requests (proxy) |
|---|---:|---:|---:|---:|---:|
| 2024-02 | 17934.65 | 66 | 15.2% | 271.74 | n/a |
| 2024-03 | 46615.13 | 174 | 24.1% | 267.90 | n/a |
| 2024-04 | 86892.32 | 263 | 18.3% | 330.39 | n/a |
| 2024-05 | 91610.90 | 281 | 18.5% | 326.02 | n/a |
| 2024-06 | 104807.43 | 352 | 13.9% | 297.75 | n/a |
| 2024-07 | 90304.64 | 339 | 11.5% | 266.39 | n/a |
| 2024-08 | 75758.66 | 333 | 8.1% | 227.50 | n/a |
| 2024-09 | 43348.01 | 208 | 9.6% | 208.40 | n/a |
| 2024-10 | 15946.00 | 86 | 18.6% | 185.42 | n/a |
| 2024-11 | 4120.47 | 13 | 0.0% | 316.96 | n/a |
| 2024-12 | 7794.72 | 23 | 17.4% | 338.90 | n/a |
| 2025-01 | 21964.53 | 67 | 7.5% | 327.83 | n/a |
| 2025-02 | 28646.47 | 103 | 22.3% | 278.12 | n/a |
| 2025-03 | 46193.54 | 195 | 22.1% | 236.89 | 0 |
| 2025-04 | 64471.32 | 232 | 18.5% | 277.89 | 59517 |
| 2025-05 | 73571.33 | 256 | 24.2% | 287.39 | 186375 |
| 2025-06 | 81317.03 | 296 | 16.9% | 274.72 | 178931 |
| 2025-07 | 69696.17 | 263 | 21.3% | 265.00 | 193045 |
| 2025-08 | 69100.15 | 234 | 23.9% | 295.30 | 166471 |
| 2025-09 | 37049.13 | 153 | 16.3% | 242.15 | 127495 |
| 2025-10 | 15827.30 | 74 | 20.3% | 213.88 | 139752 |
| 2025-11 | 3118.65 | 13 | 15.4% | 239.90 | 107349 |
| 2025-12 | 7618.52 | 24 | 33.3% | 317.44 | 155296 |
| 2026-01 | 18190.62 | 63 | 12.7% | 288.74 | 137729 |
| 2026-02 | 13316.63 | 44 | 13.6% | 302.65 | n/a |

## Cloudflare Proxy Notes

- Correlation proxy (net value vs requests where both available): 0.23 (directional only).

---
Type: Reference
Status: Active
---

# Cloudflare monthly proxies extraction

- generated-at: 2026-02-12T12:48:13.090Z
- zone-tag: 25b082bdadbb0541c0f34c2bf0d21cc4
- zone-name: hostel-positano.com
- host-filter-requested: hostel-positano.com
- months: 24
- include-current-month: false
- first-month: 2024-02
- last-month: 2026-01
- endpoint: https://api.cloudflare.com/client/v4/graphql
- monthly totals use httpRequests1dGroups(sum.requests).
- top page/geo/device breakdowns are marked unavailable where plan/API access does not allow historical extraction.

## Measurement Snapshot (GA4 Data API)

Source: docs/business-os/strategy/BRIK/2026-02-13-measurement-verification.user.md

| Metric | Value |
|---|---:|
| sessions | 73 |
| users | 53 |
| conversions | 0 |
| eventCount | 563 |
| page_view | 258 |
| user_engagement | 145 |
| begin_checkout | 0 |
| web_vitals | 0 |

## Operational Inventory Snapshot (Octorate)

- Total rooms: 11
- Room labels: OTA, Refundable, 2022-7, OTA, Refundable, Room 10, OTA, Refundable, Room 11, OTA, Refundable, Room 12, OTA, Refundable, Room 3, OTA, Refundable, Room 4, OTA, Refundable, Room 5, OTA, Refundable, Room 6, OTA, Refundable, Room 9, OTA, Refundable, Room 8, OTA, Refundable, 2025-14

## Delta Questions (Required)

1. Based on the internal trends and mix, what are the 3 most likely root causes of the YoY softness (demand mix shift vs conversion vs pricing/policy vs distribution)?
2. Which levers are most likely to move realized net value fastest (conversion, direct-share incentives, cancellation control, pricing, upsell, support trust), and what evidence supports that?
3. What is working vs not working today, and what should stop/continue/start in the next 14 days to maximize speed-to-first-impact?
END_INTERNAL_BASELINES

Research requirements:
1) Build a current competitor map (direct, adjacent, substitutes) for this region and channels.
2) Extract pricing, offer structure, positioning, and channel tactics from competitors.
3) Estimate demand signals (search/social/marketplace/proxy signals) and seasonality.
4) Propose practical customer segment sequencing (who to target first, second, third).
5) Produce unit-economics priors: AOV, CAC/CPC, return rates, margin ranges.
6) Derive website design implications (information architecture, PDP requirements, checkout/payment expectations, trust signals, support patterns).
7) Derive product design implications (must-have features, compatibility/fit needs, failure modes, quality requirements, packaging implications).
8) Identify legal/claims constraints relevant to this category and region.
9) Propose 90-day outcomes and leading indicators that maximize speed-to-first-sales.
10) Define first-14-day validation tests that can quickly falsify bad assumptions.

Output format (strict):
A) Executive summary (max 12 bullets)
B) Business context and explicit assumptions
C) Market size and demand signals table (with confidence labels)
D) Competitor map table (direct/adjacent/substitute)
E) Pricing and offer benchmark table
F) Segment and JTBD section (primary + secondary sequence)
G) Unit economics priors table (AOV/CAC/CVR/returns/margin ranges)
H) Channel strategy implications (first 90 days)
I) Website design implications (clear, implementation-ready checklist)
J) Product design implications (clear, implementation-ready checklist)
K) Regulatory/claims constraints and red lines
L) Proposed 90-day outcome contract (outcome, baseline, target, by, owner, leading indicators, decision links)
M) First-14-day validation plan (tests + thresholds + re-forecast triggers)
N) Assumptions register (assumption, evidence, confidence, impact)
O) Risk register (risk, why it matters, mitigation)
P) Source list with URL + access date
Q) Delta and feedback for human operators (required):
- What is working vs not working given the internal baseline trends?
- What should the operator do next (stop/continue/start), with a 14-day focus?

Rules:
- Do not invent data.
- Every numeric claim must include a citation or be explicitly labeled as an assumption.
- Explicitly tag each key claim as `observed` or `inferred`.
- Prefer recent, region-relevant sources.
- Optimize recommendations for startup speed-to-first-sales.
- If evidence is weak or conflicting, say so clearly and propose a fast validation test.
```

After Deep Research returns:
1. Save result to `docs/business-os/market-research/BRIK/2026-02-15-market-intelligence.user.md`.
2. Set pack status to `Active` when decision-grade.
3. Render HTML companion:
   `pnpm docs:render-user-html -- docs/business-os/market-research/BRIK/2026-02-15-market-intelligence.user.md`
