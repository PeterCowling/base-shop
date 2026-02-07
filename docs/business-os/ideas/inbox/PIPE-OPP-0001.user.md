---
Type: Idea
ID: PIPE-OPP-0001
Business: PIPE
Status: Draft
Owner: Unassigned
Created-Date: 2026-02-06
Tags: [logistics, dropshipping, china-sourcing, shipping, zero-leverage]
Last-updated: 2026-02-06
---

# Dropship-first logistics model validation

Validate and stand up a dropshipping-style fulfilment path from China to EU as the zero-leverage starting point for selling physical goods.

## The problem

We have no purchase history, no volume, no established supplier relationships, and no EU warehouse. Traditional importing (bulk order → sea freight → FBA) requires capital commitment and demand certainty we don't have yet. We need a way to test products with real customers before committing to inventory.

The 3PL shipping approach doc (`docs/product-pipeline/3pl-shipping-approach-decision-v0.md`) defines Model D (ship direct from China per order) as "baseline only; generally not recommended" -- but for the first 10-50 orders per product, it may be the only viable path until we have data to justify bulk.

## What "dropship-first" means here

This is NOT classic marketplace dropshipping (list aliexpress products, never touch them). This is:

1. **Sourced product, fulfilled from China per-order** -- we select and vet the product through our pipeline, but the supplier or a China-based agent ships individual orders to EU customers
2. **Agent-assisted fulfilment** -- a sourcing/shipping agent (e.g. Superbuy, CSSBuy, a Yiwu agent, or a 1688 agent) handles purchase, QC, and per-order international shipping
3. **Small-batch air freight alternative** -- consolidate 5-20 units via air express (Yanwen, 4PX, CNE) to test velocity before committing to sea freight

## Key questions to answer

1. **Which agents/services support per-order or micro-batch fulfilment from China to EU?** Compare: dedicated sourcing agents (Yiwu/Guangzhou based), platform-integrated agents (Superbuy, CSSBuy, Pandabuy), and supplier-direct shipping (some 1688/Taobao sellers ship international)
2. **What are the realistic per-unit landed costs at 1-unit and 10-unit scale?** Include: product cost, domestic shipping to agent, international shipping, duties, VAT (especially IOSS for <150 EUR), agent fees
3. **What are the lead times?** Order-to-door for: ePacket/Yanwen economy (15-30 days), air express/4PX (7-15 days), DHL/FedEx express (3-7 days). Map these against customer expectations for different product categories
4. **What are the customs/tax implications?** IOSS registration for <150 EUR consignments, VAT obligations, when does the customer become the importer vs. us?
5. **What's the quality control approach?** How do we inspect before shipping when we're not handling the goods? Agent QC photos? Pre-shipment inspection services?
6. **What's the return/refund approach?** Returns to China are usually uneconomical. What's the policy? Refund-no-return for low-value items? EU return address for higher-value?

## Success criteria

- Identified 2-3 viable fulfilment paths with real cost data
- Per-unit landed cost model for at least 3 product categories (small/light, medium, bulky)
- Lead time ranges validated against at least one test shipment
- IOSS/VAT approach decided
- Returns policy drafted
- Cost data fed into the pipeline app's logistics lanes (Stage B inputs)

## What this enables

This is the bridge between "the pipeline app says this product is profitable" and "we can actually sell it." Without a validated fulfilment path, the pipeline's landed cost calculations are theoretical. With it, we can run real pilots.

## Relationship to other work

- **3PL Shipping Approach Decision** (`docs/product-pipeline/3pl-shipping-approach-decision-v0.md`) -- this idea fills in Model D detail and validates it as a starting point
- **Pipeline app Stage B** (landed cost) -- this feeds real cost data into the lane system
- **PIPE-OPP-0002** (Graduated Logistics Roadmap) -- this is step 0 of that roadmap
- **PIPE-OPP-0006** (First Product Pilot) -- can't launch without a validated fulfilment path
