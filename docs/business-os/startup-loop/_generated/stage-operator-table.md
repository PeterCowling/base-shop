<!-- AUTO-GENERATED — do not edit directly. Edit stage-operator-dictionary.yaml and re-run: node --import tsx scripts/src/startup-loop/generate-stage-operator-views.ts -->
<!-- Source: docs/business-os/startup-loop/stage-operator-dictionary.yaml | loop-spec: 3.9.4 -->
---
Type: Reference
Status: Active
Domain: Business-OS
Last-reviewed: 2026-02-21
---

# Startup Loop — Stage Operator Reference

| # | Stage ID | Short label | Outcome | Aliases | Conditional |
|---|---|---|---|---|---|
| 1 | `ASSESSMENT-01` | Problem framing | Clear problem statement with articulated pain, affected customer, and evidence of real demand. | `problem-framing`, `assessment-01` | start-point = problem |
| 1 | `ASSESSMENT-02` | Solution-profiling scan | Mapped solution space with at least three distinct options and comparative feasibility notes. | `solution-profiling`, `assessment-02` | start-point = problem |
| 1 | `ASSESSMENT-03` | Solution selection | Selected solution option with rationale, key assumptions, and handoff brief for ASSESSMENT-09 intake. | `solution-selection`, `assessment-03` | start-point = problem |
| 1 | `ASSESSMENT-04` | Candidate names | Validated business or product name with brand-safety check and domain availability confirmed. | `candidate-names`, `naming-handoff`, `assessment-04` | start-point = problem |
| 1 | `ASSESSMENT-05` | Name selection | Naming generation spec with ICP, brand personality, competitive set, and 250 scored candidate names. | `name-selection`, `business-name-shaping`, `assessment-05` | start-point = problem |
| 1 | `ASSESSMENT-06` | Distribution profiling | Distribution plan with ≥2 launch channels, cost/effort estimates, and ICP fit rationale. | `distribution-profiling`, `assessment-06`, `channel-plan` | start-point = problem |
| 1 | `ASSESSMENT-07` | Measurement profiling | Measurement plan with tracking method, ≥2 key metrics, success thresholds, and data collection feasibility confirmed. | `measurement-profiling`, `assessment-07`, `measure-plan` | start-point = problem |
| 1 | `ASSESSMENT-08` | Current situation | Current situation packet: launch surface, stock status, pricing model, channel pre-decisions, and open evidence gaps documented. | `current-situation`, `assessment-08` | start-point = problem |
| 1 | `ASSESSMENT-09` | Intake | Required ASSESSMENT precursors validated; intake packet produced/refreshed for downstream stages. | `intake`, `assessment-09` | — |
| 1 | `ASSESSMENT` | Assessment | Assessment container complete. Proceeds to Measure entry only after completeness + quality gate passes. | `assessment`, `assessment-intake` | — |
| 1 | `ASSESSMENT-10` | Brand profiling | Business name confirmed; personality adjective pairs, audience, voice & tone documented. | `brand-profiling`, `assessment-10` | — |
| 1 | `ASSESSMENT-11` | Brand identity | Visual language: colour palette, typography, imagery direction, token overrides. Brand identity artifact at Draft+. | `brand-identity`, `assessment-11` | — |
| 2 | `IDEAS` | Ideas | Standing pipeline state: pack diff scans reviewed, backlog updates applied, and promotion-ready ideas handed to DO fact-find when criteria are met. | `ideas`, `idea-pipeline` | — |
| 2 | `IDEAS-01` | Pack diff scan | Automated diff scan completed; scan-proposals.md produced with CREATE/STRENGTHEN/WEAKEN/INVALIDATE/MERGE/SPLIT proposals. | `pack-diff-scan`, `idea-backlog`, `idea-backlog-capture`, `ideas-01` | — |
| 2 | `IDEAS-02` | Backlog update | Semi-automated apply complete: accepted scan proposals reconciled into idea backlog/cards. MERGE/SPLIT changes confirmed by operator. | `backlog-update`, `idea-card-review`, `idea-scoring`, `ideas-02` | — |
| 2 | `IDEAS-03` | Promote to DO | Promotion decision complete: selected idea handed off to /lp-do-fact-find with traceable idea linkage. | `promotion-gate`, `idea-promotion`, `ideas-03` | — |
| 3 | `MEASURE-00` | Problem framing & ICP | Current problem framing and ICP seeded from intake packet. Live document — updated directly when framing evolves or a pivot occurs. Consumers: MARKET-01 (always reads), SELL-01 (seed only), DO (build context). | `problem-framing-and-icp`, `current-problem-framing`, `measure-00` | — |
| 3 | `MEASURE-01` | Agent-Setup | Agent setup artifact captured for measurement/ops readiness with required integration details. | `agent-setup`, `measure`, `measurement-bootstrap`, `measurement-setup`, `measure-01`, `s1b` | — |
| 4 | `MEASURE-02` | Results | Historical performance baseline captured as decision-grade context. | `results`, `historical-baseline`, `baseline-history`, `measure-02`, `s2a` | — |
| 5 | `PRODUCT` | Product | Product container complete: product-from-photo specification is captured, and adjacent product research is available when triggered. | `product`, `product-container` | — |
| 5 | `PRODUCT-01` | Product from photo | Manufacturing-ready product family spec from image evidence with controlled variation and uncertainty discipline. | `product-from-photo`, `product-01` | — |
| 6 | `PRODUCTS` | Products | Products container complete: standing product line intelligence is captured including SKU map, competitor scan, performance baseline, bundle hypotheses, PMF signals, roadmap snapshot, and aggregate pack. | `products`, `products-container` | — |
| 6 | `PRODUCTS-01` | Product line mapping | Current SKU inventory and positioning map documenting the full product line with differentiation notes. | `product-line-mapping`, `products-01` | — |
| 6 | `PRODUCTS-02` | Competitor product scan | Adjacent SKU landscape with pricing benchmarks and competitive differentiation notes. | `competitor-product-scan`, `products-02` | — |
| 6 | `PRODUCTS-03` | Product performance baseline | Sell-through rates and margin by SKU, establishing a decision-grade performance baseline. | `product-performance-baseline`, `products-03` | business_profile includes post-launch |
| 6 | `PRODUCTS-04` | Bundle hypotheses | Standing bundle options with pricing rationale and packaging format notes. | `bundle-and-packaging-hypotheses`, `products-04` | — |
| 6 | `PRODUCTS-05` | Product-market fit signals | Compiled PMF signals: review sentiment, return rates, and demand indicators by SKU. | `product-market-fit-signals`, `pmf-signals`, `products-05` | business_profile includes post-launch |
| 6 | `PRODUCTS-06` | Product roadmap snapshot | Next 90-day product decisions with rationale, priorities, and open dependencies. | `product-roadmap-snapshot`, `products-06` | business_profile includes post-launch |
| 6 | `PRODUCTS-07` | Aggregate product pack | Aggregate product pack combining line map, performance baseline, PMF signals, and roadmap snapshot into one standing artifact. | `aggregate-product-pack`, `products-07` | — |
| 7 | `LOGISTICS` | Logistics | Logistics container complete: supplier mapping, lead time/MOQ baseline, fulfillment options, cost/margin by route, returns baseline, inventory policy, and aggregate pack are captured. | `logistics`, `logistics-container` | business_profile includes logistics-heavy OR physical-product |
| 7 | `LOGISTICS-01` | Supplier mapping | Supplier list with MOQ and lead time data for each key supplier and manufacturer. | `supplier-and-manufacturer-mapping`, `supplier-mapping`, `logistics-01` | business_profile includes logistics-heavy OR physical-product |
| 7 | `LOGISTICS-02` | Lead time and MOQ baseline | Consolidated lead time and MOQ constraints per SKU with bottleneck flags. | `lead-time-and-moq-baseline`, `lead-time-moq`, `logistics-02` | business_profile includes logistics-heavy OR physical-product |
| 7 | `LOGISTICS-03` | Fulfillment channel options | Comparison of 3PL, self-fulfillment, and dropship options with cost and lead-time tradeoffs. | `fulfillment-channel-options`, `fulfillment-options`, `logistics-03` | business_profile includes logistics-heavy OR physical-product |
| 7 | `LOGISTICS-04` | Cost and margin by route | Fulfillment cost stack per channel with contribution margin impact and route-level comparison. | `cost-and-margin-by-route`, `logistics-cost-margin`, `logistics-04` | business_profile includes logistics-heavy OR physical-product |
| 7 | `LOGISTICS-05` | Returns and quality baseline | Return rate by SKU and quality failure mode register with remediation notes. | `returns-and-quality-baseline`, `returns-quality`, `logistics-05` | business_profile includes logistics-heavy OR physical-product |
| 7 | `LOGISTICS-06` | Inventory policy snapshot | Inventory policy with reorder points, safety stock assumptions, and stockout risk notes. | `inventory-policy-snapshot`, `inventory-policy`, `logistics-06` | business_profile includes logistics-heavy OR physical-product |
| 7 | `LOGISTICS-07` | Aggregate logistics pack | Aggregate logistics pack combining supplier mapping, cost/margin, returns baseline, and inventory policy into one standing artifact. | `aggregate-logistics-pack`, `logistics-07` | business_profile includes logistics-heavy OR physical-product |
| 8 | `MARKET` | Market | Market container complete: competitor, demand, pricing, channel, and risk intelligence are consolidated into an offer contract. | `market`, `market-container` | — |
| 8 | `MARKET-01` | Competitor mapping | Competitor landscape map with direct/indirect alternatives, differentiators, and evidence references. | `competitor-mapping`, `competitors`, `market-01` | — |
| 9 | `MARKET-02` | Demand evidence | Demand evidence pack with demand shape, audience pull indicators, and confidence tags. | `demand-evidence`, `demand`, `market-02` | — |
| 10 | `MARKET-03` | Pricing benchmarks | Pricing benchmark ranges by competitor set, positioning tier, and confidence notes. | `pricing-benchmarks`, `pricing`, `market-03` | — |
| 11 | `MARKET-04` | Channel landscape | Channel landscape with acquisition options, constraints, and channel-fit notes. | `channel-landscape`, `channel-research`, `market-04` | — |
| 12 | `MARKET-05` | Assumptions and risk | Consolidated assumptions and risk register covering open unknowns, conflicts, and required follow-up evidence. | `assumptions-risk-register`, `risks`, `market-05` | — |
| 13 | `MARKET-06` | Offer design | Offer artifact: target customer, positioning, pricing model, and messaging hierarchy. | `offer-design`, `offer`, `market-06` | — |
| 13 | `MARKET-07` | Post-offer synthesis | Offer contract integrated back into market intelligence with updated assumptions and conflict resolution notes. | `post-offer-synthesis`, `market-07` | — |
| 13 | `MARKET-08` | Demand evidence pack | Compiled demand evidence pack (DEP) from MARKET-01..07 signals into a single standing artifact. | `demand-evidence-pack-assembly`, `demand-evidence-pack`, `dep`, `market-08` | — |
| 13 | `MARKET-09` | ICP refinement | Narrowed ICP profile based on offer feedback and observed demand signals with confidence annotations. | `icp-refinement`, `icp`, `market-09` | — |
| 13 | `MARKET-10` | Market pack (draft) | Draft market-pack standing artifact assembled from intelligence stack. | `market-aggregate-pack-draft`, `market-pack-draft`, `market-10` | — |
| 13 | `MARKET-11` | Market aggregate pack | Validated market-pack: DEP and ICP refinement signed off. Standing artifact for downstream consumption. | `market-aggregate-pack-validated`, `market-pack`, `market-aggregate-pack`, `market-11` | — |
| 14 | `S3` | Forecast | 90-day P10/P50/P90 revenue forecast with assumption register and sparse-evidence guardrails. | `forecast`, `s3` | — |
| 14 | `PRODUCT-02` | Adjacent product research | Adjacent product research results: 5-10 candidate product types with feasibility flags and ICP fit scoring for product range expansion. | `adjacent-product-research`, `adjacent-products`, `product-02` | growth_intent includes product_range OR operator_invoked |
| 15 | `SELL` | Sell | Sell container strategy outputs are complete; standing sales intelligence captured; paid activation readiness is tracked separately. | `sell`, `sell-container` | — |
| 15 | `SELL-01` | Channel strategy + GTM | Channel plan with 2-3 selected launch channels, 30-day GTM timeline, and SEO strategy. | `channel-strategy`, `channels`, `gtm`, `sell-01` | — |
| 15 | `SELL-02` | Channel performance baseline | Standing baseline of active channel performance: conversion rates, CAC, and channel-level ROI by channel. | `channel-performance-baseline`, `sell-02` | — |
| 15 | `SELL-03` | Outreach + content standing | Standing record of outreach cadence, content calendar status, and engagement metrics. | `outreach-and-content-standing`, `outreach-standing`, `sell-03` | — |
| 15 | `SELL-04` | SEO standing | Standing SEO intelligence: organic rankings, keyword gaps, and backlink profile with priority actions. | `seo-standing`, `sell-04` | — |
| 15 | `SELL-05` | Paid channel standing | Standing paid channel performance: spend by channel, ROAS, and creative fatigue signals. | `paid-channel-standing`, `sell-05` | — |
| 15 | `SELL-06` | Partnership and referral | Standing record of partnership pipeline, referral programmes, and affiliate activity with performance notes. | `partnership-and-referral-standing`, `partnership-standing`, `sell-06` | — |
| 15 | `SELL-07` | Sell aggregate pack | Aggregate sell pack combining channel performance, outreach/content, SEO, paid channel, and partnership standing into one artifact. | `sell-aggregate-pack`, `sell-07` | — |
| 15 | `SELL-08` | Activation readiness | Paid-spend authorization state documented from measurement/risk/conversion checks. | `activation-readiness`, `spend-authorization`, `sell-08` | paid_spend_requested |
| 16 | `S4` | Baseline merge | Candidate baseline snapshot and draft manifest combining offer, forecast, and channel artifacts. | `baseline-merge`, `s4` | — |
| 17 | `S5A` | Prioritize | Scored and ranked action list — top 2-3 items to work on next. | `prioritize`, `s5a` | — |
| 18 | `S5B` | BOS sync | Business OS cards and stage docs persisted to D1. Manifest pointer committed. | `bos-sync`, `s5b` | — |
| 19 | `S6` | Site-upgrade synthesis | Site upgrade brief with prioritized improvement backlog derived from competitor best-of analysis. | `site-upgrade`, `site-upgrade-synthesis`, `s6` | — |
| 20 | `DO` | Do | Feature or artifact delivered: fact-find brief, sequenced plan, and implementation with validation evidence. | `do`, `fact-find`, `plan`, `build`, `s7`, `s8`, `s9` | — |
| 21 | `S9B` | QA gates | QA gate pass evidence: conversion flows, SEO readiness, performance budget, and legal compliance verified. | `qa-gates`, `qa`, `s9b` | — |
| 22 | `S10` | Signals | Weekly K/P/C/S decision document with denominator-valid KPI assessment and next actions. | `signals`, `weekly-readout`, `weekly-decision`, `weekly`, `s10` | — |

### `SELL-01` microsteps

| Gate ID | Label | Type | Description |
|---|---|---|---|
| `GATE-SELL-STRAT-01` | Strategy design complete | Hard | Channel hypothesis and strategy design are complete. Requires MARKET-06 offer artifact. Allows channel plan artifact generation. Does not require measurement verification. |

### `SELL-08` microsteps

| Gate ID | Label | Type | Description |
|---|---|---|---|
| `GATE-SELL-ACT-01` | Spend authorization | Hard | Spend activation gate. Requires decision-grade measurement signal verified (GATE-MEAS-01 pass). Blocks any live spend or channel activation until measurement thresholds are met. |
