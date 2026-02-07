---
Type: Idea
ID: PIPE-OPP-0005
Business: PIPE
Status: Draft
Owner: Unassigned
Created-Date: 2026-02-06
Tags: [amazon, channel, seller-account, fba, marketplace]
Last-updated: 2026-02-06
---

# Amazon EU seller account & channel setup

Set up the selling infrastructure needed to list and sell products on Amazon EU marketplaces -- the primary sales channel for the pipeline's output.

## The problem

The pipeline app can evaluate products and calculate returns, but there's no sales channel to actually sell through. Amazon EU is the target channel (Prime badge, built-in traffic, FBA fulfilment option), but selling requires:

- An active Amazon Seller Central account (Professional plan)
- Understanding of marketplace-specific requirements (DE, FR, IT, ES, NL etc.)
- Product listing capability (titles, bullet points, images, A+ content)
- Tax/VAT compliance per marketplace
- FBA prep knowledge (even if we start FBM, FBA is Phase 1 of the logistics roadmap)

## Key areas to address

### Account setup
- [ ] Register Amazon Seller Central account (Professional plan, EUR 39/month)
- [ ] Choose primary marketplace (likely DE -- largest EU market)
- [ ] Enable additional marketplaces via EFN or direct registration
- [ ] Understand identity verification requirements (KYC)

### VAT & tax compliance
- [ ] IOSS registration for <150 EUR imports (needed for dropship phase)
- [ ] VAT registration requirements per marketplace (DE mandatory for FBA storage)
- [ ] OSS (One-Stop Shop) vs. per-country VAT registration decision
- [ ] Understand the tax implications at each logistics phase (dropship vs FBA vs 3PL)

### Listing capability
- [ ] Product listing creation workflow (how to create effective listings)
- [ ] Image requirements per category
- [ ] Keyword research approach for EU marketplaces (language-specific)
- [ ] How our pipeline's Stage M data feeds into listing optimisation
- [ ] Brand Registry assessment (needed for A+ content, useful for IP protection)

### Fee structure understanding
- [ ] Referral fees by category (feeds into Pipeline Stage C)
- [ ] FBA fees by size tier (feeds into Pipeline Stage C)
- [ ] FBM shipping credit structure
- [ ] Storage fees (monthly + long-term) and their impact on capital return calculations
- [ ] Advertising costs baseline (PPC for launch visibility)

### Compliance & gating
- [ ] Category-specific approval requirements (some categories are gated)
- [ ] Product compliance documentation (CE marking, REACH, product safety)
- [ ] Understand which product types from our pipeline face restrictions

## Success criteria

- Active Amazon Seller Central account with at least DE marketplace enabled
- VAT/IOSS approach decided and registration initiated
- Fee structure documented and integrated into Pipeline Stage C calculations
- At least one test listing created (even if unpublished) to validate the workflow
- Category restrictions mapped for our target product categories
- Pipeline app Stage C updated with real Amazon fee data (not estimates)

## Relationship to other work

- **PIPE-OPP-0001** (Dropship Validation) -- IOSS registration needed for dropship imports
- **PIPE-OPP-0002** (Logistics Roadmap) -- channel setup is a prerequisite for every phase
- **PIPE-OPP-0003** (Pipeline MVP) -- Stage C needs real fee data from this work
- **PIPE-OPP-0006** (First Pilot) -- can't sell without a seller account
- **Pipeline Stage C** (Unit Contribution) -- Amazon fees are the primary input
- **Pipeline Stage M** (Market Velocity) -- listing data feeds back into competitive analysis
