---
Type: Plan
Status: Draft
Domain: Business
Workstream: Product
Created: 2026-02-17
Last-updated: 2026-02-17
Feature-Slug: pets-dog-accessories-pmf
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: startup-demand-test-protocol
Execution-Track: business-artifact
Primary-Execution-Skill: biz-product-brief
Supporting-Skills: lp-offer, lp-channels, lp-forecast, biz-update-plan, meta-reflect
Overall-confidence: 72%
Confidence-Method: min(Implementation,Approach,Impact); overall effort-weighted (S=1,M=2,L=3)
Auto-Build-Intent: plan-only
Business-OS-Integration: on
Business-Unit: PET
Card-ID: PET-001
---

# PETS — Dog Accessories PMF Plan

## Summary

A new standalone dog accessories brand, completely separate from HBAG, executing a
demand-first validation sequence for product 1: a premium dog poop bag holder (existing
mini Birkin-style bag body + leash clip attachment, same supplier as HBAG). Target price
is €80 — confirmed by Pete 2026-02-17. Leash clip fits the existing bag body — confirmed
by Pete 2026-02-17.

The plan begins with brand naming via `/lp-offer` (TASK-01), which gates visual identity
and channel handle creation. Supplier cost investigation runs in parallel (TASK-03) to
confirm margin at €80 before Etsy listing. Photography and social account creation follow
(Wave 2), then a 4-week 2-channel demand probe (Wave 3), then a checkpoint before
expanding to product 2 or other channels (Wave 4+).

This plan runs staggered 1–2 weeks behind the HBAG demand probe to preserve single-operator
bandwidth. Brand scope is intentionally broad ("dog lifestyle brand", not "poop bag holder
brand") per Q3 input. No crossover with HBAG at any stage.

## Goals

- Get a brand name and ICP lock from `/lp-offer` — required before any visual identity,
  handles, or product copy can be created.
- Write a PET outcome contract separate from HBAG-OUT-2026Q1-01.
- Confirm supplier cost/MOQ for the leash clip variant (fit confirmed; cost unknown).
- Shoot in-context dog lifestyle photography for the holder.
- Run a 4-week demand probe: Etsy listing (1 SKU at €80) + Instagram/TikTok dog community.
- Checkpoint gates all product line expansion and channel investment.

## Non-goals

- Naming the brand (comes from `/lp-offer`, not from this plan directly).
- Building any app or website.
- Crossover positioning with HBAG — zero overlap at launch.
- Expanding to product 2 (collar charms, travel pouches, etc.) before first 10 sales.
- Physical boutique or wholesale outreach (pre-checkpoint).
- CE marking check — not required (adult pet accessory, not a toy).

## Constraints & Assumptions

- Constraints:
  - Single operator (Pete) running in parallel with HBAG — stagger active tasks.
  - Brand name TBD until TASK-01 (`/lp-offer`) completes; gates TASK-04 styling and TASK-05 handle.
  - No existing PET brand, account, Etsy shop, or product sample with leash clip.
  - Stagger: PETS photography and Etsy launch 1–2 weeks after HBAG equivalents.
  - Supplier cost per unit (leash clip variant) is not yet confirmed.
- Assumptions:
  - Leash clip fits existing bag body without structural redesign — **confirmed by Pete 2026-02-17**.
  - €80 price point is viable (LISH London at £65 and Pagerie at $152 bracket this tier).
  - Etsy and Instagram/TikTok dog lifestyle communities are viable first-day channels.
  - No CE marking required for an adult pet leather/faux-leather accessory.
  - Urban millennial female dog owner is the primary buyer ICP — confirmed by competitor positioning evidence.

## Fact-Find Reference

- Related brief: `docs/plans/pets-dog-accessories-pmf/fact-find.md`
- Key findings used:
  - Competitor ladder: Atlas Pet Co ($35–45) and LISH London (£65) bracket the €80 entry point; Pagerie ($152) proves the luxury ceiling. White space confirmed.
  - Dog poop bag holder market: $1.12B (2024) → $2.02B by 2033 at 6.7% CAGR.
  - ICP: urban millennial female dog owner, confirmed by Lucy & Co, Pagerie, LISH positioning.
  - Etsy: 5,000+ listings; dog lifestyle Instagram: #dogmom 10M+ posts.
  - Delivery-Readiness: 25% — no brand, no product sample with leash clip, no account.
  - All four open questions resolved before planning: Q1 (fit ✓), Q2 (€80 ✓), Q3 (broad vision ✓), Q4 (online only ✓).

## Proposed Approach

- Option A: Run PETS and HBAG demand probes simultaneously on the same timeline.
  - Risk: overwhelms a single operator; cross-brand confusion if any overlap in posting.
- Option B: Stagger PETS 1–2 weeks behind HBAG; brand naming (TASK-01) first.
  - Clean separation; brand name gates visual identity before anything is published.
- **Chosen: Option B.** `/lp-offer` runs first (TASK-01) to produce brand name and ICP lock.
  Outcome contract and supplier cost run in parallel (Wave 1). Photography and social account
  follow once brand direction is set (Wave 2). 2-channel demand probe runs staggered behind
  HBAG (Wave 3). Checkpoint gates product line expansion (Wave 4+).

## Plan Gates

- Foundation Gate: **Pass**
  - Deliverable-Type: `multi-deliverable` ✓
  - Execution-Track: `business-artifact` ✓
  - Primary-Execution-Skill: `biz-product-brief` ✓
  - Startup-Deliverable-Alias: `startup-demand-test-protocol` ✓
  - Delivery-Readiness score present in fact-find (25%) ✓
  - Channel landscape documented (Etsy + Instagram/TikTok + future boutique) ✓
  - Hypothesis/validation landscape documented (H1–H4 with confidence scores) ✓
- Sequenced: **Yes**
- Edge-case review complete: **Yes**
- Auto-build eligible: **No**
  - Reason: plan-only mode; TASK-04 (photography, 65%) is the critical path bottleneck.
    TASK-01 (`/lp-offer`, 80%) is build-eligible but must execute before photography
    and social account tasks can run. Pete-dependent tasks (TASK-03 supplier cost,
    TASK-04 shoot) cannot be agent-executed.

---

## Task Summary

| Task ID  | Type        | Description                                                | Confidence | Effort | Status  | Depends on       | Blocks               |
|----------|-------------|------------------------------------------------------------|-----------|--------|---------|------------------|----------------------|
| TASK-01  | IMPLEMENT   | Run `/lp-offer` — brand name, ICP lock, positioning       | 80%       | S      | Blocked (Awaiting Pete: confirm Vellara or alternative after TM/domain/handle clearance) | —                | TASK-04, TASK-05     |
| TASK-02  | IMPLEMENT   | Write PET outcome contract                                 | 75%       | S      | Pending | —                | —                    |
| TASK-03  | INVESTIGATE | Supplier: leash clip cost per unit + MOQ + margin stack    | 72%       | S      | Pending | —                | TASK-06              |
| TASK-04  | IMPLEMENT   | Product photography — dog holder with leash clip in situ  | 65%       | M      | Pending | TASK-01          | TASK-06, TASK-07     |
| TASK-05  | IMPLEMENT   | Create PETS Instagram/TikTok account — dog lifestyle       | 75%       | S      | Pending | TASK-01          | TASK-07              |
| TASK-06  | IMPLEMENT   | Open PETS Etsy shop — dog holder at €80                   | 72%       | M      | Pending | TASK-03, TASK-04 | TASK-08              |
| TASK-07  | IMPLEMENT   | Instagram/TikTok demand probe — dog holder                 | 70%       | S      | Pending | TASK-04, TASK-05 | TASK-08              |
| TASK-08  | CHECKPOINT  | 4-week demand signal gate; reassess downstream             | 95%       | S      | Pending | TASK-06, TASK-07 | TASK-09, TASK-10     |
| TASK-09  | IMPLEMENT   | Product line expansion — SKU 2 planning                   | 55%       | M      | Pending | TASK-08          | —                    |
| TASK-10  | IMPLEMENT   | `/meta-reflect` — PET startup loop learnings              | 85%       | S      | Pending | TASK-08          | —                    |

---

## Parallelism Guide

| Wave | Tasks                        | Prerequisites                    | Notes                                                     |
|------|------------------------------|----------------------------------|-----------------------------------------------------------|
| 1    | TASK-01, TASK-02, TASK-03   | —                                | All three independent; run in parallel immediately        |
| 2    | TASK-04, TASK-05             | TASK-01                          | Brand name required before styling/handle naming          |
| 3    | TASK-06, TASK-07             | TASK-03+TASK-04; TASK-04+TASK-05 | Stagger TASK-06/07 1–2 weeks behind HBAG equivalents     |
| 4    | TASK-08                      | TASK-06 + TASK-07 (4 wks)        | Checkpoint — invoke `/lp-replan` before Wave 5            |
| 5    | TASK-09, TASK-10             | TASK-08                          | Both parallel after checkpoint clearance                  |

---

## Tasks

---

### TASK-01: Run `/lp-offer` — brand name, ICP lock, and pricing validation

- **Type:** IMPLEMENT
- **Deliverable:** Completed offer artifact from `/lp-offer`, filed at
  `docs/plans/pets-dog-accessories-pmf/offer.md` (or equivalent skill output path).
  Brand name confirmed; ICP locked; positioning tier validated (€80 entry, premium tier).
- **Execution-Skill:** lp-offer
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Artifact-Destination:** `docs/business-os/startup-baselines/PET-offer.md` (canonical);
  pointer at `docs/plans/pets-dog-accessories-pmf/offer.md`
- **Reviewer:** Pete
- **Approval-Evidence:** Pete confirms brand name and ICP statement from `/lp-offer` output.
- **Build evidence (2026-02-18):** Offer artifact written to
  `docs/business-os/startup-baselines/PET-offer.md` — all 6 sections complete (ICP, pain/promise,
  offer structure, positioning, pricing, objections). Pricing confidence MEDIUM at €80.
  30-day no-fault exchange policy identified as key competitive weapon vs Pagerie.
  ICP locked: urban millennial female dog owner, 25–40, dog-as-lifestyle extension.
  **Brand name — Deep Research complete (2026-02-18):**
  Output saved to `docs/business-os/strategy/PET/2026-02-18-naming-shortlist.user.md`.
  Recommendation: **Vellara** (invented, accessory-first fashion territory; low SERP noise;
  warm leather-goods phonetics; no pet-category anchor; scales across full product line).
  Shortlist: Vellara, Lunera, Civana, Passea, Tressa.
  **Blocker:** All TM (EUIPO/UKIPO classes 18/28/35/25/14), domain (vellara.com), and
  social handles (@vellara, @vellara.dog) were blocked during the research run —
  manual clearance required before name is confirmed. Pete to run checks and confirm.
  TASK-01 remains Blocked until name confirmed by Pete.
- **Measurement-Readiness:** None: upstream prerequisite task.
- **Affects:** `docs/plans/pets-dog-accessories-pmf/offer.md` (new)
- **Depends on:** —
- **Blocks:** TASK-04 (photography styling direction requires brand name), TASK-05
  (social account handle requires brand name)
- **Confidence:** 80%
  - Implementation: 80% — `/lp-offer` is a defined skill with a clear process. ICP and
    competitor landscape are already well-researched in the fact-find.
  - Approach: 82% — brand naming for a dog lifestyle brand has strong evidence inputs:
    ICP (Lucy & Co analogue), market tier (premium, not ultra-luxury), scope (broad
    lifestyle, not single-product). Approach is clear.
  - Impact: 80% — brand name gates TASK-04 (photography) and TASK-05 (social account).
    Cannot publish under an unnamed brand.
- **Acceptance:**
  - [ ] Brand name proposed and confirmed by Pete.
  - [ ] ICP statement locked: primary buyer (urban millennial female dog owner, 25–40,
    dog-as-lifestyle), secondary buyer (gift-giver — dog birthday, new-dog gift).
  - [ ] Positioning tier confirmed: premium (€80–€120), not ultra-luxury (Pagerie tier).
  - [ ] Brand scope confirmed: broad dog lifestyle (Lucy & Co analogue), not holder-only.
  - [ ] Offer artifact filed at `docs/plans/pets-dog-accessories-pmf/offer.md`.
- **Validation contract:**
  - VC-01: Offer completeness → pass when brand name, ICP statement, and positioning
    tier are all non-empty and confirmed by Pete within 3 days of TASK-01 start; else
    re-run `/lp-offer` with updated inputs.
- **Execution plan:**
  - Red evidence plan: no brand name exists; no offer artifact exists.
  - Green evidence plan: run `/lp-offer` with PET fact-find as input; propose name
    options; confirm with Pete.
  - Refactor evidence plan: adjust positioning language if Pete selects a different
    brand direction from options presented.
- **Planning validation:** None: creative/strategy task.
- **Scouts:** Brand name must have broad lifestyle scope — not "holder brand". Test
  against: could this name work for a dog collar charm? A travel pouch? A grooming bag?
  If not, scope is too narrow.
- **Edge Cases & Hardening:** If Pete requests a name that conflicts with an existing
  trademark, run a basic trademark search before confirming. If no Etsy shop name is
  available under the chosen brand name, propose an alternative.
- **What would make this >=90%:** Pete confirms brand name and it's available as
  Etsy shop name + Instagram handle.
- **Rollout / rollback:**
  - Rollout: Brand name used for all subsequent PETS assets (TASK-04, TASK-05, etc.).
  - Rollback: If brand name must change, update all downstream assets before publishing.
- **Documentation impact:** New file `docs/plans/pets-dog-accessories-pmf/offer.md`.

---

### TASK-02: Write PET outcome contract

- **Type:** IMPLEMENT
- **Deliverable:** Completed outcome contract block added to
  `docs/business-os/strategy/PET/plan.user.md` under `## Outcome Contracts`.
  Working name: "PET-OUT-2026Q1-01". Brand field updated from TASK-01 output.
- **Execution-Skill:** biz-update-plan
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Artifact-Destination:** `docs/business-os/strategy/PET/plan.user.md`
- **Reviewer:** Pete
- **Approval-Evidence:** Pete reviews plan.user.md after write; confirms via chat.
- **Measurement-Readiness:** Weekly Etsy views/sales + Instagram DM inquiries —
  owner Pete, cadence weekly, tracked in `docs/plans/pets-dog-accessories-pmf/demand-log.md`.
- **Affects:** `docs/business-os/strategy/PET/plan.user.md` (new or existing)
- **Depends on:** —
- **Blocks:** —
- **Confidence:** 75%
  - Implementation: 75% — writing task; outcome contract schema is defined; price (€80)
    and business unit (PET) are confirmed. Brand name field will be "TBD — updates from
    TASK-01" until TASK-01 completes.
  - Approach: 82% — contract schema mirrors HBAG-OUT-2026Q1-01; template exists.
  - Impact: 80% — required before `/idea-generate` or `/idea-readiness` can run for PET.
- **Acceptance:**
  - [ ] `Outcome-ID`: `PET-OUT-2026Q1-02` (note: `PET-OUT-2026Q1-01` is an existing
    contract for the broader Italian online shop scope — this is a separate dog accessories
    demand test contract).
  - [ ] `Outcome`: first paid demand signal for the dog holder — 10 sales or €800 revenue
    (10 × €80) across active channels, validating premium €80 positioning.
  - [ ] `Baseline`: Dog holder Revenue €0, Sales 0. Date 2026-02-17.
  - [ ] `Target`: 10 paid sales OR €800 cumulative revenue — whichever first.
  - [ ] `By`: 2026-05-17 (90 days from plan creation).
  - [ ] `Owner`: Pete.
  - [ ] `Leading-Indicator-1`: Weekly Etsy listing views + add-to-cart count.
  - [ ] `Leading-Indicator-2`: Weekly Instagram DM purchase inquiries.
  - [ ] `Decision-Link`: `DEC-PET-02` — if 0 sales by 2026-04-17 (60-day gate),
    pause channel spend, run `/lp-replan` on pricing and variant before continuing.
  - [ ] `Stop/Pivot Threshold`: 0 sales across all active channels after 60 days →
    halt, replan. Fewer than 3 Etsy views/day after 14 days → investigate tags/title.
- **Validation contract:**
  - VC-01: Contract completeness → pass when all 9 required fields are non-empty and
    `DEC-PET-01` references a concrete decision rule; within 1 day of TASK-02 start;
    over 1 document review by Pete.
- **Execution plan:**
  - Red evidence plan: no PET outcome contract exists; `docs/business-os/strategy/PET/`
    directory may not exist — create if needed.
  - Green evidence plan: write contract block using HBAG contract as structural template;
    adapt all fields for PET (€80 price, dog holder, separate demand-log).
  - Refactor evidence plan: Pete reviews and confirms all 9 fields are decision-useful.
- **Planning validation:** None: short writing task.
- **Scouts:** Check whether `docs/business-os/strategy/PET/` directory exists before
  writing. Create `plan.user.md` if not present.
- **Edge Cases & Hardening:** If Pete changes revenue target after reviewing, update
  `DEC-PET-01` rule accordingly. Note that €80 fixed price makes revenue target
  cleaner to express than HBAG's range (€80–€150).
- **What would make this >=90%:** Pete reviewed and confirmed; brand name from TASK-01
  backfilled into contract.
- **Rollout / rollback:**
  - Rollout: Write to `plan.user.md`; update after TASK-01 with brand name.
  - Rollback: Revert the added section; no downstream breakage.
- **Documentation impact:** `docs/business-os/strategy/PET/plan.user.md` created
  or updated with `## Outcome Contracts` section.

---

### TASK-03: Investigate supplier — leash clip cost per unit, MOQ, margin stack

- **Type:** INVESTIGATE
- **Deliverable:** Margin stack summary filed as
  `docs/plans/pets-dog-accessories-pmf/supply-chain-investigation.md`
- **Execution-Skill:** lp-build
- **Execution-Track:** business-artifact
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/pets-dog-accessories-pmf/supply-chain-investigation.md` (new)
- **Depends on:** —
- **Blocks:** TASK-06 (need price floor before setting Etsy price)
- **Confidence:** 72%
  - Implementation: 72% — requires Pete to email supplier; agent cannot do this directly.
    Leash clip fit is confirmed (Pete); cost/unit is not.
  - Approach: 80% — margin stack formula is clear: unit cost + leash clip hardware +
    packaging + shipping + customs + Etsy ~9.5% take-rate.
  - Impact: 78% — directly confirms whether €80 yields ≥35% contribution margin.
    If margin is <35%, Etsy price must be raised or costs reduced before listing.
- **Questions to answer:**
  - What is the additional cost per unit for leash clip hardware vs standard chain?
  - What is the unit cost of the mini bag body + leash clip variant (€ per unit)?
  - What is the MOQ for the leash clip variant?
  - What is the China→EU shipping cost per unit at MOQ?
  - Applicable customs/import duties (China→Italy)?
  - Estimated contribution margin at €80 retail after all costs?
  - Breakeven unit volume at €80 retail?
- **Acceptance:**
  - [ ] Leash clip hardware additional cost confirmed (€ per unit).
  - [ ] Unit cost confirmed for combined bag + leash clip (€ per unit).
  - [ ] MOQ confirmed for leash clip variant.
  - [ ] Shipping cost per unit estimated (±20%).
  - [ ] Contribution margin calculated at €80 retail: must be ≥35% after all costs.
  - [ ] If margin <35% at €80: flag to Pete and recommend repricing before TASK-06.
- **Validation contract:**
  - VC-01: Margin adequacy → pass when contribution margin ≥35% at €80 retail within
    5 days of TASK-03 start over 1 supplier quote; else Pete decides: reprice to €95–€100
    or explore cost reduction before Etsy listing.
- **Planning validation:** None: investigation task.
- **Rollout / rollback:** None: non-implementation task.
- **Documentation impact:** New file `docs/plans/pets-dog-accessories-pmf/supply-chain-investigation.md`.
- **What would make this >=80%:** Supplier quote in hand. Currently blocked on Pete
  emailing supplier.

---

### TASK-04: Product photography — dog holder with leash clip in dog lifestyle context

- **Type:** IMPLEMENT
- **Deliverable:** ≥5 usable in-context photos of the dog holder, saved to
  `docs/plans/pets-dog-accessories-pmf/photography/` (or local media path).
  Photography brief: `docs/plans/pets-dog-accessories-pmf/task-04-photography-brief.md`
- **Execution-Skill:** lp-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Artifact-Destination:** Photos for use in Etsy listing (TASK-06) and
  Instagram/TikTok probe (TASK-07).
- **Reviewer:** Pete
- **Approval-Evidence:** Pete selects final shots before TASK-06/TASK-07 proceed.
- **Measurement-Readiness:** Etsy lead photo conversion tracked via Etsy analytics
  (views/click-through); Instagram post engagement tracked per post.
- **Affects:** `docs/plans/pets-dog-accessories-pmf/photography/` (new directory)
- **Depends on:** TASK-01 (brand name and styling direction required before shoot)
- **Blocks:** TASK-06 (Etsy listing needs photos), TASK-07 (social probe needs photos)
- **Confidence:** 65%
  - Implementation: 65% — photography quality and dog lifestyle context are unknown
    until done; product reading as premium in photos with a dog is unverified.
    This is the plan's biggest risk.
  - Approach: 75% — shot types defined in photography brief: on-leash clip in use,
    flat lay, close-up hardware detail, dog lifestyle context.
  - Impact: 80% — photos gate both demand test channels.
- **Acceptance:**
  - [ ] ≥1 "hero" shot: holder clipped to a dog lead or harness, in use.
  - [ ] ≥1 flat lay: holder on white card / linen / dark wood, slight angle.
  - [ ] ≥1 detail shot: close-up of leash clip and clasp hardware quality.
  - [ ] ≥1 lifestyle shot: holder in context — dog walk setting, outdoors.
  - [ ] ≥1 scale reference: holder next to a recognisable item (hand, sunglasses, key).
  - [ ] Perception test: show unbranded lead photo to 5 people cold; ≥3 out of 5 must
    spontaneously estimate value ≥€60 without prompting (lower than HBAG because
    dog accessory category has a different reference frame).
  - [ ] Photos in focus, well-lit, usable for Etsy (2000×2000px minimum).
- **Validation contract:**
  - VC-01: Photo quality perception → pass when ≥3 out of 5 cold reviewers estimate
    value ≥€60 for lead photo within 3 days of shoot; else reshoot or adjust
    positioning before proceeding.
  - VC-02: Coverage completeness → pass when ≥5 total photos are available and
    approved by Pete within 5 days of TASK-01 completion.
- **Execution plan:**
  - Red evidence plan: confirm 0 usable leash clip dog holder photos exist currently.
  - Green evidence plan: shoot with leash clip installed on holder, on a real dog
    lead; run perception test on hero shot.
  - Refactor evidence plan: Pete selects final shots; discard weak takes.
- **Planning validation:** None: physical task.
- **Scouts:** If no dog is available, use leash and clip setup without dog in frame —
  the clip and lead in context is sufficient for fashion signal. Avoid stock photography.
- **Edge Cases & Hardening:** If perception test fails (<3/5 estimate ≥€60),
  do not proceed to Etsy/social — reshoot with better light, background, or
  closer-in composition before TASK-06/07.
- **What would make this >=80%:** Perception test passes (≥3/5 estimate ≥€60).
  Currently at 65% because this is unverified pre-shoot.
- **Rollout / rollback:**
  - Rollout: Photos uploaded to Etsy/social as needed.
  - Rollback: Do not publish; reshoot.
- **Documentation impact:** Photography brief at
  `docs/plans/pets-dog-accessories-pmf/task-04-photography-brief.md` (to be written
  alongside plan; see Notes).
- **Notes / references:**
  - Photography brief to be saved as
    `docs/plans/pets-dog-accessories-pmf/task-04-photography-brief.md` following same
    format as HBAG TASK-06 brief at `docs/plans/mini-handbag-pmf/task-06-photography-brief.md`.

---

### TASK-05: Create PETS Instagram/TikTok account — dog lifestyle brand handle

- **Type:** IMPLEMENT
- **Deliverable:** Active Instagram account + TikTok account under the PETS brand name
  (from TASK-01). Bio, profile image (placeholder), and first pinned post configured.
- **Execution-Skill:** lp-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Artifact-Destination:** Instagram account + TikTok account (new, PETS brand).
- **Reviewer:** Pete
- **Approval-Evidence:** Pete confirms accounts created and handle matches brand name.
- **Measurement-Readiness:** Account handle and URL logged in demand-log.md;
  follower count and DM inbox tracked weekly.
- **Affects:** `docs/plans/pets-dog-accessories-pmf/demand-log.md` (account details section)
- **Depends on:** TASK-01 (brand name required for handle selection)
- **Blocks:** TASK-07 (social probe cannot launch without account)
- **Confidence:** 75%
  - Implementation: 80% — creating an account is straightforward.
  - Approach: 82% — separate handle from all HBAG accounts enforces zero brand blur.
  - Impact: 75% — organic reach from a brand-new account with 0 followers is uncertain;
    dog lifestyle community is documented as high-engagement, but cold-start is a real risk.
- **Acceptance:**
  - [ ] Instagram account created under PETS brand name.
  - [ ] TikTok account created under same PETS brand name (or closest available handle).
  - [ ] Bio written: dog lifestyle focus, no HBAG mention, no Brikette mention.
  - [ ] Profile image set (placeholder OK until brand identity from TASK-01 is complete).
  - [ ] Handle confirmed not to conflict with HBAG, Brikette, or any other brand stream.
  - [ ] Account details (handles, URLs) recorded in `demand-log.md`.
- **Validation contract:**
  - VC-01: Account readiness → pass when both accounts are created, bio is non-empty,
    and handle is confirmed brand-safe within 2 days of TASK-01 completion; else create
    with closest available handle and note deviation.
- **Execution plan:**
  - Red evidence plan: no PETS social accounts exist.
  - Green evidence plan: create both accounts; write bio copy from `/lp-offer` ICP output.
  - Refactor evidence plan: Pete reviews bio and handle; adjust if brand feel is off.
- **Planning validation:** None: account setup task.
- **Scouts:** Check handle availability on Instagram AND TikTok before confirming brand name
  in TASK-01 — prevents handle collision forcing a brand name change after it's chosen.
- **Edge Cases & Hardening:** If preferred handle is taken on one platform, use a
  consistent suffix (e.g., ".brand" or "_official") rather than a different name.
  Do not create under Pete's personal account — brand-separate from day one.
- **What would make this >=90%:** Account created with matching handle on both platforms
  and first post live with ≥10 follows in first 48h.
- **Rollout / rollback:**
  - Rollout: Account active; bio visible; ready for content.
  - Rollback: Delete account if brand name changes entirely post-TASK-01.
- **Documentation impact:** `demand-log.md` account section populated.

---

### TASK-06: Open PETS Etsy shop — dog holder at €80

- **Type:** IMPLEMENT
- **Deliverable:** PETS Etsy shop open with ≥1 active listing (dog holder at €80);
  shop branding, bio, and policies complete. Completely separate from any HBAG Etsy shop.
- **Execution-Skill:** biz-product-brief
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** startup-demand-test-protocol
- **Effort:** M
- **Status:** Pending
- **Artifact-Destination:** Etsy shop (new, PETS brand — not HBAG).
- **Reviewer:** Pete
- **Approval-Evidence:** Pete reviews listing before activating.
- **Measurement-Readiness:** Etsy Shop Manager analytics (views, favourites, add-to-cart,
  orders); reviewed weekly; logged in `docs/plans/pets-dog-accessories-pmf/demand-log.md`.
- **Affects:** `docs/plans/pets-dog-accessories-pmf/demand-log.md`
- **Depends on:** TASK-03 (margin data confirms €80 price floor), TASK-04 (photos required)
- **Blocks:** TASK-08 (checkpoint needs 4 weeks of Etsy signal)
- **Confidence:** 72%
  - Implementation: 75% — Etsy shop setup is straightforward.
  - Approach: 80% — Etsy is a proven channel for artisan dog accessories; 5,000+ listings
    confirm active buyer intent. Premium craft sellers (Atlas $45, leather holders up to £65)
    confirm the channel accepts the price tier.
  - Impact: 72% — conversion at €80 is uncertain; €80 is the top of the Etsy artisan
    dog accessory band. Comparable LISH London leather holders (£65) sell via Etsy-adjacent
    channels, not directly on Etsy — this is a genuine risk.
- **Acceptance:**
  - [ ] PETS Etsy shop created with brand name from TASK-01, banner, and shop policies
    (shipping, returns, processing time).
  - [ ] Dog holder listing: ≥5 photos, title includes "dog poop bag holder" + key
    search terms, price set at €80, ≥150-word description.
  - [ ] Description includes: material, dimensions (bag size), leash clip attachment
    method, care instructions.
  - [ ] Shipping: Italy-origin shipping rates set for EU and international.
  - [ ] Listing active (not draft) and discoverable.
  - [ ] Shop has NO reference to HBAG, handbag accessories, or Brikette.
- **Validation contract:**
  - VC-01: Etsy conversion signal → pass when ≥3 sales within 28 days of listing going
    live; else flag at checkpoint as "Etsy signal weak" and run `/lp-replan` on pricing
    or channel strategy.
  - VC-02: Etsy engagement signal → pass when ≥30 unique listing views + ≥3 favourites
    within 14 days; else consider Etsy Ads (€15–30 budget) before concluding demand
    is absent. (Note: lower bar than HBAG because dog holder is a narrower search category.)
- **Execution plan:**
  - Red evidence plan: no PETS Etsy shop exists; 0 listings active.
  - Green evidence plan: create shop under PETS brand name; publish 1 listing; activate;
    verify Etsy search indexing within 48h.
  - Refactor evidence plan: adjust title/tags based on Etsy search ranking after 1 week
    if views <10 per listing.
- **Planning validation:** None: e-commerce setup task.
- **Scouts:** Etsy take-rate ~9.5% (6.5% transaction fee + €0.20 listing + ~3% payment
  processing). Confirm this is built into margin stack from TASK-03 before setting €80
  as the list price.
- **Edge Cases & Hardening:** If €80 has zero comparable sold listings in "dog poop bag
  holder" on Etsy, note at TASK-08 checkpoint — premium price anchor may need re-testing.
  Do not add a "lower anchor" variant pre-checkpoint; signal should be clean.
- **What would make this >=80%:** TASK-03 confirms ≥35% margin at €80 + TASK-04
  delivers perception-test-passing photos.
- **Rollout / rollback:**
  - Rollout: Activate listing; monitor weekly.
  - Rollback: Deactivate listing; no inventory commitment (on-demand or small batch model).
- **Documentation impact:** `demand-log.md` updated weekly with Etsy stats.

---

### TASK-07: Instagram/TikTok demand probe — dog holder, dog lifestyle content

- **Type:** IMPLEMENT
- **Deliverable:** 2-week dog lifestyle content probe: ≥4 posts across Instagram + TikTok
  using holder photos; "DM to buy" + Etsy link CTA; inquiry log maintained. Content angle:
  dog lifestyle / "dog mum" culture — not product-feature-first.
- **Execution-Skill:** draft-marketing
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** startup-demand-test-protocol
- **Effort:** S
- **Status:** Pending
- **Artifact-Destination:** Instagram + TikTok accounts (from TASK-05).
- **Reviewer:** Pete
- **Approval-Evidence:** Pete reviews post drafts before publishing.
- **Measurement-Readiness:** DM inquiries and post engagement logged in
  `docs/plans/pets-dog-accessories-pmf/demand-log.md`; updated within 24h of each inquiry.
- **Affects:** `docs/plans/pets-dog-accessories-pmf/demand-log.md`
- **Depends on:** TASK-04 (photos required), TASK-05 (account required)
- **Blocks:** TASK-08 (checkpoint needs demand signal data)
- **Confidence:** 70%
  - Implementation: 72% — posting to social is known; account is brand-new (0 followers)
    which is the key risk. Dog lifestyle community engagement is high (#dogmom 10M+), but
    cold-start organic reach is low.
  - Approach: 75% — "DM to buy" probe is the standard artisan demand test; dog lifestyle
    content angle (not product-feature) is the right hook for this ICP.
  - Impact: 70% — DM inquiry rate from a new account is uncertain; reach may be insufficient
    to draw conclusions without some ad spend.
- **Acceptance:**
  - [ ] ≥4 posts published across Instagram + TikTok within 7 days of TASK-04 completion.
  - [ ] Content angle: dog lifestyle first (dog walk aesthetic, "walking in style"),
    product second (the holder is the accessory that completes the walk).
  - [ ] Each post includes "DM to buy" + Etsy link in bio CTA.
  - [ ] Hashtags include at minimum: #dogmom, #dogaccessories, #doglead, plus brand-specific.
  - [ ] All DM inquiries logged in `demand-log.md` within 24h; distinguish genuine
    purchase intent from "where did you get this?" curiosity.
  - [ ] 2-week probe period runs to completion before TASK-08.
- **Validation contract:**
  - VC-01: Social demand signal → pass when ≥3 genuine purchase inquiries (asking about
    price/buy link, not just engagement) received within 14 days of first post; else
    flag at checkpoint as "weak social signal" and assess whether ad spend or influencer
    seeding is needed before concluding demand is absent.
  - VC-02: Reach adequacy → pass when cumulative impressions ≥1,000 across all posts
    within 14 days; else note that signal is inconclusive (insufficient reach) and
    recommend Reels/TikTok boosting at TASK-08 checkpoint.
- **Execution plan:**
  - Red evidence plan: 0 posts, 0 DM inquiries, 0 account followers.
  - Green evidence plan: post ≥4 times; log all DMs; track inquiry count and intent rate.
  - Refactor evidence plan: if VC-01 fails, analyse which posts drove most engagement
    and refine hook/caption before TASK-08 checkpoint.
- **Planning validation:** None: social posting task.
- **Scouts:** Do not post to HBAG or Brikette accounts. Zero crossover at launch.
  Dog lifestyle content should feature dogs, dog walks, outdoor settings — not handbag
  styling or Italian coastal imagery (that is HBAG territory).
- **Edge Cases & Hardening:** If TikTok account doesn't gain traction in 7 days,
  double down on Instagram Reels which has stronger dog community engagement signals.
  Note at TASK-08 which platform drove most inquiry.
- **What would make this >=80%:** Account has ≥100 followers OR Pete has dog-owner
  friends/community to seed initial engagement organically.
- **Rollout / rollback:**
  - Rollout: Posts published; log inquiries.
  - Rollback: Delete posts; no financial commitment.
- **Documentation impact:** `docs/plans/pets-dog-accessories-pmf/demand-log.md` created
  (separate from HBAG demand-log).

---

### TASK-08: CHECKPOINT — 4-week demand signal gate; reassess downstream plan

- **Type:** CHECKPOINT
- **Deliverable:** Updated plan evidence via `/lp-replan`; downstream tasks re-scored
  from actual demand data (Etsy + Instagram/TikTok combined signal).
- **Execution-Skill:** lp-build
- **Execution-Track:** business-artifact
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/pets-dog-accessories-pmf/plan.md`
- **Depends on:** TASK-06 (4-week Etsy probe complete), TASK-07 (2-week social probe complete)
- **Blocks:** TASK-09, TASK-10
- **Confidence:** 95%
  - Implementation: 95% — process is defined; invoke `/lp-replan`.
  - Approach: 95% — prevents deep dead-end execution.
  - Impact: 95% — controls all downstream risk; TASK-09 and TASK-10 confidence cannot
    be meaningfully set without this data.
- **Acceptance:**
  - [ ] Demand signal data collated from `demand-log.md`: Etsy views/favs/sales,
    Instagram DM inquiries, intent confirmations.
  - [ ] VC pass/fail status recorded for TASK-06 (VC-01, VC-02) and TASK-07 (VC-01, VC-02).
  - [ ] `/lp-replan` invoked on TASK-09 and TASK-10.
  - [ ] TASK-09 (product line expansion) re-scored with updated confidence based on
    demand signal strength.
  - [ ] Decision for product line direction: which SKU 2 to develop, or whether to
    deepen channel investment before expanding — recorded in Decision Log.
  - [ ] Cross-comparison vs HBAG checkpoint data: note any meaningful signal differences.
- **Horizon assumptions to validate:**
  - Premium dog holder at €80 finds buyers at that price point on Etsy.
  - Dog lifestyle Instagram/TikTok content drives DM purchase intent.
  - PETS and HBAG channels remain separate (no buyer confusion reported).
  - Supplier leash clip variant is deliverable at acceptable margin from TASK-03.
- **Validation contract:** Checkpoint complete when all five acceptance criteria are met
  and `/lp-replan` output is filed in `docs/plans/pets-dog-accessories-pmf/plan.md`.
- **Planning validation:** None: planning control task.
- **Rollout / rollback:** None: planning control task.
- **Documentation impact:** Plan updated via `/lp-replan`; Decision Log updated.

---

### TASK-09: Product line expansion — plan SKU 2 from demand signal evidence

- **Type:** IMPLEMENT
- **Deliverable:** Product brief for SKU 2 (to be determined at checkpoint from signal
  evidence). Candidate SKUs: dog lead charm, collar accessory, travel/grooming pouch.
  Filed as `docs/plans/pets-dog-accessories-pmf/sku2-brief.md`.
- **Execution-Skill:** biz-product-brief
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Artifact-Destination:** `docs/plans/pets-dog-accessories-pmf/sku2-brief.md`
- **Reviewer:** Pete
- **Approval-Evidence:** Pete confirms SKU 2 selection from brief.
- **Measurement-Readiness:** None: planning task; metrics apply to subsequent demand test.
- **Affects:** `docs/plans/pets-dog-accessories-pmf/sku2-brief.md` (new)
- **Depends on:** TASK-08 (CHECKPOINT — SKU 2 selection requires demand signal evidence)
- **Blocks:** —
- **Confidence:** 55%
  - Implementation: 55% — cannot identify the right SKU 2 without checkpoint demand data.
    Multiple candidate products exist (lead charm, collar accessory, grooming pouch) but
    which one follows the holder depends entirely on what buyers ask for.
  - Approach: 60% — product brief format is defined; but product selection is the blocker.
  - Impact: 65% — correct SKU 2 selection is high-impact; wrong selection wastes bandwidth.
- **Acceptance:**
  - [ ] SKU 2 selected from checkpoint demand evidence (buyer inquiries, search patterns).
  - [ ] Product brief covers: ICP fit, price point, supplier feasibility, demand evidence.
  - [ ] Brief confirms SKU 2 fits the broad dog lifestyle brand scope from TASK-01.
  - [ ] Brief filed at `docs/plans/pets-dog-accessories-pmf/sku2-brief.md`.
- **Validation contract:**
  - VC-01: SKU selection justified → pass when chosen SKU 2 has ≥2 evidence data points
    from checkpoint (buyer requests, search volume, or competitive gap) within 5 days
    of TASK-08 completion; else defer SKU 2 and deepen SKU 1 channel investment.
- **Execution plan:**
  - Red evidence plan: no SKU 2 evidence; checkpoint data required first.
  - Green evidence plan: review checkpoint demand data; identify highest-signal follow-on
    product; write brief.
  - Refactor evidence plan: Pete reviews; validates supplier feasibility before committing.
- **Planning validation:** None: post-checkpoint task; insufficient data pre-plan.
- **Rollout / rollback:**
  - Rollout: Brief filed; SKU 2 development kicks off if Pete approves.
  - Rollback: Defer brief; continue with SKU 1 investment only.
- **Documentation impact:** New file `docs/plans/pets-dog-accessories-pmf/sku2-brief.md`.
- **What would make this >=80%:** Checkpoint shows ≥3 buyer inquiries specifically
  asking for a related product (e.g., "do you do a collar to match?").

---

### TASK-10: `/meta-reflect` — capture PET startup loop learnings

- **Type:** IMPLEMENT
- **Deliverable:** Targeted improvements filed to startup loop skills/docs via
  `/meta-reflect`; specifically: what the PETS plan revealed about running two parallel
  demand tests from the same physical product body, and about dog accessories as a market.
- **Execution-Skill:** meta-reflect
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Artifact-Destination:** Updated skill files in `.claude/skills/` and/or
  `docs/plans/_templates/`.
- **Reviewer:** Pete
- **Approval-Evidence:** Pete confirms meta-reflect output is useful.
- **Measurement-Readiness:** None: methodology improvement task.
- **Affects:** `.claude/skills/lp-fact-find/`, `.claude/skills/lp-plan/`,
  `docs/plans/_templates/`
- **Depends on:** TASK-08 (CHECKPOINT — needs real PMF experience to reflect on)
- **Blocks:** —
- **Confidence:** 85%
  - Implementation: 88% — `/meta-reflect` skill is available and well-defined.
  - Approach: 88% — specific learnings targets are identified: parallel brand management,
    single-supplier-multi-product approach, dog lifestyle market specifics.
  - Impact: 85% — improves startup loop for all future physical product businesses.
- **Acceptance:**
  - [ ] `/meta-reflect` invoked with evidence from this plan execution.
  - [ ] ≥2 concrete loop improvements filed (skill/template updates, not just notes):
    1. Parallel demand test protocol (operating two brands from one supplier simultaneously).
    2. Dog/pet accessories market-specific channel guidance for startup loop.
  - [ ] Cross-reference with HBAG TASK-11 reflect output — avoid duplicating what HBAG
    already captured; add only PET-specific or parallel-brand-specific learnings.
  - [ ] Updates filed to real skill or template files (not just noted).
- **Validation contract:**
  - VC-01: Loop improvement quality → pass when ≥2 concrete file edits are made to
    skill or template files (not just noted in the plan) within 3 days of TASK-08
    completion; else extend reflect window.
- **Execution plan:**
  - Red evidence plan: no PET-specific loop updates exist; HBAG TASK-11 may not yet
    be complete — coordinate to avoid overlap.
  - Green evidence plan: run `/meta-reflect`; file targeted updates.
  - Refactor evidence plan: Pete reviews; remove anything premature or over-engineered.
- **Planning validation:** None: methodology task.
- **Scouts:** None.
- **Edge Cases & Hardening:** If HBAG TASK-11 is completed first, build on its output
  rather than duplicating it.
- **What would make this >=90%:** Checkpoint provides rich data with clear patterns
  that translate directly into reusable loop templates.
- **Rollout / rollback:**
  - Rollout: Skill/template updates committed.
  - Rollback: Revert commits if updates are wrong.
- **Documentation impact:** `.claude/skills/` and/or `docs/plans/_templates/` updated.

---

## Risks & Mitigations

- **Dog holder doesn't read as premium in photos** (High): TASK-04 VC-01 (perception test
  ≥3/5 estimate ≥€60) gates this. If <3/5, reshoot before listing.
- **€80 price rejected by Etsy dog accessory buyers** (High): Etsy artisan dog accessories
  confirm €25–60 as the typical premium ceiling. €80 is at the top of this band.
  TASK-06 VC-01 (3 sales in 28 days) catches this. If VC fails, run `/lp-replan` on
  pricing before TASK-09. Mitigation: LISH £65 confirms the buyer exists, but not
  specifically on Etsy.
- **New social account — cold-start reach too low to measure demand** (High): TASK-07
  VC-02 (1,000 impressions in 14 days) flags this. Mitigation:
  Reels/TikTok content format naturally outreaches. If <1,000 impressions, data is
  inconclusive — don't conclude demand is absent.
- **Brand/channel bleed between HBAG and PETS** (Medium): Enforced by strict channel
  separation (separate handle, separate Etsy shop, separate demand-log). Confirm in
  TASK-05 acceptance that no crossover mentions appear.
- **Single operator bandwidth** (High): Stagger PETS photography (TASK-04) and Etsy
  (TASK-06) 1–2 weeks behind HBAG equivalents. Never run both active demand probes
  simultaneously in the same week.
- **Supplier can't deliver leash clip variant at acceptable margin** (Medium): TASK-03
  VC-01 catches this. If margin <35% at €80, reprice to €95–100 or explore cost reduction
  before listing.

## Observability

- Logging: `docs/plans/pets-dog-accessories-pmf/demand-log.md` — weekly entries for
  Etsy stats, Instagram/TikTok DM count, impressions. Separate file from HBAG demand-log.
- Metrics: Weekly — Etsy views/favs/sales; Instagram DMs; TikTok impressions.
- Alerts: If 0 Etsy views in first 7 days, investigate indexing/tags immediately.
  If TASK-07 impressions <200 in first 48h, switch to Reels-first format.

## Acceptance Criteria (overall)

- [ ] TASK-01 complete: brand name confirmed and offer artifact filed.
- [ ] TASK-02 complete: PET outcome contract written (PET-OUT-2026Q1-01) and confirmed by Pete.
- [ ] TASK-04 complete: ≥5 photos produced; perception test passes.
- [ ] TASK-05 complete: Instagram and TikTok accounts created, handles confirmed.
- [ ] TASK-06 + TASK-07 running: both channels active and logging data.
- [ ] TASK-08 complete: checkpoint run; downstream tasks re-scored.
- [ ] TASK-10 complete: ≥2 PET-specific startup loop improvements filed.

## Decision Log

- 2026-02-17: Scope decision: PETS is a separate business from HBAG. Zero crossover
  at launch. Separate brand, ICP, channels, Etsy shop, social accounts.
- 2026-02-17: **Target price DECIDED — €80.** Confirmed by Pete. Positions alongside
  LISH London (£65), below Pagerie ($152). Clean premium anchor.
- 2026-02-17: **Product line scope DECIDED — broad dog lifestyle.** Confirmed by Pete.
  Holder is SKU 1 only. Brand name must reflect broad scope (Lucy & Co analogue,
  not "the holder brand"). SKU 2 selected post-checkpoint from demand evidence.
- 2026-02-17: **Leash clip fit CONFIRMED.** Pete confirmed clip fits existing bag body;
  no product redesign needed. H2 (supplier cost) remains open (TASK-03).
- 2026-02-17: **Distribution — online only at launch.** Default applied; Pete did not
  override. Brikette in-destination channel deferred; no brand blur at launch.

## Overall-confidence Calculation

| Task     | Type        | Confidence | Effort (S=1,M=2) | Weighted |
|----------|-------------|-----------|------------------|----------|
| TASK-01  | IMPLEMENT   | 80%       | 1                | 80       |
| TASK-02  | IMPLEMENT   | 75%       | 1                | 75       |
| TASK-03  | INVESTIGATE | 72%       | 1                | 72       |
| TASK-04  | IMPLEMENT   | 65%       | 2                | 130      |
| TASK-05  | IMPLEMENT   | 75%       | 1                | 75       |
| TASK-06  | IMPLEMENT   | 72%       | 2                | 144      |
| TASK-07  | IMPLEMENT   | 70%       | 1                | 70       |
| TASK-08  | CHECKPOINT  | 95%       | 1                | 95       |
| TASK-09  | IMPLEMENT   | 55%       | 2                | 110      |
| TASK-10  | IMPLEMENT   | 85%       | 1                | 85       |
| **Total** |            |           | **13**           | **936**  |

**Overall-confidence: 936 / 13 = 72%**

Primary confidence drag: TASK-04 (photography perception unknown, 65%) and TASK-09
(product line expansion pre-checkpoint, 55%). Both resolve at checkpoint.
TASK-01 (`/lp-offer`, 80%) is the first build-eligible task and the correct starting point.
