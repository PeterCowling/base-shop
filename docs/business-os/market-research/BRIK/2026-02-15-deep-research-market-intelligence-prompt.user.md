---
Type: Deep-Research-Prompt
Status: Active
Business: BRIK
Date: 2026-02-15
Owner: Codex
Target-Output: docs/business-os/market-research/BRIK/2026-02-15-market-intelligence.user.md
---

# BRIK Deep Research Prompt (Market Intelligence Refresh)

Use the prompt below directly in Deep Research.

## Generator Debug
SelectedProfile: hospitality_direct_booking_ota
OverrideUsed: false
SelectionSignals: ["octorate_rooms","mentions_booking_category","website_live"]
CanonicalWebsiteUrl: https://hostel-positano.com
WebsiteUrlSignals: ["website:measurement_verification"]
TemplatePath: docs/business-os/market-research/_templates/deep-research-market-intelligence-prompt.hospitality-direct-booking-ota.md
TwoPass: false
TwoPassThresholds: {"maxPromptChars":16000,"maxBaselineChars":8000}

```text
You are a market intelligence + growth analyst specializing in EU hospitality direct booking, OTA distribution, and travel-experience commerce.

Goal:
Produce a decision-grade Market Intelligence Pack for BRIK that directly answers the 3 Delta Questions (root causes, fastest levers, 14-day stop/continue/start), anchored in internal performance baselines and validated with external evidence.

Business:
- Code: BRIK
- Name: Brikette
- Region: Europe (primary country: Italy)
- As-of: 2026-02-15 (YYYY-MM-DD)
- Mode: website-live (`website-live` expected; optimize conversion + distribution before scaling acquisition)
- Offering (current): accommodation bookings + optional travel experiences commerce (cross-sell/upsell)
- Budget guardrail: do not scale paid acquisition until conversion + measurement baselines are reliable

CRITICAL: Business model classification (must be done explicitly)
Using ONLY the input packet + internal baselines, classify which model BRIK is operating TODAY:
A) Single-property direct booking site + OTAs
B) Marketplace/affiliate for multiple properties
C) Hybrid
If the evidence is ambiguous, explicitly list the ambiguity and define the fastest 14-day test(s) to resolve it.
All downstream unit economics + competitor comparisons must match the classified model.

MANDATORY internal baselines:
- You MUST incorporate these internal baselines into segment, pricing, channel, and website implications.
- If the internal baseline block is missing or incomplete, return `Status: BLOCKED` and list the exact missing fields BEFORE giving recommendations.

BEGIN_INTERNAL_BASELINES
# Internal Baselines (Mandatory) — BRIK (as-of 2026-02-15)

## Baseline Header

- Last complete month: 2026-01
- YoY window (12 complete months): 2025-02..2026-01 vs 2024-02..2025-01
- Total rooms: 11
- Inventory note: 11 rooms. Sample labels: OTA, Refundable, 2022-7; OTA, Refundable, Room 10; OTA, Refundable, Room 11; ...
- Measurement status (GA4 snapshot): sessions 73; begin_checkout 0; conversions 0 (directional only; likely incomplete).

## YoY Decomposition (Net Value)

| Metric | Current | Previous | Delta |
|---|---:|---:|---:|
| Net value | 514800.23 | 607097.46 | -92297.23 |
| Bookings | 1906 | 2205 | -299 |
| Net/booking | 270.09 | 275.33 | -5.23 |
| Direct share | 20.5% | 14.1% | 6.4pp |

- YoY net value change: -92297.23 (-15.2%).
- Decomposition (exact): volume effect -82322.97; value/booking effect -9974.26.

## Top YoY Decline Months (By Net Value Delta)

| Month | Net value (prev year) | Net value (current) | Delta |
|---|---:|---:|---:|
| 2025-06 | 104807.43 | 81317.03 | -23490.40 |
| 2025-04 | 86892.32 | 64471.32 | -22421.00 |
| 2025-07 | 90304.64 | 69696.17 | -20608.47 |

## Monthly Slice (Last 12 Complete Months)

| Month | Net value | Bookings | Net/booking | Direct share |
|---|---:|---:|---:|---:|
| 2025-02 | 28646.47 | 103 | 278.12 | 22.3% |
| 2025-03 | 46193.54 | 195 | 236.89 | 22.1% |
| 2025-04 | 64471.32 | 232 | 277.89 | 18.5% |
| 2025-05 | 73571.33 | 256 | 287.39 | 24.2% |
| 2025-06 | 81317.03 | 296 | 274.72 | 16.9% |
| 2025-07 | 69696.17 | 263 | 265.00 | 21.3% |
| 2025-08 | 69100.15 | 234 | 295.30 | 23.9% |
| 2025-09 | 37049.13 | 153 | 242.15 | 16.3% |
| 2025-10 | 15827.30 | 74 | 213.88 | 20.3% |
| 2025-11 | 3118.65 | 13 | 239.90 | 15.4% |
| 2025-12 | 7618.52 | 24 | 317.44 | 33.3% |
| 2026-01 | 18190.62 | 63 | 288.74 | 12.7% |

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
END_INTERNAL_BASELINES

BEGIN_OPERATOR_CAPTURED_DATA
# Parity scenarios (S1-S3)
Source: docs/business-os/market-research/BRIK/data/2026-02-15-parity-scenarios.csv

```csv
scenario,surface,check_in,check_out,travellers,total_price_all_in,currency,taxes_fees_clarity,cancellation_cutoff,deposit_payment,notes,evidence_url
S1,BRIK direct,2026-07-17,2026-07-19,1,,,,,,,https://hostel-positano.com/en/book
S1,Booking.com,2026-07-17,2026-07-19,1,,,,,,,
S1,Hostelworld,2026-07-17,2026-07-19,1,,,,,,,
S2,BRIK direct,2026-05-12,2026-05-14,1,,,,,,,https://hostel-positano.com/en/book
S2,Booking.com,2026-05-12,2026-05-14,1,,,,,,,
S2,Hostelworld,2026-05-12,2026-05-14,1,,,,,,,
S3,BRIK direct,2026-02-24,2026-02-26,1,,,,,,,https://hostel-positano.com/en/book
S3,Booking.com,2026-02-24,2026-02-26,1,,,,,,,
S3,Hostelworld,2026-02-24,2026-02-26,1,,,,,,,
```

# Bookings by channel
Source: docs/business-os/market-research/BRIK/data/2026-02-15-bookings-by-channel.csv

Status: present-but-empty (operator must fill)

```csv
month,channel,bookings,gross_value,net_value,cancellations,refunds_or_adjustments,notes
```

# Commission / take rate by channel
Source: docs/business-os/market-research/BRIK/data/2026-02-15-commission-by-channel.csv

Status: present-but-empty (operator must fill)

```csv
month,channel,commission_amount,currency,effective_take_rate,notes
```
END_OPERATOR_CAPTURED_DATA

Primary decisions the pack must enable (answer these early and repeatedly):
1) Why is net booking value down YoY? (demand mix vs conversion vs pricing/policy vs distribution)
2) What levers move realized net value fastest in the next 90 days, and what evidence supports each?
3) What should the operator STOP / CONTINUE / START in the next 14 days to maximize speed-to-first-impact?

Execution method (follow in order; reflect results in the output):

Step 1 - Internal diagnosis (must be quantitative):
- Decompose YoY change in net booking value into:
  a) bookings (volume)
  b) net per booking (value)
  c) channel mix (direct share vs OTA share) only if channel-level net value/margin data exists; otherwise treat as qualitative and define a 14-day measurement plan to quantify it
- Identify the top 3 months contributing most to the YoY decline (absolute EUR and %).
- Produce a hypothesis tree with 3-6 plausible root causes, each mapped to:
  - internal evidence (from baseline)
  - external evidence to gather
  - a falsification test

Step 2 - External market + demand signals (Italy + comparable EU leisure destinations):
- Gather recent, region-relevant demand indicators (tourism arrivals/presences, inbound spend, digital booking behavior, seasonality).
- Prefer primary/authoritative sources (ISTAT, Eurostat, Bank of Italy, UNWTO, OECD, major industry reports, platform earnings/insights).
- Every numeric claim must be cited; otherwise label as assumption with a range.

Step 3 - Competitor + channel map (must be evidence-based, not listicle):
Build a competitor set with MINIMUM counts and selection logic:
- Direct-property competitors (MIN 12):
  - MIN 6 in the same catchment (e.g., Positano / Amalfi Coast / Sorrento / Naples / Salerno area or closest comparable budget stays)
  - MIN 6 in other high-demand Italy cities that compete for the same traveler wallet (Rome/Florence/Venice/Milan/Naples etc.)
- OTAs / meta (MIN 5): Booking.com, Hostelworld, Airbnb, Google Hotels/meta surfaces, plus any Italy-heavy alternatives
- Experience marketplaces (MIN 4): GetYourGuide, Viator, Civitatis, Tiqets (plus any Italy-heavy platform)
- Substitutes (MIN 4): budget hotels, B&Bs, short-term rentals, package operators, etc.

For each competitor category, extract:
- positioning (who they target, what promise)
- offer mechanics (member discounts, bundles, cancellation, pay-later, deposits, fee/tax transparency)
- trust + support patterns (reviews, guarantees, live chat/WhatsApp, phone, response promises)
- channel tactics (SEO patterns, loyalty fences, app push, email capture, retargeting cues)

Pricing benchmark (standardize it so it's comparable):
- Choose 3 standardized booking scenarios and apply them across a subset of competitors (MIN 8 direct competitors + MIN 2 OTAs):
  Scenario S1: Peak season weekend, 2 nights, 1 traveler, cheapest available refundable option if offered else cheapest available
  Scenario S2: Shoulder season midweek, 2 nights, 1 traveler, cheapest available option (refundable rule as above)
  Scenario S3: Off-season midweek, 2 nights, 1 traveler, cheapest available option (refundable rule as above)
- Fixed dates contract (do not vary between competitors):
  - S1 dates: 2026-07-17 (Fri) to 2026-07-19 (Sun)
  - S2 dates: 2026-05-12 (Tue) to 2026-05-14 (Thu)
  - S3 dates: 2026-02-24 (Tue) to 2026-02-26 (Thu)
  - Do not change dates across competitors.
  - If a date range is blocked (inventory not open or sold out), use the closest next week and state why.
- For each scenario: capture displayed total price, taxes/fees clarity, cancellation cutoff, deposit requirements, payment methods, and any member discount mechanics.
- If sold out or blocked: mark "sold out/blocked" and capture whatever policies/fees are visible with a citation.

BRIK parity sub-test (required):
- For S1-S3, capture BRIK direct price/terms on https://hostel-positano.com and compare against at least two OTA surfaces where the property is listed (e.g., Booking.com + Hostelworld if available).
- Record total price, taxes/fees visibility, cancellation cutoff, and payment/deposit differences.

Step 4 - Website-live conversion + measurement implications:
- Audit the live funnel as a user would (home -> dates -> room -> checkout):
  - identify friction points
  - identify missing trust signals
  - check mobile-first behaviors (speed, clarity, checkout steps)
- If the canonical website URL is missing: return `Status: BLOCKED` and list the missing field (website URL).
- Canonical website URL (for the funnel audit): https://hostel-positano.com
- Produce an implementation-ready checklist prioritized as:
  - P0 (<=14 days, highest expected impact, low/medium effort)
  - P1 (30-60 days)
  - P2 (nice-to-have)
Each checklist item must include: expected impact (L/M/H), effort (S/M/L), and the metric it should move.

Measurement is currently likely weak or incomplete.
- Provide a measurement repair plan that enables weekly decisions:
  - required events (view_item, begin_checkout, purchase/booking_confirm, phone/WhatsApp clicks, email capture)
  - UTM discipline
  - reconciliation to net booking value exports

Unit economics priors (must match the classified business model):
- Provide ranges (not point estimates) for:
  - gross margin / contribution per booking (direct vs OTA)
  - OTA commission ranges and payment processing fees (assumptions allowed with rationale)
  - refund/cancellation exposure and support cost per booking (assumptions allowed with rationale)
- Explicitly state what would make the ranges wrong and how to validate fast.

Regulatory / compliance:
- Identify EU + Italy constraints relevant to:
  - accommodation booking terms (price transparency, taxes/fees display)
  - payments (PSD2/SCA)
  - data/privacy (GDPR, consent)
  - if bundling accommodation + experiences: assess Package Travel Directive implications (or explicitly state "not applicable" with reasoning)

Confidence labeling:
- Use High/Medium/Low confidence labels for each major conclusion.
- Define what "High/Medium/Low" means in terms of evidence quality.

Hard rules:
- Do not invent data.
- Every numeric claim must have a citation OR be explicitly labeled `assumption` with a plausible range and rationale.
- Internal baseline numbers inside BEGIN_INTERNAL_BASELINES are observed internal evidence and do not require external citations. When referencing them, tag as `observed` and attribute to "internal baseline (as-of 2026-02-15)".
- Operator-captured data inside BEGIN_OPERATOR_CAPTURED_DATA is observed operator evidence and does not require external citations, but MUST include a source path and evidence URLs where applicable.
- Explicitly tag each key claim as `observed` or `inferred`.
- Prefer recent sources (last 24 months) and Italy/EU relevance.
- If evidence is weak/conflicting: say so and propose a falsification test.
- Citations hygiene:
  - If you output a table with an "Evidence" column, every row MUST include at least one URL in that Evidence cell (even if interactive pricing is blocked).
  - Do not include clipboard artifacts like "text" / "Copy" or stray image captions (alt-text fragments).

Decision-grade bar (quality gate):
- >=25 total sources, >=12 authoritative/primary
- competitor evidence: >=12 direct, >=5 OTA/meta, >=4 experiences, each with citations
- pricing benchmark completed for >=8 direct + >=2 OTA across S1-S3 (or explicitly blocked with reasons)
- P0 checklist: >=12 items, each tied to a metric and effort/impact

OUTPUT FORMAT (strict; use these exact sections):
A) Executive summary (max 12 bullets; must answer Delta Q1-Q3 explicitly)
B) Business context and explicit assumptions (include business model classification)
C) Market size and demand signals table (with confidence labels)
D) Competitor map table (direct/adjacent/substitute + OTA/meta + experiences)
E) Pricing and offer benchmark table (using S1-S3 scenarios)
F) Segment and JTBD section (primary + secondary sequence; include mobile/near-term implications if supported)
G) Unit economics priors table (AOV/net per booking/CAC/CVR/cancellation/refund exposure/margin ranges)
H) Channel strategy implications (first 90 days; constrain paid until measurement + CVR baselines)
I) Website design implications (implementation-ready checklist with P0/P1/P2 + impact/effort/metric)
J) Product + operations implications (booking product + experiences cross-sell; failure modes; support)
K) Regulatory/claims constraints and red lines
L) Proposed 90-day outcome contract (outcome, baseline, target, by-date, owner, leading indicators, decision links)
M) First-14-day validation plan (tests + thresholds + re-forecast triggers)
N) Assumptions register (assumption, evidence, confidence, impact, validation test)
O) Risk register (risk, why it matters, mitigation)
P) Source list with URL + access date
Q) Delta and feedback for human operators (required):
   - What is working vs not working given internal baseline trends?
   - Stop / Continue / Start (14-day focus)

For each Stop / Continue / Start item include:
- action
- rationale
- expected metric movement
- 14-day verification method

After Deep Research returns (operator instructions, do NOT claim you executed them):
1) Save result to `docs/business-os/market-research/BRIK/2026-02-15-market-intelligence.user.md`.
2) Run pack lint and fix any errors before marking the pack decision-grade:
   `pnpm startup-loop:lint-market-intel-pack -- docs/business-os/market-research/BRIK/2026-02-15-market-intelligence.user.md`
3) If pricing scenario totals are blocked: run an operator browser capture and commit the filled CSV(s) under:
   `docs/business-os/market-research/BRIK/data/`
   Then re-run the handoff prompt generator so the next Deep Research run can consume the captured data:
   `pnpm startup-loop:s2-market-intel-handoff --business BRIK --as-of 2026-02-15 --owner Codex`
4) Render HTML companion:
   `pnpm docs:render-user-html -- docs/business-os/market-research/BRIK/2026-02-15-market-intelligence.user.md`
```

After Deep Research returns:
1. Save result to `docs/business-os/market-research/BRIK/2026-02-15-market-intelligence.user.md`.
2. Set pack status to `Active` when decision-grade.
3. Render HTML companion:
   `pnpm docs:render-user-html -- docs/business-os/market-research/BRIK/2026-02-15-market-intelligence.user.md`
