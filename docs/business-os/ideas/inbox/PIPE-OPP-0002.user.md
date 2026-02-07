---
Type: Idea
ID: PIPE-OPP-0002
Business: PIPE
Status: Draft
Owner: Unassigned
Created-Date: 2026-02-06
Tags: [logistics, roadmap, 3pl, fba, scaling, strategy]
Last-updated: 2026-02-06
---

# Graduated logistics roadmap: dropship to 3PL to FBA

Define the concrete triggers, costs, and operational changes for each logistics phase transition -- from per-order China fulfilment through to EU-warehoused FBA at scale.

## The problem

The 3PL approach doc defines four operating models (A-D) but doesn't specify when to transition between them, what volume/margin thresholds justify the jump, or what operational capabilities need to be in place at each stage. Without clear graduation criteria, we risk either:

- **Staying on dropship too long** -- eating into margins with per-unit shipping costs that a bulk approach would eliminate
- **Jumping to bulk too early** -- committing capital to inventory for products where demand isn't validated

## The phases

### Phase 0: Per-order / micro-batch (Model D variant)
- **Volume:** 0-50 units/month per SKU
- **Fulfilment:** Agent ships from China per order, or small batches (5-20 units) air-freighted to self/EU address
- **Channels:** Amazon FBM, possibly DTC
- **Purpose:** Validate demand, test listing quality, gather velocity data
- **Key cost:** High per-unit shipping (~$8-25/unit depending on weight/method)
- **Graduation trigger:** Product hits [X] units/month sustained for [Y] months with positive unit economics even at dropship shipping cost

### Phase 1: Small bulk to FBA (Model A)
- **Volume:** 50-500 units per reorder
- **Fulfilment:** Sea/air freight bulk to Amazon FBA warehouse
- **Channels:** Amazon FBA (Prime badge), possibly FBM as backup
- **Purpose:** Capture the Prime badge uplift, reduce per-unit shipping cost, test at moderate scale
- **Key cost:** Upfront inventory commitment ($500-5,000 per reorder depending on product)
- **New requirements:** Amazon seller account, FBA prep compliance, barcode labelling, possibly prep service
- **Graduation trigger:** Sustained sell-through rate, reorder frequency > monthly, multi-marketplace demand (DE + FR + IT etc.)

### Phase 2: EU 3PL hub + FBA replenishment (Model B)
- **Volume:** 500+ units/month, multiple SKUs
- **Fulfilment:** 3PL warehouse in EU receives bulk shipments, replenishes FBA, fulfils DTC orders
- **Channels:** Amazon FBA + FBM + DTC website
- **Purpose:** Multi-channel fulfilment, returns handling, kitting/customisation, faster replenishment
- **Key cost:** 3PL monthly minimum + per-unit pick/pack, but dramatically lower per-unit freight
- **New requirements:** 3PL contract, WMS integration, returns processing SOP, multi-channel inventory sync
- **Graduation trigger:** Portfolio of 5+ active SKUs, DTC channel contributing meaningful revenue

### Phase 3: Scale optimisation (Model B/A hybrid)
- **Volume:** 1,000+ units/month across portfolio
- **Fulfilment:** Pan-EU FBA distribution, 3PL for DTC/FBM, redundant shipping lanes
- **Channels:** Amazon Pan-EU + DTC + potentially wholesale
- **Purpose:** Cost optimisation, geographic coverage, resilience
- **New requirements:** Pan-EU VAT registration, EFN/MCI decisions, supplier scorecards, demand forecasting

## Key questions to answer

1. **What are the specific unit economics at each phase?** Model the per-unit landed cost curve as volume increases (1 unit, 10, 50, 200, 500, 1000) for representative product categories
2. **What are the graduation triggers?** Define precise metrics: units/month, months sustained, margin threshold, capital available
3. **What capabilities need to be built/bought at each transition?** Map the operational requirements (accounts, registrations, integrations, SOPs)
4. **What's the timeline assumption?** How long might each phase last for a typical product?
5. **How does the pipeline app support phase transitions?** Stage B lane versioning should model costs at multiple phases so we can see the "if we graduate" scenario

## Success criteria

- Phase transition triggers defined with specific metrics
- Per-unit cost model at each phase for 3 product categories
- Operational readiness checklist per phase
- Pipeline app lane templates created for each phase (so Stage B can model any product at any phase)
- Decision framework documented and integrated into pipeline Stage R (risk/ranking)

## Relationship to other work

- **PIPE-OPP-0001** (Dropship Validation) -- validates Phase 0
- **3PL Shipping Approach Decision** -- this roadmap operationalises Models A-D with graduation criteria
- **Pipeline Stage B** (landed cost) -- lane templates per phase
- **Pipeline Stage K** (capital returns) -- scenario comparison across phases
- **Pipeline Stage R** (risk/ranking) -- phase-aware risk scoring
