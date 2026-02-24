---
Type: Forecast
Status: Draft
Business: HBAG
Region: EU + International (Etsy); Italy in-destination seasonal
Created: 2026-02-20
Updated: 2026-02-20
Last-reviewed: 2026-02-20
Owner: Pete
Artifact: forecast
Review-trigger: After each completed build cycle touching this document.
---

# HBAG 90-Day Launch Forecast (S3 Backfill — 2026-02-20)

> **Confidence: LOW.** This forecast is pre-supply-chain-validation. Unit cost and contribution
> margin are estimates only until TASK-02 (supplier quote) completes. Two hard gates must clear
> before channel launch: TASK-02 (margin stack ≥35% confirmed) and TASK-06 (photography
> perception test passes). The forecast period effectively starts when both gates clear — estimated
> 2026-03-01 to 2026-03-14. Forecast window extends to 2026-05-17 (outcome contract deadline).

---

## Decision Frame

- Decision owner: Pete
- Decision: whether to launch HBAG H1 (bag charm) and H2 (AirPod holder) on Etsy + Instagram/TikTok, at €95–€120 (H1) and €80–€100 (H2), under premium artisan positioning
- Decision date: 2026-02-20 (forecast issued)
- Scope: first 90 days; Etsy + Instagram/TikTok primary; H3 in-destination trial (June+) modelled separately as upside

---

## Model Mechanics

### Core formulas

- `Etsy sessions = Organic Etsy search + Social referral (Instagram/TikTok links)`
- `Orders = Etsy sessions × CVR`
- `Gross revenue (pricing tier) = Orders × AOV incl. VAT`
- `Net AOV ex-VAT = AOV / 1.22 (Italy VAT; Etsy handles collection)`
- `Gross contribution/order = Net AOV − (Etsy fees + unit cost + packaging + EU shipping)`
- `Etsy fees/order = AOV × 9.5% (6.5% transaction + ~3% payment)`
- `Contribution margin % = Gross contribution/order / Net AOV`

### Planning constants

| Parameter | Value | Note |
|---|---|---|
| Target AOV | €100 | H1 midpoint; blend of H1 (€95–120) and H2 (€80–100) |
| Italy VAT rate | 22% | Etsy handles EU VAT collection |
| Net AOV ex-VAT | ~€82 | AOV / 1.22 |
| Etsy total take-rate | ~9.5% | 6.5% transaction fee + ~3% payment processing |
| Etsy fees/order | ~€9.50 | 9.5% × €100 AOV |
| Packaging + note | €2.00 | Tissue, ribbon, handwritten note |
| EU shipping/order | €6.00 | Italy → EU (standard tracked; Italy → non-EU adds ~€2–4) |
| Unit cost (ESTIMATE) | €10–€25 | **UNKNOWN — TASK-02 pending.** Planning range only. |
| Gross contribution (low cost) | ~€64.50 | Net AOV €82 − Etsy €9.50 − pkg €2 − ship €6 − unit €0 base (100% as ceiling) |
| Gross contribution (€10 cost) | ~€54.50 | €82 − €9.50 − €2 − €6 − €10 = 66% margin |
| Gross contribution (€25 cost) | ~€39.50 | €82 − €9.50 − €2 − €6 − €25 = 48% margin |
| Target contribution margin | ≥35% | From outcome contract; confirmed by TASK-02 |

> **Key insight**: At the €10–€25 unit cost range, contribution margin is 48–66% — comfortably above the 35% target. The forecast assumes supply chain cost is validated within this range. If TASK-02 reveals unit cost >€35, the €80 minimum price floor must be reconsidered.

---

## Scenario Inputs (Assumptions)

| Input | P10 | P50 | P90 | Notes |
|---|---:|---:|---:|---|
| Etsy organic sessions (90d) | 500 | 2,000 | 6,000 | New Etsy shop = low organic discovery initially; grows with reviews and sales history |
| Social referral sessions (90d) | 200 | 800 | 3,000 | Instagram/TikTok "link in bio" or DM-to-Etsy traffic; depends on post frequency and organic reach |
| CVR (Etsy sessions to orders) | 0.5% | 1.2% | 2.5% | Premium pricing suppresses CVR vs mid-market; artisan category Etsy CVR benchmarks are 1–3% |
| AOV | €95 | €100 | €105 | H1 bag charm anchors; H2 AirPod holder slightly lower blend |
| Paid ads | €0 | €0 | €30 | No paid ads at launch; €30 Etsy Ads experiment possible if TASK-08 VC-02 fails (views <20/listing in 14d) |

---

## 90-Day Output Forecast

| Metric | P10 | P50 | P90 |
|---|---:|---:|---:|
| Total Etsy + social sessions | 700 | 2,800 | 9,000 |
| Orders (derived) | 4 | 34 | 225 |
| Gross revenue incl. VAT (derived) | €380 | €3,400 | €23,625 |
| Net revenue ex-VAT (derived) | ~€311 | ~€2,787 | ~€19,364 |
| Gross contribution/order (€15 unit cost) | ~€49.50 | ~€49.50 | ~€49.50 |
| Total gross contribution (€15 unit cost) | ~€198 | ~€1,683 | ~€11,138 |
| In-destination orders (H3 June–Sept) | 0 | 8 | 25 |
| Combined orders (Etsy + in-destination) | 4 | 42 | 250 |

> **Outcome contract target**: 10 sales or €500 in 90 days.
> P10 (4 orders) misses the outcome contract target. P50 (34 Etsy + 8 in-destination = 42 combined) significantly exceeds it.
> The critical question is whether organic Etsy discovery and Instagram social reach are sufficient for even P10. Key gate: TASK-06 photography quality.

---

## Week-2 Recalibration Gates (Mandatory)

Evaluate after 14 days of live listings. Scale only if the relevant gate passes:

1. **Etsy views/listing ≥20** per listing in first 14 days (TASK-08 VC-02). If below: activate €15–30 Etsy Ads experiment before concluding demand is absent.
2. **Instagram/TikTok DMs ≥5 genuine purchase inquiries** in first 14 days (TASK-07 VC-01). If below: assess post frequency, hook quality, and reach before concluding demand is absent.
3. **At least 1 Etsy add-to-cart** in first 14 days. If zero add-to-carts with ≥20 views: pricing or listing quality issue; investigate before wait.
4. **No price-shock pattern in DMs**: If >50% of DM inquiries include price objections, consider 10% price reduction test at checkpoint.

Gate validity rules:
- Views/CVR gates are decision-valid only when Etsy listings have been live ≥7 days.
- Intent gate (DMs) is decision-valid only with ≥3 posts published to Instagram/TikTok.

---

## First-14-Day Validation Plan

| Day | Action | Metric | Threshold | Data source |
|---|---|---|---|---|
| Day 1 | Etsy shop live; H1 + H2 listings published | Listing indexed | Appears in Etsy search within 48h | Etsy search manual check |
| Day 1 | Post #1 to Instagram/TikTok (H1 bag charm on handbag) | Impressions | ≥200 impressions within 24h | Instagram/TikTok native analytics |
| Day 3 | Post #2 (H2 AirPod holder in use) | Profile visits | ≥50 profile visits from post | Instagram/TikTok native analytics |
| Day 5 | Check Etsy listing views | Views per listing | ≥5 views per listing | Etsy Shop Manager |
| Day 7 | Post #3 (H1 styled/lifestyle shot) | DM inquiries | ≥1 DM inquiry per 500 impressions | DMs logged in `demand-log.md` |
| Day 7 | Week-1 readout | All channels | Log to `demand-log.md` | Manual weekly entry |
| Day 14 | 2-week gate decision | Etsy views + DMs + add-to-carts | See gates above | Etsy analytics + DM log |
| Day 14 | Decision: proceed/Etsy Ads/repost strategy | Gate pass/fail | Document decision in plan TASK-09 | `/lp-do-replan` if any gate fails |

---

## Assumption Register

| ID | Statement | Prior range | Sensitivity | Evidence source | Confidence | Kill trigger | Owner | Next review |
|---|---|---|---|---|---|---|---|---|
| ASS-H1 | Etsy organic search discovers new premium bag charm listings within 7 days of publishing | 3–14 days to first organic view | High (gates all Etsy signal) | Etsy algorithm general knowledge; no HBAG-specific data | low | No views after 14 days → activate Etsy Ads | Pete | 2026-03-14 (day 14 post-launch) |
| ASS-H2 | Premium €95–€120 price converts Etsy browsers at 0.5–2.5% CVR | 0.3–3.0% | High (directly gates all revenue) | Etsy artisan CVR benchmarks; premium suppresses mid-market CVR | low | CVR <0.3% after 100 sessions → pricing or listing quality review | Pete | 2026-03-14 |
| ASS-H3 | Product quality reads as premium in photography (TASK-06 perception test) | ≥3/5 cold reviewers estimate ≥€80 | Critical (gates all channel launch) | TASK-06 perception test; not yet run | low | Perception test fails → reshoot before listing | Pete | Pre-launch gate |
| ASS-H4 | Unit cost €10–€25 range supports ≥35% contribution margin at €80–€100 AOV | €5–€40 | High (directly gates pricing floor) | Fact-find estimated; not yet confirmed | low | Unit cost >€35 → raise minimum price before Etsy launch | Pete | TASK-02 completion |
| ASS-H5 | Instagram/TikTok organic posts drive ≥500 impressions per post without paid promotion | 200–2,000 | Medium (affects social demand probe signal quality) | Bag charm trend is organic/viral on social; no HBAG account data | low | <200 impressions per post after 3 posts → assess hashtag strategy | Pete | 2026-03-10 (day 7 post-launch) |
| ASS-H6 | In-destination H3 trial converts ≥5 sales at Brikette/boutique in season | 2–20 seasonal sales | Medium (H3 is post-checkpoint; season depends on TASK-09 clearance) | Leather sandal €100–€250 Positano precedent; operator in Positano | medium | 0 in-destination sales in first 2 tourist weeks → assess product display and pricing | Pete | 2026-06-15 (first tourist season check) |
| ASS-H7 | Etsy Ads at €15–€30 generates ≥50 additional views if organic insufficient | €15–€30 spend = 50–200 additional views | Low (backup only) | Etsy Ads general benchmarks; not primary strategy | medium | Ads spend without ≥2× view increase → investigate listing quality | Pete | 2026-03-21 (if Etsy Ads activated) |
| ASS-H8 | Supply chain (TASK-02) confirms unit cost within planning range before Etsy launch | €10–€25/unit | Critical | Not yet investigated | very low | Unit cost >€35 or MOQ >500 units → pricing or demand-test strategy rethink | Pete | TASK-02 completion |

---

## Priority Risks and Mitigations

| Risk | Why it breaks the forecast | Mitigation |
|---|---|---|
| Product quality doesn't read as premium in photos | Gates all channel launch; without strong photos neither Etsy nor social probe works | TASK-06 perception test must pass before any listing goes live; reshoot if needed |
| Unit cost higher than expected → margin squeeze | If margin <35% at €80–€100, price floor must rise, reducing buyer pool | TASK-02 confirms cost before listing prices are set; price adjusts before launch |
| Etsy new shop has very low organic visibility | New shops get limited Etsy organic search traffic; bag charm category may be competitive | Etsy Ads €15–30 experiment activated if TASK-08 VC-02 fails; Instagram/TikTok probe supplements |
| Premium pricing rejected on Etsy | Etsy buyers may expect €15–€60 artisan prices; €95–€120 requires brand context from photos | TASK-07 social probe (Instagram/TikTok) pre-qualifies buyers before they reach Etsy; clear brand story in listing |
| Tourist season window too narrow for H3 | In-destination trial only viable June–Sept; late checkpoint clearance shrinks window | Start boutique outreach (pre-TASK-10 prep) in May even before checkpoint formally clears |
| Single operator bandwidth | Pete can only run 1–2 active experiments at once | Phased approach: Etsy + Instagram first (TASK-07/08), in-destination after checkpoint (TASK-10) |

---

## Inventory Constraint

- No inventory cap data available (TASK-02 pending — MOQ not yet known).
- Forecast assumes: demand test volume (10–50 orders) is well within MOQ for any typical supplier.
- If MOQ requires purchasing 200+ units before first sale, this changes the risk profile — investigate in TASK-02.
- Pre-order / made-to-order model is a viable alternative if demand test clears before inventory is committed.

---

## Required Data to Upgrade Forecast from Draft to Active

1. TASK-02: Confirm unit cost, MOQ, and China→EU shipping cost → enables contribution margin calculation at target prices
2. TASK-06: Photography perception test passes → gates listing publication
3. Day-14 gate check (post-launch): Replace P10/P50/P90 assumptions with observed Etsy views, DMs, add-to-carts, and CVR
4. Day-28 checkpoint (TASK-09): Replace scenario bands with observed 28-day actuals and re-forecast remaining weeks

---

## Source List

- JOOR wholesale bag charm growth data: cited in `docs/plans/mini-handbag-pmf/fact-find.md`
- Pinterest +700% bag charm trend: cited in `docs/plans/mini-handbag-pmf/fact-find.md`
- Hermes / Chanel AirPod case pricing: cited in `docs/plans/mini-handbag-pmf/fact-find.md`
- Etsy artisan CVR benchmarks: general Etsy seller knowledge (no direct citation; planning assumption)
- Etsy fee structure (9.5%): Etsy.com Seller Handbook (6.5% transaction fee + payment processing)
- Italy VAT 22%: standard Italian VAT rate
- Amalfi Coast 2.3M visitors/year: cited in `docs/plans/mini-handbag-pmf/fact-find.md` (Statista, Italy Edit)
- Leather sandal €100–€250 Positano: cited in `docs/plans/mini-handbag-pmf/fact-find.md`
- Outcome contract targets: `docs/business-os/strategy/HBAG/plan.user.md` §HBAG-OUT-2026Q1-01
