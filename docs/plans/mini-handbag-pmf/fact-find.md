---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Business
Workstream: Product
Created: 2026-02-17
Last-updated: 2026-02-17
Feature-Slug: mini-handbag-pmf
Execution-Track: business-artifact
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: product-brief
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: startup-demand-test-protocol
Primary-Execution-Skill: biz-product-brief
Supporting-Skills: lp-offer, lp-channels, lp-forecast
Related-Plan: docs/plans/mini-handbag-pmf/plan.md
Business-OS-Integration: on
Business-Unit: HBAG
Card-ID: HBAG-004
---

# Mini Handbag PMF — Fact-Find Brief

## Scope

### Summary

We make high-quality Birkin-style mini handbags (structured, multi-colour, gold hardware,
leather-look exterior). Five product angles exist and require systematic PMF evaluation
to determine which to pursue first, and in what order. This fact-find also serves as
the live trial for building a physical-product PMF methodology into the startup loop —
gaps identified here should feed `/meta-reflect` after the plan is executed.

The business unit is **HBAG** (Handbag Accessory), which was recently separated from
XA for independent planning. No outcome contract exists yet. The brand dossier is Draft
status. No app or fulfillment path has been validated.

### Goals

- Score and rank the 5 product variants by PMF potential and validation cost.
- Identify the top 1–2 variants to pursue first.
- Define demand test protocols for the selected variants.
- Establish the minimum brand/identity work needed before first sales.
- Flag startup loop capability gaps for physical product businesses.

### Non-goals

- Committing to a specific channel, supplier, or SKU count before demand is validated.
- Building the app (cover-me-pretty) or any code infrastructure.
- Selecting between online vs. in-destination sales before demand signal exists.

### Constraints & Assumptions

- Constraints:
  - HBAG has zero revenue and no validated fulfillment path.
  - Brand dossier is Draft; core offer and target segment not yet locked.
  - No outcome contract exists — must be created before `/idea-generate` can run.
  - Physical product: margins, shipping, customs, and minimum order quantities are unknowns.
  - User is based in Positano (Amalfi Coast) — gives real in-destination distribution
    advantage for the location product variant.
- Assumptions:
  - Product quality is genuinely high (structured body, clean hardware, premium feel).
    This is a prerequisite for luxury/premium positioning — must be validated via
    customer perception test, not asserted.
  - The same physical product can be repositioned across multiple angles — only the
    marketing, attachment hardware, and channel differ.
  - AirPod holder variant is already partially started; this is the lowest-cost
    variant to validate first.

---

## Evidence Audit (Current State)

### Business OS Baseline

- Business plan: `docs/business-os/strategy/HBAG/plan.user.md` — Active, 2026-02-11
  - Three open strategic items: identity separation from XA, offer hypothesis definition,
    execution readiness baseline. All three remain open.
  - No validated opportunities, no metrics baseline, no learnings recorded.
- Brand dossier: `docs/business-os/strategy/HBAG/brand-dossier.user.md` — Draft, 2026-02-17
  - All fields TBD pending offer lock. App (cover-me-pretty) not yet built.
  - Audience: "women purchasing handbag accessories" — segment not defined.
  - Gate GATE-BD-01 (Draft minimum, Hard) passes; all other gates still open.
- No HBAG intake packet or outcome contract exists.
- PIPE business unit (`docs/business-os/strategy/PIPE/plan.user.md`) is the supply-chain
  layer for physical products — it also lacks a validated fulfillment path and outcome
  contract. Any HBAG demand signal must be paired with a PIPE supply validation cycle.

### Delivery & Channel Landscape

- **In-destination (Positano)**:
  - User operates Brikette hostel in Positano — gives direct access to 100,000+
    annual arrivals. Hostel terrace, reception desk, and local boutique network are
    potential first-day sales channels.
  - Comparable artisan product proof: custom leather sandals at €100–€250 are a
    well-established Positano premium souvenir category — anchors customer willingness
    to pay for artisan fashion accessories.
  - Amalfi Coast generates 2.3M overnight stays/year (2024 record). International
    visitors: >75%. Luxury daily spend: $391–$1,098/person/day. Fashion/accessories
    = 12.2% of in-destination spend for international Italy visitors.

- **Online (DTC)**:
  - No app exists; cover-me-pretty is a placeholder only.
  - Etsy is the fastest validated channel for artisan fashion accessories — no
    infrastructure build required. Dog holder, first bag, and AirPod holder all have
    active Etsy sub-markets with thousands of listings confirming buyer intent.
  - Instagram and Pinterest are proven discovery channels; bag charm trend is
    primarily TikTok/Instagram-driven (see demand signals below).

- **B2B (wholesale / boutiques)**:
  - Emporio Sirenuse (Le Sirenuse Hotel, Positano) is the proof-of-model for
    hotel boutique placement of location-specific premium accessories.
  - The hotel gift shop / souvenir industry: 22,500+ US stores, $18B annual revenue.
    The "hotel as concept store" trend is a credible distribution path.
  - JOOR wholesale platform shows brands selling bag charms have tripled in H1 2025 —
    wholesale buyers are actively looking for this category.

- **Approvals/owners**: Pete (sole operator currently).
- **Compliance constraints**: For EU/UK sales — product labelling, CE marking for
  children's products (first bag variant), customs for China-sourced product.
  Not investigated in depth; flag for plan tasks.
- **Measurement hooks**: None exist. Need to define: conversion rate by channel,
  contribution margin per unit, repeat purchase rate, and review/NPS signal.

### Hypothesis & Validation Landscape

#### Key Hypotheses

| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | Bag charm/handbag accessory is the highest-value first variant | Perceived quality validation, charm attachment test | Low (listing + 20 sales) | 2–4 weeks |
| H2 | AirPod holder at €120–€250 finds buyers among fashion-conscious women | Size fit validation, price acceptance test | Low (Etsy listing) | 2–4 weeks |
| H3 | Amalfi Coast location branding creates a defensible moat with premium pricing | In-destination customer test, local boutique interest | Medium (prototype, local outreach) | 4–8 weeks |
| H4 | Dog poop bag holder variant can command €60–€120 premium over mass market | Dog owner segment test, perceived value at price point | Low (Etsy listing) | 2–4 weeks |
| H5 | "First bag" for girls age 6–10 sells as gift at €50–€120 with quality positioning | Parent gift-buyer test, CE marking clarity | Medium (need CE check) | 4–8 weeks |

#### Existing Signal Coverage

| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | Bag charm sales 12x growth H1 2025; Pinterest +700%; Miu Miu/Loewe mini bags as charms; Coach $95 anchor | JOOR, Who What Wear, Hollywood Reporter | High — strong market-level signal |
| H2 | Hermes $930 / Chanel $950 AirPod cases prove customer exists; KILLSPENCER $55 artisan validates mid-market | Highsnobiety, PurseBop, KILLSPENCER | High — clear price ceiling and artisan floor |
| H3 | 2.3M annual visitors; fashion spend 12.2% of Italy tourism; leather sandal €100–€250 price anchor | Statista, Italy Edit, True Luxury Travels | Medium — geography validated, product-specific untested |
| H4 | Dog poop bag holder market $1.12B 2024; Pagerie $152 proves luxury ceiling | DataIntelo, Pagerie | Medium — market size confirmed; luxury segment smaller |
| H5 | Barbie Movie tailwind; 6-10 age gap underserved; Etsy premium handmade $35–$75 | Amazon/Etsy market scan, FMI luxury kids data | Medium — category exists; artisan segment smaller |

#### Falsifiability Assessment

- **Easy to test (2–4 weeks, <€200 cost)**:
  - AirPod holder: photograph current product, list on Etsy with size card, set price €150,
    measure add-to-cart and purchase within 4 weeks.
  - Bag charm: photograph on a real handbag strap, post to Instagram/TikTok, measure
    DM inquiries and link-in-bio clicks.
  - Dog holder: photograph with leash clip shown, list on Etsy/Instagram, measure
    engagement from dog-owner audience.

- **Harder to test (4–8 weeks, requires prototype/outreach)**:
  - Amalfi location: requires in-destination trial — sell at hostel or approach 1 local
    boutique. Faster if tried at Brikette terrace bar this season.
  - First bag: CE marking research needed before actively marketing to children's market.

#### Recommended Validation Approach

1. **Quick probe (weeks 1–2)**: Photograph product across the top 3 angles (bag charm,
   AirPod holder, dog holder). Post to Instagram/TikTok with purchase link or "DM to buy."
   Run 2-week demand test. Target: 5 genuine purchase inquiries per variant.

2. **Structured test (weeks 3–6)**: Open Etsy shop for the top 1–2 variants by inquiry
   volume. Use real pricing. Target: 10 sales. Measure: conversion rate, average order
   value, customer segment, repeat contact rate.

3. **In-destination test (overlapping with season)**: Place product at Brikette hostel
   reception / terrace. Offer to 1 local boutique in Positano on consignment. Target:
   5 in-person sales in season.

4. **Deferred**: Location branding (requires brand identity lock), app build,
   wholesale B2B until at least 50 DTC sales confirmed.

---

## Variant Scoring Matrix

| Variant | Market size signal | Price ceiling | Competition density | Channel readiness | User advantage | Startup cost | Score (1–10) |
|---|---|---|---|---|---|---|---|
| **H1 – Bag charm/accessory** | Very high (12x growth) | €300–€1,990 (Coach to Balenciaga) | Low at artisan tier | Low (Instagram/Etsy) | None specific | Low | **9** |
| **H2 – AirPod/small items holder** | High (Hermes/Chanel proven) | €80–€930 | Low at artisan tier | Low (Etsy ready) | AirPod variant started | Low | **8** |
| **H3 – Location product (Amalfi)** | High (2.3M visitors, €150–€350) | Premium souvenir window | Very low (gap confirmed) | Medium (in-destination) | User in Positano | Medium | **8** |
| **H4 – Dog poop bag holder** | Medium ($1.12B global, $152 luxury) | €60–€120 | Medium (Atlas, LISH) | Low (Etsy ready) | None specific | Low | **6** |
| **H5 – First bag / children's** | Medium (gift category) | €50–€120 | Medium (Etsy crowded) | Low (Etsy ready) | None specific | Medium (CE check) | **5** |

**Recommended priority: H1 (bag charm) → H2 (AirPod holder) → H3 (location) in parallel
with H1/H2 during tourist season → H4 (dog) → H5 (first bag, deferred pending CE check).**

---

## Confidence Inputs

- **Implementation**: 45%
  - Evidence basis: We know what the physical product is. Supply chain (sourcing,
    MOQ, unit cost, shipping) is completely uninvestigated. PIPE has no validated
    fulfillment path. Raises to 80% when: first unit cost + China→EU shipping cost
    confirmed, first supplier quote received.

- **Approach**: 72%
  - Evidence basis: Demand validation first, build after, is the correct sequencing.
    Market research strongly confirms this. Channel path (Etsy → Instagram →
    in-destination → wholesale) is a proven artisan product sequence.
    Raises to 80% when: offer hypothesis (pricing, positioning, first segment) is locked
    via `/lp-offer`.

- **Impact**: 68%
  - Evidence basis: Market signals are strong across 3 of 5 variants. Bag charm trend
    is documented and exceptional. Location advantage (Positano) is real. Revenue
    potential at 50 units/month × €150 avg = €7,500/month is achievable but unproven.
    Raises to 80% when: first 10 actual sales occur and AOV is measured.

- **Delivery-Readiness**: 30%
  - Evidence basis: No outcome contract. No brand identity beyond Draft dossier.
    No distribution confirmed. No app. No supply chain. The only asset is the
    physical product itself (high quality assumed) and the in-destination advantage.
    Raises to 70% when: outcome contract written, Etsy shop open, first 5 photos taken.

---

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Product quality doesn't read as premium in photos | Medium | High | Run perception test: show photos to 10 people cold, ask what they'd pay |
| Bag charm trend fades before traction built | Low (12x growth trajectory) | High | Move fast on demand test; charm trend has 12–24 month runway minimum based on Labubu data |
| China→EU customs/duties eat into margin | High | High | Investigate before setting retail prices; CE marking may be required for children's variant |
| Amalfi season window is short (June–Sept) | High | Medium | In-destination channel requires physical presence + timing; start selling online first |
| HBAG and PIPE remain disconnected (supply vs demand) | High | High | Requires joint outcome contract; demand signal from HBAG must gate PIPE fulfillment build |
| No brand identity means price anchoring fails | High | Medium | HBAG brand dossier must advance to Active before photography/positioning is locked |
| Etsy crowding for mini bags (generic) | Medium | Medium | Differentiation via quality + location story + photography; not competing on price |
| CE marking required for children's product (H5) | High | Medium | Investigate before H5 launch; defer H5 until CE status confirmed |
| Single-person operation; bandwidth constrained | High | Medium | Keep demand test to 1–2 variants only; don't open 5 Etsy shops at once |

---

## Planning Constraints & Notes

- **Must-follow**: Demand signal before infrastructure. No app build, no wholesale
  outreach, no brand shoot until at least 10 sales confirmed.
- **Startup loop gaps identified** (meta-goal — flag for `/meta-reflect` post-plan):
  1. No SKU scoring/ranking framework in the loop — this document fills that gap ad hoc.
  2. No demand test protocol template for physical products — needed for both PIPE and HBAG.
  3. No supply chain readiness checklist — PIPE outcome contract is the blocker here.
  4. No margin stack template — contribution margin calculation needs to include unit cost,
     packaging, platform fees (Etsy: 6.5%), shipping, customs, returns.
  5. No in-destination distribution planning guidance — relevant for any location-anchored
     business (Brikette, HBAG Amalfi).
  6. No physical product CE/compliance checklist — required before children's product launch.
  These gaps should be captured as loop improvement tasks after this plan runs.

---

## Open Questions (User Input Needed)

- **Q1**: What is the approximate unit cost (€) per bag from the supplier, and what is
  the minimum order quantity?
  - Why it matters: Contribution margin calculation, break-even, and pricing floor.
  - Decision owner: Pete

- **Q2**: Is the AirPod holder variant physically ready (correct interior sizing, attachment
  hardware)? Or does it need further product development before photography?
  - Why it matters: Determines whether H2 is the fastest first test or needs a build cycle.
  - Decision owner: Pete

- **Q3**: Is there capacity for in-destination sales this tourist season (e.g., selling
  from the hostel), or is online-only the working assumption?
  - Why it matters: Changes channel priority and timing for H3 (location variant).
  - Decision owner: Pete

- **Q4**: Are location graphics/artwork (e.g., the building prints shown on the bags in
  the image) custom to the product, or are these from the supplier? Can custom Amalfi
  imagery be applied?
  - Why it matters: Determines whether location branding is a real option or requires a
    separate sampling/design cycle.
  - Decision owner: Pete

- **Q5**: For the brand identity decision — luxury/fashion (€200+), functional/premium
  (€80–€150), or accessible fashion (€40–€80)?
  - Why it matters: This is the single most important positioning decision. It gates all
    photography, copy, pricing, and channel choices. Cannot advance without it.
  - Default assumption: luxury/fashion positioning given the Birkin-style reference product.
    Risk if wrong: over-prices the dog holder and first bag variants.
  - Decision owner: Pete

---

## Suggested Task Seeds (Non-binding)

These flow into `/lp-do-plan`:

1. **Answer the 5 open questions above** — owner Pete, prerequisite for all other tasks.
2. **Write HBAG outcome contract** — define HBAG-OUT-2026Q1-01 with baseline, target,
   by-date, leading indicators, decision link, stop/pivot threshold.
3. **Lock the brand positioning decision** — luxury vs. premium vs. accessible.
   Advance HBAG brand dossier to Active.
4. **Product photography session** — photograph top 3 variants (bag charm, AirPod holder,
   dog holder) in context: on a handbag strap, with AirPods inside, on a leash.
5. **Open Etsy shop** — list H1 (bag charm) and H2 (AirPod holder) at target price.
   4-week demand test.
6. **Instagram/TikTok demand probe** — post context photos for H1 (bag charm on Birkin),
   measure DM inquiries in 2 weeks.
7. **In-destination trial** — place stock at Brikette reception; approach 1 Positano
   boutique on consignment for H3 (location variant) during tourist season.
8. **Supply chain/margin investigation** — confirm unit cost, MOQ, China→EU shipping,
   Etsy fees, contribution margin for top 2 variants.
9. **CE marking research for H5** — determine whether children's product CE marking
   applies and what it requires before H5 is actively marketed.
10. **Startup loop meta-reflect** — after plan executes, run `/meta-reflect` to add
    physical product PMF methodology to loop skills.

---

## Execution Routing Packet

- Primary execution skill: `biz-product-brief` — for locking the offer hypothesis per
  top variant before demand test launches.
- Supporting skills:
  - `lp-offer` — to formalize ICP, positioning, and pricing for top 1–2 variants.
  - `lp-channels` — channel strategy once initial demand signal is confirmed (week 4+).
  - `lp-forecast` — 90-day revenue forecast once unit cost and AOV are known.
- Deliverable acceptance package:
  - Outcome contract written and filed in `docs/business-os/strategy/HBAG/plan.user.md`.
  - Etsy shop open with at least 2 listings at real prices.
  - 4-week demand test underway.
  - Photography complete for top 3 variants.
- Post-delivery measurement plan:
  - Weekly: Etsy views, favourites, add-to-cart, sales.
  - Weekly: Instagram/TikTok DM inquiries per variant.
  - Weekly: In-destination sales count.
  - 4-week gate: If 0 sales across all channels, reassess pricing and positioning before
    advancing.

---

## Evidence Gap Review

### Gaps Addressed

- Market size validated for all 5 variants via web research (dog holder $1.12B,
  bag charm 12x growth, Amalfi 2.3M visitors, AirPod case Hermes/Chanel price ceiling).
- Competitor landscape mapped at all price tiers for H1, H2, H3, H4, H5.
- Price opportunity confirmed: largest white space is H1 (bag charm) €95–€450 artisan tier,
  H2 (AirPod holder) €80–€900 artisan tier.
- In-destination advantage confirmed: leather sandal price anchor in Positano validates
  customer willingness to pay €100–€250 for artisan fashion accessories.
- HBAG Business OS baseline documented: plan and brand dossier status confirmed.

### Confidence Adjustments

- Implementation confidence held low (45%) because supply chain (unit cost, MOQ, customs)
  is completely uninvestigated — this is a known gap, not an oversight.
- Delivery-Readiness held low (30%) because neither outcome contract nor brand identity
  exists. Scores reflect reality, not optimism.
- Bag charm signal (H1) rated High confidence because multiple independent sources
  confirm the 12x sales growth figure (JOOR wholesale, Pinterest, Who What Wear,
  Hollywood Reporter) — this is not a single-source claim.

### Remaining Assumptions

- Unit quality reads as premium to customers not briefed on it — **unverified**.
- Birkin-style reference is aspirational, not infringing — **assumed; needs legal check
  if product is named or marketed with Birkin/Hermès associations**.
- Amalfi Coast location branding is achievable via custom graphics on existing product
  body — **unverified; depends on supplier capability**.
- AirPod sizing is correct for current AirPods Pro/AirPods 4 — **unverified**.

---

## Planning Readiness

- Status: **Ready-for-planning**
- Blocking items:
  - None hard-blocking the plan creation.
  - Q1–Q5 are soft-blocking individual task execution — plan should include tasks to
    resolve them before dependent tasks run.
- Recommended next step:
  - **`/lp-do-plan`** — create the demand test + brand foundation plan for HBAG.
  - Answer Q1–Q5 before running demand test tasks.
  - Run `/lp-offer` as the first plan task to lock the offer hypothesis.
