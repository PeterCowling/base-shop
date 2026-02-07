---
Type: Idea
ID: PIPE-OPP-0006
Business: PIPE
Status: Draft
Owner: Unassigned
Created-Date: 2026-02-06
Tags: [launch, pilot, first-sale, end-to-end, validation]
Last-updated: 2026-02-06
---

# First product pilot launch

Select, source, and sell the first product through the complete pipeline -- from lead identification on 1688/Taobao through to real customer orders on Amazon EU. This is the end-to-end validation of the entire system.

## The problem

We have a sophisticated pipeline app, a logistics approach doc, and a capital return engine -- but none of it has been validated with a real product going through real sales. Until a product goes from "found on 1688" to "sold on Amazon and money in the bank," the system is theoretical.

The pilot is not primarily about profit. It's about:

1. **Validating the pipeline's predictions** -- does the actual landed cost match Stage B? Does velocity match Stage M estimates? Does the return match Stage K projections?
2. **Discovering unknown unknowns** -- what breaks when you actually try to do this? What steps were missing from the pipeline?
3. **Establishing the operational rhythm** -- how long does each step actually take? Where are the bottlenecks?
4. **Building the first data point** -- actual performance data that calibrates the entire system going forward

## Pilot parameters

### Product selection criteria
- **Low risk:** Not hazmat, not restricted category, no brand/IP concerns, no complex compliance (CE marking nice-to-have but not blocking)
- **Small and light:** Keeps shipping cost manageable at dropship/micro-batch scale
- **Price point:** EUR 15-40 retail (high enough for margin, low enough for impulse purchase)
- **Available on 1688/Taobao:** From established sellers with good ratings
- **Some existing demand:** Product type already selling on Amazon EU (we're not creating demand, we're capturing it)
- **Low customisation:** No need for custom packaging, logos, or modifications for the first pilot

### Pilot scale
- **Phase 0 test:** 5-10 units via dropship/agent to validate the fulfilment path and measure actual costs
- **Phase 0 sell:** If test units land successfully, list on Amazon FBM and sell through
- **Phase 1 consideration:** If sell-through looks good, order 50-100 units via air freight or small sea shipment to FBA

### What we'll measure
- **Lead-to-decision time:** How long from "found this product" to "advance/kill decision"
- **Landed cost accuracy:** Pipeline Stage B prediction vs. actual cost to get units to EU
- **Lead time accuracy:** Predicted vs. actual order-to-door time
- **Listing-to-first-sale time:** How long from listing live to first organic order
- **Velocity accuracy:** Pipeline Stage M prediction vs. actual sales velocity
- **Unit economics accuracy:** Pipeline Stage C/K predictions vs. actual profit per unit
- **Total capital deployed:** Peak cash outlay for the pilot
- **Operator time:** Hours spent on each pipeline stage for this product

## Prerequisites (must be in place before pilot starts)

1. **PIPE-OPP-0001** (Dropship Validation) -- at least one fulfilment path validated with test shipment
2. **PIPE-OPP-0003** (Pipeline MVP) -- app can process a product end-to-end (doesn't need to be perfect, but functional)
3. **PIPE-OPP-0005** (Amazon Channel) -- seller account active, at least DE marketplace, IOSS sorted
4. Pipeline app has real logistics lane data (from OPP-0001) and real Amazon fee data (from OPP-0005)

## Success criteria

- At least 1 product selected, sourced, and listed on Amazon EU
- At least 5 units sold to real customers
- Full cost data captured and fed back into the pipeline (launch actuals)
- Pipeline prediction accuracy measured (landed cost, velocity, return)
- Retrospective document with findings: what worked, what broke, what to change
- Pipeline app updated based on learnings (new fields, adjusted assumptions, fixed bugs)

## What this unlocks

A validated, data-backed system for evaluating and launching products. After the first pilot:
- The pipeline's predictions are calibrated against reality
- The logistics path is proven (or we know what to fix)
- We have an operational playbook for the next product
- We can start running 3-5 products through the pipeline in parallel with confidence

## Relationship to other work

- **PIPE-OPP-0001** (Dropship Validation) -- prerequisite, provides the fulfilment path
- **PIPE-OPP-0002** (Logistics Roadmap) -- pilot data informs graduation triggers
- **PIPE-OPP-0003** (Pipeline MVP) -- prerequisite, the tool we use to run the pilot
- **PIPE-OPP-0004** (Supplier Ops) -- pilot generates the first real supplier interactions
- **PIPE-OPP-0005** (Amazon Channel) -- prerequisite, the sales channel
- **Pipeline Stage L** (Launch & Learning Loop) -- this is the first real execution of Stage L
