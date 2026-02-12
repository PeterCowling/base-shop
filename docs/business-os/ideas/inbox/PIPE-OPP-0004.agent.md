---
Type: Idea
ID: PIPE-OPP-0004
Business: PIPE
Status: Draft
Owner: Unassigned
Created-Date: 2026-02-06
Tags: [suppliers, negotiation, sourcing, operations]
Last-updated: 2026-02-06
---

# Supplier operations & negotiation workflow

Build out the supplier side of the pipeline: finding suppliers, managing communications, tracking terms, and running the negotiation loop that determines whether a product's economics work.

## The problem

The pipeline app can calculate whether a product is profitable, but the supplier interaction that determines unit cost, MOQ, sample availability, and shipping terms is currently entirely manual and untracked. This means:

- **No record of which suppliers were contacted** for a given product or who responded
- **No terms comparison** across suppliers for the same product
- **No negotiation history** -- if we revisit a product, we start from scratch
- **No MOQ tracking** -- minimum order quantities are a critical constraint at low volume and need to be visible in the pipeline's economic calculations
- **Stage N (Negotiation & Terms)** is designed in the pipeline plan but not wired up

## What needs to exist

### Supplier directory
- Record suppliers found on 1688, Taobao, Alibaba, or via agents
- Basic profile: platform, store URL, location, product categories, communication language, response quality rating
- Link suppliers to candidates in the pipeline

### Terms tracking per candidate
- For each candidate, record supplier quotes: unit price at different MOQs, sample cost, sample lead time, production lead time, shipping terms offered
- Compare across suppliers for the same product
- Flag best-available terms for Stage B input

### Negotiation workflow (Stage N)
- Task-based loop: contact supplier → receive quote → counter/accept → request sample → evaluate sample → final terms
- Status tracking per task (pending/done/blocked)
- Timeout handling: if supplier doesn't respond in X days, move on
- Link negotiation outcomes to pipeline stage progression (can't advance past Stage N without confirmed terms)

### Communication templates
- Standard messages for: initial enquiry, price negotiation, sample request, bulk order terms, QC requirements
- Multi-language support (English + Chinese) since most 1688 suppliers communicate in Chinese
- Templates should be adaptable, not rigid -- operators customise per situation

## Success criteria

- Supplier directory holds data for at least 10 suppliers
- Terms comparison works for at least 5 candidates with multiple supplier quotes
- Negotiation workflow tracks at least 3 candidates through the full contact-to-terms loop
- Stage B can pull confirmed unit costs from supplier terms (not manual entry)

## Relationship to other work

- **PIPE-OPP-0003** (Pipeline MVP Hardening) -- supplier ops is a "should-have" for repeatable use
- **PIPE-OPP-0001** (Dropship Validation) -- supplier communication is part of validating the dropship path
- **Pipeline Stage N** -- this idea implements what Stage N describes
- **Pipeline Stage B** -- supplier terms feed directly into landed cost calculations
