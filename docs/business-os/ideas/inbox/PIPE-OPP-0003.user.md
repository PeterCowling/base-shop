---
Type: Idea
ID: PIPE-OPP-0003
Business: PIPE
Status: Draft
Owner: Unassigned
Created-Date: 2026-02-06
Tags: [app, pipeline, mvp, hardening, end-to-end]
Last-updated: 2026-02-06
---

# Product Pipeline app MVP hardening

Close the gaps in the Product Pipeline app so a product can be taken end-to-end from lead intake through to launch decision with real data -- not just theoretical calculations.

## The problem

The pipeline app has impressive breadth (11 stages, logistics lanes, capital return engine, market velocity capture) but several gaps prevent it from being used as a reliable end-to-end decision tool today:

1. **Stage S (Safety/Feasibility)** is manual-input only -- no automated hazmat classification, no IP risk screening, no packaging requirement lookups
2. **Supplier management** is static views -- no supplier scorecards, no terms tracking, no negotiation task loop (Stage N is designed but not wired)
3. **Portfolio solver** is a static mockup -- no constraint-based recommendation engine for capital allocation across candidates
4. **The runner (Stage M capture)** requires manual Playwright operation -- headful browser with human-gated login. This works but is slow and fragile
5. **No scheduling** beyond on-demand runs -- no automated daily triage of new leads, no automated market checks
6. **Data seeding** -- the system needs leads to evaluate. The intake funnel (where do leads come from?) needs to be connected

## What MVP hardening means

Not building everything to M2/M3 maturity. Instead, making the M1 system reliable enough that a human operator can:

1. **Input a product idea** (lead) and get it triaged automatically
2. **See real market data** (even if capture is semi-manual) for promising candidates
3. **Calculate landed cost** using real logistics lane data (fed by PIPE-OPP-0001 validation)
4. **Get a capital return projection** that accounts for realistic scenarios
5. **Make a launch/kill decision** backed by data, not guesswork
6. **Track the pilot** with actuals feeding back into the model

## Priority gaps to close

### Must-have for first pilot
- [ ] **Lead intake flow** -- streamlined UI or bulk import for entering product ideas from browsing 1688/Taobao/Amazon
- [ ] **Stage M reliability** -- make the Amazon lookup work consistently enough to get price/review data for 10-20 candidates without constant babysitting
- [ ] **Stage B with real lane data** -- connect the logistics lane system to actual quotes/costs from PIPE-OPP-0001
- [ ] **Stage K scenario comparison** -- be able to compare "dropship" vs "small bulk to FBA" scenarios for the same product
- [ ] **Decision card UX** -- clear advance/hold/reject flow with reasoning capture

### Should-have for repeatable use
- [ ] **Stage S basic automation** -- at minimum, keyword-based hazmat flagging and category-based FBA eligibility check
- [ ] **Supplier directory** -- record which suppliers on 1688/Taobao were contacted, their responses, MOQs, and sample status
- [ ] **Batch operations** -- run Stage P triage across 50+ leads without clicking through each one
- [ ] **Export/reporting** -- summary view of pipeline status: how many leads, how many advanced, how many killed, why

### Nice-to-have (defer)
- [ ] Portfolio solver
- [ ] Automated scheduling
- [ ] Stage N negotiation task loop
- [ ] 3D game-layer UI

## Success criteria

- A product can go from "I found this on 1688" to "launch/kill decision with data" in under 2 hours of operator time
- The pipeline has processed at least 20 real product candidates
- At least 3 candidates have reached Stage K with realistic inputs
- Stage B costs match within 20% of actual pilot shipping costs (validated by PIPE-OPP-0001 test shipments)

## Relationship to other work

- **PIPE-ENG-0001** (Centralized catalog) -- the pipeline app's output (launched products) feeds into the catalog system
- **PIPE-OPP-0001** (Dropship Validation) -- provides real logistics data for Stage B
- **PIPE-OPP-0004** (Amazon EU Channel Setup) -- needed for Stage C (selling fees) inputs
- **PIPE-OPP-0006** (First Pilot) -- the app needs to be ready before we can run a real pilot through it
- **Pipeline docs** (`docs/product-pipeline/taobao-amazon-margin-pipeline-plan.md`) -- master plan with all stage specifications
