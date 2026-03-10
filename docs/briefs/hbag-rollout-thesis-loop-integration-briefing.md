---
Type: Briefing
Outcome: Understanding
Status: Active
Domain: Business
Created: 2026-03-09
Last-updated: 2026-03-09
Topic-Slug: hbag-rollout-thesis-loop-integration
---

# HBAG Rollout Thesis Loop Integration Briefing

## Executive Summary

The Caryina rollout thesis is directionally compatible with the current HBAG startup-loop state. The strongest parts already have a home: fashion-first positioning, gift logic, Amalfi/Positano provenance, selective in-destination distribution, and packaging as value support are all partially present in existing HBAG artifacts. The main problem is not absence of fit; it is fragmentation. The thesis is currently spread across offer, channels, content, product-packaging hypotheses, and the new boutique pilot logs, with several important rollout artifacts still missing entirely.

The immediate implication is:

1. A substantial portion of this memo should be absorbed into existing HBAG artifacts.
2. A smaller set needs new artifacts under already-defined startup-loop elements that currently have no HBAG file.
3. A few information-capture gaps still exist at the loop level and should be treated as explicit future additions before broad rollout.

## Questions Answered

- Q1: What existing HBAG artifacts can absorb this rollout thesis now?
- Q2: Which existing startup-loop elements already exist in the framework but have no HBAG content yet?
- Q3: Where does the loop still lack information-capture structure for this kind of resort-boutique rollout?
- Q4: What is the best next step sequence, without doing the changes yet?

## End-to-End Flow

### Current artifact fit

1. The offer already frames Caryina as a premium fashion accessory, not a tech case, and already treats gifting and the Amalfi tourist as real ICPs.
   Evidence: `docs/business-os/startup-baselines/HBAG/offer.md:27`, `docs/business-os/startup-baselines/HBAG/offer.md:60`, `docs/business-os/startup-baselines/HBAG/offer.md:83`, `docs/business-os/startup-baselines/HBAG/offer.md:144`, `docs/business-os/startup-baselines/HBAG/offer.md:152`, `docs/business-os/startup-baselines/HBAG/offer.md:175`
2. The channel strategy already has an in-destination resort lane and now records the Luisa Positano pilot, but it is still narrower than the new thesis.
   Evidence: `docs/business-os/startup-baselines/HBAG/channels.md:29`, `docs/business-os/startup-baselines/HBAG/channels.md:110`, `docs/business-os/startup-baselines/HBAG/channels.md:120`, `docs/business-os/startup-baselines/HBAG/channels.md:125`
3. The website content packet already carries the Positano origin, gift-ready language, and visual-proof framing, but its page model is too small for the new rollout scope.
   Evidence: `docs/business-os/startup-baselines/HBAG/content-packet.md:25`, `docs/business-os/startup-baselines/HBAG/content-packet.md:65`, `docs/business-os/startup-baselines/HBAG/content-packet.md:75`, `docs/business-os/startup-baselines/HBAG/content-packet.md:86`, `docs/business-os/startup-baselines/HBAG/content-packet.md:101`
4. Packaging and gift logic already have a real artifact home in PRODUCTS-04.
   Evidence: `docs/business-os/strategy/HBAG/product/products-bundle-hypotheses.user.md:53`, `docs/business-os/strategy/HBAG/product/products-bundle-hypotheses.user.md:98`, `docs/business-os/strategy/HBAG/product/products-bundle-hypotheses.user.md:147`, `docs/business-os/strategy/HBAG/product/products-bundle-hypotheses.user.md:172`
5. The current ASSESSMENT distribution plan is stale relative to the new thesis because it still only lists own-site, Etsy, and Instagram/TikTok.
   Evidence: `docs/business-os/strategy/HBAG/assessment/2026-02-21-launch-distribution-plan.user.md:14`, `docs/business-os/strategy/HBAG/assessment/2026-02-21-launch-distribution-plan.user.md:18`, `docs/business-os/strategy/HBAG/assessment/2026-02-21-launch-distribution-plan.user.md:34`

### Current missing hosts

1. No HBAG packaging brief exists, even though ASSESSMENT-15 is a defined physical-product stage with a canonical artifact path.
   Evidence: `docs/business-os/startup-loop/artifact-registry.md:36`, `docs/business-os/startup-loop/specifications/loop-spec.yaml:385`
2. No HBAG weekly demand plan exists, even though GTM-1 already defines a canonical artifact path.
   Evidence: `docs/business-os/startup-loop/process-registry-v2.md:283`, `docs/business-os/startup-loop/process-registry-v2.md:297`
3. No HBAG channel policy exists, even though OFF-4 already defines a canonical artifact path.
   Evidence: `docs/business-os/startup-loop/process-registry-v2.md:258`, `docs/business-os/startup-loop/process-registry-v2.md:272`
4. No canonical message-variants artifact exists for HBAG, and CAP-02 is still a framework-level gap.
   Evidence: `docs/business-os/startup-loop/contracts/marketing-sales-capability-contract.md:39`, `docs/business-os/startup-loop/contracts/marketing-sales-capability-contract.md:53`

## Data & Contracts

### What should be folded into existing content

- `docs/business-os/startup-baselines/HBAG/offer.md`
  - Absorb the top-line thesis explicitly:
    - not pure utility
    - not imitation luxury handbag
    - best positioned as Amalfi-Coast-born accessible-premium accessory
    - desirability/context/story first; utility second
  - This file is already very close; it mainly needs the stronger “one master story, multiple monetization lanes” framing.

- `docs/business-os/startup-baselines/HBAG/channels.md`
  - Expand the in-destination lane from “a Positano pilot exists” to a defined 5–6 door resort rollout thesis.
  - Add store-selection criteria, reorder posture, selective-consignment rule, and “physical retail as status transfer + content generation, not the whole business.”

- `docs/business-os/startup-baselines/HBAG/content-packet.md`
  - Extend page intent and copy requirements to cover:
    - story / origin
    - stockists
    - contact / wholesale
    - limited editions / waitlist
  - Add editorial framing and image-system requirements because the current packet still behaves like a lean launch packet.

- `docs/business-os/strategy/HBAG/product/products-bundle-hypotheses.user.md`
  - Use this as the existing home for:
    - packaging-as-price-justification
    - destination stamp / edition marker
    - dog variant visual containment rules
  - It already carries most of the packaging logic; the memo mostly sharpens direction and hierarchy.

- `docs/business-os/strategy/HBAG/assessment/2026-02-21-measurement-profile.user.md`
  - Add the actual pilot decision metrics named in the memo:
    - units sold per store per week
    - reorder rate by store
    - % sold at full price
    - email capture rate
    - usable UGC assets created
    - saves/shares on core social posts
    - customer-language split: “bag accessory” vs “dog use”

- `docs/business-os/strategy/HBAG/channel-health-log.user.md`
  - Expand from pure sell-through logging to include:
    - display quality
    - staff styling / explanation quality
    - photo / reel usefulness
    - QR scans or tracked referrals where possible

### Existing startup-loop elements that need new HBAG artifacts

- ASSESSMENT-15 packaging brief
  - Canonical path pattern exists, but HBAG has no file yet.
  - This is the cleanest home for the memo’s packaging section once it moves from thesis to production-ready brief.

- GTM-1 weekly demand plan
  - This is the right home for the proposed 90-day rollout calendar, creator/content cadence, and “do not do now” list once operationalized.

- OFF-4 channel policy
  - This is the right home for:
    - no discount-led growth
    - no broad souvenir wholesale
    - no Amazon / mass marketplace
    - no dog-first hero messaging
    - when consignment is acceptable vs not

### New information capture still required in the loop

- Boutique fieldwork / door shortlist capture
  - The loop currently lacks a canonical artifact for “door-by-door resort stockist shortlist with fit notes.”
  - Best near-term fit: a new section or companion to `channel-health-log.user.md`.
  - Long-term cleaner fit: a dedicated `stockist-target-list.user.md` under GTM-2, if the pattern repeats across businesses.

- CAP-02 message / customer-language capture
  - The memo depends on learning whether buyers describe the object as:
    - bag accessory
    - gift
    - tiny essentials holder
    - dog-use product
  - The loop still lacks the canonical artifact for this. That is a genuine framework gap, not just an HBAG gap.

- Creative-asset performance capture
  - The memo relies heavily on image system, UGC, creators, and saves/shares.
  - The loop has measurement artifacts, but no clean operator-facing capture surface for “which exact creative asset / retail photo / reel produced the best signal.”

## Unknowns / Follow-ups

- Unknown: whether the current website content stack already has stockists / waitlist / wholesale page support in code.
  - How to verify: inspect `apps/caryina` routes and `site-content.generated.json`.
- Unknown: whether HBAG should treat Capri / Ravello / Amalfi as GTM-2 channel expansion or as a separate distribution-research artifact first.
  - How to verify: decide whether the next action is desk shortlist creation or direct operator outreach.
- Unknown: whether the dog variant deserves a sub-brand, sub-line, or just a constrained family label.
  - How to verify: decide inside offer architecture before updating product-line or content artifacts.

## If You Later Want to Change This (Non-plan)

### Suggested way forward

1. First pass: absorb the thesis into the files that already exist.
   - Update `offer.md`, `channels.md`, `content-packet.md`, `products-bundle-hypotheses.user.md`, and `measurement-profile.user.md`.
   - Goal: make the current loop state reflect the new logic without creating avoidable document sprawl.

2. Second pass: create the missing HBAG artifacts that already have a defined loop home.
   - Create the HBAG packaging brief (ASSESSMENT-15).
   - Create the HBAG weekly demand plan (GTM-1).
   - Create the HBAG channel policy (OFF-4).

3. Third pass: define the true gap additions.
   - Decide whether to add:
     - a `stockist-target-list` artifact under GTM-2
     - a canonical CAP-02 message-variants artifact for customer language and creative outcomes
   - These are the two loop-level additions that matter most for this rollout thesis.

4. Only after those are in place, turn the memo into execution assets.
   - Store shortlist by town
   - Packaging brief with actual cost envelope
   - Homepage / stockists / waitlist copy set
   - 90-day rollout calendar

### Decision standard

Do not treat the memo itself as execution-ready. Treat it as:

- strong rationale for strategy
- partial source material for current artifacts
- a trigger revealing two real loop gaps:
  - structured stockist-fieldwork capture
  - structured message / customer-language capture
