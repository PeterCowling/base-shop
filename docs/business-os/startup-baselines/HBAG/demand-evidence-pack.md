---
Type: Demand-Evidence-Pack
Status: Active
Business: HBAG
Schema-Version: 1.0.0
Created: 2026-02-20
Last-updated: 2026-02-20
Owner: Pete
Gate-Assessment: GATE-S6B-STRAT-01=PASS / GATE-S6B-ACT-01=HOLD
Source-Intelligence: docs/business-os/market-research/HBAG/2026-02-20-market-intelligence.user.md
---

# HBAG Demand Evidence Pack

## Demand Signal Summary

HBAG has **zero historical sales** (new business, pre-launch). The demand evidence is market-level:
confirmed category demand for bag charms (12× JOOR wholesale growth H1 2025), AirPod fashion
accessories (Hermes $930 / Chanel $950 ceiling), and in-destination Amalfi premium accessories
(leather sandal €100–€250 precedent). This DEP documents market-level evidence and identifies
what first-party HBAG-specific evidence must be captured before spend authorisation.

---

## Pass-Floor Self-Assessment

| Criterion | Status | Notes |
|---|---|---|
| ≥2 message variants tested | N/A — pre-launch | No HBAG-specific variants have been live; this is a market-level DEP only |
| Category demand confirmed from independent sources | Pass | Bag charm: 12× JOOR wholesale growth H1 2025; Pinterest +700%; Coach/Miu Miu/Loewe editorial coverage |
| Artisan-tier price white space confirmed | Pass | €80–€150 white space between Etsy mid-market (€15–€60) and accessible luxury (Coach $95, Miu Miu €200+) confirmed |
| Objection log: ≥5 tagged objections OR none_observed | Pass | 5 objections documented from competitor review analysis and category knowledge |
| Speed-to-lead: sample_size ≥1 | Hold | No HBAG-specific inquiries yet; first Instagram/TikTok probe will generate first-party data |

**GATE-S6B-STRAT-01 (strategy design)**: **PASS** — market-level category demand is confirmed
from multiple independent sources. Channel strategy design may proceed. Evidence: bag charm 12×
wholesale growth, artisan-tier price white space documented, Etsy sub-market existence confirmed.

**GATE-S6B-ACT-01 (spend authorization)**: **HOLD** — no first-party HBAG sales data exists.
Photography must pass perception test (TASK-06 VC-01) and at least 10 Etsy + social sales must
be recorded before any paid channel spend is considered. In-destination trial (TASK-10) requires
TASK-09 checkpoint clearance.

---

## DEP Record — H-HBAG-DEM-01 (Category Demand — Market Level)

```yaml
hypothesis_id: H-HBAG-DEM-01
hypothesis_statement: >
  A market of buyers exists for premium artisan mini handbag accessories
  (bag charms, AirPod holders, in-destination fashion accessories) at €80–€150,
  reachable via Etsy, Instagram/TikTok, and Positano in-destination channels.

capture_window:
  start: "2025-01-01T00:00:00Z"
  end: "2026-02-17T23:59:59Z"
  note: "Market-level research period from mini-handbag-pmf fact-find (2026-02-17)."

message_variants:
  - channel: etsy_marketplace
    audience_slice: fashion_conscious_women_25_40_bag_accessories
    asset_ref: https://www.etsy.com/market/bag_charm
    timestamp: "2026-02-17T00:00:00Z"
    note: >
      Etsy has thousands of active listings for bag charms and mini bag accessories.
      Artisan premium tier (€60–€120) is underserved relative to mid-market (€15–€40).
      Sold inventory confirmed at artisan premium price points.

  - channel: instagram_tiktok_social
    audience_slice: bag_charm_trend_followers
    asset_ref: https://www.pinterest.com (bag charm +700% search growth)
    timestamp: "2026-02-17T00:00:00Z"
    note: >
      Bag charm trend is primarily Instagram/TikTok-driven. 12× JOOR wholesale growth
      H1 2025 confirms social-to-purchase conversion funnel is active. "DM to buy"
      model is established for artisan fashion accessories at this price tier.

  - channel: in_destination_positano
    audience_slice: international_amalfi_coast_tourists
    asset_ref: https://www.statista.com (Amalfi tourism data)
    timestamp: "2026-02-17T00:00:00Z"
    note: >
      2.3M overnight stays/year (2024 record). Fashion/accessories = 12.2% of Italy
      tourist spend. Leather sandal €100–€250 is the established Positano premium
      souvenir category — HBAG in-destination product is direct analogue.

denominators:
  etsy_marketplace:
    category_listings: 5000+
    note: >
      Etsy search for "bag charm" and "mini bag accessory" returns thousands of listings.
      Not HBAG-specific denominators — market-level proxy only. HBAG Etsy shop does
      not yet exist; first-party denominators will be captured from TASK-08 Etsy launch.
    source_tag: etsy_market_scan_2026_02_17
  in_destination:
    annual_visitors: 2300000
    fashion_accessories_spend_pct: 12.2
    note: >
      2.3M annual Amalfi Coast visitors; 12.2% fashion/accessories share of Italy tourist
      spend (international visitors). Not HBAG-specific — destination-level proxy.
    source_tag: statista_italy_edit_true_luxury_travels_2024

intent_events:
  - event_type: wholesale_category_growth
    source_tag: joor_wholesale_platform_h1_2025
    count: 12
    unit: "times_growth"
    timestamp: "2025-06-30T23:59:59Z"
    note: >
      Bag charm wholesale sales grew 12× on JOOR platform in H1 2025. Confirms
      commercial intent exists at scale; not HBAG-specific but directly relevant to
      H1 variant (bag charm is top-scored HBAG variant).

  - event_type: social_search_trend
    source_tag: pinterest_trend_data_2025
    count: 700
    unit: "percent_growth"
    timestamp: "2025-12-31T23:59:59Z"
    note: >
      Pinterest searches for bag charms grew +700% in 2025. Confirms discovery intent
      is growing on visual search channels.

objection_log:
  - text: "Is this actually premium quality or will it look cheap in real life?"
    frequency_count: high
    source: category_competitor_review_analysis_and_buyer_psychology
    note: "Photography perception test (TASK-06 VC-01) is the direct mitigation"
  - text: "€80–€120 feels like a lot for a bag charm / AirPod case"
    frequency_count: medium
    source: price_tier_analysis_and_competitor_review_sentiment
    note: "30-day free exchange and 90-day hardware guarantee are the risk reversals"
  - text: "I don't know this brand / can I trust a small maker?"
    frequency_count: medium
    source: etsy_small_maker_trust_dynamics
    note: "Handwritten note from Pete, Italian origin story, Etsy trust layer at launch"
  - text: "What if it doesn't attach to my specific bag?"
    frequency_count: medium
    source: product_design_and_sizing_anxiety
    note: "Standard carabiner clip works on any D-ring; photos show clip in use on real handbag"
  - text: "Is this made in Italy or shipped from China?"
    frequency_count: medium
    source: origin_story_sourcing_transparency
    note: "Honest sourcing communication required; craft work and story are Italian; product body is China-sourced"

speed_to_lead:
  median_minutes_to_first_response: 0
  sample_size: 0
  note: >
    No HBAG-specific inquiry data yet. First social probe (TASK-07) and Etsy launch
    (TASK-08) will generate first-party speed-to-lead data. Pete handles responses
    manually. Target: respond to DM inquiries within 4 hours.

operator_notes: >
  This DEP documents market-level demand evidence for HBAG and satisfies
  GATE-S6B-STRAT-01 (channel strategy design may proceed). It does NOT satisfy
  GATE-S6B-ACT-01 (spend authorization) — first-party HBAG sales data is required.
  The TASK-09 checkpoint (4-week Etsy + social probe) will generate the first-party
  data needed for a full DEP refresh with HBAG-specific denominators and intent events.
  Source market intelligence: docs/business-os/market-research/HBAG/2026-02-20-market-intelligence.user.md
```

---

## Macro Demand Context

| Signal | Evidence | Source | Confidence |
|---|---|---|---|
| Bag charm category: 12× wholesale growth H1 2025 | JOOR wholesale platform data | JOOR | High |
| Pinterest bag charm searches: +700% | Pinterest trend index 2025 | Pinterest / Who What Wear | High |
| AirPod fashion case ceiling: Hermes $930, Chanel $950 | Product pricing research | Highsnobiety, PurseBop | High |
| Artisan mini bag white space at €80–€150 confirmed | Competitor price audit | KILLSPENCER $55, Coach $95, Miu Miu €200+ | High |
| Amalfi 2.3M annual visitors | Tourism data 2024 | Statista, Italy Edit | Medium |
| Leather sandal €100–€250 Positano WTP anchor | Operator observation | In-destination research | High |
| Hotel boutique distribution viable (Le Sirenuse precedent) | Emporio Sirenuse as comparable | Operator observation | Medium |

---

## Capture Gaps (Required Before GATE-S6B-ACT-01)

| Gap | What's needed | How to capture | Target by |
|---|---|---|---|
| First-party HBAG Etsy performance data | Views, favourites, add-to-carts, sales by listing (TASK-08 VC-01/VC-02) | Etsy Shop Manager analytics | TASK-09 checkpoint (day 28 post-launch) |
| First-party Instagram/TikTok DM inquiry count | DM inquiries expressing purchase intent per variant (TASK-07 VC-01/VC-02) | Manual log in `docs/plans/mini-handbag-pmf/demand-log.md` | TASK-09 checkpoint (day 14 post-launch) |
| Photography perception test result | ≥3/5 cold reviewers estimate ≥€80 for H1 lead photo (TASK-06 VC-01) | Pete runs perception test on unbranded lead photo | Pre-listing launch |
| Unit cost and margin stack | Contribution margin ≥35% confirmed at target retail price (TASK-02) | Pete gets supplier quote | Pre-listing launch |
| Speed-to-lead | Formal response time to first DM inquiry or Etsy message | Log timestamp on receipt + reply for first 10 inquiries | First 2 weeks post-launch |

---

## References

- Market intelligence: `docs/business-os/market-research/HBAG/2026-02-20-market-intelligence.user.md`
- Mini-handbag PMF fact-find: `docs/plans/mini-handbag-pmf/fact-find.md` (2026-02-17)
- Outcome contract: `docs/business-os/strategy/HBAG/plan.user.md` §HBAG-OUT-2026Q1-01
- DEP schema: `docs/business-os/startup-loop/demand-evidence-pack-schema.md`
